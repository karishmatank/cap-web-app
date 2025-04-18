from django.shortcuts import render
from django.contrib.auth.decorators import login_required
from users.decorators import admin_only
from .models import WorkshopMaterial

# Create your views here.
@login_required
# @admin_only
def create_workshop_material(request):
    if request.method == 'POST':
        return
    return render(request, "workshops/create_new_workshop.html")