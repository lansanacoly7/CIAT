"use client";

import { useEffect, useState, useTransition, useMemo, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import { ApiErrorBanner, Button } from "@/components/ui";
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

// Moments clés du CIAT conformes à la maquette
const CAMPUS_MOMENTS = [
  {
    id: 1,
    slug: "nos-espaces",
    titre: "Nos espaces",
    sousTitre: "Le CIAT en images",
    description: "Des espaces de coworking modulaires, des terrasses végétalisées et des laboratoires équipés au cœur de la Cité du Savoir.",
    equipe: "Direction des Espaces & Campus Diamniadio",
    avancement: "Opérationnel",
    categorie: "Espaces",
    photo: "/images/galerie_moments/nos-espaces.jpg",
    vues: 840,
    isMoment: true,
  },
  {
    id: 2,
    slug: "formation-metiers-futur",
    titre: "Formation",
    sousTitre: "Des compétences pour demain",
    description: "Ateliers pratiques, certifications techniques et accompagnement immersif en mécatronique, IoT et intelligence artificielle.",
    equipe: "Pôle Pédagogique ISEP Amadou Trawaré",
    avancement: "En continu",
    categorie: "Formation",
    photo: "/images/galerie_moments/formation.jpg",
    vues: 720,
    isMoment: true,
  },
  {
    id: 3,
    slug: "vie-au-ciat",
    titre: "Vie au CIAT",
    sousTitre: "Une communauté engagée",
    description: "Une communauté scientifique et entrepreneuriale dynamique, valorisant les talents féminins et les synergies pluridisciplinaires.",
    equipe: "Communauté Scientifique & Étudiante",
    avancement: "Actif",
    categorie: "Vie au CIAT",
    photo: "/images/galerie_moments/vie-au-ciat.jpg",
    vues: 950,
    isMoment: true,
  },
  {
    id: 4,
    slug: "evenements-rencontres",
    titre: "Événements",
    sousTitre: "Des rencontres qui inspirent",
    description: "Restitutions annuelles, journées portes ouvertes, salons de l'innovation et démonstrations en direct des prototypes.",
    equipe: "Pôle Partenariats & Événements",
    avancement: "Trimestriel",
    categorie: "Événements",
    photo: "/images/galerie_moments/evenements.jpg",
    vues: 890,
    isMoment: true,
  },
  {
    id: 5,
    slug: "projets-innovation",
    titre: "Projets",
    sousTitre: "Des idées qui prennent vie",
    description: "Conception, assemblage et validation fonctionnelle de prototypes mécatroniques et de systèmes automatisés sur mesure.",
    equipe: "Laboratoire de Prototypage CIAT",
    avancement: "Prototype",
    categorie: "Projets",
    photo: "/images/galerie_moments/projets-robotique.jpg",
    vues: 1040,
    isMoment: true,
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
    isMoment: true,
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
    isMoment: true,
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
    isMoment: true,
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
    isMoment: true,
  },
  // Éléments supplémentaires pour la pagination (Pages 2 & 3)
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
    isMoment: true,
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
    isMoment: true,
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
    isMoment: true,
  },
  {
    id: 13,
    slug: "realite-virtuelle-simulateurs",
    titre: "Immersion Réalité Virtuelle",
    sousTitre: "Simulateurs d'ateliers techniques",
    description: "Casques VR et jumeaux numériques pour former les techniciens aux gestes professionnels à haute technicité.",
    equipe: "Laboratoire Numérique ISEP",
    avancement: "Déploiement",
    categorie: "Formation",
    photo: "/images/galerie_moments/realite-virtuelle-isep.jpg",
    vues: 730,
    isMoment: true,
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
    isMoment: true,
  },
  {
    id: 15,
    slug: "serre-hydroponique-urbaine",
    titre: "AgriTech & Serres",
    sousTitre: "Irrigation raisonnée et capteurs IoT",
    description: "Modèles de culture hydroponique et pilotage automatisé de la fertilisation pour le climat sahélien.",
    equipe: "Filière Bio-Industries CIAT",
    avancement: "Prototype",
    categorie: "Projets",
    photo: "/images/galerie_moments/hydroponie-serre.jpg",
    vues: 890,
    isMoment: true,
  },
  {
    id: 16,
    slug: "drones-telemetrie-agricole",
    titre: "Télémétrie & Drones",
    sousTitre: "Surveillance et cartographie aérienne",
    description: "Drones équipés de caméras multispectrales pour l'analyse de la santé des cultures et la détection hydrique.",
    equipe: "Unité Robotique & Drones",
    avancement: "Pilote",
    categorie: "Projets",
    photo: "/images/galerie_moments/drone-field-test.jpg",
    vues: 770,
    isMoment: true,
  },
  {
    id: 17,
    slug: "visites-officielles-campus",
    titre: "Accueil & Rayonnement",
    sousTitre: "Délégations nationales et internationales",
    description: "Présentation des résultats de recherche aux délégations ministérielles et aux institutions partenaires.",
    equipe: "Relations Extérieures CIAT",
    avancement: "Régulier",
    categorie: "Vie au CIAT",
    photo: "/images/galerie_moments/visite-campus-isep.jpg",
    vues: 590,
    isMoment: true,
  },
  {
    id: 18,
    slug: "remise-certificats-laureats",
    titre: "Cérémonies de Remise",
    sousTitre: "Célébration des lauréats et diplômés",
    description: "Remise officielle des parchemins aux cohortes d'entrepreneurs formés et incubés au CIAT.",
    equipe: "Direction Pédagogique ISEP",
    avancement: "Célébration",
    categorie: "Formation",
    photo: "/images/galerie_moments/remise-certificats.jpg",
    vues: 810,
    isMoment: true,
  },
];

