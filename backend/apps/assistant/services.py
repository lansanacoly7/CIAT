"""Services métier pour l'assistant IA du CIAT (P4).

Comprend :
- L'extraction de texte (PDF, Word, texte brut)
- Le découpage en passages (chunking)
- L'indexation locale par mots-clés
- Le moteur de recherche par pertinence lexicale
- L'orchestration des conversations en mode « documents » et « atelier »
"""
import io
import logging
import re
import xml.etree.ElementTree as ET
import zipfile
import zlib

from django.db.models import Q

from apps.core.ai import AIError, AINotConfigured, ai
from apps.portal.models import DocumentPublic

from .models import Conversation, MessageAssistant, PassageDocument

logger = logging.getLogger(__name__)

AVERTISSEMENT_IA_STANDARD = (
    "Réponse générée par l'intelligence artificielle du CIAT à titre informatif."
)

MESSAGE_REFUS_DOCUMENTS = (
    "Désolé, les documents publics du CIAT ne contiennent pas d'information "
    "permettant de répondre à cette question."
)

STOP_WORDS_FR = {
    "le", "la", "les", "un", "une", "des", "du", "de", "d", "et", "ou", "en",
    "dans", "pour", "par", "sur", "avec", "est", "sont", "ce", "cette", "ces",
    "qui", "que", "quoi", "comment", "quel", "quelle", "quels", "quelles",
    "au", "aux", "a", "à", "y", "il", "elle", "ils", "elles", "on", "nous",
    "vous", "se", "sa", "son", "ses", "leur", "leurs", "ne", "pas", "plus",
    "mon", "ton", "son", "mes", "tes", "ses", "notre", "votre",
    "ciat", "projet", "projets", "document", "documents",
}


class ServiceIANonConfigure(Exception):
    """Aucune clé d'API IA n'est configurée."""


class ServiceIAIndisponible(Exception):
    """Le service IA externe n'est pas joignable ou a renvoyé une erreur."""


# ==============================================================================
# 1. Extraction textuelle multi-format
# ==============================================================================

def extraire_texte_docx(donnees: bytes) -> str:
    """Extrait le texte d'un document Word .docx via zipfile et ElementTree."""
    try:
        with zipfile.ZipFile(io.BytesIO(donnees)) as z:
            if "word/document.xml" not in z.namelist():
                return ""
            xml_content = z.read("word/document.xml")
            tree = ET.fromstring(xml_content)
            textes = []
            for elem in tree.iter():
                if elem.tag.endswith("}t") and elem.text:
                    textes.append(elem.text)
                elif elem.tag.endswith("}p"):
                    textes.append("\n")
            return "".join(textes).strip()
    except Exception as exc:
        logger.warning("Échec extraction Word docx : %s", exc)
        return ""


def extraire_texte_pdf(donnees: bytes) -> str:
    """Extrait le texte d'un PDF via pypdf ou décodage standard des flux textuels."""
    # 1. Tentative avec pypdf si la bibliothèque est installée
    try:
        import pypdf  # type: ignore

        reader = pypdf.PdfReader(io.BytesIO(donnees))
        textes = [page.extract_text() or "" for page in reader.pages]
        resultat = "\n".join(t for t in textes if t).strip()
        if resultat:
            return resultat
    except Exception:
        pass

    # 2. Cas des fichiers de test (ex: SimpleUploadedFile avec contenu texte brut)
    try:
        texte_brut = donnees.decode("utf-8")
        if not texte_brut.startswith("%PDF") and any(c.isalnum() for c in texte_brut):
            return texte_brut.strip()
    except Exception:
        pass

    # 3. Extraction par analyse des flux de compression (FlateDecode / streams)
    textes = []
    stream_pattern = re.compile(rb"stream[\r\n]+(.*?)[\r\n]+endstream", re.DOTALL)
    for match in stream_pattern.finditer(donnees):
        flux = match.group(1)
        decompresse = None
        try:
            decompresse = zlib.decompress(flux)
        except Exception:
            try:
                decompresse = zlib.decompress(flux, -zlib.MAX_WBITS)
            except Exception:
                decompresse = flux

        if decompresse:
            tj_matches = re.findall(rb"\(([^)]+)\)\s*(?:Tj|'|\")", decompresse)
            for m in tj_matches:
                try:
                    textes.append(m.decode("utf-8", errors="ignore"))
                except Exception:
                    pass
            tj_array = re.findall(rb"\[(.*?)\]\s*TJ", decompresse)
            for arr in tj_array:
                parts = re.findall(rb"\(([^)]+)\)", arr)
                for p in parts:
                    try:
                        textes.append(p.decode("utf-8", errors="ignore"))
                    except Exception:
                        pass

    if textes:
        return " ".join(textes).strip()

    # Décodage de repli
    try:
        return donnees.decode("utf-8", errors="ignore").strip()
    except Exception:
        return ""


