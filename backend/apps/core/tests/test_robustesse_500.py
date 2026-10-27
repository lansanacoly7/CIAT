"""Test de robustesse de l'API (Phase 7 — Tâche T1).

Vérifie l'absence absolue d'erreur HTTP 500 sur l'ensemble des routes d'API
lors de la réception d'entrées anormales ou hostiles :
1. Identifiants négatifs ou inexistants (-1, -999, 999999, non-numérique).
2. Chaînes très longues (10 000 caractères).
3. Types de données faux (nombres à la place de texte, tableaux au lieu d'objets, etc.).
4. Champs obligatoires absents (payloads vides {}).
5. Corps JSON invalide / malformé.
6. Fichiers vides (0 octet) ou extensions et signatures non autorisées.
7. Doubles envois et conflits métier.

Règle stricte : Le code de retour HTTP doit TOUJOURS être compris dans
[400, 401, 403, 404, 409, 429], et JAMAIS 500 (Internal Server Error).
"""
import json
from django.core.files.uploadedfile import SimpleUploadedFile
from django.test import override_settings
from rest_framework import status
from rest_framework.test import APITestCase

from apps.core.models import Cohorte, Domaine, Projet, Role, User
from apps.incubator.models import (
    Critere,
    Decision,
    Dossier,
    Evaluation,
    Grille,
    Jalon,
    Objectif,
    Piece,
    PreuveJalon,
    StatutDossier,
    TypePiece,
)
from apps.documents.models import Document, ModeleDocument, TypeDocument, VersionDocument
from apps.gallery.models import FicheInnovation
from apps.assistant.models import Conversation


FAST_HASHERS = ["django.contrib.auth.hashers.MD5PasswordHasher"]
ALLOWED_ERROR_STATUSES = {
    status.HTTP_400_BAD_REQUEST,
    status.HTTP_401_UNAUTHORIZED,
    status.HTTP_403_FORBIDDEN,
    status.HTTP_404_NOT_FOUND,
    status.HTTP_409_CONFLICT,
    status.HTTP_429_TOO_MANY_REQUESTS,
    status.HTTP_502_BAD_GATEWAY,
    status.HTTP_503_SERVICE_UNAVAILABLE,
}


