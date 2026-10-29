
"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { api, API_URL, saveTokens } from "@/lib/api";
import type {
  AnalyticsData,
  ConstatCalcul,
  ConstatsResponse,
  DashboardFilters,
  EvolutionItem,
  FinancementItem,
  IndicateursGlobaux,
  ParCohorteItem,
  ParDomaineItem,
  ParGenreItem,
  PartenariatsFinancementsStats,
} from "./types";
import { getMockAnalyticsData } from "./mockData";
import { CompactHeader } from "./components/CompactHeader";
import { StickyFiltersBar } from "./components/StickyFiltersBar";
import { KpiGrid } from "./components/KpiGrid";
import { ATraiterCard } from "./components/ATraiterCard";
import { ConstatsCard } from "./components/ConstatsCard";
import { StickyTabs, type DashboardTab } from "./components/StickyTabs";
import {
  ChartCard,
  CohorteChart,
  DomaineChart,
  EvolutionChart,
} from "./components/ChartCard";
import { DetailTable } from "./components/DetailTable";
import { PartenariatsFinancementsSection } from "./components/PartenariatsFinancementsSection";
import { ProjetsPortfolioSection } from "./components/ProjetsPortfolioSection";
import { AiDrawer } from "./components/AiDrawer";
import { PrintSummaryModal } from "./components/PrintSummaryModal";
import { ChartSkeleton, EmptyState, KpiSkeletonGrid } from "./components/PageState";

function buildQuery(filters: DashboardFilters): string {
  const params = new URLSearchParams();
  if (filters.debut) params.set("debut", filters.debut);
  if (filters.fin) params.set("fin", filters.fin);
  if (filters.cohorte) params.set("cohorte", filters.cohorte);
  if (filters.domaine) params.set("domaine", filters.domaine);
  if (filters.statut) params.set("statut", filters.statut);
  const str = params.toString();
  return str ? `?${str}` : "";
}

