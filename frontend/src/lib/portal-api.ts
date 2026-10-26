/**
 * Client de données pour le Module P1 (Portail Institutionnel).
 * Respecte strictement les contrats d'API définis dans taches/CONTRATS_API.md.
 * 
 * En l'absence des endpoints backend (en cours de développement par Pathé),
 * fournit un fallback de données conformes pour garantir un fonctionnement sans régression.
 */
import { api, type Page } from "./api";

export type Actualite = {
  id: number;
  titre: string;
  slug: string;
  resume: string;
  contenu: string;
  image: string | null;
  publie_le: string;
};

export type Evenement = {
  id: number;
  titre: string;
  description: string;
  lieu: string;
  debut: string;
  fin: string;
  lien_inscription?: string;
};

export type AppelProjet = {
  id: number;
  titre: string;
  description: string;
  date_limite: string;
  statut: "ouvert" | "clos";
  pieces_demandees: string[];
};

// Données réalistes de référence conformes à l'écosystème ISEP Diamniadio / CIAT
const MOCK_ACTUALITES: Actualite[] = [
  {
    id: 1,
    titre: "Lancement de la plateforme numérique unifiée de l'Écosystème CIAT 360",
    slug: "lancement-plateforme-ciat-360",
    resume:
      "L'ISEP Amadou Trawaré de Diamniadio déploie sa nouvelle infrastructure digitale intégrant portail, incubateur, générateur de documents et showroom d'innovations.",
    contenu: `L'Institut Supérieur d'Enseignement Professionnel (ISEP) Amadou Trawaré de Diamniadio franchit une étape majeure dans sa dynamique de digitalisation avec la mise en service du guichet unique du CIAT.

Cette plateforme rassemble les apprenants, les enseignants et les partenaires industriels autour d'un parcours d'incubation rigoureux. Elle met en valeur les 7 filières prioritaires et offre aux porteurs de projets des outils modernes pour transformer leurs idées en prototypes fonctionnels.

Les étudiants et créateurs d'entreprises peuvent désormais soumettre leurs dossiers en ligne, suivre l'instruction par le comité de sélection et interagir avec leurs mentors attitrés.`,
    image: null,
    publie_le: "2026-10-24T09:00:00Z",
  },
  {
    id: 2,
    titre: "Partenariat stratégique pour le transfert technologique à Diamniadio",
    slug: "partenariat-strategique-transfert-technologique",
    resume:
      "Le CIAT renforce ses liens avec le tissu industriel local pour accélérer le prototypage et l'insertion professionnelle des diplômés.",
    contenu: `Dans le cadre de sa mission de transfert technologique, le CIAT a formalisé de nouvelles coopérations avec des acteurs majeurs des énergies renouvelables et de l'agro-industrie implantés à Diamniadio.

Ce partenariat permettra aux projets incubés d'accéder à des plateaux techniques spécialisés, des bancs de tests industriels et des opportunités d'expérimentation en conditions réelles.`,
    image: null,
    publie_le: "2026-10-18T14:30:00Z",
  },
  {
    id: 3,
    titre: "Ateliers de co-conception : l'IA générative au service des projets techniques",
    slug: "ateliers-co-conception-ia-generative",
    resume:
      "Retour sur les sessions d'accompagnement pratique des apprenants pour la formalisation de leurs cahiers des charges et analyses d'impact.",
    contenu: `Les équipes projets de l'ISEP ont participé à une série d'ateliers méthodologiques animés par le pôle d'ingénierie du CIAT.

L'objectif était d'utiliser l'IA générative de manière sobre et éthique afin d'assister la rédaction des documents techniques, l'élaboration des modèles économiques et l'analyse SWOT, sans jamais remplacer la rigueur de validation humaine.`,
    image: null,
    publie_le: "2026-10-12T11:00:00Z",
  },
];

