"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  LogIn,
  MousePointerClick,
  RefreshCw,
  Send,
  Sliders,
  UserCheck,
  Users,
  XCircle,
} from "lucide-react";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { useAuth } from "@/context/AuthContext";
import { api, ApiError, type Page } from "@/lib/api";
import type { Dossier, DossierStatut, ProjetData } from "@/lib/incubator";
import { submitDecision } from "@/lib/evaluation";
import EvaluationDossierList, {
  StatutBadge,
  type DossierEval,
  formatDate,
} from "@/components/incubateur/EvaluationDossierList";
import DossierDetailCard, {
  type EvaluationsSummary,
} from "@/components/incubateur/DossierDetailCard";
import ScoringGrid from "@/components/incubateur/ScoringGrid";
import DecisionModal from "@/components/incubateur/DecisionModal";

type ProjetFull = ProjetData & { porteur_nom?: string };

function message(err: unknown, fallback: string) {
  if (err instanceof ApiError && err.status === 401) {
    return "Votre session a expiré. Veuillez vous reconnecter pour accéder aux dossiers.";
  }
  return err instanceof ApiError
    ? fallback
    : "Impossible de joindre le serveur. Vérifiez votre connexion internet.";
}

function EvaluationBoard() {
  const { user } = useAuth();
  const [dossiers, setDossiers] = useState<DossierEval[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isAuthError, setIsAuthError] = useState(false);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [scores, setScores] = useState<Record<number, number | null>>({});
  const [evals, setEvals] = useState<EvaluationsSummary | null>(null);
  const [evalsLoading, setEvalsLoading] = useState(false);
  const [evalsError, setEvalsError] = useState<string | null>(null);
  const [decisionModalOpen, setDecisionModalOpen] = useState(false);
  const [activeFilter, setActiveFilter] = useState<DossierStatut | "tous">("tous");

  // Décision rapide intégrée dans l'étape 3
  const [inlineDecision, setInlineDecision] = useState<"accepte" | "refuse">("accepte");
  const [inlineMotif, setInlineMotif] = useState("");
  const [submittingDecision, setSubmittingDecision] = useState(false);
  const [decisionSuccess, setDecisionSuccess] = useState<string | null>(null);
  const [decisionError, setDecisionError] = useState<string | null>(null);

  const loadDossiers = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    try {
      const page = await api<Page<Dossier> | Dossier[]>("/incubator/dossiers/");
      const rawList = Array.isArray(page) ? page : page.results ?? [];
      const list = rawList.filter((d) => d.statut !== "brouillon");

      const enriched: DossierEval[] = list.map((d) => {
        const p = d.projet as ProjetFull;
        return {
          ...d,
          porteur_nom: p?.porteur_nom || (d as DossierEval).porteur_nom,
        };
      });
      setDossiers(enriched);
      setError(null);
      setIsAuthError(false);
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        setIsAuthError(true);
      }
      setError(message(err, "Impossible de charger les dossiers."));
    } finally {
      setLoading(false);
      if (isRefresh) setRefreshing(false);
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
      const res = await api<EvaluationsSummary | EvaluationsSummary["evaluations"]>(
        `/incubator/dossiers/${id}/evaluations/`,
      );
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

  const handleSelectDossier = (id: number) => {
    setSelectedId((prev) => (prev === id ? null : id));
    setDecisionSuccess(null);
    setDecisionError(null);
    setInlineMotif("");
  };

  const selected = dossiers.find((d) => d.id === selectedId) ?? null;

  const refresh = () => {
    loadDossiers(true);
    if (selectedId !== null) loadEvaluations(selectedId);
  };

  // Soumission de la décision d'incubation en direct
  const handleInlineDecisionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selected) return;
    if (!inlineMotif.trim()) {
      setDecisionError("Le motif officiel de la décision est obligatoire.");
      return;
    }

    setSubmittingDecision(true);
    setDecisionError(null);

    try {
      const updated = await submitDecision(selected.id, inlineDecision, inlineMotif.trim());
      setDossiers((list) =>
        list.map((d) => (d.id === updated.id ? { ...d, statut: updated.statut } : d)),
      );
      setDecisionSuccess(
        inlineDecision === "accepte"
          ? "Félicitations ! Le dossier a été ADMIS à l'incubateur CIAT."
          : "Le dossier a été marqué comme NON RETENU avec motif officiel enregistré.",
      );
      refresh();
    } catch {
      setDecisionError("Impossible d'enregistrer la décision. Vérifiez vos droits.");
    } finally {
      setSubmittingDecision(false);
    }
  };

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-6 sm:py-8 space-y-6">
      <div className="flex items-center justify-between gap-3">
        <h1 className="font-serif text-2xl text-[#21130D] sm:text-3xl">
          Évaluation des dossiers
        </h1>
        <button
          type="button"
          onClick={refresh}
          disabled={refreshing}
          aria-label="Actualiser"
          title="Actualiser"
          className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-[rgba(60,35,20,0.10)] bg-white text-[#3D2314] transition hover:bg-[#FBF8F3] disabled:opacity-60 cursor-pointer"
        >
          <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin text-[#C99A68]" : ""}`} />
        </button>
      </div>

      {error && (
        <div
          role="alert"
          className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-xs font-semibold text-red-700 shadow-2xs"
        >
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4 shrink-0 text-red-600" />
            <span>{error}</span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => loadDossiers(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-red-300 bg-white text-xs font-bold text-red-700 hover:bg-red-50 transition-colors shadow-2xs cursor-pointer"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              <span>Réessayer</span>
            </button>
            {isAuthError && (
              <Link
                href="/connexion?next=/incubateur/evaluation"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#612D10] text-xs font-bold text-white hover:bg-[#3F1D0A] transition-colors shadow-2xs"
              >
                <LogIn className="h-3.5 w-3.5" />
                <span>Se reconnecter</span>
              </Link>
            )}
          </div>
        </div>
      )}

      {/* =========================================================================
          3. MASTER-DETAIL : COLONNE GAUCHE (FILE) & COLONNE DROITE (COCKPIT DÉTAILLÉ)
         ========================================================================= */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3" role="status" aria-label="Chargement">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-[#C99A68] border-t-[#612D10]" />
          <p className="text-xs font-semibold text-[#8C5E2D]">Chargement des candidatures de l&apos;incubateur...</p>
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-12 items-start">
          {/* Panneau gauche : File de traitement des dossiers (5 colonnes sur 12) */}
          <section
            className="lg:col-span-5 h-[calc(100vh-270px)] min-h-[580px]"
            aria-label="Liste des dossiers"
          >
            <EvaluationDossierList
              dossiers={dossiers}
              selectedId={selectedId}
              scores={scores}
              onSelect={handleSelectDossier}
              activeFilter={activeFilter}
              onFilterChange={setActiveFilter}
            />
          </section>

          {/* Panneau droit : Cockpit & Fiche détaillée (7 colonnes sur 12) */}
          <section
            className="lg:col-span-7 h-[calc(100vh-270px)] min-h-[580px] overflow-y-auto pr-1 space-y-6"
            aria-label="Détail du dossier"
          >
            {selected ? (
              <div className="space-y-6 animate-in fade-in duration-200">
                <div className="flex items-center justify-between gap-3">
                  <button
                    type="button"
                    onClick={() => setSelectedId(null)}
                    className="inline-flex items-center gap-1.5 text-sm text-[#5A4B42] hover:text-[#21130D] cursor-pointer"
                  >
                    <ArrowLeft className="h-4 w-4" />
                    <span>Retour</span>
                  </button>
                  <StatutBadge statut={selected.statut} />
                </div>

                {/* ── ÉTAPE 1 : INSTRUCTION DU DOSSIER & PIÈCES JUSTIFICATIVES ── */}
                <div id="workflow-step-1" className="space-y-4">
                  <h3 className="flex items-center gap-2 text-sm font-semibold text-[#21130D]">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#612D10] text-xs text-white">
                      1
                    </span>
                    Dossier
                  </h3>

                  <DossierDetailCard
                    dossier={selected}
                    evaluations={evals}
                    evaluationsLoading={evalsLoading}
                    evaluationsError={evalsError}
                    showEvaluations={false}
                  />
                </div>

                {/* ── ÉTAPE 2 : GRILLE DE NOTATION OFFICIELLE CIAT ── */}
                <div id="workflow-step-2" className="space-y-4 pt-2">
                  <h3 className="flex items-center gap-2 text-sm font-semibold text-[#21130D]">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#612D10] text-xs text-white">
                      2
                    </span>
                    Notation
                  </h3>

                  {(user?.role === "membre_comite" || user?.role === "administrateur") ? (
                    <ScoringGrid dossierId={selected.id} onEvaluated={refresh} />
                  ) : (
                    <div className="rounded-2xl border border-[#EFE4D6] bg-white p-5 space-y-3">
                      <div className="flex items-center gap-2 text-xs font-bold text-[#612D10]">
                        <Sliders className="h-4 w-4 text-[#C99A68]" />
                        <span>Grille de notation du projet</span>
                      </div>
                      <p className="text-xs text-[#5A4B42]">
                        Notée par les membres du jury.
                      </p>
                    </div>
                  )}
                </div>

                {/* ── ÉTAPE 3 : DÉLIBÉRATION, SYNTHÈSE DU JURY & DÉCISION FINALE ── */}
                <div id="workflow-step-3" className="space-y-4 pt-2">
                  <h3 className="flex items-center gap-2 text-sm font-semibold text-[#21130D]">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#612D10] text-xs text-white">
                      3
                    </span>
                    Décision
                  </h3>

                  {/* Synthèse des avis reçus du comité */}
                  <div className="rounded-2xl border border-[#EFE4D6] bg-white p-5 shadow-xs space-y-4">
                    <div className="flex items-center justify-between border-b border-[#EFE4D6]/70 pb-3">
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-[#8C5E2D]" />
                        <h3 className="font-[family-name:var(--font-title)] text-base font-bold text-[#612D10]">
                          Évaluations du comité
                        </h3>
                      </div>
                      <span className="rounded-full bg-[#FAF7F2] border border-[#EFE4D6] px-2.5 py-0.5 text-xs font-bold text-[#612D10]">
                        {evals?.evaluations.length || 0} avis émis
                      </span>
                    </div>

                    <div className="flex items-baseline justify-between">
                      <span className="text-xs text-[#5A4B42]">Score moyen</span>
                      <strong className="text-2xl font-semibold text-[#612D10] tabular-nums">
                        {evals?.score_moyen == null ? "—" : `${evals.score_moyen.toFixed(1)} / 100`}
                      </strong>
                    </div>

                    {/* Liste des avis individuels */}
                    {evals && evals.evaluations.length > 0 ? (
                      <ul className="space-y-3">
                        {evals.evaluations.map((ev, i) => (
                          <li
                            key={ev.id ?? i}
                            className="rounded-xl border border-[#EFE4D6] bg-white p-4 shadow-2xs space-y-2"
                          >
                            <div className="flex items-center justify-between text-xs">
                              <div className="flex items-center gap-1.5 font-bold text-[#24140D]">
                                <UserCheck className="h-3.5 w-3.5 text-[#C99A68]" />
                                <span>{ev.evaluateur_nom || `Membre du jury ${i + 1}`}</span>
                              </div>
                              {ev.score != null && (
                                <span className="rounded-full bg-[#E3F1E9] px-2.5 py-0.5 text-xs font-extrabold text-[#2E7D32]">
                                  Score : {Number(ev.score).toFixed(1)}/100
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-[#24140D] leading-relaxed whitespace-pre-line bg-[#FAF7F2]/50 rounded-lg p-2.5 border border-[#EFE4D6]/50">
                              {ev.avis?.trim() || (
                                <span className="italic text-[#8C5E2D]">Aucun avis textuel rédigé.</span>
                              )}
                            </p>
                            {ev.cree_le && (
                              <p className="text-[10px] text-[#8C5E2D] text-right">
                                Noté le {formatDate(ev.cree_le)}
                              </p>
                            )}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-center py-4 text-xs italic text-[#8C5E2D]">
                        Aucune évaluation pour l&apos;instant.
                      </p>
                    )}
                  </div>

                  {/* Panneau de décision finale réservé au Coordonnateur et à l'Admin */}
                  <div className="rounded-2xl border border-[#EFE4D6] bg-white p-5 shadow-xs space-y-4">
                    <h3 className="text-sm font-semibold text-[#21130D]">Décision finale</h3>

                    {/* Statut déjà prononcé ou formulaire actif */}
                    {selected.statut === "accepte" ? (
                      <div className="rounded-xl border border-emerald-200 bg-emerald-50/70 p-4 space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 text-xs font-bold text-emerald-900">
                            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                            <span>Admis</span>
                          </div>
                        </div>
                        <p className="text-xs text-emerald-950">
                          {selected.motif_refus || "Le dossier a été retenu par le comité de sélection pour le cycle d'accompagnement et de prototypage au FabLab CIAT."}
                        </p>
                        {(user?.role === "coordonnateur" || user?.role === "administrateur") && (
                          <button
                            type="button"
                            onClick={() => setDecisionModalOpen(true)}
                            className="mt-2 text-xs text-emerald-800 underline font-semibold hover:text-emerald-950 cursor-pointer"
                          >
                            Modifier
                          </button>
                        )}
                      </div>
                    ) : selected.statut === "refuse" ? (
                      <div className="rounded-xl border border-red-200 bg-red-50/70 p-4 space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 text-xs font-bold text-red-900">
                            <XCircle className="h-4 w-4 text-red-600" />
                            <span>Non retenu</span>
                          </div>
                        </div>
                        <p className="text-xs text-red-950">
                          <strong>Motif officiel :</strong> {selected.motif_refus || "Le projet ne répond pas aux critères d'éligibilité ou de maturité requis pour la cohorte."}
                        </p>
                        {(user?.role === "coordonnateur" || user?.role === "administrateur") && (
                          <button
                            type="button"
                            onClick={() => setDecisionModalOpen(true)}
                            className="mt-2 text-xs text-red-800 underline font-semibold hover:text-red-950 cursor-pointer"
                          >
                            Modifier
                          </button>
                        )}
                      </div>
                    ) : (user?.role === "coordonnateur" || user?.role === "administrateur") ? (
                      /* Formulaire de décision directe pour le coordonnateur */
                      <form onSubmit={handleInlineDecisionSubmit} className="space-y-4 pt-1">
                        <div>
                          <div className="grid grid-cols-2 gap-3">
                            <button
                              type="button"
                              onClick={() => setInlineDecision("accepte")}
                              className={`flex items-center justify-center gap-2 rounded-xl border p-3 font-[family-name:var(--font-title)] text-xs font-bold transition-all cursor-pointer ${
                                inlineDecision === "accepte"
                                  ? "border-[#2E7D32] bg-[#E3F1E9] text-[#2E7D32] ring-2 ring-[#2E7D32]/30 shadow-xs"
                                  : "border-[#EFE4D6] bg-[#FAF7F2] text-[#6B5646] hover:border-[#2E7D32]/50 hover:bg-white"
                              }`}
                            >
                              <CheckCircle2 className="h-4 w-4 shrink-0" />
                              <span>Admettre</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => setInlineDecision("refuse")}
                              className={`flex items-center justify-center gap-2 rounded-xl border p-3 font-[family-name:var(--font-title)] text-xs font-bold transition-all cursor-pointer ${
                                inlineDecision === "refuse"
                                  ? "border-[#DC2626] bg-[#FEE2E2] text-[#DC2626] ring-2 ring-[#DC2626]/30 shadow-xs"
                                  : "border-[#EFE4D6] bg-[#FAF7F2] text-[#6B5646] hover:border-[#DC2626]/50 hover:bg-white"
                              }`}
                            >
                              <XCircle className="h-4 w-4 shrink-0" />
                              <span>Refuser</span>
                            </button>
                          </div>
                        </div>

                        <div>
                          <div className="flex items-baseline justify-between mb-1.5">
                            <label
                              htmlFor="decision-motif-inline"
                              className="text-xs font-bold uppercase tracking-wider text-[#21130D]"
                            >
                              Motif <span className="text-red-600">*</span>
                            </label>
                            <span className="text-[11px] text-[#8C5E2D] font-medium">
                              {inlineMotif.trim().length} car. (min. 10)
                            </span>
                          </div>
                          <textarea
                            id="decision-motif-inline"
                            rows={3}
                            value={inlineMotif}
                            onChange={(e) => {
                              setInlineMotif(e.target.value);
                              setDecisionError(null);
                            }}
                            placeholder={
                              inlineDecision === "accepte"
                                ? "Raisons de l'admission"
                                : "Raisons du refus"
                            }
                            className="w-full rounded-xl border border-[#EFE4D6] bg-white p-3 text-xs text-[#21130D] outline-none focus:border-[#C99A68] focus:ring-1 focus:ring-[#C99A68]"
                          />
                        </div>

                        {decisionError && (
                          <div role="alert" className="p-2.5 rounded-lg bg-red-50 border border-red-200 text-xs font-semibold text-red-700">
                            {decisionError}
                          </div>
                        )}

                        {decisionSuccess && (
                          <div role="status" className="p-2.5 rounded-lg bg-emerald-50 border border-emerald-200 text-xs font-semibold text-emerald-800">
                            {decisionSuccess}
                          </div>
                        )}

                        <button
                          type="submit"
                          disabled={submittingDecision || inlineMotif.trim().length < 10}
                          className="flex min-h-10 w-full items-center justify-center gap-2 rounded-xl bg-[#612D10] px-4 font-[family-name:var(--font-title)] text-xs font-bold text-white transition-all hover:bg-[#3F1D0A] disabled:opacity-50 cursor-pointer"
                        >
                          {submittingDecision ? (
                            <>
                              <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                              <span>Enregistrement de la décision...</span>
                            </>
                          ) : (
                            <>
                              <Send className="h-3.5 w-3.5 text-[#C99A68]" />
                              <span>Enregistrer la décision</span>
                            </>
                          )}
                        </button>
                      </form>
                    ) : (
                      /* Information pour les membres du jury */
                      <div className="p-3.5 rounded-xl bg-amber-50/50 border border-amber-200/60 text-xs text-amber-900 space-y-1">
                        <p>La décision finale revient au coordonnateur.</p>
                      </div>
                    )}
                  </div>

                  {/* Modal de décision popup (accessible via bouton) */}
                  {(user?.role === "coordonnateur" || user?.role === "administrateur") && (
                    <DecisionModal
                      dossier={selected}
                      isOpen={decisionModalOpen}
                      onClose={() => setDecisionModalOpen(false)}
                      onDecision={(updated) => {
                        setDossiers((list) =>
                          list.map((d) => (d.id === updated.id ? { ...d, statut: updated.statut } : d)),
                        );
                        setDecisionModalOpen(false);
                        refresh();
                      }}
                    />
                  )}
                </div>
              </div>
            ) : (
              <div className="flex h-full flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-[rgba(60,35,20,0.15)] p-8 text-center">
                <span className="flex h-12 w-12 items-center justify-center rounded-full bg-[#FBF3E9] text-[#8C5E2D]">
                  <MousePointerClick className="h-6 w-6" />
                </span>
                <p className="text-sm text-[#5A4B42]">Sélectionnez un dossier pour l&apos;évaluer</p>
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
