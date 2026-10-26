/**
 * Client API, types et gestion des évaluations du comité et décisions du coordonnateur.
 * Conforme à taches/CONTRATS_API.md (section P2).
 */

import { api, ApiError } from "./api";
import type { Dossier, DossierStatut } from "./incubator";

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

export const GRILLE_DEFAUT: Grille = {
  id: 1,
  criteres: [
    {
      id: 1,
      libelle: "Pertinence du problème et clarté de la solution",
      poids: 1,
      note_max: 20,
    },
    {
      id: 2,
      libelle: "Faisabilité technique et degré d'innovation",
      poids: 2,
      note_max: 20,
    },
    {
      id: 3,
      libelle: "Compétences, engagement et complémentarité de l'équipe",
      poids: 1,
      note_max: 20,
    },
    {
      id: 4,
      libelle: "Potentiel économique et impact territorial à Diamniadio",
      poids: 2,
      note_max: 20,
    },
  ],
};

const LOCAL_EVALS_KEY = "ciat_mock_evaluations";
const LOCAL_DOSSIERS_EVAL_KEY = "ciat_mock_dossiers_eval";

/**
 * Dossiers de démonstration pour le comité et coordonnateur
 */
export const DOSSIERS_DEMO_COMITE: Dossier[] = [
  {
    id: 1,
    projet: {
      id: 1,
      titre: "AgroSmart Sensor Diamniadio",
      domaine_nom: "Agriculture, agroalimentaire et élevage",
      resume: "Sonde d'humidité solaire connectée en LoRa pour l'optimisation de l'arrosage maraîcher.",
      probleme: "Gaspillage massif d'eau et coût élevé du carburant pour les motopompes.",
      solution: "Automatisation de l'irrigation par capteurs solaires low-cost fabriqués au fablab.",
    },
    statut: "soumis",
    completude: 100,
    pieces: [
      { id: 101, type: "fiche_projet", nom: "fiche_agrosmart_v2.pdf", fichier: "/brand/logo_principal.png", depose_le: "2026-10-25T14:30:00Z", taille: "1.4 Mo" },
      { id: 102, type: "presentation_equipe", nom: "cv_equipe_agrosmart.pdf", fichier: "/brand/logo_principal.png", depose_le: "2026-10-25T14:35:00Z", taille: "820 Ko" },
      { id: 103, type: "budget_previsionnel", nom: "budget_previsionnel_2026.pdf", fichier: "/brand/logo_principal.png", depose_le: "2026-10-25T14:40:00Z", taille: "650 Ko" },
    ],
    pieces_manquantes: [],
    soumis_le: "2026-10-25T14:45:00Z",
  },
  {
    id: 2,
    projet: {
      id: 2,
      titre: "SolarKiosk Énergie Rurale",
      domaine_nom: "Énergie, efficacité énergétique et énergies renouvelables",
      resume: "Kiosque solaire multifonction pour recharge et conservation frigorifique communautaire.",
      probleme: "Absence de chaîne du froid pour les pêcheurs et maraîchers hors réseau électrique.",
      solution: "Stations solaires autonomes modulaires avec télémétrie IoT.",
    },
    statut: "en_evaluation",
    completude: 100,
    pieces: [
      { id: 201, type: "fiche_projet", nom: "dossier_technique_solarkiosk.pdf", fichier: "/brand/logo_principal.png", depose_le: "2026-10-24T10:00:00Z", taille: "2.8 Mo" },
      { id: 202, type: "presentation_equipe", nom: "equipe_solarkiosk.pdf", fichier: "/brand/logo_principal.png", depose_le: "2026-10-24T10:15:00Z", taille: "1.1 Mo" },
      { id: 203, type: "budget_previsionnel", nom: "business_plan_kiosk.pdf", fichier: "/brand/logo_principal.png", depose_le: "2026-10-24T10:20:00Z", taille: "1.9 Mo" },
    ],
    pieces_manquantes: [],
    soumis_le: "2026-10-24T11:00:00Z",
  },
  {
    id: 3,
    projet: {
      id: 3,
      titre: "BioMedScan Diagnostic Rapide",
      domaine_nom: "Pharmaceutique et biomédical",
      resume: "Application d'aide au diagnostic clinique par imagerie IA portable.",
      probleme: "Délai critique d'accès aux radiologues dans les postes de santé périphériques.",
      solution: "Algorithme d'analyse embarqué certifié sur smartphone.",
    },
    statut: "accepte",
    completude: 100,
    pieces: [
      { id: 301, type: "fiche_projet", nom: "biomedscan_etude_clinique.pdf", fichier: "/brand/logo_principal.png", depose_le: "2026-10-20T08:00:00Z", taille: "3.2 Mo" },
      { id: 302, type: "presentation_equipe", nom: "cv_chercheurs.pdf", fichier: "/brand/logo_principal.png", depose_le: "2026-10-20T08:10:00Z", taille: "900 Ko" },
      { id: 303, type: "budget_previsionnel", nom: "budget_essais.pdf", fichier: "/brand/logo_principal.png", depose_le: "2026-10-20T08:15:00Z", taille: "1.2 Mo" },
    ],
    pieces_manquantes: [],
    soumis_le: "2026-10-20T09:00:00Z",
  },
];

/**
 * Récupère la grille d'évaluation officielle
 */
