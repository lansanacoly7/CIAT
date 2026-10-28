"use client";

import type { Piece, PieceType } from "@/lib/incubator";

interface CompletenessGaugeProps {
  completude: number;
  piecesManquantes: PieceType[];
  pieces?: Piece[];
}

const RADIUS = 38;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

export function CompletenessGauge({ completude, piecesManquantes = [] }: CompletenessGaugeProps) {
  const isComplete = completude === 100;
  const color = isComplete ? "#2E7D32" : "#C99A68";

  return (
    <div className="rounded-xl border border-[#EFE4D6] bg-white p-4 shadow-sm sm:p-5">
      <div className="flex flex-col items-center gap-5 sm:flex-row sm:items-center">
        <div
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={completude}
          aria-label="Complétude du dossier"
          className="relative h-24 w-24 shrink-0 sm:h-28 sm:w-28"
        >
          <svg viewBox="0 0 100 100" className="h-full w-full -rotate-90" aria-hidden>
            <circle cx="50" cy="50" r={RADIUS} fill="none" stroke="#EFE4D6" strokeWidth="9" />
            <circle
              cx="50"
              cy="50"
              r={RADIUS}
              fill="none"
              stroke={color}
              strokeWidth="9"
              strokeLinecap="round"
              strokeDasharray={CIRCUMFERENCE}
              strokeDashoffset={CIRCUMFERENCE * (1 - completude / 100)}
              className="transition-all duration-500"
            />
          </svg>
          <span className="absolute inset-0 flex items-center justify-center font-[family-name:var(--font-title)] text-2xl font-extrabold text-[#612D10]">
            {completude}%
          </span>
        </div>

        <div className="min-w-0 flex-1 text-center sm:text-left">
          <p className="text-xs font-semibold uppercase tracking-wider text-[#6b5646]">Complétude du dossier</p>
          <h3 className="font-[family-name:var(--font-title)] text-base sm:text-lg font-bold text-[#612D10]">
            {isComplete ? "Toutes les pièces obligatoires sont déposées" : `${piecesManquantes.length} pièce(s) obligatoire(s) à fournir`}
          </h3>
          <p className="mt-1 text-xs sm:text-sm text-[#6b5646]">
            {isComplete
              ? "Vous pouvez passer au récapitulatif et soumettre votre candidature."
              : "Le dossier doit être complet à 100 % pour être soumis au comité de sélection."}
          </p>
        </div>
      </div>
    </div>
  );
}

export default CompletenessGauge;
