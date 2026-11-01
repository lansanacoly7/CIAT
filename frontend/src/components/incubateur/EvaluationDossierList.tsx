"use client";

import { useMemo, useState } from "react";
import {
  Search,
  X,
  Clock,
  CheckCircle2,
  AlertCircle,
  XCircle,
} from "lucide-react";
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
  const label = STATUT_LABELS[statut]?.label ?? statut;
  const tone = TONES[statut] ?? "neutre";

  const icons: Record<DossierStatut, React.ReactNode> = {
    brouillon: <Clock className="h-3 w-3" />,
    soumis: <AlertCircle className="h-3 w-3" />,
    complet: <CheckCircle2 className="h-3 w-3" />,
    en_evaluation: <Clock className="h-3 w-3" />,
    accepte: <CheckCircle2 className="h-3 w-3" />,
    refuse: <XCircle className="h-3 w-3" />,
  };

  return (
    <span className="inline-flex items-center gap-1.5">
      <Badge tone={tone}>
        <span className="inline-flex items-center gap-1">
          {icons[statut]}
          <span>{label}</span>
        </span>
      </Badge>
    </span>
  );
}

const DOT: Partial<Record<DossierStatut, string>> = {
  soumis: "bg-amber-500",
  en_evaluation: "bg-blue-500",
  accepte: "bg-emerald-600",
  refuse: "bg-red-500",
};

const FILTERS: { value: DossierStatut | "tous"; label: string }[] = [
  { value: "tous", label: "Tous" },
  { value: "soumis", label: "À instruire" },
  { value: "en_evaluation", label: "En jury" },
  { value: "accepte", label: "Retenus" },
  { value: "refuse", label: "Non retenus" },
];

export function formatDate(iso: string | null) {
  return iso
    ? new Date(iso).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" })
    : "—";
}

