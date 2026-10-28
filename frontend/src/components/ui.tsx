import Link from "next/link";
import type {
  ButtonHTMLAttributes,
  InputHTMLAttributes,
  SelectHTMLAttributes,
  TextareaHTMLAttributes,
  TableHTMLAttributes,
  TdHTMLAttributes,
  ThHTMLAttributes,
  ReactNode,
} from "react";

/**
 * =============================================================================
 * DESIGN SYSTEM OFFICIEL CIAT 360 — COMPOSANTS D'INTERFACE UI PARTAGÉS
 * =============================================================================
 * Conforme à la Charte Graphique Écosystème CIAT 360 (v1.0) & WCAG 2.1 AA.
 *
 * GUIDE D'UTILISATION RAPIDE :
 * -----------------------------------------------------------------------------
 * 1. Boutons (Button / ButtonLink) :
 *    - variant="primary"   : Action majeure (ex. "Déposer un projet", "Soumettre").
 *    - variant="secondary" : Action secondaire / contour (ex. "Annuler", "Détails").
 *    - variant="ia"        : Action assistée par IA (ex. "Générer avec l'IA").
 *    - variant="danger"    : Action critique / refus (ex. "Supprimer", "Refuser").
 *    - variant="accent"    : Mise en valeur ocre doré CIAT.
 *    - Ergonomie tactile   : min-h-[44px] systématique, focus visible au clavier,
 *                            transitions sobres et respect de `prefers-reduced-motion`.
 *
 * 2. Cartes (Card / SimpleCard) :
 *    - Conteneurs délimités aux teintes de lin et sable doux avec liseré CIAT.
 *
 * 3. Badges (Badge / ProjectStatusBadge) :
 *    - Statuts officiels : "succes", "alerte", "erreur", "info", "neutre", "ia".
 *
 * 4. Formulaires (FormField, Input, Select, Textarea) :
 *    - Champs accessibles avec libellé clair, zone tactile ≥ 44px, bordure lin
 *      et anneau de focalisation ocre doré sans décalage.
 *
 * 5. Tableaux (Table, TableHeader, TableBody, TableRow, TableCell, TableHead) :
 *    - Structure tabulaire responsive, bordures douces et survol lisible.
 *
 * 6. États vides (EmptyState) :
 *    - Écran d'accueil accueillant lorsqu'une liste ou recherche ne retourne rien.
 *
 * 7. Alertes (ApiErrorBanner, DemoBanner) :
 *    - Bannières d'alerte et de résilience en cas de coupure réseau ou mode démo.
 * =============================================================================
 */

/* -----------------------------------------------------------------------------
 * 1. BOUTONS & LIENS D'ACTION
 * -------------------------------------------------------------------------- */

const BUTTON_BASE =
  "inline-flex min-h-[44px] items-center justify-center rounded-xl px-5 py-2.5 font-[family-name:var(--font-title)] text-sm font-semibold transition-all duration-150 motion-reduce:transition-none disabled:cursor-not-allowed disabled:opacity-50 active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#C99A68] cursor-pointer select-none";

const VARIANTS = {
  primary: "bg-brun text-white hover:bg-brun-fonce hover:shadow-md hover:scale-[1.01] shadow-sm",
  secondary: "border-[1.5px] border-brun bg-white text-brun hover:bg-[#F2E5D5] hover:border-[#A35926] hover:text-[#3F1D0A] hover:shadow-xs",
  outline: "border-[1.5px] border-brun bg-transparent text-brun hover:bg-[#F2E5D5] hover:border-[#A35926] hover:text-[#3F1D0A] hover:shadow-xs",
  ia: "bg-beige text-brun-fonce font-bold hover:bg-[#DDA76A] hover:text-[#24140D] hover:shadow-sm border border-[#b88755] shadow-sm",
  accent: "bg-beige text-brun-fonce hover:bg-[#DDA76A] hover:text-[#24140D] hover:shadow-sm shadow-sm",
  danger: "bg-erreur text-white hover:bg-[#B91C1C] hover:shadow-md shadow-sm",
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
  onClick,
}: {
  href: string;
  variant?: Variant;
  className?: string;
  children: ReactNode;
  onClick?: () => void;
}) {
  return (
    <Link href={href} onClick={onClick} className={`${BUTTON_BASE} ${VARIANTS[variant]} ${className}`}>
      {children}
    </Link>
  );
}

/* -----------------------------------------------------------------------------
 * 2. CARTES & CONTENEURS
 * -------------------------------------------------------------------------- */

export function Card({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`overflow-hidden rounded-2xl border border-bordure bg-white shadow-xs transition-all duration-200 motion-reduce:transition-none hover:border-beige ${className}`}
    >
      <div className="h-1.5 w-full bg-beige" />
      <div className="p-6">{children}</div>
    </div>
  );
}

export function SimpleCard({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`rounded-2xl border border-bordure bg-white p-6 shadow-xs ${className}`}
    >
      {children}
    </div>
  );
}

/* -----------------------------------------------------------------------------
 * 3. BADGES DE STATUT
 * -------------------------------------------------------------------------- */

const BADGES = {
  succes: "bg-[#e3f1e9] text-[#1b5e20] border border-[#c4e3d1]",
  alerte: "bg-[#f8ebd3] text-[#854d0e] border border-[#edd5ab]",
  erreur: "bg-[#f6dedc] text-[#b91c1c] border border-[#eec0bc]",
  info: "bg-[#e6f0fa] text-[#1d4ed8] border border-[#bfdbfe]",
  neutre: "bg-white text-brun border border-bordure",
  ia: "bg-[#FFF7ED] text-[#9A3412] border border-[#FDBA74]",
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

/* -----------------------------------------------------------------------------
 * 4. EN-TÊTE DE SECTION
 * -------------------------------------------------------------------------- */

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
        <p className="mb-2 text-xs font-bold uppercase tracking-[0.14em] text-[#5A4B42]">
          {tag}
        </p>
      )}
      <h1 className="text-3xl font-extrabold text-brun md:text-4xl">{title}</h1>
      {subtitle && <p className="mt-3 max-w-3xl text-base text-texte-doux leading-relaxed">{subtitle}</p>}
    </div>
  );
}

