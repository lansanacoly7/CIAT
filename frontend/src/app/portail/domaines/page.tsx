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
} from "lucide-react";

export const metadata = {
  title: "Les 7 Domaines d'Intervention — Pôles d'Excellence CIAT",
  description:
    "Découvrez les 7 filières technologiques et sectorielles prioritaires de l'ISEP Amadou Trawaré et du CIAT à Diamniadio : enjeux stratégiques, équipements de pointe et prototypes accompagnés.",
};

interface DomainesDetail {
  id: number;
  slug: string;
  nomCourt: string;
  nomComplet: string;
  icone: typeof Cpu;
  badge: string;
  photo: string;
  enjeux: string;
  pointsForts: string[];
  prototypesCiat: string[];
  atelierAssocie: string;
}

const LES_7_DOMAINES: DomainesDetail[] = [
  {
    id: 1,
    slug: "tic-ia-donnees",
    nomCourt: "TIC, IA & Données",
    nomComplet: "TIC, Numérique, Intelligence Artificielle et Valorisation des Données",
    icone: Cpu,
    badge: "Pôle Numérique 4.0",
    photo: "/images/galerie_moments/collaboration-numerique.jpg",
    enjeux:
      "Digitalisation des services essentiels, modèles de langage pour les langues nationales, vision par ordinateur appliquée et souveraineté des données sénégalaises.",
    pointsForts: [
      "Intelligence artificielle embarquée & Edge computing",
      "Solutions logicielles robustes et cybersécurité",
      "Traitement automatique du Wolof et langues locales",
    ],
    prototypesCiat: ["SunuAgri AI (diagnostic)", "Jumeaux numériques ISEP", "Guichet unique communal"],
    atelierAssocie: "Laboratoire Calcul Haute Performance & IA",
  },
  {
    id: 2,
    slug: "mecanique-fabrication",
    nomCourt: "Mécanique & Industrie 4.0",
    nomComplet: "Mécanique de Précision, Usinage Numérique et Fabrication Additive",
    icone: Wrench,
    badge: "Pôle Industrie & CAO",
    photo: "/images/galerie_moments/usinage-mecanique.jpg",
    enjeux:
      "Remplacement des importations par l'usinage local de pièces de rechange, conception assistée par ordinateur (CAO/FAO) et maintenance industrielle prédictive.",
    pointsForts: [
      "Centres d'usinage numérique CNC 4 axes",
      "Découpe laser industrielle et gravure de précision",
      "Impression 3D polymères techniques & prototypage rapide",
    ],
    prototypesCiat: ["Fraiseuse CNC 4.0 locale", "Presse compacte oléagineuse", "Pièces de rechange usines"],
    atelierAssocie: "FabLab & Ateliers Usinage Lourd",
  },
  {
    id: 3,
    slug: "agritech-environnement",
    nomCourt: "AgriTech & Alimentation",
    nomComplet: "Technologies Agricoles, Transformation Agroalimentaire et Écologie",
    icone: Sprout,
    badge: "Pôle Souveraineté Alimentaire",
    photo: "/images/galerie_moments/hydroponie-serre.jpg",
    enjeux:
      "Modernisation de la production maraîchère, réduction drastique des pertes post-récolte, irrigation intelligente et valorisation des bio-déchets.",
    pointsForts: [
      "Systèmes d'irrigation goutte-à-goutte automatisés par IoT",
      "Serres bioclimatiques adaptées au climat sahélien",
      "Unités mobiles de transformation et séchage solaire",
    ],
    prototypesCiat: ["AgriSol (station météo connectée)", "Éco-séchoir solaire", "SmartIrrig Saloum"],
    atelierAssocie: "Serres Expérimentales & Lab Bio-Industries",
  },
  {
    id: 4,
    slug: "energies-renouvelables",
    nomCourt: "Énergies & Micro-Réseaux",
    nomComplet: "Énergies Renouvelables, Efficacité Énergétique et Réseaux Intelligents",
    icone: Zap,
    badge: "Pôle Transition Énergétique",
    photo: "/images/galerie_moments/solaire-campus.jpg",
    enjeux:
      "Valorisation du gisement solaire et éolien du Sénégal, autonomie énergétique des zones rurales décentralisées et gestion des micro-réseaux (microgrids).",
    pointsForts: [
      "Bancs de tests et certification de panneaux solaires",
      "Contrôleurs de charge intelligents et stockage hybride",
      "Monitoring en temps réel des consommations d'ateliers",
    ],
    prototypesCiat: ["SunuGrid (micro-réseau intelligent)", "Éolienne multipale locale", "Bancs solaires"],
    atelierAssocie: "Plateforme Extérieure & Bancs Photovoltaïques",
  },
  {
    id: 5,
    slug: "sante-biomedical",
    nomCourt: "Santé & Bio-Pharma",
    nomComplet: "Dispositifs Biomédicaux, Télémédecine et Pharmacopée Locale",
    icone: HeartPulse,
    badge: "Pôle Souveraineté Sanitaire",
    photo: "/images/galerie_moments/sante-diagnostic-brousse.jpg",
    enjeux:
      "Conception locale de dispositifs d'urgence vitale, maintenance des équipements hospitaliers et extraction normalisée de principes actifs végétaux.",
    pointsForts: [
      "Valises autonomes de télémédecine pour postes de brousse",
      "Incubateurs néonataux low-cost robustes et réparables",
      "Procédés d'extraction standardisés pour pharmacopée",
    ],
    prototypesCiat: ["TéléDiag Rufisque", "Incubateur néonatal rural", "Hydrogel Moringa certifié"],
    atelierAssocie: "Laboratoire Dispositifs Médicaux & Chimie",
  },
  {
    id: 6,
    slug: "education-formation",
    nomCourt: "Formation & EdTech",
    nomComplet: "Pédagogie Technique Immersive, Simulateurs VR et Insertion Métiers",
    icone: GraduationCap,
    badge: "Pôle Capital Humain",
    photo: "/images/galerie_moments/formation.jpg",
    enjeux:
      "Apprentissage par le geste technique guidé, simulateurs en réalité virtuelle pour environnements dangereux et passerelles directes avec les employeurs.",
    pointsForts: [
      "Simulateurs immersifs de soudure et d'usinage VR",
      "Plateformes d'apprentissage hybride pour filières féminines",
      "Matching prédictif des diplômés de l'ISEP avec les entreprises",
    ],
    prototypesCiat: ["Simulateur VR Usinage", "Plateforme Insertion Métiers", "Kit robotique lycées"],
    atelierAssocie: "Centre Immersif & Laboratoire Réalité Virtuelle",
  },
  {
    id: 7,
    slug: "services-collectivites",
    nomCourt: "Collectivités & Villes",
    nomComplet: "Smart City, Services Communaux, Logistique Urbaine et Économie Circulaire",
    icone: Building2,
    badge: "Pôle Aménagement & Territoires",
    photo: "/images/galerie_moments/nos-espaces.jpg",
    enjeux:
      "Optimisation de la collecte des déchets, logistique propre du dernier kilomètre et modernisation des recettes fiscales des municipalités sénégalaises.",
    pointsForts: [
      "Optimisation des tournées de collecte par capteurs de bennes",
      "Tricycles utilitaires électriques pour marchés urbains",
      "Systèmes numériques de perception des taxes communales",
    ],
    prototypesCiat: ["Dakar Waste Solutions", "SmartTax Collect", "Gestion partagée Diamniadio"],
    atelierAssocie: "Hub Logistique & Salle Modélisation Urbaine",
  },
];

