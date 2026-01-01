from django.conf import settings
from django.contrib.auth.tokens import PasswordResetTokenGenerator
from django.core.mail import send_mail
from django.urls import reverse
from django.utils.encoding import force_bytes
from django.utils.http import urlsafe_base64_encode
from rest_framework import status
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.views import TokenRefreshView
from django.utils.encoding import force_str
from django.utils.http import urlsafe_base64_decode

from .models import User
from .serializers import (
    RegisterSerializer,
    LoginSerializer,
    EmailVerificationSerializer,
    ForgotPasswordSerializer,
    ResetPasswordSerializer,
)


class RegisterView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = RegisterSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()

        uid = urlsafe_base64_encode(force_bytes(user.id))
        token = PasswordResetTokenGenerator().make_token(user)

        verify_url = f"http://localhost:5000/verify-email?uid={uid}&token={token}"

        send_mail(
            subject="Verify your MedTrack Pro account",
            message=f"Click to verify your email: {verify_url}",
            from_email=settings.EMAIL_HOST_USER,
            recipient_list=[user.email],
        )

        return Response({"message": "Verification email sent"}, status=201)


class VerifyEmailView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        serializer = EmailVerificationSerializer(data=request.query_params)
        serializer.is_valid(raise_exception=True)

        uidb64 = serializer.validated_data["uidb64"]
        token = serializer.validated_data["token"]

        try:
            uid = force_str(urlsafe_base64_decode(uidb64))
            user = User.objects.get(id=uid)
        except (TypeError, ValueError, User.DoesNotExist):
            return Response({"error": "Invalid verification link"}, status=400)

        if PasswordResetTokenGenerator().check_token(user, token):
            user.is_verified = True
            user.save()
            return Response({"message": "Email verified successfully"})

        return Response({"error": "Invalid or expired token"}, status=400)

class LoginView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        return Response(serializer.validated_data)


class ForgotPasswordView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = ForgotPasswordSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        user = User.objects.get(email=serializer.validated_data["email"])
        uid = urlsafe_base64_encode(force_bytes(user.id))
        token = PasswordResetTokenGenerator().make_token(user)

        reset_url = f"http://localhost:5000/reset-password?uid={uid}&token={token}"

        send_mail(
            subject="Reset your MedTrack Pro password",
            message=f"Reset password: {reset_url}",
            from_email=settings.EMAIL_HOST_USER,
            recipient_list=[user.email],
        )

        return Response({"message": "Password reset email sent"})


class ResetPasswordView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = ResetPasswordSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        return Response({"message": "Password reset successful"})


class RefreshTokenView(TokenRefreshView):
    permission_classes = [AllowAny]
