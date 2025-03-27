from django.urls import path

from . import views

app_name = "chat"
urlpatterns = [
    path("", views.index, name="index"),
    path("room/<int:room_id>/", views.room, name="room"),
    path("room/new/", views.new, name="new"),
    path("room/<int:room_id>/manage/", views.manage, name="manage")
]