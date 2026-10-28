"use client";

import { useState, useEffect, useRef, type ChangeEvent, type FormEvent } from "react";
import { ArrowRight, Check, ChevronDown, RotateCcw } from "lucide-react";

export interface Domaine {
  id: number;
  nom: string;
}

export interface ProjectInfo {
  titre: string;
  domaine: number | null;
  resume: string;
  probleme: string;
  solution: string;
}

export const EMPTY_PROJECT_INFO: ProjectInfo = { titre: "", domaine: null, resume: "", probleme: "", solution: "" };

const CONTROL =
  "w-full rounded-xl border border-[#4A3B32]/35 bg-white px-4 py-2.5 text-[#1F130B] outline-none transition-all placeholder:text-[#5A4638]/70 focus:border-[#7A3E1D] focus:ring-2 focus:ring-[#7A3E1D]/20";

function CustomSelect({
  id,
  value,
  options,
  error,
  ariaDescribedBy,
  onChange,
}: {
  id?: string;
  value: number | null;
  options: Domaine[];
  error?: boolean;
  ariaDescribedBy?: string;
  onChange: (id: number | null) => void;
}) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const selected = options.find((o) => o.id === value);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  return (
    <div ref={containerRef} className="relative w-full">
      <button
        id={id}
        type="button"
        role="combobox"
        aria-expanded={open}
        aria-controls="domaine-options-list"
        aria-haspopup="listbox"
        aria-describedby={ariaDescribedBy}
        onClick={() => setOpen((prev) => !prev)}
        className={`flex h-11 w-full items-center justify-between rounded-xl border bg-white px-4 text-left text-sm transition-all focus:outline-none focus:ring-2 focus:ring-[#7A3E1D]/20 ${
          error
            ? "border-[#DC2626]"
            : open
              ? "border-[#7A3E1D] ring-2 ring-[#7A3E1D]/20"
              : "border-[#4A3B32]/35 hover:border-[#7A3E1D]"
        }`}
      >
        <span className={`block truncate pr-2 ${selected ? "font-medium text-[#1F130B]" : "text-[#5A4638]/70"}`}>
          {selected ? selected.nom : ""}
        </span>
        <ChevronDown
          className={`h-4 w-4 shrink-0 text-[#1F130B] transition-transform duration-200 ${
            open ? "rotate-180 text-[#7A3E1D]" : ""
          }`}
          aria-hidden="true"
        />
      </button>

      {open && (
        <ul
          id="domaine-options-list"
          role="listbox"
          tabIndex={-1}
          className="absolute z-50 mt-1.5 max-h-60 w-full overflow-y-auto rounded-xl border border-[#EFE4D6] bg-white py-1.5 shadow-xl transition-all"
        >
          {options.map((d) => {
            const isSelected = d.id === value;
            return (
              <li key={d.id} role="option" aria-selected={isSelected}>
                <button
                  type="button"
                  onClick={() => {
                    onChange(d.id);
                    setOpen(false);
                  }}
                  className={`flex w-full items-center justify-between px-4 py-2.5 text-left text-sm transition-colors ${
                    isSelected
                      ? "bg-[#FAF7F2] font-semibold text-[#612D10]"
                      : "text-[#24140D] hover:bg-[#F2E5D5] hover:text-[#3F1D0A] cursor-pointer"
                  }`}
                >
                  <span className="truncate">{d.nom}</span>
                  {isSelected && <Check className="h-4 w-4 text-[#A35926] shrink-0" aria-hidden="true" />}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

export default function ProjectInfoStep({
  initial,
  domaines,
  saving,
  error,
  onSubmit,
}: {
  initial: ProjectInfo;
  domaines: Domaine[];
  saving: boolean;
  error: string | null;
  onSubmit: (info: ProjectInfo) => void;
}) {
  const [form, setForm] = useState(initial);
  const [errors, setErrors] = useState<{ titre?: string; domaine?: string }>({});

  const [prevInitial, setPrevInitial] = useState(initial);
  if (initial !== prevInitial) {
    setPrevInitial(initial);
    setForm(initial);
  }

  const set = (key: keyof ProjectInfo) => (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [key]: e.target.value }));

  function submit(e: FormEvent) {
    e.preventDefault();
    if (saving) return;
    const errs: typeof errors = {};
    if (!form.titre.trim()) errs.titre = "Le titre du projet est obligatoire.";
    if (form.domaine === null) errs.domaine = "Choisissez un domaine d'activité.";
    setErrors(errs);
    if (Object.keys(errs).length) return;
    onSubmit({ ...form, titre: form.titre.trim() });
  }

  return (
    <form onSubmit={submit} noValidate className="space-y-4">
      {/* En-tête simplifié fidèle à la maquette */}
      <div className="space-y-1 pb-1">
        <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-[#1F130B]">
          Présentez votre projet
        </h2>
        <p className="text-sm text-[#4A3B32]">
          Renseignez les premières informations pour initier votre dossier auprès du CIAT.
        </p>
      </div>

      {error && (
        <div role="alert" className="rounded-xl border border-[#DC2626]/40 bg-[#DC2626]/5 px-4 py-2.5 text-sm text-[#DC2626]">
          {error}
        </div>
      )}

      {/* Ligne 1 : Titre du projet & Domaine d'activité (2 colonnes) */}
      <div className="grid gap-4 sm:grid-cols-2 items-start">
        <div>
          <label htmlFor="titre" className="mb-1.5 block text-sm font-bold text-[#1F130B]">
            Titre du projet <span className="text-[#DC2626]">*</span>
          </label>
          <input
            id="titre"
            maxLength={200}
            value={form.titre}
            onChange={set("titre")}
            aria-invalid={Boolean(errors.titre)}
            aria-describedby={errors.titre ? "titre-error" : undefined}
            placeholder="Ex: Système de prototypage solaire"
            className={`${CONTROL} h-11 ${errors.titre ? "border-[#DC2626]" : ""}`}
          />
          {errors.titre && <p id="titre-error" className="mt-1 text-xs text-[#DC2626]">{errors.titre}</p>}
        </div>

        <div>
          <label htmlFor="domaine" className="mb-1.5 block text-sm font-bold text-[#1F130B]">
            Domaine d&apos;activité <span className="text-[#DC2626]">*</span>
          </label>
          <CustomSelect
            id="domaine"
            value={form.domaine}
            options={domaines}
            error={Boolean(errors.domaine)}
            ariaDescribedBy={errors.domaine ? "domaine-error" : undefined}
            onChange={(id) => setForm((f) => ({ ...f, domaine: id }))}
          />
          {errors.domaine && <p id="domaine-error" className="mt-1 text-xs text-[#DC2626]">{errors.domaine}</p>}
        </div>
      </div>

      {/* Ligne 2 : Problème identifié */}
      <div>
        <label htmlFor="probleme" className="mb-1.5 block text-sm font-bold text-[#1F130B]">
          Problème identifié <span className="text-[#DC2626]">*</span>
        </label>
        <textarea
          id="probleme"
          rows={3}
          value={form.probleme}
          onChange={set("probleme")}
          placeholder="Quel besoin concret souhaitez-vous résoudre ?"
          className={`${CONTROL} min-h-20 resize-y text-sm`}
        />
      </div>

      {/* Ligne 3 : Solution proposée */}
      <div>
        <label htmlFor="solution" className="mb-1.5 block text-sm font-bold text-[#1F130B]">
          Solution proposée <span className="text-[#DC2626]">*</span>
        </label>
        <textarea
          id="solution"
          rows={3}
          value={form.solution}
          onChange={set("solution")}
          placeholder="Comment votre projet répond-il à ce besoin ?"
          className={`${CONTROL} min-h-20 resize-y text-sm`}
        />
      </div>

      {/* Ligne 4 : Résumé court (facultatif) */}
      <div>
        <label htmlFor="resume" className="mb-1 block text-sm font-bold text-[#1F130B]">
          Résumé court <span className="text-xs font-normal text-[#8C6D4F]">(facultatif)</span>
        </label>
        <p className="mb-1.5 text-xs text-[#6b5646]">
          Deux ou trois phrases pour présenter le projet en un coup d&apos;œil.
        </p>
        <textarea
          id="resume"
          rows={2}
          value={form.resume}
          onChange={set("resume")}
          placeholder="Ex : Conception d'une solution d'irrigation intelligente basée sur des capteurs solaires..."
          className={`${CONTROL} min-h-16 resize-y text-sm`}
        />
      </div>

      {/* Pied de formulaire : Effacer les champs à gauche & Enregistrer et continuer à droite */}
      <div className="flex flex-col-reverse sm:flex-row sm:items-center sm:justify-between gap-3 pt-3 border-t border-[#EFE4D6]">
        <button
          type="button"
          onClick={() => {
            setForm(EMPTY_PROJECT_INFO);
            setErrors({});
          }}
          className="group inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-[#D6C7B7] bg-white px-4 text-xs sm:text-sm font-semibold text-[#6B5646] shadow-2xs transition-all hover:border-[#581C1C] hover:bg-[#450A0A]/5 hover:text-[#581C1C] active:scale-[0.98] cursor-pointer"
        >
          <RotateCcw className="h-3.5 w-3.5 transition-transform duration-300 group-hover:-rotate-90 text-[#8C6D4F] group-hover:text-[#581C1C]" aria-hidden="true" />
          <span>Effacer les champs</span>
        </button>

        <button
          type="submit"
          disabled={saving}
          className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-[#612D10] px-5 sm:px-6 text-xs sm:text-sm font-bold text-white whitespace-nowrap shadow-xs transition-all hover:bg-[#3F1D0A] hover:scale-[1.01] hover:shadow-md active:scale-[0.98] cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#C99A68] focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {saving && <span aria-hidden className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />}
          <span>{saving ? "Enregistrement…" : "Enregistrer et continuer"}</span>
          <ArrowRight className="h-4 w-4 shrink-0 stroke-[2.2]" aria-hidden="true" />
        </button>
      </div>
    </form>
  );
}
