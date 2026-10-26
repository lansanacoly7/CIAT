"use client";

import { useEffect, useState, useTransition } from "react";
import Link from "next/link";
import { ApiErrorBanner, Badge, Button, ButtonLink, Card, DemoBanner, PageTitle } from "@/components/ui";
import {
  getProjetsIncubes,
  type ProjetIncube,
  type ProjetsFilterParams,
} from "@/lib/portal-api";

const DOMAINES_OPTIONS = [
  { value: "", label: "Tous les domaines (7)" },
  { value: "tic-ia", label: "Technologies de l'Information et IA" },
  { value: "mecanique-systemes", label: "Ingénierie Mécanique & Systèmes Automatisés" },
  { value: "agriculture-agroalimentaire", label: "Agriculture de Précision & Agro-alimentaire" },
  { value: "energies-renouvelables", label: "Énergies Renouvelables & Efficacité Énergétique" },
  { value: "sante-numerique", label: "Santé Numérique & Technologies Médicales" },
  { value: "edtech", label: "Technologies pour l'Éducation (EdTech)" },
  { value: "services-numeriques", label: "Services Numériques & Plateformes Collaboratives" },
];

const STATUTS_OPTIONS = [
  { value: "", label: "Tous les statuts publics" },
  { value: "incube", label: "En incubation" },
  { value: "prototype", label: "Prototype validé" },
  { value: "termine", label: "Incubation terminée" },
];

const COHORTES_OPTIONS = [
  { value: "", label: "Toutes les cohortes" },
  { value: "2026", label: "Cohorte 2026 - Diamniadio Innov" },
  { value: "2025", label: "Cohorte 2025 - Alpha" },
];

function getStatusBadge(statut: ProjetIncube["statut"]) {
  switch (statut) {
    case "prototype":
      return { label: "Prototype validé", tone: "info" as const };
    case "incube":
      return { label: "En incubation", tone: "alerte" as const };
    case "termine":
      return { label: "Incubation terminée", tone: "succes" as const };
    default:
      return { label: statut, tone: "neutre" as const };
  }
}

