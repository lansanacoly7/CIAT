"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui";
import {
  creerProjetSuivi,
  formatDateFr,
  suiviErrorMessage,
  telechargerCompteRendu,
  type EcheanceSuivi,
  type SuiviProjet,
} from "@/lib/incubator";

interface BilansSuiviSectionProps {
  projetId: number;
  suivis: SuiviProjet[];
  canWrite: boolean; // mentor affecté ou équipe CIAT (coordonnateur / administrateur)
  onCreated: () => void;
}

export default function BilansSuiviSection({
  projetId,
  suivis,
  canWrite,
  onCreated,
}: BilansSuiviSectionProps) {
  const [showForm, setShowForm] = useState(false);
  const [echeance, setEcheance] = useState<EcheanceSuivi>("3_mois");
  const [bilan, setBilan] = useState("");
  const [indicateurs, setIndicateurs] = useState<{ cle: string; valeur: string }[]>([
    { cle: "Progrès technique (%)", valeur: "" },
  ]);
  const [submitting, setSubmitting] = useState(false);
  const [exporting, setExporting] = useState<"xlsx" | "pdf" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [exportError, setExportError] = useState<string | null>(null);

  // Vérification des bilans déjà renseignés
  const aSuivi3Mois = suivis.some((s) => s.echeance === "3_mois");
  const aSuivi6Mois = suivis.some((s) => s.echeance === "6_mois");

  // Détermination de l'échéance par défaut pour le formulaire
  const echeanceDisponible: EcheanceSuivi | null = !aSuivi3Mois
    ? "3_mois"
    : !aSuivi6Mois
      ? "6_mois"
      : null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!bilan.trim()) {
      setError("Veuillez rédiger le contenu du bilan.");
      return;
    }
    setSubmitting(true);
    setError(null);

    // Construction du dictionnaire d'indicateurs
    const indicateursDict: Record<string, string | number> = {};
    for (const item of indicateurs) {
      const k = item.cle.trim();
      const v = item.valeur.trim();
      if (k && v) {
        indicateursDict[k] = isNaN(Number(v)) ? v : Number(v);
      }
    }

    try {
      await creerProjetSuivi(projetId, {
        echeance,
        bilan: bilan.trim(),
        indicateurs: Object.keys(indicateursDict).length ? indicateursDict : undefined,
      });
      setBilan("");
      setIndicateurs([{ cle: "Progrès technique (%)", valeur: "" }]);
      setShowForm(false);
      onCreated();
    } catch (err) {
      setError(suiviErrorMessage(err, "Impossible d'enregistrer ce bilan de suivi."));
    } finally {
      setSubmitting(false);
    }
  }

  async function handleExport(format: "xlsx" | "pdf") {
    setExporting(format);
    setExportError(null);
    try {
      const blob = await telechargerCompteRendu(projetId, format);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `compte_rendu_projet_${projetId}.${format}`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.setTimeout(() => window.URL.revokeObjectURL(url), 1000);
    } catch (err) {
      setExportError(
        suiviErrorMessage(
          err,
          "Impossible de télécharger le compte rendu. Veuillez vérifier vos autorisations.",
        ),
      );
    } finally {
      setExporting(null);
    }
  }

  function ajouterIndicateur() {
    setIndicateurs((prev) => [...prev, { cle: "", valeur: "" }]);
  }

  function modifierIndicateur(index: number, champ: "cle" | "valeur", valeur: string) {
    setIndicateurs((prev) => {
      const copy = [...prev];
      copy[index][champ] = valeur;
      return copy;
    });
  }

  function supprimerIndicateur(index: number) {
    setIndicateurs((prev) => prev.filter((_, i) => i !== index));
  }

  return (
    <section
      aria-label="Bilans de suivi et compte rendu"
      className="rounded-2xl border border-[#EFE4D6] bg-white p-5 sm:p-7 shadow-xs"
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-[#F2E8DC] pb-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-[#522504] text-[#F7EFE6] shadow-xs">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
            </svg>
          </div>
          <div>
            <h2 className="font-[family-name:var(--font-title)] text-base sm:text-lg font-bold text-[#3D1A04]">
              Bilans de suivi périodiques
            </h2>
            <p className="text-xs text-[#7C6353]">
              Évaluations à 3 et 6 mois menées par le mentor et la coordination.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Bouton Export PDF */}
          <button
            type="button"
            onClick={() => handleExport("pdf")}
            disabled={exporting !== null}
            className="inline-flex min-h-10 items-center gap-1.5 rounded-lg border border-[#612D10]/25 bg-[#FAF7F2] px-3.5 py-1.5 text-xs font-semibold text-[#612D10] transition-colors hover:bg-[#F2E7DC] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {exporting === "pdf" ? (
              <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-[#612D10]/40 border-t-[#612D10]" />
            ) : (
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" aria-hidden>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
              </svg>
            )}
            <span>Compte rendu (PDF)</span>
          </button>

          {/* Bouton Export Excel */}
          <button
            type="button"
            onClick={() => handleExport("xlsx")}
            disabled={exporting !== null}
            className="inline-flex min-h-10 items-center gap-1.5 rounded-lg border border-[#2E7D32]/35 bg-[#2E7D32]/10 px-3.5 py-1.5 text-xs font-semibold text-[#2E7D32] transition-colors hover:bg-[#2E7D32]/20 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {exporting === "xlsx" ? (
              <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-[#2E7D32]/40 border-t-[#2E7D32]" />
            ) : (
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" aria-hidden>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
              </svg>
            )}
            <span>Compte rendu (Excel)</span>
          </button>

          {/* Formulaire accessible uniquement au mentor affecté ou à l'équipe CIAT */}
          {canWrite && echeanceDisponible && (
            <Button
              variant={showForm ? "outline" : "primary"}
              className="min-h-10 px-3.5 py-1.5 text-xs font-semibold"
              onClick={() => {
                setEcheance(echeanceDisponible);
                setShowForm((v) => !v);
              }}
            >
              {showForm ? "Annuler" : "+ Rédiger un bilan"}
            </Button>
          )}
        </div>
      </div>

      {/* Message d'erreur d'export éventuel (notamment 403) */}
      {exportError && (
        <div
          role="alert"
          className="mt-4 rounded-xl border border-[#DC2626]/30 bg-[#DC2626]/5 p-3 text-xs text-[#DC2626]"
        >
          {exportError}
        </div>
      )}

      {/* Cartes récapitulatives des 2 échéances de bilan */}
      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <div className="flex items-center justify-between rounded-xl border border-[#EFE4D6] bg-[#FBF7F2] p-4 transition-colors hover:bg-white">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#FAF4EC] text-[#522504] border border-[#EFE4D6]">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 9v7.5" />
              </svg>
            </div>
            <span className="font-bold text-[#3D1A04] text-sm">Bilan à 3 mois</span>
          </div>
          <div>
            {aSuivi3Mois ? (
              <span className="inline-flex items-center rounded-md bg-[#2E7D32]/10 px-2.5 py-1 text-xs font-semibold text-[#2E7D32]">
                ✓ Enregistré
              </span>
            ) : (
              <span className="inline-flex items-center rounded-md bg-[#FEF3C7] border border-[#FDE68A] px-2.5 py-1 text-xs font-semibold text-[#92400E]">
                En attente
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center justify-between rounded-xl border border-[#EFE4D6] bg-[#FBF7F2] p-4 transition-colors hover:bg-white">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#FAF4EC] text-[#522504] border border-[#EFE4D6]">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 9v7.5" />
              </svg>
            </div>
            <span className="font-bold text-[#3D1A04] text-sm">Bilan à 6 mois</span>
          </div>
          <div>
            {aSuivi6Mois ? (
              <span className="inline-flex items-center rounded-md bg-[#2E7D32]/10 px-2.5 py-1 text-xs font-semibold text-[#2E7D32]">
                ✓ Enregistré
              </span>
            ) : (
              <span className="inline-flex items-center rounded-md bg-white border border-[#EFE4D6] px-2.5 py-1 text-xs font-semibold text-[#7C6353]">
                Échéance future ou à compléter
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Formulaire de création d'un bilan */}
      {showForm && (
        <form onSubmit={handleSubmit} className="mt-5 rounded-lg border border-bordure bg-[#FAF7F2] p-4 text-sm">
          <h3 className="mb-3 text-sm font-bold text-brun">Nouveau bilan de suivi</h3>

          {error && (
            <div role="alert" className="mb-3 rounded border border-[#DC2626]/40 bg-white p-2.5 text-[#DC2626]">
              {error}
            </div>
          )}

          <div className="mb-3">
            <label htmlFor="suivi-echeance" className="mb-1 block font-semibold text-texte">
              Échéance du suivi *
            </label>
            <select
              id="suivi-echeance"
              value={echeance}
              onChange={(e) => setEcheance(e.target.value as EcheanceSuivi)}
              className="min-h-11 w-full rounded-xl border border-[#EFE4D6] bg-white px-3.5 py-2 text-sm text-[#24140D] outline-none transition-all hover:border-[#C99A68] focus:border-[#A35926] focus:ring-2 focus:ring-[#C99A68]/20 cursor-pointer"
            >
              {!aSuivi3Mois && <option value="3_mois">Bilan à 3 mois</option>}
              {!aSuivi6Mois && <option value="6_mois">Bilan à 6 mois</option>}
            </select>
          </div>

          <div className="mb-3">
            <label htmlFor="suivi-bilan" className="mb-1 block font-semibold text-texte">
              Compte rendu & analyse du mentor / coordonnateur *
            </label>
            <textarea
              id="suivi-bilan"
              rows={4}
              required
              value={bilan}
              onChange={(e) => setBilan(e.target.value)}
              placeholder="Détaillez les avancées du projet, les difficultés rencontrées, les pivots éventuels et les recommandations pour la suite..."
              className="w-full rounded border border-bordure bg-white p-3 text-sm text-texte outline-none placeholder:text-[#9c897a] focus:border-brun"
            />
          </div>

          {/* Saisie d'indicateurs dynamiques */}
          <div className="mb-4">
            <div className="mb-1.5 flex items-center justify-between">
              <span className="font-semibold text-texte">Indicateurs clés (optionnels)</span>
              <button
                type="button"
                onClick={ajouterIndicateur}
                className="inline-flex min-h-11 items-center text-sm font-semibold text-brun underline hover:text-brun-fonce"
              >
                + Ajouter un indicateur
              </button>
            </div>

            <div className="space-y-2">
              {indicateurs.map((ind, idx) => (
                <div key={idx} className="flex flex-col gap-2 sm:flex-row sm:items-center">
                  <input
                    type="text"
                    value={ind.cle}
                    onChange={(e) => modifierIndicateur(idx, "cle", e.target.value)}
                    placeholder="Nom de l'indicateur (ex: CA réalisé)"
                    aria-label={`Nom de l’indicateur ${idx + 1}`}
                    className="min-h-11 w-full rounded border border-bordure bg-white px-2.5 py-1.5 text-sm text-texte outline-none focus:border-brun sm:flex-1"
                  />
                  <input
                    type="text"
                    value={ind.valeur}
                    onChange={(e) => modifierIndicateur(idx, "valeur", e.target.value)}
                    placeholder="Valeur (ex: 2 500 000 FCFA)"
                    aria-label={`Valeur de l’indicateur ${idx + 1}`}
                    className="min-h-11 w-full rounded border border-bordure bg-white px-2.5 py-1.5 text-sm text-texte outline-none focus:border-brun sm:w-40"
                  />
                  {indicateurs.length > 1 && (
                    <button
                      type="button"
                      onClick={() => supprimerIndicateur(idx)}
                      aria-label="Supprimer cet indicateur"
                      className="inline-flex min-h-11 min-w-11 items-center justify-center rounded text-texte-doux hover:bg-[#DC2626]/5 hover:text-[#DC2626]"
                    >
                      ✕
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              className="min-h-11 px-3.5 py-1.5 text-xs"
              onClick={() => setShowForm(false)}
            >
              Annuler
            </Button>
            <Button
              type="submit"
              className="min-h-11 px-3.5 py-1.5 text-xs"
              disabled={submitting}
            >
              {submitting ? "Enregistrement…" : "Enregistrer le bilan"}
            </Button>
          </div>
        </form>
      )}

      {/* Liste des bilans enregistrés */}
      <div className="mt-5 space-y-4">
        {suivis.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-2xl bg-[#FAF4EC] text-[#B89C82] shadow-xs">
              <svg className="h-12 w-12" viewBox="0 0 64 64" fill="none" stroke="currentColor" strokeWidth={1.8}>
                <rect x="10" y="24" width="44" height="30" rx="4" fill="#FAF4EC" stroke="#8A7261" />
                <path d="M10 28 L32 28 L36 22 L54 22 C56 22 58 24 58 26 L58 32 L6 32 L6 26 C6 24 8 22 10 22 L24 22 L28 28" fill="#F7EFE6" stroke="#8A7261" />
                <rect x="18" y="14" width="28" height="26" rx="2" fill="#FFFFFF" stroke="#D9C3AB" />
                <line x1="24" y1="20" x2="40" y2="20" stroke="#D9C3AB" strokeWidth={1.5} strokeLinecap="round" />
                <line x1="24" y1="26" x2="36" y2="26" stroke="#D9C3AB" strokeWidth={1.5} strokeLinecap="round" />
                <path d="M8 32 L56 32 L50 54 L14 54 Z" fill="#EFE4D6" stroke="#522504" />
              </svg>
            </div>
            <p className="text-xs sm:text-sm font-medium text-[#7C6353]">
              Aucun bilan de suivi n&apos;a encore été rédigé pour ce projet.
            </p>
            <div className="mt-3">
              <Link
                href="/incubateur/projets"
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#612D10] underline hover:text-[#3D1A04]"
              >
                ← Retour à mes projets
              </Link>
            </div>
          </div>
        ) : (
          suivis.map((s) => (
            <article
              key={s.id}
              className="rounded-lg border border-bordure bg-[#FAF7F2] p-4 text-xs transition-shadow hover:shadow-xs"
            >
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-bordure/60 pb-2">
                <div className="flex items-center gap-2">
                  <span className="rounded-full bg-brun px-2.5 py-0.5 text-[11px] font-bold text-white">
                    {s.echeance === "3_mois" ? "Bilan 3 mois" : "Bilan 6 mois"}
                  </span>
                  <span className="text-texte-doux">
                    Rédigé le {formatDateFr(s.cree_le)}
                    {s.redige_par_nom && ` par ${s.redige_par_nom}`}
                  </span>
                </div>
              </div>

              <p className="mt-3 whitespace-pre-line text-texte leading-relaxed">
                {s.bilan}
              </p>

              {s.indicateurs && Object.keys(s.indicateurs).length > 0 && (
                <div className="mt-3 border-t border-bordure/50 pt-2.5">
                  <h4 className="mb-1.5 text-[11px] font-semibold text-brun">
                    Indicateurs relevés :
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {Object.entries(s.indicateurs).map(([k, v]) => (
                      <span
                        key={k}
                        className="inline-flex items-center gap-1.5 rounded-md border border-bordure bg-white px-2.5 py-1 text-[11px]"
                      >
                        <span className="text-texte-doux">{k} :</span>
                        <span className="font-semibold text-brun">{String(v)}</span>
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </article>
          ))
        )}
      </div>
    </section>
  );
}
