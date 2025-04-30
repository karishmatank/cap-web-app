from rest_framework import serializers
from .models import Application, ToDo, PlatformTemplate, PlatformTemplateSubmission
from chat.serializers import UserSerializer

class ApplicationSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)

    class Meta:
        model = Application
        fields = '__all__'

class ApplicationChoiceSerializer(serializers.ModelSerializer):
    value = serializers.IntegerField(source="id")
    label = serializers.CharField(source="name")

    class Meta:
        model = Application
        fields = ("value", "label")

class ToDoSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    
    class Meta:
        model = ToDo
        fields = '__all__'

class PlatformTemplateSerializer(serializers.ModelSerializer):
    # Get the formatted version of the platform name to display in frontend
    name = serializers.CharField(source='get_name_display')

    class Meta:
        model = PlatformTemplate
        fields = '__all__'

class PlatformTemplateSubmissionSerializer(serializers.ModelSerializer):
    platform_template=PlatformTemplateSerializer(read_only=True)

    class Meta:
        model = PlatformTemplateSubmission
        fields = ['platform_template']