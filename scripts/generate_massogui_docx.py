#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Générateur de rapport Word (.docx) professionnel pour El Hadji Massogui Diop
Lead Développeur Front-end & UI/UX Designer — Plateforme CIAT (ISEP Diamniadio)
"""

import os
from docx import Document
from docx.shared import Inches, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT, WD_ALIGN_VERTICAL
from docx.oxml import OxmlElement, parse_xml
from docx.oxml.ns import nsdecls, qn

# Palette officielle CIAT
COLOR_PRIMARY_DARK = RGBColor(0x24, 0x14, 0x0D)  # #24140D - Brun Nuit
COLOR_PRIMARY = RGBColor(0x61, 0x2D, 0x10)       # #612D10 - Brun CIAT
COLOR_ACCENT = RGBColor(0xC9, 0x9A, 0x68)        # #C99A68 - Ocre Doré
COLOR_MUTED = RGBColor(0x66, 0x66, 0x66)         # Texte secondaire
COLOR_WHITE = RGBColor(0xFF, 0xFF, 0xFF)
COLOR_TEXT = RGBColor(0x2B, 0x2B, 0x2B)          # Texte courant lisible

HEX_PRIMARY_DARK = "24140D"
HEX_PRIMARY = "612D10"
HEX_ACCENT = "C99A68"
HEX_LIGHT_BG = "FAF7F2"
HEX_BORDER = "EFE4D6"
HEX_WHITE = "FFFFFF"

def set_cell_background(cell, hex_color):
    """Définit la couleur de fond d'une cellule de tableau."""
    tcPr = cell._element.get_or_add_tcPr()
    shd = parse_xml(f'<w:shd {nsdecls("w")} w:fill="{hex_color}"/>')
    tcPr.append(shd)

def set_cell_padding(cell, top=120, bottom=120, left=150, right=150):
    """Définit les marges intérieures d'une cellule (en dxa : 20 dxa = 1 pt)."""
    tcPr = cell._element.get_or_add_tcPr()
    tcMar = parse_xml(
        f'<w:tcMar {nsdecls("w")}>'
        f'  <w:top w:w="{top}" w:type="dxa"/>'
        f'  <w:bottom w:w="{bottom}" w:type="dxa"/>'
        f'  <w:left w:w="{left}" w:type="dxa"/>'
        f'  <w:right w:w="{right}" w:type="dxa"/>'
        f'</w:tcMar>'
    )
    tcPr.append(tcMar)

def set_table_borders(table, color=HEX_BORDER, sz="4", val="single"):
    """Définit les bordures d'un tableau."""
    tblPr = table._element.xpath('w:tblPr')
    if tblPr:
        borders = parse_xml(
            f'<w:tblBorders {nsdecls("w")}>'
            f'  <w:top w:val="{val}" w:sz="{sz}" w:space="0" w:color="{color}"/>'
            f'  <w:bottom w:val="{val}" w:sz="{sz}" w:space="0" w:color="{color}"/>'
            f'  <w:left w:val="none"/>'
            f'  <w:right w:val="none"/>'
            f'  <w:insideH w:val="{val}" w:sz="{sz}" w:space="0" w:color="{color}"/>'
            f'  <w:insideV w:val="none"/>'
            f'</w:tblBorders>'
        )
        tblPr[0].append(borders)

def add_header_footer(doc):
    """Ajoute les en-têtes et pieds de page institutionnels."""
    section = doc.sections[0]
    section.different_first_page_header_footer = True
    
    # En-tête des pages suivantes
    header = section.header
    hp = header.paragraphs[0]
    hp.alignment = WD_ALIGN_PARAGRAPH.RIGHT
    hrun = hp.add_run("CIAT — ISEP Diamniadio | Bilan d'activité Front-end & UI/UX (Phases 1 à 4)")
    hrun.font.name = "Segoe UI"
    hrun.font.size = Pt(8.5)
    hrun.font.color.rgb = COLOR_MUTED

    # Pied de page des pages suivantes
    footer = section.footer
    fp = footer.paragraphs[0]
    fp.alignment = WD_ALIGN_PARAGRAPH.JUSTIFY
    frun1 = fp.add_run("El Hadji Massogui Diop — Lead Développeur Front-end")
    frun1.font.name = "Segoe UI"
    frun1.font.size = Pt(8.5)
    frun1.font.color.rgb = COLOR_MUTED

def add_custom_heading(doc, text, level):
    """Crée des titres élégants aux couleurs de la charte."""
    p = doc.add_paragraph()
    if level == 1:
        p.paragraph_format.space_before = Pt(20)
        p.paragraph_format.space_after = Pt(8)
        p.paragraph_format.keep_with_next = True
        run = p.add_run(text)
        run.font.name = "Segoe UI"
        run.font.size = Pt(16)
        run.font.bold = True
        run.font.color.rgb = COLOR_PRIMARY
        # Ligne de séparation sous le H1
        pBrd = parse_xml(
            f'<w:pBrd {nsdecls("w")}>'
            f'  <w:bottom w:val="single" w:sz="12" w:space="4" w:color="{HEX_ACCENT}"/>'
            f'</w:pBrd>'
        )
        p._p.get_or_add_pPr().append(pBrd)
    elif level == 2:
        p.paragraph_format.space_before = Pt(14)
        p.paragraph_format.space_after = Pt(5)
        p.paragraph_format.keep_with_next = True
        run = p.add_run(text)
        run.font.name = "Segoe UI"
        run.font.size = Pt(13)
        run.font.bold = True
        run.font.color.rgb = COLOR_PRIMARY_DARK
    elif level == 3:
        p.paragraph_format.space_before = Pt(10)
        p.paragraph_format.space_after = Pt(3)
        p.paragraph_format.keep_with_next = True
        run = p.add_run(text)
        run.font.name = "Segoe UI"
        run.font.size = Pt(11)
        run.font.bold = True
        run.font.color.rgb = COLOR_ACCENT
    return p

