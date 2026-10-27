"""Module d'envoi des emails transactionnels de l'incubateur (Phase 5 Pathé).

Gère :
- L'envoi d'un email de confirmation au porteur lors de la soumission de son dossier
  (contenant le lien de téléchargement de l'accusé de réception officiel en PDF)
- L'envoi d'un email de notification au porteur lors de la prise de décision par le comité
  (précisant si le dossier est accepté ou refusé, avec le motif officiel)
- Tolérance absolue aux pannes : aucune erreur d'envoi SMTP ou réseau ne bloque la soumission
  ni l'enregistrement de la décision (bloc try/except protecteur avec traçabilité dans les logs).
"""
import logging
from django.conf import settings
from django.core.mail import send_mail

logger = logging.getLogger(__name__)


def envoyer_email_confirmation_soumission(dossier) -> bool:
    """Envoie un email de confirmation au porteur de projet suite à la soumission officielle.

    L'email contient le lien direct pour télécharger l'accusé de réception PDF officiel.
    Ne lève jamais d'exception afin de garantir que la soumission du dossier reste validée.

    Args:
        dossier: Instance du modèle Dossier ayant été soumis.

    Returns:
        bool: True si l'email a été envoyé avec succès, False sinon.
    """
    try:
        if not dossier or not getattr(dossier, "projet", None):
            return False

        projet = dossier.projet
        porteur = getattr(projet, "porteur", None)
        if not porteur or not getattr(porteur, "email", None):
            logger.warning(
                "Impossible d'envoyer l'email de soumission : porteur ou email manquant pour le dossier %s",
                getattr(dossier, "id", None),
            )
            return False

        nom_destinataire = porteur.get_full_name() or porteur.email
        titre_projet = projet.titre or "Sans titre"
        reference = f"CIAT-AR-{dossier.id:05d}"
        lien_accuse = f"/api/incubator/dossiers/{dossier.id}/accuse/"

        sujet = f"[CIAT] Confirmation de soumission de votre dossier — {titre_projet}"
        corps = (
            f"Bonjour {nom_destinataire},\n\n"
            f"Nous vous confirmons la bonne réception de votre dossier de candidature pour le projet "
            f"« {titre_projet} ».\n\n"
            f"Référence officielle : {reference}\n"
            f"Votre dossier est désormais entre les mains du comité de sélection pour examen et évaluation.\n\n"
            f"Vous pouvez télécharger votre accusé de réception officiel au format PDF à l'adresse suivante :\n"
            f"{lien_accuse}\n\n"
            f"Nous vous remercions pour votre intérêt pour le programme du Centre d'Innovation et d'Accélération Technologique (CIAT).\n\n"
            f"Cordialement,\n"
            f"L'équipe du CIAT"
        )

        from_email = getattr(settings, "DEFAULT_FROM_EMAIL", "CIAT <noreply@localhost>")
        send_mail(
            subject=sujet,
            message=corps,
            from_email=from_email,
            recipient_list=[porteur.email],
            fail_silently=False,
        )
        logger.info(
            "Email de confirmation de soumission envoyé à %s pour le dossier %s (réf: %s)",
            porteur.email,
            dossier.id,
            reference,
        )
        return True
    except Exception as exc:
        logger.exception(
            "Échec de l'envoi de l'email de confirmation de soumission pour le dossier %s: %s",
            getattr(dossier, "id", None),
            exc,
        )
        return False


def envoyer_email_decision_dossier(decision) -> bool:
    """Envoie un email au porteur de projet pour lui notifier la décision du comité de sélection.

    L'email mentionne expressément la décision prise (accepté ou refusé) et le motif retenu.
    Ne lève jamais d'exception afin de ne pas compromettre la transaction de décision.

    Args:
        decision: Instance du modèle Decision enregistrée.

    Returns:
        bool: True si l'email a été envoyé avec succès, False sinon.
    """
    try:
        if not decision or not getattr(decision, "dossier", None):
            return False

        dossier = decision.dossier
        projet = getattr(dossier, "projet", None)
        if not projet:
            return False

        porteur = getattr(projet, "porteur", None)
        if not porteur or not getattr(porteur, "email", None):
            logger.warning(
                "Impossible d'envoyer l'email de décision : porteur ou email manquant pour le dossier %s",
                getattr(dossier, "id", None),
            )
            return False

        est_accepte = str(decision.decision).lower() in ("accepte", "accepté")
        decision_libelle = "ACCEPTÉ" if est_accepte else "REFUSÉ"
        nom_destinataire = porteur.get_full_name() or porteur.email
        titre_projet = projet.titre or "Sans titre"
        motif = decision.motif or "Aucun motif précisé."

        sujet = f"[CIAT] Décision du comité de sélection — {titre_projet}"

        if est_accepte:
            intro = (
                f"Nous avons le plaisir de vous annoncer que votre dossier de candidature "
                f"pour le projet « {titre_projet} » a été RETENU par le comité de sélection du CIAT."
            )
            suite = (
                "Votre projet entre désormais en phase d'accompagnement et d'incubation. "
                "Un mentor référent vous sera attribué pour convenir de vos objectifs et de votre feuille de route."
            )
        else:
            intro = (
                f"Nous vous informons que le comité de sélection n'a pas retenu votre dossier "
                f"de candidature pour le projet « {titre_projet} » dans le cadre de cette cohorte."
            )
            suite = (
                "Nous tenons à saluer la qualité de votre démarche et vous encourageons à faire évoluer "
                "votre proposition pour de prochaines sessions d'appels à candidatures."
            )

        corps = (
            f"Bonjour {nom_destinataire},\n\n"
            f"{intro}\n\n"
            f"--- RÉSULTAT OFFICIEL ---\n"
            f"Statut : {decision_libelle}\n"
            f"Motif de la décision :\n"
            f"{motif}\n"
            f"--------------------------\n\n"
            f"{suite}\n\n"
            f"Cordialement,\n"
            f"Le Comité de sélection CIAT"
        )

        from_email = getattr(settings, "DEFAULT_FROM_EMAIL", "CIAT <noreply@localhost>")
        send_mail(
            subject=sujet,
            message=corps,
            from_email=from_email,
            recipient_list=[porteur.email],
            fail_silently=False,
        )
        logger.info(
            "Email de décision (%s) envoyé à %s pour le dossier %s",
            decision_libelle,
            porteur.email,
            dossier.id,
        )
        return True
    except Exception as exc:
        logger.exception(
            "Échec de l'envoi de l'email de décision pour le dossier %s: %s",
            getattr(getattr(decision, "dossier", None), "id", None),
            exc,
        )
        return False
