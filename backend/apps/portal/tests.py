"""Tests unitaires et d'intégration pour le module Portail (apps.portal) — Phase 1 (T1).

Vérifie :
1. Lecture publique des actualités, événements et appels à projets par un visiteur non connecté.
2. Interdiction d'écriture (POST, PUT, DELETE) pour un porteur de projet ou un anonyme (401/403).
3. Autorisation de création/modification pour le coordonnateur et l'administrateur (201).
4. Filtre `?a_venir=1` sur les événements.
5. Calcul dynamique du statut de l'appel à projets (`ouvert` vs `clos`).
6. Génération et unicité automatique du slug pour les actualités.
7. Enregistrement des modèles dans l'administration Django.
"""
from datetime import timedelta

from django.contrib import admin
from django.contrib.auth import get_user_model
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APITestCase

from apps.core.models import Role

from .models import Actualite, AppelProjet, Evenement

User = get_user_model()


class PortalT1TestCase(APITestCase):
    def setUp(self):
        # Utilisateurs avec différents rôles
        self.admin_user = User.objects.create_user(
            email="admin@ciat.sn",
            password="password123",
            role=Role.ADMIN,
            first_name="Admin",
            last_name="CIAT",
        )
        self.coordo_user = User.objects.create_user(
            email="coordo@ciat.sn",
            password="password123",
            role=Role.COORDONNATEUR,
            first_name="Coordo",
            last_name="CIAT",
        )
        self.porteur_user = User.objects.create_user(
            email="porteur@ciat.sn",
            password="password123",
            role=Role.PORTEUR,
            first_name="Modou",
            last_name="Diop",
        )

        now = timezone.now()

        # Jeu de données : Actualités
        self.actu1 = Actualite.objects.create(
            titre="Lancement de la plateforme CIAT",
            resume="Une nouvelle étape pour l'innovation technologique.",
            contenu="Le CIAT inaugure sa plateforme numérique pour accompagner les porteurs de projets.",
            publie_le=now - timedelta(days=2),
        )
        self.actu2 = Actualite.objects.create(
            titre="Atelier intelligence artificielle",
            resume="Formation intensive sur les LLMs.",
            contenu="Tous les incubés sont invités à participer à l'atelier.",
            publie_le=now - timedelta(days=1),
        )

        # Jeu de données : Événements (un passé, un futur)
        self.evt_passe = Evenement.objects.create(
            titre="Séminaire d'accueil 2025",
            description="Accueil des étudiants et chercheurs.",
            lieu="Amphithéâtre ISEP",
            debut=now - timedelta(days=10),
            fin=now - timedelta(days=9),
        )
        self.evt_futur = Evenement.objects.create(
            titre="Hackathon AgriTech 2026",
            description="48h pour prototyper des solutions agricoles innovantes.",
            lieu="FabLab CIAT",
            debut=now + timedelta(days=15),
            fin=now + timedelta(days=17),
            lien_inscription="https://ciat.sn/hackathon-2026",
        )

        # Jeu de données : Appels à projets (un ouvert, un clos)
        self.appel_ouvert = AppelProjet.objects.create(
            titre="Appel à projets Cohorte 2026",
            description="Rejoignez le programme d'incubation du CIAT.",
            date_limite=now + timedelta(days=30),
            pieces_demandees=["fiche_projet", "presentation_equipe", "budget_previsionnel"],
        )
        self.appel_clos = AppelProjet.objects.create(
            titre="Appel à projets Pilote 2025",
            description="Premier appel à projets de test.",
            date_limite=now - timedelta(days=5),
            pieces_demandees=["fiche_projet"],
        )


