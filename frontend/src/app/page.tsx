import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Badge, ButtonLink, Card, ProjectStatusBadge } from "@/components/ui";
import { MODULES } from "@/lib/modules";

export const metadata: Metadata = {
  title: "CIAT — Centre d'Innovation, d'Application et de Transfert | ISEP Diamniadio",
  description:
    "Plateforme officielle du CIAT de l'ISEP Amadou Trawaré de Diamniadio : incubation d'élite, prototypage en ateliers, assistant IA souverain et valorisation des innovations technologiques.",
};

const PILIERS = [
  {
    code: "01",
    titre: "Rigueur & Excellence",
    soustitre: "Ancrage académique ISEP",
    texte:
      "L'exigence des enseignements professionnels de l'ISEP garantit la robustesse technique, la viabilité et la pertinence industrielle de chaque solution conçue.",
    badge: "Standards Académiques",
    icon: (
      <svg className="h-6 w-6 text-brun" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.8}
          d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z"
        />
      </svg>
    ),
  },
  {
    code: "02",
    titre: "Chaleur & Racines",
    soustitre: "Terre fertile de Diamniadio",
    texte:
      "Inspiré par les couleurs de la terre cuite et du terroir de Diamniadio, notre accompagnement est profondément bienveillant, humain et ancré au Sénégal.",
    badge: "Impact Territorial",
    icon: (
      <svg className="h-6 w-6 text-brun" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.8}
          d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      </svg>
    ),
  },
  {
    code: "03",
    titre: "Éclosion & Mentorat",
    soustitre: "De l'idée au prototype viable",
    texte:
      "Accueillir chaque porteur avec méthode, lui attribuer un mentor expert dédié et rythmer sa maturation jusqu'à l'obtention d'un prototype prêt au déploiement.",
    badge: "Mentorat 1-to-1",
    icon: (
      <svg className="h-6 w-6 text-brun" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.8}
          d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
        />
      </svg>
    ),
  },
  {
    code: "04",
    titre: "Futurisme & IA",
    soustitre: "Technologie sobre & souveraine",
    texte:
      "Une chaîne d'innovation démultipliée par l'intelligence artificielle générative et l'analyse décisionnelle, au service de la précision et de la décision humaine.",
    badge: "IA Éthique & RAG",
    icon: (
      <svg className="h-6 w-6 text-brun" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.8}
          d="M13 10V3L4 14h7v7l9-11h-7z"
        />
      </svg>
    ),
  },
];

const DOMAINES_CARDS = [
  {
    id: 1,
    nom: "TIC, Numérique, IA & Données",
    tags: "LLM Locaux · Vision · IoT",
    resume: "Systèmes d'IA embarqués, plateformes SaaS souveraines, jumeaux numériques et algorithmes décisionnels.",
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
      </svg>
    ),
  },
  {
    id: 2,
    nom: "Mécanique, Fabrication & Maintenance",
    tags: "Usinage CNC · Impression 3D · CFAO",
    resume: "Usinage de précision, fabrication additive avancée, bancs d'essai mécaniques et maintenance prédictive.",
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
  },
  {
    id: 3,
    nom: "Agriculture, Transformation & Environnement",
    tags: "Capteurs Sols · Écoséchoirs · Biomasse",
    resume: "Séchoirs solaires connectés, capteurs IoT d'irrigation et valorisation biotechnologique de la biomasse locale.",
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
      </svg>
    ),
  },
  {
    id: 4,
    nom: "Énergie & Énergies Renouvelables",
    tags: "Photovoltaïque · Micro-réseaux · Stockage",
    resume: "Micro-réseaux hybrides, gestionnaires de stockage par batterie et audits thermiques automatisés pour l'habitat.",
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M13 10V3L4 14h7v7l9-11h-7z" />
      </svg>
    ),
  },
  {
    id: 5,
    nom: "Pharmaceutique & Biomédical",
    tags: "Télémétrie · Traçabilité · Dispositifs",
    resume: "Dispositifs biomédicaux hospitaliers, traçabilité des intrants et maintenance d'équipements de soins de santé.",
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 12h6m-3-3v6m-7 4h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
      </svg>
    ),
  },
  {
    id: 6,
    nom: "Éducation & Formation Professionnelle",
    tags: "Simulateurs TP · EdTech · Compétences",
    resume: "Pédagogie active, simulateurs virtuels de travaux pratiques et plateformes d'évaluation par compétences professionnelles.",
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 14l9-5-9-5-9 5 9 5zm0 0l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14zm-4 6v-7.5l4-2.222" />
      </svg>
    ),
  },
  {
    id: 7,
    nom: "Services aux Collectivités & Incubation",
    tags: "Smart City · Chaînes de Valeur · Civisme",
    resume: "Gestion territoriale numérique, traçabilité des filières urbaines et gouvernance entrepreneuriale inclusive.",
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
      </svg>
    ),
  },
];

