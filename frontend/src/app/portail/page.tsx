import Link from "next/link";
import PageHero from "@/components/PageHero";


export const metadata = {
  title: "Portail",
  description:
    "Portail du Centre d'Innovation, d'Application et de Transfert (CIAT) de l'ISEP Amadou Trawaré de Diamniadio.",
};

const RUBRIQUES = [
  { href: "/portail/ciat", titre: "Le CIAT", texte: "Missions, ateliers et équipe." },
  { href: "/portail/incubateur", titre: "L'incubateur", texte: "Le parcours en cinq étapes." },
  { href: "/portail/domaines", titre: "Domaines", texte: "Les sept filières du centre." },
  { href: "/portail/appels", titre: "Appels à candidatures", texte: "Les appels ouverts et leurs dates." },
  { href: "/portail/projets", titre: "Projets incubés", texte: "Les projets accompagnés." },
  { href: "/portail/actualites", titre: "Actualités", texte: "Les dernières nouvelles du centre." },
  { href: "/portail/evenements", titre: "Agenda", texte: "Événements et journées à venir." },
  { href: "/portail/partenaires", titre: "Partenaires", texte: "Institutions et entreprises partenaires." },
  { href: "/portail/documents", titre: "Documents", texte: "Canevas et règlements à télécharger." },
  { href: "/portail/contact", titre: "Contact", texte: "Écrire au secrétariat." },
];

export default function PortailHubPage() {
  return (
    <>
      <PageHero image="/images/domaines_ecosystem_building_hd.jpg" title="Portail" subtitle="Toutes les rubriques publiques du CIAT." />
    <div className="mx-auto w-full max-w-7xl px-4 py-16 sm:px-6 md:py-24 lg:px-8">
      <div className="max-w-4xl">

      <ul className="grid border-t border-bordure sm:grid-cols-2 sm:gap-x-12">
        {RUBRIQUES.map((r) => (
          <li key={r.href} className="border-b border-bordure">
            <Link href={r.href} className="group block py-5">
              <span className="font-semibold text-brun group-hover:underline">{r.titre}</span>
              <span className="mt-1 block text-sm text-texte-doux">{r.texte}</span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
    </div>
    </>
  );
}
