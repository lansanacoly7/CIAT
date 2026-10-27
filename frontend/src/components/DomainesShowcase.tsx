"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Cpu,
  Wrench,
  Sprout,
  Zap,
  HeartPulse,
  GraduationCap,
  Building2,
  ArrowRight,
  CheckCircle2,
  ExternalLink,
  ShieldCheck,
  Layers,
  Sparkles,
} from "lucide-react";

export interface DomaineData {
  id: number;
  slug: string;
  code: string;
  nomCourt: string;
  nomComplet: string;
  icone: typeof Cpu;
  badge: string;
  photo: string;
  enjeux: string;
  axesPrioritaires: string[];
  prototypesCiat: { nom: string; tag: string }[];
  atelierAssocie: string;
  impactNational: string;
}

export const DOMAINES_DATA: DomaineData[] = [
  {
    id: 1,
    slug: "tic-ia-donnees",
    code: "01",
    nomCourt: "TIC, IA & Données",
    nomComplet: "TIC, Numérique, Intelligence Artificielle et Valorisation des Données",
    icone: Cpu,
    badge: "Pôle Numérique 4.0",
    photo: "/images/galerie_moments/collaboration-numerique.jpg",
    enjeux:
      "Accélération de la transformation numérique au Sénégal, souveraineté des données, modèles de langage adaptés aux langues nationales (Wolof, Pulaar, Sérère) et vision par ordinateur appliquée aux enjeux locaux.",
    axesPrioritaires: [
      "Intelligence artificielle embarquée & Edge computing pour capteurs",
      "Cybersécurité industrielle et plateformes logicielles souveraines",
      "Traitement du langage naturel (NLP) pour services publics décentralisés",
    ],
    prototypesCiat: [
      { nom: "SunuAgri AI", tag: "Vision IA & Maladies Maraîchères" },
      { nom: "Jumeau Numérique ISEP", tag: "Maintenance Prédictive Ateliers" },
      { nom: "Guichet Numérique Communal", tag: "Fiscalité & Démarches" },
    ],
    atelierAssocie: "Laboratoire Calcul Haute Performance & IA",
    impactNational: "Souveraineté des données publiques et automatisation des services vitaux.",
  },
  {
    id: 2,
    slug: "mecanique-fabrication",
    code: "02",
    nomCourt: "Mécanique & Industrie 4.0",
    nomComplet: "Mécanique de Précision, Usinage Numérique et Fabrication Additive",
    icone: Wrench,
    badge: "Pôle Industrie & CAO",
    photo: "/images/galerie_moments/usinage-mecanique.jpg",
    enjeux:
      "Rupture de la dépendance aux importations de pièces détachées industrielles grâce à l'usinage numérique de précision CNC, au prototypage rapide et à la fabrication additive sur métaux et polymères.",
    axesPrioritaires: [
      "Centres d'usinage numérique CNC 4 et 5 axes haute fidélité",
      "Découpe laser industrielle et gravure de profilés mécaniques",
      "Fabrication additive (impression 3D) pour pièces de maintenance critique",
    ],
    prototypesCiat: [
      { nom: "Fraiseuse CNC 4.0 Locale", tag: "Usinage Pièces PME" },
      { nom: "Presse Oléagineuse Compacte", tag: "Extraction Huile Arachide" },
      { nom: "Bancs d'Essai Mécaniques", tag: "Contrôle Qualité Usines" },
    ],
    atelierAssocie: "FabLab 4.0 & Ateliers Usinage Lourd",
    impactNational: "Réduction des arrêts d'usines et substitution locale des pièces importées.",
  },
  {
    id: 3,
    slug: "agritech-environnement",
    code: "03",
    nomCourt: "AgriTech & Alimentation",
    nomComplet: "Technologies Agricoles, Transformation Agroalimentaire et Écologie",
    icone: Sprout,
    badge: "Pôle Souveraineté Alimentaire",
    photo: "/images/galerie_moments/hydroponie-serre.jpg",
    enjeux:
      "Sécurité alimentaire durable par la maîtrise de l'eau, la réduction des pertes post-récolte (estimées à plus de 30% en Afrique de l'Ouest) et la mécanisation propre des filières céréalières et maraîchères.",
    axesPrioritaires: [
      "Irrigation intelligente goutte-à-goutte pilotée par sondes tensiométriques",
      "Serres hydroponiques bioclimatiques à basse consommation d'eau",
      "Séchoirs solaires automatisés et unités compactes de conservation",
    ],
    prototypesCiat: [
      { nom: "AgriSol IoT", tag: "Station Agrométéo & Pilotage Eau" },
      { nom: "Éco-Séchoir Hybride", tag: "Séchage Solaire Mangues & Céréales" },
      { nom: "SmartIrrig Saloum", tag: "Vannes Automatisées IoT" },
    ],
    atelierAssocie: "Serres Expérimentales & Laboratoire Bio-Industries",
    impactNational: "Valorisation de la production maraîchère des Niayes et de la Vallée.",
  },
  {
    id: 4,
    slug: "energies-renouvelables",
    code: "04",
    nomCourt: "Énergies & Réseaux Propres",
    nomComplet: "Énergies Renouvelables, Efficacité Énergétique et Réseaux Intelligents",
    icone: Zap,
    badge: "Pôle Transition Énergétique",
    photo: "/images/galerie_moments/solaire-campus.jpg",
    enjeux:
      "Exploitation optimale de l'irradiance solaire exceptionnelle du Sénégal, stabilisation des micro-réseaux ruraux autonomes et intégration de systèmes de stockage d'énergie durables.",
    axesPrioritaires: [
      "Bancs de caractérisation et certification des cellules photovoltaïques",
      "Systèmes hybrides solaire-éolien avec stockage batteries intelligent",
      "Monitoring en temps réel de l'empreinte carbone et micro-grids décentralisés",
    ],
    prototypesCiat: [
      { nom: "SunuGrid Micro-Réseau", tag: "Gestion Intelligente Pay-As-You-Go" },
      { nom: "Éolienne Multipale Sahélienne", tag: "Pompage Hydraulique Décentralisé" },
      { nom: "Bancs Solaires Connectés", tag: "Endurance Climatique Poussière" },
    ],
    atelierAssocie: "Plateforme Solaire Extérieure & Laboratoire Énergies",
    impactNational: "Électrification productive et accès à l'énergie pour les ateliers ruraux.",
  },
  {
    id: 5,
    slug: "sante-biomedical",
    code: "05",
    nomCourt: "Santé, Biomédical & Pharma",
    nomComplet: "Dispositifs Biomédicaux, Télémédecine et Valorisation Pharmacologique",
    icone: HeartPulse,
    badge: "Pôle Souveraineté Sanitaire",
    photo: "/images/galerie_moments/sante-diagnostic-brousse.jpg",
    enjeux:
      "Autonomie médicale nationale par la conception de dispositifs médicaux réparables localement, la télémédecine décentralisée pour postes de santé isolés et l'extraction contrôlée de plantes médicinales.",
    axesPrioritaires: [
      "Valises de télédiagnostic solaire pour infirmiers de brousse",
      "Équipements néonataux et de réanimation d'urgence low-cost et fiables",
      "Standardisation des procédés d'extraction galénique (Artemisia, Moringa)",
    ],
    prototypesCiat: [
      { nom: "TéléDiag Rufisque", tag: "Valise Télémédecine Connectée" },
      { nom: "Incubateur Néonatal Rural", tag: "Dispositif Thermorégulé Low-Cost" },
      { nom: "Hydrogel Antiseptique Moringa", tag: "Formulation Galénique Validée" },
    ],
    atelierAssocie: "Laboratoire Dispositifs Médicaux & Chimie Bio",
    impactNational: "Désenclavement des structures de santé primaires et réduction de la mortalité néonatale.",
  },
  {
    id: 6,
    slug: "education-formation",
    code: "06",
    nomCourt: "Formation & EdTech",
    nomComplet: "Pédagogie Technique Immersive, Simulateurs VR et Insertion Métiers",
    icone: GraduationCap,
    badge: "Pôle Capital Humain",
    photo: "/images/galerie_moments/formation.jpg",
    enjeux:
      "Révolutionner la formation technique par la réalité virtuelle et les jumeaux numériques, accélérer l'insertion professionnelle des diplômés de l'ISEP et favoriser les carrières techniques féminines.",
    axesPrioritaires: [
      "Simulateurs d'ateliers en réalité virtuelle (soudure industrielle, usinage)",
      "Plateformes d'apprentissage hybride et certifications techniques reconnues",
      "Systèmes prédictifs de matching diplômés-entreprises partenaires",
    ],
    prototypesCiat: [
      { nom: "Simulateur VR Usinage", tag: "Apprentissage Sans Risque Industriel" },
      { nom: "Plateforme Insertion Métiers", tag: "Matching Certifié ISEP-PME" },
      { nom: "Kit Robotique Pédagogique", tag: "Initiation STEM Lycées Techniques" },
    ],
    atelierAssocie: "Centre Immersif & Laboratoire Réalité Virtuelle",
    impactNational: "Adéquation formation-emploi et montée en compétences de la jeunesse sénégalaise.",
  },
  {
    id: 7,
    slug: "services-collectivites",
    code: "07",
    nomCourt: "Villes & Collectivités",
    nomComplet: "Smart City, Services Communaux, Logistique Urbaine et Économie Circulaire",
    icone: Building2,
    badge: "Pôle Territoires & Villes",
    photo: "/images/galerie_moments/nos-espaces.jpg",
    enjeux:
      "Modernisation des collectivités territoriales, transition vers des villes durables (Pôle Urbain de Diamniadio), optimisation de la gestion des déchets et traçabilité de la fiscalité locale.",
    axesPrioritaires: [
      "Capteurs ultrasoniques de remplissage de bennes pour collecte optimisée",
      "Tricycles utilitaires électriques pour logistique urbaine du dernier kilomètre",
      "Guichets uniques numériques et terminaux de perception des taxes communales",
    ],
    prototypesCiat: [
      { nom: "Dakar Waste Solutions", tag: "Optimisation des Tournées Déchets" },
      { nom: "SmartTax Collect", tag: "Digitalisation de la Fiscalité Marchande" },
      { nom: "Gestion Partagée Marchés", tag: "Aménagement Urbain Diamniadio" },
    ],
    atelierAssocie: "Hub Logistique & Modélisation Territoriale",
    impactNational: "Efficience des services publics locaux et propreté urbaine mesurable.",
  },
];

