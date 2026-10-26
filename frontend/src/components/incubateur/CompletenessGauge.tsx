"use client";

import {
  PIECES_OBLIGATOIRES,
  PIECE_LABELS,
  type Piece,
  type PieceType,
} from "@/lib/incubator";

interface CompletenessGaugeProps {
  completude: number;
  piecesManquantes: PieceType[];
  pieces?: Piece[];
}

export function CompletenessGauge({
  completude,
  piecesManquantes = [],
  pieces = [],
}: CompletenessGaugeProps) {
  const isComplete = completude === 100;
  const typesManquants = new Set(piecesManquantes);

  return (
    <div className="rounded-lg border border-[#EFE4D6] bg-white p-5 shadow-xs sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-[#6B5646]">
            État du dossier
          </span>
          <h3 className="font-[family-name:var(--font-title)] text-lg font-bold text-[#612D10]">
            Complétude des pièces justificatives
          </h3>
        </div>

        <div className="flex items-center gap-2">
          <span
            className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold ${
              isComplete
                ? "bg-[#E3F1E9] text-[#2E7D32]"
                : "bg-[#F8EBD3] text-[#D97706]"
            }`}
          >
            {isComplete ? (
              <>
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
                </svg>
                <span>Dossier complet (100%)</span>
              </>
            ) : (
              <>
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  />
                </svg>
                <span>{completude}% complet</span>
              </>
            )}
          </span>
        </div>
      </div>

      {/* Barre de progression */}
      <div className="mt-4">
        <div className="h-2.5 w-full overflow-hidden rounded-full bg-[#EFE4D6]">
          <div
            className={`h-full transition-all duration-500 ease-out ${
              isComplete ? "bg-[#2E7D32]" : "bg-[#C99A68]"
            }`}
            style={{ width: `${Math.max(completude, 4)}%` }}
          />
        </div>
      </div>

      {/* Liste des pièces obligatoires */}
      <div className="mt-5 space-y-2.5">
        <p className="text-xs font-medium text-[#6B5646]">
          Pièces requises pour soumission au comité d&apos;évaluation :
        </p>

        <div className="grid gap-2 sm:grid-cols-3">
          {PIECES_OBLIGATOIRES.map((type) => {
            const isMissing = typesManquants.has(type);
            const isProvided = !isMissing;
            const piece = pieces.find((p) => p.type === type);

            return (
              <div
                key={type}
                className={`flex items-start gap-2.5 rounded-md border p-3 transition-colors ${
                  isProvided
                    ? "border-[#2E7D32]/30 bg-[#E3F1E9]/40"
                    : "border-[#D97706]/30 bg-[#F8EBD3]/30"
                }`}
              >
                <div className="mt-0.5">
                  {isProvided ? (
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#2E7D32] text-white">
                      <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                      </svg>
                    </span>
                  ) : (
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#D97706] text-white">
                      <span className="text-xs font-bold">!</span>
                    </span>
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold leading-tight text-[#24140D]">
                    {PIECE_LABELS[type].label}
                  </p>
                  <p className="mt-1 truncate text-[11px] text-[#6B5646]">
                    {isProvided ? (piece ? piece.nom : "Fourni") : "À fournir (obligatoire)"}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {!isComplete && (
        <p className="mt-3 text-xs text-[#D97706]">
          * {piecesManquantes.length} pièce(s) obligatoire(s) manquante(s) : vous devez toutes les fournir pour pouvoir soumettre votre candidature.
        </p>
      )}
    </div>
  );
}

export default CompletenessGauge;
