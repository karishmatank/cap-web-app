from django.contrib.auth import views as auth_views
from django.urls import path, reverse_lazy

from . import views

app_name = "users"
urlpatterns = [
    # Main user views
    path("", views.index, name="index"),
    
    # User creation views
    path("create/", views.create_user_get_role, name="create_user_get_role"),

    path("create/<str:role>/", views.create_user, name="create"),

    # Authentication views
    path("login/", auth_views.LoginView.as_view(
        template_name="users/login.html",
    ), name="login"),

    path("logout/", views.logout_view, name="logout"),
    
    # Password management views
    path("change-password/", views.CustomPasswordChangeView.as_view(
        template_name="users/change_password.html", 
    ), name="change_password"),

    # path("change-password/success/", auth_views.PasswordChangeDoneView.as_view(
    #     template_name="users/change_password_successful.html"
    # ), name="change_password_success"),

    # Password reset views
    path('reset-password/', views.CustomPasswordResetView.as_view(
        template_name="users/reset_password.html",
        email_template_name="users/reset_password_email.html", 
    ), name="reset_password"),

    # path('reset-password/sent/', auth_views.PasswordResetDoneView.as_view(
    #     template_name="users/reset_password_sent.html"
    # ), name="reset_password_email_sent"),

    path('reset-password/<uidb64>/<token>/', views.CustomPasswordResetConfirmView.as_view(
        template_name="users/reset_password_confirm.html",
    ), name="reset_password_confirm"),

    # path('reset-password/done/', auth_views.PasswordResetCompleteView.as_view(
    #     template_name="users/reset_password_complete.html"
    # ), name="reset_password_complete"),

    # Edit profile views
    path('edit-profile/', views.edit_profile, name='edit_profile'),

    # API views
    path("api/me/", views.get_current_user),
    path("api/search/", views.search_users_by_name),
    path("api/community-search/", views.CommunityDirectoryListView.as_view())
]