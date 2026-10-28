"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import {
  ArrowRight,
  ArrowUpRight,
  Award,
  Calendar,
  CheckCircle2,
  ChevronDown,
  Clock,
  Cpu,
  FileCheck2,
  FolderCheck,
  Scale,
  ShieldCheck,
  Sparkles,
  Users,
  Wrench,
} from "lucide-react";
import { api, type Page } from "@/lib/api";

interface AppelOfficiel {
  id: number;
  titre: string;
  description: string;
  date_limite: string;
  statut: "ouvert" | "clos";
  pieces_demandees: string[];
}

const FALLBACK_APPELS: AppelOfficiel[] = [
  {
    id: 1,
    titre: "Appel à Candidatures — Cohorte d'Incubation 2026",
    description:
      "Programme annuel d'incubation technologique et d'homologation industrielle ouvert aux porteurs de projets, diplômés ISEP, chercheurs et jeunes entreprises innovantes dans les 7 filières prioritaires du CIAT.",
    date_limite: "2026-11-16T23:59:00Z",
    statut: "ouvert",
    pieces_demandees: [
      "Note conceptuelle & fiche technique du projet (PDF)",
      "CV détaillés des membres de l'équipe porteuse",
      "Budget prévisionnel de prototypage & besoins ateliers",
    ],
  },
  {
    id: 2,
    titre: "Session Spéciale — Maturation & Énergies Renouvelables 2025",
    description:
      "Guichet thématique dédié à l'accélération de prototypes solaires productifs, chaînes du froid autonomes et systèmes d'irrigation bas-carbone.",
    date_limite: "2025-12-15T23:59:00Z",
    statut: "clos",
    pieces_demandees: [
      "Dossier technique de faisabilité énergétique",
      "Résultats des premiers essais sur banc",
    ],
  },
];

const AVANTAGES_CIAT = [
  {
    Icon: Wrench,
    titre: "Accès intégral aux FabLabs 4.0 & centres CNC",
    detail:
      "Usinage 5 axes, électronique embarquée, impression 3D industrielle et bancs d'essai solaires supervisés par nos ingénieurs.",
  },
  {
    Icon: Users,
    titre: "Mentorat scientifique & sectoriel dédié",
    detail:
      "Suivi bimensuel par les enseignants-chercheurs de l'ISEP Diamniadio et des experts industriels partenaires.",
  },
  {
    Icon: Cpu,
    titre: "Dotation matière d'œuvre & prototypage",
    detail:
      "Prise en charge encadrée des composants électroniques, alliages et capteurs nécessaires à la validation fonctionnelle.",
  },
  {
    Icon: Scale,
    titre: "Protection de la Propriété Intellectuelle",
    detail:
      "Accompagnement juridique à la rédaction de brevets OAPI et sécurisation contractuelle des droits des inventeurs.",
  },
  {
    Icon: Award,
    titre: "Homologation TRL & Guichet Investisseurs",
    detail:
      "Exposition permanente au Showroom CIAT 360 et mise en relation directe avec les PME, collectivités et fonds d'amorçage.",
  },
];

const ETAPES_SELECTION = [
  {
    num: "01",
    delai: "En ligne · 20 min",
    titre: "Dépôt numérique du dossier",
    desc: "Création de votre espace porteur, saisie structurée du problème, de la solution visée et téléversement des 3 pièces justificatives.",
  },
  {
    num: "02",
    delai: "Sous 10 jours ouvrés",
    titre: "Instruction & pré-diagnostic technique",
    desc: "Vérification de recevabilité et évaluation de la faisabilité matérielle par les responsables d'ateliers du CIAT.",
  },
  {
    num: "03",
    delai: "Session devant jury",
    titre: "Audition par le Comité Scientifique",
    desc: "Présentation de 15 minutes (pitch + démonstration d'esquisse ou maquette) devant un jury mixte académique et industriel.",
  },
  {
    num: "04",
    delai: "Démarrage cohorte",
    titre: "Conventionnement & entrée en atelier",
    desc: "Signature de la charte d'incubation, attribution d'un référent technique et ouverture des accès aux plateformes de Diamniadio.",
  },
];

