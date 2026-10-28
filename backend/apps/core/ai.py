"""Service IA partagé. Tous les modules passent par ici pour appeler un modèle de langage.

Les fournisseurs (Groq, Gemini, ...) utilisent le format « OpenAI-compatible » : un seul code les gère.
Changer de fournisseur, de modèle ou de clé se fait dans le fichier .env, sans toucher au code.

    from apps.core.ai import ai

    texte = ai.generate("Rédige ...", system="Tu rédiges des documents officiels.")
    reponse = ai.chat([{"role": "user", "content": "Bonjour"}], system="...")

AI_PROVIDERS donne l'ordre d'essai (ex. « groq,gemini ») : si le premier échoue (quota gratuit atteint,
panne), le suivant prend le relais automatiquement.
Pour ajouter un fournisseur : une entrée dans settings.AI_PROVIDER_CONFIG, une clé dans .env.
"""
import logging

import httpx
from django.conf import settings

logger = logging.getLogger(__name__)


class AINotConfigured(Exception):
    """Aucun fournisseur n'a de clé d'API dans le fichier .env."""


class AIError(Exception):
    """Tous les fournisseurs configurés ont échoué."""


class AIService:
    """Passerelle unifiée d'accès aux modèles de langage (LLM) pour la plateforme CIAT.

    Justification d'architecture et de sécurité :
    1. Isolation des secrets : aucune clé d'API n'est dispersée dans les modules métier.
    2. Résilience et continuité de service : implémente une bascule transparente (failover)
       ordonnée entre plusieurs fournisseurs (Groq, Gemini, etc.) en cas de panne réseau ou
       d'épuisement des quotas gratuits.
    3. Prévention du blocage applicatif : impose un délai d'attente strict (timeout) de 60 s
       pour éviter d'engorger les processus serveurs WSGI/ASGI.
    """

    timeout = 60.0

    def _providers(self):
        """Résout et ordonne les fournisseurs d'IA configurés avec une clé d'API valide.

        Règle de gouvernance : respecte scrupuleusement l'ordre de priorité défini
        dans la variable d'environnement AI_PROVIDERS pour privilégier les modèles
        les plus rapides ou économiques avant de basculer sur les solutions de secours.
        """
        config = settings.AI_PROVIDER_CONFIG
        ordered = [p for p in settings.AI_PROVIDERS if p in config]
        return [(name, config[name]) for name in ordered if config[name].get("api_key")]

    @property
    def configured(self):
        """Indique si au moins un fournisseur d'IA opérationnel dispose d'une clé d'API.

        Utilisé par les sondes de santé (healthcheck) et les modules métier pour
        activer gracieusement les modes dégradés (fallbacks hors-ligne) sans lever d'erreur 500.
        """
        return bool(self._providers())

    def chat(self, messages, system="", max_tokens=1500, temperature=0.3, json_mode=False):
        """Exécute un échange conversationnel avec tentative de bascule automatique.

        Règles de sécurité et robustesse :
        - json_mode : impose au fournisseur de forcer une réponse syntaxiquement JSON,
          sécurisant l'extraction programmatique des métadonnées (RAG assistant, sections
          de documents, requêtes statistiques) et réduisant les risques d'injection de prompt.
        - Isolation des erreurs : intercepte les échecs réseau ou HTTP 429/500 de chaque
          fournisseur pour tenter le suivant dans la liste ordonnée.
        - Lève AIError uniquement après épuisement complet de tous les fournisseurs configurés,
          permettant aux vues appelantes de renvoyer un statut HTTP 503 propre.
        """
        providers = self._providers()
        if not providers:
            raise AINotConfigured("Aucune clé d'API IA n'est définie dans le fichier .env.")

        payload_messages = ([{"role": "system", "content": system}] if system else []) + list(messages)
        errors = []
        for name, cfg in providers:
            body = {
                "model": cfg["model"],
                "messages": payload_messages,
                "max_tokens": max_tokens,
                "temperature": temperature,
            }
            if json_mode:
                body["response_format"] = {"type": "json_object"}
            try:
                resp = httpx.post(
                    f"{cfg['base_url'].rstrip('/')}/chat/completions",
                    headers={"Authorization": f"Bearer {cfg['api_key']}"},
                    json=body,
                    timeout=self.timeout,
                )
                resp.raise_for_status()
                return resp.json()["choices"][0]["message"]["content"] or ""
            except Exception as exc:  # quota, réseau, réponse inattendue : on essaie le suivant
                logger.warning("Fournisseur IA %s en échec : %s", name, exc)
                errors.append(f"{name}: {exc}")
        raise AIError("Tous les fournisseurs IA ont échoué. " + " | ".join(errors))

    def generate(self, prompt, system="", **kwargs):
        """Point d'entrée simplifié pour une génération mono-requête (sans historique préalable)."""
        return self.chat([{"role": "user", "content": prompt}], system=system, **kwargs)


ai = AIService()
