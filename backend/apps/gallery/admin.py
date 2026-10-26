"""Configuration de l'administration Django pour la Galerie des innovations."""
from django.contrib import admin

from .models import FicheInnovation


@admin.register(FicheInnovation)
class FicheInnovationAdmin(admin.ModelAdmin):
    list_display = ("titre", "projet", "avancement", "statut", "vues", "cree_le")
    list_filter = ("statut", "avancement", "cree_le")
    search_fields = ("titre", "probleme", "solution", "equipe", "projet__titre")
    prepopulated_fields = {"slug": ("titre",)}
    readonly_fields = ("vues", "cree_le", "modifie_le")
