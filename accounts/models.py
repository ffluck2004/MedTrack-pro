from django.db import models
from django.contrib.auth.models import AbstractBaseUser, PermissionsMixin, BaseUserManager


class UserManager(BaseUserManager):
    def create_user(self, email, username=None, password=None, **extra_fields):
        if not email:
            raise ValueError("Email is required")

        email = self.normalize_email(email)

        if not username:
            username = email.split("@")[0]

        user = self.model(email=email, username=username, **extra_fields)

        # ✅ If password is not provided (Google users)
        if password:
            user.set_password(password)
        else:
            user.set_unusable_password()

        user.save(using=self._db)
        return user

    def create_superuser(self, email, password=None, **extra_fields):
        extra_fields.setdefault("is_staff", True)
        extra_fields.setdefault("is_superuser", True)
        extra_fields.setdefault("is_verified", True)
        extra_fields.setdefault("role", "ADMIN")

        # ✅ SUPERUSER MUST HAVE PASSWORD
        if not password:
            raise ValueError("Superuser must have a password")

        return self.create_user(email=email, username=email.split("@")[0], password=password, **extra_fields)


class User(AbstractBaseUser, PermissionsMixin):
    ROLE_CHOICES = (
        ("ADMIN", "Admin"),
        ("STAFF", "Staff"),
    )

    email = models.EmailField(unique=True)
    username = models.CharField(max_length=150, unique=True)

    role = models.CharField(max_length=10, choices=ROLE_CHOICES, default="STAFF")

    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)
    is_verified = models.BooleanField(default=False)

    # Google Auth
    google_sub = models.CharField(max_length=255, null=True, blank=True, unique=True)

    date_joined = models.DateTimeField(auto_now_add=True)

    objects = UserManager()

    USERNAME_FIELD = "email"
    REQUIRED_FIELDS = []

    def __str__(self):
        return self.email
