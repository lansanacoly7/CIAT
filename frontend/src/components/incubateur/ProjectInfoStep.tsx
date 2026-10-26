"use client";

import { useState, type ChangeEvent, type FormEvent } from "react";

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
  "w-full rounded-md border bg-white px-3 text-[#24140D] outline-none transition-colors placeholder:text-[#a08f80] focus:border-[#C99A68] focus:ring-2 focus:ring-[#C99A68]/40";

function Label({ htmlFor, required, children }: { htmlFor: string; required?: boolean; children: string }) {
  return (
    <label htmlFor={htmlFor} className="mb-1 block text-sm font-medium text-[#24140D]">
      {children}
      {required && <span className="text-[#DC2626]"> *</span>}
    </label>
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

  const set = (key: keyof ProjectInfo) => (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm((f) => ({ ...f, [key]: key === "domaine" ? (e.target.value ? Number(e.target.value) : null) : e.target.value }));

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
    <form onSubmit={submit} noValidate className="space-y-5">
      {error && (
        <div role="alert" className="rounded-md border border-[#DC2626]/40 bg-[#DC2626]/5 px-3 py-2 text-sm text-[#DC2626]">
          {error}
        </div>
      )}
      <div>
        <Label htmlFor="titre" required>Titre du projet</Label>
        <input
          id="titre"
          maxLength={200}
          value={form.titre}
          onChange={set("titre")}
          aria-invalid={Boolean(errors.titre)}
          className={`${CONTROL} min-h-11 ${errors.titre ? "border-[#DC2626]" : "border-[#EFE4D6]"}`}
        />
        {errors.titre && <p className="mt-1 text-sm text-[#DC2626]">{errors.titre}</p>}
      </div>
      <div>
        <Label htmlFor="domaine" required>Domaine d&apos;activité</Label>
        <select
          id="domaine"
          value={form.domaine ?? ""}
          onChange={set("domaine")}
          aria-invalid={Boolean(errors.domaine)}
          className={`${CONTROL} min-h-11 ${errors.domaine ? "border-[#DC2626]" : "border-[#EFE4D6]"}`}
        >
          <option value="">Sélectionnez un domaine…</option>
          {domaines.map((d) => (
            <option key={d.id} value={d.id}>
              {d.nom}
            </option>
          ))}
        </select>
        {errors.domaine && <p className="mt-1 text-sm text-[#DC2626]">{errors.domaine}</p>}
      </div>
      {(
        [
          ["resume", "Résumé court", "En quelques lignes, de quoi s'agit-il ?"],
          ["probleme", "Problème identifié", "Quel problème votre projet résout-il, et pour qui ?"],
          ["solution", "Solution proposée", "Comment votre projet répond-il à ce problème ?"],
        ] as const
      ).map(([key, label, hint]) => (
        <div key={key}>
          <Label htmlFor={key}>{label}</Label>
          <textarea
            id={key}
            rows={4}
            value={form[key]}
            onChange={set(key)}
            placeholder={hint}
            className={`${CONTROL} min-h-11 border-[#EFE4D6] py-2`}
          />
        </div>
      ))}
      <div className="flex justify-end">
        <button
          type="submit"
          disabled={saving}
          className="flex min-h-11 w-full items-center justify-center gap-2 rounded-md bg-[#612D10] px-6 font-[family-name:var(--font-title)] font-semibold text-white transition-colors hover:bg-[#3F1D0A] disabled:cursor-not-allowed disabled:opacity-70 sm:w-auto"
        >
          {saving && <span aria-hidden className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />}
          {saving ? "Enregistrement…" : "Enregistrer et continuer"}
        </button>
      </div>
    </form>
  );
}
