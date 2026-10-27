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
import { ChevronDown, ChevronUp } from "lucide-react";

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

  return (
    <div className="w-full">
      <div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8 space-y-6 sm:space-y-8">
        {/* Fil d'Ariane harmonisé */}
        <div className="flex items-center gap-1.5 text-xs font-semibold text-[#8C6D58]">
          <Link
            href="/incubateur/projets"
            className="hover:text-[#612D10] hover:underline transition-colors"
          >
            Suivi des projets
          </Link>
          <span className="text-[#C99A68]/60">/</span>
          <span className="text-[#612D10] font-bold">Dépôt de candidature</span>
        </div>

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
                    className="inline-flex min-h-11 items-center justify-center rounded-xl bg-white px-5 text-sm font-bold text-[#612D10] shadow-md transition-all hover:bg-[#FAF7F2] hover:text-[#3F1D0A] hover:scale-[1.02] hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-[#612D10]"
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
            {/* Bannière des 3 étapes du dépôt (disposition épurée conforme à la maquette) */}
            {!submitted && (
              <div className="rounded-2xl border border-[#EFE4D6] bg-white p-5 sm:p-6 shadow-sm">
                <Stepper current={step} maxReached={dossier ? maxReached : 0} onSelect={goTo} theme="light" />
              </div>
            )}

            {/* Grille adaptative : 2 colonnes à l'étape 1, pleine largeur à l'étape 2 pour les pièces justificatives */}
            {(() => {
              const showSidebar = !submitted && step === 0;
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
                        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between border-b border-[#EFE4D6]/80 pb-4">
                          <div>
                            <div className="text-[10px] font-extrabold uppercase tracking-widest text-[#A35926] mb-1">
                              DOSSIER DE CANDIDATURE · DÉPÔT DOCUMENTAIRE
                            </div>
                            <h2 className="font-[family-name:var(--font-title)] text-xl sm:text-2xl font-bold tracking-tight text-[#24140D]">
                              Déposez vos pièces justificatives
                            </h2>
                            <p className="mt-0.5 text-xs sm:text-sm text-[#6B5646]">
                              Trois documents sont obligatoires pour que le comité de sélection puisse examiner votre candidature.
                            </p>
                          </div>
                          <span className="inline-flex w-fit items-center rounded-full border border-[#A35926]/30 bg-[#A35926]/10 px-3 py-1 text-xs font-bold text-[#A35926]">
                            Étape 2 sur 3
                          </span>
                        </div>

                        <CompletenessGauge
                          completude={dossier.completude}
                          piecesManquantes={dossier.pieces_manquantes}
                          pieces={dossier.pieces}
                        />

                        <FileUploader dossier={dossier} onChange={setDossier} />

                        <div className="flex flex-col-reverse gap-3 border-t border-[#EFE4D6] pt-4 sm:flex-row sm:justify-between">
                          <button
                            type="button"
                            onClick={() => goTo(0)}
                            className="inline-flex min-h-11 items-center justify-center rounded-xl border-1.5 border-[#612D10] bg-white px-6 font-[family-name:var(--font-title)] text-sm font-semibold text-[#612D10] transition-colors hover:bg-[#FAF7F2]"
                          >
                            ← Retour aux informations
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setMaxReached(2);
                              goTo(2);
                            }}
                            className="inline-flex min-h-11 items-center justify-center rounded-xl bg-[#612D10] px-7 font-[family-name:var(--font-title)] text-sm font-semibold text-white shadow-xs transition-colors hover:bg-[#3F1D0A]"
                          >
                            Continuer vers le récapitulatif →
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

                  {/* Colonne DROITE : Affichée uniquement à l'étape 1 */}
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

      {/* Carte principale porteur : sobre, humaine, purement typographique */}
      <div className={`overflow-hidden rounded-2xl border border-[#EFE4D6]/70 bg-white shadow-xs ${openMobile ? "block" : "hidden lg:block"}`}>
        {/* Photo d'immersion atelier technologique */}
        <div className="relative h-48 w-full overflow-hidden bg-[#FAF7F2] sm:h-56">
          <Image
            src="/images/ciat-depot-innovation.jpg"
            alt="Innovateurs CIAT travaillant sur un prototype"
            fill
            sizes="(max-width: 1024px) 100vw, 420px"
            className="object-cover object-center"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/10 to-transparent" />
        </div>

        {/* Contenu textuel et micro-étapes typographiques (sans icônes) */}
        <div className="p-5 sm:p-6 space-y-5">
          <div className="space-y-2">
            <span className="inline-block text-[11px] font-bold uppercase tracking-wider text-[#A35926]">
              Espace porteur de projet
            </span>
            <h2 id="makerspace-titre" className="font-[family-name:var(--font-title)] text-xl font-bold leading-snug text-[#24140D]">
              Votre idée mérite de prendre forme.
            </h2>
            <p className="text-xs leading-relaxed text-[#6b5646] sm:text-sm">
              Présentez le problème que vous souhaitez résoudre et la solution technologique que vous développez avec le CIAT.
            </p>
          </div>

          {/* 3 micro-étapes avec numérotation sobre et lisible */}
          <div className="space-y-3 pt-1">
            <div className={`rounded-xl border p-4 transition-all ${step === 0 ? "border-[#C99A68] bg-[#FAF7F2]/80 shadow-xs" : "border-[#EFE4D6] bg-white"}`}>
              <div className="flex items-baseline gap-2">
                <span className="font-mono text-xs font-bold text-[#A35926]">01.</span>
                <h3 className="text-xs font-bold uppercase tracking-wide text-[#24140D]">
                  Décrivez votre solution
                </h3>
              </div>
              <p className="mt-1 text-xs leading-relaxed text-[#6b5646]">
                Exposez clairement la valeur ajoutée et le secteur cible de votre innovation.
              </p>
            </div>

            <div className={`rounded-xl border p-4 transition-all ${step === 1 ? "border-[#C99A68] bg-[#FAF7F2]/80 shadow-xs" : "border-[#EFE4D6] bg-white"}`}>
              <div className="flex items-baseline gap-2">
                <span className="font-mono text-xs font-bold text-[#A35926]">02.</span>
                <h3 className="text-xs font-bold uppercase tracking-wide text-[#24140D]">
                  Ajoutez vos justificatifs
                </h3>
              </div>
              <p className="mt-1 text-xs leading-relaxed text-[#6b5646]">
                Fiche de projet, compétences clés de l&apos;équipe et budget prévisionnel.
              </p>
            </div>

            <div className={`rounded-xl border p-4 transition-all ${step === 2 ? "border-[#C99A68] bg-[#FAF7F2]/80 shadow-xs" : "border-[#EFE4D6] bg-white"}`}>
              <div className="flex items-baseline gap-2">
                <span className="font-mono text-xs font-bold text-[#A35926]">03.</span>
                <h3 className="text-xs font-bold uppercase tracking-wide text-[#24140D]">
                  Suivez votre candidature
                </h3>
              </div>
              <p className="mt-1 text-xs leading-relaxed text-[#6b5646]">
                Instruction par le comité sous 10 jours ouvrés avec mentorat dédié.
              </p>
            </div>
          </div>

          {/* Réassurance sobre en pied de carte */}
          <div className="rounded-xl border border-[#EFE4D6] bg-[#FAF7F2] px-3.5 py-2.5 text-xs text-[#612D10]">
            Votre candidature est sauvegardée automatiquement à chaque étape.
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
