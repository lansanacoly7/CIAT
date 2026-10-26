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
      title="Objectifs"
      action={
        canManage && !adding ? (
          <Button variant="secondary" className="!min-h-11" onClick={() => setAdding(true)}>
            Ajouter un objectif
          </Button>
        ) : undefined
      }
    >
      {objectifs.length === 0 && !adding && <p className="text-sm text-texte-doux">Aucun objectif défini pour ce projet.</p>}

      <ul className="space-y-3">
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
            <li key={o.id} className="flex flex-col gap-2 rounded-lg border border-bordure p-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0">
                <p className="font-medium text-texte">{o.libelle}</p>
                <p className="text-xs text-texte-doux">Échéance : {formatDateFr(o.echeance)}</p>
              </div>
              <div className="flex items-center gap-2">
                <Badge tone={TONES[o.statut]}>{OBJECTIF_STATUTS[o.statut]}</Badge>
                {canManage && (
                  <button
                    type="button"
                    onClick={() => setEditing(o.id)}
                    className="min-h-11 px-2 text-sm font-semibold text-brun underline hover:text-brun-fonce"
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
        <div className="mt-4">
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
