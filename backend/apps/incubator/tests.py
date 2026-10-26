import datetime
from unittest.mock import patch
from django.core.exceptions import ValidationError as DjangoValidationError
from django.core.files.uploadedfile import SimpleUploadedFile
from django.db import IntegrityError, connection, transaction
from django.test import TestCase, TransactionTestCase, override_settings
from django.urls import reverse
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APIClient

import io
import openpyxl
from apps.core.models import Cohorte, Domaine, Projet, Role, User
from apps.incubator.models import (
    AffectationMentor,
    CommentaireJalon,
    Critere,
    Decision,
    Dossier,
    EcheanceSuivi,
    Evaluation,
    Grille,
    Jalon,
    Objectif,
    Piece,
    PreuveJalon,
    StatutDossier,
    StatutJalon,
    StatutObjectif,
    SuiviProjet,
    TypePiece,
)

FAST_HASHERS = ["django.contrib.auth.hashers.MD5PasswordHasher"]



@override_settings(PASSWORD_HASHERS=FAST_HASHERS)
class IncubateurSecurityAndAuthorizationTests(TestCase):
    def setUp(self):

        self.client = APIClient()

        # Données de référence
        self.domaine = Domaine.objects.create(nom="TIC et Numérique")
        self.cohorte = Cohorte.objects.create(nom="Cohorte 2026", annee=2026)

        # Utilisateurs de test
        self.porteur1 = User.objects.create_user(
            email="porteur1@ciat.sn",
            password="password123",
            role=Role.PORTEUR,
            first_name="Ibrahima",
            last_name="Diallo",
        )
        self.porteur2 = User.objects.create_user(
            email="porteur2@ciat.sn",
            password="password123",
            role=Role.PORTEUR,
            first_name="Autre",
            last_name="Porteur",
        )
        self.comite1 = User.objects.create_user(
            email="comite1@ciat.sn",
            password="password123",
            role=Role.COMITE,
            first_name="Membre1",
            last_name="Comité",
        )
        self.comite2 = User.objects.create_user(
            email="comite2@ciat.sn",
            password="password123",
            role=Role.COMITE,
            first_name="Membre2",
            last_name="Comité",
        )
        self.mentor = User.objects.create_user(
            email="mentor@ciat.sn",
            password="password123",
            role=Role.MENTOR,
            first_name="Mentor",
            last_name="CIAT",
        )
        self.visiteur = User.objects.create_user(
            email="visiteur@ciat.sn",
            password="password123",
            role=Role.VISITEUR,
            first_name="Simple",
            last_name="Visiteur",
        )
        self.coordo = User.objects.create_user(
            email="coordo@ciat.sn",
            password="password123",
            role=Role.COORDONNATEUR,
            first_name="Coordo",
            last_name="CIAT",
        )

        # Projets
        self.projet1 = Projet.objects.create(
            titre="AgriSol",
            resume="Plateforme agricole",
            domaine=self.domaine,
            cohorte=self.cohorte,
            porteur=self.porteur1,
            statut=Projet.Statut.IDEE,
        )
        self.projet2 = Projet.objects.create(
            titre="HealthTech",
            resume="Télémédecine",
            domaine=self.domaine,
            cohorte=self.cohorte,
            porteur=self.porteur2,
            statut=Projet.Statut.IDEE,
        )

        # Grille par défaut
        self.grille = Grille.objects.create(nom="Grille Test CIAT", active=True)
        self.c1 = Critere.objects.create(
            grille=self.grille, libelle="Pertinence", poids=1, note_max=20, ordre=1
        )
        self.c2 = Critere.objects.create(
            grille=self.grille, libelle="Innovation", poids=2, note_max=20, ordre=2
        )

    def test_anonyme_rejete_sur_toutes_les_actions(self):
        """Un utilisateur anonyme ne peut accéder à aucun endpoint métier."""
        url_list = reverse("incubator:dossier-list-create")
        self.assertEqual(self.client.get(url_list).status_code, status.HTTP_401_UNAUTHORIZED)
        self.assertEqual(self.client.post(url_list, {"projet": self.projet1.id}).status_code, status.HTTP_401_UNAUTHORIZED)

        dossier = Dossier.objects.create(projet=self.projet1)
        url_detail = reverse("incubator:dossier-detail", kwargs={"pk": dossier.id})
        self.assertEqual(self.client.get(url_detail).status_code, status.HTTP_401_UNAUTHORIZED)
        self.assertEqual(self.client.patch(url_detail, {}).status_code, status.HTTP_401_UNAUTHORIZED)

        url_piece = reverse("incubator:dossier-piece-create", kwargs={"pk": dossier.id})
        self.assertEqual(self.client.post(url_piece, {}).status_code, status.HTTP_401_UNAUTHORIZED)

        url_soumis = reverse("incubator:dossier-soumettre", kwargs={"pk": dossier.id})
        self.assertEqual(self.client.post(url_soumis).status_code, status.HTTP_401_UNAUTHORIZED)

        url_eval = reverse("incubator:dossier-evaluations", kwargs={"pk": dossier.id})
        self.assertEqual(self.client.get(url_eval).status_code, status.HTTP_401_UNAUTHORIZED)
        self.assertEqual(self.client.post(url_eval, {}).status_code, status.HTTP_401_UNAUTHORIZED)

        url_dec = reverse("incubator:dossier-decision", kwargs={"pk": dossier.id})
        self.assertEqual(self.client.post(url_dec, {}).status_code, status.HTTP_401_UNAUTHORIZED)

    def test_creation_dossier_formats_projet_et_projet_id(self):
        """Un porteur peut créer son dossier avec {'projet': id} ou {'projet_id': id}."""
        self.client.force_authenticate(user=self.porteur1)
        url = reverse("incubator:dossier-list-create")

        res1 = self.client.post(url, {"projet": self.projet1.id}, format="json")
        self.assertEqual(res1.status_code, status.HTTP_201_CREATED)
        self.assertEqual(res1.data["projet"]["id"], self.projet1.id)
        self.assertTrue(Dossier.objects.filter(projet=self.projet1).exists())

    def test_porteur_ne_peut_pas_creer_dossier_pour_projet_tiers(self):
        """Un porteur qui tente de créer un dossier pour le projet d'un autre est rejeté avec 403."""
        self.client.force_authenticate(user=self.porteur1)
        url = reverse("incubator:dossier-list-create")

        res = self.client.post(url, {"projet": self.projet2.id}, format="json")
        self.assertEqual(res.status_code, status.HTTP_403_FORBIDDEN)
        self.assertFalse(Dossier.objects.filter(projet=self.projet2).exists())

    def test_role_non_autorise_ne_peut_pas_creer_dossier(self):
        """Un visiteur, membre du comité ou mentor ne peut pas créer de dossier."""
        url = reverse("incubator:dossier-list-create")

        for user_unauthorized in [self.visiteur, self.comite1, self.mentor]:
            self.client.force_authenticate(user=user_unauthorized)
            res = self.client.post(url, {"projet": self.projet2.id}, format="json")
            self.assertEqual(res.status_code, status.HTTP_403_FORBIDDEN)

    def test_unicite_dossier_par_projet(self):
        """La création d'un deuxième dossier pour le même projet est rejetée avec 400."""
        self.client.force_authenticate(user=self.porteur1)
        url = reverse("incubator:dossier-list-create")
        Dossier.objects.create(projet=self.projet1)

        res = self.client.post(url, {"projet": self.projet1.id}, format="json")
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)

    def test_immutabilite_du_projet_apres_creation(self):
        """Une tentative de modifier projet ou projet_id via PATCH est rejetée."""
        self.client.force_authenticate(user=self.porteur1)
        dossier = Dossier.objects.create(projet=self.projet1)
        url = reverse("incubator:dossier-detail", kwargs={"pk": dossier.id})

        res1 = self.client.patch(url, {"projet": self.projet2.id}, format="json")
        self.assertEqual(res1.status_code, status.HTTP_400_BAD_REQUEST)

        res2 = self.client.patch(url, {"projet_id": self.projet2.id}, format="json")
        self.assertEqual(res2.status_code, status.HTTP_400_BAD_REQUEST)

        dossier.refresh_from_db()
        self.assertEqual(dossier.projet_id, self.projet1.id)

    def test_isolation_dossier_tiers(self):
        """Un porteur ne peut ni voir ni modifier le dossier d'un autre porteur."""
        dossier2 = Dossier.objects.create(projet=self.projet2)
        url = reverse("incubator:dossier-detail", kwargs={"pk": dossier2.id})

        self.client.force_authenticate(user=self.porteur1)
        res_get = self.client.get(url)
        self.assertEqual(res_get.status_code, status.HTTP_403_FORBIDDEN)

        res_patch = self.client.patch(url, {}, format="json")
        self.assertEqual(res_patch.status_code, status.HTTP_403_FORBIDDEN)

    def test_seul_proprietaire_peut_gerer_pieces_et_soumettre(self):
        """Un tiers ne peut ni déposer, ni supprimer une pièce, ni soumettre le dossier."""
        dossier = Dossier.objects.create(projet=self.projet1)
        f = SimpleUploadedFile("fiche.pdf", b"test content", content_type="application/pdf")
        piece = Piece.objects.create(dossier=dossier, type="fiche_projet", fichier=f)

        url_piece_create = reverse("incubator:dossier-piece-create", kwargs={"pk": dossier.id})
        url_piece_delete = reverse("incubator:dossier-piece-delete", kwargs={"pk": dossier.id, "piece_id": piece.id})
        url_soumettre = reverse("incubator:dossier-soumettre", kwargs={"pk": dossier.id})

        self.client.force_authenticate(user=self.porteur2)
        f_hack = SimpleUploadedFile("hack.pdf", b"hack", content_type="application/pdf")
        self.assertEqual(
            self.client.post(url_piece_create, {"type": "autre", "fichier": f_hack}, format="multipart").status_code,
            status.HTTP_403_FORBIDDEN,
        )
        self.assertEqual(self.client.delete(url_piece_delete).status_code, status.HTTP_403_FORBIDDEN)
        self.assertEqual(self.client.post(url_soumettre).status_code, status.HTTP_403_FORBIDDEN)

    def test_interdiction_modification_et_suppression_apres_soumission(self):
        """Une fois soumis, un dossier et ses pièces ne peuvent plus être modifiés par le porteur."""
        dossier = Dossier.objects.create(projet=self.projet1, statut=StatutDossier.SOUMIS)
        f = SimpleUploadedFile("fiche.pdf", b"test content", content_type="application/pdf")
        piece = Piece.objects.create(dossier=dossier, type="fiche_projet", fichier=f)

        self.client.force_authenticate(user=self.porteur1)
        url_detail = reverse("incubator:dossier-detail", kwargs={"pk": dossier.id})
        url_piece_create = reverse("incubator:dossier-piece-create", kwargs={"pk": dossier.id})
        url_piece_delete = reverse("incubator:dossier-piece-delete", kwargs={"pk": dossier.id, "piece_id": piece.id})

        self.assertEqual(self.client.patch(url_detail, {}, format="json").status_code, status.HTTP_400_BAD_REQUEST)
        f2 = SimpleUploadedFile("extra.pdf", b"extra", content_type="application/pdf")
        self.assertEqual(
            self.client.post(url_piece_create, {"type": "autre", "fichier": f2}, format="multipart").status_code,
            status.HTTP_400_BAD_REQUEST,
        )
        self.assertEqual(self.client.delete(url_piece_delete).status_code, status.HTTP_400_BAD_REQUEST)

    def test_porteur_ne_peut_pas_voir_evaluations_comite(self):
        """Un porteur de projet ne peut pas consulter les évaluations du jury."""
        dossier = Dossier.objects.create(projet=self.projet1, statut=StatutDossier.SOUMIS)
        url_eval = reverse("incubator:dossier-evaluations", kwargs={"pk": dossier.id})

        self.client.force_authenticate(user=self.porteur1)
        res = self.client.get(url_eval)
        self.assertEqual(res.status_code, status.HTTP_403_FORBIDDEN)

    def test_porteur_et_mentor_ne_peuvent_pas_evaluer(self):
        """Seuls les membres du comité ou l'équipe CIAT peuvent poster une évaluation."""
        dossier = Dossier.objects.create(projet=self.projet1, statut=StatutDossier.SOUMIS)
        url_eval = reverse("incubator:dossier-evaluations", kwargs={"pk": dossier.id})
        data = {
            "notes": [
                {"critere": self.c1.id, "note": 15.0},
                {"critere": self.c2.id, "note": 15.0},
            ],
            "avis": "Tentative",
        }

        self.client.force_authenticate(user=self.porteur1)
        self.assertEqual(self.client.post(url_eval, data, format="json").status_code, status.HTTP_403_FORBIDDEN)

        self.client.force_authenticate(user=self.mentor)
        self.assertEqual(self.client.post(url_eval, data, format="json").status_code, status.HTTP_403_FORBIDDEN)

    def test_seuls_admin_et_coordonnateur_peuvent_decider(self):
        """Seuls l'administrateur et le coordonnateur peuvent prendre une décision finale."""
        dossier = Dossier.objects.create(projet=self.projet1, statut=StatutDossier.EN_EVALUATION)
        url_dec = reverse("incubator:dossier-decision", kwargs={"pk": dossier.id})
        data = {"decision": "accepte", "motif": "Projet pertinent."}

        self.client.force_authenticate(user=self.porteur1)
        self.assertEqual(self.client.post(url_dec, data, format="json").status_code, status.HTTP_403_FORBIDDEN)

        self.client.force_authenticate(user=self.comite1)
        self.assertEqual(self.client.post(url_dec, data, format="json").status_code, status.HTTP_403_FORBIDDEN)

        self.client.force_authenticate(user=self.coordo)
        res_ok = self.client.post(url_dec, data, format="json")
        self.assertEqual(res_ok.status_code, status.HTTP_201_CREATED)


