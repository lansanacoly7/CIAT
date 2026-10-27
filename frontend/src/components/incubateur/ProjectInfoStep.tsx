import { useState, useEffect, useRef, type ChangeEvent, type FormEvent, type ReactNode } from "react";
import { ArrowRight, Check, ChevronDown } from "lucide-react";

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
  "w-full rounded-xl border bg-white px-4 py-2.5 text-[#24140D] outline-none transition-all placeholder:text-[#a08f80] focus:border-[#C99A68] focus:ring-4 focus:ring-[#C99A68]/20";

function Label({
  htmlFor,
  required,
  optional,
  children,
}: {
  htmlFor: string;
  required?: boolean;
  optional?: boolean;
  children: ReactNode;
}) {
  return (
    <label htmlFor={htmlFor} className="mb-1.5 block text-sm font-semibold text-[#24140D]">
      {children}
      {required && <span className="text-[#DC2626]"> *</span>}
      {optional && <span className="font-normal text-[#8C6D4F]"> (facultatif)</span>}
    </label>
  );
}

function Subtitle({ children }: { children: ReactNode }) {
  return <p className="mb-1.5 text-xs leading-normal text-[#6b5646]">{children}</p>;
}

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
        aria-haspopup="listbox"
        aria-describedby={ariaDescribedBy}
        onClick={() => setOpen((prev) => !prev)}
        className={`flex h-12 w-full items-center justify-between rounded-xl border bg-white px-4 text-left text-sm transition-all focus:outline-none focus:ring-4 focus:ring-[#C99A68]/20 ${
          error
            ? "border-[#DC2626]"
            : open
              ? "border-[#A35926] ring-2 ring-[#C99A68]/30"
              : "border-[#EFE4D6] hover:border-[#C99A68]"
        }`}
      >
        <span className={`block truncate pr-2 ${selected ? "font-medium text-[#24140D]" : "text-[#a08f80]"}`}>
          {selected ? selected.nom : "Sélectionner un domaine"}
        </span>
        <ChevronDown
          className={`h-4 w-4 shrink-0 text-[#8C6D4F] transition-transform duration-200 ${
            open ? "rotate-180 text-[#A35926]" : ""
          }`}
          aria-hidden="true"
        />
      </button>

      {open && (
        <ul
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
                      : "text-[#24140D] hover:bg-[#FAF7F2]/80 hover:text-[#612D10]"
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

  const hasContent = Boolean(form.titre || form.probleme || form.solution || form.resume || form.domaine !== null);

  return (
    <form onSubmit={submit} noValidate className="space-y-5">
      <div className="flex flex-col gap-2.5 sm:flex-row sm:items-start sm:justify-between border-b border-[#EFE4D6]/60 pb-3.5">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#A35926]">
              Dossier de candidature
            </span>
            <span className="text-xs text-[#8C6D4F]">· Formulaire de saisie</span>
          </div>
          <h2 className="font-[family-name:var(--font-title)] text-xl sm:text-2xl font-bold tracking-tight text-[#24140D]">
            Présentez votre projet
          </h2>
          <p className="text-xs text-[#6b5646]">
            Renseignez les premières informations pour initier votre dossier auprès du CIAT.
          </p>
        </div>
        <div className="flex items-center gap-3 shrink-0 pt-0.5">
          {hasContent && (
            <button
              type="button"
              onClick={() => {
                setForm(EMPTY_PROJECT_INFO);
                setErrors({});
              }}
              className="text-xs font-semibold text-[#8C6D4F] transition-colors hover:text-[#DC2626]"
            >
              Effacer les champs
            </button>
          )}
          <span className="inline-flex items-center rounded-full border border-[#A35926]/25 bg-[#A35926]/5 px-3 py-0.5 text-xs font-bold text-[#A35926]">
            Étape 1 sur 3
          </span>
        </div>
      </div>

      {error && (
        <div role="alert" className="rounded-xl border border-[#DC2626]/40 bg-[#DC2626]/5 px-4 py-2.5 text-sm text-[#DC2626]">
          {error}
        </div>
      )}

      {/* SECTION 1 : IDENTITÉ & DOMAINE */}
      <div className="space-y-3">
        <div className="border-b border-[#EFE4D6]/70 pb-1.5">
          <span className="text-[11px] font-bold uppercase tracking-wider text-[#A35926]">
            Identité & Domaine
          </span>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 items-start">
          <div>
            <Label htmlFor="titre" required>Titre du projet</Label>
            <input
              id="titre"
              maxLength={200}
              value={form.titre}
              onChange={set("titre")}
              aria-invalid={Boolean(errors.titre)}
              aria-describedby={errors.titre ? "titre-error" : undefined}
              placeholder="Ex. : Irrigation solaire pour maraîchers"
              className={`${CONTROL} h-12 ${errors.titre ? "border-[#DC2626]" : "border-[#EFE4D6]"}`}
            />
            {errors.titre && <p id="titre-error" className="mt-1.5 text-xs text-[#DC2626]">{errors.titre}</p>}
          </div>

          <div>
            <Label htmlFor="domaine" required>Domaine d&apos;activité</Label>
            <CustomSelect
              id="domaine"
              value={form.domaine}
              options={domaines}
              error={Boolean(errors.domaine)}
              ariaDescribedBy={errors.domaine ? "domaine-error" : undefined}
              onChange={(id) => setForm((f) => ({ ...f, domaine: id }))}
            />
            {errors.domaine && <p id="domaine-error" className="mt-1.5 text-xs text-[#DC2626]">{errors.domaine}</p>}
          </div>
        </div>
      </div>

      {/* SECTION 2 : PROBLÉMATIQUE & SOLUTION */}
      <div className="space-y-3.5 pt-0.5">
        <div className="border-b border-[#EFE4D6]/70 pb-1.5">
          <span className="text-[11px] font-bold uppercase tracking-wider text-[#A35926]">
            Problématique & Solution
          </span>
        </div>

        <div>
          <Label htmlFor="probleme" required>Problème identifié</Label>
          <Subtitle>Quel besoin concret souhaitez-vous résoudre ?</Subtitle>
          <textarea
            id="probleme"
            rows={3}
            value={form.probleme}
            onChange={set("probleme")}
            placeholder="Décrivez la situation actuelle..."
            className={`${CONTROL} min-h-20 resize-y border-[#EFE4D6] leading-relaxed text-sm`}
          />
        </div>

        <div>
          <Label htmlFor="solution" required>Solution proposée</Label>
          <Subtitle>Comment votre solution répond-elle à ce besoin ?</Subtitle>
          <textarea
            id="solution"
            rows={3}
            value={form.solution}
            onChange={set("solution")}
            placeholder="Décrivez votre solution, son fonctionnement et son apport..."
            className={`${CONTROL} min-h-20 resize-y border-[#EFE4D6] leading-relaxed text-sm`}
          />
        </div>

        <div>
          <Label htmlFor="resume" optional>Résumé court</Label>
          <Subtitle>Deux ou trois phrases pour présenter le projet en un coup d&apos;œil.</Subtitle>
          <textarea
            id="resume"
            rows={2}
            value={form.resume}
            onChange={set("resume")}
            placeholder="Présentez votre projet en deux ou trois phrases."
            className={`${CONTROL} min-h-16 resize-y border-[#EFE4D6] text-sm`}
          />
        </div>
      </div>

      <div className="flex justify-end border-t border-[#EFE4D6] pt-4">
        <button
          type="submit"
          disabled={saving}
          className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[#612D10] px-7 text-sm font-semibold text-white shadow-sm transition-all hover:bg-[#3F1D0A] hover:scale-[1.01] focus:outline-none focus:ring-2 focus:ring-[#C99A68] focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {saving && <span aria-hidden className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />}
          <span>{saving ? "Enregistrement…" : "Enregistrer et continuer"}</span>
          <ArrowRight className="h-4 w-4 stroke-[2]" aria-hidden="true" />
        </button>
      </div>
    </form>
  );
}
