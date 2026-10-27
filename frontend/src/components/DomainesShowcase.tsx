"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";

interface DomaineItem {
  id: number;
  code: string;
  nom: string;
  description: string;
  photo: string;
  isDark?: boolean;
  accentBg?: string;
  waveColor?: string;
  cornerAccent?: string;
  iconSvg: string;
  enjeuxComplets: string;
  axes: string[];
  prototypes: string[];
  atelier: string;
}

const DOMAINES: DomaineItem[] = [
  // ==========================================
  // LIGNE 1 : 3 CARTES
  // ==========================================
  {
    id: 1,
    code: "01",
    nom: "TIC, numérique, intelligence artificielle et données",
    description:
      "Développer des solutions numériques et des systèmes intelligents pour une société plus connectée et plus performante.",
    photo: "/images/domaine_01_card_hd.jpg",
    isDark: true,
    waveColor: "#22120A",
    cornerAccent: "concentric_dark",
    iconSvg: "sliders",
    enjeuxComplets:
      "Souveraineté numérique nationale, valorisation des données publiques sénégalaises, modèles d'intelligence artificielle adaptés aux langues nationales (Wolof, Pulaar, Sérère), vision par ordinateur et cybersécurité des systèmes critiques.",
    axes: [
      "Intelligence artificielle embarquée & vision par ordinateur",
      "Cybersécurité industrielle & plateformes logicielles souveraines",
      "Traitement automatique des langues nationales (NLP)",
    ],
    prototypes: ["SunuAgri AI", "Jumeaux numériques ISEP", "Guichet unique communal"],
    atelier: "Laboratoire Calcul Haute Performance & IA",
  },
  {
    id: 2,
    code: "02",
    nom: "Mécanique, fabrication et maintenance",
    description:
      "Accompagner la montée en compétences et le développement d’une industrie locale compétitive et durable.",
    photo: "/images/domaine_02_card_hd.jpg",
    isDark: false,
    waveColor: "#FFFFFF",
    cornerAccent: "amber_facet",
    iconSvg: "cogs",
    enjeuxComplets:
      "Rupture de la dépendance aux importations de pièces détachées industrielles par l'usinage numérique CNC de haute précision, la fabrication additive sur métaux/polymères et la maintenance prédictive.",
    axes: [
      "Centres d'usinage numérique CNC 4 et 5 axes haute fidélité",
      "Découpe laser industrielle et profilage mécanique",
      "Fabrication additive (impression 3D) pour pièces critiques",
    ],
    prototypes: ["Fraiseuse CNC 4.0 locale", "Presse oléagineuse compacte", "Bancs d'essai industriels"],
    atelier: "FabLab 4.0 & Ateliers Usinage Lourd",
  },
  {
    id: 3,
    code: "03",
    nom: "Agriculture, transformation et environnement",
    description:
      "Soutenir l’innovation agricole et la valorisation des ressources naturelles pour une meilleure sécurité alimentaire et environnementale.",
    photo: "/images/domaine_03_card_hd.jpg",
    isDark: false,
    waveColor: "#FFFFFF",
    cornerAccent: "green_leaf",
    iconSvg: "sprout",
    enjeuxComplets:
      "Sécurité alimentaire durable par la maîtrise des ressources hydriques, la mécanisation adaptée des filières céréalières et maraîchères des Niayes, et la réduction des pertes post-récolte par le séchage solaire.",
    axes: [
      "Irrigation goutte-à-goutte automatisée par capteurs IoT",
      "Serres hydroponiques bioclimatiques basse consommation d'eau",
      "Séchoirs solaires hybrides et conservation agroalimentaire",
    ],
    prototypes: ["AgriSol IoT", "Éco-Séchoir Solaire", "SmartIrrig Saloum"],
    atelier: "Serres Expérimentales & Laboratoire Bio-Industries",
  },

  // ==========================================
  // LIGNE 2 : 4 CARTES (COLONNES)
  // ==========================================
  {
    id: 4,
    code: "04",
    nom: "Énergie, efficacité énergétique et énergies renouvelables",
    description:
      "Promouvoir des solutions énergétiques propres et accessibles pour un développement durable.",
    photo: "/images/domaine_04_card_hd.jpg",
    isDark: false,
    waveColor: "#FFFFFF",
    cornerAccent: "orange_sun",
    iconSvg: "sun",
    enjeuxComplets:
      "Valorisation optimale de l'irradiance solaire du Sénégal, stabilisation des micro-réseaux ruraux autonomes (microgrids) et certification technique des équipements photovoltaïques en climat sahélien.",
    axes: [
      "Caractérisation et tests d'endurance de modules solaires",
      "Gestion intelligente de micro-réseaux ruraux autonomes",
      "Contrôleurs de charge et stockage hybride par batteries",
    ],
    prototypes: ["SunuGrid Micro-Réseau", "Éolienne multipale locale", "Bancs solaires"],
    atelier: "Plateforme Solaire Extérieure & Laboratoire Énergies",
  },
  {
    id: 5,
    code: "05",
    nom: "Pharmaceutique et biomédical",
    description:
      "Renforcer l’innovation en santé pour répondre aux besoins des populations et améliorer la qualité de vie.",
    photo: "/images/domaine_05_card_hd.jpg",
    isDark: false,
    waveColor: "#FFFFFF",
    cornerAccent: "rose_coral",
    iconSvg: "microscope",
    enjeuxComplets:
      "Souveraineté sanitaire nationale par la fabrication locale de dispositifs médicaux d'urgence réparables, la télémédecine solaire décentralisée pour postes de santé de brousse et l'extraction validée de principes actifs.",
    axes: [
      "Valises solaires de télédiagnostic médical pour brousse",
      "Incubateurs néonataux robustes thermorégulés low-cost",
      "Procédés d'extraction standardisés pour pharmacopée locale",
    ],
    prototypes: ["TéléDiag Rufisque", "Incubateur néonatal rural", "Hydrogel Moringa certifié"],
    atelier: "Laboratoire Dispositifs Médicaux & Chimie Bio",
  },
  {
    id: 6,
    code: "06",
    nom: "Éducation, formation professionnelle et insertion",
    description:
      "Former les talents d’aujourd’hui et de demain pour favoriser l’employabilité et l’entrepreneuriat.",
    photo: "/images/domaine_06_card_hd.jpg",
    isDark: false,
    waveColor: "#FFFFFF",
    cornerAccent: "purple_prism",
    iconSvg: "cap",
    enjeuxComplets:
      "Transformation de l'apprentissage technique par les technologies immersives (VR), simulateurs d'ateliers sans risque et passerelles directes pour l'insertion des diplômés de l'ISEP dans l'industrie.",
    axes: [
      "Simulateurs immersifs VR d'usinage et soudure industrielle",
      "Plateformes d'apprentissage hybride pour filières techniques",
      "Matching prédictif des diplômés de l'ISEP avec les entreprises",
    ],
    prototypes: ["Simulateur VR Usinage", "Plateforme Insertion Métiers", "Kit robotique lycées"],
    atelier: "Centre Immersif & Laboratoire Réalité Virtuelle",
  },
  {
    id: 7,
    code: "07",
    nom: "Services aux collectivités, entrepreneuriat et incubation",
    description:
      "Soutenir les initiatives locales et accompagner la création d’entreprises innovantes et responsables.",
    photo: "/images/domaine_07_card_hd.jpg",
    isDark: false,
    waveColor: "#FFFFFF",
    cornerAccent: "terracotta_polygon",
    iconSvg: "city",
    enjeuxComplets:
      "Modernisation des collectivités territoriales, transition vers des villes durables (Pôle Urbain de Diamniadio), optimisation de la gestion des déchets et traçabilité de la fiscalité locale.",
    axes: [
      "Capteurs intelligents pour l'optimisation des tournées déchets",
      "Tricycles utilitaires électriques pour logistique urbaine",
      "Plateformes numériques de perception et guichet unique",
    ],
    prototypes: ["Dakar Waste Solutions", "SmartTax Collect", "Gestion partagée Diamniadio"],
    atelier: "Hub Logistique & Modélisation Territoriale",
  },
];

