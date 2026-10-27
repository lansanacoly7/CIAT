#!/usr/bin/env python3
"""Script de génération du Rapport Final de Projet CIAT en PDF et Word (.docx).

Conforme à la charte graphique officielle du CIAT / ISEP Diamniadio (Charte 360) :
- Brun officiel CIAT : #612D10 (titres, en-têtes)
- Noir d'encre CIAT : #24140D (corps de texte)
- Ocre Doré d'accent : #C49A45 / #C99A68 (filets, bordures de mise en valeur)
- Fond doux / Beige : #FAF4EE (cartes de métadonnées, alertes, zébrures de tables)
- Bordures : #D8D0C5 / #E5E0D8
- En-tête et pied de page institutionnels avec numérotation dynamique (Page X sur Y).

Exigence stricte de volume : entre 5 et 10 pages réelles.
"""
import os
import re
import sys
from pathlib import Path

# Paths
ROOT_DIR = Path(__file__).resolve().parent.parent
DOCS_DIR = ROOT_DIR / "docs"
LIVRABLES_DIR = DOCS_DIR / "livrables"
MD_PATH = LIVRABLES_DIR / "rapport_projet.md"
PDF_PATH = LIVRABLES_DIR / "rapport_projet.pdf"
DOCX_PATH = LIVRABLES_DIR / "rapport_projet.docx"
LOGO_PATH = DOCS_DIR / "logo" / "ciat_horizontal.png"

# ReportLab imports
from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import cm, inch, mm
from reportlab.pdfgen import canvas
from reportlab.platypus import (
    HRFlowable,
    Image as RLImage,
    KeepTogether,
    PageBreak,
    Paragraph,
    Preformatted,
    SimpleDocTemplate,
    Spacer,
    Table,
    TableStyle,
)

# python-docx imports
from docx import Document as DocxDocument
from docx.enum.table import WD_ALIGN_VERTICAL, WD_TABLE_ALIGNMENT
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.oxml import OxmlElement, parse_xml
from docx.oxml.ns import nsdecls, qn
from docx.shared import Inches, Pt, RGBColor

# Colors CIAT
HEX_BRUN = "#612D10"
HEX_TEXTE = "#24140D"
HEX_DORE = "#C49A45"
HEX_FOND = "#FAF4EE"
HEX_ZEBRE = "#F5EFE9"
HEX_BORDURE = "#D8D0C5"
HEX_GRIS = "#666666"

COLOR_BRUN = colors.HexColor(HEX_BRUN)
COLOR_TEXTE = colors.HexColor(HEX_TEXTE)
COLOR_DORE = colors.HexColor(HEX_DORE)
COLOR_FOND = colors.HexColor(HEX_FOND)
COLOR_ZEBRE = colors.HexColor(HEX_ZEBRE)
COLOR_BORDURE = colors.HexColor(HEX_BORDURE)
COLOR_GRIS = colors.HexColor(HEX_GRIS)

RGB_BRUN = RGBColor(97, 45, 16)
RGB_TEXTE = RGBColor(36, 20, 13)
RGB_DORE = RGBColor(196, 154, 69)
RGB_GRIS = RGBColor(102, 102, 102)


class NumberedCanvas(canvas.Canvas):
    """Canvas ReportLab à deux passes pour insérer le total de pages et les bandeaux."""

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self._saved_page_states = []
        self.total_pages = 0

    def showPage(self):
        self._saved_page_states.append(dict(self.__dict__))
        self._startPage()

    def save(self):
        num_pages = len(self._saved_page_states)
        self.total_pages = num_pages
        for state in self._saved_page_states:
            self.__dict__.update(state)
            self.draw_header_footer(num_pages)
            super().showPage()
        super().save()

    def draw_header_footer(self, page_count):
        self.saveState()

        # Marges : left=45, right=550 (largeur A4 = 595.27, hauteur = 841.89)
        # En-tête (sauf page 1 de couverture)
        if self._pageNumber > 1:
            self.setFont("Helvetica-Bold", 8)
            self.setFillColor(COLOR_BRUN)
            self.drawString(45, 805, "CIAT — ISEP Diamniadio")
            self.setFont("Helvetica", 8)
            self.setFillColor(COLOR_GRIS)
            self.drawRightString(
                550, 805, "Rapport Final de Projet • Évaluation Pratique IA Générative"
            )
            self.setStrokeColor(COLOR_BORDURE)
            self.setLineWidth(0.6)
            self.line(45, 798, 550, 798)

        # Pied de page sur toutes les pages
        self.setStrokeColor(COLOR_BORDURE)
        self.setLineWidth(0.6)
        self.line(45, 42, 550, 42)

        self.setFont("Helvetica", 8)
        self.setFillColor(COLOR_GRIS)
        self.drawString(
            45,
            30,
            "Plateforme Numérique CIAT  •  Livrable Obligatoire N° 6 (Lead technique : Lansana Coly)",
        )
        page_str = f"Page {self._pageNumber} sur {page_count}"
        self.setFont("Helvetica-Bold", 8)
        self.setFillColor(COLOR_BRUN)
        self.drawRightString(550, 30, page_str)

        self.restoreState()


