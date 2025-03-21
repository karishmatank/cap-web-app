from django import forms
from django.http import HttpResponseRedirect
from django.shortcuts import render
from django.urls import reverse


class NewTaskForm(forms.Form):
    task = forms.CharField(label="New Task")
    # priority = forms.IntegerField(label="Priority", min_value=1, max_value=10)

# Create your views here.
def index(request):
    # For the session, if the user doesn't already have tasks, give an empty list
    if "tasks" not in request.session:
        request.session["tasks"] = []
    
    return render(request, "tasks/index.html", {
        "tasks": request.session["tasks"],
    })

def add(request):
    if request.method == 'POST':
        # Get data from the form
        form = NewTaskForm(request.POST)
        if form.is_valid():
            task = form.cleaned_data["task"]
            
            # Add to our list of tasks
            request.session["tasks"] += [task]

            # Redirect user back to tasks list
            return HttpResponseRedirect(reverse("tasks:index"))
        else:
            # Send back the form with their prior inputs
            return render(request, "tasks/add.html", {
                "form": form
            })

    # Show the form that allows users to add a new task
    return render(request, "tasks/add.html", {
        "form": NewTaskForm()
    })