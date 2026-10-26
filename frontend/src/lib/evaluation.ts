/**
 * Client API, types et gestion des évaluations du comité et décisions du coordonnateur.
 * Conforme à taches/CONTRATS_API.md et docs/INCUBATEUR_P2.md.
 * Aucun stockage fictif ou contournement local : toutes les données proviennent du serveur DRF.
 */

import { api } from "./api";
import type { Dossier } from "./incubator";
import { getDossier } from "./incubator";

export interface Critere {
  id: number;
  libelle: string;
  poids: number;
  note_max: number;
}

export interface Grille {
  id: number;
  criteres: Critere[];
}

export interface NoteCritere {
  critere: number;
  note: number;
}

export interface EvaluationPayload {
  notes: NoteCritere[];
  avis: string;
}

export interface Evaluation {
  id: number;
  dossier: number;
  evaluateur_nom: string;
  notes: NoteCritere[];
  score_calcule: number;
  avis: string;
  cree_le: string;
}

export interface EvaluationsData {
  evaluations: Evaluation[];
  score_moyen: number | null;
}

export interface DecisionPayload {
  decision: "accepte" | "refuse";
  motif: string;
}

/**
 * Récupère la grille d'évaluation officielle active depuis le backend DRF.
 */
export async function getGrilleActuelle(): Promise<Grille> {
  return await api<Grille>("/incubator/grilles/actuelle/");
}

/**
 * Récupère la liste des dossiers pour le comité et le coordonnateur depuis l'API DRF.
 */
export async function getDossiersComite(): Promise<Dossier[]> {
  const res = await api<{ results?: Dossier[] } | Dossier[]>("/incubator/dossiers/");
  const list = Array.isArray(res) ? res : res.results ?? [];
  return list;
}

/**
 * Récupère les évaluations et le score moyen d'un dossier depuis l'API DRF.
 */
export async function getEvaluationsDossier(dossierId: number): Promise<EvaluationsData> {
  return await api<EvaluationsData>(`/incubator/dossiers/${dossierId}/evaluations/`);
}

/**
 * Calcule le score pondéré sur 100 à partir des notes et des critères
 */
export function calculerScorePondere(
  notes: NoteCritere[],
  criteres: Critere[]
): number {
  let totalPoints = 0;
  let totalMax = 0;

  for (const c of criteres) {
    const n = notes.find((item) => item.critere === c.id);
    const noteVal = n ? Math.min(Math.max(n.note, 0), c.note_max) : 0;
    totalPoints += noteVal * c.poids;
    totalMax += c.note_max * c.poids;
  }

  if (totalMax === 0) return 0;
  return Math.round((totalPoints / totalMax) * 100);
}

/**
 * Soumet une évaluation de membre du comité via l'API DRF.
 */
export async function submitEvaluation(
  dossierId: number,
  payload: EvaluationPayload
): Promise<{ score: number; evaluation: Evaluation }> {
  const evaluation = await api<Evaluation>(`/incubator/dossiers/${dossierId}/evaluations/`, {
    method: "POST",
    body: payload,
  });
  return {
    score: evaluation.score_calcule ?? 0,
    evaluation,
  };
}


/**
 * Enregistre la décision officielle du coordonnateur (avec motif obligatoire) via l'API DRF.
 */
export async function submitDecision(
  dossierId: number,
  payloadOrDecision: DecisionPayload | "accepte" | "refuse",
  maybeMotif?: string
): Promise<Dossier> {
  const payload: DecisionPayload =
    typeof payloadOrDecision === "string"
      ? { decision: payloadOrDecision, motif: maybeMotif ?? "" }
      : payloadOrDecision;

  if (!payload.motif || payload.motif.trim().length === 0) {
    throw new Error("Le motif de la décision est obligatoire.");
  }

  await api(`/incubator/dossiers/${dossierId}/decision/`, {
    method: "POST",
    body: payload,
  });

  return await getDossier(dossierId);
}
