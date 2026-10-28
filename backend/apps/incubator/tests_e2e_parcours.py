"""Test de bout en bout (E2E) de l'API de l'incubateur CIAT (Phase 5 Pathé — T2).

Déroule le parcours complet du programme CIAT :
1. Inscription du porteur de projet et authentification JWT
2. Création du projet, dépôt des 3 pièces obligatoires et soumission officielle
3. Notification email de confirmation de soumission (avec lien de l'accusé de réception)
4. Téléchargement de l'accusé de réception officiel en PDF et contrôle RBAC
5. Évaluation multicritère par le comité de sélection
6. Décision motivée du comité et notification email avec motif
7. Affectation du mentor référent
8. Création de jalons, détection du retard et commande d'alerte email idempotente
9. Export du compte rendu complet du projet au format PDF et Excel

Critères de validation :
- Exécution ultra-rapide (< 5 secondes)
- Casse immédiatement si une étape du cycle est rompue
- Vérification rigoureuse de mail.outbox et des flux binaires PDF
"""
from datetime import timedelta
from decimal import Decimal

from django.core import mail
from django.core.cache import cache
from django.core.files.uploadedfile import SimpleUploadedFile
from django.core.management import call_command
from django.test import override_settings
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APITestCase

from apps.core.models import Cohorte, Domaine, Projet, Role, User
from apps.incubator.models import (
    AffectationMentor,
    Critere,
    Dossier,
    Grille,
    Jalon,
    Objectif,
    StatutDossier,
    StatutJalon,
)
from apps.incubator.notifications import AlerteJalonEnvoyee


