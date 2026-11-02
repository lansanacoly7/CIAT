/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import { ArrowRight, Images, Sprout, Wrench } from "lucide-react";
import { ButtonLink } from "@/components/ui";
import PageHero, { HERO_GHOST } from "@/components/PageHero";

const piliers = [
  {
    icon: Sprout,
    titre: "Incuber",
    texte: "Un parcours en cinq étapes, de l'idée au projet prêt à être lancé, avec un mentor.",
    href: "/portail/incubateur",
    lien: "Découvrir l'incubateur",
  },
  {
    icon: Wrench,
    titre: "Prototyper",
    texte: "Des ateliers équipés pour fabriquer et tester vos prototypes sur le campus.",
    href: "/portail/ciat#ateliers",
    lien: "Voir les ateliers",
  },
  {
    icon: Images,
    titre: "Valoriser",
    texte: "Les innovations issues du CIAT, présentées aux entreprises et aux partenaires.",
    href: "/galerie",
    lien: "Parcourir la galerie",
  },
];

const realisations = [
  {
    domaine: "Agriculture",
    titre: "AgriSol, station météo et irrigation raisonnée pour le Sahel",
    image: "/images/innovations/agrisol-iot.jpg",
  },
  {
    domaine: "Santé",
    titre: "Moniteur médical connecté pour le suivi des patients",
    image: "/images/innovations/telemedical-device.jpg",
  },
  {
    domaine: "Énergie",
    titre: "Éco-séchoir hybride pour les produits agroalimentaires",
    image: "/images/innovations/eco-sechoir-solaire.jpg",
  },
];

export default function Home() {
  return (
    <main>
      <PageHero
        image="/images/campus-isep.png"
        title={
          <>
            Innover aujourd&apos;hui pour
            <br />
            <span className="text-[#F4C494]">transformer demain</span>
          </>
        }
        subtitle="Le CIAT accompagne les porteurs de projets de l'ISEP de Diamniadio, de l'idée au prototype."
      >
        <ButtonLink href="/portail/ciat">Découvrir le CIAT</ButtonLink>
        <ButtonLink href="/galerie" variant="secondary" className={HERO_GHOST}>
          Voir les projets
        </ButtonLink>
      </PageHero>

      <section className="mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8">
        <h2 className="max-w-xl text-3xl font-bold">Ce que fait le CIAT</h2>
        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {piliers.map((p) => {
            const Icon = p.icon;
            return (
              <Link
                key={p.titre}
                href={p.href}
                className="group flex flex-col rounded-2xl border border-bordure bg-white p-7 transition-all hover:-translate-y-0.5 hover:border-beige hover:shadow-md motion-reduce:transition-none"
              >
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-ivoire text-brun">
                  <Icon size={20} strokeWidth={1.8} />
                </span>
                <h3 className="mt-5 text-lg font-semibold">{p.titre}</h3>
                <p className="mt-2 text-sm leading-relaxed text-texte-doux">{p.texte}</p>
                <span className="mt-auto inline-flex items-center gap-1.5 pt-6 text-sm font-semibold text-brun group-hover:underline">
                  {p.lien} <ArrowRight size={15} />
                </span>
              </Link>
            );
          })}
        </div>

        <dl className="mt-20 grid grid-cols-2 gap-8 border-t border-bordure pt-10 md:grid-cols-4">
          {[
            ["+50", "projets accompagnés"],
            ["+20", "prototypes réalisés"],
            ["7", "domaines d'innovation"],
            ["+10", "partenaires"],
          ].map(([chiffre, label]) => (
            <div key={label}>
              <dt className="sr-only">{label}</dt>
              <dd className="font-[family-name:var(--font-title)] text-4xl font-bold text-brun">{chiffre}</dd>
              <dd className="mt-1 text-sm text-texte-doux">{label}</dd>
            </div>
          ))}
        </dl>
      </section>

      <section className="mx-auto grid max-w-7xl items-center gap-12 px-4 pb-24 sm:px-6 md:grid-cols-2 lg:px-8">
        <img
          src="/images/about-lab-students.png"
          alt="Porteurs de projets au travail dans l'espace incubateur du CIAT"
          className="aspect-[4/3] w-full rounded-2xl object-cover"
        />
        <div>
          <h2 className="text-3xl font-bold">Un centre au cœur de l&apos;ISEP</h2>
          <p className="mt-5 leading-relaxed text-texte-doux">
            Implanté à l&apos;ISEP Amadou Trawaré de Diamniadio, le CIAT aide les apprenants, les
            diplômés et les entreprises à transformer leurs idées en solutions concrètes, utiles au
            développement du Sénégal.
          </p>
          <p className="mt-4 leading-relaxed text-texte-doux">
            Chaque projet est suivi par un mentor et peut s&apos;appuyer sur les ateliers et le réseau
            de partenaires du centre.
          </p>
          <Link
            href="/portail/ciat"
            className="mt-6 inline-flex items-center gap-1.5 text-sm font-semibold text-brun hover:underline"
          >
            En savoir plus <ArrowRight size={15} />
          </Link>
        </div>
      </section>

      <section className="bg-ivoire">
        <div className="mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8">
          <div className="flex items-end justify-between gap-6">
            <h2 className="text-3xl font-bold">Réalisations</h2>
            <Link
              href="/galerie"
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-brun hover:underline"
            >
              Tout voir <ArrowRight size={15} />
            </Link>
          </div>
          <div className="mt-12 grid gap-8 md:grid-cols-3">
            {realisations.map((r) => (
              <Link href="/galerie" key={r.titre} className="group">
                <div className="aspect-[4/3] overflow-hidden rounded-2xl bg-bordure">
                  <img
                    src={r.image}
                    alt=""
                    className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03] motion-reduce:transition-none"
                  />
                </div>
                <p className="mt-3 text-xs text-texte-doux">{r.domaine}</p>
                <h3 className="mt-1 text-[15px] font-semibold leading-snug group-hover:underline">
                  {r.titre}
                </h3>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-24 text-center sm:px-6 lg:px-8">
        <h2 className="text-3xl font-bold">Vous avez un projet ?</h2>
        <p className="mx-auto mt-4 max-w-xl leading-relaxed text-texte-doux">
          Apprenants, diplômés et entreprises partenaires peuvent candidater à
          l&apos;incubateur.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <ButtonLink href="/portail/appels">Candidater</ButtonLink>
          <ButtonLink href="/portail/contact" variant="secondary">
            Nous contacter
          </ButtonLink>
        </div>
      </section>
    </main>
  );
}
