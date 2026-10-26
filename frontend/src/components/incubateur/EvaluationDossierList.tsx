"use client";

import { useMemo, useState } from "react";
import { Badge } from "@/components/ui";
import { STATUT_LABELS, type Dossier, type DossierStatut } from "@/lib/incubator";

/** Dossier enrichi pour l'écran du comité (projet complet, porteur, score moyen si connu). */
export type DossierEval = Dossier & { porteur_nom?: string; score_moyen?: number | null };

const TONES: Record<DossierStatut, "succes" | "alerte" | "erreur" | "neutre"> = {
  brouillon: "neutre",
  soumis: "alerte",
  complet: "succes",
  en_evaluation: "neutre",
  accepte: "succes",
  refuse: "erreur",
};

export function StatutBadge({ statut }: { statut: DossierStatut }) {
  return <Badge tone={TONES[statut] ?? "neutre"}>{STATUT_LABELS[statut]?.label ?? statut}</Badge>;
}

const FILTERS: { value: DossierStatut | "tous"; label: string }[] = [
  { value: "tous", label: "Tous" },
  { value: "soumis", label: "Soumis" },
  { value: "en_evaluation", label: "En évaluation" },
  { value: "accepte", label: "Accepté" },
  { value: "refuse", label: "Refusé" },
];

export function formatDate(iso: string | null) {
  return iso ? new Date(iso).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" }) : "—";
}

export default function EvaluationDossierList({
  dossiers,
  selectedId,
  scores,
  onSelect,
}: {
  dossiers: DossierEval[];
  selectedId: number | null;
  /** Scores moyens connus par id de dossier (prioritaires sur `score_moyen` du dossier). */
  scores: Record<number, number | null>;
  onSelect: (id: number) => void;
}) {
  const [filter, setFilter] = useState<DossierStatut | "tous">("tous");
  const [query, setQuery] = useState("");

  const shown = useMemo(() => {
    const q = query.trim().toLowerCase();
    return dossiers.filter(
      (d) =>
        (filter === "tous" || d.statut === filter) &&
        (!q ||
          [d.projet.titre, d.porteur_nom, d.projet.domaine_nom].some((v) => v?.toLowerCase().includes(q))),
    );
  }, [dossiers, filter, query]);

  return (
    <div>
      <label htmlFor="recherche-dossier" className="sr-only">
        Rechercher un dossier
      </label>
      <input
        id="recherche-dossier"
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Rechercher (projet, porteur, domaine)…"
        className="min-h-11 w-full rounded-md border border-[#EFE4D6] bg-white px-3 text-[#24140D] outline-none placeholder:text-[#a08f80] focus:border-[#C99A68] focus:ring-2 focus:ring-[#C99A68]/40"
      />

      <div role="group" aria-label="Filtrer par statut" className="-mx-1 mt-3 flex flex-wrap gap-2 px-1">
        {FILTERS.map((f) => (
          <button
            key={f.value}
            type="button"
            aria-pressed={filter === f.value}
            onClick={() => setFilter(f.value)}
            className={`min-h-11 rounded-full border px-4 text-sm font-semibold transition-colors ${
              filter === f.value
                ? "border-[#612D10] bg-[#612D10] text-white"
                : "border-[#EFE4D6] bg-white text-[#612D10] hover:bg-[#FAF7F2]"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {shown.length === 0 ? (
        <p className="mt-6 rounded-lg border border-dashed border-[#EFE4D6] bg-white p-6 text-center text-sm text-[#6b5646]">
          Aucun dossier ne correspond à votre recherche.
        </p>
      ) : (
        <ul className="mt-4 space-y-3">
          {shown.map((d) => {
            const score = d.id in scores ? scores[d.id] : d.score_moyen;
            const active = d.id === selectedId;
            return (
              <li key={d.id}>
                <button
                  type="button"
                  onClick={() => onSelect(d.id)}
                  aria-current={active}
                  className={`block min-h-11 w-full rounded-lg border p-4 text-left transition-colors ${
                    active ? "border-[#C99A68] bg-white ring-2 ring-[#C99A68]/50" : "border-[#EFE4D6] bg-white hover:border-[#C99A68]"
                  }`}
                >
                  <span className="flex items-start justify-between gap-2">
                    <span className="font-[family-name:var(--font-title)] font-bold text-[#612D10]">{d.projet.titre}</span>
                    <StatutBadge statut={d.statut} />
                  </span>
                  <span className="mt-1 block text-sm text-[#24140D]">{d.porteur_nom || "Porteur non renseigné"}</span>
                  <span className="block text-sm text-[#6b5646]">{d.projet.domaine_nom || "Domaine non renseigné"}</span>
                  <span className="mt-2 flex justify-between text-xs text-[#6b5646]">
                    <span>Soumis le {formatDate(d.soumis_le)}</span>
                    <span className="font-semibold text-[#24140D]">
                      {score == null ? "En attente" : `Score : ${score.toFixed(1)}`}
                    </span>
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
