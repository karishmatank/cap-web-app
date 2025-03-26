# From https://channels.readthedocs.io/en/latest/tutorial/part_3.html

import json
from channels.generic.websocket import AsyncWebsocketConsumer

class ChatConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        # Check if user is authenticated
        user = self.scope["user"]
        if not user.is_authenticated:
            await self.close()
            return

        self.room_name = self.scope["url_route"]["kwargs"]["room_name"]
        self.room_group_name = f"chat_{self.room_name}"

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
        message = text_data_json["message"]
        first_name = self.scope["user"].first_name
        last_name = self.scope["user"].last_name

        await self.channel_layer.group_send(
            self.room_group_name, 
            {
                "type": "chat.message", 
                "message": message,
                "first_name": first_name,
                "last_name": last_name,
            }
        )

    # Receive message from room group
    async def chat_message(self, event):
        message = event["message"]
        first_name = event["first_name"]
        last_name = event["last_name"]

        # Send message to WebSocket
        await self.send(text_data=json.dumps({
            "message": message,
            "first_name": first_name,
            "last_name": last_name,
        }))