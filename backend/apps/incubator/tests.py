import io
from django.core.files.uploadedfile import SimpleUploadedFile
from django.test import TestCase
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APIClient

from apps.core.models import Cohorte, Domaine, Projet, Role, User
from apps.incubator.models import (
    Critere,
    Decision,
    Dossier,
    Evaluation,
    Grille,
    Piece,
    StatutDossier,
    TypePiece,
)


class IncubateurAPITests(TestCase):
    def setUp(self):
        self.client = APIClient()

        # Domaines & Cohorte
        self.domaine = Domaine.objects.create(nom="TIC et Numérique")
        self.cohorte = Cohorte.objects.create(nom="Cohorte 2026", annee=2026)

        # Utilisateurs
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
            resume="Plateforme agricole intelligente",
            domaine=self.domaine,
            cohorte=self.cohorte,
            porteur=self.porteur1,
            statut=Projet.Statut.IDEE,
        )
        self.projet2 = Projet.objects.create(
            titre="HealthTech",
            resume="Télémédecine rurale",
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

    # -------------------------------------------------------------
    # Tests T1 : Dossiers & Pièces jointes
    # -------------------------------------------------------------
    def test_t1_porteur_cree_dossier_et_isolation(self):
        """Un porteur crée un dossier pour son projet, un autre ne peut pas le voir."""
        self.client.force_authenticate(user=self.porteur1)

        # Création du dossier
        url = reverse("incubator:dossier-list-create")
        res = self.client.post(url, {"projet_id": self.projet1.id}, format="json")
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        dossier_id = res.data["id"]
        self.assertEqual(res.data["statut"], "brouillon")
        self.assertEqual(res.data["completude"], 0)
        self.assertEqual(len(res.data["pieces_manquantes"]), 3)

        # Le porteur 2 consulte la liste : il ne doit pas voir le dossier du porteur 1
        self.client.force_authenticate(user=self.porteur2)
        res2 = self.client.get(url)
        self.assertEqual(res2.status_code, status.HTTP_200_OK)
        # Aucune donnée pour porteur 2
        dossiers_porteur2 = res2.data if isinstance(res2.data, list) else res2.data.get("results", [])
        self.assertEqual(len(dossiers_porteur2), 0)

        # Accès direct interdit au porteur 2
        detail_url = reverse("incubator:dossier-detail", kwargs={"pk": dossier_id})
        res3 = self.client.get(detail_url)
        self.assertEqual(res3.status_code, status.HTTP_403_FORBIDDEN)

    def test_t1_depot_pieces_completude_et_soumission(self):
        """Dépôt successif de pièces, complétude 100%, puis soumission."""
        self.client.force_authenticate(user=self.porteur1)
        dossier = Dossier.objects.create(projet=self.projet1)

        piece_url = reverse("incubator:dossier-piece-create", kwargs={"pk": dossier.id})
        soumettre_url = reverse("incubator:dossier-soumettre", kwargs={"pk": dossier.id})

        # Tentative de soumission à vide -> échec
        res_fail = self.client.post(soumettre_url)
        self.assertEqual(res_fail.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("pieces_manquantes", res_fail.data)

        # Ajout pièce 1 : fiche_projet
        f1 = SimpleUploadedFile("fiche.pdf", b"dummy pdf content", content_type="application/pdf")
        res_p1 = self.client.post(piece_url, {"type": "fiche_projet", "fichier": f1}, format="multipart")
        self.assertEqual(res_p1.status_code, status.HTTP_201_CREATED)

        # Ajout pièce 2 : presentation_equipe
        f2 = SimpleUploadedFile("equipe.docx", b"dummy docx content", content_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document")
        res_p2 = self.client.post(piece_url, {"type": "presentation_equipe", "fichier": f2}, format="multipart")
        self.assertEqual(res_p2.status_code, status.HTTP_201_CREATED)

        # Vérification complétude (2/3 -> 66%)
        detail_url = reverse("incubator:dossier-detail", kwargs={"pk": dossier.id})
        res_det = self.client.get(detail_url)
        self.assertEqual(res_det.data["completude"], 66)
        self.assertEqual(res_det.data["pieces_manquantes"], ["budget_previsionnel"])

        # Ajout pièce 3 : budget_previsionnel
        f3 = SimpleUploadedFile("budget.pdf", b"dummy budget pdf", content_type="application/pdf")
        res_p3 = self.client.post(piece_url, {"type": "budget_previsionnel", "fichier": f3}, format="multipart")
        self.assertEqual(res_p3.status_code, status.HTTP_201_CREATED)

        # Vérification complétude (3/3 -> 100%)
        res_det100 = self.client.get(detail_url)
        self.assertEqual(res_det100.data["completude"], 100)
        self.assertEqual(len(res_det100.data["pieces_manquantes"]), 0)

        # Soumission réussie
        res_soumis = self.client.post(soumettre_url)
        self.assertEqual(res_soumis.status_code, status.HTTP_200_OK)
        self.assertEqual(res_soumis.data["statut"], "soumis")
        self.assertIsNotNone(res_soumis.data["soumis_le"])

        # Le projet associé passe à "depose"
        self.projet1.refresh_from_db()
        self.assertEqual(self.projet1.statut, Projet.Statut.DEPOSE)

    # -------------------------------------------------------------
    # Tests T2 : Grille d'évaluation et Évaluations
    # -------------------------------------------------------------
    def test_t2_evaluations_et_score_moyen(self):
        """Deux membres du comité évaluent le dossier, calcul du score moyen."""
        dossier = Dossier.objects.create(projet=self.projet1, statut=StatutDossier.SOUMIS)
        eval_url = reverse("incubator:dossier-evaluations", kwargs={"pk": dossier.id})

        # Membre 1 évalue
        self.client.force_authenticate(user=self.comite1)
        data_eval1 = {
            "notes": [
                {"critere": self.c1.id, "note": 14.0},  # poids 1
                {"critere": self.c2.id, "note": 17.0},  # poids 2 -> score = (14*1 + 17*2) / 3 = 48/3 = 16.0
            ],
            "avis": "Projet prometteur",
        }
        res_ev1 = self.client.post(eval_url, data_eval1, format="json")
        self.assertEqual(res_ev1.status_code, status.HTTP_201_CREATED)
        self.assertEqual(res_ev1.data["score"], 16.0)

        # Tentative de deuxième évaluation par le même membre -> refus 400
        res_dup = self.client.post(eval_url, data_eval1, format="json")
        self.assertEqual(res_dup.status_code, status.HTTP_400_BAD_REQUEST)

        # Membre 2 évalue
        self.client.force_authenticate(user=self.comite2)
        data_eval2 = {
            "notes": [
                {"critere": self.c1.id, "note": 11.0},
                {"critere": self.c2.id, "note": 14.0},  # (11*1 + 14*2) / 3 = 39/3 = 13.0
            ],
            "avis": "Bonne initiative",
        }
        res_ev2 = self.client.post(eval_url, data_eval2, format="json")
        self.assertEqual(res_ev2.status_code, status.HTTP_201_CREATED)
        self.assertEqual(res_ev2.data["score"], 13.0)

        # Consultation des évaluations et vérification du score moyen ((16.0 + 13.0) / 2 = 14.5)
        res_list = self.client.get(eval_url)
        self.assertEqual(res_list.status_code, status.HTTP_200_OK)
        self.assertEqual(res_list.data["total_evaluations"], 2)
        self.assertEqual(res_list.data["score_moyen"], 14.5)

    # -------------------------------------------------------------
    # Tests T3 : Décision motivée
    # -------------------------------------------------------------
    def test_t3_decision_motivee_mise_a_jour_statuts(self):
        """Le coordonnateur prend une décision motivée qui met à jour dossier et projet."""
        dossier = Dossier.objects.create(projet=self.projet1, statut=StatutDossier.EN_EVALUATION)
        dec_url = reverse("incubator:dossier-decision", kwargs={"pk": dossier.id})

        # Porteur tente de décider -> 403 Forbidden
        self.client.force_authenticate(user=self.porteur1)
        res_porteur = self.client.post(dec_url, {"decision": "accepte", "motif": "Auto-validation"}, format="json")
        self.assertEqual(res_porteur.status_code, status.HTTP_403_FORBIDDEN)

        # Coordonnateur avec motif vide -> 400 Bad Request
        self.client.force_authenticate(user=self.coordo)
        res_vide = self.client.post(dec_url, {"decision": "accepte", "motif": "   "}, format="json")
        self.assertEqual(res_vide.status_code, status.HTTP_400_BAD_REQUEST)

        # Coordonnateur valide avec succès
        res_ok = self.client.post(
            dec_url,
            {"decision": "accepte", "motif": "Projet à fort potentiel sélectionné par le comité."},
            format="json",
        )
        self.assertEqual(res_ok.status_code, status.HTTP_201_CREATED)

        # Vérification mise à jour du dossier et du projet
        dossier.refresh_from_db()
        self.projet1.refresh_from_db()
        self.assertEqual(dossier.statut, StatutDossier.ACCEPTE)
        self.assertEqual(self.projet1.statut, Projet.Statut.SELECTIONNE)
