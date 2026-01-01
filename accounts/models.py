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
    def create_user(self, email, username, phone, password=None, role="STAFF"):
        if not email:
            raise ValueError("User must have an email address")
        if not username:
            raise ValueError("User must have a username")
        if not phone:
            raise ValueError("User must have a phone number")

        email = self.normalize_email(email)
        user = self.model(
            email=email,
            username=username,
            phone=phone,
            role=role,
        )
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, email, username, phone, password):
        user = self.create_user(
            email=email,
            username=username,
            phone=phone,
            password=password,
            role="ADMIN",
        )
        user.is_staff = True
        user.is_superuser = True
        user.is_verified = True
        user.save(using=self._db)
        return user


# --------------------------------------------------
# Custom User Model
# --------------------------------------------------
class User(AbstractBaseUser, PermissionsMixin):
    ROLE_CHOICES = (
        ("ADMIN", "Admin"),
        ("STAFF", "Staff"),
    )

    email = models.EmailField(unique=True)
    username = models.CharField(max_length=150, unique=True)
    phone = models.CharField(max_length=15)
    role = models.CharField(max_length=10, choices=ROLE_CHOICES, default="STAFF")

    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)
    is_verified = models.BooleanField(default=False)

    date_joined = models.DateTimeField(auto_now_add=True)

    objects = UserManager()

    USERNAME_FIELD = "email"
    REQUIRED_FIELDS = ["username", "phone"]

    def __str__(self):
        return self.email
