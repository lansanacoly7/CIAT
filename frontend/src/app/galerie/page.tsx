"use client";

import { useEffect, useState, useTransition } from "react";
import Link from "next/link";
import {
  ApiErrorBanner,
  Badge,
  Button,
  ButtonLink,
  DemoBanner,
  PageTitle,
} from "@/components/ui";
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
  { value: "Prototype", label: "Prototype" },
  { value: "MVP", label: "MVP (Produit Minimum Viable)" },
  { value: "Pilote", label: "Pilote / Phase test" },
  { value: "Déploiement", label: "Déploiement / Échelle" },
];

function getAvancementBadgeTone(avancement: string): "succes" | "alerte" | "info" | "neutre" {
  const norm = avancement.toLowerCase();
  if (norm.includes("déploiement") || norm.includes("deploiement")) return "succes";
  if (norm.includes("pilote")) return "succes";
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
    <div className="bg-[#FAF8F5] min-h-screen py-10">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Bandeau Mode Démonstration */}
        {isDemo && <DemoBanner className="mb-6" />}

        {/* Titre et Présentation */}
        <PageTitle
          tag="Vitrine Technologique CIAT"
          title="Galerie des Innovations"
          subtitle="Explorez les solutions technologiques, prototypes validés et projets industriels incubés au Centre d'Innovation, d'Application et de Transfert de l'ISEP Diamniadio."
        />

        {/* Bandeau d'erreur API si panne */}
        {error && (
          <ApiErrorBanner
            message={error}
            onRetry={() => loadData()}
            className="mb-8"
          />
        )}

        {/* Barre de Recherche et Filtres */}
        <section aria-label="Recherche et filtres" className="mb-10 rounded-2xl border border-bordure bg-white p-6 shadow-sm">
          <form onSubmit={handleSearchSubmit} className="space-y-4">
            <div className="flex flex-col gap-3 sm:flex-row">
              <div className="relative flex-1">
                <input
                  type="text"
                  id="search-input"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Rechercher par titre, problème, solution ou équipe..."
                  className="w-full min-h-[44px] rounded-lg border border-bordure bg-white px-4 py-2.5 text-sm text-brun placeholder:text-texte-doux focus:border-beige focus:outline-none focus:ring-1 focus:ring-beige"
                />
              </div>
              <Button type="submit" variant="primary" className="shrink-0">
                <svg className="mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                Rechercher
              </Button>
            </div>

            {/* Sélecteurs de filtres */}
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              {/* Domaine */}
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
                  className="w-full min-h-[44px] rounded-lg border border-bordure bg-white px-3 py-2 text-sm text-brun focus:border-beige focus:outline-none focus:ring-1 focus:ring-beige"
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
                  className="w-full min-h-[44px] rounded-lg border border-bordure bg-white px-3 py-2 text-sm text-brun focus:border-beige focus:outline-none focus:ring-1 focus:ring-beige"
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
                  Niveau d&apos;avancement
                </label>
                <select
                  id="filter-avancement"
                  value={avancement}
                  onChange={(e) => {
                    setAvancement(e.target.value);
                    setPage(1);
                  }}
                  className="w-full min-h-[44px] rounded-lg border border-bordure bg-white px-3 py-2 text-sm text-brun focus:border-beige focus:outline-none focus:ring-1 focus:ring-beige"
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
                <span className="text-texte-doux">Filtres actifs appliqués</span>
                <button
                  type="button"
                  onClick={handleResetFilters}
                  className="font-semibold text-brun underline transition hover:text-beige"
                >
                  Réinitialiser les filtres
                </button>
              </div>
            )}
          </form>
        </section>

        {/* Compteur de résultats vérifiable */}
        <div className="mb-6 flex items-center justify-between">
          <p className="text-sm font-semibold text-texte-doux">
            {loading
              ? "Recherche des innovations en cours..."
              : total === 0
              ? "Aucune innovation trouvée"
              : total === 1
              ? "1 innovation validée et publiée"
              : `${total} innovations validées et publiées`}
          </p>
          <div className="flex items-center gap-2">
            <span className="inline-block h-2 w-2 rounded-full bg-succes"></span>
            <span className="text-xs text-texte-doux font-medium">Contenu vérifié CIAT</span>
          </div>
        </div>

        {/* État de Chargement */}
        {loading && (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div
                key={i}
                className="h-96 animate-pulse rounded-2xl border border-bordure bg-white p-6 shadow-xs"
              >
                <div className="h-44 w-full rounded-xl bg-ivoire" />
                <div className="mt-4 h-5 w-3/4 rounded bg-ivoire" />
                <div className="mt-2 h-4 w-full rounded bg-ivoire" />
                <div className="mt-4 h-9 w-1/3 rounded bg-ivoire" />
              </div>
            ))}
          </div>
        )}

        {/* État Vide */}
        {!loading && fiches.length === 0 && !error && (
          <div className="rounded-2xl border border-dashed border-bordure bg-white p-12 text-center shadow-xs">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-ivoire text-beige">
              <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
              </svg>
            </div>
            <h3 className="mt-4 text-lg font-bold text-brun">Aucune fiche d&apos;innovation trouvée</h3>
            <p className="mx-auto mt-2 max-w-md text-sm text-texte-doux">
              {hasActiveFilters
                ? "Aucune fiche d'innovation ne correspond aux filtres sélectionnés. Essayez d'élargir votre recherche."
                : "Les fiches d'innovation en cours de validation apparaîtront ici dès leur publication officielle par le comité."}
            </p>
            {hasActiveFilters && (
              <Button onClick={handleResetFilters} variant="secondary" className="mt-6">
                Réinitialiser la recherche
              </Button>
            )}
          </div>
        )}

        {/* Grille des Cartes d'Innovation */}
        {!loading && fiches.length > 0 && (
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {fiches.map((fiche) => {
              const photo = fiche.medias?.find((m) => m.type === "photo");
              const hasVideo = fiche.medias?.some((m) => m.type === "video");
              const hasDemo = fiche.medias?.some((m) => m.type === "demo");

              return (
                <article
                  key={fiche.id}
                  className="group flex flex-col justify-between overflow-hidden rounded-2xl border border-bordure bg-white shadow-xs transition-all duration-200 hover:-translate-y-1 hover:border-beige hover:shadow-md"
                >
                  <div>
                    {/* Zone Image / Média */}
                    <div className="relative h-48 w-full overflow-hidden bg-ivoire">
                      {photo ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={photo.url}
                          alt={fiche.titre}
                          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                          loading="lazy"
                        />
                      ) : (
                        <div className="flex h-full w-full flex-col items-center justify-center bg-gradient-to-br from-ivoire via-white to-ivoire text-beige">
                          <svg className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                          </svg>
                          <span className="mt-2 text-xs font-semibold text-texte-doux">Prototype CIAT</span>
                        </div>
                      )}

                      {/* Badges Médias Présents */}
                      <div className="absolute bottom-2.5 right-2.5 flex items-center gap-1.5">
                        {hasVideo && (
                          <span
                            title="Vidéo de présentation disponible"
                            className="inline-flex h-7 items-center gap-1 rounded-md bg-brun/85 px-2 text-[10px] font-bold text-white backdrop-blur-xs"
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
                            className="inline-flex h-7 items-center gap-1 rounded-md bg-beige/90 px-2 text-[10px] font-bold text-brun-fonce backdrop-blur-xs"
                          >
                            <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                            </svg>
                            Démo
                          </span>
                        )}
                      </div>

                      {/* Badge Avancement */}
                      <div className="absolute top-2.5 left-2.5">
                        <Badge tone={getAvancementBadgeTone(fiche.avancement)}>
                          {fiche.avancement}
                        </Badge>
                      </div>
                    </div>

                    {/* Contenu de la Carte */}
                    <div className="p-5">
                      <div className="mb-2 flex items-center justify-between text-xs text-texte-doux">
                        <span className="flex items-center gap-1">
                          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                          <strong className="text-brun">{fiche.vues}</strong> vues
                        </span>
                        <span className="rounded bg-ivoire px-2 py-0.5 font-mono text-[11px] text-texte-doux">
                          Réf. #{fiche.id}
                        </span>
                      </div>

                      <h2 className="line-clamp-2 text-lg font-bold text-brun transition-colors group-hover:text-beige">
                        <Link href={`/galerie/${fiche.slug}`} className="hover:underline focus:outline-none">
                          {fiche.titre}
                        </Link>
                      </h2>

                      {/* Problème & Solution */}
                      <p className="mt-3 line-clamp-3 text-xs text-texte-doux leading-relaxed">
                        <strong className="font-semibold text-brun">Problème : </strong>
                        {fiche.probleme}
                      </p>

                      <div className="mt-4 border-t border-bordure/60 pt-3">
                        <p className="line-clamp-1 text-xs text-texte-doux">
                          <strong className="font-semibold text-brun">Équipe : </strong>
                          {fiche.equipe}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Pied de Carte avec Action */}
                  <div className="border-t border-bordure/60 bg-[#FAF8F5]/60 px-5 py-3">
                    <ButtonLink
                      href={`/galerie/${fiche.slug}`}
                      variant="outline"
                      className="w-full text-xs font-bold"
                    >
                      Consulter la fiche & QR Code →
                    </ButtonLink>
                  </div>
                </article>
              );
            })}
          </div>
        )}

        {/* Pagination Conforme */}
        {!loading && totalPages > 1 && (
          <nav aria-label="Pagination de la galerie" className="mt-12 flex items-center justify-center gap-3">
            <Button
              variant="secondary"
              disabled={page <= 1}
              onClick={() => {
                setPage((p) => Math.max(1, p - 1));
                window.scrollTo({ top: 0, behavior: "smooth" });
              }}
              className="text-xs"
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
                window.scrollTo({ top: 0, behavior: "smooth" });
              }}
              className="text-xs"
            >
              Suivant →
            </Button>
          </nav>
        )}
      </div>
    </div>
  );
}
