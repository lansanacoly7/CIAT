"use client";

import { useState } from "react";
import { Button } from "@/components/ui";
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
      title="Mentor référent"
      icon={
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2} aria-hidden>
          <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      }
      action={
        canAssign && !open ? (
          <Button variant="secondary" className="!min-h-9 !py-1 !px-3 !text-xs font-semibold" onClick={openForm}>
            {mentor ? "Changer" : "Affecter"}
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
      {mentor ? (
        <div className="flex items-center gap-3 rounded-xl border border-[#EFE4D6] bg-[#FBF7F2] p-3.5">
          <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full bg-[#522504] text-sm font-bold text-white shadow-xs">
            {mentor.nom_complet
              .split(" ")
              .filter(Boolean)
              .slice(0, 2)
              .map((n) => n[0]?.toUpperCase())
              .join("") || "M"}
          </div>
          <div className="min-w-0 flex-1 space-y-0.5">
            <div className="flex items-center gap-2">
              <span className="truncate font-bold text-[#3D1A04] text-sm">{mentor.nom_complet}</span>
            </div>
            <p className="truncate text-xs text-[#7C6353]">{mentor.email}</p>
            <div className="pt-1">
              <span className="inline-flex items-center rounded-md bg-[#2E7D32]/10 px-2 py-0.5 text-[10px] font-semibold text-[#2E7D32]">
                Mentor affecté
              </span>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-4 text-center">
          <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-[#FAF4EC] text-[#B89C82]">
            <svg className="h-8 w-8" viewBox="0 0 64 64" fill="none" stroke="currentColor" strokeWidth={2}>
              <circle cx="24" cy="22" r="8" fill="#F7EFE6" stroke="#8A7261" />
              <path d="M12 46 C12 36 18 34 24 34 C30 34 36 36 36 46" fill="#F7EFE6" stroke="#8A7261" />
              <circle cx="42" cy="24" r="7" fill="#FAF4EC" stroke="#B89C82" />
              <path d="M32 46 C32 38 37 36 42 36 C47 36 52 38 52 46" fill="#FAF4EC" stroke="#B89C82" />
              <circle cx="46" cy="18" r="4" fill="#522504" stroke="#522504" />
              <path d="M46 16v4M44 18h4" stroke="#FFF" strokeWidth={1.5} strokeLinecap="round" />
            </svg>
          </div>
          <p className="max-w-[200px] text-xs font-medium text-[#7C6353]">
            Aucun mentor n&apos;est actuellement affecté à ce projet.
          </p>
        </div>
      )}

      {open && (
        <div className="mt-4 space-y-3 rounded-xl border border-[#EFE4D6] bg-[#FAF7F2] p-4">
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
              <p className="mt-1 text-xs text-[#7C6353]">Aucun mentor n&apos;est enregistré sur la plateforme.</p>
            )}
          </div>
          <InlineError message={error} />
          <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
            <Button variant="secondary" className="!min-h-10 !text-xs" onClick={() => setOpen(false)} disabled={saving}>
              Annuler
            </Button>
            <Button className="!min-h-10 !text-xs" onClick={submit} disabled={!choice || saving}>
              {saving ? "Affectation…" : "Affecter"}
            </Button>
          </div>
        </div>
      )}
    </Block>
  );
}
