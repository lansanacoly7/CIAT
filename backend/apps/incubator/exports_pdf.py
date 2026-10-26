"""Générateur d'exports PDF pour le module incubateur (P2 / Phase 4 Pathé).

Conforme à la charte graphique officielle du CIAT / ISEP Diamniadio :
- Brun officiel CIAT : #612D10
- Noir d'encre CIAT : #24140D
- Doré d'accent CIAT : #C49A45
- Beige de fond CIAT : #FAF4EE
- En-tête institutionnel ISEP Diamniadio
- Numérotation dynamique des pages (Page X sur Y)
"""
import io
from django.utils import timezone
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

# Palette officielle CIAT
COULEUR_BRUN_HEX = "#612D10"
COULEUR_TEXTE_HEX = "#24140D"
COULEUR_DORE_HEX = "#C49A45"
COULEUR_FOND_BEIGE = "#FAF4EE"
COULEUR_ZEBRE = "#F9F7F5"
COULEUR_BORDURE = "#D8D0C5"


class _NumberedCanvas(canvas.Canvas):
    """Canvas personnalisé ReportLab pour calculer le nombre total de pages et ajouter header/footer."""

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

        # En-tête sur chaque page
        self.drawRightString(
            541, 805, "Centre d'Innovation, d'Application et de Transfert (CIAT) — ISEP Diamniadio"
        )
        self.setStrokeColor(colors.HexColor("#E5E0D8"))
        self.setLineWidth(0.6)
        self.line(54, 798, 541, 798)

        # Pied de page sur chaque page
        self.line(54, 45, 541, 45)
        self.drawString(54, 32, "Plateforme Numérique CIAT  •  Document officiel")
        page_str = f"Page {self._pageNumber} sur {page_count}"
        self.drawRightString(541, 32, page_str)

        self.restoreState()


# ==============================================================================
# T1 — Accusé de réception de candidature
# ==============================================================================