const ETAPES_ACCUEIL = [
  {
    stage: 1 as const,
    numero: "01",
    nom: "Dépôt de l'Idée",
    desc: "Candidature en ligne via le canevas officiel avec synthèse du besoin et pièces requises.",
    jalon: "Phase initiale",
    delai: "Semaine 1 - 2",
  },
  {
    stage: 2 as const,
    numero: "02",
    nom: "Comité de Sélection",
    desc: "Évaluation multicritère collégiale par un jury d'enseignants-chercheurs et d'industriels.",
    jalon: "Jury d'entrée",
    delai: "Semaine 3",
  },
  {
    stage: 3 as const,
    numero: "03",
    nom: "Incubation Active",
    desc: "Attribution d'un mentor dédié, revues d'étape régulières et jalons contractuels à 3 et 6 mois.",
    jalon: "Maturation & suivi",
    delai: "Mois 1 à 6",
  },
  {
    stage: 4 as const,
    numero: "04",
    nom: "Prototypage & Ateliers",
    desc: "Fabrication physique, tests et itérations dans les ateliers spécialisés et le FabLab ISEP.",
    jalon: "Fabrication réelle",
    delai: "Mois 3 à 9",
  },
  {
    stage: 5 as const,
    numero: "05",
    nom: "Galerie & Transfert",
    desc: "Showroom public, génération de QR Code sur salon et transfert économique vers l'industrie.",
    jalon: "Valorisation marché",
    delai: "Mois 9 à 12",
  },
];

