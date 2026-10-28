"""Tests unitaires pour l'assistant IA (P4) avec simulation (mock) du service IA.

Vérifie l'ensemble des exigences du brief et du contrat d'API :
1. Recherche documentaire stricte avec citations de sources (document_id, titre, extrait)
2. Refus explicite et sources vides pour toute question hors sujet
3. Mode atelier de rédaction (pitch, SWOT, fiche) sans sources obligatoires
4. Mention obligatoire d'usage de l'IA (avertissement_ia)
5. Gestion des erreurs IA (503 sans clé d'API, 503 si panne externe)
6. Isolation de l'historique par utilisateur et protection 401
7. Contrôle des droits d'indexation (403 non-admin, 200 admin)
8. Extraction multi-format (Word, PDF, texte) et découpage en passages
"""
import io
import json
import zipfile
from unittest.mock import PropertyMock, patch

from django.core.cache import cache
from django.core.files.uploadedfile import SimpleUploadedFile
from django.test import TestCase, override_settings
from rest_framework import status
from rest_framework.test import APIClient

from apps.assistant.models import Conversation, PassageDocument
from apps.assistant.services import (
    MESSAGE_REFUS_DOCUMENTS,
    decouper_en_passages,
    extraire_texte_docx,
    extraire_texte_pdf,
    indexer_documents_publics,
    rechercher_passages,
)
from apps.core.ai import AIError
from apps.core.models import Role, User
from apps.portal.models import DocumentPublic


