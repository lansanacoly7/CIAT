import os
from rest_framework.throttling import AnonRateThrottle


class AuthRateThrottle(AnonRateThrottle):
    """Limite stricte des tentatives sur les endpoints d'authentification pour contrer la force brute."""

    scope = "auth"

    def allow_request(self, request, view):
        if os.getenv("DISABLE_THROTTLING", "0") == "1":
            return True
        return super().allow_request(request, view)
