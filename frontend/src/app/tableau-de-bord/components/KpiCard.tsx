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
    <div className="group relative min-w-0 overflow-hidden rounded-2xl border border-zinc-200/90 bg-white p-5 shadow-[0_1px_3px_rgba(0,0,0,0.02),0_6px_16px_rgba(33,19,13,0.03)] transition-all duration-300 ease-out hover:-translate-y-1 hover:border-[#c99a69]/60 hover:shadow-[0_10px_25px_rgba(33,19,13,0.08)]">
      {/* Liseré supérieur subtil au survol (animation discrète) */}
      <div className="absolute inset-x-0 top-0 h-[2.5px] bg-gradient-to-r from-[#602d10] via-[#c99a69] to-[#602d10] opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

      {/* Rangée supérieure : Libellé en petites capitales + Icône thématique */}
      <div className="flex items-start justify-between gap-2">
        <span
          className="truncate text-[11px] font-semibold uppercase tracking-wider text-zinc-500 transition-colors group-hover:text-[#602d10]"
          title={label}
        >
          {label}
        </span>
        {icon && (
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#f8f1e7] text-[#602d10] transition-colors duration-200 group-hover:bg-[#602d10] group-hover:text-white">
            {icon}
          </div>
        )}
      </div>

      {/* Valeur numérique grand format + suffixe + trend */}
      <div className="mt-3 flex items-baseline gap-2">
        <span className="font-mono text-3xl font-extrabold tracking-tight text-zinc-900 tabular-nums">
          {formattedValue}
        </span>
        {suffix && (
          <span className="text-base font-semibold text-zinc-500">
            {suffix}
          </span>
        )}
        {trend && (
          <span className="ml-auto inline-flex items-center rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-medium text-emerald-700">
            {trend}
          </span>
        )}
      </div>

      {/* Rangée basse : badge ou sous-texte explicatif */}
      <div className="mt-2.5 flex items-center justify-between gap-2 border-t border-zinc-100 pt-2.5">
        {subtext ? (
          <p className="truncate text-xs text-zinc-500" title={subtext}>
            {subtext}
          </p>
        ) : (
          <span />
        )}
        {badge && <div className="shrink-0">{badge}</div>}
      </div>
    </div>
  );
}
