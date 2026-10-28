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

export interface QuestionAnalyticsResponse {
  reponse: string;
  donnees: unknown;
  filtres_utilises: Record<string, string>;
}

export interface SourceFinancementStat {
  source: string;
  total: number;
  count: number;
}

export interface TypePartenariatStat {
  type: string;
  type_key: string;
  count: number;
}

export interface DomaineFinancementStat {
  domaine: string;
  total: number;
  count: number;
}

export interface PartenariatsFinancementsStats {
  total_finance: number;
  financements_decaisses: number;
  nombre_financements: number;
  nombre_partenariats_actifs: number;
  total_partenariats: number;
  par_source: SourceFinancementStat[];
  par_type_partenariat: TypePartenariatStat[];
  par_domaine: DomaineFinancementStat[];
}

export interface PartenariatItem {
  id: number;
  projet: number;
  projet_titre: string;
  cohorte: string | null;
  domaine: string | null;
  porteur_nom: string;
  partenaire: string;
  type: string;
  type_display: string;
  date_debut: string;
  statut: string;
  statut_display: string;
  description: string;
  cree_le: string;
}

export interface FinancementItem {
  id: number;
  projet: number;
  projet_titre: string;
  cohorte: string | null;
  domaine: string | null;
  porteur_nom: string;
  source: string;
  montant: string;
  date: string;
  statut: string;
  statut_display: string;
  description: string;
  cree_le: string;
}

export interface ConstatCalcul {
  id: string;
  titre: string;
  texte: string;
  chiffres: Record<string, unknown>;
  regle: string;
  limite: string;
}

export interface ConstatsResponse {
  constats: ConstatCalcul[];
  total_constats: number;
  seuils: Record<string, number>;
}

export interface ProjetPortfolioItem {
  id: number;
  titre: string;
  resume: string;
  probleme?: string;
  solution?: string;
  domaine: number | null;
  domaine_nom?: string;
  cohorte: number | null;
  cohorte_nom?: string;
  porteur?: number | null;
  porteur_nom?: string;
  statut: string;
  cree_le: string;
}


