import { useMemo, useState } from "react";
import { Calendar, ChevronDown, Filter, HelpCircle, RotateCcw } from "lucide-react";
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

// Helpers de conversion ISO <-> Français (jj/mm/aaaa)
function isoToFr(iso?: string): string {
  if (!iso) return "";
  const parts = iso.split("-");
  if (parts.length === 3) {
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  }
  return iso;
}

function frToIso(fr?: string): string | undefined {
  if (!fr) return undefined;
  const cleaned = fr.trim();
  const match = cleaned.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (!match) return undefined;
  const day = parseInt(match[1], 10);
  const month = parseInt(match[2], 10);
  const year = parseInt(match[3], 10);
  if (day < 1 || day > 31 || month < 1 || month > 12 || year < 1900 || year > 2100) {
    return undefined;
  }
  return `${match[3]}-${match[2]}-${match[1]}`;
}

interface FrenchDateInputProps {
  id: string;
  label: string;
  value?: string;
  onChange: (iso?: string) => void;
  max?: string;
  min?: string;
}

function FrenchDateInput({ id, label, value, onChange, max, min }: FrenchDateInputProps) {
  const [textInput, setTextInput] = useState<string | null>(null);
  const [prevValue, setPrevValue] = useState<string | undefined>(value);

  // Synchronisation lors d'un changement de prop externe sans déclencher d'effet en cascade
  if (value !== prevValue) {
    setPrevValue(value);
    setTextInput(null);
  }

  const displayVal = textInput !== null ? textInput : isoToFr(value);
  const isValid = !displayVal || displayVal.length < 10 || Boolean(frToIso(displayVal));

  const handleTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    const digits = raw.replace(/\D/g, "").slice(0, 8);
    let formatted = "";
    if (digits.length <= 2) {
      formatted = digits;
    } else if (digits.length <= 4) {
      formatted = `${digits.slice(0, 2)}/${digits.slice(2)}`;
    } else {
      formatted = `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`;
    }

    setTextInput(formatted);

    if (formatted === "") {
      onChange(undefined);
      return;
    }

    if (formatted.length === 10) {
      const iso = frToIso(formatted);
      if (iso) {
        onChange(iso);
      }
    }
  };

  const handleNativePicker = (e: React.ChangeEvent<HTMLInputElement>) => {
    const iso = e.target.value;
    if (iso) {
      setTextInput(isoToFr(iso));
      onChange(iso);
    }
  };

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-[11px]">
        <label htmlFor={id} className="font-medium text-[#5A4B42]">
          {label}
        </label>
        <span className="text-[10px] text-[#5A4B42]/70 font-mono">jj/mm/aaaa</span>
      </div>
      <div className="relative flex items-center">
        <input
          id={id}
          type="text"
          inputMode="numeric"
          pattern="\d{2}/\d{2}/\d{4}"
          placeholder="jj/mm/aaaa"
          maxLength={10}
          value={displayVal}
          onChange={handleTextChange}
          className={`h-8 w-full rounded-lg border bg-[#FBF8F3] pl-2.5 pr-8 text-xs text-[#21130D] placeholder:text-[#5A4B42]/60 transition focus:bg-white focus:outline-hidden ${
            !isValid
              ? "border-[#B85D43] focus:border-[#B85D43]"
              : "border-[rgba(60,35,20,0.12)] focus:border-[#C99A68]"
          }`}
        />
        <label
          htmlFor={`${id}-native`}
          className="absolute right-2 cursor-pointer text-[#5A4B42] hover:text-[#21130D] transition p-0.5"
          title="Ouvrir le calendrier"
        >
          <Calendar className="h-3.5 w-3.5" />
          <input
            id={`${id}-native`}
            type="date"
            value={value || ""}
            onChange={handleNativePicker}
            max={max}
            min={min}
            className="sr-only"
            tabIndex={-1}
            aria-hidden="true"
          />
        </label>
      </div>
      {!isValid && (
        <span className="text-[10px] text-[#B85D43] font-medium">
          Format invalide (ex : 15/01/2025)
        </span>
      )}
    </div>
  );
}

