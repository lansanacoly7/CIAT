"""Moteur de calcul déterministe des constats et recommandations (T2 - Phase 10).

Règles transparentes et vérifiables, calculées sans intelligence artificielle.
Chaque règle respecte un seuil de significativité statistique pour ne jamais
produire de statistiques trompeuses sur un échantillon trop réduit.
"""
from datetime import timedelta
from typing import Any, Dict, List

from django.db.models import Count, Q, Sum
from django.utils import timezone

from apps.core.models import Projet
from apps.incubator.models import Jalon, StatutJalon
from .models import Financement, StatutFinancement

# Seuils minimaux configurables pour garantir la significativité statistique
SEUILS_CONSTATS = {
    # Nombre minimal de projets pour évaluer la concentration par domaine
    "MIN_PROJETS_DOMAINE": 10,
    # Nombre minimal de porteurs pour calculer un ratio de genre
    "MIN_PORTEURS_GENRE": 10,
    # Nombre minimal de dossiers déposés pour calculer un taux de sélection
    "MIN_DOSSIERS_SELECTION": 10,
    # Nombre minimal de jalons suivis pour calculer un taux de retard critique
    "MIN_JALONS_SUIVIS": 5,
    # Nombre de jours de dépassement pour qualifier un retard de critique
    "RETARD_CRITIQUE_JOURS": 30,
    # Nombre minimal de lignes de financement pour calculer le taux de décaissement
    "MIN_FINANCEMENTS": 5,
}


def calculer_constat_domaine(qs) -> Dict[str, Any] | None:
    """Règle 1 : Concentration sectorielle (domaine majoritaire)."""
    total = qs.count()
    if total < SEUILS_CONSTATS["MIN_PROJETS_DOMAINE"]:
        return None

    top_domaine = (
        qs.filter(domaine__isnull=False)
        .values("domaine__nom")
        .annotate(total_dom=Count("id"))
        .order_by("-total_dom")
        .first()
    )
    if not top_domaine or top_domaine["total_dom"] == 0:
        return None

    nom = top_domaine["domaine__nom"]
    nb = top_domaine["total_dom"]
    pct = round((nb / total) * 100, 1)

    return {
        "id": "concentration_domaine",
        "titre": "Concentration sectorielle",
        "texte": f"Le domaine « {nom} » concentre {pct} % des projets ({nb} sur {total}).",
        "chiffres": {
            "domaine": nom,
            "nombre": nb,
            "total": total,
            "pourcentage": pct,
        },
        "regle": "Part du domaine le plus représenté sur l'ensemble des projets du périmètre (seuil min : 10 projets).",
        "limite": "Repose sur la déclaration initiale du porteur lors de la soumission ; données de démonstration.",
    }


def calculer_constat_genre(qs) -> Dict[str, Any] | None:
    """Règle 2 : Représentation féminine parmi les porteurs de projet."""
    porteurs_qs = qs.filter(porteur__isnull=False)
    total_porteurs = porteurs_qs.values("porteur_id").distinct().count()

    if total_porteurs < SEUILS_CONSTATS["MIN_PORTEURS_GENRE"]:
        return None

    femmes = (
        porteurs_qs.filter(porteur__genre="F")
        .values("porteur_id")
        .distinct()
        .count()
    )
    pct = round((femmes / total_porteurs) * 100, 1)

    return {
        "id": "parite_genre",
        "titre": "Représentation féminine",
        "texte": f"La part de femmes parmi les porteurs de projet est de {pct} % ({femmes} sur {total_porteurs}).",
        "chiffres": {
            "femmes": femmes,
            "total": total_porteurs,
            "pourcentage": pct,
        },
        "regle": "Proportion de porteurs principaux déclarés de genre féminin (seuil min : 10 porteurs).",
        "limite": "Mesure basée sur le genre déclaré du porteur principal, sans mesurer l'ensemble des équipes.",
    }


def calculer_constat_selection(qs) -> Dict[str, Any] | None:
    """Règle 3 : Taux de sélection de l'entonnoir d'incubation."""
    deposes = qs.filter(
        statut__in=[
            Projet.Statut.DEPOSE,
            Projet.Statut.SELECTIONNE,
            Projet.Statut.INCUBE,
            Projet.Statut.PROTOTYPE,
            Projet.Statut.TERMINE,
            Projet.Statut.REJETE,
        ]
    ).count()

    if deposes < SEUILS_CONSTATS["MIN_DOSSIERS_SELECTION"]:
        return None

    selectionnes = qs.filter(
        statut__in=[
            Projet.Statut.SELECTIONNE,
            Projet.Statut.INCUBE,
            Projet.Statut.PROTOTYPE,
            Projet.Statut.TERMINE,
        ]
    ).count()

    taux = round((selectionnes / deposes) * 100, 1)

    return {
        "id": "taux_selection",
        "titre": "Taux de sélection",
        "texte": f"Le taux de sélection est de {taux} % ({selectionnes} projets retenus sur {deposes} dossiers déposés).",
        "chiffres": {
            "selectionnes": selectionnes,
            "deposes": deposes,
            "taux": taux,
        },
        "regle": "Ratio entre les projets sélectionnés/incubés et le total des dossiers formellement soumis (seuil min : 10 dossiers).",
        "limite": "Exclut les candidatures à l'état de brouillon non soumises au comité.",
    }


