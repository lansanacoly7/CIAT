import type { ReactNode } from "react";

interface KpiCardProps {
  label: string;
  value: number;
  suffix?: string;
  subtext?: string;
  badge?: ReactNode;
}

export function KpiCard({
  label,
  value,
  suffix = "",
  subtext,
  badge,
}: KpiCardProps) {
  const formattedValue =
    typeof value === "number"
      ? value.toLocaleString("fr-FR", {
          maximumFractionDigits: 1,
        })
      : value;

  return (
    <div className="group relative min-w-0 overflow-hidden rounded-xl border border-zinc-200/80 bg-white p-3.5 shadow-[0_1px_3px_rgba(0,0,0,0.02),0_4px_12px_rgba(33,19,13,0.02)] transition-all duration-200 ease-out hover:-translate-y-0.5 hover:border-[#c99a69]/70 hover:shadow-[0_6px_16px_rgba(33,19,13,0.06)]">
      {/* Liseré supérieur subtil au survol */}
      <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-[#602d10] via-[#c99a69] to-[#602d10] opacity-0 transition-opacity duration-200 group-hover:opacity-100" />

      {/* Rangée supérieure épurée : Libellé institutionnel */}
      <div className="flex items-center justify-between gap-1.5">
        <span
          className="truncate text-[10px] font-bold uppercase tracking-wider text-zinc-500 transition-colors group-hover:text-[#602d10]"
          title={label}
        >
          {label}
        </span>
        {badge && <div className="shrink-0 scale-90 origin-right">{badge}</div>}
      </div>

      {/* Rangée principale : Valeur numérique nette */}
      <div className="mt-1 flex items-baseline gap-0.5">
        <span className="font-mono text-2xl font-black tracking-tight text-[#21130d] tabular-nums leading-tight">
          {formattedValue}
        </span>
        {suffix && (
          <span className="text-xs font-semibold text-zinc-500">
            {suffix}
          </span>
        )}
      </div>

      {/* Rangée basse : Sous-texte descriptif sobre */}
      {subtext && (
        <p className="mt-1 truncate text-[11px] text-zinc-400" title={subtext}>
          {subtext}
        </p>
      )}
    </div>
  );
}