def extraire_texte_fichier(fichier) -> str:
    """Extrait tout le texte accessible d'un fichier (File ou FieldFile)."""
    if not fichier:
        return ""

    try:
        if hasattr(fichier, "seek"):
            fichier.seek(0)
        donnees = fichier.read()
    except Exception as exc:
        logger.warning("Impossible de lire le fichier : %s", exc)
        return ""

    if not donnees:
        return ""

    nom = getattr(fichier, "name", "").lower()

    # Format Word .docx
    if donnees.startswith(b"PK\x03\x04") or nom.endswith(".docx"):
        texte = extraire_texte_docx(donnees)
        if texte:
            return texte

    # Format PDF
    if donnees.startswith(b"%PDF") or nom.endswith(".pdf"):
        texte = extraire_texte_pdf(donnees)
        if texte:
            return texte

    # Formats texte brut (txt, md, csv, html, etc.)
    for enc in ("utf-8", "latin-1", "cp1252"):
        try:
            return donnees.decode(enc).strip()
        except UnicodeDecodeError:
            continue

    return donnees.decode("utf-8", errors="ignore").strip()


# ==============================================================================
# 2. Découpage en passages (chunking) et indexation
# ==============================================================================

def decouper_en_passages(texte: str, max_mots: int = 250, recouvrement: int = 40) -> list[str]:
    """Découpe un texte en passages d'environ `max_mots` mots avec chevauchement."""
    if not texte:
        return []

    texte_propre = re.sub(r"[ \t]+", " ", texte).strip()
    mots = texte_propre.split()
    if not mots:
        return []

    if len(mots) <= max_mots:
        return [" ".join(mots)]

    passages = []
    debut = 0
    pas = max(1, max_mots - recouvrement)
    while debut < len(mots):
        fin = min(len(mots), debut + max_mots)
        passages.append(" ".join(mots[debut:fin]))
        if fin == len(mots):
            break
        debut += pas

    return passages


def indexer_documents_publics() -> dict:
    """Réindexe l'ensemble des documents publics enregistrés dans la plateforme."""
    PassageDocument.objects.all().delete()

    documents = DocumentPublic.objects.all()
    passages_crees = 0
    documents_indexes = 0

    for doc in documents:
        texte = ""
        if doc.fichier:
            texte = extraire_texte_fichier(doc.fichier)

        # Si le fichier ne contient pas de texte ou est absent, on indexe les métadonnées
        contenu_complet = (
            f"Document CIAT : {doc.titre}. Catégorie : {doc.categorie}.\n{texte}".strip()
        )

        morceaux = decouper_en_passages(contenu_complet)
        for position, morceau in enumerate(morceaux):
            PassageDocument.objects.create(
                document=doc,
                texte=morceau,
                position=position,
            )
            passages_crees += 1

        documents_indexes += 1

    return {
        "documents_indexes": documents_indexes,
        "passages_crees": passages_crees,
    }


# ==============================================================================
# 3. Recherche lexicale par mots-clés
# ==============================================================================

def extraire_mots_cles(texte: str) -> list[str]:
    """Extrait les lemmes/mots-clés pertinents d'une question en filtrant les mots vides."""
    tokens = re.findall(r"\b[A-Za-zÀ-ÿ0-9_-]{3,}\b", texte.lower())
    mots = [t for t in tokens if t not in STOP_WORDS_FR]
    return mots if mots else tokens


def rechercher_passages(question: str, top_k: int = 3, score_min: float = 2.0) -> list[PassageDocument]:
    """Recherche et ordonne les passages les plus pertinents pour répondre à une question."""
    mots_cles = extraire_mots_cles(question)
    if not mots_cles:
        return []

    # Filtrer les passages contenant au moins un mot-clé
    q_filter = Q()
    for kw in mots_cles:
        q_filter |= Q(texte__icontains=kw) | Q(document__titre__icontains=kw)

    candidats = list(
        PassageDocument.objects.filter(q_filter)
        .select_related("document")
    )
    if not candidats:
        return []

    scores = []
    question_lower = question.lower()

    for passage in candidats:
        score = 0.0
        texte_lower = passage.texte.lower()
        titre_lower = passage.document.titre.lower()

        mots_trouves = 0
        for kw in mots_cles:
            kw_lower = kw.lower()
            if kw_lower in titre_lower:
                score += 5.0
                mots_trouves += 1

            occurrences = texte_lower.count(kw_lower)
            if occurrences > 0:
                score += min(occurrences * 1.5, 6.0)
                mots_trouves += 1

        # Bonus pour la diversité des termes trouvés
        score += mots_trouves * 2.0

        # Bonus si une séquence exacte de la question apparaît
        if len(question_lower) > 8 and question_lower in texte_lower:
            score += 10.0

        if score >= score_min:
            scores.append((score, passage))

    scores.sort(key=lambda item: item[0], reverse=True)
    return [passage for _, passage in scores[:top_k]]


