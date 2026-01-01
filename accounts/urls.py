from django.urls import path
from .views import (
    RegisterView,
    LoginView,
    VerifyEmailView,
    ForgotPasswordView,
    ResetPasswordView,
    RefreshTokenView,
)

urlpatterns = [
    path("register/", RegisterView.as_view()),
    path("login/", LoginView.as_view()),
    path("verify-email/", VerifyEmailView.as_view()),
    path("forgot-password/", ForgotPasswordView.as_view()),
    path("reset-password/", ResetPasswordView.as_view()),
    path("token/refresh/", RefreshTokenView.as_view()),
]
