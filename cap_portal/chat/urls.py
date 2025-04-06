from django.urls import path

from . import views

app_name = "chat"
urlpatterns = [
    # path("", views.index, name="index"),
    # path("room/<int:room_id>/", views.room, name="room"),
    # path("room/new/", views.new, name="new"),
    # path("room/<int:room_id>/manage/", views.manage, name="manage"),

    path('api/chats/', views.chat_list, name='chat_list'),
    path('api/chats/<int:room_id>/messages/', views.chat_messages, name='chat_messages'),
    path('api/chats/create/', views.create_new_room, name="create_new_room"),
    path('api/chats/<int:room_id>/info/', views.room_info, name="room_info"),
    path('api/chats/<int:room_id>/update/', views.update_room, name="update_room"),
]