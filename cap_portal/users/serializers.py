from rest_framework import serializers
from .models import UserProfile
from chat.serializers import UserSerializer
from core.serializers import BaseModelSerializer

class UserProfileSerializer(BaseModelSerializer):
    user = UserSerializer(read_only=True)
    mentors = UserSerializer(many=True, read_only=True)

    class Meta(BaseModelSerializer.Meta):
        model = UserProfile
        fields = [
            "id", 
            "user", 
            "role", 
            "mentors", 
            "graduation_year", 
            "interests",
            "college_attended",
            "college_major",
            "experience",
            "other"
        ]