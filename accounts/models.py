from django.db import models
from django.contrib.auth.models import (
    AbstractBaseUser,
    PermissionsMixin,
    BaseUserManager,
)

# --------------------------------------------------
# Custom User Manager
# --------------------------------------------------
class UserManager(BaseUserManager):
    def create_user(self, email, username=None, password=None, **extra_fields):
        if not email:
            raise ValueError("Email is required")

        email = self.normalize_email(email)

        if not username:
            username = email.split("@")[0]

        user = self.model(
            email=email,
            username=username,
            **extra_fields,
        )
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, email, password, **extra_fields):
        extra_fields.setdefault("is_staff", True)
        extra_fields.setdefault("is_superuser", True)
        extra_fields.setdefault("is_verified", True)

        return self.create_user(email, password=password, **extra_fields)


# --------------------------------------------------
# User Model
# --------------------------------------------------
class User(AbstractBaseUser, PermissionsMixin):
    ROLE_CHOICES = (
        ("ADMIN", "Admin"),
        ("STAFF", "Staff"),
    )

    email = models.EmailField(unique=True)
    username = models.CharField(max_length=150, unique=True)

    role = models.CharField(
        max_length=10,
        choices=ROLE_CHOICES,
        default="STAFF",
    )

    # 🔑 Auth state
    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)
    is_verified = models.BooleanField(default=False)

    # 🟢 Google Auth
    google_sub = models.CharField(
        max_length=255,
        null=True,
        blank=True,
        unique=True,
    )

    date_joined = models.DateTimeField(auto_now_add=True)

    objects = UserManager()

    USERNAME_FIELD = "email"
    REQUIRED_FIELDS = []

    def __str__(self):
        return self.email
