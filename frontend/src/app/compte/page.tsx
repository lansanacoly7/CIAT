"use client";

import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import {
  Bell,
  Check,
  ChevronRight,
  Download,
  FolderOpen,
  Info,
  KeyRound,
  Lock,
  Mail,
  Save,
  ShieldCheck,
  User as UserIcon,
} from "lucide-react";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { useAuth, type Role, type User } from "@/context/AuthContext";
import { ApiErrorBanner, Badge } from "@/components/ui";
import { api, ApiError } from "@/lib/api";
import { fetchAll } from "@/lib/paginate";
import { STATUT_LABELS, suiviErrorMessage, telechargerAccuseReception, type Dossier } from "@/lib/incubator";

const ROLE_LABELS: Record<Role, string> = {
  porteur: "Porteur de projet",
  mentor: "Mentor",
  membre_comite: "Membre du comité",
  coordonnateur: "Coordonnateur",
  administrateur: "Administrateur",
  visiteur: "Visiteur",
};

const INPUT =
  "min-h-11 w-full rounded-xl border border-[#EFE4D6] bg-white px-3.5 text-xs sm:text-sm text-[#24140D] outline-none transition-all placeholder:text-[#a89582] focus:border-[#C99A68] focus:ring-2 focus:ring-[#C99A68]/20";

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

const DOSSIER_TONES = {
  brouillon: "neutre",
  soumis: "alerte",
  complet: "succes",
  en_evaluation: "info",
  accepte: "succes",
  refuse: "erreur",
} as const;

const dateFr = (iso: string) =>
  new Date(iso).toLocaleDateString("fr-FR", { day: "2-digit", month: "long", year: "numeric" });

function dossierStatutLabel(statut: string) {
  return STATUT_LABELS[statut as keyof typeof STATUT_LABELS]?.label ?? "Statut non reconnu";
}

