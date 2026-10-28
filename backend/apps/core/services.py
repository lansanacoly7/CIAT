"""Services d'audit des actions sensibles et de notification interne (Phase 8 T1 & T2)."""
import logging
from typing import Any

from django.contrib.auth import get_user_model

from apps.core.models import JournalAudit, Notification

logger = logging.getLogger(__name__)
User = get_user_model()

SENSITIVE_KEYS = {
    "password",
    "mot_de_passe",
    "token",
    "refresh",
    "access",
    "secret",
    "authorization",
    "auth",
    "api_key",
    "jwt",
}


def nettoyer_donnees_sensibles(data: Any) -> Any:
    """Filtre récursivement toute donnée sensible d'un dictionnaire ou d'une liste."""
    if isinstance(data, dict):
        nettoye = {}
        for cle, valeur in data.items():
            if str(cle).lower() in SENSITIVE_KEYS:
                continue
            nettoye[cle] = nettoyer_donnees_sensibles(valeur)
        return nettoye
    if isinstance(data, list):
        return [nettoyer_donnees_sensibles(item) for item in data]
    if hasattr(data, "pk"):
        return data.pk
    return data


def enregistrer_audit(
    *,
    acteur: Any | None,
    action: str,
    objet: str,
    avant: dict[str, Any] | None = None,
    apres: dict[str, Any] | None = None,
) -> JournalAudit:
    """Enregistre une entrée dans le journal d'audit."""
    user_acteur = acteur if isinstance(acteur, User) and acteur.is_authenticated else None
    avant_propre = nettoyer_donnees_sensibles(avant or {})
    apres_propre = nettoyer_donnees_sensibles(apres or {})

    journal = JournalAudit.objects.create(
        acteur=user_acteur,
        action=action,
        objet=str(objet)[:255],
        avant=avant_propre,
        apres=apres_propre,
    )
    logger.info("Audit [%s] par %s sur %s", action, user_acteur or "Système", objet)
    return journal


def creer_notification(
    *,
    destinataire: Any,
    type: str,
    message: str,
    lien: str = "",
) -> Notification | None:
    """Crée une notification interne dans la plateforme."""
    if not isinstance(destinataire, User):
        return None

    notification = Notification.objects.create(
        destinataire=destinataire,
        type=type,
        message=str(message)[:255],
        lien=str(lien)[:255],
    )
    logger.info("Notification [%s] créée pour %s", type, destinataire.email)
    return notification


def tracer_decision_dossier(acteur: Any, decision: Any) -> JournalAudit:
    """Trace la décision sur un dossier et notifie le porteur."""
    dossier = decision.dossier
    projet = dossier.projet
    statut_affiche = decision.get_decision_display() if hasattr(decision, "get_decision_display") else decision.decision

    journal = enregistrer_audit(
        acteur=acteur,
        action="decision_dossier",
        objet=f"Dossier #{dossier.id} ({projet.titre})",
        avant={"statut": "depose"},
        apres={
            "statut": dossier.statut,
            "decision": decision.decision,
            "motif": decision.motif,
        },
    )

    if projet.porteur:
        creer_notification(
            destinataire=projet.porteur,
            type=Notification.Type.DECISION_DOSSIER,
            message=f"Une décision ({statut_affiche}) a été enregistrée sur votre dossier.",
            lien="/incubateur/dossier",
        )

    return journal


def tracer_affectation_mentor(
    acteur: Any,
    affectation: Any,
    mentor_precedent: Any | None = None,
) -> JournalAudit:
    """Trace l'affectation d'un mentor et notifie le porteur et le mentor."""
    projet = affectation.projet
    nouveau_mentor = affectation.mentor

    avant = {}
    if mentor_precedent:
        avant = {
            "mentor_id": mentor_precedent.id,
            "mentor_nom": mentor_precedent.get_full_name() or mentor_precedent.email,
        }

    apres = {
        "mentor_id": nouveau_mentor.id,
        "mentor_nom": nouveau_mentor.get_full_name() or nouveau_mentor.email,
    }

    journal = enregistrer_audit(
        acteur=acteur,
        action="affectation_mentor",
        objet=f"Projet #{projet.id} ({projet.titre})",
        avant=avant,
        apres=apres,
    )

    nom_mentor = nouveau_mentor.get_full_name() or nouveau_mentor.email
    if projet.porteur:
        creer_notification(
            destinataire=projet.porteur,
            type=Notification.Type.MENTOR_AFFECTE,
            message=f"Le mentor {nom_mentor} a été affecté à votre projet « {projet.titre} ».",
            lien=f"/incubateur/projets/{projet.id}",
        )

    if nouveau_mentor != projet.porteur:
        creer_notification(
            destinataire=nouveau_mentor,
            type=Notification.Type.MENTOR_AFFECTE,
            message=f"Vous avez été affecté en tant que mentor au projet « {projet.titre} ».",
            lien=f"/incubateur/projets/{projet.id}",
        )

    return journal


