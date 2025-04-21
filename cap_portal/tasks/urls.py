from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

app_name = "tasks"
# urlpatterns = [
#     path("", views.index, name="index"),
#     path("add", views.add, name="add")
# ]

router = DefaultRouter()
router.register(r'todos', views.ToDoViewSet, basename='todo')
router.register(r'applications', views.ApplicationViewSet, basename='application')

urlpatterns = [
    path('api/', include(router.urls))
]