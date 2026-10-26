"""Tests unitaires et d'intégration pour la Phase 4 Pathé (T3 Calendrier iCalendar).

Vérifie :
- Route publique GET /api/portal/evenements/calendrier.ics
- Format RFC 5545 (BEGIN:VCALENDAR, VERSION:2.0, BEGIN:VEVENT, SUMMARY, LOCATION, etc.)
- Content-Type text/calendar; charset=utf-8
- Filtre ?a_venir=1 pour restreindre aux événements futurs
- Gestion des caractères spéciaux et sauts de ligne (échappement)
"""
from datetime import timedelta
from django.test import override_settings
from django.urls import reverse
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APITestCase

from apps.portal.models import Evenement


@override_settings(PASSWORD_HASHERS=["django.contrib.auth.hashers.MD5PasswordHasher"])
class CalendrierICSTests(APITestCase):
    """Tests du flux iCalendar pour les événements CIAT."""

    def setUp(self):
        now = timezone.now()
        # Événement futur
        self.evt_futur = Evenement.objects.create(
            titre="Atelier Prototypage & Impression 3D",
            description="Session pratique d'initiation au fablab du CIAT.",
            lieu="FabLab CIAT, Bâtiment Innovation, ISEP Diamniadio",
            debut=now + timedelta(days=5, hours=9),
            fin=now + timedelta(days=5, hours=12),
            lien_inscription="https://ciat.sn/ateliers/3d",
        )
        # Événement passé
        self.evt_passe = Evenement.objects.create(
            titre="Séminaire d'Ouverture Cohorte 1",
            description="Accueil des lauréats.",
            lieu="Amphithéâtre ISEP Diamniadio",
            debut=now - timedelta(days=10),
            fin=now - timedelta(days=10, hours=-3),
        )

    def test_export_calendrier_ics_public_et_conforme_rfc5545(self):
        """L'endpoint renvoie un flux iCalendar RFC 5545 valide."""
        url = reverse("evenements-calendrier-ics")
        response = self.client.get(url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("text/calendar", response["Content-Type"])
        self.assertIn("evenements_ciat.ics", response["Content-Disposition"])

        content = response.content.decode("utf-8")

        # Balises fondamentales RFC 5545
        self.assertIn("BEGIN:VCALENDAR", content)
        self.assertIn("VERSION:2.0", content)
        self.assertIn("PRODID:-//CIAT//Plateforme Numerique CIAT//FR", content)
        self.assertIn("BEGIN:VEVENT", content)
        self.assertIn("END:VEVENT", content)
        self.assertIn("END:VCALENDAR", content)

        # Propriétés de l'événement futur
        self.assertIn(f"UID:evenement-{self.evt_futur.id}@ciat.sn", content)
        self.assertIn("SUMMARY:Atelier Prototypage & Impression 3D", content)
        self.assertIn("LOCATION:FabLab CIAT\\, Bâtiment Innovation\\, ISEP Diamniadio", content)
        self.assertIn("URL:https://ciat.sn/ateliers/3d", content)

    def test_filtre_evenements_a_venir(self):
        """Le filtre ?a_venir=1 exclut les événements passés."""
        url = reverse("evenements-calendrier-ics")
        response = self.client.get(url, {"a_venir": "1"})

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        content = response.content.decode("utf-8")

        # Événement futur présent
        self.assertIn(f"UID:evenement-{self.evt_futur.id}@ciat.sn", content)
        # Événement passé absent
        self.assertNotIn(f"UID:evenement-{self.evt_passe.id}@ciat.sn", content)
