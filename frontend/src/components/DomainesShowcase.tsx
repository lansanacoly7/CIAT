"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";

interface DomaineItem {
  id: number;
  code: string;
  nom: string;
  description: string;
  photo: string;
  isDark?: boolean;
  accentColor?: string;
  enjeuxComplets: string;
  axes: string[];
  prototypes: string[];
  atelier: string;
}

const DOMAINES: DomaineItem[] = [
  // LIGNE 1 : 3 CARTES
  {
    id: 1,
    code: "01",
    nom: "TIC, numérique, intelligence artificielle et données",
    description:
      "Développer des solutions numériques et des systèmes intelligents pour une société plus connectée et plus performante.",
    photo: "/images/domaine_01_tic.jpg",
    isDark: true,
    enjeuxComplets:
      "Souveraineté numérique, valorisation des données nationales, modèles d'intelligence artificielle adaptés aux langues locales (Wolof, Pulaar, Sérère) et cybersécurité des infrastructures critiques.",
    axes: [
      "Intelligence artificielle embarquée & vision par ordinateur",
      "Plateformes logicielles décentralisées et cloud souverain",
      "Traitement automatique du langage naturel (NLP)",
    ],
    prototypes: ["SunuAgri AI", "Jumeaux numériques ISEP", "Guichet unique communal"],
    atelier: "Laboratoire Calcul Haute Performance & IA",
  },
  {
    id: 2,
    code: "02",
    nom: "Mécanique, fabrication et maintenance",
    description:
      "Accompagner la montée en compétences et le développement d’une industrie locale compétitive et durable.",
    photo: "/images/domaine_02_meca.jpg",
    isDark: false,
    accentColor: "#C99A68",
    enjeuxComplets:
      "Usinage numérique de précision, fabrication additive et conception assistée par ordinateur (CAO/FAO) pour substituer les pièces de rechange importées.",
    axes: [
      "Centres d'usinage CNC 4 et 5 axes haute précision",
      "Découpe laser industrielle et gravure de profilés",
      "Maintenance prédictive industrielle et rétro-ingénierie",
    ],
    prototypes: ["Fraiseuse CNC 4.0", "Presse oléagineuse compacte", "Bancs d'essai industriels"],
    atelier: "FabLab 4.0 & Ateliers Usinage Lourd",
  },
  {
    id: 3,
    code: "03",
    nom: "Agriculture, transformation et environnement",
    description:
      "Soutenir l’innovation agricole et la valorisation des ressources naturelles pour une meilleure sécurité alimentaire et environnementale.",
    photo: "/images/domaine_03_agri.jpg",
    isDark: false,
    accentColor: "#6A8B5C",
    enjeuxComplets:
      "Modernisation de l'agriculture sahélienne, irrigation intelligente économe en eau, réduction des pertes post-récolte et valorisation des bio-ressources.",
    axes: [
      "Irrigation goutte-à-goutte automatisée par capteurs IoT",
      "Serres hydroponiques bioclimatiques basse consommation",
      "Séchoirs solaires hybrides et conservation agroalimentaire",
    ],
    prototypes: ["AgriSol IoT", "Éco-Séchoir Hybride", "SmartIrrig Saloum"],
    atelier: "Serres Expérimentales & Lab Bio-Industries",
  },

  // LIGNE 2 : 4 CARTES
  {
    id: 4,
    code: "04",
    nom: "Énergie, efficacité énergétique et énergies renouvelables",
    description:
      "Promouvoir des solutions énergétiques propres et accessibles pour un développement durable.",
    photo: "/images/domaine_04_energie.jpg",
    isDark: false,
    accentColor: "#D9822B",
    enjeuxComplets:
      "Valorisation du fort gisement solaire du Sénégal, micro-réseaux ruraux intelligents (microgrids) et bancs d'essai de certification photovoltaïque.",
    axes: [
      "Caractérisation et tests d'endurance de modules solaires",
      "Gestion intelligente de micro-réseaux autonomes",
      "Contrôleurs de charge et stockage hybride par batteries",
    ],
    prototypes: ["SunuGrid Micro-Réseau", "Éolienne multipale locale", "Bancs solaires"],
    atelier: "Plateforme Solaire Extérieure & Laboratoire Énergies",
  },
  {
    id: 5,
    code: "05",
    nom: "Pharmaceutique et biomédical",
    description:
      "Renforcer l’innovation en santé pour répondre aux besoins des populations et améliorer la qualité de vie.",
    photo: "/images/domaine_05_sante.jpg",
    isDark: false,
    accentColor: "#C25E5E",
    enjeuxComplets:
      "Fabrication locale de dispositifs médicaux vitaux réparables, télémédecine décentralisée pour postes de santé ruraux et pharmacopée validée.",
    axes: [
      "Valises solaires de télédiagnostic médical pour brousse",
      "Incubateurs néonataux robustes et thermorégulés low-cost",
      "Procédés d'extraction standardisés pour pharmacopée locale",
    ],
    prototypes: ["TéléDiag Rufisque", "Incubateur néonatal rural", "Hydrogel Moringa certifié"],
    atelier: "Laboratoire Dispositifs Médicaux & Chimie Bio",
  },
  {
    id: 6,
    code: "06",
    nom: "Éducation, formation professionnelle et insertion",
    description:
      "Former les talents d’aujourd’hui et de demain pour favoriser l’employabilité et l’entrepreneuriat.",
    photo: "/images/domaine_06_education.jpg",
    isDark: false,
    accentColor: "#7B6199",
    enjeuxComplets:
      "Transformation de l'apprentissage technique par la réalité virtuelle, jumeaux numériques d'ateliers et plateformes d'insertion professionnelle certifiée.",
    axes: [
      "Simulateurs immersifs VR d'usinage et soudure industrielle",
      "Plateformes d'apprentissage hybride pour filières féminines",
      "Matching prédictif des diplômés de l'ISEP avec les entreprises",
    ],
    prototypes: ["Simulateur VR Usinage", "Plateforme Insertion Métiers", "Kit robotique lycées"],
    atelier: "Centre Immersif & Laboratoire Réalité Virtuelle",
  },
  {
    id: 7,
    code: "07",
    nom: "Services aux collectivités, entrepreneuriat et incubation",
    description:
      "Soutenir les initiatives locales et accompagner la création d’entreprises innovantes et responsables.",
    photo: "/images/domaine_07_services.jpg",
    isDark: false,
    accentColor: "#D18838",
    enjeuxComplets:
      "Modernisation des services municipaux, optimisation de la logistique du dernier kilomètre et traçabilité des recettes fiscales communales.",
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
    <div className="bg-[#FAF7F2] text-[#24140D] min-h-screen font-sans antialiased selection:bg-[#C99A68]/30">
      {/* =====================================================================
       * SECTION 1 : HERO CINÉMATIQUE HAUT DE PAGE (CONFORME À LA MAQUETTE)
       * Fond biseauté marron foncé à gauche + Photo chercheuse à droite
       * ===================================================================== */}
      <section className="relative w-full min-h-[480px] sm:min-h-[520px] lg:min-h-[560px] bg-[#24140D] text-white overflow-hidden flex items-center">
        {/* Photo de droite : chercheuse africaine en laboratoire (crop mockup HD) */}
        <div className="absolute top-0 right-0 bottom-0 w-full lg:w-[56%] z-0 overflow-hidden">
          <Image
            src="/images/domaines_hero_researcher.jpg"
            alt="Chercheuse et ingénieurs en laboratoire de mécatronique et électronique au CIAT Diamniadio"
            fill
            priority
            className="object-cover object-center"
          />

          {/* Dégradé de fusion avec la partie gauche sombre */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#24140D] via-transparent to-transparent lg:bg-gradient-to-r lg:from-[#24140D] lg:via-[#24140D]/40 lg:to-transparent" />

          {/* Mots-clés verticaux flottants en haut à droite (conforme maquette) */}
          <div className="absolute top-8 right-8 z-10 hidden sm:flex flex-col items-end gap-1.5 text-right font-sans text-[11px] font-bold tracking-[0.25em] text-white/90 uppercase drop-shadow-md">
            <span>INNOVER</span>
            <div className="w-8 h-[1px] bg-white/40 my-0.5" />
            <span>FORMER</span>
            <div className="w-8 h-[1px] bg-white/40 my-0.5" />
            <span>ENTREPRENDRE</span>
            <div className="w-8 h-[1px] bg-white/40 my-0.5" />
            <span>TRANSFÉRER</span>
          </div>
        </div>

        {/* Partie gauche : Titre monumental et descriptif narratif */}
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20 w-full">
          <div className="max-w-xl lg:max-w-xl">
            {/* Trait et label supérieur */}
            <div className="inline-flex items-center gap-3 text-xs font-bold tracking-[0.25em] text-[#C99A68] uppercase mb-4">
              <span>NOS 7 DOMAINES</span>
              <span className="w-12 h-[1px] bg-[#C99A68]" />
            </div>

            {/* Titre monumental en Fraunces serif */}
            <h1 className="text-3xl sm:text-5xl lg:text-[52px] font-serif font-bold text-white tracking-tight leading-[1.12]">
              7 domaines
              <br />
              d’expertise au service
              <br />
              d’un <span className="italic text-[#C99A68]">avenir durable</span>
            </h1>

            {/* Paragraphe narratif */}
            <p className="mt-5 text-sm sm:text-base text-white/85 leading-relaxed font-normal max-w-lg">
              Le CIAT intervient dans 7 domaines stratégiques pour accompagner les talents,
              soutenir l’innovation et répondre aux défis du Sénégal et de l’Afrique de demain.
            </p>

            {/* Bouton d'action Découvrir le CIAT */}
            <div className="mt-8 flex items-center gap-4">
              <Link
                href="/portail/ciat"
                className="inline-flex items-center gap-3 text-xs sm:text-sm font-semibold text-white group cursor-pointer"
              >
                <span className="h-9 w-9 rounded-full border border-white/40 group-hover:border-[#C99A68] bg-white/10 group-hover:bg-[#C99A68] group-hover:text-[#24140D] flex items-center justify-center transition-all shadow-md">
                  <span className="text-[11px] font-bold ml-0.5">▶</span>
                </span>
                <span className="underline underline-offset-4 group-hover:text-[#C99A68] transition-colors">
                  Découvrir le CIAT →
                </span>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* =====================================================================
       * SECTION 2 : LES 7 CARTES DE DOMAINES (CONFORME À LA MAQUETTE)
       * Ligne 1 (3 cartes dont la 01 dark) + Ligne 2 (4 cartes colonnes)
       * ===================================================================== */}
      <section id="catalogue-domaines" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20">
        {/* En-tête de section avec titre et bouton "Tout découvrir" */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 pb-10 border-b border-[#E8DFD3]">
          <div>
            <span className="text-xs font-bold uppercase tracking-[0.2em] text-[#8C7A6D] block mb-2">
              NOS 7 DOMAINES
            </span>
            <p className="text-lg sm:text-xl lg:text-2xl font-serif text-[#24140D] font-normal max-w-2xl leading-snug">
              Des compétences, des infrastructures et un accompagnement sur mesure pour transformer
              les idées en solutions concrètes.
            </p>
          </div>

          <div className="shrink-0">
            <Link
              href="/portail/incubateur"
              className="inline-flex items-center gap-2.5 rounded-full border border-[#D5C9BB] bg-white hover:bg-[#FAF7F2] px-5 py-2.5 text-xs font-bold text-[#612D10] transition-all shadow-2xs hover:border-[#612D10]"
            >
              <span>Tout découvrir</span>
              <span className="h-5 w-5 rounded-full bg-[#612D10] text-white flex items-center justify-center text-[10px]">
                →
              </span>
            </Link>
          </div>
        </div>

        {/* LIGNE 1 : 3 CARTES (Card 01 Sombre en vedette + Cards 02 & 03 claires) */}
        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8 items-stretch">
          {DOMAINES.slice(0, 3).map((item) => {
            return (
              <article
                key={item.id}
                className={`relative rounded-3xl overflow-hidden flex flex-col justify-between transition-all duration-300 shadow-sm hover:shadow-xl border ${
                  item.isDark
                    ? "bg-[#25150E] text-white border-[#3F261B]"
                    : "bg-white text-[#24140D] border-[#E8DFD3] hover:border-[#C99A68]/70"
                }`}
              >
                {/* Photo de la carte */}
                <div className="relative aspect-[16/10] w-full overflow-hidden bg-black/20">
                  <Image
                    src={item.photo}
                    alt={item.nom}
                    fill
                    sizes="(max-width: 768px) 100vw, 33vw"
                    className="object-cover object-center transition-transform duration-500 ease-out hover:scale-105"
                  />
                  {/* Dégradé inférieur subtil de transition */}
                  <div
                    className={`absolute inset-0 pointer-events-none ${
                      item.isDark
                        ? "bg-gradient-to-t from-[#25150E] via-transparent to-transparent"
                        : "bg-gradient-to-t from-white/90 via-transparent to-transparent"
                    }`}
                  />
                </div>

                {/* Corps de texte de la carte */}
                <div className="p-6 sm:p-7 flex-1 flex flex-col justify-between">
                  <div>
                    {/* Numéro et indicateur discret */}
                    <div className="flex items-center gap-2 mb-3">
                      <span
                        className={`font-mono text-sm font-bold ${
                          item.isDark ? "text-white/80" : "text-[#8C7A6D]"
                        }`}
                      >
                        {item.code}
                      </span>
                      <span
                        className={`text-xs ${
                          item.isDark ? "text-[#C99A68]" : "text-[#C99A68]"
                        }`}
                      >
                        •
                      </span>
                    </div>

                    {/* Titre du domaine */}
                    <h2
                      className={`text-lg sm:text-xl font-bold leading-snug tracking-tight font-serif ${
                        item.isDark ? "text-white" : "text-[#24140D]"
                      }`}
                    >
                      {item.nom}
                    </h2>

                    {/* Description fidèle à la maquette */}
                    <p
                      className={`mt-3 text-xs sm:text-sm leading-relaxed font-normal ${
                        item.isDark ? "text-white/80" : "text-[#6B5A4E]"
                      }`}
                    >
                      {item.description}
                    </p>
                  </div>

                  {/* Bouton En savoir plus */}
                  <div className="mt-6 pt-4 border-t border-black/5">
                    <button
                      type="button"
                      onClick={() => setActiveModalItem(item)}
                      className={`inline-flex items-center gap-1.5 text-xs font-bold transition-all cursor-pointer ${
                        item.isDark
                          ? "text-[#C99A68] hover:text-white"
                          : "text-[#612D10] hover:text-[#C99A68]"
                      }`}
                    >
                      <span>En savoir plus</span>
                      <span>→</span>
                    </button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>

        {/* LIGNE 2 : 4 CARTES (Cards 04, 05, 06, 07 en 4 colonnes) */}
        <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 items-stretch">
          {DOMAINES.slice(3, 7).map((item) => {
            return (
              <article
                key={item.id}
                className="bg-white rounded-3xl overflow-hidden flex flex-col justify-between border border-[#E8DFD3] hover:border-[#C99A68]/70 shadow-sm hover:shadow-xl transition-all duration-300"
              >
                {/* Photo de la carte */}
                <div className="relative aspect-[16/11] w-full overflow-hidden bg-black/10">
                  <Image
                    src={item.photo}
                    alt={item.nom}
                    fill
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                    className="object-cover object-center transition-transform duration-500 ease-out hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-white/85 via-transparent to-transparent pointer-events-none" />
                </div>

                {/* Corps de texte */}
                <div className="p-5 sm:p-6 flex-1 flex flex-col justify-between">
                  <div>
                    {/* Numéro */}
                    <div className="flex items-center gap-2 mb-2.5">
                      <span className="font-mono text-sm font-bold text-[#8C7A6D]">
                        {item.code}
                      </span>
                      <span className="text-xs text-[#C99A68]">•</span>
                    </div>

                    {/* Titre du domaine */}
                    <h2 className="text-base font-bold text-[#24140D] font-serif leading-snug tracking-tight">
                      {item.nom}
                    </h2>

                    {/* Description concise */}
                    <p className="mt-2.5 text-xs text-[#6B5A4E] leading-relaxed font-normal">
                      {item.description}
                    </p>
                  </div>

                  {/* Bouton En savoir plus */}
                  <div className="mt-5 pt-3.5 border-t border-[#F1E9DE]">
                    <button
                      type="button"
                      onClick={() => setActiveModalItem(item)}
                      className="inline-flex items-center gap-1.5 text-xs font-bold text-[#612D10] hover:text-[#C99A68] transition-colors cursor-pointer"
                    >
                      <span>En savoir plus</span>
                      <span>→</span>
                    </button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </section>

      {/* =====================================================================
       * SECTION 3 : BANDEAU BAS "UN ÉCOSYSTÈME UNIQUE" (CONFORME À LA MAQUETTE)
       * Fond sombre gauche + Bâtiment CIAT avec palmiers et logo bronze à droite
       * ===================================================================== */}
      <section className="relative w-full bg-[#180E08] text-white overflow-hidden border-t border-[#2F1C12]">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 items-stretch min-h-[380px] sm:min-h-[420px]">
          {/* Colonne gauche (6 cols) : Contenu institutionnel */}
          <div className="lg:col-span-6 p-8 sm:p-12 lg:p-16 flex flex-col justify-center z-10">
            <span className="text-[11px] font-bold uppercase tracking-[0.25em] text-[#C99A68] block mb-3">
              UN ÉCOSYSTÈME UNIQUE
            </span>

            <h2 className="text-2xl sm:text-4xl font-serif font-bold text-white tracking-tight leading-tight">
              Des idées d’aujourd’hui,
              <br />
              les <span className="italic text-[#C99A68]">solutions de demain</span>
            </h2>

            <p className="mt-4 text-xs sm:text-sm text-white/80 leading-relaxed max-w-lg font-normal">
              Le CIAT réunit talents, chercheurs, entreprises et partenaires pour transformer les défis
              en opportunités et bâtir un avenir durable pour le Sénégal et l’Afrique.
            </p>

            <div className="mt-8">
              <Link
                href="/galerie"
                className="inline-flex items-center gap-2 rounded-full border border-white/40 bg-white/10 hover:bg-[#C99A68] hover:text-[#24140D] hover:border-[#C99A68] px-6 py-3 text-xs font-bold text-white transition-all shadow-md active:scale-95"
              >
                <span>Découvrir nos projets</span>
                <span>→</span>
              </Link>
            </div>
          </div>

          {/* Colonne droite (6 cols) : Photographie du bâtiment moderne avec logo CIAT & palmiers */}
          <div className="lg:col-span-6 relative min-h-[260px] sm:min-h-[340px] lg:min-h-full overflow-hidden">
            <Image
              src="/images/domaines_ecosystem_building.jpg"
              alt="Façade moderne du CIAT Diamniadio avec palmiers et logo institutionnel en bronze"
              fill
              sizes="(max-width: 1024px) 100vw, 50vw"
              className="object-cover object-center"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#180E08] via-transparent to-transparent lg:bg-gradient-to-r lg:from-[#180E08] lg:via-transparent lg:to-transparent pointer-events-none" />
          </div>
        </div>
      </section>

      {/* =====================================================================
       * MODALE LIGHTBOX : DÉTAIL COMPLET DU DOMAINE AU CLIC SUR "EN SAVOIR PLUS"
       * ===================================================================== */}
      {activeModalItem && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 sm:p-6 backdrop-blur-sm"
          onClick={() => setActiveModalItem(null)}
        >
          <div
            className="relative max-w-2xl w-full bg-[#FAF7F2] rounded-3xl overflow-hidden shadow-2xl border border-white/20"
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

            {/* Photo haute définition du domaine */}
            <div className="relative aspect-[16/8] w-full bg-[#24140D] overflow-hidden">
              <Image
                src={activeModalItem.photo}
                alt={activeModalItem.nom}
                fill
                className="object-cover object-center"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#24140D]/90 via-transparent to-transparent" />
              <div className="absolute bottom-4 left-6 text-white">
                <span className="font-mono text-xs font-bold text-[#C99A68] block">
                  PÔLE 0{activeModalItem.id}
                </span>
                <h3 className="text-xl font-bold font-serif">{activeModalItem.nom}</h3>
              </div>
            </div>

            {/* Détails & Spécifications techniques */}
            <div className="p-6 sm:p-8 space-y-5">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#612D10] block mb-1">
                  Enjeux &amp; Vision Nationale
                </span>
                <p className="text-xs sm:text-sm text-[#5C4A3E] leading-relaxed">
                  {activeModalItem.enjeuxComplets}
                </p>
              </div>

              <div className="pt-3 border-t border-[#E8DFD3]">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#612D10] block mb-2">
                  Axes Technologiques Prioritaires
                </span>
                <ul className="space-y-1.5">
                  {activeModalItem.axes.map((axe, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-xs text-[#5C4A3E]">
                      <span className="h-1.5 w-1.5 rounded-full bg-[#612D10] mt-1.5 shrink-0" />
                      <span>{axe}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="pt-3 border-t border-[#E8DFD3]">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#612D10] block mb-2">
                  Prototypes &amp; Projets Incubés au CIAT
                </span>
                <div className="flex flex-wrap gap-2">
                  {activeModalItem.prototypes.map((proto, idx) => (
                    <span
                      key={idx}
                      className="px-3 py-1 rounded-lg bg-white border border-[#E0D7CC] text-xs font-medium text-[#24140D]"
                    >
                      {proto}
                    </span>
                  ))}
                </div>
              </div>

              <div className="pt-3 border-t border-[#E8DFD3] text-xs text-[#8C7A6D]">
                <strong>Atelier associé : </strong> {activeModalItem.atelier}
              </div>

              {/* Actions de la modale */}
              <div className="pt-4 border-t border-[#E8DFD3] flex items-center justify-between">
                <Link
                  href="/connexion?next=/incubateur"
                  className="rounded-xl bg-[#612D10] hover:bg-[#7D3A15] text-white px-5 py-2.5 text-xs font-bold transition-all shadow-xs"
                >
                  Candidater sur ce pôle →
                </Link>

                <button
                  type="button"
                  onClick={() => setActiveModalItem(null)}
                  className="text-xs font-bold text-[#612D10] hover:underline cursor-pointer"
                >
                  Fermer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