export default function EvaluationDossierList({
  dossiers,
  selectedId,
  scores,
  onSelect,
  activeFilter,
  onFilterChange,
}: {
  dossiers: DossierEval[];
  selectedId: number | null;
  /** Scores moyens connus par id de dossier (prioritaires sur `score_moyen` du dossier). */
  scores: Record<number, number | null>;
  onSelect: (id: number) => void;
  activeFilter?: DossierStatut | "tous";
  onFilterChange?: (filter: DossierStatut | "tous") => void;
}) {
  const [internalFilter, setInternalFilter] = useState<DossierStatut | "tous">("tous");
  const [query, setQuery] = useState("");
  const [selectedDomain, setSelectedDomain] = useState<string>("tous");

  const filter = activeFilter !== undefined ? activeFilter : internalFilter;
  const setFilter = (val: DossierStatut | "tous") => {
    if (onFilterChange) onFilterChange(val);
    setInternalFilter(val);
  };

  // Statistiques de comptage par statut
  const counts = useMemo(() => {
    return {
      tous: dossiers.length,
      soumis: dossiers.filter((d) => d.statut === "soumis").length,
      en_evaluation: dossiers.filter((d) => d.statut === "en_evaluation").length,
      accepte: dossiers.filter((d) => d.statut === "accepte").length,
      refuse: dossiers.filter((d) => d.statut === "refuse").length,
    };
  }, [dossiers]);

  // Filtrage et tri
  const shown = useMemo(() => {
    const q = query.trim().toLowerCase();
    const filtered = dossiers.filter((d) => {
      const matchFilter = filter === "tous" || d.statut === filter;
      const matchDomain = selectedDomain === "tous" || d.projet.domaine_nom === selectedDomain;
      const matchQuery =
        !q ||
        [d.projet.titre, d.porteur_nom, d.projet.domaine_nom].some((v) =>
          v?.toLowerCase().includes(q),
        );
      return matchFilter && matchDomain && matchQuery;
    });

    return filtered.sort(
      (a, b) => new Date(b.soumis_le || 0).getTime() - new Date(a.soumis_le || 0).getTime(),
    );
  }, [dossiers, filter, selectedDomain, query]);

  return (
    <div className="flex flex-col h-full rounded-2xl border border-[#EFE4D6] bg-white shadow-sm overflow-hidden">
      {/* En-tête des contrôles */}
      <div className="p-3 border-b border-[#EFE4D6] space-y-2.5 shrink-0">
        {/* Barre de recherche avec icône */}
        <div className="relative">
          <label htmlFor="recherche-dossier" className="sr-only">
            Rechercher un dossier
          </label>
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#8C5E2D]/60 pointer-events-none" />
          <input
            id="recherche-dossier"
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Rechercher"
            className="min-h-10 w-full rounded-xl border border-[#EFE4D6] bg-white pl-9.5 pr-8 text-sm text-[#24140D] outline-none transition-all placeholder:text-[#a08f80] focus:border-[#C99A68] focus:ring-2 focus:ring-[#C99A68]/30 shadow-xs"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-700 p-1 rounded-md"
              aria-label="Effacer la recherche"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        {/* Filtres par statut avec badges de comptage */}
        <div
          role="group"
          aria-label="Filtrer par statut"
          className="flex flex-wrap gap-1.5 pt-0.5"
        >
          {FILTERS.map((f) => {
            const count = counts[f.value as keyof typeof counts] ?? 0;
            const active = filter === f.value;
            return (
              <button
                key={f.value}
                type="button"
                aria-pressed={active}
                onClick={() => setFilter(f.value)}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  active
                    ? "bg-[#612D10] text-white shadow-xs"
                    : "bg-white text-[#612D10] border border-[#EFE4D6] hover:bg-[#FAF7F2] hover:border-[#C99A68]"
                }`}
              >
                <span>{f.label}</span>
                <span
                  className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                    active ? "bg-white/20 text-white" : "bg-[#FAF7F2] text-[#8C5E2D]"
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>

      </div>

      {/* Liste défilante scrollable avec hauteur bornée */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2.5">
        {shown.length === 0 ? (
          <div className="rounded-xl border border-dashed border-[#EFE4D6] bg-[#FAF7F2]/40 p-8 text-center">
            <AlertCircle className="mx-auto h-8 w-8 text-[#C99A68] mb-2" />
            <p className="text-sm font-semibold text-[#612D10]">Aucun dossier trouvé</p>
            <p className="text-xs text-[#8C5E2D] mt-1">
              Modifiez vos critères de recherche ou réinitialisez les filtres.
            </p>
            {(query || filter !== "tous" || selectedDomain !== "tous") && (
              <button
                type="button"
                onClick={() => {
                  setQuery("");
                  setFilter("tous");
                  setSelectedDomain("tous");
                }}
                className="mt-3 inline-flex items-center gap-1 text-xs font-bold text-[#612D10] underline hover:text-[#3F1D0A]"
              >
                Réinitialiser tous les filtres
              </button>
            )}
          </div>
        ) : (
          <ul className="space-y-2.5">
            {shown.map((d) => {
              const score = d.id in scores ? scores[d.id] : d.score_moyen;
              const active = d.id === selectedId;

              return (
                <li key={d.id}>
                  <button
                    type="button"
                    onClick={() => onSelect(d.id)}
                    aria-current={active}
                    className={`group relative block w-full rounded-xl border p-3 text-left transition-all ${
                      active
                        ? "border-[#C99A68] bg-[#FBF8F3]"
                        : "border-[#EFE4D6] bg-white hover:border-[#C99A68]"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <h4 className="text-sm font-semibold text-[#21130D] leading-snug">
                          {d.projet.titre}
                        </h4>
                        <p className="mt-0.5 truncate text-xs text-[#5A4B42]">
                          {d.porteur_nom || "Porteur non renseigné"}
                          {d.projet.domaine_nom ? ` · ${d.projet.domaine_nom}` : ""}
                        </p>
                      </div>
                      <div className="flex shrink-0 flex-col items-end gap-1">
                        <span className="inline-flex items-center gap-1.5 text-[11px] text-[#5A4B42]">
                          <span className={`h-2 w-2 rounded-full ${DOT[d.statut] ?? "bg-zinc-300"}`} aria-hidden="true" />
                          {STATUT_LABELS[d.statut]?.label ?? d.statut}
                        </span>
                        {score == null ? (
                          <span className="text-[11px] text-amber-700">En attente</span>
                        ) : (
                          <span className="text-sm font-semibold text-[#2E7D32] tabular-nums">
                            {score.toFixed(1)}
                          </span>
                        )}
                      </div>
                    </div>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
