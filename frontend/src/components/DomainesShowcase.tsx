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
    photo: "/images/domaine_01_tic_hd.jpg",
    isDark: true,
    waveColor: "#22120A",
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
    photo: "/images/domaine_02_meca_hd.jpg",
    isDark: false,
    waveColor: "#FAF7F2",
    accentBg: "#EEDFD0",
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
    photo: "/images/domaine_03_agri_hd.jpg",
    isDark: false,
    waveColor: "#FAF7F2",
    accentBg: "#E3ECE0",
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
    photo: "/images/domaine_04_energie_hd.jpg",
    isDark: false,
    waveColor: "#FAF7F2",
    accentBg: "#F7E8D6",
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
    photo: "/images/domaine_05_sante_hd.jpg",
    isDark: false,
    waveColor: "#FAF7F2",
    accentBg: "#F5DFDF",
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
    photo: "/images/domaine_06_education_hd.jpg",
    isDark: false,
    waveColor: "#FAF7F2",
    accentBg: "#EBE3F2",
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
    photo: "/images/domaine_07_services_hd.jpg",
    isDark: false,
    waveColor: "#FAF7F2",
    accentBg: "#F4E5D4",
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

// Rendu des petits pictogrammes fins exacts à côté des numéros
function CardMicroIcon({ type, isDark }: { type: string; isDark?: boolean }) {
  const strokeClass = isDark ? "stroke-[#C99A68]" : "stroke-[#A07044]";
  const fillClass = isDark ? "fill-[#C99A68]" : "fill-[#A07044]";

  switch (type) {
    case "sliders":
      return (
        <svg className={`w-5 h-4 ${strokeClass}`} viewBox="0 0 20 16" fill="none" strokeWidth="1.5">
          <circle cx="5" cy="8" r="2.5" className={fillClass} />
          <line x1="8" y1="8" x2="18" y2="8" />
          <line x1="2" y1="8" x2="3" y2="8" />
          <circle cx="15" cy="3" r="1.5" />
          <circle cx="15" cy="13" r="1.5" />
        </svg>
      );
    case "cogs":
      return (
        <svg className={`w-4 h-4 ${strokeClass}`} viewBox="0 0 20 20" fill="none" strokeWidth="1.5">
          <rect x="7" y="2" width="6" height="16" rx="2" />
          <line x1="10" y1="2" x2="10" y2="18" strokeDasharray="2 2" />
        </svg>
      );
    case "sprout":
      return (
        <svg className={`w-4 h-4 ${strokeClass}`} viewBox="0 0 20 20" fill="none" strokeWidth="1.5">
          <path d="M10 17V8" />
          <path d="M10 8C10 5 13 3 17 3C17 7 15 10 10 10" />
          <path d="M10 12C10 10 7 8 3 8C3 12 5 14 10 14" />
        </svg>
      );
    case "sun":
      return (
        <svg className={`w-4 h-4 ${strokeClass}`} viewBox="0 0 20 20" fill="none" strokeWidth="1.5">
          <path d="M11 2L5 11H10L9 18L15 9H10L11 2Z" className={fillClass} />
        </svg>
      );
    case "microscope":
      return (
        <svg className={`w-4 h-4 ${strokeClass}`} viewBox="0 0 20 20" fill="none" strokeWidth="1.5">
          <circle cx="10" cy="6" r="3" />
          <path d="M6 16H14" />
          <path d="M10 9V16" />
        </svg>
      );
    case "cap":
      return (
        <svg className={`w-4 h-4 ${strokeClass}`} viewBox="0 0 20 20" fill="none" strokeWidth="1.5">
          <polygon points="10 3 18 7 10 11 2 7" className={fillClass} />
          <path d="M5 9V14C5 15.5 7.5 17 10 17C12.5 17 15 15.5 15 14V9" />
        </svg>
      );
    case "city":
    default:
      return (
        <svg className={`w-4 h-4 ${strokeClass}`} viewBox="0 0 20 20" fill="none" strokeWidth="1.5">
          <circle cx="7" cy="7" r="3" />
          <circle cx="14" cy="13" r="3" />
          <line x1="9" y1="9" x2="12" y2="12" />
        </svg>
      );
  }
}

