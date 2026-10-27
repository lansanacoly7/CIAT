"""Sérialiseurs pour la Galerie des innovations (P6)."""
from rest_framework import serializers

from apps.core.models import Projet

from .models import FicheInnovation, ManifestationInteret



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
    """Statistiques de consultation et d'intérêt par fiche."""

    slug = serializers.CharField()
    titre = serializers.CharField()
    vues = serializers.IntegerField()
    interets = serializers.IntegerField(required=False, default=0)


class StatistiquesGallerySerializer(serializers.Serializer):
    """Format : { total_vues, total_interets, par_fiche: [{ slug, titre, vues, interets }] }"""

    total_vues = serializers.IntegerField()
    total_interets = serializers.IntegerField(required=False, default=0)
    par_fiche = FicheStatistiqueItemSerializer(many=True)


class ManifestationInteretCreateSerializer(serializers.Serializer):
    """Sérialiseur pour soumettre une manifestation d'intérêt (Public)."""

    nom = serializers.CharField(max_length=150, min_length=2, trim_whitespace=True)
    email = serializers.EmailField()
    organisation = serializers.CharField(
        max_length=200, required=False, allow_blank=True, default="", trim_whitespace=True
    )
    message = serializers.CharField(max_length=5000, min_length=10, trim_whitespace=True)

    def validate_nom(self, value):
        val = value.strip()
        if not val:
            raise serializers.ValidationError("Le nom ne peut pas être vide.")
        return val

    def validate_message(self, value):
        val = value.strip()
        if not val:
            raise serializers.ValidationError("Le message ne peut pas être vide.")
        return val


class ManifestationInteretSerializer(serializers.ModelSerializer):
    """Sérialiseur de consultation d'une manifestation d'intérêt."""

    fiche_slug = serializers.CharField(source="fiche.slug", read_only=True)
    fiche_titre = serializers.CharField(source="fiche.titre", read_only=True)

    class Meta:
        model = ManifestationInteret
        fields = [
            "id",
            "fiche",
            "fiche_slug",
            "fiche_titre",
            "nom",
            "email",
            "organisation",
            "message",
            "cree_le",
        ]
        read_only_fields = [
            "id",
            "fiche",
            "fiche_slug",
            "fiche_titre",
            "nom",
            "email",
            "organisation",
            "message",
            "cree_le",
        ]
