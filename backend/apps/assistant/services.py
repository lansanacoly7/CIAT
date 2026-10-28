"""Services métier pour l'assistant IA du CIAT (P4).

Comprend :
- L'extraction de texte multi-formats (PDF, Word, texte brut)
- Le découpage en passages (chunking)
- L'indexation locale des documents publics
- Le moteur de recherche avec normalisation, suppression d'accents,
  troncature à 5 lettres (mots de la même famille) et synonymes courants
- L'orchestration des conversations en mode « documents » et « atelier »
"""
import io
import json
import logging
import re
import unicodedata
import xml.etree.ElementTree as ET
import zipfile
import zlib

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

SYNONYMES_COURANTS = {
    "ou": ["situe", "situee", "localise", "localisee", "adresse", "lieu", "siege", "diamniadio"],
    "trouve": ["situe", "situee", "localise", "localisee", "adresse", "lieu", "siege", "diamniadio"],
    "trouver": ["situe", "situee", "localise", "localisee", "adresse", "lieu", "siege", "diamniadio"],
    "localisation": ["situe", "trouve", "adresse", "lieu", "siege", "diamniadio"],
    "situe": ["trouve", "localise", "adresse", "lieu", "siege", "diamniadio"],
    "adresse": ["situe", "trouve", "localise", "lieu", "siege", "diamniadio"],
    "duree": ["mois", "annee", "temps", "periode", "calendrier", "delai"],
    "cout": ["prix", "tarif", "montant", "budget", "financement", "subvention"],
    "financement": ["subvention", "aide", "montant", "budget", "fonds", "cout"],
    "qui": ["porteur", "candidat", "equipe", "critere", "eligible", "fondateur"],
}


class ServiceIANonConfigure(Exception):
    """Aucune clé d'API IA n'est configurée."""


class ServiceIAIndisponible(Exception):
    """Le service IA externe n'est pas joignable ou a renvoyé une erreur."""


class ReponseIAInvalide(Exception):
    """Le modèle IA a renvoyé un format JSON invalide ou inexploitable après nouvelle tentative."""


def normaliser_chaine(texte: str) -> str:
    """Supprime les accents, la ponctuation superflue et convertit en minuscules."""
    if not texte:
        return ""
    nfkd = unicodedata.normalize("NFKD", texte)
    sans_accents = "".join(c for c in nfkd if not unicodedata.combining(c))
    return sans_accents.lower().strip()


# ==============================================================================
# 1. Extraction textuelle multi-format
# ==============================================================================

def extraire_texte_docx(donnees: bytes) -> str:
    """Extrait le contenu textuel d'un document Word .docx sans exécutable externe.

    Justification métier et sécurité :
    - Traitement en bac à sable (sandbox) : exploite le format standard OpenXML (archive ZIP)
      avec ElementTree en mémoire, éliminant tout appel système dangereux ou dépendance lourde.
    - Robustesse : extrait séquentiellement les balises de paragraphes (<w:p>) et de texte (<w:t>)
      pour préserver la structure naturelle des documents institutionnels du CIAT.
    """
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
    """Extrait le texte d'un document PDF de façon souveraine et locale.

    Règle de sécurité et résilience :
    - Tolérance aux pannes : combine pypdf et un parseur de flux compressés zlib
      afin d'extraire le texte même lorsque le fichier est généré par des moteurs
      PDF variés (ReportLab, LaTeX, scanners OCR pré-traités).
    - Souveraineté : aucun appel d'API OCR externe payant ou non souverain.
    """
    try:
        import pypdf  # type: ignore

        reader = pypdf.PdfReader(io.BytesIO(donnees))
        textes = [page.extract_text() or "" for page in reader.pages]
        resultat = "\n".join(t for t in textes if t).strip()
        if resultat:
            return resultat
    except Exception:
        pass

    try:
        texte_brut = donnees.decode("utf-8")
        if not texte_brut.startswith("%PDF") and any(c.isalnum() for c in texte_brut):
            return texte_brut.strip()
    except Exception:
        pass

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

    try:
        return donnees.decode("utf-8", errors="ignore").strip()
    except Exception:
        return ""


