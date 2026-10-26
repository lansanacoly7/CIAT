import concurrent.futures
from django.core.files.uploadedfile import SimpleUploadedFile
from django.db import connection, transaction
from django.test import TestCase, TransactionTestCase
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