export default function DomainesShowcase() {
  const [selectedId, setSelectedId] = useState<number>(1);
  const activeDomaine = DOMAINES_DATA.find((d) => d.id === selectedId) || DOMAINES_DATA[0];
  const ActiveIcon = activeDomaine.icone;

  return (
    <div className="bg-[#FAF7F2] text-[#24140D] min-h-screen font-sans antialiased selection:bg-[#C99A68]/30">
      {/* =====================================================================
       * 1. EN-TÊTE ÉDITORIAL ÉPURÉ & NOBLE — SANS AUCUN BANDEAU FLOU
       * ===================================================================== */}
      <header className="border-b border-[#E8DFD3] bg-white/70 backdrop-blur-xs pt-12 pb-10 sm:pt-16 sm:pb-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 text-xs font-bold tracking-[0.2em] text-[#612D10] uppercase mb-3">
              <span className="h-1.5 w-1.5 rounded-full bg-[#C99A68]" />
              CAHIER DES CHARGES OFFICIEL • ISEP AMADOU TRAWARÉ
            </div>

            <h1 className="text-3xl sm:text-5xl font-serif font-bold text-[#24140D] tracking-tight leading-[1.12]">
              Les 7 Domaines d&apos;Intervention
            </h1>

            <p className="mt-4 text-base sm:text-lg text-[#6B5A4E] leading-relaxed font-normal">
              Fixés par le décret de l&apos;ISEP de Diamniadio, ces 7 filières stratégiques guident
              le prototypage, la recherche appliquée et l&apos;incubation au service de
              la souveraineté économique et industrielle du Sénégal.
            </p>
          </div>

          {/* Ruban des 4 piliers d'ancrage */}
          <div className="mt-8 pt-6 border-t border-[#E8DFD3] grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
            <div className="flex items-center gap-2.5 text-[#5C4A3E]">
              <ShieldCheck size={18} className="text-[#612D10] shrink-0" />
              <span><strong>7 Filières</strong> prioritaires</span>
            </div>
            <div className="flex items-center gap-2.5 text-[#5C4A3E]">
              <Layers size={18} className="text-[#612D10] shrink-0" />
              <span>Maturité <strong>TRL 1 à 8</strong></span>
            </div>
            <div className="flex items-center gap-2.5 text-[#5C4A3E]">
              <CheckCircle2 size={18} className="text-[#612D10] shrink-0" />
              <span>Ateliers &amp; <strong>FabLab 4.0</strong></span>
            </div>
            <div className="flex items-center gap-2.5 text-[#5C4A3E]">
              <Building2 size={18} className="text-[#612D10] shrink-0" />
              <span>Cité du Savoir • <strong>Diamniadio</strong></span>
            </div>
          </div>
        </div>
      </header>

      {/* =====================================================================
       * 2. SECTION PRINCIPALE : L'EXPLORATEUR INTERACTIF DES 7 PÔLES
       * (Pattern Awwwards Split Master-Detail : fluide, visuel, immédiat)
       * ===================================================================== */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14">
        <div className="mb-6 flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-[#8C7A6D]">
            Explorateur des Filières — Cliquez pour découvrir le pôle
          </span>
          <span className="text-xs text-[#612D10] font-mono font-bold">
            Pôle 0{activeDomaine.id} / 07
          </span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Colonne Gauche : L'Index Typographique Interactif (5 cols) */}
          <div className="lg:col-span-5 flex flex-col gap-2.5">
            {DOMAINES_DATA.map((d) => {
              const isSelected = d.id === selectedId;
              const Icon = d.icone;

              return (
                <button
                  key={d.id}
                  type="button"
                  onClick={() => setSelectedId(d.id)}
                  className={`w-full text-left p-4 rounded-2xl transition-all duration-200 cursor-pointer flex items-center justify-between border ${
                    isSelected
                      ? "bg-white border-[#612D10] shadow-md border-l-[5px] border-l-[#612D10] -translate-x-0.5"
                      : "bg-white/60 hover:bg-white border-[#E8DFD3] hover:border-[#D5C9BB]"
                  }`}
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    <span
                      className={`h-9 w-9 rounded-xl flex items-center justify-center font-mono font-bold text-xs shrink-0 transition-colors ${
                        isSelected
                          ? "bg-[#612D10] text-white"
                          : "bg-[#FAF7F2] text-[#8C7A6D] border border-[#E8DFD3]"
                      }`}
                    >
                      {d.code}
                    </span>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <Icon size={14} className={isSelected ? "text-[#C99A68]" : "text-[#9C8B7E]"} />
                        <span
                          className={`text-sm font-bold truncate ${
                            isSelected ? "text-[#24140D]" : "text-[#5C4A3E]"
                          }`}
                        >
                          {d.nomCourt}
                        </span>
                      </div>
                      <span className="text-[11px] text-[#8C7A6D] block truncate mt-0.5">
                        {d.badge}
                      </span>
                    </div>
                  </div>

                  <span
                    className={`text-xs font-bold shrink-0 ml-2 transition-transform ${
                      isSelected ? "text-[#612D10] translate-x-1" : "text-[#C99A68] opacity-50"
                    }`}
                  >
                    →
                  </span>
                </button>
              );
            })}
          </div>

          {/* Colonne Droite : Le Pavillon Actif Haute Résolution (7 cols, sticky) */}
          <div className="lg:col-span-7 lg:sticky lg:top-24">
            <div className="bg-white rounded-3xl overflow-hidden border border-[#E8DFD3] shadow-lg">
              {/* Photographie Haute Définition du Labo / Atelier */}
              <div className="relative aspect-[16/9] w-full bg-[#0A0C0F] overflow-hidden">
                <Image
                  key={activeDomaine.photo}
                  src={activeDomaine.photo}
                  alt={activeDomaine.nomComplet}
                  fill
                  priority
                  sizes="(max-width: 1024px) 100vw, 55vw"
                  className="object-cover object-center transition-all duration-700 ease-out"
                />

                {/* Dégradé doux */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent pointer-events-none" />

                {/* Badges en surimpression nette */}
                <div className="absolute top-4 left-4 z-10 flex items-center gap-2">
                  <span className="h-9 w-9 rounded-xl bg-[#612D10] text-white flex items-center justify-center font-mono font-bold text-xs shadow-md border border-[#C99A68]/40">
                    {activeDomaine.code}
                  </span>
                  <span className="rounded-full bg-white/95 backdrop-blur-xs px-3 py-1 text-[11px] font-bold text-[#612D10] uppercase tracking-wider shadow-xs">
                    {activeDomaine.badge}
                  </span>
                </div>

                {/* Atelier / Équipement en légende basse */}
                <div className="absolute bottom-4 inset-x-4 z-10 p-3 rounded-xl bg-black/65 backdrop-blur-xs text-white border border-white/20 text-xs">
                  <span className="text-[#C99A68] font-bold uppercase tracking-wider block text-[10px]">
                    Atelier &amp; Équipement CIAT à Diamniadio
                  </span>
                  <span className="font-semibold">{activeDomaine.atelierAssocie}</span>
                </div>
              </div>

              {/* Contenu Détaillé du Pôle Actif */}
              <div className="p-6 sm:p-8">
                <div className="flex items-center gap-2 text-xs font-bold text-[#612D10] uppercase tracking-wider mb-2">
                  <ActiveIcon size={16} className="text-[#C99A68]" />
                  <span>Filière Prioritaire Nationale N°{activeDomaine.code}</span>
                </div>

                <h2 className="text-xl sm:text-2xl font-serif font-bold text-[#24140D] tracking-tight leading-snug">
                  {activeDomaine.nomComplet}
                </h2>

                <p className="mt-3 text-xs sm:text-sm text-[#6B5A4E] leading-relaxed">
                  {activeDomaine.enjeux}
                </p>

                {/* Axes technologiques */}
                <div className="mt-6 pt-5 border-t border-[#F1E9DE]">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-[#24140D] mb-3">
                    Axes prioritaires d&apos;ingénierie :
                  </h3>
                  <ul className="space-y-2">
                    {activeDomaine.axesPrioritaires.map((axe, i) => (
                      <li key={i} className="flex items-start gap-2.5 text-xs text-[#5C4A3E]">
                        <span className="h-1.5 w-1.5 rounded-full bg-[#612D10] mt-1.5 shrink-0" />
                        <span>{axe}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Prototypes incubés au CIAT */}
                <div className="mt-6 pt-5 border-t border-[#F1E9DE]">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-[#8C7A6D] mb-2.5">
                    Prototypes validés &amp; en développement :
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    {activeDomaine.prototypesCiat.map((proto, idx) => (
                      <div
                        key={idx}
                        className="rounded-xl bg-[#FAF7F2] border border-[#E8DFD3] p-2.5 text-xs"
                      >
                        <strong className="block text-[#24140D] font-bold line-clamp-1">{proto.nom}</strong>
                        <span className="text-[10px] text-[#8C7A6D] line-clamp-1 mt-0.5">{proto.tag}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Actions */}
                <div className="mt-8 pt-5 border-t border-[#F1E9DE] flex flex-wrap items-center justify-between gap-4">
                  <Link
                    href="/connexion?next=/incubateur"
                    className="inline-flex items-center gap-2 rounded-xl bg-[#612D10] hover:bg-[#7D3A15] px-6 py-3 text-xs font-bold text-white shadow-xs transition-all active:scale-95"
                  >
                    <span>Candidater sur ce pôle</span>
                    <ArrowRight size={14} className="text-[#C99A68]" />
                  </Link>

                  <Link
                    href="/galerie"
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#612D10] hover:text-[#C99A68] transition-colors"
                  >
                    <span>Voir les photos dans la Galerie</span>
                    <ExternalLink size={13} />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =====================================================================
       * 3. GRILLE COMPLÈTE EN BENTO POUR VISIONNER LES 7 PÔLES EN UN COUP D'ŒIL
       * ===================================================================== */}
      <section className="border-t border-[#E8DFD3] bg-white py-14 sm:py-18">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl mb-10">
            <span className="text-xs font-bold uppercase tracking-wider text-[#612D10]">
              Vue Synoptique &amp; Répartition Sectorielle
            </span>
            <h2 className="text-2xl sm:text-4xl font-serif font-bold text-[#24140D] mt-1">
              Les 7 Piliers de la Souveraineté Technologique
            </h2>
            <p className="mt-2 text-xs sm:text-sm text-[#6B5A4E]">
              Chaque filière est dotée d&apos;un atelier dédié, de mentors spécialisés et de bancs de certification au CIAT Diamniadio.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {DOMAINES_DATA.map((domaine) => {
              const Icon = domaine.icone;

              return (
                <article
                  key={domaine.id}
                  onClick={() => {
                    setSelectedId(domaine.id);
                    window.scrollTo({ top: 380, behavior: "smooth" });
                  }}
                  className="group bg-[#FAF7F2] rounded-2xl p-6 border border-[#E8DFD3] hover:border-[#612D10] hover:bg-white shadow-2xs hover:shadow-lg transition-all duration-300 cursor-pointer flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <span className="h-8 w-8 rounded-lg bg-[#612D10] text-white flex items-center justify-center font-mono font-bold text-xs shadow-xs">
                        {domaine.code}
                      </span>
                      <Icon size={18} className="text-[#C99A68] group-hover:scale-110 transition-transform" />
                    </div>

                    <h3 className="text-base font-serif font-bold text-[#24140D] group-hover:text-[#612D10] transition-colors leading-snug line-clamp-2">
                      {domaine.nomCourt}
                    </h3>

                    <p className="mt-2 text-xs text-[#6B5A4E] line-clamp-3 leading-relaxed">
                      {domaine.enjeux}
                    </p>
                  </div>

                  <div className="mt-5 pt-3 border-t border-[#E8DFD3]/80 flex items-center justify-between text-[11px]">
                    <span className="font-semibold text-[#8C7A6D]">{domaine.badge}</span>
                    <span className="text-[#612D10] font-bold group-hover:translate-x-1 transition-transform">
                      Explorer →
                    </span>
                  </div>
                </article>
              );
            })}

            {/* Carte additionnelle : Grille d'évaluation */}
            <div className="rounded-2xl p-6 border border-dashed border-[#C99A68] bg-[#C99A68]/10 flex flex-col justify-between">
              <div>
                <div className="inline-flex items-center gap-1.5 text-xs font-bold text-[#612D10] uppercase tracking-wider mb-2">
                  <Sparkles size={14} />
                  <span>Critères de Sélection</span>
                </div>
                <h3 className="text-base font-serif font-bold text-[#24140D]">
                  Votre projet coche-t-il au moins 1 pôle ?
                </h3>
                <p className="mt-2 text-xs text-[#6B5A4E] leading-relaxed">
                  L&apos;adéquation avec au moins l&apos;un de ces 7 domaines est le premier critère éliminatoire du jury d&apos;incubation CIAT.
                </p>
              </div>

              <Link
                href="/portail/incubateur"
                className="mt-5 inline-flex items-center text-xs font-bold text-[#612D10] hover:text-[#C99A68] transition-colors"
              >
                Consulter la grille d&apos;évaluation multicritère →
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* =====================================================================
       * 4. BANDEAU D'APPEL À CANDIDATURE OFFICIEL
       * ===================================================================== */}
      <section className="border-t border-[#E8DFD3] bg-[#FAF7F2] py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="rounded-3xl bg-gradient-to-r from-[#24140D] to-[#3B1E12] text-white p-8 sm:p-12 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-8 border border-white/10">
            <div className="max-w-2xl">
              <span className="inline-block rounded-md bg-[#C99A68]/20 px-3 py-1 text-xs font-bold text-[#C99A68] uppercase tracking-wider mb-3">
                Appel à Projets • Cohorte Active
              </span>
              <h2 className="text-2xl sm:text-4xl font-serif font-bold text-white leading-tight">
                Rejoignez le prochain cycle d&apos;accélération technologique
              </h2>
              <p className="mt-3 text-sm sm:text-base text-white/85 leading-relaxed font-normal">
                Déposez votre dossier de candidature pour accéder gratuitement aux bancs d&apos;essai,
                aux ateliers de découpe et d&apos;usinage de Diamniadio et au mentorat d&apos;enseignants-chercheurs.
              </p>
            </div>

            <div className="shrink-0 flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full md:w-auto">
              <Link
                href="/connexion?next=/incubateur"
                className="inline-flex items-center justify-center rounded-xl bg-[#C99A68] hover:bg-[#d8ab79] px-7 py-3.5 text-xs sm:text-sm font-extrabold text-[#24140D] shadow-md transition-all active:scale-95 text-center"
              >
                Déposer ma Candidature →
              </Link>
              <Link
                href="/portail/incubateur"
                className="inline-flex items-center justify-center rounded-xl border border-white/30 bg-white/10 hover:bg-white/20 px-6 py-3.5 text-xs sm:text-sm font-semibold text-white transition-all text-center"
              >
                Parcours en 5 Jalons
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
