"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";
import { telechargerAccuseReception, suiviErrorMessage, type Dossier } from "@/lib/incubator";
import type { Domaine, ProjectInfo } from "./ProjectInfoStep";

export const PIECE_LABELS: Record<string, string> = {
  fiche_projet: "Fiche de projet",
  presentation_equipe: "Présentation de l'équipe",
  budget_previsionnel: "Budget prévisionnel",
  autre: "Autre document",
};

const label = (type: string) => PIECE_LABELS[type] ?? type;

function Section({ title, onEdit, children }: { title: string; onEdit: () => void; children: ReactNode }) {
  return (
    <section className="rounded-xl border border-[#EFE4D6] bg-white p-4 shadow-sm sm:p-5">
      <div className="mb-3 flex items-center justify-between gap-2 border-b border-[#EFE4D6] pb-2">
        <h3 className="font-[family-name:var(--font-title)] text-base font-bold text-[#612D10]">{title}</h3>
        <button
          type="button"
          onClick={onEdit}
          className="inline-flex min-h-11 items-center gap-1.5 rounded-lg border border-[#612D10] px-4 text-sm font-semibold text-[#612D10] hover:bg-[#FAF7F2]"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" aria-hidden>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536M9 13l6.768-6.768a2 2 0 112.828 2.828L11.828 15.83a4 4 0 01-1.414.943L7 18l1.226-3.414A4 4 0 019 13z" />
          </svg>
          Modifier
        </button>
      </div>
      {children}
    </section>
  );
}

