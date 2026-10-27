"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { ApiErrorBanner, Badge, PageTitle } from "@/components/ui";
import { useAuth } from "@/context/AuthContext";
import { api, type Page } from "@/lib/api";
import { suiviErrorMessage } from "@/lib/incubator";

interface ProjetListe {
  id: number;
  titre: string;
  domaine_nom?: string;
  porteur_nom?: string;
  statut: string;
}

const STATUTS: Record<string, string> = {
  idee: "Idée",
  depose: "Dossier déposé",
  selectionne: "Sélectionné",
  incube: "En incubation",
  prototype: "Prototype",
  termine: "Incubation terminée",
  rejete: "Non retenu",
};

function ListeProjets() {
  const { user } = useAuth();
  const canSubmit = user?.role === "porteur" || user?.role === "coordonnateur" || user?.role === "administrateur";
  const canEvaluate = user?.role === "membre_comite" || user?.role === "coordonnateur" || user?.role === "administrateur";
  const [projets, setProjets] = useState<ProjetListe[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [tick, setTick] = useState(0);
  const load = () => { setError(null); setProjets(null); setTick((t) => t + 1); };

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await api<Page<ProjetListe> | ProjetListe[]>("/projets/");
        if (cancelled) return;
        setProjets(Array.isArray(res) ? res : res.results);
        setError(null);
      } catch (err) {
        if (!cancelled) setError(suiviErrorMessage(err, "Impossible de charger vos projets. Veuillez réessayer."));
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [tick]);

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-8 sm:py-12">
      <div className="mb-6 flex flex-wrap gap-2 border-b border-bordure pb-3">
        {canSubmit && (
          <Link href="/incubateur" className="inline-flex min-h-11 items-center rounded-lg border border-bordure bg-white px-4 text-sm font-semibold text-texte-doux transition-colors hover:bg-ivoire hover:text-brun">
            Dépôt de dossier
          </Link>
        )}
        <span aria-current="page" className="inline-flex min-h-11 items-center rounded-lg bg-brun px-4 text-sm font-bold text-white shadow-xs">
          Suivi des projets
        </span>
        <Link href="/incubateur/alertes" className="inline-flex min-h-11 items-center rounded-lg border border-bordure bg-white px-4 text-sm font-semibold text-texte-doux transition-colors hover:bg-ivoire hover:text-brun">
          Alertes de retard
        </Link>
        {canEvaluate && (
          <Link href="/incubateur/evaluation" className="inline-flex min-h-11 items-center rounded-lg border border-bordure bg-white px-4 text-sm font-semibold text-texte-doux transition-colors hover:bg-ivoire hover:text-brun">
            Évaluations comité
          </Link>
        )}
      </div>

      <PageTitle title="Suivi des projets" subtitle="Mentor, objectifs, jalons et preuves de chaque projet incubé." />

      {error ? (
        <ApiErrorBanner message={error} onRetry={load} />
      ) : !projets ? (
        <div className="flex justify-center py-16" role="status" aria-label="Chargement">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-beige border-t-brun" />
        </div>
      ) : projets.length === 0 ? (
        <p className="rounded-xl border border-dashed border-bordure bg-white p-8 text-center text-sm text-texte-doux">
          Aucun projet à suivre pour le moment.
        </p>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2">
          {projets.map((p) => (
            <li key={p.id}>
              <Link
                href={`/incubateur/projets/${p.id}`}
                className="block min-h-11 rounded-xl border border-bordure bg-white p-4 shadow-sm transition-colors hover:border-beige"
              >
                <span className="flex items-start justify-between gap-2">
                  <span className="font-[family-name:var(--font-title)] font-bold text-brun">{p.titre}</span>
                  <Badge>{STATUTS[p.statut] ?? "Statut non reconnu"}</Badge>
                </span>
                <span className="mt-1 block text-sm text-texte-doux">{p.domaine_nom}</span>
                {p.porteur_nom && <span className="block text-sm text-texte-doux">{p.porteur_nom}</span>}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default function ProjetsPage() {
  return (
    <ProtectedRoute allowedRoles={["porteur", "mentor", "coordonnateur", "administrateur"]}>
      <ListeProjets />
    </ProtectedRoute>
  );
}
