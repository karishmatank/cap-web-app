"""
URL configuration for cap_portal project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/5.1/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
from django.contrib import admin
from django.urls import include, path
from .spa_views import ChatSPAView, DirectorySPAView, ApplicationsSPAView

urlpatterns = [
    path('admin/', admin.site.urls),
    path('', include("users.urls", namespace='users')),
    path('tasks/', include("tasks.urls")),
    path('chat/', include("chat.urls")),
    path('core/', include("core.urls")),
    path('workshops/', include("workshops.urls")),
    path('calendar/', include("calendar_app.urls")),

    # Browser-facing React SPAs. In order of list in settings.py TEMPLATES[0].DIRS
    path('messages/', ChatSPAView.as_view(), name="messages"),
    path('directory/', DirectorySPAView.as_view(), name="directory"),
    path('applications/', ApplicationsSPAView.as_view(), name="applications")
]
