"""Service IA partagé. Tous les modules passent par ici pour appeler le modèle.

Exemple d'utilisation (générateur de documents, assistant, requêtes en langage naturel) :

    from apps.core.ai import ai

    texte = ai.generate(system="Tu rédiges des documents officiels.", prompt="Rédige ...")

Si ANTHROPIC_API_KEY n'est pas définie, `ai.generate` lève AINotConfigured : l'API doit alors
répondre par une erreur claire plutôt que de planter.
"""
from django.conf import settings


class AINotConfigured(Exception):
    """La clé d'API du modèle n'est pas renseignée dans le fichier .env."""


class AIService:
    def __init__(self):
        self._client = None

    @property
    def configured(self):
        return bool(settings.ANTHROPIC_API_KEY)

    def _get_client(self):
        if not self.configured:
            raise AINotConfigured("ANTHROPIC_API_KEY est absente du fichier .env.")
        if self._client is None:
            import anthropic

            self._client = anthropic.Anthropic(api_key=settings.ANTHROPIC_API_KEY)
        return self._client

    def generate(self, prompt, system="", max_tokens=2000, temperature=0.4):
        """Envoie une requête au modèle et renvoie le texte de la réponse."""
        client = self._get_client()
        message = client.messages.create(
            model=settings.AI_MODEL,
            max_tokens=max_tokens,
            temperature=temperature,
            system=system,
            messages=[{"role": "user", "content": prompt}],
        )
        return "".join(block.text for block in message.content if block.type == "text")

    def chat(self, messages, system="", max_tokens=1500, temperature=0.3):
        """Conversation : messages = [{"role": "user"|"assistant", "content": "..."}]."""
        client = self._get_client()
        message = client.messages.create(
            model=settings.AI_MODEL,
            max_tokens=max_tokens,
            temperature=temperature,
            system=system,
            messages=messages,
        )
        return "".join(block.text for block in message.content if block.type == "text")


ai = AIService()
