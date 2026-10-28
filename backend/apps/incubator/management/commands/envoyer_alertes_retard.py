"""Commande de management : envoi des alertes de retard par email (Phase 4 Pathé).

Usage :
    python manage.py envoyer_alertes_retard [--date AAAA-MM-JJ]

Critères d'acceptation :
- Envoie un email au porteur et au mentor de chaque projet ayant un jalon en retard.
- Utilise le système d'email de Django (console en dev, SMTP en prod).
- Idempotente : un même jalon ne déclenche pas deux emails le même jour pour un destinataire.
"""
from datetime import datetime

from django.core.management.base import BaseCommand
from django.utils import timezone

from apps.incubator.notifications import envoyer_alertes_jalons_en_retard


class Command(BaseCommand):
    help = "Envoie les alertes email pour les jalons d'incubation en retard (idempotente sur la journée)."

    def add_arguments(self, parser):
        parser.add_argument(
            "--date",
            type=str,
            default=None,
            help="Date de référence (format AAAA-MM-JJ). Par défaut : date courante.",
        )

    def handle(self, *args, **options):
        ref_date = None
        if options.get("date"):
            try:
                ref_date = datetime.strptime(options["date"], "%Y-%m-%d").date()
            except ValueError:
                self.stderr.write(self.style.ERROR("Format de date invalide. Utilisez AAAA-MM-JJ."))
                return

        today = ref_date or timezone.now().date()
        self.stdout.write(f"Vérification des jalons en retard à la date du {today.strftime('%d/%m/%Y')}...")

        stats = envoyer_alertes_jalons_en_retard(today=today)

        self.stdout.write(
            self.style.SUCCESS(
                f"[TERMINÉ] Jalons en retard : {stats['jalons_en_retard']} | "
                f"Alertes envoyées : {stats['alertes_envoyees']} | "
                f"Alertes ignorées (déjà envoyées) : {stats['alertes_ignorees']}"
            )
        )
