"""Module d'export de documents en formats Word (.docx) et PDF (.pdf) conforme à la charte CIAT.

Garantit un rendu haute fidélité calqué sur les Canvas graphiques officiels :
- Rendu Certificat & Attestation : double filet or/terracotta, en-tête républicain, sceau officiel.
- Rendu Convention & Accords : en-tête bilatéral, articles numérotés, double bloc de signature.
- Rendu Administratif / Appel : bandeau officiel ISEP CIAT, métadonnées, pagination et paraphe.
- Nettoyage strict des caractères Unicode non supportés (élimination définitive des carrés noirs ■).
- Interprétation Markdown complète (**gras** -> <b>, *italique* -> <i>, listes à puces).
"""
import io
import re
from xml.sax.saxutils import escape as xml_escape

from docx import Document as DocxDocument
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.shared import Inches, Pt, RGBColor

from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.pdfgen import canvas
from reportlab.platypus import (
    HRFlowable,
    KeepTogether,
    Paragraph,
    SimpleDocTemplate,
    Spacer,
    Table,
    TableStyle,
)

# Palette officielle CIAT
COULEUR_BRUN_HEX = "#612D10"
COULEUR_OR_HEX = "#C99A68"
COULEUR_TEXTE_HEX = "#24140D"
COULEUR_FOND_LEGER = "#FAF7F2"
COULEUR_GRIS_BORDURE = "#E8DFD5"

COULEUR_BRUN_DOCX = RGBColor(97, 45, 16)
COULEUR_OR_DOCX = RGBColor(201, 154, 104)
COULEUR_TEXTE_DOCX = RGBColor(36, 20, 13)
COULEUR_GRIS_DOCX = RGBColor(120, 120, 120)


def assainir_texte_export(texte: str) -> str:
    """Normalise la chaîne pour éliminer les caractères exotiques provoquant des carrés noirs (■)."""
    if not texte:
        return ""
    t = str(texte)
    # Remplacement des tirets spéciaux et insécables
    t = t.replace("\u2011", "-")  # non-breaking hyphen
    t = t.replace("\u2013", "-")  # en dash
    t = t.replace("\u2014", "-")  # em dash
    t = t.replace("\u2212", "-")  # minus sign
    # Remplacement des espaces insécables et fines
    t = t.replace("\u202f", " ")  # narrow no-break space
    t = t.replace("\u00a0", " ")  # no-break space
    t = t.replace("\u200b", "")   # zero-width space
    # Remplacement des guillemets et apostrophes typographiques
    t = t.replace("\u2018", "'").replace("\u2019", "'")
    t = t.replace("\u201c", '"').replace("\u201d", '"')
    t = t.replace("\u00ab", '"').replace("\u00bb", '"')
    # Puces
    t = t.replace("\u2022", "-")
    # Supprime tout carré noir résiduel
    t = t.replace("■", "-")
    return t


def markdown_vers_reportlab(texte: str) -> str:
    """Convertit le Markdown standard en balises XML sécurisées comprises par ReportLab."""
    t = assainir_texte_export(texte)
    # Échapper les caractères XML réservés
    t = xml_escape(t)
    # Remplacer le gras **texte** par <b>texte</b>
    t = re.sub(r"\*\*(.+?)\*\*", r"<b>\1</b>", t)
    # Remplacer l'italique *texte* par <i>texte</i>
    t = re.sub(r"\*(.+?)\*", r"<i>\1</i>", t)
    # Mettre en évidence les mentions [À COMPLÉTER : ...]
    t = re.sub(
        r"\[À COMPLÉTER\s*:\s*([^\]]+)\]",
        r'<font color="#B45309"><b>[À COMPLÉTER : \1]</b></font>',
        t,
        flags=re.IGNORECASE,
    )
    return t


# ==============================================================================
# Canvas personnalisés ReportLab pour chaque famille de document
# ==============================================================================

