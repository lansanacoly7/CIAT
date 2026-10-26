"""Administration des documents et modèles du CIAT."""
from django.contrib import admin
from apps.documents.models import Document, ModeleDocument, TypeDocument, VersionDocument


@admin.register(TypeDocument)
class TypeDocumentAdmin(admin.ModelAdmin):
    list_display = ("code", "nom")
    search_fields = ("code", "nom")


@admin.register(ModeleDocument)
class ModeleDocumentAdmin(admin.ModelAdmin):
    list_display = ("nom", "type")
    list_filter = ("type",)
    search_fields = ("nom", "apercu")


class VersionDocumentInline(admin.TabularInline):
    model = VersionDocument
    extra = 0
    readonly_fields = ("numero", "auteur", "date")


@admin.register(Document)
class DocumentAdmin(admin.ModelAdmin):
    list_display = ("titre", "modele", "statut", "auteur", "cree_le")
    list_filter = ("statut", "modele__type")
    search_fields = ("titre", "sujet")
    inlines = [VersionDocumentInline]