export default function DomainesPage() {
  return (
    <div className="bg-[#FAF7F2] text-[#24140D] min-h-screen font-sans antialiased selection:bg-[#C99A68]/30">
      {/* =====================================================================
       * EN-TÊTE ÉDITORIAL NOBLE & INSTITUTIONNEL
       * ===================================================================== */}
      <header className="border-b border-[#E8DFD3] bg-white/70 backdrop-blur-xs pt-12 pb-10 sm:pt-16 sm:pb-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 text-xs font-bold tracking-[0.2em] text-[#612D10] uppercase mb-3">
              <span className="h-1.5 w-1.5 rounded-full bg-[#C99A68]" />
              CAHIER DES CHARGES OFFICIEL • ISEP AMADOU TRAWARÉ
            </div>

            <h1 className="text-3xl sm:text-5xl font-serif font-bold text-[#24140D] tracking-tight leading-[1.12]">
              Les 7 Pôles Technologiques d&apos;Excellence
            </h1>

            <p className="mt-4 text-base sm:text-lg text-[#6B5A4E] leading-relaxed font-normal">
              Fixés par les orientations stratégiques du Ministère et du CIAT à Diamniadio,
              ces 7 domaines prioritaires guident le prototypage, l&apos;incubation et
              le transfert technologique au service de l&apos;économie nationale.
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
              <span>Homologation <strong>TRL 1 à 8</strong></span>
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
       * BARRE DE DÉFILEMENT RAPIDE VERS CHAQUE DOMAINE
       * ===================================================================== */}
      <nav aria-label="Accès direct aux filières" className="sticky top-18 z-20 bg-white/90 backdrop-blur-md border-b border-[#E8DFD3] py-3 shadow-2xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2 overflow-x-auto scrollbar-none py-1">
            <span className="text-xs font-bold text-[#8C7A6D] uppercase tracking-wider shrink-0 mr-1">
              Filières :
            </span>
            {LES_7_DOMAINES.map((d) => (
              <a
                key={d.id}
                href={`#domaine-${d.id}`}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-[#FAF7F2] text-[#612D10] hover:bg-[#612D10] hover:text-white transition-all shrink-0 border border-[#E2D8CC]"
              >
                <span className="text-[10px] font-mono text-[#C99A68]">0{d.id}</span>
                <span>{d.nomCourt}</span>
              </a>
            ))}
          </div>
        </div>
      </nav>

      {/* =====================================================================
       * LISTE ARCHITECTURALE DES 7 DOMAINES STRATÉGIQUES
       * ===================================================================== */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 space-y-12">
        {LES_7_DOMAINES.map((domaine) => {
          const Icon = domaine.icone;

          return (
            <article
              id={`domaine-${domaine.id}`}
              key={domaine.id}
              className="group bg-white rounded-3xl overflow-hidden border border-[#E8DFD3] hover:border-[#C99A68]/80 shadow-xs hover:shadow-xl transition-all duration-300"
            >
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-0">
                {/* 1. Colonne Visuelle Photographique (5 cols sur desktop) */}
                <div className="lg:col-span-5 relative min-h-[260px] sm:min-h-[320px] lg:min-h-full overflow-hidden bg-[#24140D]">
                  <Image
                    src={domaine.photo}
                    alt={domaine.nomComplet}
                    fill
                    sizes="(max-width: 1024px) 100vw, 42vw"
                    className="object-cover object-center transition-transform duration-700 ease-out group-hover:scale-105"
                  />

                  {/* Dégradé doux de lisibilité */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent lg:bg-gradient-to-r lg:from-transparent lg:to-black/40" />

                  {/* Numéro géant filigrané élégant */}
                  <div className="absolute top-4 left-4 z-10 flex items-center gap-2">
                    <span className="h-10 w-10 rounded-2xl bg-[#612D10] text-white flex items-center justify-center font-mono font-bold text-sm shadow-md border border-[#C99A68]/40">
                      0{domaine.id}
                    </span>
                    <span className="rounded-full bg-white/90 backdrop-blur-xs px-3 py-1 text-[11px] font-bold text-[#612D10] uppercase tracking-wider shadow-xs">
                      {domaine.badge}
                    </span>
                  </div>

                  {/* Atelier technique associé en légende basse */}
                  <div className="absolute bottom-4 inset-x-4 z-10 p-3 rounded-xl bg-black/60 backdrop-blur-xs text-white border border-white/20 text-xs">
                    <span className="text-[#C99A68] font-bold uppercase tracking-wider block text-[10px]">
                      Équipement d&apos;appui CIAT
                    </span>
                    <span className="font-semibold">{domaine.atelierAssocie}</span>
                  </div>
                </div>

                {/* 2. Colonne Descriptif & Enjeux Stratégiques (7 cols sur desktop) */}
                <div className="lg:col-span-7 p-6 sm:p-8 lg:p-10 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center gap-3 mb-2 text-xs font-bold text-[#612D10] uppercase tracking-wider">
                      <Icon size={18} className="text-[#C99A68]" />
                      <span>Filière Prioritaire Nationale N°0{domaine.id}</span>
                    </div>

                    <h2 className="text-2xl sm:text-3xl font-serif font-bold text-[#24140D] tracking-tight leading-snug">
                      {domaine.nomComplet}
                    </h2>

                    <p className="mt-3 text-sm sm:text-base text-[#6B5A4E] leading-relaxed">
                      {domaine.enjeux}
                    </p>

                    {/* Points clés & technologies mobilisées */}
                    <div className="mt-6">
                      <h3 className="text-xs font-bold uppercase tracking-wider text-[#24140D] mb-3">
                        Axes technologiques prioritaires :
                      </h3>
                      <ul className="space-y-2">
                        {domaine.pointsForts.map((pt, idx) => (
                          <li key={idx} className="flex items-start gap-2.5 text-xs sm:text-sm text-[#5C4A3E]">
                            <span className="h-1.5 w-1.5 rounded-full bg-[#612D10] mt-2 shrink-0" />
                            <span>{pt}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Exemples de prototypes accompagnés au CIAT */}
                    <div className="mt-6 pt-5 border-t border-[#F1E9DE]">
                      <h3 className="text-xs font-bold uppercase tracking-wider text-[#8C7A6D] mb-2.5">
                        Exemples de prototypes &amp; solutions ciblées :
                      </h3>
                      <div className="flex flex-wrap gap-2">
                        {domaine.prototypesCiat.map((proto, idx) => (
                          <span
                            key={idx}
                            className="inline-flex items-center rounded-lg bg-[#FAF7F2] border border-[#E8DFD3] px-3 py-1.5 text-xs font-medium text-[#24140D]"
                          >
                            <span className="h-1 w-1 rounded-full bg-[#C99A68] mr-2" />
                            {proto}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Actions de bas de carte */}
                  <div className="mt-8 pt-5 border-t border-[#F1E9DE] flex flex-wrap items-center justify-between gap-4">
                    <Link
                      href="/connexion?next=/incubateur"
                      className="inline-flex items-center gap-2 rounded-xl bg-[#612D10] hover:bg-[#7D3A15] px-5 py-2.5 text-xs font-bold text-white shadow-xs transition-all active:scale-95"
                    >
                      <span>Candidater sur ce pôle</span>
                      <ArrowRight size={14} className="text-[#C99A68]" />
                    </Link>

                    <Link
                      href="/galerie"
                      className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#612D10] hover:text-[#C99A68] transition-colors"
                    >
                      <span>Voir les réalisations dans la Galerie</span>
                      <ExternalLink size={13} />
                    </Link>
                  </div>
                </div>
              </div>
            </article>
          );
        })}
      </main>

      {/* =====================================================================
       * BANDEAU D'APPEL À CANDIDATURE OFFICIEL
       * ===================================================================== */}
      <section className="border-t border-[#E8DFD3] bg-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="rounded-3xl bg-gradient-to-r from-[#24140D] to-[#3B1E12] text-white p-8 sm:p-12 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-8 border border-white/10">
            <div className="max-w-2xl">
              <span className="inline-block rounded-md bg-[#C99A68]/20 px-3 py-1 text-xs font-bold text-[#C99A68] uppercase tracking-wider mb-3">
                Appel à Projets • Cohorte Active
              </span>
              <h2 className="text-2xl sm:text-4xl font-serif font-bold text-white leading-tight">
                Votre projet s&apos;inscrit dans l&apos;un de ces 7 domaines ?
              </h2>
              <p className="mt-3 text-sm sm:text-base text-white/85 leading-relaxed font-normal">
                Déposez votre dossier de candidature pour accéder gratuitement aux bancs d&apos;essai,
                aux machines numériques de Diamniadio et à l&apos;encadrement d&apos;experts métiers.
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
                className="inline-flex items-center justify-center rounded-xl border border-white/30 bg-white/10 hover:bg-white/20 px-6 py-3.5 text-xs sm:text-sm font-semibold text-white transition-all backdrop-blur-xs text-center"
              >
                Parcours d&apos;Incubation
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