def inline_markdown_to_reportlab(text: str) -> str:
    """Convertit le formatage inline markdown en balises ReportLab XML."""
    text = re.sub(r"&(?![a-zA-Z#0-9]+;)", "&amp;", text)
    text = text.replace("<", "&lt;").replace(">", "&gt;")
    # Bold italic
    text = re.sub(r"\*\*\*(.*?)\*\*\*", r"<b><i>\1</i></b>", text)
    # Bold
    text = re.sub(r"\*\*(.*?)\*\*", r"<b>\1</b>", text)
    # Italic
    text = re.sub(r"\*(.*?)\*", r"<i>\1</i>", text)
    # Code inline
    text = re.sub(
        r"`(.*?)`",
        r'<font face="Courier" color="#612D10"><b>\1</b></font>',
        text,
    )
    # Links [text](url) -> <u>text</u>
    text = re.sub(r"\[(.*?)\]\(.*?\)", r"<u>\1</u>", text)
    return text


def clean_markdown_inline(text: str) -> str:
    """Nettoie le texte markdown pour python-docx."""
    text = re.sub(r"\*\*\*(.*?)\*\*\*", r"\1", text)
    text = re.sub(r"\*\*(.*?)\*\*", r"\1", text)
    text = re.sub(r"\*(.*?)\*", r"\1", text)
    text = re.sub(r"`(.*?)`", r"\1", text)
    text = re.sub(r"\[(.*?)\]\(.*?\)", r"\1", text)
    return text


def parse_markdown(md_text: str):
    """Découpe le document markdown en blocs sémantiques."""
    lines = md_text.splitlines()
    blocks = []
    i = 0
    n = len(lines)

    while i < n:
        line = lines[i]
        stripped = line.strip()

        # Ligne vide
        if not stripped:
            i += 1
            continue

        # Séparateur horizontal
        if stripped in ("---", "***", "___"):
            blocks.append({"type": "hr"})
            i += 1
            continue

        # Titres
        if stripped.startswith("# "):
            blocks.append({"type": "h1", "text": stripped[2:].strip()})
            i += 1
            continue
        if stripped.startswith("## "):
            blocks.append({"type": "h2", "text": stripped[3:].strip()})
            i += 1
            continue
        if stripped.startswith("### "):
            blocks.append({"type": "h3", "text": stripped[4:].strip()})
            i += 1
            continue
        if stripped.startswith("#### "):
            blocks.append({"type": "h4", "text": stripped[5:].strip()})
            i += 1
            continue

        # Bloc de citation / Callout
        if stripped.startswith(">"):
            quote_lines = []
            while i < n and (lines[i].strip().startswith(">") or (lines[i].strip() and not lines[i].startswith("#") and not lines[i].startswith("|") and not lines[i].startswith("```"))):
                curr = lines[i].strip()
                if curr.startswith(">"):
                    curr = curr[1:].strip()
                quote_lines.append(curr)
                i += 1
            blocks.append({"type": "blockquote", "text": "\n".join(quote_lines)})
            continue

        # Bloc de code / ASCII Art
        if stripped.startswith("```"):
            code_lines = []
            lang = stripped[3:].strip()
            i += 1
            while i < n and not lines[i].strip().startswith("```"):
                code_lines.append(lines[i])
                i += 1
            if i < n:
                i += 1  # consume closing ```
            blocks.append({"type": "code", "lang": lang, "text": "\n".join(code_lines)})
            continue

        # Table markdown
        if stripped.startswith("|") and stripped.endswith("|"):
            table_lines = []
            while i < n and lines[i].strip().startswith("|") and lines[i].strip().endswith("|"):
                t_line = lines[i].strip()
                # ignore separator lines |---|---|
                if not re.match(r"^\|(\s*:?-+:?\s*\|)+$", t_line):
                    # split cells
                    cells = [c.strip() for c in t_line.split("|")[1:-1]]
                    table_lines.append(cells)
                i += 1
            if table_lines:
                blocks.append({
                    "type": "table",
                    "header": table_lines[0],
                    "rows": table_lines[1:],
                })
            continue

        # Listes à puces
        if stripped.startswith("- ") or stripped.startswith("* "):
            blocks.append({"type": "bullet", "text": stripped[2:].strip()})
            i += 1
            continue

        # Listes numérotées
        num_match = re.match(r"^(\d+)\.\s+(.*)$", stripped)
        if num_match:
            blocks.append({
                "type": "numbered",
                "number": num_match.group(1),
                "text": num_match.group(2).strip(),
            })
            i += 1
            continue

        # Paragraphe normal (peut s'étendre sur plusieurs lignes)
        p_lines = [stripped]
        i += 1
        while (
            i < n
            and lines[i].strip()
            and not lines[i].strip().startswith(("#", ">", "```", "|", "-", "*", "---"))
            and not re.match(r"^\d+\.\s+", lines[i].strip())
        ):
            p_lines.append(lines[i].strip())
            i += 1
        blocks.append({"type": "paragraph", "text": " ".join(p_lines)})

    return blocks