/* -----------------------------------------------------------------------------
 * 5. FORMULAIRES & CONTRÔLES ACCESSIBLES
 * -------------------------------------------------------------------------- */

export function FormField({
  id,
  label,
  required,
  error,
  hint,
  children,
  className = "",
}: {
  id: string;
  label: string;
  required?: boolean;
  error?: string;
  hint?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={`space-y-1.5 ${className}`}>
      <label htmlFor={id} className="block text-xs font-bold uppercase tracking-wider text-texte-doux">
        {label} {required && <span className="text-erreur">*</span>}
      </label>
      {children}
      {hint && !error && <p className="text-xs text-texte-doux">{hint}</p>}
      {error && <p role="alert" className="text-xs font-medium text-erreur">{error}</p>}
    </div>
  );
}

const CONTROL_BASE =
  "w-full min-h-[44px] rounded-xl border border-bordure bg-white px-3.5 py-2 text-sm text-brun placeholder:text-texte-doux/60 transition-colors focus:border-beige focus:outline-none focus:ring-1 focus:ring-beige disabled:bg-ivoire disabled:cursor-not-allowed";

export function Input({ className = "", ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={`${CONTROL_BASE} ${className}`} {...props} />;
}

export function Select({ className = "", children, ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select className={`${CONTROL_BASE} ${className}`} {...props}>
      {children}
    </select>
  );
}

export function Textarea({ className = "", ...props }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={`w-full min-h-[100px] rounded-xl border border-bordure bg-white p-3.5 text-sm text-brun placeholder:text-texte-doux/60 transition-colors focus:border-beige focus:outline-none focus:ring-1 focus:ring-beige disabled:bg-ivoire ${className}`}
      {...props}
    />
  );
}

/* -----------------------------------------------------------------------------
 * 6. TABLEAUX DE DONNÉES ACCESSIBLES
 * -------------------------------------------------------------------------- */

export function Table({ className = "", children, ...props }: TableHTMLAttributes<HTMLTableElement>) {
  return (
    <div className="overflow-x-auto rounded-2xl border border-bordure bg-white shadow-xs">
      <table className={`w-full text-left text-sm text-brun divide-y divide-bordure ${className}`} {...props}>
        {children}
      </table>
    </div>
  );
}

export function TableHeader({ className = "", ...props }: TableHTMLAttributes<HTMLTableSectionElement>) {
  return <thead className={`bg-ivoire text-xs uppercase tracking-wider font-bold text-texte-doux ${className}`} {...props} />;
}

export function TableBody({ className = "", ...props }: TableHTMLAttributes<HTMLTableSectionElement>) {
  return <tbody className={`divide-y divide-bordure bg-white ${className}`} {...props} />;
}

export function TableRow({ className = "", ...props }: TableHTMLAttributes<HTMLTableRowElement>) {
  return <tr className={`hover:bg-ivoire/60 transition-colors ${className}`} {...props} />;
}

export function TableHead({ className = "", ...props }: ThHTMLAttributes<HTMLTableCellElement>) {
  return <th className={`px-4 py-3.5 font-bold text-texte-doux ${className}`} {...props} />;
}

export function TableCell({ className = "", ...props }: TdHTMLAttributes<HTMLTableCellElement>) {
  return <td className={`px-4 py-3.5 text-texte align-middle ${className}`} {...props} />;
}

/* -----------------------------------------------------------------------------
 * 7. ÉTATS VIDES (EMPTY STATE)
 * -------------------------------------------------------------------------- */

export function EmptyState({
  title,
  description,
  action,
  icon,
  className = "",
}: {
  title: string;
  description: string;
  action?: ReactNode;
  icon?: ReactNode;
  className?: string;
}) {
  return (
    <div className={`rounded-2xl border border-dashed border-bordure bg-white p-10 text-center ${className}`}>
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-ivoire text-beige mb-4">
        {icon || (
          <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
          </svg>
        )}
      </div>
      <h3 className="text-base font-bold text-brun mb-1.5">{title}</h3>
      <p className="mx-auto max-w-md text-xs sm:text-sm text-texte-doux leading-relaxed mb-6">{description}</p>
      {action && <div className="flex justify-center">{action}</div>}
    </div>
  );
}

/* -----------------------------------------------------------------------------
 * 8. BANNIÈRES D'ALERTE & DE PANNE
 * -------------------------------------------------------------------------- */

export function DemoBanner({ className = "" }: { className?: string }) {
  return (
    <div
      role="alert"
      className={`mb-6 flex items-center gap-2.5 rounded-xl border border-amber-500/50 bg-[#FFFBEB] px-4 py-3 text-xs font-bold text-amber-900 shadow-xs ${className}`}
    >
      <span className="flex h-2.5 w-2.5 rounded-full bg-amber-600 animate-pulse motion-reduce:animate-none" />
      <span>MODE DÉMONSTRATION : données fictives</span>
    </div>
  );
}

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
      className={`mb-8 flex flex-col gap-3 rounded-2xl border border-erreur/40 bg-[#f6dedc] p-4 text-sm text-erreur sm:flex-row sm:items-center sm:justify-between ${className}`}
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