export default function Home() {
  return (
    <>
      {/* =====================================================================
       * 1. HERO INSTITUTIONNEL MONUMENTAL (CHARTE CIAT PRESTIGE)
       * =================================================================== */}
      <section className="relative overflow-hidden border-b border-[#3d2315] bg-[#24140D] text-white">
        {/* Photographie officielle du campus ISEP Diamniadio en couverture intégrale */}
        <div className="absolute inset-0 -z-0">
          <Image
            src="/images/campus-isep.png"
            alt="Campus de l'ISEP Amadou Traoré de Diamniadio — Siège du CIAT"
            fill
            priority
            sizes="100vw"
            className="object-cover object-center scale-[1.02] transition-transform duration-1000"
          />
          {/* Double dégradé architectural sombre pour contraster le texte de façon irréprochable */}
          <div className="absolute inset-0 bg-gradient-to-r from-[#170B05]/96 via-[#22120A]/90 to-[#170B05]/82" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#1A0C06] via-transparent to-[#140804]/70" />
        </div>

        {/* Effet d'ambiance thermique et lueur ocre inspirée de Diamniadio */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-20 -top-20 h-[480px] w-[480px] rounded-full bg-[#C99A68]/15 blur-3xl"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -left-20 bottom-0 h-96 w-96 rounded-full bg-[#612D10]/40 blur-3xl"
        />

        <div className="relative mx-auto max-w-6xl px-4 py-20 md:py-28 lg:py-32">
          <div className="max-w-3xl space-y-7">
            {/* Badge officiel de souveraineté & ancrage républicain */}
            <div className="inline-flex items-center gap-2.5 rounded-full border border-[#C99A68]/40 bg-[#1C0D06]/85 px-4 py-1.5 text-xs font-bold uppercase tracking-[0.16em] text-[#EAD8C2] backdrop-blur-md shadow-lg">
              <span className="inline-block h-2 w-2 rounded-full bg-[#C99A68] animate-pulse" />
              <span>RÉPUBLIQUE DU SÉNÉGAL · ISEP AMADOU TRAORÉ DE DIAMNIADIO</span>
            </div>

            {/* Titre Principal : Typographie ciselée et contrastée */}
            <h1 className="text-3xl font-extrabold leading-[1.12] tracking-tight text-white sm:text-5xl lg:text-6xl drop-shadow-md">
              Centre d&apos;Innovation, d&apos;Application et de Transfert
              <span className="block mt-2 font-serif sm:font-sans font-light italic text-transparent bg-clip-text bg-gradient-to-r from-[#F5E5D3] via-[#C99A68] to-[#EAD8C2] text-2xl sm:text-4xl lg:text-5xl">
                Le Pôle d&apos;Incubation &amp; de Prototypage Technologique
              </span>
            </h1>

            {/* Accroche claire, précise et crédible */}
            <p className="max-w-2xl text-base leading-relaxed text-[#EAE0D5] md:text-lg font-normal drop-shadow-xs">
              Transformer l&apos;ingéniosité des apprenants et porteurs de projet en prototypes industriels viables. 
              Une plateforme unifiée orchestrant accompagnement rigoureux, ateliers spécialisés, assistance IA souveraine et valorisation économique à Diamniadio.
            </p>

            {/* Rangée de Boutons d'Action Premium */}
            <div className="flex flex-wrap items-center gap-3.5 pt-2">
              <ButtonLink
                href="/portail/incubateur"
                variant="accent"
                className="px-6 py-3.5 font-bold text-sm shadow-xl"
              >
                Découvrir l&apos;Incubateur →
              </ButtonLink>
              <ButtonLink
                href="/portail/appels"
                variant="secondary"
                className="!border-[#C99A68]/50 !bg-white/10 !text-white hover:!bg-white/20 px-5 py-3.5 text-sm backdrop-blur-md shadow-sm"
              >
                Appels à Projets 2026
              </ButtonLink>
              <ButtonLink
                href="/galerie"
                variant="secondary"
                className="!border-white/30 !bg-white/5 !text-white hover:!bg-white/15 px-5 py-3.5 text-sm backdrop-blur-md"
              >
                Galerie des Innovations (TRL)
              </ButtonLink>
            </div>

            {/* Repère territorial officiel avec localisation certifiée */}
            <div className="flex flex-wrap items-center gap-3 pt-2 text-xs text-[#EAE0D5]">
              <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 backdrop-blur-sm font-semibold border border-white/15">
                <span className="inline-block h-2 w-2 rounded-full bg-succes" />
                Campus ISEP Diamniadio
              </span>
              <span className="text-[#C99A68]">·</span>
              <span>Cité du Savoir · Pôle Urbain de Diamniadio, Sénégal</span>
            </div>
          </div>

          {/* Bento des 4 Indicateurs Clés de l'Écosystème */}
          <div className="mt-14 grid grid-cols-2 gap-4 border-t border-white/15 pt-10 sm:grid-cols-4">
            <div className="group relative overflow-hidden rounded-2xl border border-white/15 bg-white/5 p-5 backdrop-blur-md transition-all duration-300 hover:border-[#C99A68]/60 hover:bg-white/10 hover:-translate-y-1">
              <div className="h-0.5 w-full bg-gradient-to-r from-transparent via-[#C99A68] to-transparent absolute top-0 left-0" />
              <span className="block text-3xl sm:text-4xl font-extrabold text-[#F5E5D3] tracking-tight">07</span>
              <span className="mt-1.5 block text-xs font-semibold text-[#EAE0D5]">
                Filières Technologiques Stratégiques
              </span>
              <span className="mt-2 block text-[11px] text-[#C99A68] font-medium">Numérique, Énergies, BTP, Agro...</span>
            </div>

            <div className="group relative overflow-hidden rounded-2xl border border-white/15 bg-white/5 p-5 backdrop-blur-md transition-all duration-300 hover:border-[#C99A68]/60 hover:bg-white/10 hover:-translate-y-1">
              <div className="h-0.5 w-full bg-gradient-to-r from-transparent via-[#C99A68] to-transparent absolute top-0 left-0" />
              <span className="block text-3xl sm:text-4xl font-extrabold text-[#F5E5D3] tracking-tight">05</span>
              <span className="mt-1.5 block text-xs font-semibold text-[#EAE0D5]">
                Jalons de l&apos;Idée au Marché
              </span>
              <span className="mt-2 block text-[11px] text-[#C99A68] font-medium">Contrat d&apos;incubation méthodique</span>
            </div>

            <div className="group relative overflow-hidden rounded-2xl border border-white/15 bg-white/5 p-5 backdrop-blur-md transition-all duration-300 hover:border-[#C99A68]/60 hover:bg-white/10 hover:-translate-y-1">
              <div className="h-0.5 w-full bg-gradient-to-r from-transparent via-[#C99A68] to-transparent absolute top-0 left-0" />
              <span className="block text-3xl sm:text-4xl font-extrabold text-[#F5E5D3] tracking-tight">06</span>
              <span className="mt-1.5 block text-xs font-semibold text-[#EAE0D5]">
                Modules Métiers CIAT 360
              </span>
              <span className="mt-2 block text-[11px] text-[#C99A68] font-medium">Architecture unifiée temps réel</span>
            </div>

            <div className="group relative overflow-hidden rounded-2xl border border-white/15 bg-white/5 p-5 backdrop-blur-md transition-all duration-300 hover:border-[#C99A68]/60 hover:bg-white/10 hover:-translate-y-1">
              <div className="h-0.5 w-full bg-gradient-to-r from-transparent via-[#C99A68] to-transparent absolute top-0 left-0" />
              <span className="block text-3xl sm:text-4xl font-extrabold text-[#F5E5D3] tracking-tight">100%</span>
              <span className="mt-1.5 block text-xs font-semibold text-[#EAE0D5]">
                Prototypage Physique Réel
              </span>
              <span className="mt-2 block text-[11px] text-[#C99A68] font-medium">Laboratoires &amp; Ateliers ISEP</span>
            </div>
          </div>
        </div>
      </section>

      {/* =====================================================================
       * 2. VITRINE DE RÉASSURANCE : SPOTLIGHT SUR LES PROTOTYPES DU CIAT
       * =================================================================== */}
      <section className="border-b border-[#EFE4D6] bg-[#FAF7F2] py-8">
        <div className="mx-auto max-w-6xl px-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="flex h-3 w-3 rounded-full bg-succes animate-ping" />
              <span className="text-xs font-bold uppercase tracking-[0.14em] text-brun">
                Showroom R&amp;D en Direct
              </span>
              <span className="hidden sm:inline text-xs text-texte-doux">|</span>
              <span className="hidden sm:inline text-xs text-texte-doux">
                Prototypes opérationnels issus de l&apos;incubation active
              </span>
            </div>
            <div className="flex items-center gap-4 text-xs font-semibold">
              <Link
                href="/galerie"
                className="inline-flex items-center gap-1.5 text-brun hover:text-beige transition-colors"
              >
                <span>Consulter les fiches avec QR Code officiel</span>
                <span className="text-beige font-bold">→</span>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* =====================================================================
       * 3. LES 4 PILIERS DE LA MARQUE (Charte Graphique Page 02)
       * =================================================================== */}
      <section className="border-b border-bordure bg-white py-16 md:py-24">
        <div className="mx-auto max-w-6xl px-4">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div className="max-w-2xl space-y-2">
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-beige">
                Identité de Marque &amp; Valeurs Fondatrices
              </p>
              <h2 className="text-2xl font-extrabold text-brun sm:text-4xl tracking-tight">
                Les 4 Piliers Fondamentaux du CIAT
              </h2>
              <p className="text-sm leading-relaxed text-texte-doux">
                Inscrits à la charte officielle de l&apos;ISEP, ces 4 piliers dictent l&apos;éthique de nos jurys, 
                la rigueur de nos laboratoires et l&apos;excellence technique de chaque brevet ou prototype.
              </p>
            </div>
            <div className="shrink-0">
              <span className="inline-flex items-center gap-2 rounded-xl border border-bordure bg-[#FAF7F2] px-3.5 py-2 text-xs font-bold text-brun">
                <span className="h-2 w-2 rounded-full bg-beige" />
                Norme CIAT 360 · Écosystème Qualité
              </span>
            </div>
          </div>

          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {PILIERS.map((p) => (
              <div
                key={p.code}
                className="group relative flex flex-col justify-between rounded-2xl border border-[#EFE4D6] bg-[#FAF7F2]/60 p-6 shadow-xs transition-all duration-300 hover:-translate-y-1.5 hover:border-[#C99A68] hover:bg-white hover:shadow-[0_16px_32px_-6px_rgba(97,45,16,0.1)]"
              >
                <div className="h-1 w-0 bg-gradient-to-r from-brun via-beige to-brun transition-all duration-300 group-hover:w-full absolute top-0 left-0 rounded-t-2xl" />
                
                <div>
                  <div className="flex items-center justify-between">
                    <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brun font-[family-name:var(--font-title)] text-xs font-extrabold text-white shadow-sm group-hover:scale-105 transition-transform">
                      {p.code}
                    </span>
                    <div className="rounded-xl border border-[#EFE4D6] bg-white p-2.5 shadow-2xs group-hover:border-beige/50 transition-colors">
                      {p.icon}
                    </div>
                  </div>

                  <span className="mt-5 inline-block text-[10px] font-bold uppercase tracking-wider text-beige">
                    {p.badge}
                  </span>
                  <h3 className="mt-1 text-lg font-bold text-brun group-hover:text-brun-fonce">
                    {p.titre}
                  </h3>
                  <p className="text-xs font-semibold text-texte-doux">
                    {p.soustitre}
                  </p>
                  <p className="mt-3 text-xs leading-relaxed text-texte-doux">
                    {p.texte}
                  </p>
                </div>

                <div className="mt-6 border-t border-bordure/60 pt-3.5 flex items-center justify-between text-[11px] font-bold text-brun">
                  <span>Engagement institutionnel</span>
                  <span className="text-beige group-hover:translate-x-1 transition-transform">→</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* =====================================================================
       * 4. LES 7 DOMAINES D'APPLICATION PRIORITAIRES (Cahier des charges ISEP)
       * =================================================================== */}
      <section className="border-b border-bordure bg-[#FAF7F2] py-16 md:py-24">
        <div className="mx-auto max-w-6xl px-4">
          <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
            <div className="max-w-2xl space-y-2">
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-beige">
                Pôles Technologiques &amp; Sectoriels
              </p>
              <h2 className="text-2xl font-extrabold text-brun sm:text-4xl tracking-tight">
                Les 7 Filières d&apos;Intervention Prioritaires
              </h2>
              <p className="text-sm text-texte-doux">
                Définis selon les besoins stratégiques du Sénégal et du tissu industriel ouest-africain, 
                ces 7 pôles encadrent l&apos;accès aux laboratoires et financements du CIAT.
              </p>
            </div>
            <ButtonLink
              href="/portail/domaines"
              variant="secondary"
              className="shrink-0 text-xs shadow-xs"
            >
              Consulter le détail des 7 filières →
            </ButtonLink>
          </div>

          <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {DOMAINES_CARDS.map((d) => (
              <Link
                key={d.id}
                href={`/portail/projets?domaine=${d.id}`}
                className="group relative flex flex-col justify-between rounded-2xl border border-[#EFE4D6] bg-white p-6 shadow-xs transition-all duration-300 hover:-translate-y-1.5 hover:border-[#C99A68] hover:shadow-[0_16px_36px_-6px_rgba(97,45,16,0.1)]"
              >
                <div className="h-0.5 w-0 bg-gradient-to-r from-beige to-brun transition-all duration-300 group-hover:w-full absolute top-0 left-0" />

                <div>
                  <div className="flex items-center justify-between">
                    <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-beige/20 text-xs font-extrabold text-brun">
                      0{d.id}
                    </span>
                    <span className="rounded-lg bg-[#FAF7F2] p-2 text-brun-fonce opacity-70 group-hover:opacity-100 group-hover:text-beige transition-colors border border-bordure/60">
                      {d.icon}
                    </span>
                  </div>

                  <span className="mt-4 block text-[10px] font-bold uppercase tracking-wider text-beige">
                    {d.tags}
                  </span>
                  <h3 className="mt-1 text-base font-bold text-brun group-hover:text-brun-fonce">
                    {d.nom}
                  </h3>
                  <p className="mt-2.5 text-xs leading-relaxed text-texte-doux">
                    {d.resume}
                  </p>
                </div>

                <div className="mt-6 flex items-center justify-between border-t border-bordure/70 pt-3.5 text-[11px] font-bold text-brun">
                  <span>Explorer les projets incubés</span>
                  <span className="text-beige group-hover:translate-x-1.5 transition-transform duration-200">→</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* =====================================================================
       * 5. LE PARCOURS D'INCUBATION EN 5 JALONS CONTRACTUELS (Page 09 Charte)
       * =================================================================== */}
      <section className="border-b border-bordure bg-white py-16 md:py-24">
        <div className="mx-auto max-w-6xl px-4">
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
            <div className="max-w-2xl space-y-2">
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-beige">
                Méthodologie Contractuelle &amp; Maturation
              </p>
              <h2 className="text-2xl font-extrabold text-brun sm:text-4xl tracking-tight">
                Le Parcours d&apos;Incubation en 5 Jalons
              </h2>
              <p className="text-sm text-texte-doux">
                De la première esquisse jusqu&apos;à la signature partenariale, chaque porteur franchit des étapes validées
                garantissant la fiabilité technique et la valeur marchande du prototype.
              </p>
            </div>
            <ButtonLink href="/portail/incubateur" variant="primary" className="shrink-0 text-xs shadow-sm">
              Guide complet du parcours →
            </ButtonLink>
          </div>

          {/* Stepper / Timeline avec cartes architecturales */}
          <div className="mt-12 grid gap-5 md:grid-cols-5">
            {ETAPES_ACCUEIL.map((e) => (
              <div
                key={e.stage}
                className="relative flex flex-col justify-between rounded-2xl border border-[#EFE4D6] bg-[#FAF7F2] p-5.5 transition-all duration-300 hover:border-beige hover:bg-white hover:shadow-md"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="font-[family-name:var(--font-title)] text-xs font-extrabold text-beige">
                      JALON {e.numero}
                    </span>
                    <span className="rounded-full bg-white px-2 py-0.5 text-[10px] font-bold uppercase text-texte-doux border border-bordure">
                      {e.delai}
                    </span>
                  </div>

                  <div className="mt-4">
                    <ProjectStatusBadge stage={e.stage} />
                  </div>

                  <h3 className="mt-3 text-base font-bold text-brun">
                    {e.nom}
                  </h3>
                  <p className="mt-2 text-xs leading-relaxed text-texte-doux">
                    {e.desc}
                  </p>
                </div>

                <div className="mt-5 border-t border-bordure/60 pt-3 text-[11px] font-semibold text-brun">
                  <span className="text-beige">✔</span> Validation obligatoire
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* =====================================================================
       * 6. LES 6 MODULES DE LA PLATEFORME UNIFIÉE (CIAT 360)
       * =================================================================== */}
      <section className="mx-auto max-w-6xl px-4 py-16 md:py-24">
        <div className="mb-12 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div className="max-w-2xl space-y-2">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-beige">
              Écosystème Numérique Intégré
            </p>
            <h2 className="text-2xl font-extrabold text-brun sm:text-4xl tracking-tight">
              Les 6 Modules Interconnectés du CIAT
            </h2>
            <p className="text-sm text-texte-doux">
              Une seule base de données unifiée partagée en temps réel entre porteurs, comités, mentors et direction générale.
            </p>
          </div>
          <Badge tone="info">Architecture Unifiée 6-en-1</Badge>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {MODULES.map((m, idx) => (
            <Link key={m.slug} href={m.href} className="group block transition-transform hover:-translate-y-1">
              <Card className="flex h-full flex-col justify-between transition-all duration-300 group-hover:border-beige group-hover:shadow-[0_16px_36px_-6px_rgba(97,45,16,0.12)]">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="flex h-6.5 w-14 items-center justify-center rounded-lg bg-beige/20 text-[11px] font-extrabold uppercase tracking-wider text-brun">
                      P{idx + 1}
                    </span>
                    <span className="text-xs font-bold text-brun group-hover:text-beige transition-colors flex items-center gap-1">
                      <span>Accéder</span>
                      <span className="group-hover:translate-x-1 transition-transform">→</span>
                    </span>
                  </div>
                  <h3 className="mt-4 text-lg font-bold text-brun group-hover:text-brun-fonce">
                    {m.titre}
                  </h3>
                  <p className="mt-2.5 text-xs leading-relaxed text-texte-doux">
                    {m.description}
                  </p>
                </div>
                <div className="mt-6 border-t border-bordure pt-3.5 text-[11px] font-semibold text-texte-doux flex items-center justify-between">
                  <span>Module CIAT 360</span>
                  <span className="text-[10px] uppercase font-bold text-beige">Prêt</span>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      </section>

      {/* =====================================================================
       * 7. BANDEAU D'APPEL À L'ACTION & CANDIDATURE
       * =================================================================== */}
      <section className="border-t border-[#3d2315] bg-gradient-to-r from-[#24140D] via-[#3D1D10] to-[#24140D] text-white py-16 md:py-20 shadow-inner">
        <div className="mx-auto max-w-6xl px-4">
          <div className="flex flex-col items-start justify-between gap-8 md:flex-row md:items-center">
            <div className="max-w-2xl space-y-3">
              <div className="inline-flex items-center gap-2 rounded-full border border-beige/40 bg-white/10 px-3.5 py-1 text-xs font-bold text-beige backdrop-blur-sm">
                Orientation &amp; Sélection Continue 2026
              </div>
              <h2 className="text-2xl font-extrabold !text-white sm:text-4xl tracking-tight">
                Vous avez un projet innovant ou un besoin de prototypage ?
              </h2>
              <p className="text-sm leading-relaxed text-[#EAE0D5]">
                Que vous soyez apprenant de l&apos;ISEP, diplômé en insertion ou entreprise partenaire, 
                le CIAT met à votre disposition ses ateliers, ses bancs de test et son réseau de mentors à Diamniadio.
              </p>
            </div>

            <div className="flex flex-wrap gap-3.5 shrink-0">
              <ButtonLink
                href="/connexion?next=/incubateur"
                variant="accent"
                className="font-bold text-sm px-6 py-3.5 shadow-xl"
              >
                Déposer une Candidature
              </ButtonLink>
              <ButtonLink
                href="/portail/contact"
                variant="secondary"
                className="!text-white !border-white/50 !bg-white/10 hover:!bg-white/20 text-sm px-5 py-3.5 backdrop-blur-sm"
              >
                Contacter le Secrétariat
              </ButtonLink>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
