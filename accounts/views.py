from django.contrib.auth import authenticate
from rest_framework.views import APIView
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework import status
from google.oauth2 import id_token
from google.auth.transport import requests as google_requests
from django.conf import settings


import requests
from .models import User
from .serializers import (
    RegisterSerializer,
    LoginSerializer,
    UserSerializer,
)

from django.contrib.auth import authenticate
from rest_framework.views import APIView
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework import status



import requests

from .models import User
from .serializers import RegisterSerializer, LoginSerializer, UserSerializer


# =========================
# REGISTER (EMAIL)
# =========================
class RegisterView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = RegisterSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        user.is_verified = False
        user.save()

        return Response(
            {"message": "Account created"},
            status=status.HTTP_201_CREATED,
        )


# =========================
# LOGIN (EMAIL)
# =========================
class LoginView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        user = authenticate(
            email=serializer.validated_data["email"],
            password=serializer.validated_data["password"],
        )

        if not user:
            return Response({"error": "Invalid credentials"}, status=400)

        refresh = RefreshToken.for_user(user)

        res = Response({
            "access": str(refresh.access_token),
            "user": UserSerializer(user).data,
        })

        # 🔐 HttpOnly cookie
        res.set_cookie(
            key="refresh",
            value=str(refresh),
            httponly=True,
            samesite="Lax",
            secure=False,  # True in production
            max_age=7 * 24 * 60 * 60,
        )

        return res


# =========================
# GOOGLE LOGIN
# =========================
# accounts/views.py
from django.contrib.auth import login
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from google.oauth2 import id_token
from google.auth.transport import requests
from django.conf import settings

from .models import User
from .serializers import UserSerializer

@api_view(["POST"])
@permission_classes([AllowAny])
def google_login(request):
    token = request.data.get("id_token")
    if not token:
        return Response({"error": "Missing token"}, status=400)

    try:
        info = id_token.verify_oauth2_token(
            token,
            requests.Request(),
            settings.GOOGLE_CLIENT_ID,
        )
    except Exception:
        return Response({"error": "Invalid token"}, status=400)

    email = info.get("email")
    name = info.get("name", "")

    user, _ = User.objects.get_or_create(
        email=email,
        defaults={"username": email.split("@")[0]},
    )

    # 🔑 THIS IS CRITICAL
    login(request, user)

    return Response({
        "user": UserSerializer(user).data
    })

# =========================
# CURRENT USER (/me)
# =========================
from rest_framework.decorators import api_view
from rest_framework.response import Response

@api_view(["GET"])
def me(request):
    if not request.user.is_authenticated:
        return Response({"detail": "Unauthorized"}, status=401)

    return Response({
        "user": {
            "id": request.user.id,
            "email": request.user.email,
            "username": request.user.username,
            "role": request.user.role,
        }
    })


# =========================
# TOKEN REFRESH (COOKIE)
# =========================
class RefreshTokenView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        refresh_token = request.COOKIES.get("refresh")

        if not refresh_token:
            return Response({"error": "No refresh token"}, status=401)

        try:
            refresh = RefreshToken(refresh_token)
            return Response({
                "access": str(refresh.access_token)
            })
        except Exception:
            return Response({"error": "Invalid refresh"}, status=401)


# =========================
# LOGOUT
# =========================
from django.contrib.auth import logout

class LogoutView(APIView):
    def post(self, request):
        logout(request)
        return Response({"message": "Logged out"})

# ========================= 
# CSRF TOKEN
# =========================

from django.http import JsonResponse
from django.views.decorators.csrf import ensure_csrf_cookie
from django.utils.decorators import method_decorator
from rest_framework.views import APIView


@method_decorator(ensure_csrf_cookie, name="dispatch")
class CsrfView(APIView):
    authentication_classes = []
    permission_classes = []

    def get(self, request):
        return JsonResponse({"detail": "CSRF cookie set"})
