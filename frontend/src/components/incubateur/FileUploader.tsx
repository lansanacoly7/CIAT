"use client";

import { useEffect, useRef, useState, useSyncExternalStore, type ChangeEvent, type DragEvent } from "react";
import { createPortal } from "react-dom";

const emptySubscribe = () => () => {};
import {
  FileText,
  Users,
  CircleDollarSign,
  FilePlus,
  Upload,
  Check,
  Eye,
  Trash2,
  AlertCircle,
  X,
} from "lucide-react";
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

const BASE_EXTENSIONS = ["pdf", "doc", "docx"];
const ACCEPTED: Record<PieceType, string[]> = {
  fiche_projet: BASE_EXTENSIONS,
  presentation_equipe: BASE_EXTENSIONS,
  budget_previsionnel: BASE_EXTENSIONS,
  autre: [...BASE_EXTENSIONS, "png", "jpg", "jpeg", "webp"],
};

const ICONS: Record<PieceType, React.ComponentType<{ className?: string }>> = {
  fiche_projet: FileText,
  presentation_equipe: Users,
  budget_previsionnel: CircleDollarSign,
  autre: FilePlus,
};

const formatsLabel = (type: PieceType) =>
  ACCEPTED[type]
    .map((e) => (e === "doc" || e === "docx" ? "Word" : e.toUpperCase()))
    .filter((v, i, a) => a.indexOf(v) === i)
    .join(", ");

