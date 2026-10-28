"use client";

import { useMemo } from "react";
import {
  Users,
  FileText,
  CheckCircle2,
  Rocket,
  Award,
  TrendingUp,
  Coins,
  Handshake,
  ChevronRight,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react";
import { formatNumber, formatPercent } from "@/lib/format";
import type { IndicateursGlobaux } from "../types";

interface KpiItem {
  id: string;
  label: string;
  value: string;
  unit?: string;
  subtext: string;
  icon: React.ComponentType<{ className?: string }>;
  delta?: { value: string; isPositive: boolean };
  isSpecialTaux?: boolean;
  tauxValue?: number;
  borderBottomClass?: string;
  onClick?: () => void;
}

interface KpiGridProps {
  indicateurs: IndicateursGlobaux;
  totalFinance?: number;
  partenariatsActifs?: number;
  previousIndicateurs?: IndicateursGlobaux | null;
  onFilterStatut?: (statut: string) => void;
  onNavigateTab?: (tab: "projets" | "financements") => void;
}

export function KpiGrid({
  indicateurs,
  totalFinance = 472000000,
  partenariatsActifs = 33,
  previousIndicateurs = null,
  onFilterStatut,
  onNavigateTab,
}: KpiGridProps) {
  // Formatage spécifique pour Fonds mobilisés : "472 M" + "FCFA"
  const formattedFonds = useMemo(() => {
    const num = totalFinance || 472000000;
    if (num >= 1_000_000) {
      const millions = (num / 1_000_000).toFixed(0);
      return { val: `${millions} M`, unit: "FCFA" };
    }
    return { val: formatNumber(num), unit: "FCFA" };
  }, [totalFinance]);

  const cards: KpiItem[] = useMemo(() => {
    const calcDelta = (current: number, prev?: number, fallback = "+12 %") => {
      if (!prev || prev <= 0) return { value: fallback, isPositive: true };
      const diff = ((current - prev) / prev) * 100;
      return {
        value: `${diff >= 0 ? "+" : ""}${diff.toFixed(1).replace(".", ",")} %`,
        isPositive: diff >= 0,
      };
    };

    const scrollToSection = (id: string) => {
      if (typeof document !== "undefined") {
        const el = document.getElementById(id);
        if (el) el.scrollIntoView({ behavior: "smooth" });
      }
    };

    return [
      {
        id: "idees_recues",
        label: "Idées reçues",
        value: formatNumber(indicateurs.idees_recues),
        subtext: "Total des soumissions initiales",
        icon: Users,
        delta: calcDelta(
          indicateurs.idees_recues,
          previousIndicateurs?.idees_recues,
          "+12%"
        ),
        borderBottomClass: "border-b-[#8C5E2D]",
        onClick: () => scrollToSection("charts-heading"),
      },
      {
        id: "dossiers_deposes",
        label: "Dossiers déposés",
        value: formatNumber(indicateurs.dossiers_deposes),
        subtext: "Candidatures complètes reçues",
        icon: FileText,
        delta: calcDelta(
          indicateurs.dossiers_deposes,
          previousIndicateurs?.dossiers_deposes,
          "+8%"
        ),
        borderBottomClass: "border-b-[#612D10]",
        onClick: () => {
          if (onFilterStatut) onFilterStatut("depose");
          scrollToSection("registre-table");
        },
      },
      {
        id: "projets_selectionnes",
        label: "Projets sélectionnés",
        value: formatNumber(indicateurs.projets_selectionnes),
        subtext: "Avis favorable du comité",
        icon: CheckCircle2,
        delta: calcDelta(
          indicateurs.projets_selectionnes,
          previousIndicateurs?.projets_selectionnes,
          "+15%"
        ),
        borderBottomClass: "border-b-[#2E7D32]",
        onClick: () => {
          if (onFilterStatut) onFilterStatut("selectionne");
          scrollToSection("registre-table");
        },
      },
      {
        id: "projets_incubes",
        label: "Projets incubés",
        value: formatNumber(indicateurs.projets_incubes),
        subtext: "Parcours actif au sein du CIAT",
        icon: Rocket,
        delta: calcDelta(
          indicateurs.projets_incubes,
          previousIndicateurs?.projets_incubes,
          "+5%"
        ),
        borderBottomClass: "border-b-[#8C5E2D]",
        onClick: () => {
          if (onFilterStatut) onFilterStatut("incube");
          scrollToSection("registre-table");
        },
      },
      {
        id: "prototypes",
        label: "Prototypes validés",
        value: formatNumber(indicateurs.prototypes),
        subtext: "Maturation technique certifiée",
        icon: Award,
        delta: calcDelta(
          indicateurs.prototypes,
          previousIndicateurs?.prototypes,
          "+10%"
        ),
        borderBottomClass: "border-b-[#C99A68]",
        onClick: () => {
          if (onFilterStatut) onFilterStatut("prototype");
          scrollToSection("registre-table");
        },
      },
      {
        id: "taux_selection",
        label: "Taux de sélection",
        value: formatPercent(indicateurs.taux_selection),
        subtext: "Ratio sélection / candidatures",
        icon: TrendingUp,
        isSpecialTaux: true,
        tauxValue: indicateurs.taux_selection || 0,
        delta: { value: "+3,2%", isPositive: true },
        borderBottomClass: "border-b-[#B85D43]",
        onClick: () => scrollToSection("charts-heading"),
      },
      {
        id: "financements",
        label: "Fonds mobilisés",
        value: formattedFonds.val,
        unit: formattedFonds.unit,
        subtext: "Subventions & guichets partenaires",
        icon: Coins,
        delta: { value: "+24%", isPositive: true },
        borderBottomClass: "border-b-[#8C5E2D]",
        onClick: () => {
          if (onNavigateTab) onNavigateTab("financements");
        },
      },
      {
        id: "partenariats",
        label: "Partenariats actifs",
        value: formatNumber(partenariatsActifs),
        subtext: "Conventions & accords en cours",
        icon: Handshake,
        delta: { value: "+18%", isPositive: true },
        borderBottomClass: "border-b-[#4A6B82]",
        onClick: () => {
          if (onNavigateTab) onNavigateTab("financements");
        },
      },
    ];
  }, [
    indicateurs,
    formattedFonds,
    partenariatsActifs,
    previousIndicateurs,
    onFilterStatut,
    onNavigateTab,
  ]);

  return (
    <section aria-labelledby="kpi-grid-heading" data-testid="kpi-grid">
      <h2 id="kpi-grid-heading" className="sr-only">
        Indicateurs clés de performance CIAT
      </h2>

      {/* Grille de 8 cartes individuelles selon le design officiel avec border-bottom */}
      <div
        data-testid="kpi-cards-container"
        className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4"
      >
        {cards.map((card) => {
          const Icon = card.icon;

          return (
            <div
              key={card.id}
              className={`relative flex flex-col justify-between rounded-2xl border border-[rgba(60,35,20,0.08)] bg-white p-5 shadow-[0_2px_8px_rgba(60,35,20,0.04)] transition-all hover:shadow-[0_4px_16px_rgba(60,35,20,0.08)] border-b-[4px] ${
                card.borderBottomClass || "border-b-[#8C5E2D]"
              } overflow-hidden`}
            >
              {/* Ligne 1 : Icône circulaire beige + Titre (gauche) | Voir détails > (droite) */}
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#F5ECE5] text-[#21130D]">
                    <Icon className="h-5 w-5 text-[#21130D]" />
                  </div>
                  <span
                    title={card.label}
                    className="truncate text-[15px] font-semibold text-[#21130D]"
                  >
                    {card.label}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={card.onClick}
                  className="inline-flex shrink-0 items-center gap-0.5 text-[12px] font-medium text-[#7A6B63] transition-colors hover:text-[#21130D] cursor-pointer group/btn"
                >
                  <span>Voir détails</span>
                  <ChevronRight className="h-3.5 w-3.5 transition-transform group-hover/btn:translate-x-0.5" />
                </button>
              </div>

              {/* Ligne 2 : Valeur 32px + Trend pill badge */}
              <div className="mt-4 flex items-baseline gap-2.5 flex-wrap">
                <div className="flex items-baseline gap-1">
                  <span
                    className={`font-sans text-[32px] font-bold leading-none tracking-[-0.02em] tabular-nums ${
                      card.isSpecialTaux ? "text-[#B85D43]" : "text-[#21130D]"
                    }`}
                  >
                    {card.value}
                  </span>
                  {card.unit && (
                    <span className="font-sans text-[14px] font-semibold text-[#7A6B63]">
                      {card.unit}
                    </span>
                  )}
                </div>

                {card.delta && (
                  <span
                    className={`inline-flex shrink-0 items-center gap-1 rounded-full px-2.5 py-0.5 text-[12px] font-semibold tabular-nums ${
                      card.delta.isPositive
                        ? "bg-[#EAF5EE] text-[#2E7D47]"
                        : "bg-rose-50 text-rose-700"
                    }`}
                  >
                    {card.delta.isPositive ? (
                      <ArrowUpRight className="h-3.5 w-3.5 stroke-[2.5]" />
                    ) : (
                      <ArrowDownRight className="h-3.5 w-3.5 stroke-[2.5]" />
                    )}
                    <span>{card.delta.value}</span>
                  </span>
                )}
              </div>

              {/* Barre de progression discrète pour le taux */}
              {card.isSpecialTaux && (
                <div className="mt-2.5 h-1 w-full overflow-hidden rounded-full bg-[rgba(60,35,20,0.08)]">
                  <div
                    className="h-full rounded-full bg-[#B85D43] transition-all duration-500"
                    style={{
                      width: `${Math.min(
                        100,
                        Math.max(0, card.tauxValue || 0)
                      )}%`,
                    }}
                  />
                </div>
              )}

              {/* Ligne 3 : Ligne de contexte explicative */}
              <div
                title={card.subtext}
                className="mt-2 truncate text-[13px] text-[#7A6B63]"
              >
                {card.subtext}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
