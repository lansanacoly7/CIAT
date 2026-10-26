"""Tests de non-régression de performance et élimination des requêtes N+1 — CIAT (Phase 3 — T3).

Vérifie que les endpoints de liste critiques effectuent un nombre constant et minimal de requêtes SQL (O(1)),
indépendamment du nombre d'éléments en base de données, grâce à l'utilisation rigoureuse de
select_related, prefetch_related, et d'index optimisés.
"""
import datetime
from django.core.files.uploadedfile import SimpleUploadedFile
from django.test import TestCase, override_settings
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APIClient

from apps.core.models import Cohorte, Domaine, Projet, Role, User
from apps.documents.models import Document, ModeleDocument, TypeDocument
from apps.gallery.models import FicheInnovation
from apps.incubator.models import Dossier, Jalon, Piece, StatutDossier, StatutJalon, TypePiece
from apps.portal.models import Actualite, AppelProjet

FAST_HASHERS = ["django.contrib.auth.hashers.MD5PasswordHasher"]


@override_settings(PASSWORD_HASHERS=FAST_HASHERS)
class PerformanceListesTests(TestCase):
    """Tests de non-régression vérifiant le nombre exact de requêtes SQL générées par chaque liste."""

    @classmethod
    def setUpTestData(cls):
        # Utilisateur administrateur pour tester les listes complètes
        cls.admin = User.objects.create_user(
            email="admin.perf@ciat.sn",
            password="Password123!",
            role=Role.ADMIN,
            first_name="Admin",
            last_name="Perf",
        )

        # Références communes
        cls.domaine = Domaine.objects.create(nom="TIC et Intelligence Artificielle")
        cls.cohorte = Cohorte.objects.create(nom="Cohorte 2026", annee=2026)

        # Création de 15 projets avec porteurs distincts
        cls.projets = []
        for i in range(15):
            porteur = User.objects.create_user(
                email=f"porteur{i}@perf.ciat.sn",
                password="Password123!",
                role=Role.PORTEUR,
                first_name=f"Porteur{i}",
                last_name="Perf",
            )
            p = Projet.objects.create(
                titre=f"Projet Performance {i}",
                resume=f"Résumé du projet {i}",
                probleme=f"Problème {i}",
                solution=f"Solution {i}",
                domaine=cls.domaine,
                cohorte=cls.cohorte,
                porteur=porteur,
                statut=Projet.Statut.INCUBE,
            )
            cls.projets.append(p)

            # Création de dossiers avec pièces justificatives rattachées
            dossier = Dossier.objects.create(projet=p, statut=StatutDossier.SOUMIS)
            Piece.objects.create(
                dossier=dossier,
                type=TypePiece.FICHE_PROJET,
                nom="fiche.pdf",
                fichier=SimpleUploadedFile("fiche.pdf", b"%PDF-1.4 sample content"),
            )
            Piece.objects.create(
                dossier=dossier,
                type=TypePiece.BUDGET_PREVISIONNEL,
                nom="budget.xlsx",
                fichier=SimpleUploadedFile("budget.xlsx", b"dummy xlsx content"),
            )

            # Fiches d'innovation publiées pour la galerie
            FicheInnovation.objects.create(
                projet=p,
                titre=f"Fiche Innovation {i}",
                probleme=f"Problème {i}",
                solution=f"Solution {i}",
                equipe="Équipe",
                avancement="MVP",
                statut=FicheInnovation.Statut.PUBLIE,
            )

            # Jalons en retard pour tester les alertes
            Jalon.objects.create(
                projet=p,
                titre=f"Jalon Critique {i}",
                echeance=timezone.now().date() - datetime.timedelta(days=i + 1),
                statut=StatutJalon.A_FAIRE,
                cree_par=cls.admin,
            )

        # Création de 15 actualités publiques
        for i in range(15):
            Actualite.objects.create(
                titre=f"Actualité CIAT {i}",
                contenu=f"Contenu de l'actualité {i}",
                publie_le=timezone.now() - datetime.timedelta(hours=i),
            )

        # Création de 10 documents
        type_doc, _ = TypeDocument.objects.get_or_create(code="convention", defaults={"nom": "Convention"})
        modele = ModeleDocument.objects.create(type=type_doc, nom="Modèle Perf", sections=[])
        for i in range(10):
            Document.objects.create(
                titre=f"Document {i}",
                modele=modele,
                projet=cls.projets[i],
                auteur=cls.admin,
                statut=Document.Statut.BROUILLON,
            )

    def setUp(self):
        self.client = APIClient()
        self.client.force_authenticate(user=self.admin)


    def test_performance_liste_projets(self):
        """GET /api/projets/ : exactement 2 requêtes (Count paginé + SELECT avec relations)."""
        with self.assertNumQueries(2):
            resp = self.client.get("/api/projets/")
            self.assertEqual(resp.status_code, status.HTTP_200_OK)

    def test_performance_liste_incubator_dossiers(self):
        """GET /api/incubator/dossiers/ ne doit pas dépasser 3 requêtes (Count + SELECT dossiers + Prefetch pieces)."""
        with self.assertNumQueries(3):
            resp = self.client.get("/api/incubator/dossiers/")
            self.assertEqual(resp.status_code, status.HTTP_200_OK)

    def test_performance_liste_portal_actualites(self):
        """GET /api/portal/actualites/ ne doit pas dépasser 2 requêtes (Count + SELECT actualités)."""
        self.client.credentials()  # Test en accès public
        with self.assertNumQueries(2):
            resp = self.client.get("/api/portal/actualites/")
            self.assertEqual(resp.status_code, status.HTTP_200_OK)

    def test_performance_liste_portal_projets_incubes(self):
        """GET /api/portal/projets-incubes/ ne doit pas dépasser 2 requêtes (Count + SELECT avec domaine/cohorte)."""
        self.client.credentials()  # Test en accès public
        with self.assertNumQueries(2):
            resp = self.client.get("/api/portal/projets-incubes/")
            self.assertEqual(resp.status_code, status.HTTP_200_OK)

    def test_performance_liste_gallery_fiches(self):
        """GET /api/gallery/fiches/ ne doit pas dépasser 2 requêtes (Count + SELECT avec projet, domaine, cohorte)."""
        self.client.credentials()  # Test en accès public
        with self.assertNumQueries(2):
            resp = self.client.get("/api/gallery/fiches/")
            self.assertEqual(resp.status_code, status.HTTP_200_OK)

    def test_performance_liste_documents(self):
        """GET /api/documents/ : exactement 2 requêtes (SELECT documents avec joins + Prefetch versions)."""
        with self.assertNumQueries(2):
            resp = self.client.get("/api/documents/")
            self.assertEqual(resp.status_code, status.HTTP_200_OK)

    def test_performance_liste_incubator_alertes(self):
        """GET /api/incubator/alertes/ ne doit pas dépasser 1 requête (SELECT avec select_related projet)."""
        with self.assertNumQueries(1):
            resp = self.client.get("/api/incubator/alertes/")
            self.assertEqual(resp.status_code, status.HTTP_200_OK)

    def test_performance_analytics_indicateurs(self):
        """GET /api/analytics/indicateurs/ : exactement 2 requêtes d'agrégation (statistiques projets + dossiers)."""
        with self.assertNumQueries(2):
            resp = self.client.get("/api/analytics/indicateurs/")
            self.assertEqual(resp.status_code, status.HTTP_200_OK)

    def test_detection_regression_n_plus_1_si_reintroduit(self):
        """Vérifie que l'omission d'une jointure sur N éléments produit bien N requêtes et échoue le seuil O(1)."""
        # Sans select_related, accéder à p.porteur.email sur 15 projets exécute 1 + 15 = 16 requêtes
        projets_sans_join = list(Projet.objects.all()[:15])
        with self.assertRaises(AssertionError):
            with self.assertNumQueries(2):
                for p in projets_sans_join:
                    _ = p.porteur.email

    def test_comportement_proprietes_avec_et_sans_prefetch(self):
        """Vérifie que pieces_manquantes et version_courante renvoient le même résultat avec ou sans cache prefetch."""
        # 1. Dossier sans prefetch
        dossier_brut = Dossier.objects.get(id=self.projets[0].dossier.id)
        manquantes_brut = dossier_brut.pieces_manquantes

        # Dossier avec prefetch
        dossier_prefetched = Dossier.objects.prefetch_related("pieces").get(id=self.projets[0].dossier.id)
        manquantes_prefetched = dossier_prefetched.pieces_manquantes

        self.assertEqual(manquantes_brut, manquantes_prefetched)

        # 2. Document sans prefetch
        doc_brut = Document.objects.first()
        version_brute = doc_brut.version_courante

        # Document avec prefetch
        doc_prefetched = Document.objects.prefetch_related("versions").get(id=doc_brut.id)
        version_prefetched = doc_prefetched.version_courante

        self.assertEqual(version_brute, version_prefetched)

