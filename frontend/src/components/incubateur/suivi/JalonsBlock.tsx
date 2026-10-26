"use client";

import { useRef, useState, type FormEvent } from "react";
import { Badge, Button } from "@/components/ui";
import {
  JALON_STATUTS,
  ajouterCommentaire,
  creerJalon,
  deposerPreuve,
  formatDateFr,
  mediaUrl,
  modifierJalon,
  suiviErrorMessage,
  type Jalon,
  type JalonStatut,
} from "@/lib/incubator";
import { Block, FieldLabel, INPUT, InlineError } from "./shared";

const TONES = { a_faire: "neutre", en_cours: "info", fait: "succes" } as const;

function JalonCard({
  jalon,
  canManage,
  onChange,
}: {
  jalon: Jalon;
  canManage: boolean;
  onChange: () => void;
}) {
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<"statut" | "preuve" | "commentaire" | null>(null);
  const [texte, setTexte] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  async function run(kind: NonNullable<typeof busy>, action: () => Promise<unknown>, fallback: string) {
    if (busy) return;
    setBusy(kind);
    setError(null);
    try {
      await action();
      onChange();
      return true;
    } catch (err) {
      setError(suiviErrorMessage(err, fallback));
    } finally {
      setBusy(null);
    }
  }

  async function sendComment(e: FormEvent) {
    e.preventDefault();
    if (!texte.trim()) return;
    if (await run("commentaire", () => ajouterCommentaire(jalon.id, texte.trim()), "L'ajout du commentaire a échoué.")) {
      setTexte("");
    }
  }

  return (
    <li
      id={`jalon-${jalon.id}`}
      className={`scroll-mt-24 rounded-lg border bg-white p-4 ${
        jalon.en_retard ? "border-erreur border-l-8" : "border-bordure"
      }`}
    >
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h3 className="font-[family-name:var(--font-title)] text-base font-bold text-brun">{jalon.titre}</h3>
          <p className="text-sm text-texte-doux">Échéance : {formatDateFr(jalon.echeance)}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {jalon.en_retard && (
            <span className="inline-flex items-center gap-1 rounded-full bg-erreur px-3 py-1 text-xs font-bold uppercase tracking-wide text-white">
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5} aria-hidden>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              En retard
            </span>
          )}
          {canManage ? (
            <>
              <label htmlFor={`statut-${jalon.id}`} className="sr-only">
                Statut du jalon
              </label>
              <select
                id={`statut-${jalon.id}`}
                value={jalon.statut}
                disabled={busy === "statut"}
                onChange={(e) =>
                  run("statut", () => modifierJalon(jalon.id, { statut: e.target.value as JalonStatut }), "La mise à jour du statut a échoué.")
                }
                className={`${INPUT} !w-auto`}
              >
                {Object.entries(JALON_STATUTS).map(([v, l]) => (
                  <option key={v} value={v}>
                    {l}
                  </option>
                ))}
              </select>
            </>
          ) : (
            <Badge tone={TONES[jalon.statut]}>{JALON_STATUTS[jalon.statut]}</Badge>
          )}
        </div>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <div>
          <h4 className="mb-2 text-sm font-bold text-texte">Preuves ({jalon.preuves.length})</h4>
          {jalon.preuves.length === 0 ? (
            <p className="text-sm text-texte-doux">Aucune preuve déposée.</p>
          ) : (
            <ul className="space-y-1">
              {jalon.preuves.map((p) => (
                <li key={p.id} className="flex flex-col text-sm sm:flex-row sm:justify-between sm:gap-2">
                  <a
                    href={mediaUrl(p.fichier)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="break-all font-medium text-brun underline hover:text-brun-fonce"
                  >
                    {p.nom}
                  </a>
                  <span className="text-xs text-texte-doux">
                    {p.depose_par_nom ?? "—"} · {formatDateFr(p.depose_le)}
                  </span>
                </li>
              ))}
            </ul>
          )}
          <input
            ref={fileRef}
            type="file"
            id={`preuve-${jalon.id}`}
            className="sr-only"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) run("preuve", () => deposerPreuve(jalon.id, f), "Le dépôt de la preuve a échoué.");
              e.target.value = "";
            }}
          />
          <Button
            variant="secondary"
            className="mt-3 !min-h-11"
            disabled={busy === "preuve"}
            onClick={() => fileRef.current?.click()}
          >
            {busy === "preuve" ? "Envoi en cours…" : "Déposer une preuve"}
          </Button>
        </div>

        <div>
          <h4 className="mb-2 text-sm font-bold text-texte">Commentaires ({jalon.commentaires.length})</h4>
          {jalon.commentaires.length === 0 ? (
            <p className="text-sm text-texte-doux">Aucun commentaire.</p>
          ) : (
            <ul className="max-h-60 space-y-2 overflow-y-auto">
              {jalon.commentaires.map((c) => (
                <li key={c.id} className="rounded-lg bg-ivoire p-2 text-sm">
                  <p className="text-xs text-texte-doux">
                    <span className="font-semibold text-texte">{c.auteur_nom}</span> · {formatDateFr(c.cree_le)}
                  </p>
                  <p className="whitespace-pre-line text-texte">{c.texte}</p>
                </li>
              ))}
            </ul>
          )}
          <form onSubmit={sendComment} className="mt-3 flex flex-col gap-2 sm:flex-row">
            <label htmlFor={`comm-${jalon.id}`} className="sr-only">
              Ajouter un commentaire
            </label>
            <input
              id={`comm-${jalon.id}`}
              className={INPUT}
              placeholder="Ajouter un commentaire…"
              value={texte}
              onChange={(e) => setTexte(e.target.value)}
            />
            <Button type="submit" className="!min-h-11 shrink-0" disabled={!texte.trim() || busy === "commentaire"}>
              {busy === "commentaire" ? "Envoi…" : "Publier"}
            </Button>
          </form>
        </div>
      </div>

      {error && (
        <div className="mt-3">
          <InlineError message={error} />
        </div>
      )}
    </li>
  );
}

