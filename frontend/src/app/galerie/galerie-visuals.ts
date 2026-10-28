import type { FicheInnovation, MediaItem } from "@/lib/gallery-api";

export type DomaineCode =
  | "tous"
  | "numerique"
  | "mecanique"
  | "agriculture"
  | "energie"
  | "biomedical"
  | "education"
  | "collectivites";

export interface DomaineDef {
  code: DomaineCode;
  numero: string;
  shortLabel: string;
  fullLabel: string;
}

export const DOMAINES_CIAT: DomaineDef[] = [
  {
    code: "tous",
    numero: "01–07",
    shortLabel: "Toutes les 7 filières",
    fullLabel: "Toutes les 7 filières officielles du CIAT",
  },
  {
    code: "numerique",
    numero: "01",
    shortLabel: "Numérique & IA",
    fullLabel: "TIC, numérique, intelligence artificielle et données",
  },
  {
    code: "mecanique",
    numero: "02",
    shortLabel: "Mécanique & CNC",
    fullLabel: "Mécanique, fabrication et maintenance",
  },
  {
    code: "agriculture",
    numero: "03",
    shortLabel: "Agro & Environnement",
    fullLabel: "Agriculture, transformation et environnement",
  },
  {
    code: "energie",
    numero: "04",
    shortLabel: "Énergie Solaire",
    fullLabel: "Énergie, efficacité énergétique et énergies renouvelables",
  },
  {
    code: "biomedical",
    numero: "05",
    shortLabel: "Biomédical & Santé",
    fullLabel: "Pharmaceutique et biomédical",
  },
  {
    code: "education",
    numero: "06",
    shortLabel: "Éducation & VR",
    fullLabel: "Éducation, formation professionnelle et insertion",
  },
  {
    code: "collectivites",
    numero: "07",
    shortLabel: "Collectivités & Impact",
    fullLabel: "Services aux collectivités, entrepreneuriat et incubation",
  },
];

/**
 * Banque visuelle 100% auditée et vérifiée visuellement :
 * prototypes réels, ateliers CNC, sondes solaires IoT, électronique embarquée
 * et équipes d'ingénierie sénégalaises du CIAT (zéro photo stock hors-contexte).
 */
export const SLUG_VISUAL_MAP: Record<string, string> = {
  "agrisol-pompe-solaire-connectee": "/images/innovations/agrisol-iot.jpg",
  "smartirrig-saloum-goutte-a-goutte-automatise-par-sondes-dhumidite":
    "/images/innovations/agrisol-iot.jpg",
  "sunuagri-ai-detection-des-maladies-maraicheres-des-niayes":
    "/images/domaine_01_tic_hd.jpg",
  "prototype-secret-drone-surveillance-champs":
    "/images/domaine-numerique.jpg",
  "sunudoc-telemedecine-langues-nationales":
    "/images/innovations/telemedical-device.jpg",
  "telediag-rufisque-valise-de-telemedecine-pour-postes-de-sante-de-brousse":
    "/images/innovations/telemedical-device.jpg",
  "incubateur-neonatal-low-cost-pour-maternites-rurales":
    "/images/ciat_galerie_hero_elec.jpg",
  "incubateur-neonatal-low-cost-maternites":
    "/images/ciat_galerie_hero_elec.jpg",
  "usinage-cnc-local-pieces-de-rechange-pour-usines-agroalimentaires":
    "/images/innovations/cnc-4-0-clean.jpg",
  "presse-compacte-huile-arachide-sesame":
    "/images/ciat-hero-appel-engineer.webp",
  "batteuse-multicereales-adaptee-au-fonio-et-petit-mil":
    "/images/innovations/cnc-4-0-clean.jpg",
  "kit-robotique-pedagogique-lycees-techniques":
    "/images/ciat_galerie_hero_elec.jpg",
  "jumeau-numerique-ateliers-isep":
    "/images/ciat-hero-appel-engineer.webp",
  "simulateur-vr-soudure-et-usinage-isep-realite-virtuelle-pour-ateliers-techniques":
    "/images/domaine-numerique.jpg",
  "plateforme-dapprentissage-hybride-pour-metiers-feminins-porteurs":
    "/images/about-lab-students.png",
  "plateforme-dinsertion-metiers-matching-diplomes-isep-et-entreprises":
    "/images/contact/contact-accueil-campus.jpg",
  "dakar-waste-solutions-optimisation-de-collecte-des-ordures-menageres":
    "/images/galerie/fiche_dakar-waste-solutions-optimisation-de-collecte-des-ordures-menageres.jpg",
  "gestion-partagee-des-espaces-marchands-de-diamniadio":
    "/images/ciat-header-panoramique.jpg",
  "guichet-unique-numerique-des-permis-communaux":
    "/images/domaine_01_tic_hd.jpg",
  "smarttax-collect-fiscalite-locale-marches":
    "/images/auth-incubateur.jpg",
  "sunugrid-mini-reseau-solaire-intelligent-avec-paiement-pay-as-you-go":
    "/images/domaine-energie.jpg",
  "remorque-frigorifique-solaire-pour-mototricycles":
    "/images/ciat-hero-appel-engineer.webp",
  "mangue-sechee-casamance-sechoir-solaire-hybride-thermodynamique":
    "/images/hero_showroom.jpg",
  "kayar-trace-tracabilite-peche-artisanale":
    "/images/domaine_01_tic_hd.jpg",
};

