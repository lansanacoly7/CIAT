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

// Palette officielle CIAT harmonieuse et contrastée
const COLOR_PRIMARY = "#602d10";   // Brun foncé CIAT
const COLOR_CARAMEL = "#8c4b24";   // Caramel / Terracotta
const COLOR_ACCENT = "#c99a69";    // Ocre Doré / Ambre
const COLOR_MUTED = "#a16d47";     // Bronze doux
const COLOR_SAND = "#dec8b3";      // Sable doux pour les totaux
const COLOR_BORDER = "#ebdcc9";    // Lignes de repère douces

// Couleurs différenciées pour les domaines
const DOMAINE_PALETTE = [
  "#602d10", // TIC & IA
  "#7c3d18", // Agriculture
  "#8c4b24", // Énergie
  "#a16d47", // Santé
  "#b87333", // Mécanique
  "#c99a69", // Insertion
];

// Couleurs pour la répartition par genre
const GENRE_PALETTE = [
  COLOR_PRIMARY, // Hommes
  COLOR_ACCENT,  // Femmes
  COLOR_MUTED,   // Équipes mixtes
];

interface ChartCardProps {
  title: string;
  description?: string;
  badge?: string;
  children: React.ReactNode;
}

export function ChartCard({ title, description, badge, children }: ChartCardProps) {
  return (
    <div className="group flex flex-col rounded-2xl border border-zinc-200/80 bg-white p-5 shadow-[0_1px_3px_rgba(0,0,0,0.02),0_4px_16px_rgba(33,19,13,0.02)] transition-all duration-300 hover:border-[#c99a69]/60 hover:shadow-[0_8px_24px_rgba(33,19,13,0.06)]">
      {/* En-tête de la carte graphique */}
      <div className="mb-3.5 flex items-start justify-between gap-3 border-b border-zinc-100/90 pb-3">
        <div>
          <h3 className="text-sm font-extrabold tracking-tight text-[#1c120c] transition-colors group-hover:text-[#602d10]">
            {title}
          </h3>
          {description && (
            <p className="mt-0.5 text-xs text-zinc-500">{description}</p>
          )}
        </div>
        {badge && (
          <span className="shrink-0 rounded-full border border-[#e6d8c6] bg-[#f8f1e7] px-2.5 py-0.5 text-[10px] font-bold text-[#602d10]">
            {badge}
          </span>
        )}
      </div>

      {/* Conteneur de visualisation */}
      <div className="h-[250px] w-full flex-1">{children}</div>
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

/** Tooltip flottant style glassmorphism élégant */
function CustomTooltip({ active, payload, label }: CustomTooltipProps) {
  if (active && payload && payload.length) {
    return (
      <div className="rounded-xl border border-[#e6d8c6] bg-white/95 px-3 py-2 text-xs shadow-lg backdrop-blur-md">
        <div className="font-bold text-[#21130d] border-b border-zinc-100 pb-1 mb-1.5">
          {label}
        </div>
        <div className="space-y-1">
          {payload.map((entry: TooltipPayloadItem, index: number) => (
            <div key={`item-${index}`} className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-1.5">
                <span
                  className="h-2 w-2 rounded-full ring-2 ring-white"
                  style={{ backgroundColor: entry.color || entry.fill }}
                />
                <span className="text-zinc-600 font-medium">{entry.name || "Total"}</span>
              </div>
              <span className="font-mono font-black text-[#602d10] tabular-nums">
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

/** 1. Graphique d'évolution temporelle : courbe fluide et halo lumineux */
export function EvolutionChart({ data }: { data: EvolutionItem[] }) {
  return (
    <ResponsiveContainer width="100%" height={250}>
      <AreaChart data={data} margin={{ top: 15, right: 15, left: -22, bottom: 0 }}>
        <defs>
          <linearGradient id="areaGradientCIAT" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={COLOR_CARAMEL} stopOpacity={0.35} />
            <stop offset="50%" stopColor={COLOR_ACCENT} stopOpacity={0.12} />
            <stop offset="100%" stopColor="#fdfaf6" stopOpacity="0.0" />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={COLOR_BORDER} opacity={0.6} />
        <XAxis
          dataKey="mois"
          tickLine={false}
          axisLine={{ stroke: COLOR_BORDER }}
          tick={{ fill: "#8c7e75", fontSize: 11, fontWeight: 500 }}
        />
        <YAxis
          tickLine={false}
          axisLine={false}
          tick={{ fill: "#8c7e75", fontSize: 11 }}
        />
        <Tooltip content={<CustomTooltip />} />
        <Area
          type="monotone"
          dataKey="total"
          name="Projets cumulés"
          stroke={COLOR_CARAMEL}
          strokeWidth={2.5}
          activeDot={{
            r: 5,
            fill: "#ffffff",
            stroke: COLOR_PRIMARY,
            strokeWidth: 2.5,
          }}
          fill="url(#areaGradientCIAT)"
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}

/** 2. Projets par domaine : Barres horizontales raffinées avec palette progressive */
export function DomaineChart({ data }: { data: ParDomaineItem[] }) {
  return (
    <ResponsiveContainer width="100%" height={250}>
      <BarChart
        data={data}
        layout="vertical"
        margin={{ top: 8, right: 30, left: 10, bottom: 0 }}
      >
        <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke={COLOR_BORDER} opacity={0.6} />
        <XAxis
          type="number"
          tickLine={false}
          axisLine={{ stroke: COLOR_BORDER }}
          tick={{ fill: "#8c7e75", fontSize: 11 }}
        />
        <YAxis
          dataKey="domaine"
          type="category"
          tickLine={false}
          axisLine={false}
          tick={{ fill: "#3f1d0a", fontSize: 11, fontWeight: 600 }}
          width={90}
        />
        <Tooltip content={<CustomTooltip />} />
        <Bar
          dataKey="total"
          name="Projets enregistrés"
          radius={[0, 999, 999, 0]}
          barSize={12}
        >
          {data.map((_, index) => (
            <Cell
              key={`domaine-bar-${index}`}
              fill={DOMAINE_PALETTE[index % DOMAINE_PALETTE.length]}
            />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

/** 3. Comparaison cohortes : 3 barres fines arrondies avec légende nette */
export function CohorteChart({ data }: { data: ParCohorteItem[] }) {
  return (
    <ResponsiveContainer width="100%" height={250}>
      <BarChart
        data={data}
        margin={{ top: 12, right: 15, left: -22, bottom: 0 }}
        barGap={4}
      >
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={COLOR_BORDER} opacity={0.6} />
        <XAxis
          dataKey="cohorte"
          tickLine={false}
          axisLine={{ stroke: COLOR_BORDER }}
          tick={{ fill: "#8c7e75", fontSize: 11, fontWeight: 500 }}
        />
        <YAxis
          tickLine={false}
          axisLine={false}
          tick={{ fill: "#8c7e75", fontSize: 11 }}
        />
        <Tooltip content={<CustomTooltip />} />
        <Legend
          verticalAlign="top"
          align="right"
          iconType="circle"
          iconSize={7}
          wrapperStyle={{ paddingBottom: 10, fontSize: 11, color: "#602d10", fontWeight: 600 }}
        />
        <Bar
          dataKey="total"
          name="Idées soumises"
          fill={COLOR_SAND}
          radius={[4, 4, 0, 0]}
          barSize={10}
        />
        <Bar
          dataKey="selectionnes"
          name="Projets retenus"
          fill={COLOR_PRIMARY}
          radius={[4, 4, 0, 0]}
          barSize={10}
        />
        <Bar
          dataKey="prototypes"
          name="Prototypes validés"
          fill={COLOR_ACCENT}
          radius={[4, 4, 0, 0]}
          barSize={10}
        />
      </BarChart>
    </ResponsiveContainer>
  );
}

/** 4. Répartition par genre : Donut fin et aéré avec total central */
export function GenreChart({ data }: { data: ParGenreItem[] }) {
  const total = data.reduce((acc, curr) => acc + curr.total, 0);

  return (
    <ResponsiveContainer width="100%" height={250}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="46%"
          innerRadius={64}
          outerRadius={92}
          paddingAngle={4}
          dataKey="total"
          nameKey="genre"
          cornerRadius={5}
        >
          {data.map((_, index) => (
            <Cell
              key={`genre-cell-${index}`}
              fill={GENRE_PALETTE[index % GENRE_PALETTE.length]}
              stroke="#ffffff"
              strokeWidth={2}
            />
          ))}
        </Pie>
        <Tooltip content={<CustomTooltip />} />
        <Legend
          verticalAlign="bottom"
          iconType="circle"
          iconSize={8}
          wrapperStyle={{ fontSize: 11, color: "#602d10", fontWeight: 600, paddingTop: 6 }}
        />
        {/* Total et label au centre du Donut */}
        <text
          x="50%"
          y="44%"
          textAnchor="middle"
          dominantBaseline="middle"
          className="font-mono text-2xl font-black fill-[#1c120c]"
        >
          {total}
        </text>
        <text
          x="50%"
          y="53%"
          textAnchor="middle"
          dominantBaseline="middle"
          className="text-[10px] font-bold fill-[#8c786a] uppercase tracking-widest"
        >
          Porteurs
        </text>
      </PieChart>
    </ResponsiveContainer>
  );
}
