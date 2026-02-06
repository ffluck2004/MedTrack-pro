from django.contrib.auth import login, logout, get_user_model
from rest_framework.views import APIView
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework import status
from django.conf import settings

from google.oauth2 import id_token
from google.auth.transport import requests

from .serializers import RegisterSerializer, LoginSerializer, UserSerializer

User = get_user_model()


class RegisterView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = RegisterSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save()

        return Response({"message": "Account created"}, status=status.HTTP_201_CREATED)


class LoginView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        user = serializer.validated_data["user"]

        # ✅ creates Django session cookie
        login(request, user)

        return Response({"user": UserSerializer(user).data})


class LogoutView(APIView):
    def post(self, request):
        logout(request)
        return Response({"message": "Logged out"})


@api_view(["GET"])
def me(request):
    if not request.user.is_authenticated:
        return Response({"detail": "Unauthorized"}, status=401)

    return Response({"user": UserSerializer(request.user).data})


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
        return Response({"error": "Invalid Google token"}, status=400)

    email = info.get("email")
    sub = info.get("sub")

    if not email:
        return Response({"error": "Google did not return email"}, status=400)

    user, created = User.objects.get_or_create(
        email=email.lower(),
        defaults={
            "username": email.split("@")[0],
            "is_verified": True,
            "google_sub": sub,
            "role": "STAFF",
        },
    )

    # If user exists but google_sub missing
    if sub and getattr(user, "google_sub", None) != sub:
        user.google_sub = sub
        user.is_verified = True
        user.save()

    login(request, user)

    return Response({"user": UserSerializer(user).data})
