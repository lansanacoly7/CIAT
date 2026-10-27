/**
 * Client de données pour le Module P6 (Galerie des innovations).
 * Respecte rigoureusement le contrat d'API de taches/CONTRATS_API.md :
 * - GET /api/gallery/fiches/?domaine=&cohorte=&avancement=&search= (Public : fiches publiées)
 * - GET /api/gallery/fiches/{slug}/ (Public : détail d'une fiche publiée, incrémente vues)
 * - GET /api/gallery/fiches/{slug}/qr/ (Public : image PNG du QR code vers la fiche)
 *
 * Règle d'or : aucune fausse donnée affichée comme réelle.
 * Les données de secours ne sont activées QUE si NEXT_PUBLIC_MODE_DEMO=1.
 */
import { api, API_URL, type Page } from "./api";

export type MediaItem = {
  type: "photo" | "video" | "demo";
  url: string;
};

export type FicheInnovation = {
  id: number;
  slug: string;
  projet: number;
  titre: string;
  probleme: string;
  solution: string;
  equipe: string;
  avancement: string;
  medias: MediaItem[];
  statut: "brouillon" | "en_validation" | "publie" | "refuse";
  vues: number;
};

export type GalleryFilterParams = {
  search?: string;
  domaine?: string;
  cohorte?: string;
  avancement?: string;
  page?: number;
  pageSize?: number;
};

export type GalleryResponse = {
  items: FicheInnovation[];
  total: number;
  totalPages: number;
  fromApi: boolean;
  isDemo?: boolean;
  error: string | null;
};

export function isDemoMode(): boolean {
  return process.env.NEXT_PUBLIC_MODE_DEMO === "1";
}

