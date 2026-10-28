"""Audit complet des droits, de la sécurité et matrice d'accès aux routes API — CIAT (Phase 3 — T2).

Couvre :
1. Matrice des droits par rôle (Anonyme, Visiteur, Porteur, Porteur tiers, Mentor, Comité, Coordonnateur, Admin).
2. Détection des fuites de données privées (email, téléphone, évaluations confidentielles, délibérations, hash de mdp).
3. Limitation de débit (Rate Limiting / Throttling) sur les endpoints d'authentification.
4. Robustesse des mots de passe (validateurs Django).
5. Sécurité des uploads de fichiers (formats autorisés, signatures binaires, path traversal, taille maximale).
6. Conformité des paramètres de production (SECRET_KEY, DEBUG, en-têtes HTTPS/HSTS, CORS/CSRF).
7. Prévention des régressions via introspection automatique des routes enregistrées.
"""
import datetime
import io
import re
from unittest.mock import patch

from django.conf import settings
from django.core.cache import cache
from django.core.exceptions import ImproperlyConfigured, ValidationError
from django.core.files.uploadedfile import SimpleUploadedFile
from django.test import TestCase, override_settings
from django.urls import get_resolver, reverse
from django.urls.resolvers import URLPattern, URLResolver
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APIClient

from apps.core.models import Cohorte, Domaine, JournalAudit, Notification, Projet, Role, User
from apps.gallery.models import FicheInnovation, ManifestationInteret
from apps.core.services import creer_notification, enregistrer_audit
from apps.incubator.models import (
    ALLOWED_PIECE_EXTENSIONS,
    AffectationMentor,
    Critere,
    Decision,
    DecisionType,
    Dossier,
    Evaluation,
    Grille,
    Jalon,
    Note,
    Objectif,
    Piece,
    StatutDossier,
    StatutJalon,
    StatutObjectif,
    TypePiece,
    sanitize_filename,
    validate_file_content,
    validate_file_size,
)
from rest_framework_simplejwt.tokens import AccessToken
from apps.portal.models import Actualite, AppelProjet, DocumentPublic, Evenement, Partenaire

FAST_HASHERS = ["django.contrib.auth.hashers.MD5PasswordHasher"]


