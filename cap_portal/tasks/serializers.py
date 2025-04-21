from rest_framework import serializers
from .models import Application, ToDo
from chat.serializers import UserSerializer

class ApplicationSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)

    class Meta:
        model = Application
        fields = '__all__'

class ToDoSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    
    class Meta:
        model = ToDo
        fields = '__all__'
