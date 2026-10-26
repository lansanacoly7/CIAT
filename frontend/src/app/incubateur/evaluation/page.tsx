"use client";

import { useCallback, useEffect, useState } from "react";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { useAuth } from "@/context/AuthContext";
import { api, ApiError, type Page } from "@/lib/api";
import type { Dossier, ProjetData } from "@/lib/incubator";
import { getDossiersComite, getEvaluationsDossier } from "@/lib/evaluation";
import EvaluationDossierList, { type DossierEval } from "@/components/incubateur/EvaluationDossierList";
import DossierDetailCard, { type EvaluationsSummary } from "@/components/incubateur/DossierDetailCard";
import ScoringGrid from "@/components/incubateur/ScoringGrid";
import DecisionModal from "@/components/incubateur/DecisionModal";

type ProjetFull = ProjetData & { porteur_nom?: string };

function message(err: unknown, fallback: string) {
  return err instanceof ApiError ? fallback : "Impossible de joindre le serveur. Vérifiez votre connexion internet.";
}

function EvaluationBoard() {
  const { user } = useAuth();
  const [dossiers, setDossiers] = useState<DossierEval[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [scores, setScores] = useState<Record<number, number | null>>({});
  const [evals, setEvals] = useState<EvaluationsSummary | null>(null);
  const [evalsLoading, setEvalsLoading] = useState(false);
  const [evalsError, setEvalsError] = useState<string | null>(null);
  const [decisionOpen, setDecisionOpen] = useState(false);

  const loadDossiers = useCallback(async () => {
    try {
      let list: Dossier[] = [];
      try {
        const page = await api<Page<Dossier> | Dossier[]>("/incubator/dossiers/");
        list = (Array.isArray(page) ? page : page.results).filter((d) => d.statut !== "brouillon");
      } catch {
        list = await getDossiersComite();
      }

      // Le contrat ne renvoie que {id, titre} pour le projet : on récupère domaine, porteur et textes.
      const enriched = await Promise.all(
        list.map(async (d): Promise<DossierEval> => {
          try {
            const p = await api<ProjetFull>(`/projets/${d.projet.id}/`);
            return { ...d, projet: { ...d.projet, ...p }, porteur_nom: p.porteur_nom };
          } catch {
            return d;
          }
        }),
      );
      setDossiers(enriched);
      setError(null);
    } catch (err) {
      setError(message(err, "Impossible de charger les dossiers. Veuillez réessayer."));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let ignore = false;
    void (async () => {
      if (!ignore) await loadDossiers();
    })();
    return () => {
      ignore = true;
    };
  }, [loadDossiers]);

  const loadEvaluations = useCallback(async (id: number) => {
    setEvalsLoading(true);
    setEvalsError(null);
    try {
      const res = await api<EvaluationsSummary | EvaluationsSummary["evaluations"]>(`/incubator/dossiers/${id}/evaluations/`).catch(async () => {
        return await getEvaluationsDossier(id);
      });
      const summary: EvaluationsSummary = Array.isArray(res)
        ? { score_moyen: null, evaluations: res }
        : { score_moyen: res.score_moyen ?? null, evaluations: res.evaluations ?? [] };
      setEvals(summary);
      setScores((s) => ({ ...s, [id]: summary.score_moyen }));
    } catch (err) {
      setEvals(null);
      setEvalsError(message(err, "Impossible de charger les évaluations."));
    } finally {
      setEvalsLoading(false);
    }
  }, []);

  useEffect(() => {
    let ignore = false;
    if (selectedId !== null) {
      void (async () => {
        if (!ignore) await loadEvaluations(selectedId);
      })();
    }
    return () => {
      ignore = true;
    };
  }, [selectedId, loadEvaluations]);

  const selected = dossiers.find((d) => d.id === selectedId) ?? null;
  const refresh = () => {
    loadDossiers();
    if (selectedId !== null) loadEvaluations(selectedId);
  };

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:py-12">
      <h1 className="text-2xl font-bold text-[#612D10] sm:text-3xl">Évaluation des dossiers</h1>
      <p className="mb-6 mt-1 text-sm text-[#6b5646]">Consultez les dossiers soumis, notez-les ou rendez votre décision.</p>

      {error && (
        <div role="alert" className="mb-4 rounded-md border border-[#DC2626]/40 bg-[#DC2626]/5 px-3 py-2 text-sm text-[#DC2626]">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-16" role="status" aria-label="Chargement">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-[#C99A68] border-t-[#612D10]" />
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-12">
          {/* Liste des dossiers */}
          <section className="lg:col-span-5" aria-label="Liste des dossiers">
            <EvaluationDossierList
              dossiers={dossiers}
              selectedId={selectedId}
              scores={scores}
              onSelect={(id) => setSelectedId((prev) => (prev === id ? null : id))}
            />
          </section>

          {/* Fiche détail et actions */}
          <section className="space-y-6 lg:col-span-7" aria-label="Détail du dossier">
            {selected ? (
              <>
                <DossierDetailCard
                  dossier={selected}
                  evaluations={evals}
                  evaluationsLoading={evalsLoading}
                  evaluationsError={evalsError}
                />

                {(user?.role === "coordonnateur" || user?.role === "administrateur") && (
                  <div className="flex justify-end">
                    <button
                      type="button"
                      onClick={() => setDecisionOpen(true)}
                      className="flex min-h-11 items-center justify-center gap-2 rounded-md bg-[#612D10] px-6 font-[family-name:var(--font-title)] text-sm font-semibold text-white transition-colors hover:bg-[#3F1D0A]"
                    >
                      Rendre la décision d&apos;incubation
                    </button>
                  </div>
                )}

                {/* Grille de notation : visible pour les membres du comité (et l'admin en démonstration) */}
                {(user?.role === "membre_comite" || user?.role === "administrateur") && (
                  <ScoringGrid dossierId={selected.id} onEvaluated={refresh} />
                )}

                {/* Modal de décision : réservé au coordonnateur et à l'administrateur */}
                {(user?.role === "coordonnateur" || user?.role === "administrateur") && (
                  <DecisionModal
                    dossier={selected}
                    isOpen={decisionOpen}
                    onClose={() => setDecisionOpen(false)}
                    onDecision={(updated) => {
                      setDossiers((list) => list.map((d) => (d.id === updated.id ? { ...d, statut: updated.statut } : d)));
                      setDecisionOpen(false);
                      refresh();
                    }}
                  />
                )}
              </>
            ) : (
              <div className="rounded-lg border border-[#EFE4D6] bg-[#FAF7F2] p-8 text-center text-sm text-[#6b5646]">
                Sélectionnez un dossier dans la liste pour afficher sa fiche complète, ses pièces justificatives et sa grille de notation.
              </div>
            )}
          </section>
        </div>
      )}
    </div>
  );
}

export default function EvaluationPage() {
  return (
    <ProtectedRoute allowedRoles={["membre_comite", "coordonnateur", "administrateur"]}>
      <EvaluationBoard />
    </ProtectedRoute>
  );
}
