"use client";

import { useEffect, useState, useTransition } from "react";
import Link from "next/link";
import {
  ApiErrorBanner,
  Badge,
  Button,
  ButtonLink,
  DemoBanner,
} from "@/components/ui";
import CardImage from "@/components/CardImage";
import {
  getDomainesOptions,
  getCohortesOptions,
  getFichesInnovation,
  type CohorteOption,
  type DomaineOption,
  type FicheInnovation,
  type GalleryFilterParams,
} from "@/lib/gallery-api";

const AVANCEMENT_OPTIONS = [
  { value: "", label: "Tous les niveaux d'avancement" },
  { value: "Prototype", label: "Prototype fonctionnel" },
  { value: "MVP", label: "MVP (Produit Minimum Viable)" },
  { value: "Pilote", label: "Pilote / Phase test terrain" },
  { value: "Déploiement", label: "Déploiement / Échelle industrielle" },
];

function getAvancementBadgeTone(avancement: string): "succes" | "alerte" | "info" | "neutre" {
  const norm = avancement.toLowerCase();
  if (norm.includes("déploiement") || norm.includes("deploiement")) return "succes";
  if (norm.includes("pilote") || norm.includes("certifié")) return "succes";
  if (norm.includes("mvp")) return "alerte";
  if (norm.includes("prototype")) return "info";
  return "neutre";
}

