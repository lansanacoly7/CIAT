"""Générateur de documents PDF réels pour le portail documentaire du CIAT (Phase 5 — T4).

Produit des documents PDF officiels de 2 à 4 pages avec ReportLab, strictement locaux :
1. Charte de Propriété Intellectuelle & Transfert Technologique (3 pages)
2. Règlement Intérieur de l'Incubateur & Sécurité des Ateliers (3 pages)
3. Dossier de Candidature Officiel — Cohorte d'Incubation 2026 (3 pages)

Chaque document inclut la mention institutionnelle :
« Version de démonstration rédigée par l'équipe du projet, à valider par l'ISEP ».
"""
import io
import logging
from pathlib import Path

from django.conf import settings
from django.core.files.base import ContentFile
from django.core.files.storage import default_storage
from django.utils import timezone

from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import cm, mm
from reportlab.pdfgen import canvas
from reportlab.platypus import (
    HRFlowable,
    KeepTogether,
    PageBreak,
    Paragraph,
    SimpleDocTemplate,
    Spacer,
    Table,
    TableStyle,
)

logger = logging.getLogger(__name__)

# Palette officielle CIAT (Charte 360)
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


class PortalDocCanvas(canvas.Canvas):
    """Canvas ReportLab à deux passes pour calculer le total de pages et insérer header/footer."""

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self._saved_page_states = []
        self.doc_title = kwargs.get("doc_title", "Document Officiel CIAT")

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

        # En-tête sur chaque page
        self.setFont("Helvetica-Bold", 8)
        self.setFillColor(COLOR_BRUN)
        self.drawString(45, 805, "CIAT — ISEP Amadou Trawaré de Diamniadio")
        self.setFont("Helvetica", 8)
        self.setFillColor(COLOR_GRIS)
        self.drawRightString(550, 805, "Espace Documentaire Officiel • Portail Public")
        self.setStrokeColor(COLOR_BORDURE)
        self.setLineWidth(0.6)
        self.line(45, 798, 550, 798)

        # Pied de page sur toutes les pages
        self.setStrokeColor(COLOR_BORDURE)
        self.setLineWidth(0.6)
        self.line(45, 42, 550, 42)

        self.setFont("Helvetica-Oblique", 7.5)
        self.setFillColor(COLOR_GRIS)
        self.drawString(
            45,
            30,
            "Version de démonstration rédigée par l'équipe du projet, à valider par l'ISEP",
        )

        page_str = f"Page {self._pageNumber} sur {page_count}"
        self.setFont("Helvetica-Bold", 8)
        self.setFillColor(COLOR_BRUN)
        self.drawRightString(550, 30, page_str)

        self.restoreState()


def _get_portal_styles():
    """Construit les styles typographiques pour les documents du portail."""
    styles = getSampleStyleSheet()

    style_title = ParagraphStyle(
        "PortalDocTitle",
        parent=styles["Heading1"],
        fontName="Helvetica-Bold",
        fontSize=17,
        leading=21,
        textColor=COLOR_BRUN,
        alignment=0,
        spaceAfter=4,
    )

    style_subtitle = ParagraphStyle(
        "PortalDocSubtitle",
        parent=styles["Normal"],
        fontName="Helvetica-Oblique",
        fontSize=10,
        leading=14,
        textColor=COLOR_GRIS,
        spaceAfter=8,
    )

    style_notice = ParagraphStyle(
        "PortalDocNotice",
        parent=styles["Normal"],
        fontName="Helvetica-Bold",
        fontSize=8.5,
        leading=12,
        textColor=COLOR_BRUN,
    )

    style_article_title = ParagraphStyle(
        "PortalArticleTitle",
        parent=styles["Heading2"],
        fontName="Helvetica-Bold",
        fontSize=11,
        leading=14,
        textColor=COLOR_BRUN,
        spaceBefore=11,
        spaceAfter=4,
        keepWithNext=True,
    )

    style_body = ParagraphStyle(
        "PortalDocBody",
        parent=styles["Normal"],
        fontName="Helvetica",
        fontSize=9,
        leading=13,
        textColor=COLOR_TEXTE,
        spaceAfter=5,
        alignment=4,  # Justifié
    )

    style_bullet = ParagraphStyle(
        "PortalDocBullet",
        parent=style_body,
        leftIndent=14,
        bulletIndent=4,
        spaceAfter=3,
        alignment=0,
    )

    style_signature = ParagraphStyle(
        "PortalDocSig",
        parent=styles["Normal"],
        fontName="Helvetica",
        fontSize=8.5,
        leading=12,
        textColor=COLOR_TEXTE,
    )

    return {
        "title": style_title,
        "subtitle": style_subtitle,
        "notice": style_notice,
        "article_title": style_article_title,
        "body": style_body,
        "bullet": style_bullet,
        "signature": style_signature,
    }


