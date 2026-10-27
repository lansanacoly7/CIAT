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
  categoryClass: string;
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
    categoryClass: "categoryAgri",
    summary:
      "Une solution connectée pour suivre les cultures et améliorer les décisions agricoles en temps réel grâce à l'IoT.",
    team: "GreenTech",
    cohort: "2026",
    status: "Prototype validé",
    image: "/images/gallery_agro.jpg",
    alt: "Solution technologique dans un environnement agricole",
    detail:
      "AgriTech Smart exploite un réseau de capteurs autonomes et une station météo intelligente pour surveiller l'humidité des sols, optimiser l'irrigation au goutte-à-goutte et anticiper les risques sanitaires des cultures maraîchères de la région des Niayes.",
  },
  {
    id: "dataciat",
    title: "DataCIAT",
    category: "Numérique",
    categoryClass: "categoryNum",
    summary:
      "Un tableau de bord intelligent pour agréger les données, monitorer les prototypes et piloter les incubés du CIAT.",
    team: "DigitalLab",
    cohort: "2026",
    status: "Application opérationnelle",
    image: "/images/ciat_atelier.jpg",
    alt: "Équipe travaillant sur un projet numérique",
    detail:
      "DataCIAT centralise la télémétrie des ateliers techniques, le suivi d'avancement des brevets et fournit aux partenaires industriels un canal transparent d'homologation et de valorisation des technologies conçues à l'ISEP Diamniadio.",
  },
  {
    id: "medilab",
    title: "MediLab",
    category: "Santé",
    categoryClass: "categorySante",
    summary:
      "Un dispositif biomédical connecté facilitant le diagnostic rapide et la transmission des constantes en zones rurales.",
    team: "HealthLab",
    cohort: "2026",
    status: "En phase de test clinique",
    image: "/images/gallery_med.jpg",
    alt: "Dispositif technologique destiné au domaine médical",
    detail:
      "MediLab répond à la problématique des postes de santé isolés grâce à une valise de télémédecine compacte, capable d'enregistrer les paramètres vitaux essentiels et d'émettre des alertes automatisées vers les hôpitaux de référence.",
  },
  {
    id: "sunbox",
    title: "SunBox",
    category: "Énergie",
    categoryClass: "categoryEnergie",
    summary:
      "Une station solaire compacte et thermodynamique répondant aux exigences énergétiques des micro-entreprises locales.",
    team: "SunTech",
    cohort: "2026",
    status: "Prototype validé",
    image: "/images/ciat_solardryer.jpg",
    alt: "Prototype utilisant l'énergie solaire",
    detail:
      "SunBox propose un système modulaire combinant production photovoltaïque à haut rendement et séchoir solaire thermodynamique hybride, garantissant la conservation optimale des récoltes fruitières et halieutiques sans coupure.",
  },
  {
    id: "pitch-day",
    title: "Pitch Day CIAT",
    category: "Événements",
    categoryClass: "categoryEvents",
    summary:
      "La grande rencontre annuelle consacrée à la présentation des innovations devant investisseurs et industriels.",
    team: "Communauté CIAT",
    cohort: "2026",
    status: "Événement officiel",
    image: "/images/gallery_award.jpg",
    alt: "Équipe de porteurs de projets lors d'une présentation",
    detail:
      "Le Pitch Day réunit créateurs de technologies, dirigeants d'entreprises partenaires, banques de développement et fonds d'impact. Il offre un tremplin direct pour financer les préséries industrielles et valider les modèles de transfert.",
  },
  {
    id: "forum",
    title: "Forum Innovation",
    category: "Événements",
    categoryClass: "categoryEvents",
    summary:
      "Un carrefour d'échange technologique pour découvrir les prototypes, échanger avec les inventeurs et nouer des partenariats.",
    team: "Réseau CIAT",
    cohort: "2026",
    status: "Événement annuel",
    image: "/images/ciat_forum.jpg",
    alt: "Espace de présentation consacré à l'innovation",
    detail:
      "Le Forum Innovation du CIAT rassemble l'ensemble des acteurs de l'écosystème d'innovation sénégalais autour de démonstrations en direct au FabLab, d'ateliers d'ingénierie inversée et de tables rondes d'industrialisation locale.",
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
  const [sortOrder, setSortOrder] = useState<SortOption>("featured");
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);

  // État du formulaire "Je suis intéressé"
  const [interetProject, setInteretProject] = useState<Project | null>(null);
  const [formNom, setFormNom] = useState("");
  const [formEmail, setFormEmail] = useState("");
  const [formTel, setFormTel] = useState("");
  const [formOrg, setFormOrg] = useState("");
  const [formType, setFormType] = useState("Partenariat & Déploiement");
  const [formMessage, setFormMessage] = useState("");
  const [formSuccess, setFormSuccess] = useState(false);
  const [formSubmitting, setFormSubmitting] = useState(false);

  const visibleProjects = useMemo(() => {
    const search = query.trim().toLocaleLowerCase("fr");

    const filtered = projects.filter((project) => {
      const matchesCategory =
        activeCategory === "Tous" || project.category === activeCategory;

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

  const handleOpenInteret = (project: Project) => {
    setInteretProject(project);
    setFormSuccess(false);
  };

  const handleInteretSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormSubmitting(true);
    setTimeout(() => {
      setFormSubmitting(false);
      setFormSuccess(true);
    }, 600);
  };

  return (
    <div className={styles.pageRoot}>
      <main className={styles.galleryPage}>
        {/* ========================================================= */}
        {/* HERO CINÉMATIQUE HAUT DE GAMME PLEIN FORMAT               */}
        {/* ========================================================= */}
        <section className={styles.heroCinematic}>
          <div className={styles.heroImageBg}>
            <Image
              src="/images/ciat_hero_gallery.jpg"
              alt="Espace d'exposition des innovations et prototypes du CIAT"
              fill
              priority
              sizes="100vw"
            />
          </div>

          <div className={styles.heroOverlay} />

          <div className={styles.heroContainer}>
            <div className={styles.heroContent}>
              <div className={styles.heroBadge}>
                <span className={styles.heroBadgeDot} />
                <span>Vitrine technologique & Innovation CIAT</span>
              </div>

              <h1 className={styles.heroTitle}>
                Nos projets,
                <br />
                <span>leurs impacts</span>
              </h1>

              <p className={styles.heroDescription}>
                Découvrez les prototypes, solutions d&apos;ingénierie et initiatives
                technologiques développés au sein du CIAT. Une vitrine
                d&apos;excellence et de savoir-faire au service de l&apos;industrialisation
                et du territoire.
              </p>

              <div className={styles.heroPills}>
                <span className={styles.heroPillItem}>
                  ✓ 6 Innovations phares
                </span>
                <span className={styles.heroPillItem}>
                  ✓ 5 Domaines d&apos;ingénierie
                </span>
                <span className={styles.heroPillItem}>
                  ✓ Cohorte 2026 • ISEP Diamniadio
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* ========================================================= */}
        {/* SECTION CATALOGUE & PROJETS                               */}
        {/* ========================================================= */}
        <section className={styles.projectsSection} id="projets">
          <div className={styles.sectionHeading}>
            <div>
              <p className={styles.eyebrow}>Catalogue d&apos;excellence</p>
              <h2>Des innovations prêtes pour le transfert</h2>
            </div>

            <p className={styles.sectionIntro}>
              Explorez les fiches techniques, découvrez les équipes porteuses
              et manifestez votre intérêt pour un partenariat ou un déploiement pilote.
            </p>
          </div>

          {/* CONTRÔLES : RECHERCHE ET TRI */}
          <div className={styles.controls}>
            <label className={styles.searchField}>
              <span className={styles.visuallyHidden}>
                Rechercher une innovation ou une équipe
              </span>
              <input
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Rechercher un projet, une équipe, un mot-clé (ex: IoT, Solaire, Santé)..."
              />
            </label>

            <label className={styles.sortField}>
              <span>Trier par</span>
              <select
                value={sortOrder}
                onChange={(event) =>
                  setSortOrder(event.target.value as SortOption)
                }
              >
                <option value="featured">Sélection officielle CIAT</option>
                <option value="az">Nom du projet (A – Z)</option>
                <option value="za">Nom du projet (Z – A)</option>
              </select>
            </label>
          </div>

          {/* FILTRES PAR CATÉGORIES */}
          <div
            className={styles.filters}
            role="group"
            aria-label="Filtrer les projets par domaine technologique"
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
                onClick={() => setActiveCategory(category)}
              >
                {category}
              </button>
            ))}
          </div>

          <p className={styles.resultsCount} aria-live="polite">
            {visibleProjects.length}{" "}
            {visibleProjects.length > 1
              ? "innovations certifiées"
              : "innovation certifiée"}
          </p>

          {/* CARTES DES PROJETS */}
          {visibleProjects.length > 0 ? (
            <div className={styles.projectGrid}>
              {visibleProjects.map((project, index) => (
                <article className={styles.projectCard} key={project.id}>
                  {/* Visuel & Badges */}
                  <div className={styles.cardMedia}>
                    <Image
                      src={project.image}
                      alt={project.alt}
                      fill
                      sizes="(max-width: 640px) 100vw, (max-width: 992px) 50vw, 33vw"
                    />

                    <span
                      className={[
                        styles.cardBadgeCategory,
                        styles[project.categoryClass],
                      ].join(" ")}
                    >
                      {project.category}
                    </span>

                    <span className={styles.cardBadgeCohort}>
                      {project.cohort}
                    </span>

                    <span className={styles.imageIndex}>
                      {String(index + 1).padStart(2, "0")}
                    </span>
                  </div>

                  {/* Corps de la carte */}
                  <div className={styles.projectCardBody}>
                    <p className={styles.projectCategorySub}>
                      {project.category}
                    </p>

                    <h3>{project.title}</h3>

                    <p className={styles.projectSummary}>
                      {project.summary}
                    </p>

                    <div className={styles.projectMeta}>
                      <span>Équipe : <strong>{project.team}</strong></span>
                      <span className={styles.statusPill}>
                        <span className={styles.statusDot} />
                        {project.status}
                      </span>
                    </div>

                    {/* Actions de la carte */}
                    <div className={styles.projectCardFooter}>
                      <button
                        type="button"
                        className={styles.btnVoirFiche}
                        onClick={() => setSelectedProject(project)}
                      >
                        Voir la fiche
                      </button>

                      <button
                        type="button"
                        className={styles.btnInteresse}
                        onClick={() => handleOpenInteret(project)}
                      >
                        <svg
                          width="14"
                          height="14"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2.2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <path d="m11 17 2 2a1 1 0 0 0 1.4 0l4.3-4.3a1 1 0 0 0 0-1.4l-2-2" />
                          <path d="m14 14 2.5 2.5" />
                          <path d="m17.5 10.5 2 2" />
                          <path d="m3 7 3-3a1 1 0 0 1 1.4 0l4.3 4.3a1 1 0 0 1 0 1.4l-2 2" />
                          <path d="m7 7 2.5 2.5" />
                          <path d="m10.5 3.5 2 2" />
                        </svg>
                        Je suis intéressé
                      </button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className={styles.emptyState}>
              <p className={styles.emptyTitle}>Aucune innovation trouvée</p>
              <p>
                Modifiez votre mot-clé ou sélectionnez un autre pôle
                technologique.
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

        {/* ========================================================= */}
        {/* BANDEAU SHOWROOM FINAL                                    */}
        {/* ========================================================= */}
        <section className={styles.featureBanner}>
          <div className={styles.featureCopy}>
            <p className={styles.eyebrow}>Partenariats & Écosystème</p>
            <h2>Des projets concrets, portés par des talents sénégalais.</h2>
            <p>
              Le CIAT accompagne les équipes qui transforment des idées
              audacieuses en solutions tangibles, durables et adaptées aux réalités
              du continent.
            </p>
            <a href="#projets" className={styles.featureLink}>
              Explorer les innovations →
            </a>
          </div>

          <div className={styles.featureVisual}>
            <Image
              src="/images/gallery_showroom.jpg"
              alt="Espace de valorisation et showroom technologique du CIAT"
              fill
              sizes="(max-width: 992px) 100vw, 50vw"
            />
          </div>
        </section>
      </main>

      {/* ========================================================= */}
      {/* MODALE 1 : FICHE DÉTAILLÉE D'INNOVATION                   */}
      {/* ========================================================= */}
      {selectedProject && (
        <div
          className={styles.modalBackdrop}
          role="presentation"
          onClick={(event) => {
            if (event.target === event.currentTarget) {
              setSelectedProject(null);
            }
          }}
        >
          <section
            className={styles.modalCard}
            role="dialog"
            aria-modal="true"
            aria-labelledby="modal-fiche-title"
          >
            <button
              className={styles.modalCloseIcon}
              type="button"
              onClick={() => setSelectedProject(null)}
              aria-label="Fermer la fiche"
            >
              ✕
            </button>

            <div className={styles.modalVisualHeader}>
              <Image
                src={selectedProject.image}
                alt={selectedProject.alt}
                fill
              />
            </div>

            <p className={styles.eyebrow}>
              {selectedProject.category} • {selectedProject.cohort}
            </p>

            <h2 id="modal-fiche-title">{selectedProject.title}</h2>

            <p className={styles.modalDetailText}>
              {selectedProject.detail}
            </p>

            <dl className={styles.modalMetaGrid}>
              <div className={styles.modalMetaItem}>
                <dt>Équipe porteuse</dt>
                <dd>{selectedProject.team}</dd>
              </div>

              <div className={styles.modalMetaItem}>
                <dt>Cohorte</dt>
                <dd>{selectedProject.cohort}</dd>
              </div>

              <div className={styles.modalMetaItem}>
                <dt>Statut homologation</dt>
                <dd>{selectedProject.status}</dd>
              </div>
            </dl>

            <div className={styles.modalActions}>
              <button
                type="button"
                className={styles.btnInteresse}
                onClick={() => {
                  const proj = selectedProject;
                  setSelectedProject(null);
                  handleOpenInteret(proj);
                }}
              >
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="m11 17 2 2a1 1 0 0 0 1.4 0l4.3-4.3a1 1 0 0 0 0-1.4l-2-2" />
                  <path d="m14 14 2.5 2.5" />
                  <path d="m17.5 10.5 2 2" />
                  <path d="m3 7 3-3a1 1 0 0 1 1.4 0l4.3 4.3a1 1 0 0 1 0 1.4l-2 2" />
                  <path d="m7 7 2.5 2.5" />
                  <path d="m10.5 3.5 2 2" />
                </svg>
                Je suis intéressé par ce projet
              </button>

              <button
                type="button"
                className={styles.btnVoirFiche}
                onClick={() => setSelectedProject(null)}
              >
                Fermer
              </button>
            </div>
          </section>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODALE 2 : FORMULAIRE OFFICIEL « JE SUIS INTÉRESSÉ »       */}
      {/* ========================================================= */}
      {interetProject && (
        <div
          className={styles.modalBackdrop}
          role="presentation"
          onClick={(event) => {
            if (event.target === event.currentTarget) {
              setInteretProject(null);
            }
          }}
        >
          <section
            className={styles.modalCard}
            role="dialog"
            aria-modal="true"
            aria-labelledby="modal-interet-title"
          >
            <button
              className={styles.modalCloseIcon}
              type="button"
              onClick={() => setInteretProject(null)}
              aria-label="Fermer le formulaire"
            >
              ✕
            </button>

            <p className={styles.eyebrow}>
              Espace Partenaires & Investisseurs
            </p>

            <h2 id="modal-interet-title">Manifester votre intérêt</h2>

            <p className={styles.modalDetailText}>
              Innovation ciblée :{" "}
              <strong>{interetProject.title}</strong> (Équipe {interetProject.team}).
              Remplissez ce formulaire pour entrer en relation avec les porteurs et l&apos;équipe du CIAT.
            </p>

            {formSuccess ? (
              <div className={styles.successBox}>
                <h3>✓ Manifestation enregistrée avec succès</h3>
                <p>
                  Merci pour votre intérêt pour le projet{" "}
                  <strong>{interetProject.title}</strong>. L&apos;équipe du CIAT
                  et les porteurs du projet ont été notifiés et reprendront contact avec vous sous 48h.
                </p>
                <button
                  type="button"
                  className={styles.btnVoirFiche}
                  onClick={() => setInteretProject(null)}
                >
                  Fermer la fenêtre
                </button>
              </div>
            ) : (
              <form onSubmit={handleInteretSubmit}>
                <div className={styles.formGridTwo}>
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>
                      Nom complet *
                    </label>
                    <input
                      type="text"
                      required
                      value={formNom}
                      onChange={(e) => setFormNom(e.target.value)}
                      placeholder="Mme/M. Prénom Nom"
                      className={styles.formInput}
                    />
                  </div>

                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>
                      Email professionnel *
                    </label>
                    <input
                      type="email"
                      required
                      value={formEmail}
                      onChange={(e) => setFormEmail(e.target.value)}
                      placeholder="nom@organisation.sn"
                      className={styles.formInput}
                    />
                  </div>
                </div>

                <div className={styles.formGridTwo}>
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>
                      Téléphone / WhatsApp
                    </label>
                    <input
                      type="tel"
                      value={formTel}
                      onChange={(e) => setFormTel(e.target.value)}
                      placeholder="+221 77 000 00 00"
                      className={styles.formInput}
                    />
                  </div>

                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>
                      Organisation / Entreprise / Fonds
                    </label>
                    <input
                      type="text"
                      value={formOrg}
                      onChange={(e) => setFormOrg(e.target.value)}
                      placeholder="Nom de votre structure"
                      className={styles.formInput}
                    />
                  </div>
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>
                    Nature de votre intérêt *
                  </label>
                  <select
                    value={formType}
                    onChange={(e) => setFormType(e.target.value)}
                    className={styles.formSelect}
                  >
                    <option value="Partenariat & Déploiement">
                      Partenariat technologique & Déploiement
                    </option>
                    <option value="Investissement / Financement">
                      Investissement / Financement d&apos;amorçage
                    </option>
                    <option value="Pilote terrain">
                      Mise en œuvre d&apos;un projet pilote terrain
                    </option>
                    <option value="Mentorat technologique">
                      Mentorat & Accompagnement technique
                    </option>
                    <option value="Autre">
                      Autre demande de collaboration
                    </option>
                  </select>
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>
                    Message / Précisions sur votre projet de collaboration
                  </label>
                  <textarea
                    rows={3}
                    value={formMessage}
                    onChange={(e) => setFormMessage(e.target.value)}
                    placeholder="Précisez votre besoin, vos objectifs ou vos disponibilités pour un échange..."
                    className={styles.formTextarea}
                  />
                </div>

                <button
                  type="submit"
                  disabled={formSubmitting}
                  className={styles.formSubmitBtn}
                >
                  {formSubmitting
                    ? "Envoi en cours..."
                    : "Transmettre ma manifestation d'intérêt →"}
                </button>
              </form>
            )}
          </section>
        </div>
      )}
    </div>
  );
}
