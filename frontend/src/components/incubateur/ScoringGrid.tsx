"use client";

import { useState, useEffect } from "react";
import {
  Award,
  CheckCircle2,
  AlertCircle,
  Sliders,
  Sparkles,
  MessageSquare,
} from "lucide-react";
import {
  getGrilleActuelle,
  calculerScorePondere,
  submitEvaluation,
  type Critere,
  type NoteCritere,
  type Evaluation,
} from "@/lib/evaluation";

interface ScoringGridProps {
  dossierId: number;
  onEvaluated?: (result: { score: number; evaluation: Evaluation }) => void;
  disabled?: boolean;
}

export function ScoringGrid({
  dossierId,
  onEvaluated,
  disabled = false,
}: ScoringGridProps) {
  const [criteres, setCriteres] = useState<Critere[]>([]);
  const [notes, setNotes] = useState<Record<number, number>>({});
  const [avis, setAvis] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const g = await getGrilleActuelle();
        setCriteres(g.criteres);
        // Notes par défaut médianes (60%)
        const initialNotes: Record<number, number> = {};
        g.criteres.forEach((c) => {
          initialNotes[c.id] = Math.round(c.note_max * 0.6);
        });
        setNotes(initialNotes);
      } catch {
        // Fallback silencieux ou géré
      }
    })();
  }, [dossierId]);

  const handleNoteChange = (critereId: number, val: number, max: number) => {
    const clamped = Math.min(Math.max(val, 0), max);
    setNotes((prev) => ({ ...prev, [critereId]: clamped }));
    setSuccessMessage(null);
  };

  const notesList: NoteCritere[] = criteres.map((c) => ({
    critere: c.id,
    note: notes[c.id] ?? 0,
  }));

  const scoreCalcule = calculerScorePondere(notesList, criteres);

  const getScoreAppreciation = (score: number) => {
    if (score >= 70)
      return {
        label: "Favorable à l'incubation",
        color: "bg-[#E3F1E9] text-[#2E7D32] border-[#2E7D32]/30",
        progressColor: "bg-[#2E7D32]",
      };
    if (score >= 50)
      return {
        label: "Mitigé / À approfondir",
        color: "bg-[#FEF3C7] text-[#D97706] border-amber-300",
        progressColor: "bg-[#D97706]",
      };
    return {
      label: "Défavorable",
      color: "bg-[#FEE2E2] text-[#DC2626] border-red-200",
      progressColor: "bg-[#DC2626]",
    };
  };

  const appreciation = getScoreAppreciation(scoreCalcule);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (disabled || submitting) return;

    if (!avis.trim()) {
      setErrorMessage("Veuillez renseigner un avis motivé pour étayer votre notation.");
      return;
    }

    setSubmitting(true);
    setErrorMessage(null);

    try {
      const res = await submitEvaluation(dossierId, {
        notes: notesList,
        avis: avis.trim(),
      });
      setSuccessMessage(`Votre évaluation a bien été enregistrée avec un score de ${res.score}% !`);
      if (onEvaluated) onEvaluated(res);
    } catch {
      setErrorMessage("Une erreur est survenue lors de l'enregistrement de l'évaluation.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="rounded-2xl border border-[#EFE4D6] bg-white p-6 shadow-sm">
      {/* En-tête de la grille */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#EFE4D6] pb-5">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#FAF7F2] border border-[#EFE4D6] text-[#612D10]">
            <Sliders className="h-5 w-5 text-[#8C5E2D]" />
          </div>
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#8C5E2D] flex items-center gap-1">
              <Sparkles className="h-3 w-3 text-[#C99A68]" />
              Comité d&apos;évaluation
            </span>
            <h3 className="font-[family-name:var(--font-title)] text-lg font-bold text-[#612D10]">
              Grille de notation du projet
            </h3>
          </div>
        </div>

        {/* Score calculé en direct */}
        <div className="flex items-center gap-3 bg-[#FAF7F2] p-2.5 px-4 rounded-xl border border-[#EFE4D6]">
          <div className="text-right">
            <span className="block text-[11px] font-bold text-[#8C5E2D] uppercase">Score calculé</span>
            <div className="flex items-baseline justify-end gap-1">
              <strong className="font-[family-name:var(--font-title)] text-2xl font-black text-[#612D10]">
                {scoreCalcule}
              </strong>
              <span className="text-xs font-semibold text-[#8C5E2D]">/100</span>
            </div>
          </div>
          <span className={`rounded-lg px-2.5 py-1 text-xs font-extrabold border ${appreciation.color}`}>
            {appreciation.label}
          </span>
        </div>
      </div>

      {/* Barre de progression visuelle */}
      <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-[#EFE4D6]/60">
        <div
          className={`h-full transition-all duration-300 ${appreciation.progressColor}`}
          style={{ width: `${Math.min(Math.max(scoreCalcule, 0), 100)}%` }}
        />
      </div>

      <form onSubmit={handleSubmit} className="mt-6 space-y-6">
        {/* Critères */}
        <div className="space-y-4">
          {criteres.map((critere) => {
            const currentNote = notes[critere.id] ?? 0;

            return (
              <div
                key={critere.id}
                className="rounded-xl border border-[#EFE4D6] bg-[#FAF7F2]/50 p-4 transition-all hover:border-[#C99A68] hover:bg-white"
              >
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <label
                    htmlFor={`critere-${critere.id}`}
                    className="text-sm font-bold text-[#24140D]"
                  >
                    {critere.libelle}
                  </label>
                  <div className="flex items-center gap-2 text-xs">
                    <span className="rounded-md bg-[#EFE4D6] px-2 py-0.5 font-bold text-[#612D10]">
                      Coeff. {critere.poids}
                    </span>
                    <span className="rounded-md bg-white border border-[#EFE4D6] px-2 py-0.5 font-extrabold text-[#612D10]">
                      {currentNote} / {critere.note_max} pts
                    </span>
                  </div>
                </div>

                <div className="mt-3.5 flex items-center gap-4">
                  <input
                    id={`critere-${critere.id}`}
                    type="range"
                    min="0"
                    max={critere.note_max}
                    step="1"
                    value={currentNote}
                    disabled={disabled || submitting}
                    onChange={(e) =>
                      handleNoteChange(critere.id, parseInt(e.target.value, 10), critere.note_max)
                    }
                    className="h-2.5 w-full cursor-pointer accent-[#612D10] bg-[#EFE4D6] rounded-lg"
                  />
                  <input
                    type="number"
                    min="0"
                    max={critere.note_max}
                    value={currentNote}
                    disabled={disabled || submitting}
                    onChange={(e) =>
                      handleNoteChange(critere.id, parseInt(e.target.value, 10) || 0, critere.note_max)
                    }
                    className="h-9 w-16 rounded-lg border border-[#EFE4D6] bg-white text-center font-bold text-sm text-[#612D10] outline-none focus:border-[#C99A68] focus:ring-2 focus:ring-[#C99A68]/30"
                  />
                </div>

                <div className="mt-1 flex justify-between text-[10px] text-[#8C5E2D] font-medium px-1">
                  <span>0 pt (Insuffisant)</span>
                  <span>{Math.round(critere.note_max / 2)} pts (Moyen)</span>
                  <span>{critere.note_max} pts (Remarquable)</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Avis du membre du comité */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label
              htmlFor="avis-comite"
              className="text-xs font-bold uppercase tracking-wider text-[#24140D] flex items-center gap-1.5"
            >
              <MessageSquare className="h-3.5 w-3.5 text-[#C99A68]" />
              <span>Avis motivé et recommandations du comité</span>
              <span className="text-red-600">*</span>
            </label>
            <span className="text-[11px] text-[#8C5E2D] font-medium">
              {avis.trim().length} caractères
            </span>
          </div>
          <textarea
            id="avis-comite"
            rows={4}
            value={avis}
            onChange={(e) => {
              setAvis(e.target.value);
              setErrorMessage(null);
            }}
            disabled={disabled || submitting}
            placeholder="Exposez les forces du projet, les points de vigilance techniques, le potentiel d'impact socio-économique et vos recommandations pour l'incubation..."
            className="w-full rounded-xl border border-[#EFE4D6] bg-white p-3.5 text-sm text-[#24140D] outline-none transition-all placeholder:text-[#a08f80] focus:border-[#C99A68] focus:ring-2 focus:ring-[#C99A68]/30 shadow-xs"
          />
        </div>

        {errorMessage && (
          <div
            role="alert"
            className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-700 font-semibold"
          >
            <AlertCircle className="h-4 w-4 shrink-0 text-red-600" />
            <span>{errorMessage}</span>
          </div>
        )}

        {successMessage && (
          <div
            role="status"
            className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-3.5 text-xs font-bold text-emerald-800"
          >
            <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
            <span>{successMessage}</span>
          </div>
        )}

        <button
          type="submit"
          disabled={disabled || submitting}
          className="flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-[#612D10] px-6 font-[family-name:var(--font-title)] text-sm font-bold text-white transition-all hover:bg-[#3F1D0A] hover:shadow-md disabled:cursor-not-allowed disabled:opacity-60"
        >
          {submitting ? (
            <>
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
              <span>Enregistrement en cours...</span>
            </>
          ) : (
            <>
              <Award className="h-4 w-4 text-[#C99A68]" />
              <span>Enregistrer mon évaluation</span>
            </>
          )}
        </button>
      </form>
    </div>
  );
}

export default ScoringGrid;
