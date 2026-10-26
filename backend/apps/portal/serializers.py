"""Sérialiseurs pour le module Portail (apps.portal).

Respecte scrupuleusement les formats fixés dans CONTRATS_API.md (section P1).
"""
from rest_framework import serializers

from .models import Actualite, AppelProjet, Evenement


class ActualiteSerializer(serializers.ModelSerializer):
    """Format : { id, titre, slug, resume, contenu, image, publie_le }"""

    slug = serializers.SlugField(required=False)

    class Meta:
        model = Actualite
        fields = [
            "id",
            "titre",
            "slug",
            "resume",
            "contenu",
            "image",
            "publie_le",
        ]
        read_only_fields = ["id"]


class EvenementSerializer(serializers.ModelSerializer):
    """Format : { id, titre, description, lieu, debut, fin, lien_inscription }"""

    class Meta:
        model = Evenement
        fields = [
            "id",
            "titre",
            "description",
            "lieu",
            "debut",
            "fin",
            "lien_inscription",
        ]
        read_only_fields = ["id"]


class AppelProjetSerializer(serializers.ModelSerializer):
    """Format : { id, titre, description, date_limite, statut: "ouvert"|"clos", pieces_demandees }"""

    statut = serializers.CharField(read_only=True)

    class Meta:
        model = AppelProjet
        fields = [
            "id",
            "titre",
            "description",
            "date_limite",
            "statut",
            "pieces_demandees",
        ]
        read_only_fields = ["id", "statut"]
