"use client";

import { useMemo, useState } from "react";
import { Calendar, Filter, RotateCcw } from "lucide-react";
import type { DashboardFilters } from "../types";

interface StickyFiltersBarProps {
  filters: DashboardFilters;
  onChange: (filters: DashboardFilters) => void;
  onReset: () => void;
  isFiltered: boolean;
}

const COHORTES = [
  { value: "2024", label: "Cohorte 2024" },
  { value: "2025", label: "Cohorte 2025" },
  { value: "2026", label: "Cohorte 2026" },
];

const DOMAINES = [
  { value: "sante", label: "Santé & Medtech" },
  { value: "agriculture", label: "Agro-alimentaire" },
  { value: "tic", label: "TIC & Numérique" },
  { value: "energie", label: "Énergies & Climat" },
  { value: "industrie", label: "Industrie & Matériaux" },
  { value: "education", label: "Éducation & EdTech" },
];

const STATUTS = [
  { value: "idee", label: "Idée reçue" },
  { value: "depose", label: "Dossier déposé" },
  { value: "selectionne", label: "Sélectionné" },
  { value: "incube", label: "En incubation" },
  { value: "prototype", label: "Prototype validé" },
  { value: "termine", label: "Terminé" },
  { value: "rejete", label: "Non retenu" },
];

const PRESETS = [
  { label: "Tout l'historique", value: "all" },
  { label: "30 derniers jours", value: "30d" },
  { label: "Ce trimestre", value: "quarter" },
  { label: "Année en cours", value: "year" },
];

