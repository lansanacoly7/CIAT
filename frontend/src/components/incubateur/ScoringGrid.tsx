"use client";

import { useState, useEffect } from "react";
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
      const g = await getGrilleActuelle();
      setCriteres(g.criteres);
      // Notes par défaut médianes (12/20)
      const initialNotes: Record<number, number> = {};
      g.criteres.forEach((c) => {
        initialNotes[c.id] = Math.round(c.note_max * 0.6);
      });
      setNotes(initialNotes);
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
    if (score >= 70) return { label: "Favorable à l'incubation", color: "bg-[#E3F1E9] text-[#2E7D32]" };
    if (score >= 50) return { label: "Mitigé / À approfondir", color: "bg-[#F8EBD3] text-[#D97706]" };
    return { label: "Défavorable", color: "bg-[#F6DEDC] text-[#DC2626]" };
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
    <div className="rounded-lg border border-[#EFE4D6] bg-white p-5 shadow-sm sm:p-6">
      <div className="flex flex-wrap items-center justify-between border-b border-[#EFE4D6] pb-4">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-[#C99A68]">
            Comité d&apos;évaluation
          </span>
          <h3 className="font-[family-name:var(--font-title)] text-lg font-bold text-[#612D10]">
            Grille de notation du projet
          </h3>
        </div>

        {/* Score calculé en temps réel */}
        <div className="flex items-center gap-3">
          <div className="text-right">
            <span className="block text-xs font-medium text-[#6B5646]">Score calculé</span>
            <strong className="font-[family-name:var(--font-title)] text-2xl font-extrabold text-[#612D10]">
              {scoreCalcule}
              <span className="text-sm font-normal text-[#6B5646]">/100</span>
            </strong>
          </div>
          <span className={`rounded-full px-3 py-1 text-xs font-bold ${appreciation.color}`}>
            {appreciation.label}
          </span>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="mt-6 space-y-6">
        {/* Critères */}
        <div className="space-y-4">
          {criteres.map((critere) => {
            const currentNote = notes[critere.id] ?? 0;

            return (
              <div
                key={critere.id}
                className="rounded-lg border border-[#EFE4D6] bg-[#FAF7F2] p-4 transition-colors hover:border-[#C99A68]"
              >
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <label
                    htmlFor={`critere-${critere.id}`}
                    className="text-sm font-semibold text-[#24140D]"
                  >
                    {critere.libelle}
                  </label>
                  <div className="flex items-center gap-2 text-xs text-[#6B5646]">
                    <span className="rounded bg-[#EFE4D6] px-1.5 py-0.5 font-semibold text-[#612D10]">
                      Coeff. {critere.poids}
                    </span>
                    <span className="font-bold text-[#612D10]">
                      {currentNote} / {critere.note_max}
                    </span>
                  </div>
                </div>

                <div className="mt-3 flex items-center gap-4">
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
                    className="h-2 w-full cursor-pointer accent-[#612D10]"
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
                    className="h-9 w-16 rounded-md border border-[#EFE4D6] bg-white text-center font-bold text-[#612D10] outline-none focus:border-[#C99A68]"
                  />
                </div>
              </div>
            );
          })}
        </div>

        {/* Avis du membre du comité */}
        <div>
          <label htmlFor="avis-comite" className="mb-1 block text-sm font-semibold text-[#24140D]">
            Avis motivé et recommandations du comité <span className="text-[#DC2626]">*</span>
          </label>
          <textarea
            id="avis-comite"
            rows={4}
            value={avis}
            onChange={(e) => {
              setAvis(e.target.value);
              setErrorMessage(null);
            }}
            disabled={disabled || submitting}
            placeholder="Exposez les forces, faiblesses techniques, points de vigilance et suggestions d'accompagnement pour ce projet..."
            className="w-full rounded-md border border-[#EFE4D6] bg-white p-3 text-sm text-[#24140D] outline-none transition-colors placeholder:text-[#a08f80] focus:border-[#C99A68] focus:ring-2 focus:ring-[#C99A68]/40"
          />
        </div>

        {errorMessage && (
          <div role="alert" className="rounded-md border border-[#DC2626]/40 bg-[#DC2626]/10 p-3 text-sm text-[#DC2626]">
            {errorMessage}
          </div>
        )}

        {successMessage && (
          <div role="status" className="rounded-md border border-[#2E7D32]/40 bg-[#E3F1E9] p-3 text-sm font-semibold text-[#2E7D32]">
            {successMessage}
          </div>
        )}

        <button
          type="submit"
          disabled={disabled || submitting}
          className="flex min-h-11 w-full items-center justify-center gap-2 rounded-md bg-[#612D10] px-6 font-[family-name:var(--font-title)] font-semibold text-white transition-colors hover:bg-[#3F1D0A] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {submitting ? (
            <>
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
              <span>Enregistrement en cours...</span>
            </>
          ) : (
            <span>Enregistrer mon évaluation</span>
          )}
        </button>
      </form>
    </div>
  );
}

export default ScoringGrid;
