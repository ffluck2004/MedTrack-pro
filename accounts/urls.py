from django.urls import path
from .views import RegisterView, LoginView, LogoutView, google_login, me

urlpatterns = [
    path("register/", RegisterView.as_view()),
    path("login/", LoginView.as_view()),
    path("logout/", LogoutView.as_view()),
    path("google-login/", google_login),
    path("me/", me),
]
