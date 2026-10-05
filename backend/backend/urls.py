from django.contrib import admin
from django.http import JsonResponse
from django.urls import include, path


def healthcheck(_request):
    return JsonResponse({"status": "ok"})


urlpatterns = [
    path("health/", healthcheck, name="healthcheck"),
    path("health", healthcheck, name="healthcheck_noslash"),
    path("admin/", admin.site.urls),
    # app.urls already defines its public routes with the /api/ prefix.
    path("", include("app.urls")),
    path("api/paypal/", include("payments.urls")),
]
