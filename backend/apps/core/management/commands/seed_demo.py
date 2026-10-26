"""Remplit la base avec les domaines du CIAT, une cohorte et un compte de démonstration par rôle.

    python manage.py seed_demo

À utiliser en développement uniquement : les mots de passe de démonstration sont connus de tous.
"""
from django.core.management.base import BaseCommand

from apps.core.models import Cohorte, Domaine, Role, User

DOMAINES = [
    "TIC, numérique, intelligence artificielle et données",
    "Mécanique, fabrication et maintenance",
    "Agriculture, transformation et environnement",
    "Énergie, efficacité énergétique et énergies renouvelables",
    "Pharmaceutique et biomédical",
    "Éducation, formation professionnelle et insertion",
    "Services aux collectivités, entrepreneuriat et incubation",
]

COMPTES = [
    ("admin@ciat.sn", Role.ADMIN, "Admin", "CIAT"),
    ("coordo@ciat.sn", Role.COORDONNATEUR, "Coordonnateur", "CIAT"),
    ("mentor@ciat.sn", Role.MENTOR, "Mentor", "CIAT"),
    ("comite@ciat.sn", Role.COMITE, "Membre", "Comité"),
    ("porteur@ciat.sn", Role.PORTEUR, "Porteur", "Projet"),
]
MOT_DE_PASSE = "Ciat2026!"


class Command(BaseCommand):
    help = "Crée les domaines, une cohorte et des comptes de démonstration."

    def handle(self, *args, **options):
        for nom in DOMAINES:
            Domaine.objects.get_or_create(nom=nom)
        Cohorte.objects.get_or_create(nom="Cohorte 2026", defaults={"annee": 2026})

        for email, role, prenom, nom in COMPTES:
            user, created = User.objects.get_or_create(
                email=email,
                defaults={"role": role, "first_name": prenom, "last_name": nom,
                          "is_staff": role == Role.ADMIN, "is_superuser": role == Role.ADMIN},
            )
            if created:
                user.set_password(MOT_DE_PASSE)
                user.save()
        self.stdout.write(self.style.SUCCESS(
            f"Données de démonstration prêtes. Comptes : *@ciat.sn, mot de passe {MOT_DE_PASSE}"
        ))
