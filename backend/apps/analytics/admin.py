from django.contrib import admin
from .models import Financement, Partenariat


@admin.register(Partenariat)
class PartenariatAdmin(admin.ModelAdmin):
    list_display = ["partenaire", "projet", "type", "date_debut", "statut"]
    list_filter = ["type", "statut", "projet__cohorte", "projet__domaine"]
    search_fields = ["partenaire", "projet__titre", "description"]
    date_hierarchy = "date_debut"


@admin.register(Financement)
class FinancementAdmin(admin.ModelAdmin):
    list_display = ["source", "montant", "projet", "date", "statut"]
    list_filter = ["statut", "projet__cohorte", "projet__domaine"]
    search_fields = ["source", "projet__titre", "description"]
    date_hierarchy = "date"
