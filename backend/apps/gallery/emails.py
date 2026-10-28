"""Module d'envoi d'emails pour la Galerie des innovations (Phase 8 — T1).

Gère la notification par email au porteur de projet lors de l'enregistrement
d'une nouvelle manifestation d'intérêt pour sa fiche d'innovation.
Tolérance totale aux pannes : une défaillance SMTP ou réseau ne bloque jamais
la réponse HTTP du serveur.
"""
import logging

from django.conf import settings
from django.core.mail import send_mail

logger = logging.getLogger(__name__)


def envoyer_email_manifestation_interet(manifestation) -> bool:
    """Envoie un email au porteur du projet pour lui notifier un nouvel intérêt.

    Args:
        manifestation: Instance du modèle ManifestationInteret.

    Returns:
        bool: True si l'email a été envoyé avec succès, False sinon.
    """
    try:
        if not manifestation or not getattr(manifestation, "fiche", None):
            return False

        fiche = manifestation.fiche
        projet = getattr(fiche, "projet", None)
        porteur = getattr(projet, "porteur", None) if projet else None

        if not porteur or not getattr(porteur, "email", None):
            logger.warning(
                "Impossible d'envoyer l'email de manifestation d'intérêt : porteur ou email manquant pour la fiche %s",
                getattr(fiche, "slug", None),
            )
            return False

        nom_destinataire = porteur.get_full_name() or porteur.email
        titre_fiche = fiche.titre or "Fiche d'innovation"
        organisation = manifestation.organisation.strip() if manifestation.organisation else "Non précisée"

        sujet = f"[CIAT Galerie] Nouvelle manifestation d'intérêt pour votre fiche — {titre_fiche}"
        corps = (
            f"Bonjour {nom_destinataire},\n\n"
            f"Une nouvelle manifestation d'intérêt a été enregistrée pour votre projet dans la Galerie des innovations CIAT.\n\n"
            f"Fiche concernée : {titre_fiche}\n"
            f"Nom du contact : {manifestation.nom}\n"
            f"Email de contact : {manifestation.email}\n"
            f"Organisation / Entité : {organisation}\n\n"
            f"Message adressé :\n"
            f"« {manifestation.message} »\n\n"
            f"Vous pouvez prendre contact directement avec cet investisseur ou partenaire potentiel.\n\n"
            f"Cordialement,\n"
            f"L'équipe du CIAT"
        )

        from_email = getattr(
            settings, "DEFAULT_FROM_EMAIL", "CIAT Galerie <contact@ciat-demo.example>"
        )

        send_mail(
            subject=sujet,
            message=corps,
            from_email=from_email,
            recipient_list=[porteur.email],
            fail_silently=False,
        )
        logger.info(
            "Email de manifestation d'intérêt envoyé avec succès à %s pour la fiche '%s'",
            porteur.email,
            fiche.slug,
        )
        return True
    except Exception as exc:
        logger.warning(
            "Échec de l'envoi de l'email de manifestation d'intérêt (toléré) pour la fiche %s : %s",
            getattr(getattr(manifestation, "fiche", None), "slug", "inconnue"),
            exc,
        )
        return False