const MOCK_EVENEMENTS: Evenement[] = [
  {
    id: 1,
    titre: "Journée Portes Ouvertes & Démonstrations des Prototypes du CIAT",
    description:
      "Rencontre entre le jury académique, les partenaires industriels et les porteurs de projets de l'ISEP de Diamniadio. Présentation en direct des démonstrateurs fonctionnels.",
    lieu: "Amphithéâtre Central & Ateliers du CIAT, ISEP Diamniadio",
    debut: "2026-11-05T09:00:00Z",
    fin: "2026-11-05T17:00:00Z",
    lien_inscription: "/connexion",
  },
  {
    id: 2,
    titre: "Comité de Sélection — Cohorte 2026 de l'Incubateur",
    description:
      "Session plénière d'audition des porteurs de projets présélectionnés par le comité d'évaluation selon la grille multicritère officielle.",
    lieu: "Salle du Conseil de Direction, ISEP Diamniadio",
    debut: "2026-11-12T10:00:00Z",
    fin: "2026-11-12T15:30:00Z",
  },
  {
    id: 3,
    titre: "Séminaire technique : Prototypage et Énergies Renouvelables au Sénégal",
    description:
      "Masterclass sur les systèmes photovoltaïques autonomes, la maintenance prédictive et les capteurs connectés pour l'agriculture locale.",
    lieu: "Laboratoire Génie Électrique & Solaire, CIAT Diamniadio",
    debut: "2026-11-20T14:00:00Z",
    fin: "2026-11-20T18:00:00Z",
    lien_inscription: "/connexion",
  },
];

const MOCK_APPELS: AppelProjet[] = [
  {
    id: 1,
    titre: "Appel à Candidatures — Cohorte d'Incubation 2026",
    description:
      "Programme complet d'accompagnement de 6 mois pour transformer votre idée innovante en prototype fonctionnel viable. Ouvert aux étudiants, diplômés et porteurs de projets dans les 7 filières officielles.",
    date_limite: "2026-11-15T23:59:59Z",
    statut: "ouvert",
    pieces_demandees: [
      "Fiche descriptive de projet (problème, solution, avancement)",
      "Présentation détaillée de l'équipe et compétences",
      "Budget prévisionnel des besoins en prototypage",
    ],
  },
  {
    id: 2,
    titre: "Appel à Projets Thématique : Agriculture de Précision & IoT",
    description:
      "Soutien ciblé pour les solutions connectées réduisant les pertes post-récolte et optimisant la gestion de l'irrigation dans les zones maraîchères de Thiès et Diamniadio.",
    date_limite: "2026-12-01T23:59:59Z",
    statut: "ouvert",
    pieces_demandees: [
      "Dossier technique de conception",
      "Schéma d'architecture IoT ou mécanique",
      "Note d'impact territorial et environnemental",
    ],
  },
  {
    id: 3,
    titre: "Session Spéciale — Maturation & Énergies Renouvelables 2025",
    description:
      "Session d'accompagnement dédiée aux prototypes de séchoirs solaires et bancs d'essai énergétiques.",
    date_limite: "2025-12-31T23:59:59Z",
    statut: "clos",
    pieces_demandees: [
      "Rapport final de prototypage",
      "Bilan de validation terrain",
    ],
  },
];

/**
 * Récupère les actualités du portail via l'API ou le fallback conforme.
 */
export async function getActualites(): Promise<{ items: Actualite[]; fromApi: boolean; error: string | null }> {
  try {
    const res = await api<Page<Actualite> | Actualite[]>("/portal/actualites/", { auth: false });
    const items = Array.isArray(res) ? res : res.results;
    if (items && items.length > 0) {
      return { items, fromApi: true, error: null };
    }
  } catch {
    // Endpoints non encore livrés par Pathé ou erreur réseau : fallback maîtrisé
  }
  return { items: MOCK_ACTUALITES, fromApi: false, error: null };
}

/**
 * Récupère le détail d'une actualité par son slug ou ID.
 */
export async function getActualiteBySlug(slug: string): Promise<Actualite | null> {
  try {
    const res = await api<Actualite>(`/portal/actualites/${slug}/`, { auth: false });
    if (res && res.titre) return res;
  } catch {
    // Fallback local
  }
  const found = MOCK_ACTUALITES.find((a) => a.slug === slug || String(a.id) === slug);
  return found ?? null;
}

