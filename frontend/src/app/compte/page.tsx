"use client";

import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { useAuth, type Role, type User } from "@/context/AuthContext";
import { ApiErrorBanner, Badge, Button, PageTitle } from "@/components/ui";
import { api, ApiError } from "@/lib/api";
import { fetchAll } from "@/lib/paginate";
import { STATUT_LABELS, suiviErrorMessage, type Dossier } from "@/lib/incubator";

const ROLE_LABELS: Record<Role, string> = {
  porteur: "Porteur de projet",
  mentor: "Mentor",
  membre_comite: "Membre du comité",
  coordonnateur: "Coordonnateur",
  administrateur: "Administrateur",
  visiteur: "Visiteur",
};

const INPUT =
  "min-h-11 w-full rounded-lg border border-[#EFE4D6] bg-white px-3 text-[#24140D] outline-none transition-colors focus:border-[#C99A68] focus:ring-2 focus:ring-[#C99A68]/40";

const GENRES = [
  { value: "", label: "Non précisé" },
  { value: "F", label: "Femme" },
  { value: "H", label: "Homme" },
  { value: "A", label: "Autre / non précisé" },
];

const FIELD_NAMES: Record<string, string> = {
  first_name: "Prénom",
  last_name: "Nom",
  telephone: "Téléphone",
  organisation: "Organisation",
  genre: "Genre",
};

function RoleBadge({ role }: { role: Role }) {
  const tone = { porteur: "neutre", mentor: "info", membre_comite: "alerte", coordonnateur: "succes", administrateur: "erreur", visiteur: "neutre" } as const;
  return <Badge tone={tone[role]}>{ROLE_LABELS[role]}</Badge>;
}

function Block({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-xl border border-[#EFE4D6] bg-[#FAF7F2] p-4 shadow-sm sm:p-6">
      <h2 className="mb-4 text-lg font-bold text-[#612D10] sm:text-xl">{title}</h2>
      {children}
    </section>
  );
}

function ProfilForm({ user }: { user: User }) {
  const { refreshUser } = useAuth();
  const [form, setForm] = useState({
    first_name: user.first_name ?? "",
    last_name: user.last_name ?? "",
    telephone: user.telephone ?? "",
    organisation: user.organisation ?? "",
    genre: user.genre ?? "",
  });
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<{ ok: boolean; message: string } | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const set = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm((f) => ({ ...f, [key]: e.target.value }));
    setStatus(null);
  };

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (saving) return;
    setSaving(true);
    setStatus(null);
    setFieldErrors({});
    try {
      await api("/auth/me/", { method: "PATCH", body: form });
      await refreshUser();
      setStatus({ ok: true, message: "Votre profil a bien été enregistré." });
    } catch (err) {
      if (err instanceof ApiError && err.status === 400 && err.data && typeof err.data === "object") {
        const fe: Record<string, string> = {};
        for (const [k, v] of Object.entries(err.data as Record<string, unknown>)) {
          fe[k] = Array.isArray(v) ? v.join(" ") : String(v);
        }
        setFieldErrors(fe);
        setStatus({ ok: false, message: "Certaines informations sont invalides. Corrigez-les puis réessayez." });
      } else {
        setStatus({ ok: false, message: suiviErrorMessage(err, "L'enregistrement du profil a échoué. Veuillez réessayer.") });
      }
    } finally {
      setSaving(false);
    }
  }

  const text = (key: "first_name" | "last_name" | "telephone" | "organisation", type = "text", auto?: string) => (
    <div>
      <label htmlFor={key} className="mb-1 block text-sm font-medium text-[#24140D]">
        {FIELD_NAMES[key]}
      </label>
      <input id={key} type={type} autoComplete={auto} value={form[key]} onChange={set(key)} className={INPUT} aria-invalid={Boolean(fieldErrors[key])} />
      {fieldErrors[key] && <p className="mt-1 text-sm text-[#DC2626]">{fieldErrors[key]}</p>}
    </div>
  );

  return (
    <form onSubmit={submit} noValidate className="space-y-4">
      <div>
        <label htmlFor="email" className="mb-1 block text-sm font-medium text-[#24140D]">
          Adresse e-mail
        </label>
        <input id="email" value={user.email} readOnly className={`${INPUT} cursor-not-allowed bg-[#EFE4D6]/40 text-[#6b5646]`} />
      </div>
      <div className="flex items-center gap-2 text-sm text-[#6b5646]">
        Rôle : <RoleBadge role={user.role} />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        {text("first_name", "text", "given-name")}
        {text("last_name", "text", "family-name")}
        {text("telephone", "tel", "tel")}
        {text("organisation", "text", "organization")}
      </div>
      <div className="sm:max-w-xs">
        <label htmlFor="genre" className="mb-1 block text-sm font-medium text-[#24140D]">
          Genre
        </label>
        <select id="genre" value={form.genre} onChange={set("genre")} className={INPUT}>
          {GENRES.map((g) => (
            <option key={g.value} value={g.value}>
              {g.label}
            </option>
          ))}
        </select>
        {fieldErrors.genre && <p className="mt-1 text-sm text-[#DC2626]">{fieldErrors.genre}</p>}
      </div>

      {status && (
        <p
          role={status.ok ? "status" : "alert"}
          className={`rounded-lg border px-3 py-2 text-sm ${
            status.ok ? "border-[#2E7D32]/40 bg-[#2E7D32]/5 text-[#2E7D32]" : "border-[#DC2626]/40 bg-[#DC2626]/5 text-[#DC2626]"
          }`}
        >
          {status.message}
        </p>
      )}

      <Button type="submit" disabled={saving} className="!min-h-11 w-full sm:w-auto">
        {saving ? "Enregistrement…" : "Enregistrer mes informations"}
      </Button>
    </form>
  );
}