class ActualiteTests(PortalT1TestCase):
    def test_visiteur_non_connecte_peut_lister_actualites(self):
        """Un visiteur non connecté peut lire la liste paginée des actualités."""
        response = self.client.get("/api/portal/actualites/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.json()
        self.assertIn("results", data)
        self.assertEqual(data["count"], 2)
        # Vérification des champs requis par le contrat
        premier = data["results"][0]
        for field in ("id", "titre", "slug", "resume", "contenu", "image", "publie_le"):
            self.assertIn(field, premier)

    def test_porteur_ne_peut_pas_creer_actualite(self):
        """Un porteur de projet ne peut pas créer d'actualité (403 Forbidden)."""
        self.client.force_authenticate(user=self.porteur_user)
        payload = {
            "titre": "Tentative frauduleuse",
            "resume": "Non autorisé",
            "contenu": "Contenu",
        }
        response = self.client.post("/api/portal/actualites/", payload)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_anonyme_ne_peut_pas_creer_actualite(self):
        """Un visiteur non authentifié ne peut pas créer d'actualité (401 ou 403)."""
        payload = {
            "titre": "Tentative anonyme",
            "contenu": "Contenu",
        }
        response = self.client.post("/api/portal/actualites/", payload)
        self.assertIn(
            response.status_code,
            [status.HTTP_401_UNAUTHORIZED, status.HTTP_403_FORBIDDEN],
        )

    def test_coordonnateur_cree_actualite_avec_succes(self):
        """Un coordonnateur crée une actualité depuis l'API (critère d'acceptation T1)."""
        self.client.force_authenticate(user=self.coordo_user)
        payload = {
            "titre": "Nouvelle actualité par le coordonnateur",
            "resume": "Bref résumé",
            "contenu": "Contenu détaillé de l'annonce officielle.",
        }
        response = self.client.post("/api/portal/actualites/", payload)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        data = response.json()
        self.assertEqual(data["titre"], payload["titre"])
        self.assertTrue(len(data["slug"]) > 0)
        self.assertEqual(data["slug"], "nouvelle-actualite-par-le-coordonnateur")

    def test_slug_auto_generation_et_unicite(self):
        """Le slug est généré automatiquement et reste unique en cas d'homonyme."""
        actu_a = Actualite.objects.create(
            titre="Même titre", contenu="Premier"
        )
        actu_b = Actualite.objects.create(
            titre="Même titre", contenu="Deuxième"
        )
        self.assertEqual(actu_a.slug, "meme-titre")
        self.assertEqual(actu_b.slug, "meme-titre-1")


class EvenementTests(PortalT1TestCase):
    def test_visiteur_non_connecte_peut_lister_evenements(self):
        """Un visiteur non connecté peut lire la liste des événements."""
        response = self.client.get("/api/portal/evenements/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.json()
        self.assertIn("results", data)
        self.assertEqual(data["count"], 2)

    def test_filtre_a_venir_sur_evenements(self):
        """Le filtre ?a_venir=1 ne renvoie que les événements futurs."""
        response = self.client.get("/api/portal/evenements/?a_venir=1")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.json()
        self.assertEqual(data["count"], 1)
        self.assertEqual(data["results"][0]["id"], self.evt_futur.id)
        self.assertEqual(data["results"][0]["titre"], "Hackathon AgriTech 2026")

    def test_porteur_ne_peut_pas_modifier_evenement(self):
        """Un porteur ne peut pas modifier un événement existant."""
        self.client.force_authenticate(user=self.porteur_user)
        response = self.client.patch(
            f"/api/portal/evenements/{self.evt_futur.id}/",
            {"lieu": "Autre endroit"},
        )
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)


class AppelProjetTests(PortalT1TestCase):
    def test_visiteur_non_connecte_peut_lister_appels(self):
        """Un visiteur non connecté peut lire la liste des appels à projets."""
        response = self.client.get("/api/portal/appels/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.json()
        self.assertIn("results", data)
        self.assertEqual(data["count"], 2)

    def test_statut_calcule_selon_date_limite(self):
        """Le statut est 'ouvert' si date_limite est future, 'clos' si passée."""
        self.assertEqual(self.appel_ouvert.statut, "ouvert")
        self.assertEqual(self.appel_clos.statut, "clos")

        # Vérification via l'API
        response_ouvert = self.client.get(f"/api/portal/appels/{self.appel_ouvert.id}/")
        self.assertEqual(response_ouvert.json()["statut"], "ouvert")

        response_clos = self.client.get(f"/api/portal/appels/{self.appel_clos.id}/")
        self.assertEqual(response_clos.json()["statut"], "clos")

    def test_filtre_par_statut_appel(self):
        """Le filtre ?statut=ouvert retourne uniquement les appels ouverts."""
        response = self.client.get("/api/portal/appels/?statut=ouvert")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.json()
        self.assertEqual(data["count"], 1)
        self.assertEqual(data["results"][0]["id"], self.appel_ouvert.id)

    def test_admin_peut_creer_appel_projet(self):
        """Un administrateur peut publier un nouvel appel à projets."""
        self.client.force_authenticate(user=self.admin_user)
        payload = {
            "titre": "Appel Innovation Femmes Tech",
            "description": "Appui spécifique aux projets portés par des femmes.",
            "date_limite": (timezone.now() + timedelta(days=45)).isoformat(),
            "pieces_demandees": ["fiche_projet", "pitch_deck"],
        }
        response = self.client.post("/api/portal/appels/", payload, format="json")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.json()["statut"], "ouvert")


class AdminRegistrationTests(APITestCase):
    def test_modeles_enregistres_dans_admin(self):
        """Les 3 modèles sont bien enregistrés dans l'administration Django."""
        self.assertIn(Actualite, admin.site._registry)
        self.assertIn(Evenement, admin.site._registry)
        self.assertIn(AppelProjet, admin.site._registry)