class IncubateurBusinessRulesAndLifecycleTests(TestCase):
    def setUp(self):
        self.client = APIClient()

        self.domaine = Domaine.objects.create(nom="TIC et Numérique")
        self.cohorte = Cohorte.objects.create(nom="Cohorte 2026", annee=2026)

        self.porteur1 = User.objects.create_user(
            email="porteur_b@ciat.sn",
            password="password123",
            role=Role.PORTEUR,
        )
        self.comite1 = User.objects.create_user(
            email="comite_b1@ciat.sn",
            password="password123",
            role=Role.COMITE,
        )
        self.comite2 = User.objects.create_user(
            email="comite_b2@ciat.sn",
            password="password123",
            role=Role.COMITE,
        )
        self.coordo = User.objects.create_user(
            email="coordo_b@ciat.sn",
            password="password123",
            role=Role.COORDONNATEUR,
        )

        self.projet1 = Projet.objects.create(
            titre="AgriSol",
            domaine=self.domaine,
            cohorte=self.cohorte,
            porteur=self.porteur1,
            statut=Projet.Statut.IDEE,
        )

        self.grille = Grille.objects.create(nom="Grille Principale CIAT", active=True)
        self.c1 = Critere.objects.create(
            grille=self.grille, libelle="Pertinence", poids=1, note_max=20, ordre=1
        )
        self.c2 = Critere.objects.create(
            grille=self.grille, libelle="Innovation", poids=2, note_max=20, ordre=2
        )

    def test_cycle_de_vie_nominal_complet(self):
        """Parcours complet : création -> pièces -> soumission -> évaluation -> décision."""
        self.client.force_authenticate(user=self.porteur1)

        url_create = reverse("incubator:dossier-list-create")
        res_create = self.client.post(url_create, {"projet": self.projet1.id}, format="json")
        self.assertEqual(res_create.status_code, status.HTTP_201_CREATED)
        dossier_id = res_create.data["id"]

        url_piece = reverse("incubator:dossier-piece-create", kwargs={"pk": dossier_id})
        for t in ["fiche_projet", "presentation_equipe", "budget_previsionnel"]:
            f = SimpleUploadedFile(f"{t}.pdf", b"%PDF-1.4\nvalid pdf content", content_type="application/pdf")
            res_p = self.client.post(url_piece, {"type": t, "fichier": f}, format="multipart")
            self.assertEqual(res_p.status_code, status.HTTP_201_CREATED)

        url_soumettre = reverse("incubator:dossier-soumettre", kwargs={"pk": dossier_id})
        res_soumis = self.client.post(url_soumettre)
        self.assertEqual(res_soumis.status_code, status.HTTP_200_OK)
        self.assertEqual(res_soumis.data["statut"], "soumis")

        self.client.force_authenticate(user=self.comite1)
        url_eval = reverse("incubator:dossier-evaluations", kwargs={"pk": dossier_id})
        eval_data = {
            "notes": [
                {"critere": self.c1.id, "note": 16.0},
                {"critere": self.c2.id, "note": 18.0},
            ],
            "avis": "Très bon projet.",
        }
        res_eval = self.client.post(url_eval, eval_data, format="json")
        self.assertEqual(res_eval.status_code, status.HTTP_201_CREATED)

        dossier = Dossier.objects.get(pk=dossier_id)
        self.assertEqual(dossier.statut, StatutDossier.EN_EVALUATION)

        self.client.force_authenticate(user=self.coordo)
        url_dec = reverse("incubator:dossier-decision", kwargs={"pk": dossier_id})
        res_dec = self.client.post(
            url_dec,
            {"decision": "accepte", "motif": "Dossier solide validé par le jury."},
            format="json",
        )
        self.assertEqual(res_dec.status_code, status.HTTP_201_CREATED)

        dossier.refresh_from_db()
        self.projet1.refresh_from_db()
        self.assertEqual(dossier.statut, StatutDossier.ACCEPTE)
        self.assertEqual(self.projet1.statut, Projet.Statut.SELECTIONNE)

    def test_evaluation_dossier_en_brouillon_rejete(self):
        """Un dossier en brouillon ne peut pas être évalué."""
        dossier = Dossier.objects.create(projet=self.projet1, statut=StatutDossier.BROUILLON)
        self.client.force_authenticate(user=self.comite1)
        url_eval = reverse("incubator:dossier-evaluations", kwargs={"pk": dossier.id})

        eval_data = {
            "notes": [
                {"critere": self.c1.id, "note": 14.0},
                {"critere": self.c2.id, "note": 15.0},
            ]
        }
        res = self.client.post(url_eval, eval_data, format="json")
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("brouillon", str(res.data))

    def test_evaluation_dossier_apres_decision_rejete(self):
        """Un dossier déjà accepté ou refusé ne peut plus recevoir d'évaluation."""
        dossier = Dossier.objects.create(projet=self.projet1, statut=StatutDossier.ACCEPTE)
        self.client.force_authenticate(user=self.comite1)
        url_eval = reverse("incubator:dossier-evaluations", kwargs={"pk": dossier.id})

        eval_data = {
            "notes": [
                {"critere": self.c1.id, "note": 14.0},
                {"critere": self.c2.id, "note": 15.0},
            ]
        }
        res = self.client.post(url_eval, eval_data, format="json")
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)

    def test_critere_autre_grille_rejete(self):
        """Noter un critère appartenant à une autre grille est rejeté."""
        dossier = Dossier.objects.create(projet=self.projet1, statut=StatutDossier.SOUMIS)
        autre_grille = Grille.objects.create(nom="Autre Grille", active=False)
        critere_etranger = Critere.objects.create(
            grille=autre_grille, libelle="Critère Étranger", poids=1, note_max=20
        )

        self.client.force_authenticate(user=self.comite1)
        url_eval = reverse("incubator:dossier-evaluations", kwargs={"pk": dossier.id})
        eval_data = {
            "notes": [
                {"critere": self.c1.id, "note": 15.0},
                {"critere": critere_etranger.id, "note": 15.0},
            ]
        }
        res = self.client.post(url_eval, eval_data, format="json")
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)

    def test_criteres_manquants_dans_evaluation_rejete(self):
        """L'évaluation doit noter TOUS les critères de la grille active."""
        dossier = Dossier.objects.create(projet=self.projet1, statut=StatutDossier.SOUMIS)
        self.client.force_authenticate(user=self.comite1)
        url_eval = reverse("incubator:dossier-evaluations", kwargs={"pk": dossier.id})

        eval_data = {
            "notes": [
                {"critere": self.c1.id, "note": 15.0},
            ]
        }
        res = self.client.post(url_eval, eval_data, format="json")
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("manquants", str(res.data["notes"]))

    def test_note_hors_limites_rejete(self):
        """Une note dépassant note_max ou inférieure à 0 est rejetée."""
        dossier = Dossier.objects.create(projet=self.projet1, statut=StatutDossier.SOUMIS)
        self.client.force_authenticate(user=self.comite1)
        url_eval = reverse("incubator:dossier-evaluations", kwargs={"pk": dossier.id})

        eval_data = {
            "notes": [
                {"critere": self.c1.id, "note": 25.0},
                {"critere": self.c2.id, "note": 15.0},
            ]
        }
        res = self.client.post(url_eval, eval_data, format="json")
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)

    def test_double_evaluation_rejete(self):
        """Un membre du comité ne peut évaluer un dossier qu'une seule fois."""
        dossier = Dossier.objects.create(projet=self.projet1, statut=StatutDossier.SOUMIS)
        self.client.force_authenticate(user=self.comite1)
        url_eval = reverse("incubator:dossier-evaluations", kwargs={"pk": dossier.id})

        eval_data = {
            "notes": [
                {"critere": self.c1.id, "note": 15.0},
                {"critere": self.c2.id, "note": 15.0},
            ]
        }
        res1 = self.client.post(url_eval, eval_data, format="json")
        self.assertEqual(res1.status_code, status.HTTP_201_CREATED)

        res2 = self.client.post(url_eval, eval_data, format="json")
        self.assertEqual(res2.status_code, status.HTTP_400_BAD_REQUEST)

    def test_unicite_grille_active(self):
        """Activer une nouvelle grille désactive automatiquement la précédente."""
        self.assertTrue(self.grille.active)

        nouvelle_grille = Grille.objects.create(nom="Nouvelle Grille 2027", active=True)
        self.grille.refresh_from_db()
        self.assertFalse(self.grille.active)
        self.assertTrue(nouvelle_grille.active)
        self.assertEqual(Grille.objects.filter(active=True).count(), 1)

    def test_decision_sur_dossier_en_brouillon_rejete(self):
        """Une décision ne peut pas être prise sur un dossier en brouillon."""
        dossier = Dossier.objects.create(projet=self.projet1, statut=StatutDossier.BROUILLON)
        self.client.force_authenticate(user=self.coordo)
        url_dec = reverse("incubator:dossier-decision", kwargs={"pk": dossier.id})

        res = self.client.post(url_dec, {"decision": "accepte", "motif": "Validation"}, format="json")
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)

    def test_double_decision_rejete(self):
        """Un dossier ne peut pas recevoir deux décisions."""
        dossier = Dossier.objects.create(projet=self.projet1, statut=StatutDossier.EN_EVALUATION)
        self.client.force_authenticate(user=self.coordo)
        url_dec = reverse("incubator:dossier-decision", kwargs={"pk": dossier.id})

        res1 = self.client.post(url_dec, {"decision": "accepte", "motif": "Premier avis."}, format="json")
        self.assertEqual(res1.status_code, status.HTTP_201_CREATED)

        res2 = self.client.post(url_dec, {"decision": "refuse", "motif": "Deuxième avis."}, format="json")
        self.assertEqual(res2.status_code, status.HTTP_400_BAD_REQUEST)


