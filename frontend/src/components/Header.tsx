"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { Button, ButtonLink } from "@/components/ui";

/**
 * Liens principaux institutionnels épurés (5 liens au lieu des 7 initiaux pour éviter la surcharge)
 * Typographie : Plus Jakarta Sans (titres/boutons) & Inter (textes/navigation)
 * Conforme à la Charte Graphique Officielle CIAT (v1.0) & Master.md
 */
const NAV_LINKS = [
  { href: "/", label: "Accueil" },
  { href: "/portail/ciat", label: "Le CIAT" },
  { href: "/portail/incubateur", label: "L'Incubateur" },
  { href: "/galerie", label: "Galerie" },
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
    <header className="sticky top-0 z-40 border-b border-[#EFE4D6] bg-white text-[#24140D] shadow-xs">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8 h-18">
        
        {/* Logo officiel foncé CIAT sur fond blanc */}
        <Link href="/" aria-label="CIAT Accueil" className="flex items-center gap-3">
          <Image
            src="/images/brand/logo_principal.png"
            alt="Logo officiel du CIAT — Centre d'Innovation, d'Application et de Transfert"
            width={140}
            height={51}
            priority
            className="h-10 w-auto object-contain"
          />
        </Link>

        {/* Navigation principale Desktop — Sobre, épurée, sans gadget */}
        <nav aria-label="Navigation principale" className="hidden items-center gap-7 md:flex">
          {NAV_LINKS.map((link) => {
            const active =
              link.href === "/"
                ? pathname === "/"
                : pathname.startsWith(link.href);

            return (
              <Link
                key={link.href}
                href={link.href}
                className={`font-[family-name:var(--font-title)] text-sm transition-colors py-1 ${
                  active
                    ? "font-bold text-[#612D10] border-b-2 border-[#C99A68] pb-1"
                    : "font-semibold text-[#24140D] hover:text-[#612D10]"
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        {/* Actions à droite : Compte connecté OU Bouton Connexion officiel */}
        <div className="flex items-center gap-3">
          {!loading && user ? (
            <div className="hidden items-center gap-3 md:flex">
              <Link
                href="/compte"
                className="group flex items-center gap-2 rounded-xl p-1.5 transition-colors hover:bg-[#FAF7F2] border border-[#EFE4D6]"
                title="Accéder à mon espace"
              >
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#FAF7F2] border border-[#EFE4D6] font-[family-name:var(--font-title)] text-xs font-bold text-[#612D10]">
                  {user.first_name ? user.first_name[0].toUpperCase() : user.email[0].toUpperCase()}
                </span>
                <div className="text-left">
                  <p className="font-[family-name:var(--font-title)] text-xs font-bold leading-tight text-[#24140D]">
                    {user.first_name ? `${user.first_name}` : user.email.split("@")[0]}
                  </p>
                  <span className="text-[10px] uppercase font-semibold text-[#C99A68]">
                    {ROLE_LABELS[user.role] ?? user.role}
                  </span>
                </div>
              </Link>
              <Button
                type="button"
                onClick={logout}
                variant="secondary"
                className="!min-h-[38px] !px-3.5 !py-1.5 text-xs"
              >
                Déconnexion
              </Button>
            </div>
          ) : (
            <div className="hidden md:flex items-center">
              <ButtonLink href="/connexion" variant="primary">
                Connexion
              </ButtonLink>
            </div>
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

      {/* Tiroir Mobile Déroulant (blanc, sobre, accessible) */}
      {mobileMenuOpen && (
        <div className="border-t border-[#EFE4D6] bg-white px-4 pb-6 pt-3 md:hidden shadow-md">
          <nav className="flex flex-col gap-1">
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
                  className={`flex min-h-[44px] items-center rounded-xl px-4 py-2 font-[family-name:var(--font-title)] text-sm font-semibold transition-colors ${
                    active
                      ? "bg-[#FAF7F2] text-[#612D10] font-bold border-l-4 border-[#C99A68]"
                      : "text-[#24140D] hover:bg-[#FAF7F2] hover:text-[#612D10]"
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
                    <p className="font-[family-name:var(--font-title)] text-sm font-bold text-[#24140D]">
                      {user.first_name || user.email}
                    </p>
                    <span className="text-xs text-[#C99A68] font-semibold">
                      Mon compte · {ROLE_LABELS[user.role] ?? user.role}
                    </span>
                  </Link>
                  <Button
                    type="button"
                    onClick={() => {
                      logout();
                      setMobileMenuOpen(false);
                    }}
                    variant="secondary"
                    className="!min-h-[38px] !px-3.5 !py-1.5 text-xs"
                  >
                    Déconnexion
                  </Button>
                </div>
              ) : (
                <ButtonLink
                  href="/connexion"
                  variant="primary"
                  className="w-full"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Connexion
                </ButtonLink>
              )}
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
