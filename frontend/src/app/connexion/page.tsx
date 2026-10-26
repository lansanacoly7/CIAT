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
  const [showForgotNotice, setShowForgotNotice] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (submitting) return;
    setError(null);

    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      setError("Veuillez renseigner votre adresse e-mail.");
      return;
    }
    if (!/^\S+@\S+\.\S+$/.test(trimmedEmail)) {
      setError("Veuillez saisir une adresse e-mail valide (ex. nom@domaine.com).");
      return;
    }
    if (!password) {
      setError("Veuillez renseigner votre mot de passe.");
      return;
    }

    setSubmitting(true);
    try {
      const me = await login(trimmedEmail, password);
      router.replace(target(me.role));
    } catch (err) {
      if (err instanceof ApiError && (err.status === 400 || err.status === 401)) {
        setError("Identifiants incorrects. Veuillez vérifier votre adresse e-mail et votre mot de passe.");
      } else if (err instanceof ApiError) {
        setError(apiErrorMessage(err.data) ?? "Une erreur est survenue lors de la connexion. Veuillez réessayer.");
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
          onChange={(e) => {
            setEmail(e.target.value);
            if (error) setError(null);
          }}
          placeholder="vous@exemple.com"
        />

        <div>
          <Field
            id="password"
            label="Mot de passe"
            type="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              if (error) setError(null);
            }}
          />

          {/* Emplacement réservé pour « Mot de passe oublié ? » */}
          <div className="mt-1.5 flex justify-end">
            <button
              type="button"
              onClick={() => setShowForgotNotice((prev) => !prev)}
              className="text-xs font-medium text-[#612D10] transition-colors hover:text-[#3F1D0A] hover:underline focus:outline-none focus-visible:ring-1 focus-visible:ring-[#612D10]"
            >
              Mot de passe oublié ?
            </button>
          </div>

          {/* Information transparente sur la réinitialisation (en attente d'endpoint backend) */}
          {showForgotNotice && (
            <div
              role="region"
              aria-label="Information mot de passe oublié"
              className="mt-2.5 rounded-lg border border-[#E3D7C9] bg-[#FAF7F2] p-3 text-xs text-[#26160b]"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="space-y-1">
                  <p className="font-semibold text-[#612D10]">Réinitialisation du compte</p>
                  <p className="text-[#6b5646]">
                    Le service de réinitialisation autonome en ligne est en cours de déploiement côté serveur.
                    Pour réinitialiser votre accès, veuillez vous adresser directement à la coordination du CIAT
                    ou écrire à <span className="font-mono text-[#612D10]">contact@ciat.sn</span>.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowForgotNotice(false)}
                  aria-label="Fermer l'information"
                  className="rounded p-0.5 text-[#6b5646] hover:bg-black/5 hover:text-[#26160b]"
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="pt-1">
          <SubmitButton loading={submitting} loadingLabel="Connexion en cours…">
            Se connecter
          </SubmitButton>
        </div>
      </form>

      <p className="mt-5 text-center text-xs text-[#6b5646] sm:text-sm">
        Pas encore de compte ?{" "}
        <Link href={inscriptionHref} className="font-semibold text-[#612D10] underline transition-colors hover:text-[#3F1D0A]">
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
