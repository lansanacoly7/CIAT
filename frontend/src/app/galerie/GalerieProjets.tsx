/* eslint-disable @next/next/no-img-element */
"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import {
  ArrowRight,
  ArrowUpRight,
  CheckCircle2,
  Download,
  Eye,
  Handshake,
  LayoutGrid,
  List,
  Loader2,
  QrCode,
  Search,
  Sparkles,
  X,
  AlertCircle,
} from "lucide-react";
import CardImage from "@/components/CardImage";
import {
  getFichesInnovation,
  getFicheQrUrl,
  postInteretFiche,
  type FicheInnovation,
} from "@/lib/gallery-api";
import {
  DOMAINES_CIAT,
  inferDomaine,
  resolveFicheVisual,
  type DomaineCode,
} from "./galerie-visuals";
import "./galerie.css";

/* 7 fiches de repli institutionnelles (1 par filière officielle CIAT 01–07) si le backend est hors-ligne */
const FALLBACK_FICHES: FicheInnovation[] = [
  {
    id: 1,
    slug: "sunuagri-ai-detection-des-maladies-maraicheres-des-niayes",
    projet: 11,
    titre: "SunuAgri AI — Diagnostic Phytosanitaire par Vision Embarquée",
    probleme:
      "Les pertes de récoltes maraîchères dues aux attaques fongiques tardivement identifiées dans la zone des Niayes.",
    solution:
      "Modèle de vision par ordinateur hors-ligne sur smartphone détectant 18 pathologies foliaires avec recommandations vocales en Wolof.",
    equipe: "Équipe Cheikh Ndoye — Spécialistes en TIC, numérique, intelligence artificielle et données.",
    avancement: "MVP / Pilote",
    medias: [{ type: "photo", url: "/images/domaine_01_tic_hd.jpg" }],
    statut: "publie",
    vues: 405,
  },
  {
    id: 2,
    slug: "usinage-cnc-local-pieces-de-rechange-pour-usines-agroalimentaires",
    projet: 18,
    titre: "Usinage CNC 5 Axes — Pièces Critiques de Rechange pour l'Agro-Industrie",
    probleme:
      "Les arrêts prolongés de lignes de transformation dus à l'importation coûteuse de pièces mécaniques sur commande.",
    solution:
      "Rétro-ingénierie 3D et usinage numérique de haute précision en acier inoxydable alimentaire directement au FabLab CIAT.",
    equipe: "Équipe Ibrahima Cissé — Spécialistes en Mécanique, fabrication et maintenance.",
    avancement: "Incubation terminée — Prototype certifié pour transfert",
    medias: [{ type: "photo", url: "/images/innovations/cnc-4-0-clean.jpg" }],
    statut: "publie",
    vues: 389,
  },
  {
    id: 3,
    slug: "agrisol-pompe-solaire-connectee",
    projet: 31,
    titre: "AgriSol — Pompes Solaires Connectées & Micro-Irrigation Intelligente",
    probleme:
      "Le coût du carburant pour motopompes et le stress hydrique menacent la rentabilité des exploitations maraîchères des Niayes.",
    solution:
      "Station de pompage photovoltaïque couplée à des sondes capacitives LoRaWAN déclenchant l'irrigation aux heures optimales (-40 % d'eau).",
    equipe: "Équipe Aminata Diallo — Spécialistes en Agriculture, transformation et environnement.",
    avancement: "Prototype validé",
    medias: [{ type: "photo", url: "/images/innovations/agrisol-iot.jpg" }],
    statut: "publie",
    vues: 342,
  },
  {
    id: 4,
    slug: "sunugrid-mini-reseau-solaire-intelligent-avec-paiement-pay-as-you-go",
    projet: 24,
    titre: "SunuGrid — Mini-Réseau Solaire Intelligent & Comptage Pay-As-You-Go",
    probleme:
      "L'accès discontinu à l'électricité triphasée freine la mécanisation des coopératives rurales et ateliers artisanaux.",
    solution:
      "Micro-centrale hybride photovoltaïque-lithium pilotée par télémétrie GSM avec répartition intelligente de charge.",
    equipe: "Équipe Ousmane Sarr — Spécialistes en Énergie, efficacité énergétique et énergies renouvelables.",
    avancement: "Prototype validé",
    medias: [{ type: "photo", url: "/images/domaine-energie.jpg" }],
    statut: "publie",
    vues: 364,
  },
  {
    id: 5,
    slug: "sunudoc-telemedecine-langues-nationales",
    projet: 40,
    titre: "SunuDoc — Valise de Télé-Diagnostic & Triage Vocal en Langues Nationales",
    probleme:
      "L'éloignement des spécialistes et la barrière linguistique retardent la prise en charge prénatale et cardiaque en zone rurale.",
    solution:
      "Station biomédicale portable (ECG, oxymètre, stéthoscope numérique) assistée par guidage vocal en Wolof, Pulaar et Sérère.",
    equipe: "Dr. Fatou Sow & Moussa Ba — Spécialistes en Pharmaceutique et biomédical.",
    avancement: "MVP / Pilote",
    medias: [{ type: "photo", url: "/images/innovations/telemedical-device.jpg" }],
    statut: "publie",
    vues: 418,
  },
  {
    id: 6,
    slug: "kit-robotique-pedagogique-lycees-techniques",
    projet: 45,
    titre: "RoboEdu SN — Kit Robotique & Banc d'Automatisme pour Lycées Techniques",
    probleme:
      "Le déficit de maquettes didactiques abordables limite les travaux pratiques d'électronique et mécatronique dans les lycées.",
    solution:
      "Châssis modulaire usiné localement au CIAT avec cartes open-hardware et séquences de travaux pratiques alignées ISEP.",
    equipe: "Équipe Mariama Ndiaye — Spécialistes en Éducation, formation professionnelle et insertion.",
    avancement: "MVP / Pilote",
    medias: [{ type: "photo", url: "/images/ciat_galerie_hero_elec.jpg" }],
    statut: "publie",
    vues: 312,
  },
  {
    id: 7,
    slug: "dakar-waste-solutions-optimisation-de-collecte-des-ordures-menageres",
    projet: 52,
    titre: "Dakar Waste — Tri Sélectif Connecté & Optimisation des Tournées Communales",
    probleme:
      "La saturation des points de regroupement urbains et le manque de traçabilité des flux recyclables dans les communes.",
    solution:
      "Points d'apport volontaire équipés de capteurs ultrasoniques de remplissage et routage dynamique des bennes municipales.",
    equipe: "Équipe Babacar Fall — Spécialistes en Services aux collectivités, entrepreneuriat et incubation.",
    avancement: "Incubation terminée — Prototype certifié pour transfert",
    medias: [
      {
        type: "photo",
        url: "/images/galerie/fiche_dakar-waste-solutions-optimisation-de-collecte-des-ordures-menageres.jpg",
      },
    ],
    statut: "publie",
    vues: 356,
  },
];

