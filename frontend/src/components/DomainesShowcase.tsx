"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import "./domaines.css";

interface DomaineItem {
  numero: string;
  titre: string;
  description: string;
  image: string;
  icon: string;
  couleur: string;
  layout: "large" | "small";
  enjeux?: string;
  axes?: string[];
  prototypes?: string[];
  atelier?: string;
}

const domaines: DomaineItem[] = [
  {
    numero: "01",
    titre: "TIC, numérique, intelligence artificielle et données",
    description:
      "Développer des solutions numériques et des systèmes intelligents pour une société plus connectée et plus performante.",
    image: "/images/domaine-numerique.jpg",
    icon: "▦",
    couleur: "orange",
    layout: "large",
    enjeux:
      "Souveraineté numérique nationale, valorisation des données publiques sénégalaises, modèles d'intelligence artificielle adaptés aux langues nationales (Wolof, Pulaar, Sérère) et cybersécurité des systèmes critiques.",
    axes: [
      "Intelligence artificielle embarquée & vision par ordinateur",
      "Cybersécurité industrielle & plateformes logicielles souveraines",
      "Traitement automatique des langues nationales (NLP)",
    ],
    prototypes: ["SunuAgri AI", "Jumeaux numériques ISEP", "Guichet unique communal"],
    atelier: "Laboratoire Calcul Haute Performance & IA",
  },
  {
    numero: "02",
    titre: "Mécanique, fabrication et maintenance",
    description:
      "Accompagner la montée en compétences et le développement d’une industrie locale compétitive et durable.",
    image: "/images/domaine-mecanique.jpg",
    icon: "⚙",
    couleur: "gold",
    layout: "large",
    enjeux:
      "Rupture de la dépendance aux importations de pièces détachées industrielles par l'usinage numérique CNC de haute précision, la fabrication additive et la maintenance prédictive.",
    axes: [
      "Centres d'usinage numérique CNC 4 et 5 axes haute fidélité",
      "Découpe laser industrielle et profilage mécanique",
      "Fabrication additive (impression 3D) pour pièces critiques",
    ],
    prototypes: ["Fraiseuse CNC 4.0 locale", "Presse oléagineuse compacte", "Bancs d'essai industriels"],
    atelier: "FabLab 4.0 & Ateliers Usinage Lourd",
  },
  {
    numero: "03",
    titre: "Agriculture, transformation et environnement",
    description:
      "Soutenir l’innovation agricole et la valorisation des ressources naturelles pour une meilleure sécurité alimentaire et environnementale.",
    image: "/images/domaine-agriculture.jpg",
    icon: "♧",
    couleur: "green",
    layout: "large",
    enjeux:
      "Modernisation des rendements agricoles sahéliens, automatisation de l'irrigation connectée, transformation locale des céréales et valorisation zéro déchet des biomasses.",
    axes: [
      "Agro-robotique & capteurs IoT d'humidité des sols en temps réel",
      "Lignes de transformation alimentaire solaire (séchage, pressage)",
      "Gestion et purification partagée des eaux d'irrigation",
    ],
    prototypes: ["AgriSol IoT", "Éco-séchoir solaire hybride", "Décortiqueuse multicéréales"],
    atelier: "Halle Agroalimentaire & Ferme Expérimentale",
  },
  {
    numero: "04",
    titre: "Énergie, efficacité énergétique et énergies renouvelables",
    description:
      "Promouvoir des solutions énergétiques propres et accessibles pour un développement durable.",
    image: "/images/domaine-energie.jpg",
    icon: "ϟ",
    couleur: "yellow",
    layout: "small",
    enjeux:
      "Autonomie énergétique décentralisée des zones rurales, stabilité des micro-réseaux solaires hybrides et optimisation thermique des bâtiments industriels à Diamniadio.",
    axes: [
      "Micro-réseaux intelligents (Smart Grids) et stockage lithium/sodium",
      "Systèmes de pompage et d'éclairage solaire autonome pay-as-you-go",
      "Diagnostic d'efficacité énergétique et audits d'installations",
    ],
    prototypes: ["SunuGrid mini-réseau", "Remorque frigorifique solaire", "Banc test onduleurs"],
    atelier: "Laboratoire Énergies Renouvelables & Bancs Solaires",
  },
  {
    numero: "05",
    titre: "Pharmaceutique et biomédical",
    description:
      "Renforcer l’innovation en santé pour répondre aux besoins des populations et améliorer la qualité de vie.",
    image: "/images/domaine-biomedical.jpg",
    icon: "✚",
    couleur: "red",
    layout: "small",
    enjeux:
      "Amélioration des équipements biomédicaux locaux, télédiagnostic pour postes de santé isolés et extraction standardisée de principes actifs de la pharmacopée traditionnelle.",
    axes: [
      "Dispositifs médicaux de monitoring physiologiques connectés",
      "Incubateurs néonataux robustes basse consommation pour maternités rurales",
      "Formulation et conditionnement de principes actifs locaux (Moringa, Artemisia)",
    ],
    prototypes: ["Incubateur néonatal low-cost", "Moniteur biomédical télémédecine", "Gel antiseptique Moringa"],
    atelier: "Atelier Prototypage Biomédical & Chimie Verte",
  },
  {
    numero: "06",
    titre: "Éducation, formation professionnelle et insertion",
    description:
      "Former les talents d’aujourd’hui et de demain pour favoriser l’employabilité et l’entrepreneuriat.",
    image: "/images/domaine-education.jpg",
    icon: "⌂",
    couleur: "purple",
    layout: "small",
    enjeux:
      "Adéquation parfaite entre les référentiels de compétences techniques de l'ISEP et les besoins des filières industrielles émergentes du Sénégal et de la sous-région.",
    axes: [
      "Simulateurs immersifs de formation en Réalité Virtuelle (soudure, maintenance)",
      "Kits robotiques et pédagogiques pour lycées techniques",
      "Plateformes d'apprentissage hybride et certification des compétences",
    ],
    prototypes: ["Simulateur VR soudure", "Kit robotique pédagogique", "Portail insertion diplômés"],
    atelier: "Pôle Ingénierie Pédagogique & Réalité Virtuelle",
  },
  {
    numero: "07",
    titre: "Services aux collectivités, entrepreneuriat et incubation",
    description:
      "Soutenir les initiatives locales et accompagner la création d’entreprises innovantes et responsables.",
    image: "/images/domaine-incubation.jpg",
    icon: "♧",
    couleur: "terracotta",
    layout: "small",
    enjeux:
      "Accélération des startups territoriales, dématérialisation des services publics locaux et création de valeur partagée au sein du pôle urbain de Diamniadio.",
    axes: [
      "Guichet unique numérique et plateformes civiques territoriales",
      "Parcours d'incubation en 5 jalons normés (idéation à levée de fonds)",
      "Mentorat d'affaires, prototypage rapide et mise en relation industrielle",
    ],
    prototypes: ["SmartTax Collecte fiscale", "Dakar Waste Solutions", "Plateforme TerangaLang"],
    atelier: "Incubateur CIAT & Espaces de Coworking Collaboratif",
  },
];

