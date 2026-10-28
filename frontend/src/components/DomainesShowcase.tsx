"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import {
  ArrowRight,
  ArrowUpRight,
  Building2,
  CheckCircle2,
  Cog,
  Cpu,
  GraduationCap,
  HeartPulse,
  Layers,
  MapPin,
  Sprout,
  SunMedium,
  X,
  type LucideIcon,
} from "lucide-react";
import type { DomaineCode } from "@/app/galerie/galerie-visuals";
import "./domaines.css";

interface DomaineOfficiel {
  numero: string;
  galerieCode: Exclude<DomaineCode, "tous">;
  shortLabel: string;
  titre: string;
  description: string;
  image: string;
  imageAlt: string;
  Icon: LucideIcon;
  enjeux: string;
  axes: string[];
  prototypes: string[];
  atelier: string;
  equipements: string;
}

const DOMAINES_OFFICIELS: DomaineOfficiel[] = [
  {
    numero: "01",
    galerieCode: "numerique",
    shortLabel: "Numérique & IA",
    titre: "TIC, numérique, intelligence artificielle et données",
    description:
      "Concevoir des architectures logicielles souveraines, des modèles d'IA embarquée et des systèmes de données adaptés aux réalités économiques et linguistiques du Sénégal.",
    image: "/images/domaine_01_tic_hd.jpg",
    imageAlt:
      "Ingénieur en intelligence artificielle et science des données au laboratoire numérique du CIAT",
    Icon: Cpu,
    enjeux:
      "Souveraineté numérique nationale, valorisation des données agricoles et territoriales sénégalaises, traitement automatique des langues nationales (Wolof, Pulaar, Sérère) et cybersécurité des infrastructures critiques.",
    axes: [
      "Vision par ordinateur embarquée & diagnostic terrain hors-ligne",
      "Traitement vocal en langues nationales (NLP) pour services essentiels",
      "Plateformes infonuagiques souveraines, IoT LoRaWAN & cybersécurité",
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
    titre: "Mécanique, fabrication et maintenance",
    description:
      "industrialiser localement les pièces critiques de rechange, outillages et machines agroalimentaires grâce à l'usinage numérique de haute précision et la rétro-ingénierie 3D.",
    image: "/images/innovations/cnc-4-0-clean.jpg",
    imageAlt:
      "Centre d'usinage numérique CNC 5 axes haute précision au sein du FabLab 4.0 du CIAT",
    Icon: Cog,
    enjeux:
      "Réduction drastique des arrêts de lignes industrielles liés à l'importation de pièces détachées, standardisation qualité des équipements fabriqués au Sénégal et maintenance prédictive.",
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
    titre: "Agriculture, transformation et environnement",
    description:
      "Sécuriser les rendements maraîchers et céréaliers tout en réduisant les pertes post-récolte par l'irrigation pilotée par capteurs et les procédés propres de conservation.",
    image: "/images/innovations/agrisol-iot.jpg",
    imageAlt:
      "Station connectée solaire de suivi hydrique et agronomique déployée en plein champ",
    Icon: Sprout,
    enjeux:
      "Résilience climatique des bassins agricoles (Niayes, Vallée du Fleuve, Casamance), économie de 40 % sur la ressource hydrique et valorisation à haute valeur ajoutée des productions locales.",
    axes: [
      "Irrigation goutte-à-goutte automatisée par sondes capacitives solaires",
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
    titre: "Énergie, efficacité énergétique et énergies renouvelables",
    description:
      "Déployer des micro-réseaux photovoltaïques intelligents, des systèmes de stockage résilients et des équipements frigorifiques solaires pour l'autonomie productive des territoires.",
    image: "/images/domaine-energie.jpg",
    imageAlt:
      "Installation solaire autonome avec capteurs de télémesure énergétique en environnement sahélien",
    Icon: SunMedium,
    enjeux:
      "Électrification productive des zones rurales hors-réseau, maîtrise de la chaîne du froid solaire pour l'agriculture et la pêche, et optimisation énergétique des bâtiments tertiaires.",
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
    titre: "Pharmaceutique et biomédical",
    description:
      "Concevoir des dispositifs médicaux robustes, réparables localement et adaptés aux postes de santé isolés, ainsi que des procédés de valorisation biopharmaceutique.",
    image: "/images/innovations/telemedical-device.jpg",
    imageAlt:
      "Moniteur physiologique portable et banc d'instrumentation électronique biomédicale au CIAT",
    Icon: HeartPulse,
    enjeux:
      "Équité d'accès au diagnostic précoce dans les zones éloignées, souveraineté en équipements hospitaliers de première nécessité et maintenance biomédicale préventive.",
    axes: [
      "Valises de télédiagnostic connectées (ECG, SpO2, auscultation numérique)",
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
    shortLabel: "Éducation & VR",
    titre: "Éducation, formation professionnelle et insertion",
    description:
      "Démultiplier l'apprentissage des métiers techniques et industriels par les jumeaux numériques, la réalité virtuelle d'atelier et des kits robotiques conçus au Sénégal.",
    image: "/images/domaine-education.jpg",
    imageAlt:
      "Apprenants et ingénieurs collaborant au sein de l'espace d'ingénierie pédagogique du CIAT",
    Icon: GraduationCap,
    enjeux:
      "Adéquation immédiate entre la formation professionnelle (ISEP, lycées techniques) et les standards de l'industrie 4.0, tout en sécurisant l'entraînement sur équipements coûteux.",
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
    shortLabel: "Collectivités & Impact",
    titre: "Services aux collectivités, entrepreneuriat et incubation",
    description:
      "Accompagner la modernisation des communes sénégalaises (mobilité, salubrité, fiscalité locale) et structurer les jeunes pousses jusqu'à leur passage à l'échelle.",
    image: "/images/auth-incubateur.jpg",
    imageAlt:
      "Équipe d'entrepreneurs sénégalais et mentor évaluant un prototype fonctionnel à l'incubateur CIAT",
    Icon: Building2,
    enjeux:
      "Efficacité des services publics de proximité dans les pôles urbains émergents, économie circulaire municipale et création d'entreprises technologiques pérennes.",
    axes: [
      "Optimisation connectée de la collecte des déchets et équipements urbains",
      "Digitalisation transparente des services communaux et marchés publics",
      "Incubation certifiée en 5 jalons : idéation, MVP, PI et levée d'amorçage",
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
  const [selectedDomaine, setSelectedDomaine] =
    useState<DomaineOfficiel | null>(null);

  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );

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

  return (
    <div className="ciat-domains-root">
      {/* =====================================================================
       * 1. HERO ARCHITECTURAL MONUMENTAL
       * ===================================================================== */}
      <section className="d-hero" aria-labelledby="domaines-hero-title">
        <div className="d-hero-copy">
          <div className="d-eyebrow">
            <span className="d-eyebrow-line" />
            <span className="d-eyebrow-text">
              Référentiel Officiel · 7 Filières CIAT
            </span>
          </div>

          <h1 id="domaines-hero-title" className="d-hero-title">
            Sept pôles d&apos;excellence pour{" "}
            <span>bâtir l&apos;impact industriel.</span>
          </h1>

          <p className="d-hero-lead">
            À la Cité du Savoir de Diamniadio, le CIAT articule recherche
            appliquée, usinage de haute précision et incubation entrepreneuriale
            autour de sept filières prioritaires pour la souveraineté
            technologique du Sénégal.
          </p>

          <div className="d-hero-actions">
            <a href="#referentiel-domaines" className="d-btn-gold">
              Explorer les 7 filières
              <ArrowRight size={16} />
            </a>
            <Link href="/galerie" className="d-btn-ghost-light">
              Voir les prototypes homologués
              <ArrowUpRight size={16} />
            </Link>
          </div>

          <div className="d-hero-kpis">
            <div className="d-kpi">
              <strong>07</strong>
              <span>Filières officielles d&apos;intervention</span>
            </div>
            <div className="d-kpi">
              <strong>04</strong>
              <span>Plateformes &amp; FabLabs industriels</span>
            </div>
            <div className="d-kpi">
              <strong>TRL 1–8</strong>
              <span>De l&apos;idéation au transfert certifié</span>
            </div>
          </div>
        </div>

        <div className="d-hero-media">
          <Image
            src="/images/ciat-hero-electronique.jpg"
            alt="Chercheurs et ingénieurs du CIAT assemblant un bras mécatronique et une carte électronique en laboratoire à Diamniadio"
            fill
            priority
            sizes="(max-width: 1040px) 100vw, 50vw"
          />
          <div className="d-hero-media-shade" aria-hidden="true" />

          <div className="d-hero-plaque">
            <div className="d-plaque-meta">
              <span>ISEP Amadou Trawaré · Diamniadio</span>
              <strong>
                Laboratoires d&apos;Ingénierie &amp; Prototypage Multidisciplinaire
              </strong>
            </div>
            <div className="d-plaque-tags">
              <span>Innover</span>
              <span>Former</span>
              <span>Incuber</span>
              <span>Transférer</span>
            </div>
          </div>
        </div>
      </section>

      {/* =====================================================================
       * 2. INDEX D'ACCÈS RAPIDE AUX 7 FILIÈRES (STICKY)
       * ===================================================================== */}
      <nav
        className="d-quicknav-wrap"
        aria-label="Accès direct aux 7 filières du CIAT"
      >
        <div className="d-quicknav">
          {DOMAINES_OFFICIELS.map((dom) => {
            const Icon = dom.Icon;
            return (
              <a
                key={dom.numero}
                href={`#domaine-${dom.numero}`}
                className="d-quicknav-pill"
              >
                <span className="d-quicknav-num">{dom.numero}</span>
                <Icon size={14} className="text-[#612D10]" />
                <span>{dom.shortLabel}</span>
              </a>
            );
          })}
        </div>
      </nav>

      {/* =====================================================================
       * 3. LES 7 DOSSIERS DE FILIÈRES D'EXCELLENCE
       * ===================================================================== */}
      <section
        className="d-section"
        id="referentiel-domaines"
        aria-labelledby="referentiel-heading"
      >
        <header className="d-section-header">
          <div>
            <div className="d-eyebrow" style={{ marginBottom: 6 }}>
              <span
                className="d-eyebrow-line"
                style={{ background: "#612D10" }}
              />
              <span
                className="d-eyebrow-text"
                style={{ color: "#612D10" }}
              >
                Architecture Sectorielle CIAT 360
              </span>
            </div>
            <h2 id="referentiel-heading" className="d-section-title">
              Sept filières complémentaires, une même exigence d&apos;impact
            </h2>
          </div>

          <p className="d-section-intro">
            Chaque domaine dispose d&apos;ateliers dédiés, d&apos;encadrants techniques
            spécialisés et d&apos;un portefeuille de prototypes vérifiés directement
            consultables dans le showroom officiel.
          </p>
        </header>

        <div className="d-dossiers-stack">
          {DOMAINES_OFFICIELS.map((dom, index) => {
            const Icon = dom.Icon;
            const isReverse = index % 2 === 1;
            const formattedDescription =
              dom.description.charAt(0).toUpperCase() +
              dom.description.slice(1);

            return (
              <article
                key={dom.numero}
                id={`domaine-${dom.numero}`}
                className={`d-dossier-card ${
                  isReverse ? "d-dossier-reverse" : ""
                }`}
              >
                <div className="d-dossier-visual">
                  <Image
                    src={dom.image}
                    alt={dom.imageAlt}
                    fill
                    sizes="(max-width: 1040px) 100vw, 48vw"
                  />
                  <div className="d-dossier-visual-shade" aria-hidden="true" />

                  <span className="d-dossier-num-badge">
                    Filière {dom.numero} · {dom.shortLabel}
                  </span>
                </div>

                <div className="d-dossier-body">
                  <div>
                    <div className="d-dossier-topline">
                      <div className="d-dossier-icon-box">
                        <Icon size={22} />
                      </div>
                      <span className="d-dossier-big-num" aria-hidden="true">
                        {dom.numero}
                      </span>
                    </div>

                    <h3 className="d-dossier-title">{dom.titre}</h3>

                    <p className="d-dossier-desc">{formattedDescription}</p>

                    <div className="mb-5 inline-flex items-center gap-2 rounded-xl bg-[#FAF7F2] border border-[#EFE4D6] px-3.5 py-2 text-xs font-semibold text-[#612D10]">
                      <MapPin size={14} className="shrink-0" />
                      <span>{dom.atelier}</span>
                    </div>

                    <div className="d-proto-row">
                      <span className="d-proto-label">Prototypes phares :</span>
                      {dom.prototypes.map((proto) => (
                        <span key={proto} className="d-proto-chip">
                          {proto}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="d-dossier-actions">
                    <button
                      type="button"
                      onClick={() => setSelectedDomaine(dom)}
                      className="d-btn-outline"
                    >
                      Fiche technique complète
                      <Layers size={15} />
                    </button>

                    <Link
                      href={`/galerie?domaine=${dom.galerieCode}`}
                      className="d-btn-solid"
                    >
                      Voir les projets en galerie
                      <ArrowRight size={15} />
                    </Link>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </section>

      {/* =====================================================================
       * 4. BANDEAU DE CLÔTURE INSTITUTIONNEL
       * ===================================================================== */}
      <section className="d-closing" aria-labelledby="closing-heading">
        <div className="d-closing-inner">
          <div>
            <div className="d-eyebrow">
              <span className="d-eyebrow-line" />
              <span className="d-eyebrow-text">
                Rejoindre l&apos;Écosystème CIAT
              </span>
            </div>

            <h2 id="closing-heading" className="d-closing-title">
              Votre projet s&apos;inscrit dans l&apos;une de nos{" "}
              <span>sept filières ?</span>
            </h2>

            <p className="d-closing-lead">
              Bénéficiez de nos bancs d&apos;usinage, de nos laboratoires solaires et
              biomédicaux ainsi que de l&apos;accompagnement du comité scientifique
              de Diamniadio pour franchir les jalons d&apos;homologation.
            </p>

            <div className="flex flex-wrap gap-3.5">
              <Link href="/portail/appels" className="d-btn-gold">
                Candidater à l&apos;appel en cours
                <ArrowRight size={16} />
              </Link>
              <Link href="/portail/ciat" className="d-btn-ghost-light">
                Découvrir nos infrastructures
              </Link>
            </div>
          </div>

          <div className="d-closing-photo-frame">
            <Image
              src="/images/ciat-batiment.jpg"
              alt="Façade architecturale du Centre d'Innovation Technologique CIAT à Diamniadio"
              fill
              sizes="(max-width: 1040px) 100vw, 45vw"
            />
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
                  <span className="inline-block text-[11px] font-extrabold uppercase tracking-widest text-[#DFae79] mb-1">
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
                      Atelier &amp; Plateau Dédié
                    </span>
                    <p className="text-sm font-bold text-[#24140D] m-0">
                      {selectedDomaine.atelier}
                    </p>
                    <p className="text-xs text-[#655346] leading-relaxed mt-1.5 mb-0">
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
                    href="/connexion?next=/incubateur"
                    onClick={() => setSelectedDomaine(null)}
                    className="inline-flex items-center gap-2 rounded-xl bg-[#612D10] hover:bg-[#24140D] px-5 py-3 text-xs font-bold !text-white transition"
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
