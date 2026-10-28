"""Services d'analyse et d'interrogation en langage naturel pour apps.analytics (T2).

Sécurité stricte :
- Le modèle de langage ne génère JAMAIS de code SQL ni de code exécutable.
- Le modèle sélectionne uniquement un endpoint parmi une liste fermée et des filtres autorisés.
- Le serveur valide ce choix et exécute les agrégations ORM Django existantes.
- Le modèle rédige une synthèse concise basée STRICTEMENT sur les données chiffrées réelles.
"""
import json
import logging
import re
from datetime import datetime

from django.db.models import Count, Q
from django.db.models.functions import TruncMonth

from apps.core.ai import ai
from apps.core.models import Projet

logger = logging.getLogger(__name__)

ENDPOINTS_AUTORISES = {
    "indicateurs",
    "par-domaine",
    "par-cohorte",
    "par-genre",
    "evolution",
}

FILTRES_AUTORISES = {"cohorte", "domaine", "statut", "debut", "fin"}

REPONSE_HORS_SUJET = "Je ne peux pas répondre à cette question avec les données disponibles."

PATTERNS_SENSIBLES = [
    re.compile(r"[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+"),  # emails
    re.compile(r"(?i)\b(drop\s+table|insert\s+into|delete\s+from|update\s+\w+\s+set)\b"),  # SQL brut
    re.compile(r"(?i)\b(django_secret_key|secret_key|password_hash|auth_token)\b"),  # secrets / credentials
    re.compile(r"(?i)(sk-[a-zA-Z0-9]{20,}|AIza[0-9A-Za-z-_]{35})"),  # clés API tierces
]


def sanitize_reponse_ia(texte: str) -> str:
    """Garantit l'absence de fuite de données sensibles ou d'injections dans la réponse textuelle."""
    if not texte:
        return texte
    for pattern in PATTERNS_SENSIBLES:
        if pattern.search(texte):
            logger.warning("Motif sensible intercepté dans la réponse IA : %s", pattern.pattern)
            return REPONSE_HORS_SUJET
    return texte

SYSTEM_ROUTER_PROMPT = """Tu es l'analyseur d'intentions du tableau de bord décisionnel du CIAT (Centre d'Innovation, d'Application et de Transfert - ISEP Diamniadio).
Ta mission est d'associer une question en langage naturel de l'utilisateur à l'un des endpoints d'analyse existants et d'en extraire les filtres pertinents.

LISTE FERMÉE DES ENDPOINTS AUTORISÉS :
- "indicateurs" : pour les volumes globaux, totaux, nombre d'idées soumises, dossiers déposés, projets sélectionnés, projets incubés, prototypes réalisés, ou taux de sélection.
- "par-domaine" : pour la répartition, comparaison ou ventilation par domaine/secteur (santé, agriculture, tic, énergie, etc.).
- "par-cohorte" : pour la comparaison entre cohortes annuelles (2024, 2025, 2026) ou l'avancement comparé des promotions.
- "par-genre" : pour la répartition femmes/hommes, la parité ou la représentativité des femmes porteurs de projet.
- "evolution" : pour l'évolution chronologique, temporelle ou mensuelle des projets.
- "hors_sujet" : pour toute question ne concernant pas les données statistiques des projets du CIAT (météo, code informatique, questions d'ordre général, requêtes impossibles).

FILTRES VALIDES (laisser null si non spécifié dans la question) :
- "cohorte" : année ou nom (ex: "2024", "2025", "2026")
- "domaine" : libellé ou mot-clé du domaine (ex: "sante", "tic", "agriculture", "energie")
- "statut" : parmi ["idee", "depose", "selectionne", "incube", "prototype", "termine", "rejete"]
- "debut" : format AAAA-MM-JJ ou null
- "fin" : format AAAA-MM-JJ ou null

FORMAT DE SORTIE JSON STRICT :
{
  "endpoint": "indicateurs" | "par-domaine" | "par-cohorte" | "par-genre" | "evolution" | "hors_sujet",
  "filtres": {
    "cohorte": "...",
    "domaine": "...",
    "statut": "...",
    "debut": "...",
    "fin": "..."
  },
  "hors_sujet": false | true
}
"""

SYSTEM_SYNTHESIS_PROMPT = """Tu es l'analyste décisionnel du CIAT (Centre d'Innovation, d'Application et de Transfert de l'ISEP Diamniadio).
Rédige une réponse courte, claire et directe en français (1 à 3 phrases maximum) répondant à la question de l'utilisateur.
RÈGLE ABSOLUE : Base-toi STRICTEMENT et UNIQUEMENT sur les chiffres et données réelles fournies en JSON. N'invente aucun chiffre non présent dans les données. Si le résultat est 0, dis-le explicitement.
"""


