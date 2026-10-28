from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin

from .admin_actions import creer_action_export_csv
from .models import Cohorte, Domaine, JournalAudit, Notification, Projet, User
from .services import tracer_changement_role


@admin.register(User)
class UserAdmin(BaseUserAdmin):
    ordering = ["email"]
    list_display = [
        "email",
        "last_name",
        "first_name",
        "role",
        "organisation",
        "is_active",
        "date_joined",
    ]
    list_filter = ["role", "is_active", "genre", "date_joined"]
    search_fields = ["email", "first_name", "last_name", "organisation", "telephone"]
    date_hierarchy = "date_joined"
    readonly_fields = ["date_joined", "last_login"]
    actions = [
        creer_action_export_csv(
            [
                "id",
                "email",
                "last_name",
                "first_name",
                "role",
                "organisation",
                "telephone",
                "genre",
                "is_active",
                "date_joined",
            ],
            nom_fichier="utilisateurs_ciat",
        )
    ]
    fieldsets = (
        (None, {"fields": ("email", "password")}),
        (
            "Identité",
            {"fields": ("first_name", "last_name", "genre", "telephone", "organisation")},
        ),
        (
            "Rôle et droits",
            {
                "fields": (
                    "role",
                    "is_active",
                    "is_staff",
                    "is_superuser",
                    "groups",
                    "user_permissions",
                )
            },
        ),
        ("Dates", {"fields": ("last_login", "date_joined")}),
    )
    add_fieldsets = (
        (None, {"classes": ("wide",), "fields": ("email", "role", "password1", "password2")}),
    )

    def save_model(self, request, obj, form, change):
        if change and "role" in form.changed_data:
            role_avant = form.initial.get("role", "")
            tracer_changement_role(request.user, obj, role_avant, obj.role)
        super().save_model(request, obj, form, change)


@admin.register(Domaine)
class DomaineAdmin(admin.ModelAdmin):
    list_display = ["nom", "slug", "get_nb_projets"]
    search_fields = ["nom", "slug"]
    prepopulated_fields = {"slug": ("nom",)}

    @admin.display(description="Projets associés")
    def get_nb_projets(self, obj):
        return obj.projets.count()


@admin.register(Cohorte)
class CohorteAdmin(admin.ModelAdmin):
    list_display = ["nom", "annee", "date_debut", "date_fin", "get_nb_projets"]
    list_filter = ["annee"]
    search_fields = ["nom"]
    date_hierarchy = "date_debut"

    @admin.display(description="Projets associés")
    def get_nb_projets(self, obj):
        return obj.projets.count()


@admin.register(Projet)
class ProjetAdmin(admin.ModelAdmin):
    list_display = ["titre", "porteur", "domaine", "cohorte", "statut", "vues", "cree_le"]
    list_filter = ["statut", "domaine", "cohorte", "cree_le"]
    search_fields = ["titre", "resume", "probleme", "solution", "porteur__email", "porteur__last_name"]
    list_select_related = ["domaine", "cohorte", "porteur"]
    date_hierarchy = "cree_le"
    readonly_fields = ["vues", "cree_le", "modifie_le"]
    actions = [
        creer_action_export_csv(
            [
                "id",
                "titre",
                "porteur",
                "domaine",
                "cohorte",
                "statut",
                "vues",
                "cree_le",
            ],
            nom_fichier="projets_ciat",
        )
    ]


@admin.register(JournalAudit)
class JournalAuditAdmin(admin.ModelAdmin):
    list_display = ["date", "acteur", "action", "objet"]
    list_filter = ["action", "date"]
    search_fields = ["action", "objet", "acteur__email"]
    date_hierarchy = "date"
    list_select_related = ["acteur"]
    readonly_fields = ["date", "acteur", "action", "objet", "avant", "apres"]
    actions = [
        creer_action_export_csv(
            ["id", "date", "acteur", "action", "objet", "avant", "apres"],
            nom_fichier="journal_audit_ciat",
        )
    ]

    def has_add_permission(self, request):
        return False

    def has_delete_permission(self, request, obj=None):
        return False


@admin.register(Notification)
class NotificationAdmin(admin.ModelAdmin):
    list_display = ["date", "destinataire", "type", "message", "lue"]
    list_filter = ["type", "lue", "date"]
    search_fields = ["destinataire__email", "message"]
    date_hierarchy = "date"
    list_select_related = ["destinataire"]
    actions = [
        creer_action_export_csv(
            ["id", "date", "destinataire", "type", "message", "lue"],
            nom_fichier="notifications_ciat",
        )
    ]

