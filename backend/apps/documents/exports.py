"""Module d'export de documents en formats Word (.docx) et PDF (.pdf) conforme à la charte CIAT.

Charte graphique CIAT / ISEP :
- En-tête : "Centre d'Innovation, d'Application et de Transfert (CIAT) — ISEP Diamniadio"
- Titre principal : Brun CIAT #612D10
- Intertitres (sections) : Brun CIAT #612D10
- Corps de texte : Noir/Brun profond #24140D
- Pagination et mentions du statut et de la version
"""
import io
try:
    from docx import Document as DocxDocument
    from docx.enum.text import WD_ALIGN_PARAGRAPH
    from docx.shared import Pt, RGBColor
    COULEUR_BRUN_DOCX = RGBColor(97, 45, 16)
    COULEUR_TEXTE_DOCX = RGBColor(36, 20, 13)
    COULEUR_GRIS_DOCX = RGBColor(120, 120, 120)
except ImportError:
    DocxDocument = None
    WD_ALIGN_PARAGRAPH = None
    Pt = None
    RGBColor = None
    COULEUR_BRUN_DOCX = None
    COULEUR_TEXTE_DOCX = None
    COULEUR_GRIS_DOCX = None
from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.pdfgen import canvas
from reportlab.platypus import HRFlowable, Paragraph, SimpleDocTemplate, Spacer


# Couleurs CIAT
COULEUR_BRUN_HEX = "#612D10"
COULEUR_TEXTE_HEX = "#24140D"


# ==============================================================================
# Export Word (.docx)
# ==============================================================================

def generer_export_docx(document, version=None) -> io.BytesIO:
    """Génère un fichier Word (.docx) formaté selon la charte CIAT."""
    if version is None:
        version = document.derniere_version

    doc = DocxDocument()

    # En-tête de page
    section = doc.sections[0]
    header = section.header
    p_header = header.paragraphs[0]
    p_header.text = "Centre d'Innovation, d'Application et de Transfert (CIAT) — ISEP Diamniadio"
    p_header.alignment = WD_ALIGN_PARAGRAPH.RIGHT
    if p_header.runs:
        p_header.runs[0].font.size = Pt(8.5)
        p_header.runs[0].font.color.rgb = COULEUR_GRIS_DOCX

    # Titre du document
    p_title = doc.add_paragraph()
    r_title = p_title.add_run(document.titre)
    r_title.font.size = Pt(20)
    r_title.font.bold = True
    r_title.font.color.rgb = COULEUR_BRUN_DOCX

    # Métadonnées (Statut, Version, Modèle)
    p_meta = doc.add_paragraph()
    statut_str = document.get_statut_display() if hasattr(document, "get_statut_display") else document.statut.capitalize()
    version_num = version.numero if version else document.version_courante
    meta_text = f"Statut : {statut_str}  |  Version : v{version_num}  |  Modèle : {document.modele.nom}"
    r_meta = p_meta.add_run(meta_text)
    r_meta.font.size = Pt(10)
    r_meta.font.italic = True
    r_meta.font.color.rgb = COULEUR_GRIS_DOCX

    # Ligne de séparation
    doc.add_paragraph()

    # Sections du document
    sections = version.sections if version else []
    for s in sections:
        titre = s.get("titre") or s.get("code", "")
        contenu = s.get("contenu", "")

        # Titre de section
        p_sec = doc.add_paragraph()
        r_sec = p_sec.add_run(titre)
        r_sec.font.size = Pt(13)
        r_sec.font.bold = True
        r_sec.font.color.rgb = COULEUR_BRUN_DOCX

        # Paragraphes du contenu
        for line in contenu.split("\n"):
            p_cont = doc.add_paragraph()
            r_cont = p_cont.add_run(line)
            r_cont.font.size = Pt(10.5)
            r_cont.font.color.rgb = COULEUR_TEXTE_DOCX

    # Pied de page
    footer = section.footer
    p_footer = footer.paragraphs[0]
    p_footer.text = f"Plateforme Numérique CIAT  •  Document #{document.id} (v{version_num})"
    p_footer.alignment = WD_ALIGN_PARAGRAPH.CENTER
    if p_footer.runs:
        p_footer.runs[0].font.size = Pt(8.5)
        p_footer.runs[0].font.color.rgb = COULEUR_GRIS_DOCX

    buf = io.BytesIO()
    doc.save(buf)
    buf.seek(0)
    return buf


