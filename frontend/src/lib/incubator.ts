/**
 * Client API et modèles pour le module P2 Incubateur (Dépôt de dossier).
 * Conforme aux spécifications de taches/CONTRATS_API.md et docs/INCUBATEUR_P2.md.
 * Aucun stockage fictif ou contournement local : toutes les opérations sont reliées à l'API Django REST Framework.
 */

import { api } from "./api";

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

/**
 * Calcule la complétude locale à partir des pièces retournées par le serveur
 */
export function calculateCompletude(pieces: Piece[]): { completude: number; manquantes: PieceType[] } {
  const typesPresents = new Set(pieces.map((p) => p.type));
  const manquantes = PIECES_OBLIGATOIRES.filter((type) => !typesPresents.has(type));
  const fourniesCount = PIECES_OBLIGATOIRES.length - manquantes.length;
  const completude = Math.round((fourniesCount / PIECES_OBLIGATOIRES.length) * 100);
  return { completude, manquantes };
}

/**
 * Récupère le dossier du porteur connecté depuis le backend DRF.
 * Si aucun dossier n'existe encore, retourne un modèle initial vide (non persisté).
 */
export async function getMonDossier(): Promise<Dossier> {
  const dossiers = await api<{ results?: Dossier[] } | Dossier[]>("/incubator/dossiers/");
  const list = Array.isArray(dossiers) ? dossiers : dossiers.results ?? [];
  if (list.length > 0) {
    const d = list[0];
    const { completude, manquantes } = calculateCompletude(d.pieces ?? []);
    return {
      ...d,
      completude: d.completude ?? completude,
      pieces_manquantes: d.pieces_manquantes ?? manquantes,
      pieces: d.pieces ?? [],
    };
  }

  // Modèle initial vierge pour nouveau porteur
  return {
    id: 0,
    projet: {
      titre: "",
      resume: "",
      probleme: "",
      solution: "",
      domaine_nom: "Général",
    },
    statut: "brouillon",
    completude: 0,
    pieces: [],
    pieces_manquantes: [...PIECES_OBLIGATOIRES],
    soumis_le: null,
  };
}

/**
 * Enregistre ou met à jour les informations du projet (Étape 1) via l'API réelle.
 */
export async function saveProjetInfo(data: ProjetData, dossierId?: number): Promise<Dossier> {
  let projetId = data.id;

  if (projetId) {
    await api(`/projets/${projetId}/`, { method: "PATCH", body: data });
  } else {
    const nouveauProjet = await api<ProjetData>("/projets/", { method: "POST", body: data });
    projetId = nouveauProjet.id;
  }

  // Si le dossier n'existe pas encore, le créer avec le projet rattaché
  if (!dossierId || dossierId === 0) {
    const nouveauDossier = await api<Dossier>("/incubator/dossiers/", {
      method: "POST",
      body: { projet_id: projetId },
    });
    const { completude, manquantes } = calculateCompletude(nouveauDossier.pieces ?? []);
    return {
      ...nouveauDossier,
      completude,
      pieces_manquantes: manquantes,
      pieces: nouveauDossier.pieces ?? [],
    };
  }

  // Recharger le dossier à jour
  return await getDossier(dossierId);
}

/**
 * Récupère un dossier spécifique par son ID
 */
export async function getDossier(dossierId: number): Promise<Dossier> {
  const dossier = await api<Dossier>(`/incubator/dossiers/${dossierId}/`);
  const { completude, manquantes } = calculateCompletude(dossier.pieces ?? []);
  return {
    ...dossier,
    completude: dossier.completude ?? completude,
    pieces_manquantes: dossier.pieces_manquantes ?? manquantes,
    pieces: dossier.pieces ?? [],
  };
}

/**
 * Dépose une pièce justificative (Étape 2) en multipart/form-data via l'API DRF.
 */
export async function uploadPiece(
  dossierId: number,
  type: PieceType,
  file: File
): Promise<{ dossier: Dossier; piece: Piece }> {
  if (file.size > 10 * 1024 * 1024) {
    throw new Error("Le fichier dépasse la taille maximale autorisée de 10 Mo.");
  }

  const formData = new FormData();
  formData.append("type", type);
  formData.append("fichier", file);

  const piece = await api<Piece>(`/incubator/dossiers/${dossierId}/pieces/`, {
    method: "POST",
    body: formData,
  });

  const dossierAjour = await getDossier(dossierId);
  return { dossier: dossierAjour, piece };
}

/**
 * Supprime une pièce justificative via l'API DRF.
 */
export async function deletePiece(dossierId: number, pieceId: number): Promise<Dossier> {
  await api(`/incubator/dossiers/${dossierId}/pieces/${pieceId}/`, {
    method: "DELETE",
  });
  return await getDossier(dossierId);
}

/**
 * Soumet définitivement le dossier (Étape 3) via l'API DRF.
 */
export async function soumettreDossier(dossierId: number): Promise<Dossier> {
  const res = await api<Dossier>(`/incubator/dossiers/${dossierId}/soumettre/`, {
    method: "POST",
  });
  const { completude, manquantes } = calculateCompletude(res.pieces ?? []);
  return {
    ...res,
    completude,
    pieces_manquantes: manquantes,
    pieces: res.pieces ?? [],
  };
}
