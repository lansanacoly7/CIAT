"use client";

import { useState } from "react";
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
    <div className="rounded-lg border border-[#EFE4D6] bg-white p-5 shadow-sm sm:p-6">
      <div className="border-b border-[#EFE4D6] pb-3">
        <span className="text-xs font-semibold uppercase tracking-wider text-[#C99A68]">
          Espace Coordonnateur
        </span>
        <h3 className="font-[family-name:var(--font-title)] text-lg font-bold text-[#612D10]">
          Décision finale d&apos;incubation
        </h3>
        <p className="mt-1 text-xs text-[#6B5646]">
          Projet : <strong className="text-[#24140D]">{dossier.projet.titre}</strong>
        </p>
      </div>

      <form onSubmit={handleSubmit} className="mt-5 space-y-5">
        {/* Choix Accepter ou Refuser */}
        <div>
          <label className="mb-2 block text-xs font-semibold text-[#24140D]">
            Issue de la délibération du comité
          </label>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setDecision("accepte")}
              className={`flex items-center justify-center gap-2 rounded-lg border p-3 font-[family-name:var(--font-title)] text-xs font-bold transition-all ${
                isAccept
                  ? "border-[#2E7D32] bg-[#E3F1E9] text-[#2E7D32] ring-2 ring-[#2E7D32]/30"
                  : "border-[#EFE4D6] bg-[#FAF7F2] text-[#6B5646] hover:border-[#2E7D32]/50"
              }`}
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
              </svg>
              <span>Accepter le dossier</span>
            </button>

            <button
              type="button"
              onClick={() => setDecision("refuse")}
              className={`flex items-center justify-center gap-2 rounded-lg border p-3 font-[family-name:var(--font-title)] text-xs font-bold transition-all ${
                !isAccept
                  ? "border-[#DC2626] bg-[#F6DEDC] text-[#DC2626] ring-2 ring-[#DC2626]/30"
                  : "border-[#EFE4D6] bg-[#FAF7F2] text-[#6B5646] hover:border-[#DC2626]/50"
              }`}
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" />
              </svg>
              <span>Refuser le dossier</span>
            </button>
          </div>
        </div>

        {/* Motif obligatoire */}
        <div>
          <div className="flex items-baseline justify-between">
            <label htmlFor="decision-motif" className="mb-1 block text-xs font-semibold text-[#24140D]">
              Motif de la décision <span className="text-[#DC2626]">* (obligatoire)</span>
            </label>
            <span className="text-[11px] text-[#6B5646]">
              {motif.trim().length} car. (min. 10)
            </span>
          </div>
          <textarea
            id="decision-motif"
            rows={3}
            value={motif}
            onChange={(e) => {
              setMotif(e.target.value);
              setErrorMessage(null);
            }}
            placeholder={
              isAccept
                ? "Précisez les conditions d'admission, le mentor pressenti ou les axes d'accélération prioritaires..."
                : "Indiquez les raisons du refus (maturité technique insuffisante, hors champ thématique CIAT, modèle non viable...)"
            }
            className="w-full rounded-md border border-[#EFE4D6] bg-white p-3 text-xs text-[#24140D] outline-none transition-colors placeholder:text-[#a08f80] focus:border-[#C99A68] focus:ring-2 focus:ring-[#C99A68]/40"
          />
        </div>

        {errorMessage && (
          <div role="alert" className="rounded-md border border-[#DC2626]/40 bg-[#DC2626]/10 p-2.5 text-xs text-[#DC2626]">
            {errorMessage}
          </div>
        )}

        <button
          type="submit"
          disabled={!canSubmit}
          className={`flex min-h-11 w-full items-center justify-center gap-2 rounded-md px-4 font-[family-name:var(--font-title)] text-xs font-bold text-white transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
            isAccept ? "bg-[#2E7D32] hover:bg-[#25632b]" : "bg-[#DC2626] hover:bg-[#b91c1c]"
          }`}
        >
          {submitting ? (
            <>
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
              <span>Enregistrement de la décision...</span>
            </>
          ) : (
            <span>
              Confirmer la décision : {isAccept ? "Acceptation" : "Refus"}
            </span>
          )}
        </button>
      </form>
    </div>
  );
}

export default DecisionModal;
