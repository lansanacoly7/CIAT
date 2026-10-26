"use client";

import Image from "next/image";
import { useEffect, useState, type InputHTMLAttributes, type ReactNode } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth, type Role } from "@/context/AuthContext";

const ROLE_HOME: Partial<Record<Role, string>> = {
  porteur: "/incubateur",
  coordonnateur: "/tableau-de-bord",
  administrateur: "/tableau-de-bord",
  membre_comite: "/incubateur",
};

/** Cible de redirection : `?next=` (chemin interne uniquement) sinon page d'accueil du rôle. */
export function useRedirectTarget() {
  const params = useSearchParams();
  const next = params.get("next");
  const safeNext = next && next.startsWith("/") && !next.startsWith("//") ? next : null;
  return (role?: Role) => safeNext ?? (role && ROLE_HOME[role]) ?? "/incubateur";
}

/** Redirige un utilisateur déjà connecté hors des pages d'authentification. */
export function useRedirectIfAuthenticated() {
  const { user, isAuthenticated, loading } = useAuth();
  const router = useRouter();
  const target = useRedirectTarget();
  useEffect(() => {
    if (!loading && isAuthenticated) router.replace(target(user?.role));
  }, [loading, isAuthenticated, user, router, target]);
}

/** Extrait un message lisible d'une réponse d'erreur DRF (`detail` ou erreurs par champ). */
export function apiErrorMessage(data: unknown): string | null {
  if (!data || typeof data !== "object") return null;
  const d = data as Record<string, unknown>;
  if (typeof d.detail === "string") return d.detail;
  const parts = Object.values(d).flatMap((v) =>
    Array.isArray(v) ? v.filter((x): x is string => typeof x === "string") : typeof v === "string" ? [v] : [],
  );
  return parts.length ? parts.join(" ") : null;
}

export function AuthCard({ title, subtitle, children }: { title: string; subtitle: string; children: ReactNode }) {
  return (
    <div className="mx-auto flex w-full max-w-lg px-4 py-10 sm:py-14">
      <div className="w-full rounded-lg border border-[#EFE4D6] bg-[#FAF7F2] p-6 shadow-sm sm:p-8">
        <Image
          src="/brand/logo_principal.png"
          alt="CIAT — ISEP Diamniadio"
          width={180}
          height={70}
          priority
          className="mx-auto mb-6 h-14 w-auto object-contain"
        />
        <h1 className="text-center text-2xl font-bold text-[#612D10]">{title}</h1>
        <p className="mb-6 mt-1 text-center text-sm text-[#6b5646]">{subtitle}</p>
        {children}
      </div>
    </div>
  );
}

type FieldProps = InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  error?: string;
  hint?: string;
  optionalLabel?: boolean;
};

export function Field({
  label,
  error,
  hint,
  optionalLabel,
  id,
  type,
  required,
  ...props
}: FieldProps) {
  const [showPassword, setShowPassword] = useState(false);
  const isPassword = type === "password";
  const inputType = isPassword ? (showPassword ? "text" : "password") : type;

  const describedBy = [
    error ? `${id}-error` : undefined,
    hint ? `${id}-hint` : undefined,
  ].filter(Boolean).join(" ") || undefined;

  return (
    <div className="w-full">
      <div className="mb-1.5 flex items-center justify-between">
        <label htmlFor={id} className="block text-xs font-semibold tracking-wide text-[#26160b]">
          {label}
          {required ? (
            <span className="text-[#b3261e]" aria-label="obligatoire"> *</span>
          ) : (
            optionalLabel && <span className="ml-1 text-[11px] font-normal text-[#6b5646]">(facultatif)</span>
          )}
        </label>
      </div>
      <div className="relative">
        <input
          id={id}
          type={inputType}
          required={required}
          aria-invalid={Boolean(error)}
          aria-describedby={describedBy}
          {...props}
          className={`min-h-[44px] w-full rounded-md border bg-white px-3.5 text-sm text-[#26160b] outline-none transition-colors placeholder:text-[#9c897a] focus:border-[#612D10] focus:ring-2 focus:ring-[#612D10]/20 ${
            error ? "border-[#b3261e] focus:border-[#b3261e] focus:ring-[#b3261e]/20" : "border-[#E3D7C9]"
          } ${isPassword ? "pr-11" : ""}`}
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            aria-label={showPassword ? "Masquer le mot de passe" : "Afficher le mot de passe"}
            className="absolute right-0 top-0 flex h-[44px] w-11 items-center justify-center text-[#6b5646] transition-colors hover:text-[#26160b] focus:outline-none focus-visible:text-[#612D10]"
          >
            {showPassword ? (
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth="1.8" stroke="currentColor" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
              </svg>
            ) : (
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth="1.8" stroke="currentColor" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            )}
          </button>
        )}
      </div>
      {hint && !error && (
        <p id={`${id}-hint`} className="mt-1 text-[11px] text-[#6b5646]">
          {hint}
        </p>
      )}
      {error && (
        <p id={`${id}-error`} className="mt-1 flex items-center gap-1 text-xs font-medium text-[#b3261e]">
          <svg className="h-3.5 w-3.5 shrink-0" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          <span>{error}</span>
        </p>
      )}
    </div>
  );
}

export function FormError({ message }: { message: string | null }) {
  if (!message) return null;
  return (
    <div
      role="alert"
      className="flex items-start gap-2.5 rounded-lg border border-[#b3261e]/30 bg-[#b3261e]/5 p-3 text-xs leading-relaxed text-[#b3261e]"
    >
      <svg className="mt-0.5 h-4 w-4 shrink-0 text-[#b3261e]" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
      </svg>
      <span>{message}</span>
    </div>
  );
}

export function SubmitButton({
  loading,
  children,
  loadingLabel,
}: {
  loading: boolean;
  children: ReactNode;
  loadingLabel: string;
}) {
  return (
    <button
      type="submit"
      disabled={loading}
      className="flex min-h-[44px] w-full items-center justify-center gap-2 rounded-md bg-[#612D10] px-4 font-[family-name:var(--font-title)] text-sm font-semibold text-white shadow-xs transition-colors hover:bg-[#3F1D0A] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#612D10] disabled:cursor-not-allowed disabled:opacity-70"
    >
      {loading && (
        <span
          aria-hidden="true"
          className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white"
        />
      )}
      {loading ? loadingLabel : children}
    </button>
  );
}
