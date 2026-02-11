from rest_framework import serializers
from django.contrib.auth import authenticate, get_user_model

User = get_user_model()


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ("id", "email", "username", "role", "is_verified")


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=6)

    class Meta:
        model = User
        fields = ("email", "username", "password", "role")

    def validate_email(self, value):
        value = value.lower().strip()
        if User.objects.filter(email=value).exists():
            raise serializers.ValidationError("Email already exists")
        return value

    def validate_username(self, value):
        value = value.strip()
        if User.objects.filter(username=value).exists():
            raise serializers.ValidationError("Username already taken")
        return value

    def create(self, validated_data):
        # ✅ since you don't have email OTP system, verify by default
        return User.objects.create_user(
            email=validated_data["email"],
            username=validated_data["username"],
            password=validated_data["password"],
            role=validated_data.get("role", "STAFF"),
            is_verified=True,
        )

class LoginSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True)

    def validate(self, attrs):
        email = attrs.get("email", "").lower().strip()
        password = attrs.get("password", "")

        # ✅ correct authenticate call
        user = authenticate(username=email, password=password)

        if not user:
            raise serializers.ValidationError("Invalid email or password")

        if not user.is_active:
            raise serializers.ValidationError("Account disabled")

        if not user.is_verified:
            raise serializers.ValidationError("Account not verified")

        attrs["user"] = user
        return attrs