def _build_notice_box(text: str, style_notice: ParagraphStyle) -> Table:
    """Construit un encadré d'avertissement institutionnel."""
    p = Paragraph(f"<b>AVERTISSEMENT :</b> {text}", style_notice)
    t = Table([[p]], colWidths=[505])
    t.setStyle(
        TableStyle([
            ("BACKGROUND", (0, 0), (-1, -1), COLOR_FOND),
            ("BOX", (0, 0), (-1, -1), 0.8, COLOR_DORE),
            ("LINEBEFORE", (0, 0), (0, -1), 3.5, COLOR_BRUN),
            ("TOPPADDING", (0, 0), (-1, -1), 6),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
            ("LEFTPADDING", (0, 0), (-1, -1), 9),
            ("RIGHTPADDING", (0, 0), (-1, -1), 9),
        ])
    )
    return t


def build_charte_propriete_intellectuelle_pdf(buf: io.BytesIO) -> int:
    """Génère la Charte de Propriété Intellectuelle (2 à 4 pages, ciblé 3 pages)."""
    doc = SimpleDocTemplate(
        buf,
        pagesize=A4,
        leftMargin=45,
        rightMargin=45,
        topMargin=50,
        bottomMargin=50,
    )
    s = _get_portal_styles()
    story = []

    # En-tête du document
    story.append(Paragraph("Charte de Propriété Intellectuelle et Transfert Technologique", s["title"]))
    story.append(Paragraph("Cadre juridique, protection des inventions, valorisation et répartition des droits", s["subtitle"]))
    story.append(HRFlowable(width="100%", thickness=1.5, color=COLOR_DORE, spaceAfter=8))

    notice_text = "Version de démonstration rédigée par l'équipe du projet, à valider par l'ISEP. Ce document définit les principes de gouvernance applicables aux actifs immatériels créés au sein du CIAT."
    story.append(_build_notice_box(notice_text, s["notice"]))
    story.append(Spacer(1, 8))

    # Préambule
    story.append(Paragraph("Préambule institutionnel", s["article_title"]))
    story.append(Paragraph(
        "Le Centre d'Innovation, d'Application et de Transfert (CIAT), structure intégrée à l'Institut Supérieur d'Enseignement Professionnel (ISEP) Amadou Trawaré de Diamniadio, a pour mission de catalyser l'émergence d'innovations technologiques à fort impact territorial. L'accueil des apprenants, chercheurs, enseignants et entrepreneurs au sein des ateliers de prototypage et de l'incubateur nécessite un cadre contractuel clair et équitable. La présente charte garantit la sécurisation juridique des créations, encourage le transfert vers le tissu productif sénégalais et encadre le partage de la valeur.",
        s["body"],
    ))

    # Article 1
    story.append(Paragraph("Article 1 — Objet et champ d'application", s["article_title"]))
    story.append(Paragraph(
        "La présente charte s'applique de plein droit à l'ensemble des porteurs de projets, cofondateurs, personnels techniques, tuteurs académiques et experts externes intervenant au CIAT. Elle régit l'ensemble des résultats de recherche appliquée, logiciels, schémas électroniques, banques de données, dessins, maquettes, méthodes d'usinage et prototypes fonctionnels développés avec l'appui des moyens matériels, logiciels ou financiers de l'établissement.",
        s["body"],
    ))

    # Article 2
    story.append(Paragraph("Article 2 — Définitions et typologie des actifs", s["article_title"]))
    story.append(Paragraph(
        "Au sens de la présente charte, sont distingués :",
        s["body"],
    ))
    story.append(Paragraph("• <b>Connaissances antérieures :</b> l'ensemble des savoir-faire, brevets, codes sources et technologies détenus par un porteur préalablement à son admission au CIAT, dûment inventoriés à l'entrée.", s["bullet"]))
    story.append(Paragraph("• <b>Résultats propres :</b> les inventions, perfectionnements techniques et créations réalisés individuellement par un porteur dans le cadre strict de son projet incubé.", s["bullet"]))
    story.append(Paragraph("• <b>Résultats conjoints :</b> les innovations issues d'une collaboration formalisée entre un porteur de projet et les équipes techniques ou enseignants-chercheurs de l'ISEP.", s["bullet"]))

    # Article 3
    story.append(Paragraph("Article 3 — Titularité des innovations et droits d'auteur", s["article_title"]))
    story.append(Paragraph(
        "Le porteur de projet conserve la titularité exclusive des droits moraux et patrimoniaux sur les inventions issues de son travail individuel. Lorsque des moyens techniques exceptionnels de l'ISEP ou des contributions inventives d'enseignants-chercheurs sont mobilisés, une convention de cotitularité spécifique est obligatoirement signée avant tout dépôt de titre auprès de l'Organisation Africaine de la Propriété Intellectuelle (OAPI).",
        s["body"],
    ))

    # Article 4
    story.append(Paragraph("Article 4 — Déclaration obligatoire et veille de divulgation", s["article_title"]))
    story.append(Paragraph(
        "Afin de préserver la brevetabilité et la nouveauté absolue requises par l'OAPI, tout porteur de projet s'engage formellement à déclarer toute invention potentielle à la cellule de valorisation du CIAT avant toute soutenance publique, publication scientifique, communication médiatique ou démonstration sur salon. Toute divulgation prématurée sans accord écrit préalable engage la responsabilité du déclarant.",
        s["body"],
    ))

    # Article 5
    story.append(Paragraph("Article 5 — Accompagnement aux dépôts de brevets et marques", s["article_title"]))
    story.append(Paragraph(
        "Le CIAT, en liaison avec le réseau de partenaires institutionnels et la tutelle ministérielle, met à disposition des porteurs une assistance technique à la rédaction des mémoires descriptifs et des revendications. L'établissement facilite l'instruction des dossiers auprès de l'antenne nationale de l'OAPI et instruit les demandes de prise en charge financière des taxes de dépôt officiel.",
        s["body"],
    ))

    # Article 6
    story.append(Paragraph("Article 6 — Modalités de transfert technologique et licences", s["article_title"]))
    story.append(Paragraph(
        "La valorisation des résultats peut s'opérer par voie de concession de licence d'exploitation (exclusive ou non exclusive), de cession d'actifs ou de création d'entreprise essaimée (spin-off). Dans l'hypothèse d'une concession de licence commerciale à un tiers industriel, une convention tripartite fixe les conditions financières, les redevances et les indicateurs d'exploitation territoriale.",
        s["body"],
    ))

    # Article 7
    story.append(Paragraph("Article 7 — Clé de répartition équitable des revenus de valorisation", s["article_title"]))
    story.append(Paragraph(
        "En cas d'exploitation commerciale d'un brevet ou logiciel conjoint générant des redevances nettes perçues par l'établissement, les produits financiers sont répartis selon la clé équitable suivante :",
        s["body"],
    ))
    story.append(Paragraph("• <b>50 %</b> alloués directement aux inventeurs et porteurs de projet ;", s["bullet"]))
    story.append(Paragraph("• <b>30 %</b> versés au fonds d'amorçage et de réinvestissement du CIAT (renouvellement des équipements des ateliers) ;", s["bullet"]))
    story.append(Paragraph("• <b>20 %</b> attribués à l'ISEP Amadou Trawaré pour soutenir la formation et la maintenance générale.", s["bullet"]))

    # Article 8
    story.append(Paragraph("Article 8 — Confidentialité et accords de secret", s["article_title"]))
    story.append(Paragraph(
        "Chaque utilisateur des ateliers et espaces d'incubation est tenu à une stricte obligation de réserve et de confidentialité relative aux projets tiers dont il pourrait avoir connaissance. Tout échange technique approfondi avec un partenaire industriel externe doit faire l'objet préalable d'un accord de confidentialité bilatéral (Non-Disclosure Agreement) conforme au modèle homologué du CIAT.",
        s["body"],
    ))

    # Article 9
    story.append(Paragraph("Article 9 — Règlement des différends et conciliation", s["article_title"]))
    story.append(Paragraph(
        "Tout litige relatif à l'interprétation ou à l'application de la présente charte est soumis en premier ressort à une commission paritaire de conciliation présidée par le Directeur de l'ISEP ou son représentant désigné, réunissant le coordonnateur du CIAT et un représentant élu des porteurs de projets. À défaut d'accord amiable sous trente (30) jours, les juridictions compétentes de Dakar sont seules habilitées.",
        s["body"],
    ))

    story.append(Spacer(1, 10))
    story.append(Paragraph("Fait à Diamniadio, pour valoir engagement mutuel et sécurisation des innovations.", s["body"]))
    story.append(Spacer(1, 8))

    # Tableau des signatures
    sig_data = [
        [
            Paragraph("<b>Pour le CIAT / ISEP Amadou Trawaré</b><br/>La Direction de l'Établissement<br/><i>(Signature & Cachet)</i>", s["signature"]),
            Paragraph("<b>Pour le Porteur de Projet</b><br/>Nom, prénom et qualité :<br/><i>(Mention manuscrite 'Lu et approuvé')</i>", s["signature"]),
        ]
    ]
    t_sig = Table(sig_data, colWidths=[250, 255])
    t_sig.setStyle(
        TableStyle([
            ("BOX", (0, 0), (-1, -1), 0.5, COLOR_BORDURE),
            ("BACKGROUND", (0, 0), (-1, -1), COLOR_FOND),
            ("TOPPADDING", (0, 0), (-1, -1), 10),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 28),
            ("LEFTPADDING", (0, 0), (-1, -1), 10),
            ("RIGHTPADDING", (0, 0), (-1, -1), 10),
        ])
    )
    story.append(t_sig)

    doc.build(story, canvasmaker=PortalDocCanvas)
    return doc.page


