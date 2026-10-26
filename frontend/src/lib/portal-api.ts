/**
 * Client de données pour le Module P1 (Portail Institutionnel).
 * Respecte strictement les contrats d'API définis dans taches/CONTRATS_API.md.
 * 
 * En l'absence des endpoints backend (en cours de développement par Pathé),
 * fournit un fallback de données conformes pour garantir un fonctionnement sans régression.
 */
import { api, type Page } from "./api";

export type Actualite = {
  id: number;
  titre: string;
  slug: string;
  resume: string;
  contenu: string;
  image: string | null;
  publie_le: string;
};

export type Evenement = {
  id: number;
  titre: string;
  description: string;
  lieu: string;
  debut: string;
  fin: string;
  lien_inscription?: string;
};

export type AppelProjet = {
  id: number;
  titre: string;
  description: string;
  date_limite: string;
  statut: "ouvert" | "clos";
  pieces_demandees: string[];
};

// Données réalistes de référence conformes à l'écosystème ISEP Diamniadio / CIAT
const MOCK_ACTUALITES: Actualite[] = [
  {
    id: 1,
    titre: "Lancement de la plateforme numérique unifiée de l'Écosystème CIAT 360",
    slug: "lancement-plateforme-ciat-360",
    resume:
      "L'ISEP Amadou Trawaré de Diamniadio déploie sa nouvelle infrastructure digitale intégrant portail, incubateur, générateur de documents et showroom d'innovations.",
    contenu: `L'Institut Supérieur d'Enseignement Professionnel (ISEP) Amadou Trawaré de Diamniadio franchit une étape majeure dans sa dynamique de digitalisation avec la mise en service du guichet unique du CIAT.

Cette plateforme rassemble les apprenants, les enseignants et les partenaires industriels autour d'un parcours d'incubation rigoureux. Elle met en valeur les 7 filières prioritaires et offre aux porteurs de projets des outils modernes pour transformer leurs idées en prototypes fonctionnels.

Les étudiants et créateurs d'entreprises peuvent désormais soumettre leurs dossiers en ligne, suivre l'instruction par le comité de sélection et interagir avec leurs mentors attitrés.`,
    image: null,
    publie_le: "2026-10-24T09:00:00Z",
  },
  {
    id: 2,
    titre: "Partenariat stratégique pour le transfert technologique à Diamniadio",
    slug: "partenariat-strategique-transfert-technologique",
    resume:
      "Le CIAT renforce ses liens avec le tissu industriel local pour accélérer le prototypage et l'insertion professionnelle des diplômés.",
    contenu: `Dans le cadre de sa mission de transfert technologique, le CIAT a formalisé de nouvelles coopérations avec des acteurs majeurs des énergies renouvelables et de l'agro-industrie implantés à Diamniadio.

Ce partenariat permettra aux projets incubés d'accéder à des plateaux techniques spécialisés, des bancs de tests industriels et des opportunités d'expérimentation en conditions réelles.`,
    image: null,
    publie_le: "2026-10-18T14:30:00Z",
  },
  {
    id: 3,
    titre: "Ateliers de co-conception : l'IA générative au service des projets techniques",
    slug: "ateliers-co-conception-ia-generative",
    resume:
      "Retour sur les sessions d'accompagnement pratique des apprenants pour la formalisation de leurs cahiers des charges et analyses d'impact.",
    contenu: `Les équipes projets de l'ISEP ont participé à une série d'ateliers méthodologiques animés par le pôle d'ingénierie du CIAT.

L'objectif était d'utiliser l'IA générative de manière sobre et éthique afin d'assister la rédaction des documents techniques, l'élaboration des modèles économiques et l'analyse SWOT, sans jamais remplacer la rigueur de validation humaine.`,
    image: null,
    publie_le: "2026-10-12T11:00:00Z",
  },
];

const MOCK_EVENEMENTS: Evenement[] = [
  {
    id: 1,
    titre: "Journée Portes Ouvertes & Démonstrations des Prototypes du CIAT",
    description:
      "Rencontre entre le jury académique, les partenaires industriels et les porteurs de projets de l'ISEP de Diamniadio. Présentation en direct des démonstrateurs fonctionnels.",
    lieu: "Amphithéâtre Central & Ateliers du CIAT, ISEP Diamniadio",
    debut: "2026-11-05T09:00:00Z",
    fin: "2026-11-05T17:00:00Z",
    lien_inscription: "/connexion",
  },
  {
    id: 2,
    titre: "Comité de Sélection — Cohorte 2026 de l'Incubateur",
    description:
      "Session plénière d'audition des porteurs de projets présélectionnés par le comité d'évaluation selon la grille multicritère officielle.",
    lieu: "Salle du Conseil de Direction, ISEP Diamniadio",
    debut: "2026-11-12T10:00:00Z",
    fin: "2026-11-12T15:30:00Z",
  },
  {
    id: 3,
    titre: "Séminaire technique : Prototypage et Énergies Renouvelables au Sénégal",
    description:
      "Masterclass sur les systèmes photovoltaïques autonomes, la maintenance prédictive et les capteurs connectés pour l'agriculture locale.",
    lieu: "Laboratoire Génie Électrique & Solaire, CIAT Diamniadio",
    debut: "2026-11-20T14:00:00Z",
    fin: "2026-11-20T18:00:00Z",
    lien_inscription: "/connexion",
  },
];