@override_settings(
    PASSWORD_HASHERS=["django.contrib.auth.hashers.MD5PasswordHasher"],
    EMAIL_BACKEND="django.core.mail.backends.locmem.EmailBackend",
)
class ParcoursCompletE2EAPITests(APITestCase):
    """Suite de tests d'intégration de bout en bout (E2E) couvrant l'ensemble du cycle CIAT."""

    @classmethod
    def setUpTestData(cls):
        super().setUpTestData()

        # Données de référence
        cls.domaine = Domaine.objects.create(
            nom="Agriculture & AgriTech",
        )
        cls.cohorte = Cohorte.objects.create(
            nom="Cohorte 2026 - Emergence",
            annee=2026,
        )

        # Acteurs administratifs et comités
        cls.admin = User.objects.create_user(
            email="admin.e2e@ciat.sn",
            password="AdminPassword2026!",
            first_name="Amadou",
            last_name="Fall",
            role=Role.ADMIN,
        )
        cls.coordo = User.objects.create_user(
            email="coordo.e2e@ciat.sn",
            password="CoordoPassword2026!",
            first_name="Awa",
            last_name="Ndiaye",
            role=Role.COORDONNATEUR,
        )
        cls.comite = User.objects.create_user(
            email="comite.e2e@ciat.sn",
            password="ComitePassword2026!",
            first_name="Oumar",
            last_name="Sow",
            role=Role.COMITE,
        )
        cls.mentor = User.objects.create_user(
            email="mentor.e2e@ciat.sn",
            password="MentorPassword2026!",
            first_name="Cheikh",
            last_name="Ba",
            role=Role.MENTOR,
        )
        cls.intrus = User.objects.create_user(
            email="intrus.e2e@ciat.sn",
            password="IntrusPassword2026!",
            first_name="Moussa",
            last_name="Traore",
            role=Role.PORTEUR,
        )

        # Grille d'évaluation active
        cls.grille = Grille.objects.create(nom="Grille Sélection E2E 2026", active=True)
        cls.critere1 = Critere.objects.create(
            grille=cls.grille, libelle="Innovation technique", poids=2, note_max=20, ordre=1
        )
        cls.critere2 = Critere.objects.create(
            grille=cls.grille, libelle="Impact socio-économique", poids=1, note_max=20, ordre=2
        )

    def setUp(self):
        super().setUp()
        cache.clear()
        mail.outbox.clear()

    # ==========================================================================
    # Étape 1 : Inscription et Authentification
    # ==========================================================================
    def test_01_inscription_porteur_et_authentification(self):
        """Étape 1 : Un porteur s'inscrit sur la plateforme et obtient un token JWT."""
        register_payload = {
            "email": "fatou.diop.e2e@ciat.sn",
            "password": "Password123!",
            "first_name": "Fatou",
            "last_name": "Diop",
            "telephone": "+221770001122",
            "organisation": "Sénégal Tech Agro",
            "genre": "F",
        }
        res_reg = self.client.post("/api/auth/register/", register_payload)
        self.assertEqual(res_reg.status_code, status.HTTP_201_CREATED)
        self.assertEqual(res_reg.data["email"], "fatou.diop.e2e@ciat.sn")

        # Authentification JWT
        login_payload = {"email": "fatou.diop.e2e@ciat.sn", "password": "Password123!"}
        res_token = self.client.post("/api/auth/token/", login_payload)
        self.assertEqual(res_token.status_code, status.HTTP_200_OK)
        self.assertIn("access", res_token.data)

    # ==========================================================================
    # Étape 2 : Dépôt et Soumission du Dossier (avec Email de confirmation)
    # ==========================================================================
    def test_02_depot_pieces_soumission_et_email_confirmation(self):
        """Étape 2 : Création de projet, dépôt des pièces obligatoires, soumission et email."""
        porteur = User.objects.create_user(
            email="porteur.e2e@ciat.sn",
            password="Password123!",
            first_name="Fatou",
            last_name="Diop",
            role=Role.PORTEUR,
        )
        projet = Projet.objects.create(
            titre="Système d'Irrigation Solaire E2E",
            resume="Optimisation de l'arrosage par capteurs connectés solaires.",
            domaine=self.domaine,
            cohorte=self.cohorte,
            porteur=porteur,
            statut=Projet.Statut.IDEE,
        )
        dossier = Dossier.objects.create(projet=projet)

        self.client.force_authenticate(user=porteur)

        # Vérification dossier incomplet -> refus de soumission 400
        res_soumis_incomplet = self.client.post(f"/api/incubator/dossiers/{dossier.id}/soumettre/")
        self.assertEqual(res_soumis_incomplet.status_code, status.HTTP_400_BAD_REQUEST)

        # Dépôt des 3 pièces obligatoires
        pieces = [
            ("fiche_projet", "fiche.pdf"),
            ("presentation_equipe", "equipe.pdf"),
            ("budget_previsionnel", "budget.pdf"),
        ]
        for type_piece, nom_fichier in pieces:
            pdf_dummy = SimpleUploadedFile(
                nom_fichier,
                b"%PDF-1.4\n1 0 obj<<>>endobj\ntrailer<<>>startxref\n0\n%%EOF",
                content_type="application/pdf",
            )
            res_piece = self.client.post(
                f"/api/incubator/dossiers/{dossier.id}/pieces/",
                {"type": type_piece, "nom": nom_fichier, "fichier": pdf_dummy},
                format="multipart",
            )
            self.assertEqual(res_piece.status_code, status.HTTP_201_CREATED)

        # Soumission officielle
        mail.outbox.clear()
        res_soumis = self.client.post(f"/api/incubator/dossiers/{dossier.id}/soumettre/")
        self.assertEqual(res_soumis.status_code, status.HTTP_200_OK)
        self.assertEqual(res_soumis.data["statut"], StatutDossier.SOUMIS)

        # Vérification email transactionnel de confirmation de soumission (T1)
        self.assertEqual(len(mail.outbox), 1)
        email_soumission = mail.outbox[0]
        self.assertIn("Confirmation de soumission", email_soumission.subject)
        self.assertIn(porteur.email, email_soumission.to)
        self.assertIn(f"/api/incubator/dossiers/{dossier.id}/accuse/", email_soumission.body)
        self.assertIn(f"CIAT-AR-{dossier.id:05d}", email_soumission.body)

    # ==========================================================================
    # Étape 3 : Accusé de réception officiel PDF
    # ==========================================================================
    def test_03_telechargement_accuse_reception_pdf(self):
        """Étape 3 : Téléchargement et intégrité de l'accusé de réception PDF officiel."""
        porteur = User.objects.create_user(
            email="porteur3@ciat.sn", password="Password123!", role=Role.PORTEUR
        )
        projet = Projet.objects.create(
            titre="Projet BioGaz",
            resume="Production de biogaz.",
            domaine=self.domaine,
            cohorte=self.cohorte,
            porteur=porteur,
            statut=Projet.Statut.DEPOSE,
        )
        dossier = Dossier.objects.create(
            projet=projet, statut=StatutDossier.SOUMIS, soumis_le=timezone.now()
        )

        # Porteur authentifié -> 200 OK et flux PDF valide
        self.client.force_authenticate(user=porteur)
        res_pdf = self.client.get(f"/api/incubator/dossiers/{dossier.id}/accuse/")
        self.assertEqual(res_pdf.status_code, status.HTTP_200_OK)
        self.assertEqual(res_pdf["Content-Type"], "application/pdf")
        self.assertTrue(res_pdf.content.startswith(b"%PDF-"))
        self.assertIn(b"%%EOF", res_pdf.content)

        # Contrôle RBAC : un intrus reçoit 403 Forbidden
        self.client.force_authenticate(user=self.intrus)
        res_interdit = self.client.get(f"/api/incubator/dossiers/{dossier.id}/accuse/")
        self.assertEqual(res_interdit.status_code, status.HTTP_403_FORBIDDEN)

    # ==========================================================================
    # Étape 4 : Évaluation par le comité
    # ==========================================================================
    def test_04_evaluation_dossier_par_comite(self):
        """Étape 4 : Notation et avis du membre du comité de sélection."""
        porteur = User.objects.create_user(
            email="porteur4@ciat.sn", password="Password123!", role=Role.PORTEUR
        )
        projet = Projet.objects.create(
            titre="Dépollution Fluviale",
            resume="Filtration biologique de l'eau.",
            domaine=self.domaine,
            cohorte=self.cohorte,
            porteur=porteur,
            statut=Projet.Statut.DEPOSE,
        )
        dossier = Dossier.objects.create(
            projet=projet, statut=StatutDossier.SOUMIS, soumis_le=timezone.now()
        )

        self.client.force_authenticate(user=self.comite)
        eval_payload = {
            "avis": "Dossier solide, bonne maîtrise technique.",
            "notes": [
                {"critere": self.critere1.id, "note": Decimal("18.00")},
                {"critere": self.critere2.id, "note": Decimal("16.00")},
            ],
        }
        res_eval = self.client.post(
            f"/api/incubator/dossiers/{dossier.id}/evaluations/",
            eval_payload,
            format="json",
        )
        self.assertEqual(res_eval.status_code, status.HTTP_201_CREATED)

        dossier.refresh_from_db()
        self.assertEqual(dossier.statut, StatutDossier.EN_EVALUATION)

    # ==========================================================================
    # Étape 5 : Décision officielle et Notification email avec motif
    # ==========================================================================
    def test_05_decision_officielle_et_email_avec_motif(self):
        """Étape 5 : Le coordonnateur enregistre une décision et le porteur reçoit l'email officiel."""
        porteur = User.objects.create_user(
            email="porteur5@ciat.sn",
            password="Password123!",
            first_name="Amina",
            last_name="Gueye",
            role=Role.PORTEUR,
        )
        projet = Projet.objects.create(
            titre="AgroDrone Sénégal",
            resume="Surveillance des cultures par drone.",
            domaine=self.domaine,
            cohorte=self.cohorte,
            porteur=porteur,
            statut=Projet.Statut.DEPOSE,
        )
        dossier = Dossier.objects.create(
            projet=projet, statut=StatutDossier.EN_EVALUATION, soumis_le=timezone.now()
        )

        mail.outbox.clear()
        self.client.force_authenticate(user=self.coordo)
        decision_payload = {
            "decision": "accepte",
            "motif": "Solution innovante et forte complémentarité de l'équipe fondatrice.",
        }
        res_decision = self.client.post(
            f"/api/incubator/dossiers/{dossier.id}/decision/",
            decision_payload,
            format="json",
        )
        self.assertEqual(res_decision.status_code, status.HTTP_201_CREATED)

        # Vérification mise à jour des statuts
        dossier.refresh_from_db()
        projet.refresh_from_db()
        self.assertEqual(dossier.statut, StatutDossier.ACCEPTE)
        self.assertEqual(projet.statut, Projet.Statut.SELECTIONNE)

        # Vérification de l'email transactionnel de décision (T1)
        self.assertEqual(len(mail.outbox), 1)
        email_decision = mail.outbox[0]
        self.assertIn("Décision du comité", email_decision.subject)
        self.assertIn(porteur.email, email_decision.to)
        self.assertIn("ACCEPTÉ", email_decision.body)
        self.assertIn("Solution innovante et forte complémentarité", email_decision.body)

    # ==========================================================================
    # Étape 6 : Affectation du mentor
    # ==========================================================================
    def test_06_affectation_mentor(self):
        """Étape 6 : Affectation d'un mentor référent au projet sélectionné."""
        porteur = User.objects.create_user(
            email="porteur6@ciat.sn", password="Password123!", role=Role.PORTEUR
        )
        projet = Projet.objects.create(
            titre="RoboAgri",
            resume="Robot de désherbage autonome.",
            domaine=self.domaine,
            cohorte=self.cohorte,
            porteur=porteur,
            statut=Projet.Statut.SELECTIONNE,
        )

        self.client.force_authenticate(user=self.coordo)
        res_mentor = self.client.post(
            f"/api/incubator/projets/{projet.id}/mentor/",
            {"mentor": self.mentor.id},
        )
        self.assertEqual(res_mentor.status_code, status.HTTP_200_OK)
        self.assertEqual(res_mentor.data["mentor"], self.mentor.id)

        affectation = AffectationMentor.objects.filter(projet=projet).first()
        self.assertIsNotNone(affectation)
        self.assertEqual(affectation.mentor, self.mentor)

    # ==========================================================================
    # Étape 7 : Jalon en retard, Commande CLI et Idempotence de l'alerte
    # ==========================================================================
    def test_07_jalon_en_retard_commande_alertes_et_idempotence(self):
        """Étape 7 : Détection de jalon en retard et envoi d'alerte email avec garantie d'idempotence."""
        porteur = User.objects.create_user(
            email="porteur7@ciat.sn",
            password="Password123!",
            first_name="Modou",
            last_name="Kane",
            role=Role.PORTEUR,
        )
        projet = Projet.objects.create(
            titre="Smart Poultry",
            resume="Gestion connectée d'aviculture.",
            domaine=self.domaine,
            cohorte=self.cohorte,
            porteur=porteur,
            statut=Projet.Statut.INCUBE,
        )
        AffectationMentor.objects.create(projet=projet, mentor=self.mentor, affecte_par=self.coordo)

        # Jalon en retard de 3 jours
        date_retard = timezone.now().date() - timedelta(days=3)
        jalon = Jalon.objects.create(
            projet=projet,
            titre="Conception du circuit imprimé",
            echeance=date_retard,
            statut=StatutJalon.A_FAIRE,
            cree_par=self.mentor,
        )

        mail.outbox.clear()
        # 1er passage de la commande CLI
        call_command("envoyer_alertes_retard")
        # Doit avoir envoyé 2 emails : 1 au porteur et 1 au mentor
        self.assertEqual(len(mail.outbox), 2)
        recipients = [m.to[0] for m in mail.outbox]
        self.assertIn(porteur.email, recipients)
        self.assertIn(self.mentor.email, recipients)
        self.assertIn("Alerte de retard", mail.outbox[0].subject)

        # Vérification des traces en base
        self.assertEqual(AlerteJalonEnvoyee.objects.filter(jalon=jalon).count(), 2)

        # 2ème passage immédiat -> Idempotence stricte : 0 nouvel email envoyé
        mail.outbox.clear()
        call_command("envoyer_alertes_retard")
        self.assertEqual(len(mail.outbox), 0)

    # ==========================================================================
    # Étape 8 : Export du Compte Rendu PDF & XLSX
    # ==========================================================================
    def test_08_export_compte_rendu_pdf_et_xlsx(self):
        """Étape 8 : Génération du compte rendu complet en PDF et Excel avec contrôle d'accès."""
        porteur = User.objects.create_user(
            email="porteur8@ciat.sn", password="Password123!", role=Role.PORTEUR
        )
        projet = Projet.objects.create(
            titre="Recyclage Plastique 3D",
            resume="Transformation des déchets plastiques en filaments.",
            domaine=self.domaine,
            cohorte=self.cohorte,
            porteur=porteur,
            statut=Projet.Statut.INCUBE,
        )
        AffectationMentor.objects.create(projet=projet, mentor=self.mentor, affecte_par=self.coordo)
        Objectif.objects.create(
            projet=projet,
            libelle="Valider la température d'extrusion",
            echeance=timezone.now().date() + timedelta(days=15),
            statut="en_cours",
            cree_par=self.mentor,
        )
        Jalon.objects.create(
            projet=projet,
            titre="Prototype extrudeuse v1",
            echeance=timezone.now().date() + timedelta(days=30),
            statut=StatutJalon.A_FAIRE,
            cree_par=self.mentor,
        )

        # Porteur demande le PDF -> 200 OK
        self.client.force_authenticate(user=porteur)
        res_pdf = self.client.get(f"/api/incubator/projets/{projet.id}/compte-rendu/?format=pdf")
        self.assertEqual(res_pdf.status_code, status.HTTP_200_OK)
        self.assertEqual(res_pdf["Content-Type"], "application/pdf")
        self.assertTrue(res_pdf.content.startswith(b"%PDF-"))

        # Porteur demande l'Excel -> 200 OK
        res_xlsx = self.client.get(f"/api/incubator/projets/{projet.id}/compte-rendu/?format=xlsx")
        self.assertEqual(res_xlsx.status_code, status.HTTP_200_OK)

        # Format invalide -> 400 Bad Request
        res_bad = self.client.get(f"/api/incubator/projets/{projet.id}/compte-rendu/?format=csv")
        self.assertEqual(res_bad.status_code, status.HTTP_400_BAD_REQUEST)

        # Utilisateur non autorisé -> 403 Forbidden
        self.client.force_authenticate(user=self.intrus)
        res_forbidden = self.client.get(f"/api/incubator/projets/{projet.id}/compte-rendu/?format=pdf")
        self.assertEqual(res_forbidden.status_code, status.HTTP_403_FORBIDDEN)

    # ==========================================================================
    # Parcours Complet Enchaîné (Cycle intégral de bout en bout en 1 seul flux)
    # ==========================================================================
    def test_09_parcours_complet_e2e_enchaine(self):
        """Parcours complet enchaîné validant l'ensemble du cycle de vie sans discontinuité."""
        # 1. Inscription du porteur
        email_porteur = "mariama.sy@e2e-ciat.sn"
        res_reg = self.client.post("/api/auth/register/", {
            "email": email_porteur,
            "password": "MariamaPass2026!",
            "first_name": "Mariama",
            "last_name": "Sy",
            "telephone": "+221701112233",
            "organisation": "Sy Agrobusiness",
            "genre": "F",
        })
        self.assertEqual(res_reg.status_code, status.HTTP_201_CREATED)
        porteur = User.objects.get(email=email_porteur)

        # 2. Authentification JWT
        res_token = self.client.post("/api/auth/token/", {
            "email": email_porteur,
            "password": "MariamaPass2026!",
        })
        self.assertEqual(res_token.status_code, status.HTTP_200_OK)
        token = res_token.data["access"]
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {token}")

        # 3. Création du projet
        res_projet = self.client.post("/api/projets/", {
            "titre": "Transformation Mangues Locales",
            "resume": "Unité mobile de séchage solaire de mangues.",
            "probleme": "Pertes post-récolte massives en Casamance.",
            "solution": "Séchoir mobile solaire hybride à haut rendement.",
            "domaine": self.domaine.id,
            "cohorte": self.cohorte.id,
        })
        self.assertEqual(res_projet.status_code, status.HTTP_201_CREATED)
        projet_id = res_projet.data["id"]

        # 4. Création du dossier et dépôt des pièces
        res_dossier = self.client.post("/api/incubator/dossiers/", {"projet": projet_id})
        self.assertEqual(res_dossier.status_code, status.HTTP_201_CREATED)
        dossier_id = res_dossier.data["id"]

        for type_piece, nom in [
            ("fiche_projet", "fiche.pdf"),
            ("presentation_equipe", "equipe.pdf"),
            ("budget_previsionnel", "budget.pdf"),
        ]:
            f = SimpleUploadedFile(nom, b"%PDF-1.4\n1 0 obj<<>>endobj\ntrailer<<>>startxref\n0\n%%EOF", content_type="application/pdf")
            r = self.client.post(f"/api/incubator/dossiers/{dossier_id}/pieces/", {"type": type_piece, "nom": nom, "fichier": f}, format="multipart")
            self.assertEqual(r.status_code, status.HTTP_201_CREATED)

        # 5. Soumission du dossier et email de confirmation (T1)
        mail.outbox.clear()
        res_sub = self.client.post(f"/api/incubator/dossiers/{dossier_id}/soumettre/")
        self.assertEqual(res_sub.status_code, status.HTTP_200_OK)
        self.assertEqual(len(mail.outbox), 1)
        self.assertIn("Confirmation de soumission", mail.outbox[0].subject)
        self.assertIn(f"/api/incubator/dossiers/{dossier_id}/accuse/", mail.outbox[0].body)

        # 6. Téléchargement accusé de réception officiel PDF
        res_accuse = self.client.get(f"/api/incubator/dossiers/{dossier_id}/accuse/")
        self.assertEqual(res_accuse.status_code, status.HTTP_200_OK)
        self.assertEqual(res_accuse["Content-Type"], "application/pdf")
        self.assertTrue(res_accuse.content.startswith(b"%PDF-"))

        # 7. Évaluation par le comité
        self.client.force_authenticate(user=self.comite)
        res_eval = self.client.post(f"/api/incubator/dossiers/{dossier_id}/evaluations/", {
            "avis": "Projet très pertinent pour la Casamance.",
            "notes": [
                {"critere": self.critere1.id, "note": Decimal("19.00")},
                {"critere": self.critere2.id, "note": Decimal("18.50")},
            ],
        }, format="json")
        self.assertEqual(res_eval.status_code, status.HTTP_201_CREATED)

        # 8. Décision officielle et email au porteur (T1)
        mail.outbox.clear()
        self.client.force_authenticate(user=self.coordo)
        res_dec = self.client.post(f"/api/incubator/dossiers/{dossier_id}/decision/", {
            "decision": "accepte",
            "motif": "Impact économique régional exceptionnel.",
        }, format="json")
        self.assertEqual(res_dec.status_code, status.HTTP_201_CREATED)
        self.assertEqual(len(mail.outbox), 1)
        self.assertIn("ACCEPTÉ", mail.outbox[0].body)
        self.assertIn("Impact économique régional exceptionnel", mail.outbox[0].body)

        # 9. Affectation du mentor
        res_ment = self.client.post(f"/api/incubator/projets/{projet_id}/mentor/", {"mentor": self.mentor.id})
        self.assertEqual(res_ment.status_code, status.HTTP_200_OK)

        # 10. Jalon en retard et commande d'alertes
        projet = Projet.objects.get(id=projet_id)
        jalon = Jalon.objects.create(
            projet=projet,
            titre="Plans techniques séchoir v1",
            echeance=timezone.now().date() - timedelta(days=2),
            statut=StatutJalon.A_FAIRE,
            cree_par=self.mentor,
        )
        mail.outbox.clear()
        call_command("envoyer_alertes_retard")
        self.assertEqual(len(mail.outbox), 2)  # Porteur + Mentor

        # 11. Compte rendu PDF officiel
        self.client.force_authenticate(user=porteur)
        res_cr = self.client.get(f"/api/incubator/projets/{projet_id}/compte-rendu/?format=pdf")
        self.assertEqual(res_cr.status_code, status.HTTP_200_OK)
        self.assertEqual(res_cr["Content-Type"], "application/pdf")
        self.assertTrue(res_cr.content.startswith(b"%PDF-"))
