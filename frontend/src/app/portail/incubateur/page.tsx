import Image from "next/image";
import Link from "next/link";
import { ButtonLink } from "@/components/ui";
import PageHero, { HERO_GHOST } from "@/components/PageHero";

export const metadata = {
  title: "L'incubateur",
  description:
    "L'incubateur du CIAT à l'ISEP Amadou Trawaré de Diamniadio : un parcours en cinq étapes, de l'idée au projet lancé.",
};

const ETAPES = [
  {
    titre: "Candidature",
    texte: "Vous déposez votre dossier en ligne : le projet, l'équipe et le budget prévu.",
  },
  {
    titre: "Sélection",
    texte: "Un comité étudie le dossier et vous reçoit pour une présentation.",
  },
  {
    titre: "Intégration",
    texte: "Vous signez la convention et un mentor vous est attribué.",
  },
  {
    titre: "Prototypage",
    texte: "Vous construisez et testez votre prototype dans les ateliers du CIAT.",
  },
  {
    titre: "Lancement",
    texte: "Le projet est testé sur le terrain, présenté dans la galerie et aux partenaires.",
  },
];

const AVANTAGES = [
  {
    titre: "Un mentor",
    texte: "Un enseignant ou un professionnel vous suit tout au long du parcours.",
  },
  {
    titre: "Les ateliers",
    texte: "Machines, électronique et bancs d'essai pour construire votre prototype.",
  },
  {
    titre: "Un réseau",
    texte: "Des partenaires, entreprises et financeurs pour lancer votre projet.",
  },
];

const PROJETS = [
  {
    domaine: "Agriculture",
    titre: "SunuRekolt",
    texte: "Station connectée et irrigation solaire pour les maraîchers des Niayes.",
    image: "/images/galerie_moments/irrigation-intelligente.jpg",
  },
  {
    domaine: "Énergie",
    titre: "SunuGrid",
    texte: "Kits solaires modulaires pour ateliers artisanaux et fermes.",
    image: "/images/galerie_moments/solaire-campus.jpg",
  },
  {
    domaine: "Mobilité",
    titre: "Éco-Fret",
    texte: "Tricycles électriques pour la livraison sur les marchés urbains.",
    image: "/images/galerie_moments/projets-robotique.jpg",
  },
];

export default function IncubateurPage() {
  return (
    <div>
      <PageHero
        image="/images/collaboration-innovante-ciat.png"
        imagePosition="object-right"
        title="De l'idée au projet lancé"
        subtitle="L'incubateur vous accompagne pas à pas, avec un mentor, l'accès aux ateliers et un réseau de partenaires."
      >
        <ButtonLink href="/portail/appels">Candidater</ButtonLink>
        <ButtonLink href="#parcours" variant="secondary" className={HERO_GHOST}>
          Voir le parcours
        </ButtonLink>
      </PageHero>

      <section id="parcours" className="mx-auto max-w-7xl scroll-mt-24 px-4 py-24 sm:px-6 lg:px-8">
        <h2 className="text-3xl font-bold">Le parcours</h2>
        <ol className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-5">
          {ETAPES.map((e, i) => (
            <li key={e.titre} className="rounded-2xl border border-bordure bg-white p-6">
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-ivoire font-[family-name:var(--font-title)] text-sm font-bold text-brun">
                {i + 1}
              </span>
              <h3 className="mt-4 text-base font-semibold">{e.titre}</h3>
              <p className="mt-2 text-sm leading-relaxed text-texte-doux">{e.texte}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="mx-auto max-w-7xl px-4 pb-24 sm:px-6 lg:px-8">
        <h2 className="text-3xl font-bold">Ce que vous obtenez</h2>
        <div className="mt-10 grid gap-5 md:grid-cols-3">
          {AVANTAGES.map((a) => (
            <div key={a.titre} className="rounded-2xl border border-bordure bg-white p-6">
              <h3 className="text-base font-semibold">{a.titre}</h3>
              <p className="mt-2 text-sm leading-relaxed text-texte-doux">{a.texte}</p>
            </div>
          ))}
        </div>

        <h2 className="mt-24 text-3xl font-bold">Quelques projets accompagnés</h2>
        <div className="mt-10 grid gap-8 md:grid-cols-3">
          {PROJETS.map((p) => (
            <Link key={p.titre} href="/galerie" className="group">
              <div className="relative aspect-[4/3] overflow-hidden rounded-2xl bg-bordure">
                <Image src={p.image} alt="" fill sizes="(max-width: 768px) 100vw, 33vw" className="object-cover" />
              </div>
              <p className="mt-3 text-xs text-texte-doux">{p.domaine}</p>
              <h3 className="mt-1 text-[15px] font-semibold group-hover:underline">{p.titre}</h3>
              <p className="mt-1 text-[13px] leading-relaxed text-texte-doux">{p.texte}</p>
            </Link>
          ))}
        </div>
      </section>

      <section className="bg-ivoire">
        <div className="mx-auto max-w-7xl px-4 py-24 text-center sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold">Prêt à candidater ?</h2>
          <p className="mx-auto mt-4 max-w-xl leading-relaxed text-texte-doux">
            Consultez l&apos;appel en cours ou découvrez les projets déjà accompagnés.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <ButtonLink href="/portail/appels">Voir l&apos;appel en cours</ButtonLink>
            <ButtonLink href="/portail/projets" variant="secondary">
              Projets incubés
            </ButtonLink>
          </div>
        </div>
      </section>
    </div>
  );
}
