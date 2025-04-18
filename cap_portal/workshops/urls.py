from . import views
from django.urls import path

app_name="workshops"
urlpatterns = [
    # path("", views.index, name="index"),

    # Admin views to create new workshops or edit existing ones
    path("admin/new/", views.create_workshop_material, name="create_workshop_material")
]