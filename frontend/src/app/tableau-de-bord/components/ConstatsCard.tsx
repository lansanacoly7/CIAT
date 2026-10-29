"use client";

import { Info } from "lucide-react";
import type { ConstatCalcul } from "../types";

interface ConstatsCardProps {
  constats: ConstatCalcul[];
  chargement?: boolean;
}

export function ConstatsCard({ constats, chargement }: ConstatsCardProps) {
  if (chargement) {
    return (
      <div className="rounded-xl border border-[rgba(60,35,20,0.08)] bg-white p-4 shadow-2xs animate-pulse">
        <div className="h-4 w-32 bg-[#FBF8F3] rounded mb-3" />
        <div className="grid gap-3 sm:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 rounded-lg bg-[#FBF8F3]" />
          ))}
        </div>
      </div>
    );
  }

  // Maximum 3 constats affichés
  const topConstats = constats.slice(0, 3);

  return (
    <section
      aria-labelledby="constats-heading"
      className="rounded-xl border border-[rgba(60,35,20,0.08)] bg-white p-4 shadow-2xs"
    >
      <div className="flex items-center justify-between mb-3 border-b border-[rgba(60,35,20,0.06)] pb-2">
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-[#8C5E2D]" aria-hidden="true" />
          <h2 id="constats-heading" className="text-xs font-semibold uppercase tracking-[0.06em] text-[#5A4B42]">
            Constats clés
          </h2>
        </div>
        <span className="text-[11px] text-[#7A6B63] tabular-nums">
          {topConstats.length} constat{topConstats.length > 1 ? "s" : ""}
        </span>
      </div>

      {topConstats.length === 0 ? (
        <p className="text-xs text-[#7A6B63] py-2 text-center">
          Aucun constat significatif sur la sélection temporelle ou sectorielle active.
        </p>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {topConstats.map((c) => (
            <div
              key={c.id}
              className="group relative flex flex-col justify-between rounded-lg border border-[rgba(60,35,20,0.08)] bg-[#FBF8F3]/60 p-3 transition hover:bg-white hover:border-[#C99A68] hover:shadow-2xs"
            >
              <div className="flex items-start justify-between gap-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#8C5E2D]">
                  {c.titre}
                </span>

                {/* Détails de la règle en infobulle accessible */}
                {(c.regle || c.limite) && (
                  <div className="relative group/tooltip shrink-0">
                    <button
                      type="button"
                      aria-label={`Règle de calcul : ${c.regle}`}
                      className="text-[#7A6B63]/60 hover:text-[#21130D] transition p-0.5 rounded cursor-help"
                    >
                      <Info className="h-3.5 w-3.5" />
                    </button>
                    <div
                      role="tooltip"
                      className="absolute right-0 top-full mt-1 hidden w-56 rounded-lg border border-[rgba(60,35,20,0.08)] bg-white p-2.5 text-[11px] leading-relaxed text-[#5A4B42] shadow-md group-hover/tooltip:block z-50 pointer-events-none"
                    >
                      <strong className="text-[#21130D] font-semibold">Règle appliquée :</strong>
                      <div className="mt-0.5">{c.regle}</div>
                      {c.limite && (
                        <div className="mt-1 text-[10px] text-[#B85D43] italic border-t border-[rgba(60,35,20,0.06)] pt-1">
                          {c.limite}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Une seule phrase concise */}
              <p className="mt-1.5 text-xs font-semibold text-[#21130D] leading-snug">
                {c.texte}
              </p>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