const CRITERES_JURY = [
  {
    poids: "25 %",
    titre: "Impact & Pertinence Territoriale",
    desc: "Réponse mesurable à un besoin réel des filières productives, sanitaires ou communales au Sénégal.",
  },
  {
    poids: "25 %",
    titre: "Faisabilité & Valeur Technologique",
    desc: "Solidité de l'architecture technique et adéquation avec les plateformes d'expérimentation du CIAT.",
  },
  {
    poids: "25 %",
    titre: "Équipe & Complémentarité",
    desc: "Compétences réunies, disponibilité effective sur le calendrier des 5 jalons et capacité d'exécution.",
  },
  {
    poids: "25 %",
    titre: "Potentiel de Transfert & Viabilité",
    desc: "Modèle économique réaliste, réparabilité locale et perspectives de déploiement à l'échelle.",
  },
];

const SEPT_FILIERES_ELIGIBLES = [
  {
    num: "01",
    titre: "TIC, numérique, intelligence artificielle et données",
    exemples: "IA embarquée, IoT LoRaWAN, NLP langues nationales, plateformes métier",
  },
  {
    num: "02",
    titre: "Mécanique, fabrication et maintenance",
    exemples: "Usinage CNC, rétro-ingénierie 3D, machines agro-industrielles, outillage",
  },
  {
    num: "03",
    titre: "Agriculture, transformation et environnement",
    exemples: "Irrigation connectée, conservation post-récolte, valorisation biomasse",
  },
  {
    num: "04",
    titre: "Énergie, efficacité énergétique et énergies renouvelables",
    exemples: "Mini-réseaux solaires, chaîne du froid autonome, stockage et audit thermique",
  },
  {
    num: "05",
    titre: "Pharmaceutique et biomédical",
    exemples: "Télédiagnostic, dispositifs médicaux frugaux, procédés biopharmaceutiques",
  },
  {
    num: "06",
    titre: "Éducation, formation professionnelle et insertion",
    exemples: "Simulateurs VR d'atelier, kits didactiques robotiques, certification métier",
  },
  {
    num: "07",
    titre: "Services aux collectivités, entrepreneuriat et incubation",
    exemples: "Salubrité connectée, services publics numériques, économie circulaire urbaine",
  },
];

const FAQ_CANDIDATS = [
  {
    q: "Qui est éligible pour déposer un dossier au CIAT ?",
    a: "Les appels du CIAT sont ouverts aux apprenants et diplômés du réseau des ISEP, aux enseignants-chercheurs, aux ingénieurs indépendants ainsi qu'aux startups et porteurs de projets externes porteurs d'une innovation applicable au Sénégal.",
  },
  {
    q: "Faut-il déjà disposer d'un prototype fonctionnel pour candidater ?",
    a: "Non. Vous pouvez intégrer le parcours dès le Jalon 1 (Idéation structurée & preuve de concept) ou rejoindre directement un jalon avancé si vous disposez déjà d'une première maquette nécessitant usinage, électronique ou homologation.",
  },
  {
    q: "Comment est protégée la propriété intellectuelle de mon projet ?",
    a: "Dès l'instruction, les membres du jury sont soumis à une obligation stricte de confidentialité. La Charte PI du CIAT garantit la reconnaissance des inventeurs et encadre tout dépôt de brevet auprès de l'OAPI.",
  },
  {
    q: "Quelle présence physique est requise sur le campus de Diamniadio ?",
    a: "Les séances d'usinage, d'assemblage électronique et les revues officielles de jalons se tiennent à la Cité du Savoir de Diamniadio, selon un planning aménagé compatible avec une activité professionnelle ou des études.",
  },
];