function formatSize(bytes: number) {
  return bytes < 1024 * 1024
    ? `${Math.max(1, Math.round(bytes / 1024))} Ko`
    : `${(bytes / (1024 * 1024)).toFixed(1)} Mo`;
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
  onRequestDelete,
}: {
  type: PieceType;
  pieces: Piece[];
  sizes: Record<number, number>;
  busy: boolean;
  deletingId: number | null;
  error: string | null;
  disabled: boolean;
  onFile: (type: PieceType, file: File) => void;
  onRequestDelete: (piece: Piece) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const required = type !== "autre";
  const provided = pieces.length > 0;
  const single = required && provided;
  const Icon = ICONS[type] ?? FileText;

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
      className={`flex flex-col justify-between gap-2.5 rounded-xl border p-3 sm:p-3.5 shadow-2xs transition-all ${
        provided && required
          ? "border-[#2E7D32]/40 bg-white"
          : !required
          ? "border-dashed border-[#D6C7B7] bg-[#FCFAF7]"
          : "border-[#E5D8C9] bg-white hover:border-[#C99A68]/80"
      }`}
    >
      {/* Haut de la carte : Icône + Titre + Description + Badge */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex min-w-0 items-start gap-2.5">
          <div
            className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border transition-colors ${
              provided && required
                ? "border-[#2E7D32]/30 bg-[#E3F1E9] text-[#2E7D32]"
                : !required
                ? "border-[#E2D7CC] bg-white text-[#786555]"
                : "border-[#EFE4D6] bg-[#FAF7F2] text-[#612D10]"
            }`}
          >
            {provided && required ? (
              <Check className="h-4 w-4 stroke-[2.5]" />
            ) : (
              <Icon className="h-4 w-4 stroke-[1.75]" />
            )}
          </div>
          <div className="min-w-0">
            <h4 className="font-[family-name:var(--font-title)] text-xs sm:text-[13px] font-bold text-[#24140D] leading-tight">
              {PIECE_LABELS[type].label}
            </h4>
            <p className="mt-0.5 text-[10.5px] leading-snug text-[#6B5646]">
              {PIECE_LABELS[type].description}
            </p>
          </div>
        </div>

        {/* Badge de statut */}
        {required ? (
          <span
            className={`shrink-0 rounded-md px-2 py-0.5 text-[10px] font-bold ${
              provided
                ? "border border-[#2E7D32]/25 bg-[#E3F1E9] text-[#2E7D32]"
                : "border border-[#A35926]/25 bg-[#FDF4E7] text-[#A35926]"
            }`}
          >
            {provided ? "Déposé" : "À fournir"}
          </span>
        ) : (
          <span className="shrink-0 rounded-md border border-[#E2D7CC] bg-[#F3EFE9] px-2 py-0.5 text-[10px] font-bold text-[#786555]">
            {provided ? "Déposé (optionnel)" : "Facultatif"}
          </span>
        )}
      </div>

      {/* Liste des pièces déposées */}
      {pieces.length > 0 && (
        <ul className="space-y-1.5" aria-label={`Fichiers déposés pour ${PIECE_LABELS[type].label}`}>
          {pieces.map((p) => (
            <li
              key={p.id}
              className="flex items-center justify-between gap-2 rounded-lg border border-[#EFE4D6] bg-[#FAF7F2] px-3 py-2 text-xs"
            >
              <div className="min-w-0 flex-1">
                <p className="truncate font-semibold text-[#24140D]">{p.nom}</p>
                {(sizes[p.id] ?? p.taille) && (
                  <p className="text-[10px] text-[#8C6D4F]">
                    {sizes[p.id] ? formatSize(sizes[p.id]) : p.taille}
                  </p>
                )}
              </div>
              <div className="flex shrink-0 items-center gap-1">
                {p.fichier && (
                  <a
                    href={mediaUrl(p.fichier)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex min-h-8 items-center gap-1 rounded-md px-2.5 py-1 text-xs font-semibold text-[#612D10] hover:bg-[#F2E5D5] hover:text-[#3F1D0A] transition-colors cursor-pointer"
                  >
                    <Eye className="h-3.5 w-3.5" />
                    <span>Aperçu</span>
                  </a>
                )}
                {!disabled && (
                  <button
                    type="button"
                    disabled={deletingId === p.id}
                    onClick={() => onRequestDelete(p)}
                    aria-label={`Supprimer ${p.nom}`}
                    title="Supprimer ce document"
                    className="inline-flex min-h-8 min-w-8 items-center justify-center rounded-md text-[#DC2626] hover:bg-[#DC2626]/15 hover:scale-105 transition-all cursor-pointer disabled:opacity-50"
                  >
                    {deletingId === p.id ? (
                      <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-[#DC2626] border-t-transparent" />
                    ) : (
                      <Trash2 className="h-3.5 w-3.5" />
                    )}
                  </button>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}

      {/* Zone de dépôt interactive */}
      {!single && (
        <div
          onDragOver={(e) => {
            e.preventDefault();
            if (!disabled) setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={drop}
          className={`rounded-lg border border-dashed p-2.5 transition-colors ${
            dragging
              ? "border-[#612D10] bg-[#FAF7F2]"
              : !required
              ? "border-[#D6C7B7] bg-[#FCFAF7]"
              : "border-[#DCCBB9] bg-[#FAF7F2]/60"
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
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between gap-1 text-[10.5px]">
              <span className="font-semibold text-[#24140D] truncate">
                {formatsLabel(type)}
                {type === "budget_previsionnel" && (
                  <span className="text-[9.5px] font-normal text-[#A35926] ml-1">
                    (pas d&apos;Excel)
                  </span>
                )}
              </span>
              <span className="shrink-0 text-[10px] text-[#8C6D4F]">
                10 Mo max · Glisser-déposer
              </span>
            </div>

            <button
              type="button"
              disabled={disabled || busy}
              onClick={() => inputRef.current?.click()}
              className="inline-flex h-8 w-full items-center justify-center gap-1.5 rounded-lg bg-[#C99A68] px-3 text-xs font-bold text-[#1F130B] shadow-xs transition-all active:scale-[0.98] hover:bg-[#B88752] hover:shadow-sm cursor-pointer disabled:cursor-not-allowed disabled:opacity-60"
            >
              {busy ? (
                <>
                  <span aria-hidden className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-[#1F130B]/40 border-t-[#1F130B]" />
                  <span>Envoi…</span>
                </>
              ) : (
                <>
                  <Upload className="h-3.5 w-3.5 text-[#1F130B]" />
                  <span>Choisir un fichier</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Message d'erreur localisé */}
      {error && (
        <div role="alert" className="flex items-center gap-2 rounded-lg border border-[#DC2626]/40 bg-[#DC2626]/5 px-2.5 py-1.5 text-xs text-[#DC2626]">
          <AlertCircle className="h-3.5 w-3.5 shrink-0" />
          <span>{error}</span>
        </div>
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

  const [piecePendingDelete, setPiecePendingDelete] = useState<Piece | null>(null);

  const handleConfirmDelete = async () => {
    if (!piecePendingDelete) return;
    const pieceId = piecePendingDelete.id;
    const type = piecePendingDelete.type ?? "autre";
    setError(type, null);
    setDeletingId(pieceId);
    try {
      onChange(await deletePiece(dossier.id, pieceId));
      setPiecePendingDelete(null);
    } catch {
      setError(type, "Impossible de supprimer cette pièce. Veuillez réessayer.");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-4">
      {/* 1. Documents obligatoires (3) */}
      <div>
        <div className="mb-2 flex flex-wrap items-center justify-between gap-1">
          <span className="text-[11px] font-extrabold uppercase tracking-wider text-[#8C6D4F]">
            Documents obligatoires (3 requis)
          </span>
          <span className="text-[10px] font-semibold text-[#A35926]">
            Formats : PDF, Word (DOC/DOCX) · 10 Mo max
          </span>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          {PIECES_OBLIGATOIRES.map((type) => (
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
              onRequestDelete={setPiecePendingDelete}
            />
          ))}
        </div>
      </div>

      {/* 2. Document complémentaire (1) */}
      <div>
        <div className="mb-2 flex items-center justify-between">
          <span className="text-[11px] font-extrabold uppercase tracking-wider text-[#8C6D4F]">
            Document complémentaire (optionnel)
          </span>
          <span className="text-[10px] font-semibold text-[#8C6D4F]">
            Facultatif · Non bloquant
          </span>
        </div>

        <div>
          <PieceCard
            key="autre"
            type="autre"
            pieces={pieces.filter((p) => p.type === "autre")}
            sizes={sizes}
            busy={busyType === "autre"}
            deletingId={deletingId}
            error={errors["autre"] ?? null}
            disabled={disabled}
            onFile={handleFile}
            onRequestDelete={setPiecePendingDelete}
          />
        </div>
      </div>

      {/* Modale de confirmation de suppression d'une pièce */}
      {piecePendingDelete && (
        <DeletePieceModal
          piece={piecePendingDelete}
          isDeleting={Boolean(deletingId)}
          onClose={() => setPiecePendingDelete(null)}
          onConfirm={handleConfirmDelete}
        />
      )}
    </div>
  );
}

interface DeletePieceModalProps {
  piece: Piece;
  isDeleting: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

function DeletePieceModal({ piece, isDeleting, onClose, onConfirm }: DeletePieceModalProps) {
  const mounted = useSyncExternalStore(emptySubscribe, () => true, () => false);

  useEffect(() => {
    if (!mounted) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !isDeleting) {
        onClose();
      }
    };
    window.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [mounted, isDeleting, onClose]);

  if (!mounted) return null;

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-delete-piece-title"
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6"
    >
      <div
        className="fixed inset-0 bg-[#24140D]/65 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
        onClick={() => !isDeleting && onClose()}
        aria-hidden="true"
      />
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative z-10 w-full max-w-lg rounded-2xl border border-[#EFE4D6] bg-white p-5 sm:p-7 shadow-2xl animate-in fade-in zoom-in-95 duration-200"
      >
        <button
          type="button"
          disabled={isDeleting}
          onClick={onClose}
          aria-label="Fermer la boîte de dialogue"
          className="absolute right-4 top-4 inline-flex h-8 w-8 items-center justify-center rounded-xl text-[#8C6D4F] transition-colors hover:bg-[#FAF7F2] hover:text-[#24140D] disabled:opacity-50 cursor-pointer"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-[#FECACA] bg-[#FEE2E2] text-[#DC2626]">
            <Trash2 className="h-6 w-6 stroke-[2.2]" />
          </div>
          <div className="min-w-0 flex-1 pr-6">
            <h3
              id="modal-delete-piece-title"
              className="font-[family-name:var(--font-title)] text-base sm:text-lg font-bold text-[#24140D]"
            >
              Supprimer cette pièce ?
            </h3>
            <p className="mt-1.5 text-xs sm:text-sm text-[#7A583A] leading-relaxed">
              Êtes-vous certain de vouloir retirer le fichier{" "}
              <span className="font-semibold text-[#24140D] break-all">
                « {piece.nom} »
              </span>{" "}
              de votre dossier de candidature ?
            </p>
            <div className="mt-3.5 rounded-xl border border-[#F0E4D8] bg-[#FCFAF7] p-3 text-xs text-[#8C6D4F]">
              Cette action est immédiate, mais vous pourrez déposer un nouveau document à tout moment avant la soumission finale.
            </div>
          </div>
        </div>

        <div className="mt-6 sm:mt-7 flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-2.5 pt-4 border-t border-[#F0E4D8]">
          <button
            type="button"
            disabled={isDeleting}
            onClick={onClose}
            className="cursor-pointer inline-flex min-h-11 items-center justify-center rounded-xl border border-[#E5D8C9] bg-white px-4 py-2.5 text-xs font-semibold text-[#612D10] hover:bg-[#FAF7F2] hover:border-[#C99A68] transition-colors disabled:opacity-50"
          >
            Conserver le document
          </button>
          <button
            type="button"
            disabled={isDeleting}
            onClick={onConfirm}
            className="cursor-pointer inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[#DC2626] px-5 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-[#B91C1C] transition-all disabled:opacity-50"
          >
            {isDeleting ? (
              <>
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                <span>Suppression...</span>
              </>
            ) : (
              <>
                <Trash2 className="h-4 w-4 stroke-[2.2]" />
                <span>Confirmer la suppression</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

export default FileUploader;