export default function JalonsBlock({
  projetId,
  jalons,
  canManage,
  onChange,
}: {
  projetId: number;
  jalons: Jalon[];
  canManage: boolean;
  onChange: () => void;
}) {
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState<{ titre: string; echeance: string; statut: JalonStatut }>({
    titre: "",
    echeance: "",
    statut: "a_faire",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (saving) return;
    if (!form.titre.trim() || !form.echeance) {
      setError("Le titre et l'échéance du jalon sont obligatoires.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await creerJalon(projetId, { ...form, titre: form.titre.trim() });
      setForm({ titre: "", echeance: "", statut: "a_faire" });
      setAdding(false);
      onChange();
    } catch (err) {
      setError(suiviErrorMessage(err, "La création du jalon a échoué."));
    } finally {
      setSaving(false);
    }
  }

  const retards = jalons.filter((j) => j.en_retard).length;

  return (
    <Block
      title={retards ? `Jalons — ${retards} en retard` : "Jalons"}
      action={
        canManage && !adding ? (
          <Button variant="secondary" className="!min-h-11" onClick={() => setAdding(true)}>
            Ajouter un jalon
          </Button>
        ) : undefined
      }
    >
      {jalons.length === 0 && !adding && <p className="text-sm text-texte-doux">Aucun jalon défini pour ce projet.</p>}

      <ul className="space-y-4">
        {jalons.map((j) => (
          <JalonCard key={j.id} jalon={j} canManage={canManage} onChange={onChange} />
        ))}
      </ul>

      {adding && (
        <form onSubmit={submit} noValidate className="mt-4 space-y-3 rounded-lg border border-bordure bg-ivoire p-4">
          <div>
            <FieldLabel htmlFor="jalon-titre">Titre du jalon</FieldLabel>
            <input id="jalon-titre" className={INPUT} value={form.titre} onChange={(e) => setForm({ ...form, titre: e.target.value })} />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <FieldLabel htmlFor="jalon-echeance">Échéance</FieldLabel>
              <input id="jalon-echeance" type="date" className={INPUT} value={form.echeance} onChange={(e) => setForm({ ...form, echeance: e.target.value })} />
            </div>
            <div>
              <FieldLabel htmlFor="jalon-statut">Statut</FieldLabel>
              <select id="jalon-statut" className={INPUT} value={form.statut} onChange={(e) => setForm({ ...form, statut: e.target.value as JalonStatut })}>
                {Object.entries(JALON_STATUTS).map(([v, l]) => (
                  <option key={v} value={v}>
                    {l}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <InlineError message={error} />
          <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
            <Button type="button" variant="secondary" className="!min-h-11" onClick={() => setAdding(false)} disabled={saving}>
              Annuler
            </Button>
            <Button type="submit" className="!min-h-11" disabled={saving}>
              {saving ? "Création…" : "Créer le jalon"}
            </Button>
          </div>
        </form>
      )}
    </Block>
  );
}