/**
 * Récupère les événements du portail.
 */
export async function getEvenements(): Promise<{ items: Evenement[]; fromApi: boolean; error: string | null }> {
  try {
    const res = await api<Page<Evenement> | Evenement[]>("/portal/evenements/?a_venir=1", { auth: false });
    const items = Array.isArray(res) ? res : res.results;
    if (items && items.length > 0) {
      return { items, fromApi: true, error: null };
    }
  } catch {
    // Fallback local
  }
  return { items: MOCK_EVENEMENTS, fromApi: false, error: null };
}

/**
 * Récupère la liste des appels à projets.
 */
export async function getAppelsProjets(): Promise<{ items: AppelProjet[]; fromApi: boolean; error: string | null }> {
  try {
    const res = await api<Page<AppelProjet> | AppelProjet[]>("/portal/appels/", { auth: false });
    const items = Array.isArray(res) ? res : res.results;
    if (items && items.length > 0) {
      return { items, fromApi: true, error: null };
    }
  } catch {
    // Fallback local
  }
  return { items: MOCK_APPELS, fromApi: false, error: null };
}

export type ProjetIncube = {
  id: number;
  titre: string;
  resume: string;
  probleme: string;
  solution: string;
  domaine: {
    id: number;
    nom: string;
    slug: string;
  };
  cohorte: {
    id: number;
    nom: string;
    annee: number;
  };
  statut: "incube" | "prototype" | "termine";
  porteur_nom: string;
  cree_le: string;
  impact_attendu?: string;
  technologies?: string[];
};

