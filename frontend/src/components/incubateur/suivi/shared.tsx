import type { ReactNode } from "react";

export const INPUT =
  "min-h-11 w-full rounded-lg border border-bordure bg-white px-3 text-texte outline-none transition-colors placeholder:text-texte-doux/60 focus:border-beige focus:ring-2 focus:ring-beige/40";

export const BTN_SMALL = "!min-h-11 !px-4";

export function Block({ title, action, children }: { title: string; action?: ReactNode; children: ReactNode }) {
  return (
    <section className="rounded-xl border border-bordure bg-white p-4 shadow-sm sm:p-6">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-lg font-bold text-brun sm:text-xl">{title}</h2>
        {action}
      </div>
      {children}
    </section>
  );
}

export function FieldLabel({ htmlFor, children }: { htmlFor: string; children: ReactNode }) {
  return (
    <label htmlFor={htmlFor} className="mb-1 block text-sm font-medium text-texte">
      {children}
    </label>
  );
}

export function InlineError({ message }: { message: string | null }) {
  if (!message) return null;
  return (
    <p role="alert" className="rounded-lg border border-erreur/40 bg-[#f6dedc] px-3 py-2 text-sm text-erreur">
      {message}
    </p>
  );
}
