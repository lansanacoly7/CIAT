"use client";

import Link from "next/link";
import type { ConstatCalcul } from "../types";

interface ConstatsCardProps {
  constats: ConstatCalcul[];
  chargement?: boolean;
}

export function ConstatsCard({ constats, chargement }: ConstatsCardProps) {
  if (chargement) {
    return (
      <div className="rounded-2xl border border-bordure bg-white p-6 shadow-sm animate-pulse">
        <div className="h-5 w-48 bg-ivoire rounded mb-4" />
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-28 rounded-xl bg-ivoire/60 p-4" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <section className="rounded-2xl border border-[#EFE4D6] bg-white p-6 shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5 border-b border-[#F5EBE0] pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-2.5 w-2.5 rounded-full bg-[#8C5E2D]" />
            <h2 className="font-[family-name:var(--font-title)] text-lg font-bold text-[#1F130B]">
              Interprétations & Constats Clés (Règles Déterministes)
            </h2>
          </div>
          <p className="text-xs text-[#8C6D58] mt-1">
            Calculés par des règles transparentes sans IA, sous réserve d&apos;échantillons statistiquement significatifs.
          </p>
        </div>
        <Link
          href="/tableau-de-bord/methodologie#constats"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#8C5E2D] hover:text-[#612D10] transition-colors"
        >
          <span>Méthodologie & Seuils</span>
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </Link>
      </div>

      {constats.length === 0 ? (
        <div className="rounded-xl border border-dashed border-[#C99A68]/40 bg-[#F5EBE0]/30 p-5 text-center">
          <p className="text-sm font-semibold text-[#612D10]">
            Aucun constat produit sur cette sélection
          </p>
          <p className="text-xs text-[#8C6D58] mt-1 max-w-xl mx-auto">
            Conformément à la charte méthodologique du CIAT, aucun pourcentage ni ratio n&apos;est affiché sur un échantillon trop réduit (minimum 10 projets pour la concentration et la parité, 5 jalons pour les retards).
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {constats.map((c) => (
            <div
              key={c.id}
              className="group flex flex-col justify-between rounded-xl border border-[#EFE4D6] bg-gradient-to-b from-[#F5EBE0]/20 to-white p-4.5 hover:border-[#C99A68] hover:shadow-md transition-all duration-200"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-[#8C5E2D]">
                    {c.titre}
                  </span>
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold bg-[#F5EBE0] text-[#612D10]">
                    Règle vérifiée
                  </span>
                </div>
                <p className="text-sm font-bold text-[#1F130B] leading-snug">
                  {c.texte}
                </p>
              </div>

              <div className="mt-3 pt-3 border-t border-[#F5EBE0]/80 space-y-1.5">
                <div className="text-[11px] text-[#612D10]">
                  <span className="font-semibold text-[#8C5E2D]">Règle : </span>
                  {c.regle}
                </div>
                {c.limite && (
                  <div className="text-[10px] text-[#8C6D58] italic flex items-start gap-1">
                    <svg className="w-3 h-3 text-amber-600 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>{c.limite}</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

