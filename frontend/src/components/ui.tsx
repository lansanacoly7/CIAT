import Link from "next/link";
import type { ButtonHTMLAttributes, ReactNode } from "react";

/**
 * Composants officiels certifiés selon Charte_Graphique_CIAT_ISEP.pdf (Page 09).
 * Respecte l'ergonomie mobile : zone tactile minimale de 44x44px.
 */

const BUTTON_BASE =
  "inline-flex min-h-[44px] items-center justify-center rounded-lg px-5 py-2.5 font-[family-name:var(--font-title)] text-sm font-semibold transition-all duration-150 disabled:cursor-not-allowed disabled:opacity-50 active:scale-[0.98]";

const VARIANTS = {
  // 1. Bouton Principal (Action clé : Déposer, Valider)
  primary: "bg-brun text-white hover:bg-brun-fonce shadow-sm",
  // 2. Bouton Action IA / Générer (Intervention d'un service d'IA)
  ia: "bg-beige text-brun-fonce font-bold hover:brightness-95 border border-[#b88755] shadow-sm",
  // 3. Bouton Contour (Annuler, Télécharger PDF, Voir détails)
  secondary: "border-[1.5px] border-brun bg-transparent text-brun hover:bg-ivoire",
  outline: "border-[1.5px] border-brun bg-transparent text-brun hover:bg-ivoire",
  // 4. Accent ocre
  accent: "bg-beige text-brun-fonce hover:brightness-95",
} as const;

export type Variant = keyof typeof VARIANTS;

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
  className = "",
  children,
}: {
  href: string;
  variant?: Variant;
  className?: string;
  children: ReactNode;
}) {
  return (
    <Link href={href} className={`${BUTTON_BASE} ${VARIANTS[variant]} ${className}`}>
      {children}
    </Link>
  );
}

export function Card({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`overflow-hidden rounded-xl border border-bordure bg-ivoire shadow-sm transition-all hover:border-beige ${className}`}
    >
      <div className="h-1.5 w-full bg-beige" />
      <div className="p-6">{children}</div>
    </div>
  );
}

const BADGES = {
  succes: "bg-[#e3f1e9] text-succes border border-[#c4e3d1]",
  alerte: "bg-[#f8ebd3] text-alerte border border-[#edd5ab]",
  erreur: "bg-[#f6dedc] text-erreur border border-[#eec0bc]",
  info: "bg-[#e6f0fa] text-info border border-[#bfdbfe]",
  neutre: "bg-white text-brun border border-bordure",
} as const;

export function Badge({
  tone = "neutre",
  children,
  className = "",
}: {
  tone?: keyof typeof BADGES;
  children: ReactNode;
  className?: string;
}) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${BADGES[tone]} ${className}`}
    >
      {children}
    </span>
  );
}

/**
 * Les 5 Badges d'avancement officiels de la plateforme CIAT (Page 09 de la charte).
 */
export const PROJECT_STAGES = {
  1: { code: "01. IDÉE SOUMISE", tone: "neutre" },
  2: { code: "02. EN COMITÉ", tone: "info" },
  3: { code: "03. INCUBATION ACTIVE", tone: "alerte" },
  4: { code: "04. PROTOTYPE PRÊT", tone: "succes" },
  5: { code: "05. EN LEVÉE / PARTENARIAT", tone: "succes" },
} as const;

export function ProjectStatusBadge({ stage }: { stage: keyof typeof PROJECT_STAGES }) {
  const item = PROJECT_STAGES[stage];
  return <Badge tone={item.tone}>{item.code}</Badge>;
}

export function PageTitle({
  title,
  subtitle,
  tag,
}: {
  title: string;
  subtitle?: string;
  tag?: string;
}) {
  return (
    <div className="mb-8 border-b border-beige/60 pb-6">
      {tag && (
        <p className="mb-2 text-xs font-bold uppercase tracking-[0.14em] text-beige">
          {tag}
        </p>
      )}
      <h1 className="text-3xl font-extrabold text-brun md:text-4xl">{title}</h1>
      {subtitle && <p className="mt-3 max-w-3xl text-base text-texte-doux leading-relaxed">{subtitle}</p>}
    </div>
  );
}
