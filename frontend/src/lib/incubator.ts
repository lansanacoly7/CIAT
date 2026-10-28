/**
 * Client API et modèles pour le module P2 Incubateur (Dépôt de dossier).
 * Conforme aux spécifications de taches/CONTRATS_API.md et docs/INCUBATEUR_P2.md.
 * Aucun stockage fictif ou contournement local : toutes les opérations sont reliées à l'API Django REST Framework.
 */

import { api, apiBlob, ApiError, API_URL } from "./api";

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
    description: "Estimation financière et besoins matériels / prototypage (PDF ou document Word).",
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

/* ------------------------------------------------------------------ */
/* Suivi des projets incubés : mentor, objectifs, jalons, alertes      */
/* ------------------------------------------------------------------ */

export type ObjectifStatut = "a_faire" | "en_cours" | "atteint";
export type JalonStatut = "a_faire" | "en_cours" | "fait";

export const OBJECTIF_STATUTS: Record<ObjectifStatut, string> = {
  a_faire: "À faire",
  en_cours: "En cours",
  atteint: "Atteint",
};

export const JALON_STATUTS: Record<JalonStatut, string> = {
  a_faire: "À faire",
  en_cours: "En cours",
  fait: "Fait",
};

export interface Mentor {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  nom_complet: string;
  telephone?: string;
  organisation?: string;
}

/** Réponse de POST /projets/{id}/mentor/. */
export interface AffectationMentor {
  id: number;
  projet: number;
  mentor: number;
  mentor_details: Mentor;
  affecte_le: string;
}

export interface Objectif {
  id: number;
  projet: number;
  libelle: string;
  echeance: string | null;
  statut: ObjectifStatut;
  cree_par_nom?: string;
}

export interface PreuveJalon {
  id: number;
  jalon: number;
  fichier: string;
  nom: string;
  depose_par_nom: string | null;
  depose_le: string;
}

export interface CommentaireJalon {
  id: number;
  jalon: number;
  auteur_nom: string;
  texte: string;
  cree_le: string;
}

export interface Jalon {
  id: number;
  projet: number;
  titre: string;
  echeance: string;
  statut: JalonStatut;
  en_retard: boolean;
  preuves: PreuveJalon[];
  commentaires: CommentaireJalon[];
}

export interface AlerteJalon {
  id: number;
  projet: number;
  projet_titre: string;
  titre: string;
  echeance: string;
  statut: JalonStatut;
  en_retard: boolean;
}

export type EcheanceSuivi = "3_mois" | "6_mois";

export const ECHEANCE_SUIVI_LABELS: Record<EcheanceSuivi, string> = {
  "3_mois": "Bilan à 3 mois",
  "6_mois": "Bilan à 6 mois",
};

export interface SuiviProjet {
  id: number;
  projet: number;
  echeance: EcheanceSuivi;
  bilan: string;
  indicateurs: Record<string, string | number>;
  redige_par: number;
  redige_par_nom: string | null;
  cree_le: string;
  modifie_le: string;
}

export interface SuiviProjetInput {
  echeance: EcheanceSuivi;
  bilan: string;
  indicateurs?: Record<string, string | number>;
}

export interface ObjectifInput {
  libelle: string;
  echeance: string | null;
  statut: ObjectifStatut;
}

export interface JalonInput {
  titre: string;
  echeance: string;
  statut: JalonStatut;
}

/** Les listes de suivi ne sont pas paginées ; on tolère malgré tout la forme paginée. */
function unwrap<T>(res: T[] | { results: T[] }): T[] {
  return Array.isArray(res) ? res : res.results;
}

export const getMentors = async () => unwrap(await api<Mentor[] | { results: Mentor[] }>("/incubator/mentors/"));

export const getProjetMentor = (projetId: number): Promise<AffectationMentor | null> =>
  api<AffectationMentor | null>(`/incubator/projets/${projetId}/mentor/`);

export const affecterMentor = (projetId: number, mentor: number) =>
  api<AffectationMentor>(`/incubator/projets/${projetId}/mentor/`, { method: "POST", body: { mentor } });

