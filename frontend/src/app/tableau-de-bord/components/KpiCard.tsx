import type { ReactNode } from "react";

interface KpiCardProps {
  label: string;
  value: number;
  suffix?: string;
  subtext?: string;
  badge?: ReactNode;
  icon?: ReactNode;
  trend?: string;
}

export function KpiCard({
  label,
  value,
  suffix = "",
  subtext,
  badge,
  icon,
  trend,
}: KpiCardProps) {
  const formattedValue =
    typeof value === "number"
      ? value.toLocaleString("fr-FR", {
          maximumFractionDigits: 1,
        })
      : value;

  return (
    <div className="group relative min-w-0 overflow-hidden rounded-xl border border-zinc-200/80 bg-white p-3 sm:p-3.5 shadow-[0_1px_3px_rgba(0,0,0,0.02),0_4px_12px_rgba(33,19,13,0.02)] transition-all duration-200 ease-out hover:-translate-y-0.5 hover:border-[#c99a69]/70 hover:shadow-[0_6px_16px_rgba(33,19,13,0.06)]">
      {/* Liseré supérieur subtil au survol (animation discrète) */}
      <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-[#602d10] via-[#c99a69] to-[#602d10] opacity-0 transition-opacity duration-200 group-hover:opacity-100" />

      {/* Rangée supérieure compacte : Libellé + Icône */}
      <div className="flex items-center justify-between gap-1.5">
        <span
          className="truncate text-[10px] font-bold uppercase tracking-wider text-zinc-500 transition-colors group-hover:text-[#602d10]"
          title={label}
        >
          {label}
        </span>
        {icon && (
          <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-[#f8f1e7] text-[#602d10] transition-colors duration-200 group-hover:bg-[#602d10] group-hover:text-white">
            {icon}
          </div>
        )}
      </div>

      {/* Rangée principale compacte : Valeur + Trend / Badge */}
      <div className="mt-1 flex items-baseline justify-between gap-1">
        <div className="flex items-baseline gap-0.5">
          <span className="font-mono text-2xl font-black tracking-tight text-[#21130d] tabular-nums leading-tight">
            {formattedValue}
          </span>
          {suffix && (
            <span className="text-xs font-semibold text-zinc-500">
              {suffix}
            </span>
          )}
        </div>

        {trend && (
          <span className="truncate rounded bg-emerald-50 px-1.5 py-0.5 text-[9px] font-semibold text-emerald-700">
            {trend}
          </span>
        )}
        {badge && <div className="shrink-0 scale-90 origin-right">{badge}</div>}
      </div>

      {/* Rangée basse : sous-texte épuré */}
      {subtext && (
        <p className="mt-1 truncate text-[10px] text-zinc-400" title={subtext}>
          {subtext}
        </p>
      )}
    </div>
  );
}
