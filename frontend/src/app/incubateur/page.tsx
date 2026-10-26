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
        const doms = await api<Domaine[]>("/domaines/");
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
        const nouveauDossier = await api<Dossier>("/incubator/dossiers/", { method: "POST", body: { projet: projet.id } });
        setDossier(nouveauDossier);
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

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-8 sm:py-12">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3 border-b border-[#EFE4D6] pb-4">
        <div>
          <h1 className="text-2xl font-bold text-[#612D10] sm:text-3xl">Dépôt de dossier</h1>
          <p className="mt-1 text-sm text-[#6b5646]">Présentez votre projet au CIAT en trois étapes.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {dossier && !submitted && (
            <span className="inline-flex min-h-9 items-center gap-2 rounded-full border border-[#C99A68]/60 bg-[#FAF7F2] px-3 text-xs font-semibold text-[#612D10]">
              <span aria-hidden className="h-2 w-2 rounded-full bg-[#C99A68]" />
              Brouillon enregistré · Dossier n°{dossier.id}
            </span>
          )}
          <Link
            href="/incubateur/projets"
            className="inline-flex min-h-11 items-center rounded-lg border border-[#EFE4D6] bg-white px-4 text-sm font-semibold text-[#612D10] transition-colors hover:bg-[#FAF7F2]"
          >
            Suivi de mes projets
          </Link>
        </div>
      </div>

      {!ready ? (
        <div className="flex justify-center py-16" role="status" aria-label="Chargement">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-[#C99A68] border-t-[#612D10]" />
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-[minmax(0,7fr)_minmax(0,3fr)] lg:items-start">
          <div className="rounded-xl border border-[#EFE4D6] bg-white p-4 shadow-sm sm:p-8">
            {!submitted && (
              <div className="mb-8 border-b border-[#EFE4D6] pb-6">
                <Stepper current={step} maxReached={dossier ? maxReached : 0} onSelect={goTo} />
              </div>
            )}

            {loadError && (
              <div role="alert" className="mb-4 rounded-lg border border-[#DC2626]/40 bg-[#DC2626]/5 px-3 py-2 text-sm text-[#DC2626]">
                {loadError}
              </div>
            )}

            {/* L'étape 1 reste montée (simplement masquée) pour ne perdre aucune saisie en navigant. */}
            <div className={step === 0 ? "" : "hidden"}>
              <ProjectInfoStep initial={info} domaines={domaines} saving={saving} error={saveError} onSubmit={saveInfo} />
            </div>

            {step === 1 && dossier && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl font-bold text-[#612D10]">Déposez vos pièces justificatives</h2>
                  <p className="mt-1 text-sm text-[#6b5646]">
                    Trois documents sont obligatoires pour que le comité puisse examiner votre candidature.
                  </p>
                </div>
                <CompletenessGauge
                  completude={dossier.completude}
                  piecesManquantes={dossier.pieces_manquantes}
                  pieces={dossier.pieces}
                />
                <FileUploader dossier={dossier} onChange={setDossier} />
                <div className="flex flex-col-reverse gap-3 border-t border-[#EFE4D6] pt-5 sm:flex-row sm:justify-between">
                  <button
                    type="button"
                    onClick={() => goTo(0)}
                    className="min-h-12 rounded-lg border-[1.5px] border-[#612D10] bg-white px-6 font-[family-name:var(--font-title)] font-semibold text-[#612D10] hover:bg-[#FAF7F2]"
                  >
                    Retour
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setMaxReached(2);
                      goTo(2);
                    }}
                    className="min-h-12 rounded-lg bg-[#612D10] px-8 font-[family-name:var(--font-title)] font-semibold text-white transition-colors hover:bg-[#3F1D0A]"
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

          {!submitted && <ConseilsCiat />}
        </div>
      )}
    </div>
  );
}

function ConseilsCiat() {
  return (
    <aside
      aria-labelledby="conseils-titre"
      className="rounded-xl border border-[#EFE4D6] bg-white p-5 shadow-sm lg:sticky lg:top-24"
    >
      <h2 id="conseils-titre" className="font-[family-name:var(--font-title)] text-base font-bold text-[#612D10]">
        Conseils CIAT pour votre candidature
      </h2>
      <div className="mt-4 space-y-4 text-sm leading-relaxed text-[#24140D]">
        <section>
          <h3 className="font-semibold text-[#612D10]">Problème et solution</h3>
          <p className="text-[#6b5646]">
            Partez d&apos;un besoin réel et chiffré si possible. Décrivez qui est concerné, puis ce que votre solution change concrètement.
          </p>
        </section>
        <section>
          <h3 className="font-semibold text-[#612D10]">Pièces à fournir</h3>
          <p className="text-[#6b5646]">
            Fiche de projet, présentation de l&apos;équipe et budget prévisionnel. Formats PDF ou Word, 10 Mo maximum par fichier.
          </p>
        </section>
        <section>
          <h3 className="font-semibold text-[#612D10]">Ce que le comité examine</h3>
          <ul className="list-inside list-disc text-[#6b5646]">
            <li>La pertinence du problème</li>
            <li>La clarté et l&apos;innovation de la solution</li>
            <li>La solidité de l&apos;équipe</li>
            <li>La cohérence du budget</li>
          </ul>
        </section>
        <section className="rounded-lg bg-[#FAF7F2] p-3">
          <h3 className="font-semibold text-[#612D10]">Brouillon enregistré</h3>
          <p className="text-[#6b5646]">
            Vos informations sont enregistrées à chaque étape validée : vous pouvez quitter la page et reprendre plus tard.
          </p>
        </section>
      </div>
    </aside>
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
