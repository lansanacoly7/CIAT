"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import { AlertTriangle, Trash2, Undo2, X } from "lucide-react";
import { supprimerProjet, suiviErrorMessage } from "@/lib/incubator";

const emptySubscribe = () => () => {};

export interface ProjetASupprimer {
  id: number;
  titre: string;
  statut: string;
}

/** Un projet au stade « idée » est supprimé ; un dossier déposé est retiré de l'instruction. */
export function peutSupprimerOuRetirer(statut: string): boolean {
  return statut === "idee" || statut === "depose";
}

interface Props {
  projet: ProjetASupprimer;
  onClose: () => void;
  onDone: (projetId: number) => void;
}

export default function DeleteProjectModal({ projet, onClose, onDone }: Props) {
  const mounted = useSyncExternalStore(emptySubscribe, () => true, () => false);
  const retrait = projet.statut === "depose";
  const [confirmation, setConfirmation] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Verrouillage du défilement d'arrière-plan + fermeture à la touche Échap
  useEffect(() => {
    if (!mounted) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !busy) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [mounted, busy, onClose]);

  // Focus automatique sur le champ de saisie si confirmation demandée
  useEffect(() => {
    if (mounted && retrait) {
      inputRef.current?.focus();
    }
  }, [mounted, retrait]);

  const titreOk = confirmation.trim().toLowerCase() === projet.titre.trim().toLowerCase();
  const canConfirm = !busy && (!retrait || titreOk);

  const confirmer = async () => {
    if (!canConfirm) return;
    setBusy(true);
    setError(null);
    try {
      await supprimerProjet(projet.id);
      onDone(projet.id);
    } catch (err) {
      setError(suiviErrorMessage(err, "Action impossible pour le moment. Veuillez réessayer."));
      setBusy(false);
    }
  };

  if (!mounted) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-confirm-title"
    >
      {/* Arrière-plan assombri avec flou doux — plein écran viewport */}
      <div
        className="fixed inset-0 bg-[#24140D]/65 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
        onClick={() => !busy && onClose()}
        aria-hidden="true"
      />

      {/* Boîte de dialogue centrée sur le viewport actif */}
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative z-10 w-full max-w-lg rounded-2xl border border-[#EFE4D6] bg-white p-5 sm:p-7 shadow-2xl animate-in fade-in zoom-in-95 duration-200"
      >
        {/* Bouton de fermeture discret en haut à droite */}
        <button
          type="button"
          disabled={busy}
          onClick={onClose}
          aria-label="Fermer la boîte de dialogue"
          className="absolute right-4 top-4 inline-flex h-8 w-8 items-center justify-center rounded-xl text-[#8C6D4F] transition-colors hover:bg-[#FAF7F2] hover:text-[#24140D] disabled:opacity-50 cursor-pointer"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="flex items-start gap-4">
          <div
            className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border ${
              retrait
                ? "border-[#F0DCBA] bg-[#FDF4E7] text-[#A35926]"
                : "border-[#FECACA] bg-[#FEE2E2] text-[#DC2626]"
            }`}
          >
            {retrait ? <Undo2 className="h-6 w-6 stroke-[2.2]" /> : <Trash2 className="h-6 w-6 stroke-[2.2]" />}
          </div>

          <div className="min-w-0 flex-1 pr-6">
            <h3
              id="modal-confirm-title"
              className="font-[family-name:var(--font-title)] text-base sm:text-lg font-bold text-[#24140D]"
            >
              {retrait ? "Retirer ma candidature ?" : "Supprimer définitivement ce projet ?"}
            </h3>

            <p className="mt-1.5 text-xs sm:text-sm leading-relaxed text-[#7A583A]">
              {retrait ? (
                <>
                  Votre dossier <span className="font-semibold text-[#24140D]">« {projet.titre} »</span> sera retiré
                  de l&apos;instruction du comité. Une trace archivée du retrait est conservée pour conformité avec le CIAT.
                </>
              ) : (
                <>
                  Le projet <span className="font-semibold text-[#24140D]">« {projet.titre} »</span> et l&apos;ensemble de
                  ses pièces jointes seront supprimés. Cette action est irréversible.
                </>
              )}
            </p>

            {retrait && (
              <div className="mt-4 rounded-xl border border-[#F0E4D8] bg-[#FCFAF7] p-3.5 space-y-2">
                <label htmlFor="confirm-titre" className="block text-[11px] font-bold text-[#612D10]">
                  Pour confirmer, saisissez exactement le titre du projet :
                </label>
                <div className="rounded-md bg-white px-2.5 py-1.5 border border-[#E5D8C9] text-[11px] font-mono text-[#4A2810] break-all select-all">
                  {projet.titre}
                </div>
                <input
                  ref={inputRef}
                  id="confirm-titre"
                  type="text"
                  value={confirmation}
                  onChange={(e) => setConfirmation(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && canConfirm) {
                      e.preventDefault();
                      confirmer();
                    }
                  }}
                  disabled={busy}
                  placeholder="Recopiez le titre ici..."
                  className="w-full rounded-lg border border-[#E5D8C9] bg-white px-3 py-2 text-xs text-[#24140D] placeholder:text-[#8C6D4F]/60 focus:border-[#C99A68] focus:outline-none focus:ring-2 focus:ring-[#C99A68]/25"
                />
              </div>
            )}

            {error && (
              <div className="mt-3.5 flex items-start gap-2 rounded-xl border border-[#FECACA] bg-[#FEF2F2] p-3 text-xs text-[#B91C1C]">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                <span className="leading-snug">{error}</span>
              </div>
            )}
          </div>
        </div>

        {/* Boutons d'action */}
        <div className="mt-6 sm:mt-7 flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-2.5 pt-4 border-t border-[#F0E4D8]">
          <button
            type="button"
            disabled={busy}
            onClick={onClose}
            className="cursor-pointer inline-flex min-h-11 items-center justify-center rounded-xl border border-[#E5D8C9] bg-white px-4 py-2.5 text-xs font-semibold text-[#612D10] transition-colors hover:bg-[#FAF7F2] hover:border-[#C99A68] disabled:opacity-50"
          >
            {retrait ? "Conserver ma candidature" : "Conserver le projet"}
          </button>

          <button
            type="button"
            disabled={!canConfirm}
            onClick={confirmer}
            className={`cursor-pointer inline-flex min-h-11 items-center justify-center gap-2 rounded-xl px-5 py-2.5 text-xs font-bold text-white shadow-sm transition-all disabled:cursor-not-allowed disabled:opacity-40 ${
              retrait
                ? "bg-[#A35926] hover:bg-[#8C4A1C]"
                : "bg-[#DC2626] hover:bg-[#B91C1C]"
            }`}
          >
            {busy ? (
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
            ) : retrait ? (
              <Undo2 className="h-4 w-4 stroke-[2.2]" />
            ) : (
              <Trash2 className="h-4 w-4 stroke-[2.2]" />
            )}
            <span>
              {busy
                ? "Traitement en cours..."
                : retrait
                ? "Confirmer le retrait"
                : "Supprimer définitivement"}
            </span>
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

