"""Sérialiseurs pour la Galerie des innovations (P6)."""
from rest_framework import serializers

from apps.core.models import Projet

from .models import FicheInnovation


class MediaItemSerializer(serializers.Serializer):
    """Validation d'un élément média associé à une fiche."""

    type = serializers.ChoiceField(
        choices=["photo", "video", "demo"],
        help_text="Type de média : photo, video ou demo",
    )
    url = serializers.CharField(
        max_length=500,
        help_text="URL du média",
    )


class FicheInnovationSerializer(serializers.ModelSerializer):
    """Sérialiseur de consultation d'une fiche d'innovation.

    Ne renvoie STRICTEMENT aucune donnée personnelle ou confidentielle
    (pas d'email, pas de téléphone du porteur).
    """

    projet = serializers.PrimaryKeyRelatedField(
        queryset=Projet.objects.all(),
        help_text="Identifiant du projet associé",
    )
    medias = serializers.ListField(
        child=serializers.DictField(),
        required=False,
        default=list,
    )

    class Meta:
        model = FicheInnovation
        fields = [
            "id",
            "slug",
            "projet",
            "titre",
            "probleme",
            "solution",
            "equipe",
            "avancement",
            "medias",
            "statut",
            "vues",
        ]
        read_only_fields = ["id", "slug", "statut", "vues"]

    def validate_medias(self, value):
        """Valide le format de chaque élément de la liste medias."""
        if not isinstance(value, list):
            raise serializers.ValidationError("Le champ medias doit être une liste.")
        valides = []
        for index, item in enumerate(value):
            if not isinstance(item, dict):
                raise serializers.ValidationError(
                    f"L'élément média #{index} doit être un dictionnaire avec 'type' et 'url'."
                )
            type_media = item.get("type")
            url_media = item.get("url")
            if type_media not in ("photo", "video", "demo"):
                raise serializers.ValidationError(
                    f"Type de média invalide à l'index #{index} : attendu 'photo', 'video' ou 'demo'."
                )
            if not url_media or not isinstance(url_media, str):
                raise serializers.ValidationError(
                    f"URL manquante ou invalide à l'index #{index}."
                )
            valides.append({"type": type_media, "url": url_media.strip()})
        return valides


class FicheInnovationCreateSerializer(FicheInnovationSerializer):
    """Sérialiseur pour la création d'une fiche par un porteur pour son projet."""

    class Meta(FicheInnovationSerializer.Meta):
        fields = [
            "id",
            "slug",
            "projet",
            "titre",
            "probleme",
            "solution",
            "equipe",
            "avancement",
            "medias",
            "statut",
            "vues",
        ]
        read_only_fields = ["id", "slug", "statut", "vues"]


class FicheStatistiqueItemSerializer(serializers.Serializer):
    """Statistiques de consultation par fiche."""

    slug = serializers.CharField()
    titre = serializers.CharField()
    vues = serializers.IntegerField()


class StatistiquesGallerySerializer(serializers.Serializer):
    """Format : { total_vues, par_fiche: [{ slug, titre, vues }] }"""

    total_vues = serializers.IntegerField()
    par_fiche = FicheStatistiqueItemSerializer(many=True)
