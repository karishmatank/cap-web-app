from django.contrib.auth.models import User
from django.db import models

# Create your models here.
class CalendarEvent(models.Model):
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    start = models.DateTimeField()
    end = models.DateTimeField(null=True, blank=True)

    creator = models.ForeignKey(User, on_delete=models.CASCADE, related_name="created_events")
    participants = models.ManyToManyField(User, related_name="calendar_events", blank=True)
    
    def __str__(self):
        return f"{self.name} ({self.start})"