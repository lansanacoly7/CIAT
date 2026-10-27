"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { useAuth } from "@/context/AuthContext";

const NAV_LINKS = [
  { href: "/", label: "Accueil" },
  { href: "/portail/ciat", label: "Le CIAT" },
  { href: "/portail/incubateur", label: "L'Incubateur" },
  { href: "/incubateur/projets", label: "Suivi Projets" },
  { href: "/documents", label: "Documents IA" },
  { href: "/portail/domaines", label: "7 Domaines" },
  { href: "/portail/appels", label: "Appels à projets" },
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
  const isAppPage = pathname.startsWith("/incubateur") || pathname.startsWith("/compte") || pathname.startsWith("/documents");

  // Masquer totalement l'en-tête public du portail sur les écrans d'authentification et les espaces applicatifs avec Sidebar
  if (isAuthPage || isAppPage) {
    return null;
  }

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-[#3d2315] bg-brun-fonce text-white shadow-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          {/* Logo officiel blanc aligné sur la marque */}
          <Link href="/" aria-label="CIAT Accueil" className="flex items-center gap-3">
            <Image
              src="/images/brand/logo_blanc.png"
              alt="Logo CIAT - Centre d'Innovation, d'Application et de Transfert"
              width={130}
              height={47}
              priority
              className="h-9 w-auto object-contain md:h-11"
            />
          </Link>

          {/* Navigation principale Desktop */}
          <nav aria-label="Navigation principale" className="hidden items-center gap-6 md:flex">
            {NAV_LINKS.map((link) => {
              const active = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`text-sm font-medium transition-colors hover:text-white ${
                    active ? "font-bold text-white border-b-2 border-beige pb-0.5" : "text-[#ebd9c0]"
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>

          {/* Actions : Utilisateur connecté OU Bouton Connexion */}
          <div className="flex items-center gap-3">
            {!loading && user ? (
              <div className="hidden items-center gap-3 md:flex">
                {user.role === "coordonnateur" || user.role === "administrateur" ? (
                  <Link
                    href="/tableau-de-bord"
                    className="inline-flex items-center gap-1.5 rounded-lg bg-[#c99a69] px-3 py-1.5 text-xs font-bold text-[#21130d] hover:brightness-105 transition-all shadow-xs"
                  >
                    Tableau de bord →
                  </Link>
                ) : user.role === "porteur" ? (
                  <Link
                    href="/incubateur"
                    className="inline-flex items-center gap-1.5 rounded-lg bg-[#c99a69] px-3 py-1.5 text-xs font-bold text-[#21130d] hover:brightness-105 transition-all shadow-xs"
                  >
                    Mon Espace →
                  </Link>
                ) : null}
                <Link
                  href="/compte"
                  className="group flex items-center gap-2 rounded-lg p-1 transition-colors hover:bg-white/10"
                  title="Accéder à mon compte"
                >
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-beige text-xs font-bold text-brun-fonce transition-transform group-hover:scale-105">
                    {user.first_name ? user.first_name[0].toUpperCase() : user.email[0].toUpperCase()}
                  </span>
                  <div className="text-left">
                    <p className="text-xs font-semibold leading-tight text-white transition-colors group-hover:text-beige">
                      {user.first_name ? `${user.first_name} ${user.last_name || ""}`.trim() : user.email}
                    </p>
                    <span className="text-[10px] uppercase tracking-wide text-beige">
                      {ROLE_LABELS[user.role] ?? user.role}
                    </span>
                  </div>
                </Link>
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
                className="hidden rounded-lg bg-beige px-4 py-2 text-sm font-bold text-brun-fonce transition-all hover:brightness-105 active:scale-95 md:inline-flex"
              >
                Connexion
              </Link>
            )}

            {/* Bouton Menu Burger Mobile (Touch target >= 44x44px) */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg p-2 text-beige hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-beige md:hidden"
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

        {/* Tiroir Mobile Déroulant */}
        {mobileMenuOpen && (
          <div className="border-t border-[#3d2315] bg-brun-fonce px-4 pb-6 pt-3 md:hidden">
            <nav className="flex flex-col gap-2">
              {NAV_LINKS.map((link) => {
                const active = pathname === link.href;
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex min-h-[44px] items-center rounded-lg px-3 py-2 text-base font-medium transition-colors ${
                      active ? "bg-white/10 font-bold text-beige" : "text-[#ebd9c0] hover:bg-white/5 hover:text-white"
                    }`}
                  >
                    {link.label}
                  </Link>
                );
              })}
              <div className="mt-3 border-t border-white/10 pt-3">
                {!loading && user ? (
                  <div className="flex items-center justify-between">
                    <Link
                      href="/compte"
                      onClick={() => setMobileMenuOpen(false)}
                      className="group flex flex-col"
                    >
                      <p className="text-sm font-semibold text-white group-hover:text-beige transition-colors">
                        {user.first_name || user.email}
                      </p>
                      <span className="text-xs text-beige">
                        Mon compte · {ROLE_LABELS[user.role] ?? user.role}
                      </span>
                    </Link>
                    <button
                      type="button"
                      onClick={() => {
                        logout();
                        setMobileMenuOpen(false);
                      }}
                      className="rounded-lg border border-white/20 px-3 py-1.5 text-xs font-medium text-[#ebd9c0]"
                    >
                      Déconnexion
                    </button>
                  </div>
                ) : (
                  <Link
                    href="/connexion"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex min-h-[44px] w-full items-center justify-center rounded-lg bg-beige px-4 py-2 text-base font-bold text-brun-fonce hover:brightness-105"
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
        className="fixed bottom-0 left-0 right-0 z-50 flex h-16 items-center justify-around border-t border-bordure bg-white/95 px-2 backdrop-blur-md md:hidden shadow-[0_-2px_10px_rgba(0,0,0,0.06)]"
      >
        <Link
          href="/"
          className={`flex min-h-[44px] min-w-[44px] flex-col items-center justify-center text-xs font-semibold ${
            pathname === "/" ? "text-brun font-bold" : "text-texte-doux"
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
            pathname === "/portail/ciat" ? "text-brun font-bold" : "text-texte-doux"
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
            pathname === "/portail/incubateur" ? "text-brun font-bold" : "text-texte-doux"
          }`}
        >
          <svg className="h-5 w-5 mb-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
          Incubateur
        </Link>

        <Link
          href="/portail/domaines"
          className={`flex min-h-[44px] min-w-[44px] flex-col items-center justify-center text-xs font-semibold ${
            pathname === "/portail/domaines" ? "text-brun font-bold" : "text-texte-doux"
          }`}
        >
          <svg className="h-5 w-5 mb-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
          </svg>
          Domaines
        </Link>

        <Link
          href={user ? "/incubateur" : "/connexion"}
          className={`flex min-h-[44px] min-w-[44px] flex-col items-center justify-center text-xs font-semibold ${
            pathname === "/connexion" || pathname === "/incubateur" ? "text-brun font-bold" : "text-texte-doux"
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
