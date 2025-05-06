from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

app_name="calendar"

router = DefaultRouter()
router.register(r'events', views.CalendarEventViewSet, basename='events')

urlpatterns = [
    path('api/', include(router.urls)),
    path('', views.calendar_view, name="calendar_view")
]