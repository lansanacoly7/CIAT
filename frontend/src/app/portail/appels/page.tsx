import Image from "next/image";
import type { Metadata } from "next";
import AppelsBody from "./AppelsBody";
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
              src="/images/ciat-hero-appel-engineer.webp"
              alt="Ingénieure présentant un prototype technologique au comité d'évaluation du CIAT"
              fill
              priority
              unoptimized
              sizes="100vw"
            />
          </div>
          <div className={styles["hero__overlay"]} />
          <div className={styles["hero__copy"]}>
            <p className={styles.eyebrow}>Appel à candidature</p>
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
          </div>
        </section>

        <AppelsBody />
      </main>
    </div>
  );
}
