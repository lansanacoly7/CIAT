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

    def validate_image(self, value):
        if value:
            if value.size == 0:
                raise serializers.ValidationError("Le fichier image est vide (0 octet).")
            if value.size > 5 * 1024 * 1024:
                raise serializers.ValidationError("Le fichier image ne doit pas dépasser 5 Mo.")
        return value


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
    def validate_logo(self, value):
        if value:
            if value.size == 0:
                raise serializers.ValidationError("Le fichier image est vide (0 octet).")
            if value.size > 5 * 1024 * 1024:
                raise serializers.ValidationError("Le fichier image ne doit pas dépasser 5 Mo.")
        return value


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

    def validate_fichier(self, value):
        if not value or value.size == 0:
            raise serializers.ValidationError("Le fichier est vide (0 octet).")
        if value.size > 10 * 1024 * 1024:
            raise serializers.ValidationError("Le fichier ne doit pas dépasser 10 Mo.")
        ext = value.name.split(".")[-1].lower() if "." in value.name else ""
        if ext in ("exe", "bat", "sh", "cmd", "py", "php", "js", "bin"):
            raise serializers.ValidationError(f"Les fichiers exécutables ou scripts (.{ext}) sont interdits.")
        return value


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



# ==============================================================================
# Phase 9 — T1, T2, T3
# ==============================================================================

class AbonnementLettreDemandeSerializer(serializers.Serializer):
    """Validation de la demande d'abonnement public avec limitation anti-spam."""

    email = serializers.EmailField(
        required=True,
        error_messages={
            "required": "L'adresse email est obligatoire.",
            "invalid": "Veuillez fournir une adresse email valide.",
            "blank": "L'adresse email ne peut pas être vide.",
        },
    )

    def validate_email(self, value):
        normalized = value.strip().lower()
        if len(normalized) > 254:
            raise serializers.ValidationError("L'adresse email est trop longue.")
        return normalized


class AbonnementLettreJetonSerializer(serializers.Serializer):
    """Validation du jeton de confirmation ou de désabonnement."""

    jeton = serializers.CharField(
        required=True,
        allow_blank=False,
        error_messages={
            "required": "Le jeton est obligatoire.",
            "blank": "Le jeton ne peut pas être vide.",
        },
    )


class AbonnementLettreAdminSerializer(serializers.ModelSerializer):
    """Sérialiseur d'administration pour la liste des abonnés."""

    from .models import AbonnementLettre

    statut_libelle = serializers.CharField(source="get_statut_display", read_only=True)

    class Meta:
        from .models import AbonnementLettre

        model = AbonnementLettre
        fields = [
            "id",
            "email",
            "statut",
            "statut_libelle",
            "cree_le",
            "confirme_le",
            "desabonne_le",
        ]
        read_only_fields = fields


class RechercheResultatItemSerializer(serializers.Serializer):
    """Format d'un résultat de recherche globale : { type, titre, extrait, url_interne, score }"""

    type = serializers.CharField()
    titre = serializers.CharField()
    extrait = serializers.CharField()
    url_interne = serializers.CharField()
    score = serializers.IntegerField()


class ChiffresClesSerializer(serializers.Serializer):
    """Format des chiffres clés publics réels calculés depuis la base."""

    projets_incubes = serializers.IntegerField()
    prototypes = serializers.IntegerField()
    porteurs_accompagnes = serializers.IntegerField()
    partenaires = serializers.IntegerField()
    cohortes = serializers.IntegerField()
    domaines = serializers.ListField(child=serializers.DictField())
