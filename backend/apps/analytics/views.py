"""Vues du module d'analyse décisionnelle (apps.analytics).

Fournit les 5 endpoints agrégés pour le tableau de bord décisionnel (P3) :
- GET /api/analytics/indicateurs/
- GET /api/analytics/par-domaine/
- GET /api/analytics/par-cohorte/
- GET /api/analytics/par-genre/
- GET /api/analytics/evolution/

Tous les endpoints acceptent les filtres :
?debut=AAAA-MM-JJ&fin=AAAA-MM-JJ&cohorte=&domaine=&statut=
"""
from datetime import datetime
from django.db.models import Count, Q
from django.db.models.functions import TruncMonth
from django.http import HttpResponse
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.core.models import Projet
from .permissions import IsAnalyticsAuthorized


def apply_filters(queryset, request):
    """Applique les filtres communs du contrat P3 :
    ?debut=AAAA-MM-JJ&fin=AAAA-MM-JJ&cohorte=&domaine=&statut=
    """
    params = request.query_params

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

    Répartition des projets par domaine d'intervention du CIAT.
    Format : [{"domaine": string, "total": number}]
    """

    permission_classes = [IsAnalyticsAuthorized]

    def get(self, request):
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

    Comparaison des cohortes (total, sélectionnés, prototypes).
    Format : [{"cohorte": string, "total": number, "selectionnes": number, "prototypes": number}]
    """

    permission_classes = [IsAnalyticsAuthorized]

    def get(self, request):
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

    Répartition par genre des porteurs de projets.
    Format : [{"genre": string, "total": number}]
    """

    permission_classes = [IsAnalyticsAuthorized]

    def get(self, request):
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
# Phase 3 — T3 : Export Excel et PDF du Tableau de Bord Décisionnel
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
        fmt = request.query_params.get("format", "").strip().lower()
        if fmt not in ("xlsx", "pdf"):
            return Response(
                {
                    "detail": "Format d'export invalide ou manquant. Formats supportés : 'xlsx', 'pdf'."
                },
                status=400,
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