export const getObjectifs = async (projetId: number) =>
  unwrap(await api<Objectif[] | { results: Objectif[] }>(`/incubator/projets/${projetId}/objectifs/`));

export const creerObjectif = (projetId: number, data: ObjectifInput) =>
  api<Objectif>(`/incubator/projets/${projetId}/objectifs/`, { method: "POST", body: data });

export const modifierObjectif = (id: number, data: Partial<ObjectifInput>) =>
  api<Objectif>(`/incubator/objectifs/${id}/`, { method: "PATCH", body: data });

export const getJalons = async (projetId: number) =>
  unwrap(await api<Jalon[] | { results: Jalon[] }>(`/incubator/projets/${projetId}/jalons/`));

export const creerJalon = (projetId: number, data: JalonInput) =>
  api<Jalon>(`/incubator/projets/${projetId}/jalons/`, { method: "POST", body: data });

export const modifierJalon = (id: number, data: Partial<JalonInput>) =>
  api<Jalon>(`/incubator/jalons/${id}/`, { method: "PATCH", body: data });

export function deposerPreuve(jalonId: number, fichier: File) {
  const form = new FormData();
  form.append("fichier", fichier);
  return api<PreuveJalon>(`/incubator/jalons/${jalonId}/preuves/`, { method: "POST", body: form });
}

export const ajouterCommentaire = (jalonId: number, texte: string) =>
  api<CommentaireJalon>(`/incubator/jalons/${jalonId}/commentaires/`, { method: "POST", body: { texte } });

export const getAlertes = async () =>
  unwrap(await api<AlerteJalon[] | { results: AlerteJalon[] }>("/incubator/alertes/"));

export const getProjetSuivis = async (projetId: number) =>
  unwrap(await api<SuiviProjet[] | { results: SuiviProjet[] }>(`/incubator/projets/${projetId}/suivis/`));

export const creerProjetSuivi = (projetId: number, data: SuiviProjetInput) =>
  api<SuiviProjet>(`/incubator/projets/${projetId}/suivis/`, { method: "POST", body: data });

export const telechargerCompteRendu = (projetId: number, format: "xlsx" | "pdf" = "xlsx") =>
  apiBlob(`/incubator/projets/${projetId}/compte-rendu/?format=${format}`);

export const telechargerAccuseReception = (dossierId: number) =>
  apiBlob(`/incubator/dossiers/${dossierId}/accuse/`);

export interface EvenementCalendrier {
  date: string; // YYYY-MM-DD
  type: "jalon" | "objectif";
  titre: string;
  projet: string;
  statut: string;
  en_retard: boolean;
}

export const getCalendrier = async (mois: string): Promise<EvenementCalendrier[]> =>
  unwrap(
    await api<EvenementCalendrier[] | { results: EvenementCalendrier[] }>(
      `/incubator/calendrier/?mois=${encodeURIComponent(mois)}`,
    ),
  );

/** Message français lisible pour une erreur d'API (jamais de données de secours). */
export function suiviErrorMessage(err: unknown, fallback: string): string {
  if (err instanceof ApiError) {
    if (err.status === 403) {
      const d = err.data as { detail?: unknown } | null;
      return typeof d?.detail === "string" ? d.detail : "Vous n'avez pas l'autorisation d'effectuer cette action.";
    }
    if (err.status === 404) return "Ressource introuvable.";
    if (err.data && typeof err.data === "object") {
      const parts = Object.values(err.data as Record<string, unknown>).flatMap((v) =>
        Array.isArray(v) ? v.map(String) : typeof v === "string" ? [v] : [],
      );
      if (parts.length) return parts.join(" ");
    }
    return fallback;
  }
  return "Impossible de joindre le serveur. Vérifiez votre connexion internet et réessayez.";
}

export function formatDateFr(iso: string | null | undefined) {
  if (!iso) return "—";
  return new Date(iso.length === 10 ? `${iso}T00:00:00` : iso).toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

/** URL absolue d'un fichier servi par le backend (`/media/...`). */
export function mediaUrl(fichier: string) {
  return /^https?:\/\//.test(fichier) ? fichier : `${API_URL.replace(/\/api\/?$/, "")}${fichier}`;
}
