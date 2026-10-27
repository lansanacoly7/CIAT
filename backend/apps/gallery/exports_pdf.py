"""Générateur d'export PDF pour la fiche promotionnelle d'une innovation (Galerie — Phase 6 Pathé).

Conforme à la charte graphique officielle du CIAT / ISEP Diamniadio :
- Brun officiel CIAT : #612D10
- Noir d'encre CIAT : #24140D
- Doré d'accent CIAT : #C49A45
- Beige de fond CIAT : #FAF4EE
- Mise en page condensée sur 1 page A4 unique avec QR Code officiel intégré.
"""
import html
import io
from typing import Optional
from django.utils import timezone
from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.platypus import (
    HRFlowable,
    Image,
    Paragraph,
    SimpleDocTemplate,
    Spacer,
    Table,
    TableStyle,
)

from apps.gallery.qr import generer_qr_code_png

# Palette officielle CIAT
COULEUR_BRUN = colors.HexColor("#612D10")
COULEUR_TEXTE = colors.HexColor("#24140D")
COULEUR_DORE = colors.HexColor("#C49A45")
COULEUR_FOND_BEIGE = colors.HexColor("#FAF4EE")
COULEUR_CARTOUCHE = colors.HexColor("#F5EFEB")
COULEUR_BORDURE = colors.HexColor("#D8D0C5")
COULEUR_GRIS = colors.HexColor("#666666")


def esc(texte: Optional[str]) -> str:
    """Échappe les caractères spéciaux pour le moteur XML interne de ReportLab."""
    if not texte:
        return ""
    return html.escape(str(texte)).replace("\n", "<br/>")


