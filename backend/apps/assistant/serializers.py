"""Sérialiseurs pour l'assistant IA (P4)."""
from rest_framework import serializers

from .models import Conversation, MessageAssistant


class ConversationSerializer(serializers.ModelSerializer):
    """Sérialiseur d'une conversation (liste et création)."""

    titre = serializers.CharField(
        max_length=200,
        required=False,
        default="Nouvelle conversation",
    )

    class Meta:
        model = Conversation
        fields = ["id", "titre", "cree_le"]
        read_only_fields = ["id", "cree_le"]


class SourceCitationSerializer(serializers.Serializer):
    """Citation d'un passage documentaire servant de source."""

    document_id = serializers.IntegerField()
    titre = serializers.CharField()
    extrait = serializers.CharField()


class MessageAssistantSerializer(serializers.ModelSerializer):
    """Sérialiseur d'un message (utilisateur ou assistant) avec sources et avertissement."""

    class Meta:
        model = MessageAssistant
        fields = ["id", "role", "contenu", "sources", "avertissement_ia", "cree_le"]
        read_only_fields = ["id", "role", "sources", "avertissement_ia", "cree_le"]


class CreerMessageInputSerializer(serializers.Serializer):
    """Données d'entrée pour poser une question à l'assistant."""

    contenu = serializers.CharField(
        required=True,
        allow_blank=False,
        help_text="Question ou consigne posée à l'assistant",
    )
    mode = serializers.ChoiceField(
        choices=MessageAssistant.Mode.choices,
        default=MessageAssistant.Mode.DOCUMENTS,
        required=False,
        help_text="Mode d'échange : 'documents' (recherche stricte) ou 'atelier' (rédaction)",
    )
