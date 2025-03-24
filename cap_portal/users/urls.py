from django.contrib.auth import views as auth_views
from django.urls import path, reverse_lazy

from . import views

app_name = "users"
urlpatterns = [
    path("", views.index, name="index"),
    path("login", auth_views.LoginView.as_view(
        template_name="users/login.html",
        next_page=reverse_lazy("users:index")
    ), name="login"),
    path("logout", views.logout_view, name="logout"),
    path("create", views.create_user, name="create"),
    path("change-password", auth_views.PasswordChangeView.as_view(
        template_name="users/change_password.html", 
        success_url=reverse_lazy('users:change_password_success')
    ), name="change_password"),
    path("change-password/success", auth_views.PasswordChangeDoneView.as_view(
        template_name="users/change_password_successful.html"
    ), name="change_password_success"),
    path('reset-password', auth_views.PasswordResetView.as_view(
        template_name="users/change_password.html",
        email_template_name="users/reset_password_email.html", 
        success_url=reverse_lazy('users:reset_password_email_sent')
    ), name="reset_password"),
    path('reset-password/sent', auth_views.PasswordResetDoneView.as_view(
        template_name="users/reset_password_sent.html"
    ), name="reset_password_email_sent"),
    path('reset-password/<uidb64>/<token>', auth_views.PasswordResetConfirmView.as_view(
        template_name="users/reset_password_confirm.html",
        success_url=reverse_lazy("users:reset_password_complete")
    ), name="reset_password_confirm"),
    path('reset-password/done', auth_views.PasswordResetCompleteView.as_view(
        template_name="users/reset_password_complete.html"
    ), name="reset_password_complete")
]