"use client";

import { useRef, useState, type ChangeEvent, type DragEvent } from "react";
import {
  PIECES_OBLIGATOIRES,
  PIECE_LABELS,
  deletePiece,
  mediaUrl,
  uploadPiece,
  type Dossier,
  type Piece,
  type PieceType,
} from "@/lib/incubator";

interface FileUploaderProps {
  dossier: Dossier;
  onChange: (dossier: Dossier) => void;
  disabled?: boolean;
}

const MAX_SIZE = 10 * 1024 * 1024;

/**
 * Extensions acceptées par le serveur (ALLOWED_PIECE_EXTENSIONS dans backend/apps/incubator/models.py).
 * Pour accepter Excel ou PowerPoint, il faut d'abord élargir cette liste côté back-end, puis ici.
 */
const BASE_EXTENSIONS = ["pdf", "doc", "docx"];
const ACCEPTED: Record<PieceType, string[]> = {
  fiche_projet: BASE_EXTENSIONS,
  presentation_equipe: BASE_EXTENSIONS,
  budget_previsionnel: BASE_EXTENSIONS,
  autre: [...BASE_EXTENSIONS, "png", "jpg", "jpeg", "webp"],
};

const CARD_TYPES: PieceType[] = [...PIECES_OBLIGATOIRES, "autre"];

const formatsLabel = (type: PieceType) =>
  ACCEPTED[type].map((e) => (e === "doc" || e === "docx" ? "Word" : e.toUpperCase())).filter((v, i, a) => a.indexOf(v) === i).join(", ");

function formatSize(bytes: number) {
  return bytes < 1024 * 1024 ? `${Math.max(1, Math.round(bytes / 1024))} Ko` : `${(bytes / (1024 * 1024)).toFixed(1)} Mo`;
}

function validate(file: File, type: PieceType): string | null {
  const ext = file.name.includes(".") ? file.name.split(".").pop()!.toLowerCase() : "";
  if (!ACCEPTED[type].includes(ext)) {
    return `Format « .${ext || "inconnu"} » non supporté pour ce document. Formats acceptés : ${formatsLabel(type)}.`;
  }
  if (file.size > MAX_SIZE) {
    return `Le fichier fait ${formatSize(file.size)} : la taille maximale autorisée est de 10 Mo.`;
  }
  return null;
}