/* =============================================================================
 * FONCTIONS UTILITAIRES DE CLASSIFICATION & ENRICHISSEMENT
 * ============================================================================= */

type StageBucket = "idee" | "prototype" | "mvp" | "transfert";

function inferStage(avancement: string): {
  bucket: StageBucket;
  shortBadge: string;
  trlStep: number;
} {
  const norm = avancement.toLowerCase();
  if (
    norm.includes("transfert") ||
    norm.includes("déploiement") ||
    norm.includes("deploiement") ||
    norm.includes("certifié") ||
    norm.includes("terminée")
  ) {
    return { bucket: "transfert", shortBadge: "Prêt au transfert", trlStep: 4 };
  }
  if (norm.includes("mvp") || norm.includes("pilote")) {
    return { bucket: "mvp", shortBadge: "MVP · Pilote terrain", trlStep: 3 };
  }
  if (norm.includes("prototype")) {
    return { bucket: "prototype", shortBadge: "Prototype validé", trlStep: 2 };
  }
  return { bucket: "idee", shortBadge: "Cadrage R&D", trlStep: 1 };
}

function cleanTitle(raw: string): string {
  return raw.replace(/\s*\((Brouillon|En validation)\)\s*$/i, "").trim();
}

function extractTeamLead(equipe: string): string {
  const firstSegment = equipe.split("—")[0]?.trim() || equipe;
  if (firstSegment.length <= 44) return firstSegment;
  return `${firstSegment.slice(0, 42).trim()}…`;
}

/* =============================================================================
 * COMPOSANT PRINCIPAL : GALERIE DES INNOVATIONS CIAT
 * ============================================================================= */

type SortKey = "views" | "az" | "recent";
type ViewMode = "grid" | "list";

const PAGE_SIZE = 9;

