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
import io
from datetime import datetime
from django.db.models import Count, Q
from django.db.models.functions import TruncMonth
from django.http import HttpResponse
from django.utils import timezone
from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView

import openpyxl
from openpyxl.styles import Alignment, Border, Font, PatternFill, Side
from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.platypus import (
    HRFlowable,
    KeepTogether,
    Paragraph,
    SimpleDocTemplate,
    Spacer,
    Table,
    TableStyle,
)

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


def get_analytics_summary_data(qs, request=None):
    """Calcule l'ensemble des données d'analyse pour un queryset de projets donné."""
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

    indicateurs = {
        "idees_recues": idees_recues,
        "dossiers_deposes": dossiers_deposes,
        "projets_selectionnes": projets_selectionnes,
        "projets_incubes": projets_incubes,
        "prototypes": prototypes,
        "taux_selection": taux_selection,
    }

    # Répartition par domaine
    domaines_raw = (
        qs.values("domaine__nom")
        .annotate(total=Count("id"))
        .order_by("-total", "domaine__nom")
    )
    par_domaine = [
        {
            "domaine": item["domaine__nom"] or "Non renseigné",
            "total": item["total"],
            "pourcentage": (
                round((item["total"] / idees_recues) * 100, 1)
                if idees_recues > 0
                else 0.0
            ),
        }
        for item in domaines_raw
    ]

    # Comparatif par cohorte
    cohortes_raw = (
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
    par_cohorte = [
        {
            "cohorte": item["cohorte__nom"] or "Hors cohorte",
            "annee": item["cohorte__annee"] or "-",
            "total": item["total"],
            "selectionnes": item["selectionnes"],
            "prototypes": item["prototypes"],
            "taux_selection": (
                round((item["selectionnes"] / item["total"]) * 100, 1)
                if item["total"] > 0
                else 0.0
            ),
        }
        for item in cohortes_raw
    ]

    # Répartition par genre
    genres_raw = (
        qs.values("porteur__genre").annotate(total=Count("id")).order_by("-total")
    )
    mapping_genre = {
        "F": "Femmes",
        "H": "Hommes",
        "A": "Autre / non précisé",
    }
    totals_genre = {"Femmes": 0, "Hommes": 0, "Autre / non précisé": 0}
    for item in genres_raw:
        genre_code = item["porteur__genre"]
        label = mapping_genre.get(genre_code, "Autre / non précisé")
        totals_genre[label] = totals_genre.get(label, 0) + item["total"]

    total_genre_count = sum(totals_genre.values())
    par_genre = [
        {
            "genre": label,
            "total": count,
            "pourcentage": (
                round((count / total_genre_count) * 100, 1)
                if total_genre_count > 0
                else 0.0
            ),
        }
        for label, count in totals_genre.items()
    ]

    # Jalons et retards
    retards = []
    try:
        from apps.incubator.models import Jalon, StatutJalon

        now_date = timezone.now().date()
        jalons_qs = (
            Jalon.objects.filter(
                projet__in=qs,
                echeance__lt=now_date,
            )
            .exclude(statut=StatutJalon.FAIT)
            .select_related("projet", "projet__domaine", "projet__cohorte")
            .order_by("echeance")
        )
        for j in jalons_qs:
            retards.append(
                {
                    "projet": j.projet.titre,
                    "jalon": j.titre,
                    "echeance": j.echeance.strftime("%d/%m/%Y"),
                    "statut": (
                        j.get_statut_display()
                        if hasattr(j, "get_statut_display")
                        else j.statut
                    ),
                    "cohorte": (
                        j.projet.cohorte.nom
                        if j.projet.cohorte
                        else "Hors cohorte"
                    ),
                    "domaine": (
                        j.projet.domaine.nom
                        if j.projet.domaine
                        else "Non renseigné"
                    ),
                }
            )
    except Exception:
        pass

    return {
        "indicateurs": indicateurs,
        "par_domaine": par_domaine,
        "par_cohorte": par_cohorte,
        "par_genre": par_genre,
        "retards": retards,
    }


def generate_excel_response(summary_data, filter_label="Tous les projets"):
    """Génère le classeur Excel (.xlsx) stylisé aux couleurs du CIAT."""
    wb = openpyxl.Workbook()
    ws_main = wb.active
    ws_main.title = "Synthèse Globale"

    font_title = Font(name="Calibri", size=15, bold=True, color="612D10")
    font_sub = Font(name="Calibri", size=10, italic=True, color="555555")
    font_header = Font(name="Calibri", size=11, bold=True, color="FFFFFF")
    font_bold = Font(name="Calibri", size=11, bold=True, color="24140D")
    font_regular = Font(name="Calibri", size=11, color="24140D")

    fill_header = PatternFill(
        start_color="612D10", end_color="612D10", fill_type="solid"
    )
    fill_zebra = PatternFill(
        start_color="FAF6F0", end_color="FAF6F0", fill_type="solid"
    )

    thin_border = Border(
        left=Side(style="thin", color="CCCCCC"),
        right=Side(style="thin", color="CCCCCC"),
        top=Side(style="thin", color="CCCCCC"),
        bottom=Side(style="thin", color="CCCCCC"),
    )

    # Feuille 1 : Synthèse & Indicateurs
    ws_main.append(["CENTRE D'INNOVATION, D'APPLICATION ET DE TRANSFERT (CIAT)"])
    ws_main["A1"].font = font_title
    ws_main.append(["Tableau de Bord Décisionnel — Synthèse Analytique"])
    ws_main["A2"].font = Font(name="Calibri", size=12, bold=True, color="B85D19")
    ws_main.append(
        [
            f"Filtres actifs : {filter_label} | Date d'export : {timezone.now().strftime('%d/%m/%Y %H:%M')}"
        ]
    )
    ws_main["A3"].font = font_sub
    ws_main.append([])

    ws_main.append(["Indicateur Clé", "Valeur"])
    row_idx = 5
    for col_letter in ["A", "B"]:
        cell = ws_main[f"{col_letter}{row_idx}"]
        cell.font = font_header
        cell.fill = fill_header
        cell.border = thin_border
        cell.alignment = Alignment(
            horizontal="center" if col_letter == "B" else "left",
            vertical="center",
        )

    ind = summary_data["indicateurs"]
    rows_ind = [
        ("Idées de projets reçues", ind["idees_recues"]),
        ("Dossiers de candidature déposés", ind["dossiers_deposes"]),
        ("Projets sélectionnés par le comité", ind["projets_selectionnes"]),
        ("Projets entrés en incubation active", ind["projets_incubes"]),
        ("Prototypes réalisés et validés", ind["prototypes"]),
        ("Taux global de sélection", f"{ind['taux_selection']} %"),
    ]
    for label, val in rows_ind:
        row_idx += 1
        ws_main.append([label, val])
        ws_main[f"A{row_idx}"].font = font_regular
        ws_main[f"B{row_idx}"].font = font_bold
        ws_main[f"A{row_idx}"].border = thin_border
        ws_main[f"B{row_idx}"].border = thin_border
        ws_main[f"B{row_idx}"].alignment = Alignment(horizontal="center")

    ws_main.column_dimensions["A"].width = 40
    ws_main.column_dimensions["B"].width = 20

    # Feuille 2 : Par Domaine
    ws_dom = wb.create_sheet(title="Par Domaine")
    ws_dom.append(["Domaine d'intervention", "Nombre de projets", "Part (%)"])
    for col_letter in ["A", "B", "C"]:
        cell = ws_dom[f"{col_letter}1"]
        cell.font = font_header
        cell.fill = fill_header
        cell.border = thin_border
        cell.alignment = Alignment(
            horizontal="center" if col_letter != "A" else "left"
        )

    for i, item in enumerate(summary_data["par_domaine"], start=2):
        ws_dom.append(
            [item["domaine"], item["total"], f"{item['pourcentage']} %"]
        )
        for col_letter in ["A", "B", "C"]:
            c = ws_dom[f"{col_letter}{i}"]
            c.font = font_regular
            c.border = thin_border
            if i % 2 == 1:
                c.fill = fill_zebra
            if col_letter in ("B", "C"):
                c.alignment = Alignment(horizontal="center")
    ws_dom.column_dimensions["A"].width = 35
    ws_dom.column_dimensions["B"].width = 20
    ws_dom.column_dimensions["C"].width = 15

    # Feuille 3 : Par Cohorte
    ws_coh = wb.create_sheet(title="Par Cohorte")
    ws_coh.append(
        [
            "Cohorte",
            "Année",
            "Total Projets",
            "Sélectionnés",
            "Prototypes",
            "Taux de sélection",
        ]
    )
    for col_letter in ["A", "B", "C", "D", "E", "F"]:
        cell = ws_coh[f"{col_letter}1"]
        cell.font = font_header
        cell.fill = fill_header
        cell.border = thin_border
        cell.alignment = Alignment(
            horizontal="center" if col_letter != "A" else "left"
        )

    for i, item in enumerate(summary_data["par_cohorte"], start=2):
        ws_coh.append(
            [
                item["cohorte"],
                item["annee"],
                item["total"],
                item["selectionnes"],
                item["prototypes"],
                f"{item['taux_selection']} %",
            ]
        )
        for col_letter in ["A", "B", "C", "D", "E", "F"]:
            c = ws_coh[f"{col_letter}{i}"]
            c.font = font_regular
            c.border = thin_border
            if i % 2 == 1:
                c.fill = fill_zebra
            if col_letter != "A":
                c.alignment = Alignment(horizontal="center")
    ws_coh.column_dimensions["A"].width = 30
    ws_coh.column_dimensions["B"].width = 12
    ws_coh.column_dimensions["C"].width = 15
    ws_coh.column_dimensions["D"].width = 15
    ws_coh.column_dimensions["E"].width = 15
    ws_coh.column_dimensions["F"].width = 20

    # Feuille 4 : Par Genre
    ws_gen = wb.create_sheet(title="Par Genre")
    ws_gen.append(["Genre", "Nombre de porteurs", "Part (%)"])
    for col_letter in ["A", "B", "C"]:
        cell = ws_gen[f"{col_letter}1"]
        cell.font = font_header
        cell.fill = fill_header
        cell.border = thin_border
        cell.alignment = Alignment(
            horizontal="center" if col_letter != "A" else "left"
        )

    for i, item in enumerate(summary_data["par_genre"], start=2):
        ws_gen.append([item["genre"], item["total"], f"{item['pourcentage']} %"])
        for col_letter in ["A", "B", "C"]:
            c = ws_gen[f"{col_letter}{i}"]
            c.font = font_regular
            c.border = thin_border
            if i % 2 == 1:
                c.fill = fill_zebra
            if col_letter != "A":
                c.alignment = Alignment(horizontal="center")
    ws_gen.column_dimensions["A"].width = 25
    ws_gen.column_dimensions["B"].width = 20
    ws_gen.column_dimensions["C"].width = 15

    # Feuille 5 : Jalons et Retards
    ws_ret = wb.create_sheet(title="Retards & Jalons")
    ws_ret.append(
        ["Projet", "Jalon", "Échéance", "Statut", "Cohorte", "Domaine"]
    )
    for col_letter in ["A", "B", "C", "D", "E", "F"]:
        cell = ws_ret[f"{col_letter}1"]
        cell.font = font_header
        cell.fill = fill_header
        cell.border = thin_border
        cell.alignment = Alignment(
            horizontal="center" if col_letter in ("C", "D") else "left"
        )

    for i, item in enumerate(summary_data["retards"], start=2):
        ws_ret.append(
            [
                item["projet"],
                item["jalon"],
                item["echeance"],
                item["statut"],
                item["cohorte"],
                item["domaine"],
            ]
        )
        for col_letter in ["A", "B", "C", "D", "E", "F"]:
            c = ws_ret[f"{col_letter}{i}"]
            c.font = font_regular
            c.border = thin_border
            if i % 2 == 1:
                c.fill = fill_zebra
            if col_letter in ("C", "D"):
                c.alignment = Alignment(horizontal="center")
    ws_ret.column_dimensions["A"].width = 30
    ws_ret.column_dimensions["B"].width = 30
    ws_ret.column_dimensions["C"].width = 14
    ws_ret.column_dimensions["D"].width = 15
    ws_ret.column_dimensions["E"].width = 20
    ws_ret.column_dimensions["F"].width = 25

    stream = io.BytesIO()
    wb.save(stream)
    stream.seek(0)

    response = HttpResponse(
        stream.getvalue(),
        content_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    )
    timestamp = timezone.now().strftime("%Y%m%d_%H%M")
    response["Content-Disposition"] = (
        f'attachment; filename="ciat_synthese_analytics_{timestamp}.xlsx"'
    )
    return response


def generate_pdf_response(summary_data, filter_label="Tous les projets"):
    """Génère le document PDF structuré selon la charte graphique du CIAT."""
    stream = io.BytesIO()
    doc = SimpleDocTemplate(
        stream,
        pagesize=A4,
        leftMargin=36,
        rightMargin=36,
        topMargin=36,
        bottomMargin=36,
    )

    styles = getSampleStyleSheet()
    ciat_brown = colors.HexColor("#612D10")
    ciat_accent = colors.HexColor("#B85D19")
    ciat_dark = colors.HexColor("#24140D")
    ciat_bg_light = colors.HexColor("#FAF6F0")
    ciat_beige = colors.HexColor("#F5EDE4")
    ciat_line = colors.HexColor("#D8C8B8")

    title_style = ParagraphStyle(
        "CIATTitle",
        parent=styles["Heading1"],
        fontName="Helvetica-Bold",
        fontSize=14,
        leading=17,
        textColor=ciat_brown,
        alignment=0,
    )
    subtitle_style = ParagraphStyle(
        "CIATSubtitle",
        parent=styles["Normal"],
        fontName="Helvetica-Bold",
        fontSize=9.5,
        leading=12,
        textColor=ciat_accent,
    )
    meta_style = ParagraphStyle(
        "CIATMeta",
        parent=styles["Normal"],
        fontName="Helvetica",
        fontSize=8,
        leading=11,
        textColor=colors.HexColor("#666666"),
    )
    section_title_style = ParagraphStyle(
        "CIATSectionTitle",
        parent=styles["Heading2"],
        fontName="Helvetica-Bold",
        fontSize=10.5,
        leading=13,
        textColor=ciat_brown,
        spaceBefore=8,
        spaceAfter=5,
    )
    cell_bold_white = ParagraphStyle(
        "CellBoldWhite",
        parent=styles["Normal"],
        fontName="Helvetica-Bold",
        fontSize=8.5,
        leading=11,
        textColor=colors.white,
    )
    cell_regular = ParagraphStyle(
        "CellRegular",
        parent=styles["Normal"],
        fontName="Helvetica",
        fontSize=8,
        leading=10.5,
        textColor=ciat_dark,
    )
    cell_bold = ParagraphStyle(
        "CellBold",
        parent=styles["Normal"],
        fontName="Helvetica-Bold",
        fontSize=8,
        leading=10.5,
        textColor=ciat_dark,
    )

    story = []

    # En-tête CIAT
    header_table = Table(
        [
            [
                Paragraph(
                    "<b>RÉPUBLIQUE DU SÉNÉGAL</b><br/>Ministère de l'Enseignement Supérieur, de la Recherche et de l'Innovation",
                    meta_style,
                ),
                Paragraph(
                    "<b>CENTRE D'INNOVATION, D'APPLICATION ET DE TRANSFERT</b><br/>ISEP Amadou Traoré — Diamniadio",
                    subtitle_style,
                ),
            ]
        ],
        colWidths=[240, 280],
    )
    header_table.setStyle(
        TableStyle(
            [
                ("VALIGN", (0, 0), (-1, -1), "TOP"),
                ("ALIGN", (1, 0), (1, 0), "RIGHT"),
            ]
        )
    )
    story.append(header_table)
    story.append(Spacer(1, 6))
    story.append(
        HRFlowable(width="100%", thickness=1.5, color=ciat_brown, spaceAfter=6)
    )

    story.append(
        Paragraph(
            "TABLEAU DE BORD DÉCISIONNEL — FICHE DE SYNTHÈSE", title_style
        )
    )
    date_str = timezone.now().strftime("%d/%m/%Y à %H:%M")
    story.append(
        Paragraph(
            f"<b>Périmètre & Filtres :</b> {filter_label} &nbsp;|&nbsp; <b>Date d'édition :</b> {date_str}",
            meta_style,
        )
    )
    story.append(Spacer(1, 8))

    # 1. Indicateurs clés
    story.append(
        Paragraph("1. Indicateurs de Performance Globaux", section_title_style)
    )
    ind = summary_data["indicateurs"]
    ind_data = [
        [
            Paragraph("Indicateur Clé", cell_bold_white),
            Paragraph("Valeur", cell_bold_white),
        ],
        [
            Paragraph("Idées de projets reçues", cell_regular),
            Paragraph(str(ind["idees_recues"]), cell_bold),
        ],
        [
            Paragraph("Dossiers de candidature déposés", cell_regular),
            Paragraph(str(ind["dossiers_deposes"]), cell_bold),
        ],
        [
            Paragraph("Projets sélectionnés par le comité", cell_regular),
            Paragraph(str(ind["projets_selectionnes"]), cell_bold),
        ],
        [
            Paragraph("Projets en incubation active", cell_regular),
            Paragraph(str(ind["projets_incubes"]), cell_bold),
        ],
        [
            Paragraph("Prototypes réalisés et validés", cell_regular),
            Paragraph(str(ind["prototypes"]), cell_bold),
        ],
        [
            Paragraph("Taux global de sélection", cell_bold),
            Paragraph(f"<b>{ind['taux_selection']} %</b>", cell_bold),
        ],
    ]
    t_ind = Table(ind_data, colWidths=[380, 140])
    t_ind.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, 0), ciat_brown),
                ("ALIGN", (1, 0), (1, -1), "CENTER"),
                ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
                (
                    "ROWBACKGROUNDS",
                    (0, 1),
                    (-1, -2),
                    [colors.white, ciat_bg_light],
                ),
                ("BACKGROUND", (0, -1), (-1, -1), ciat_beige),
                ("GRID", (0, 0), (-1, -1), 0.5, ciat_line),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 3),
                ("TOPPADDING", (0, 0), (-1, -1), 3),
            ]
        )
    )
    story.append(t_ind)
    story.append(Spacer(1, 8))

    # 2. Répartition par domaine
    story.append(
        Paragraph(
            "2. Répartition par Domaine d'Intervention", section_title_style
        )
    )
    dom_data = [
        [
            Paragraph("Domaine d'intervention", cell_bold_white),
            Paragraph("Projets", cell_bold_white),
            Paragraph("Part (%)", cell_bold_white),
        ]
    ]
    for d in summary_data["par_domaine"]:
        dom_data.append(
            [
                Paragraph(d["domaine"], cell_regular),
                Paragraph(str(d["total"]), cell_bold),
                Paragraph(f"{d['pourcentage']} %", cell_regular),
            ]
        )
    if len(dom_data) == 1:
        dom_data.append(
            [
                Paragraph(
                    "Aucun projet enregistré dans ce périmètre", cell_regular
                ),
                Paragraph("0", cell_regular),
                Paragraph("0%", cell_regular),
            ]
        )

    t_dom = Table(dom_data, colWidths=[320, 100, 100])
    t_dom.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, 0), ciat_brown),
                ("ALIGN", (1, 0), (-1, -1), "CENTER"),
                ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
                (
                    "ROWBACKGROUNDS",
                    (0, 1),
                    (-1, -1),
                    [colors.white, ciat_bg_light],
                ),
                ("GRID", (0, 0), (-1, -1), 0.5, ciat_line),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 3),
                ("TOPPADDING", (0, 0), (-1, -1), 3),
            ]
        )
    )
    story.append(t_dom)
    story.append(Spacer(1, 8))

    # 3. Comparatif par cohorte
    story.append(
        Paragraph(
            "3. Comparatif des Cohortes d'Incubation", section_title_style
        )
    )
    coh_data = [
        [
            Paragraph("Cohorte", cell_bold_white),
            Paragraph("Année", cell_bold_white),
            Paragraph("Total", cell_bold_white),
            Paragraph("Sélectionnés", cell_bold_white),
            Paragraph("Prototypes", cell_bold_white),
            Paragraph("Taux sélection", cell_bold_white),
        ]
    ]
    for c in summary_data["par_cohorte"]:
        coh_data.append(
            [
                Paragraph(c["cohorte"], cell_regular),
                Paragraph(str(c["annee"]), cell_regular),
                Paragraph(str(c["total"]), cell_bold),
                Paragraph(str(c["selectionnes"]), cell_regular),
                Paragraph(str(c["prototypes"]), cell_regular),
                Paragraph(f"{c['taux_selection']} %", cell_regular),
            ]
        )
    if len(coh_data) == 1:
        coh_data.append(
            [
                Paragraph("Aucune cohorte trouvée", cell_regular),
                Paragraph("-", cell_regular),
                Paragraph("0", cell_regular),
                Paragraph("0", cell_regular),
                Paragraph("0", cell_regular),
                Paragraph("0%", cell_regular),
            ]
        )

    t_coh = Table(coh_data, colWidths=[180, 60, 65, 75, 65, 75])
    t_coh.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, 0), ciat_brown),
                ("ALIGN", (1, 0), (-1, -1), "CENTER"),
                ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
                (
                    "ROWBACKGROUNDS",
                    (0, 1),
                    (-1, -1),
                    [colors.white, ciat_bg_light],
                ),
                ("GRID", (0, 0), (-1, -1), 0.5, ciat_line),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 3),
                ("TOPPADDING", (0, 0), (-1, -1), 3),
            ]
        )
    )
    story.append(t_coh)
    story.append(Spacer(1, 8))

    # 4. Par genre
    story.append(
        Paragraph("4. Répartition par Genre des Porteurs", section_title_style)
    )
    gen_data = [
        [
            Paragraph("Genre", cell_bold_white),
            Paragraph("Nombre de porteurs", cell_bold_white),
            Paragraph("Part (%)", cell_bold_white),
        ]
    ]
    for g in summary_data["par_genre"]:
        gen_data.append(
            [
                Paragraph(g["genre"], cell_regular),
                Paragraph(str(g["total"]), cell_bold),
                Paragraph(f"{g['pourcentage']} %", cell_regular),
            ]
        )
    t_gen = Table(gen_data, colWidths=[260, 130, 130])
    t_gen.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, 0), ciat_brown),
                ("ALIGN", (1, 0), (-1, -1), "CENTER"),
                ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
                (
                    "ROWBACKGROUNDS",
                    (0, 1),
                    (-1, -1),
                    [colors.white, ciat_bg_light],
                ),
                ("GRID", (0, 0), (-1, -1), 0.5, ciat_line),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 3),
                ("TOPPADDING", (0, 0), (-1, -1), 3),
            ]
        )
    )
    story.append(t_gen)

    # 5. Alertes & Retards
    if summary_data["retards"]:
        story.append(Spacer(1, 8))
        story.append(
            Paragraph(
                "5. Suivi des Jalons et Projets en Alerte / Retard",
                section_title_style,
            )
        )
        ret_data = [
            [
                Paragraph("Projet", cell_bold_white),
                Paragraph("Jalon en retard", cell_bold_white),
                Paragraph("Échéance", cell_bold_white),
                Paragraph("Cohorte", cell_bold_white),
            ]
        ]
        for r in summary_data["retards"][:15]:
            ret_data.append(
                [
                    Paragraph(r["projet"], cell_bold),
                    Paragraph(r["jalon"], cell_regular),
                    Paragraph(r["echeance"], cell_regular),
                    Paragraph(r["cohorte"], cell_regular),
                ]
            )
        t_ret = Table(ret_data, colWidths=[180, 180, 80, 80])
        t_ret.setStyle(
            TableStyle(
                [
                    ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#A83232")),
                    ("ALIGN", (2, 0), (-1, -1), "CENTER"),
                    ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
                    (
                        "ROWBACKGROUNDS",
                        (0, 1),
                        (-1, -1),
                        [colors.white, ciat_bg_light],
                    ),
                    ("GRID", (0, 0), (-1, -1), 0.5, ciat_line),
                    ("BOTTOMPADDING", (0, 0), (-1, -1), 3),
                    ("TOPPADDING", (0, 0), (-1, -1), 3),
                ]
            )
        )
        story.append(t_ret)

    def add_page_footer(canvas, doc):
        canvas.saveState()
        canvas.setFont("Helvetica", 8)
        canvas.setFillColor(colors.HexColor("#777777"))
        canvas.drawString(
            36,
            20,
            "Plateforme CIAT — Centre d'Innovation, d'Application et de Transfert (ISEP Diamniadio)",
        )
        canvas.drawRightString(
            A4[0] - 36, 20, f"Page {canvas.getPageNumber()}"
        )
        canvas.restoreState()

    doc.build(story, onFirstPage=add_page_footer, onLaterPages=add_page_footer)
    stream.seek(0)

    response = HttpResponse(stream.getvalue(), content_type="application/pdf")
    timestamp = timezone.now().strftime("%Y%m%d_%H%M")
    response["Content-Disposition"] = (
        f'attachment; filename="ciat_synthese_analytics_{timestamp}.pdf"'
    )
    return response


