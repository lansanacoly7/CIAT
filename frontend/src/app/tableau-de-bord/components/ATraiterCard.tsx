"use client";

import Link from "next/link";
import { ArrowRight, AlertCircle } from "lucide-react";
import { formatNumber } from "@/lib/format";

export interface ATraiterCounts {
  retards: number;
  conventions: number;
  dossiers: number;
}

interface ATraiterCardProps {
  counts?: ATraiterCounts;
  onFilterStatut?: (statut: string) => void;
  onNavigateTab?: (tab: "financements") => void;
}

export function ATraiterCard({
  counts = { retards: 8, conventions: 2, dossiers: 5 },
  onNavigateTab,
}: ATraiterCardProps) {
  const retards = counts?.retards ?? 0;
  const conventions = counts?.conventions ?? 0;
  const dossiers = counts?.dossiers ?? 0;

  // Masque complètement le bloc quand tout est à 0
  if (retards === 0 && conventions === 0 && dossiers === 0) {
    return null;
  }

  const items = [
    {
      id: "jalons",
      count: retards,
      label: "retards jalons",
      fullLabel: "jalons en retard",
      dotClass: "bg-[#B85D43]", // Terracotta
      href: "/incubateur/alertes",
      actionLabel: "Consulter la liste des jalons en retard",
    },
    {
      id: "conventions",
      count: conventions,
      label: "conventions",
      fullLabel: "conventions en attente",
      dotClass: "bg-[#C99A68]", // Cuivre
      onClick: () => onNavigateTab?.("financements"),
      href: "/tableau-de-bord?vue=financements",
      actionLabel: "Consulter les conventions de partenariat",
    },
    {
      id: "dossiers",
      count: dossiers,
      label: "dossiers",
      fullLabel: "dossiers à évaluer",
      dotClass: "bg-[#4A6B82]", // Bleu ardoise
      href: "/incubateur/evaluation",
      actionLabel: "Accéder au cockpit d'évaluation des candidatures",
    },
  ];

  return (
    <section
      aria-labelledby="a-traiter-heading"
      className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-[rgba(60,35,20,0.08)] bg-white px-3 py-2 sm:px-4 sm:py-2.5 shadow-2xs"
    >
      <h2 id="a-traiter-heading" className="sr-only">
        Actions prioritaires à traiter
      </h2>

      {/* Titre compact */}
      <div className="flex items-center gap-1.5 shrink-0 text-xs font-semibold uppercase tracking-[0.06em] text-[#5A4B42]">
        <AlertCircle className="h-3.5 w-3.5 text-[#C99A68]" />
        <span>À traiter :</span>
      </div>

      {/* 3 compteurs cliquables sur une seule ligne */}
      <div className="flex flex-wrap items-center gap-2 sm:gap-3 flex-1 justify-end">
        {items.map((item) => {
          const content = (
            <>
              <span className={`h-2 w-2 rounded-full ${item.dotClass} shrink-0`} aria-hidden="true" />
              <span className="font-bold text-[#21130D] tabular-nums">
                {formatNumber(item.count)}
              </span>
              <span className="text-[#5A4B42]">
                <span className="hidden md:inline">{item.fullLabel}</span>
                <span className="md:hidden">{item.label}</span>
              </span>
              <ArrowRight className="h-3 w-3 text-[#5A4B42] opacity-60 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" />
            </>
          );

          return item.onClick ? (
            <button
              key={item.id}
              type="button"
              onClick={item.onClick}
              title={item.actionLabel}
              className="group inline-flex items-center gap-1.5 rounded-lg border border-[rgba(60,35,20,0.08)] bg-[#FBF8F3] px-2.5 py-1 text-xs transition hover:bg-white hover:border-[#C99A68] hover:shadow-2xs cursor-pointer"
            >
              {content}
            </button>
          ) : (
            <Link
              key={item.id}
              href={item.href}
              title={item.actionLabel}
              className="group inline-flex items-center gap-1.5 rounded-lg border border-[rgba(60,35,20,0.08)] bg-[#FBF8F3] px-2.5 py-1 text-xs transition hover:bg-white hover:border-[#C99A68] hover:shadow-2xs cursor-pointer"
            >
              {content}
            </Link>
          );
        })}
      </div>
    </section>
  );
}
