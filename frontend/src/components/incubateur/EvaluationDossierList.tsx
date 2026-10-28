"use client";

import { useMemo, useState } from "react";
import {
  Search,
  X,
  User,
  Calendar,
  Clock,
  Award,
  Filter,
  Tag,
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

const FILTERS: { value: DossierStatut | "tous"; label: string }[] = [
  { value: "tous", label: "Tous" },
  { value: "soumis", label: "1. À instruire" },
  { value: "en_evaluation", label: "2. En jury" },
  { value: "accepte", label: "3. Retenus" },
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
  const [sortBy, setSortBy] = useState<"recent" | "ancien" | "score_desc" | "score_asc">("recent");

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

  // Liste des domaines uniques
  const domains = useMemo(() => {
    const set = new Set<string>();
    dossiers.forEach((d) => {
      if (d.projet.domaine_nom) set.add(d.projet.domaine_nom);
    });
    return Array.from(set).sort();
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

    return filtered.sort((a, b) => {
      if (sortBy === "recent") {
        return (new Date(b.soumis_le || 0).getTime()) - (new Date(a.soumis_le || 0).getTime());
      }
      if (sortBy === "ancien") {
        return (new Date(a.soumis_le || 0).getTime()) - (new Date(b.soumis_le || 0).getTime());
      }
      const scoreA = (a.id in scores ? scores[a.id] : a.score_moyen) ?? -1;
      const scoreB = (b.id in scores ? scores[b.id] : b.score_moyen) ?? -1;
      if (sortBy === "score_desc") return scoreB - scoreA;
      if (sortBy === "score_asc") return scoreA - scoreB;
      return 0;
    });
  }, [dossiers, filter, selectedDomain, query, sortBy, scores]);

  return (
    <div className="flex flex-col h-full rounded-2xl border border-[#EFE4D6] bg-white shadow-sm overflow-hidden">
      {/* En-tête des contrôles */}
      <div className="p-4 border-b border-[#EFE4D6] bg-[#FAF7F2]/60 space-y-3 shrink-0">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-[#8C5E2D] flex items-center gap-1.5">
            <Filter className="h-3.5 w-3.5 text-[#C99A68]" />
            File des candidatures
          </span>
          <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-white border border-[#EFE4D6] text-[#612D10]">
            {shown.length} / {dossiers.length}
          </span>
        </div>

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
            placeholder="Rechercher (projet, porteur, domaine)…"
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

        {/* Filtre Domaine & Tri */}
        <div className="grid grid-cols-2 gap-2 pt-1">
          <div className="relative">
            <select
              value={selectedDomain}
              onChange={(e) => setSelectedDomain(e.target.value)}
              aria-label="Filtrer par secteur"
              className="w-full text-xs py-1.5 pl-2.5 pr-7 rounded-lg border border-[#EFE4D6] bg-white text-[#24140D] font-medium outline-none focus:border-[#C99A68]"
            >
              <option value="tous">Tous les secteurs</option>
              {domains.map((dom) => (
                <option key={dom} value={dom}>
                  {dom}
                </option>
              ))}
            </select>
          </div>

          <div className="relative">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
              aria-label="Trier les candidatures"
              className="w-full text-xs py-1.5 pl-2.5 pr-7 rounded-lg border border-[#EFE4D6] bg-white text-[#24140D] font-medium outline-none focus:border-[#C99A68]"
            >
              <option value="recent">Plus récents d&apos;abord</option>
              <option value="ancien">Plus anciens d&apos;abord</option>
              <option value="score_desc">Meilleur score</option>
              <option value="score_asc">Score le plus bas</option>
            </select>
          </div>
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
                    className={`group relative block w-full rounded-xl border p-3.5 text-left transition-all ${
                      active
                        ? "border-[#C99A68] bg-[#FAF7F2] ring-2 ring-[#C99A68]/40 shadow-xs border-l-4 border-l-[#612D10]"
                        : "border-[#EFE4D6] bg-white hover:border-[#C99A68] hover:bg-[#FAF7F2]/40 hover:shadow-xs"
                    }`}
                  >
                    {/* Ligne 1 : Titre & Statut */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="space-y-1">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {d.statut === "soumis" ? (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                              Étape 1 • Instruction
                            </span>
                          ) : d.statut === "en_evaluation" ? (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-blue-800 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200">
                              Étape 2 • En jury
                            </span>
                          ) : d.statut === "accepte" ? (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                              Étape 3 • Admis
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-red-800 bg-red-50 px-2 py-0.5 rounded-full border border-red-200">
                              Étape 3 • Refusé
                            </span>
                          )}
                        </div>
                        <h4 className="font-[family-name:var(--font-title)] text-sm font-bold text-[#612D10] leading-snug group-hover:text-[#3F1D0A]">
                          {d.projet.titre}
                        </h4>
                      </div>
                      <div className="shrink-0">
                        <StatutBadge statut={d.statut} />
                      </div>
                    </div>

                    {/* Ligne 2 : Porteur & Domaine */}
                    <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-[#6B5646]">
                      <span className="inline-flex items-center gap-1 font-medium text-[#24140D]">
                        <User className="h-3 w-3 text-[#C99A68]" />
                        <span>{d.porteur_nom || "Porteur non renseigné"}</span>
                      </span>

                      {d.projet.domaine_nom && (
                        <span className="inline-flex items-center gap-1 rounded bg-[#EFE4D6]/60 px-1.5 py-0.5 text-[11px] font-semibold text-[#612D10]">
                          <Tag className="h-2.5 w-2.5" />
                          <span>{d.projet.domaine_nom}</span>
                        </span>
                      )}
                    </div>

                    {/* Ligne 3 : Date de dépôt & Score / En attente */}
                    <div className="mt-2.5 pt-2 border-t border-[#EFE4D6]/70 flex items-center justify-between text-xs">
                      <span className="inline-flex items-center gap-1 text-[#8C5E2D]">
                        <Calendar className="h-3 w-3" />
                        <span>Soumis le {formatDate(d.soumis_le)}</span>
                      </span>

                      <div>
                        {score == null ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 border border-amber-200 px-2 py-0.5 text-[11px] font-bold text-amber-800">
                            <Clock className="h-2.5 w-2.5" />
                            <span>En attente</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-full bg-[#E3F1E9] border border-[#2E7D32]/30 px-2.5 py-0.5 text-[11px] font-extrabold text-[#2E7D32]">
                            <Award className="h-3 w-3" />
                            <span>Score : {score.toFixed(1)}</span>
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