export default function DomainesShowcase() {
  const [activeModalItem, setActiveModalItem] = useState<DomaineItem | null>(null);

  return (
    <div className="bg-[#FAF7F2] text-[#24140D] min-h-screen font-sans antialiased selection:bg-[#C99A68]/30">
      {/* =====================================================================
       * SECTION 1 : HERO HAUT DE PAGE CONFORME À LA MAQUETTE
       * Fond biseauté marron foncé à facettes + Photo chercheuse haute résolution
       * ===================================================================== */}
      <section className="relative w-full min-h-[460px] sm:min-h-[520px] lg:min-h-[580px] bg-[#1F110B] text-white overflow-hidden flex items-center">
        {/* Motifs géométriques à facettes en arrière-plan gauche */}
        <div className="absolute inset-y-0 left-0 w-full lg:w-[60%] pointer-events-none z-0 overflow-hidden">
          {/* Facettes polygonales subtiles de la maquette */}
          <div className="absolute -top-20 -left-20 w-[600px] h-[700px] bg-gradient-to-br from-[#2D160D] via-[#221008] to-[#160A05] opacity-90 transform -rotate-6" />
          <div className="absolute top-1/4 left-1/3 w-[500px] h-[500px] bg-gradient-to-tr from-[#351A0F] to-transparent opacity-40 transform rotate-12" />
        </div>

        {/* Photo de droite haute résolution : Chercheuse au laboratoire */}
        <div className="absolute top-0 right-0 bottom-0 w-full lg:w-[56%] z-0 overflow-hidden">
          <Image
            src="/images/domaines_hero_hd.jpg"
            alt="Chercheuse et ingénieurs en laboratoire de mécatronique et électronique au CIAT Diamniadio"
            fill
            priority
            sizes="(max-width: 1024px) 100vw, 56vw"
            className="object-cover object-center"
          />

          {/* Dégradé doux de transition entre les facettes sombres et la photo */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#1F110B] via-transparent to-transparent lg:bg-gradient-to-r lg:from-[#1F110B] lg:via-[#1F110B]/50 lg:to-transparent" />

          {/* Mots-clés verticaux exacts en haut à droite */}
          <div className="absolute top-8 right-8 lg:top-10 lg:right-12 z-10 hidden sm:flex flex-col items-end gap-1.5 text-right font-sans text-[11px] font-bold tracking-[0.28em] text-white/95 uppercase drop-shadow-md select-none">
            <span>INNOVER</span>
            <div className="w-10 h-[1px] bg-white/40 my-0.5" />
            <span>FORMER</span>
            <div className="w-10 h-[1px] bg-white/40 my-0.5" />
            <span>ENTREPRENDRE</span>
            <div className="w-10 h-[1px] bg-white/40 my-0.5" />
            <span>TRANSFÉRER</span>
          </div>
        </div>

        {/* Contenu textuel à gauche conforme à la maquette */}
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20 w-full">
          <div className="max-w-xl">
            {/* Trait et label supérieur */}
            <div className="inline-flex items-center gap-3 text-xs font-bold tracking-[0.25em] text-[#C99A68] uppercase mb-4">
              <span>NOS 7 DOMAINES</span>
              <span className="w-14 h-[1px] bg-[#C99A68]" />
            </div>

            {/* Titre monumental en Fraunces serif */}
            <h1 className="text-3xl sm:text-5xl lg:text-[52px] font-serif font-bold text-white tracking-tight leading-[1.1]">
              7 domaines
              <br />
              d’expertise au service
              <br />
              d’un <span className="italic font-serif font-normal text-[#C99A68]">avenir durable</span>
            </h1>

            {/* Paragraphe narratif */}
            <p className="mt-5 text-sm sm:text-base text-white/85 leading-relaxed font-normal max-w-lg">
              Le CIAT intervient dans 7 domaines stratégiques pour accompagner les talents,
              soutenir l’innovation et répondre aux défis du Sénégal et de l’Afrique de demain.
            </p>

            {/* Bouton avec icône cercle play + Découvrir le CIAT */}
            <div className="mt-8 flex items-center gap-4">
              <Link
                href="/portail/ciat"
                className="inline-flex items-center gap-3 text-xs sm:text-sm font-semibold text-white group cursor-pointer"
              >
                <span className="h-9 w-9 rounded-full border border-white/40 group-hover:border-[#C99A68] bg-white/10 group-hover:bg-[#C99A68] group-hover:text-[#1F110B] flex items-center justify-center transition-all shadow-md">
                  <span className="text-[10px] font-bold ml-0.5">▶</span>
                </span>
                <span className="underline underline-offset-4 group-hover:text-[#C99A68] transition-colors">
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
            <span className="text-xs font-bold uppercase tracking-[0.2em] text-[#8C7A6D] block mb-2">
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
                {/* Photo de la carte */}
                <div className="relative aspect-[16/10] w-full overflow-hidden bg-black/10">
                  <Image
                    src={item.photo}
                    alt={item.nom}
                    fill
                    sizes="(max-width: 768px) 100vw, 33vw"
                    className="object-cover object-center transition-transform duration-500 ease-out hover:scale-105"
                  />
                  {/* Dégradé doux inférieur de transition */}
                  <div
                    className={`absolute inset-0 pointer-events-none ${
                      item.isDark
                        ? "bg-gradient-to-t from-[#22120A] via-transparent to-transparent"
                        : "bg-gradient-to-t from-white/90 via-transparent to-transparent"
                    }`}
                  />
                </div>

                {/* Transition ondulée / scalloped subtile de la maquette */}
                <div
                  className="relative -mt-5 z-10 w-full h-5 overflow-hidden"
                  style={{ color: item.isDark ? "#22120A" : "#FFFFFF" }}
                >
                  <svg
                    viewBox="0 0 400 24"
                    fill="currentColor"
                    preserveAspectRatio="none"
                    className="w-full h-full block"
                  >
                    <path d="M0,12 C100,24 250,0 400,12 L400,24 L0,24 Z" />
                  </svg>
                </div>

                {/* Corps de texte de la carte */}
                <div className="p-6 sm:p-7 flex-1 flex flex-col justify-between -mt-1">
                  <div>
                    {/* Numéro et pictogramme fin conforme à la maquette */}
                    <div className="flex items-center gap-2 mb-3">
                      <span
                        className={`font-mono text-sm font-bold ${
                          item.isDark ? "text-white/80" : "text-[#8C7A6D]"
                        }`}
                      >
                        {item.code}
                      </span>
                      <CardMicroIcon type={item.iconSvg} isDark={item.isDark} />
                    </div>

                    {/* Titre du domaine */}
                    <h2
                      className={`text-lg sm:text-xl font-bold leading-snug tracking-tight font-serif ${
                        item.isDark ? "text-white" : "text-[#24140D]"
                      }`}
                    >
                      {item.nom}
                    </h2>

                    {/* Description fidèle à la maquette */}
                    <p
                      className={`mt-3 text-xs sm:text-sm leading-relaxed font-normal ${
                        item.isDark ? "text-white/80" : "text-[#6B5A4E]"
                      }`}
                    >
                      {item.description}
                    </p>
                  </div>

                  {/* Bouton En savoir plus */}
                  <div className="mt-6 pt-4 border-t border-black/5">
                    <button
                      type="button"
                      onClick={() => setActiveModalItem(item)}
                      className={`inline-flex items-center gap-1.5 text-xs font-bold transition-all cursor-pointer ${
                        item.isDark
                          ? "text-[#C99A68] hover:text-white"
                          : "text-[#612D10] hover:text-[#C99A68]"
                      }`}
                    >
                      <span>En savoir plus</span>
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
                {/* Photo de la carte */}
                <div className="relative aspect-[16/11] w-full overflow-hidden bg-black/10">
                  <Image
                    src={item.photo}
                    alt={item.nom}
                    fill
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                    className="object-cover object-center transition-transform duration-500 ease-out hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-white/85 via-transparent to-transparent pointer-events-none" />
                </div>

                {/* Transition ondulée douce */}
                <div className="relative -mt-4 z-10 w-full h-4 overflow-hidden text-white">
                  <svg
                    viewBox="0 0 300 20"
                    fill="currentColor"
                    preserveAspectRatio="none"
                    className="w-full h-full block"
                  >
                    <path d="M0,10 C80,20 200,0 300,10 L300,20 L0,20 Z" />
                  </svg>
                </div>

                {/* Corps de texte */}
                <div className="p-5 sm:p-6 flex-1 flex flex-col justify-between -mt-1">
                  <div>
                    {/* Numéro et icône fine */}
                    <div className="flex items-center gap-2 mb-2.5">
                      <span className="font-mono text-sm font-bold text-[#8C7A6D]">
                        {item.code}
                      </span>
                      <CardMicroIcon type={item.iconSvg} />
                    </div>

                    {/* Titre du domaine */}
                    <h2 className="text-base font-bold text-[#24140D] font-serif leading-snug tracking-tight">
                      {item.nom}
                    </h2>

                    {/* Description concise */}
                    <p className="mt-2.5 text-xs text-[#6B5A4E] leading-relaxed font-normal">
                      {item.description}
                    </p>
                  </div>

                  {/* Bouton En savoir plus */}
                  <div className="mt-5 pt-3.5 border-t border-[#F1E9DE]">
                    <button
                      type="button"
                      onClick={() => setActiveModalItem(item)}
                      className="inline-flex items-center gap-1.5 text-xs font-bold text-[#612D10] hover:text-[#C99A68] transition-colors cursor-pointer"
                    >
                      <span>En savoir plus</span>
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
