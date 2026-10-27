"use client";

import { ChevronRight } from "lucide-react";

export interface WatchCounts {
  retards: number;
  conventions: number;
  dossiers: number;
}

interface WatchZoneProps {
  counts?: WatchCounts;
  onFilterStatut?: (statut: string) => void;
  onNavigateTab?: (tab: "projets" | "financements") => void;
}

export function WatchZone({
  counts = { retards: 8, conventions: 2, dossiers: 5 },
  onFilterStatut,
  onNavigateTab,
}: WatchZoneProps) {
  const alerts = [
    {
      id: "jalons_retard",
      title: "Jalons en retard",
      count: String(counts.retards),
      phrase: `${counts.retards} jalons d'incubation ont dépassé leur échéance prévisionnelle`,
      actionText: "Filtrer les projets en retard",
      borderLeftClass: "border-l-[#B85D43]", // Terracotta 3px
      onClick: () => {
        if (onFilterStatut) onFilterStatut("incube");
      },
    },
    {
      id: "conventions_attente",
      title: "Conventions en attente",
      count: String(counts.conventions),
      phrase: `${counts.conventions} accords de partenariat sont actuellement en cours de négociation`,
      actionText: "Consulter les partenariats",
      borderLeftClass: "border-l-[#C99A68]", // Ocre 3px
      onClick: () => {
        if (onNavigateTab) onNavigateTab("financements");
      },
    },
    {
      id: "dossiers_jury",
      title: "Dossiers à évaluer",
      count: String(counts.dossiers),
      phrase: `${counts.dossiers} candidatures déposées attendent la délibération du comité`,
      actionText: "Consulter les dossiers déposés",
      borderLeftClass: "border-l-[#4A6B82]", // Bleu ardoise 3px
      onClick: () => {
        if (onFilterStatut) onFilterStatut("depose");
      },
    },
  ];

  return (
    <section aria-labelledby="watch-zone-heading" className="space-y-2">
      <div className="flex items-center justify-between gap-2">
        <h2
          id="watch-zone-heading"
          className="text-[12px] font-medium uppercase tracking-[0.05em] text-[#5A4B42]"
        >
          Points d&apos;attention · À surveiller
        </h2>
        <span className="hidden sm:inline text-[11px] text-[#5A4B42]">
          Actualisation en continu
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {alerts.map((alert) => (
          <div
            key={alert.id}
            className={`flex h-[110px] flex-col justify-between rounded-xl border border-[rgba(60,35,20,0.08)] bg-white p-3.5 pl-4 border-l-[3px] ${alert.borderLeftClass} shadow-[0_1px_2px_rgba(60,35,20,0.04),0_8px_24px_rgba(60,35,20,0.05)] transition hover:shadow-[0_2px_8px_rgba(60,35,20,0.08)]`}
          >
            {/* Ligne 1 : Titre 14px à gauche + Chiffre 28px à droite sur la MÊME ligne */}
            <div>
              <div className="flex items-baseline justify-between gap-2">
                <span
                  title={alert.title}
                  className="truncate text-[14px] font-semibold text-[#21130D]"
                >
                  {alert.title}
                </span>
                <span className="shrink-0 font-sans text-[28px] font-semibold leading-none tracking-[-0.02em] text-[#21130D] tabular-nums">
                  {alert.count}
                </span>
              </div>

              {/* Ligne 2 : Phrase 13px sur 2 lignes max */}
              <p
                title={alert.phrase}
                className="mt-1 line-clamp-2 text-[13px] leading-tight text-[#5A4B42]"
              >
                {alert.phrase}
              </p>
            </div>

            {/* Ligne 3 : Lien d'action en bas */}
            <div className="pt-1">
              <button
                type="button"
                onClick={alert.onClick}
                className="inline-flex items-center gap-1 text-[12px] font-medium text-[#21130D] transition hover:text-[#C99A68]"
              >
                <span>{alert.actionText}</span>
                <ChevronRight className="h-3.5 w-3.5 stroke-[2]" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