class _CanvasCertificat(canvas.Canvas):
    """Canvas avec bordure ornementale et sceau officiel façon diplôme/attestation."""

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
            self._dessiner_cadre_certificat(num_pages)
            super().showPage()
        super().save()

    def _dessiner_cadre_certificat(self, num_pages):
        self.saveState()
        w, h = 595.27, 841.89  # A4

        # 1. Double bordure ornementale
        # Bordure extérieure Terre cuite
        self.setStrokeColor(colors.HexColor(COULEUR_BRUN_HEX))
        self.setLineWidth(2.5)
        self.rect(26, 26, w - 52, h - 52)

        # Bordure intérieure Dorée
        self.setStrokeColor(colors.HexColor(COULEUR_OR_HEX))
        self.setLineWidth(1.0)
        self.rect(31, 31, w - 62, h - 62)

        # Coins décoratifs
        self.setFillColor(colors.HexColor(COULEUR_BRUN_HEX))
        for x in (26, w - 34):
            for y in (26, h - 34):
                self.rect(x, y, 8, 8, fill=1, stroke=0)

        # 2. Sceau doré dessiné en bas à droite
        cx, cy = w - 90, 75
        self.setStrokeColor(colors.HexColor(COULEUR_OR_HEX))
        self.setLineWidth(1.5)
        self.setFillColor(colors.HexColor("#FAF3EC"))
        self.circle(cx, cy, 30, fill=1, stroke=1)
        self.setLineWidth(0.8)
        self.circle(cx, cy, 26, fill=0, stroke=1)

        # Texte dans le sceau
        self.setFont("Helvetica-Bold", 6.5)
        self.setFillColor(colors.HexColor(COULEUR_BRUN_HEX))
        self.drawCentredString(cx, cy + 9, "RÉPUBLIQUE DU SÉNÉGAL")
        self.setFont("Helvetica-Bold", 8)
        self.drawCentredString(cx, cy - 1, "★ CIAT ★")
        self.setFont("Helvetica", 6)
        self.drawCentredString(cx, cy - 10, "SCEAU OFFICIEL")

        # Rubans sous le sceau
        self.setFillColor(colors.HexColor(COULEUR_BRUN_HEX))
        self.setStrokeColor(colors.HexColor(COULEUR_OR_HEX))
        self.setLineWidth(0.5)
        path1 = self.beginPath()
        path1.moveTo(cx - 10, cy - 26)
        path1.lineTo(cx - 16, cy - 48)
        path1.lineTo(cx - 8, cy - 44)
        path1.lineTo(cx - 3, cy - 48)
        path1.lineTo(cx - 3, cy - 28)
        path1.close()
        self.drawPath(path1, fill=1, stroke=1)

        path2 = self.beginPath()
        path2.moveTo(cx + 3, cy - 28)
        path2.lineTo(cx + 3, cy - 48)
        path2.lineTo(cx + 8, cy - 44)
        path2.lineTo(cx + 16, cy - 48)
        path2.lineTo(cx + 10, cy - 26)
        path2.close()
        self.drawPath(path2, fill=1, stroke=1)

        # 3. Mention légale de bas de page
        self.setFont("Helvetica", 7.5)
        self.setFillColor(colors.HexColor("#777777"))
        self.drawString(45, 42, "Centre d'Innovation et d'Accélération Technologique (CIAT) — ISEP Diamniadio")
        self.drawRightString(w - 45, 42, f"Document certifié conforme • Page {self._pageNumber}/{num_pages}")

        self.restoreState()


class _CanvasStandard(canvas.Canvas):
    """Canvas institutionnel moderne pour conventions, fiches, appels et rapports."""

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
            self._dessiner_en_tete_pied(num_pages)
            super().showPage()
        super().save()

    def _dessiner_en_tete_pied(self, num_pages):
        self.saveState()
        w, h = 595.27, 841.89

        # Bande supérieure officielle CIAT
        self.setFillColor(colors.HexColor(COULEUR_BRUN_HEX))
        self.rect(40, h - 35, w - 80, 3, fill=1, stroke=0)
        self.setFillColor(colors.HexColor(COULEUR_OR_HEX))
        self.rect(40, h - 37, 80, 2, fill=1, stroke=0)

        # En-tête textuel
        self.setFont("Helvetica-Bold", 7.5)
        self.setFillColor(colors.HexColor(COULEUR_BRUN_HEX))
        self.drawString(40, h - 28, "RÉPUBLIQUE DU SÉNÉGAL")
        self.setFont("Helvetica", 7.5)
        self.setFillColor(colors.HexColor("#555555"))
        self.drawString(160, h - 28, "• Ministère de l'Enseignement Supérieur, de la Recherche et de l'Innovation")
        self.drawRightString(w - 40, h - 28, "CIAT — ISEP Diamniadio")

        # Pied de page institutionnel
        self.setStrokeColor(colors.HexColor(COULEUR_GRIS_BORDURE))
        self.setLineWidth(0.6)
        self.line(40, 42, w - 40, 42)

        self.setFont("Helvetica", 7.5)
        self.setFillColor(colors.HexColor("#777777"))
        self.drawString(40, 30, "Plateforme Officielle CIAT • Diamniadio, Cité du Savoir • contact@ciat.sn")
        self.drawRightString(w - 40, 30, f"Page {self._pageNumber} / {num_pages}")

        self.restoreState()


