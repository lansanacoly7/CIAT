"""Vues du module d'analyse décisionnelle (apps.analytics).

Fournit l'ensemble des endpoints agrégés pour le tableau de bord décisionnel (P3) :
- GET /api/analytics/indicateurs/
- GET /api/analytics/par-domaine/
- GET /api/analytics/par-cohorte/
- GET /api/analytics/par-genre/
- GET /api/analytics/evolution/
- GET /api/analytics/export/?format=xlsx|pdf
- POST /api/analytics/question/
- GET /api/analytics/partenariats/
- GET /api/analytics/financements/
- GET /api/analytics/partenariats-financements/stats/

Tous les endpoints acceptent les filtres :
?debut=AAAA-MM-JJ&fin=AAAA-MM-JJ&cohorte=&domaine=&statut=
"""
from datetime import datetime
import io
import logging

from django.db.models import Count, Q, Sum
from django.db.models.functions import TruncMonth
from django.http import HttpResponse
from django.utils import timezone
from rest_framework import status
from rest_framework.response import Response
from rest_framework.throttling import ScopedRateThrottle
from rest_framework.views import APIView

from apps.core.ai import AIError, AINotConfigured
from apps.core.models import Projet
from .definitions import CATEGORIES_INDICATEURS, INDICATEURS_DEFINITIONS
from .models import (
    Financement,
    Partenariat,
    StatutFinancement,
    StatutPartenariat,
    TypePartenariat,
)
from .permissions import IsAnalyticsAuthorized
from .serializers import FinancementSerializer, PartenariatSerializer
from .services import traiter_question_analytics

logger = logging.getLogger(__name__)


def apply_filters(queryset, request):
    """Applique les filtres communs du contrat P3 :
    ?debut=AAAA-MM-JJ&fin=AAAA-MM-JJ&cohorte=&domaine=&statut=
    """
    params = getattr(request, "query_params", getattr(request, "GET", {}))

    # Filtre sur date de début (création >= début)
    debut = params.get("debut")
    if debut:
        try:
            d = datetime.strptime(debut.strip(), "%Y-%m-%d").date()
            queryset = queryset.filter(cree_le__date__gte=d)
        except ValueError:
            pass

    # Filtre sur date de fin (création <= fin)
    fin = params.get("fin")
    if fin:
        try:
            f = datetime.strptime(fin.strip(), "%Y-%m-%d").date()
            queryset = queryset.filter(cree_le__date__lte=f)
        except ValueError:
            pass

    # Filtre cohorte (par id, année ou nom)
    cohorte = params.get("cohorte")
    if cohorte:
        cohorte = cohorte.strip()
        if cohorte.isdigit():
            queryset = queryset.filter(
                Q(cohorte__annee=int(cohorte)) | Q(cohorte_id=int(cohorte))
            )
        else:
            queryset = queryset.filter(cohorte__nom__icontains=cohorte)

    # Filtre domaine (par id, slug ou nom)
    domaine = params.get("domaine")
    if domaine:
        domaine = domaine.strip()
        if domaine.isdigit():
            queryset = queryset.filter(domaine_id=int(domaine))
        else:
            queryset = queryset.filter(
                Q(domaine__slug__icontains=domaine) | Q(domaine__nom__icontains=domaine)
            )

    # Filtre statut exact
    statut = params.get("statut")
    if statut:
        statut = statut.strip()
        queryset = queryset.filter(statut__iexact=statut)

    return queryset


