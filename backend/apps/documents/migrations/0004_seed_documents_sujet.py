"""Migration de données pour synchroniser les 5 nouveaux types de documents et 15 modèles du sujet CIAT."""
import importlib
from django.db import migrations


def seed_documents_sujet(apps, schema_editor):
    migration_0002 = importlib.import_module("apps.documents.migrations.0002_seed_documents")
    initial_data = migration_0002.INITIAL_DATA

    TypeDocument = apps.get_model("documents", "TypeDocument")
    ModeleDocument = apps.get_model("documents", "ModeleDocument")

    for item in initial_data:
        type_obj, created_type = TypeDocument.objects.get_or_create(
            code=item["type_code"],
            defaults={"nom": item["type_nom"]},
        )
        if not created_type and type_obj.nom != item["type_nom"]:
            type_obj.nom = item["type_nom"]
            type_obj.save()

        for mod in item["modeles"]:
            modele_obj, created_mod = ModeleDocument.objects.get_or_create(
                type=type_obj,
                nom=mod["nom"],
                defaults={
                    "apercu": mod["apercu"],
                    "sections": mod["sections"],
                    "regles_charte": mod["regles_charte"],
                    "exemple_redaction": mod["exemple_redaction"],
                },
            )
            if not created_mod:
                modele_obj.apercu = mod["apercu"]
                modele_obj.sections = mod["sections"]
                modele_obj.regles_charte = mod["regles_charte"]
                modele_obj.exemple_redaction = mod["exemple_redaction"]
                modele_obj.save()


def rollback_documents_sujet(apps, schema_editor):
    TypeDocument = apps.get_model("documents", "TypeDocument")
    TypeDocument.objects.filter(
        code__in=[
            "attestation",
            "fiche_partenaire",
            "rapport_suivi",
            "compte_rendu",
            "rapport_annuel",
        ]
    ).delete()


class Migration(migrations.Migration):

    dependencies = [
        ("documents", "0003_alter_document_cree_le_alter_document_statut"),
    ]

    operations = [
        migrations.RunPython(seed_documents_sujet, rollback_documents_sujet),
    ]
