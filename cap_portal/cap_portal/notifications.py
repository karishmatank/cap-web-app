from django.conf import settings
import os
import requests
import datetime

ONESIGNAL_APP_ID = settings.ONESIGNAL_APP_ID
ONESIGNAL_API_KEY = settings.ONESIGNAL_API_KEY
ONESIGNAL_ENDPOINT = 'https://api.onesignal.com/notifications'

def push_to_users(user_ids: list[str], title: str, body: str, url: str):
    """Send a push notification to specified user_ids"""

    querystring = {"c":"push"}

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
        "Authorization": f"Key {ONESIGNAL_API_KEY}",
        "Content-Type": "application/json"
    }

    response = requests.request("POST", ONESIGNAL_ENDPOINT, headers=headers, json=payload, params=querystring)
    response.raise_for_status()
    return response.json()

def schedule_event_reminder(event, user_ids: list[str]):
    """Event reminders 15 min before meeting start"""
    
    # Django datetime is UTC. We'll ensure it's UTC anyway in case for some reason it already isn't UTC
    send_after_utc = (event.start - datetime.timedelta(minutes=15)).astimezone(datetime.timezone.utc)
    send_after_utc_string = send_after_utc.isoformat(timespec="seconds")

    querystring = {"c":"push"}

    payload = {
        "app_id": ONESIGNAL_APP_ID,
        "include_aliases": {
            "external_id": user_ids
        },
        "target_channel": "push",
        "headings": {"en": event.name},
        "contents": {"en": "In 15 Min"},
        "send_after": send_after_utc_string,
        "url": "https://apex-cap.onrender.com/calendar/"
    }

    headers = {
        "Authorization": f"Key {ONESIGNAL_API_KEY}",
        "Content-Type": "application/json"
    }

    response = requests.request("POST", ONESIGNAL_ENDPOINT, headers=headers, json=payload, params=querystring)
    response.raise_for_status()
    return response.json()['id']

def delete_event_reminder(event_id: str):
    """If we delete an event, we want to delete the scheduled notification too"""

    url = f"{ONESIGNAL_ENDPOINT}/{event_id}"

    querystring = {"app_id": ONESIGNAL_APP_ID}

    headers = {
        "Authorization": f"Key {ONESIGNAL_API_KEY}"
    }

    response = requests.delete(url, headers=headers, params=querystring)
    response.raise_for_status()
    return response.json()