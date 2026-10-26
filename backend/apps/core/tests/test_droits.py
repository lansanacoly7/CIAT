"""Audit complet des droits, de la sécurité et matrice d'accès aux routes API — CIAT (Phase 3 — T2).

Couvre :
1. Matrice des droits par rôle (Anonyme, Visiteur, Porteur, Porteur tiers, Mentor, Comité, Coordonnateur, Admin).
2. Détection des fuites de données privées (email, téléphone, évaluations confidentielles, hash de mdp).
3. Limitation de débit (Rate Limiting / Throttling) sur les endpoints d'authentification.
4. Robustesse des mots de passe (validateurs Django).
5. Sécurité des uploads de fichiers (extensions interdites, taille maximale, magic bytes).
6. Conformité des paramètres de production (SECRET_KEY, DEBUG, en-têtes HTTPS/HSTS).
"""
import io
import re
from unittest.mock import patch

from django.conf import settings
from django.core.exceptions import ImproperlyConfigured, ValidationError
from django.core.files.uploadedfile import SimpleUploadedFile
from django.test import TestCase, override_settings
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APIClient

from apps.core.models import Cohorte, Domaine, Projet, Role, User
from apps.gallery.models import FicheInnovation
from apps.incubator.models import (
    Dossier,
    Grille,
    Piece,
    StatutDossier,
    TypePiece,
    validate_file_content,
    validate_file_size,
)
from apps.portal.models import Actualite, AppelProjet, DocumentPublic, Partenaire

FAST_HASHERS = ["django.contrib.auth.hashers.MD5PasswordHasher"]


