from chat.models import ChatRoom
from django.contrib import messages
from django.shortcuts import get_object_or_404, redirect
from functools import wraps

def user_in_chat(view_func):
    @wraps(view_func)
    def wrapper(request, room_id, *args, **kwargs):
        # Get the room, if it exists
        # get_object_or_404 is Django's shortcut that checks whether the room object exists first
        room = get_object_or_404(ChatRoom, id=room_id)

        if request.user not in room.members.all():
            # One time message stored in the session or cookies for the next page render
            messages.error(request, "You're not authorized to view this chat.")
            return redirect("chat:index")
        
        return view_func(request, room_id, *args, **kwargs)
    return wrapper
