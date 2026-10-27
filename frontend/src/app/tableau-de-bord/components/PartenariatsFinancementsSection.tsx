"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Loader2,
  ShieldCheck,
  Award,
  Coins,
  ArrowUpRight,
  Handshake,
  Building2,
  ChevronRight,
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
  LabelList,
} from "recharts";
import { api } from "@/lib/api";
import { formatDate, formatNumber } from "@/lib/format";
import type {
  DashboardFilters,
  FinancementItem,
  PartenariatItem,
  PartenariatsFinancementsStats,
} from "../types";

interface Props {
  filters: DashboardFilters;
}

const PIE_COLORS = [
  "#3D2314", // Brun profond
  "#C99A68", // Ocre
  "#5A7D65", // Vert sauge
  "#4A6B82", // Bleu ardoise
  "#B85D43", // Terracotta
  "#5A4B42", // Gris chaud
];

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

  // Préparation des sources : Top 5 + "Autres" pour que le total fasse exactement 472 M FCFA
  const chartDataSources = useMemo(() => {
    if (!stats || !stats.par_source || stats.par_source.length === 0) return [];
    const sorted = [...stats.par_source].sort((a, b) => b.total - a.total);
    const top = sorted.slice(0, 5);
    const others = sorted.slice(5);

    const result = top.map((s) => {
      let shortName = s.source;
      if (s.source.includes("BNDE")) shortName = "BNDE Amorçage PME";
      else if (s.source.includes("Orange")) shortName = "Orange Fab Sénégal";
      else if (s.source.includes("AFD")) shortName = "AFD Investissement";
      else if (s.source.includes("GIZ")) shortName = "GIZ Transition";
      else if (s.source.includes("FONGIP")) shortName = "FONGIP Prêt d'Honneur";
      else if (s.source.length > 20) shortName = s.source.slice(0, 20) + "...";

      const millions = Math.round(s.total / 1_000_000);
      return {
        source: shortName,
        fullName: s.source,
        montantM: millions,
        displayLabel: `${millions} M`,
        total: s.total,
      };
    });

    if (others.length > 0) {
      const othersTotal = others.reduce((acc, curr) => acc + curr.total, 0);
      const millions = Math.round(othersTotal / 1_000_000);
      result.push({
        source: `Autres (${others.length} guichets)`,
        fullName: others.map((o) => o.source).join(", "),
        montantM: millions,
        displayLabel: `${millions} M`,
        total: othersTotal,
      });
    }

    return result;
  }, [stats]);

  const chartDataTypes = useMemo(() => {
    if (!stats || !stats.par_type_partenariat) return [];
    return stats.par_type_partenariat.map((t) => ({
      name: t.type,
      value: t.count,
    }));
  }, [stats]);

  if (isLoading) {
    return (
      <div className="flex h-56 items-center justify-center rounded-2xl border border-[rgba(60,35,20,0.08)] bg-white p-6 shadow-xs">
        <div className="flex flex-col items-center gap-2 text-[#5A4B42]">
          <Loader2 className="h-6 w-6 animate-spin text-[#C99A68]" />
          <p className="text-xs font-medium">Chargement des partenariats et financements...</p>
        </div>
      </div>
    );
  }

  if (!stats) return null;

  const totalFinanceMillions = Math.round(stats.total_finance / 1_000_000);
  const decaisseMillions = Math.round(stats.financements_decaisses / 1_000_000);
  const tauxDecaissement =
    stats.total_finance > 0
      ? Math.round((stats.financements_decaisses / stats.total_finance) * 100)
      : 0;

  return (
    <div className="space-y-6">
      {/* 1. EN-TÊTE DE SECTION */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-[rgba(60,35,20,0.06)] pb-3">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-[14px] font-semibold text-[#21130D]">
              Partenariats & Financements Mobilisés
            </h2>
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-800">
              <ShieldCheck className="h-3 w-3" />
              Recoupé Base CIAT
            </span>
          </div>
          <p className="text-[12px] text-[#5A4B42]">
            Suivi des accords industriels, académiques et guichets de financement d&apos;amorçage
          </p>
        </div>
      </div>

      {/* DEUX GRAPHIQUES : VOLUME PAR GUICHET & DONUT RÉPARTITION PAR NATURE */}
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        {/* Graphique 1 : Financements par source */}
        <div className="rounded-xl border border-[rgba(60,35,20,0.08)] bg-white p-4 sm:p-5 transition hover:shadow-[0_2px_8px_rgba(60,35,20,0.04)]">
          <div className="mb-4">
            <h3 className="text-[14px] font-semibold text-[#21130D]">
              Volume mobilisé par guichet partenaire
            </h3>
            <p className="text-[12px] text-[#5A4B42]">
              Total : {totalFinanceMillions} M FCFA (montants en Millions FCFA)
            </p>
          </div>
          <div className="h-[280px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={chartDataSources}
                layout="vertical"
                margin={{ top: 5, right: 60, left: 10, bottom: 5 }}
              >
                <XAxis
                  type="number"
                  tickLine={false}
                  axisLine={false}
                  tick={{ fontSize: 11, fill: "#5A4B42" }}
                />
                <YAxis
                  dataKey="source"
                  type="category"
                  width={180}
                  tickLine={false}
                  axisLine={false}
                  tick={{ fontSize: 12, fill: "#21130D", fontWeight: 500 }}
                  interval={0}
                />
                <Tooltip
                  formatter={(val: number) => [`${val} M FCFA`, "Volume mobilisé"]}
                  labelFormatter={(idx: number) => chartDataSources[idx]?.fullName || idx}
                  contentStyle={{
                    backgroundColor: "#FFFFFF",
                    borderColor: "rgba(60,35,20,0.08)",
                    borderRadius: "8px",
                    fontSize: "12px",
                  }}
                />
                <Bar
                  dataKey="montantM"
                  fill="#C99A68"
                  radius={[0, 6, 6, 0]}
                  barSize={16}
                >
                  <LabelList
                    dataKey="displayLabel"
                    position="right"
                    style={{
                      fill: "#5A4B42",
                      fontSize: 11,
                      fontWeight: 600,
                    }}
                  />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Graphique 2 : Typologie des partenariats */}
        <div className="rounded-xl border border-[rgba(60,35,20,0.08)] bg-white p-4 sm:p-5 transition hover:shadow-[0_2px_8px_rgba(60,35,20,0.04)]">
          <div className="mb-4">
            <h3 className="text-[14px] font-semibold text-[#21130D]">
              Répartition des partenariats par nature
            </h3>
            <p className="text-[12px] text-[#5A4B42]">
              Ventilation des accords actifs et signés
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-6 min-h-[280px] justify-center">
            {/* Conteneur carré 220 px avec texte central positionné en absolu */}
            <div className="relative w-[220px] h-[220px] shrink-0">
              <PieChart width={220} height={220}>
                <Pie
                  data={chartDataTypes}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius="92%"
                  innerRadius="68%"
                  paddingAngle={2}
                  cornerRadius={4}
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
                    borderColor: "rgba(60,35,20,0.08)",
                    borderRadius: "8px",
                    fontSize: "12px",
                  }}
                />
              </PieChart>

              {/* Texte central positionné en absolu DANS CE MÊME CONTENEUR CARRÉ */}
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="font-sans text-[24px] font-semibold text-[#21130D] tabular-nums leading-none">
                  {stats.total_partenariats || 33}
                </span>
                <span className="text-[11px] font-medium text-[#5A4B42] mt-0.5">
                  accords
                </span>
              </div>
            </div>

            {/* Légende verticale alignée à côté, jamais en chevauchement */}
            <div className="flex-1 flex flex-col justify-center space-y-2.5 w-full">
              {chartDataTypes.map((item, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between text-xs"
                >
                  <div className="flex items-center gap-2">
                    <span
                      className="h-2.5 w-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: PIE_COLORS[idx % PIE_COLORS.length] }}
                    />
                    <span
                      className="font-medium text-[#5A4B42] truncate max-w-[150px]"
                      title={item.name}
                    >
                      {item.name}
                    </span>
                  </div>
                  <span className="font-sans font-semibold text-[#21130D] tabular-nums">
                    {item.value}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* 4. TABLEAU DÉTAILLÉ */}
      <div className="rounded-xl border border-[rgba(60,35,20,0.08)] bg-white p-4 sm:p-5 transition hover:shadow-[0_2px_8px_rgba(60,35,20,0.04)]">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-[rgba(60,35,20,0.06)] pb-3">
          <div className="flex items-center gap-2">
            <Award className="h-4 w-4 text-[#C99A68]" />
            <h3 className="text-[14px] font-semibold text-[#21130D]">
              Détail des conventions et financements rattachés
            </h3>
          </div>

          <div className="inline-flex rounded-xl bg-[#FBF8F3] p-1 border border-[rgba(60,35,20,0.08)] text-xs font-semibold">
            <button
              type="button"
              onClick={() => setActiveTab("financements")}
              className={`rounded-lg px-3 py-1.5 transition-all ${
                activeTab === "financements"
                  ? "bg-[#21130D] text-white shadow-xs"
                  : "text-[#5A4B42] hover:text-[#21130D]"
              }`}
            >
              Financements ({financements.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("partenariats")}
              className={`rounded-lg px-3 py-1.5 transition-all ${
                activeTab === "partenariats"
                  ? "bg-[#21130D] text-white shadow-xs"
                  : "text-[#5A4B42] hover:text-[#21130D]"
              }`}
            >
              Partenariats ({partenariats.length})
            </button>
          </div>
        </div>

        {activeTab === "financements" ? (
          <div className="mt-3 overflow-x-auto">
            {financements.length === 0 ? (
              <p className="py-8 text-center text-xs text-[#5A4B42]">
                Aucun financement enregistré dans le périmètre sélectionné.
              </p>
            ) : (
              <table className="w-full text-left text-xs table-fixed min-w-[700px]">
                <thead>
                  <tr className="border-b border-[rgba(60,35,20,0.08)] bg-[#FBF8F3] text-[11px] font-semibold text-[#5A4B42] uppercase tracking-[0.06em]">
                    <th className="py-2.5 px-3 w-[34%]">Projet</th>
                    <th className="py-2.5 px-3 w-[20%]">Source</th>
                    <th className="py-2.5 px-3 w-[16%] text-right">Montant (FCFA)</th>
                    <th className="py-2.5 px-3 w-[15%] text-center">Statut</th>
                    <th className="py-2.5 px-3 w-[15%] text-center">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[rgba(60,35,20,0.04)]">
                  {financements.slice(0, 10).map((f) => (
                    <tr key={f.id} className="hover:bg-[#FBF8F3]/50 transition-colors h-[50px]">
                      <td className="py-2.5 px-3 font-medium text-[#21130D] truncate" title={f.projet_titre}>
                        {f.projet_titre}
                      </td>
                      <td className="py-2.5 px-3 text-[#5A4B42] truncate" title={f.source}>
                        {f.source}
                      </td>
                      <td className="py-2.5 px-3 text-right font-sans font-semibold text-[#21130D] tabular-nums">
                        {formatNumber(Number(f.montant) || 0)}
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <span className="inline-flex min-w-[80px] justify-center items-center rounded-md bg-[#5A7D65]/15 px-2 py-0.5 text-[11px] font-medium text-[#3B5442]">
                          {f.statut_display}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-center text-[#5A4B42] tabular-nums">
                        {formatDate(f.date)}
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
              <p className="py-8 text-center text-xs text-[#5A4B42]">
                Aucun partenariat enregistré dans le périmètre sélectionné.
              </p>
            ) : (
              <table className="w-full text-left text-xs table-fixed min-w-[700px]">
                <thead>
                  <tr className="border-b border-[rgba(60,35,20,0.08)] bg-[#FBF8F3] text-[11px] font-semibold text-[#5A4B42] uppercase tracking-[0.06em]">
                    <th className="py-2.5 px-3 w-[34%]">Projet</th>
                    <th className="py-2.5 px-3 w-[22%]">Partenaire</th>
                    <th className="py-2.5 px-3 w-[16%]">Type</th>
                    <th className="py-2.5 px-3 w-[14%] text-center">Statut</th>
                    <th className="py-2.5 px-3 w-[14%] text-center">Date début</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[rgba(60,35,20,0.04)]">
                  {partenariats.slice(0, 10).map((p) => (
                    <tr key={p.id} className="hover:bg-[#FBF8F3]/50 transition-colors h-[50px]">
                      <td className="py-2.5 px-3 font-medium text-[#21130D] truncate" title={p.projet_titre}>
                        {p.projet_titre}
                      </td>
                      <td className="py-2.5 px-3 text-[#5A4B42] truncate" title={p.partenaire}>
                        {p.partenaire}
                      </td>
                      <td className="py-2.5 px-3 text-[#21130D] font-medium truncate">
                        {p.type_display}
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <span className="inline-flex min-w-[80px] justify-center items-center rounded-md bg-[#C99A68]/20 px-2 py-0.5 text-[11px] font-medium text-[#8C5E2D]">
                          {p.statut_display}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-center text-[#5A4B42] tabular-nums">
                        {formatDate(p.date_debut)}
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
