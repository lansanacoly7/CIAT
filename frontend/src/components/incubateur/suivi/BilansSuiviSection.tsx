"use client";

import { useState } from "react";
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
  const [exporting, setExporting] = useState(false);
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

  async function handleExportExcel() {
    setExporting(true);
    setExportError(null);
    try {
      const blob = await telechargerCompteRendu(projetId);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `compte_rendu_projet_${projetId}.xlsx`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      setExportError(
        suiviErrorMessage(
          err,
          "Impossible de télécharger le compte rendu. Veuillez vérifier vos autorisations.",
        ),
      );
    } finally {
      setExporting(false);
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
      className="rounded-xl border border-bordure bg-white p-6 shadow-xs"
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-bold text-brun">Bilans de suivi périodiques</h2>
          <p className="text-xs text-texte-doux">
            Évaluations d&apos;étape à 3 et 6 mois menées par le mentor et la coordination.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Bouton Export Excel officiel */}
          <button
            type="button"
            onClick={handleExportExcel}
            disabled={exporting}
            className="inline-flex min-h-[38px] items-center gap-1.5 rounded-md border border-[#2E7D32]/40 bg-[#2E7D32]/10 px-3.5 py-1.5 text-xs font-semibold text-[#2E7D32] transition-colors hover:bg-[#2E7D32]/20 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {exporting ? (
              <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-[#2E7D32]/40 border-t-[#2E7D32]" />
            ) : (
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
              </svg>
            )}
            <span>Télécharger le compte rendu (Excel)</span>
          </button>

          {/* Formulaire accessible uniquement au mentor affecté ou à l'équipe CIAT */}
          {canWrite && echeanceDisponible && (
            <Button
              variant={showForm ? "outline" : "primary"}
              className="min-h-[38px] px-3.5 py-1.5 text-xs"
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
          className="mt-4 rounded-lg border border-[#DC2626]/30 bg-[#DC2626]/5 p-3 text-xs text-[#DC2626]"
        >
          {exportError}
        </div>
      )}

      {/* Indicateur de bilans manquants */}
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <div
          className={`flex items-center justify-between rounded-lg border p-3 text-xs ${
            aSuivi3Mois
              ? "border-[#2E7D32]/30 bg-[#2E7D32]/5 text-[#2E7D32]"
              : "border-[#D97706]/40 bg-[#D97706]/5 text-[#D97706]"
          }`}
        >
          <span className="font-semibold">Bilan à 3 mois</span>
          <span>{aSuivi3Mois ? "✓ Enregistré" : "⚠ Bilan en attente"}</span>
        </div>

        <div
          className={`flex items-center justify-between rounded-lg border p-3 text-xs ${
            aSuivi6Mois
              ? "border-[#2E7D32]/30 bg-[#2E7D32]/5 text-[#2E7D32]"
              : "border-[#6B5646]/30 bg-[#FAF7F2] text-texte-doux"
          }`}
        >
          <span className="font-semibold">Bilan à 6 mois</span>
          <span>{aSuivi6Mois ? "✓ Enregistré" : "Échéance future ou à compléter"}</span>
        </div>
      </div>

      {/* Formulaire de création d'un bilan */}
      {showForm && (
        <form onSubmit={handleSubmit} className="mt-5 rounded-lg border border-bordure bg-[#FAF7F2] p-4 text-xs">
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
              className="w-full rounded border border-bordure bg-white px-3 py-2 text-xs text-texte outline-none focus:border-brun"
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
              className="w-full rounded border border-bordure bg-white p-3 text-xs text-texte outline-none placeholder:text-[#9c897a] focus:border-brun"
            />
          </div>

          {/* Saisie d'indicateurs dynamiques */}
          <div className="mb-4">
            <div className="mb-1.5 flex items-center justify-between">
              <span className="font-semibold text-texte">Indicateurs clés (optionnels)</span>
              <button
                type="button"
                onClick={ajouterIndicateur}
                className="text-[11px] font-semibold text-brun underline hover:text-brun-fonce"
              >
                + Ajouter un indicateur
              </button>
            </div>

            <div className="space-y-2">
              {indicateurs.map((ind, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <input
                    type="text"
                    value={ind.cle}
                    onChange={(e) => modifierIndicateur(idx, "cle", e.target.value)}
                    placeholder="Nom de l'indicateur (ex: CA réalisé)"
                    className="flex-1 rounded border border-bordure bg-white px-2.5 py-1.5 text-xs text-texte outline-none focus:border-brun"
                  />
                  <input
                    type="text"
                    value={ind.valeur}
                    onChange={(e) => modifierIndicateur(idx, "valeur", e.target.value)}
                    placeholder="Valeur (ex: 2 500 000 FCFA)"
                    className="w-40 rounded border border-bordure bg-white px-2.5 py-1.5 text-xs text-texte outline-none focus:border-brun"
                  />
                  {indicateurs.length > 1 && (
                    <button
                      type="button"
                      onClick={() => supprimerIndicateur(idx)}
                      aria-label="Supprimer cet indicateur"
                      className="rounded p-1 text-texte-doux hover:text-[#DC2626]"
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
              className="min-h-[38px] px-3.5 py-1.5 text-xs"
              onClick={() => setShowForm(false)}
            >
              Annuler
            </Button>
            <Button
              type="submit"
              className="min-h-[38px] px-3.5 py-1.5 text-xs"
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
          <p className="rounded-lg border border-dashed border-bordure py-6 text-center text-xs text-texte-doux">
            Aucun bilan de suivi n&apos;a encore été rédigé pour ce projet.
          </p>
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
