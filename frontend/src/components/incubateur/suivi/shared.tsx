import type { ReactNode } from "react";

export const INPUT =
  "min-h-11 w-full rounded-xl border border-[#EFE4D6] bg-white px-3.5 text-xs sm:text-sm text-[#24140D] outline-none transition-all placeholder:text-[#A89582] focus:border-[#C99A68] focus:ring-2 focus:ring-[#C99A68]/20";

export const SELECT =
  "min-h-11 w-full rounded-xl border border-[#EFE4D6] bg-white px-3.5 pr-10 text-xs sm:text-sm font-medium text-[#24140D] outline-none transition-all focus:border-[#A35926] focus:ring-2 focus:ring-[#C99A68]/20 cursor-pointer";

export const BTN_SMALL = "!min-h-11 !px-4";

export function Block({
  title,
  action,
  children,
  className = "",
}: {
  title: string;
  icon?: ReactNode;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={`h-full flex flex-col justify-between rounded-2xl border border-[#EFE4D6] bg-white p-5 sm:p-6 shadow-xs transition-all hover:border-[#C99A68] hover:shadow-sm ${className}`}>
      <div className="flex-1 flex flex-col">
        <div className="mb-4 flex items-center justify-between gap-3 border-b border-[#F2E8DC] pb-3.5 min-h-[44px]">
          <h2 className="font-[family-name:var(--font-title)] text-base font-bold text-[#612D10] sm:text-lg leading-snug">
            {title}
          </h2>
          {action}
        </div>
        <div className="flex-1 flex flex-col justify-center text-sm">{children}</div>
      </div>
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
