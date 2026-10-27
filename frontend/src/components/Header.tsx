"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/context/AuthContext";

/**
 * Liens de navigation épurés et essentiels
 */
const NAV_LINKS = [
  { href: "/", label: "Accueil" },
  { href: "/portail/ciat", label: "Le CIAT" },
  { href: "/portail/incubateur", label: "L'Incubateur" },
  { href: "/galerie", label: "Galerie" },
  { href: "/portail/contact", label: "Contact" },
];

const QUICK_SEARCH_ITEMS = [
  { titre: "Incubateur & Candidature 2026", href: "/portail/incubateur", categorie: "Incubation" },
  { titre: "Les 7 Filières Technologiques", href: "/portail/domaines", categorie: "Filières" },
  { titre: "Galerie des Prototypes & Innovations", href: "/galerie", categorie: "Showroom" },
  { titre: "Assistant IA Souverain du CIAT", href: "/assistant", categorie: "Outils IA" },
  { titre: "Appels à Projets Technologiques", href: "/portail/appels", categorie: "Sélection" },
  { titre: "Espace Documentaire & Canevas", href: "/portail/documents", categorie: "Ressources" },
  { titre: "Tableau de Bord Décisionnel", href: "/tableau-de-bord", categorie: "Pilotage" },
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
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const searchInputRef = useRef<HTMLInputElement>(null);

  const isAuthPage = pathname === "/connexion" || pathname === "/inscription";
  const isAppPage =
    pathname.startsWith("/incubateur") ||
    pathname.startsWith("/compte") ||
    pathname.startsWith("/documents");

  // Raccourci clavier Cmd/Ctrl + K pour ouvrir la recherche rapide
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setSearchOpen((prev) => !prev);
      } else if (e.key === "Escape") {
        setSearchOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  useEffect(() => {
    if (searchOpen) {
      setTimeout(() => searchInputRef.current?.focus(), 50);
    } else {
      setSearchQuery("");
    }
  }, [searchOpen]);

  // Masquer l'en-tête public sur les pages d'authentification et les modules avec Sidebar
  if (isAuthPage || isAppPage) {
    return null;
  }

  const filteredItems = searchQuery.trim()
    ? QUICK_SEARCH_ITEMS.filter((item) =>
        item.titre.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.categorie.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : QUICK_SEARCH_ITEMS;

  return (
    <>
      {/* Liseré supérieur aux teintes CIAT pour une finition prestige */}
      <div className="h-0.5 w-full bg-gradient-to-r from-[#612D10] via-[#C99A68] to-[#612D10]" />

      <header className="sticky top-0 z-40 border-b border-[#EFE4D6] bg-white/95 backdrop-blur-xl text-[#24140D] shadow-[0_4px_20px_-4px_rgba(36,20,13,0.05)] transition-all">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8 py-3">
          
          {/* Logo officiel foncé CIAT + Ancrage ISEP Diamniadio */}
          <Link href="/" aria-label="CIAT Accueil" className="flex items-center gap-3.5 group">
            <Image
              src="/images/brand/logo_principal.png"
              alt="Logo CIAT - Centre d'Innovation, d'Application et de Transfert"
              width={140}
              height={51}
              priority
              className="h-9 md:h-10 w-auto object-contain transition-transform duration-200 group-hover:scale-[1.02]"
            />
            <div className="hidden xl:flex flex-col border-l border-[#EFE4D6] pl-3 py-0.5">
              <span className="text-[10px] font-bold tracking-[0.14em] uppercase text-[#612D10] leading-none">
                ISEP-AT Diamniadio
              </span>
              <span className="text-[9px] text-[#8C7664] font-medium leading-tight mt-0.5">
                Cité du Savoir
              </span>
            </div>
          </Link>

          {/* Navigation principale Desktop — Navigation en pilule flottante moderne */}
          <nav
            aria-label="Navigation principale"
            className="hidden md:flex items-center gap-1 p-1 rounded-full bg-[#FAF7F2] border border-[#EFE4D6]/80 shadow-2xs"
          >
            {NAV_LINKS.map((link) => {
              const active =
                link.href === "/"
                  ? pathname === "/"
                  : pathname.startsWith(link.href);

              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all duration-200 ${
                    active
                      ? "bg-[#612D10] text-white shadow-xs font-bold"
                      : "text-[#4A2E1B] hover:text-[#612D10] hover:bg-white"
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>

          {/* Zone Droite : Recherche Rapide & Accès Membre */}
          <div className="flex items-center gap-3">
            
            {/* Bouton Recherche Rapide stylisé (comme la maquette ISEP) */}
            <button
              type="button"
              onClick={() => setSearchOpen(true)}
              className="hidden lg:flex items-center gap-2.5 rounded-full border border-[#EFE4D6] bg-[#FAF7F2]/60 hover:bg-white px-3.5 py-1.5 text-xs text-[#8C7664] hover:text-[#612D10] hover:border-[#C99A68] transition-all cursor-pointer shadow-2xs group"
              title="Recherche rapide (Ctrl + K)"
            >
              <svg className="h-3.5 w-3.5 text-[#C99A68] group-hover:scale-110 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <span>Rechercher...</span>
              <kbd className="rounded bg-white border border-[#EFE4D6] px-1.5 py-0.5 text-[10px] font-mono font-bold text-[#8C7664]">
                ⌘K
              </kbd>
            </button>

            {/* Actions : Compte utilisateur OU Bouton Connexion */}
            {!loading && user ? (
              <div className="hidden items-center gap-2.5 md:flex">
                <Link
                  href="/compte"
                  className="group flex items-center gap-2 rounded-full py-1 px-2.5 transition-colors hover:bg-[#FAF7F2] border border-transparent hover:border-[#EFE4D6]"
                  title="Accéder à mon espace"
                >
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#612D10] text-[11px] font-bold text-white shadow-xs">
                    {user.first_name ? user.first_name[0].toUpperCase() : user.email[0].toUpperCase()}
                  </span>
                  <div className="text-left">
                    <p className="text-xs font-bold leading-tight text-[#24140D]">
                      {user.first_name ? `${user.first_name}` : user.email.split("@")[0]}
                    </p>
                    <span className="text-[9px] uppercase font-semibold text-[#C99A68]">
                      {ROLE_LABELS[user.role] ?? user.role}
                    </span>
                  </div>
                </Link>
                <button
                  type="button"
                  onClick={logout}
                  className="rounded-full border border-[#EFE4D6] bg-white px-3 py-1.5 text-xs font-semibold text-[#6B5646] hover:bg-[#FAF7F2] hover:text-[#24140D] transition-colors"
                >
                  Quitter
                </button>
              </div>
            ) : (
              <Link
                href="/connexion"
                className="hidden rounded-full bg-[#24140D] hover:bg-[#3D1D10] px-5 py-2 text-xs font-bold text-white shadow-xs transition-all hover:scale-[1.03] active:scale-[0.98] md:inline-flex items-center gap-1.5"
              >
                <span>Espace Membre</span>
                <span className="text-[#C99A68]">→</span>
              </Link>
            )}

            {/* Bouton Recherche Mobile */}
            <button
              type="button"
              onClick={() => setSearchOpen(true)}
              className="inline-flex min-h-[40px] min-w-[40px] items-center justify-center rounded-full p-2 text-[#612D10] hover:bg-[#FAF7F2] border border-[#EFE4D6] lg:hidden"
              aria-label="Ouvrir la recherche"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </button>

            {/* Bouton Menu Burger Mobile */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="inline-flex min-h-[40px] min-w-[40px] items-center justify-center rounded-full p-2 text-[#612D10] hover:bg-[#FAF7F2] border border-[#EFE4D6] md:hidden"
              aria-label={mobileMenuOpen ? "Fermer le menu" : "Ouvrir le menu"}
              aria-expanded={mobileMenuOpen}
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                {mobileMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>

        {/* Tiroir Mobile Déroulant (blanc, aéré) */}
        {mobileMenuOpen && (
          <div className="border-t border-[#EFE4D6] bg-white px-4 pb-6 pt-3 md:hidden shadow-lg animate-fade-in-up">
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
                    className={`flex min-h-[44px] items-center rounded-xl px-4 py-2 text-sm font-semibold transition-colors ${
                      active
                        ? "bg-[#612D10] text-white font-bold shadow-xs"
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
                      className="rounded-full border border-[#EFE4D6] bg-[#FAF7F2] px-3.5 py-1.5 text-xs font-semibold text-[#6B5646]"
                    >
                      Déconnexion
                    </button>
                  </div>
                ) : (
                  <Link
                    href="/connexion"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex min-h-[44px] w-full items-center justify-center rounded-full bg-[#24140D] px-4 py-2 text-sm font-bold text-white hover:bg-[#3D1D10]"
                  >
                    Espace Membre &amp; Connexion
                  </Link>
                )}
              </div>
            </nav>
          </div>
        )}
      </header>

      {/* Modale de Recherche Rapide Interactive (⌘K) */}
      {searchOpen && (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center bg-black/50 p-4 pt-20 backdrop-blur-sm"
          onClick={() => setSearchOpen(false)}
        >
          <div
            className="w-full max-w-xl rounded-2xl border border-[#EFE4D6] bg-white shadow-2xl overflow-hidden animate-fade-in-up"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Champ de saisie */}
            <div className="flex items-center gap-3 border-b border-[#EFE4D6] px-4 py-3.5 bg-[#FAF7F2]/60">
              <svg className="h-5 w-5 text-[#C99A68]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Rechercher un service, une filière, un projet..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-transparent text-sm text-[#24140D] placeholder:text-[#8C7664] focus:outline-none font-medium"
              />
              <kbd className="rounded bg-white border border-[#EFE4D6] px-1.5 py-0.5 text-[10px] font-mono text-[#8C7664]">
                ESC
              </kbd>
            </div>

            {/* Résultats ou suggestions */}
            <div className="max-h-80 overflow-y-auto p-2 divide-y divide-[#EFE4D6]/50">
              {filteredItems.length > 0 ? (
                filteredItems.map((item, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      setSearchOpen(false);
                      router.push(item.href);
                    }}
                    className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-[#FAF7F2] transition-colors text-left group cursor-pointer"
                  >
                    <div>
                      <p className="text-sm font-semibold text-[#24140D] group-hover:text-[#612D10]">
                        {item.titre}
                      </p>
                      <span className="text-[10px] uppercase font-bold text-[#C99A68]">
                        {item.categorie}
                      </span>
                    </div>
                    <span className="text-xs text-[#8C7664] group-hover:translate-x-1 transition-transform">
                      →
                    </span>
                  </button>
                ))
              ) : (
                <div className="p-6 text-center text-xs text-[#8C7664]">
                  Aucun résultat pour « {searchQuery} ». Essayez « Incubateur », « Filières » ou « IA ».
                </div>
              )}
            </div>

            <div className="border-t border-[#EFE4D6] bg-[#FAF7F2] px-4 py-2 text-[11px] text-[#8C7664] flex items-center justify-between">
              <span>Navigation au clavier</span>
              <span>CIAT · ISEP Diamniadio</span>
            </div>
          </div>
        </div>
      )}

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
