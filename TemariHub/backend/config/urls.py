from django.contrib import admin
from django.urls import include, path

urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/v1/", include("core.api.v1.urls")),
    path("api/v1/auth/", include("authentication.urls")),
    path("api/v1/students/", include("users.urls")),
    path("api/v1/curriculum/", include("curriculum.urls")),
    path("api/v1/dashboard/", include("dashboard.urls")),
    path("api/v1/questions/", include("questions.urls")),
    path("api/v1/diagnostic/", include("diagnostics.urls")),
]