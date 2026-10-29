"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { useAuth } from "@/context/AuthContext";
import CoordinationHome from "@/components/incubateur/CoordinationHome";
import { api, ApiError, type Page } from "@/lib/api";
import type { Dossier } from "@/lib/incubator";
import FileUploader from "@/components/incubateur/FileUploader";
import CompletenessGauge from "@/components/incubateur/CompletenessGauge";
import Stepper from "@/components/incubateur/Stepper";
import ProjectInfoStep, {
  EMPTY_PROJECT_INFO,
  type Domaine,
  type ProjectInfo,
} from "@/components/incubateur/ProjectInfoStep";
import SummaryStep from "@/components/incubateur/SummaryStep";
import { ArrowLeft, ArrowRight } from "lucide-react";

interface ProjetApi extends ProjectInfo {
  id: number;
}

function errorMessage(err: unknown, fallback: string): string {
  if (err instanceof ApiError && err.data && typeof err.data === "object") {
    const d = err.data as Record<string, unknown>;
    if (typeof d.detail === "string") {
      if (d.detail.includes("No Projet matches")) {
        return "Le projet associé a expiré ou a été réinitialisé. Veuillez cliquer à nouveau sur Continuer pour créer un nouveau dossier.";
      }
      return d.detail;
    }
    const parts = Object.values(d).flatMap((v) => (Array.isArray(v) ? v.map(String) : typeof v === "string" ? [v] : []));
    if (parts.length) return parts.join(" ");
  }
  if (!(err instanceof ApiError)) return "Impossible de joindre le serveur. Vérifiez votre connexion internet et réessayez.";
  return fallback;
}

const DEMO_DOSSIER_SUCCES: Dossier = {
  id: 42,
  projet: { id: 10, titre: "Système Solaire Intelligent pour l'Agriculture" },
  completude: 100,
  pieces: [
    { id: 1, type: "fiche_projet", nom: "fiche_projet_ciat.pdf", cree_le: "2026-10-28" },
    { id: 2, type: "presentation_equipe", nom: "equipe_fondatrice.pdf", cree_le: "2026-10-28" },
    { id: 3, type: "budget_previsionnel", nom: "budget_previsionnel_2026.pdf", cree_le: "2026-10-28" },
  ],
  pieces_manquantes: [],
  statut: "soumis",
  cree_le: "2026-10-28T10:00:00Z",
  soumis_le: "2026-10-28T10:05:00Z",
} as unknown as Dossier;

function checkApercuMode(): boolean {
  if (typeof window === "undefined") return false;
  try {
    const params = new URLSearchParams(window.location.search);
    return params.get("apercu_succes") === "1" || params.get("succes") === "1";
  } catch {
    return false;
  }
}