export function StickyFiltersBar({
  filters,
  onChange,
  onReset,
  isFiltered,
}: StickyFiltersBarProps) {
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);

  // Compteur des filtres appliqués
  const activeCount = useMemo(() => {
    let count = 0;
    if (filters.cohorte) count++;
    if (filters.domaine) count++;
    if (filters.statut) count++;
    if (filters.debut || filters.fin) count++;
    return count;
  }, [filters]);

  const handlePreset = (preset: string) => {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, "0");
    const dd = String(today.getDate()).padStart(2, "0");
    const todayStr = `${yyyy}-${mm}-${dd}`;

    if (preset === "all") {
      onChange({ ...filters, debut: undefined, fin: undefined });
    } else if (preset === "30d") {
      const past = new Date();
      past.setDate(past.getDate() - 30);
      const pastStr = `${past.getFullYear()}-${String(
        past.getMonth() + 1
      ).padStart(2, "0")}-${String(past.getDate()).padStart(2, "0")}`;
      onChange({ ...filters, debut: pastStr, fin: todayStr });
    } else if (preset === "quarter") {
      const past = new Date();
      past.setMonth(past.getMonth() - 3);
      const pastStr = `${past.getFullYear()}-${String(
        past.getMonth() + 1
      ).padStart(2, "0")}-${String(past.getDate()).padStart(2, "0")}`;
      onChange({ ...filters, debut: pastStr, fin: todayStr });
    } else if (preset === "year") {
      const yearStart = `${yyyy}-01-01`;
      onChange({ ...filters, debut: yearStart, fin: todayStr });
    }
    setIsCalendarOpen(false);
  };

  return (
    <div className="sticky top-2 z-30 mx-auto max-w-7xl transition-all">
      <div className="rounded-2xl border border-[rgba(60,35,20,0.08)] bg-white/95 px-3 py-2 sm:px-4 sm:py-2.5 shadow-[0_4px_20px_rgba(60,35,20,0.06)] backdrop-blur-md">
        <div className="flex flex-wrap items-center justify-between gap-2.5">
          {/* Groupe des sélecteurs en pilule */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.06em] text-[#5A4B42]">
              <Filter className="h-3.5 w-3.5 text-[#C99A68]" />
              <span className="hidden sm:inline">Filtres :</span>
            </span>

            {/* Cohorte */}
            <select
              value={filters.cohorte || ""}
              onChange={(e) =>
                onChange({
                  ...filters,
                  cohorte: e.target.value || undefined,
                })
              }
              aria-label="Filtrer par cohorte"
              className="h-8 rounded-lg border border-[rgba(60,35,20,0.12)] bg-[#FBF8F3] px-2.5 text-xs font-medium text-[#21130D] transition hover:border-[#C99A68] focus:border-[#C99A68] focus:bg-white focus:outline-hidden"
            >
              <option value="">Toutes les cohortes</option>
              {COHORTES.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </select>

            {/* Domaine */}
            <select
              value={filters.domaine || ""}
              onChange={(e) =>
                onChange({
                  ...filters,
                  domaine: e.target.value || undefined,
                })
              }
              aria-label="Filtrer par domaine"
              className="h-8 rounded-lg border border-[rgba(60,35,20,0.12)] bg-[#FBF8F3] px-2.5 text-xs font-medium text-[#21130D] transition hover:border-[#C99A68] focus:border-[#C99A68] focus:bg-white focus:outline-hidden"
            >
              <option value="">Tous les domaines</option>
              {DOMAINES.map((d) => (
                <option key={d.value} value={d.value}>
                  {d.label}
                </option>
              ))}
            </select>

            {/* Statut */}
            <select
              value={filters.statut || ""}
              onChange={(e) =>
                onChange({
                  ...filters,
                  statut: e.target.value || undefined,
                })
              }
              aria-label="Filtrer par statut"
              className="h-8 rounded-lg border border-[rgba(60,35,20,0.12)] bg-[#FBF8F3] px-2.5 text-xs font-medium text-[#21130D] transition hover:border-[#C99A68] focus:border-[#C99A68] focus:bg-white focus:outline-hidden"
            >
              <option value="">Tous les statuts</option>
              {STATUTS.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>

            {/* Période / DateRange dropdown */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setIsCalendarOpen(!isCalendarOpen)}
                className={`inline-flex h-8 items-center gap-1.5 rounded-lg border px-2.5 text-xs font-medium transition ${
                  filters.debut || filters.fin
                    ? "border-[#C99A68] bg-[#FBF8F3] text-[#21130D]"
                    : "border-[rgba(60,35,20,0.12)] bg-[#FBF8F3] text-[#21130D] hover:border-[#C99A68]"
                }`}
              >
                <Calendar className="h-3.5 w-3.5 text-[#5A4B42]" />
                <span>
                  {filters.debut && filters.fin
                    ? `${filters.debut} au ${filters.fin}`
                    : filters.debut
                    ? `Depuis ${filters.debut}`
                    : "Période temporelle"}
                </span>
              </button>

              {isCalendarOpen && (
                <div className="absolute left-0 mt-2 w-64 origin-top-left rounded-2xl border border-[rgba(60,35,20,0.08)] bg-white p-3 shadow-[0_8px_24px_rgba(60,35,20,0.12)] z-50 animate-fade-in-up">
                  <div className="text-[11px] font-semibold uppercase tracking-[0.06em] text-[#5A4B42] mb-2">
                    Présets rapides
                  </div>
                  <div className="grid grid-cols-2 gap-1 mb-3">
                    {PRESETS.map((p) => (
                      <button
                        key={p.value}
                        type="button"
                        onClick={() => handlePreset(p.value)}
                        className="rounded-lg bg-[#FBF8F3] px-2 py-1 text-left text-[11px] font-medium text-[#21130D] transition hover:bg-[#C99A68]/15"
                      >
                        {p.label}
                      </button>
                    ))}
                  </div>

                  <div className="text-[11px] font-semibold uppercase tracking-[0.06em] text-[#5A4B42] mb-1.5">
                    Dates personnalisées
                  </div>
                  <div className="space-y-1.5">
                    <div>
                      <span className="text-[10px] text-[#5A4B42]">Du :</span>
                      <input
                        type="date"
                        value={filters.debut || ""}
                        onChange={(e) =>
                          onChange({
                            ...filters,
                            debut: e.target.value || undefined,
                          })
                        }
                        className="w-full h-7 rounded border border-[rgba(60,35,20,0.12)] px-2 text-xs"
                      />
                    </div>
                    <div>
                      <span className="text-[10px] text-[#5A4B42]">Au :</span>
                      <input
                        type="date"
                        value={filters.fin || ""}
                        onChange={(e) =>
                          onChange({
                            ...filters,
                            fin: e.target.value || undefined,
                          })
                        }
                        className="w-full h-7 rounded border border-[rgba(60,35,20,0.12)] px-2 text-xs"
                      />
                    </div>
                  </div>
                  <div className="mt-2.5 flex justify-end">
                    <button
                      type="button"
                      onClick={() => setIsCalendarOpen(false)}
                      className="rounded bg-[#21130D] px-2.5 py-1 text-[11px] font-medium text-white"
                    >
                      Appliquer
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Compteur & Réinitialiser & Mention de périmètre */}
          <div className="flex items-center gap-3">
            {isFiltered && (
              <div className="flex items-center gap-1.5">
                <span className="rounded-full bg-[#C99A68]/15 px-2 py-0.5 text-[11px] font-semibold text-[#8C5E2D]">
                  {activeCount} {activeCount > 1 ? "filtres" : "filtre"}
                </span>
                <button
                  type="button"
                  onClick={onReset}
                  title="Réinitialiser tous les filtres"
                  className="inline-flex items-center gap-1 text-[11px] font-medium text-[#B85D43] transition hover:underline"
                >
                  <RotateCcw className="h-3 w-3" />
                  <span>Effacer</span>
                </button>
              </div>
            )}

            <div className="hidden lg:block text-[11px] italic text-[#5A4B42]">
              S&apos;applique aux sections Projets et Financements
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
