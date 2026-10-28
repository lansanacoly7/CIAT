"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  FolderKanban,
  Clock,
  Sparkles,
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
} from "lucide-react";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { useAuth } from "@/context/AuthContext";
import { api, ApiError, type Page } from "@/lib/api";
import type { Dossier, DossierStatut, ProjetData } from "@/lib/incubator";
import EvaluationDossierList, {
  type DossierEval,
} from "@/components/incubateur/EvaluationDossierList";
import DossierDetailCard, {
  type EvaluationsSummary,
} from "@/components/incubateur/DossierDetailCard";
import ScoringGrid from "@/components/incubateur/ScoringGrid";
import DecisionModal from "@/components/incubateur/DecisionModal";

type ProjetFull = ProjetData & { porteur_nom?: string };

function message(err: unknown, fallback: string) {
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
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [scores, setScores] = useState<Record<number, number | null>>({});
  const [evals, setEvals] = useState<EvaluationsSummary | null>(null);
  const [evalsLoading, setEvalsLoading] = useState(false);
  const [evalsError, setEvalsError] = useState<string | null>(null);
  const [decisionOpen, setDecisionOpen] = useState(false);
  const [activeFilter, setActiveFilter] = useState<DossierStatut | "tous">("tous");

  const loadDossiers = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    try {
      const page = await api<Page<Dossier> | Dossier[]>("/incubator/dossiers/");
      const rawList = Array.isArray(page) ? page : page.results ?? [];
      const list = rawList.filter((d) => d.statut !== "brouillon");

      // Enrichissement des détails du projet si disponible
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

  const selected = dossiers.find((d) => d.id === selectedId) ?? null;

  const refresh = () => {
    loadDossiers(true);
    if (selectedId !== null) loadEvaluations(selectedId);
  };

  // Statistiques calculées pour le bandeau KPI
  const stats = useMemo(() => {
    const total = dossiers.length;
    const enAttente = dossiers.filter((d) => d.statut === "soumis").length;
    const enEvaluation = dossiers.filter((d) => d.statut === "en_evaluation").length;
    const acceptes = dossiers.filter((d) => d.statut === "accepte").length;
    const refuses = dossiers.filter((d) => d.statut === "refuse").length;

    // Calcul du score moyen global
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

  // Dossiers prioritaires à suggérer à l'accueil
  const dossiersPrioritaires = useMemo(() => {
    return dossiers
      .filter((d) => d.statut === "soumis" || (d.id in scores ? scores[d.id] == null : d.score_moyen == null))
      .slice(0, 3);
  }, [dossiers, scores]);

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-6 sm:py-8 space-y-6">
      {/* 1. En-tête principal & Contexte */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-[#EFE4D6] pb-5">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-[#FAF7F2] border border-[#EFE4D6] px-3 py-0.5 text-xs font-bold uppercase tracking-wider text-[#8C5E2D]">
              <Sparkles className="h-3 w-3 text-[#C99A68]" />
              Incubateur CIAT • Comité de Sélection 2026
            </span>
            {user?.role && (
              <span className="hidden sm:inline-flex items-center gap-1 text-[11px] font-semibold text-[#612D10] bg-[#EFE4D6]/50 px-2.5 py-0.5 rounded-full">
                <UserCheck className="h-3 w-3 text-[#C99A68]" />
                {user.role === "coordonnateur"
                  ? "Coordonnateur"
                  : user.role === "administrateur"
                  ? "Administrateur"
                  : "Membre du jury"}
              </span>
            )}
          </div>
          <h1 className="text-2xl font-black text-[#612D10] sm:text-3xl font-[family-name:var(--font-title)] tracking-tight">
            Évaluation des dossiers
          </h1>
          <p className="text-xs sm:text-sm text-[#6B5646]">
            Examinez les candidatures soumises, consultez les pièces justificatives et notez les projets selon la grille multicritères officielle.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-center">
          <button
            type="button"
            onClick={refresh}
            disabled={refreshing}
            className="inline-flex items-center gap-2 rounded-xl border border-[#EFE4D6] bg-white px-3.5 py-2 text-xs font-bold text-[#612D10] transition-all hover:bg-[#FAF7F2] hover:border-[#C99A68] shadow-2xs disabled:opacity-60"
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
          className="rounded-xl border border-red-200 bg-red-50 p-4 text-xs font-semibold text-red-700 shadow-2xs"
        >
          {error}
        </div>
      )}

      {/* 2. Bandeau de statistiques KPI cliquables */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {/* Total */}
        <button
          type="button"
          onClick={() => setActiveFilter("tous")}
          className={`flex flex-col text-left p-3.5 rounded-xl border transition-all ${
            activeFilter === "tous"
              ? "border-[#612D10] bg-[#612D10] text-white shadow-xs"
              : "border-[#EFE4D6] bg-white text-[#24140D] hover:bg-[#FAF7F2] hover:border-[#C99A68]"
          }`}
        >
          <div className="flex items-center justify-between text-xs">
            <span className={`font-bold uppercase tracking-wider text-[11px] ${activeFilter === "tous" ? "text-amber-200" : "text-[#8C5E2D]"}`}>
              Total dossiers
            </span>
            <FolderKanban className={`h-4 w-4 ${activeFilter === "tous" ? "text-white" : "text-[#C99A68]"}`} />
          </div>
          <span className="mt-2 text-2xl font-black font-[family-name:var(--font-title)]">
            {stats.total}
          </span>
          <span className={`text-[10px] mt-0.5 ${activeFilter === "tous" ? "text-white/80" : "text-[#8C5E2D]"}`}>
            {stats.tauxTraite}% statués
          </span>
        </button>

        {/* En attente */}
        <button
          type="button"
          onClick={() => setActiveFilter("soumis")}
          className={`flex flex-col text-left p-3.5 rounded-xl border transition-all ${
            activeFilter === "soumis"
              ? "border-[#D97706] bg-[#D97706] text-white shadow-xs"
              : "border-[#EFE4D6] bg-white text-[#24140D] hover:bg-amber-50/50 hover:border-amber-300"
          }`}
        >
          <div className="flex items-center justify-between text-xs">
            <span className={`font-bold uppercase tracking-wider text-[11px] ${activeFilter === "soumis" ? "text-amber-100" : "text-amber-700"}`}>
              À évaluer
            </span>
            <Clock className={`h-4 w-4 ${activeFilter === "soumis" ? "text-white" : "text-amber-600"}`} />
          </div>
          <span className="mt-2 text-2xl font-black font-[family-name:var(--font-title)]">
            {stats.enAttente}
          </span>
          <span className={`text-[10px] mt-0.5 ${activeFilter === "soumis" ? "text-white/80" : "text-amber-700"}`}>
            Soumis non notés
          </span>
        </button>

        {/* En évaluation */}
        <button
          type="button"
          onClick={() => setActiveFilter("en_evaluation")}
          className={`flex flex-col text-left p-3.5 rounded-xl border transition-all ${
            activeFilter === "en_evaluation"
              ? "border-[#1D4ED8] bg-[#1D4ED8] text-white shadow-xs"
              : "border-[#EFE4D6] bg-white text-[#24140D] hover:bg-blue-50/50 hover:border-blue-300"
          }`}
        >
          <div className="flex items-center justify-between text-xs">
            <span className={`font-bold uppercase tracking-wider text-[11px] ${activeFilter === "en_evaluation" ? "text-blue-100" : "text-blue-700"}`}>
              En jury
            </span>
            <Sparkles className={`h-4 w-4 ${activeFilter === "en_evaluation" ? "text-white" : "text-blue-600"}`} />
          </div>
          <span className="mt-2 text-2xl font-black font-[family-name:var(--font-title)]">
            {stats.enEvaluation}
          </span>
          <span className={`text-[10px] mt-0.5 ${activeFilter === "en_evaluation" ? "text-white/80" : "text-blue-700"}`}>
            Délibérations en cours
          </span>
        </button>

        {/* Acceptés */}
        <button
          type="button"
          onClick={() => setActiveFilter("accepte")}
          className={`flex flex-col text-left p-3.5 rounded-xl border transition-all ${
            activeFilter === "accepte"
              ? "border-[#2E7D32] bg-[#2E7D32] text-white shadow-xs"
              : "border-[#EFE4D6] bg-white text-[#24140D] hover:bg-emerald-50/50 hover:border-emerald-300"
          }`}
        >
          <div className="flex items-center justify-between text-xs">
            <span className={`font-bold uppercase tracking-wider text-[11px] ${activeFilter === "accepte" ? "text-emerald-100" : "text-[#2E7D32]"}`}>
              Retenus
            </span>
            <CheckCircle2 className={`h-4 w-4 ${activeFilter === "accepte" ? "text-white" : "text-[#2E7D32]"}`} />
          </div>
          <span className="mt-2 text-2xl font-black font-[family-name:var(--font-title)]">
            {stats.acceptes}
          </span>
          <span className={`text-[10px] mt-0.5 ${activeFilter === "accepte" ? "text-white/80" : "text-[#2E7D32]"}`}>
            Taux : {stats.tauxSucces}%
          </span>
        </button>

        {/* Refusés */}
        <button
          type="button"
          onClick={() => setActiveFilter("refuse")}
          className={`flex flex-col text-left p-3.5 rounded-xl border col-span-2 sm:col-span-1 transition-all ${
            activeFilter === "refuse"
              ? "border-[#DC2626] bg-[#DC2626] text-white shadow-xs"
              : "border-[#EFE4D6] bg-white text-[#24140D] hover:bg-red-50/50 hover:border-red-300"
          }`}
        >
          <div className="flex items-center justify-between text-xs">
            <span className={`font-bold uppercase tracking-wider text-[11px] ${activeFilter === "refuse" ? "text-red-100" : "text-red-700"}`}>
              Non retenus
            </span>
            <XCircle className={`h-4 w-4 ${activeFilter === "refuse" ? "text-white" : "text-red-600"}`} />
          </div>
          <span className="mt-2 text-2xl font-black font-[family-name:var(--font-title)]">
            {stats.refuses}
          </span>
          <span className={`text-[10px] mt-0.5 ${activeFilter === "refuse" ? "text-white/80" : "text-red-700"}`}>
            Rejet motivé
          </span>
        </button>
      </div>

      {/* 3. Zone principale en Master-Detail (2 panneaux ergonomiques) */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3" role="status" aria-label="Chargement">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-[#C99A68] border-t-[#612D10]" />
          <p className="text-xs font-semibold text-[#8C5E2D]">Chargement des candidatures...</p>
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-12 items-start">
          {/* Panneau gauche : File d'attente des dossiers (42% de l'écran) */}
          <section
            className="lg:col-span-5 h-[calc(100vh-270px)] min-h-[560px]"
            aria-label="Liste des dossiers"
          >
            <EvaluationDossierList
              dossiers={dossiers}
              selectedId={selectedId}
              scores={scores}
              onSelect={(id) => setSelectedId((prev) => (prev === id ? null : id))}
              activeFilter={activeFilter}
              onFilterChange={setActiveFilter}
            />
          </section>

          {/* Panneau droit : Cockpit & Fiche détaillée (58% de l'écran) */}
          <section
            className="lg:col-span-7 h-[calc(100vh-270px)] min-h-[560px] overflow-y-auto pr-1 space-y-6"
            aria-label="Détail du dossier"
          >
            {selected ? (
              <div className="space-y-6 animate-in fade-in duration-200">
                {/* Barre d'action supérieure du dossier sélectionné */}
                <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3.5 rounded-2xl border border-[#EFE4D6] shadow-xs">
                  <button
                    type="button"
                    onClick={() => setSelectedId(null)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-[#612D10] bg-[#FAF7F2] border border-[#EFE4D6] hover:bg-[#EFE4D6]/50 transition-colors"
                  >
                    <ArrowLeft className="h-3.5 w-3.5" />
                    <span>Fermer la sélection</span>
                  </button>

                  {(user?.role === "coordonnateur" || user?.role === "administrateur") && (
                    <button
                      type="button"
                      onClick={() => setDecisionOpen(true)}
                      className="inline-flex items-center gap-2 rounded-xl bg-[#612D10] px-4 py-2 font-[family-name:var(--font-title)] text-xs font-bold text-white transition-all hover:bg-[#3F1D0A] hover:shadow-xs shadow-2xs"
                    >
                      <ShieldCheck className="h-4 w-4 text-[#C99A68]" />
                      <span>Rendre la décision d&apos;incubation</span>
                    </button>
                  )}
                </div>

                {/* Fiche complète du projet avec ses pièces justificatives */}
                <DossierDetailCard
                  dossier={selected}
                  evaluations={evals}
                  evaluationsLoading={evalsLoading}
                  evaluationsError={evalsError}
                />

                {/* Grille de notation : visible pour les membres du comité et l'admin */}
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
                      setDossiers((list) =>
                        list.map((d) => (d.id === updated.id ? { ...d, statut: updated.statut } : d)),
                      );
                      setDecisionOpen(false);
                      refresh();
                    }}
                  />
                )}
              </div>
            ) : (
              /* Accueil Cockpit quand aucun dossier n'est sélectionné */
              <div className="rounded-2xl border border-[#EFE4D6] bg-white p-6 sm:p-8 shadow-xs space-y-6">
                <div className="flex items-start gap-4 border-b border-[#EFE4D6] pb-6">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#FAF7F2] border border-[#EFE4D6] text-[#612D10]">
                    <Sliders className="h-6 w-6 text-[#C99A68]" />
                  </div>
                  <div>
                    <span className="text-[11px] font-bold uppercase tracking-wider text-[#8C5E2D]">
                      Espace délibération
                    </span>
                    <h2 className="font-[family-name:var(--font-title)] text-xl font-bold text-[#612D10] sm:text-2xl">
                      Cockpit d&apos;évaluation du comité
                    </h2>
                    <p className="mt-1 text-xs sm:text-sm text-[#6B5646] leading-relaxed">
                      Sélectionnez un projet dans la liste de gauche pour afficher sa fiche complète, ses pièces justificatives et attribuer vos notes selon la grille multicritères officielle.
                    </p>
                  </div>
                </div>

                {/* Dossiers prioritaires à évaluer */}
                {dossiersPrioritaires.length > 0 && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="text-xs font-bold uppercase tracking-wider text-[#8C5E2D] flex items-center gap-1.5">
                        <Clock className="h-3.5 w-3.5 text-amber-600" />
                        <span>Candidatures prioritaires en attente</span>
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
                            onClick={() => setSelectedId(d.id)}
                            className="mt-3 inline-flex items-center justify-between w-full px-2.5 py-1.5 rounded-lg bg-white border border-[#EFE4D6] text-[11px] font-bold text-[#612D10] hover:bg-[#612D10] hover:text-white transition-colors"
                          >
                            <span>Noter ce projet</span>
                            <ChevronRight className="h-3 w-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Rappel de la grille officielle */}
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

                <div className="flex items-center gap-2 p-3 rounded-xl bg-amber-50/60 border border-amber-200/60 text-xs text-amber-900">
                  <Info className="h-4 w-4 shrink-0 text-amber-700" />
                  <span>
                    Les membres du jury attribuent une note pour chaque critère et un avis motivé. Le coordonnateur s&apos;appuie sur ce score moyen pour prononcer l&apos;admission finale.
                  </span>
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