// Ornements artistiques d'angle géométriques fidèles à la maquette (coin inférieur droit)
function CardCornerAccent({ type }: { type?: string }) {
  switch (type) {
    case "concentric_dark":
      return (
        <svg
          className="absolute -bottom-8 -right-8 w-36 h-36 pointer-events-none opacity-40"
          viewBox="0 0 100 100"
          fill="none"
          stroke="#4A2514"
          strokeWidth="1.5"
        >
          <circle cx="100" cy="100" r="25" />
          <circle cx="100" cy="100" r="45" />
          <circle cx="100" cy="100" r="65" />
          <circle cx="100" cy="100" r="85" />
        </svg>
      );
    case "amber_facet":
      return (
        <svg
          className="absolute bottom-0 right-0 w-24 h-24 pointer-events-none opacity-85"
          viewBox="0 0 100 100"
          fill="none"
        >
          <polygon points="100,20 100,100 20,100" fill="#D8A47F" opacity="0.6" />
          <polygon points="100,50 100,100 50,100" fill="#C99A68" opacity="0.8" />
        </svg>
      );
    case "green_leaf":
      return (
        <svg
          className="absolute bottom-0 right-0 w-24 h-28 pointer-events-none opacity-85"
          viewBox="0 0 100 120"
          fill="none"
        >
          <path
            d="M100,30 C70,40 50,70 60,120 L100,120 Z"
            fill="#8FA876"
            opacity="0.8"
          />
          <path
            d="M100,60 C80,70 70,90 80,120 L100,120 Z"
            fill="#6B8E55"
            opacity="0.9"
          />
        </svg>
      );
    case "orange_sun":
      return (
        <svg
          className="absolute bottom-0 right-0 w-24 h-24 pointer-events-none opacity-80"
          viewBox="0 0 100 100"
          fill="none"
        >
          <path
            d="M100,20 C60,40 40,80 50,100 L100,100 Z"
            fill="#E9A855"
            opacity="0.75"
          />
        </svg>
      );
    case "rose_coral":
      return (
        <svg
          className="absolute bottom-0 right-0 w-24 h-24 pointer-events-none opacity-75"
          viewBox="0 0 100 100"
          fill="none"
        >
          <path
            d="M100,35 C70,45 55,75 60,100 L100,100 Z"
            fill="#E6A5A5"
            opacity="0.75"
          />
        </svg>
      );
    case "purple_prism":
      return (
        <svg
          className="absolute bottom-0 right-0 w-24 h-24 pointer-events-none opacity-80"
          viewBox="0 0 100 100"
          fill="none"
        >
          <polygon points="100,25 100,100 35,100" fill="#8E7DBE" opacity="0.6" />
          <polygon points="100,55 100,100 65,100" fill="#6A539B" opacity="0.8" />
        </svg>
      );
    case "terracotta_polygon":
      return (
        <svg
          className="absolute bottom-0 right-0 w-24 h-24 pointer-events-none opacity-80"
          viewBox="0 0 100 100"
          fill="none"
        >
          <path
            d="M100,25 C65,35 45,70 50,100 L100,100 Z"
            fill="#D36B3B"
            opacity="0.8"
          />
        </svg>
      );
    default:
      return null;
  }
}

