"use client";

import { useState } from "react";
import { CheckCircle2, XCircle, AlertCircle, X, ShieldCheck } from "lucide-react";
import { submitDecision } from "@/lib/evaluation";
import type { Dossier } from "@/lib/incubator";

interface DecisionModalProps {
  dossier: Dossier;
  isOpen?: boolean;
  onClose?: () => void;
  onDecision: (updatedDossier: Dossier) => void;
}

export function DecisionModal({
  dossier,
  isOpen = true,
  onClose,
  onDecision,
}: DecisionModalProps) {
  const [decision, setDecision] = useState<"accepte" | "refuse">("accepte");
  const [motif, setMotif] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!motif.trim()) {
      setErrorMessage("Le motif de la décision est obligatoire.");
      return;
    }

    setSubmitting(true);
    setErrorMessage(null);

    try {
      const updated = await submitDecision(dossier.id, decision, motif.trim());
      onDecision(updated);
      if (onClose) onClose();
    } catch {
      setErrorMessage("Impossible d'enregistrer la décision.");
    } finally {
      setSubmitting(false);
    }
  };

  const isAccept = decision === "accepte";
  const canSubmit = motif.trim().length >= 10 && !submitting;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="w-full max-w-lg rounded-2xl border border-[#EFE4D6] bg-white p-6 shadow-xl sm:p-7 space-y-5"
        role="dialog"
        aria-modal="true"
        aria-labelledby="decision-modal-title"
      >
        <div className="flex items-start justify-between border-b border-[#EFE4D6] pb-4">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#8C5E2D] flex items-center gap-1">
              <ShieldCheck className="h-3 w-3 text-[#C99A68]" />
              Espace Coordonnateur CIAT
            </span>
            <h3
              id="decision-modal-title"
              className="font-[family-name:var(--font-title)] text-lg font-bold text-[#612D10]"
            >
              Décision finale d&apos;incubation
            </h3>
            <p className="mt-1 text-xs text-[#6B5646]">
              Projet : <strong className="text-[#24140D]">{dossier.projet.titre}</strong>
            </p>
          </div>
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg p-1.5 text-zinc-400 hover:bg-[#FAF7F2] hover:text-zinc-700"
              aria-label="Fermer la boîte de dialogue"
            >
              <X className="h-5 w-5" />
            </button>
          )}
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Choix Accepter ou Refuser */}
          <div>
            <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-[#24140D]">
              Issue de la délibération du jury
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setDecision("accepte")}
                className={`flex items-center justify-center gap-2 rounded-xl border p-3.5 font-[family-name:var(--font-title)] text-xs font-bold transition-all ${
                  isAccept
                    ? "border-[#2E7D32] bg-[#E3F1E9] text-[#2E7D32] ring-2 ring-[#2E7D32]/30 shadow-xs"
                    : "border-[#EFE4D6] bg-[#FAF7F2] text-[#6B5646] hover:border-[#2E7D32]/50 hover:bg-white"
                }`}
              >
                <CheckCircle2 className="h-4 w-4 shrink-0" />
                <span>Accepter le dossier</span>
              </button>

              <button
                type="button"
                onClick={() => setDecision("refuse")}
                className={`flex items-center justify-center gap-2 rounded-xl border p-3.5 font-[family-name:var(--font-title)] text-xs font-bold transition-all ${
                  !isAccept
                    ? "border-[#DC2626] bg-[#FEE2E2] text-[#DC2626] ring-2 ring-[#DC2626]/30 shadow-xs"
                    : "border-[#EFE4D6] bg-[#FAF7F2] text-[#6B5646] hover:border-[#DC2626]/50 hover:bg-white"
                }`}
              >
                <XCircle className="h-4 w-4 shrink-0" />
                <span>Refuser le dossier</span>
              </button>
            </div>
          </div>

          {/* Motif obligatoire */}
          <div>
            <div className="flex items-baseline justify-between mb-1.5">
              <label
                htmlFor="decision-motif"
                className="text-xs font-bold uppercase tracking-wider text-[#24140D]"
              >
                Motif de la décision <span className="text-red-600">* (obligatoire)</span>
              </label>
              <span className="text-[11px] text-[#8C5E2D] font-medium">
                {motif.trim().length} car. (min. 10)
              </span>
            </div>
            <textarea
              id="decision-motif"
              rows={4}
              value={motif}
              onChange={(e) => {
                setMotif(e.target.value);
                setErrorMessage(null);
              }}
              placeholder={
                isAccept
                  ? "Précisez les conditions d'admission, le parcours d'accélération recommandé, le mentor pressenti..."
                  : "Indiquez les raisons du refus (maturité insuffisante, modèle économique non viable, hors thématique CIAT...)"
              }
              className="w-full rounded-xl border border-[#EFE4D6] bg-white p-3.5 text-xs text-[#24140D] outline-none transition-all placeholder:text-[#a08f80] focus:border-[#C99A68] focus:ring-2 focus:ring-[#C99A68]/30 shadow-xs"
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

          <div className="flex items-center justify-end gap-3 pt-2">
            {onClose && (
              <button
                type="button"
                onClick={onClose}
                disabled={submitting}
                className="px-4 py-2.5 rounded-xl border border-[#EFE4D6] bg-white text-xs font-bold text-[#612D10] hover:bg-[#FAF7F2]"
              >
                Annuler
              </button>
            )}
            <button
              type="submit"
              disabled={!canSubmit}
              className={`flex min-h-10 items-center justify-center gap-2 rounded-xl px-5 font-[family-name:var(--font-title)] text-xs font-bold text-white transition-all shadow-xs disabled:cursor-not-allowed disabled:opacity-50 ${
                isAccept
                  ? "bg-[#2E7D32] hover:bg-[#25632b] hover:shadow-md"
                  : "bg-[#DC2626] hover:bg-[#b91c1c] hover:shadow-md"
              }`}
            >
              {submitting ? (
                <>
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  <span>Enregistrement...</span>
                </>
              ) : (
                <span>Confirmer la décision</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default DecisionModal;