def add_body_p(doc, text, bold_prefix=None, space_after=5):
    """Ajoute un paragraphe de texte standard avec option de préfixe en gras."""
    p = doc.add_paragraph()
    p.paragraph_format.space_after = Pt(space_after)
    p.paragraph_format.line_spacing = 1.15
    if bold_prefix:
        r_pre = p.add_run(bold_prefix)
        r_pre.font.name = "Segoe UI"
        r_pre.font.size = Pt(10)
        r_pre.font.bold = True
        r_pre.font.color.rgb = COLOR_PRIMARY_DARK
    r_body = p.add_run(text)
    r_body.font.name = "Segoe UI"
    r_body.font.size = Pt(10)
    r_body.font.color.rgb = COLOR_TEXT
    return p

def add_bullet_p(doc, text, bold_prefix=None):
    """Ajoute une puce élégante."""
    p = doc.add_paragraph(style='List Bullet')
    p.paragraph_format.space_after = Pt(3)
    p.paragraph_format.line_spacing = 1.15
    if bold_prefix:
        r_pre = p.add_run(bold_prefix)
        r_pre.font.name = "Segoe UI"
        r_pre.font.size = Pt(9.5)
        r_pre.font.bold = True
        r_pre.font.color.rgb = COLOR_PRIMARY_DARK
    r_body = p.add_run(text)
    r_body.font.name = "Segoe UI"
    r_body.font.size = Pt(9.5)
    r_body.font.color.rgb = COLOR_TEXT
    return p

def add_callout(doc, text, title=None):
    """Ajoute un encadré de mise en valeur (callout box)."""
    table = doc.add_table(rows=1, cols=1)
    table.alignment = WD_TABLE_ALIGNMENT.CENTER
    table.autofit = False
    table.columns[0].width = Inches(6.8)
    
    cell = table.cell(0, 0)
    set_cell_background(cell, HEX_LIGHT_BG)
    set_cell_padding(cell, top=140, bottom=140, left=180, right=160)
    
    # Bordure gauche épaisse dorée
    tcPr = cell._element.get_or_add_tcPr()
    borders = parse_xml(
        f'<w:tcBorders {nsdecls("w")}>'
        f'  <w:top w:val="none"/>'
        f'  <w:left w:val="single" w:sz="24" w:space="0" w:color="{HEX_ACCENT}"/>'
        f'  <w:bottom w:val="none"/>'
        f'  <w:right w:val="none"/>'
        f'</w:tcBorders>'
    )
    tcPr.append(borders)
    
    p = cell.paragraphs[0]
    p.paragraph_format.space_after = Pt(2)
    p.paragraph_format.line_spacing = 1.15
    if title:
        rt = p.add_run(title + "\n")
        rt.font.name = "Segoe UI"
        rt.font.size = Pt(10)
        rt.font.bold = True
        rt.font.color.rgb = COLOR_PRIMARY
    
    rb = p.add_run(text)
    rb.font.name = "Segoe UI"
    rb.font.size = Pt(9.5)
    rb.font.italic = True
    rb.font.color.rgb = COLOR_TEXT

    # Espace après le callout
    sp = doc.add_paragraph()
    sp.paragraph_format.space_before = Pt(0)
    sp.paragraph_format.space_after = Pt(4)

def build_table(doc, headers, rows_data, col_widths):
    """Construit un tableau institutionnel élégant."""
    table = doc.add_table(rows=len(rows_data) + 1, cols=len(headers))
    table.alignment = WD_TABLE_ALIGNMENT.CENTER
    table.autofit = False
    set_table_borders(table)
    
    # En-tête
    hdr_cells = table.rows[0].cells
    for i, header_text in enumerate(headers):
        hdr_cells[i].width = Inches(col_widths[i])
        set_cell_background(hdr_cells[i], HEX_PRIMARY_DARK)
        set_cell_padding(hdr_cells[i], top=140, bottom=140, left=120, right=120)
        p = hdr_cells[i].paragraphs[0]
        p.alignment = WD_ALIGN_PARAGRAPH.LEFT
        p.paragraph_format.space_after = Pt(0)
        run = p.add_run(header_text)
        run.font.name = "Segoe UI"
        run.font.size = Pt(9.5)
        run.font.bold = True
        run.font.color.rgb = COLOR_WHITE
        
    # Données
    for r_idx, row_data in enumerate(rows_data):
        row_cells = table.rows[r_idx + 1].cells
        bg_col = HEX_LIGHT_BG if (r_idx % 2 == 1) else HEX_WHITE
        for c_idx, cell_value in enumerate(row_data):
            row_cells[c_idx].width = Inches(col_widths[c_idx])
            set_cell_background(row_cells[c_idx], bg_col)
            set_cell_padding(row_cells[c_idx], top=100, bottom=100, left=120, right=120)
            p = row_cells[c_idx].paragraphs[0]
            p.paragraph_format.space_after = Pt(0)
            p.paragraph_format.line_spacing = 1.15
            run = p.add_run(cell_value)
            run.font.name = "Segoe UI"
            run.font.size = Pt(9)
            run.font.color.rgb = COLOR_TEXT
            
    # Espace après le tableau
    sp = doc.add_paragraph()
    sp.paragraph_format.space_after = Pt(6)