// Découpe ondulée précise entre la photo et le corps de la carte selon la maquette
function CardWaveTransition({ id, isDark }: { id: number; isDark?: boolean }) {
  const fillColor = isDark ? "#22120A" : "#FFFFFF";

  switch (id) {
    case 1:
      // Carte 01 : Pente angulaire franche vers le bas-droite
      return (
        <div className="relative -mt-6 z-10 w-full h-8 overflow-hidden pointer-events-none">
          <svg viewBox="0 0 400 36" fill={fillColor} preserveAspectRatio="none" className="w-full h-full block">
            <path d="M 0,0 L 400,26 L 400,36 L 0,36 Z" />
          </svg>
        </div>
      );
    case 2:
      // Carte 02 : Dôme / arche convexe remontant vers le haut
      return (
        <div className="relative -mt-6 z-10 w-full h-8 overflow-hidden pointer-events-none">
          <svg viewBox="0 0 400 36" fill={fillColor} preserveAspectRatio="none" className="w-full h-full block">
            <path d="M 0,28 Q 200,-6 400,28 L 400,36 L 0,36 Z" />
          </svg>
        </div>
      );
    case 3:
      // Carte 03 : Vague asymétrique plongeante
      return (
        <div className="relative -mt-6 z-10 w-full h-8 overflow-hidden pointer-events-none">
          <svg viewBox="0 0 400 36" fill={fillColor} preserveAspectRatio="none" className="w-full h-full block">
            <path d="M 0,14 C 120,38 260,2 400,24 L 400,36 L 0,36 Z" />
          </svg>
        </div>
      );
    case 4:
      // Carte 04 : Vague montante
      return (
        <div className="relative -mt-5 z-10 w-full h-7 overflow-hidden pointer-events-none">
          <svg viewBox="0 0 300 30" fill={fillColor} preserveAspectRatio="none" className="w-full h-full block">
            <path d="M 0,18 C 90,4 200,32 300,16 L 300,30 L 0,30 Z" />
          </svg>
        </div>
      );
    case 5:
      // Carte 05 : Double arche douce
      return (
        <div className="relative -mt-5 z-10 w-full h-7 overflow-hidden pointer-events-none">
          <svg viewBox="0 0 300 30" fill={fillColor} preserveAspectRatio="none" className="w-full h-full block">
            <path d="M 0,22 C 75,-2 180,30 300,14 L 300,30 L 0,30 Z" />
          </svg>
        </div>
      );
    case 6:
      // Carte 06 : Vague dynamique
      return (
        <div className="relative -mt-5 z-10 w-full h-7 overflow-hidden pointer-events-none">
          <svg viewBox="0 0 300 30" fill={fillColor} preserveAspectRatio="none" className="w-full h-full block">
            <path d="M 0,12 C 100,32 200,4 300,20 L 300,30 L 0,30 Z" />
          </svg>
        </div>
      );
    case 7:
    default:
      // Carte 07 : Vague fluide
      return (
        <div className="relative -mt-5 z-10 w-full h-7 overflow-hidden pointer-events-none">
          <svg viewBox="0 0 300 30" fill={fillColor} preserveAspectRatio="none" className="w-full h-full block">
            <path d="M 0,20 C 120,4 210,30 300,14 L 300,30 L 0,30 Z" />
          </svg>
        </div>
      );
  }
}

