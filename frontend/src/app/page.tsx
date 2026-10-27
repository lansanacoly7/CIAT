/* eslint-disable @next/next/no-img-element */
"use client";

import React from "react";
import Link from "next/link";
import {
  ArrowRight,
  Landmark,
  Sprout,
  ChartNoAxesColumnIncreasing,
  BrainCircuit,
  FileText,
  Images,
  HandHelping,
  Network,
  HeartPulse,
} from "lucide-react";
import { ButtonLink } from "@/components/ui";

const modules = [
  {
    icon: Landmark,
    title: "Portail Institutionnel",
    description: "Vitrine officielle, filières prioritaires, actualités et gouvernance.",
    href: "/portail/ciat",
  },
  {
    icon: Sprout,
    title: "Gestion Incubateur",
    description: "Parcours en 5 jalons, suivi des cohortes et mentorat sur-mesure.",
    href: "/incubateur",
  },
  {
    icon: ChartNoAxesColumnIncreasing,
    title: "Tableau Décisionnel",
    description: "Indicateurs d'impact, taux de maturité et pilotage stratégique.",
    href: "/incubateur",
  },
  {
    icon: BrainCircuit,
    title: "Assistant IA",
    description: "Orientation méthodologique, analyse de dossiers et support personnalisé.",
    href: "/assistant",
  },
  {
    icon: FileText,
    title: "Générateur de Documents",
    description: "Attestations officielles, fiches projets et livrables normés.",
    href: "/documents",
  },
  {
    icon: Images,
    title: "Galerie Innovations",
    description: "Showroom des prototypes, bancs d'essai et innovations valorisées.",
    href: "/galerie",
  },
];

const news = [
  {
    category: "Agriculture IoT",
    title: "AgriSol : Station agrométéorologique et irrigation raisonnée pour le Sahel",
    image: "/images/innovations/agrisol-iot.jpg",
    href: "/galerie",
  },
  {
    category: "Fabrication 4.0",
    title: "Fraiseuse CNC 4.0 : Usinage de précision pour pièces mécaniques locales",
    image: "/images/innovations/cnc-4-0.jpg",
    href: "/galerie",
  },
  {
    category: "Santé & Biomédical",
    title: "Moniteur Médical Connecté : Télésurveillance des constantes physiologiques",
    image: "/images/innovations/telemedical-device.jpg",
    href: "/galerie",
  },
  {
    category: "Énergies Propres",
    title: "Éco-Séchoir Hybride : Optimisation thermique et séchage agroalimentaire",
    image: "/images/innovations/eco-sechoir-solaire.jpg",
    href: "/galerie",
  },
];

const benefits = [
  { icon: HandHelping, label: "Accompagnement personnalisé en 5 jalons" },
  { icon: Network, label: "Accès aux ateliers & équipements de pointe" },
  { icon: HeartPulse, label: "Réseau de mentors et partenaires industriels" },
  { icon: Sprout, label: "Impact socio-économique durable au Sénégal" },
];



function SectionLabel({ children }: { children: React.ReactNode }) {
  return <span className="eyebrow">{children}</span>;
}

