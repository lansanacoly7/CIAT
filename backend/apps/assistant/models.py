"""Modèles du module Assistant IA (apps.assistant) — Phase 2 (T1 / P4).

Gère l'indexation locale des documents publics en passages découpés,
les conversations entre les utilisateurs et l'assistant, ainsi que l'historique
des messages et citations de sources.
"""
from django.conf import settings
from django.db import models


class PassageDocument(models.Model):
    """Passage textuel extrait d'un document public du portail CIAT.

    Découpé en morceaux d'environ 200 à 300 mots pour permettre une recherche
    par mots-clés performante sans service payant ni base vectorielle externe.
    """

    document = models.ForeignKey(
        "portal.DocumentPublic",
        on_delete=models.CASCADE,
        related_name="passages",
        verbose_name="Document public",
    )
    texte = models.TextField(help_text="Extrait textuel du passage")
    position = models.PositiveIntegerField(
        default=0,
        help_text="Ordre chronologique ou logique du passage dans le document",
    )
    cree_le = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["document", "position"]
        verbose_name = "Passage de document"
        verbose_name_plural = "Passages de documents"

    def __str__(self):
        return f"Passage #{self.position} de {self.document.titre}"


class Conversation(models.Model):
    """Conversation privée entre un utilisateur connecté et l'assistant IA."""

    utilisateur = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="conversations_assistant",
        verbose_name="Utilisateur",
    )
    titre = models.CharField(
        max_length=200,
        default="Nouvelle conversation",
        help_text="Titre résumé de l'échange",
    )
    cree_le = models.DateTimeField(auto_now_add=True)
    modifie_le = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-modifie_le"]
        verbose_name = "Conversation"
        verbose_name_plural = "Conversations"

    def __str__(self):
        return f"{self.titre} ({self.utilisateur.email})"


class MessageAssistant(models.Model):
    """Message échangé au sein d'une conversation (rôle utilisateur ou assistant)."""

    class Role(models.TextChoices):
        USER = "user", "Utilisateur"
        ASSISTANT = "assistant", "Assistant"

    class Mode(models.TextChoices):
        DOCUMENTS = "documents", "Recherche dans les documents"
        ATELIER = "atelier", "Atelier de rédaction"

    conversation = models.ForeignKey(
        Conversation,
        on_delete=models.CASCADE,
        related_name="messages",
        verbose_name="Conversation",
    )
    role = models.CharField(
        max_length=20,
        choices=Role.choices,
        default=Role.USER,
        verbose_name="Rôle",
    )
    contenu = models.TextField(verbose_name="Contenu du message")
    sources = models.JSONField(
        default=list,
        blank=True,
        help_text="Sources documentaires citées : [{'document_id', 'titre', 'extrait'}]",
    )
    avertissement_ia = models.CharField(
        max_length=255,
        blank=True,
        default="",
        help_text="Mention légale obligatoire rappelant l'utilisation de l'intelligence artificielle",
    )
    mode = models.CharField(
        max_length=20,
        choices=Mode.choices,
        default=Mode.DOCUMENTS,
        verbose_name="Mode d'échange",
    )
    cree_le = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["cree_le"]
        verbose_name = "Message"
        verbose_name_plural = "Messages"

    def __str__(self):
        return f"[{self.role}] {self.conversation.titre} ({self.cree_le:%Y-%m-%d %H:%M})"
