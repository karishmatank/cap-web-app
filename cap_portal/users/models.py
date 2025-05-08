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
    user = models.OneToOneField(User, on_delete=models.CASCADE)
    role = models.CharField(choices=ROLE_CHOICES, max_length=255)
    mentors = models.ManyToManyField(User, related_name='mentees', blank=True)
    graduation_year = models.IntegerField(null=True, blank=True)  # We'll keep this to mentees for now for filtering session details
    interests = models.TextField(null=True, blank=True)  # For mentees and mentors, could be what they want to study or anything else
    college_attended = models.CharField(max_length=255, null=True, blank=True)  # For mentors
    college_major = models.CharField(max_length=255, null=True, blank=True)  # For mentors
    experience = models.TextField(null=True, blank=True)  # For mentors- what jobs / other experience have they had?
    other = models.TextField(null=True, blank=True)  # For both mentors and mentees- what are they looking forward to during CAP?

    def __str__(self):
        return f"{self.user.first_name} {self.user.last_name} ({self.role})"

class AllowedEmail(models.Model):
    email = models.EmailField(unique=True)
    role = models.CharField(choices=ROLE_CHOICES, max_length=255)

    def __str__(self):
        return f"{self.email} ({self.role})"