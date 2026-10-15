from rest_framework.permissions import SAFE_METHODS, BasePermission, IsAdminUser, IsAuthenticated


class IsAuthenticatedReadOrAdminWrite(BasePermission):
    """Authenticated users may read; only staff may mutate questions."""

    def has_permission(self, request, view):
        user = request.user
        if not user or not user.is_authenticated:
            return False
        if request.method in SAFE_METHODS:
            return True
        return bool(user.is_staff)


__all__ = [
    "IsAdminUser",
    "IsAuthenticated",
    "IsAuthenticatedReadOrAdminWrite",
]
