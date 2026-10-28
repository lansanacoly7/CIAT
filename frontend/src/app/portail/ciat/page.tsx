import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  ArrowUpRight,
  BrainCircuit,
  ChartNoAxesColumnIncreasing,
  CheckCircle2,
  Download,
  FileText,
  GraduationCap,
  Images,
  Landmark,
  Lightbulb,
  Share2,
  ShieldCheck,
  Sprout,
  Users,
} from "lucide-react";

export const metadata = {
  title: "Le CIAT — Centre d'Innovation, d'Application et de Transfert",
  description:
    "Un catalyseur d'innovation au service de l'entrepreneuriat et de l'impact à l'ISEP Amadou Trawaré de Diamniadio : missions statutaires, protocole en 5 jalons, ateliers 4.0, modules CIAT 360 et cadre officiel.",
};

const MISSIONS_STATUTAIRES = [
  {
    icon: Lightbulb,
    num: "01",
    titre: "Recherche Appliquée & Prototypage",
    desc: "Transformer les problématiques industrielles, agricoles et sanitaires du Sénégal en prototypes matériels et logiciels éprouvés sur bancs d'essai.",
    livrable: "Maquettes fonctionnelles & dossiers CAO/PCB",
  },
  {
    icon: GraduationCap,
    num: "02",
    titre: "Formation par le Faire & Mentorat",
    desc: "Immerger les apprenants de l'ISEP et porteurs externes dans une ingénierie de terrain encadrée par les enseignants-chercheurs et maîtres-artisans.",
    livrable: "Compétences certifiées Industrie 4.0",
  },
  {
    icon: Share2,
    num: "03",
    titre: "Homologation & Propriété Intellectuelle",
    desc: "Qualifier la fiabilité normative (échelle TRL 1 à 8) et sécuriser les droits des inventeurs via des dépôts de brevets et modèles auprès de l'OAPI.",
    livrable: "Certificats d'homologation & titres PI",
  },
  {
    icon: Users,
    num: "04",
    titre: "Transfert Industriel & Amorçage",
    desc: "Connecter les innovations matures aux PME locales, collectivités territoriales et fonds d'investissement pour industrialiser au Sénégal.",
    livrable: "Licences d'exploitation & startups créées",
  },
];

const PROTOCOLE_CINQ_JALONS = [
  {
    num: "01",
    trl: "TRL 1–2",
    titre: "Cadrage Terrain & Recevabilité",
    desc: "Validation de la réalité du besoin socio-économique, état de l'art technologique et structuration de la feuille de route d'atelier.",
  },
  {
    num: "02",
    trl: "TRL 3–4",
    titre: "Preuve de Concept & Maquettage",
    desc: "Modélisation 3D, schémas électroniques, architecture logicielle et validation analytique du premier démonstrateur critique.",
  },
  {
    num: "03",
    trl: "TRL 5–6",
    titre: "Prototypage Intégré aux Ateliers 4.0",
    desc: "Usinage CNC, intégration capteurs/énergie et tests d'endurance sur les plateformes techniques de l'ISEP Diamniadio.",
  },
  {
    num: "04",
    trl: "TRL 7",
    titre: "Pilote en Conditions Réelles",
    desc: "Déploiement expérimental sur site partenaire (exploitation agricole, poste de santé, commune ou usine) et métrologie d'impact.",
  },
  {
    num: "05",
    trl: "TRL 8",
    titre: "Homologation, Brevet OAPI & Transfert",
    desc: "Certification finale par le Comité Scientifique, protection de la propriété intellectuelle et passage à l'échelle industrielle.",
  },
];

