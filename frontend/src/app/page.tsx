import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Badge, ButtonLink, Card, ProjectStatusBadge } from "@/components/ui";
import { MODULES } from "@/lib/modules";

export const metadata: Metadata = {
  title: "Accueil — Centre d'Innovation, d'Application et de Transfert",
  description: "Plateforme du CIAT de l'ISEP Amadou Trawaré de Diamniadio : portail d'innovation, incubateur, galerie des prototypes et accompagnement de projets.",
};

const PILIERS = [
  {
    code: "01",
    titre: "Rigueur & Excellence",
    soustitre: "Ancrage académique ISEP",
    texte: "L'exigence professionnelle de l'ISEP garantit la robustesse technique, la viabilité et la pertinence industrielle des solutions conçues.",
    icon: (
      <svg className="h-6 w-6 text-brun" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
      </svg>
    ),
  },
  {
    code: "02",
    titre: "Chaleur & Racines",
    soustitre: "Terre fertile de Diamniadio",
    texte: "Couleurs inspirées de la terre cuite et du sol fécond de Diamniadio, incarnant un accompagnement bienveillant et profondément ancré au Sénégal.",
    icon: (
      <svg className="h-6 w-6 text-brun" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
  {
    code: "03",
    titre: "Éclosion & Mentorat",
    soustitre: "De l'idée au prototype viable",
    texte: "Accueillir chaque talent avec méthode, attribuer un mentor expert et guider la maturation progressive vers un prototype opérationnel.",
    icon: (
      <svg className="h-6 w-6 text-brun" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
      </svg>
    ),
  },
  {
    code: "04",
    titre: "Futurisme & IA",
    soustitre: "Technologie sobre & souveraine",
    texte: "Une innovation augmentée par les modèles génératifs et les outils décisionnels, au service de l'ergonomie et de la prise de décision rapide.",
    icon: (
      <svg className="h-6 w-6 text-brun" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
      </svg>
    ),
  },
];

const DOMAINES_CARDS = [
  {
    id: 1,
    nom: "TIC, Numérique, IA & Données",
    resume: "Modèles de langage locaux, vision par ordinateur, plateformes SaaS souveraines et jumeaux numériques.",
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
      </svg>
    ),
  },
  {
    id: 2,
    nom: "Mécanique, Fabrication & Maintenance",
    resume: "Usinage numérique, fabrication additive 3D, bancs d'essai industriels et maintenance prédictive.",
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
  },
  {
    id: 3,
    nom: "Agriculture, Transformation & Environnement",
    resume: "Séchoirs solaires connectés, capteurs IoT d'irrigation et valorisation durable de la biomasse locale.",
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
      </svg>
    ),
  },
  {
    id: 4,
    nom: "Énergie & Énergies Renouvelables",
    resume: "Micro-réseaux hybrides, gestionnaires de stockage d'énergie et audits thermiques automatisés.",
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
      </svg>
    ),
  },
  {
    id: 5,
    nom: "Pharmaceutique & Biomédical",
    resume: "Dispositifs biomédicaux hospitaliers, traçabilité des intrants et maintenance d'équipements de soins.",
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-3-3v6m-7 4h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
      </svg>
    ),
  },
  {
    id: 6,
    nom: "Éducation & Formation Professionnelle",
    resume: "EdTech active, simulateurs virtuels de travaux pratiques et plateformes d'évaluation par compétences.",
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l9-5-9-5-9 5 9 5zm0 0l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14zm-4 6v-7.5l4-2.222" />
      </svg>
    ),
  },
  {
    id: 7,
    nom: "Services aux Collectivités & Incubation",
    resume: "Gestion municipale intelligente, traçabilité des filières urbaines et gouvernance entrepreneuriale.",
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
      </svg>
    ),
  },
];

