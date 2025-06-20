from rest_framework import serializers
from .models import Application, ToDo, PlatformTemplate, PlatformTemplateSubmission
from chat.serializers import UserSerializer
from core.serializers import BaseModelSerializer

class ApplicationSerializer(BaseModelSerializer):
    user = UserSerializer(read_only=True)
    platform_template = serializers.CharField(source='platform_template.id', read_only=True, allow_null=True)

    class Meta(BaseModelSerializer.Meta):
        model = Application
        fields = '__all__'

class ApplicationChoiceSerializer(BaseModelSerializer):
    value = serializers.CharField(source="id")
    label = serializers.CharField(source="name")

    class Meta(BaseModelSerializer.Meta):
        model = Application
        fields = ("value", "label")

class ToDoSerializer(BaseModelSerializer):
    user = UserSerializer(read_only=True)
    application = serializers.CharField(source='application.id', read_only=True)
    
    class Meta(BaseModelSerializer.Meta):
        model = ToDo
        fields = '__all__'

class PlatformTemplateSerializer(BaseModelSerializer):
    # Get the formatted version of the platform name to display in frontend
    name = serializers.CharField(source='get_name_display')

    class Meta(BaseModelSerializer.Meta):
        model = PlatformTemplate
        fields = '__all__'

class PlatformTemplateSubmissionSerializer(BaseModelSerializer):
    platform_template=PlatformTemplateSerializer(read_only=True)

    class Meta(BaseModelSerializer.Meta):
        model = PlatformTemplateSubmission
        fields = ['platform_template']