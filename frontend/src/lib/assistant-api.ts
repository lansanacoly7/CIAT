/**
 * Client API pour l'Assistant IA du CIAT (Module P4).
 * Respecte rigoureusement les contrats d'API :
 * - GET /api/assistant/conversations/
 * - POST /api/assistant/conversations/
 * - GET /api/assistant/conversations/{id}/messages/
 * - POST /api/assistant/conversations/{id}/messages/ ({ contenu, mode })
 *
 * Supporte :
 * - Mode 'documents' (recherche stricte dans les documents publics avec sources citées)
 * - Mode 'atelier' (assistance à la rédaction de fiches de projet, pitchs, SWOT)
 * - Gestion du refus explicite et des erreurs HTTP 503
 * - Zéro fausse donnée : le simulateur n'est activé que si NEXT_PUBLIC_MODE_DEMO=1.
 */
import { api } from "./api";

export type AssistantMode = "documents" | "atelier";

export type SourceCitation = {
  document_id: number;
  titre: string;
  extrait: string;
};

export type MessageAssistant = {
  id: number;
  role: "user" | "assistant";
  contenu: string;
  sources: SourceCitation[];
  avertissement_ia: string;
  cree_le: string;
};

export type Conversation = {
  id: number;
  titre: string;
  cree_le: string;
};

export function isDemoMode(): boolean {
  return process.env.NEXT_PUBLIC_MODE_DEMO === "1";
}

const MOCK_SOURCES_INCUBATION: SourceCitation[] = [
  {
    document_id: 1,
    titre: "Dossier de Candidature Officiel — Cohorte d'Incubation 2026",
    extrait:
      "Le parcours d'incubation du CIAT dure 12 mois et se structure en 4 étapes majeures : pré-incubation et cadrage du problème (mois 1 à 3), prototypage en ateliers technologiques (mois 4 à 7), test pilote et validation terrain (mois 8 à 10), et transfert technologique / levée de fonds (mois 11 à 12).",
  },
  {
    document_id: 3,
    titre: "Règlement Intérieur de l'Incubateur & Sécurité des Ateliers",
    extrait:
      "Tout porteur incubé bénéficie d'un accès supervisé aux ateliers d'usinage, de prototypage électronique et d'analyse physico-chimique de l'ISEP Diamniadio, assorti d'un mentor technique référent.",
  },
];

const MOCK_SOURCES_PI: SourceCitation[] = [
  {
    document_id: 2,
    titre: "Charte de Propriété Intellectuelle & Transfert Technologique",
    extrait:
      "Les résultats inventifs issus des projets développés au CIAT demeurent la copropriété du porteur de projet et des inventeurs. Le CIAT accompagne les démarches de brevetage auprès de l'OAPI.",
  },
];

/**
 * Récupère la liste des conversations de l'utilisateur connecté.
 */
export async function getConversations(): Promise<Conversation[]> {
  try {
    return await api<Conversation[]>("/assistant/conversations/", {
      method: "GET",
      auth: true,
    });
  } catch (err) {
    if (isDemoMode()) {
      return [
        {
          id: 101,
          titre: "Critères d'éligibilité et parcours d'incubation 2026",
          cree_le: new Date(Date.now() - 3600000 * 24).toISOString(),
        },
        {
          id: 102,
          titre: "Atelier de rédaction : Pitch solution AgriSol",
          cree_le: new Date(Date.now() - 3600000 * 48).toISOString(),
        },
      ];
    }
    throw err;
  }
}

/**
 * Crée une nouvelle conversation.
 */
export async function createConversation(titre = "Nouvelle conversation"): Promise<Conversation> {
  try {
    return await api<Conversation>("/assistant/conversations/", {
      method: "POST",
      body: { titre },
      auth: true,
    });
  } catch (err) {
    if (isDemoMode()) {
      return {
        id: Date.now(),
        titre,
        cree_le: new Date().toISOString(),
      };
    }
    throw err;
  }
}

/**
 * Récupère l'historique des messages d'une conversation.
 */
export async function getMessages(conversationId: number): Promise<MessageAssistant[]> {
  try {
    return await api<MessageAssistant[]>(`/assistant/conversations/${conversationId}/messages/`, {
      method: "GET",
      auth: true,
    });
  } catch (err) {
    if (isDemoMode()) {
      if (conversationId === 101) {
        return [
          {
            id: 1,
            role: "user",
            contenu: "Comment se déroule le parcours d'incubation au CIAT et combien de temps dure-t-il ?",
            sources: [],
            avertissement_ia: "",
            cree_le: new Date(Date.now() - 3600000 * 24).toISOString(),
          },
          {
            id: 2,
            role: "assistant",
            contenu:
              "D'après les documents officiels du CIAT, le parcours d'incubation s'étale sur une durée de **12 mois** répartie en 4 phases successives :\n\n" +
              "1. **Mois 1 à 3 — Cadrage & Étude d'opportunité** : consolidation de la proposition de valeur et des hypothèses terrain.\n" +
              "2. **Mois 4 à 7 — Prototypage technologique** : conception assistée, fabrication sur les bancs d'essais et ateliers de l'ISEP Diamniadio avec un mentor attitré.\n" +
              "3. **Mois 8 à 10 — Expérimentation pilote** : déploiement en conditions réelles auprès des usagers et partenaires.\n" +
              "4. **Mois 11 à 12 — Transfert & Financement** : préparation de la levée de fonds, conventionnement industriel et protection intellectuelle (OAPI).\n\n" +
              "Les incubés ont un accès supervisé aux plateaux techniques et un suivi régulier assuré par le comité de pilotage.",
            sources: MOCK_SOURCES_INCUBATION,
            avertissement_ia:
              "Réponse générée par l'intelligence artificielle du CIAT à titre informatif.",
            cree_le: new Date(Date.now() - 3600000 * 23.9).toISOString(),
          },
        ];
      }
      return [];
    }
    throw err;
  }
}

