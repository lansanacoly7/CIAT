/**
 * Client API et modèles pour le module P2 Incubateur (Dépôt de dossier).
 * Conforme aux spécifications de taches/CONTRATS_API.md.
 * Inclut un mécanisme de fallback local si le backend d'Ibrahima est en cours de dev.
 */

import { api, ApiError } from "./api";

export type PieceType =
  | "fiche_projet"
  | "presentation_equipe"
  | "budget_previsionnel"
  | "autre";

export const PIECES_OBLIGATOIRES: PieceType[] = [
  "fiche_projet",
  "presentation_equipe",
  "budget_previsionnel",
];

export const PIECE_LABELS: Record<PieceType, { label: string; description: string }> = {
  fiche_projet: {
    label: "Fiche descriptive du projet",
    description: "Document détaillant les objectifs, la méthodologie et l'impact attendu (PDF)",
  },
  presentation_equipe: {
    label: "Présentation de l'équipe",
    description: "CV et descriptif des compétences clés des porteurs du projet (PDF)",
  },
  budget_previsionnel: {
    label: "Budget prévisionnel",
    description: "Estimation financière et besoins matériels / prototypage (PDF / Excel)",
  },
  autre: {
    label: "Document complémentaire (optionnel)",
    description: "Étude de marché, lettre de soutien, schémas techniques, etc.",
  },
};

export type DossierStatut =
  | "brouillon"
  | "soumis"
  | "complet"
  | "en_evaluation"
  | "accepte"
  | "refuse";

export const STATUT_LABELS: Record<DossierStatut, { label: string; color: string }> = {
  brouillon: { label: "Brouillon", color: "#6B5646" },
  soumis: { label: "Soumis", color: "#D97706" },
  complet: { label: "Complet", color: "#2E7D32" },
  en_evaluation: { label: "En évaluation", color: "#2563EB" },
  accepte: { label: "Accepté", color: "#2E7D32" },
  refuse: { label: "Refusé", color: "#DC2626" },
};

export interface Piece {
  id: number;
  type: PieceType;
  nom: string;
  fichier: string;
  depose_le: string;
  taille?: string;
}

export interface ProjetData {
  id?: number;
  titre: string;
  domaine?: number;
  domaine_nom?: string;
  resume: string;
  probleme: string;
  solution: string;
}

export interface Dossier {
  id: number;
  projet: ProjetData;
  statut: DossierStatut;
  completude: number; // 0 à 100
  pieces: Piece[];
  pieces_manquantes: PieceType[];
  soumis_le: string | null;
}

const LOCAL_DOSSIER_KEY = "ciat_mock_dossier";

function calculateCompletude(pieces: Piece[]): { completude: number; manquantes: PieceType[] } {
  const typesPresents = new Set(pieces.map((p) => p.type));
  const manquantes = PIECES_OBLIGATOIRES.filter((type) => !typesPresents.has(type));
  const fourniesCount = PIECES_OBLIGATOIRES.length - manquantes.length;
  const completude = Math.round((fourniesCount / PIECES_OBLIGATOIRES.length) * 100);
  return { completude, manquantes };
}

function getInitialMockDossier(): Dossier {
  return {
    id: 1,
    projet: {
      id: 1,
      titre: "",
      resume: "",
      probleme: "",
      solution: "",
      domaine_nom: "AgriTech",
    },
    statut: "brouillon",
    completude: 0,
    pieces: [],
    pieces_manquantes: [...PIECES_OBLIGATOIRES],
    soumis_le: null,
  };
}

function getStoredMockDossier(): Dossier {
  if (typeof window === "undefined") return getInitialMockDossier();
  const raw = localStorage.getItem(LOCAL_DOSSIER_KEY);
  if (!raw) {
    const init = getInitialMockDossier();
    localStorage.setItem(LOCAL_DOSSIER_KEY, JSON.stringify(init));
    return init;
  }
  try {
    return JSON.parse(raw) as Dossier;
  } catch {
    return getInitialMockDossier();
  }
}

function saveStoredMockDossier(dossier: Dossier) {
  if (typeof window !== "undefined") {
    localStorage.setItem(LOCAL_DOSSIER_KEY, JSON.stringify(dossier));
  }
}

