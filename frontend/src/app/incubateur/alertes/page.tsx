"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { ApiErrorBanner, PageTitle } from "@/components/ui";
import { useAuth } from "@/context/AuthContext";
import { formatDateFr, getAlertes, suiviErrorMessage, type AlerteJalon } from "@/lib/incubator";

function joursDeRetard(echeance: string) {
  const [year, month, day] = echeance.split("-").map(Number);
  if (!year || !month || !day) return null;
  const dateEcheance = Date.UTC(year, month - 1, day);
  const now = new Date();
  const aujourdHui = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate());
  return Math.max(0, Math.floor((aujourdHui - dateEcheance) / 86_400_000));
}

function libelleRetard(echeance: string) {
  const jours = joursDeRetard(echeance);
  if (jours === null) return "retard signalé";
  if (jours === 0) return "moins d’un jour de retard";
  return `${jours} jour(s) de retard`;
}

function Alertes() {
  const { user } = useAuth();
  const canSubmit = user?.role === "porteur" || user?.role === "coordonnateur" || user?.role === "administrateur";
  const canEvaluate = user?.role === "membre_comite" || user?.role === "coordonnateur" || user?.role === "administrateur";
  const [alertes, setAlertes] = useState<AlerteJalon[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [tick, setTick] = useState(0);
  const load = () => { setError(null); setAlertes(null); setTick((t) => t + 1); };

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await getAlertes();
        if (cancelled) return;
        setAlertes(res);
        setError(null);
      } catch (err) {
        if (!cancelled) setError(suiviErrorMessage(err, "Impossible de charger les alertes. Veuillez réessayer."));
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [tick]);

  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-8 sm:py-12">
      <div className="mb-6 flex flex-wrap gap-2 border-b border-bordure pb-3">
        {canSubmit && (
          <Link href="/incubateur" className="inline-flex min-h-11 items-center rounded-lg border border-bordure bg-white px-4 text-sm font-semibold text-texte-doux transition-colors hover:bg-ivoire hover:text-brun">
            Dépôt de dossier
          </Link>
        )}
        <Link
          href="/incubateur/projets"
          className="rounded-lg border border-bordure bg-white px-4 py-2 text-xs font-semibold text-texte-doux hover:bg-ivoire hover:text-brun transition-colors"
        >
          Suivi des projets
        </Link>
        <span aria-current="page" className="inline-flex min-h-11 items-center rounded-lg bg-brun px-4 text-sm font-bold text-white shadow-xs">
          Alertes de retard
        </span>
        {canEvaluate && (
          <Link href="/incubateur/evaluation" className="inline-flex min-h-11 items-center rounded-lg border border-bordure bg-white px-4 text-sm font-semibold text-texte-doux transition-colors hover:bg-ivoire hover:text-brun">
            Évaluations comité
          </Link>
        )}
      </div>

      <PageTitle title="Alertes de retard" subtitle="Jalons dont l'échéance est dépassée et qui ne sont pas terminés." />

      {error ? (
        <ApiErrorBanner message={error} onRetry={load} />
      ) : !alertes ? (
        <div className="flex justify-center py-16" role="status" aria-label="Chargement">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-beige border-t-brun" />
        </div>
      ) : alertes.length === 0 ? (
        <p role="status" className="rounded-xl border border-succes/30 bg-[#e3f1e9] p-6 text-center font-medium text-succes">
          Aucun jalon en retard.
        </p>
      ) : (
        <ul className="space-y-3">
          {alertes.map((a) => (
            <li key={a.id} className="rounded-xl border border-erreur border-l-8 bg-white p-4 shadow-sm">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <p className="font-[family-name:var(--font-title)] font-bold text-brun">{a.titre}</p>
                  <p className="text-sm text-texte">Projet : {a.projet_titre}</p>
                  <p className="text-sm text-erreur">
                    Échéance du {formatDateFr(a.echeance)} · {libelleRetard(a.echeance)}
                  </p>
                </div>
                <Link
                  href={`/incubateur/projets/${a.projet}#jalon-${a.id}`}
                  className="inline-flex min-h-11 shrink-0 items-center justify-center rounded-lg bg-brun px-5 text-sm font-semibold text-white hover:bg-brun-fonce"
                >
                  Voir le jalon
                </Link>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default function AlertesPage() {
  return (
    <ProtectedRoute allowedRoles={["porteur", "mentor", "coordonnateur", "administrateur"]}>
      <Alertes />
    </ProtectedRoute>
  );
}
