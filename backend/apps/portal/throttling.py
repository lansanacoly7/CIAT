"""Limitations de débit pour le module Portail (Phase 9 — T1 & T2)."""
import os
from rest_framework.throttling import AnonRateThrottle


class PortalLettreAnonRateThrottle(AnonRateThrottle):
    """Limitation de débit stricte contre le spam d'inscription à la lettre d'information."""

    scope = "portal_lettre"

    def allow_request(self, request, view):
        from django.conf import settings

        if getattr(settings, "DISABLE_THROTTLING", "0") == "1" or os.getenv("DISABLE_THROTTLING", "0") == "1":
            return True
        return super().allow_request(request, view)


class PortalRechercheAnonRateThrottle(AnonRateThrottle):
    """Limitation de débit pour la recherche globale du site."""

    scope = "portal_recherche"

    def allow_request(self, request, view):
        from django.conf import settings

        if getattr(settings, "DISABLE_THROTTLING", "0") == "1" or os.getenv("DISABLE_THROTTLING", "0") == "1":
            return True
        return super().allow_request(request, view)
