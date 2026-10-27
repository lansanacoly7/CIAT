import Image from "next/image";
import Link from "next/link";
import { ArrowRight, ChevronRight, FileText, Lightbulb, Rocket, ShieldCheck, Sparkles, Users, Wrench } from "lucide-react";
import { ButtonLink } from "@/components/ui";

export const metadata = {
  title: "L'Incubateur du CIAT — Parcours & Accompagnement",
  description:
    "Transformez vos idées en entreprises d'avenir à l'ISEP Amadou Trawaré de Diamniadio : accompagnement en 5 jalons, ateliers technologiques et mentorat de haut niveau.",
};

const STATS = [
  { val: "+ 50", label: "projets accompagnés", icon: Lightbulb },
  { val: "+ 25", label: "startups & prototypes", icon: Rocket },
  { val: "+ 15", label: "mentors et experts", icon: Users },
  { val: "7", label: "filières d'innovation", icon: Sparkles },
];

const ETAPES = [
  {
    num: "01",
    titre: "Soumission de candidature",
    description: "Déposez votre dossier en ligne avec fiche projet, compétences de l'équipe et budget prévisionnel.",
    icon: FileText,
  },
  {
    num: "02",
    titre: "Sélection et évaluation",
    description: "Analyse d'éligibilité et audition devant le comité de sélection selon la grille multicritère officielle.",
    icon: ShieldCheck,
  },
  {
    num: "03",
    titre: "Intégration & Convention",
    description: "Signature de la convention ISEP, affectation d'un mentor dédié et définition des jalons à 3 et 6 mois.",
    icon: Users,
  },
  {
    num: "04",
    titre: "Prototypage & Ateliers",
    description: "Accès aux bancs d'essai, ateliers de fabrication mécanique et laboratoires électroniques de Diamniadio.",
    icon: Wrench,
  },
  {
    num: "05",
    titre: "Validation & Transfert",
    description: "Tests de performance terrain, publication dans la Galerie CIAT et mise en relation avec investisseurs.",
    icon: Rocket,
  },
];

const PROJETS_INCUBES = [
  {
    titre: "SunuRekolt & AgriTech",
    tag: "AgriTech",
    desc: "Station IoT agrométéo et régulation solaire de micro-irrigation pour les maraîchers de la zone des Niayes.",
    lieu: "Niayes & Vallée, Sénégal",
    image: "/images/incubateur/incubateur-projet-agro.jpg",
    href: "/galerie",
  },
  {
    titre: "SunuGrid & Solaire Modulaire",
    tag: "Énergies Propres",
    desc: "Mini-réseaux intelligents et kits solaires modulaires pour ateliers artisanaux et fermes maraîchères.",
    lieu: "Diamniadio, Sénégal",
    image: "/images/incubateur/incubateur-projet-solaire.jpg",
    href: "/galerie",
  },
  {
    titre: "Mobilité Éco-Fret",
    tag: "Logistique & Mobilité",
    desc: "Tricycles utilitaires électriques et gestion logistique du dernier kilomètre pour les marchés urbains.",
    lieu: "Dakar & Régions, Sénégal",
    image: "/images/incubateur/incubateur-projet-mobilite.jpg",
    href: "/galerie",
  },
];

const TEMOIGNAGES = [
  {
    quote: "L'incubateur du CIAT nous a permis de structurer notre projet et de passer du schéma théorique au premier banc d'essai fonctionnel.",
    nom: "Mamadou Sène",
    role: "Porteur du projet AgriSol / ISEP Diamniadio",
  },
  {
    quote: "L'accès direct aux machines de haute précision et le mentorat des enseignants-chercheurs ont accéléré notre développement de plus d'un an.",
    nom: "Aïssatou Diallo",
    role: "Fondatrice EduTrack AI",
  },
  {
    quote: "Le CIAT nous a offert le cadre rigoureux indispensable pour tester notre dispositif médical en conditions réelles et valider nos normes.",
    nom: "Boubacar Fall",
    role: "Ingénieur biomédical associé",
  },
];

