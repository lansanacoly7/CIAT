"use client";

import { useMemo, useState } from "react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  LabelList,
  ReferenceLine,
  Cell,
  PieChart,
  Pie,
} from "recharts";
import { Table, EyeOff, BarChart3, AlertCircle, RotateCcw, Users, Sparkles, CheckCircle2 } from "lucide-react";
import type {
  EvolutionItem,
  ParCohorteItem,
  ParDomaineItem,
  ParGenreItem,
} from "../types";
import { formatNumber } from "@/lib/format";
import { getDomaineShortLabel, getDomaineFullName } from "@/lib/domaines";

// Palette de données officielle CIAT (contraste vérifié WCAG AA >= 4.5:1)
export const DATA_COLORS = {
  brunProfond: "#21130D",
  brunMoyen: "#4A2818",
  cuivre: "#8C5E2D", // Cuivre soutenu pour contraste optimal
  ocre: "#A8723E",
  vertSauge: "#3E5C46",
  bleuArdoise: "#345064",
  neutreFonce: "#5A4B42",
};

interface ChartCardProps {
  title: string;
  description?: string;
  badge?: string;
  summaryValue?: string;
  tableData?: Array<Record<string, string | number>>;
  tableColumns?: { key: string; label: string }[];
  isEmpty?: boolean;
  emptyTitle?: string;
  emptyMessage?: string;
  isError?: boolean;
  errorMessage?: string;
  onRetry?: () => void;
  children: React.ReactNode;
}

