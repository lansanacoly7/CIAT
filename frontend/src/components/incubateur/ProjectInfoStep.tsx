"use client";

import { useState, type ChangeEvent, type FormEvent, type ReactNode } from "react";

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
  "w-full rounded-lg border bg-white px-3.5 text-[#24140D] outline-none transition-shadow placeholder:text-[#a08f80] focus:border-[#C99A68] focus:ring-4 focus:ring-[#C99A68]/25";

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
      {optional && <span className="font-normal text-[#6b5646]"> (facultatif)</span>}
    </label>
  );
}

function Hint({ children }: { children: ReactNode }) {
  return <p className="mb-2 text-sm leading-relaxed text-[#6b5646]">{children}</p>;
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
    <form onSubmit={submit} noValidate className="space-y-7">
      <div>
        <h2 className="text-xl font-bold text-[#612D10]">Présentez votre projet</h2>
        <p className="mt-1 text-sm text-[#6b5646]">Les champs marqués d&apos;un astérisque sont obligatoires.</p>
      </div>

      {error && (
        <div role="alert" className="rounded-lg border border-[#DC2626]/40 bg-[#DC2626]/5 px-4 py-3 text-sm text-[#DC2626]">
          {error}
        </div>
      )}

      {/* Section 1 : Identité du projet */}
      <div className="space-y-4">
        <div className="border-b border-[#EFE4D6]/70 pb-2">
          <span className="text-[11px] font-bold uppercase tracking-wider text-[#C99A68]">Section 1 sur 2</span>
          <h3 className="text-base font-bold text-[#612D10]">Identité & Domaine</h3>
        </div>
        <div className="grid gap-5 md:grid-cols-3">
          <div className="md:col-span-2">
            <Label htmlFor="titre" required>Titre du projet</Label>
            <input
              id="titre"
              maxLength={200}
              value={form.titre}
              onChange={set("titre")}
              aria-invalid={Boolean(errors.titre)}
              placeholder="Ex. : Irrigation solaire pour maraîchers"
              className={`${CONTROL} min-h-11 ${errors.titre ? "border-[#DC2626]" : "border-[#EFE4D6]"}`}
            />
            {errors.titre && <p className="mt-1.5 text-xs text-[#DC2626]">{errors.titre}</p>}
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
              <option value="">Sélectionnez…</option>
              {domaines.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.nom}
                </option>
              ))}
            </select>
            {errors.domaine && <p className="mt-1.5 text-xs text-[#DC2626]">{errors.domaine}</p>}
          </div>
        </div>
      </div>

      {/* Section 2 : Votre démarche d'innovation */}
      <div className="space-y-5 pt-2">
        <div className="border-b border-[#EFE4D6]/70 pb-2">
          <span className="text-[11px] font-bold uppercase tracking-wider text-[#C99A68]">Section 2 sur 2</span>
          <h3 className="text-base font-bold text-[#612D10]">Problématique & Solution</h3>
        </div>

        <div>
          <Label htmlFor="probleme">Problème identifié</Label>
          <Hint>Quel problème concret cherchez-vous à résoudre ? Qui en souffre (public cible), à quelle fréquence, avec quelles conséquences ?</Hint>
          <textarea
            id="probleme"
            rows={4}
            value={form.probleme}
            onChange={set("probleme")}
            placeholder="Décrivez la situation actuelle et ses limites…"
            className={`${CONTROL} min-h-24 resize-y border-[#EFE4D6] py-2.5 leading-relaxed text-sm`}
          />
        </div>

        <div>
          <Label htmlFor="solution">Solution proposée</Label>
          <Hint>Comment votre projet répond-il à ce problème ? Qu&apos;est-ce qui le distingue de ce qui existe déjà, et où en êtes-vous (idée, maquette, prototype) ?</Hint>
          <textarea
            id="solution"
            rows={4}
            value={form.solution}
            onChange={set("solution")}
            placeholder="Décrivez votre solution, son fonctionnement et son apport…"
            className={`${CONTROL} min-h-24 resize-y border-[#EFE4D6] py-2.5 leading-relaxed text-sm`}
          />
        </div>

        <div>
          <Label htmlFor="resume" optional>Résumé court</Label>
          <Hint>Deux ou trois phrases pour présenter le projet en un coup d&apos;œil.</Hint>
          <textarea
            id="resume"
            rows={2}
            value={form.resume}
            onChange={set("resume")}
            placeholder="Synthèse claire pour le comité…"
            className={`${CONTROL} min-h-20 resize-y border-[#EFE4D6] py-2.5 text-sm`}
          />
        </div>
      </div>

      <div className="flex justify-end border-t border-[#EFE4D6] pt-5">
        <button
          type="submit"
          disabled={saving}
          className="flex min-h-12 w-full items-center justify-center gap-2 rounded-lg bg-[#612D10] px-8 font-[family-name:var(--font-title)] font-semibold text-white transition-colors hover:bg-[#3F1D0A] disabled:cursor-not-allowed disabled:opacity-70 sm:w-auto"
        >
          {saving && <span aria-hidden className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />}
          {saving ? "Enregistrement…" : "Enregistrer et continuer"}
        </button>
      </div>
    </form>
  );
}
