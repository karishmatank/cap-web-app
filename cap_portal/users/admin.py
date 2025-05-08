from django.contrib import admin
from .models import UserProfile, AllowedEmail

# Register your models here.
admin.site.register(UserProfile)
admin.site.register(AllowedEmail)