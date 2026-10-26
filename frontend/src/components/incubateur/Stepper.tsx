export const STEPS = [
  { title: "Informations du projet", hint: "Présentation et idée" },
  { title: "Pièces justificatives", hint: "Documents à déposer" },
  { title: "Récapitulatif & Soumission", hint: "Vérification et envoi" },
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
        <p className={`mb-2 text-sm font-semibold ${isDark ? "text-white" : "text-[#612D10]"}`}>
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
            className={`h-full rounded-full transition-all duration-300 ${isDark ? "bg-[#C99A68]" : "bg-[#612D10]"}`}
            style={{ width: `${percent}%` }}
          />
        </div>
      </div>

      {/* Desktop : trois étapes numérotées */}
      <ol className="hidden items-start sm:flex">
        {STEPS.map((step, i) => {
          const done = i < current;
          const active = i === current;
          // Seules les étapes précédentes déjà validées sont cliquables en retour arrière
          const clickable = i < current && Boolean(onSelect);

          const circleClasses = done
            ? "border-[#612D10] bg-[#612D10] text-white"
            : active
              ? isDark
                ? "border-[#C99A68] bg-[#C99A68] text-[#1F130B] shadow-[0_0_0_4px_rgba(201,154,104,0.35)]"
                : "border-[#612D10] bg-[#612D10] text-white shadow-[0_0_0_4px_rgba(201,154,104,0.35)]"
              : isDark
                ? "border-white/25 bg-black/30 text-white/70"
                : "border-[#EFE4D6] bg-white text-[#6b5646]";

          const titleClasses = isDark
            ? active
              ? "text-white font-bold"
              : done
                ? "text-[#FAF7F2]"
                : "text-[#D6C4B0]"
            : active
              ? "text-[#612D10]"
              : done
                ? "text-[#24140D]"
                : "text-[#6b5646]";

          const hintClasses = isDark
            ? active
              ? "text-[#C99A68] font-medium"
              : done
                ? "text-[#C99A68]"
                : "text-[#A08F80]"
            : done
              ? "text-[#8C6D4F]"
              : "text-[#6b5646]";

          const content = (
            <>
              <span
                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 text-sm font-bold transition-colors ${circleClasses}`}
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
                <span className={`block text-sm font-semibold leading-tight ${titleClasses}`}>
                  {step.title}
                </span>
                <span className={`block text-xs ${hintClasses}`}>
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
                <span
                  aria-hidden
                  className={`mx-3 mt-5 h-0.5 min-w-6 flex-1 rounded ${
                    i < current
                      ? isDark
                        ? "bg-[#C99A68]"
                        : "bg-[#612D10]"
                      : isDark
                        ? "bg-white/20"
                        : "bg-[#EFE4D6]"
                  }`}
                />
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