export function ChartCard({
  title,
  description,
  summaryValue,
  tableData,
  tableColumns,
  isEmpty,
  emptyTitle,
  emptyMessage,
  isError,
  errorMessage,
  onRetry,
  children,
}: ChartCardProps) {
  const [showTable, setShowTable] = useState(false);

  return (
    <div className="flex flex-col rounded-xl border border-[rgba(60,35,20,0.08)] bg-white p-4 sm:p-5 transition hover:shadow-[0_2px_8px_rgba(60,35,20,0.04)]">
      {/* En-tête : Titre 14px, Sous-titre dynamique, Bouton table discret */}
      <div className="mb-3 flex items-start justify-between gap-3 border-b border-[rgba(60,35,20,0.06)] pb-2.5">
        <div>
          <h3 className="text-[14px] font-semibold text-[#21130D]">
            {title}
          </h3>
          {description && (
            <p className="mt-0.5 text-[12px] text-[#5A4B42]">{description}</p>
          )}
        </div>

        <div className="flex items-center gap-2.5">
          {summaryValue && (
            <div className="text-right">
              <span className="font-sans text-[13px] font-medium text-[#5A4B42] tabular-nums">
                {summaryValue}
              </span>
            </div>
          )}

          {tableData && tableColumns && (
            <button
              type="button"
              onClick={() => setShowTable(!showTable)}
              className="inline-flex h-7 w-7 items-center justify-center rounded-lg border border-[rgba(60,35,20,0.12)] bg-[#FBF8F3] text-[#5A4B42] transition hover:border-[#C99A68] hover:text-[#21130D] active:scale-95"
              title={
                showTable
                  ? "Afficher le graphique"
                  : "Afficher les données sous forme de tableau"
              }
              aria-label={
                showTable
                  ? "Afficher le graphique"
                  : "Afficher les données sous forme de tableau"
              }
            >
              {showTable ? (
                <EyeOff className="h-3.5 w-3.5" />
              ) : (
                <Table className="h-3.5 w-3.5" />
              )}
            </button>
          )}
        </div>
      </div>

      {/* Contenu : Graphique OU Table */}
      <div className="w-full flex-1">
        {showTable && tableData && tableColumns ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-[rgba(60,35,20,0.08)] bg-[#FBF8F3]">
                  {tableColumns.map((col) => (
                    <th
                      key={col.key}
                      className="px-3 py-2 font-semibold uppercase tracking-[0.06em] text-[#5A4B42]"
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
                        className="px-3 py-2 font-sans text-[#21130D] tabular-nums"
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
        ) : isError ? (
          <div className="flex h-[240px] flex-col items-center justify-center rounded-xl border border-dashed border-[#B85D43]/30 bg-[#B85D43]/5 p-6 text-center">
            <div className="mb-2 flex h-8 w-8 items-center justify-center rounded-full bg-[#B85D43]/15 text-[#8B3B26]">
              <AlertCircle className="h-4 w-4" />
            </div>
            <h4 className="text-xs font-semibold text-[#21130D]">
              Erreur de chargement des données
            </h4>
            <p className="mt-1 max-w-xs text-[11px] text-[#5A4B42]">
              {errorMessage || "Une anomalie réseau est survenue lors de la synchronisation."}
            </p>
            {onRetry && (
              <button
                type="button"
                onClick={onRetry}
                className="mt-2.5 inline-flex items-center gap-1.5 rounded-lg bg-[#21130D] px-2.5 py-1 text-xs font-semibold text-white shadow-xs transition hover:bg-[#3D2314] active:scale-95"
              >
                <RotateCcw className="h-3 w-3" />
                <span>Réessayer</span>
              </button>
            )}
          </div>
        ) : isEmpty ? (
          <div className="flex h-[240px] flex-col items-center justify-center rounded-xl border border-dashed border-[rgba(60,35,20,0.12)] bg-[#FBF8F3]/60 p-6 text-center">
            <div className="mb-2 flex h-8 w-8 items-center justify-center rounded-full bg-white border border-[rgba(60,35,20,0.08)] text-[#5A4B42]">
              <BarChart3 className="h-4 w-4" />
            </div>
            <h4 className="text-xs font-semibold text-[#21130D]">
              {emptyTitle || "Aucune donnée disponible"}
            </h4>
            <p className="mt-1 max-w-xs text-[11px] text-[#5A4B42]">
              {emptyMessage || "Aucun projet ne correspond aux filtres sélectionnés."}
            </p>
          </div>
        ) : (
          children
        )}
      </div>
    </div>
  );
}

// Tooltip personnalisé sobre
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
      <div className="rounded-xl border border-[rgba(60,35,20,0.08)] bg-white p-2.5 text-xs shadow-[0_4px_16px_rgba(60,35,20,0.08)]">
        {label && (
          <div className="mb-1.5 border-b border-[rgba(60,35,20,0.06)] pb-1 font-semibold text-[#21130D]">
            {label}
          </div>
        )}
        <div className="space-y-1">
          {payload.map((item, idx) => (
            <div
              key={idx}
              className="flex items-center justify-between gap-3 text-xs"
            >
              <div className="flex items-center gap-1.5">
                <span
                  className="h-2 w-2 rounded-full"
                  style={{ backgroundColor: item.color || item.fill }}
                />
                <span className="font-medium text-[#5A4B42]">
                  {item.name || "Total"} :
                </span>
              </div>
              <span className="font-sans font-semibold text-[#21130D] tabular-nums">
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

// Formateur de date X Axis : "juin 25" (jamais ISO brute)
function formatMonthYear(moisStr: string): string {
  try {
    const parts = moisStr.split("-");
    if (parts.length === 2) {
      const year = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1;
      const d = new Date(year, month, 1);
      const formatted = new Intl.DateTimeFormat("fr-FR", {
        month: "short",
        year: "2-digit",
      }).format(d);
      return formatted.replace(".", "");
    }
    const d = new Date(moisStr);
    return new Intl.DateTimeFormat("fr-FR", {
      month: "short",
      year: "2-digit",
    })
      .format(d)
      .replace(".", "");
  } catch {
    return moisStr;
  }
}

// 1. Évolution mensuelle des projets :
// Retrait de l'étiquette au-dessus des barres ; "--- Moyenne X" dans la légende au-dessus du graphique
export function EvolutionChart({ data }: { data: EvolutionItem[] }) {
  const formattedData = useMemo(() => {
    return data.map((item) => ({
      ...item,
      labelFr: formatMonthYear(item.mois),
    }));
  }, [data]);

  const average = useMemo(() => {
    if (!data.length) return 0;
    const sum = data.reduce((acc, curr) => acc + curr.total, 0);
    return Math.round((sum / data.length) * 10) / 10;
  }, [data]);

  const avgFormatted = average.toFixed(1).replace(".", ",");

  return (
    <div className="w-full">
      {/* Légende au-dessus du graphique incluant la moyenne en pointillés */}
      <div className="mb-2 flex items-center justify-end gap-4 text-[11px] text-[#5A4B42]">
        <div className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-xs bg-[#4A2818]" />
          <span>Projets créés</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="h-0.5 w-3.5 border-t-2 border-dashed border-[#8C5E2D]" />
          <span className="font-medium text-[#8C5E2D] tabular-nums">
            Moyenne {avgFormatted}
          </span>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={250}>
        <BarChart
          data={formattedData}
          accessibilityLayer={false}
          margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
        >
          <CartesianGrid
            strokeDasharray="3 3"
            vertical={false}
            stroke="rgba(60,35,20,0.06)"
          />
          <XAxis
            dataKey="labelFr"
            tickLine={false}
            axisLine={false}
            tick={{ fill: "#5A4B42", fontSize: 11, fontWeight: 500 }}
          />
          <YAxis
            tickLine={false}
            axisLine={false}
            tick={{ fill: "#5A4B42", fontSize: 11 }}
          />
          <Tooltip content={<CustomTooltip />} />
          <ReferenceLine
            y={average}
            stroke="#8C5E2D"
            strokeDasharray="4 4"
            strokeWidth={1.5}
          />
          <Bar
            dataKey="total"
            name="Projets créés"
            radius={[4, 4, 0, 0]}
            maxBarSize={18}
            isAnimationActive={false}
          >
            {formattedData.map((entry, index) => {
              const isLast = index === formattedData.length - 1;
              return (
                <Cell
                  key={`cell-${index}`}
                  fill={isLast ? DATA_COLORS.cuivre : DATA_COLORS.brunMoyen}
                />
              );
            })}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

// 2. Projets par domaine : Liste épurée et harmonieuse respectant strictement la charte CIAT
export function DomaineChart({ data }: { data: ParDomaineItem[] }) {
  const sortedData = useMemo(() => {
    const totalGlobal = data.reduce((acc, d) => acc + d.total, 0);
    const maxVal = Math.max(...data.map((d) => d.total), 1);
    return [...data]
      .sort((a, b) => b.total - a.total)
      .map((d) => {
        const shortName = getDomaineShortLabel(d.domaine);
        const fullName = getDomaineFullName(d.domaine);
        const percent =
          totalGlobal > 0 ? Math.round((d.total / totalGlobal) * 100) : 0;
        const barRatio = Math.round((d.total / maxVal) * 100);
        return {
          ...d,
          shortDomaine: shortName,
          fullDomaine: fullName,
          percent,
          barRatio,
        };
      });
  }, [data]);

  return (
    <div className="w-full space-y-4 py-1">
      <div className="space-y-3.5">
        {sortedData.map((item, idx) => (
          <div
            key={item.domaine}
            className="group space-y-1.5 rounded-lg p-1.5 transition-colors hover:bg-[#FAF7F2]"
          >
            {/* Ligne En-tête : Rang discret, Nom CIAT et Effectif */}
            <div className="flex items-center justify-between gap-2 text-xs">
              <div className="flex items-center gap-2 truncate">
                <span className="w-4 shrink-0 font-mono text-[11px] font-semibold text-[#8C6D4F] tabular-nums">
                  {String(idx + 1).padStart(2, "0")}
                </span>
                <span
                  title={item.fullDomaine}
                  className="truncate text-[13px] font-medium text-[#21130D] transition-colors group-hover:text-[#8C5E2D]"
                >
                  {item.shortDomaine}
                </span>
              </div>
              <div className="flex shrink-0 items-baseline gap-1.5 text-xs tabular-nums font-sans">
                <span className="font-bold text-[#21130D]">
                  {formatNumber(item.total)}
                </span>
                <span className="text-[11px] text-[#6B5646]">projets</span>
                <span className="ml-1 text-[11px] font-medium text-[#8C6D4F]">
                  ({item.percent} %)
                </span>
              </div>
            </div>

            {/* Barre généreuse de 10 px aux couleurs officielles CIAT (Cuivre #8C5E2D) */}
            <div className="h-2.5 w-full overflow-hidden rounded-full bg-[#EFE4D6]/70">
              <div
                className="h-full rounded-full bg-[#8C5E2D] transition-all duration-700 ease-out group-hover:bg-[#612D10]"
                style={{ width: `${item.barRatio}%` }}
              />
            </div>
          </div>
        ))}
      </div>

      {/* Bandeau de synthèse filière dominante aux couleurs sobres CIAT */}
      {sortedData.length > 0 && (
        <div className="mt-2 flex items-center justify-between rounded-xl border border-[#EFE4D6] bg-[#FAF7F2] px-3.5 py-2.5 text-xs text-[#21130D]">
          <span className="flex items-center gap-2 font-medium text-[#612D10]">
            <Sparkles className="h-3.5 w-3.5 text-[#8C5E2D]" aria-hidden="true" />
            <span>
              Filière dominante : <strong className="font-semibold text-[#21130D]">{sortedData[0]?.shortDomaine}</strong>
            </span>
          </span>
          <span className="font-semibold tabular-nums text-[#8C5E2D]">
            {sortedData[0]?.total} projets ({sortedData[0]?.percent} %)
          </span>
        </div>
      )}
    </div>
  );
}

// 3. Mixité et parité des équipes : Graphique en ANNEAU (Donut) avec animations, KPI central et cartes d'effectif
export function GenreChart({ data }: { data: ParGenreItem[] }) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  const { total, femmes, hommes, autre, pctFemmes, pctHommes, pieData } = useMemo(() => {
    let f = 0;
    let h = 0;
    let a = 0;
    data.forEach((item) => {
      const g = item.genre.toLowerCase();
      if (g.includes("femme") || g === "f") f += item.total;
      else if (g.includes("homme") || g === "h") h += item.total;
      else a += item.total;
    });

    const tot = f + h + a;
    const pF = tot > 0 ? Math.round((f / tot) * 100) : 0;
    const pH = tot > 0 ? Math.round((h / tot) * 100) : 0;

    const slices = [
      {
        name: "Femmes",
        value: f,
        percent: pF,
        color: "#8C5E2D", // Cuivre CIAT
        sub: "Porteuses d'innovation",
      },
      {
        name: "Hommes",
        value: h,
        percent: pH,
        color: "#21130D", // Brun profond CIAT
        sub: "Porteurs d'innovation",
      },
    ];

    if (a > 0) {
      slices.push({
        name: "Non précisé",
        value: a,
        percent: 100 - pF - pH,
        color: "#C99A68",
        sub: "Profils non renseignés",
      });
    }

    return {
      total: tot,
      femmes: f,
      hommes: h,
      autre: a,
      pctFemmes: pF,
      pctHommes: pH,
      pieData: slices,
    };
  }, [data]);

  return (
    <div className="flex flex-col justify-between py-2 space-y-5">
      {/* Anneau animé avec KPI centré */}
      <div className="relative mx-auto flex h-[230px] w-full max-w-[320px] items-center justify-center">
        <ResponsiveContainer width="100%" height={230}>
          <PieChart>
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const d = payload[0].payload;
                  return (
                    <div className="rounded-xl border border-[rgba(60,35,20,0.12)] bg-white p-3 text-xs shadow-md">
                      <div className="flex items-center gap-2">
                        <span
                          className="h-2.5 w-2.5 rounded-full"
                          style={{ backgroundColor: d.color }}
                        />
                        <span className="font-bold text-[#21130D]">{d.name}</span>
                      </div>
                      <div className="mt-1 text-[#6B5646]">
                        {formatNumber(d.value)} porteurs ({d.percent} %)
                      </div>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Pie
              data={pieData}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              innerRadius={70}
              outerRadius={98}
              paddingAngle={4}
              cornerRadius={6}
              isAnimationActive={true}
              animationDuration={1100}
              animationEasing="ease-out"
              onMouseEnter={(_, idx) => setActiveIndex(idx)}
              onMouseLeave={() => setActiveIndex(null)}
            >
              {pieData.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={entry.color}
                  stroke={activeIndex === index ? "#FAF7F2" : "transparent"}
                  strokeWidth={3}
                  className="transition-all duration-300 cursor-pointer hover:opacity-90"
                />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>

        {/* Badge KPI au centre de l'anneau */}
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
          <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#8C6D4F]">
            {activeIndex !== null ? pieData[activeIndex]?.name : "Parité CIAT"}
          </span>
          <span className="font-sans text-3xl font-black text-[#612D10] tabular-nums tracking-tight">
            {activeIndex !== null
              ? `${pieData[activeIndex]?.percent} %`
              : `${pctFemmes} %`}
          </span>
          <span className="text-[11px] font-semibold text-[#8C5E2D]">
            {activeIndex !== null
              ? `${pieData[activeIndex]?.value} porteurs`
              : "Femmes"}
          </span>
        </div>
      </div>

      {/* Cartes métriques Féminin / Masculin côte à côte */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4">
        {pieData.slice(0, 2).map((item) => (
          <div
            key={item.name}
            className="flex flex-col justify-between rounded-xl border border-[#EFE4D6] bg-[#FAF7F2] p-3.5 transition-all hover:bg-white hover:border-[#C99A68] hover:shadow-2xs"
          >
            <div className="flex items-center justify-between gap-1.5">
              <span className="flex items-center gap-2">
                <span
                  className="h-2.5 w-2.5 rounded-full"
                  style={{ backgroundColor: item.color }}
                />
                <span className="text-xs font-bold text-[#21130D]">{item.name}</span>
              </span>
              <span className="rounded-md border border-[#EFE4D6] bg-white px-2 py-0.5 text-xs font-bold tabular-nums text-[#612D10]">
                {item.percent} %
              </span>
            </div>
            <div className="mt-2.5 flex items-baseline justify-between">
              <div className="font-sans text-2xl font-black text-[#21130D] tabular-nums">
                {formatNumber(item.value)}
              </div>
              <span className="text-[11px] text-[#6B5646]">sur {formatNumber(total)}</span>
            </div>
            <div className="mt-1 text-[11px] text-[#8C6D4F] truncate">
              {item.sub}
            </div>
          </div>
        ))}
      </div>

      {/* Badge de réussite de parité */}
      <div className="flex items-center justify-between rounded-xl border border-[#2E7D32]/30 bg-[#2E7D32]/5 px-3.5 py-2.5 text-xs text-[#2E7D32]">
        <div className="flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 shrink-0 text-[#2E7D32]" aria-hidden="true" />
          <span className="font-medium text-[#1E5222]">
            Objectif mixité ISEP atteint : <strong className="font-bold">{pctFemmes}% femmes</strong> (cible 40%)
          </span>
        </div>
        <span className="shrink-0 rounded-md bg-white border border-[#2E7D32]/20 px-2 py-0.5 text-[11px] font-bold text-[#2E7D32]">
          Conforme
        </span>
      </div>
    </div>
  );
}

// 4. Comparaison entre promotions (Cohortes) :
// Marge de 16 px entre la légende et la zone du graphique (domaine Y max + 25%) pour qu'aucune étiquette ne touche la légende
// Texte de légende en couleur foncée neutre (#21130D)
export function CohorteChart({ data }: { data: ParCohorteItem[] }) {
  return (
    <div className="w-full">
      {/* Légende en couleur neutre foncée au-dessus */}
      <div className="mb-3 flex items-center justify-end gap-4 text-[11px] text-[#21130D]">
        <div className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-[#5A4B42]" />
          <span>Idées soumises</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-[#21130D]" />
          <span>Retenus</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-[#8C5E2D]" />
          <span>Prototypes</span>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={250}>
        <BarChart
          data={data}
          accessibilityLayer={false}
          margin={{ top: 16, right: 10, left: -20, bottom: 0 }}
          barGap={4}
        >
          <CartesianGrid
            strokeDasharray="3 3"
            vertical={false}
            stroke="rgba(60,35,20,0.06)"
          />
          <XAxis
            dataKey="cohorte"
            tickLine={false}
            axisLine={false}
            tick={{ fill: "#5A4B42", fontSize: 11, fontWeight: 500 }}
          />
          <YAxis
            tickLine={false}
            axisLine={false}
            tick={{ fill: "#5A4B42", fontSize: 11 }}
            domain={[0, (dataMax: number) => Math.ceil(dataMax * 1.25)]}
          />
          <Tooltip content={<CustomTooltip />} />
          <Bar
            dataKey="total"
            name="Idées soumises"
            fill="#5A4B42"
            radius={[3, 3, 0, 0]}
            maxBarSize={22}
            isAnimationActive={false}
          >
            <LabelList
              dataKey="total"
              position="top"
              style={{ fill: "#5A4B42", fontSize: 10, fontWeight: 600 }}
            />
          </Bar>
          <Bar
            dataKey="selectionnes"
            name="Projets retenus"
            fill="#21130D"
            radius={[3, 3, 0, 0]}
            maxBarSize={22}
            isAnimationActive={false}
          >
            <LabelList
              dataKey="selectionnes"
              position="top"
              style={{ fill: "#21130D", fontSize: 10, fontWeight: 600 }}
            />
          </Bar>
          <Bar
            dataKey="prototypes"
            name="Prototypes validés"
            fill="#8C5E2D"
            radius={[3, 3, 0, 0]}
            maxBarSize={22}
            isAnimationActive={false}
          >
            <LabelList
              dataKey="prototypes"
              position="top"
              style={{ fill: "#8C5E2D", fontSize: 10, fontWeight: 600 }}
            />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