def calculer_constat_jalons(qs) -> Dict[str, Any] | None:
    """Règle 4 : Jalons d'incubation en retard critique (> 30 jours)."""
    projet_ids = list(qs.values_list("id", flat=True))
    if not projet_ids:
        return None

    jalons_qs = Jalon.objects.filter(projet_id__in=projet_ids)
    total_jalons = jalons_qs.count()

    if total_jalons < SEUILS_CONSTATS["MIN_JALONS_SUIVIS"]:
        return None

    date_limite = timezone.now().date() - timedelta(days=SEUILS_CONSTATS["RETARD_CRITIQUE_JOURS"])
    retards_critiques = jalons_qs.filter(
        statut__in=[StatutJalon.A_FAIRE, StatutJalon.EN_COURS],
        echeance__lt=date_limite,
    ).count()

    pct = round((retards_critiques / total_jalons) * 100, 1)

    return {
        "id": "retard_jalons",
        "titre": "Jalons en retard critique",
        "texte": f"{retards_critiques} jalon(s) accusent un retard critique supérieur à 30 jours ({pct} % des {total_jalons} jalons suivis).",
        "chiffres": {
            "retards_critiques": retards_critiques,
            "total_jalons": total_jalons,
            "pourcentage": pct,
            "seuil_jours": SEUILS_CONSTATS["RETARD_CRITIQUE_JOURS"],
        },
        "regle": f"Nombre de jalons non terminés dont l'échéance prévisionnelle est dépassée de plus de {SEUILS_CONSTATS['RETARD_CRITIQUE_JOURS']} jours (seuil min : 5 jalons).",
        "limite": "Repose sur l'actualisation des jalons par les mentors dans le module d'accompagnement.",
    }


def calculer_constat_financements(qs) -> Dict[str, Any] | None:
    """Règle 5 : Taux de décaissement effectif des financements."""
    projet_ids = list(qs.values_list("id", flat=True))
    if not projet_ids:
        return None

    financements_qs = Financement.objects.filter(
        projet_id__in=projet_ids
    ).exclude(statut=StatutFinancement.REFUSE)

    total_financements = financements_qs.count()
    if total_financements < SEUILS_CONSTATS["MIN_FINANCEMENTS"]:
        return None

    aggr = financements_qs.aggregate(
        engage=Sum("montant"),
        decaisse=Sum(
            "montant",
            filter=Q(statut=StatutFinancement.DECAISSE)
        ),
    )
    engage = aggr["engage"] or 0
    decaisse = aggr["decaisse"] or 0

    if engage <= 0:
        return None

    taux = round((decaisse / engage) * 100, 1)

    return {
        "id": "decaissement_financements",
        "titre": "Décaissement des fonds",
        "texte": f"{taux} % des fonds mobilisés ont été effectivement décaissés ({decaisse:,.0f} FCFA décaissés sur {engage:,.0f} FCFA engagés).",
        "chiffres": {
            "montant_engage": float(engage),
            "montant_decaisse": float(decaisse),
            "taux": taux,
            "nombre_financements": total_financements,
        },
        "regle": "Proportion des fonds décaissés par rapport aux engagements accordés (seuil min : 5 financements).",
        "limite": "Basé sur les avis d'opération et décaissements bancaires validés.",
    }


def calculer_constats(queryset) -> List[Dict[str, Any]]:
    """Génère la liste ordonnée des constats répondant aux critères de significativité.

    Renvoie entre 0 et 5 constats (idéalement 3 à 5 sur données représentatives).
    Ne renvoie JAMAIS de constat si l'échantillon ne satisfait pas le seuil minimal.
    """
    generateurs = [
        calculer_constat_domaine,
        calculer_constat_genre,
        calculer_constat_selection,
        calculer_constat_jalons,
        calculer_constat_financements,
    ]

    constats = []
    for gen in generateurs:
        constat = gen(queryset)
        if constat is not None:
            constats.append(constat)

    return constats

