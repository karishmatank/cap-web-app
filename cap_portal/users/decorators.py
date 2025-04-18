from django.contrib import messages
from django.shortcuts import redirect
from functools import wraps

def admin_only(view_func):
    @wraps(view_func)
    def wrapper(request, *args, **kwargs):
        # Get the user profile. If user is not an admin, throw an error
        # Django naming convention is lowercase, so we use 'userprofile'
        # This is a better alternative than UserProfile.objects.get() as it takes care of errors if profile not found
        profile = getattr(request.user, 'userprofile', None)  # Return none if profile isn't found

        if profile and profile.role == 'admin':
            return view_func(request, *args, **kwargs)
        messages.error(request, "You're not authorized to view this page.")
        return redirect("workshops:index")
    return wrapper