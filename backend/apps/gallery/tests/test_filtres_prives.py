"""Filtres réservés de la liste des fiches : `mes_fiches` (porteur) et `en_validation` (équipe CIAT)."""
from django.test import override_settings
from rest_framework.test import APITestCase

from apps.core.models import Domaine, Projet, Role, User
from apps.gallery.models import FicheInnovation

URL = "/api/gallery/fiches/"


@override_settings(PASSWORD_HASHERS=["django.contrib.auth.hashers.MD5PasswordHasher"])
class FiltresPrivesTests(APITestCase):
    @classmethod
    def setUpTestData(cls):
        mk = lambda email, role: User.objects.create_user(email=email, password="x12345678", role=role)
        cls.coordo = mk("coordo@g.sn", Role.COORDONNATEUR)
        cls.porteur_a = mk("a@g.sn", Role.PORTEUR)
        cls.porteur_b = mk("b@g.sn", Role.PORTEUR)
        domaine = Domaine.objects.create(nom="Domaine galerie")

        def fiche(titre, porteur, statut):
            projet = Projet.objects.create(
                titre=f"Projet {titre}", domaine=domaine, porteur=porteur, statut=Projet.Statut.PROTOTYPE
            )
            return FicheInnovation.objects.create(
                projet=projet, titre=titre, probleme="p", solution="s", equipe="e", statut=statut
            )

        cls.publiee = fiche("Publiée", cls.porteur_a, FicheInnovation.Statut.PUBLIE)
        cls.brouillon_a = fiche("Brouillon A", cls.porteur_a, FicheInnovation.Statut.BROUILLON)
        cls.validation_b = fiche("En validation B", cls.porteur_b, FicheInnovation.Statut.EN_VALIDATION)

    def _titres(self, user, query=""):
        self.client.force_authenticate(user=user)
        data = self.client.get(URL + query).json()
        items = data["results"] if isinstance(data, dict) and "results" in data else data
        return {x["titre"] for x in items}

    def test_public_ne_voit_que_les_fiches_publiees(self):
        self.assertEqual(self._titres(None), {"Publiée"})
        self.assertEqual(self._titres(None, "?mes_fiches=1"), {"Publiée"})
        self.assertEqual(self._titres(None, "?en_validation=1"), {"Publiée"})

    def test_mes_fiches_ne_montre_que_celles_du_porteur(self):
        self.assertEqual(self._titres(self.porteur_a, "?mes_fiches=1"), {"Publiée", "Brouillon A"})
        self.assertEqual(self._titres(self.porteur_b, "?mes_fiches=1"), {"En validation B"})

    def test_en_validation_reserve_a_l_equipe(self):
        self.assertEqual(self._titres(self.coordo, "?en_validation=1"), {"En validation B"})
        self.assertEqual(self._titres(self.porteur_a, "?en_validation=1"), {"Publiée"})