const CATEGORIES_NAV = [
  "Tous",
  "Espaces",
  "Événements",
  "Formation",
  "Projets",
  "Vie au CIAT",
] as const;

type NavCategory = (typeof CATEGORIES_NAV)[number];

const AVANCEMENT_OPTIONS = [
  { value: "", label: "Tous les niveaux TRL" },
  { value: "Prototype", label: "Prototype fonctionnel (TRL 4-6)" },
  { value: "MVP", label: "MVP (Produit Minimum Viable)" },
  { value: "Pilote", label: "Pilote terrain (TRL 7)" },
  { value: "Déploiement", label: "Déploiement industriel (TRL 8)" },
];

export default function GaleriePage() {
  const [, startTransition] = useTransition();

  // Navigation par catégorie principale (Maquette officielle)
  const [navCategory, setNavCategory] = useState<NavCategory>("Tous");

  // Filtres détaillés & recherche
  const [search, setSearch] = useState("");
  const [domaine, setDomaine] = useState("");
  const [cohorte, setCohorte] = useState("");
  const [avancement, setAvancement] = useState("");
  const [sortBy, setSortBy] = useState<"recents" | "vues" | "alpha">("recents");
  const [showFilters, setShowFilters] = useState(false);
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

  // Fonction de rechargement API
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
        setError("La galerie des innovations est momentanément indisponible. Réessayez plus tard.");
        setFiches([]);
        setLoading(false);
      });
  }, []);

  // Synchronisation avec les filtres
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
          setError("La galerie des innovations est momentanément indisponible. Réessayez plus tard.");
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
        id: f.id,
        slug: f.slug,
        titre: f.titre,
        sousTitre: f.avancement ? `${f.avancement} • Fiche technique` : "Innovation CIAT",
        description: f.solution || f.probleme,
        equipe: f.equipe,
        avancement: f.avancement || "Prototype",
        categorie: "Projets",
        photo: realPhoto,
        vues: f.vues,
        isPrototype: true,
      };
    });

    // 2. Adapter les moments campus du CIAT
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
      isPrototype: boolean;
    }> = [];

    if (navCategory === "Tous") {
      // Pour l'onglet "Tous", afficher en priorité les 9 moments phares de la maquette
      list = [...momentItems, ...protoItems];
    } else if (navCategory === "Espaces") {
      list = momentItems.filter((i) => i.categorie === "Espaces");
    } else if (navCategory === "Événements") {
      list = momentItems.filter((i) => i.categorie === "Événements");
    } else if (navCategory === "Formation") {
      list = momentItems.filter((i) => i.categorie === "Formation");
    } else if (navCategory === "Projets") {
      const momentProjets = momentItems.filter((i) => i.categorie === "Projets");
      list = [...momentProjets, ...protoItems];
    } else if (navCategory === "Vie au CIAT") {
      list = momentItems.filter((i) => i.categorie === "Vie au CIAT");
    }

    // 4. Filtrer par texte (recherche)
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (i) =>
          i.titre.toLowerCase().includes(q) ||
          i.sousTitre.toLowerCase().includes(q) ||
          i.description.toLowerCase().includes(q) ||
          i.equipe.toLowerCase().includes(q)
      );
    }

    // 5. Filtrer par niveau d'avancement
    if (avancement) {
      list = list.filter((i) => i.avancement.toLowerCase().includes(avancement.toLowerCase()));
    }

    // 6. Tri
    if (sortBy === "vues") {
      list.sort((a, b) => b.vues - a.vues);
    } else if (sortBy === "alpha") {
      list.sort((a, b) => a.titre.localeCompare(b.titre));
    } else {
      list.sort((a, b) => b.id - a.id);
    }

    return list;
  }, [fiches, navCategory, search, avancement, sortBy]);

  // Pagination (9 cartes par page = format 3x3 strict de la maquette)
  const itemsPerPage = 9;
  const totalPages = Math.max(1, Math.ceil(combinedItems.length / itemsPerPage));
  const displayedItems = useMemo(() => {
    const start = (page - 1) * itemsPerPage;
    return combinedItems.slice(start, start + itemsPerPage);
  }, [combinedItems, page]);

  // Clavier pour la modale
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (!activeItem) return;
      if (e.key === "Escape") {
        setActiveItem(null);
      } else if (e.key === "ArrowLeft") {
        const idx = displayedItems.findIndex((m) => m.id === activeItem.id);
        if (idx > 0) {
          const prev = displayedItems[idx - 1];
          setActiveItem({
            id: prev.id,
            titre: prev.titre,
            sousTitre: prev.sousTitre,
            photo: prev.photo,
            categorie: prev.categorie,
            avancement: prev.avancement,
            description: prev.description,
            equipe: prev.equipe,
            slug: prev.slug,
            isPrototype: prev.isPrototype,
          });
        }
      } else if (e.key === "ArrowRight") {
        const idx = displayedItems.findIndex((m) => m.id === activeItem.id);
        if (idx < displayedItems.length - 1) {
          const next = displayedItems[idx + 1];
          setActiveItem({
            id: next.id,
            titre: next.titre,
            sousTitre: next.sousTitre,
            photo: next.photo,
            categorie: next.categorie,
            avancement: next.avancement,
            description: next.description,
            equipe: next.equipe,
            slug: next.slug,
            isPrototype: next.isPrototype,
          });
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
      {/* ========================================================= */}
      {/* SECTION 1: HERO BANNER CINÉMATIQUE PLEIN ÉCRAN            */}
      {/* ========================================================= */}
      <section className="relative w-full h-[360px] sm:h-[420px] lg:h-[460px] overflow-hidden bg-[#24140D]">
        <Image
          src="/images/ciat-header-panoramique.jpg"
          alt="Galerie et Campus du Centre d'Innovation et d'Accélération Technologique (CIAT) à Diamniadio"
          fill
          priority
          sizes="100vw"
          className="object-cover object-center"
        />

        {/* Dégradé doux et contrasté conforme aux standards du site */}
        <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/70 to-black/35 pointer-events-none" />

        {/* Contenu textuel noble & épuré */}
        <div className="relative z-10 h-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col justify-center">
          <div className="inline-flex items-center gap-2.5 mb-4">
            <span className="h-2 w-2 rounded-full bg-[#C99A68] animate-pulse" />
            <span className="text-xs font-bold tracking-[0.25em] text-[#C99A68] uppercase">
              GALERIE OFFICIELLE • ÉCOSYSTÈME CIAT 360
            </span>
          </div>

          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-normal text-white tracking-tight leading-[1.08] font-serif max-w-3xl">
            Nos moments,{" "}
            <span className="italic text-[#C99A68]">en images.</span>
          </h1>

          <p className="mt-4 text-sm sm:text-base lg:text-lg text-white/90 max-w-2xl leading-relaxed font-normal">
            Découvrez en images la vie du CIAT : nos ateliers technologiques, nos équipes
            de chercheurs et d&apos;étudiants, nos événements et l&apos;énergie qui anime notre écosystème
            d&apos;innovation à l&apos;ISEP Amadou Trawaré de Diamniadio.
          </p>

          <div className="mt-6 flex flex-wrap items-center gap-4 sm:gap-6 text-xs text-white/80 font-medium">
            <a
              href="#galerie-catalogue"
              className="inline-flex items-center gap-2 rounded-xl bg-[#612D10] hover:bg-[#7D3A15] px-5 py-2.5 text-xs font-bold text-white shadow-md transition-all active:scale-95 border border-[#C99A68]/40"
            >
              Explorer les réalisations
              <span>↓</span>
            </a>
            <span className="hidden sm:inline text-white/40">•</span>
            <span className="hidden sm:inline">9 Sélections phares</span>
            <span className="hidden sm:inline text-white/40">•</span>
            <span className="hidden sm:inline">+50 Prototypes documentés</span>
            <span className="hidden sm:inline text-white/40">•</span>
            <span className="hidden sm:inline">Cité du Savoir, Diamniadio</span>
          </div>
        </div>
      </section>

      {/* ========================================================= */}
      {/* SECTION 2: BARRE D'ONGLETS SANS CADRE LOURD (MAQUETTE)     */}
      {/* ========================================================= */}
      <div id="galerie-catalogue" className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-4">
        {/* Bandeau d'erreur API si panne */}
        {error && (
          <ApiErrorBanner
            message={error}
            onRetry={() => fetchFiches({ search, domaine, cohorte, avancement, page: 1, pageSize: 50 })}
            className="mb-6"
          />
        )}

        {/* 1. Barre d'onglets épurée directement sur le fond sable */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-[#E0D7CC] pb-3 mb-6">
          <nav aria-label="Catégories principales" className="flex items-center gap-6 sm:gap-8 overflow-x-auto scrollbar-none py-1">
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
                  className={`text-sm tracking-wide transition-all duration-200 shrink-0 relative py-1 focus:outline-none cursor-pointer ${
                    isActive
                      ? "font-bold text-[#612D10]"
                      : "font-normal text-[#6B5A4E] hover:text-[#24140D]"
                  }`}
                >
                  {cat}
                  {isActive && (
                    <span className="absolute -bottom-[13px] left-0 right-0 h-[2px] bg-[#612D10]" />
                  )}
                </button>
              );
            })}
          </nav>

          {/* Droite: Sélecteur de tri + Bouton filtre discret */}
          <div className="flex items-center gap-4 shrink-0 self-end sm:self-auto">
            <div className="flex items-center gap-1.5">
              <label htmlFor="sort-select" className="text-xs text-[#7A6A5E] font-medium">
                Trier par
              </label>
              <select
                id="sort-select"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as "recents" | "vues" | "alpha")}
                className="text-xs font-semibold text-[#24140D] bg-transparent border-none py-1 pl-1 pr-4 focus:ring-0 cursor-pointer"
              >
                <option value="recents">Plus récents</option>
                <option value="vues">Plus consultés</option>
                <option value="alpha">Titre (A-Z)</option>
              </select>
            </div>

            {/* Bouton pour ouvrir les filtres de recherche / TRL */}
            <button
              type="button"
              onClick={() => setShowFilters((prev) => !prev)}
              aria-label="Recherche et filtres TRL"
              className={`inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg border transition-all ${
                showFilters || hasActiveFilters
                  ? "bg-[#612D10] text-white border-[#612D10]"
                  : "bg-white/80 text-[#612D10] border-[#D5C9BB] hover:bg-white"
              }`}
            >
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <span>{hasActiveFilters ? "Filtres actifs" : "Filtrer"}</span>
            </button>
          </div>
        </div>

        {/* 2. Tiroir escamotable pour la recherche & filtres TRL (ne pollue pas la vue par défaut) */}
        {showFilters && (
          <section aria-label="Recherche et filtres détaillés" className="mb-8 rounded-2xl border border-[#E0D7CC] bg-white p-5 shadow-xs transition-all">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                setPage(1);
                fetchFiches({ search, domaine, cohorte, avancement, page: 1, pageSize: 50 });
              }}
              className="space-y-4"
            >
              <div className="flex flex-col gap-3 sm:flex-row">
                <div className="relative flex-1">
                  <input
                    type="text"
                    id="search-input"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Rechercher par mot-clé, prototype, défi ou équipement..."
                    className="w-full min-h-[42px] rounded-xl border border-[#D5C9BB] bg-white px-4 py-2 text-xs sm:text-sm text-[#24140D] placeholder:text-[#9C8B7E] focus:border-[#612D10] focus:outline-none focus:ring-1 focus:ring-[#612D10]"
                  />
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

                <Button type="submit" variant="primary" className="shrink-0 rounded-xl px-4 text-xs font-bold bg-[#612D10] hover:bg-[#48210B] text-white">
                  Rechercher
                </Button>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 pt-2">
                <div>
                  <label htmlFor="filter-domaine" className="mb-1 block text-[11px] font-bold uppercase tracking-wider text-[#7A6A5E]">
                    Pôle technologique
                  </label>
                  <select
                    id="filter-domaine"
                    value={domaine}
                    onChange={(e) => {
                      setDomaine(e.target.value);
                      setPage(1);
                    }}
                    className="w-full min-h-[40px] rounded-xl border border-[#D5C9BB] bg-white px-3 py-1.5 text-xs text-[#24140D] focus:border-[#612D10] focus:outline-none"
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
                  <label htmlFor="filter-cohorte" className="mb-1 block text-[11px] font-bold uppercase tracking-wider text-[#7A6A5E]">
                    Cohorte
                  </label>
                  <select
                    id="filter-cohorte"
                    value={cohorte}
                    onChange={(e) => {
                      setCohorte(e.target.value);
                      setPage(1);
                    }}
                    className="w-full min-h-[40px] rounded-xl border border-[#D5C9BB] bg-white px-3 py-1.5 text-xs text-[#24140D] focus:border-[#612D10] focus:outline-none"
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
                  <label htmlFor="filter-avancement" className="mb-1 block text-[11px] font-bold uppercase tracking-wider text-[#7A6A5E]">
                    Maturité TRL
                  </label>
                  <select
                    id="filter-avancement"
                    value={avancement}
                    onChange={(e) => {
                      setAvancement(e.target.value);
                      setPage(1);
                    }}
                    className="w-full min-h-[40px] rounded-xl border border-[#D5C9BB] bg-white px-3 py-1.5 text-xs text-[#24140D] focus:border-[#612D10] focus:outline-none"
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
                <div className="flex items-center justify-between border-t border-[#E8DFD3] pt-3 text-xs">
                  <span className="text-[#7A6A5E]">Filtres actifs appliqués</span>
                  <button
                    type="button"
                    onClick={handleResetFilters}
                    className="font-bold text-[#612D10] underline transition hover:text-[#C99A68]"
                  >
                    Réinitialiser
                  </button>
                </div>
              )}
            </form>
          </section>
        )}
      </div>

      {/* ========================================================= */}
      {/* SECTION 3: GRILLE 3x3 CARTES PHOTOS + PAGINATION VERTICALE */}
      {/* ========================================================= */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pb-16">
        {loading ? (
          /* Squelettes de chargement */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((i) => (
              <div key={i} className="aspect-[4/3] rounded-2xl bg-[#EFE8DE] animate-pulse" />
            ))}
          </div>
        ) : displayedItems.length === 0 ? (
          /* État vide */
          <div className="rounded-2xl border border-dashed border-[#D5C9BB] bg-white p-12 text-center shadow-xs">
            <p className="text-base font-bold text-[#24140D]">Aucun élément ne correspond aux critères</p>
            <p className="mt-2 text-xs text-[#7A6A5E]">
              Essayez de réinitialiser la recherche ou de sélectionner un autre onglet.
            </p>
            <Button onClick={handleResetFilters} variant="secondary" className="mt-6 text-xs font-bold">
              Réinitialiser
            </Button>
          </div>
        ) : (
          <div className="relative flex gap-6 lg:gap-8 items-start">
            {/* Grille Principale 3x3 fidèle à la maquette */}
            <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {displayedItems.map((item) => (
                <article
                  key={`${item.isPrototype ? "p" : "m"}-${item.id}`}
                  onClick={() =>
                    setActiveItem({
                      id: item.id,
                      titre: item.titre,
                      sousTitre: item.sousTitre,
                      photo: item.photo,
                      categorie: item.categorie,
                      avancement: item.avancement,
                      description: item.description,
                      equipe: item.equipe,
                      slug: item.slug,
                      isPrototype: item.isPrototype,
                    })
                  }
                  className="group relative aspect-[4/3] rounded-2xl overflow-hidden shadow-xs hover:shadow-xl transition-all duration-300 cursor-pointer bg-[#24140D]"
                >
                  {/* Photographie HD */}
                  <Image
                    src={item.photo}
                    alt={item.titre}
                    fill
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    className="object-cover object-center transition-transform duration-500 ease-out group-hover:scale-105"
                  />

                  {/* Dégradé sombre inférieur de la maquette */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent transition-opacity duration-300" />

                  {/* Typographie blanche en pied d'image conforme à la maquette */}
                  <div className="absolute bottom-0 inset-x-0 p-5 flex items-end justify-between gap-3 text-white z-10">
                    <div className="max-w-[85%]">
                      <h3 className="line-clamp-1 text-base sm:text-lg font-bold text-white tracking-tight drop-shadow-sm font-serif leading-snug">
                        {item.titre}
                      </h3>
                      <p className="mt-0.5 line-clamp-1 text-xs text-white/80 font-normal tracking-wide flex items-center gap-1 group-hover:text-[#C99A68] transition-colors">
                        {item.sousTitre}
                      </p>
                    </div>

                    <span className="shrink-0 text-white/90 group-hover:text-[#C99A68] transition-colors text-sm font-bold">
                      →
                    </span>
                  </div>
                </article>
              ))}
            </div>

            {/* Pagination Verticale Signature Maquette (01 / 03 avec slider fin et boutons ronds) */}
            <aside aria-label="Pagination verticale" className="hidden lg:flex flex-col items-center gap-3 shrink-0 pt-2 select-none">
              <span className="font-mono text-xs font-bold text-[#612D10]">
                {String(page).padStart(2, "0")} <span className="text-[#AFA496]">/</span>{" "}
                <span className="text-[#AFA496]">{String(totalPages).padStart(2, "0")}</span>
              </span>

              <div className="w-[1.5px] h-32 bg-[#E2D8CC] rounded-full relative overflow-hidden">
                <div
                  className="absolute top-0 w-full bg-[#612D10] transition-all duration-300 rounded-full"
                  style={{
                    height: `${(page / totalPages) * 100}%`,
                  }}
                />
              </div>

              <div className="flex flex-col gap-1.5 pt-1">
                <button
                  type="button"
                  onClick={() => {
                    setPage((p) => Math.max(1, p - 1));
                    const target = document.getElementById("galerie-catalogue");
                    if (target) target.scrollIntoView({ behavior: "smooth" });
                  }}
                  disabled={page <= 1}
                  aria-label="Page précédente"
                  className="h-7 w-7 rounded-full border border-[#D5C9BB] bg-white flex items-center justify-center text-xs font-bold text-[#612D10] hover:bg-[#FAF7F2] hover:border-[#612D10] disabled:opacity-30 disabled:pointer-events-none transition-all shadow-2xs"
                >
                  ⌃
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setPage((p) => Math.min(totalPages, p + 1));
                    const target = document.getElementById("galerie-catalogue");
                    if (target) target.scrollIntoView({ behavior: "smooth" });
                  }}
                  disabled={page >= totalPages}
                  aria-label="Page suivante"
                  className="h-7 w-7 rounded-full border border-[#D5C9BB] bg-white flex items-center justify-center text-xs font-bold text-[#612D10] hover:bg-[#FAF7F2] hover:border-[#612D10] disabled:opacity-30 disabled:pointer-events-none transition-all shadow-2xs"
                >
                  ⌄
                </button>
              </div>
            </aside>
          </div>
        )}

        {/* Pagination Mobile */}
        {totalPages > 1 && (
          <div className="mt-10 lg:hidden flex items-center justify-center gap-3">
            <button
              type="button"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="rounded-xl border border-[#D5C9BB] bg-white px-4 py-2 text-xs font-bold text-[#612D10] disabled:opacity-30"
            >
              ← Précédent
            </button>
            <span className="text-xs font-semibold text-[#24140D] font-mono px-2">
              Page {page} / {totalPages}
            </span>
            <button
              type="button"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="rounded-xl border border-[#D5C9BB] bg-white px-4 py-2 text-xs font-bold text-[#612D10] disabled:opacity-30"
            >
              Suivant →
            </button>
          </div>
        )}
      </section>

      {/* ========================================================= */}
      {/* SECTION 4: PASSERELLE GESTION & HOMOLOGATION              */}
      {/* ========================================================= */}
      <section className="bg-white py-12 border-t border-[#E8DFD3]">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="rounded-2xl bg-gradient-to-r from-[#24140D] to-[#3B1E12] text-white p-8 sm:p-10 flex flex-col md:flex-row items-center justify-between gap-6 shadow-md">
            <div>
              <span className="inline-block rounded-md bg-[#C99A68]/20 px-3 py-1 text-xs font-bold text-[#C99A68] uppercase tracking-wider mb-2">
                Ingénierie & Propriété Industrielle
              </span>
              <h2 className="text-2xl sm:text-3xl font-bold font-serif">
                Consulter l&apos;Espace Porteurs & Homologation QR Code
              </h2>
              <p className="mt-2 text-sm text-white/80 max-w-2xl leading-relaxed">
                Retrouvez les fiches techniques d&apos;ingénierie, fiches PDF téléchargeables et QR codes
                officiels certifiant les prototypes du CIAT ISEP Diamniadio.
              </p>
            </div>
            <Link
              href="/galerie/gestion"
              className="shrink-0 rounded-xl bg-[#C99A68] px-6 py-3.5 text-xs font-extrabold text-[#24140D] hover:bg-[#d8ab79] transition-all shadow-md text-center"
            >
              Espace Porteur & Gestion →
            </Link>
          </div>
        </div>
      </section>

      {/* ========================================================= */}
      {/* MODALE LIGHTBOX EN HAUTE RÉSOLUTION                       */}
      {/* ========================================================= */}
      {activeItem && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4 sm:p-6 backdrop-blur-md"
          onClick={() => setActiveItem(null)}
        >
          <div
            className="relative max-w-4xl w-full bg-[#FAF7F2] rounded-3xl overflow-hidden shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Bouton Fermer */}
            <button
              type="button"
              onClick={() => setActiveItem(null)}
              aria-label="Fermer la modale"
              className="absolute top-4 right-4 z-20 h-10 w-10 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-black transition-colors"
            >
              ✕
            </button>

            {/* Grande Photographie HD */}
            <div className="relative aspect-[16/10] w-full bg-black">
              <Image
                src={activeItem.photo}
                alt={activeItem.titre}
                fill
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
                <div className="mt-4 pt-3 border-t border-[#E8DFD3] text-xs text-[#7A6A5E]">
                  <strong>Équipe porteuse : </strong> {activeItem.equipe}
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
                  className="font-bold text-[#612D10] hover:underline"
                >
                  Fermer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
