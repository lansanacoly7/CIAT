"use client";

import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
} from "recharts";
import type {
  EvolutionItem,
  ParCohorteItem,
  ParDomaineItem,
  ParGenreItem,
} from "../types";

// Palette officielle CIAT raffinée et élégante
const COLOR_PRIMARY = "#602d10"; // Brun CIAT
const COLOR_ACCENT = "#c99a69";  // Beige / Ocre Doré
const COLOR_MUTED = "#8c786a";   // Brun doux / gris charte
const COLOR_LIGHT = "#e6d8c6";   // Bordure ivoire douce

const GENRE_COLORS = [COLOR_PRIMARY, COLOR_ACCENT, COLOR_MUTED];

interface ChartCardProps {
  title: string;
  description?: string;
  badge?: string;
  children: React.ReactNode;
}

export function ChartCard({ title, description, badge, children }: ChartCardProps) {
  return (
    <div className="flex flex-col rounded-2xl border border-zinc-200/90 bg-white p-6 shadow-[0_1px_3px_rgba(0,0,0,0.02),0_6px_16px_rgba(33,19,13,0.03)] transition-all duration-300 hover:shadow-[0_8px_24px_rgba(33,19,13,0.06)]">
      <div className="mb-4 flex items-start justify-between gap-2 border-b border-zinc-100 pb-3">
        <div>
          <h3 className="text-sm font-bold tracking-tight text-zinc-900">
            {title}
          </h3>
          {description && (
            <p className="mt-0.5 text-xs text-zinc-500">{description}</p>
          )}
        </div>
        {badge && (
          <span className="shrink-0 rounded-full bg-[#f8f1e7] px-2.5 py-0.5 text-[10px] font-semibold text-[#602d10]">
            {badge}
          </span>
        )}
      </div>
      <div className="min-h-[290px] w-full flex-1">{children}</div>
    </div>
  );
}

interface TooltipPayloadItem {
  name?: string;
  value?: number | string;
  color?: string;
  fill?: string;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: TooltipPayloadItem[];
  label?: string | number;
}