/**
 * Récupère le dossier du porteur connecté
 */
export async function getMonDossier(): Promise<Dossier> {
  try {
    const dossiers = await api<{ results?: Dossier[] } | Dossier[]>("/incubator/dossiers/");
    const list = Array.isArray(dossiers) ? dossiers : dossiers.results ?? [];
    if (list.length > 0) return list[0];
  } catch {
    // Backend pas encore prêt, on utilise le mock
  }
  return getStoredMockDossier();
}

/**
 * Enregistre ou met à jour les informations du projet (Étape 1)
 */
export async function saveProjetInfo(data: ProjetData): Promise<Dossier> {
  try {
    if (data.id) {
      await api(`/projets/${data.id}/`, { method: "PATCH", body: data });
    } else {
      const p = await api<ProjetData>("/projets/", { method: "POST", body: data });
      data.id = p.id;
    }
  } catch {
    // Mode hors-ligne / mock
  }

  const dossier = getStoredMockDossier();
  dossier.projet = { ...dossier.projet, ...data };
  saveStoredMockDossier(dossier);
  return dossier;
}

/**
 * Dépose une pièce justificative (Étape 2)
 */
export async function uploadPiece(
  dossierId: number,
  type: PieceType,
  file: File
): Promise<{ dossier: Dossier; piece: Piece }> {
  // Validation stricte de la taille (10 Mo)
  if (file.size > 10 * 1024 * 1024) {
    throw new Error("Le fichier dépasse la taille maximale autorisée de 10 Mo.");
  }

  const formData = new FormData();
  formData.append("type", type);
  formData.append("fichier", file);

  let newPiece: Piece | null = null;
  try {
    newPiece = await api<Piece>(`/incubator/dossiers/${dossierId}/pieces/`, {
      method: "POST",
      body: formData,
    });
  } catch {
    // Fallback Mock
    const formatSize = (bytes: number) => {
      if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} Ko`;
      return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`;
    };

    newPiece = {
      id: Date.now(),
      type,
      nom: file.name,
      fichier: URL.createObjectURL(file),
      depose_le: new Date().toISOString(),
      taille: formatSize(file.size),
    };
  }

  const dossier = getStoredMockDossier();
  // Remplacer si même type pour les pièces uniques obligatoires
  const filtered = dossier.pieces.filter((p) => p.type !== type || type === "autre");
  dossier.pieces = [...filtered, newPiece];

  const { completude, manquantes } = calculateCompletude(dossier.pieces);
  dossier.completude = completude;
  dossier.pieces_manquantes = manquantes;
  saveStoredMockDossier(dossier);

  return { dossier, piece: newPiece };
}

/**
 * Supprime une pièce justificative
 */
export async function deletePiece(dossierId: number, pieceId: number): Promise<Dossier> {
  try {
    await api(`/incubator/dossiers/${dossierId}/pieces/${pieceId}/`, {
      method: "DELETE",
    });
  } catch {
    // Mode mock
  }

  const dossier = getStoredMockDossier();
  dossier.pieces = dossier.pieces.filter((p) => p.id !== pieceId);
  const { completude, manquantes } = calculateCompletude(dossier.pieces);
  dossier.completude = completude;
  dossier.pieces_manquantes = manquantes;
  saveStoredMockDossier(dossier);

  return dossier;
}

/**
 * Soumet définitivement le dossier (Étape 3)
 */
export async function soumettreDossier(dossierId: number): Promise<Dossier> {
  const dossier = getStoredMockDossier();
  if (dossier.pieces_manquantes.length > 0) {
    throw new ApiError(400, {
      detail: "Impossible de soumettre : des pièces obligatoires sont manquantes.",
      pieces_manquantes: dossier.pieces_manquantes,
    });
  }

  try {
    const res = await api<Dossier>(`/incubator/dossiers/${dossierId}/soumettre/`, {
      method: "POST",
    });
    return res;
  } catch {
    // Fallback mock
    dossier.statut = "soumis";
    dossier.soumis_le = new Date().toISOString();
    saveStoredMockDossier(dossier);
    return dossier;
  }
}
