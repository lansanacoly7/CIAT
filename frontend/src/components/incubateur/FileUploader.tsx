"use client";

import { useState, useRef, type DragEvent, type ChangeEvent } from "react";
import {
  PIECE_LABELS,
  uploadPiece,
  deletePiece,
  type Dossier,
  type PieceType,
} from "@/lib/incubator";

interface FileUploaderProps {
  dossier: Dossier;
  onChange: (dossier: Dossier) => void;
  disabled?: boolean;
}

export function FileUploader({
  dossier,
  onChange,
  disabled = false,
}: FileUploaderProps) {
  const pieces = dossier?.pieces ?? [];
  const [selectedType, setSelectedType] = useState<PieceType>("fiche_projet");
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File) => {
    setErrorMessage(null);

    // Contrôle strict de la taille (10 Mo)
    if (file.size > 10 * 1024 * 1024) {
      setErrorMessage(
        `Le fichier « ${file.name} » dépasse la taille maximale autorisée de 10 Mo (${(
          file.size /
          (1024 * 1024)
        ).toFixed(1)} Mo).`
      );
      return;
    }

    setUploading(true);
    try {
      const { dossier: updatedDossier } = await uploadPiece(dossier.id, selectedType, file);
      onChange(updatedDossier);
    } catch (err) {
      setErrorMessage(
        err instanceof Error ? err.message : "Erreur lors du dépôt du fichier."
      );
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const onDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (!disabled) setIsDragging(true);
  };

  const onDragLeave = () => {
    setIsDragging(false);
  };

  const onDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    if (disabled || uploading) return;

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const onFileInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFile(e.target.files[0]);
    }
  };

  const handleDelete = async (pieceId: number) => {
    setDeletingId(pieceId);
    try {
      const updatedDossier = await deletePiece(dossier.id, pieceId);
      onChange(updatedDossier);
    } catch {
      setErrorMessage("Impossible de supprimer cette pièce.");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Sélecteur de type de pièce */}
      <div>
        <label
          htmlFor="piece-type-select"
          className="mb-2 block text-sm font-semibold text-[#24140D]"
        >
          Type de document à téléverser
        </label>
        <div className="grid gap-2 sm:grid-cols-2">
          {(Object.keys(PIECE_LABELS) as PieceType[]).map((type) => {
            const isSelected = selectedType === type;
            const isAlreadyUploaded = pieces.some((p) => p.type === type);

            return (
              <button
                key={type}
                type="button"
                disabled={disabled}
                onClick={() => {
                  setSelectedType(type);
                  setErrorMessage(null);
                }}
                className={`flex flex-col items-start rounded-lg border p-3 text-left transition-all ${
                  isSelected
                    ? "border-[#612D10] bg-[#FAF7F2] ring-2 ring-[#612D10]/20"
                    : "border-[#EFE4D6] bg-white hover:border-[#C99A68]"
                }`}
              >
                <div className="flex w-full items-center justify-between">
                  <span className="text-xs font-bold text-[#612D10]">
                    {PIECE_LABELS[type].label}
                  </span>
                  {isAlreadyUploaded && type !== "autre" && (
                    <span className="rounded bg-[#E3F1E9] px-1.5 py-0.5 text-[10px] font-semibold text-[#2E7D32]">
                      Déjà fourni
                    </span>
                  )}
                </div>
                <span className="mt-1 text-[11px] text-[#6B5646]">
                  {PIECE_LABELS[type].description}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Message d'erreur */}
      {errorMessage && (
        <div
          role="alert"
          className="flex items-center gap-2 rounded-lg border border-[#DC2626]/40 bg-[#DC2626]/10 p-3 text-sm font-medium text-[#DC2626]"
        >
          <svg className="h-5 w-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Zone Drag & Drop */}
      <div
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        onClick={() => !disabled && !uploading && fileInputRef.current?.click()}
        className={`relative flex min-h-[160px] cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed p-6 text-center transition-colors ${
          disabled
            ? "cursor-not-allowed bg-gray-50 opacity-60"
            : isDragging
            ? "border-[#612D10] bg-[#FAF7F2]"
            : "border-[#EFE4D6] bg-white hover:border-[#C99A68] hover:bg-[#FAF7F2]/50"
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx"
          onChange={onFileInputChange}
          className="hidden"
          disabled={disabled || uploading}
        />

        {uploading ? (
          <div className="flex flex-col items-center gap-2">
            <div className="h-8 w-8 animate-spin rounded-full border-3 border-[#C99A68] border-t-[#612D10]" />
            <p className="text-sm font-medium text-[#612D10]">
              Téléversement de {PIECE_LABELS[selectedType].label} en cours...
            </p>
          </div>
        ) : (
          <>
            <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-[#FAF7F2] text-[#612D10]">
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
            </div>
            <p className="text-sm font-semibold text-[#24140D]">
              Glissez-déposez le document ici ou{" "}
              <span className="text-[#612D10] underline">parcourez vos fichiers</span>
            </p>
            <p className="mt-1 text-xs text-[#6B5646]">
              Pour : <strong className="text-[#612D10]">{PIECE_LABELS[selectedType].label}</strong> · PDF, Word ou Excel (10 Mo maximum)
            </p>
          </>
        )}
      </div>

      {/* Liste des pièces déjà téléversées */}
      <div>
        <h4 className="mb-3 text-sm font-bold text-[#612D10]">
          Documents déposés ({pieces.length})
        </h4>

        {pieces.length === 0 ? (
          <div className="rounded-lg border border-[#EFE4D6] bg-white p-4 text-center text-xs text-[#6B5646]">
            Aucun document n&apos;a encore été déposé pour ce dossier.
          </div>
        ) : (
          <div className="space-y-2">
            {pieces.map((piece) => (
              <div
                key={piece.id}
                className="flex items-center justify-between gap-3 rounded-lg border border-[#EFE4D6] bg-white p-3 shadow-xs"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-md bg-[#FAF7F2] text-[#612D10]">
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.5L19 7.5V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-xs font-semibold text-[#24140D]">
                      {piece.nom}
                    </p>
                    <p className="text-[11px] text-[#6B5646]">
                      {PIECE_LABELS[piece.type]?.label ?? piece.type}
                      {piece.taille && ` · ${piece.taille}`}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {piece.fichier && (
                    <a
                      href={piece.fichier}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="rounded-md border border-[#EFE4D6] px-2.5 py-1 text-xs font-medium text-[#612D10] transition-colors hover:bg-[#FAF7F2]"
                    >
                      Aperçu
                    </a>
                  )}
                  {!disabled && (
                    <button
                      type="button"
                      disabled={deletingId === piece.id}
                      onClick={() => handleDelete(piece.id)}
                      className="rounded-md p-1 text-[#DC2626] transition-colors hover:bg-[#DC2626]/10 disabled:opacity-50"
                      aria-label={`Supprimer ${piece.nom}`}
                    >
                      {deletingId === piece.id ? (
                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-[#DC2626] border-t-transparent" />
                      ) : (
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      )}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default FileUploader;
