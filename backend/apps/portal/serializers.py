"""Sérialiseurs pour le module Portail (apps.portal) — T1, T2, T3.

Respecte scrupuleusement les formats fixés dans CONTRATS_API.md (section P1).
"""
from rest_framework import serializers

from apps.core.models import Projet

from .models import (
    Actualite,
    AppelProjet,
    DocumentPublic,
    Evenement,
    MessageContact,
    Partenaire,
)


# ==============================================================================
# T1 — Contenus institutionnels
# ==============================================================================

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
            "publie",
            "vues",
            "publie_le",
        ]
        read_only_fields = ["id", "vues"]


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


# ==============================================================================
# T2 — Partenaires, documents publics et message de contact
# ==============================================================================

class PartenaireSerializer(serializers.ModelSerializer):
    """Format : { id, nom, logo, site_web, description }"""

    class Meta:
        model = Partenaire
        fields = [
            "id",
            "nom",
            "logo",
            "site_web",
            "description",
        ]
        read_only_fields = ["id"]


class DocumentPublicSerializer(serializers.ModelSerializer):
    """Format : { id, titre, categorie, fichier }"""

    class Meta:
        model = DocumentPublic
        fields = [
            "id",
            "titre",
            "categorie",
            "fichier",
        ]
        read_only_fields = ["id"]


class MessageContactSerializer(serializers.ModelSerializer):
    """Format : { nom, email, sujet, message }"""

    email = serializers.EmailField(
        error_messages={"invalid": "Veuillez fournir une adresse email valide."}
    )

    class Meta:
        model = MessageContact
        fields = [
            "id",
            "nom",
            "email",
            "sujet",
            "message",
            "cree_le",
        ]
        read_only_fields = ["id", "cree_le"]


# ==============================================================================
# T3 — Annuaire public des projets incubés
# ==============================================================================

class ProjetIncubeSerializer(serializers.ModelSerializer):
    """Format : { id, titre, resume, domaine_nom, cohorte_nom, statut }

    Ne renvoie que les champs autorisés au contrat d'API public.
    Aucune donnée personnelle (email, porteur, budget, notes) n'est exposée.
    """

    domaine_nom = serializers.CharField(source="domaine.nom", read_only=True)
    cohorte_nom = serializers.CharField(
        source="cohorte.nom", read_only=True, default=None
    )

    class Meta:
        model = Projet
        fields = [
            "id",
            "titre",
            "resume",
            "domaine_nom",
            "cohorte_nom",
            "statut",
            "vues",
        ]
        read_only_fields = fields
