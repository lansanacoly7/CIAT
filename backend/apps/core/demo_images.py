"""Générateur d'images de démonstration locales avec Pillow (Phase 4 — T3).

Génère des visuels conformes à la charte graphique du CIAT (brun #612D10, ocre doré #C99A68) :
- Actualités (800x480, JPEG < 100 Ko)
- Logos de partenaires (400x400, PNG < 50 Ko)
- Fiches de la galerie des innovations (800x600, JPEG < 120 Ko)

Règles strictes :
- Totalement local, aucune image externe ou problème de droits d'auteur.
- Strictement idempotent : ne régénère pas une image déjà présente.
- Léger : toutes les images restent largement sous 150 Ko.
"""
from datetime import datetime
import io
import logging
from pathlib import Path

from django.conf import settings
from django.core.files.base import ContentFile
from django.core.files.storage import default_storage
from django.utils.text import slugify
from PIL import Image, ImageDraw, ImageFont

logger = logging.getLogger(__name__)

# Couleurs officielles de la charte CIAT (globals.css)
BRUN_CIAT = (97, 45, 16)      # #612D10 (couleur primaire)
BRUN_NUIT = (36, 20, 13)      # #24140D (fond profond)
OCRE_DORE = (201, 154, 104)   # #C99A68 (or / accent)
OCRE_CLAIR = (229, 196, 159)  # #E5C49F (texte doux doré)
SABLE = (250, 247, 242)       # #FAF7F2 (ivoire / lin clair)
VERT_CIAT = (46, 125, 50)     # #2E7D32 (succès / vert espoir)
BLANC = (255, 255, 255)


def get_font(size: int, bold: bool = False):
    """Charge une police TrueType système avec repli robuste cross-platform."""
    names = (
        ["arialbd.ttf", "DejaVuSans-Bold.ttf", "segoeuib.ttf", "LiberationSans-Bold.ttf"]
        if bold
        else ["arial.ttf", "DejaVuSans.ttf", "segoeui.ttf", "LiberationSans-Regular.ttf"]
    )
    for name in names:
        try:
            return ImageFont.truetype(name, size)
        except Exception:
            continue
    try:
        return ImageFont.load_default()
    except Exception:
        return None


def wrap_text(text: str, max_chars: int = 38) -> list[str]:
    """Découpe un texte en plusieurs lignes selon un nombre maximal de caractères."""
    if not text:
        return []
    words = text.strip().split()
    lines = []
    current_line = []
    current_len = 0
    for word in words:
        addition = len(word) + (1 if current_line else 0)
        if current_len + addition > max_chars and current_line:
            lines.append(" ".join(current_line))
            current_line = [word]
            current_len = len(word)
        else:
            current_line.append(word)
            current_len += addition
    if current_line:
        lines.append(" ".join(current_line))
    return lines


