"""Tests unitaires pour la commande de seed des données de démonstration."""
from datetime import timedelta
from django.core.management import call_command
from django.test import TestCase, override_settings
from django.contrib.auth import authenticate
from apps.core.models import Cohorte, Domaine, Projet, Role, User


@override_settings(PASSWORD_HASHERS=["django.contrib.auth.hashers.MD5PasswordHasher"])
class SeedDemoCommandTestCase(TestCase):
    """Vérifie la conformité, le réalisme et l'idempotence des données de démonstration."""

    def test_seed_demo_complete_and_idempotent(self):
        # 1. Premier appel : création initiale des données
        call_command("seed_demo")

        # Vérification des domaines (7 domaines CIAT)
        self.assertEqual(Domaine.objects.count(), 7)

        # Vérification des cohortes (3 cohortes : 2024, 2025, 2026)
        self.assertEqual(Cohorte.objects.count(), 3)
        self.assertTrue(Cohorte.objects.filter(annee=2024).exists())
        self.assertTrue(Cohorte.objects.filter(annee=2025).exists())
        self.assertTrue(Cohorte.objects.filter(annee=2026).exists())

        # Vérification des comptes socles équipe
        for email, expected_role in [
            ("admin@ciat.sn", Role.ADMIN),
            ("coordo@ciat.sn", Role.COORDONNATEUR),
            ("mentor@ciat.sn", Role.MENTOR),
            ("comite@ciat.sn", Role.COMITE),
            ("porteur@ciat.sn", Role.PORTEUR),
        ]:
            user = User.objects.filter(email=email).first()
            self.assertIsNotNone(user, f"Le compte {email} doit exister.")
            self.assertEqual(user.role, expected_role)
            auth_user = authenticate(username=email, password="Ciat2026!")
            self.assertIsNotNone(auth_user, f"L'authentification pour {email} doit réussir avec Ciat2026!.")

        # Vérification des porteurs de démonstration
        porteurs_demo = User.objects.filter(email__endswith="@demo.ciat.sn", role=Role.PORTEUR)
        self.assertGreaterEqual(porteurs_demo.count(), 35, "Au moins 35 porteurs démo doivent être créés.")

        # Vérification de la parité femmes/hommes crédible (~40 % femmes)
        total_porteurs = User.objects.filter(role=Role.PORTEUR).count()
        femmes = User.objects.filter(role=Role.PORTEUR, genre=User.Genre.FEMME).count()
        pourcentage_femmes = (femmes / total_porteurs) * 100
        self.assertGreaterEqual(pourcentage_femmes, 30.0, "La proportion de femmes doit être >= 30%.")
        self.assertLessEqual(pourcentage_femmes, 50.0, "La proportion de femmes doit être <= 50%.")

        # Vérification du volume de projets (exactement 62 projets)
        nb_projets = Projet.objects.count()
        self.assertEqual(nb_projets, 62, "Exactement 62 projets doivent être générés.")

        # Vérification de la représentation de tous les statuts
        tous_les_statuts = {choice[0] for choice in Projet.Statut.choices}
        statuts_presents = set(Projet.objects.values_list("statut", flat=True).distinct())
        self.assertEqual(
            statuts_presents,
            tous_les_statuts,
            f"Tous les statuts de Projet.Statut doivent être représentés. Manquants: {tous_les_statuts - statuts_presents}",
        )

        # Vérification de la majorité sur les statuts avancés
        statuts_avances = [
            Projet.Statut.SELECTIONNE,
            Projet.Statut.INCUBE,
            Projet.Statut.PROTOTYPE,
            Projet.Statut.TERMINE,
        ]
        nb_avances = Projet.objects.filter(statut__in=statuts_avances).count()
        self.assertGreater(
            nb_avances,
            nb_projets / 2,
            "La majorité des projets doit être en statut avancé (sélectionné, incubé, prototype, terminé).",
        )

        # Vérification de l'étalement des dates de création sur au moins 12 à 18 mois
        projets_dates = list(Projet.objects.order_by("cree_le").values_list("cree_le", flat=True))
        delta_dates = projets_dates[-1] - projets_dates[0]
        self.assertGreater(delta_dates, timedelta(days=365), "Les dates de création doivent s'étaler sur plus d'un an.")

        # 2. Idempotence : un second appel consécutif ne doit créer aucun doublon
        users_count_before = User.objects.count()
        domaines_count_before = Domaine.objects.count()
        cohortes_count_before = Cohorte.objects.count()
        projets_count_before = Projet.objects.count()

        call_command("seed_demo")

        self.assertEqual(User.objects.count(), users_count_before, "Le nombre d'utilisateurs ne doit pas changer.")
        self.assertEqual(Domaine.objects.count(), domaines_count_before, "Le nombre de domaines ne doit pas changer.")
        self.assertEqual(Cohorte.objects.count(), cohortes_count_before, "Le nombre de cohortes ne doit pas changer.")
        self.assertEqual(Projet.objects.count(), projets_count_before, "Le nombre de projets ne doit pas changer.")
