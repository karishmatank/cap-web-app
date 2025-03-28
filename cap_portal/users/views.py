from django.contrib import messages
from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.decorators import login_required
from django.contrib.auth.models import User
from django.contrib.auth.views import logout_then_login
from django.http import HttpResponseRedirect
from django.shortcuts import render
from django.urls import reverse

from .models import UserProfile, ROLE_CHOICES

# Create your views here.

def create_user_get_role(request):
    if request.method == "POST":
        # Validation
        role = request.POST["role"]

        if role not in [i[0] for i in ROLE_CHOICES]:
            return render(request, "users/create_user_get_role.html", {
                "message": "Please choose a valid role.",
                "roles": ROLE_CHOICES
            })
        
        # Otherwise, we have a valid role, let's move on to creating the user
        return HttpResponseRedirect(reverse("users:create", args=(role,)))

    return render(request, "users/create_user_get_role.html", {
        "roles": ROLE_CHOICES
    })


def create_user(request, role):
    if request.method == 'POST':
        # Check if there is already a user associated with the email
        user_exists = User.objects.filter(email=request.POST["email"]).exists()
        if user_exists:
            return render(request, "users/create_user.html", {
                "message": f"Account already exists for email address {request.POST["email"]}."
            })
        
        # Check if both password entries match
        if request.POST["password"] != request.POST["password_reentry"]:
            return render(request, "users/create_user.html", {
                "message": f"Passwords do not match."
            })
        
        # If everything looks good, create a new user
        new_user = User.objects.create_user(
            username=request.POST["email"],  # Just using email as username
            email=request.POST["email"],
            password=request.POST["password"],
            first_name=request.POST["first_name"],
            last_name=request.POST["last_name"]
        )

        # Create a user profile
        new_profile = UserProfile.objects.create(
            user=new_user,
            role=role
        )

        if role == 'mentee':
            mentor_id = request.POST["mentor"]
            mentor = User.objects.get(id=mentor_id)
            new_profile.mentors.add(mentor)

        messages.success(request, "Account created, please log in!")
        
        return HttpResponseRedirect(reverse("users:login"))

    # method = 'get'
    if role == "mentee":
        # Get a list of possible mentors
        # The assumption is that mentors are already input into the system by the time mentees start signing up
        mentors = UserProfile.objects.filter(role="mentor")

        return render(request, "users/create_user.html", {
            "mentors": mentors,
            "role": role,
        })
    else:
        return render(request, "users/create_user.html", {
            "role": role,
        })

@login_required
def index(request):
    # # If the user isn't signed in, redirect to the login page
    # if not request.user.is_authenticated:
    #     return HttpResponseRedirect(reverse("users:login"))
    
    return render(request, "users/user.html")

@login_required
def logout_view(request):
    return logout_then_login(request)