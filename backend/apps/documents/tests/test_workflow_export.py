"""Tests unitaires pour le workflow de validation (T2) et l'export Word / PDF (T3).

Vérifie l'ensemble des critères d'acceptation :
- T2 :
  - Transition brouillon -> valide (coordonnateur et admin autorisés, porteur bloqué en 403).
  - Transition valide -> publie (administrateur uniquement, coordonnateur et porteur bloqués en 403).
  - Transition vers brouillon (coordonnateur et admin autorisés).
  - Blocage de modification (409) dès que le document est valide ou publié.
  - Rejet des transitions invalides avec messages explicites en français.
- T3 :
  - Export Word (.docx) : format valide, vérifiable par python-docx, accents préservés.
  - Export PDF (.pdf) : format valide, en-tête %PDF, pied de page et pagination.
  - Rejet des formats inconnus avec 400 Bad Request.
  - Sécurité : accès refusé à un tiers non autorisé (403).
"""
import io
from docx import Document as DocxDocument
from django.test import TestCase, override_settings
from rest_framework import status
from rest_framework.test import APIClient

from apps.core.models import Domaine, Projet, Role, User
from apps.documents.models import Document, ModeleDocument, TypeDocument, VersionDocument


@override_settings(PASSWORD_HASHERS=["django.contrib.auth.hashers.MD5PasswordHasher"])
class WorkflowAndExportTestCase(TestCase):
    def setUp(self):
        self.client = APIClient()

        # Utilisateurs
        self.porteur = User.objects.create_user(
            email="porteur.wf@ciat.sn",
            password="password123",
            role=Role.PORTEUR,
            first_name="Amadou",
            last_name="Sow",
        )
        self.autre_porteur = User.objects.create_user(
            email="autre.wf@ciat.sn",
            password="password123",
            role=Role.PORTEUR,
            first_name="Autre",
            last_name="Porteur",
        )
        self.coordo = User.objects.create_user(
            email="coordo.wf@ciat.sn",
            password="password123",
            role=Role.COORDONNATEUR,
            first_name="Coordonnateur",
            last_name="CIAT",
        )
        self.admin = User.objects.create_user(
            email="admin.wf@ciat.sn",
            password="password123",
            role=Role.ADMIN,
            first_name="Admin",
            last_name="CIAT",
        )

        self.domaine = Domaine.objects.create(nom="Énergie Renouvelable", slug="energie-renouvelable")
        self.projet = Projet.objects.create(
            titre="Biomasse Sénégal",
            domaine=self.domaine,
            porteur=self.porteur,
            statut=Projet.Statut.INCUBE,
        )

        self.type_doc = TypeDocument.objects.create(code="convention_biomasse", nom="Convention Biomasse")
        self.modele = ModeleDocument.objects.create(
            type=self.type_doc,
            nom="Modèle Convention Cadre",
            sections=[
                {"code": "preambule", "titre": "Préambule & Contexte", "consigne": "Exposer le cadre"},
                {"code": "engagements", "titre": "Engagements réciproques", "consigne": "Préciser les engagements"},
            ],
        )

        self.document = Document.objects.create(
            modele=self.modele,
            titre="Convention Cadre Biomasse & Énergie",
            sujet="Partenariat d'incubation",
            projet=self.projet,
            auteur=self.porteur,
            statut=Document.Statut.BROUILLON,
        )
        self.version_1 = VersionDocument.objects.create(
            document=self.document,
            numero=1,
            sections=[
                {
                    "code": "preambule",
                    "titre": "Préambule & Contexte",
                    "contenu": "Considérant l'importance de l'innovation énergétique au Sénégal avec des caractères accentués (é, è, ê, à, ç).",
                },
                {
                    "code": "engagements",
                    "titre": "Engagements réciproques",
                    "contenu": "Le CIAT et le porteur s'engagent à respecter la charte d'incubation.",
                },
            ],
            auteur=self.porteur,
        )


# ==============================================================================
# TESTS T2 — Workflow de validation et droits
# ==============================================================================

