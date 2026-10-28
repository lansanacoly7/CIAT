"use client";

import type { ReactNode } from "react";
import {
  FileText,
  ExternalLink,
  Download,
  User,
  Calendar,
  Award,
  Lightbulb,
  AlertTriangle,
  CheckCircle2,
  MessageSquare,
  ShieldCheck,
  FolderKanban,
} from "lucide-react";
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

function SectionCard({
  icon: Icon,
  title,
  badge,
  children,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  badge?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-[#EFE4D6] bg-white p-5 shadow-xs">
      <div className="flex items-center justify-between border-b border-[#EFE4D6]/70 pb-3 mb-4">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#FAF7F2] border border-[#EFE4D6] text-[#612D10]">
            <Icon className="h-4 w-4 text-[#8C5E2D]" />
          </div>
          <h3 className="font-[family-name:var(--font-title)] text-base font-bold text-[#612D10]">
            {title}
          </h3>
        </div>
        {badge}
      </div>
      {children}
    </section>
  );
}

export default function DossierDetailCard({
  dossier,
  evaluations,
  evaluationsLoading,
  evaluationsError,
  showEvaluations = true,
}: {
  dossier: DossierEval;
  evaluations: EvaluationsSummary | null;
  evaluationsLoading: boolean;
  evaluationsError: string | null;
  showEvaluations?: boolean;
}) {
  const { projet } = dossier;
  const score = evaluations?.score_moyen ?? dossier.score_moyen;

  return (
    <div className="space-y-5">
      {/* En-tête Fiche Projet */}
      <div className="rounded-2xl border border-[#EFE4D6] bg-gradient-to-br from-white via-white to-[#FAF7F2]/80 p-6 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="space-y-2 max-w-2xl">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1 rounded-full bg-[#FAF7F2] border border-[#EFE4D6] px-2.5 py-0.5 text-xs font-bold uppercase tracking-wider text-[#8C5E2D]">
                <FolderKanban className="h-3 w-3 text-[#C99A68]" />
                Candidature #{dossier.id}
              </span>
              <StatutBadge statut={dossier.statut} />
            </div>

            <h2 className="font-[family-name:var(--font-title)] text-xl font-bold text-[#612D10] sm:text-2xl leading-tight">
              {projet.titre}
            </h2>

            <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-[#6B5646]">
              <span className="inline-flex items-center gap-1 font-semibold text-[#24140D]">
                <User className="h-3.5 w-3.5 text-[#C99A68]" />
                {dossier.porteur_nom || "Porteur non renseigné"}
              </span>

              {projet.domaine_nom && (
                <span className="inline-flex items-center gap-1 font-medium">
                  • Secteur : <strong className="text-[#612D10]">{projet.domaine_nom}</strong>
                </span>
              )}

              <span className="inline-flex items-center gap-1 text-[#8C5E2D]">
                <Calendar className="h-3.5 w-3.5" />
                Déposé le {formatDate(dossier.soumis_le)}
              </span>
            </div>
          </div>

          {/* Pastille de score moyen */}
          <div className="flex flex-col items-end gap-1 shrink-0 bg-[#FAF7F2] border border-[#EFE4D6] rounded-xl p-3 text-right">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#8C5E2D] flex items-center gap-1">
              <Award className="h-3.5 w-3.5 text-[#C99A68]" />
              Score actuel
            </span>
            <div className="flex items-baseline gap-1">
              <span className="font-[family-name:var(--font-title)] text-2xl font-extrabold text-[#612D10]">
                {score == null ? "—" : score.toFixed(1)}
              </span>
              <span className="text-xs font-semibold text-[#8C5E2D]">/100</span>
            </div>
            {score != null && (
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                  score >= 70
                    ? "bg-[#E3F1E9] text-[#2E7D32]"
                    : score >= 50
                    ? "bg-[#FEF3C7] text-[#D97706]"
                    : "bg-[#FEE2E2] text-[#DC2626]"
                }`}
              >
                {score >= 70 ? "Favorable" : score >= 50 ? "Mitigé" : "Défavorable"}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Synthèse du projet */}
      <SectionCard icon={Lightbulb} title="Synthèse du projet">
        <div className="space-y-4">
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#8C5E2D] mb-1">
              Résumé exécutif
            </h4>
            <p className="text-sm text-[#24140D] leading-relaxed whitespace-pre-line bg-[#FAF7F2]/60 rounded-xl p-3.5 border border-[#EFE4D6]/60">
              {projet.resume?.trim() || <span className="italic text-[#8C5E2D]">Non renseigné</span>}
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-xl border border-amber-200/80 bg-amber-50/40 p-3.5">
              <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-amber-900 mb-1">
                <AlertTriangle className="h-3.5 w-3.5 text-amber-700" />
                <span>Problème identifié</span>
              </div>
              <p className="text-xs text-amber-950 leading-relaxed whitespace-pre-line">
                {projet.probleme?.trim() || (
                  <span className="italic text-amber-800">Non renseigné</span>
                )}
              </p>
            </div>

            <div className="rounded-xl border border-emerald-200/80 bg-emerald-50/40 p-3.5">
              <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-emerald-900 mb-1">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-700" />
                <span>Solution innovante</span>
              </div>
              <p className="text-xs text-emerald-950 leading-relaxed whitespace-pre-line">
                {projet.solution?.trim() || (
                  <span className="italic text-emerald-800">Non renseigné</span>
                )}
              </p>
            </div>
          </div>
        </div>
      </SectionCard>

      {/* Pièces justificatives */}
      <SectionCard
        icon={FileText}
        title={`Pièces justificatives (${dossier.pieces.length})`}
        badge={
          <span className="inline-flex items-center gap-1 text-xs font-semibold text-[#8C5E2D]">
            <ShieldCheck className="h-3.5 w-3.5 text-[#2E7D32]" />
            Dossier {dossier.pieces.length >= 3 ? "complet" : "partiel"}
          </span>
        }
      >
        {dossier.pieces.length === 0 ? (
          <p className="text-sm italic text-[#8C5E2D] py-4 text-center">
            Aucune pièce justificative déposée pour ce dossier.
          </p>
        ) : (
          <ul className="divide-y divide-[#EFE4D6]/70">
            {dossier.pieces.map((p) => (
              <li
                key={p.id}
                className="flex flex-col gap-2.5 py-3 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="flex items-start gap-2.5 min-w-0">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#FAF7F2] border border-[#EFE4D6] text-[#612D10]">
                    <FileText className="h-4 w-4 text-[#8C5E2D]" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-[#24140D]">
                      {PIECE_LABELS[p.type]?.label ?? p.type}
                    </p>
                    <p className="truncate text-xs text-[#8C5E2D] max-w-sm sm:max-w-md">
                      {p.nom}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <a
                    href={fileUrl(p.fichier)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#612D10] bg-white text-xs font-bold text-[#612D10] transition-colors hover:bg-[#FAF7F2]"
                  >
                    <ExternalLink className="h-3 w-3" />
                    <span>Consulter</span>
                  </a>
                  <a
                    href={fileUrl(p.fichier)}
                    download={p.nom}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#612D10] text-xs font-bold text-white transition-colors hover:bg-[#3F1D0A]"
                  >
                    <Download className="h-3 w-3" />
                    <span>Télécharger</span>
                  </a>
                </div>
              </li>
            ))}
          </ul>
        )}
      </SectionCard>

      {/* Évaluations du comité */}
      {showEvaluations && (
        <SectionCard
          icon={MessageSquare}
          title="Évaluations du comité"
          badge={
            evaluations && evaluations.evaluations.length > 0 ? (
              <span className="rounded-full bg-[#FAF7F2] border border-[#EFE4D6] px-2.5 py-0.5 text-xs font-bold text-[#612D10]">
                {evaluations.evaluations.length} avis émis
              </span>
            ) : null
          }
        >
          {evaluationsLoading ? (
            <div className="flex items-center justify-center py-6 gap-2 text-sm text-[#8C5E2D]">
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-[#C99A68] border-t-transparent" />
              <span>Chargement des évaluations…</span>
            </div>
          ) : evaluationsError ? (
            <div
              role="alert"
              className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-700"
            >
              {evaluationsError}
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 rounded-xl bg-[#FAF7F2]/70 border border-[#EFE4D6]">
                <span className="text-xs font-semibold text-[#8C5E2D]">
                  Score moyen consolidé du jury :
                </span>
                <strong className="text-base font-extrabold text-[#612D10]">
                  {evaluations?.score_moyen == null ? "En attente" : `${evaluations.score_moyen.toFixed(1)} / 100`}
                </strong>
              </div>

              {evaluations && evaluations.evaluations.length > 0 ? (
                <ul className="space-y-3">
                  {evaluations.evaluations.map((ev, i) => (
                    <li
                      key={ev.id ?? i}
                      className="rounded-xl border border-[#EFE4D6] bg-white p-4 shadow-2xs space-y-2"
                    >
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-1.5 font-bold text-[#24140D]">
                          <User className="h-3.5 w-3.5 text-[#C99A68]" />
                          <span>{ev.evaluateur_nom || `Évaluateur ${i + 1}`}</span>
                        </div>
                        {ev.score != null && (
                          <span className="rounded-full bg-[#E3F1E9] px-2.5 py-0.5 text-xs font-extrabold text-[#2E7D32]">
                            Score : {Number(ev.score).toFixed(1)}/100
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-[#24140D] leading-relaxed whitespace-pre-line bg-[#FAF7F2]/50 rounded-lg p-2.5 border border-[#EFE4D6]/50">
                        {ev.avis?.trim() || (
                          <span className="italic text-[#8C5E2D]">Aucun avis textuel rédigé.</span>
                        )}
                      </p>
                      {ev.cree_le && (
                        <p className="text-[10px] text-[#8C5E2D] text-right">
                          Évalué le {formatDate(ev.cree_le)}
                        </p>
                      )}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-center py-4 text-xs italic text-[#8C5E2D]">
                  Aucune évaluation enregistrée pour le moment. Vous pouvez être le premier à noter ce projet ci-dessous.
                </p>
              )}
            </div>
          )}
        </SectionCard>
      )}
    </div>
  );
}