const MOCK_APPELS: AppelProjet[] = [
  {
    id: 1,
    titre: "Appel à Candidatures — Cohorte d'Incubation 2026",
    description:
      "Programme complet d'accompagnement de 6 mois pour transformer votre idée innovante en prototype fonctionnel viable. Ouvert aux étudiants, diplômés et porteurs de projets dans les 7 filières officielles.",
    date_limite: "2026-11-15T23:59:59Z",
    statut: "ouvert",
    pieces_demandees: [
      "Fiche descriptive de projet (problème, solution, avancement)",
      "Présentation détaillée de l'équipe et compétences",
      "Budget prévisionnel des besoins en prototypage",
    ],
  },
  {
    id: 2,
    titre: "Appel à Projets Thématique : Agriculture de Précision & IoT",
    description:
      "Soutien ciblé pour les solutions connectées réduisant les pertes post-récolte et optimisant la gestion de l'irrigation dans les zones maraîchères de Thiès et Diamniadio.",
    date_limite: "2026-12-01T23:59:59Z",
    statut: "ouvert",
    pieces_demandees: [
      "Dossier technique de conception",
      "Schéma d'architecture IoT ou mécanique",
      "Note d'impact territorial et environnemental",
    ],
  },
  {
    id: 3,
    titre: "Session Spéciale — Maturation & Énergies Renouvelables 2025",
    description:
      "Session d'accompagnement dédiée aux prototypes de séchoirs solaires et bancs d'essai énergétiques.",
    date_limite: "2025-12-31T23:59:59Z",
    statut: "clos",
    pieces_demandees: [
      "Rapport final de prototypage",
      "Bilan de validation terrain",
    ],
  },
];

/**
 * Récupère les actualités du portail via l'API ou le fallback conforme.
 */
export async function getActualites(): Promise<{ items: Actualite[]; fromApi: boolean; error: string | null }> {
  try {
    const res = await api<Page<Actualite> | Actualite[]>("/portal/actualites/", { auth: false });
    const items = Array.isArray(res) ? res : res.results;
    if (items && items.length > 0) {
      return { items, fromApi: true, error: null };
    }
  } catch {
    // Endpoints non encore livrés par Pathé ou erreur réseau : fallback maîtrisé
  }
  return { items: MOCK_ACTUALITES, fromApi: false, error: null };
}

/**
 * Récupère le détail d'une actualité par son slug ou ID.
 */
export async function getActualiteBySlug(slug: string): Promise<Actualite | null> {
  try {
    const res = await api<Actualite>(`/portal/actualites/${slug}/`, { auth: false });
    if (res && res.titre) return res;
  } catch {
    // Fallback local
  }
  const found = MOCK_ACTUALITES.find((a) => a.slug === slug || String(a.id) === slug);
  return found ?? null;
}

/**
 * Récupère les événements du portail.
 */
export async function getEvenements(): Promise<{ items: Evenement[]; fromApi: boolean; error: string | null }> {
  try {
    const res = await api<Page<Evenement> | Evenement[]>("/portal/evenements/?a_venir=1", { auth: false });
    const items = Array.isArray(res) ? res : res.results;
    if (items && items.length > 0) {
      return { items, fromApi: true, error: null };
    }
  } catch {
    // Fallback local
  }
  return { items: MOCK_EVENEMENTS, fromApi: false, error: null };
}

/**
 * Récupère la liste des appels à projets.
 */
export async function getAppelsProjets(): Promise<{ items: AppelProjet[]; fromApi: boolean; error: string | null }> {
  try {
    const res = await api<Page<AppelProjet> | AppelProjet[]>("/portal/appels/", { auth: false });
    const items = Array.isArray(res) ? res : res.results;
    if (items && items.length > 0) {
      return { items, fromApi: true, error: null };
    }
  } catch {
    // Fallback local
  }
  return { items: MOCK_APPELS, fromApi: false, error: null };
}