def generer_pdf(blocks, output_path: Path) -> int:
    """Génère le PDF avec ReportLab et renvoie le nombre réel de pages."""
    doc = SimpleDocTemplate(
        str(output_path),
        pagesize=A4,
        leftMargin=45,
        rightMargin=45,
        topMargin=50,
        bottomMargin=50,
    )

    styles = getSampleStyleSheet()

    # Styles personnalisés
    style_titre_doc = ParagraphStyle(
        "TitreDoc",
        parent=styles["Heading1"],
        fontName="Helvetica-Bold",
        fontSize=20,
        leading=24,
        textColor=COLOR_BRUN,
        alignment=0,
        spaceAfter=10,
    )

    style_h2 = ParagraphStyle(
        "TitreH2",
        parent=styles["Heading2"],
        fontName="Helvetica-Bold",
        fontSize=13.5,
        leading=17,
        textColor=COLOR_BRUN,
        spaceBefore=14,
        spaceAfter=6,
        keepWithNext=True,
    )

    style_h3 = ParagraphStyle(
        "TitreH3",
        parent=styles["Heading3"],
        fontName="Helvetica-Bold",
        fontSize=10.5,
        leading=14,
        textColor=COLOR_TEXTE,
        spaceBefore=10,
        spaceAfter=4,
        keepWithNext=True,
    )

    style_body = ParagraphStyle(
        "CorpsTexte",
        parent=styles["Normal"],
        fontName="Helvetica",
        fontSize=9.2,
        leading=13.2,
        textColor=COLOR_TEXTE,
        spaceAfter=6,
        alignment=4,  # Justifié
    )

    style_bullet = ParagraphStyle(
        "PuceTexte",
        parent=style_body,
        leftIndent=15,
        bulletIndent=5,
        spaceAfter=4,
        alignment=0,
    )

    style_quote = ParagraphStyle(
        "CitationTexte",
        parent=styles["Normal"],
        fontName="Helvetica-Oblique",
        fontSize=8.5,
        leading=12,
        textColor=COLOR_TEXTE,
    )

    style_code = ParagraphStyle(
        "CodeTexte",
        parent=styles["Normal"],
        fontName="Courier",
        fontSize=6.8,
        leading=8.5,
        textColor=COLOR_BRUN,
    )

    style_table_cell = ParagraphStyle(
        "CelluleTable",
        parent=styles["Normal"],
        fontName="Helvetica",
        fontSize=7.8,
        leading=10.5,
        textColor=COLOR_TEXTE,
    )

    style_table_header = ParagraphStyle(
        "HeaderTable",
        parent=styles["Normal"],
        fontName="Helvetica-Bold",
        fontSize=8.2,
        leading=11,
        textColor=colors.white,
    )

    story = []

    # Logo CIAT en haut de première page si présent
    if LOGO_PATH.exists():
        # Largeur souhaitée : 160 pt, hauteur proportionnelle (160 * 340 / 1024 = 53 pt)
        logo_img = RLImage(str(LOGO_PATH), width=155, height=51.5)
        logo_img.hAlign = "LEFT"
        story.append(logo_img)
        story.append(Spacer(1, 10))

    for b in blocks:
        b_type = b["type"]

        if b_type == "h1":
            story.append(Paragraph(inline_markdown_to_reportlab(b["text"]), style_titre_doc))
            story.append(HRFlowable(width="100%", thickness=1.5, color=COLOR_DORE, spaceAfter=10))

        elif b_type == "h2":
            story.append(Paragraph(inline_markdown_to_reportlab(b["text"]), style_h2))
            story.append(HRFlowable(width="100%", thickness=0.5, color=COLOR_BORDURE, spaceAfter=6))

        elif b_type == "h3":
            story.append(Paragraph(inline_markdown_to_reportlab(b["text"]), style_h3))

        elif b_type == "paragraph":
            story.append(Paragraph(inline_markdown_to_reportlab(b["text"]), style_body))

        elif b_type == "bullet":
            story.append(Paragraph(f"• &nbsp; {inline_markdown_to_reportlab(b['text'])}", style_bullet))

        elif b_type == "numbered":
            story.append(
                Paragraph(
                    f"<b>{b['number']}.</b> &nbsp; {inline_markdown_to_reportlab(b['text'])}",
                    style_bullet,
                )
            )

        elif b_type == "blockquote":
            # Encadré dans une table à 1 cellule avec fond beige et bordure gauche dorée
            quote_p = Paragraph(inline_markdown_to_reportlab(b["text"].replace("\n", "<br/>")), style_quote)
            t_quote = Table([[quote_p]], colWidths=[505])
            t_quote.setStyle(
                TableStyle([
                    ("BACKGROUND", (0, 0), (-1, -1), COLOR_FOND),
                    ("BOX", (0, 0), (-1, -1), 0.5, COLOR_BORDURE),
                    ("LINEBEFORE", (0, 0), (0, -1), 3.5, COLOR_DORE),
                    ("TOPPADDING", (0, 0), (-1, -1), 7),
                    ("BOTTOMPADDING", (0, 0), (-1, -1), 7),
                    ("LEFTPADDING", (0, 0), (-1, -1), 10),
                    ("RIGHTPADDING", (0, 0), (-1, -1), 10),
                ])
            )
            story.append(Spacer(1, 4))
            story.append(t_quote)
            story.append(Spacer(1, 8))

        elif b_type == "code":
            # Schéma ou bloc de code dans une boîte grise / beige
            pre = Preformatted(b["text"], style_code)
            t_code = Table([[pre]], colWidths=[505])
            t_code.setStyle(
                TableStyle([
                    ("BACKGROUND", (0, 0), (-1, -1), colors.HexColor("#F9F7F4")),
                    ("BOX", (0, 0), (-1, -1), 0.5, COLOR_BORDURE),
                    ("TOPPADDING", (0, 0), (-1, -1), 6),
                    ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
                    ("LEFTPADDING", (0, 0), (-1, -1), 8),
                    ("RIGHTPADDING", (0, 0), (-1, -1), 8),
                ])
            )
            story.append(Spacer(1, 4))
            story.append(t_code)
            story.append(Spacer(1, 8))

        elif b_type == "table":
            header = b["header"]
            rows = b["rows"]
            nb_cols = len(header)
            col_widths = None

            # Calcul des largeurs de colonnes selon le nombre de colonnes
            if nb_cols == 3:
                col_widths = [105, 140, 260]
            elif nb_cols == 5:
                # Table des anomalies (Réf, Composant, Nature, Impact, Correction)
                col_widths = [55, 85, 150, 65, 150]
            elif nb_cols == 4:
                col_widths = [85, 110, 160, 150]
            else:
                w = 505 / nb_cols
                col_widths = [w] * nb_cols

            table_data = []
            # Ligne d'en-tête
            h_row = [Paragraph(inline_markdown_to_reportlab(col), style_table_header) for col in header]
            table_data.append(h_row)

            # Lignes de données
            for row in rows:
                r_row = []
                for cell in row:
                    r_row.append(Paragraph(inline_markdown_to_reportlab(cell), style_table_cell))
                table_data.append(r_row)

            t_table = Table(table_data, colWidths=col_widths, repeatRows=1)
            t_style = [
                ("BACKGROUND", (0, 0), (-1, 0), COLOR_BRUN),
                ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
                ("ALIGN", (0, 0), (-1, -1), "LEFT"),
                ("VALIGN", (0, 0), (-1, -1), "TOP"),
                ("TOPPADDING", (0, 0), (-1, -1), 4),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
                ("LEFTPADDING", (0, 0), (-1, -1), 5),
                ("RIGHTPADDING", (0, 0), (-1, -1), 5),
                ("GRID", (0, 0), (-1, -1), 0.5, COLOR_BORDURE),
            ]
            # Zébrures des lignes
            for r_idx in range(1, len(table_data)):
                if r_idx % 2 == 0:
                    t_style.append(("BACKGROUND", (0, r_idx), (-1, r_idx), COLOR_ZEBRE))
                else:
                    t_style.append(("BACKGROUND", (0, r_idx), (-1, r_idx), colors.white))

            t_table.setStyle(TableStyle(t_style))
            story.append(Spacer(1, 5))
            story.append(t_table)
            story.append(Spacer(1, 8))

        elif b_type == "hr":
            story.append(Spacer(1, 4))
            story.append(HRFlowable(width="100%", thickness=0.5, color=COLOR_BORDURE, spaceAfter=8))

    canvas_maker = NumberedCanvas
    doc.build(story, canvasmaker=canvas_maker)
    return doc.page