class ExportView(APIView):
    """GET /api/analytics/export/?format=xlsx|pdf

    Exporte le tableau de bord décisionnel au format Excel (.xlsx) ou PDF (.pdf)
    selon la charte graphique officielle du CIAT.
    Respecte les filtres actifs : debut, fin, cohorte, domaine, statut.
    """

    permission_classes = [IsAnalyticsAuthorized]

    def perform_content_negotiation(self, request, force=False):
        # Évite que DRF intercepte le paramètre ?format=xlsx/pdf via sa négociation par défaut
        renderers = self.get_renderers()
        return (renderers[0], renderers[0].media_type)

    def get(self, request):

        export_format = request.query_params.get("format", "").strip().lower()
        if not export_format:
            export_format = "xlsx"
        elif export_format not in ("xlsx", "pdf"):
            return Response(
                {
                    "detail": "Format non supporté. Utilisez 'xlsx' ou 'pdf'."
                },
                status=status.HTTP_400_BAD_REQUEST,
            )


        qs = apply_filters(Projet.objects.all(), request)

        filter_parts = []
        if request.query_params.get("cohorte"):
            filter_parts.append(
                f"Cohorte: {request.query_params.get('cohorte')}"
            )
        if request.query_params.get("domaine"):
            filter_parts.append(
                f"Domaine: {request.query_params.get('domaine')}"
            )
        if request.query_params.get("statut"):
            filter_parts.append(f"Statut: {request.query_params.get('statut')}")
        if request.query_params.get("debut"):
            filter_parts.append(f"Depuis: {request.query_params.get('debut')}")
        if request.query_params.get("fin"):
            filter_parts.append(
                f"Jusqu'au: {request.query_params.get('fin')}"
            )

        filter_label = (
            " | ".join(filter_parts)
            if filter_parts
            else "Tous les projets (aucun filtre)"
        )

        summary_data = get_analytics_summary_data(qs, request)

        if export_format == "xlsx":
            return generate_excel_response(summary_data, filter_label)
        else:
            return generate_pdf_response(summary_data, filter_label)