# ==============================================================================
# 4. Traitement conversationnel (mode documents & mode atelier)
# ==============================================================================

def verifier_service_ia():
    """Vérifie si au moins un fournisseur IA est opérationnel."""
    if not ai.configured:
        raise ServiceIANonConfigure(
            "Aucune clé d'API IA n'est définie dans les variables d'environnement."
        )


def traiter_message_assistant(
    conversation: Conversation,
    contenu_utilisateur: str,
    mode: str = "documents",
) -> MessageAssistant:
    """Traite la question de l'utilisateur, interroge l'IA et persiste la réponse."""
    verifier_service_ia()

    # Enregistrement du message utilisateur
    MessageAssistant.objects.create(
        conversation=conversation,
        role=MessageAssistant.Role.USER,
        contenu=contenu_utilisateur,
        mode=mode,
    )

    # Mise à jour du titre de conversation si c'est le premier échange
    if conversation.titre == "Nouvelle conversation":
        titre_extrait = contenu_utilisateur.strip()
        if len(titre_extrait) > 60:
            titre_extrait = titre_extrait[:57] + "..."
        conversation.titre = titre_extrait
        conversation.save(update_fields=["titre", "modifie_le"])

    # Construction de l'historique de la conversation pour le modèle
    historique_messages = []
    for msg in conversation.messages.all().order_by("cree_le")[:8]:
        historique_messages.append({"role": msg.role, "content": msg.contenu})

    sources = []

    if mode == MessageAssistant.Mode.ATELIER:
        # Mode atelier : assistance à la rédaction (pitch, SWOT, fiche projet)
        system_prompt = (
            "Tu es l'assistant atelier du CIAT (Centre d'Innovation et d'Accélération "
            "Technologique). Tu accompagnes les porteurs de projet et les équipes dans "
            "la rédaction de leurs documents de travail : fiches de projet, pitchs, "
            "analyses SWOT, argumentaires ou plans d'action.\n"
            "Tu apportes une aide structurée, claire, méthodologique et professionnelle.\n"
            "RÈGLE ABSOLUE : tu ne dois jamais inventer de faits, chiffres, règles, "
            "financements, clauses contractuelles ou informations internes inexistantes "
            "sur le CIAT. Reste concentré sur la méthodologie et l'aide à la formulation."
        )
        try:
            reponse_texte = ai.chat(historique_messages, system=system_prompt)
        except AINotConfigured as exc:
            raise ServiceIANonConfigure(str(exc)) from exc
        except AIError as exc:
            raise ServiceIAIndisponible(str(exc)) from exc

    else:
        # Mode documents : recherche documentaire stricte
        # Auto-indexation initiale si aucune donnée n'a encore été indexée
        if not PassageDocument.objects.exists() and DocumentPublic.objects.exists():
            indexer_documents_publics()

        passages = rechercher_passages(contenu_utilisateur)

        if not passages:
            # Refus explicite si aucun extrait pertinent n'est trouvé
            reponse_texte = MESSAGE_REFUS_DOCUMENTS
            sources = []
        else:
            sources = [
                {
                    "document_id": p.document_id,
                    "titre": p.document.titre,
                    "extrait": (p.texte[:200].strip() + ("..." if len(p.texte) > 200 else "")),
                }
                for p in passages
            ]

            extraits_contexte = "\n\n".join(
                f"[Document #{p.document_id} — {p.document.titre}]\n{p.texte}"
                for p in passages
            )

            system_prompt = (
                "Tu es l'assistant virtuel du CIAT (Centre d'Innovation et d'Accélération "
                "Technologique). Tu réponds aux questions des utilisateurs en te basant "
                "STRICTEMENT et UNIQUEMENT sur les extraits de documents officiels fournis "
                "ci-dessous. Tu ne dois rien inventer ni extrapoler.\n"
                "Si l'information demandée ne figure pas clairement dans les extraits, "
                "indique poliment que les documents publics disponibles ne permettent pas "
                "d'y répondre.\n"
                "Réponds en français dans un style clair, courtois et précis."
            )

            prompt_utilisateur = (
                f"Extraits des documents officiels du CIAT :\n\n{extraits_contexte}\n\n"
                f"Question de l'utilisateur : {contenu_utilisateur}"
            )

            messages_payload = list(historique_messages[:-1]) + [
                {"role": "user", "content": prompt_utilisateur}
            ]

            try:
                reponse_texte = ai.chat(messages_payload, system=system_prompt)
            except AINotConfigured as exc:
                raise ServiceIANonConfigure(str(exc)) from exc
            except AIError as exc:
                raise ServiceIAIndisponible(str(exc)) from exc

    # Persistance de la réponse de l'assistant
    return MessageAssistant.objects.create(
        conversation=conversation,
        role=MessageAssistant.Role.ASSISTANT,
        contenu=reponse_texte,
        sources=sources,
        avertissement_ia=AVERTISSEMENT_IA_STANDARD,
        mode=mode,
    )