export default function GaleriePage() {
  const [, startTransition] = useTransition();

  // Filtres
  const [search, setSearch] = useState("");
  const [domaine, setDomaine] = useState("");
  const [cohorte, setCohorte] = useState("");
  const [avancement, setAvancement] = useState("");
  const [page, setPage] = useState(1);

  // Options dynamiques
  const [domainesList, setDomainesList] = useState<DomaineOption[]>([]);
  const [cohortesList, setCohortesList] = useState<CohorteOption[]>([]);

  // Données
  const [fiches, setFiches] = useState<FicheInnovation[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [isDemo, setIsDemo] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Charger les options de filtrage au montage
  useEffect(() => {
    let ignore = false;
    getDomainesOptions().then((d) => {
      if (!ignore) setDomainesList(d);
    });
    getCohortesOptions().then((c) => {
      if (!ignore) setCohortesList(c);
    });
    return () => {
      ignore = true;
    };
  }, []);

  const loadData = (paramsOverride?: Partial<GalleryFilterParams>) => {
    setLoading(true);
    setError(null);

    const queryParams: GalleryFilterParams = {
      search,
      domaine,
      cohorte,
      avancement,
      page,
      pageSize: 9,
      ...paramsOverride,
    };

    getFichesInnovation(queryParams)
      .then((res) => {
        setFiches(res.items);
        setTotal(res.total);
        setTotalPages(res.totalPages);
        setIsDemo(Boolean(res.isDemo));
        setError(res.error);
        setLoading(false);
      })
      .catch(() => {
        setError("La galerie des innovations est momentanément indisponible. Réessayez plus tard.");
        setFiches([]);
        setIsDemo(false);
        setLoading(false);
      });
  };

  useEffect(() => {
    let ignore = false;
    getFichesInnovation({ search, domaine, cohorte, avancement, page, pageSize: 9 })
      .then((res) => {
        if (!ignore) {
          setFiches(res.items);
          setTotal(res.total);
          setTotalPages(res.totalPages);
          setIsDemo(Boolean(res.isDemo));
          setError(res.error);
          setLoading(false);
        }
      })
      .catch(() => {
        if (!ignore) {
          setError("La galerie des innovations est momentanément indisponible. Réessayez plus tard.");
          setFiches([]);
          setIsDemo(false);
          setLoading(false);
        }
      });

    return () => {
      ignore = true;
    };
  }, [search, domaine, cohorte, avancement, page]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    loadData({ search, page: 1 });
  };

  const handleResetFilters = () => {
    startTransition(() => {
      setSearch("");
      setDomaine("");
      setCohorte("");
      setAvancement("");
      setPage(1);
    });
  };

  const hasActiveFilters = Boolean(search || domaine || cohorte || avancement);

  return (
    <div className="bg-[#FAF7F2] min-h-screen">
      {/* ========================================================= */}
      {/* HERO BANNER PRESTIGE CIAT 360                             */}
      {/* ========================================================= */}
      <section className="relative overflow-hidden bg-gradient-to-br from-[#24140D] via-[#351C12] to-[#1C0F0A] text-white py-14 lg:py-18 border-b border-[#C99A68]/30">
        {/* Motif d'arrière-plan géométrique discret */}
        <div
          className="absolute inset-0 opacity-10 pointer-events-none"
          style={{
            backgroundImage: "radial-gradient(#C99A68 1px, transparent 1px)",
            backgroundSize: "28px 28px",
          }}
        />

        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {/* Bandeau Mode Démo si actif */}
          {isDemo && <DemoBanner className="mb-6" />}

          {/* Badge institutionnel */}
          <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3.5 py-1 text-xs font-semibold tracking-wider text-[#C99A68] uppercase backdrop-blur-md border border-[#C99A68]/30 mb-4">
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            Vitrine Technologique & Prototypage Industriel • ISEP Amadou Trawaré
          </div>

          <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6">
            <div className="max-w-3xl">
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-white font-title leading-tight">
                Galerie des Innovations & Prototypes
              </h1>
              <p className="mt-4 text-base sm:text-lg text-white/80 leading-relaxed font-sans">
                Explorez les solutions technologiques validées en atelier, démonstrateurs industriels
                (TRL 4 à 8) et prototypes brevetables incubés au Centre d&apos;Innovation, d&apos;Application
                et de Transfert de Diamniadio.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3 shrink-0">
              <a
                href="#catalogue"
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#C99A68] px-5 py-3 text-xs font-bold text-[#24140D] shadow-md transition-all duration-200 hover:bg-[#d8ab79] hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-[#C99A68]"
              >
                Explorer le catalogue ↓
              </a>
              <ButtonLink
                href="/galerie/gestion"
                variant="secondary"
                className="border border-white/20 bg-white/10 text-white text-xs font-bold hover:bg-white/20 shadow-xs"
              >
                Espace Porteur & Gestion →
              </ButtonLink>
            </div>
          </div>

          {/* Chiffres clés en médaillons */}
          <div className="mt-10 grid grid-cols-2 gap-3 sm:grid-cols-4 pt-8 border-t border-white/10">
            <div className="rounded-xl bg-white/5 p-4 border border-white/10 backdrop-blur-xs">
              <span className="block text-2xl sm:text-3xl font-extrabold text-[#C99A68]">
                {loading ? "..." : total}
              </span>
              <span className="text-xs text-white/70 font-medium">Prototypes & Pilotes</span>
            </div>
            <div className="rounded-xl bg-white/5 p-4 border border-white/10 backdrop-blur-xs">
              <span className="block text-2xl sm:text-3xl font-extrabold text-[#C99A68]">7</span>
              <span className="text-xs text-white/70 font-medium">Pôles d&apos;Excellence</span>
            </div>
            <div className="rounded-xl bg-white/5 p-4 border border-white/10 backdrop-blur-xs">
              <span className="block text-2xl sm:text-3xl font-extrabold text-[#C99A68]">TRL 4-8</span>
              <span className="text-xs text-white/70 font-medium">Niveaux d&apos;Avancement</span>
            </div>
            <div className="rounded-xl bg-white/5 p-4 border border-white/10 backdrop-blur-xs">
              <span className="block text-2xl sm:text-3xl font-extrabold text-[#C99A68]">100%</span>
              <span className="text-xs text-white/70 font-medium">Souveraineté & R&D Locale</span>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================= */}
      {/* SECTION CATALOGUE & FILTRES                               */}
      {/* ========================================================= */}
      <div id="catalogue" className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10">
        {/* Bandeau d'erreur API si panne */}
        {error && (
          <ApiErrorBanner
            message={error}
            onRetry={() => loadData()}
            className="mb-8"
          />
        )}

        {/* ======================================================= */}
        {/* BARRE DE FILTRES PAR PÔLE TECHNOLOGIQUE (Pills)         */}
        {/* ======================================================= */}
        <section aria-label="Filtrage rapide par pôle" className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xs font-bold uppercase tracking-wider text-texte-doux">
              Pôles technologiques d&apos;intervention
            </h2>
            {domaine && (
              <button
                type="button"
                onClick={() => {
                  setDomaine("");
                  setPage(1);
                }}
                className="text-xs font-semibold text-brun hover:text-[#C99A68] underline"
              >
                Voir tous les pôles
              </button>
            )}
          </div>

          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-thin">
            <button
              type="button"
              onClick={() => {
                setDomaine("");
                setPage(1);
              }}
              className={`shrink-0 rounded-full px-4 py-2 text-xs font-bold transition-all duration-200 ${
                !domaine
                  ? "bg-[#612D10] text-white shadow-sm border border-[#612D10]"
                  : "bg-white text-brun border border-bordure hover:border-[#C99A68] hover:text-[#612D10]"
              }`}
            >
              Tous les pôles {!loading && `(${total})`}
            </button>

            {domainesList.map((d) => {
              const isActive = String(domaine) === String(d.id) || domaine === d.slug;
              return (
                <button
                  key={d.id}
                  type="button"
                  onClick={() => {
                    setDomaine(isActive ? "" : String(d.id));
                    setPage(1);
                  }}
                  className={`shrink-0 rounded-full px-4 py-2 text-xs transition-all duration-200 ${
                    isActive
                      ? "bg-[#612D10] text-white font-bold shadow-sm border border-[#612D10]"
                      : "bg-white text-brun border border-bordure hover:border-[#C99A68] hover:text-[#612D10] font-medium"
                  }`}
                >
                  {d.nom}
                </button>
              );
            })}
          </div>
        </section>

        {/* ======================================================= */}
        {/* BARRE DE RECHERCHE AVANCÉE & SÉLECTEURS                  */}
        {/* ======================================================= */}
        <section aria-label="Recherche et filtres avancés" className="mb-8 rounded-2xl border border-bordure bg-white p-5 shadow-xs">
          <form onSubmit={handleSearchSubmit} className="space-y-4">
            <div className="flex flex-col gap-3 sm:flex-row">
              <div className="relative flex-1">
                <input
                  type="text"
                  id="search-input"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Rechercher par prototype, problème, technologie ou équipe..."
                  className="w-full min-h-[44px] rounded-xl border border-bordure bg-white px-4 py-2.5 text-sm text-brun placeholder:text-texte-doux focus:border-[#C99A68] focus:outline-none focus:ring-1 focus:ring-[#C99A68]"
                />
                {search && (
                  <button
                    type="button"
                    onClick={() => {
                      setSearch("");
                      setPage(1);
                    }}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-texte-doux hover:text-brun"
                  >
                    ✕
                  </button>
                )}
              </div>
              <Button type="submit" variant="primary" className="shrink-0 rounded-xl px-5">
                <svg className="mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                Rechercher
              </Button>
            </div>

            {/* Sélecteurs de filtres détaillés */}
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 pt-2">
              {/* Domaine sélecteur */}
              <div>
                <label htmlFor="filter-domaine" className="mb-1 block text-xs font-bold uppercase tracking-wider text-texte-doux">
                  Domaine d&apos;intervention
                </label>
                <select
                  id="filter-domaine"
                  value={domaine}
                  onChange={(e) => {
                    setDomaine(e.target.value);
                    setPage(1);
                  }}
                  className="w-full min-h-[44px] rounded-xl border border-bordure bg-white px-3 py-2 text-sm text-brun focus:border-[#C99A68] focus:outline-none focus:ring-1 focus:ring-[#C99A68]"
                >
                  <option value="">Tous les domaines</option>
                  {domainesList.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.nom}
                    </option>
                  ))}
                </select>
              </div>

              {/* Cohorte */}
              <div>
                <label htmlFor="filter-cohorte" className="mb-1 block text-xs font-bold uppercase tracking-wider text-texte-doux">
                  Cohorte d&apos;incubation
                </label>
                <select
                  id="filter-cohorte"
                  value={cohorte}
                  onChange={(e) => {
                    setCohorte(e.target.value);
                    setPage(1);
                  }}
                  className="w-full min-h-[44px] rounded-xl border border-bordure bg-white px-3 py-2 text-sm text-brun focus:border-[#C99A68] focus:outline-none focus:ring-1 focus:ring-[#C99A68]"
                >
                  <option value="">Toutes les cohortes</option>
                  {cohortesList.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.nom}
                    </option>
                  ))}
                </select>
              </div>

              {/* Avancement */}
              <div>
                <label htmlFor="filter-avancement" className="mb-1 block text-xs font-bold uppercase tracking-wider text-texte-doux">
                  Niveau d&apos;avancement TRL
                </label>
                <select
                  id="filter-avancement"
                  value={avancement}
                  onChange={(e) => {
                    setAvancement(e.target.value);
                    setPage(1);
                  }}
                  className="w-full min-h-[44px] rounded-xl border border-bordure bg-white px-3 py-2 text-sm text-brun focus:border-[#C99A68] focus:outline-none focus:ring-1 focus:ring-[#C99A68]"
                >
                  {AVANCEMENT_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Réinitialisation */}
            {hasActiveFilters && (
              <div className="flex items-center justify-between border-t border-bordure/60 pt-3 text-xs">
                <span className="text-texte-doux font-medium">Filtres actifs appliqués</span>
                <button
                  type="button"
                  onClick={handleResetFilters}
                  className="font-bold text-[#612D10] underline transition hover:text-[#C99A68]"
                >
                  Réinitialiser tous les filtres
                </button>
              </div>
            )}
          </form>
        </section>

        {/* Compteur de résultats vérifiable */}
        <div className="mb-6 flex items-center justify-between">
          <p className="text-sm font-semibold text-brun">
            {loading
              ? "Recherche des innovations en cours..."
              : total === 0
              ? "Aucune innovation trouvée"
              : total === 1
              ? "1 innovation validée et répertoriée"
              : `${total} innovations validées et répertoriées`}
          </p>
          <div className="flex items-center gap-2">
            <span className="inline-block h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs text-texte-doux font-semibold">Contenu certifié CIAT</span>
          </div>
        </div>

        {/* ======================================================= */}
        {/* ÉTAT DE CHARGEMENT SQUELETTES                           */}
        {/* ======================================================= */}
        {loading && (
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div
                key={i}
                className="h-[460px] animate-pulse rounded-2xl border border-bordure bg-white p-5 shadow-xs"
              >
                <div className="h-52 w-full rounded-xl bg-[#EFE9DF]" />
                <div className="mt-4 h-5 w-3/4 rounded bg-[#EFE9DF]" />
                <div className="mt-2 h-4 w-full rounded bg-[#EFE9DF]" />
                <div className="mt-2 h-4 w-5/6 rounded bg-[#EFE9DF]" />
                <div className="mt-6 h-10 w-full rounded-xl bg-[#EFE9DF]" />
              </div>
            ))}
          </div>
        )}

        {/* ======================================================= */}
        {/* ÉTAT VIDE                                               */}
        {/* ======================================================= */}
        {!loading && fiches.length === 0 && !error && (
          <div className="rounded-2xl border border-dashed border-bordure bg-white p-12 text-center shadow-xs">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#FAF7F2] text-[#C99A68]">
              <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
              </svg>
            </div>
            <h3 className="mt-4 text-lg font-bold text-brun font-title">Aucune fiche d&apos;innovation trouvée</h3>
            <p className="mx-auto mt-2 max-w-md text-sm text-texte-doux leading-relaxed">
              {hasActiveFilters
                ? "Aucune fiche d'innovation ne correspond aux filtres sélectionnés. Essayez de réinitialiser la recherche."
                : "Les fiches d'innovation en cours de validation apparaîtront ici dès leur publication officielle par le comité technique."}
            </p>
            {hasActiveFilters && (
              <Button onClick={handleResetFilters} variant="secondary" className="mt-6">
                Réinitialiser la recherche
              </Button>
            )}
          </div>
        )}

        {/* ======================================================= */}
        {/* GRILLE DES CARTES D'INNOVATION                          */}
        {/* ======================================================= */}
        {!loading && fiches.length > 0 && (
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {fiches.map((fiche) => {
              const photo = fiche.medias?.find((m) => m.type === "photo");
              const hasVideo = fiche.medias?.some((m) => m.type === "video");
              const hasDemo = fiche.medias?.some((m) => m.type === "demo");

              return (
                <article
                  key={fiche.id}
                  className="group flex flex-col justify-between overflow-hidden rounded-2xl border border-bordure bg-white shadow-xs transition-all duration-300 hover:-translate-y-1 hover:border-[#C99A68] hover:shadow-lg"
                >
                  <div>
                    {/* Zone Image / Média avec aspect-ratio préservé et repli visuel */}
                    <div className="relative w-full overflow-hidden bg-[#FAF7F2]">
                      <div className="overflow-hidden">
                        <CardImage
                          src={photo?.url}
                          alt={fiche.titre}
                          aspectRatio="aspect-[16/10]"
                          fallbackCategory="Prototype CIAT"
                          fallbackIcon="prototype"
                          className="transition-transform duration-500 ease-out group-hover:scale-105"
                        />
                      </div>

                      {/* Badge Avancement / TRL (Flottant haut gauche) */}
                      <div className="absolute top-3 left-3 z-10">
                        <Badge tone={getAvancementBadgeTone(fiche.avancement)}>
                          {fiche.avancement}
                        </Badge>
                      </div>

                      {/* Badge Référence (Flottant haut droite) */}
                      <div className="absolute top-3 right-3 z-10">
                        <span className="rounded-md bg-black/60 px-2 py-0.5 font-mono text-[11px] font-bold text-white backdrop-blur-xs">
                          Réf. #{fiche.id}
                        </span>
                      </div>

                      {/* Badges Médias Présents (Flottant bas droite) */}
                      <div className="absolute bottom-3 right-3 z-10 flex items-center gap-1.5">
                        {hasVideo && (
                          <span
                            title="Vidéo de présentation disponible"
                            className="inline-flex h-6 items-center gap-1 rounded-md bg-[#24140D]/85 px-2 text-[10px] font-bold text-white backdrop-blur-xs"
                          >
                            <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
                              <path d="M6.3 2.841A1.5 1.5 0 004 4.11v11.78a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" />
                            </svg>
                            Vidéo
                          </span>
                        )}
                        {hasDemo && (
                          <span
                            title="Démonstration en direct disponible"
                            className="inline-flex h-6 items-center gap-1 rounded-md bg-[#C99A68] px-2 text-[10px] font-bold text-[#24140D] backdrop-blur-xs"
                          >
                            <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                            </svg>
                            Démo
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Contenu de la Carte */}
                    <div className="p-5">
                      {/* Compteur de vues */}
                      <div className="mb-2.5 flex items-center justify-between text-xs text-texte-doux">
                        <span className="flex items-center gap-1 font-medium">
                          <svg className="h-4 w-4 text-[#C99A68]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                          <strong className="text-brun">{fiche.vues}</strong> consultations
                        </span>
                        <span className="text-[11px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full font-semibold">
                          Validé
                        </span>
                      </div>

                      {/* Titre */}
                      <h3 className="line-clamp-2 text-base sm:text-lg font-bold text-brun font-title leading-snug transition-colors group-hover:text-[#612D10]">
                        <Link href={`/galerie/${fiche.slug}`} className="hover:underline focus:outline-none">
                          {fiche.titre}
                        </Link>
                      </h3>

                      {/* Problème & Solution */}
                      <div className="mt-3 space-y-2">
                        <p className="line-clamp-2 text-xs text-texte-doux leading-relaxed">
                          <span className="font-bold text-[#612D10]">Défi : </span>
                          {fiche.probleme}
                        </p>
                        {fiche.solution && (
                          <p className="line-clamp-2 text-xs text-texte-doux leading-relaxed">
                            <span className="font-bold text-emerald-800">Solution : </span>
                            {fiche.solution}
                          </p>
                        )}
                      </div>

                      {/* Équipe porteuse */}
                      <div className="mt-4 border-t border-bordure/60 pt-3">
                        <p className="line-clamp-1 text-xs text-texte-doux flex items-center gap-1.5">
                          <svg className="h-3.5 w-3.5 text-texte-doux shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                          <span className="truncate">
                            <strong className="font-semibold text-brun">Équipe : </strong>
                            {fiche.equipe}
                          </span>
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Pied de Carte avec Action */}
                  <div className="border-t border-bordure/60 bg-[#FAF7F2]/80 px-5 py-3">
                    <ButtonLink
                      href={`/galerie/${fiche.slug}`}
                      variant="outline"
                      className="w-full text-xs font-bold py-2.5 rounded-xl border border-bordure group-hover:border-[#612D10] group-hover:bg-[#612D10] group-hover:text-white transition-all duration-200"
                    >
                      Consulter la fiche & QR Code →
                    </ButtonLink>
                  </div>
                </article>
              );
            })}
          </div>
        )}

        {/* ======================================================= */}
        {/* PAGINATION                                              */}
        {/* ======================================================= */}
        {!loading && totalPages > 1 && (
          <nav aria-label="Pagination de la galerie" className="mt-12 flex items-center justify-center gap-3">
            <Button
              variant="secondary"
              disabled={page <= 1}
              onClick={() => {
                setPage((p) => Math.max(1, p - 1));
                const target = document.getElementById("catalogue");
                if (target) target.scrollIntoView({ behavior: "smooth" });
              }}
              className="text-xs rounded-xl"
            >
              ← Précédent
            </Button>
            <span className="text-sm font-semibold text-brun px-3">
              Page {page} sur {totalPages}
            </span>
            <Button
              variant="secondary"
              disabled={page >= totalPages}
              onClick={() => {
                setPage((p) => Math.min(totalPages, p + 1));
                const target = document.getElementById("catalogue");
                if (target) target.scrollIntoView({ behavior: "smooth" });
              }}
              className="text-xs rounded-xl"
            >
              Suivant →
            </Button>
          </nav>
        )}
      </div>
    </div>
  );
}
