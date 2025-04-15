from rest_framework import serializers
from .models import UserProfile
from chat.serializers import UserSerializer

class UserProfileSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    mentors = UserSerializer(many=True, read_only=True)

    class Meta:
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