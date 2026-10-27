/* eslint-disable @next/next/no-img-element */
"use client";

import React from "react";
import Link from "next/link";
import {
  ArrowRight,
  Search,
  Landmark,
  Sprout,
  ChartNoAxesColumnIncreasing,
  BrainCircuit,
  FileText,
  Images,
  HandHelping,
  Network,
  HeartPulse,
  MapPin,
  Phone,
  Mail,
  X,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";

const modules = [
  {
    icon: Landmark,
    title: "Portail Institutionnel",
    description: "Vitrine officielle, gouvernance, filières et actualités institutionnelles.",
    href: "/portail/ciat",
  },
  {
    icon: Sprout,
    title: "Gestion Incubateur",
    description: "Parcours en 5 jalons, suivi des cohortes, mentors et accompagnement.",
    href: "/incubateur",
  },
  {
    icon: ChartNoAxesColumnIncreasing,
    title: "Tableau Décisionnel",
    description: "Indicateurs d'impact, analyses d'avancement et pilotage stratégique.",
    href: "/incubateur",
  },
  {
    icon: BrainCircuit,
    title: "Assistant IA",
    description: "Orientation intelligente, coaching méthodologique et support personnalisé.",
    href: "/assistant",
  },
  {
    icon: FileText,
    title: "Générateur de Documents",
    description: "Attestations officielles, fiches projets et rapports structurés.",
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
    image:
      "https://images.unsplash.com/photo-1586771107445-d3ca888129ff?auto=format&fit=crop&w=700&q=85",
    href: "/galerie",
  },
  {
    category: "Fabrication 4.0",
    title: "Fraiseuse CNC 4.0 : Usinage de précision pour pièces mécaniques locales",
    image:
      "https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=700&q=85",
    href: "/galerie",
  },
  {
    category: "Santé & Biomédical",
    title: "Moniteur Médical Connecté : Télésurveillance des constantes physiologiques",
    image:
      "https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&w=700&q=85",
    href: "/galerie",
  },
  {
    category: "Énergies Propres",
    title: "Éco-Séchoir Hybride : Optimisation thermique et séchage agroalimentaire",
    image:
      "https://images.unsplash.com/photo-1509391365360-2e959784a276?auto=format&fit=crop&w=700&q=85",
    href: "/galerie",
  },
];

const benefits = [
  { icon: HandHelping, label: "Accompagnement personnalisé" },
  { icon: Network, label: "Accès aux ressources et expertises" },
  { icon: HeartPulse, label: "Partenariats et collaborations" },
  { icon: Sprout, label: "Impact durable" },
];

function LinkedinIcon({ size = 17 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
      <rect x="2" y="9" width="4" height="12" />
      <circle cx="4" cy="4" r="2" />
    </svg>
  );
}

function YoutubeIcon({ size = 18 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 0 0-1.94 2A29 29 0 0 0 1 11.75a29 29 0 0 0 .46 5.33A2.78 2.78 0 0 0 3.4 19c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 0 0 1.94-2 29 29 0 0 0 .46-5.25 29 29 0 0 0-.46-5.33z" />
      <polygon points="9.75 15.02 15.5 11.75 9.75 8.48 9.75 15.02" fill="currentColor" />
    </svg>
  );
}

function FacebookIcon({ size = 17 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
    </svg>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return <span className="eyebrow">{children}</span>;
}

function Brand({ light = false }: { light?: boolean }) {
  return (
    <Link className={`brand ${light ? "brand-light" : ""}`} href="/">
      <span className="brand-symbol">
        <span />
        <span />
        <span />
      </span>
      <span className="brand-copy">
        <strong>CIAT</strong>
        <small>
          Centre d’Innovation, d’Application
          <br />
          et de Transfert
          <br />
          ISEP Amadou Trawaré
        </small>
      </span>
    </Link>
  );
}

function Button({
  children,
  outline = false,
  href = "#",
  onClick,
}: {
  children: React.ReactNode;
  outline?: boolean;
  href?: string;
  onClick?: () => void;
}) {
  return (
    <Link
      className={`button ${outline ? "button-outline" : ""}`}
      href={href}
      onClick={onClick}
    >
      {children}
      <ArrowRight size={15} strokeWidth={1.7} />
    </Link>
  );
}

export default function Home() {
  const { user } = useAuth();

  return (
    <main>
      {/* NAVIGATION */}
      <header className="site-header">
        <div className="header-inner">
          <Brand />

          <nav className="navigation">
            {[
              { label: "Accueil", href: "/" },
              { label: "À propos", href: "/portail/ciat" },
              { label: "Incubateur", href: "/portail/incubateur" },
              { label: "Innovations", href: "/galerie" },
              { label: "Actualités", href: "/portail/actualites" },
              { label: "Ressources", href: "/portail/documents" },
              { label: "Contact", href: "/portail/contact" },
            ].map((item, index) => (
              <Link
                href={item.href}
                key={item.label}
                className={index === 0 ? "active" : ""}
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="header-actions">
            <Link
              href="/galerie"
              className="search-button"
              aria-label="Rechercher des projets et innovations"
            >
              <Search size={18} />
            </Link>
            {user ? (
              <Button href="/incubateur">Mon Espace</Button>
            ) : (
              <Button href="/connexion?next=/incubateur/candidatures/nouvelle">
                Candidater
              </Button>
            )}
          </div>
        </div>
      </header>

      {/* HERO */}
      <section className="hero">
        <div className="hero-copy">
          <SectionLabel>INNOVER&nbsp; · &nbsp;INCUBER&nbsp; · &nbsp;TRANSFÉRER</SectionLabel>

          <h1>
            Le CIAT,
            <span>un écosystème au service</span>
            <span>de l’innovation et de</span>
            <span>l’entrepreneuriat</span>
          </h1>

          <p>
            Le Centre d’Innovation, d’Application et de Transfert accompagne
            les porteurs de projets, les startups et les acteurs de
            l’innovation pour transformer les idées en solutions concrètes au sein
            de l’ISEP Amadou Trawaré de Diamniadio.
          </p>

          <div className="hero-buttons">
            <Button href="/portail/ciat">Découvrir le CIAT</Button>
            <Button outline href="/galerie">Nos projets incubés</Button>
          </div>
        </div>

        <div className="hero-visual">
          <img
            src="/images/campus-isep.png"
            alt="Campus de l’ISEP Amadou Trawaré de Diamniadio"
          />
          <div className="hero-caption">
            <span>Innovation</span>
            <span>Application</span>
            <span>Transfert</span>
          </div>
        </div>
      </section>

      {/* CIAT 360 — rondel central et six modules */}
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
          <Button href="/portail/ciat#modules">Découvrir tous les modules</Button>
        </div>

        <div className="ciat360-layout">
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

          <div className="ciat360-wheel" aria-label="Rondel CIAT 360">
            <div className="ciat360-wheel-outer">
              <div className="ciat360-wheel-dashes" />
              <span className="ciat360-orbit-dot dot-one" />
              <span className="ciat360-orbit-dot dot-two" />
              <span className="ciat360-orbit-dot dot-three" />
              <span className="ciat360-orbit-dot dot-four" />
              <div className="ciat360-wheel-inner">
                <div className="ciat360-wheel-center">
                  <span className="ciat360-center-mark">C</span>
                  <span className="ciat360-center-name">CIAT</span>
                  <span className="ciat360-center-degree">360°</span>
                  <span className="ciat360-center-caption">UNE VISION GLOBALE</span>
                </div>
              </div>
            </div>
          </div>

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

      {/* À PROPOS */}
      <section className="about">
        <div className="about-visual">
          <img
            src="/images/ciat-depot-innovation.jpg"
            alt="Atelier technologique et prototypage au CIAT"
          />
          <div className="image-caption">
            Des idées d’aujourd’hui
            <br />
            aux solutions de demain
          </div>
          <div className="image-decoration" />
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
          <Button outline href="/portail/ciat">En savoir plus</Button>
        </div>

        <div className="benefits">
          {benefits.map((benefit) => {
            const Icon = benefit.icon;
            return (
              <div className="benefit" key={benefit.label}>
                <span className="benefit-icon">
                  <Icon size={20} strokeWidth={1.7} />
                </span>
                <span>{benefit.label}</span>
              </div>
            );
          })}
        </div>
      </section>

      {/* BANDEAU MODULABLE : STATISTIQUES OU PROJETS */}
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

      {/* ACTUALITÉS */}
      <section className="news section-padding">
        <div className="section-heading">
          <div>
            <SectionLabel>ACTUALITÉS & ÉVÉNEMENTS</SectionLabel>
            <h2>Restez informé des dernières actualités</h2>
          </div>
          <Link href="/galerie" className="text-link">
            Voir toutes les actualités <ArrowRight size={16} />
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
                <time>0{index + 1} AVR. 2025</time>
                <h3>{item.title}</h3>
                <ArrowRight className="news-arrow" size={15} />
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* APPEL À L'ACTION */}
      <section className="cta-wrap">
        <div className="cta-icon">
          <Sprout size={28} />
        </div>
        <div className="cta-copy">
          <h2>Vous avez une idée ?</h2>
          <p>Rejoignez l’écosystème et donnez vie à votre projet.</p>
        </div>
        <Button href="/connexion?next=/incubateur/candidatures/nouvelle">Candidater maintenant</Button>
        <div className="cta-decoration">✳</div>
      </section>

      {/* FOOTER */}
      <footer className="site-footer">
        <div className="footer-main">
          <Brand light />

          <div className="footer-contact">
            <p><MapPin size={15} /> Diamniadio, Dakar, Sénégal</p>
            <p><Phone size={15} /> +221 33 860 00 00</p>
            <p><Mail size={15} /> contact@isep-diamniadio.sn</p>
          </div>

          <div className="footer-links">
            <h3>Liens utiles</h3>
            <Link href="/portail/ciat">À propos</Link>
            <Link href="/portail/incubateur">Incubateur</Link>
            <Link href="/galerie">Innovations</Link>
          </div>

          <div className="footer-links">
            <h3>Ressources</h3>
            <Link href="/portail/actualites">Actualités</Link>
            <Link href="/portail/documents">Documents</Link>
            <Link href="/portail/contact">Contact</Link>
          </div>

          <div className="footer-social">
            <h3>Suivez-nous</h3>
            <div>
              <a
                href="https://linkedin.com"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="LinkedIn"
              >
                <LinkedinIcon size={17} />
              </a>
              <a
                href="https://twitter.com"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="X"
              >
                <X size={17} />
              </a>
              <a
                href="https://youtube.com"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="YouTube"
              >
                <YoutubeIcon size={18} />
              </a>
              <a
                href="https://facebook.com"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Facebook"
              >
                <FacebookIcon size={17} />
              </a>
            </div>
          </div>
        </div>

        <div className="footer-bottom">
          <span>© 2026 CIAT · ISEP Amadou Trawaré de Diamniadio — Tous droits réservés.</span>
          <div>
            <Link href="/mentions-legales">Mentions légales</Link>
            <span>·</span>
            <Link href="/confidentialite">Politique de confidentialité</Link>
          </div>
        </div>
      </footer>
    </main>
  );
}
