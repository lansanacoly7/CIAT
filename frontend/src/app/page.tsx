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
      "L'exigence professionnelle de l'ISEP garantit la robustesse technique, la viabilité et la pertinence industrielle de chaque solution conçue.",
    badge: "Standards Académiques",
    icon: (
      <svg className="h-5 w-5 text-brun" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
      "Inspiré des teintes chaudes et du terroir de Diamniadio, notre accompagnement est profondément humain, bienveillant et ancré au Sénégal.",
    badge: "Impact Territorial",
    icon: (
      <svg className="h-5 w-5 text-brun" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.8}
          d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 012 2v2.945M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      </svg>
    ),
  },
  {
    code: "03",
    titre: "Éclosion & Mentorat",
    soustitre: "De l'idée au prototype viable",
    texte:
      "Accueillir chaque porteur avec méthode, lui attribuer un mentor expert dédié et rythmer sa maturation jusqu'à l'obtention d'un prototype opérationnel.",
    badge: "Mentorat Expert",
    icon: (
      <svg className="h-5 w-5 text-brun" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
      "Une chaîne d'innovation démultipliée par l'intelligence artificielle générative et l'analyse décisionnelle, au service de la précision et du contrôle humain.",
    badge: "IA Éthique & RAG",
    icon: (
      <svg className="h-5 w-5 text-brun" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
       * 1. HERO SANS DÉFILEMENT FORCÉ : ÉLÉGANT, NET, PUNCHY ET LUMINEUX
       *    Mise en page split-screen : texte épuré à gauche, photo nette à droite.
       * =================================================================== */}
      <section className="border-b border-[#3d2315] bg-[#24140D] text-white py-8 md:py-10 lg:py-12">
        <div className="mx-auto max-w-6xl px-4">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-center">
            
            {/* Colonne Gauche (7 cols) : Titre, présentation et actions */}
            <div className="lg:col-span-7 space-y-4 md:space-y-5">
              {/* Badge officiel de souveraineté */}
              <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/5 px-3.5 py-1 text-xs font-semibold text-[#C99A68]">
                <span className="h-2 w-2 rounded-full bg-succes" />
                <span>ISEP Amadou Traoré · Diamniadio</span>
              </div>

              {/* Titre calibré pour tenir sans forcer de défilement */}
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-white leading-tight">
                Centre d&apos;Innovation, d&apos;Application et de Transfert
                <span className="block mt-1 text-[#C99A68] text-xl sm:text-2xl lg:text-3xl font-semibold">
                  Pôle d&apos;Incubation &amp; de Prototypage Technologique
                </span>
              </h1>

              {/* Paragraphe concis et lisible */}
              <p className="text-sm sm:text-base leading-relaxed text-[#EAE0D5] max-w-xl">
                De l&apos;idée brute au prototype industriel opérationnel. Une infrastructure unifiée réunissant ateliers d&apos;ingénierie, assistance IA souveraine et valorisation économique à Diamniadio.
              </p>

              {/* Boutons d'Action (Même esthétique que le bandeau validé) */}
              <div className="flex flex-wrap items-center gap-3 pt-1">
                <ButtonLink
                  href="/portail/incubateur"
                  variant="accent"
                  className="px-6 py-3 font-bold text-sm shadow-md"
                >
                  Découvrir l&apos;Incubateur →
                </ButtonLink>
                <ButtonLink
                  href="/portail/appels"
                  variant="secondary"
                  className="!border-white/30 !bg-transparent !text-white hover:!bg-white/10 px-5 py-3 text-sm"
                >
                  Appels à Projets 2026
                </ButtonLink>
                <Link
                  href="/galerie"
                  className="text-xs font-semibold text-[#C99A68] hover:text-[#EAE0D5] transition-colors py-2 px-1 flex items-center gap-1"
                >
                  <span>Galerie des Innovations</span>
                  <span>→</span>
                </Link>
              </div>

              {/* Bandeau compact des 4 chiffres clés en une seule ligne (zéro encombrement) */}
              <div className="pt-4 border-t border-white/15 grid grid-cols-4 gap-2 text-center sm:text-left">
                <div>
                  <span className="block text-2xl font-extrabold text-white">07</span>
                  <span className="text-[11px] text-[#C99A68] font-medium leading-tight block">Filières clés</span>
                </div>
                <div>
                  <span className="block text-2xl font-extrabold text-white">05</span>
                  <span className="text-[11px] text-[#C99A68] font-medium leading-tight block">Jalons rigoureux</span>
                </div>
                <div>
                  <span className="block text-2xl font-extrabold text-white">06</span>
                  <span className="text-[11px] text-[#C99A68] font-medium leading-tight block">Modules 360</span>
                </div>
                <div>
                  <span className="block text-2xl font-extrabold text-white">100%</span>
                  <span className="text-[11px] text-[#C99A68] font-medium leading-tight block">Prototypage réel</span>
                </div>
              </div>
            </div>

            {/* Colonne Droite (5 cols) : Photo du Campus NETTE, LUMINEUSE, SANS AUCUN BLUR MUDDY */}
            <div className="lg:col-span-5">
              <div className="relative h-[280px] sm:h-[340px] lg:h-[380px] w-full rounded-2xl overflow-hidden border border-white/20 shadow-xl">
                <Image
                  src="/images/campus-isep.png"
                  alt="Campus officiel de l'ISEP Amadou Traoré de Diamniadio — Siège du CIAT"
                  fill
                  priority
                  sizes="(min-width: 1024px) 42vw, 100vw"
                  className="object-cover object-center"
                />
                {/* Bandeau discret d'identification du campus en bas */}
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-3.5 flex items-center justify-between text-xs text-white">
                  <span className="font-semibold flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full bg-succes" />
                    Campus ISEP Diamniadio
                  </span>
                  <span className="text-[11px] text-[#C99A68] font-medium">Cité du Savoir</span>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* =====================================================================
       * 2. LES 4 PILIERS DE LA MARQUE (Charte Graphique Page 02)
       *    Aéré, fond blanc lumineux, typographie épurée.
       * =================================================================== */}
      <section className="border-b border-bordure bg-white py-14 md:py-18">
        <div className="mx-auto max-w-6xl px-4">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div className="max-w-2xl space-y-1.5">
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-beige">
                Identité de Marque &amp; Valeurs Fondatrices
              </p>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-brun tracking-tight">
                Les 4 Piliers Fondamentaux du CIAT
              </h2>
              <p className="text-sm text-texte-doux">
                Inscrits à la charte officielle, ces 4 piliers guident la rigueur de nos laboratoires et l&apos;excellence technique de chaque projet.
              </p>
            </div>
            <div className="shrink-0">
              <span className="inline-flex items-center gap-2 rounded-xl border border-bordure bg-[#FAF7F2] px-3.5 py-1.5 text-xs font-bold text-brun">
                <span className="h-2 w-2 rounded-full bg-beige" />
                Norme CIAT 360
              </span>
            </div>
          </div>

          <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {PILIERS.map((p) => (
              <div
                key={p.code}
                className="group relative flex flex-col justify-between rounded-2xl border border-[#EFE4D6] bg-[#FAF7F2] p-5.5 shadow-2xs transition-all duration-200 hover:-translate-y-1 hover:border-beige hover:bg-white hover:shadow-md"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brun font-[family-name:var(--font-title)] text-xs font-extrabold text-white">
                      {p.code}
                    </span>
                    <div className="rounded-lg bg-white p-2 border border-bordure/60">
                      {p.icon}
                    </div>
                  </div>

                  <span className="mt-4 inline-block text-[10px] font-bold uppercase tracking-wider text-beige">
                    {p.badge}
                  </span>
                  <h3 className="mt-1 text-base font-bold text-brun">
                    {p.titre}
                  </h3>
                  <p className="text-xs font-semibold text-texte-doux">
                    {p.soustitre}
                  </p>
                  <p className="mt-2.5 text-xs leading-relaxed text-texte-doux">
                    {p.texte}
                  </p>
                </div>

                <div className="mt-5 border-t border-bordure/60 pt-3 text-[11px] font-semibold text-brun flex items-center justify-between">
                  <span>Engagement ISEP</span>
                  <span className="text-beige group-hover:translate-x-1 transition-transform">→</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* =====================================================================
       * 3. LES 7 FILIÈRES TECHNOLOGIQUES PRIORITAIRES (Cahier des charges ISEP)
       *    Fond ivoire doux, cartes blanches nettes, aérées.
       * =================================================================== */}
      <section className="border-b border-bordure bg-[#FAF7F2] py-14 md:py-18">
        <div className="mx-auto max-w-6xl px-4">
          <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
            <div className="max-w-2xl space-y-1.5">
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-beige">
                Pôles Technologiques &amp; Sectoriels
              </p>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-brun tracking-tight">
                Les 7 Filières d&apos;Intervention Prioritaires
              </h2>
              <p className="text-sm text-texte-doux">
                Définis selon les besoins stratégiques nationaux, ces 7 pôles encadrent l&apos;accès aux ateliers et financements du CIAT.
              </p>
            </div>
            <ButtonLink
              href="/portail/domaines"
              variant="secondary"
              className="shrink-0 text-xs shadow-2xs"
            >
              Consulter le détail des 7 filières →
            </ButtonLink>
          </div>

          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {DOMAINES_CARDS.map((d) => (
              <Link
                key={d.id}
                href={`/portail/projets?domaine=${d.id}`}
                className="group relative flex flex-col justify-between rounded-2xl border border-[#EFE4D6] bg-white p-5 shadow-2xs transition-all duration-200 hover:-translate-y-1 hover:border-beige hover:shadow-md"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-beige/20 text-xs font-extrabold text-brun">
                      0{d.id}
                    </span>
                    <span className="rounded-lg bg-[#FAF7F2] p-1.5 text-brun-fonce opacity-70 group-hover:opacity-100 group-hover:text-beige transition-colors">
                      {d.icon}
                    </span>
                  </div>

                  <span className="mt-3 block text-[10px] font-bold uppercase tracking-wider text-beige">
                    {d.tags}
                  </span>
                  <h3 className="mt-1 text-sm font-bold text-brun group-hover:text-brun-fonce">
                    {d.nom}
                  </h3>
                  <p className="mt-2 text-xs leading-relaxed text-texte-doux">
                    {d.resume}
                  </p>
                </div>

                <div className="mt-5 flex items-center justify-between border-t border-bordure/60 pt-3 text-[11px] font-semibold text-brun">
                  <span>Explorer les projets</span>
                  <span className="text-beige group-hover:translate-x-1 transition-transform">→</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* =====================================================================
       * 4. LE PARCOURS D'INCUBATION EN 5 JALONS CONTRACTUELS (Page 09 Charte)
       * =================================================================== */}
      <section className="border-b border-bordure bg-white py-14 md:py-18">
        <div className="mx-auto max-w-6xl px-4">
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
            <div className="max-w-2xl space-y-1.5">
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-beige">
                Méthodologie Contractuelle &amp; Maturation
              </p>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-brun tracking-tight">
                Le Parcours d&apos;Incubation en 5 Jalons
              </h2>
              <p className="text-sm text-texte-doux">
                De la première esquisse jusqu&apos;au transfert industriel, chaque porteur franchit des étapes validées par le comité.
              </p>
            </div>
            <ButtonLink href="/portail/incubateur" variant="primary" className="shrink-0 text-xs shadow-2xs">
              Guide complet du parcours →
            </ButtonLink>
          </div>

          <div className="mt-10 grid gap-4 md:grid-cols-5">
            {ETAPES_ACCUEIL.map((e) => (
              <div
                key={e.stage}
                className="relative flex flex-col justify-between rounded-2xl border border-[#EFE4D6] bg-[#FAF7F2] p-5 transition-all duration-200 hover:border-beige hover:bg-white hover:shadow-xs"
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

                  <div className="mt-3.5">
                    <ProjectStatusBadge stage={e.stage} />
                  </div>

                  <h3 className="mt-3 text-sm font-bold text-brun">
                    {e.nom}
                  </h3>
                  <p className="mt-2 text-xs leading-relaxed text-texte-doux">
                    {e.desc}
                  </p>
                </div>

                <div className="mt-4 border-t border-bordure/60 pt-3 text-[11px] font-semibold text-brun">
                  <span className="text-beige">✔</span> Validation jury
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* =====================================================================
       * 5. LES 6 MODULES DE LA PLATEFORME UNIFIÉE (CIAT 360)
       * =================================================================== */}
      <section className="mx-auto max-w-6xl px-4 py-14 md:py-18">
        <div className="mb-10 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div className="max-w-2xl space-y-1.5">
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-beige">
              Écosystème Numérique Intégré
            </p>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-brun tracking-tight">
              Les 6 Modules Interconnectés du CIAT
            </h2>
            <p className="text-sm text-texte-doux">
              Une seule base de données unifiée partagée en temps réel entre porteurs, comités, mentors et direction.
            </p>
          </div>
          <Badge tone="info">Architecture Unifiée 6-en-1</Badge>
        </div>

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {MODULES.map((m, idx) => (
            <Link key={m.slug} href={m.href} className="group block transition-transform hover:-translate-y-1">
              <Card className="flex h-full flex-col justify-between transition-all duration-200 group-hover:border-beige group-hover:shadow-md">
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
                  <h3 className="mt-3.5 text-base font-bold text-brun group-hover:text-brun-fonce">
                    {m.titre}
                  </h3>
                  <p className="mt-2 text-xs leading-relaxed text-texte-doux">
                    {m.description}
                  </p>
                </div>
                <div className="mt-5 border-t border-bordure pt-3 text-[11px] font-semibold text-texte-doux flex items-center justify-between">
                  <span>Module CIAT 360</span>
                  <span className="text-[10px] uppercase font-bold text-beige">Opérationnel</span>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      </section>

      {/* =====================================================================
       * 6. BANDEAU D'APPEL À L'ACTION & CANDIDATURE
       *    Exactement le design validé et apprécié par l'utilisateur.
       * =================================================================== */}
      <section className="border-t border-[#3d2315] bg-[#24140D] text-white py-14 md:py-16">
        <div className="mx-auto max-w-6xl px-4">
          <div className="flex flex-col items-start justify-between gap-6 md:flex-row md:items-center">
            <div className="max-w-2xl space-y-2">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/5 px-3 py-1 text-xs font-semibold text-[#C99A68]">
                Orientation &amp; Sélection Continue 2026
              </div>
              <h2 className="text-2xl sm:text-4xl font-extrabold !text-white tracking-tight">
                Vous avez un projet innovant ou un besoin de prototypage ?
              </h2>
              <p className="text-sm leading-relaxed text-[#EAE0D5]">
                Que vous soyez apprenant de l&apos;ISEP, diplômé en insertion ou entreprise partenaire, le CIAT met à votre disposition ses ateliers, ses bancs de test et son réseau de mentors à Diamniadio.
              </p>
            </div>

            <div className="flex flex-wrap gap-3.5 shrink-0">
              <ButtonLink
                href="/connexion?next=/incubateur"
                variant="accent"
                className="font-bold text-sm px-6 py-3"
              >
                Déposer une Candidature
              </ButtonLink>
              <ButtonLink
                href="/portail/contact"
                variant="secondary"
                className="!text-white !border-white/30 !bg-transparent hover:!bg-white/10 text-sm px-5 py-3"
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
