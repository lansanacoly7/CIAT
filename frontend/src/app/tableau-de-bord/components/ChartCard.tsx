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
} from "recharts";
import { Table, EyeOff, BarChart3, AlertCircle, RotateCcw } from "lucide-react";
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
            animationDuration={600}
            animationEasing="ease-out"
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

// 2. Projets par domaine : Liste classée compacte (libellé, valeur, % en texte, barre fine de 6 px)
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
    <div className="w-full space-y-2.5 py-1">
      {sortedData.map((item) => (
        <div key={item.domaine} className="space-y-1">
          <div className="flex items-center justify-between gap-2 text-xs">
            <span
              title={item.fullDomaine}
              className="truncate font-medium text-[#21130D]"
            >
              {item.shortDomaine}
            </span>
            <div className="shrink-0 flex items-baseline gap-1 text-[12px] tabular-nums font-sans">
              <span className="font-semibold text-[#21130D]">
                {formatNumber(item.total)}
              </span>
              <span className="text-[#5A4B42]">
                ({item.percent} %)
              </span>
            </div>
          </div>

          {/* Barre fine de 6 px */}
          <div className="h-1.5 w-full rounded-full bg-[rgba(60,35,20,0.06)] overflow-hidden">
            <div
              className="h-full rounded-full bg-[#8C5E2D] transition-all duration-600 ease-out"
              style={{ width: `${item.barRatio}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

// 3. Mixité et parité des équipes :
// Hauteur adaptée au contenu (<= 200 px), chiffre en couleur foncée neutre (pas d'ocre pâle), un seul affichage (pas de doublon)
export function GenreChart({ data }: { data: ParGenreItem[] }) {
  const { total, femmes, hommes, autre, pctFemmes, pctHommes } = useMemo(() => {
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

    return {
      total: tot,
      femmes: f,
      hommes: h,
      autre: a,
      pctFemmes: pF,
      pctHommes: pH,
    };
  }, [data]);

  return (
    <div className="flex max-h-[200px] flex-col justify-center py-2 space-y-4">
      {/* Chiffres côte à côte (couleurs foncées avec contraste élevé) */}
      <div className="grid grid-cols-2 gap-4 border-b border-[rgba(60,35,20,0.06)] pb-3 text-center">
        <div>
          <div className="font-sans text-[26px] font-semibold tracking-[-0.02em] text-[#8C5E2D] tabular-nums">
            {formatNumber(femmes)}
          </div>
          <div className="text-[13px] font-medium text-[#21130D]">
            Femmes · {pctFemmes} %
          </div>
        </div>

        <div>
          <div className="font-sans text-[26px] font-semibold tracking-[-0.02em] text-[#21130D] tabular-nums">
            {formatNumber(hommes)}
          </div>
          <div className="text-[13px] font-medium text-[#21130D]">
            Hommes · {pctHommes} %
          </div>
        </div>
      </div>

      {/* Barre empilée horizontale 100% (hauteur 10px, bouts arrondis) */}
      <div className="space-y-1.5">
        <div className="h-2.5 w-full overflow-hidden rounded-full bg-[rgba(60,35,20,0.08)] flex">
          <div
            className="h-full bg-[#8C5E2D] transition-all duration-600"
            style={{ width: `${pctFemmes}%` }}
            title={`Femmes : ${femmes} (${pctFemmes} %)`}
          />
          <div
            className="h-full bg-[#21130D] transition-all duration-600"
            style={{ width: `${pctHommes}%` }}
            title={`Hommes : ${hommes} (${pctHommes} %)`}
          />
          {autre > 0 && (
            <div
              className="h-full bg-[#5A7D65] transition-all duration-600"
              style={{ width: `${100 - pctFemmes - pctHommes}%` }}
              title={`Autre / non précisé : ${autre}`}
            />
          )}
        </div>

        <div className="flex items-center justify-between text-[11px] text-[#5A4B42]">
          <span>Répartition globale par genre</span>
          <span className="tabular-nums font-medium">Effectif total : {formatNumber(total)} porteurs</span>
        </div>
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
            animationDuration={600}
            animationEasing="ease-out"
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
            animationDuration={600}
            animationEasing="ease-out"
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
            animationDuration={600}
            animationEasing="ease-out"
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