const PLATEFORMES_TECHNIQUES = [
  {
    num: "01",
    badge: "Usinage & Fabrication 4.0",
    titre: "FabLab Industriel & Centre CNC 5 Axes",
    desc: "Usinage haute tolérance en acier inoxydable et aluminium, rétro-ingénierie par scanner laser 3D, découpe plasma et fabrication additive technique.",
    specs: "CNC 5 axes · Scanners 3D · Impression polymères techniques",
    image: "/images/innovations/cnc-4-0-clean.jpg",
  },
  {
    num: "02",
    badge: "Électronique & Robotique",
    titre: "Laboratoire Systèmes Embarqués & IoT",
    desc: "Conception et brasage de cartes électroniques CMS, programmation de microcontrôleurs, mécatronique 6 axes et passerelles radio LoRaWAN.",
    specs: "Oscilloscopes numériques · Bancs CMS · Robotique",
    image: "/images/ciat_galerie_hero_elec.jpg",
  },
  {
    num: "03",
    badge: "Énergie & AgriTech",
    titre: "Plateforme Solaire, Froid & Génie Hydrique",
    desc: "Dimensionnement de mini-réseaux photovoltaïques intelligents, chaînes du froid autonomes et stations d'irrigation pilotées par sondes.",
    specs: "Bancs MPPT & LiFePO4 · Sondes pédologiques · Pilotes solaires",
    image: "/images/innovations/agrisol-iot.jpg",
  },
  {
    num: "04",
    badge: "Cité du Savoir · Diamniadio",
    titre: "Incubateur, Accueil & Plateau Collaboratif",
    desc: "Espaces de coworking haut débit, salles de revues de jalons, showroom permanent de démonstration et accueil des délégations partenaires.",
    specs: "Showroom officiel · Salles de comité · Guichet partenaires",
    image: "/images/contact/contact-accueil-campus.jpg",
  },
];

const MODULES_CIAT_360 = [
  {
    num: "01",
    icon: Landmark,
    titre: "Portail Institutionnel",
    desc: "Gouvernance scientifique, référentiel des 7 filières d'intervention, appels à projets et ressources réglementaires.",
    href: "/portail/domaines",
    cta: "Explorer les 7 filières",
  },
  {
    num: "02",
    icon: Sprout,
    titre: "Gestion de l'Incubateur",
    desc: "Suivi numérique des cohortes sur 5 jalons, revues du comité d'évaluation, livrables et mentorat personnalisé.",
    href: "/portail/incubateur",
    cta: "Voir le parcours incubateur",
  },
  {
    num: "03",
    icon: Images,
    titre: "Galerie & Showroom 360",
    desc: "Catalogue public des prototypes certifiés, badges QR Code salon et canal direct de manifestation d'intérêt.",
    href: "/galerie",
    cta: "Visiter le showroom",
  },
  {
    num: "04",
    icon: ChartNoAxesColumnIncreasing,
    titre: "Tableau Décisionnel",
    desc: "Pilotage consolidé des indicateurs de maturité TRL, répartition sectorielle et suivi de performance des cohortes.",
    href: "/tableau-de-bord",
    cta: "Accéder aux indicateurs",
  },
  {
    num: "05",
    icon: FileText,
    titre: "Générateur Documentaire",
    desc: "Édition normée des fiches descriptives, attestations d'incubation, conventions et rapports d'instruction.",
    href: "/documents",
    cta: "Ouvrir l'outil documentaire",
  },
  {
    num: "06",
    icon: BrainCircuit,
    titre: "Assistant Méthodologique IA",
    desc: "Accompagnement intelligent à la structuration des dossiers, diagnostic de maturité et orientation technique.",
    href: "/assistant",
    cta: "Consulter l'assistant",
  },
];

const PIECES_JUSTIFICATIVES_DEMANDEES = [
  {
    num: "1",
    titre: "Fiche descriptive & architecture technique du projet",
    detail:
      "Exposé documenté du problème terrain, de la solution technologique envisagée, de sa filière de rattachement et du niveau de maturité initial.",
  },
  {
    num: "2",
    titre: "Dossier de compétences & engagement de l'équipe",
    detail:
      "Curriculum vitae des co-porteurs, répartition claire des rôles (technique, métier, déploiement) et disponibilité sur le calendrier des 5 jalons.",
  },
  {
    num: "3",
    titre: "Cahier des besoins d'atelier & budget prévisionnel",
    detail:
      "Estimation réaliste des matières premières, composants électroniques et heures machines sollicités sur les plateformes du CIAT.",
  },
];