function ProfilSection({ user }: { user: User }) {
  const { refreshUser } = useAuth();
  const initialForm = {
    first_name: user.first_name ?? "",
    last_name: user.last_name ?? "",
    telephone: user.telephone ?? "",
    organisation: user.organisation ?? "",
    genre: user.genre ?? "",
  };

  const [form, setForm] = useState(initialForm);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<{ ok: boolean; message: string } | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [passwordNotice, setPasswordNotice] = useState(false);

  const set = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm((f) => ({ ...f, [key]: e.target.value }));
    setStatus(null);
  };

  const resetForm = () => {
    setForm(initialForm);
    setStatus(null);
    setFieldErrors({});
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

  const userDisplayName = user.first_name
    ? `${user.first_name} ${user.last_name || ""}`.trim()
    : user.email.split("@")[0];

  const userInitials = user.first_name
    ? `${user.first_name[0]}${user.last_name ? user.last_name[0] : ""}`.toUpperCase()
    : user.email.slice(0, 2).toUpperCase();

  return (
    <div className="space-y-6">
      {/* Fil d'Ariane harmonisé */}
      <div className="flex items-center gap-1.5 text-xs font-semibold text-[#8C6D58]">
        <Link
          href="/incubateur/projets"
          className="hover:text-[#612D10] hover:underline transition-colors"
        >
          Suivi des projets
        </Link>
        <span className="text-[#C99A68]/60">/</span>
        <span className="text-[#612D10] font-bold">Mon profil & Compte</span>
      </div>
      
      {/* 1. BANNIÈRE RÉSUMÉ DU PROFIL (Fidèle au design sans la lampe) */}
      <div className="relative overflow-hidden rounded-2xl border border-[#EFE4D6] bg-white p-6 sm:p-7 shadow-sm">
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            {/* Avatar initiales rond */}
            <div className="h-16 w-16 sm:h-20 sm:w-20 rounded-full bg-[#8A5028] text-white flex items-center justify-center font-[family-name:var(--font-title)] font-bold text-2xl sm:text-3xl shadow-sm shrink-0">
              {userInitials}
            </div>
            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h2 className="font-[family-name:var(--font-title)] text-xl sm:text-2xl font-bold text-[#24140D]">
                  {userDisplayName}
                </h2>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-[#F5EDE4] text-[#8A5028] border border-[#EADBCE]">
                  {ROLE_LABELS[user.role] ?? user.role}
                </span>
              </div>
              <p className="text-xs sm:text-sm text-[#6b5646] flex items-center gap-1.5 mt-1 font-medium">
                <Mail className="h-3.5 w-3.5 text-[#A35926]" aria-hidden="true" />
                <span>{user.email}</span>
              </p>
            </div>
          </div>
        </div>

        {/* Arcs décoratifs organiques en arrière-plan à droite (sans la lampe, selon vos consignes) */}
        <div className="hidden sm:block absolute right-0 top-0 bottom-0 w-80 pointer-events-none overflow-hidden">
          <svg viewBox="0 0 300 120" preserveAspectRatio="none" className="h-full w-full opacity-60" aria-hidden="true">
            <path d="M 120,120 C 180,90 220,50 300,10 L 300,120 Z" fill="#EADBCE" />
            <path d="M 180,120 C 230,100 260,70 300,40 L 300,120 Z" fill="#F0E3D3" />
          </svg>
        </div>
      </div>

      {/* 2. FORMULAIRE ET SÉCURITÉ EN DOUBLE COLONNE */}
      <form onSubmit={submit} noValidate className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
          
          {/* Colonne Gauche (Informations personnelles) */}
          <div className="lg:col-span-8 rounded-2xl border border-[#EFE4D6] bg-white p-6 sm:p-7 shadow-sm space-y-5 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-3 pb-3 border-b border-[#EFE4D6] mb-4">
                <div className="h-10 w-10 rounded-xl bg-[#FAF4ED] text-[#612D10] flex items-center justify-center">
                  <UserIcon className="h-5 w-5" aria-hidden="true" />
                </div>
                <div>
                  <h3 className="font-[family-name:var(--font-title)] text-base font-bold text-[#24140D]">
                    Informations personnelles
                  </h3>
                  <p className="text-xs text-[#6b5646]">Ces informations seront utilisées pour vous identifier et vous contacter.</p>
                </div>
              </div>

              <div className="space-y-4">
                {/* Email (non modifiable) */}
                <div>
                  <label htmlFor="email" className="block text-xs font-bold text-[#6b5646] mb-1">
                    Adresse e-mail <span className="font-normal text-[#8A5028]">(non modifiable)</span>
                  </label>
                  <div className="relative">
                    <input
                      id="email"
                      value={user.email}
                      readOnly
                      disabled
                      className={`${INPUT} cursor-not-allowed bg-[#FAF7F2] text-[#6b5646] pr-10`}
                    />
                    <Lock className="h-4 w-4 text-[#A35926] absolute right-3.5 top-1/2 -translate-y-1/2" aria-hidden="true" />
                  </div>
                </div>

                {/* Prénom & Nom */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="first_name" className="block text-xs font-bold text-[#24140D] mb-1">
                      {FIELD_NAMES.first_name} <span className="text-[#DC2626]">*</span>
                    </label>
                    <input
                      id="first_name"
                      type="text"
                      autoComplete="given-name"
                      value={form.first_name}
                      onChange={set("first_name")}
                      className={INPUT}
                      aria-invalid={Boolean(fieldErrors.first_name)}
                      aria-describedby={fieldErrors.first_name ? "first_name-error" : undefined}
                    />
                    {fieldErrors.first_name && (
                      <p id="first_name-error" className="mt-1 text-xs text-[#DC2626]">
                        {fieldErrors.first_name}
                      </p>
                    )}
                  </div>

                  <div>
                    <label htmlFor="last_name" className="block text-xs font-bold text-[#24140D] mb-1">
                      {FIELD_NAMES.last_name} <span className="text-[#DC2626]">*</span>
                    </label>
                    <input
                      id="last_name"
                      type="text"
                      autoComplete="family-name"
                      value={form.last_name}
                      onChange={set("last_name")}
                      className={INPUT}
                      aria-invalid={Boolean(fieldErrors.last_name)}
                      aria-describedby={fieldErrors.last_name ? "last_name-error" : undefined}
                    />
                    {fieldErrors.last_name && (
                      <p id="last_name-error" className="mt-1 text-xs text-[#DC2626]">
                        {fieldErrors.last_name}
                      </p>
                    )}
                  </div>
                </div>

                {/* Téléphone & Organisation */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="telephone" className="block text-xs font-bold text-[#24140D] mb-1">
                      {FIELD_NAMES.telephone}
                    </label>
                    <input
                      id="telephone"
                      type="tel"
                      autoComplete="tel"
                      placeholder="+221 ..."
                      value={form.telephone}
                      onChange={set("telephone")}
                      className={INPUT}
                      aria-invalid={Boolean(fieldErrors.telephone)}
                      aria-describedby={fieldErrors.telephone ? "telephone-error" : undefined}
                    />
                    {fieldErrors.telephone && (
                      <p id="telephone-error" className="mt-1 text-xs text-[#DC2626]">
                        {fieldErrors.telephone}
                      </p>
                    )}
                  </div>

                  <div>
                    <label htmlFor="organisation" className="block text-xs font-bold text-[#24140D] mb-1">
                      {FIELD_NAMES.organisation} <span className="text-[#DC2626]">*</span>
                    </label>
                    <input
                      id="organisation"
                      type="text"
                      autoComplete="organization"
                      value={form.organisation}
                      onChange={set("organisation")}
                      className={INPUT}
                      aria-invalid={Boolean(fieldErrors.organisation)}
                      aria-describedby={fieldErrors.organisation ? "organisation-error" : undefined}
                    />
                    {fieldErrors.organisation && (
                      <p id="organisation-error" className="mt-1 text-xs text-[#DC2626]">
                        {fieldErrors.organisation}
                      </p>
                    )}
                  </div>
                </div>

                {/* Genre */}
                <div>
                  <label htmlFor="genre" className="block text-xs font-bold text-[#24140D] mb-1">
                    {FIELD_NAMES.genre}
                  </label>
                  <select
                    id="genre"
                    value={form.genre}
                    onChange={set("genre")}
                    className={INPUT}
                    aria-invalid={Boolean(fieldErrors.genre)}
                    aria-describedby={fieldErrors.genre ? "genre-error" : undefined}
                  >
                    {GENRES.map((g) => (
                      <option key={g.value} value={g.value}>
                        {g.label}
                      </option>
                    ))}
                  </select>
                  {fieldErrors.genre && (
                    <p id="genre-error" className="mt-1 text-xs text-[#DC2626]">
                      {fieldErrors.genre}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Colonne Droite (Sécurité du compte) */}
          <div className="lg:col-span-4 rounded-2xl border border-[#EFE4D6] bg-white p-6 sm:p-7 shadow-sm flex flex-col justify-between space-y-6">
            <div>
              <div className="flex items-center gap-3 pb-3 border-b border-[#EFE4D6]">
                <div className="h-10 w-10 rounded-xl bg-[#FAF4ED] text-[#612D10] flex items-center justify-center">
                  <Lock className="h-5 w-5" aria-hidden="true" />
                </div>
                <div>
                  <h3 className="font-[family-name:var(--font-title)] text-base font-bold text-[#24140D]">
                    Sécurité du compte
                  </h3>
                  <p className="text-xs text-[#6b5646]">Gérez l&apos;accès à votre compte.</p>
                </div>
              </div>

              {/* Emblème central Bouclier & Protection CIAT */}
              <div className="py-8 flex flex-col items-center justify-center text-center">
                <div className="relative h-24 w-24 rounded-2xl bg-[#FAF4ED] border border-[#EFE4D6] flex items-center justify-center text-[#612D10] shadow-xs">
                  <ShieldCheck className="h-12 w-12 text-[#612D10]" aria-hidden="true" />
                  <div className="absolute -bottom-2 -right-2 h-8 w-8 rounded-full bg-[#612D10] text-white flex items-center justify-center border-2 border-white shadow-xs">
                    <Lock className="h-4 w-4" aria-hidden="true" />
                  </div>
                </div>
                <p className="text-xs text-[#6b5646] mt-4 max-w-[200px] leading-relaxed">
                  Votre compte est protégé par mot de passe sécurisé.
                </p>
              </div>
            </div>

            <div>
              {passwordNotice && (
                <div className="mb-3 p-3 rounded-xl bg-[#FAF4ED] border border-[#EFE4D6] text-xs text-[#612D10] flex items-start gap-2">
                  <Info className="h-4 w-4 text-[#A35926] shrink-0 mt-0.5" aria-hidden="true" />
                  <span>Pour modifier votre mot de passe, utilisez la fonction « Mot de passe oublié » sur la page de connexion ou contactez le support CIAT.</span>
                </div>
              )}
              <button
                type="button"
                onClick={() => setPasswordNotice((v) => !v)}
                className="w-full inline-flex items-center justify-center gap-2 h-11 rounded-xl border border-[#612D10] bg-white text-xs font-bold text-[#612D10] hover:bg-[#F2E5D5] hover:border-[#3F1D0A] hover:text-[#3F1D0A] hover:shadow-xs active:scale-[0.98] transition-all cursor-pointer"
              >
                <KeyRound className="h-4 w-4" aria-hidden="true" />
                <span>Modifier le mot de passe</span>
              </button>
            </div>
          </div>

        </div>

        {/* Message de statut (succès ou erreur) */}
        {status && (
          <div
            role={status.ok ? "status" : "alert"}
            className={`p-4 rounded-xl border flex items-center gap-3 text-xs sm:text-sm font-medium ${
              status.ok
                ? "border-[#2E7D32]/30 bg-[#2E7D32]/5 text-[#2E7D32]"
                : "border-[#DC2626]/30 bg-[#DC2626]/5 text-[#DC2626]"
            }`}
          >
            {status.ok ? (
              <Check className="h-5 w-5 text-[#2E7D32] shrink-0" aria-hidden="true" />
            ) : (
              <Info className="h-5 w-5 text-[#DC2626] shrink-0" aria-hidden="true" />
            )}
            <span>{status.message}</span>
          </div>
        )}

        {/* 3. BANDEAU ACTIONS INFÉRIEUR */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pt-2">
          <div className="flex items-center gap-2.5 p-3.5 rounded-xl bg-white border border-[#EFE4D6] shadow-xs text-xs text-[#6b5646]">
            <Info className="h-4 w-4 text-[#A35926] shrink-0" aria-hidden="true" />
            <span>Vos informations servent au suivi de votre candidature au CIAT.</span>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <button
              type="button"
              onClick={resetForm}
              disabled={saving}
              className="px-5 h-11 rounded-xl border border-[#EFE4D6] bg-white text-xs font-bold text-[#6b5646] hover:bg-[#F2E5D5] hover:border-[#A35926] hover:text-[#3F1D0A] hover:shadow-xs active:scale-[0.98] transition-all cursor-pointer disabled:opacity-50"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-6 h-11 rounded-xl bg-[#612D10] hover:bg-[#3F1D0A] text-xs font-bold text-white shadow-sm flex items-center gap-2 transition-all hover:scale-[1.02] hover:shadow-md active:scale-[0.98] disabled:opacity-50 cursor-pointer"
            >
              <Save className="h-4 w-4" aria-hidden="true" />
              <span>{saving ? "Enregistrement…" : "Enregistrer les modifications"}</span>
            </button>
          </div>
        </div>
      </form>

    </div>
  );
}

function MesProjets() {
  const [data, setData] = useState<{ projets: ProjetCompte[]; dossiers: Dossier[] } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [tick, setTick] = useState(0);
  const [downloadingAccuseId, setDownloadingAccuseId] = useState<number | null>(null);
  const [accuseError, setAccuseError] = useState<{ id: number; message: string } | null>(null);

  async function handleTelechargerAccuse(dossierId: number) {
    setDownloadingAccuseId(dossierId);
    setAccuseError(null);
    try {
      const blob = await telechargerAccuseReception(dossierId);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `accuse_reception_dossier_${dossierId}.pdf`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.setTimeout(() => window.URL.revokeObjectURL(url), 1000);
    } catch (err) {
      setAccuseError({
        id: dossierId,
        message: suiviErrorMessage(err, "Impossible de télécharger l'accusé de réception. Veuillez réessayer."),
      });
    } finally {
      setDownloadingAccuseId(null);
    }
  }

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
      <div className="flex justify-center py-10" role="status" aria-label="Chargement">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#C99A68] border-t-[#612D10]" />
      </div>
    );

  const { projets, dossiers } = data;
  if (projets.length === 0 && dossiers.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-[#E2D4C3] bg-white p-8 sm:p-10 text-center space-y-4">
        <div className="mx-auto h-14 w-14 rounded-2xl bg-[#FAF4ED] text-[#A35926] flex items-center justify-center">
          <FolderOpen className="h-7 w-7" aria-hidden="true" />
        </div>
        <div>
          <h4 className="font-[family-name:var(--font-title)] text-base font-bold text-[#24140D]">
            Aucun projet ni dossier pour le moment
          </h4>
          <p className="text-xs sm:text-sm text-[#6b5646] mt-1">
            Vous n&apos;avez pas encore de projet ni de dossier de candidature enregistré.
          </p>
        </div>
        <Link
          href="/incubateur"
          className="inline-flex min-h-11 items-center justify-center rounded-xl bg-[#612D10] px-6 text-xs sm:text-sm font-bold text-white shadow-sm transition-all hover:bg-[#3F1D0A]"
        >
          Déposer un dossier
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      
      {/* Sous-section A : Mes projets */}
      <div className="space-y-3">
        <h4 className="text-xs font-bold uppercase tracking-wider text-[#A35926]">
          Mes projets ({projets.length})
        </h4>
        {projets.length === 0 ? (
          <p className="text-xs text-[#6b5646] p-4 rounded-xl border border-[#EFE4D6] bg-[#FAF7F2]/40">
            Aucun projet enregistré.
          </p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {projets.map((p) => (
              <div
                key={p.id}
                className="flex flex-col justify-between gap-3 p-4 rounded-xl border border-[#EFE4D6] bg-[#FAF7F2]/50 hover:border-[#C99A68] hover:bg-white transition-all shadow-xs"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <p className="font-[family-name:var(--font-title)] font-bold text-[#612D10] text-sm">
                      {p.titre}
                    </p>
                    <Badge>{PROJET_STATUTS[p.statut] ?? p.statut}</Badge>
                  </div>
                  <p className="text-xs text-[#6b5646] mt-1">
                    {p.domaine_nom ? `${p.domaine_nom} · ` : ""}Créé le {dateFr(p.cree_le)}
                  </p>
                </div>
                <div className="pt-2 border-t border-[#EFE4D6]/60 flex justify-end">
                  <Link
                    href={`/incubateur/projets/${p.id}`}
                    className="inline-flex items-center gap-1 text-xs font-bold text-[#612D10] hover:text-[#A35926] transition-colors"
                  >
                    <span>Suivi</span>
                    <ChevronRight className="h-3.5 w-3.5" aria-hidden="true" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Sous-section B : Mes dossiers de candidature */}
      <div className="space-y-3 pt-2">
        <h4 className="text-xs font-bold uppercase tracking-wider text-[#A35926]">
          Mes dossiers de candidature ({dossiers.length})
        </h4>
        {dossiers.length === 0 ? (
          <p className="text-xs text-[#6b5646] p-4 rounded-xl border border-[#EFE4D6] bg-[#FAF7F2]/40">
            Aucun dossier déposé.{" "}
            <Link href="/incubateur" className="font-bold text-[#612D10] underline">
              Déposer un dossier
            </Link>
          </p>
        ) : (
          <div className="space-y-3">
            {dossiers.map((d) => (
              <div
                key={d.id}
                className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-4 rounded-xl border border-[#EFE4D6] bg-white shadow-xs hover:border-[#C99A68] transition-all"
              >
                <div>
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <p className="font-[family-name:var(--font-title)] font-bold text-[#24140D] text-sm">
                      Dossier n°{d.id} — {d.projet.titre}
                    </p>
                    <Badge tone={DOSSIER_TONES[d.statut as keyof typeof DOSSIER_TONES] ?? "neutre"}>
                      {dossierStatutLabel(d.statut)}
                    </Badge>
                  </div>
                  <p className="text-xs text-[#6b5646] mt-1 flex items-center gap-2">
                    <span>{d.soumis_le ? `Soumis le ${dateFr(d.soumis_le)}` : "Non soumis"}</span>
                    <span>•</span>
                    <span className="font-semibold text-[#612D10]">Complétude {d.completude}%</span>
                  </p>
                </div>

                <div className="flex items-center gap-2.5 flex-wrap">
                  {/* Bouton officiel de téléchargement de l'accusé PDF (présent pour dossier soumis) */}
                  {Boolean(d.soumis_le) && (
                    <button
                      type="button"
                      onClick={() => handleTelechargerAccuse(d.id)}
                      disabled={downloadingAccuseId === d.id}
                      className="inline-flex min-h-10 items-center gap-1.5 rounded-xl border border-[#612D10] bg-white px-3.5 text-xs font-bold text-[#612D10] transition-colors hover:bg-[#FAF7F2] shadow-xs disabled:opacity-50"
                    >
                      {downloadingAccuseId === d.id ? (
                        <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-[#612D10]/40 border-t-[#612D10]" />
                      ) : (
                        <Download className="h-3.5 w-3.5 text-[#A35926]" aria-hidden="true" />
                      )}
                      <span>Accusé (PDF)</span>
                    </button>
                  )}

                  <Link
                    href={d.statut === "brouillon" ? "/incubateur" : `/incubateur/projets/${d.projet.id}`}
                    className="inline-flex min-h-10 items-center gap-1.5 rounded-xl bg-[#612D10] px-4 text-xs font-bold text-white shadow-xs transition-all hover:bg-[#3F1D0A]"
                  >
                    <span>{d.statut === "brouillon" ? "Reprendre" : "Voir le suivi"}</span>
                    <ChevronRight className="h-3.5 w-3.5" aria-hidden="true" />
                  </Link>
                </div>

                {accuseError?.id === d.id && (
                  <p role="alert" className="mt-2 text-xs text-[#DC2626]">
                    {accuseError.message}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
}

function Compte() {
  const { user } = useAuth();
  if (!user) return null;

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-6 sm:px-8 sm:py-8 space-y-6">
      
      {/* EN-TÊTE DE LA PAGE */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-[#EFE4D6]">
        <div>
          <h1 className="font-[family-name:var(--font-title)] text-2xl sm:text-3xl font-extrabold text-[#24140D]">
            Mon compte
          </h1>
          <p className="text-xs sm:text-sm text-[#6b5646] mt-0.5">
            Consultez et modifiez vos informations personnelles.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Link
            href="/incubateur/projets"
            className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-[#EFE4D6] bg-white px-4 text-xs font-bold text-[#612D10] hover:border-[#A35926] hover:bg-[#F2E5D5] hover:text-[#3F1D0A] hover:shadow-xs active:scale-[0.98] shadow-xs transition-all cursor-pointer"
          >
            <FolderOpen className="h-3.5 w-3.5 text-[#A35926]" aria-hidden="true" />
            <span>Suivi de mes projets</span>
          </Link>
          <Link
            href="/incubateur/alertes"
            className="p-2.5 rounded-xl border border-[#EFE4D6] bg-white text-[#612D10] hover:border-[#A35926] hover:bg-[#F2E5D5] hover:shadow-xs transition-all active:scale-[0.98] relative shadow-xs cursor-pointer"
            aria-label="Alertes"
            title="Consulter les alertes"
          >
            <Bell className="h-4 w-4" aria-hidden="true" />
            <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-[#A35926]" />
          </Link>
        </div>
      </div>

      {/* CONTENU PRINCIPAL */}
      <div className="space-y-6">
        {/* Profil & Sécurité */}
        <ProfilSection user={user} />

        {/* Projets et Dossiers pour le rôle Porteur */}
        {user.role === "porteur" && (
          <div className="rounded-2xl border border-[#EFE4D6] bg-white p-6 sm:p-7 shadow-sm space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-[#EFE4D6]">
              <div>
                <h3 className="font-[family-name:var(--font-title)] text-base sm:text-lg font-bold text-[#24140D]">
                  Mes projets et dossiers de candidature
                </h3>
                <p className="text-xs text-[#6b5646]">
                  Retrouvez l&apos;historique de vos candidatures et téléchargez vos justificatifs officiels.
                </p>
              </div>
            </div>
            <MesProjets />
          </div>
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
