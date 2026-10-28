"use client";

import { PIECES_OBLIGATOIRES, type Piece, type PieceType } from "@/lib/incubator";

interface CompletenessGaugeProps {
  completude: number;
  piecesManquantes: PieceType[];
  pieces?: Piece[];
}

export function CompletenessGauge({
  completude,
  piecesManquantes = [],
}: CompletenessGaugeProps) {
  const isComplete = completude === 100;
  const totalObligatoires = PIECES_OBLIGATOIRES.length;
  const manquantesCount = piecesManquantes.length;
  const fournisCount = Math.max(0, totalObligatoires - manquantesCount);

  return (
    <div
      role="region"
      aria-label="Synthèse d'avancement du dossier"
      className="rounded-xl border border-[#EFE4D6] bg-[#FAF7F2] p-3.5 sm:p-4 transition-all"
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3.5">
          {/* Badge numérique récapitulatif */}
          <div
            className={`flex h-11 w-11 shrink-0 flex-col items-center justify-center rounded-xl border text-sm font-extrabold shadow-2xs transition-colors ${
              isComplete
                ? "border-[#2E7D32]/30 bg-[#E3F1E9] text-[#2E7D32]"
                : "border-[#EFE4D6] bg-white text-[#612D10]"
            }`}
          >
            <span>{isComplete ? "3/3" : `${fournisCount}/3`}</span>
            <span className="text-[7.5px] font-bold uppercase tracking-wider text-[#8C6D4F]">
              {isComplete ? "Complet" : "Fournis"}
            </span>
          </div>

          {/* Textes explicatifs */}
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="font-[family-name:var(--font-title)] text-xs sm:text-sm font-bold text-[#24140D]">
                {isComplete
                  ? "Toutes les pièces obligatoires sont déposées"
                  : `${fournisCount} sur ${totalObligatoires} pièces obligatoires déposées`}
              </h3>
              <span
                className={`inline-flex items-center rounded-sm px-1.5 py-0.5 text-[10px] font-bold ${
                  isComplete
                    ? "bg-[#E3F1E9] text-[#2E7D32]"
                    : "bg-[#FEF3C7] text-[#B45309]"
                }`}
              >
                Complétude {completude}%
              </span>
            </div>
            <p className="mt-0.5 text-[11px] text-[#6B5646]">
              {isComplete
                ? "Dossier prêt : vous pouvez passer au récapitulatif pour vérifier et soumettre votre candidature."
                : "Déposez les 3 documents obligatoires ci-dessous pour débloquer la soumission finale."}
            </p>
          </div>
        </div>

        {/* Barre de progression continue */}
        <div
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={completude}
          aria-label="Progression du dépôt documentaire"
          className="h-2 w-full shrink-0 overflow-hidden rounded-full bg-[#EFE4D6] sm:w-44"
        >
          <div
            className={`h-full rounded-full transition-all duration-500 ${
              isComplete ? "bg-[#2E7D32]" : "bg-[#C99A68]"
            }`}
            style={{ width: `${completude}%` }}
          />
        </div>
      </div>
    </div>
  );
}

export default CompletenessGauge;
