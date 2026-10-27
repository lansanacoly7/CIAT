export const STEPS = [
  { title: "Informations du projet", hint: "Présentation et idée" },
  { title: "Pièces justificatives", hint: "Documents à déposer" },
  { title: "Récapitulatif & soumission", hint: "Vérification et envoi" },
] as const;

/** Indicateur d'avancement des 3 étapes. `current` est l'index (0-2) ; les étapes déjà atteintes sont cliquables via `onSelect`. */
export default function Stepper({
  current,
  onSelect,
  theme = "light",
}: {
  current: number;
  maxReached?: number;
  onSelect?: (index: number) => void;
  theme?: "light" | "dark";
}) {
  const percent = Math.round(((current + 1) / STEPS.length) * 100);
  const isDark = theme === "dark";

  return (
    <nav aria-label="Étapes du dépôt de dossier">
      {/* Mobile : barre de progression continue */}
      <div className="sm:hidden">
        <p className={`mb-2 text-sm font-semibold ${isDark ? "text-white" : "text-[#1F130B]"}`}>
          Étape {current + 1} sur {STEPS.length} — {STEPS[current].title}
        </p>
        <div
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={percent}
          aria-label="Progression du dépôt de dossier"
          className={`h-2 w-full overflow-hidden rounded-full ${isDark ? "bg-white/20" : "bg-[#EFE4D6]"}`}
        >
          <div
            className={`h-full rounded-full transition-all duration-300 ${isDark ? "bg-[#C99A68]" : "bg-[#1F130B]"}`}
            style={{ width: `${percent}%` }}
          />
        </div>
      </div>

      {/* Desktop : trois étapes épurées reliées par des lignes */}
      <ol className="hidden items-center sm:flex">
        {STEPS.map((step, i) => {
          const done = i < current;
          const active = i === current;
          const clickable = i < current && Boolean(onSelect);

          const circleClasses = done || active
            ? "border-[#1F130B] bg-[#1F130B] text-white"
            : "border-[#3E2317]/35 bg-white text-[#1F130B]";

          const titleClasses = active
            ? "text-[#1F130B] font-bold"
            : done
              ? "text-[#1F130B] font-semibold"
              : "text-[#1F130B] font-medium";

          const content = (
            <div className="flex items-center gap-3.5">
              <span
                className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full border text-sm font-bold transition-all ${circleClasses}`}
              >
                {done ? (
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth="2.5" stroke="currentColor" aria-hidden>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  i + 1
                )}
              </span>
              <span className="min-w-0 text-left">
                <span className={`block text-sm leading-tight ${titleClasses}`}>
                  {step.title}
                </span>
                {active ? (
                  <span className="block">
                    <span className="block text-xs font-semibold text-[#A06E35] mt-0.5">En cours</span>
                    <span className="block text-[11px] text-[#8C7E72] leading-tight">Étape {i + 1} sur {STEPS.length}</span>
                  </span>
                ) : done ? (
                  <span className="block text-xs font-medium text-[#2E7D32] mt-0.5">Terminé</span>
                ) : (
                  <span className="block text-xs text-[#8C7E72] mt-0.5">À venir</span>
                )}
              </span>
            </div>
          );

          return (
            <li key={step.title} className="flex flex-1 items-center last:flex-none" aria-current={active ? "step" : undefined}>
              {clickable ? (
                <button
                  type="button"
                  onClick={() => onSelect?.(i)}
                  className="flex items-center rounded-lg text-left hover:opacity-80 transition-opacity"
                  aria-label={`Revenir à : ${step.title}`}
                >
                  {content}
                </button>
              ) : (
                <div className="flex items-center">{content}</div>
              )}
              {i < STEPS.length - 1 && (
                <div
                  aria-hidden
                  className="mx-4 sm:mx-6 h-[1.5px] min-w-8 flex-1 rounded-full bg-[#E5D8CA]"
                />
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