/** Données de démonstration strictement isolées derrière NEXT_PUBLIC_MODE_DEMO=1 */
const MOCK_FICHES_DEMO: FicheInnovation[] = [
  {
    id: 1,
    slug: "agrisol-pompe-solaire-connectee",
    projet: 31,
    titre: "AgriSol — Pompes Solaires Connectées & Micro-Irrigation Intelligente",
    probleme:
      "Dans la vallée du fleuve Sénégal et les Niayes, le coût prohibitif du carburant pour motopompes et l'épuisement des nappes phréatiques menacent la rentabilité des petits maraîchers.",
    solution:
      "AgriSol combine une station de pompage solaire photovoltaïque avec un réseau de capteurs d'humidité des sols IoT et une vanne connectée LoRaWAN. L'irrigation est déclenchée automatiquement aux heures optimales, réduisant de 40 % la consommation d'eau.",
    equipe:
      "Aminata Diallo (Ingénieure Agronome, ISEP), Cheikh Ndiaye (Architecte IoT & Électronique), Babacar Sy (Développement Mobile)",
    avancement: "Prototype",
    medias: [
      {
        type: "photo",
        url: "/media/galerie/fiche_agrisol-pompes-solaires-connectees.jpg",
      },
      { type: "demo", url: "https://demo.agrisol.sn" },
    ],
    statut: "publie",
    vues: 142,
  },
  {
    id: 2,
    slug: "sunudoc-telemedecine-langues-nationales",
    projet: 40,
    titre: "SunuDoc — Téléconsultation Médicale et Triage Assisté en Langues Locales",
    probleme:
      "Plus de 60 % des populations rurales au Sénégal font face à des déserts médicaux et à une barrière linguistique lors des consultations médicales d'urgence ou de suivi prénatal.",
    solution:
      "SunuDoc est une station de télé-diagnostic mobile intégrant des capteurs physiologiques (stéthoscope numérique, oxymètre, ECG) et une interface vocale multilingue (Wolof, Pulaar, Sérère, Français) capable de guider l'infirmier de poste.",
    equipe:
      "Dr. Fatou Sow (Médecine communautaire), Moussa Ba (Ingénieur Intelligence Artificielle), Aïcha Faye (UX & Linguistique)",
    avancement: "MVP",
    medias: [
      {
        type: "photo",
        url: "/media/galerie/fiche_sunudoc-telemedecine-langues-nationales.jpg",
      },
      { type: "demo", url: "https://sunudoc.ciat-demo.sn" },
    ],
    statut: "publie",
    vues: 289,
  },
  {
    id: 3,
    slug: "jumeau-numerique-ateliers-isep",
    projet: 52,
    titre: "Jumeau Numérique des Ateliers ISEP pour Télé-Enseignement et Maintenance Virtuelle",
    probleme:
      "L'accès limité aux machines-outils de haute précision restreint le temps de pratique des apprenants dans les instituts professionnels et centres de formation technique décentralisés.",
    solution:
      "Plateforme immersive 3D reproduisant fidèlement les ateliers d'usinage et de chaudronnerie de l'ISEP Diamniadio. Les élèves réalisent des opérations de maintenance, de diagnostic de panne et de découpe numérique en réalité virtuelle.",
    equipe:
      "Mamadou Lamine Diagne (Conception mécanique 3D), Ousmane Sène (Développeur Unity/WebGL), Khady Ndao (Pédagogie professionnelle)",
    avancement: "Prototype",
    medias: [
      {
        type: "photo",
        url: "/media/galerie/fiche_jumeau-numerique-ateliers-isep.jpg",
      },
      { type: "demo", url: "https://jumeau-ateliers.isep.sn" },
    ],
    statut: "publie",
    vues: 310,
  },
  {
    id: 4,
    slug: "kayar-trace-tracabilite-peche-artisanale",
    projet: 3,
    titre: "Kayar Trace — Traçabilité Numérique et Chaîne de Froid de la Pêche Artisanale",
    probleme:
      "Près de 30 % des captures de la pêche artisanale sénégalaise subissent des avaries avant commercialisation faute de chaîne de froid tracée et de valorisation transparente auprès des mareyeurs.",
    solution:
      "Balises isothermes communicantes équipées de thermocapteurs et enregistrement décentralisé infalsifiable du trajet piroguier et de la température de conservation, certifiant la fraîcheur des poissons jusqu'au débarcadère.",
    equipe:
      "Abdoulaye Guèye (Génie logiciel maritime), Souleymane Mbaye (Électronique embarquée), Mariama Diallo (Économie halieutique)",
    avancement: "Pilote",
    medias: [
      {
        type: "photo",
        url: "/media/galerie/fiche_kayar-trace-tracabilite-peche-artisanale.jpg",
      },
      { type: "demo", url: "https://kayartrace.ciat-labs.org" },
    ],
    statut: "publie",
    vues: 195,
  },
  {
    id: 5,
    slug: "presse-compacte-huile-arachide-sesame",
    projet: 12,
    titre: "Presse Compacte Éco-Énergétique pour Oléagineux Locaux (Arachide & Sésame)",
    probleme:
      "L'extraction artisanale de l'huile dans le bassin arachidier reste manuelle, pénible et peu productive, tandis que les équipements industriels importés sont inadaptés aux groupements féminins villageois.",
    solution:
      "Presse à vis modulaire en acier inoxydable alimentaire, actionnée par un moteur basse consommation ou couplable à l'énergie solaire. Conception locale réparable avec pièces interchangeables fabriquées à l'atelier ISEP.",
    equipe:
      "Ibrahima Cissé (Ingénieur mécanique & usinage), Salimata Touré (Coopérative de transformation agroalimentaire)",
    avancement: "Déploiement",
    medias: [
      {
        type: "photo",
        url: "/media/galerie/fiche_presse-compacte-huile-arachide-sesame.jpg",
      },
    ],
    statut: "publie",
    vues: 412,
  },
];

/**
 * Récupère les fiches publiées depuis l'API publique `/api/gallery/fiches/`.
 */