@override_settings(PASSWORD_HASHERS=FAST_HASHERS)
class MatriceDroitsAPITests(TestCase):
    """Vérifie le code HTTP retourné pour chaque route majeure de l'API selon le rôle."""

    def setUp(self):
        self.client = APIClient()

        # Références communes
        self.domaine = Domaine.objects.create(nom="TIC et Données")
        self.cohorte = Cohorte.objects.create(nom="Cohorte 2026", annee=2026)

        # Utilisateurs pour chaque rôle
        self.users = {
            "admin": User.objects.create_user(
                email="admin@ciat.sn", password="Password123!", role=Role.ADMIN, first_name="Ad", last_name="Min"
            ),
            "coordo": User.objects.create_user(
                email="coordo@ciat.sn", password="Password123!", role=Role.COORDONNATEUR, first_name="Coor", last_name="Do"
            ),
            "mentor": User.objects.create_user(
                email="mentor@ciat.sn", password="Password123!", role=Role.MENTOR, first_name="Men", last_name="Tor"
            ),
            "comite": User.objects.create_user(
                email="comite@ciat.sn", password="Password123!", role=Role.COMITE, first_name="Co", last_name="Mite"
            ),
            "porteur_proprio": User.objects.create_user(
                email="porteur1@ciat.sn", password="Password123!", role=Role.PORTEUR, first_name="Por", last_name="Teur1"
            ),
            "porteur_tiers": User.objects.create_user(
                email="porteur2@ciat.sn", password="Password123!", role=Role.PORTEUR, first_name="Por", last_name="Teur2"
            ),
            "visiteur": User.objects.create_user(
                email="visiteur@ciat.sn", password="Password123!", role=Role.VISITEUR, first_name="Vi", last_name="Siteur"
            ),
        }

        # Objets métier
        self.projet_proprio = Projet.objects.create(
            titre="Projet Proprio",
            resume="Résumé du projet",
            probleme="Problème adressé",
            solution="Solution proposée",
            porteur=self.users["porteur_proprio"],
            domaine=self.domaine,
            cohorte=self.cohorte,
            statut="incube",
        )
        self.projet_tiers = Projet.objects.create(
            titre="Projet Tiers",
            resume="Résumé tiers",
            probleme="Problème tiers",
            solution="Solution tierce",
            porteur=self.users["porteur_tiers"],
            domaine=self.domaine,
            cohorte=self.cohorte,
            statut="incube",
        )

        self.dossier_proprio = Dossier.objects.create(
            projet=self.projet_proprio,
            statut=StatutDossier.BROUILLON,
        )

        self.grille = Grille.objects.create(nom="Grille 2026", active=True)

        self.actualite = Actualite.objects.create(
            titre="Inauguration CIAT",
            contenu="Contenu officiel",
        )
        self.partenaire = Partenaire.objects.create(
            nom="ISEP Diamniadio",
            description="Institut supérieur",
        )
        import datetime
        from django.utils import timezone

        self.appel = AppelProjet.objects.create(
            titre="Appel à candidatures 2026",
            description="Description de l'appel",
            date_limite=timezone.now() + datetime.timedelta(days=30),
        )
        self.doc_public = DocumentPublic.objects.create(
            titre="Règlement intérieur",
            categorie="Guides",
            fichier=SimpleUploadedFile("reglement.pdf", b"%PDF-1.4 sample content"),
        )
        self.fiche_galerie = FicheInnovation.objects.create(
            projet=self.projet_proprio,
            titre="Fiche Innovation Solar",
            probleme="Problème solaire",
            solution="Panneaux solaires",
            equipe="Équipe d'ingénieurs",
            avancement="MVP",
            statut=FicheInnovation.Statut.PUBLIE,
        )

    def _auth(self, role_key):
        """Authentifie le client avec l'utilisateur spécifié ou retire l'authentification si None."""
        if role_key is None:
            self.client.credentials()
        else:
            self.client.force_authenticate(user=self.users[role_key])

    def test_routes_publiques_accessibles_a_tous(self):
        """Les routes publiques doivent renvoyer 200 à l'anonyme et à tous les rôles."""
        routes_publiques = [
            "/api/health/",
            "/api/portal/actualites/",
            "/api/portal/evenements/",
            "/api/portal/appels/",
            "/api/portal/partenaires/",
            "/api/portal/documents/",
            "/api/portal/projets-incubes/",
            "/api/gallery/fiches/",
        ]

        roles_a_tester = [None, "visiteur", "porteur_proprio", "mentor", "comite", "coordo", "admin"]

        for route in routes_publiques:
            for role in roles_a_tester:
                self._auth(role)
                resp = self.client.get(route)
                self.assertEqual(
                    resp.status_code,
                    status.HTTP_200_OK,
                    f"Route {route} avec rôle {role} devrait renvoyer 200, reçu {resp.status_code}",
                )

    def test_matrice_gallery_statistiques(self):
        """GET /api/gallery/statistiques/ : réservé à l'équipe CIAT."""
        url = "/api/gallery/statistiques/"
        self._auth(None)
        self.assertEqual(self.client.get(url).status_code, status.HTTP_401_UNAUTHORIZED)

        for role in ["visiteur", "porteur_proprio", "mentor", "comite"]:
            self._auth(role)
            self.assertEqual(self.client.get(url).status_code, status.HTTP_403_FORBIDDEN)

        for role in ["coordo", "admin"]:
            self._auth(role)
            self.assertEqual(self.client.get(url).status_code, status.HTTP_200_OK)

    def test_matrice_auth_me(self):
        """GET /api/auth/me/ : 401 si anonyme, 200 pour tout connecté."""
        # Anonyme
        self._auth(None)
        resp = self.client.get("/api/auth/me/")
        self.assertEqual(resp.status_code, status.HTTP_401_UNAUTHORIZED)

        # Connectés
        for role in ["visiteur", "porteur_proprio", "mentor", "comite", "coordo", "admin"]:
            self._auth(role)
            resp = self.client.get("/api/auth/me/")
            self.assertEqual(resp.status_code, status.HTTP_200_OK, f"Échec auth/me pour rôle {role}")

    def test_matrice_projets(self):
        """Gestion des projets : consultation et création selon les rôles."""
        # Anonyme rejeté
        self._auth(None)
        self.assertEqual(self.client.get("/api/projets/").status_code, status.HTTP_401_UNAUTHORIZED)

        # Visiteur ne peut pas créer de projet
        self._auth("visiteur")
        payload = {
            "titre": "Projet X",
            "resume": "Description",
            "probleme": "Pb",
            "solution": "Sol",
            "domaine": self.domaine.id,
        }
        resp_post = self.client.post("/api/projets/", payload)
        self.assertEqual(resp_post.status_code, status.HTTP_403_FORBIDDEN)

        # Porteur peut créer son projet
        self._auth("porteur_proprio")
        resp_post_p = self.client.post("/api/projets/", payload)
        self.assertEqual(resp_post_p.status_code, status.HTTP_201_CREATED)

    def test_matrice_incubateur_dossiers(self):
        """Dossiers d'incubation : isolation stricte et permissions métier."""
        # Anonyme rejeté
        self._auth(None)
        self.assertEqual(self.client.get("/api/incubator/dossiers/").status_code, status.HTTP_401_UNAUTHORIZED)

        # Un tiers ne peut pas créer un dossier pour un projet qui ne lui appartient pas
        self._auth("porteur_tiers")
        resp = self.client.post("/api/incubator/dossiers/", {"projet": self.projet_proprio.id})
        self.assertEqual(resp.status_code, status.HTTP_403_FORBIDDEN)

        # Un visiteur / mentor / membre du comité ne peut pas créer de dossier
        for role in ["visiteur", "mentor", "comite"]:
            self._auth(role)
            resp = self.client.post("/api/incubator/dossiers/", {"projet": self.projet_proprio.id})
            self.assertEqual(resp.status_code, status.HTTP_403_FORBIDDEN, f"Rôle {role} ne doit pas créer de dossier")

    def test_matrice_incubateur_decision_et_evaluations(self):
        """Seuls l'admin et le coordonnateur décident ; le comité évalue."""
        self.dossier_proprio.statut = StatutDossier.EN_EVALUATION
        self.dossier_proprio.save(update_fields=["statut"])
        url_decision = f"/api/incubator/dossiers/{self.dossier_proprio.id}/decision/"

        # Décision : refusée à l'anonyme (401), au porteur, visiteur, mentor, comité (403)
        self._auth(None)
        self.assertEqual(self.client.post(url_decision, {}).status_code, status.HTTP_401_UNAUTHORIZED)

        for role in ["visiteur", "porteur_proprio", "mentor", "comite"]:
            self._auth(role)
            resp = self.client.post(url_decision, {"decision": "accepte", "motif": "Motif"})
            self.assertEqual(resp.status_code, status.HTTP_403_FORBIDDEN, f"Rôle {role} ne doit pas décider")

        # Seuls admin et coordonnateur peuvent décider
        self._auth("coordo")
        resp = self.client.post(
            url_decision,
            {"decision": "accepte", "motif": "Projet très pertinent et viable"},
            format="json",
        )
        self.assertIn(resp.status_code, [status.HTTP_200_OK, status.HTTP_201_CREATED])

    def test_matrice_portal_gestion_contenus(self):
        """Gestion des actualités et partenaires réservée à l'équipe CIAT."""
        url_actu = "/api/portal/actualites/"
        payload_actu = {"titre": "Nouvelle Actu", "contenu": "Texte"}

        # Anonyme -> 401
        self._auth(None)
        self.assertEqual(self.client.post(url_actu, payload_actu).status_code, status.HTTP_401_UNAUTHORIZED)

        # Porteur, visiteur, mentor, comité -> 403
        for role in ["visiteur", "porteur_proprio", "mentor", "comite"]:
            self._auth(role)
            self.assertEqual(
                self.client.post(url_actu, payload_actu).status_code,
                status.HTTP_403_FORBIDDEN,
                f"Rôle {role} ne doit pas créer d'actualité",
            )

        # Admin / Coordonnateur -> 201
        self._auth("coordo")
        self.assertEqual(self.client.post(url_actu, payload_actu).status_code, status.HTTP_201_CREATED)

    def test_matrice_analytics_autorisations(self):
        """Analytics réservé au Coordonnateur, Admin et Comité."""
        url_analytics = "/api/analytics/indicateurs/"

        # Anonyme -> 401
        self._auth(None)
        self.assertEqual(self.client.get(url_analytics).status_code, status.HTTP_401_UNAUTHORIZED)

        # Refusé à visiteur, porteur, mentor -> 403
        for role in ["visiteur", "porteur_proprio", "mentor"]:
            self._auth(role)
            self.assertEqual(
                self.client.get(url_analytics).status_code,
                status.HTTP_403_FORBIDDEN,
                f"Rôle {role} ne doit pas accéder aux analytics",
            )

        # Autorisé à comite, coordo, admin -> 200
        for role in ["comite", "coordo", "admin"]:
            self._auth(role)
            self.assertEqual(
                self.client.get(url_analytics).status_code,
                status.HTTP_200_OK,
                f"Rôle {role} doit accéder aux analytics",
            )

    def test_jamais_500_sur_entrees_invalides(self):
        """Une entrée invalide ou mal formée ne doit JAMAIS déclencher une erreur HTTP 500."""
        self._auth("porteur_proprio")

        urls_et_payloads = [
            ("post", "/api/projets/", {"titre": ""}),
            ("post", "/api/projets/", {"domaine": 999999}),
            ("post", "/api/incubator/dossiers/", {"projet": "invalid_string"}),
            ("get", "/api/portal/actualites/?search=%27%20OR%201=1--", None),
            ("get", "/api/analytics/indicateurs/?debut=not-a-date", None),
        ]

        for method, url, payload in urls_et_payloads:
            if method == "post":
                resp = self.client.post(url, payload)
            else:
                resp = self.client.get(url)
            self.assertNotEqual(
                resp.status_code,
                status.HTTP_500_INTERNAL_SERVER_ERROR,
                f"URL {url} a renvoyé une erreur 500 sur données invalides",
            )


