from django.db.models.signals import post_save  # Fires after every model.save()
from django.dispatch import receiver  # Lets us bind a function to a signal
from .models import Message  # Only run the signal when a new Message is saved
from cap_portal.beams import beams_client

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
    
    # Call Beams client. User IDs must be strings
    beams_client.publish_to_users(
        user_ids=[str(i) for i in recipient_ids],
        publish_body={
            'web': {
                'notification': {
                    'title': f"New message in {room.name}",
                    'body': instance.text[:50],
                }
            }
        },
    )