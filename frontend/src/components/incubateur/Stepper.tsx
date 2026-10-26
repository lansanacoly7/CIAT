export const STEPS = [
  { title: "Informations du projet" },
  { title: "Pièces justificatives" },
  { title: "Récapitulatif & Soumission" },
] as const;

/** Indicateur d'avancement des 3 étapes. `current` est l'index (0-2) ; les étapes déjà atteintes sont cliquables via `onSelect`. */
export default function Stepper({
  current,
  maxReached = current,
  onSelect,
}: {
  current: number;
  maxReached?: number;
  onSelect?: (index: number) => void;
}) {
  return (
    <nav aria-label="Étapes du dépôt de dossier">
      <p className="mb-3 text-center text-sm font-semibold text-[#612D10] sm:hidden">
        Étape {current + 1} sur {STEPS.length} — {STEPS[current].title}
      </p>
      <ol className="flex items-start">
        {STEPS.map((step, i) => {
          const done = i < current;
          const active = i === current;
          const circle = (
            <span
              className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-2 text-sm font-bold ${
                done
                  ? "border-[#2E7D32] bg-[#2E7D32] text-white"
                  : active
                    ? "border-[#612D10] bg-[#612D10] text-white"
                    : "border-[#EFE4D6] bg-white text-[#6b5646]"
              }`}
            >
              {done ? (
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth="3" stroke="currentColor" aria-hidden>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              ) : (
                i + 1
              )}
            </span>
          );
          return (
            <li key={step.title} className="flex flex-1 items-start last:flex-none" aria-current={active ? "step" : undefined}>
              <div className="flex flex-col items-center gap-1 sm:w-40">
                {i <= maxReached && !active && onSelect ? (
                  <button type="button" onClick={() => onSelect(i)} className="rounded-full" aria-label={`Revenir à : ${step.title}`}>
                    {circle}
                  </button>
                ) : (
                  circle
                )}
                <span className={`hidden text-center text-xs font-medium sm:block ${active ? "text-[#612D10]" : "text-[#6b5646]"}`}>
                  {step.title}
                </span>
              </div>
              {i < STEPS.length - 1 && (
                <span aria-hidden className={`mx-2 mt-[18px] h-0.5 flex-1 ${i < current ? "bg-[#2E7D32]" : "bg-[#EFE4D6]"}`} />
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
