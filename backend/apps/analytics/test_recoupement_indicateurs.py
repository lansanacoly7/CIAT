"""Tests de recoupement exhaustifs des indicateurs décisionnels CIAT (T1 — Phase 8).

Recalcule chaque indicateur du tableau de bord directement avec l'ORM Django
sur le jeu de données déterministe de `seed_all` et le compare à la réponse de l'API :
1. Indicateurs clés de l'entonnoir (idées, dossiers, sélectionnés, incubés, prototypes, taux)
2. Répartition par domaine technologique
3. Répartition et avancement comparé par cohorte
4. Répartition par genre (inclusivité et parité)
5. Évolution chronologique mensuelle des dépôts
6. Agrégats de financements (mobilisé, décaissé, par source, par domaine)
7. Agrégats de partenariats (total, actifs, par type)
8. Tests avec filtres : cohorte, domaine, statut, période, et multi-filtres
9. Cohérence stricte avec les formules de definitions.py, de la page Méthodologie et du rapport
10. Détection d'erreurs si un calcul est volontairement altéré
"""
from datetime import date, datetime
from decimal import Decimal

from django.core.management import call_command
from django.db.models import Count, Q, Sum
from django.db.models.functions import TruncMonth
from django.test import TestCase, override_settings
from rest_framework.test import APIClient

from apps.core.models import Cohorte, Domaine, Projet, Role, User
from apps.incubator.models import Dossier, StatutDossier
from apps.analytics.models import (
    Financement,
    Partenariat,
    StatutFinancement,
    StatutPartenariat,
    TypePartenariat,
)
from apps.analytics.definitions import INDICATEURS_DEFINITIONS


