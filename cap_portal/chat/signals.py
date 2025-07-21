from django.db.models.signals import post_save  # Fires after every model.save()
from django.dispatch import receiver  # Lets us bind a function to a signal
from .models import Message  # Only run the signal when a new Message is saved
from cap_portal.notifications import push_to_users
import logging
from requests.exceptions import HTTPError

logger = logging.getLogger(__name__)

# Whenever post_save fires for Message, call push_new_message
@receiver(post_save, sender=Message)
def push_new_message(sender, instance, created, **kwargs):

    # Only do something on a newly created message
    if not created:
        return
    
    # Get the author's id so we exclude them from the message
    sender_id = instance.user.id

    room = instance.room_name

    # Build list of recipient names
    recipient_ids = list(room.members.exclude(id=sender_id).values_list('id', flat=True))
    if not recipient_ids:
        return
    
    # Push notification
    try:
        push_to_users(
            user_ids=[str(i) for i in recipient_ids],
            title=f"New message in {room.name}", 
            body=instance.text[:30],
            url=f"https://apex-cap.onrender.com/chat/{room.id}/"
        )
    except HTTPError as err:
        logger.warning("OneSignal push failed for chat event update: %s", err)