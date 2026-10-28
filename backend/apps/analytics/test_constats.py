"""Tests pour les constats déterministes et recommandations du tableau de bord (T2 - Phase 10).

Vérifie :
- Droits d'accès stricts (IsAnalyticsAuthorized).
- Absence absolue de constats sur de petits échantillons (ex: 2 projets).
- Recoupement exact de chaque règle calculée avec l'ORM.
- Présence des champs obligatoires { texte, chiffres, regle, limite }.
- Prise en compte exacte des filtres (?cohorte=, ?domaine=).
"""
from datetime import date, timedelta
from django.contrib.auth import get_user_model
from django.test import TestCase, override_settings
from django.urls import reverse
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APIClient

from apps.analytics.constats import SEUILS_CONSTATS
from apps.analytics.models import Financement, StatutFinancement
from apps.core.models import Cohorte, Domaine, Projet, Role
from apps.incubator.models import Jalon, StatutJalon

User = get_user_model()


@override_settings(PASSWORD_HASHERS=["django.contrib.auth.hashers.MD5PasswordHasher"])
class AnalyticsConstatsTests(TestCase):
    """Suite de tests unitaires pour le moteur de constats /api/analytics/constats/."""

    def setUp(self):
        self.client = APIClient()
        self.url = reverse("analytics-constats")

        # Utilisateurs
        self.admin = User.objects.create_user(
            email="admin.constats@ciat.sn", password="pwd", role=Role.ADMIN
        )
        self.coordo = User.objects.create_user(
            email="coordo.constats@ciat.sn", password="pwd", role=Role.COORDONNATEUR
        )
        self.comite = User.objects.create_user(
            email="comite.constats@ciat.sn", password="pwd", role=Role.COMITE
        )
        self.porteur = User.objects.create_user(
            email="porteur.constats@ciat.sn", password="pwd", role=Role.PORTEUR
        )
        self.visiteur = User.objects.create_user(
            email="visiteur.constats@ciat.sn", password="pwd", role=Role.VISITEUR
        )

    def test_permissions_acces_constats(self):
        """Seuls le coordonnateur, l'administrateur et le comité accèdent aux constats."""
        # Anonyme -> 401
        res = self.client.get(self.url)
        self.assertIn(res.status_code, [status.HTTP_401_UNAUTHORIZED, status.HTTP_403_FORBIDDEN])

        # Porteur -> 403
        self.client.force_authenticate(user=self.porteur)
        self.assertEqual(self.client.get(self.url).status_code, status.HTTP_403_FORBIDDEN)

        # Visiteur -> 403
        self.client.force_authenticate(user=self.visiteur)
        self.assertEqual(self.client.get(self.url).status_code, status.HTTP_403_FORBIDDEN)

        # Coordonnateur -> 200
        self.client.force_authenticate(user=self.coordo)
        self.assertEqual(self.client.get(self.url).status_code, status.HTTP_200_OK)

        # Admin -> 200
        self.client.force_authenticate(user=self.admin)
        self.assertEqual(self.client.get(self.url).status_code, status.HTTP_200_OK)

        # Comité -> 200
        self.client.force_authenticate(user=self.comite)
        self.assertEqual(self.client.get(self.url).status_code, status.HTTP_200_OK)

    def test_aucun_constat_sur_petit_echantillon(self):
        """Garantie essentielle de T2 : aucun constat ni pourcentage n'apparaît sur un petit échantillon (ex: 2 projets)."""
        self.client.force_authenticate(user=self.coordo)
        domaine = Domaine.objects.create(nom="Santé", slug="sante")
        cohorte = Cohorte.objects.create(nom="Cohorte 2025", annee=2025)

        # Seulement 2 projets créés
        for i in range(2):
            Projet.objects.create(
                titre=f"Projet Petit Test {i}",
                domaine=domaine,
                cohorte=cohorte,
                porteur=self.porteur,
                statut=Projet.Statut.DEPOSE,
            )

        res = self.client.get(self.url)
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        data = res.json()

        # La liste des constats DOIT être vide car les seuils minimaux ne sont pas atteints
        self.assertEqual(data["constats"], [])
        self.assertEqual(data["total_constats"], 0)
        self.assertIn("seuils", data)
        self.assertEqual(data["seuils"]["MIN_PROJETS_DOMAINE"], 10)

    def test_recoupement_exhaustif_des_5_regles_avec_l_orm(self):
        """Vérifie le calcul exact et le recoupement de chacune des 5 règles quand l'échantillon est représentatif."""
        self.client.force_authenticate(user=self.coordo)

        dom_sante = Domaine.objects.create(nom="Santé & Biotech", slug="sante")
        dom_agri = Domaine.objects.create(nom="Agro-Industrie", slug="agri")
        cohorte = Cohorte.objects.create(nom="Cohorte 2025", annee=2025)

        # Création de 12 porteurs (5 femmes et 7 hommes)
        porteurs_f = [
            User.objects.create_user(
                email=f"femme{i}@ciat.sn", password="pwd", role=Role.PORTEUR, genre="F"
            )
            for i in range(5)
        ]
        porteurs_h = [
            User.objects.create_user(
                email=f"homme{i}@ciat.sn", password="pwd", role=Role.PORTEUR, genre="M"
            )
            for i in range(7)
        ]
        tous_porteurs = porteurs_f + porteurs_h  # 12 porteurs

        # Création de 15 projets au total :
        # - 10 en Santé (majoritaire = 10/15 = 66.7%)
        # - 5 en Agriculture (5/15 = 33.3%)
        # Statuts : 4 déposés, 8 sélectionnés/incubés, 3 idées
        # Dossiers déposés pour sélection = 4 + 8 = 12. Taux sélection = 8 / 12 = 66.7%
        projets = []
        for i in range(10):
            p = Projet.objects.create(
                titre=f"Projet Santé {i}",
                domaine=dom_sante,
                cohorte=cohorte,
                porteur=tous_porteurs[i % len(tous_porteurs)],
                statut=Projet.Statut.INCUBE if i < 8 else Projet.Statut.DEPOSE,
            )
            projets.append(p)

        for j in range(5):
            p = Projet.objects.create(
                titre=f"Projet Agri {j}",
                domaine=dom_agri,
                cohorte=cohorte,
                porteur=tous_porteurs[(10 + j) % len(tous_porteurs)],
                statut=Projet.Statut.DEPOSE if j < 2 else Projet.Statut.IDEE,
            )
            projets.append(p)

        # Création de 6 jalons : 2 en retard > 30 jours, 4 en temps voulu
        date_retard = timezone.now().date() - timedelta(days=45)
        date_future = timezone.now().date() + timedelta(days=20)
        for k in range(6):
            Jalon.objects.create(
                projet=projets[k],
                titre=f"Jalon {k}",
                echeance=date_retard if k < 2 else date_future,
                statut=StatutJalon.A_FAIRE if k < 2 else StatutJalon.FAIT,
                cree_par=self.coordo,
            )

        # Création de 6 financements :
        # Total engagé = 6 * 10 000 000 = 60 000 000 FCFA
        # Total décaissé = 3 * 10 000 000 = 30 000 000 FCFA (soit 50.0%)
        for m in range(6):
            Financement.objects.create(
                projet=projets[m],
                source=f"Bailleur {m}",
                montant=10000000,
                statut=StatutFinancement.DECAISSE if m < 3 else StatutFinancement.ACCORDE,
                date=date(2025, 5, 1),
            )

        res = self.client.get(self.url)
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        data = res.json()

        constats = {c["id"]: c for c in data["constats"]}

        # 1. Vérification Constat Domaine
        self.assertIn("concentration_domaine", constats)
        c_dom = constats["concentration_domaine"]
        self.assertEqual(c_dom["chiffres"]["domaine"], "Santé & Biotech")
        self.assertEqual(c_dom["chiffres"]["nombre"], 10)
        self.assertEqual(c_dom["chiffres"]["total"], 15)
        self.assertEqual(c_dom["chiffres"]["pourcentage"], 66.7)
        self.assertIn("66.7 %", c_dom["texte"])
        self.assertIn("seuil min : 10", c_dom["regle"])
        self.assertTrue(len(c_dom["limite"]) > 0)

        # 2. Vérification Constat Genre
        self.assertIn("parite_genre", constats)
        c_gen = constats["parite_genre"]
        self.assertEqual(c_gen["chiffres"]["femmes"], 5)
        self.assertEqual(c_gen["chiffres"]["total"], 12)
        # 5 / 12 = 41.7 %
        self.assertEqual(c_gen["chiffres"]["pourcentage"], 41.7)
        self.assertIn("41.7 %", c_gen["texte"])

        # 3. Vérification Constat Taux de Sélection
        self.assertIn("taux_selection", constats)
        c_sel = constats["taux_selection"]
        # Déposés = 10 (santé) + 2 (agri) = 12. Sélectionnés = 8
        self.assertEqual(c_sel["chiffres"]["selectionnes"], 8)
        self.assertEqual(c_sel["chiffres"]["deposes"], 12)
        # 8 / 12 = 66.7 %
        self.assertEqual(c_sel["chiffres"]["taux"], 66.7)
        self.assertIn("66.7 %", c_sel["texte"])

        # 4. Vérification Constat Jalons en Retard
        self.assertIn("retard_jalons", constats)
        c_jal = constats["retard_jalons"]
        self.assertEqual(c_jal["chiffres"]["retards_critiques"], 2)
        self.assertEqual(c_jal["chiffres"]["total_jalons"], 6)
        # 2 / 6 = 33.3 %
        self.assertEqual(c_jal["chiffres"]["pourcentage"], 33.3)
        self.assertIn("2 jalon(s) accusent un retard", c_jal["texte"])

        # 5. Vérification Constat Financements
        self.assertIn("decaissement_financements", constats)
        c_fin = constats["decaissement_financements"]
        self.assertEqual(c_fin["chiffres"]["montant_engage"], 60000000.0)
        self.assertEqual(c_fin["chiffres"]["montant_decaisse"], 30000000.0)
        self.assertEqual(c_fin["chiffres"]["taux"], 50.0)
        self.assertIn("50.0 %", c_fin["texte"])

        # Structure obligatoire présente pour chaque constat
        for cid, c in constats.items():
            self.assertIn("texte", c)
            self.assertIn("chiffres", c)
            self.assertIn("regle", c)
            self.assertIn("limite", c)

    def test_filtres_impactent_les_constats(self):
        """Les filtres ?domaine= et ?cohorte= restreignent rigoureusement les constats calculés."""
        self.client.force_authenticate(user=self.coordo)

        dom_tic = Domaine.objects.create(nom="TIC", slug="tic")
        dom_agri = Domaine.objects.create(nom="Agriculture", slug="agri")
        c2024 = Cohorte.objects.create(nom="Cohorte 2024", annee=2024)
        c2025 = Cohorte.objects.create(nom="Cohorte 2025", annee=2025)

        # 12 projets en 2024 (TIC)
        for i in range(12):
            Projet.objects.create(
                titre=f"Projet 2024 {i}",
                domaine=dom_tic,
                cohorte=c2024,
                porteur=self.porteur,
                statut=Projet.Statut.INCUBE,
            )

        # 2 projets en 2025 (Agri)
        for j in range(2):
            Projet.objects.create(
                titre=f"Projet 2025 {j}",
                domaine=dom_agri,
                cohorte=c2025,
                porteur=self.porteur,
                statut=Projet.Statut.DEPOSE,
            )

        # Filtre sur 2024 -> Echantillon suffisant (12 projets)
        res_2024 = self.client.get(f"{self.url}?cohorte=2024")
        self.assertEqual(res_2024.status_code, status.HTTP_200_OK)
        self.assertGreater(len(res_2024.json()["constats"]), 0)

        # Filtre sur 2025 -> Echantillon trop petit (2 projets) -> 0 constat
        res_2025 = self.client.get(f"{self.url}?cohorte=2025")
        self.assertEqual(res_2025.status_code, status.HTTP_200_OK)
        self.assertEqual(res_2025.json()["constats"], [])

