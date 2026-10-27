import Image from "next/image";
import type { Metadata } from "next";
import "./appels.css";

const styles: Record<string, string> = new Proxy(
  {},
  { get: (_, prop: string) => String(prop) }
);

export const metadata: Metadata = {
  title: "Appel à candidature | CIAT",
  description:
    "Rejoignez l’incubateur du CIAT et donnez vie à votre projet innovant.",
};

export default function AppelACandidaturePage() {
  return (
    <div className={styles.pageRoot}>
      <main className={styles["candidate-page"]}>
        <section className={styles.hero} aria-labelledby="hero-title">
          <div className={styles["hero__bg"]}>
            <Image
              src="/images/portrait-candidature.jpg"
              alt="Porteuse de projet, prête à développer une idée innovante au CIAT"
              fill
              priority
              sizes="100vw"
            />
          </div>
          <div className={styles["hero__overlay"]} />
          <div className={styles["hero__copy"]}>
            <div className={styles.eyebrowBadge}>
              <span className={styles.badgeDot} />
              <span>Appel à candidature officiel • Cohorte 2026</span>
            </div>
            <h1 id="hero-title">
              Transformez vos idées en <span>projets à fort impact</span>
            </h1>
            <p className={styles["hero__description"]}>
              Rejoignez l’incubateur du CIAT et bénéficiez d’un accompagnement
              sur mesure pour développer votre projet, de la phase d’idée
              jusqu’au prototype industriel et au transfert technologique.
            </p>
            <div className={styles["hero__actions"]}>
              <a className={styles.button} href="#preparer">
                Déposer ma candidature →
              </a>
              <a className={styles["text-link"]} href="#parcours">
                En savoir plus ↓
              </a>
            </div>
            <div className={styles.heroPills}>
              <span className={styles.heroPillItem}>✓ Prototypage et ateliers ISEP</span>
              <span className={styles.heroPillItem}>✓ Accompagnement technique 360°</span>
              <span className={styles.heroPillItem}>✓ Financement & Partenaires</span>
            </div>
          </div>
        </section>

        <section
          className={styles.why}
          id="parcours"
          aria-labelledby="why-title"
        >
          <div className={styles["why__intro"]}>
            <p className={styles.eyebrow}>Pourquoi candidater ?</p>
            <h2 id="why-title">Un tremplin pour votre projet</h2>
            <p>
              Le CIAT vous offre un environnement propice à l’innovation, des
              ressources techniques et un réseau de partenaires pour faire
              grandir votre idée et la transformer en solution concrète.
            </p>
            <ul className={styles.benefits}>
              <li>Accompagnement personnalisé</li>
              <li>Accès à des experts et mentors</li>
              <li>Espaces, équipements et ressources dédiés</li>
              <li>Mise en relation avec des partenaires</li>
              <li>Valorisation et visibilité de votre projet</li>
            </ul>
          </div>

          <div className={styles.process}>
            <div className={styles["process__heading"]}>
              <div>
                <p className={styles.eyebrow}>Le parcours de candidature</p>
                <h2>Trois étapes pour avancer</h2>
              </div>
              <p>
                Un processus transparent, de la soumission du dossier à la
                décision du comité.
              </p>
            </div>
            <div className={styles.steps}>
              <article className={styles.step}>
                <span className={styles["step__number"]}>01</span>
                <h3>Soumission du dossier</h3>
                <p>
                  Remplissez le formulaire et joignez les pièces requises pour
                  présenter votre projet.
                </p>
              </article>
              <article className={styles.step}>
                <span className={styles["step__number"]}>02</span>
                <h3>Évaluation du projet</h3>
                <p>
                  Votre dossier est étudié par un comité selon les critères de
                  sélection du programme.
                </p>
              </article>
              <article className={styles.step}>
                <span className={styles["step__number"]}>03</span>
                <h3>Résultats et intégration</h3>
                <p>
                  Vous recevez une réponse et, en cas de sélection, les
                  prochaines étapes de votre parcours.
                </p>
              </article>
            </div>
            <div className={styles["process__action"]}>
              <a
                className={`${styles.button} ${styles["button--dark"]}`}
                href="#preparer"
              >
                Je candidate maintenant
              </a>
            </div>
          </div>
        </section>

        <section className={styles.sectors} aria-labelledby="sectors-title">
          <div className={styles["sectors__visual"]}>
            <Image
              src="/images/plantule-secteurs.jpg"
              alt="Jeune pousse tenue dans les mains, symbole d’un projet en développement"
              fill
              sizes="(max-width: 640px) 100vw, 35vw"
            />
          </div>
          <div className={styles["sectors__copy"]}>
            <p className={styles.eyebrow}>Domaines d’intervention</p>
            <h2 id="sectors-title">
              Des projets dans des secteurs porteurs de sens
            </h2>
            <p className={styles["sectors__description"]}>
              Nous accompagnons des initiatives innovantes qui répondent aux
              besoins du territoire et contribuent au développement économique,
              social et durable.
            </p>
            <ul className={styles["sector-list"]}>
              <li>AgriTech et agroalimentaire</li>
              <li>Éducation et formation</li>
              <li>Numérique et intelligence artificielle</li>
              <li>Industrie et services</li>
              <li>Énergie et environnement</li>
              <li>Culture et création</li>
              <li>Santé et biotechnologies</li>
              <li>Fabrication et maintenance</li>
            </ul>
          </div>
        </section>

        <section
          className={styles.dossier}
          id="preparer"
          aria-labelledby="dossier-title"
        >
          <div className={styles["dossier__visual"]}>
            <Image
              src="/images/campus-ciat.jpg"
              alt="Vue du campus et des espaces de travail du CIAT"
              fill
              sizes="(max-width: 640px) 100vw, 40vw"
            />
          </div>
          <div className={styles["dossier__copy"]}>
            <p className={styles.eyebrow}>Préparer votre dossier</p>
            <h2 id="dossier-title">
              Une candidature claire, un projet bien présenté.
            </h2>
            <p>
              Préparez les éléments essentiels pour permettre au comité de
              comprendre votre idée, votre équipe et la valeur de la solution
              proposée.
            </p>
            <ul className={styles["dossier__list"]}>
              <li>Présentation du projet et des objectifs</li>
              <li>Profil du porteur ou de l’équipe</li>
              <li>Problème identifié et solution proposée</li>
              <li>Business plan, si disponible</li>
              <li>Pièces justificatives demandées</li>
              <li>Coordonnées à jour</li>
            </ul>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "12px", alignItems: "center" }}>
              <a
                className={`${styles.button} ${styles["button--dark"]}`}
                href="/connexion?next=/incubateur"
              >
                Déposer ma candidature en ligne
              </a>
              <a
                className={styles.button}
                href="/portail/documents"
              >
                Consulter les pièces à fournir
              </a>
            </div>
            <p className={styles["dossier__note"]}>
              Les dates, critères d’éligibilité et pièces obligatoires doivent
              être confirmés avec le CIAT avant publication.
            </p>
          </div>
        </section>
      </main>
    </div>
  );
}
