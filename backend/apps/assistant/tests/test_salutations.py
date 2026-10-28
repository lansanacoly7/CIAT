"""Les formules de politesse reçoivent une réponse directe, sans faux refus ni source."""
from django.test import SimpleTestCase

from apps.assistant.services import reponse_conversationnelle


class ReponseConversationnelleTests(SimpleTestCase):
    def test_salutations_recoivent_un_accueil(self):
        for texte in ["salut", "Bonjour !", "bonsoir", "Hello", "coucou", "Salut, ça va ?"]:
            rep = reponse_conversationnelle(texte)
            self.assertIsNotNone(rep, texte)
            self.assertIn("assistant du CIAT", rep)
            self.assertNotIn("désolé", rep)

    def test_remerciements_et_au_revoir(self):
        self.assertIn("plaisir", reponse_conversationnelle("merci beaucoup"))
        self.assertIn("bientôt", reponse_conversationnelle("au revoir"))

    def test_une_vraie_question_n_est_pas_interceptee(self):
        self.assertIsNone(reponse_conversationnelle("quelles pièces pour être incubé ?"))
        self.assertIsNone(reponse_conversationnelle("salut, comment déposer un dossier de candidature au CIAT cette année ?"))
        self.assertIsNone(reponse_conversationnelle(""))
