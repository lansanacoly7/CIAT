"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Clock,
  Building2,
  Users,
  CheckCircle2,
  XCircle,
  Award,
  RefreshCw,
  Sliders,
  UserCheck,
  ChevronRight,
  ArrowLeft,
  ShieldCheck,
  Info,
  AlertCircle,
  LogIn,
  FileCheck,
  ArrowDown,
  Scale,
  Send,
} from "lucide-react";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { useAuth } from "@/context/AuthContext";
import { api, ApiError, type Page } from "@/lib/api";
import type { Dossier, DossierStatut, ProjetData } from "@/lib/incubator";
import { submitDecision } from "@/lib/evaluation";
import EvaluationDossierList, {
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

  // Statistiques du pipeline de sélection
  const stats = useMemo(() => {
    const total = dossiers.length;
    const enAttente = dossiers.filter((d) => d.statut === "soumis").length;
    const enEvaluation = dossiers.filter((d) => d.statut === "en_evaluation").length;
    const acceptes = dossiers.filter((d) => d.statut === "accepte").length;
    const refuses = dossiers.filter((d) => d.statut === "refuse").length;

    const knownScores = dossiers
      .map((d) => (d.id in scores ? scores[d.id] : d.score_moyen))
      .filter((s): s is number => typeof s === "number" && !isNaN(s));
    const scoreMoyenGlobal =
      knownScores.length > 0
        ? knownScores.reduce((acc, v) => acc + v, 0) / knownScores.length
        : null;

    return {
      total,
      enAttente,
      enEvaluation,
      acceptes,
      refuses,
      scoreMoyenGlobal,
      tauxSucces: total > 0 ? Math.round((acceptes / total) * 100) : 0,
      tauxTraite: total > 0 ? Math.round(((acceptes + refuses) / total) * 100) : 0,
    };
  }, [dossiers, scores]);

  // Dossiers prioritaires à évaluer
  const dossiersPrioritaires = useMemo(() => {
    return dossiers
      .filter((d) => d.statut === "soumis" || (d.id in scores ? scores[d.id] == null : d.score_moyen == null))
      .slice(0, 3);
  }, [dossiers, scores]);

  // Défilement fluide vers une étape du dossier
  const scrollToStep = (stepId: string) => {
    const el = document.getElementById(stepId);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
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
      {/* =========================================================================
          1. EN-TÊTE PRINCIPAL & CONTEXTE DU COMITÉ
         ========================================================================= */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-[#EFE4D6] pb-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-[#FAF7F2] border border-[#EFE4D6] px-3 py-0.5 text-xs font-bold uppercase tracking-wider text-[#8C5E2D]">
              <Building2 className="h-3.5 w-3.5 text-[#C99A68]" />
              Incubateur CIAT • Comité de Sélection 2026
            </span>
            {user?.role && (
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#612D10] bg-[#EFE4D6]/60 px-3 py-0.5 rounded-full border border-[#EFE4D6]">
                <UserCheck className="h-3.5 w-3.5 text-[#C99A68]" />
                {user.role === "coordonnateur"
                  ? "Rôle : Coordonnateur de l'Incubateur"
                  : user.role === "administrateur"
                  ? "Rôle : Administrateur Général"
                  : "Rôle : Membre du Comité de Sélection"}
              </span>
            )}
          </div>
          <h1 className="text-2xl font-black text-[#612D10] sm:text-3xl font-[family-name:var(--font-title)] tracking-tight">
            Évaluation des dossiers
          </h1>
          <p className="text-xs sm:text-sm text-[#6B5646]">
            Processus structuré en 3 étapes : instruction des pièces, notation multicritères par le jury et arbitrage final d&apos;incubation.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-center">
          <button
            type="button"
            onClick={refresh}
            disabled={refreshing}
            className="inline-flex items-center gap-2 rounded-xl border border-[#EFE4D6] bg-white px-3.5 py-2 text-xs font-bold text-[#612D10] transition-all hover:bg-[#FAF7F2] hover:border-[#C99A68] shadow-2xs disabled:opacity-60 cursor-pointer"
            title="Rafraîchir les candidatures et notes"
          >
            <RefreshCw className={`h-3.5 w-3.5 text-[#C99A68] ${refreshing ? "animate-spin" : ""}`} />
            <span>Actualiser</span>
          </button>
        </div>
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
          2. BANNIÈRE PIPELINE : LE WORKFLOW EN 3 ÉTAPES CLAIRES & INTUITIVES
         ========================================================================= */}
      <div className="rounded-2xl border border-[#EFE4D6] bg-white p-4 sm:p-5 shadow-2xs space-y-3.5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#EFE4D6]/70 pb-3">
          <div>
            <h2 className="text-xs font-bold uppercase tracking-wider text-[#8C5E2D] flex items-center gap-1.5">
              <Scale className="h-4 w-4 text-[#C99A68]" />
              Parcours d&apos;Évaluation & Sélection CIAT (Pipeline en 3 étapes)
            </h2>
            <p className="text-[11px] text-[#5A4B42] mt-0.5">
              Cliquez sur une étape pour filtrer instantanément la file de traitement ci-dessous.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setActiveFilter("tous")}
            className={`text-xs px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer ${
              activeFilter === "tous"
                ? "bg-[#612D10] text-white shadow-2xs"
                : "bg-[#FAF7F2] text-[#612D10] border border-[#EFE4D6] hover:bg-[#EFE4D6]/60"
            }`}
          >
            Tous les dossiers ({stats.total})
          </button>
        </div>

        {/* 3 Cartes Étape du Pipeline */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {/* Étape 1 : Instruction & Pièces */}
          <button
            type="button"
            onClick={() => setActiveFilter("soumis")}
            className={`flex items-start gap-3.5 p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
              activeFilter === "soumis"
                ? "border-[#D97706] bg-amber-50/70 ring-2 ring-[#D97706]/30 shadow-xs"
                : "border-[#EFE4D6] bg-[#FAF7F2]/40 hover:bg-white hover:border-[#D97706]/60"
            }`}
          >
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-[#D97706] font-bold text-sm">
              1
            </div>
            <div className="space-y-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-bold text-[#21130D]">
                  Instruction & Pièces
                </span>
                <span className="rounded-md bg-amber-100 px-1.5 py-0.5 text-[10px] font-bold text-amber-800">
                  {stats.enAttente} à noter
                </span>
              </div>
              <p className="text-[11px] text-[#5A4B42] leading-snug">
                Vérification du dossier déposé, du pitch et des pièces justificatives.
              </p>
            </div>
          </button>

          {/* Étape 2 : Notation Multicritères Jury */}
          <button
            type="button"
            onClick={() => setActiveFilter("en_evaluation")}
            className={`flex items-start gap-3.5 p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
              activeFilter === "en_evaluation"
                ? "border-[#1D4ED8] bg-blue-50/70 ring-2 ring-[#1D4ED8]/30 shadow-xs"
                : "border-[#EFE4D6] bg-[#FAF7F2]/40 hover:bg-white hover:border-[#1D4ED8]/60"
            }`}
          >
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-100 text-[#1D4ED8] font-bold text-sm">
              2
            </div>
            <div className="space-y-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-bold text-[#21130D]">
                  Notation par le Jury
                </span>
                <span className="rounded-md bg-blue-100 px-1.5 py-0.5 text-[10px] font-bold text-blue-800">
                  {stats.enEvaluation} en jury
                </span>
              </div>
              <p className="text-[11px] text-[#5A4B42] leading-snug">
                5 critères officiels pondérés sur 100 points & avis argumenté.
              </p>
            </div>
          </button>

          {/* Étape 3 : Arbitrage & Décision Coordonnateur */}
          <button
            type="button"
            onClick={() => setActiveFilter("accepte")}
            className={`flex items-start gap-3.5 p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
              activeFilter === "accepte"
                ? "border-[#2E7D32] bg-emerald-50/70 ring-2 ring-[#2E7D32]/30 shadow-xs"
                : "border-[#EFE4D6] bg-[#FAF7F2]/40 hover:bg-white hover:border-[#2E7D32]/60"
            }`}
          >
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-[#2E7D32] font-bold text-sm">
              3
            </div>
            <div className="space-y-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-bold text-[#21130D]">
                  Décision d&apos;Incubation
                </span>
                <span className="rounded-md bg-emerald-100 px-1.5 py-0.5 text-[10px] font-bold text-emerald-800">
                  {stats.acceptes} admis ({stats.tauxSucces}%)
                </span>
              </div>
              <p className="text-[11px] text-[#5A4B42] leading-snug">
                Validation finale de l&apos;admission ou notification de rejet motivé.
              </p>
            </div>
          </button>
        </div>

        {/* Message d'orientation selon le rôle connecté */}
        <div className="flex items-center gap-2 p-2.5 rounded-xl bg-[#FAF7F2] border border-[#EFE4D6] text-xs text-[#612D10]">
          <Info className="h-4 w-4 shrink-0 text-[#C99A68]" />
          <span>
            {user?.role === "membre_comite" ? (
              <>
                <strong>Votre mission en tant que membre du jury :</strong> Cliquez sur un dossier à gauche, examinez les pièces (Étape 1), puis saisissez vos notes dans la grille multicritères (Étape 2). Le Coordonnateur validera ensuite la décision finale (Étape 3).
              </>
            ) : user?.role === "coordonnateur" || user?.role === "administrateur" ? (
              <>
                <strong>Votre mission en tant que coordonnateur :</strong> Supervisez l&apos;instruction (Étape 1), suivez les avis du jury (Étape 2), et prononcez l&apos;admission ou le rejet officiel (Étape 3).
              </>
            ) : (
              <>Sélectionnez une candidature pour consulter son état d&apos;instruction et la grille de notation.</>
            )}
          </span>
        </div>
      </div>

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
                {/* ── BARRE SUPÉRIEURE DU DOSSIER : IDENTITÉ & SAUT D'ÉTAPES ── */}
                <div className="rounded-2xl border border-[#EFE4D6] bg-white p-4 shadow-xs space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#EFE4D6]/70 pb-3">
                    <button
                      type="button"
                      onClick={() => setSelectedId(null)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-[#612D10] bg-[#FAF7F2] border border-[#EFE4D6] hover:bg-[#EFE4D6]/50 transition-colors cursor-pointer"
                    >
                      <ArrowLeft className="h-3.5 w-3.5" />
                      <span>Fermer la sélection</span>
                    </button>

                    {(user?.role === "coordonnateur" || user?.role === "administrateur") && (
                      <button
                        type="button"
                        onClick={() => {
                          scrollToStep("workflow-step-3");
                        }}
                        className="inline-flex items-center gap-2 rounded-xl bg-[#612D10] px-4 py-2 font-[family-name:var(--font-title)] text-xs font-bold text-white transition-all hover:bg-[#3F1D0A] hover:shadow-xs shadow-2xs cursor-pointer"
                      >
                        <ShieldCheck className="h-4 w-4 text-[#C99A68]" />
                        <span>Aller à la décision (Étape 3)</span>
                      </button>
                    )}
                  </div>

                  {/* Indicateur de statut dans le pipeline du dossier sélectionné */}
                  <div className="grid grid-cols-3 gap-2 text-center text-xs pt-1">
                    <div className="p-2 rounded-xl bg-emerald-50 border border-emerald-200/60 text-emerald-900">
                      <span className="block text-[10px] uppercase font-bold text-emerald-700">Étape 1</span>
                      <strong className="block text-[11px]">Pièces conformes</strong>
                      <span className="text-[10px] text-emerald-600">Dossier reçu</span>
                    </div>

                    <div className={`p-2 rounded-xl border text-center ${
                      selected.id in scores && scores[selected.id] != null
                        ? "bg-blue-50 border-blue-200 text-blue-900"
                        : "bg-amber-50 border-amber-200 text-amber-900"
                    }`}>
                      <span className="block text-[10px] uppercase font-bold">Étape 2</span>
                      <strong className="block text-[11px]">
                        {selected.id in scores && scores[selected.id] != null
                          ? `Score : ${scores[selected.id]?.toFixed(1)}/100`
                          : "À évaluer"}
                      </strong>
                      <span className="text-[10px] opacity-80">Grille jury</span>
                    </div>

                    <div className={`p-2 rounded-xl border text-center ${
                      selected.statut === "accepte"
                        ? "bg-emerald-50 border-emerald-200 text-emerald-900 font-bold"
                        : selected.statut === "refuse"
                        ? "bg-red-50 border-red-200 text-red-900 font-bold"
                        : "bg-[#FAF7F2] border-[#EFE4D6] text-[#5A4B42]"
                    }`}>
                      <span className="block text-[10px] uppercase font-bold">Étape 3</span>
                      <strong className="block text-[11px]">
                        {selected.statut === "accepte"
                          ? "Admis"
                          : selected.statut === "refuse"
                          ? "Non retenu"
                          : "En délibération"}
                      </strong>
                      <span className="text-[10px] opacity-80">Décision finale</span>
                    </div>
                  </div>

                  {/* Boutons de saut direct entre étapes */}
                  <div className="flex items-center justify-between gap-1 pt-1 border-t border-[#EFE4D6]/50 text-xs font-semibold text-[#8C5E2D]">
                    <span className="text-[11px]">Navigation rapide :</span>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <button
                        type="button"
                        onClick={() => scrollToStep("workflow-step-1")}
                        className="px-2 py-1 rounded-md bg-[#FAF7F2] border border-[#EFE4D6] text-[11px] hover:bg-white cursor-pointer"
                      >
                        1. Fiche & Pièces
                      </button>
                      <button
                        type="button"
                        onClick={() => scrollToStep("workflow-step-2")}
                        className="px-2 py-1 rounded-md bg-[#FAF7F2] border border-[#EFE4D6] text-[11px] hover:bg-white cursor-pointer"
                      >
                        2. Grille de notation
                      </button>
                      <button
                        type="button"
                        onClick={() => scrollToStep("workflow-step-3")}
                        className="px-2 py-1 rounded-md bg-[#FAF7F2] border border-[#EFE4D6] text-[11px] hover:bg-white cursor-pointer"
                      >
                        3. Délibération & Décision
                      </button>
                    </div>
                  </div>
                </div>

                {/* ── ÉTAPE 1 : INSTRUCTION DU DOSSIER & PIÈCES JUSTIFICATIVES ── */}
                <div id="workflow-step-1" className="space-y-4">
                  <div className="flex items-center justify-between bg-[#FAF7F2] p-2.5 px-3.5 rounded-xl border border-[#EFE4D6]">
                    <div className="flex items-center gap-2">
                      <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-[#612D10] text-white text-xs font-bold">
                        1
                      </span>
                      <span className="text-xs font-bold uppercase tracking-wider text-[#612D10]">
                        Étape 1 sur 3 — Fiche de candidature & Pièces justificatives
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => scrollToStep("workflow-step-2")}
                      className="inline-flex items-center gap-1 text-[11px] font-bold text-[#8C5E2D] hover:underline cursor-pointer"
                    >
                      <span>Passer à la notation</span>
                      <ArrowDown className="h-3 w-3" />
                    </button>
                  </div>

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
                  <div className="flex items-center justify-between bg-[#FAF7F2] p-2.5 px-3.5 rounded-xl border border-[#EFE4D6]">
                    <div className="flex items-center gap-2">
                      <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-[#612D10] text-white text-xs font-bold">
                        2
                      </span>
                      <span className="text-xs font-bold uppercase tracking-wider text-[#612D10]">
                        Étape 2 sur 3 — Grille de notation multicritères du jury (/100)
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => scrollToStep("workflow-step-3")}
                      className="inline-flex items-center gap-1 text-[11px] font-bold text-[#8C5E2D] hover:underline cursor-pointer"
                    >
                      <span>Passer à la décision</span>
                      <ArrowDown className="h-3 w-3" />
                    </button>
                  </div>

                  {(user?.role === "membre_comite" || user?.role === "administrateur") ? (
                    <ScoringGrid dossierId={selected.id} onEvaluated={refresh} />
                  ) : (
                    <div className="rounded-2xl border border-[#EFE4D6] bg-white p-5 space-y-3">
                      <div className="flex items-center gap-2 text-xs font-bold text-[#612D10]">
                        <Sliders className="h-4 w-4 text-[#C99A68]" />
                        <span>Grille de notation du projet</span>
                      </div>
                      <p className="text-xs text-[#5A4B42]">
                        En tant que Coordonnateur, vous observez les notations du jury et prononcez l&apos;admission finale à l&apos;Étape 3 ci-dessous.
                      </p>
                    </div>
                  )}
                </div>

                {/* ── ÉTAPE 3 : DÉLIBÉRATION, SYNTHÈSE DU JURY & DÉCISION FINALE ── */}
                <div id="workflow-step-3" className="space-y-4 pt-2">
                  <div className="flex items-center justify-between bg-[#FAF7F2] p-2.5 px-3.5 rounded-xl border border-[#EFE4D6]">
                    <div className="flex items-center gap-2">
                      <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-[#612D10] text-white text-xs font-bold">
                        3
                      </span>
                      <span className="text-xs font-bold uppercase tracking-wider text-[#612D10]">
                        Étape 3 sur 3 — Délibération & Décision d&apos;incubation
                      </span>
                    </div>
                  </div>

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

                    <div className="flex items-center justify-between p-3.5 rounded-xl bg-[#FAF7F2] border border-[#EFE4D6]">
                      <div>
                        <span className="text-xs font-semibold text-[#8C5E2D] block">
                          Score moyen consolidé du jury :
                        </span>
                        <span className="text-[11px] text-[#5A4B42]">
                          Calculé sur l&apos;ensemble des avis validés
                        </span>
                      </div>
                      <div className="text-right">
                        <strong className="text-xl font-extrabold text-[#612D10]">
                          {evals?.score_moyen == null
                            ? "En attente d'évaluation"
                            : `${evals.score_moyen.toFixed(1)} / 100`}
                        </strong>
                      </div>
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
                        Aucune évaluation n&apos;a encore été enregistrée pour ce projet. Remplissez la grille à l&apos;Étape 2 ci-dessus pour alimenter la délibération.
                      </p>
                    )}
                  </div>

                  {/* Panneau de décision finale réservé au Coordonnateur et à l'Admin */}
                  <div className="rounded-2xl border border-[#EFE4D6] bg-white p-5 shadow-xs space-y-4">
                    <div className="flex items-center gap-2 border-b border-[#EFE4D6]/70 pb-3">
                      <ShieldCheck className="h-5 w-5 text-[#C99A68]" />
                      <div>
                        <h3 className="font-[family-name:var(--font-title)] text-base font-bold text-[#612D10]">
                          Arbitrage officiel & Décision d&apos;incubation
                        </h3>
                        <p className="text-xs text-[#5A4B42]">
                          Validation d&apos;admission ou rejet motivé pour la promotion 2026
                        </p>
                      </div>
                    </div>

                    {/* Statut déjà prononcé ou formulaire actif */}
                    {selected.statut === "accepte" ? (
                      <div className="rounded-xl border border-emerald-200 bg-emerald-50/70 p-4 space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 text-xs font-bold text-emerald-900">
                            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                            <span>Décision prononcée : Candidature ADMISE à l&apos;incubateur CIAT</span>
                          </div>
                          <span className="text-[10px] text-emerald-800 font-semibold">Promotion 2026</span>
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
                            Modifier ou revoir la décision
                          </button>
                        )}
                      </div>
                    ) : selected.statut === "refuse" ? (
                      <div className="rounded-xl border border-red-200 bg-red-50/70 p-4 space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 text-xs font-bold text-red-900">
                            <XCircle className="h-4 w-4 text-red-600" />
                            <span>Décision prononcée : Candidature NON RETENUE</span>
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
                            Modifier ou revoir la décision
                          </button>
                        )}
                      </div>
                    ) : (user?.role === "coordonnateur" || user?.role === "administrateur") ? (
                      /* Formulaire de décision directe pour le coordonnateur */
                      <form onSubmit={handleInlineDecisionSubmit} className="space-y-4 pt-1">
                        <div>
                          <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-[#21130D]">
                            Issue de l&apos;arbitrage
                          </label>
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
                              <span>Accepter / Admettre</span>
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
                              <span>Refuser le dossier</span>
                            </button>
                          </div>
                        </div>

                        <div>
                          <div className="flex items-baseline justify-between mb-1.5">
                            <label
                              htmlFor="decision-motif-inline"
                              className="text-xs font-bold uppercase tracking-wider text-[#21130D]"
                            >
                              Motif de la décision <span className="text-red-600">* (obligatoire)</span>
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
                                ? "Précisez les atouts ayant motivé l'admission et les premiers jalons d'incubation prévus..."
                                : "Exposez les motifs factuels ayant conduit au refus pour retour pédagogique au porteur..."
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
                              <span>Enregistrer la décision d&apos;incubation</span>
                            </>
                          )}
                        </button>
                      </form>
                    ) : (
                      /* Information pour les membres du jury */
                      <div className="p-3.5 rounded-xl bg-amber-50/50 border border-amber-200/60 text-xs text-amber-900 space-y-1">
                        <strong className="block font-bold">Décision en cours d&apos;arbitrage :</strong>
                        <p className="text-[11px] leading-relaxed">
                          La décision officielle d&apos;admission ou de rejet est prononcée par le Coordonnateur de l&apos;incubateur CIAT après consultation des notes et avis émis par le jury à l&apos;Étape 2.
                        </p>
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
              /* =================================================================
                 ACCUEIL DU COCKPIT QUAND AUCUN DOSSIER N'EST SÉLECTIONNÉ
                 ================================================================= */
              <div className="rounded-2xl border border-[#EFE4D6] bg-white p-6 sm:p-8 shadow-xs space-y-6">
                <div className="flex items-start gap-4 border-b border-[#EFE4D6] pb-6">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#FAF7F2] border border-[#EFE4D6] text-[#612D10]">
                    <Sliders className="h-6 w-6 text-[#C99A68]" />
                  </div>
                  <div>
                    <span className="text-[11px] font-bold uppercase tracking-wider text-[#8C5E2D]">
                      Espace délibération & évaluation
                    </span>
                    <h2 className="font-[family-name:var(--font-title)] text-xl font-bold text-[#612D10] sm:text-2xl">
                      Cockpit d&apos;évaluation du comité
                    </h2>
                    <p className="mt-1 text-xs sm:text-sm text-[#6B5646] leading-relaxed">
                      👈 <strong>Étape 1 :</strong> Sélectionnez une candidature dans la liste de gauche pour afficher sa fiche complète, ses pièces justificatives et démarrer la notation.
                    </p>
                  </div>
                </div>

                {/* Explication pas à pas du workflow */}
                <div className="rounded-xl border border-[#EFE4D6] bg-[#FAF7F2]/50 p-4 space-y-3">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-[#612D10] flex items-center gap-1.5">
                    <FileCheck className="h-4 w-4 text-[#C99A68]" />
                    <span>Comment fonctionne l&apos;évaluation ? (Workflow en 3 étapes)</span>
                  </h3>
                  <div className="grid gap-2.5 sm:grid-cols-3 text-xs">
                    <div className="p-3 rounded-lg bg-white border border-[#EFE4D6] space-y-1">
                      <strong className="text-[#612D10] font-bold flex items-center gap-1">
                        <span className="flex h-4 w-4 items-center justify-center rounded-full bg-amber-100 text-amber-800 text-[10px]">1</span>
                        <span>Instruction</span>
                      </strong>
                      <p className="text-[11px] text-[#5A4B42]">
                        Vérification du pitch, du modèle économique et des pièces justificatives téléchargeables.
                      </p>
                    </div>

                    <div className="p-3 rounded-lg bg-white border border-[#EFE4D6] space-y-1">
                      <strong className="text-[#612D10] font-bold flex items-center gap-1">
                        <span className="flex h-4 w-4 items-center justify-center rounded-full bg-blue-100 text-blue-800 text-[10px]">2</span>
                        <span>Notation Jury</span>
                      </strong>
                      <p className="text-[11px] text-[#5A4B42]">
                        Évaluation individuelle sur 5 critères officiels (/100) avec avis motivé argumenté.
                      </p>
                    </div>

                    <div className="p-3 rounded-lg bg-white border border-[#EFE4D6] space-y-1">
                      <strong className="text-[#612D10] font-bold flex items-center gap-1">
                        <span className="flex h-4 w-4 items-center justify-center rounded-full bg-emerald-100 text-emerald-800 text-[10px]">3</span>
                        <span>Arbitrage</span>
                      </strong>
                      <p className="text-[11px] text-[#5A4B42]">
                        Le Coordonnateur statue sur l&apos;admission officielle ou notifie un refus motivé.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Dossiers prioritaires à évaluer */}
                {dossiersPrioritaires.length > 0 && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="text-xs font-bold uppercase tracking-wider text-[#8C5E2D] flex items-center gap-1.5">
                        <Clock className="h-3.5 w-3.5 text-amber-600" />
                        <span>Candidatures prioritaires en attente de notation</span>
                      </h3>
                      <span className="text-[11px] text-[#6B5646]">
                        {stats.enAttente} dossiers restants
                      </span>
                    </div>

                    <div className="grid gap-2.5 sm:grid-cols-3">
                      {dossiersPrioritaires.map((d) => (
                        <div
                          key={d.id}
                          className="flex flex-col justify-between p-3.5 rounded-xl border border-[#EFE4D6] bg-[#FAF7F2]/60 hover:bg-white hover:border-[#C99A68] hover:shadow-xs transition-all"
                        >
                          <div>
                            <span className="text-[10px] font-semibold text-[#8C5E2D] block">
                              {d.projet.domaine_nom || "Général"}
                            </span>
                            <h4 className="font-bold text-xs text-[#612D10] line-clamp-2 mt-0.5">
                              {d.projet.titre}
                            </h4>
                            <p className="text-[11px] text-[#6B5646] mt-1 truncate">
                              {d.porteur_nom}
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleSelectDossier(d.id)}
                            className="mt-3 inline-flex items-center justify-between w-full px-2.5 py-1.5 rounded-lg bg-white border border-[#EFE4D6] text-[11px] font-bold text-[#612D10] hover:bg-[#612D10] hover:text-white transition-colors cursor-pointer"
                          >
                            <span>Noter ce projet</span>
                            <ChevronRight className="h-3 w-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Rappel du barème officiel */}
                <div className="rounded-xl border border-[#EFE4D6] bg-[#FAF7F2]/40 p-5 space-y-3">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-[#612D10] flex items-center gap-1.5">
                    <Award className="h-4 w-4 text-[#C99A68]" />
                    <span>Barème multicritères officiel CIAT (Pondération sur 100)</span>
                  </h3>
                  <div className="grid gap-2.5 sm:grid-cols-2 text-xs">
                    <div className="p-2.5 rounded-lg bg-white border border-[#EFE4D6]">
                      <strong className="text-[#612D10] font-bold block">1. Pertinence du problème & solution</strong>
                      <span className="text-[#6B5646] text-[11px]">Coeff. 3 · Adéquation au marché et besoin réel</span>
                    </div>
                    <div className="p-2.5 rounded-lg bg-white border border-[#EFE4D6]">
                      <strong className="text-[#612D10] font-bold block">2. Caractère innovant & faisabilité</strong>
                      <span className="text-[#6B5646] text-[11px]">Coeff. 3 · Faisabilité technique au FabLab CIAT</span>
                    </div>
                    <div className="p-2.5 rounded-lg bg-white border border-[#EFE4D6]">
                      <strong className="text-[#612D10] font-bold block">3. Modèle économique & viabilité</strong>
                      <span className="text-[#6B5646] text-[11px]">Coeff. 2 · Capacité de génération de revenus</span>
                    </div>
                    <div className="p-2.5 rounded-lg bg-white border border-[#EFE4D6]">
                      <strong className="text-[#612D10] font-bold block">4. Équipe, compétences & complémentarité</strong>
                      <span className="text-[#6B5646] text-[11px]">Coeff. 2 · Leadership et motivation des porteurs</span>
                    </div>
                    <div className="p-2.5 rounded-lg bg-white border border-[#EFE4D6] sm:col-span-2">
                      <strong className="text-[#612D10] font-bold block">5. Impact socio-économique & durabilité</strong>
                      <span className="text-[#6B5646] text-[11px]">Coeff. 2 · Création d&apos;emplois, ancrage local Diamniadio et RSE</span>
                    </div>
                  </div>
                </div>
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
