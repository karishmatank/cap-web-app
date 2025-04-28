from django import forms
from django.http import HttpResponseRedirect
from django.shortcuts import render
from django.urls import reverse

from rest_framework import viewsets, permissions
from rest_framework.decorators import action
from rest_framework.response import Response

from .models import Application, ToDo, TAG_CHOICES
from .serializers import ApplicationSerializer, ToDoSerializer, ApplicationChoiceSerializer

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
        return Application.objects.filter(user=self.request.user).order_by('status', 'name')
    
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
            {"value": value, "label": label} for value, label in Application._meta.get_field("platform").choices
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
        return ToDo.objects.filter(user=self.request.user).order_by('due_date', 'application')

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

    @action(detail=False, methods=["get"])
    def application_choices(self, request):
        queryset = Application.objects.filter(user=self.request.user, status="in_progress").order_by('name')
        serializer = ApplicationChoiceSerializer(queryset, many=True)
        return Response(serializer.data)
        
    @action(detail=False, methods=["get"])
    def tag_choices(self, request):
        return Response([
            {"value": value, "label": label} for value, label in TAG_CHOICES
        ])
