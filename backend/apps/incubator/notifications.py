"""Module de gestion des notifications et alertes de suivi (Phase 4 Pathé).

Gère :
- L'envoi d'alertes par email en cas de jalon en retard pour les porteurs et mentors
- La traçabilité en base pour garantir l'idempotence journalière (pas de double envoi le même jour)
"""
import logging

from django.conf import settings
from django.core.mail import send_mail
from django.db import models
from django.utils import timezone

logger = logging.getLogger(__name__)


class AlerteJalonEnvoyee(models.Model):
    """Trace d'envoi d'une alerte email pour un jalon en retard.
    
    Garantit l'idempotence journalière : un même jalon ne déclenche pas
    deux alertes le même jour pour un même destinataire.
    """

    jalon = models.ForeignKey(
        "incubator.Jalon", on_delete=models.CASCADE, related_name="alertes_envoyees"
    )
    destinataire = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="alertes_jalons_recues",
    )
    date_envoi = models.DateField(default=timezone.now)
    cree_le = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-cree_le"]
        verbose_name = "Trace d'alerte de jalon"
        verbose_name_plural = "Traces d'alertes de jalons"
        constraints = [
            models.UniqueConstraint(
                fields=["jalon", "destinataire", "date_envoi"],
                name="unique_alerte_jalon_destinataire_date",
            )
        ]

    def __str__(self):
        return f"Alerte {self.jalon.titre} -> {self.destinataire.email} ({self.date_envoi})"


def envoyer_alertes_jalons_en_retard(today=None) -> dict:
    """Parcourt l'ensemble des jalons en retard et envoie un email d'alerte aux porteurs et mentors.
    
    Opération idempotente : ignore tout jalon ayant déjà reçu une alerte aujourd'hui pour ce destinataire.
    
    Returns:
        dict: Statistiques de traitement {
            'jalons_en_retard': int,
            'alertes_envoyees': int,
            'alertes_ignorees': int,
            'details': list
        }
    """
    from apps.incubator.models import Jalon, StatutJalon

    if today is None:
        today = timezone.now().date()

    # Jalons non validés dont la date d'échéance est antérieure à aujourd'hui
    jalons_en_retard = (
        Jalon.objects.filter(echeance__lt=today)
        .exclude(statut=StatutJalon.FAIT)
        .select_related("projet", "projet__porteur", "projet__affectation_mentor__mentor")
        .order_by("echeance")
    )

    total_jalons = jalons_en_retard.count()
    alertes_envoyees = 0
    alertes_ignorees = 0
    details = []

    from_email = getattr(
        settings, "DEFAULT_FROM_EMAIL", "CIAT Démonstration <contact@ciat-demo.example>"
    )

    for jalon in jalons_en_retard:
        projet = jalon.projet
        retard_jours = (today - jalon.echeance).days

        # Liste des destinataires concernés : porteur du projet + mentor affecté s'il existe
        destinataires = []
        if projet.porteur and projet.porteur.email:
            destinataires.append((projet.porteur, "Porteur de projet"))

        if hasattr(projet, "affectation_mentor") and projet.affectation_mentor and projet.affectation_mentor.mentor:
            mentor = projet.affectation_mentor.mentor
            if mentor.email and mentor != projet.porteur:
                destinataires.append((mentor, "Mentor référent"))

        for destinataire, role_libelle in destinataires:
            # Vérification de l'idempotence : déjà envoyé aujourd'hui ?
            deja_envoye = AlerteJalonEnvoyee.objects.filter(
                jalon=jalon, destinataire=destinataire, date_envoi=today
            ).exists()

            if deja_envoye:
                alertes_ignorees += 1
                details.append({
                    "jalon_id": jalon.id,
                    "destinataire": destinataire.email,
                    "statut": "ignore_deja_envoye",
                })
                continue

            # Construction du message email
            sujet = f"[CIAT] Alerte de retard : jalon « {jalon.titre} » — Projet {projet.titre}"
            nom_destinataire = destinataire.get_full_name() or destinataire.email

            corps_message = (
                f"Bonjour {nom_destinataire},\n\n"
                f"Nous vous informons qu'un jalon du projet « {projet.titre} » présente un retard d'exécution "
                f"sur la plateforme du CIAT (ISEP Diamniadio) :\n\n"
                f"• Jalon : {jalon.titre}\n"
                f"• Projet : {projet.titre}\n"
                f"• Votre rôle : {role_libelle}\n"
                f"• Échéance prévue : {jalon.echeance.strftime('%d/%m/%Y')} (dépassée de {retard_jours} jour{'s' if retard_jours > 1 else ''})\n"
                f"• Statut actuel : {jalon.get_statut_display()}\n"
                f"• Porteur : {projet.porteur.get_full_name()} ({projet.porteur.email})\n\n"
                f"Merci de vous connecter à la plateforme pour régulariser l'avancement, "
                f"déposer les preuves requises ou ajuster les jalons avec l'équipe d'accompagnement.\n\n"
                f"Plateforme Numérique du CIAT\n"
                f"Centre d'Innovation, d'Application et de Transfert — ISEP Diamniadio"
            )

            try:
                send_mail(
                    subject=sujet,
                    message=corps_message,
                    from_email=from_email,
                    recipient_list=[destinataire.email],
                    fail_silently=False,
                )
                AlerteJalonEnvoyee.objects.create(
                    jalon=jalon,
                    destinataire=destinataire,
                    date_envoi=today,
                )
                try:
                    from apps.core.services import notifier_jalon_retard
                    notifier_jalon_retard(jalon, destinataire)
                except Exception as ex_notif:
                    logger.warning("Échec de création de la notification jalon retard: %s", ex_notif)
                alertes_envoyees += 1
                details.append({
                    "jalon_id": jalon.id,
                    "destinataire": destinataire.email,
                    "statut": "envoye",
                })
            except Exception as e:
                logger.error(f"Échec d'envoi d'email pour le jalon {jalon.id} à {destinataire.email}: {e}")
                details.append({
                    "jalon_id": jalon.id,
                    "destinataire": destinataire.email,
                    "statut": f"erreur: {e}",
                })

    return {
        "jalons_en_retard": total_jalons,
        "alertes_envoyees": alertes_envoyees,
        "alertes_ignorees": alertes_ignorees,
        "details": details,
    }


# Export des fonctions d'envoi d'emails transactionnels (Phase 5)
from .emails import (  # noqa: E402
    envoyer_email_confirmation_soumission,
    envoyer_email_decision_dossier,
)

__all__ = [
    "AlerteJalonEnvoyee",
    "envoyer_alertes_jalons_en_retard",
    "envoyer_email_confirmation_soumission",
    "envoyer_email_decision_dossier",
]
