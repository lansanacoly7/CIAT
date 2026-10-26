"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import type { Dossier } from "@/lib/incubator";
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
    <section className="rounded-lg border border-[#EFE4D6] bg-white p-4">
      <div className="mb-2 flex items-center justify-between gap-2">
        <h3 className="text-base font-bold text-[#612D10]">{title}</h3>
        <button type="button" onClick={onEdit} className="min-h-11 px-2 text-sm font-semibold text-[#612D10] underline hover:text-[#3F1D0A]">
          Modifier
        </button>
      </div>
      {children}
    </section>
  );
}

function Row({ name, value }: { name: string; value?: string }) {
  return (
    <div className="py-1.5 sm:grid sm:grid-cols-3 sm:gap-4">
      <dt className="text-sm font-medium text-[#6b5646]">{name}</dt>
      <dd className="whitespace-pre-line text-sm text-[#24140D] sm:col-span-2">
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
  const missing = dossier.pieces_manquantes ?? [];
  const incomplete = dossier.completude < 100 || missing.length > 0;

  if (submitted) {
    return (
      <div role="status" className="rounded-lg border border-[#2E7D32]/40 bg-[#2E7D32]/5 p-6 text-center">
        <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-[#2E7D32] text-white">
          <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth="3" stroke="currentColor" aria-hidden>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h2 className="text-xl font-bold text-[#2E7D32]">Dossier transmis avec succès</h2>
        <p className="mx-auto mt-2 max-w-md text-sm text-[#24140D]">
          Votre dossier « {info.titre} » a bien été transmis à l&apos;équipe du CIAT. Il sera examiné par le comité de
          sélection ; vous serez informé de la suite.
        </p>
        <Link
          href="/"
          className="mt-5 inline-flex min-h-11 items-center justify-center rounded-md bg-[#612D10] px-6 font-[family-name:var(--font-title)] font-semibold text-white hover:bg-[#3F1D0A]"
        >
          Retour à l&apos;accueil
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Section title="Informations du projet" onEdit={() => onEdit(0)}>
        <dl className="divide-y divide-[#EFE4D6]">
          <Row name="Titre" value={info.titre} />
          <Row name="Domaine" value={domaines.find((d) => d.id === info.domaine)?.nom} />
          <Row name="Résumé" value={info.resume} />
          <Row name="Problème" value={info.probleme} />
          <Row name="Solution" value={info.solution} />
        </dl>
      </Section>

      <Section title={`Pièces téléversées (${dossier.pieces.length})`} onEdit={() => onEdit(1)}>
        {dossier.pieces.length === 0 ? (
          <p className="text-sm italic text-[#6b5646]">Aucune pièce téléversée.</p>
        ) : (
          <ul className="divide-y divide-[#EFE4D6]">
            {dossier.pieces.map((p) => (
              <li key={p.id} className="flex flex-col py-1.5 text-sm sm:flex-row sm:justify-between">
                <span className="font-medium text-[#24140D]">{label(p.type)}</span>
                <span className="break-all text-[#6b5646]">{p.nom}</span>
              </li>
            ))}
          </ul>
        )}
      </Section>

      <p className="text-sm">
        <span className="font-semibold text-[#24140D]">Complétude : </span>
        <span className={`font-bold ${incomplete ? "text-[#B7791F]" : "text-[#2E7D32]"}`}>{dossier.completude}%</span>
      </p>

      {incomplete && (
        <div role="alert" className="rounded-md border border-[#DC2626]/40 bg-[#DC2626]/5 p-4 text-sm text-[#24140D]">
          <p className="font-semibold text-[#DC2626]">Votre dossier est incomplet : il ne peut pas encore être soumis.</p>
          {missing.length > 0 && (
            <>
              <p className="mt-1">Pièces obligatoires manquantes :</p>
              <ul className="mt-1 list-inside list-disc">
                {missing.map((m) => (
                  <li key={m}>{label(m)}</li>
                ))}
              </ul>
            </>
          )}
          <button type="button" onClick={() => onEdit(1)} className="mt-2 min-h-11 font-semibold text-[#612D10] underline">
            Ajouter les pièces manquantes
          </button>
        </div>
      )}

      {error && (
        <div role="alert" className="rounded-md border border-[#DC2626]/40 bg-[#DC2626]/5 px-3 py-2 text-sm text-[#DC2626]">
          {error}
        </div>
      )}

      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-between">
        <button
          type="button"
          onClick={() => onEdit(1)}
          disabled={submitting}
          className="min-h-11 rounded-md border-[1.5px] border-[#612D10] bg-white px-6 font-[family-name:var(--font-title)] font-semibold text-[#612D10] hover:bg-[#FAF7F2] disabled:opacity-50"
        >
          Retour
        </button>
        <button
          type="button"
          onClick={onSubmit}
          disabled={incomplete || submitting}
          className="flex min-h-11 items-center justify-center gap-2 rounded-md bg-[#612D10] px-6 font-[family-name:var(--font-title)] font-semibold text-white transition-colors hover:bg-[#3F1D0A] disabled:cursor-not-allowed disabled:opacity-50"
        >
          {submitting && <span aria-hidden className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />}
          {submitting ? "Envoi en cours…" : "Soumettre définitivement"}
        </button>
      </div>
    </div>
  );
}
