"use client";

import { useEffect, useState } from "react";
import {
  Coins,
  Building2,
  TrendingUp,
  Handshake,
  Loader2,
  ShieldCheck,
  Award,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import { api } from "@/lib/api";
import type {
  DashboardFilters,
  FinancementItem,
  PartenariatItem,
  PartenariatsFinancementsStats,
} from "../types";

interface Props {
  filters: DashboardFilters;
}

const PIE_COLORS = ["#612D10", "#B85D19", "#E07A28", "#8D4219", "#3D1C08", "#C49A78"];

function formatFCFA(value: number): string {
  return new Intl.NumberFormat("fr-FR").format(value) + " FCFA";
}

function formatMillions(value: number): string {
  const millions = value / 1_000_000;
  return millions.toFixed(1) + " M FCFA";
}

export function PartenariatsFinancementsSection({ filters }: Props) {
  const [stats, setStats] = useState<PartenariatsFinancementsStats | null>(null);
  const [financements, setFinancements] = useState<FinancementItem[]>([]);
  const [partenariats, setPartenariats] = useState<PartenariatItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"financements" | "partenariats">("financements");

  useEffect(() => {
    let isSubscribed = true;

    async function loadData() {
      setIsLoading(true);
      const params = new URLSearchParams();
      if (filters.debut) params.set("debut", filters.debut);
      if (filters.fin) params.set("fin", filters.fin);
      if (filters.cohorte) params.set("cohorte", filters.cohorte);
      if (filters.domaine) params.set("domaine", filters.domaine);
      if (filters.statut) params.set("statut", filters.statut);
      const query = params.toString() ? `?${params.toString()}` : "";

      try {
        const [statsRes, finRes, partRes] = await Promise.all([
          api<PartenariatsFinancementsStats>(`/analytics/partenariats-financements/stats/${query}`),
          api<FinancementItem[]>(`/analytics/financements/${query}`),
          api<PartenariatItem[]>(`/analytics/partenariats/${query}`),
        ]);

        if (isSubscribed) {
          setStats(statsRes);
          setFinancements(finRes);
          setPartenariats(partRes);
        }
      } catch (err) {
        console.error("Erreur chargement financements et partenariats :", err);
      } finally {
        if (isSubscribed) {
          setIsLoading(false);
        }
      }
    }

    loadData();
    return () => {
      isSubscribed = false;
    };
  }, [filters]);

  if (isLoading) {
    return (
      <div className="flex h-56 items-center justify-center rounded-2xl border border-[#D8C8B8]/60 bg-white p-6 shadow-sm">
        <div className="flex flex-col items-center gap-2 text-[#612D10]">
          <Loader2 className="h-6 w-6 animate-spin" />
          <p className="text-xs font-medium">Chargement des partenariats et financements...</p>
        </div>
      </div>
    );
  }

  if (!stats) return null;

  const chartDataSources = stats.par_source.slice(0, 6).map((s) => ({
    source: s.source.length > 22 ? s.source.slice(0, 22) + "..." : s.source,
    fullName: s.source,
    montantM: Math.round(s.total / 1_000_000),
    total: s.total,
  }));

  const chartDataTypes = stats.par_type_partenariat.map((t) => ({
    name: t.type,
    value: t.count,
  }));

  const tauxDecaissement =
    stats.total_finance > 0
      ? Math.round((stats.financements_decaisses / stats.total_finance) * 100)
      : 0;

  return (
    <div className="space-y-6">
      {/* =========================================================================
          1. EN-TÊTE DE SECTION
         ========================================================================= */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-[#D8C8B8]/60 pb-3">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-[#24140D]">
              Partenariats & Financements Mobilisés
            </h2>
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100/80 px-2.5 py-0.5 text-xs font-semibold text-emerald-800">
              <ShieldCheck className="h-3.5 w-3.5" />
              Recoupé Base CIAT
            </span>
          </div>
          <p className="text-xs text-[#666666]">
            Suivi des accords industriels, académiques et guichets de financement d&apos;amorçage
          </p>
        </div>
      </div>

      {/* =========================================================================
          2. LES 4 CARTES KPI SYNTHÈSE
         ========================================================================= */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {/* KPI 1 : Total financé */}
        <div className="rounded-2xl border border-[#D8C8B8]/80 bg-white p-4 shadow-sm transition hover:shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-[#777777]">Total Financements</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-50 text-[#612D10]">
              <Coins className="h-4 w-4" />
            </div>
          </div>
          <p className="mt-2 text-xl sm:text-2xl font-extrabold tracking-tight text-[#612D10]">
            {formatMillions(stats.total_finance)}
          </p>
          <div className="mt-1 flex items-center justify-between text-[11px] text-[#666666]">
            <span>{stats.nombre_financements} opérations d&apos;octroi</span>
            <span className="font-semibold text-[#24140D]">{formatFCFA(stats.total_finance)}</span>
          </div>
        </div>

        {/* KPI 2 : Financements décaissés */}
        <div className="rounded-2xl border border-[#D8C8B8]/80 bg-white p-4 shadow-sm transition hover:shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-[#777777]">Fonds Décaissés</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700">
              <TrendingUp className="h-4 w-4" />
            </div>
          </div>
          <p className="mt-2 text-xl sm:text-2xl font-extrabold tracking-tight text-emerald-700">
            {formatMillions(stats.financements_decaisses)}
          </p>
          <div className="mt-1 flex items-center justify-between text-[11px]">
            <span className="text-[#666666]">Taux de décaissement</span>
            <span className="font-bold text-emerald-700">{tauxDecaissement} % décaissés</span>
          </div>
        </div>

        {/* KPI 3 : Partenariats actifs */}
        <div className="rounded-2xl border border-[#D8C8B8]/80 bg-white p-4 shadow-sm transition hover:shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-[#777777]">Partenariats Actifs</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-orange-50 text-[#B85D19]">
              <Handshake className="h-4 w-4" />
            </div>
          </div>
          <p className="mt-2 text-xl sm:text-2xl font-extrabold tracking-tight text-[#24140D]">
            {stats.nombre_partenariats_actifs}
          </p>
          <div className="mt-1 flex items-center justify-between text-[11px] text-[#666666]">
            <span>Total conventionnés</span>
            <span className="font-semibold text-[#24140D]">{stats.total_partenariats} accords</span>
          </div>
        </div>

        {/* KPI 4 : Réseau de partenaires */}
        <div className="rounded-2xl border border-[#D8C8B8]/80 bg-white p-4 shadow-sm transition hover:shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-[#777777]">Guichets & Partenaires</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-blue-700">
              <Building2 className="h-4 w-4" />
            </div>
          </div>
          <p className="mt-2 text-xl sm:text-2xl font-extrabold tracking-tight text-[#24140D]">
            {stats.par_source.length}
          </p>
          <div className="mt-1 flex items-center justify-between text-[11px] text-[#666666]">
            <span>Sources de financement</span>
            <span className="font-semibold text-[#24140D]">{stats.par_type_partenariat.length} typologies</span>
          </div>
        </div>
      </div>

      {/* =========================================================================
          3. DEUX GRAPHIQUES RECHARTS (FINANCEMENTS PAR SOURCE & PARTENARIATS PAR TYPE)
         ========================================================================= */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Graphique 1 : Financements par source */}
        <div className="rounded-2xl border border-[#D8C8B8]/80 bg-white p-5 shadow-sm">
          <div className="mb-4">
            <h3 className="text-sm font-bold text-[#24140D]">
              Volume mobilisé par guichet partenaire
            </h3>
            <p className="text-xs text-[#666666]">Montant exprimé en Millions FCFA</p>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={chartDataSources}
                layout="vertical"
                margin={{ top: 5, right: 20, left: 20, bottom: 5 }}
              >
                <XAxis type="number" unit=" M" tick={{ fontSize: 11 }} />
                <YAxis
                  dataKey="source"
                  type="category"
                  width={110}
                  tick={{ fontSize: 10, fill: "#444444" }}
                />
                <Tooltip
                  formatter={(val: number) => [`${val} Millions FCFA`, "Montant"]}
                  labelFormatter={(idx: number) => chartDataSources[idx]?.fullName || idx}
                  contentStyle={{
                    backgroundColor: "#FFFFFF",
                    borderColor: "#D8C8B8",
                    borderRadius: "8px",
                    fontSize: "12px",
                  }}
                />
                <Bar dataKey="montantM" fill="#612D10" radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Graphique 2 : Typologie des partenariats */}
        <div className="rounded-2xl border border-[#D8C8B8]/80 bg-white p-5 shadow-sm">
          <div className="mb-4">
            <h3 className="text-sm font-bold text-[#24140D]">
              Répartition des partenariats par nature
            </h3>
            <p className="text-xs text-[#666666]">Ventilation des accords actifs et signés</p>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartDataTypes}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={75}
                  innerRadius={45}
                  paddingAngle={3}
                >
                  {chartDataTypes.map((_, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={PIE_COLORS[index % PIE_COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(val: number) => [`${val} accord(s)`, "Nombre"]}
                  contentStyle={{
                    backgroundColor: "#FFFFFF",
                    borderColor: "#D8C8B8",
                    borderRadius: "8px",
                    fontSize: "12px",
                  }}
                />
                <Legend
                  verticalAlign="bottom"
                  height={36}
                  iconSize={8}
                  formatter={(value) => (
                    <span className="text-[11px] text-[#444444]">{value}</span>
                  )}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* =========================================================================
          4. TABLEAU DÉTAILLÉ AVEC ONGLETS (FINANCEMENTS & PARTENARIATS)
         ========================================================================= */}
      <div className="rounded-2xl border border-[#D8C8B8]/80 bg-white p-4 sm:p-5 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-[#EADFD3] pb-3">
          <div className="flex items-center gap-2">
            <Award className="h-5 w-5 text-[#612D10]" />
            <h3 className="text-sm font-bold text-[#24140D]">
              Détail des conventions et financements rattachés
            </h3>
          </div>

          <div className="inline-flex rounded-xl bg-[#FAF6F0] p-1 border border-[#D8C8B8]/60 text-xs font-semibold">
            <button
              type="button"
              onClick={() => setActiveTab("financements")}
              className={`rounded-lg px-3 py-1.5 transition-all ${
                activeTab === "financements"
                  ? "bg-[#612D10] text-white shadow"
                  : "text-[#666666] hover:text-[#24140D]"
              }`}
            >
              Financements ({financements.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("partenariats")}
              className={`rounded-lg px-3 py-1.5 transition-all ${
                activeTab === "partenariats"
                  ? "bg-[#612D10] text-white shadow"
                  : "text-[#666666] hover:text-[#24140D]"
              }`}
            >
              Partenariats ({partenariats.length})
            </button>
          </div>
        </div>

        {activeTab === "financements" ? (
          <div className="mt-3 overflow-x-auto">
            {financements.length === 0 ? (
              <p className="py-8 text-center text-xs text-[#888888]">
                Aucun financement enregistré dans le périmètre sélectionné.
              </p>
            ) : (
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-[#EADFD3] bg-[#FAF6F0] text-[11px] font-bold text-[#612D10]">
                    <th className="py-2.5 px-3">Projet</th>
                    <th className="py-2.5 px-3">Source de financement</th>
                    <th className="py-2.5 px-3">Montant (FCFA)</th>
                    <th className="py-2.5 px-3">Statut</th>
                    <th className="py-2.5 px-3">Date</th>
                    <th className="py-2.5 px-3">Cohorte</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F0E6DC]">
                  {financements.slice(0, 10).map((f) => (
                    <tr key={f.id} className="hover:bg-[#FAF6F0]/60 transition-colors">
                      <td className="py-2.5 px-3 font-semibold text-[#24140D]">
                        {f.projet_titre}
                      </td>
                      <td className="py-2.5 px-3 text-[#555555]">{f.source}</td>
                      <td className="py-2.5 px-3 font-bold text-[#612D10]">
                        {formatFCFA(Number(f.montant))}
                      </td>
                      <td className="py-2.5 px-3">
                        <span
                          className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                            f.statut === "decaisse"
                              ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                              : f.statut === "accorde"
                              ? "bg-blue-50 text-blue-800 border border-blue-200"
                              : "bg-amber-50 text-amber-800 border border-amber-200"
                          }`}
                        >
                          {f.statut_display}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-[#777777]">{f.date}</td>
                      <td className="py-2.5 px-3 text-[#777777]">
                        {f.cohorte || "Hors cohorte"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        ) : (
          <div className="mt-3 overflow-x-auto">
            {partenariats.length === 0 ? (
              <p className="py-8 text-center text-xs text-[#888888]">
                Aucun partenariat enregistré dans le périmètre sélectionné.
              </p>
            ) : (
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-[#EADFD3] bg-[#FAF6F0] text-[11px] font-bold text-[#612D10]">
                    <th className="py-2.5 px-3">Projet</th>
                    <th className="py-2.5 px-3">Partenaire</th>
                    <th className="py-2.5 px-3">Type</th>
                    <th className="py-2.5 px-3">Statut</th>
                    <th className="py-2.5 px-3">Date de début</th>
                    <th className="py-2.5 px-3">Domaine</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F0E6DC]">
                  {partenariats.slice(0, 10).map((p) => (
                    <tr key={p.id} className="hover:bg-[#FAF6F0]/60 transition-colors">
                      <td className="py-2.5 px-3 font-semibold text-[#24140D]">
                        {p.projet_titre}
                      </td>
                      <td className="py-2.5 px-3 text-[#555555]">{p.partenaire}</td>
                      <td className="py-2.5 px-3 text-[#612D10] font-medium">
                        {p.type_display}
                      </td>
                      <td className="py-2.5 px-3">
                        <span
                          className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                            p.statut === "actif"
                              ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                              : p.statut === "signe"
                              ? "bg-blue-50 text-blue-800 border border-blue-200"
                              : "bg-amber-50 text-amber-800 border border-amber-200"
                          }`}
                        >
                          {p.statut_display}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-[#777777]">{p.date_debut}</td>
                      <td className="py-2.5 px-3 text-[#777777]">
                        {p.domaine || "Non renseigné"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
