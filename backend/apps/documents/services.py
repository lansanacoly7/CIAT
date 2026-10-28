"""Moteur de génération de documents administratifs assistée par IA pour le CIAT."""
import json
import logging
from typing import Any

from apps.core.ai import AIError, AINotConfigured, ai
from apps.documents.models import Document, ModeleDocument, VersionDocument

logger = logging.getLogger(__name__)


class DocumentsAIException(Exception):
    """Exception de base pour le moteur de documents."""


class ServiceIANonConfigure(DocumentsAIException):
    """Aucune clé d'API IA n'est disponible."""


class ServiceIAIndisponible(DocumentsAIException):
    """Tous les fournisseurs IA ont échoué."""


class ReponseIAInvalide(DocumentsAIException):
    """Le modèle IA a renvoyé un format JSON invalide ou des sections manquantes."""


def _extraire_sections_dict(data: Any, codes_attendus: list[str]) -> dict[str, str]:
    """Normalise la structure JSON renvoyée par le modèle pour extraire {code: contenu}.

    Règle de résilience :
    - Tolère les variations de formats selon les fournisseurs (dictionnaire plat de sections
      ou tableau d'objets `sections`), évitant les échecs de génération lorsque le modèle
      adopte une variante syntaxique valide.
    """
    resultat = {}

    if not isinstance(data, dict):
        return resultat

    # Cas 1 : data = {"code1": "texte", "code2": "texte"}
    for code in codes_attendus:
        if code in data and isinstance(data[code], str) and data[code].strip():
            resultat[code] = data[code].strip()

    # Cas 2 : data = {"sections": [{"code": "...", "contenu": "..."}, ...]}
    if len(resultat) < len(codes_attendus) and "sections" in data:
        sec_list = data["sections"]
        if isinstance(sec_list, list):
            for item in sec_list:
                if isinstance(item, dict):
                    c = item.get("code")
                    txt = item.get("contenu") or item.get("content") or item.get("texte")
                    if c in codes_attendus and isinstance(txt, str) and txt.strip():
                        resultat[c] = txt.strip()
        elif isinstance(sec_list, dict):
            for code in codes_attendus:
                if code in sec_list and isinstance(sec_list[code], str) and sec_list[code].strip():
                    resultat[code] = sec_list[code].strip()

    return resultat


def _construire_prompts(
    modele: ModeleDocument,
    sujet: str,
    infos: dict[str, Any] | None = None,
    projet: Any | None = None,
) -> tuple[str, str]:
    """Construit le prompt système et le prompt utilisateur pour le modèle de langage.

    Règles métier et sécurité éditoriale :
    - Priorité absolue des « infos » saisies : prévaut systématiquement sur les données
      statiques du projet en cas de divergence (dates, montants, noms d'experts).
    - Principe de précaution anti-invention : interdiction formelle d'extrapoler des clauses
      juridiques, des dates ou des montants non fournis ; insertion obligatoire de
      l'étiquette standard « [À COMPLÉTER : ...] ».
    - Structuration par modèle : injecte les directives de la charte CIAT et l'exemple
      de référence définis pour le gabarit officiel sélectionné.
    """
    system_prompt = (
        "Tu es le rédacteur officiel de documents institutionnels pour le CIAT "
        "(Centre d'Innovation, d'Application et de Transfert de l'ISEP Diamniadio).\n"
        "Tu rédiges avec un ton institutionnel rigoureux, soutenu, clair et professionnel en langue française.\n"
        "Règles impératives :\n"
        "1. Respecte scrupuleusement la charte éditoriale et graphique du CIAT/ISEP.\n"
        "2. Règle de priorité des informations : Les « infos » saisies par l'utilisateur ont priorité sur les données du projet lié. "
        "En cas de conflit (par exemple sur le nom du porteur, les dates ou le budget), utilise impérativement les informations fournies dans « infos ».\n"
        "3. Interdiction formelle d'inventer : Ne jamais inventer de chiffres, budgets, dates, noms de personnes, organismes, règles, obligations, "
        "procédures, délais ou clauses juridiques absents des données fournies. "
        "Quand une information nécessaire manque, écris obligatoirement « [À COMPLÉTER : ...] » au lieu de l'inventer.\n"
        "4. Rends obligatoirement ta réponse sous la forme d'un objet JSON valide contenant pour chaque "
        "code de section requis le texte complet rédigé sous forme de chaîne de caractères.\n"
        "Exemple de format attendu : { \"code_section_1\": \"Texte rédigé...\", \"code_section_2\": \"Texte rédigé...\" }"
    )

    user_prompt_lines = [
        f"# GÉNÉRATION DE DOCUMENT : {modele.type.nom.upper()} — {modele.nom}",
        f"**Sujet principal :** {sujet}",
    ]

    if modele.regles_charte:
        user_prompt_lines.append(f"\n## Directives de la charte CIAT\n{modele.regles_charte}")

    if modele.exemple_redaction:
        user_prompt_lines.append(f"\n## Exemple de référence\n{modele.exemple_redaction}")

    if projet is not None:
        user_prompt_lines.append(
            "\n## Contexte du projet incubé rattaché\n"
            f"- **Titre :** {projet.titre}\n"
            f"- **Domaine :** {projet.domaine.nom if projet.domaine else 'Non spécifié'}\n"
            f"- **Cohorte :** {projet.cohorte.nom if projet.cohorte else 'Aucune'}\n"
            f"- **Porteur :** {projet.porteur.get_full_name() or projet.porteur.email}\n"
            f"- **Résumé :** {projet.resume or 'N/A'}\n"
            f"- **Problématique ciblée :** {projet.probleme or 'N/A'}\n"
            f"- **Solution proposée :** {projet.solution or 'N/A'}"
        )

    if infos:
        user_prompt_lines.append("\n## Informations complémentaires fournies par l'utilisateur (« infos »)")
        for k, v in infos.items():
            user_prompt_lines.append(f"- **{k} :** {v}")

    user_prompt_lines.append(
        "\n## Consignes impératives de rigueur factuelle et de priorité\n"
        "- Priorité absolue des « infos » : Les « infos » saisies par l'utilisateur ont priorité sur les données du projet lié. "
        "En cas de conflit (par exemple le nom du porteur ou des dates), utilise les « infos ».\n"
        "- Interdiction stricte d'inventer : N'invente aucune règle, obligation, procédure, organisme, délai ou clause juridique "
        "absent des données fournies. Quand une information nécessaire manque, écris obligatoirement « [À COMPLÉTER : ...] » au lieu de l'inventer."
    )

    user_prompt_lines.append("\n## Sections obligatoires à rédiger")
    for sec in modele.sections:
        user_prompt_lines.append(
            f"- Code: `{sec.get('code')}` | Titre: **{sec.get('titre')}**\n"
            f"  Consigne: {sec.get('consigne')}"
        )

    user_prompt_lines.append(
        "\nIMPORTANT : Ta réponse doit être uniquement un JSON valide contenant tous les codes ci-dessus."
    )

    return system_prompt, "\n".join(user_prompt_lines)


