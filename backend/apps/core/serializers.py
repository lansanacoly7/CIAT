from django.contrib.auth.password_validation import validate_password
from rest_framework import serializers

from .models import Cohorte, Domaine, Projet, Role, User


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = [
            "id", "email", "first_name", "last_name", "role",
            "telephone", "genre", "organisation",
        ]
        read_only_fields = ["id", "email", "role"]


class RegisterSerializer(serializers.ModelSerializer):
    """Inscription publique : le compte créé est toujours un porteur de projet."""

    password = serializers.CharField(write_only=True, min_length=8)

    class Meta:
        model = User
        fields = [
            "id", "email", "password", "first_name", "last_name",
            "telephone", "genre", "organisation",
        ]
        read_only_fields = ["id"]

    def validate_password(self, value):
        validate_password(value)
        return value

    def create(self, validated_data):
        return User.objects.create_user(role=Role.PORTEUR, **validated_data)


class DomaineSerializer(serializers.ModelSerializer):
    class Meta:
        model = Domaine
        fields = ["id", "nom", "slug"]
        read_only_fields = ["slug"]


class CohorteSerializer(serializers.ModelSerializer):
    class Meta:
        model = Cohorte
        fields = ["id", "nom", "annee", "date_debut", "date_fin"]


class ProjetSerializer(serializers.ModelSerializer):
    domaine_nom = serializers.CharField(source="domaine.nom", read_only=True)
    cohorte_nom = serializers.CharField(source="cohorte.nom", read_only=True, default=None)
    porteur_nom = serializers.CharField(source="porteur.get_full_name", read_only=True)

    class Meta:
        model = Projet
        fields = [
            "id", "titre", "resume", "probleme", "solution",
            "domaine", "domaine_nom", "cohorte", "cohorte_nom",
            "porteur", "porteur_nom", "statut", "cree_le", "modifie_le",
        ]
        read_only_fields = ["porteur", "cree_le", "modifie_le"]

    def validate(self, attrs):
        # Un porteur ne peut pas changer lui-même le statut ni la cohorte de son projet.
        request = self.context.get("request")
        if request and not request.user.is_equipe:
            attrs.pop("statut", None)
            attrs.pop("cohorte", None)
        return attrs