export async function getFichesInnovation(
  params: GalleryFilterParams = {}
): Promise<GalleryResponse> {
  const query = new URLSearchParams();
  if (params.search?.trim()) query.set("search", params.search.trim());
  if (params.domaine?.trim()) query.set("domaine", params.domaine.trim());
  if (params.cohorte?.trim()) query.set("cohorte", params.cohorte.trim());
  if (params.avancement?.trim()) query.set("avancement", params.avancement.trim());
  if (params.page && params.page > 1) query.set("page", String(params.page));
  if (params.pageSize) query.set("page_size", String(params.pageSize));

  const qs = query.toString();
  const endpoint = `${API_URL}/gallery/fiches/${qs ? `?${qs}` : ""}`;

  try {
    const res = await fetch(endpoint, {
      method: "GET",
      headers: { Accept: "application/json" },
      cache: "no-store",
    });

    if (!res.ok) {
      throw new Error(`API error ${res.status}`);
    }

    const data = await res.json();

    // DRF standard paginated structure { count, next, previous, results }
    if (data && Array.isArray(data.results)) {
      const pageResult = data as Page<FicheInnovation>;
      const pageSize = params.pageSize || 20;
      return {
        items: pageResult.results,
        total: pageResult.count,
        totalPages: Math.max(1, Math.ceil(pageResult.count / pageSize)),
        fromApi: true,
        error: null,
      };
    }

    // Direct array fallback
    if (Array.isArray(data)) {
      return {
        items: data,
        total: data.length,
        totalPages: 1,
        fromApi: true,
        error: null,
      };
    }

    return { items: [], total: 0, totalPages: 1, fromApi: true, error: null };
  } catch {
    if (isDemoMode()) {
      let filtered = [...MOCK_FICHES_DEMO];
      if (params.search?.trim()) {
        const q = params.search.toLowerCase();
        filtered = filtered.filter(
          (f) =>
            f.titre.toLowerCase().includes(q) ||
            f.probleme.toLowerCase().includes(q) ||
            f.solution.toLowerCase().includes(q) ||
            f.equipe.toLowerCase().includes(q)
        );
      }
      if (params.avancement?.trim()) {
        filtered = filtered.filter((f) =>
          f.avancement.toLowerCase().includes(params.avancement!.toLowerCase())
        );
      }
      return {
        items: filtered,
        total: filtered.length,
        totalPages: 1,
        fromApi: false,
        isDemo: true,
        error: null,
      };
    }

    return {
      items: [],
      total: 0,
      totalPages: 1,
      fromApi: false,
      error:
        "La galerie des innovations est temporairement inaccessible. Veuillez vérifier la connexion au serveur.",
    };
  }
}

/**
 * Récupère le détail d'une fiche publiée par son slug.
 * L'API renvoie 404 si la fiche n'est pas au statut 'publie'.
 */
export async function getFicheBySlug(slug: string): Promise<{
  fiche: FicheInnovation | null;
  notFound?: boolean;
  error?: string;
  isDemo?: boolean;
}> {
  const endpoint = `${API_URL}/gallery/fiches/${encodeURIComponent(slug)}/`;

  try {
    const res = await fetch(endpoint, {
      method: "GET",
      headers: { Accept: "application/json" },
      cache: "no-store",
    });

    if (res.status === 404) {
      return { fiche: null, notFound: true };
    }

    if (!res.ok) {
      throw new Error(`API error ${res.status}`);
    }

    const data = (await res.json()) as FicheInnovation;
    return { fiche: data };
  } catch {
    if (isDemoMode()) {
      const match = MOCK_FICHES_DEMO.find((f) => f.slug === slug);
      if (match) {
        return { fiche: match, isDemo: true };
      }
      return { fiche: null, notFound: true, isDemo: true };
    }

    return {
      fiche: null,
      error:
        "Impossible de charger cette fiche d'innovation. Le serveur est momentanément indisponible.",
    };
  }
}

/**
 * URL directe du QR code PNG servi par l'API backend.
 */
export function getFicheQrUrl(slug: string): string {
  return `${API_URL}/gallery/fiches/${encodeURIComponent(slug)}/qr/`;
}

export type DomaineOption = {
  id: number;
  nom: string;
  slug: string;
};

export type CohorteOption = {
  id: number;
  nom: string;
  annee: number;
};

/**
 * Récupère les domaines réels du CIAT depuis /api/domaines/
 */
export async function getDomainesOptions(): Promise<DomaineOption[]> {
  try {
    const res = await fetch(`${API_URL}/domaines/`, {
      method: "GET",
      headers: { Accept: "application/json" },
      cache: "force-cache",
    });
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data)) return data;
      if (data && Array.isArray(data.results)) return data.results;
    }
  } catch {
    // silence fallback
  }

  // Domaines officiels du CIAT selon la charte
  return [
    { id: 1, nom: "TIC, numérique, intelligence artificielle et données", slug: "tic-numerique-intelligence-artificielle-et-donnees" },
    { id: 2, nom: "Mécanique, fabrication et maintenance", slug: "mecanique-fabrication-et-maintenance" },
    { id: 3, nom: "Agriculture, transformation et environnement", slug: "agriculture-transformation-et-environnement" },
    { id: 4, nom: "Énergie, efficacité énergétique et énergies renouvelables", slug: "energie-efficacite-energetique-et-energies-renouvelables" },
    { id: 5, nom: "Pharmaceutique et biomédical", slug: "pharmaceutique-et-biomedical" },
    { id: 6, nom: "Éducation, formation professionnelle et insertion", slug: "education-formation-professionnelle-et-insertion" },
    { id: 7, nom: "Services aux collectivités, entrepreneuriat et incubation", slug: "services-aux-collectivites-entrepreneuriat-et-incubation" },
  ];
}