def set_cell_background(cell, fill_hex: str):
    """Applique une couleur de fond hexadécimale à une cellule Word."""
    tc_pr = cell._tc.get_or_add_tcPr()
    shd = parse_xml(f'<w:shd {nsdecls("w")} w:fill="{fill_hex.replace("#", "")}"/>')
    tc_pr.append(shd)


def set_cell_margins(cell, top=100, bottom=100, left=150, right=150):
    """Configure les marges internes (padding) d'une cellule Word en dxa (1 pt = 20 dxa)."""
    tc_pr = cell._tc.get_or_add_tcPr()
    tc_mar = parse_xml(
        f'<w:tcMar {nsdecls("w")}>'
        f'<w:top w:w="{top}" w:type="dxa"/>'
        f'<w:bottom w:w="{bottom}" w:type="dxa"/>'
        f'<w:left w:w="{left}" w:type="dxa"/>'
        f'<w:right w:w="{right}" w:type="dxa"/>'
        f"</w:tcMar>"
    )
    tc_pr.append(tc_mar)


def generer_docx(blocks, output_path: Path):
    """Génère le document Word (.docx) fidèle à la charte CIAT."""
    doc = DocxDocument()

    # Configuration des marges de la première section (A4, 2 cm / ~0.8 pouce)
    section = doc.sections[0]
    section.top_margin = Inches(0.75)
    section.bottom_margin = Inches(0.75)
    section.left_margin = Inches(0.75)
    section.right_margin = Inches(0.75)
    section.page_width = Inches(8.27)
    section.page_height = Inches(11.69)

    # En-tête
    header = section.header
    p_header = header.paragraphs[0]
    p_header.alignment = WD_ALIGN_PARAGRAPH.RIGHT
    r_hdr_bold = p_header.add_run("CIAT — ISEP Diamniadio  |  ")
    r_hdr_bold.font.name = "Calibri"
    r_hdr_bold.font.size = Pt(8.5)
    r_hdr_bold.font.bold = True
    r_hdr_bold.font.color.rgb = RGB_BRUN

    r_hdr = p_header.add_run("Rapport Final de Projet • Évaluation Pratique IA Générative")
    r_hdr.font.name = "Calibri"
    r_hdr.font.size = Pt(8.5)
    r_hdr.font.color.rgb = RGB_GRIS

    # Pied de page
    footer = section.footer
    p_footer = footer.paragraphs[0]
    p_footer.alignment = WD_ALIGN_PARAGRAPH.CENTER
    r_ftr = p_footer.add_run(
        "Plateforme Numérique CIAT  •  Livrable Obligatoire N° 6  •  Lead technique : Lansana Coly"
    )
    r_ftr.font.name = "Calibri"
    r_ftr.font.size = Pt(8.5)
    r_ftr.font.color.rgb = RGB_GRIS

    # Insertion du logo CIAT si disponible
    if LOGO_PATH.exists():
        p_logo = doc.add_paragraph()
        p_logo.alignment = WD_ALIGN_PARAGRAPH.LEFT
        r_logo = p_logo.add_run()
        r_logo.add_picture(str(LOGO_PATH), width=Inches(2.2))
        p_logo.paragraph_format.space_after = Pt(8)

    for b in blocks:
        b_type = b["type"]

        if b_type == "h1":
            p = doc.add_paragraph()
            p.paragraph_format.space_before = Pt(6)
            p.paragraph_format.space_after = Pt(8)
            r = p.add_run(clean_markdown_inline(b["text"]))
            r.font.name = "Calibri"
            r.font.size = Pt(18)
            r.font.bold = True
            r.font.color.rgb = RGB_BRUN

        elif b_type == "h2":
            p = doc.add_paragraph()
            p.paragraph_format.space_before = Pt(14)
            p.paragraph_format.space_after = Pt(4)
            p.paragraph_format.keep_with_next = True
            r = p.add_run(clean_markdown_inline(b["text"]))
            r.font.name = "Calibri"
            r.font.size = Pt(13)
            r.font.bold = True
            r.font.color.rgb = RGB_BRUN

        elif b_type == "h3":
            p = doc.add_paragraph()
            p.paragraph_format.space_before = Pt(10)
            p.paragraph_format.space_after = Pt(3)
            p.paragraph_format.keep_with_next = True
            r = p.add_run(clean_markdown_inline(b["text"]))
            r.font.name = "Calibri"
            r.font.size = Pt(11)
            r.font.bold = True
            r.font.color.rgb = RGB_TEXTE

        elif b_type == "paragraph":
            p = doc.add_paragraph()
            p.paragraph_format.space_after = Pt(5)
            p.paragraph_format.line_spacing = 1.15
            p.alignment = WD_ALIGN_PARAGRAPH.JUSTIFY
            r = p.add_run(clean_markdown_inline(b["text"]))
            r.font.name = "Calibri"
            r.font.size = Pt(10)
            r.font.color.rgb = RGB_TEXTE

        elif b_type == "bullet":
            p = doc.add_paragraph(style="List Bullet")
            p.paragraph_format.space_after = Pt(3)
            p.paragraph_format.line_spacing = 1.15
            r = p.add_run(clean_markdown_inline(b["text"]))
            r.font.name = "Calibri"
            r.font.size = Pt(10)
            r.font.color.rgb = RGB_TEXTE

        elif b_type == "numbered":
            p = doc.add_paragraph(style="List Number")
            p.paragraph_format.space_after = Pt(3)
            p.paragraph_format.line_spacing = 1.15
            r = p.add_run(clean_markdown_inline(b["text"]))
            r.font.name = "Calibri"
            r.font.size = Pt(10)
            r.font.color.rgb = RGB_TEXTE

        elif b_type == "blockquote":
            # Encadré dans un tableau à 1 cellule avec fond beige
            table = doc.add_table(rows=1, cols=1)
            table.alignment = WD_TABLE_ALIGNMENT.CENTER
            table.autofit = False
            cell = table.cell(0, 0)
            cell.width = Inches(6.7)
            set_cell_background(cell, "FAF4EE")
            set_cell_margins(cell, top=140, bottom=140, left=200, right=200)

            p_cell = cell.paragraphs[0]
            p_cell.paragraph_format.space_after = Pt(0)
            p_cell.paragraph_format.line_spacing = 1.15
            r = p_cell.add_run(clean_markdown_inline(b["text"]))
            r.font.name = "Calibri"
            r.font.size = Pt(9)
            r.font.italic = True
            r.font.color.rgb = RGB_TEXTE

            # Espace après la boîte
            p_sp = doc.add_paragraph()
            p_sp.paragraph_format.space_after = Pt(6)

        elif b_type == "code":
            # Schéma ASCII ou code dans une boîte de texte monospace
            table = doc.add_table(rows=1, cols=1)
            table.alignment = WD_TABLE_ALIGNMENT.CENTER
            table.autofit = False
            cell = table.cell(0, 0)
            cell.width = Inches(6.7)
            set_cell_background(cell, "F9F7F4")
            set_cell_margins(cell, top=100, bottom=100, left=150, right=150)

            p_cell = cell.paragraphs[0]
            p_cell.paragraph_format.space_after = Pt(0)
            p_cell.paragraph_format.line_spacing = 1.0
            r = p_cell.add_run(b["text"])
            r.font.name = "Consolas"
            r.font.size = Pt(7.5)
            r.font.color.rgb = RGB_BRUN

            p_sp = doc.add_paragraph()
            p_sp.paragraph_format.space_after = Pt(6)

        elif b_type == "table":
            header = b["header"]
            rows = b["rows"]
            table = doc.add_table(rows=len(rows) + 1, cols=len(header))
            table.alignment = WD_TABLE_ALIGNMENT.CENTER
            table.autofit = True

            # En-têtes
            hdr_cells = table.rows[0].cells
            for col_idx, text in enumerate(header):
                hdr_cells[col_idx].text = clean_markdown_inline(text)
                set_cell_background(hdr_cells[col_idx], "612D10")
                set_cell_margins(hdr_cells[col_idx], top=80, bottom=80, left=100, right=100)
                p = hdr_cells[col_idx].paragraphs[0]
                p.paragraph_format.space_after = Pt(0)
                if p.runs:
                    p.runs[0].font.name = "Calibri"
                    p.runs[0].font.size = Pt(8.5)
                    p.runs[0].font.bold = True
                    p.runs[0].font.color.rgb = RGBColor(255, 255, 255)

            # Lignes de données
            for row_idx, row in enumerate(rows):
                row_cells = table.rows[row_idx + 1].cells
                fill_color = "F5EFE9" if row_idx % 2 == 1 else "FFFFFF"
                for col_idx, cell_text in enumerate(row):
                    if col_idx < len(row_cells):
                        row_cells[col_idx].text = clean_markdown_inline(cell_text)
                        set_cell_background(row_cells[col_idx], fill_color)
                        set_cell_margins(row_cells[col_idx], top=70, bottom=70, left=100, right=100)
                        p = row_cells[col_idx].paragraphs[0]
                        p.paragraph_format.space_after = Pt(0)
                        p.paragraph_format.line_spacing = 1.05
                        if p.runs:
                            p.runs[0].font.name = "Calibri"
                            p.runs[0].font.size = Pt(8)
                            p.runs[0].font.color.rgb = RGB_TEXTE

            p_sp = doc.add_paragraph()
            p_sp.paragraph_format.space_after = Pt(6)

        elif b_type == "hr":
            p = doc.add_paragraph()
            p.paragraph_format.space_before = Pt(4)
            p.paragraph_format.space_after = Pt(6)

    doc.save(str(output_path))


