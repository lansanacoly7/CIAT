"use client";

import { useMemo, useState } from "react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
  LabelList,
  ReferenceLine,
} from "recharts";
import { Table, Eye, EyeOff } from "lucide-react";
import type {
  EvolutionItem,
  ParCohorteItem,
  ParDomaineItem,
  ParGenreItem,
} from "../types";
import { formatNumber, formatPercent } from "@/lib/format";

// Palette de données officielle CIAT (6 teintes contrastées et harmonieuses)
export const DATA_COLORS = {
  brunProfond: "#3D2314",
  ocre: "#C99A68",
  vertSauge: "#5A7D65",
  bleuArdoise: "#4A6B82",
  terracotta: "#B85D43",
  grisChaud: "#8C7E74",
};

interface ChartCardProps {
  title: string;
  description?: string;
  badge?: string;
  summaryValue?: string;
  tableData?: Array<Record<string, string | number>>;
  tableColumns?: { key: string; label: string }[];
  children: React.ReactNode;
}

export function ChartCard({
  title,
  description,
  badge,
  summaryValue,
  tableData,
  tableColumns,
  children,
}: ChartCardProps) {
  const [showTable, setShowTable] = useState(false);

  return (
    <div className="flex flex-col rounded-2xl border border-[rgba(60,35,20,0.08)] bg-white p-5 shadow-[0_1px_2px_rgba(60,35,20,0.04),0_8px_24px_rgba(60,35,20,0.05)] transition hover:shadow-[0_2px_12px_rgba(60,35,20,0.08)]">
      {/* En-tête de la carte avec valeur de synthèse & bouton Voir les données */}
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3 border-b border-[rgba(60,35,20,0.06)] pb-3.5">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-bold tracking-tight text-[#21130D]">
              {title}
            </h3>
            {badge && (
              <span className="rounded-full bg-[#FBF8F3] border border-[rgba(60,35,20,0.06)] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.06em] text-[#8C7E74]">
                {badge}
              </span>
            )}
          </div>
          {description && (
            <p className="mt-1 text-xs text-[#8C7E74]">{description}</p>
          )}
        </div>

        <div className="flex items-center gap-3">
          {summaryValue && (
            <div className="text-right">
              <span className="font-serif text-lg font-bold text-[#21130D] tabular-nums">
                {summaryValue}
              </span>
            </div>
          )}

          {tableData && tableColumns && (
            <button
              type="button"
              onClick={() => setShowTable(!showTable)}
              className="inline-flex items-center gap-1.5 rounded-lg border border-[rgba(60,35,20,0.12)] bg-[#FBF8F3] px-2.5 py-1 text-xs font-semibold text-[#21130D] transition hover:bg-white hover:border-[#C99A68] active:scale-95"
              title={showTable ? "Masquer la table" : "Afficher les données sous forme de tableau"}
            >
              {showTable ? (
                <>
                  <EyeOff className="h-3.5 w-3.5 text-[#8C7E74]" />
                  <span>Graphique</span>
                </>
              ) : (
                <>
                  <Table className="h-3.5 w-3.5 text-[#C99A68]" />
                  <span>Voir les données</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>

      {/* Contenu : Graphique OU Table sous-jacente */}
      <div className="min-h-[260px] w-full flex-1">
        {showTable && tableData && tableColumns ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-[rgba(60,35,20,0.08)] bg-[#FBF8F3]">
                  {tableColumns.map((col) => (
                    <th
                      key={col.key}
                      className="px-3 py-2 font-semibold uppercase tracking-[0.06em] text-[#8C7E74]"
                    >
                      {col.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[rgba(60,35,20,0.04)]">
                {tableData.map((row, idx) => (
                  <tr key={idx} className="hover:bg-[#FBF8F3]/50">
                    {tableColumns.map((col) => (
                      <td
                        key={col.key}
                        className="px-3 py-2 text-[#21130D] tabular-nums"
                      >
                        {typeof row[col.key] === "number"
                          ? formatNumber(row[col.key] as number)
                          : row[col.key]}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          children
        )}
      </div>
    </div>
  );
}

// Tooltip personnalisé : carte blanche, ombre douce, rayon 12px, tabular-nums, pastille de couleur
interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{
    name?: string;
    value?: number | string;
    color?: string;
    fill?: string;
    payload?: Record<string, unknown>;
  }>;
  label?: string | number;
}

export function CustomTooltip({ active, payload, label }: CustomTooltipProps) {
  if (active && payload && payload.length) {
    return (
      <div className="rounded-xl border border-[rgba(60,35,20,0.08)] bg-white p-3 text-xs shadow-[0_8px_24px_rgba(60,35,20,0.12)]">
        {label && (
          <div className="mb-2 border-b border-[rgba(60,35,20,0.06)] pb-1.5 font-bold text-[#21130D]">
            {label}
          </div>
        )}
        <div className="space-y-1.5">
          {payload.map((item, idx) => (
            <div
              key={idx}
              className="flex items-center justify-between gap-4 text-xs"
            >
              <div className="flex items-center gap-2">
                <span
                  className="h-2.5 w-2.5 rounded-full"
                  style={{ backgroundColor: item.color || item.fill }}
                />
                <span className="font-medium text-[#8C7E74]">
                  {item.name || "Total"} :
                </span>
              </div>
              <span className="font-bold text-[#21130D] tabular-nums">
                {typeof item.value === "number"
                  ? formatNumber(item.value)
                  : item.value}
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  }
  return null;
}

// 1. Évolution mensuelle : Barres arrondies (radius 6) avec ligne de moyenne en pointillés
export function EvolutionChart({ data }: { data: EvolutionItem[] }) {
  const average = useMemo(() => {
    if (!data.length) return 0;
    const sum = data.reduce((acc, curr) => acc + curr.total, 0);
    return Math.round((sum / data.length) * 10) / 10;
  }, [data]);

  const tableData = useMemo(() => {
    return data.map((d) => ({ mois: d.mois, total: d.total }));
  }, [data]);

  return (
    <ResponsiveContainer width="100%" height={260}>
      <BarChart
        data={data}
        margin={{ top: 15, right: 15, left: -20, bottom: 0 }}
      >
        <CartesianGrid
          strokeDasharray="3 3"
          vertical={false}
          stroke="rgba(60,35,20,0.08)"
        />
        <XAxis
          dataKey="mois"
          tickLine={false}
          axisLine={false}
          tick={{ fill: "#8C7E74", fontSize: 12, fontWeight: 500 }}
        />
        <YAxis
          tickLine={false}
          axisLine={false}
          tick={{ fill: "#8C7E74", fontSize: 12 }}
        />
        <Tooltip content={<CustomTooltip />} />
        <ReferenceLine
          y={average}
          stroke="#C99A68"
          strokeDasharray="4 4"
          strokeWidth={1.5}
          label={{
            value: `Moy. (${formatNumber(average)})`,
            fill: "#C99A68",
            fontSize: 11,
            position: "right",
          }}
        />
        <Bar
          dataKey="total"
          name="Projets créés"
          fill={DATA_COLORS.brunProfond}
          radius={[6, 6, 0, 0]}
          barSize={20}
          animationDuration={700}
          animationEasing="ease-out"
        />
      </BarChart>
    </ResponsiveContainer>
  );
}

// 2. Domaines prioritaires : Barres horizontales triées décroissantes, couleur unique, LabelList au bout avec part en %
export function DomaineChart({ data }: { data: ParDomaineItem[] }) {
  const sortedData = useMemo(() => {
    const totalGlobal = data.reduce((acc, d) => acc + d.total, 0);
    return [...data]
      .sort((a, b) => b.total - a.total)
      .map((d) => ({
        ...d,
        percent:
          totalGlobal > 0
            ? Math.round((d.total / totalGlobal) * 1000) / 10
            : 0,
      }));
  }, [data]);

  return (
    <ResponsiveContainer width="100%" height={260}>
      <BarChart
        data={sortedData}
        layout="vertical"
        margin={{ top: 10, right: 40, left: 10, bottom: 0 }}
      >
        <CartesianGrid
          strokeDasharray="3 3"
          horizontal={false}
          stroke="rgba(60,35,20,0.08)"
        />
        <XAxis
          type="number"
          tickLine={false}
          axisLine={false}
          tick={{ fill: "#8C7E74", fontSize: 12 }}
        />
        <YAxis
          dataKey="domaine"
          type="category"
          tickLine={false}
          axisLine={false}
          tick={{ fill: "#21130D", fontSize: 12, fontWeight: 500 }}
          width={130}
        />
        <Tooltip content={<CustomTooltip />} />
        <Bar
          dataKey="total"
          name="Projets"
          fill={DATA_COLORS.ocre}
          radius={[0, 6, 6, 0]}
          barSize={14}
          animationDuration={700}
          animationEasing="ease-out"
        >
          <LabelList
            dataKey="percent"
            position="right"
            formatter={(val: number) => `${val}%`}
            style={{ fill: "#8C7E74", fontSize: 11, fontWeight: 600 }}
          />
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

// 3. Comparaison cohortes : Barres groupées plus larges, 3 séries contrastées, valeurs au-dessus
export function CohorteChart({ data }: { data: ParCohorteItem[] }) {
  return (
    <ResponsiveContainer width="100%" height={260}>
      <BarChart
        data={data}
        margin={{ top: 20, right: 15, left: -20, bottom: 0 }}
        barGap={6}
      >
        <CartesianGrid
          strokeDasharray="3 3"
          vertical={false}
          stroke="rgba(60,35,20,0.08)"
        />
        <XAxis
          dataKey="cohorte"
          tickLine={false}
          axisLine={false}
          tick={{ fill: "#8C7E74", fontSize: 12, fontWeight: 500 }}
        />
        <YAxis
          tickLine={false}
          axisLine={false}
          tick={{ fill: "#8C7E74", fontSize: 12 }}
        />
        <Tooltip content={<CustomTooltip />} />
        <Legend
          verticalAlign="top"
          align="right"
          iconType="circle"
          iconSize={8}
          wrapperStyle={{ paddingBottom: 10, fontSize: 12, color: "#21130D" }}
        />
        <Bar
          dataKey="total"
          name="Idées soumises"
          fill={DATA_COLORS.grisChaud}
          radius={[4, 4, 0, 0]}
          barSize={14}
          animationDuration={700}
          animationEasing="ease-out"
        />
        <Bar
          dataKey="selectionnes"
          name="Projets retenus"
          fill={DATA_COLORS.brunProfond}
          radius={[4, 4, 0, 0]}
          barSize={14}
          animationDuration={700}
          animationEasing="ease-out"
        />
        <Bar
          dataKey="prototypes"
          name="Prototypes validés"
          fill={DATA_COLORS.ocre}
          radius={[4, 4, 0, 0]}
          barSize={14}
          animationDuration={700}
          animationEasing="ease-out"
        />
      </BarChart>
    </ResponsiveContainer>
  );
}

// 4. Donuts genre : Anneau fin (épaisseur 14 %), total au centre en serif, légende verticale alignée à droite
export function GenreChart({ data }: { data: ParGenreItem[] }) {
  const total = useMemo(() => {
    return data.reduce((acc, curr) => acc + curr.total, 0);
  }, [data]);

  const donutColors = [
    DATA_COLORS.brunProfond, // Hommes
    DATA_COLORS.ocre,        // Femmes
    DATA_COLORS.vertSauge,   // Équipes mixtes
  ];

  return (
    <div className="relative flex items-center justify-center">
      <ResponsiveContainer width="100%" height={260}>
        <PieChart>
          <Pie
            data={data}
            cx="40%"
            cy="50%"
            innerRadius="68%" // Épaisseur = 82% - 68% = 14%
            outerRadius="82%"
            paddingAngle={4}
            dataKey="total"
            nameKey="genre"
            cornerRadius={4}
            animationDuration={700}
            animationEasing="ease-out"
          >
            {data.map((_, index) => (
              <Cell
                key={`cell-${index}`}
                fill={donutColors[index % donutColors.length]}
                stroke="#FFFFFF"
                strokeWidth={2}
              />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
          <Legend
            layout="vertical"
            verticalAlign="middle"
            align="right"
            iconType="circle"
            iconSize={8}
            wrapperStyle={{ fontSize: 12, color: "#21130D", paddingRight: 10 }}
            formatter={(value: string, entry: unknown) => {
              const item = (entry as { payload?: ParGenreItem }).payload;
              const count = item?.total ?? 0;
              const pct = total > 0 ? Math.round((count / total) * 100) : 0;
              return `${value} : ${count} (${pct} %)`;
            }}
          />
          {/* Total au centre en serif 44px */}
          <text
            x="40%"
            y="48%"
            textAnchor="middle"
            dominantBaseline="middle"
            className="font-serif text-3xl font-bold fill-[#21130D]"
          >
            {total}
          </text>
          <text
            x="40%"
            y="60%"
            textAnchor="middle"
            dominantBaseline="middle"
            className="text-[11px] font-semibold uppercase tracking-[0.06em] fill-[#8C7E74]"
          >
            Porteurs
          </text>
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