/**
 * Récupère les cohortes depuis /api/cohortes/
 */
export async function getCohortesOptions(): Promise<CohorteOption[]> {
  try {
    const res = await fetch(`${API_URL}/cohortes/`, {
      method: "GET",
      headers: { Accept: "application/json" },
      cache: "force-cache",
    });
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data)) return data;
      if (data && Array.isArray(data.results)) return data.results;
    }
  } catch {
    // silence fallback
  }

  return [
    { id: 1, nom: "Cohorte 2026", annee: 2026 },
    { id: 3, nom: "Cohorte 2025", annee: 2025 },
    { id: 2, nom: "Cohorte 2024", annee: 2024 },
  ];
}

export type CreateFichePayload = {
  projet: number;
  titre: string;
  probleme: string;
  solution: string;
  equipe: string;
  avancement: string;
  medias?: MediaItem[];
};

export type GalleryStats = {
  total_vues: number;
  par_fiche: {
    slug: string;
    titre: string;
    vues: number;
  }[];
};

export type ProjetOption = {
  id: number;
  titre: string;
  statut: string;
};

/**
 * Crée une nouvelle fiche d'innovation (Porteur de projet).
 * La fiche démarre au statut 'brouillon'.
 */
export async function creerFiche(data: CreateFichePayload): Promise<FicheInnovation> {
  return await api<FicheInnovation>("/gallery/fiches/", {
    method: "POST",
    body: data,
    auth: true,
  });
}

/**
 * Soumet une fiche brouillon au comité pour validation (Porteur).
 * Statut : 'brouillon' -> 'en_validation'.
 */
export async function soumettreFiche(id: number): Promise<FicheInnovation> {
  return await api<FicheInnovation>(`/gallery/fiches/${id}/soumettre/`, {
    method: "POST",
    auth: true,
  });
}

/**
 * Valide et publie une fiche d'innovation (Coordonnateur ou Administrateur).
 * Statut : 'en_validation' -> 'publie'.
 */
export async function validerFiche(id: number): Promise<FicheInnovation> {
  return await api<FicheInnovation>(`/gallery/fiches/${id}/valider/`, {
    method: "POST",
    auth: true,
  });
}

/**
 * Refuse une fiche d'innovation (Coordonnateur ou Administrateur).
 * Statut : 'en_validation' -> 'refuse'.
 */
export async function refuserFiche(id: number): Promise<FicheInnovation> {
  return await api<FicheInnovation>(`/gallery/fiches/${id}/refuser/`, {
    method: "POST",
    auth: true,
  });
}

/**
 * Récupère les fiches du porteur connecté (tous statuts : brouillon, en_validation, publie, refuse).
 */
export async function getMesFiches(): Promise<FicheInnovation[]> {
  const data = await api<Page<FicheInnovation> | FicheInnovation[]>("/gallery/fiches/?mes_fiches=1", {
    method: "GET",
    auth: true,
  });
  if (data && "results" in data && Array.isArray(data.results)) {
    return data.results;
  }
  return Array.isArray(data) ? data : [];
}

/**
 * Récupère les fiches en attente de validation (Coordonnateur ou Administrateur).
 */
export async function getFichesEnValidation(): Promise<FicheInnovation[]> {
  const data = await api<Page<FicheInnovation> | FicheInnovation[]>("/gallery/fiches/?en_validation=1", {
    method: "GET",
    auth: true,
  });
  if (data && "results" in data && Array.isArray(data.results)) {
    return data.results;
  }
  return Array.isArray(data) ? data : [];
}

/**
 * Récupère les statistiques de consultation (Équipe CIAT).
 */
export async function getStatistiquesGallery(): Promise<GalleryStats> {
  return await api<GalleryStats>("/gallery/statistiques/", {
    method: "GET",
    auth: true,
  });
}

/**
 * Récupère les projets de l'utilisateur connecté pour l'associer à une nouvelle fiche.
 */
export async function getMesProjets(): Promise<ProjetOption[]> {
  try {
    const data = await api<Page<ProjetOption> | ProjetOption[]>("/projets/", {
      method: "GET",
      auth: true,
    });
    if (data && "results" in data && Array.isArray(data.results)) {
      return data.results;
    }
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}
