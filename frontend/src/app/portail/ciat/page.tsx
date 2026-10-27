import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  GraduationCap,
  Lightbulb,
  Share2,
  Users,
  FileText,
  ShieldCheck,
  CheckCircle2,
  Download,
  BookOpen,
} from "lucide-react";

export const metadata = {
  title: "Le CIAT — Centre d'Innovation, d'Application et de Transfert",
  description:
    "Un catalyseur d'innovation au service de l'entrepreneuriat et de l'impact à l'ISEP Amadou Trawaré de Diamniadio : missions, approche, opportunités et documents demandés.",
};

// 4 piliers de la mission avec la charte officielle CIAT (#612D10 & #C99A68)
const MISSIONS_LIST = [
  {
    icon: Lightbulb,
    titre: "Innovation",
    desc: "Encourager la créativité et le développement de solutions technologiques nouvelles adaptées aux réalités sénégalaises.",
  },
  {
    icon: GraduationCap,
    titre: "Formation",
    desc: "Renforcer les compétences techniques et managériales pour préparer les talents et entrepreneurs de demain.",
  },
  {
    icon: Share2,
    titre: "Transfert de technologie",
    desc: "Valoriser les résultats de la recherche appliquée et faciliter leur appropriation par les acteurs économiques.",
  },
  {
    icon: Users,
    titre: "Impact",
    desc: "Contribuer au développement durable, à la création d'emplois et à la compétitivité du territoire de Diamniadio.",
  },
];

// 4 étapes du parcours de l'approche CIAT
const APPROCHE_ETAPES = [
  { num: "01", titre: "Accompagnement", desc: "Diagnostic initial, cadrage du besoin et feuille de route personnalisée." },
  { num: "02", titre: "Incubation", desc: "Parcours en 5 jalons, ateliers de prototypage et mentorat par les pairs." },
  { num: "03", titre: "Projets & partenariats", desc: "Connexion aux industriels, bailleurs de fonds et réseaux d'affaires." },
  { num: "04", titre: "Transfert de technologies", desc: "Validation sur bancs d'essai, publication en galerie et passage à l'échelle." },
];

// 4 opportunités clés du campus
const OPPORTUNITES_POINTS = [
  {
    titre: "Un accompagnement personnalisé",
    desc: "Un mentor attitré et un réseau d'enseignants-chercheurs pour vous guider à chaque étape clé.",
  },
  {
    titre: "Des infrastructures modernes",
    desc: "Laboratoires d'électronique, bancs solaires et ateliers de fabrication numérique à Diamniadio.",
  },
  {
    titre: "Un écosystème de partenaires",
    desc: "Synergies directes avec les ministères, le Parc des Technologies Numériques (PTN) et la DER/FJ.",
  },
  {
    titre: "Un réseau d'experts du secteur",
    desc: "Accès privilégié aux spécialistes des 7 filières prioritaires de l'ISEP Amadou Trawaré.",
  },
];

// Les 3 pièces justificatives demandées pour candidater (contrat officiel du CIAT)
const PIECES_JUSTIFICATIVES_DEMANDEES = [
  {
    num: "1",
    titre: "Fiche descriptive de projet",
    obligatoire: true,
    detail: "Exposé clair du problème identifié sur le terrain, de la solution technologique proposée et du niveau de maturité actuel (idée, maquette ou premier prototype).",
  },
  {
    num: "2",
    titre: "Présentation détaillée de l'équipe",
    obligatoire: true,
    detail: "Curriculum vitae, compétences techniques et complémentaires des membres, répartition des rôles et engagement effectif dans le calendrier de la cohorte.",
  },
  {
    num: "3",
    titre: "Budget prévisionnel & besoins de prototypage",
    obligatoire: true,
    detail: "Estimation réaliste des dépenses, chiffrage des matières premières, composants électroniques et bancs d'essai techniques sollicités auprès du CIAT.",
  },
];

