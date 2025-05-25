from .models import CalendarEvent, CATEGORY_CHOICES
from .serializers import CalendarEventReadSerializer, CalendarEventWriteSerializer
from django.contrib.auth.decorators import login_required
from django.db.models import Q
from django.shortcuts import render
from rest_framework import viewsets, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from tasks.models import ToDo, Application

# Create your views here.
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
                        {'id': u.id, 'full_name': f'{u.first_name} {u.last_name}'}
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
    
    def perform_create(self, serializer):
        # Other fields get saved, but it won't save the user as that won't be specified in a form
        user = self.request.user

        # Save the event with the creator field set
        event = serializer.save(creator=user)

        # Add the creator to the participants if not already there
        submitted_participants = serializer.validated_data.get('participants', [])
        final_participants = set(submitted_participants)
        final_participants.add(self.request.user)
        
        event.participants.set(final_participants)

    def perform_update(self, serializer):
        event = serializer.save()

        # Make sure the creator remains in participants
        submitted_participants = serializer.validated_data.get('participants', [])
        final_participants = set(submitted_participants)
        final_participants.add(self.request.user)
        
        event.participants.set(final_participants)


@login_required
def calendar_view(request):
    return render(request, "calendar_app/calendar.html", {
        'category_choices': CATEGORY_CHOICES
    })