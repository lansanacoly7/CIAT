"""Règles de suppression / retrait d'un projet par son porteur."""
from django.test import TestCase, override_settings
from rest_framework import status
from rest_framework.test import APIClient

from apps.core.models import Domaine, Projet, Role, User
from apps.incubator.models import Dossier

FAST_HASHERS = ["django.contrib.auth.hashers.MD5PasswordHasher"]


@override_settings(PASSWORD_HASHERS=FAST_HASHERS)
class SuppressionProjetTests(TestCase):
    @classmethod
    def setUpTestData(cls):
        cls.domaine = Domaine.objects.create(nom="TIC et Données")
        cls.porteur = User.objects.create_user(
            email="porteur@ciat.sn", password="Password123!", role=Role.PORTEUR
        )
        cls.autre_porteur = User.objects.create_user(
            email="autre@ciat.sn", password="Password123!", role=Role.PORTEUR
        )
        cls.comite = User.objects.create_user(
            email="comite@ciat.sn", password="Password123!", role=Role.COMITE
        )
        cls.admin = User.objects.create_user(
            email="admin@ciat.sn", password="Password123!", role=Role.ADMIN
        )

    def _projet(self, statut, porteur=None):
        projet = Projet.objects.create(
            titre=f"Projet {statut}", domaine=self.domaine,
            porteur=porteur or self.porteur, statut=statut,
        )
        Dossier.objects.create(projet=projet)
        return projet

    def _client(self, user):
        client = APIClient()
        client.force_authenticate(user=user)
        return client

    def _delete(self, projet, user=None):
        return self._client(user or self.porteur).delete(f"/api/projets/{projet.id}/")

    def test_porteur_supprime_definitivement_un_projet_idee(self):
        projet = self._projet(Projet.Statut.IDEE)
        res = self._delete(projet)
        self.assertEqual(res.status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(Projet.objects.filter(pk=projet.pk).exists())
        self.assertFalse(Dossier.objects.filter(projet_id=projet.pk).exists())

    def test_porteur_retire_un_dossier_depose_sans_le_supprimer(self):
        projet = self._projet(Projet.Statut.DEPOSE)
        res = self._delete(projet)
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        projet.refresh_from_db()
        self.assertEqual(projet.statut, Projet.Statut.RETIRE)
        self.assertTrue(Dossier.objects.filter(projet=projet).exists())

    def test_projet_retire_masque_au_porteur_mais_visible_du_comite(self):
        projet = self._projet(Projet.Statut.DEPOSE)
        self._delete(projet)
        ids_porteur = [p["id"] for p in self._client(self.porteur).get("/api/projets/").json().get("results", [])]
        ids_comite = [p["id"] for p in self._client(self.comite).get("/api/projets/").json().get("results", [])]
        self.assertNotIn(projet.id, ids_porteur)
        self.assertIn(projet.id, ids_comite)
        dossiers = self._client(self.porteur).get("/api/incubator/dossiers/").json()
        dossiers = dossiers.get("results", dossiers) if isinstance(dossiers, dict) else dossiers
        self.assertEqual([d for d in dossiers if d["id"] == projet.dossier.id], [])

    def test_porteur_ne_peut_pas_supprimer_un_projet_en_incubation(self):
        for statut in (
            Projet.Statut.SELECTIONNE, Projet.Statut.INCUBE, Projet.Statut.PROTOTYPE,
            Projet.Statut.TERMINE, Projet.Statut.REJETE,
        ):
            with self.subTest(statut=statut):
                projet = self._projet(statut)
                res = self._delete(projet)
                self.assertEqual(res.status_code, status.HTTP_403_FORBIDDEN)
                self.assertTrue(Projet.objects.filter(pk=projet.pk).exists())

    def test_porteur_tiers_ne_peut_pas_supprimer_le_projet_d_autrui(self):
        projet = self._projet(Projet.Statut.IDEE)
        res = self._delete(projet, user=self.autre_porteur)
        self.assertEqual(res.status_code, status.HTTP_404_NOT_FOUND)
        self.assertTrue(Projet.objects.filter(pk=projet.pk).exists())

    def test_comite_ne_peut_pas_supprimer(self):
        projet = self._projet(Projet.Statut.IDEE)
        res = self._delete(projet, user=self.comite)
        self.assertEqual(res.status_code, status.HTTP_403_FORBIDDEN)
        self.assertTrue(Projet.objects.filter(pk=projet.pk).exists())

    def test_admin_conserve_la_suppression_definitive(self):
        projet = self._projet(Projet.Statut.INCUBE)
        res = self._delete(projet, user=self.admin)
        self.assertEqual(res.status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(Projet.objects.filter(pk=projet.pk).exists())
