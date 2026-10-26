"""Serializers pour le module P2 - Gestion de l'incubateur."""
from django.db import transaction
from rest_framework import serializers
from rest_framework.exceptions import PermissionDenied

from apps.core.models import Projet, Role, User
from .models import (
    ALLOWED_PIECE_EXTENSIONS,
    AffectationMentor,
    CommentaireJalon,
    Critere,
    Decision,
    DecisionType,
    Dossier,
    Evaluation,
    Grille,
    Jalon,
    Note,
    Objectif,
    Piece,
    PreuveJalon,
    StatutDossier,
    StatutJalon,
    StatutObjectif,
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
        from .models import validate_file_content, validate_file_size
        ext = value.name.split(".")[-1].lower() if "." in value.name else ""
        if ext not in ALLOWED_PIECE_EXTENSIONS:
            raise serializers.ValidationError(
                f"Format non supporté ({ext}). Formats autorisés : {', '.join(ALLOWED_PIECE_EXTENSIONS)}."
            )
        try:
            validate_file_size(value)
            validate_file_content(value)
        except Exception as e:
            raise serializers.ValidationError(getattr(e, "message", str(e)))
        return value


class DossierSerializer(serializers.ModelSerializer):
    projet = ProjetSimpleSerializer(read_only=True)
    projet_id = serializers.PrimaryKeyRelatedField(
        queryset=Projet.objects.all(), source="projet", write_only=True, required=False
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

    def to_internal_value(self, data):
        # Supporte { "projet": <id> } (contrat API) et { "projet_id": <id> }
        if isinstance(data, dict):
            data = data.copy()
            if "projet" in data and "projet_id" not in data and not isinstance(data["projet"], dict):
                data["projet_id"] = data["projet"]
        return super().to_internal_value(data)

    def validate(self, attrs):
        request = self.context.get("request")
        user = getattr(request, "user", None)

        # 1. Cas de la mise à jour (PATCH / PUT) : le projet est IMMUTABLE
        if self.instance is not None:
            initial_data = getattr(self, "initial_data", {})
            if "projet" in initial_data or "projet_id" in initial_data:
                raise serializers.ValidationError(
                    {"projet": "Le projet associé à un dossier ne peut pas être modifié après création."}
                )
            return attrs

        # 2. Cas de la création : contrôle d'autorisation et d'existence du projet
        projet = attrs.get("projet")
        if not projet:
            raise serializers.ValidationError({"projet": "Le champ projet (ou projet_id) est obligatoire."})

        if not user or not user.is_authenticated:
            raise PermissionDenied("Authentification requise.")

        # Contrôle strict du rôle autorisant la création
        if user.role not in (Role.PORTEUR, Role.ADMIN, Role.COORDONNATEUR):
            raise PermissionDenied("Votre rôle ne vous permet pas de créer un dossier de candidature.")

        # Contrôle de propriété : un porteur ne peut créer un dossier que pour son propre projet
        if user.role == Role.PORTEUR and projet.porteur_id != user.id:
            raise PermissionDenied("Vous ne pouvez déposer un dossier que pour vos propres projets.")

        # Unicité métier : un seul dossier par projet
        if hasattr(projet, "dossier"):
            raise serializers.ValidationError(
                {"projet": "Un dossier de candidature existe déjà pour ce projet."}
            )

        return attrs


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

    def validate(self, attrs):
        dossier = self.context.get("dossier")
        user = self.context.get("request").user

        # 1. Vérification du statut du dossier
        if dossier.statut == StatutDossier.BROUILLON:
            raise serializers.ValidationError(
                "Un dossier en statut brouillon ne peut pas être évalué. Il doit d'abord être soumis."
            )
        if dossier.statut in (StatutDossier.ACCEPTE, StatutDossier.REFUSE):
            raise serializers.ValidationError(
                "Ce dossier a déjà fait l'objet d'une décision finale."
            )

        # 2. Vérification de l'existence d'une grille active
        grille = Grille.objects.filter(active=True).prefetch_related("criteres").first()
        if not grille:
            raise serializers.ValidationError(
                "Aucune grille d'évaluation active n'est disponible."
            )

        # 3. Vérification de complétude et d'appartenance des critères
        notes_data = attrs.get("notes", [])
        if not notes_data:
            raise serializers.ValidationError({"notes": "Vous devez fournir les notes de l'évaluation."})

        criteres_grille = {c.id: c for c in grille.criteres.all()}
        criteres_soumis = set()

        for item in notes_data:
            c_id = item["critere"].id
            if c_id not in criteres_grille:
                raise serializers.ValidationError(
                    {"notes": f"Le critère id={c_id} n'appartient pas à la grille active ('{grille.nom}')."}
                )
            if c_id in criteres_soumis:
                raise serializers.ValidationError(
                    {"notes": "Chaque critère ne doit être noté qu'une seule fois."}
                )
            criteres_soumis.add(c_id)

        manquants = set(criteres_grille.keys()) - criteres_soumis
        if manquants:
            raise serializers.ValidationError(
                {"notes": f"Tous les critères de la grille doivent être notés. Critères manquants : {len(manquants)}."}
            )

        # 4. Vérification d'unicité de l'évaluation par membre du comité
        if Evaluation.objects.filter(dossier=dossier, evaluateur=user).exists():
            raise serializers.ValidationError(
                "Vous avez déjà évalué ce dossier de candidature."
            )

        attrs["grille_active"] = grille
        return attrs

    def create(self, validated_data):
        dossier = self.context["dossier"]
        user = self.context["request"].user
        notes_data = validated_data.get("notes", [])
        avis = validated_data.get("avis", "")

        with transaction.atomic():
            evaluation = Evaluation.objects.create(
                dossier=dossier,
                evaluateur=user,
                avis=avis,
            )

            for note_item in notes_data:
                Note.objects.create(
                    evaluation=evaluation,
                    critere=note_item["critere"],
                    note=note_item["note"],
                )

            # Fait évoluer le statut du dossier si nécessaire
            dossier.commencer_evaluation()

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

    def validate(self, attrs):
        dossier = self.context.get("dossier")

        # 1. Le dossier ne doit pas être en brouillon
        if dossier.statut == StatutDossier.BROUILLON:
            raise serializers.ValidationError(
                "Impossible de prendre une décision sur un dossier en brouillon. Le dossier doit être soumis et évalué."
            )

        # 2. Le dossier ne doit pas avoir déjà fait l'objet d'une décision
        if dossier.statut in (StatutDossier.ACCEPTE, StatutDossier.REFUSE) or hasattr(dossier, "decision"):
            raise serializers.ValidationError(
                "Une décision a déjà été enregistrée pour ce dossier."
            )

        return attrs

    def create(self, validated_data):
        dossier = self.context["dossier"]
        user = self.context["request"].user

        with transaction.atomic():
            decision = Decision.objects.create(
                dossier=dossier,
                decide_par=user,
                decision=validated_data["decision"],
                motif=validated_data["motif"],
            )
            decision.appliquer()
        return decision


class MentorUserSerializer(serializers.ModelSerializer):
    """Représentation publique d'un mentor pour affectation."""
    nom_complet = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = [
            "id",
            "email",
            "first_name",
            "last_name",
            "nom_complet",
            "telephone",
            "organisation",
        ]

    def get_nom_complet(self, obj):
        return obj.get_full_name() or obj.email


class AffectationMentorSerializer(serializers.ModelSerializer):
    mentor_details = MentorUserSerializer(source="mentor", read_only=True)
    mentor = serializers.PrimaryKeyRelatedField(queryset=User.objects.all())

    class Meta:
        model = AffectationMentor
        fields = ["id", "projet", "mentor", "mentor_details", "affecte_le", "affecte_par"]
        read_only_fields = ["id", "projet", "affecte_le", "affecte_par"]

    def validate_mentor(self, user):
        if user.role != Role.MENTOR:
            raise serializers.ValidationError("L'utilisateur affecté doit avoir le rôle mentor.")
        return user

    def create(self, validated_data):
        projet = self.context["projet"]
        user = self.context["request"].user
        mentor = validated_data["mentor"]

        affectation, _ = AffectationMentor.objects.update_or_create(
            projet=projet,
            defaults={"mentor": mentor, "affecte_par": user},
        )
        return affectation


class ObjectifSerializer(serializers.ModelSerializer):
    cree_par_nom = serializers.SerializerMethodField()

    class Meta:
        model = Objectif
        fields = [
            "id",
            "projet",
            "libelle",
            "echeance",
            "statut",
            "cree_le",
            "modifie_le",
            "cree_par",
            "cree_par_nom",
        ]
        read_only_fields = ["id", "projet", "cree_le", "modifie_le", "cree_par"]

    def get_cree_par_nom(self, obj):
        return obj.cree_par.get_full_name() or obj.cree_par.email

    def validate_libelle(self, value):
        if not value or not value.strip():
            raise serializers.ValidationError("Le libellé de l'objectif est obligatoire.")
        return value.strip()

    def create(self, validated_data):
        projet = self.context["projet"]
        user = self.context["request"].user
        return Objectif.objects.create(projet=projet, cree_par=user, **validated_data)


class PreuveJalonSerializer(serializers.ModelSerializer):
    depose_par_nom = serializers.SerializerMethodField()
    nom = serializers.CharField(required=False, allow_blank=True)

    class Meta:
        model = PreuveJalon
        fields = ["id", "jalon", "fichier", "nom", "depose_par", "depose_par_nom", "depose_le"]
        read_only_fields = ["id", "jalon", "depose_par", "depose_le"]

    def get_depose_par_nom(self, obj):
        if obj.depose_par:
            return obj.depose_par.get_full_name() or obj.depose_par.email
        return None

    def validate_fichier(self, file):
        if not file:
            raise serializers.ValidationError("Le fichier de preuve est obligatoire.")
        ext = file.name.split(".")[-1].lower() if "." in file.name else ""
        if ext not in ALLOWED_PIECE_EXTENSIONS:
            raise serializers.ValidationError(
                f"Format de fichier '.{ext}' non autorisé. Extensions acceptées : {', '.join(ALLOWED_PIECE_EXTENSIONS)}."
            )
        return file

    def create(self, validated_data):
        jalon = self.context["jalon"]
        user = self.context["request"].user
        if not validated_data.get("nom"):
            validated_data["nom"] = validated_data["fichier"].name
        return PreuveJalon.objects.create(jalon=jalon, depose_par=user, **validated_data)



class CommentaireJalonSerializer(serializers.ModelSerializer):
    auteur_nom = serializers.SerializerMethodField()

    class Meta:
        model = CommentaireJalon
        fields = ["id", "jalon", "auteur", "auteur_nom", "texte", "cree_le"]
        read_only_fields = ["id", "jalon", "auteur", "cree_le"]

    def get_auteur_nom(self, obj):
        return obj.auteur.get_full_name() or obj.auteur.email

    def validate_texte(self, value):
        if not value or not value.strip():
            raise serializers.ValidationError("Le commentaire ne peut pas être vide.")
        return value.strip()

    def create(self, validated_data):
        jalon = self.context["jalon"]
        user = self.context["request"].user
        return CommentaireJalon.objects.create(jalon=jalon, auteur=user, **validated_data)


class JalonSerializer(serializers.ModelSerializer):
    preuves = PreuveJalonSerializer(many=True, read_only=True)
    commentaires = CommentaireJalonSerializer(many=True, read_only=True)
    en_retard = serializers.BooleanField(read_only=True)
    cree_par_nom = serializers.SerializerMethodField()

    class Meta:
        model = Jalon
        fields = [
            "id",
            "projet",
            "titre",
            "echeance",
            "statut",
            "en_retard",
            "preuves",
            "commentaires",
            "cree_le",
            "modifie_le",
            "cree_par",
            "cree_par_nom",
        ]
        read_only_fields = ["id", "projet", "en_retard", "cree_le", "modifie_le", "cree_par"]

    def get_cree_par_nom(self, obj):
        if obj.cree_par:
            return obj.cree_par.get_full_name() or obj.cree_par.email
        return None

    def validate_titre(self, value):
        if not value or not value.strip():
            raise serializers.ValidationError("Le titre du jalon est obligatoire.")
        return value.strip()

    def create(self, validated_data):
        projet = self.context["projet"]
        user = self.context["request"].user
        return Jalon.objects.create(projet=projet, cree_par=user, **validated_data)


class AlerteJalonSerializer(serializers.ModelSerializer):
    projet_titre = serializers.CharField(source="projet.titre", read_only=True)
    en_retard = serializers.BooleanField(read_only=True)

    class Meta:
        model = Jalon
        fields = [
            "id",
            "projet",
            "projet_titre",
            "titre",
            "echeance",
            "statut",
            "en_retard",
            "cree_le",
        ]

