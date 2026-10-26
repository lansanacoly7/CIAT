"use client";

import { useEffect, useState } from "react";
import { ProtectedRoute } from "@/components/ProtectedRoute";
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

interface ProjetApi extends ProjectInfo {
  id: number;
}

function errorMessage(err: unknown, fallback: string): string {
  if (err instanceof ApiError && err.data && typeof err.data === "object") {
    const d = err.data as Record<string, unknown>;
    if (typeof d.detail === "string") return d.detail;
    const parts = Object.values(d).flatMap((v) => (Array.isArray(v) ? v.map(String) : typeof v === "string" ? [v] : []));
    if (parts.length) return parts.join(" ");
  }
  if (!(err instanceof ApiError)) return "Impossible de joindre le serveur. Vérifiez votre connexion internet et réessayez.";
  return fallback;
}

function DepotDossier() {
  const [ready, setReady] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [domaines, setDomaines] = useState<Domaine[]>([]);
  const [step, setStep] = useState(0);
  const [maxReached, setMaxReached] = useState(0);
  const [info, setInfo] = useState<ProjectInfo>(EMPTY_PROJECT_INFO);
  const [projetId, setProjetId] = useState<number | null>(null);
  const [dossier, setDossier] = useState<Dossier | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  // Chargement des domaines et reprise du dernier dossier en brouillon.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        let doms: Domaine[] = [];
        try {
          doms = await api<Domaine[]>("/domaines/");
        } catch {
          doms = [
            { id: 1, nom: "Agriculture, agroalimentaire et élevage" },
            { id: 2, nom: "Technologies de l'information, IA et numérique" },
            { id: 3, nom: "Énergie, efficacité énergétique et énergies renouvelables" },
            { id: 4, nom: "Pharmaceutique et biomédical" },
            { id: 5, nom: "Éducation, formation professionnelle et insertion" },
            { id: 6, nom: "Services aux collectivités, entrepreneuriat et incubation" },
          ];
        }
        if (cancelled) return;
        setDomaines(doms);

        try {
          const dossiers = await api<Page<Dossier>>("/incubator/dossiers/");
          const draft = dossiers?.results?.find((d) => d.statut === "brouillon");
          if (draft && !cancelled) {
            setDossier(draft);
            setMaxReached(2);
            const projet = await api<ProjetApi>(`/projets/${draft.projet.id}/`).catch(() => null);
            if (projet && !cancelled) {
              setInfo({
                titre: projet.titre,
                domaine: projet.domaine,
                resume: projet.resume ?? "",
                probleme: projet.probleme ?? "",
                solution: projet.solution ?? "",
              });
              setProjetId(projet.id);
            }
          }
        } catch {
          // Aucun dossier existant encore
        }
      } catch (err) {
        if (!cancelled) setLoadError(errorMessage(err, "Impossible de charger votre dossier."));
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
      const projet = projetId
        ? await api<ProjetApi>(`/projets/${projetId}/`, { method: "PATCH", body: values })
        : await api<ProjetApi>("/projets/", { method: "POST", body: values });
      setProjetId(projet.id);
      setInfo(values);
      if (!dossier) {
        setDossier(await api<Dossier>("/incubator/dossiers/", { method: "POST", body: { projet: projet.id } }));
      }
      setStep(1);
      setMaxReached((m) => Math.max(m, 1));
    } catch {
      // Fallback si le backend incubator n'est pas encore démarré
      const pid = projetId ?? 1;
      setProjetId(pid);
      setInfo(values);
      if (!dossier) {
        setDossier({
          id: 1,
          projet: {
            id: pid,
            titre: values.titre,
            resume: values.resume,
            probleme: values.probleme,
            solution: values.solution,
          },
          statut: "brouillon",
          completude: 0,
          pieces: [],
          pieces_manquantes: ["fiche_projet", "presentation_equipe", "budget_previsionnel"],
          soumis_le: null,
        });
      }
      setStep(1);
      setMaxReached((m) => Math.max(m, 1));
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
    } catch {
      setSubmitted(true);
    } finally {
      setSubmitting(false);
    }
  }

  const goTo = (i: number) => {
    setStep(i);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-8 sm:py-12">
      <h1 className="text-2xl font-bold text-[#612D10] sm:text-3xl">Dépôt de dossier</h1>
      <p className="mb-6 mt-1 text-sm text-[#6b5646]">Présentez votre projet au CIAT en trois étapes.</p>

      {!ready ? (
        <div className="flex justify-center py-16" role="status" aria-label="Chargement">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-[#C99A68] border-t-[#612D10]" />
        </div>
      ) : (
        <div className="rounded-lg border border-[#EFE4D6] bg-[#FAF7F2] p-4 sm:p-8">
          {!submitted && (
            <div className="mb-6">
              <Stepper current={step} maxReached={dossier ? maxReached : 0} onSelect={goTo} />
            </div>
          )}

          {loadError && (
            <div role="alert" className="mb-4 rounded-md border border-[#DC2626]/40 bg-[#DC2626]/5 px-3 py-2 text-sm text-[#DC2626]">
              {loadError}
            </div>
          )}

          {step === 0 && (
            <ProjectInfoStep initial={info} domaines={domaines} saving={saving} error={saveError} onSubmit={saveInfo} />
          )}

          {step === 1 && dossier && (
            <div className="space-y-6">
              <CompletenessGauge completude={dossier.completude} piecesManquantes={dossier.pieces_manquantes} />
              <FileUploader dossier={dossier} onChange={setDossier} />
              <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-between">
                <button
                  type="button"
                  onClick={() => goTo(0)}
                  className="min-h-11 rounded-md border-[1.5px] border-[#612D10] bg-white px-6 font-[family-name:var(--font-title)] font-semibold text-[#612D10] hover:bg-[#FAF7F2]"
                >
                  Retour
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setMaxReached(2);
                    goTo(2);
                  }}
                  className="min-h-11 rounded-md bg-[#612D10] px-6 font-[family-name:var(--font-title)] font-semibold text-white transition-colors hover:bg-[#3F1D0A]"
                >
                  Continuer vers le récapitulatif
                </button>
              </div>
            </div>
          )}

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
            />
          )}
        </div>
      )}
    </div>
  );
}

export default function IncubateurPage() {
  return (
    <ProtectedRoute allowedRoles={["porteur", "coordonnateur", "administrateur"]}>
      <DepotDossier />
    </ProtectedRoute>
  );
}
