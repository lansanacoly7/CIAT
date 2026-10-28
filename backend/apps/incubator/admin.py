from django.contrib import admin

from apps.core.admin_actions import creer_action_export_csv
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
from .notifications import AlerteJalonEnvoyee


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
    list_filter = ["statut", "cree_le", "soumis_le"]
    search_fields = ["projet__titre", "projet__porteur__email", "projet__porteur__last_name"]
    date_hierarchy = "cree_le"
    list_select_related = ["projet", "projet__porteur"]
    readonly_fields = ["completude", "soumis_le", "cree_le"]
    inlines = [PieceInline]
    actions = [
        creer_action_export_csv(
            ["id", "projet", "statut", "completude", "soumis_le", "cree_le"],
            nom_fichier="dossiers_candidature_ciat",
        )
    ]


@admin.register(Piece)
class PieceAdmin(admin.ModelAdmin):
    list_display = ["id", "dossier", "type", "nom", "depose_le"]
    list_filter = ["type", "depose_le"]
    search_fields = ["nom", "dossier__projet__titre"]
    date_hierarchy = "depose_le"
    list_select_related = ["dossier", "dossier__projet"]
    readonly_fields = ["depose_le"]


@admin.register(Grille)
class GrilleAdmin(admin.ModelAdmin):
    list_display = ["id", "nom", "active", "cree_le"]
    list_filter = ["active", "cree_le"]
    search_fields = ["nom"]
    inlines = [CritereInline]


@admin.register(Critere)
class CritereAdmin(admin.ModelAdmin):
    list_display = ["id", "grille", "libelle", "poids", "note_max"]
    list_filter = ["grille"]
    search_fields = ["libelle"]
    list_select_related = ["grille"]


@admin.register(Evaluation)
class EvaluationAdmin(admin.ModelAdmin):
    list_display = ["id", "dossier", "evaluateur", "score", "cree_le"]
    list_filter = ["cree_le"]
    search_fields = ["dossier__projet__titre", "evaluateur__email"]
    date_hierarchy = "cree_le"
    list_select_related = ["dossier", "evaluateur", "dossier__projet"]
    readonly_fields = ["score", "cree_le"]
    inlines = [NoteInline]


@admin.register(Decision)
class DecisionAdmin(admin.ModelAdmin):
    list_display = ["id", "dossier", "decision", "decide_par", "cree_le"]
    list_filter = ["decision", "cree_le"]
    search_fields = ["dossier__projet__titre", "decide_par__email", "motif"]
    date_hierarchy = "cree_le"
    list_select_related = ["dossier", "decide_par", "dossier__projet"]
    readonly_fields = ["cree_le"]


@admin.register(AffectationMentor)
class AffectationMentorAdmin(admin.ModelAdmin):
    list_display = ["id", "projet", "mentor", "affecte_par", "affecte_le"]
    list_filter = ["affecte_le"]
    search_fields = ["projet__titre", "mentor__email", "mentor__last_name"]
    date_hierarchy = "affecte_le"
    list_select_related = ["projet", "mentor", "affecte_par"]

    def formfield_for_foreignkey(self, db_field, request, **kwargs):
        if db_field.name == "mentor":
            kwargs["queryset"] = User.objects.filter(role=Role.MENTOR)
        return super().formfield_for_foreignkey(db_field, request, **kwargs)


@admin.register(Objectif)
class ObjectifAdmin(admin.ModelAdmin):
    list_display = ["id", "projet", "libelle", "statut", "echeance", "cree_par", "cree_le"]
    list_filter = ["statut", "echeance", "cree_le"]
    search_fields = ["libelle", "projet__titre"]
    date_hierarchy = "echeance"
    list_select_related = ["projet", "cree_par"]
    readonly_fields = ["cree_le"]


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
    date_hierarchy = "echeance"
    list_select_related = ["projet", "cree_par"]
    readonly_fields = ["en_retard", "cree_le"]
    inlines = [PreuveJalonInline, CommentaireJalonInline]


@admin.register(SuiviProjet)
class SuiviProjetAdmin(admin.ModelAdmin):
    list_display = ["id", "projet", "echeance", "redige_par", "cree_le"]
    list_filter = ["echeance", "cree_le"]
    search_fields = ["projet__titre", "bilan"]
    date_hierarchy = "cree_le"
    list_select_related = ["projet", "redige_par"]
    readonly_fields = ["cree_le"]



@admin.register(AlerteJalonEnvoyee)
class AlerteJalonEnvoyeeAdmin(admin.ModelAdmin):
    list_display = ["id", "jalon", "destinataire", "date_envoi", "cree_le"]
    list_filter = ["date_envoi", "cree_le"]
    search_fields = ["jalon__titre", "destinataire__email", "destinataire__last_name", "destinataire__first_name"]
    date_hierarchy = "date_envoi"
    list_select_related = ["jalon", "destinataire"]
    readonly_fields = ["date_envoi", "cree_le"]




