"""Tests de protection des données personnelles (Phase 8 — T3 / RGPD).

Couvre :
1. Exportation des données personnelles (GET /api/auth/me/export/) :
   - Fichier JSON structuré (profil, projets, dossiers, documents, conversations, interactions)
   - Isolation stricte (aucun mélange entre utilisateurs)
   - Accès protégé (401 si non connecté)
2. Suppression / anonymisation du compte (DELETE /api/auth/me/) :
   - Confirmation obligatoire par mot de passe (400 si absent ou erroné)
   - Anonymisation irréversible des données d'identité (is_active=False, nom anonymisé, email technique)
   - Conservation de l'intégrité des projets et dossiers historiques
   - Suppression définitive des conversations de l'assistant IA
3. Suppression unitaire d'une conversation de l'assistant (DELETE /api/assistant/conversations/{id}/) :
   - Accès limité au propriétaire (403 si un autre utilisateur tente de la supprimer)
   - Code 204 après suppression réussie
   - Code 404 sur conversation inexistante
"""
import json
from django.core.cache import cache
from django.test import override_settings
from rest_framework import status
from rest_framework.test import APITestCase

from apps.assistant.models import Conversation, MessageAssistant
from apps.core.models import Domaine, Projet, Role, User
from apps.documents.models import Document, ModeleDocument, TypeDocument
from apps.gallery.models import FicheInnovation, ManifestationInteret
from apps.incubator.models import Dossier

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
class DonneesPersonnellesRGPDTests(APITestCase):
    """Tests du cycle de vie des données personnelles, de la portabilité et de l'effacement."""

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
        cls.password = "MonSecretPorteur123!"

        # Utilisateur A
        cls.user_a = User.objects.create_user(
            email="porteur_a_rgpd@ciat.sn",
            password=cls.password,
            first_name="Cheikh",
            last_name="Fall",
            role=Role.PORTEUR,
            organisation="SenAgri Tech",
            telephone="+221770000001",
        )

        # Utilisateur B
        cls.user_b = User.objects.create_user(
            email="porteur_b_rgpd@ciat.sn",
            password=cls.password,
            first_name="Awa",
            last_name="Gueye",
            role=Role.PORTEUR,
            organisation="Dakar Solar",
            telephone="+221770000002",
        )

        cls.domaine = Domaine.objects.create(nom="Agroécologie")

        # Projets et dossiers
        cls.projet_a = Projet.objects.create(
            titre="Irrigation Goutte-à-Goutte Solaire",
            domaine=cls.domaine,
            porteur=cls.user_a,
            statut="incube",
        )
        cls.dossier_a = Dossier.objects.create(
            projet=cls.projet_a,
            statut="soumis",
        )

        cls.projet_b = Projet.objects.create(
            titre="Ferme Aquaponique Thiès",
            domaine=cls.domaine,
            porteur=cls.user_b,
            statut="idee",
        )

        # Documents
        cls.type_doc = TypeDocument.objects.create(code="CONV_TEST", nom="Convention Test")
        cls.modele_doc = ModeleDocument.objects.create(type=cls.type_doc, nom="Modèle Standard")
        cls.doc_a = Document.objects.create(
            titre="Convention Cadre User A",
            modele=cls.modele_doc,
            projet=cls.projet_a,
            auteur=cls.user_a,
            statut="brouillon",
        )

        # Conversations et messages Assistant
        cls.conv_a = Conversation.objects.create(
            utilisateur=cls.user_a,
            titre="Recherche financements Agri",
        )
        MessageAssistant.objects.create(
            conversation=cls.conv_a,
            role="user",
            contenu="Quels sont les appels à projets ouverts ?",
        )
        MessageAssistant.objects.create(
            conversation=cls.conv_a,
            role="assistant",
            contenu="Deux appels sont actuellement ouverts au CIAT.",
        )

        cls.conv_b = Conversation.objects.create(
            utilisateur=cls.user_b,
            titre="Échange privé User B",
        )

        # Fiche galerie & manifestations
        cls.fiche_a = FicheInnovation.objects.create(
            titre="Fiche Solaire A",
            slug="fiche-solaire-a",
            projet=cls.projet_a,
            probleme="Problème A",
            solution="Solution A",
            equipe="Équipe A",
            avancement="Pilote",
            statut=FicheInnovation.Statut.PUBLIE,
        )
        cls.manifestation_a = ManifestationInteret.objects.create(
            fiche=cls.fiche_a,
            nom="Partenaire Intéressé",
            email=cls.user_a.email,  # Interaction liée à l'email de User A
            message="Je souhaite m'associer à cette initiative.",
        )

    def test_export_donnees_personnelles_succes(self):
        """GET /api/auth/me/export/ exporte l'ensemble des données de l'utilisateur connecté."""
        self.client.force_authenticate(user=self.user_a)
        resp = self.client.get("/api/auth/me/export/")
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.assertEqual(resp["Content-Type"], "application/json; charset=utf-8")
        self.assertIn(f"donnees_personnelles_{self.user_a.id}.json", resp["Content-Disposition"])

        data = json.loads(resp.content.decode("utf-8"))
        # Vérification du profil
        self.assertEqual(data["profil"]["email"], self.user_a.email)
        self.assertEqual(data["profil"]["nom"], "Fall")
        self.assertEqual(data["profil"]["prenom"], "Cheikh")
        self.assertEqual(data["profil"]["telephone"], "+221770000001")

        # Projets
        self.assertEqual(len(data["projets"]), 1)
        self.assertEqual(data["projets"][0]["titre"], "Irrigation Goutte-à-Goutte Solaire")

        # Dossiers
        self.assertEqual(len(data["dossiers"]), 1)
        self.assertEqual(data["dossiers"][0]["projet_titre"], "Irrigation Goutte-à-Goutte Solaire")

        # Documents
        self.assertEqual(len(data["documents"]), 1)
        self.assertEqual(data["documents"][0]["titre"], "Convention Cadre User A")

        # Conversations
        self.assertEqual(len(data["conversations_assistant"]), 1)
        self.assertEqual(data["conversations_assistant"][0]["titre"], "Recherche financements Agri")
        self.assertEqual(len(data["conversations_assistant"][0]["messages"]), 2)

        # Interactions
        self.assertEqual(len(data["interactions"]["manifestations_interet"]), 1)

    def test_export_donnees_isolation_stricte(self):
        """Un utilisateur B ne voit AUCUNE donnée appartenant à l'utilisateur A."""
        self.client.force_authenticate(user=self.user_b)
        resp = self.client.get("/api/auth/me/export/")
        self.assertEqual(resp.status_code, status.HTTP_200_OK)

        data = json.loads(resp.content.decode("utf-8"))
        self.assertEqual(data["profil"]["email"], self.user_b.email)
        # Ne doit contenir aucun projet ou conversation de A
        projets_titres = [p["titre"] for p in data["projets"]]
        self.assertNotIn("Irrigation Goutte-à-Goutte Solaire", projets_titres)
        self.assertIn("Ferme Aquaponique Thiès", projets_titres)

        conv_titres = [c["titre"] for c in data["conversations_assistant"]]
        self.assertNotIn("Recherche financements Agri", conv_titres)
        self.assertIn("Échange privé User B", conv_titres)

    def test_export_donnees_anonyme_refuse_401(self):
        """L'export de données personnelles exige une authentification stricte."""
        resp = self.client.get("/api/auth/me/export/")
        self.assertEqual(resp.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_suppression_compte_validation_mot_de_passe_400(self):
        """DELETE /api/auth/me/ exige le mot de passe actuel pour valider la suppression."""
        self.client.force_authenticate(user=self.user_a)

        # Mot de passe manquant
        resp_sans_pwd = self.client.delete("/api/auth/me/", {}, format="json")
        self.assertEqual(resp_sans_pwd.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("mot de passe actuel est requis", resp_sans_pwd.data["detail"])

        # Mauvais mot de passe
        resp_faux_pwd = self.client.delete(
            "/api/auth/me/", {"password": "MauvaisMotDePasse!"}, format="json"
        )
        self.assertEqual(resp_faux_pwd.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("Mot de passe incorrect", resp_faux_pwd.data["detail"])

    def test_suppression_compte_anonymisation_et_suppression_assistant_204(self):
        """DELETE /api/auth/me/ supprime les conversations assistant et anonymise l'utilisateur."""
        user_id = self.user_a.id
        self.client.force_authenticate(user=self.user_a)

        # Vérifier présence avant suppression
        self.assertTrue(Conversation.objects.filter(utilisateur=self.user_a).exists())

        resp = self.client.delete(
            "/api/auth/me/", {"password": self.password}, format="json"
        )
        self.assertEqual(resp.status_code, status.HTTP_204_NO_CONTENT)

        # 1. Les conversations de l'assistant sont supprimées
        self.assertFalse(Conversation.objects.filter(utilisateur_id=user_id).exists())

        # 2. Le compte utilisateur est anonymisé et désactivé
        user_anonyme = User.objects.get(id=user_id)
        self.assertFalse(user_anonyme.is_active)
        self.assertEqual(user_anonyme.first_name, "Utilisateur")
        self.assertEqual(user_anonyme.last_name, "Anonymisé")
        self.assertEqual(user_anonyme.email, f"anonymise_{user_id}@ciat.sn")
        self.assertEqual(user_anonyme.telephone, "")
        self.assertEqual(user_anonyme.organisation, "")
        self.assertFalse(user_anonyme.has_usable_password())

        # 3. L'intégrité du projet et du dossier historique est préservée
        projet_restant = Projet.objects.get(id=self.projet_a.id)
        self.assertEqual(projet_restant.porteur_id, user_id)
        self.assertTrue(Dossier.objects.filter(id=self.dossier_a.id).exists())

    def test_delete_conversation_assistant_proprietaire_204(self):
        """Un utilisateur peut supprimer sa propre conversation d'assistant."""
        self.client.force_authenticate(user=self.user_b)
        url = f"/api/assistant/conversations/{self.conv_b.id}/"

        resp = self.client.delete(url)
        self.assertEqual(resp.status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(Conversation.objects.filter(id=self.conv_b.id).exists())

    def test_delete_conversation_assistant_autre_utilisateur_refuse_403(self):
        """Un utilisateur B ne peut JAMAIS supprimer la conversation de l'utilisateur A."""
        self.client.force_authenticate(user=self.user_b)
        url = f"/api/assistant/conversations/{self.conv_a.id}/"

        resp = self.client.delete(url)
        self.assertEqual(resp.status_code, status.HTTP_403_FORBIDDEN)
        # La conversation de A existe toujours
        self.assertTrue(Conversation.objects.filter(id=self.conv_a.id).exists())

    def test_delete_conversation_assistant_inexistante_404(self):
        """Renvoie 404 si la conversation à supprimer n'existe pas."""
        self.client.force_authenticate(user=self.user_b)
        resp = self.client.delete("/api/assistant/conversations/999999/")
        self.assertEqual(resp.status_code, status.HTTP_404_NOT_FOUND)