export default function DomainesShowcase() {
  const [activeModalItem, setActiveModalItem] = useState<DomaineItem | null>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setActiveModalItem(null);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <main className="ciat-domains-page">
      {/* HERO */}
      <section className="ciat-hero">
        <div className="ciat-hero-content">
          <div className="ciat-eyebrow">
            <span>NOS 7 DOMAINES</span>
            <span className="ciat-eyebrow-line" />
          </div>

          <h1>
            Des expertises
            <br />
            au service d’un
            <br />
            <em>avenir durable</em>
          </h1>

          <p className="ciat-hero-description">
            Le CIAT intervient dans 7 domaines stratégiques pour
            accompagner les talents, soutenir l’innovation et répondre
            aux défis du Sénégal et de l’Afrique de demain.
          </p>

          <a href="#domaines" className="ciat-hero-action">
            <span>Découvrir nos domaines</span>
            <span className="ciat-action-arrow">↗</span>
          </a>

          <div className="ciat-hero-stats">
            <div>
              <strong>7</strong>
              <span>domaines</span>
            </div>
            <div>
              <strong>1</strong>
              <span>mission</span>
            </div>
            <div>
              <strong>∞</strong>
              <span>possibilités</span>
            </div>
          </div>
        </div>

        <div className="ciat-hero-visual">
          <div className="ciat-hero-photo" />

          <div className="ciat-hero-overlay ciat-hero-overlay-back" />
          <div className="ciat-hero-overlay ciat-hero-overlay-front" />

          <div className="ciat-hero-principles">
            <span>INNOVER</span>
            <span>FORMER</span>
            <span>ENTREPRENDRE</span>
            <span>TRANSFÉRER</span>
            <i />
          </div>
        </div>
      </section>

      {/* INTRODUCTION */}
      <section className="ciat-domains-section" id="domaines">
        <header className="ciat-domains-header">
          <div className="ciat-domains-heading">
            <div className="ciat-section-eyebrow">
              <span>NOS 7 DOMAINES</span>
              <i />
            </div>

            <h2>
              Une approche globale,
              <br />
              au service de l’impact
            </h2>
          </div>

          <p className="ciat-domains-intro">
            Le CIAT structure son action autour de 7 domaines
            complémentaires, pour favoriser l’innovation, la formation,
            le transfert de compétences et la création de valeur durable
            au Sénégal et en Afrique.
          </p>

          <div className="ciat-intro-note">
            <span>
              Chaque domaine
              <br />
              est un levier pour
              <br />
              bâtir demain.
            </span>
            <a href="#domaine-01" aria-label="Découvrir les domaines">
              ↗
            </a>
          </div>
        </header>

        {/* PREMIÈRE LIGNE : 3 CARTES */}
        <div className="ciat-domain-grid ciat-domain-grid-large">
          {domaines
            .filter((d) => d.layout === "large")
            .map((d) => (
              <article
                className="ciat-domain-card"
                id={`domaine-${d.numero}`}
                key={d.numero}
              >
                <div
                  className="ciat-card-image"
                  style={{ backgroundImage: `url("${d.image}")` }}
                  role="img"
                  aria-label={`Illustration : ${d.titre}`}
                />

                <span className={`ciat-card-icon ${d.couleur}`}>
                  {d.icon}
                </span>

                <div className="ciat-card-content">
                  <span className="ciat-card-number">{d.numero}</span>
                  <h3>{d.titre}</h3>
                  <p>{d.description}</p>
                  <button
                    type="button"
                    onClick={() => setActiveModalItem(d)}
                    className="ciat-card-link"
                    aria-label={`En savoir plus sur le domaine ${d.titre}`}
                  >
                    En savoir plus <span>→</span>
                  </button>
                </div>
              </article>
            ))}
        </div>

        {/* DEUXIÈME LIGNE : 4 CARTES */}
        <div className="ciat-domain-grid ciat-domain-grid-small">
          {domaines
            .filter((d) => d.layout === "small")
            .map((d) => (
              <article
                className="ciat-domain-card ciat-domain-card-small"
                id={`domaine-${d.numero}`}
                key={d.numero}
              >
                <div
                  className="ciat-card-image"
                  style={{ backgroundImage: `url("${d.image}")` }}
                  role="img"
                  aria-label={`Illustration : ${d.titre}`}
                />

                <span className={`ciat-card-icon ${d.couleur}`}>
                  {d.icon}
                </span>

                <div className="ciat-card-content">
                  <span className="ciat-card-number">{d.numero}</span>
                  <h3>{d.titre}</h3>
                  <p>{d.description}</p>
                  <button
                    type="button"
                    onClick={() => setActiveModalItem(d)}
                    className="ciat-card-link"
                    aria-label={`En savoir plus sur le domaine ${d.titre}`}
                  >
                    En savoir plus <span>→</span>
                  </button>
                </div>
              </article>
            ))}
        </div>
      </section>

      {/* BANDEAU FINAL */}
      <section className="ciat-closing">
        <div className="ciat-closing-content">
          <div className="ciat-section-eyebrow">
            <span>LE CIAT</span>
            <i />
          </div>

          <h2>
            Ensemble, transformons
            <br />
            les idées en <em>solutions</em>
          </h2>

          <p>
            Rejoignez un écosystème d’innovation, de formation et de
            transfert au service du développement du Sénégal et de l’Afrique.
          </p>

          <Link href="/portail/ciat" className="ciat-closing-button">
            Découvrir le CIAT <span>→</span>
          </Link>
        </div>

        <div className="ciat-closing-visual">
          <div className="ciat-closing-photo" />
          <div className="ciat-closing-cut" />
          <div className="ciat-closing-curve" />
        </div>
      </section>

      {/* MODAL FICHE DÉTAILLÉE DE DOMAINE */}
      {activeModalItem && (
        <div
          className="ciat-modal-backdrop"
          onClick={() => setActiveModalItem(null)}
          role="dialog"
          aria-modal="true"
        >
          <div
            className="ciat-modal-card"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              className="ciat-modal-close"
              onClick={() => setActiveModalItem(null)}
              aria-label="Fermer la boîte de dialogue"
            >
              ✕
            </button>

            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "12px" }}>
              <span className={`ciat-card-icon ${activeModalItem.couleur}`} style={{ margin: 0, width: "36px", height: "36px", fontSize: "16px" }}>
                {activeModalItem.icon}
              </span>
              <span style={{ fontSize: "12px", fontWeight: "bold", letterSpacing: "0.1em", color: "#C99A68", textTransform: "uppercase" }}>
                Domaine {activeModalItem.numero}
              </span>
            </div>

            <h3 style={{ fontSize: "20px", fontWeight: "bold", margin: "0 0 14px", color: "#24140D", lineHeight: 1.3 }}>
              {activeModalItem.titre}
            </h3>

            <p style={{ fontSize: "13px", lineHeight: "1.7", color: "#5A483D", margin: "0 0 20px" }}>
              {activeModalItem.description}
            </p>

            {activeModalItem.enjeux && (
              <div style={{ background: "#FAF7F2", border: "1px solid #EFE4D6", borderRadius: "10px", padding: "16px", marginBottom: "16px" }}>
                <strong style={{ display: "block", fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.08em", color: "#612D10", marginBottom: "6px" }}>
                  Enjeux Prioritaires au Sénégal
                </strong>
                <p style={{ margin: 0, fontSize: "12px", lineHeight: "1.6", color: "#4A3E34" }}>
                  {activeModalItem.enjeux}
                </p>
              </div>
            )}

            {activeModalItem.axes && activeModalItem.axes.length > 0 && (
              <div style={{ marginBottom: "16px" }}>
                <strong style={{ display: "block", fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.08em", color: "#612D10", marginBottom: "8px" }}>
                  Axes Technologiques & Ateliers
                </strong>
                <ul style={{ margin: 0, paddingLeft: "18px", fontSize: "12px", color: "#5A483D", lineHeight: "1.8" }}>
                  {activeModalItem.axes.map((axe, i) => (
                    <li key={i}>{axe}</li>
                  ))}
                </ul>
              </div>
            )}

            {activeModalItem.prototypes && activeModalItem.prototypes.length > 0 && (
              <div style={{ marginBottom: "20px" }}>
                <strong style={{ display: "block", fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.08em", color: "#612D10", marginBottom: "8px" }}>
                  Exemples de Prototypes Réalisés
                </strong>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                  {activeModalItem.prototypes.map((p, i) => (
                    <span
                      key={i}
                      style={{
                        background: "#24140D",
                        color: "#FFFFFF",
                        fontSize: "11px",
                        fontWeight: "600",
                        padding: "4px 10px",
                        borderRadius: "6px",
                      }}
                    >
                      {p}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div style={{ borderTop: "1px solid #EFE4D6", paddingTop: "18px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: "11px", color: "#8A7A6E" }}>
                Infrastructure : <strong>{activeModalItem.atelier || "Ateliers CIAT Diamniadio"}</strong>
              </span>
              <Link
                href="/portail/incubateur"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                  background: "#C99A68",
                  color: "#24140D",
                  fontWeight: "bold",
                  fontSize: "12px",
                  padding: "8px 16px",
                  borderRadius: "8px",
                  textDecoration: "none",
                }}
              >
                Candidater dans ce domaine →
              </Link>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
