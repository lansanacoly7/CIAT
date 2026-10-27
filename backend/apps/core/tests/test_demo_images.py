"""Tests unitaires pour la génération locale d'images de démonstration (Phase 4 — T3).

Vérifie :
1. La génération d'images pour Actualités, Partenaires et Fiches de galerie avec Pillow.
2. La conformité stricte de taille (< 150 Ko).
3. L'absence de toute URL externe non souveraine.
4. L'idempotence stricte (un second appel ne modifie rien).
"""
from django.core.files.storage import default_storage
from django.test import TestCase

from apps.core.demo_images import (
    generer_image_actualite,
    generer_logo_partenaire,
    generer_photo_galerie,
    generer_toutes_images_demo,
)
from apps.core.models import Cohorte, Domaine, Projet, User
from apps.gallery.models import FicheInnovation
from apps.portal.models import Actualite, Partenaire


class TestDemoImages(TestCase):
    """Vérification des exigences de la T3 (images locales, légères, souveraines, idempotentes)."""

    def setUp(self):
        self.user = User.objects.create_user(
            email="porteur_test@ciat.sn",
            password="testpassword",
            first_name="Cheikh",
            last_name="Fall",
        )
        self.domaine = Domaine.objects.create(
            nom="Technologies de l'Information et IA",
        )
        self.cohorte = Cohorte.objects.create(
            nom="Cohorte Test 2026",
            annee=2026,
        )
        self.projet = Projet.objects.create(
            titre="Système IoT de Surveillance des Récoltes",
            porteur=self.user,
            domaine=self.domaine,
            cohorte=self.cohorte,
            statut=Projet.Statut.PROTOTYPE,
            probleme="Pertes post-récolte importantes.",
            solution="Capteurs d'humidité et température connectés.",
        )

    def test_generer_image_actualite(self):
        """Vérifie la génération d'image pour une actualité."""
        actu = Actualite.objects.create(
            titre="Inauguration du FabLab de Diamniadio",
            resume="Nouveau centre de prototypage rapide pour les apprenants.",
            contenu="Le ministre a salué la dynamique technologique locale.",
        )

        cree = generer_image_actualite(actu)
        self.assertTrue(cree)
        actu.refresh_from_db()
        self.assertTrue(actu.publie)
        self.assertTrue(bool(actu.image))
        self.assertTrue(default_storage.exists(actu.image.name))

        # Vérification taille sous 150 Ko
        size = default_storage.size(actu.image.name)
        self.assertLess(size, 150 * 1024, f"Image trop lourde : {size} octets")

        # Test d'idempotence stricte
        cree_encore = generer_image_actualite(actu)
        self.assertFalse(cree_encore, "Un second appel doit renvoyer False (aucune modification)")

    def test_generer_logo_partenaire(self):
        """Vérifie la génération d'un logo de partenaire."""
        partenaire = Partenaire.objects.create(
            nom="Agence Sénégalaise de Promotion Technologique (ASPT)",
            description="Partenaire d'accélération et d'accès aux marchés.",
            site_web="https://aspt.gouv.sn",
        )

        cree = generer_logo_partenaire(partenaire)
        self.assertTrue(cree)
        partenaire.refresh_from_db()
        self.assertTrue(bool(partenaire.logo))
        self.assertTrue(default_storage.exists(partenaire.logo.name))

        # Vérification taille sous 150 Ko
        size = default_storage.size(partenaire.logo.name)
        self.assertLess(size, 150 * 1024, f"Logo trop lourd : {size} octets")

        # Test d'idempotence stricte
        cree_encore = generer_logo_partenaire(partenaire)
        self.assertFalse(cree_encore, "Un second appel doit renvoyer False (aucune modification)")

    def test_generer_photo_galerie_sans_externe(self):
        """Vérifie la génération d'une photo de prototype et l'élimination des URLs externes."""
        fiche = FicheInnovation.objects.create(
            projet=self.projet,
            titre="Capteur Connecté pour Silos Céréaliers",
            probleme="Manque de visibilité sur l'état des stocks.",
            solution="Balise LoRaWAN basse consommation.",
            equipe="Équipe Électronique ISEP",
            avancement="Prototype",
            statut=FicheInnovation.Statut.PUBLIE,
            medias=[
                {
                    "type": "photo",
                    "url": "https://images.unsplash.com/photo-1581092160607?w=800",
                    "legende": "Ancienne photo externe",
                },
                {
                    "type": "demo",
                    "url": "https://silos.ciat.sn",
                    "legende": "Interface de supervision",
                },
            ],
        )

        modifie = generer_photo_galerie(fiche)
        self.assertTrue(modifie)
        fiche.refresh_from_db()

        # Vérification qu'aucune URL externe unsplash ne subsiste
        for m in fiche.medias:
            if m.get("type") == "photo":
                self.assertNotIn("unsplash", m.get("url", "").lower())
                self.assertTrue(m.get("url", "").startswith("/media/galerie/"))

        # Vérification taille sous 150 Ko
        relative_path = f"galerie/fiche_{fiche.slug}.jpg"
        self.assertTrue(default_storage.exists(relative_path))
        size = default_storage.size(relative_path)
        self.assertLess(size, 150 * 1024, f"Photo galerie trop lourde : {size} octets")

        # Test d'idempotence stricte
        modifie_encore = generer_photo_galerie(fiche)
        self.assertFalse(modifie_encore, "Un second appel doit renvoyer False")

    def test_generer_toutes_images_demo_batch(self):
        """Vérifie la commande batch et les compteurs d'idempotence."""
        Actualite.objects.create(titre="Actu Test 1", contenu="Contenu 1")
        Partenaire.objects.create(nom="Partenaire Test 1")
        FicheInnovation.objects.create(
            projet=self.projet,
            titre="Fiche Test 1",
            probleme="Prob",
            solution="Sol",
            equipe="Eq",
            avancement="Idée",
        )

        # Premier passage
        stats1 = generer_toutes_images_demo()
        self.assertGreaterEqual(stats1["actualites_creees"], 1)
        self.assertGreaterEqual(stats1["partenaires_crees"], 1)
        self.assertGreaterEqual(stats1["galerie_creees"], 1)

        # Second passage : strictement 0 nouvelles images créées
        stats2 = generer_toutes_images_demo()
        self.assertEqual(stats2["actualites_creees"], 0)
        self.assertEqual(stats2["partenaires_crees"], 0)
        self.assertEqual(stats2["galerie_creees"], 0)