def generer_fiche_promotionnelle_pdf(fiche, base_url: str = "http://127.0.0.1:8000") -> io.BytesIO:
    """Génère un document PDF d'une seule page A4 pour la fiche promotionnelle d'une innovation.

    Contient :
    - En-tête institutionnel CIAT / ISEP Diamniadio
    - Titre du projet et badges (Domaine, Cohorte, Avancement)
    - Problème adressé, Solution innovante, Équipe fondatrice
    - QR code officiel vers la fiche en ligne
    - Pied de page institutionnel

    Args:
        fiche: Instance du modèle FicheInnovation (statut = 'publie').
        base_url: URL de base pour construire l'URL publique de la fiche dans le QR code.

    Returns:
        io.BytesIO: Buffer contenant le flux binaire PDF complet.
    """
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=A4,
        leftMargin=36,
        rightMargin=36,
        topMargin=32,
        bottomMargin=32,
    )

    styles = getSampleStyleSheet()

    style_header_org = ParagraphStyle(
        "FicheHeaderOrg",
        parent=styles["Normal"],
        fontName="Helvetica-Bold",
        fontSize=10,
        leading=13,
        textColor=COULEUR_BRUN,
    )
    style_header_sub = ParagraphStyle(
        "FicheHeaderSub",
        parent=styles["Normal"],
        fontName="Helvetica",
        fontSize=8,
        leading=11,
        textColor=COULEUR_GRIS,
    )
    style_titre_doc = ParagraphStyle(
        "FicheTitreDoc",
        parent=styles["Normal"],
        fontName="Helvetica-Bold",
        fontSize=9,
        leading=12,
        alignment=2,  # Align right
        textColor=COULEUR_DORE,
    )
    style_titre_projet = ParagraphStyle(
        "FicheTitreProjet",
        parent=styles["Normal"],
        fontName="Helvetica-Bold",
        fontSize=17,
        leading=21,
        textColor=COULEUR_BRUN,
    )
    style_badge = ParagraphStyle(
        "FicheBadge",
        parent=styles["Normal"],
        fontName="Helvetica-Bold",
        fontSize=8,
        leading=10,
        textColor=COULEUR_TEXTE,
    )
    style_section_titre = ParagraphStyle(
        "FicheSectionTitre",
        parent=styles["Normal"],
        fontName="Helvetica-Bold",
        fontSize=10,
        leading=13,
        textColor=COULEUR_BRUN,
    )
    style_corps = ParagraphStyle(
        "FicheCorps",
        parent=styles["Normal"],
        fontName="Helvetica",
        fontSize=8.5,
        leading=11.5,
        textColor=COULEUR_TEXTE,
    )
    style_qr_legende = ParagraphStyle(
        "FicheQRLegende",
        parent=styles["Normal"],
        fontName="Helvetica",
        fontSize=7.5,
        leading=10,
        alignment=1,  # Center
        textColor=COULEUR_GRIS,
    )
    style_footer = ParagraphStyle(
        "FicheFooter",
        parent=styles["Normal"],
        fontName="Helvetica",
        fontSize=7,
        leading=9,
        alignment=1,  # Center
        textColor=COULEUR_GRIS,
    )

    story = []

    # 1. En-tête institutionnel
    header_data = [
        [
            Paragraph("CENTRE D'INNOVATION ET D'ACCÉLÉRATION TECHNOLOGIQUE<br/>"
                      "<font size='8' color='#777777'>ISEP Amadou Trawaré de Diamniadio</font>", style_header_org),
            Paragraph("VITRINE DES INNOVATIONS<br/>"
                      "<font size='7' color='#666666'>FICHE OFFICIELLE PROMOTIONNELLE</font>", style_titre_doc),
        ]
    ]
    t_header = Table(header_data, colWidths=[340, 183])
    t_header.setStyle(TableStyle([
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 0),
        ("TOPPADDING", (0, 0), (-1, -1), 0),
    ]))
    story.append(t_header)
    story.append(Spacer(1, 6))
    story.append(HRFlowable(width="100%", thickness=1.5, color=COULEUR_DORE, spaceBefore=0, spaceAfter=8))

    # 2. Titre de la fiche / du projet
    story.append(Paragraph(esc(fiche.titre), style_titre_projet))
    story.append(Spacer(1, 6))

    # 3. Badges métadonnées (Domaine, Cohorte, Avancement)
    domaine_nom = fiche.projet.domaine.nom if fiche.projet and fiche.projet.domaine else "Non renseigné"
    cohorte_nom = fiche.projet.cohorte.nom if fiche.projet and fiche.projet.cohorte else "Non assignée"
    avancement = fiche.avancement or "En cours"

    badges_data = [
        [
            Paragraph(f"<b>DOMAINE :</b> {esc(domaine_nom)}", style_badge),
            Paragraph(f"<b>COHORTE :</b> {esc(cohorte_nom)}", style_badge),
            Paragraph(f"<b>STADE :</b> {esc(avancement)}", style_badge),
        ]
    ]
    t_badges = Table(badges_data, colWidths=[180, 170, 173])
    t_badges.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), COULEUR_FOND_BEIGE),
        ("BOX", (0, 0), (-1, -1), 0.5, COULEUR_BORDURE),
        ("INNERGRID", (0, 0), (-1, -1), 0.5, COULEUR_BORDURE),
        ("TOPPADDING", (0, 0), (-1, -1), 4),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
        ("LEFTPADDING", (0, 0), (-1, -1), 8),
        ("RIGHTPADDING", (0, 0), (-1, -1), 8),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
    ]))
    story.append(t_badges)
    story.append(Spacer(1, 10))

    # 4. Génération du QR Code
    url_fiche = f"{base_url.rstrip('/')}/galerie/{fiche.slug}"
    png_bytes = generer_qr_code_png(url_fiche)
    qr_img = Image(io.BytesIO(png_bytes), width=105, height=105)

    # 5. Disposition en deux colonnes (Contenu descriptif à gauche + Bloc QR code à droite)
    # Colonne gauche : Problème + Solution + Équipe
    col_gauche_story = [
        Paragraph("1. PROBLÈME IDENTIFIÉ", style_section_titre),
        Spacer(1, 3),
        Paragraph(esc(fiche.probleme), style_corps),
        Spacer(1, 8),
        Paragraph("2. SOLUTION INNOVANTE & TECHNOLOGIE", style_section_titre),
        Spacer(1, 3),
        Paragraph(esc(fiche.solution), style_corps),
        Spacer(1, 8),
        Paragraph("3. ÉQUIPE FONDATRICE & PORTEUR", style_section_titre),
        Spacer(1, 3),
        Paragraph(esc(fiche.equipe), style_corps),
    ]

    # Colonne droite : Boîte QR code élégante
    col_droite_data = [
        [Paragraph("<b>DÉCOUVRIR LE PROJET</b>", style_titre_doc)],
        [qr_img],
        [Paragraph(f"Flashez ce code pour accéder à la vitrine en ligne complète et aux médias du projet :<br/><b>{esc(url_fiche)}</b>", style_qr_legende)],
        [Spacer(1, 4)],
        [Paragraph(f"<b>Date d'édition :</b> {timezone.now().strftime('%d/%m/%Y')}", style_qr_legende)],
    ]
    t_droite = Table(col_droite_data, colWidths=[140])
    t_droite.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), COULEUR_CARTOUCHE),
        ("BOX", (0, 0), (-1, -1), 1, COULEUR_DORE),
        ("ALIGN", (0, 0), (-1, -1), "CENTER"),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("TOPPADDING", (0, 0), (-1, -1), 6),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
        ("LEFTPADDING", (0, 0), (-1, -1), 6),
        ("RIGHTPADDING", (0, 0), (-1, -1), 6),
    ]))

    corps_data = [
        [col_gauche_story, t_droite]
    ]
    t_corps = Table(corps_data, colWidths=[370, 153])
    t_corps.setStyle(TableStyle([
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("LEFTPADDING", (0, 0), (-1, -1), 0),
        ("RIGHTPADDING", (0, 0), (-1, -1), 0),
        ("TOPPADDING", (0, 0), (-1, -1), 0),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 0),
    ]))
    story.append(t_corps)

    # 6. Pied de page
    story.append(Spacer(1, 14))
    story.append(HRFlowable(width="100%", thickness=0.8, color=COULEUR_BORDURE, spaceBefore=0, spaceAfter=6))
    story.append(
        Paragraph(
            "Centre d'Innovation et d'Accélération Technologique (CIAT) — Institut Supérieur d'Enseignement Professionnel (ISEP) Amadou Trawaré de Diamniadio<br/>"
            "Document officiel d'information publique — Reproduction et diffusion autorisées — Contact : contact@ciat.sn",
            style_footer,
        )
    )

    doc.build(story)
    buffer.seek(0)
    return buffer
