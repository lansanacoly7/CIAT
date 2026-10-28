import os
from rest_framework.throttling import AnonRateThrottle


class AuthRateThrottle(AnonRateThrottle):
    """Limite stricte des tentatives sur les endpoints d'authentification pour contrer la force brute."""

    scope = "auth"

    def allow_request(self, request, view):
        from django.conf import settings
        if getattr(settings, "DISABLE_THROTTLING", "0") == "1" or os.getenv("DISABLE_THROTTLING", "0") == "1":
            return True
        return super().allow_request(request, view)


class GalleryInteretRateThrottle(AnonRateThrottle):
    """Limitation de débit adaptée contre le spam pour les manifestations d'intérêt de la galerie."""

    scope = "gallery_interet"

    def allow_request(self, request, view):
        from django.conf import settings
        if getattr(settings, "DISABLE_THROTTLING", "0") == "1" or os.getenv("DISABLE_THROTTLING", "0") == "1":
            return True
        return super().allow_request(request, view)