export const MOCK_PROJETS_INCUBES: ProjetIncube[] = [
  {
    id: 1,
    titre: "SunuAgri-IoT : Irrigation Solaire Connectée & Monitoring des Sols",
    resume:
      "Dispositif d'irrigation intelligente alimenté par micro-panneaux solaires et doté de sondes d'humidité capacitives pour optimiser la consommation d'eau dans les exploitations maraîchères des Niayes.",
    probleme:
      "Le gaspillage d'eau d'exhaure et le coût prohibitif du carburant pour les motopompes réduisent considérablement la marge opérationnelle des petits exploitants agricoles périurbains.",
    solution:
      "Déploiement de vannes connectées LoRaWAN basse consommation couplées à une pompe solaire submersible et un algorithme d'irrigation adapté aux cycles de la culture maraîchère.",
    domaine: {
      id: 3,
      nom: "Agriculture de Précision & Agro-alimentaire",
      slug: "agriculture-agroalimentaire",
    },
    cohorte: {
      id: 1,
      nom: "Cohorte 2025 - Alpha",
      annee: 2025,
    },
    statut: "prototype",
    porteur_nom: "Fatou Bintou Ndiaye & Équipe AgroTech",
    cree_le: "2025-03-12T10:00:00Z",
    impact_attendu: "-40% de consommation d'eau et +25% de rendement sur les parcelles de test.",
    technologies: ["IoT LoRaWAN", "Énergie Solaire", "Capteurs d'humidité", "Next.js"],
  },
  {
    id: 2,
    titre: "Séchoir Thermosolaire Modulaire pour Céréales et Produits Halieutiques",
    resume:
      "Séchoir à flux d'air optimisé conçu avec des matériaux locaux sénégalais pour réduire drastiquement les pertes après récolte sans altérer les propriétés nutritionnelles des céréales et poissons séchés.",
    probleme:
      "Près de 30% des denrées récoltées subissent des dégradations prématurées ou des contaminations lors du séchage traditionnel à l'air libre exposé aux intempéries et aux poussières.",
    solution:
      "Chambre de déshydratation étanche alimentée par capteurs thermiques solaires à double vitrage, intégrant une régulation passive de la température et une ventilation assistée.",
    domaine: {
      id: 2,
      nom: "Ingénierie Mécanique & Systèmes Automatisés",
      slug: "mecanique-systemes",
    },
    cohorte: {
      id: 1,
      nom: "Cohorte 2025 - Alpha",
      annee: 2025,
    },
    statut: "termine",
    porteur_nom: "Mamadou Lamine Sow",
    cree_le: "2025-02-18T14:30:00Z",
    impact_attendu: "Temps de séchage divisé par 3 et réduction des pertes de stockage à moins de 4%.",
    technologies: ["Thermodynamique", "Construction Métallique", "Régulation Passive"],
  },
  {
    id: 3,
    titre: "CardioScan-AI : Télémédecine Cardiovasculaire Assistée par IA",
    resume:
      "Système de dépistage ECG portatif couplé à un modèle d'intelligence artificielle embarquée pour la détection précoce des anomalies cardiaques dans les dispensaires isolés dépourvus de cardiologues résidents.",
    probleme:
      "Les déserts médicaux et la pénurie de praticiens spécialistes ralentissent le diagnostic des pathologies cardiaques urgentes, entraînant des retards de prise en charge critiques.",
    solution:
      "Boîtier ECG portable à 6 dérivations synchronisé par Bluetooth avec une tablette de diagnostic, analysant les tracés en temps réel et alertant instantanément les hôpitaux de référence.",
    domaine: {
      id: 5,
      nom: "Santé Numérique & Technologies Médicales",
      slug: "sante-numerique",
    },
    cohorte: {
      id: 2,
      nom: "Cohorte 2026 - Diamniadio Innov",
      annee: 2026,
    },
    statut: "incube",
    porteur_nom: "Dr. Aïssatou Diouf & Collectif Santé 360",
    cree_le: "2026-01-10T09:15:00Z",
    impact_attendu: "Accès au pré-diagnostic en moins de 5 minutes pour plus de 15 000 usagers des centres ruraux.",
    technologies: ["Biomédecine", "Deep Learning", "Signal Processing", "FastAPI"],
  },
  {
    id: 4,
    titre: "Banc d'Essai Photovoltaïque Intelligent à Suivi Dynamique (TrackSol)",
    resume:
      "Structure suiveuse solaire à double axe motorisé gérée par microcontrôleur prédictif pour maximiser la captation du rayonnement solaire direct et modéliser l'encrassement par les poussières sahéliennes.",
    probleme:
      "La baisse de rendement causée par l'orientation fixe des panneaux photovoltaïques et l'accumulation rapide de poussière fine réduit le rendement annuel de 18 à 25% au Sénégal.",
    solution:
      "Algorithme de tracking astronomique optimisé complété par un réseau de photodiodes différentielles et un cycle de balayage pneumatique automatique programmable.",
    domaine: {
      id: 4,
      nom: "Énergies Renouvelables & Efficacité Énergétique",
      slug: "energies-renouvelables",
    },
    cohorte: {
      id: 1,
      nom: "Cohorte 2025 - Alpha",
      annee: 2025,
    },
    statut: "prototype",
    porteur_nom: "Cheikh Tidiane Guèye",
    cree_le: "2025-04-05T11:45:00Z",
    impact_attendu: "Gain énergétique mesuré de 28% comparé aux installations solaires fixes standard.",
    technologies: ["Photovoltaïque", "Servomoteurs", "Microcontrôleur ESP32", "Modbus"],
  },
  {
    id: 5,
    titre: "Plateforme EdTech de Réalité Virtuelle pour Métiers Techniques (JangTek)",
    resume:
      "Environnement d'apprentissage immersif permettant aux apprenants des instituts professionnels d'exécuter des travaux pratiques complexes de mécanique industrielle et de soudage en réalité virtuelle sécurisée sans consommer de matières premières.",
    probleme:
      "Le coût élevé des consommables techniques et les contraintes de sécurité limitent le volume d'heures d'ateliers pratiques des étudiants dans les filières professionnelles.",
    solution:
      "Simulateurs 3D interactifs sur casques VR autonomes reproduisant fidèlement les gestes techniques, les contraintes de couple mécanique et les normes de sécurité de l'atelier.",
    domaine: {
      id: 6,
      nom: "Technologies pour l'Éducation (EdTech)",
      slug: "edtech",
    },
    cohorte: {
      id: 2,
      nom: "Cohorte 2026 - Diamniadio Innov",
      annee: 2026,
    },
    statut: "incube",
    porteur_nom: "Abdoulaye Seck & Studio Virtuel ISEP",
    cree_le: "2026-02-01T16:20:00Z",
    impact_attendu: "Multiplication par 4 du temps de pratique par étudiant et réduction de 60% des coûts d'intrants.",
    technologies: ["Unity 3D", "WebXR", "OpenXR", "C#"],
  },
  {
    id: 6,
    titre: "Hub Numérique de Logistique Maraîchère & Traçabilité (TerangaLog)",
    resume:
      "Application mobile et tableau de bord unifié reliant les groupements de femmes productrices de Diamniadio aux grossistes de Dakar avec traçabilité par QR code, suivi des prix en temps réel et regroupement mutualisé des tournées de livraison frigorifique pour limiter le gaspillage alimentaire.",
    probleme:
      "L'asymétrie d'information sur les cours du marché et l'absence de mutualisation du fret frigorifique entraînent des braderies forcées et d'importantes pertes post-récolte pour les coopératives.",
    solution:
      "Bourse de fret agricole collaborative géolocalisée avec carnet de commandes groupées, alertes SMS multilingues (Wolof, Français) et optimisation automatique des trajets.",
    domaine: {
      id: 7,
      nom: "Services Numériques & Plateformes Collaboratives",
      slug: "services-numeriques",
    },
    cohorte: {
      id: 2,
      nom: "Cohorte 2026 - Diamniadio Innov",
      annee: 2026,
    },
    statut: "incube",
    porteur_nom: "Khadija Ba & Teranga Dev",
    cree_le: "2026-02-20T08:00:00Z",
    impact_attendu: "+35% de revenus nets pour les coopératives et suppression des intermédiaires informels.",
    technologies: ["React Native", "PostgreSQL", "Node.js", "SMS Gateway"],
  },
  {
    id: 7,
    titre: "VisionAgro : Diagnostic Optique Automatisé des Maladies des Cultures",
    resume:
      "Application assistée par intelligence artificielle de vision par ordinateur permettant à un cultivateur de photographier une feuille pour identifier instantanément les ravageurs et recevoir des recommandations de biopesticides locaux.",
    probleme:
      "Les attaques de chenilles légionnaires et de mildiou se propagent à grande échelle faute de diagnostic rapide, conduisant à une utilisation anarchique et toxique de produits phytosanitaires chimiques.",
    solution:
      "Modèle de convolution léger exécuté sur smartphone sans connexion internet obligatoire (Edge AI), entraîné spécifiquement sur les variétés végétales locales sénégalaises.",
    domaine: {
      id: 1,
      nom: "Technologies de l'Information et IA",
      slug: "tic-ia",
    },
    cohorte: {
      id: 1,
      nom: "Cohorte 2025 - Alpha",
      annee: 2025,
    },
    statut: "prototype",
    porteur_nom: "Ousmane Diallo",
    cree_le: "2025-05-14T13:10:00Z",
    impact_attendu: "Détection précoce à 94% de précision et diminution de moitié de l'usage des pesticides de synthèse.",
    technologies: ["TensorFlow Lite", "Computer Vision", "Python", "Flutter"],
  },
  {
    id: 8,
    titre: "Unité Mobile de Dessalement d'Eau Solaire par Distillation à Membranes",
    resume:
      "Générateur compact d'eau potable traitant l'eau saumâtre des nappes phréatiques côtières par couplage de capteurs solaires thermiques sous vide et membranes hydrophobes avancées.",
    probleme:
      "La salinisation croissante des forages dans les zones côtières et insulaires prive les populations d'une eau saine et entrave les cultures irriguées.",
    solution:
      "Système de distillation membranaire thermodynamique autonome alimenté exclusivement à l'énergie solaire thermique directe, sans besoin de raccordement au réseau électrique.",
    domaine: {
      id: 4,
      nom: "Énergies Renouvelables & Efficacité Énergétique",
      slug: "energies-renouvelables",
    },
    cohorte: {
      id: 1,
      nom: "Cohorte 2025 - Alpha",
      annee: 2025,
    },
    statut: "termine",
    porteur_nom: "Dr. Ibrahima Faye & Laboratoire Matériaux CIAT",
    cree_le: "2025-01-20T17:00:00Z",
    impact_attendu: "Production de 400 litres d'eau potable par jour à un coût énergétique nul.",
    technologies: ["Génie Chimique", "Membranes Nanoporeuses", "Solaire Thermique"],
  },
];

