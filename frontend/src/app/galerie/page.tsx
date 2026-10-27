"use client";

import { useEffect, useState, useTransition, useMemo, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  ApiErrorBanner,
  Badge,
  Button,
} from "@/components/ui";
import {
  getDomainesOptions,
  getCohortesOptions,
  getFichesInnovation,
  type CohorteOption,
  type DomaineOption,
  type FicheInnovation,
  type GalleryFilterParams,
} from "@/lib/gallery-api";

// Mapping des photos réelles pour chaque fiche
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

// Moments institutionnels de la vie du CIAT
const CAMPUS_MOMENTS = [
  {
    id: 101,
    slug: "nos-espaces-coworking",
    titre: "Nos espaces de travail collaboratif",
    probleme: "Besoin d'espaces partagés modulaires pour réunir chercheurs, étudiants et entrepreneurs.",
    solution: "Open space moderne équipé, connexions haut débit et terrasses végétalisées.",
    equipe: "Direction des Espaces & Campus Diamniadio",
    avancement: "Opérationnel",
    categorie: "Espaces",
    photo: "/images/galerie_moments/nos-espaces.jpg",
    vues: 420,
    isMoment: true,
  },
  {
    id: 102,
    slug: "formation-metiers-numeriques",
    titre: "Formation professionnelle & Ateliers pratiques",
    probleme: "Adéquation des compétences techniques aux besoins industriels 4.0.",
    solution: "Parcours de formation certifiants en mécatronique, IoT et intelligence artificielle.",
    equipe: "Pôle Pédagogique ISEP Diamniadio",
    avancement: "En cours",
    categorie: "Formation",
    photo: "/images/galerie_moments/formation.jpg",
    vues: 388,
    isMoment: true,
  },
  {
    id: 103,
    slug: "vie-au-ciat-communaute-talents",
    titre: "Vie au CIAT & Synergies Féminines",
    probleme: "Valorisation des talents féminins dans les filières scientifiques et technologiques.",
    solution: "Mentorat actif, bourses d'excellence et projets de recherche dirigés par des ingénieures.",
    equipe: "Communauté Scientifique CIAT",
    avancement: "Actif",
    categorie: "Vie au CIAT",
    photo: "/images/galerie_moments/vie-au-ciat.jpg",
    vues: 512,
    isMoment: true,
  },
  {
    id: 104,
    slug: "evenements-conferences-restitution",
    titre: "Conférences, Salons & Restitutions Annuelles",
    probleme: "Visibilité des résultats de recherche appliquée auprès des investisseurs.",
    solution: "Événements trimestriels de présentation des prototypes et rencontres B2B.",
    equipe: "Pôle Partenariats & Communication",
    avancement: "Trimestriel",
    categorie: "Événements",
    photo: "/images/galerie_moments/evenements.jpg",
    vues: 640,
    isMoment: true,
  },
  {
    id: 105,
    slug: "espaces-atrium-et-rencontres",
    titre: "Atrium d'accueil & Hall Technologique",
    probleme: "Cadre d'accueil des délégations industrielles et des partenaires internationaux.",
    solution: "Architecture bioclimatique favorisant la lumière naturelle et la convivialité.",
    equipe: "Services Généraux Campus",
    avancement: "Opérationnel",
    categorie: "Espaces",
    photo: "/images/galerie_moments/espaces-travail.jpg",
    vues: 310,
    isMoment: true,
  },
  {
    id: 106,
    slug: "moments-institutionnels-accords",
    titre: "Signatures d'Accords & Partenariats Public-Privé",
    probleme: "Pérennisation des filières de transfert technologique vers les PME locales.",
    solution: "Conventions pluriannuelles signées avec les ministères et fédérations patronales.",
    equipe: "Comité de Direction ISEP-CIAT",
    avancement: "Certifié",
    categorie: "Événements",
    photo: "/images/galerie_moments/moments-institutionnels.jpg",
    vues: 445,
    isMoment: true,
  },
];

const CATEGORIES_NAV = [
  "Tous",
  "Projets & Innovations",
  "Espaces",
  "Événements",
  "Formation",
  "Vie au CIAT",
] as const;

