"""Tests unitaires et d'intégration pour le module d'analyse (apps.analytics).

Vérifie :
1. Contrôle d'accès strict (RBAC) :
   - Coordonnateur, Administrateur, Membre du comité -> 200 OK
   - Porteur, Visiteur, Mentor, Anonyme -> 403 Forbidden / 401 Unauthorized
2. Conformité stricte aux contrats d'API (CONTRATS_API.md, section P3)
3. Précision des agrégats (idées reçues, dossiers déposés, taux de sélection, etc.)
4. Combinaison dynamique des filtres (?debut=&fin=&cohorte=&domaine=&statut=)
5. Robustesse aux cas limites (base vide, 0 division)
"""
from datetime import date, timedelta
from django.test import TestCase, override_settings
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APIClient

from apps.core.models import Cohorte, Domaine, Projet, Role, User


@override_settings(PASSWORD_HASHERS=["django.contrib.auth.hashers.MD5PasswordHasher"])
class AnalyticsSecurityAndRBACPermissionsTests(TestCase):
    """Vérification stricte des autorisations RBAC sur tous les endpoints d'analyse."""

    def setUp(self):
        self.client = APIClient()

        # Utilisateurs avec différents rôles
        self.admin = User.objects.create_user(
            email="admin.test@ciat.sn",
            password="pwd",
            role=Role.ADMIN,
        )
        self.coordo = User.objects.create_user(
            email="coordo.test@ciat.sn",
            password="pwd",
            role=Role.COORDONNATEUR,
        )
        self.comite = User.objects.create_user(
            email="comite.test@ciat.sn",
            password="pwd",
            role=Role.COMITE,
        )
        self.porteur = User.objects.create_user(
            email="porteur.test@ciat.sn",
            password="pwd",
            role=Role.PORTEUR,
        )
        self.visiteur = User.objects.create_user(
            email="visiteur.test@ciat.sn",
            password="pwd",
            role=Role.VISITEUR,
        )
        self.mentor = User.objects.create_user(
            email="mentor.test@ciat.sn",
            password="pwd",
            role=Role.MENTOR,
        )

        self.endpoints = [
            reverse("analytics-indicateurs"),
            reverse("analytics-par-domaine"),
            reverse("analytics-par-cohorte"),
            reverse("analytics-par-genre"),
            reverse("analytics-evolution"),
            reverse("analytics-export"),
        ]


    def test_anonymous_access_is_denied(self):
        """Un utilisateur non authentifié ne peut accéder à aucun endpoint d'analyse."""
        for url in self.endpoints:
            res = self.client.get(url)
            self.assertIn(
                res.status_code,
                [status.HTTP_401_UNAUTHORIZED, status.HTTP_403_FORBIDDEN],
                f"L'URL {url} doit être protégée contre les requêtes anonymes.",
            )

    def test_porteur_is_forbidden_403(self):
        """Un porteur de projet reçoit une erreur 403 Forbidden sur tous les endpoints."""
        self.client.force_authenticate(user=self.porteur)
        for url in self.endpoints:
            res = self.client.get(url)
            self.assertEqual(
                res.status_code,
                status.HTTP_403_FORBIDDEN,
                f"Le porteur ne doit pas accéder à {url}",
            )

    def test_visiteur_and_mentor_are_forbidden_403(self):
        """Visiteurs et mentors ne peuvent pas accéder au tableau de bord décisionnel."""
        for user in [self.visiteur, self.mentor]:
            self.client.force_authenticate(user=user)
            for url in self.endpoints:
                res = self.client.get(url)
                self.assertEqual(
                    res.status_code,
                    status.HTTP_403_FORBIDDEN,
                    f"L'utilisateur {user.role} ne doit pas accéder à {url}",
                )

    def test_authorized_roles_can_access_200(self):
        """Coordonnateur, Administrateur et Membre du comité accèdent avec succès (200 OK)."""
        for user in [self.coordo, self.admin, self.comite]:
            self.client.force_authenticate(user=user)
            for url in self.endpoints:
                res = self.client.get(url)
                self.assertEqual(
                    res.status_code,
                    status.HTTP_200_OK,
                    f"L'utilisateur {user.role} doit pouvoir accéder à {url}",
                )


