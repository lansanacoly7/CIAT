"use client";

import Image from "next/image";
import { useMemo, useState } from "react";
import "./galerie.css";

const styles: Record<string, string> = new Proxy(
  {},
  {
    get: (_target, prop: string) => prop,
  }
);

type Project = {
  id: string;
  title: string;
  category: string;
  summary: string;
  team: string;
  cohort: string;
  status: string;
  image: string;
  alt: string;
  detail: string;
};

const projects: Project[] = [
  {
    id: "agritech",
    title: "AgriTech Smart",
    category: "Agriculture",
    summary:
      "Une solution connectée pour suivre les cultures et améliorer les décisions agricoles.",
    team: "GreenTech",
    cohort: "2026",
    status: "Prototype",
    image: "/images/gallery_agro.jpg",
    alt: "Solution technologique dans un environnement agricole",
    detail:
      "AgriTech Smart explore l'utilisation de capteurs et d'outils numériques pour aider les producteurs à observer les cultures et à mieux suivre les conditions du terrain.",
  },
  {
    id: "dataciat",
    title: "DataCIAT",
    category: "Numérique",
    summary:
      "Un tableau de bord pour analyser les données et suivre les projets incubés.",
    team: "DigitalLab",
    cohort: "2026",
    status: "Application",
    image: "/images/ciat_atelier.jpg",
    alt: "Équipe travaillant sur un projet numérique",
    detail:
      "DataCIAT vise à structurer les informations, suivre l'avancement des projets et faciliter la prise de décision au sein de l'incubateur.",
  },
  {
    id: "medilab",
    title: "MediLab",
    category: "Santé",
    summary:
      "Un dispositif connecté destiné à faciliter le suivi de certaines informations de santé.",
    team: "HealthLab",
    cohort: "2026",
    status: "Prototype",
    image: "/images/gallery_med.jpg",
    alt: "Dispositif technologique destiné au domaine médical",
    detail:
      "MediLab représente une piste d'innovation dans les technologies de santé. Les usages et performances doivent être validés par l'équipe porteuse avant publication définitive.",
  },
  {
    id: "sunbox",
    title: "SunBox",
    category: "Énergie",
    summary:
      "Une solution solaire compacte destinée aux besoins énergétiques des territoires.",
    team: "SunTech",
    cohort: "2026",
    status: "Prototype",
    image: "/images/ciat_solardryer.jpg",
    alt: "Prototype utilisant l'énergie solaire",
    detail:
      "SunBox explore la valorisation de l'énergie solaire pour des usages locaux. Les caractéristiques techniques et les performances restent à confirmer par l'équipe.",
  },
  {
    id: "pitch-day",
    title: "Pitch Day CIAT",
    category: "Événements",
    summary:
      "Une rencontre consacrée à la présentation des projets et des avancées des équipes.",
    team: "Communauté CIAT",
    cohort: "2026",
    status: "Événement",
    image: "/images/gallery_award.jpg",
    alt: "Équipe de porteurs de projets lors d'une présentation",
    detail:
      "Le Pitch Day permet aux porteurs de projets de présenter leurs idées, de recueillir des retours et de rencontrer des acteurs de l'écosystème d'innovation.",
  },
  {
    id: "forum",
    title: "Forum Innovation",
    category: "Événements",
    summary:
      "Un rendez-vous pour découvrir des prototypes et rencontrer des partenaires.",
    team: "Réseau CIAT",
    cohort: "2026",
    status: "Événement",
    image: "/images/ciat_forum.jpg",
    alt: "Espace de présentation consacré à l'innovation",
    detail:
      "Le Forum Innovation favorise les échanges entre porteurs de projets, partenaires et visiteurs intéressés par les solutions développées dans l'écosystème CIAT.",
  },
];

const categories = [
  "Tous",
  "Agriculture",
  "Numérique",
  "Santé",
  "Énergie",
  "Événements",
] as const;

type SortOption = "featured" | "az" | "za";

