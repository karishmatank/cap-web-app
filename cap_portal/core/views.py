from django.http import JsonResponse, HttpResponseForbidden
import json
import os, time, psutil
from django.contrib.auth.decorators import login_required
from django.conf import settings
from django.shortcuts import render
from users.decorators import admin_only
from cap_portal.settings import ENABLE_LOADTEST
from chat.models import ChatRoom
from chat.serializers import MessageSerializer

_process = psutil.Process(os.getpid())

# Create your views here.
def nav_links_api(request):
    json_path = os.path.join(settings.BASE_DIR, 'static', 'data', 'nav_links.json')
    with open(json_path) as f:
        data = json.load(f)
    return JsonResponse(data, safe=False)

@login_required
def resources(request):
    if not request.user.is_superuser:
        return JsonResponse({'access': 'denied'})
    
    # 100ms sampling for a "what's happening right now" CPU snapshot
    cpu_pct = _process.cpu_percent(interval=0.1)
    mem = _process.memory_info()
    rss_mb = mem.rss / (1024*1024)  # resident set size (real memory)
    return JsonResponse({
        "ts": int(time.time()),
        "cpu_percent": round(cpu_pct, 1),
        "rss_mb": round(rss_mb, 1),
        "limit_mb": 512,  # Free plan memory limit
        "rss_pct_of_limit": round(100 * rss_mb / 512, 1),
        "pid": _process.pid,
    })

def load_test_list(request):
    if not ENABLE_LOADTEST:
        return HttpResponseForbidden()
    
    # 50 rows of fake data for load testing purposes
    items = [{
        "id": i,
        "title": f"Item {i}",
        "preview": "lorem ipsum dolor sit amet" * 5,
        "updated_at": int(time.time()) - i * 60
    } for i in range(50)]
    return JsonResponse({"results": items})

def load_from_database(request):
    if not ENABLE_LOADTEST:
        return HttpResponseForbidden()
    
    t0 = time.perf_counter()
    # Read from a database to see how load test responds
    room = ChatRoom.objects.get(pk=8)
    messages = room.room_messages.order_by('-timestamp')
    t1 = time.perf_counter()

    serializer = MessageSerializer(messages, many=True)
    t2 = time.perf_counter()

    resp = JsonResponse({"results": serializer.data})
    resp['db-ms'] = f"{(t1 - t0)*1000:.0f}"  # How long does the db portion take?
    resp['serialize-ms'] = f"{(t2 - t1)*1000:.0f}"  # How long does the serialization take?
    resp['bytes'] = str(len(resp.content))

    return resp

# def vapid_public_key(request):
#     '''Returns the VAPID public key for users to subscribe to push notifications'''
#     return JsonResponse({"publicKey": settings.VAPID_PUBLIC_KEY})