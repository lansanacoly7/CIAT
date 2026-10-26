"use client";

import { Suspense, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { ApiError } from "@/lib/api";
import {
  AuthCard,
  Field,
  FormError,
  SubmitButton,
  apiErrorMessage,
  useRedirectIfAuthenticated,
  useRedirectTarget,
} from "@/components/AuthForm";

const FIELD_LABELS: Record<string, string> = {
  email: "email",
  password: "password",
  first_name: "first_name",
  last_name: "last_name",
  telephone: "telephone",
  organisation: "organisation",
};

type FieldErrors = Partial<Record<keyof typeof FIELD_LABELS, string>>;

function InscriptionForm() {
  const { register } = useAuth();
  const router = useRouter();
  const target = useRedirectTarget();
  const search = useSearchParams();
  useRedirectIfAuthenticated();

  const [form, setForm] = useState({
    first_name: "",
    last_name: "",
    email: "",
    telephone: "",
    organisation: "",
    password: "",
    confirm: "",
  });
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [confirmError, setConfirmError] = useState<string>();
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const set = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [key]: e.target.value }));

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (submitting) return;
    setError(null);
    setFieldErrors({});
    setConfirmError(undefined);

    const local: FieldErrors = {};
    if (!form.first_name.trim()) local.first_name = "Le prénom est obligatoire.";
    if (!form.last_name.trim()) local.last_name = "Le nom est obligatoire.";
    if (!/^\S+@\S+\.\S+$/.test(form.email.trim())) local.email = "Saisissez une adresse e-mail valide.";
    if (form.password.length < 8) local.password = "Le mot de passe doit contenir au moins 8 caractères.";
    const mismatch = form.password !== form.confirm;
    if (Object.keys(local).length || mismatch) {
      setFieldErrors(local);
      if (mismatch) setConfirmError("Les mots de passe ne correspondent pas.");
      return;
    }

    setSubmitting(true);
    try {
      const me = await register({
        email: form.email.trim(),
        password: form.password,
        first_name: form.first_name.trim(),
        last_name: form.last_name.trim(),
        telephone: form.telephone.trim() || undefined,
        organisation: form.organisation.trim() || undefined,
      });
      router.replace(target(me.role));
    } catch (err) {
      if (err instanceof ApiError && err.status === 400 && err.data && typeof err.data === "object") {
        const data = err.data as Record<string, unknown>;
        const fe: FieldErrors = {};
        for (const key of Object.keys(FIELD_LABELS)) {
          const v = data[key];
          const msg = Array.isArray(v) ? v.join(" ") : typeof v === "string" ? v : undefined;
          if (msg) fe[key] = key === "email" && /exist|already|déjà/i.test(msg)
            ? "Un compte existe déjà avec cette adresse e-mail."
            : msg;
        }
        if (Object.keys(fe).length) setFieldErrors(fe);
        else setError(apiErrorMessage(data) ?? "Les informations saisies sont invalides.");
      } else if (err instanceof ApiError) {
        setError(apiErrorMessage(err.data) ?? "Une erreur est survenue. Veuillez réessayer plus tard.");
      } else {
        setError("Impossible de joindre le serveur. Vérifiez votre connexion internet et réessayez.");
      }
      setSubmitting(false);
    }
  }

  const next = search.get("next");
  const connexionHref = next ? `/connexion?next=${encodeURIComponent(next)}` : "/connexion";

  return (
    <AuthCard title="Créer un compte" subtitle="Rejoignez le CIAT en tant que porteur de projet.">
      <form onSubmit={onSubmit} noValidate className="space-y-4">
        <FormError message={error} />
        <div className="grid gap-4 sm:grid-cols-2">
          <Field id="first_name" label="Prénom" autoComplete="given-name" required value={form.first_name} onChange={set("first_name")} error={fieldErrors.first_name} />
          <Field id="last_name" label="Nom" autoComplete="family-name" required value={form.last_name} onChange={set("last_name")} error={fieldErrors.last_name} />
        </div>
        <Field id="email" label="Adresse e-mail" type="email" autoComplete="email" required value={form.email} onChange={set("email")} error={fieldErrors.email} placeholder="vous@exemple.com" />
        <div className="grid gap-4 sm:grid-cols-2">
          <Field id="telephone" label="Téléphone" type="tel" autoComplete="tel" value={form.telephone} onChange={set("telephone")} error={fieldErrors.telephone} placeholder="+221 77 000 00 00" />
          <Field id="organisation" label="Organisation" autoComplete="organization" value={form.organisation} onChange={set("organisation")} error={fieldErrors.organisation} />
        </div>
        <Field id="password" label="Mot de passe" type="password" autoComplete="new-password" required minLength={8} value={form.password} onChange={set("password")} error={fieldErrors.password} />
        <Field id="confirm" label="Confirmer le mot de passe" type="password" autoComplete="new-password" required value={form.confirm} onChange={set("confirm")} error={confirmError} />
        <SubmitButton loading={submitting} loadingLabel="Création du compte…">
          Créer mon compte
        </SubmitButton>
      </form>
      <p className="mt-6 text-center text-sm text-[#6b5646]">
        Déjà un compte ?{" "}
        <Link href={connexionHref} className="font-semibold text-[#612D10] underline hover:text-[#3F1D0A]">
          Se connecter
        </Link>
      </p>
    </AuthCard>
  );
}

export default function InscriptionPage() {
  return (
    <Suspense>
      <InscriptionForm />
    </Suspense>
  );
}