// Custom tooltip flottant avec micro-ombre et bordure soignée
function CustomTooltip({ active, payload, label }: CustomTooltipProps) {
  if (active && payload && payload.length) {
    return (
      <div className="rounded-xl border border-zinc-200 bg-white/95 px-3.5 py-2.5 text-xs shadow-lg backdrop-blur-xs">
        <div className="font-semibold text-zinc-800">{label}</div>
        <div className="mt-1.5 space-y-1">
          {payload.map((entry: TooltipPayloadItem, index: number) => (
            <div key={`item-${index}`} className="flex items-center gap-2">
              <span
                className="h-2 w-2 rounded-full ring-2 ring-white"
                style={{ backgroundColor: entry.color || entry.fill }}
              />
              <span className="text-zinc-500">{entry.name || "Total"} :</span>
              <span className="font-mono font-bold text-zinc-900 tabular-nums">
                {typeof entry.value === "number"
                  ? entry.value.toLocaleString("fr-FR")
                  : entry.value}
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  }
  return null;
}

/** 1. Graphique d'évolution temporelle avec aire en dégradé */
export function EvolutionChart({ data }: { data: EvolutionItem[] }) {
  return (
    <ResponsiveContainer width="100%" height={290}>
      <AreaChart data={data} margin={{ top: 15, right: 15, left: -20, bottom: 0 }}>
        <defs>
          <linearGradient id="areaGradientCIAT" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={COLOR_PRIMARY} stopOpacity={0.25} />
            <stop offset="50%" stopColor={COLOR_ACCENT} stopOpacity={0.08} />
            <stop offset="95%" stopColor={COLOR_PRIMARY} stopOpacity={0.0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f4f4f5" />
        <XAxis
          dataKey="mois"
          tickLine={false}
          axisLine={{ stroke: "#e4e4e7" }}
          tick={{ fill: "#71717a", fontSize: 11 }}
        />
        <YAxis
          tickLine={false}
          axisLine={false}
          tick={{ fill: "#71717a", fontSize: 11 }}
        />
        <Tooltip content={<CustomTooltip />} />
        <Area
          type="monotone"
          dataKey="total"
          name="Projets cumulés"
          stroke={COLOR_PRIMARY}
          strokeWidth={2.5}
          activeDot={{ r: 5, fill: "#ffffff", stroke: COLOR_PRIMARY, strokeWidth: 2.5 }}
          fill="url(#areaGradientCIAT)"
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}

/** 2. Répartition par domaine prioritaire (Barres fines arrondies et élégantes) */
export function DomaineChart({ data }: { data: ParDomaineItem[] }) {
  return (
    <ResponsiveContainer width="100%" height={290}>
      <BarChart
        data={data}
        layout="vertical"
        margin={{ top: 10, right: 25, left: 30, bottom: 0 }}
      >
        <defs>
          <linearGradient id="barGradientDomaine" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor={COLOR_PRIMARY} />
            <stop offset="100%" stopColor="#8c4b24" />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f4f4f5" />
        <XAxis
          type="number"
          tickLine={false}
          axisLine={{ stroke: "#e4e4e7" }}
          tick={{ fill: "#71717a", fontSize: 11 }}
        />
        <YAxis
          dataKey="domaine"
          type="category"
          tickLine={false}
          axisLine={false}
          tick={{ fill: "#3f3f46", fontSize: 11, fontWeight: 600 }}
          width={100}
        />
        <Tooltip content={<CustomTooltip />} />
        <Bar
          dataKey="total"
          name="Projets enregistrés"
          fill="url(#barGradientDomaine)"
          radius={[0, 999, 999, 0]}
          barSize={14}
        />
      </BarChart>
    </ResponsiveContainer>
  );
}

/** 3. Comparaison entre cohortes (Multi-barres douces) */
export function CohorteChart({ data }: { data: ParCohorteItem[] }) {
  return (
    <ResponsiveContainer width="100%" height={290}>
      <BarChart
        data={data}
        margin={{ top: 15, right: 15, left: -20, bottom: 0 }}
        barGap={6}
      >
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f4f4f5" />
        <XAxis
          dataKey="cohorte"
          tickLine={false}
          axisLine={{ stroke: "#e4e4e7" }}
          tick={{ fill: "#71717a", fontSize: 11 }}
        />
        <YAxis
          tickLine={false}
          axisLine={false}
          tick={{ fill: "#71717a", fontSize: 11 }}
        />
        <Tooltip content={<CustomTooltip />} />
        <Legend
          verticalAlign="top"
          align="right"
          iconType="circle"
          iconSize={8}
          wrapperStyle={{ paddingBottom: 12, fontSize: 11, color: "#71717a" }}
        />
        <Bar
          dataKey="total"
          name="Idées soumises"
          fill={COLOR_LIGHT}
          radius={[5, 5, 0, 0]}
          barSize={12}
        />
        <Bar
          dataKey="selectionnes"
          name="Projets retenus"
          fill={COLOR_PRIMARY}
          radius={[5, 5, 0, 0]}
          barSize={12}
        />
        <Bar
          dataKey="prototypes"
          name="Prototypes validés"
          fill={COLOR_ACCENT}
          radius={[5, 5, 0, 0]}
          barSize={12}
        />
      </BarChart>
    </ResponsiveContainer>
  );
}

/** 4. Répartition par genre (Donut moderne avec centre épuré) */
export function GenreChart({ data }: { data: ParGenreItem[] }) {
  const total = data.reduce((acc, curr) => acc + curr.total, 0);

  return (
    <ResponsiveContainer width="100%" height={290}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="48%"
          innerRadius={65}
          outerRadius={95}
          paddingAngle={4}
          dataKey="total"
          nameKey="genre"
          cornerRadius={4}
        >
          {data.map((_, index) => (
            <Cell
              key={`cell-${index}`}
              fill={GENRE_COLORS[index % GENRE_COLORS.length]}
            />
          ))}
        </Pie>
        <Tooltip content={<CustomTooltip />} />
        <Legend
          verticalAlign="bottom"
          iconType="circle"
          iconSize={8}
          wrapperStyle={{ fontSize: 11, color: "#71717a", paddingTop: 8 }}
        />
        {/* Total au centre du Donut */}
        <text
          x="50%"
          y="46%"
          textAnchor="middle"
          dominantBaseline="middle"
          className="font-mono text-xl font-bold fill-zinc-900"
        >
          {total}
        </text>
        <text
          x="50%"
          y="54%"
          textAnchor="middle"
          dominantBaseline="middle"
          className="text-[10px] font-medium fill-zinc-400 uppercase tracking-wider"
        >
          Porteurs
        </text>
      </PieChart>
    </ResponsiveContainer>
  );
}