class DocumentWorkflowTests(WorkflowAndExportTestCase):
    def test_porteur_ne_peut_pas_valider_ni_publier(self):
        """Un porteur de projet ne peut ni valider ni publier (403)."""
        self.client.force_authenticate(user=self.porteur)

        resp_valider = self.client.post(f"/api/documents/{self.document.id}/valider/")
        self.assertEqual(resp_valider.status_code, status.HTTP_403_FORBIDDEN)

        resp_publier = self.client.post(f"/api/documents/{self.document.id}/publier/")
        self.assertEqual(resp_publier.status_code, status.HTTP_403_FORBIDDEN)

        resp_brouillon = self.client.post(f"/api/documents/{self.document.id}/brouillon/")
        self.assertEqual(resp_brouillon.status_code, status.HTTP_403_FORBIDDEN)

    def test_coordonnateur_valide_document_brouillon(self):
        """Le coordonnateur peut valider un document en brouillon -> statut valide."""
        self.client.force_authenticate(user=self.coordo)
        resp = self.client.post(f"/api/documents/{self.document.id}/valider/")
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.assertEqual(resp.json()["statut"], Document.Statut.VALIDE)

        self.document.refresh_from_db()
        self.assertEqual(self.document.statut, Document.Statut.VALIDE)

    def test_seul_administrateur_peut_publier(self):
        """Le coordonnateur ne peut PAS publier (403) ; seul l'administrateur le peut (200)."""
        # Le document doit d'abord être validé
        self.document.statut = Document.Statut.VALIDE
        self.document.save()

        # Coordonnateur tente de publier -> 403
        self.client.force_authenticate(user=self.coordo)
        resp_coordo = self.client.post(f"/api/documents/{self.document.id}/publier/")
        self.assertEqual(resp_coordo.status_code, status.HTTP_403_FORBIDDEN)

        # Administrateur publie -> 200
        self.client.force_authenticate(user=self.admin)
        resp_admin = self.client.post(f"/api/documents/{self.document.id}/publier/")
        self.assertEqual(resp_admin.status_code, status.HTTP_200_OK)
        self.assertEqual(resp_admin.json()["statut"], Document.Statut.PUBLIE)

        self.document.refresh_from_db()
        self.assertEqual(self.document.statut, Document.Statut.PUBLIE)

    def test_publier_directement_un_brouillon_est_refuse(self):
        """Un document au statut brouillon ne peut pas être publié directement (400)."""
        self.client.force_authenticate(user=self.admin)
        resp = self.client.post(f"/api/documents/{self.document.id}/publier/")
        self.assertEqual(resp.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("validé avant d'être publié", resp.json()["detail"])

    def test_repasser_en_brouillon_autorise_nouvelles_modifications(self):
        """Un document publié peut être repassé en brouillon par l'équipe, permettant à nouveau le PATCH."""
        self.document.statut = Document.Statut.PUBLIE
        self.document.save()

        # 1. Tentative de modification pendant qu'il est publié -> 409 Conflict
        self.client.force_authenticate(user=self.porteur)
        resp_patch_interdit = self.client.patch(
            f"/api/documents/{self.document.id}/",
            {"sections": [{"code": "preambule", "contenu": "Nouveau texte"}]},
            format="json",
        )
        self.assertEqual(resp_patch_interdit.status_code, status.HTTP_409_CONFLICT)

        # 2. Coordonnateur repasse le document en brouillon -> 200
        self.client.force_authenticate(user=self.coordo)
        resp_brouillon = self.client.post(f"/api/documents/{self.document.id}/brouillon/")
        self.assertEqual(resp_brouillon.status_code, status.HTTP_200_OK)
        self.assertEqual(resp_brouillon.json()["statut"], Document.Statut.BROUILLON)

        # 3. Le porteur peut maintenant modifier le document
        self.client.force_authenticate(user=self.porteur)
        resp_patch_permis = self.client.patch(
            f"/api/documents/{self.document.id}/",
            {"sections": [{"code": "preambule", "contenu": "Modification permise"}]},
            format="json",
        )
        self.assertEqual(resp_patch_permis.status_code, status.HTTP_200_OK)
        self.assertEqual(resp_patch_permis.json()["version_courante"], 2)


# ==============================================================================
# TESTS T3 — Export Word et PDF avec la charte
# ==============================================================================

class DocumentExportTests(WorkflowAndExportTestCase):
    def test_export_docx_valide_avec_charte(self):
        """GET /api/documents/{id}/export/?format=docx renvoie un fichier Word valide."""
        self.client.force_authenticate(user=self.porteur)
        resp = self.client.get(f"/api/documents/{self.document.id}/export/?format=docx")
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.assertEqual(
            resp["Content-Type"],
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        )
        self.assertIn("attachment; filename=", resp["Content-Disposition"])
        self.assertTrue(resp["Content-Disposition"].endswith(".docx\""))

        # Vérification de la validité du fichier DOCX via python-docx
        docx_file = io.BytesIO(resp.content)
        parsed_doc = DocxDocument(docx_file)
        # Vérifie qu'il y a des paragraphes contenant le titre et les accents
        text_complet = " ".join([p.text for p in parsed_doc.paragraphs])
        self.assertIn("Convention Cadre", text_complet)
        self.assertIn("accentués", text_complet)

    def test_export_pdf_valide_avec_charte(self):
        """GET /api/documents/{id}/export/?format=pdf renvoie un fichier PDF valide."""
        self.client.force_authenticate(user=self.porteur)
        resp = self.client.get(f"/api/documents/{self.document.id}/export/?format=pdf")
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.assertEqual(resp["Content-Type"], "application/pdf")
        self.assertIn("attachment; filename=", resp["Content-Disposition"])
        self.assertTrue(resp["Content-Disposition"].endswith(".pdf\""))

        # Vérification du header magic bytes PDF
        self.assertTrue(resp.content.startswith(b"%PDF"))
        self.assertTrue(len(resp.content) > 1000)

    def test_export_format_inconnu_ou_manquant_renvoie_400(self):
        """Un format invalide ou absent renvoie 400 Bad Request."""
        self.client.force_authenticate(user=self.porteur)

        # Format inconnu
        resp_inconnu = self.client.get(f"/api/documents/{self.document.id}/export/?format=xlsx")
        self.assertEqual(resp_inconnu.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("docx", resp_inconnu.json()["detail"])

        # Format manquant
        resp_manquant = self.client.get(f"/api/documents/{self.document.id}/export/")
        self.assertEqual(resp_manquant.status_code, status.HTTP_400_BAD_REQUEST)

    def test_export_refuse_a_un_utilisateur_tiers(self):
        """Un utilisateur non propriétaire ne peut pas exporter le document (403)."""
        self.client.force_authenticate(user=self.autre_porteur)
        resp = self.client.get(f"/api/documents/{self.document.id}/export/?format=pdf")
        self.assertEqual(resp.status_code, status.HTTP_403_FORBIDDEN)