type NavCategory = (typeof CATEGORIES_NAV)[number];

const AVANCEMENT_OPTIONS = [
  { value: "", label: "Tous les niveaux d'avancement" },
  { value: "Prototype", label: "Prototype fonctionnel (TRL 4-6)" },
  { value: "MVP", label: "MVP (Produit Minimum Viable)" },
  { value: "Pilote", label: "Pilote / Phase test terrain (TRL 7)" },
  { value: "Déploiement", label: "Déploiement industriel (TRL 8)" },
];

function getAvancementBadgeTone(avancement: string): "succes" | "alerte" | "info" | "neutre" {
  const norm = avancement.toLowerCase();
  if (norm.includes("déploiement") || norm.includes("deploiement") || norm.includes("opérationnel")) return "succes";
  if (norm.includes("pilote") || norm.includes("certifié")) return "succes";
  if (norm.includes("mvp") || norm.includes("en cours")) return "alerte";
  if (norm.includes("prototype")) return "info";
  return "neutre";
}

export default function GaleriePage() {
  const [, startTransition] = useTransition();

  // Navigation par catégorie principale (Maquette)
  const [navCategory, setNavCategory] = useState<NavCategory>("Tous");

  // Filtres détaillés restaurés
  const [search, setSearch] = useState("");
  const [domaine, setDomaine] = useState("");
  const [cohorte, setCohorte] = useState("");
  const [avancement, setAvancement] = useState("");
  const [sortBy, setSortBy] = useState<"recents" | "vues" | "alpha">("recents");
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

  // Fonction manuelle de rechargement (recherche)
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

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchFiches({ search, domaine, cohorte, avancement, page: 1, pageSize: 50 });
  };

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

  const hasActiveFilters = Boolean(search || domaine || cohorte || avancement || navCategory !== "Tous");

  // Fusion et filtrage unifié des éléments affichés
  const combinedItems = useMemo(() => {
    // 1. Adapter les fiches API
    const protoItems = fiches.map((f) => {
      const realPhoto =
        REAL_FICHE_PHOTOS[f.slug] ||
        f.medias?.find((m) => m.type === "photo")?.url ||
        "/images/galerie_moments/projets-robotique.jpg";

      return {
        id: f.id,
        slug: f.slug,
        titre: f.titre,
        probleme: f.probleme,
        solution: f.solution,
        equipe: f.equipe,
        avancement: f.avancement || "Prototype",
        categorie: "Projets & Innovations",
        photo: realPhoto,
        vues: f.vues,
        isPrototype: true,
        hasVideo: f.medias?.some((m) => m.type === "video"),
        hasDemo: f.medias?.some((m) => m.type === "demo"),
      };
    });

    // 2. Adapter les moments campus
    const momentItems = CAMPUS_MOMENTS.map((m) => ({
      id: m.id,
      slug: m.slug,
      titre: m.titre,
      probleme: m.probleme,
      solution: m.solution,
      equipe: m.equipe,
      avancement: m.avancement,
      categorie: m.categorie,
      photo: m.photo,
      vues: m.vues,
      isPrototype: false,
      hasVideo: false,
      hasDemo: false,
    }));

    // 3. Filtrer par catégorie d'onglet (Maquette)
    let list = [...protoItems, ...momentItems];

    if (navCategory === "Projets & Innovations") {
      list = protoItems;
    } else if (navCategory === "Espaces") {
      list = momentItems.filter((i) => i.categorie === "Espaces");
    } else if (navCategory === "Événements") {
      list = momentItems.filter((i) => i.categorie === "Événements");
    } else if (navCategory === "Formation") {
      list = momentItems.filter((i) => i.categorie === "Formation");
    } else if (navCategory === "Vie au CIAT") {
      list = momentItems.filter((i) => i.categorie === "Vie au CIAT");
    }

    // 4. Filtrer par texte (si non géré par API)
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (i) =>
          i.titre.toLowerCase().includes(q) ||
          i.probleme.toLowerCase().includes(q) ||
          i.solution.toLowerCase().includes(q) ||
          i.equipe.toLowerCase().includes(q)
      );
    }

    // 5. Filtrer par avancement
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

  // Pagination (9 par page conforme à la maquette 3x3)
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
            photo: prev.photo,
            categorie: prev.categorie,
            avancement: prev.avancement,
            description: prev.solution || prev.probleme,
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
            photo: next.photo,
            categorie: next.categorie,
            avancement: next.avancement,
            description: next.solution || next.probleme,
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
      {/* SECTION 1: HERO HEADER ÉDITORIAL (MAQUETTE OFFICIELLE)    */}
      {/* ========================================================= */}
      <section className="relative overflow-hidden pt-8 pb-12 lg:pt-12 lg:pb-16 border-b border-[#E8DFD3]/80">
        <div
          aria-hidden="true"
          className="absolute -left-20 top-1/2 -translate-y-1/2 w-[420px] h-[420px] rounded-full bg-[#EFE8DE]/60 blur-3xl pointer-events-none"
        />

        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
            {/* Colonne Gauche: Titre éditorial prestige */}
            <div className="lg:col-span-6 z-10">
              <div className="flex items-center gap-3 mb-6">
                <span className="text-xs font-bold tracking-[0.2em] text-[#612D10] uppercase">
                  GALERIE
                </span>
                <span className="h-[1.5px] w-12 bg-[#612D10]/40" />
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-[#24140D] font-serif leading-[1.1]">
                Nos moments,
                <br />
                <span className="text-[#612D10]">en images.</span>
              </h1>

              <p className="mt-6 text-base sm:text-lg text-[#6B5A4E] leading-relaxed max-w-xl">
                Découvrez en images la vie du CIAT : nos espaces, nos équipes,
                nos prototypes validés et l&apos;énergie qui anime notre écosystème
                d&apos;innovation à l&apos;ISEP Diamniadio.
              </p>

              <div className="mt-8 flex flex-wrap items-center gap-4">
                <a
                  href="#galerie-catalogue"
                  className="group inline-flex items-center gap-2 text-sm font-bold text-[#612D10] hover:text-[#24140D] transition-colors"
                >
                  <span className="underline underline-offset-4 decoration-[#612D10]/50 group-hover:decoration-[#24140D]">
                    Explorer la galerie
                  </span>
                  <span className="inline-block transition-transform duration-200 group-hover:translate-x-1">
                    →
                  </span>
                </a>

                <span className="text-[#D0C4B4]">•</span>

                <Link
                  href="/galerie/gestion"
                  className="text-xs font-semibold text-[#8C7A6D] hover:text-[#612D10] transition-colors"
                >
                  Espace Porteur & Fiches TRL →
                </Link>
              </div>
            </div>

            {/* Colonne Droite: Architecture arquée avec verbes flottants */}
            <div className="lg:col-span-6 relative">
              <div className="relative rounded-tl-[90px] sm:rounded-tl-[120px] rounded-br-[60px] sm:rounded-br-[80px] overflow-hidden shadow-2xl bg-[#E8DFD3] border-4 border-white aspect-[16/11]">
                <Image
                  src="/images/galerie_moments/hero-ciat-facade.jpg"
                  alt="Campus et Bâtiment Principal du CIAT à Diamniadio"
                  fill
                  priority
                  sizes="(max-width: 1024px) 100vw, 50vw"
                  className="object-cover object-center"
                />

                <div className="absolute inset-0 bg-gradient-to-tr from-black/20 via-transparent to-black/60 pointer-events-none" />

                {/* Mots-clés flottants en haut à droite */}
                <div className="absolute top-6 right-6 sm:top-8 sm:right-8 text-right pointer-events-none">
                  <p className="text-[11px] sm:text-xs font-bold uppercase tracking-[0.25em] text-white/95 leading-loose drop-shadow-md">
                    INNOVER
                    <br />
                    FORMER
                    <br />
                    ENTREPRENDRE
                    <br />
                    TRANSFÉRER
                  </p>
                </div>

                {/* Badge d'ancrage campus */}
                <div className="absolute bottom-4 left-4 sm:bottom-6 sm:left-6">
                  <span className="inline-flex items-center gap-2 rounded-full bg-black/60 px-3.5 py-1 text-[11px] font-semibold text-white backdrop-blur-md">
                    <span className="h-2 w-2 rounded-full bg-[#C99A68] animate-pulse" />
                    Campus ISEP Amadou Trawaré • Diamniadio
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================= */}
      {/* SECTION 2: FILTRES RESTAURÉS & NAVIGATION PAR ONGLETS     */}
      {/* ========================================================= */}
      <div id="galerie-catalogue" className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-8">
        {/* Bandeau d'erreur API si panne */}
        {error && (
          <ApiErrorBanner
            message={error}
            onRetry={() => fetchFiches({ search, domaine, cohorte, avancement, page: 1, pageSize: 50 })}
            className="mb-6"
          />
        )}

        {/* 1. Onglets Catégories Principaux (Conformes à la Maquette) */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-[#E0D7CC] pb-4 mb-6">
          <nav aria-label="Catégories principales" className="flex items-center gap-6 overflow-x-auto scrollbar-none py-1">
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
                  className={`text-sm tracking-wide transition-all duration-200 shrink-0 relative py-1 focus:outline-none ${
                    isActive
                      ? "font-bold text-[#24140D]"
                      : "font-medium text-[#7A6A5E] hover:text-[#24140D]"
                  }`}
                >
                  {cat}
                  {isActive && (
                    <span className="absolute -bottom-[17px] left-0 right-0 h-[2.5px] bg-[#612D10] rounded-full" />
                  )}
                </button>
              );
            })}
          </nav>

          {/* Sélecteur de tri rapide */}
          <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
            <label htmlFor="sort-select" className="text-xs text-[#7A6A5E] font-medium">
              Trier par
            </label>
            <select
              id="sort-select"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as "recents" | "vues" | "alpha")}
              className="text-xs font-semibold text-[#24140D] bg-transparent border-none py-1 pl-1 pr-6 focus:ring-0 cursor-pointer"
            >
              <option value="recents">Plus récents</option>
              <option value="vues">Plus consultés</option>
              <option value="alpha">Titre (A-Z)</option>
            </select>
          </div>
        </div>

        {/* 2. Barre de Recherche et Filtres Détaillés (LE FILTRE RESTAURÉ & AMÉLIORÉ) */}
        <section aria-label="Filtres détaillés de la galerie" className="mb-8 rounded-2xl border border-[#E0D7CC] bg-white p-5 shadow-xs">
          <form onSubmit={handleSearchSubmit} className="space-y-4">
            <div className="flex flex-col gap-3 sm:flex-row">
              {/* Champ de recherche */}
              <div className="relative flex-1">
                <input
                  type="text"
                  id="search-input"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Rechercher par mot-clé, prototype, défi, équipement ou équipe..."
                  className="w-full min-h-[44px] rounded-xl border border-[#D5C9BB] bg-white px-4 py-2.5 text-sm text-[#24140D] placeholder:text-[#9C8B7E] focus:border-[#612D10] focus:outline-none focus:ring-1 focus:ring-[#612D10]"
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

              {/* Bouton Rechercher */}
              <Button type="submit" variant="primary" className="shrink-0 rounded-xl px-5 bg-[#612D10] hover:bg-[#48210B] text-white">
                <svg className="mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                Rechercher
              </Button>
            </div>

            {/* Sélecteurs de filtres (Domaine, Cohorte, Avancement) */}
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 pt-2">
              {/* Domaine technologique */}
              <div>
                <label htmlFor="filter-domaine" className="mb-1 block text-xs font-bold uppercase tracking-wider text-[#7A6A5E]">
                  Pôle d&apos;intervention
                </label>
                <select
                  id="filter-domaine"
                  value={domaine}
                  onChange={(e) => {
                    setDomaine(e.target.value);
                    setPage(1);
                  }}
                  className="w-full min-h-[42px] rounded-xl border border-[#D5C9BB] bg-white px-3 py-2 text-xs text-[#24140D] focus:border-[#612D10] focus:outline-none focus:ring-1 focus:ring-[#612D10]"
                >
                  <option value="">Tous les domaines technologiques</option>
                  {domainesList.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.nom}
                    </option>
                  ))}
                </select>
              </div>

              {/* Cohorte */}
              <div>
                <label htmlFor="filter-cohorte" className="mb-1 block text-xs font-bold uppercase tracking-wider text-[#7A6A5E]">
                  Cohorte d&apos;incubation
                </label>
                <select
                  id="filter-cohorte"
                  value={cohorte}
                  onChange={(e) => {
                    setCohorte(e.target.value);
                    setPage(1);
                  }}
                  className="w-full min-h-[42px] rounded-xl border border-[#D5C9BB] bg-white px-3 py-2 text-xs text-[#24140D] focus:border-[#612D10] focus:outline-none focus:ring-1 focus:ring-[#612D10]"
                >
                  <option value="">Toutes les cohortes</option>
                  {cohortesList.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.nom}
                    </option>
                  ))}
                </select>
              </div>

              {/* Avancement / TRL */}
              <div>
                <label htmlFor="filter-avancement" className="mb-1 block text-xs font-bold uppercase tracking-wider text-[#7A6A5E]">
                  Niveau d&apos;avancement TRL
                </label>
                <select
                  id="filter-avancement"
                  value={avancement}
                  onChange={(e) => {
                    setAvancement(e.target.value);
                    setPage(1);
                  }}
                  className="w-full min-h-[42px] rounded-xl border border-[#D5C9BB] bg-white px-3 py-2 text-xs text-[#24140D] focus:border-[#612D10] focus:outline-none focus:ring-1 focus:ring-[#612D10]"
                >
                  {AVANCEMENT_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Réinitialisation active */}
            {hasActiveFilters && (
              <div className="flex items-center justify-between border-t border-[#E8DFD3] pt-3 text-xs">
                <span className="text-[#7A6A5E] font-medium">Filtres actifs appliqués</span>
                <button
                  type="button"
                  onClick={handleResetFilters}
                  className="font-bold text-[#612D10] underline transition hover:text-[#C99A68]"
                >
                  Réinitialiser tous les filtres
                </button>
              </div>
            )}
          </form>
        </section>

        {/* Compteur de résultats vérifiable */}
        <div className="mb-6 flex items-center justify-between">
          <p className="text-sm font-semibold text-[#24140D]">
            {loading
              ? "Actualisation de la galerie en cours..."
              : combinedItems.length === 0
              ? "Aucun résultat trouvé"
              : combinedItems.length === 1
              ? "1 élément affiché"
              : `${combinedItems.length} éléments affichés`}
          </p>
          <div className="flex items-center gap-2">
            <span className="inline-block h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs text-[#7A6A5E] font-semibold">Contenu certifié CIAT Diamniadio</span>
          </div>
        </div>
      </div>

      {/* ========================================================= */}
      {/* SECTION 3: GRILLE 3x3 VRAIES PHOTOS + PAGINATION VERTICALE */}
      {/* ========================================================= */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pb-16">
        {loading ? (
          /* Squelettes de chargement */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="aspect-[4/3] rounded-2xl bg-[#EFE8DE] animate-pulse" />
            ))}
          </div>
        ) : displayedItems.length === 0 ? (
          /* État vide */
          <div className="rounded-2xl border border-dashed border-[#D5C9BB] bg-white p-12 text-center shadow-xs">
            <p className="text-base font-bold text-[#24140D]">Aucun élément ne correspond aux filtres</p>
            <p className="mt-2 text-xs text-[#7A6A5E]">
              Essayez de réinitialiser la recherche ou de choisir un autre domaine technologique.
            </p>
            <Button onClick={handleResetFilters} variant="secondary" className="mt-6 text-xs font-bold">
              Réinitialiser la recherche
            </Button>
          </div>
        ) : (
          <div className="relative flex gap-6 lg:gap-8 items-start">
            {/* Grille Principale 3x3 */}
            <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {displayedItems.map((item) => (
                <article
                  key={`${item.isPrototype ? "p" : "m"}-${item.id}`}
                  onClick={() =>
                    setActiveItem({
                      id: item.id,
                      titre: item.titre,
                      photo: item.photo,
                      categorie: item.categorie,
                      avancement: item.avancement,
                      description: item.solution || item.probleme,
                      equipe: item.equipe,
                      slug: item.slug,
                      isPrototype: item.isPrototype,
                    })
                  }
                  className="group relative aspect-[4/3] rounded-2xl overflow-hidden shadow-xs hover:shadow-xl transition-all duration-300 cursor-pointer bg-[#EFE8DE] hover:-translate-y-1"
                >
                  {/* Vraie Photographie HD */}
                  <Image
                    src={item.photo}
                    alt={item.titre}
                    fill
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    className="object-cover object-center transition-transform duration-500 ease-out group-hover:scale-105"
                  />

                  {/* Dégradé sombre inférieur de la maquette */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/35 to-transparent transition-opacity duration-300" />

                  {/* Badges Flottants Supérieurs */}
                  <div className="absolute top-3 inset-x-3 flex items-center justify-between pointer-events-none z-10">
                    <Badge tone={getAvancementBadgeTone(item.avancement)}>
                      {item.avancement}
                    </Badge>
                    <span className="rounded-md bg-black/60 px-2 py-0.5 font-mono text-[11px] font-bold text-white backdrop-blur-xs">
                      #{item.id}
                    </span>
                  </div>

                  {/* Badges Vidéo / Démo si présents */}
                  <div className="absolute bottom-16 right-3 flex items-center gap-1.5 z-10">
                    {item.hasVideo && (
                      <span className="inline-flex h-6 items-center gap-1 rounded-md bg-[#24140D]/85 px-2 text-[10px] font-bold text-white backdrop-blur-xs">
                        Vidéo
                      </span>
                    )}
                    {item.hasDemo && (
                      <span className="inline-flex h-6 items-center gap-1 rounded-md bg-[#C99A68] px-2 text-[10px] font-bold text-[#24140D] backdrop-blur-xs">
                        Démo
                      </span>
                    )}
                  </div>

                  {/* Typographie blanche en pied d'image conforme à la maquette */}
                  <div className="absolute bottom-0 inset-x-0 p-5 flex items-end justify-between gap-3 text-white z-10">
                    <div className="max-w-[85%]">
                      <h3 className="line-clamp-1 text-base sm:text-lg font-bold text-white tracking-tight drop-shadow-sm font-title leading-snug">
                        {item.titre}
                      </h3>
                      <p className="mt-0.5 line-clamp-1 text-xs text-white/80 font-medium tracking-wide flex items-center gap-1 group-hover:text-[#C99A68] transition-colors">
                        {item.isPrototype ? "Consulter la fiche & QR Code →" : `${item.categorie} • Le CIAT en images →`}
                      </p>
                    </div>

                    <span className="shrink-0 h-7 w-7 rounded-full bg-white/10 group-hover:bg-[#C99A68] flex items-center justify-center text-white group-hover:text-[#24140D] transition-colors text-xs font-bold backdrop-blur-xs">
                      →
                    </span>
                  </div>
                </article>
              ))}
            </div>

            {/* Pagination Verticale (Signature Maquette) */}
            <aside aria-label="Pagination verticale" className="hidden lg:flex flex-col items-center gap-3 shrink-0 pt-2 select-none">
              <span className="font-mono text-xs font-bold text-[#612D10]">
                {String(page).padStart(2, "0")} <span className="text-[#AFA496]">/</span>{" "}
                <span className="text-[#AFA496]">{String(totalPages).padStart(2, "0")}</span>
              </span>

              <div className="w-[2px] h-32 bg-[#E2D8CC] rounded-full relative overflow-hidden">
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
              className="rounded-xl border border-[#D5C9BB] bg-white px-4 py-2 text-xs font-bold text-brun disabled:opacity-30"
            >
              ← Précédent
            </button>
            <span className="text-xs font-semibold text-brun font-mono px-2">
              Page {page} sur {totalPages}
            </span>
            <button
              type="button"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="rounded-xl border border-[#D5C9BB] bg-white px-4 py-2 text-xs font-bold text-brun disabled:opacity-30"
            >
              Suivant →
            </button>
          </div>
        )}
      </section>

      {/* ========================================================= */}
      {/* SECTION 4: PASSERELLE INSTITUTIONNELLE & GESTION          */}
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
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4 sm:p-6 backdrop-blur-md animate-fadeIn"
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