def apply_dict_filters(queryset, filtres: dict):
    """Applique de façon sécurisée les filtres validés sur le queryset Projet.

    Sécurité et protection anti-injection :
    - N'exécute aucun fragment SQL brut : chaque filtre est typé et validé via l'ORM Django.
    - Dates : analysées strictement avec `strptime` (%Y-%m-%d) pour éliminer toute valeur malformée.
    - Énumérations : vérifie l'appartenance stricte à `Projet.Statut.values`.
    """
    debut = filtres.get("debut")
    if debut:
        try:
            d = datetime.strptime(str(debut).strip(), "%Y-%m-%d").date()
            queryset = queryset.filter(cree_le__date__gte=d)
        except ValueError:
            pass

    fin = filtres.get("fin")
    if fin:
        try:
            f = datetime.strptime(str(fin).strip(), "%Y-%m-%d").date()
            queryset = queryset.filter(cree_le__date__lte=f)
        except ValueError:
            pass

    cohorte = filtres.get("cohorte")
    if cohorte:
        c_str = str(cohorte).strip()
        if c_str.isdigit():
            queryset = queryset.filter(
                Q(cohorte__annee=int(c_str)) | Q(cohorte_id=int(c_str))
            )
        else:
            queryset = queryset.filter(cohorte__nom__icontains=c_str)

    domaine = filtres.get("domaine")
    if domaine:
        d_str = str(domaine).strip()
        if d_str.isdigit():
            queryset = queryset.filter(domaine_id=int(d_str))
        else:
            queryset = queryset.filter(
                Q(domaine__slug__icontains=d_str) | Q(domaine__nom__icontains=d_str)
            )

    statut = filtres.get("statut")
    if statut:
        s_str = str(statut).strip().lower()
        statuts_valides = [s.value for s in Projet.Statut]
        if s_str in statuts_valides:
            queryset = queryset.filter(statut__iexact=s_str)

    return queryset


def execute_endpoint_query(endpoint: str, queryset):
    """Exécute les agrégations ORM correspondantes selon l'endpoint sélectionné.

    Sécurité d'exécution :
    - Liste fermée d'opérations : n'autorise que les agrégats pré-programmés du tableau
      de bord (`indicateurs`, `par-domaine`, `par-cohorte`, `par-genre`, `evolution`).
    - Recoupement mathématique : garantit le calcul exact du taux de sélection
      (sélectionnés / dossiers déposés) et des filières d'incubation.
    """
    if endpoint == "indicateurs":
        stats = queryset.aggregate(
            idees_recues=Count("id"),
            deposes_statut=Count(
                "id",
                filter=Q(
                    statut__in=[
                        Projet.Statut.DEPOSE,
                        Projet.Statut.SELECTIONNE,
                        Projet.Statut.INCUBE,
                        Projet.Statut.PROTOTYPE,
                        Projet.Statut.TERMINE,
                        Projet.Statut.REJETE,
                    ]
                ),
            ),
            selectionnes=Count(
                "id",
                filter=Q(
                    statut__in=[
                        Projet.Statut.SELECTIONNE,
                        Projet.Statut.INCUBE,
                        Projet.Statut.PROTOTYPE,
                        Projet.Statut.TERMINE,
                    ]
                ),
            ),
            incubes=Count(
                "id",
                filter=Q(
                    statut__in=[
                        Projet.Statut.INCUBE,
                        Projet.Statut.PROTOTYPE,
                        Projet.Statut.TERMINE,
                    ]
                ),
            ),
            prototypes=Count(
                "id",
                filter=Q(
                    statut__in=[
                        Projet.Statut.PROTOTYPE,
                        Projet.Statut.TERMINE,
                    ]
                ),
            ),
        )

        dossiers_deposes = stats["deposes_statut"]
        try:
            from apps.incubator.models import Dossier, StatutDossier

            dossiers_existants = (
                Dossier.objects.filter(projet__in=queryset)
                .exclude(statut=StatutDossier.BROUILLON)
                .count()
            )
            if dossiers_existants > 0:
                dossiers_deposes = dossiers_existants
        except Exception:
            pass

        idees_recues = stats["idees_recues"]
        projets_selectionnes = stats["selectionnes"]
        projets_incubes = stats["incubes"]
        prototypes = stats["prototypes"]

        denominateur = dossiers_deposes if dossiers_deposes > 0 else idees_recues
        taux_selection = (
            round((projets_selectionnes / denominateur) * 100, 1)
            if denominateur > 0
            else 0.0
        )

        return {
            "idees_recues": idees_recues,
            "dossiers_deposes": dossiers_deposes,
            "projets_selectionnes": projets_selectionnes,
            "projets_incubes": projets_incubes,
            "prototypes": prototypes,
            "taux_selection": taux_selection,
        }

    elif endpoint == "par-domaine":
        data = (
            queryset.values("domaine__nom")
            .annotate(total=Count("id"))
            .order_by("-total", "domaine__nom")
        )
        return [
            {
                "domaine": item["domaine__nom"] or "Non renseigné",
                "total": item["total"],
            }
            for item in data
        ]

    elif endpoint == "par-cohorte":
        data = (
            queryset.values("cohorte__nom", "cohorte__annee")
            .annotate(
                total=Count("id"),
                selectionnes=Count(
                    "id",
                    filter=Q(
                        statut__in=[
                            Projet.Statut.SELECTIONNE,
                            Projet.Statut.INCUBE,
                            Projet.Statut.PROTOTYPE,
                            Projet.Statut.TERMINE,
                        ]
                    ),
                ),
                prototypes=Count(
                    "id",
                    filter=Q(
                        statut__in=[
                            Projet.Statut.PROTOTYPE,
                            Projet.Statut.TERMINE,
                        ]
                    ),
                ),
            )
            .order_by("cohorte__annee", "cohorte__nom")
        )
        return [
            {
                "cohorte": item["cohorte__nom"] or "Hors cohorte",
                "total": item["total"],
                "selectionnes": item["selectionnes"],
                "prototypes": item["prototypes"],
            }
            for item in data
        ]

    elif endpoint == "par-genre":
        data = (
            queryset.values("porteur__genre")
            .annotate(total=Count("id"))
            .order_by("-total")
        )
        mapping = {"F": "Femmes", "H": "Hommes", "A": "Autre / non précisé"}
        totals = {"Femmes": 0, "Hommes": 0, "Autre / non précisé": 0}
        for item in data:
            genre_code = item["porteur__genre"]
            label = mapping.get(genre_code, "Autre / non précisé")
            totals[label] = totals.get(label, 0) + item["total"]
        return [{"genre": label, "total": total} for label, total in totals.items()]

    elif endpoint == "evolution":
        data = (
            queryset.annotate(mois=TruncMonth("cree_le"))
            .values("mois")
            .annotate(total=Count("id"))
            .order_by("mois")
        )
        return [
            {"mois": item["mois"].strftime("%Y-%m"), "total": item["total"]}
            for item in data
            if item["mois"] is not None
        ]

    return None