export default function ProjetsAnnuairePage() {
  const [, startTransition] = useTransition();

  // Filtres
  const [search, setSearch] = useState("");
  const [domaine, setDomaine] = useState("");
  const [statut, setStatut] = useState("");
  const [cohorte, setCohorte] = useState("");
  const [page, setPage] = useState(1);

  // Données
  const [projets, setProjets] = useState<ProjetIncube[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [fromApi, setFromApi] = useState(false);
  const [isDemo, setIsDemo] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchProjets = (paramsOverride?: Partial<ProjetsFilterParams>) => {
    setLoading(true);
    setError(null);

    const queryParams: ProjetsFilterParams = {
      search,
      domaine,
      statut,
      cohorte,
      page,
      pageSize: 6,
      ...paramsOverride,
    };

    getProjetsIncubes(queryParams)
      .then((res) => {
        setProjets(res.items);
        setTotal(res.total);
        setTotalPages(res.totalPages);
        setFromApi(res.fromApi);
        setIsDemo(Boolean(res.isDemo));
        setError(res.error);
        setLoading(false);
      })
      .catch(() => {
        setError("L'annuaire des projets est momentanément indisponible. Réessayez plus tard.");
        setProjets([]);
        setIsDemo(false);
        setLoading(false);
      });
  };

  useEffect(() => {
    let ignore = false;
    getProjetsIncubes({ search, domaine, statut, cohorte, page, pageSize: 6 })
      .then((res) => {
        if (!ignore) {
          setProjets(res.items);
          setTotal(res.total);
          setTotalPages(res.totalPages);
          setFromApi(res.fromApi);
          setIsDemo(Boolean(res.isDemo));
          setError(res.error);
          setLoading(false);
        }
      })
      .catch(() => {
        if (!ignore) {
          setError("L'annuaire des projets est momentanément indisponible. Réessayez plus tard.");
          setProjets([]);
          setIsDemo(false);
          setLoading(false);
        }
      });

    return () => {
      ignore = true;
    };
  }, [search, domaine, statut, cohorte, page]);

  const handleResetFilters = () => {
    startTransition(() => {
      setSearch("");
      setDomaine("");
      setStatut("");
      setCohorte("");
      setPage(1);
    });
  };

  const hasActiveFilters = Boolean(search || domaine || statut || cohorte);

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 md:py-16">
      <PageTitle
        tag="Module 1 · Portail Public"
        title="Annuaire des Projets Incubés"
        subtitle="Explorez les projets d'innovation et prototypes technologiques conçus, développés et accompagnés au sein du CIAT à Diamniadio."
      />

      {/* Mode Démonstration si activé explicitement */}
      {isDemo && <DemoBanner />}

      {/* Barre de recherche et de filtres combinés */}
      <div className="mb-8 rounded-2xl border border-bordure bg-white p-5 shadow-sm md:p-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {/* Recherche textuelle */}
          <div className="lg:col-span-1">

            <label htmlFor="search-input" className="mb-1 block text-xs font-bold uppercase tracking-wider text-texte-doux">
              Recherche
            </label>
            <div className="relative">
              <input
                id="search-input"
                type="text"
                placeholder="Mot-clé, solution..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                className="w-full rounded-lg border border-bordure bg-ivoire px-3 py-2 text-sm text-texte placeholder-texte-doux focus:border-brun focus:outline-none focus:ring-1 focus:ring-brun"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => {
                    setSearch("");
                    setPage(1);
                  }}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-texte-doux hover:text-brun"
                  aria-label="Effacer la recherche"
                >
                  ✕
                </button>
              )}
            </div>
          </div>

          {/* Filtre Domaine */}
          <div>
            <label htmlFor="domaine-select" className="mb-1 block text-xs font-bold uppercase tracking-wider text-texte-doux">
              Filière / Domaine
            </label>
            <select
              id="domaine-select"
              value={domaine}
              onChange={(e) => {
                setDomaine(e.target.value);
                setPage(1);
              }}
              className="w-full rounded-lg border border-bordure bg-ivoire px-3 py-2 text-sm text-texte focus:border-brun focus:outline-none focus:ring-1 focus:ring-brun"
            >
              {DOMAINES_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          {/* Filtre Statut */}
          <div>
            <label htmlFor="statut-select" className="mb-1 block text-xs font-bold uppercase tracking-wider text-texte-doux">
              Stade d&apos;avancement
            </label>
            <select
              id="statut-select"
              value={statut}
              onChange={(e) => {
                setStatut(e.target.value);
                setPage(1);
              }}
              className="w-full rounded-lg border border-bordure bg-ivoire px-3 py-2 text-sm text-texte focus:border-brun focus:outline-none focus:ring-1 focus:ring-brun"
            >
              {STATUTS_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          {/* Filtre Cohorte */}
          <div>
            <label htmlFor="cohorte-select" className="mb-1 block text-xs font-bold uppercase tracking-wider text-texte-doux">
              Promotion / Cohorte
            </label>
            <select
              id="cohorte-select"
              value={cohorte}
              onChange={(e) => {
                setCohorte(e.target.value);
                setPage(1);
              }}
              className="w-full rounded-lg border border-bordure bg-ivoire px-3 py-2 text-sm text-texte focus:border-brun focus:outline-none focus:ring-1 focus:ring-brun"
            >
              {COHORTES_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Ligne d'action et réinitialisation */}
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-bordure pt-3">
          <div className="flex items-center gap-2 text-xs text-texte-doux">
            <span>
              <strong>{total}</strong> {total > 1 ? "projets trouvés" : "projet trouvé"}
            </span>
            {hasActiveFilters && (
              <span className="rounded bg-beige/30 px-2 py-0.5 font-medium text-brun">
                Filtres actifs
              </span>
            )}
          </div>

          {hasActiveFilters && (
            <button
              type="button"
              onClick={handleResetFilters}
              className="text-xs font-bold text-brun hover:text-brun-fonce hover:underline"
            >
              Réinitialiser tous les filtres ↺
            </button>
          )}
        </div>
      </div>

      {/* État d'erreur réseau */}
      {error && (
        <ApiErrorBanner
          message={error}
          onRetry={() => fetchProjets()}
          className="mb-8"
        />
      )}

      {/* Barre d'état source */}
      {!error && (
        <div className="mb-6 flex items-center justify-between">
          <p className="text-xs text-texte-doux">
            Affichage des projets officiels enregistrés dans l&apos;incubateur CIAT
          </p>
          <Badge tone={fromApi ? "succes" : isDemo ? "alerte" : "neutre"}>
            {fromApi ? "Connecté à l'API" : isDemo ? "Mode démo" : "CIAT"}
          </Badge>
        </div>
      )}

      {/* État de chargement */}
      {loading ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((idx) => (
            <div
              key={idx}
              className="h-72 rounded-xl border border-bordure bg-ivoire p-6 animate-pulse flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="h-4 w-1/3 rounded bg-bordure" />
                <div className="h-6 w-3/4 rounded bg-bordure" />
                <div className="h-16 w-full rounded bg-bordure" />
              </div>
              <div className="h-4 w-1/2 rounded bg-bordure" />
            </div>
          ))}
        </div>
      ) : error && projets.length === 0 ? null : projets.length === 0 ? (
        /* État aucun résultat : Critère d'acceptation obligatoire */
        <div className="rounded-2xl border border-dashed border-bordure bg-ivoire p-12 text-center">
          <p className="text-base font-bold text-brun">Aucun projet ne correspond à vos critères de recherche.</p>
          <p className="mt-2 text-sm text-texte-doux">
            Essayez de modifier vos termes de recherche ou de réinitialiser les filtres pour découvrir l&apos;ensemble des initiatives.
          </p>
          <div className="mt-6 flex justify-center gap-3">
            <Button variant="primary" onClick={handleResetFilters}>
              Réinitialiser les filtres
            </Button>
            <ButtonLink href="/portail" variant="secondary">
              Retour au portail
            </ButtonLink>
          </div>
        </div>
      ) : (
        /* Grille des cartes projets */
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {projets.map((projet) => {
            const statusBadge = getStatusBadge(projet.statut);
            return (
              <Card
                key={projet.id}
                className="flex h-full flex-col justify-between transition-shadow hover:shadow-md"
              >
                <div>
                  {/* Badges de domaine et statut */}
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-beige">
                      {projet.cohorte.nom}
                    </span>
                    <Badge tone={statusBadge.tone} className="text-[11px]">
                      {statusBadge.label}
                    </Badge>
                  </div>

                  {/* Titre du projet */}
                  <h2 className="mt-3 text-lg font-bold text-brun leading-snug">
                    {projet.titre}
                  </h2>

                  {/* Domaine */}
                  <p className="mt-1 text-xs font-semibold text-brun-fonce/80">
                    {projet.domaine.nom}
                  </p>

                  {/* Résumé robuste : line-clamp-3 garantit qu'un résumé très long ne casse JAMAIS la carte */}
                  <p className="mt-3 text-sm leading-relaxed text-texte-doux line-clamp-3">
                    {projet.resume}
                  </p>

                  {/* Porteur / Équipe */}
                  <div className="mt-4 flex items-center gap-1.5 text-xs text-texte-doux">
                    <svg className="h-3.5 w-3.5 text-beige" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    <span>Porté par : <strong className="text-brun">{projet.porteur_nom}</strong></span>
                  </div>
                </div>

                {/* Lien vers la fiche de détail */}
                <div className="mt-6 border-t border-bordure pt-4">
                  <Link
                    href={`/portail/projets/${projet.id}`}
                    className="inline-flex min-h-[44px] items-center text-sm font-bold text-brun hover:text-brun-fonce hover:underline"
                  >
                    Consulter la fiche détaillée →
                  </Link>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {!loading && totalPages > 1 && (
        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-bordure pt-6 sm:flex-row">
          <p className="text-xs text-texte-doux">
            Page <strong>{page}</strong> sur <strong>{totalPages}</strong> ({total} projets au total)
          </p>

          <div className="flex gap-2">
            <Button
              variant="secondary"
              disabled={page <= 1}
              onClick={() => setPage((prev) => Math.max(1, prev - 1))}
              className="text-xs"
            >
              ← Page précédente
            </Button>
            <Button
              variant="secondary"
              disabled={page >= totalPages}
              onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
              className="text-xs"
            >
              Page suivante →
            </Button>
          </div>
        </div>
      )}

      {/* Navigation retour */}
      <div className="mt-12 flex items-center justify-between border-t border-bordure pt-6">
        <ButtonLink href="/portail" variant="secondary" className="text-xs">
          ← Retour au Hub Portail
        </ButtonLink>
        <ButtonLink href="/portail/appels" variant="accent" className="text-xs">
          Rejoindre l&apos;incubateur (Appels ouverts) →
        </ButtonLink>
      </div>
    </div>
  );
}
