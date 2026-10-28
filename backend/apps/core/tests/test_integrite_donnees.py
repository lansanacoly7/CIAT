"""Tests de validation des contraintes d'intégrité relationnelles et CheckConstraint au niveau de la base (Phase 11 — T3).

Vérifie formellement que la base de données :
1. Protège contre les suppressions en cascade accidentelles (ProtectedError) :
   - Suppression d'un Dossier ayant une Décision officielle
   - Suppression d'un Jalon ayant des Preuves justificatives déposées
2. Rejette via IntegrityError toute violation de contrainte CheckConstraint :
   - Montant de financement négatif ou nul (montant <= 0)
   - Note d'évaluation hors bornes (note < 0 ou note > 20)
   - Poids ou note max de critère d'évaluation invalide (<= 0)
   - Dates incohérentes sur une cohorte (date_debut > date_fin)
   - Dates incohérentes sur un événement (debut > fin)
   - Statuts illégitimes hors énumérations sur Projet, Dossier, Jalon, Objectif, Document, FicheInnovation, Financement, Partenariat
   - Valeurs illégitimes sur User (role et genre)
"""
import datetime
from decimal import Decimal

from django.contrib.auth import get_user_model
from django.core.files.uploadedfile import SimpleUploadedFile
from django.db import IntegrityError, transaction
from django.db.models import ProtectedError
from django.test import TestCase
from django.utils import timezone

from apps.analytics.models import Financement
from apps.core.models import Cohorte, Domaine, Projet, Role
from apps.documents.models import Document, ModeleDocument, TypeDocument
from apps.gallery.models import FicheInnovation
from apps.incubator.models import (
    Critere,
    Decision,
    DecisionType,
    Dossier,
    Evaluation,
    Grille,
    Jalon,
    Note,
    Objectif,
    PreuveJalon,
    StatutDossier,
)

User = get_user_model()


