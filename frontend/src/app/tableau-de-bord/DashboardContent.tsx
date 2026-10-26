"use client";

import { useMemo, useState, useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  Lightbulb,
  FileCheck2,
  Award,
  Rocket,
  Cpu,
  TrendingUp,
} from "lucide-react";
import type { DashboardFilters } from "./types";
import { getMockAnalyticsData } from "./mockData";
import { KpiCard } from "./components/KpiCard";
import { FiltersBar } from "./components/FiltersBar";
import { DashboardBanner } from "./components/DashboardBanner";
import {
  ChartCard,
  CohorteChart,
  DomaineChart,
  EvolutionChart,
  GenreChart,
} from "./components/ChartCard";
import {
  ChartSkeleton,
  EmptyState,
  ErrorState,
  KpiSkeletonGrid,
} from "./components/PageState";

export function DashboardContent() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Synchronisation des filtres avec l'URL searchParams
  const filters: DashboardFilters = useMemo(() => {
    return {
      debut: searchParams.get("debut") || undefined,
      fin: searchParams.get("fin") || undefined,
      cohorte: searchParams.get("cohorte") || undefined,
      domaine: searchParams.get("domaine") || undefined,
      statut: searchParams.get("statut") || undefined,
    };
  }, [searchParams]);

  const isFiltered = useMemo(() => {
    return Boolean(
      filters.debut ||
        filters.fin ||
        filters.cohorte ||
        filters.domaine ||
        filters.statut
    );
  }, [filters]);

  const updateFilters = (newFilters: DashboardFilters) => {
    const params = new URLSearchParams();
    if (newFilters.debut) params.set("debut", newFilters.debut);
    if (newFilters.fin) params.set("fin", newFilters.fin);
    if (newFilters.cohorte) params.set("cohorte", newFilters.cohorte);
    if (newFilters.domaine) params.set("domaine", newFilters.domaine);
    if (newFilters.statut) params.set("statut", newFilters.statut);

    startTransition(() => {
      router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    });
  };

  const handleResetFilters = () => {
    startTransition(() => {
      router.replace(pathname, { scroll: false });
    });
  };

  const handleRefresh = () => {
    setIsLoading(true);
    setError(null);
    setTimeout(() => {
      setIsLoading(false);
    }, 450);
  };

  // Données mock filtrées selon les critères actifs
  const data = useMemo(() => {
    return getMockAnalyticsData(filters);
  }, [filters]);

  const hasNoData = data.indicateurs.idees_recues === 0;

  return (
    <div className="min-h-full bg-[#fcfbf9]/90 px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-4 sm:space-y-5">
        {/* =========================================================================
            1. BANNIÈRE INSTITUTIONNELLE CIAT (Mockup Officiel)
           ========================================================================= */}
        <div className="animate-fade-in-up">
          <DashboardBanner />
        </div>

        {/* =========================================================================
            2. BARRE DE FILTRES DÉCISIONNELS & CONTRÔLE
           ========================================================================= */}
        <div className="animate-fade-in-up" style={{ animationDelay: "80ms" }}>
          <FiltersBar
            filters={filters}
            onChange={updateFilters}
            onReset={handleResetFilters}
            isFiltered={isFiltered}
            onRefresh={handleRefresh}
            isLoading={isLoading}
            onExport={() => {
              alert("Export du rapport de synthèse (T3) en cours...");
            }}
          />
        </div>

        {/* =========================================================================
            3. ÉTATS : ERREUR / CHARGEMENT / VIDE / CONTENU
           ========================================================================= */}
        {error ? (
          <ErrorState message={error} onRetry={handleRefresh} />
        ) : isLoading ? (
          <div className="space-y-4 sm:space-y-5">
            <KpiSkeletonGrid />
            <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
              <ChartSkeleton />
              <ChartSkeleton />
            </div>
          </div>
        ) : hasNoData ? (
          <EmptyState onReset={handleResetFilters} />
        ) : (
          <div className="space-y-4 sm:space-y-5">
            {/* =========================================================================
                4. LES 6 CARTES KPI COMPACTES & GAIN DE PLACE (6 COLONNES DESKTOP)
               ========================================================================= */}
            <section
              aria-labelledby="kpis-title"
              className="animate-fade-in-up"
              style={{ animationDelay: "140ms" }}
            >
              <h2 id="kpis-title" className="sr-only">
                Indicateurs clés de performance
              </h2>
              <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 xl:grid-cols-6 sm:gap-3">
                <KpiCard
                  label="Idées reçues"
                  value={data.indicateurs.idees_recues}
                  subtext="Total des soumissions initiales"
                  icon={<Lightbulb className="h-4 w-4" strokeWidth={1.75} />}
                  trend="+18% ce mois"
                />
                <KpiCard
                  label="Dossiers déposés"
                  value={data.indicateurs.dossiers_deposes}
                  subtext="Candidatures avec pièces obligatoires"
                  icon={<FileCheck2 className="h-4 w-4" strokeWidth={1.75} />}
                  trend="Complets à 85%"
                />
                <KpiCard
                  label="Projets sélectionnés"
                  value={data.indicateurs.projets_selectionnes}
                  subtext="Avis favorable du comité d'évaluation"
                  icon={<Award className="h-4 w-4" strokeWidth={1.75} />}
                  trend="Jury session 1"
                />
                <KpiCard
                  label="Projets incubés"
                  value={data.indicateurs.projets_incubes}
                  subtext="Parcours d'incubation actif au CIAT"
                  icon={<Rocket className="h-4 w-4" strokeWidth={1.75} />}
                  trend="En cours"
                />
                <KpiCard
                  label="Prototypes validés"
                  value={data.indicateurs.prototypes}
                  subtext="Maturation technique certifiée (Fablab)"
                  icon={<Cpu className="h-4 w-4" strokeWidth={1.75} />}
                  trend="Certifiés TRL-5"
                />
                <KpiCard
                  label="Taux de sélection"
                  value={data.indicateurs.taux_selection}
                  suffix="%"
                  subtext="Rapport sélectionnés / dossiers déposés"
                  icon={<TrendingUp className="h-4 w-4" strokeWidth={1.75} />}
                  badge={
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse-subtle" />
                      Cohorte active
                    </span>
                  }
                />
              </div>
            </section>

            {/* =========================================================================
                5. LES 4 GRAPHIQUES RECHARTS (ÉLÉGANTS, ARRONDIS, CHARTE CIAT)
               ========================================================================= */}
            <section
              aria-labelledby="charts-title"
              className="space-y-6 animate-fade-in-up"
              style={{ animationDelay: "200ms" }}
            >
              <h2 id="charts-title" className="sr-only">
                Visualisations graphiques
              </h2>

              {/* Ligne 1 : Évolution et Répartition par domaine */}
              <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                <ChartCard
                  title="Évolution mensuelle des projets"
                  description="Progression cumulée des innovations portées au CIAT"
                  badge="Série temporelle"
                >
                  <EvolutionChart data={data.evolution} />
                </ChartCard>

                <ChartCard
                  title="Projets par domaine prioritaire"
                  description="Répartition des innovations selon les 6 filières d'excellence"
                  badge="Filières ISEP"
                >
                  <DomaineChart data={data.parDomaine} />
                </ChartCard>
              </div>

              {/* Ligne 2 : Comparaison cohortes et Répartition genre */}
              <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                <ChartCard
                  title="Comparaison entre cohortes"
                  description="Idées soumises, dossiers retenus et prototypes finalisés"
                  badge="2024 — 2026"
                >
                  <CohorteChart data={data.parCohorte} />
                </ChartCard>

                <ChartCard
                  title="Répartition par genre des porteurs"
                  description="Mixité des équipes et représentativité des porteurs de projet"
                  badge="Parité & Impact"
                >
                  <GenreChart data={data.parGenre} />
                </ChartCard>
              </div>
            </section>
          </div>
        )}
      </div>
    </div>
  );
}
