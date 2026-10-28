"""Configuration de l'administration Django pour la Galerie des innovations."""
from django.contrib import admin

from apps.core.admin_actions import creer_action_export_csv
from .models import FicheInnovation, ManifestationInteret


@admin.register(FicheInnovation)
class FicheInnovationAdmin(admin.ModelAdmin):
    list_display = ("titre", "projet", "avancement", "statut", "vues", "get_nb_interets", "cree_le")
    list_filter = ("statut", "avancement", "cree_le")
    search_fields = ("titre", "probleme", "solution", "equipe", "projet__titre")
    prepopulated_fields = {"slug": ("titre",)}
    date_hierarchy = "cree_le"
    list_select_related = ["projet", "projet__porteur"]
    readonly_fields = ("vues", "cree_le", "modifie_le")
    actions = [
        creer_action_export_csv(
            ["id", "titre", "slug", "projet", "avancement", "statut", "vues", "cree_le"],
            nom_fichier="fiches_innovation_ciat",
        )
    ]

    @admin.display(description="Manifestations d'intérêt")
    def get_nb_interets(self, obj):
        return obj.manifestations_interet.count()


@admin.register(ManifestationInteret)
class ManifestationInteretAdmin(admin.ModelAdmin):
    list_display = ("nom", "email", "organisation", "fiche", "cree_le")
    list_filter = ("cree_le", "fiche")
    search_fields = ("nom", "email", "organisation", "message", "fiche__titre")
    date_hierarchy = "cree_le"
    list_select_related = ["fiche", "fiche__projet"]
    readonly_fields = ("cree_le",)
    actions = [
        creer_action_export_csv(
            ["id", "nom", "email", "organisation", "fiche", "message", "cree_le"],
            nom_fichier="manifestations_interet_ciat",
        )
    ]