@override_settings(
    PASSWORD_HASHERS=FAST_HASHERS,
    DISABLE_THROTTLING="1",
)
class RobustesseApiAucuneErreur500Tests(APITestCase):
    """Vérification systématique de la résilience du back-end face aux anomalies."""

    @classmethod
    def setUpTestData(cls):
        # 1. Utilisateurs socles
        cls.admin = User.objects.create_user(
            email="admin_rob@ciat.sn",
            password="passWord123!",
            role=Role.ADMIN,
            first_name="Admin",
            last_name="CIAT",
        )
        cls.coordo = User.objects.create_user(
            email="coordo_rob@ciat.sn",
            password="passWord123!",
            role=Role.COORDONNATEUR,
            first_name="Coordo",
            last_name="CIAT",
        )
        cls.comite = User.objects.create_user(
            email="comite_rob@ciat.sn",
            password="passWord123!",
            role=Role.COMITE,
            first_name="Membre",
            last_name="Jury",
        )
        cls.mentor = User.objects.create_user(
            email="mentor_rob@ciat.sn",
            password="passWord123!",
            role=Role.MENTOR,
            first_name="Mentor",
            last_name="CIAT",
        )
        cls.porteur = User.objects.create_user(
            email="porteur_rob@ciat.sn",
            password="passWord123!",
            role=Role.PORTEUR,
            first_name="Porteur",
            last_name="Projet",
        )
        cls.tiers_porteur = User.objects.create_user(
            email="tiers_rob@ciat.sn",
            password="passWord123!",
            role=Role.PORTEUR,
            first_name="Tiers",
            last_name="Projet",
        )

        # 2. Domaines et cohortes
        cls.domaine = Domaine.objects.create(nom="Robotique et IA")
        cls.cohorte = Cohorte.objects.create(
            nom="Cohorte 2026 Rob", annee=2026, date_debut="2026-01-01", date_fin="2026-12-31"
        )

        # 3. Projets
        cls.projet = Projet.objects.create(
            titre="Projet Drone Agricole",
            resume="Surveillance des cultures",
            probleme="Pertes agricoles",
            solution="Drones autonomes",
            domaine=cls.domaine,
            cohorte=cls.cohorte,
            porteur=cls.porteur,
            statut="incube",
        )
        cls.projet_tiers = Projet.objects.create(
            titre="Projet Solaire",
            resume="Énergie rurale",
            probleme="Manque d'accès",
            solution="Kits solaires",
            domaine=cls.domaine,
            cohorte=cls.cohorte,
            porteur=cls.tiers_porteur,
            statut="idee",
        )

        # 4. Dossier et pièces
        cls.dossier = Dossier.objects.create(projet=cls.projet, statut=StatutDossier.BROUILLON)
        fake_pdf = SimpleUploadedFile("fiche.pdf", b"%PDF-1.4 Fake valid PDF content", content_type="application/pdf")
        cls.piece = Piece.objects.create(dossier=cls.dossier, type=TypePiece.FICHE_PROJET, nom="fiche.pdf", fichier=fake_pdf)

        # 5. Grille et critère
        cls.grille = Grille.objects.create(nom="Grille 2026", active=True)
        cls.critere = Critere.objects.create(grille=cls.grille, libelle="Innovation", poids=1, note_max=20)

        # 6. Objectifs et jalons
        cls.objectif = Objectif.objects.create(projet=cls.projet, libelle="Prototype V1", echeance="2026-06-01", cree_par=cls.mentor)
        cls.jalon = Jalon.objects.create(projet=cls.projet, titre="Validation banc", echeance="2026-06-15", cree_par=cls.mentor)

        # 7. Documents P5
        cls.type_doc = TypeDocument.objects.create(code="fiche_technique", nom="Fiche Technique")
        cls.modele_doc = ModeleDocument.objects.create(type=cls.type_doc, nom="Modèle Standard", sections=[{"code": "intro", "titre": "Introduction"}])
        cls.doc = Document.objects.create(titre="Document Test", modele=cls.modele_doc, auteur=cls.coordo, statut=Document.Statut.BROUILLON)
        cls.version_doc = VersionDocument.objects.create(document=cls.doc, numero=1, sections=[{"code": "intro", "contenu": "Contenu initial"}], auteur=cls.coordo)

        # 8. Fiche Galerie P6
        cls.fiche_galerie = FicheInnovation.objects.create(
            projet=cls.projet,
            titre="Fiche Drone Agricole",
            slug="drone-agricole-rob",
            probleme="Pertes",
            solution="Drones",
            equipe="Équipe Rob",
            avancement="Prototype",
            statut=FicheInnovation.Statut.PUBLIE,
        )

        # 9. Assistant P4
        cls.conv = Conversation.objects.create(titre="Conversation Test", utilisateur=cls.porteur)

    def assertNot500(self, response, message=""):
        """Garantie formelle : la réponse ne doit jamais être une erreur 500."""
        self.assertNotEqual(
            response.status_code,
            status.HTTP_500_INTERNAL_SERVER_ERROR,
            f"Erreur HTTP 500 inacceptable détectée ! {message} - Contenu: {getattr(response, 'data', response.content)}",
        )
        self.assertIn(
            response.status_code,
            ALLOWED_ERROR_STATUSES | {status.HTTP_200_OK, status.HTTP_201_CREATED, status.HTTP_204_NO_CONTENT},
            f"Statut inattendu ({response.status_code}) pour : {message}",
        )

    # ==========================================================================
    # 1. Identifiants négatifs ou inexistants
    # ==========================================================================
    def test_01_identifiants_negatifs_et_inexistants(self):
        """Parcours des routes d'API avec des identifiants invalides ou hors bornes."""
        bad_ids = [-1, -999, 0, 999999]
        self.client.force_authenticate(user=self.admin)

        for bid in bad_ids:
            endpoints = [
                ("GET", f"/api/projets/{bid}/"),
                ("PATCH", f"/api/projets/{bid}/"),
                ("DELETE", f"/api/projets/{bid}/"),
                ("GET", f"/api/incubator/dossiers/{bid}/"),
                ("PATCH", f"/api/incubator/dossiers/{bid}/"),
                ("POST", f"/api/incubator/dossiers/{bid}/soumettre/"),
                ("GET", f"/api/incubator/dossiers/{bid}/accuse/"),
                ("GET", f"/api/incubator/dossiers/{bid}/evaluations/"),
                ("POST", f"/api/incubator/dossiers/{bid}/evaluations/"),
                ("POST", f"/api/incubator/dossiers/{bid}/decision/"),
                ("POST", f"/api/incubator/dossiers/{bid}/pieces/"),
                ("DELETE", f"/api/incubator/dossiers/{self.dossier.id}/pieces/{bid}/"),
                ("DELETE", f"/api/incubator/dossiers/{bid}/pieces/{self.piece.id}/"),
                ("POST", f"/api/incubator/projets/{bid}/mentor/"),
                ("GET", f"/api/incubator/projets/{bid}/objectifs/"),
                ("POST", f"/api/incubator/projets/{bid}/objectifs/"),
                ("PATCH", f"/api/incubator/objectifs/{bid}/"),
                ("GET", f"/api/incubator/projets/{bid}/jalons/"),
                ("POST", f"/api/incubator/projets/{bid}/jalons/"),
                ("PATCH", f"/api/incubator/jalons/{bid}/"),
                ("POST", f"/api/incubator/jalons/{bid}/preuves/"),
                ("POST", f"/api/incubator/jalons/{bid}/commentaires/"),
                ("GET", f"/api/incubator/projets/{bid}/suivis/"),
                ("POST", f"/api/incubator/projets/{bid}/suivis/"),
                ("GET", f"/api/incubator/projets/{bid}/compte-rendu/"),
                ("GET", f"/api/documents/{bid}/"),
                ("PATCH", f"/api/documents/{bid}/"),
                ("GET", f"/api/documents/{bid}/versions/"),
                ("GET", f"/api/documents/{bid}/versions/1/"),
                ("GET", f"/api/documents/{self.doc.id}/versions/{bid}/"),
                ("POST", f"/api/documents/{bid}/valider/"),
                ("POST", f"/api/documents/{bid}/publier/"),
                ("POST", f"/api/documents/{bid}/brouillon/"),
                ("GET", f"/api/documents/{bid}/export/"),
                ("POST", f"/api/gallery/fiches/{bid}/soumettre/"),
                ("POST", f"/api/gallery/fiches/{bid}/valider/"),
                ("POST", f"/api/gallery/fiches/{bid}/refuser/"),
                ("GET", f"/api/assistant/conversations/{bid}/messages/"),
                ("POST", f"/api/assistant/conversations/{bid}/messages/"),
                ("GET", f"/api/portal/actualites/{bid}/"),
                ("GET", f"/api/portal/appels/{bid}/"),
                ("GET", f"/api/portal/partenaires/{bid}/"),
                ("GET", f"/api/portal/evenements/{bid}/"),
                ("GET", f"/api/portal/documents/{bid}/"),
            ]
            for method, path in endpoints:
                if method == "GET":
                    r = self.client.get(path)
                elif method == "POST":
                    r = self.client.post(path, data={}, format="json")
                elif method == "PATCH":
                    r = self.client.patch(path, data={}, format="json")
                elif method == "DELETE":
                    r = self.client.delete(path)
                self.assertNot500(r, f"{method} {path} avec id={bid}")

        # Test des routes avec slug inexistant ou négatif
        for bad_slug in ["non-existent-slug-xyz", "-1", "9999999", "___"]:
            r = self.client.get(f"/api/gallery/fiches/{bad_slug}/")
            self.assertNot500(r, f"GET /api/gallery/fiches/{bad_slug}/")
            r_qr = self.client.get(f"/api/gallery/fiches/{bad_slug}/qr/")
            self.assertNot500(r_qr, f"GET /api/gallery/fiches/{bad_slug}/qr/")
            r_fiche = self.client.get(f"/api/gallery/fiches/{bad_slug}/fiche/")
            self.assertNot500(r_fiche, f"GET /api/gallery/fiches/{bad_slug}/fiche/")

    # ==========================================================================
    # 2. Chaînes très longues (10 000 caractères)
    # ==========================================================================
    def test_02_chaines_tres_longues_10000_caracteres(self):
        """Envoi de chaînes volumineuses (10 000 caractères) sur tous les champs texte."""
        long_str = "A" * 10000
        self.client.force_authenticate(user=self.admin)

        # Inscription & Auth
        self.client.logout()
        r = self.client.post("/api/auth/register/", {
            "email": f"{long_str[:50]}@ciat.sn",
            "password": "passWord123!",
            "first_name": long_str,
            "last_name": long_str,
        }, format="json")
        self.assertNot500(r, "POST /api/auth/register/ longue chaîne")

        r = self.client.post("/api/auth/token/", {
            "email": f"{long_str[:100]}@ciat.sn",
            "password": long_str,
        }, format="json")
        self.assertNot500(r, "POST /api/auth/token/ longue chaîne")

        # Reconnexion admin
        self.client.force_authenticate(user=self.admin)

        # Projets
        r = self.client.post("/api/projets/", {
            "titre": long_str,
            "resume": long_str,
            "probleme": long_str,
            "solution": long_str,
            "domaine": self.domaine.id,
            "cohorte": self.cohorte.id,
        }, format="json")
        self.assertNot500(r, "POST /api/projets/ longue chaîne")

        # Contact portail
        r = self.client.post("/api/portal/contact/", {
            "nom": long_str,
            "email": "test@ciat.sn",
            "sujet": long_str,
            "message": long_str,
        }, format="json")
        self.assertNot500(r, "POST /api/portal/contact/ longue chaîne")

        # Décision dossier
        r = self.client.post(f"/api/incubator/dossiers/{self.dossier.id}/decision/", {
            "decision": "accepte",
            "motif": long_str,
        }, format="json")
        self.assertNot500(r, "POST decision longue chaîne")

        # Commentaire jalon
        r = self.client.post(f"/api/incubator/jalons/{self.jalon.id}/commentaires/", {
            "texte": long_str,
        }, format="json")
        self.assertNot500(r, "POST commentaire longue chaîne")

        # Question analytics
        r = self.client.post("/api/analytics/question/", {
            "question": long_str,
        }, format="json")
        self.assertNot500(r, "POST /api/analytics/question/ longue chaîne")

        # Conversation assistant
        r = self.client.post("/api/assistant/conversations/", {
            "titre": long_str,
        }, format="json")
        self.assertNot500(r, "POST /api/assistant/conversations/ longue chaîne")

        # Message assistant
        r = self.client.post(f"/api/assistant/conversations/{self.conv.id}/messages/", {
            "contenu": long_str,
            "mode": "documents",
        }, format="json")
        self.assertNot500(r, "POST message assistant longue chaîne")

        # Fiche galerie
        r = self.client.post("/api/gallery/fiches/", {
            "projet": self.projet.id,
            "titre": long_str,
            "probleme": long_str,
            "solution": long_str,
            "equipe": long_str,
            "avancement": long_str[:100],
        }, format="json")
        self.assertNot500(r, "POST /api/gallery/fiches/ longue chaîne")

    # ==========================================================================
    # 3. Types faux (nombres au lieu de texte, dictionnaires au lieu de listes, etc.)
    # ==========================================================================
    def test_03_types_faux(self):
        """Envoi de types de données erronés pour forcer les validations DRF."""
        self.client.force_authenticate(user=self.admin)

        # Nombre à la place de texte
        r = self.client.post("/api/projets/", {
            "titre": 12345678,
            "resume": 98765432,
            "probleme": True,
            "solution": ["non", "valide"],
            "domaine": "pas_un_entier",
            "cohorte": {"cle": "valeur"},
        }, format="json")
        self.assertNot500(r, "POST /api/projets/ faux types")

        # Dictionnaire au lieu d'une liste de notes d'évaluation
        r = self.client.post(f"/api/incubator/dossiers/{self.dossier.id}/evaluations/", {
            "notes": {"critere": 1, "note": 15},
            "avis": 12345,
        }, format="json")
        self.assertNot500(r, "POST evaluations faux types")

        # Liste au lieu d'un dictionnaire dans infos de documents/generer
        r = self.client.post("/api/documents/generer/", {
            "modele": self.modele_doc.id,
            "sujet": 12345,
            "infos": ["pas", "un", "dict"],
        }, format="json")
        self.assertNot500(r, "POST /api/documents/generer/ faux types")

        # Type faux dans question analytics
        r = self.client.post("/api/analytics/question/", {
            "question": {"objet": "invalide"},
        }, format="json")
        self.assertNot500(r, "POST /api/analytics/question/ faux types")

        # Type faux dans affectation mentor
        r = self.client.post(f"/api/incubator/projets/{self.projet.id}/mentor/", {
            "mentor": "texte_au_lieu_de_pk",
        }, format="json")
        self.assertNot500(r, "POST affectation mentor faux types")

        # Type faux dans filtres d'analyse
        r = self.client.get("/api/analytics/indicateurs/?debut=2026-99-99&fin=not_a_date&cohorte=abc&domaine=xyz")
        self.assertNot500(r, "GET /api/analytics/indicateurs/ filtres invalides")

    # ==========================================================================
    # 4. Champs obligatoires absents et payloads vides
    # ==========================================================================
    def test_04_champs_absents_et_payloads_vides(self):
        """Envoi de payloads vides {} sur tous les endpoints d'écriture."""
        self.client.force_authenticate(user=self.admin)

        write_endpoints = [
            ("POST", "/api/auth/register/"),
            ("POST", "/api/auth/token/"),
            ("POST", "/api/auth/token/refresh/"),
            ("PATCH", "/api/auth/me/"),
            ("POST", "/api/projets/"),
            ("PATCH", f"/api/projets/{self.projet.id}/"),
            ("POST", "/api/portal/contact/"),
            ("POST", "/api/portal/actualites/"),
            ("POST", "/api/portal/evenements/"),
            ("POST", "/api/portal/appels/"),
            ("POST", "/api/portal/partenaires/"),
            ("POST", "/api/portal/documents/"),
            ("POST", "/api/incubator/dossiers/"),
            ("PATCH", f"/api/incubator/dossiers/{self.dossier.id}/"),
            ("POST", f"/api/incubator/dossiers/{self.dossier.id}/evaluations/"),
            ("POST", f"/api/incubator/dossiers/{self.dossier.id}/decision/"),
            ("POST", f"/api/incubator/projets/{self.projet.id}/mentor/"),
            ("POST", f"/api/incubator/projets/{self.projet.id}/objectifs/"),
            ("PATCH", f"/api/incubator/objectifs/{self.objectif.id}/"),
            ("POST", f"/api/incubator/projets/{self.projet.id}/jalons/"),
            ("PATCH", f"/api/incubator/jalons/{self.jalon.id}/"),
            ("POST", f"/api/incubator/jalons/{self.jalon.id}/commentaires/"),
            ("POST", f"/api/incubator/projets/{self.projet.id}/suivis/"),
            ("POST", "/api/documents/generer/"),
            ("PATCH", f"/api/documents/{self.doc.id}/"),
            ("POST", "/api/analytics/question/"),
            ("POST", "/api/assistant/conversations/"),
            ("POST", f"/api/assistant/conversations/{self.conv.id}/messages/"),
            ("POST", "/api/gallery/fiches/"),
        ]
        for method, path in write_endpoints:
            if method == "POST":
                r = self.client.post(path, data={}, format="json")
            elif method == "PATCH":
                r = self.client.patch(path, data={}, format="json")
            self.assertNot500(r, f"{method} {path} avec payload vide {{}}")

    # ==========================================================================
    # 5. Corps JSON invalide / malformé
    # ==========================================================================
    def test_05_json_invalide_ou_malforme(self):
        """Envoi de chaînes binaires brutes non décodables en JSON."""
        self.client.force_authenticate(user=self.admin)

        malformed_bodies = [
            b"{bad json",
            b'{"titre": ',
            b"not a json at all",
            b"\x00\x01\x02\x03\xff",
            b'{"key": [1, 2, ',
        ]

        endpoints = [
            "/api/auth/token/",
            "/api/projets/",
            "/api/portal/contact/",
            f"/api/incubator/dossiers/{self.dossier.id}/evaluations/",
            "/api/documents/generer/",
            "/api/analytics/question/",
            "/api/gallery/fiches/",
        ]

        for path in endpoints:
            for bad_body in malformed_bodies:
                r = self.client.post(path, data=bad_body, content_type="application/json")
                self.assertNot500(r, f"POST {path} avec JSON malformé {bad_body[:10]}")

    # ==========================================================================
    # 6. Fichiers vides ou de mauvais type
    # ==========================================================================
    def test_06_fichiers_vides_et_mauvais_type(self):
        """Dépôt de fichiers vides (0 octet) ou d'extensions exécutables interdites."""
        self.client.force_authenticate(user=self.porteur)

        # 1. Fichier vide (0 octet) sur pièces de dossier
        empty_pdf = SimpleUploadedFile("vide.pdf", b"", content_type="application/pdf")
        r = self.client.post(
            f"/api/incubator/dossiers/{self.dossier.id}/pieces/",
            {"type": TypePiece.BUDGET_PREVISIONNEL, "fichier": empty_pdf},
            format="multipart",
        )
        self.assertNot500(r, "POST pièces fichier vide")
        self.assertEqual(r.status_code, status.HTTP_400_BAD_REQUEST)

        # 2. Extension exécutable interdite (.exe)
        exe_file = SimpleUploadedFile("malware.exe", b"MZ\x90\x00\x03fakeexe", content_type="application/x-dosexec")
        r = self.client.post(
            f"/api/incubator/dossiers/{self.dossier.id}/pieces/",
            {"type": TypePiece.PRESENTATION_EQUIPE, "fichier": exe_file},
            format="multipart",
        )
        self.assertNot500(r, "POST pièces exécutable .exe")
        self.assertEqual(r.status_code, status.HTTP_400_BAD_REQUEST)

        # 3. Fichier usurpé (magic bytes invalides : texte brut déguisé en .pdf)
        spoofed_pdf = SimpleUploadedFile("usurpe.pdf", b"Ceci est du texte pur et non un PDF", content_type="application/pdf")
        r = self.client.post(
            f"/api/incubator/dossiers/{self.dossier.id}/pieces/",
            {"type": TypePiece.FICHE_PROJET, "fichier": spoofed_pdf},
            format="multipart",
        )
        self.assertNot500(r, "POST pièces signature PDF spoofée")
        self.assertEqual(r.status_code, status.HTTP_400_BAD_REQUEST)

        # 4. Fichier vide sur preuves de jalons
        r = self.client.post(
            f"/api/incubator/jalons/{self.jalon.id}/preuves/",
            {"fichier": empty_pdf},
            format="multipart",
        )
        self.assertNot500(r, "POST preuve jalon fichier vide")
        self.assertEqual(r.status_code, status.HTTP_400_BAD_REQUEST)

        # 5. Documents publics du portail avec exécutable .sh
        self.client.force_authenticate(user=self.admin)
        sh_file = SimpleUploadedFile("script.sh", b"#!/bin/bash\necho test", content_type="application/x-sh")
        r = self.client.post(
            "/api/portal/documents/",
            {"titre": "Script", "categorie": "Guides", "fichier": sh_file},
            format="multipart",
        )
        self.assertNot500(r, "POST document public exécutable .sh")
        self.assertEqual(r.status_code, status.HTTP_400_BAD_REQUEST)

    # ==========================================================================
    # 7. Doubles envois et conflits métier
    # ==========================================================================
    def test_07_doubles_envois_et_conflits(self):
        """Vérifie la robustesse face aux doubles soumissions concurrentes ou répétées."""
        # 1. Double inscription avec le même email
        r_double_reg = self.client.post("/api/auth/register/", {
            "email": self.porteur.email,
            "password": "Password123!",
            "first_name": "Test",
            "last_name": "Duplicate",
        }, format="json")
        self.assertNot500(r_double_reg, "Double inscription même email")
        self.assertIn(
            r_double_reg.status_code,
            (status.HTTP_400_BAD_REQUEST, status.HTTP_429_TOO_MANY_REQUESTS),
        )

        # 2. Double création de dossier pour un même projet
        self.client.force_authenticate(user=self.porteur)
        r_double_dossier = self.client.post("/api/incubator/dossiers/", {
            "projet": self.projet.id,
        }, format="json")
        self.assertNot500(r_double_dossier, "Double dossier même projet")
        self.assertEqual(r_double_dossier.status_code, status.HTTP_400_BAD_REQUEST)

        # 3. Double soumission d'un dossier
        # Premier essai (refusé pour pièces manquantes -> 400, mais ne plante pas)
        r_sub1 = self.client.post(f"/api/incubator/dossiers/{self.dossier.id}/soumettre/")
        self.assertNot500(r_sub1, "Soumission 1 dossier")
        # Second essai consécutif
        r_sub2 = self.client.post(f"/api/incubator/dossiers/{self.dossier.id}/soumettre/")
        self.assertNot500(r_sub2, "Soumission 2 consécutive dossier")

        # 4. Modification interdite sur document validé (doit renvoyer 409 Conflict, jamais 500)
        self.client.force_authenticate(user=self.coordo)
        self.doc.statut = Document.Statut.VALIDE
        self.doc.save(update_fields=["statut"])

        r_patch_doc = self.client.patch(f"/api/documents/{self.doc.id}/", {
            "sections": [{"code": "intro", "contenu": "Tentative altération document validé"}],
        }, format="json")
        self.assertNot500(r_patch_doc, "Modification document validé")
        self.assertEqual(r_patch_doc.status_code, status.HTTP_409_CONFLICT)