@override_settings(PASSWORD_HASHERS=FAST_HASHERS)
class IncubateurConcurrencyTests(TransactionTestCase):
    """Tests de concurrence réelle avec transactions atomiques."""

    def setUp(self):
        self.domaine = Domaine.objects.create(nom="TIC et Numérique")
        self.cohorte = Cohorte.objects.create(nom="Cohorte 2026", annee=2026)
        self.porteur = User.objects.create_user(
            email="porteur_concurrent@ciat.sn",
            password="password123",
            role=Role.PORTEUR,
        )
        self.projet = Projet.objects.create(
            titre="ConcurrentProject",
            domaine=self.domaine,
            cohorte=self.cohorte,
            porteur=self.porteur,
        )
        self.dossier = Dossier.objects.create(projet=self.projet, statut=StatutDossier.BROUILLON)
        for t in ["fiche_projet", "presentation_equipe", "budget_previsionnel"]:
            f = SimpleUploadedFile(f"{t}.pdf", b"content", content_type="application/pdf")
            Piece.objects.create(dossier=self.dossier, type=t, fichier=f)

    def test_deux_soumissions_concurrentes(self):
        """Vérifie le comportement de deux soumissions successives ou concurrentes sous verrou."""
        url = reverse("incubator:dossier-soumettre", kwargs={"pk": self.dossier.id})

        # Appel 1
        client1 = APIClient()
        client1.force_authenticate(user=self.porteur)
        res1 = client1.post(url)
        self.assertEqual(res1.status_code, status.HTTP_200_OK)

        # Appel 2 (tentative immédiate de double soumission sur le même dossier)
        client2 = APIClient()
        client2.force_authenticate(user=self.porteur)
        res2 = client2.post(url)
        self.assertEqual(res2.status_code, status.HTTP_400_BAD_REQUEST)

        self.dossier.refresh_from_db()
        self.assertEqual(self.dossier.statut, StatutDossier.SOUMIS)


@override_settings(PASSWORD_HASHERS=FAST_HASHERS)
class IncubateurFileSecurityTests(TestCase):
    """Tests de sécurité sur les fichiers téléversés : magic bytes, formats, sanitisation."""

    def setUp(self):
        self.client = APIClient()
        self.domaine = Domaine.objects.create(nom="TIC et Numérique")
        self.cohorte = Cohorte.objects.create(nom="Cohorte 2026", annee=2026)
        self.porteur = User.objects.create_user(
            email="porteur_files@ciat.sn",
            password="password123",
            role=Role.PORTEUR,
        )
        self.projet = Projet.objects.create(
            titre="FileSecurityProject",
            domaine=self.domaine,
            cohorte=self.cohorte,
            porteur=self.porteur,
        )
        self.dossier = Dossier.objects.create(projet=self.projet, statut=StatutDossier.BROUILLON)
        self.url_piece = reverse("incubator:dossier-piece-create", kwargs={"pk": self.dossier.id})
        self.client.force_authenticate(user=self.porteur)

    def test_upload_fichier_valide_pdf(self):
        """Un fichier PDF avec une signature binaire valide (%PDF-) est accepté."""
        valid_pdf = SimpleUploadedFile(
            "document.pdf",
            b"%PDF-1.4\n%Fake valid pdf content...",
            content_type="application/pdf",
        )
        res = self.client.post(self.url_piece, {"type": "fiche_projet", "fichier": valid_pdf}, format="multipart")
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)

    def test_upload_fichier_vide_rejete(self):
        """Un fichier de 0 octet est rejeté."""
        empty_file = SimpleUploadedFile("empty.pdf", b"", content_type="application/pdf")
        res = self.client.post(self.url_piece, {"type": "fiche_projet", "fichier": empty_file}, format="multipart")
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("vide", str(res.data))

    def test_upload_fichier_spoofe_rejete(self):
        """Un script malveillant maquillé avec l'extension .pdf est rejeté pour signature invalide."""
        fake_pdf = SimpleUploadedFile(
            "exploit.pdf",
            b"#!/bin/bash\necho 'malicious script'",
            content_type="application/pdf",
        )
        res = self.client.post(self.url_piece, {"type": "fiche_projet", "fichier": fake_pdf}, format="multipart")
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("signature invalide", str(res.data))

    def test_sanitisation_nom_fichier_anti_traversal(self):
        """Les tentatives de path traversal (../../) dans le nom de fichier sont assainies."""
        traversal_file = SimpleUploadedFile(
            "../../secret_passwd.pdf",
            b"%PDF-1.4\nSafe content",
            content_type="application/pdf",
        )
        res = self.client.post(self.url_piece, {"type": "fiche_projet", "fichier": traversal_file}, format="multipart")
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        # Vérifie que le chemin généré ne contient pas '..'
        piece = Piece.objects.get(pk=res.data["id"])
        self.assertNotIn("..", piece.fichier.name)