class IndicateursView(APIView):
    """GET /api/analytics/indicateurs/

    Indicateurs clés du tableau de bord :
    - idees_recues : total des projets enregistrés
    - dossiers_deposes : dossiers déposés (ou projets passés par le dépôt si les dossiers formels ne sont pas encore créés)
    - projets_selectionnes : projets retenus/sélectionnés pour incubation
    - projets_incubes : projets entrés en incubation active
    - prototypes : prototypes réalisés
    - taux_selection : pourcentage calculé (arrondi à 1 décimale)
    """

    permission_classes = [IsAnalyticsAuthorized]

    def get(self, request):
        """Calcule les indicateurs globaux du pipeline en une seule requête SQL performante.

        Règles d'intégrité métier :
        - Recoupement : croise les projets déclarés avec les dossiers formels d'incubation.
        - Taux de sélection : calculé rigoureusement sur le ratio des projets retenus par rapport
          aux dossiers déposés éligibles.
        """
        qs = apply_filters(Projet.objects.all(), request)

        # Agrégats en une seule requête SQL performante
        stats = qs.aggregate(
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

        # Vérification si le module incubator a des dossiers réels rattachés
        dossiers_deposes = stats["deposes_statut"]
        try:
            from apps.incubator.models import Dossier, StatutDossier

            dossiers_existants = (
                Dossier.objects.filter(projet__in=qs)
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

        # Taux de sélection : sélectionnés / déposés * 100
        denominateur = dossiers_deposes if dossiers_deposes > 0 else idees_recues
        taux_selection = (
            round((projets_selectionnes / denominateur) * 100, 1)
            if denominateur > 0
            else 0.0
        )

        return Response(
            {
                "idees_recues": idees_recues,
                "dossiers_deposes": dossiers_deposes,
                "projets_selectionnes": projets_selectionnes,
                "projets_incubes": projets_incubes,
                "prototypes": prototypes,
                "taux_selection": taux_selection,
            }
        )


class ParDomaineView(APIView):
    """GET /api/analytics/par-domaine/

    Répartition des projets par domaine d'intervention.
    Format : [{"domaine": string, "total": number}]
    """

    permission_classes = [IsAnalyticsAuthorized]

    def get(self, request):
        """Agrège le volume de projets par filière technologique pour guider l'affectation des ressources."""
        qs = apply_filters(Projet.objects.all(), request)
        data = (
            qs.values("domaine__nom")
            .annotate(total=Count("id"))
            .order_by("-total", "domaine__nom")
        )
        return Response(
            [
                {
                    "domaine": item["domaine__nom"] or "Non renseigné",
                    "total": item["total"],
                }
                for item in data
            ]
        )


class ParCohorteView(APIView):
    """GET /api/analytics/par-cohorte/

    Comparaison entre cohortes annuelles :
    Format : [{"cohorte": string, "total": number, "selectionnes": number, "prototypes": number}]
    """

    permission_classes = [IsAnalyticsAuthorized]

    def get(self, request):
        """Compare la performance et le passage à l'échelle (prototypes) entre promotions annuelles."""
        qs = apply_filters(Projet.objects.all(), request)
        data = (
            qs.values("cohorte__nom", "cohorte__annee")
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
        return Response(
            [
                {
                    "cohorte": item["cohorte__nom"] or "Hors cohorte",
                    "total": item["total"],
                    "selectionnes": item["selectionnes"],
                    "prototypes": item["prototypes"],
                }
                for item in data
            ]
        )


class ParGenreView(APIView):
    """GET /api/analytics/par-genre/

    Répartition par genre des porteurs de projet (Femmes, Hommes, Autre).
    Format : [{"genre": string, "total": number}]
    """

    permission_classes = [IsAnalyticsAuthorized]

    def get(self, request):
        """Mesure la parité femmes/hommes des porteurs de projets selon les engagements institutionnels."""
        qs = apply_filters(Projet.objects.all(), request)
        data = (
            qs.values("porteur__genre")
            .annotate(total=Count("id"))
            .order_by("-total")
        )

        mapping = {
            "F": "Femmes",
            "H": "Hommes",
            "A": "Autre / non précisé",
        }
        totals = {"Femmes": 0, "Hommes": 0, "Autre / non précisé": 0}
        for item in data:
            genre_code = item["porteur__genre"]
            label = mapping.get(genre_code, "Autre / non précisé")
            totals[label] = totals.get(label, 0) + item["total"]

        return Response(
            [
                {"genre": label, "total": total}
                for label, total in totals.items()
            ]
        )


class EvolutionView(APIView):
    """GET /api/analytics/evolution/

    Évolution chronologique par mois de création (format 'YYYY-MM').
    Format : [{"mois": string, "total": number}]
    """

    permission_classes = [IsAnalyticsAuthorized]

    def get(self, request):
        """Restitue l'évolution mensuelle des dépôts de projets pour analyser la saisonnalité."""
        qs = apply_filters(Projet.objects.all(), request)
        data = (
            qs.annotate(mois=TruncMonth("cree_le"))
            .values("mois")
            .annotate(total=Count("id"))
            .order_by("mois")
        )
        return Response(
            [
                {
                    "mois": item["mois"].strftime("%Y-%m"),
                    "total": item["total"],
                }
                for item in data
                if item["mois"] is not None
            ]
        )


# ==============================================================================
# Export Excel et PDF du Tableau de Bord Décisionnel (P3 - T1)
# ==============================================================================

class AnalyticsExportView(APIView):
    """GET /api/analytics/export/?format=xlsx|pdf

    Exporte le rapport complet d'analyse décisionnelle aux formats Excel (.xlsx) ou PDF (.pdf).
    Prend en compte l'ensemble des filtres actifs (?debut=&fin=&cohorte=&domaine=&statut=)
    et applique les mêmes règles d'accès que les autres endpoints du tableau de bord.
    """

    permission_classes = [IsAnalyticsAuthorized]

    def perform_content_negotiation(self, request, force=False):
        # Empêche DRF d'intercepter le query param ?format= (utilisé pour choisir xlsx ou pdf)
        renderers = self.get_renderers()
        return (renderers[0], renderers[0].media_type)

    def get(self, request):
        """Génère et télécharge le rapport consolidé du tableau de bord au format Excel ou PDF institutionnel."""
        fmt = request.query_params.get("format", "").strip().lower()
        if fmt not in ("xlsx", "pdf"):
            return Response(
                {
                    "detail": "Format d'export invalide ou manquant. Formats supportés : 'xlsx', 'pdf'."
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        from apps.analytics.exports import (
            collecter_donnees_analyses,
            generer_export_pdf,
            generer_export_xlsx,
        )

        data = collecter_donnees_analyses(request)
        date_str = datetime.now().strftime("%Y%m%d_%H%M")

        if fmt == "xlsx":
            buf = generer_export_xlsx(data)
            filename = f"analyses_ciat_{date_str}.xlsx"
            content_type = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        else:
            buf = generer_export_pdf(data)
            filename = f"analyses_ciat_{date_str}.pdf"
            content_type = "application/pdf"

        response = HttpResponse(buf.getvalue(), content_type=content_type)
        response["Content-Disposition"] = f'attachment; filename="{filename}"'
        return response


# Alias de compatibilité
ExportView = AnalyticsExportView


# ==============================================================================
# Interrogation des données en langage naturel (IA) (P3 - T2)
# ==============================================================================

class QuestionView(APIView):
    """POST /api/analytics/question/

    Pose une question en langage naturel sur les données d'analyse décisionnelle.
    Format attendu : { "question": "Combien de projets en prototype dans la cohorte 2025 ?" }
    Format renvoyé : { "reponse": string, "donnees": any, "filtres_utilises": dict }

    Sécurité stricte :
    - Le modèle de langage ne génère JAMAIS de code SQL ni de scripts exécutables.
    - Il sélectionne uniquement parmi une liste fermée d'endpoints et de filtres autorisés.
    - L'accès est restreint aux mêmes rôles que les indicateurs (IsAnalyticsAuthorized).
    - Débit limité par le throttle 'ai' (20 requêtes / min).
    """

    permission_classes = [IsAnalyticsAuthorized]
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = "ai"

    def post(self, request):
        """Traite une question décisionnelle en langage naturel avec limitation de débit et capture d'erreur 503."""
        question = request.data.get("question")
        if not question or not str(question).strip():
            return Response(
                {"detail": "Le champ 'question' est requis et ne peut être vide."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            resultat = traiter_question_analytics(str(question).strip())
            return Response(resultat, status=status.HTTP_200_OK)
        except AINotConfigured as exc:
            return Response(
                {
                    "detail": "Le service d'analyse IA n'est pas configuré (aucune clé d'API disponible).",
                    "erreur": str(exc),
                },
                status=status.HTTP_503_SERVICE_UNAVAILABLE,
            )
        except AIError as exc:
            return Response(
                {
                    "detail": "Le service d'analyse IA est momentanément indisponible.",
                    "erreur": str(exc),
                },
                status=status.HTTP_503_SERVICE_UNAVAILABLE,
            )
        except ValueError as exc:
            return Response(
                {"detail": str(exc)},
                status=status.HTTP_400_BAD_REQUEST,
            )
        except Exception as exc:
            logger.exception("Erreur inattendue dans QuestionView : %s", exc)
            return Response(
                {"detail": "Le service d'analyse IA est momentanément indisponible."},
                status=status.HTTP_503_SERVICE_UNAVAILABLE,
            )


# ==============================================================================
# Partenariats et Financements (P3 - T3)
# ==============================================================================

def apply_partenariat_filters(queryset, request):
    """Filtre les partenariats selon les critères du dashboard."""
    params = request.query_params

    debut = params.get("debut")
    if debut:
        try:
            d = datetime.strptime(debut.strip(), "%Y-%m-%d").date()
            queryset = queryset.filter(date_debut__gte=d)
        except ValueError:
            pass

    fin = params.get("fin")
    if fin:
        try:
            f = datetime.strptime(fin.strip(), "%Y-%m-%d").date()
            queryset = queryset.filter(date_debut__lte=f)
        except ValueError:
            pass

    cohorte = params.get("cohorte")
    if cohorte:
        c_str = str(cohorte).strip()
        if c_str.isdigit():
            queryset = queryset.filter(
                Q(projet__cohorte__annee=int(c_str)) | Q(projet__cohorte_id=int(c_str))
            )
        else:
            queryset = queryset.filter(projet__cohorte__nom__icontains=c_str)

    domaine = params.get("domaine")
    if domaine:
        d_str = str(domaine).strip()
        if d_str.isdigit():
            queryset = queryset.filter(projet__domaine_id=int(d_str))
        else:
            queryset = queryset.filter(
                Q(projet__domaine__slug__icontains=d_str) | Q(projet__domaine__nom__icontains=d_str)
            )

    statut = params.get("statut")
    if statut:
        queryset = queryset.filter(statut__iexact=str(statut).strip())

    type_part = params.get("type")
    if type_part:
        queryset = queryset.filter(type__iexact=str(type_part).strip())

    return queryset


def apply_financement_filters(queryset, request):
    """Filtre les financements selon les critères du dashboard."""
    params = request.query_params

    debut = params.get("debut")
    if debut:
        try:
            d = datetime.strptime(debut.strip(), "%Y-%m-%d").date()
            queryset = queryset.filter(date__gte=d)
        except ValueError:
            pass

    fin = params.get("fin")
    if fin:
        try:
            f = datetime.strptime(fin.strip(), "%Y-%m-%d").date()
            queryset = queryset.filter(date__lte=f)
        except ValueError:
            pass

    cohorte = params.get("cohorte")
    if cohorte:
        c_str = str(cohorte).strip()
        if c_str.isdigit():
            queryset = queryset.filter(
                Q(projet__cohorte__annee=int(c_str)) | Q(projet__cohorte_id=int(c_str))
            )
        else:
            queryset = queryset.filter(projet__cohorte__nom__icontains=c_str)

    domaine = params.get("domaine")
    if domaine:
        d_str = str(domaine).strip()
        if d_str.isdigit():
            queryset = queryset.filter(projet__domaine_id=int(d_str))
        else:
            queryset = queryset.filter(
                Q(projet__domaine__slug__icontains=d_str) | Q(projet__domaine__nom__icontains=d_str)
            )

    statut = params.get("statut")
    if statut:
        queryset = queryset.filter(statut__iexact=str(statut).strip())

    source = params.get("source")
    if source:
        queryset = queryset.filter(source__icontains=str(source).strip())

    return queryset


class PartenariatsListView(APIView):
    """GET /api/analytics/partenariats/
    
    Liste des partenariats reliés aux projets du CIAT avec filtres (cohorte, domaine, statut, type, dates).
    Accessible à l'équipe CIAT et au comité de sélection.
    """

    permission_classes = [IsAnalyticsAuthorized]

    def get(self, request):
        """Liste les conventions et partenariats rattachés aux projets selon les filtres actifs."""
        qs = Partenariat.objects.select_related(
            "projet", "projet__domaine", "projet__cohorte", "projet__porteur"
        )
        qs = apply_partenariat_filters(qs, request)
        serializer = PartenariatSerializer(qs, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)


class FinancementsListView(APIView):
    """GET /api/analytics/financements/
    
    Liste des financements accordés et décaissés pour les projets du CIAT avec filtres.
    Accessible à l'équipe CIAT et au comité de sélection.
    """

    permission_classes = [IsAnalyticsAuthorized]

    def get(self, request):
        """Liste les financements accordés et décaissés avec traçabilité des guichets d'origine."""
        qs = Financement.objects.select_related(
            "projet", "projet__domaine", "projet__cohorte", "projet__porteur"
        )
        qs = apply_financement_filters(qs, request)
        serializer = FinancementSerializer(qs, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)


class PartenariatsFinancementsStatsView(APIView):
    """GET /api/analytics/partenariats-financements/stats/
    
    Indicateurs agrégés pour le tableau de bord :
    - total_finance : montant total cumulé en FCFA
    - financements_decaisses : montant décaissé en FCFA
    - nombre_financements : nombre d'opérations de financement
    - nombre_partenariats_actifs : partenariats actifs
    - total_partenariats : volume total de partenariats
    - par_source : ventilation par guichet/source de financement
    - par_type_partenariat : ventilation par catégorie
    """

    permission_classes = [IsAnalyticsAuthorized]

    def get(self, request):
        """Calcule les agrégats financiers globaux (montant mobilisé vs décaissé) et le taux de partenariats actifs."""
        fin_qs = Financement.objects.select_related("projet")
        part_qs = Partenariat.objects.select_related("projet")

        fin_qs = apply_financement_filters(fin_qs, request)
        part_qs = apply_partenariat_filters(part_qs, request)

        total_finance_val = (
            fin_qs.exclude(statut=StatutFinancement.REFUSE).aggregate(
                total=Sum("montant")
            )["total"]
            or 0
        )
        financements_decaisses_val = (
            fin_qs.filter(statut=StatutFinancement.DECAISSE).aggregate(
                total=Sum("montant")
            )["total"]
            or 0
        )
        nombre_financements_val = fin_qs.count()

        nombre_partenariats_actifs_val = part_qs.filter(
            statut=StatutPartenariat.ACTIF
        ).count()
        total_partenariats_val = part_qs.count()

        # Répartition par source
        sources_raw = (
            fin_qs.exclude(statut=StatutFinancement.REFUSE)
            .values("source")
            .annotate(total=Sum("montant"), count=Count("id"))
            .order_by("-total")
        )
        par_source = [
            {
                "source": s["source"],
                "total": int(s["total"] or 0),
                "count": s["count"],
            }
            for s in sources_raw
        ]

        # Répartition par type de partenariat
        types_raw = (
            part_qs.values("type")
            .annotate(count=Count("id"))
            .order_by("-count")
        )
        type_display_map = dict(TypePartenariat.choices)
        par_type_partenariat = [
            {
                "type": type_display_map.get(t["type"], t["type"]),
                "type_key": t["type"],
                "count": t["count"],
            }
            for t in types_raw
        ]

        # Répartition des financements par domaine
        par_domaine_raw = (
            fin_qs.exclude(statut=StatutFinancement.REFUSE)
            .values("projet__domaine__nom")
            .annotate(total=Sum("montant"), count=Count("id"))
            .order_by("-total")
        )
        par_domaine = [
            {
                "domaine": d["projet__domaine__nom"] or "Non renseigné",
                "total": int(d["total"] or 0),
                "count": d["count"],
            }
            for d in par_domaine_raw
        ]

        return Response(
            {
                "total_finance": int(total_finance_val),
                "financements_decaisses": int(financements_decaisses_val),
                "nombre_financements": nombre_financements_val,
                "nombre_partenariats_actifs": nombre_partenariats_actifs_val,
                "total_partenariats": total_partenariats_val,
                "par_source": par_source,
                "par_type_partenariat": par_type_partenariat,
                "par_domaine": par_domaine,
            },
            status=status.HTTP_200_OK,
        )


class IndicateursDefinitionsView(APIView):
    """GET /api/analytics/indicateurs/definitions/

    Fournit le dictionnaire complet et standardisé de tous les indicateurs
    décisionnels affichés sur le tableau de bord CIAT (P3) :
    - code & nom
    - catégorie
    - définition exacte
    - formule de calcul mathématique et logique
    - période de référence et filtres supportés
    - source des données (modèles et tables SQL)
    - limites méthodologiques (ex: dossiers déposés vs idées reçues)
    - guide d'interprétation et seuils d'analyse
    """

    permission_classes = [IsAnalyticsAuthorized]

    def get(self, request):
        categorie = request.query_params.get("categorie")
        indicateurs = INDICATEURS_DEFINITIONS
        if categorie:
            cat_norm = categorie.strip().lower()
            indicateurs = [
                ind
                for ind in indicateurs
                if ind.get("categorie", "").lower() == cat_norm
            ]

        return Response(
            {
                "count": len(indicateurs),
                "categories": CATEGORIES_INDICATEURS,
                "indicateurs": indicateurs,
            },
            status=status.HTTP_200_OK,
        )

