"use client";

import { useEffect, useState, useTransition } from "react";
import Link from "next/link";
import { ApiErrorBanner, Button, DemoBanner } from "@/components/ui";
import PageHero from "@/components/PageHero";
import {
  getProjetsIncubes,
  type ProjetIncube,
  type ProjetsFilterParams,
} from "@/lib/portal-api";

const DOMAINES_OPTIONS = [
  { value: "", label: "Tous les domaines" },
  { value: "tic-ia", label: "Technologies de l'Information et IA" },
  { value: "mecanique-systemes", label: "Ingénierie Mécanique & Systèmes Automatisés" },
  { value: "agriculture-agroalimentaire", label: "Agriculture de Précision & Agro-alimentaire" },
  { value: "energies-renouvelables", label: "Énergies Renouvelables & Efficacité Énergétique" },
  { value: "sante-numerique", label: "Santé Numérique & Technologies Médicales" },
  { value: "edtech", label: "Technologies pour l'Éducation (EdTech)" },
  { value: "services-numeriques", label: "Services Numériques & Plateformes Collaboratives" },
];

const STATUTS_OPTIONS = [
  { value: "", label: "Tous les stades" },
  { value: "incube", label: "En incubation" },
  { value: "prototype", label: "Prototype validé" },
  { value: "termine", label: "Incubation terminée" },
];

const COHORTES_OPTIONS = [
  { value: "", label: "Toutes les cohortes" },
  { value: "2026", label: "Cohorte 2026" },
  { value: "2025", label: "Cohorte 2025" },
];

const STATUT_LABELS: Record<ProjetIncube["statut"], string> = {
  prototype: "Prototype validé",
  incube: "En incubation",
  termine: "Incubation terminée",
};

const FIELD =
  "w-full rounded-xl border border-bordure bg-white px-3.5 py-2.5 text-sm text-texte focus:border-beige focus:outline-none focus:ring-1 focus:ring-beige";

export default function ProjetsAnnuairePage() {
  const [, startTransition] = useTransition();

  const [search, setSearch] = useState("");
  const [domaine, setDomaine] = useState("");
  const [statut, setStatut] = useState("");
  const [cohorte, setCohorte] = useState("");
  const [page, setPage] = useState(1);

  const [projets, setProjets] = useState<ProjetIncube[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
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
    <>
      <PageHero image="/images/auth-incubateur.jpg" title="Projets incubés" subtitle="Les projets accompagnés par le CIAT à Diamniadio." />
    <div className="mx-auto w-full max-w-7xl px-4 py-16 sm:px-6 md:py-24 lg:px-8">

      {isDemo && <DemoBanner />}

      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
        <div>
          <label htmlFor="search-input" className="sr-only">
            Rechercher
          </label>
          <input
            id="search-input"
            type="search"
            placeholder="Rechercher un projet"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className={FIELD}
          />
        </div>
        <div>
          <label htmlFor="domaine-select" className="sr-only">
            Domaine
          </label>
          <select
            id="domaine-select"
            value={domaine}
            onChange={(e) => {
              setDomaine(e.target.value);
              setPage(1);
            }}
            className={FIELD}
          >
            {DOMAINES_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="statut-select" className="sr-only">
            Stade d&apos;avancement
          </label>
          <select
            id="statut-select"
            value={statut}
            onChange={(e) => {
              setStatut(e.target.value);
              setPage(1);
            }}
            className={FIELD}
          >
            {STATUTS_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="cohorte-select" className="sr-only">
            Cohorte
          </label>
          <select
            id="cohorte-select"
            value={cohorte}
            onChange={(e) => {
              setCohorte(e.target.value);
              setPage(1);
            }}
            className={FIELD}
          >
            {COHORTES_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="mb-10 mt-4 flex items-center gap-4 text-sm text-texte-doux">
        <span>
          {total} {total > 1 ? "projets" : "projet"}
        </span>
        {hasActiveFilters && (
          <button type="button" onClick={handleResetFilters} className="font-medium text-brun hover:underline">
            Effacer les filtres
          </button>
        )}
      </div>

      {error && <ApiErrorBanner message={error} onRetry={() => fetchProjets()} className="mb-8" />}

      {loading ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((idx) => (
            <div key={idx} className="h-48 animate-pulse rounded-2xl bg-ivoire" />
          ))}
        </div>
      ) : error && projets.length === 0 ? null : projets.length === 0 ? (
        <div className="py-16 text-center">
          <p className="font-semibold text-brun">Aucun projet ne correspond à votre recherche.</p>
          <Button variant="secondary" onClick={handleResetFilters} className="mt-6">
            Effacer les filtres
          </Button>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {projets.map((projet) => (
            <Link
              key={projet.id}
              href={`/portail/projets/${projet.id}`}
              className="group flex flex-col rounded-2xl border border-bordure p-6 transition-colors hover:border-beige"
            >
              <span className="text-sm text-texte-doux">{projet.domaine.nom}</span>
              <h2 className="mt-2 text-[15px] font-semibold leading-snug group-hover:underline">{projet.titre}</h2>
              <p className="mt-3 line-clamp-2 text-[13px] leading-relaxed text-texte-doux">{projet.resume}</p>
              <span className="mt-auto pt-5 text-xs font-medium text-beige">
                {STATUT_LABELS[projet.statut] ?? projet.statut}
              </span>
            </Link>
          ))}
        </div>
      )}

      {!loading && totalPages > 1 && (
        <div className="mt-14 flex items-center justify-center gap-4 text-sm">
          <Button
            variant="secondary"
            disabled={page <= 1}
            onClick={() => setPage((prev) => Math.max(1, prev - 1))}
          >
            Précédent
          </Button>
          <span className="text-texte-doux">
            {page} / {totalPages}
          </span>
          <Button
            variant="secondary"
            disabled={page >= totalPages}
            onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
          >
            Suivant
          </Button>
        </div>
      )}
    </div>
    </>
  );
}