function DepotDossier() {
  const [ready, setReady] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [domaines, setDomaines] = useState<Domaine[]>([]);
  const [step, setStep] = useState(() => (checkApercuMode() ? 2 : 0));
  const [maxReached, setMaxReached] = useState(() => (checkApercuMode() ? 2 : 0));
  const [info, setInfo] = useState<ProjectInfo>(() =>
    checkApercuMode()
      ? { ...EMPTY_PROJECT_INFO, titre: "Système Solaire Intelligent pour l'Agriculture" }
      : EMPTY_PROJECT_INFO
  );
  const [projetId, setProjetId] = useState<number | null>(() => (checkApercuMode() ? 10 : null));
  const [dossier, setDossier] = useState<Dossier | null>(() => (checkApercuMode() ? DEMO_DOSSIER_SUCCES : null));
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(checkApercuMode);

  // Chargement des domaines et reprise du dernier dossier en brouillon.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const doms = await api<Domaine[]>("/domaines/");
        if (cancelled) return;
        setDomaines(doms);

        if (checkApercuMode()) return;

        try {
          const dossiers = await api<Page<Dossier>>("/incubator/dossiers/");
          const draft = dossiers?.results?.find((d) => d.statut === "brouillon");
          if (draft && !cancelled) {
            setDossier(draft);
            if (draft.projet.id) {
              setProjetId(draft.projet.id);
              try {
                const p = await api<ProjetApi>(`/projets/${draft.projet.id}/`);
                if (!cancelled) {
                  setInfo({
                    titre: p.titre || "",
                    resume: p.resume || "",
                    probleme: p.probleme || "",
                    solution: p.solution || "",
                    domaine: p.domaine ?? null,
                  });
                  setMaxReached(1);
                }
              } catch {
                // Projet orphelin, on repart d'un formulaire vierge
              }
            }
          }
        } catch {
          // Premier passage sans dossier
        }
      } catch (err) {
        if (!cancelled) setLoadError(errorMessage(err, "Impossible de charger les données initiales."));
      } finally {
        if (!cancelled) setReady(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  async function saveInfo(values: ProjectInfo) {
    setSaving(true);
    setSaveError(null);
    try {
      let projet: ProjetApi;
      if (projetId) {
        projet = await api<ProjetApi>(`/projets/${projetId}/`, { method: "PUT", body: values });
      } else {
        projet = await api<ProjetApi>("/projets/", { method: "POST", body: values });
      }

      setProjetId(projet.id);
      setInfo(values);

      let currentDossier = dossier;
      if (!currentDossier) {
        try {
          currentDossier = await api<Dossier>("/incubator/dossiers/", { method: "POST", body: { projet: projet.id } });
          setDossier(currentDossier);
        } catch {
          const dossiers = await api<Page<Dossier>>("/incubator/dossiers/").catch(() => null);
          const found = dossiers?.results?.find((d) => d.projet?.id === projet.id);
          if (found) setDossier(found);
        }
      }
      setStep(1);
      setMaxReached((m) => Math.max(m, 1));
    } catch (err) {
      setSaveError(errorMessage(err, "Impossible d'enregistrer le projet. Veuillez vérifier les informations et réessayer."));
    } finally {
      setSaving(false);
    }
  }

  async function submitDossier() {
    if (!dossier || submitting) return;
    setSubmitting(true);
    setSubmitError(null);
    try {
      await api(`/incubator/dossiers/${dossier.id}/soumettre/`, { method: "POST" });
      setSubmitted(true);
    } catch (err) {
      setSubmitError(errorMessage(err, "Impossible de soumettre le dossier. Veuillez vérifier que toutes les pièces sont fournies et réessayer."));
    } finally {
      setSubmitting(false);
    }
  }

  const goTo = (i: number) => {
    setStep(i);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  function handleNewCandidature() {
    setSubmitted(false);
    setStep(0);
    setMaxReached(0);
    setProjetId(null);
    setDossier(null);
    setInfo(EMPTY_PROJECT_INFO);
    setSaveError(null);
    setSubmitError(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  return (
    <div className="w-full min-h-[calc(100vh-4rem)] bg-white">
      <div className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6 sm:py-10 space-y-8">
        
        {/* Navigation & fil d'Ariane */}
        <div className="flex items-center justify-between">
          <nav aria-label="Fil d'Ariane" className="flex items-center gap-1.5 text-xs font-medium text-[#8C6D58]">
            <span className="text-[#8C6D58]">Espace Porteur</span>
            <span className="text-[#C99A68]/60">/</span>
            <span className="text-[#24140D] font-semibold">Dépôt de candidature</span>
          </nav>
          <Link
            href="/incubateur/projets"
            className="text-xs font-semibold text-[#612D10] hover:text-[#A35926] hover:underline transition-colors"
          >
            Voir mes projets existants →
          </Link>
        </div>

        {/* En-tête sobre et centré */}
        <header className="space-y-1.5 border-b border-[#EFE4D6] pb-6">
          <h1 className="font-[family-name:var(--font-title)] text-2xl sm:text-3xl font-extrabold tracking-tight text-[#24140D]">
            Dépôt de candidature
          </h1>
          <p className="text-xs sm:text-sm text-[#6b5646]">
            Complétez les 3 étapes pour soumettre votre projet au comité d&apos;incubation du CIAT.
          </p>
        </header>

        {!ready ? (
          <div className="flex justify-center py-20" role="status" aria-label="Chargement">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-[#C99A68] border-t-[#612D10]" />
          </div>
        ) : (
          <div className="space-y-6">
            
            {/* Stepper centré et fin */}
            {!submitted && (
              <div className="rounded-2xl border border-[#EFE4D6] bg-white p-4 sm:p-5 shadow-2xs">
                <Stepper current={step} maxReached={dossier ? maxReached : 0} theme="light" />
              </div>
            )}

            {/* Corps du formulaire épuré */}
            <div className="rounded-2xl border border-[#EFE4D6] bg-white p-6 sm:p-8 shadow-2xs">
              {loadError && (
                <div role="alert" className="mb-4 rounded-xl border border-[#DC2626]/30 bg-[#DC2626]/5 px-4 py-3 text-sm text-[#DC2626]">
                  {loadError}
                </div>
              )}

              {/* Étape 1 : Informations du projet */}
              <div className={step === 0 ? "" : "hidden"}>
                <ProjectInfoStep initial={info} domaines={domaines} saving={saving} error={saveError} onSubmit={saveInfo} />
              </div>

              {/* Étape 2 : Pièces justificatives */}
              {step === 1 && dossier && (
                <div className="space-y-6">
                  <div className="space-y-1 border-b border-[#EFE4D6] pb-4">
                    <h2 className="text-xl font-bold tracking-tight text-[#24140D]">
                      Pièces justificatives
                    </h2>
                    <p className="text-xs sm:text-sm text-[#6b5646]">
                      Téléversez les documents nécessaires pour permettre l&apos;évaluation par le comité.
                    </p>
                  </div>

                  <CompletenessGauge
                    completude={dossier.completude}
                    piecesManquantes={dossier.pieces_manquantes}
                    pieces={dossier.pieces}
                  />

                  <FileUploader dossier={dossier} onChange={setDossier} />

                  <div className="flex items-center justify-between gap-3 border-t border-[#EFE4D6] pt-5">
                    <button
                      type="button"
                      onClick={() => goTo(0)}
                      className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-[#EFE4D6] bg-white px-4 text-xs sm:text-sm font-semibold text-[#612D10] shadow-2xs hover:bg-[#FAF7F2] hover:border-[#C99A68] transition-all cursor-pointer"
                    >
                      <ArrowLeft className="h-4 w-4" aria-hidden="true" />
                      <span>Retour</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setMaxReached(2);
                        goTo(2);
                      }}
                      className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl bg-[#612D10] hover:bg-[#3F1D0A] px-5 text-xs sm:text-sm font-semibold text-white shadow-xs transition-all hover:scale-[1.01] cursor-pointer"
                    >
                      <span>Continuer vers le récapitulatif</span>
                      <ArrowRight className="h-4 w-4" aria-hidden="true" />
                    </button>
                  </div>
                </div>
              )}

              {/* Étape 3 : Récapitulatif & Soumission */}
              {step === 2 && dossier && (
                <SummaryStep
                  info={info}
                  domaines={domaines}
                  dossier={dossier}
                  submitting={submitting}
                  submitted={submitted}
                  error={submitError}
                  onEdit={goTo}
                  onSubmit={submitDossier}
                  onNewCandidature={handleNewCandidature}
                />
              )}
            </div>

          </div>
        )}

      </div>
    </div>
  );
}

function IncubateurHome() {
  const { user } = useAuth();
  const coordination = user?.role === "coordonnateur" || user?.role === "administrateur";
  return coordination ? <CoordinationHome /> : <DepotDossier />;
}

export default function IncubateurPage() {
  return (
    <ProtectedRoute allowedRoles={["porteur", "coordonnateur", "administrateur"]}>
      <IncubateurHome />
    </ProtectedRoute>
  );
}