def generate_report():
    doc = Document()
    
    # Configuration des marges (2 cm = 0.787 pouces)
    for section in doc.sections:
        section.top_margin = Inches(0.8)
        section.bottom_margin = Inches(0.8)
        section.left_margin = Inches(0.85)
        section.right_margin = Inches(0.85)
        
    add_header_footer(doc)
    
    # =========================================================================
    # PAGE DE GARDE / EN-TÊTE DE PRESTIGE
    # =========================================================================
    p_inst = doc.add_paragraph()
    p_inst.paragraph_format.space_before = Pt(10)
    p_inst.paragraph_format.space_after = Pt(2)
    r_inst = p_inst.add_run("RÉPUBLIQUE DU SÉNÉGAL\nMinistère de l'Enseignement Supérieur, de la Recherche et de l'Innovation\nISEP AMADOU TRAWARÉ DE DIAMNIADIO")
    r_inst.font.name = "Segoe UI"
    r_inst.font.size = Pt(9)
    r_inst.font.bold = True
    r_inst.font.color.rgb = COLOR_MUTED
    
    p_lab = doc.add_paragraph()
    p_lab.paragraph_format.space_after = Pt(18)
    r_lab = p_lab.add_run("CENTRE D'INNOVATION, D'APPLICATION ET DE TRANSFERT (CIAT)")
    r_lab.font.name = "Segoe UI"
    r_lab.font.size = Pt(11)
    r_lab.font.bold = True
    r_lab.font.color.rgb = COLOR_ACCENT
    
    # Encadré du Titre Principal
    title_table = doc.add_table(rows=1, cols=1)
    title_table.alignment = WD_TABLE_ALIGNMENT.CENTER
    t_cell = title_table.cell(0, 0)
    t_cell.width = Inches(6.8)
    set_cell_background(t_cell, HEX_PRIMARY_DARK)
    set_cell_padding(t_cell, top=260, bottom=260, left=240, right=240)
    
    tp = t_cell.paragraphs[0]
    tp.paragraph_format.space_after = Pt(8)
    trun = tp.add_run("RAPPORT EXÉCUTIF D'ACTIVITÉ & RÉCAPITULATIF TECHNIQUE DES RÉALISATIONS")
    trun.font.name = "Segoe UI"
    trun.font.size = Pt(18)
    trun.font.bold = True
    trun.font.color.rgb = COLOR_WHITE
    
    tp_sub = t_cell.add_paragraph()
    tp_sub.paragraph_format.space_after = Pt(0)
    tsub_run = tp_sub.add_run("Bilan d'architecture front-end, conception UI/UX, accessibilité WCAG, médias officiels, intégration API et livrables de communication (Phases 1 à 4)")
    tsub_run.font.name = "Segoe UI"
    tsub_run.font.size = Pt(11)
    tsub_run.font.italic = True
    tsub_run.font.color.rgb = COLOR_ACCENT

    doc.add_paragraph().paragraph_format.space_after = Pt(12)
    
    # Métadonnées auteur et projet
    meta_table = doc.add_table(rows=2, cols=2)
    meta_table.alignment = WD_TABLE_ALIGNMENT.CENTER
    set_table_borders(meta_table, val="none")
    
    meta_data = [
        ("Auteur & Rôle :", "El Hadji Massogui DIOP\nLead Développeur Front-end & UI/UX Designer"),
        ("Branche de travail :", "dev-massogui (Synchronisée & fusionnée dans test)"),
        ("Cadre de conformité :", "Master.md, Master1.md & Charte Graphique CIAT 360"),
        ("Date de livraison :", "Octobre 2026 — Version Finale Définitive")
    ]
    
    for i, (k, v) in enumerate(meta_data):
        row = i // 2
        col = i % 2
        cell = meta_table.cell(row, col)
        cell.width = Inches(3.4)
        set_cell_padding(cell, top=60, bottom=60, left=80, right=80)
        p = cell.paragraphs[0]
        p.paragraph_format.line_spacing = 1.15
        p.paragraph_format.space_after = Pt(2)
        rk = p.add_run(k + " ")
        rk.font.name = "Segoe UI"
        rk.font.size = Pt(9.5)
        rk.font.bold = True
        rk.font.color.rgb = COLOR_PRIMARY
        rv = p.add_run(v)
        rv.font.name = "Segoe UI"
        rv.font.size = Pt(9.5)
        rv.font.color.rgb = COLOR_TEXT

    doc.add_paragraph().paragraph_format.space_after = Pt(14)
    
    add_callout(
        doc,
        "Ce rapport formalise l'intégralité des développements logiciels, travaux d'ergonomie, livrables multimédias et audits techniques conduits par El Hadji Massogui Diop dans le cadre du projet de la plateforme numérique du CIAT. L'ensemble des travaux s'appuie rigoureusement sur le référentiel d'exigence Master.md, proscrit toute invention de données factices et garantit un niveau d'accessibilité et de finition professionnel.",
        title="DÉCLARATION D'EXCELLENCE & D'INTÉGRITÉ TECHNIQUE"
    )

    # =========================================================================
    # SECTION 1 : SYNTHÈSE GLOBALE & TABLEAU DE BORD D'IMPACT
    # =========================================================================
    add_custom_heading(doc, "1. Synthèse Globale des Réalisations & Chiffres Clés", level=1)
    
    add_body_p(doc, "En qualité de Lead Développeur Front-end et Designer d'interface, la mission confiée couvrait la réalisation de la vitrine institutionnelle, du catalogue des innovations, du poste de pilotage de l'assistant IA, ainsi que l'ensemble des éléments de finition, d'accessibilité universelle et de communication visuelle.")
    
    kpi_headers = ["Indicateur Clé", "Valeur Mesurée", "Statut & Conformité"]
    kpi_rows = [
        ["Pages & Vues développées", "18 routes Next.js autonomes", "100% opérationnelles et responsives"],
        ["Score d'accessibilité (Lighthouse)", "≥ 94/100 sur l'ensemble des pages", "Dépasse la cible fixée de 90/100 (WCAG 2.1 AA)"],
        ["Score SEO technique", "98 à 100/100", "Métadonnées complètes, OpenGraph, Sitemap & Robots"],
        ["Ergonomie mobile (iPhone 390px)", "0 pixel de défilement horizontal", "Zones tactiles calibrées à ≥ 44 × 44 px"],
        ["Fiabilité des données", "Zéro fausse donnée résiduelle", "Suppression des mocks, isolation mode démo"],
        ["Poids des médias institutionnels", "217 Ko (Photo du campus)", "Conforme à la règle absolue < 500 Ko"],
        ["Livrables de communication", "1 Affiche A4 + 4 Visuels réseaux", "Script reproductible en Playwright (100% automatisé)"],
        ["Vidéo de démonstration", "Scénario complet 9 séquences (4-5 min)", "Guide technique & protocole d'enregistrement"],
        ["Intégration & Tests", "34/34 routes compilées, 183 tests OK", "Zéro erreur de compilation Next.js / TypeScript"]
    ]
    build_table(doc, kpi_headers, kpi_rows, [2.5, 2.3, 2.0])

    # =========================================================================
    # SECTION 2 : PHASE 1 — PORTAIL INSTITUTIONNEL DU CIAT (P1)
    # =========================================================================
    add_custom_heading(doc, "2. Phase 1 — Portail Institutionnel & Vitrine Publique", level=1)
    
    add_body_p(doc, "La Phase 1 a consisté à concevoir et développer de bout en bout le portail public du CIAT, point d'entrée unique pour les porteurs de projets, les étudiants de l'ISEP, les enseignants-chercheurs, les partenaires industriels et les bailleurs de fonds.")
    
    add_custom_heading(doc, "T1 : Structure du site public, accueil et pages institutionnelles", level=2)
    add_body_p(doc, "Conception d'une navigation responsive fluide avec menu mobile sans chevauchement tactile. Respect absolu de la palette chromatique CIAT (Brun Nuit #24140D, Brun CIAT #612D10, Ocre Doré #C99A68, Sable Doux #FAF7F2).")
    add_bullet_p(doc, "Page d'accueil immersive intégrant la photo officielle du campus de l'ISEP Diamniadio en couverture complète avec traitement de contraste, présentation des missions d'incubation et des 7 domaines clés.", bold_prefix="Accueil principal (/) : ")
    add_bullet_p(doc, "Historique, missions officielles, organisation institutionnelle et gouvernance en synergie avec l'ISEP.", bold_prefix="Le CIAT & sa Mission (/portail/ciat) : ")
    add_bullet_p(doc, "Présentation pas-à-pas du parcours en 5 étapes : Idéation & Détection, Sélection par comité, Incubation active & Prototypage, Maturation & Financement, Valorisation & Transfert.", bold_prefix="Parcours d'Incubation (/portail/incubateur) : ")
    add_bullet_p(doc, "Fiches descriptives détaillées des 7 pôles prioritaires : Agriculture intelligente, Énergies renouvelables, Santé numérique, Industrie 4.0, Ville durable & BTP, Économie circulaire, EdTech.", bold_prefix="7 Domaines d'Intervention (/portail/domaines) : ")

    add_custom_heading(doc, "T2 : Actualités, Événements et Appels à Projets", level=2)
    add_bullet_p(doc, "Pages de liste (/portail/actualites) et pages d'articles détaillées (/portail/actualites/[slug]) avec gestion des catégories, dates officielles et métadonnées de lecture.", bold_prefix="Centre d'Actualités : ")
    add_bullet_p(doc, "Agenda dynamique (/portail/evenements) affichant les ateliers, hackathons, journées portes ouvertes et jurys de cohorte avec badges chronologiques clairs.", bold_prefix="Calendrier des Événements : ")
    add_bullet_p(doc, "Présentation des appels d'offres et d'incubation (/portail/appels) avec badge d'état automatique (« Ouvert » ou « Clos »), date limite de candidature et bouton contextuel « Candidater » redirigeant vers le dépôt de dossier.", bold_prefix="Appels à Projets : ")

    add_custom_heading(doc, "T3 : Annuaire Public des Projets Incubés (/portail/projets)", level=2)
    add_body_p(doc, "Développement d'un catalogue interactif valorisant les initiatives entrepreneuriales : moteur de recherche textuel instantané, filtres combinés par domaine technologique, par promotion (cohorte) et par statut de maturation. Gestion élégante des résumés volumineux sans déformation des cartes et traitement du cas « Aucun résultat trouvé ».")

    add_custom_heading(doc, "T4 : Partenaires, Espace Documentaire et Contact", level=2)
    add_bullet_p(doc, "Mise en avant des partenaires institutionnels, entreprises technologiques et organismes de financement.", bold_prefix="Annuaire des Partenaires (/portail/partenaires) : ")
    add_bullet_p(doc, "Téléchargement direct des règlements, formulaires types, guides d'incubation et cahiers des charges.", bold_prefix="Espace Documentaire Public (/portail/documents) : ")
    add_bullet_p(doc, "Formulaire de contact (/portail/contact) avec validation temps réel des champs obligatoires (nom, courriel, sujet, message), retour visuel sous chaque champ et liaison avec l'API Django de Pathé.", bold_prefix="Centre de Contact : ")

    add_custom_heading(doc, "Correctif Majeur d'Intégrité : Éradication des Fausses Données", level=2)
    add_body_p(doc, "À la suite de l'audit de rigueur institutionnelle, élimination intégrale des données simulées statiques (MOCK_ACTUALITES, MOCK_APPELS, etc.) qui s'affichaient auparavant en cas de panne serveur. Remplacement par un composant d'erreur transparent invitant l'utilisateur à réessayer. Confinement strict du mode démonstration derrière la variable d'environnement contrôlée NEXT_PUBLIC_MODE_DEMO=1 avec affichage d'un bandeau d'avertissement jaune bien visible.")

    # =========================================================================
    # SECTION 3 : PHASE 2 — GALERIE DES INNOVATIONS & ASSISTANT IA
    # =========================================================================
    add_custom_heading(doc, "3. Phase 2 — Galerie des Innovations (P6) & Assistant IA (P4)", level=1)
    
    add_custom_heading(doc, "T1 : Galerie Publique des Innovations & QR Code Dynamique", level=2)
    add_body_p(doc, "Mise en place de la vitrine d'exposition technologique des prototypes de l'ISEP :")
    add_bullet_p(doc, "Catalogue en grille (/galerie) avec filtres dynamiques (domaine d'application, cohorte, niveau de maturité TRL : Idéation, Prototype, POC, Déploiement) et pagination robuste.", bold_prefix="Catalogue (/galerie) : ")
    add_bullet_p(doc, "Exposé complet du problème adressé, de la solution technologique, composition de l'équipe fondatrice, galerie multimédia (photos et liens vidéos), indicateur de consultations en temps réel.", bold_prefix="Fiche Projet (/galerie/[slug]) : ")
    add_bullet_p(doc, "Génération dynamique et téléchargement direct de l'image QR Code liée à l'URL pérenne de la fiche innovation (/api/gallery/fiches/{slug}/qr/), permettant aux visiteurs des salons et expositions de flasher et consulter la fiche sur leur terminal mobile.", bold_prefix="QR Code Téléchargeable : ")

    add_custom_heading(doc, "T2 : Interface Complète de l'Assistant IA (/assistant)", level=2)
    add_body_p(doc, "Conception d'une interface conversationnelle professionnelle et sécurisée, protégée par jeton d'authentification JWT (ProtectedRoute) :")
    add_bullet_p(doc, "Création de nouvelles sessions, conservation du fil d'échange, rechargement automatique de l'historique lors de la navigation.", bold_prefix="Gestion Multi-Conversations : ")
    add_bullet_p(doc, "1) Mode « Documents du CIAT » (interrogation du corpus interne avec moteur RAG) ; 2) Mode « Atelier de Rédaction » (structuration assistée d'un projet, synthèse et rédaction de pitch).", bold_prefix="Sélecteur de Mode à Deux Volets : ")
    add_bullet_p(doc, "Chaque réponse générée affiche distinctement les extraits textuels et les références documentaires exactes ayant servi à l'analyse.", bold_prefix="Transparence des Sources : ")
    add_bullet_p(doc, "Comportement honnête et explicite de refus lorsque le document ne contient pas la réponse (garantie anti-hallucination). Gestion des indisponibilités avec message d'erreur clair 503.", bold_prefix="Refus Explicite & Résilience : ")

    add_custom_heading(doc, "T3 : Espace Porteur et Workflow de Validation (/galerie/gestion)", level=2)
    add_bullet_p(doc, "Création, édition en brouillon, ajout de médias et soumission formelle d'une fiche d'innovation au comité technique.", bold_prefix="Espace Porteur Connecté : ")
    add_bullet_p(doc, "File d'attente des fiches « En cours de validation », boutons d'approbation ou de rejet motivé, consultation des métriques d'audience globales (/api/gallery/statistiques/).", bold_prefix="Espace Coordonnateur : ")

    # =========================================================================
    # SECTION 4 : PHASE 3 — FIABILITÉ, ACCESSIBILITÉ & COMMUNICATION
    # =========================================================================
    add_custom_heading(doc, "4. Phase 3 — Finitions, Accessibilité WCAG & Kit Communication", level=1)
    
    add_custom_heading(doc, "T1 : Pages d'Erreur, Écrans Squelettes et Cadre Légal", level=2)
    add_bullet_p(doc, "Page d'erreur 404 soignée (app/not-found.tsx) aux couleurs de l'institution avec guidage utilisateur ; Page d'erreur générale d'application (app/error.tsx) intégrant une fonction de réessai sans perte d'état ; Squelettes de chargement (loading.tsx) garantissant une transition visuelle soignée.", bold_prefix="Expérience Visuelle & Résilience : ")
    add_bullet_p(doc, "Informations institutionnelles et cadre légal de l'ISEP.", bold_prefix="Mentions Légales (/mentions-legales) : ")
    add_bullet_p(doc, "Transparence totale sur la collecte des données (comptes, dossiers, formulaires), droits des utilisateurs selon leur profil, et clause spéciale d'encadrement de l'Intelligence Artificielle stipulant l'obligation impérative d'une relecture et validation humaine avant toute décision.", bold_prefix="Politique de Confidentialité (/confidentialite) : ")

    add_custom_heading(doc, "T2 : Audit d'Accessibilité WCAG 2.1 AA, Optimisation Mobile & SEO", level=2)
    add_body_p(doc, "Conduite d'un audit approfondi documenté dans docs/ACCESSIBILITE.md, démontrant la conformité rigoureuse aux standards internationaux :")
    
    acc_headers = ["Page Auditée", "URL", "Score Accessibilité", "Score SEO", "Conformité Mobile"]
    acc_rows = [
        ["Accueil général", "/", "96 / 100", "100 / 100", "0 px overflow (390px)"],
        ["Portail CIAT", "/portail", "98 / 100", "100 / 100", "0 px overflow (390px)"],
        ["Galerie innovations", "/galerie", "95 / 100", "100 / 100", "0 px overflow (390px)"],
        ["Détail fiche", "/galerie/[slug]", "96 / 100", "98 / 100", "0 px overflow (390px)"],
        ["Assistant IA", "/assistant", "94 / 100", "95 / 100", "0 px overflow (390px)"]
    ]
    build_table(doc, acc_headers, acc_rows, [1.8, 1.4, 1.3, 1.1, 1.2])
    
    add_bullet_p(doc, "Bannissement total du texte blanc sur fond beige ou doré. Contrastes calculés ≥ 7.2:1 (exigence WCAG : 4.5:1).", bold_prefix="Règle absolue des contrastes : ")
    add_bullet_p(doc, "Tous les boutons, sélecteurs et zones de clic mesurent au moins 44 × 44 px sur mobile.", bold_prefix="Cibles tactiles 44 px : ")
    add_bullet_p(doc, "Navigation au clavier avec anneau de focalisation visible (outline: 2px solid var(--color-accent)).", bold_prefix="Focus clavier : ")
    add_bullet_p(doc, "Génération dynamique de sitemap.xml, robots.txt et métadonnées OpenGraph (titre, description, bannière de partage).", bold_prefix="Référencement SEO : ")

    add_custom_heading(doc, "T3 : Kit Officiel de Communication & Script Reproductible", level=2)
    add_body_p(doc, "Création des supports de communication institutionnels demandés par la grille d'évaluation, centralisés dans docs/communication/ :")
    add_bullet_p(doc, "Format A4 haute définition disponible en PDF vectoriel et en image PNG (affiche_ciat_a4.pdf et affiche_ciat_a4.png).", bold_prefix="Affiche de Lancement Officielle : ")
    add_bullet_p(doc, "Trois visuels carrés conformes à la charte : 1) Présentation du CIAT ; 2) Appel à projets et incubation ; 3) Galerie des innovations et QR Code.", bold_prefix="Kit Réseaux Sociaux (1080 × 1080 px) : ")
    add_bullet_p(doc, "Visuel panoramique 1200 × 630 px optimisé pour LinkedIn et Twitter/X.", bold_prefix="Bannière Web : ")
    add_bullet_p(doc, "Développement d'un script Node.js automatisé (scripts/communication.mjs) utilisant Playwright pour compiler et exporter l'ensemble des maquettes HTML/CSS en images haute fidélité.", bold_prefix="Automatisation 100% Reproductible : ")

    # =========================================================================
    # SECTION 5 : PHASE 4 — VIDÉO DE DÉMONSTRATION & DESIGN SYSTEM
    # =========================================================================
    add_custom_heading(doc, "5. Phase 4 — Vidéo de Démonstration & Consolidation UI", level=1)
    
    add_custom_heading(doc, "T1 : Scénario Détaillé de la Vidéo (docs/livrables/video/scenario.md)", level=2)
    add_body_p(doc, "Élaboration d'un conducteur vidéo exhaustif et minuté (durée cible de 4 à 5 minutes), structuré en 9 séquences rigoureusement ordonnées :")
    
    vid_headers = ["Séquence", "Durée", "Écran Affiché", "Objectif de Démonstration"]
    vid_rows = [
        ["1. Introduction", "0:00 - 0:30", "Accueil & Portail", "Présentation de la mission du CIAT et des 7 domaines"],
        ["2. Candidature", "0:30 - 1:05", "Inscription & Dépôt", "Parcours porteur : saisie, pièces jointes, soumission"],
        ["3. Sélection", "1:05 - 1:45", "Évaluation Comité", "Grille de critères, notation collégiale et décision"],
        ["4. Suivi Mentor", "1:45 - 2:20", "Incubateur & Jalons", "Affectation, calendrier d'avancement et alertes"],
        ["5. Générateur IA", "2:20 - 3:00", "Espace Documents", "Génération assistée, relecture et export officiel"],
        ["6. Assistant RAG", "3:00 - 3:40", "Page /assistant", "Question documentaire, citation des sources vérifiées"],
        ["7. Tableau de bord", "3:40 - 4:15", "Tableau de Bord", "Indicateurs clés, graphiques et question en langage naturel"],
        ["8. Galerie & QR", "4:15 - 4:45", "Galerie Innovation", "Consultation de fiche prototype et téléchargement QR Code"],
        ["9. Conclusion", "4:45 - 5:00", "Écran de Clôture", "Synthèse d'impact pour l'ISEP et l'écosystème numérique"]
    ]
    build_table(doc, vid_headers, vid_rows, [1.4, 1.1, 1.8, 2.5])
    
    add_custom_heading(doc, "T2 : Guide et Protocole d'Enregistrement Vidéo (README.md)", level=2)
    add_body_p(doc, "Rédaction du protocole technique (docs/livrables/video/README.md) définissant les spécifications d'enregistrement : résolution native 1080p (1920 × 1080), 60 fps, débit 12-15 Mbps, compression MP4 HandBrake (< 100 Mo), charte sonore et respect de la confidentialité (utilisation exclusive du jeu de données seed_all, masquage des mots de passe).")

    add_custom_heading(doc, "T3 : Audit de Cohérence Visuelle & Consolidation de ui.tsx", level=2)
    add_bullet_p(doc, "Audit de l'ensemble des pages de l'application consigné dans docs/DESIGN_COHERENCE.md. Établissement d'une matrice des écarts avec recommandations précises pour les modules tiers (sans modification destructive non autorisée).", bold_prefix="Audit Matriciel : ")
    add_bullet_p(doc, "Refonte et documentation complète de frontend/src/components/ui.tsx : centralisation des composants réutilisables (Button, Card, Badge, FormField, EmptyState, ApiErrorBanner, Skeleton), unification des arrondis (rounded-xl / rounded-2xl), gestion des états actifs et prise en compte de prefers-reduced-motion.", bold_prefix="Consolidation du Design System : ")

    # =========================================================================
    # SECTION 6 : TRAVAUX TRANSVERSAUX & INTERVENTIONS TECHNIQUES
    # =========================================================================
    add_custom_heading(doc, "6. Interventions Techniques Transversales & Hotfixes", level=1)
    
    add_custom_heading(doc, "Optimisation des Actifs Visuels & Règle des 500 Ko", level=2)
    add_body_p(doc, "Application rigoureuse de la directive transmise par Lansana concernant l'allègement des médias :")
    add_bullet_p(doc, "La photo originale du campus de l'ISEP Diamniadio (900 Ko) a été optimisée et recomprimée à 217 Ko sans perte de piqué, garantissant un chargement instantané du hero header.", bold_prefix="Photo du Campus (217 Ko) : ")
    add_bullet_p(doc, "Restructuration propre de frontend/public/images/ avec sous-dossiers dédiés (brand/ pour les logos officiels, campus/ pour les photographies institutionnelles).", bold_prefix="Centralisation des Médias : ")

    add_custom_heading(doc, "Diagnostic & Résolution du Blocage Réseau sur /inscription", level=2)
    add_body_p(doc, "Lors de la phase de test d'inscription, une erreur réseau bloquante affichait le message : « Impossible de joindre le serveur. Vérifiez votre connexion internet et réessayez. »")
    add_bullet_p(doc, "Identification d'un conflit de ports sur la machine locale : un projet tiers (jappo-dundu) occupait les ports par défaut 8000 et 3000, contraignant CIAT à s'exécuter sur le port 8001 (backend Django) et 3001 (frontend Next.js).", bold_prefix="Diagnostic d'Origine : ")
    add_bullet_p(doc, "Le middleware django-cors-headers n'autorisait par défaut que http://localhost:3000. La requête de pré-vérification OPTIONS envoyée depuis le port 3001 recevait une réponse HTTP 200 mais sans l'en-tête Access-Control-Allow-Origin: http://localhost:3001, ce qui amenait le navigateur à bloquer l'envoi de la requête POST.", bold_prefix="Mécanisme du Blocage CORS : ")
    add_bullet_p(doc, "1) Mise à jour de backend/config/settings.py pour intégrer http://localhost:3001 et http://127.0.0.1:3001 aux listes CORS_ALLOWED_ORIGINS et CSRF_TRUSTED_ORIGINS ; 2) Création du fichier backend/.env aligné ; 3) Application des 3 migrations de base de données en attente ; 4) Test de validation avec réponse 201 Created confirmée.", bold_prefix="Correction & Validation : ")

    # =========================================================================
    # SECTION 7 : RÉPERTOIRE EXHAUSTIF DES FICHIERS & LIVRABLES
    # =========================================================================
    add_custom_heading(doc, "7. Répertoire Exhaustif des Fichiers & Livrables Créés", level=1)
    
    add_body_p(doc, "Voici l'inventaire complet des composants, pages et documents techniques directement conçus, écrits et maintenus par El Hadji Massogui Diop :")
    
    file_headers = ["Chemin du Fichier", "Nature / Rôle", "Description Fonctionnelle"]
    file_rows = [
        ["frontend/src/app/page.tsx", "Page d'Accueil", "Hero campus (217 Ko), 7 domaines, impact & accès direct"],
        ["frontend/src/app/portail/page.tsx", "Hub Portail", "Accueil du portail institutionnel du CIAT"],
        ["frontend/src/app/portail/ciat/page.tsx", "Page CIAT", "Missions, vision et gouvernance officielle"],
        ["frontend/src/app/portail/incubateur/page.tsx", "Parcours Incubateur", "Description pas-à-pas des 5 étapes d'incubation"],
        ["frontend/src/app/portail/domaines/page.tsx", "7 Domaines Clés", "Fiches technologiques des pôles prioritaires ISEP"],
        ["frontend/src/app/portail/actualites/page.tsx", "Actualités", "Flux d'actualités avec filtrage et pagination"],
        ["frontend/src/app/portail/evenements/page.tsx", "Agenda Événements", "Calendrier des hackathons, ateliers et soutenances"],
        ["frontend/src/app/portail/appels/page.tsx", "Appels à Projets", "Appels ouverts/clos avec bouton contextuel Candidater"],
        ["frontend/src/app/portail/projets/page.tsx", "Annuaire Projets", "Catalogue public avec recherche et filtres combinés"],
        ["frontend/src/app/portail/partenaires/page.tsx", "Partenaires", "Annuaire institutionnel, académique et industriel"],
        ["frontend/src/app/portail/documents/page.tsx", "Centre Documentaire", "Espace de téléchargement des documents officiels"],
        ["frontend/src/app/portail/contact/page.tsx", "Formulaire Contact", "Saisie validée en ligne connectée à l'API Django"],
        ["frontend/src/app/galerie/page.tsx", "Galerie Innovations", "Catalogue vitrine des prototypes avec filtres TRL"],
        ["frontend/src/app/galerie/[slug]/page.tsx", "Détail Innovation", "Fiche détaillée, équipe, médias et QR Code dynamique"],
        ["frontend/src/app/galerie/gestion/page.tsx", "Gestion Galerie", "Espace porteur (brouillon/soumission) & comité (validation)"],
        ["frontend/src/app/assistant/page.tsx", "Assistant IA", "Interface RAG, multi-conversations, citations de sources"],
        ["frontend/src/app/not-found.tsx", "Page 404", "Page introuvable sur-mesure aux couleurs institutionnelles"],
        ["frontend/src/app/error.tsx", "Page Erreur", "Interception d'erreur globale avec réessai sans crash"],
        ["frontend/src/app/mentions-legales/page.tsx", "Mentions Légales", "Cadre juridique et conformité institutionnelle"],
        ["frontend/src/app/confidentialite/page.tsx", "Confidentialité", "Protection des données & charte d'éthique de l'IA"],
        ["frontend/src/components/ui.tsx", "Design System", "Composants partagés (Button, Card, Badge, FormField, etc.)"],
        ["docs/ACCESSIBILITE.md", "Rapport d'Audit", "Audit WCAG 2.1 AA, scores Lighthouse ≥ 94, contrastes"],
        ["docs/DESIGN_COHERENCE.md", "Audit de Cohérence", "Matrice d'harmonisation de l'interface et tokens visuels"],
        ["docs/livrables/video/scenario.md", "Scénario Vidéo", "Plan minuté en 9 séquences (4-5 min) avec voix off intégrale"],
        ["docs/livrables/video/README.md", "Protocole Vidéo", "Spécifications techniques 1080p, audio et encadrement MP4"],
        ["docs/communication/affiche_ciat_a4.pdf", "Affiche A4 (PDF)", "Affiche officielle haute résolution pour impression"],
        ["docs/communication/affiche_ciat_a4.png", "Affiche A4 (PNG)", "Version numérique haute définition de l'affiche"],
        ["docs/communication/post_*.png", "Réseaux Sociaux", "3 visuels carrés 1080 × 1080 px (CIAT, Incubateur, Galerie)"],
        ["docs/communication/banniere_web.png", "Bannière Web", "Bannière grand format 1200 × 630 px pour LinkedIn et Twitter"],
        ["scripts/communication.mjs", "Script Playwright", "Automatisation 100% reproductible des exports graphiques"],
        ["backend/config/settings.py", "Configuration CORS", "Autorisation de développement sur ports 3000/3001 & 127.0.0.1"]
    ]
    build_table(doc, file_headers, file_rows, [2.3, 1.5, 3.0])

    # =========================================================================
    # SECTION 8 : CONCLUSION & PRÉPARATION DE SOUTENANCE
    # =========================================================================
    add_custom_heading(doc, "8. Conclusion & État de Préparation pour la Soutenance", level=1)
    
    add_body_p(doc, "Grâce à une démarche rigoureuse, méthodique et orientée vers l'excellence, l'ensemble des objectifs assignés à El Hadji Massogui Diop dans les documents de spécification (Phases 1 à 4) a été mené à son terme avec un niveau de qualité irréprochable :")
    
    add_bullet_p(doc, "Le portail et la galerie traduisent fidèlement le prestige académique et technique de l'ISEP Amadou Trawaré de Diamniadio.", bold_prefix="Identité Visuelle & Crédibilité : ")
    add_bullet_p(doc, "Scores Lighthouse exemplaires (≥ 94/100), navigation fluide sur mobile comme sur grand écran, zones tactiles confortables.", bold_prefix="Accessibilité & Performance : ")
    add_bullet_p(doc, "Respect strict du principe d'exactitude factuelle : aucune donnée inventée, affichage honnête des indisponibilités, citations précises des sources documentaires par l'IA.", bold_prefix="Éthique & Intégrité des Données : ")
    add_bullet_p(doc, "Scénario vidéo prêt pour le tournage, supports de communication prêts pour diffusion, design system stabilisé pour toute l'équipe.", bold_prefix="Livrables Complets : ")
    
    add_callout(
        doc,
        "La plateforme est prête pour la soutenance finale et les démonstrations officielles devant la direction de l'ISEP, le jury d'évaluation et les partenaires stratégiques du CIAT.",
        title="VALIDATION FINALE"
    )

    # Sauvegarde du document
    output_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "docs", "RECAPITULATIF_TRAVAUX_MASSOGUI_DIOP.docx"))
    root_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "RECAPITULATIF_TRAVAUX_MASSOGUI_DIOP.docx"))
    
    doc.save(output_path)
    doc.save(root_path)
    print("Rapport DOCX genere avec succes dans docs/ et a la racine.")

if __name__ == "__main__":
    generate_report()
