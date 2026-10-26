"use client";

import { useState } from "react";
import { Badge, Button } from "@/components/ui";
import { affecterMentor, getMentors, suiviErrorMessage, type Mentor } from "@/lib/incubator";
import { Block, FieldLabel, INPUT, InlineError } from "./shared";

export default function MentorBlock({
  projetId,
  mentor,
  canAssign,
  onAssigned,
}: {
  projetId: number;
  mentor: Mentor | null;
  canAssign: boolean;
  onAssigned: (mentor: Mentor) => void;
}) {
  const [open, setOpen] = useState(false);
  const [mentors, setMentors] = useState<Mentor[] | null>(null);
  const [choice, setChoice] = useState("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function openForm() {
    setOpen(true);
    setError(null);
    if (mentors) return;
    setLoading(true);
    try {
      setMentors(await getMentors());
    } catch (err) {
      setError(suiviErrorMessage(err, "Impossible de charger la liste des mentors."));
    } finally {
      setLoading(false);
    }
  }

  async function submit() {
    if (!choice || saving) return;
    setSaving(true);
    setError(null);
    try {
      const res = await affecterMentor(projetId, Number(choice));
      onAssigned(res.mentor_details);
      setOpen(false);
      setChoice("");
    } catch (err) {
      setError(suiviErrorMessage(err, "L'affectation du mentor a échoué."));
    } finally {
      setSaving(false);
    }
  }

  return (
    <Block
      title="Mentor"
      action={
        canAssign && !open ? (
          <Button variant="secondary" className="!min-h-11" onClick={openForm}>
            {mentor ? "Changer de mentor" : "Affecter un mentor"}
          </Button>
        ) : undefined
      }
    >
      {mentor ? (
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-semibold text-texte">{mentor.nom_complet}</span>
          <Badge tone="succes">Mentor affecté</Badge>
          <span className="text-sm text-texte-doux">{mentor.email}</span>
        </div>
      ) : (
        <p className="text-sm text-texte-doux">
          Le mentor actuel de ce projet n&apos;est pas communiqué par l&apos;API. Il apparaît ici dès qu&apos;un mentor est
          affecté depuis cet écran.
        </p>
      )}

      {open && (
        <div className="mt-4 space-y-3 rounded-lg border border-bordure bg-ivoire p-4">
          <div>
            <FieldLabel htmlFor="mentor-select">Choisir un mentor</FieldLabel>
            <select
              id="mentor-select"
              value={choice}
              onChange={(e) => setChoice(e.target.value)}
              disabled={loading}
              className={INPUT}
            >
              <option value="">{loading ? "Chargement…" : "Sélectionnez un mentor…"}</option>
              {mentors?.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.nom_complet}
                </option>
              ))}
            </select>
            {mentors && mentors.length === 0 && (
              <p className="mt-1 text-sm text-texte-doux">Aucun mentor n&apos;est enregistré sur la plateforme.</p>
            )}
          </div>
          <InlineError message={error} />
          <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
            <Button variant="secondary" className="!min-h-11" onClick={() => setOpen(false)} disabled={saving}>
              Annuler
            </Button>
            <Button className="!min-h-11" onClick={submit} disabled={!choice || saving}>
              {saving ? "Affectation…" : "Affecter"}
            </Button>
          </div>
        </div>
      )}
    </Block>
  );
}
