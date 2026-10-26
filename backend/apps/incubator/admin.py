from django.contrib import admin

from .models import (
    AffectationMentor,
    Critere,
    Decision,
    Dossier,
    Evaluation,
    Grille,
    Note,
    Objectif,
    Piece,
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


@admin.register(Objectif)
class ObjectifAdmin(admin.ModelAdmin):
    list_display = ["id", "projet", "libelle", "statut", "echeance", "cree_par", "cree_le"]
    list_filter = ["statut", "cree_le"]
    search_fields = ["libelle", "projet__titre"]

