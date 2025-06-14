from django.http import JsonResponse
import json
import os
from django.conf import settings
from django.shortcuts import render

# Create your views here.
def nav_links_api(request):
    json_path = os.path.join(settings.BASE_DIR, 'static', 'data', 'nav_links.json')
    with open(json_path) as f:
        data = json.load(f)
    return JsonResponse(data, safe=False)

# def vapid_public_key(request):
#     '''Returns the VAPID public key for users to subscribe to push notifications'''
#     return JsonResponse({"publicKey": settings.VAPID_PUBLIC_KEY})