export default function GalerieProjets() {
  const [activeCategory, setActiveCategory] = useState<string>("Tous");
  const [query, setQuery] = useState("");
  const [sortOrder, setSortOrder] =
    useState<SortOption>("featured");
  const [selectedProject, setSelectedProject] =
    useState<Project | null>(null);

  const visibleProjects = useMemo(() => {
    const search = query.trim().toLocaleLowerCase("fr");

    const filtered = projects.filter((project) => {
      const matchesCategory =
        activeCategory === "Tous" ||
        project.category === activeCategory;

      const searchableText = [
        project.title,
        project.category,
        project.summary,
        project.team,
        project.status,
      ]
        .join(" ")
        .toLocaleLowerCase("fr");

      const matchesSearch =
        search === "" || searchableText.includes(search);

      return matchesCategory && matchesSearch;
    });

    if (sortOrder === "az") {
      return [...filtered].sort((a, b) =>
        a.title.localeCompare(b.title, "fr")
      );
    }

    if (sortOrder === "za") {
      return [...filtered].sort((a, b) =>
        b.title.localeCompare(a.title, "fr")
      );
    }

    return filtered;
  }, [activeCategory, query, sortOrder]);

  return (
    <div className={styles.pageRoot}>
      <main className={styles.galleryPage}>
        {/* INTRODUCTION */}

        <section className={styles.hero}>
          <div className={styles.heroCopy}>
            <p className={styles.eyebrow}>
              Galerie des innovations
            </p>

            <h1>
              Nos projets,
              <br />
              <span>leurs impacts</span>
            </h1>

            <p className={styles.heroDescription}>
              Découvrez les prototypes, les solutions et les
              initiatives portés par les équipes accompagnées
              par le CIAT. Une vitrine du talent et de
              l&apos;innovation au service du territoire.
            </p>

            <p className={styles.heroSignature}>
              Des idées d&apos;aujourd&apos;hui
              <br />
              aux solutions de demain.
            </p>
          </div>

          <div className={styles.heroVisual}>
            <Image
              src="/images/ciat_hero_gallery.jpg"
              alt="Espace de présentation des innovations du CIAT"
              fill
              priority
              sizes="(max-width: 760px) 100vw, 52vw"
            />
          </div>
        </section>

        {/* GALERIE */}

        <section
          className={styles.projectsSection}
          id="projets"
        >
          <div className={styles.sectionHeading}>
            <div>
              <p className={styles.eyebrow}>
                La vitrine du CIAT
              </p>

              <h2>
                Des solutions qui prennent forme
              </h2>
            </div>

            <p className={styles.sectionIntro}>
              Parcourez les projets, découvrez les équipes
              et suivez les étapes de leur évolution.
            </p>
          </div>

          {/* RECHERCHE ET TRI */}

          <div className={styles.controls}>
            <label className={styles.searchField}>
              <span className={styles.visuallyHidden}>
                Rechercher un projet
              </span>

              <input
                type="search"
                value={query}
                onChange={(event) =>
                  setQuery(event.target.value)
                }
                placeholder="Rechercher un projet, une équipe, un mot-clé..."
              />
            </label>

            <label className={styles.sortField}>
              <span>Trier par</span>

              <select
                value={sortOrder}
                onChange={(event) =>
                  setSortOrder(
                    event.target.value as SortOption
                  )
                }
              >
                <option value="featured">
                  Sélection CIAT
                </option>
                <option value="az">
                  Nom du projet (A–Z)
                </option>
                <option value="za">
                  Nom du projet (Z–A)
                </option>
              </select>
            </label>
          </div>

          {/* FILTRES */}

          <div
            className={styles.filters}
            role="group"
            aria-label="Filtrer les projets par domaine"
          >
            {categories.map((category) => (
              <button
                key={category}
                type="button"
                aria-pressed={activeCategory === category}
                className={[
                  styles.filterButton,
                  activeCategory === category
                    ? styles.filterButtonActive
                    : "",
                ].join(" ")}
                onClick={() =>
                  setActiveCategory(category)
                }
              >
                {category}
              </button>
            ))}
          </div>

          <p
            className={styles.resultsCount}
            aria-live="polite"
          >
            {visibleProjects.length}{" "}
            {visibleProjects.length > 1
              ? "projets présentés"
              : "projet présenté"}
          </p>

          {/* CARTES DES PROJETS */}

          {visibleProjects.length > 0 ? (
            <div className={styles.projectGrid}>
              {visibleProjects.map((project, index) => (
                <article
                  className={styles.projectCard}
                  key={project.id}
                >
                  <button
                    type="button"
                    className={styles.projectImageButton}
                    onClick={() =>
                      setSelectedProject(project)
                    }
                    aria-label={`Découvrir ${project.title}`}
                  >
                    <Image
                      src={project.image}
                      alt={project.alt}
                      fill
                      sizes="(max-width: 620px) 100vw, (max-width: 900px) 50vw, 33vw"
                    />

                    <span className={styles.imageIndex}>
                      {String(index + 1).padStart(2, "0")}
                    </span>
                  </button>

                  <div className={styles.projectCardBody}>
                    <p className={styles.projectCategory}>
                      {project.category}
                    </p>

                    <h3>{project.title}</h3>

                    <p className={styles.projectSummary}>
                      {project.summary}
                    </p>

                    <div className={styles.projectMeta}>
                      <span>Équipe : {project.team}</span>
                      <span>{project.cohort}</span>
                    </div>

                    <div className={styles.projectCardFooter}>
                      <span className={styles.status}>
                        {project.status}
                      </span>

                      <button
                        type="button"
                        onClick={() =>
                          setSelectedProject(project)
                        }
                      >
                        Voir la fiche
                      </button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className={styles.emptyState}>
              <p className={styles.emptyTitle}>
                Aucun projet trouvé
              </p>

              <p>
                Modifiez votre recherche ou choisissez
                un autre domaine.
              </p>

              <button
                type="button"
                className={styles.resetButton}
                onClick={() => {
                  setQuery("");
                  setActiveCategory("Tous");
                }}
              >
                Réinitialiser les filtres
              </button>
            </div>
          )}
        </section>

        {/* BANDEAU FINAL */}

        <section className={styles.featureBanner}>
          <div className={styles.featureCopy}>
            <p className={styles.eyebrow}>
              L&apos;innovation en action
            </p>

            <h2>
              Des projets concrets,
              portés par des talents.
            </h2>

            <p>
              Le CIAT accompagne les équipes qui
              transforment des idées en solutions utiles,
              durables et adaptées aux réalités du territoire.
            </p>

            <a
              href="#projets"
              className={styles.featureLink}
            >
              Explorer les projets
            </a>
          </div>

          <div className={styles.featureVisual}>
            <Image
              src="/images/gallery_showroom.jpg"
              alt="Espace de valorisation des innovations du CIAT"
              fill
              sizes="(max-width: 760px) 100vw, 45vw"
            />
          </div>
        </section>
      </main>

      {/* FICHE DÉTAILLÉE */}

      {selectedProject && (
        <div
          className={styles.modalBackdrop}
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setSelectedProject(null);
            }
          }}
        >
          <section
            className={styles.projectModal}
            role="dialog"
            aria-modal="true"
            aria-labelledby="modal-title"
          >
            <p className={styles.eyebrow}>
              {selectedProject.category}
            </p>

            <h2 id="modal-title">
              {selectedProject.title}
            </h2>

            <p className={styles.modalSummary}>
              {selectedProject.detail}
            </p>

            <dl className={styles.modalMeta}>
              <div>
                <dt>Équipe</dt>
                <dd>{selectedProject.team}</dd>
              </div>

              <div>
                <dt>Cohorte</dt>
                <dd>{selectedProject.cohort}</dd>
              </div>

              <div>
                <dt>Statut</dt>
                <dd>{selectedProject.status}</dd>
              </div>
            </dl>

            <button
              className={styles.modalClose}
              type="button"
              onClick={() => setSelectedProject(null)}
            >
              Fermer la fiche
            </button>

            <p className={styles.modalNote}>
              Les projets et leurs informations sont des
              exemples de démonstration. Remplacez-les par
              les données validées du CIAT avant publication.
            </p>
          </section>
        </div>
      )}
    </div>
  );
}