def generer_accuse_reception_pdf(dossier) -> io.BytesIO:
    """Génère le PDF officiel d'accusé de réception pour un dossier soumis."""
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

    c_brun = colors.HexColor(COULEUR_BRUN_HEX)
    c_texte = colors.HexColor(COULEUR_TEXTE_HEX)
    c_dore = colors.HexColor(COULEUR_DORE_HEX)
    c_fond_beige = colors.HexColor(COULEUR_FOND_BEIGE)
    c_border = colors.HexColor(COULEUR_BORDURE)
    c_zebra = colors.HexColor(COULEUR_ZEBRE)

    style_institution = ParagraphStyle(
        "AccuseInstitution",
        parent=styles["Normal"],
        fontName="Helvetica",
        fontSize=8.5,
        leading=11,
        textColor=colors.HexColor("#666666"),
        alignment=0,
    )

    style_titre = ParagraphStyle(
        "AccuseTitre",
        parent=styles["Heading1"],
        fontName="Helvetica-Bold",
        fontSize=18,
        leading=22,
        textColor=c_brun,
        spaceAfter=4,
    )

    style_sous_titre = ParagraphStyle(
        "AccuseSousTitre",
        parent=styles["Normal"],
        fontName="Helvetica-Bold",
        fontSize=11,
        leading=15,
        textColor=c_texte,
        spaceAfter=12,
    )

    style_h2 = ParagraphStyle(
        "AccuseH2",
        parent=styles["Heading2"],
        fontName="Helvetica-Bold",
        fontSize=12,
        leading=16,
        textColor=c_brun,
        spaceBefore=12,
        spaceAfter=6,
        keepWithNext=True,
    )

    style_label = ParagraphStyle(
        "AccuseLabel",
        parent=styles["Normal"],
        fontName="Helvetica-Bold",
        fontSize=9.5,
        leading=13,
        textColor=c_brun,
    )

    style_valeur = ParagraphStyle(
        "AccuseValeur",
        parent=styles["Normal"],
        fontName="Helvetica",
        fontSize=9.5,
        leading=13,
        textColor=c_texte,
    )

    style_th = ParagraphStyle(
        "AccuseTH",
        parent=styles["Normal"],
        fontName="Helvetica-Bold",
        fontSize=9,
        leading=12,
        textColor=colors.white,
    )

    style_td = ParagraphStyle(
        "AccuseTD",
        parent=styles["Normal"],
        fontName="Helvetica",
        fontSize=9,
        leading=12,
        textColor=c_texte,
    )

    style_mention_titre = ParagraphStyle(
        "AccuseMentionTitre",
        parent=styles["Normal"],
        fontName="Helvetica-Bold",
        fontSize=11,
        leading=14,
        textColor=c_brun,
        alignment=1,
    )

    style_mention_corps = ParagraphStyle(
        "AccuseMentionCorps",
        parent=styles["Normal"],
        fontName="Helvetica-Bold",
        fontSize=10,
        leading=14,
        textColor=c_brun,
        alignment=1,
    )

    story = []

    # En-tête
    story.append(Paragraph("RÉPUBLIQUE DU SÉNÉGAL<br/>Institut Supérieur d'Enseignement Professionnel (ISEP) de Diamniadio", style_institution))
    story.append(Spacer(1, 10))
    story.append(Paragraph("ACCUSÉ DE RÉCEPTION DE CANDIDATURE", style_titre))
    story.append(Paragraph(f"Programme d'Incubation & d'Accompagnement CIAT — Dossier #{dossier.id}", style_sous_titre))
    story.append(HRFlowable(width="100%", thickness=1.5, color=c_dore, spaceAfter=14))

    # Informations principales
    story.append(Paragraph("1. Informations sur la Candidature", style_h2))

    projet = dossier.projet
    porteur = projet.porteur
    nom_porteur = porteur.get_full_name() or porteur.email
    email_porteur = porteur.email

    date_soumission = (
        dossier.soumis_le.strftime("%d/%m/%Y à %H:%M")
        if dossier.soumis_le
        else dossier.cree_le.strftime("%d/%m/%Y à %H:%M")
    )

    info_data = [
        [Paragraph("Numéro du dossier", style_label), Paragraph(f"<b>DOSSIER-CIAT-{dossier.id:04d}</b> (ID : #{dossier.id})", style_valeur)],
        [Paragraph("Titre du projet", style_label), Paragraph(projet.titre, style_valeur)],
        [Paragraph("Porteur de projet", style_label), Paragraph(f"{nom_porteur} ({email_porteur})", style_valeur)],
        [Paragraph("Domaine d'intervention", style_label), Paragraph(projet.domaine.nom if projet.domaine else "Non spécifié", style_valeur)],
        [Paragraph("Cohorte de rattachement", style_label), Paragraph(str(projet.cohorte) if projet.cohorte else "Non assignée", style_valeur)],
        [Paragraph("Date et heure de soumission", style_label), Paragraph(date_soumission, style_valeur)],
        [Paragraph("Statut actuel", style_label), Paragraph(f"<b>{dossier.get_statut_display()}</b>", style_valeur)],
    ]

    t_info = Table(info_data, colWidths=[170, 317])
    t_info.setStyle(
        TableStyle([
            ("GRID", (0, 0), (-1, -1), 0.5, c_border),
            ("BACKGROUND", (0, 0), (0, -1), c_fond_beige),
            ("ROWBACKGROUNDS", (1, 0), (1, -1), [colors.white, c_zebra]),
            ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
            ("TOPPADDING", (0, 0), (-1, -1), 5),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
            ("LEFTPADDING", (0, 0), (-1, -1), 8),
            ("RIGHTPADDING", (0, 0), (-1, -1), 8),
        ])
    )
    story.append(t_info)
    story.append(Spacer(1, 14))

    # Pièces déposées
    story.append(Paragraph("2. Liste des Pièces Déposées", style_h2))

    pieces = list(dossier.pieces.all().order_by("type", "nom"))
    if pieces:
        t_pieces_data = [
            [
                Paragraph("Type de pièce", style_th),
                Paragraph("Nom du document / fichier", style_th),
                Paragraph("Date de dépôt", style_th),
            ]
        ]
        for p in pieces:
            t_pieces_data.append([
                Paragraph(f"<b>{p.get_type_display()}</b>", style_td),
                Paragraph(p.nom or p.fichier.name.split("/")[-1], style_td),
                Paragraph(p.depose_le.strftime("%d/%m/%Y %H:%M") if hasattr(p, "depose_le") and p.depose_le else "Déposé", style_td),
            ])
        t_pieces = Table(t_pieces_data, colWidths=[150, 237, 100])
        t_pieces.setStyle(
            TableStyle([
                ("BACKGROUND", (0, 0), (-1, 0), c_brun),
                ("GRID", (0, 0), (-1, -1), 0.5, c_border),
                ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, c_zebra]),
                ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
                ("TOPPADDING", (0, 0), (-1, -1), 5),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
                ("LEFTPADDING", (0, 0), (-1, -1), 6),
                ("RIGHTPADDING", (0, 0), (-1, -1), 6),
            ])
        )
        story.append(t_pieces)
    else:
        p_vide = Paragraph("<i>Aucune pièce jointe enregistrée sur ce dossier.</i>", style_valeur)
        story.append(p_vide)

    story.append(Spacer(1, 18))

    # Mention institutionnelle obligatoire
    mention_table_data = [
        [Paragraph("CONFIRMATION DE PRISE EN CHARGE", style_mention_titre)],
        [Spacer(1, 4)],
        [Paragraph("« Votre dossier sera examiné par le comité de sélection du CIAT. »", style_mention_corps)],
        [Spacer(1, 4)],
        [
            Paragraph(
                "Vous recevrez une notification par email dès que l'évaluation sera effectuée et que la décision du comité sera arrêtée. "
                "Vous pouvez suivre l'état d'avancement de votre candidature à tout moment depuis votre espace porteur CIAT.",
                ParagraphStyle("AccuseMentionDetail", parent=styles["Normal"], fontName="Helvetica", fontSize=8.5, leading=12, textColor=c_texte, alignment=1),
            )
        ],
    ]
    t_mention = Table(mention_table_data, colWidths=[487])
    t_mention.setStyle(
        TableStyle([
            ("BACKGROUND", (0, 0), (-1, -1), c_fond_beige),
            ("BOX", (0, 0), (-1, -1), 1.2, c_dore),
            ("TOPPADDING", (0, 0), (-1, -1), 10),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 10),
            ("LEFTPADDING", (0, 0), (-1, -1), 14),
            ("RIGHTPADDING", (0, 0), (-1, -1), 14),
            ("ALIGN", (0, 0), (-1, -1), "CENTER"),
        ])
    )
    story.append(t_mention)

    # Cachet / Signature symbolique
    story.append(Spacer(1, 20))
    signature_data = [
        [
            Paragraph("<b>Date de délivrance :</b> " + timezone.now().strftime("%d/%m/%Y"), style_valeur),
            Paragraph("<b>Le Secrétariat du CIAT</b><br/>ISEP Diamniadio", ParagraphStyle("AccuseSig", parent=styles["Normal"], fontName="Helvetica", fontSize=9.5, leading=13, textColor=c_texte, alignment=2)),
        ]
    ]
    t_sig = Table(signature_data, colWidths=[240, 247])
    t_sig.setStyle(TableStyle([("VALIGN", (0, 0), (-1, -1), "TOP")]))
    story.append(t_sig)

    doc.build(story, canvasmaker=_NumberedCanvas)
    buf.seek(0)
    return buf


