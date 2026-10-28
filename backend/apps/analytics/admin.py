from django.contrib import admin

from apps.core.admin_actions import creer_action_export_csv

from .models import Financement, Partenariat


@admin.register(Partenariat)
class PartenariatAdmin(admin.ModelAdmin):
    list_display = ["partenaire", "projet", "type", "date_debut", "statut", "cree_le"]
    list_filter = ["type", "statut", "projet__cohorte", "projet__domaine", "cree_le"]
    search_fields = ["partenaire", "projet__titre", "description"]
    date_hierarchy = "date_debut"
    list_select_related = ["projet", "projet__porteur"]
    readonly_fields = ["cree_le", "modifie_le"]
    actions = [
        creer_action_export_csv(
            ["id", "partenaire", "projet", "type", "date_debut", "statut", "cree_le"],
            nom_fichier="partenariats_ciat",
        )
    ]


@admin.register(Financement)
class FinancementAdmin(admin.ModelAdmin):
    list_display = ["source", "montant", "projet", "date", "statut", "cree_le"]
    list_filter = ["statut", "projet__cohorte", "projet__domaine", "date"]
    search_fields = ["source", "projet__titre", "description"]
    date_hierarchy = "date"
    list_select_related = ["projet", "projet__porteur"]
    readonly_fields = ["cree_le", "modifie_le"]
    actions = [
        creer_action_export_csv(
            ["id", "source", "montant", "projet", "date", "statut", "cree_le"],
            nom_fichier="financements_ciat",
        )
    ]