export type ProjetsFilterParams = {
  search?: string;
  domaine?: string;
  cohorte?: string;
  statut?: string;
  page?: number;
  pageSize?: number;
};

export type ProjetsResponse = {
  items: ProjetIncube[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  fromApi: boolean;
  error: string | null;
};

/**
 * Récupère l'annuaire des projets incubés du CIAT avec filtres combinés et recherche.
 */
export async function getProjetsIncubes(params: ProjetsFilterParams = {}): Promise<ProjetsResponse> {
  const { search = "", domaine = "", cohorte = "", statut = "", page = 1, pageSize = 6 } = params;

  // Tentative d'appel à l'API de Pathé
  try {
    const query = new URLSearchParams();
    if (search) query.set("search", search);
    if (domaine) query.set("domaine", domaine);
    if (cohorte) query.set("cohorte", cohorte);
    if (statut) query.set("statut", statut);
    query.set("page", String(page));

    const res = await api<Page<ProjetIncube> | ProjetIncube[]>(`/portal/projets-incubes/?${query.toString()}`, {
      auth: false,
    });

    const isPaged = res && typeof res === "object" && "results" in res;
    const items = isPaged ? (res as Page<ProjetIncube>).results : (res as ProjetIncube[]);
    const total = isPaged ? (res as Page<ProjetIncube>).count : (items ? items.length : 0);

    if (items && items.length > 0) {
      return {
        items,
        total,
        page,
        pageSize,
        totalPages: Math.max(1, Math.ceil(total / pageSize)),
        fromApi: true,
        error: null,
      };
    }
  } catch {
    // Endpoints non encore disponibles sur le backend : bascule sur le mock certifié
  }

  // Filtrage local robuste
  let filtered = [...MOCK_PROJETS_INCUBES];

  if (search.trim()) {
    const q = search.toLowerCase().trim();
    filtered = filtered.filter(
      (p) =>
        p.titre.toLowerCase().includes(q) ||
        p.resume.toLowerCase().includes(q) ||
        p.probleme.toLowerCase().includes(q) ||
        p.solution.toLowerCase().includes(q) ||
        p.porteur_nom.toLowerCase().includes(q)
    );
  }

  if (domaine) {
    filtered = filtered.filter(
      (p) => p.domaine.slug === domaine || String(p.domaine.id) === domaine || p.domaine.nom === domaine
    );
  }

  if (cohorte) {
    filtered = filtered.filter(
      (p) => String(p.cohorte.annee) === cohorte || String(p.cohorte.id) === cohorte || p.cohorte.nom === cohorte
    );
  }

  if (statut) {
    filtered = filtered.filter((p) => p.statut === statut);
  }

  const total = filtered.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const currentPage = Math.min(Math.max(1, page), totalPages);
  const startIndex = (currentPage - 1) * pageSize;
  const paginatedItems = filtered.slice(startIndex, startIndex + pageSize);

  return {
    items: paginatedItems,
    total,
    page: currentPage,
    pageSize,
    totalPages,
    fromApi: false,
    error: null,
  };
}

/**
 * Récupère le détail d'un projet incubé par son identifiant.
 */
export async function getProjetIncubeById(id: number | string): Promise<ProjetIncube | null> {
  try {
    const res = await api<ProjetIncube>(`/portal/projets-incubes/${id}/`, { auth: false });
    if (res && res.titre) return res;
  } catch {
    // Fallback local
  }

  const found = MOCK_PROJETS_INCUBES.find((p) => String(p.id) === String(id));
  return found ?? null;
}