function formatDateFr(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "Date officielle CIAT";
  return new Intl.DateTimeFormat("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(d);
}

export default function AppelsBody() {
  const [appels, setAppels] = useState<AppelOfficiel[]>(FALLBACK_APPELS);
  const [openFaq, setOpenFaq] = useState<number>(0);

  useEffect(() => {
    let cancelled = false;
    api<Page<AppelOfficiel> | AppelOfficiel[]>("/portal/appels/", {
      auth: false,
    })
      .then((res) => {
        if (cancelled) return;
        const list = Array.isArray(res) ? res : res?.results ?? [];
        if (list.length > 0) {
          setAppels(list);
        }
      })
      .catch(() => {
        /* Conserve le référentiel institutionnel de repli */
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const appelOuvert =
    appels.find((a) => a.statut === "ouvert") ?? FALLBACK_APPELS[0];
  const appelsClos = appels.filter((a) => a.id !== appelOuvert.id);

  return (
    <div className="ap-body-wrap">
      {/* =====================================================================
       * 1. GUICHET EN DIRECT : SESSIONS & APPELS À PROJETS OFFICIELS
       * ===================================================================== */}
      <section
        className="ap-sessions-section"
        aria-labelledby="sessions-heading"
      >
        <div className="ap-container">
          <div className="ap-section-header">
            <div>
              <span className="ap-kicker">
                <span className="ap-kicker-line" />
                Calendrier Officiel des Cohortes
              </span>
              <h2 id="sessions-heading" className="ap-h2">
                Appels à candidatures ouverts &amp; sessions de référence
              </h2>
            </div>

            <p className="ap-lead-muted">
              Consultez les fenêtres de soumission actives instruites par le
              Comité Scientifique et Industriel du CIAT à Diamniadio.
            </p>
          </div>

          <div className="ap-sessions-grid">
            {/* Carte principale : Appel actif */}
            <article className="ap-active-call">
              <div className="ap-call-top">
                <span className="ap-status-open">
                  <span className="ap-pulse-dot" />
                  Session ouverte aux dépôts
                </span>
                <span className="ap-deadline-pill">
                  <Calendar size={14} />
                  Clôture : {formatDateFr(appelOuvert.date_limite)}
                </span>
              </div>

              <h3 className="ap-call-title">{appelOuvert.titre}</h3>
              <p className="ap-call-desc">{appelOuvert.description}</p>

              {appelOuvert.pieces_demandees &&
                appelOuvert.pieces_demandees.length > 0 && (
                  <div className="ap-call-pieces">
                    <span className="ap-pieces-label">
                      Pièces constitutives du dossier :
                    </span>
                    <div className="ap-pieces-chips">
                      {appelOuvert.pieces_demandees.map((piece) => (
                        <span key={piece} className="ap-piece-chip">
                          <FileCheck2 size={13} className="text-[#DFae79] shrink-0" />
                          <span>{piece}</span>
                        </span>
                      ))}
                    </div>
                  </div>
                )}

              <div className="ap-call-footer">
                <div className="ap-call-actions">
                  <Link
                    href="/connexion?next=/incubateur"
                    className="ap-btn-gold"
                  >
                    Soumettre mon dossier en ligne
                    <ArrowRight size={16} />
                  </Link>
                  <Link href="/portail/documents" className="ap-btn-ghost-light">
                    Télécharger les canevas
                  </Link>
                </div>

                <span className="ap-call-meta-note">
                  <ShieldCheck size={15} className="text-[#DFae79]" />
                  Instruction confidentielle · Accusé immédiat
                </span>
              </div>
            </article>

            {/* Colonne latérale : Archives & Informations clés */}
            <div className="ap-side-stack">
              <div className="ap-info-box">
                <span className="ap-side-tag">Paramètres de la cohorte</span>
                <div className="ap-metrics-list">
                  <div>
                    <strong>12 mois</strong>
                    <span>Durée moyenne d&apos;incubation (5 jalons)</span>
                  </div>
                  <div>
                    <strong>07 pôles</strong>
                    <span>Filières technologiques éligibles</span>
                  </div>
                  <div>
                    <strong>100 %</strong>
                    <span>Propriété intellectuelle encadrée</span>
                  </div>
                </div>
              </div>

              {appelsClos.slice(0, 1).map((clos) => (
                <article key={clos.id} className="ap-closed-card">
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="ap-status-closed">Session clôturée</span>
                    <span className="text-xs font-semibold text-[#7A685A]">
                      {formatDateFr(clos.date_limite)}
                    </span>
                  </div>
                  <h4>{clos.titre}</h4>
                  <p>{clos.description}</p>
                </article>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* =====================================================================
       * 2. PARCOURS DE SÉLECTION & PROPOSITION DE VALEUR (#parcours)
       * ===================================================================== */}
      <section
        id="parcours"
        className="ap-parcours-section"
        aria-labelledby="parcours-heading"
      >
        <div className="ap-container">
          <div className="ap-parcours-grid">
            {/* Colonne gauche : Pourquoi rejoindre le CIAT */}
            <div>
              <span className="ap-kicker">
                <span className="ap-kicker-line" />
                Pourquoi Candidater au CIAT ?
              </span>
              <h2 id="parcours-heading" className="ap-h2">
                Un accélérateur industriel, bien au-delà d&apos;un hébergement
              </h2>
              <p className="ap-body-text">
                Intégrer le CIAT à l&apos;ISEP Amadou Trawaré de Diamniadio,
                c&apos;est lever simultanément les verrous d&apos;ingénierie
                matérielle, de validation normative et d&apos;accès au marché.
              </p>

              <div className="ap-benefits-stack">
                {AVANTAGES_CIAT.map((av) => {
                  const Icon = av.Icon;
                  return (
                    <div key={av.titre} className="ap-benefit-card">
                      <div className="ap-benefit-icon">
                        <Icon size={20} />
                      </div>
                      <div>
                        <h3>{av.titre}</h3>
                        <p>{av.detail}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Colonne droite : Les 4 étapes d'instruction */}
            <div className="ap-timeline-panel">
              <div className="ap-timeline-head">
                <span className="ap-kicker">
                  <span className="ap-kicker-line" />
                  Protocole d&apos;Admission
                </span>
                <h2 className="ap-h2-sm">
                  Quatre étapes transparentes jusqu&apos;à l&apos;atelier
                </h2>
              </div>

              <div className="ap-steps-vertical">
                {ETAPES_SELECTION.map((st) => (
                  <article key={st.num} className="ap-step-row">
                    <div className="ap-step-num-col">
                      <span className="ap-step-num">{st.num}</span>
                    </div>
                    <div className="ap-step-content">
                      <div className="flex flex-wrap items-center justify-between gap-2 mb-1">
                        <h3>{st.titre}</h3>
                        <span className="ap-step-delay">
                          <Clock size={12} />
                          {st.delai}
                        </span>
                      </div>
                      <p>{st.desc}</p>
                    </div>
                  </article>
                ))}
              </div>

              <div className="pt-6 border-t border-[#E5D7C6] flex flex-wrap items-center justify-between gap-4">
                <span className="text-xs font-semibold text-[#655346]">
                  Suivi en temps réel depuis votre espace porteur CIAT 360
                </span>
                <a href="#preparer" className="ap-btn-dark">
                  Préparer mon dossier
                  <ArrowRight size={15} />
                </a>
              </div>
            </div>
          </div>

          {/* Grille multicritère du Jury (4 x 25%) */}
          <div className="ap-jury-band">
            <div className="ap-jury-intro">
              <span className="ap-kicker" style={{ marginBottom: 4 }}>
                <Sparkles size={14} className="text-[#612D10]" />
                Barème Officiel du Comité Scientifique
              </span>
              <h3>Sur quels critères votre dossier est-il évalué ?</h3>
            </div>

            <div className="ap-jury-grid">
              {CRITERES_JURY.map((crit) => (
                <div key={crit.titre} className="ap-jury-card">
                  <span className="ap-jury-weight">{crit.poids}</span>
                  <h4>{crit.titre}</h4>
                  <p>{crit.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* =====================================================================
       * 3. LES 7 FILIÈRES OFFICIELLES ÉLIGIBLES (BANDEAU ARCHITECTURAL BRUN NUIT)
       * ===================================================================== */}
      <section
        className="ap-sectors-band"
        aria-labelledby="filieres-eligibles-heading"
      >
        <div className="ap-container ap-sectors-layout">
          <div className="ap-sectors-visual-col">
            <div className="ap-sectors-photo-card">
              <Image
                src="/images/auth-incubateur.jpg"
                alt="Équipe d'innovateurs sénégalais présentant une maquette électronique fonctionnelle aux mentors du CIAT"
                fill
                sizes="(max-width: 1024px) 100vw, 42vw"
              />
              <div className="ap-sectors-photo-shade" />
              <div className="ap-sectors-photo-caption">
                <span>Pôle Urbain de Diamniadio</span>
                <strong>
                  Des projets ancrés dans les besoins réels de l&apos;économie
                  sénégalaise
                </strong>
              </div>
            </div>

            <div className="mt-5 flex items-center justify-between rounded-2xl bg-white/5 border border-white/15 px-5 py-4">
              <span className="text-xs text-[#E5D7C6]">
                Consultez les équipements de chaque pôle avant de candidater
              </span>
              <Link
                href="/portail/domaines"
                className="inline-flex items-center gap-1.5 text-xs font-extrabold !text-[#DFae79] hover:underline shrink-0 ml-3"
              >
                Voir les 7 pôles
                <ArrowUpRight size={14} />
              </Link>
            </div>
          </div>

          <div>
            <span className="ap-kicker ap-kicker-light">
              <span
                className="ap-kicker-line"
                style={{ background: "#C99A68" }}
              />
              Périmètre Thématique Officiel
            </span>
            <h2
              id="filieres-eligibles-heading"
              className="ap-h2"
              style={{ color: "#FFFFFF" }}
            >
              Les 7 filières d&apos;excellence ouvertes aux candidatures
            </h2>
            <p className="ap-sectors-lead">
              Tout dossier soumis est rattaché à l&apos;une des sept filières
              statutaires du CIAT afin de mobiliser les ateliers et experts
              correspondants :
            </p>

            <div className="ap-filieres-list">
              {SEPT_FILIERES_ELIGIBLES.map((fil) => (
                <Link
                  key={fil.num}
                  href={`/portail/domaines#domaine-${fil.num}`}
                  className="ap-filiere-item"
                >
                  <span className="ap-filiere-num">{fil.num}</span>
                  <div className="flex-1 min-w-0">
                    <h3>{fil.titre}</h3>
                    <p>{fil.exemples}</p>
                  </div>
                  <ArrowUpRight
                    size={16}
                    className="text-[#C99A68] shrink-0 opacity-75"
                  />
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* =====================================================================
       * 4. PRÉPARER VOTRE DOSSIER & FAQ CANDIDATS (#preparer)
       * ===================================================================== */}
      <section
        id="preparer"
        className="ap-dossier-section"
        aria-labelledby="preparer-heading"
      >
        <div className="ap-container">
          <div className="ap-dossier-grid">
            {/* Colonne gauche : Pièces & Checklist de conformité */}
            <div>
              <span className="ap-kicker">
                <span className="ap-kicker-line" />
                Constitution du Dossier
              </span>
              <h2 id="preparer-heading" className="ap-h2">
                Préparez une candidature claire, structurée et convaincante
              </h2>
              <p className="ap-body-text">
                Pour garantir l&apos;équité d&apos;instruction, assurez-vous de
                réunir les éléments fondamentaux suivants avant de valider votre
                soumission en ligne :
              </p>

              <div className="ap-checklist-grid">
                {[
                  {
                    titre: "01 · Note de problématique & solution",
                    detail:
                      "Besoin terrain documenté, architecture technique visée et différenciation.",
                  },
                  {
                    titre: "02 · Profil du porteur ou de l'équipe",
                    detail:
                      "CV à jour, rôle de chaque co-porteur et disponibilité effective.",
                  },
                  {
                    titre: "03 · État d'avancement actuel (TRL)",
                    detail:
                      "Schémas, photos de maquette existante ou cahier des charges fonctionnel.",
                  },
                  {
                    titre: "04 · Besoins d'usinage & d'accompagnement",
                    detail:
                      "Ateliers sollicités (CNC, électronique, solaire, biomédical) et budget estimatif.",
                  },
                ].map((item) => (
                  <div key={item.titre} className="ap-check-card">
                    <div className="flex items-center gap-2 mb-1.5">
                      <CheckCircle2
                        size={16}
                        className="text-[#612D10] shrink-0"
                      />
                      <h3>{item.titre}</h3>
                    </div>
                    <p>{item.detail}</p>
                  </div>
                ))}
              </div>

              <div className="ap-cta-row">
                <Link
                  href="/connexion?next=/incubateur"
                  className="ap-btn-dark"
                >
                  <FolderCheck size={16} />
                  Déposer ma candidature en ligne
                </Link>
                <Link href="/portail/documents" className="ap-btn-outline">
                  Consulter les trames &amp; chartes officielles
                  <ArrowUpRight size={15} />
                </Link>
              </div>
            </div>

            {/* Colonne droite : Visuel Campus + FAQ Interactive */}
            <div className="ap-faq-col">
              <div className="ap-campus-card">
                <Image
                  src="/images/campus-ciat.jpg"
                  alt="Bâtiment officiel du Centre d'Innovation Technologique CIAT sur le campus de Diamniadio"
                  fill
                  sizes="(max-width: 1024px) 100vw, 42vw"
                />
                <div className="ap-campus-shade" />
                <div className="ap-campus-badge">
                  <span>Guichet d&apos;Orientation CIAT</span>
                  <strong>
                    Besoin d&apos;un avis préalable ? Notre secrétariat vous
                    oriente à Diamniadio.
                  </strong>
                </div>
              </div>

              <div className="ap-faq-box">
                <h3 className="ap-faq-heading">
                  Questions fréquentes des porteurs de projets
                </h3>

                <div className="ap-faq-list">
                  {FAQ_CANDIDATS.map((item, idx) => {
                    const isOpen = openFaq === idx;
                    return (
                      <div key={item.q} className="ap-faq-item">
                        <button
                          type="button"
                          aria-expanded={isOpen}
                          onClick={() => setOpenFaq(isOpen ? -1 : idx)}
                          className="ap-faq-btn"
                        >
                          <span>{item.q}</span>
                          <ChevronDown
                            size={16}
                            className={`shrink-0 text-[#612D10] transition-transform ${
                              isOpen ? "rotate-180" : ""
                            }`}
                          />
                        </button>
                        {isOpen && <p className="ap-faq-ans">{item.a}</p>}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
