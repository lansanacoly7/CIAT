import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  GraduationCap,
  Lightbulb,
  Share2,
  Users,
  ShieldCheck,
  CheckCircle2,
  Download,
  BookOpen,
} from "lucide-react";

export const metadata = {
  title: "Le CIAT — Centre d'Innovation et d'Accélération Technologique",
  description:
    "Un catalyseur d'innovation au service de l'entrepreneuriat et de l'impact à l'ISEP Amadou Trawaré de Diamniadio : missions, approche, infrastructures et documents officiels.",
};

// 4 piliers de la mission avec la charte officielle CIAT
const MISSIONS_LIST = [
  {
    icon: Lightbulb,
    num: "01",
    titre: "Innovation & Prototypage",
    desc: "Encourager la créativité et le prototypage rapide de solutions technologiques concrètes adaptées aux défis du Sénégal.",
  },
  {
    icon: GraduationCap,
    num: "02",
    titre: "Formation & Mentorat",
    desc: "Développer les compétences pratiques des apprenants et entrepreneurs grâce à l'expertise des enseignants-chercheurs.",
  },
  {
    icon: Share2,
    num: "03",
    titre: "Transfert Technologique",
    desc: "Valoriser les brevets et résultats de recherche appliquée pour faciliter leur industrialisation par les PME et startups.",
  },
  {
    icon: Users,
    num: "04",
    titre: "Impact & Création de Valeur",
    desc: "Participer activement à la souveraineté économique, à l'emploi des jeunes et au rayonnement du Pôle Urbain de Diamniadio.",
  },
];

// 4 étapes du parcours de l'approche CIAT
const APPROCHE_ETAPES = [
  {
    num: "01",
    titre: "Cadrage & Diagnostic",
    desc: "Identification précise du besoin terrain, analyse de faisabilité technique et feuille de route d'incubation.",
  },
  {
    num: "02",
    titre: "Prototypage en Ateliers",
    desc: "Accès libre aux machines de haute précision (CNC, 3D, bancs électroniques) et mentorat par les pairs.",
  },
  {
    num: "03",
    titre: "Validation Terrain & TRL",
    desc: "Bancs d'essai en conditions réelles (solaire, agro, santé) pour certifier la viabilité et les normes.",
  },
  {
    num: "04",
    titre: "Homologation & Transfert",
    desc: "Protection de la propriété intellectuelle, mise en relation avec investisseurs et déploiement industriel.",
  },
];

// 3 infrastructures techniques réelles du campus
const INFRASTRUCTURES = [
  {
    titre: "FabLab & Ateliers Makerspace",
    desc: "Centres d'usinage numérique, découpe laser, électronique embarquée et impression 3D de précision.",
    image: "/images/galerie_moments/fablab-prototypage.jpg",
    badge: "Matériel 4.0",
  },
  {
    titre: "Bancs d'Essai & Énergies Renouvelables",
    desc: "Plateformes de test photovoltaïque, régulateurs d'irrigation intelligente et mini-réseaux microgrid.",
    image: "/images/galerie_moments/solaire-campus.jpg",
    badge: "Laboratoires R&D",
  },
  {
    titre: "Espaces Coworking & Salles Projets",
    desc: "Zones modulaires haut débit, salles de brainstorming et espaces d'accueil des délégations industrielles.",
    image: "/images/galerie_moments/nos-espaces.jpg",
    badge: "Campus Connecté",
  },
];

// Les 3 pièces justificatives demandées pour candidater
const PIECES_JUSTIFICATIVES_DEMANDEES = [
  {
    num: "1",
    titre: "Fiche descriptive du projet",
    detail: "Exposé clair du problème identifié, de la solution technologique proposée et du niveau de maturité actuel (idée, maquette ou premier prototype fonctionnel).",
  },
  {
    num: "2",
    titre: "Présentation détaillée de l'équipe",
    detail: "Curriculum vitae, compétences techniques, complémentarité des membres et engagement effectif dans le calendrier de la cohorte.",
  },
  {
    num: "3",
    titre: "Budget prévisionnel & besoins de prototypage",
    detail: "Chiffrage réaliste des matières premières, composants électroniques et bancs d'essai sollicités auprès du CIAT.",
  },
];

