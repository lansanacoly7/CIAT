"use client";

import Image from "next/image";
import Link from "next/link";
import {
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
  type KeyboardEvent as ReactKeyboardEvent,
} from "react";
import { createPortal } from "react-dom";
import {
  ArrowRight,
  ArrowUpRight,
  CheckCircle2,
  X,
} from "lucide-react";
import type { DomaineCode } from "@/app/galerie/galerie-visuals";
import "./domaines.css";

interface DomaineOfficiel {
  numero: string;
  galerieCode: Exclude<DomaineCode, "tous">;
  shortLabel: string;
  bentoSpan: "dm-bento-span-7" | "dm-bento-span-5" | "dm-bento-span-4";
  titre: string;
  description: string;
  image: string;
  imageAlt: string;
  enjeux: string;
  axes: [string, string, string];
  prototypes: string[];
  atelier: string;
  equipements: string;
}

const DOMAINES_OFFICIELS: DomaineOfficiel[] = [
  {
    numero: "01",
    galerieCode: "numerique",
    shortLabel: "Numérique & IA",
    bentoSpan: "dm-bento-span-7",
    titre: "TIC, numérique, intelligence artificielle et données",
    description:
      "Architectures logicielles souveraines, modèles d'IA embarquée hors-ligne et systèmes de données adaptés aux réalités économiques et linguistiques du Sénégal.",
    image: "/images/domaine_01_tic_hd.jpg",
    imageAlt:
      "Ingénieur en intelligence artificielle et science des données au laboratoire numérique du CIAT",
    enjeux:
      "Souveraineté numérique nationale, valorisation des données agricoles et territoriales sénégalaises, traitement automatique des langues nationales (Wolof, Pulaar, Sérère) et cybersécurité des infrastructures critiques.",
    axes: [
      "Vision par ordinateur embarquée & diagnostic terrain hors-ligne",
      "Traitement vocal en langues nationales (NLP) pour services essentiels",
      "Plateformes souveraines, réseaux IoT LoRaWAN & cybersécurité",
    ],
    prototypes: [
      "SunuAgri AI",
      "Guichet unique communal",
      "Kayar Trace Pêche",
    ],
    atelier: "Laboratoire Calcul Haute Performance, Cloud & IA",
    equipements:
      "Serveurs GPU d'entraînement, passerelles LoRaWAN longue portée, bancs de test cybersécurité et stations de développement embarqué.",
  },
  {
    numero: "02",
    galerieCode: "mecanique",
    shortLabel: "Mécanique & CNC",
    bentoSpan: "dm-bento-span-5",
    titre: "Mécanique, fabrication et maintenance",
    description:
      "Industrialisation locale de pièces critiques de rechange, outillages et machines agroalimentaires par usinage numérique 5 axes et rétro-ingénierie 3D.",
    image: "/images/innovations/cnc-4-0-clean.jpg",
    imageAlt:
      "Centre d'usinage numérique CNC 5 axes haute précision au sein du FabLab 4.0 du CIAT",
    enjeux:
      "Réduction durable des arrêts de lignes industrielles liés à l'importation de pièces détachées, standardisation métrologique des équipements fabriqués au Sénégal et maintenance prédictive.",
    axes: [
      "Usinage numérique CNC 4 et 5 axes en alliages et inox alimentaire",
      "Scannérisation laser 3D, CAO/FAO paramétrique & rétro-ingénierie",
      "Conception de machines-outils robustes pour la transformation locale",
    ],
    prototypes: [
      "Pièces critiques CNC 5 axes",
      "Presse oléagineuse compacte",
      "Batteuse multicéréales Fonio",
    ],
    atelier: "FabLab 4.0 & Halle d'Usinage Mécanique Lourd",
    equipements:
      "Centres d'usinage CNC 5 axes, découpeuse plasma/laser, scanners métrologiques 3D, postes TIG/MIG et imprimantes 3D polymères techniques.",
  },
  {
    numero: "03",
    galerieCode: "agriculture",
    shortLabel: "Agro & Environnement",
    bentoSpan: "dm-bento-span-4",
    titre: "Agriculture, transformation et environnement",
    description:
      "Sécurisation des rendements maraîchers et réduction des pertes post-récolte par l'irrigation pilotée par capteurs et les procédés propres de conservation.",
    image: "/images/innovations/agrisol-iot.jpg",
    imageAlt:
      "Station agrométéorologique connectée de suivi hydrique déployée en parcelle maraîchère au Sénégal",
    enjeux:
      "Résilience climatique des bassins agricoles (Niayes, Vallée du Fleuve, Casamance), maîtrise de la ressource hydrique et valorisation locale des productions agricoles.",
    axes: [
      "Irrigation goutte-à-goutte automatisée par sondes capacitives",
      "Séchage thermodynamique et conservation post-récolte zéro déchet",
      "Monitoring environnemental des sols, nappes et intrants organiques",
    ],
    prototypes: [
      "AgriSol Pompage Connecté",
      "SmartIrrig Saloum",
      "Séchoir hybride Casamance",
    ],
    atelier: "Halle de Génie Agroalimentaire & Parcelle Pilote",
    equipements:
      "Bancs d'étalonnage pédologique, pilotes de déshydratation contrôlée, analyseurs d'humidité et stations agrométéorologiques connectées.",
  },
  {
    numero: "04",
    galerieCode: "energie",
    shortLabel: "Énergie Solaire",
    bentoSpan: "dm-bento-span-4",
    titre: "Énergie, efficacité énergétique et énergies renouvelables",
    description:
      "Déploiement de micro-réseaux photovoltaïques intelligents, systèmes de stockage LiFePO4 résilients et chaîne du froid solaire pour l'autonomie des territoires.",
    image: "/images/d04_unsplash.jpg",
    imageAlt:
      "Champ photovoltaïque et infrastructure solaire de production d'énergie propre",
    enjeux:
      "Électrification productive des zones rurales hors-réseau, maîtrise de la chaîne du froid solaire pour l'agriculture et la pêche, et optimisation énergétique des bâtiments.",
    axes: [
      "Micro-réseaux intelligents (Smart Grids) avec comptage Pay-As-You-Go",
      "Chaîne du froid solaire mobile et stockage lithium-fer-phosphate",
      "Audits thermiques, électronique de puissance et régulation MPPT",
    ],
    prototypes: [
      "Mini-réseau SunuGrid",
      "Remorque frigorifique solaire",
      "Banc d'endurance PV",
    ],
    atelier: "Plateforme Énergies Renouvelables & Électronique de Puissance",
    equipements:
      "Simulateurs d'ensoleillement, analyseurs de réseaux triphasés, bancs de cyclage batteries LiFePO4 et caméras thermographiques.",
  },
  {
    numero: "05",
    galerieCode: "biomedical",
    shortLabel: "Biomédical & Santé",
    bentoSpan: "dm-bento-span-4",
    titre: "Pharmaceutique et biomédical",
    description:
      "Conception de dispositifs médicaux robustes, réparables localement et adaptés aux postes de santé isolés, ainsi que valorisation biopharmaceutique.",
    image: "/images/innovations/telemedical-device.jpg",
    imageAlt:
      "Moniteur physiologique portable et banc d'instrumentation électronique biomédicale au CIAT",
    enjeux:
      "Équité d'accès au diagnostic précoce dans les zones éloignées, souveraineté en équipements hospitaliers essentiels et maintenance biomédicale préventive.",
    axes: [
      "Valises de télédiagnostic connectées (ECG, SpO2, auscultation)",
      "Équipements néonataux et maternels basse consommation sur batterie",
      "Standardisation galénique et contrôle qualité d'extraits actifs locaux",
    ],
    prototypes: [
      "Valise SunuDoc",
      "TéléDiag Rufisque",
      "Incubateur néonatal frugal",
    ],
    atelier: "Laboratoire d'Instrumentation Biomédicale & Prototypage Santé",
    equipements:
      "Oscilloscopes numériques haute précision, simulateurs de signaux vitaux patients, enceintes climatiques et salles propres d'assemblage.",
  },
  {
    numero: "06",
    galerieCode: "education",
    shortLabel: "Éducation & EdTech",
    bentoSpan: "dm-bento-span-5",
    titre: "Éducation, formation professionnelle et insertion",
    description:
      "Démultiplication de l'apprentissage des métiers techniques par les jumeaux numériques, les simulateurs d'atelier et des kits robotiques conçus au Sénégal.",
    image: "/images/ciat-depot-innovation.jpg",
    imageAlt:
      "Apprenants ingénieurs et encadrant testant un kit électronique et robotique pédagogique en atelier à Diamniadio",
    enjeux:
      "Adéquation directe entre la formation professionnelle (ISEP, lycées techniques) et les standards de l'industrie 4.0, tout en sécurisant l'entraînement pratique.",
    axes: [
      "Simulateurs immersifs VR pour soudure, usinage et maintenance",
      "Kits didactiques open-hardware de robotique et d'automatisme",
      "Plateformes numériques de certification métier et d'insertion diplômés",
    ],
    prototypes: [
      "Kit robotique lycées techniques",
      "Simulateur VR soudure ISEP",
      "Jumeau numérique d'atelier",
    ],
    atelier: "Studio Ingénierie Pédagogique, Réalité Virtuelle & EdTech",
    equipements:
      "Casques VR industriels à retour haptique, stations de modélisation temps réel, bancs automates programmables et studio multimédia.",
  },
  {
    numero: "07",
    galerieCode: "collectivites",
    shortLabel: "Collectivités & Incubation",
    bentoSpan: "dm-bento-span-7",
    titre: "Services aux collectivités, entrepreneuriat et incubation",
    description:
      "Modernisation des services communaux sénégalais (salubrité, mobilité, fiscalité locale) et structuration des startups technologiques jusqu'au transfert.",
    image: "/images/auth-incubateur.jpg",
    imageAlt:
      "Équipe d'entrepreneurs sénégalais et mentor évaluant un prototype fonctionnel à l'incubateur CIAT",
    enjeux:
      "Efficacité des services publics de proximité dans les pôles urbains émergents, économie circulaire municipale et création d'entreprises technologiques pérennes.",
    axes: [
      "Optimisation connectée de la collecte urbaine et équipements publics",
      "Digitalisation transparente des services communaux et marchés locaux",
      "Incubation certifiée en 5 jalons : idéation, MVP, PI OAPI et amorçage",
    ],
    prototypes: [
      "Dakar Waste Solutions",
      "SmartTax Collecte Locale",
      "Espaces marchands Diamniadio",
    ],
    atelier: "Incubateur CIAT, Living Lab Territorial & Coworking",
    equipements:
      "Plateau de coworking haut débit, salles de revue de jalons, guichet propriété intellectuelle OAPI et espace démonstrateur collectivités.",
  },
];

