from rest_framework import serializers
from django.contrib.auth import authenticate
from .models import User


# --------------------------------------------------
# USER SERIALIZER
# --------------------------------------------------
class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ("id", "email", "username", "role")


# --------------------------------------------------
# REGISTER (EMAIL)
# --------------------------------------------------
class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)

    class Meta:
        model = User
        fields = ("email", "username", "password", "role")

    def create(self, validated_data):
        return User.objects.create_user(
            email=validated_data["email"],
            username=validated_data["username"],
            password=validated_data["password"],
            role=validated_data.get("role", "STAFF"),
        )


# --------------------------------------------------
# LOGIN (EMAIL)
# --------------------------------------------------
class LoginSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True)


# --------------------------------------------------
# GOOGLE LOGIN
# --------------------------------------------------
class GoogleLoginSerializer(serializers.Serializer):
    id_token = serializers.CharField()
