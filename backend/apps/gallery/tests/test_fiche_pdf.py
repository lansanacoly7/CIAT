"""Tests unitaires et fonctionnels pour l'export PDF de la fiche promotionnelle (Phase 6 — T3).

Vérifie :
1. Téléchargement public de la fiche PDF pour une fiche publiée (200, Content-Type: application/pdf)
2. En-tête Content-Disposition avec le nom de fichier correct
3. Confidentialité : une fiche non publiée (brouillon, en_validation, refuse) renvoie 404 pour un visiteur anonyme ou un tiers
4. Accès autorisé pour le porteur propriétaire ou l'équipe CIAT même si non publiée
5. Gestion des caractères accentués et caractères spéciaux XML (é, è, à, &, <, >, etc.)
6. Fiche inexistante renvoie 404
"""
from django.core.cache import cache
from django.test import TestCase, override_settings
from rest_framework import status
from rest_framework.test import APIClient

from apps.core.models import Cohorte, Domaine, Projet, Role, User
from apps.gallery.models import FicheInnovation


@override_settings(PASSWORD_HASHERS=["django.contrib.auth.hashers.MD5PasswordHasher"])
class FichePDFAPITestCase(TestCase):
    """Tests fonctionnels de l'endpoint GET /api/gallery/fiches/{slug}/fiche/."""

    def setUp(self):
        cache.clear()
        self.client = APIClient()

        # Utilisateurs
        self.porteur = User.objects.create_user(
            email="porteur_pdf@demo.ciat.sn",
            password="Password123!",
            role=Role.PORTEUR,
            first_name="Awa",
            last_name="Ndiaye",
        )
        self.autre_porteur = User.objects.create_user(
            email="autre_porteur@demo.ciat.sn",
            password="Password123!",
            role=Role.PORTEUR,
            first_name="Modou",
            last_name="Diop",
        )
        self.coordo = User.objects.create_user(
            email="coordo_pdf@ciat.sn",
            password="Password123!",
            role=Role.COORDONNATEUR,
            first_name="Lansana",
            last_name="Coly",
        )

        # Références
        self.domaine = Domaine.objects.create(
            nom="AgriTech & Énergie Solaire",
            slug="agritech-energie",
        )
        self.cohorte = Cohorte.objects.create(
            nom="Cohorte 2026",
            annee=2026,
            date_debut="2026-01-01",
            date_fin="2026-12-31",
        )

        # Projets
        self.projet_publie = Projet.objects.create(
            titre="Système d'Irrigation Intelligent & Éco-Solaire",
            porteur=self.porteur,
            domaine=self.domaine,
            cohorte=self.cohorte,
            statut=Projet.Statut.INCUBE,
        )
        self.projet_brouillon = Projet.objects.create(
            titre="Projet Drone Agricole <Brouillon>",
            porteur=self.porteur,
            domaine=self.domaine,
            cohorte=self.cohorte,
            statut=Projet.Statut.INCUBE,
        )

        # Fiches
        self.fiche_publiee = FicheInnovation.objects.create(
            projet=self.projet_publie,
            slug="irrigation-intelligente",
            titre="Système d'Irrigation Intelligent & Éco-Solaire",
            probleme="Le manque d'eau et le coût énergétique pénalisent les agriculteurs de la région des Niayes.",
            solution="Capteurs IoT connectés régulant l'irrigation goutte-à-goutte alimentés par panneaux photovoltaïques.",
            equipe="Awa Ndiaye (Ingénieure Agronome), Modou Sarr (Développeur IoT)",
            avancement="Prototype fonctionnel testé en champ réel",
            statut=FicheInnovation.Statut.PUBLIE,
        )
        self.fiche_brouillon = FicheInnovation.objects.create(
            projet=self.projet_brouillon,
            slug="drone-agricole",
            titre="Projet Drone Agricole <Brouillon>",
            probleme="Surveillance complexe des ravageurs & maladies foliaires.",
            solution="Drones légers équipés de caméras multispectrales & IA embarquée.",
            equipe="Équipe Innovation ISEP",
            avancement="Idée / Conception",
            statut=FicheInnovation.Statut.BROUILLON,
        )

    def test_fiche_pdf_publiee_succes_anonyme(self):
        """Un visiteur anonyme peut télécharger le PDF d'une fiche publiée."""
        url = f"/api/gallery/fiches/{self.fiche_publiee.slug}/fiche/"
        response = self.client.get(url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response["Content-Type"], "application/pdf")
        self.assertIn("inline", response["Content-Disposition"])
        self.assertIn(f"fiche_{self.fiche_publiee.slug}.pdf", response["Content-Disposition"])

        # Vérification du flux binaire PDF (signature %PDF-)
        content = response.content
        self.assertTrue(content.startswith(b"%PDF-"), "La réponse doit commencer par le header magique PDF")
        self.assertGreater(len(content), 1000, "Le fichier PDF doit avoir une taille significative")

    def test_fiche_pdf_brouillon_anonyme_404(self):
        """Un visiteur anonyme reçoit 404 pour une fiche non publiée (confidentialité)."""
        url = f"/api/gallery/fiches/{self.fiche_brouillon.slug}/fiche/"
        response = self.client.get(url)

        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_fiche_pdf_brouillon_autre_porteur_404(self):
        """Un autre porteur reçoit 404 pour une fiche non publiée d'un tiers."""
        self.client.force_authenticate(user=self.autre_porteur)
        url = f"/api/gallery/fiches/{self.fiche_brouillon.slug}/fiche/"
        response = self.client.get(url)

        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_fiche_pdf_brouillon_proprietaire_200(self):
        """Le porteur propriétaire peut prévisualiser le PDF de sa propre fiche brouillon."""
        self.client.force_authenticate(user=self.porteur)
        url = f"/api/gallery/fiches/{self.fiche_brouillon.slug}/fiche/"
        response = self.client.get(url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response["Content-Type"], "application/pdf")
        self.assertTrue(response.content.startswith(b"%PDF-"))

    def test_fiche_pdf_brouillon_equipe_ciat_200(self):
        """Un membre de l'équipe CIAT (coordonnateur) peut consulter le PDF d'une fiche en validation ou brouillon."""
        self.client.force_authenticate(user=self.coordo)
        url = f"/api/gallery/fiches/{self.fiche_brouillon.slug}/fiche/"
        response = self.client.get(url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response["Content-Type"], "application/pdf")
        self.assertTrue(response.content.startswith(b"%PDF-"))

    def test_fiche_pdf_slug_inexistant_404(self):
        """Une fiche inexistante renvoie un code 404."""
        url = "/api/gallery/fiches/slug-qui-nexiste-absolument-pas/fiche/"
        response = self.client.get(url)

        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_fiche_pdf_avec_caracteres_speciaux_xml(self):
        """Vérifie que les caractères &, <, >, guillemets et accents ne provoquent pas d'erreur ReportLab."""
        projet_special = Projet.objects.create(
            titre="Innovation & Haute Technologie <Projet Spécial> \"2026\"",
            porteur=self.porteur,
            domaine=self.domaine,
            cohorte=self.cohorte,
            statut=Projet.Statut.INCUBE,
        )
        fiche_speciale = FicheInnovation.objects.create(
            projet=projet_special,
            slug="innovation-haute-technologie",
            titre="Innovation & Haute Technologie <Projet Spécial> \"2026\"",
            probleme="Coûts > 500k FCFA & contraintes énergétiques importantes.",
            solution="Micro-réseau solaire intelligent & algorithmes d'optimisation.",
            equipe="Équipe Alpha & Bêta — Chercheurs à l'ISEP Amadou Trawaré.",
            avancement="Phase R&D validée",
            statut=FicheInnovation.Statut.PUBLIE,
        )

        url = f"/api/gallery/fiches/{fiche_speciale.slug}/fiche/"
        response = self.client.get(url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response["Content-Type"], "application/pdf")
        self.assertTrue(response.content.startswith(b"%PDF-"))
