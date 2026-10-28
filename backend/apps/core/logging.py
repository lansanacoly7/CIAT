import logging
import re
from typing import Any

logger = logging.getLogger("apps")

# Expressions régulières pour masquer les informations confidentielles
SENSITIVE_PATTERNS = [
    # 1. Jetons Bearer (ex: Authorization: Bearer <jwt> ou Bearer <jwt>)
    (
        re.compile(r"(?i)\bBearer\s+[A-Za-z0-9_\-\.]+", re.IGNORECASE),
        r"Bearer [MASQUÉ]",
    ),
    # 2. Authentification Basic (ex: Authorization: Basic <base64>)
    (
        re.compile(r"(?i)\bBasic\s+[A-Za-z0-9+/=]+", re.IGNORECASE),
        r"Basic [MASQUÉ]",
    ),
    # 3. Mots de passe dans JSON, query strings ou chaînes
    (
        re.compile(
            r'(?i)\b(password|mot_de_passe|pwd|secret|passphrase)\s*[:=]\s*["\']?([^"\'\s,;}{]+)["\']?'
        ),
        r"\1=[MASQUÉ]",
    ),
    # 4. Jetons d'authentification / tokens / clés API
    (
        re.compile(
            r'(?i)\b(token|access_token|refresh_token|api_key|secret_key)\s*[:=]\s*["\']?([^"\'\s,;}{]+)["\']?'
        ),
        r"\1=[MASQUÉ]",
    ),
]


def redact_sensitive_text(text: str) -> str:
    """Remplace les données sensibles (mots de passe, jetons, secrets) par un masque."""
    if not isinstance(text, str):
        text = str(text)
    for pattern, replacement in SENSITIVE_PATTERNS:
        text = pattern.sub(replacement, text)
    return text


def redact_sensitive_object(obj: Any) -> Any:
    """Traite récursivement dictionnaires, listes et chaînes pour masquer les données sensibles."""
    if isinstance(obj, dict):
        cleaned = {}
        for k, v in obj.items():
            k_lower = str(k).lower()
            if any(
                term in k_lower
                for term in (
                    "password",
                    "mot_de_passe",
                    "token",
                    "secret",
                    "authorization",
                )
            ):
                cleaned[k] = "[MASQUÉ]"
            else:
                cleaned[k] = redact_sensitive_object(v)
        return cleaned
    elif isinstance(obj, (list, tuple)):
        return [redact_sensitive_object(item) for item in obj]
    elif isinstance(obj, str):
        return redact_sensitive_text(obj)
    return obj


class SensitiveDataFilter(logging.Filter):
    """
    Filtre de journalisation empêchant toute fuite de mot de passe, jeton ou secret.
    S'applique automatiquement sur les messages et arguments de chaque log record.
    """

    def filter(self, record: logging.LogRecord) -> bool:
        try:
            if isinstance(record.msg, str):
                record.msg = redact_sensitive_text(record.msg)
            elif isinstance(record.msg, dict):
                record.msg = redact_sensitive_object(record.msg)

            if record.args:
                if isinstance(record.args, dict):
                    record.args = redact_sensitive_object(record.args)
                elif isinstance(record.args, (list, tuple)):
                    record.args = tuple(
                        redact_sensitive_object(arg) for arg in record.args
                    )
        except Exception:
            pass
        return True


def custom_exception_handler(exc, context):
    """
    Gestionnaire global d'exceptions DRF consignant les erreurs applicatives
    dans les journaux système sans exposer de données sensibles.
    """
    from rest_framework.views import exception_handler

    response = exception_handler(exc, context)

    view_name = "Inconnue"
    if context and "view" in context:
        view_name = getattr(
            context["view"], "__class__", type(context["view"])
        ).__name__

    if response is None:
        logger.error(
            f"Erreur applicative non gérée dans {view_name}: {exc}",
            exc_info=True,
        )
    elif response.status_code >= 500:
        logger.error(
            f"Erreur serveur {response.status_code} dans {view_name}: {exc}",
        )
    elif response.status_code >= 400:
        logger.warning(
            f"Erreur client {response.status_code} dans {view_name}: {exc}",
        )

    return response
