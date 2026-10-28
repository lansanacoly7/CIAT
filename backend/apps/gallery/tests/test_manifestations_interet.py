"""Tests unitaires et d'intégration pour les manifestations d'intérêt (Phase 8 — T1).

Couvre :
- Soumission publique d'une manifestation d'intérêt (POST /api/gallery/fiches/{slug}/interet/)
- Rejet 404 si fiche inexistante ou non publiée
- Validation stricte des données (400)
- Blocage anti-doublon (409) : même email et même fiche dans l'heure
- Envoi d'email au porteur et tolérance aux pannes de messagerie
- Consultation sécurisée (GET /api/gallery/interets/) :
  * Filtrage strict par rôle (coordonnateur/admin voient tout, porteur voit seulement les siennes, public/autre 403/401)
  * Filtres par fiche et par date, pagination
- Statistiques enrichies (GET /api/gallery/statistiques/) avec compteur d'intérêts
"""
from datetime import timedelta
from unittest.mock import patch

from django.core import mail
from django.core.cache import cache
from django.test import override_settings
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APITestCase

from apps.core.models import Domaine, Projet, Role, User
from apps.gallery.models import FicheInnovation, ManifestationInteret

FAST_HASHERS = ["django.contrib.auth.hashers.MD5PasswordHasher"]


