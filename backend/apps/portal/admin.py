"""Administration Django pour le module Portail (T1, T2)."""
from django.contrib import admin

from .models import (
    Actualite,
    AppelProjet,
    DocumentPublic,
    Evenement,
    MessageContact,
    Partenaire,
)


# ==============================================================================
# T1
# ==============================================================================

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


# ==============================================================================
# T2
# ==============================================================================

@admin.register(Partenaire)
class PartenaireAdmin(admin.ModelAdmin):
    list_display = ("nom", "site_web", "ordre", "cree_le")
    search_fields = ("nom", "description")
    list_editable = ("ordre",)
    ordering = ("ordre", "nom")


@admin.register(DocumentPublic)
class DocumentPublicAdmin(admin.ModelAdmin):
    list_display = ("titre", "categorie", "fichier", "cree_le")
    search_fields = ("titre", "categorie")
    list_filter = ("categorie", "cree_le")
    ordering = ("categorie", "titre")


@admin.register(MessageContact)
class MessageContactAdmin(admin.ModelAdmin):
    list_display = ("nom", "email", "sujet", "cree_le", "traite")
    search_fields = ("nom", "email", "sujet", "message")
    list_filter = ("traite", "cree_le")
    list_editable = ("traite",)
    readonly_fields = ("nom", "email", "sujet", "message", "cree_le")
    ordering = ("-cree_le",)
