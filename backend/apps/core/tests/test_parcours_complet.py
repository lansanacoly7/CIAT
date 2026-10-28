"""Test de bout en bout du cycle complet du CIAT côté API (Phase 3 - Tâche T3).

Parcours complet testé :
1. Inscription et authentification JWT du porteur de projet
2. Création d'un projet et de son dossier de candidature
3. Dépôt des pièces obligatoires (PDF valides) et soumission officielle
4. Évaluation multicritère par un membre du comité
5. Décision motivée d'acceptation par le coordonnateur
6. Affectation du mentor, création d'objectifs, jalon en retard et alertes
7. Création de la fiche de galerie, validation, publication, QR code et consultation publique
8. Génération d'un document officiel (IA simulée), révision de version, validation et export PDF
9. Vérification systématique des contrôles d'accès et droits RBAC négatifs à chaque étape.
"""
import json
from datetime import timedelta
from decimal import Decimal
from unittest.mock import PropertyMock, patch

from django.core.cache import cache
from django.core.files.uploadedfile import SimpleUploadedFile
from django.core.management import call_command
from django.test import TestCase, override_settings
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APIClient

from apps.core.models import Cohorte, Domaine, Projet, Role, User
from apps.documents.models import Document, ModeleDocument
from apps.gallery.models import FicheInnovation
from apps.incubator.models import (
    Dossier,
    Grille,
    StatutDossier,
    StatutJalon,
)