/**
 * Envoie une question ou consigne à l'assistant IA.
 */
export async function sendMessage(
  conversationId: number,
  contenu: string,
  mode: AssistantMode = "documents"
): Promise<MessageAssistant> {
  try {
    return await api<MessageAssistant>(`/assistant/conversations/${conversationId}/messages/`, {
      method: "POST",
      body: { contenu, mode },
      auth: true,
    });
  } catch (err) {
    // Si nous sommes en mode démo explicite et que le backend renvoie 503 ou une erreur de connexion
    if (isDemoMode()) {
      const q = contenu.toLowerCase();

      // 1. Mode documents : détection de hors-sujet
      if (mode === "documents") {
        const estHorsSujet =
          q.includes("météo") ||
          q.includes("meteo") ||
          q.includes("recette") ||
          q.includes("cuisine") ||
          q.includes("football") ||
          q.includes("paris") ||
          q.includes("cinéma") ||
          q.includes("film");

        if (estHorsSujet) {
          return {
            id: Date.now(),
            role: "assistant",
            contenu:
              "Désolé, les documents publics du CIAT ne contiennent pas d'information permettant de répondre à cette question.",
            sources: [],
            avertissement_ia:
              "Réponse générée par l'intelligence artificielle du CIAT à titre informatif.",
            cree_le: new Date().toISOString(),
          };
        }

        // Question pertinente sur la PI
        if (q.includes("brevet") || q.includes("propriété") || q.includes("propriete") || q.includes("oapi")) {
          return {
            id: Date.now(),
            role: "assistant",
            contenu:
              "Selon la **Charte de Propriété Intellectuelle du CIAT**, tous les droits sur les innovations développées demeurent la copropriété du porteur de projet et des inventeurs.\n\n" +
              "L'ISEP Diamniadio et le CIAT apportent un appui juridique et méthodologique pour le dépôt de brevets et de modèles d'utilité auprès de l'Organisation Africaine de la Propriété Intellectuelle (OAPI).",
            sources: MOCK_SOURCES_PI,
            avertissement_ia:
              "Réponse générée par l'intelligence artificielle du CIAT à titre informatif.",
            cree_le: new Date().toISOString(),
          };
        }

        // Question pertinente générale sur l'incubation
        return {
          id: Date.now(),
          role: "assistant",
          contenu:
            "Conformément au **Dossier de Candidature Officiel 2026**, le programme d'accompagnement du CIAT sélectionne des projets dans 7 filières stratégiques (Agroalimentaire, Mécanique, Énergies renouvelables, TIC & IA, Santé, Éducation, Services aux collectivités).\n\n" +
            "Le parcours complet comprend 12 mois d'accompagnement personnalisé, un hébergement sur le campus de l'ISEP à Diamniadio et la mise à disposition des équipements techniques de pointe pour le passage de l'idée au prototype validé.",
          sources: MOCK_SOURCES_INCUBATION,
          avertissement_ia:
            "Réponse générée par l'intelligence artificielle du CIAT à titre informatif.",
          cree_le: new Date().toISOString(),
        };
      }

      // 2. Mode Atelier : structuration sans inventer de fausses données
      return {
        id: Date.now(),
        role: "assistant",
        contenu:
          "Voici une structure de travail recommandée pour votre demande en respectant la méthode CIAT :\n\n" +
          "### 1. Accroche & Problème\n" +
          "- **Constat terrain :** [À COMPLÉTER : Quel problème critique rencontrent vos usagers ?]\n" +
          "- **Impact mesurable :** [À COMPLÉTER : Chiffre ou coût de la défaillance actuelle]\n\n" +
          "### 2. Solution Technologique & Différenciation\n" +
          `- **Proposition de valeur :** ${contenu.slice(0, 100)}...\n` +
          "- **Verrou technique résolu :** [À COMPLÉTER : Quel composant matériel ou logiciel faites-vous évoluer ?]\n\n" +
          "### 3. Modèle Opérationnel & Validation\n" +
          "- **Stade d'avancement :** Prototype de laboratoire en cours de test.\n" +
          "- **Besoins CIAT identifiés :** Accès aux ateliers techniques et mentorat d'ingénieurs.\n\n" +
          "> *Rappel déontologique CIAT : veillez à ne renseigner que des métriques réelles et vérifiables lors de la présentation devant le comité.*",
        sources: [],
        avertissement_ia:
          "Réponse générée par l'intelligence artificielle du CIAT à titre informatif.",
        cree_le: new Date().toISOString(),
      };
    }

    throw err;
  }
}
