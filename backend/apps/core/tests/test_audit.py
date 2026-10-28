"""Tests du Journal d'Audit des actions sensibles (Phase 8 - T1)."""
from django.test import TestCase, override_settings
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APIClient

from apps.core.models import Domaine, JournalAudit, Projet, Role, User
from apps.core.services import (
    enregistrer_audit,
    nettoyer_donnees_sensibles,
)
from apps.documents.models import Document, TypeDocument
from apps.gallery.models import FicheInnovation
from apps.incubator.models import Dossier

FAST_HASHERS = ["django.contrib.auth.hashers.MD5PasswordHasher"]


@override_settings(
    PASSWORD_HASHERS=FAST_HASHERS,
    DISABLE_THROTTLING="1",
)
class JournalAuditEndpointTests(TestCase):
    """Vérification des droits d'accès et des filtres de GET /api/audit/."""

    @classmethod
    def setUpTestData(cls):
        cls.admin = User.objects.create_user(
            email="admin.audit@ciat.sn",
            password="Password123!",
            role=Role.ADMIN,
            first_name="Admin",
            last_name="CIAT",
        )
        cls.coordo = User.objects.create_user(
            email="coordo.audit@ciat.sn",
            password="Password123!",
            role=Role.COORDONNATEUR,
            first_name="Coordo",
            last_name="CIAT",
        )
        cls.porteur = User.objects.create_user(
            email="porteur.audit@ciat.sn",
            password="Password123!",
            role=Role.PORTEUR,
            first_name="Porteur",
            last_name="Audit",
        )
        cls.mentor = User.objects.create_user(
            email="mentor.audit@ciat.sn",
            password="Password123!",
            role=Role.MENTOR,
            first_name="Mentor",
            last_name="Audit",
        )

        enregistrer_audit(
            acteur=cls.admin,
            action="decision_dossier",
            objet="Dossier #1 (Projet Solaire)",
            avant={"statut": "depose"},
            apres={"statut": "accepte", "decision": "accepte"},
        )
        enregistrer_audit(
            acteur=cls.coordo,
            action="affectation_mentor",
            objet="Projet #1 (Projet Solaire)",
            avant={},
            apres={"mentor_id": cls.mentor.id, "mentor_nom": "Mentor Audit"},
        )

    def setUp(self):
        self.client = APIClient()

    def test_acces_non_authentifie_refuse_401(self):
        resp = self.client.get("/api/audit/")
        self.assertEqual(resp.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_acces_porteur_et_mentor_refuse_403(self):
        for user in (self.porteur, self.mentor):
            self.client.force_authenticate(user=user)
            resp = self.client.get("/api/audit/")
            self.assertEqual(resp.status_code, status.HTTP_403_FORBIDDEN)

    def test_acces_admin_et_coordonnateur_autorise_200(self):
        for user in (self.admin, self.coordo):
            self.client.force_authenticate(user=user)
            resp = self.client.get("/api/audit/")
            self.assertEqual(resp.status_code, status.HTTP_200_OK)
            self.assertIn("results", resp.data)
            self.assertEqual(resp.data["count"], 2)

    def test_filtrage_par_action(self):
        self.client.force_authenticate(user=self.admin)
        resp = self.client.get("/api/audit/?action=decision_dossier")
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.assertEqual(resp.data["count"], 1)
        self.assertEqual(resp.data["results"][0]["action"], "decision_dossier")

    def test_filtrage_par_acteur(self):
        self.client.force_authenticate(user=self.admin)
        # Filtre par ID
        resp_id = self.client.get(f"/api/audit/?acteur={self.coordo.id}")
        self.assertEqual(resp_id.status_code, status.HTTP_200_OK)
        self.assertEqual(resp_id.data["count"], 1)
        self.assertEqual(resp_id.data["results"][0]["action"], "affectation_mentor")

        # Filtre par email partiel
        resp_email = self.client.get("/api/audit/?acteur=coordo.audit")
        self.assertEqual(resp_email.status_code, status.HTTP_200_OK)
        self.assertEqual(resp_email.data["count"], 1)

    def test_filtrage_par_date(self):
        self.client.force_authenticate(user=self.admin)
        today_str = timezone.now().date().isoformat()
        resp = self.client.get(f"/api/audit/?date={today_str}")
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.assertEqual(resp.data["count"], 2)

        resp_old = self.client.get("/api/audit/?date=2020-01-01")
        self.assertEqual(resp_old.status_code, status.HTTP_200_OK)
        self.assertEqual(resp_old.data["count"], 0)

    def test_nettoyage_donnees_sensibles(self):
        donnees = {
            "password": "SecretPassword123!",
            "token": "eyJhbGciOiJIUzI1Ni...",
            "refresh": "refresh_token_123",
            "statut": "publie",
            "nested": {
                "mot_de_passe": "autre_secret",
                "valeur": 42,
            },
        }
        nettoye = nettoyer_donnees_sensibles(donnees)
        self.assertNotIn("password", nettoye)
        self.assertNotIn("token", nettoye)
        self.assertNotIn("refresh", nettoye)
        self.assertNotIn("mot_de_passe", nettoye["nested"])
        self.assertEqual(nettoye["statut"], "publie")
        self.assertEqual(nettoye["nested"]["valeur"], 42)


@override_settings(
    PASSWORD_HASHERS=FAST_HASHERS,
    DISABLE_THROTTLING="1",
)
class JournalAuditActionsTracesTests(TestCase):
    """Vérifie que chaque action sensible requise laisse une trace testée."""

    @classmethod
    def setUpTestData(cls):
        cls.admin = User.objects.create_user(
            email="admin.actions@ciat.sn",
            password="Password123!",
            role=Role.ADMIN,
        )
        cls.coordo = User.objects.create_user(
            email="coordo.actions@ciat.sn",
            password="Password123!",
            role=Role.COORDONNATEUR,
        )
        cls.porteur = User.objects.create_user(
            email="porteur.actions@ciat.sn",
            password="Password123!",
            role=Role.PORTEUR,
        )
        cls.mentor = User.objects.create_user(
            email="mentor.actions@ciat.sn",
            password="Password123!",
            role=Role.MENTOR,
        )
        cls.domaine = Domaine.objects.create(nom="AgriTech Audit")
        cls.projet = Projet.objects.create(
            titre="Système d'irrigation solaire",
            domaine=cls.domaine,
            porteur=cls.porteur,
        )

    def setUp(self):
        self.client = APIClient()

    def test_01_trace_decision_dossier(self):
        from apps.incubator.models import StatutDossier
        dossier = Dossier.objects.create(
            projet=self.projet,
            statut=StatutDossier.SOUMIS,
        )
        self.client.force_authenticate(user=self.admin)
        resp = self.client.post(
            f"/api/incubator/dossiers/{dossier.id}/decision/",
            {"decision": "accepte", "motif": "Dossier conforme et prometteur."},
            format="json",
        )
        self.assertEqual(resp.status_code, status.HTTP_201_CREATED)

        trace = JournalAudit.objects.filter(action="decision_dossier").first()
        self.assertIsNotNone(trace)
        self.assertEqual(trace.acteur, self.admin)
        self.assertIn("Dossier", trace.objet)
        self.assertEqual(trace.apres.get("decision"), "accepte")

    def test_02_trace_affectation_mentor(self):
        self.client.force_authenticate(user=self.coordo)
        resp = self.client.post(
            f"/api/incubator/projets/{self.projet.id}/mentor/",
            {"mentor": self.mentor.id},
            format="json",
        )
        self.assertEqual(resp.status_code, status.HTTP_200_OK)

        trace = JournalAudit.objects.filter(action="affectation_mentor").first()
        self.assertIsNotNone(trace)
        self.assertEqual(trace.acteur, self.coordo)
        self.assertEqual(trace.apres.get("mentor_id"), self.mentor.id)

    def test_03_trace_validation_et_publication_document(self):
        from apps.documents.models import ModeleDocument
        type_doc = TypeDocument.objects.create(code="CONV_AUDIT", nom="Convention Audit")
        modele_doc = ModeleDocument.objects.create(type=type_doc, nom="Gabarit Standard")
        doc = Document.objects.create(
            modele=modele_doc,
            titre="Convention d'incubation",
            sujet="Cadrage de l'incubation",
            auteur=self.porteur,
            projet=self.projet,
            statut=Document.Statut.BROUILLON,
        )

        # Validation
        self.client.force_authenticate(user=self.coordo)
        resp_val = self.client.post(f"/api/documents/{doc.id}/valider/")
        self.assertEqual(resp_val.status_code, status.HTTP_200_OK)

        trace_val = JournalAudit.objects.filter(action="validation_document").first()
        self.assertIsNotNone(trace_val)
        self.assertEqual(trace_val.acteur, self.coordo)
        self.assertEqual(trace_val.apres.get("statut"), "valide")

        # Publication
        self.client.force_authenticate(user=self.admin)
        resp_pub = self.client.post(f"/api/documents/{doc.id}/publier/")
        self.assertEqual(resp_pub.status_code, status.HTTP_200_OK)

        trace_pub = JournalAudit.objects.filter(action="publication_document").first()
        self.assertIsNotNone(trace_pub)
        self.assertEqual(trace_pub.acteur, self.admin)
        self.assertEqual(trace_pub.apres.get("statut"), "publie")

    def test_04_trace_validation_et_refus_fiche_galerie(self):
        fiche1 = FicheInnovation.objects.create(
            projet=self.projet,
            titre="Fiche Innovation 1",
            probleme="Manque d'eau",
            solution="Pompage solaire",
            equipe="Équipe Solaire",
            avancement="Prototype",
            statut=FicheInnovation.Statut.BROUILLON,
        )
        fiche2 = FicheInnovation.objects.create(
            projet=self.projet,
            titre="Fiche Innovation 2",
            probleme="Gestion des sols",
            solution="Biofertilisants",
            equipe="Équipe Bio",
            avancement="Prototype",
            statut=FicheInnovation.Statut.BROUILLON,
        )

        # Validation fiche 1
        self.client.force_authenticate(user=self.coordo)
        resp_val = self.client.post(f"/api/gallery/fiches/{fiche1.id}/valider/")
        self.assertEqual(resp_val.status_code, status.HTTP_200_OK)

        trace_val = JournalAudit.objects.filter(action="validation_fiche_galerie").first()
        self.assertIsNotNone(trace_val)
        self.assertEqual(trace_val.acteur, self.coordo)
        self.assertEqual(trace_val.apres.get("statut"), "publie")

        # Refus fiche 2
        resp_ref = self.client.post(f"/api/gallery/fiches/{fiche2.id}/refuser/")
        self.assertEqual(resp_ref.status_code, status.HTTP_200_OK)

        trace_ref = JournalAudit.objects.filter(action="refus_fiche_galerie").first()
        self.assertIsNotNone(trace_ref)
        self.assertEqual(trace_ref.acteur, self.coordo)
        self.assertEqual(trace_ref.apres.get("statut"), "refuse")

    def test_05_trace_changement_role_utilisateur(self):
        user_test = User.objects.create_user(
            email="candidat@ciat.sn",
            password="Password123!",
            role=Role.PORTEUR,
        )
        self.client.force_authenticate(user=self.admin)
        resp = self.client.patch(
            f"/api/users/{user_test.id}/role/",
            {"role": Role.MENTOR},
            format="json",
        )
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        user_test.refresh_from_db()
        self.assertEqual(user_test.role, Role.MENTOR)

        trace = JournalAudit.objects.filter(action="changement_role_utilisateur").first()
        self.assertIsNotNone(trace)
        self.assertEqual(trace.acteur, self.admin)
        self.assertEqual(trace.avant.get("role"), Role.PORTEUR)
        self.assertEqual(trace.apres.get("role"), Role.MENTOR)
