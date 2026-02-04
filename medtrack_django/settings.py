# medtrack_django/settings.py
from pathlib import Path
from datetime import timedelta
import os

BASE_DIR = Path(__file__).resolve().parent.parent

SECRET_KEY = "CHANGE_THIS_SECRET_KEY"
DEBUG = True

ALLOWED_HOSTS = ["127.0.0.1", "localhost"]

INSTALLED_APPS = [
    "corsheaders",  # must be above django.middleware
    "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",

    "rest_framework",

    "accounts",
    "api",
]

MIDDLEWARE = [
    "corsheaders.middleware.CorsMiddleware",  # <-- MUST be first
    "django.middleware.security.SecurityMiddleware",
    "django.contrib.sessions.middleware.SessionMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
]

ROOT_URLCONF = "medtrack_django.urls"

TEMPLATES = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        "DIRS": [],
        "APP_DIRS": True,
        "OPTIONS": {
            "context_processors": [
                "django.template.context_processors.debug",
                "django.template.context_processors.request",
                "django.contrib.auth.context_processors.auth",
                "django.contrib.messages.context_processors.messages",
            ],
        },
    },
]

WSGI_APPLICATION = "medtrack_django.wsgi.application"

DATABASES = {
    "default": {
        "ENGINE": "django.db.backends.sqlite3",
        "NAME": BASE_DIR / "db.sqlite3",
    }
}

AUTH_USER_MODEL = "accounts.User"
AUTH_PASSWORD_VALIDATORS = []

LANGUAGE_CODE = "en-us"
TIME_ZONE = "Asia/Kolkata"
USE_I18N = True
USE_TZ = True

STATIC_URL = "/static/"
DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"
# ---------------------------
# REST FRAMEWORK
# ---------------------------

REST_FRAMEWORK = {
    "DEFAULT_AUTHENTICATION_CLASSES": (
        "rest_framework.authentication.SessionAuthentication",
    ),
}


# ---------------------------
# Google OAuth client id (used server-side if needed)
# ---------------------------
GOOGLE_CLIENT_ID = "371449211399-59bpqpbu0b19lp0lp08i2pbf34t4f13c.apps.googleusercontent.com"

# ---------------------------
# CORS / CSRF / SESSION (DEV local)
# ---------------------------
# IMPORTANT: when using cookies/credentials you MUST list explicit origins below.
CORS_ALLOWED_ORIGINS = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:5000",
    "http://127.0.0.1:5000",
]

CORS_ALLOW_CREDENTIALS = True

# Trusted origins for CSRF — must match the frontend origin(s)
CSRF_TRUSTED_ORIGINS = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:5000",
    "http://127.0.0.1:5000",
]

# Session / cookie policy (dev)
SESSION_COOKIE_SAMESITE = "Lax"
SESSION_COOKIE_SECURE = False     # True in production (HTTPS)
SESSION_COOKIE_HTTPONLY = True

CSRF_COOKIE_SAMESITE = "Lax"
CSRF_COOKIE_SECURE = False        # True in production
CSRF_COOKIE_HTTPONLY = False      # must be readable by JS if you read token from cookie

# Optional: cookie lifetime for session (default Django session expiry works fine)
# SESSION_COOKIE_AGE = 7 * 24 * 60 * 60
