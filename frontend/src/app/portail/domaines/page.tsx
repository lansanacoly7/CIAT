import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

import type { DomaineCode } from "@/app/galerie/galerie-visuals";
import PageHero from "@/components/PageHero";

export const metadata = {
  title: "Domaines",
  description:
    "Les sept domaines d'intervention du CIAT à l'ISEP Amadou Trawaré de Diamniadio.",
};

const DOMAINES: {
  numero: string;
  code: Exclude<DomaineCode, "tous">;
  titre: string;
  texte: string;
  image: string;
}[] = [
  {
    numero: "01",
    code: "numerique",
    titre: "Numérique et intelligence artificielle",
    texte: "Logiciels, objets connectés et outils en langues nationales.",
    image: "/images/domaine_01_tic_hd.jpg",
  },
  {
    numero: "02",
    code: "mecanique",
    titre: "Mécanique et fabrication",
    texte: "Pièces de rechange, outillage et machines fabriqués localement.",
    image: "/images/innovations/cnc-4-0-clean.jpg",
  },
  {
    numero: "03",
    code: "agriculture",
    titre: "Agriculture et environnement",
    texte: "Irrigation, conservation des récoltes et suivi des sols.",
    image: "/images/innovations/agrisol-iot.jpg",
  },
  {
    numero: "04",
    code: "energie",
    titre: "Énergie",
    texte: "Solaire, stockage et froid autonome pour les zones rurales.",
    image: "/images/d04_unsplash.jpg",
  },
  {
    numero: "05",
    code: "biomedical",
    titre: "Santé et biomédical",
    texte: "Dispositifs médicaux simples à réparer pour les postes de santé.",
    image: "/images/innovations/telemedical-device.jpg",
  },
  {
    numero: "06",
    code: "education",
    titre: "Éducation et formation",
    texte: "Simulateurs et kits pédagogiques pour apprendre les métiers techniques.",
    image: "/images/ciat-depot-innovation.jpg",
  },
  {
    numero: "07",
    code: "collectivites",
    titre: "Collectivités et entrepreneuriat",
    texte: "Services aux communes et création d'entreprises.",
    image: "/images/auth-incubateur.jpg",
  },
];

const EXEMPLES: Record<string, string> = {
  "01": "SunuAgri AI, guichet unique communal.",
  "02": "Pièces de rechange usinées, presse à huile compacte.",
  "03": "Pompage solaire connecté, séchoir hybride.",
  "04": "Mini-réseau SunuGrid, remorque frigorifique solaire.",
  "05": "Valise de télédiagnostic, incubateur néonatal.",
  "06": "Kit robotique pour lycées, simulateur de soudure.",
  "07": "Collecte des déchets connectée, taxes de marché numériques.",
};

export default function DomainesPage() {
  return (
    <>
      <PageHero image="/images/ciat-hero-electronique.jpg" title="Nos domaines" subtitle="Les projets accompagnés par le CIAT relèvent de sept domaines." />
    <div className="mx-auto w-full max-w-7xl px-4 py-16 sm:px-6 md:py-24 lg:px-8">

      <div className="grid gap-x-10 gap-y-14 sm:grid-cols-2 lg:grid-cols-3">
        {DOMAINES.map((d) => (
          <article key={d.numero} id={`domaine-${d.numero}`} className="scroll-mt-24">
            <div className="relative aspect-[4/3] overflow-hidden rounded-2xl bg-bordure">
              <Image
                src={d.image}
                alt=""
                fill
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                className="object-cover"
              />
            </div>
            <h2 className="mt-4 text-[15px] font-semibold">{d.titre}</h2>
            <p className="mt-1.5 text-sm leading-relaxed text-texte-doux">{d.texte}</p>
            <p className="mt-1.5 text-[13px] text-texte-doux">
              <span className="font-medium text-texte">Exemples :</span> {EXEMPLES[d.numero]}
            </p>
            <Link
              href={`/galerie?domaine=${d.code}`}
              className="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold text-brun hover:underline"
            >
              Voir les projets <ArrowRight size={15} />
            </Link>
          </article>
        ))}
      </div>
    </div>
    </>
  );
}