// Documents officiels téléchargeables
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
    categorie: "Règlements & Droits",
    format: "PDF Officiel",
    badge: "Protection des inventeurs",
    desc: "Définit les règles de copropriété, de brevetabilité et de protection des innovations développées au CIAT.",
    href: "/portail/documents",
  },
  {
    titre: "Règlement Intérieur de l'Incubateur & Sécurité des Ateliers",
    categorie: "Normes & Ateliers",
    format: "PDF Officiel",
    badge: "Sécurité & vie commune",
    desc: "Normes d'accès aux bancs d'essai, consignes d'hygiène et charte d'utilisation des équipements de prototypage.",
    href: "/portail/documents",
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
       * SECTION 2 — LES 4 PILIERS DE NOTRE MISSION
       * ===================================================================== */}
      <section id="missions" className="py-16 md:py-24 border-b border-[#EBE4DC] bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mb-12">
            <span className="text-xs font-bold uppercase tracking-[0.25em] text-[#612D10]">
              NOS MISSIONS FONDAMENTALES
            </span>
            <h2 className="mt-2 text-2xl sm:text-3xl lg:text-4xl font-extrabold text-[#24140D] tracking-tight">
              Quatre axes pour accélérer le progrès technologique
            </h2>
            <p className="mt-3 text-sm sm:text-base leading-relaxed text-[#6B5646]">
              Le CIAT combine rigueur académique, bancs d’essai de niveau industriel et mentorat entrepreneurial
              pour offrir un tremplin complet aux innovateurs sénégalais.
            </p>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {MISSIONS_LIST.map((m) => {
              const Icon = m.icon;
              return (
                <div
                  key={m.num}
                  className="rounded-2xl border border-[#EBE4DC] bg-[#FAF7F2] p-6 shadow-xs hover:border-[#612D10] hover:shadow-md transition-all group flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white border border-[#EBE4DC] text-[#612D10] group-hover:bg-[#612D10] group-hover:text-white transition-colors shadow-2xs">
                        <Icon size={22} />
                      </div>
                      <span className="font-mono text-xs font-bold text-[#AFA496]">
                        {m.num}
                      </span>
                    </div>

                    <h3 className="text-lg font-bold text-[#24140D] tracking-tight group-hover:text-[#612D10] transition-colors">
                      {m.titre}
                    </h3>
                    <p className="mt-2 text-xs sm:text-sm leading-relaxed text-[#6B5646]">
                      {m.desc}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* =====================================================================
       * SECTION 3 — NOTRE APPROCHE : DE L'IDÉE AU TRANSFERT
       * ===================================================================== */}
      <section className="bg-[#24140D] text-white py-16 md:py-24 overflow-hidden border-b border-[#3D1D10]">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-12 lg:grid-cols-12 lg:items-center">
            {/* Colonne Gauche : Descriptif et timeline en 4 étapes */}
            <div className="lg:col-span-6 space-y-6">
              <div>
                <span className="text-xs font-bold uppercase tracking-[0.25em] text-[#C99A68]">
                  MÉTHODOLOGIE D&apos;ACCOMPAGNEMENT
                </span>
                <h2 className="mt-2 text-2xl sm:text-3xl lg:text-4xl font-extrabold text-white tracking-tight">
                  Un parcours éprouvé en 4 étapes clés
                </h2>
                <p className="mt-3 text-sm text-[#FAF7F2]/80 leading-relaxed max-w-xl">
                  Du premier atelier de créativité jusqu&apos;à la signature des accords de licence industrielle,
                  chaque projet bénéficie d&apos;un protocole d&apos;évaluation rigoureux.
                </p>
              </div>

              <div className="space-y-4 pt-2">
                {APPROCHE_ETAPES.map((etape) => (
                  <div
                    key={etape.num}
                    className="flex items-start gap-4 p-4 rounded-xl bg-white/[0.04] border border-white/10 hover:border-[#C99A68] transition-colors"
                  >
                    <span className="font-mono text-sm font-extrabold text-[#C99A68] shrink-0 pt-0.5">
                      {etape.num}
                    </span>
                    <div>
                      <h3 className="text-sm font-bold text-white tracking-wide">
                        {etape.titre}
                      </h3>
                      <p className="text-xs text-[#FAF7F2]/70 mt-1 leading-relaxed">
                        {etape.desc}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Colonne Droite : Véritable photo d'atelier et citation */}
            <div className="lg:col-span-6 flex flex-col items-center">
              <div className="relative w-full aspect-[4/3] rounded-3xl overflow-hidden shadow-2xl border border-white/15">
                <Image
                  src="/images/collaboration-innovante-ciat.png"
                  alt="Équipe d'innovateurs au travail au CIAT"
                  fill
                  sizes="(max-width: 1024px) 100vw, 50vw"
                  className="object-cover object-center"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent" />
                <div className="absolute bottom-6 inset-x-6 text-white">
                  <blockquote className="text-sm sm:text-base font-serif italic text-white/95 leading-relaxed">
                    “L&apos;innovation n&apos;est pas une promesse abstraite : c&apos;est un prototype validé qui résout un problème concret.”
                  </blockquote>
                  <span className="text-xs text-[#C99A68] font-bold block mt-2">
                    Direction Scientifique · CIAT ISEP Diamniadio
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =====================================================================
       * SECTION 4 — INFRASTRUCTURES & ÉQUIPEMENTS DU CAMPUS
       * ===================================================================== */}
      <section className="py-16 md:py-24 border-b border-[#EBE4DC] bg-[#FAF7F2]">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-12">
            <div>
              <span className="text-xs font-bold uppercase tracking-[0.25em] text-[#612D10]">
                UN LIEU DE HAUTE TECHNOLOGIE
              </span>
              <h2 className="mt-2 text-2xl sm:text-3xl lg:text-4xl font-extrabold text-[#24140D] tracking-tight">
                Nos plateformes d&apos;expérimentation
              </h2>
              <p className="mt-2 text-sm text-[#6B5646] max-w-xl">
                Des équipements aux standards industriels ouverts aux apprenants, porteurs de projets et entreprises partenaires.
              </p>
            </div>

            <Link
              href="/portail/incubateur"
              className="inline-flex items-center gap-2 text-sm font-bold text-[#612D10] hover:text-[#C99A68] transition-colors shrink-0"
            >
              <span>Voir le parcours d&apos;incubation</span>
              <ArrowRight size={16} />
            </Link>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {INFRASTRUCTURES.map((infra, idx) => (
              <div
                key={idx}
                className="group rounded-2xl border border-[#EBE4DC] bg-white overflow-hidden shadow-xs hover:shadow-xl transition-all duration-300 flex flex-col"
              >
                <div className="relative aspect-[16/10] w-full overflow-hidden bg-black/30">
                  <Image
                    src={infra.image}
                    alt={infra.titre}
                    fill
                    sizes="(max-width: 768px) 100vw, 33vw"
                    className="object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute top-3 right-3">
                    <span className="rounded-full bg-black/60 px-3 py-1 text-[11px] font-bold text-white backdrop-blur-xs">
                      {infra.badge}
                    </span>
                  </div>
                </div>

                <div className="p-6 flex-1 flex flex-col justify-between">
                  <div>
                    <h3 className="text-lg font-bold text-[#24140D] group-hover:text-[#612D10] transition-colors tracking-tight">
                      {infra.titre}
                    </h3>
                    <p className="mt-2 text-xs sm:text-sm text-[#6B5646] leading-relaxed">
                      {infra.desc}
                    </p>
                  </div>

                  <div className="mt-5 pt-4 border-t border-[#FAF7F2] flex items-center justify-between text-xs">
                    <span className="text-[#AFA496] font-medium">Campus Diamniadio</span>
                    <span className="text-[#612D10] font-bold group-hover:translate-x-1 transition-transform">
                      Explorer →
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* =====================================================================
       * SECTION 5 — LES DOCUMENTS DEMANDÉS & CADRE OFFICIEL DE CANDIDATURE
       * ===================================================================== */}
      <section id="documents-demandes" className="py-16 md:py-24 bg-white border-b border-[#EBE4DC]">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mb-12">
            <span className="text-xs font-bold uppercase tracking-[0.25em] text-[#612D10]">
              MODALITÉS OFFICIELLES
            </span>
            <h2 className="mt-2 text-2xl sm:text-3xl lg:text-4xl font-extrabold text-[#24140D] tracking-tight">
              Les documents demandés pour intégrer le CIAT
            </h2>
            <p className="mt-3 text-sm sm:text-base leading-relaxed text-[#6B5646]">
              Pour garantir l&apos;équité et la rigueur de l&apos;évaluation, chaque dossier de candidature
              doit comporter les trois pièces obligatoires définies par le comité scientifique.
            </p>
          </div>

          <div className="grid gap-8 lg:grid-cols-12 lg:items-start">
            {/* Colonne Gauche : Les 3 pièces justificatives obligatoires */}
            <div className="lg:col-span-6 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-[#EBE4DC]">
                <h3 className="text-base font-bold text-[#612D10] flex items-center gap-2">
                  <ShieldCheck size={18} className="text-[#C99A68]" />
                  Les 3 Pièces Obligatoires au Dossier
                </h3>
                <span className="text-[11px] font-bold uppercase px-2.5 py-0.5 rounded-full bg-[#EBE4DC] text-[#612D10]">
                  Contrôle de complétude
                </span>
              </div>

              {PIECES_JUSTIFICATIVES_DEMANDEES.map((piece) => (
                <div
                  key={piece.num}
                  className="rounded-2xl border border-[#EBE4DC] bg-[#FAF7F2] p-5 transition-all hover:border-[#612D10]"
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

              <div className="p-4 rounded-xl bg-[#FAF7F2] border border-[#EBE4DC] text-xs text-[#6B5646] flex items-center gap-3">
                <CheckCircle2 size={18} className="text-[#2E7D32] shrink-0" />
                <span>
                  Un dossier incomplet ne peut être soumis à l&apos;évaluation. Vos saisies sont sauvegardées en temps réel.
                </span>
              </div>
            </div>

            {/* Colonne Droite : Documents officiels téléchargeables */}
            <div className="lg:col-span-6 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-[#EBE4DC]">
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
                  className="rounded-2xl border border-[#EBE4DC] bg-white p-5 shadow-xs transition-all hover:border-[#612D10] flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-[#C99A68]">
                        {doc.categorie}
                      </span>
                      <span className="text-[10px] font-semibold text-[#612D10] bg-[#EBE4DC] px-2 py-0.5 rounded">
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
                  className="w-full inline-flex items-center justify-center rounded-xl bg-[#612D10] px-6 py-3.5 text-sm font-bold text-white shadow-md transition-all hover:bg-[#48210B] active:scale-95"
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
      <section className="bg-gradient-to-r from-[#24140D] via-[#3D1D10] to-[#24140D] text-white py-16 border-t border-[#3D1D10]">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="space-y-1.5 text-center sm:text-left">
            <h2 className="text-2xl sm:text-3xl font-extrabold !text-white tracking-tight">
              Prêt à accélérer votre projet au CIAT ?
            </h2>
            <p className="text-xs sm:text-sm text-[#FAF7F2]/80 max-w-xl">
              Consultez le parcours de l’incubateur ou contactez notre secrétariat à Diamniadio.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <Link
              href="/portail/incubateur"
              className="inline-flex items-center justify-center rounded-xl border border-white/50 bg-white/10 px-6 py-3 text-xs font-semibold text-white transition-all hover:bg-white/20 active:scale-95"
            >
              Voir le parcours incubateur
            </Link>
            <Link
              href="/connexion?next=/incubateur"
              className="inline-flex items-center justify-center rounded-xl bg-[#612D10] px-6 py-3 text-xs font-bold text-white shadow-lg transition-all hover:bg-[#C99A68] hover:text-[#24140D] active:scale-95 border border-[#C99A68]/40"
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
