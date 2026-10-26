"""Tests unitaires pour la consultation et la gestion des versions de documents (Phase 2 - T1).

Critères d'acceptation :
1. Deux modifications successives donnent les versions 2 et 3.
2. La version 1 reste intacte et lisible.
3. Un utilisateur ne peut pas lire ni modifier le document de quelqu'un d'autre (403).
4. L'équipe CIAT (coordonnateur, admin) peut consulter tous les documents.
5. Un code de section inconnu est refusé (400) avec un message clair.
6. La modification d'un document non-brouillon est refusée (409 Conflict).
"""
from django.test import TestCase, override_settings
from rest_framework import status
from rest_framework.test import APIClient

from apps.core.models import Domaine, Projet, Role, User
from apps.documents.models import Document, ModeleDocument, TypeDocument, VersionDocument


@override_settings(PASSWORD_HASHERS=["django.contrib.auth.hashers.MD5PasswordHasher"])
class DocumentVersionsTestCase(TestCase):
    def setUp(self):
        self.client = APIClient()

        # Utilisateurs
        self.auteur = User.objects.create_user(
            email="auteur@ciat.sn",
            password="password123",
            role=Role.PORTEUR,
            first_name="Auteur",
            last_name="Test",
        )
        self.autre_utilisateur = User.objects.create_user(
            email="autre@ciat.sn",
            password="password123",
            role=Role.PORTEUR,
            first_name="Autre",
            last_name="Test",
        )
        self.coordo = User.objects.create_user(
            email="coordo@ciat.sn",
            password="password123",
            role=Role.COORDONNATEUR,
            first_name="Coordo",
            last_name="CIAT",
        )
        self.admin = User.objects.create_user(
            email="admin@ciat.sn",
            password="password123",
            role=Role.ADMIN,
            first_name="Admin",
            last_name="CIAT",
        )

        self.domaine = Domaine.objects.create(nom="AgriTech", slug="agritech")
        self.projet = Projet.objects.create(
            titre="AgriSolar Pro",
            domaine=self.domaine,
            porteur=self.auteur,
            statut=Projet.Statut.INCUBE,
        )

        # Modèle de document avec sections prédéfinies
        self.type_doc = TypeDocument.objects.create(code="convention_partenariat", nom="Convention")
        self.modele = ModeleDocument.objects.create(
            type=self.type_doc,
            nom="Convention Cadre",
            sections=[
                {"code": "contexte", "titre": "Contexte et Justification", "consigne": "Présenter le cadre"},
                {"code": "objectifs", "titre": "Objectifs du partenariat", "consigne": "Définir les buts"},
                {"code": "engagements", "titre": "Engagements des parties", "consigne": "Détailler les devoirs"},
            ],
        )

        # Document initial avec Version 1
        self.document = Document.objects.create(
            modele=self.modele,
            titre="Convention CIAT - Partenaire Test",
            sujet="Partenariat technologique",
            projet=self.projet,
            auteur=self.auteur,
            statut=Document.Statut.BROUILLON,
        )
        self.version_1 = VersionDocument.objects.create(
            document=self.document,
            numero=1,
            sections=[
                {"code": "contexte", "titre": "Contexte et Justification", "contenu": "Contenu initial v1 contexte"},
                {"code": "objectifs", "titre": "Objectifs du partenariat", "contenu": "Contenu initial v1 objectifs"},
                {"code": "engagements", "titre": "Engagements des parties", "contenu": "Contenu initial v1 engagements"},
            ],
            auteur=self.auteur,
        )

    def test_utilisateur_voit_ses_documents_et_non_ceux_des_autres(self):
        """GET /api/documents/ : un utilisateur voit seulement ses documents."""
        # Création d'un second document pour un autre utilisateur
        Document.objects.create(
            modele=self.modele,
            titre="Document de l'autre",
            sujet="Autre sujet",
            auteur=self.autre_utilisateur,
        )

        self.client.force_authenticate(user=self.auteur)
        resp = self.client.get("/api/documents/")
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        data = resp.json()
        self.assertEqual(len(data), 1)
        self.assertEqual(data[0]["id"], self.document.id)
        self.assertEqual(data[0]["version_courante"], 1)

    def test_equipe_ciat_voit_tous_les_documents(self):
        """L'équipe CIAT (coordonnateur, admin) voit tous les documents."""
        Document.objects.create(
            modele=self.modele,
            titre="Deuxième document",
            sujet="Sujet 2",
            auteur=self.autre_utilisateur,
        )

        self.client.force_authenticate(user=self.coordo)
        resp = self.client.get("/api/documents/")
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.assertEqual(len(resp.json()), 2)

    def test_detail_document_affiche_sections_version_courante(self):
        """GET /api/documents/{id}/ renvoie le détail avec les sections de la version courante."""
        self.client.force_authenticate(user=self.auteur)
        resp = self.client.get(f"/api/documents/{self.document.id}/")
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        data = resp.json()
        self.assertEqual(data["id"], self.document.id)
        self.assertEqual(data["version_courante"], 1)
        self.assertIn("sections", data)
        self.assertEqual(len(data["sections"]), 3)
        self.assertEqual(data["sections"][0]["contenu"], "Contenu initial v1 contexte")

    def test_deux_modifications_successives_donnent_versions_2_et_3(self):
        """Deux PATCH successifs créent la v2 puis la v3 sans effacer la v1."""
        self.client.force_authenticate(user=self.auteur)

        # 1. Première modification -> crée la Version 2
        payload_v2 = {
            "sections": [
                {"code": "contexte", "contenu": "Contenu révisé v2 pour le contexte"},
            ]
        }
        resp_patch1 = self.client.patch(
            f"/api/documents/{self.document.id}/", payload_v2, format="json"
        )
        self.assertEqual(resp_patch1.status_code, status.HTTP_200_OK)
        data_v2 = resp_patch1.json()
        self.assertEqual(data_v2["version_courante"], 2)
        # La section contexte a été modifiée, les autres sont préservées
        sections_v2 = {s["code"]: s["contenu"] for s in data_v2["sections"]}
        self.assertEqual(sections_v2["contexte"], "Contenu révisé v2 pour le contexte")
        self.assertEqual(sections_v2["objectifs"], "Contenu initial v1 objectifs")

        # 2. Deuxième modification -> crée la Version 3
        payload_v3 = {
            "sections": [
                {"code": "objectifs", "contenu": "Nouveaux objectifs v3"},
            ]
        }
        resp_patch2 = self.client.patch(
            f"/api/documents/{self.document.id}/", payload_v3, format="json"
        )
        self.assertEqual(resp_patch2.status_code, status.HTTP_200_OK)
        data_v3 = resp_patch2.json()
        self.assertEqual(data_v3["version_courante"], 3)
        sections_v3 = {s["code"]: s["contenu"] for s in data_v3["sections"]}
        self.assertEqual(sections_v3["contexte"], "Contenu révisé v2 pour le contexte")
        self.assertEqual(sections_v3["objectifs"], "Nouveaux objectifs v3")

        # 3. Vérification de l'historique complet des versions
        resp_versions = self.client.get(f"/api/documents/{self.document.id}/versions/")
        self.assertEqual(resp_versions.status_code, status.HTTP_200_OK)
        versions_list = resp_versions.json()
        self.assertEqual(len(versions_list), 3)
        self.assertEqual([v["numero"] for v in versions_list], [3, 2, 1])

        # 4. Vérification que la Version 1 est toujours lisible et intacte
        resp_v1 = self.client.get(f"/api/documents/{self.document.id}/versions/1/")
        self.assertEqual(resp_v1.status_code, status.HTTP_200_OK)
        sections_v1 = {s["code"]: s["contenu"] for s in resp_v1.json()["sections"]}
        self.assertEqual(sections_v1["contexte"], "Contenu initial v1 contexte")

    def test_utilisateur_ne_peut_pas_lire_ni_modifier_document_autrui(self):
        """Un utilisateur tiers ne peut ni lire (GET) ni modifier (PATCH) le document d'un autre."""
        self.client.force_authenticate(user=self.autre_utilisateur)

        # GET detail -> 403
        resp_get = self.client.get(f"/api/documents/{self.document.id}/")
        self.assertEqual(resp_get.status_code, status.HTTP_403_FORBIDDEN)

        # PATCH -> 403
        resp_patch = self.client.patch(
            f"/api/documents/{self.document.id}/",
            {"sections": [{"code": "contexte", "contenu": "Piratage"}]},
            format="json",
        )
        self.assertEqual(resp_patch.status_code, status.HTTP_403_FORBIDDEN)

        # GET versions -> 403
        resp_versions = self.client.get(f"/api/documents/{self.document.id}/versions/")
        self.assertEqual(resp_versions.status_code, status.HTTP_403_FORBIDDEN)

    def test_code_section_inconnu_refuse_avec_message_clair(self):
        """Un code de section inexistant dans le modèle renvoie 400 Bad Request avec message clair."""
        self.client.force_authenticate(user=self.auteur)
        payload = {
            "sections": [
                {"code": "section_inexistante", "contenu": "Texte erroné"},
            ]
        }
        resp = self.client.patch(
            f"/api/documents/{self.document.id}/", payload, format="json"
        )
        self.assertEqual(resp.status_code, status.HTTP_400_BAD_REQUEST)
        detail = resp.json().get("detail", "")
        self.assertIn("section_inexistante", detail)
        self.assertIn("Codes autorisés", detail)

    def test_modification_refusee_si_statut_non_brouillon(self):
        """Un document au statut valide ou publie ne peut pas être modifié (409 Conflict)."""
        self.document.statut = Document.Statut.VALIDE
        self.document.save()

        self.client.force_authenticate(user=self.auteur)
        payload = {
            "sections": [
                {"code": "contexte", "contenu": "Modification interdite"},
            ]
        }
        resp = self.client.patch(
            f"/api/documents/{self.document.id}/", payload, format="json"
        )
        self.assertEqual(resp.status_code, status.HTTP_409_CONFLICT)
        self.assertIn("brouillon", resp.json().get("detail", ""))
