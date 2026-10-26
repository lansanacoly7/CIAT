"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { MODULES } from "@/lib/modules";

const ROLE_LABELS: Record<string, string> = {
  administrateur: "Admin",
  coordonnateur: "Coordo",
  mentor: "Mentor",
  membre_comite: "Comité",
  porteur: "Porteur",
  visiteur: "Visiteur",
};

export default function Header() {
  const { user, loading, logout } = useAuth();
  const pathname = usePathname();

  const isAuthPage = pathname === "/connexion" || pathname === "/inscription";

  if (isAuthPage) {
    return null;
  }

  return (
    <header className="bg-brun-fonce text-white">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-8 gap-y-3 px-4 py-3">
        <Link href="/" aria-label="CIAT, accueil" className="flex items-center">
          <Image src="/brand/logo_blanc.png" alt="CIAT" width={130} height={48} priority />
        </Link>

        <nav aria-label="Navigation principale" className="flex flex-wrap gap-x-5 gap-y-1 text-sm">
          {MODULES.map((m) => (
            <Link
              key={m.slug}
              href={m.href}
              className="text-[#ebd9c0] transition-colors hover:text-white"
            >
              {m.titre}
            </Link>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-3">
          {loading ? (
            <div className="h-9 w-24 animate-pulse rounded-lg bg-white/20" />
          ) : user ? (
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-beige text-xs font-bold text-texte">
                  {user.first_name ? user.first_name[0].toUpperCase() : user.email[0].toUpperCase()}
                </span>
                <div className="hidden text-left sm:block">
                  <p className="text-xs font-semibold leading-tight text-white">
                    {user.first_name ? `${user.first_name} ${user.last_name || ""}`.trim() : user.email}
                  </p>
                  <span className="text-[10px] uppercase tracking-wide text-beige">
                    {ROLE_LABELS[user.role] ?? user.role}
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={logout}
                className="rounded-lg border border-white/20 px-3 py-1.5 text-xs font-medium text-[#ebd9c0] transition-colors hover:border-white hover:text-white"
              >
                Déconnexion
              </button>
            </div>
          ) : (
            <Link
              href="/connexion"
              className="rounded-lg bg-beige px-4 py-2 font-[family-name:var(--font-title)] text-sm font-semibold text-texte transition-colors hover:bg-white"
            >
              Connexion
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