def generer_document(
    modele: ModeleDocument,
    sujet: str,
    auteur: Any,
    infos: dict[str, Any] | None = None,
    projet: Any | None = None,
) -> dict[str, Any]:
    """Orchestre la génération assistée par IA d'un document administratif officiel.

    Règles de traçabilité et conformité juridique :
    - Déterminisme : utilise une température basse (0.2) pour maximiser la conformité
      aux consignes et aux gabarits officiels de l'ISEP/CIAT.
    - Résilience : gère un protocole de 2 tentatives avec diagnostic des sections manquantes
      avant de lever ReponseIAInvalide.
    - Versionnement strict : initialise immédiatement le document avec le statut 'brouillon'
      et crée la Version 1 (historique immuable consultable par les auditeurs).
    """
    if not ai.configured:
        raise ServiceIANonConfigure("Aucune clé d'API IA n'est définie dans le fichier .env.")

    codes_attendus = [s.get("code") for s in modele.sections if s.get("code")]
    system_prompt, user_prompt = _construire_prompts(modele, sujet, infos=infos, projet=projet)
    messages = [{"role": "user", "content": user_prompt}]

    sections_extraites = {}
    derniere_erreur = None

    # Maximum 2 tentatives en cas de JSON invalide ou section manquante
    for tentative in range(2):
        try:
            raw_response = ai.chat(
                messages,
                system=system_prompt,
                json_mode=True,
                temperature=0.2,
                max_tokens=2500,
            )
        except AINotConfigured as exc:
            raise ServiceIANonConfigure(str(exc)) from exc
        except AIError as exc:
            raise ServiceIAIndisponible(str(exc)) from exc
        except Exception as exc:
            raise ServiceIAIndisponible(f"Erreur inattendue du service IA : {exc}") from exc

        try:
            data = json.loads(raw_response)
            sections_extraites = _extraire_sections_dict(data, codes_attendus)
            # Vérifier que toutes les sections attendues sont bien présentes
            if len(sections_extraites) == len(codes_attendus):
                break
            else:
                manquantes = set(codes_attendus) - set(sections_extraites.keys())
                derniere_erreur = f"Sections manquantes : {', '.join(manquantes)}"
                logger.warning(
                    "Tentative %d : réponse IA incomplète (%s)", tentative + 1, derniere_erreur
                )
        except (json.JSONDecodeError, TypeError) as exc:
            derniere_erreur = f"JSON invalide : {exc}"
            logger.warning(
                "Tentative %d : JSON invalide renvoyé par l'IA (%s)", tentative + 1, exc
            )

    if len(sections_extraites) != len(codes_attendus):
        raise ReponseIAInvalide(
            f"Le modèle IA a renvoyé une réponse invalide après nouvelle tentative ({derniere_erreur})."
        )

    # Création du document et de la version 1
    titre_document = f"{modele.nom} — {sujet[:80]}"
    doc = Document.objects.create(
        modele=modele,
        titre=titre_document,
        sujet=sujet,
        projet=projet,
        auteur=auteur,
        statut=Document.Statut.BROUILLON,
    )

    sections_version = []
    for s in modele.sections:
        code = s.get("code")
        sections_version.append(
            {
                "code": code,
                "titre": s.get("titre"),
                "contenu": sections_extraites.get(code, ""),
            }
        )

    version = VersionDocument.objects.create(
        document=doc,
        numero=1,
        sections=sections_version,
        auteur=auteur,
    )

    return {
        "id": doc.id,
        "titre": doc.titre,
        "sections": sections_version,
        "statut": doc.statut,
        "version": version.numero,
    }
