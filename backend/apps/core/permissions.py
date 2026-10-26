"""Permissions par rôle, à réutiliser dans tous les modules.

Exemple :
    permission_classes = [HasRole(Role.COORDONNATEUR, Role.ADMIN)]
    permission_classes = [ReadOnlyOrRole(Role.ADMIN)]   # lecture publique, écriture réservée
"""
from rest_framework.permissions import SAFE_METHODS, BasePermission

from .models import Role


def _role(user):
    return getattr(user, "role", None) if user and user.is_authenticated else None


def HasRole(*roles):
    """Accès réservé aux utilisateurs connectés ayant l'un des rôles donnés."""

    class _HasRole(BasePermission):
        message = "Votre rôle ne permet pas cette action."

        def has_permission(self, request, view):
            return _role(request.user) in roles

    return _HasRole


def ReadOnlyOrRole(*roles):
    """Lecture ouverte à tous, écriture réservée aux rôles donnés."""

    class _ReadOnlyOrRole(BasePermission):
        message = "Seuls certains rôles peuvent modifier ces données."

        def has_permission(self, request, view):
            if request.method in SAFE_METHODS:
                return True
            return _role(request.user) in roles

    return _ReadOnlyOrRole


class IsEquipeCIAT(BasePermission):
    """Administrateur ou coordonnateur."""

    def has_permission(self, request, view):
        return _role(request.user) in (Role.ADMIN, Role.COORDONNATEUR)
