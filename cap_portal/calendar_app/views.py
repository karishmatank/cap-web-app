from .models import CalendarEvent
from .serializers import CalendarEventSerializer
from django.db.models import Q
from django.shortcuts import render
from rest_framework import viewsets, permissions
from rest_framework.response import Response
from tasks.models import ToDo

# Create your views here.
class CalendarEventViewSet(viewsets.ModelViewSet):
    serializer_class = CalendarEventSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        todos = ToDo.objects.filter(user=user).values("name", "due_date")
        events = CalendarEvent.objects.filter(
            Q(participants=user)
        ).values("name", "start")

        calendar_items = [
            *[
                {"title": t["name"], "start": t["due_date"], "type": "todo"}
                for t in todos
            ],
            *[
                {"title": e["name"], "start": e["start"], "type": "event"}
                for e in events
            ],
        ]

        return Response({"calendar_items" : calendar_items})
    
    def perform_create(self, serializer):
        # Other fields get saved, but it won't save the user as that won't be specified in a form
        user = self.request.user

        # Save the event with the creator field set
        event = serializer.save(creator=user)

        # Add the creator to the participants if not already there
        event.participants.add(user)