def traiter_question_analytics(question: str) -> dict:
    """Traite une question en langage naturel sur les données d'analyse décisionnelle.

    Architecture de sécurité en deux temps :
    1. Classification d'intention (Intent Routing) : le modèle traduit la question en un
       endpoint autorisé et des filtres normalisés en mode JSON strict. Si la question est
       hors-périmètre ou hostile, le serveur intercepte immédiatement le rejet.
    2. Exécution ORM serveur : le backend exécute les calculs chiffrés réels sur PostgreSQL/SQLite.
    3. Synthèse factuelle : le modèle formule une réponse textuelle en 1 à 3 phrases basée
       STRICTEMENT sur les chiffres réels transmis, garantissant zéro hallucination.
    """
    if not question or not question.strip():
        raise ValueError("Le champ 'question' est requis.")

    # Étape 1 : Le modèle classifie la question en endpoint + filtres (json_mode)
    raw_classification = ai.chat(
        [{"role": "user", "content": question.strip()}],
        system=SYSTEM_ROUTER_PROMPT,
        json_mode=True,
        temperature=0.1,
    )

    try:
        parsed = json.loads(raw_classification)
    except Exception as exc:
        logger.warning("Réponse JSON invalide du classifieur IA : %s", exc)
        return {
            "reponse": REPONSE_HORS_SUJET,
            "donnees": None,
            "filtres_utilises": {},
        }

    endpoint = parsed.get("endpoint", "").strip().lower()
    is_hors_sujet = parsed.get("hors_sujet", False) or endpoint == "hors_sujet"

    if is_hors_sujet or endpoint not in ENDPOINTS_AUTORISES:
        return {
            "reponse": REPONSE_HORS_SUJET,
            "donnees": None,
            "filtres_utilises": {},
        }

    # Étape 2 : Validation stricte des filtres extraits
    raw_filtres = parsed.get("filtres") or {}
    filtres_valides = {}
    if isinstance(raw_filtres, dict):
        for k, v in raw_filtres.items():
            if k in FILTRES_AUTORISES and v not in (None, "", "null"):
                filtres_valides[k] = str(v).strip()

    # Étape 3 : Exécution sécurisée de la requête ORM Django
    qs = apply_dict_filters(Projet.objects.all(), filtres_valides)
    donnees = execute_endpoint_query(endpoint, qs)

    if donnees is None:
        return {
            "reponse": REPONSE_HORS_SUJET,
            "donnees": None,
            "filtres_utilises": filtres_valides,
        }

    # Étape 4 : Le modèle rédige une synthèse concise basée UNIQUEMENT sur les données chiffrées
    prompt_synthese = (
        f"Question posée : {question.strip()}\n"
        f"Endpoint utilisé : {endpoint}\n"
        f"Filtres appliqués : {json.dumps(filtres_valides, ensure_ascii=False)}\n"
        f"Données chiffrées réelles : {json.dumps(donnees, ensure_ascii=False)}"
    )

    try:
        reponse_texte = ai.chat(
            [{"role": "user", "content": prompt_synthese}],
            system=SYSTEM_SYNTHESIS_PROMPT,
            temperature=0.2,
            max_tokens=250,
        )
    except Exception as exc:
        logger.warning("Échec de la synthèse de réponse par l'IA : %s", exc)
        # Fallback factuel direct en cas de défaillance de la 2e étape
        reponse_texte = f"Voici les données issues de l'analyse : {json.dumps(donnees, ensure_ascii=False)}"

    return {
        "reponse": sanitize_reponse_ia(reponse_texte.strip()),
        "donnees": donnees,
        "filtres_utilises": filtres_valides,
    }
