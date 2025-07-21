from django.conf import settings
import os
import requests

ONESIGNAL_APP_ID = settings.ONESIGNAL_APP_ID
ONESIGNAL_API_KEY = settings.ONESIGNAL_API_KEY
ONESIGNAL_ENDPOINT = 'https://api.onesignal.com/notifications?c=push'

def push_to_users(user_ids: list[str], title: str, body: str, url: str):
    """Send a push notification to specified user_ids"""

    payload = {
        "app_id": ONESIGNAL_APP_ID,
        "include_aliases": {
            "external_id": user_ids
        },
        "target_channel": "push",
        "headings": {"en": title},
        "contents": {"en": body},
        "url": url
    }

    headers = {
        "Authorization": ONESIGNAL_API_KEY,
        "Content-Type": "application/json"
    }

    response = requests.post(ONESIGNAL_ENDPOINT, headers=headers, json=payload)
    response.raise_for_status()
    return response.json()