export default function CiatPresentationPage() {
  return (
    <div className="bg-[#FAF7F2] text-[#24140D] min-h-screen font-sans antialiased selection:bg-[#C99A68]/30">
      {/* =====================================================================
       * SECTION 1 — HERO CINÉMATIQUE PLEIN ÉCRAN ALIGNÉ À GAUCHE (SUR LE CÔTÉ)
       * Cohérent avec les héros de la page Accueil et de la page Incubateur
       * Palette : Brun Nuit #24140D, Brun CIAT #612D10, Ocre Doré #C99A68, Blanc Pur
       * ===================================================================== */}
      <section className="relative w-full min-h-[calc(100vh-72px)] flex items-center overflow-hidden bg-[#0A0C0F]">
        {/* Photographie panoramique plein écran du Campus CIAT Diamniadio (nette et sans filtre flou) */}
        <Image
          src="/images/ciat-header-panoramique.jpg"
          alt="Campus et Centre d'Innovation et d'Accélération Technologique (CIAT) à Diamniadio"
          fill
          priority
          sizes="100vw"
          className="object-cover object-center"
        />

        {/* Dégradé neutre haute définition : sombre à gauche pour contraste net, totalement ouvert et lumineux à droite */}
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/50 via-45% to-transparent pointer-events-none"
        />
        <div
          aria-hidden="true"
          className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/60 to-transparent pointer-events-none"
        />

        {/* Contenu textuel calé sur le côté gauche (cohérence globale avec Accueil & Incubateur) */}
        <div className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
          <div className="max-w-2xl lg:max-w-3xl flex flex-col items-start text-left">


            {/* Titre monumental aligné à gauche */}
            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold text-white tracking-tight leading-[1.12]">
              Un catalyseur d’<span className="text-[#C99A68]">innovation</span> au service de l’impact
            </h1>

            {/* Sous-titre narratif */}
            <p className="mt-5 text-sm sm:text-base lg:text-lg text-white/90 max-w-2xl leading-relaxed font-normal">
              Le Centre d’Innovation et d’Accélération Technologique réunit porteurs de projets,
              chercheurs et industriels au cœur de la Cité du Savoir pour transformer les idées
              scientifiques en prototypes validés et en entreprises viables.
            </p>

            {/* Actions côte à côte alignées à gauche */}
            <div className="mt-8 flex flex-wrap items-center gap-4">
              <Link
                href="/connexion?next=/incubateur"
                className="inline-flex items-center justify-center rounded-xl bg-[#612D10] hover:bg-[#7D3A15] px-7 py-3.5 text-xs sm:text-sm font-bold text-white shadow-xl hover:shadow-2xl transition-all active:scale-95 border border-[#C99A68]/40"
              >
                Candidater à l&apos;Incubateur
                <ArrowRight size={16} className="ml-2 text-[#C99A68]" />
              </Link>

              <a
                href="#missions"
                className="inline-flex items-center justify-center rounded-xl border border-white/35 bg-white/10 hover:bg-white/20 px-7 py-3.5 text-xs sm:text-sm font-semibold text-white transition-all active:scale-95"
              >
                Découvrir nos missions
              </a>
            </div>

            {/* Micro-puces de réassurance alignées à gauche */}
            <div className="mt-12 pt-6 border-t border-white/15 flex flex-wrap items-center gap-6 text-xs text-white/80 font-medium">
              <span className="inline-flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-[#C99A68]" />
                FabLab 4.0 & Prototypage
              </span>
              <span className="inline-flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-[#C99A68]" />
                Bancs d&apos;Essai Solaires
              </span>
              <span className="inline-flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-[#C99A68]" />
                Homologation TRL 1-8
              </span>
              <span className="inline-flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-[#C99A68]" />
                Cité du Savoir • Diamniadio
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* =====================================================================
       * BANDEAU D'ANCRAGE INSTITUTIONNEL — CITÉ DU SAVOIR DE DIAMNIADIO
       * ===================================================================== */}
      <section
        aria-label="Repères institutionnels du CIAT"
        className="bg-[#24140D] border-b border-[#C99A68]/25 text-white"
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 lg:divide-x lg:divide-white/12">
            {[
              {
                val: "ISEP Diamniadio",
                lbl: "Ancrage académique officiel",
                sub: "Pôle Urbain de la Cité du Savoir",
              },
              {
                val: "07 Filières",
                lbl: "Domaines sectoriels prioritaires",
                sub: "Numérique, CNC, Agro, Énergie, Santé…",
              },
              {
                val: "05 Jalons TRL",
                lbl: "Protocole d'homologation normé",
                sub: "De l'idéation au brevet industriel",
              },
              {
                val: "CIAT 360°",
                lbl: "Plateforme intégrée en 6 modules",
                sub: "Incubation, showroom, IA & pilotage",
              },
            ].map((kpi, idx) => (
              <div
                key={kpi.val}
                className={idx > 0 ? "lg:pl-7 flex flex-col" : "flex flex-col"}
              >
                <strong className="font-[family-name:var(--font-jakarta)] text-xl sm:text-2xl font-extrabold text-[#DFae79]">
                  {kpi.val}
                </strong>
                <span className="mt-1 text-xs sm:text-sm font-bold text-white">
                  {kpi.lbl}
                </span>
                <span className="mt-0.5 text-[11px] sm:text-xs text-[#D8C7B5]">
                  {kpi.sub}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* =====================================================================
       * SECTION 2 — LES 4 MISSIONS STATUTAIRES (#missions)
       * ===================================================================== */}
      <section
        id="missions"
        className="scroll-mt-24 py-20 md:py-24 border-b border-[#E5D7C6] bg-white"
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6 mb-14">
            <div className="max-w-3xl">
              <div className="inline-flex items-center gap-3 mb-3">
                <span className="h-[1.5px] w-8 bg-[#612D10]" />
                <span className="text-[11px] font-extrabold uppercase tracking-[0.2em] text-[#612D10]">
                  Mandat Institutionnel
                </span>
              </div>
              <h2 className="font-[family-name:var(--font-jakarta)] text-3xl sm:text-4xl lg:text-[40px] font-extrabold text-[#24140D] tracking-tight leading-[1.14]">
                Quatre missions fondamentales au service de la souveraineté
                productive
              </h2>
            </div>

            <p className="text-sm sm:text-base leading-relaxed text-[#655346] max-w-md">
              Le CIAT articule formation supérieure professionnelle, ingénierie
              d&apos;atelier et valorisation économique au sein d&apos;un guichet
              unique.
            </p>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {MISSIONS_STATUTAIRES.map((m, idx) => {
              const Icon = m.icon;
              return (
                <article
                  key={m.num}
                  className={`group relative rounded-2xl border border-[#EFE4D6] border-t-[3px] ${
                    idx % 2 === 0 ? "border-t-[#612D10]" : "border-t-[#C99A68]"
                  } bg-[#FAF7F2] p-7 hover:bg-white hover:shadow-lg transition-all duration-300 flex flex-col justify-between`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-6">
                      <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white border border-[#EFE4D6] text-[#612D10] group-hover:bg-[#612D10] group-hover:text-white transition-colors">
                        <Icon size={20} />
                      </div>
                      <span className="font-[family-name:var(--font-jakarta)] text-lg font-extrabold text-[#612D10]">
                        {m.num}
                      </span>
                    </div>

                    <h3 className="font-[family-name:var(--font-jakarta)] text-lg font-bold text-[#24140D] leading-snug mb-3">
                      {m.titre}
                    </h3>
                    <p className="text-xs sm:text-sm leading-relaxed text-[#655346]">
                      {m.desc}
                    </p>
                  </div>

                  <div className="mt-6 pt-4 border-t border-[#EFE4D6] flex items-center gap-2 text-[11.5px] font-bold text-[#612D10]">
                    <CheckCircle2 size={14} className="shrink-0 text-[#612D10]" />
                    <span>{m.livrable}</span>
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      {/* =====================================================================
       * SECTION 3 — PROTOCOLE D'INCUBATION & HOMOLOGATION EN 5 JALONS (#jalons)
       * ===================================================================== */}
      <section
        id="jalons"
        className="scroll-mt-24 bg-[#24140D] text-white py-20 md:py-28 overflow-hidden border-b border-[#C99A68]/25"
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-12 lg:grid-cols-12 lg:items-center">
            <div className="lg:col-span-7 space-y-6">
              <div>
                <div className="inline-flex items-center gap-3 mb-3">
                  <span className="h-[1.5px] w-8 bg-[#C99A68]" />
                  <span className="text-[11px] font-extrabold uppercase tracking-[0.2em] text-[#DFae79]">
                    Méthodologie Certifiée · TRL 1 à TRL 8
                  </span>
                </div>
                <h2 className="font-[family-name:var(--font-jakarta)] text-3xl sm:text-4xl lg:text-[40px] font-extrabold !text-white tracking-tight leading-[1.14]">
                  Cinq jalons normés, de l&apos;idée au transfert industriel
                </h2>
                <p className="mt-3 text-sm sm:text-base text-[#E5D7C6] leading-relaxed max-w-2xl">
                  Chaque passage de jalon fait l&apos;objet d&apos;une revue
                  collégiale par le Comité Scientifique et Industriel du CIAT,
                  garantissant la robustesse technique des solutions publiées.
                </p>
              </div>

              <div className="space-y-3.5 pt-2">
                {PROTOCOLE_CINQ_JALONS.map((etape) => (
                  <div
                    key={etape.num}
                    className="flex items-start gap-4 p-4 sm:p-5 rounded-2xl bg-white/[0.04] border border-white/12 hover:border-[#C99A68]/60 hover:bg-white/[0.07] transition-all"
                  >
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#C99A68]/20 border border-[#C99A68]/40 font-[family-name:var(--font-jakarta)] text-sm font-extrabold text-[#DFae79]">
                      {etape.num}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <h3 className="text-sm sm:text-base font-bold !text-white">
                          {etape.titre}
                        </h3>
                        <span className="rounded-full bg-[#C99A68]/15 border border-[#C99A68]/35 px-2.5 py-0.5 text-[10.5px] font-extrabold tracking-wider text-[#DFae79]">
                          {etape.trl}
                        </span>
                      </div>
                      <p className="text-xs sm:text-sm text-[#E5D7C6]/85 mt-1.5 leading-relaxed">
                        {etape.desc}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="lg:col-span-5 flex flex-col gap-5">
              <div className="relative w-full aspect-[4/4.3] rounded-3xl overflow-hidden shadow-2xl border border-[#C99A68]/35 bg-[#160B06]">
                <Image
                  src="/images/collaboration-innovante-ciat.png"
                  alt="Séance de travail collaboratif et revue de prototype entre ingénieurs et porteurs au CIAT Diamniadio"
                  fill
                  sizes="(max-width: 1024px) 100vw, 42vw"
                  className="object-cover object-center"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#160B06] via-[#160B06]/35 to-transparent" />
                <div className="absolute bottom-6 inset-x-6 text-white">
                  <blockquote className="font-[family-name:var(--font-jakarta)] text-base sm:text-lg font-semibold text-white leading-relaxed">
                    “L&apos;innovation utile ne se mesure pas aux intentions,
                    mais à un prototype éprouvé capable d&apos;opérer durablement
                    sur le terrain.”
                  </blockquote>
                  <span className="text-xs text-[#DFae79] font-extrabold uppercase tracking-wider block mt-3">
                    Direction Scientifique · CIAT ISEP Diamniadio
                  </span>
                </div>
              </div>

              <div className="rounded-2xl bg-white/[0.05] border border-white/12 p-5 flex items-center justify-between gap-4">
                <div>
                  <span className="block text-[11px] font-extrabold uppercase tracking-wider text-[#DFae79]">
                    Parcours Incubateur
                  </span>
                  <p className="text-xs text-[#E5D7C6] mt-0.5">
                    Découvrez le détail des livrables et du mentorat associé.
                  </p>
                </div>
                <Link
                  href="/portail/incubateur"
                  className="inline-flex items-center gap-1.5 rounded-xl bg-[#C99A68] hover:bg-[#DFae79] px-4 py-2.5 text-xs font-extrabold !text-[#24140D] shrink-0 transition"
                >
                  Explorer
                  <ArrowUpRight size={14} />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =====================================================================
       * SECTION 4 — PLATEFORMES TECHNOLOGIQUES & ATELIERS 4.0 (#ateliers)
       * ===================================================================== */}
      <section
        id="ateliers"
        className="scroll-mt-24 py-20 md:py-26 border-b border-[#E5D7C6] bg-[#FAF7F2]"
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-14">
            <div className="max-w-3xl">
              <div className="inline-flex items-center gap-3 mb-3">
                <span className="h-[1.5px] w-8 bg-[#612D10]" />
                <span className="text-[11px] font-extrabold uppercase tracking-[0.2em] text-[#612D10]">
                  Infrastructures d&apos;Ingénierie
                </span>
              </div>
              <h2 className="font-[family-name:var(--font-jakarta)] text-3xl sm:text-4xl lg:text-[40px] font-extrabold text-[#24140D] tracking-tight leading-[1.14]">
                Nos plateformes d&apos;expérimentation à Diamniadio
              </h2>
              <p className="mt-3 text-sm sm:text-base text-[#655346] leading-relaxed">
                Quatre plateaux techniques complémentaires ouverts aux cohortes
                incubées, aux filières ISEP et aux industriels partenaires.
              </p>
            </div>

            <Link
              href="/galerie"
              className="inline-flex items-center gap-2 rounded-xl border border-[#D8C7B5] bg-white hover:border-[#612D10] px-5 py-3 text-xs sm:text-sm font-bold text-[#24140D] transition shrink-0"
            >
              <span>Voir les prototypes usinés ici</span>
              <ArrowRight size={15} className="text-[#612D10]" />
            </Link>
          </div>

          <div className="grid gap-7 md:grid-cols-2">
            {PLATEFORMES_TECHNIQUES.map((infra) => (
              <article
                key={infra.num}
                className="group rounded-2xl border border-[#EFE4D6] bg-white overflow-hidden shadow-xs hover:shadow-xl hover:border-[#C99A68] transition-all duration-300 flex flex-col"
              >
                <div className="relative aspect-[16/9.5] w-full overflow-hidden bg-[#24140D]">
                  <Image
                    src={infra.image}
                    alt={infra.titre}
                    fill
                    sizes="(max-width: 768px) 100vw, 50vw"
                    className="object-cover group-hover:scale-105 transition-transform duration-500"
                  />

                  <div className="absolute top-4 left-4 right-4 flex items-center justify-between gap-2">
                    <span className="rounded-full bg-[#24140D]/88 border border-[#C99A68]/45 px-3.5 py-1 text-[11px] font-bold text-[#F5EADC] backdrop-blur-xs">
                      {infra.badge}
                    </span>
                    <span className="font-[family-name:var(--font-jakarta)] text-xs font-extrabold uppercase tracking-wider text-white bg-[#24140D]/80 px-3 py-1 rounded-full">
                      Plateau {infra.num}
                    </span>
                  </div>
                </div>

                <div className="p-6 sm:p-7 flex-1 flex flex-col justify-between">
                  <div>
                    <h3 className="font-[family-name:var(--font-jakarta)] text-lg sm:text-xl font-bold text-[#24140D] group-hover:text-[#612D10] transition-colors leading-snug">
                      {infra.titre}
                    </h3>
                    <p className="mt-2.5 text-xs sm:text-sm text-[#655346] leading-relaxed">
                      {infra.desc}
                    </p>
                  </div>

                  <div className="mt-5 pt-4 border-t border-[#EFE4D6] flex flex-wrap items-center justify-between gap-2 text-xs">
                    <span className="font-semibold text-[#612D10]">
                      {infra.specs}
                    </span>
                    <Link
                      href="/portail/contact"
                      className="inline-flex items-center gap-1 font-bold text-[#24140D] hover:text-[#612D10]"
                    >
                      Réserver un créneau
                      <ArrowUpRight size={14} />
                    </Link>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* =====================================================================
       * SECTION 5 — ARCHITECTURE NUMÉRIQUE CIAT 360 (#modules)
       * ===================================================================== */}
      <section
        id="modules"
        className="scroll-mt-24 py-20 md:py-24 border-b border-[#E5D7C6] bg-white"
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mb-14">
            <div className="inline-flex items-center gap-3 mb-3">
              <span className="h-[1.5px] w-8 bg-[#612D10]" />
              <span className="text-[11px] font-extrabold uppercase tracking-[0.2em] text-[#612D10]">
                Système d&apos;Information Unifié
              </span>
            </div>
            <h2 className="font-[family-name:var(--font-jakarta)] text-3xl sm:text-4xl lg:text-[40px] font-extrabold text-[#24140D] tracking-tight leading-[1.14]">
              Les 6 modules intégrés de l&apos;écosystème CIAT 360
            </h2>
            <p className="mt-3 text-sm sm:text-base text-[#655346] leading-relaxed">
              Au-delà de ses murs, le CIAT s&apos;appuie sur une infrastructure
              logicielle complète reliant porteurs de projets, mentors, jury
              d&apos;évaluation et partenaires industriels.
            </p>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {MODULES_CIAT_360.map((mod, idx) => {
              const Icon = mod.icon;
              return (
                <Link
                  key={mod.num}
                  href={mod.href}
                  className={`group rounded-2xl border border-[#EFE4D6] border-t-[3px] ${
                    idx % 2 === 0 ? "border-t-[#612D10]" : "border-t-[#C99A68]"
                  } bg-[#FAF7F2] hover:bg-white p-7 transition-all duration-200 hover:shadow-lg flex flex-col justify-between`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-5">
                      <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-white border border-[#EFE4D6] text-[#612D10] group-hover:bg-[#612D10] group-hover:text-white transition-colors">
                        <Icon size={20} />
                      </span>
                      <span className="font-[family-name:var(--font-jakarta)] text-xs font-extrabold tracking-widest text-[#612D10]">
                        MODULE {mod.num}
                      </span>
                    </div>

                    <h3 className="font-[family-name:var(--font-jakarta)] text-lg font-bold text-[#24140D] group-hover:text-[#612D10] transition-colors">
                      {mod.titre}
                    </h3>
                    <p className="mt-2 text-xs sm:text-sm text-[#655346] leading-relaxed">
                      {mod.desc}
                    </p>
                  </div>

                  <span className="mt-6 pt-4 border-t border-[#EFE4D6] inline-flex items-center justify-between text-xs font-bold text-[#612D10]">
                    <span>{mod.cta}</span>
                    <ArrowRight
                      size={15}
                      className="group-hover:translate-x-1 transition-transform"
                    />
                  </span>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* =====================================================================
       * SECTION 6 — CADRE OFFICIEL & DOCUMENTS DEMANDÉS (#documents-demandes)
       * ===================================================================== */}
      <section
        id="documents-demandes"
        className="scroll-mt-24 py-20 md:py-28 bg-[#FAF7F2] border-b border-[#E5D7C6] relative overflow-hidden"
      >
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-14">
            <div className="max-w-3xl">
              <div className="inline-flex items-center gap-3 mb-3">
                <span className="h-[1.5px] w-8 bg-[#612D10]" />
                <span className="text-[11px] font-extrabold uppercase tracking-[0.2em] text-[#612D10]">
                  Conformité &amp; Recevabilité
                </span>
              </div>
              <h2 className="font-[family-name:var(--font-jakarta)] text-3xl sm:text-4xl lg:text-[40px] font-extrabold text-[#24140D] tracking-tight leading-[1.14]">
                Les documents officiels requis pour intégrer le CIAT
              </h2>
              <p className="mt-3 text-sm sm:text-base leading-relaxed text-[#655346]">
                Pour garantir l&apos;équité et la traçabilité de
                l&apos;instruction, tout dossier soumis au comité scientifique
                comporte les trois pièces normées suivantes.
              </p>
            </div>

            <div className="shrink-0 flex items-center gap-2.5 bg-white px-4 py-2.5 rounded-2xl border border-[#E5D7C6] shadow-2xs text-xs font-bold text-[#612D10]">
              <ShieldCheck size={18} className="text-[#612D10]" />
              <span>Instruction collégiale ISEP Diamniadio</span>
            </div>
          </div>

          <div className="grid gap-8 lg:grid-cols-12 lg:items-stretch">
            <div className="lg:col-span-7 flex flex-col justify-between space-y-4">
              <div className="space-y-4">
                <div className="flex items-center justify-between pb-2.5 border-b border-[#E5D7C6]">
                  <span className="text-xs font-extrabold uppercase tracking-wider text-[#612D10]">
                    Pièces obligatoires au dossier
                  </span>
                  <span className="text-xs font-semibold text-[#655346]">
                    3 livrables exigés
                  </span>
                </div>

                {PIECES_JUSTIFICATIVES_DEMANDEES.map((piece) => (
                  <div
                    key={piece.num}
                    className="group relative rounded-2xl border border-[#E5D7C6] bg-white p-6 shadow-2xs hover:shadow-md hover:border-[#C99A68] transition-all duration-200"
                  >
                    <div className="flex items-start gap-4">
                      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#FAF7F2] border border-[#E5D7C6] font-[family-name:var(--font-jakarta)] text-sm font-extrabold text-[#612D10] group-hover:bg-[#24140D] group-hover:text-[#DFae79] transition-colors">
                        0{piece.num}
                      </span>

                      <div className="flex-1">
                        <h3 className="font-[family-name:var(--font-jakarta)] text-base font-bold text-[#24140D] group-hover:text-[#612D10] transition-colors">
                          {piece.titre}
                        </h3>
                        <p className="mt-1.5 text-xs sm:text-sm leading-relaxed text-[#655346]">
                          {piece.detail}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="p-5 rounded-2xl bg-white border border-[#E5D7C6] text-xs text-[#655346] flex items-start gap-3.5">
                <div className="h-9 w-9 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0 border border-emerald-200">
                  <CheckCircle2 size={18} />
                </div>
                <div>
                  <p className="font-bold text-[#24140D]">
                    Confidentialité garantie &amp; sauvegarde continue
                  </p>
                  <p className="mt-1 leading-relaxed">
                    Vos documents techniques demeurent strictement confidentiels
                    et sont archivés dans votre espace porteur sécurisé.
                  </p>
                </div>
              </div>
            </div>

            <div className="lg:col-span-5 flex flex-col justify-between gap-4">
              <div className="flex items-center justify-between pb-2.5 border-b border-[#E5D7C6]">
                <span className="text-xs font-extrabold uppercase tracking-wider text-[#612D10]">
                  Trames &amp; Règlements Officiels
                </span>
                <Link
                  href="/portail/documents"
                  className="text-xs font-bold text-[#612D10] hover:text-[#24140D] flex items-center gap-1"
                >
                  Centre documentaire <ArrowRight size={13} />
                </Link>
              </div>

              <div className="relative overflow-hidden rounded-2xl bg-[#24140D] p-7 text-white shadow-lg border border-[#C99A68]/30 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#DFae79] bg-white/10 px-3 py-1 rounded-full">
                      COHORTE 2026
                    </span>
                    <span className="text-[10px] font-mono font-semibold text-white/75 bg-white/10 px-2.5 py-0.5 rounded">
                      DOCX &amp; PDF
                    </span>
                  </div>

                  <h3 className="font-[family-name:var(--font-jakarta)] text-lg font-bold !text-white">
                    Canevas Officiel de Candidature
                  </h3>
                  <p className="mt-2 text-xs sm:text-sm leading-relaxed text-[#E5D7C6]">
                    Modèle structuré validé par la Direction Scientifique du
                    CIAT pour préparer votre soumission.
                  </p>
                </div>

                <div className="mt-6 pt-4 border-t border-white/12 flex items-center justify-between">
                  <span className="text-[11px] text-[#DFae79] font-semibold">
                    Trame recommandée
                  </span>
                  <Link
                    href="/portail/documents"
                    className="inline-flex items-center gap-2 text-xs font-extrabold bg-[#C99A68] hover:bg-[#DFae79] !text-[#24140D] py-2.5 px-4 rounded-xl transition"
                  >
                    <Download size={14} />
                    Télécharger
                  </Link>
                </div>
              </div>

              <div className="rounded-2xl border border-[#E5D7C6] bg-white p-6 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#612D10]">
                      PROPRIÉTÉ INTELLECTUELLE
                    </span>
                    <span className="text-[10px] font-bold text-[#612D10] bg-[#FAF7F2] border border-[#E5D7C6] px-2.5 py-0.5 rounded">
                      OAPI · PDF
                    </span>
                  </div>

                  <h3 className="font-[family-name:var(--font-jakarta)] text-base font-bold text-[#24140D]">
                    Charte des Inventeurs &amp; Brevets CIAT
                  </h3>
                  <p className="mt-1.5 text-xs leading-relaxed text-[#655346]">
                    Encadre la titularité des inventions, le partage équitable
                    des redevances et les accords de confidentialité.
                  </p>
                </div>

                <div className="mt-5 pt-3.5 border-t border-[#EFE4D6] flex items-center justify-between">
                  <span className="text-[11px] text-emerald-800 font-bold">
                    ✓ Droits des porteurs garantis
                  </span>
                  <Link
                    href="/portail/documents"
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-[#612D10] hover:text-[#24140D]"
                  >
                    <Download size={13} />
                    Consulter
                  </Link>
                </div>
              </div>

              <Link
                href="/portail/appels"
                className="w-full inline-flex items-center justify-center rounded-2xl bg-[#612D10] hover:bg-[#24140D] px-6 py-4 text-sm font-bold !text-white shadow-md transition-all gap-2.5"
              >
                <span>Voir l&apos;appel à candidatures en cours</span>
                <ArrowRight size={16} className="text-[#DFae79]" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* =====================================================================
       * BANDEAU PRESTIGE FINAL
       * ===================================================================== */}
      <section className="bg-[#24140D] text-white py-16 border-t border-[#C99A68]/25">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-1.5 text-center md:text-left">
            <h2 className="font-[family-name:var(--font-jakarta)] text-2xl sm:text-3xl font-extrabold !text-white">
              Prêt à façonner votre prototype à Diamniadio ?
            </h2>
            <p className="text-xs sm:text-sm text-[#E5D7C6] max-w-xl">
              Rejoignez la prochaine cohorte d&apos;incubation ou sollicitez nos
              plateaux techniques pour un partenariat industriel.
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3 shrink-0">
            <Link
              href="/portail/contact"
              className="inline-flex items-center justify-center rounded-xl border border-white/30 bg-white/10 px-6 py-3.5 text-xs sm:text-sm font-semibold !text-white transition hover:bg-white/20"
            >
              Contacter la Direction
            </Link>
            <Link
              href="/connexion?next=/incubateur"
              className="inline-flex items-center justify-center rounded-xl bg-[#C99A68] hover:bg-[#DFae79] px-6 py-3.5 text-xs sm:text-sm font-extrabold !text-[#24140D] shadow-lg transition"
            >
              Déposer une candidature
              <ArrowRight size={15} className="ml-2" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
