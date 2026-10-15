from rest_framework.views import exception_handler
from rest_framework.response import Response


def custom_exception_handler(exc, context):
    response = exception_handler(exc, context)

    if response is None:
        return Response(
            {
                "success": False,
                "message": "An unexpected error occurred.",
                "errors": {},
            },
            status=500,
        )

    errors = response.data

    if isinstance(errors, dict) and "detail" in errors:
        message = errors["detail"]
        errors = {}
    else:
        message = "Request failed."

    return Response(
        {
            "success": False,
            "message": str(message),
            "errors": errors,
        },
        status=response.status_code,
    )