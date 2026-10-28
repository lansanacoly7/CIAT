"""Générateur d'exports Excel (.xlsx) et PDF (.pdf) pour le tableau de bord décisionnel (P3).

Conforme à la charte graphique du CIAT :
- Brun officiel CIAT : #612D10
- Noir d'encre CIAT : #24140D
- Doré d'accent CIAT : #C49A45
- En-tête institutionnel ISEP / CIAT
- Numérotation des pages dynamique (Page X sur Y)
"""
import io

import openpyxl
from django.db.models import Count, Q
from django.utils import timezone
from openpyxl.styles import Alignment, Border, Font, PatternFill, Side
from openpyxl.utils import get_column_letter
from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.pdfgen import canvas
from reportlab.platypus import (
    HRFlowable,
    Paragraph,
    SimpleDocTemplate,
    Spacer,
    Table,
    TableStyle,
)

from apps.analytics.views import apply_filters
from apps.core.models import Projet

# ==============================================================================
# Collecte des indicateurs et répartitions
# ==============================================================================

def collecter_donnees_analyses(request):
    """Collecte l'ensemble des indicateurs et ventilations filtrés."""
    qs = apply_filters(Projet.objects.all(), request)

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
    par_domaine_raw = (
        qs.values("domaine__nom")
        .annotate(total=Count("id"))
        .order_by("-total", "domaine__nom")
    )
    par_domaine = [
        {"domaine": item["domaine__nom"] or "Non renseigné", "total": item["total"]}
        for item in par_domaine_raw
    ]

    # Répartition par cohorte
    par_cohorte_raw = (
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
            "total": item["total"],
            "selectionnes": item["selectionnes"],
            "prototypes": item["prototypes"],
        }
        for item in par_cohorte_raw
    ]

    # Répartition par genre
    par_genre_raw = (
        qs.values("porteur__genre")
        .annotate(total=Count("id"))
        .order_by("-total")
    )
    mapping_genre = {
        "F": "Femmes",
        "H": "Hommes",
        "A": "Autre / non précisé",
    }
    totals_genre = {"Femmes": 0, "Hommes": 0, "Autre / non précisé": 0}
    for item in par_genre_raw:
        genre_code = item["porteur__genre"]
        label = mapping_genre.get(genre_code, "Autre / non précisé")
        totals_genre[label] = totals_genre.get(label, 0) + item["total"]

    par_genre = [
        {"genre": label, "total": total}
        for label, total in totals_genre.items()
    ]


    # Évolution chronologique par mois de création
    from django.db.models.functions import TruncMonth

    evolution_raw = (
        qs.annotate(mois=TruncMonth("cree_le"))
        .values("mois")
        .annotate(total=Count("id"))
        .order_by("mois")
    )
    evolution = [
        {
            "mois": item["mois"].strftime("%Y-%m") if hasattr(item["mois"], "strftime") else str(item["mois"])[:7],
            "total": item["total"],
        }
        for item in evolution_raw
        if item["mois"] is not None
    ]

    filtres_actifs = []
    params = getattr(request, "query_params", getattr(request, "GET", {}))
    for param in ("debut", "fin", "cohorte", "domaine", "statut"):
        val = params.get(param)
        if val:
            filtres_actifs.append(f"{param} : {val}")
    filtres_texte = ", ".join(filtres_actifs) if filtres_actifs else "Aucun (ensemble des projets)"

    return {
        "indicateurs": indicateurs,
        "par_domaine": par_domaine,
        "par_cohorte": par_cohorte,
        "par_genre": par_genre,
        "evolution": evolution,
        "filtres_texte": filtres_texte,
        "date_export": timezone.now().strftime("%d/%m/%Y à %H:%M"),
    }



# ==============================================================================
# Export Excel (.xlsx) avec openpyxl
# ==============================================================================

