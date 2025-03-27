from django.contrib.auth.models import User
from django.db import models

# Create your models here.

# User profile (mentor, mentee, administrator)

ROLE_CHOICES = (
    ('mentor', 'Mentor'),
    ('mentee', 'Mentee'),
    ('admin', 'Administrator'),
)

class UserProfile(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    role = models.CharField(choices=ROLE_CHOICES, max_length=255)
    mentors = models.ManyToManyField(User, related_name='mentees', blank=True)

    def __str__(self):
        return f"{self.user.first_name} {self.user.last_name} ({self.role})"