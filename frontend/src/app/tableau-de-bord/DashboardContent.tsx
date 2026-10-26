"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { api, API_URL, saveTokens } from "@/lib/api";
import type {
  AnalyticsData,
  DashboardFilters,
  EvolutionItem,
  IndicateursGlobaux,
  ParCohorteItem,
  ParDomaineItem,
  ParGenreItem,
} from "./types";
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
  KpiSkeletonGrid,
} from "./components/PageState";
import { ExportToolbar } from "./components/ExportToolbar";
import { PrintSummaryModal } from "./components/PrintSummaryModal";
import { CheckCircle2, Info, RefreshCw } from "lucide-react";

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
  const [isLoading, setIsLoading] = useState(true);
  const [isLiveConnected, setIsLiveConnected] = useState<boolean | null>(null);
  const [isReconnecting, setIsReconnecting] = useState(false);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);

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

  // Chargement asynchrone des données synchronisé avec les filtres
  useEffect(() => {
    let isSubscribed = true;

    async function syncData() {
      if (isExplicitDemo) {
        if (isSubscribed) {
          setData(getMockAnalyticsData(filters));
          setIsLiveConnected(false);
          setIsLoading(false);
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
              // Continuer vers l'appel direct
            }
          }
        }

        const query = buildQuery(filters);
        const [indicateurs, parDomaine, parCohorte, parGenre, evolution] =
          await Promise.all([
            api<IndicateursGlobaux>(`/analytics/indicateurs/${query}`),
            api<ParDomaineItem[]>(`/analytics/par-domaine/${query}`),
            api<ParCohorteItem[]>(`/analytics/par-cohorte/${query}`),
            api<ParGenreItem[]>(`/analytics/par-genre/${query}`),
            api<EvolutionItem[]>(`/analytics/evolution/${query}`),
          ]);

        if (isSubscribed) {
          setData({
            indicateurs,
            parDomaine,
            parCohorte,
            parGenre,
            evolution,
          });
          setIsLiveConnected(true);
          setIsLoading(false);
        }
      } catch {
        if (isSubscribed) {
          setData(getMockAnalyticsData(filters));
          setIsLiveConnected(false);
          setIsLoading(false);
        }
      }
    }

    syncData();

    return () => {
      isSubscribed = false;
    };
  }, [filters, isExplicitDemo]);

  const handleManualReconnect = async () => {
    setIsReconnecting(true);
    setIsLoading(true);
    try {
      const query = buildQuery(filters);
      const [indicateurs, parDomaine, parCohorte, parGenre, evolution] =
        await Promise.all([
          api<IndicateursGlobaux>(`/analytics/indicateurs/${query}`),
          api<ParDomaineItem[]>(`/analytics/par-domaine/${query}`),
          api<ParCohorteItem[]>(`/analytics/par-cohorte/${query}`),
          api<ParGenreItem[]>(`/analytics/par-genre/${query}`),
          api<EvolutionItem[]>(`/analytics/evolution/${query}`),
        ]);

      setData({
        indicateurs,
        parDomaine,
        parCohorte,
        parGenre,
        evolution,
      });
      setIsLiveConnected(true);
    } catch {
      setData(getMockAnalyticsData(filters));
      setIsLiveConnected(false);
    } finally {
      setIsLoading(false);
      setIsReconnecting(false);
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
    <div className="min-h-full bg-[#fcfbf9]/90 px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-4 sm:space-y-5">
        {/* État de connexion de la source de données (Transparent & Règle 5) */}
        {isLiveConnected === false && (
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-amber-300 bg-amber-50/90 px-4 py-2.5 text-xs text-amber-900 shadow-xs animate-fade-in-up">
            <div className="flex items-center gap-2">
              <Info className="h-4 w-4 shrink-0 text-amber-700" />
              <span>
                <strong>MODE DÉMONSTRATION ACTIF :</strong> Le serveur backend Django (port 8000) n&apos;a pas pu être joint. Affichage des données simulées.
              </span>
            </div>
            <button
              type="button"
              onClick={handleManualReconnect}
              disabled={isReconnecting}
              className="inline-flex items-center gap-1.5 rounded-lg bg-amber-200/80 px-2.5 py-1 text-[11px] font-bold text-amber-900 transition hover:bg-amber-300"
            >
              <RefreshCw
                className={`h-3 w-3 ${isReconnecting ? "animate-spin" : ""}`}
              />
              <span>{isReconnecting ? "Connexion..." : "Reconnexion API"}</span>
            </button>
          </div>
        )}

        {isLiveConnected === true && (
          <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50/70 px-3.5 py-1.5 text-[11px] font-medium text-emerald-800">
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
            <span>
              Données réelles connectées en direct depuis le serveur CIAT ({data?.indicateurs.idees_recues ?? 0} projets en base).
            </span>
          </div>
        )}

        {/* =========================================================================
            1. BANNIÈRE INSTITUTIONNELLE CIAT
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
            onRefresh={handleManualReconnect}
            isLoading={isLoading}
            onExport={() => {
              setIsPrintModalOpen(true);
            }}
          />
        </div>

        {/* =========================================================================
            2.1 BARRE D'EXPORTS (IMAGE PNG, EXCEL, PDF & FICHE IMPRIMABLE)
           ========================================================================= */}
        <div className="animate-fade-in-up" style={{ animationDelay: "110ms" }}>
          <ExportToolbar
            filters={filters}
            onOpenPrintModal={() => setIsPrintModalOpen(true)}
            targetCaptureId="dashboard-main-content"
          />
        </div>

        {/* Zone de contenu principale ciblée pour l'export image PNG */}
        <div id="dashboard-main-content">
          {isLoading ? (
            <div className="space-y-4 sm:space-y-5">
              <KpiSkeletonGrid />
              <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
                <ChartSkeleton />
                <ChartSkeleton />
              </div>
            </div>
          ) : hasNoData ? (
            <EmptyState onReset={handleResetFilters} />
          ) : data ? (
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
                  />
                  <KpiCard
                    label="Dossiers déposés"
                    value={data.indicateurs.dossiers_deposes}
                    subtext="Candidatures avec pièces obligatoires"
                  />
                  <KpiCard
                    label="Projets sélectionnés"
                    value={data.indicateurs.projets_selectionnes}
                    subtext="Avis favorable du comité"
                  />
                  <KpiCard
                    label="Projets incubés"
                    value={data.indicateurs.projets_incubes}
                    subtext="Parcours d'incubation actif"
                  />
                  <KpiCard
                    label="Prototypes validés"
                    value={data.indicateurs.prototypes}
                    subtext="Maturation technique certifiée"
                  />
                  <KpiCard
                    label="Taux de sélection"
                    value={data.indicateurs.taux_selection}
                    suffix="%"
                    subtext="Sélectionnés / dossiers"
                    badge={
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
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
                    description="Progression des projets créés au CIAT"
                    badge="Série temporelle"
                  >
                    <EvolutionChart data={data.evolution} />
                  </ChartCard>

                  <ChartCard
                    title="Projets par domaine prioritaire"
                    description="Répartition des innovations selon les filières d'excellence"
                    badge="Filières CIAT"
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
          ) : null}
        </div>

        {/* =========================================================================
            6. MODALE FICHE DE SYNTHÈSE IMPRIMABLE
           ========================================================================= */}
        {data && (
          <PrintSummaryModal
            isOpen={isPrintModalOpen}
            onClose={() => setIsPrintModalOpen(false)}
            data={data}
            filters={filters}
            onExportPdf={async () => {
              const query = buildQuery(filters);
              const token = typeof window !== "undefined" ? localStorage.getItem("ciat_access") : null;
              const headers = new Headers();
              if (token) headers.set("Authorization", `Bearer ${token}`);
              const res = await fetch(`${API_URL}/analytics/export/?format=pdf${query ? `&${query.slice(1)}` : ""}`, {
                headers,
              });
              if (!res.ok) throw new Error("Erreur génération PDF");
              const blob = await res.blob();
              const url = window.URL.createObjectURL(blob);
              const a = document.createElement("a");
              a.href = url;
              a.download = `ciat_fiche_synthese_${new Date().toISOString().slice(0, 10)}.pdf`;
              document.body.appendChild(a);
              a.click();
              a.remove();
              window.URL.revokeObjectURL(url);
            }}
          />
        )}
      </div>
    </div>
  );
}

