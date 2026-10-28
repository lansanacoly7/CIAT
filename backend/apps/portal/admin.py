"""Administration Django pour le module Portail (T1, T2)."""
from django.contrib import admin

from apps.core.admin_actions import creer_action_export_csv

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
    list_filter = ("publie_le", "cree_le")
    date_hierarchy = "publie_le"
    ordering = ("-publie_le",)
    readonly_fields = ("cree_le", "modifie_le")
    actions = [
        creer_action_export_csv(
            ["id", "titre", "slug", "publie_le", "cree_le"],
            nom_fichier="actualites_ciat",
        )
    ]


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
    date_hierarchy = "cree_le"
    ordering = ("categorie", "titre")


@admin.register(MessageContact)
class MessageContactAdmin(admin.ModelAdmin):
    list_display = ("nom", "email", "sujet", "cree_le", "traite")
    search_fields = ("nom", "email", "sujet", "message")
    list_filter = ("traite", "cree_le")
    list_editable = ("traite",)
    readonly_fields = ("nom", "email", "sujet", "message", "cree_le")
    date_hierarchy = "cree_le"
    ordering = ("-cree_le",)
    actions = [
        creer_action_export_csv(
            ["id", "nom", "email", "sujet", "message", "traite", "cree_le"],
            nom_fichier="messages_contact_ciat",
        )
    ]



# ==============================================================================
# Phase 9 — T1 : Lettre d'information
# ==============================================================================

import csv
from django.http import HttpResponse
from apps.core.services import enregistrer_audit
from .models import AbonnementLettre


def exporter_abonnements_lettre_csv(modeladmin, request, queryset):
    """Exporte la liste des abonnés en CSV avec email et statut seulement.

    Enregistre rigoureusement l'action dans le journal d'audit sans donnée sensible.
    """
    response = HttpResponse(content_type="text/csv; charset=utf-8-sig")
    response["Content-Disposition"] = f'attachment; filename="abonnes_lettre_{queryset.count()}.csv"'

    writer = csv.writer(response, delimiter=";")
    writer.writerow(["Email", "Statut"])

    for ab in queryset:
        writer.writerow([ab.email, ab.statut])

    # Traçabilité dans le journal d'audit d'Ibrahima
    enregistrer_audit(
        acteur=request.user,
        action="export_csv_abonnements_lettre",
        objet=f"Export CSV de {queryset.count()} abonné(s) à la lettre d'information",
        avant={},
        apres={"total_exporte": queryset.count()},
    )

    return response


exporter_abonnements_lettre_csv.short_description = "Exporter la sélection en CSV (email et statut seulement)"


@admin.register(AbonnementLettre)
class AbonnementLettreAdmin(admin.ModelAdmin):
    list_display = ("email", "statut", "cree_le", "confirme_le", "desabonne_le")
    list_filter = ("statut", "cree_le", "confirme_le")
    search_fields = ("email",)
    readonly_fields = ("cree_le", "confirme_le", "desabonne_le", "jeton")
    date_hierarchy = "cree_le"
    ordering = ("-cree_le",)
    actions = [exporter_abonnements_lettre_csv]