def main():
    print("=" * 70)
    print("GÉNÉRATION DU RAPPORT DE PROJET CIAT (FORMAT DE REMISE OFFICIEL)")
    print("=" * 70)

    if not MD_PATH.exists():
        print(f"ERREUR : Fichier source introuvable : {MD_PATH}")
        sys.exit(1)

    print(f"1. Lecture de la source markdown : {MD_PATH}")
    md_content = MD_PATH.read_text(encoding="utf-8")

    print("2. Découpage en blocs sémantiques...")
    blocks = parse_markdown(md_content)
    print(f"   -> {len(blocks)} blocs identifiés (titres, tableaux, citations, schémas).")

    print(f"3. Génération du PDF avec ReportLab ({PDF_PATH})...")
    # First pass to measure page count
    total_pages = generer_pdf(blocks, PDF_PATH)
    print(f"   -> PDF généré avec succès.")
    print(f"   -> Nombre de pages réelles : {total_pages} pages.")

    print(f"4. Génération du document Word avec python-docx ({DOCX_PATH})...")
    generer_docx(blocks, DOCX_PATH)
    print(f"   -> Document Word (.docx) généré avec succès.")

    print("=" * 70)
    print("CONTRÔLE DE CONFORMITÉ DU VOLUME DOCUMENTAIRE :")
    print(f"- Exigence académique : entre 5 et 10 pages réelles.")
    print(f"- Résultat mesuré : {total_pages} pages.")

    if 5 <= total_pages <= 10:
        print(f"[CONFORME] Le document respecte rigoureusement la contrainte ({total_pages} pages).")
    else:
        print(
            f"[NON CONFORME] Le document compte {total_pages} pages (exigé entre 5 et 10). "
            f"Ajuster la mise en page ou la densité sans inventer de contenu."
        )
        sys.exit(2)

    print("=" * 70)
    print("Fichiers livrables prêts :")
    print(f"  - PDF  : {PDF_PATH}")
    print(f"  - Word : {DOCX_PATH}")
    print(f"Commande de régénération :")
    print(f"  .\\backend\\.venv\\Scripts\\python.exe scripts/generer_rapport.py")
    print("=" * 70)


if __name__ == "__main__":
    main()
