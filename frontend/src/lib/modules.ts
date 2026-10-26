/** Les six modules de la plateforme. Une seule source : la navigation et l'accueil s'en servent. */
export type ModuleInfo = {
  slug: string;
  href: string;
  titre: string;
  description: string;
};

export const MODULES: ModuleInfo[] = [
  {
    slug: "documents",
    href: "/documents",
    titre: "Générateur de documents",
    description:
      "Choisir un modèle, donner le sujet : l'IA rédige le document avec la charte de l'ISEP, prêt à valider et à exporter.",
  },
  {
    slug: "incubateur",
    href: "/incubateur",
    titre: "Gestion de l'incubateur",
    description: "Dossiers, évaluation, comité, mentors, jalons et suivi des projets incubés.",
  },
  {
    slug: "portail",
    href: "/portail",
    titre: "Portail du CIAT",
    description: "Actualités, événements, appels à projets et candidatures.",
  },
  {
    slug: "tableau-de-bord",
    href: "/tableau-de-bord",
    titre: "Tableau de bord",
    description: "Indicateurs et analyses pour piloter les activités du CIAT.",
  },
  {
    slug: "assistant",
    href: "/assistant",
    titre: "Assistant IA",
    description: "Orientation des porteurs de projets à partir des documents du CIAT, avec les sources.",
  },
  {
    slug: "galerie",
    href: "/galerie",
    titre: "Galerie des innovations",
    description: "Les prototypes et les équipes issus du CIAT.",
  },
];
