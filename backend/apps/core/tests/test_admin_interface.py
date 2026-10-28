"""Tests d'intégration de l'interface d'administration Django complète (Phase 8 — T2).

Vérifie :
1. Contrôle d'accès strict : accès réservé à l'administrateur / staff (rejet des anonymes et porteurs)
2. Robustesse absolue de toutes les pages de liste d'administration (aucun code 500 sur tous les modèles)
3. Action « Exporter en CSV » sur les listes clés (utilisateurs, dossiers, projets) :
   - Présence du fichier CSV encodé utf-8-sig
   - Exclusion stricte et vérifiée de tout mot de passe, hash ou secret
"""
from django.contrib import admin
from django.core.cache import cache
from django.test import override_settings
from django.urls import reverse
from rest_framework.test import APITestCase

from apps.core.models import Cohorte, Domaine, Projet, Role, User
from apps.incubator.models import Dossier

FAST_HASHERS = ["django.contrib.auth.hashers.MD5PasswordHasher"]


@override_settings(
    PASSWORD_HASHERS=FAST_HASHERS,
    DISABLE_THROTTLING="1",
)
class AdminInterfaceTests(APITestCase):
    """Vérification de l'interface d'administration et des exports CSV."""

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
        # 1. Superuser / Admin staff
        cls.admin_user = User.objects.create_superuser(
            email="admin_ciat_test@ciat.sn",
            password="AdminSecretPassword123!",
            first_name="Admin",
            last_name="CIAT",
        )

        # 2. Utilisateur standard non-staff (porteur)
        cls.porteur = User.objects.create_user(
            email="porteur_lambda@ciat.sn",
            password="PorteurPassword123!",
            first_name="Aliou",
            last_name="Sow",
            role=Role.PORTEUR,
            is_staff=False,
        )

        # 3. Données de base pour remplir les listes
        cls.domaine = Domaine.objects.create(nom="Énergie Renouvelable")
        cls.cohorte = Cohorte.objects.create(nom="Cohorte 2026", annee=2026)
        cls.projet = Projet.objects.create(
            titre="Centrale Biomasse",
            domaine=cls.domaine,
            cohorte=cls.cohorte,
            porteur=cls.porteur,
            statut="incube",
        )
        cls.dossier = Dossier.objects.create(
            projet=cls.projet,
            statut="soumis",
        )

    def test_admin_acces_refuse_aux_non_staff(self):
        """Un visiteur non connecté ou un utilisateur non-staff ne peut pas accéder à /admin/."""
        # Anonyme -> redirection vers login (302)
        resp_anon = self.client.get("/admin/")
        self.assertEqual(resp_anon.status_code, 302)
        self.assertIn("/admin/login/", resp_anon.url)

        # Porteur non staff -> redirection vers login avec message ou 302
        self.client.force_login(self.porteur)
        resp_porteur = self.client.get("/admin/")
        self.assertEqual(resp_porteur.status_code, 302)

    def test_admin_acces_autorise_pour_staff(self):
        """Un administrateur avec droits staff accède à l'index de l'administration."""
        self.client.force_login(self.admin_user)
        resp = self.client.get("/admin/")
        self.assertEqual(resp.status_code, 200)
        self.assertContains(resp, "Administration de Django")

    def test_toutes_les_pages_de_liste_admin_s_ouvrent_sans_erreur_500(self):
        """Vérifie que chaque modèle enregistré dans admin.site a une page de liste fonctionnelle (200 OK)."""
        self.client.force_login(self.admin_user)

        modeles_testes = []
        for model, model_admin in admin.site._registry.items():
            app_label = model._meta.app_label
            model_name = model._meta.model_name
            url_changelist = reverse(f"admin:{app_label}_{model_name}_changelist")

            resp = self.client.get(url_changelist)
            self.assertEqual(
                resp.status_code,
                200,
                f"La page de liste admin pour {app_label}.{model_name} a échoué avec le code {resp.status_code}",
            )
            modeles_testes.append(f"{app_label}.{model_name}")

        # S'assurer qu'au moins les modèles clés de chaque application sont enregistrés
        modeles_attendus = {
            "core.user",
            "core.domaine",
            "core.cohorte",
            "core.projet",
            "incubator.dossier",
            "incubator.piece",
            "incubator.evaluation",
            "incubator.decision",
            "documents.document",
            "documents.versiondocument",
            "gallery.ficheinnovation",
            "gallery.manifestationinteret",
            "analytics.partenariat",
            "analytics.financement",
            "assistant.conversation",
            "portal.actualite",
            "portal.evenement",
        }
        for attendu in modeles_attendus:
            self.assertIn(attendu, modeles_testes, f"Le modèle {attendu} doit être enregistré dans l'admin.")

    def test_export_csv_utilisateurs_sans_mot_de_passe(self):
        """L'action d'export CSV pour User exporte les données SANS fuiter de mot de passe ni hash."""
        self.client.force_login(self.admin_user)
        url = reverse("admin:core_user_changelist")

        # Sélection des utilisateurs
        data = {
            "action": "action_exporter_csv",
            "_selected_action": [str(self.admin_user.id), str(self.porteur.id)],
        }
        resp = self.client.post(url, data)
        self.assertEqual(resp.status_code, 200)
        self.assertIn("text/csv", resp["Content-Type"])
        self.assertIn("utilisateurs_ciat", resp["Content-Disposition"])

        content = resp.content.decode("utf-8-sig")
        # Vérifier présence des colonnes attendues
        self.assertIn("Email", content)
        self.assertIn("Role", content)
        self.assertIn(self.porteur.email, content)
        self.assertIn(self.admin_user.email, content)

        # Vérifier ABSENCE absolue de hash de mot de passe ou mot de passe en clair
        self.assertNotIn("AdminSecretPassword123!", content)
        self.assertNotIn("PorteurPassword123!", content)
        self.assertNotIn("pbkdf2", content)
        self.assertNotIn("argon2", content)
        self.assertNotIn("md5$", content)

    def test_export_csv_dossiers_et_projets(self):
        """Vérifie le fonctionnement de l'action CSV sur Dossier et Projet."""
        self.client.force_login(self.admin_user)

        # 1. Export Projets
        url_projets = reverse("admin:core_projet_changelist")
        resp_projets = self.client.post(
            url_projets,
            {"action": "action_exporter_csv", "_selected_action": [str(self.projet.id)]},
        )
        self.assertEqual(resp_projets.status_code, 200)
        self.assertIn("text/csv", resp_projets["Content-Type"])
        content_projets = resp_projets.content.decode("utf-8-sig")
        self.assertIn("Centrale Biomasse", content_projets)

        # 2. Export Dossiers
        url_dossiers = reverse("admin:incubator_dossier_changelist")
        resp_dossiers = self.client.post(
            url_dossiers,
            {"action": "action_exporter_csv", "_selected_action": [str(self.dossier.id)]},
        )
        self.assertEqual(resp_dossiers.status_code, 200)
        self.assertIn("text/csv", resp_dossiers["Content-Type"])
        content_dossiers = resp_dossiers.content.decode("utf-8-sig")
        self.assertIn("soumis", content_dossiers)
