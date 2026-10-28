/**
 * Normalisation des libellés de domaines CIAT
 * Assure des libellés courts sur une seule ligne avec conservation du nom officiel complet
 */

export const DOMAINE_SHORT_MAP: Record<string, string> = {
  "Agriculture, transformation et environnement": "Agriculture et environnement",
  "Agriculture et environnement": "Agriculture et environnement",
  "Mécanique, fabrication et maintenance": "Mécanique et maintenance",
  "Mécanique et maintenance": "Mécanique et maintenance",
  "Pharmaceutique et biomédical": "Pharmacie et biomédical",
  "Pharmacie et biomédical": "Pharmacie et biomédical",
  "Services aux collectivités, entrepreneuriat et incubation": "Services aux collectivités",
  "Services aux collectivités": "Services aux collectivités",
  "TIC, numérique, intelligence artificielle et données": "TIC et IA",
  "TIC et IA": "TIC et IA",
  "Énergie, efficacité énergétique et énergies renouvelables": "Énergies renouvelables",
  "Énergies renouvelables": "Énergies renouvelables",
  "Éducation, formation professionnelle et insertion": "Éducation et insertion",
  "Éducation et insertion": "Éducation et insertion",
};

/**
 * Retourne le libellé court normalisé sur une seule ligne.
 */
export function getDomaineShortLabel(fullName: string | null | undefined): string {
  if (!fullName) return "Non spécifié";
  const trimmed = fullName.trim();
  if (DOMAINE_SHORT_MAP[trimmed]) {
    return DOMAINE_SHORT_MAP[trimmed];
  }
  // Correspondances partielles si besoin
  const lower = trimmed.toLowerCase();
  if (lower.includes("agri")) return "Agriculture et environnement";
  if (lower.includes("méc") || lower.includes("mec")) return "Mécanique et maintenance";
  if (lower.includes("pharm") || lower.includes("bio")) return "Pharmacie et biomédical";
  if (lower.includes("collectiv") || lower.includes("services")) return "Services aux collectivités";
  if (lower.includes("tic") || lower.includes("numér") || lower.includes("ia")) return "TIC et IA";
  if (lower.includes("énerg") || lower.includes("energ")) return "Énergies renouvelables";
  if (lower.includes("éduc") || lower.includes("educ") || lower.includes("insert")) return "Éducation et insertion";

  return trimmed;
}

/**
 * Retourne le nom officiel complet pour les tooltips.
 */
export function getDomaineFullName(name: string | null | undefined): string {
  if (!name) return "Non spécifié";
  return name.trim();
}
