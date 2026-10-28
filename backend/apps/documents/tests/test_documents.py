"""Tests unitaires pour le générateur de documents (P5) avec mock du service IA."""
import json
from unittest.mock import PropertyMock, patch

from django.test import TestCase, override_settings
from rest_framework import status
from rest_framework.test import APIClient

from apps.core.models import Domaine, Projet, Role, User
from apps.documents.models import Document, ModeleDocument


@override_settings(PASSWORD_HASHERS=["django.contrib.auth.hashers.MD5PasswordHasher"])
class DocumentsAPITestCase(TestCase):
    """Vérifie les endpoints /types/, /modeles/ et /generer/ selon le contrat d'API."""

    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(
            email="porteur.test@demo.ciat.sn",
            password="Ciat2026!",
            role=Role.PORTEUR,
            first_name="Lansana",
            last_name="Test",
        )

        self.domaine = Domaine.objects.create(nom="TIC et Numérique", slug="tic-numerique")
        self.projet = Projet.objects.create(
            titre="Projet Démo IA",
            resume="Résumé du projet",
            probleme="Problème adressé",
            solution="Solution technique",
            domaine=self.domaine,
            porteur=self.user,
            statut=Projet.Statut.INCUBE,
        )

        # Récupère un modèle existant créé par la migration seed_documents
        self.modele = ModeleDocument.objects.filter(type__code="fiche_projet").first()
        self.assertIsNotNone(self.modele, "Un modèle de type fiche_projet doit exister via la migration.")

    def test_acces_non_authentifie_refuse_401(self):
        """Les endpoints de documents exigent une authentification."""
        # GET /api/documents/types/
        resp_types = self.client.get("/api/documents/types/")
        self.assertEqual(resp_types.status_code, status.HTTP_401_UNAUTHORIZED)

        # GET /api/documents/modeles/
        resp_modeles = self.client.get("/api/documents/modeles/")
        self.assertEqual(resp_modeles.status_code, status.HTTP_401_UNAUTHORIZED)

        # POST /api/documents/generer/
        resp_generer = self.client.post("/api/documents/generer/", {})
        self.assertEqual(resp_generer.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_liste_types_et_modeles_authentifie(self):
        """Vérifie le contrat d'API pour /types/ et /modeles/ avec filtrage pour les 9 types et 27 modèles."""
        self.client.force_authenticate(user=self.user)

        # 1. Types (9 types requis par le sujet CIAT)
        resp_types = self.client.get("/api/documents/types/")
        self.assertEqual(resp_types.status_code, status.HTTP_200_OK)
        types_data = resp_types.json()
        self.assertIsInstance(types_data, list)
        self.assertEqual(len(types_data), 9)
        type_codes = {t["code"] for t in types_data}
        types_attendus = {
            "appel_candidatures",
            "fiche_projet",
            "convention",
            "proces_verbal",
            "attestation",
            "fiche_partenaire",
            "rapport_suivi",
            "compte_rendu",
            "rapport_annuel",
        }
        self.assertEqual(type_codes, types_attendus)

        # 2. Modèles sans filtre (27 modèles au total : 3 par type)
        resp_modeles = self.client.get("/api/documents/modeles/")
        self.assertEqual(resp_modeles.status_code, status.HTTP_200_OK)
        modeles_data = resp_modeles.json()
        self.assertEqual(len(modeles_data), 27)

        # 3. Modèles avec filtre par code de type (?type=<code>) pour chacun des 9 types
        for code in types_attendus:
            resp_filtre = self.client.get(f"/api/documents/modeles/?type={code}")
            self.assertEqual(resp_filtre.status_code, status.HTTP_200_OK)
            filtre_data = resp_filtre.json()
            self.assertEqual(len(filtre_data), 3, f"Le type {code} doit avoir exactement 3 modèles.")
            for m in filtre_data:
                self.assertIn("sections", m)
                self.assertIsInstance(m["sections"], list)
                self.assertGreaterEqual(len(m["sections"]), 1)

    @patch("apps.documents.services.ai.chat")
    @patch("apps.core.ai.AIService.configured", new_callable=PropertyMock)
    def test_generer_document_succes(self, mock_configured, mock_chat):
        """Génération réussie d'un document structuré conforme au contrat P5."""
        mock_configured.return_value = True

        # Prépare une réponse JSON simulée correspondant aux sections du modèle
        mock_response = {
            s["code"]: f"Contenu rédigé pour la section {s['titre']} dans le cadre du CIAT."
            for s in self.modele.sections
        }
        mock_chat.return_value = json.dumps(mock_response)

        self.client.force_authenticate(user=self.user)
        payload = {
            "modele": self.modele.id,
            "sujet": "Création d'un nouveau système d'irrigation pour la zone des Niayes",
            "infos": {"budget": "5 000 000 FCFA", "delai": "6 mois"},
            "projet": self.projet.id,
        }

        resp = self.client.post("/api/documents/generer/", payload, format="json")
        self.assertEqual(resp.status_code, status.HTTP_201_CREATED)

        data = resp.json()
        # Contrat : { id, titre, sections: [{ code, titre, contenu }], statut: "brouillon", version: 1 }
        self.assertIn("id", data)
        self.assertIn("titre", data)
        self.assertEqual(data["statut"], "brouillon")
        self.assertEqual(data["version"], 1)
        self.assertIsInstance(data["sections"], list)
        self.assertEqual(len(data["sections"]), len(self.modele.sections))

        for sec in data["sections"]:
            self.assertIn("code", sec)
            self.assertIn("titre", sec)
            self.assertIn("contenu", sec)
            self.assertTrue(sec["contenu"].startswith("Contenu rédigé pour la section"))

        # Vérification en base de données
        doc = Document.objects.filter(id=data["id"]).first()
        self.assertIsNotNone(doc)
        self.assertEqual(doc.auteur, self.user)
        self.assertEqual(doc.projet, self.projet)
        self.assertEqual(doc.versions.count(), 1)
        version = doc.versions.first()
        self.assertEqual(version.numero, 1)
        self.assertEqual(version.auteur, self.user)

    @patch("apps.documents.services.ai.chat")
    @patch("apps.core.ai.AIService.configured", new_callable=PropertyMock)
    def test_generer_document_json_invalide_avec_retry_puis_502(self, mock_configured, mock_chat):
        """Si l'IA renvoie du texte non-JSON, le moteur retente puis renvoie 502 Bad Gateway."""
        mock_configured.return_value = True
        mock_chat.return_value = "Ceci n'est pas un JSON valide mais une réponse brute non structurée."

        self.client.force_authenticate(user=self.user)
        payload = {
            "modele": self.modele.id,
            "sujet": "Sujet de test avec JSON défaillant",
        }

        resp = self.client.post("/api/documents/generer/", payload, format="json")
        self.assertEqual(resp.status_code, status.HTTP_502_BAD_GATEWAY)
        self.assertIn("invalide ou incomplète après nouvelle tentative", resp.json()["detail"])

        # Vérifie que le moteur a bien retenté (2 appels au total)
        self.assertEqual(mock_chat.call_count, 2)

    @patch("apps.documents.services.ai.chat")
    @patch("apps.core.ai.AIService.configured", new_callable=PropertyMock)
    def test_generer_document_section_manquante_avec_retry_puis_502(self, mock_configured, mock_chat):
        """Si l'IA omet une section requise par le modèle, le moteur retente puis renvoie 502."""
        mock_configured.return_value = True

        # Réponse incomplète : seule la première section est fournie
        premiere_section = self.modele.sections[0]["code"]
        reponse_incomplete = {premiere_section: "Seul ce contenu est présent."}
        mock_chat.return_value = json.dumps(reponse_incomplete)

        self.client.force_authenticate(user=self.user)
        payload = {
            "modele": self.modele.id,
            "sujet": "Sujet avec section manquante",
        }

        resp = self.client.post("/api/documents/generer/", payload, format="json")
        self.assertEqual(resp.status_code, status.HTTP_502_BAD_GATEWAY)
        self.assertEqual(mock_chat.call_count, 2)

    @patch("apps.core.ai.AIService.configured", new_callable=PropertyMock)
    def test_generer_document_absence_de_cle_503(self, mock_configured):
        """Sans clé d'API, l'endpoint répond 503 avec un message clair en français, jamais une 500."""
        mock_configured.return_value = False

        self.client.force_authenticate(user=self.user)
        payload = {
            "modele": self.modele.id,
            "sujet": "Test sans clé d'API",
        }

        resp = self.client.post("/api/documents/generer/", payload, format="json")
        self.assertEqual(resp.status_code, status.HTTP_503_SERVICE_UNAVAILABLE)
        data = resp.json()
        self.assertIn("detail", data)
        self.assertIn("aucune clé d'API disponible", data["detail"])

    def test_generer_document_parametres_invalides_400(self):
        """Un modèle inexistant ou un sujet absent renvoie 400 Bad Request."""
        self.client.force_authenticate(user=self.user)

        # Modèle manquant
        resp1 = self.client.post("/api/documents/generer/", {"sujet": "Texte sans modèle"}, format="json")
        self.assertEqual(resp1.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("modele", resp1.json())

        # Sujet manquant
        resp2 = self.client.post("/api/documents/generer/", {"modele": self.modele.id}, format="json")
        self.assertEqual(resp2.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("sujet", resp2.json())

    @patch("apps.documents.services.ai.chat")
    @patch("apps.core.ai.AIService.configured", new_callable=PropertyMock)
    def test_consignes_prompt_priorite_infos_et_interdiction_inventer(self, mock_configured, mock_chat):
        """Vérifie que le prompt transmis au service IA contient la priorité des infos et l'interdiction d'inventer avec [À COMPLÉTER : ...]."""
        mock_configured.return_value = True

        mock_response = {
            s["code"]: f"Contenu section {s['titre']} avec [À COMPLÉTER : date]."
            for s in self.modele.sections
        }
        mock_chat.return_value = json.dumps(mock_response)

        self.client.force_authenticate(user=self.user)
        payload = {
            "modele": self.modele.id,
            "sujet": "Convention d'incubation personnalisée",
            "infos": {
                "porteur": "Aminata Ndiaye Remplaçante",
                "delai": "12 mois fermes",
            },
            "projet": self.projet.id,
        }

        resp = self.client.post("/api/documents/generer/", payload, format="json")
        self.assertEqual(resp.status_code, status.HTTP_201_CREATED)

        # Extraction des prompts passés à ai.chat
        self.assertTrue(mock_chat.called)
        args, kwargs = mock_chat.call_args
        messages = args[0] if args else kwargs.get("messages", [])
        system_prompt = kwargs.get("system", "")
        user_prompt = "\n".join(m.get("content", "") for m in messages if isinstance(m, dict))
        full_prompt = f"{system_prompt}\n{user_prompt}"

        # 1. Vérification de la consigne de priorité des « infos » sur le projet lié en cas de conflit
        self.assertIn("priorité", full_prompt.lower())
        self.assertIn("infos", full_prompt.lower())
        self.assertIn("projet", full_prompt.lower())
        self.assertIn("conflit", full_prompt.lower())

        # 2. Vérification de l'interdiction étendue d'inventer
        self.assertIn("règles", full_prompt.lower())
        self.assertIn("obligations", full_prompt.lower())
        self.assertIn("procédures", full_prompt.lower())
        self.assertIn("organismes", full_prompt.lower())
        self.assertIn("délais", full_prompt.lower())
        self.assertIn("clauses juridiques", full_prompt.lower())

        # 3. Vérification de la consigne d'écriture explicite « [À COMPLÉTER : ...] »
        self.assertIn("[À COMPLÉTER : ...]", full_prompt)

    @patch("apps.documents.services.ai.chat")
    @patch("apps.core.ai.AIService.configured", new_callable=PropertyMock)
    def test_generer_document_tous_les_nouveaux_types_sujet(self, mock_configured, mock_chat):
        """Vérifie que la génération fonctionne pour les 5 nouveaux types : attestation, fiche partenaire, rapport de suivi, compte rendu, rapport annuel."""
        mock_configured.return_value = True
        self.client.force_authenticate(user=self.user)

        nouveaux_types = [
            ("attestation", "Attestation officielle d'incubation CIAT"),
            ("fiche_partenaire", "Fiche de partenariat technologique avec l'entreprise partenaire"),
            ("rapport_suivi", "Rapport trimestriel d'étape du projet"),
            ("compte_rendu", "Compte rendu de session de mentorat technique"),
            ("rapport_annuel", "Bilan annuel d'activité et d'impact du centre"),
        ]

        for code_type, sujet_test in nouveaux_types:
            modele = ModeleDocument.objects.filter(type__code=code_type).first()
            self.assertIsNotNone(modele, f"Le modèle pour {code_type} doit exister.")

            mock_response = {
                s["code"]: f"Contenu généré pour {s['titre']} du type {code_type}."
                for s in modele.sections
            }
            mock_chat.return_value = json.dumps(mock_response)

            payload = {
                "modele": modele.id,
                "sujet": sujet_test,
                "infos": {"contexte": "Test de génération automatique CIAT"},
                "projet": self.projet.id,
            }

            resp = self.client.post("/api/documents/generer/", payload, format="json")
            self.assertEqual(
                resp.status_code,
                status.HTTP_201_CREATED,
                f"La génération pour {code_type} doit renvoyer 201 Created.",
            )

            data = resp.json()
            self.assertEqual(data["statut"], "brouillon")
            self.assertEqual(data["version"], 1)
            self.assertEqual(len(data["sections"]), len(modele.sections))

            # Vérification de l'enregistrement en base
            doc = Document.objects.filter(id=data["id"]).first()
            self.assertIsNotNone(doc)
            self.assertEqual(doc.modele, modele)
            self.assertEqual(doc.versions.count(), 1)