export default function IncubateurPage() {
  return (
    <div className="bg-[#FAF7F2] text-[#24140D] min-h-screen">
      {/* =====================================================================
       * 1. HERO OFFICIEL : IMAGE HD NETTOYÉE DE PUBLIC/IMAGES,
       *    TEXTE CALÉ À GAUCHE & BOUTONS PARFAITEMENT DISPOSÉS CÔTE À CÔTE
       * ===================================================================== */}
      <section className="relative overflow-hidden bg-[#0A0C0F] text-white min-h-[460px] md:min-h-[520px] lg:min-h-[560px] flex items-center">
        {/* Photo haute définition native collaboration-innovante-ciat.png non pixelisée */}
        <div className="absolute inset-0 z-0">
          <Image
            src="/images/collaboration-innovante-ciat.png"
            alt="Équipe d'innovateurs à l'incubateur du CIAT — ISEP Amadou Trawaré"
            fill
            priority
            unoptimized
            className="object-cover object-right"
          />
          {/* Dégradé sombre horizontal pour une lisibilité parfaite des textes et mise en valeur de la photo */}
          <div className="absolute inset-0 bg-gradient-to-r from-[#0A0C0F] via-[#0A0C0F]/90 via-35% via-[#0A0C0F]/60 to-transparent" />
          {/* Dégradé subtil bas pour fondu élégant */}
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-[#0A0C0F]/50 to-transparent" />
        </div>

        {/* Conteneur textuel calé sur la gauche, aucun chevauchement sur les personnes */}
        <div className="relative z-10 w-full px-6 sm:px-10 lg:px-16 py-12 md:py-16">
          <div className="w-full max-w-xl space-y-4">
            <span className="inline-block text-xs font-bold uppercase tracking-[0.25em] text-[#C99A68]">
              INCUBATEUR
            </span>

            <h1 className="text-3xl sm:text-4xl lg:text-[44px] font-extrabold text-white tracking-tight leading-[1.12]">
              Transformez vos idées
              <br />
              en entreprises d’avenir
            </h1>

            <p className="text-sm sm:text-base leading-relaxed text-[#F0E6DC] max-w-lg font-normal">
              Notre incubateur accompagne les porteurs de projets de la phase d’idée jusqu’au lancement
              et au-delà. Bénéficiez d’un encadrement, de ressources et d’un réseau pour concrétiser
              votre projet et avoir un impact durable.
            </p>

            {/* Boutons disposés côte à côte horizontalement sans superposition */}
            <div className="flex flex-row flex-wrap items-center gap-4 pt-3">
              <Link
                href="/connexion?next=/incubateur"
                className="inline-flex items-center justify-center rounded-full bg-[#963E15] px-7 py-3.5 text-sm font-semibold text-white shadow-lg transition-all hover:bg-[#B34E1E] hover:shadow-xl active:scale-95 shrink-0"
              >
                Candidater maintenant
                <ArrowRight size={16} className="ml-2" />
              </Link>

              <a
                href="#parcours"
                className="inline-flex items-center justify-center rounded-full border border-white/60 bg-transparent px-7 py-3.5 text-sm font-semibold text-white transition-all hover:bg-white/15 hover:border-white active:scale-95 shrink-0"
              >
                Découvrir l&apos;accompagnement
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* =====================================================================
       * 2. BANDEAU DE MÉTRIQUES & ANCRAGE (KPI STRIP)
       * ===================================================================== */}
      <section className="border-b border-[#EFE4D6] bg-white py-8 shadow-sm">
        <div className="mx-auto max-w-6xl px-4">
          <div className="grid grid-cols-2 gap-6 sm:grid-cols-4">
            {STATS.map((stat) => {
              const Icon = stat.icon;
              return (
                <div key={stat.label} className="flex items-center gap-3.5">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#FAF7F2] border border-[#EFE4D6] text-[#C99A68]">
                    <Icon size={22} strokeWidth={2} />
                  </div>
                  <div>
                    <div className="text-2xl font-extrabold text-[#24140D] tracking-tight">
                      {stat.val}
                    </div>
                    <div className="text-xs text-[#6F645A] font-medium capitalize">
                      {stat.label}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* =====================================================================
       * 3. NOTRE PARCOURS D'INCUBATION (EN 5 JALONS OFFICIELS)
       * ===================================================================== */}
      <section id="parcours" className="mx-auto max-w-6xl px-4 py-20 md:py-24">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-12">
          <div>
            <span className="text-xs font-bold uppercase tracking-[0.18em] text-[#C99A68]">
              UN ACCOMPAGNEMENT STRUCTURÉ
            </span>
            <h2 className="mt-1 text-2xl font-extrabold text-[#24140D] sm:text-3xl md:text-4xl tracking-tight">
              Notre parcours d’incubation
            </h2>
            <p className="mt-2 text-sm text-[#6F645A] max-w-xl">
              Un processus clair, rigoureux et progressif en 5 jalons pour maximiser les chances de viabilité
              de chaque innovation issue de nos filières.
            </p>
          </div>

          <Link
            href="/portail/ciat#jalons"
            className="inline-flex items-center text-xs font-bold uppercase tracking-wider text-[#C99A68] hover:text-[#612D10] transition-colors"
          >
            Voir le protocole officiel <ChevronRight size={14} className="ml-1" />
          </Link>
        </div>

        {/* Grille horizontale des 5 étapes */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {ETAPES.map((etape) => {
            const Icon = etape.icon;
            return (
              <div
                key={etape.num}
                className="group relative rounded-2xl border border-[#EFE4D6] bg-white p-5 transition-all duration-200 hover:-translate-y-1 hover:border-[#C99A68] hover:shadow-lg flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#FAF7F2] text-[#612D10] group-hover:bg-[#C99A68] group-hover:text-white transition-colors">
                      <Icon size={20} strokeWidth={2} />
                    </div>
                    <span className="text-sm font-extrabold text-[#C99A68]/80 font-mono">
                      {etape.num}
                    </span>
                  </div>

                  <h3 className="text-sm font-bold text-[#24140D] group-hover:text-[#612D10] transition-colors">
                    {etape.titre}
                  </h3>

                  <p className="mt-2 text-xs leading-relaxed text-[#6F645A]">
                    {etape.description}
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-[#FAF7F2] flex items-center justify-between text-[11px] font-semibold text-[#C99A68]">
                  <span>Jalon validé</span>
                  <ChevronRight size={12} />
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* =====================================================================
       * 4. PROJETS INCUBÉS : DES IDÉES QUI CHANGENT LE TERRITOIRE
       * ===================================================================== */}
      <section className="bg-[#24140D] text-white py-20 md:py-24 border-t border-[#3D1D10]">
        <div className="mx-auto max-w-6xl px-4">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-12">
            <div>
              <span className="text-xs font-bold uppercase tracking-[0.18em] text-[#C99A68]">
                PROJETS INCUBÉS
              </span>
              <h2 className="mt-1 text-2xl font-extrabold sm:text-3xl md:text-4xl text-white tracking-tight">
                Des idées qui changent le territoire
              </h2>
              <p className="mt-2 text-sm text-[#cbb69e] max-w-xl">
                Découvrez quelques projets innovants accompagnés par notre incubateur et qui contribuent
                au développement économique et social du Sénégal.
              </p>
            </div>

            <ButtonLink href="/galerie" variant="secondary" className="!text-white !border-white/40 !bg-white/10 hover:!bg-white/20">
              Voir tous les projets <ArrowRight size={15} className="ml-2" />
            </ButtonLink>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {PROJETS_INCUBES.map((projet) => (
              <div
                key={projet.titre}
                className="group rounded-2xl border border-white/10 bg-white/[0.04] overflow-hidden hover:border-[#C99A68] transition-all duration-200 hover:-translate-y-1 flex flex-col"
              >
                <div className="relative h-48 w-full bg-black/40 overflow-hidden">
                  <Image
                    src={projet.image}
                    alt={projet.titre}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                    sizes="(max-width: 768px) 100vw, 33vw"
                  />
                  <div className="absolute top-3 left-3">
                    <span className="rounded-full bg-[#FAF7F2] px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-[#612D10] shadow-sm">
                      {projet.tag}
                    </span>
                  </div>
                </div>

                <div className="p-5 flex-1 flex flex-col justify-between">
                  <div>
                    <h3 className="text-base font-bold text-white group-hover:text-[#C99A68] transition-colors">
                      {projet.titre}
                    </h3>
                    <p className="mt-2 text-xs leading-relaxed text-[#cbb69e]">
                      {projet.desc}
                    </p>
                  </div>

                  <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between text-xs text-[#a89580]">
                    <span>{projet.lieu}</span>
                    <Link href={projet.href} className="text-[#C99A68] hover:underline flex items-center gap-1 font-semibold">
                      Fiche <ArrowRight size={12} />
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* =====================================================================
       * 5. LEUR EXPÉRIENCE COMPTE (TÉMOIGNAGES RÉELS)
       * ===================================================================== */}
      <section className="mx-auto max-w-6xl px-4 py-20 md:py-24">
        <div className="text-center max-w-2xl mx-auto mb-14">
          <span className="text-xs font-bold uppercase tracking-[0.18em] text-[#C99A68]">
            ILS EN PARLENT MIEUX QUE NOUS
          </span>
          <h2 className="mt-1 text-2xl font-extrabold text-[#24140D] sm:text-3xl md:text-4xl tracking-tight">
            Leur expérience compte
          </h2>
          <p className="mt-2 text-sm text-[#6F645A]">
            La réussite des apprenants et porteurs de projet est la seule mesure de notre impact.
          </p>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {TEMOIGNAGES.map((t, index) => (
            <div
              key={index}
              className="rounded-2xl border border-[#EFE4D6] bg-white p-6 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between"
            >
              <p className="text-xs sm:text-sm leading-relaxed text-[#4A3E34] italic">
                &ldquo;{t.quote}&rdquo;
              </p>

              <div className="mt-6 pt-4 border-t border-[#FAF7F2] flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-[#612D10] text-[#FAF7F2] flex items-center justify-center font-bold text-sm">
                  {t.nom.charAt(0)}
                </div>
                <div>
                  <div className="text-xs font-bold text-[#24140D]">{t.nom}</div>
                  <div className="text-[11px] text-[#8C7E72]">{t.role}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* =====================================================================
       * 6. BANDEAU D'APPEL À L'ACTION FINAL
       * ===================================================================== */}
      <section className="bg-gradient-to-r from-[#24140D] via-[#3D1D10] to-[#24140D] text-white py-16 border-t border-[#3D1D10]">
        <div className="mx-auto max-w-6xl px-4 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="space-y-2 text-center sm:text-left">
            <h2 className="text-2xl sm:text-3xl font-extrabold !text-white tracking-tight">
              Votre projet mérite d’être incubé
            </h2>
            <p className="text-xs sm:text-sm text-[#cbb69e] max-w-xl">
              Rejoignez la prochaine cohorte d&apos;innovateurs et donnez vie à votre solution au CIAT de Diamniadio.
            </p>
          </div>

          <ButtonLink
            href="/connexion?next=/incubateur"
            variant="accent"
            className="font-bold text-sm px-7 py-3.5 shadow-xl shrink-0"
          >
            Candidater maintenant
            <ArrowRight size={16} className="ml-2" />
          </ButtonLink>
        </div>
      </section>
    </div>
  );
}
