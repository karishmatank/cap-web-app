from rest_framework import serializers
from .models import ChatRoom, Message
from core.serializers import BaseModelSerializer
from django.contrib.auth.models import User

class UserSerializer(BaseModelSerializer):
    # class Meta tells the serializer which model to use / which fields
    class Meta(BaseModelSerializer.Meta):
        model = User
        fields = ['id', 'first_name', 'last_name']

class MessageSerializer(BaseModelSerializer):
    # Includes user specific details
    user = UserSerializer(read_only=True)

    class Meta(BaseModelSerializer.Meta):
        model = Message

        # Not including room_name for now as we'll only need that for filtering and not for the end JSON
        fields = ['id', 'user', 'timestamp', 'text']

class ChatRoomSerializer(BaseModelSerializer):
    # Includes user specific details
    members = UserSerializer(many=True, read_only=True)

    # Dynamically generate the last message in a chat room
    last_message = serializers.SerializerMethodField()

    class Meta(BaseModelSerializer.Meta):
        model = ChatRoom
        fields = ['id', 'name', 'members', 'last_message']
    
    def get_last_message(self, room_obj):
        last_message = room_obj.room_messages.order_by('-timestamp').first()
        return MessageSerializer(last_message).data if last_message else None