export function StickyFiltersBar({
  filters,
  onChange,
  onReset,
  isFiltered,
}: StickyFiltersBarProps) {
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [isMobilePanelOpen, setIsMobilePanelOpen] = useState(false);
  const [draftDebut, setDraftDebut] = useState<string | undefined>(filters.debut);
  const [draftFin, setDraftFin] = useState<string | undefined>(filters.fin);
  const [prevDebut, setPrevDebut] = useState(filters.debut);
  const [prevFin, setPrevFin] = useState(filters.fin);

  if (filters.debut !== prevDebut || filters.fin !== prevFin) {
    setPrevDebut(filters.debut);
    setPrevFin(filters.fin);
    setDraftDebut(filters.debut);
    setDraftFin(filters.fin);
  }

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
      setDraftDebut(undefined);
      setDraftFin(undefined);
      onChange({ ...filters, debut: undefined, fin: undefined });
    } else if (preset === "30d") {
      const past = new Date();
      past.setDate(past.getDate() - 30);
      const pastStr = `${past.getFullYear()}-${String(
        past.getMonth() + 1
      ).padStart(2, "0")}-${String(past.getDate()).padStart(2, "0")}`;
      setDraftDebut(pastStr);
      setDraftFin(todayStr);
      onChange({ ...filters, debut: pastStr, fin: todayStr });
    } else if (preset === "quarter") {
      const past = new Date();
      past.setMonth(past.getMonth() - 3);
      const pastStr = `${past.getFullYear()}-${String(
        past.getMonth() + 1
      ).padStart(2, "0")}-${String(past.getDate()).padStart(2, "0")}`;
      setDraftDebut(pastStr);
      setDraftFin(todayStr);
      onChange({ ...filters, debut: pastStr, fin: todayStr });
    } else if (preset === "year") {
      const yearStart = `${yyyy}-01-01`;
      setDraftDebut(yearStart);
      setDraftFin(todayStr);
      onChange({ ...filters, debut: yearStart, fin: todayStr });
    }
    setIsCalendarOpen(false);
  };

  return (
    <div className="sticky top-2 z-30 mx-auto max-w-7xl transition-all">
      <div className="rounded-2xl border border-[rgba(60,35,20,0.08)] bg-white/95 px-3 py-2 sm:px-4 sm:py-2.5 shadow-[0_4px_20px_rgba(60,35,20,0.06)] backdrop-blur-md">
        
        {/* ── BARRE MOBILE (390 px) AVEC PANNEAU REPLIABLE ── */}
        <div className="flex sm:hidden items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.06em] text-[#5A4B42]">
              <Filter className="h-4 w-4 text-[#C99A68]" />
              <span>Filtres</span>
            </span>
            {activeCount > 0 && (
              <span className="rounded-full bg-[#C99A68] px-2 py-0.5 text-[10px] font-bold text-white">
                {activeCount} actif{activeCount > 1 ? "s" : ""}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            {isFiltered && (
              <button
                type="button"
                onClick={onReset}
                className="inline-flex min-h-[44px] items-center gap-1 text-xs text-[#B85D43] font-semibold px-2 py-1"
                aria-label="Réinitialiser les filtres"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                <span>Effacer</span>
              </button>
            )}

            <button
              type="button"
              id="mobile-filters-toggle-btn"
              onClick={() => setIsMobilePanelOpen(!isMobilePanelOpen)}
              className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center gap-1.5 rounded-xl border border-[#C99A68]/30 bg-[#FAF7F2] px-3.5 py-2 text-xs font-bold text-[#21130D] shadow-xs active:scale-95 transition-all cursor-pointer"
              aria-expanded={isMobilePanelOpen}
              aria-controls="mobile-filters-panel"
            >
              <span>{isMobilePanelOpen ? "Fermer" : "Filtrer"}</span>
              <ChevronDown className={`h-4 w-4 text-[#8C5E2D] transition-transform duration-200 ${isMobilePanelOpen ? "rotate-180" : ""}`} />
            </button>
          </div>
        </div>

        {/* Panneau repliable mobile */}
        {isMobilePanelOpen && (
          <div id="mobile-filters-panel" className="block sm:hidden mt-3 pt-3 border-t border-[rgba(60,35,20,0.08)] space-y-3">
            <div className="grid grid-cols-1 gap-2.5">
              <div>
                <label className="block text-[11px] font-semibold text-[#5A4B42] uppercase tracking-wider mb-1">
                  Cohorte
                </label>
                <select
                  value={filters.cohorte || ""}
                  onChange={(e) =>
                    onChange({
                      ...filters,
                      cohorte: e.target.value || undefined,
                    })
                  }
                  aria-label="Filtrer par cohorte"
                  className="w-full h-10 rounded-xl border border-[rgba(60,35,20,0.12)] bg-[#FBF8F3] px-3 text-xs font-medium text-[#21130D] focus:border-[#C99A68] focus:bg-white focus:outline-hidden"
                >
                  <option value="">Toutes les cohortes</option>
                  {COHORTES.map((c) => (
                    <option key={c.value} value={c.value}>
                      {c.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-[#5A4B42] uppercase tracking-wider mb-1">
                  Domaine
                </label>
                <select
                  value={filters.domaine || ""}
                  onChange={(e) =>
                    onChange({
                      ...filters,
                      domaine: e.target.value || undefined,
                    })
                  }
                  aria-label="Filtrer par domaine"
                  className="w-full h-10 rounded-xl border border-[rgba(60,35,20,0.12)] bg-[#FBF8F3] px-3 text-xs font-medium text-[#21130D] focus:border-[#C99A68] focus:bg-white focus:outline-hidden"
                >
                  <option value="">Tous les domaines</option>
                  {DOMAINES.map((d) => (
                    <option key={d.value} value={d.value}>
                      {d.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-[#5A4B42] uppercase tracking-wider mb-1">
                  Statut
                </label>
                <select
                  value={filters.statut || ""}
                  onChange={(e) =>
                    onChange({
                      ...filters,
                      statut: e.target.value || undefined,
                    })
                  }
                  aria-label="Filtrer par statut"
                  className="w-full h-10 rounded-xl border border-[rgba(60,35,20,0.12)] bg-[#FBF8F3] px-3 text-xs font-medium text-[#21130D] focus:border-[#C99A68] focus:bg-white focus:outline-hidden"
                >
                  <option value="">Tous les statuts</option>
                  {STATUTS.map((s) => (
                    <option key={s.value} value={s.value}>
                      {s.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-[#5A4B42] uppercase tracking-wider mb-1">
                  Période
                </label>
                <div className="grid grid-cols-2 gap-1.5 mb-2">
                  {PRESETS.map((p) => (
                    <button
                      key={p.value}
                      type="button"
                      onClick={() => handlePreset(p.value)}
                      className="rounded-lg bg-[#FAF7F2] border border-[#EFE4D6] px-2.5 py-2 text-center text-[11px] font-medium text-[#21130D] active:bg-[#C99A68]/20"
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
                <div className="space-y-1.5">
                  <FrenchDateInput
                    id="mobile-date-debut"
                    label="Du :"
                    value={filters.debut}
                    onChange={(iso) => onChange({ ...filters, debut: iso })}
                  />
                  <FrenchDateInput
                    id="mobile-date-fin"
                    label="Au :"
                    value={filters.fin}
                    onChange={(iso) => onChange({ ...filters, fin: iso })}
                  />
                </div>
              </div>
            </div>

            <div className="pt-2 flex items-center justify-end gap-2 border-t border-[rgba(60,35,20,0.06)]">
              <button
                type="button"
                onClick={() => setIsMobilePanelOpen(false)}
                className="w-full min-h-[44px] rounded-xl bg-[#21130D] px-4 py-2.5 text-xs font-semibold text-white shadow-xs"
              >
                Appliquer et fermer
              </button>
            </div>
          </div>
        )}

        {/* ── BARRE DESKTOP (sm:flex) ── */}
        <div className="hidden sm:flex flex-wrap items-center justify-between gap-2.5">
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
                id="period-filter-button"
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
                    ? `${isoToFr(filters.debut)} au ${isoToFr(filters.fin)}`
                    : filters.debut
                    ? `Depuis le ${isoToFr(filters.debut)}`
                    : filters.fin
                    ? `Jusqu'au ${isoToFr(filters.fin)}`
                    : "Période temporelle"}
                </span>
              </button>

              {isCalendarOpen && (
                <div className="absolute left-0 mt-2 w-72 origin-top-left rounded-2xl border border-[rgba(60,35,20,0.08)] bg-white p-3.5 shadow-[0_8px_24px_rgba(60,35,20,0.12)] z-50 animate-fade-in-up">
                  <div className="text-[11px] font-semibold uppercase tracking-[0.06em] text-[#5A4B42] mb-2">
                    Présets rapides
                  </div>
                  <div className="grid grid-cols-2 gap-1.5 mb-3">
                    {PRESETS.map((p) => (
                      <button
                        key={p.value}
                        type="button"
                        onClick={() => handlePreset(p.value)}
                        className="rounded-lg bg-[#FBF8F3] px-2.5 py-1.5 text-left text-[11px] font-medium text-[#21130D] transition hover:bg-[#C99A68]/15"
                      >
                        {p.label}
                      </button>
                    ))}
                  </div>

                  <div className="text-[11px] font-semibold uppercase tracking-[0.06em] text-[#5A4B42] mb-2">
                    Dates personnalisées (jj/mm/aaaa)
                  </div>
                  <div className="space-y-2">
                    <FrenchDateInput
                      id="date-debut-input"
                      label="Du (date de début) :"
                      value={draftDebut}
                      onChange={(iso) => setDraftDebut(iso)}
                    />
                    <FrenchDateInput
                      id="date-fin-input"
                      label="Au (date de fin) :"
                      value={draftFin}
                      onChange={(iso) => setDraftFin(iso)}
                    />
                  </div>
                  <div className="mt-3 flex items-center justify-between border-t border-[rgba(60,35,20,0.06)] pt-2.5">
                    <button
                      type="button"
                      onClick={() => {
                        setDraftDebut(undefined);
                        setDraftFin(undefined);
                        onChange({
                          ...filters,
                          debut: undefined,
                          fin: undefined,
                        });
                        setIsCalendarOpen(false);
                      }}
                      className="text-[11px] font-medium text-[#5A4B42] hover:text-[#B85D43] transition"
                    >
                      Effacer la période
                    </button>
                    <button
                      type="button"
                      id="apply-period-button"
                      onClick={() => {
                        onChange({
                          ...filters,
                          debut: draftDebut,
                          fin: draftFin,
                        });
                        setIsCalendarOpen(false);
                      }}
                      className="rounded-lg bg-[#21130D] px-3 py-1.5 text-[11px] font-semibold text-white shadow-xs transition hover:bg-[#3D2314] active:scale-95"
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

            <div className="relative group flex items-center">
              <button
                type="button"
                aria-label="Périmètre d'application des filtres"
                className="p-1 text-[#5A4B42] hover:text-[#21130D] rounded-full transition focus:outline-hidden"
              >
                <HelpCircle className="h-4 w-4" />
              </button>
              <div
                role="tooltip"
                className="absolute right-0 top-full mt-1.5 hidden w-64 rounded-xl border border-[rgba(60,35,20,0.08)] bg-white p-2.5 text-[11px] leading-relaxed text-[#5A4B42] shadow-[0_4px_16px_rgba(60,35,20,0.08)] group-hover:block group-focus-within:block z-50 pointer-events-none"
              >
                Ces filtres s&apos;appliquent à l&apos;ensemble des 4 onglets : Vue d&apos;ensemble, Projets, Financements et Registre.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
