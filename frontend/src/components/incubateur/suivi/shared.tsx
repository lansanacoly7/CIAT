import type { ReactNode } from "react";

export const INPUT =
  "min-h-11 w-full rounded-xl border border-[#EFE4D6] bg-white px-3.5 text-xs sm:text-sm text-[#24140D] outline-none transition-all placeholder:text-[#A89582] focus:border-[#C99A68] focus:ring-2 focus:ring-[#C99A68]/20";

export const SELECT =
  "min-h-11 w-full rounded-xl border border-[#EFE4D6] bg-white px-3.5 pr-10 text-xs sm:text-sm font-medium text-[#24140D] outline-none transition-all focus:border-[#A35926] focus:ring-2 focus:ring-[#C99A68]/20 cursor-pointer";

export const BTN_SMALL = "!min-h-11 !px-4";

export function Block({
  title,
  icon,
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
    <section className={`flex flex-col justify-between rounded-2xl border border-[#EFE4D6] bg-white p-5 sm:p-6 shadow-xs transition-shadow hover:shadow-sm ${className}`}>
      <div>
        <div className="mb-4 flex items-center justify-between gap-3 border-b border-[#F2E8DC] pb-3.5">
          <div className="flex items-center gap-2.5 min-w-0">
            {icon && (
              <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-[#522504] text-[#F7EFE6] shadow-xs">
                {icon}
              </div>
            )}
            <h2 className="truncate font-[family-name:var(--font-title)] text-base font-bold text-[#3D1A04] sm:text-lg">
              {title}
            </h2>
          </div>
          {action}
        </div>
        <div className="text-sm">{children}</div>
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