@override_settings(PASSWORD_HASHERS=FAST_HASHERS)
class IncubateurPhase2MentorsObjectifsTests(TestCase):
    """Tests Phase 2 T1 : Affectation de mentors et gestion des objectifs d'accompagnement."""

    def setUp(self):
        self.client = APIClient()
        self.domaine = Domaine.objects.create(nom="AgriTech")
        self.cohorte = Cohorte.objects.create(nom="Cohorte 2026", annee=2026)

        # Users
        self.admin = User.objects.create_user(
            email="admin_p2@ciat.sn",
            password="password123",
            role=Role.ADMIN,
            first_name="Admin",
            last_name="CIAT",
        )
        self.coordo = User.objects.create_user(
            email="coordo_p2@ciat.sn",
            password="password123",
            role=Role.COORDONNATEUR,
            first_name="Coordo",
            last_name="CIAT",
        )
        self.porteur = User.objects.create_user(
            email="porteur_p2@ciat.sn",
            password="password123",
            role=Role.PORTEUR,
            first_name="Porteur",
            last_name="Principal",
        )
        self.mentor1 = User.objects.create_user(
            email="mentor1@ciat.sn",
            password="password123",
            role=Role.MENTOR,
            first_name="Amadou",
            last_name="Ba",
        )
        self.mentor2 = User.objects.create_user(
            email="mentor2@ciat.sn",
            password="password123",
            role=Role.MENTOR,
            first_name="Fatou",
            last_name="Sow",
        )

        # Projects
        self.projet1 = Projet.objects.create(
            titre="Projet P1",
            domaine=self.domaine,
            cohorte=self.cohorte,
            porteur=self.porteur,
            statut=Projet.Statut.SELECTIONNE,
        )
        self.projet2 = Projet.objects.create(
            titre="Projet P2",
            domaine=self.domaine,
            cohorte=self.cohorte,
            porteur=self.porteur,
            statut=Projet.Statut.SELECTIONNE,
        )

    def test_liste_mentors_accessible_uniquement_par_equipe(self):
        """Seuls admin et coordonnateur peuvent lister les mentors."""
        url = reverse("incubator:mentor-list")

        # Non authentifié -> 401
        res_anon = self.client.get(url)
        self.assertEqual(res_anon.status_code, status.HTTP_401_UNAUTHORIZED)

        # Porteur -> 403
        self.client.force_authenticate(user=self.porteur)
        res_porteur = self.client.get(url)
        self.assertEqual(res_porteur.status_code, status.HTTP_403_FORBIDDEN)

        # Mentor -> 403
        self.client.force_authenticate(user=self.mentor1)
        res_mentor = self.client.get(url)
        self.assertEqual(res_mentor.status_code, status.HTTP_403_FORBIDDEN)

        # Coordonnateur -> 200
        self.client.force_authenticate(user=self.coordo)
        res_coordo = self.client.get(url)
        self.assertEqual(res_coordo.status_code, status.HTTP_200_OK)
        items = res_coordo.data.get("results", res_coordo.data)
        emails = [m["email"] for m in items]
        self.assertIn(self.mentor1.email, emails)
        self.assertIn(self.mentor2.email, emails)

    def test_affectation_mentor_par_coordo_et_rejet_non_mentor(self):
        """Le coordonnateur peut affecter un mentor, mais rejette un utilisateur non mentor."""
        url = reverse("incubator:projet-mentor", kwargs={"pk": self.projet1.id})

        self.client.force_authenticate(user=self.coordo)

        # 1. Tentative d'affecter un porteur comme mentor -> 400
        res_invalid = self.client.post(url, {"mentor": self.porteur.id}, format="json")
        self.assertEqual(res_invalid.status_code, status.HTTP_400_BAD_REQUEST)

        # 2. Affectation valide avec mentor1
        res_valid = self.client.post(url, {"mentor": self.mentor1.id}, format="json")
        self.assertEqual(res_valid.status_code, status.HTTP_200_OK)
        self.assertEqual(res_valid.data["mentor"], self.mentor1.id)

        affectation = AffectationMentor.objects.get(projet=self.projet1)
        self.assertEqual(affectation.mentor, self.mentor1)
        self.assertEqual(affectation.affecte_par, self.coordo)

        # 3. Modification / réaffectation par l'admin vers mentor2
        self.client.force_authenticate(user=self.admin)
        res_reassign = self.client.post(url, {"mentor": self.mentor2.id}, format="json")
        self.assertEqual(res_reassign.status_code, status.HTTP_200_OK)
        affectation.refresh_from_db()
        self.assertEqual(affectation.mentor, self.mentor2)
        self.assertEqual(affectation.affecte_par, self.admin)

    def test_affectation_mentor_interdite_aux_non_autorises(self):
        """Porteur ou mentor ne peuvent pas affecter de mentor."""
        url = reverse("incubator:projet-mentor", kwargs={"pk": self.projet1.id})

        self.client.force_authenticate(user=self.porteur)
        self.assertEqual(
            self.client.post(url, {"mentor": self.mentor1.id}, format="json").status_code,
            status.HTTP_403_FORBIDDEN,
        )

        self.client.force_authenticate(user=self.mentor1)
        self.assertEqual(
            self.client.post(url, {"mentor": self.mentor1.id}, format="json").status_code,
            status.HTTP_403_FORBIDDEN,
        )

    def test_mentor_visibilite_projets_assignes_uniquement(self):
        """Un mentor accédant à /api/projets/ ne voit que les projets qui lui sont affectés."""
        # Affecte projet1 à mentor1, projet2 à mentor2
        AffectationMentor.objects.create(projet=self.projet1, mentor=self.mentor1, affecte_par=self.admin)
        AffectationMentor.objects.create(projet=self.projet2, mentor=self.mentor2, affecte_par=self.admin)

        url = "/api/projets/"
        self.client.force_authenticate(user=self.mentor1)
        res = self.client.get(url)
        self.assertEqual(res.status_code, status.HTTP_200_OK)

        projets = res.data.get("results", res.data)
        ids = [p["id"] for p in projets]
        self.assertIn(self.projet1.id, ids)
        self.assertNotIn(self.projet2.id, ids)

    def test_objectifs_porteur_lecture_seule_et_interdiction_ecriture(self):
        """Le porteur peut voir les objectifs mais ne peut ni en créer ni en modifier."""
        AffectationMentor.objects.create(projet=self.projet1, mentor=self.mentor1, affecte_par=self.admin)
        obj = Objectif.objects.create(
            projet=self.projet1,
            libelle="Finaliser le MVP",
            cree_par=self.mentor1,
        )

        url_list = reverse("incubator:projet-objectifs", kwargs={"pk": self.projet1.id})
        url_detail = reverse("incubator:objectif-detail", kwargs={"pk": obj.id})

        self.client.force_authenticate(user=self.porteur)

        # GET -> 200
        res_get = self.client.get(url_list)
        self.assertEqual(res_get.status_code, status.HTTP_200_OK)
        self.assertEqual(len(res_get.data), 1)
        self.assertEqual(res_get.data[0]["libelle"], "Finaliser le MVP")

        # POST -> 403
        res_post = self.client.post(url_list, {"libelle": "Objectif pirate"}, format="json")
        self.assertEqual(res_post.status_code, status.HTTP_403_FORBIDDEN)

        # PATCH -> 403
        res_patch = self.client.patch(url_detail, {"statut": StatutObjectif.ATTEINT}, format="json")
        self.assertEqual(res_patch.status_code, status.HTTP_403_FORBIDDEN)

    def test_objectifs_mentor_affecte_creation_et_modification(self):
        """Le mentor affecté peut créer et modifier les objectifs de son projet."""
        AffectationMentor.objects.create(projet=self.projet1, mentor=self.mentor1, affecte_par=self.admin)

        url_list = reverse("incubator:projet-objectifs", kwargs={"pk": self.projet1.id})

        # Mentor 1 crée un objectif
        self.client.force_authenticate(user=self.mentor1)
        res_post = self.client.post(
            url_list,
            {"libelle": "Définir la roadmap technique", "echeance": "2026-12-31"},
            format="json",
        )
        self.assertEqual(res_post.status_code, status.HTTP_201_CREATED)
        obj_id = res_post.data["id"]

        # Mentor 1 modifie l'objectif
        url_detail = reverse("incubator:objectif-detail", kwargs={"pk": obj_id})
        res_patch = self.client.patch(
            url_detail,
            {"statut": StatutObjectif.EN_COURS},
            format="json",
        )
        self.assertEqual(res_patch.status_code, status.HTTP_200_OK)
        self.assertEqual(res_patch.data["statut"], StatutObjectif.EN_COURS)

    def test_objectifs_mentor_non_affecte_refuse(self):
        """Un mentor non affecté au projet ne peut ni lire, ni créer, ni modifier ses objectifs."""
        AffectationMentor.objects.create(projet=self.projet1, mentor=self.mentor1, affecte_par=self.admin)
        obj = Objectif.objects.create(
            projet=self.projet1,
            libelle="Objectif confidentiel",
            cree_par=self.mentor1,
        )

        url_list = reverse("incubator:projet-objectifs", kwargs={"pk": self.projet1.id})
        url_detail = reverse("incubator:objectif-detail", kwargs={"pk": obj.id})

        self.client.force_authenticate(user=self.mentor2)

        # GET -> 403
        self.assertEqual(self.client.get(url_list).status_code, status.HTTP_403_FORBIDDEN)

        # POST -> 403
        self.assertEqual(
            self.client.post(url_list, {"libelle": "Objectif illégitime"}, format="json").status_code,
            status.HTTP_403_FORBIDDEN,
        )

        # PATCH -> 403
        self.assertEqual(
            self.client.patch(url_detail, {"statut": StatutObjectif.ATTEINT}, format="json").status_code,
            status.HTTP_403_FORBIDDEN,
        )


