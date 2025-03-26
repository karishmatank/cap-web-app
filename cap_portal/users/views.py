from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.decorators import login_required
from django.contrib.auth.models import User
from django.contrib.auth.views import logout_then_login
from django.http import HttpResponseRedirect
from django.shortcuts import render
from django.urls import reverse

# Create your views here.
def create_user(request):
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

        return render(request, "users/login.html", {
            "message": "Account created, please log in!"
        })

    return render(request, "users/create_user.html")

@login_required
def index(request):
    # # If the user isn't signed in, redirect to the login page
    # if not request.user.is_authenticated:
    #     return HttpResponseRedirect(reverse("users:login"))
    
    return render(request, "users/user.html")

@login_required
def logout_view(request):
    return logout_then_login(request)