def generer_image_actualite(actualite, force: bool = False) -> bool:
    """Génère l'image d'en-tête d'une actualité (800x480) si manquante.
    
    Renvoie True si une nouvelle image a été générée, False si déjà existante.
    """
    filename = f"actualites/{actualite.slug}.jpg"
    
    # Contrôle d'idempotence : ne pas écraser si l'image est déjà enregistrée et présente
    if not force and actualite.image and actualite.image.name:
        try:
            if default_storage.exists(actualite.image.name):
                return False
        except Exception:
            pass

    width, height = 800, 480
    img = Image.new("RGB", (width, height), color=BRUN_NUIT)
    draw = ImageDraw.Draw(img)

    # Dégradé vertical élégant du Brun Nuit au Brun CIAT
    for y in range(height):
        ratio = y / height
        r = int(BRUN_NUIT[0] + (BRUN_CIAT[0] - BRUN_NUIT[0]) * ratio)
        g = int(BRUN_NUIT[1] + (BRUN_CIAT[1] - BRUN_NUIT[1]) * ratio)
        b = int(BRUN_NUIT[2] + (BRUN_CIAT[2] - BRUN_NUIT[2]) * ratio)
        draw.line([(0, y), (width, y)], fill=(r, g, b))

    # Cadre doré institutionnel
    draw.rectangle([(16, 16), (width - 16, height - 16)], outline=OCRE_DORE, width=2)
    draw.rectangle([(22, 22), (width - 22, height - 22)], outline=(BRUN_CIAT[0], BRUN_CIAT[1], BRUN_CIAT[2]), width=1)

    # Lignes de séparation dorées
    draw.line([(32, 74), (width - 32, 74)], fill=OCRE_DORE, width=1)
    draw.line([(32, height - 60), (width - 32, height - 60)], fill=OCRE_DORE, width=1)

    # Badge de catégorie
    badge_font = get_font(13, bold=True)
    draw.rectangle([(32, 34), (260, 62)], fill=BRUN_CIAT, outline=OCRE_DORE, width=1)
    draw.text((44, 40), "CIAT • ACTUALITÉ OFFICIELLE", fill=OCRE_DORE, font=badge_font)

    # Date de publication
    date_str = actualite.publie_le.strftime("%d/%m/%Y") if actualite.publie_le else datetime.now().strftime("%d/%m/%Y")
    draw.text((width - 130, 40), f"Dakar, {date_str}", fill=OCRE_CLAIR, font=badge_font)

    # Titre de l'actualité
    title_font = get_font(26, bold=True)
    lines = wrap_text(actualite.titre, max_chars=40)[:3]
    start_y = 130 if len(lines) > 2 else 150
    for idx, line in enumerate(lines):
        draw.text((44, start_y + idx * 38), line, fill=BLANC, font=title_font)

    # Résumé / Accroche
    if actualite.resume:
        resume_font = get_font(15, bold=False)
        resume_lines = wrap_text(actualite.resume, max_chars=68)[:2]
        r_y = start_y + len(lines) * 38 + 20
        for r_line in resume_lines:
            draw.text((44, r_y), r_line, fill=OCRE_CLAIR, font=resume_font)
            r_y += 24

    # Pied de page institutionnel
    footer_font = get_font(13, bold=False)
    draw.text(
        (44, height - 44),
        "Centre d'Innovation, d'Application et de Transfert — ISEP Amadou Trawaré, Diamniadio",
        fill=OCRE_DORE,
        font=footer_font,
    )

    buf = io.BytesIO()
    img.save(buf, format="JPEG", quality=85, optimize=True)
    content_file = ContentFile(buf.getvalue(), name=f"{actualite.slug}.jpg")

    actualite.image.save(f"{actualite.slug}.jpg", content_file, save=False)
    actualite.publie = True
    actualite.save(update_fields=["image", "publie"])
    return True


def generer_logo_partenaire(partenaire, force: bool = False) -> bool:
    """Génère le logo graphique d'un partenaire (400x400) si manquant.
    
    Renvoie True si un nouveau logo a été généré, False si déjà existant.
    """
    slug = slugify(partenaire.nom)[:40] or "partenaire"
    filename = f"partenaires/logo_{slug}.png"

    # Contrôle d'idempotence
    if not force and partenaire.logo and partenaire.logo.name:
        try:
            if default_storage.exists(partenaire.logo.name):
                return False
        except Exception:
            pass

    width, height = 400, 400
    img = Image.new("RGB", (width, height), color=SABLE)
    draw = ImageDraw.Draw(img)

    # Double bordure aux couleurs du CIAT
    draw.rectangle([(12, 12), (width - 12, height - 12)], outline=BRUN_CIAT, width=2)
    draw.rectangle([(18, 18), (width - 18, height - 18)], outline=OCRE_DORE, width=1)

    # Médaillon central
    center_x, center_y = width // 2, 170
    radius = 90
    draw.ellipse(
        [(center_x - radius, center_y - radius), (center_x + radius, center_y + radius)],
        fill=BRUN_CIAT,
        outline=OCRE_DORE,
        width=3,
    )

    # Sigle ou acronyme extrait du nom
    sigle = ""
    # Extraction heuristique d'acronyme entre parenthèses ex: (MESRI), (DER/FJ)
    if "(" in partenaire.nom and ")" in partenaire.nom:
        sigle = partenaire.nom.split("(")[1].split(")")[0].strip()
    if not sigle:
        # Prendre les initiales des mots principaux
        mots = [m for m in partenaire.nom.split() if len(m) > 2 and m.lower() not in ("de", "du", "des", "la", "le", "et", "au", "aux")]
        sigle = "".join([m[0].upper() for m in mots[:4]])
    if not sigle:
        sigle = "CIAT"

    sigle_font = get_font(36 if len(sigle) <= 4 else 28, bold=True)
    # Centrage du sigle
    sigle_lines = wrap_text(sigle, max_chars=8)
    for s_idx, s_line in enumerate(sigle_lines):
        draw.text((center_x - len(s_line) * 11, center_y - 20 + s_idx * 30), s_line, fill=OCRE_DORE, font=sigle_font)

    # Bandeau sous le médaillon
    bandeau_font = get_font(12, bold=True)
    draw.rectangle([(30, 280), (width - 30, 304)], fill=BRUN_CIAT)
    draw.text((center_x - 72, 285), "PARTENAIRE OFFICIEL", fill=OCRE_DORE, font=bandeau_font)

    # Nom du partenaire en pied
    nom_font = get_font(13, bold=True)
    nom_lines = wrap_text(partenaire.nom, max_chars=32)[:3]
    y_text = 315
    for n_line in nom_lines:
        draw.text((center_x - len(n_line) * 4, y_text), n_line, fill=BRUN_NUIT, font=nom_font)
        y_text += 18

    buf = io.BytesIO()
    img.save(buf, format="PNG", optimize=True)
    content_file = ContentFile(buf.getvalue(), name=f"logo_{slug}.png")

    partenaire.logo.save(f"logo_{slug}.png", content_file, save=True)
    return True


