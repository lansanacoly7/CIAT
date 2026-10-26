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
    timeout = 60.0

    def _providers(self):
        config = settings.AI_PROVIDER_CONFIG
        ordered = [p for p in settings.AI_PROVIDERS if p in config]
        return [(name, config[name]) for name in ordered if config[name].get("api_key")]

    @property
    def configured(self):
        return bool(self._providers())

    def chat(self, messages, system="", max_tokens=1500, temperature=0.3, json_mode=False):
        """Conversation : messages = [{"role": "user"|"assistant", "content": "..."}]. Renvoie le texte."""
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
        """Raccourci pour une seule question."""
        return self.chat([{"role": "user", "content": prompt}], system=system, **kwargs)


ai = AIService()