# ==============================================================================
# Export PDF (.pdf) Haute Fidélité
# ==============================================================================

def generer_export_pdf(document, version=None) -> io.BytesIO:
    """Génère un fichier PDF officiel fidèle au Canva choisi (Attestation, Convention, Fiche, Appel)."""
    if version is None:
        version = document.derniere_version

    modele_code = (getattr(document.modele, "type", None) and document.modele.type.code or "").lower()
    modele_nom = (document.modele.nom or "").lower()
    is_attestation = "attestation" in modele_code or "attestation" in modele_nom
    is_convention = "convention" in modele_code or "convention" in modele_nom

    buf = io.BytesIO()
    # Marges adaptées selon le type de canva
    left_m = 48 if is_attestation else 44
    right_m = 48 if is_attestation else 44
    top_m = 65 if is_attestation else 55
    bottom_m = 65 if is_attestation else 55

    doc_pdf = SimpleDocTemplate(
        buf,
        pagesize=A4,
        leftMargin=left_m,
        rightMargin=right_m,
        topMargin=top_m,
        bottomMargin=bottom_m,
    )

    styles = getSampleStyleSheet()

    # Styles typographiques
    style_titre_certificat = ParagraphStyle(
        "Cert_Titre",
        parent=styles["Normal"],
        fontName="Helvetica-Bold",
        fontSize=18,
        leading=22,
        alignment=1,  # Centré
        textColor=colors.HexColor(COULEUR_BRUN_HEX),
        spaceAfter=12,
        spaceBefore=10,
    )

    style_titre_standard = ParagraphStyle(
        "Std_Titre",
        parent=styles["Heading1"],
        fontName="Helvetica-Bold",
        fontSize=16,
        leading=20,
        textColor=colors.HexColor(COULEUR_BRUN_HEX),
        spaceAfter=8,
    )

    style_meta = ParagraphStyle(
        "CIAT_Meta",
        parent=styles["Normal"],
        fontName="Helvetica",
        fontSize=8.5,
        leading=11,
        textColor=colors.HexColor("#666666"),
        spaceAfter=14,
    )

    style_section_titre = ParagraphStyle(
        "CIAT_SectionTitre",
        parent=styles["Heading2"],
        fontName="Helvetica-Bold",
        fontSize=11,
        leading=15,
        textColor=colors.HexColor(COULEUR_BRUN_HEX),
        spaceBefore=10,
        spaceAfter=4,
        keepWithNext=True,
    )

    style_corps = ParagraphStyle(
        "CIAT_Corps",
        parent=styles["Normal"],
        fontName="Helvetica",
        fontSize=9.5,
        leading=13.5,
        textColor=colors.HexColor(COULEUR_TEXTE_HEX),
        spaceAfter=4,
    )

    style_corps_centre = ParagraphStyle(
        "CIAT_CorpsCentre",
        parent=style_corps,
        alignment=1,
        fontSize=10,
        leading=14.5,
        spaceAfter=6,
    )

    style_liste = ParagraphStyle(
        "CIAT_Liste",
        parent=style_corps,
        leftIndent=14,
        spaceAfter=2,
    )

    elements = []

    # 1. En-tête visuel spécifique
    if is_attestation:
        elements.append(
            Paragraph(
                "<b>RÉPUBLIQUE DU SÉNÉGAL</b><br/>"
                "<font size=8.5 color='#555555'>Ministère de l'Enseignement Supérieur, de la Recherche et de l'Innovation</font><br/>"
                "<b>CENTRE D'INNOVATION ET D'ACCÉLÉRATION TECHNOLOGIQUE (CIAT)</b><br/>"
                "<font size=8 color='#C99A68'><b>ISEP DIAMNIADIO • CITÉ DU SAVOIR</b></font>",
                ParagraphStyle("HeaderCert", parent=styles["Normal"], alignment=1, fontSize=10, leading=13, spaceAfter=14),
            )
        )
        elements.append(HRFlowable(width="60%", thickness=1.5, color=colors.HexColor(COULEUR_OR_HEX), spaceAfter=12))
        elements.append(Paragraph(assainir_texte_export(document.titre).upper(), style_titre_certificat))
    else:
        elements.append(Paragraph(assainir_texte_export(document.titre), style_titre_standard))

    # Métadonnées
    statut_str = document.get_statut_display() if hasattr(document, "get_statut_display") else str(document.statut).capitalize()
    version_num = version.numero if version else document.version_courante
    meta_text = (
        f"<b>Statut :</b> {statut_str}  |  <b>Version :</b> v{version_num}  |  "
        f"<b>Gabarit :</b> {assainir_texte_export(document.modele.nom)}  |  "
        f"<b>Réf :</b> CIAT/2026/DOC-{document.id:03d}"
    )
    elements.append(Paragraph(meta_text, style_meta))

    if not is_attestation:
        elements.append(HRFlowable(width="100%", thickness=1, color=colors.HexColor(COULEUR_GRIS_BORDURE), spaceAfter=12))

    # 2. Sections du document
    sections = version.sections if version else []
    for idx, s in enumerate(sections):
        titre = s.get("titre") or s.get("code", "")
        titre_propre = assainir_texte_export(titre)

        # Style de titre de section
        if is_attestation:
            elements.append(
                Paragraph(
                    f"<b>{titre_propre.upper()}</b>",
                    ParagraphStyle(
                        f"SecCert_{idx}",
                        parent=style_section_titre,
                        alignment=1,
                        fontSize=10,
                        spaceBefore=8,
                        spaceAfter=3,
                        textColor=colors.HexColor(COULEUR_BRUN_HEX),
                    ),
                )
            )
        elif is_convention:
            elements.append(
                Paragraph(
                    f"<b>ARTICLE {idx + 1} — {titre_propre.upper()}</b>",
                    style_section_titre,
                )
            )
        else:
            elements.append(Paragraph(f"<b>{idx + 1}. {titre_propre}</b>", style_section_titre))

        # Contenu de section assaini et formaté
        contenu = s.get("contenu", "")
        for raw_line in contenu.split("\n"):
            line = raw_line.strip()
            if not line:
                elements.append(Spacer(1, 3))
                continue

            parsed_line = markdown_vers_reportlab(line)

            # Traitement des lignes de listes
            if line.startswith(("-", "•", "*")):
                # Nettoyer le préfixe
                clean_bullet = re.sub(r"^[-•*]\s*", "", parsed_line)
                elements.append(Paragraph(f"&bull; {clean_bullet}", style_liste))
            elif re.match(r"^\d+\.\s+", line):
                elements.append(Paragraph(parsed_line, style_liste))
            else:
                if is_attestation and any(kw in titre_propre.lower() for kw in ("bénéficiaire", "statut", "délivrance")):
                    elements.append(Paragraph(parsed_line, style_corps_centre))
                else:
                    elements.append(Paragraph(parsed_line, style_corps))

    # 3. Bloc de signatures officiel en bas
    elements.append(Spacer(1, 14))
    if is_convention:
        # Signatures bilatérales CIAT et Partenaire
        data_sig = [
            [
                Paragraph("<b>Pour le CIAT / ISEP Diamniadio :</b><br/>Le Coordonnateur Général<br/><br/><br/><i>(Cachet officiel et signature)</i>", style_corps),
                Paragraph("<b>Pour l'Entreprise / Le Partenaire :</b><br/>Le Représentant Légal<br/><br/><br/><i>(Cachet officiel et signature)</i>", style_corps),
            ]
        ]
        t_sig = Table(data_sig, colWidths=[240, 240])
        t_sig.setStyle(
            TableStyle([
                ("BACKGROUND", (0, 0), (-1, -1), colors.HexColor(COULEUR_FOND_LEGER)),
                ("BOX", (0, 0), (-1, -1), 0.8, colors.HexColor(COULEUR_GRIS_BORDURE)),
                ("VALIGN", (0, 0), (-1, -1), "TOP"),
                ("PADDING", (0, 0), (-1, -1), 8),
            ])
        )
        elements.append(KeepTogether([t_sig]))
    else:
        # Signature officielle du CIAT avec mention de date et lieu
        data_sig = [
            [
                Paragraph("<b>Fait à Diamniadio, Cité du Savoir</b><br/>Date certifiée conforme", style_corps),
                Paragraph("<b>Pour la Direction du CIAT :</b><br/>Le Coordonnateur Général<br/><br/><br/><i>(Signature et sceau républicain)</i>", style_corps),
            ]
        ]
        t_sig = Table(data_sig, colWidths=[240, 240])
        t_sig.setStyle(
            TableStyle([
                ("VALIGN", (0, 0), (-1, -1), "TOP"),
                ("PADDING", (0, 0), (-1, -1), 6),
            ])
        )
        elements.append(KeepTogether([t_sig]))

    # Choix du canvas selon le gabarit
    canvas_maker = _CanvasCertificat if is_attestation else _CanvasStandard
    doc_pdf.build(elements, canvasmaker=canvas_maker)
    buf.seek(0)
    return buf


