from rest_framework.throttling import AnonRateThrottle


class AuthRateThrottle(AnonRateThrottle):
    """Limite stricte des tentatives sur les endpoints d'authentification pour contrer la force brute."""

    scope = "auth"
