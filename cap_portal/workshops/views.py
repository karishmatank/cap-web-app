from .models import WorkshopMaterial
from datetime import datetime, date
from django.contrib import messages
from django.contrib.auth.decorators import login_required
from django.http import JsonResponse
from django.shortcuts import render, redirect
from django.urls import reverse
from users.decorators import admin_only
from users.models import UserProfile
import json
import datetime

# Create your views here.

# See all workshops
@login_required
def index(request):
    # Admins will be able to see all workshops
    current_userprofile = request.user.profile

    if current_userprofile.role == 'admin':
        workshops = WorkshopMaterial.objects.all()
    else:
        if current_userprofile.role == 'mentee':
            grad_year = current_userprofile.graduation_year
        else:
            mentees = UserProfile.objects.filter(mentors=request.user)
            grad_year = max([i.graduation_year for i in mentees])
        grade_cutoff_date = datetime.date(year=grad_year, month=8, day=1)
        grade_level = 11 if (grade_cutoff_date - datetime.datetime.today().date()).days > 365 else 12
        if grade_level == 11:
            workshops = WorkshopMaterial.objects.filter(grade=11, visible=True)
        else:
            workshops_11 = WorkshopMaterial.objects.filter(grade=11)
            workshops_12 = WorkshopMaterial.objects.filter(grade=12, visible=True)
            workshops = workshops_11 | workshops_12
    
    # Order by grade first (11 vs 12), then workshop number
    workshops_ordered = workshops.order_by("grade", "number")

    return render(request, "workshops/landing.html", {
        "workshops": workshops_ordered
    })

def check_validity(request):
    # Check for errors
    name = request.POST["new-workshop-name"]

    try:
        number = int(request.POST["new-workshop-number"])
    except ValueError:
        messages.error(request, "Please enter an integer for workshop number.")
        return redirect("workshops:create_workshop_material")

    description = request.POST["new-workshop-description"]
    
    try:
        grade = int(request.POST["new-workshop-grade"])
    except ValueError:
        messages.error(request, "Please choose an integer value for grade level.")
        return redirect("workshops:create_workshop_material")

    if grade not in [11, 12]:
        messages.error(request, "Please choose either 11th or 12th grade.")
        return redirect("workshops:create_workshop_material")

    # Google doc ID is optional as not all sessions may have an associated Google doc
    google_doc_id = request.POST["new-workshop-google-doc-id"]

    if (not name) or (not number) or (not description) or (not grade):
        messages.error(request, "Please enter all required information.")
        return redirect("workshops:create_workshop_material")
    
    # If all looks good, return
    return name, number, description, grade, google_doc_id

@login_required
@admin_only
def create_workshop(request):
    if request.method == 'POST':
        name, number, description, grade, google_doc_id = check_validity(request)

        # Create a new workshop if we have all the input we need
        WorkshopMaterial.objects.create(
            name=name,
            number=number,
            description=description,
            grade=grade,
            google_doc_id=google_doc_id
        )

        messages.success(request, "Workshop created!")
        return redirect("workshops:index")

    return render(request, "workshops/create_edit_workshop.html", {
        "form_title": "Create New Workshop",
        "submit_button_text": "Create",
        "form_action_url": reverse("workshops:create_workshop")
    })

@login_required
def workshop_details(request, id):
    workshop = WorkshopMaterial.objects.get(id=id)

    return render(request, "workshops/workshop_detailed.html", {
        "workshop": workshop,
    })

@login_required
@admin_only
def edit_workshop(request, id):
    # Get existing workshop
    workshop = WorkshopMaterial.objects.get(id=id)

    if request.method == 'POST':
        name, number, description, grade, google_doc_id = check_validity(request)

        # Update existing workshop
        workshop.name = name
        workshop.number = number
        workshop.description = description
        workshop.grade = grade
        workshop.google_doc_id = google_doc_id

        workshop.save()

        messages.success(request, "Workshop updated!")
        return redirect("workshops:index")

    return render(request, "workshops/create_edit_workshop.html", {
        "form_title": "Edit Workshop",
        "submit_button_text": "Save Changes",
        "form_action_url": reverse("workshops:edit_workshop", args=[workshop.id]),
        "workshop": workshop
    })

@login_required
@admin_only
def delete_workshop(request, id):
    workshop = WorkshopMaterial.objects.get(id=id)
    workshop.delete()

    messages.success(request, "Workshop deleted.")
    return redirect("workshops:index")

@login_required
@admin_only
def edit_visibility(request, id):
    if request.method == 'POST':
        workshop = WorkshopMaterial.objects.get(id=id)
        try:
            data = json.loads(request.body)

            workshop.visible = data.get('checked')
            workshop.save()

            return JsonResponse({'status': 'success', 'message': 'Workshop visibility status changed'})
        except json.JSONDecodeError:
            return JsonResponse({"status": 'error', 'message': 'Invalid JSON'}, status=400)
    return JsonResponse({'status': 'error', 'message': 'Invalid request method'}, status=405)