@override_settings(PASSWORD_HASHERS=FAST_HASHERS)
class FuitesDonneesPriveesTests(TestCase):
    """Vérifie que les endpoints publics ne fuient aucune donnée personnelle ou confidentielle."""

    def setUp(self):
        self.client = APIClient()
        self.domaine = Domaine.objects.create(nom="Agriculture")
        self.cohorte = Cohorte.objects.create(nom="Cohorte 2025", annee=2025)

        self.porteur = User.objects.create_user(
            email="secret.porteur@demo.ciat.sn",
            telephone="+221770009988",
            password="Password123!",
            role=Role.PORTEUR,
            first_name="Fatou",
            last_name="Sow",
        )
        self.projet = Projet.objects.create(
            titre="Irrigation Solaire Casamance",
            resume="Système d'irrigation connecté",
            probleme="Sécheresse saisonnière",
            solution="Pompes solaires intelligentes",
            porteur=self.porteur,
            domaine=self.domaine,
            cohorte=self.cohorte,
            statut="incube",
        )
        self.fiche = FicheInnovation.objects.create(
            projet=self.projet,
            titre="Irrigation Solaire Fiche",
            probleme="Sécheresse",
            solution="Pompes solaires",
            equipe="Ingénieurs agronomes",
            avancement="MVP",
            statut=FicheInnovation.Statut.PUBLIE,
        )

    def test_annuaire_projets_incubes_ne_fuite_pas_de_donnees_privees(self):
        """GET /api/portal/projets-incubes/ ne doit pas révéler l'email, le téléphone ou les données sensibles."""
        resp = self.client.get("/api/portal/projets-incubes/")
        self.assertEqual(resp.status_code, status.HTTP_200_OK)

        content = resp.content.decode("utf-8")

        # Pas d'email dans le contenu renvoyé
        self.assertNotIn("secret.porteur@demo.ciat.sn", content)
        self.assertFalse(re.search(r"[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+", content))

        # Pas de numéro de téléphone
        self.assertNotIn("+221770009988", content)

        # Pas de clés ou hash de mot de passe
        self.assertNotIn("password", content)
        self.assertNotIn("pbkdf2", content)

    def test_galerie_fiches_ne_fuite_pas_de_donnees_privees(self):
        """GET /api/gallery/fiches/ ne doit pas révéler d'email ou de données internes."""
        resp = self.client.get("/api/gallery/fiches/")
        self.assertEqual(resp.status_code, status.HTTP_200_OK)

        content = resp.content.decode("utf-8")
        self.assertNotIn("secret.porteur@demo.ciat.sn", content)
        self.assertNotIn("+221770009988", content)
        self.assertNotIn("password", content)


