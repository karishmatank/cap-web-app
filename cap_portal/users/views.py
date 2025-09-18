from django.contrib import messages
from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.decorators import login_required
from django.contrib.auth.models import User
from django.contrib.auth.mixins import LoginRequiredMixin
from django.contrib.auth.views import logout_then_login, PasswordChangeView, PasswordResetView, PasswordResetConfirmView
from django.db.models import Q
from django.http import HttpResponseRedirect, JsonResponse
from django.shortcuts import render
from django.urls import reverse, reverse_lazy

from .models import UserProfile, ROLE_CHOICES, AllowedEmail
from .serializers import UserProfileSerializer

from rest_framework import generics
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from datetime import datetime

from cap_portal.settings import EXCLUDE_TEST_USERS_BY_DEFAULT, TEST_USER_IDS

# Create your views here.
class CustomPasswordChangeView(LoginRequiredMixin, PasswordChangeView):
    success_url = reverse_lazy("users:index")

    def form_valid(self, form):
        messages.success(self.request, 'Your password was updated successfully.')

        # We don't need to call form.save() etc because we are returning form valid from super()
        # FormView calls form.save() for us as well as update_session_auth_hash
        return super().form_valid(form)

class CustomPasswordResetView(PasswordResetView):
    success_url = reverse_lazy("users:login")

    def form_valid(self, form):
        messages.success(self.request, "If you have a valid account, you'll receive an email from tempapexcap@gmail.com with password reset instructions shortly. Please check your spam!")
        return super().form_valid(form)
    
class CustomPasswordResetConfirmView(PasswordResetConfirmView):
    success_url = reverse_lazy("users:login")

    def form_valid(self, form):
        messages.success(self.request, "Your password has been reset successfully.")
        return super().form_valid(form)

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
        # Check if the user email is valid for the role they supplied
        try:
            allowed = AllowedEmail.objects.get(email__iexact=request.POST["email"])
        except AllowedEmail.DoesNotExist:
            messages.error(request, f"The email address {request.POST['email']} is not eligible to sign up for an account.")
            return HttpResponseRedirect(reverse("users:login"))
        
        if allowed.role != role:
            messages.error(request, f"The email address {request.POST['email']} is not eligible for role {role}.")
            return HttpResponseRedirect(reverse("users:login"))
            
        # Check if there is already a user associated with the email
        user_exists = User.objects.filter(email=request.POST["email"]).exists()
        if user_exists:
            messages.error(request, f"Account already exists for email address {request.POST['email']}. Please sign in.")
            return HttpResponseRedirect(reverse("users:login"))
        
        # Check if both password entries match
        if request.POST["password"] != request.POST["password_reentry"]:
            return render(request, "users/create_user.html", {
                "role": role,
                "message": f"Passwords do not match."
            })
        
        if role == 'mentee':
            mentors = UserProfile.objects.filter(role="mentor").exclude(user__pk__in=TEST_USER_IDS)

            # Error check graduation year
            try:
                graduation_year = int(request.POST['graduation_year'])
            except ValueError:
                return render(request, "users/create_user.html", {
                    "role": role,
                    "mentors": mentors,
                    "message": f"Please enter an integer."
                })
            
            # Check that graduation year provided isn't nonsensical
            current_year = datetime.now().year
            if graduation_year > (current_year + 2):
                return render(request, "users/create_user.html", {
                    "role": role,
                    "mentors": mentors,
                    "message": f"Please enter a valid graduation year."
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
            new_profile.graduation_year = graduation_year

        messages.success(request, "Account created, please log in!")
        
        return HttpResponseRedirect(reverse("users:login"))

    # method = 'get'
    if role == "mentee":
        # Get a list of possible mentors
        # The assumption is that mentors are already input into the system by the time mentees start signing up
        if EXCLUDE_TEST_USERS_BY_DEFAULT:
            mentors = UserProfile.objects.filter(role="mentor").exclude(user__pk__in=TEST_USER_IDS)
        else:
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

# User profile edit
@login_required
def edit_profile(request):
    # Get the existing user profile object, which was created when the user signed up
    profile = UserProfile.objects.get(user__id=request.user.id)

    if request.method == 'POST':
        # For all users, we fill interest and other info
        profile.interests = request.POST["interests"]
        profile.other = request.POST["other"]
        
        # If the user is a mentee, we need to fill graduation year as well
        if profile.role == 'mentee':
            try:
                graduation_year = int(request.POST['graduation_year'])
            except ValueError:
                messages.error(request, "Please enter an integer.")
                return HttpResponseRedirect(reverse("users:edit_profile"))
            
            # Check that year provided isn't nonsensical
            current_year = datetime.now().year
            if graduation_year > (current_year + 2):
                messages.error(request, "Please enter a valid graduation year.")
                return HttpResponseRedirect(reverse("users:edit_profile"))
            
            profile.graduation_year = graduation_year

        # If the user is a mentor, we need to fill college, majors, and experience as well
        if profile.role == 'mentor':
            profile.college_attended = request.POST['college_attended']
            profile.college_major = request.POST['college_major']
            profile.experience = request.POST['experience']

        profile.save()

        messages.success(request, "Profile updated!")

        return HttpResponseRedirect(reverse("users:edit_profile"))

    return render(request, "users/edit_profile.html", {
        'profile': profile,
    })


# API to get current user for React
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_current_user(request):
    user = request.user
    profile = user.profile
    return Response({
        "id": str(user.id),
        "first_name": user.first_name,
        "last_name": user.last_name,
        "role": profile.role
    })

# Search for users
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def search_users_by_name(request):
    query = request.GET.get("q", "")
    if EXCLUDE_TEST_USERS_BY_DEFAULT:
        users = User.objects.exclude(pk__in=TEST_USER_IDS).filter(
            Q(first_name__icontains=query) |
            Q(last_name__icontains=query)
        )[:10]
    else:
        users = User.objects.filter(
            Q(first_name__icontains=query) |
            Q(last_name__icontains=query)
        )[:10]

    data = [
        {
            'id': str(user.id),
            'first_name': user.first_name,
            'last_name': user.last_name
        }
        for user in users if user.id != request.user.id
    ]

    # Add in custom group options
    data += [
        {'id': '-1', 'first_name': "All CAP", 'last_name': ""},
        {'id': '-2', 'first_name': "All 11th Grade CAP Mentees", 'last_name': ""},
        {'id': '-3', 'first_name': "All 11th Grade CAP Mentors", 'last_name': ""},
        {'id': '-4', 'first_name': "All 12th Grade CAP Mentees", 'last_name': ""},
        {'id': '-5', 'first_name': "All 12th Grade CAP Mentors", 'last_name': ""}
    ]

    return Response(data)

# Get list of queried users for the community page
class CommunityDirectoryListView(generics.ListAPIView):
    serializer_class = UserProfileSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        if EXCLUDE_TEST_USERS_BY_DEFAULT:
            queryset = UserProfile.objects.all().exclude(user__pk__in=TEST_USER_IDS)
        else:
            queryset = UserProfile.objects.all()

        # Queries based on keyword (name, interest, etc)
        query = self.request.GET.get('q')
        role = self.request.GET.get('role')  # Mentor vs mentee, etc

        if query:
            queryset = queryset.filter(
                Q(user__first_name__icontains=query) |
                Q(user__last_name__icontains=query) |
                Q(interests__icontains=query) |
                Q(college_attended__icontains=query) |
                Q(college_major__icontains=query) |
                Q(experience__icontains=query) |
                Q(other__icontains=query)
            )
        
        if role:
            queryset = queryset.filter(role=role)
        
        return queryset