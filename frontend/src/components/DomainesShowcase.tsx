"use client";

import { useState } from "react";
import Link from "next/link";
import "./domaines.css";

interface DomaineData {
  number: string;
  title: string;
  description: string;
  image: string;
  className: string;
  enjeuxComplets: string;
  axes: string[];
  prototypes: string[];
  atelier: string;
}

const domains: DomaineData[] = [
  {
    number: "01",
    title: "TIC, numérique, intelligence artificielle et données",
    description:
      "Développer des solutions numériques et des systèmes intelligents pour une société connectée, inclusive et performante.",
    image: "/images/domaine_01_card_hd.jpg",
    className: "domain-card--large",
    enjeuxComplets:
      "Souveraineté numérique nationale, valorisation des données publiques sénégalaises, modèles d'intelligence artificielle adaptés aux langues nationales (Wolof, Pulaar, Sérère), vision par ordinateur et cybersécurité des systèmes critiques.",
    axes: [
      "Intelligence artificielle embarquée & vision par ordinateur",
      "Cybersécurité industrielle & plateformes logicielles souveraines",
      "Traitement automatique des langues nationales (NLP)",
    ],
    prototypes: ["SunuAgri AI", "Jumeaux numériques ISEP", "Guichet unique communal"],
    atelier: "Laboratoire Calcul Haute Performance & IA",
  },
  {
    number: "02",
    title: "Mécanique, fabrication et maintenance",
    description:
      "Accompagner la montée en compétences et le développement d’une industrie locale compétitive, agile et durable.",
    image: "/images/domaine_02_card_hd.jpg",
    className: "domain-card--large",
    enjeuxComplets:
      "Rupture de la dépendance aux importations de pièces détachées industrielles par l'usinage numérique CNC de haute précision, la fabrication additive sur métaux/polymères et la maintenance prédictive.",
    axes: [
      "Centres d'usinage numérique CNC 4 et 5 axes haute fidélité",
      "Découpe laser industrielle et profilage mécanique",
      "Fabrication additive (impression 3D) pour pièces critiques",
    ],
    prototypes: ["Fraiseuse CNC 4.0 locale", "Presse oléagineuse compacte", "Bancs d'essai industriels"],
    atelier: "FabLab 4.0 & Ateliers Usinage Lourd",
  },
  {
    number: "03",
    title: "Agriculture, transformation et environnement",
    description:
      "Soutenir l’innovation agricole et la valorisation des ressources naturelles pour une meilleure sécurité alimentaire.",
    image: "/images/domaine_03_card_hd.jpg",
    className: "domain-card--large",
    enjeuxComplets:
      "Sécurité alimentaire durable par la maîtrise des ressources hydriques, la mécanisation adaptée des filières céréalières et maraîchères des Niayes, et la réduction des pertes post-récolte par le séchage solaire.",
    axes: [
      "Irrigation goutte-à-goutte automatisée par capteurs IoT",
      "Serres hydroponiques bioclimatiques basse consommation d'eau",
      "Séchoirs solaires hybrides et conservation agroalimentaire",
    ],
    prototypes: ["AgriSol IoT", "Éco-Séchoir Solaire", "SmartIrrig Saloum"],
    atelier: "Serres Expérimentales & Laboratoire Bio-Industries",
  },
  {
    number: "04",
    title: "Énergie, efficacité énergétique et énergies renouvelables",
    description:
      "Promouvoir des solutions énergétiques propres, autonomes et accessibles pour le développement durable des territoires.",
    image: "/images/domaine_04_card_hd.jpg",
    className: "domain-card--small",
    enjeuxComplets:
      "Valorisation optimale de l'irradiance solaire du Sénégal, stabilisation des micro-réseaux ruraux autonomes (microgrids) et certification technique des équipements photovoltaïques en climat sahélien.",
    axes: [
      "Caractérisation et tests d'endurance de modules solaires",
      "Gestion intelligente de micro-réseaux ruraux autonomes",
      "Contrôleurs de charge et stockage hybride par batteries",
    ],
    prototypes: ["SunuGrid Micro-Réseau", "Éolienne multipale locale", "Bancs solaires"],
    atelier: "Plateforme Solaire Extérieure & Laboratoire Énergies",
  },
  {
    number: "05",
    title: "Pharmaceutique et biomédical",
    description:
      "Renforcer l’innovation en santé et les technologies médicales adaptées pour répondre aux besoins prioritaires des populations.",
    image: "/images/domaine_05_card_hd.jpg",
    className: "domain-card--small",
    enjeuxComplets:
      "Souveraineté sanitaire nationale par la fabrication locale de dispositifs médicaux d'urgence réparables, la télémédecine solaire décentralisée pour postes de santé de brousse et l'extraction validée de principes actifs.",
    axes: [
      "Valises solaires de télédiagnostic médical pour brousse",
      "Incubateurs néonataux robustes thermorégulés low-cost",
      "Procédés d'extraction standardisés pour pharmacopée locale",
    ],
    prototypes: ["TéléDiag Rufisque", "Incubateur néonatal rural", "Hydrogel Moringa certifié"],
    atelier: "Laboratoire Dispositifs Médicaux & Chimie Bio",
  },
  {
    number: "06",
    title: "Éducation, formation professionnelle et insertion",
    description:
      "Former les talents d’aujourd’hui et de demain aux métiers d'avenir pour stimuler l’employabilité et l’entrepreneuriat.",
    image: "/images/domaine_06_card_hd.jpg",
    className: "domain-card--small",
    enjeuxComplets:
      "Transformation de l'apprentissage technique par les technologies immersives (VR), simulateurs d'ateliers sans risque et passerelles directes pour l'insertion des diplômés de l'ISEP dans l'industrie.",
    axes: [
      "Simulateurs immersifs VR d'usinage et soudure industrielle",
      "Plateformes d'apprentissage hybride pour filières techniques",
      "Matching prédictif des diplômés de l'ISEP avec les entreprises",
    ],
    prototypes: ["Simulateur VR Usinage", "Plateforme Insertion Métiers", "Kit robotique lycées"],
    atelier: "Centre Immersif & Laboratoire Réalité Virtuelle",
  },
  {
    number: "07",
    title: "Services aux collectivités, entrepreneuriat et incubation",
    description:
      "Accompagner les initiatives locales et transformer les idées à fort impact en entreprises innovantes et pérennes.",
    image: "/images/domaine_07_card_hd.jpg",
    className: "domain-card--small",
    enjeuxComplets:
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
  const [activeModalItem, setActiveModalItem] = useState<DomaineData | null>(null);

  return (
    <main className="ciat-domains">
      {/* HERO */}
      <section className="domains-hero">
        <div className="hero-copy">
          <span className="eyebrow">
            <span className="eyebrow-line" />
            NOS 7 DOMAINES
          </span>

          <h1>
            Des expertises
            <br />
            au service d’un
            <br />
            <em>avenir durable</em>
          </h1>

          <p className="hero-description">
            Sept domaines complémentaires pour accompagner les talents, soutenir
            l’innovation et répondre aux défis du Sénégal et de l’Afrique de demain.
          </p>

          <a className="editorial-link" href="#domaines">
            Découvrir nos domaines
            <span className="link-arrow">↗</span>
          </a>

          <div className="hero-signature" aria-hidden="true">
            <span>INNOVER</span>
            <span>FORMER</span>
            <span>ENTREPRENDRE</span>
            <span>TRANSFÉRER</span>
          </div>
        </div>

        <div className="hero-visual">
          <div className="hero-photo" />
          <div className="hero-shape hero-shape--one" />
          <div className="hero-shape hero-shape--two" />
          <div className="hero-outline" />
          <span className="hero-index">CIAT / 07</span>
        </div>
      </section>

      {/* DOMAINES */}
      <section className="domains-section" id="domaines">
        <div className="domains-intro">
          <div>
            <span className="section-kicker">NOS DOMAINES D’EXPERTISE</span>
            <h2>
              Des compétences multiples.
              <br />
              <em>Une ambition commune.</em>
            </h2>
          </div>

          <p>
            Chaque domaine constitue un champ d’application pour développer
            des compétences de pointe, expérimenter des prototypes industriels et
            faire émerger des solutions concrètes pour le Sénégal.
          </p>

          <Link href="/portail/incubateur" className="discover-link">
            Explorer l&apos;incubateur <span>↗</span>
          </Link>
        </div>

        <div className="domains-grid">
          {domains.map((domain) => (
            <article
              className={`domain-card ${domain.className}`}
              key={domain.number}
              onClick={() => setActiveModalItem(domain)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  setActiveModalItem(domain);
                }
              }}
              aria-label={`Ouvrir le détail du domaine ${domain.number} : ${domain.title}`}
            >
              <div
                className="domain-image"
                style={{ backgroundImage: `url("${domain.image}")` }}
                role="img"
                aria-label={`Photographie illustrative : ${domain.title}`}
              >
                <span className="domain-image-number">{domain.number}</span>
              </div>

              <div className="domain-content">
                <span className="domain-number">{domain.number}</span>
                <h3>{domain.title}</h3>
                <p>{domain.description}</p>
                <button
                  type="button"
                  className="domain-link cursor-pointer bg-transparent border-0 p-0 text-left"
                  onClick={(e) => {
                    e.stopPropagation();
                    setActiveModalItem(domain);
                  }}
                  aria-label={`En savoir plus sur ${domain.title}`}
                >
                  En savoir plus <span>↗</span>
                </button>
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* BANDEAU FINAL */}
      <section className="domains-cta" id="contact">
        <div className="cta-copy">
          <span className="section-kicker">DU POTENTIEL À L’ACTION</span>
          <h2>
            Les idées prennent forme.
            <br />
            <em>Les solutions prennent vie.</em>
          </h2>
          <p>
            Découvrez le rôle du CIAT dans l’accompagnement de l’innovation,
            le prototypage d&apos;excellence et le transfert technologique vers l&apos;industrie.
          </p>
          <Link className="cta-button" href="/portail/ciat">
            Découvrir le CIAT <span>↗</span>
          </Link>
        </div>

        <div className="cta-visual">
          <div className="cta-photo" />
          <div className="cta-curve cta-curve--one" />
          <div className="cta-curve cta-curve--two" />
          <span className="cta-caption">INNOVATION · APPLICATION · TRANSFERT</span>
        </div>
      </section>

      {/* MODALE LIGHTBOX : DÉTAIL COMPLET DU DOMAINE AU CLIC */}
      {activeModalItem && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 sm:p-6 backdrop-blur-sm"
          onClick={() => setActiveModalItem(null)}
        >
          <div
            className="relative max-w-2xl w-full bg-[#FAF7F2] rounded-3xl overflow-hidden shadow-2xl border border-white/20 text-[#24140D]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Bouton Fermer */}
            <button
              type="button"
              onClick={() => setActiveModalItem(null)}
              aria-label="Fermer la modale"
              className="absolute top-4 right-4 z-20 h-9 w-9 rounded-full bg-black/60 hover:bg-black text-white flex items-center justify-center transition-colors cursor-pointer text-sm font-bold"
            >
              ✕
            </button>

            {/* En-tête avec image */}
            <div
              className="relative h-48 sm:h-56 w-full bg-cover bg-center"
              style={{ backgroundImage: `url("${activeModalItem.image}")` }}
            >
              <div className="absolute inset-0 bg-gradient-to-t from-[#24140D] via-[#24140D]/40 to-transparent" />
              <div className="absolute bottom-4 left-6 right-6 text-white">
                <span className="text-xs font-mono font-bold tracking-widest text-[#C99A68] uppercase">
                  DOMAINE {activeModalItem.number}
                </span>
                <h3 className="text-xl sm:text-2xl font-bold font-[family-name:var(--font-title)] text-white mt-1 leading-snug">
                  {activeModalItem.title}
                </h3>
              </div>
            </div>

            {/* Contenu technique détaillé */}
            <div className="p-6 sm:p-8 space-y-6 max-h-[60vh] overflow-y-auto">
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-[#612D10] mb-2 font-[family-name:var(--font-title)]">
                  Enjeux stratégiques & mission
                </h4>
                <p className="text-sm text-[#4A3B32] leading-relaxed">
                  {activeModalItem.enjeuxComplets}
                </p>
              </div>

              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-[#612D10] mb-2.5 font-[family-name:var(--font-title)]">
                  Axes prioritaires de recherche & développement
                </h4>
                <ul className="space-y-2">
                  {activeModalItem.axes.map((axe, idx) => (
                    <li key={idx} className="flex items-start gap-2.5 text-xs sm:text-sm text-[#24140D]">
                      <span className="h-5 w-5 rounded-full bg-[#C99A68]/20 text-[#612D10] flex items-center justify-center shrink-0 text-xs font-bold mt-0.5">
                        ✓
                      </span>
                      <span>{axe}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-[#E8DFD3]">
                <div className="bg-white p-4 rounded-xl border border-[#E8DFD3]">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#8C7A6D] block mb-1">
                    Atelier & Laboratoire associé
                  </span>
                  <p className="text-xs sm:text-sm font-semibold text-[#24140D]">
                    {activeModalItem.atelier}
                  </p>
                </div>

                <div className="bg-white p-4 rounded-xl border border-[#E8DFD3]">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#8C7A6D] block mb-1">
                    Exemples de prototypes
                  </span>
                  <div className="flex flex-wrap gap-1.5 mt-1">
                    {activeModalItem.prototypes.map((proto, idx) => (
                      <span
                        key={idx}
                        className="text-[11px] px-2 py-0.5 rounded-md bg-[#FAF7F2] border border-[#E8DFD3] text-[#612D10] font-medium"
                      >
                        {proto}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Call to action de la modale */}
              <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3">
                <Link
                  href="/portail/incubateur"
                  className="w-full sm:w-auto text-center rounded-xl bg-[#612D10] hover:bg-[#24140D] text-white px-5 py-2.5 text-xs font-bold transition-all shadow-sm"
                >
                  Déposer un projet dans cette filière →
                </Link>
                <button
                  type="button"
                  onClick={() => setActiveModalItem(null)}
                  className="text-xs font-semibold text-[#8C7A6D] hover:text-[#24140D] cursor-pointer"
                >
                  Fermer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