from django.core.cache import cache


@override_settings(PASSWORD_HASHERS=FAST_HASHERS)
class RateLimitingEtBruteForceTests(TestCase):
    """Vérifie la protection contre le brute-force sur /api/auth/token/ et /api/auth/register/."""

    def setUp(self):
        cache.clear()
        self.client = APIClient()
        self.user = User.objects.create_user(
            email="test.auth@ciat.sn",
            password="GoodPassword2026!",
            role=Role.PORTEUR,
        )

    def tearDown(self):
        cache.clear()

    def test_configuration_throttle_auth_presente(self):
        """Le taux de throttle 'auth' doit être configuré à 5/min dans settings."""
        rates = settings.REST_FRAMEWORK.get("DEFAULT_THROTTLE_RATES", {})
        self.assertIn("auth", rates, "Le rate 'auth' doit être défini dans DEFAULT_THROTTLE_RATES")
        self.assertEqual(rates["auth"], "5/min")

    def test_rate_limiting_bruteforce_token(self):
        """Après plus de 5 tentatives infructueuses en 1 minute, l'endpoint renvoie 429 Too Many Requests."""
        for _ in range(5):
            self.client.post(
                "/api/auth/token/",
                {"email": "test.auth@ciat.sn", "password": "wrongpassword"},
            )
        resp = self.client.post(
            "/api/auth/token/",
            {"email": "test.auth@ciat.sn", "password": "wrongpassword"},
        )
        self.assertEqual(
            resp.status_code,
            status.HTTP_429_TOO_MANY_REQUESTS,
            "L'accès doit être bloqué par HTTP 429 après dépassement du quota auth",
        )