export default function GalerieProjets() {
  const [rawFiches, setRawFiches] = useState<FicheInnovation[]>([]);
  const [loading, setLoading] = useState(true);

  // États de filtrage & affichage
  const [activeDomaine, setActiveDomaine] = useState<DomaineCode>("tous");
  const [activeStage, setActiveStage] = useState<"all" | StageBucket>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<SortKey>("views");
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [currentPage, setCurrentPage] = useState(1);

  // Spotlight à la une (3 projets phares)
  const [spotlightIndex, setSpotlightIndex] = useState(0);

  // Modales (Manifestation d'intérêt API réelle + Aperçu QR Code)
  const [interetTarget, setInteretTarget] = useState<FicheInnovation | null>(null);
  const [qrTarget, setQrTarget] = useState<FicheInnovation | null>(null);

  // Champs du formulaire officiel "Je suis intéressé"
  const [interetNom, setInteretNom] = useState("");
  const [interetEmail, setInteretEmail] = useState("");
  const [interetOrg, setInteretOrg] = useState("");
  const [interetMessage, setInteretMessage] = useState("");
  const [interetSubmitting, setInteretSubmitting] = useState(false);
  const [interetSuccess, setInteretSuccess] = useState<string | null>(null);
  const [interetError, setInteretError] = useState<string | null>(null);
  const [interetFieldErrors, setInteretFieldErrors] = useState<Record<string, string>>({});

  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );

  // Pré-filtrage automatique si l'utilisateur arrive depuis /portail/domaines (?domaine=...)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const domParam = params.get("domaine") as DomaineCode | null;
    if (
      domParam &&
      domParam !== "tous" &&
      DOMAINES_CIAT.some((d) => d.code === domParam)
    ) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setActiveDomaine(domParam);
      setCurrentPage(1);
      setTimeout(() => {
        document
          .getElementById("catalogue")
          ?.scrollIntoView({ behavior: "smooth" });
      }, 120);
    }
  }, []);

  // Chargement des fiches publiées depuis le backend Django
  useEffect(() => {
    let cancelled = false;
    getFichesInnovation({ pageSize: 50 })
      .then((res) => {
        if (cancelled) return;
        if (res.items && res.items.length > 0) {
          setRawFiches(res.items);
        } else {
          setRawFiches(FALLBACK_FICHES);
        }
        setLoading(false);
      })
      .catch(() => {
        if (!cancelled) {
          setRawFiches(FALLBACK_FICHES);
          setLoading(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // Gestion clavier Escape & scroll lock des modales
  useEffect(() => {
    const anyModal = Boolean(interetTarget || qrTarget);
    document.body.style.overflow = anyModal ? "hidden" : "";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setInteretTarget(null);
        setQrTarget(null);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, [interetTarget, qrTarget]);

  // Enrichissement déterministe de chaque fiche selon les 7 filières officielles
  const enrichedFiches = useMemo(() => {
    return rawFiches.map((fiche) => {
      const domaine = inferDomaine(fiche);
      const domaineMeta = DOMAINES_CIAT.find((d) => d.code === domaine)!;
      const stage = inferStage(fiche.avancement);
      const visual = resolveFicheVisual(fiche, domaine);
      return {
        ...fiche,
        displayTitle: cleanTitle(fiche.titre),
        domaine,
        domaineNumero: domaineMeta.numero,
        domaineShort: domaineMeta.shortLabel,
        domaineFull: domaineMeta.fullLabel,
        stageBucket: stage.bucket,
        stageBadge: stage.shortBadge,
        trlStep: stage.trlStep,
        teamLead: extractTeamLead(fiche.equipe),
        visual,
      };
    });
  }, [rawFiches]);

  // Compteurs par filière (les 7 filières officielles CIAT)
  const domainCounts = useMemo(() => {
    const counts: Record<DomaineCode, number> = {
      tous: enrichedFiches.length,
      numerique: 0,
      mecanique: 0,
      agriculture: 0,
      energie: 0,
      biomedical: 0,
      education: 0,
      collectivites: 0,
    };
    for (const item of enrichedFiches) {
      counts[item.domaine] += 1;
    }
    return counts;
  }, [enrichedFiches]);

  // Sélection d'1 innovation phare pour CHACUNE des 7 filières officielles CIAT (01 à 07)
  const spotlightItems = useMemo(() => {
    if (enrichedFiches.length === 0) return [];
    const preferredByDomain: Record<Exclude<DomaineCode, "tous">, string> = {
      numerique: "sunuagri-ai-detection-des-maladies-maraicheres-des-niayes",
      mecanique: "usinage-cnc-local-pieces-de-rechange-pour-usines-agroalimentaires",
      agriculture: "agrisol-pompe-solaire-connectee",
      energie: "sunugrid-mini-reseau-solaire-intelligent-avec-paiement-pay-as-you-go",
      biomedical: "sunudoc-telemedecine-langues-nationales",
      education: "kit-robotique-pedagogique-lycees-techniques",
      collectivites: "dakar-waste-solutions-optimisation-de-collecte-des-ordures-menageres",
    };

    const sevenDomains = DOMAINES_CIAT.filter(
      (d): d is typeof d & { code: Exclude<DomaineCode, "tous"> } =>
        d.code !== "tous"
    );

    return sevenDomains
      .map((dom) => {
        const prefSlug = preferredByDomain[dom.code];
        const exact = enrichedFiches.find((f) => f.slug === prefSlug);
        if (exact) return exact;
        const bestInDomain = enrichedFiches
          .filter((f) => f.domaine === dom.code)
          .sort((a, b) => b.vues - a.vues)[0];
        return bestInDomain ?? null;
      })
      .filter((f): f is NonNullable<typeof f> => Boolean(f));
  }, [enrichedFiches]);

  // Filtrage + tri temps réel
  const filteredFiches = useMemo(() => {
    const q = searchQuery.trim().toLocaleLowerCase("fr");

    const list = enrichedFiches.filter((item) => {
      if (activeDomaine !== "tous" && item.domaine !== activeDomaine) {
        return false;
      }
      if (activeStage !== "all" && item.stageBucket !== activeStage) {
        return false;
      }
      if (q) {
        const corpus = [
          item.displayTitle,
          item.probleme,
          item.solution,
          item.equipe,
          item.domaineShort,
          item.stageBadge,
        ]
          .join(" ")
          .toLocaleLowerCase("fr");
        if (!corpus.includes(q)) return false;
      }
      return true;
    });

    if (sortBy === "views") {
      return [...list].sort((a, b) => b.vues - a.vues);
    }
    if (sortBy === "az") {
      return [...list].sort((a, b) =>
        a.displayTitle.localeCompare(b.displayTitle, "fr")
      );
    }
    return [...list].sort((a, b) => b.id - a.id);
  }, [enrichedFiches, activeDomaine, activeStage, searchQuery, sortBy]);

  const totalPages = Math.max(1, Math.ceil(filteredFiches.length / PAGE_SIZE));
  const safePage = Math.min(currentPage, totalPages);

  const paginatedFiches = useMemo(() => {
    const start = (safePage - 1) * PAGE_SIZE;
    return filteredFiches.slice(start, start + PAGE_SIZE);
  }, [filteredFiches, safePage]);

  const openInteretModal = (fiche: FicheInnovation) => {
    setInteretTarget(fiche);
    setInteretSuccess(null);
    setInteretError(null);
    setInteretFieldErrors({});
  };

  const handleInteretSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!interetTarget) return;

    const errs: Record<string, string> = {};
    if (!interetNom.trim()) {
      errs.nom = "Veuillez indiquer votre nom complet.";
    }
    if (
      !interetEmail.trim() ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(interetEmail.trim())
    ) {
      errs.email = "Veuillez saisir une adresse email professionnelle valide.";
    }
    if (!interetMessage.trim() || interetMessage.trim().length < 10) {
      errs.message = "Merci de préciser votre demande (minimum 10 caractères).";
    }

    if (Object.keys(errs).length > 0) {
      setInteretFieldErrors(errs);
      return;
    }

    setInteretSubmitting(true);
    setInteretError(null);
    setInteretFieldErrors({});

    try {
      const res = await postInteretFiche(interetTarget.slug, {
        nom: interetNom,
        email: interetEmail,
        organisation: interetOrg,
        message: interetMessage,
      });

      if (res.success) {
        setInteretSuccess(
          res.message ||
            "Votre manifestation d'intérêt a bien été enregistrée. L'équipe de valorisation du CIAT et le porteur du projet vous recontacteront sous 48h."
        );
        setInteretNom("");
        setInteretEmail("");
        setInteretOrg("");
        setInteretMessage("");
      } else {
        setInteretError(
          res.error ||
            "Une erreur est survenue lors de l'enregistrement. Vos informations ont été conservées."
        );
        if (res.errors) setInteretFieldErrors(res.errors);
      }
    } catch {
      setInteretError(
        "Connexion momentanément interrompue. Veuillez réessayer dans un instant."
      );
    } finally {
      setInteretSubmitting(false);
    }
  };

  const handleDownloadQr = async (fiche: FicheInnovation) => {
    try {
      const res = await fetch(getFicheQrUrl(fiche.slug));
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `ciat-qr-${fiche.slug}.png`;
      document.body.appendChild(link);
      link.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(link);
    } catch {
      window.open(getFicheQrUrl(fiche.slug), "_blank", "noopener,noreferrer");
    }
  };

  const activeSpotlight = spotlightItems[spotlightIndex] || spotlightItems[0];
  const isFiltering =
    activeDomaine !== "tous" ||
    activeStage !== "all" ||
    searchQuery.trim() !== "";

  return (
    <div className="ciat-galerie-root">
      {/* =====================================================================
       * 1. HERO ARCHITECTURAL PLEIN CADRE — SUR-MESURE POUR HERO_SHOWROOM.JPG
       * ===================================================================== */}
      <section className="g-hero" aria-labelledby="galerie-hero-heading">
        <div className="g-hero-media">
          <Image
            src="/images/hero_showroom.jpg"
            alt="Showroom d'exposition technologique du CIAT présentant capteurs IoT agricoles, séchoir solaire, bras robotique et banc d'homologation industriel"
            fill
            priority
            sizes="100vw"
          />
        </div>

        <div className="g-hero-blend" aria-hidden="true" />

        <div className="g-hero-grid">
          {/* Cartouche muséal aligné sous les bancs d'exposition à gauche */}
          <div className="g-showroom-plaque">
            <div className="g-plaque-header">
              <span className="g-plaque-kicker">
                <span className="g-live-dot" />
                Hall d&apos;Exposition &amp; Bancs d&apos;Essai
              </span>
              <span className="g-plaque-loc">
                ISEP Amadou Trawaré · Diamniadio
              </span>
            </div>

            <div className="g-plaque-benches">
              <div className="g-bench-item">
                <span className="g-bench-num">BANC 01</span>
                <span className="g-bench-name">Sondes IoT &amp; Sols</span>
              </div>
              <div className="g-bench-item">
                <span className="g-bench-num">BANC 02</span>
                <span className="g-bench-name">Séchage Solaire</span>
              </div>
              <div className="g-bench-item">
                <span className="g-bench-num">BANC 03</span>
                <span className="g-bench-name">Robotique 6 Axes</span>
              </div>
              <div className="g-bench-item">
                <span className="g-bench-num">BANC 04</span>
                <span className="g-bench-name">Contrôle &amp; Automates</span>
              </div>
            </div>
          </div>

          {/* Bloc éditorial calé sur la paroi albâtre naturelle de droite */}
          <div className="g-hero-editorial">
            <div className="g-eyebrow-row">
              <span className="g-eyebrow-line" />
              <span className="g-eyebrow-text">
                Showroom Officiel · CIAT 360
              </span>
            </div>

            <h1 id="galerie-hero-heading" className="g-hero-title">
              Des prototypes conçus ici,{" "}
              <span>prêts pour l&apos;impact.</span>
            </h1>

            <p className="g-hero-lead">
              Explorez les innovations matérielles et numériques conçues,
              éprouvées en atelier et homologuées au sein du Centre
              d&apos;Innovation, d&apos;Application et de Transfert de Diamniadio.
            </p>

            <div className="g-hero-metrics">
              <div className="g-metric">
                <strong>
                  {enrichedFiches.length > 0 ? enrichedFiches.length : 26}
                </strong>
                <span>Innovations publiées</span>
              </div>
              <div className="g-metric">
                <strong>07</strong>
                <span>Filières d&apos;excellence</span>
              </div>
              <div className="g-metric">
                <strong>TRL 4–8</strong>
                <span>Maturité industrielle</span>
              </div>
            </div>

            <div className="g-hero-actions">
              <a href="#catalogue" className="g-btn-primary">
                Explorer le catalogue
                <ArrowRight size={16} />
              </a>
              <a href="#transfert" className="g-btn-secondary">
                Partenariats &amp; Transfert
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* =====================================================================
       * 2. VITRINE DES 7 FILIÈRES D'EXCELLENCE — 1 DOSSIER PHARE PAR PÔLE
       * ===================================================================== */}
      {!isFiltering && activeSpotlight && (
        <section
          className="g-spotlight-wrap"
          aria-label="Innovations phares des 7 filières officielles du CIAT"
        >
          <div className="g-spotlight-head">
            <div>
              <div className="g-eyebrow-row" style={{ marginBottom: 4 }}>
                <span className="g-eyebrow-line" />
                <span className="g-eyebrow-text">
                  Vitrine des 7 Filières d&apos;Excellence
                </span>
              </div>
              <h2 className="g-section-title">
                Une innovation de référence par pôle technologique
              </h2>
            </div>

            <Link href="/portail/domaines" className="g-domains-link">
              Explorer le référentiel des 7 domaines
              <ArrowUpRight size={15} />
            </Link>
          </div>

          {spotlightItems.length > 1 && (
            <div
              className="g-spotlight-nav"
              role="group"
              aria-label="Sélectionner l'une des 7 filières d'innovation du CIAT"
            >
              {spotlightItems.map((sp, idx) => {
                const active = spotlightIndex === idx;
                return (
                  <button
                    key={sp.slug}
                    type="button"
                    aria-pressed={active}
                    onClick={() => setSpotlightIndex(idx)}
                    className={`g-spotlight-pill ${
                      active ? "g-spotlight-pill-active" : ""
                    }`}
                  >
                    <span className="g-spotlight-pill-num">
                      {sp.domaineNumero}
                    </span>
                    <span>{sp.domaineShort}</span>
                  </button>
                );
              })}
            </div>
          )}

          <div className="g-spotlight-card">
            <div className="g-spotlight-visual">
              <img
                src={activeSpotlight.visual}
                alt={activeSpotlight.displayTitle}
              />
              <div className="g-spotlight-visual-shade" />

              <div className="g-spotlight-top-badges">
                <span className="g-badge-stage" style={{ position: "static" }}>
                  <Sparkles size={12} className="text-[#DFae79]" />
                  {activeSpotlight.stageBadge}
                </span>
                <span className="g-badge-views" style={{ position: "static" }}>
                  <Eye size={13} />
                  {activeSpotlight.vues} consultations
                </span>
              </div>

              <div className="g-spotlight-pole-tag">
                <span>Filière {activeSpotlight.domaineNumero}</span>
                <strong>{activeSpotlight.domaineFull}</strong>
              </div>
            </div>

            <div className="g-spotlight-body">
              <div>
                <span className="g-spotlight-kicker">
                  Pôle {activeSpotlight.domaineNumero} · {activeSpotlight.domaineShort}
                </span>

                <h3 className="g-spotlight-title">
                  <Link href={`/galerie/${activeSpotlight.slug}`}>
                    {activeSpotlight.displayTitle}
                  </Link>
                </h3>

                <div className="g-spotlight-dossier">
                  <div className="g-dossier-block">
                    <span className="g-dossier-label">Défi identifié sur le terrain</span>
                    <p className="g-dossier-text">{activeSpotlight.probleme}</p>
                  </div>
                  <div className="g-dossier-block">
                    <span className="g-dossier-label">Architecture &amp; Solution CIAT</span>
                    <p className="g-dossier-text">{activeSpotlight.solution}</p>
                  </div>
                </div>
              </div>

              <div className="g-spotlight-footer">
                <span className="text-xs text-[#D8C7B5]">
                  Porté par <strong className="text-white">{activeSpotlight.teamLead}</strong>
                </span>

                <div className="flex flex-wrap items-center gap-2.5">
                  <button
                    type="button"
                    onClick={() => {
                      setActiveDomaine(activeSpotlight.domaine);
                      setCurrentPage(1);
                      document
                        .getElementById("catalogue")
                        ?.scrollIntoView({ behavior: "smooth" });
                    }}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-[#C99A68]/45 bg-[#C99A68]/15 hover:bg-[#C99A68]/25 px-3.5 py-2.5 text-xs font-bold !text-[#F5EADC] transition cursor-pointer"
                  >
                    Toute la filière {activeSpotlight.domaineNumero} (
                    {domainCounts[activeSpotlight.domaine]})
                  </button>
                  <Link
                    href={`/galerie/${activeSpotlight.slug}`}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-white/25 bg-white/10 hover:bg-white/20 px-4 py-2.5 text-xs font-bold !text-white transition"
                  >
                    Dossier complet
                    <ArrowUpRight size={14} />
                  </Link>
                  <button
                    type="button"
                    onClick={() => openInteretModal(activeSpotlight)}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-[#C99A68] hover:bg-[#DFae79] px-4 py-2.5 text-xs font-extrabold text-[#24140D] transition cursor-pointer"
                  >
                    <Handshake size={14} />
                    Soutenir / Déployer
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* =====================================================================
       * 3. CATALOGUE OFFICIEL & CONSOLE DE RECHERCHE MULTICRITÈRE
       * ===================================================================== */}
      <section className="g-catalog-section" id="catalogue">
        <div className="g-section-head">
          <div>
            <div className="g-eyebrow-row" style={{ marginBottom: 4 }}>
              <span className="g-eyebrow-line" />
              <span className="g-eyebrow-text">Répertoire Homologué</span>
            </div>
            <h2 className="g-section-title">
              Catalogue des innovations &amp; prototypes
            </h2>
          </div>

          <p className="g-section-sub">
            Filtrez par filière technologique, niveau de maturité industrielle
            ou mot-clé technique. Chaque fiche dispose d&apos;un QR Code salon et
            d&apos;un canal direct de mise en relation.
          </p>
        </div>

        {/* Console architecturale */}
        <div className="g-console">
          <div className="g-console-top">
            <div className="g-search-box">
              <Search size={17} className="g-search-icon" />
              <input
                type="search"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                placeholder="Rechercher un prototype, une technologie (CNC, Solaire, IA, Santé), une équipe…"
                aria-label="Rechercher une innovation dans le catalogue"
                className="g-search-input"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery("");
                    setCurrentPage(1);
                  }}
                  aria-label="Effacer la recherche"
                  className="g-search-clear"
                >
                  <X size={13} />
                </button>
              )}
            </div>

            <div className="g-select-wrap">
              <label htmlFor="galerie-sort" className="sr-only">
                Trier les projets
              </label>
              <select
                id="galerie-sort"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortKey)}
                className="g-select"
              >
                <option value="views">Tri : Plus consultés</option>
                <option value="recent">Tri : Plus récents</option>
                <option value="az">Tri : Ordre A – Z</option>
              </select>
            </div>

            <div
              className="g-view-toggle"
              role="group"
              aria-label="Mode d'affichage du catalogue"
            >
              <button
                type="button"
                onClick={() => setViewMode("grid")}
                aria-pressed={viewMode === "grid"}
                title="Affichage en grille"
                className={`g-view-btn ${
                  viewMode === "grid" ? "g-view-btn-active" : ""
                }`}
              >
                <LayoutGrid size={16} />
              </button>
              <button
                type="button"
                onClick={() => setViewMode("list")}
                aria-pressed={viewMode === "list"}
                title="Affichage en liste détaillée"
                className={`g-view-btn ${
                  viewMode === "list" ? "g-view-btn-active" : ""
                }`}
              >
                <List size={16} />
              </button>
            </div>
          </div>

          {/* Onglets numérotés des 7 Filières officielles du CIAT */}
          <div className="g-domain-header">
            <span className="g-domain-label">
              Filtrer parmi les 7 filières officielles du CIAT
            </span>
            <Link href="/portail/domaines" className="g-domain-ref-link">
              Voir le détail des 7 pôles →
            </Link>
          </div>
          <div
            className="g-domain-strip"
            role="group"
            aria-label="Filtrer par filière officielle du CIAT"
          >
            {DOMAINES_CIAT.map((dom) => {
              const active = activeDomaine === dom.code;
              return (
                <button
                  key={dom.code}
                  type="button"
                  aria-pressed={active}
                  onClick={() => {
                    setActiveDomaine(dom.code);
                    setCurrentPage(1);
                  }}
                  className={`g-domain-pill ${
                    active ? "g-domain-pill-active" : ""
                  }`}
                >
                  {dom.code !== "tous" && (
                    <span className="g-domain-num">{dom.numero}</span>
                  )}
                  <span>{dom.shortLabel}</span>
                  <span className="g-domain-count">{domainCounts[dom.code]}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Sous-barre : Résultats + Filtre rapide par Jalon de maturité */}
        <div className="g-results-bar">
          <p className="g-results-meta" aria-live="polite">
            <strong>{filteredFiches.length}</strong>{" "}
            {filteredFiches.length > 1
              ? "fiches d'innovation certifiées"
              : "fiche d'innovation certifiée"}
            {isFiltering && (
              <button
                type="button"
                onClick={() => {
                  setActiveDomaine("tous");
                  setActiveStage("all");
                  setSearchQuery("");
                  setCurrentPage(1);
                }}
                className="ml-3 underline text-[#612D10] hover:text-[#24140D] cursor-pointer"
              >
                Réinitialiser tout
              </button>
            )}
          </p>

          <div
            className="g-stage-pills"
            role="group"
            aria-label="Filtrer par maturité technologique"
          >
            {(
              [
                ["all", "Tous les jalons"],
                ["prototype", "Prototypes"],
                ["mvp", "MVP & Pilotes"],
                ["transfert", "Prêts au transfert"],
              ] as const
            ).map(([code, label]) => (
              <button
                key={code}
                type="button"
                onClick={() => {
                  setActiveStage(code);
                  setCurrentPage(1);
                }}
                className={`g-stage-btn ${
                  activeStage === code ? "g-stage-btn-active" : ""
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Grille ou Liste des fiches */}
        {loading ? (
          <div className="g-cards-grid">
            {Array.from({ length: 6 }).map((_, idx) => (
              <div
                key={idx}
                className="h-[430px] rounded-[20px] bg-white border border-[#E5D7C6] animate-pulse p-5 flex flex-col justify-between"
              >
                <div className="aspect-[16/10] w-full rounded-xl bg-[#EFE4D6]" />
                <div className="space-y-3">
                  <div className="h-4 w-1/3 rounded bg-[#EFE4D6]" />
                  <div className="h-6 w-5/6 rounded bg-[#EFE4D6]" />
                  <div className="h-14 w-full rounded bg-[#FAF7F2]" />
                </div>
              </div>
            ))}
          </div>
        ) : paginatedFiches.length > 0 ? (
          <>
            <div
              className={
                viewMode === "grid" ? "g-cards-grid" : "g-cards-list"
              }
            >
              {paginatedFiches.map((fiche) => {
                return (
                  <article
                    key={fiche.slug}
                    className={`g-card group ${
                      viewMode === "list" ? "g-card-list-mode" : ""
                    }`}
                  >
                    <div className="g-card-media">
                      <Link
                        href={`/galerie/${fiche.slug}`}
                        tabIndex={-1}
                        aria-hidden="true"
                        className="block h-full w-full"
                      >
                        <CardImage
                          src={fiche.visual}
                          alt={fiche.displayTitle}
                          aspectRatio={
                            viewMode === "grid" ? "aspect-[16/10]" : "h-full"
                          }
                          fallbackCategory={fiche.domaineShort}
                          fallbackIcon="prototype"
                        />
                      </Link>

                      <span className="g-badge-stage">{fiche.stageBadge}</span>

                      <button
                        type="button"
                        onClick={() => setQrTarget(fiche)}
                        title="Afficher le QR Code de l'innovation"
                        aria-label={`QR Code pour ${fiche.displayTitle}`}
                        className="g-qr-quick-btn"
                      >
                        <QrCode size={15} />
                      </button>
                    </div>

                    <div className="g-card-body">
                      <div className="g-card-topline">
                        <span className="g-card-domain">
                          Pôle {fiche.domaineNumero} · {fiche.domaineShort}
                        </span>

                        <span
                          className="g-trl-dots"
                          title={`Maturité : jalon ${fiche.trlStep} sur 4`}
                        >
                          {[1, 2, 3, 4].map((step) => (
                            <span
                              key={step}
                              className={`g-trl-dot ${
                                step <= fiche.trlStep ? "g-trl-dot-on" : ""
                              }`}
                            />
                          ))}
                        </span>
                      </div>

                      <h2 className="g-card-title">
                        <Link href={`/galerie/${fiche.slug}`}>
                          {fiche.displayTitle}
                        </Link>
                      </h2>

                      <p className="g-card-excerpt">{fiche.solution}</p>

                      <div className="g-card-team">
                        <span>Porteur :</span>
                        <strong className="truncate">{fiche.teamLead}</strong>
                      </div>

                      <div className="g-card-actions">
                        <Link
                          href={`/galerie/${fiche.slug}`}
                          className="g-link-dossier"
                        >
                          Voir le dossier
                          <ArrowUpRight size={14} />
                        </Link>

                        <button
                          type="button"
                          onClick={() => openInteretModal(fiche)}
                          className="g-btn-interet"
                        >
                          <Handshake size={14} />
                          Je suis intéressé
                        </button>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>

            {/* Pagination si plusieurs pages */}
            {totalPages > 1 && (
              <nav
                className="g-pagination"
                aria-label="Pagination du catalogue des innovations"
              >
                <button
                  type="button"
                  disabled={safePage <= 1}
                  onClick={() => {
                    setCurrentPage((p) => Math.max(1, p - 1));
                    document
                      .getElementById("catalogue")
                      ?.scrollIntoView({ behavior: "smooth" });
                  }}
                  className="g-page-btn"
                >
                  ← Précédent
                </button>

                {Array.from({ length: totalPages }).map((_, idx) => {
                  const p = idx + 1;
                  return (
                    <button
                      key={p}
                      type="button"
                      onClick={() => {
                        setCurrentPage(p);
                        document
                          .getElementById("catalogue")
                          ?.scrollIntoView({ behavior: "smooth" });
                      }}
                      aria-current={safePage === p ? "page" : undefined}
                      className={`g-page-btn ${
                        safePage === p ? "g-page-btn-active" : ""
                      }`}
                    >
                      {String(p).padStart(2, "0")}
                    </button>
                  );
                })}

                <button
                  type="button"
                  disabled={safePage >= totalPages}
                  onClick={() => {
                    setCurrentPage((p) => Math.min(totalPages, p + 1));
                    document
                      .getElementById("catalogue")
                      ?.scrollIntoView({ behavior: "smooth" });
                  }}
                  className="g-page-btn"
                >
                  Suivant →
                </button>
              </nav>
            )}
          </>
        ) : (
          <div className="rounded-2xl bg-white border border-[#E5D7C6] p-12 text-center">
            <h3 className="font-[family-name:var(--font-jakarta)] text-2xl font-extrabold text-[#24140D]">
              Aucune innovation ne correspond à ces critères
            </h3>
            <p className="mt-2 text-sm text-[#655346] max-w-md mx-auto">
              Essayez un terme plus général ou réinitialisez les filtres de
              filière et de maturité pour explorer l&apos;ensemble du catalogue CIAT.
            </p>
            <button
              type="button"
              onClick={() => {
                setActiveDomaine("tous");
                setActiveStage("all");
                setSearchQuery("");
                setCurrentPage(1);
              }}
              className="g-btn-primary mt-6"
            >
              Réinitialiser tous les filtres
            </button>
          </div>
        )}
      </section>

      {/* =====================================================================
       * 4. BANDEAU PRESTIGE : TRANSFERT TECHNOLOGIQUE & INVESTISSEURS
       * ===================================================================== */}
      <section className="g-transfer-band" id="transfert">
        <div className="g-transfer-inner">
          <div>
            <div className="g-eyebrow-row">
              <span
                className="g-eyebrow-line"
                style={{ background: "#C99A68" }}
              />
              <span
                className="g-eyebrow-text"
                style={{ color: "#DFae79" }}
              >
                Valorisation &amp; Industrialisation
              </span>
            </div>

            <h2
              className="g-section-title"
              style={{ color: "#FFFFFF", marginBottom: 16 }}
            >
              Industrialisez une solution éprouvée avec le CIAT
            </h2>

            <p className="text-sm leading-relaxed text-[#E5D7C6] max-w-xl mb-7">
              Industriels, collectivités territoriales, ONG et fonds
              d&apos;amorçage : le guichet de transfert du CIAT sécurise la mise en
              œuvre opérationnelle des prototypes issus de nos 7 filières.
            </p>

            <div className="flex flex-wrap gap-3.5">
              <Link
                href="/portail/contact"
                className="inline-flex items-center gap-2 rounded-xl bg-[#C99A68] hover:bg-[#DFae79] px-6 py-3.5 text-xs sm:text-sm font-extrabold !text-[#24140D] transition shadow-lg"
              >
                Contacter le Bureau de Transfert
                <ArrowRight size={16} />
              </Link>
              <Link
                href="/portail/appels"
                className="inline-flex items-center gap-2 rounded-xl border border-white/30 bg-white/10 hover:bg-white/20 px-6 py-3.5 text-xs sm:text-sm font-bold !text-white transition"
              >
                Soumettre un projet à l&apos;incubateur
              </Link>
            </div>
          </div>

          <div className="g-transfer-pillars">
            <div className="g-pillar-card">
              <span className="g-pillar-num">01</span>
              <div>
                <h3 className="text-sm font-bold !text-white mb-1">
                  Déploiement Pilote en Conditions Réelles
                </h3>
                <p className="text-xs text-[#D8C7B5] leading-relaxed m-0">
                  Expérimentez un prototype certifié sur vos sites agricoles,
                  industriels ou communaux avec suivi technique des ingénieurs ISEP.
                </p>
              </div>
            </div>

            <div className="g-pillar-card">
              <span className="g-pillar-num">02</span>
              <div>
                <h3 className="text-sm font-bold !text-white mb-1">
                  Licence d&apos;Exploitation &amp; Pré-Série Locale
                </h3>
                <p className="text-xs text-[#D8C7B5] leading-relaxed m-0">
                  Accédez aux dossiers de fabrication et accompagnez le passage
                  à l&apos;échelle industrielle au Sénégal.
                </p>
              </div>
            </div>

            <div className="g-pillar-card">
              <span className="g-pillar-num">03</span>
              <div>
                <h3 className="text-sm font-bold !text-white mb-1">
                  Co-Investissement &amp; Amorçage Startups
                </h3>
                <p className="text-xs text-[#D8C7B5] leading-relaxed m-0">
                  Entrez au capital des jeunes pousses incubées ayant franchi
                  avec succès les 5 jalons d&apos;évaluation du comité CIAT.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =====================================================================
       * MODALE 1 : FORMULAIRE OFFICIEL « JE SUIS INTÉRESSÉ » (CONNECTÉ API)
       * ===================================================================== */}
      {interetTarget &&
        mounted &&
        createPortal(
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="galerie-interet-title"
            className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6 bg-black/75 backdrop-blur-sm overflow-y-auto"
            onClick={() => setInteretTarget(null)}
          >
            <div
              className="relative w-full max-w-xl bg-white rounded-3xl p-6 sm:p-8 shadow-2xl border border-[#EFE4D6] my-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                type="button"
                onClick={() => setInteretTarget(null)}
                aria-label="Fermer la fenêtre"
                className="absolute top-5 right-5 h-10 w-10 rounded-full bg-[#FAF7F2] text-[#655346] hover:bg-[#612D10] hover:text-white flex items-center justify-center transition cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>

              <div className="pr-10 mb-6">
                <span className="inline-flex items-center gap-2 text-[11px] font-extrabold tracking-widest uppercase text-[#612D10]">
                  <span className="h-2 w-2 rounded-full bg-[#C99A68]" />
                  Guichet Partenaires &amp; Investisseurs
                </span>
                <h3
                  id="galerie-interet-title"
                  className="mt-1 text-2xl font-bold text-[#24140D]"
                >
                  Manifester votre intérêt
                </h3>
                <p className="mt-1 text-xs sm:text-sm text-[#655346]">
                  Innovation ciblée :{" "}
                  <strong className="text-[#24140D]">
                    {cleanTitle(interetTarget.titre)}
                  </strong>
                </p>
              </div>

              {interetSuccess ? (
                <div className="space-y-4">
                  <div
                    role="status"
                    className="flex items-start gap-3 rounded-2xl bg-emerald-50 border border-emerald-200 p-5 text-emerald-950"
                  >
                    <CheckCircle2 className="h-6 w-6 text-emerald-600 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-bold text-sm">
                        Manifestation transmise au CIAT
                      </p>
                      <p className="mt-1 text-xs text-emerald-800 leading-relaxed">
                        {interetSuccess}
                      </p>
                    </div>
                  </div>
                  <div className="flex justify-end gap-3">
                    <Link
                      href={`/galerie/${interetTarget.slug}`}
                      className="px-5 py-2.5 rounded-xl border border-[#E5D7C6] text-xs font-bold text-[#24140D] hover:bg-[#FAF7F2]"
                    >
                      Consulter le dossier complet
                    </Link>
                    <button
                      type="button"
                      onClick={() => setInteretTarget(null)}
                      className="px-6 py-2.5 rounded-xl bg-[#24140D] text-white text-xs font-bold cursor-pointer"
                    >
                      Fermer
                    </button>
                  </div>
                </div>
              ) : (
                <form
                  onSubmit={handleInteretSubmit}
                  noValidate
                  className="space-y-4"
                >
                  {interetError && (
                    <div
                      role="alert"
                      className="flex items-start gap-3 rounded-xl bg-red-50 border border-red-200 p-4 text-xs text-red-900"
                    >
                      <AlertCircle className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
                      <div>
                        <p className="font-bold">Envoi interrompu</p>
                        <p className="mt-0.5 text-red-800">{interetError}</p>
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label
                        htmlFor="g-interet-nom"
                        className="block text-xs font-bold text-[#24140D] mb-1.5"
                      >
                        Nom complet <span className="text-red-600">*</span>
                      </label>
                      <input
                        id="g-interet-nom"
                        type="text"
                        required
                        value={interetNom}
                        onChange={(e) => setInteretNom(e.target.value)}
                        placeholder="Mme / M. Prénom Nom"
                        disabled={interetSubmitting}
                        className="w-full rounded-xl bg-[#FAF7F2] border border-[#E5D7C6] px-4 py-3 text-sm text-[#24140D] focus:bg-white focus:border-[#612D10] focus:outline-none"
                      />
                      {interetFieldErrors.nom && (
                        <p className="mt-1 text-xs text-red-600">
                          {interetFieldErrors.nom}
                        </p>
                      )}
                    </div>

                    <div>
                      <label
                        htmlFor="g-interet-email"
                        className="block text-xs font-bold text-[#24140D] mb-1.5"
                      >
                        Email professionnel{" "}
                        <span className="text-red-600">*</span>
                      </label>
                      <input
                        id="g-interet-email"
                        type="email"
                        required
                        value={interetEmail}
                        onChange={(e) => setInteretEmail(e.target.value)}
                        placeholder="prenom.nom@structure.sn"
                        disabled={interetSubmitting}
                        className="w-full rounded-xl bg-[#FAF7F2] border border-[#E5D7C6] px-4 py-3 text-sm text-[#24140D] focus:bg-white focus:border-[#612D10] focus:outline-none"
                      />
                      {interetFieldErrors.email && (
                        <p className="mt-1 text-xs text-red-600">
                          {interetFieldErrors.email}
                        </p>
                      )}
                    </div>
                  </div>

                  <div>
                    <label
                      htmlFor="g-interet-org"
                      className="block text-xs font-bold text-[#24140D] mb-1.5"
                    >
                      Organisation / Entreprise / Collectivité
                    </label>
                    <input
                      id="g-interet-org"
                      type="text"
                      value={interetOrg}
                      onChange={(e) => setInteretOrg(e.target.value)}
                      placeholder="Nom de votre entreprise, fonds ou institution"
                      disabled={interetSubmitting}
                      className="w-full rounded-xl bg-[#FAF7F2] border border-[#E5D7C6] px-4 py-3 text-sm text-[#24140D] focus:bg-white focus:border-[#612D10] focus:outline-none"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-1.5">
                      <label
                        htmlFor="g-interet-msg"
                        className="block text-xs font-bold text-[#24140D]"
                      >
                        Objet de la collaboration envisagée{" "}
                        <span className="text-red-600">*</span>
                      </label>
                      <span className="text-[11px] text-[#655346]">
                        {interetMessage.length}/1500
                      </span>
                    </div>
                    <textarea
                      id="g-interet-msg"
                      rows={4}
                      maxLength={1500}
                      required
                      value={interetMessage}
                      onChange={(e) => setInteretMessage(e.target.value)}
                      placeholder="Pilote terrain, industrialisation, financement d'amorçage, démonstration au showroom CIAT…"
                      disabled={interetSubmitting}
                      className="w-full rounded-xl bg-[#FAF7F2] border border-[#E5D7C6] px-4 py-3 text-sm text-[#24140D] focus:bg-white focus:border-[#612D10] focus:outline-none"
                    />
                    {interetFieldErrors.message && (
                      <p className="mt-1 text-xs text-red-600">
                        {interetFieldErrors.message}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center justify-end gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setInteretTarget(null)}
                      className="px-5 py-3 rounded-xl border border-[#E5D7C6] text-xs font-bold text-[#655346] hover:text-[#24140D] cursor-pointer"
                    >
                      Annuler
                    </button>
                    <button
                      type="submit"
                      disabled={interetSubmitting}
                      className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[#612D10] hover:bg-[#24140D] text-white text-xs sm:text-sm font-bold transition cursor-pointer disabled:opacity-60"
                    >
                      {interetSubmitting ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Transmission…
                        </>
                      ) : (
                        <>
                          Transmettre au CIAT
                          <ArrowRight className="h-4 w-4" />
                        </>
                      )}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>,
          document.body
        )}

      {/* =====================================================================
       * MODALE 2 : APERÇU EXPRESS QR CODE SALON & FICHE OFFICIELLE
       * ===================================================================== */}
      {qrTarget &&
        mounted &&
        createPortal(
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="galerie-qr-title"
            className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm"
            onClick={() => setQrTarget(null)}
          >
            <div
              className="relative w-full max-w-md bg-white rounded-3xl p-7 text-center shadow-2xl border border-[#EFE4D6]"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                type="button"
                onClick={() => setQrTarget(null)}
                aria-label="Fermer l'aperçu QR"
                className="absolute top-4 right-4 h-9 w-9 rounded-full bg-[#FAF7F2] text-[#655346] hover:bg-[#612D10] hover:text-white flex items-center justify-center transition cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>

              <span className="text-[10.5px] font-extrabold uppercase tracking-widest text-[#612D10]">
                Badge Salon &amp; Showroom CIAT
              </span>
              <h3
                id="galerie-qr-title"
                className="mt-1 text-lg font-bold text-[#24140D] leading-snug"
              >
                {cleanTitle(qrTarget.titre)}
              </h3>
              <p className="mt-1 text-xs text-[#655346]">
                Scannez ce code pour ouvrir directement la fiche certifiée sur
                mobile lors d&apos;une visite au showroom.
              </p>

              <div className="my-5 inline-flex p-4 rounded-2xl bg-[#FAF7F2] border border-[#E5D7C6]">
                <img
                  src={getFicheQrUrl(qrTarget.slug)}
                  alt={`QR Code officiel ${cleanTitle(qrTarget.titre)}`}
                  className="h-44 w-44 object-contain"
                />
              </div>

              <div className="flex flex-col sm:flex-row gap-2.5">
                <button
                  type="button"
                  onClick={() => handleDownloadQr(qrTarget)}
                  className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-[#24140D] hover:bg-[#612D10] px-4 py-3 text-xs font-bold text-white transition cursor-pointer"
                >
                  <Download size={14} />
                  Télécharger PNG
                </button>
                <Link
                  href={`/galerie/${qrTarget.slug}`}
                  onClick={() => setQrTarget(null)}
                  className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl border border-[#E5D7C6] bg-[#FAF7F2] hover:bg-white px-4 py-3 text-xs font-bold !text-[#24140D] transition"
                >
                  Ouvrir la fiche
                  <ArrowUpRight size={14} />
                </Link>
              </div>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
}
