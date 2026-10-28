"""Tests unitaires et d'intégration pour la Phase 4 Pathé (T1, T2, T3 Alertes).

Couvre l'intégralité des critères d'acceptation :
- T1 : Accusé de réception PDF d'un dossier soumis (accès porteur, équipe, comité, 403 tiers, 400 brouillon)
- T2 : Compte rendu projet au format PDF et Excel (contrôle des formats, 400 format inconnu, 403 tiers)
- T3 : Commande envoyer_alertes_retard (envoi email porteur et mentor, idempotence journalière en base)
"""
import io
from datetime import timedelta

from django.contrib.auth import get_user_model
from django.core import mail
from django.core.management import call_command
from django.test import override_settings
from django.urls import reverse
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APITestCase

from apps.core.models import Domaine, Projet, Role
from apps.incubator.models import (
    AffectationMentor,
    Dossier,
    Jalon,
    Objectif,
    Piece,
    StatutDossier,
    StatutJalon,
    StatutObjectif,
    SuiviProjet,
    TypePiece,
)
from apps.incubator.notifications import AlerteJalonEnvoyee

User = get_user_model()


@override_settings(PASSWORD_HASHERS=["django.contrib.auth.hashers.MD5PasswordHasher"])
class Phase4IncubatorTests(APITestCase):
    """Tests Phase 4 de Pathé sur le module incubateur."""

    def setUp(self):
        # Utilisateurs
        self.porteur1 = User.objects.create_user(
            email="porteur1@ciat.sn",
            first_name="Amadou",
            last_name="Diallo",
            password="password123",
            role=Role.PORTEUR,
        )
        self.porteur2 = User.objects.create_user(
            email="porteur2@ciat.sn",
            first_name="Fatou",
            last_name="Sow",
            password="password123",
            role=Role.PORTEUR,
        )
        self.mentor = User.objects.create_user(
            email="mentor1@ciat.sn",
            first_name="Ousmane",
            last_name="Ndiaye",
            password="password123",
            role=Role.MENTOR,
        )
        self.comite = User.objects.create_user(
            email="comite1@ciat.sn",
            first_name="Aïssatou",
            last_name="Ba",
            password="password123",
            role=Role.COMITE,
        )
        self.admin = User.objects.create_user(
            email="admin@ciat.sn",
            first_name="Lansana",
            last_name="Coly",
            password="password123",
            role=Role.ADMIN,
        )
        self.tiers = User.objects.create_user(
            email="tiers@ciat.sn",
            password="password123",
            role=Role.VISITEUR,
        )

        # Domaine & Projets
        self.domaine = Domaine.objects.create(nom="Énergie & Environnement")

        # Projet 1 & Dossier
        self.projet1 = Projet.objects.create(
            titre="Plateforme Solaire Intelligente",
            resume="Optimisation des panneaux solaires par IoT.",
            domaine=self.domaine,
            porteur=self.porteur1,
            statut=Projet.Statut.DEPOSE,
        )
        self.dossier1 = Dossier.objects.create(
            projet=self.projet1,
            statut=StatutDossier.SOUMIS,
            soumis_le=timezone.now(),
        )
        self.piece1 = Piece.objects.create(
            dossier=self.dossier1,
            type=TypePiece.FICHE_PROJET,
            nom="Fiche_Projet_Solaire.pdf",
            fichier="pieces/fiche.pdf",
        )
        self.piece2 = Piece.objects.create(
            dossier=self.dossier1,
            type=TypePiece.PRESENTATION_EQUIPE,
            nom="Presentation_Equipe_Solaire.pdf",
            fichier="pieces/equipe.pdf",
        )

        # Dossier en brouillon (pour test 400)
        self.projet_brouillon = Projet.objects.create(
            titre="Projet Éolien",
            resume="Brouillon",
            domaine=self.domaine,
            porteur=self.porteur1,
            statut=Projet.Statut.IDEE,
        )
        self.dossier_brouillon = Dossier.objects.create(
            projet=self.projet_brouillon,
            statut=StatutDossier.BROUILLON,
        )

        # Affectation mentor & Suivis pour Projet 1
        self.affectation = AffectationMentor.objects.create(
            projet=self.projet1,
            mentor=self.mentor,
            affecte_par=self.admin,
        )
        self.objectif1 = Objectif.objects.create(
            projet=self.projet1,
            libelle="Finaliser le dimensionnement électrique",
            echeance=timezone.now().date() + timedelta(days=30),
            statut=StatutObjectif.EN_COURS,
            cree_par=self.mentor,
        )
        self.jalon_en_retard = Jalon.objects.create(
            projet=self.projet1,
            titre="Dépôt des spécifications techniques",
            echeance=timezone.now().date() - timedelta(days=5),
            statut=StatutJalon.EN_COURS,
            cree_par=self.mentor,
        )
        self.jalon_a_jour = Jalon.objects.create(
            projet=self.projet1,
            titre="Tests en laboratoire ISEP",
            echeance=timezone.now().date() + timedelta(days=20),
            statut=StatutJalon.A_FAIRE,
            cree_par=self.mentor,
        )
        self.suivi1 = SuiviProjet.objects.create(
            projet=self.projet1,
            echeance="3_mois",
            bilan="Très bon démarrage du projet.",
            indicateurs={"avancement": "40%"},
            redige_par=self.mentor,
        )

    # ==========================================================================
    # T1 : Accusé de réception de candidature (PDF)
    # ==========================================================================

    def test_t1_porteur_telecharge_accuse_pdf_valide(self):
        """Le porteur propriétaire télécharge un PDF valide après soumission."""
        self.client.force_authenticate(user=self.porteur1)
        url = reverse("incubator:dossier-accuse", kwargs={"pk": self.dossier1.id})
        response = self.client.get(url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response["Content-Type"], "application/pdf")
        self.assertTrue(response["Content-Disposition"].startswith("attachment; filename="))
        self.assertTrue(response.content.startswith(b"%PDF-"))
        self.assertGreater(len(response.content), 1000)
        self.assertIn(b"%%EOF", response.content)

    def test_t1_equipe_et_comite_peuvent_telecharger_accuse(self):
        """L'équipe CIAT et les membres du comité ont accès à l'accusé de réception."""
        url = reverse("incubator:dossier-accuse", kwargs={"pk": self.dossier1.id})

        # Admin
        self.client.force_authenticate(user=self.admin)
        res_admin = self.client.get(url)
        self.assertEqual(res_admin.status_code, status.HTTP_200_OK)

        # Comité
        self.client.force_authenticate(user=self.comite)
        res_comite = self.client.get(url)
        self.assertEqual(res_comite.status_code, status.HTTP_200_OK)

    def test_t1_autre_porteur_ou_tiers_recoit_403(self):
        """Un porteur non propriétaire ou un tiers reçoit 403 Forbidden."""
        url = reverse("incubator:dossier-accuse", kwargs={"pk": self.dossier1.id})

        # Autre porteur
        self.client.force_authenticate(user=self.porteur2)
        res_autre = self.client.get(url)
        self.assertEqual(res_autre.status_code, status.HTTP_403_FORBIDDEN)

        # Tiers visiteur
        self.client.force_authenticate(user=self.tiers)
        res_tiers = self.client.get(url)
        self.assertEqual(res_tiers.status_code, status.HTTP_403_FORBIDDEN)

    def test_t1_dossier_brouillon_renvoie_400(self):
        """Un dossier encore en brouillon ne peut pas générer d'accusé de réception (400)."""
        self.client.force_authenticate(user=self.porteur1)
        url = reverse("incubator:dossier-accuse", kwargs={"pk": self.dossier_brouillon.id})
        response = self.client.get(url)

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("brouillon", str(response.data))

    # ==========================================================================
    # T2 : Compte rendu d'un projet en PDF et Excel
    # ==========================================================================

    def test_t2_compte_rendu_pdf_succes(self):
        """Export du compte rendu complet en PDF avec ?format=pdf."""
        self.client.force_authenticate(user=self.porteur1)
        url = reverse("incubator:projet-compte-rendu", kwargs={"pk": self.projet1.id})
        response = self.client.get(url, {"format": "pdf"})

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response["Content-Type"], "application/pdf")
        self.assertTrue(response.content.startswith(b"%PDF-"))
        self.assertGreater(len(response.content), 1000)
        self.assertIn(b"%%EOF", response.content)

    def test_t2_compte_rendu_excel_reste_fonctionnel(self):
        """Export du compte rendu au format Excel par défaut ou ?format=xlsx."""
        self.client.force_authenticate(user=self.porteur1)
        url = reverse("incubator:projet-compte-rendu", kwargs={"pk": self.projet1.id})
        response = self.client.get(url, {"format": "xlsx"})

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("spreadsheetml", response["Content-Type"])

    def test_t2_format_inconnu_renvoie_400(self):
        """Un format non supporté (ex: csv ou xml) renvoie 400 Bad Request."""
        self.client.force_authenticate(user=self.porteur1)
        url = reverse("incubator:projet-compte-rendu", kwargs={"pk": self.projet1.id})
        response = self.client.get(url, {"format": "csv"})

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_t2_tiers_non_autorise_recoit_403(self):
        """Un tiers non lié au projet reçoit 403 Forbidden pour le compte rendu."""
        self.client.force_authenticate(user=self.porteur2)
        url = reverse("incubator:projet-compte-rendu", kwargs={"pk": self.projet1.id})
        response = self.client.get(url, {"format": "pdf"})

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    # ==========================================================================
    # T3 : Alertes de retard par email et idempotence journalière
    # ==========================================================================

    def test_t3_commande_envoyer_alertes_retard_idempotente(self):
        """La commande envoie des emails aux concernés et est strictement idempotente sur la journée."""
        mail.outbox.clear()
        AlerteJalonEnvoyee.objects.all().delete()

        # Premier passage : doit envoyer 2 emails (1 porteur + 1 mentor)
        out = io.StringIO()
        call_command("envoyer_alertes_retard", stdout=out)

        # 2 emails envoyés
        self.assertEqual(len(mail.outbox), 2)
        destinataires = {m.to[0] for m in mail.outbox}
        self.assertIn(self.porteur1.email, destinataires)
        self.assertIn(self.mentor.email, destinataires)

        # Sujet et contenu
        premier_mail = mail.outbox[0]
        self.assertIn("[CIAT] Alerte de retard", premier_mail.subject)
        self.assertIn("Dépôt des spécifications techniques", premier_mail.body)

        # Vérification des traces en base
        self.assertEqual(AlerteJalonEnvoyee.objects.count(), 2)

        # Deuxième passage immédiat le même jour : doit ignorer et envoyer 0 nouvel email !
        mail.outbox.clear()
        out2 = io.StringIO()
        call_command("envoyer_alertes_retard", stdout=out2)

        self.assertEqual(len(mail.outbox), 0, "Idempotence violée : un email en double a été envoyé !")
        self.assertEqual(AlerteJalonEnvoyee.objects.count(), 2)