// Pictogrammes techniques précis à côté de chaque numéro selon la capture de l'utilisateur
function CardHeaderIcon({ id, isDark }: { id: number; isDark?: boolean }) {
  const strokeClass = isDark ? "stroke-[#C99A68]" : "stroke-[#8C7A6D]";
  const fillClass = isDark ? "fill-[#C99A68]" : "fill-[#8C7A6D]";

  switch (id) {
    case 1:
      return (
        <div className="flex items-center gap-2">
          <svg className={`w-4 h-4 ${strokeClass}`} viewBox="0 0 20 20" fill="none" strokeWidth="1.5">
            <circle cx="10" cy="11" r="6" />
            <line x1="10" y1="2" x2="10" y2="5" />
            <line x1="10" y1="8" x2="10" y2="11" />
            <line x1="10" y1="11" x2="13" y2="13" />
          </svg>
          <svg className={`w-8 h-2.5 ${strokeClass}`} viewBox="0 0 32 10" fill="none" strokeWidth="1.5">
            <line x1="2" y1="5" x2="30" y2="5" />
            <circle cx="20" cy="5" r="3" className={fillClass} />
          </svg>
        </div>
      );
    case 2:
      return (
        <div className="flex items-center gap-2">
          <svg className={`w-4 h-4 ${strokeClass}`} viewBox="0 0 20 20" fill="none" strokeWidth="1.5">
            <polygon points="10,2 17,5 17,11 10,18 3,11 3,5" />
            <circle cx="10" cy="10" r="2.5" />
          </svg>
          <svg className={`w-4 h-4 ${strokeClass}`} viewBox="0 0 16 16" fill="none" strokeWidth="1.5">
            <line x1="5" y1="2" x2="5" y2="14" />
            <circle cx="5" cy="6" r="1.5" className={fillClass} />
            <line x1="11" y1="2" x2="11" y2="14" />
            <circle cx="11" cy="10" r="1.5" className={fillClass} />
          </svg>
        </div>
      );
    case 3:
      return (
        <div className="flex items-center gap-2">
          <svg className={`w-4 h-4 ${strokeClass}`} viewBox="0 0 20 20" fill="none" strokeWidth="1.5">
            <circle cx="10" cy="10" r="7" />
            <line x1="10" y1="5" x2="10" y2="15" />
            <line x1="5" y1="10" x2="15" y2="10" />
            <circle cx="10" cy="10" r="2" className={fillClass} />
          </svg>
          <svg className={`w-4 h-4 ${strokeClass}`} viewBox="0 0 16 16" fill="none" strokeWidth="1.5">
            <line x1="5" y1="2" x2="5" y2="14" />
            <circle cx="5" cy="8" r="1.5" className={fillClass} />
            <line x1="11" y1="2" x2="11" y2="14" />
            <circle cx="11" cy="5" r="1.5" className={fillClass} />
          </svg>
        </div>
      );
    case 4:
      return (
        <div className="flex items-center gap-2">
          <svg className={`w-4 h-4 ${strokeClass}`} viewBox="0 0 20 20" fill="none" strokeWidth="1.5">
            <polygon points="11,2 5,11 10,11 9,18 15,9 10,9" className={fillClass} />
          </svg>
          <svg className={`w-4 h-4 ${strokeClass}`} viewBox="0 0 16 16" fill="none" strokeWidth="1.5">
            <line x1="5" y1="2" x2="5" y2="14" />
            <line x1="11" y1="2" x2="11" y2="14" />
          </svg>
        </div>
      );
    case 5:
      return (
        <div className="flex items-center gap-1.5">
          <svg className={`w-4 h-4 ${strokeClass}`} viewBox="0 0 20 20" fill="none" strokeWidth="1.5">
            <polygon points="10,2 17,5 17,11 10,18 3,11 3,5" />
            <line x1="10" y1="7" x2="10" y2="13" />
            <line x1="7" y1="10" x2="13" y2="10" />
          </svg>
        </div>
      );
    case 6:
      return (
        <div className="flex items-center gap-1.5">
          <svg className={`w-4 h-4 ${strokeClass}`} viewBox="0 0 20 20" fill="none" strokeWidth="1.5">
            <polygon points="10,4 18,8 10,12 2,8" className={fillClass} />
            <path d="M5,10 V14 C5,15.5 7.5,17 10,17 C12.5,17 15,15.5 15,14 V10" />
          </svg>
        </div>
      );
    case 7:
    default:
      return (
        <div className="flex items-center gap-1.5">
          <svg className={`w-4 h-4 ${strokeClass}`} viewBox="0 0 20 20" fill="none" strokeWidth="1.5">
            <circle cx="10" cy="7" r="4" className={fillClass} />
            <path d="M10,11 L10,17" />
          </svg>
        </div>
      );
  }
}

