"use client";

import { AlertTriangle, Clock, FileCheck2, ChevronRight } from "lucide-react";

interface WatchZoneProps {
  onFilterStatut?: (statut: string) => void;
  onNavigateTab?: (tab: "projets" | "financements") => void;
}

export function WatchZone({ onFilterStatut, onNavigateTab }: WatchZoneProps) {
  const alerts = [
    {
      id: "jalons_retard",
      title: "Jalons en retard",
      count: "12",
      phrase: "12 jalons d'incubation ont dépassé leur échéance prévisionnelle",
      actionText: "Filtrer les projets en retard",
      borderColor: "border-l-[#B85D43]", // Terracotta
      icon: AlertTriangle,
      iconColor: "text-[#B85D43]",
      bgColor: "bg-[#B85D43]/5",
      onClick: () => {
        if (onFilterStatut) onFilterStatut("incube");
      },
    },
    {
      id: "conventions_attente",
      title: "Conventions en attente",
      count: "5",
      phrase: "5 conventions de partenariat sont en cours de validation finale",
      actionText: "Consulter les partenariats",
      borderColor: "border-l-[#C99A68]", // Ocre
      icon: FileCheck2,
      iconColor: "text-[#C99A68]",
      bgColor: "bg-[#C99A68]/5",
      onClick: () => {
        if (onNavigateTab) onNavigateTab("financements");
      },
    },
    {
      id: "dossiers_jury",
      title: "Dossiers à évaluer",
      count: "9",
      phrase: "9 dossiers complets sont en attente de la délibération du comité",
      actionText: "Consulter les dossiers déposés",
      borderColor: "border-l-[#4A6B82]", // Bleu ardoise
      icon: Clock,
      iconColor: "text-[#4A6B82]",
      bgColor: "bg-[#4A6B82]/5",
      onClick: () => {
        if (onFilterStatut) onFilterStatut("depose");
      },
    },
  ];

  return (
    <section aria-labelledby="watch-zone-heading" className="space-y-2">
      <div className="flex items-center justify-between">
        <h2
          id="watch-zone-heading"
          className="text-[12px] font-semibold uppercase tracking-[0.06em] text-[#8C7E74]"
        >
          Points d&apos;attention · À surveiller
        </h2>
        <span className="text-[11px] text-[#8C7E74]">
          Actualisation en continu
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 sm:gap-4">
        {alerts.map((alert) => {
          const Icon = alert.icon;
          return (
            <div
              key={alert.id}
              className={`flex flex-col justify-between rounded-2xl border border-[rgba(60,35,20,0.08)] bg-white p-4.5 pl-5 border-l-4 ${alert.borderColor} shadow-[0_1px_2px_rgba(60,35,20,0.04),0_8px_24px_rgba(60,35,20,0.05)] transition hover:-translate-y-0.5 hover:shadow-[0_2px_8px_rgba(60,35,20,0.08)]`}
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#21130D]">
                    {alert.title}
                  </span>
                  <div className={`p-1 rounded-md ${alert.bgColor}`}>
                    <Icon className={`h-4 w-4 ${alert.iconColor}`} />
                  </div>
                </div>

                <div className="my-2 flex items-baseline gap-2">
                  <span className="font-serif text-3xl font-bold text-[#21130D] tabular-nums">
                    {alert.count}
                  </span>
                </div>

                <p className="text-xs text-[#8C7E74] leading-relaxed">
                  {alert.phrase}
                </p>
              </div>

              <div className="mt-3 pt-2.5 border-t border-[rgba(60,35,20,0.06)]">
                <button
                  type="button"
                  onClick={alert.onClick}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-[#21130D] transition hover:text-[#C99A68]"
                >
                  <span>{alert.actionText}</span>
                  <ChevronRight className="h-3.5 w-3.5 stroke-[2]" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
