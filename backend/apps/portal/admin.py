"""Administration Django pour le module Portail."""
from django.contrib import admin

from .models import Actualite, AppelProjet, Evenement


@admin.register(Actualite)
class ActualiteAdmin(admin.ModelAdmin):
    list_display = ("titre", "slug", "publie_le", "cree_le")
    search_fields = ("titre", "resume", "contenu")
    prepopulated_fields = {"slug": ("titre",)}
    list_filter = ("publie_le",)
    date_hierarchy = "publie_le"
    ordering = ("-publie_le",)


@admin.register(Evenement)
class EvenementAdmin(admin.ModelAdmin):
    list_display = ("titre", "lieu", "debut", "fin")
    search_fields = ("titre", "description", "lieu")
    list_filter = ("debut",)
    date_hierarchy = "debut"
    ordering = ("debut",)


@admin.register(AppelProjet)
class AppelProjetAdmin(admin.ModelAdmin):
    list_display = ("titre", "date_limite", "get_statut")
    search_fields = ("titre", "description")
    list_filter = ("date_limite",)
    date_hierarchy = "date_limite"
    ordering = ("-date_limite",)

    @admin.display(description="Statut")
    def get_statut(self, obj):
        return obj.statut
