"use client";

import { useMemo } from "react";
import { ArrowUpRight, ArrowDownRight } from "lucide-react";
import { LineChart, Line, ResponsiveContainer } from "recharts";
import { formatNumber, formatPercent, formatCurrencyCompact } from "@/lib/format";
import type { IndicateursGlobaux } from "../types";

interface KpiItem {
  id: string;
  label: string;
  value: string;
  subtext: string;
  delta?: { value: string; isPositive: boolean };
  sparklineData?: { val: number }[];
  isHero?: boolean;
}

interface KpiGridProps {
  indicateurs: IndicateursGlobaux;
  totalFinance?: number;
  partenariatsActifs?: number;
  previousIndicateurs?: IndicateursGlobaux | null;
}

export function KpiGrid({
  indicateurs,
  totalFinance = 472000000,
  partenariatsActifs = 33,
  previousIndicateurs = null,
}: KpiGridProps) {
  // Construction des 8 cartes KPI (4 colonnes x 2 lignes)
  const cards: KpiItem[] = useMemo(() => {
    // Calcul de delta si données antérieures réelles disponibles
    const calcDelta = (current: number, prev?: number) => {
      if (!prev || prev <= 0) return undefined;
      const diff = ((current - prev) / prev) * 100;
      return {
        value: `${diff >= 0 ? "+" : ""}${diff.toFixed(1).replace(".", ",")} %`,
        isPositive: diff >= 0,
      };
    };

    return [
      {
        id: "idees_recues",
        label: "Idées reçues",
        value: formatNumber(indicateurs.idees_recues),
        subtext: "Soumissions initiales enregistrées",
        delta: previousIndicateurs
          ? calcDelta(indicateurs.idees_recues, previousIndicateurs.idees_recues)
          : undefined,
      },
      {
        id: "dossiers_deposes",
        label: "Dossiers déposés",
        value: formatNumber(indicateurs.dossiers_deposes),
        subtext: "Candidatures avec pièces requises",
        delta: previousIndicateurs
          ? calcDelta(indicateurs.dossiers_deposes, previousIndicateurs.dossiers_deposes)
          : undefined,
      },
      {
        id: "projets_selectionnes",
        label: "Projets sélectionnés",
        value: formatNumber(indicateurs.projets_selectionnes),
        subtext: "Avis favorable du comité",
        delta: previousIndicateurs
          ? calcDelta(indicateurs.projets_selectionnes, previousIndicateurs.projets_selectionnes)
          : undefined,
      },
      {
        id: "projets_incubes",
        label: "Projets incubés",
        value: formatNumber(indicateurs.projets_incubes),
        subtext: "Parcours d'incubation actif",
        delta: previousIndicateurs
          ? calcDelta(indicateurs.projets_incubes, previousIndicateurs.projets_incubes)
          : undefined,
      },
      {
        id: "prototypes",
        label: "Prototypes validés",
        value: formatNumber(indicateurs.prototypes),
        subtext: "Maturation technique certifiée",
        delta: previousIndicateurs
          ? calcDelta(indicateurs.prototypes, previousIndicateurs.prototypes)
          : undefined,
      },
      {
        id: "taux_selection",
        label: "Taux de sélection",
        value: formatPercent(indicateurs.taux_selection),
        subtext: "Sélectionnés / Dossiers déposés",
        isHero: true, // CARTE HÉROS FOCALE : brun profond & texte ivoire
      },
      {
        id: "financements",
        label: "Fonds mobilisés",
        value: formatCurrencyCompact(totalFinance),
        subtext: "Subventions & guichets partenaires",
      },
      {
        id: "partenariats",
        label: "Partenariats actifs",
        value: formatNumber(partenariatsActifs),
        subtext: "Conventions & accords en cours",
      },
    ];
  }, [indicateurs, totalFinance, partenariatsActifs, previousIndicateurs]);

  return (
    <section aria-labelledby="kpi-grid-heading" className="space-y-2">
      <h2 id="kpi-grid-heading" className="sr-only">
        Indicateurs clés de performance CIAT
      </h2>

      {/* Grille stricte : 4 colonnes x 2 lignes sur desktop (jamais 7 sur une ligne) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4">
        {cards.map((card) => {
          if (card.isHero) {
            // CARTE HÉROS FOCALE (fond brun profond, texte ivoire, accent cuivre)
            return (
              <div
                key={card.id}
                className="relative flex flex-col justify-between overflow-hidden rounded-2xl bg-[#21130D] p-5 text-[#FBF8F3] shadow-[0_1px_2px_rgba(60,35,20,0.1),0_8px_24px_rgba(60,35,20,0.15)] transition duration-200 hover:-translate-y-0.5 hover:shadow-[0_4px_12px_rgba(60,35,20,0.2)]"
              >
                {/* Ligne d'en-tête */}
                <div className="flex items-center justify-between">
                  <span className="text-[12px] font-semibold uppercase tracking-[0.06em] text-[#C99A68]">
                    {card.label}
                  </span>
                  <span className="inline-flex items-center rounded-full bg-[#C99A68]/20 px-2 py-0.5 text-[11px] font-medium text-[#EBD9C0]">
                    Point focal
                  </span>
                </div>

                {/* Valeur grand format en serif 44px */}
                <div className="my-2.5">
                  <div className="font-serif text-[44px] font-bold leading-none tracking-tight text-white tabular-nums">
                    {card.value}
                  </div>
                </div>

                {/* Sous-titre */}
                <div className="text-xs text-[#EBD9C0]/80">
                  {card.subtext}
                </div>
              </div>
            );
          }

          // CARTE STANDARD (blanc cassé, bordure 1px discrète, ombre 2 couches, rayon 16px)
          return (
            <div
              key={card.id}
              className="group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-[rgba(60,35,20,0.08)] bg-white p-5 shadow-[0_1px_2px_rgba(60,35,20,0.04),0_8px_24px_rgba(60,35,20,0.05)] transition duration-200 hover:-translate-y-0.5 hover:shadow-[0_2px_8px_rgba(60,35,20,0.08)]"
            >
              {/* Libellé 12px majuscules */}
              <div className="flex items-center justify-between">
                <span className="text-[12px] font-semibold uppercase tracking-[0.06em] text-[#8C7E74]">
                  {card.label}
                </span>

                {/* Delta vs période précédente si disponible */}
                {card.delta && (
                  <span
                    className={`inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-[11px] font-semibold tabular-nums ${
                      card.delta.isPositive
                        ? "bg-emerald-50 text-emerald-700"
                        : "bg-rose-50 text-rose-700"
                    }`}
                  >
                    {card.delta.isPositive ? (
                      <ArrowUpRight className="h-3 w-3" />
                    ) : (
                      <ArrowDownRight className="h-3 w-3" />
                    )}
                    <span>{card.delta.value}</span>
                  </span>
                )}
              </div>

              {/* Valeur en serif 44px tabular-nums */}
              <div className="my-2.5 flex items-baseline justify-between">
                <div className="font-serif text-[44px] font-bold leading-none tracking-tight text-[#21130D] tabular-nums">
                  {card.value}
                </div>

                {/* Sparkline discrète Recharts si présente */}
                {card.sparklineData && (
                  <div className="w-16 h-7">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={card.sparklineData}>
                        <Line
                          type="linear"
                          dataKey="val"
                          stroke="#C99A68"
                          strokeWidth={1.5}
                          dot={false}
                          isAnimationActive={false}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </div>

              {/* Sous-titre descriptif */}
              <div className="text-xs text-[#8C7E74]">
                {card.subtext}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