# ==============================================================================
# Export PDF (.pdf) avec numérotation de pages
# ==============================================================================

class _NumberedCanvas(canvas.Canvas):
    """Canvas personnalisé pour calculer le nombre total de pages et afficher le footer."""

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
        self.setFont("Helvetica", 8)
        self.setFillColor(colors.HexColor("#777777"))

        # En-tête
        self.drawRightString(
            541, 805, "Centre d'Innovation, d'Application et de Transfert (CIAT) — ISEP Diamniadio"
        )
        self.setStrokeColor(colors.HexColor("#E5E7EB"))
        self.setLineWidth(0.6)
        self.line(54, 798, 541, 798)

        # Pied de page
        self.line(54, 45, 541, 45)
        self.drawString(54, 32, "Plateforme Numérique CIAT")
        self.drawRightString(541, 32, f"Page {self._pageNumber} / {page_count}")

        self.restoreState()


def generer_export_pdf(document, version=None) -> io.BytesIO:
    """Génère un fichier PDF formaté selon la charte CIAT."""
    if version is None:
        version = document.derniere_version

    buf = io.BytesIO()
    doc_pdf = SimpleDocTemplate(
        buf,
        pagesize=A4,
        leftMargin=54,
        rightMargin=54,
        topMargin=60,
        bottomMargin=60,
    )

    styles = getSampleStyleSheet()

    style_titre = ParagraphStyle(
        "CIAT_Titre",
        parent=styles["Heading1"],
        fontName="Helvetica-Bold",
        fontSize=18,
        leading=22,
        textColor=colors.HexColor(COULEUR_BRUN_HEX),
        spaceAfter=8,
    )

    style_meta = ParagraphStyle(
        "CIAT_Meta",
        parent=styles["Normal"],
        fontName="Helvetica-Oblique",
        fontSize=9.5,
        leading=12,
        textColor=colors.HexColor("#666666"),
        spaceAfter=12,
    )

    style_section = ParagraphStyle(
        "CIAT_Section",
        parent=styles["Heading2"],
        fontName="Helvetica-Bold",
        fontSize=12,
        leading=15,
        textColor=colors.HexColor(COULEUR_BRUN_HEX),
        spaceBefore=12,
        spaceAfter=5,
        keepWithNext=True,
    )

    style_corps = ParagraphStyle(
        "CIAT_Corps",
        parent=styles["Normal"],
        fontName="Helvetica",
        fontSize=10,
        leading=14,
        textColor=colors.HexColor(COULEUR_TEXTE_HEX),
        spaceAfter=4,
    )

    elements = []

    # Titre
    elements.append(Paragraph(document.titre, style_titre))

    # Métadonnées
    statut_str = document.get_statut_display() if hasattr(document, "get_statut_display") else document.statut.capitalize()
    version_num = version.numero if version else document.version_courante
    meta_text = (
        f"Statut : <b>{statut_str}</b>  |  Version : <b>v{version_num}</b>  |  Modèle : <b>{document.modele.nom}</b>"
    )
    elements.append(Paragraph(meta_text, style_meta))
    elements.append(HRFlowable(width="100%", thickness=1, color=colors.HexColor("#E5E7EB"), spaceAfter=12))

    # Sections
    sections = version.sections if version else []
    for s in sections:
        titre = s.get("titre") or s.get("code", "")
        elements.append(Paragraph(titre, style_section))
        contenu = s.get("contenu", "")
        for line in contenu.split("\n"):
            line = line.strip()
            if line:
                elements.append(Paragraph(line, style_corps))
            else:
                elements.append(Spacer(1, 3))

    doc_pdf.build(elements, canvasmaker=_NumberedCanvas)
    buf.seek(0)
    return buf
