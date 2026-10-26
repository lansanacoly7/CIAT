import Link from "next/link";
import { Badge, ButtonLink, Card, PageTitle } from "@/components/ui";

export const metadata = {
  title: "Portail Institutionnel",
  description:
    "Portail officiel du Centre d'Innovation, d'Application et de Transfert (CIAT) de l'ISEP Amadou Traoré de Diamniadio.",
};

const POLE_INSTITUTION = [
  {
    href: "/portail/ciat",
    tag: "Gouvernance & Vision",
    titre: "Le CIAT & Ses Missions",
    description:
      "Histoire, ancrage académique à l'ISEP Diamniadio, les 4 piliers de la marque et les 3 missions fondamentales de transfert technologique.",
    cta: "Découvrir le centre",
    badge: "Ancrage ISEP",
  },
  {
    href: "/portail/incubateur",
    tag: "Méthodologie",
    titre: "L'Incubateur & Le Parcours",
    description:
      "Le parcours contractuel en 5 étapes réelles : dépôt de dossier, comité de sélection, mentorat, prototypage et mise en relation partenariale.",
    cta: "Comprendre le parcours",
    badge: "5 Jalons Formels",
  },
  {
    href: "/portail/domaines",
    tag: "Filières Prioritaires",
    titre: "Les 7 Domaines Stratégiques",
    description:
      "Les filières stratégiques fixées par le cahier des charges officiel : TIC & IA, Mécanique, Agriculture, Énergies, Santé, Éducation, Services.",
    cta: "Explorer les domaines",
    badge: "Cahier des charges",
  },
];

const POLE_DYNAMIQUE = [
  {
    href: "/portail/appels",
    tag: "Candidatures & Sélections",
    titre: "Appels à Projets & Cohortes",
    description:
      "Consultez les appels ouverts, les dates limites de soumission et les critères d'admissibilité pour intégrer l'incubateur.",
    cta: "Voir les appels ouverts",
    badge: "Cohorte 2026 Active",
  },
  {
    href: "/portail/actualites",
    tag: "Information Officielle",
    titre: "Actualités & Publications",
    description:
      "Suivez les temps forts, les annonces officielles, les signatures de conventions et les réalisations technologiques du centre.",
    cta: "Lire les actualités",
    badge: "Flux dynamique",
  },
  {
    href: "/portail/evenements",
    tag: "Agenda & Événements",
    titre: "Agenda & Démonstrations",
    description:
      "Calendrier des journées de sélection, comités d'évaluation, hackathons, masterclasses et ateliers organisés à Diamniadio.",
    cta: "Consulter l'agenda",
    badge: "Événements ISEP",
  },
];

const POLE_REALISATIONS = [
  {
    href: "/portail/projets",
    tag: "Innovations & Prototypes",
    titre: "Annuaire des Projets Incubés",
    description:
      "Moteur de recherche multicritère et fiches détaillées des projets et prototypes accompagnés dans les 7 filières.",
    cta: "Explorer l'annuaire",
    badge: "62 Projets Réels",
  },
  {
    href: "/portail/partenaires",
    tag: "Réseau Institutionnel",
    titre: "Nos Partenaires Stratégiques",
    description:
      "Institutions régaliennes, bailleurs de fonds, universités et industriels engagés dans l'écosystème du CIAT.",
    cta: "Découvrir les partenaires",
    badge: "Écosystème National",
  },
  {
    href: "/portail/documents",
    tag: "Ressources Publiques",
    titre: "Espace Documentaire Officiel",
    description:
      "Téléchargez les canevas de candidature, les règlements intérieurs, les chartes de PI et les guides de prototypage.",
    cta: "Télécharger les documents",
    badge: "Canevas PDF Types",
  },
  {
    href: "/portail/contact",
    tag: "Échanges & Permanence",
    titre: "Contact & Secrétariat",
    description:
      "Formulaire officiel pour adresser vos questions, proposer un partenariat industriel ou solliciter un accompagnement.",
    cta: "Contacter le CIAT",
    badge: "Bureau Diamniadio",
  },
];

