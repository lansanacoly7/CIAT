"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  Bell,
  Calendar,
  ChevronRight,
  FileText,
  FolderOpen,
  Trash2,
  Undo2,
} from "lucide-react";
import DeleteProjectModal, {
  peutSupprimerOuRetirer,
  type ProjetASupprimer,
} from "@/components/incubateur/DeleteProjectModal";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { ApiErrorBanner, Badge } from "@/components/ui";
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
  retire: "Candidature retirée",
};

function ListeProjets() {
  const { user } = useAuth();
  const canSubmit = user?.role === "porteur" || user?.role === "coordonnateur" || user?.role === "administrateur";
  const [projets, setProjets] = useState<ProjetListe[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [aSupprimer, setASupprimer] = useState<ProjetASupprimer | null>(null);
  const [tick, setTick] = useState(0);

  const load = () => {
    setError(null);
    setProjets(null);
    setTick((t) => t + 1);
  };

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await api<Page<ProjetListe> | ProjetListe[]>("/projets/");
        if (cancelled) return;
        setProjets(Array.isArray(res) ? res : res.results);
        setError(null);
      } catch (err) {
        if (!cancelled) {
          setError(suiviErrorMessage(err, "Impossible de charger vos projets. Veuillez réessayer."));
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [tick]);

  return (
    <div className="w-full min-h-[calc(100vh-4rem)] bg-[#FAF7F2]">
      <div className="mx-auto w-full max-w-4xl px-4 py-8 sm:px-6 sm:py-10 space-y-8">
        
        {/* Fil d'Ariane discret */}
        <nav aria-label="Fil d'Ariane" className="flex items-center gap-1.5 text-xs font-medium text-[#8C6D58]">
          <Link href="/incubateur" className="hover:text-[#612D10] transition-colors">
            Espace Candidat
          </Link>
          <span className="text-[#C99A68]/60">/</span>
          <span className="text-[#24140D] font-semibold">Mes projets</span>
        </nav>

        {/* En-tête aéré et centré */}
        <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-[#EFE4D6] pb-6">
          <div className="space-y-1">
            <h1 className="font-[family-name:var(--font-title)] text-2xl sm:text-3xl font-extrabold tracking-tight text-[#24140D]">
              Mes projets
            </h1>
            <p className="text-xs sm:text-sm text-[#6b5646]">
              Consultez l&apos;état d&apos;avancement de vos candidatures et vos prochaines étapes.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <Link
              href="/incubateur/calendrier"
              className="inline-flex min-h-10 items-center gap-1.5 rounded-xl border border-[#EFE4D6] bg-white px-3.5 text-xs font-semibold text-[#612D10] shadow-2xs hover:border-[#C99A68] hover:bg-[#FAF7F2] transition-colors cursor-pointer"
            >
              <Calendar className="h-4 w-4 text-[#A35926]" />
              <span>Calendrier</span>
            </Link>
            <Link
              href="/incubateur/alertes"
              className="inline-flex min-h-10 items-center justify-center rounded-xl border border-[#EFE4D6] bg-white px-3 text-[#612D10] shadow-2xs hover:border-[#C99A68] hover:bg-[#FAF7F2] transition-colors relative cursor-pointer"
              aria-label="Alertes de retard"
              title="Consulter les alertes"
            >
              <Bell className="h-4 w-4 text-[#A35926]" />
              <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-[#A35926]" />
            </Link>
            {canSubmit && (
              <Link
                href="/incubateur"
                className="inline-flex min-h-10 items-center gap-2 rounded-xl bg-[#612D10] hover:bg-[#3F1D0A] px-4 py-2 text-xs sm:text-sm font-semibold text-white shadow-xs transition-all hover:scale-[1.01] cursor-pointer"
              >
                <span>Déposer une candidature</span>
                <ArrowRight className="h-4 w-4 stroke-[2]" />
              </Link>
            )}
          </div>
        </header>

        {error && <ApiErrorBanner message={error} onRetry={load} />}

        {/* Liste des projets ou état vide */}
        <main>
          {!projets ? (
            <div className="flex justify-center py-20" role="status" aria-label="Chargement">
              <div className="h-10 w-10 animate-spin rounded-full border-4 border-[#C99A68] border-t-[#612D10]" />
            </div>
          ) : projets.length === 0 ? (
            <div className="rounded-2xl border border-[#EFE4D6] bg-white p-8 sm:p-12 shadow-2xs text-center space-y-4">
              <div className="mx-auto h-14 w-14 rounded-2xl bg-[#FAF4ED] border border-[#EFE4D6] flex items-center justify-center text-[#A35926]">
                <FolderOpen className="h-7 w-7" aria-hidden="true" />
              </div>
              <div className="max-w-md mx-auto space-y-1">
                <h2 className="font-[family-name:var(--font-title)] text-lg font-bold text-[#24140D]">
                  Aucun projet enregistré
                </h2>
                <p className="text-xs sm:text-sm text-[#6b5646]">
                  Vos projets apparaîtront ici dès le dépôt de votre première candidature.
                </p>
              </div>
              {canSubmit && (
                <div className="pt-2">
                  <Link
                    href="/incubateur"
                    className="inline-flex items-center gap-2 rounded-xl bg-[#612D10] hover:bg-[#3F1D0A] px-5 py-2.5 text-xs font-semibold text-white shadow-xs transition-all"
                  >
                    <FileText className="h-4 w-4" aria-hidden="true" />
                    <span>Déposer ma première candidature</span>
                    <ArrowRight className="h-4 w-4" aria-hidden="true" />
                  </Link>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-1">
                <h2 className="text-xs font-bold uppercase tracking-wider text-[#8C6D4F]">
                  Projets actifs ({projets.length})
                </h2>
              </div>
              <ul className="space-y-4">
                {projets.map((p) => (
                  <li
                    key={p.id}
                    className="group rounded-2xl border border-[#EFE4D6] bg-white p-5 sm:p-6 shadow-2xs hover:border-[#C99A68] hover:shadow-xs transition-all space-y-4"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                      <div className="space-y-1 min-w-0">
                        <Link
                          href={`/incubateur/projets/${p.id}`}
                          className="font-[family-name:var(--font-title)] text-lg font-bold text-[#24140D] group-hover:text-[#612D10] transition-colors block truncate"
                        >
                          {p.titre}
                        </Link>
                        {p.domaine_nom && (
                          <p className="text-xs font-medium text-[#8C6D4F]">
                            {p.domaine_nom}
                          </p>
                        )}
                      </div>
                      <Badge className="self-start sm:self-center shrink-0">
                        {STATUTS[p.statut] ?? p.statut}
                      </Badge>
                    </div>

                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pt-3 border-t border-[#EFE4D6]/60">
                      <Link
                        href={`/incubateur/projets/${p.id}`}
                        className="inline-flex items-center gap-1.5 text-xs font-bold text-[#612D10] hover:text-[#A35926] transition-colors"
                      >
                        <span>Consulter le suivi et les jalons</span>
                        <ChevronRight className="h-4 w-4" />
                      </Link>

                      {user?.role === "porteur" && peutSupprimerOuRetirer(p.statut) && (
                        <button
                          type="button"
                          onClick={() => setASupprimer({ id: p.id, titre: p.titre, statut: p.statut })}
                          className="inline-flex cursor-pointer items-center gap-1.5 self-end sm:self-auto rounded-lg px-2.5 py-1 text-[11px] font-semibold text-[#8C6D4F] transition-colors hover:bg-[#FEE2E2] hover:text-[#DC2626]"
                        >
                          {p.statut === "depose" ? <Undo2 className="h-3.5 w-3.5" /> : <Trash2 className="h-3.5 w-3.5" />}
                          <span>{p.statut === "depose" ? "Retirer la candidature" : "Supprimer"}</span>
                        </button>
                      )}
                    </div>
                  </li>
                ))}
              </ul>

              {aSupprimer && (
                <DeleteProjectModal
                  projet={aSupprimer}
                  onClose={() => setASupprimer(null)}
                  onDone={(id) => {
                    setProjets((prev) => (prev ? prev.filter((x) => x.id !== id) : prev));
                    setASupprimer(null);
                  }}
                />
              )}
            </div>
          )}
        </main>

      </div>
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