def generer_photo_galerie(fiche, force: bool = False) -> bool:
    """Génère la photo représentative d'un prototype de galerie (800x600).
    
    Remplace toute URL externe non souveraine dans fiche.medias par le visuel généré.
    Renvoie True si une nouvelle image a été générée, False sinon.
    """
    slug = fiche.slug or f"fiche_{fiche.id}"
    relative_path = f"galerie/fiche_{slug}.jpg"
    media_url = f"{settings.MEDIA_URL.rstrip('/')}/{relative_path}"

    deja_present = False
    try:
        if default_storage.exists(relative_path):
            deja_present = True
    except Exception:
        deja_present = False

    modifie = False

    if force or not deja_present:
        width, height = 800, 600
        img = Image.new("RGB", (width, height), color=BRUN_NUIT)
        draw = ImageDraw.Draw(img)

        # Dégradé diagonal sombre et contrasté
        for y in range(height):
            ratio = y / height
            r = int(BRUN_NUIT[0] + (BRUN_CIAT[0] - BRUN_NUIT[0]) * ratio)
            g = int(BRUN_NUIT[1] + (BRUN_CIAT[1] - BRUN_NUIT[1]) * ratio)
            b = int(BRUN_NUIT[2] + (BRUN_CIAT[2] - BRUN_NUIT[2]) * ratio)
            draw.line([(0, y), (width, y)], fill=(r, g, b))

        # Cadre or avec coins biseautés
        draw.rectangle([(20, 20), (width - 20, height - 20)], outline=OCRE_DORE, width=2)
        draw.rectangle([(26, 26), (width - 26, height - 26)], outline=BRUN_CIAT, width=1)

        # Trame technologique (grille discrète)
        for gx in range(50, width - 40, 70):
            draw.line([(gx, 40), (gx, height - 40)], fill=(45, 25, 16), width=1)
        for gy in range(50, height - 40, 70):
            draw.line([(40, gy), (width - 40, gy)], fill=(45, 25, 16), width=1)

        # Badge domaine technologique
        domaine_nom = ""
        try:
            domaine_nom = fiche.projet.domaine.nom.upper()
        except Exception:
            domaine_nom = "INNOVATION TECHNOLOGIQUE"

        badge_font = get_font(13, bold=True)
        draw.rectangle([(40, 44), (40 + min(450, len(domaine_nom) * 11 + 30), 74)], fill=BRUN_CIAT, outline=OCRE_DORE, width=1)
        draw.text((52, 51), f"PROTOTYPE • {domaine_nom[:35]}", fill=OCRE_DORE, font=badge_font)

        # Niveau d'avancement
        avancement = (fiche.avancement or "Prototype").upper()
        draw.rectangle([(width - 220, 44), (width - 40, 74)], fill=VERT_CIAT, outline=BLANC, width=1)
        draw.text((width - 206, 51), f"TRL VALIDÉ : {avancement[:16]}", fill=BLANC, font=badge_font)

        # Titre du projet / prototype
        title_font = get_font(30, bold=True)
        lines = wrap_text(fiche.titre, max_chars=36)[:3]
        y_title = 180
        for l in lines:
            draw.text((50, y_title), l, fill=BLANC, font=title_font)
            y_title += 44

        # Séparateur doré
        draw.line([(50, y_title + 10), (width - 50, y_title + 10)], fill=OCRE_DORE, width=2)

        # Solution technique synthétique
        if fiche.solution:
            sol_font = get_font(16, bold=False)
            sol_lines = wrap_text(fiche.solution, max_chars=64)[:3]
            y_sol = y_title + 26
            for s_line in sol_lines:
                draw.text((50, y_sol), s_line, fill=OCRE_CLAIR, font=sol_font)
                y_sol += 25

        # Pied de page
        footer_font = get_font(14, bold=False)
        draw.rectangle([(20, height - 60), (width - 20, height - 20)], fill=BRUN_NUIT)
        draw.text(
            (50, height - 48),
            "Ateliers de Prototypage & FabLab — CIAT ISEP Amadou Trawaré, Diamniadio",
            fill=OCRE_DORE,
            font=footer_font,
        )

        buf = io.BytesIO()
        img.save(buf, format="JPEG", quality=85, optimize=True)
        content_file = ContentFile(buf.getvalue(), name=f"fiche_{slug}.jpg")

        # Sauvegarde dans default_storage
        default_storage.save(relative_path, content_file)
        modifie = True

    # Mise à jour de fiche.medias pour supprimer les URLs externes (unsplash)
    # et garantir une photo locale valide en tête
    medias_existants = fiche.medias or []
    autres_medias = [
        m for m in medias_existants
        if m.get("type") in ("video", "demo")
    ]
    photo_principale = {
        "type": "photo",
        "url": media_url,
        "legende": f"Démonstration du prototype {fiche.titre} dans les ateliers du CIAT",
    }

    nouveaux_medias = [photo_principale] + autres_medias
    if fiche.medias != nouveaux_medias:
        fiche.medias = nouveaux_medias
        fiche.save(update_fields=["medias"])
        modifie = True

    return modifie