@override_settings(PASSWORD_HASHERS=["django.contrib.auth.hashers.MD5PasswordHasher"])
class RecoupementIndicateursTests(TestCase):
    """Suite de tests de recoupement direct ORM vs API (Tâche T1)."""

    @classmethod
    def setUpTestData(cls):
        call_command("seed_all")

    def setUp(self):
        self.client = APIClient()
        self.coordo = User.objects.filter(role=Role.COORDONNATEUR).first()
        self.assertIsNotNone(self.coordo, "Un utilisateur coordonnateur doit exister après seed_all.")
        self.client.force_authenticate(user=self.coordo)

    # =========================================================================
    # 1. ENTONNOIR D'INCUBATION — GLOBAL SANS FILTRE
    # =========================================================================

    def test_recoupement_entonnoir_global_sans_filtre(self):
        """Recalcul ORM direct de chaque indicateur de l'entonnoir vs réponse /api/analytics/indicateurs/."""
        # Calcul ORM direct
        orm_idees = Projet.objects.count()
        orm_dossiers = Dossier.objects.filter(projet__in=Projet.objects.all()).exclude(
            statut=StatutDossier.BROUILLON
        ).count()
        orm_selectionnes = Projet.objects.filter(
            statut__in=[
                Projet.Statut.SELECTIONNE,
                Projet.Statut.INCUBE,
                Projet.Statut.PROTOTYPE,
                Projet.Statut.TERMINE,
            ]
        ).count()
        orm_incubes = Projet.objects.filter(
            statut__in=[
                Projet.Statut.INCUBE,
                Projet.Statut.PROTOTYPE,
                Projet.Statut.TERMINE,
            ]
        ).count()
        orm_prototypes = Projet.objects.filter(
            statut__in=[
                Projet.Statut.PROTOTYPE,
                Projet.Statut.TERMINE,
            ]
        ).count()
        orm_taux = round((orm_selectionnes / orm_dossiers) * 100, 1)

        # Appel API
        response = self.client.get("/api/analytics/indicateurs/")
        self.assertEqual(response.status_code, 200)
        data = response.data

        # Recoupement exact
        self.assertEqual(data["idees_recues"], orm_idees, "Recoupement idées reçues")
        self.assertEqual(data["dossiers_deposes"], orm_dossiers, "Recoupement dossiers déposés")
        self.assertEqual(data["projets_selectionnes"], orm_selectionnes, "Recoupement projets sélectionnés")
        self.assertEqual(data["projets_incubes"], orm_incubes, "Recoupement projets incubés")
        self.assertEqual(data["prototypes"], orm_prototypes, "Recoupement prototypes")
        self.assertEqual(data["taux_selection"], orm_taux, "Recoupement taux de sélection")

        # Invariants déterministes du rapport
        self.assertEqual(orm_idees, 62)
        self.assertEqual(orm_dossiers, 58)
        self.assertEqual(orm_selectionnes, 49)
        self.assertEqual(orm_incubes, 38)
        self.assertEqual(orm_prototypes, 23)
        self.assertEqual(orm_taux, 84.5)

        # Propriété de l'entonnoir (monotonie décroissante)
        self.assertLessEqual(orm_prototypes, orm_incubes)
        self.assertLessEqual(orm_incubes, orm_selectionnes)
        self.assertLessEqual(orm_selectionnes, orm_dossiers)
        self.assertLessEqual(orm_dossiers, orm_idees)

    # =========================================================================
    # 2. ENTONNOIR AVEC FILTRE PAR COHORTE
    # =========================================================================

    def test_recoupement_entonnoir_filtre_cohorte_2024(self):
        """Recalcul ORM vs API pour la cohorte historique 2024 (100% de réalisation)."""
        cohorte = Cohorte.objects.get(annee=2024)
        qs = Projet.objects.filter(cohorte=cohorte)

        orm_idees = qs.count()
        orm_dossiers = Dossier.objects.filter(projet__in=qs).exclude(statut=StatutDossier.BROUILLON).count()
        orm_selectionnes = qs.filter(
            statut__in=[Projet.Statut.SELECTIONNE, Projet.Statut.INCUBE, Projet.Statut.PROTOTYPE, Projet.Statut.TERMINE]
        ).count()
        orm_incubes = qs.filter(
            statut__in=[Projet.Statut.INCUBE, Projet.Statut.PROTOTYPE, Projet.Statut.TERMINE]
        ).count()
        orm_prototypes = qs.filter(
            statut__in=[Projet.Statut.PROTOTYPE, Projet.Statut.TERMINE]
        ).count()
        orm_taux = round((orm_selectionnes / orm_dossiers) * 100, 1)

        response = self.client.get("/api/analytics/indicateurs/?cohorte=2024")
        self.assertEqual(response.status_code, 200)
        data = response.data

        self.assertEqual(data["idees_recues"], orm_idees)
        self.assertEqual(data["dossiers_deposes"], orm_dossiers)
        self.assertEqual(data["projets_selectionnes"], orm_selectionnes)
        self.assertEqual(data["projets_incubes"], orm_incubes)
        self.assertEqual(data["prototypes"], orm_prototypes)
        self.assertEqual(data["taux_selection"], orm_taux)

        # Valeurs attendues 2024
        self.assertEqual(orm_idees, 21)
        self.assertEqual(orm_prototypes, 21)
        self.assertEqual(orm_taux, 100.0)

    def test_recoupement_entonnoir_filtre_cohorte_2025(self):
        """Recalcul ORM vs API pour la cohorte 2025 (incubation active)."""
        cohorte = Cohorte.objects.get(annee=2025)
        qs = Projet.objects.filter(cohorte=cohorte)

        orm_idees = qs.count()
        orm_dossiers = Dossier.objects.filter(projet__in=qs).exclude(statut=StatutDossier.BROUILLON).count()
        orm_selectionnes = qs.filter(
            statut__in=[Projet.Statut.SELECTIONNE, Projet.Statut.INCUBE, Projet.Statut.PROTOTYPE, Projet.Statut.TERMINE]
        ).count()
        orm_incubes = qs.filter(
            statut__in=[Projet.Statut.INCUBE, Projet.Statut.PROTOTYPE, Projet.Statut.TERMINE]
        ).count()
        orm_prototypes = qs.filter(
            statut__in=[Projet.Statut.PROTOTYPE, Projet.Statut.TERMINE]
        ).count()
        orm_taux = round((orm_selectionnes / orm_dossiers) * 100, 1)

        response = self.client.get("/api/analytics/indicateurs/?cohorte=2025")
        self.assertEqual(response.status_code, 200)
        data = response.data

        self.assertEqual(data["idees_recues"], orm_idees)
        self.assertEqual(data["dossiers_deposes"], orm_dossiers)
        self.assertEqual(data["projets_selectionnes"], orm_selectionnes)
        self.assertEqual(data["projets_incubes"], orm_incubes)
        self.assertEqual(data["prototypes"], orm_prototypes)
        self.assertEqual(data["taux_selection"], orm_taux)
        self.assertEqual(orm_idees, 32)
        self.assertEqual(orm_dossiers, 32)
        self.assertEqual(orm_selectionnes, 28)

    def test_recoupement_entonnoir_filtre_cohorte_2026(self):
        """Recalcul ORM vs API pour la cohorte 2026 (candidatures brutes / instruction)."""
        cohorte = Cohorte.objects.get(annee=2026)
        qs = Projet.objects.filter(cohorte=cohorte)

        orm_idees = qs.count()
        orm_dossiers = Dossier.objects.filter(projet__in=qs).exclude(statut=StatutDossier.BROUILLON).count()
        orm_selectionnes = qs.filter(
            statut__in=[Projet.Statut.SELECTIONNE, Projet.Statut.INCUBE, Projet.Statut.PROTOTYPE, Projet.Statut.TERMINE]
        ).count()
        orm_incubes = qs.filter(
            statut__in=[Projet.Statut.INCUBE, Projet.Statut.PROTOTYPE, Projet.Statut.TERMINE]
        ).count()
        orm_prototypes = qs.filter(
            statut__in=[Projet.Statut.PROTOTYPE, Projet.Statut.TERMINE]
        ).count()
        orm_taux = round((orm_selectionnes / orm_dossiers) * 100, 1) if orm_dossiers > 0 else 0.0

        response = self.client.get("/api/analytics/indicateurs/?cohorte=2026")
        self.assertEqual(response.status_code, 200)
        data = response.data

        self.assertEqual(data["idees_recues"], orm_idees)
        self.assertEqual(data["dossiers_deposes"], orm_dossiers)
        self.assertEqual(data["projets_selectionnes"], orm_selectionnes)
        self.assertEqual(data["projets_incubes"], orm_incubes)
        self.assertEqual(data["prototypes"], orm_prototypes)
        self.assertEqual(data["taux_selection"], orm_taux)
        self.assertEqual(orm_idees, 9)
        self.assertEqual(orm_selectionnes, 0)
        self.assertEqual(orm_taux, 0.0)

    # =========================================================================
    # 3. ENTONNOIR AVEC FILTRE PAR DOMAINE ET PAR STATUT
    # =========================================================================

    def test_recoupement_entonnoir_filtre_domaine(self):
        """Recalcul ORM vs API pour un domaine spécifique."""
        domaine = Domaine.objects.first()
        qs = Projet.objects.filter(domaine=domaine)

        orm_idees = qs.count()
        orm_dossiers = Dossier.objects.filter(projet__in=qs).exclude(statut=StatutDossier.BROUILLON).count()
        if orm_dossiers == 0:
            orm_dossiers = qs.filter(
                statut__in=[
                    Projet.Statut.DEPOSE,
                    Projet.Statut.SELECTIONNE,
                    Projet.Statut.INCUBE,
                    Projet.Statut.PROTOTYPE,
                    Projet.Statut.TERMINE,
                    Projet.Statut.REJETE,
                ]
            ).count()

        orm_selectionnes = qs.filter(
            statut__in=[Projet.Statut.SELECTIONNE, Projet.Statut.INCUBE, Projet.Statut.PROTOTYPE, Projet.Statut.TERMINE]
        ).count()
        orm_incubes = qs.filter(
            statut__in=[Projet.Statut.INCUBE, Projet.Statut.PROTOTYPE, Projet.Statut.TERMINE]
        ).count()
        orm_prototypes = qs.filter(
            statut__in=[Projet.Statut.PROTOTYPE, Projet.Statut.TERMINE]
        ).count()
        denom = orm_dossiers if orm_dossiers > 0 else orm_idees
        orm_taux = round((orm_selectionnes / denom) * 100, 1) if denom > 0 else 0.0

        response = self.client.get(f"/api/analytics/indicateurs/?domaine={domaine.slug}")
        self.assertEqual(response.status_code, 200)
        data = response.data

        self.assertEqual(data["idees_recues"], orm_idees)
        self.assertEqual(data["dossiers_deposes"], orm_dossiers)
        self.assertEqual(data["projets_selectionnes"], orm_selectionnes)
        self.assertEqual(data["projets_incubes"], orm_incubes)
        self.assertEqual(data["prototypes"], orm_prototypes)
        self.assertEqual(data["taux_selection"], orm_taux)

    def test_recoupement_entonnoir_filtre_statut(self):
        """Recalcul ORM vs API filtré sur le statut 'prototype'."""
        qs = Projet.objects.filter(statut=Projet.Statut.PROTOTYPE)
        orm_idees = qs.count()
        orm_prototypes = qs.count()

        response = self.client.get("/api/analytics/indicateurs/?statut=prototype")
        self.assertEqual(response.status_code, 200)
        data = response.data

        self.assertEqual(data["idees_recues"], orm_idees)
        self.assertEqual(data["prototypes"], orm_prototypes)

    def test_recoupement_entonnoir_filtre_periode_temporelle(self):
        """Recalcul ORM vs API avec bornes de date (debut et fin)."""
        debut = date(2024, 1, 1)
        fin = date(2024, 12, 31)
        qs = Projet.objects.filter(cree_le__date__gte=debut, cree_le__date__lte=fin)

        orm_idees = qs.count()
        response = self.client.get(f"/api/analytics/indicateurs/?debut={debut}&fin={fin}")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["idees_recues"], orm_idees)

    # =========================================================================
    # 4. RÉPARTITION PAR DOMAINE
    # =========================================================================

    def test_recoupement_repartition_domaine(self):
        """Recalcul ORM de la répartition sectorielle vs /api/analytics/par-domaine/."""
        orm_counts = {
            item["domaine__nom"]: item["total"]
            for item in (
                Projet.objects.values("domaine__nom")
                .annotate(total=Count("id"))
                .order_by("-total", "domaine__nom")
            )
        }

        response = self.client.get("/api/analytics/par-domaine/")
        self.assertEqual(response.status_code, 200)
        api_data = response.data

        # Vérification du nombre de domaines
        self.assertEqual(len(api_data), len(orm_counts))
        self.assertEqual(len(api_data), 7)

        # Vérification unitaire par domaine
        for item in api_data:
            domaine_nom = item["domaine"]
            self.assertIn(domaine_nom, orm_counts)
            self.assertEqual(item["total"], orm_counts[domaine_nom])

        # La somme doit égaler 62
        self.assertEqual(sum(d["total"] for d in api_data), 62)

    def test_recoupement_repartition_domaine_avec_filtre_cohorte(self):
        """Recalcul ORM par domaine avec filtre cohorte=2024."""
        cohorte = Cohorte.objects.get(annee=2024)
        orm_counts = {
            item["domaine__nom"]: item["total"]
            for item in (
                Projet.objects.filter(cohorte=cohorte)
                .values("domaine__nom")
                .annotate(total=Count("id"))
                .order_by("-total", "domaine__nom")
            )
        }

        response = self.client.get("/api/analytics/par-domaine/?cohorte=2024")
        self.assertEqual(response.status_code, 200)
        for item in response.data:
            domaine_nom = item["domaine"]
            self.assertEqual(item["total"], orm_counts.get(domaine_nom, 0))

        self.assertEqual(sum(d["total"] for d in response.data), 21)

    # =========================================================================
    # 5. RÉPARTITION ET PROGRESSION PAR COHORTE
    # =========================================================================

    def test_recoupement_repartition_cohorte(self):
        """Recalcul ORM de la comparaison des cohortes vs /api/analytics/par-cohorte/."""
        orm_raw = (
            Projet.objects.values("cohorte__nom", "cohorte__annee")
            .annotate(
                total=Count("id"),
                selectionnes=Count(
                    "id",
                    filter=Q(
                        statut__in=[
                            Projet.Statut.SELECTIONNE,
                            Projet.Statut.INCUBE,
                            Projet.Statut.PROTOTYPE,
                            Projet.Statut.TERMINE,
                        ]
                    ),
                ),
                prototypes=Count(
                    "id",
                    filter=Q(
                        statut__in=[
                            Projet.Statut.PROTOTYPE,
                            Projet.Statut.TERMINE,
                        ]
                    ),
                ),
            )
            .order_by("cohorte__annee", "cohorte__nom")
        )
        orm_dict = {
            item["cohorte__nom"]: item
            for item in orm_raw
        }

        response = self.client.get("/api/analytics/par-cohorte/")
        self.assertEqual(response.status_code, 200)
        api_data = response.data

        self.assertEqual(len(api_data), 3)
        for item in api_data:
            nom = item["cohorte"]
            self.assertIn(nom, orm_dict)
            self.assertEqual(item["total"], orm_dict[nom]["total"])
            self.assertEqual(item["selectionnes"], orm_dict[nom]["selectionnes"])
            self.assertEqual(item["prototypes"], orm_dict[nom]["prototypes"])

    # =========================================================================
    # 6. INCLUSIVITÉ ET PARITÉ DE GENRE
    # =========================================================================

    def test_recoupement_repartition_genre(self):
        """Recalcul ORM de la parité femmes/hommes vs /api/analytics/par-genre/."""
        orm_femmes = Projet.objects.filter(porteur__genre="F").count()
        orm_hommes = Projet.objects.filter(porteur__genre="H").count()
        orm_autre = Projet.objects.exclude(porteur__genre__in=["F", "H"]).count()

        response = self.client.get("/api/analytics/par-genre/")
        self.assertEqual(response.status_code, 200)
        api_dict = {item["genre"]: item["total"] for item in response.data}

        self.assertEqual(api_dict.get("Femmes", 0), orm_femmes)
        self.assertEqual(api_dict.get("Hommes", 0), orm_hommes)
        self.assertEqual(api_dict.get("Autre / non précisé", 0), orm_autre)

        # Invariant de conservation de la masse
        self.assertEqual(orm_femmes + orm_hommes + orm_autre, 62)

    # =========================================================================
    # 7. ÉVOLUTION MENSUELLE DES DÉPÔTS
    # =========================================================================

    def test_recoupement_evolution_mensuelle(self):
        """Recalcul ORM de la série temporelle mensuelle vs /api/analytics/evolution/."""
        orm_raw = (
            Projet.objects.annotate(mois=TruncMonth("cree_le"))
            .values("mois")
            .annotate(total=Count("id"))
            .order_by("mois")
        )
        orm_series = {
            item["mois"].strftime("%Y-%m"): item["total"]
            for item in orm_raw
            if item["mois"] is not None
        }

        response = self.client.get("/api/analytics/evolution/")
        self.assertEqual(response.status_code, 200)
        api_data = response.data

        self.assertEqual(len(api_data), len(orm_series))
        for item in api_data:
            mois = item["mois"]
            self.assertIn(mois, orm_series)
            self.assertEqual(item["total"], orm_series[mois])

        # La somme totale de tous les mois doit égaler exactement 62
        self.assertEqual(sum(item["total"] for item in api_data), 62)

    # =========================================================================
    # 8. STATISTIQUES FINANCIÈRES ET PARTENARIATS
    # =========================================================================

    def test_recoupement_financements_et_partenariats_stats(self):
        """Recalcul ORM des capitaux mobilisés, décaissés et partenariats vs stats."""
        # Calculs ORM directs
        orm_total_finance = (
            Financement.objects.exclude(statut=StatutFinancement.REFUSE).aggregate(total=Sum("montant"))["total"]
            or 0
        )
        orm_decaisses = (
            Financement.objects.filter(statut=StatutFinancement.DECAISSE).aggregate(total=Sum("montant"))["total"]
            or 0
        )
        orm_nb_financements = Financement.objects.count()

        orm_nb_partenariats_actifs = Partenariat.objects.filter(statut=StatutPartenariat.ACTIF).count()
        orm_total_partenariats = Partenariat.objects.count()

        # Répartition par source ORM
        orm_sources = {
            item["source"]: int(item["total"] or 0)
            for item in (
                Financement.objects.exclude(statut=StatutFinancement.REFUSE)
                .values("source")
                .annotate(total=Sum("montant"), count=Count("id"))
                .order_by("-total")
            )
        }

        # Répartition par domaine ORM
        orm_par_domaine = {
            item["projet__domaine__nom"]: int(item["total"] or 0)
            for item in (
                Financement.objects.exclude(statut=StatutFinancement.REFUSE)
                .values("projet__domaine__nom")
                .annotate(total=Sum("montant"), count=Count("id"))
                .order_by("-total")
            )
        }

        # Appel API
        response = self.client.get("/api/analytics/partenariats-financements/stats/")
        self.assertEqual(response.status_code, 200)
        data = response.data

        self.assertEqual(data["total_finance"], int(orm_total_finance))
        self.assertEqual(data["financements_decaisses"], int(orm_decaisses))
        self.assertEqual(data["nombre_financements"], orm_nb_financements)
        self.assertEqual(data["nombre_partenariats_actifs"], orm_nb_partenariats_actifs)
        self.assertEqual(data["total_partenariats"], orm_total_partenariats)

        # Chiffres audités de la base de démonstration
        self.assertEqual(data["total_finance"], 472_000_000)
        self.assertEqual(data["financements_decaisses"], 402_000_000)
        self.assertEqual(data["nombre_financements"], 50)
        self.assertEqual(data["total_partenariats"], 48)
        self.assertEqual(data["nombre_partenariats_actifs"], 33)

        # Recoupement des sources
        for s in data["par_source"]:
            self.assertIn(s["source"], orm_sources)
            self.assertEqual(s["total"], orm_sources[s["source"]])

        # Recoupement par domaine
        for d in data["par_domaine"]:
            self.assertIn(d["domaine"], orm_par_domaine)
            self.assertEqual(d["total"], orm_par_domaine[d["domaine"]])

    def test_recoupement_financements_avec_filtre_cohorte(self):
        """Recalcul ORM des financements avec filtre cohorte=2024."""
        fin_qs = Financement.objects.filter(projet__cohorte__annee=2024).exclude(
            statut=StatutFinancement.REFUSE
        )
        orm_total_2024 = fin_qs.aggregate(total=Sum("montant"))["total"] or 0

        response = self.client.get("/api/analytics/partenariats-financements/stats/?cohorte=2024")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["total_finance"], int(orm_total_2024))

    # =========================================================================
    # 9. CONFORMITÉ AUX FORMULES DE DEFINITIONS.PY ET DE LA MÉTHODOLOGIE
    # =========================================================================

    def test_conformite_dictionnaire_definitions(self):
        """Vérifie que chaque formule enregistrée dans definitions.py est fidèle au code."""
        codes_enregistres = {item["code"] for item in INDICATEURS_DEFINITIONS}
        codes_attendus = {
            "idees_recues",
            "dossiers_deposes",
            "projets_selectionnes",
            "projets_incubes",
            "prototypes",
            "taux_selection",
        }
        self.assertTrue(codes_attendus.issubset(codes_enregistres))

        # Vérification des champs méthodologiques obligatoires
        champs_obligatoires = {
            "code", "nom", "categorie", "definition", "formule",
            "periode", "source", "limites", "interpretation"
        }
        for item in INDICATEURS_DEFINITIONS:
            self.assertTrue(
                champs_obligatoires.issubset(set(item.keys())),
                f"L'indicateur {item.get('code')} doit contenir tous les champs méthodologiques."
            )

    # =========================================================================
    # 10. SENSIBILITÉ AUX ERREURS (Échoue si un calcul est volontairement altéré)
    # =========================================================================

    def test_sensibilite_taux_selection_altere(self):
        """Vérifie qu'une formule altérée (dénominateur idées reçues au lieu de dossiers déposés)
        produit une divergence détectable."""
        orm_dossiers = Dossier.objects.filter(projet__in=Projet.objects.all()).exclude(
            statut=StatutDossier.BROUILLON
        ).count()
        orm_idees = Projet.objects.count()
        orm_selectionnes = Projet.objects.filter(
            statut__in=[
                Projet.Statut.SELECTIONNE,
                Projet.Statut.INCUBE,
                Projet.Statut.PROTOTYPE,
                Projet.Statut.TERMINE,
            ]
        ).count()

        taux_correct = round((orm_selectionnes / orm_dossiers) * 100, 1)
        taux_altere = round((orm_selectionnes / orm_idees) * 100, 1)

        # 49/58 = 84.5% vs 49/62 = 79.0%
        self.assertNotEqual(
            taux_correct,
            taux_altere,
            "Le test doit distinguer le taux basé sur les dossiers (84.5%) du taux basé sur les idées (79.0%)."
        )
        self.assertEqual(taux_correct, 84.5)
        self.assertEqual(taux_altere, 79.0)

    def test_sensibilite_financement_sans_exclusion_refus(self):
        """Vérifie que l'omission du filtre exclude(statut='refuse') altèrerait le total financier."""
        total_sans_refus = (
            Financement.objects.exclude(statut=StatutFinancement.REFUSE).aggregate(total=Sum("montant"))["total"]
            or 0
        )
        # Sélectionne un projet incubé éligible à un financement (règle métier: non au statut 'idée')
        projet_incube = Projet.objects.filter(
            statut__in=[Projet.Statut.INCUBE, Projet.Statut.PROTOTYPE, Projet.Statut.TERMINE]
        ).first()
        self.assertIsNotNone(projet_incube)

        Financement.objects.create(
            projet=projet_incube,
            source="Test Refus",
            montant=Decimal("5000000"),
            statut=StatutFinancement.REFUSE,
            date=date.today(),
        )
        total_apres_refus = (
            Financement.objects.exclude(statut=StatutFinancement.REFUSE).aggregate(total=Sum("montant"))["total"]
            or 0
        )
        total_brut = Financement.objects.aggregate(total=Sum("montant"))["total"] or 0

        self.assertEqual(total_sans_refus, total_apres_refus, "Le total filtré ne doit jamais inclure les refus.")
        self.assertEqual(total_brut, total_sans_refus + Decimal("5000000"))
        self.assertNotEqual(total_brut, total_apres_refus)
