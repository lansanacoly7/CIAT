"""Sérialiseurs pour l'API du générateur de documents (P5)."""
from rest_framework import serializers

from apps.core.models import Projet
from apps.documents.models import (
    Document,
    ModeleDocument,
    TypeDocument,
    VersionDocument,
)

# ==============================================================================
# Phase 1 — Types, Modèles et Génération
# ==============================================================================

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


# ==============================================================================
# Phase 2 — Consultation, Versions et Modification
# ==============================================================================

class VersionDocumentSerializer(serializers.ModelSerializer):
    """Format : { numero, sections: [{ code, titre, contenu }], auteur, cree_le }"""

    sections = serializers.ListField(child=serializers.DictField())
    auteur = serializers.PrimaryKeyRelatedField(read_only=True)
    cree_le = serializers.DateTimeField(source="date", read_only=True)

    class Meta:
        model = VersionDocument
        fields = ["numero", "sections", "auteur", "cree_le"]


class DocumentListSerializer(serializers.ModelSerializer):
    """Format : { id, titre, modele, projet, auteur, statut, version_courante, cree_le, modifie_le }"""

    modele = serializers.PrimaryKeyRelatedField(read_only=True)
    projet = serializers.PrimaryKeyRelatedField(read_only=True)
    auteur = serializers.PrimaryKeyRelatedField(read_only=True)
    version_courante = serializers.IntegerField(read_only=True)

    class Meta:
        model = Document
        fields = [
            "id",
            "titre",
            "modele",
            "projet",
            "auteur",
            "statut",
            "version_courante",
            "cree_le",
            "modifie_le",
        ]


class DocumentDetailSerializer(DocumentListSerializer):
    """Format : { id, titre, modele, projet, auteur, statut, version_courante, cree_le, modifie_le, sections }"""

    sections = serializers.SerializerMethodField()

    class Meta(DocumentListSerializer.Meta):
        fields = DocumentListSerializer.Meta.fields + ["sections"]

    def get_sections(self, obj):
        dv = obj.derniere_version
        return dv.sections if dv else []


class DocumentPatchSerializer(serializers.Serializer):
    """Payload pour PATCH /{id}/ : { sections: [{ code, contenu }] }"""

    sections = serializers.ListField(
        child=serializers.DictField(),
        required=True,
        allow_empty=False,
        help_text="Liste des sections modifiées : [{'code': '...', 'contenu': '...'}]",
    )
