"""Configuration de l'administration Django pour le module Assistant."""
from django.contrib import admin

from apps.core.admin_actions import creer_action_export_csv

from .models import Conversation, MessageAssistant, PassageDocument


@admin.register(PassageDocument)
class PassageDocumentAdmin(admin.ModelAdmin):
    list_display = ("document", "position", "cree_le")
    list_filter = ("document__categorie", "cree_le")
    search_fields = ("document__titre", "texte")
    date_hierarchy = "cree_le"
    list_select_related = ["document"]


class MessageAssistantInline(admin.TabularInline):
    model = MessageAssistant
    extra = 0
    readonly_fields = ("role", "contenu", "sources", "avertissement_ia", "mode", "cree_le")
    can_delete = False


@admin.register(Conversation)
class ConversationAdmin(admin.ModelAdmin):
    list_display = ("titre", "utilisateur", "get_nb_messages", "cree_le", "modifie_le")
    list_filter = ("cree_le", "modifie_le")
    search_fields = ("titre", "utilisateur__email", "utilisateur__last_name")
    date_hierarchy = "cree_le"
    list_select_related = ["utilisateur"]
    readonly_fields = ("cree_le", "modifie_le")
    inlines = [MessageAssistantInline]
    actions = [
        creer_action_export_csv(
            ["id", "titre", "utilisateur", "cree_le", "modifie_le"],
            nom_fichier="conversations_assistant_ciat",
        )
    ]

    @admin.display(description="Messages")
    def get_nb_messages(self, obj):
        return obj.messages.count()


@admin.register(MessageAssistant)
class MessageAssistantAdmin(admin.ModelAdmin):
    list_display = ("conversation", "role", "mode", "cree_le")
    list_filter = ("role", "mode", "cree_le")
    search_fields = ("contenu", "conversation__titre", "conversation__utilisateur__email")
    date_hierarchy = "cree_le"
    list_select_related = ["conversation", "conversation__utilisateur"]
    readonly_fields = ("cree_le",)

