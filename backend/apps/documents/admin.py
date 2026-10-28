"""Administration des documents et modèles du CIAT."""
from django.contrib import admin

from apps.core.admin_actions import creer_action_export_csv
from apps.documents.models import Document, ModeleDocument, TypeDocument, VersionDocument


@admin.register(TypeDocument)
class TypeDocumentAdmin(admin.ModelAdmin):
    list_display = ("code", "nom", "get_nb_modeles")
    search_fields = ("code", "nom")

    @admin.display(description="Modèles associés")
    def get_nb_modeles(self, obj):
        return obj.modeles.count()


@admin.register(ModeleDocument)
class ModeleDocumentAdmin(admin.ModelAdmin):
    list_display = ("nom", "type", "get_nb_documents")
    list_filter = ("type",)
    search_fields = ("nom", "apercu")
    list_select_related = ["type"]

    @admin.display(description="Documents rédigés")
    def get_nb_documents(self, obj):
        return obj.documents.count()


class VersionDocumentInline(admin.TabularInline):
    model = VersionDocument
    extra = 0
    readonly_fields = ("numero", "auteur", "date")


@admin.register(Document)
class DocumentAdmin(admin.ModelAdmin):
    list_display = ("titre", "modele", "projet", "statut", "auteur", "cree_le", "modifie_le")
    list_filter = ("statut", "modele__type", "cree_le")
    search_fields = ("titre", "sujet", "auteur__email", "projet__titre")
    date_hierarchy = "cree_le"
    list_select_related = ["modele", "projet", "auteur"]
    readonly_fields = ("cree_le", "modifie_le")
    inlines = [VersionDocumentInline]
    actions = [
        creer_action_export_csv(
            ["id", "titre", "modele", "projet", "statut", "auteur", "cree_le"],
            nom_fichier="documents_ciat",
        )
    ]


@admin.register(VersionDocument)
class VersionDocumentAdmin(admin.ModelAdmin):
    list_display = ("document", "numero", "auteur", "date")
    list_filter = ("date",)
    search_fields = ("document__titre", "auteur__email")
    date_hierarchy = "date"
    list_select_related = ["document", "auteur"]
    readonly_fields = ("numero", "auteur", "date")

