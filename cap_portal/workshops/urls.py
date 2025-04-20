from . import views
from django.urls import path

app_name="workshops"
urlpatterns = [
    path("", views.index, name="index"),

    # Workshop specific page
    path("<int:id>/", views.workshop_details, name="workshop_details"),

    # Admin views to create new workshops or edit existing ones
    path("admin/new/", views.create_workshop, name="create_workshop"),
    path("admin/edit/<int:id>/", views.edit_workshop, name="edit_workshop"),
    path("admin/delete/<int:id>/", views.delete_workshop, name="delete_workshop")
]