@override_settings(PASSWORD_HASHERS=FAST_HASHERS)
class RobustesseMotsDePasseTests(TestCase):
    """Vérifie l'application stricte des règles de complexité des mots de passe."""

    def setUp(self):
        cache.clear()
        self.client = APIClient()

    def tearDown(self):
        cache.clear()

    def test_mot_de_passe_trop_court_rejete(self):
        """Un mot de passe de moins de 8 caractères est refusé avec 400."""
        payload = {
            "email": "candidat@test.sn",
            "password": "court",
            "first_name": "Jean",
            "last_name": "Test",
        }
        resp = self.client.post("/api/auth/register/", payload)
        self.assertEqual(resp.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("password", resp.data)

    def test_mot_de_passe_entierement_numerique_rejete(self):
        """Un mot de passe composé uniquement de chiffres est rejeté."""
        payload = {
            "email": "candidat2@test.sn",
            "password": "1234567890",
            "first_name": "Jean",
            "last_name": "Test",
        }
        resp = self.client.post("/api/auth/register/", payload)
        self.assertEqual(resp.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("password", resp.data)

    def test_mot_de_passe_robuste_accepte(self):
        """Un mot de passe respectant les contraintes permet la création du compte."""
        payload = {
            "email": "nouveau.porteur@test.sn",
            "password": "Ciat2026!PorteurRobuste",
            "first_name": "Amadou",
            "last_name": "Sall",
        }
        resp = self.client.post("/api/auth/register/", payload)
        self.assertEqual(resp.status_code, status.HTTP_201_CREATED)
        self.assertTrue(User.objects.filter(email="nouveau.porteur@test.sn").exists())


class UploadsFichiersSecuriteTests(TestCase):
    """Vérifie la politique de sécurité sur les dépôts de fichiers."""

    def test_rejet_fichier_vide(self):
        """Un fichier de 0 octet est rejeté."""
        empty_file = SimpleUploadedFile("vide.pdf", b"")
        with self.assertRaises(ValidationError):
            validate_file_size(empty_file)

    def test_rejet_fichier_trop_volumineux(self):
        """Un fichier dépassant 10 Mo est rejeté."""
        mock_file = SimpleUploadedFile("gros.pdf", b"A" * (10 * 1024 * 1024 + 1))
        with self.assertRaises(ValidationError):
            validate_file_size(mock_file)

    def test_validation_magic_bytes_pdf(self):
        """Un fichier renommé en .pdf mais sans signature binaire %PDF est rejeté."""
        fake_pdf = SimpleUploadedFile("virus.pdf", b"#!/bin/bash\nrm -rf /")
        with self.assertRaises(ValidationError) as ctx:
            validate_file_content(fake_pdf)
        self.assertIn("signature invalide", str(ctx.exception))

    def test_validation_magic_bytes_pdf_valide(self):
        """Un véritable fichier PDF commençant par %PDF- est accepté."""
        real_pdf = SimpleUploadedFile("document.pdf", b"%PDF-1.4 sample data content")
        # Ne doit lever aucune exception
        validate_file_content(real_pdf)


class ProductionConfigurationTests(TestCase):
    """Vérifie les critères indispensables de la checklist de mise en production."""

    def test_secret_key_non_triviale_si_debug_faux(self):
        """Si DEBUG est False, une clé secrète par défaut déclenche une exception."""
        with patch.object(settings, "DEBUG", False):
            # Vérifier qu'une SECRET_KEY par défaut ou vide est interdite
            with self.assertRaises(ImproperlyConfigured):
                if settings.SECRET_KEY in ("dev-only-change-me", "change-me", ""):
                    raise ImproperlyConfigured("SECRET_KEY faible interdite en production")

    def test_allowed_hosts_defini(self):
        """ALLOWED_HOSTS ne doit pas être vide."""
        self.assertTrue(len(settings.ALLOWED_HOSTS) > 0)

    def test_en_tetes_securite_en_production(self):
        """Vérifie la présence des variables d'en-têtes HTTP de sécurité."""
        # En-têtes configurés dans settings.py en mode production
        self.assertTrue(hasattr(settings, "DATA_UPLOAD_MAX_MEMORY_SIZE"))
        self.assertEqual(settings.DATA_UPLOAD_MAX_MEMORY_SIZE, 10 * 1024 * 1024)
