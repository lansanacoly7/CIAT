"use client";

import { Suspense, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { ApiError } from "@/lib/api";
import AuthSplitLayout from "@/components/AuthSplitLayout";
import {
  Field,
  FormError,
  SubmitButton,
  apiErrorMessage,
  useRedirectIfAuthenticated,
  useRedirectTarget,
} from "@/components/AuthForm";

function ConnexionForm() {
  const { login } = useAuth();
  const router = useRouter();
  const target = useRedirectTarget();
  const search = useSearchParams();
  useRedirectIfAuthenticated();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (submitting) return;
    setError(null);
    setSubmitting(true);
    try {
      const me = await login(email.trim(), password);
      router.replace(target(me.role));
    } catch (err) {
      if (err instanceof ApiError && (err.status === 400 || err.status === 401)) {
        setError("Identifiants incorrects. Veuillez vérifier votre adresse e-mail et votre mot de passe.");
      } else if (err instanceof ApiError) {
        setError(apiErrorMessage(err.data) ?? "Une erreur est survenue. Veuillez réessayer plus tard.");
      } else {
        setError("Impossible de joindre le serveur. Vérifiez votre connexion internet et réessayez.");
      }
      setSubmitting(false);
    }
  }

  const next = search.get("next");
  const inscriptionHref = next ? `/inscription?next=${encodeURIComponent(next)}` : "/inscription";

  return (
    <AuthSplitLayout title="Connexion" subtitle="Accédez à votre espace CIAT.">
      <form onSubmit={onSubmit} noValidate className="space-y-4">
        <FormError message={error} />
        <Field
          id="email"
          label="Adresse e-mail"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="vous@exemple.com"
        />
        <Field
          id="password"
          label="Mot de passe"
          type="password"
          autoComplete="current-password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <SubmitButton loading={submitting} loadingLabel="Connexion en cours…">
          Se connecter
        </SubmitButton>
      </form>
      <p className="mt-6 text-center text-sm text-[#6b5646]">
        Pas encore de compte ?{" "}
        <Link href={inscriptionHref} className="font-semibold text-[#612D10] underline hover:text-[#3F1D0A]">
          S&apos;inscrire
        </Link>
      </p>
    </AuthSplitLayout>
  );
}

export default function ConnexionPage() {
  return (
    <Suspense>
      <ConnexionForm />
    </Suspense>
  );
}
