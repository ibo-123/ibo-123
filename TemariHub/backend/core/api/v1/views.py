from django.db import connection
from rest_framework.decorators import api_view
from rest_framework import status

from core.api.responses import success_response, error_response


@api_view(["GET"])
def health_check(request):
    try:
        connection.ensure_connection()

        return success_response(
            data={
                "status": "ok",
                "database": "connected",
            },
            message="TemariHub API is healthy",
        )

    except Exception:
        return error_response(
            message="Database connection failed",
            errors={
                "database": "Unable to connect to PostgreSQL.",
            },
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
        )