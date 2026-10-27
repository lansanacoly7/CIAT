"use client";

import React, { useState } from "react";
import Link from "next/link";
import "./domaines.css";

interface DomaineItem {
  n: string;
  title: string;
  description: string;
  image: string;
  theme: "featured" | "standard" | "compact";
  enjeux: string;
  axes: string[];
  prototypes: string[];
  atelier: string;
}

const domaines: DomaineItem[] = [
  {
    n: "01",
    title: "TIC, numérique, intelligence artificielle et données",
    description:
      "Développer des solutions numériques souveraines et des systèmes intelligents adaptés aux besoins prioritaires.",
    image:
      "https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=1200&q=90",
    theme: "featured",
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
    n: "02",
    title: "Mécanique, fabrication et maintenance",
    description:
      "Accompagner la montée en compétences et le développement d’une industrie manufacturière locale compétitive et durable.",
    image:
      "https://images.unsplash.com/photo-1581092160562-40aa08e78837?auto=format&fit=crop&w=1200&q=90",
    theme: "standard",
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
    n: "03",
    title: "Agriculture, transformation et environnement",
    description:
      "Soutenir l’innovation agrotechnologique et la valorisation durable des ressources naturelles pour la sécurité alimentaire.",
    image:
      "https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=1200&q=90",
    theme: "standard",
    enjeux:
      "Sécurité alimentaire par la maîtrise des ressources hydriques, la mécanisation adaptée des filières maraîchères des Niayes et la réduction des pertes post-récolte par le séchage solaire hygiénique.",
    axes: [
      "Irrigation goutte-à-goutte automatisée par capteurs IoT",
      "Serres hydroponiques bioclimatiques basse consommation d'eau",
      "Séchoirs solaires hybrides et conservation agroalimentaire",
    ],
    prototypes: ["AgriSol IoT", "Éco-Séchoir Solaire", "SmartIrrig Saloum"],
    atelier: "Serres Expérimentales & Laboratoire Bio-Industries",
  },
  {
    n: "04",
    title: "Énergie, efficacité énergétique et énergies renouvelables",
    description:
      "Promouvoir des solutions d'énergie propre, autonomes et accessibles pour le développement durable des territoires.",
    image:
      "https://images.unsplash.com/photo-1509391366360-2e959784a276?auto=format&fit=crop&w=900&q=90",
    theme: "compact",
    enjeux:
      "Valorisation optimale de l'irradiance solaire du Sénégal, bancs d'essai de modules photovoltaïques en climat sahélien et stabilisation des micro-réseaux ruraux autonomes.",
    axes: [
      "Caractérisation et tests d'endurance de modules solaires",
      "Gestion intelligente de micro-réseaux ruraux autonomes",
      "Contrôleurs de charge et stockage hybride par batteries",
    ],
    prototypes: ["SunuGrid Micro-Réseau", "Éolienne multipale locale", "Bancs solaires"],
    atelier: "Plateforme Solaire Extérieure & Laboratoire Énergies",
  },
  {
    n: "05",
    title: "Pharmaceutique et biomédical",
    description:
      "Renforcer l’innovation en santé publique et les technologies médicales adaptées aux besoins prioritaires des populations.",
    image:
      "https://images.unsplash.com/photo-1579154204601-01588f351e67?auto=format&fit=crop&w=900&q=90",
    theme: "compact",
    enjeux:
      "Souveraineté sanitaire nationale par la fabrication locale de dispositifs médicaux d'urgence réparables, la télémédecine solaire décentralisée et l'extraction validée de principes actifs locaux.",
    axes: [
      "Valises solaires de télédiagnostic médical pour postes de santé",
      "Incubateurs néonataux robustes thermorégulés",
      "Procédés d'extraction standardisés pour pharmacopée locale",
    ],
    prototypes: ["TéléDiag Rufisque", "Incubateur néonatal rural", "Hydrogel Moringa certifié"],
    atelier: "Laboratoire Dispositifs Médicaux & Chimie Bio",
  },
  {
    n: "06",
    title: "Éducation, formation professionnelle et insertion",
    description:
      "Former les talents d’aujourd’hui et de demain aux métiers d'avenir pour stimuler l’employabilité et l’entrepreneuriat.",
    image:
      "https://images.unsplash.com/photo-1521737711867-e3b97375f902?auto=format&fit=crop&w=900&q=90",
    theme: "compact",
    enjeux:
      "Transformation de l'apprentissage technique par la réalité virtuelle (VR), simulateurs industriels sans risque et passerelles directes pour l'insertion des diplômés de l'ISEP.",
    axes: [
      "Simulateurs immersifs VR d'usinage et soudure industrielle",
      "Plateformes d'apprentissage hybride pour filières techniques",
      "Matching prédictif des diplômés de l'ISEP avec les entreprises",
    ],
    prototypes: ["Simulateur VR Usinage", "Plateforme Insertion Métiers", "Kit robotique lycées"],
    atelier: "Centre Immersif & Laboratoire Réalité Virtuelle",
  },
  {
    n: "07",
    title: "Services aux collectivités, entrepreneuriat et incubation",
    description:
      "Soutenir les initiatives territoriales et transformer les idées à fort impact en entreprises innovantes et pérennes.",
    image:
      "https://images.unsplash.com/photo-1556761175-b413da4baf72?auto=format&fit=crop&w=900&q=90",
    theme: "compact",
    enjeux:
      "Modernisation des collectivités territoriales, transition vers des villes durables (Pôle Urbain de Diamniadio), optimisation de la gestion des déchets et traçabilité de la fiscalité locale.",
    axes: [
      "Capteurs intelligents pour l'optimisation des tournées déchets",
      "Tricycles utilitaires électriques pour logistique urbaine",
      "Plateformes numériques de perception et guichet unique",
    ],
    prototypes: ["Dakar Waste Solutions", "SmartTax Collect", "Gestion partagée Diamniadio"],
    atelier: "Hub Logistique & Modélisation Territoriale",
  },
];

