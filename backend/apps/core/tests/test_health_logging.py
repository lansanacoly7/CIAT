import io
import logging
from unittest.mock import patch

from django.db import OperationalError
from django.test import SimpleTestCase, TestCase, override_settings
from rest_framework import status
from rest_framework.test import APIClient

from apps.core.logging import (
    SensitiveDataFilter,
    custom_exception_handler,
    redact_sensitive_object,
    redact_sensitive_text,
)

FAST_HASHERS = ["django.contrib.auth.hashers.MD5PasswordHasher"]


@override_settings(
    PASSWORD_HASHERS=FAST_HASHERS,
    DISABLE_THROTTLING="1",
)
class HealthEndpointTests(TestCase):
    """
    Tests de la route publique de vérification d'état : GET /api/health/
    - Renvoie 200 { status: 'ok', database: 'connected' } quand la base répond.
    - Renvoie 503 { status: 'degraded', database: 'disconnected' } si la base ne répond pas.
    - Accessible à tous sans authentification (publique).
    - Ne contient aucune donnée sensible.
    """

    def setUp(self):
        self.client = APIClient()

    def test_health_returns_200_when_database_connected(self):
        """Vérifie que l'endpoint répond HTTP 200 avec la base opérationnelle."""
        response = self.client.get("/api/health/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(
            response.json(),
            {"status": "ok", "database": "connected"},
        )

    def test_health_returns_503_when_database_unreachable(self):
        """Vérifie que l'endpoint répond HTTP 503 si la base de données est indisponible."""
        with patch("django.db.connection.cursor") as mock_cursor:
            mock_cursor.side_effect = OperationalError("Connexion à la base impossible")
            response = self.client.get("/api/health/")
            self.assertEqual(response.status_code, status.HTTP_503_SERVICE_UNAVAILABLE)
            self.assertEqual(
                response.json(),
                {"status": "degraded", "database": "disconnected"},
            )

    def test_health_is_public_without_authentication(self):
        """L'accès à /api/health/ ne requiert aucun jeton JWT ni identifiant."""
        self.client.credentials()  # Aucun en-tête d'authentification
        response = self.client.get("/api/health/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_health_payload_contains_no_sensitive_data(self):
        """Le payload JSON ne divulgue ni version de DB, ni identifiant, ni hôte."""
        response = self.client.get("/api/health/")
        data = response.json()
        self.assertEqual(set(data.keys()), {"status", "database"})
        for val in data.values():
            self.assertNotIn("postgres", str(val).lower())
            self.assertNotIn("sqlite", str(val).lower())
            self.assertNotIn("user", str(val).lower())
            self.assertNotIn("password", str(val).lower())


class LoggingSecurityAndSanitizationTests(SimpleTestCase):
    """
    Tests de la configuration de journalisation et du filtre anti-fuite.
    Garantit qu'aucun mot de passe, jeton ou secret n'apparaît dans les journaux.
    """

    def setUp(self):
        self.filter = SensitiveDataFilter()
        self.logger = logging.getLogger("test_logger_ciat")
        self.logger.setLevel(logging.INFO)
        self.stream = io.StringIO()
        self.handler = logging.StreamHandler(self.stream)
        self.handler.addFilter(self.filter)
        formatter = logging.Formatter("[%(levelname)s] %(message)s")
        self.handler.setFormatter(formatter)
        self.logger.addHandler(self.handler)

    def tearDown(self):
        self.logger.removeHandler(self.handler)

    def test_redact_sensitive_text_passwords(self):
        """Les mots de passe dans différents formats sont masqués."""
        text1 = "Connexion utilisateur avec password=MonMotDePasseSecret123!"
        self.assertNotIn("MonMotDePasseSecret123!", redact_sensitive_text(text1))
        self.assertIn("password=[MASQUÉ]", redact_sensitive_text(text1))

        text2 = 'Tentative avec mot_de_passe: "UltraSecretPass456"'
        self.assertNotIn("UltraSecretPass456", redact_sensitive_text(text2))
        self.assertIn("mot_de_passe=[MASQUÉ]", redact_sensitive_text(text2))

    def test_redact_sensitive_text_tokens_and_secrets(self):
        """Les jetons d'accès, secrets et tokens JWT sont masqués."""
        jwt_token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoxfQ.signature"
        text1 = f"Envoi de token={jwt_token}"
        cleaned1 = redact_sensitive_text(text1)
        self.assertNotIn(jwt_token, cleaned1)
        self.assertIn("token=[MASQUÉ]", cleaned1)

        text2 = f"En-tête Authorization: Bearer {jwt_token}"
        cleaned2 = redact_sensitive_text(text2)
        self.assertNotIn(jwt_token, cleaned2)
        self.assertIn("Bearer [MASQUÉ]", cleaned2)

        text3 = "Clé d'API renseignée : secret_key='ciat_live_key_999'"
        cleaned3 = redact_sensitive_text(text3)
        self.assertNotIn("ciat_live_key_999", cleaned3)
        self.assertIn("secret_key=[MASQUÉ]", cleaned3)

    def test_redact_sensitive_dict_objects(self):
        """Les dictionnaires contenant des clés sensibles sont nettoyés."""
        payload = {
            "email": "visiteur@example.com",
            "password": "PasswordToHide",
            "metadata": {
                "access_token": "token123",
                "safe_field": "valeur_sûre",
            },
        }
        cleaned = redact_sensitive_object(payload)
        self.assertEqual(cleaned["password"], "[MASQUÉ]")
        self.assertEqual(cleaned["metadata"]["access_token"], "[MASQUÉ]")
        self.assertEqual(cleaned["metadata"]["safe_field"], "valeur_sûre")
        self.assertEqual(cleaned["email"], "visiteur@example.com")

    def test_log_record_filtered_in_stream(self):
        """Un message émis via le logger ne contient aucun mot de passe dans le flux de sortie."""
        self.logger.info("Tentative de login pour user=admin password=SecretPassword987")
        output = self.stream.getvalue()
        self.assertNotIn("SecretPassword987", output)
        self.assertIn("[MASQUÉ]", output)

    def test_log_record_with_bearer_filtered(self):
        """Un en-tête Bearer émis dans un log est automatiquement nettoyé."""
        self.logger.error("Échec sur Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9")
        output = self.stream.getvalue()
        self.assertNotIn("eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9", output)
        self.assertIn("Bearer [MASQUÉ]", output)

    def test_custom_exception_handler_logs_error(self):
        """Le gestionnaire d'exception DRF consigne l'erreur applicative dans le logger."""
        with self.assertLogs("apps", level="ERROR") as cm:
            exc = ValueError("Erreur métier test avec password=Invalide")
            custom_exception_handler(exc, {"view": HealthEndpointTests()})
            self.assertTrue(any("Erreur applicative non gérée" in line for line in cm.output))
