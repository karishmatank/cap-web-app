from django.db import models
from django.contrib.auth.models import User

# Create your models here.

# Message model
class Message(models.Model):
    # If the user is deleted, I don't want to delete their messages necessarily
    user = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name="sent_messages")
    room_name = models.CharField(max_length=255)
    timestamp = models.DateTimeField(auto_now_add=True)
    text = models.TextField()

    # Add in formatting if we need to print to terminal. Print first 20 characters of a message
    def __str__(self):
        return f"{self.user.first_name} {self.user.last_name}: {self.text[:20]}"

# TODO: Chat room model. Creates chat rooms for users to join and for messages to be sent over
# These will include both group and private chat rooms
class ChatRoom(models.Model):
    pass