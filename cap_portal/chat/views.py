from django.contrib.auth.decorators import login_required
from django.contrib.auth.models import User 
from django.http import HttpResponseRedirect
from django.shortcuts import render
from django.urls import reverse

from .models import Message, ChatRoom
from users.models import UserProfile

# Create your views here.
@login_required
def index(request):
    # Show a link to all rooms for now
    # TODO: Restrict rooms to those accessible to the authenticated user only
    rooms = ChatRoom.objects.all()

    return render(request, "chat/index.html", {
        "rooms": rooms,
    })

@login_required
def room(request, room_id):
    # Show most recent 50 messages upon first load
    room = ChatRoom.objects.get(pk=room_id)
    messages = Message.objects.filter(room_name=room).order_by('-timestamp')[:50]
    return render(request, "chat/room.html", {
        "room_id": room_id,
        "messages": reversed(messages)  # Show oldest messages first
    })

@login_required
def new(request):
    current_user = request.user

    if request.method == "POST":
        name = request.POST["room_name"]

        # We'll get a list of user IDs, so we need to get the User objects themselves
        additional_user_ids = request.POST.getlist("additional_users")
        additional_users = User.objects.filter(id__in=additional_user_ids)

        # Add in the current user as well
        all_users = list(additional_users) + [current_user]

        # Create a new chat room. Set method handles duplicates
        new_chat = ChatRoom.objects.create(name=name)
        new_chat.members.set(all_users)

        return HttpResponseRedirect(reverse("chat:room", args=(new_chat.id,)))

    else:
        # Get all users that can be added. 
        # Assume current user will be in the chat, but we don't need them in a dropdown
        
        other_users_by_role = {
            "Mentors": UserProfile.objects.filter(role="mentor").exclude(user=current_user),
            "Mentees": UserProfile.objects.filter(role="mentee").exclude(user=current_user),
            "Administrators": UserProfile.objects.filter(role="admin").exclude(user=current_user),
        }
        
        return render(request, "chat/new.html", {
            "users": other_users_by_role,
        })

@login_required
def manage(request):
    pass