export default function DomainesShowcase() {
  const [activeIndex, setActiveIndex] = useState<number>(0);
  const [selectedDomaine, setSelectedDomaine] =
    useState<DomaineOfficiel | null>(null);
  const tabRefs = useRef<Array<HTMLButtonElement | null>>([]);

  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );

  // Synchronisation propre avec les ancres profondes #domaine-01 .. #domaine-07
  useEffect(() => {
    const syncFromHash = () => {
      const match = window.location.hash.match(/^#domaine-0([1-7])$/);
      if (match) {
        const idx = Number(match[1]) - 1;
        if (idx >= 0 && idx < DOMAINES_OFFICIELS.length) {
          setActiveIndex(idx);
        }
      }
    };
    const timer = window.setTimeout(syncFromHash, 0);
    window.addEventListener("hashchange", syncFromHash);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("hashchange", syncFromHash);
    };
  }, []);

  useEffect(() => {
    document.body.style.overflow = selectedDomaine ? "hidden" : "";
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setSelectedDomaine(null);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [selectedDomaine]);

  const handleTabKeyDown = (
    e: ReactKeyboardEvent<HTMLButtonElement>,
    index: number
  ) => {
    const total = DOMAINES_OFFICIELS.length;
    let nextIndex: number | null = null;

    if (e.key === "ArrowDown" || e.key === "ArrowRight") {
      nextIndex = (index + 1) % total;
    } else if (e.key === "ArrowUp" || e.key === "ArrowLeft") {
      nextIndex = (index - 1 + total) % total;
    } else if (e.key === "Home") {
      nextIndex = 0;
    } else if (e.key === "End") {
      nextIndex = total - 1;
    }

    if (nextIndex !== null) {
      e.preventDefault();
      setActiveIndex(nextIndex);
      tabRefs.current[nextIndex]?.focus();
    }
  };

  const activeDomaine = DOMAINES_OFFICIELS[activeIndex];

  return (
    <div className="ciat-domains-page selection:bg-[#C99A68]/30">
      {/* =====================================================================
       * ACTE I — HERO CINÉMATIQUE PLEIN ÉCRAN CALÉ À GAUCHE
       * Cohérence totale avec les pages Accueil, Le CIAT et L'Incubateur
       * ===================================================================== */}
      <section
        aria-labelledby="domaines-hero-heading"
        className="relative w-full min-h-[calc(100vh-72px)] flex items-center overflow-hidden bg-[#120A06]"
      >
        <Image
          src="/images/ciat-hero-electronique.jpg"
          alt="Chercheuse et ingénieur du CIAT assemblant un bras mécatronique et une carte électronique en laboratoire à Diamniadio"
          fill
          priority
          sizes="100vw"
          className="object-cover object-[center_26%]"
        />

        {/* Dégradé directionnel net : contraste intégral sur mobile, clarté photographique totale à droite sur grand écran */}
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-[#120A06]/72 lg:bg-transparent lg:bg-gradient-to-r lg:from-[#120A06]/92 lg:via-[#120A06]/68 lg:via-48% lg:to-transparent pointer-events-none"
        />
        <div
          aria-hidden="true"
          className="absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-[#120A06]/80 to-transparent pointer-events-none"
        />

        <div className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
          <div className="max-w-2xl lg:max-w-3xl flex flex-col items-start text-left">
            <h1
              id="domaines-hero-heading"
              className="font-[family-name:var(--font-jakarta)] text-3xl sm:text-5xl lg:text-6xl font-extrabold !text-white tracking-tight leading-[1.12]"
            >
              Sept domaines d’expertise au service d’un{" "}
              <span className="text-[#C99A68]">impact durable</span>
            </h1>

            <p className="mt-5 text-sm sm:text-base lg:text-lg text-white/90 max-w-2xl leading-relaxed font-normal">
              De l’intelligence artificielle embarquée à l’usinage 5 axes et à
              l’instrumentation biomédicale, le CIAT articule recherche
              appliquée, prototypage industriel et incubation autour de sept
              filières prioritaires à Diamniadio.
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-4">
              <a
                href="#pavillon-domaines"
                className="inline-flex items-center justify-center rounded-xl bg-[#612D10] hover:bg-[#7D3A15] px-7 py-3.5 text-xs sm:text-sm font-bold !text-white shadow-xl hover:shadow-2xl transition-all active:scale-95 border border-[#C99A68]/40"
              >
                Explorer les 7 filières
                <ArrowRight size={16} className="ml-2 text-[#C99A68]" />
              </a>

              <Link
                href="/galerie"
                className="inline-flex items-center justify-center rounded-xl border border-white/35 bg-white/10 hover:bg-white/20 px-7 py-3.5 text-xs sm:text-sm font-semibold !text-white transition-all active:scale-95"
              >
                Voir le showroom des prototypes
              </Link>
            </div>

            <div className="mt-12 pt-6 border-t border-white/15 flex flex-wrap items-center gap-6 text-xs text-white/80 font-medium">
              <span className="inline-flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-[#C99A68]" />
                07 Filières Statutaires
              </span>
              <span className="inline-flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-[#C99A68]" />
                04 Plateformes &amp; FabLabs 4.0
              </span>
              <span className="inline-flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-[#C99A68]" />
                Homologation TRL 1–8
              </span>
              <span className="inline-flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-[#C99A68]" />
                ISEP Amadou Trawaré • Diamniadio
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* =====================================================================
       * ACTE II — PAVILLON INTERACTIF MAÎTRE-DÉTAIL DES 7 FILIÈRES
       * ===================================================================== */}
      <section
        id="pavillon-domaines"
        aria-labelledby="pavillon-heading"
        className="scroll-mt-20 bg-white py-20 lg:py-28 border-b border-[#EFE4D6]"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-12 gap-8 items-end pb-10 border-b border-[#EFE4D6]">
            <div className="lg:col-span-7">
              <span className="dm-overline">
                Pavillon Sectoriel Interactif
              </span>
              <h2
                id="pavillon-heading"
                className="mt-3 font-[family-name:var(--font-jakarta)] text-2xl sm:text-3xl lg:text-4xl font-extrabold text-[#24140D] tracking-tight leading-[1.15]"
              >
                Inspectez chaque pôle d’ingénierie et ses bancs d’essai dédiés
              </h2>
            </div>

            <p className="lg:col-span-5 text-sm sm:text-[15px] text-[#5C4B3E] leading-relaxed m-0">
              Sélectionnez une filière dans le répertoire pour consulter ses
              enjeux prioritaires au Sénégal, ses trois axes de recherche
              appliquée et ses prototypes certifiés.
            </p>
          </div>

          <div className="mt-12 grid lg:grid-cols-12 gap-10 lg:gap-12 items-start">
            {/* Colonne Gauche (5/12) : Répertoire Architectural numéroté 01–07 */}
            <div className="lg:col-span-5">
              <div
                role="tablist"
                aria-orientation="vertical"
                aria-label="Répertoire des 7 filières officielles du CIAT"
                className="dm-master-list"
              >
                {DOMAINES_OFFICIELS.map((dom, idx) => {
                  const isActive = idx === activeIndex;
                  return (
                    <button
                      key={dom.numero}
                      ref={(el) => {
                        tabRefs.current[idx] = el;
                      }}
                      type="button"
                      role="tab"
                      id={`pavillon-tab-${dom.numero}`}
                      aria-selected={isActive}
                      aria-controls="pavillon-stage-panel"
                      tabIndex={isActive ? 0 : -1}
                      onClick={() => {
                        setActiveIndex(idx);
                        if (typeof window !== "undefined" && window.innerWidth < 1024) {
                          document
                            .getElementById("pavillon-stage-panel")
                            ?.scrollIntoView({ behavior: "smooth", block: "start" });
                        }
                      }}
                      onKeyDown={(e) => handleTabKeyDown(e, idx)}
                      className="dm-master-tab"
                    >
                      <span className="dm-tab-num">{dom.numero}</span>
                      <span className="min-w-0">
                        <span className="dm-tab-title">{dom.titre}</span>
                        <span className="dm-tab-sub">{dom.atelier}</span>
                      </span>
                      <span className="dm-tab-arrow" aria-hidden="true">
                        <ArrowRight size={15} />
                      </span>
                    </button>
                  );
                })}
              </div>

              <div className="mt-5 flex items-center justify-between text-xs text-[#5C4B3E] px-1">
                <span>Navigation clavier (↑ / ↓) ou clic direct</span>
                <a
                  href="#atlas-domaines"
                  className="font-bold text-[#612D10] hover:underline"
                >
                  Vue synoptique des 7 pôles ↓
                </a>
              </div>
            </div>

            {/* Colonne Droite (7/12) : Grand Pavillon Immersif */}
            <div
              id="pavillon-stage-panel"
              role="tabpanel"
              aria-labelledby={`pavillon-tab-${activeDomaine.numero}`}
              className="scroll-mt-24 lg:col-span-7 lg:sticky lg:top-24"
            >
              <article className="dm-pavilion-stage">
                {/* Cadre photographique 16:9 haute définition */}
                <div className="relative aspect-[16/9] w-full overflow-hidden bg-[#160C07]">
                  <Image
                    key={activeDomaine.numero}
                    src={activeDomaine.image}
                    alt={activeDomaine.imageAlt}
                    fill
                    sizes="(max-width: 1024px) 100vw, 58vw"
                    className="object-cover dm-stage-photo-anim"
                  />
                  <div
                    aria-hidden="true"
                    className="absolute inset-0 bg-gradient-to-t from-[#140A06]/85 via-[#140A06]/15 to-transparent pointer-events-none"
                  />

                  <div className="absolute inset-x-5 sm:inset-x-8 bottom-5 sm:bottom-6 z-10 flex flex-wrap items-end justify-between gap-3">
                    <div>
                      <span className="block font-[family-name:var(--font-jakarta)] text-[10.5px] font-extrabold uppercase tracking-[0.18em] text-[#E2B483]">
                        Filière Officielle {activeDomaine.numero} / 07
                      </span>
                      <span className="mt-0.5 block text-xs sm:text-sm font-semibold text-white">
                        {activeDomaine.atelier}
                      </span>
                    </div>

                    <span className="rounded-full border border-white/25 bg-black/45 backdrop-blur-md px-3 py-1 text-[11px] font-bold tracking-wider uppercase text-white">
                      Homologation TRL 1–8
                    </span>
                  </div>
                </div>

                {/* Fiche éditoriale épurée */}
                <div className="p-6 sm:p-8 lg:p-9">
                  <h3 className="font-[family-name:var(--font-jakarta)] text-xl sm:text-2xl lg:text-[26px] font-extrabold text-[#24140D] leading-snug tracking-tight m-0">
                    {activeDomaine.titre}
                  </h3>

                  <p className="mt-3 text-sm sm:text-[15px] text-[#5C4B3E] leading-relaxed m-0">
                    {activeDomaine.enjeux}
                  </p>

                  {/* 3 Axes de recherche appliquée en grille architecturale */}
                  <div className="mt-7 pt-6 border-t border-[#EFE4D6]">
                    <span className="block font-[family-name:var(--font-jakarta)] text-[10.5px] font-extrabold uppercase tracking-[0.16em] text-[#612D10] mb-4">
                      Axes Prioritaires R&amp;D &amp; Prototypage
                    </span>

                    <div className="dm-axes-grid">
                      {activeDomaine.axes.map((axe, i) => (
                        <div key={axe} className="dm-axe-col">
                          <span className="dm-axe-index">
                            {activeDomaine.numero}.0{i + 1}
                          </span>
                          <p className="text-[13px] text-[#24140D] font-medium leading-relaxed m-0">
                            {axe}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Pied du pavillon : prototypes témoins + actions */}
                  <div className="mt-7 pt-6 border-t border-[#EFE4D6] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="text-xs text-[#5C4B3E] leading-relaxed">
                      <span className="font-extrabold uppercase tracking-wider text-[#24140D] mr-2">
                        Prototypes :
                      </span>
                      {activeDomaine.prototypes.join(" · ")}
                    </div>

                    <div className="flex flex-wrap items-center gap-2.5 shrink-0">
                      <button
                        type="button"
                        onClick={() => setSelectedDomaine(activeDomaine)}
                        className="inline-flex items-center justify-center rounded-xl border border-[#DFCDB9] bg-[#FAF7F2] hover:bg-[#EFE4D6] px-4 py-2.5 text-xs font-bold text-[#24140D] transition cursor-pointer"
                      >
                        Équipements &amp; fiche
                      </button>

                      <Link
                        href={`/galerie?domaine=${activeDomaine.galerieCode}`}
                        className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-[#612D10] hover:bg-[#7D3A15] border border-[#C99A68]/40 px-4 py-2.5 text-xs font-bold !text-white transition"
                      >
                        Voir en galerie
                        <ArrowRight size={14} />
                      </Link>
                    </div>
                  </div>
                </div>
              </article>
            </div>
          </div>
        </div>
      </section>

      {/* =====================================================================
       * ACTE III — ATLAS SYNOPTIQUE BENTO DES 7 FILIÈRES (#domaine-01..07)
       * ===================================================================== */}
      <section
        id="atlas-domaines"
        aria-labelledby="atlas-heading"
        className="scroll-mt-20 bg-[#FAF7F2] py-20 lg:py-28"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
            <div className="max-w-2xl">
              <span className="dm-overline">
                Atlas Synoptique · 01 à 07
              </span>
              <h2
                id="atlas-heading"
                className="mt-3 font-[family-name:var(--font-jakarta)] text-2xl sm:text-3xl lg:text-4xl font-extrabold text-[#24140D] tracking-tight leading-[1.15]"
              >
                Vue d’ensemble des sept filières statutaires
              </h2>
            </div>

            <Link
              href="/galerie"
              className="inline-flex items-center gap-2 self-start md:self-auto rounded-xl border border-[#DFCDB9] bg-white hover:bg-[#EFE4D6] px-5 py-3 text-xs sm:text-sm font-bold !text-[#24140D] transition"
            >
              Parcourir tous les prototypes homologués
              <ArrowUpRight size={16} className="text-[#612D10]" />
            </Link>
          </div>

          <div className="dm-bento-grid">
            {DOMAINES_OFFICIELS.map((dom, idx) => {
              const isSelectedInPavilion = idx === activeIndex;
              return (
                <article
                  key={dom.numero}
                  id={`domaine-${dom.numero}`}
                  className={`dm-bento-card ${dom.bentoSpan} ${
                    isSelectedInPavilion ? "dm-bento-card-active" : ""
                  }`}
                >
                  <div>
                    <div className="dm-bento-media">
                      <Image
                        src={dom.image}
                        alt={dom.imageAlt}
                        fill
                        sizes="(max-width: 680px) 100vw, (max-width: 1024px) 50vw, 45vw"
                      />
                      <span className="dm-bento-num-tag">
                        Pôle {dom.numero}
                      </span>
                    </div>

                    <div className="p-6 pb-4">
                      <span className="block font-[family-name:var(--font-jakarta)] text-[11px] font-extrabold uppercase tracking-[0.14em] text-[#612D10]">
                        {dom.shortLabel}
                      </span>

                      <h3 className="mt-2 font-[family-name:var(--font-jakarta)] text-lg sm:text-[19px] font-extrabold text-[#24140D] leading-snug tracking-tight">
                        {dom.titre}
                      </h3>

                      <p className="mt-2.5 text-[13.5px] text-[#5C4B3E] leading-relaxed line-clamp-2 m-0">
                        {dom.description}
                      </p>
                    </div>
                  </div>

                  <div className="px-6 pb-6 pt-4 mt-2 border-t border-[#F2EAE0] flex items-center justify-between gap-3">
                    <button
                      type="button"
                      onClick={() => setSelectedDomaine(dom)}
                      className="text-xs font-bold text-[#24140D] hover:text-[#612D10] transition cursor-pointer bg-transparent border-0 p-0"
                    >
                      Fiche technique complète
                    </button>

                    <Link
                      href={`/galerie?domaine=${dom.galerieCode}`}
                      className="inline-flex items-center gap-1 text-xs font-extrabold !text-[#612D10] hover:!text-[#24140D] transition"
                    >
                      Prototypes
                      <ArrowUpRight size={14} />
                    </Link>
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      {/* =====================================================================
       * ACTE IV — BANDEAU DE CLÔTURE INSTITUTIONNEL SOBRE (BRUN NUIT #24140D)
       * ===================================================================== */}
      <section
        aria-labelledby="domaines-closing-heading"
        className="bg-[#24140D] text-white py-20 lg:py-24 border-t border-[#C99A68]/25"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-12 gap-10 lg:gap-14 items-center">
            <div className="lg:col-span-7">
              <span className="dm-overline dm-overline-light">
                Incubation &amp; Transfert Technologique
              </span>

              <h2
                id="domaines-closing-heading"
                className="mt-3 font-[family-name:var(--font-jakarta)] text-2xl sm:text-3xl lg:text-4xl font-extrabold !text-white tracking-tight leading-[1.16]"
              >
                Votre innovation s’inscrit dans l’une de nos{" "}
                <span className="text-[#C99A68]">sept filières ?</span>
              </h2>

              <p className="mt-4 text-sm sm:text-base text-white/80 max-w-xl leading-relaxed">
                Accédez aux plateformes d’usinage CNC, aux bancs solaires et
                biomédicaux ainsi qu’à l’accompagnement certifié en 5 jalons du
                comité scientifique de Diamniadio.
              </p>

              <div className="mt-8 flex flex-wrap items-center gap-4">
                <Link
                  href="/portail/appels"
                  className="inline-flex items-center justify-center rounded-xl bg-[#612D10] hover:bg-[#7D3A15] px-7 py-3.5 text-xs sm:text-sm font-bold !text-white shadow-xl transition-all border border-[#C99A68]/40"
                >
                  Candidater à l’appel en cours
                  <ArrowRight size={16} className="ml-2 text-[#C99A68]" />
                </Link>

                <Link
                  href="/portail/ciat#ateliers"
                  className="inline-flex items-center justify-center rounded-xl border border-white/30 bg-white/5 hover:bg-white/15 px-6 py-3.5 text-xs sm:text-sm font-semibold !text-white transition-all"
                >
                  Découvrir nos plateaux techniques
                </Link>
              </div>
            </div>

            <div className="lg:col-span-5">
              <div className="relative aspect-[16/10] w-full rounded-2xl overflow-hidden border border-[#C99A68]/35 shadow-2xl bg-[#160C07]">
                <Image
                  src="/images/domaines_ecosystem_building_hd.jpg"
                  alt="Campus architectural du Centre d'Innovation Technologique CIAT à Diamniadio"
                  fill
                  sizes="(max-width: 1024px) 100vw, 42vw"
                  className="object-cover"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =====================================================================
       * MODALE FICHE TECHNIQUE COMPLÈTE DE FILIÈRE
       * ===================================================================== */}
      {selectedDomaine &&
        mounted &&
        createPortal(
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="domaine-modal-title"
            className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6 bg-black/75 backdrop-blur-sm overflow-y-auto"
            onClick={() => setSelectedDomaine(null)}
          >
            <div
              className="relative w-full max-w-2xl bg-white rounded-3xl overflow-hidden shadow-2xl border border-[#E5D7C6] my-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="relative h-52 w-full bg-[#24140D]">
                <Image
                  src={selectedDomaine.image}
                  alt={selectedDomaine.imageAlt}
                  fill
                  sizes="680px"
                  className="object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#24140D] via-[#24140D]/45 to-transparent" />

                <button
                  type="button"
                  onClick={() => setSelectedDomaine(null)}
                  aria-label="Fermer la fiche technique"
                  className="absolute top-4 right-4 h-10 w-10 rounded-full bg-black/60 text-white hover:bg-[#612D10] flex items-center justify-center transition cursor-pointer"
                >
                  <X size={18} />
                </button>

                <div className="absolute bottom-5 left-6 right-6 text-white">
                  <span className="inline-block text-[11px] font-extrabold uppercase tracking-widest text-[#E2B483] mb-1">
                    Filière Officielle {selectedDomaine.numero} ·{" "}
                    {selectedDomaine.shortLabel}
                  </span>
                  <h3
                    id="domaine-modal-title"
                    className="font-[family-name:var(--font-jakarta)] text-2xl sm:text-3xl font-extrabold !text-white leading-tight"
                  >
                    {selectedDomaine.titre}
                  </h3>
                </div>
              </div>

              <div className="p-6 sm:p-8 space-y-5 text-[#24140D]">
                <div className="rounded-2xl bg-[#FAF7F2] border border-[#E5D7C6] p-4 sm:p-5">
                  <span className="block text-[11px] font-extrabold uppercase tracking-wider text-[#612D10] mb-1.5">
                    Enjeux Stratégiques Prioritaires au Sénégal
                  </span>
                  <p className="text-xs sm:text-sm leading-relaxed text-[#4A3A2E] m-0">
                    {selectedDomaine.enjeux}
                  </p>
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="rounded-2xl border border-[#EFE4D6] p-4">
                    <span className="block text-[11px] font-extrabold uppercase tracking-wider text-[#612D10] mb-2">
                      Plateau Technique Dédié
                    </span>
                    <p className="text-sm font-bold text-[#24140D] m-0">
                      {selectedDomaine.atelier}
                    </p>
                    <p className="text-xs text-[#5C4B3E] leading-relaxed mt-1.5 mb-0">
                      {selectedDomaine.equipements}
                    </p>
                  </div>

                  <div className="rounded-2xl border border-[#EFE4D6] p-4">
                    <span className="block text-[11px] font-extrabold uppercase tracking-wider text-[#612D10] mb-2">
                      Axes R&amp;D Accompagnés
                    </span>
                    <ul className="space-y-2 m-0 p-0 list-none">
                      {selectedDomaine.axes.map((axe) => (
                        <li
                          key={axe}
                          className="flex items-start gap-2 text-xs text-[#4A3A2E] leading-snug"
                        >
                          <CheckCircle2
                            size={14}
                            className="text-[#612D10] shrink-0 mt-0.5"
                          />
                          <span>{axe}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div className="pt-4 border-t border-[#EFE4D6] flex flex-wrap items-center justify-between gap-3">
                  <Link
                    href={`/galerie?domaine=${selectedDomaine.galerieCode}`}
                    onClick={() => setSelectedDomaine(null)}
                    className="inline-flex items-center gap-2 rounded-xl border border-[#E5D7C6] bg-[#FAF7F2] hover:bg-[#EFE4D6] px-4 py-3 text-xs font-bold !text-[#24140D] transition"
                  >
                    Explorer les prototypes du pôle {selectedDomaine.numero}
                    <ArrowUpRight size={14} />
                  </Link>

                  <Link
                    href="/portail/appels"
                    onClick={() => setSelectedDomaine(null)}
                    className="inline-flex items-center gap-2 rounded-xl bg-[#612D10] hover:bg-[#7D3A15] border border-[#C99A68]/40 px-5 py-3 text-xs font-bold !text-white transition"
                  >
                    Candidater dans cette filière
                    <ArrowRight size={14} />
                  </Link>
                </div>
              </div>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
}
