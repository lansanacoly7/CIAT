"use client";

import { PIECES_OBLIGATOIRES, PIECE_LABELS, type Piece, type PieceType } from "@/lib/incubator";

interface CompletenessGaugeProps {
  completude: number;
  piecesManquantes: PieceType[];
  pieces?: Piece[];
}

const RADIUS = 38;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

export function CompletenessGauge({ completude, piecesManquantes = [], pieces = [] }: CompletenessGaugeProps) {
  const isComplete = completude === 100;
  const missing = new Set(piecesManquantes);
  const color = isComplete ? "#2E7D32" : "#C99A68";

  return (
    <div className="rounded-xl border border-[#EFE4D6] bg-white p-4 shadow-sm sm:p-6">
      <div className="flex flex-col items-center gap-5 sm:flex-row sm:items-center">
        <div
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={completude}
          aria-label="Complétude du dossier"
          className="relative h-28 w-28 shrink-0"
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
          <h3 className="font-[family-name:var(--font-title)] text-lg font-bold text-[#612D10]">
            {isComplete ? "Toutes les pièces obligatoires sont déposées" : `${piecesManquantes.length} pièce(s) obligatoire(s) à fournir`}
          </h3>
          <p className="mt-1 text-sm text-[#6b5646]">
            {isComplete
              ? "Vous pouvez passer au récapitulatif et soumettre votre candidature."
              : "Le dossier doit être complet à 100 % pour être soumis au comité."}
          </p>
        </div>
      </div>

      <ul className="mt-5 grid gap-2 sm:grid-cols-3">
        {PIECES_OBLIGATOIRES.map((type) => {
          const ok = !missing.has(type);
          const piece = pieces.find((p) => p.type === type);
          return (
            <li
              key={type}
              className={`flex items-start gap-2.5 rounded-lg border p-3 ${
                ok ? "border-[#2E7D32]/30 bg-[#E3F1E9]/40" : "border-[#EFE4D6] bg-[#FAF7F2]"
              }`}
            >
              <span
                aria-hidden
                className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                  ok ? "bg-[#2E7D32] text-white" : "border-2 border-[#C99A68] bg-white text-[#C99A68]"
                }`}
              >
                {ok ? "✓" : ""}
              </span>
              <div className="min-w-0">
                <p className="text-sm font-semibold leading-tight text-[#24140D]">{PIECE_LABELS[type].label}</p>
                <p className="mt-0.5 truncate text-xs text-[#6b5646]">
                  <span className="sr-only">{ok ? "Déposé : " : "À fournir : "}</span>
                  {ok ? (piece ? piece.nom : "Déposé") : "À fournir"}
                </p>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

export default CompletenessGauge;
