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
import { ArrowLeft, ArrowRight, ChevronDown, ChevronUp } from "lucide-react";

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
            const projet = await api<ProjetApi>(`/projets/${draft.projet.id}/`).catch(() => null);
            if (projet && !cancelled) {
              setDossier(draft);
              setMaxReached(2);
              setInfo({
                titre: projet.titre,
                domaine: projet.domaine,
                resume: projet.resume ?? "",
                probleme: projet.probleme ?? "",
                solution: projet.solution ?? "",
              });
              setProjetId(projet.id);
            } else if (!cancelled) {
              setDossier(null);
              setProjetId(null);
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
      let projet: ProjetApi;
      if (projetId) {
        try {
          projet = await api<ProjetApi>(`/projets/${projetId}/`, { method: "PATCH", body: values });
        } catch (patchErr) {
          if (patchErr instanceof ApiError && patchErr.status === 404) {
            // Le projet lié en mémoire n'existe plus en base : création à neuf
            projet = await api<ProjetApi>("/projets/", { method: "POST", body: values });
            setDossier(null);
          } else {
            throw patchErr;
          }
        }
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
    <div className="w-full">
      <div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8 space-y-6 sm:space-y-8">

        {/* 1. HERO BANNER EN CARTE INTÉGRÉE (Harmonisée avec /incubateur/projets et /compte) */}
        <div className="relative overflow-hidden rounded-2xl border border-[#3d2315] bg-[#1F130B] shadow-sm">
          {/* Photo panoramique de fond — 100% nette et contrastée, sans voile blanc */}
          <div className="relative h-48 w-full sm:h-56 lg:h-60">
            <Image
              src="/images/ciat-header-panoramique.jpg"
              alt="Campus d'innovation CIAT · ISEP Diamniadio"
              fill
              priority
              className="object-cover object-center"
            />
            {/* Dégradé sombre horizontal pour une lisibilité parfaite des textes à gauche */}
            <div className="absolute inset-0 bg-gradient-to-r from-[#1F130B]/95 via-[#1F130B]/80 to-[#1F130B]/30" />

            {/* Textes posés directement sur l'image */}
            <div className="absolute inset-0 flex flex-col justify-center px-6 sm:px-8 lg:px-10">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="max-w-2xl space-y-1.5">
                  {/* Surtitre éditorial pur */}
                  <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-[#E5B887]">
                    <span>Incubateur CIAT · ISEP Diamniadio</span>
                    <span className="text-white/30">/</span>
                    <span className="text-white/80 font-medium">Cohorte 2026</span>
                  </div>
                  {/* Titre en dégradé doré vers marron noble CIAT */}
                  <h1 className="font-[family-name:var(--font-title)] text-2xl font-extrabold tracking-tight sm:text-3xl lg:text-4xl">
                    <span className="bg-gradient-to-r from-[#FEE5C5] via-[#DDA76A] to-[#A35926] bg-clip-text text-transparent">
                      Dépôt de candidature
                    </span>
                  </h1>
                  <p className="max-w-xl text-xs leading-relaxed text-[#FAF7F2]/90 drop-shadow-sm sm:text-sm">
                    Candidatez à l’accompagnement du CIAT pour prototyper, valider et accélérer votre innovation technologique.
                  </p>
                </div>

                {/* Bouton Mes projets */}
                <div className="flex items-center shrink-0">
                  <Link
                    href="/incubateur/projets"
                    className="inline-flex min-h-11 items-center justify-center rounded-xl bg-white px-5 text-sm font-bold text-[#612D10] shadow-md transition-all hover:bg-[#F2E5D5] hover:text-[#3F1D0A] hover:scale-[1.02] hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-[#612D10] active:scale-[0.98] cursor-pointer"
                  >
                    Mes projets
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 2. ZONE PRINCIPALE : PASSERELLE D'ÉTAPE ET FORMULAIRE */}
        {!ready ? (
          <div className="flex justify-center py-16" role="status" aria-label="Chargement">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-[#C99A68] border-t-[#612D10]" />
          </div>
        ) : (
          <div className="space-y-6 sm:space-y-8">
            {/* Passerelle d'étape : console en carte blanche douce avec annonce de la prochaine étape */}
            {!submitted && (
              <div className="rounded-2xl border border-[#EFE4D6] bg-white p-5 sm:p-6 shadow-sm">
                <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
                  <div className="min-w-0 flex-1">
                    <Stepper current={step} maxReached={dossier ? maxReached : 0} theme="light" />
                  </div>
                  {/* Annonce claire de l'étape suivante */}
                  <div className="hidden border-l border-[#EFE4D6] pl-6 lg:block lg:max-w-xs shrink-0">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-[#8C6D4F]">
                      Prochaine étape
                    </span>
                    <p className="mt-0.5 text-xs font-semibold text-[#612D10]">
                      {step === 0 && "2. Dépôt des 3 pièces justificatives"}
                      {step === 1 && "3. Récapitulatif & Soumission au comité"}
                      {step === 2 && "Instruction par le comité CIAT"}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Grille 2 colonnes : conserve l'accompagnement Maker Space aux 3 étapes (1, 2 et 3) */}
            {(() => {
              const showSidebar = !submitted;
              return (
                <div className={showSidebar ? "grid gap-8 lg:grid-cols-[minmax(0,1.8fr)_minmax(320px,1fr)] lg:items-start" : "w-full"}>
                  {/* Conteneur principal */}
                  <div className={`rounded-2xl border border-[#EFE4D6]/70 bg-white p-6 shadow-xs sm:p-8 ${!showSidebar ? "w-full" : ""}`}>
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
                      <div className="space-y-5">
                        {/* En-tête sobre identique à l'étape 1 */}
                        <div className="space-y-1 pb-1">
                          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-[#1F130B]">
                            Pièces justificatives
                          </h2>
                          <p className="text-sm text-[#4A3B32]">
                            Déposez les documents requis pour l&apos;instruction de votre candidature.
                          </p>
                        </div>

                        <CompletenessGauge
                          completude={dossier.completude}
                          piecesManquantes={dossier.pieces_manquantes}
                          pieces={dossier.pieces}
                        />

                        <FileUploader dossier={dossier} onChange={setDossier} />

                        <div className="flex flex-col-reverse gap-3 border-t border-[#EFE4D6] pt-4 sm:flex-row sm:items-center sm:justify-between">
                          <button
                            type="button"
                            onClick={() => goTo(0)}
                            className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-[#C99A68] bg-white px-5 text-xs sm:text-sm font-bold text-[#612D10] whitespace-nowrap shadow-2xs transition-all hover:bg-[#FAF7F2] hover:border-[#612D10] hover:text-[#3F1D0A] active:scale-[0.98] cursor-pointer"
                          >
                            <ArrowLeft className="h-4 w-4 shrink-0 stroke-[2.2]" aria-hidden="true" />
                            <span>Retour aux informations</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setMaxReached(2);
                              goTo(2);
                            }}
                            className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-[#612D10] px-5 sm:px-6 text-xs sm:text-sm font-bold text-white whitespace-nowrap shadow-xs transition-all hover:bg-[#3F1D0A] hover:scale-[1.01] hover:shadow-md active:scale-[0.98] cursor-pointer"
                          >
                            <span>Continuer vers le récapitulatif</span>
                            <ArrowRight className="h-4 w-4 shrink-0 stroke-[2.2]" aria-hidden="true" />
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
                        onNewCandidature={handleNewCandidature}
                      />
                    )}
                  </div>

                  {/* Colonne DROITE : Accompagnement Maker Space sur les 3 étapes (1, 2 et 3) */}
                  {showSidebar && <MakerSpaceSidebar step={step} />}
                </div>
              );
            })()}
          </div>
        )}
      </div>
    </div>
  );
}

function MakerSpaceSidebar({ step }: { step: number }) {
  const [openMobile, setOpenMobile] = useState(false);

  return (
    <aside aria-labelledby="makerspace-titre" className="space-y-4 lg:sticky lg:top-8">
      {/* Bouton accordéon sur Mobile pour ne pas masquer le formulaire */}
      <div className="lg:hidden">
        <button
          type="button"
          onClick={() => setOpenMobile((v) => !v)}
          className="flex min-h-11 w-full items-center justify-between rounded-xl border border-[#EFE4D6] bg-white px-4 py-2.5 text-left text-sm font-semibold text-[#612D10] shadow-xs"
          aria-expanded={openMobile}
        >
          <span className="text-sm font-semibold text-[#612D10]">Espace porteur · Repères & Conseils</span>
          <span className="flex items-center gap-1 text-xs text-[#8C6D4F]">
            {openMobile ? (
              <>
                Masquer <ChevronUp className="h-4 w-4" />
              </>
            ) : (
              <>
                Afficher <ChevronDown className="h-4 w-4" />
              </>
            )}
          </span>
        </button>
      </div>

      {/* Carte principale Maker Space (Commit 4c9e34b) */}
      <div className={`overflow-hidden rounded-2xl border border-[#EFE4D6] bg-white shadow-xs ${openMobile ? "block" : "hidden lg:block"}`}>
        <div className="relative h-48 w-full bg-[#24140D] sm:h-52">
          <Image
            src="/images/ciat-depot-innovation.jpg"
            alt="Maker Space CIAT et prototypage technologique à l'ISEP Diamniadio"
            fill
            className="object-cover"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#1F130B]/90 via-[#1F130B]/30 to-transparent" />
          <div className="absolute bottom-3 left-4 right-4 text-white">
            <span className="inline-block rounded-md bg-[#C99A68] px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider text-[#1F130B]">
              Maker Space
            </span>
            <p className="mt-1 font-[family-name:var(--font-title)] text-xs font-semibold leading-tight text-white/95">
              Laboratoire de prototypage & transfert technologique
            </p>
          </div>
        </div>

        <div className="p-5">
          <h2 id="makerspace-titre" className="font-[family-name:var(--font-title)] text-base font-bold text-[#612D10]">
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
                    1. Fiche descriptive
                  </h3>
                  <p className="mt-1 text-xs text-[#6b5646]">
                    Résumez clairement les enjeux, la méthodologie et l&apos;impact attendu sur le terrain.
                  </p>
                </div>
                <div className="rounded-lg border border-[#EFE4D6] bg-[#FAF7F2] p-3">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-[#612D10]">
                    2. Présentation équipe
                  </h3>
                  <p className="mt-1 text-xs text-[#6b5646]">
                    Mettez en avant les compétences techniques, opérationnelles et managériales des porteurs.
                  </p>
                </div>
                <div className="rounded-lg border border-[#EFE4D6] bg-[#FAF7F2] p-3">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-[#612D10]">
                    3. Budget prévisionnel
                  </h3>
                  <p className="mt-1 text-xs text-[#6b5646]">
                    Estimez les coûts d&apos;expérimentation et d&apos;outillage pour maximiser vos chances de sélection.
                  </p>
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
                    1. Instruction par le comité
                  </h3>
                  <p className="mt-1 text-xs text-[#6b5646]">
                    Votre dossier sera instruit sous 10 jours ouvrés. Vous recevrez une notification par e-mail et sur votre espace.
                  </p>
                </div>
                <div className="rounded-lg border border-[#EFE4D6] bg-[#FAF7F2] p-3">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-[#612D10]">
                    2. Critères de sélection
                  </h3>
                  <p className="mt-1 text-xs text-[#6b5646]">
                    Faisabilité technologique, impact concret, cohérence du budget et motivation de l&apos;équipe.
                  </p>
                </div>
                <div className="rounded-lg border border-[#EFE4D6] bg-[#FAF7F2] p-3">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-[#612D10]">
                    3. Mentorat & FabLab
                  </h3>
                  <p className="mt-1 text-xs text-[#6b5646]">
                    Les projets admis bénéficient de l&apos;accès au Maker Space, aux bancs d&apos;essais de l&apos;ISEP et d&apos;un mentor attitré.
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
