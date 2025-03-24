from django.contrib.auth import views as auth_views
from django.urls import path, reverse_lazy

from . import views

app_name = "users"
urlpatterns = [
    path("", views.index, name="index"),
    path("login", views.login_view, name="login"),
    path("logout", views.logout_view, name="logout"),
    path("create", views.create_user, name="create"),
    path("change-password", auth_views.PasswordChangeView.as_view(
        template_name="users/change_password.html", 
        success_url=reverse_lazy('users:change_password_success')
    ), name="change_password"),
    path("change-password/success", auth_views.PasswordChangeDoneView.as_view(
        template_name="users/change_password_successful.html"
    ), name="change_password_success")
]