export default function Home() {
  return (
    <main>
      {/* 1. HERO PLEIN ÉCRAN CINÉMATIQUE */}
      <section className="hero">
        <div className="hero-overlay-gradient" aria-hidden="true" />
        <div className="hero-inner">
          <div className="hero-copy">
            <h1>
              Innover aujourd’hui pour
              <br />
              <span className="hero-highlight-gold">transformer demain</span>
            </h1>

            <p>
              Le CIAT et son incubateur accompagnent les porteurs de projets et
              favorisent l’innovation au service du développement de l’ISEP et
              de son environnement à Diamniadio.
            </p>

            <div className="hero-buttons">
              <ButtonLink href="/portail/ciat" variant="primary">
                Découvrir le CIAT
                <ArrowRight size={16} className="ml-2" />
              </ButtonLink>
              <ButtonLink
                href="/galerie"
                variant="secondary"
                className="!text-white !border-white/40 !bg-white/10 hover:!bg-white/20 backdrop-blur-sm"
              >
                Nos projets incubés
                <ArrowRight size={16} className="ml-2" />
              </ButtonLink>
            </div>
          </div>

          {/* Barre flottante de métriques & ancrage territorial */}
          <div className="hero-glass-kpi">
            <div className="hero-kpi-item">
              <strong>+50</strong>
              <span className="kpi-label">Projets Accompagnés</span>
              <span className="kpi-sub">Idéation, prototypage et maturation</span>
            </div>
            <div className="hero-kpi-item">
              <strong>+20</strong>
              <span className="kpi-label">Startups &amp; Prototypes</span>
              <span className="kpi-sub">Solutions technologiques viables</span>
            </div>
            <div className="hero-kpi-item">
              <strong>7 <span>Filières</span></strong>
              <span className="kpi-label">Domaines Stratégiques</span>
              <span className="kpi-sub">Numérique, Agro, Énergie, Santé</span>
            </div>
            <div className="hero-kpi-item">
              <strong>Diamniadio</strong>
              <span className="kpi-label">Campus ISEP Amadou Trawaré</span>
              <span className="kpi-sub">Ateliers technologiques &amp; FabLab</span>
            </div>
          </div>
        </div>
      </section>

      {/* 3. CIAT 360 — RONDEL CENTRAL ET SIX MODULES */}
      <section className="ecosystem section-padding" id="ciat-360">
        <div className="ecosystem-intro">
          <SectionLabel>NOTRE ÉCOSYSTÈME</SectionLabel>
          <h2>
            CIAT <span>360</span>
          </h2>
          <div className="short-line" />
          <p>
            Une plateforme intégrée qui réunit six modules complémentaires
            pour accompagner chaque étape d’un projet, de l’éclosion de l’idée
            jusqu’au prototypage et au transfert vers l’industrie.
          </p>
          <ButtonLink href="/portail/ciat#modules" variant="secondary">
            Découvrir tous les modules
            <ArrowRight size={15} className="ml-2" />
          </ButtonLink>
        </div>

        <div className="ciat360-layout">
          {/* Modules de gauche (01 à 03) */}
          <div className="ciat360-modules ciat360-modules-left">
            {modules.slice(0, 3).map((module, index) => {
              const Icon = module.icon;
              return (
                <Link className="ciat360-module" href={module.href} key={module.title}>
                  <span className="ciat360-module-icon">
                    <Icon size={22} strokeWidth={1.8} />
                  </span>
                  <span className="ciat360-module-copy">
                    <span className="ciat360-number">0{index + 1}</span>
                    <strong>{module.title}</strong>
                    <span className="ciat360-description">{module.description}</span>
                  </span>
                </Link>
              );
            })}
          </div>

          {/* Rondel central avec symbole officiel CIAT */}
          <div className="ciat360-wheel" aria-label="Rondel CIAT 360">
            <div className="ciat360-wheel-outer">
              <div className="ciat360-wheel-dashes" />
              <span className="ciat360-orbit-dot dot-one" />
              <span className="ciat360-orbit-dot dot-two" />
              <span className="ciat360-orbit-dot dot-three" />
              <span className="ciat360-orbit-dot dot-four" />
              <div className="ciat360-wheel-inner">
                <div className="ciat360-wheel-center">
                  <div className="ciat360-center-emblem">
                    <svg
                      viewBox="0 0 365 415"
                      fill="currentColor"
                      width="30"
                      height="34"
                      aria-hidden="true"
                    >
                      <path
                        d="M 307 197 L 280 211 L 259 225 L 246 237 L 239 247 L 239 334 L 249 333 L 258 330 L 282 319 L 300 307 L 303 304 L 307 297 Z"
                        fillRule="evenodd"
                      />
                      <path
                        d="M 155 157 L 155 323 L 157 325 L 170 330 L 199 336 L 213 337 L 219 336 L 219 202 L 214 195 L 204 186 L 159 158 Z"
                        fillRule="evenodd"
                      />
                      <path
                        d="M 216 93 L 208 95 L 204 97 L 196 103 L 192 108 L 188 115 L 186 122 L 186 134 L 187 139 L 190 146 L 192 149 L 200 157 L 209 162 L 216 164 L 226 164 L 231 163 L 239 160 L 246 155 L 252 148 L 255 142 L 257 136 L 257 121 L 256 117 L 250 106 L 244 100 L 232 94 L 228 93 Z"
                        fillRule="evenodd"
                      />
                      <path
                        d="M 250 16 L 176 16 L 136 28 L 102 46 L 71 71 L 45 101 L 28 129 L 12 172 L 7 208 L 10 252 L 33 311 L 54 339 L 86 367 L 150 396 L 216 401 L 265 390 L 316 362 L 349 329 L 319 307 L 291 330 L 251 348 L 223 353 L 176 349 L 142 336 L 112 315 L 86 282 L 74 253 L 69 198 L 79 158 L 100 123 L 127 96 L 162 76 L 200 67 L 249 70 L 295 89 L 326 49 L 304 35 Z"
                        fillRule="evenodd"
                      />
                    </svg>
                  </div>
                  <span className="ciat360-center-name">CIAT</span>
                  <span className="ciat360-center-degree">360°</span>
                  <span className="ciat360-center-caption">UNE VISION GLOBALE</span>
                </div>
              </div>
            </div>
          </div>

          {/* Modules de droite (04 à 06) */}
          <div className="ciat360-modules ciat360-modules-right">
            {modules.slice(3, 6).map((module, index) => {
              const Icon = module.icon;
              return (
                <Link className="ciat360-module" href={module.href} key={module.title}>
                  <span className="ciat360-module-icon">
                    <Icon size={22} strokeWidth={1.8} />
                  </span>
                  <span className="ciat360-module-copy">
                    <span className="ciat360-number">0{index + 4}</span>
                    <strong>{module.title}</strong>
                    <span className="ciat360-description">{module.description}</span>
                  </span>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* 4. À PROPOS DU CIAT */}
      <section className="about">
        <div className="about-visual">
          <div className="relative w-full max-w-[500px] aspect-[4/3] rounded-3xl overflow-hidden shadow-xl border border-[#EBE4DC] bg-[#FAF7F2]">
            <img
              src="/images/about-lab-students.png"
              alt="Des idées d’aujourd’hui aux solutions de demain — Prototypage et projets au CIAT"
              className="w-full h-full object-cover block"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent pointer-events-none" />
            <div className="absolute bottom-5 left-5 z-10 rounded-2xl bg-[#612D10]/95 px-5 py-3 border border-[#C99A68]/40 shadow-lg backdrop-blur-xs">
              <p className="text-xs sm:text-sm font-bold text-white tracking-tight leading-snug">
                Des idées d&apos;aujourd&apos;hui
              </p>
              <p className="text-[11px] sm:text-xs font-medium text-[#C99A68] mt-0.5">
                aux solutions de demain
              </p>
            </div>
          </div>
        </div>

        <div className="about-copy">
          <SectionLabel>À PROPOS DU CIAT</SectionLabel>
          <h2>
            Un centre d’excellence pour l’innovation et le transfert
            technologique
          </h2>
          <p>
            Implanté au cœur de l’ISEP Amadou Trawaré à Diamniadio, le CIAT
            constitue un environnement dédié à l’innovation, à l’entrepreneuriat
            et à la transformation des idées en solutions concrètes, au service du
            développement économique et social du Sénégal.
          </p>
          <ButtonLink href="/portail/ciat" variant="secondary">
            En savoir plus
            <ArrowRight size={15} className="ml-2" />
          </ButtonLink>
        </div>

        <div className="benefits">
          {benefits.map((benefit) => {
            const Icon = benefit.icon;
            return (
              <div className="benefit" key={benefit.label}>
                <span className="benefit-icon">
                  <Icon size={20} strokeWidth={1.8} />
                </span>
                <span>{benefit.label}</span>
              </div>
            );
          })}
        </div>
      </section>

      {/* 5. BANDEAU D'IMPACT (LE CIAT EN CHIFFRES) */}
      <section className="impact-band">
        <div className="impact-intro">
          <h2>Le CIAT en chiffres</h2>
          <p>Une dynamique au service de l’innovation et de l’entrepreneuriat.</p>
        </div>

        {[
          ["+50", "Projets accompagnés"],
          ["+20", "Startups incubées"],
          ["+10", "Partenaires industriels"],
          ["01", "Objectif : impact durable"],
        ].map(([number, label]) => (
          <div className="impact-item" key={label}>
            <strong>{number}</strong>
            <span>{label}</span>
          </div>
        ))}
      </section>

      {/* 6. ACTUALITÉS & RÉALISATIONS PHARES */}
      <section className="news section-padding">
        <div className="section-heading">
          <div>
            <SectionLabel>ACTUALITÉS & ÉVÉNEMENTS</SectionLabel>
            <h2>Les réalisations phares issues de nos filières</h2>
          </div>
          <Link href="/galerie" className="text-link">
            Voir toutes les innovations <ArrowRight size={16} />
          </Link>
        </div>

        <div className="news-grid">
          {news.map((item, index) => (
            <Link href={item.href} className="news-card" key={item.title}>
              <div className="news-image">
                <img src={item.image} alt={item.title} />
              </div>
              <div className="news-content">
                <span className="category-pill">{item.category}</span>
                <time>0{index + 1} AVR. 2026</time>
                <h3>{item.title}</h3>
                <ArrowRight className="news-arrow" size={16} />
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* 7. BANDEAU D'APPEL À L'ACTION & CANDIDATURE (Section officielle plébiscitée) */}
      <section className="border-t border-[#3d2315] bg-gradient-to-r from-[#24140D] via-[#3D1D10] to-[#24140D] text-white py-16 md:py-20 shadow-inner">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col items-start justify-between gap-8 md:flex-row md:items-center">
            <div className="max-w-2xl space-y-3">
              <h2 className="text-2xl font-extrabold !text-white sm:text-4xl tracking-tight leading-tight">
                Vous avez un projet innovant ou un besoin de prototypage ?
              </h2>
              <p className="text-sm sm:text-base leading-relaxed text-[#EAE0D5]">
                Que vous soyez apprenant de l&apos;ISEP, diplômé en insertion ou entreprise partenaire, 
                le CIAT met à votre disposition ses ateliers technologiques, ses bancs de test et son réseau de mentors à Diamniadio.
              </p>
            </div>

            <div className="flex flex-wrap gap-3.5 shrink-0">
              <ButtonLink
                href="/connexion?next=/incubateur"
                variant="accent"
                className="font-bold text-sm px-6 py-3.5 shadow-xl"
              >
                Déposer une Candidature
              </ButtonLink>
              <ButtonLink
                href="/portail/contact"
                variant="secondary"
                className="!text-white !border-white/50 !bg-white/10 hover:!bg-white/20 text-sm px-5 py-3.5 backdrop-blur-sm"
              >
                Contacter le Secrétariat
              </ButtonLink>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