@override_settings(PASSWORD_HASHERS=FAST_HASHERS)
class IncubateurPhase2JalonsTests(TestCase):
    """Tests Phase 2 T2 : Jalons, preuves, commentaires et alertes de retard."""

    def setUp(self):
        self.client = APIClient()
        self.domaine = Domaine.objects.create(nom="GreenTech")
        self.cohorte = Cohorte.objects.create(nom="Cohorte 2026", annee=2026)

        # Utilisateurs
        self.admin = User.objects.create_user(
            email="admin_j@ciat.sn", password="password123", role=Role.ADMIN
        )
        self.coordo = User.objects.create_user(
            email="coordo_j@ciat.sn", password="password123", role=Role.COORDONNATEUR
        )
        self.porteur1 = User.objects.create_user(
            email="porteur1_j@ciat.sn", password="password123", role=Role.PORTEUR
        )
        self.porteur2 = User.objects.create_user(
            email="porteur2_j@ciat.sn", password="password123", role=Role.PORTEUR
        )
        self.mentor1 = User.objects.create_user(
            email="mentor1_j@ciat.sn", password="password123", role=Role.MENTOR
        )
        self.mentor2 = User.objects.create_user(
            email="mentor2_j@ciat.sn", password="password123", role=Role.MENTOR
        )

        # Projets
        self.projet1 = Projet.objects.create(
            titre="Projet Jalons 1",
            domaine=self.domaine,
            cohorte=self.cohorte,
            porteur=self.porteur1,
            statut=Projet.Statut.SELECTIONNE,
        )
        self.projet2 = Projet.objects.create(
            titre="Projet Jalons 2",
            domaine=self.domaine,
            cohorte=self.cohorte,
            porteur=self.porteur2,
            statut=Projet.Statut.SELECTIONNE,
        )

        # Affectations
        AffectationMentor.objects.create(projet=self.projet1, mentor=self.mentor1, affecte_par=self.coordo)
        AffectationMentor.objects.create(projet=self.projet2, mentor=self.mentor2, affecte_par=self.coordo)

    def test_creation_jalon_par_mentor_affecte_et_rejet_porteur(self):
        """Le mentor affecté ou l'équipe peut créer un jalon, mais pas le porteur ni un tiers."""
        url = reverse("incubator:projet-jalons", kwargs={"pk": self.projet1.id})

        # 1. Porteur tente de créer -> 403
        self.client.force_authenticate(user=self.porteur1)
        res_porteur = self.client.post(
            url,
            {"titre": "Conception architecture", "echeance": "2026-11-15", "statut": StatutJalon.A_FAIRE},
            format="json",
        )
        self.assertEqual(res_porteur.status_code, status.HTTP_403_FORBIDDEN)

        # 2. Mentor non affecté (mentor2) tente de créer -> 403
        self.client.force_authenticate(user=self.mentor2)
        res_m2 = self.client.post(
            url,
            {"titre": "Audit tiers", "echeance": "2026-11-15"},
            format="json",
        )
        self.assertEqual(res_m2.status_code, status.HTTP_403_FORBIDDEN)

        # 3. Mentor affecté (mentor1) crée -> 201
        self.client.force_authenticate(user=self.mentor1)
        res_m1 = self.client.post(
            url,
            {"titre": "Conception architecture", "echeance": "2026-11-15", "statut": StatutJalon.A_FAIRE},
            format="json",
        )
        self.assertEqual(res_m1.status_code, status.HTTP_201_CREATED)
        self.assertEqual(res_m1.data["titre"], "Conception architecture")
        self.assertEqual(res_m1.data["statut"], StatutJalon.A_FAIRE)

    def test_porteur_lecture_seule_jalons(self):
        """Le porteur peut consulter les jalons mais ne peut pas les modifier."""
        jalon = Jalon.objects.create(
            projet=self.projet1,
            titre="Prototype v1",
            echeance=datetime.date(2026, 12, 1),
            cree_par=self.mentor1,
        )
        url_list = reverse("incubator:projet-jalons", kwargs={"pk": self.projet1.id})
        url_detail = reverse("incubator:jalon-detail", kwargs={"pk": jalon.id})

        self.client.force_authenticate(user=self.porteur1)
        res_get = self.client.get(url_list)
        self.assertEqual(res_get.status_code, status.HTTP_200_OK)
        self.assertEqual(len(res_get.data), 1)
        self.assertEqual(res_get.data[0]["titre"], "Prototype v1")

        # Porteur tente de modifier -> 403
        res_patch = self.client.patch(url_detail, {"statut": StatutJalon.FAIT}, format="json")
        self.assertEqual(res_patch.status_code, status.HTTP_403_FORBIDDEN)

    def test_modification_jalon_par_mentor_affecte(self):
        """Le mentor affecté peut mettre à jour statut et échéance du jalon."""
        jalon = Jalon.objects.create(
            projet=self.projet1,
            titre="Prototype v1",
            echeance=datetime.date(2026, 12, 1),
            cree_par=self.mentor1,
        )
        url_detail = reverse("incubator:jalon-detail", kwargs={"pk": jalon.id})

        self.client.force_authenticate(user=self.mentor1)
        res_patch = self.client.patch(
            url_detail,
            {"statut": StatutJalon.FAIT, "titre": "Prototype v1 finalisé"},
            format="json",
        )
        self.assertEqual(res_patch.status_code, status.HTTP_200_OK)
        jalon.refresh_from_db()
        self.assertEqual(jalon.statut, StatutJalon.FAIT)
        self.assertEqual(jalon.titre, "Prototype v1 finalisé")

    def test_depot_preuve_par_porteur_et_mentor(self):
        """Le porteur et le mentor affecté peuvent déposer des preuves de réalisation."""
        jalon = Jalon.objects.create(
            projet=self.projet1,
            titre="Test unitaire",
            echeance=datetime.date(2026, 12, 1),
            cree_par=self.mentor1,
        )
        url_preuve = reverse("incubator:jalon-preuves", kwargs={"pk": jalon.id})

        # Porteur dépose un PDF valide
        self.client.force_authenticate(user=self.porteur1)
        valid_pdf = SimpleUploadedFile("rapport.pdf", b"%PDF-1.4\nContenu valide", content_type="application/pdf")
        res_porteur = self.client.post(url_preuve, {"fichier": valid_pdf}, format="multipart")
        self.assertEqual(res_porteur.status_code, status.HTTP_201_CREATED)

        # Mentor affecté dépose une image PNG valide
        self.client.force_authenticate(user=self.mentor1)
        valid_png = SimpleUploadedFile("capture.png", b"\x89PNG\r\n\x1a\nValid PNG content", content_type="image/png")
        res_mentor = self.client.post(url_preuve, {"fichier": valid_png}, format="multipart")
        self.assertEqual(res_mentor.status_code, status.HTTP_201_CREATED)

        self.assertEqual(PreuveJalon.objects.filter(jalon=jalon).count(), 2)

    def test_depot_preuve_fichiers_invalides(self):
        """Rejet de fichier vide, spoofé ou avec extension interdite."""
        jalon = Jalon.objects.create(
            projet=self.projet1,
            titre="Jalon Fichiers",
            echeance=datetime.date(2026, 12, 1),
            cree_par=self.mentor1,
        )
        url_preuve = reverse("incubator:jalon-preuves", kwargs={"pk": jalon.id})
        self.client.force_authenticate(user=self.porteur1)

        # Fichier vide -> 400
        empty_f = SimpleUploadedFile("vide.pdf", b"", content_type="application/pdf")
        res_empty = self.client.post(url_preuve, {"fichier": empty_f}, format="multipart")
        self.assertEqual(res_empty.status_code, status.HTTP_400_BAD_REQUEST)

        # Fichier spoofé -> 400
        spoof_f = SimpleUploadedFile("bad.pdf", b"#!/bin/sh\nmalware", content_type="application/pdf")
        res_spoof = self.client.post(url_preuve, {"fichier": spoof_f}, format="multipart")
        self.assertEqual(res_spoof.status_code, status.HTTP_400_BAD_REQUEST)

        # Extension non autorisée (.exe) -> 400
        exe_f = SimpleUploadedFile("malware.exe", b"binary", content_type="application/octet-stream")
        res_exe = self.client.post(url_preuve, {"fichier": exe_f}, format="multipart")
        self.assertEqual(res_exe.status_code, status.HTTP_400_BAD_REQUEST)

    def test_depot_preuve_mentor_non_affecte_refuse(self):
        """Un mentor non affecté au projet ne peut pas déposer de preuve."""
        jalon = Jalon.objects.create(
            projet=self.projet1,
            titre="Jalon privé",
            echeance=datetime.date(2026, 12, 1),
            cree_par=self.mentor1,
        )
        url_preuve = reverse("incubator:jalon-preuves", kwargs={"pk": jalon.id})
        self.client.force_authenticate(user=self.mentor2)

        pdf = SimpleUploadedFile("doc.pdf", b"%PDF-1.4\nContenu", content_type="application/pdf")
        res = self.client.post(url_preuve, {"fichier": pdf}, format="multipart")
        self.assertEqual(res.status_code, status.HTTP_403_FORBIDDEN)

    def test_commentaires_jalon_porteur_et_mentor(self):
        """Porteur et mentor affecté peuvent commenter un jalon."""
        jalon = Jalon.objects.create(
            projet=self.projet1,
            titre="Jalon discussion",
            echeance=datetime.date(2026, 12, 1),
            cree_par=self.mentor1,
        )
        url_com = reverse("incubator:jalon-commentaires", kwargs={"pk": jalon.id})

        # Porteur commente
        self.client.force_authenticate(user=self.porteur1)
        res_p = self.client.post(url_com, {"texte": "Travail en cours, livrable bientôt prêt."}, format="json")
        self.assertEqual(res_p.status_code, status.HTTP_201_CREATED)

        # Mentor commente
        self.client.force_authenticate(user=self.mentor1)
        res_m = self.client.post(url_com, {"texte": "Bien reçu, merci d'ajouter les métriques."}, format="json")
        self.assertEqual(res_m.status_code, status.HTTP_201_CREATED)

        # Commentaire vide -> 400
        res_empty = self.client.post(url_com, {"texte": "   "}, format="json")
        self.assertEqual(res_empty.status_code, status.HTTP_400_BAD_REQUEST)

        # Mentor non affecté -> 403
        self.client.force_authenticate(user=self.mentor2)
        res_m2 = self.client.post(url_com, {"texte": "Commentaire indésirable"}, format="json")
        self.assertEqual(res_m2.status_code, status.HTTP_403_FORBIDDEN)

    def test_jalons_en_retard_calcul_et_route_alertes(self):
        """Vérifie le calcul dynamique d'en_retard et l'isolation des alertes selon le rôle."""
        today = timezone.now().date()
        past_date = today - datetime.timedelta(days=5)
        future_date = today + datetime.timedelta(days=10)

        # Projet 1
        j1_retard = Jalon.objects.create(
            projet=self.projet1,
            titre="Jalon Retard P1",
            echeance=past_date,
            statut=StatutJalon.A_FAIRE,
            cree_par=self.mentor1,
        )
        j2_fait = Jalon.objects.create(
            projet=self.projet1,
            titre="Jalon Fait P1",
            echeance=past_date,
            statut=StatutJalon.FAIT,
            cree_par=self.mentor1,
        )
        j3_futur = Jalon.objects.create(
            projet=self.projet1,
            titre="Jalon Futur P1",
            echeance=future_date,
            statut=StatutJalon.A_FAIRE,
            cree_par=self.mentor1,
        )

        # Projet 2
        j4_retard = Jalon.objects.create(
            projet=self.projet2,
            titre="Jalon Retard P2",
            echeance=past_date,
            statut=StatutJalon.EN_COURS,
            cree_par=self.mentor2,
        )

        # Vérification calcul dynamique
        self.assertTrue(j1_retard.en_retard)
        self.assertFalse(j2_fait.en_retard)
        self.assertFalse(j3_futur.en_retard)
        self.assertTrue(j4_retard.en_retard)

        url_alertes = reverse("incubator:alertes-retard")

        # 1. Porteur 1 ne voit QUE son jalon en retard (j1_retard)
        self.client.force_authenticate(user=self.porteur1)
        res_p1 = self.client.get(url_alertes)
        self.assertEqual(res_p1.status_code, status.HTTP_200_OK)
        ids_p1 = [a["id"] for a in res_p1.data]
        self.assertIn(j1_retard.id, ids_p1)
        self.assertNotIn(j4_retard.id, ids_p1)
        self.assertNotIn(j2_fait.id, ids_p1)

        # 2. Mentor 1 ne voit QUE le jalon en retard de son projet affecté (j1_retard)
        self.client.force_authenticate(user=self.mentor1)
        res_m1 = self.client.get(url_alertes)
        self.assertEqual(res_m1.status_code, status.HTTP_200_OK)
        ids_m1 = [a["id"] for a in res_m1.data]
        self.assertIn(j1_retard.id, ids_m1)
        self.assertNotIn(j4_retard.id, ids_m1)

        # 3. Coordonnateur voit TOUTES les alertes de retard (j1 et j4)
        self.client.force_authenticate(user=self.coordo)
        res_coordo = self.client.get(url_alertes)
        self.assertEqual(res_coordo.status_code, status.HTTP_200_OK)
        ids_coordo = [a["id"] for a in res_coordo.data]
        self.assertIn(j1_retard.id, ids_coordo)
        self.assertIn(j4_retard.id, ids_coordo)
        self.assertNotIn(j2_fait.id, ids_coordo)
        self.assertNotIn(j3_futur.id, ids_coordo)


