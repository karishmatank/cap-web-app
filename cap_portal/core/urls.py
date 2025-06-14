from django.urls import path

from . import views

app_name = "core"
urlpatterns = [
    path("api/nav_links/", views.nav_links_api),
    # path("api/vapid_public_key/", views.vapid_public_key),
]