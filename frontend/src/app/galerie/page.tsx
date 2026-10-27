"use client";

import { useEffect, useState, useTransition, useMemo, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import { ApiErrorBanner } from "@/components/ui";
import {
  getDomainesOptions,
  getCohortesOptions,
  getFichesInnovation,
  type CohorteOption,
  type DomaineOption,
  type FicheInnovation,
  type GalleryFilterParams,
} from "@/lib/gallery-api";

// Mapping des photos réelles pour chaque fiche d'innovation
const REAL_FICHE_PHOTOS: Record<string, string> = {
  "gestion-partagee-des-espaces-marchands-de-diamniadio": "/images/galerie_moments/nos-espaces.jpg",
  "guichet-unique-numerique-des-permis-communaux": "/images/galerie_moments/collaboration-numerique.jpg",
  "dakar-waste-solutions-optimisation-de-collecte-des-ordures-menageres": "/images/galerie/fiche_dakar-waste-solutions-optimisation-de-collecte-des-ordures-menageres.jpg",
  "plateforme-dapprentissage-hybride-pour-metiers-feminins-porteurs": "/images/galerie_moments/formation.jpg",
  "plateforme-dinsertion-metiers-matching-diplomes-isep-et-entreprises": "/images/galerie_moments/incubation.jpg",
  "simulateur-vr-soudure-et-usinage-isep-realite-virtuelle-pour-ateliers-techniques": "/images/galerie_moments/realite-virtuelle-isep.jpg",
  "incubateur-neonatal-low-cost-pour-maternites-rurales": "/images/galerie_moments/sante-diagnostic-brousse.jpg",
  "production-locale-dhydrogel-antiseptique-a-base-de-moringa": "/images/galerie_moments/biopharma-lab.jpg",
  "telediag-rufisque-valise-de-telemedecine-pour-postes-de-sante-de-brousse": "/images/galerie/fiche_telediag-rufisque-valise-de-telemedecine-pour-postes-de-sante-de-brousse.jpg",
  "biopharma-diaraf-extraction-standardisee-de-principes-actifs-dartemisia": "/images/galerie_moments/biopharma-lab.jpg",
  "eolien-artisanal-petite-cote-pompage-deau-par-eoliennes-multipales": "/images/galerie/fiche_eolien-artisanal-petite-cote-pompage-deau-par-eoliennes-multipales.jpg",
  "sunugrid-mini-reseau-solaire-intelligent-avec-paiement-pay-as-you-go": "/images/galerie_moments/smart-microgrid.jpg",
  "hydroponie-urbaine-dakar-salades-et-aromates-sur-toits-dimmeubles": "/images/galerie_moments/hydroponie-serre.jpg",
  "smartirrig-saloum-goutte-a-goutte-automatise-par-sondes-dhumidite": "/images/galerie_moments/irrigation-intelligente.jpg",
  "usinage-cnc-local-pieces-de-rechange-pour-usines-agroalimentaires": "/images/galerie_moments/usinage-mecanique.jpg",
  "sunuagri-ai-detection-des-maladies-maraicheres-des-niayes": "/images/galerie/fiche_sunuagri-ai-detection-des-maladies-maraicheres-des-niayes.jpg",
  "biogaz-dechets-marches-poissons": "/images/galerie/fiche_biogaz-dechets-marches-poissons.jpg",
  "prototype-secret-drone-surveillance-champs": "/images/galerie_moments/drone-field-test.jpg",
  "kit-robotique-pedagogique-lycees-techniques": "/images/galerie_moments/projets-robotique.jpg",
  "smarttax-collect-fiscalite-locale-marches": "/images/galerie/fiche_smarttax-collect-fiscalite-locale-marches.jpg",
  "incubateur-neonatal-low-cost-maternites": "/images/galerie/fiche_incubateur-neonatal-low-cost-maternites.jpg",
  "presse-compacte-huile-arachide-sesame": "/images/galerie/fiche_presse-compacte-huile-arachide-sesame.jpg",
  "kayar-trace-tracabilite-peche-artisanale": "/images/galerie/fiche_kayar-trace-tracabilite-peche-artisanale.jpg",
  "jumeau-numerique-ateliers-isep": "/images/galerie_moments/fablab-prototypage.jpg",
  "sunudoc-telemedecine-langues-nationales": "/images/galerie/fiche_sunudoc-telemedecine-langues-nationales.jpg",
  "agrisol-pompe-solaire-connectee": "/images/galerie_moments/solaire-campus.jpg",
};

// 27 moments photographiques HD réels du CIAT
const CAMPUS_MOMENTS = [
  // Page 1 — Les 9 moments clés initiaux
  {
    id: 1,
    slug: "nos-espaces",
    titre: "Nos espaces",
    sousTitre: "Le CIAT en images",
    description: "Espaces de coworking modulaires, terrasses végétalisées et laboratoires équipés au cœur de la Cité du Savoir.",
    equipe: "Direction des Espaces & Campus Diamniadio",
    avancement: "Opérationnel",
    categorie: "Espaces",
    photo: "/images/galerie_moments/nos-espaces.jpg",
    vues: 840,
    lieu: "Bâtiment Central • Diamniadio",
  },
  {
    id: 2,
    slug: "formation-metiers-futur",
    titre: "Formation technique",
    sousTitre: "Des compétences pour demain",
    description: "Ateliers pratiques, certifications techniques et accompagnement immersif en mécatronique, IoT et intelligence artificielle.",
    equipe: "Pôle Pédagogique ISEP Amadou Trawaré",
    avancement: "En continu",
    categorie: "Formation",
    photo: "/images/galerie_moments/formation.jpg",
    vues: 720,
    lieu: "Ateliers Pédagogiques",
  },
  {
    id: 3,
    slug: "vie-au-ciat",
    titre: "Vie au CIAT",
    sousTitre: "Une communauté engagée",
    description: "Communauté scientifique et entrepreneuriale dynamique valorisant les talents féminins et les synergies pluridisciplinaires.",
    equipe: "Communauté Scientifique & Étudiante",
    avancement: "Actif",
    categorie: "Vie au CIAT",
    photo: "/images/galerie_moments/vie-au-ciat.jpg",
    vues: 950,
    lieu: "Espace Collaboratif Nord",
  },
  {
    id: 4,
    slug: "evenements-rencontres",
    titre: "Événements & Salons",
    sousTitre: "Des rencontres qui inspirent",
    description: "Restitutions annuelles, journées portes ouvertes, salons de l'innovation et démonstrations en direct des prototypes.",
    equipe: "Pôle Partenariats & Événements",
    avancement: "Trimestriel",
    categorie: "Événements",
    photo: "/images/galerie_moments/evenements.jpg",
    vues: 890,
    lieu: "Amphithéâtre ISEP",
  },
  {
    id: 5,
    slug: "projets-innovation",
    titre: "Projets & Robotique",
    sousTitre: "Des idées qui prennent vie",
    description: "Conception, assemblage et validation fonctionnelle de prototypes mécatroniques et de systèmes automatisés sur mesure.",
    equipe: "Laboratoire de Prototypage CIAT",
    avancement: "Prototype",
    categorie: "Projets",
    photo: "/images/galerie_moments/projets-robotique.jpg",
    vues: 1040,
    lieu: "Laboratoire Mécatronique",
  },
  {
    id: 6,
    slug: "espaces-de-travail",
    titre: "Espaces de travail",
    sousTitre: "Un cadre propice à l'innovation",
    description: "Architecture bioclimatique favorisant la concentration, le partage d'idées et l'émergence de solutions à fort impact territorial.",
    equipe: "Services Généraux Campus",
    avancement: "Opérationnel",
    categorie: "Espaces",
    photo: "/images/galerie_moments/espaces-travail.jpg",
    vues: 610,
    lieu: "Atrium Central",
  },
  {
    id: 7,
    slug: "incubation-talents",
    titre: "Incubation",
    sousTitre: "Accompagner les talents",
    description: "Programme structuré de pré-incubation et d'accélération pour transformer la recherche appliquée en entreprises viables.",
    equipe: "Pôle Entrepreneuriat & Incubation",
    avancement: "En cours",
    categorie: "Formation",
    photo: "/images/galerie_moments/incubation.jpg",
    vues: 780,
    lieu: "Hub d'Incubation",
  },
  {
    id: 8,
    slug: "inauguration-ciat",
    titre: "Inauguration",
    sousTitre: "Le CIAT, une vision pour l'avenir",
    description: "Lancement officiel des infrastructures du Centre d'Innovation avec les autorités académiques et les partenaires industriels.",
    equipe: "Direction Générale ISEP Diamniadio",
    avancement: "Jalon Clé",
    categorie: "Événements",
    photo: "/images/galerie_moments/inauguration.jpg",
    vues: 1250,
    lieu: "Campus Diamniadio",
  },
  {
    id: 9,
    slug: "moments-institutionnels",
    titre: "Moments institutionnels",
    sousTitre: "Une dynamique collective",
    description: "Signatures de conventions public-privé et partenariats stratégiques pour pérenniser le transfert technologique au Sénégal.",
    equipe: "Comité de Direction CIAT-ISEP",
    avancement: "Certifié",
    categorie: "Vie au CIAT",
    photo: "/images/galerie_moments/moments-institutionnels.jpg",
    vues: 670,
    lieu: "Salle du Conseil",
  },
  // Page 2 & 3 — Moments d'immersion technique
  {
    id: 10,
    slug: "fablab-machines",
    titre: "FabLab & Prototypage",
    sousTitre: "Machines de pointe et découpe CNC",
    description: "Parc de machines industrielles, découpe laser, usinage numérique et impression 3D pour les créateurs.",
    equipe: "Makers & Ingénieurs FabLab",
    avancement: "Opérationnel",
    categorie: "Espaces",
    photo: "/images/galerie_moments/fablab-prototypage.jpg",
    vues: 540,
    lieu: "Makerspace Nord",
  },
  {
    id: 11,
    slug: "pitch-startups-investisseurs",
    titre: "Pitch & Investisseurs",
    sousTitre: "Présentation des solutions d'impact",
    description: "Sessions de pitch devant des fonds d'amorçage, banques de développement et business angels régionaux.",
    equipe: "Pôle Incubation CIAT",
    avancement: "Trimestriel",
    categorie: "Événements",
    photo: "/images/galerie_moments/pitch-startups.jpg",
    vues: 820,
    lieu: "Espace Conférence",
  },
  {
    id: 12,
    slug: "microgrid-solaire",
    titre: "Transition Énergétique",
    sousTitre: "Micro-réseaux et monitoring intelligent",
    description: "Systèmes photovoltaïques connectés et bancs d'essai pour l'électrification rurale autonome.",
    equipe: "Département Énergies Renouvelables",
    avancement: "Pilote",
    categorie: "Projets",
    photo: "/images/galerie_moments/smart-microgrid.jpg",
    vues: 910,
    lieu: "Plateforme Solaire",
  },
  {
    id: 13,
    slug: "realite-virtuelle-simulateurs",
    titre: "Immersion Réalité Virtuelle",
    sousTitre: "Simulateurs d'ateliers techniques",
    description: "Casques VR et jumeaux numériques pour former les techniciens aux gestes professionnels de précision.",
    equipe: "Laboratoire Numérique ISEP",
    avancement: "Déploiement",
    categorie: "Formation",
    photo: "/images/galerie_moments/realite-virtuelle-isep.jpg",
    vues: 730,
    lieu: "Lab Réalité Virtuelle",
  },
  {
    id: 14,
    slug: "hackathon-sprint-diamniadio",
    titre: "Hackathons & Sprints",
    sousTitre: "48h d'innovation intensive",
    description: "Compétitions de code et de mécatronique réunissant étudiants, designers et développeurs chevronnés.",
    equipe: "Club Innovation ISEP",
    avancement: "Annuel",
    categorie: "Événements",
    photo: "/images/galerie_moments/hackathon-sprint.jpg",
    vues: 640,
    lieu: "Grande Halle du Savoir",
  },
  {
    id: 15,
    slug: "serre-hydroponique-urbaine",
    titre: "AgriTech & Serres",
    sousTitre: "Irrigation raisonnée et capteurs IoT",
    description: "Modèles de culture hydroponique et pilotage automatisé de la fertilisation adaptés au climat sahélien.",
    equipe: "Filière Bio-Industries CIAT",
    avancement: "Prototype",
    categorie: "Projets",
    photo: "/images/galerie_moments/hydroponie-serre.jpg",
    vues: 890,
    lieu: "Serre Expérimentale",
  },
  {
    id: 16,
    slug: "drones-telemetrie-agricole",
    titre: "Télémétrie & Drones",
    sousTitre: "Surveillance et cartographie aérienne",
    description: "Drones équipés de capteurs multispectraux pour l'analyse de santé des cultures maraîchères.",
    equipe: "Unité Robotique & Drones",
    avancement: "Pilote",
    categorie: "Projets",
    photo: "/images/galerie_moments/drone-field-test.jpg",
    vues: 770,
    lieu: "Zone d'Essais Extérieure",
  },
  {
    id: 17,
    slug: "visites-officielles-campus",
    titre: "Accueil & Rayonnement",
    sousTitre: "Délégations nationales et internationales",
    description: "Présentation des prototypes et des laboratoires aux délégations ministérielles et partenaires d'Afrique de l'Ouest.",
    equipe: "Relations Extérieures CIAT",
    avancement: "Régulier",
    categorie: "Vie au CIAT",
    photo: "/images/galerie_moments/visite-campus-isep.jpg",
    vues: 590,
    lieu: "Hall d'Honneur",
  },
  {
    id: 18,
    slug: "remise-certificats-laureats",
    titre: "Cérémonies de Remise",
    sousTitre: "Célébration des lauréats et diplômés",
    description: "Remise officielle des certifications professionnelles aux promotions de jeunes innovateurs et ingénieurs.",
    equipe: "Direction Pédagogique ISEP",
    avancement: "Célébration",
    categorie: "Formation",
    photo: "/images/galerie_moments/remise-certificats.jpg",
    vues: 810,
    lieu: "Amphithéâtre ISEP",
  },
  {
    id: 19,
    slug: "biopharma-armoise-lab",
    titre: "Bio-Industries & Santé",
    sousTitre: "Valorisation de la pharmacopée locale",
    description: "Extraction standardisée de principes actifs et formulation galénique de solutions antiseptiques certifiées.",
    equipe: "Laboratoire Bio-Pharma CIAT",
    avancement: "TRL 6",
    categorie: "Projets",
    photo: "/images/galerie_moments/biopharma-lab.jpg",
    vues: 680,
    lieu: "Laboratoire Chimie & Bio",
  },
  {
    id: 20,
    slug: "usinage-mecanique-cnc",
    titre: "Usinage Numérique CNC",
    sousTitre: "Souveraineté industrielle et pièces de rechange",
    description: "Fraisage et tournage de pièces mécaniques complexes pour la maintenance des usines locales.",
    equipe: "Atelier Mécanique Lourde",
    avancement: "Opérationnel",
    categorie: "Projets",
    photo: "/images/galerie_moments/usinage-mecanique.jpg",
    vues: 640,
    lieu: "Pôle Usinage 4.0",
  },
  {
    id: 21,
    slug: "collaboration-numerique-isep",
    titre: "Collaboration Numérique",
    sousTitre: "Synergies chercheurs et développeurs",
    description: "Salles informatiques équipées pour le code collaboratif, les systèmes embarqués et le prototypage logiciel.",
    equipe: "Pôle Systèmes & Réseaux",
    avancement: "En continu",
    categorie: "Vie au CIAT",
    photo: "/images/galerie_moments/collaboration-numerique.jpg",
    vues: 710,
    lieu: "Salle Calcul Haute Performance",
  },
  {
    id: 22,
    slug: "forum-regional-innovation",
    titre: "Forum de l'Innovation",
    sousTitre: "Carrefour régional de la tech ouest-africaine",
    description: "Rencontre biennale des décideurs, chercheurs et startups pour accélérer l'industrialisation des savoirs.",
    equipe: "Comité d'Organisation CIAT",
    avancement: "Biennal",
    categorie: "Événements",
    photo: "/images/galerie_moments/forum-innovation.jpg",
    vues: 930,
    lieu: "Cité du Savoir",
  },
  {
    id: 23,
    slug: "irrigation-goutte-a-goutte",
    titre: "Irrigation Intelligente",
    sousTitre: "Gestion économe de l'eau par capteurs IoT",
    description: "Automatisation des vannes d'irrigation par détection d'humidité des sols maraîchers des Niayes.",
    equipe: "Projet SmartIrrig Saloum",
    avancement: "Pilote",
    categorie: "Projets",
    photo: "/images/galerie_moments/irrigation-intelligente.jpg",
    vues: 850,
    lieu: "Bassin Expérimental",
  },
  {
    id: 24,
    slug: "partenariats-academiques-internationaux",
    titre: "Accords Stratégiques",
    sousTitre: "Coopération académique & industrielle",
    description: "Signature d'accords d'échange d'expertise avec les universités technologiques partenaires.",
    equipe: "Direction Générale CIAT",
    avancement: "Signé",
    categorie: "Vie au CIAT",
    photo: "/images/galerie_moments/partenariat-international.jpg",
    vues: 600,
    lieu: "Salon Protocolaire",
  },
  {
    id: 25,
    slug: "sante-diagnostic-rural",
    titre: "Santé Connectée Rurale",
    sousTitre: "Valise de télémédecine décentralisée",
    description: "Dispositif portable autonome alimenté par mini-panneau solaire pour les postes de santé isolés.",
    equipe: "Unité Médicale CIAT",
    avancement: "Pilote TRL 7",
    categorie: "Projets",
    photo: "/images/galerie_moments/sante-diagnostic-brousse.jpg",
    vues: 920,
    lieu: "Atelier Dispositifs Médicaux",
  },
  {
    id: 26,
    slug: "bancs-photovoltaiques-isep",
    titre: "Bancs Solaires Connectés",
    sousTitre: "Tests en conditions climatiques réelles",
    description: "Mesure de rendement des cellules solaires sous fort ensoleillement et milieu poussiéreux sahélien.",
    equipe: "Laboratoire Énergies",
    avancement: "Opérationnel",
    categorie: "Espaces",
    photo: "/images/galerie_moments/solaire-campus.jpg",
    vues: 780,
    lieu: "Toiture Technique Labo",
  },
  {
    id: 27,
    slug: "design-thinking-brainstorming",
    titre: "Design & Idéation",
    sousTitre: "Méthodologies agiles et co-conception",
    description: "Ateliers d'idéation réunissant usagers finaux, artisans et ingénieurs pour concevoir des produits adaptés.",
    equipe: "Cellule Design Thinking",
    avancement: "En continu",
    categorie: "Formation",
    photo: "/images/galerie_moments/brainstorming-design.jpg",
    vues: 670,
    lieu: "Salle Idéation CIAT",
  },
];

const CATEGORIES_NAV = [
  "Tous",
  "Espaces",
  "Formation",
  "Projets",
  "Événements",
  "Vie au CIAT",
] as const;

type NavCategory = (typeof CATEGORIES_NAV)[number];

const AVANCEMENT_OPTIONS = [
  { value: "", label: "Toutes les étapes" },
  { value: "Prototype", label: "Prototype fonctionnel (TRL 4-6)" },
  { value: "MVP", label: "MVP (Produit Minimum Viable)" },
  { value: "Pilote", label: "Pilote terrain (TRL 7)" },
  { value: "Déploiement", label: "Déploiement industriel (TRL 8)" },
];

export default function GaleriePage() {
  const [, startTransition] = useTransition();

  // Navigation par catégorie principale
  const [navCategory, setNavCategory] = useState<NavCategory>("Tous");

  // Filtres détaillés & recherche
  const [search, setSearch] = useState("");
  const [domaine, setDomaine] = useState("");
  const [cohorte, setCohorte] = useState("");
  const [avancement, setAvancement] = useState("");
  const [sortBy, setSortBy] = useState<"recents" | "vues" | "alpha">("recents");
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [page, setPage] = useState(1);

  // Options dynamiques
  const [domainesList, setDomainesList] = useState<DomaineOption[]>([]);
  const [cohortesList, setCohortesList] = useState<CohorteOption[]>([]);

  // Données de l'API
  const [fiches, setFiches] = useState<FicheInnovation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modale Lightbox
  const [activeItem, setActiveItem] = useState<{
    id: number;
    titre: string;
    sousTitre?: string;
    photo: string;
    categorie: string;
    avancement: string;
    description: string;
    equipe: string;
    lieu?: string;
    slug?: string;
    isPrototype?: boolean;
  } | null>(null);

  // Charger les options de filtrage au montage
  useEffect(() => {
    let ignore = false;
    getDomainesOptions().then((d) => {
      if (!ignore) setDomainesList(d);
    });
    getCohortesOptions().then((c) => {
      if (!ignore) setCohortesList(c);
    });
    return () => {
      ignore = true;
    };
  }, []);

  // Fonction de chargement API
  const fetchFiches = useCallback((params: GalleryFilterParams) => {
    setLoading(true);
    setError(null);
    getFichesInnovation(params)
      .then((res) => {
        setFiches(res.items);
        setError(res.error);
        setLoading(false);
      })
      .catch(() => {
        setError("La galerie des innovations est momentanément indisponible.");
        setFiches([]);
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    let ignore = false;
    const queryParams: GalleryFilterParams = {
      search,
      domaine,
      cohorte,
      avancement,
      page: 1,
      pageSize: 50,
    };

    getFichesInnovation(queryParams)
      .then((res) => {
        if (!ignore) {
          setFiches(res.items);
          setError(res.error);
          setLoading(false);
        }
      })
      .catch(() => {
        if (!ignore) {
          setError("La galerie des innovations est momentanément indisponible.");
          setFiches([]);
          setLoading(false);
        }
      });

    return () => {
      ignore = true;
    };
  }, [search, domaine, cohorte, avancement]);

  const handleResetFilters = () => {
    startTransition(() => {
      setSearch("");
      setDomaine("");
      setCohorte("");
      setAvancement("");
      setNavCategory("Tous");
      setSortBy("recents");
      setPage(1);
    });
  };

  const hasActiveFilters = Boolean(search || domaine || cohorte || avancement);

  // Fusion et filtrage unifié des éléments affichés
  const combinedItems = useMemo(() => {
    // 1. Adapter les fiches API réelles
    const protoItems = fiches.map((f) => {
      const realPhoto =
        REAL_FICHE_PHOTOS[f.slug] ||
        f.medias?.find((m) => m.type === "photo")?.url ||
        "/images/galerie_moments/projets-robotique.jpg";

      return {
        id: f.id + 1000,
        slug: f.slug,
        titre: f.titre,
        sousTitre: f.avancement ? `${f.avancement} • Prototype validé` : "Innovation CIAT",
        description: f.solution || f.probleme,
        equipe: f.equipe,
        avancement: f.avancement || "Prototype",
        categorie: "Projets",
        photo: realPhoto,
        vues: f.vues,
        lieu: "Ateliers CIAT • Diamniadio",
        isPrototype: true,
      };
    });

    // 2. Adapter les 27 moments du campus CIAT
    const momentItems = CAMPUS_MOMENTS.map((m) => ({
      id: m.id,
      slug: m.slug,
      titre: m.titre,
      sousTitre: m.sousTitre,
      description: m.description,
      equipe: m.equipe,
      avancement: m.avancement,
      categorie: m.categorie,
      photo: m.photo,
      vues: m.vues,
      lieu: m.lieu,
      isPrototype: false,
    }));

    // 3. Filtrer par catégorie de la barre d'onglets
    let list: Array<{
      id: number;
      slug: string;
      titre: string;
      sousTitre: string;
      description: string;
      equipe: string;
      avancement: string;
      categorie: string;
      photo: string;
      vues: number;
      lieu?: string;
      isPrototype: boolean;
    }> = [];

    if (navCategory === "Tous") {
      list = [...momentItems, ...protoItems];
    } else {
      list = momentItems.filter((i) => i.categorie === navCategory);
      if (navCategory === "Projets") {
        list = [...list, ...protoItems];
      }
    }

    // 4. Recherche par mot-clé
    if (search.trim()) {
      const q = search.toLowerCase().trim();
      list = list.filter(
        (item) =>
          item.titre.toLowerCase().includes(q) ||
          item.sousTitre.toLowerCase().includes(q) ||
          item.description.toLowerCase().includes(q) ||
          item.equipe.toLowerCase().includes(q)
      );
    }

    // 5. Filtrage TRL / Avancement
    if (avancement) {
      list = list.filter((item) =>
        item.avancement.toLowerCase().includes(avancement.toLowerCase())
      );
    }

    // 6. Tri
    if (sortBy === "vues") {
      list.sort((a, b) => b.vues - a.vues);
    } else if (sortBy === "alpha") {
      list.sort((a, b) => a.titre.localeCompare(b.titre));
    } else {
      list.sort((a, b) => a.id - b.id);
    }

    return list;
  }, [fiches, navCategory, search, avancement, sortBy]);

  // Nombre de cartes par page (9 cartes = grille équilibrée 3x3)
  const itemsPerPage = 9;
  const totalPages = Math.max(1, Math.ceil(combinedItems.length / itemsPerPage));
  const displayedItems = useMemo(() => {
    const start = (page - 1) * itemsPerPage;
    return combinedItems.slice(start, start + itemsPerPage);
  }, [combinedItems, page]);

  // Navigation clavier pour la modale Lightbox
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (!activeItem) return;
      if (e.key === "Escape") {
        setActiveItem(null);
      } else if (e.key === "ArrowLeft") {
        const idx = displayedItems.findIndex((m) => m.id === activeItem.id);
        if (idx > 0) {
          const prev = displayedItems[idx - 1];
          setActiveItem(prev);
        }
      } else if (e.key === "ArrowRight") {
        const idx = displayedItems.findIndex((m) => m.id === activeItem.id);
        if (idx < displayedItems.length - 1) {
          const next = displayedItems[idx + 1];
          setActiveItem(next);
        }
      }
    },
    [activeItem, displayedItems]
  );

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  return (
    <div className="bg-[#FAF7F2] min-h-screen text-[#24140D] font-sans antialiased selection:bg-[#C99A68]/30">
      {/* ================================================================= */}
      {/* 1. HERO CINÉMATIQUE DÉDIÉ — GALERIE DE L'INNOVATION CIAT          */}
      {/* Visuel 100% unique, haute définition et non utilisé ailleurs      */}
      {/* ================================================================= */}
      <section className="relative w-full h-[340px] sm:h-[400px] lg:h-[440px] overflow-hidden bg-[#24140D]">
        <Image
          src="/images/galerie/hero-galerie-innovations-unique.jpg"
          alt="Showroom technologique et galerie d'innovations du CIAT"
          fill
          priority
          sizes="100vw"
          className="object-cover object-center"
        />

        {/* Voile dégradé doux et chaleureux mettant en valeur la photo */}
        <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/45 to-transparent pointer-events-none" />

        {/* Contenu textuel noble et aligné sur la charte CIAT */}
        <div className="relative z-10 h-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col justify-center">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 mb-3">
              <span className="h-2 w-2 rounded-full bg-[#C99A68] animate-pulse" />
              <span className="text-xs font-bold tracking-[0.2em] text-[#F3CA9C] uppercase drop-shadow-sm">
                SHOWROOM TECHNOLOGIQUE & PROTOTYPES • CIAT DIAMNIADIO
              </span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-serif font-bold text-white tracking-tight leading-[1.12] drop-shadow-[0_2px_12px_rgba(0,0,0,0.6)]">
              Galerie de l&apos;Innovation
            </h1>

            <p className="mt-4 text-sm sm:text-base lg:text-lg text-white/95 max-w-2xl font-normal leading-relaxed drop-shadow-[0_1px_6px_rgba(0,0,0,0.6)]">
              Immersion photographique au cœur de nos espaces, de nos ateliers technologiques 4.0,
              de nos événements d&apos;émulation et de nos prototypes valorisés à l&apos;ISEP Amadou Trawaré.
            </p>

            <div className="mt-6 flex flex-wrap items-center gap-4">
              <Link
                href="/galerie/gestion"
                className="inline-flex items-center gap-2 rounded-xl bg-[#C99A68] hover:bg-[#D5A97A] px-5 py-2.5 text-xs font-bold text-[#24140D] transition-all shadow-md active:scale-95"
              >
                <span>Fiches Prototypes &amp; QR Code</span>
                <span>→</span>
              </Link>
              <div className="flex items-center gap-3 text-xs text-white/80 font-medium">
                <span className="inline-block h-1 w-1 rounded-full bg-[#C99A68]" />
                <span>28 Moments photographiques</span>
                <span className="inline-block h-1 w-1 rounded-full bg-[#C99A68]" />
                <span>30 Prototypes certifiés</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ================================================================= */}
      {/* BARRE DE NAVIGATION & CONTRÔLES ÉPURÉS                             */}
      {/* ================================================================= */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-4">
        {/* Bandeau d'erreur API si panne */}
        {error && (
          <ApiErrorBanner
            message={error}
            onRetry={() => fetchFiches({ search, domaine, cohorte, avancement, page: 1, pageSize: 50 })}
            className="mb-6"
          />
        )}

        {/* 1. Ligne des onglets par catégorie (Pills horizontaux élégants) */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 pb-4 border-b border-[#E8DFD3]">
          <nav aria-label="Catégories de la galerie" className="flex items-center gap-2 overflow-x-auto scrollbar-none py-1">
            {CATEGORIES_NAV.map((cat) => {
              const isActive = navCategory === cat;
              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => {
                    setNavCategory(cat);
                    setPage(1);
                  }}
                  className={`px-4 py-2 rounded-full text-xs font-semibold transition-all duration-200 shrink-0 cursor-pointer ${
                    isActive
                      ? "bg-[#612D10] text-white shadow-xs"
                      : "bg-white text-[#6B5A4E] hover:text-[#24140D] hover:bg-white/80 border border-[#E2D8CC]"
                  }`}
                >
                  {cat}
                </button>
              );
            })}
          </nav>

          {/* 2. Recherche rapide + Sélecteur de tri */}
          <div className="flex flex-wrap items-center gap-3 shrink-0">
            {/* Barre de recherche discrète */}
            <div className="relative min-w-[220px] sm:min-w-[260px]">
              <input
                type="text"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                placeholder="Rechercher une photo, un labo..."
                className="w-full rounded-full border border-[#D5C9BB] bg-white pl-9 pr-8 py-2 text-xs text-[#24140D] placeholder:text-[#9C8B7E] focus:border-[#612D10] focus:outline-none transition-colors"
              />
              <svg
                className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#9C8B7E]"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              {search && (
                <button
                  type="button"
                  onClick={() => {
                    setSearch("");
                    setPage(1);
                  }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-[#7A6A5E] hover:text-[#24140D]"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Tri */}
            <div className="flex items-center gap-1.5 rounded-full border border-[#D5C9BB] bg-white px-3 py-1.5 text-xs text-[#6B5A4E]">
              <label htmlFor="galerie-sort" className="text-[11px] font-medium text-[#7A6A5E]">
                Trier :
              </label>
              <select
                id="galerie-sort"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as "recents" | "vues" | "alpha")}
                className="bg-transparent font-semibold text-[#24140D] border-none p-0 focus:ring-0 cursor-pointer text-xs"
              >
                <option value="recents">Plus récents</option>
                <option value="vues">Plus consultés</option>
                <option value="alpha">Titre (A-Z)</option>
              </select>
            </div>

            {/* Bouton pour afficher les filtres TRL & Domaines */}
            <button
              type="button"
              onClick={() => setShowAdvancedFilters((prev) => !prev)}
              aria-label="Filtres avancés"
              className={`inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full border transition-all cursor-pointer ${
                showAdvancedFilters || hasActiveFilters
                  ? "bg-[#612D10] text-white border-[#612D10]"
                  : "bg-white text-[#612D10] border-[#D5C9BB] hover:bg-[#FAF7F2]"
              }`}
            >
              <span>{hasActiveFilters ? "Filtres actifs" : "Plus de filtres"}</span>
              <span className="text-[10px]">{showAdvancedFilters ? "▲" : "▼"}</span>
            </button>
          </div>
        </div>

        {/* 3. Volet escamotable pour les critères TRL & Cohortes */}
        {showAdvancedFilters && (
          <div className="mt-4 p-5 bg-white rounded-2xl border border-[#E8DFD3] shadow-xs transition-all">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label htmlFor="filter-domaine" className="block text-[11px] font-bold uppercase tracking-wider text-[#7A6A5E] mb-1.5">
                  Pôle technologique
                </label>
                <select
                  id="filter-domaine"
                  value={domaine}
                  onChange={(e) => {
                    setDomaine(e.target.value);
                    setPage(1);
                  }}
                  className="w-full rounded-xl border border-[#D5C9BB] bg-[#FAF7F2] px-3 py-2 text-xs text-[#24140D] focus:border-[#612D10] focus:outline-none"
                >
                  <option value="">Tous les domaines</option>
                  {domainesList.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.nom}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="filter-cohorte" className="block text-[11px] font-bold uppercase tracking-wider text-[#7A6A5E] mb-1.5">
                  Cohorte d&apos;incubation
                </label>
                <select
                  id="filter-cohorte"
                  value={cohorte}
                  onChange={(e) => {
                    setCohorte(e.target.value);
                    setPage(1);
                  }}
                  className="w-full rounded-xl border border-[#D5C9BB] bg-[#FAF7F2] px-3 py-2 text-xs text-[#24140D] focus:border-[#612D10] focus:outline-none"
                >
                  <option value="">Toutes les cohortes</option>
                  {cohortesList.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.nom}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="filter-avancement" className="block text-[11px] font-bold uppercase tracking-wider text-[#7A6A5E] mb-1.5">
                  Maturité TRL
                </label>
                <select
                  id="filter-avancement"
                  value={avancement}
                  onChange={(e) => {
                    setAvancement(e.target.value);
                    setPage(1);
                  }}
                  className="w-full rounded-xl border border-[#D5C9BB] bg-[#FAF7F2] px-3 py-2 text-xs text-[#24140D] focus:border-[#612D10] focus:outline-none"
                >
                  {AVANCEMENT_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {hasActiveFilters && (
              <div className="mt-4 pt-3 border-t border-[#E8DFD3] flex items-center justify-between text-xs">
                <span className="text-[#7A6A5E]">{combinedItems.length} résultat(s) trouvé(s)</span>
                <button
                  type="button"
                  onClick={handleResetFilters}
                  className="font-bold text-[#612D10] hover:text-[#C99A68] underline cursor-pointer"
                >
                  Réinitialiser tous les filtres
                </button>
              </div>
            )}
          </div>
        )}

        {/* Compteur discret de résultats */}
        <div className="mt-4 flex items-center justify-between text-xs text-[#7A6A5E]">
          <span>
            Affichage de <strong>{displayedItems.length > 0 ? (page - 1) * itemsPerPage + 1 : 0}</strong> à{" "}
            <strong>{Math.min(page * itemsPerPage, combinedItems.length)}</strong> sur{" "}
            <strong>{combinedItems.length}</strong> photographies
          </span>
          <span className="font-mono text-[11px] text-[#9C8B7E]">Page {page} sur {totalPages}</span>
        </div>
      </section>

      {/* ================================================================= */}
      {/* GRILLE PHOTOGRAPHIQUE ÉDITORIALE (3 COLONNES HAUTE DÉFINITION)   */}
      {/* ================================================================= */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-16">
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-7">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((i) => (
              <div key={i} className="rounded-2xl bg-white border border-[#E8DFD3] p-3 animate-pulse">
                <div className="aspect-[16/10] rounded-xl bg-[#EFE8DE]" />
                <div className="p-4 space-y-2">
                  <div className="h-4 w-3/4 rounded bg-[#EFE8DE]" />
                  <div className="h-3 w-1/2 rounded bg-[#EFE8DE]" />
                </div>
              </div>
            ))}
          </div>
        ) : displayedItems.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-[#D5C9BB] bg-white p-12 text-center shadow-xs">
            <p className="text-base font-bold text-[#24140D]">Aucune photographie ne correspond à vos critères</p>
            <p className="mt-2 text-xs text-[#7A6A5E]">
              Essayez de réinitialiser la recherche ou de sélectionner une autre catégorie.
            </p>
            <button
              onClick={handleResetFilters}
              type="button"
              className="mt-6 rounded-xl bg-[#612D10] text-white px-5 py-2.5 text-xs font-bold hover:bg-[#7D3A15] transition-colors cursor-pointer"
            >
              Réinitialiser les filtres
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-7 lg:gap-8">
            {displayedItems.map((item) => (
              <article
                key={`${item.isPrototype ? "p" : "m"}-${item.id}`}
                onClick={() => setActiveItem(item)}
                className="group flex flex-col bg-white rounded-2xl overflow-hidden border border-[#E8DFD3] hover:border-[#C99A68]/80 shadow-xs hover:shadow-xl transition-all duration-300 cursor-pointer"
              >
                {/* Zone Photographique */}
                <div className="relative aspect-[16/11] w-full overflow-hidden bg-[#24140D]">
                  <Image
                    src={item.photo}
                    alt={item.titre}
                    fill
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    className="object-cover object-center transition-transform duration-500 ease-out group-hover:scale-105"
                  />

                  {/* Badge de catégorie flottant en haut à gauche */}
                  <div className="absolute top-3.5 left-3.5 z-10">
                    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wider uppercase bg-white/95 backdrop-blur-xs text-[#612D10] shadow-xs border border-[#E8DFD3]/60">
                      {item.categorie}
                    </span>
                  </div>

                  {/* Indicateur d'agrandissement en haut à droite (effet hover subtil) */}
                  <div className="absolute top-3.5 right-3.5 z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                    <span className="h-7 w-7 rounded-full bg-[#612D10] text-white flex items-center justify-center text-xs font-bold shadow-md">
                      ↗
                    </span>
                  </div>

                  {/* Dégradé doux inférieur pour sublimer la photo */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-60 group-hover:opacity-40 transition-opacity" />
                </div>

                {/* Zone Description & Légende */}
                <div className="p-5 flex-1 flex flex-col justify-between">
                  <div>
                    <h2 className="text-base sm:text-lg font-serif font-bold text-[#24140D] group-hover:text-[#612D10] transition-colors line-clamp-1 leading-snug">
                      {item.titre}
                    </h2>
                    <p className="mt-1 text-xs text-[#6B5A4E] line-clamp-2 leading-relaxed">
                      {item.description}
                    </p>
                  </div>

                  {/* Pied de carte avec métadonnées */}
                  <div className="mt-4 pt-3 border-t border-[#F1E9DE] flex items-center justify-between text-[11px] text-[#8C7A6D]">
                    <span className="line-clamp-1 max-w-[70%]">
                      {item.lieu || "Campus Diamniadio"}
                    </span>
                    <span className="font-semibold text-[#612D10] group-hover:text-[#C99A68] transition-colors flex items-center gap-1">
                      Agrandir <span>↗</span>
                    </span>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}

        {/* =============================================================== */}
        {/* PAGINATION CENTRÉE & ÉPURÉE                                     */}
        {/* =============================================================== */}
        {totalPages > 1 && (
          <nav aria-label="Pagination de la galerie" className="mt-12 flex items-center justify-center gap-2">
            <button
              type="button"
              onClick={() => {
                setPage((p) => Math.max(1, p - 1));
                window.scrollTo({ top: 0, behavior: "smooth" });
              }}
              disabled={page <= 1}
              aria-label="Page précédente"
              className="px-4 py-2 rounded-xl border border-[#D5C9BB] bg-white text-xs font-bold text-[#612D10] hover:bg-[#FAF7F2] disabled:opacity-30 disabled:pointer-events-none transition-all cursor-pointer"
            >
              ← Précédent
            </button>

            <div className="flex items-center gap-1.5 px-2">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((pNum) => (
                <button
                  key={pNum}
                  type="button"
                  onClick={() => {
                    setPage(pNum);
                    window.scrollTo({ top: 0, behavior: "smooth" });
                  }}
                  className={`h-9 w-9 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    page === pNum
                      ? "bg-[#612D10] text-white shadow-xs"
                      : "bg-white text-[#6B5A4E] hover:bg-[#FAF7F2] border border-[#E2D8CC]"
                  }`}
                >
                  {pNum}
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={() => {
                setPage((p) => Math.min(totalPages, p + 1));
                window.scrollTo({ top: 0, behavior: "smooth" });
              }}
              disabled={page >= totalPages}
              aria-label="Page suivante"
              className="px-4 py-2 rounded-xl border border-[#D5C9BB] bg-white text-xs font-bold text-[#612D10] hover:bg-[#FAF7F2] disabled:opacity-30 disabled:pointer-events-none transition-all cursor-pointer"
            >
              Suivant →
            </button>
          </nav>
        )}
      </main>

      {/* ================================================================= */}
      {/* SECTION FINALE : BANDEAU PASSERELLE VERS LES PROTOTYPES HOMOLOGUÉS */}
      {/* ================================================================= */}
      <aside aria-label="Passerelle fiches prototypes" className="border-t border-[#E8DFD3] bg-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="rounded-2xl border border-[#E2D8CC] bg-[#FAF7F2] p-6 sm:p-8 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div className="max-w-2xl">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#612D10] bg-[#612D10]/10 px-2.5 py-1 rounded-full">
                Espace Porteurs & Évaluateurs
              </span>
              <h2 className="mt-2 text-xl sm:text-2xl font-serif font-bold text-[#24140D]">
                Consulter les fiches techniques d&apos;ingénierie & QR Codes
              </h2>
              <p className="mt-1.5 text-xs sm:text-sm text-[#6B5A4E] leading-relaxed">
                Accédez aux dossiers d&apos;homologation des prototypes du CIAT, aux niveaux de maturité TRL (1 à 8) et aux téléchargements PDF certifiés.
              </p>
            </div>
            <Link
              href="/galerie/gestion"
              className="shrink-0 inline-flex items-center justify-center rounded-xl bg-[#612D10] hover:bg-[#7D3A15] px-6 py-3.5 text-xs font-bold text-white shadow-xs transition-all active:scale-95"
            >
              Ouvrir l&apos;Espace Porteurs →
            </Link>
          </div>
        </div>
      </aside>

      {/* ================================================================= */}
      {/* MODALE LIGHTBOX EN HAUTE RÉSOLUTION                               */}
      {/* ================================================================= */}
      {activeItem && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4 sm:p-6 backdrop-blur-md"
          onClick={() => setActiveItem(null)}
        >
          <div
            className="relative max-w-4xl w-full bg-[#FAF7F2] rounded-3xl overflow-hidden shadow-2xl border border-white/20"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Bouton Fermer */}
            <button
              type="button"
              onClick={() => setActiveItem(null)}
              aria-label="Fermer la modale"
              className="absolute top-4 right-4 z-20 h-10 w-10 rounded-full bg-black/60 hover:bg-black text-white flex items-center justify-center transition-colors cursor-pointer"
            >
              ✕
            </button>

            {/* Grande Photographie HD */}
            <div className="relative aspect-[16/10] w-full bg-black">
              <Image
                src={activeItem.photo}
                alt={activeItem.titre}
                fill
                priority
                className="object-cover object-center"
              />
            </div>

            {/* Détails & Description */}
            <div className="p-6 sm:p-8">
              <div className="flex flex-wrap items-center justify-between gap-3 text-xs mb-3">
                <span className="font-bold text-[#612D10] uppercase tracking-wider bg-[#612D10]/10 px-3 py-1 rounded-full">
                  {activeItem.categorie}
                </span>
                <span className="text-[#7A6A5E] font-medium">
                  Statut : <strong>{activeItem.avancement}</strong>
                </span>
              </div>

              <h2 className="text-2xl sm:text-3xl font-extrabold text-[#24140D] font-serif">
                {activeItem.titre}
              </h2>

              <p className="mt-3 text-sm sm:text-base text-[#6B5A4E] leading-relaxed">
                {activeItem.description}
              </p>

              {activeItem.equipe && (
                <div className="mt-4 pt-3 border-t border-[#E8DFD3] text-xs text-[#7A6A5E] flex flex-wrap justify-between gap-2">
                  <span><strong>Équipe : </strong> {activeItem.equipe}</span>
                  {activeItem.lieu && <span><strong>Lieu : </strong> {activeItem.lieu}</span>}
                </div>
              )}

              <div className="mt-6 pt-4 border-t border-[#E8DFD3] flex items-center justify-between text-xs">
                {activeItem.isPrototype && activeItem.slug ? (
                  <Link
                    href={`/galerie/${activeItem.slug}`}
                    className="rounded-xl bg-[#612D10] text-white px-4 py-2 font-bold hover:bg-[#48210B] transition-colors"
                  >
                    Consulter la fiche complète & QR Code →
                  </Link>
                ) : (
                  <span className="text-[#8C7A6D] font-mono">Campus CIAT Diamniadio</span>
                )}

                <button
                  type="button"
                  onClick={() => setActiveItem(null)}
                  className="font-bold text-[#612D10] hover:underline cursor-pointer"
                >
                  Fermer [Échap]
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
