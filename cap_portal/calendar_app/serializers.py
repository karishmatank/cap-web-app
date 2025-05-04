from rest_framework import serializers
from .models import CalendarEvent
from chat.serializers import UserSerializer

class CalendarEventSerializer(serializers.ModelSerializer):
    creator = UserSerializer(read_only=True)

    class Meta:
        model = CalendarEvent
        fields = '__all__'