export default function PortailHubPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-10 md:py-16">
      {/* En-tête officiel avec Plus Jakarta Sans */}
      <PageTitle
        tag="Module P1 · Portail Institutionnel"
        title="Portail Public du CIAT"
        subtitle="Vitrine officielle de l'innovation, des parcours d'accompagnement méthodique et des opportunités technologiques à l'ISEP Amadou Traoré de Diamniadio."
      />

      {/* Bandeau d'Indicateurs Structurants du Portail */}
      <div className="mb-12 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div className="rounded-xl border border-bordure bg-ivoire p-4">
          <span className="block text-2xl font-extrabold text-brun">10</span>
          <span className="mt-1 block text-xs font-semibold text-texte-doux">
            Rubriques Institutionnelles Publiques
          </span>
        </div>
        <div className="rounded-xl border border-bordure bg-ivoire p-4">
          <span className="block text-2xl font-extrabold text-brun">7</span>
          <span className="mt-1 block text-xs font-semibold text-texte-doux">
            Filières Technologiques Prioritaires
          </span>
        </div>
        <div className="rounded-xl border border-bordure bg-ivoire p-4">
          <span className="block text-2xl font-extrabold text-brun">5</span>
          <span className="mt-1 block text-xs font-semibold text-texte-doux">
            Jalons Contractuels d&apos;Incubation
          </span>
        </div>
        <div className="rounded-xl border border-bordure bg-ivoire p-4">
          <span className="block text-2xl font-extrabold text-brun">360°</span>
          <span className="mt-1 block text-xs font-semibold text-texte-doux">
            Accompagnement Idée → Transfert
          </span>
        </div>
      </div>

      {/* PÔLE 1 : INSTITUTION & CADRE STRATÉGIQUE */}
      <section className="mb-14">
        <div className="mb-6 flex flex-col justify-between gap-2 border-b border-bordure/60 pb-3 sm:flex-row sm:items-end">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-beige">
              Pôle 01 · Cadre Fondateur
            </span>
            <h2 className="text-xl font-bold text-brun sm:text-2xl">
              Institution, Vision &amp; Filières Stratégiques
            </h2>
          </div>
          <span className="text-xs text-texte-doux">
            Ancrage académique et missions officielles
          </span>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {POLE_INSTITUTION.map((sec, idx) => (
            <Card key={idx} className="flex h-full flex-col justify-between transition-all duration-200 hover:-translate-y-1 hover:border-beige hover:shadow-md">
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-beige">
                    {sec.tag}
                  </span>
                  <span className="rounded bg-white px-2 py-0.5 text-[10px] font-bold text-brun border border-bordure">
                    {sec.badge}
                  </span>
                </div>
                <h3 className="mt-3 text-lg font-bold text-brun">{sec.titre}</h3>
                <p className="mt-2 text-sm leading-relaxed text-texte-doux">
                  {sec.description}
                </p>
              </div>

              <div className="mt-6 border-t border-bordure pt-4">
                <Link
                  href={sec.href}
                  className="inline-flex min-h-[44px] items-center text-sm font-bold text-brun hover:text-beige transition-colors"
                >
                  {sec.cta} →
                </Link>
              </div>
            </Card>
          ))}
        </div>
      </section>

      {/* PÔLE 2 : SÉLECTIONS, AGENDA & ACTUALITÉS */}
      <section className="mb-14">
        <div className="mb-6 flex flex-col justify-between gap-2 border-b border-bordure/60 pb-3 sm:flex-row sm:items-end">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-beige">
              Pôle 02 · Vie du Centre
            </span>
            <h2 className="text-xl font-bold text-brun sm:text-2xl">
              Candidatures, Événements &amp; Publications
            </h2>
          </div>
          <span className="text-xs text-texte-doux">
            Rythme des cohortes et diffusion technologique
          </span>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {POLE_DYNAMIQUE.map((sec, idx) => (
            <Card key={idx} className="flex h-full flex-col justify-between transition-all duration-200 hover:-translate-y-1 hover:border-beige hover:shadow-md">
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-beige">
                    {sec.tag}
                  </span>
                  <span className="rounded bg-white px-2 py-0.5 text-[10px] font-bold text-brun border border-bordure">
                    {sec.badge}
                  </span>
                </div>
                <h3 className="mt-3 text-lg font-bold text-brun">{sec.titre}</h3>
                <p className="mt-2 text-sm leading-relaxed text-texte-doux">
                  {sec.description}
                </p>
              </div>

              <div className="mt-6 border-t border-bordure pt-4">
                <Link
                  href={sec.href}
                  className="inline-flex min-h-[44px] items-center text-sm font-bold text-brun hover:text-beige transition-colors"
                >
                  {sec.cta} →
                </Link>
              </div>
            </Card>
          ))}
        </div>
      </section>

      {/* PÔLE 3 : RÉALISATIONS, ÉCOSYSTÈME & RESSOURCES */}
      <section className="mb-14">
        <div className="mb-6 flex flex-col justify-between gap-2 border-b border-bordure/60 pb-3 sm:flex-row sm:items-end">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-beige">
              Pôle 03 · Écosystème &amp; Réalisations
            </span>
            <h2 className="text-xl font-bold text-brun sm:text-2xl">
              Projets Incubés, Réseau &amp; Espace Documentaire
            </h2>
          </div>
          <span className="text-xs text-texte-doux">
            Résultats tangibles et ressources officielles
          </span>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {POLE_REALISATIONS.map((sec, idx) => (
            <Card key={idx} className="flex h-full flex-col justify-between transition-all duration-200 hover:-translate-y-1 hover:border-beige hover:shadow-md">
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-beige">
                    {sec.tag}
                  </span>
                </div>
                <h3 className="mt-3 text-base font-bold text-brun">{sec.titre}</h3>
                <p className="mt-2 text-xs leading-relaxed text-texte-doux">
                  {sec.description}
                </p>
              </div>

              <div className="mt-6 border-t border-bordure pt-3">
                <span className="mb-2 block text-[10px] font-semibold text-beige">
                  {sec.badge}
                </span>
                <Link
                  href={sec.href}
                  className="inline-flex min-h-[44px] items-center text-xs font-bold text-brun hover:text-beige transition-colors"
                >
                  {sec.cta} →
                </Link>
              </div>
            </Card>
          ))}
        </div>
      </section>

      {/* MISE EN AVANT DE L'APPEL EN COURS & CANDIDATURE */}
      <section className="mb-14 overflow-hidden rounded-2xl border border-bordure bg-white shadow-sm">
        <div className="border-b border-bordure bg-ivoire px-6 py-4 sm:flex sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <Badge tone="succes">Appel Ouvert · Cohorte 2026</Badge>
            <span className="text-xs font-medium text-texte-doux">
              Sélection officielle ISEP Diamniadio
            </span>
          </div>
          <span className="mt-2 block text-xs font-bold text-brun sm:mt-0">
            Date limite : 15 Novembre 2026
          </span>
        </div>

        <div className="p-6 sm:p-8">
          <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div className="space-y-2">
              <h3 className="text-xl font-bold text-brun">
                Appel à Projets Technologiques &amp; Prototypage
              </h3>
              <p className="max-w-2xl text-sm leading-relaxed text-texte-doux">
                Destiné aux apprenants et diplômés de l&apos;ISEP de Diamniadio. Bénéficiez d&apos;ateliers
                de prototypage, de l&apos;encadrement de mentors industriels et d&apos;un accès aux laboratoires spécialisés.
              </p>
            </div>

            <div className="flex flex-wrap gap-3 shrink-0">
              <ButtonLink href="/connexion?next=/incubateur" variant="primary" className="text-xs">
                Déposer un Dossier en Ligne
              </ButtonLink>
              <ButtonLink href="/portail/appels" variant="secondary" className="text-xs">
                Consulter les Critères
              </ButtonLink>
            </div>
          </div>
        </div>
      </section>

      {/* PASSERELLE VERS LES AUTRES MODULES CIAT 360 */}
      <section className="rounded-2xl border border-beige/40 bg-gradient-to-r from-brun to-brun-fonce p-8 text-white md:p-10 shadow-lg">
        <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 rounded-full border border-beige/40 bg-white/10 px-3 py-1 text-xs font-bold text-beige">
              Écosystème CIAT 360
            </div>
            <h3 className="text-2xl font-extrabold !text-white">
              Accédez aux autres modules de la plateforme unifiée
            </h3>
            <p className="max-w-2xl text-sm text-[#ebd9c0] leading-relaxed">
              La plateforme regroupe les 6 modules intégrés : gestion de l&apos;incubateur, tableau
              décisionnel, assistant IA, générateur de documents et showroom public des innovations.
            </p>
          </div>
          <div className="flex flex-wrap gap-3 shrink-0">
            <ButtonLink href="/galerie" variant="accent" className="text-sm font-bold">
              Galerie des Innovations
            </ButtonLink>
            <ButtonLink
              href="/tableau-de-bord"
              variant="secondary"
              className="!border-white !text-white hover:!bg-white/10 text-sm"
            >
              Tableau de Bord
            </ButtonLink>
          </div>
        </div>
      </section>
    </div>
  );
}