// Documents officiels téléchargeables disponibles au portail
const DOCUMENTS_OFFICIELS = [
  {
    titre: "Dossier de Candidature Officiel — Cohorte 2026",
    categorie: "Candidatures & Formulaires",
    format: "PDF & DOCX",
    badge: "Indispensable pour postuler",
    desc: "Le canevas officiel complet à remplir par le porteur de projet avant soumission au comité de sélection.",
    href: "/portail/documents",
  },
  {
    titre: "Charte de Propriété Intellectuelle & Transfert Technologique",
    categorie: "Règlements & Chartes",
    format: "PDF Officiel",
    badge: "Protection des inventeurs",
    desc: "Définit les règles de copropriété, de brevetabilité et de protection des innovations développées au CIAT.",
    href: "/portail/documents",
  },
  {
    titre: "Règlement Intérieur de l'Incubateur & Sécurité des Ateliers",
    categorie: "Règlements & Chartes",
    format: "PDF Officiel",
    badge: "Sécurité & vie commune",
    desc: "Normes d'accès aux bancs d'essai, consignes d'hygiène et charte d'utilisation des équipements de prototypage.",
    href: "/portail/documents",
  },
];

export default function CiatPresentationPage() {
  return (
    <div className="bg-[#FAF7F2] text-[#24140D] min-h-screen">
      {/* =====================================================================
       * SECTION 1 — HERO OFFICIEL DU CIAT
       * Palette : Brun Nuit #24140D, Brun CIAT #612D10, Ocre Doré #C99A68, Sable Doux #FAF7F2
       * Image : Façade réelle de l'ISEP Diamniadio (campus-isep.png)
       * ===================================================================== */}
      <section className="relative overflow-hidden border-b border-[#EFE4D6] pt-12 pb-16 md:pt-16 md:pb-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid items-center gap-10 lg:grid-cols-12 lg:gap-12">
            {/* Colonne Gauche : Titre éditorial, description & bouton */}
            <div className="lg:col-span-7 space-y-6">
              <div className="flex items-center gap-3">
                <span className="text-xs font-bold uppercase tracking-[0.25em] text-[#612D10]">
                  LE CIAT
                </span>
                <span className="h-[2px] w-12 bg-[#C99A68]" />
              </div>

              <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-[48px] font-extrabold text-[#24140D] tracking-tight leading-[1.12]">
                Un catalyseur d’
                <span className="text-[#612D10]">innovation</span> au service de l’
                <span className="text-[#612D10]">entrepreneuriat</span> et de l’
                <span className="text-[#612D10]">impact</span>.
              </h1>

              <p className="text-sm sm:text-base leading-relaxed text-[#6B5646] max-w-xl font-normal">
                Le Centre d’Innovation, d’Application et de Transfert (CIAT) de l’ISEP Amadou Trawaré de
                Diamniadio est un espace dédié à l’entrepreneuriat, à l’innovation et au transfert de
                technologies. Il accompagne les projets, soutient l’incubation de startups et favorise la
                mise en œuvre de solutions concrètes pour répondre aux défis du territoire et de l’Afrique.
              </p>

              <div className="flex flex-wrap items-center gap-4 pt-2">
                <a
                  href="#documents-demandes"
                  className="inline-flex items-center justify-center rounded-full bg-[#612D10] px-6 py-3 text-xs sm:text-sm font-semibold text-white shadow-md transition-all hover:bg-[#24140D] active:scale-95"
                >
                  <FileText size={16} className="mr-2 text-[#C99A68]" />
                  Voir les documents demandés
                </a>

                <a
                  href="#mission"
                  className="inline-flex items-center gap-2 text-xs sm:text-sm font-bold text-[#612D10] transition-all hover:text-[#C99A68] group py-3"
                >
                  <span>Découvrir le CIAT</span>
                  <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
                </a>
              </div>
            </div>

            {/* Colonne Droite : Devise supérieure & Arche architecturale avec campus-isep.png */}
            <div className="lg:col-span-5 flex flex-col items-end">
              <div className="mb-4 text-right">
                <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-[0.22em] text-[#6B5646]">
                  INNOVER · FORMER · ENTREPRENDRE · TRANSFÉRER
                </span>
              </div>

              {/* Cadre en arche caractéristique fidèle à la maquette */}
              <div className="relative w-full max-w-md aspect-[4/5] sm:aspect-[3/4]">
                {/* Forme courbe d'accent Brun CIAT (#612D10) au bas gauche */}
                <div className="absolute -bottom-3 -left-3 h-24 w-24 rounded-full bg-[#612D10] z-0 hidden sm:block shadow-sm" />

                <div className="relative z-10 h-full w-full overflow-hidden rounded-t-[140px] sm:rounded-t-[180px] rounded-br-3xl rounded-bl-[60px] border border-[#EFE4D6] shadow-xl bg-[#FAF7F2]">
                  <Image
                    src="/images/campus-isep.png"
                    alt="Bâtiments et campus moderne de l'ISEP Amadou Trawaré à Diamniadio"
                    fill
                    priority
                    unoptimized
                    className="object-cover object-center"
                    sizes="(max-width: 1024px) 100vw, 40vw"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#24140D]/40 via-transparent to-transparent pointer-events-none" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =====================================================================
       * SECTION 2 — NOTRE MISSION : ACCOMPAGNER LES TALENTS
       * Image dédiée : auth-incubateur.jpg (Innovateurs et mentor en atelier IoT)
       * ===================================================================== */}
      <section id="mission" className="py-16 md:py-24 border-b border-[#EFE4D6]">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-12 lg:grid-cols-12 lg:items-center">
            {/* Colonne Gauche : Descriptif de mission */}
            <div className="lg:col-span-4 space-y-5">
              <div className="flex items-center gap-3">
                <span className="text-xs font-bold uppercase tracking-[0.25em] text-[#612D10]">
                  NOTRE MISSION
                </span>
                <span className="h-[2px] w-10 bg-[#C99A68]" />
              </div>

              <h2 className="text-2xl sm:text-3xl lg:text-[34px] font-extrabold text-[#24140D] tracking-tight leading-tight">
                Accompagner les talents d’aujourd’hui pour bâtir{" "}
                <span className="text-[#612D10]">l’Afrique de demain</span>.
              </h2>

              <p className="text-sm leading-relaxed text-[#6B5646]">
                Le CIAT a pour mission de promouvoir l’innovation, le développement, l’application et le
                transfert de technologies. Il accompagne des projets à fort potentiel, en lien avec les
                besoins du territoire et du continent, en mobilisant la formation, l’expertise et les
                partenariats.
              </p>

              <div>
                <a
                  href="#approche"
                  className="inline-flex items-center gap-2 text-sm font-bold text-[#612D10] transition-all hover:text-[#C99A68] group"
                >
                  <span>En savoir plus</span>
                  <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
                </a>
              </div>
            </div>

            {/* Colonne Centre : Photo dédiée (auth-incubateur.jpg) */}
            <div className="lg:col-span-4 flex justify-center">
              <div className="relative w-full max-w-sm aspect-[4/5] rounded-3xl overflow-hidden border border-[#EFE4D6] shadow-lg bg-[#FAF7F2]">
                <Image
                  src="/images/ciat/ciat-gouvernance-direction.jpg"
                  alt="Direction collégiale et session de travail au CIAT"
                  fill
                  unoptimized
                  className="object-cover object-center"
                  sizes="(max-width: 1024px) 100vw, 33vw"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#24140D]/30 via-transparent to-transparent pointer-events-none" />
              </div>
            </div>

            {/* Colonne Droite : 4 Piliers avec icônes circulaires (#EFE4D6 & #612D10) */}
            <div className="lg:col-span-4 space-y-6">
              {MISSIONS_LIST.map((m, idx) => {
                const Icon = m.icon;
                return (
                  <div key={idx} className="flex items-start gap-4 group">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#EFE4D6] border border-[#C99A68]/30 text-[#612D10] transition-all duration-200 group-hover:bg-[#612D10] group-hover:text-white shadow-xs">
                      <Icon size={20} />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-[#24140D] tracking-tight">
                        {m.titre}
                      </h3>
                      <p className="mt-1 text-xs sm:text-[13px] leading-relaxed text-[#6B5646]">
                        {m.desc}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* =====================================================================
       * SECTION 3 — NOTRE APPROCHE : INNOVER, FORMER, ENTREPRENDRE
       * Palette : Brun Nuit #24140D, Ocre Doré #C99A68
       * Image dédiée : ciat-depot-innovation.jpg (Ateliers Maker Space & 3D)
       * ===================================================================== */}
      <section id="approche" className="bg-[#24140D] text-white py-16 md:py-24 overflow-hidden">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-10 lg:grid-cols-12 lg:items-center">
            {/* Colonne Gauche : Photo atelier & citation inspirante */}
            <div className="lg:col-span-4">
              <div className="relative aspect-[4/3] sm:aspect-[16/11] rounded-2xl overflow-hidden border border-white/10 shadow-2xl">
                <Image
                  src="/images/ciat/ciat-ateliers-prototypage.jpg"
                  alt="Laboratoire de prototypage, makerspace et bancs d'essai du CIAT"
                  fill
                  unoptimized
                  className="object-cover object-center brightness-90"
                  sizes="(max-width: 1024px) 100vw, 33vw"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/40 to-transparent" />
                <div className="absolute inset-0 flex items-end p-6">
                  <blockquote className="text-sm sm:text-base font-medium italic text-white/95 leading-relaxed drop-shadow">
                    “Des idées d’aujourd’hui dessinent l’Afrique de demain.”
                  </blockquote>
                </div>
              </div>
            </div>

            {/* Colonne Centre : Descriptif d'approche & bouton */}
            <div className="lg:col-span-5 space-y-4">
              <div className="flex items-center gap-3">
                <span className="text-xs font-bold uppercase tracking-[0.25em] text-[#C99A68]">
                  NOTRE APPROCHE
                </span>
                <span className="h-[2px] w-10 bg-[#C99A68]" />
              </div>

              <h2 className="text-2xl sm:text-3xl lg:text-[34px] font-extrabold text-white tracking-tight leading-tight">
                Innover, former,
                <br />
                entreprendre, transférer.
              </h2>

              <p className="text-xs sm:text-sm leading-relaxed text-[#FAF7F2]/80 max-w-md">
                Le CIAT met en synergie les acteurs de l’innovation pour créer un environnement propice à
                l’éclosion des talents et à la transformation des idées en solutions durables.
              </p>

              <div className="pt-2">
                <a
                  href="#opportunites"
                  className="inline-flex items-center justify-center rounded-full border border-[#C99A68]/60 bg-white/5 px-6 py-2.5 text-xs font-semibold text-white transition-all hover:bg-white/15 hover:border-[#C99A68] active:scale-95"
                >
                  Découvrir notre approche
                  <ArrowRight size={14} className="ml-2 text-[#C99A68]" />
                </a>
              </div>
            </div>

            {/* Colonne Droite : 4 Étapes numérotées */}
            <div className="lg:col-span-3 space-y-4">
              {APPROCHE_ETAPES.map((etape, idx) => (
                <div
                  key={idx}
                  className="border-b border-white/15 pb-3.5 group cursor-default transition-colors hover:border-[#C99A68]"
                >
                  <div className="text-[11px] font-bold text-[#C99A68] tracking-wider">
                    {etape.num}
                  </div>
                  <div className="text-sm font-bold text-white group-hover:text-[#C99A68] transition-colors">
                    {etape.titre}
                  </div>
                  <div className="text-[11px] text-[#FAF7F2]/65 mt-0.5">
                    {etape.desc}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* =====================================================================
       * SECTION 4 — UN LIEU, DES OPPORTUNITÉS
       * Image dédiée : Vue panoramique du campus et emblème CIAT
       * ===================================================================== */}
      <section id="opportunites" className="py-16 md:py-24 border-b border-[#EFE4D6]">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-12 lg:grid-cols-12 lg:items-center">
            {/* Colonne Gauche : Titre & appel */}
            <div className="lg:col-span-4 space-y-5">
              <div className="flex items-center gap-3">
                <span className="text-xs font-bold uppercase tracking-[0.25em] text-[#612D10]">
                  UN LIEU, DES OPPORTUNITÉS
                </span>
                <span className="h-[2px] w-10 bg-[#C99A68]" />
              </div>

              <h2 className="text-2xl sm:text-3xl lg:text-[34px] font-extrabold text-[#24140D] tracking-tight leading-tight">
                Le CIAT,
                <br />
                plus qu’un incubateur,
                <br />
                un catalyseur de talents.
              </h2>

              <p className="text-sm leading-relaxed text-[#6B5646]">
                En rejoignant le CIAT, vous bénéficiez d’un accompagnement sur mesure, d’un accès à un
                réseau de partenaires et d’infrastructures adaptées pour concrétiser vos idées et
                accélérer votre impact.
              </p>

              <div>
                <Link
                  href="/connexion?next=/incubateur"
                  className="inline-flex items-center gap-2 text-sm font-bold text-[#612D10] transition-all hover:text-[#C99A68] group"
                >
                  <span>Rejoindre le CIAT</span>
                  <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
                </Link>
              </div>
            </div>

            {/* Colonne Centre : Arche architecturale avec ciat-header-panoramique.jpg */}
            <div className="lg:col-span-4 flex justify-center">
              <div className="relative w-full max-w-sm aspect-[4/5] rounded-t-[140px] sm:rounded-t-[180px] rounded-b-2xl overflow-hidden border border-[#EFE4D6] shadow-xl bg-[#FAF7F2]">
                <Image
                  src="/images/ciat/ciat-ecosysteme-diamniadio.jpg"
                  alt="Écosystème technologique et campus de Diamniadio"
                  fill
                  unoptimized
                  className="object-cover object-center"
                  sizes="(max-width: 1024px) 100vw, 33vw"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#24140D]/80 via-[#24140D]/20 to-transparent" />
                <div className="absolute bottom-5 inset-x-0 text-center px-4">
                  <div className="relative h-12 w-12 mx-auto mb-1">
                    <Image
                      src="/images/brand/symbole_blanc.png"
                      alt="Symbole CIAT"
                      fill
                      unoptimized
                      className="object-contain"
                    />
                  </div>
                  <span className="text-xs font-bold uppercase tracking-[0.2em] text-[#C99A68] block">
                    Cité du Savoir · Diamniadio
                  </span>
                </div>
              </div>
            </div>

            {/* Colonne Droite : 4 Engagements avec bordures fines */}
            <div className="lg:col-span-4 space-y-5">
              {OPPORTUNITES_POINTS.map((item, idx) => (
                <div
                  key={idx}
                  className="border-b border-[#EFE4D6] pb-4 group cursor-default transition-all hover:translate-x-1"
                >
                  <h3 className="text-sm sm:text-base font-bold text-[#24140D] group-hover:text-[#612D10] transition-colors">
                    {item.titre}
                  </h3>
                  <p className="mt-1 text-xs leading-relaxed text-[#6B5646]">
                    {item.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* =====================================================================
       * SECTION 5 — LES DOCUMENTS DEMANDÉS & CADRE OFFICIEL DE CANDIDATURE
       * Répond explicitement à l'exigence du jury et des candidats au CIAT
       * ===================================================================== */}
      <section id="documents-demandes" className="py-16 md:py-24 bg-white border-b border-[#EFE4D6]">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mb-12">
            <div className="flex items-center gap-3 mb-2">
              <span className="text-xs font-bold uppercase tracking-[0.25em] text-[#612D10]">
                DOCUMENTS &amp; PIÈCES JUSTIFICATIVES
              </span>
              <span className="h-[2px] w-12 bg-[#C99A68]" />
            </div>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-[#24140D] tracking-tight">
              Les documents demandés pour intégrer le CIAT
            </h2>
            <p className="mt-3 text-sm sm:text-base leading-relaxed text-[#6B5646]">
              Pour garantir la rigueur de l’évaluation par le comité officiel, chaque candidature doit
              comporter les trois pièces obligatoires définies par la convention de l’ISEP Amadou Trawaré.
            </p>
          </div>

          <div className="grid gap-8 lg:grid-cols-12 lg:items-start">
            {/* Colonne Gauche : Les 3 pièces justificatives obligatoires */}
            <div className="lg:col-span-6 space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-[#EFE4D6]">
                <h3 className="text-base font-bold text-[#612D10] flex items-center gap-2">
                  <ShieldCheck size={18} className="text-[#C99A68]" />
                  Les 3 Pièces Obligatoires au Dossier
                </h3>
                <span className="text-[11px] font-bold uppercase px-2.5 py-0.5 rounded-full bg-[#EFE4D6] text-[#612D10]">
                  Contrôle de complétude
                </span>
              </div>

              {PIECES_JUSTIFICATIVES_DEMANDEES.map((piece) => (
                <div
                  key={piece.num}
                  className="rounded-2xl border border-[#EFE4D6] bg-[#FAF7F2] p-5 transition-all hover:border-[#C99A68] hover:shadow-sm"
                >
                  <div className="flex items-start gap-3.5">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#612D10] text-xs font-bold text-white">
                      0{piece.num}
                    </span>
                    <div className="flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <h4 className="text-sm font-bold text-[#24140D]">
                          {piece.titre}
                        </h4>
                        <span className="text-[10px] font-bold uppercase text-[#2E7D32] bg-[#2E7D32]/10 px-2 py-0.5 rounded-md">
                          Requis
                        </span>
                      </div>
                      <p className="mt-1.5 text-xs leading-relaxed text-[#6B5646]">
                        {piece.detail}
                      </p>
                    </div>
                  </div>
                </div>
              ))}

              <div className="p-4 rounded-xl bg-[#FAF7F2] border border-[#EFE4D6] text-xs text-[#6B5646] flex items-center gap-3">
                <CheckCircle2 size={18} className="text-[#2E7D32] shrink-0" />
                <span>
                  Un dossier incomplet ne peut être transmis au comité d’évaluation. Sauvegardes intermédiaires automatiques disponibles.
                </span>
              </div>
            </div>

            {/* Colonne Droite : Documents officiels téléchargeables & bibliothèque */}
            <div className="lg:col-span-6 space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-[#EFE4D6]">
                <h3 className="text-base font-bold text-[#612D10] flex items-center gap-2">
                  <BookOpen size={18} className="text-[#C99A68]" />
                  Canevas &amp; Textes Réglementaires
                </h3>
                <Link
                  href="/portail/documents"
                  className="text-xs font-semibold text-[#612D10] hover:text-[#C99A68] flex items-center gap-1"
                >
                  Voir tous les documents <ArrowRight size={12} />
                </Link>
              </div>

              {DOCUMENTS_OFFICIELS.map((doc, idx) => (
                <div
                  key={idx}
                  className="rounded-2xl border border-[#EFE4D6] bg-white p-5 shadow-xs transition-all hover:border-[#612D10] flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-[#C99A68]">
                        {doc.categorie}
                      </span>
                      <span className="text-[10px] font-semibold text-[#612D10] bg-[#EFE4D6] px-2 py-0.5 rounded">
                        {doc.format}
                      </span>
                    </div>

                    <h4 className="mt-1.5 text-sm font-bold text-[#24140D]">
                      {doc.titre}
                    </h4>
                    <p className="mt-1 text-xs leading-relaxed text-[#6B5646]">
                      {doc.desc}
                    </p>
                  </div>

                  <div className="mt-4 pt-3 border-t border-[#FAF7F2] flex items-center justify-between">
                    <span className="text-[11px] text-[#2E7D32] font-semibold flex items-center gap-1">
                      ✓ {doc.badge}
                    </span>
                    <Link
                      href={doc.href}
                      className="inline-flex items-center gap-1 text-xs font-bold text-[#612D10] hover:text-[#C99A68]"
                    >
                      <Download size={13} />
                      Télécharger
                    </Link>
                  </div>
                </div>
              ))}

              <div className="pt-2">
                <Link
                  href="/connexion?next=/incubateur"
                  className="w-full inline-flex items-center justify-center rounded-xl bg-[#612D10] px-6 py-3.5 text-sm font-bold text-white shadow-md transition-all hover:bg-[#24140D] active:scale-95"
                >
                  Déposer mon dossier de candidature en ligne
                  <ArrowRight size={16} className="ml-2 text-[#C99A68]" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =====================================================================
       * BANDEAU D'APPEL À L'ACTION FINAL
       * ===================================================================== */}
      <section className="bg-gradient-to-r from-[#24140D] via-[#3D1D10] to-[#24140D] text-white py-14 border-t border-[#3D1D10]">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="space-y-1.5 text-center sm:text-left">
            <h2 className="text-2xl sm:text-3xl font-extrabold !text-white tracking-tight">
              Prêt à accélérer votre projet au CIAT ?
            </h2>
            <p className="text-xs sm:text-sm text-[#FAF7F2]/80 max-w-xl">
              Consultez le parcours de l’incubateur ou préparez vos 3 pièces obligatoires dès aujourd’hui.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <Link
              href="/portail/incubateur"
              className="inline-flex items-center justify-center rounded-full border border-white/50 bg-white/10 px-6 py-3 text-xs font-semibold text-white transition-all hover:bg-white/20 active:scale-95"
            >
              Voir le parcours incubateur
            </Link>
            <Link
              href="/connexion?next=/incubateur"
              className="inline-flex items-center justify-center rounded-full bg-[#612D10] px-6 py-3 text-xs font-semibold text-white shadow-lg transition-all hover:bg-[#C99A68] hover:text-[#24140D] active:scale-95 border border-[#C99A68]/40"
            >
              Candidater maintenant
              <ArrowRight size={14} className="ml-2" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
