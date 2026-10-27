"use client";

import { useState, useTransition, useMemo, useEffect, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";

interface GalleryMoment {
  id: number;
  slug: string;
  title: string;
  subtitle: string;
  category: "Espaces" | "Événements" | "Formation" | "Projets" | "Vie au CIAT";
  imageUrl: string;
  description: string;
  date: string;
  location: string;
  page: number; // 1, 2, 3
}

// Données riches des moments photographiques du CIAT (27 moments réels)
const GALLERY_MOMENTS: GalleryMoment[] = [
  // ================= PAGE 1 (Les 9 cartes exactes de la maquette) =================
  {
    id: 1,
    slug: "nos-espaces-coworking",
    title: "Nos espaces",
    subtitle: "Le CIAT en images →",
    category: "Espaces",
    imageUrl: "/images/galerie_moments/nos-espaces.jpg",
    description: "Open space collaboratif et pôle de travail partagé doté d'équipements numériques de pointe et d'un environnement végétalisé propice à la créativité.",
    date: "Octobre 2024",
    location: "Bâtiment Central • Campus Diamniadio",
    page: 1,
  },
  {
    id: 2,
    slug: "formation-competences",
    title: "Formation",
    subtitle: "Des compétences pour demain →",
    category: "Formation",
    imageUrl: "/images/galerie_moments/formation.jpg",
    description: "Session de travail appliquée réunissant les apprenants de l'ISEP Amadou Trawaré sur le développement de solutions logicielles et d'architectures IoT.",
    date: "Septembre 2024",
    location: "Laboratoire Informatique & Données",
    page: 1,
  },
  {
    id: 3,
    slug: "vie-au-ciat-communaute",
    title: "Vie au CIAT",
    subtitle: "Une communauté engagée →",
    category: "Vie au CIAT",
    imageUrl: "/images/galerie_moments/vie-au-ciat.jpg",
    description: "Concentration et synergie au quotidien : nos chercheuses, innovatrices et ingénieures façonnent les technologies africaines de demain.",
    date: "Août 2024",
    location: "Espace Recherche & Innovation",
    page: 1,
  },
  {
    id: 4,
    slug: "evenements-rencontres",
    title: "Événements",
    subtitle: "Des rencontres qui inspirent →",
    category: "Événements",
    imageUrl: "/images/galerie_moments/evenements.jpg",
    description: "Conférence plénière et restitution des travaux de prototypage devant un parterre d'industriels, d'institutionnels et d'investisseurs partenaires.",
    date: "Juillet 2024",
    location: "Amphithéâtre ISEP Diamniadio",
    page: 1,
  },
  {
    id: 5,
    slug: "projets-robotique-stem",
    title: "Projets",
    subtitle: "Des idées qui prennent vie →",
    category: "Projets",
    imageUrl: "/images/galerie_moments/projets-robotique.jpg",
    description: "Prototype fonctionnel de rover modulaire pédagogique RoboSen, conçu et usiné au FabLab CIAT pour l'initiation technique des lycées professionnels.",
    date: "Juin 2024",
    location: "Atelier Prototypage Rapide & Robotique",
    page: 1,
  },
  {
    id: 6,
    slug: "espaces-de-travail-atrium",
    title: "Espaces de travail",
    subtitle: "Un cadre propice à l'innovation →",
    category: "Espaces",
    imageUrl: "/images/galerie_moments/espaces-travail.jpg",
    description: "Atrium lumineux et salons de réflexion ouverts pour les échanges informels, le mentorat et les rencontres de partenariats technologiques.",
    date: "Mai 2024",
    location: "Atrium Nord • CIAT Diamniadio",
    page: 1,
  },
  {
    id: 7,
    slug: "incubation-talents",
    title: "Incubation",
    subtitle: "Accompagner les talents →",
    category: "Vie au CIAT",
    imageUrl: "/images/galerie_moments/incubation.jpg",
    description: "Atelier de co-conception réunissant les porteurs de projets incubés et les mentors industriels pour optimiser le passage de l'idée au prototype TRL 6.",
    date: "Avril 2024",
    location: "Salles de Mentorat Stratégique",
    page: 1,
  },
  {
    id: 8,
    slug: "inauguration-vision-avenir",
    title: "Inauguration",
    subtitle: "Le CIAT, une vision pour l'avenir →",
    category: "Événements",
    imageUrl: "/images/galerie_moments/inauguration.jpg",
    description: "L'identité architecturale et la vision du Centre d'Innovation, d'Application et de Transfert ancrée au cœur du pôle technologique de Diamniadio.",
    date: "Mars 2024",
    location: "Campus ISEP Amadou Trawaré",
    page: 1,
  },
  {
    id: 9,
    slug: "moments-institutionnels",
    title: "Moments institutionnels",
    subtitle: "Une dynamique collective →",
    category: "Événements",
    imageUrl: "/images/galerie_moments/moments-institutionnels.jpg",
    description: "Signature d'accords-cadres et conventionnements bilatéraux avec les partenaires du secteur productif et de la recherche internationale.",
    date: "Février 2024",
    location: "Salon d'Honneur du Conseil d'Administration",
    page: 1,
  },

  // ================= PAGE 2 =================
  {
    id: 10,
    slug: "fablab-machines-outils",
    title: "FabLab 4.0",
    subtitle: "Usinage & Prototypage CNC →",
    category: "Espaces",
    imageUrl: "/images/galerie_moments/fablab-prototypage.jpg",
    description: "Parc machines du CIAT comprenant des fraiseuses CNC 5 axes, découpeuses laser industrielles et bancs d'essais mécaniques pour l'agroalimentaire.",
    date: "Janvier 2024",
    location: "Atelier Mécanique Lourde",
    page: 2,
  },
  {
    id: 11,
    slug: "hackathon-ia-diamniadio",
    title: "Hackathon IA",
    subtitle: "48h d'idéation intensive →",
    category: "Formation",
    imageUrl: "/images/galerie_moments/hackathon-sprint.jpg",
    description: "Marathon de code et d'ingénierie logicielle mobilisant plus de 80 jeunes talents autour de l'intelligence artificielle appliquée à l'agriculture.",
    date: "Décembre 2023",
    location: "Halle Centrale du CIAT",
    page: 2,
  },
  {
    id: 12,
    slug: "drone-agricole-tests",
    title: "Drone Maraîcher",
    subtitle: "Vols d'essais dans les Niayes →",
    category: "Projets",
    imageUrl: "/images/galerie_moments/drone-field-test.jpg",
    description: "Campagne de vols tests du drone multispectral CIAT pour la cartographie des parcelles et la détection précoce du stress hydrique des cultures.",
    date: "Novembre 2023",
    location: "Parcelles Pilotes Niayes",
    page: 2,
  },
  {
    id: 13,
    slug: "energie-solaire-toiture",
    title: "Centrale Solaire",
    subtitle: "Énergie verte & autonomie →",
    category: "Espaces",
    imageUrl: "/images/galerie_moments/solaire-campus.jpg",
    description: "Installation photovoltaïque de démonstration alimentant le laboratoire CIAT et servant de banc d'essai pour le mini-réseau SunuGrid.",
    date: "Octobre 2023",
    location: "Toiture Technique Bâtiment B",
    page: 2,
  },
  {
    id: 14,
    slug: "biopharmacie-recherche",
    title: "BioPharma Diaraf",
    subtitle: "Principes actifs locaux →",
    category: "Projets",
    imageUrl: "/images/galerie_moments/biopharma-lab.jpg",
    description: "Laboratoire de phyto-chimie dédié à l'extraction standardisée d'Artemisia et à la formulation galénique de solutions antiseptiques résilientes.",
    date: "Septembre 2023",
    location: "Pôle Santé & Biomédical",
    page: 2,
  },
  {
    id: 15,
    slug: "forum-national-innovation",
    title: "Salon de l'Innovation",
    subtitle: "Présentation des prototypes →",
    category: "Événements",
    imageUrl: "/images/galerie_moments/forum-innovation.jpg",
    description: "Stand institutionnel CIAT accueillant délégations ministérielles, chambres de commerce et fédérations d'entreprises du Sénégal.",
    date: "Août 2023",
    location: "Centre des Expositions Diamniadio",
    page: 2,
  },
  {
    id: 16,
    slug: "remise-des-diplomes",
    title: "Certification TRL",
    subtitle: "Validation des prototypes →",
    category: "Formation",
    imageUrl: "/images/galerie_moments/remise-certificats.jpg",
    description: "Cérémonie de certification des projets ayant franchi avec succès le jalon TRL 6 (prototype validé en conditions opérationnelles réelles).",
    date: "Juillet 2023",
    location: "Salle d'Apparat ISEP",
    page: 2,
  },
  {
    id: 17,
    slug: "usinage-pieces-rechange",
    title: "Usinage CNC Local",
    subtitle: "Souveraineté industrielle →",
    category: "Projets",
    imageUrl: "/images/galerie_moments/usinage-mecanique.jpg",
    description: "Fabrication de pièces de rechange critiques en acier alimentaire pour les coopératives maraîchères et transformateurs locaux de la région.",
    date: "Juin 2023",
    location: "Atelier Tournage & Fraisage CNC",
    page: 2,
  },
  {
    id: 18,
    slug: "pitch-comite-investissement",
    title: "Demo Day CIAT",
    subtitle: "Accès au financement →",
    category: "Vie au CIAT",
    imageUrl: "/images/galerie_moments/pitch-startups.jpg",
    description: "Séance de pitch devant la DER/FJ, le FONSIS et les business angels régionaux pour le déploiement commercial des spin-offs technologiques.",
    date: "Mai 2023",
    location: "Auditorium Partenaires",
    page: 2,
  },

  // ================= PAGE 3 =================
  {
    id: 19,
    slug: "brainstorming-design-thinking",
    title: "Design Thinking",
    subtitle: "Cadrage centré utilisateur →",
    category: "Formation",
    imageUrl: "/images/galerie_moments/brainstorming-design.jpg",
    description: "Atelier méthodologique d'idéation et cartographie des besoins usagers pour les services publics communaux et la gestion des marchés urbains.",
    date: "Avril 2023",
    location: "Salle d'Innovation Créative",
    page: 3,
  },
  {
    id: 20,
    slug: "hydroponie-serre-pilote",
    title: "Serre Hydroponique",
    subtitle: "Agriculture urbaine résiliente →",
    category: "Projets",
    imageUrl: "/images/galerie_moments/hydroponie-serre.jpg",
    description: "Système expérimental de culture hydroponique verticale sans sol à circuit fermé, réduisant de 90 % l'empreinte en eau des cultures maraîchères.",
    date: "Mars 2023",
    location: "Rooftop Ferme Solaire CIAT",
    page: 3,
  },
  {
    id: 21,
    slug: "realite-virtuelle-soudure",
    title: "Simulateur VR",
    subtitle: "Formation technique immersive →",
    category: "Formation",
    imageUrl: "/images/galerie_moments/realite-virtuelle-isep.jpg",
    description: "Apprentissage sécurisé du geste professionnel de chaudronnerie et soudure à l'arc grâce aux casques de réalité virtuelle avec retour haptique.",
    date: "Février 2023",
    location: "Laboratoire Pédagogique Immersif",
    page: 3,
  },
  {
    id: 22,
    slug: "valise-telediag-brousse",
    title: "TeleDiag Rufisque",
    subtitle: "Télémédecine en zone rurale →",
    category: "Projets",
    imageUrl: "/images/galerie_moments/sante-diagnostic-brousse.jpg",
    description: "Valise étanche de diagnostic clinique équipée de capteurs physiologiques communicants pour les postes de santé isolés.",
    date: "Janvier 2023",
    location: "Poste de Santé Pilote",
    page: 3,
  },
  {
    id: 23,
    slug: "collaboration-equipes",
    title: "Synergies d'Équipes",
    subtitle: "Interdisciplinarité au service du pays →",
    category: "Vie au CIAT",
    imageUrl: "/images/galerie_moments/collaboration-numerique.jpg",
    description: "Ingénieurs électroniciens, agronomes et développeurs unissent leurs forces quotidiennes pour résoudre les défis concrets du Sénégal.",
    date: "Décembre 2022",
    location: "Hub d'Ingénierie Conjointe",
    page: 3,
  },
  {
    id: 24,
    slug: "visite-campus-isep-delegation",
    title: "Accueil Campus",
    subtitle: "Rayonnement international →",
    category: "Événements",
    imageUrl: "/images/galerie_moments/visite-campus-isep.jpg",
    description: "Visite guidée des ateliers pour les délégations internationales d'Afrique de l'Ouest étudiant le modèle de transfert d'ingénierie de l'ISEP.",
    date: "Novembre 2022",
    location: "Esplanade Principale ISEP Diamniadio",
    page: 3,
  },
  {
    id: 25,
    slug: "partenariat-entreprises",
    title: "Alliance Industrielle",
    subtitle: "Co-développement technologique →",
    category: "Événements",
    imageUrl: "/images/galerie_moments/partenariat-international.jpg",
    description: "Rencontre trimestrielle du comité de transfert technologique avec les représentants du patronat sénégalais et des PME innovantes.",
    date: "Octobre 2022",
    location: "Salle des Conférences",
    page: 3,
  },
  {
    id: 26,
    slug: "irrigation-goutte-a-goutte",
    title: "SmartIrrig Saloum",
    subtitle: "Micro-irrigation autonome →",
    category: "Projets",
    imageUrl: "/images/galerie_moments/irrigation-intelligente.jpg",
    description: "Station de pilotage automatisée des vannes d'irrigation connectée au réseau LoRaWAN du bassin arachidier.",
    date: "Septembre 2022",
    location: "Périmètre Maraîcher Expérimental",
    page: 3,
  },
  {
    id: 27,
    slug: "microgrid-solaire-stockage",
    title: "SunuGrid Pilote",
    subtitle: "Smart metering décentralisé →",
    category: "Projets",
    imageUrl: "/images/galerie_moments/smart-microgrid.jpg",
    description: "Banc de batteries lithium et onduleurs intelligents gérant la distribution d'énergie en circuit court avec micro-paiement mobile.",
    date: "Août 2022",
    location: "Laboratoire Électrotechnique",
    page: 3,
  },
];

const CATEGORIES = ["Tous", "Espaces", "Événements", "Formation", "Projets", "Vie au CIAT"] as const;
type CategoryType = (typeof CATEGORIES)[number];

export default function GaleriePage() {
  const [, startTransition] = useTransition();

  // Filtre et Tri
  const [selectedCategory, setSelectedCategory] = useState<CategoryType>("Tous");
  const [sortBy, setSortBy] = useState<"recents" | "anciens" | "alpha">("recents");
  const [currentPage, setCurrentPage] = useState<number>(1);
  const totalPages = 3;

  // Modal Lightbox
  const [activeMoment, setActiveMoment] = useState<GalleryMoment | null>(null);

  // Filtrage et Tri des moments
  const filteredMoments = useMemo(() => {
    let list = GALLERY_MOMENTS.filter((m) => {
      if (selectedCategory === "Tous") return true;
      return m.category === selectedCategory;
    });

    if (sortBy === "recents") {
      list = [...list].sort((a, b) => b.id - a.id);
    } else if (sortBy === "anciens") {
      list = [...list].sort((a, b) => a.id - b.id);
    } else if (sortBy === "alpha") {
      list = [...list].sort((a, b) => a.title.localeCompare(b.title));
    }

    return list;
  }, [selectedCategory, sortBy]);

  // Pagination (9 par page si Tous, sinon calcul dynamique)
  const itemsPerPage = 9;
  const displayedMoments = useMemo(() => {
    if (selectedCategory === "Tous") {
      return filteredMoments.filter((m) => m.page === currentPage);
    }
    const start = (currentPage - 1) * itemsPerPage;
    return filteredMoments.slice(start, start + itemsPerPage);
  }, [filteredMoments, selectedCategory, currentPage]);

  const maxPages = useMemo(() => {
    if (selectedCategory === "Tous") return totalPages;
    return Math.max(1, Math.ceil(filteredMoments.length / itemsPerPage));
  }, [filteredMoments.length, selectedCategory]);

  const handleCategoryChange = (cat: CategoryType) => {
    startTransition(() => {
      setSelectedCategory(cat);
      setCurrentPage(1);
    });
  };

  const handlePrevPage = () => {
    setCurrentPage((p) => Math.max(1, p - 1));
    const target = document.getElementById("moments-grid");
    if (target) target.scrollIntoView({ behavior: "smooth" });
  };

  const handleNextPage = () => {
    setCurrentPage((p) => Math.min(maxPages, p + 1));
    const target = document.getElementById("moments-grid");
    if (target) target.scrollIntoView({ behavior: "smooth" });
  };

  // Clavier pour la modale
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (!activeMoment) return;
      if (e.key === "Escape") {
        setActiveMoment(null);
      } else if (e.key === "ArrowLeft") {
        const idx = displayedMoments.findIndex((m) => m.id === activeMoment.id);
        if (idx > 0) setActiveMoment(displayedMoments[idx - 1]);
      } else if (e.key === "ArrowRight") {
        const idx = displayedMoments.findIndex((m) => m.id === activeMoment.id);
        if (idx < displayedMoments.length - 1) setActiveMoment(displayedMoments[idx + 1]);
      }
    },
    [activeMoment, displayedMoments]
  );

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  return (
    <div className="bg-[#FAF7F2] min-h-screen text-[#24140D] font-sans antialiased selection:bg-[#C99A68]/30">
      {/* ========================================================= */}
      {/* SECTION 1: HERO HEADER CONFORME À LA MAQUETTE             */}
      {/* ========================================================= */}
      <section className="relative overflow-hidden pt-8 pb-14 lg:pt-12 lg:pb-20 border-b border-[#E8DFD3]/80">
        {/* Forme organique douce en arrière-plan (fond de sable) */}
        <div
          aria-hidden="true"
          className="absolute -left-20 top-1/2 -translate-y-1/2 w-[420px] h-[420px] rounded-full bg-[#EFE8DE]/60 blur-3xl pointer-events-none"
        />

        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
            {/* Colonne Gauche: Titre, Accroche et Bouton */}
            <div className="lg:col-span-6 z-10">
              {/* Tag GALERIE avec tiret stylisé */}
              <div className="flex items-center gap-3 mb-6">
                <span className="text-xs font-bold tracking-[0.2em] text-[#612D10] uppercase">
                  GALERIE
                </span>
                <span className="h-[1.5px] w-12 bg-[#612D10]/40" />
              </div>

              {/* Titre éditorial prestige */}
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-[#24140D] font-serif leading-[1.1]">
                Nos moments,
                <br />
                <span className="text-[#612D10]">en images.</span>
              </h1>

              {/* Paragraphe d'introduction fidèle */}
              <p className="mt-6 text-base sm:text-lg text-[#6B5A4E] leading-relaxed max-w-xl">
                Découvrez en images la vie du CIAT : nos espaces, nos équipes,
                nos événements et l&apos;énergie qui anime notre écosystème
                d&apos;innovation.
              </p>

              {/* Bouton Explorer la galerie */}
              <div className="mt-8 flex items-center gap-4">
                <a
                  href="#moments-grid"
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
                  Espace Porteurs & Gestion →
                </Link>
              </div>
            </div>

            {/* Colonne Droite: Image Architecture Arquée avec Verbes Flottants */}
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

                {/* Dégradé supérieur droit pour détacher la typographie flottante */}
                <div className="absolute inset-0 bg-gradient-to-tr from-black/20 via-transparent to-black/60 pointer-events-none" />

                {/* Texte Flottant en haut à droite conforme à la maquette */}
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

                {/* Badge d'ancrage campus en bas à gauche */}
                <div className="absolute bottom-4 left-4 sm:bottom-6 sm:left-6">
                  <span className="inline-flex items-center gap-2 rounded-full bg-black/60 px-3.5 py-1 text-[11px] font-semibold text-white backdrop-blur-md">
                    <span className="h-2 w-2 rounded-full bg-[#C99A68] animate-pulse" />
                    Campus ISEP Diamniadio
                  </span>
                </div>
              </div>

              {/* Forme décorative courbée sous l'image */}
              <div
                aria-hidden="true"
                className="absolute -bottom-6 -right-6 w-32 h-32 rounded-full bg-[#C99A68]/20 -z-10 blur-xl pointer-events-none"
              />
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================= */}
      {/* SECTION 2: FILTRES PAR CATÉGORIES & TRI                   */}
      {/* ========================================================= */}
      <section id="moments-grid" className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-10 pb-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-[#E0D7CC]/80 pb-4">
          {/* Onglets Filtres (Gauche) */}
          <nav aria-label="Catégories de la galerie" className="flex items-center gap-6 overflow-x-auto scrollbar-none py-1">
            {CATEGORIES.map((cat) => {
              const isActive = selectedCategory === cat;
              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => handleCategoryChange(cat)}
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

          {/* Tri par (Droite) */}
          <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
            <label htmlFor="sort-moments" className="text-xs text-[#7A6A5E] font-medium">
              Trier par
            </label>
            <select
              id="sort-moments"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as "recents" | "anciens" | "alpha")}
              className="text-xs font-semibold text-[#24140D] bg-transparent border-none py-1 pl-1 pr-6 focus:ring-0 cursor-pointer"
            >
              <option value="recents">Plus récents</option>
              <option value="anciens">Plus anciens</option>
              <option value="alpha">Titre (A-Z)</option>
            </select>
          </div>
        </div>
      </section>

      {/* ========================================================= */}
      {/* SECTION 3: GRILLE DES PHOTOS 3x3 AVEC INDICATEUR DROIT   */}
      {/* ========================================================= */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pb-16">
        <div className="relative flex gap-6 lg:gap-8 items-start">
          {/* Grille principale des photos */}
          <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {displayedMoments.map((moment) => (
              <div
                key={moment.id}
                onClick={() => setActiveMoment(moment)}
                className="group relative aspect-[4/3] rounded-2xl overflow-hidden shadow-xs hover:shadow-xl transition-all duration-300 cursor-pointer bg-[#EFE8DE] hover:-translate-y-1"
              >
                {/* Photographie Réelle Plein Format */}
                <Image
                  src={moment.imageUrl}
                  alt={moment.title}
                  fill
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                  className="object-cover object-center transition-transform duration-500 ease-out group-hover:scale-105"
                />

                {/* Dégradé sombre inférieur conforme à la maquette */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/35 to-transparent transition-opacity duration-300" />

                {/* Contenu textuel sur l'image */}
                <div className="absolute bottom-0 inset-x-0 p-5 flex items-end justify-between gap-3 text-white">
                  <div>
                    <h3 className="text-lg font-bold text-white tracking-tight drop-shadow-sm font-title leading-snug">
                      {moment.title}
                    </h3>
                    <p className="mt-0.5 text-xs text-white/80 font-medium tracking-wide flex items-center gap-1 group-hover:text-[#C99A68] transition-colors">
                      {moment.subtitle}
                    </p>
                  </div>

                  {/* Flèche d'action discrète */}
                  <span className="shrink-0 h-7 w-7 rounded-full bg-white/10 group-hover:bg-[#C99A68] flex items-center justify-center text-white group-hover:text-[#24140D] transition-colors text-xs font-bold backdrop-blur-xs">
                    →
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* ===================================================== */}
          {/* INDICATEUR VERTICAL DE PAGINATION (Signature Maquette) */}
          {/* ===================================================== */}
          <aside aria-label="Pagination verticale" className="hidden lg:flex flex-col items-center gap-3 shrink-0 pt-2 select-none">
            {/* Compteur 01 / 03 */}
            <span className="font-mono text-xs font-bold text-[#612D10]">
              {String(currentPage).padStart(2, "0")} <span className="text-[#AFA496]">/</span>{" "}
              <span className="text-[#AFA496]">{String(maxPages).padStart(2, "0")}</span>
            </span>

            {/* Piste verticale de progression */}
            <div className="w-[2px] h-32 bg-[#E2D8CC] rounded-full relative overflow-hidden">
              <div
                className="absolute top-0 w-full bg-[#612D10] transition-all duration-300 rounded-full"
                style={{
                  height: `${(currentPage / maxPages) * 100}%`,
                }}
              />
            </div>

            {/* Boutons flèches Haut / Bas */}
            <div className="flex flex-col gap-1.5 pt-1">
              <button
                type="button"
                onClick={handlePrevPage}
                disabled={currentPage <= 1}
                aria-label="Page précédente"
                className="h-7 w-7 rounded-full border border-[#D5C9BB] bg-white flex items-center justify-center text-xs font-bold text-[#612D10] hover:bg-[#FAF7F2] hover:border-[#612D10] disabled:opacity-30 disabled:pointer-events-none transition-all shadow-2xs"
              >
                ⌃
              </button>
              <button
                type="button"
                onClick={handleNextPage}
                disabled={currentPage >= maxPages}
                aria-label="Page suivante"
                className="h-7 w-7 rounded-full border border-[#D5C9BB] bg-white flex items-center justify-center text-xs font-bold text-[#612D10] hover:bg-[#FAF7F2] hover:border-[#612D10] disabled:opacity-30 disabled:pointer-events-none transition-all shadow-2xs"
              >
                ⌄
              </button>
            </div>
          </aside>
        </div>

        {/* Pagination Mobile & Accessible */}
        <div className="mt-10 lg:hidden flex items-center justify-center gap-3">
          <button
            type="button"
            onClick={handlePrevPage}
            disabled={currentPage <= 1}
            className="rounded-xl border border-[#D5C9BB] bg-white px-4 py-2 text-xs font-bold text-brun disabled:opacity-30"
          >
            ← Précédent
          </button>
          <span className="text-xs font-semibold text-brun font-mono px-2">
            Page {currentPage} sur {maxPages}
          </span>
          <button
            type="button"
            onClick={handleNextPage}
            disabled={currentPage >= maxPages}
            className="rounded-xl border border-[#D5C9BB] bg-white px-4 py-2 text-xs font-bold text-brun disabled:opacity-30"
          >
            Suivant →
          </button>
        </div>
      </section>

      {/* ========================================================= */}
      {/* SECTION 4: PASSERELLE VERS LES PROTOTYPES TECHNOLOGIQUES   */}
      {/* ========================================================= */}
      <section className="bg-white py-12 border-t border-[#E8DFD3]">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="rounded-2xl bg-gradient-to-r from-[#24140D] to-[#3B1E12] text-white p-8 sm:p-10 flex flex-col md:flex-row items-center justify-between gap-6 shadow-md">
            <div>
              <span className="inline-block rounded-md bg-[#C99A68]/20 px-3 py-1 text-xs font-bold text-[#C99A68] uppercase tracking-wider mb-2">
                Transfert Technologique & R&D
              </span>
              <h2 className="text-2xl sm:text-3xl font-bold font-serif">
                Consulter les 26 Fiches Techniques de Prototypes
              </h2>
              <p className="mt-2 text-sm text-white/80 max-w-2xl leading-relaxed">
                Accédez aux fiches d&apos;ingénierie détaillées, niveaux de maturité TRL (4 à 8),
                spécifications techniques et QR codes d&apos;homologation du CIAT Diamniadio.
              </p>
            </div>
            <Link
              href="/galerie/gestion"
              className="shrink-0 rounded-xl bg-[#C99A68] px-6 py-3.5 text-xs font-extrabold text-[#24140D] hover:bg-[#d8ab79] transition-all shadow-md text-center"
            >
              Accéder aux Fiches TRL →
            </Link>
          </div>
        </div>
      </section>

      {/* ========================================================= */}
      {/* MODALE LIGHTBOX EN HAUTE RÉSOLUTION                       */}
      {/* ========================================================= */}
      {activeMoment && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4 sm:p-6 backdrop-blur-md animate-fadeIn"
          onClick={() => setActiveMoment(null)}
        >
          <div
            className="relative max-w-4xl w-full bg-[#FAF7F2] rounded-3xl overflow-hidden shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Bouton Fermer */}
            <button
              type="button"
              onClick={() => setActiveMoment(null)}
              aria-label="Fermer la modale"
              className="absolute top-4 right-4 z-20 h-10 w-10 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-black transition-colors"
            >
              ✕
            </button>

            {/* Image Grande Définition */}
            <div className="relative aspect-[16/10] w-full bg-black">
              <Image
                src={activeMoment.imageUrl}
                alt={activeMoment.title}
                fill
                className="object-cover object-center"
              />
            </div>

            {/* Informations & Description */}
            <div className="p-6 sm:p-8">
              <div className="flex flex-wrap items-center justify-between gap-3 text-xs mb-3">
                <span className="font-bold text-[#612D10] uppercase tracking-wider bg-[#612D10]/10 px-3 py-1 rounded-full">
                  {activeMoment.category}
                </span>
                <span className="text-[#7A6A5E] font-medium">
                  {activeMoment.location} • {activeMoment.date}
                </span>
              </div>

              <h2 className="text-2xl sm:text-3xl font-extrabold text-[#24140D] font-serif">
                {activeMoment.title}
              </h2>

              <p className="mt-3 text-sm sm:text-base text-[#6B5A4E] leading-relaxed">
                {activeMoment.description}
              </p>

              <div className="mt-6 pt-4 border-t border-[#E8DFD3] flex items-center justify-between text-xs">
                <span className="text-[#8C7A6D] font-mono">
                  Réf. {activeMoment.slug}
                </span>
                <button
                  type="button"
                  onClick={() => setActiveMoment(null)}
                  className="font-bold text-[#612D10] hover:underline"
                >
                  Fermer la vue aperçu
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
