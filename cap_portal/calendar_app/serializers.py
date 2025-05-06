from rest_framework import serializers
from .models import CalendarEvent
from chat.serializers import UserSerializer
from django.contrib.auth.models import User

class CalendarEventWriteSerializer(serializers.ModelSerializer):
    creator = UserSerializer(read_only=True)
    participants = serializers.PrimaryKeyRelatedField(queryset=User.objects.all(), many=True, required=False)

    class Meta:
        model = CalendarEvent
        fields = '__all__'

class CalendarEventReadSerializer(serializers.ModelSerializer):
    creator = UserSerializer(read_only=True)
    participants = UserSerializer(many=True, read_only=True)

    class Meta:
        model = CalendarEvent
        fields = '__all__'