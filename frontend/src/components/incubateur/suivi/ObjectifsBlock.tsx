"use client";

import { useState, type FormEvent } from "react";
import { Badge, Button } from "@/components/ui";
import {
  OBJECTIF_STATUTS,
  creerObjectif,
  formatDateFr,
  modifierObjectif,
  suiviErrorMessage,
  type Objectif,
  type ObjectifInput,
  type ObjectifStatut,
} from "@/lib/incubator";
import { Block, FieldLabel, INPUT, InlineError } from "./shared";

const TONES = { a_faire: "neutre", en_cours: "info", atteint: "succes" } as const;

function ObjectifForm({
  initial,
  submitLabel,
  onSubmit,
  onCancel,
}: {
  initial: ObjectifInput;
  submitLabel: string;
  onSubmit: (v: ObjectifInput) => Promise<void>;
  onCancel?: () => void;
}) {
  const [form, setForm] = useState(initial);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (saving) return;
    if (!form.libelle.trim()) {
      setError("Le libellé de l'objectif est obligatoire.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await onSubmit({ ...form, libelle: form.libelle.trim(), echeance: form.echeance || null });
      if (!onCancel) setForm(initial);
    } catch (err) {
      setError(suiviErrorMessage(err, "L'enregistrement de l'objectif a échoué."));
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={submit} noValidate className="space-y-3 rounded-lg border border-bordure bg-ivoire p-4">
      <div>
        <FieldLabel htmlFor={`obj-lib-${initial.libelle || "new"}`}>Libellé</FieldLabel>
        <input
          id={`obj-lib-${initial.libelle || "new"}`}
          className={INPUT}
          value={form.libelle}
          onChange={(e) => setForm({ ...form, libelle: e.target.value })}
        />
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <FieldLabel htmlFor={`obj-ech-${initial.libelle || "new"}`}>Échéance (facultative)</FieldLabel>
          <input
            id={`obj-ech-${initial.libelle || "new"}`}
            type="date"
            className={INPUT}
            value={form.echeance ?? ""}
            onChange={(e) => setForm({ ...form, echeance: e.target.value || null })}
          />
        </div>
        <div>
          <FieldLabel htmlFor={`obj-st-${initial.libelle || "new"}`}>Statut</FieldLabel>
          <select
            id={`obj-st-${initial.libelle || "new"}`}
            className={INPUT}
            value={form.statut}
            onChange={(e) => setForm({ ...form, statut: e.target.value as ObjectifStatut })}
          >
            {Object.entries(OBJECTIF_STATUTS).map(([v, l]) => (
              <option key={v} value={v}>
                {l}
              </option>
            ))}
          </select>
        </div>
      </div>
      <InlineError message={error} />
      <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
        {onCancel && (
          <Button type="button" variant="secondary" className="!min-h-11" onClick={onCancel} disabled={saving}>
            Annuler
          </Button>
        )}
        <Button type="submit" className="!min-h-11" disabled={saving}>
          {saving ? "Enregistrement…" : submitLabel}
        </Button>
      </div>
    </form>
  );
}

export default function ObjectifsBlock({
  projetId,
  objectifs,
  canManage,
  onChange,
}: {
  projetId: number;
  objectifs: Objectif[];
  canManage: boolean;
  onChange: () => void;
}) {
  const [editing, setEditing] = useState<number | null>(null);
  const [adding, setAdding] = useState(false);

  return (
    <Block
      title="Objectifs du projet"
      icon={
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2} aria-hidden>
          <circle cx="12" cy="12" r="9" />
          <circle cx="12" cy="12" r="5" />
          <circle cx="12" cy="12" r="1.5" fill="currentColor" />
        </svg>
      }
      action={
        canManage && !adding ? (
          <Button variant="secondary" className="!min-h-9 !py-1 !px-3 !text-xs font-semibold" onClick={() => setAdding(true)}>
            + Ajouter
          </Button>
        ) : (
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#FAF4EC] text-[#8A7261] transition-transform hover:translate-x-0.5">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2} aria-hidden>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
            </svg>
          </span>
        )
      }
    >
      {objectifs.length === 0 && !adding && (
        <div className="flex flex-col items-center justify-center py-4 text-center">
          <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-[#FAF4EC] text-[#B89C82]">
            <svg className="h-8 w-8" viewBox="0 0 64 64" fill="none" stroke="currentColor" strokeWidth={2}>
              <circle cx="32" cy="32" r="24" stroke="#D9C3AB" strokeDasharray="3 3" />
              <circle cx="32" cy="32" r="16" fill="#F7EFE6" stroke="#8A7261" />
              <circle cx="32" cy="32" r="8" fill="#FAF4EC" stroke="#522504" />
              <circle cx="32" cy="32" r="3" fill="#522504" />
              <path d="M44 20 L52 12 M52 12 L47 12 M52 12 L52 17" stroke="#A35926" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <p className="max-w-[200px] text-xs font-medium text-[#7C6353]">
            Aucun objectif défini pour ce projet.
          </p>
        </div>
      )}

      <ul className="space-y-2.5">
        {objectifs.map((o) =>
          editing === o.id ? (
            <li key={o.id}>
              <ObjectifForm
                initial={{ libelle: o.libelle, echeance: o.echeance, statut: o.statut }}
                submitLabel="Enregistrer"
                onCancel={() => setEditing(null)}
                onSubmit={async (v) => {
                  await modifierObjectif(o.id, v);
                  setEditing(null);
                  onChange();
                }}
              />
            </li>
          ) : (
            <li key={o.id} className="flex flex-col gap-2 rounded-xl border border-[#EFE4D6] bg-[#FBF7F2] p-3 transition-colors hover:bg-white sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-[#3D1A04] text-xs sm:text-sm">{o.libelle}</p>
                {o.echeance && (
                  <p className="text-[11px] text-[#7C6353]">Échéance : {formatDateFr(o.echeance)}</p>
                )}
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <Badge tone={TONES[o.statut]}>{OBJECTIF_STATUTS[o.statut]}</Badge>
                {canManage && (
                  <button
                    type="button"
                    onClick={() => setEditing(o.id)}
                    className="min-h-8 px-2 text-xs font-semibold text-[#612D10] underline hover:text-[#3D1A04]"
                  >
                    Modifier
                  </button>
                )}
              </div>
            </li>
          ),
        )}
      </ul>

      {adding && (
        <div className="mt-3">
          <ObjectifForm
            initial={{ libelle: "", echeance: null, statut: "a_faire" }}
            submitLabel="Ajouter"
            onCancel={() => setAdding(false)}
            onSubmit={async (v) => {
              await creerObjectif(projetId, v);
              setAdding(false);
              onChange();
            }}
          />
        </div>
      )}
    </Block>
  );
}
