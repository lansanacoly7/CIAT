"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight, CheckCircle2, Download, FileText, Info, Pencil } from "lucide-react";
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
}: {
  info: ProjectInfo;
  domaines: Domaine[];
  dossier: Dossier;
  submitting: boolean;
  submitted: boolean;
  error: string | null;
  onEdit: (step: number) => void;
  onSubmit: () => void;
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

  // ÉCRAN DE CONFIRMATION DE SUCCÈS APRÈS SOUMISSION
  if (submitted) {
    return (
      <div role="status" className="rounded-2xl border border-[#2E7D32]/40 bg-white p-6 text-center sm:p-10 shadow-sm space-y-4">
        <div className="mx-auto mb-2 flex h-14 w-14 items-center justify-center rounded-full bg-[#2E7D32]/10 text-[#2E7D32]">
          <CheckCircle2 className="h-8 w-8 stroke-[2.2]" aria-hidden="true" />
        </div>
        <h2 className="font-[family-name:var(--font-title)] text-xl sm:text-2xl font-bold text-[#2E7D32]">
          Dossier transmis avec succès
        </h2>
        <p className="mx-auto max-w-lg text-xs sm:text-sm text-[#24140D] leading-relaxed">
          Votre dossier « <span className="font-bold text-[#612D10]">{info.titre || "Projet CIAT"}</span> » a bien été transmis à l&apos;équipe du CIAT.
          Il sera examiné par le comité de sélection ; vous serez informé de la suite de son instruction.
        </p>

        {accuseError && (
          <div role="alert" className="mx-auto max-w-md rounded-xl border border-[#DC2626]/30 bg-[#DC2626]/5 p-3 text-xs text-[#DC2626]">
            {accuseError}
          </div>
        )}

        <div className="pt-4 flex flex-col justify-center gap-3 sm:flex-row">
          <Link
            href="/incubateur/projets"
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[#612D10] px-6 text-xs sm:text-sm font-bold text-white shadow-sm transition-all hover:bg-[#3F1D0A] hover:scale-[1.02] hover:shadow-md active:scale-[0.98] cursor-pointer"
          >
            <span>Accéder au suivi de mes projets</span>
            <ArrowRight className="h-4 w-4" />
          </Link>
          <button
            type="button"
            onClick={handleTelechargerAccuse}
            disabled={downloadingAccuse}
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-[#612D10] bg-white px-6 text-xs sm:text-sm font-bold text-[#612D10] transition-all hover:bg-[#F2E5D5] hover:border-[#3F1D0A] hover:text-[#3F1D0A] hover:shadow-xs active:scale-[0.98] cursor-pointer disabled:opacity-60"
          >
            {downloadingAccuse ? (
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-[#612D10]/40 border-t-[#612D10]" />
            ) : (
              <Download className="h-4 w-4" aria-hidden="true" />
            )}
            <span>Télécharger mon accusé de réception</span>
          </button>
          <Link
            href="/compte"
            className="inline-flex min-h-11 items-center justify-center rounded-xl border border-[#EFE4D6] bg-white px-6 text-xs sm:text-sm font-semibold text-[#6b5646] transition-all hover:border-[#A35926] hover:bg-[#F2E5D5] hover:text-[#3F1D0A] hover:shadow-xs active:scale-[0.98] cursor-pointer"
          >
            Voir mon compte
          </Link>
        </div>
      </div>
    );
  }

  // ÉCRAN PRINCIPAL DE RÉCAPITULATIF (ÉTAPE 3)
  return (
    <div className="space-y-6">
      {/* En-tête de l'étape */}
      <div className="border-b border-[#EFE4D6]/70 pb-3.5">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-[11px] font-bold uppercase tracking-wider text-[#A35926]">
            Dossier de candidature
          </span>
          <span className="text-xs text-[#8C6D4F]">· Étape 3 sur 3</span>
        </div>
        <h2 className="font-[family-name:var(--font-title)] text-xl sm:text-2xl font-bold tracking-tight text-[#24140D]">
          Vérifiez votre dossier
        </h2>
        <p className="text-xs sm:text-sm text-[#6b5646] mt-0.5">
          Relisez attentivement les éléments saisis avant l&apos;envoi officiel. Une fois soumis, le dossier ne sera plus modifiable.
        </p>
      </div>

      {error && (
        <div role="alert" className="rounded-xl border border-[#DC2626]/40 bg-[#DC2626]/5 px-4 py-3 text-xs sm:text-sm text-[#DC2626]">
          {error}
        </div>
      )}

      {/* DISPOSITION EN DEUX COLONNES (8 COLS CONTENU + 4 COLS STATUT/COMPLÉTUDE) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* COLONNE GAUCHE (8 colonnes) : LES DEUX SECTIONS MÉTIER */}
        <div className="lg:col-span-8 space-y-5">
          
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

          {/* BARRE D'ACTIONS INFÉRIEURE */}
          <div className="flex flex-col-reverse sm:flex-row items-center justify-between gap-3 pt-2">
            <button
              type="button"
              onClick={() => onEdit(1)}
              disabled={submitting}
              className="w-full sm:w-auto inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-[#EFE4D6] bg-white px-6 text-xs sm:text-sm font-bold text-[#612D10] shadow-2xs transition-all hover:bg-[#F2E5D5] hover:border-[#A35926] hover:text-[#3F1D0A] hover:shadow-xs active:scale-[0.98] cursor-pointer disabled:opacity-50"
            >
              <ArrowLeft className="h-4 w-4" aria-hidden="true" />
              <span>Retour aux pièces</span>
            </button>

            <button
              type="button"
              onClick={onSubmit}
              disabled={incomplete || submitting}
              aria-describedby={incomplete ? "soumission-aide" : undefined}
              className="w-full sm:w-auto inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[#612D10] px-8 text-xs sm:text-sm font-bold text-white shadow-sm transition-all hover:bg-[#3F1D0A] hover:scale-[1.02] hover:shadow-md active:scale-[0.98] cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#C99A68] focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {submitting && <span aria-hidden className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />}
              <span>{submitting ? "Envoi en cours…" : "Soumettre définitivement"}</span>
              <ArrowRight className="h-4 w-4 stroke-[2]" aria-hidden="true" />
            </button>
          </div>

        </div>

        {/* COLONNE DROITE (4 colonnes) : PANNEAU DE COMPLÉTUDE & AVERTISSEMENT */}
        <div className="lg:col-span-4 space-y-4">
          
          {/* Panneau de complétude & Alerte */}
          <div
            className={`rounded-2xl border p-5 sm:p-6 shadow-sm space-y-4 bg-white transition-all ${
              incomplete ? "border-[#DC2626]/30" : "border-[#2E7D32]/30"
            }`}
          >
            <div className="flex items-center justify-between gap-2">
              <span
                className={`text-[11px] font-extrabold uppercase tracking-wider px-2.5 py-0.5 rounded-full ${
                  incomplete ? "bg-[#DC2626]/10 text-[#DC2626]" : "bg-[#2E7D32]/10 text-[#2E7D32]"
                }`}
              >
                {incomplete ? "Dossier incomplet" : "Dossier complet"}
              </span>
              <span className="font-[family-name:var(--font-title)] text-lg font-extrabold text-[#612D10]">
                {dossier.completude}%
              </span>
            </div>

            {/* Jauge de progression */}
            <div className="h-2 w-full rounded-full bg-[#EFE4D6] overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-300 ${
                  incomplete ? "bg-[#DC2626]" : "bg-[#2E7D32]"
                }`}
                style={{ width: `${dossier.completude}%` }}
              />
            </div>

            {incomplete ? (
              <div id="soumission-aide" className="space-y-3">
                <p className="text-xs font-bold text-[#24140D]">
                  Soumission impossible pour le moment
                </p>
                {missing.length > 0 ? (
                  <div>
                    <p className="text-[11px] text-[#6b5646]">Pièces obligatoires manquantes :</p>
                    <ul className="mt-2 space-y-1.5 text-xs text-[#24140D]">
                      {missing.map((m) => (
                        <li key={m} className="flex items-center gap-2">
                          <span className="h-1.5 w-1.5 rounded-full bg-[#DC2626] shrink-0" />
                          <span>{label(m)}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : (
                  <p className="text-xs text-[#6b5646]">Le dossier doit atteindre 100 % de complétude pour être soumis.</p>
                )}

                <div className="pt-2 border-t border-[#EFE4D6]/70">
                  <button
                    type="button"
                    onClick={() => onEdit(1)}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#612D10] hover:bg-[#3F1D0A] px-4 py-2.5 text-xs font-bold text-white shadow-sm transition-all hover:scale-[1.01]"
                  >
                    <span>Ajouter les pièces manquantes</span>
                    <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <p className="text-xs font-bold text-[#2E7D32]">Prêt à être soumis</p>
                <p className="text-xs text-[#6b5646] leading-relaxed">
                  Toutes les pièces obligatoires ont été validées. Vous pouvez cliquer sur « Soumettre définitivement ».
                </p>
              </div>
            )}
          </div>

          {/* Avis de verrouillage CIAT */}
          <div className="rounded-xl border border-[#EFE4D6] bg-[#FAF7F2]/80 p-4 text-xs text-[#6b5646] flex items-start gap-2.5 shadow-xs">
            <Info className="h-4 w-4 text-[#A35926] shrink-0 mt-0.5" aria-hidden="true" />
            <p className="leading-relaxed">
              <strong className="text-[#24140D]">Rappel :</strong> Une fois soumis, votre dossier sera verrouillé pour analyse par le comité d&apos;incubation du CIAT.
            </p>
          </div>

        </div>

      </div>
    </div>
  );
}