def generer_export_xlsx(data: dict) -> io.BytesIO:
    """Génère un classeur Excel complet avec mise en page aux couleurs du CIAT."""
    wb = openpyxl.Workbook()
    ws = wb.active
    ws.title = "Analyses CIAT"
    ws.views.sheetView[0].showGridLines = True

    # Palette CIAT
    fill_header = PatternFill(start_color="612D10", end_color="612D10", fill_type="solid")
    fill_zebra = PatternFill(start_color="F9F7F5", end_color="F9F7F5", fill_type="solid")

    font_title = Font(name="Calibri", size=15, bold=True, color="612D10")
    font_subtitle = Font(name="Calibri", size=11, bold=True, color="24140D")
    font_meta = Font(name="Calibri", size=10, italic=True, color="555555")
    font_section = Font(name="Calibri", size=12, bold=True, color="612D10")
    font_th = Font(name="Calibri", size=10, bold=True, color="FFFFFF")
    font_td = Font(name="Calibri", size=10, color="24140D")
    font_td_bold = Font(name="Calibri", size=10, bold=True, color="24140D")

    thin_border_side = Side(border_style="thin", color="CCCCCC")
    border_cell = Border(left=thin_border_side, right=thin_border_side, top=thin_border_side, bottom=thin_border_side)

    # 1. En-tête institutionnel
    ws["A1"] = "CENTRE D'INNOVATION, D'APPLICATION ET DE TRANSFERT (CIAT) — ISEP DIAMNIADIO"
    ws["A1"].font = font_title
    ws["A2"] = "Tableau de Bord Décisionnel — Rapport Synthétique des Analyses"
    ws["A2"].font = font_subtitle
    ws["A3"] = f"Date d'exportation : {data['date_export']}  |  Filtres appliqués : {data['filtres_texte']}"
    ws["A3"].font = font_meta

    current_row = 5

    def add_section_header(title):
        nonlocal current_row
        ws.cell(row=current_row, column=1, value=title).font = font_section
        current_row += 1

    # 2. Section Indicateurs Clés
    add_section_header("1. INDICATEURS CLÉS DU PROGRAMME D'INCUBATION")
    headers_ind = ["Indicateur", "Valeur"]
    for col_idx, h in enumerate(headers_ind, 1):
        cell = ws.cell(row=current_row, column=col_idx, value=h)
        cell.fill = fill_header
        cell.font = font_th
        cell.alignment = Alignment(horizontal="left" if col_idx == 1 else "right")
        cell.border = border_cell
    current_row += 1

    ind = data["indicateurs"]
    lignes_ind = [
        ("Idées reçues (projets enregistrés)", ind["idees_recues"]),
        ("Dossiers formellement déposés", ind["dossiers_deposes"]),
        ("Projets sélectionnés pour accompagnement", ind["projets_selectionnes"]),
        ("Projets entrés en incubation active", ind["projets_incubes"]),
        ("Prototypes validés ou réalisés", ind["prototypes"]),
        ("Taux de sélection global", f"{ind['taux_selection']} %"),
    ]
    for idx, (label, val) in enumerate(lignes_ind):
        c1 = ws.cell(row=current_row, column=1, value=label)
        c2 = ws.cell(row=current_row, column=2, value=val)
        c1.font = font_td
        c2.font = font_td_bold
        c1.border = border_cell
        c2.border = border_cell
        c2.alignment = Alignment(horizontal="right")
        if idx % 2 == 1:
            c1.fill = fill_zebra
            c2.fill = fill_zebra
        current_row += 1

    current_row += 2

    # 3. Section Répartition par Domaine
    add_section_header("2. RÉPARTITION DES PROJETS PAR DOMAINE")
    headers_dom = ["Domaine d'intervention", "Nombre de projets", "Part (%)"]
    for col_idx, h in enumerate(headers_dom, 1):
        cell = ws.cell(row=current_row, column=col_idx, value=h)
        cell.fill = fill_header
        cell.font = font_th
        cell.alignment = Alignment(horizontal="left" if col_idx == 1 else "right")
        cell.border = border_cell
    current_row += 1

    total_projets_dom = sum(d["total"] for d in data["par_domaine"]) or 1
    for idx, d in enumerate(data["par_domaine"]):
        pct = round((d["total"] / total_projets_dom) * 100, 1)
        c1 = ws.cell(row=current_row, column=1, value=d["domaine"])
        c2 = ws.cell(row=current_row, column=2, value=d["total"])
        c3 = ws.cell(row=current_row, column=3, value=f"{pct} %")
        for c in (c1, c2, c3):
            c.font = font_td
            c.border = border_cell
            if idx % 2 == 1:
                c.fill = fill_zebra
        c2.alignment = Alignment(horizontal="right")
        c3.alignment = Alignment(horizontal="right")
        current_row += 1

    current_row += 2

    # 4. Section Comparaison des Cohortes
    add_section_header("3. COMPARAISON PAR COHORTE")
    headers_coh = ["Cohorte", "Total Projets", "Sélectionnés", "Prototypes"]
    for col_idx, h in enumerate(headers_coh, 1):
        cell = ws.cell(row=current_row, column=col_idx, value=h)
        cell.fill = fill_header
        cell.font = font_th
        cell.alignment = Alignment(horizontal="left" if col_idx == 1 else "right")
        cell.border = border_cell
    current_row += 1

    for idx, c in enumerate(data["par_cohorte"]):
        c1 = ws.cell(row=current_row, column=1, value=c["cohorte"])
        c2 = ws.cell(row=current_row, column=2, value=c["total"])
        c3 = ws.cell(row=current_row, column=3, value=c["selectionnes"])
        c4 = ws.cell(row=current_row, column=4, value=c["prototypes"])
        for cell in (c1, c2, c3, c4):
            cell.font = font_td
            cell.border = border_cell
            if idx % 2 == 1:
                cell.fill = fill_zebra
        for cell in (c2, c3, c4):
            cell.alignment = Alignment(horizontal="right")
        current_row += 1

    current_row += 2

    # 5. Section Répartition par Genre
    add_section_header("4. RÉPARTITION PAR GENRE DES PORTEURS")
    headers_gen = ["Genre", "Nombre de porteurs", "Part (%)"]
    for col_idx, h in enumerate(headers_gen, 1):
        cell = ws.cell(row=current_row, column=col_idx, value=h)
        cell.fill = fill_header
        cell.font = font_th
        cell.alignment = Alignment(horizontal="left" if col_idx == 1 else "right")
        cell.border = border_cell
    current_row += 1

    total_genre = sum(g["total"] for g in data["par_genre"]) or 1
    for idx, g in enumerate(data["par_genre"]):
        pct = round((g["total"] / total_genre) * 100, 1)
        c1 = ws.cell(row=current_row, column=1, value=g["genre"])
        c2 = ws.cell(row=current_row, column=2, value=g["total"])
        c3 = ws.cell(row=current_row, column=3, value=f"{pct} %")
        for cell in (c1, c2, c3):
            cell.font = font_td
            cell.border = border_cell
            if idx % 2 == 1:
                cell.fill = fill_zebra
        c2.alignment = Alignment(horizontal="right")
        c3.alignment = Alignment(horizontal="right")
        current_row += 1

    current_row += 2

    # 5. Section Évolution Chronologique des Dépôts
    if data.get("evolution"):
        add_section_header("5. ÉVOLUTION CHRONOLOGIQUE DES DÉPÔTS")
        headers_evo = ["Mois", "Nombre de dépôts"]
        for col_idx, h in enumerate(headers_evo, 1):
            cell = ws.cell(row=current_row, column=col_idx, value=h)
            cell.fill = fill_header
            cell.font = font_th
            cell.alignment = Alignment(horizontal="left" if col_idx == 1 else "right")
            cell.border = border_cell
        current_row += 1

        for idx, e in enumerate(data["evolution"]):
            c1 = ws.cell(row=current_row, column=1, value=e["mois"])
            c2 = ws.cell(row=current_row, column=2, value=e["total"])
            c1.font = font_td
            c2.font = font_td
            c1.border = border_cell
            c2.border = border_cell
            c2.alignment = Alignment(horizontal="right")
            if idx % 2 == 1:
                c1.fill = fill_zebra
                c2.fill = fill_zebra
            current_row += 1

    # Ajustement largeur des colonnes
    for col in ws.columns:
        max_len = 0
        col_letter = get_column_letter(col[0].column)
        for cell in col:
            val_str = str(cell.value or "")
            if len(val_str) > max_len and cell.row > 3:
                max_len = len(val_str)
        ws.column_dimensions[col_letter].width = max(max_len + 4, 18)

    buf = io.BytesIO()
    wb.save(buf)
    buf.seek(0)
    return buf