const ETAPES_ACCUEIL = [
  {
    stage: 1 as const,
    numero: "01",
    nom: "Dépôt de l'Idée",
    desc: "Candidature en ligne via le canevas type officiel avec pièces justificatives obligatoires.",
    jalon: "Phase initiale",
  },
  {
    stage: 2 as const,
    numero: "02",
    nom: "Comité de Sélection",
    desc: "Évaluation multicritère par un jury d'experts industriels et enseignants-chercheurs.",
    jalon: "Entrée incubateur",
  },
  {
    stage: 3 as const,
    numero: "03",
    nom: "Incubation Active",
    desc: "Attribution d'un mentor dédié, revues trimestrielles et jalons contractuels à 3 et 6 mois.",
    jalon: "Maturation & suivi",
  },
  {
    stage: 4 as const,
    numero: "04",
    nom: "Prototypage & Ateliers",
    desc: "Fabrication concrète et tests en ateliers techniques et laboratoires spécialisés de l'ISEP.",
    jalon: "Réalisation physique",
  },
  {
    stage: 5 as const,
    numero: "05",
    nom: "Partenariats & Galerie",
    desc: "Publication au showroom public, valorisation industrielle et mise en relation investisseurs.",
    jalon: "Transfert marché",
  },
];

export default function Home() {
  return (
    <>
      {/* 1. HERO INSTITUTIONNEL HAUT DE GAMME : RESPECT STRICT DE LA CHARTE CIAT */}
      <section className="relative overflow-hidden border-b border-[#3d2315] bg-gradient-to-b from-[#24140D] via-[#2F170D] to-[#3D1D10] text-white">
        {/* Photographie officielle du campus ISEP Diamniadio en couverture intégrale */}
        <div className="absolute inset-0 -z-0">
          <Image
            src="/images/campus-isep.png"
            alt="Campus officiel de l'ISEP Amadou Trawaré de Diamniadio — Siège du CIAT"
            fill
            priority
            sizes="100vw"
            className="object-cover object-center"
          />
          {/* Overlay sombre élégant avec les teintes CIAT pour garantir un contraste parfait */}
          <div className="absolute inset-0 bg-gradient-to-r from-[#1C0D06]/95 via-[#24140D]/88 to-[#1C0D06]/80" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#1C0D06] via-transparent to-[#1C0D06]/60" />
        </div>

        {/* Glow atmosphérique chaleureux rappelant la terre de Diamniadio */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-24 -top-24 h-96 w-96 rounded-full bg-beige/10 blur-3xl"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -left-24 bottom-0 h-80 w-80 rounded-full bg-brun/30 blur-3xl"
        />

        <div className="relative mx-auto max-w-6xl px-4 py-20 md:py-28">
          <div className="max-w-3xl space-y-6">
            {/* Badge officiel de cadrage républicain & académique */}
            <div className="inline-flex items-center gap-2.5 rounded-full border border-beige/40 bg-[#1C0D06]/75 px-4 py-1.5 text-xs font-bold uppercase tracking-[0.14em] text-beige backdrop-blur-md shadow-sm">
              <span className="inline-block h-2 w-2 rounded-full bg-beige animate-pulse" />
              <span>RÉPUBLIQUE DU SÉNÉGAL · ISEP AMADOU TRAORÉ DE DIAMNIADIO</span>
            </div>

            {/* Titre Institutionnel avec typographie Plus Jakarta Sans */}
            <h1 className="text-3xl font-extrabold leading-[1.15] tracking-tight !text-white sm:text-5xl lg:text-6xl drop-shadow-md">
              Centre d&apos;Innovation, d&apos;Application et de Transfert
              <span className="block mt-2 bg-gradient-to-r from-beige via-[#f3e5d3] to-beige bg-clip-text text-transparent">
                L&apos;Incubateur Technologique d&apos;Excellence
              </span>
            </h1>

            {/* Accroche claire et précise */}
            <p className="max-w-2xl text-base leading-relaxed text-[#ebd9c0] md:text-lg drop-shadow-xs">
              Accompagner les apprenants, diplômés et créateurs de l&apos;idée brute jusqu&apos;au prototype industriel viable.
              Une plateforme unifiée réunissant incubation méthodique, ateliers techniques, assistance IA et valorisation économique.
            </p>

            {/* Boutons d'Action Clés */}
            <div className="flex flex-wrap items-center gap-3.5 pt-2">
              <ButtonLink href="/portail/incubateur" variant="accent" className="px-6 py-3 font-bold text-sm shadow-lg">
                Découvrir l&apos;Incubateur →
              </ButtonLink>
              <ButtonLink
                href="/portail/appels"
                variant="secondary"
                className="!border-beige/50 !text-white hover:!bg-white/10 px-5 py-3 text-sm backdrop-blur-sm"
              >
                Appels à Projets Ouverts
              </ButtonLink>
              <ButtonLink
                href="/portail/projets"
                variant="secondary"
                className="!border-white/30 !text-white hover:!bg-white/10 px-5 py-3 text-sm backdrop-blur-sm"
              >
                Annuaire des Projets
              </ButtonLink>
            </div>

            {/* Repère d'ancrage territorial avec badge campus */}
            <div className="flex flex-wrap items-center gap-3 pt-3 text-xs text-[#ebd9c0]">
              <span className="inline-flex items-center gap-1.5 rounded-md bg-white/10 px-2.5 py-1 backdrop-blur-sm font-semibold">
                <span className="inline-block h-2 w-2 rounded-full bg-succes" />
                Campus ISEP Diamniadio
              </span>
              <span>·</span>
              <span>Pôle Urbain de Diamniadio, Sénégal</span>
            </div>
          </div>

          {/* Bandeau de Chiffres-Clés & Repères Structurants */}
          <div className="mt-12 grid grid-cols-2 gap-4 border-t border-white/15 pt-8 sm:grid-cols-4">
            <div className="rounded-xl border border-white/10 bg-white/5 p-4">
              <span className="block text-3xl font-extrabold text-beige">7</span>
              <span className="mt-1 block text-xs font-medium text-[#ebd9c0]">
                Filières Technologiques Stratégiques
              </span>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/5 p-4">
              <span className="block text-3xl font-extrabold text-beige">5</span>
              <span className="mt-1 block text-xs font-medium text-[#ebd9c0]">
                Jalons de l&apos;Idée au Transfert
              </span>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/5 p-4">
              <span className="block text-3xl font-extrabold text-beige">6</span>
              <span className="mt-1 block text-xs font-medium text-[#ebd9c0]">
                Modules Numériques Interconnectés
              </span>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/5 p-4">
              <span className="block text-3xl font-extrabold text-beige">100%</span>
              <span className="mt-1 block text-xs font-medium text-[#ebd9c0]">
                Prototypage &amp; Validation Réels
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* 2. LES 4 PILIERS DE LA MARQUE (Page 02 de la Charte Graphique) */}
      <section className="border-b border-bordure bg-white py-14 md:py-20">
        <div className="mx-auto max-w-6xl px-4">
          <div className="max-w-2xl">
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-beige">
              Identité de Marque &amp; Valeurs Fondatrices
            </p>
            <h2 className="mt-1.5 text-2xl font-extrabold text-brun sm:text-3xl">
              Les 4 Piliers Fondamentaux du CIAT
            </h2>
            <p className="mt-2 text-sm text-texte-doux">
              Inscrits à la charte officielle, ces piliers guident chaque accompagnement technique,
              chaque délibération de jury et chaque innovation issue de l&apos;ISEP.
            </p>
          </div>

          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {PILIERS.map((p) => (
              <div
                key={p.code}
                className="group relative flex flex-col justify-between rounded-xl border border-bordure bg-ivoire p-6 transition-all duration-200 hover:-translate-y-1 hover:border-beige hover:shadow-md"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-brun font-[family-name:var(--font-title)] text-xs font-bold text-white shadow-sm">
                      {p.code}
                    </span>
                    <div className="rounded-md bg-beige/20 p-2">
                      {p.icon}
                    </div>
                  </div>

                  <h3 className="mt-4 text-base font-bold text-brun">
                    {p.titre}
                  </h3>
                  <p className="text-xs font-semibold text-beige">
                    {p.soustitre}
                  </p>
                  <p className="mt-3 text-xs leading-relaxed text-texte-doux">
                    {p.texte}
                  </p>
                </div>

                <div className="mt-4 border-t border-bordure/60 pt-3 text-[11px] font-semibold text-brun group-hover:text-beige">
                  Norme CIAT 360 →
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 3. LES 7 DOMAINES D'APPLICATION PRIORITAIRES (Cahier des charges ISEP) */}
      <section className="border-b border-bordure bg-ivoire py-14 md:py-20">
        <div className="mx-auto max-w-6xl px-4">
          <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-beige">
                Filières Technologiques &amp; Sectorielles
              </p>
              <h2 className="mt-1.5 text-2xl font-extrabold text-brun sm:text-3xl">
                Les 7 Domaines d&apos;Intervention Prioritaires
              </h2>
              <p className="mt-2 max-w-2xl text-sm text-texte-doux">
                Définis selon les besoins du tissu économique national, ces 7 axes encadrent l&apos;éligibilité
                des projets aux ateliers et financements du CIAT.
              </p>
            </div>
            <ButtonLink href="/portail/domaines" variant="secondary" className="shrink-0 text-xs">
              Consulter le détail des 7 filières →
            </ButtonLink>
          </div>

          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {DOMAINES_CARDS.map((d) => (
              <Link
                key={d.id}
                href={`/portail/projets?domaine=${d.id}`}
                className="group flex flex-col justify-between rounded-xl border border-bordure bg-white p-5 transition-all duration-200 hover:-translate-y-1 hover:border-beige hover:shadow-md"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="flex h-7 w-7 items-center justify-center rounded-full bg-beige/20 text-xs font-bold text-brun">
                      0{d.id}
                    </span>
                    <span className="text-brun-fonce opacity-70 group-hover:opacity-100 group-hover:text-beige transition-colors">
                      {d.icon}
                    </span>
                  </div>

                  <h3 className="mt-3 text-sm font-bold text-brun group-hover:text-brun-fonce">
                    {d.nom}
                  </h3>
                  <p className="mt-2 text-xs leading-relaxed text-texte-doux">
                    {d.resume}
                  </p>
                </div>

                <div className="mt-4 flex items-center justify-between border-t border-bordure/60 pt-3 text-[11px] font-semibold text-brun">
                  <span>Voir les projets de la filière</span>
                  <span className="text-beige group-hover:translate-x-1 transition-transform">→</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* 4. LE PARCOURS D'INCUBATION EN 5 JALONS OFFICIELS (Page 09 de la Charte) */}
      <section className="border-b border-bordure bg-white py-14 md:py-20">
        <div className="mx-auto max-w-6xl px-4">
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-beige">
                Méthodologie Contractuelle Porteur
              </p>
              <h2 className="mt-1.5 text-2xl font-extrabold text-brun sm:text-3xl">
                Le Parcours d&apos;Incubation en 5 Jalons
              </h2>
              <p className="mt-2 max-w-2xl text-sm text-texte-doux">
                De l&apos;idée jusqu&apos;à la signature partenariale, chaque porteur valide des jalons formels
                garantissant la qualité et la maturité de son prototype.
              </p>
            </div>
            <ButtonLink href="/portail/incubateur" variant="primary" className="shrink-0 text-xs">
              Guide complet du parcours →
            </ButtonLink>
          </div>

          <div className="mt-10 grid gap-4 md:grid-cols-5">
            {ETAPES_ACCUEIL.map((e) => (
              <div
                key={e.stage}
                className="relative flex flex-col justify-between rounded-xl border border-bordure bg-ivoire p-5 transition-all hover:border-beige hover:shadow-sm"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="font-[family-name:var(--font-title)] text-xs font-extrabold text-beige">
                      ÉTAPE {e.numero}
                    </span>
                    <span className="text-[10px] uppercase font-semibold text-texte-doux">
                      {e.jalon}
                    </span>
                  </div>

                  <div className="mt-3">
                    <ProjectStatusBadge stage={e.stage} />
                  </div>

                  <h3 className="mt-3 text-sm font-bold text-brun">
                    {e.nom}
                  </h3>
                  <p className="mt-2 text-xs leading-relaxed text-texte-doux">
                    {e.desc}
                  </p>
                </div>

                <div className="mt-4 border-t border-bordure/60 pt-3 text-[11px] font-semibold text-texte-doux">
                  Validation obligatoire
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 5. LES 6 MODULES DE LA PLATEFORME UNIFIÉE (CIAT 360) */}
      <section className="mx-auto max-w-6xl px-4 py-14 md:py-20">
        <div className="mb-10 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-beige">
              Écosystème Numérique Intégré
            </p>
            <h2 className="mt-1.5 text-2xl font-extrabold text-brun sm:text-3xl">
              Les 6 Modules Interconnectés du CIAT
            </h2>
            <p className="mt-2 max-w-2xl text-sm text-texte-doux">
              Une seule base de données unifiée partagée en temps réel entre porteurs, comités, mentors et direction.
            </p>
          </div>
          <Badge tone="info">Architecture Unifiée 6-en-1</Badge>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {MODULES.map((m, idx) => (
            <Link key={m.slug} href={m.href} className="group block transition-transform hover:-translate-y-1">
              <Card className="flex h-full flex-col justify-between transition-all duration-200 group-hover:border-beige group-hover:shadow-md">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="flex h-6 w-14 items-center justify-center rounded bg-beige/20 text-[11px] font-bold uppercase tracking-wider text-brun">
                      P{idx + 1}
                    </span>
                    <span className="text-xs font-semibold text-brun group-hover:text-beige transition-colors">
                      Accéder →
                    </span>
                  </div>
                  <h3 className="mt-3 text-lg font-bold text-brun group-hover:text-brun-fonce">
                    {m.titre}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-texte-doux">
                    {m.description}
                  </p>
                </div>
                <div className="mt-5 border-t border-bordure pt-3 text-[11px] font-semibold text-texte-doux">
                  Module interconnecté CIAT 360
                </div>
              </Card>
            </Link>
          ))}
        </div>
      </section>

      {/* 6. BANDEAU DE CANDIDATURE & MOBILISATION */}
      <section className="border-t border-[#3d2315] bg-brun text-white py-12 md:py-16">
        <div className="mx-auto max-w-6xl px-4">
          <div className="flex flex-col items-start justify-between gap-6 md:flex-row md:items-center">
            <div className="max-w-2xl space-y-2">
              <div className="inline-flex items-center gap-2 rounded-full border border-beige/40 bg-white/10 px-3 py-1 text-xs font-bold text-beige">
                Orientation &amp; Sélection 2026
              </div>
              <h2 className="text-2xl font-extrabold !text-white sm:text-3xl">
                Vous avez un projet innovant ou un besoin de prototypage ?
              </h2>
              <p className="text-sm leading-relaxed text-[#ebd9c0]">
                Que vous soyez apprenant de l&apos;ISEP, diplômé en insertion ou partenaire industriel,
                le CIAT vous ouvre ses ateliers et son réseau d&apos;experts techniques à Diamniadio.
              </p>
            </div>

            <div className="flex flex-wrap gap-3 shrink-0">
              <ButtonLink href="/connexion?next=/incubateur" variant="accent" className="font-bold text-sm">
                Déposer une Candidature
              </ButtonLink>
              <ButtonLink
                href="/portail/contact"
                variant="secondary"
                className="!text-white !border-white hover:!bg-white/10 text-sm"
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

