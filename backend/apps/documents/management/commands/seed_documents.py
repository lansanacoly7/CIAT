"""Commande de chargement des types et modèles de documents officiels du CIAT.

    python manage.py seed_documents

Idempotent : recharge ou met à jour les 4 types et 12 modèles de documents.
"""
import importlib
from django.core.management.base import BaseCommand
from apps.documents.models import ModeleDocument, TypeDocument

migration_0002 = importlib.import_module("apps.documents.migrations.0002_seed_documents")
INITIAL_DATA = migration_0002.INITIAL_DATA



class Command(BaseCommand):
    help = "Charge les 4 types de documents et les 12 modèles prédéfinis du CIAT."

    def handle(self, *args, **options):
        nb_types = 0
        nb_modeles = 0

        for item in INITIAL_DATA:
            type_obj, created_type = TypeDocument.objects.get_or_create(
                code=item["type_code"],
                defaults={"nom": item["type_nom"]},
            )
            if not created_type and type_obj.nom != item["type_nom"]:
                type_obj.nom = item["type_nom"]
                type_obj.save()
            nb_types += 1

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
                nb_modeles += 1

        self.stdout.write(
            self.style.SUCCESS(
                f"Modèles de documents synchronisés : {nb_types} types et {nb_modeles} modèles."
            )
        )