# ==============================================================================
# Export PDF avec ReportLab
# ==============================================================================

class _AnalyticsNumberedCanvas(canvas.Canvas):
    """Canvas personnalisé pour numéroter les pages en 2 passes (Page X sur Y)
    avec bandeau d'en-tête et pied de page institutionnels.
    """

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self._saved_page_states = []

    def showPage(self):
        self._saved_page_states.append(dict(self.__dict__))
        self._startPage()

    def save(self):
        num_pages = len(self._saved_page_states)
        for state in self._saved_page_states:
            self.__dict__.update(state)
            self.draw_header_footer(num_pages)
            super().showPage()
        super().save()

    def draw_header_footer(self, page_count):
        self.saveState()
        self.setFont("Helvetica-Bold", 8)
        self.setFillColor(colors.HexColor("#612D10"))

        # En-tête sur les pages suivantes
        if self._pageNumber > 1:
            self.drawString(54, 800, "CIAT — Tableau de bord décisionnel | Rapport d'analyses")
            self.setStrokeColor(colors.HexColor("#C49A45"))
            self.setLineWidth(0.8)
            self.line(54, 794, 541, 794)

        # Pied de page sur toutes les pages
        self.setStrokeColor(colors.HexColor("#E5E0D8"))
        self.setLineWidth(0.5)
        self.line(54, 45, 541, 45)

        self.setFont("Helvetica", 8)
        self.setFillColor(colors.HexColor("#666666"))
        self.drawString(54, 32, "Centre d'Innovation, d'Application et de Transfert (CIAT) — ISEP Diamniadio")

        page_str = f"Page {self._pageNumber} sur {page_count}"
        self.drawRightString(541, 32, page_str)
        self.restoreState()


