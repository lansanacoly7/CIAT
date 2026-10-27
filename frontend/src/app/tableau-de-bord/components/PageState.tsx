import { AlertCircle, Inbox, RotateCcw } from "lucide-react";

/** Skeleton pour les 8 cartes KPI (4 colonnes x 2 lignes) */
export function KpiSkeletonGrid() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {Array.from({ length: 8 }).map((_, i) => (
        <div
          key={`kpi-skeleton-${i}`}
          className="relative flex flex-col justify-between rounded-2xl border border-[rgba(60,35,20,0.08)] bg-white p-5 border-l-[5px] border-l-[rgba(60,35,20,0.15)] shadow-xs animate-pulse overflow-hidden min-h-[148px]"
        >
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 shrink-0 rounded-full bg-[rgba(60,35,20,0.08)]" />
              <div className="h-4 w-24 rounded bg-[rgba(60,35,20,0.08)]" />
            </div>
            <div className="h-3 w-16 rounded bg-[rgba(60,35,20,0.05)]" />
          </div>
          <div className="mt-4 flex items-baseline gap-2.5">
            <div className="h-8 w-20 rounded bg-[rgba(60,35,20,0.1)]" />
            <div className="h-5 w-12 rounded-full bg-[rgba(60,35,20,0.06)]" />
          </div>
          <div className="mt-2 h-3 w-36 rounded bg-[rgba(60,35,20,0.06)]" />
        </div>
      ))}
    </div>
  );
}

/** Skeleton pour les graphiques */
export function ChartSkeleton() {
  return (
    <div className="h-80 animate-pulse rounded-lg border border-zinc-200 bg-white p-5">
      <div className="h-4 w-36 rounded bg-zinc-200" />
      <div className="mt-2 h-3 w-48 rounded bg-zinc-100" />
      <div className="mt-8 flex h-48 items-end gap-3 px-4">
        {Array.from({ length: 7 }).map((_, i) => (
          <div
            key={`bar-skel-${i}`}
            className="flex-1 rounded-t bg-zinc-100"
            style={{ height: `${25 + ((i * 13) % 65)}%` }}
          />
        ))}
      </div>
    </div>
  );
}

/** État d'erreur avec bouton réessayer */
export function ErrorState({
  message = "Une erreur est survenue lors de la récupération des données décisionnelles.",
  onRetry,
}: {
  message?: string;
  onRetry?: () => void;
}) {
  return (
    <div className="rounded-lg border border-red-200 bg-red-50/50 p-6 text-center">
      <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-red-100">
        <AlertCircle className="h-5 w-5 text-red-600" strokeWidth={1.5} />
      </div>
      <h3 className="mt-3 text-sm font-semibold text-zinc-900">
        Échec du chargement
      </h3>
      <p className="mt-1 text-xs text-zinc-600">{message}</p>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="mt-4 inline-flex items-center gap-1.5 rounded-md border border-zinc-300 bg-white px-3 py-1.5 text-xs font-medium text-zinc-700 shadow-sm transition-colors hover:bg-zinc-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#c99a69]"
        >
          <RotateCcw className="h-3 w-3 text-zinc-500" strokeWidth={1.5} />
          <span>Réessayer</span>
        </button>
      )}
    </div>
  );
}

/** État vide quand aucun projet ne correspond aux critères */
export function EmptyState({ onReset }: { onReset?: () => void }) {
  return (
    <div className="rounded-lg border border-dashed border-zinc-300 bg-white p-12 text-center">
      <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-zinc-100">
        <Inbox className="h-5 w-5 text-zinc-400" strokeWidth={1.5} />
      </div>
      <h3 className="mt-3 text-sm font-semibold text-zinc-900">
        Aucune donnée trouvée
      </h3>
      <p className="mt-1 text-xs text-zinc-500 max-w-sm mx-auto">
        Aucun projet ou indicateur ne correspond aux filtres actuellement sélectionnés.
      </p>
      {onReset && (
        <button
          type="button"
          onClick={onReset}
          className="mt-4 inline-flex items-center gap-1.5 rounded-md border border-zinc-200 bg-white px-3 py-1.5 text-xs font-medium text-zinc-700 transition-colors hover:bg-zinc-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#c99a69]"
        >
          <RotateCcw className="h-3 w-3 text-zinc-500" strokeWidth={1.5} />
          <span>Réinitialiser les filtres</span>
        </button>
      )}
    </div>
  );
}
