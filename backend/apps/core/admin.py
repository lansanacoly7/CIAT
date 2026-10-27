from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin

from .admin_actions import creer_action_export_csv
from .models import Cohorte, Domaine, Projet, User


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

