"""Gestion des courriels pour la lettre d'information (Phase 9 — T1).

Envois avec double opt-in, jetons signés à usage unique et liens de désabonnement.
Une panne d'envoi SMTP ne bloque jamais la réponse HTTP du serveur.
"""
import logging
from django.conf import settings
from django.core import signing
from django.core.mail import send_mail

logger = logging.getLogger(__name__)

SALT_LETTRE = "ciat.lettre_information"


def generer_jeton_signe(abonnement_id: int, email: str, raw_token: str, action: str) -> str:
    """Génère un jeton cryptographiquement signé pour confirmation ou désabonnement."""
    return signing.dumps(
        {
            "sub_id": abonnement_id,
            "email": email,
            "raw": raw_token,
            "action": action,
        },
        salt=SALT_LETTRE,
    )


def verifier_jeton_signe(jeton_signe: str, action_attendue: str, max_age: int = 86400 * 3) -> dict:
    """Vérifie la signature et la validité temporelle d'un jeton."""
    return signing.loads(
        jeton_signe,
        salt=SALT_LETTRE,
        max_age=max_age,
    )


def envoyer_email_confirmation_lettre(abonnement, raw_token: str) -> str:
    """Envoie l'email de confirmation double opt-in à l'abonné.

    Returns:
        jeton_signe: Le jeton signé inclus dans le lien de confirmation.
    """
    jeton_signe = generer_jeton_signe(abonnement.id, abonnement.email, raw_token, "confirmer")
    site_url = getattr(settings, "SITE_URL", "http://localhost:3000").rstrip("/")
    lien_confirmation = f"{site_url}/lettre/confirmer?jeton={jeton_signe}"

    sujet = "[CIAT] Confirmez votre abonnement à la lettre d'information"
    corps = (
        f"Bonjour,\n\n"
        f"Vous avez demandé à recevoir la lettre d'information du Centre d'Innovation, "
        f"d'Application et de Transfert (CIAT) de l'ISEP Amadou Trawaré.\n\n"
        f"Pour finaliser votre inscription, veuillez confirmer votre adresse en cliquant sur le lien ci-dessous "
        f"(ce lien sécurisé est valable 72 heures) :\n\n"
        f"{lien_confirmation}\n\n"
        f"Si vous n'êtes pas à l'origine de cette demande, vous pouvez ignorer ce courriel : "
        f"aucun abonnement ne sera activé sans votre confirmation.\n\n"
        f"Cordialement,\n"
        f"L'équipe du CIAT"
    )

    from_email = getattr(settings, "DEFAULT_FROM_EMAIL", "CIAT <contact@ciat.sn>")
    try:
        send_mail(
            subject=sujet,
            message=corps,
            from_email=from_email,
            recipient_list=[abonnement.email],
            fail_silently=False,
        )
    except Exception as exc:
        logger.warning("Échec d'envoi du courriel de confirmation de lettre d'information à %s: %s", abonnement.email, exc)

    return jeton_signe


def envoyer_email_bienvenue_lettre(abonnement, raw_unsub_token: str) -> str:
    """Envoie l'email de confirmation d'abonnement avec lien de désabonnement."""
    jeton_desabonnement = generer_jeton_signe(abonnement.id, abonnement.email, raw_unsub_token, "desabonner")
    site_url = getattr(settings, "SITE_URL", "http://localhost:3000").rstrip("/")
    lien_desabonnement = f"{site_url}/lettre/desabonner?jeton={jeton_desabonnement}"

    sujet = "[CIAT] Votre abonnement à la lettre d'information est confirmé"
    corps = (
        f"Bonjour,\n\n"
        f"Votre abonnement à la lettre d'information du CIAT est désormais actif. "
        f"Vous recevrez nos actualités technologiques, opportunités d'appels à projets "
        f"et innovations issues de l'ISEP Diamniadio.\n\n"
        f"Vous pouvez vous désabonner à tout moment à l'aide du lien sécurisé suivant :\n"
        f"{lien_desabonnement}\n\n"
        f"Cordialement,\n"
        f"L'équipe du CIAT"
    )

    from_email = getattr(settings, "DEFAULT_FROM_EMAIL", "CIAT <contact@ciat.sn>")
    try:
        send_mail(
            subject=sujet,
            message=corps,
            from_email=from_email,
            recipient_list=[abonnement.email],
            fail_silently=False,
        )
    except Exception as exc:
        logger.warning("Échec d'envoi du courriel de bienvenue de lettre d'information à %s: %s", abonnement.email, exc)

    return jeton_desabonnement