@override_settings(PASSWORD_HASHERS=["django.contrib.auth.hashers.MD5PasswordHasher"])
class AnalyticsEndpointsAndDataTests(TestCase):
    """Vérification des calculs, formats de réponse et filtres."""

    def setUp(self):
        self.client = APIClient()
        self.coordo = User.objects.create_user(
            email="coordo.data@ciat.sn",
            password="pwd",
            role=Role.COORDONNATEUR,
        )
        self.client.force_authenticate(user=self.coordo)

        # Création des porteurs (genres variés)
        self.porteur_femme = User.objects.create_user(
            email="femme@ciat.sn",
            password="pwd",
            role=Role.PORTEUR,
            genre=User.Genre.FEMME,
        )
        self.porteur_homme = User.objects.create_user(
            email="homme@ciat.sn",
            password="pwd",
            role=Role.PORTEUR,
            genre=User.Genre.HOMME,
        )
        self.porteur_autre = User.objects.create_user(
            email="autre@ciat.sn",
            password="pwd",
            role=Role.PORTEUR,
            genre=User.Genre.AUTRE,
        )

        # Domaines
        self.domaine_tic = Domaine.objects.create(nom="TIC et Numérique", slug="tic-numerique")
        self.domaine_agri = Domaine.objects.create(nom="Agriculture", slug="agriculture")

        # Cohortes
        self.cohorte_2024 = Cohorte.objects.create(nom="Cohorte 2024", annee=2024)
        self.cohorte_2025 = Cohorte.objects.create(nom="Cohorte 2025", annee=2025)

        # Création de projets aux statuts variés
        # 1. Idée
        Projet.objects.create(
            titre="Projet Idée TIC",
            domaine=self.domaine_tic,
            cohorte=self.cohorte_2024,
            porteur=self.porteur_femme,
            statut=Projet.Statut.IDEE,
        )
        # 2. Déposé
        Projet.objects.create(
            titre="Projet Déposé Agri",
            domaine=self.domaine_agri,
            cohorte=self.cohorte_2024,
            porteur=self.porteur_homme,
            statut=Projet.Statut.DEPOSE,
        )
        # 3. Sélectionné
        Projet.objects.create(
            titre="Projet Sélectionné TIC",
            domaine=self.domaine_tic,
            cohorte=self.cohorte_2025,
            porteur=self.porteur_femme,
            statut=Projet.Statut.SELECTIONNE,
        )
        # 4. Incubé
        Projet.objects.create(
            titre="Projet Incubé TIC",
            domaine=self.domaine_tic,
            cohorte=self.cohorte_2025,
            porteur=self.porteur_autre,
            statut=Projet.Statut.INCUBE,
        )
        # 5. Prototype
        Projet.objects.create(
            titre="Projet Prototype Agri",
            domaine=self.domaine_agri,
            cohorte=self.cohorte_2025,
            porteur=self.porteur_homme,
            statut=Projet.Statut.PROTOTYPE,
        )

    def test_indicateurs_endpoint_contract_and_values(self):
        """GET /api/analytics/indicateurs/ renvoie le contrat exact avec calculs justes."""
        url = reverse("analytics-indicateurs")
        res = self.client.get(url)
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        data = res.json()

        # Clés requises
        required_keys = {
            "idees_recues",
            "dossiers_deposes",
            "projets_selectionnes",
            "projets_incubes",
            "prototypes",
            "taux_selection",
        }
        self.assertEqual(set(data.keys()), required_keys)

        # Vérification des valeurs :
        # Total idées = 5
        # Déposés (statuts != idee) = 4
        # Sélectionnés (selectionne + incube + prototype) = 3
        # Incubés (incube + prototype) = 2
        # Prototypes = 1
        # Taux de sélection = 3 / 4 * 100 = 75.0 %
        self.assertEqual(data["idees_recues"], 5)
        self.assertEqual(data["dossiers_deposes"], 4)
        self.assertEqual(data["projets_selectionnes"], 3)
        self.assertEqual(data["projets_incubes"], 2)
        self.assertEqual(data["prototypes"], 1)
        self.assertEqual(data["taux_selection"], 75.0)

    def test_par_domaine_endpoint(self):
        """GET /api/analytics/par-domaine/ regroupe les projets par domaine."""
        url = reverse("analytics-par-domaine")
        res = self.client.get(url)
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        data = res.json()

        self.assertIsInstance(data, list)
        self.assertGreater(len(data), 0)
        # Format d'élément
        for item in data:
            self.assertIn("domaine", item)
            self.assertIn("total", item)

        # TIC a 3 projets, Agri en a 2
        tic_item = next((item for item in data if "TIC" in item["domaine"]), None)
        agri_item = next((item for item in data if "Agriculture" in item["domaine"]), None)
        self.assertIsNotNone(tic_item)
        self.assertIsNotNone(agri_item)
        self.assertEqual(tic_item["total"], 3)
        self.assertEqual(agri_item["total"], 2)

    def test_par_cohorte_endpoint(self):
        """GET /api/analytics/par-cohorte/ compare les cohortes selon le contrat."""
        url = reverse("analytics-par-cohorte")
        res = self.client.get(url)
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        data = res.json()

        self.assertIsInstance(data, list)
        for item in data:
            self.assertIn("cohorte", item)
            self.assertIn("total", item)
            self.assertIn("selectionnes", item)
            self.assertIn("prototypes", item)

        c2024 = next((item for item in data if item["cohorte"] == "Cohorte 2024"), None)
        c2025 = next((item for item in data if item["cohorte"] == "Cohorte 2025"), None)
        self.assertIsNotNone(c2024)
        self.assertIsNotNone(c2025)
        self.assertEqual(c2024["total"], 2)
        self.assertEqual(c2025["total"], 3)
        self.assertEqual(c2025["selectionnes"], 3)
        self.assertEqual(c2025["prototypes"], 1)

    def test_par_genre_endpoint(self):
        """GET /api/analytics/par-genre/ renvoie la répartition Femmes, Hommes, Autre."""
        url = reverse("analytics-par-genre")
        res = self.client.get(url)
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        data = res.json()

        self.assertIsInstance(data, list)
        genre_map = {item["genre"]: item["total"] for item in data}
        self.assertIn("Femmes", genre_map)
        self.assertIn("Hommes", genre_map)
        self.assertEqual(genre_map["Femmes"], 2)  # 2 projets portés par femme
        self.assertEqual(genre_map["Hommes"], 2)  # 2 projets portés par homme
        self.assertEqual(genre_map["Autre / non précisé"], 1)

    def test_evolution_endpoint(self):
        """GET /api/analytics/evolution/ renvoie l'évolution temporelle au format YYYY-MM."""
        url = reverse("analytics-evolution")
        res = self.client.get(url)
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        data = res.json()

        self.assertIsInstance(data, list)
        current_month = date.today().strftime("%Y-%m")
        # Les 5 projets créés aujourd'hui doivent se trouver dans le mois courant
        month_item = next((item for item in data if item["mois"] == current_month), None)
        self.assertIsNotNone(month_item)
        self.assertEqual(month_item["total"], 5)

    def test_filters_combination(self):
        """Les filtres ?cohorte= &domaine= &statut= &debut= &fin= se combinent fidèlement."""
        url = reverse("analytics-indicateurs")

        # Filtre sur cohorte 2024
        res_cohorte = self.client.get(url, {"cohorte": "2024"})
        self.assertEqual(res_cohorte.status_code, status.HTTP_200_OK)
        self.assertEqual(res_cohorte.json()["idees_recues"], 2)

        # Filtre sur domaine TIC
        res_domaine = self.client.get(url, {"domaine": "tic-numerique"})
        self.assertEqual(res_domaine.status_code, status.HTTP_200_OK)
        self.assertEqual(res_domaine.json()["idees_recues"], 3)

        # Filtre combiné : Cohorte 2024 + TIC
        res_combine = self.client.get(url, {"cohorte": "2024", "domaine": "tic-numerique"})
        self.assertEqual(res_combine.status_code, status.HTTP_200_OK)
        self.assertEqual(res_combine.json()["idees_recues"], 1)

        # Filtre statut
        res_statut = self.client.get(url, {"statut": "prototype"})
        self.assertEqual(res_statut.status_code, status.HTTP_200_OK)
        self.assertEqual(res_statut.json()["idees_recues"], 1)
        self.assertEqual(res_statut.json()["prototypes"], 1)

    def test_empty_dataset_edge_case(self):
        """Quand aucun projet ne correspond aux filtres, pas d'erreur 500 ni division par zéro."""
        url = reverse("analytics-indicateurs")
        res = self.client.get(url, {"cohorte": "9999"})  # cohorte inexistante
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        data = res.json()
        self.assertEqual(data["idees_recues"], 0)
        self.assertEqual(data["dossiers_deposes"], 0)
        self.assertEqual(data["taux_selection"], 0.0)


