import Link from "next/link";
import type { ButtonHTMLAttributes, ReactNode } from "react";

/** Composants de base de la charte. Les ajouter ici plutôt que de réécrire des styles dans chaque module. */

const BUTTON_BASE =
  "inline-flex items-center justify-center rounded-lg px-5 py-2.5 font-[family-name:var(--font-title)] text-sm font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-50";

const VARIANTS = {
  primary: "bg-brun text-white hover:bg-brun-fonce",
  secondary: "border-[1.5px] border-brun bg-white text-brun hover:bg-ivoire",
  accent: "bg-beige text-texte hover:brightness-95",
} as const;

type Variant = keyof typeof VARIANTS;

export function Button({
  variant = "primary",
  className = "",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant }) {
  return <button className={`${BUTTON_BASE} ${VARIANTS[variant]} ${className}`} {...props} />;
}

export function ButtonLink({
  href,
  variant = "primary",
  children,
}: {
  href: string;
  variant?: Variant;
  children: ReactNode;
}) {
  return (
    <Link href={href} className={`${BUTTON_BASE} ${VARIANTS[variant]}`}>
      {children}
    </Link>
  );
}

export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div className={`overflow-hidden rounded-lg border border-bordure bg-ivoire ${className}`}>
      <div className="h-1.5 bg-beige" />
      <div className="p-5">{children}</div>
    </div>
  );
}

const BADGES = {
  succes: "bg-[#e3f1e9] text-succes",
  alerte: "bg-[#f8ebd3] text-alerte",
  erreur: "bg-[#f6dedc] text-erreur",
  neutre: "bg-ivoire text-brun",
} as const;

export function Badge({ tone = "neutre", children }: { tone?: keyof typeof BADGES; children: ReactNode }) {
  return (
    <span className={`inline-block rounded-full px-3 py-0.5 text-xs font-semibold ${BADGES[tone]}`}>
      {children}
    </span>
  );
}

export function PageTitle({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="mb-8 border-b border-beige pb-4">
      <h1 className="text-3xl font-bold">{title}</h1>
      {subtitle && <p className="mt-2 max-w-3xl text-texte-doux">{subtitle}</p>}
    </div>
  );
}
