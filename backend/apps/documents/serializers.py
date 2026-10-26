"""Sérialiseurs pour l'API du générateur de documents."""
from rest_framework import serializers

from apps.core.models import Projet
from apps.documents.models import ModeleDocument, TypeDocument


class TypeDocumentSerializer(serializers.ModelSerializer):
    """Sérialiseur pour la liste des types de documents."""

    class Meta:
        model = TypeDocument
        fields = ["id", "code", "nom"]


class SectionModeleSerializer(serializers.Serializer):
    """Structure d'une section au sein d'un modèle."""

    code = serializers.CharField()
    titre = serializers.CharField()
    consigne = serializers.CharField(required=False, allow_blank=True)


class ModeleDocumentSerializer(serializers.ModelSerializer):
    """Sérialiseur pour la liste des gabarits / modèles de documents."""

    type = serializers.PrimaryKeyRelatedField(read_only=True)
    sections = serializers.ListField(child=serializers.DictField())

    class Meta:
        model = ModeleDocument
        fields = ["id", "type", "nom", "apercu", "sections"]


class GenererDocumentInputSerializer(serializers.Serializer):
    """Sérialiseur des paramètres d'entrée pour la génération de document."""

    modele = serializers.PrimaryKeyRelatedField(
        queryset=ModeleDocument.objects.all(),
        required=True,
        help_text="Identifiant du modèle de document à utiliser",
    )
    sujet = serializers.CharField(
        required=True,
        min_length=3,
        help_text="Sujet ou objet principal du document à rédiger",
    )
    infos = serializers.DictField(
        required=False,
        default=dict,
        help_text="Données complémentaires facultatives (clé-valeur)",
    )
    projet = serializers.PrimaryKeyRelatedField(
        queryset=Projet.objects.all(),
        required=False,
        allow_null=True,
        default=None,
        help_text="Identifiant optionnel d'un projet incubé rattaché",
    )
