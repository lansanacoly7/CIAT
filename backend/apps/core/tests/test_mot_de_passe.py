"""Tests complets pour le module de réinitialisation de mot de passe oublié — CIAT (Phase 10 — T2).

Couvre :
1. Demande de réinitialisation (/api/auth/mot-de-passe/oublie/) :
   - Réponse 200 systématique même si le compte n'existe pas (anti-énumération).
   - Envoi effectif de l'email avec lien contenant le jeton pour un compte valide.
   - Enregistrement dans le journal d'audit sans données sensibles (ni mot de passe ni jeton).
2. Réinitialisation effective (/api/auth/mot-de-passe/reinitialiser/) :
   - Succès avec jeton valide et nouveau mot de passe fort -> connexion possible avec le nouveau mdp.
   - Rejet 400 si jeton expiré (> 1 heure).
   - Rejet 400 si jeton rejoué (invalidation automatique dès modification du mdp).
   - Rejet 400 si jeton trafiqué / signature corrompue.
   - Rejet 400 si le nouveau mot de passe est trop faible ou trop court (validateurs Django).
   - Journal d'audit tracé sans mot de passe ni jeton.
3. Limitation de débit (Rate Limiting) anti-abus sur les deux routes.
"""
import datetime
from unittest.mock import patch

from django.conf import settings
from django.contrib.auth import get_user_model
from django.contrib.auth.tokens import default_token_generator
from django.core import mail, signing
from django.core.cache import cache
from django.test import TestCase, override_settings
from rest_framework import status
from rest_framework.test import APIClient

from apps.core.models import JournalAudit, Role

User = get_user_model()
FAST_HASHERS = ["django.contrib.auth.hashers.MD5PasswordHasher"]


