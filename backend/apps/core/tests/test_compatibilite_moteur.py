"""Tests de compatibilité entre moteurs de bases de données (PostgreSQL vs SQLite) — CIAT Phase 5 (T1)."""
import unittest
from django.db import connection
from django.test import TestCase

from apps.core.models import Domaine


class CompatibiliteMoteurTests(TestCase):
    """Vérifie les comportements spécifiques de PostgreSQL face à SQLite."""

    def setUp(self):
        self.domaine = Domaine.objects.create(
            nom="Éducation et Formation professionnelle",
        )

    @unittest.skipUnless(
        connection.vendor == "postgresql",
        "La recherche icontains insensible aux majuscules accentuées (É -> é) nécessite PostgreSQL.",
    )
    def test_recherche_icontains_accentuee_postgresql(self):
        """Vérifie que la recherche insensible à la casse trouve 'Éducation' via 'éducation'.

        Sous SQLite, LIKE/icontains ne gère la casse que pour les caractères ASCII (A-Z).
        Sur PostgreSQL, le support complet Unicode de ILIKE résout 'éducation' vers 'Éducation'.
        """
        resultat = Domaine.objects.filter(nom__icontains="éducation")
        self.assertEqual(resultat.count(), 1)
        self.assertEqual(resultat.first(), self.domaine)