@override_settings(PASSWORD_HASHERS=["django.contrib.auth.hashers.MD5PasswordHasher"])
class AssistantAPITestCase(TestCase):
    """Tests fonctionnels complets des routes /api/assistant/."""

    def setUp(self):
        cache.clear()
        self.client = APIClient()

        # Utilisateurs de test
        self.porteur1 = User.objects.create_user(
            email="porteur1@demo.ciat.sn",
            password="Password123!",
            role=Role.PORTEUR,
            first_name="Amina",
            last_name="Diallo",
        )
        self.porteur2 = User.objects.create_user(
            email="porteur2@demo.ciat.sn",
            password="Password123!",
            role=Role.PORTEUR,
            first_name="Moussa",
            last_name="Ba",
        )
        self.admin = User.objects.create_user(
            email="admin@demo.ciat.sn",
            password="Password123!",
            role=Role.ADMIN,
            first_name="Lansana",
            last_name="Coly",
            is_staff=True,
        )

        # Document public de référence pour l'indexation
        contenu_guide = (
            "Guide d'incubation CIAT 2026.\n"
            "Le programme d'incubation du CIAT accompagne les projets innovants "
            "pendant une durée de six mois renouvelable. "
            "Les porteurs sélectionnés bénéficient d'un hébergement, d'un mentor dédié "
            "et d'une subvention d'amorçage pouvant atteindre 10 millions FCFA "
            "après validation du comité de sélection."
        )
        fichier_test = SimpleUploadedFile(
            "guide_incubation.txt",
            contenu_guide.encode("utf-8"),
            content_type="text/plain",
        )
        self.doc_guide = DocumentPublic.objects.create(
            titre="Guide d'incubation CIAT 2026",
            categorie="Guides",
            fichier=fichier_test,
        )

        # Document secondaire (Charte éthique)
        contenu_charte = (
            "Charte éthique et déontologie du CIAT.\n"
            "Chaque porteur de projet s'engage à respecter les principes de transparence, "
            "de respect de la propriété intellectuelle et de non-discrimination."
        )
        fichier_charte = SimpleUploadedFile(
            "charte_ethique.txt",
            contenu_charte.encode("utf-8"),
            content_type="text/plain",
        )
        self.doc_charte = DocumentPublic.objects.create(
            titre="Charte éthique et déontologie",
            categorie="Chartes",
            fichier=fichier_charte,
        )

        # Indexation préalable des documents
        indexer_documents_publics()

    def tearDown(self):
        cache.clear()

    def test_acces_non_authentifie_refuse_401(self):
        """Toutes les routes de l'assistant exigent une authentification."""
        # Conversations
        resp = self.client.get("/api/assistant/conversations/")
        self.assertEqual(resp.status_code, status.HTTP_401_UNAUTHORIZED)

        resp = self.client.post("/api/assistant/conversations/", {"titre": "Test"})
        self.assertEqual(resp.status_code, status.HTTP_401_UNAUTHORIZED)

        # Messages
        resp = self.client.get("/api/assistant/conversations/1/messages/")
        self.assertEqual(resp.status_code, status.HTTP_401_UNAUTHORIZED)

        resp = self.client.post("/api/assistant/conversations/1/messages/", {"contenu": "Bonjour"})
        self.assertEqual(resp.status_code, status.HTTP_401_UNAUTHORIZED)

        # Indexation
        resp = self.client.post("/api/assistant/indexation/")
        self.assertEqual(resp.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_creer_et_lister_conversations(self):
        """Un utilisateur peut créer et lister ses conversations privées."""
        self.client.force_authenticate(user=self.porteur1)

        # Création sans titre fourni (valeur par défaut)
        resp_create = self.client.post("/api/assistant/conversations/", {})
        self.assertEqual(resp_create.status_code, status.HTTP_201_CREATED)
        conv_id = resp_create.data["id"]
        self.assertEqual(resp_create.data["titre"], "Nouvelle conversation")
        self.assertIn("cree_le", resp_create.data)

        # Lister les conversations
        resp_list = self.client.get("/api/assistant/conversations/")
        self.assertEqual(resp_list.status_code, status.HTTP_200_OK)
        self.assertEqual(len(resp_list.data), 1)
        self.assertEqual(resp_list.data[0]["id"], conv_id)

    def test_isolation_conversations_par_utilisateur(self):
        """Chaque utilisateur n'accède qu'à ses propres conversations et messages."""
        # Porteur 1 crée une conversation
        self.client.force_authenticate(user=self.porteur1)
        resp1 = self.client.post("/api/assistant/conversations/", {"titre": "Conversation Porteur 1"})
        conv1_id = resp1.data["id"]

        # Porteur 2 crée une conversation
        self.client.force_authenticate(user=self.porteur2)
        resp2 = self.client.post("/api/assistant/conversations/", {"titre": "Conversation Porteur 2"})
        conv2_id = resp2.data["id"]

        # Porteur 2 ne doit voir QUE sa propre conversation
        resp_list = self.client.get("/api/assistant/conversations/")
        self.assertEqual(len(resp_list.data), 1)
        self.assertEqual(resp_list.data[0]["id"], conv2_id)

        # Porteur 2 ne peut pas lire les messages de Porteur 1 (404 Not Found)
        resp_access = self.client.get(f"/api/assistant/conversations/{conv1_id}/messages/")
        self.assertEqual(resp_access.status_code, status.HTTP_404_NOT_FOUND)

        # Porteur 2 ne peut pas poster de message dans la conversation de Porteur 1
        resp_post = self.client.post(
            f"/api/assistant/conversations/{conv1_id}/messages/",
            {"contenu": "Tentative intrusion"},
        )
        self.assertEqual(resp_post.status_code, status.HTTP_404_NOT_FOUND)

    @patch("apps.core.ai.AIService.configured", new_callable=PropertyMock)
    @patch("apps.core.ai.AIService.chat")
    def test_question_pertinente_repond_avec_source(self, mock_chat, mock_configured):
        """Une question répondable renvoie la réponse IA et cite la bonne source documentaire."""
        mock_configured.return_value = True
        texte_attendu = "D'après le Guide d'incubation du CIAT, la durée du programme est de six mois renouvelable."
        mock_chat.return_value = json.dumps({
            "reponse": texte_attendu,
            "passages_utilises": [1],
        })

        self.client.force_authenticate(user=self.porteur1)
        conv = Conversation.objects.create(utilisateur=self.porteur1)

        payload = {
            "contenu": "Quelle est la durée de l'incubation au CIAT ?",
            "mode": "documents",
        }
        resp = self.client.post(f"/api/assistant/conversations/{conv.id}/messages/", payload)

        self.assertEqual(resp.status_code, status.HTTP_201_CREATED)
        self.assertEqual(resp.data["role"], "assistant")
        self.assertEqual(resp.data["contenu"], texte_attendu)
        self.assertIn("avertissement_ia", resp.data)
        self.assertTrue(len(resp.data["avertissement_ia"]) > 0)

        # Vérification des sources
        sources = resp.data["sources"]
        self.assertEqual(len(sources), 1)
        source_doc_ids = [s["document_id"] for s in sources]
        self.assertIn(self.doc_guide.id, source_doc_ids)

        premier_source = sources[0]
        self.assertEqual(premier_source["titre"], "Guide d'incubation CIAT 2026")
        self.assertTrue(len(premier_source["extrait"]) > 0)

        # Vérification de l'historique conservé dans la conversation
        messages_resp = self.client.get(f"/api/assistant/conversations/{conv.id}/messages/")
        self.assertEqual(messages_resp.status_code, status.HTTP_200_OK)
        self.assertEqual(len(messages_resp.data), 2)
        self.assertEqual(messages_resp.data[0]["role"], "user")
        self.assertEqual(messages_resp.data[0]["contenu"], payload["contenu"])
        self.assertEqual(messages_resp.data[1]["role"], "assistant")

    @patch("apps.core.ai.AIService.configured", new_callable=PropertyMock)
    @patch("apps.core.ai.AIService.chat")
    def test_question_ou_se_trouve_ciat_transmet_passage_situe_diamniadio(self, mock_chat, mock_configured):
        """La question 'Où se trouve le CIAT ?' avec un passage contenant 'situé à Diamniadio'
        doit transmettre ce passage au modèle via l'élargissement lexical / synonymes."""
        mock_configured.return_value = True
        texte_attendu = "Le CIAT est situé à Diamniadio, pôle urbain de l'innovation."
        mock_chat.return_value = json.dumps({
            "reponse": texte_attendu,
            "passages_utilises": [1],
        })

        # Création d'un document spécifique sur la localisation
        doc_loc = DocumentPublic.objects.create(
            titre="Présentation et implantation du CIAT",
            categorie="Présentation",
            fichier=SimpleUploadedFile(
                "implantation.txt",
                "Le siège du CIAT est situé à Diamniadio, pôle technologique sénégalais.".encode(),
                content_type="text/plain",
            ),
        )
        indexer_documents_publics()

        self.client.force_authenticate(user=self.porteur1)
        conv = Conversation.objects.create(utilisateur=self.porteur1)

        resp = self.client.post(
            f"/api/assistant/conversations/{conv.id}/messages/",
            {"contenu": "Où se trouve le CIAT ?", "mode": "documents"},
        )
        self.assertEqual(resp.status_code, status.HTTP_201_CREATED)
        self.assertEqual(resp.data["role"], "assistant")
        self.assertEqual(resp.data["contenu"], texte_attendu)
        mock_chat.assert_called_once()

        # Vérifier que le passage contenant 'situé à Diamniadio' est transmis au modèle
        messages_sent, kwargs = mock_chat.call_args
        self.assertTrue(kwargs.get("json_mode"))
        prompt_content = messages_sent[0][-1]["content"]
        self.assertIn("Diamniadio", prompt_content)
        self.assertIn("situé", prompt_content.lower())

        # Vérifier la source
        source_ids = [s["document_id"] for s in resp.data["sources"]]
        self.assertIn(doc_loc.id, source_ids)

    @patch("apps.core.ai.AIService.configured", new_callable=PropertyMock)
    @patch("apps.core.ai.AIService.chat")
    def test_question_sans_aucun_passage_donne_refus_sans_appel_modele(self, mock_chat, mock_configured):
        """Une question posée quand aucun passage n'existe du tout en base donne un refus
        immédiat sans faire appel au modèle distant."""
        mock_configured.return_value = True
        PassageDocument.objects.all().delete()
        DocumentPublic.objects.all().delete()

        self.client.force_authenticate(user=self.porteur1)
        conv = Conversation.objects.create(utilisateur=self.porteur1)

        payload = {
            "contenu": "Quelle est la météo spatiale sur la planète Saturne ?",
            "mode": "documents",
        }
        resp = self.client.post(f"/api/assistant/conversations/{conv.id}/messages/", payload)

        self.assertEqual(resp.status_code, status.HTTP_201_CREATED)
        self.assertEqual(resp.data["role"], "assistant")
        self.assertEqual(resp.data["contenu"], MESSAGE_REFUS_DOCUMENTS)
        self.assertEqual(resp.data["sources"], [])
        self.assertTrue(len(resp.data["avertissement_ia"]) > 0)

        # Le modèle distant n'a pas été appelé inutilement
        mock_chat.assert_not_called()

    @patch("apps.core.ai.AIService.configured", new_callable=PropertyMock)
    @patch("apps.core.ai.AIService.chat")
    def test_score_faible_ou_nul_envoie_quand_meme_passages_au_modele(self, mock_chat, mock_configured):
        """Si le score lexical est faible ou nul mais des passages existent, ils sont
        transmis au modèle en lui laissant la décision de refuser via le prompt."""
        mock_configured.return_value = True
        texte_refus = (
            "Désolé, les extraits fournis portent sur l'incubation au CIAT et ne contiennent "
            "pas d'information permettant de répondre à votre question sur la physique quantique."
        )
        mock_chat.return_value = json.dumps({
            "reponse": texte_refus,
            "passages_utilises": [],
        })

        self.client.force_authenticate(user=self.porteur1)
        conv = Conversation.objects.create(utilisateur=self.porteur1)

        payload = {
            "contenu": "Explique-moi les principes de la physique quantique.",
            "mode": "documents",
        }
        resp = self.client.post(f"/api/assistant/conversations/{conv.id}/messages/", payload)

        self.assertEqual(resp.status_code, status.HTTP_201_CREATED)
        self.assertEqual(resp.data["role"], "assistant")
        self.assertEqual(resp.data["contenu"], texte_refus)
        mock_chat.assert_called_once()
        _, kwargs = mock_chat.call_args
        self.assertTrue(kwargs.get("json_mode"))
        # Si passages_utilises est vide, sources est vide côté serveur
        self.assertEqual(resp.data["sources"], [])

    @patch("apps.core.ai.AIService.configured", new_callable=PropertyMock)
    @patch("apps.core.ai.AIService.chat")
    def test_seules_les_sources_reellement_utilisees_sont_renvoyees(self, mock_chat, mock_configured):
        """Lorsque plusieurs passages sont transmis dans le contexte, seules les sources
        dont le numéro est renvoyé dans passages_utilises sont incluses."""
        mock_configured.return_value = True
        mock_chat.return_value = json.dumps({
            "reponse": "D'après le Guide d'incubation CIAT 2026, l'accompagnement dure six mois renouvelable.",
            "passages_utilises": [1],
        })

        self.client.force_authenticate(user=self.porteur1)
        conv = Conversation.objects.create(utilisateur=self.porteur1)

        payload = {
            "contenu": "Quelle est la durée de l'incubation et que dit la charte ?",
            "mode": "documents",
        }
        resp = self.client.post(f"/api/assistant/conversations/{conv.id}/messages/", payload)

        self.assertEqual(resp.status_code, status.HTTP_201_CREATED)
        sources = resp.data["sources"]
        source_doc_ids = [s["document_id"] for s in sources]

        # Le guide d'incubation (passage 1) est cité
        self.assertIn(self.doc_guide.id, source_doc_ids)
        # La charte éthique n'a pas été déclarée utilisée donc absente
        self.assertNotIn(self.doc_charte.id, source_doc_ids)

    @patch("apps.core.ai.AIService.configured", new_callable=PropertyMock)
    @patch("apps.core.ai.AIService.chat")
    def test_numero_inconnu_ignore(self, mock_chat, mock_configured):
        """Un numéro de passage inconnu renvoyé par l'IA est ignoré et sources reste vide."""
        mock_configured.return_value = True
        mock_chat.return_value = json.dumps({
            "reponse": "Information sans source reconnue.",
            "passages_utilises": [999, "invalide"],
        })

        self.client.force_authenticate(user=self.porteur1)
        conv = Conversation.objects.create(utilisateur=self.porteur1)

        resp = self.client.post(
            f"/api/assistant/conversations/{conv.id}/messages/",
            {"contenu": "Question test numéro inconnu", "mode": "documents"},
        )
        self.assertEqual(resp.status_code, status.HTTP_201_CREATED)
        self.assertEqual(resp.data["contenu"], "Information sans source reconnue.")
        self.assertEqual(resp.data["sources"], [])

    @patch("apps.core.ai.AIService.configured", new_callable=PropertyMock)
    @patch("apps.core.ai.AIService.chat")
    def test_json_invalide_declenche_retry_puis_erreur_502(self, mock_chat, mock_configured):
        """Un JSON invalide renvoyé par le modèle déclenche une 2e tentative puis une erreur 502 claire."""
        mock_configured.return_value = True
        mock_chat.side_effect = ["Réponse brute non JSON", "Deuxième tentative encore non JSON"]

        self.client.force_authenticate(user=self.porteur1)
        conv = Conversation.objects.create(utilisateur=self.porteur1)

        resp = self.client.post(
            f"/api/assistant/conversations/{conv.id}/messages/",
            {"contenu": "Quelle est la durée de l'incubation ?", "mode": "documents"},
        )
        self.assertEqual(resp.status_code, status.HTTP_502_BAD_GATEWAY)
        self.assertEqual(mock_chat.call_count, 2)
        self.assertIn("detail", resp.data)
        self.assertIn("invalide", resp.data["detail"].lower())

    @patch("apps.core.ai.AIService.configured", new_callable=PropertyMock)
    @patch("apps.core.ai.AIService.chat")
    def test_json_invalide_reussit_au_retry(self, mock_chat, mock_configured):
        """Si la première tentative renvoie un JSON invalide mais la 2e est correcte, la réponse aboutit."""
        mock_configured.return_value = True
        mock_chat.side_effect = [
            "Erreur texte non formaté",
            json.dumps({
                "reponse": "Réponse récupérée après nouvelle tentative.",
                "passages_utilises": [1],
            }),
        ]

        self.client.force_authenticate(user=self.porteur1)
        conv = Conversation.objects.create(utilisateur=self.porteur1)

        resp = self.client.post(
            f"/api/assistant/conversations/{conv.id}/messages/",
            {"contenu": "Quelle est la durée ?", "mode": "documents"},
        )
        self.assertEqual(resp.status_code, status.HTTP_201_CREATED)
        self.assertEqual(mock_chat.call_count, 2)
        self.assertEqual(resp.data["contenu"], "Réponse récupérée après nouvelle tentative.")
        self.assertEqual(len(resp.data["sources"]), 1)


    @patch("apps.core.ai.AIService.configured", new_callable=PropertyMock)
    @patch("apps.core.ai.AIService.chat")
    def test_mode_atelier_redaction_sans_sources_obligatoires(self, mock_chat, mock_configured):
        """Le mode atelier assiste à la rédaction avec consigne [À COMPLÉTER] et interdiction d'inventer."""
        mock_configured.return_value = True
        mock_chat.return_value = (
            "Proposition de pitch : Notre solution solaire intelligente permet aux agriculteurs "
            "d'optimiser l'arrosage. Partenaires : [À COMPLÉTER : Noms des partenaires]."
        )

        self.client.force_authenticate(user=self.porteur1)
        conv = Conversation.objects.create(utilisateur=self.porteur1)

        payload = {
            "contenu": "Aide-moi à rédiger un pitch court pour mon projet d'irrigation solaire.",
            "mode": "atelier",
        }
        resp = self.client.post(f"/api/assistant/conversations/{conv.id}/messages/", payload)

        self.assertEqual(resp.status_code, status.HTTP_201_CREATED)
        self.assertEqual(resp.data["role"], "assistant")
        self.assertEqual(resp.data["contenu"], mock_chat.return_value)
        self.assertEqual(resp.data["sources"], [])
        self.assertTrue(len(resp.data["avertissement_ia"]) > 0)

        # Vérifier que le prompt système contient la consigne [À COMPLÉTER] et les interdictions strictes
        mock_chat.assert_called_once()
        _, kwargs = mock_chat.call_args
        system_prompt = kwargs.get("system", "")
        self.assertIn("[À COMPLÉTER", system_prompt)
        self.assertIn("chiffres", system_prompt)
        self.assertIn("partenaires", system_prompt)
        self.assertIn("se limiter", system_prompt)

    @patch("apps.core.ai.AIService.configured", new_callable=PropertyMock)
    def test_sans_cle_ia_repond_503_avec_message_clair(self, mock_configured):
        """Sans clé d'API configurée, l'endpoint renvoie 503 avec un message explicite en français."""
        mock_configured.return_value = False

        self.client.force_authenticate(user=self.porteur1)
        conv = Conversation.objects.create(utilisateur=self.porteur1)

        resp = self.client.post(
            f"/api/assistant/conversations/{conv.id}/messages/",
            {"contenu": "Bonjour l'assistant", "mode": "documents"},
        )
        self.assertEqual(resp.status_code, status.HTTP_503_SERVICE_UNAVAILABLE)
        self.assertIn("detail", resp.data)
        self.assertIn("configuré", resp.data["detail"].lower())

    @patch("apps.core.ai.AIService.configured", new_callable=PropertyMock)
    @patch("apps.core.ai.AIService.chat")
    def test_panne_fournisseur_ia_repond_503(self, mock_chat, mock_configured):
        """Si tous les fournisseurs IA échouent, l'endpoint renvoie 503."""
        mock_configured.return_value = True
        mock_chat.side_effect = AIError("Tous les fournisseurs IA ont échoué.")

        self.client.force_authenticate(user=self.porteur1)
        conv = Conversation.objects.create(utilisateur=self.porteur1)

        resp = self.client.post(
            f"/api/assistant/conversations/{conv.id}/messages/",
            {"contenu": "Aide-moi à rédiger une fiche projet", "mode": "atelier"},
        )
        self.assertEqual(resp.status_code, status.HTTP_503_SERVICE_UNAVAILABLE)
        self.assertIn("indisponible", resp.data["detail"].lower())

    def test_droits_indexation_admin_et_non_admin(self):
        """L'indexation est réservée à l'administrateur (403 pour un porteur, 200 pour un admin)."""
        # Porteur non admin -> 403 Forbidden
        self.client.force_authenticate(user=self.porteur1)
        resp_porteur = self.client.post("/api/assistant/indexation/")
        self.assertEqual(resp_porteur.status_code, status.HTTP_403_FORBIDDEN)

        # Administrateur -> 200 OK
        self.client.force_authenticate(user=self.admin)
        resp_admin = self.client.post("/api/assistant/indexation/")
        self.assertEqual(resp_admin.status_code, status.HTTP_200_OK)
        self.assertIn("documents_indexes", resp_admin.data)
        self.assertIn("passages_crees", resp_admin.data)
        self.assertEqual(resp_admin.data["documents_indexes"], 2)
        self.assertTrue(resp_admin.data["passages_crees"] >= 2)

    def test_validation_message_invalide(self):
        """Un contenu vide renvoie 400 Bad Request."""
        self.client.force_authenticate(user=self.porteur1)
        conv = Conversation.objects.create(utilisateur=self.porteur1)

        resp = self.client.post(f"/api/assistant/conversations/{conv.id}/messages/", {"contenu": ""})
        self.assertEqual(resp.status_code, status.HTTP_400_BAD_REQUEST)

    def test_decoupage_et_recherche_passages(self):
        """Teste les fonctions utilitaires de chunking et recherche lexicale."""
        texte_long = " ".join([f"mot{i}" for i in range(100)])
        passages = decouper_en_passages(texte_long, max_mots=30, recouvrement=5)
        self.assertTrue(len(passages) >= 3)

        # Recherche de passage existant
        resultats = rechercher_passages("durée incubation accompagnement")
        self.assertTrue(len(resultats) >= 1)
        self.assertEqual(resultats[0].document.id, self.doc_guide.id)

    def test_extraction_texte_docx_in_memory(self):
        """Vérifie l'extraction sans dépendance d'un fichier .docx zippé en mémoire."""
        docx_buffer = io.BytesIO()
        xml_content = (
            b'<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
            b'<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">'
            b"<w:body>"
            b"<w:p><w:r><w:t>Titre du document Word</w:t></w:r></w:p>"
            b"<w:p><w:r><w:t>Deuxi\xc3\xa8me paragraphe explicatif.</w:t></w:r></w:p>"
            b"</w:body></w:document>"
        )
        with zipfile.ZipFile(docx_buffer, "w") as z:
            z.writestr("word/document.xml", xml_content)

        texte_extrait = extraire_texte_docx(docx_buffer.getvalue())
        self.assertIn("Titre du document Word", texte_extrait)
        self.assertIn("Deuxième paragraphe explicatif.", texte_extrait)

    def test_extraction_texte_pdf_mock_direct(self):
        """Vérifie l'extraction de texte à partir de données PDF (ou mock texte)."""
        contenu = b"Texte simule pour un fichier PDF de test."
        texte_extrait = extraire_texte_pdf(contenu)
        self.assertEqual(texte_extrait, "Texte simule pour un fichier PDF de test.")