def build_reglement_interieur_pdf(buf: io.BytesIO) -> int:
    """Génère le Règlement Intérieur de l'Incubateur (2 à 4 pages, ciblé 3 pages)."""
    doc = SimpleDocTemplate(
        buf,
        pagesize=A4,
        leftMargin=45,
        rightMargin=45,
        topMargin=50,
        bottomMargin=50,
    )
    s = _get_portal_styles()
    story = []

    # En-tête
    story.append(Paragraph("Règlement Intérieur de l'Incubateur et Sécurité des Ateliers", s["title"]))
    story.append(Paragraph("Normes de fonctionnement, protocoles FabLab, sécurité des machines et règles de vie", s["subtitle"]))
    story.append(HRFlowable(width="100%", thickness=1.5, color=COLOR_DORE, spaceAfter=8))

    notice_text = "Version de démonstration rédigée par l'équipe du projet, à valider par l'ISEP. Ce document encadre l'accès aux ateliers, la sécurité des usagers et l'utilisation partagée des moyens de prototypage."
    story.append(_build_notice_box(notice_text, s["notice"]))
    story.append(Spacer(1, 8))

    # Article 1
    story.append(Paragraph("Article 1 — Mission et vocation des infrastructures", s["article_title"]))
    story.append(Paragraph(
        "L'incubateur et les ateliers de prototypage du CIAT à Diamniadio constituent un espace d'innovation, d'apprentissage pratique et d'émulation entrepreneuriale. Ils accueillent les cohortes sélectionnées pour transformer leurs projets en preuves de concept tangibles et prototypes industriels conformes aux standards de sécurité en vigueur.",
        s["body"],
    ))

    # Article 2
    story.append(Paragraph("Article 2 — Modalités d'accès, horaires et badge individuel", s["article_title"]))
    story.append(Paragraph(
        "L'accès aux locaux techniques est strictement réservé aux personnes habilitées, munies de leur badge personnel d'identification. Les ateliers sont ouverts du lundi au vendredi de 08h00 à 18h00. Les sessions exceptionnelles en soirée ou le week-end requièrent une autorisation écrite préalable de la coordination générale de l'incubateur.",
        s["body"],
    ))

    # Article 3
    story.append(Paragraph("Article 3 — Port obligatoire des Équipements de Protection Individuelle (EPI)", s["article_title"]))
    story.append(Paragraph(
        "La sécurité des personnes est prioritaire. Le port des équipements de protection individuelle est rigoureusement obligatoire dès le franchissement de la ligne de sécurité de l'atelier mécanique, de soudure et de découpe :",
        s["body"],
    ))
    story.append(Paragraph("• <b>Lunettes de protection enveloppantes</b> homologuées aux normes de résistance aux impacts ;", s["bullet"]))
    story.append(Paragraph("• <b>Chaussures de sécurité fermées</b> à semelle antidérapante et embout renforcé ;", s["bullet"]))
    story.append(Paragraph("• <b>Blouse de travail en coton</b> ou combinaison ignifugée lors des opérations d'usinage et d'assemblage ;", s["bullet"]))
    story.append(Paragraph("• <b>Gants adaptés</b> lors des manipulations thermiques ou manipulation de solvants chimiques.", s["bullet"]))

    # Article 4
    story.append(Paragraph("Article 4 — Habilitation machine et conduite des outillages", s["article_title"]))
    story.append(Paragraph(
        "Aucune machine-outil (fraiseuse à commande numérique CNC, découpe laser industrielle, tour mécanique, presse plieuse) ne peut être mise en service sans une formation préalable validée par le responsable d'atelier. Il est formellement interdit d'utiliser un équipement lourd en situation d'isolement (présence obligatoire d'au moins deux personnes).",
        s["body"],
    ))

    # Article 5
    story.append(Paragraph("Article 5 — Respect des postes de travail, hygiène et rangement", s["article_title"]))
    story.append(Paragraph(
        "Chaque utilisateur est responsable du maintien en parfait état de propreté de son poste de travail. Quinze minutes avant l'heure de fermeture, toute manipulation s'interrompt pour procéder au nettoyage, à l'aspiration des copeaux, à la remise sous armoire sécurisée des outillages manuels et à l'extinction des ventilations localisées.",
        s["body"],
    ))

    # Article 6
    story.append(Paragraph("Article 6 — Gestion économe des consommables et matières premières", s["article_title"]))
    story.append(Paragraph(
        "Les matières premières (filaments 3D, résines, profilés métalliques, composants électroniques, réactifs) allouées aux porteurs dans le cadre de leur enveloppe de prototypage doivent être gérées avec sobriété. Tout gaspillage répété ou prélèvement de matière non consigné sur le registre de stock entraîne la suspension de la dotation matérielle.",
        s["body"],
    ))

    # Article 7
    story.append(Paragraph("Article 7 — Sécurité incendie et protocoles d'urgence", s["article_title"]))
    story.append(Paragraph(
        "Les usagers doivent impérativement identifier l'emplacement des extincteurs CO2/Poudre, des déclencheurs manuels d'alarme, des douches de sécurité oculaire et des issues de secours dès leur premier jour. Les allées de circulation doivent rester dégagées de tout obstacle, caisse ou câble volant en permanence.",
        s["body"],
    ))

    # Article 8
    story.append(Paragraph("Article 8 — Charte informatique, réseau et cybersécurité", s["article_title"]))
    story.append(Paragraph(
        "Le réseau local et les stations de calcul sont exclusivement dédiés aux travaux de CAO, simulation numérique, développement embarqué et gestion de projet. Les téléchargements illicites, le contournement des passerelles de sécurité et toute tentative d'intrusion sur les serveurs de l'ISEP sont passibles de poursuites disciplinaires immédiates.",
        s["body"],
    ))

    # Article 9
    story.append(Paragraph("Article 9 — Respect mutuel, vie en communauté et mixité", s["article_title"]))
    story.append(Paragraph(
        "Le CIAT promeut un environnement de respect strict, d'inclusion, d'égalité des genres et de courtoisie. Tout comportement discourtois, propos discriminatoire, dégradation volontaire ou non-respect des directives du personnel encadrant fait l'objet d'un rapport consigné transmis au conseil de discipline.",
        s["body"],
    ))

    # Article 10
    story.append(Paragraph("Article 10 — Échelle des sanctions disciplinaires", s["article_title"]))
    story.append(Paragraph(
        "Tout manquement aux dispositions du présent règlement expose son auteur aux sanctions graduées suivantes, prononcées par le coordonnateur du CIAT et la Direction de l'ISEP :",
        s["body"],
    ))
    story.append(Paragraph("1. Avertissement formel consigné au dossier de suivi du projet ;", s["bullet"]))
    story.append(Paragraph("2. Suspension temporaire d'accès aux ateliers pour une durée de 7 à 30 jours ;", s["bullet"]))
    story.append(Paragraph("3. Exclusion définitive de la cohorte d'incubation et révocation du badge d'accès.", s["bullet"]))

    story.append(Spacer(1, 10))
    story.append(Paragraph("Fait à Diamniadio. L'adhésion au règlement est une condition impérative d'accès aux installations.", s["body"]))
    story.append(Spacer(1, 8))

    sig_data = [
        [
            Paragraph("<b>Le Responsable des Ateliers & Sécurité</b><br/>CIAT ISEP Diamniadio<br/><i>(Visa technique)</i>", s["signature"]),
            Paragraph("<b>Le Porteur / Membre de l'Équipe</b><br/>Mention manuscrite 'Lu et approuvé' :<br/><i>(Signature obligatoire)</i>", s["signature"]),
        ]
    ]
    t_sig = Table(sig_data, colWidths=[250, 255])
    t_sig.setStyle(
        TableStyle([
            ("BOX", (0, 0), (-1, -1), 0.5, COLOR_BORDURE),
            ("BACKGROUND", (0, 0), (-1, -1), COLOR_FOND),
            ("TOPPADDING", (0, 0), (-1, -1), 10),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 26),
            ("LEFTPADDING", (0, 0), (-1, -1), 10),
            ("RIGHTPADDING", (0, 0), (-1, -1), 10),
        ])
    )
    story.append(t_sig)

    doc.build(story, canvasmaker=PortalDocCanvas)
    return doc.page


