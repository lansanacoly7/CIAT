export const STEPS = [
  { title: "Informations du projet", hint: "Présentation et idée" },
  { title: "Pièces justificatives", hint: "Documents à déposer" },
  { title: "Récapitulatif & Soumission", hint: "Vérification et envoi" },
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
  const percent = Math.round(((current + 1) / STEPS.length) * 100);

  return (
    <nav aria-label="Étapes du dépôt de dossier">
      {/* Mobile : barre de progression continue */}
      <div className="sm:hidden">
        <p className="mb-2 text-sm font-semibold text-[#612D10]">
          Étape {current + 1} sur {STEPS.length} — {STEPS[current].title}
        </p>
        <div
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={percent}
          aria-label="Progression du dépôt de dossier"
          className="h-2 w-full overflow-hidden rounded-full bg-[#EFE4D6]"
        >
          <div className="h-full rounded-full bg-[#612D10] transition-all duration-300" style={{ width: `${percent}%` }} />
        </div>
      </div>

      {/* Desktop : trois étapes numérotées */}
      <ol className="hidden items-start sm:flex">
        {STEPS.map((step, i) => {
          const done = i < current;
          const active = i === current;
          const clickable = i <= maxReached && !active && Boolean(onSelect);
          const content = (
            <>
              <span
                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 text-sm font-bold transition-colors ${
                  done
                    ? "border-[#2E7D32] bg-[#2E7D32] text-white"
                    : active
                      ? "border-[#612D10] bg-[#612D10] text-white shadow-[0_0_0_4px_rgba(201,154,104,0.35)]"
                      : "border-[#EFE4D6] bg-white text-[#6b5646]"
                }`}
              >
                {done ? (
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth="3" stroke="currentColor" aria-hidden>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  i + 1
                )}
              </span>
              <span className="min-w-0 text-left">
                <span className={`block text-sm font-semibold leading-tight ${active ? "text-[#612D10]" : done ? "text-[#24140D]" : "text-[#6b5646]"}`}>
                  {step.title}
                </span>
                <span className="block text-xs text-[#6b5646]">
                  {done ? "Terminé" : active ? "En cours" : "À venir"}
                </span>
              </span>
            </>
          );
          return (
            <li key={step.title} className="flex flex-1 items-start last:flex-none" aria-current={active ? "step" : undefined}>
              {clickable ? (
                <button
                  type="button"
                  onClick={() => onSelect?.(i)}
                  className="flex min-h-11 items-center gap-3 rounded-lg pr-2 hover:opacity-80"
                  aria-label={`Revenir à : ${step.title}`}
                >
                  {content}
                </button>
              ) : (
                <div className="flex min-h-11 items-center gap-3 pr-2">{content}</div>
              )}
              {i < STEPS.length - 1 && (
                <span aria-hidden className={`mx-3 mt-5 h-0.5 min-w-6 flex-1 rounded ${i < current ? "bg-[#2E7D32]" : "bg-[#EFE4D6]"}`} />
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
