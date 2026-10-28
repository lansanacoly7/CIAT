"""Sérialiseurs pour les modèles Partenariat et Financement (apps.analytics - T3)."""
from rest_framework import serializers
from .models import Financement, Partenariat


class PartenariatSerializer(serializers.ModelSerializer):
    """Sérialiseur complet pour l'exposition des partenariats au tableau de bord décisionnel."""
    projet_titre = serializers.CharField(source="projet.titre", read_only=True)
    cohorte = serializers.CharField(source="projet.cohorte.nom", default=None, read_only=True)
    domaine = serializers.CharField(source="projet.domaine.nom", default=None, read_only=True)
    porteur_nom = serializers.SerializerMethodField()
    type_display = serializers.CharField(source="get_type_display", read_only=True)
    statut_display = serializers.CharField(source="get_statut_display", read_only=True)

    class Meta:
        model = Partenariat
        fields = [
            "id",
            "projet",
            "projet_titre",
            "cohorte",
            "domaine",
            "porteur_nom",
            "partenaire",
            "type",
            "type_display",
            "date_debut",
            "statut",
            "statut_display",
            "description",
            "cree_le",
        ]

    def get_porteur_nom(self, obj):
        """Récupère le nom complet du porteur du projet ou son adresse email à défaut."""
        if obj.projet and obj.projet.porteur:
            return obj.projet.porteur.get_full_name() or obj.projet.porteur.email
        return "Non renseigné"


class FinancementSerializer(serializers.ModelSerializer):
    """Sérialiseur des lignes de financement mobilisées avec libellés enrichis."""
    projet_titre = serializers.CharField(source="projet.titre", read_only=True)
    cohorte = serializers.CharField(source="projet.cohorte.nom", default=None, read_only=True)
    domaine = serializers.CharField(source="projet.domaine.nom", default=None, read_only=True)
    porteur_nom = serializers.SerializerMethodField()
    statut_display = serializers.CharField(source="get_statut_display", read_only=True)

    class Meta:
        model = Financement
        fields = [
            "id",
            "projet",
            "projet_titre",
            "cohorte",
            "domaine",
            "porteur_nom",
            "source",
            "montant",
            "date",
            "statut",
            "statut_display",
            "description",
            "cree_le",
        ]

    def get_porteur_nom(self, obj):
        """Extrait l'identité du porteur pour faciliter les analyses décisionnelles."""
        if obj.projet and obj.projet.porteur:
            return obj.projet.porteur.get_full_name() or obj.projet.porteur.email
        return "Non renseigné"
