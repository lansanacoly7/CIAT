"use client";

import { useMemo } from "react";
import { formatNumber } from "@/lib/format";
import type { IndicateursGlobaux } from "../types";

interface KpiGridProps {
  indicateurs: IndicateursGlobaux;
  totalFinance?: number;
  partenariatsActifs?: number;
  onFilterStatut?: (statut: string) => void;
  onNavigateTab?: (tab: "projets" | "financements") => void;
}

export function KpiGrid({
  indicateurs,
  totalFinance = 472000000,
  onFilterStatut,
  onNavigateTab,
}: KpiGridProps) {
  const fonds = useMemo(() => {
    const num = totalFinance || 472000000;
    return num >= 1_000_000
      ? `${(num / 1_000_000).toFixed(0)} M FCFA`
      : `${formatNumber(num)} FCFA`;
  }, [totalFinance]);

  const cards = [
    {
      id: "idees_recues",
      label: "Idées reçues",
      value: formatNumber(indicateurs.idees_recues),
      onClick: () => onNavigateTab?.("projets"),
    },
    {
      id: "projets_retenus",
      label: "Projets retenus",
      value: formatNumber(indicateurs.projets_selectionnes),
      onClick: () => {
        onFilterStatut?.("selectionne");
        onNavigateTab?.("projets");
      },
    },
    {
      id: "prototypes_valides",
      label: "Prototypes validés",
      value: formatNumber(indicateurs.prototypes),
      onClick: () => {
        onFilterStatut?.("prototype");
        onNavigateTab?.("projets");
      },
    },
    {
      id: "montant_finance",
      label: "Montant financé",
      value: fonds,
      onClick: () => onNavigateTab?.("financements"),
    },
  ];

  return (
    <section aria-labelledby="kpi-grid-heading" data-testid="kpi-grid">
      <h2 id="kpi-grid-heading" className="sr-only">
        Indicateurs clés de performance
      </h2>

      <div
        data-testid="kpi-cards-container"
        className="grid grid-cols-2 lg:grid-cols-4 gap-3"
      >
        {cards.map((card) => (
          <button
            key={card.id}
            type="button"
            onClick={card.onClick}
            className="rounded-lg border border-[rgba(60,35,20,0.10)] bg-white px-4 py-3 text-left transition hover:border-[#C99A68] cursor-pointer"
          >
            <div className="text-xs text-[#5A4B42]">{card.label}</div>
            <div className="mt-1 text-xl font-semibold text-[#21130D] tabular-nums leading-tight">
              {card.value}
            </div>
          </button>
        ))}
      </div>
    </section>
  );
}
