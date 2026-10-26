/**
 * Types officiels du module P3 (Tableau de bord décisionnel).
 * Conformes à CONTRATS_API.md (section P3).
 */

export interface DashboardFilters {
  debut?: string; // Format AAAA-MM-JJ
  fin?: string;   // Format AAAA-MM-JJ
  cohorte?: string;
  domaine?: string;
  statut?: string;
}

export interface IndicateursGlobaux {
  idees_recues: number;
  dossiers_deposes: number;
  projets_selectionnes: number;
  projets_incubes: number;
  prototypes: number;
  taux_selection: number; // en pourcentage (ex. 45.9)
}

export interface ParDomaineItem {
  domaine: string;
  total: number;
}

export interface ParCohorteItem {
  cohorte: string;
  total: number;
  selectionnes: number;
  prototypes: number;
}

export interface ParGenreItem {
  genre: string;
  total: number;
}

export interface EvolutionItem {
  mois: string; // Ex: "2026-05"
  total: number;
}

export interface AnalyticsData {
  indicateurs: IndicateursGlobaux;
  parDomaine: ParDomaineItem[];
  parCohorte: ParCohorteItem[];
  parGenre: ParGenreItem[];
  evolution: EvolutionItem[];
}

export interface SelectOption {
  value: string;
  label: string;
}

export interface RetardItem {
  projet: string;
  jalon: string;
  echeance: string;
  statut: string;
  cohorte: string;
  domaine: string;
}

export type FicheMode = "globale" | "cohorte" | "domaine";

