"""Tests pour l'endpoint GET /api/incubator/calendrier/?mois=AAAA-MM (Phase 7 — T1).

Vérifie l'ensemble des exigences fonctionnelles et non-fonctionnelles :
- Paramètre mois manquant ou invalide (400)
- Authentification requise (401)
- Droits et périmètres d'accès (Admin, Coordonnateur, Mentor, Porteur, Porteur étranger, Visiteur)
- Structure de données : [{ date, type, titre, projet, statut, en_retard }]
- Filtrage strict sur le mois demandé (hors-période exclu)
- Tri chronologique
- Évaluation exacte de l'indicateur 'en_retard' pour jalons et objectifs
- Absence de requêtes N+1 (select_related) et test de performance
"""
import datetime

from django.contrib.auth import get_user_model
from django.test import override_settings
from django.urls import reverse
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APITestCase

from apps.core.models import Domaine, Projet, Role
from apps.incubator.models import (
    AffectationMentor,
    Jalon,
    Objectif,
    StatutJalon,
    StatutObjectif,
)

User = get_user_model()


@override_settings(PASSWORD_HASHERS=["django.contrib.auth.hashers.MD5PasswordHasher"])
class IncubateurCalendrierTests(APITestCase):
    """Suite de tests pour la vue calendrier de l'incubateur."""

    def setUp(self):
        self.url = reverse("incubator:incubateur-calendrier")

        # Utilisateurs avec différents rôles
        self.admin = User.objects.create_user(
            email="admin.cal@ciat.sn",
            first_name="Admin",
            last_name="CIAT",
            password="password123",
            role=Role.ADMIN,
        )
        self.coordo = User.objects.create_user(
            email="coordo.cal@ciat.sn",
            first_name="Coordo",
            last_name="CIAT",
            password="password123",
            role=Role.COORDONNATEUR,
        )
        self.mentor1 = User.objects.create_user(
            email="mentor1.cal@ciat.sn",
            first_name="Mentor",
            last_name="Un",
            password="password123",
            role=Role.MENTOR,
        )
        self.mentor2 = User.objects.create_user(
            email="mentor2.cal@ciat.sn",
            first_name="Mentor",
            last_name="Deux",
            password="password123",
            role=Role.MENTOR,
        )
        self.porteur1 = User.objects.create_user(
            email="porteur1.cal@ciat.sn",
            first_name="Porteur",
            last_name="Un",
            password="password123",
            role=Role.PORTEUR,
        )
        self.porteur2 = User.objects.create_user(
            email="porteur2.cal@ciat.sn",
            first_name="Porteur",
            last_name="Deux",
            password="password123",
            role=Role.PORTEUR,
        )
        self.visiteur = User.objects.create_user(
            email="visiteur.cal@ciat.sn",
            first_name="Visiteur",
            last_name="CIAT",
            password="password123",
            role=Role.VISITEUR,
        )

        self.domaine = Domaine.objects.create(nom="Technologies Agri", slug="tech-agri-cal")

        # Projet 1 : porté par porteur1, mentoré par mentor1
        self.projet1 = Projet.objects.create(
            titre="Projet Solaire Agri",
            porteur=self.porteur1,
            domaine=self.domaine,
            statut=Projet.Statut.INCUBE,
        )
        AffectationMentor.objects.create(
            projet=self.projet1,
            mentor=self.mentor1,
            affecte_par=self.admin,
        )

        # Projet 2 : porté par porteur2, mentoré par mentor2
        self.projet2 = Projet.objects.create(
            titre="Projet BioSanté",
            porteur=self.porteur2,
            domaine=self.domaine,
            statut=Projet.Statut.INCUBE,
        )
        AffectationMentor.objects.create(
            projet=self.projet2,
            mentor=self.mentor2,
            affecte_par=self.admin,
        )

        # Événements en Octobre 2026 (Mois cible)
        # Projet 1
        self.j1_p1 = Jalon.objects.create(
            projet=self.projet1,
            titre="Jalon P1 Octobre 10",
            echeance=datetime.date(2026, 10, 10),
            statut=StatutJalon.A_FAIRE,
            cree_par=self.admin,
        )
        self.obj1_p1 = Objectif.objects.create(
            projet=self.projet1,
            libelle="Objectif P1 Octobre 05",
            echeance=datetime.date(2026, 10, 5),
            statut=StatutObjectif.EN_COURS,
            cree_par=self.admin,
        )
        self.j2_p1 = Jalon.objects.create(
            projet=self.projet1,
            titre="Jalon P1 Octobre 25 (Fait)",
            echeance=datetime.date(2026, 10, 25),
            statut=StatutJalon.FAIT,
            cree_par=self.admin,
        )

        # Projet 2
        self.j1_p2 = Jalon.objects.create(
            projet=self.projet2,
            titre="Jalon P2 Octobre 15",
            echeance=datetime.date(2026, 10, 15),
            statut=StatutJalon.A_FAIRE,
            cree_par=self.admin,
        )
        self.obj1_p2 = Objectif.objects.create(
            projet=self.projet2,
            libelle="Objectif P2 Octobre 20",
            echeance=datetime.date(2026, 10, 20),
            statut=StatutObjectif.ATTEINT,
            cree_par=self.admin,
        )

        # Événement hors période (Novembre 2026)
        self.j_nov = Jalon.objects.create(
            projet=self.projet1,
            titre="Jalon P1 Novembre 02",
            echeance=datetime.date(2026, 11, 2),
            statut=StatutJalon.A_FAIRE,
            cree_par=self.admin,
        )

    def test_non_authentifie_renvoie_401(self):
        """Un visiteur non connecté reçoit un code HTTP 401."""
        response = self.client.get(f"{self.url}?mois=2026-10")
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_mois_manquant_renvoie_400(self):
        """L'omission du paramètre mois renvoie HTTP 400 avec un message clair."""
        self.client.force_authenticate(user=self.admin)
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("detail", response.data)
        self.assertIn("obligatoire", response.data["detail"].lower())

    def test_mois_invalide_format_renvoie_400(self):
        """Des formats de mois invalides renvoient HTTP 400 avec message clair."""
        self.client.force_authenticate(user=self.admin)
        cas_invalides = ["2026-13", "2026-00", "2026", "2026-1", "octobre-2026", "2026/10"]
        for m in cas_invalides:
            with self.subTest(mois=m):
                response = self.client.get(f"{self.url}?mois={m}")
                self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
                self.assertIn("detail", response.data)
                self.assertIn("invalide", response.data["detail"].lower())

    def test_admin_et_coordonnateur_voient_tout(self):
        """L'administrateur et le coordonnateur ont une visibilité globale sur tous les projets."""
        for u in [self.admin, self.coordo]:
            with self.subTest(user=u.email):
                self.client.force_authenticate(user=u)
                response = self.client.get(f"{self.url}?mois=2026-10")
                self.assertEqual(response.status_code, status.HTTP_200_OK)
                # 3 événements P1 (j1, obj1, j2) + 2 événements P2 (j1, obj1) = 5
                self.assertEqual(len(response.data), 5)
                projets_vus = {item["projet"] for item in response.data}
                self.assertEqual(projets_vus, {"Projet Solaire Agri", "Projet BioSanté"})

    def test_porteur_voit_uniquement_ses_projets(self):
        """Un porteur ne voit que les jalons et objectifs de ses propres projets."""
        self.client.force_authenticate(user=self.porteur1)
        response = self.client.get(f"{self.url}?mois=2026-10")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 3)
        for item in response.data:
            self.assertEqual(item["projet"], "Projet Solaire Agri")

    def test_porteur_etranger_ne_voit_rien(self):
        """Un porteur qui n'a aucun projet n'accède à aucun événement."""
        autre_porteur = User.objects.create_user(
            email="porteur3.cal@ciat.sn",
            password="password123",
            role=Role.PORTEUR,
        )
        self.client.force_authenticate(user=autre_porteur)
        response = self.client.get(f"{self.url}?mois=2026-10")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data, [])

    def test_mentor_voit_uniquement_projets_affectes(self):
        """Un mentor ne voit que les événements des projets qui lui sont affectés."""
        self.client.force_authenticate(user=self.mentor1)
        response = self.client.get(f"{self.url}?mois=2026-10")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 3)
        for item in response.data:
            self.assertEqual(item["projet"], "Projet Solaire Agri")

        # Mentor 2 ne voit que Projet 2 (2 événements)
        self.client.force_authenticate(user=self.mentor2)
        response2 = self.client.get(f"{self.url}?mois=2026-10")
        self.assertEqual(response2.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response2.data), 2)
        for item in response2.data:
            self.assertEqual(item["projet"], "Projet BioSanté")

    def test_visiteur_ne_voit_rien(self):
        """Un utilisateur de rôle visiteur ne voit aucun événement d'incubation."""
        self.client.force_authenticate(user=self.visiteur)
        response = self.client.get(f"{self.url}?mois=2026-10")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data, [])

    def test_filtrage_strict_du_mois(self):
        """L'événement de novembre (j_nov) ne figure pas dans le calendrier d'octobre."""
        self.client.force_authenticate(user=self.admin)
        response = self.client.get(f"{self.url}?mois=2026-10")
        titres = [item["titre"] for item in response.data]
        self.assertNotIn("Jalon P1 Novembre 02", titres)

        # En interrogeant novembre, on le retrouve bien
        response_nov = self.client.get(f"{self.url}?mois=2026-11")
        titres_nov = [item["titre"] for item in response_nov.data]
        self.assertIn("Jalon P1 Novembre 02", titres_nov)
        self.assertEqual(len(response_nov.data), 1)

    def test_tri_chronologique(self):
        """Les événements sont ordonnés de façon chronologique par date croissante."""
        self.client.force_authenticate(user=self.admin)
        response = self.client.get(f"{self.url}?mois=2026-10")
        dates = [item["date"] for item in response.data]
        self.assertEqual(dates, sorted(dates))
        # Vérification des dates réelles
        self.assertEqual(
            dates,
            ["2026-10-05", "2026-10-10", "2026-10-15", "2026-10-20", "2026-10-25"],
        )

    def test_indicateur_en_retard(self):
        """Vérifie le calcul fidèle de l'indicateur 'en_retard' pour jalons et objectifs."""
        today = timezone.now().date()

        # Événement passé non validé
        pass_date = today - datetime.timedelta(days=2)
        mois_passe = pass_date.strftime("%Y-%m")
        j_retard = Jalon.objects.create(
            projet=self.projet1,
            titre="Jalon en retard",
            echeance=pass_date,
            statut=StatutJalon.A_FAIRE,
            cree_par=self.admin,
        )
        obj_retard = Objectif.objects.create(
            projet=self.projet1,
            libelle="Objectif en retard",
            echeance=pass_date,
            statut=StatutObjectif.EN_COURS,
            cree_par=self.admin,
        )
        # Événement passé mais achevé
        j_ok = Jalon.objects.create(
            projet=self.projet1,
            titre="Jalon terminé dans les temps",
            echeance=pass_date,
            statut=StatutJalon.FAIT,
            cree_par=self.admin,
        )
        obj_ok = Objectif.objects.create(
            projet=self.projet1,
            libelle="Objectif atteint",
            echeance=pass_date,
            statut=StatutObjectif.ATTEINT,
            cree_par=self.admin,
        )

        self.client.force_authenticate(user=self.admin)
        response = self.client.get(f"{self.url}?mois={mois_passe}")
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        map_retard = {item["titre"]: item["en_retard"] for item in response.data}
        self.assertTrue(map_retard["Jalon en retard"])
        self.assertTrue(map_retard["Objectif en retard"])
        self.assertFalse(map_retard["Jalon terminé dans les temps"])
        self.assertFalse(map_retard["Objectif atteint"])

    def test_performance_nombre_de_requetes(self):
        """L'endpoint ne doit exécuter aucune requête N+1 lors de la récupération des données."""
        # Création de plusieurs jalons et objectifs pour vérifier que le nombre de requêtes reste constant
        for i in range(10):
            Jalon.objects.create(
                projet=self.projet1 if i % 2 == 0 else self.projet2,
                titre=f"Jalon Perf {i}",
                echeance=datetime.date(2026, 10, 1 + i),
                statut=StatutJalon.A_FAIRE,
                cree_par=self.admin,
            )
            Objectif.objects.create(
                projet=self.projet1 if i % 2 == 0 else self.projet2,
                libelle=f"Objectif Perf {i}",
                echeance=datetime.date(2026, 10, 1 + i),
                statut=StatutObjectif.A_FAIRE,
                cree_par=self.admin,
            )

        self.client.force_authenticate(user=self.admin)
        # 1 requête pour Jalon (+ select_related projet) + 1 requête pour Objectif (+ select_related projet)
        with self.assertNumQueries(2):
            response = self.client.get(f"{self.url}?mois=2026-10")
            self.assertEqual(response.status_code, status.HTTP_200_OK)
            # Au moins 25 événements
            self.assertGreaterEqual(len(response.data), 25)
