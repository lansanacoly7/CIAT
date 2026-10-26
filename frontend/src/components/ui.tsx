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

/**
 * Bandeau d'avertissement quand le mode démonstration fictif est explicitement activé via NEXT_PUBLIC_MODE_DEMO=1.
 */
export function DemoBanner({ className = "" }: { className?: string }) {
  return (
    <div
      role="alert"
      className={`mb-6 flex items-center gap-2.5 rounded-xl border border-amber-500/50 bg-[#FFFBEB] px-4 py-3 text-xs font-bold text-amber-900 shadow-xs ${className}`}
    >
      <span className="flex h-2.5 w-2.5 rounded-full bg-amber-600 animate-pulse" />
      <span>MODE DÉMONSTRATION : données fictives</span>
    </div>
  );
}

/**
 * Bandeau d'indisponibilité en cas de panne de l'API avec bouton "Réessayer".
 */
export function ApiErrorBanner({
  message,
  onRetry,
  className = "",
}: {
  message: string;
  onRetry?: () => void;
  className?: string;
}) {
  return (
    <div
      role="alert"
      className={`mb-8 flex flex-col gap-3 rounded-xl border border-erreur/40 bg-[#f6dedc] p-4 text-sm text-erreur sm:flex-row sm:items-center sm:justify-between ${className}`}
    >
      <div className="flex items-center gap-2.5">
        <svg className="h-5 w-5 shrink-0 text-erreur" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
          />
        </svg>
        <span className="font-medium">{message}</span>
      </div>
      {onRetry && (
        <Button variant="secondary" onClick={onRetry} className="!min-h-[36px] self-start sm:self-auto text-xs font-bold shrink-0">
          Réessayer
        </Button>
      )}
    </div>
  );
}

