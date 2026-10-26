"""Visibilité de l'affectation d'un mentor : seules les personnes concernées peuvent la consulter."""
from django.test import override_settings
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from apps.core.models import Domaine, Projet, Role, User
from apps.incubator.models import AffectationMentor


@override_settings(PASSWORD_HASHERS=["django.contrib.auth.hashers.MD5PasswordHasher"])
class MentorVisibiliteTests(APITestCase):
    @classmethod
    def setUpTestData(cls):
        mk = lambda email, role: User.objects.create_user(email=email, password="x12345678", role=role)
        cls.coordo = mk("coordo@t.sn", Role.COORDONNATEUR)
        cls.mentor = mk("mentor@t.sn", Role.MENTOR)
        cls.autre_mentor = mk("autre-mentor@t.sn", Role.MENTOR)
        cls.porteur = mk("porteur@t.sn", Role.PORTEUR)
        cls.autre_porteur = mk("autre-porteur@t.sn", Role.PORTEUR)
        domaine = Domaine.objects.create(nom="Domaine de test")
        cls.projet = Projet.objects.create(
            titre="Projet", domaine=domaine, porteur=cls.porteur, statut=Projet.Statut.INCUBE
        )
        AffectationMentor.objects.create(projet=cls.projet, mentor=cls.mentor, affecte_par=cls.coordo)
        cls.url = reverse("incubator:projet-mentor", kwargs={"pk": cls.projet.pk})

    def _get(self, user):
        self.client.force_authenticate(user=user)
        return self.client.get(self.url)

    def test_anonyme_refuse(self):
        self.client.force_authenticate(user=None)
        self.assertEqual(self.client.get(self.url).status_code, status.HTTP_401_UNAUTHORIZED)

    def test_personnes_concernees_autorisees(self):
        for user in (self.coordo, self.porteur, self.mentor):
            res = self._get(user)
            self.assertEqual(res.status_code, status.HTTP_200_OK, user.email)
            self.assertEqual(res.data["mentor"], self.mentor.id)

    def test_tiers_refuses_et_email_du_mentor_non_expose(self):
        for user in (self.autre_porteur, self.autre_mentor):
            res = self._get(user)
            self.assertEqual(res.status_code, status.HTTP_403_FORBIDDEN, user.email)
            self.assertNotIn("mentor@t.sn", str(res.data))