@override_settings(
    PASSWORD_HASHERS=FAST_HASHERS,
    DISABLE_THROTTLING="1",
    REST_FRAMEWORK={
        "DEFAULT_AUTHENTICATION_CLASSES": (
            "rest_framework_simplejwt.authentication.JWTAuthentication",
        ),
        "DEFAULT_PERMISSION_CLASSES": ("rest_framework.permissions.IsAuthenticated",),
        "DEFAULT_FILTER_BACKENDS": (
            "django_filters.rest_framework.DjangoFilterBackend",
            "rest_framework.filters.SearchFilter",
            "rest_framework.filters.OrderingFilter",
        ),
        "DEFAULT_PAGINATION_CLASS": "rest_framework.pagination.PageNumberPagination",
        "PAGE_SIZE": 20,
        "DEFAULT_SCHEMA_CLASS": "drf_spectacular.openapi.AutoSchema",
        "DEFAULT_THROTTLE_CLASSES": (),
        "DEFAULT_THROTTLE_RATES": {
            "anon": "100000/min",
            "user": "100000/min",
            "ai": "100000/min",
            "auth": "100000/min",
            "gallery_interet": "100000/min",
        },
        "EXCEPTION_HANDLER": "apps.core.logging.custom_exception_handler",
    },
)
class ManifestationInteretTests(APITestCase):
    """Tests des endpoints de manifestations d'intérêt de la galerie."""

    @classmethod
    def setUpClass(cls):
        super().setUpClass()
        cache.clear()

    @classmethod
    def tearDownClass(cls):
        cache.clear()
        super().tearDownClass()

    def setUp(self):
        super().setUp()
        cache.clear()

    def tearDown(self):
        cache.clear()
        super().tearDown()

    @classmethod
    def setUpTestData(cls):
        cache.clear()
        # Création des utilisateurs
        cls.porteur1 = User.objects.create_user(
            email="porteur1_galerie@ciat.sn",
            password="Password123!",
            first_name="Amadou",
            last_name="Diallo",
            role=Role.PORTEUR,
        )
        cls.porteur2 = User.objects.create_user(
            email="porteur2_galerie@ciat.sn",
            password="Password123!",
            first_name="Fatou",
            last_name="Ba",
            role=Role.PORTEUR,
        )
        cls.coordonnateur = User.objects.create_user(
            email="coordo_galerie@ciat.sn",
            password="Password123!",
            first_name="Moussa",
            last_name="Fall",
            role=Role.COORDONNATEUR,
        )
        cls.admin = User.objects.create_user(
            email="admin_galerie@ciat.sn",
            password="Password123!",
            first_name="Lansana",
            last_name="Coly",
            role=Role.ADMIN,
        )
        cls.visiteur = User.objects.create_user(
            email="visiteur_galerie@ciat.sn",
            password="Password123!",
            first_name="Oumar",
            last_name="Ndiaye",
            role=Role.VISITEUR,
        )

        cls.domaine = Domaine.objects.create(nom="AgriTech")

        # Projets
        cls.projet1 = Projet.objects.create(
            titre="AgriSolar Sen",
            porteur=cls.porteur1,
            domaine=cls.domaine,
            statut="incube",
        )
        cls.projet2 = Projet.objects.create(
            titre="Biogaz Casamance",
            porteur=cls.porteur2,
            domaine=cls.domaine,
            statut="incube",
        )

        # Fiches d'innovation
        cls.fiche_publiee1 = FicheInnovation.objects.create(
            titre="Fiche Solaire 1",
            slug="fiche-solaire-1",
            projet=cls.projet1,
            probleme="Accès à l'énergie solaire pour les pompes agricoles",
            solution="Pompes hybrides photovoltaïques connectées",
            equipe="Équipe AgriSolar",
            avancement="MVP",
            statut=FicheInnovation.Statut.PUBLIE,
            vues=15,
        )
        cls.fiche_brouillon = FicheInnovation.objects.create(
            titre="Fiche Solaire Brouillon",
            slug="fiche-solaire-brouillon",
            projet=cls.projet1,
            probleme="Problème",
            solution="Solution",
            equipe="Équipe",
            avancement="Idée",
            statut=FicheInnovation.Statut.BROUILLON,
        )
        cls.fiche_publiee2 = FicheInnovation.objects.create(
            titre="Fiche Biogaz 2",
            slug="fiche-biogaz-2",
            projet=cls.projet2,
            probleme="Gestion des déchets organiques",
            solution="Méthaniseurs modulaires",
            equipe="Équipe Biogaz",
            avancement="Pilote",
            statut=FicheInnovation.Statut.PUBLIE,
            vues=8,
        )

    def test_post_interet_public_succes(self):
        """Un visiteur non connecté peut manifester son intérêt sur une fiche publiée."""
        mail.outbox.clear()
        url = f"/api/gallery/fiches/{self.fiche_publiee1.slug}/interet/"
        payload = {
            "nom": "Jean Dupont",
            "email": "investisseur@fonds-afrique.com",
            "organisation": "Afrique Capital Partners",
            "message": "Nous souhaitons financer la phase pilote de votre technologie solaire.",
        }
        resp = self.client.post(url, payload, format="json")
        self.assertEqual(resp.status_code, status.HTTP_201_CREATED)
        self.assertEqual(resp.data["nom"], "Jean Dupont")
        self.assertEqual(resp.data["email"], "investisseur@fonds-afrique.com")
        self.assertEqual(resp.data["fiche_slug"], self.fiche_publiee1.slug)

        # Vérifier en base
        self.assertTrue(
            ManifestationInteret.objects.filter(
                fiche=self.fiche_publiee1, email="investisseur@fonds-afrique.com"
            ).exists()
        )

        # Vérifier l'email au porteur
        self.assertEqual(len(mail.outbox), 1)
        email_sent = mail.outbox[0]
        self.assertIn(self.porteur1.email, email_sent.to)
        self.assertIn("Jean Dupont", email_sent.body)
        self.assertIn("Afrique Capital Partners", email_sent.body)

    def test_post_interet_fiche_inconnue_ou_non_publiee_404(self):
        """Renvoie 404 si la fiche n'existe pas ou si elle n'est pas au statut publié."""
        # Fiche inconnue
        resp_404 = self.client.post(
            "/api/gallery/fiches/inconnue-xyz/interet/",
            {"nom": "Test", "email": "test@ciat.sn", "message": "Message valide de plus de 10 car."},
            format="json",
        )
        self.assertEqual(resp_404.status_code, status.HTTP_404_NOT_FOUND)

        # Fiche brouillon
        resp_brouillon = self.client.post(
            f"/api/gallery/fiches/{self.fiche_brouillon.slug}/interet/",
            {"nom": "Test", "email": "test@ciat.sn", "message": "Message valide de plus de 10 car."},
            format="json",
        )
        self.assertEqual(resp_brouillon.status_code, status.HTTP_404_NOT_FOUND)

    def test_post_interet_validation_stricte_400(self):
        """Vérifie la validation stricte : email invalide, nom vide, message trop court."""
        url = f"/api/gallery/fiches/{self.fiche_publiee1.slug}/interet/"

        # Email invalide
        resp = self.client.post(url, {"nom": "Test", "email": "pas_un_email", "message": "Message valide"}, format="json")
        self.assertEqual(resp.status_code, status.HTTP_400_BAD_REQUEST)

        # Nom vide
        resp = self.client.post(url, {"nom": "   ", "email": "test@ciat.sn", "message": "Message valide"}, format="json")
        self.assertEqual(resp.status_code, status.HTTP_400_BAD_REQUEST)

        # Message trop court
        resp = self.client.post(url, {"nom": "Test", "email": "test@ciat.sn", "message": "Court"}, format="json")
        self.assertEqual(resp.status_code, status.HTTP_400_BAD_REQUEST)

    def test_post_interet_anti_doublon_meme_email_une_heure_409(self):
        """Bloque le spam anti-doublon (409 Conflict) si même email et même fiche dans l'heure."""
        url = f"/api/gallery/fiches/{self.fiche_publiee1.slug}/interet/"
        payload = {
            "nom": "Partenaire Pro",
            "email": "partenaire@green.sn",
            "message": "Premier contact pour partenariat technologique.",
        }
        # Premier envoi : 201
        resp1 = self.client.post(url, payload, format="json")
        self.assertEqual(resp1.status_code, status.HTTP_201_CREATED)

        # Deuxième envoi immédiat avec même email : 409
        resp2 = self.client.post(url, payload, format="json")
        self.assertEqual(resp2.status_code, status.HTTP_409_CONFLICT)
        self.assertIn("déjà été enregistrée", resp2.data["detail"])

        # Même email mais sur une autre fiche : autorisé (201)
        url_autre = f"/api/gallery/fiches/{self.fiche_publiee2.slug}/interet/"
        resp3 = self.client.post(url_autre, payload, format="json")
        self.assertEqual(resp3.status_code, status.HTTP_201_CREATED)

    def test_post_interet_panne_email_ne_bloque_pas_reponse_201(self):
        """Une défaillance SMTP ne bloque pas l'enregistrement (tolérance aux pannes)."""
        url = f"/api/gallery/fiches/{self.fiche_publiee1.slug}/interet/"
        payload = {
            "nom": "Investisseur Résilient",
            "email": "invest@panne-smtp.com",
            "message": "Message même si le serveur mail rencontre une panne.",
        }
        with patch("apps.gallery.emails.send_mail", side_effect=Exception("Connexion SMTP refusée")):
            resp = self.client.post(url, payload, format="json")
            self.assertEqual(resp.status_code, status.HTTP_201_CREATED)
            self.assertTrue(
                ManifestationInteret.objects.filter(email="invest@panne-smtp.com").exists()
            )

    def test_get_interets_permissions_et_isolation(self):
        """Vérifie l'accès sécurisé : Coordonnateur voit tout, Porteur voit uniquement les siennes."""
        # Création de manifestations
        m1 = ManifestationInteret.objects.create(
            fiche=self.fiche_publiee1,
            nom="Contact Porteur 1",
            email="contact1@test.com",
            message="Message pour projet 1",
        )
        m2 = ManifestationInteret.objects.create(
            fiche=self.fiche_publiee2,
            nom="Contact Porteur 2",
            email="contact2@test.com",
            message="Message pour projet 2",
        )

        url = "/api/gallery/interets/"

        # 1. Non authentifié -> 401
        resp = self.client.get(url)
        self.assertEqual(resp.status_code, status.HTTP_401_UNAUTHORIZED)

        # 2. Visiteur -> 403
        self.client.force_authenticate(user=self.visiteur)
        resp = self.client.get(url)
        self.assertEqual(resp.status_code, status.HTTP_403_FORBIDDEN)

        # 3. Porteur 1 -> voit uniquement m1 (fiche 1), jamais m2 (fiche 2)
        self.client.force_authenticate(user=self.porteur1)
        resp = self.client.get(url)
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        results = resp.data["results"] if "results" in resp.data else resp.data
        ids = [item["id"] for item in results]
        self.assertIn(m1.id, ids)
        self.assertNotIn(m2.id, ids)

        # 4. Porteur 2 -> voit uniquement m2 (fiche 2), jamais m1
        self.client.force_authenticate(user=self.porteur2)
        resp = self.client.get(url)
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        results = resp.data["results"] if "results" in resp.data else resp.data
        ids = [item["id"] for item in results]
        self.assertIn(m2.id, ids)
        self.assertNotIn(m1.id, ids)

        # 5. Coordonnateur -> voit tout
        self.client.force_authenticate(user=self.coordonnateur)
        resp = self.client.get(url)
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        results = resp.data["results"] if "results" in resp.data else resp.data
        ids = [item["id"] for item in results]
        self.assertIn(m1.id, ids)
        self.assertIn(m2.id, ids)

        # 6. Administrateur -> voit tout
        self.client.force_authenticate(user=self.admin)
        resp = self.client.get(url)
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        results = resp.data["results"] if "results" in resp.data else resp.data
        ids = [item["id"] for item in results]
        self.assertIn(m1.id, ids)
        self.assertIn(m2.id, ids)

    def test_get_interets_filtres(self):
        """Vérifie le fonctionnement des filtres par fiche et par date."""
        ManifestationInteret.objects.all().delete()
        m1 = ManifestationInteret.objects.create(
            fiche=self.fiche_publiee1,
            nom="A",
            email="a@test.com",
            message="Message A",
        )
        m2 = ManifestationInteret.objects.create(
            fiche=self.fiche_publiee2,
            nom="B",
            email="b@test.com",
            message="Message B",
        )

        self.client.force_authenticate(user=self.coordonnateur)

        # Filtre par slug de fiche
        resp = self.client.get(f"/api/gallery/interets/?fiche={self.fiche_publiee1.slug}")
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        results = resp.data["results"] if "results" in resp.data else resp.data
        self.assertEqual(len(results), 1)
        self.assertEqual(results[0]["id"], m1.id)

        # Filtre par date
        today_str = timezone.now().date().isoformat()
        resp_date = self.client.get(f"/api/gallery/interets/?date={today_str}")
        self.assertEqual(resp_date.status_code, status.HTTP_200_OK)
        results_date = resp_date.data["results"] if "results" in resp_date.data else resp_date.data
        self.assertEqual(len(results_date), 2)

    def test_statistiques_compteurs_interets(self):
        """GET /api/gallery/statistiques/ intègre le compteur total et par fiche d'intérêts."""
        ManifestationInteret.objects.all().delete()
        # 2 manifestations pour fiche 1
        ManifestationInteret.objects.create(
            fiche=self.fiche_publiee1,
            nom="Interet 1",
            email="i1@test.com",
            message="Intérêt 1",
        )
        ManifestationInteret.objects.create(
            fiche=self.fiche_publiee1,
            nom="Interet 2",
            email="i2@test.com",
            message="Intérêt 2",
        )
        # 1 manifestation pour fiche 2
        ManifestationInteret.objects.create(
            fiche=self.fiche_publiee2,
            nom="Interet 3",
            email="i3@test.com",
            message="Intérêt 3",
        )

        self.client.force_authenticate(user=self.coordonnateur)
        resp = self.client.get("/api/gallery/statistiques/")
        self.assertEqual(resp.status_code, status.HTTP_200_OK)

        self.assertIn("total_vues", resp.data)
        self.assertIn("total_interets", resp.data)
        self.assertEqual(resp.data["total_interets"], 3)

        par_fiche = resp.data["par_fiche"]
        f1_data = next((f for f in par_fiche if f["slug"] == self.fiche_publiee1.slug), None)
        self.assertIsNotNone(f1_data)
        self.assertEqual(f1_data["interets"], 2)

        f2_data = next((f for f in par_fiche if f["slug"] == self.fiche_publiee2.slug), None)
        self.assertIsNotNone(f2_data)
        self.assertEqual(f2_data["interets"], 1)
