from .models import CalendarEvent, CalendarEventNotification, CATEGORY_CHOICES
from .serializers import CalendarEventReadSerializer, CalendarEventWriteSerializer
from django.contrib.auth.decorators import login_required
from django.contrib.auth.models import User
from django.db import transaction
from django.db.models import Q
from django.shortcuts import render
from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.exceptions import ValidationError
from rest_framework.response import Response
from requests.exceptions import HTTPError
from tasks.models import ToDo, Application
from users.models import UserProfile
from datetime import datetime
from cap_portal.notifications import push_to_users, schedule_event_reminder, delete_event_reminder
import logging

logger = logging.getLogger(__name__)

# Create your views here.
def unpack_participants(submitted_participants):
    unpacked_participants = set()

    grad_year_11 = int(datetime.now().year) + 2 if datetime.now().month >= 8 else int(datetime.now().year) + 1
    mentees_11 = User.objects.filter(profile__role='mentee', profile__graduation_year=grad_year_11)
    mentors_11 = User.objects.filter(mentees__user__in=mentees_11)
    grad_year_12 = int(datetime.now().year) + 1 if datetime.now().month >= 8 else int(datetime.now().year)
    mentees_12 = User.objects.filter(profile__role='mentee', profile__graduation_year=grad_year_12)
    mentors_12 = User.objects.filter(mentees__user__in=mentees_12)

    for participant in submitted_participants:
        if participant == -1:
            unpacked_participants.update(User.objects.all())
        elif participant == -2:
            unpacked_participants.update(mentees_11)
        elif participant == -4:
            unpacked_participants.update(mentees_12)
        elif participant == -3:
            unpacked_participants.update(mentors_11)
        elif participant == -5:
            unpacked_participants.update(mentors_12)
        else:
            try:
                unpacked_participants.add(User.objects.get(pk=int(participant)))
            except (ValueError, User.DoesNotExist):
                continue
    
    return unpacked_participants


