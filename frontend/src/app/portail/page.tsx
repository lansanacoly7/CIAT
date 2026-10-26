import Link from "next/link";
import { Badge, ButtonLink, Card, PageTitle } from "@/components/ui";

export const metadata = {
  title: "Portail Institutionnel",
  description:
    "Portail officiel du Centre d'Innovation, d'Application et de Transfert (CIAT) de l'ISEP Amadou Trawaré de Diamniadio.",
};

const SECTIONS_PORTAIL = [
  {
    href: "/portail/ciat",
    tag: "Institution",
    titre: "Le CIAT & Sa Mission",
    description:
      "Histoire, ancrage à l'ISEP Diamniadio, les 4 piliers de la marque et les 3 missions fondamentales de transfert technologique.",
    cta: "Découvrir le centre",
  },
  {
    href: "/portail/incubateur",
    tag: "Incubation",
    titre: "L'Incubateur & Le Parcours",
    description:
      "Le parcours en 5 étapes réelles : dépôt de dossier, comité de sélection, mentorat, prototypage et mise en relation partenariale.",
    cta: "Comprendre le parcours",
  },
  {
    href: "/portail/domaines",
    tag: "Filières",
    titre: "Les 7 Domaines Prioritaires",
    description:
      "Les filières stratégiques fixées par le cahier des charges officiel : TIC & IA, Mécanique, Agriculture, Énergies, Santé, Éducation, Services.",
    cta: "Explorer les domaines",
  },
  {
    href: "/portail/actualites",
    tag: "Information",
    titre: "Actualités & Publications",
    description:
      "Suivez les temps forts, les annonces officielles, les partenariats et les réalisations technologiques du CIAT.",
    cta: "Lire les actualités",
  },
  {
    href: "/portail/evenements",
    tag: "Agenda",
    titre: "Événements & Démonstrations",
    description:
      "Calendrier des journées portes ouvertes, jurys d'évaluation, séminaires techniques et ateliers organisés à Diamniadio.",
    cta: "Consulter l'agenda",
  },
  {
    href: "/portail/appels",
    tag: "Sélections",
    titre: "Appels à Projets & Candidatures",
    description:
      "Consultez les appels ouverts, les dates limites de soumission et les pièces obligatoires pour candidater à l'incubateur.",
    cta: "Voir les appels ouverts",
  },
  {
    href: "/portail/projets",
    tag: "Innovations",
    titre: "Annuaire des Projets Incubés",
    description:
      "Moteur de recherche et fiches détaillées des projets, prototypes et innovations accompagnés par l'incubateur.",
    cta: "Explorer l'annuaire",
  },
  {
    href: "/portail/partenaires",
    tag: "Réseau",
    titre: "Nos Partenaires Stratégiques",
    description:
      "Institutions régaliennes, bailleurs de fonds, universités et industriels engagés dans l'écosystème CIAT.",
    cta: "Découvrir les partenaires",
  },
  {
    href: "/portail/documents",
    tag: "Ressources",
    titre: "Espace Documentaire Officiel",
    description:
      "Téléchargez les canevas de candidature, les règlements intérieurs, les chartes de PI et les guides de prototypage.",
    cta: "Accéder aux documents",
  },
  {
    href: "/portail/contact",
    tag: "Échanges",
    titre: "Contact & Secrétariat",
    description:
      "Formulaire officiel pour adresser vos questions, proposer un partenariat ou solliciter un accompagnement.",
    cta: "Nous contacter",
  },
];

// Données de cadrage préliminaires conformes à CONTRATS_API.md (en attente des endpoints de Pathé)
const APPELS_PREVIEW = [
  {
    id: 1,
    titre: "Appel à Projets Cohorte 2026 — Innovations Technologiques",
    date_limite: "15 Novembre 2026",
    statut: "ouvert" as const,
    description:
      "Ouvert aux apprenants et diplômés de l'ISEP de Diamniadio porteurs de projets dans l'une des 7 filières prioritaires.",
  },
  {
    id: 2,
    titre: "Programme Prototypage Rapide & Énergies Renouvelables",
    date_limite: "30 Décembre 2026",
    statut: "ouvert" as const,
    description:
      "Accompagnement intensif en atelier pour la réalisation de prototypes de bancs solaires et capteurs intelligents.",
  },
];