def generer_export_pdf(data: dict) -> io.BytesIO:
    """Génère un rapport d'analyse PDF complet aux couleurs du CIAT."""
    buf = io.BytesIO()
    doc = SimpleDocTemplate(
        buf,
        pagesize=A4,
        leftMargin=54,
        rightMargin=54,
        topMargin=54,
        bottomMargin=54,
    )

    styles = getSampleStyleSheet()

    c_brun = colors.HexColor("#612D10")
    c_noir = colors.HexColor("#24140D")
    c_dore = colors.HexColor("#C49A45")
    c_fond = colors.HexColor("#FAF4EE")
    c_zebra = colors.HexColor("#F9F7F5")
    c_border = colors.HexColor("#D8D0C5")

    title_style = ParagraphStyle(
        "PdfAnalyticsTitle",
        parent=styles["Normal"],
        fontName="Helvetica-Bold",
        fontSize=18,
        leading=22,
        textColor=c_brun,
        spaceAfter=4,
    )
    subtitle_style = ParagraphStyle(
        "PdfAnalyticsSubtitle",
        parent=styles["Normal"],
        fontName="Helvetica-Bold",
        fontSize=11,
        leading=15,
        textColor=c_noir,
        spaceAfter=4,
    )
    meta_style = ParagraphStyle(
        "PdfAnalyticsMeta",
        parent=styles["Normal"],
        fontName="Helvetica",
        fontSize=9,
        leading=13,
        textColor=colors.HexColor("#666666"),
        spaceAfter=14,
    )
    h2_style = ParagraphStyle(
        "PdfAnalyticsH2",
        parent=styles["Normal"],
        fontName="Helvetica-Bold",
        fontSize=12,
        leading=16,
        textColor=c_brun,
        spaceBefore=12,
        spaceAfter=6,
    )
    cell_th_style = ParagraphStyle(
        "PdfAnalyticsTH",
        parent=styles["Normal"],
        fontName="Helvetica-Bold",
        fontSize=9,
        leading=12,
        textColor=colors.white,
    )
    cell_td_style = ParagraphStyle(
        "PdfAnalyticsTD",
        parent=styles["Normal"],
        fontName="Helvetica",
        fontSize=9,
        leading=12,
        textColor=c_noir,
    )
    cell_td_right = ParagraphStyle(
        "PdfAnalyticsTDRight",
        parent=styles["Normal"],
        fontName="Helvetica",
        fontSize=9,
        leading=12,
        alignment=2,
        textColor=c_noir,
    )

    story = []

    # En-tête
    story.append(Paragraph("CENTRE D'INNOVATION, D'APPLICATION ET DE TRANSFERT", title_style))
    story.append(Paragraph("Tableau de Bord Décisionnel — Rapport d'Analyses", subtitle_style))
    story.append(
        Paragraph(
            f"<b>Date d'export :</b> {data['date_export']} &nbsp;|&nbsp; <b>Filtres :</b> {data['filtres_texte']}",
            meta_style,
        )
    )
    story.append(HRFlowable(width="100%", thickness=1.5, color=c_dore, spaceAfter=12))

    # 1. Indicateurs clés
    story.append(Paragraph("1. Indicateurs Clés de l'Incubateur", h2_style))
    ind = data["indicateurs"]
    t_ind_data = [
        [Paragraph("Indicateur", cell_th_style), Paragraph("Valeur", cell_th_style)],
        [Paragraph("Idées reçues (projets enregistrés)", cell_td_style), Paragraph(str(ind["idees_recues"]), cell_td_right)],
        [Paragraph("Dossiers formellement déposés", cell_td_style), Paragraph(str(ind["dossiers_deposes"]), cell_td_right)],
        [Paragraph("Projets sélectionnés pour accompagnement", cell_td_style), Paragraph(str(ind["projets_selectionnes"]), cell_td_right)],
        [Paragraph("Projets entrés en incubation active", cell_td_style), Paragraph(str(ind["projets_incubes"]), cell_td_right)],
        [Paragraph("Prototypes réalisés ou validés", cell_td_style), Paragraph(str(ind["prototypes"]), cell_td_right)],
        [Paragraph("Taux de sélection global", cell_td_style), Paragraph(f"<b>{ind['taux_selection']} %</b>", cell_td_right)],
    ]
    t_ind = Table(t_ind_data, colWidths=[360, 127])
    t_ind.setStyle(
        TableStyle([
            ("BACKGROUND", (0, 0), (-1, 0), c_brun),
            ("GRID", (0, 0), (-1, -1), 0.5, c_border),
            ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, c_zebra]),
            ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
            ("TOPPADDING", (0, 0), (-1, -1), 5),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
        ])
    )
    story.append(t_ind)
    story.append(Spacer(1, 10))

    # 2. Répartition par domaine
    story.append(Paragraph("2. Répartition des Projets par Domaine", h2_style))
    total_projets_dom = sum(d["total"] for d in data["par_domaine"]) or 1
    t_dom_data = [
        [
            Paragraph("Domaine d'intervention", cell_th_style),
            Paragraph("Nombre de projets", cell_th_style),
            Paragraph("Part (%)", cell_th_style),
        ]
    ]
    for d in data["par_domaine"]:
        pct = round((d["total"] / total_projets_dom) * 100, 1)
        t_dom_data.append([
            Paragraph(d["domaine"], cell_td_style),
            Paragraph(str(d["total"]), cell_td_right),
            Paragraph(f"{pct} %", cell_td_right),
        ])
    t_dom = Table(t_dom_data, colWidths=[280, 110, 97])
    t_dom.setStyle(
        TableStyle([
            ("BACKGROUND", (0, 0), (-1, 0), c_brun),
            ("GRID", (0, 0), (-1, -1), 0.5, c_border),
            ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, c_zebra]),
            ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
            ("TOPPADDING", (0, 0), (-1, -1), 4),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
        ])
    )
    story.append(t_dom)
    story.append(Spacer(1, 10))

    # 3. Répartition par cohorte
    story.append(Paragraph("3. Comparaison des Cohortes", h2_style))
    t_coh_data = [
        [
            Paragraph("Cohorte", cell_th_style),
            Paragraph("Total", cell_th_style),
            Paragraph("Sélectionnés", cell_th_style),
            Paragraph("Prototypes", cell_th_style),
        ]
    ]
    for c in data["par_cohorte"]:
        t_coh_data.append([
            Paragraph(c["cohorte"], cell_td_style),
            Paragraph(str(c["total"]), cell_td_right),
            Paragraph(str(c["selectionnes"]), cell_td_right),
            Paragraph(str(c["prototypes"]), cell_td_right),
        ])
    t_coh = Table(t_coh_data, colWidths=[200, 95, 96, 96])
    t_coh.setStyle(
        TableStyle([
            ("BACKGROUND", (0, 0), (-1, 0), c_brun),
            ("GRID", (0, 0), (-1, -1), 0.5, c_border),
            ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, c_zebra]),
            ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
            ("TOPPADDING", (0, 0), (-1, -1), 4),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
        ])
    )
    story.append(t_coh)
    story.append(Spacer(1, 10))

    # 4. Répartition par genre
    story.append(Paragraph("4. Répartition par Genre des Porteurs", h2_style))
    total_genre = sum(g["total"] for g in data["par_genre"]) or 1
    t_gen_data = [
        [
            Paragraph("Genre", cell_th_style),
            Paragraph("Nombre de porteurs", cell_th_style),
            Paragraph("Part (%)", cell_th_style),
        ]
    ]
    for g in data["par_genre"]:
        pct = round((g["total"] / total_genre) * 100, 1)
        t_gen_data.append([
            Paragraph(g["genre"], cell_td_style),
            Paragraph(str(g["total"]), cell_td_right),
            Paragraph(f"{pct} %", cell_td_right),
        ])
    t_gen = Table(t_gen_data, colWidths=[280, 110, 97])
    t_gen.setStyle(
        TableStyle([
            ("BACKGROUND", (0, 0), (-1, 0), c_brun),
            ("GRID", (0, 0), (-1, -1), 0.5, c_border),
            ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, c_zebra]),
            ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
            ("TOPPADDING", (0, 0), (-1, -1), 4),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
        ])
    )
    story.append(t_gen)

    # 5. Évolution chronologique des dépôts
    if data.get("evolution"):
        story.append(Spacer(1, 10))
        story.append(Paragraph("5. Évolution Chronologique des Dépôts", h2_style))
        t_evo_data = [
            [
                Paragraph("Mois", cell_th_style),
                Paragraph("Nombre de dépôts", cell_th_style),
            ]
        ]
        for e in data["evolution"]:
            t_evo_data.append([
                Paragraph(e["mois"], cell_td_style),
                Paragraph(str(e["total"]), cell_td_right),
            ])
        t_evo = Table(t_evo_data, colWidths=[240, 247])
        t_evo.setStyle(
            TableStyle([
                ("BACKGROUND", (0, 0), (-1, 0), c_brun),
                ("GRID", (0, 0), (-1, -1), 0.5, c_border),
                ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, c_zebra]),
                ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
                ("TOPPADDING", (0, 0), (-1, -1), 4),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
            ])
        )
        story.append(t_evo)

    doc.build(story, canvasmaker=_AnalyticsNumberedCanvas)
    buf.seek(0)
    return buf