@override_settings(PASSWORD_HASHERS=["django.contrib.auth.hashers.MD5PasswordHasher"])
class ParcoursCompletAPITestCase(TestCase):
    """Vérifie le parcours complet de bout en bout et les droits RBAC associés."""

    def setUp(self):
        cache.clear()
        self.client = APIClient()

        # 1. Données de base indispensables
        self.domaine = Domaine.objects.create(
            nom="Agriculture & Agrotech",
            slug="agriculture-agrotech",
        )
        self.cohorte = Cohorte.objects.create(
            nom="Cohorte 2026 - Diamniadio",
            annee=2026,
            date_debut=timezone.now().date(),
            date_fin=timezone.now().date() + timedelta(days=180),
        )

        # 2. Initialisation des grilles d'évaluation et modèles de documents
        call_command("seed_incubator")
        call_command("seed_documents")

        self.grille = Grille.objects.filter(active=True).first()
        self.criteres = list(self.grille.criteres.all())

        # 3. Utilisateurs rôles institutionnels
        self.coordo = User.objects.create_user(
            email="coordonnateur@ciat.sn",
            password="Ciat2026!Password",
            role=Role.COORDONNATEUR,
            first_name="Coordonnateur",
            last_name="CIAT",
        )
        self.comite = User.objects.create_user(
            email="evaluateur.comite@ciat.sn",
            password="Ciat2026!Password",
            role=Role.COMITE,
            first_name="Membre",
            last_name="Comite",
        )
        self.mentor = User.objects.create_user(
            email="mentor.expert@ciat.sn",
            password="Ciat2026!Password",
            role=Role.MENTOR,
            first_name="Mentor",
            last_name="Tech",
        )
        self.autre_porteur = User.objects.create_user(
            email="autre.porteur@demo.ciat.sn",
            password="Ciat2026!Password",
            role=Role.PORTEUR,
            first_name="Autre",
            last_name="Candidat",
        )

    @patch("apps.core.ai.AIService.configured", new_callable=PropertyMock)
    @patch("apps.core.ai.AIService.chat")
    def test_parcours_complet_bout_en_bout_et_rbac(self, mock_chat, mock_ai_configured):
        """Exécute l'intégralité du cycle de vie d'un projet, de la candidature à l'export documentaire."""
        mock_ai_configured.return_value = True

        # ==============================================================================
        # 1. Inscription et Authentification du porteur de projet
        # ==============================================================================
        porteur_email = "fatou.diop@innov.sn"
        porteur_pass = "FatouInnov2026!Secure"

        # A. Inscription réussie via /api/auth/register/
        register_payload = {
            "email": porteur_email,
            "password": porteur_pass,
            "first_name": "Fatou",
            "last_name": "Diop",
            "telephone": "+221771234567",
            "organisation": "AgriTech Solutions",
            "genre": "F",
        }
        res_reg = self.client.post("/api/auth/register/", register_payload)
        self.assertEqual(res_reg.status_code, status.HTTP_201_CREATED)
        self.assertEqual(res_reg.data["email"], porteur_email)

        # Contrôle négatif : tentative d'inscription avec le même email (400)
        res_reg_dup = self.client.post("/api/auth/register/", register_payload)
        self.assertEqual(res_reg_dup.status_code, status.HTTP_400_BAD_REQUEST)

        # B. Connexion JWT via /api/auth/token/
        login_payload = {"email": porteur_email, "password": porteur_pass}
        res_token = self.client.post("/api/auth/token/", login_payload)
        self.assertEqual(res_token.status_code, status.HTTP_200_OK)
        self.assertIn("access", res_token.data)
        access_token = res_token.data["access"]

        # Authentification du client avec le porteur
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {access_token}")

        # C. Vérification de l'identité /api/auth/me/
        res_me = self.client.get("/api/auth/me/")
        self.assertEqual(res_me.status_code, status.HTTP_200_OK)
        self.assertEqual(res_me.data["role"], Role.PORTEUR)
        porteur_id = res_me.data["id"]

        # ==============================================================================
        # 2. Création du projet et dossier de candidature
        # ==============================================================================
        projet_payload = {
            "titre": "SolaireIrrig Pro",
            "resume": "Système autonome d'irrigation goutte-à-goutte alimenté par capteurs solaires.",
            "probleme": "Accès limité et coûteux à l'énergie pour l'irrigation en zone rurale.",
            "solution": "Pompage solaire intelligent couplé à une application mobile de pilotage.",
            "domaine": self.domaine.id,
            "cohorte": self.cohorte.id,
        }
        res_projet = self.client.post("/api/projets/", projet_payload)
        self.assertEqual(res_projet.status_code, status.HTTP_201_CREATED)
        projet_id = res_projet.data["id"]
        self.assertEqual(res_projet.data["statut"], "idee")

        # Création du dossier d'accompagnement
        res_dossier = self.client.post("/api/incubator/dossiers/", {"projet": projet_id})
        self.assertEqual(res_dossier.status_code, status.HTTP_201_CREATED)
        dossier_id = res_dossier.data["id"]
        self.assertEqual(res_dossier.data["statut"], StatutDossier.BROUILLON)

        # Contrôle des droits négatif : un autre porteur tente de consulter le dossier (403)
        client_autre = APIClient()
        client_autre.force_authenticate(user=self.autre_porteur)
        res_autre_dossier = client_autre.get(f"/api/incubator/dossiers/{dossier_id}/")
        self.assertEqual(res_autre_dossier.status_code, status.HTTP_403_FORBIDDEN)

        # Contrôle négatif : tentative de soumission d'un dossier sans pièces (400)
        res_soumis_incomplet = self.client.post(f"/api/incubator/dossiers/{dossier_id}/soumettre/")
        self.assertEqual(res_soumis_incomplet.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("pieces_manquantes", res_soumis_incomplet.data)
        self.assertEqual(len(res_soumis_incomplet.data["pieces_manquantes"]), 3)

        # Dépôt des 3 pièces obligatoires (avec signature binaire PDF valide %PDF-)
        pieces_a_deposer = [
            ("fiche_projet", "fiche_descriptive.pdf"),
            ("presentation_equipe", "equipe_fondatrice.pdf"),
            ("budget_previsionnel", "budget_financier.pdf"),
        ]
        for type_piece, nom_fichier in pieces_a_deposer:
            pdf_data = SimpleUploadedFile(
                nom_fichier,
                b"%PDF-1.4\n1 0 obj<<>>endobj\ntrailer<<>>startxref\n0\n%%EOF",
                content_type="application/pdf",
            )
            res_piece = self.client.post(
                f"/api/incubator/dossiers/{dossier_id}/pieces/",
                {"type": type_piece, "nom": nom_fichier, "fichier": pdf_data},
                format="multipart",
            )
            self.assertEqual(res_piece.status_code, status.HTTP_201_CREATED)

        # Contrôle négatif : un utilisateur anonyme tente de déposer une pièce (401)
        client_anonyme = APIClient()
        res_anon_piece = client_anonyme.post(
            f"/api/incubator/dossiers/{dossier_id}/pieces/",
            {"type": "autre", "fichier": pdf_data},
            format="multipart",
        )
        self.assertEqual(res_anon_piece.status_code, status.HTTP_401_UNAUTHORIZED)

        # Soumission officielle réussie
        res_soumission = self.client.post(f"/api/incubator/dossiers/{dossier_id}/soumettre/")
        self.assertEqual(res_soumission.status_code, status.HTTP_200_OK)
        self.assertEqual(res_soumission.data["statut"], StatutDossier.SOUMIS)

        # Vérification de l'évolution du statut du projet vers 'depose'
        projet_db = Projet.objects.get(id=projet_id)
        self.assertEqual(projet_db.statut, "depose")

        # Contrôle négatif : tentative d'ajouter une pièce après soumission (400)
        res_piece_apres_soumission = self.client.post(
            f"/api/incubator/dossiers/{dossier_id}/pieces/",
            {"type": "autre", "nom": "autre.pdf", "fichier": pdf_data},
            format="multipart",
        )
        self.assertEqual(res_piece_apres_soumission.status_code, status.HTTP_400_BAD_REQUEST)

        # ==============================================================================
        # 3. Évaluation multicritère par le comité
        # ==============================================================================
        # Contrôle des droits négatif : le porteur tente de s'évaluer lui-même (403)
        res_eval_porteur = self.client.post(
            f"/api/incubator/dossiers/{dossier_id}/evaluations/",
            {"notes": [{"critere": self.criteres[0].id, "note": 18}], "avis": "Je m'auto-évalue"},
            format="json",
        )
        self.assertEqual(res_eval_porteur.status_code, status.HTTP_403_FORBIDDEN)

        # Évaluation légitime par le membre du comité
        client_comite = APIClient()
        client_comite.force_authenticate(user=self.comite)

        eval_payload = {
            "avis": "Excellent projet technique avec fort potentiel d'impact en milieu rural.",
            "notes": [{"critere": c.id, "note": Decimal("17.5")} for c in self.criteres],
        }
        res_eval_comite = client_comite.post(
            f"/api/incubator/dossiers/{dossier_id}/evaluations/",
            eval_payload,
            format="json",
        )
        self.assertEqual(res_eval_comite.status_code, status.HTTP_201_CREATED)

        # Consultation des évaluations et score moyen
        res_eval_list = client_comite.get(f"/api/incubator/dossiers/{dossier_id}/evaluations/")
        self.assertEqual(res_eval_list.status_code, status.HTTP_200_OK)
        self.assertEqual(res_eval_list.data["total_evaluations"], 1)
        self.assertAlmostEqual(float(res_eval_list.data["score_moyen"]), 17.5, places=1)

        # Contrôle négatif : tentative d'évaluer deux fois le même dossier par la même personne (400)
        res_eval_double = client_comite.post(
            f"/api/incubator/dossiers/{dossier_id}/evaluations/",
            eval_payload,
            format="json",
        )
        self.assertEqual(res_eval_double.status_code, status.HTTP_400_BAD_REQUEST)

        # ==============================================================================
        # 4. Décision motivée par le coordonnateur
        # ==============================================================================
        # Contrôle des droits négatif : le membre du comité tente de statuer sur le dossier (403)
        decision_payload = {
            "decision": "accepte",
            "motif": "Projet à fort impact validé à l'unanimité par le jury.",
        }
        res_dec_comite = client_comite.post(
            f"/api/incubator/dossiers/{dossier_id}/decision/",
            decision_payload,
            format="json",
        )
        self.assertEqual(res_dec_comite.status_code, status.HTTP_403_FORBIDDEN)

        # Décision prise par le coordonnateur
        client_coordo = APIClient()
        client_coordo.force_authenticate(user=self.coordo)

        res_dec_coordo = client_coordo.post(
            f"/api/incubator/dossiers/{dossier_id}/decision/",
            decision_payload,
            format="json",
        )
        self.assertEqual(res_dec_coordo.status_code, status.HTTP_201_CREATED)

        # Vérification du passage au statut 'accepte' du dossier et 'selectionne' du projet
        dossier_apres_dec = Dossier.objects.get(id=dossier_id)
        self.assertEqual(dossier_apres_dec.statut, StatutDossier.ACCEPTE)
        projet_apres_dec = Projet.objects.get(id=projet_id)
        self.assertEqual(projet_apres_dec.statut, "selectionne")

        # ==============================================================================
        # 5. Affectation de mentor, objectifs, jalons et alertes de retard
        # ==============================================================================
        # Contrôle des droits négatif : le porteur tente d'affecter son mentor (403)
        res_mentor_porteur = self.client.post(
            f"/api/incubator/projets/{projet_id}/mentor/",
            {"mentor": self.mentor.id},
        )
        self.assertEqual(res_mentor_porteur.status_code, status.HTTP_403_FORBIDDEN)

        # Le coordonnateur affecte le mentor
        res_mentor_coordo = client_coordo.post(
            f"/api/incubator/projets/{projet_id}/mentor/",
            {"mentor": self.mentor.id},
        )
        self.assertEqual(res_mentor_coordo.status_code, status.HTTP_200_OK)
        self.assertEqual(res_mentor_coordo.data["mentor"], self.mentor.id)

        # Création d'un objectif opérationnel par le mentor
        client_mentor = APIClient()
        client_mentor.force_authenticate(user=self.mentor)

        res_obj = client_mentor.post(
            f"/api/incubator/projets/{projet_id}/objectifs/",
            {
                "libelle": "Finaliser le prototype de capteur d'humidité",
                "echeance": str(timezone.now().date() + timedelta(days=30)),
                "statut": "a_faire",
            },
        )
        self.assertEqual(res_obj.status_code, status.HTTP_201_CREATED)

        # Création d'un jalon avec échéance passée pour tester le déclenchement d'alerte
        date_passee = timezone.now().date() - timedelta(days=5)
        res_jalon = client_mentor.post(
            f"/api/incubator/projets/{projet_id}/jalons/",
            {
                "titre": "Étude comparative des panneaux solaires",
                "echeance": str(date_passee),
                "statut": StatutJalon.A_FAIRE,
            },
        )
        self.assertEqual(res_jalon.status_code, status.HTTP_201_CREATED)
        jalon_id = res_jalon.data["id"]

        # Consultation des alertes de retard par le mentor
        res_alertes = client_mentor.get("/api/incubator/alertes/")
        self.assertEqual(res_alertes.status_code, status.HTTP_200_OK)
        ids_en_alerte = [a["id"] for a in res_alertes.data]
        self.assertIn(jalon_id, ids_en_alerte)

        # Ajout d'un commentaire d'alerte par le mentor
        res_com = client_mentor.post(
            f"/api/incubator/jalons/{jalon_id}/commentaires/",
            {"texte": "Attention : l'échéance de ce jalon est dépassée. Merci de faire le point."},
        )
        self.assertEqual(res_com.status_code, status.HTTP_201_CREATED)
        self.assertEqual(res_com.data["auteur_nom"], self.mentor.get_full_name())

        # ==============================================================================
        # 6. Galerie des innovations (P6)
        # ==============================================================================
        # Passage du projet au statut 'prototype'
        projet_apres_dec.statut = "prototype"
        projet_apres_dec.save(update_fields=["statut"])

        # Contrôle des droits négatif : un autre porteur tente de créer une fiche sur ce projet (403)
        fiche_payload = {
            "projet": projet_id,
            "titre": "SolaireIrrig Pro - Vitrine",
            "probleme": "Manque d'irrigation continue dans la vallée du fleuve Sénégal.",
            "solution": "Système automatisé solaire à haute efficacité hydrique.",
            "equipe": "Équipe pluridisciplinaire d'ingénieurs agronomes et mécatroniciens.",
            "avancement": "prototype",
            "medias": [{"type": "demo", "url": "https://ciat.sn/demo/solaire-irrig"}],
        }
        res_fiche_autre = client_autre.post("/api/gallery/fiches/", fiche_payload, format="json")
        self.assertEqual(res_fiche_autre.status_code, status.HTTP_403_FORBIDDEN)

        # Création de la fiche par le porteur légitime
        res_fiche_porteur = self.client.post("/api/gallery/fiches/", fiche_payload, format="json")
        self.assertEqual(res_fiche_porteur.status_code, status.HTTP_201_CREATED)
        fiche_id = res_fiche_porteur.data["id"]
        fiche_slug = res_fiche_porteur.data["slug"]
        self.assertEqual(res_fiche_porteur.data["statut"], FicheInnovation.Statut.BROUILLON)

        # Contrôle négatif : la fiche brouillon ne doit PAS être visible publiquement (404)
        res_fiche_anon = client_anonyme.get(f"/api/gallery/fiches/{fiche_slug}/")
        self.assertEqual(res_fiche_anon.status_code, status.HTTP_404_NOT_FOUND)

        # Contrôle des droits négatif : le porteur ne peut pas valider lui-même sa fiche (403)
        res_valider_porteur = self.client.post(f"/api/gallery/fiches/{fiche_id}/valider/")
        self.assertEqual(res_valider_porteur.status_code, status.HTTP_403_FORBIDDEN)

        # Le porteur soumet sa fiche pour validation
        res_soumettre_fiche = self.client.post(f"/api/gallery/fiches/{fiche_id}/soumettre/")
        self.assertEqual(res_soumettre_fiche.status_code, status.HTTP_200_OK)
        self.assertEqual(res_soumettre_fiche.data["statut"], FicheInnovation.Statut.EN_VALIDATION)

        # Le coordonnateur valide la fiche (statut -> publie)
        res_valider_coordo = client_coordo.post(f"/api/gallery/fiches/{fiche_id}/valider/")
        self.assertEqual(res_valider_coordo.status_code, status.HTTP_200_OK)
        self.assertEqual(res_valider_coordo.data["statut"], FicheInnovation.Statut.PUBLIE)

        # Consultation publique anonyme de la fiche publiée
        res_public_detail = client_anonyme.get(f"/api/gallery/fiches/{fiche_slug}/")
        self.assertEqual(res_public_detail.status_code, status.HTTP_200_OK)
        self.assertEqual(res_public_detail.data["titre"], fiche_payload["titre"])

        # Contrôle de confidentialité strict : aucune donnée privée exposée
        detail_json = json.dumps(res_public_detail.data)
        self.assertNotIn(porteur_email, detail_json)
        self.assertNotIn("+221771234567", detail_json)

        # Récupération du QR code public
        res_qr = client_anonyme.get(f"/api/gallery/fiches/{fiche_slug}/qr/")
        self.assertEqual(res_qr.status_code, status.HTTP_200_OK)
        self.assertEqual(res_qr["Content-Type"], "image/png")
        self.assertTrue(len(res_qr.content) > 100)

        # ==============================================================================
        # 7. Génération, cycle de vie et export de documents institutionnels (P5)
        # ==============================================================================
        # Contrôle négatif : un utilisateur anonyme tente de générer un document (401)
        modele_convention = ModeleDocument.objects.filter(type__code="convention").first()
        self.assertIsNotNone(modele_convention, "Le modèle convention d'incubation doit exister.")

        res_gen_anon = client_anonyme.post(
            "/api/documents/generer/",
            {
                "modele": modele_convention.id,
                "projet": projet_id,
                "sujet": "Convention cadre d'incubation CIAT",
            },
        )
        self.assertEqual(res_gen_anon.status_code, status.HTTP_401_UNAUTHORIZED)

        # Simulation de la réponse de l'IA au format JSON attendu
        mock_chat.return_value = json.dumps(
            {
                s["code"]: f"Contenu rédigé pour la section {s['titre']} du projet SolaireIrrig."
                for s in modele_convention.sections
            }
        )

        # Génération du document par le coordonnateur
        gen_payload = {
            "modele": modele_convention.id,
            "projet": projet_id,
            "sujet": "Convention d'incubation du projet SolaireIrrig Pro",
            "infos": {"duree_mois": "6", "subvention": "5 000 000 FCFA"},
        }
        res_doc_gen = client_coordo.post("/api/documents/generer/", gen_payload, format="json")
        self.assertEqual(res_doc_gen.status_code, status.HTTP_201_CREATED)
        doc_id = res_doc_gen.data["id"]
        self.assertEqual(res_doc_gen.data["statut"], Document.Statut.BROUILLON)
        self.assertEqual(res_doc_gen.data["version"], 1)

        # Modification d'une section du document brouillon -> création de la version 2
        premiere_section_code = modele_convention.sections[0]["code"]
        patch_payload = {
            "sections": [
                {
                    "code": premiere_section_code,
                    "contenu": "Engagement formel de respect mutuel des objectifs fixés pour 2026.",
                }
            ]
        }
        res_patch_doc = client_coordo.patch(f"/api/documents/{doc_id}/", patch_payload, format="json")
        self.assertEqual(res_patch_doc.status_code, status.HTTP_200_OK)
        self.assertEqual(res_patch_doc.data["version_courante"], 2)

        # Consultation de l'historique des versions
        res_versions = client_coordo.get(f"/api/documents/{doc_id}/versions/")
        self.assertEqual(res_versions.status_code, status.HTTP_200_OK)
        self.assertEqual(len(res_versions.data), 2)

        # Validation du document par le coordonnateur
        res_valider_doc = client_coordo.post(f"/api/documents/{doc_id}/valider/")
        self.assertEqual(res_valider_doc.status_code, status.HTTP_200_OK)
        self.assertEqual(res_valider_doc.data["statut"], Document.Statut.VALIDE)

        # Contrôle négatif : modification interdite sur un document validé (409 Conflict)
        res_patch_interdit = client_coordo.patch(
            f"/api/documents/{doc_id}/", patch_payload, format="json"
        )
        self.assertEqual(res_patch_interdit.status_code, status.HTTP_409_CONFLICT)

        # Export du document au format PDF
        res_export_pdf = client_coordo.get(f"/api/documents/{doc_id}/export/?format=pdf")
        self.assertEqual(res_export_pdf.status_code, status.HTTP_200_OK)
        self.assertEqual(res_export_pdf["Content-Type"], "application/pdf")
        self.assertTrue(len(res_export_pdf.content) > 200)
        self.assertTrue(res_export_pdf.content.startswith(b"%PDF-"))

    def test_parcours_rejet_completude_et_suppression_piece(self):
        """Vérifie le calcul dynamique de complétude, la suppression de pièce et le rejet motivé."""
        client_porteur = APIClient()
        client_porteur.force_authenticate(user=self.autre_porteur)

        # 1. Création projet et dossier
        res_proj = client_porteur.post(
            "/api/projets/",
            {
                "titre": "Projet Non Retenu",
                "resume": "Projet avec dossier incomplet puis rejeté.",
                "probleme": "Difficulté d'approvisionnement.",
                "solution": "Plateforme logistique.",
                "domaine": self.domaine.id,
                "cohorte": self.cohorte.id,
            },
        )
        self.assertEqual(res_proj.status_code, status.HTTP_201_CREATED)
        projet_id = res_proj.data["id"]

        res_dos = client_porteur.post("/api/incubator/dossiers/", {"projet": projet_id})
        self.assertEqual(res_dos.status_code, status.HTTP_201_CREATED)
        dossier_id = res_dos.data["id"]
        self.assertEqual(res_dos.data["completude"], 0)

        # 2. Ajout d'une pièce -> complétude = 33%
        pdf_data = SimpleUploadedFile(
            "fiche.pdf",
            b"%PDF-1.4\n1 0 obj<<>>endobj\ntrailer<<>>startxref\n0\n%%EOF",
            content_type="application/pdf",
        )
        res_p1 = client_porteur.post(
            f"/api/incubator/dossiers/{dossier_id}/pieces/",
            {"type": "fiche_projet", "nom": "fiche.pdf", "fichier": pdf_data},
            format="multipart",
        )
        self.assertEqual(res_p1.status_code, status.HTTP_201_CREATED)
        piece_id = res_p1.data["id"]

        dos_inter = client_porteur.get(f"/api/incubator/dossiers/{dossier_id}/")
        self.assertEqual(dos_inter.data["completude"], 33)

        # 3. Suppression de la pièce -> complétude redescend à 0%
        res_del = client_porteur.delete(f"/api/incubator/dossiers/{dossier_id}/pieces/{piece_id}/")
        self.assertEqual(res_del.status_code, status.HTTP_204_NO_CONTENT)

        dos_apres_del = client_porteur.get(f"/api/incubator/dossiers/{dossier_id}/")
        self.assertEqual(dos_apres_del.data["completude"], 0)

        # 4. Dépôt des 3 pièces obligatoires pour soumettre
        for t, n in [
            ("fiche_projet", "fp.pdf"),
            ("presentation_equipe", "pe.pdf"),
            ("budget_previsionnel", "bp.pdf"),
        ]:
            f = SimpleUploadedFile(n, b"%PDF-1.4 content", content_type="application/pdf")
            client_porteur.post(
                f"/api/incubator/dossiers/{dossier_id}/pieces/",
                {"type": t, "nom": n, "fichier": f},
                format="multipart",
            )

        res_soumettre = client_porteur.post(f"/api/incubator/dossiers/{dossier_id}/soumettre/")
        self.assertEqual(res_soumettre.status_code, status.HTTP_200_OK)

        # 5. Évaluation défavorable par le membre du comité
        client_comite = APIClient()
        client_comite.force_authenticate(user=self.comite)
        eval_res = client_comite.post(
            f"/api/incubator/dossiers/{dossier_id}/evaluations/",
            {
                "avis": "Faisabilité technique insuffisante et modèle économique non viable.",
                "notes": [{"critere": c.id, "note": Decimal("6.0")} for c in self.criteres],
            },
            format="json",
        )
        self.assertEqual(eval_res.status_code, status.HTTP_201_CREATED)

        # 6. Décision de refus motivée par le coordonnateur
        client_coordo = APIClient()
        client_coordo.force_authenticate(user=self.coordo)
        dec_res = client_coordo.post(
            f"/api/incubator/dossiers/{dossier_id}/decision/",
            {
                "decision": "refuse",
                "motif": "Dossier refusé suite à l'avis défavorable du comité (faisabilité insuffisante).",
            },
            format="json",
        )
        self.assertEqual(dec_res.status_code, status.HTTP_201_CREATED)
        self.assertEqual(dec_res.data["decision"], "refuse")

        # Vérification des statuts finaux en base
        dossier_final = Dossier.objects.get(id=dossier_id)
        self.assertEqual(dossier_final.statut, StatutDossier.REFUSE)
        projet_final = Projet.objects.get(id=projet_id)
        self.assertEqual(projet_final.statut, "rejete")

        # Tentative de reprendre une décision sur un dossier déjà statué -> 400
        dec_dup = client_coordo.post(
            f"/api/incubator/dossiers/{dossier_id}/decision/",
            {"decision": "accepte", "motif": "Modification tardive"},
            format="json",
        )
        self.assertEqual(dec_dup.status_code, status.HTTP_400_BAD_REQUEST)

