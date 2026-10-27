"use client";

import { useEffect, useState } from "react";
import { formatNumber } from "@/lib/format";

interface FinancesCardProps {
  totalFinance?: number;
  totalDecaisse?: number;
  partenariatsActifs?: number;
  onNavigateTab?: (tab: "financements") => void;
}

export function FinancesCard({
  totalFinance = 472000000,
  totalDecaisse = 402000000,
  partenariatsActifs = 33,
  onNavigateTab,
}: FinancesCardProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const totalMillions = Math.round(totalFinance / 1000000);
  const decaisseMillions = Math.round(totalDecaisse / 1000000);
  const decaissePct = totalFinance > 0 ? Math.round((totalDecaisse / totalFinance) * 100) : 85;

  return (
    <section
      aria-labelledby="finances-heading"
      className="rounded-xl border border-[rgba(60,35,20,0.08)] bg-white px-3 sm:px-4 py-2.5 transition hover:shadow-[0_2px_8px_rgba(60,35,20,0.04)] sm:max-h-[80px] overflow-hidden"
    >
      <h2 id="finances-heading" className="sr-only">
        Synthèse financière et partenariats
      </h2>

      <div className="overflow-x-auto no-scrollbar -mx-1 px-1 h-full">
        <div className="grid grid-cols-3 divide-x divide-[rgba(60,35,20,0.08)] h-full items-center min-w-[460px] sm:min-w-0">
          {/* Cellule 1 : Fonds mobilisés */}
          <div className="px-3 sm:px-4 flex flex-col justify-center">
            <div className="flex items-baseline gap-1.5 flex-wrap">
              <span className="font-sans text-[20px] sm:text-[24px] font-semibold leading-none tracking-[-0.02em] text-[#21130D] tabular-nums">
                {formatNumber(totalMillions)} M
              </span>
              <span className="text-[12px] font-medium text-[#5A4B42]">FCFA</span>
            </div>
            <span className="text-[12px] text-[#5A4B42] truncate mt-0.5">
              mobilisés au total
            </span>
          </div>

          {/* Cellule 2 : Fonds décaissés + fine barre 4px */}
          <div className="px-3 sm:px-4 flex flex-col justify-center">
            <div className="flex items-baseline justify-between gap-2 flex-wrap">
              <div className="flex items-baseline gap-1.5">
                <span className="font-sans text-[20px] sm:text-[24px] font-semibold leading-none tracking-[-0.02em] text-[#21130D] tabular-nums">
                  {formatNumber(decaisseMillions)} M
                </span>
                <span className="text-[12px] font-medium text-[#5A4B42]">FCFA</span>
              </div>
              <span className="text-[12px] font-semibold text-[#8C5E2D] tabular-nums">
                {decaissePct} % décaissés
              </span>
            </div>
            <div className="mt-1 h-1 w-full rounded-full bg-[rgba(60,35,20,0.06)] overflow-hidden">
              <div
                className="h-full rounded-full bg-[#C99A68] transition-all duration-700 ease-out motion-reduce:duration-0"
                style={{
                  width: mounted ? `${decaissePct}%` : "0%",
                }}
              />
            </div>
          </div>

          {/* Cellule 3 : Partenariats actifs */}
          <div className="px-3 sm:px-4 flex items-center justify-between">
            <div className="flex flex-col justify-center">
              <div className="flex items-baseline gap-1.5">
                <span className="font-sans text-[20px] sm:text-[24px] font-semibold leading-none tracking-[-0.02em] text-[#21130D] tabular-nums">
                  {formatNumber(partenariatsActifs)}
                </span>
              </div>
              <span className="text-[12px] text-[#5A4B42] truncate mt-0.5">
                partenariats actifs
              </span>
            </div>

            {onNavigateTab && (
              <button
                type="button"
                onClick={() => onNavigateTab("financements")}
                className="text-[12px] font-medium text-[#C99A68] hover:text-[#21130D] transition hidden sm:inline-flex items-center gap-0.5"
              >
                <span>Détails</span>
                <span aria-hidden="true">&rarr;</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