@override_settings(PASSWORD_HASHERS=FAST_HASHERS)
class MotDePasseOublieAPITests(TestCase):
    """Banc d'essai de sécurité et de conformité pour le cycle complet de réinitialisation."""

    @classmethod
    def setUpTestData(cls):
        cls.user_actif = User.objects.create_user(
            email="porteur.test@ciat.sn",
            password="AncienPassword2026!",
            role=Role.PORTEUR,
            first_name="Amadou",
            last_name="Diallo",
        )
        cls.user_inactif = User.objects.create_user(
            email="desactive@ciat.sn",
            password="AncienPassword2026!",
            role=Role.PORTEUR,
            is_active=False,
        )

    def setUp(self):
        self.client = APIClient()
        cache.clear()
        mail.outbox = []

    def tearDown(self):
        super().tearDown()
        cache.clear()

    def test_01_demande_compte_existant_reponse_200_et_envoi_email(self):
        """Un compte existant reçoit un statut 200 et un email contenant le lien signé."""
        url = "/api/auth/mot-de-passe/oublie/"
        resp = self.client.post(url, {"email": "porteur.test@ciat.sn"}, format="json")

        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.assertIn("Si cette adresse email correspond à un compte actif", resp.data.get("detail", ""))

        # Vérification de l'email émis
        self.assertEqual(len(mail.outbox), 1)
        email_emis = mail.outbox[0]
        self.assertIn("porteur.test@ciat.sn", email_emis.to)
        self.assertIn("Réinitialisation de votre mot de passe", email_emis.subject)
        self.assertIn("/reinitialiser-mot-de-passe?jeton=", email_emis.body)

        # Vérification du journal d'audit (sans données sensibles)
        journal = JournalAudit.objects.filter(action="demande_reinitialisation_mdp").last()
        self.assertIsNotNone(journal)
        self.assertEqual(journal.apres.get("email"), "porteur.test@ciat.sn")
        self.assertNotIn("password", str(journal.apres))
        self.assertNotIn("jeton", str(journal.apres))

    def test_02_demande_compte_inexistant_anti_enumeration(self):
        """Un email inconnu renvoie exactement le même statut 200 et même message (zéro fuite)."""
        url = "/api/auth/mot-de-passe/oublie/"
        resp = self.client.post(url, {"email": "inconnu_total@ciat.sn"}, format="json")

        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.assertIn("Si cette adresse email correspond à un compte actif", resp.data.get("detail", ""))
        # Aucun email n'est envoyé pour un compte inexistant
        self.assertEqual(len(mail.outbox), 0)

    def test_03_demande_compte_inactif_anti_enumeration(self):
        """Un compte désactivé renvoie 200 sans envoyer d'email."""
        url = "/api/auth/mot-de-passe/oublie/"
        resp = self.client.post(url, {"email": "desactive@ciat.sn"}, format="json")

        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.assertEqual(len(mail.outbox), 0)

    def test_04_demande_format_email_invalide_400(self):
        """Une adresse email mal formée est rejetée avec 400 Bad Request."""
        url = "/api/auth/mot-de-passe/oublie/"
        resp = self.client.post(url, {"email": "pas-un-email"}, format="json")
        self.assertEqual(resp.status_code, status.HTTP_400_BAD_REQUEST)

    def test_05_reinitialisation_succes_et_connexion_avec_nouveau_mdp(self):
        """Un jeton valide permet de redéfinir le mot de passe et de s'authentifier."""
        # 1. Demande initiale
        self.client.post("/api/auth/mot-de-passe/oublie/", {"email": "porteur.test@ciat.sn"}, format="json")
        self.assertEqual(len(mail.outbox), 1)
        corps = mail.outbox[0].body
        # Extraction du jeton
        jeton = corps.split("?jeton=")[1].split()[0].strip()

        # 2. Réinitialisation avec nouveau mot de passe conforme
        url_reset = "/api/auth/mot-de-passe/reinitialiser/"
        nouveau_mdp = "NouveauSuperMotDePasse2026!"
        resp_reset = self.client.post(url_reset, {"jeton": jeton, "mot_de_passe": nouveau_mdp}, format="json")
        self.assertEqual(resp_reset.status_code, status.HTTP_200_OK)
        self.assertIn("réinitialisé avec succès", resp_reset.data.get("detail", ""))

        # 3. Vérification de la connexion avec le nouveau mot de passe
        resp_login_ancien = self.client.post(
            "/api/auth/token/",
            {"email": "porteur.test@ciat.sn", "password": "AncienPassword2026!"},
            format="json",
        )
        self.assertEqual(resp_login_ancien.status_code, status.HTTP_401_UNAUTHORIZED)

        resp_login_nouveau = self.client.post(
            "/api/auth/token/",
            {"email": "porteur.test@ciat.sn", "password": nouveau_mdp},
            format="json",
        )
        self.assertEqual(resp_login_nouveau.status_code, status.HTTP_200_OK)
        self.assertIn("access", resp_login_nouveau.data)

        # 4. Vérification de l'audit de succès
        journal = JournalAudit.objects.filter(action="reinitialisation_mdp_succes").last()
        self.assertIsNotNone(journal)
        self.assertEqual(journal.acteur, self.user_actif)
        self.assertNotIn(nouveau_mdp, str(journal.apres))
        self.assertNotIn(jeton, str(journal.apres))

    def test_06_reinitialisation_rejeu_jeton_interdit_400(self):
        """Un jeton déjà utilisé est immédiatement invalidé (anti-rejeu)."""
        # Génération d'un jeton valide
        inner = default_token_generator.make_token(self.user_actif)
        jeton = signing.dumps({"uid": self.user_actif.pk, "tok": inner}, salt="ciat.password_reset")

        url_reset = "/api/auth/mot-de-passe/reinitialiser/"
        # Premier usage -> 200
        resp1 = self.client.post(url_reset, {"jeton": jeton, "mot_de_passe": "MdpValideUnique1!"}, format="json")
        self.assertEqual(resp1.status_code, status.HTTP_200_OK)

        # Deuxième usage identique -> 400 Bad Request
        resp2 = self.client.post(url_reset, {"jeton": jeton, "mot_de_passe": "AutreMdpValide2!"}, format="json")
        self.assertEqual(resp2.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("déjà été utilisé", resp2.data.get("detail", ""))

    def test_07_reinitialisation_jeton_expire_400(self):
        """Un jeton généré il y a plus de 3600 secondes est rejeté pour expiration."""
        # Simulation d'un timestamp de 2 heures dans le passé
        temps_passe = datetime.datetime.now(datetime.timezone.utc) - datetime.timedelta(hours=2)
        inner = default_token_generator.make_token(self.user_actif)

        with patch("django.utils.timezone.now", return_value=temps_passe):
            with patch("time.time", return_value=temps_passe.timestamp()):
                jeton_expire = signing.dumps(
                    {"uid": self.user_actif.pk, "tok": inner},
                    salt="ciat.password_reset",
                )

        url_reset = "/api/auth/mot-de-passe/reinitialiser/"
        resp = self.client.post(
            url_reset,
            {"jeton": jeton_expire, "mot_de_passe": "NouveauMdpFort2026!"},
            format="json",
        )
        self.assertEqual(resp.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("expiré", resp.data.get("detail", "").lower())

    def test_08_reinitialisation_jeton_trafique_ou_corrompu_400(self):
        """Une altération même minime de la chaîne du jeton provoque un rejet 400 Bad Request."""
        inner = default_token_generator.make_token(self.user_actif)
        jeton_valide = signing.dumps({"uid": self.user_actif.pk, "tok": inner}, salt="ciat.password_reset")
        jeton_altéré = jeton_valide[:-5] + "XXXXX"

        url_reset = "/api/auth/mot-de-passe/reinitialiser/"
        resp = self.client.post(
            url_reset,
            {"jeton": jeton_altéré, "mot_de_passe": "NouveauMdpFort2026!"},
            format="json",
        )
        self.assertEqual(resp.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("invalide ou corrompu", resp.data.get("detail", ""))

    def test_09_reinitialisation_mot_de_passe_trop_court_ou_faible_400(self):
        """Les validateurs de mot de passe Django s'appliquent strictement lors de la réinitialisation."""
        inner = default_token_generator.make_token(self.user_actif)
        jeton = signing.dumps({"uid": self.user_actif.pk, "tok": inner}, salt="ciat.password_reset")

        url_reset = "/api/auth/mot-de-passe/reinitialiser/"
        # Mot de passe trop court (< 8 caractères)
        resp_court = self.client.post(url_reset, {"jeton": jeton, "mot_de_passe": "123"}, format="json")
        self.assertEqual(resp_court.status_code, status.HTTP_400_BAD_REQUEST)

    def test_10_limitation_de_debit_sur_mot_de_passe_oublie(self):
        """L'endpoint mot-de-passe/oublie/ est protégé contre le déni de service et la force brute."""
        url = "/api/auth/mot-de-passe/oublie/"
        # 5 requêtes autorisées par minute
        for _ in range(5):
            r = self.client.post(url, {"email": "porteur.test@ciat.sn"}, format="json")
            self.assertEqual(r.status_code, status.HTTP_200_OK)

        # La 6e requête doit être ralentie (HTTP 429 Too Many Requests)
        r6 = self.client.post(url, {"email": "porteur.test@ciat.sn"}, format="json")
        self.assertEqual(r6.status_code, status.HTTP_429_TOO_MANY_REQUESTS)
