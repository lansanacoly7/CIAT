"use client";

import { useSyncExternalStore } from "react";
import { formatNumber } from "@/lib/format";

const emptySubscribe = () => () => {};

interface EntonnoirCardProps {
  indicateurs: {
    idees_recues: number;
    dossiers_deposes: number;
    projets_selectionnes: number;
    projets_incubes: number;
    prototypes: number;
    taux_selection?: number;
  };
  onFilterStatut?: (statut: string) => void;
}

interface StepData {
  id: string;
  label: string;
  description: string;
  count: number;
  statut: string;
}

export function EntonnoirCard({ indicateurs, onFilterStatut }: EntonnoirCardProps) {
  const mounted = useSyncExternalStore(emptySubscribe, () => true, () => false);

  const steps: StepData[] = [
    {
      id: "idees",
      label: "Idées",
      description: "Idées reçues et candidatures enregistrées au guichet",
      count: indicateurs.idees_recues ?? 62,
      statut: "idee",
    },
    {
      id: "dossiers",
      label: "Dossiers",
      description: "Dossiers complets recevables soumis à l'évaluation",
      count: indicateurs.dossiers_deposes ?? 58,
      statut: "depose",
    },
    {
      id: "selectionnes",
      label: "Sélectionnés",
      description: "Projets lauréats retenus après délibération du jury",
      count: indicateurs.projets_selectionnes ?? 49,
      statut: "selectionne",
    },
    {
      id: "incubes",
      label: "Incubés",
      description: "Innovations accompagnées en parcours actif d'incubation",
      count: indicateurs.projets_incubes ?? 38,
      statut: "incube",
    },
    {
      id: "prototypes",
      label: "Prototypes",
      description: "Prototypes fonctionnels finalisés et testés sur le terrain",
      count: indicateurs.prototypes ?? 23,
      statut: "prototype",
    },
  ];

  const baseCount = Math.max(steps[0].count, 1);

  // Calcul des taux de conversion entre étapes successives n et n+1
  const conversionRates = steps.slice(0, -1).map((step, idx) => {
    const nextStep = steps[idx + 1];
    if (step.count <= 0) return { rate: "0,0 %", tooltip: "Aucune conversion" };
    const pct = (nextStep.count / step.count) * 100;
    const formatted = `${pct.toFixed(1).replace(".", ",")} %`;
    const isSelection = idx === 1; // Dossiers -> Sélectionnés
    return {
      rate: formatted,
      tooltip: isSelection
        ? `Taux de sélection : ${nextStep.count} retenus sur ${step.count} dossiers (${formatted})`
        : `Taux de conversion : ${nextStep.count} sur ${step.count} (${formatted})`,
    };
  });

  return (
    <section
      aria-labelledby="entonnoir-heading"
      className="rounded-xl border border-[rgba(60,35,20,0.08)] bg-white p-3 sm:p-3.5 transition hover:shadow-[0_2px_8px_rgba(60,35,20,0.04)] sm:max-h-[120px] overflow-hidden"
    >
      <h2 id="entonnoir-heading" className="sr-only">
        Entonnoir de maturation des projets
      </h2>

      {/* Grille horizontale de 5 colonnes avec pastilles de conversion intercalées */}
      <div className="overflow-x-auto no-scrollbar -mx-1 px-1">
        <div className="flex items-center justify-between gap-1 sm:gap-2 min-w-[520px] sm:min-w-full">
          {steps.map((step, index) => {
            const ratioPercent = Math.min(100, Math.max(8, (step.count / baseCount) * 100));
            const conv = index < 4 ? conversionRates[index] : null;

            return (
              <div key={step.id} className="flex-1 shrink-0 flex items-center min-w-[95px] sm:min-w-0">
              {/* Colonne cliquable */}
              <button
                type="button"
                onClick={() => onFilterStatut?.(step.statut)}
                title={step.description}
                className="group flex-1 flex flex-col justify-between text-left p-1.5 sm:p-2 rounded-lg transition hover:bg-[#FBF8F3] focus:outline-hidden focus:ring-1 focus:ring-[#C99A68]"
              >
                {/* Ligne 1 : Libellé 12 px nowrap */}
                <span className="text-[12px] font-medium text-[#5A4B42] whitespace-nowrap group-hover:text-[#21130D]">
                  {step.label}
                </span>

                {/* Ligne 2 : Valeur 28 px sans-serif font-600 tabular-nums */}
                <div className="my-1 flex items-baseline">
                  <span className="font-sans text-[24px] sm:text-[28px] font-semibold leading-none tracking-[-0.02em] text-[#21130D] tabular-nums">
                    {formatNumber(step.count)}
                  </span>
                </div>

                {/* Ligne 3 : Fine barre de 4 px proportionnelle */}
                <div className="h-1 w-full rounded-full bg-[rgba(60,35,20,0.06)] overflow-hidden">
                  <div
                    className="h-full rounded-full bg-[#C99A68] transition-all duration-700 ease-out motion-reduce:duration-0"
                    style={{
                      width: mounted ? `${ratioPercent}%` : "0%",
                    }}
                  />
                </div>
              </button>

              {/* Pastille de conversion entre étapes (visible sur grand et moyen écran) */}
              {conv && (
                <div
                  title={conv.tooltip}
                  style={{
                    animationDelay: `${index * 60}ms`,
                  }}
                  className="hidden md:flex shrink-0 -mx-1 z-10 items-center justify-center rounded-full bg-[#C99A68]/12 px-1.5 py-0.5 text-[11px] font-semibold text-[#8C5E2D] tabular-nums shadow-xs cursor-help select-none transition hover:bg-[#C99A68]/20"
                >
                  <span className="leading-none">{conv.rate}</span>
                </div>
              )}
            </div>
          );
        })}
        </div>
      </div>
    </section>
  );
}
