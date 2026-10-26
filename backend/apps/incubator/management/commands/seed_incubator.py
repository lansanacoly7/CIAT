"""Initialise la grille d'évaluation par défaut avec 5 critères pour l'incubateur CIAT."""
from django.core.management.base import BaseCommand

from apps.incubator.models import Critere, Grille

CRITERES_DEFAUT = [
    {
        "libelle": "Pertinence du problème et adéquation de la solution",
        "poids": 1,
        "note_max": 20,
        "ordre": 1,
    },
    {
        "libelle": "Caractère innovant et faisabilité technique",
        "poids": 1,
        "note_max": 20,
        "ordre": 2,
    },
    {
        "libelle": "Modèle économique et viabilité financière",
        "poids": 1,
        "note_max": 20,
        "ordre": 3,
    },
    {
        "libelle": "Compétences, profil et complémentarité de l'équipe",
        "poids": 1,
        "note_max": 20,
        "ordre": 4,
    },
    {
        "libelle": "Impact socio-économique, création de valeur et durabilité",
        "poids": 1,
        "note_max": 20,
        "ordre": 5,
    },
]


class Command(BaseCommand):
    help = "Crée la grille d'évaluation par défaut du comité CIAT avec ses 5 critères."

    def handle(self, *args, **options):
        grille, created = Grille.objects.get_or_create(
            nom="Grille standard de sélection CIAT",
            defaults={"active": True},
        )
        if created:
            self.stdout.write(self.style.SUCCESS(f"Grille créée : {grille.nom}"))
        else:
            self.stdout.write(f"Grille existante : {grille.nom}")

        for data in CRITERES_DEFAUT:
            critere, crit_created = Critere.objects.get_or_create(
                grille=grille,
                libelle=data["libelle"],
                defaults={
                    "poids": data["poids"],
                    "note_max": data["note_max"],
                    "ordre": data["ordre"],
                },
            )
            if crit_created:
                self.stdout.write(f"  + Critère ajouté : {critere.libelle}")

        self.stdout.write(
            self.style.SUCCESS("Grille d'évaluation et critères prêts.")
        )
