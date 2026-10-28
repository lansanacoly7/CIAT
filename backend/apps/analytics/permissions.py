"""Permissions pour le module d'analyse (apps.analytics).

Accès restreint au coordonnateur, à l'administrateur et aux membres du comité de sélection.
"""
from rest_framework.permissions import BasePermission

from apps.core.models import Role


class IsAnalyticsAuthorized(BasePermission):
    """Accès réservé aux utilisateurs connectés ayant le rôle Coordonnateur, Administrateur ou Membre du comité."""

    message = "Accès réservé au coordonnateur, à l'administrateur et aux membres du comité."

    def has_permission(self, request, view):
        user = getattr(request, "user", None)
        if not user or not user.is_authenticated:
            return False
        if getattr(user, "is_superuser", False):
            return True
        return getattr(user, "role", None) in (
            Role.ADMIN,
            Role.COORDONNATEUR,
            Role.COMITE,
        )
