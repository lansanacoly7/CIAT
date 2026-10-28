"""Tests des Notifications dans l'application (Phase 8 - T2)."""
from datetime import timedelta

from django.test import TestCase, override_settings
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APIClient

from apps.core.models import Domaine, Notification, Projet, Role, User
from apps.core.services import creer_notification
from apps.documents.models import Document, TypeDocument
from apps.gallery.models import FicheInnovation
from apps.incubator.models import Dossier, Jalon
from apps.incubator.notifications import envoyer_alertes_jalons_en_retard

FAST_HASHERS = ["django.contrib.auth.hashers.MD5PasswordHasher"]


@override_settings(
    PASSWORD_HASHERS=FAST_HASHERS,
    DISABLE_THROTTLING="1",
)
class NotificationEndpointsTests(TestCase):
    """Vérification des routes API des notifications et de l'isolation par utilisateur."""

    @classmethod
    def setUpTestData(cls):
        cls.user1 = User.objects.create_user(
            email="user1.notif@ciat.sn",
            password="Password123!",
            role=Role.PORTEUR,
        )
        cls.user2 = User.objects.create_user(
            email="user2.notif@ciat.sn",
            password="Password123!",
            role=Role.PORTEUR,
        )

    def setUp(self):
        self.client = APIClient()
        self.notif1 = creer_notification(
            destinataire=self.user1,
            type=Notification.Type.DECISION_DOSSIER,
            message="Votre dossier a été accepté.",
            lien="/incubateur/dossier",
        )
        self.notif2 = creer_notification(
            destinataire=self.user1,
            type=Notification.Type.DOCUMENT_VALIDE,
            message="Votre document est validé.",
            lien="/documents/1",
        )
        self.notif_autre = creer_notification(
            destinataire=self.user2,
            type=Notification.Type.FICHE_VALIDEE,
            message="Fiche de l'autre utilisateur validée.",
            lien="/galerie/fiche-2",
        )

    def test_acces_non_authentifie_refuse_401(self):
        resp = self.client.get("/api/notifications/")
        self.assertEqual(resp.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_utilisateur_ne_voit_que_ses_propres_notifications(self):
        self.client.force_authenticate(user=self.user1)
        resp = self.client.get("/api/notifications/")
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.assertEqual(resp.data["count"], 2)
        ids = [item["id"] for item in resp.data["results"]]
        self.assertIn(self.notif1.id, ids)
        self.assertIn(self.notif2.id, ids)
        self.assertNotIn(self.notif_autre.id, ids)

    def test_filtre_notifications_non_lues(self):
        self.client.force_authenticate(user=self.user1)
        # Marquer notif1 comme lue directement
        self.notif1.lue = True
        self.notif1.save()

        # Sans filtre : 2 notifications
        resp_all = self.client.get("/api/notifications/")
        self.assertEqual(resp_all.data["count"], 2)

        # Avec ?non_lues=1 : seulement notif2
        resp_unread = self.client.get("/api/notifications/?non_lues=1")
        self.assertEqual(resp_unread.data["count"], 1)
        self.assertEqual(resp_unread.data["results"][0]["id"], self.notif2.id)

    def test_marquer_une_notification_comme_lue(self):
        self.client.force_authenticate(user=self.user1)
        resp = self.client.post(f"/api/notifications/{self.notif1.id}/lue/")
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.assertTrue(resp.data["lue"])

        self.notif1.refresh_from_db()
        self.assertTrue(self.notif1.lue)

    def test_impossible_de_marquer_la_notification_d_un_tiers_404(self):
        self.client.force_authenticate(user=self.user1)
        resp = self.client.post(f"/api/notifications/{self.notif_autre.id}/lue/")
        self.assertEqual(resp.status_code, status.HTTP_404_NOT_FOUND)

        self.notif_autre.refresh_from_db()
        self.assertFalse(self.notif_autre.lue)

    def test_tout_marquer_comme_lu(self):
        self.client.force_authenticate(user=self.user1)
        resp = self.client.post("/api/notifications/tout-lire/")
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.assertEqual(resp.data["modifiees"], 2)

        self.notif1.refresh_from_db()
        self.notif2.refresh_from_db()
        self.assertTrue(self.notif1.lue)
        self.assertTrue(self.notif2.lue)

        # La notification de user2 ne doit pas avoir été modifiée
        self.notif_autre.refresh_from_db()
        self.assertFalse(self.notif_autre.lue)


@override_settings(
    PASSWORD_HASHERS=FAST_HASHERS,
    DISABLE_THROTTLING="1",
)
class NotificationEvenementsTracesTests(TestCase):
    """Vérifie que chaque événement requis génère la notification appropriée pour le bon destinataire."""

    @classmethod
    def setUpTestData(cls):
        cls.admin = User.objects.create_user(
            email="admin.notifev@ciat.sn",
            password="Password123!",
            role=Role.ADMIN,
        )
        cls.coordo = User.objects.create_user(
            email="coordo.notifev@ciat.sn",
            password="Password123!",
            role=Role.COORDONNATEUR,
        )
        cls.porteur = User.objects.create_user(
            email="porteur.notifev@ciat.sn",
            password="Password123!",
            role=Role.PORTEUR,
            first_name="Amadou",
            last_name="Ba",
        )
        cls.mentor = User.objects.create_user(
            email="mentor.notifev@ciat.sn",
            password="Password123!",
            role=Role.MENTOR,
            first_name="Fatou",
            last_name="Diop",
        )
        cls.domaine = Domaine.objects.create(nom="Biotech Notif")
        cls.projet = Projet.objects.create(
            titre="Vaccin Avicole Innovant",
            domaine=cls.domaine,
            porteur=cls.porteur,
        )

    def setUp(self):
        self.client = APIClient()

    def test_01_evenement_decision_dossier_cree_notification(self):
        from apps.incubator.models import StatutDossier
        dossier = Dossier.objects.create(
            projet=self.projet,
            statut=StatutDossier.SOUMIS,
        )
        self.client.force_authenticate(user=self.admin)
        resp = self.client.post(
            f"/api/incubator/dossiers/{dossier.id}/decision/",
            {"decision": "accepte", "motif": "Excellent dossier technique."},
            format="json",
        )
        self.assertEqual(resp.status_code, status.HTTP_201_CREATED)

        notif = Notification.objects.filter(
            destinataire=self.porteur,
            type=Notification.Type.DECISION_DOSSIER,
        ).first()
        self.assertIsNotNone(notif)
        self.assertIn("décision", notif.message.lower())
        self.assertFalse(notif.lue)

    def test_02_evenement_affectation_mentor_cree_notifications(self):
        self.client.force_authenticate(user=self.coordo)
        resp = self.client.post(
            f"/api/incubator/projets/{self.projet.id}/mentor/",
            {"mentor": self.mentor.id},
            format="json",
        )
        self.assertEqual(resp.status_code, status.HTTP_200_OK)

        # Notification pour le porteur
        notif_porteur = Notification.objects.filter(
            destinataire=self.porteur,
            type=Notification.Type.MENTOR_AFFECTE,
        ).first()
        self.assertIsNotNone(notif_porteur)
        self.assertIn("mentor", notif_porteur.message.lower())

        # Notification pour le mentor
        notif_mentor = Notification.objects.filter(
            destinataire=self.mentor,
            type=Notification.Type.MENTOR_AFFECTE,
        ).first()
        self.assertIsNotNone(notif_mentor)
        self.assertIn("mentor", notif_mentor.message.lower())

    def test_03_evenement_validation_et_publication_document_cree_notifications(self):
        from apps.documents.models import ModeleDocument
        type_doc = TypeDocument.objects.create(code="NOTE_NOTIF", nom="Note Stratégique")
        modele_doc = ModeleDocument.objects.create(type=type_doc, nom="Gabarit Note")
        doc = Document.objects.create(
            modele=modele_doc,
            titre="Note de cadrage",
            sujet="Sujet de cadrage",
            auteur=self.porteur,
            projet=self.projet,
            statut=Document.Statut.BROUILLON,
        )

        # Validation
        self.client.force_authenticate(user=self.coordo)
        resp_val = self.client.post(f"/api/documents/{doc.id}/valider/")
        self.assertEqual(resp_val.status_code, status.HTTP_200_OK)

        notif_val = Notification.objects.filter(
            destinataire=self.porteur,
            type=Notification.Type.DOCUMENT_VALIDE,
        ).first()
        self.assertIsNotNone(notif_val)
        self.assertIn("validé", notif_val.message.lower())

        # Publication
        self.client.force_authenticate(user=self.admin)
        resp_pub = self.client.post(f"/api/documents/{doc.id}/publier/")
        self.assertEqual(resp_pub.status_code, status.HTTP_200_OK)

        notif_pub = Notification.objects.filter(
            destinataire=self.porteur,
            type=Notification.Type.DOCUMENT_PUBLIE,
        ).first()
        self.assertIsNotNone(notif_pub)
        self.assertIn("publié", notif_pub.message.lower())

    def test_04_evenement_validation_et_refus_fiche_galerie_cree_notifications(self):
        fiche1 = FicheInnovation.objects.create(
            projet=self.projet,
            titre="Solution Solaire",
            probleme="Énergie coûteuse",
            solution="Panneaux hybrides",
            equipe="Team Tech",
            avancement="MVP",
            statut=FicheInnovation.Statut.BROUILLON,
        )
        fiche2 = FicheInnovation.objects.create(
            projet=self.projet,
            titre="Solution Eolienne",
            probleme="Vent non exploité",
            solution="Micro-éoliennes",
            equipe="Team Tech",
            avancement="MVP",
            statut=FicheInnovation.Statut.BROUILLON,
        )

        self.client.force_authenticate(user=self.coordo)
        # Validation
        resp_val = self.client.post(f"/api/gallery/fiches/{fiche1.id}/valider/")
        self.assertEqual(resp_val.status_code, status.HTTP_200_OK)

        notif_val = Notification.objects.filter(
            destinataire=self.porteur,
            type=Notification.Type.FICHE_VALIDEE,
        ).first()
        self.assertIsNotNone(notif_val)
        self.assertIn("validée", notif_val.message.lower())

        # Refus
        resp_ref = self.client.post(f"/api/gallery/fiches/{fiche2.id}/refuser/")
        self.assertEqual(resp_ref.status_code, status.HTTP_200_OK)

        notif_ref = Notification.objects.filter(
            destinataire=self.porteur,
            type=Notification.Type.FICHE_REFUSEE,
        ).first()
        self.assertIsNotNone(notif_ref)
        self.assertIn("refusée", notif_ref.message.lower())

    def test_05_evenement_jalon_en_retard_cree_notification(self):
        from apps.incubator.models import AffectationMentor, StatutJalon
        AffectationMentor.objects.create(
            projet=self.projet,
            mentor=self.mentor,
            affecte_par=self.coordo,
        )
        jalon = Jalon.objects.create(
            projet=self.projet,
            titre="Jalon Critique",
            echeance=timezone.now().date() - timedelta(days=5),
            statut=StatutJalon.A_FAIRE,
            cree_par=self.coordo,
        )

        res = envoyer_alertes_jalons_en_retard(today=timezone.now().date())
        self.assertGreaterEqual(res["alertes_envoyees"], 1)

        # Vérification notification porteur
        notif_porteur = Notification.objects.filter(
            destinataire=self.porteur,
            type=Notification.Type.JALON_RETARD,
        ).first()
        self.assertIsNotNone(notif_porteur)
        self.assertIn("retard", notif_porteur.message.lower())

        # Vérification notification mentor
        notif_mentor = Notification.objects.filter(
            destinataire=self.mentor,
            type=Notification.Type.JALON_RETARD,
        ).first()
        self.assertIsNotNone(notif_mentor)
        self.assertIn("retard", notif_mentor.message.lower())