export async function getGrilleActuelle(): Promise<Grille> {
  try {
    return await api<Grille>("/incubator/grilles/actuelle/");
  } catch {
    return GRILLE_DEFAUT;
  }
}

/**
 * Récupère la liste des dossiers pour le comité et le coordonnateur
 */
export async function getDossiersComite(): Promise<Dossier[]> {
  try {
    const res = await api<{ results?: Dossier[] } | Dossier[]>("/incubator/dossiers/");
    const list = Array.isArray(res) ? res : res.results ?? [];
    if (list.length > 0) return list;
  } catch {
    // Mode hors-ligne / fallback
  }

  if (typeof window !== "undefined") {
    const raw = localStorage.getItem(LOCAL_DOSSIERS_EVAL_KEY);
    if (raw) {
      try {
        return JSON.parse(raw);
      } catch {
        // ignore
      }
    }
    localStorage.setItem(LOCAL_DOSSIERS_EVAL_KEY, JSON.stringify(DOSSIERS_DEMO_COMITE));
  }
  return DOSSIERS_DEMO_COMITE;
}

/**
 * Récupère les évaluations et le score moyen d'un dossier
 */
export async function getEvaluationsDossier(dossierId: number): Promise<EvaluationsData> {
  try {
    return await api<EvaluationsData>(`/incubator/dossiers/${dossierId}/evaluations/`);
  } catch {
    // Fallback Mock
  }

  if (typeof window !== "undefined") {
    const raw = localStorage.getItem(LOCAL_EVALS_KEY);
    const all: Record<number, Evaluation[]> = raw ? JSON.parse(raw) : {};
    const evals = all[dossierId] ?? [];
    const score_moyen =
      evals.length > 0
        ? Math.round(
            evals.reduce((acc, curr) => acc + curr.score_calcule, 0) / evals.length
          )
        : null;
    return { evaluations: evals, score_moyen };
  }

  return { evaluations: [], score_moyen: null };
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
 * Soumet une évaluation de membre du comité
 */
export async function submitEvaluation(
  dossierId: number,
  payload: EvaluationPayload,
  evaluateurNom = "Membre du comité"
): Promise<{ score: number; evaluation: Evaluation }> {
  const grille = await getGrilleActuelle();
  const scoreCalcule = calculerScorePondere(payload.notes, grille.criteres);

  try {
    await api(`/incubator/dossiers/${dossierId}/evaluations/`, {
      method: "POST",
      body: payload,
    });
  } catch {
    // Fallback mock
  }

  const newEval: Evaluation = {
    id: Date.now(),
    dossier: dossierId,
    evaluateur_nom: evaluateurNom,
    notes: payload.notes,
    score_calcule: scoreCalcule,
    avis: payload.avis,
    cree_le: new Date().toISOString(),
  };

  if (typeof window !== "undefined") {
    const raw = localStorage.getItem(LOCAL_EVALS_KEY);
    const all: Record<number, Evaluation[]> = raw ? JSON.parse(raw) : {};
    all[dossierId] = [...(all[dossierId] ?? []), newEval];
    localStorage.setItem(LOCAL_EVALS_KEY, JSON.stringify(all));

    // Passe le dossier en "en_evaluation" si ce n'est pas déjà le cas
    const dossiersRaw = localStorage.getItem(LOCAL_DOSSIERS_EVAL_KEY);
    if (dossiersRaw) {
      const dossiers: Dossier[] = JSON.parse(dossiersRaw);
      const target = dossiers.find((d) => d.id === dossierId);
      if (target && target.statut === "soumis") {
        target.statut = "en_evaluation";
        localStorage.setItem(LOCAL_DOSSIERS_EVAL_KEY, JSON.stringify(dossiers));
      }
    }
  }

  return { score: scoreCalcule, evaluation: newEval };
}

/**
 * Soumet la décision du coordonnateur (avec motif obligatoire)
 */
export async function submitDecision(
  dossierId: number,
  decision: "accepte" | "refuse",
  motif: string
): Promise<Dossier> {
  if (!motif.trim()) {
    throw new ApiError(400, { motif: ["Le motif de la décision est obligatoire."] });
  }

  try {
    await api(`/incubator/dossiers/${dossierId}/decision/`, {
      method: "POST",
      body: { decision, motif: motif.trim() },
    });
  } catch {
    // Fallback mock
  }

  let updatedDossier: Dossier | null = null;
  if (typeof window !== "undefined") {
    const raw = localStorage.getItem(LOCAL_DOSSIERS_EVAL_KEY);
    const dossiers: Dossier[] = raw ? JSON.parse(raw) : DOSSIERS_DEMO_COMITE;
    const found = dossiers.find((d) => d.id === dossierId);
    if (found) {
      found.statut = decision as DossierStatut;
      updatedDossier = found;
      localStorage.setItem(LOCAL_DOSSIERS_EVAL_KEY, JSON.stringify(dossiers));
    }
  }

  return (
    updatedDossier ?? {
      id: dossierId,
      projet: {
        id: dossierId,
        titre: "Projet",
        resume: "",
        probleme: "",
        solution: "",
      },
      statut: decision as DossierStatut,
      completude: 100,
      pieces: [],
      pieces_manquantes: [],
      soumis_le: new Date().toISOString(),
    }
  );
}
