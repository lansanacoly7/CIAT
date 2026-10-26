import Image from "next/image";
import { ButtonLink, Card, PageTitle } from "@/components/ui";

export const metadata = {
  title: "Le CIAT et sa mission",
  description:
    "Découvrez le Centre d'Innovation, d'Application et de Transfert de l'ISEP Amadou Traoré de Diamniadio : missions, vision et ancrage territorial.",
};

const PILIERS = [
  {
    titre: "Rigueur & Excellence Technique",
    texte:
      "L'ancrage professionnel de l'ISEP et la rigueur universitaire garantissent une exécution robuste de solutions technologiques concrètes et adaptées aux réalités locales.",
  },
  {
    titre: "Chaleur Territoriale & Racines",
    texte:
      "Des valeurs inspirées de la terre cuite africaine, de l'artisanat et du sol fécond de Diamniadio, plaçant l'humain et le porteur de projet au cœur de chaque initiative.",
  },
  {
    titre: "Éclosion & Accompagnement",
    texte:
      "Accueillir l'idée à sa genèse (la graine) et la guider avec bienveillance et méthode jusqu'au prototype viable, industrialisable et scalable.",
  },
  {
    titre: "Futurisme & Intelligence Artificielle",
    texte:
      "Une approche sobre et éthique des technologies émergentes et de l'IA générative, mise au service de la productivité, de la décision et de l'impact sociétal.",
  },
];

const MISSIONS = [
  {
    titre: "1. Recherche Appliquée & Prototypage",
    description:
      "Mettre à disposition des ateliers, laboratoires et compétences d'ingénierie pour matérialiser les idées en prototypes fonctionnels testables sur le terrain.",
  },
  {
    titre: "2. Transfert de Technologies",
    description:
      "Assurer la passerelle entre les innovations développées à l'ISEP et le tissu économique, industriel et artisanal du Sénégal et de la sous-région.",
  },
  {
    titre: "3. Incubation Entrepreneuriale",
    description:
      "Structurer le parcours des créateurs d'entreprises : formalisation du modèle économique, mentorat personnalisé, suivi des jalons et mise en relation investisseurs.",
  },
];

export default function CiatPresentationPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-10 md:py-16">
      <PageTitle
        tag="Institution & Vision"
        title="Le Centre d'Innovation, d'Application et de Transfert"
        subtitle="Catalyseur technologique et entrepreneurial de l'ISEP Amadou Traoré de Diamniadio, au service de l'insertion et du développement économique."
      />

      {/* Section Présentation Institutionnelle avec Photo du Campus */}
      <section className="mb-14 overflow-hidden rounded-2xl border border-bordure bg-ivoire shadow-sm">
        <div className="grid gap-6 md:grid-cols-12 md:items-center">
          <div className="p-8 md:p-10 md:col-span-7">
            <span className="text-xs font-bold uppercase tracking-wider text-beige">
              Ancrage Territorial
            </span>
            <h2 className="mt-1 text-2xl font-bold text-brun">Un pôle stratégique à Diamniadio</h2>
            <div className="mt-4 space-y-4 text-base leading-relaxed text-texte">
              <p>
                Créé au sein de l&apos;<strong>Institut Supérieur d&apos;Enseignement Professionnel (ISEP) Amadou Traoré</strong>,
                le <strong>CIAT</strong> est le pôle d&apos;accélération technologique dédié aux apprenants, enseignants-chercheurs
                et innovateurs du Sénégal.
              </p>
              <p>
                Installé dans la ville moderne et innovante de Diamniadio, le centre offre un cadre propice à l&apos;expérimentation,
                à l&apos;application pratique des compétences acquises et à l&apos;émergence de solutions à fort impact territorial.
              </p>
            </div>
          </div>
          <div className="relative h-64 md:h-full md:min-h-[280px] md:col-span-5">
            <Image
              src="/images/campus-isep.png"
              alt="Campus de l'ISEP Amadou Traoré de Diamniadio"
              fill
              className="object-cover object-center"
            />
            <div className="absolute bottom-3 left-3 rounded-md bg-[#24140D]/85 px-2.5 py-1 text-[11px] font-semibold text-white backdrop-blur-sm">
              Campus ISEP Diamniadio · Siège du CIAT
            </div>
          </div>
        </div>
      </section>

      {/* Les 3 Missions Fondamentales */}
      <section className="mb-16">
        <div className="mb-8">
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-beige">
            Missions Officielles
          </p>
          <h2 className="mt-1 text-2xl font-bold text-brun md:text-3xl">
            Trois leviers d&apos;action pour transformer l&apos;écosystème
          </h2>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {MISSIONS.map((m, idx) => (
            <Card key={idx} className="flex h-full flex-col justify-between">
              <div>
                <h3 className="text-lg font-bold text-brun">{m.titre}</h3>
                <p className="mt-3 text-sm leading-relaxed text-texte-doux">
                  {m.description}
                </p>
              </div>
            </Card>
          ))}
        </div>
      </section>

      {/* Les 4 Piliers Fondamentaux de la Marque (Charte Page 02) */}
      <section className="mb-16">
        <div className="mb-8">
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-beige">
            Identité &amp; Valeurs
          </p>
          <h2 className="mt-1 text-2xl font-bold text-brun md:text-3xl">
            Les 4 Piliers Fondamentaux de l&apos;Écosystème CIAT
          </h2>
        </div>

        <div className="grid gap-6 sm:grid-cols-2">
          {PILIERS.map((p, idx) => (
            <div
              key={idx}
              className="rounded-xl border border-bordure bg-white p-6 shadow-sm hover:border-beige transition-colors"
            >
              <div className="flex items-center gap-3">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-beige/20 text-xs font-bold text-brun">
                  0{idx + 1}
                </span>
                <h3 className="text-base font-bold text-brun">{p.titre}</h3>
              </div>
              <p className="mt-3 text-sm leading-relaxed text-texte-doux">{p.texte}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Appel à l'action */}
      <section className="rounded-2xl border border-beige/40 bg-brun p-8 text-white md:p-10">
        <div className="flex flex-col items-start justify-between gap-6 md:flex-row md:items-center">
          <div>
            <h2 className="text-2xl font-extrabold !text-white">
              Vous avez un projet innovant à Diamniadio ?
            </h2>
            <p className="mt-2 max-w-xl text-sm text-[#ebd9c0]">
              Découvrez le parcours d&apos;incubation ou explorez les 7 filières prioritaires
              pour préparer votre candidature.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <ButtonLink href="/portail/incubateur" variant="accent">
              Le Parcours d&apos;Incubation
            </ButtonLink>
            <ButtonLink href="/portail/domaines" variant="secondary" className="!text-white !border-white hover:!bg-white/10">
              Voir les 7 Domaines
            </ButtonLink>
          </div>
        </div>
      </section>
    </div>
  );
}