export default function PortailHubPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-10 md:py-16">
      <PageTitle
        tag="Module 1 · Portail Institutionnel"
        title="Portail Public du CIAT"
        subtitle="Vitrine officielle de l'innovation, des parcours d'accompagnement et des opportunités technologiques à l'ISEP Amadou Trawaré de Diamniadio."
      />

      {/* Cartes d'orientation principale vers les 3 pages de présentation (T1) */}
      <section className="mb-16">
        <h2 className="mb-6 text-xl font-bold text-brun md:text-2xl">
          Découvrir le CIAT et ses programmes
        </h2>

        <div className="grid gap-6 md:grid-cols-3">
          {SECTIONS_PORTAIL.map((sec, idx) => (
            <Card key={idx} className="flex h-full flex-col justify-between">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-beige">
                  {sec.tag}
                </span>
                <h3 className="mt-2 text-xl font-bold text-brun">{sec.titre}</h3>
                <p className="mt-3 text-sm leading-relaxed text-texte-doux">
                  {sec.description}
                </p>
              </div>

              <div className="mt-6 border-t border-bordure pt-4">
                <Link
                  href={sec.href}
                  className="inline-flex items-center text-sm font-bold text-brun hover:text-brun-fonce hover:underline"
                >
                  {sec.cta} →
                </Link>
              </div>
            </Card>
          ))}
        </div>
      </section>

      {/* Section Appels à Projets (Aperçu conforme aux contrats d'API) */}
      <section className="mb-16">
        <div className="mb-6 flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
          <div>
            <h2 className="text-xl font-bold text-brun md:text-2xl">
              Appels à Candidatures en cours
            </h2>
            <p className="mt-1 text-sm text-texte-doux">
              Participez aux sélections officielles pour intégrer les cohortes d&apos;incubation.
            </p>
          </div>
          <ButtonLink href="/connexion" variant="primary" className="shrink-0 text-xs">
            Déposer une candidature
          </ButtonLink>
        </div>

        <div className="space-y-4">
          {APPELS_PREVIEW.map((appel) => (
            <div
              key={appel.id}
              className="rounded-xl border border-bordure bg-white p-6 shadow-sm transition-colors hover:border-beige"
            >
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <div className="flex items-center gap-3">
                    <Badge tone="succes">Appel Ouvert</Badge>
                    <span className="text-xs text-texte-doux">
                      Date limite : <strong>{appel.date_limite}</strong>
                    </span>
                  </div>
                  <h3 className="mt-2 text-lg font-bold text-brun">{appel.titre}</h3>
                  <p className="mt-1 max-w-2xl text-sm text-texte-doux">{appel.description}</p>
                </div>

                <div className="shrink-0">
                  <ButtonLink href="/connexion" variant="secondary" className="w-full text-xs sm:w-auto">
                    Candidater
                  </ButtonLink>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Raccourci vers les autres modules de la plateforme unifiée */}
      <section className="rounded-2xl border border-bordure bg-ivoire p-8 md:p-10">
        <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div className="space-y-2">
            <h3 className="text-xl font-bold text-brun">
              Accès direct aux modules de la plateforme unifiée
            </h3>
            <p className="max-w-2xl text-sm text-texte-doux">
              La plateforme regroupe les 6 modules exigés : gestion de l&apos;incubateur, tableau
              décisionnel, assistant IA, générateur de documents et galerie des prototypes.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <ButtonLink href="/galerie" variant="primary">
              Voir la Galerie
            </ButtonLink>
            <ButtonLink href="/tableau-de-bord" variant="secondary">
              Tableau de Bord
            </ButtonLink>
          </div>
        </div>
      </section>
    </div>
  );
}
