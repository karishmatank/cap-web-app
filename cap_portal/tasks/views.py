from django import forms
from django.http import HttpResponseRedirect
from django.shortcuts import render
from django.urls import reverse

from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response

from .models import Application, ToDo, TAG_CHOICES, PlatformTemplate, PlatformTemplateSubmission
from .serializers import ApplicationSerializer, ToDoSerializer, ApplicationChoiceSerializer, PlatformTemplateSerializer, PlatformTemplateSubmissionSerializer

# class NewTaskForm(forms.Form):
#     task = forms.CharField(label="New Task")
#     # priority = forms.IntegerField(label="Priority", min_value=1, max_value=10)

# # Create your views here.
# def index(request):
#     # For the session, if the user doesn't already have tasks, give an empty list
#     if "tasks" not in request.session:
#         request.session["tasks"] = []
    
#     return render(request, "tasks/index.html", {
#         "tasks": request.session["tasks"],
#     })

# def add(request):
#     if request.method == 'POST':
#         # Get data from the form
#         form = NewTaskForm(request.POST)
#         if form.is_valid():
#             task = form.cleaned_data["task"]
            
#             # Add to our list of tasks
#             request.session["tasks"] += [task]

#             # Redirect user back to tasks list
#             return HttpResponseRedirect(reverse("tasks:index"))
#         else:
#             # Send back the form with their prior inputs
#             return render(request, "tasks/add.html", {
#                 "form": form
#             })

#     # Show the form that allows users to add a new task
#     return render(request, "tasks/add.html", {
#         "form": NewTaskForm()
#     })

class ApplicationViewSet(viewsets.ModelViewSet):
    serializer_class = ApplicationSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        profile = user.userprofile

        if profile.role == "admin":
            return Application.objects.filter(user__userprofile__role="mentee").order_by('status', 'name')
        elif profile.role == "mentor":
            return Application.objects.filter(user__userprofile__mentors=user).order_by('status', 'name')
        else:
            return Application.objects.filter(user=self.request.user).order_by('status', 'name')
    
    def get_permissions(self):
        if self.request.method in ['POST', 'PUT', 'PATCH', 'DELETE']:
            profile = self.request.user.userprofile
            if profile.role != "mentee":
                self.permission_denied(self.request, message="Read-only for mentors/admins.")
        return super().get_permissions()
    
    def perform_create(self, serializer):
        # Other fields get saved, but it won't save the user as that won't be specified in a form
        serializer.save(user=self.request.user)

    @action(detail=False, methods=["get"])
    def category_choices(self, request):
        return Response([
            {"value": value, "label": label} for value, label in Application._meta.get_field("category").choices
        ])
    
    @action(detail=False, methods=["get"])
    def platform_choices(self, request):
        return Response([
            {"value": value, "label": label} for value, label in PlatformTemplate._meta.get_field("name").choices
        ])
    
    @action(detail=False, methods=["get"])
    def status_choices(self, request):
        return Response([
            {"value": value, "label": label} for value, label in Application._meta.get_field("status").choices
        ])
    

class ToDoViewSet(viewsets.ModelViewSet):
    serializer_class = ToDoSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        profile = user.userprofile

        if profile.role == "admin":
            return ToDo.objects.filter(user__userprofile__role="mentee").order_by('due_date', 'application')
        elif profile.role == "mentor":
            return ToDo.objects.filter(user__userprofile__mentors=user).order_by('due_date', 'application')
        else:
            return ToDo.objects.filter(user=self.request.user).order_by('due_date', 'application')
    
    def get_permissions(self):
        if self.request.method in ['POST', 'PUT', 'PATCH', 'DELETE']:
            profile = self.request.user.userprofile
            if profile.role != "mentee":
                self.permission_denied(self.request, message="Read-only for mentors/admins.")
        return super().get_permissions()

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

    @action(detail=False, methods=["get"])
    def application_choices(self, request):
        user = self.request.user
        profile = user.userprofile
        
        if profile.role == "mentee":
            queryset = Application.objects.filter(user=self.request.user, status="in_progress").order_by('name')
        elif profile.role == "mentor":
            queryset = Application.objects.filter(user__userprofile__mentors=user).order_by('name')
        else:
            queryset = Application.objects.filter(user__userprofile__role="mentee").order_by('name')
        
        serializer = ApplicationChoiceSerializer(queryset, many=True)
        return Response(serializer.data)
        
    @action(detail=False, methods=["get"])
    def tag_choices(self, request):
        return Response([
            {"value": value, "label": label} for value, label in TAG_CHOICES
        ])

class PlatformTemplateViewSet(viewsets.ReadOnlyModelViewSet):
    queryset=PlatformTemplate.objects.all()
    serializer_class=PlatformTemplateSerializer

class PlatformTemplateSubmissionViewSet(viewsets.ModelViewSet):
    serializer_class = PlatformTemplateSubmissionSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        profile = user.userprofile

        if profile.role == "mentee":
            return PlatformTemplateSubmission.objects.filter(user=self.request.user)
        elif profile.role == "mentor":
            return PlatformTemplateSubmission.objects.filter(user__userprofile__mentors=user)
        else:
            return PlatformTemplateSubmission.objects.filter(user__userprofile__role="mentee")
        
    def get_permissions(self):
        if self.request.method in ['POST', 'PUT', 'PATCH', 'DELETE']:
            profile = self.request.user.userprofile
            if profile.role != "mentee":
                self.permission_denied(self.request, message="Read-only for mentors/admins.")
        return super().get_permissions()
    
    def create(self, request, *args, **kwargs):
        platform_ids = request.data.get('platform_ids', [])
        created_objects = []

        for platform_id in platform_ids:
            platform_obj = PlatformTemplate.objects.get(id=platform_id)

            # Create PlatformTemplateSubmission object
            obj, created = PlatformTemplateSubmission.objects.get_or_create(
                user=request.user,
                platform_template=platform_obj
            )

            if not created:
                # This combination of user and platform somehow made it through even though already created,
                # so skip
                continue

            created_objects.append(obj)

            # Create new Application object
            
            # platform_obj resulting id is not our application id, that will be auto created later
            # but it does have a name and category that I want to use in the newly created application
            new_app = Application.objects.create(
                user=request.user,
                name=platform_obj.get_name_display(),
                category=platform_obj.category,
                platform_template=platform_obj
            )

            # Create new ToDo objects
            platform_todos = platform_obj.todos.all()
            for template_todo in platform_todos:
                ToDo.objects.create(
                    user=request.user,
                    name=template_todo.name,
                    tags=template_todo.tags,
                    application=new_app
                )

        serializer = self.get_serializer(created_objects, many=True)
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    
    # def perform_create(self, serializer):
    #     serializer.save(user=self.request.user)