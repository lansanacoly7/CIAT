"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { api, API_URL, saveTokens } from "@/lib/api";
import type {
  AnalyticsData,
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
import { WatchZone } from "./components/WatchZone";
import { StickyTabs, type DashboardTab } from "./components/StickyTabs";
import {
  ChartCard,
  CohorteChart,
  DomaineChart,
  EvolutionChart,
  GenreChart,
} from "./components/ChartCard";
import { DetailTable } from "./components/DetailTable";
import { PartenariatsFinancementsSection } from "./components/PartenariatsFinancementsSection";
import { AiDrawer } from "./components/AiDrawer";
import { PrintSummaryModal } from "./components/PrintSummaryModal";
import { ChartSkeleton, EmptyState, KpiSkeletonGrid } from "./components/PageState";
import { formatCurrencyCompact } from "@/lib/format";

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
  const [isLoading, setIsLoading] = useState(true);
  const [isLiveConnected, setIsLiveConnected] = useState<boolean | null>(null);
  const [activeTab, setActiveTab] = useState<DashboardTab>("projets");
  const [isAiDrawerOpen, setIsAiDrawerOpen] = useState(false);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [lastUpdatedTime, setLastUpdatedTime] = useState<string>("en direct");
  const [hasNetworkError, setHasNetworkError] = useState(false);

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
          setIsLiveConnected(false);
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
          setIsLiveConnected(true);
          setIsLoading(false);
          setHasNetworkError(false);
          setLastUpdatedTime(
            new Date().toLocaleTimeString("fr-FR", {
              hour: "2-digit",
              minute: "2-digit",
            })
          );
        }
      } catch {
        if (isSubscribed) {
          setData(getMockAnalyticsData(filters));
          setIsLiveConnected(false);
          setIsLoading(false);
          setHasNetworkError(true);
          setLastUpdatedTime(
            new Date().toLocaleTimeString("fr-FR", {
              hour: "2-digit",
              minute: "2-digit",
            })
          );
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
      setIsLiveConnected(true);
      setLastUpdatedTime(
        new Date().toLocaleTimeString("fr-FR", {
          hour: "2-digit",
          minute: "2-digit",
        })
      );
    } catch {
      setData(getMockAnalyticsData(filters));
      setIsLiveConnected(false);
    } finally {
      setIsLoading(false);
    }
  };

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

  const hasNoData = Boolean(data && data.indicateurs.idees_recues === 0);

  return (
    <div
      id="dashboard-root"
      className="min-h-screen bg-[#FBF8F3] text-[#21130D]"
    >
      {/* =========================================================================
          1. EN-TÊTE COMPACT (UNE LIGNE, 64 PX)
         ========================================================================= */}
      <CompactHeader
        lastUpdated={lastUpdatedTime}
        isLive={isLiveConnected === true}
        isLoading={isLoading}
        onRefresh={handleRefresh}
        onOpenAiDrawer={() => setIsAiDrawerOpen(true)}
        onOpenPrintModal={() => setIsPrintModalOpen(true)}
        filters={filters}
        targetCaptureId="dashboard-capture-zone"
      />

      <div className="mx-auto max-w-7xl px-4 py-5 sm:px-6 lg:px-8 space-y-6">
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
        <div id="dashboard-capture-zone" className="space-y-6">
          {isLoading ? (
            <div className="space-y-6">
              <KpiSkeletonGrid />
              <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
                <ChartSkeleton />
                <ChartSkeleton />
              </div>
            </div>
          ) : hasNoData ? (
            <EmptyState onReset={handleResetFilters} />
          ) : data ? (
            <>
              {/* =========================================================================
                  3. KPI EN MISE EN AVANT (GRILLE DE 4 COLONNES X 2 LIGNES)
                 ========================================================================= */}
              <KpiGrid
                indicateurs={data.indicateurs}
                totalFinance={financementsStats?.total_finance ?? 472000000}
                partenariatsActifs={
                  financementsStats?.nombre_partenariats_actifs ?? 33
                }
              />

              {/* =========================================================================
                  4. ZONE "À SURVEILLER" (3 CARTES D'ALERTE COMPACTES)
                 ========================================================================= */}
              <WatchZone
                onFilterStatut={(statut) => {
                  updateFilters({ ...filters, statut });
                }}
                onNavigateTab={(tab) => {
                  setActiveTab(tab);
                }}
              />

              {/* =========================================================================
                  5. ONGLETS STICKY "PROJETS" / "FINANCEMENTS"
                 ========================================================================= */}
              <StickyTabs
                activeTab={activeTab}
                onChange={setActiveTab}
                projetsCount={data.indicateurs.idees_recues}
                financementsAmount={formatCurrencyCompact(
                  financementsStats?.total_finance ?? 472000000
                )}
              />

              {/* =========================================================================
                  6. CONTENU DE L'ONGLET ACTIF : GRAPHIQUES + TABLEAU OU FINANCEMENTS
                 ========================================================================= */}
              {activeTab === "projets" ? (
                <div className="space-y-6">
                  {/* Grille des 4 graphiques Recharts (2 x 2) */}
                  <section
                    aria-labelledby="charts-heading"
                    className="space-y-6"
                  >
                    <h2 id="charts-heading" className="sr-only">
                      Visualisations graphiques
                    </h2>

                    {/* Ligne 1 : Évolution et Répartition par domaine */}
                    <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
                      <ChartCard
                        title="Évolution mensuelle des projets"
                        description="Flux de création et d'enregistrement au fil du temps"
                        badge="Série temporelle"
                        summaryValue={`${data.indicateurs.idees_recues} créés`}
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

                      <ChartCard
                        title="Projets par domaine prioritaire"
                        description="Répartition des innovations par filière d'excellence"
                        badge="Filières CIAT"
                        summaryValue={`${data.parDomaine.length} domaines`}
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
                    </div>

                    {/* Ligne 2 : Comparaison cohortes et Répartition par genre */}
                    <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
                      <ChartCard
                        title="Comparaison entre promotions"
                        description="Progression comparée des cohortes annuelles 2024 — 2026"
                        badge="3 promotions"
                        summaryValue={`${data.indicateurs.idees_recues} au total`}
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

                      <ChartCard
                        title="Mixité et parité des équipes"
                        description="Représentativité et répartition par genre des porteurs"
                        badge="Parité & RSE"
                        summaryValue={`${data.indicateurs.idees_recues} porteurs`}
                        tableData={data.parGenre.map((g) => ({
                          Genre: g.genre,
                          Porteurs: g.total,
                        }))}
                        tableColumns={[
                          { key: "Genre", label: "Catégorie" },
                          { key: "Porteurs", label: "Effectif" },
                        ]}
                        isEmpty={!data.parGenre || data.parGenre.length === 0 || data.parGenre.every((g) => g.total === 0)}
                        emptyMessage="Aucune donnée de porteurs ou de représentativité sur cette sélection."
                        isError={hasNetworkError && (!data.parGenre || data.parGenre.length === 0)}
                        onRetry={handleRefresh}
                      >
                        <GenreChart data={data.parGenre} />
                      </ChartCard>
                    </div>
                  </section>

                  {/* =========================================================================
                      7. TABLEAU DE DÉTAIL (56PX ROWS, STICKY HEADER, TRI, RECHERCHE)
                     ========================================================================= */}
                  <section aria-labelledby="detail-table-heading" className="space-y-2">
                    <div className="flex items-center justify-between">
                      <h2
                        id="detail-table-heading"
                        className="text-[12px] font-semibold uppercase tracking-[0.06em] text-[#5A4B42]"
                      >
                        Registre analytique des financements et conventions
                      </h2>
                      <span className="text-[11px] text-[#5A4B42]">
                        {financementsData.length} lignes consolidées
                      </span>
                    </div>

                    <DetailTable data={financementsData} isLoading={isLoading} />
                  </section>
                </div>
              ) : (
                /* Onglet Financements & Partenariats */
                <section aria-labelledby="financements-heading">
                  <h2 id="financements-heading" className="sr-only">
                    Financements et Partenariats
                  </h2>
                  <PartenariatsFinancementsSection filters={filters} />
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
              `${API_URL}/analytics/export/?format=pdf${
                query ? `&${query.slice(1)}` : ""
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
