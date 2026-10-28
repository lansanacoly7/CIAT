"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCircle2,
  Clock,
  Download,
  FileText,
  FolderOpen,
  Info,
  Pencil,
  PlusCircle,
} from "lucide-react";
import { telechargerAccuseReception, suiviErrorMessage, type Dossier } from "@/lib/incubator";
import type { Domaine, ProjectInfo } from "./ProjectInfoStep";

export const PIECE_LABELS: Record<string, string> = {
  fiche_projet: "Fiche de projet",
  presentation_equipe: "Présentation de l'équipe",
  budget_previsionnel: "Budget prévisionnel",
  autre: "Autre document",
};

const label = (type: string) => PIECE_LABELS[type] ?? type;

function SectionCard({
  title,
  count,
  onEdit,
  children,
}: {
  title: string;
  count?: number;
  onEdit: () => void;
  children: ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-[#EFE4D6] bg-white p-5 sm:p-6 shadow-sm transition-all hover:shadow-md space-y-4">
      <div className="flex items-center justify-between pb-3 border-b border-[#EFE4D6]/70">
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-[#A35926]" />
          <h3 className="font-[family-name:var(--font-title)] text-sm sm:text-base font-bold text-[#612D10] tracking-wide uppercase">
            {title} {typeof count === "number" && <span className="font-normal text-[#8C6D4F]">({count})</span>}
          </h3>
        </div>
        <button
          type="button"
          onClick={onEdit}
          className="inline-flex min-h-9 items-center gap-1.5 rounded-lg border border-[#EFE4D6] bg-white px-3 py-1.5 text-xs font-semibold text-[#612D10] transition-colors hover:border-[#C99A68] hover:bg-[#FAF7F2]"
        >
          <Pencil className="h-3.5 w-3.5 text-[#A35926]" aria-hidden="true" />
          <span>Modifier</span>
        </button>
      </div>
      {children}
    </section>
  );
}

function DataRow({ name, value }: { name: string; value?: string }) {
  return (
    <div className="py-2.5 sm:grid sm:grid-cols-3 sm:gap-4 border-b border-[#EFE4D6]/40 last:border-b-0">
      <dt className="text-xs sm:text-sm font-semibold text-[#6b5646]">{name}</dt>
      <dd className="mt-1 whitespace-pre-line text-xs sm:text-sm leading-relaxed text-[#24140D] sm:col-span-2 sm:mt-0 font-medium">
        {value?.trim() || <span className="italic font-normal text-[#8C6D4F]">Non renseigné</span>}
      </dd>
    </div>
  );
}

export default function SummaryStep({
  info,
  domaines,
  dossier,
  submitting,
  submitted,
  error,
  onEdit,
  onSubmit,
  onNewCandidature,
}: {
  info: ProjectInfo;
  domaines: Domaine[];
  dossier: Dossier;
  submitting: boolean;
  submitted: boolean;
  error: string | null;
  onEdit: (step: number) => void;
  onSubmit: () => void;
  onNewCandidature?: () => void;
}) {
  const [downloadingAccuse, setDownloadingAccuse] = useState(false);
  const [accuseError, setAccuseError] = useState<string | null>(null);

  const missing = dossier.pieces_manquantes ?? [];
  const incomplete = dossier.completude < 100 || missing.length > 0;

  async function handleTelechargerAccuse() {
    setDownloadingAccuse(true);
    setAccuseError(null);
    try {
      const blob = await telechargerAccuseReception(dossier.id);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `accuse_reception_dossier_${dossier.id}.pdf`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.setTimeout(() => window.URL.revokeObjectURL(url), 1000);
    } catch (err) {
      setAccuseError(suiviErrorMessage(err, "Impossible de télécharger l'accusé de réception. Veuillez réessayer."));
    } finally {
      setDownloadingAccuse(false);
    }
  }

  // ÉCRAN DE CONFIRMATION DE SUCCÈS APRÈS SOUMISSION (Design institutionnel enrichi CIAT)
  if (submitted) {
    const domaineNom = domaines.find((d) => String(d.id) === String(info.domaine))?.nom || "Innovation technologique";
    const piecesFournies = (dossier.pieces ?? []).length;
    const dateDepot = new Date().toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });

    return (
      <div role="status" className="w-full max-w-4xl mx-auto space-y-6">
        {/* 1. CARTE PRINCIPALE DE CÉLÉBRATION AVEC MICRO-ANIMATION */}
        <div className="relative overflow-hidden rounded-3xl border border-[#2E7D32]/30 bg-gradient-to-b from-[#F2FBF4] via-white to-white p-6 sm:p-10 shadow-sm text-center">
          {/* Lueur d'ambiance en arrière-plan */}
          <div className="pointer-events-none absolute -top-16 left-1/2 -translate-x-1/2 h-44 w-72 rounded-full bg-[#2E7D32]/10 blur-3xl" />

          {/* Icône animée avec double onde de succès */}
          <div className="relative mx-auto mb-4 flex h-20 w-20 items-center justify-center">
            <span className="absolute inset-0 rounded-full bg-[#2E7D32]/20 animate-ping opacity-75" />
            <span className="absolute -inset-1.5 rounded-full bg-[#2E7D32]/15" />
            <div className="relative flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-[#2E7D32] to-[#1E5624] text-white shadow-lg shadow-[#2E7D32]/25">
              <Check className="h-8 w-8 stroke-[3]" aria-hidden="true" />
            </div>
          </div>

          {/* Badge officiel de statut */}
          <div className="inline-flex items-center gap-2 rounded-full border border-[#2E7D32]/30 bg-[#2E7D32]/10 px-3.5 py-1 text-xs font-bold text-[#1E5624] mb-3">
            <span className="h-2 w-2 rounded-full bg-[#2E7D32] animate-pulse" />
            <span>Candidature enregistrée avec succès</span>
            <span className="text-[#2E7D32]/40">·</span>
            <span>Réf. CIAT-{dossier.id}</span>
          </div>

          {/* Titre solennel */}
          <h1 className="font-[family-name:var(--font-title)] text-2xl sm:text-3xl lg:text-4xl font-extrabold text-[#1F130B] tracking-tight">
            Félicitations, votre dossier a été transmis !
          </h1>

          <p className="mx-auto mt-2 max-w-2xl text-xs sm:text-sm text-[#4A3B32] leading-relaxed">
            Votre projet <strong className="text-[#612D10]">« {info.titre || "Projet CIAT"} »</strong> a été officiellement déposé auprès de l&apos;incubateur du CIAT (ISEP Diamniadio). Il entre désormais dans le circuit d&apos;évaluation de la cohorte 2026.
          </p>

          {/* Actions principales hiérarchisées : 2 boutons majeurs */}
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href="/incubateur/projets"
              className="inline-flex min-h-11 w-full sm:w-auto items-center justify-center gap-2 rounded-xl bg-[#612D10] px-6 text-sm font-bold text-white shadow-md transition-all hover:bg-[#3F1D0A] hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
            >
              <FolderOpen className="h-4 w-4" />
              <span>Suivre l&apos;avancement de mon projet</span>
              <ArrowRight className="h-4 w-4" />
            </Link>

            <button
              type="button"
              onClick={handleTelechargerAccuse}
              disabled={downloadingAccuse}
              className="inline-flex min-h-11 w-full sm:w-auto items-center justify-center gap-2 rounded-xl border-2 border-[#612D10] bg-white px-5 text-sm font-bold text-[#612D10] transition-all hover:bg-[#FAF7F2] hover:border-[#3F1D0A] hover:text-[#3F1D0A] shadow-xs active:scale-[0.98] cursor-pointer disabled:opacity-60"
            >
              {downloadingAccuse ? (
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-[#612D10]/40 border-t-[#612D10]" />
              ) : (
                <Download className="h-4 w-4 text-[#A35926]" aria-hidden="true" />
              )}
              <span>Télécharger l&apos;accusé officiel (PDF)</span>
            </button>
          </div>

          {accuseError && (
            <div role="alert" className="mx-auto mt-3 max-w-md rounded-xl border border-[#DC2626]/30 bg-[#DC2626]/5 p-2.5 text-xs text-[#DC2626]">
              {accuseError}
            </div>
          )}
        </div>

        {/* 2. GRILLE D'INFORMATIONS : RÉCAPITULATIF & PROCHAINES ÉTAPES DU COMITÉ */}
        <div className="grid gap-6 md:grid-cols-2">
          {/* CARTE A : RÉCAPITULATIF OFFICIEL DU DÉPÔT */}
          <div className="rounded-2xl border border-[#EFE4D6] bg-white p-6 shadow-xs space-y-4">
            <div className="flex items-center gap-2.5 pb-3 border-b border-[#EFE4D6]">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#FAF4ED] text-[#612D10]">
                <FileText className="h-4 w-4" />
              </div>
              <div>
                <h3 className="font-[family-name:var(--font-title)] text-sm font-bold text-[#24140D]">
                  Récapitulatif du dépôt
                </h3>
                <p className="text-[11px] text-[#8C6D4F]">Enregistré en base le {dateDepot}</p>
              </div>
            </div>

            <div className="space-y-3 text-xs">
              <div className="flex justify-between items-center py-1.5 border-b border-[#EFE4D6]/50">
                <span className="text-[#6b5646]">Numéro de dossier</span>
                <span className="font-bold text-[#1F130B]">#DOS-{dossier.id}</span>
              </div>
              <div className="flex justify-between items-center py-1.5 border-b border-[#EFE4D6]/50">
                <span className="text-[#6b5646]">Projet</span>
                <span className="font-semibold text-[#612D10] truncate max-w-[200px]">{info.titre || "Sans titre"}</span>
              </div>
              <div className="flex justify-between items-center py-1.5 border-b border-[#EFE4D6]/50">
                <span className="text-[#6b5646]">Filière</span>
                <span className="font-semibold text-[#24140D]">{domaineNom}</span>
              </div>
              <div className="flex justify-between items-center py-1.5 border-b border-[#EFE4D6]/50">
                <span className="text-[#6b5646]">Pièces justificatives</span>
                <span className="inline-flex items-center gap-1 font-semibold text-[#2E7D32]">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  <span>{piecesFournies} document{piecesFournies > 1 ? "s" : ""} transmis</span>
                </span>
              </div>
              <div className="flex justify-between items-center py-1.5">
                <span className="text-[#6b5646]">Statut actuel</span>
                <span className="rounded-full bg-[#E8F5E9] px-2.5 py-0.5 font-bold text-[#1E5624] text-[10.5px]">
                  En cours d&apos;examen
                </span>
              </div>
            </div>
          </div>

          {/* CARTE B : CALENDRIER ET ÉTAPES DU PROCESSUS */}
          <div className="rounded-2xl border border-[#EFE4D6] bg-white p-6 shadow-xs space-y-4">
            <div className="flex items-center gap-2.5 pb-3 border-b border-[#EFE4D6]">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#FAF4ED] text-[#612D10]">
                <Clock className="h-4 w-4" />
              </div>
              <div>
                <h3 className="font-[family-name:var(--font-title)] text-sm font-bold text-[#24140D]">
                  Les prochaines étapes
                </h3>
                <p className="text-[11px] text-[#8C6D4F]">Processus d&apos;admission CIAT</p>
              </div>
            </div>

            <ol className="space-y-3.5 text-xs">
              <li className="flex gap-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#2E7D32] text-white text-[11px] font-bold">
                  ✓
                </span>
                <div>
                  <p className="font-bold text-[#1F130B]">1. Dépôt et enregistrement</p>
                  <p className="text-[11px] text-[#6b5646]">Votre candidature est scellée et horodatée.</p>
                </div>
              </li>
              <li className="flex gap-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#C99A68] text-[#1F130B] text-[11px] font-bold">
                  2
                </span>
                <div>
                  <p className="font-bold text-[#1F130B]">2. Vérification d&apos;éligibilité (48h)</p>
                  <p className="text-[11px] text-[#6b5646]">Contrôle administratif des pièces justificatives.</p>
                </div>
              </li>
              <li className="flex gap-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-[#D6C7B7] bg-[#FAF7F2] text-[#6b5646] text-[11px] font-bold">
                  3
                </span>
                <div>
                  <p className="font-bold text-[#1F130B]">3. Instruction par le comité technique</p>
                  <p className="text-[11px] text-[#6b5646]">Évaluation de l&apos;impact technologique sous 10 jours ouvrés.</p>
                </div>
              </li>
              <li className="flex gap-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-[#D6C7B7] bg-[#FAF7F2] text-[#6b5646] text-[11px] font-bold">
                  4
                </span>
                <div>
                  <p className="font-bold text-[#1F130B]">4. Notification & Entrée au Maker Space</p>
                  <p className="text-[11px] text-[#6b5646]">Convocation pour le pitch et démarrage du prototypage.</p>
                </div>
              </li>
            </ol>
          </div>
        </div>

        {/* 3. ACTIONS SECONDAIRES SOBRES */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2 px-2 text-xs text-[#6b5646]">
          <span className="text-[11px]">
            Besoin d&apos;assistance ? Contactez le support CIAT à{" "}
            <a href="mailto:incubateur@ciat.sn" className="font-semibold text-[#612D10] underline">
              incubateur@ciat.sn
            </a>
          </span>
          <div className="flex items-center gap-3">
            {onNewCandidature && (
              <button
                type="button"
                onClick={onNewCandidature}
                className="inline-flex items-center gap-1.5 font-semibold text-[#612D10] hover:text-[#3F1D0A] hover:underline cursor-pointer"
              >
                <PlusCircle className="h-3.5 w-3.5 text-[#A35926]" />
                <span>Déposer une autre candidature</span>
              </button>
            )}
            <span>·</span>
            <Link
              href="/compte"
              className="font-semibold text-[#612D10] hover:text-[#3F1D0A] hover:underline cursor-pointer"
            >
              Consulter mon compte
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // ÉCRAN PRINCIPAL DE RÉCAPITULATIF (ÉTAPE 3)
  return (
    <div className="space-y-6">
      {/* En-tête sobre identique aux étapes 1 et 2 */}
      <div className="space-y-1 pb-1">
        <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-[#1F130B]">
          Vérifiez votre dossier
        </h2>
        <p className="text-sm text-[#4A3B32]">
          Relisez attentivement vos informations avant la soumission définitive au comité.
        </p>
      </div>

      {error && (
        <div role="alert" className="rounded-xl border border-[#DC2626]/40 bg-[#DC2626]/5 px-4 py-3 text-xs sm:text-sm text-[#DC2626]">
          {error}
        </div>
      )}

      {/* CONTENU PRINCIPAL ÉTAPE 3 EN COLONNE HARMONISÉE PLEINE LARGEUR */}
      <div className="space-y-5">
        
        {/* BANNIÈRE D'ÉTAT DE COMPLÉTUDE */}
        {incomplete ? (
          <div className="rounded-xl border border-[#DC2626]/30 bg-[#DC2626]/5 p-4 sm:p-5 space-y-3">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <span className="text-xs font-extrabold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-[#DC2626]/10 text-[#DC2626] w-fit">
                Dossier incomplet · Complétude {dossier.completude}%
              </span>
              <button
                type="button"
                onClick={() => onEdit(1)}
                className="inline-flex items-center gap-1.5 text-xs font-bold text-[#612D10] hover:text-[#3F1D0A] hover:underline cursor-pointer"
              >
                <span>Compléter les pièces justificatives</span>
                <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
              </button>
            </div>
            <p className="text-xs text-[#6B5646]">
              Toutes les pièces obligatoires doivent être déposées pour débloquer la soumission définitive au comité :
            </p>
            <div className="flex flex-wrap gap-2">
              {missing.map((m) => (
                <span key={m} className="inline-flex items-center gap-1.5 rounded-lg border border-[#DC2626]/20 bg-white px-2.5 py-1 text-xs font-semibold text-[#DC2626]">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#DC2626]" />
                  <span>{label(m)} à fournir</span>
                </span>
              ))}
            </div>
          </div>
        ) : (
          <div className="rounded-xl border border-[#2E7D32]/30 bg-[#2E7D32]/5 p-4 sm:p-5 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#2E7D32]/15 text-[#2E7D32]">
                <CheckCircle2 className="h-4 w-4 stroke-[2.5]" />
              </span>
              <div>
                <span className="text-xs font-extrabold uppercase tracking-wider text-[#2E7D32]">
                  Dossier 100 % complet
                </span>
                <p className="text-xs text-[#6B5646]">
                  Toutes les pièces obligatoires sont validées. Votre candidature est prête pour la soumission.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* SECTION 1 : INFORMATIONS DU PROJET */}
        <SectionCard title="Informations du projet" onEdit={() => onEdit(0)}>
          <dl className="divide-y divide-[#EFE4D6]/40 text-xs sm:text-sm">
            <DataRow name="Titre du projet" value={info.titre} />
            <DataRow name="Domaine d'activité" value={domaines.find((d) => d.id === info.domaine)?.nom} />
            <DataRow name="Problème identifié" value={info.probleme} />
            <DataRow name="Solution proposée" value={info.solution} />
            <DataRow name="Résumé court" value={info.resume} />
          </dl>
        </SectionCard>

        {/* SECTION 2 : PIÈCES JUSTIFICATIVES */}
        <SectionCard title="Pièces justificatives" count={dossier.pieces.length} onEdit={() => onEdit(1)}>
          {dossier.pieces.length === 0 ? (
            <div className="rounded-xl border border-dashed border-[#EFE4D6] bg-[#FAF7F2]/60 p-5 text-center">
              <p className="text-xs sm:text-sm italic text-[#6b5646]">
                Aucune pièce téléversée.
              </p>
              <p className="text-[11px] text-[#8C6D4F] mt-1">
                Les 3 documents obligatoires doivent être déposés pour activer la soumission finale.
              </p>
            </div>
          ) : (
            <ul className="divide-y divide-[#EFE4D6]/50">
              {dossier.pieces.map((p) => (
                <li key={p.id} className="flex items-center justify-between py-2.5 text-xs sm:text-sm">
                  <div className="flex items-center gap-2.5 min-w-0 pr-3">
                    <FileText className="h-4 w-4 text-[#A35926] shrink-0" aria-hidden="true" />
                    <span className="font-semibold text-[#24140D] truncate">{label(p.type)}</span>
                  </div>
                  <span className="text-xs text-[#6b5646] font-mono shrink-0 truncate max-w-[200px]">{p.nom}</span>
                </li>
              ))}
            </ul>
          )}
        </SectionCard>

        {/* Avis de verrouillage CIAT */}
        <div className="rounded-xl border border-[#EFE4D6] bg-[#FAF7F2]/80 p-3.5 text-xs text-[#6b5646] flex items-start gap-2.5 shadow-2xs">
          <Info className="h-4 w-4 text-[#A35926] shrink-0 mt-0.5" aria-hidden="true" />
          <p className="leading-relaxed">
            <strong className="text-[#24140D]">Rappel :</strong> Une fois soumis, votre dossier sera verrouillé pour analyse par le comité d&apos;incubation du CIAT.
          </p>
        </div>

        {/* BARRE D'ACTIONS INFÉRIEURE : PARFAITEMENT ALIGNÉE SUR LES ÉTAPES 1 ET 2 */}
        <div className="flex flex-col-reverse sm:flex-row sm:items-center sm:justify-between gap-3 pt-4 border-t border-[#EFE4D6]">
          <button
            type="button"
            onClick={() => onEdit(1)}
            disabled={submitting}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-[#C99A68] bg-white px-5 text-xs sm:text-sm font-bold text-[#612D10] whitespace-nowrap shadow-2xs transition-all hover:bg-[#FAF7F2] hover:border-[#612D10] hover:text-[#3F1D0A] active:scale-[0.98] cursor-pointer disabled:opacity-50"
          >
            <ArrowLeft className="h-4 w-4 shrink-0 stroke-[2.2]" aria-hidden="true" />
            <span>Retour aux pièces</span>
          </button>

          <button
            type="button"
            onClick={onSubmit}
            disabled={incomplete || submitting}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-[#612D10] px-6 sm:px-7 text-xs sm:text-sm font-bold text-white whitespace-nowrap shadow-xs transition-all hover:bg-[#3F1D0A] hover:scale-[1.01] hover:shadow-md active:scale-[0.98] cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#C99A68] focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {submitting && <span aria-hidden className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />}
            <span>{submitting ? "Envoi en cours…" : "Soumettre définitivement"}</span>
            <ArrowRight className="h-4 w-4 shrink-0 stroke-[2.2]" aria-hidden="true" />
          </button>
        </div>

      </div>
    </div>
  );
}
