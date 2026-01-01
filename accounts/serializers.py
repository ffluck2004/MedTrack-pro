from django.contrib.auth import authenticate
from django.contrib.auth.tokens import PasswordResetTokenGenerator
from django.utils.encoding import force_str
from django.utils.http import urlsafe_base64_decode
from rest_framework import serializers
from rest_framework_simplejwt.tokens import RefreshToken

from .models import User


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=8)

    class Meta:
        model = User
        fields = ("email", "username", "phone", "password", "role")

    def validate_role(self, value):
        if value not in ["ADMIN", "STAFF"]:
            raise serializers.ValidationError("Invalid role")
        return value

    def create(self, validated_data):
        user = User.objects.create_user(
            email=validated_data["email"],
            username=validated_data["username"],
            phone=validated_data["phone"],
            password=validated_data["password"],
            role=validated_data["role"],
        )
        user.is_active = True
        user.is_verified = False
        user.save()
        return user


class LoginSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True)

    def validate(self, data):
        user = authenticate(email=data["email"], password=data["password"])
        if not user:
            raise serializers.ValidationError("Invalid credentials")
        if not user.is_verified:
            raise serializers.ValidationError("Email not verified")

        refresh = RefreshToken.for_user(user)

        return {
            "access": str(refresh.access_token),
            "refresh": str(refresh),
            "user": {
                "email": user.email,
                "username": user.username,
                "role": user.role,
            },
        }


class EmailVerificationSerializer(serializers.Serializer):
    token = serializers.CharField()
    uidb64 = serializers.CharField()


class ForgotPasswordSerializer(serializers.Serializer):
    email = serializers.EmailField()


class ResetPasswordSerializer(serializers.Serializer):
    password = serializers.CharField(write_only=True, min_length=8)
    token = serializers.CharField()
    uidb64 = serializers.CharField()

    def validate(self, attrs):
        try:
            uid = force_str(urlsafe_base64_decode(attrs["uidb64"]))
            user = User.objects.get(id=uid)
            if not PasswordResetTokenGenerator().check_token(user, attrs["token"]):
                raise serializers.ValidationError("Invalid or expired token")
            user.set_password(attrs["password"])
            user.save()
            return user
        except Exception:
            raise serializers.ValidationError("Invalid reset link")
