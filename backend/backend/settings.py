"""Settings for the Django API, usable locally and on Vercel."""

import os
from pathlib import Path

import dj_database_url

BASE_DIR = Path(__file__).resolve().parent.parent


def env_list(name, default=""):
    return [value.strip().rstrip("/") for value in os.getenv(name, default).split(",") if value.strip()]


DEBUG = os.getenv("DEBUG", "False").lower() in {"1", "true", "yes"}
SECRET_KEY = os.getenv("DJANGO_SECRET_KEY", "unsafe-development-key-change-me")

# VERCEL_URL has no protocol. Add the stable custom domain through ALLOWED_HOSTS.
ALLOWED_HOSTS = env_list("ALLOWED_HOSTS", "localhost,127.0.0.1")
if os.getenv("VERCEL_URL"):
    ALLOWED_HOSTS.append(os.environ["VERCEL_URL"])

INSTALLED_APPS = [
    "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",
    "rest_framework",
    "corsheaders",
    "app",
    "payments",
]

MIDDLEWARE = [
    "django.middleware.security.SecurityMiddleware",
    "corsheaders.middleware.CorsMiddleware",
    "django.contrib.sessions.middleware.SessionMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
]

ROOT_URLCONF = "backend.urls"
WSGI_APPLICATION = "backend.wsgi.application"
ASGI_APPLICATION = "backend.asgi.application"

TEMPLATES = [{
    "BACKEND": "django.template.backends.django.DjangoTemplates",
    "DIRS": [],
    "APP_DIRS": True,
    "OPTIONS": {"context_processors": [
        "django.template.context_processors.debug",
        "django.template.context_processors.request",
        "django.contrib.auth.context_processors.auth",
        "django.contrib.messages.context_processors.messages",
    ]},
}]

# A serverless function cannot use the old localhost MySQL instance. Set DATABASE_URL
# on Vercel to a managed Postgres/MySQL database URL. SQLite is local-development only.
DATABASES = {
    "default": dj_database_url.config(
        default=f"sqlite:///{BASE_DIR / 'db.sqlite3'}",
        conn_max_age=600,
        conn_health_checks=True,
    )
}

AUTH_PASSWORD_VALIDATORS = [
    {"NAME": "django.contrib.auth.password_validation.UserAttributeSimilarityValidator"},
    {"NAME": "django.contrib.auth.password_validation.MinimumLengthValidator"},
    {"NAME": "django.contrib.auth.password_validation.CommonPasswordValidator"},
    {"NAME": "django.contrib.auth.password_validation.NumericPasswordValidator"},
]

LANGUAGE_CODE = "en-us"
TIME_ZONE = "UTC"
USE_I18N = True
USE_TZ = True

STATIC_URL = "/static/"
STATIC_ROOT = BASE_DIR / "staticfiles"
MEDIA_URL = "/audio/"
MEDIA_ROOT = BASE_DIR / "audio"
DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"

# Set the deployed frontend URL in CORS_ALLOWED_ORIGINS, for example:
# https://spotify-frontend.vercel.app
CORS_ALLOWED_ORIGINS = env_list("CORS_ALLOWED_ORIGINS", "http://localhost:5173")
CORS_ALLOW_CREDENTIALS = True
CSRF_TRUSTED_ORIGINS = env_list("CSRF_TRUSTED_ORIGINS", os.getenv("CORS_ALLOWED_ORIGINS", "http://localhost:5173"))

SECURE_PROXY_SSL_HEADER = ("HTTP_X_FORWARDED_PROTO", "https")
SECURE_SSL_REDIRECT = os.getenv("VERCEL") == "1"
SESSION_COOKIE_SECURE = os.getenv("VERCEL") == "1"
CSRF_COOKIE_SECURE = os.getenv("VERCEL") == "1"

PAYPAL_CLIENT_ID = os.getenv("PAYPAL_CLIENT_ID", "")
PAYPAL_CLIENT_SECRET = os.getenv("PAYPAL_CLIENT_SECRET", "")
PAYPAL_MODE = os.getenv("PAYPAL_MODE", "sandbox")
