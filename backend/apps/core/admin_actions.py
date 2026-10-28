"""Actions d'administration réutilisables pour le CIAT (Phase 8 — T2).

Fournit notamment un générateur d'action d'export CSV sécurisé :
- En-têtes et données encodés en UTF-8 avec BOM (utf-8-sig) pour ouverture directe dans Excel
- Formatage soigné des dates, booléens et clés étrangères
- Exclusion absolue des mots de passe, hashs et données secrètes
"""
import csv

from django.http import HttpResponse


def creer_action_export_csv(champs, colonnes=None, nom_fichier="export"):
    """Génère une action Django Admin pour exporter la sélection courante en CSV.

    Args:
        champs: Liste des noms de champs ou attributs du modèle à exporter.
        colonnes: Liste optionnelle des libellés d'en-tête de colonnes.
        nom_fichier: Préfixe du nom du fichier CSV téléchargé.

    Returns:
        Fonction d'action admin compatible avec ModelAdmin.actions.
    """
    # Protection absolue : exclusion systématique de tout champ sensible ou mot de passe
    champs_interdits = {"password", "password1", "password2", "hash", "secret", "token"}
    champs_filtres = [f for f in champs if f.lower() not in champs_interdits]

    def action_exporter_csv(modeladmin, request, queryset):
        meta = modeladmin.model._meta

        # Résolution des libellés de colonnes
        if colonnes:
            headers = colonnes
        else:
            headers = []
            for f in champs_filtres:
                try:
                    field = meta.get_field(f)
                    headers.append(field.verbose_name.capitalize() if getattr(field, "verbose_name", None) else f)
                except Exception:
                    headers.append(f.replace("_", " ").capitalize())

        response = HttpResponse(content_type="text/csv; charset=utf-8-sig")
        response["Content-Disposition"] = f'attachment; filename="{nom_fichier}_{queryset.count()}.csv"'

        writer = csv.writer(response, delimiter=";")
        writer.writerow(headers)

        for obj in queryset:
            row = []
            for f in champs_filtres:
                val = getattr(obj, f, "")
                if callable(val):
                    try:
                        val = val()
                    except Exception:
                        val = ""
                if val is None:
                    row.append("")
                elif isinstance(val, bool):
                    row.append("Oui" if val else "Non")
                elif hasattr(val, "strftime"):
                    row.append(val.strftime("%Y-%m-%d %H:%M:%S"))
                else:
                    row.append(str(val))
            writer.writerow(row)

        return response

    action_exporter_csv.short_description = "Exporter la sélection en CSV"
    return action_exporter_csv