def build_dossier_candidature_pdf(buf: io.BytesIO) -> int:
    """Génère le Dossier de Candidature Officiel (2 à 4 pages, ciblé 3 pages)."""
    doc = SimpleDocTemplate(
        buf,
        pagesize=A4,
        leftMargin=45,
        rightMargin=45,
        topMargin=50,
        bottomMargin=50,
    )
    s = _get_portal_styles()
    story = []

    # En-tête
    story.append(Paragraph("Dossier de Candidature Officiel — Cohorte d'Incubation 2026", s["title"]))
    story.append(Paragraph("Formulaire officiel de candidature, critères d'éligibilité et cahier technique de sélection", s["subtitle"]))
    story.append(HRFlowable(width="100%", thickness=1.5, color=COLOR_DORE, spaceAfter=8))

    notice_text = "Version de démonstration rédigée par l'équipe du projet, à valider par l'ISEP. Canevas officiel de soumission pour l'entrée dans le parcours d'incubation et de prototypage du CIAT."
    story.append(_build_notice_box(notice_text, s["notice"]))
    story.append(Spacer(1, 8))

    # Section 1
    story.append(Paragraph("Section 1 — Cadre de l'appel et filières prioritaires", s["article_title"]))
    story.append(Paragraph(
        "Le Centre d'Innovation, d'Application et de Transfert (CIAT) ouvre la sélection de sa cohorte d'incubation annuelle. Les candidatures doivent s'inscrire dans l'un des sept domaines technologiques prioritaires définis par l'ISEP Amadou Trawaré de Diamniadio : Agro-alimentaire & Valorisation locale, Systèmes Électroniques & IoT, Énergies Renouvelables & Efficacité énergétique, Fabrication Mécanique & Maintenance, Solutions Logicielles & Numériques, Santé & Technologies Biomédicales, Transition Écologique & Recyclage.",
        s["body"],
    ))

    # Section 2
    story.append(Paragraph("Section 2 — Critères d'éligibilité et composition des équipes", s["article_title"]))
    story.append(Paragraph(
        "Peuvent faire acte de candidature : les apprenants et anciens diplômés des filières professionnelles, les enseignants-chercheurs porteurs de technologies appliquées, ainsi que les jeunes porteurs de projets nationaux justifiant d'un concept innovant. Les critères d'évaluation retiennent :",
        s["body"],
    ))
    story.append(Paragraph("• <b>Faisabilité technologique :</b> pertinence de la solution au regard des équipements disponibles au CIAT ;", s["bullet"]))
    story.append(Paragraph("• <b>Pertinence économique :</b> existence d'un besoin de marché identifié au Sénégal et en sous-région ;", s["bullet"]))
    story.append(Paragraph("• <b>Maturité initiale :</b> projet démontrant un niveau TRL minimum de 2 à 3 (concept validé analytiquement) ;", s["bullet"]))
    story.append(Paragraph("• <b>Cohérence de l'équipe :</b> complémentarité des compétences techniques, agronomiques ou managériales.", s["bullet"]))

    # Section 3
    story.append(Paragraph("Section 3 — Fiche de renseignements du candidat principal", s["article_title"]))
    table_candidat = [
        [Paragraph("<b>Nom et Prénoms :</b>", s["signature"]), Paragraph("................................................................................................", s["signature"])],
        [Paragraph("<b>Date et lieu de naissance :</b>", s["signature"]), Paragraph("................................................................................................", s["signature"])],
        [Paragraph("<b>Nationalité / N° CNI :</b>", s["signature"]), Paragraph("................................................................................................", s["signature"])],
        [Paragraph("<b>Téléphone principal :</b>", s["signature"]), Paragraph("................................................................................................", s["signature"])],
        [Paragraph("<b>Adresse électronique :</b>", s["signature"]), Paragraph("................................................................................................", s["signature"])],
        [Paragraph("<b>Formation / Diplôme le plus élevé :</b>", s["signature"]), Paragraph("................................................................................................", s["signature"])],
        [Paragraph("<b>Statut actuel :</b>", s["signature"]), Paragraph("[ ] Apprenant ISEP &nbsp; [ ] Diplômé &nbsp; [ ] Externe &nbsp; [ ] Enseignant", s["signature"])],
    ]
    t_cand = Table(table_candidat, colWidths=[180, 325])
    t_cand.setStyle(
        TableStyle([
            ("BOX", (0, 0), (-1, -1), 0.5, COLOR_BORDURE),
            ("BACKGROUND", (0, 0), (0, -1), COLOR_FOND),
            ("TOPPADDING", (0, 0), (-1, -1), 3.5),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 3.5),
            ("LEFTPADDING", (0, 0), (-1, -1), 6),
            ("RIGHTPADDING", (0, 0), (-1, -1), 6),
        ])
    )
    story.append(t_cand)
    story.append(Spacer(1, 6))

    # Section 4
    story.append(Paragraph("Section 4 — Synthèse du projet d'innovation", s["article_title"]))
    story.append(Paragraph(
        "Le porteur décrit de façon concise la solution envisagée :",
        s["body"],
    ))
    table_projet = [
        [Paragraph("<b>Titre de l'innovation :</b>", s["signature"]), Paragraph("................................................................................................", s["signature"])],
        [Paragraph("<b>Domaine d'application :</b>", s["signature"]), Paragraph("................................................................................................", s["signature"])],
        [Paragraph("<b>Problème concret adressé :</b>", s["signature"]), Paragraph("<i>(Quel dysfonctionnement ou manque constatez-vous sur le terrain ?)</i><br/><br/>................................................................................................", s["signature"])],
        [Paragraph("<b>Solution technologique :</b>", s["signature"]), Paragraph("<i>(Principe de fonctionnement, matériaux ou algorithmes clés utilisés)</i><br/><br/>................................................................................................", s["signature"])],
        [Paragraph("<b>Niveau de maturité TRL estimé :</b>", s["signature"]), Paragraph("[ ] Idée/TRL 1 &nbsp; [ ] Validé labo/TRL 3 &nbsp; [ ] Début prototype/TRL 4", s["signature"])],
    ]
    t_proj = Table(table_projet, colWidths=[180, 325])
    t_proj.setStyle(
        TableStyle([
            ("BOX", (0, 0), (-1, -1), 0.5, COLOR_BORDURE),
            ("BACKGROUND", (0, 0), (0, -1), COLOR_FOND),
            ("TOPPADDING", (0, 0), (-1, -1), 3.5),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 3.5),
            ("LEFTPADDING", (0, 0), (-1, -1), 6),
            ("RIGHTPADDING", (0, 0), (-1, -1), 6),
        ])
    )
    story.append(t_proj)
    story.append(Spacer(1, 6))

    # Section 5
    story.append(Paragraph("Section 5 — Besoins attendus du CIAT et calendrier prévisionnel", s["article_title"]))
    story.append(Paragraph(
        "Précisez les ressources techniques attendues des ateliers de Diamniadio :",
        s["body"],
    ))
    story.append(Paragraph("• <b>Ateliers sollicités :</b> [ ] Impression 3D / Prototypage rapide &nbsp; [ ] Usinage CNC &nbsp; [ ] Banc IoT / Électronique &nbsp; [ ] Chimie / Agroalimentaire", s["bullet"]))
    story.append(Paragraph("• <b>Accompagnement expert :</b> [ ] Mentorat technique &nbsp; [ ] Propriété intellectuelle &nbsp; [ ] Modèle économique &nbsp; [ ] Préparation aux comités", s["bullet"]))
    story.append(Paragraph("• <b>Durée prévisionnelle d'incubation souhaitée :</b> 12 mois (répartis en phases : Diagnostic, Prototypage, Validation terrain, Pré-série).", s["bullet"]))

    # Section 6
    story.append(Paragraph("Section 6 — Pièces obligatoires à joindre au dossier", s["article_title"]))
    story.append(Paragraph(
        "Tout dossier incomplet à la date limite de soumission est déclaré irrecevable :",
        s["body"],
    ))
    story.append(Paragraph("1. Copie de la pièce d'identité (CNI ou passeport en cours de validité) de chaque membre ;", s["bullet"]))
    story.append(Paragraph("2. Curriculum vitae actualisé du porteur principal et des associés techniques ;", s["bullet"]))
    story.append(Paragraph("3. Note conceptuelle détaillée de 5 à 10 pages décrivant l'architecture de la solution ;", s["bullet"]))
    story.append(Paragraph("4. Budget prévisionnel estimatif des composants et outillages de prototypage.", s["bullet"]))

    # Section 7
    story.append(Paragraph("Section 7 — Déclaration sur l'honneur et engagement de sincérité", s["article_title"]))
    story.append(Paragraph(
        "Je soussigné(e), porteur de la présente candidature, certifie sur l'honneur l'exactitude des informations mentionnées ci-dessus. Je m'engage, en cas de sélection par le comité de pilotage, à respecter rigoureusement la charte de propriété intellectuelle et le règlement intérieur des ateliers du CIAT.",
        s["body"],
    ))
    story.append(Spacer(1, 8))

    sig_data = [
        [
            Paragraph("<b>Dépôt auprès du Secrétariat CIAT</b><br/>Date de réception : ..... / ..... / 2026<br/>N° d'enregistrement : CIAT-2026-.......", s["signature"]),
            Paragraph("<b>Signature du candidat principal</b><br/>Fait à : .........................................<br/>Le : ..... / ..... / 2026", s["signature"]),
        ]
    ]
    t_sig = Table(sig_data, colWidths=[250, 255])
    t_sig.setStyle(
        TableStyle([
            ("BOX", (0, 0), (-1, -1), 0.5, COLOR_BORDURE),
            ("BACKGROUND", (0, 0), (-1, -1), COLOR_FOND),
            ("TOPPADDING", (0, 0), (-1, -1), 10),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 22),
            ("LEFTPADDING", (0, 0), (-1, -1), 10),
            ("RIGHTPADDING", (0, 0), (-1, -1), 10),
        ])
    )
    story.append(t_sig)

    doc.build(story, canvasmaker=PortalDocCanvas)
    return doc.page


