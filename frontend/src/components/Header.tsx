"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { useAuth } from "@/context/AuthContext";

/**
 * Liens principaux épurés (5 liens essentiels pour éviter l'encombrement)
 */
const NAV_LINKS = [
  { href: "/", label: "Accueil" },
  { href: "/portail/ciat", label: "Le CIAT" },
  { href: "/portail/incubateur", label: "L'Incubateur" },
  { href: "/galerie", label: "Galerie des Projets" },
  { href: "/portail/contact", label: "Contact" },
];

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
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isAuthPage = pathname === "/connexion" || pathname === "/inscription";
  const isAppPage =
    pathname.startsWith("/incubateur") ||
    pathname.startsWith("/compte") ||
    pathname.startsWith("/documents");

  // Masquer l'en-tête public sur les pages d'authentification et les modules avec Sidebar
  if (isAuthPage || isAppPage) {
    return null;
  }

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-[#EFE4D6] bg-white/95 backdrop-blur-md text-[#24140D] shadow-[0_2px_12px_rgba(36,20,13,0.04)]">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8 py-3">
          
          {/* Logo officiel foncé CIAT sur fond blanc */}
          <Link href="/" aria-label="CIAT Accueil" className="flex items-center gap-3">
            <Image
              src="/images/brand/logo_principal.png"
              alt="Logo CIAT - Centre d'Innovation, d'Application et de Transfert"
              width={140}
              height={51}
              priority
              className="h-9 w-auto object-contain md:h-10"
            />
          </Link>

          {/* Navigation principale Desktop — Épurée, aérée et contrastée */}
          <nav aria-label="Navigation principale" className="hidden items-center gap-8 md:flex">
            {NAV_LINKS.map((link) => {
              const active =
                link.href === "/"
                  ? pathname === "/"
                  : pathname.startsWith(link.href);

              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`text-sm font-semibold transition-colors py-1 ${
                    active
                      ? "text-[#612D10] border-b-2 border-[#612D10] font-bold"
                      : "text-[#4A2E1B] hover:text-[#612D10]"
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>

          {/* Actions : Compte utilisateur OU Bouton Connexion */}
          <div className="flex items-center gap-3">
            {!loading && user ? (
              <div className="hidden items-center gap-3 md:flex">
                <Link
                  href="/compte"
                  className="group flex items-center gap-2 rounded-xl p-1.5 transition-colors hover:bg-[#FAF7F2] border border-transparent hover:border-[#EFE4D6]"
                  title="Accéder à mon compte"
                >
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#FAF7F2] border border-[#EFE4D6] text-xs font-bold text-[#612D10] transition-transform group-hover:scale-105">
                    {user.first_name ? user.first_name[0].toUpperCase() : user.email[0].toUpperCase()}
                  </span>
                  <div className="text-left">
                    <p className="text-xs font-bold leading-tight text-[#24140D] transition-colors group-hover:text-[#612D10]">
                      {user.first_name ? `${user.first_name} ${user.last_name || ""}`.trim() : user.email}
                    </p>
                    <span className="text-[10px] uppercase font-semibold text-[#C99A68]">
                      {ROLE_LABELS[user.role] ?? user.role}
                    </span>
                  </div>
                </Link>
                <button
                  type="button"
                  onClick={logout}
                  className="rounded-xl border border-[#EFE4D6] bg-white px-3 py-1.5 text-xs font-semibold text-[#6B5646] transition-colors hover:bg-[#FAF7F2] hover:text-[#24140D]"
                >
                  Déconnexion
                </button>
              </div>
            ) : (
              <Link
                href="/connexion"
                className="hidden rounded-xl bg-[#24140D] hover:bg-[#3D1D10] px-5 py-2 text-sm font-bold text-white shadow-xs transition-all hover:scale-[1.02] active:scale-[0.98] md:inline-flex items-center justify-center"
              >
                Connexion
              </Link>
            )}

            {/* Bouton Menu Burger Mobile */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-xl p-2 text-[#612D10] hover:bg-[#FAF7F2] border border-[#EFE4D6] md:hidden"
              aria-label={mobileMenuOpen ? "Fermer le menu" : "Ouvrir le menu"}
              aria-expanded={mobileMenuOpen}
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                {mobileMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>

        {/* Tiroir Mobile Déroulant (fond blanc net) */}
        {mobileMenuOpen && (
          <div className="border-t border-[#EFE4D6] bg-white px-4 pb-6 pt-3 md:hidden shadow-lg">
            <nav className="flex flex-col gap-1.5">
              {NAV_LINKS.map((link) => {
                const active =
                  link.href === "/"
                    ? pathname === "/"
                    : pathname.startsWith(link.href);

                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex min-h-[44px] items-center rounded-xl px-3.5 py-2 text-sm font-semibold transition-colors ${
                      active
                        ? "bg-[#FAF7F2] font-bold text-[#612D10] border-l-4 border-[#C99A68]"
                        : "text-[#4A2E1B] hover:bg-[#FAF7F2] hover:text-[#612D10]"
                    }`}
                  >
                    {link.label}
                  </Link>
                );
              })}
              <div className="mt-3 border-t border-[#EFE4D6] pt-3">
                {!loading && user ? (
                  <div className="flex items-center justify-between">
                    <Link
                      href="/compte"
                      onClick={() => setMobileMenuOpen(false)}
                      className="group flex flex-col"
                    >
                      <p className="text-sm font-bold text-[#24140D] group-hover:text-[#612D10] transition-colors">
                        {user.first_name || user.email}
                      </p>
                      <span className="text-xs text-[#C99A68] font-semibold">
                        Mon compte · {ROLE_LABELS[user.role] ?? user.role}
                      </span>
                    </Link>
                    <button
                      type="button"
                      onClick={() => {
                        logout();
                        setMobileMenuOpen(false);
                      }}
                      className="rounded-xl border border-[#EFE4D6] bg-[#FAF7F2] px-3.5 py-1.5 text-xs font-semibold text-[#6B5646]"
                    >
                      Déconnexion
                    </button>
                  </div>
                ) : (
                  <Link
                    href="/connexion"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex min-h-[44px] w-full items-center justify-center rounded-xl bg-[#24140D] px-4 py-2 text-sm font-bold text-white hover:bg-[#3D1D10]"
                  >
                    Espace Connexion
                  </Link>
                )}
              </div>
            </nav>
          </div>
        )}
      </header>

      {/* Barre de Navigation Tactile Inférieure sur Mobile */}
      <nav
        aria-label="Navigation mobile inférieure"
        className="fixed bottom-0 left-0 right-0 z-50 flex h-16 items-center justify-around border-t border-[#EFE4D6] bg-white/95 px-2 backdrop-blur-md md:hidden shadow-[0_-2px_10px_rgba(0,0,0,0.06)]"
      >
        <Link
          href="/"
          className={`flex min-h-[44px] min-w-[44px] flex-col items-center justify-center text-xs font-semibold ${
            pathname === "/" ? "text-[#612D10] font-bold" : "text-[#6B5646]"
          }`}
        >
          <svg className="h-5 w-5 mb-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
          </svg>
          Accueil
        </Link>

        <Link
          href="/portail/ciat"
          className={`flex min-h-[44px] min-w-[44px] flex-col items-center justify-center text-xs font-semibold ${
            pathname === "/portail/ciat" ? "text-[#612D10] font-bold" : "text-[#6B5646]"
          }`}
        >
          <svg className="h-5 w-5 mb-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
          </svg>
          Le CIAT
        </Link>

        <Link
          href="/portail/incubateur"
          className={`flex min-h-[44px] min-w-[44px] flex-col items-center justify-center text-xs font-semibold ${
            pathname === "/portail/incubateur" ? "text-[#612D10] font-bold" : "text-[#6B5646]"
          }`}
        >
          <svg className="h-5 w-5 mb-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
          Incubateur
        </Link>

        <Link
          href="/galerie"
          className={`flex min-h-[44px] min-w-[44px] flex-col items-center justify-center text-xs font-semibold ${
            pathname === "/galerie" ? "text-[#612D10] font-bold" : "text-[#6B5646]"
          }`}
        >
          <svg className="h-5 w-5 mb-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          Galerie
        </Link>

        <Link
          href={user ? "/incubateur" : "/connexion"}
          className={`flex min-h-[44px] min-w-[44px] flex-col items-center justify-center text-xs font-semibold ${
            pathname === "/connexion" || pathname === "/incubateur" ? "text-[#612D10] font-bold" : "text-[#6B5646]"
          }`}
        >
          <svg className="h-5 w-5 mb-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
          {user ? "Espace" : "Compte"}
        </Link>
      </nav>
    </>
  );
}