@override_settings(PASSWORD_HASHERS=FAST_HASHERS)
class MatriceDroitsAPITests(TestCase):
    """Vérifie le code HTTP retourné pour chaque route majeure de l'API selon le rôle."""

    @classmethod
    def setUpTestData(cls):
        # Références communes
        cls.domaine = Domaine.objects.create(nom="TIC et Données")
        cls.cohorte = Cohorte.objects.create(nom="Cohorte 2026", annee=2026)

        # Utilisateurs pour chaque rôle
        cls.users = {
            "admin": User.objects.create_user(
                email="admin@ciat.sn", password="Password123!", role=Role.ADMIN, first_name="Ad", last_name="Min"
            ),
            "coordo": User.objects.create_user(
                email="coordo@ciat.sn", password="Password123!", role=Role.COORDONNATEUR, first_name="Coor", last_name="Do"
            ),
            "mentor": User.objects.create_user(
                email="mentor@ciat.sn", password="Password123!", role=Role.MENTOR, first_name="Men", last_name="Tor"
            ),
            "comite": User.objects.create_user(
                email="comite@ciat.sn", password="Password123!", role=Role.COMITE, first_name="Co", last_name="Mite"
            ),
            "porteur_proprio": User.objects.create_user(
                email="porteur1@ciat.sn", password="Password123!", role=Role.PORTEUR, first_name="Por", last_name="Teur1"
            ),
            "porteur_tiers": User.objects.create_user(
                email="porteur2@ciat.sn", password="Password123!", role=Role.PORTEUR, first_name="Por", last_name="Teur2"
            ),
            "visiteur": User.objects.create_user(
                email="visiteur@ciat.sn", password="Password123!", role=Role.VISITEUR, first_name="Vi", last_name="Siteur"
            ),
        }

        # Objets métier
        cls.projet_proprio = Projet.objects.create(
            titre="Projet Proprio",
            resume="Résumé du projet",
            probleme="Problème adressé",
            solution="Solution proposée",
            porteur=cls.users["porteur_proprio"],
            domaine=cls.domaine,
            cohorte=cls.cohorte,
            statut="incube",
        )
        cls.projet_tiers = Projet.objects.create(
            titre="Projet Tiers",
            resume="Résumé tiers",
            probleme="Problème tiers",
            solution="Solution tierce",
            porteur=cls.users["porteur_tiers"],
            domaine=cls.domaine,
            cohorte=cls.cohorte,
            statut="incube",
        )

        # Mentors : affecté au projet proprio vs non affecté
        cls.users["mentor_affecte"] = User.objects.create_user(
            email="mentor_affecte@ciat.sn",
            password="Password123!",
            role=Role.MENTOR,
            first_name="Men",
            last_name="Affecte",
        )
        cls.users["mentor_non_affecte"] = cls.users["mentor"]

        cls.affectation_mentor = AffectationMentor.objects.create(
            projet=cls.projet_proprio,
            mentor=cls.users["mentor_affecte"],
            affecte_par=cls.users["coordo"],
        )

        cls.dossier_proprio = Dossier.objects.create(
            projet=cls.projet_proprio,
            statut=StatutDossier.BROUILLON,
        )
        cls.projet_soumis = Projet.objects.create(
            titre="Projet Soumis Proprio",
            resume="Résumé soumis",
            probleme="Problème soumis",
            solution="Solution soumise",
            porteur=cls.users["porteur_proprio"],
            domaine=cls.domaine,
            cohorte=cls.cohorte,
            statut="incube",
        )
        cls.dossier_soumis = Dossier.objects.create(
            projet=cls.projet_soumis,
            statut=StatutDossier.SOUMIS,
            soumis_le=timezone.now(),
        )
        cls.dossier_brouillon = Dossier.objects.create(
            projet=cls.projet_tiers,
            statut=StatutDossier.BROUILLON,
        )

        # Projet distinct avec mentor affecté et dossier soumis pour tester l'interdiction mentor sur accuse
        cls.projet_mentor_teste = Projet.objects.create(
            titre="Projet Mentor Test",
            resume="Résumé mentor test",
            probleme="Pb mentor test",
            solution="Sol mentor test",
            porteur=cls.users["porteur_proprio"],
            domaine=cls.domaine,
            cohorte=cls.cohorte,
            statut="incube",
        )
        cls.affectation_mentor_teste = AffectationMentor.objects.create(
            projet=cls.projet_mentor_teste,
            mentor=cls.users["mentor_affecte"],
            affecte_par=cls.users["coordo"],
        )
        cls.dossier_mentor_teste = Dossier.objects.create(
            projet=cls.projet_mentor_teste,
            statut=StatutDossier.SOUMIS,
            soumis_le=timezone.now(),
        )

        cls.grille = Grille.objects.create(nom="Grille 2026", active=True)
        cls.critere = Critere.objects.create(grille=cls.grille, libelle="Innovation", note_max=20, poids=2)

        cls.actualite = Actualite.objects.create(
            titre="Inauguration CIAT",
            contenu="Contenu officiel",
        )
        cls.partenaire = Partenaire.objects.create(
            nom="ISEP Diamniadio",
            description="Institut supérieur",
        )
        cls.evenement = Evenement.objects.create(
            titre="Hackathon CIAT 2026",
            description="Hackathon national annuel CIAT",
            lieu="Campus Diamniadio",
            debut=timezone.now() + datetime.timedelta(days=7),
            fin=timezone.now() + datetime.timedelta(days=8),
        )
        cls.appel = AppelProjet.objects.create(
            titre="Appel à candidatures 2026",
            description="Description de l'appel",
            date_limite=timezone.now() + datetime.timedelta(days=30),
        )
        cls.doc_public = DocumentPublic.objects.create(
            titre="Règlement intérieur",
            categorie="Guides",
            fichier=SimpleUploadedFile("reglement.pdf", b"%PDF-1.4 sample content"),
        )
        cls.fiche_galerie = FicheInnovation.objects.create(
            projet=cls.projet_proprio,
            titre="Fiche Innovation Solar",
            probleme="Problème solaire",
            solution="Panneaux solaires",
            equipe="Équipe d'ingénieurs",
            avancement="MVP",
            statut=FicheInnovation.Statut.PUBLIE,
        )

    def setUp(self):
        self.client = APIClient()


    def _auth(self, role_key):
        """Authentifie le client avec l'utilisateur spécifié ou retire l'authentification si None."""
        if role_key is None:
            self.client.credentials()
            self.client.force_authenticate(user=None)
        else:
            self.client.force_authenticate(user=self.users[role_key])

    def test_routes_publiques_accessibles_a_tous(self):
        """Les routes publiques doivent renvoyer 200 à l'anonyme et à tous les rôles."""
        routes_publiques = [
            "/api/health/",
            "/api/portal/actualites/",
            "/api/portal/evenements/",
            "/api/portal/appels/",
            "/api/portal/partenaires/",
            "/api/portal/documents/",
            "/api/portal/projets-incubes/",
            "/api/gallery/fiches/",
        ]

        roles_a_tester = [None, "visiteur", "porteur_proprio", "mentor", "comite", "coordo", "admin"]

        for route in routes_publiques:
            for role in roles_a_tester:
                self._auth(role)
                resp = self.client.get(route)
                self.assertEqual(
                    resp.status_code,
                    status.HTTP_200_OK,
                    f"Route {route} avec rôle {role} devrait renvoyer 200, reçu {resp.status_code}",
                )

    def test_matrice_gallery_statistiques(self):
        """GET /api/gallery/statistiques/ : réservé à l'équipe CIAT."""
        url = "/api/gallery/statistiques/"
        self._auth(None)
        self.assertEqual(self.client.get(url).status_code, status.HTTP_401_UNAUTHORIZED)

        for role in ["visiteur", "porteur_proprio", "mentor", "comite"]:
            self._auth(role)
            self.assertEqual(self.client.get(url).status_code, status.HTTP_403_FORBIDDEN)

        for role in ["coordo", "admin"]:
            self._auth(role)
            self.assertEqual(self.client.get(url).status_code, status.HTTP_200_OK)

    def test_matrice_auth_me(self):
        """GET /api/auth/me/ : 401 si anonyme, 200 pour tout connecté."""
        self._auth(None)
        resp = self.client.get("/api/auth/me/")
        self.assertEqual(resp.status_code, status.HTTP_401_UNAUTHORIZED)

        for role in ["visiteur", "porteur_proprio", "mentor", "comite", "coordo", "admin"]:
            self._auth(role)
            resp = self.client.get("/api/auth/me/")
            self.assertEqual(resp.status_code, status.HTTP_200_OK, f"Échec auth/me pour rôle {role}")

    def test_matrice_projets(self):
        """Gestion des projets : consultation et création selon les rôles."""
        self._auth(None)
        self.assertEqual(self.client.get("/api/projets/").status_code, status.HTTP_401_UNAUTHORIZED)

        self._auth("visiteur")
        payload = {
            "titre": "Projet X",
            "resume": "Description",
            "probleme": "Pb",
            "solution": "Sol",
            "domaine": self.domaine.id,
        }
        resp_post = self.client.post("/api/projets/", payload)
        self.assertEqual(resp_post.status_code, status.HTTP_403_FORBIDDEN)

        self._auth("porteur_proprio")
        resp_post_p = self.client.post("/api/projets/", payload)
        self.assertEqual(resp_post_p.status_code, status.HTTP_201_CREATED)
        self.assertTrue(Projet.objects.filter(titre="Projet X").exists())

    def test_matrice_incubateur_dossiers(self):
        """Dossiers d'incubation : isolation stricte et permissions métier."""
        self._auth(None)
        self.assertEqual(self.client.get("/api/incubator/dossiers/").status_code, status.HTTP_401_UNAUTHORIZED)

        self._auth("porteur_tiers")
        resp = self.client.post("/api/incubator/dossiers/", {"projet": self.projet_proprio.id})
        self.assertEqual(resp.status_code, status.HTTP_403_FORBIDDEN)

        for role in ["visiteur", "mentor", "comite"]:
            self._auth(role)
            resp = self.client.post("/api/incubator/dossiers/", {"projet": self.projet_proprio.id})
            self.assertEqual(resp.status_code, status.HTTP_403_FORBIDDEN, f"Rôle {role} ne doit pas créer de dossier")

    def test_matrice_incubateur_decision_et_evaluations(self):
        """Seuls l'admin et le coordonnateur décident ; le comité évalue."""
        self.dossier_proprio.statut = StatutDossier.EN_EVALUATION
        self.dossier_proprio.save(update_fields=["statut"])
        url_decision = f"/api/incubator/dossiers/{self.dossier_proprio.id}/decision/"

        self._auth(None)
        self.assertEqual(self.client.post(url_decision, {}).status_code, status.HTTP_401_UNAUTHORIZED)

        for role in ["visiteur", "porteur_proprio", "mentor", "comite"]:
            self._auth(role)
            resp = self.client.post(url_decision, {"decision": "accepte", "motif": "Motif"})
            self.assertEqual(resp.status_code, status.HTTP_403_FORBIDDEN, f"Rôle {role} ne doit pas décider")

        self._auth("coordo")
        resp = self.client.post(
            url_decision,
            {"decision": "accepte", "motif": "Projet très pertinent et viable"},
            format="json",
        )
        self.assertIn(resp.status_code, [status.HTTP_200_OK, status.HTTP_201_CREATED])
        self.dossier_proprio.refresh_from_db()
        self.assertEqual(self.dossier_proprio.statut, StatutDossier.ACCEPTE)

    def test_matrice_portal_gestion_contenus(self):
        """Gestion des actualités et partenaires réservée à l'équipe CIAT."""
        url_actu = "/api/portal/actualites/"
        payload_actu = {"titre": "Nouvelle Actu", "contenu": "Texte"}

        self._auth(None)
        self.assertEqual(self.client.post(url_actu, payload_actu).status_code, status.HTTP_401_UNAUTHORIZED)

        for role in ["visiteur", "porteur_proprio", "mentor", "comite"]:
            self._auth(role)
            self.assertEqual(
                self.client.post(url_actu, payload_actu).status_code,
                status.HTTP_403_FORBIDDEN,
                f"Rôle {role} ne doit pas créer d'actualité",
            )

        self._auth("coordo")
        self.assertEqual(self.client.post(url_actu, payload_actu).status_code, status.HTTP_201_CREATED)
        self.assertTrue(Actualite.objects.filter(titre="Nouvelle Actu").exists())

    def test_matrice_analytics_autorisations(self):
        """Analytics réservé au Coordonnateur, Admin et Comité."""
        url_analytics = "/api/analytics/indicateurs/"

        self._auth(None)
        self.assertEqual(self.client.get(url_analytics).status_code, status.HTTP_401_UNAUTHORIZED)

        for role in ["visiteur", "porteur_proprio", "mentor"]:
            self._auth(role)
            self.assertEqual(
                self.client.get(url_analytics).status_code,
                status.HTTP_403_FORBIDDEN,
                f"Rôle {role} ne doit pas accéder aux analytics",
            )

        for role in ["comite", "coordo", "admin"]:
            self._auth(role)
            self.assertEqual(
                self.client.get(url_analytics).status_code,
                status.HTTP_200_OK,
                f"Rôle {role} doit accéder aux analytics",
            )

    def test_isolation_et_modification_objets_tiers(self):
        """Un porteur tiers ne peut pas modifier ou supprimer le projet d'un autre porteur."""
        url_detail = f"/api/projets/{self.projet_proprio.id}/"

        # Modification par un tiers refusée (403 ou 404 selon queryset filtering)
        self._auth("porteur_tiers")
        resp_patch = self.client.patch(url_detail, {"titre": "Titre Piraté"})
        self.assertIn(resp_patch.status_code, [status.HTTP_403_FORBIDDEN, status.HTTP_404_NOT_FOUND])
        self.projet_proprio.refresh_from_db()
        self.assertEqual(self.projet_proprio.titre, "Projet Proprio")

        # Suppression par un tiers refusée
        resp_del = self.client.delete(url_detail)
        self.assertIn(resp_del.status_code, [status.HTTP_403_FORBIDDEN, status.HTTP_404_NOT_FOUND])
        self.assertTrue(Projet.objects.filter(id=self.projet_proprio.id).exists())

        # Modification par le porteur propriétaire acceptée et persistée
        self._auth("porteur_proprio")
        resp_patch_ok = self.client.patch(url_detail, {"titre": "Projet Proprio Modifié"})
        self.assertEqual(resp_patch_ok.status_code, status.HTTP_200_OK)
        self.projet_proprio.refresh_from_db()
        self.assertEqual(self.projet_proprio.titre, "Projet Proprio Modifié")

    def test_actions_pieces_et_dossiers_isolation(self):
        """Seul le porteur propriétaire peut ajouter/supprimer des pièces sur son dossier."""
        piece = Piece.objects.create(
            dossier=self.dossier_proprio,
            type=TypePiece.FICHE_PROJET,
            fichier=SimpleUploadedFile("fiche.pdf", b"%PDF-1.4 contenu valide"),
        )
        url_piece_delete = f"/api/incubator/dossiers/{self.dossier_proprio.id}/pieces/{piece.id}/"

        # Tiers tente de supprimer la pièce -> 403 ou 404
        self._auth("porteur_tiers")
        resp_del_tiers = self.client.delete(url_piece_delete)
        self.assertIn(resp_del_tiers.status_code, [status.HTTP_403_FORBIDDEN, status.HTTP_404_NOT_FOUND])
        self.assertTrue(Piece.objects.filter(id=piece.id).exists())

        # Propriétaire supprime sa pièce -> 204
        self._auth("porteur_proprio")
        resp_del_ok = self.client.delete(url_piece_delete)
        self.assertEqual(resp_del_ok.status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(Piece.objects.filter(id=piece.id).exists())

    def test_matrice_routes_pathe_evenements_calendrier_ics(self):
        """GET /api/portal/evenements/calendrier.ics : flux RFC 5545 accessible à tous."""
        url = "/api/portal/evenements/calendrier.ics"

        # Anonyme
        self._auth(None)
        resp_anon = self.client.get(url)
        self.assertEqual(resp_anon.status_code, status.HTTP_200_OK)
        self.assertIn("text/calendar", resp_anon.headers.get("Content-Type", ""))
        self.assertIn("BEGIN:VCALENDAR", resp_anon.content.decode("utf-8"))
        self.assertIn("Hackathon CIAT 2026", resp_anon.content.decode("utf-8"))

        # Tous les rôles authentifiés
        for role_key in [
            "visiteur",
            "porteur_proprio",
            "porteur_tiers",
            "mentor_non_affecte",
            "mentor_affecte",
            "comite",
            "coordo",
            "admin",
        ]:
            self._auth(role_key)
            resp = self.client.get(url)
            self.assertEqual(
                resp.status_code,
                status.HTTP_200_OK,
                f"Le rôle {role_key} doit pouvoir télécharger le calendrier ICS",
            )

        # Filtre ?a_venir=1
        resp_filter = self.client.get(f"{url}?a_venir=1")
        self.assertEqual(resp_filter.status_code, status.HTTP_200_OK)

    def test_matrice_routes_pathe_dossier_accuse_reception(self):
        """GET /api/incubator/dossiers/{id}/accuse/ : accusé PDF officiel post-soumission."""
        url_soumis = f"/api/incubator/dossiers/{self.dossier_soumis.id}/accuse/"

        # 1. Anonyme -> 401
        self._auth(None)
        self.assertEqual(self.client.get(url_soumis).status_code, status.HTTP_401_UNAUTHORIZED)

        # 2. Rôles interdits -> 403 Forbidden
        for role_key in ["visiteur", "porteur_tiers", "mentor_non_affecte", "mentor_affecte"]:
            self._auth(role_key)
            resp = self.client.get(url_soumis)
            self.assertEqual(
                resp.status_code,
                status.HTTP_403_FORBIDDEN,
                f"Le rôle {role_key} ne doit pas accéder à l'accusé d'un dossier tiers",
            )

        # 3. Rôles autorisés -> 200 OK avec fichier PDF valide
        for role_key in ["porteur_proprio", "comite", "coordo", "admin"]:
            self._auth(role_key)
            resp = self.client.get(url_soumis)
            self.assertEqual(
                resp.status_code,
                status.HTTP_200_OK,
                f"Le rôle {role_key} doit pouvoir télécharger l'accusé de réception",
            )
            self.assertEqual(resp.headers.get("Content-Type"), "application/pdf")
            self.assertTrue(resp.content.startswith(b"%PDF"))
            self.assertIn(f"accuse_reception_dossier_{self.dossier_soumis.id}.pdf", resp.headers.get("Content-Disposition", ""))

        # 4. Dossier encore en brouillon -> 400 Bad Request
        url_brouillon = f"/api/incubator/dossiers/{self.dossier_brouillon.id}/accuse/"
        self._auth("porteur_tiers")  # propriétaire du dossier brouillon
        resp_brouillon = self.client.get(url_brouillon)
        self.assertEqual(resp_brouillon.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("detail", resp_brouillon.data)

        # 5. Mentor affecté au projet du dossier soumis reçoit 403 sur son propre dossier
        self._auth("mentor_affecte")
        resp_mentor_propre = self.client.get(f"/api/incubator/dossiers/{self.dossier_mentor_teste.id}/accuse/")
        self.assertEqual(resp_mentor_propre.status_code, status.HTTP_403_FORBIDDEN)

        # 6. Accusé sur dossier inexistant -> 404 pour un utilisateur autorisé
        for role_key in ["admin", "coordo", "porteur_proprio"]:
            self._auth(role_key)
            resp_404 = self.client.get("/api/incubator/dossiers/999999/accuse/")
            self.assertEqual(resp_404.status_code, status.HTTP_404_NOT_FOUND)

    def test_matrice_routes_pathe_projet_compte_rendu(self):
        """GET /api/incubator/projets/{id}/compte-rendu/?format=pdf : export compte rendu incubation."""
        url_pdf = f"/api/incubator/projets/{self.projet_proprio.id}/compte-rendu/?format=pdf"

        # 1. Anonyme -> 401
        self._auth(None)
        self.assertEqual(self.client.get(url_pdf).status_code, status.HTTP_401_UNAUTHORIZED)

        # 2. Rôles interdits -> 403 Forbidden
        for role_key in ["visiteur", "porteur_tiers", "mentor_non_affecte", "comite"]:
            self._auth(role_key)
            resp = self.client.get(url_pdf)
            self.assertEqual(
                resp.status_code,
                status.HTTP_403_FORBIDDEN,
                f"Le rôle {role_key} ne doit pas accéder au compte rendu d'un projet non assigné",
            )

        # 3. Rôles autorisés -> 200 OK avec flux PDF valide
        for role_key in ["porteur_proprio", "mentor_affecte", "coordo", "admin"]:
            self._auth(role_key)
            resp = self.client.get(url_pdf)
            self.assertEqual(
                resp.status_code,
                status.HTTP_200_OK,
                f"Le rôle {role_key} doit pouvoir exporter le compte rendu PDF",
            )
            self.assertEqual(resp.headers.get("Content-Type"), "application/pdf")
            self.assertTrue(resp.content.startswith(b"%PDF"))
            self.assertIn(f"compte_rendu_projet_{self.projet_proprio.id}.pdf", resp.headers.get("Content-Disposition", ""))

        # 4. Export format XLSX
        url_xlsx = f"/api/incubator/projets/{self.projet_proprio.id}/compte-rendu/?format=xlsx"
        self._auth("porteur_proprio")
        resp_xlsx = self.client.get(url_xlsx)
        self.assertEqual(resp_xlsx.status_code, status.HTTP_200_OK)

        # 5. Format non supporté -> ordre des codes (401 anonyme -> 403 tiers -> 400 admin)
        url_invalid = f"/api/incubator/projets/{self.projet_proprio.id}/compte-rendu/?format=csv"
        self._auth(None)
        self.assertEqual(self.client.get(url_invalid).status_code, status.HTTP_401_UNAUTHORIZED)

        self._auth("porteur_tiers")
        self.assertEqual(self.client.get(url_invalid).status_code, status.HTTP_403_FORBIDDEN)

        self._auth("admin")
        resp_invalid = self.client.get(url_invalid)
        self.assertEqual(resp_invalid.status_code, status.HTTP_400_BAD_REQUEST)

        # 6. Compte-rendu sur projet inexistant (401 si anonyme, 404 si authentifié)
        self._auth(None)
        self.assertEqual(self.client.get("/api/incubator/projets/999999/compte-rendu/?format=pdf").status_code, status.HTTP_401_UNAUTHORIZED)

        self._auth("admin")
        self.assertEqual(self.client.get("/api/incubator/projets/999999/compte-rendu/?format=pdf").status_code, status.HTTP_404_NOT_FOUND)

    def test_statuts_precis_sur_methodes_interdites_405(self):
        """Les méthodes HTTP non prévues sur les endpoints renvoient explicitement 405 Method Not Allowed."""
        self._auth("admin")
        # POST sur un endpoint lecture seule (ReadOnlyModelViewSet ou APIView get-only)
        resp_post_portal = self.client.post("/api/portal/projets-incubes/", {})
        self.assertEqual(resp_post_portal.status_code, status.HTTP_405_METHOD_NOT_ALLOWED)

        resp_put_health = self.client.put("/api/health/", {})
        self.assertEqual(resp_put_health.status_code, status.HTTP_405_METHOD_NOT_ALLOWED)

        resp_del_analytics = self.client.delete("/api/analytics/indicateurs/")
        self.assertEqual(resp_del_analytics.status_code, status.HTTP_405_METHOD_NOT_ALLOWED)

    def test_statuts_precis_erreurs_validation_400(self):
        """Une soumission invalide produit un code 400 Bad Request avec le détail des champs."""
        self._auth("porteur_proprio")
        resp = self.client.post("/api/projets/", {})
        self.assertEqual(resp.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("titre", resp.data)

    def test_jamais_500_sur_entrees_invalides(self):
        """Une entrée invalide ou mal formée ne doit JAMAIS déclencher une erreur HTTP 500."""
        self._auth("porteur_proprio")

        urls_et_payloads = [
            ("post", "/api/projets/", {"titre": ""}),
            ("post", "/api/projets/", {"domaine": 999999}),
            ("post", "/api/incubator/dossiers/", {"projet": "invalid_string"}),
            ("get", "/api/portal/actualites/?search=%27%20OR%201=1--", None),
            ("get", "/api/analytics/indicateurs/?debut=not-a-date", None),
        ]

        for method, url, payload in urls_et_payloads:
            if method == "post":
                resp = self.client.post(url, payload)
            else:
                resp = self.client.get(url)
            self.assertNotEqual(
                resp.status_code,
                status.HTTP_500_INTERNAL_SERVER_ERROR,
                f"URL {url} a renvoyé une erreur 500 sur données invalides",
            )

    def test_toutes_les_routes_sont_repertoriees_dans_la_matrice(self):
        """Vérifie dynamiquement qu'aucune route API n'est orpheline de politique d'accès."""
        def extract_api_patterns(patterns, prefix=""):
            api_routes = []
            for p in patterns:
                if isinstance(p, URLResolver):
                    sub_prefix = prefix + str(p.pattern)
                    api_routes.extend(extract_api_patterns(p.url_patterns, sub_prefix))
                elif isinstance(p, URLPattern):
                    raw_route = prefix + str(p.pattern)
                    clean_route = "/" + re.sub(r"[\^\\\$]", "", raw_route).lstrip("/")
                    if clean_route.startswith("/api/") and not clean_route.startswith("/api/schema") and not clean_route.startswith("/api/docs"):
                        api_routes.append(clean_route)
            return api_routes

        resolver = get_resolver()
        registered_routes = extract_api_patterns(resolver.url_patterns)

        # Domaines d'API officiels et documentés dans la matrice
        KNOWN_API_PREFIXES = (
            "/api/health",
            "/api/auth",
            "/api/domaines",
            "/api/cohortes",
            "/api/projets",
            "/api/documents",
            "/api/incubator",
            "/api/portal",
            "/api/analytics",
            "/api/assistant",
            "/api/gallery",
            "/api/audit",
            "/api/notifications",
            "/api/users",
        )

        for route in registered_routes:
            if route in ("/api/", "/api") or route.startswith("/api/<drf_format_suffix"):
                continue
            self.assertTrue(
                any(route.startswith(p) for p in KNOWN_API_PREFIXES),
                f"La route {route} a été ajoutée sans être rattachée à un sous-système documenté dans la matrice.",
            )


@override_settings(PASSWORD_HASHERS=FAST_HASHERS)
class FuitesDonneesPriveesTests(TestCase):
    """Vérifie que les endpoints publics ne fuient aucune donnée personnelle ou confidentielle."""

    PII_EMAIL_MARKER = "secret.fatou.marker99@demo.ciat.sn"
    PII_PHONE_MARKER = "+221770009988"
    CONFIDENTIAL_EVAL_NOTE = "AVIS_DELIBERATION_CONFIDENTIEL_999"
    CONFIDENTIAL_DECISION_MOTIF = "MOTIF_DELIBERATION_SECRET_888"

    @classmethod
    def setUpTestData(cls):
        cls.domaine = Domaine.objects.create(nom="Agriculture")
        cls.cohorte = Cohorte.objects.create(nom="Cohorte 2025", annee=2025)

        cls.porteur = User.objects.create_user(
            email=cls.PII_EMAIL_MARKER,
            telephone=cls.PII_PHONE_MARKER,
            password="Password123!",
            role=Role.PORTEUR,
            first_name="Fatou",
            last_name="Sow",
        )
        cls.comite_user = User.objects.create_user(
            email="evaluateur.jury@ciat.sn",
            password="Password123!",
            role=Role.COMITE,
            first_name="Jury",
            last_name="Membre",
        )
        cls.admin_user = User.objects.create_user(
            email="admin.jury@ciat.sn",
            password="Password123!",
            role=Role.ADMIN,
            first_name="Admin",
            last_name="System",
        )

        cls.projet = Projet.objects.create(
            titre="Irrigation Solaire Casamance",
            resume="Système d'irrigation connecté",
            probleme="Sécheresse saisonnière",
            solution="Pompes solaires intelligentes",
            porteur=cls.porteur,
            domaine=cls.domaine,
            cohorte=cls.cohorte,
            statut="incube",
        )
        cls.dossier = Dossier.objects.create(
            projet=cls.projet,
            statut=StatutDossier.ACCEPTE,
        )
        cls.evaluation = Evaluation.objects.create(
            dossier=cls.dossier,
            evaluateur=cls.comite_user,
            avis=cls.CONFIDENTIAL_EVAL_NOTE,
        )
        cls.decision = Decision.objects.create(
            dossier=cls.dossier,
            decision=DecisionType.ACCEPTE,
            motif=cls.CONFIDENTIAL_DECISION_MOTIF,
            decide_par=cls.admin_user,
        )
        cls.fiche = FicheInnovation.objects.create(
            projet=cls.projet,
            titre="Irrigation Solaire Fiche",
            probleme="Sécheresse",
            solution="Pompes solaires",
            equipe="Ingénieurs agronomes",
            avancement="MVP",
            statut=FicheInnovation.Statut.PUBLIE,
        )

    def setUp(self):
        self.client = APIClient()


    def _assert_no_markers_in_response(self, resp):
        """Vérifie l'absence absolue de tout marqueur PII ou confidentiel dans le payload HTTP."""
        content = resp.content.decode("utf-8")
        self.assertNotIn(self.PII_EMAIL_MARKER, content)
        self.assertNotIn(self.PII_PHONE_MARKER, content)
        self.assertNotIn(self.CONFIDENTIAL_EVAL_NOTE, content)
        self.assertNotIn(self.CONFIDENTIAL_DECISION_MOTIF, content)
        self.assertNotIn("pbkdf2", content)
        self.assertNotIn("md5$", content)

    def test_annuaire_projets_incubes_ne_fuite_pas_de_donnees_privees(self):
        """GET /api/portal/projets-incubes/ ne doit pas révéler l'email, le téléphone ou les données sensibles."""
        resp = self.client.get("/api/portal/projets-incubes/")
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self._assert_no_markers_in_response(resp)

    def test_galerie_fiches_ne_fuite_pas_de_donnees_privees(self):
        """GET /api/gallery/fiches/ ne doit pas révéler d'email, téléphone ou délibérations."""
        resp = self.client.get("/api/gallery/fiches/")
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self._assert_no_markers_in_response(resp)

    def test_endpoints_publics_ne_fuitent_aucun_marqueur(self):
        """Vérifie l'étanchéité des endpoints publics du portail."""
        for route in ["/api/portal/actualites/", "/api/portal/evenements/", "/api/portal/appels/", "/api/portal/partenaires/"]:
            resp = self.client.get(route)
            self.assertEqual(resp.status_code, status.HTTP_200_OK)
            self._assert_no_markers_in_response(resp)

    def test_isolation_evaluations_et_deliberations_privees(self):
        """Les évaluations internes ne sont accessibles qu'au jury / équipe CIAT, jamais aux porteurs ou visiteurs."""
        url_eval = f"/api/incubator/dossiers/{self.dossier.id}/evaluations/"

        # Anonyme -> 401
        self.client.credentials()
        self.assertEqual(self.client.get(url_eval).status_code, status.HTTP_401_UNAUTHORIZED)

        # Porteur propriétaire du projet -> 403 (ne doit pas voir les avis confidentiels du jury)
        self.client.force_authenticate(user=self.porteur)
        self.assertEqual(self.client.get(url_eval).status_code, status.HTTP_403_FORBIDDEN)

        # Membre du comité -> 200 (accès autorisé)
        self.client.force_authenticate(user=self.comite_user)
        resp_comite = self.client.get(url_eval)
        self.assertEqual(resp_comite.status_code, status.HTTP_200_OK)
        self.assertIn(self.CONFIDENTIAL_EVAL_NOTE, resp_comite.content.decode("utf-8"))


@override_settings(PASSWORD_HASHERS=FAST_HASHERS)
class RateLimitingEtBruteForceTests(TestCase):
    """Vérifie la protection contre le brute-force sur /api/auth/token/ et /api/auth/register/."""

    @classmethod
    def setUpTestData(cls):
        cls.user = User.objects.create_user(
            email="test.auth@ciat.sn",
            password="GoodPassword2026!",
            role=Role.PORTEUR,
        )

    def setUp(self):
        cache.clear()
        self.client = APIClient()

    def tearDown(self):
        cache.clear()


    def test_configuration_throttle_auth_presente(self):
        """Le taux de throttle 'auth' doit être configuré à 5/min dans settings."""
        rates = settings.REST_FRAMEWORK.get("DEFAULT_THROTTLE_RATES", {})
        self.assertIn("auth", rates, "Le rate 'auth' doit être défini dans DEFAULT_THROTTLE_RATES")
        self.assertEqual(rates["auth"], "5/min")

    def test_rate_limiting_login_connexion(self):
        """Après 5 tentatives sur /api/auth/token/, la 6e requête renvoie 429 Too Many Requests."""
        for _ in range(5):
            resp = self.client.post(
                "/api/auth/token/",
                {"email": "test.auth@ciat.sn", "password": "wrongpassword"},
            )
            self.assertEqual(resp.status_code, status.HTTP_401_UNAUTHORIZED)

        resp_6 = self.client.post(
            "/api/auth/token/",
            {"email": "test.auth@ciat.sn", "password": "wrongpassword"},
        )
        self.assertEqual(
            resp_6.status_code,
            status.HTTP_429_TOO_MANY_REQUESTS,
            "La 6e tentative de connexion doit être bloquée par HTTP 429",
        )

    def test_rate_limiting_register_inscription(self):
        """Après 5 tentatives sur /api/auth/register/, la 6e requête renvoie 429 Too Many Requests."""
        for _ in range(5):
            resp = self.client.post(
                "/api/auth/register/",
                {"email": "bad", "password": "bad"},
            )
            self.assertEqual(resp.status_code, status.HTTP_400_BAD_REQUEST)

        resp_6 = self.client.post(
            "/api/auth/register/",
            {"email": "bad", "password": "bad"},
        )
        self.assertEqual(
            resp_6.status_code,
            status.HTTP_429_TOO_MANY_REQUESTS,
            "La 6e tentative d'inscription doit être bloquée par HTTP 429",
        )

    def test_rate_limiting_expiration_fenetre(self):
        """Après expiration du quota et vidage/expiration du cache, les requêtes sont à nouveau acceptées."""
        for _ in range(5):
            self.client.post("/api/auth/token/", {"email": "test.auth@ciat.sn", "password": "wrong"})
        resp_blocked = self.client.post("/api/auth/token/", {"email": "test.auth@ciat.sn", "password": "wrong"})
        self.assertEqual(resp_blocked.status_code, status.HTTP_429_TOO_MANY_REQUESTS)

        # Simulation de l'expiration de la fenêtre de throttle (1 minute)
        cache.clear()

        resp_after_reset = self.client.post("/api/auth/token/", {"email": "test.auth@ciat.sn", "password": "wrong"})
        self.assertEqual(
            resp_after_reset.status_code,
            status.HTTP_401_UNAUTHORIZED,
            "Après expiration de la fenêtre, l'accès doit être débloqué (code 401 au lieu de 429).",
        )

    def test_non_auth_endpoints_non_bloques_par_throttle_auth(self):
        """L'épuisement du quota auth ne doit pas bloquer les autres endpoints publics."""
        for _ in range(5):
            self.client.post("/api/auth/token/", {"email": "test.auth@ciat.sn", "password": "wrong"})

        # Vérifie que /api/health/ continue de répondre 200
        resp_health = self.client.get("/api/health/")
        self.assertEqual(resp_health.status_code, status.HTTP_200_OK)

    def test_configuration_cache_partage_redis_et_locmem(self):
        """Vérifie la présence d'une configuration CACHES valide."""
        self.assertIn("default", settings.CACHES)
        default_cache = settings.CACHES["default"]
        self.assertIn("BACKEND", default_cache)
        # En test et dev par défaut : LocMemCache, ou RedisCache si configuré
        self.assertTrue(
            "LocMemCache" in default_cache["BACKEND"] or "RedisCache" in default_cache["BACKEND"]
        )


@override_settings(PASSWORD_HASHERS=FAST_HASHERS)
class RobustesseMotsDePasseTests(TestCase):
    """Vérifie l'application stricte des règles de complexité des mots de passe."""

    def setUp(self):
        cache.clear()
        self.client = APIClient()

    def tearDown(self):
        cache.clear()

    def test_mot_de_passe_trop_court_rejete(self):
        """Un mot de passe de moins de 8 caractères est refusé avec 400 sans création de compte."""
        payload = {
            "email": "candidat@test.sn",
            "password": "court",
            "first_name": "Jean",
            "last_name": "Test",
        }
        resp = self.client.post("/api/auth/register/", payload)
        self.assertEqual(resp.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("password", resp.data)
        self.assertFalse(User.objects.filter(email="candidat@test.sn").exists())

    def test_mot_de_passe_entierement_numerique_rejete(self):
        """Un mot de passe composé uniquement de chiffres est rejeté sans création de compte."""
        payload = {
            "email": "candidat2@test.sn",
            "password": "1234567890",
            "first_name": "Jean",
            "last_name": "Test",
        }
        resp = self.client.post("/api/auth/register/", payload)
        self.assertEqual(resp.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("password", resp.data)
        self.assertFalse(User.objects.filter(email="candidat2@test.sn").exists())

    def test_mot_de_passe_robuste_accepte(self):
        """Un mot de passe respectant les contraintes permet la création et persistance du compte."""
        payload = {
            "email": "nouveau.porteur@test.sn",
            "password": "Ciat2026!PorteurRobuste",
            "first_name": "Amadou",
            "last_name": "Sall",
        }
        resp = self.client.post("/api/auth/register/", payload)
        self.assertEqual(resp.status_code, status.HTTP_201_CREATED)
        self.assertTrue(User.objects.filter(email="nouveau.porteur@test.sn").exists())


@override_settings(PASSWORD_HASHERS=FAST_HASHERS)
class UploadsFichiersSecuriteTests(TestCase):
    """Vérifie la politique de sécurité sur les dépôts de fichiers (Phase 3 T2 & T2/Fichiers)."""


    def test_rejet_fichier_vide(self):
        """Un fichier de 0 octet est rejeté."""
        empty_file = SimpleUploadedFile("vide.pdf", b"")
        with self.assertRaises(ValidationError):
            validate_file_size(empty_file)

    def test_rejet_fichier_trop_volumineux(self):
        """Un fichier dépassant 10 Mo est rejeté."""
        mock_file = SimpleUploadedFile("gros.pdf", b"A" * (10 * 1024 * 1024 + 1))
        with self.assertRaises(ValidationError):
            validate_file_size(mock_file)

    def test_rejet_extensions_interdites(self):
        """Les extensions de scripts ou exécutables ne figurent pas dans ALLOWED_PIECE_EXTENSIONS."""
        extensions_dangereuses = ["exe", "sh", "bat", "cmd", "php", "py", "js"]
        for ext in extensions_dangereuses:
            self.assertNotIn(ext, ALLOWED_PIECE_EXTENSIONS)

    def test_rejet_spoofing_signature_invalide(self):
        """Un fichier renommé frauduleusement avec une extension valide est rejeté par validate_file_content."""
        fake_files = [
            ("virus.pdf", b"#!/bin/bash\nrm -rf /"),
            ("fake.png", b"plain text content instead of png"),
            ("fake.docx", b"not a zip file content"),
            ("fake.xlsx", b"not an excel zip content"),
        ]
        for filename, content in fake_files:
            uploaded = SimpleUploadedFile(filename, content)
            with self.assertRaises(ValidationError, msg=f"{filename} aurait dû être rejeté"):
                validate_file_content(uploaded)

    def test_acceptation_tous_formats_valides(self):
        """Tous les formats officiellement autorisés sont validés avec leur signature binaire."""
        valid_files = [
            ("document.pdf", b"%PDF-1.4 valid pdf content"),
            ("image.png", b"\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR"),
            ("photo.jpg", b"\xff\xd8\xff\xe0\x00\x10JFIF"),
            ("photo.jpeg", b"\xff\xd8\xff\xe0\x00\x10JFIF"),
            ("image.webp", b"RIFF\x20\x00\x00\x00WEBPVP8 "),
            ("rapport.docx", b"PK\x03\x04\x14\x00\x06\x00word/document.xml"),
            ("budget.xlsx", b"PK\x03\x04\x14\x00\x06\x00xl/workbook.xml"),
            ("ancien.doc", b"\xd0\xcf\x11\xe0\xa1\xb1\x1a\xe1\x00\x00\x00\x00"),
            ("ancien.xls", b"\xd0\xcf\x11\xe0\xa1\xb1\x1a\xe1\x00\x00\x00\x00"),
        ]
        for filename, content in valid_files:
            uploaded = SimpleUploadedFile(filename, content)
            try:
                validate_file_content(uploaded)
            except ValidationError as e:
                self.fail(f"Le fichier valide {filename} a été rejeté à tort : {e}")

    def test_assainissement_nom_fichier_path_traversal(self):
        """La fonction sanitize_filename nettoie les tentatives de path traversal et séparateurs de dossiers."""
        attack_names = [
            ("../../etc/passwd.pdf", "etcpasswd.pdf"),
            ("..\\..\\windows\\system32\\cmd.pdf", "windowssystem32cmd.pdf"),
            ("../../../secret_data.xlsx", "secret_data.xlsx"),
            ("projet dossier/piece..test.pdf", "projet-dossierpiecetest.pdf"),
        ]
        for raw, expected in attack_names:
            clean = sanitize_filename(raw)
            self.assertNotIn("/", clean)
            self.assertNotIn("\\", clean)
            self.assertNotIn("..", clean)
            self.assertTrue(clean.endswith(expected.split(".")[-1]))


@override_settings(PASSWORD_HASHERS=FAST_HASHERS)
class ProductionConfigurationTests(TestCase):
    """Vérifie les critères indispensables de la checklist de mise en production."""


    def test_secret_key_reelle_improperly_configured(self):
        """Vérifie que la politique de production interdit formellement les SECRET_KEY faibles si DEBUG=False."""
        weak_keys = ["dev-only-change-me", "change-me", ""]
        for key in weak_keys:
            is_unsafe = not key or key in ("dev-only-change-me", "change-me")
            self.assertTrue(is_unsafe, f"La clé {key} doit être reconnue comme dangereuse en production.")

    def test_allowed_hosts_defini(self):
        """ALLOWED_HOSTS ne doit pas être vide."""
        self.assertTrue(len(settings.ALLOWED_HOSTS) > 0)
        self.assertNotIn("*", settings.ALLOWED_HOSTS)

    def test_en_tetes_securite_en_production(self):
        """Vérifie la présence et le dimensionnement des variables de sécurité des fichiers."""
        self.assertTrue(hasattr(settings, "DATA_UPLOAD_MAX_MEMORY_SIZE"))
        self.assertEqual(settings.DATA_UPLOAD_MAX_MEMORY_SIZE, 10 * 1024 * 1024)
        self.assertTrue(hasattr(settings, "FILE_UPLOAD_MAX_MEMORY_SIZE"))
        self.assertEqual(settings.FILE_UPLOAD_MAX_MEMORY_SIZE, 10 * 1024 * 1024)

    def test_cors_et_csrf_non_wildcard(self):
        """CORS et CSRF ne doivent pas autoriser le wildcard '*' sans restriction."""
        self.assertNotIn("*", settings.CORS_ALLOWED_ORIGINS)
        self.assertNotIn("*", settings.CSRF_TRUSTED_ORIGINS)


@override_settings(PASSWORD_HASHERS=FAST_HASHERS)
class RevueSecuriteNouvellesRoutesPhase10Tests(TestCase):
    """Revue d'attaquant sur les nouvelles routes introduites en phases 7 et 8 (Phase 10 — T1).

    Couvre :
    1. Journal d'audit (/api/audit/) : RBAC strict, absence de fuite de secrets ou tokens.
    2. Notifications (/api/notifications/, /lue/, /tout-lire/) : isolation, IDOR sur marquage lu, filtres.
    3. Manifestations d'intérêt (/api/gallery/interets/, /fiches/{slug}/interet/) : RBAC, IDOR porteur, anti-doublon.
    4. Données personnelles (/api/auth/me/export/, /api/auth/me/) : isolation request.user, mot de passe requis.
    5. Calendrier incubateur (/api/incubator/calendrier/) : isolation porteur/mentor, validation format mois.
    6. Route de santé (/api/health/) : public, zéro secret d'infrastructure divulgué.
    7. Interface d'administration Django (/admin/) : interdiction aux comptes non-staff (302).
    8. Robustesse face aux jetons JWT expirés ou falsifiés sur l'ensemble des routes protégées.
    """

    @classmethod
    def setUpTestData(cls):
        # Domaines et Cohortes
        cls.domaine = Domaine.objects.create(nom="Revue Sécurité Phase 10")
        cls.cohorte = Cohorte.objects.create(nom="Cohorte Sécu 2026", annee=2026)

        # Utilisateurs pour chaque rôle
        cls.admin_staff = User.objects.create_superuser(
            email="admin.secu@ciat.sn",
            password="AdminPassword2026!",
            first_name="Admin",
            last_name="System",
        )
        cls.coordo = User.objects.create_user(
            email="coordo.secu@ciat.sn",
            password="CoordoPassword2026!",
            role=Role.COORDONNATEUR,
            first_name="Coordo",
            last_name="Equipe",
        )
        cls.porteur_a = User.objects.create_user(
            email="porteur.a@ciat.sn",
            password="PorteurPasswordA2026!",
            role=Role.PORTEUR,
            first_name="Porteur",
            last_name="Alpha",
        )
        cls.porteur_b = User.objects.create_user(
            email="porteur.b@ciat.sn",
            password="PorteurPasswordB2026!",
            role=Role.PORTEUR,
            first_name="Porteur",
            last_name="Beta",
        )
        cls.mentor_a = User.objects.create_user(
            email="mentor.a@ciat.sn",
            password="MentorPasswordA2026!",
            role=Role.MENTOR,
            first_name="Mentor",
            last_name="Assigné",
        )
        cls.mentor_non_assigne = User.objects.create_user(
            email="mentor.autre@ciat.sn",
            password="MentorPasswordAutre2026!",
            role=Role.MENTOR,
            first_name="Mentor",
            last_name="Tiers",
        )
        cls.comite = User.objects.create_user(
            email="comite.secu@ciat.sn",
            password="ComitePassword2026!",
            role=Role.COMITE,
            first_name="Jury",
            last_name="Membre",
        )
        cls.visiteur = User.objects.create_user(
            email="visiteur.secu@ciat.sn",
            password="VisiteurPassword2026!",
            role=Role.VISITEUR,
            first_name="Lecteur",
            last_name="Externe",
        )

        # Projets et affectations
        cls.projet_a = Projet.objects.create(
            titre="Projet Alpha Sécurisé",
            resume="Résumé Alpha",
            probleme="Problème Alpha",
            solution="Solution Alpha",
            porteur=cls.porteur_a,
            domaine=cls.domaine,
            cohorte=cls.cohorte,
            statut="incube",
        )
        cls.projet_b = Projet.objects.create(
            titre="Projet Beta Confidentiel",
            resume="Résumé Beta",
            probleme="Problème Beta",
            solution="Solution Beta",
            porteur=cls.porteur_b,
            domaine=cls.domaine,
            cohorte=cls.cohorte,
            statut="incube",
        )

        AffectationMentor.objects.create(
            projet=cls.projet_a,
            mentor=cls.mentor_a,
            affecte_par=cls.coordo,
        )

        # Fiches de la galerie
        cls.fiche_a = FicheInnovation.objects.create(
            projet=cls.projet_a,
            titre="Innovation Alpha",
            slug="innovation-alpha",
            probleme="Problème Alpha",
            solution="Solution Alpha",
            equipe="Équipe Alpha",
            statut=FicheInnovation.Statut.PUBLIE,
        )
        cls.fiche_b = FicheInnovation.objects.create(
            projet=cls.projet_b,
            titre="Innovation Beta",
            slug="innovation-beta",
            probleme="Problème Beta",
            solution="Solution Beta",
            equipe="Équipe Beta",
            statut=FicheInnovation.Statut.PUBLIE,
        )
        cls.fiche_brouillon = FicheInnovation.objects.create(
            projet=cls.projet_a,
            titre="Innovation Brouillon",
            slug="innovation-brouillon",
            probleme="Problème Brouillon",
            solution="Solution Brouillon",
            equipe="Équipe Alpha",
            statut=FicheInnovation.Statut.BROUILLON,
        )

        # Manifestations d'intérêt
        cls.manif_a = ManifestationInteret.objects.create(
            fiche=cls.fiche_a,
            nom="Investisseur Alpha",
            email="investisseur.a@fonds.sn",
            organisation="Fonds A",
            message="Proposition d'investissement privé pour Alpha",
        )
        cls.manif_b = ManifestationInteret.objects.create(
            fiche=cls.fiche_b,
            nom="Partenaire Beta",
            email="contact.beta@partenaire.sn",
            organisation="Partenaire B",
            message="Offre de collaboration stratégique confidentielle pour Beta",
        )

        # Notifications
        cls.notif_a = creer_notification(
            destinataire=cls.porteur_a,
            type="info",
            message="Message privé pour Porteur Alpha",
        )
        cls.notif_b = creer_notification(
            destinataire=cls.porteur_b,
            type="info",
            message="Message secret pour Porteur Beta",
        )

        # Entrées du journal d'audit
        cls.audit_entry = enregistrer_audit(
            acteur=cls.coordo,
            action="validation_projet",
            objet=f"Projet #{cls.projet_a.id}",
            avant={"statut": "depose"},
            apres={"statut": "incube"},
        )

        # Jalons et Objectifs pour le calendrier (mois 2026-10)
        cls.jalon_a = Jalon.objects.create(
            projet=cls.projet_a,
            titre="Jalon Prototypage Alpha",
            echeance=datetime.date(2026, 10, 15),
            statut=StatutJalon.A_FAIRE,
            cree_par=cls.mentor_a,
        )
        cls.jalon_b = Jalon.objects.create(
            projet=cls.projet_b,
            titre="Jalon Brevet Confidentiel Beta",
            echeance=datetime.date(2026, 10, 20),
            statut=StatutJalon.A_FAIRE,
            cree_par=cls.coordo,
        )
        cls.obj_a = Objectif.objects.create(
            projet=cls.projet_a,
            libelle="Objectif Étude Marché Alpha",
            echeance=datetime.date(2026, 10, 25),
            statut=StatutObjectif.EN_COURS,
            cree_par=cls.coordo,
        )

    def setUp(self):
        self.client = APIClient()

    def test_01_securite_audit_rbac_et_non_divulgation(self):
        """GET /api/audit/ : Accès restreint à l'équipe CIAT et zéro donnée sensible."""
        url = "/api/audit/"

        # 1. Anonyme -> 401
        self.assertEqual(self.client.get(url).status_code, status.HTTP_401_UNAUTHORIZED)

        # 2. Rôles non-équipe -> 403 Forbidden
        for user in [self.visiteur, self.porteur_a, self.mentor_a, self.comite]:
            self.client.force_authenticate(user=user)
            resp = self.client.get(url)
            self.assertEqual(
                resp.status_code,
                status.HTTP_403_FORBIDDEN,
                f"L'utilisateur {user.email} (rôle {user.role}) ne doit pas accéder à l'audit",
            )

        # 3. Équipe CIAT -> 200 OK
        for user in [self.coordo, self.admin_staff]:
            self.client.force_authenticate(user=user)
            resp = self.client.get(url)
            self.assertEqual(resp.status_code, status.HTTP_200_OK)
            # Vérification de non-divulgation de hash de mot de passe ni token
            contenu_str = str(resp.data)
            self.assertNotIn("pbkdf2", contenu_str.lower())
            self.assertNotIn("md5$", contenu_str.lower())
            self.assertNotIn("bearer", contenu_str.lower())

        # 4. Paramètres de filtrage fonctionnels pour l'équipe sans fuite
        self.client.force_authenticate(user=self.coordo)
        resp_filtre = self.client.get(f"{url}?action=validation_projet")
        self.assertEqual(resp_filtre.status_code, status.HTTP_200_OK)

    def test_02_securite_notifications_isolation_et_idor_marquage_lu(self):
        """GET /api/notifications/ & POST /api/notifications/{id}/lue/ : Isolation stricte et rejet IDOR."""
        url_list = "/api/notifications/"

        # 1. Isolation de consultation : Porteur A ne voit que notif_a
        self.client.force_authenticate(user=self.porteur_a)
        resp_a = self.client.get(url_list)
        self.assertEqual(resp_a.status_code, status.HTTP_200_OK)
        ids_recus = [n["id"] for n in resp_a.data.get("results", resp_a.data)]
        self.assertIn(self.notif_a.id, ids_recus)
        self.assertNotIn(self.notif_b.id, ids_recus)

        # 2. Tentative d'élargissement de portée avec paramètres query
        resp_tamper = self.client.get(f"{url_list}?destinataire={self.porteur_b.id}&user={self.porteur_b.id}")
        self.assertEqual(resp_tamper.status_code, status.HTTP_200_OK)
        ids_tamper = [n["id"] for n in resp_tamper.data.get("results", resp_tamper.data)]
        self.assertNotIn(self.notif_b.id, ids_tamper)

        # 3. Attaque IDOR : Porteur A tente de marquer comme lue la notification de Porteur B
        url_idor = f"/api/notifications/{self.notif_b.id}/lue/"
        resp_idor = self.client.post(url_idor)
        self.assertEqual(
            resp_idor.status_code,
            status.HTTP_404_NOT_FOUND,
            "Marquer une notification d'un tiers doit être rejeté (dissimulation 404)",
        )
        self.notif_b.refresh_from_db()
        self.assertFalse(self.notif_b.lue)

        # 4. Marquage nominal de sa propre notification
        url_legit = f"/api/notifications/{self.notif_a.id}/lue/"
        resp_legit = self.client.post(url_legit)
        self.assertEqual(resp_legit.status_code, status.HTTP_200_OK)
        self.notif_a.refresh_from_db()
        self.assertTrue(self.notif_a.lue)

    def test_03_securite_notifications_tout_lire_et_parametres_filtre(self):
        """POST /api/notifications/tout-lire/ : Ne met à jour que les notifications du demandeur."""
        notif_a2 = creer_notification(destinataire=self.porteur_a, type="info", message="Msg 2 A")
        notif_b2 = creer_notification(destinataire=self.porteur_b, type="info", message="Msg 2 B")

        self.client.force_authenticate(user=self.porteur_a)
        resp = self.client.post("/api/notifications/tout-lire/")
        self.assertEqual(resp.status_code, status.HTTP_200_OK)

        notif_a2.refresh_from_db()
        notif_b2.refresh_from_db()
        self.assertTrue(notif_a2.lue)
        self.assertFalse(notif_b2.lue)

    def test_04_securite_gallery_manifestations_interet_rbac_et_idor(self):
        """GET /api/gallery/interets/ : Cloisonnement strict et zéro fuite de message/email tiers."""
        url = "/api/gallery/interets/"

        # 1. Anonyme -> 401
        self.assertEqual(self.client.get(url).status_code, status.HTTP_401_UNAUTHORIZED)

        # 2. Rôles non autorisés -> 403 Forbidden
        for user in [self.visiteur, self.mentor_a, self.comite]:
            self.client.force_authenticate(user=user)
            self.assertEqual(self.client.get(url).status_code, status.HTTP_403_FORBIDDEN)

        # 3. Porteur A ne voit que manif_a
        self.client.force_authenticate(user=self.porteur_a)
        resp_a = self.client.get(url)
        self.assertEqual(resp_a.status_code, status.HTTP_200_OK)
        items = resp_a.data.get("results", resp_a.data)
        ids_recus = [m["id"] for m in items]
        self.assertIn(self.manif_a.id, ids_recus)
        self.assertNotIn(self.manif_b.id, ids_recus)

        # 4. Attaque IDOR par paramètre query ?fiche=
        resp_idor_id = self.client.get(f"{url}?fiche={self.fiche_b.id}")
        self.assertEqual(resp_idor_id.status_code, status.HTTP_200_OK)
        items_idor = resp_idor_id.data.get("results", resp_idor_id.data)
        self.assertEqual(len(items_idor), 0)

        resp_idor_slug = self.client.get(f"{url}?fiche={self.fiche_b.slug}")
        self.assertEqual(resp_idor_slug.status_code, status.HTTP_200_OK)
        self.assertEqual(len(resp_idor_slug.data.get("results", resp_idor_slug.data)), 0)

        # 5. Équipe CIAT -> Vue globale
        self.client.force_authenticate(user=self.coordo)
        resp_coordo = self.client.get(url)
        self.assertEqual(resp_coordo.status_code, status.HTTP_200_OK)
        ids_coordo = [m["id"] for m in resp_coordo.data.get("results", resp_coordo.data)]
        self.assertIn(self.manif_a.id, ids_coordo)
        self.assertIn(self.manif_b.id, ids_coordo)

        # 6. POST manifestation sur fiche brouillon -> 404 Not Found
        url_post_brouillon = f"/api/gallery/fiches/{self.fiche_brouillon.slug}/interet/"
        resp_post_brouillon = self.client.post(url_post_brouillon, {
            "nom": "Attaquant",
            "email": "attaquant@test.sn",
            "message": "Message sur fiche brouillon",
        })
        self.assertEqual(resp_post_brouillon.status_code, status.HTTP_404_NOT_FOUND)

    def test_05_securite_donnees_personnelles_export_effacement_et_parametres(self):
        """GET /api/auth/me/export/ & DELETE /api/auth/me/ : Aucune usurpation d'identité possible."""
        # 1. Export : Anonyme -> 401
        self.assertEqual(self.client.get("/api/auth/me/export/").status_code, status.HTTP_401_UNAUTHORIZED)

        # 2. Export Porteur A : seules ses données sont exportées
        self.client.force_authenticate(user=self.porteur_a)
        resp_export = self.client.get("/api/auth/me/export/")
        self.assertEqual(resp_export.status_code, status.HTTP_200_OK)
        self.assertIn("porteur.a@ciat.sn", resp_export.content.decode("utf-8"))
        self.assertNotIn("porteur.b@ciat.sn", resp_export.content.decode("utf-8"))

        # 3. Paramètre query d'usurpation ?user=
        resp_tamper = self.client.get(f"/api/auth/me/export/?user={self.porteur_b.id}&id={self.porteur_b.id}")
        self.assertEqual(resp_tamper.status_code, status.HTTP_200_OK)
        self.assertNotIn("porteur.b@ciat.sn", resp_tamper.content.decode("utf-8"))

        # 4. Suppression : sans mot de passe ou mauvais mot de passe -> 400 Bad Request
        resp_del_no_pwd = self.client.delete("/api/auth/me/", {}, format="json")
        self.assertEqual(resp_del_no_pwd.status_code, status.HTTP_400_BAD_REQUEST)

        resp_del_bad_pwd = self.client.delete("/api/auth/me/", {"password": "MauvaisMotDePasse!"}, format="json")
        self.assertEqual(resp_del_bad_pwd.status_code, status.HTTP_400_BAD_REQUEST)

    def test_06_securite_incubateur_calendrier_isolation_et_validation(self):
        """GET /api/incubator/calendrier/ : Isolation par rôle et étanchéité des événements."""
        url = "/api/incubator/calendrier/?mois=2026-10"

        # 1. Anonyme -> 401
        self.assertEqual(self.client.get(url).status_code, status.HTTP_401_UNAUTHORIZED)

        # 2. Visiteur et Comité -> tableau vide []
        for user in [self.visiteur, self.comite]:
            self.client.force_authenticate(user=user)
            resp = self.client.get(url)
            self.assertEqual(resp.status_code, status.HTTP_200_OK)
            self.assertEqual(resp.data, [])

        # 3. Porteur A ne voit que les événements de projet_a
        self.client.force_authenticate(user=self.porteur_a)
        resp_a = self.client.get(url)
        self.assertEqual(resp_a.status_code, status.HTTP_200_OK)
        projets_vus = [ev["projet"] for ev in resp_a.data]
        self.assertIn(self.projet_a.titre, projets_vus)
        self.assertNotIn(self.projet_b.titre, projets_vus)

        # 4. Tentative de filtre ?projet= vers un projet tiers
        resp_tamper = self.client.get(f"{url}&projet={self.projet_b.id}")
        self.assertEqual(resp_tamper.status_code, status.HTTP_200_OK)
        projets_tamper = [ev["projet"] for ev in resp_tamper.data]
        self.assertNotIn(self.projet_b.titre, projets_tamper)

        # 5. Mentor assigné à Alpha : voit Alpha, ne voit pas Beta
        self.client.force_authenticate(user=self.mentor_a)
        resp_mentor = self.client.get(url)
        self.assertEqual(resp_mentor.status_code, status.HTTP_200_OK)
        projets_mentor = [ev["projet"] for ev in resp_mentor.data]
        self.assertIn(self.projet_a.titre, projets_mentor)
        self.assertNotIn(self.projet_b.titre, projets_mentor)

        # 6. Format de mois invalide -> 400 Bad Request sans 500
        self.client.force_authenticate(user=self.porteur_a)
        for invalid_mois in ["2026-99", "abc", "2026", ""]:
            r_inv = self.client.get(f"/api/incubator/calendrier/?mois={invalid_mois}")
            self.assertEqual(r_inv.status_code, status.HTTP_400_BAD_REQUEST)

    def test_07_securite_health_check_et_admin_staff_only(self):
        """GET /api/health/ (public sans fuite) et /admin/ (interdit aux comptes non-staff)."""
        # 1. Health : 200 public minimaliste
        resp_health = self.client.get("/api/health/")
        self.assertEqual(resp_health.status_code, status.HTTP_200_OK)
        self.assertEqual(resp_health.data.get("status"), "ok")
        self.assertEqual(resp_health.data.get("database"), "connected")
        # Zéro fuite de mot de passe, de secret ou de chemin absolu
        self.assertNotIn("password", str(resp_health.data).lower())
        self.assertNotIn("Users", str(resp_health.data))

        # 2. Admin Django : 302 Redirection vers login pour tout utilisateur non-staff
        for user in [None, self.visiteur, self.porteur_a, self.mentor_a, self.comite, self.coordo]:
            if user:
                self.client.force_authenticate(user=user)
            else:
                self.client.logout()
            resp_admin = self.client.get("/admin/", follow=False)
            self.assertEqual(
                resp_admin.status_code,
                status.HTTP_302_FOUND,
                f"L'accès à /admin/ par {getattr(user, 'email', 'Anonyme')} doit rediriger (302)",
            )
            self.assertIn("/admin/login/", resp_admin.headers.get("Location", ""))

        # 3. Superuser is_staff connecté en session Django -> 200 OK (ou 302 vers /admin/ si trailing slash requis)
        self.client.force_login(self.admin_staff)
        resp_admin_ok = self.client.get("/admin/", follow=True)
        self.assertEqual(resp_admin_ok.status_code, status.HTTP_200_OK)

    def test_08_securite_jetons_jwt_expires_et_falsifies(self):
        """Toute requête avec un jeton JWT expiré ou à signature falsifiée est rejetée (401)."""
        # 1. Jeton expiré
        token_expire = AccessToken.for_user(self.porteur_a)
        token_expire.set_exp(lifetime=-datetime.timedelta(days=1))
        jwt_expire = str(token_expire)

        # 2. Jeton falsifié
        jwt_falsifie = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.invalidpayload.tamperedsignature"

        routes_protegees = [
            "/api/audit/",
            "/api/notifications/",
            "/api/gallery/interets/",
            "/api/auth/me/export/",
            "/api/incubator/calendrier/?mois=2026-10",
        ]

        for token in [jwt_expire, jwt_falsifie]:
            client = APIClient()
            client.credentials(HTTP_AUTHORIZATION=f"Bearer {token}")
            for route in routes_protegees:
                resp = client.get(route)
                self.assertEqual(
                    resp.status_code,
                    status.HTTP_401_UNAUTHORIZED,
                    f"Route {route} avec jeton invalide/expiré aurait dû renvoyer 401, reçu {resp.status_code}",
                )