export default function DomainesShowcase() {
  const [activeModalItem, setActiveModalItem] = useState<DomaineItem | null>(null);

  return (
    <div className="bg-[#FAF7F2] text-[#24140D] min-h-screen font-sans antialiased selection:bg-[#C99A68]/30">
      {/* =====================================================================
       * SECTION 1 : HERO HAUT DE PAGE CONFORME À LA MAQUETTE & CHARTE CIAT
       * Affiche l'œuvre maîtresse 2K HD en fond avec bouton interactif et fallback mobile
       * ===================================================================== */}
      <section className="relative w-full bg-[#1A0E08] text-white overflow-hidden">
        {/* Version Desktop (lg+) : Rendu de la bannière 2K avec bouton interactif superposé */}
        <div className="hidden lg:block relative w-full aspect-[1982/654] max-w-[1920px] mx-auto overflow-hidden">
          <Image
            src="/images/domaines_hero_master_2x.png"
            alt="7 domaines d'expertise au service d'un avenir durable - CIAT Diamniadio"
            fill
            priority
            sizes="100vw"
            className="object-cover object-center pointer-events-none select-none"
          />

          {/* Bouton interactif superposé exactement sur 'Découvrir le CIAT ->' */}
          <Link
            href="/portail/ciat"
            aria-label="Découvrir le CIAT"
            className="absolute left-[4.8%] bottom-[12%] inline-flex items-center gap-3.5 group cursor-pointer z-20 py-2 px-3 rounded-full hover:bg-black/25 focus-visible:outline-2 focus-visible:outline-[#C99A68] transition-all"
          >
            <span className="h-10 w-10 rounded-full border border-white/50 group-hover:border-[#C99A68] bg-black/40 group-hover:bg-[#C99A68] text-white group-hover:text-[#24140D] flex items-center justify-center transition-all duration-200 shadow-lg">
              <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 fill-none stroke-current stroke-2 ml-0.5" aria-hidden="true">
                <polygon points="7,4 20,12 7,20" />
              </svg>
            </span>
            <span className="font-[family-name:var(--font-title)] text-base font-semibold text-white group-hover:text-[#C99A68] transition-colors underline underline-offset-8 decoration-white/70 group-hover:decoration-[#C99A68]">
              Découvrir le CIAT →
            </span>
          </Link>
        </div>

        {/* Version Mobile / Tablette (<lg) : Fluidité responsive & lisibilité optimale */}
        <div className="lg:hidden relative w-full py-14 px-5 sm:px-8 bg-[#24140D] flex flex-col justify-center overflow-hidden">
          {/* Photo chercheuse en fond avec fondu sombre */}
          <div className="absolute top-0 right-0 bottom-0 w-full z-0 opacity-25 pointer-events-none">
            <Image
              src="/images/domaines_hero_hd.jpg"
              alt="Laboratoire CIAT"
              fill
              className="object-cover object-center"
            />
          </div>

          <div className="relative z-10 max-w-xl">
            <div className="inline-flex items-center gap-3 text-xs font-bold tracking-[0.25em] text-[#C99A68] uppercase mb-4 font-[family-name:var(--font-title)]">
              <span>NOS 7 DOMAINES</span>
              <span className="w-14 h-[1.5px] bg-[#C99A68]" />
            </div>

            <h1 className="text-3xl sm:text-5xl font-serif font-bold text-white tracking-tight leading-[1.08]">
              7 domaines
              <br />
              d’expertise au service
              <br />
              d’un <span className="italic font-serif font-normal text-[#C99A68]">avenir durable</span>
            </h1>

            <p className="mt-5 text-sm sm:text-base text-white/90 leading-relaxed font-normal font-[family-name:var(--font-body)]">
              Le CIAT intervient dans 7 domaines stratégiques pour accompagner les talents,
              soutenir l’innovation et répondre aux défis du Sénégal et de l’Afrique de demain.
            </p>

            <div className="mt-8 flex items-center">
              <Link
                href="/portail/ciat"
                className="inline-flex items-center gap-3.5 group cursor-pointer"
              >
                <span className="h-10 w-10 rounded-full border border-white/40 group-hover:border-[#C99A68] bg-[#24140D]/80 group-hover:bg-[#C99A68] text-white group-hover:text-[#24140D] flex items-center justify-center transition-all duration-200 shadow-lg">
                  <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 fill-none stroke-current stroke-2 ml-0.5" aria-hidden="true">
                    <polygon points="7,4 20,12 7,20" />
                  </svg>
                </span>
                <span className="font-[family-name:var(--font-title)] text-sm font-semibold text-white group-hover:text-[#C99A68] transition-colors underline underline-offset-8 decoration-white/60 group-hover:decoration-[#C99A68]">
                  Découvrir le CIAT →
                </span>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* =====================================================================
       * SECTION 2 : LES 7 CARTES DE DOMAINES (CONFORME À LA MAQUETTE)
       * Ligne 1 (3 cartes dont la 01 Dark) + Ligne 2 (4 cartes colonnes)
       * ===================================================================== */}
      <section id="catalogue-domaines" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20">
        {/* En-tête de section avec titre et bouton "Tout découvrir" */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 pb-10 border-b border-[#E8DFD3]">
          <div>
            <span className="text-xs font-bold uppercase tracking-[0.2em] text-[#8C7A6D] block mb-2 font-[family-name:var(--font-title)]">
              NOS 7 DOMAINES
            </span>
            <p className="text-lg sm:text-xl lg:text-2xl font-serif text-[#24140D] font-normal max-w-2xl leading-snug">
              Des compétences, des infrastructures et un accompagnement sur mesure pour transformer
              les idées en solutions concrètes.
            </p>
          </div>

          <div className="shrink-0">
            <Link
              href="/portail/incubateur"
              className="inline-flex items-center gap-2.5 rounded-full border border-[#D5C9BB] bg-white hover:bg-[#FAF7F2] px-5 py-2.5 text-xs font-bold text-[#612D10] transition-all shadow-2xs hover:border-[#612D10]"
            >
              <span>Tout découvrir</span>
              <span className="h-5 w-5 rounded-full bg-[#612D10] text-white flex items-center justify-center text-[10px]">
                →
              </span>
            </Link>
          </div>
        </div>

        {/* LIGNE 1 : 3 CARTES (Carte 01 Sombre en vedette + Cartes 02 & 03 claires) */}
        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8 items-stretch">
          {DOMAINES.slice(0, 3).map((item) => {
            return (
              <article
                key={item.id}
                className={`relative rounded-3xl overflow-hidden flex flex-col justify-between transition-all duration-300 shadow-sm hover:shadow-xl border ${
                  item.isDark
                    ? "bg-[#22120A] text-white border-[#3F2316]"
                    : "bg-white text-[#24140D] border-[#E8DFD3] hover:border-[#C99A68]/70"
                }`}
              >
                {/* Photo de la carte exacte */}
                <div className="relative aspect-[16/10] w-full overflow-hidden bg-black/10">
                  <Image
                    src={item.photo}
                    alt={item.nom}
                    fill
                    sizes="(max-width: 768px) 100vw, 33vw"
                    className="object-cover object-center transition-transform duration-500 ease-out hover:scale-105"
                  />
                </div>

                {/* Découpe ondulée précise selon la maquette */}
                <CardWaveTransition id={item.id} isDark={item.isDark} />

                {/* Corps de texte de la carte */}
                <div className="relative p-6 sm:p-7 flex-1 flex flex-col justify-between -mt-1 overflow-hidden">
                  {/* Ornement d'angle dans le coin inférieur droit */}
                  <CardCornerAccent type={item.cornerAccent} />

                  <div className="relative z-10">
                    {/* Numéro et pictogramme technique exact de la maquette */}
                    <div className="flex items-center gap-2.5 mb-3">
                      <span
                        className={`font-mono text-sm font-bold ${
                          item.isDark ? "text-[#C99A68]" : "text-[#8C7A6D]"
                        }`}
                      >
                        {item.code}
                      </span>
                      <CardHeaderIcon id={item.id} isDark={item.isDark} />
                    </div>

                    {/* Titre du domaine en Plus Jakarta Sans Bold */}
                    <h2
                      className={`text-lg sm:text-xl font-bold leading-snug tracking-tight font-[family-name:var(--font-title)] ${
                        item.isDark ? "text-white" : "text-[#24140D]"
                      }`}
                    >
                      {item.nom}
                    </h2>

                    {/* Description fidèle à la maquette */}
                    <p
                      className={`mt-3 text-xs sm:text-sm leading-relaxed font-normal font-[family-name:var(--font-body)] ${
                        item.isDark ? "text-white/80" : "text-[#6B5A4E]"
                      }`}
                    >
                      {item.description}
                    </p>
                  </div>

                  {/* Bouton En savoir plus avec soulignement exact de la maquette */}
                  <div className="relative z-10 mt-6 pt-4 border-t border-black/5">
                    <button
                      type="button"
                      onClick={() => setActiveModalItem(item)}
                      className={`inline-flex items-center gap-1.5 text-xs font-bold transition-all cursor-pointer ${
                        item.isDark
                          ? "text-[#C99A68] hover:text-white"
                          : "text-[#612D10] hover:text-[#C99A68]"
                      }`}
                    >
                      <span className="underline underline-offset-4">En savoir plus</span>
                      <span>→</span>
                    </button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>

        {/* LIGNE 2 : 4 CARTES (Cards 04, 05, 06, 07 en 4 colonnes) */}
        <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 items-stretch">
          {DOMAINES.slice(3, 7).map((item) => {
            return (
              <article
                key={item.id}
                className="bg-white rounded-3xl overflow-hidden flex flex-col justify-between border border-[#E8DFD3] hover:border-[#C99A68]/70 shadow-sm hover:shadow-xl transition-all duration-300"
              >
                {/* Photo de la carte exacte */}
                <div className="relative aspect-[16/11] w-full overflow-hidden bg-black/10">
                  <Image
                    src={item.photo}
                    alt={item.nom}
                    fill
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                    className="object-cover object-center transition-transform duration-500 ease-out hover:scale-105"
                  />
                </div>

                {/* Découpe ondulée précise */}
                <CardWaveTransition id={item.id} />

                {/* Corps de texte */}
                <div className="relative p-5 sm:p-6 flex-1 flex flex-col justify-between -mt-1 overflow-hidden">
                  {/* Ornement d'angle dans le coin inférieur droit */}
                  <CardCornerAccent type={item.cornerAccent} />

                  <div className="relative z-10">
                    {/* Numéro et icône technique fine */}
                    <div className="flex items-center gap-2 mb-2.5">
                      <span className="font-mono text-sm font-bold text-[#8C7A6D]">
                        {item.code}
                      </span>
                      <CardHeaderIcon id={item.id} />
                    </div>

                    {/* Titre du domaine en Plus Jakarta Sans Bold */}
                    <h2 className="text-base font-bold text-[#24140D] font-[family-name:var(--font-title)] leading-snug tracking-tight">
                      {item.nom}
                    </h2>

                    {/* Description concise */}
                    <p className="mt-2.5 text-xs text-[#6B5A4E] leading-relaxed font-normal font-[family-name:var(--font-body)]">
                      {item.description}
                    </p>
                  </div>

                  {/* Bouton En savoir plus avec soulignement exact de la maquette */}
                  <div className="relative z-10 mt-5 pt-3.5 border-t border-[#F1E9DE]">
                    <button
                      type="button"
                      onClick={() => setActiveModalItem(item)}
                      className="inline-flex items-center gap-1.5 text-xs font-bold text-[#612D10] hover:text-[#C99A68] transition-colors cursor-pointer"
                    >
                      <span className="underline underline-offset-4">En savoir plus</span>
                      <span>→</span>
                    </button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </section>

      {/* =====================================================================
       * SECTION 3 : BANDEAU BAS "UN ÉCOSYSTÈME UNIQUE" (CONFORME À LA MAQUETTE)
       * Fond sombre gauche + Bâtiment CIAT moderne avec palmiers et logo bronze à droite
       * ===================================================================== */}
      <section className="relative w-full bg-[#150C07] text-white overflow-hidden border-t border-[#2A180F]">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 items-stretch min-h-[380px] sm:min-h-[420px]">
          {/* Colonne gauche (6 cols) : Contenu institutionnel */}
          <div className="lg:col-span-6 p-8 sm:p-12 lg:p-16 flex flex-col justify-center z-10">
            <div className="inline-flex items-center gap-3 text-[11px] font-bold uppercase tracking-[0.25em] text-[#C99A68] mb-3">
              <span>UN ÉCOSYSTÈME UNIQUE</span>
              <span className="w-10 h-[1px] bg-[#C99A68]" />
            </div>

            <h2 className="text-2xl sm:text-4xl font-serif font-bold text-white tracking-tight leading-tight">
              Des idées d’aujourd’hui,
              <br />
              les <span className="italic font-serif font-normal text-[#C99A68]">solutions de demain</span>
            </h2>

            <p className="mt-4 text-xs sm:text-sm text-white/80 leading-relaxed max-w-lg font-normal">
              Le CIAT réunit talents, chercheurs, entreprises et partenaires pour transformer les défis
              en opportunités et bâtir un avenir durable pour le Sénégal et l’Afrique.
            </p>

            <div className="mt-8">
              <Link
                href="/galerie"
                className="inline-flex items-center gap-2 rounded-full border border-white/40 bg-white/10 hover:bg-[#C99A68] hover:text-[#150C07] hover:border-[#C99A68] px-6 py-3 text-xs font-bold text-white transition-all shadow-md active:scale-95"
              >
                <span>Découvrir nos projets</span>
                <span>→</span>
              </Link>
            </div>
          </div>

          {/* Colonne droite (6 cols) : Bâtiment moderne du CIAT avec palmiers et logo bronze */}
          <div className="lg:col-span-6 relative min-h-[280px] sm:min-h-[360px] lg:min-h-full overflow-hidden">
            <Image
              src="/images/domaines_ecosystem_building_hd.jpg"
              alt="Façade moderne du CIAT Diamniadio avec palmiers et logo institutionnel en bronze"
              fill
              sizes="(max-width: 1024px) 100vw, 50vw"
              className="object-cover object-center"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#150C07] via-transparent to-transparent lg:bg-gradient-to-r lg:from-[#150C07] lg:via-transparent lg:to-transparent pointer-events-none" />
          </div>
        </div>
      </section>

      {/* =====================================================================
       * MODALE LIGHTBOX : DÉTAIL COMPLET DU DOMAINE AU CLIC SUR "EN SAVOIR PLUS"
       * ===================================================================== */}
      {activeModalItem && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4 sm:p-6 backdrop-blur-sm"
          onClick={() => setActiveModalItem(null)}
        >
          <div
            className="relative max-w-2xl w-full bg-[#FAF7F2] rounded-3xl overflow-hidden shadow-2xl border border-white/20"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Bouton Fermer */}
            <button
              type="button"
              onClick={() => setActiveModalItem(null)}
              aria-label="Fermer la modale"
              className="absolute top-4 right-4 z-20 h-9 w-9 rounded-full bg-black/60 hover:bg-black text-white flex items-center justify-center transition-colors cursor-pointer text-sm font-bold"
            >
              ✕
            </button>

            {/* Photo haute définition du domaine */}
            <div className="relative aspect-[16/8] w-full bg-[#1F110B] overflow-hidden">
              <Image
                src={activeModalItem.photo}
                alt={activeModalItem.nom}
                fill
                className="object-cover object-center"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#1F110B]/90 via-transparent to-transparent" />
              <div className="absolute bottom-4 left-6 text-white">
                <span className="font-mono text-xs font-bold text-[#C99A68] block">
                  PÔLE {activeModalItem.code}
                </span>
                <h3 className="text-xl font-bold font-serif">{activeModalItem.nom}</h3>
              </div>
            </div>

            {/* Détails & Spécifications techniques */}
            <div className="p-6 sm:p-8 space-y-5">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#612D10] block mb-1">
                  Enjeux &amp; Vision Nationale
                </span>
                <p className="text-xs sm:text-sm text-[#5C4A3E] leading-relaxed">
                  {activeModalItem.enjeuxComplets}
                </p>
              </div>

              <div className="pt-3 border-t border-[#E8DFD3]">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#612D10] block mb-2">
                  Axes Technologiques Prioritaires
                </span>
                <ul className="space-y-1.5">
                  {activeModalItem.axes.map((axe, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-xs text-[#5C4A3E]">
                      <span className="h-1.5 w-1.5 rounded-full bg-[#612D10] mt-1.5 shrink-0" />
                      <span>{axe}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="pt-3 border-t border-[#E8DFD3]">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#612D10] block mb-2">
                  Prototypes &amp; Projets Incubés au CIAT
                </span>
                <div className="flex flex-wrap gap-2">
                  {activeModalItem.prototypes.map((proto, idx) => (
                    <span
                      key={idx}
                      className="px-3 py-1 rounded-lg bg-white border border-[#E0D7CC] text-xs font-medium text-[#24140D]"
                    >
                      {proto}
                    </span>
                  ))}
                </div>
              </div>

              <div className="pt-3 border-t border-[#E8DFD3] text-xs text-[#8C7A6D]">
                <strong>Atelier associé : </strong> {activeModalItem.atelier}
              </div>

              {/* Actions de la modale */}
              <div className="pt-4 border-t border-[#E8DFD3] flex items-center justify-between">
                <Link
                  href="/connexion?next=/incubateur"
                  className="rounded-xl bg-[#612D10] hover:bg-[#7D3A15] text-white px-5 py-2.5 text-xs font-bold transition-all shadow-xs"
                >
                  Candidater sur ce pôle →
                </Link>

                <button
                  type="button"
                  onClick={() => setActiveModalItem(null)}
                  className="text-xs font-bold text-[#612D10] hover:underline cursor-pointer"
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