# ==============================================================================
# T2 — Compte rendu d'un projet en PDF
# ==============================================================================

def generer_compte_rendu_pdf(projet) -> io.BytesIO:
    """Génère le compte rendu complet d'un projet incubé au format PDF selon la charte CIAT.
    
    Reprend exactement les 4 mêmes blocs que le compte rendu Excel :
    1. Informations du projet
    2. Objectifs d'accompagnement
    3. Jalons et réalisations
    4. Bilans de suivi périodique (3 et 6 mois)
    """
    from apps.incubator.models import Objectif, Jalon, SuiviProjet

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

    c_brun = colors.HexColor(COULEUR_BRUN_HEX)
    c_texte = colors.HexColor(COULEUR_TEXTE_HEX)
    c_dore = colors.HexColor(COULEUR_DORE_HEX)
    c_fond_beige = colors.HexColor(COULEUR_FOND_BEIGE)
    c_border = colors.HexColor(COULEUR_BORDURE)
    c_zebra = colors.HexColor(COULEUR_ZEBRE)

    style_titre = ParagraphStyle(
        "CrTitre",
        parent=styles["Heading1"],
        fontName="Helvetica-Bold",
        fontSize=17,
        leading=21,
        textColor=c_brun,
        spaceAfter=4,
    )

    style_sous_titre = ParagraphStyle(
        "CrSousTitre",
        parent=styles["Normal"],
        fontName="Helvetica-Bold",
        fontSize=11,
        leading=15,
        textColor=c_texte,
        spaceAfter=12,
    )

    style_h2 = ParagraphStyle(
        "CrH2",
        parent=styles["Heading2"],
        fontName="Helvetica-Bold",
        fontSize=11.5,
        leading=15,
        textColor=c_brun,
        spaceBefore=12,
        spaceAfter=6,
        keepWithNext=True,
    )

    style_label = ParagraphStyle(
        "CrLabel",
        parent=styles["Normal"],
        fontName="Helvetica-Bold",
        fontSize=9,
        leading=12,
        textColor=c_brun,
    )

    style_valeur = ParagraphStyle(
        "CrValeur",
        parent=styles["Normal"],
        fontName="Helvetica",
        fontSize=9,
        leading=12,
        textColor=c_texte,
    )

    style_th = ParagraphStyle(
        "CrTH",
        parent=styles["Normal"],
        fontName="Helvetica-Bold",
        fontSize=8.5,
        leading=11,
        textColor=colors.white,
    )

    style_td = ParagraphStyle(
        "CrTD",
        parent=styles["Normal"],
        fontName="Helvetica",
        fontSize=8.5,
        leading=11,
        textColor=c_texte,
    )

    style_td_center = ParagraphStyle(
        "CrTDCenter",
        parent=styles["Normal"],
        fontName="Helvetica",
        fontSize=8.5,
        leading=11,
        alignment=1,
        textColor=c_texte,
    )

    story = []

    # En-tête
    story.append(Paragraph(f"CIAT — COMPTE RENDU D'INCUBATION : {projet.titre.upper()}", style_titre))
    story.append(
        Paragraph(
            f"<b>Date d'extraction :</b> {timezone.now().strftime('%d/%m/%Y à %H:%M')} &nbsp;|&nbsp; <b>ID Projet :</b> #{projet.id}",
            style_sous_titre,
        )
    )
    story.append(HRFlowable(width="100%", thickness=1.5, color=c_dore, spaceAfter=10))

    # --- BLOC 1 : INFORMATIONS DU PROJET ---
    story.append(Paragraph("1. INFORMATIONS DU PROJET", style_h2))

    nom_porteur = projet.porteur.get_full_name() or projet.porteur.email
    mentor_info = "Non affecté"
    if hasattr(projet, "affectation_mentor") and projet.affectation_mentor:
        m = projet.affectation_mentor.mentor
        mentor_info = f"{m.get_full_name() or m.email} ({m.email})"

    infos_projet = [
        [Paragraph("Titre du projet", style_label), Paragraph(projet.titre, style_valeur)],
        [Paragraph("Domaine", style_label), Paragraph(projet.domaine.nom if projet.domaine else "—", style_valeur)],
        [Paragraph("Cohorte", style_label), Paragraph(str(projet.cohorte) if projet.cohorte else "—", style_valeur)],
        [Paragraph("Statut du projet", style_label), Paragraph(projet.get_statut_display(), style_valeur)],
        [Paragraph("Porteur de projet", style_label), Paragraph(f"{nom_porteur} ({projet.porteur.email})", style_valeur)],
        [Paragraph("Mentor référent", style_label), Paragraph(mentor_info, style_valeur)],
    ]

    t_infos = Table(infos_projet, colWidths=[150, 337])
    t_infos.setStyle(
        TableStyle([
            ("GRID", (0, 0), (-1, -1), 0.5, c_border),
            ("BACKGROUND", (0, 0), (0, -1), c_fond_beige),
            ("ROWBACKGROUNDS", (1, 0), (1, -1), [colors.white, c_zebra]),
            ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
            ("TOPPADDING", (0, 0), (-1, -1), 4),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
            ("LEFTPADDING", (0, 0), (-1, -1), 6),
            ("RIGHTPADDING", (0, 0), (-1, -1), 6),
        ])
    )
    story.append(t_infos)
    story.append(Spacer(1, 10))

    # --- BLOC 2 : OBJECTIFS D'ACCOMPAGNEMENT ---
    story.append(Paragraph("2. OBJECTIFS D'ACCOMPAGNEMENT", style_h2))

    objectifs = list(Objectif.objects.filter(projet=projet).select_related("cree_par").order_by("echeance", "cree_le"))
    if objectifs:
        t_obj_data = [
            [
                Paragraph("N°", style_th),
                Paragraph("Libellé de l'objectif", style_th),
                Paragraph("Échéance", style_th),
                Paragraph("Statut", style_th),
                Paragraph("Créé par", style_th),
            ]
        ]
        for idx, obj in enumerate(objectifs, start=1):
            nom_createur = obj.cree_par.get_full_name() or obj.cree_par.email
            echeance_str = obj.echeance.strftime("%d/%m/%Y") if obj.echeance else "—"
            t_obj_data.append([
                Paragraph(str(idx), style_td_center),
                Paragraph(obj.libelle, style_td),
                Paragraph(echeance_str, style_td_center),
                Paragraph(obj.get_statut_display(), style_td),
                Paragraph(nom_createur, style_td),
            ])
        t_obj = Table(t_obj_data, colWidths=[25, 230, 75, 77, 80])
        t_obj.setStyle(
            TableStyle([
                ("BACKGROUND", (0, 0), (-1, 0), c_brun),
                ("GRID", (0, 0), (-1, -1), 0.5, c_border),
                ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, c_zebra]),
                ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
                ("TOPPADDING", (0, 0), (-1, -1), 4),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
                ("LEFTPADDING", (0, 0), (-1, -1), 5),
                ("RIGHTPADDING", (0, 0), (-1, -1), 5),
            ])
        )
        story.append(t_obj)
    else:
        story.append(Paragraph("<i>Aucun objectif d'accompagnement défini pour le moment.</i>", style_valeur))

    story.append(Spacer(1, 10))

    # --- BLOC 3 : JALONS ET RÉALISATIONS ---
    story.append(Paragraph("3. JALONS ET RÉALISATIONS", style_h2))

    jalons = list(Jalon.objects.filter(projet=projet).prefetch_related("preuves").order_by("echeance", "cree_le"))
    if jalons:
        t_jal_data = [
            [
                Paragraph("N°", style_th),
                Paragraph("Titre du jalon", style_th),
                Paragraph("Échéance", style_th),
                Paragraph("Statut", style_th),
                Paragraph("En retard", style_th),
                Paragraph("Preuves", style_th),
            ]
        ]
        for idx, j in enumerate(jalons, start=1):
            t_jal_data.append([
                Paragraph(str(idx), style_td_center),
                Paragraph(j.titre, style_td),
                Paragraph(j.echeance.strftime("%d/%m/%Y"), style_td_center),
                Paragraph(j.get_statut_display(), style_td),
                Paragraph("<b>Oui</b>" if j.en_retard else "Non", style_td_center),
                Paragraph(str(j.preuves.count()), style_td_center),
            ])
        t_jal = Table(t_jal_data, colWidths=[25, 220, 72, 70, 55, 45])
        t_jal.setStyle(
            TableStyle([
                ("BACKGROUND", (0, 0), (-1, 0), c_brun),
                ("GRID", (0, 0), (-1, -1), 0.5, c_border),
                ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, c_zebra]),
                ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
                ("TOPPADDING", (0, 0), (-1, -1), 4),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
                ("LEFTPADDING", (0, 0), (-1, -1), 5),
                ("RIGHTPADDING", (0, 0), (-1, -1), 5),
            ])
        )
        story.append(t_jal)
    else:
        story.append(Paragraph("<i>Aucun jalon défini pour le moment.</i>", style_valeur))

    story.append(Spacer(1, 10))

    # --- BLOC 4 : BILANS DE SUIVI PÉRIODIQUE (3 ET 6 MOIS) ---
    story.append(Paragraph("4. BILANS DE SUIVI PÉRIODIQUE (3 ET 6 MOIS)", style_h2))

    suivis = list(SuiviProjet.objects.filter(projet=projet).select_related("redige_par").order_by("echeance"))
    if suivis:
        for s in suivis:
            redacteur = s.redige_par.get_full_name() or s.redige_par.email
            date_suivi = s.cree_le.strftime("%d/%m/%Y")
            ind_text = "—"
            if s.indicateurs:
                if isinstance(s.indicateurs, dict):
                    ind_text = ", ".join(f"{k}: {v}" for k, v in s.indicateurs.items())
                elif isinstance(s.indicateurs, list):
                    ind_text = ", ".join(str(item) for item in s.indicateurs)
                else:
                    ind_text = str(s.indicateurs)

            suivi_bloc = [
                [Paragraph(f"Échéance : {s.get_echeance_display()}", style_label), Paragraph(f"Rédigé par {redacteur} le {date_suivi}", style_valeur)],
                [Paragraph("Bilan écrit", style_label), Paragraph(s.bilan, style_valeur)],
                [Paragraph("Indicateurs", style_label), Paragraph(ind_text, style_valeur)],
            ]
            t_s = Table(suivi_bloc, colWidths=[140, 347])
            t_s.setStyle(
                TableStyle([
                    ("GRID", (0, 0), (-1, -1), 0.5, c_border),
                    ("BACKGROUND", (0, 0), (0, -1), c_fond_beige),
                    ("VALIGN", (0, 0), (-1, -1), "TOP"),
                    ("TOPPADDING", (0, 0), (-1, -1), 4),
                    ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
                    ("LEFTPADDING", (0, 0), (-1, -1), 6),
                    ("RIGHTPADDING", (0, 0), (-1, -1), 6),
                ])
            )
            story.append(t_s)
            story.append(Spacer(1, 6))
    else:
        story.append(Paragraph("<i>Aucun bilan de suivi enregistré pour ce projet.</i>", style_valeur))

    doc.build(story, canvasmaker=_NumberedCanvas)
    buf.seek(0)
    return buf