# ==============================================================================
# Export Word (.docx) Haute Fidélité
# ==============================================================================

def generer_export_docx(document, version=None) -> io.BytesIO:
    """Génère un fichier Word (.docx) nettoyé et formaté selon la charte CIAT."""
    if version is None:
        version = document.derniere_version

    doc = DocxDocument()

    # En-tête de page
    section = doc.sections[0]
    section.top_margin = Inches(0.8)
    section.bottom_margin = Inches(0.8)
    section.left_margin = Inches(0.9)
    section.right_margin = Inches(0.9)

    header = section.header
    p_header = header.paragraphs[0]
    p_header.text = "Centre d'Innovation, d'Application et de Transfert (CIAT) — ISEP Diamniadio"
    p_header.alignment = WD_ALIGN_PARAGRAPH.RIGHT
    if p_header.runs:
        p_header.runs[0].font.size = Pt(8.5)
        p_header.runs[0].font.color.rgb = COULEUR_GRIS_DOCX

    # Titre du document
    p_title = doc.add_paragraph()
    r_title = p_title.add_run(assainir_texte_export(document.titre))
    r_title.font.size = Pt(18)
    r_title.font.bold = True
    r_title.font.color.rgb = COULEUR_BRUN_DOCX

    # Métadonnées
    p_meta = doc.add_paragraph()
    statut_str = document.get_statut_display() if hasattr(document, "get_statut_display") else str(document.statut).capitalize()
    version_num = version.numero if version else document.version_courante
    meta_text = (
        f"Statut : {statut_str}  |  Version : v{version_num}  |  "
        f"Modèle : {assainir_texte_export(document.modele.nom)}  |  "
        f"Réf : CIAT/2026/DOC-{document.id:03d}"
    )
    r_meta = p_meta.add_run(meta_text)
    r_meta.font.size = Pt(9.5)
    r_meta.font.italic = True
    r_meta.font.color.rgb = COULEUR_GRIS_DOCX

    doc.add_paragraph()  # Ligne d'espacement

    # Sections du document
    sections = version.sections if version else []
    for idx, s in enumerate(sections):
        titre = s.get("titre") or s.get("code", "")

        # Titre de section
        p_sec = doc.add_paragraph()
        r_sec = p_sec.add_run(f"{idx + 1}. {assainir_texte_export(titre)}")
        r_sec.font.size = Pt(12)
        r_sec.font.bold = True
        r_sec.font.color.rgb = COULEUR_BRUN_DOCX

        # Lignes du contenu
        contenu = s.get("contenu", "")
        for raw_line in contenu.split("\n"):
            line = raw_line.strip()
            if not line:
                continue

            p_cont = doc.add_paragraph()
            # Nettoyer et formater le gras markdown dans le run docx
            clean_line = assainir_texte_export(line)
            # Découpage du gras **texte**
            parts = re.split(r"(\*\*.*?\*\*)", clean_line)
            for part in parts:
                if part.startswith("**") and part.endswith("**"):
                    r = p_cont.add_run(part[2:-2])
                    r.font.bold = True
                else:
                    r = p_cont.add_run(part)
                r.font.size = Pt(10)
                r.font.color.rgb = COULEUR_TEXTE_DOCX

    # Pied de page
    footer = section.footer
    p_footer = footer.paragraphs[0]
    p_footer.text = f"Plateforme Numérique CIAT • Document #{document.id} (v{version_num})"
    p_footer.alignment = WD_ALIGN_PARAGRAPH.CENTER
    if p_footer.runs:
        p_footer.runs[0].font.size = Pt(8.5)
        p_footer.runs[0].font.color.rgb = COULEUR_GRIS_DOCX

    buf = io.BytesIO()
    doc.save(buf)
    buf.seek(0)
    return buf