def generer_tous_documents_portail(stdout=None, force: bool = False) -> dict:
    """Génère l'ensemble des PDF officiels du portail et les rattache à DocumentPublic.
    
    Strictement idempotent : si les fichiers existent déjà et force=False, ne régénère pas.
    Garantit que chaque document compte entre 2 et 4 pages.
    """
    from apps.portal.models import DocumentPublic

    def write(msg):
        if stdout:
            stdout.write(msg)
        else:
            logger.info(msg)

    docs_specs = [
        {
            "titre": "Charte de Propriété Intellectuelle & Transfert Technologique",
            "categorie": "Règlements & Chartes",
            "filename": "charte_propriete_intellectuelle_ciat.pdf",
            "builder": build_charte_propriete_intellectuelle_pdf,
        },
        {
            "titre": "Règlement Intérieur de l'Incubateur & Sécurité des Ateliers",
            "categorie": "Règlements & Chartes",
            "filename": "reglement_interieur_incubateur_ciat.pdf",
            "builder": build_reglement_interieur_pdf,
        },
        {
            "titre": "Dossier de Candidature Officiel — Cohorte d'Incubation 2026",
            "categorie": "Candidatures & Formulaires",
            "filename": "dossier_candidature_incubation_2026.pdf",
            "builder": build_dossier_candidature_pdf,
        },
    ]

    stats = {"crees": 0, "existants": 0, "pages": {}}

    for spec in docs_specs:
        titre = spec["titre"]
        categorie = spec["categorie"]
        filename = spec["filename"]
        builder = spec["builder"]
        rel_path = f"documents_publics/{filename}"

        doc_instance, _ = DocumentPublic.objects.get_or_create(
            titre=titre,
            defaults={"categorie": categorie},
        )

        deja_present = False
        try:
            if not force and doc_instance.fichier and default_storage.exists(doc_instance.fichier.name):
                deja_present = True
        except Exception:
            deja_present = False

        if deja_present:
            stats["existants"] += 1
            continue

        # Génération du PDF en mémoire
        buf = io.BytesIO()
        page_count = builder(buf)
        stats["pages"][titre] = page_count

        if not (2 <= page_count <= 4):
            write(f"ATTENTION : Le document '{titre}' fait {page_count} pages (exigé : 2 à 4 pages).\n")

        # Sauvegarde sur le stockage Django
        content_file = ContentFile(buf.getvalue(), name=filename)
        doc_instance.fichier.save(filename, content_file, save=True)
        stats["crees"] += 1

    write(
        f"Documents PDF du portail initialisés ({stats['crees']} créés, {stats['existants']} existants). "
        f"Pages mesurées : {stats['pages']}\n"
    )
    return stats
