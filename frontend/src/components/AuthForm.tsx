"use client";

import Image from "next/image";
import { useEffect, type InputHTMLAttributes, type ReactNode } from "react";
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

type FieldProps = InputHTMLAttributes<HTMLInputElement> & { label: string; error?: string };

export function Field({ label, error, id, ...props }: FieldProps) {
  return (
    <div>
      <label htmlFor={id} className="mb-1 block text-sm font-medium text-[#24140D]">
        {label}
        {props.required && <span className="text-[#DC2626]"> *</span>}
      </label>
      <input
        id={id}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? `${id}-error` : undefined}
        {...props}
        className={`min-h-11 w-full rounded-md border bg-white px-3 text-[#24140D] outline-none transition-colors placeholder:text-[#a08f80] focus:border-[#C99A68] focus:ring-2 focus:ring-[#C99A68]/40 ${
          error ? "border-[#DC2626]" : "border-[#EFE4D6]"
        }`}
      />
      {error && (
        <p id={`${id}-error`} className="mt-1 text-sm text-[#DC2626]">
          {error}
        </p>
      )}
    </div>
  );
}

export function FormError({ message }: { message: string | null }) {
  if (!message) return null;
  return (
    <div role="alert" className="rounded-md border border-[#DC2626]/40 bg-[#DC2626]/5 px-3 py-2 text-sm text-[#DC2626]">
      {message}
    </div>
  );
}

export function SubmitButton({ loading, children, loadingLabel }: { loading: boolean; children: ReactNode; loadingLabel: string }) {
  return (
    <button
      type="submit"
      disabled={loading}
      className="flex min-h-11 w-full items-center justify-center gap-2 rounded-md bg-[#612D10] px-4 font-[family-name:var(--font-title)] font-semibold text-white transition-colors hover:bg-[#3F1D0A] disabled:cursor-not-allowed disabled:opacity-70"
    >
      {loading && (
        <span
          aria-hidden
          className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white"
        />
      )}
      {loading ? loadingLabel : children}
    </button>
  );
}