interface ProjetCompte {
  id: number;
  titre: string;
  domaine_nom?: string;
  statut: string;
  cree_le: string;
}

const PROJET_STATUTS: Record<string, string> = {
  idee: "Idée",
  depose: "Dossier déposé",
  selectionne: "Sélectionné",
  incube: "En incubation",
  prototype: "Prototype",
  termine: "Incubation terminée",
  rejete: "Non retenu",
};

const DOSSIER_TONES = { brouillon: "neutre", soumis: "alerte", complet: "succes", en_evaluation: "info", accepte: "succes", refuse: "erreur" } as const;

const date = (iso: string) => new Date(iso).toLocaleDateString("fr-FR", { day: "2-digit", month: "long", year: "numeric" });

function MesProjets() {
  const [data, setData] = useState<{ projets: ProjetCompte[]; dossiers: Dossier[] } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    let cancelled = false;
    Promise.all([fetchAll<ProjetCompte>("/projets/"), fetchAll<Dossier>("/incubator/dossiers/")])
      .then(([projets, dossiers]) => {
        if (cancelled) return;
        setData({ projets, dossiers });
        setError(null);
      })
      .catch((err) => !cancelled && setError(suiviErrorMessage(err, "Impossible de charger vos projets et dossiers.")));
    return () => {
      cancelled = true;
    };
  }, [tick]);

  if (error) return <ApiErrorBanner message={error} onRetry={() => setTick((t) => t + 1)} className="!mb-0" />;
  if (!data)
    return (
      <div className="flex justify-center py-8" role="status" aria-label="Chargement">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#C99A68] border-t-[#612D10]" />
      </div>
    );

  const { projets, dossiers } = data;
  if (projets.length === 0 && dossiers.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-[#E2D4C3] bg-white p-6 text-center">
        <p className="text-sm text-[#6b5646]">Vous n&apos;avez pas encore de projet ni de dossier de candidature.</p>
        <Link
          href="/incubateur"
          className="mt-4 inline-flex min-h-11 items-center justify-center rounded-lg bg-[#612D10] px-6 text-sm font-semibold text-white hover:bg-[#3F1D0A]"
        >
          Déposer un dossier
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="mb-2 text-sm font-bold uppercase tracking-wide text-[#6b5646]">Mes projets ({projets.length})</h3>
        {projets.length === 0 ? (
          <p className="text-sm text-[#6b5646]">Aucun projet.</p>
        ) : (
          <ul className="space-y-2">
            {projets.map((p) => (
              <li key={p.id} className="flex flex-col gap-2 rounded-lg border border-[#EFE4D6] bg-white p-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <p className="font-semibold text-[#612D10]">{p.titre}</p>
                  <p className="text-xs text-[#6b5646]">
                    {p.domaine_nom} · créé le {date(p.cree_le)}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Badge>{PROJET_STATUTS[p.statut] ?? p.statut}</Badge>
                  <Link href={`/incubateur/projets/${p.id}`} className="inline-flex min-h-11 items-center px-2 text-sm font-semibold text-[#612D10] underline hover:text-[#3F1D0A]">
                    Suivi
                  </Link>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div>
        <h3 className="mb-2 text-sm font-bold uppercase tracking-wide text-[#6b5646]">Mes dossiers de candidature ({dossiers.length})</h3>
        {dossiers.length === 0 ? (
          <p className="text-sm text-[#6b5646]">
            Aucun dossier déposé.{" "}
            <Link href="/incubateur" className="font-semibold text-[#612D10] underline">
              Déposer un dossier
            </Link>
          </p>
        ) : (
          <ul className="space-y-2">
            {dossiers.map((d) => (
              <li key={d.id} className="flex flex-col gap-2 rounded-lg border border-[#EFE4D6] bg-white p-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <p className="font-semibold text-[#24140D]">
                    Dossier n°{d.id} — {d.projet.titre}
                  </p>
                  <p className="text-xs text-[#6b5646]">
                    {d.soumis_le ? `Soumis le ${date(d.soumis_le)}` : "Non soumis"} · complétude {d.completude}%
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Badge tone={DOSSIER_TONES[d.statut]}>{STATUT_LABELS[d.statut].label}</Badge>
                  <Link
                    href={d.statut === "brouillon" ? "/incubateur" : `/incubateur/projets/${d.projet.id}`}
                    className="inline-flex min-h-11 items-center px-2 text-sm font-semibold text-[#612D10] underline hover:text-[#3F1D0A]"
                  >
                    {d.statut === "brouillon" ? "Reprendre" : "Voir le suivi"}
                  </Link>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function Compte() {
  const { user } = useAuth();
  if (!user) return null;
  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-8 sm:py-12">
      <PageTitle title="Mon compte" subtitle="Consultez et modifiez vos informations personnelles." />
      <div className="space-y-6">
        <Block title="Mon profil">
          <ProfilForm key={user.id} user={user} />
        </Block>
        {user.role === "porteur" && (
          <Block title="Mes projets et dossiers">
            <MesProjets />
          </Block>
        )}
      </div>
    </div>
  );
}

export default function ComptePage() {
  return (
    <ProtectedRoute>
      <Compte />
    </ProtectedRoute>
  );
}
