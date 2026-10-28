"use client";

import { ArrowRight } from "lucide-react";
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
  onFilterStatut,
  onNavigateTab,
}: ATraiterCardProps) {
  const items = [
    {
      id: "jalons",
      count: counts.retards,
      text: "jalons en retard sur le calendrier d'incubation",
      shortText: "jalons en retard",
      dotClass: "bg-[#B85D43]", // Rouge terracotta
      onClick: () => onFilterStatut?.("incube"),
      actionLabel: "Filtrer les projets incubés",
    },
    {
      id: "conventions",
      count: counts.conventions,
      text: "conventions de partenariat en attente de validation",
      shortText: "conventions en attente",
      dotClass: "bg-[#C99A68]", // Cuivre / Ocre
      onClick: () => onNavigateTab?.("financements"),
      actionLabel: "Consulter les conventions",
    },
    {
      id: "dossiers",
      count: counts.dossiers,
      text: "dossiers à évaluer par le comité de sélection",
      shortText: "dossiers à évaluer",
      dotClass: "bg-[#4A6B82]", // Bleu ardoise
      onClick: () => onFilterStatut?.("depose"),
      actionLabel: "Filtrer les dossiers déposés",
    },
  ];

  return (
    <section
      aria-labelledby="a-traiter-heading"
      className="rounded-xl border border-[rgba(60,35,20,0.08)] bg-white px-4 transition hover:shadow-[0_2px_8px_rgba(60,35,20,0.04)]"
    >
      <h2 id="a-traiter-heading" className="sr-only">
        Actions prioritaires et points d&apos;attention à traiter
      </h2>

      <div className="divide-y divide-[rgba(60,35,20,0.06)]">
        {items.map((item) => (
          <div
            key={item.id}
            className="flex h-12 items-center justify-between gap-3 text-sm"
          >
            {/* Gauche : point 8px + chiffre gras 16px + texte 14px */}
            <div className="flex items-center gap-2.5 min-w-0">
              <span
                className={`h-2 w-2 shrink-0 rounded-full ${item.dotClass}`}
                aria-hidden="true"
              />
              <span className="font-sans text-[16px] font-bold text-[#21130D] tabular-nums shrink-0">
                {formatNumber(item.count)}
              </span>
              <span className="text-[14px] text-[#5A4B42] truncate">
                <span className="hidden sm:inline">{item.text}</span>
                <span className="sm:hidden">{item.shortText}</span>
              </span>
            </div>

            {/* Droite : lien 'Voir →' */}
            <button
              type="button"
              onClick={item.onClick}
              title={item.actionLabel}
              className="group inline-flex shrink-0 items-center gap-1 text-[13px] font-medium text-[#21130D] transition hover:text-[#C99A68] focus:outline-hidden"
            >
              <span>Voir</span>
              <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
            </button>
          </div>
        ))}
      </div>
    </section>
  );
}