def extraire_texte_fichier(fichier) -> str:
    """Extrait le texte d'un fichier téléversé avec détection par signature magique.

    Sécurité et intégrité :
    - Détection binaire : ne se fie pas uniquement à l'extension du nom de fichier, mais
      vérifie les signatures magiques (PK\x03\x04 pour docx, %PDF- pour les PDF) pour
      empêcher les erreurs de décodage binaire ou les fichiers malicieux masqués.
    - Protection du curseur : repositionne systématiquement le curseur avec seek(0).
    """
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

    if donnees.startswith(b"PK\x03\x04") or nom.endswith(".docx"):
        texte = extraire_texte_docx(donnees)
        if texte:
            return texte

    if donnees.startswith(b"%PDF") or nom.endswith(".pdf"):
        texte = extraire_texte_pdf(donnees)
        if texte:
            return texte

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
    """Découpe un texte documentaire en fragments fenêtrés avec chevauchement.

    Règle d'ingénierie RAG :
    - Le recouvrement (overlap de 40 mots) évite de scinder une phrase ou une condition
      réglementaire clé à la frontière de deux blocs, garantissant que le LLM dispose
      du contexte complet pour formuler sa réponse factuelle.
    """
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
    """Indexe les documents publics du portail dans la base de recherche locale.

    Règle d'étanchéité et confidentialité :
    - Périmètre strictement public : n'indexe que les documents de DocumentPublic
      (chartes, règlements, appels d'offres), interdisant formellement l'indexation
      des dossiers privés, projets en cours ou données personnelles des incubés.
    """
    PassageDocument.objects.all().delete()

    documents = DocumentPublic.objects.all()
    passages_crees = 0
    documents_indexes = 0

    for doc in documents:
        texte = ""
        if doc.fichier:
            texte = extraire_texte_fichier(doc.fichier)

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
# 3. Recherche élargie (accents ignorés, troncature 5 lettres, synonymes)
# ==============================================================================

def extraire_mots_cles(texte: str) -> list[str]:
    """Extrait les lemmes de la question en filtrant les mots vides."""
    texte_norm = normaliser_chaine(texte)
    tokens = re.findall(r"\b[a-z0-9_-]{2,}\b", texte_norm)
    mots = [t for t in tokens if t not in STOP_WORDS_FR]
    return mots if mots else tokens


