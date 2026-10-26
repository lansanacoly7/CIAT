"""Tests automatisés pour la commande seed_all et la cohérence transverse des modules."""
from decimal import Decimal
from django.core.management import call_command
from django.test import TestCase, override_settings
from rest_framework.test import APIClient

from apps.core.models import Cohorte, Domaine, Projet, Role, User
from apps.documents.models import Document, VersionDocument
from apps.gallery.models import FicheInnovation
from apps.incubator.models import (
    AffectationMentor,
    Decision,
    DecisionType,
    Dossier,
    EcheanceSuivi,
    Evaluation,
    Grille,
    Jalon,
    Note,
    Objectif,
    Piece,
    StatutDossier,
    StatutJalon,
    SuiviProjet,
    TypePiece,
)
from apps.portal.models import (
    Actualite,
    AppelProjet,
    DocumentPublic,
    Evenement,
    Partenaire,
)


@override_settings(PASSWORD_HASHERS=["django.contrib.auth.hashers.MD5PasswordHasher"])
class SeedAllCommandTestCase(TestCase):
    """Vérifie le remplissage cohérent de tous les modules et l'idempotence stricte."""

    def test_seed_all_complet_coherence_et_idempotence(self):
        # 1. Premier passage : initialisation et enrichissement global
        call_command("seed_all")

        # --- A. Socle Core ---
        self.assertEqual(Domaine.objects.count(), 7)
        self.assertEqual(Cohorte.objects.count(), 3)
        self.assertEqual(Projet.objects.count(), 62)

        # Vérification des rôles socles
        for email, expected_role in [
            ("admin@ciat.sn", Role.ADMIN),
            ("coordo@ciat.sn", Role.COORDONNATEUR),
            ("mentor@ciat.sn", Role.MENTOR),
            ("comite@ciat.sn", Role.COMITE),
            ("porteur@ciat.sn", Role.PORTEUR),
        ]:
            user = User.objects.filter(email=email).first()
            self.assertIsNotNone(user, f"L'utilisateur {email} doit exister.")
            self.assertEqual(user.role, expected_role)

        # --- B. Portail ---
        self.assertGreaterEqual(Actualite.objects.count(), 2)
        self.assertGreaterEqual(Evenement.objects.count(), 2)
        self.assertGreaterEqual(AppelProjet.objects.count(), 2)
        self.assertGreaterEqual(Partenaire.objects.count(), 3)
        self.assertGreaterEqual(DocumentPublic.objects.count(), 3)

        # --- C. Incubateur & Dossiers ---
        grille = Grille.objects.filter(active=True).first()
        self.assertIsNotNone(grille, "Une grille active doit exister.")
        self.assertEqual(grille.criteres.count(), 5, "La grille doit posséder 5 critères.")

        # Dossiers pour chaque projet non 'idée' (62 - 4 = 58)
        projets_non_idee = Projet.objects.exclude(statut=Projet.Statut.IDEE)
        self.assertEqual(projets_non_idee.count(), 58)
        self.assertEqual(Dossier.objects.count(), 58)

        pieces_attendues = {
            TypePiece.FICHE_PROJET,
            TypePiece.PRESENTATION_EQUIPE,
            TypePiece.BUDGET_PREVISIONNEL,
        }

        for dossier in Dossier.objects.all():
            # Complétude et pièces
            self.assertEqual(dossier.completude, 100)
            self.assertTrue(dossier.est_complet)
            self.assertEqual(dossier.pieces_manquantes, [])
            types_deposes = set(dossier.pieces.values_list("type", flat=True))
            self.assertEqual(types_deposes, pieces_attendues)
            self.assertIsNotNone(dossier.soumis_le)

            projet = dossier.projet
            # Cohérence statut dossier / projet / décision
            if projet.statut in (
                Projet.Statut.SELECTIONNE,
                Projet.Statut.INCUBE,
                Projet.Statut.PROTOTYPE,
                Projet.Statut.TERMINE,
            ):
                self.assertEqual(dossier.statut, StatutDossier.ACCEPTE)
                self.assertTrue(hasattr(dossier, "decision"))
                self.assertEqual(dossier.decision.decision, DecisionType.ACCEPTE)
                self.assertTrue(len(dossier.decision.motif) > 10)
                # Évaluations et notes
                evals = dossier.evaluations.all()
                self.assertGreaterEqual(evals.count(), 1)
                for ev in evals:
                    self.assertEqual(ev.notes.count(), 5)
                    self.assertGreater(ev.score, 12.0)

            elif projet.statut == Projet.Statut.REJETE:
                self.assertEqual(dossier.statut, StatutDossier.REFUSE)
                self.assertTrue(hasattr(dossier, "decision"))
                self.assertEqual(dossier.decision.decision, DecisionType.REFUSE)
                self.assertTrue(len(dossier.decision.motif) > 10)
                evals = dossier.evaluations.all()
                self.assertGreaterEqual(evals.count(), 1)
                for ev in evals:
                    self.assertEqual(ev.notes.count(), 5)
                    self.assertLess(ev.score, 11.0)

            elif projet.statut == Projet.Statut.DEPOSE:
                self.assertIn(dossier.statut, (StatutDossier.SOUMIS, StatutDossier.EN_EVALUATION))
                self.assertFalse(hasattr(dossier, "decision"))

        # --- D. Accompagnement : Mentors, Objectifs, Jalons, Suivis ---
        projets_avances = Projet.objects.filter(
            statut__in=[
                Projet.Statut.SELECTIONNE,
                Projet.Statut.INCUBE,
                Projet.Statut.PROTOTYPE,
                Projet.Statut.TERMINE,
            ]
        )
        self.assertEqual(projets_avances.count(), 49)

        # Chaque projet avancé a un mentor et des objectifs
        for p in projets_avances:
            self.assertTrue(hasattr(p, "affectation_mentor"))
            self.assertEqual(p.affectation_mentor.mentor.role, Role.MENTOR)
            self.assertEqual(p.objectifs.count(), 3)
            self.assertEqual(p.jalons.count(), 3)

        # Présence avérée de jalons en retard
        jalons_en_retard = [j for j in Jalon.objects.all() if j.en_retard]
        self.assertGreaterEqual(len(jalons_en_retard), 3, "Au moins 3 jalons doivent être en retard.")
        for jr in jalons_en_retard:
            self.assertNotEqual(jr.statut, StatutJalon.FAIT)
            self.assertTrue(jr.commentaires.exists(), "Un jalon en retard doit avoir un commentaire d'alerte.")

        # Présence de bilans de suivi à 3 et 6 mois pour projets anciens
        suivis_3m = SuiviProjet.objects.filter(echeance=EcheanceSuivi.TROIS_MOIS)
        suivis_6m = SuiviProjet.objects.filter(echeance=EcheanceSuivi.SIX_MOIS)
        self.assertGreaterEqual(suivis_3m.count(), 15, "Au moins 15 bilans à 3 mois doivent exister.")
        self.assertGreaterEqual(suivis_6m.count(), 8, "Au moins 8 bilans à 6 mois doivent exister.")
        for s in suivis_3m:
            self.assertTrue(isinstance(s.indicateurs, dict))
            self.assertIn("taux_avancement", s.indicateurs)

        # --- E. Galerie des innovations ---
        projets_galerie = Projet.objects.filter(
            statut__in=[Projet.Statut.PROTOTYPE, Projet.Statut.TERMINE]
        )
        self.assertEqual(projets_galerie.count(), 23)
        self.assertEqual(FicheInnovation.objects.count(), 23)

        # Cohérence des statuts de fiches
        fiches_publiees = FicheInnovation.objects.filter(statut=FicheInnovation.Statut.PUBLIE)
        fiches_en_val = FicheInnovation.objects.filter(statut=FicheInnovation.Statut.EN_VALIDATION)
        fiches_brouillon = FicheInnovation.objects.filter(statut=FicheInnovation.Statut.BROUILLON)

        self.assertEqual(fiches_publiees.count(), 19)
        self.assertEqual(fiches_en_val.count(), 2)
        self.assertEqual(fiches_brouillon.count(), 2)

        # Vérification sécurité : pas de fuite de données personnelles dans la galerie
        for f in FicheInnovation.objects.all():
            self.assertNotIn("@", f.equipe, "L'email ne doit pas être présent dans le texte de l'équipe.")
            self.assertNotIn("+221", f.equipe, "Le numéro de téléphone ne doit pas figurer dans la fiche.")
            if f.statut == FicheInnovation.Statut.PUBLIE:
                self.assertGreater(f.vues, 0)

        # --- F. Documents officiels générés sans IA ---
        docs = Document.objects.filter(projet__isnull=False)
        self.assertGreaterEqual(docs.count(), 6)
        for doc in docs:
            self.assertIn(doc.statut, (Document.Statut.VALIDE, Document.Statut.PUBLIE))
            v1 = doc.versions.filter(numero=1).first()
            self.assertIsNotNone(v1)
            self.assertTrue(len(v1.sections) >= 3)
            for sec in v1.sections:
                self.assertTrue(len(sec.get("contenu", "")) > 10)

        # --- G. Recoupement avec le tableau de bord décisionnel (Analytics) ---
        client = APIClient()
        admin_user = User.objects.filter(role=Role.ADMIN).first()
        client.force_authenticate(user=admin_user)
        resp = client.get("/api/analytics/indicateurs/")
        self.assertEqual(resp.status_code, 200)
        data = resp.json()

        # Recoupement mathématique parfait
        self.assertEqual(data["idees_recues"], 62)
        self.assertEqual(data["dossiers_deposes"], 58)
        self.assertEqual(data["projets_selectionnes"], 49)
        self.assertEqual(data["projets_incubes"], 38)  # incube (15) + prototype (12) + termine (11)
        self.assertEqual(data["prototypes"], 23)  # prototype (12) + termine (11)
        expected_taux = round((49 / 58) * 100, 1)
        self.assertEqual(data["taux_selection"], expected_taux)

        # --- H. Idempotence absolue : deuxième passage consécutif ---
        counts_before = {
            "User": User.objects.count(),
            "Domaine": Domaine.objects.count(),
            "Cohorte": Cohorte.objects.count(),
            "Projet": Projet.objects.count(),
            "Dossier": Dossier.objects.count(),
            "Piece": Piece.objects.count(),
            "Evaluation": Evaluation.objects.count(),
            "Note": Note.objects.count(),
            "Decision": Decision.objects.count(),
            "AffectationMentor": AffectationMentor.objects.count(),
            "Objectif": Objectif.objects.count(),
            "Jalon": Jalon.objects.count(),
            "SuiviProjet": SuiviProjet.objects.count(),
            "FicheInnovation": FicheInnovation.objects.count(),
            "Document": Document.objects.count(),
            "VersionDocument": VersionDocument.objects.count(),
            "Actualite": Actualite.objects.count(),
            "Evenement": Evenement.objects.count(),
            "AppelProjet": AppelProjet.objects.count(),
            "Partenaire": Partenaire.objects.count(),
            "DocumentPublic": DocumentPublic.objects.count(),
        }

        call_command("seed_all")

        counts_after = {
            "User": User.objects.count(),
            "Domaine": Domaine.objects.count(),
            "Cohorte": Cohorte.objects.count(),
            "Projet": Projet.objects.count(),
            "Dossier": Dossier.objects.count(),
            "Piece": Piece.objects.count(),
            "Evaluation": Evaluation.objects.count(),
            "Note": Note.objects.count(),
            "Decision": Decision.objects.count(),
            "AffectationMentor": AffectationMentor.objects.count(),
            "Objectif": Objectif.objects.count(),
            "Jalon": Jalon.objects.count(),
            "SuiviProjet": SuiviProjet.objects.count(),
            "FicheInnovation": FicheInnovation.objects.count(),
            "Document": Document.objects.count(),
            "VersionDocument": VersionDocument.objects.count(),
            "Actualite": Actualite.objects.count(),
            "Evenement": Evenement.objects.count(),
            "AppelProjet": AppelProjet.objects.count(),
            "Partenaire": Partenaire.objects.count(),
            "DocumentPublic": DocumentPublic.objects.count(),
        }

        for model_name, before_val in counts_before.items():
            after_val = counts_after[model_name]
            self.assertEqual(
                before_val,
                after_val,
                f"L'idempotence a échoué pour {model_name} : avant={before_val}, après={after_val}",
            )
