"""Serializers pour le module P2 - Gestion de l'incubateur."""
from django.db import transaction
from rest_framework import serializers

from apps.core.models import Projet, Role, User
from .models import (
    ALLOWED_PIECE_EXTENSIONS,
    Critere,
    Decision,
    DecisionType,
    Dossier,
    Evaluation,
    Grille,
    Note,
    Piece,
    StatutDossier,
    TypePiece,
)


class ProjetSimpleSerializer(serializers.ModelSerializer):
    """Représentation allégée du projet dans le dossier."""

    class Meta:
        model = Projet
        fields = ["id", "titre"]


class PieceSerializer(serializers.ModelSerializer):
    nom = serializers.CharField(required=False, allow_blank=True)

    class Meta:
        model = Piece
        fields = ["id", "type", "nom", "fichier", "depose_le"]
        read_only_fields = ["id", "depose_le"]

    def validate_fichier(self, value):
        ext = value.name.split(".")[-1].lower()
        if ext not in ALLOWED_PIECE_EXTENSIONS:
            raise serializers.ValidationError(
                f"Format non supporté ({ext}). Formats autorisés : {', '.join(ALLOWED_PIECE_EXTENSIONS)}."
            )
        if value.size > 10 * 1024 * 1024:
            raise serializers.ValidationError("Le fichier ne doit pas dépasser 10 Mo.")
        return value


class DossierSerializer(serializers.ModelSerializer):
    projet = ProjetSimpleSerializer(read_only=True)
    projet_id = serializers.PrimaryKeyRelatedField(
        queryset=Projet.objects.all(), source="projet", write_only=True
    )
    pieces = PieceSerializer(many=True, read_only=True)
    completude = serializers.IntegerField(read_only=True)
    pieces_manquantes = serializers.ListField(
        child=serializers.CharField(), read_only=True
    )

    class Meta:
        model = Dossier
        fields = [
            "id",
            "projet",
            "projet_id",
            "statut",
            "completude",
            "pieces",
            "pieces_manquantes",
            "soumis_le",
            "cree_le",
            "modifie_le",
        ]
        read_only_fields = [
            "id",
            "statut",
            "completude",
            "pieces",
            "pieces_manquantes",
            "soumis_le",
            "cree_le",
            "modifie_le",
        ]

    def validate_projet_id(self, projet):
        request = self.context.get("request")
        user = getattr(request, "user", None)
        # Vérifie si le porteur tente de créer un dossier pour un projet qui ne lui appartient pas
        if user and user.role == Role.PORTEUR and projet.porteur_id != user.id:
            raise serializers.ValidationError(
                "Vous ne pouvez déposer un dossier que pour vos propres projets."
            )
        # Vérifie l'unicité du dossier par projet
        if hasattr(projet, "dossier"):
            raise serializers.ValidationError(
                "Un dossier de candidature existe déjà pour ce projet."
            )
        return projet


class CritereSerializer(serializers.ModelSerializer):
    class Meta:
        model = Critere
        fields = ["id", "libelle", "poids", "note_max", "ordre"]


class GrilleSerializer(serializers.ModelSerializer):
    criteres = CritereSerializer(many=True, read_only=True)

    class Meta:
        model = Grille
        fields = ["id", "nom", "active", "criteres"]


class NoteInputSerializer(serializers.Serializer):
    critere = serializers.PrimaryKeyRelatedField(queryset=Critere.objects.all())
    note = serializers.DecimalField(max_digits=5, decimal_places=2, min_value=0)

    def validate(self, attrs):
        critere = attrs["critere"]
        note = attrs["note"]
        if note > critere.note_max:
            raise serializers.ValidationError(
                {"note": f"La note ne peut pas dépasser {critere.note_max}."}
            )
        return attrs


class NoteSerializer(serializers.ModelSerializer):
    critere_libelle = serializers.CharField(source="critere.libelle", read_only=True)
    critere_poids = serializers.IntegerField(source="critere.poids", read_only=True)
    critere_note_max = serializers.IntegerField(source="critere.note_max", read_only=True)

    class Meta:
        model = Note
        fields = ["id", "critere", "critere_libelle", "critere_poids", "critere_note_max", "note"]


class EvaluationSerializer(serializers.ModelSerializer):
    evaluateur_nom = serializers.SerializerMethodField()
    notes = NoteSerializer(many=True, read_only=True)
    score = serializers.FloatField(read_only=True)

    class Meta:
        model = Evaluation
        fields = [
            "id",
            "dossier",
            "evaluateur",
            "evaluateur_nom",
            "avis",
            "score",
            "notes",
            "cree_le",
            "modifie_le",
        ]
        read_only_fields = ["id", "dossier", "evaluateur", "score", "cree_le", "modifie_le"]

    def get_evaluateur_nom(self, obj):
        return obj.evaluateur.get_full_name() or obj.evaluateur.email


class EvaluationCreateSerializer(serializers.Serializer):
    notes = NoteInputSerializer(many=True)
    avis = serializers.CharField(required=False, allow_blank=True)

    def validate_notes(self, value):
        if not value:
            raise serializers.ValidationError("Vous devez fournir au moins une note.")
        criteres_vus = set()
        for item in value:
            c_id = item["critere"].id
            if c_id in criteres_vus:
                raise serializers.ValidationError("Chaque critère ne doit être noté qu'une seule fois.")
            criteres_vus.add(c_id)
        return value

    def create(self, validated_data):
        dossier = self.context["dossier"]
        user = self.context["request"].user
        notes_data = validated_data.get("notes", [])
        avis = validated_data.get("avis", "")

        with transaction.atomic():
            evaluation, created = Evaluation.objects.get_or_create(
                dossier=dossier,
                evaluateur=user,
                defaults={"avis": avis},
            )
            if not created:
                raise serializers.ValidationError(
                    "Vous avez déjà évalué ce dossier de candidature."
                )

            for note_item in notes_data:
                Note.objects.create(
                    evaluation=evaluation,
                    critere=note_item["critere"],
                    note=note_item["note"],
                )

            # Si le dossier est encore juste "soumis" ou "complet", le passer à "en_evaluation"
            if dossier.statut in (StatutDossier.SOUMIS, StatutDossier.COMPLET):
                dossier.statut = StatutDossier.EN_EVALUATION
                dossier.save(update_fields=["statut", "modifie_le"])

        return evaluation


class DecisionSerializer(serializers.ModelSerializer):
    decide_par_nom = serializers.SerializerMethodField()

    class Meta:
        model = Decision
        fields = [
            "id",
            "dossier",
            "decision",
            "motif",
            "decide_par",
            "decide_par_nom",
            "cree_le",
        ]
        read_only_fields = ["id", "dossier", "decide_par", "cree_le"]

    def get_decide_par_nom(self, obj):
        return obj.decide_par.get_full_name() or obj.decide_par.email

    def validate_motif(self, value):
        if not value or not value.strip():
            raise serializers.ValidationError("Le motif de la décision est obligatoire.")
        return value.strip()

    def create(self, validated_data):
        dossier = self.context["dossier"]
        user = self.context["request"].user

        if hasattr(dossier, "decision"):
            raise serializers.ValidationError(
                "Une décision a déjà été enregistrée pour ce dossier."
            )

        with transaction.atomic():
            decision = Decision.objects.create(
                dossier=dossier,
                decide_par=user,
                decision=validated_data["decision"],
                motif=validated_data["motif"],
            )
            decision.appliquer()
        return decision