export default function DomainesShowcase() {
  const [activeModalItem, setActiveModalItem] = useState<DomaineItem | null>(null);

  return (
    <main className="ciat-page">
      {/* HERO */}
      <section className="ciat-hero">
        <div className="ciat-hero-copy">
          <div className="ciat-eyebrow">
            <span>NOS 7 DOMAINES STRATÉGIQUES</span>
            <i />
          </div>

          <h1>
            7 domaines
            <br />
            d’expertise au service
            <br />
            d’un <em>avenir durable</em>
          </h1>

          <p>
            Implanté au sein de l’ISEP Amadou Trawaré à Diamniadio, le CIAT intervient
            dans sept filières technologiques prioritaires pour accompagner les talents,
            prototyper des solutions industrielles et répondre aux défis du Sénégal.
          </p>

          <a href="#domaines" className="ciat-hero-link">
            <span className="ciat-play">↘</span>
            <span>Découvrir nos domaines</span>
            <span className="ciat-arrow">→</span>
          </a>
        </div>

        <div className="ciat-hero-image" aria-label="Illustration d’un espace de travail technique au CIAT">
          <div className="ciat-hero-photo" />
          <div className="ciat-hero-cut ciat-hero-cut-one" />
          <div className="ciat-hero-cut ciat-hero-cut-two" />
          <div className="ciat-hero-ring" />

          <div className="ciat-hero-words">
            <span>INNOVER</span>
            <span>FORMER</span>
            <span>ENTREPRENDRE</span>
            <span>TRANSFÉRER</span>
            <i />
          </div>
        </div>
      </section>

      {/* INTRODUCTION + GRILLE */}
      <section className="ciat-domains" id="domaines">
        <header className="ciat-domains-intro">
          <div>
            <span className="ciat-section-label">NOS 7 DOMAINES</span>
            <p>
              Des compétences, des infrastructures
              <br className="desktop-break" />
              et un accompagnement sur mesure pour
              <br className="desktop-break" />
              transformer les idées en solutions concrètes.
            </p>
          </div>

          <a href="#domaine-01" className="ciat-discover">
            Tout découvrir <span>↗</span>
          </a>
        </header>

        <div className="ciat-domain-grid">
          {domaines.map((d) => (
            <article
              className={`ciat-domain-card ciat-domain-${d.theme}`}
              id={`domaine-${d.n}`}
              key={d.n}
            >
              <div
                className="ciat-domain-image"
                style={{ backgroundImage: `url("${d.image}")` }}
                role="img"
                aria-label={`Image illustrative du domaine ${d.title}`}
              >
                <span className="ciat-image-index">{d.n}</span>
              </div>

              <div className="ciat-domain-body">
                <span className="ciat-domain-index">{d.n}</span>

                <div className="ciat-domain-symbol" aria-hidden="true">
                  {["◉", "⌁", "♧", "ϟ", "⊙", "⌂", "⌖"][Number(d.n) - 1]}
                </div>

                <h2>{d.title}</h2>
                <p>{d.description}</p>

                <button
                  type="button"
                  onClick={() => setActiveModalItem(d)}
                  className="ciat-card-link"
                  aria-label={`En savoir plus sur ${d.title}`}
                >
                  En savoir plus <span>→</span>
                </button>
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* BANDEAU FINAL */}
      <section className="ciat-bottom-cta">
        <div className="ciat-bottom-copy">
          <span className="ciat-section-label">
            UN ÉCOSYSTÈME AU SERVICE DES IDÉES
          </span>

          <h2>
            Des idées d’aujourd’hui,
            <br />
            les <em>solutions de demain.</em>
          </h2>

          <p>
            Apprenant de l’ISEP, porteur de projet ou entreprise partenaire : rejoignez
            l’incubateur et les laboratoires technologiques du CIAT à Diamniadio pour
            développer et valider vos innovations.
          </p>

          <Link href="/portail/ciat" className="ciat-cta-button">
            Découvrir le CIAT <span>→</span>
          </Link>
        </div>

        <div className="ciat-bottom-visual">
          <div className="ciat-bottom-photo" />
          <div className="ciat-bottom-shape" />
          <div className="ciat-bottom-arc" />
        </div>
      </section>

      {/* MODAL LIGHTBOX DÉTAILLÉE AU CLIC SUR UNE CARTE */}
      {activeModalItem && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-domain-title"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200"
          onClick={() => setActiveModalItem(null)}
        >
          <div
            className="relative w-full max-w-2xl rounded-2xl bg-white p-6 sm:p-8 shadow-2xl border border-[#EFE4D6] text-[#24140D] max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Bouton Fermer */}
            <button
              type="button"
              onClick={() => setActiveModalItem(null)}
              className="absolute top-4 right-4 h-9 w-9 rounded-full bg-[#FAF7F2] text-[#612D10] hover:bg-[#612D10] hover:text-white transition-colors flex items-center justify-center font-bold text-sm"
              aria-label="Fermer la fenêtre détaillée"
            >
              ✕
            </button>

            {/* En-tête modal */}
            <div className="flex items-center gap-3 mb-3">
              <span className="px-3 py-1 rounded-full bg-[#FAF7F2] border border-[#EFE4D6] text-xs font-bold text-[#612D10]">
                Domaine {activeModalItem.n}
              </span>
              <span className="text-xs text-[#7A695D] font-medium">
                Pôle d&apos;excellence CIAT Diamniadio
              </span>
            </div>

            <h3 id="modal-domain-title" className="text-xl sm:text-2xl font-bold tracking-tight text-[#24140D] mb-3">
              {activeModalItem.title}
            </h3>

            <p className="text-sm text-[#5A483D] leading-relaxed mb-6">
              {activeModalItem.description}
            </p>

            <div className="space-y-5 border-t border-[#EFE4D6] pt-5 text-xs sm:text-sm">
              {/* Enjeux */}
              <div>
                <strong className="block text-[#612D10] uppercase tracking-wider text-[11px] font-bold mb-1">
                  Enjeux Stratégiques & Impact National
                </strong>
                <p className="text-[#5A483D] leading-relaxed">{activeModalItem.enjeux}</p>
              </div>

              {/* Axes prioritaires */}
              <div>
                <strong className="block text-[#612D10] uppercase tracking-wider text-[11px] font-bold mb-2">
                  Axes Technologiques Prioritaires
                </strong>
                <ul className="space-y-1.5 list-disc list-inside text-[#3E2F26]">
                  {activeModalItem.axes.map((axe) => (
                    <li key={axe}>{axe}</li>
                  ))}
                </ul>
              </div>

              {/* Prototypes & Atelier */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <div className="rounded-xl bg-[#FAF7F2] border border-[#EFE4D6] p-3.5">
                  <span className="block text-[10px] uppercase font-bold text-[#612D10] mb-1">
                    Atelier & Laboratoire rattaché
                  </span>
                  <p className="font-semibold text-xs text-[#24140D]">{activeModalItem.atelier}</p>
                </div>

                <div className="rounded-xl bg-[#FAF7F2] border border-[#EFE4D6] p-3.5">
                  <span className="block text-[10px] uppercase font-bold text-[#612D10] mb-1">
                    Exemples de Prototypes
                  </span>
                  <p className="text-xs text-[#5A483D]">{activeModalItem.prototypes.join(" · ")}</p>
                </div>
              </div>
            </div>

            {/* Actions modal */}
            <div className="mt-8 pt-4 border-t border-[#EFE4D6] flex flex-wrap items-center justify-between gap-3">
              <Link
                href="/galerie"
                className="text-xs font-bold text-[#612D10] hover:underline"
                onClick={() => setActiveModalItem(null)}
              >
                Voir les prototypes en galerie ↗
              </Link>

              <Link
                href="/connexion?next=/incubateur"
                className="inline-flex h-10 items-center justify-center rounded-xl bg-[#612D10] px-5 text-xs font-bold text-white hover:bg-[#24140D] transition-colors"
                onClick={() => setActiveModalItem(null)}
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
