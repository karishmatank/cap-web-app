from django.contrib.auth.models import User
from django.db import models

# Create your models here.
CATEGORY_CHOICES = (
    ('general', 'General'),
    ('session', 'CAP Session')
)

class CalendarEvent(models.Model):
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    start = models.DateTimeField()
    end = models.DateTimeField(null=True, blank=True)
    category = models.CharField(choices=CATEGORY_CHOICES, max_length=10, default="general")
    isAllDay = models.BooleanField(default=False)

    creator = models.ForeignKey(User, on_delete=models.CASCADE, related_name="created_events")
    participants = models.ManyToManyField(User, related_name="calendar_events", blank=True)
    
    def __str__(self):
        return f"{self.name} ({self.start})"

class CalendarEventNotification(models.Model):
    calendar_event = models.OneToOneField(CalendarEvent, on_delete=models.CASCADE, related_name="reminder_event")
    onesignal_notif_id = models.CharField(max_length=80, blank=True, null=True)

    def __str__(self):
        return f"{self.calendar_event} - {self.onesignal_notif_id}"