"use client";

import type { ReactNode } from "react";
import { API_URL } from "@/lib/api";
import { PIECE_LABELS } from "@/lib/incubator";
import { StatutBadge, formatDate, type DossierEval } from "./EvaluationDossierList";

/** Avis d'un évaluateur, tel que renvoyé par GET /incubator/dossiers/{id}/evaluations/. */
export interface AvisEvaluation {
  id?: number;
  evaluateur_nom?: string;
  evaluateur?: string | number;
  score?: number | null;
  avis?: string;
  cree_le?: string;
}

export interface EvaluationsSummary {
  score_moyen: number | null;
  evaluations: AvisEvaluation[];
}

function fileUrl(fichier: string) {
  return /^https?:\/\//.test(fichier) ? fichier : `${API_URL.replace(/\/api\/?$/, "")}${fichier}`;
}

function Block({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="rounded-lg border border-[#EFE4D6] bg-white p-4">
      <h3 className="mb-2 text-base font-bold text-[#612D10]">{title}</h3>
      {children}
    </section>
  );
}

function Text({ label, value }: { label: string; value?: string }) {
  return (
    <div className="py-2">
      <dt className="text-sm font-medium text-[#6b5646]">{label}</dt>
      <dd className="mt-0.5 whitespace-pre-line text-sm text-[#24140D]">
        {value?.trim() || <span className="italic text-[#6b5646]">Non renseigné</span>}
      </dd>
    </div>
  );
}

export default function DossierDetailCard({
  dossier,
  evaluations,
  evaluationsLoading,
  evaluationsError,
}: {
  dossier: DossierEval;
  evaluations: EvaluationsSummary | null;
  evaluationsLoading: boolean;
  evaluationsError: string | null;
}) {
  const { projet } = dossier;
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h2 className="text-xl font-bold text-[#612D10] sm:text-2xl">{projet.titre}</h2>
          <p className="text-sm text-[#6b5646]">
            {dossier.porteur_nom || "Porteur non renseigné"} · {projet.domaine_nom || "Domaine non renseigné"} · Soumis le{" "}
            {formatDate(dossier.soumis_le)}
          </p>
        </div>
        <StatutBadge statut={dossier.statut} />
      </div>

      <Block title="Synthèse du projet">
        <dl className="divide-y divide-[#EFE4D6]">
          <Text label="Résumé" value={projet.resume} />
          <Text label="Problème identifié" value={projet.probleme} />
          <Text label="Solution proposée" value={projet.solution} />
        </dl>
      </Block>

      <Block title={`Pièces justificatives (${dossier.pieces.length})`}>
        {dossier.pieces.length === 0 ? (
          <p className="text-sm italic text-[#6b5646]">Aucune pièce téléversée.</p>
        ) : (
          <ul className="divide-y divide-[#EFE4D6]">
            {dossier.pieces.map((p) => (
              <li key={p.id} className="flex flex-col gap-2 py-2 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-[#24140D]">{PIECE_LABELS[p.type]?.label ?? p.type}</p>
                  <p className="break-all text-xs text-[#6b5646]">{p.nom}</p>
                </div>
                <div className="flex gap-2">
                  <a
                    href={fileUrl(p.fichier)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex min-h-11 items-center justify-center rounded-md border-[1.5px] border-[#612D10] bg-white px-4 text-sm font-semibold text-[#612D10] hover:bg-[#FAF7F2]"
                  >
                    Consulter
                  </a>
                  <a
                    href={fileUrl(p.fichier)}
                    download={p.nom}
                    className="inline-flex min-h-11 items-center justify-center rounded-md bg-[#612D10] px-4 text-sm font-semibold text-white hover:bg-[#3F1D0A]"
                  >
                    Télécharger
                  </a>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Block>

      <Block title="Évaluations du comité">
        {evaluationsLoading ? (
          <p className="text-sm text-[#6b5646]">Chargement des évaluations…</p>
        ) : evaluationsError ? (
          <p role="alert" className="text-sm text-[#DC2626]">{evaluationsError}</p>
        ) : (
          <>
            <p className="text-sm">
              <span className="font-medium text-[#6b5646]">Score moyen actuel : </span>
              <span className="text-lg font-bold text-[#612D10]">
                {evaluations?.score_moyen == null ? "En attente" : evaluations.score_moyen.toFixed(1)}
              </span>
            </p>
            {evaluations && evaluations.evaluations.length > 0 ? (
              <ul className="mt-3 space-y-3">
                {evaluations.evaluations.map((ev, i) => (
                  <li key={ev.id ?? i} className="rounded-md border border-[#EFE4D6] bg-[#FAF7F2] p-3 text-sm">
                    <p className="flex justify-between gap-2 font-semibold text-[#24140D]">
                      <span>{ev.evaluateur_nom || `Évaluateur ${i + 1}`}</span>
                      {ev.score != null && <span className="text-[#612D10]">{Number(ev.score).toFixed(1)}</span>}
                    </p>
                    <p className="mt-1 whitespace-pre-line text-[#24140D]">
                      {ev.avis?.trim() || <span className="italic text-[#6b5646]">Aucun avis rédigé.</span>}
                    </p>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-2 text-sm italic text-[#6b5646]">Aucune évaluation pour le moment.</p>
            )}
          </>
        )}
      </Block>
    </div>
  );
}
