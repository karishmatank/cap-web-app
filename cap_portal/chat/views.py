from django.contrib.auth.decorators import login_required
from django.shortcuts import render

from .models import Message

# Create your views here.
@login_required
def index(request):
    return render(request, "chat/index.html")

@login_required
def room(request, room_name):
    # Show most recent 50 messages upon first load
    messages = Message.objects.filter(room_name=room_name).order_by('-timestamp')[:50]
    return render(request, "chat/room.html", {
        "room_name": room_name,
        "messages": reversed(messages)  # Show oldest messages first
    })