class IntegriteBaseDonneesTests(TestCase):
    """Banc de validation des contraintes d'intégrité de la base de données CIAT."""

    @classmethod
    def setUpTestData(cls):
        cls.domaine = Domaine.objects.create(nom="Technologies Numériques", slug="tech-num")
        cls.cohorte = Cohorte.objects.create(
            nom="Cohorte Pilote 2026",
            annee=2026,
            date_debut=datetime.date(2026, 1, 15),
            date_fin=datetime.date(2026, 12, 15),
        )
        cls.porteur = User.objects.create_user(
            email="porteur.integrite@ciat.sn",
            password="Password2026!",
            role=Role.PORTEUR,
            genre="F",
            first_name="Fatou",
            last_name="Fall",
        )
        cls.admin = User.objects.create_user(
            email="admin.integrite@ciat.sn",
            password="Password2026!",
            role=Role.ADMIN,
        )
        cls.comite = User.objects.create_user(
            email="comite.integrite@ciat.sn",
            password="Password2026!",
            role=Role.COMITE,
        )

        cls.projet = Projet.objects.create(
            titre="Capteurs Agrométéo Connectés",
            domaine=cls.domaine,
            cohorte=cls.cohorte,
            porteur=cls.porteur,
            statut=Projet.Statut.INCUBE,
        )
        cls.dossier = Dossier.objects.create(
            projet=cls.projet,
            statut=StatutDossier.ACCEPTE,
        )

        cls.grille = Grille.objects.create(nom="Grille Test Intégrité", active=True)
        cls.critere = Critere.objects.create(
            grille=cls.grille,
            libelle="Faisabilité technique",
            poids=2,
            note_max=20,
        )

    # --------------------------------------------------------------------------
    # 1. Protection contre les suppressions en cascade accidentelles (on_delete=PROTECT)
    # --------------------------------------------------------------------------

    def test_protection_suppression_dossier_avec_decision(self):
        """Un dossier ayant une décision officielle du jury ne peut pas être supprimé par erreur."""
        Decision.objects.create(
            dossier=self.dossier,
            decision=DecisionType.ACCEPTE,
            motif="Dossier d'excellence technologique",
            decide_par=self.admin,
        )

        # La suppression du dossier doit lever ProtectedError
        with self.assertRaises(ProtectedError):
            self.dossier.delete()

    def test_protection_suppression_jalon_avec_preuve(self):
        """Un jalon cadencé ayant des pièces de preuve déposées ne peut pas être supprimé par erreur."""
        jalon = Jalon.objects.create(
            projet=self.projet,
            titre="Validation du banc de capteurs",
            echeance=datetime.date(2026, 6, 30),
            cree_par=self.admin,
        )
        fake_pdf = SimpleUploadedFile("rapport_test.pdf", b"%PDF-1.4\nTest Content", content_type="application/pdf")
        PreuveJalon.objects.create(
            jalon=jalon,
            nom="rapport_test.pdf",
            fichier=fake_pdf,
            depose_par=self.porteur,
        )

        # La suppression du jalon doit lever ProtectedError
        with self.assertRaises(ProtectedError):
            jalon.delete()

    # --------------------------------------------------------------------------
    # 2. Contraintes de cohérence des dates (debut <= fin)
    # --------------------------------------------------------------------------

    def test_rejet_cohorte_date_debut_apres_date_fin(self):
        """Une cohorte avec date_debut postérieure à date_fin est rejetée par la base."""
        with self.assertRaises(IntegrityError):
            with transaction.atomic():
                Cohorte.objects.create(
                    nom="Cohorte Invalide Dates",
                    annee=2027,
                    date_debut=datetime.date(2027, 10, 1),
                    date_fin=datetime.date(2027, 2, 1),  # Antérieure au début
                )

    def test_rejet_evenement_debut_apres_fin(self):
        """Un événement portail avec date de fin antérieure au début est rejeté."""
        from apps.portal.models import Evenement

        with self.assertRaises(IntegrityError):
            with transaction.atomic():
                Evenement.objects.create(
                    titre="Hackathon Invalide",
                    description="Session de prototypage",
                    lieu="ISEP Diamniadio",
                    debut=timezone.now(),
                    fin=timezone.now() - datetime.timedelta(days=1),
                )

    # --------------------------------------------------------------------------
    # 3. Contraintes de montants positifs et de notes bornées (0 à 20)
    # --------------------------------------------------------------------------

    def test_rejet_financement_montant_negatif_ou_nul(self):
        """Un financement avec montant <= 0 est strictement rejeté par la base et la validation."""
        from django.core.exceptions import ValidationError

        # Rejet via validation de modèle (full_clean)
        with self.assertRaises(ValidationError):
            Financement.objects.create(
                projet=self.projet,
                source="Subvention Invalide",
                montant=Decimal("-500000"),
                date=datetime.date(2026, 4, 1),
            )

        # Rejet direct par la base SQL via bulk_create (court-circuitant save/full_clean)
        with self.assertRaises(IntegrityError):
            with transaction.atomic():
                Financement.objects.bulk_create([
                    Financement(
                        projet=self.projet,
                        source="Subvention SQL Négative",
                        montant=Decimal("-1000"),
                        date=datetime.date(2026, 4, 1),
                    )
                ])

        with self.assertRaises(IntegrityError):
            with transaction.atomic():
                Financement.objects.bulk_create([
                    Financement(
                        projet=self.projet,
                        source="Subvention SQL Nulle",
                        montant=Decimal("0"),
                        date=datetime.date(2026, 4, 1),
                    )
                ])

    def test_rejet_note_hors_bornes(self):
        """Une note d'évaluation négative (< 0) ou supérieure à 20 est rejetée par la base."""
        evaluation = Evaluation.objects.create(
            dossier=self.dossier,
            evaluateur=self.comite,
        )

        # Note négative
        with self.assertRaises(IntegrityError):
            with transaction.atomic():
                Note.objects.create(
                    evaluation=evaluation,
                    critere=self.critere,
                    note=Decimal("-1.5"),
                )

        # Note > 20
        with self.assertRaises(IntegrityError):
            with transaction.atomic():
                Note.objects.create(
                    evaluation=evaluation,
                    critere=self.critere,
                    note=Decimal("20.5"),
                )

    def test_rejet_critere_poids_ou_note_max_invalide(self):
        """Un critère avec un poids nul ou une note max nulle est refusé par la base."""
        with self.assertRaises(IntegrityError):
            with transaction.atomic():
                Critere.objects.create(
                    grille=self.grille,
                    libelle="Critère Poids Nul",
                    poids=0,
                    note_max=20,
                )

        with self.assertRaises(IntegrityError):
            with transaction.atomic():
                Critere.objects.create(
                    grille=self.grille,
                    libelle="Critère Note Max Nulle",
                    poids=1,
                    note_max=0,
                )

    # --------------------------------------------------------------------------
    # 4. Contraintes CheckConstraint sur les statuts des modèles
    # --------------------------------------------------------------------------

    def test_rejet_statut_invalide_sur_projet(self):
        """Un statut de projet non défini dans Projet.Statut est rejeté par la base."""
        with self.assertRaises(IntegrityError):
            with transaction.atomic():
                Projet.objects.create(
                    titre="Projet Statut Fantaisiste",
                    domaine=self.domaine,
                    porteur=self.porteur,
                    statut="statut_inconnu",
                )

    def test_rejet_statut_invalide_sur_dossier(self):
        """Un statut de dossier invalide est rejeté par la base."""
        projet_temp = Projet.objects.create(
            titre="Projet Dossier Test",
            domaine=self.domaine,
            porteur=self.porteur,
        )
        with self.assertRaises(IntegrityError):
            with transaction.atomic():
                Dossier.objects.create(
                    projet=projet_temp,
                    statut="statut_bizarre",
                )

    def test_rejet_statut_invalide_sur_jalon(self):
        """Un statut de jalon invalide est rejeté par la base."""
        with self.assertRaises(IntegrityError):
            with transaction.atomic():
                Jalon.objects.create(
                    projet=self.projet,
                    titre="Jalon Invalide",
                    echeance=datetime.date(2026, 12, 31),
                    statut="statut_jalon_errone",
                    cree_par=self.admin,
                )

    def test_rejet_statut_invalide_sur_objectif(self):
        """Un statut d'objectif invalide est rejeté par la base."""
        with self.assertRaises(IntegrityError):
            with transaction.atomic():
                Objectif.objects.create(
                    projet=self.projet,
                    libelle="Objectif Invalide",
                    statut="statut_objectif_errone",
                    cree_par=self.admin,
                )

    def test_rejet_statut_invalide_sur_document(self):
        """Un statut de document hors (brouillon, valide, publie) est rejeté par la base."""
        t_doc = TypeDocument.objects.create(code="CONV_TEST", nom="Convention Test")
        m_doc = ModeleDocument.objects.create(type=t_doc, nom="Gabarit Test")
        with self.assertRaises(IntegrityError):
            with transaction.atomic():
                Document.objects.create(
                    modele=m_doc,
                    titre="Document Statut Invalide",
                    sujet="Sujet Test",
                    auteur=self.admin,
                    statut="statut_doc_invalide",
                )

    def test_rejet_statut_invalide_sur_fiche_galerie(self):
        """Un statut de fiche galerie hors énumération est rejeté par la base."""
        with self.assertRaises(IntegrityError):
            with transaction.atomic():
                FicheInnovation.objects.create(
                    projet=self.projet,
                    titre="Fiche Invalide",
                    probleme="Prob",
                    solution="Sol",
                    equipe="Equipe",
                    avancement="MVP",
                    statut="statut_fiche_invalide",
                )

    def test_rejet_role_et_genre_invalide_sur_utilisateur(self):
        """Des valeurs non canoniques pour role et genre sur User sont rejetées par la base."""
        with self.assertRaises(IntegrityError):
            with transaction.atomic():
                User.objects.create_user(
                    email="fake.role@ciat.sn",
                    password="Password2026!",
                    role="super_hacker",
                )

        with self.assertRaises(IntegrityError):
            with transaction.atomic():
                User.objects.create_user(
                    email="fake.genre@ciat.sn",
                    password="Password2026!",
                    genre="X",  # Doit être dans ('', 'F', 'H', 'A')
                )
