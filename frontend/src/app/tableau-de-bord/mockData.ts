import type {
  AnalyticsData,
  DashboardFilters,
  SelectOption,
} from "./types";

export const DOMAINE_OPTIONS: SelectOption[] = [
  { value: "tic-ia", label: "TIC, IA et données" },
  { value: "agriculture", label: "Agriculture et environnement" },
  { value: "energie", label: "Énergie et renouvelables" },
  { value: "mecanique", label: "Mécanique et maintenance" },
  { value: "sante", label: "Pharmaceutique et biomédical" },
  { value: "education", label: "Éducation et insertion" },
  { value: "services", label: "Services et entrepreneuriat" },
];

export const COHORTE_OPTIONS: SelectOption[] = [
  { value: "2026", label: "Cohorte 2026 (En cours)" },
  { value: "2025", label: "Cohorte 2025" },
  { value: "2024", label: "Cohorte 2024" },
];

export const STATUT_OPTIONS: SelectOption[] = [
  { value: "idee", label: "Idée reçue" },
  { value: "depose", label: "Dossier déposé" },
  { value: "selectionne", label: "Projet sélectionné" },
  { value: "incube", label: "Projet incubé" },
  { value: "prototype", label: "Prototype fonctionnel" },
  { value: "termine", label: "Terminé" },
  { value: "rejete", label: "Non retenu" },
];

export const BASE_MOCK_DATA: AnalyticsData = {
  indicateurs: {
    idees_recues: 184,
    dossiers_deposes: 126,
    projets_selectionnes: 54,
    projets_incubes: 38,
    prototypes: 24,
    taux_selection: 42.8,
  },
  parDomaine: [
    { domaine: "TIC & IA", total: 58 },
    { domaine: "Agriculture", total: 44 },
    { domaine: "Énergie", total: 32 },
    { domaine: "Mécanique", total: 22 },
    { domaine: "Santé", total: 16 },
    { domaine: "Éducation", total: 12 },
  ],
  parCohorte: [
    { cohorte: "Cohorte 2024", total: 45, selectionnes: 18, prototypes: 12 },
    { cohorte: "Cohorte 2025", total: 68, selectionnes: 28, prototypes: 19 },
    { cohorte: "Cohorte 2026", total: 71, selectionnes: 32, prototypes: 14 },
  ],
  parGenre: [
    { genre: "Femmes", total: 46 },
    { genre: "Hommes", total: 64 },
    { genre: "Équipes mixtes", total: 16 },
  ],
  evolution: [
    { mois: "2026-05", total: 14 },
    { mois: "2026-06", total: 22 },
    { mois: "2026-07", total: 35 },
    { mois: "2026-08", total: 52 },
    { mois: "2026-09", total: 78 },
    { mois: "2026-10", total: 126 },
  ],
};

/**
 * Simule le filtrage des données selon les critères sélectionnés.
 * Permet de tester les interactions UI avant le branchement réel en T3.
 */
export function getMockAnalyticsData(filters: DashboardFilters): AnalyticsData {
  let multiplier = 1.0;

  if (filters.cohorte) {
    multiplier *= 0.55;
  }
  if (filters.domaine) {
    multiplier *= 0.35;
  }
  if (filters.statut) {
    multiplier *= 0.45;
  }

  const round = (val: number) => Math.max(1, Math.round(val * multiplier));

  const idees = round(BASE_MOCK_DATA.indicateurs.idees_recues);
  const dossiers = Math.min(idees, round(BASE_MOCK_DATA.indicateurs.dossiers_deposes));
  const selectionnes = Math.min(dossiers, round(BASE_MOCK_DATA.indicateurs.projets_selectionnes));
  const incubes = Math.min(selectionnes, round(BASE_MOCK_DATA.indicateurs.projets_incubes));
  const prototypes = Math.min(incubes, round(BASE_MOCK_DATA.indicateurs.prototypes));
  const taux = dossiers > 0 ? Number(((selectionnes / dossiers) * 100).toFixed(1)) : 0;

  return {
    indicateurs: {
      idees_recues: idees,
      dossiers_deposes: dossiers,
      projets_selectionnes: selectionnes,
      projets_incubes: incubes,
      prototypes: prototypes,
      taux_selection: taux,
    },
    parDomaine: BASE_MOCK_DATA.parDomaine.map((item) => ({
      domaine: item.domaine,
      total: round(item.total),
    })),
    parCohorte: BASE_MOCK_DATA.parCohorte.map((item) => ({
      cohorte: item.cohorte,
      total: round(item.total),
      selectionnes: Math.round(item.selectionnes * multiplier),
      prototypes: Math.round(item.prototypes * multiplier),
    })),
    parGenre: BASE_MOCK_DATA.parGenre.map((item) => ({
      genre: item.genre,
      total: round(item.total),
    })),
    evolution: BASE_MOCK_DATA.evolution.map((item) => ({
      mois: item.mois,
      total: round(item.total),
    })),
  };
}