const DOMAIN_FALLBACK_VISUALS: Record<Exclude<DomaineCode, "tous">, string[]> = {
  numerique: [
    "/images/domaine_01_tic_hd.jpg",
    "/images/domaine-numerique.jpg",
  ],
  mecanique: [
    "/images/innovations/cnc-4-0-clean.jpg",
    "/images/ciat-hero-appel-engineer.webp",
  ],
  agriculture: [
    "/images/innovations/agrisol-iot.jpg",
    "/images/hero_showroom.jpg",
  ],
  energie: [
    "/images/domaine-energie.jpg",
    "/images/ciat-depot-innovation.jpg",
  ],
  biomedical: [
    "/images/innovations/telemedical-device.jpg",
    "/images/ciat_galerie_hero_elec.jpg",
  ],
  education: [
    "/images/about-lab-students.png",
    "/images/ciat-hero-appel-engineer.webp",
  ],
  collectivites: [
    "/images/auth-incubateur.jpg",
    "/images/ciat-header-panoramique.jpg",
  ],
};

/**
 * Classification déterministe selon les 7 filières officielles du CIAT :
 * 1. Priorité absolue à la mention officielle de la filière dans `equipe`.
 * 2. Correspondance par mots-clés métiers pour les fiches historiques.
 */
export function inferDomaine(fiche: FicheInnovation): Exclude<DomaineCode, "tous"> {
  const eq = fiche.equipe.toLowerCase();

  // 1. Correspondance directe avec les 7 intitulés officiels CIAT dans `equipe`
  if (eq.includes("tic, numérique") || eq.includes("intelligence artificielle et données") || eq.includes("génie logiciel")) {
    return "numerique";
  }
  if (eq.includes("mécanique, fabrication") || eq.includes("mecanique, fabrication") || eq.includes("usinage")) {
    return "mecanique";
  }
  if (eq.includes("agriculture, transformation")) {
    return "agriculture";
  }
  if (eq.includes("efficacité énergétique") || eq.includes("énergies renouvelables")) {
    return "energie";
  }
  if (eq.includes("pharmaceutique et biomédical") || eq.includes("pharmaceutique et biomedical")) {
    return "biomedical";
  }
  if (eq.includes("éducation, formation") || eq.includes("education, formation") || eq.includes("éducation stem")) {
    return "education";
  }
  if (eq.includes("services aux collectivités") || eq.includes("gouvernance locale")) {
    return "collectivites";
  }

  // 2. Repli sémantique sur l'ensemble de la fiche
  const haystack = `${fiche.equipe} ${fiche.titre} ${fiche.solution}`.toLowerCase();

  if (
    haystack.includes("biomédical") ||
    haystack.includes("biomedical") ||
    haystack.includes("médic") ||
    haystack.includes("santé") ||
    haystack.includes("néonatal")
  ) {
    return "biomedical";
  }
  if (
    haystack.includes("cnc") ||
    haystack.includes("presse") ||
    haystack.includes("batteuse") ||
    haystack.includes("mécanique")
  ) {
    return "mecanique";
  }
  if (
    haystack.includes("marchands") ||
    haystack.includes("permis communaux") ||
    haystack.includes("ordures") ||
    haystack.includes("fiscalit")
  ) {
    return "collectivites";
  }
  if (
    haystack.includes("pédagogi") ||
    haystack.includes("lycées") ||
    haystack.includes("jumeau numérique") ||
    haystack.includes("simulateur vr")
  ) {
    return "education";
  }
  if (
    haystack.includes("mini-réseau") ||
    haystack.includes("sunugrid") ||
    haystack.includes("biogaz") ||
    haystack.includes("éolien")
  ) {
    return "energie";
  }
  if (
    haystack.includes("maraîch") ||
    haystack.includes("irrig") ||
    haystack.includes("hydroponie") ||
    haystack.includes("agrisol")
  ) {
    return "agriculture";
  }
  return "numerique";
}

export function resolveFicheVisual(
  fiche: FicheInnovation,
  domaine?: Exclude<DomaineCode, "tous">
): string {
  if (SLUG_VISUAL_MAP[fiche.slug]) {
    return SLUG_VISUAL_MAP[fiche.slug];
  }
  const resolvedDomaine = domaine ?? inferDomaine(fiche);
  const pool = DOMAIN_FALLBACK_VISUALS[resolvedDomaine];
  return pool[fiche.id % pool.length];
}

/**
 * Normalise la galerie photo d'une fiche détaillée pour éviter les URLs cassées `/media/galerie/`
 * ou les images de substitution génériques hors-contexte.
 */
export function resolveFichePhotos(fiche: FicheInnovation): MediaItem[] {
  const verifiedPrimary = resolveFicheVisual(fiche);
  const rawPhotos = (fiche.medias || []).filter((m) => m.type === "photo");

  if (rawPhotos.length === 0) {
    return [{ type: "photo", url: verifiedPrimary }];
  }

  return rawPhotos.map((p, idx) => {
    if (idx === 0 || p.url.startsWith("/media/galerie/")) {
      return { ...p, url: verifiedPrimary };
    }
    return p;
  });
}

/**
 * Écarte les liens vidéo de test non institutionnels (ex: liens factices de seed).
 */
export function filterValidExternalMedias(items: MediaItem[]): MediaItem[] {
  return items.filter(
    (m) =>
      Boolean(m.url) &&
      !m.url.includes("dQw4w9WgXcQ") &&
      !m.url.includes("example.com")
  );
}