def rechercher_passages(question: str, top_k: int = 3) -> list[PassageDocument]:
    """Recherche les passages pertinents avec élargissement lexical et phonétique/racine.

    Si le score lexical est faible ou nul, renvoie quand même les passages les
    plus proches (les 3 meilleurs, ou tous si le corpus est petit), en laissant
    la décision finale au modèle IA via les consignes du prompt.
    """
    passages_qs = list(PassageDocument.objects.select_related("document").all())
    if not passages_qs:
        return []

    mots_cles = extraire_mots_cles(question)

    # Élargissement des termes de recherche :
    # 1. Termes originaux normalisés
    # 2. Mots de la même famille (troncature à 5 lettres)
    # 3. Synonymes courants (ex: "ou", "trouve" -> "situe", "localise", "adresse", "diamniadio")
    termes_recherche = set()
    for mot in mots_cles:
        termes_recherche.add(mot)
        if len(mot) >= 5:
            termes_recherche.add(mot[:5])
        if mot in SYNONYMES_COURANTS:
            for syn in SYNONYMES_COURANTS[mot]:
                termes_recherche.add(syn)
                if len(syn) >= 5:
                    termes_recherche.add(syn[:5])

    scores = []
    question_norm = normaliser_chaine(question)

    for passage in passages_qs:
        score = 0.0
        texte_norm = normaliser_chaine(passage.texte)
        titre_norm = normaliser_chaine(passage.document.titre)

        for term in termes_recherche:
            # Correspondance dans le titre
            if term in titre_norm:
                score += 5.0

            # Correspondance dans le texte
            occurrences = texte_norm.count(term)
            if occurrences > 0:
                score += min(occurrences * 1.5, 6.0)

        # Bonus si une sous-chaîne significative de la question apparaît
        if len(question_norm) > 8 and question_norm in texte_norm:
            score += 10.0

        scores.append((score, passage))

    # Tri par score décroissant
    scores.sort(key=lambda item: item[0], reverse=True)

    # Si certains passages ont un score positif, on prend les meilleurs
    meilleurs = [p for s, p in scores if s > 0][:top_k]
    if meilleurs:
        return meilleurs

    # Sinon, on renvoie les passages les plus proches (les 3 premiers disponibles)
    return [p for _, p in scores[:top_k]]


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
    """Traite la requête utilisateur selon le mode métier actif (Documents ou Atelier).

    Garanties de sécurité et anti-hallucination :
    1. Mode « Documents » (RAG strict) :
       - Interroge exclusivement les extraits documentaires publics authentifiés du CIAT.
       - Exige une réponse en JSON structuré avec la liste ordonnée des passages réellement
         utilisés. Seuls les passages vérifiés côté serveur sont restitués comme sources.
       - Mécanisme de 2 tentatives avec capture explicite pour éviter tout blocage en 500.
    2. Mode « Atelier » (Assistance rédactionnelle) :
       - Accompagne les porteurs dans la structuration de pitchs, SWOT et fiches projets.
       - Règle anti-invention : obligation stricte pour le modèle d'insérer des marqueurs
         « [À COMPLÉTER : ...] » dès qu'un chiffre, nom ou résultat n'a pas été fourni.
    """
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
            "analyses SWOT, argumentaires ou plans d'action.\n\n"
            "CONSIGNES STRICTES :\n"
            "1. Il est strictement interdit d'inventer des chiffres, performances, dates, "
            "noms, partenaires ou résultats concernant le projet de l'utilisateur.\n"
            "2. Toute donnée manquante ou nécessaire doit obligatoirement être écrite sous "
            "la forme « [À COMPLÉTER : ...] » au lieu d'être inventée.\n"
            "3. Le pitch et l'ensemble de la rédaction doivent se limiter strictement aux "
            "informations fournies par l'utilisateur dans sa demande.\n"
            "4. Tu ne dois jamais inventer de règles, financements, clauses ou faits "
            "inexistants sur le CIAT.\n"
            "Reste constructif, méthodologique et structuré."
        )
        try:
            reponse_texte = ai.chat(historique_messages, system=system_prompt)
        except AINotConfigured as exc:
            raise ServiceIANonConfigure(str(exc)) from exc
        except AIError as exc:
            raise ServiceIAIndisponible(str(exc)) from exc

    else:
        # Mode documents : recherche documentaire stricte
        # Auto-indexation initiale si les passages sont vides mais des documents publics existent
        if not PassageDocument.objects.exists() and DocumentPublic.objects.exists():
            indexer_documents_publics()

        passages = rechercher_passages(contenu_utilisateur)

        # Le refus immédiat sans appel au modèle ne reste que si aucun passage n'existe du tout
        if not passages:
            reponse_texte = MESSAGE_REFUS_DOCUMENTS
            sources = []
        else:
            # Numérotation explicite des passages transmis [Passage 1], [Passage 2], ...
            extraits_contexte = "\n\n".join(
                f"[Passage {idx}] (Document #{p.document_id} — {p.document.titre})\n{p.texte}"
                for idx, p in enumerate(passages, start=1)
            )

            system_prompt = (
                "Tu es l'assistant virtuel officiel du CIAT (Centre d'Innovation et d'Accélération "
                "Technologique). Tu réponds aux questions des utilisateurs en te basant "
                "STRICTEMENT et UNIQUEMENT sur les extraits de documents officiels fournis "
                "ci-dessous. Tu ne dois rien inventer ni extrapoler.\n"
                "Consigne essentielle : si la réponse n'y est pas ou ne s'y trouve pas clairement, "
                "dis-le poliment et refuse d'inventer.\n"
                "Tu dois obligatoirement répondre au format JSON strict avec les deux clés suivantes :\n"
                "- \"reponse\" : ta réponse rédigée en français (chaîne de caractères). Si les informations "
                "ne permettent pas de répondre, dis-le clairement ici.\n"
                "- \"passages_utilises\" : la liste des numéros entiers des passages (ex: [1] ou [1, 2]) dont "
                "les extraits ont réellement été utilisés pour formuler ta réponse. Si aucun extrait ne contient "
                "la réponse ou n'a été utilisé, renvoie obligatoirement une liste vide [].\n"
                "Exemple : {\"reponse\": \"Le programme dure 6 mois renouvelable.\", \"passages_utilises\": [1]}"
            )

            prompt_utilisateur = (
                f"Extraits des documents officiels du CIAT :\n\n{extraits_contexte}\n\n"
                f"Question de l'utilisateur : {contenu_utilisateur}"
            )

            messages_payload = list(historique_messages[:-1]) + [
                {"role": "user", "content": prompt_utilisateur}
            ]

            reponse_texte = ""
            numeros_utilises = []
            derniere_erreur = None

            # Maximum 2 tentatives en cas de JSON invalide ou inexploitable
            for tentative in range(2):
                try:
                    raw_response = ai.chat(
                        messages_payload,
                        system=system_prompt,
                        json_mode=True,
                        temperature=0.2,
                    )
                except AINotConfigured as exc:
                    raise ServiceIANonConfigure(str(exc)) from exc
                except AIError as exc:
                    raise ServiceIAIndisponible(str(exc)) from exc
                except Exception as exc:
                    raise ServiceIAIndisponible(f"Erreur inattendue du service IA : {exc}") from exc

                try:
                    data = json.loads(raw_response)
                    if not isinstance(data, dict):
                        raise ValueError("La réponse racine doit être un objet JSON.")

                    rep = data.get("reponse") or data.get("response") or data.get("contenu") or data.get("message")
                    if isinstance(rep, str):
                        # Certains modèles échappent deux fois les caractères Unicode : on décode ces séquences.
                        rep = re.sub(r"\\u([0-9a-fA-F]{4})", lambda m_: chr(int(m_.group(1), 16)), rep)
                        # ... et parfois une barre oblique inutile devant l'apostrophe ou les guillemets.
                        rep = rep.replace("\\'", "'").replace('\\"', '"')
                    if not rep or not isinstance(rep, str) or not rep.strip():
                        raise ValueError("Le champ 'reponse' est manquant ou vide dans le JSON.")

                    raw_nums = data.get("passages_utilises")
                    if raw_nums is None:
                        raw_nums = data.get("sources") or data.get("passages") or []

                    if not isinstance(raw_nums, list):
                        raise ValueError("Le champ 'passages_utilises' doit être une liste.")

                    reponse_texte = rep.strip()
                    numeros_utilises = raw_nums
                    break  # Succès du parsing JSON
                except (json.JSONDecodeError, ValueError, TypeError) as exc:
                    derniere_erreur = str(exc)
                    logger.warning(
                        "Tentative %d : JSON invalide renvoyé par l'IA de l'assistant (%s)",
                        tentative + 1,
                        exc,
                    )

            if not reponse_texte:
                raise ReponseIAInvalide(
                    f"Le modèle IA a renvoyé une réponse invalide après nouvelle tentative ({derniere_erreur})."
                )

            # Validation stricte côté serveur : seuls les numéros existant parmi les passages transmis sont retenus
            sources = []
            vus_doc_ids = set()
            passages_map = {idx: p for idx, p in enumerate(passages, start=1)}
            doc_ids_map = {p.document_id: p for p in passages}

            for item in numeros_utilises:
                try:
                    num = int(item)
                except (ValueError, TypeError):
                    continue  # Numéro non entier ignoré

                # Résolution par numéro séquentiel [Passage X], ou subsidiairement par document_id
                p = passages_map.get(num) or doc_ids_map.get(num)
                # Un numéro inconnu est ignoré
                if p and p.document_id not in vus_doc_ids:
                    sources.append({
                        "document_id": p.document_id,
                        "titre": p.document.titre,
                        "extrait": (p.texte[:200].strip() + ("..." if len(p.texte) > 200 else "")),
                    })
                    vus_doc_ids.add(p.document_id)

    # Persistance de la réponse de l'assistant
    return MessageAssistant.objects.create(
        conversation=conversation,
        role=MessageAssistant.Role.ASSISTANT,
        contenu=reponse_texte,
        sources=sources,
        avertissement_ia=AVERTISSEMENT_IA_STANDARD,
        mode=mode,
    )