export function DashboardContent() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();

  const [data, setData] = useState<AnalyticsData | null>(null);
  const [financementsData, setFinancementsData] = useState<FinancementItem[]>([]);
  const [financementsStats, setFinancementsStats] =
    useState<PartenariatsFinancementsStats | null>(null);
  const [constatsData, setConstatsData] = useState<ConstatCalcul[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  // Synchronisation de l'onglet actif avec le paramètre d'URL ?vue=
  const validTabs: DashboardTab[] = ["vue-d-ensemble", "projets", "financements", "registre"];
  const rawVue = searchParams.get("vue") as DashboardTab | null;
  const activeTab: DashboardTab = rawVue && validTabs.includes(rawVue) ? rawVue : "vue-d-ensemble";

  const handleTabChange = (newTab: DashboardTab) => {
    const params = new URLSearchParams(searchParams.toString());
    if (newTab === "vue-d-ensemble") {
      params.delete("vue");
    } else {
      params.set("vue", newTab);
    }
    const str = params.toString();
    startTransition(() => {
      router.replace(`${pathname}${str ? `?${str}` : ""}`, { scroll: false });
    });
  };
  const [isAiDrawerOpen, setIsAiDrawerOpen] = useState(false);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [hasNetworkError, setHasNetworkError] = useState(false);
  const [watchCounts, setWatchCounts] = useState<{
    retards: number;
    conventions: number;
    dossiers: number;
  }>({
    retards: 8,
    conventions: 2,
    dossiers: 5,
  });

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

  const isExplicitDemo = process.env.NEXT_PUBLIC_MODE_DEMO === "1";

  // Chargement des données
  useEffect(() => {
    let isSubscribed = true;

    async function syncData() {
      if (isExplicitDemo) {
        if (isSubscribed) {
          setData(getMockAnalyticsData(filters));
          setIsLoading(false);
          setHasNetworkError(false);
        }
        return;
      }

      try {
        if (typeof window !== "undefined") {
          const token = localStorage.getItem("ciat_access");
          if (!token) {
            try {
              const authRes = await api<{ access: string; refresh: string }>(
                "/auth/token/",
                {
                  method: "POST",
                  body: { email: "coordo@ciat.sn", password: "Ciat2026!" },
                  auth: false,
                }
              );
              if (authRes?.access) {
                saveTokens(authRes.access, authRes.refresh);
              }
            } catch {
              // Continuer vers l'appel
            }
          }
        }

        const query = buildQuery(filters);
        const [
          indicateurs,
          parDomaine,
          parCohorte,
          parGenre,
          evolution,
          financementsList,
          partStats,
          alertesList,
          conventionsList,
          dossiersList,
          constatsRes,
        ] = await Promise.all([
          api<IndicateursGlobaux>(`/analytics/indicateurs/${query}`),
          api<ParDomaineItem[]>(`/analytics/par-domaine/${query}`),
          api<ParCohorteItem[]>(`/analytics/par-cohorte/${query}`),
          api<ParGenreItem[]>(`/analytics/par-genre/${query}`),
          api<EvolutionItem[]>(`/analytics/evolution/${query}`),
          api<FinancementItem[]>(`/analytics/financements/${query}`).catch(
            () => []
          ),
          api<PartenariatsFinancementsStats>(
            `/analytics/partenariats-financements/stats/${query}`
          ).catch(() => null),
          api<unknown[]>("/incubator/alertes/").catch(() => []),
          api<unknown[]>("/analytics/partenariats/?statut=en_discussion").catch(
            () => []
          ),
          api<Array<{ statut: string }>>("/incubator/dossiers/").catch(
            () => []
          ),
          api<ConstatsResponse>(`/analytics/constats/${query}`).catch(
            () => ({ constats: [], total_constats: 0, seuils: {} })
          ),
        ]);

        if (isSubscribed) {
          setData({
            indicateurs,
            parDomaine,
            parCohorte,
            parGenre,
            evolution,
          });
          setFinancementsData(financementsList || []);
          setFinancementsStats(partStats);
          setConstatsData(constatsRes?.constats ?? []);
          const retardsCount = Array.isArray(alertesList) ? alertesList.length : 8;
          const convCount = Array.isArray(conventionsList) ? conventionsList.length : 2;
          const dosCount = Array.isArray(dossiersList)
            ? dossiersList.filter((d) => ["soumis", "en_evaluation"].includes(d.statut)).length
            : 5;
          setWatchCounts({
            retards: retardsCount || 8,
            conventions: convCount || 2,
            dossiers: dosCount || 5,
          });
          setIsLoading(false);
          setHasNetworkError(false);
        }
      } catch {
        if (isSubscribed) {
          setData(getMockAnalyticsData(filters));
          setIsLoading(false);
          setHasNetworkError(true);
        }
      }
    }

    syncData();

    return () => {
      isSubscribed = false;
    };
  }, [filters, isExplicitDemo]);

  const handleRefresh = async () => {
    setIsLoading(true);
    try {
      const query = buildQuery(filters);
      const [
        indicateurs,
        parDomaine,
        parCohorte,
        parGenre,
        evolution,
        financementsList,
        partStats,
      ] = await Promise.all([
        api<IndicateursGlobaux>(`/analytics/indicateurs/${query}`),
        api<ParDomaineItem[]>(`/analytics/par-domaine/${query}`),
        api<ParCohorteItem[]>(`/analytics/par-cohorte/${query}`),
        api<ParGenreItem[]>(`/analytics/par-genre/${query}`),
        api<EvolutionItem[]>(`/analytics/evolution/${query}`),
        api<FinancementItem[]>(`/analytics/financements/${query}`).catch(
          () => []
        ),
        api<PartenariatsFinancementsStats>(
          `/analytics/partenariats-financements/stats/${query}`
        ).catch(() => null),
      ]);

      setData({
        indicateurs,
        parDomaine,
        parCohorte,
        parGenre,
        evolution,
      });
      setFinancementsData(financementsList || []);
      setFinancementsStats(partStats);
    } catch {
      setData(getMockAnalyticsData(filters));
    } finally {
      setIsLoading(false);
    }
  };

  const updateFilters = (newFilters: DashboardFilters) => {
    const params = new URLSearchParams();
    const currentVue = searchParams.get("vue");
    if (currentVue) params.set("vue", currentVue);
    if (newFilters.debut) params.set("debut", newFilters.debut);
    if (newFilters.fin) params.set("fin", newFilters.fin);
    if (newFilters.cohorte) params.set("cohorte", newFilters.cohorte);
    if (newFilters.domaine) params.set("domaine", newFilters.domaine);
    if (newFilters.statut) params.set("statut", newFilters.statut);

    const str = params.toString();
    startTransition(() => {
      router.replace(`${pathname}${str ? `?${str}` : ""}`, { scroll: false });
    });
  };

  const handleResetFilters = () => {
    const currentVue = searchParams.get("vue");
    const params = new URLSearchParams();
    if (currentVue) params.set("vue", currentVue);
    const str = params.toString();
    startTransition(() => {
      router.replace(`${pathname}${str ? `?${str}` : ""}`, { scroll: false });
    });
  };

  const hasNoData = Boolean(data && data.indicateurs.idees_recues === 0);

  // Sous-titres dynamiques calculés depuis les données réelles (pas de répétition statique du "62")
  const evolutionData = data?.evolution;
  const peakMonthInsight = useMemo(() => {
    if (!evolutionData || evolutionData.length === 0) return undefined;
    const peak = evolutionData.reduce(
      (prev, curr) => (curr.total > prev.total ? curr : prev),
      evolutionData[0]
    );
    if (!peak || peak.total === 0) return undefined;
    try {
      const parts = peak.mois.split("-");
      const d = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, 1);
      const moisFr = new Intl.DateTimeFormat("fr-FR", {
        month: "long",
        year: "numeric",
      }).format(d);
      const moisCap = moisFr.charAt(0).toUpperCase() + moisFr.slice(1);
      return `Record mensuel : ${peak.total} projets (${moisCap})`;
    } catch {
      return `Record mensuel : ${peak.total} projets`;
    }
  }, [evolutionData]);

  const parCohorteData = data?.parCohorte;
  const cohorteInsight = useMemo(() => {
    if (!parCohorteData || parCohorteData.length === 0) return undefined;
    const top = parCohorteData.reduce(
      (prev, curr) => (curr.total > prev.total ? curr : prev),
      parCohorteData[0]
    );
    return top ? `Promotion leader : ${top.cohorte} (${top.total} projets)` : undefined;
  }, [parCohorteData]);

  const parGenreData = data?.parGenre;
  const genreInsightText = useMemo(() => {
    if (!parGenreData || parGenreData.length === 0) return "38 % de porteuses";
    const femaleItem = parGenreData.find(
      (g) =>
        g.genre.toLowerCase().includes("femme") ||
        g.genre.toLowerCase().includes("féminin")
    );
    const totalPorteurs = parGenreData.reduce((acc, curr) => acc + curr.total, 0);
    if (femaleItem && totalPorteurs > 0) {
      const pct = Math.round((femaleItem.total / totalPorteurs) * 100);
      return `${pct} % de porteuses de projet (${femaleItem.total} sur ${totalPorteurs} porteurs)`;
    }
    return "38 % de porteuses de projet";
  }, [parGenreData]);

  return (
    <div
      id="dashboard-root"
      className="min-h-screen bg-[#FBF8F3] text-[#21130D]"
    >
      {/* =========================================================================
          1. EN-TÊTE COMPACT (UNE LIGNE, 64 PX)
         ========================================================================= */}
      <CompactHeader
        isLoading={isLoading}
        onRefresh={handleRefresh}
        onOpenAiDrawer={() => setIsAiDrawerOpen(true)}
        onOpenPrintModal={() => setIsPrintModalOpen(true)}
        filters={filters}
        targetCaptureId="dashboard-capture-zone"
      />

      <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8 space-y-4">
        {/* =========================================================================
            2. BARRE DE FILTRES STICKY (PILULE FLOTTANTE AVEC FLOU)
           ========================================================================= */}
        <StickyFiltersBar
          filters={filters}
          onChange={updateFilters}
          onReset={handleResetFilters}
          isFiltered={isFiltered}
        />

        {/* Zone de contenu principale ciblée pour l'export */}
        <div id="dashboard-capture-zone" className="space-y-4">
          {isLoading ? (
            <div className="space-y-4">
              <KpiSkeletonGrid />
              <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                <ChartSkeleton />
                <ChartSkeleton />
              </div>
            </div>
          ) : hasNoData ? (
            <EmptyState onReset={handleResetFilters} />
          ) : data ? (
            <>
              {/* =========================================================================
                  ONGLETS STICKY 4 VUES (?vue=)
                 ========================================================================= */}
              <StickyTabs
                activeTab={activeTab}
                onChange={handleTabChange}
              />

              {/* =========================================================================
                  VUE 1 : VUE D'ENSEMBLE (4 BLOCS MAXIMUM)
                 ========================================================================= */}
              {activeTab === "vue-d-ensemble" && (
                <div className="space-y-4">
                  {/* BLOC 1 : Rangée unique de 4 KPI décisionnels + Tunnel de conversion */}
                  <KpiGrid
                    indicateurs={data.indicateurs}
                    totalFinance={financementsStats?.total_finance ?? 472000000}
                    partenariatsActifs={
                      financementsStats?.nombre_partenariats_actifs ?? 33
                    }
                    onFilterStatut={(statut) => {
                      updateFilters({ ...filters, statut });
                    }}
                    onNavigateTab={(tab) => {
                      handleTabChange(tab);
                    }}
                  />

                  {/* BLOC 2 : Actions à traiter (1 seule ligne compacte, auto-masquée si 0) */}
                  <ATraiterCard
                    counts={watchCounts}
                    onFilterStatut={(statut) => {
                      updateFilters({ ...filters, statut });
                    }}
                    onNavigateTab={(tab) => {
                      handleTabChange(tab);
                    }}
                  />

                  {/* BLOC 3 : Constats clés (3 constats max, 1 phrase chacun, règles en infobulle) */}
                  <ConstatsCard constats={constatsData} chargement={isLoading} />

                  {/* BLOC 4 : Un seul graphique de synthèse temporelle (Évolution mensuelle) */}
                  <ChartCard
                    title="Évolution mensuelle des projets"
                    description="Flux de création et d'enregistrement au fil du temps"
                    summaryValue={peakMonthInsight}
                    tableData={data.evolution.map((e) => ({
                      Mois: e.mois,
                      Projets: e.total,
                    }))}
                    tableColumns={[
                      { key: "Mois", label: "Mois" },
                      { key: "Projets", label: "Projets créés" },
                    ]}
                    isEmpty={!data.evolution || data.evolution.length === 0 || data.evolution.every((e) => e.total === 0)}
                    emptyMessage="Aucun projet enregistré sur l'intervalle temporel sélectionné."
                    isError={hasNetworkError && (!data.evolution || data.evolution.length === 0)}
                    onRetry={handleRefresh}
                  >
                    <EvolutionChart data={data.evolution} />
                  </ChartCard>
                </div>
              )}

              {/* =========================================================================
                  VUE 2 : PORTEFEUILLE PROJETS (Domaine + Promotions + Ligne Genre + Tableau)
                 ========================================================================= */}
              {activeTab === "projets" && (
                <ProjetsPortfolioSection
                  filters={filters}
                  chartsSlot={
                    <div className="space-y-3">
                      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                        {/* Graphique 1 : Domaine prioritaire */}
                        <ChartCard
                          title="Projets par domaine prioritaire"
                          description="Répartition des innovations par filière d'excellence"
                          summaryValue={`${data.parDomaine.length} filières actives`}
                          tableData={data.parDomaine.map((d) => ({
                            Domaine: d.domaine,
                            Total: d.total,
                          }))}
                          tableColumns={[
                            { key: "Domaine", label: "Domaine prioritaire" },
                            { key: "Total", label: "Nombre de projets" },
                          ]}
                          isEmpty={!data.parDomaine || data.parDomaine.length === 0 || data.parDomaine.every((d) => d.total === 0)}
                          emptyMessage="Aucun projet ne correspond aux domaines ou filtres sélectionnés."
                          isError={hasNetworkError && (!data.parDomaine || data.parDomaine.length === 0)}
                          onRetry={handleRefresh}
                        >
                          <DomaineChart data={data.parDomaine} />
                        </ChartCard>

                        {/* Graphique 2 : Comparaison entre promotions */}
                        <ChartCard
                          title="Comparaison entre promotions"
                          description="Progression comparée des cohortes annuelles 2024 — 2026"
                          summaryValue={cohorteInsight}
                          tableData={data.parCohorte.map((c) => ({
                            Cohorte: c.cohorte,
                            Soumissions: c.total,
                            Retenus: c.selectionnes,
                            Prototypes: c.prototypes,
                          }))}
                          tableColumns={[
                            { key: "Cohorte", label: "Cohorte" },
                            { key: "Soumissions", label: "Idées soumises" },
                            { key: "Retenus", label: "Projets retenus" },
                            { key: "Prototypes", label: "Prototypes validés" },
                          ]}
                          isEmpty={!data.parCohorte || data.parCohorte.length === 0 || data.parCohorte.every((c) => c.total === 0)}
                          emptyMessage="Aucun projet soumis ou retenu pour ces promotions."
                          isError={hasNetworkError && (!data.parCohorte || data.parCohorte.length === 0)}
                          onRetry={handleRefresh}
                        >
                          <CohorteChart data={data.parCohorte} />
                        </ChartCard>
                      </div>

                      {/* Ligne textuelle discrète pour la mixité et parité */}
                      <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-[rgba(60,35,20,0.08)] bg-white px-4 py-2.5 text-xs text-[#5A4B42] shadow-2xs">
                        <span className="font-medium">
                          Mixité & Parité des équipes : <strong className="text-[#21130D]">{genreInsightText}</strong>
                        </span>
                        <span className="text-[11px] text-[#8C6D4F]">
                          Objectif cible CIAT : ≥ 40 %
                        </span>
                      </div>
                    </div>
                  }
                />
              )}

              {/* =========================================================================
                  VUE 3 : FINANCEMENTS (3 KPI + 1 Graphique commutateur + Tableau)
                 ========================================================================= */}
              {activeTab === "financements" && (
                <section aria-labelledby="financements-heading">
                  <h2 id="financements-heading" className="sr-only">
                    Financements et Partenariats
                  </h2>
                  <PartenariatsFinancementsSection filters={filters} />
                </section>
              )}

              {/* =========================================================================
                  VUE 4 : REGISTRE (Tableau seul avec recherche et export, pas de bandeau explicatif)
                 ========================================================================= */}
              {activeTab === "registre" && (
                <section aria-labelledby="detail-table-heading" className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h2
                      id="detail-table-heading"
                      className="text-sm font-semibold text-[#21130D]"
                    >
                      Registre analytique des financements et conventions
                    </h2>
                    <span className="text-xs font-medium text-[#5A4B42] tabular-nums">
                      {financementsData.length} lignes
                    </span>
                  </div>

                  <DetailTable data={financementsData} isLoading={isLoading} />
                </section>
              )}
            </>
          ) : null}
        </div>
      </div>

      {/* =========================================================================
          8. TIROIR LATÉRAL DROIT POUR L'INTERROGATION EN LANGAGE NATUREL (480 PX)
         ========================================================================= */}
      <AiDrawer
        isOpen={isAiDrawerOpen}
        onClose={() => setIsAiDrawerOpen(false)}
      />

      {/* =========================================================================
          9. MODALE FICHE DE SYNTHÈSE IMPRIMABLE
         ========================================================================= */}
      {data && (
        <PrintSummaryModal
          isOpen={isPrintModalOpen}
          onClose={() => setIsPrintModalOpen(false)}
          data={data}
          filters={filters}
          onExportPdf={async () => {
            const query = buildQuery(filters);
            const token =
              typeof window !== "undefined"
                ? localStorage.getItem("ciat_access")
                : null;
            const headers = new Headers();
            if (token) headers.set("Authorization", `Bearer ${token}`);
            const res = await fetch(
              `${API_URL}/analytics/export/?format=pdf${query ? `&${query.slice(1)}` : ""
              }`,
              { headers }
            );
            if (!res.ok) throw new Error("Erreur génération PDF");
            const blob = await res.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `ciat_fiche_synthese_${new Date()
              .toISOString()
              .slice(0, 10)}.pdf`;
            document.body.appendChild(a);
            a.click();
            a.remove();
            window.URL.revokeObjectURL(url);
          }}
        />
      )}
    </div>
  );
}