function Row({ name, value }: { name: string; value?: string }) {
  return (
    <div className="py-2 sm:grid sm:grid-cols-3 sm:gap-4">
      <dt className="text-sm font-medium text-[#6b5646]">{name}</dt>
      <dd className="whitespace-pre-line text-sm leading-relaxed text-[#24140D] sm:col-span-2">
        {value?.trim() || <span className="italic text-[#6b5646]">Non renseigné</span>}
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
      window.URL.revokeObjectURL(url);
    } catch (err) {
      setAccuseError(suiviErrorMessage(err, "Impossible de télécharger l'accusé de réception. Veuillez réessayer."));
    } finally {
      setDownloadingAccuse(false);
    }
  }

  if (submitted) {
    return (
      <div role="status" className="rounded-xl border border-[#2E7D32]/40 bg-[#2E7D32]/5 p-6 text-center sm:p-10">
        <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-[#2E7D32] text-white">
          <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" strokeWidth="3" stroke="currentColor" aria-hidden>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h2 className="text-xl font-bold text-[#2E7D32]">Dossier transmis avec succès</h2>
        <p className="mx-auto mt-2 max-w-md text-sm text-[#24140D]">
          Votre dossier « {info.titre} » a bien été transmis à l&apos;équipe du CIAT. Il sera examiné par le comité de
          sélection ; vous serez informé de la suite.
        </p>

        {accuseError && (
          <div role="alert" className="mx-auto mt-4 max-w-md rounded-lg border border-[#DC2626]/30 bg-[#DC2626]/5 p-3 text-xs text-[#DC2626]">
            {accuseError}
          </div>
        )}

        <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
          <button
            type="button"
            onClick={handleTelechargerAccuse}
            disabled={downloadingAccuse}
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-[#612D10] px-6 font-[family-name:var(--font-title)] font-semibold text-white transition-colors hover:bg-[#3F1D0A] disabled:opacity-60"
          >
            {downloadingAccuse ? (
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
            ) : (
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" aria-hidden>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
              </svg>
            )}
            <span>Télécharger mon accusé de réception</span>
          </button>
          <Link
            href="/compte"
            className="inline-flex min-h-11 items-center justify-center rounded-lg border-[1.5px] border-[#612D10] px-6 font-[family-name:var(--font-title)] font-semibold text-[#612D10] hover:bg-[#FAF7F2]"
          >
            Voir mon compte
          </Link>
          <Link
            href="/"
            className="inline-flex min-h-11 items-center justify-center rounded-lg border border-[#EFE4D6] bg-white px-6 font-[family-name:var(--font-title)] font-semibold text-[#6b5646] hover:bg-[#FAF7F2]"
          >
            Retour à l&apos;accueil
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-bold text-[#612D10]">Vérifiez votre dossier</h2>
        <p className="mt-1 text-sm text-[#6b5646]">
          Relisez les informations ci-dessous. Une fois soumis, le dossier n&apos;est plus modifiable.
        </p>
      </div>

      <Section title="Informations du projet" onEdit={() => onEdit(0)}>
        <dl className="divide-y divide-[#EFE4D6]">
          <Row name="Titre" value={info.titre} />
          <Row name="Domaine" value={domaines.find((d) => d.id === info.domaine)?.nom} />
          <Row name="Problème" value={info.probleme} />
          <Row name="Solution" value={info.solution} />
          <Row name="Résumé" value={info.resume} />
        </dl>
      </Section>

      <Section title={`Pièces justificatives (${dossier.pieces.length})`} onEdit={() => onEdit(1)}>
        {dossier.pieces.length === 0 ? (
          <p className="text-sm italic text-[#6b5646]">Aucune pièce téléversée.</p>
        ) : (
          <ul className="divide-y divide-[#EFE4D6]">
            {dossier.pieces.map((p) => (
              <li key={p.id} className="flex flex-col py-2 text-sm sm:flex-row sm:justify-between sm:gap-4">
                <span className="font-medium text-[#24140D]">{label(p.type)}</span>
                <span className="break-all text-[#6b5646]">{p.nom}</span>
              </li>
            ))}
          </ul>
        )}
      </Section>

      <div
        className={`rounded-xl border p-4 ${
          incomplete ? "border-[#DC2626]/40 bg-[#DC2626]/5" : "border-[#2E7D32]/40 bg-[#2E7D32]/5"
        }`}
      >
        <div className="flex items-center justify-between gap-3">
          <p className={`font-semibold ${incomplete ? "text-[#DC2626]" : "text-[#2E7D32]"}`}>
            {incomplete ? "Dossier incomplet : soumission impossible pour le moment" : "Dossier complet : prêt à être soumis"}
          </p>
          <span className="font-[family-name:var(--font-title)] text-lg font-extrabold text-[#612D10]">{dossier.completude}%</span>
        </div>
        <div className="mt-2 h-2 overflow-hidden rounded-full bg-[#EFE4D6]">
          <div
            className={`h-full rounded-full transition-all ${incomplete ? "bg-[#C99A68]" : "bg-[#2E7D32]"}`}
            style={{ width: `${dossier.completude}%` }}
          />
        </div>
        {incomplete && (
          <div id="soumission-aide" className="mt-3 text-sm text-[#24140D]">
            {missing.length > 0 ? (
              <>
                <p>Pièces obligatoires manquantes :</p>
                <ul className="mt-1 list-inside list-disc">
                  {missing.map((m) => (
                    <li key={m}>{label(m)}</li>
                  ))}
                </ul>
              </>
            ) : (
              <p>Le dossier doit atteindre 100 % de complétude pour être soumis.</p>
            )}
            <button type="button" onClick={() => onEdit(1)} className="mt-2 min-h-11 font-semibold text-[#612D10] underline">
              Ajouter les pièces manquantes
            </button>
          </div>
        )}
      </div>

      {error && (
        <div role="alert" className="rounded-lg border border-[#DC2626]/40 bg-[#DC2626]/5 px-3 py-2 text-sm text-[#DC2626]">
          {error}
        </div>
      )}

      <div className="flex flex-col-reverse gap-3 border-t border-[#EFE4D6] pt-5 sm:flex-row sm:justify-between">
        <button
          type="button"
          onClick={() => onEdit(1)}
          disabled={submitting}
          className="min-h-12 rounded-lg border-[1.5px] border-[#612D10] bg-white px-6 font-[family-name:var(--font-title)] font-semibold text-[#612D10] hover:bg-[#FAF7F2] disabled:opacity-50"
        >
          Retour aux pièces
        </button>
        <button
          type="button"
          onClick={onSubmit}
          disabled={incomplete || submitting}
          aria-describedby={incomplete ? "soumission-aide" : undefined}
          className="flex min-h-12 items-center justify-center gap-2 rounded-lg bg-[#612D10] px-8 font-[family-name:var(--font-title)] font-semibold text-white transition-colors hover:bg-[#3F1D0A] disabled:cursor-not-allowed disabled:opacity-50"
        >
          {submitting && <span aria-hidden className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />}
          {submitting ? "Envoi en cours…" : "Soumettre définitivement"}
        </button>
      </div>
    </div>
  );
}
