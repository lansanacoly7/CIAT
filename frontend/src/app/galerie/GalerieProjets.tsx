"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import CardImage from "@/components/CardImage";

import { getFichesInnovation, type FicheInnovation } from "@/lib/gallery-api";
import Image from "next/image";
import { ArrowRight } from "lucide-react";
import "./galerie.css";
import {
  DOMAINES_CIAT,
  inferDomaine,
  resolveFicheVisual,
  type DomaineCode,
} from "./galerie-visuals";

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

function cleanTitle(raw: string): string {
  return raw.replace(/\s*\((Brouillon|En validation)\)\s*$/i, "").trim();
}

const PAGE_SIZE = 9;

const FIELD =
  "w-full rounded-xl border border-bordure bg-white px-3.5 py-2.5 text-sm text-texte focus:border-beige focus:outline-none focus:ring-1 focus:ring-beige";

export default function GalerieProjets() {
  const [rawFiches, setRawFiches] = useState<FicheInnovation[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeDomaine, setActiveDomaine] = useState<DomaineCode>("tous");
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  // Pré-filtrage quand on arrive depuis /portail/domaines (?domaine=...)
  useEffect(() => {
    const domParam = new URLSearchParams(window.location.search).get("domaine") as DomaineCode | null;
    if (domParam && domParam !== "tous" && DOMAINES_CIAT.some((d) => d.code === domParam)) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setActiveDomaine(domParam);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    getFichesInnovation({ pageSize: 50 })
      .then((res) => {
        if (cancelled) return;
        setRawFiches(res.items && res.items.length > 0 ? res.items : FALLBACK_FICHES);
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

  const fiches = useMemo(
    () =>
      rawFiches.map((fiche) => {
        const domaine = inferDomaine(fiche);
        const meta = DOMAINES_CIAT.find((d) => d.code === domaine)!;
        return {
          ...fiche,
          displayTitle: cleanTitle(fiche.titre),
          domaine,
          domaineLabel: meta.shortLabel,
          visual: resolveFicheVisual(fiche, domaine),
        };
      }),
    [rawFiches]
  );

  const filtered = useMemo(() => {
    const q = searchQuery.trim().toLocaleLowerCase("fr");
    return fiches.filter((f) => {
      if (activeDomaine !== "tous" && f.domaine !== activeDomaine) return false;
      if (!q) return true;
      return [f.displayTitle, f.probleme, f.solution, f.equipe]
        .join(" ")
        .toLocaleLowerCase("fr")
        .includes(q);
    });
  }, [fiches, activeDomaine, searchQuery]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const page = Math.min(currentPage, totalPages);
  const pageItems = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <>
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
                  {fiches.length > 0 ? fiches.length : 26}
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
              <a href="/portail/partenaires" className="g-btn-secondary">
                Partenariats &amp; Transfert
              </a>
            </div>
          </div>
        </div>
      </section>

      </div>
    <div id="catalogue" className="mx-auto w-full scroll-mt-20 max-w-7xl px-4 py-16 sm:px-6 md:py-24 lg:px-8">

      <div className="grid max-w-2xl gap-3 sm:grid-cols-2">
        <div>
          <label htmlFor="galerie-search" className="sr-only">
            Rechercher une innovation
          </label>
          <input
            id="galerie-search"
            type="search"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            placeholder="Rechercher"
            className={FIELD}
          />
        </div>
        <div>
          <label htmlFor="galerie-domaine" className="sr-only">
            Domaine
          </label>
          <select
            id="galerie-domaine"
            value={activeDomaine}
            onChange={(e) => {
              setActiveDomaine(e.target.value as DomaineCode);
              setCurrentPage(1);
            }}
            className={FIELD}
          >
            {DOMAINES_CIAT.map((d) => (
              <option key={d.code} value={d.code}>
                {d.code === "tous" ? "Tous les domaines" : d.shortLabel}
              </option>
            ))}
          </select>
        </div>
      </div>

      <p className="mb-10 mt-4 text-sm text-texte-doux" aria-live="polite">
        {filtered.length} {filtered.length > 1 ? "innovations" : "innovation"}
      </p>

      {loading ? (
        <div className="grid gap-x-8 gap-y-12 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="aspect-[4/3] animate-pulse rounded-2xl bg-ivoire" />
          ))}
        </div>
      ) : pageItems.length === 0 ? (
        <div className="py-16 text-center">
          <p className="font-semibold text-brun">Aucune innovation ne correspond à votre recherche.</p>
          <button
            type="button"
            onClick={() => {
              setActiveDomaine("tous");
              setSearchQuery("");
              setCurrentPage(1);
            }}
            className="mt-4 text-sm font-medium text-brun hover:underline"
          >
            Effacer les filtres
          </button>
        </div>
      ) : (
        <div className="grid gap-x-8 gap-y-12 md:grid-cols-2 lg:grid-cols-3">
          {pageItems.map((fiche) => (
            <article key={fiche.slug}>
              <Link
                href={`/galerie/${fiche.slug}`}
                tabIndex={-1}
                aria-hidden="true"
                className="block overflow-hidden rounded-2xl"
              >
                <CardImage
                  src={fiche.visual}
                  alt=""
                  aspectRatio="aspect-[4/3]"
                  fallbackCategory={fiche.domaineLabel}
                  fallbackIcon="prototype"
                />
              </Link>
              <p className="mt-3 text-xs text-texte-doux">{fiche.domaineLabel}</p>
              <h2 className="mt-1 text-[15px] font-semibold leading-snug">
                <Link href={`/galerie/${fiche.slug}`} className="hover:underline">
                  {fiche.displayTitle}
                </Link>
              </h2>
              <p className="mt-1.5 line-clamp-2 text-[13px] leading-relaxed text-texte-doux">{fiche.solution}</p>
            </article>
          ))}
        </div>
      )}

      {!loading && totalPages > 1 && (
        <nav aria-label="Pagination" className="mt-16 flex items-center justify-center gap-4 text-sm">
          <button
            type="button"
            disabled={page <= 1}
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            className="font-medium text-brun hover:underline disabled:opacity-40 disabled:no-underline"
          >
            ← Précédent
          </button>
          <span className="text-texte-doux">
            {page} / {totalPages}
          </span>
          <button
            type="button"
            disabled={page >= totalPages}
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            className="font-medium text-brun hover:underline disabled:opacity-40 disabled:no-underline"
          >
            Suivant →
          </button>
        </nav>
      )}
    </div>
    </>
  );
}
