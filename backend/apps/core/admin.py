from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin

from .models import Cohorte, Domaine, JournalAudit, Notification, Projet, User
from .services import tracer_changement_role


@admin.register(User)
class UserAdmin(BaseUserAdmin):
    ordering = ["email"]
    list_display = ["email", "first_name", "last_name", "role", "is_active"]
    list_filter = ["role", "is_active"]
    search_fields = ["email", "first_name", "last_name"]
    fieldsets = (
        (None, {"fields": ("email", "password")}),
        ("Identité", {"fields": ("first_name", "last_name", "genre", "telephone", "organisation")}),
        ("Rôle et droits", {"fields": ("role", "is_active", "is_staff", "is_superuser", "groups", "user_permissions")}),
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


admin.site.register(Domaine)
admin.site.register(Cohorte)


@admin.register(Projet)
class ProjetAdmin(admin.ModelAdmin):
    list_display = ["titre", "domaine", "cohorte", "statut", "porteur"]
    list_filter = ["statut", "domaine", "cohorte"]
    search_fields = ["titre", "resume"]


@admin.register(JournalAudit)
class JournalAuditAdmin(admin.ModelAdmin):
    list_display = ["date", "acteur", "action", "objet"]
    list_filter = ["action", "date"]
    search_fields = ["action", "objet", "acteur__email"]
    readonly_fields = ["date", "acteur", "action", "objet", "avant", "apres"]

    def has_add_permission(self, request):
        return False

    def has_delete_permission(self, request, obj=None):
        return False


@admin.register(Notification)
class NotificationAdmin(admin.ModelAdmin):
    list_display = ["date", "destinataire", "type", "message", "lue"]
    list_filter = ["type", "lue", "date"]
    search_fields = ["destinataire__email", "message"]
