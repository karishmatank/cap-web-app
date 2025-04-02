from django.contrib.auth.decorators import login_required
from django.contrib.auth.models import User 
from django.http import HttpResponseRedirect
from django.shortcuts import render
from django.urls import reverse

from .models import Message, ChatRoom
from users.models import UserProfile
from chat.decorators import user_in_chat

from .serializers import MessageSerializer, ChatRoomSerializer, UserSerializer
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

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
@user_in_chat
def room(request, room_id):
    # Show most recent 50 messages upon first load
    room = ChatRoom.objects.get(pk=room_id)
    messages = Message.objects.filter(room_name=room).order_by('-timestamp')[:50]
    return render(request, "chat/room.html", {
        "room_id": room_id,
        "name": room.name,
        "members": room.members.all(),
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
@user_in_chat
def manage(request, room_id):
    # TODO: Add in a way to allow users to change room name and members but
    # I know in the future I won't want this to be its own page, will want it as an interactive part
    # of the room page itself, so maybe this doesn't make sense to do until I figure out how to do
    # in Javascript
    pass




# API of all the rooms the current user is in
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def chat_list(request):
    current_user = request.user
    room_list = current_user.chat_rooms.all()
    serializer = ChatRoomSerializer(room_list, many=True)
    return Response(serializer.data)

# API of all the messages within a chat room
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def chat_messages(request, room_id):
    room = ChatRoom.objects.get(pk=room_id, members=request.user)
    messages = room.room_messages.order_by('-timestamp')[:50]
    serializer = MessageSerializer(reversed(messages), many=True)  # Show oldest messages first
    return Response(serializer.data)

# # Post a new message to the chat
# @api_view(['POST'])
# @permission_classes([IsAuthenticated])
# def post_messages(request, room_id):
#     room = ChatRoom.objects.get(pk=room_id, members=request.user)
#     new_message = request.data.get("content", "").strip()
#     if not new_message:
#         return Response({"error": "Empty message"}, status=400)
    
#     # Create a new message
#     message = Message.objects.create(
#         user=request.user,
#         room_name=room,
#         text=new_message
#     )

#     return Response({"success": True, "message": "Message sent"})

# Create a new chat room
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def create_new_room(request):
    # We will allow the user to set the room name and member list later
    new_room = ChatRoom.objects.create()

    # Auto add the creator
    new_room.members.add(request.user)

    serializer = ChatRoomSerializer(new_room)

    # 201 status code = "created"
    return Response(serializer.data, status=201)

# Update room info. Patch means modifying a resource
@api_view(['PATCH'])
@permission_classes([IsAuthenticated])
def update_room(request, room_id):
    room = ChatRoom.objects.get(id=room_id, members=request.user)

    if 'name' in request.data:
        room.name = request.data['name']
    
    # TODO: This assumes we are getting the full set of names, update later if we are only getting new members
    if 'members' in request.data:
        room.members.set(request.data['members'])

    room.save()
    serializer = ChatRoomSerializer(room)
    return Response(serializer.data)

# Get room info for displaying on the app
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def room_info(request, room_id):
    try:
        room = ChatRoom.objects.get(id=room_id, members=request.user)
    except ChatRoom.DoesNotExist:
        return Response({"detail": "Room not found or access denied."}, status=404)
    
    serializer = ChatRoomSerializer(room)
    return Response(serializer.data)