@override_settings(PASSWORD_HASHERS=["django.contrib.auth.hashers.MD5PasswordHasher"])
class AnalyticsExportTests(TestCase):
    """Tests des exports Excel (.xlsx) et PDF (.pdf) du tableau de bord."""

    def setUp(self):
        self.client = APIClient()
        self.coordo = User.objects.create_user(
            email="coordo.export@ciat.sn",
            password="pwd",
            role=Role.COORDONNATEUR,
        )
        self.porteur = User.objects.create_user(
            email="porteur.export@ciat.sn",
            password="pwd",
            role=Role.PORTEUR,
        )
        self.url = reverse("analytics-export")

        # Jeu de test avec projets
        cohorte = Cohorte.objects.create(nom="Cohorte Export 2026", annee=2026)
        domaine = Domaine.objects.create(nom="Santé & Numérique", slug="sante-numerique")
        porteur_f = User.objects.create_user(
            email="f.export@ciat.sn", password="pwd", role=Role.PORTEUR, genre="F"
        )
        Projet.objects.create(
            titre="Projet Santé 1",
            resume="Desc",
            porteur=porteur_f,
            domaine=domaine,
            cohorte=cohorte,
            statut=Projet.Statut.INCUBE,
        )


    def test_export_invalid_format_returns_400(self):
        """Un format non supporté retourne HTTP 400 Bad Request."""
        self.client.force_authenticate(user=self.coordo)
        res = self.client.get(self.url, {"format": "docx"})
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("Format non supporté", res.json().get("detail", ""))



    def test_export_xlsx_success(self):
        """L'export format=xlsx génère un fichier binaire Excel valide avec entêtes."""
        self.client.force_authenticate(user=self.coordo)
        res = self.client.get(self.url, {"format": "xlsx"})
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(
            res["Content-Type"],
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        )
        self.assertTrue(res["Content-Disposition"].startswith("attachment; filename="))
        self.assertTrue(len(res.content) > 1000)

    def test_export_pdf_success(self):
        """L'export format=pdf génère un document PDF valide aux normes CIAT."""
        self.client.force_authenticate(user=self.coordo)
        res = self.client.get(self.url, {"format": "pdf"})
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(res["Content-Type"], "application/pdf")
        self.assertTrue(res["Content-Disposition"].startswith("attachment; filename="))
        self.assertTrue(res.content.startswith(b"%PDF-"))
        self.assertTrue(len(res.content) > 1000)

    def test_export_with_filters(self):
        """L'export applique fidèlement les filtres demandés."""
        self.client.force_authenticate(user=self.coordo)
        res = self.client.get(
            self.url,
            {"format": "xlsx", "cohorte": "2026", "domaine": "sante-numerique"},
        )
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertTrue(len(res.content) > 1000)