def generer_toutes_images_demo(stdout=None, force: bool = False) -> dict:
    """Génère l'ensemble des images de démonstration pour le portail et la galerie."""
    from apps.portal.models import Actualite, Partenaire
    from apps.gallery.models import FicheInnovation

    def write(msg):
        if stdout:
            stdout.write(msg)

    stats = {
        "actualites_creees": 0,
        "actualites_existantes": 0,
        "partenaires_crees": 0,
        "partenaires_existants": 0,
        "galerie_creees": 0,
        "galerie_existantes": 0,
    }

    # 1. Actualités
    for actu in Actualite.objects.all():
        if generer_image_actualite(actu, force=force):
            stats["actualites_creees"] += 1
        else:
            stats["actualites_existantes"] += 1

    # 2. Partenaires
    for part in Partenaire.objects.all():
        if generer_logo_partenaire(part, force=force):
            stats["partenaires_crees"] += 1
        else:
            stats["partenaires_existants"] += 1

    # 3. Fiches Galerie (notamment publiées)
    for fiche in FicheInnovation.objects.all():
        if generer_photo_galerie(fiche, force=force):
            stats["galerie_creees"] += 1
        else:
            stats["galerie_existantes"] += 1

    write(
        f"Images démo prêtes (idempotent) : "
        f"{stats['actualites_creees']} actualités, "
        f"{stats['partenaires_crees']} partenaires, "
        f"{stats['galerie_creees']} fiches galerie générées "
        f"({stats['actualites_existantes'] + stats['partenaires_existants'] + stats['galerie_existantes']} déjà présentes)."
    )
    return stats
