import Image from "next/image";
import { ButtonLink } from "@/components/ui";
import PageHero from "@/components/PageHero";

export const metadata = {
  title: "Le CIAT",
  description:
    "Le Centre d'Innovation, d'Application et de Transfert de l'ISEP Amadou Trawaré de Diamniadio : missions et ateliers.",
};

const MISSIONS = [
  {
    titre: "Prototyper",
    texte: "Transformer des problèmes concrets du Sénégal en prototypes testés.",
  },
  {
    titre: "Former par la pratique",
    texte: "Faire travailler les apprenants sur de vrais projets, encadrés par des enseignants.",
  },
  {
    titre: "Protéger les inventions",
    texte: "Aider les porteurs à faire reconnaître et protéger leur travail.",
  },
  {
    titre: "Transférer",
    texte: "Mettre les innovations prêtes en relation avec les entreprises et les collectivités.",
  },
];

const ATELIERS = [
  {
    titre: "Fabrication et usinage",
    texte: "Machines à commande numérique, scanner et impression 3D.",
    image: "/images/innovations/cnc-4-0-clean.jpg",
  },
  {
    titre: "Électronique et objets connectés",
    texte: "Conception de cartes, programmation et robotique.",
    image: "/images/ciat_galerie_hero_elec.jpg",
  },
  {
    titre: "Énergie solaire et irrigation",
    texte: "Bancs d'essai solaires, froid autonome et capteurs agricoles.",
    image: "/images/innovations/agrisol-iot.jpg",
  },
  {
    titre: "Espace incubateur",
    texte: "Bureaux partagés, salles de réunion et showroom.",
    image: "/images/contact/contact-accueil-campus.jpg",
  },
];

export default function CiatPresentationPage() {
  return (
    <div>
      <PageHero
        image="/images/ciat-header-panoramique.jpg"
        title="Des idées aux prototypes"
        subtitle="Le Centre d'Innovation, d'Application et de Transfert réunit porteurs de projets, enseignants et entreprises sur le campus de l'ISEP de Diamniadio."
      >
        <ButtonLink href="/portail/appels">Candidater</ButtonLink>
      </PageHero>

      <section id="missions" className="mx-auto max-w-7xl scroll-mt-24 px-4 py-24 sm:px-6 lg:px-8">
        <h2 className="text-3xl font-bold">Nos missions</h2>
        <p className="mt-4 max-w-2xl leading-relaxed text-texte-doux">
          Le CIAT relie la formation, les ateliers et les entreprises pour qu&apos;une bonne idée
          devienne un produit utile, fabriqué et utilisé au Sénégal.
        </p>
        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {MISSIONS.map((m) => (
            <div key={m.titre} className="rounded-2xl border border-bordure bg-white p-6">
              <h3 className="text-base font-semibold">{m.titre}</h3>
              <p className="mt-2 text-sm leading-relaxed text-texte-doux">{m.texte}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="ateliers" className="scroll-mt-24 bg-ivoire">
        <div className="mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold">Les ateliers</h2>
          <p className="mt-4 max-w-xl leading-relaxed text-texte-doux">
            Ouverts aux projets incubés, aux filières de l&apos;ISEP et aux entreprises
            partenaires.
          </p>
          <div className="mt-12 grid gap-10 md:grid-cols-2">
            {ATELIERS.map((a) => (
              <div key={a.titre}>
                <div className="relative aspect-[16/9] overflow-hidden rounded-2xl bg-bordure">
                  <Image
                    src={a.image}
                    alt=""
                    fill
                    sizes="(max-width: 768px) 100vw, 50vw"
                    className="object-cover"
                  />
                </div>
                <h3 className="mt-5 text-lg font-semibold">{a.titre}</h3>
                <p className="mt-2 text-texte-doux">{a.texte}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-24 text-center sm:px-6 lg:px-8">
        <h2 className="text-3xl font-bold">Rejoindre l&apos;incubateur</h2>
        <p className="mx-auto mt-4 max-w-xl leading-relaxed text-texte-doux">
          Un parcours en cinq étapes, avec un mentor et l&apos;accès aux ateliers.
        </p>
        <ol className="mx-auto mt-8 flex max-w-3xl flex-wrap justify-center gap-x-6 gap-y-2 text-sm text-texte-doux">
          {["Candidature", "Sélection", "Intégration", "Prototypage", "Lancement"].map((etape, i) => (
            <li key={etape}>
              <span className="font-semibold text-beige">{i + 1}.</span> {etape}
            </li>
          ))}
        </ol>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <ButtonLink href="/portail/incubateur">Voir le parcours</ButtonLink>
          <ButtonLink href="/portail/contact" variant="secondary">
            Nous contacter
          </ButtonLink>
        </div>
      </section>
    </div>
  );
}
