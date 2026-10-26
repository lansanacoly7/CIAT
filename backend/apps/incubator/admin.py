from django.contrib import admin

from apps.core.models import Role, User
from .models import (
    AffectationMentor,
    CommentaireJalon,
    Critere,
    Decision,
    Dossier,
    Evaluation,
    Grille,
    Jalon,
    Note,
    Objectif,
    Piece,
    PreuveJalon,
    SuiviProjet,
)


class PieceInline(admin.TabularInline):
    model = Piece
    extra = 0
    readonly_fields = ["depose_le"]


class NoteInline(admin.TabularInline):
    model = Note
    extra = 0


class CritereInline(admin.TabularInline):
    model = Critere
    extra = 1


@admin.register(Dossier)
class DossierAdmin(admin.ModelAdmin):
    list_display = ["id", "projet", "statut", "completude", "soumis_le", "cree_le"]
    list_filter = ["statut", "cree_le"]
    search_fields = ["projet__titre", "projet__porteur__email"]
    inlines = [PieceInline]


@admin.register(Piece)
class PieceAdmin(admin.ModelAdmin):
    list_display = ["id", "dossier", "type", "nom", "depose_le"]
    list_filter = ["type", "depose_le"]
    search_fields = ["nom", "dossier__projet__titre"]


@admin.register(Grille)
class GrilleAdmin(admin.ModelAdmin):
    list_display = ["id", "nom", "active", "cree_le"]
    list_filter = ["active"]
    inlines = [CritereInline]


@admin.register(Evaluation)
class EvaluationAdmin(admin.ModelAdmin):
    list_display = ["id", "dossier", "evaluateur", "score", "cree_le"]
    list_filter = ["cree_le"]
    inlines = [NoteInline]


@admin.register(Decision)
class DecisionAdmin(admin.ModelAdmin):
    list_display = ["id", "dossier", "decision", "decide_par", "cree_le"]
    list_filter = ["decision", "cree_le"]


@admin.register(AffectationMentor)
class AffectationMentorAdmin(admin.ModelAdmin):
    list_display = ["id", "projet", "mentor", "affecte_par", "affecte_le"]
    search_fields = ["projet__titre", "mentor__email", "mentor__last_name"]

    def formfield_for_foreignkey(self, db_field, request, **kwargs):
        if db_field.name == "mentor":
            kwargs["queryset"] = User.objects.filter(role=Role.MENTOR)
        return super().formfield_for_foreignkey(db_field, request, **kwargs)


@admin.register(Objectif)
class ObjectifAdmin(admin.ModelAdmin):
    list_display = ["id", "projet", "libelle", "statut", "echeance", "cree_par", "cree_le"]
    list_filter = ["statut", "cree_le"]
    search_fields = ["libelle", "projet__titre"]


class PreuveJalonInline(admin.TabularInline):
    model = PreuveJalon
    extra = 0
    readonly_fields = ["depose_le"]


class CommentaireJalonInline(admin.TabularInline):
    model = CommentaireJalon
    extra = 0
    readonly_fields = ["cree_le"]


@admin.register(Jalon)
class JalonAdmin(admin.ModelAdmin):
    list_display = ["id", "projet", "titre", "statut", "echeance", "en_retard", "cree_par", "cree_le"]
    list_filter = ["statut", "echeance", "cree_le"]
    search_fields = ["titre", "projet__titre"]
    inlines = [PreuveJalonInline, CommentaireJalonInline]


@admin.register(SuiviProjet)
class SuiviProjetAdmin(admin.ModelAdmin):
    list_display = ["id", "projet", "echeance", "redige_par", "cree_le"]
    list_filter = ["echeance", "cree_le"]
    search_fields = ["projet__titre", "bilan"]



