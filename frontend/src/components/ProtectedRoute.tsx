"use client";

import { useEffect, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth, type Role } from "@/context/AuthContext";
import { Button } from "@/components/ui";

interface ProtectedRouteProps {
  children: ReactNode;
  allowedRoles?: Role[];
}

export function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const { user, loading, isAuthenticated } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      const nextQuery = pathname ? `?next=${encodeURIComponent(pathname)}` : "";
      router.push(`/connexion${nextQuery}`);
    }
  }, [loading, isAuthenticated, router, pathname]);

  if (loading) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center gap-3">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-beige border-t-brun" />
        <p className="text-sm font-medium text-texte-doux">Vérification de vos accès...</p>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return null;
  }

  if (allowedRoles && allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-[#f6dedc] text-erreur">
          <svg
            className="h-7 w-7"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth="2"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"
            />
          </svg>
        </div>
        <h2 className="font-[family-name:var(--font-title)] text-2xl font-bold text-brun">
          Accès restreint
        </h2>
        <p className="mt-3 text-sm text-texte-doux">
          Cette page est réservée aux profils autorisés (
          {allowedRoles.map((r) => r.replace("_", " ")).join(", ")}). Votre rôle actuel est{" "}
          <strong className="text-brun">{user.role.replace("_", " ")}</strong>.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Link href="/">
            <Button variant="secondary">Retour à l&apos;accueil</Button>
          </Link>
          <Link href="/incubateur">
            <Button variant="primary">Mon espace incubateur</Button>
          </Link>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