def tracer_validation_document(acteur: Any, doc: Any) -> JournalAudit:
    """Trace la validation d'un document et notifie le créateur."""
    journal = enregistrer_audit(
        acteur=acteur,
        action="validation_document",
        objet=f"Document #{doc.id} ({doc.titre})",
        avant={"statut": "brouillon"},
        apres={"statut": doc.statut},
    )

    destinataire = getattr(doc, "auteur", None) or getattr(doc, "cree_par", None) or (doc.projet.porteur if getattr(doc, "projet", None) else None)
    if destinataire:
        creer_notification(
            destinataire=destinataire,
            type=Notification.Type.DOCUMENT_VALIDE,
            message=f"Le document « {doc.titre} » a été validé.",
            lien=f"/documents/{doc.id}",
        )

    return journal


def tracer_publication_document(acteur: Any, doc: Any) -> JournalAudit:
    """Trace la publication d'un document et notifie le créateur."""
    journal = enregistrer_audit(
        acteur=acteur,
        action="publication_document",
        objet=f"Document #{doc.id} ({doc.titre})",
        avant={"statut": "valide"},
        apres={"statut": doc.statut},
    )

    destinataire = getattr(doc, "auteur", None) or getattr(doc, "cree_par", None) or (doc.projet.porteur if getattr(doc, "projet", None) else None)
    if destinataire:
        creer_notification(
            destinataire=destinataire,
            type=Notification.Type.DOCUMENT_PUBLIE,
            message=f"Le document « {doc.titre} » a été publié.",
            lien=f"/documents/{doc.id}",
        )

    return journal


def tracer_validation_fiche_galerie(acteur: Any, fiche: Any) -> JournalAudit:
    """Trace la validation d'une fiche de galerie et notifie le créateur."""
    journal = enregistrer_audit(
        acteur=acteur,
        action="validation_fiche_galerie",
        objet=f"Fiche #{fiche.id} ({fiche.titre})",
        avant={"statut": "en_validation"},
        apres={"statut": fiche.statut},
    )

    destinataire = getattr(fiche, "cree_par", None) or (fiche.projet.porteur if getattr(fiche, "projet", None) else None)
    if destinataire:
        creer_notification(
            destinataire=destinataire,
            type=Notification.Type.FICHE_VALIDEE,
            message=f"Votre fiche « {fiche.titre} » a été validée et publiée.",
            lien=f"/galerie/{fiche.slug}",
        )

    return journal


def tracer_refus_fiche_galerie(acteur: Any, fiche: Any) -> JournalAudit:
    """Trace le refus d'une fiche de galerie et notifie le créateur."""
    journal = enregistrer_audit(
        acteur=acteur,
        action="refus_fiche_galerie",
        objet=f"Fiche #{fiche.id} ({fiche.titre})",
        avant={"statut": "en_validation"},
        apres={"statut": fiche.statut},
    )

    destinataire = getattr(fiche, "cree_par", None) or (fiche.projet.porteur if getattr(fiche, "projet", None) else None)
    if destinataire:
        creer_notification(
            destinataire=destinataire,
            type=Notification.Type.FICHE_REFUSEE,
            message=f"Votre fiche « {fiche.titre} » a été refusée.",
            lien=f"/galerie/{fiche.slug}",
        )

    return journal


def tracer_changement_role(
    acteur: Any,
    user_cible: Any,
    role_avant: str,
    role_apres: str,
) -> JournalAudit:
    """Trace le changement de rôle d'un utilisateur."""
    journal = enregistrer_audit(
        acteur=acteur,
        action="changement_role_utilisateur",
        objet=f"Utilisateur #{user_cible.id} ({user_cible.email})",
        avant={"role": role_avant},
        apres={"role": role_apres},
    )
    return journal


def notifier_jalon_retard(jalon: Any, destinataire: Any) -> Notification | None:
    """Crée une notification de retard de jalon pour un porteur ou un mentor."""
    return creer_notification(
        destinataire=destinataire,
        type=Notification.Type.JALON_RETARD,
        message=f"Le jalon « {jalon.titre} » du projet {jalon.projet.titre} est en retard.",
        lien=f"/incubateur/projets/{jalon.projet_id}",
    )
