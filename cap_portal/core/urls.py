from django.urls import path

from . import views

app_name = "core"
urlpatterns = [
    path("api/nav_links/", views.nav_links_api),
    path("metrics/resources/", views.resources),
    path("loadtest/test-list/", views.load_test_list),
    path("loadtest/test-database-call/", views.load_from_database)
    # path("api/vapid_public_key/", views.vapid_public_key),
]