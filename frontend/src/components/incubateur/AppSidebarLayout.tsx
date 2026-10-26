"use client";

import { useState, type ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth, type Role } from "@/context/AuthContext";

interface NavItem {
  href: string;
  label: string;
  exact?: boolean;
  icon: (props: { className?: string }) => ReactNode;
}

const ROLE_DISPLAY: Record<Role, string> = {
  porteur: "Porteur de projet",
  coordonnateur: "Coordonnateur",
  mentor: "Mentor",
  membre_comite: "Membre du comité",
  administrateur: "Administrateur",
  visiteur: "Visiteur",
};

/* Icônes SVG professionnelles et institutionnelles (aucun émoji) */
function IconDocument({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.5L19 7.5V19a2 2 0 01-2 2z" />
    </svg>
  );
}

function IconFolder({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
    </svg>
  );
}

function IconAlert({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
    </svg>
  );
}

function IconEvaluation({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" />
    </svg>
  );
}

function IconUser({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
    </svg>
  );
}

function IconFileText({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
    </svg>
  );
}

function IconLogout({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
    </svg>
  );
}

export function AppSidebarLayout({ children }: { children: ReactNode }) {
  const { user, logout } = useAuth();
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  const isCoordonnateur = user?.role === "coordonnateur" || user?.role === "administrateur";

  /* Liens spécifiques selon le rôle : Le porteur est 100% centré sur son parcours de candidature */
  const porteurLinks: NavItem[] = [
    { href: "/incubateur", label: "Dépôt de candidature", exact: true, icon: IconDocument },
    { href: "/incubateur/projets", label: "Suivi de mes projets", icon: IconFolder },
    { href: "/compte", label: "Mon profil & Compte", icon: IconUser },
  ];

  const coordoLinks: NavItem[] = [
    { href: "/incubateur", label: "Accueil Incubateur", exact: true, icon: IconFolder },
    { href: "/incubateur/projets", label: "Suivi des projets", icon: IconDocument },
    { href: "/incubateur/alertes", label: "Alertes de retard", icon: IconAlert },
    { href: "/incubateur/evaluation", label: "Évaluations comité", icon: IconEvaluation },
    { href: "/documents", label: "Générateur documents", icon: IconFileText },
    { href: "/compte", label: "Mon compte", icon: IconUser },
  ];

  const navLinks = isCoordonnateur ? coordoLinks : porteurLinks;

  return (
    <div className="min-h-screen bg-[#FAF7F2] lg:flex">
      {/* 1. SIDEBAR DESKTOP FIXE — Fond unifié et fluide (#1F130B), aucun découpage artificiel */}
      <aside className="hidden lg:flex lg:w-64 lg:flex-col lg:fixed lg:inset-y-0 lg:z-30 bg-[#1F130B] text-white shadow-xl">
        {/* En-tête Sidebar : Logo CIAT officiel vectoriel */}
        <div className="flex h-20 items-center justify-between px-6 pt-2">
          <Link href="/incubateur" className="flex items-center">
            <Image
              src="/images/brand/logo_blanc.png"
              alt="CIAT - Centre d'Innovation, d'Application et de Transfert"
              width={140}
              height={51}
              priority
              className="h-10 w-auto object-contain"
            />
          </Link>
        </div>

        {/* Navigation principale fluide */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-6">
          <div>
            <span className="px-3 text-[11px] font-bold tracking-wider text-[#A08F80] uppercase">
              {isCoordonnateur ? "Coordination Incubateur" : "Espace Candidat"}
            </span>
            <nav className="mt-3 space-y-1.5" aria-label="Menu applicatif">
              {navLinks.map((item) => {
                const active = item.exact ? pathname === item.href : pathname.startsWith(item.href);
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center gap-3 rounded-lg px-3.5 py-2.5 text-sm font-semibold transition-all ${
                      active
                        ? "bg-[#612D10] text-white shadow-sm border-l-4 border-[#C99A68]"
                        : "text-[#D6C4B0] hover:bg-white/5 hover:text-white"
                    }`}
                  >
                    <Icon className={`h-5 w-5 shrink-0 ${active ? "text-[#C99A68]" : "text-[#A08F80]"}`} />
                    <span className="truncate">{item.label}</span>
                  </Link>
                );
              })}
            </nav>
          </div>
        </div>

        {/* Pied de Sidebar unifié : Profil utilisateur & Vrai Bouton Quitter */}
        <div className="p-4 space-y-3">
          {user && (
            <div className="flex items-center gap-3 px-2">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#C99A68] text-sm font-bold text-[#1F130B]">
                {user.first_name ? user.first_name[0].toUpperCase() : user.email[0].toUpperCase()}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-bold text-white">
                  {user.first_name ? `${user.first_name} ${user.last_name || ""}`.trim() : user.email}
                </p>
                <p className="text-[11px] text-[#A08F80] truncate">
                  {ROLE_DISPLAY[user.role] ?? user.role}
                </p>
              </div>
            </div>
          )}

          {/* Vrai bouton Quitter avec bordure et survol rouge */}
          <button
            type="button"
            onClick={logout}
            className="flex w-full items-center justify-center gap-2 rounded-lg border border-white/20 bg-transparent px-3 py-2 text-xs font-semibold text-[#D6C4B0] transition-all duration-200 hover:border-[#DC2626] hover:bg-[#DC2626] hover:text-white"
          >
            <IconLogout className="h-4 w-4" />
            <span>Quitter</span>
          </button>
        </div>
      </aside>

      {/* 2. TOPBAR MOBILE (< 1024px) */}
      <div className="sticky top-0 z-40 flex h-16 w-full items-center justify-between bg-[#1F130B] px-4 text-white lg:hidden shadow-md">
        <Link href="/incubateur" className="flex items-center">
          <Image
            src="/images/brand/logo_blanc.png"
            alt="Logo CIAT"
            width={120}
            height={44}
            priority
            className="h-8 w-auto object-contain"
          />
        </Link>
        <button
          type="button"
          onClick={() => setMobileOpen(!mobileOpen)}
          className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg p-2 text-[#D6C4B0] hover:bg-white/10"
          aria-label={mobileOpen ? "Fermer le menu" : "Ouvrir le menu"}
        >
          <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            {mobileOpen ? (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            )}
          </svg>
        </button>
      </div>

      {/* 3. TIROIR MOBILE DÉROULANT */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 flex lg:hidden">
          <div className="fixed inset-0 bg-black/60 backdrop-blur-xs" onClick={() => setMobileOpen(false)} />
          <div className="relative flex w-4/5 max-w-xs flex-1 flex-col bg-[#1F130B] text-white p-5 space-y-6">
            <div className="flex items-center justify-between pb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-[#C99A68]">
                {isCoordonnateur ? "Coordination CIAT" : "Espace Candidat"}
              </span>
              <button
                type="button"
                onClick={() => setMobileOpen(false)}
                className="rounded-lg p-1 text-[#A08F80] hover:text-white"
                aria-label="Fermer"
              >
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <nav className="flex-1 space-y-2" aria-label="Menu mobile">
              {navLinks.map((item) => {
                const active = item.exact ? pathname === item.href : pathname.startsWith(item.href);
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileOpen(false)}
                    className={`flex min-h-[44px] items-center gap-3 rounded-lg px-4 py-2.5 text-sm font-semibold transition-colors ${
                      active ? "bg-[#612D10] text-white border-l-4 border-[#C99A68]" : "text-[#D6C4B0] hover:bg-white/5"
                    }`}
                  >
                    <Icon className="h-5 w-5 shrink-0 text-[#C99A68]" />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </nav>

            <div className="pt-4">
              <button
                type="button"
                onClick={() => {
                  setMobileOpen(false);
                  logout();
                }}
                className="flex w-full items-center justify-center gap-2 rounded-lg border border-white/20 bg-transparent px-3 py-2 text-xs font-semibold text-[#D6C4B0] hover:border-[#DC2626] hover:bg-[#DC2626] hover:text-white transition-all"
              >
                <IconLogout className="h-4 w-4" />
                <span>Quitter</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 4. CONTENU PRINCIPAL DÉCALÉ SUR DESKTOP (lg:pl-64) */}
      <div className="flex-1 lg:pl-64 flex flex-col min-h-screen">
        <main className="flex-1">
          {children}
        </main>
      </div>
    </div>
  );
}

export default AppSidebarLayout;