@override_settings(PASSWORD_HASHERS=FAST_HASHERS)
class IncubateurPhase2SuiviAndExportTests(TestCase):
    """Tests Phase 2 T3 : Suivi à 3 et 6 mois et export de compte-rendu Excel."""

    def setUp(self):
        self.client = APIClient()
        self.domaine = Domaine.objects.create(nom="Biotechnologies")
        self.cohorte = Cohorte.objects.create(nom="Cohorte 2026", annee=2026)

        self.coordo = User.objects.create_user(
            email="coordo_s@ciat.sn", password="password123", role=Role.COORDONNATEUR, first_name="Coordo", last_name="CIAT"
        )
        self.porteur1 = User.objects.create_user(
            email="porteur1_s@ciat.sn", password="password123", role=Role.PORTEUR, first_name="Cheikh", last_name="Diop"
        )
        self.porteur2 = User.objects.create_user(
            email="porteur2_s@ciat.sn", password="password123", role=Role.PORTEUR, first_name="Awa", last_name="Ndiaye"
        )
        self.mentor1 = User.objects.create_user(
            email="mentor1_s@ciat.sn", password="password123", role=Role.MENTOR, first_name="Mansour", last_name="Sy"
        )
        self.mentor2 = User.objects.create_user(
            email="mentor2_s@ciat.sn", password="password123", role=Role.MENTOR, first_name="Aïda", last_name="Fall"
        )

        self.projet1 = Projet.objects.create(
            titre="Système d'Irrigation Éco-Énergétique",
            domaine=self.domaine,
            cohorte=self.cohorte,
            porteur=self.porteur1,
            statut=Projet.Statut.SELECTIONNE,
        )
        self.projet2 = Projet.objects.create(
            titre="Plateforme E-Santé Rurale",
            domaine=self.domaine,
            cohorte=self.cohorte,
            porteur=self.porteur2,
            statut=Projet.Statut.SELECTIONNE,
        )

        AffectationMentor.objects.create(projet=self.projet1, mentor=self.mentor1, affecte_par=self.coordo)
        AffectationMentor.objects.create(projet=self.projet2, mentor=self.mentor2, affecte_par=self.coordo)

        # Données pour enrichir le compte-rendu du projet 1
        Objectif.objects.create(projet=self.projet1, libelle="Développer l'API REST", statut=StatutObjectif.ATTEINT, cree_par=self.mentor1)
        Jalon.objects.create(projet=self.projet1, titre="Validation du banc de test", echeance=datetime.date(2026, 11, 1), statut=StatutJalon.FAIT, cree_par=self.mentor1)

    def test_creation_suivis_3_et_6_mois_par_mentor_affecte(self):
        """Le mentor affecté ou le coordonnateur peut créer les bilans à 3 et 6 mois."""
        url = reverse("incubator:projet-suivis", kwargs={"pk": self.projet1.id})

        # 1. Mentor affecté crée le bilan à 3 mois
        self.client.force_authenticate(user=self.mentor1)
        res_3m = self.client.post(
            url,
            {
                "echeance": "3_mois",
                "bilan": "Le projet progresse conformément au calendrier. Le prototype a été testé avec succès.",
                "indicateurs": {"avancement_pct": 50, "utilisateurs_testeurs": 12},
            },
            format="json",
        )
        self.assertEqual(res_3m.status_code, status.HTTP_201_CREATED)
        self.assertEqual(res_3m.data["echeance"], "3_mois")

        # 2. Coordonnateur crée le bilan à 6 mois
        self.client.force_authenticate(user=self.coordo)
        res_6m = self.client.post(
            url,
            {
                "echeance": "6_mois",
                "bilan": "Phase pilote opérationnelle. Préparation du déploiement à grande échelle.",
                "indicateurs": {"avancement_pct": 90, "chiffre_affaires_fcfa": 1500000},
            },
            format="json",
        )
        self.assertEqual(res_6m.status_code, status.HTTP_201_CREATED)
        self.assertEqual(res_6m.data["echeance"], "6_mois")

        # Vérification en base
        self.assertEqual(SuiviProjet.objects.filter(projet=self.projet1).count(), 2)

    def test_rejet_doublon_suivi_meme_echeance(self):
        """Un projet ne peut pas recevoir deux bilans pour la même échéance."""
        SuiviProjet.objects.create(
            projet=self.projet1,
            echeance=EcheanceSuivi.TROIS_MOIS,
            bilan="Premier bilan 3 mois.",
            redige_par=self.mentor1,
        )

        url = reverse("incubator:projet-suivis", kwargs={"pk": self.projet1.id})
        self.client.force_authenticate(user=self.mentor1)

        res_dup = self.client.post(
            url,
            {"echeance": "3_mois", "bilan": "Deuxième tentative."},
            format="json",
        )
        self.assertEqual(res_dup.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("déjà été enregistré", str(res_dup.data))

    def test_porteur_lecture_seule_suivis_et_rejet_ecriture(self):
        """Le porteur peut consulter les bilans de suivi mais ne peut pas en rédiger."""
        SuiviProjet.objects.create(
            projet=self.projet1,
            echeance=EcheanceSuivi.TROIS_MOIS,
            bilan="Bilan officiel 3 mois.",
            redige_par=self.mentor1,
        )

        url = reverse("incubator:projet-suivis", kwargs={"pk": self.projet1.id})
        self.client.force_authenticate(user=self.porteur1)

        # GET -> 200
        res_get = self.client.get(url)
        self.assertEqual(res_get.status_code, status.HTTP_200_OK)
        self.assertEqual(len(res_get.data), 1)
        self.assertEqual(res_get.data[0]["echeance"], "3_mois")

        # POST -> 403
        res_post = self.client.post(url, {"echeance": "6_mois", "bilan": "Tentative porteur."}, format="json")
        self.assertEqual(res_post.status_code, status.HTTP_403_FORBIDDEN)

    def test_mentor_non_affecte_acces_suivis_refuse(self):
        """Un mentor non affecté n'a pas accès aux bilans de suivi d'un autre projet."""
        url = reverse("incubator:projet-suivis", kwargs={"pk": self.projet1.id})
        self.client.force_authenticate(user=self.mentor2)

        self.assertEqual(self.client.get(url).status_code, status.HTTP_403_FORBIDDEN)
        self.assertEqual(
            self.client.post(url, {"echeance": "3_mois", "bilan": "Intrusion."}, format="json").status_code,
            status.HTTP_403_FORBIDDEN,
        )

    def test_export_compte_rendu_excel_succes_et_structure_4_blocs(self):
        """Vérifie la génération du fichier Excel avec ses 4 blocs et les bons accents UTF-8."""
        SuiviProjet.objects.create(
            projet=self.projet1,
            echeance=EcheanceSuivi.TROIS_MOIS,
            bilan="Résultats probants du modèle économique et technique.",
            indicateurs={"taux_satisfaction": "95%"},
            redige_par=self.mentor1,
        )

        url_export = reverse("incubator:projet-compte-rendu", kwargs={"pk": self.projet1.id})

        # Porteur propriétaire télécharge le compte-rendu
        self.client.force_authenticate(user=self.porteur1)
        res = self.client.get(url_export)
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(
            res["Content-Type"],
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        )
        self.assertIn("attachment; filename=", res["Content-Disposition"])

        # Analyse et validation du contenu Excel via openpyxl
        wb = openpyxl.load_workbook(io.BytesIO(res.content))
        self.assertIn("Compte Rendu Incubation", wb.sheetnames)
        ws = wb["Compte Rendu Incubation"]

        # Extraction de l'ensemble des textes du fichier
        all_cell_values = [
            str(cell.value)
            for row in ws.iter_rows()
            for cell in row
            if cell.value is not None
        ]
        full_text = " ".join(all_cell_values)

        # 1. Vérification Bloc 1 : Informations projet & accents
        self.assertIn("INFORMATIONS DU PROJET", full_text)
        self.assertIn("Système d'Irrigation Éco-Énergétique", full_text)
        self.assertIn("Cheikh Diop", full_text)
        self.assertIn("Mansour Sy", full_text)

        # 2. Vérification Bloc 2 : Objectifs
        self.assertIn("OBJECTIFS D'ACCOMPAGNEMENT", full_text)
        self.assertIn("Développer l'API REST", full_text)

        # 3. Vérification Bloc 3 : Jalons
        self.assertIn("JALONS ET RÉALISATIONS", full_text)
        self.assertIn("Validation du banc de test", full_text)

        # 4. Vérification Bloc 4 : Bilans de suivi
        self.assertIn("BILANS DE SUIVI PÉRIODIQUE", full_text)
        self.assertIn("Résultats probants du modèle économique et technique.", full_text)
        self.assertIn("taux_satisfaction: 95%", full_text)

    def test_export_compte_rendu_interdit_aux_tiers(self):
        """Un porteur ou un mentor d'un autre projet ne peut pas exporter le compte-rendu."""
        url_export = reverse("incubator:projet-compte-rendu", kwargs={"pk": self.projet1.id})

        # Porteur 2 tente de télécharger le compte-rendu du projet 1 -> 403
        self.client.force_authenticate(user=self.porteur2)
        res_p2 = self.client.get(url_export)
        self.assertEqual(res_p2.status_code, status.HTTP_403_FORBIDDEN)

        # Mentor 2 (non affecté) tente de télécharger -> 403
        self.client.force_authenticate(user=self.mentor2)
        res_m2 = self.client.get(url_export)
        self.assertEqual(res_m2.status_code, status.HTTP_403_FORBIDDEN)

    def test_export_excel_neutralisation_injection_formules(self):
        """Vérifie que les chaînes malveillantes (=, +, -, @) sont neutralisées et ne deviennent jamais des formules Excel (data_type != 'f')."""
        projet_piege = Projet.objects.create(
            titre="=1+1",
            domaine=self.domaine,
            cohorte=self.cohorte,
            porteur=self.porteur1,
            statut=Projet.Statut.SELECTIONNE,
        )
        AffectationMentor.objects.create(projet=projet_piege, mentor=self.mentor1, affecte_par=self.coordo)

        # Bloc 2 : Objectifs avec =HYPERLINK(...), +123, -123
        Objectif.objects.create(
            projet=projet_piege,
            libelle='=HYPERLINK("http://evil.com", "Lien")',
            echeance=datetime.date(2026, 12, 1),
            cree_par=self.mentor1,
        )
        Objectif.objects.create(
            projet=projet_piege,
            libelle="+123",
            echeance=None,
            cree_par=self.mentor1,
        )
        Objectif.objects.create(
            projet=projet_piege,
            libelle="-123",
            echeance=None,
            cree_par=self.mentor1,
        )

        # Bloc 3 : Jalons avec @SUM, texte ordinaire et espace avant formule
        Jalon.objects.create(
            projet=projet_piege,
            titre="@SUM(A1:A10)",
            echeance=datetime.date(2026, 12, 15),
            cree_par=self.mentor1,
        )
        Jalon.objects.create(
            projet=projet_piege,
            titre="   =CMD|'/C calc'!A0",
            echeance=datetime.date(2026, 12, 20),
            cree_par=self.mentor1,
        )
        Jalon.objects.create(
            projet=projet_piege,
            titre="Texte ordinaire légitime",
            echeance=datetime.date(2026, 12, 25),
            cree_par=self.mentor1,
        )

        # Bloc 4 : Bilan avec chaîne formule et indicateurs
        SuiviProjet.objects.create(
            projet=projet_piege,
            echeance=EcheanceSuivi.TROIS_MOIS,
            bilan="=cmd|' /C notepad'!'A1'",
            indicateurs={"score": "+123", "note": "@SUM(1,2)"},
            redige_par=self.mentor1,
        )

        url_export = reverse("incubator:projet-compte-rendu", kwargs={"pk": projet_piege.id})
        self.client.force_authenticate(user=self.porteur1)
        res = self.client.get(url_export)
        self.assertEqual(res.status_code, status.HTTP_200_OK)

        wb = openpyxl.load_workbook(io.BytesIO(res.content))
        ws = wb.active

        formules_trouvees = []
        valeurs_trouvees = []
        types_trouves = {}

        for row in ws.iter_rows():
            for cell in row:
                if cell.value is not None:
                    valeurs_trouvees.append(str(cell.value))
                    types_trouves[cell.data_type] = types_trouves.get(cell.data_type, 0) + 1
                    if cell.data_type == "f":
                        formules_trouvees.append((cell.coordinate, cell.value))

        # 1. AUCUNE cellule ne doit avoir le type formule 'f'
        self.assertEqual(len(formules_trouvees), 0, f"Formules non neutralisées détectées : {formules_trouvees}")

        # 2. Les chaînes dangereuses ont bien été préservées
        full_text = " ".join(valeurs_trouvees)
        self.assertIn("=1+1", full_text)
        self.assertIn("=HYPERLINK", full_text)
        self.assertIn("+123", full_text)
        self.assertIn("-123", full_text)
        self.assertIn("@SUM", full_text)
        self.assertIn("Texte ordinaire légitime", full_text)

        # 3. Les nombres légitimes conservent le type 'n'
        self.assertIn("n", types_trouves, "Les nombres légitimes doivent conserver le type 'n'")

    def test_validation_indicateurs_json_strict(self):
        """Vérifie la validation stricte du champ JSON indicateurs lors de la création d'un bilan."""
        url = reverse("incubator:projet-suivis", kwargs={"pk": self.projet2.id})
        self.client.force_authenticate(user=self.mentor2)

        # 1. Rejet : liste à la racine
        res_list = self.client.post(
            url,
            {"echeance": "3_mois", "bilan": "Test liste", "indicateurs": [1, 2, 3]},
            format="json",
        )
        self.assertEqual(res_list.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("dictionnaire", str(res_list.data))

        # 2. Rejet : chaîne à la racine
        res_str = self.client.post(
            url,
            {"echeance": "3_mois", "bilan": "Test string", "indicateurs": "valeur brute"},
            format="json",
        )
        self.assertEqual(res_str.status_code, status.HTTP_400_BAD_REQUEST)

        # 3. Rejet : nombre à la racine
        res_num = self.client.post(
            url,
            {"echeance": "3_mois", "bilan": "Test number", "indicateurs": 42},
            format="json",
        )
        self.assertEqual(res_num.status_code, status.HTTP_400_BAD_REQUEST)

        # 4. Rejet : booléen à la racine
        res_bool = self.client.post(
            url,
            {"echeance": "3_mois", "bilan": "Test bool", "indicateurs": True},
            format="json",
        )
        self.assertEqual(res_bool.status_code, status.HTTP_400_BAD_REQUEST)

        # 5. Rejet : structure imbriquée (dictionnaire dans dictionnaire ou liste)
        res_nested = self.client.post(
            url,
            {"echeance": "3_mois", "bilan": "Test nested", "indicateurs": {"metrics": {"deep": 1}}},
            format="json",
        )
        self.assertEqual(res_nested.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("imbriquée", str(res_nested.data))

        # 6. Rejet : clé vide
        res_empty_key = self.client.post(
            url,
            {"echeance": "3_mois", "bilan": "Test cle vide", "indicateurs": {"   ": 10}},
            format="json",
        )
        self.assertEqual(res_empty_key.status_code, status.HTTP_400_BAD_REQUEST)

        # 7. Succès : indicateurs null (normalisé en {})
        res_null = self.client.post(
            url,
            {"echeance": "3_mois", "bilan": "Test indicateurs null", "indicateurs": None},
            format="json",
        )
        self.assertEqual(res_null.status_code, status.HTTP_201_CREATED)
        self.assertEqual(res_null.data["indicateurs"], {})

        # 8. Succès : objet vide {}
        res_empty_obj = self.client.post(
            url,
            {"echeance": "6_mois", "bilan": "Test objet vide", "indicateurs": {}},
            format="json",
        )
        self.assertEqual(res_empty_obj.status_code, status.HTTP_201_CREATED)
        self.assertEqual(res_empty_obj.data["indicateurs"], {})

    def test_export_excel_resilience_donnees_historiques_invalides(self):
        """Vérifie que l'export Excel ne lève pas d'erreur HTTP 500 sur des données historiques non conformes."""
        projet_legacy = Projet.objects.create(
            titre="Projet Legacy Indic",
            domaine=self.domaine,
            cohorte=self.cohorte,
            porteur=self.porteur1,
            statut=Projet.Statut.SELECTIONNE,
        )
        AffectationMentor.objects.create(projet=projet_legacy, mentor=self.mentor1, affecte_par=self.coordo)

        # Création directe en base de données avec des indicateurs sous forme de liste et chaîne
        SuiviProjet.objects.create(
            projet=projet_legacy,
            echeance=EcheanceSuivi.TROIS_MOIS,
            bilan="Bilan avec liste historique",
            indicateurs=["indicateur_a", "indicateur_b"],
            redige_par=self.mentor1,
        )
        SuiviProjet.objects.create(
            projet=projet_legacy,
            echeance=EcheanceSuivi.SIX_MOIS,
            bilan="Bilan avec chaine historique",
            indicateurs="chaine brute historique",
            redige_par=self.mentor1,
        )

        url_export = reverse("incubator:projet-compte-rendu", kwargs={"pk": projet_legacy.id})
        self.client.force_authenticate(user=self.porteur1)
        res = self.client.get(url_export)

        # Vérifie qu'aucune erreur 500 n'est survenue
        self.assertEqual(res.status_code, status.HTTP_200_OK)

        # Vérifie que le classeur s'ouvre correctement
        wb = openpyxl.load_workbook(io.BytesIO(res.content))
        ws = wb.active
        all_text = " ".join(str(cell.value) for row in ws.iter_rows() for cell in row if cell.value is not None)
        self.assertIn("indicateur_a", all_text)
        self.assertIn("chaine brute historique", all_text)

    def test_integrite_et_concurrence_bilans_suivi(self):
        """Vérifie l'intégrité transactionnelle, l'unicité et la gestion de concurrence pour SuiviProjet."""
        # 1. Création normale d'un bilan pour projet1 à 3 mois
        url1 = reverse("incubator:projet-suivis", kwargs={"pk": self.projet1.id})
        self.client.force_authenticate(user=self.mentor1)
        res_create = self.client.post(
            url1,
            {"echeance": "3_mois", "bilan": "Premier bilan normal 3 mois"},
            format="json",
        )
        self.assertEqual(res_create.status_code, status.HTTP_201_CREATED)
        self.assertEqual(SuiviProjet.objects.filter(projet=self.projet1, echeance="3_mois").count(), 1)

        # 2. Rejet propre en doublon pour le même projet et la même échéance
        res_dup = self.client.post(
            url1,
            {"echeance": "3_mois", "bilan": "Doublon ordinaire même échéance"},
            format="json",
        )
        self.assertEqual(res_dup.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("déjà été enregistré", str(res_dup.data))
        self.assertEqual(SuiviProjet.objects.filter(projet=self.projet1, echeance="3_mois").count(), 1)

        # 3. Autorisation de deux échéances différentes pour un même projet
        res_6m = self.client.post(
            url1,
            {"echeance": "6_mois", "bilan": "Bilan 6 mois même projet"},
            format="json",
        )
        self.assertEqual(res_6m.status_code, status.HTTP_201_CREATED)
        self.assertEqual(SuiviProjet.objects.filter(projet=self.projet1).count(), 2)

        # 4. Autorisation de deux projets différents avec la même échéance
        url2 = reverse("incubator:projet-suivis", kwargs={"pk": self.projet2.id})
        self.client.force_authenticate(user=self.mentor2)
        res_p2 = self.client.post(
            url2,
            {"echeance": "3_mois", "bilan": "Bilan 3 mois projet 2"},
            format="json",
        )
        self.assertEqual(res_p2.status_code, status.HTTP_201_CREATED)
        self.assertEqual(SuiviProjet.objects.filter(projet=self.projet2, echeance="3_mois").count(), 1)

        # 5. Contrainte d'unicité en base de données
        with transaction.atomic():
            with self.assertRaises(IntegrityError):
                SuiviProjet.objects.create(
                    projet=self.projet1,
                    echeance=EcheanceSuivi.TROIS_MOIS,
                    bilan="Insertion brute doublon",
                    redige_par=self.mentor1,
                )

        # 6. Conflit d'intégrité / concurrence pendant l'enregistrement via API
        # Simule une requête concurrente qui insère la ligne après serializer.is_valid()
        projet_concurrent = Projet.objects.create(
            titre="Projet Concurrence",
            domaine=self.domaine,
            cohorte=self.cohorte,
            porteur=self.porteur1,
            statut=Projet.Statut.SELECTIONNE,
        )
        AffectationMentor.objects.create(projet=projet_concurrent, mentor=self.mentor1, affecte_par=self.coordo)
        url_conc = reverse("incubator:projet-suivis", kwargs={"pk": projet_concurrent.id})
        self.client.force_authenticate(user=self.mentor1)

        # Simulation d'un conflit de concurrence : une requête concurrente a inséré la ligne
        # entre le moment où serializer.is_valid() a vérifié et le moment où save() s'exécute
        SuiviProjet.objects.create(
            projet=projet_concurrent,
            echeance=EcheanceSuivi.TROIS_MOIS,
            bilan="Insertion concurrente préalable",
            redige_par=self.mentor1,
        )

        def concurrent_insert_side_effect(*args, **kwargs):
            raise IntegrityError("UNIQUE constraint failed: incubator_suiviprojet.projet_id, incubator_suiviprojet.echeance")

        with patch.object(SuiviProjet.objects, "create", side_effect=concurrent_insert_side_effect):
            res_concurrent = self.client.post(
                url_conc,
                {"echeance": "3_mois", "bilan": "Tentative post-validation"},
                format="json",
            )
            # Ne doit JAMAIS renvoyer 500, mais un 400 documenté
            self.assertEqual(res_concurrent.status_code, status.HTTP_400_BAD_REQUEST)
            self.assertIn("déjà été enregistré", str(res_concurrent.data))

        # Vérification du maintien de l'intégrité : exactement 1 seul enregistrement existe
        self.assertEqual(SuiviProjet.objects.filter(projet=projet_concurrent, echeance="3_mois").count(), 1)

    def test_export_excel_format_query_param_validation(self):
        """Vérifie la validation du paramètre de requête format sur l'export Excel."""
        url_export = reverse("incubator:projet-compte-rendu", kwargs={"pk": self.projet1.id})
        self.client.force_authenticate(user=self.porteur1)

        # 1. format=xlsx valide
        res_xlsx = self.client.get(f"{url_export}?format=xlsx")
        self.assertEqual(res_xlsx.status_code, status.HTTP_200_OK)
        self.assertEqual(res_xlsx["Content-Type"], "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")

        # 2. format non supporté (ex: pdf, csv) -> HTTP 400 documenté
        res_bad_fmt = self.client.get(f"{url_export}?format=pdf")
        self.assertEqual(res_bad_fmt.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("non supporté", res_bad_fmt.data["detail"])

    def test_affectation_mentor_save_validation_strict(self):
        """Vérifie qu'une tentative d'affectation d'un utilisateur non-mentor via ORM save() lève ValidationError."""
        user_candidat = User.objects.create_user(
            email="candidat_non_mentor@ciat.sn",
            password="password123",
            role=Role.PORTEUR,
        )
        projet_test = Projet.objects.create(
            titre="Projet Test Mentor Save",
            domaine=self.domaine,
            cohorte=self.cohorte,
            porteur=self.porteur1,
            statut=Projet.Statut.SELECTIONNE,
        )

        affectation = AffectationMentor(
            projet=projet_test,
            mentor=user_candidat,
            affecte_par=self.coordo,
        )
        with self.assertRaises(DjangoValidationError):
            affectation.save()

    def test_jalon_transitions_et_rejet_statut_invalide(self):
        """Vérifie le cycle des transitions d'un jalon (a_faire -> en_cours -> fait) et le rejet des statuts invalides."""
        jalon = Jalon.objects.create(
            projet=self.projet1,
            titre="Jalon Transition Test",
            echeance=datetime.date(2026, 12, 1),
            statut=StatutJalon.A_FAIRE,
            cree_par=self.mentor1,
        )
        url_jalon = reverse("incubator:jalon-detail", kwargs={"pk": jalon.id})
        self.client.force_authenticate(user=self.mentor1)

        # Transition 1 : a_faire -> en_cours
        res_en_cours = self.client.patch(url_jalon, {"statut": "en_cours"}, format="json")
        self.assertEqual(res_en_cours.status_code, status.HTTP_200_OK)
        self.assertEqual(res_en_cours.data["statut"], "en_cours")

        # Transition 2 : en_cours -> fait
        res_fait = self.client.patch(url_jalon, {"statut": "fait"}, format="json")
        self.assertEqual(res_fait.status_code, status.HTTP_200_OK)
        self.assertEqual(res_fait.data["statut"], "fait")

        # Rejet statut invalide
        res_invalide = self.client.patch(url_jalon, {"statut": "statut_fantaisiste"}, format="json")
        self.assertEqual(res_invalide.status_code, status.HTTP_400_BAD_REQUEST)







