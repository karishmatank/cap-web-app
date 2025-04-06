# Adapted from https://channels.readthedocs.io/en/latest/tutorial/part_3.html

import json
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from chat.models import ChatRoom
from .models import Message
from asgiref.sync import sync_to_async

class ChatConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        # Check if user is authenticated
        user = self.scope["user"]
        if not user.is_authenticated:
            await self.close()
            return

        self.room_id = self.scope["url_route"]["kwargs"]["room_id"]

        # Get ChatRoom
        self.room = await database_sync_to_async(ChatRoom.objects.get)(id=self.room_id)

        # Check whether user is a part of this group chat
        user_in_chat = await database_sync_to_async(
            lambda: self.room.members.filter(id=self.scope['user'].id).exists()
        )()

        if not user_in_chat:
            await self.close()
            return

        self.room_group_name = f"chat_{self.room_id}"

        # Join room group
        await self.channel_layer.group_add(
            self.room_group_name, self.channel_name
        )

        await self.accept()

    async def disconnect(self, close_code):
        # Leave room group
        await self.channel_layer.group_discard(
            self.room_group_name, self.channel_name
        )

    # Receive message from WebSocket 
    async def receive(self, text_data):
        text_data_json = json.loads(text_data)
        msg_type = text_data_json["type"]

        if msg_type == "chat_message":
            message = text_data_json["message"]

            # Save to DB
            msg = await database_sync_to_async(Message.objects.create)(
                user=self.scope["user"],
                room_name=self.room,
                text=message
            )

            # Broadcast to the group
            await self.channel_layer.group_send(
                self.room_group_name, 
                {
                    "type": "chat_message", 
                    "message": {
                        "id": msg.id,
                        "user": {
                            "id": self.scope["user"].id,
                            "first_name": self.scope["user"].first_name,
                            "last_name": self.scope["user"].last_name
                        },
                        "timestamp": str(msg.timestamp),
                        "text": msg.text
                    }
                }
            )
        
        elif msg_type == "typing":
            # Broadcast typing message to the group
            await self.channel_layer.group_send(
                self.room_group_name,
                {
                    "type": "user_typing",
                    "user_id": self.scope["user"].id,
                    "first_name": self.scope["user"].first_name,
                    "last_name": self.scope["user"].last_name,
                }
            )
            
    # Receive message from room group
    async def chat_message(self, event):

        # Send message to WebSocket
        await self.send(text_data=json.dumps({
            "type": "message",
            "message": event['message']
        }))

    # Receive user typing message from room group
    async def user_typing(self, event):

        # Send message to WebSocket
        await self.send(text_data=json.dumps({
            "type": "typing",
            "user": {
                "id": event["user_id"],
                "first_name": event["first_name"],
                "last_name": event["last_name"],
            },
        }))