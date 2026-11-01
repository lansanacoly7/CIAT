"use client";

import { useMemo } from "react";
import {
  Users,
  CheckCircle2,
  Award,
  Coins,
  ChevronRight,
  ArrowUpRight,
} from "lucide-react";
import { formatNumber, formatPercent } from "@/lib/format";
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
  // Formatage du montant financé en Millions FCFA
  const formattedFonds = useMemo(() => {
    const num = totalFinance || 472000000;
    if (num >= 1_000_000) {
      const millions = (num / 1_000_000).toFixed(0);
      return { val: `${millions} M`, unit: "FCFA" };
    }
    return { val: formatNumber(num), unit: "FCFA" };
  }, [totalFinance]);

  // Taux de conversion calculés
  const tauxRetenus = useMemo(() => {
    if (!indicateurs.idees_recues) return 0;
    return (indicateurs.projets_selectionnes / indicateurs.idees_recues) * 100;
  }, [indicateurs]);

  const tauxPrototypes = useMemo(() => {
    if (!indicateurs.idees_recues) return 0;
    return (indicateurs.prototypes / indicateurs.idees_recues) * 100;
  }, [indicateurs]);

  const cards = [
    {
      id: "idees_recues",
      label: "Idées reçues",
      value: formatNumber(indicateurs.idees_recues),
      subtext: "Soumissions initiales",
      icon: Users,
      delta: "+12 %",
      accentColor: "#8C5E2D",
      onClick: () => {
        onNavigateTab?.("projets");
      },
    },
    {
      id: "projets_retenus",
      label: "Projets retenus",
      value: formatNumber(indicateurs.projets_selectionnes),
      subtext: "Sélectionnés par le comité",
      icon: CheckCircle2,
      delta: `${formatPercent(tauxRetenus)} du flux`,
      accentColor: "#612D10",
      onClick: () => {
        onFilterStatut?.("selectionne");
        onNavigateTab?.("projets");
      },
    },
    {
      id: "prototypes_valides",
      label: "Prototypes validés",
      value: formatNumber(indicateurs.prototypes),
      subtext: "Maturation technique certifiée",
      icon: Award,
      delta: `${formatPercent(tauxPrototypes)} certifiés`,
      accentColor: "#C99A68",
      onClick: () => {
        onFilterStatut?.("prototype");
        onNavigateTab?.("projets");
      },
    },
    {
      id: "montant_finance",
      label: "Montant financé",
      value: formattedFonds.val,
      unit: formattedFonds.unit,
      subtext: "Engagements & guichets",
      icon: Coins,
      delta: "+24 %",
      accentColor: "#5A7D65",
      onClick: () => {
        onNavigateTab?.("financements");
      },
    },
  ];

  return (
    <section aria-labelledby="kpi-grid-heading" data-testid="kpi-grid" className="space-y-2">
      <h2 id="kpi-grid-heading" className="sr-only">
        Indicateurs clés de performance
      </h2>

      {/* Rangée unique de 4 KPI décisionnels */}
      <div
        data-testid="kpi-cards-container"
        className="grid grid-cols-2 lg:grid-cols-4 gap-2.5"
      >
        {cards.map((card) => {
          const Icon = card.icon;

          return (
            <div
              key={card.id}
              onClick={card.onClick}
              title={card.subtext}
              className="group flex flex-col rounded-lg border border-[rgba(60,35,20,0.10)] bg-white px-3 py-2.5 transition hover:border-[#C99A68] cursor-pointer"
            >
              {/* Ligne 1 : Icône + Label + Voir détails */}
              <div className="flex items-center justify-between gap-1.5">
                <div className="flex items-center gap-1.5 min-w-0">
                  <Icon className="h-3.5 w-3.5 shrink-0 text-[#8C5E2D]" />
                  <span className="truncate text-[11px] font-medium text-[#5A4B42]">
                    {card.label}
                  </span>
                </div>
                <ChevronRight className="h-3 w-3 text-[#5A4B42] opacity-0 group-hover:opacity-70 transition-opacity shrink-0" />
              </div>

              {/* Ligne 2 : Valeur + Unité + Delta */}
              <div className="mt-1.5 flex items-baseline justify-between gap-2 flex-wrap">
                <div className="flex items-baseline gap-1">
                  <span className="font-sans text-lg sm:text-xl font-semibold text-[#21130D] tabular-nums leading-none">
                    {card.value}
                  </span>
                  {card.unit && (
                    <span className="text-[11px] font-medium text-[#5A4B42]">
                      {card.unit}
                    </span>
                  )}
                </div>

                <span className="inline-flex items-center gap-0.5 text-[10px] font-medium text-[#8C5E2D] tabular-nums">
                  <ArrowUpRight className="h-2.5 w-2.5" />
                  <span>{card.delta}</span>
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Petite barre de conversion discrète sous les KPI */}
      <div className="hidden sm:flex items-center justify-between gap-2 border-t border-[rgba(60,35,20,0.06)] px-1 pt-1.5 text-[11px] text-[#5A4B42]">
        <div className="flex items-center gap-2 font-medium">
          <span className="text-[#8C5E2D] font-semibold">Tunnel de conversion :</span>
          <span>{formatNumber(indicateurs.idees_recues)} idées</span>
          <span className="text-[#8C5E2D]">→</span>
          <span>{formatNumber(indicateurs.projets_selectionnes)} retenus ({formatPercent(tauxRetenus)})</span>
          <span className="text-[#8C5E2D]">→</span>
          <span>{formatNumber(indicateurs.prototypes)} prototypes ({formatPercent(tauxPrototypes)})</span>
        </div>
        <span className="font-semibold text-[#21130D] tabular-nums">
          {formattedFonds.val} {formattedFonds.unit} mobilisés
        </span>
      </div>
    </section>
  );
}
