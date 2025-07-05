from django.conf import settings
from pusher_push_notifications import PushNotifications

# Beams auth
beams_client = PushNotifications(
    instance_id=settings.BEAMS_INSTANCE_ID,
    secret_key=settings.BEAMS_SECRET_KEY
)
