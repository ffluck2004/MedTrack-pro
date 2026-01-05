from django.contrib.auth import authenticate
from django.contrib.auth.tokens import PasswordResetTokenGenerator
from django.utils.encoding import force_str, force_bytes
from django.utils.http import urlsafe_base64_decode, urlsafe_base64_encode
from django.core.mail import send_mail

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny
from rest_framework import status
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.views import TokenRefreshView

from .models import User
from .serializers import (
    RegisterSerializer,
    LoginSerializer,
    UserSerializer,
    EmailVerificationSerializer,
)

# =========================
# REGISTER
# =========================
class RegisterView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = RegisterSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(
            {"message": "Account created. Please verify your email."},
            status=status.HTTP_201_CREATED,
        )


# =========================
# LOGIN
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

        if not user.is_verified:
            return Response({"error": "Email not verified"}, status=400)

        refresh = RefreshToken.for_user(user)

        return Response(
            {
                "access": str(refresh.access_token),
                "refresh": str(refresh),
                "user": UserSerializer(user).data,
            },
            status=200,
        )


# =========================
# EMAIL VERIFICATION
# =========================
class VerifyEmailView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        serializer = EmailVerificationSerializer(data=request.query_params)
        serializer.is_valid(raise_exception=True)

        try:
            uid = force_str(urlsafe_base64_decode(serializer.validated_data["uidb64"]))
            user = User.objects.get(id=uid)
        except Exception:
            return Response({"error": "Invalid link"}, status=400)

        if PasswordResetTokenGenerator().check_token(
            user, serializer.validated_data["token"]
        ):
            user.is_verified = True
            user.save()
            return Response({"message": "Email verified successfully"}, status=200)

        return Response({"error": "Invalid or expired token"}, status=400)


# =========================
# FORGOT PASSWORD
# =========================
class ForgotPasswordView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        email = request.data.get("email")

        if not email:
            return Response({"error": "Email required"}, status=400)

        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            return Response(
                {"message": "If the email exists, a reset link was sent"},
                status=200,
            )

        uidb64 = urlsafe_base64_encode(force_bytes(user.id))
        token = PasswordResetTokenGenerator().make_token(user)

        reset_link = f"http://localhost:5000/reset-password?uid={uidb64}&token={token}"

        send_mail(
            subject="Reset your MedTrack Pro password",
            message=f"Click the link to reset your password:\n{reset_link}",
            from_email=None,
            recipient_list=[user.email],
        )

        return Response({"message": "Password reset email sent"}, status=200)


# =========================
# RESET PASSWORD
# =========================
class ResetPasswordView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        uidb64 = request.data.get("uid")
        token = request.data.get("token")
        password = request.data.get("password")

        if not all([uidb64, token, password]):
            return Response({"error": "Invalid request"}, status=400)

        try:
            uid = force_str(urlsafe_base64_decode(uidb64))
            user = User.objects.get(id=uid)
        except Exception:
            return Response({"error": "Invalid link"}, status=400)

        if not PasswordResetTokenGenerator().check_token(user, token):
            return Response({"error": "Invalid or expired token"}, status=400)

        user.set_password(password)
        user.save()

        return Response({"message": "Password reset successful"}, status=200)


# =========================
# JWT REFRESH (SIMPLEJWT)
# =========================
class RefreshTokenView(TokenRefreshView):
    permission_classes = [AllowAny]