class CalendarEventViewSet(viewsets.ModelViewSet):
    permission_classes = [permissions.IsAuthenticated]

    def get_serializer_class(self):
        if self.action in ('list', 'retrieve'):
            return CalendarEventReadSerializer
        return CalendarEventWriteSerializer

    def get_queryset(self):
        user = self.request.user
        return CalendarEvent.objects.filter(Q(participants=user)).distinct()

    @action(detail=False, methods=["get"], url_path="calendar-data")
    def calendar_data(self, request):
        user = request.user
        todos = ToDo.objects.filter(user=user, completed=False).values()
        events = CalendarEvent.objects.filter(
            Q(participants=user)
        ).prefetch_related('participants').exclude(start__isnull=True)

        calendar_items = [
            *[
                {
                    "id": "todo-"+str(t["id"]), 
                    "name": t["name"], 
                    "start": t["due_date"],
                    "calendarId": "todo", 
                    "category": "milestone",
                    "isAllday": True,
                    "isReadOnly": True,
                    "application": Application.objects.get(id=t["application_id"]).name,
                }
                for t in todos if t["due_date"]
            ],
            *[
                {
                    "id": "event-"+str(e.id),
                    "name": e.name, 
                    "start": e.start,
                    "end": e.end,
                    "calendarId": e.category,
                    "category": "time" if not e.isAllDay else "allday",
                    "participants": [
                        {'id': str(u.id), 'full_name': f'{u.first_name} {u.last_name}'}
                        for u in e.participants.all()
                    ],
                    "creator": f'{e.creator.first_name} {e.creator.last_name}',
                    "isAllday": e.isAllDay,
                    "isReadOnly": True if e.creator.id != user.id else False,
                    "description": e.description
                }
                for e in events
            ],
        ]

        return Response(calendar_items)

    @transaction.atomic
    def create(self, request, *args, **kwargs):
        # Intercept the create functionality as we added some custom lists that we need to expand into participants

        # Get the participants list submitted
        submitted_participants = request.data.get('participants', [])
        data = request.data.copy()
        data.pop('participants', None)

        # Validate and save the other fields
        serializer = self.get_serializer(data=data)
        try:
            serializer.is_valid(raise_exception=True)
        except ValidationError:
            print(serializer.errors)
            raise

        # Save the event for all fields except participants
        event = serializer.save(creator=request.user)

        # Parse through participants
        unpacked_participants = unpack_participants(submitted_participants=submitted_participants)
        
        # Add the creator to the participants if not already there
        final_participants = set(unpacked_participants)
        final_participants.add(self.request.user)

        event.participants.set(final_participants)

        # Push notification logic
        recipient_ids = [str(user.id) for user in final_participants if user.id != request.user.id]

        try:
            push_to_users(
                user_ids=recipient_ids, 
                title=f"New event: {event.name}", 
                body=event.start.strftime("%B %d at %I:%M %p"),
                url="https://apex-cap.onrender.com/calendar/"
            )
        except HTTPError as err:
            logger.warning("OneSignal push failed for calendar event create: %s", err)

        # Reminder notification for 15 min before event
        reminder_notif_id = schedule_event_reminder(
            event=event, 
            user_ids=[str(user.id) for user in event.participants.all()]
        )

        CalendarEventNotification.objects.create(
            calendar_event=event,
            onesignal_notif_id=reminder_notif_id
        )

        # Return the newly created event
        output_serializer = self.get_serializer(event)
        return Response(output_serializer.data, status=status.HTTP_201_CREATED)
    
    @transaction.atomic
    def update(self, request, *args, **kwargs):
        # Boolean flag that tells DRF whether to require every field or not (True = PATCH, False = PUT)
        partial = kwargs.pop('partial', False)

        # Tell the serializer which model entry we're updating
        instance = self.get_object()
        old_participant_ids = list(instance.participants.values_list('id', flat=True))

        # Get the participants list submitted
        submitted_participants = request.data.get('participants', None)
        data = request.data.copy()

        if 'id' in data:
            try:
                data['id'] = int(data['id'])
            except (ValueError, TypeError):
                raise ValidationError({'id': 'Needs to be cast as integer'})

        data.pop('participants', None)

        serializer = self.get_serializer(instance, data=data, partial=partial)
        try:
            serializer.is_valid(raise_exception=True)
        except ValidationError:
            print(serializer.errors)
            raise
        
        # Save the event for all fields except participants
        event = serializer.save(creator=request.user)

        # Parse through participants
        # I set submitted_participants to None above because I didn't want to overwrite my participants list
        # if I ended up sending PATCH requests for updating non-participant fields
        if submitted_participants is not None:
            unpacked_participants = unpack_participants(submitted_participants=submitted_participants)
            
            # Add the creator to the participants if not already there
            final_participants = set(unpacked_participants)
            final_participants.add(self.request.user)

            event.participants.set(final_participants)

            final_participant_ids = [u.id for u in final_participants if u.id != request.user.id]
        else:
            final_participant_ids = old_participant_ids
        
        # Were fields other than participants changed? If so, send push to everyone. If not, only to new participants
        other_fields_changed = bool(serializer.validated_data)
        if other_fields_changed:
            recipient_ids = final_participant_ids
        elif submitted_participants is not None:
            recipient_ids = [i for i in final_participant_ids if i not in old_participant_ids]
        else:
            recipient_ids = []
        
        recipient_ids = [str(i) for i in recipient_ids if i != self.request.user.id]

        if recipient_ids:
            try:
                push_to_users(
                    user_ids=recipient_ids, 
                    title=f"Updated event: {event.name}", 
                    body=event.start.strftime("%B %d at %I:%M %p"),
                    url="https://apex-cap.onrender.com/calendar/"
                )
            except HTTPError as err:
                logger.warning("OneSignal push failed for calendar event update: %s", err)
        
        # If the start time of the event changed, update the scheduled reminder notification
        reminder_notif_event = getattr(event, "reminder_event", None)

        if "start" in serializer.validated_data and reminder_notif_event:
            delete_event_reminder(event_id=reminder_notif_event.onesignal_notif_id)
            reminder_notif_id = schedule_event_reminder(
                event=event, 
                user_ids=[str(user.id) for user in event.participants.all()]
            )
            reminder_notif_event.onesignal_notif_id = reminder_notif_id
            reminder_notif_event.save(update_fields=["onesignal_notif_id"])

        # Return the newly created event
        output_serializer = self.get_serializer(event)
        return Response(output_serializer.data, status=status.HTTP_200_OK)

    @transaction.atomic
    def perform_destroy(self, instance):
        # Delete the OneSignal reminder notification
        reminder_notif_event = getattr(instance, "reminder_event", None)
        if reminder_notif_event:
            try:
                delete_event_reminder(event_id=reminder_notif_event.onesignal_notif_id)
            except HTTPError as err:
                logger.warning("OneSignal cancel failed: %s", err)

        # Delete the event itself
        instance.delete()

@login_required
def calendar_view(request):
    return render(request, "calendar_app/calendar.html", {
        'category_choices': CATEGORY_CHOICES
    })