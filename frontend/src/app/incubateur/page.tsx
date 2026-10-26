"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
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
    <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
      {/* En-tête immersif et institutionnel */}
      <div className="mb-8 rounded-2xl border border-[#EFE4D6] bg-white p-6 shadow-sm sm:p-8">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-[#612D10]/10 px-3 py-1 text-xs font-bold uppercase tracking-wider text-[#612D10]">
                <span className="h-2 w-2 rounded-full bg-[#C99A68]" />
                Incubateur CIAT · ISEP Diamniadio
              </span>
              <span className="inline-flex items-center rounded-full border border-[#C99A68]/40 bg-[#FAF7F2] px-2.5 py-0.5 text-xs font-semibold text-[#612D10]">
                Cohorte 2026
              </span>
            </div>
            <h1 className="font-[family-name:var(--font-title)] text-2xl font-extrabold text-[#612D10] sm:text-3xl">
              Dépôt de candidature
            </h1>
            <p className="text-sm text-[#6b5646] sm:text-base">
              Candidatez à l’accompagnement du CIAT pour prototyper, valider et accélérer votre innovation technologique.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {dossier && !submitted && (
              <span className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-[#C99A68]/50 bg-[#FAF7F2] px-3.5 text-xs font-semibold text-[#612D10]">
                <span aria-hidden className="h-2.5 w-2.5 rounded-full bg-[#2E7D32]" />
                Brouillon enregistré · Dossier n°{dossier.id}
              </span>
            )}
            <Link
              href="/incubateur/projets"
              className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-[#612D10] bg-white px-4 text-sm font-semibold text-[#612D10] transition-colors hover:bg-[#FAF7F2]"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              Suivi de mes projets
            </Link>
          </div>
        </div>
      </div>

      {!ready ? (
        <div className="flex justify-center py-16" role="status" aria-label="Chargement">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-[#C99A68] border-t-[#612D10]" />
        </div>
      ) : (
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1.8fr)_minmax(320px,1fr)] lg:items-start">
          <div className="rounded-2xl border border-[#EFE4D6] bg-white p-6 shadow-sm sm:p-8">
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

          {!submitted && <AccompagnementCiat step={step} />}
        </div>
      )}
    </div>
  );
}

function AccompagnementCiat({ step }: { step: number }) {
  return (
    <aside aria-labelledby="accompagnement-titre" className="space-y-6 lg:sticky lg:top-8">
      <div className="overflow-hidden rounded-2xl border border-[#EFE4D6] bg-white shadow-sm">
        <div className="relative h-48 w-full bg-[#24140D] sm:h-52">
          <Image
            src="/images/ciat-depot-innovation.jpg"
            alt="Atelier d'innovation et prototypage technologique au CIAT"
            fill
            className="object-cover"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#1F130B]/90 via-[#1F130B]/30 to-transparent" />
          <div className="absolute bottom-3 left-4 right-4 text-white">
            <span className="inline-block rounded-md bg-[#C99A68] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[#1F130B]">
              Atelier d&apos;Éclosion
            </span>
            <p className="mt-1 font-[family-name:var(--font-title)] text-xs font-semibold leading-tight text-white/95">
              Laboratoire de prototypage & transfert technologique
            </p>
          </div>
        </div>

        <div className="p-5">
          <h2 id="accompagnement-titre" className="font-[family-name:var(--font-title)] text-base font-bold text-[#612D10]">
            Conseils pour votre candidature
          </h2>

          <div className="mt-4 space-y-4 text-sm leading-relaxed text-[#24140D]">
            {step === 0 && (
              <div className="space-y-3">
                <div className="rounded-lg border border-[#EFE4D6] bg-[#FAF7F2] p-3">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-[#612D10]">
                    1. Le problème identifié
                  </h3>
                  <p className="mt-1 text-xs text-[#6b5646]">
                    Partez d&apos;un besoin réel du terrain. Précisez qui subit ce dysfonctionnement et quel est son impact concret.
                  </p>
                </div>
                <div className="rounded-lg border border-[#EFE4D6] bg-[#FAF7F2] p-3">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-[#612D10]">
                    2. La solution proposée
                  </h3>
                  <p className="mt-1 text-xs text-[#6b5646]">
                    Expliquez en quoi votre prototype ou méthode apporte une réponse plus accessible, performante ou durable.
                  </p>
                </div>
              </div>
            )}

            {step === 1 && (
              <div className="space-y-3">
                <div className="rounded-lg border border-[#EFE4D6] bg-[#FAF7F2] p-3">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-[#612D10]">
                    Pièces obligatoires (100% requis)
                  </h3>
                  <ul className="mt-2 space-y-1.5 text-xs text-[#6b5646]">
                    <li className="flex items-center gap-1.5">
                      <span className="h-1.5 w-1.5 rounded-full bg-[#C99A68]" />
                      <strong>Fiche de projet</strong> : Résumé structuré
                    </li>
                    <li className="flex items-center gap-1.5">
                      <span className="h-1.5 w-1.5 rounded-full bg-[#C99A68]" />
                      <strong>Présentation équipe</strong> : Compétences clés
                    </li>
                    <li className="flex items-center gap-1.5">
                      <span className="h-1.5 w-1.5 rounded-full bg-[#C99A68]" />
                      <strong>Budget prévisionnel</strong> : Estimation claire
                    </li>
                  </ul>
                </div>
                <p className="text-xs text-[#6b5646]">
                  Formats acceptés : PDF ou Word (.docx). Limite : 10 Mo par document.
                </p>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-3">
                <div className="rounded-lg border border-[#EFE4D6] bg-[#FAF7F2] p-3">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-[#612D10]">
                    Instruction par le comité
                  </h3>
                  <p className="mt-1 text-xs text-[#6b5646]">
                    Votre dossier sera instruit sous 10 jours ouvrés. Vous recevrez une notification par email dès que l&apos;évaluation sera disponible.
                  </p>
                </div>
                <div className="rounded-lg border border-[#EFE4D6] bg-[#FAF7F2] p-3">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-[#612D10]">
                    Mentorat & Prototypage
                  </h3>
                  <p className="mt-1 text-xs text-[#6b5646]">
                    Les projets admis bénéficient de l&apos;accès au FabLab, aux bancs d&apos;essais de l&apos;ISEP et d&apos;un mentor attitré.
                  </p>
                </div>
              </div>
            )}

            <div className="border-t border-[#EFE4D6] pt-3 text-xs text-[#6b5646]">
              <p className="flex items-center gap-1.5 font-medium text-[#612D10]">
                <svg className="h-4 w-4 text-[#2E7D32]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Sauvegarde automatique à chaque étape validée
              </p>
            </div>
          </div>
        </div>
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