function PieceCard({
  type,
  pieces,
  sizes,
  busy,
  deletingId,
  error,
  disabled,
  onFile,
  onDelete,
}: {
  type: PieceType;
  pieces: Piece[];
  sizes: Record<number, number>;
  busy: boolean;
  deletingId: number | null;
  error: string | null;
  disabled: boolean;
  onFile: (type: PieceType, file: File) => void;
  onDelete: (pieceId: number) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const required = type !== "autre";
  const provided = pieces.length > 0;
  const single = required && provided;

  const pick = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) onFile(type, file);
    e.target.value = "";
  };
  const drop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file && !disabled && !busy) onFile(type, file);
  };

  return (
    <div
      className={`rounded-xl border-2 bg-white p-4 shadow-sm transition-colors ${
        provided && required ? "border-[#2E7D32]" : "border-[#E2D4C3]"
      }`}
    >
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="flex min-w-0 items-start gap-3">
          {provided && required ? (
            <span aria-hidden className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#2E7D32] text-white">
              <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" strokeWidth="3.5" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </span>
          ) : (
            <span aria-hidden className="mt-1.5 h-3 w-3 shrink-0 rounded-full bg-[#C99A68]" />
          )}
          <div className="min-w-0">
            <h4 className="font-[family-name:var(--font-title)] text-base font-bold text-[#612D10]">
              {PIECE_LABELS[type].label}
            </h4>
            <p className="mt-0.5 text-xs leading-relaxed text-[#6b5646]">{PIECE_LABELS[type].description}</p>
          </div>
        </div>
        {required ? (
          <span
            className={`shrink-0 rounded-full px-3 py-1 text-xs font-bold ${
              provided ? "bg-[#E3F1E9] text-[#2E7D32]" : "bg-[#C99A68]/20 text-[#612D10]"
            }`}
          >
            {provided ? "Déposé" : "À fournir"}
          </span>
        ) : (
          <span className="shrink-0 rounded-full bg-[#FAF7F2] px-3 py-1 text-xs font-bold text-[#6b5646]">Facultatif</span>
        )}
      </div>

      {pieces.length > 0 && (
        <ul className="mt-3 space-y-2">
          {pieces.map((p) => (
            <li key={p.id} className="flex items-center justify-between gap-2 rounded-lg bg-[#FAF7F2] p-2.5">
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-[#24140D]">{p.nom}</p>
                {(sizes[p.id] ?? p.taille) && (
                  <p className="text-xs text-[#6b5646]">{sizes[p.id] ? formatSize(sizes[p.id]) : p.taille}</p>
                )}
              </div>
              <div className="flex shrink-0 items-center gap-1">
                {p.fichier && (
                  <a
                    href={mediaUrl(p.fichier)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex min-h-11 items-center rounded-lg px-3 text-sm font-semibold text-[#612D10] hover:bg-white"
                  >
                    Aperçu
                  </a>
                )}
                {!disabled && (
                  <button
                    type="button"
                    disabled={deletingId === p.id}
                    onClick={() => onDelete(p.id)}
                    aria-label={`Supprimer ${p.nom}`}
                    className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-lg text-[#DC2626] hover:bg-[#DC2626]/10 disabled:opacity-50"
                  >
                    {deletingId === p.id ? (
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-[#DC2626] border-t-transparent" />
                    ) : (
                      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    )}
                  </button>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}

      {!single && (
        <div
          onDragOver={(e) => {
            e.preventDefault();
            if (!disabled) setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={drop}
          className={`mt-3 flex flex-col items-center gap-2 rounded-lg border-2 border-dashed px-3 py-4 text-center transition-colors ${
            dragging ? "border-[#612D10] bg-[#FAF7F2]" : "border-[#EFE4D6]"
          }`}
        >
          <input
            ref={inputRef}
            type="file"
            accept={ACCEPTED[type].map((e) => `.${e}`).join(",")}
            onChange={pick}
            className="hidden"
            disabled={disabled || busy}
          />
          <button
            type="button"
            disabled={disabled || busy}
            onClick={() => inputRef.current?.click()}
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-[#612D10] px-5 text-sm font-semibold text-white hover:bg-[#3F1D0A] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {busy && <span aria-hidden className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />}
            {busy ? "Envoi en cours…" : "Choisir un fichier"}
          </button>
          <p className="text-xs text-[#6b5646]">
            ou glissez-le ici · {formatsLabel(type)} · 10 Mo maximum
          </p>
        </div>
      )}

      {error && (
        <p role="alert" className="mt-3 rounded-lg border border-[#DC2626]/40 bg-[#DC2626]/5 px-3 py-2 text-sm text-[#DC2626]">
          {error}
        </p>
      )}
    </div>
  );
}

export function FileUploader({ dossier, onChange, disabled = false }: FileUploaderProps) {
  const pieces = dossier?.pieces ?? [];
  const [busyType, setBusyType] = useState<PieceType | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [errors, setErrors] = useState<Partial<Record<PieceType, string | null>>>({});
  // Taille des fichiers déposés pendant cette session (l'API ne renvoie pas la taille).
  const [sizes, setSizes] = useState<Record<number, number>>({});

  const setError = (type: PieceType, message: string | null) => setErrors((e) => ({ ...e, [type]: message }));

  const handleFile = async (type: PieceType, file: File) => {
    setError(type, null);
    const problem = validate(file, type);
    if (problem) {
      setError(type, problem);
      return;
    }
    setBusyType(type);
    try {
      const { dossier: updated, piece } = await uploadPiece(dossier.id, type, file);
      setSizes((s) => ({ ...s, [piece.id]: file.size }));
      onChange(updated);
    } catch (err) {
      setError(type, err instanceof Error ? err.message : "Erreur lors du dépôt du fichier.");
    } finally {
      setBusyType(null);
    }
  };

  const handleDelete = async (pieceId: number) => {
    const type = pieces.find((p) => p.id === pieceId)?.type ?? "autre";
    setError(type, null);
    setDeletingId(pieceId);
    try {
      onChange(await deletePiece(dossier.id, pieceId));
    } catch {
      setError(type, "Impossible de supprimer cette pièce. Veuillez réessayer.");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {CARD_TYPES.map((type) => (
        <PieceCard
          key={type}
          type={type}
          pieces={pieces.filter((p) => p.type === type)}
          sizes={sizes}
          busy={busyType === type}
          deletingId={deletingId}
          error={errors[type] ?? null}
          disabled={disabled}
          onFile={handleFile}
          onDelete={handleDelete}
        />
      ))}
    </div>
  );
}

export default FileUploader;
