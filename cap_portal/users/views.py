from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.models import User
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

        # Check if username is already in use
        username_exists = User.objects.filter(username=request.POST["username"]).exists()
        if username_exists:
            return render(request, "users/create_user.html", {
                "message": f"Username {request.POST["username"]} is already in use."
            })
        
        # Check if both password entries match
        if request.POST["password"] != request.POST["password_reentry"]:
            return render(request, "users/create_user.html", {
                "message": f"Passwords do not match."
            })
        
        # If everything looks good, create a new user
        new_user = User.objects.create_user(
            request.POST["username"],
            request.POST["email"],
            request.POST["password"]
        )

        return render(request, "users/login.html", {
            "message": "Account created, please log in!"
        })

    return render(request, "users/create_user.html")

def index(request):
    # If the user isn't signed in, redirect to the login page
    if not request.user.is_authenticated:
        return HttpResponseRedirect(reverse("users:login"))
    
    return render(request, "users/user.html")

def login_view(request):
    if request.method == "POST":
        # Get information the user submitted through the login page
        username = request.POST["username"]
        password = request.POST["password"]

        # Check if the username and password are valid
        user = authenticate(request, username=username, password=password)

        # If user exists, log them in and redirect to index page
        if user:
            login(request, user)
            return HttpResponseRedirect(reverse("users:index"))
        
        # Else, display an error message
        else:
            return render(request, "users/login.html", {
                "message": "Invalid credentials"
            })

    return render(request, "users/login.html")

def logout_view(request):
    logout(request)
    return render(request, "users/login.html", {
        "message": "Logged Out"
    })