"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Menu,
  X,
  Home,
  BookOpen,
  Rocket,
  FileText,
  Globe,
  MessageSquare,
  Layers,
  User,
  Calendar,
  ChevronRight,
  LogOut,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";

// Les modules de gestion CIAT (pour coordonnateurs, administrateurs et membres de comité)
const STAFF_ITEMS = [
  {
    slug: "incubateur",
    href: "/incubateur",
    titre: "Gestion de l'incubateur",
    icon: Rocket,
  },
  {
    slug: "calendrier",
    href: "/incubateur/calendrier",
    titre: "Calendrier incubateur",
    icon: Calendar,
  },
  {
    slug: "documents",
    href: "/documents",
    titre: "Générateur de documents",
    icon: FileText,
  },
  {
    slug: "portail",
    href: "/portail",
    titre: "Portail du CIAT",
    icon: Globe,
  },
  {
    slug: "assistant",
    href: "/assistant",
    titre: "Assistant IA",
    icon: MessageSquare,
  },
  {
    slug: "galerie",
    href: "/galerie",
    titre: "Galerie des innovations",
    icon: Layers,
  },
  {
    slug: "compte",
    href: "/compte",
    titre: "Mon compte",
    icon: User,
  },
];

// Les modules applicatifs pour les porteurs de projet (candidats)
const PORTEUR_ITEMS = [
  {
    slug: "candidature",
    href: "/incubateur",
    titre: "Dépôt de candidature",
    icon: Rocket,
  },
  {
    slug: "projets",
    href: "/incubateur/projets",
    titre: "Suivi de mes projets",
    icon: Layers,
  },
  {
    slug: "calendrier",
    href: "/incubateur/calendrier",
    titre: "Calendrier",
    icon: Calendar,
  },
  {
    slug: "assistant",
    href: "/assistant",
    titre: "Assistant IA",
    icon: MessageSquare,
  },
  {
    slug: "compte",
    href: "/compte",
    titre: "Mon profil & Compte",
    icon: User,
  },
];

export function DashboardSidebar() {
  const { user, logout } = useAuth();
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const pathname = usePathname();

  const isPorteur = user?.role === "porteur";
  const navItems = isPorteur ? PORTEUR_ITEMS : STAFF_ITEMS;

  // Gestion de la touche Échap pour le menu mobile
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsMobileOpen(false);
      }
    };

    if (isMobileOpen) {
      document.body.style.overflow = "hidden";
      window.addEventListener("keydown", handleKeyDown);
    } else {
      document.body.style.overflow = "";
    }

    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isMobileOpen]);

  const closeMobile = () => setIsMobileOpen(false);

  // Libellé et rôle dynamiques
  const roleLabel =
    user?.role === "administrateur"
      ? "Administrateur"
      : user?.role === "coordonnateur"
      ? "Coordonnateur CIAT"
      : user?.role === "membre_comite"
      ? "Comité de Sélection"
      : user?.role === "mentor"
      ? "Mentor"
      : user?.role === "porteur"
      ? "Porteur de projet"
      : "Équipe CIAT";

  const userDisplayName = user
    ? user.first_name
      ? `${user.first_name} ${user.last_name || ""}`.trim()
      : user.email.split("@")[0]
    : "Administrateur";

  const userInitial = user?.first_name
    ? user.first_name[0].toUpperCase()
    : user?.email
    ? user.email[0].toUpperCase()
    : "A";

  // Contenu exact de la Sidebar (Desktop fixe & Mobile Drawer)
  const renderSidebarContent = (onItemClick?: () => void) => {
    const isMethodologieActive = pathname === "/tableau-de-bord/methodologie";
    const isDashboardActive = pathname === "/tableau-de-bord";
    const isHomeActive = pathname === "/";

    return (
      <div className="relative z-10 flex h-full flex-col justify-between overflow-y-auto">
        <div>
          {/* 1. Logo CIAT officiel en haut */}
          <div className="px-5 pb-5 pt-6">
            <Link
              href="/"
              onClick={onItemClick}
              className="inline-block focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#c99a69]"
              aria-label="CIAT Accueil"
            >
              <Image
                src="/images/brand/logo_blanc.png"
                alt="CIAT"
                width={130}
                height={46}
                priority
                className="h-9 w-auto object-contain"
              />
            </Link>
          </div>

          {/* 2. Boutons principaux : Tableau de bord & Méthodologie (réservés au staff) */}
          {!isPorteur && (
            <div className="px-3 space-y-1">
              <Link
                href="/tableau-de-bord"
                onClick={onItemClick}
                className={`flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-semibold transition-all ${
                  isDashboardActive
                    ? "border border-[#6b4830] bg-[#523624] text-white shadow-sm"
                    : "text-[#ebd9c0] hover:bg-white/10 hover:text-white"
                }`}
              >
                <Home className="h-5 w-5 stroke-[1.75]" />
                <span>Tableau de bord</span>
              </Link>
              <Link
                href="/tableau-de-bord/methodologie"
                onClick={onItemClick}
                className={`flex items-center gap-3 rounded-xl px-3 py-2 text-sm transition-all ${
                  isMethodologieActive
                    ? "border border-[#6b4830] bg-[#523624] text-white shadow-sm font-semibold"
                    : "font-medium text-[#ebd9c0] hover:bg-white/10 hover:text-white"
                }`}
              >
                <BookOpen className="h-5 w-5 stroke-[1.75] text-[#ebd9c0]" />
                <span>Méthodologie</span>
              </Link>
            </div>
          )}

          {/* 3. Section : ESPACES DE GESTION ou ESPACE CANDIDAT */}
          <div className="mb-2 mt-5 px-4 text-[11px] font-semibold uppercase tracking-wider text-[#cbb7a3]">
            {isPorteur ? "ESPACE CANDIDAT" : "ESPACES DE GESTION"}
          </div>

          <nav className="space-y-1 px-3">
            {navItems.map((item) => {
              const IconComponent = item.icon;
              const isActive =
                item.href === "/incubateur"
                  ? pathname === "/incubateur"
                  : pathname === item.href ||
                    (pathname.startsWith(item.href) && item.href !== "/");

              return (
                <Link
                  key={item.slug}
                  href={item.href}
                  onClick={onItemClick}
                  className={`group flex items-center gap-3 rounded-lg px-3 py-2 text-[13px] transition-colors ${
                    isActive
                      ? "bg-[#523624] font-semibold text-white shadow-xs"
                      : "font-medium text-[#ebd9c0] hover:bg-white/10 hover:text-white"
                  }`}
                >
                  <IconComponent
                    className="h-4.5 w-4.5 shrink-0 stroke-[1.5] text-white/90 group-hover:text-white"
                  />
                  <span className="truncate">{item.titre}</span>
                </Link>
              );
            })}
          </nav>

          {/* 4. Page d'accueil (visible pour tous les rôles) */}
          <div className="mx-4 my-3 border-t border-white/10" />
          <div className="px-3">
            <Link
              href="/"
              onClick={onItemClick}
              className={`flex items-center gap-3 rounded-lg px-3 py-2 text-[13px] transition-colors ${
                isHomeActive
                  ? "bg-[#523624] font-semibold text-white"
                  : "font-medium text-[#ebd9c0] hover:bg-white/10 hover:text-white"
              }`}
            >
              <Home className="h-4.5 w-4.5 shrink-0 stroke-[1.5] text-white/90" />
              <span>Page d&apos;accueil</span>
            </Link>
          </div>
        </div>

        {/* Partie basse : Profil Utilisateur & Déconnexion au format compact uniforme */}
        <div className="mt-8 pb-5 px-3">
          {/* Ligne de séparation */}
          <div className="mx-1 mb-3 border-t border-white/10" />

          {/* Deux boutons au format compact parfaitement uniformes */}
          <div className="space-y-2">
            {/* 1. Bouton Profil Utilisateur (format compact identique à Déconnexion) */}
            {user ? (
              <Link
                href="/compte"
                onClick={onItemClick}
                className="group flex w-full items-center justify-between gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-xs font-medium text-white shadow-xs transition-colors hover:bg-white/10"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white text-[#21130d] text-[11px] font-bold" aria-hidden="true">
                    {userInitial}
                  </div>
                  <div className="min-w-0 text-left">
                    <p className="truncate font-semibold">{userDisplayName}</p>
                    <p className="text-[10px] text-[#cbb7a3] truncate">({roleLabel})</p>
                    <span className="sr-only">Mon profil &amp; Compte</span>
                  </div>
                </div>
                <ChevronRight className="h-4 w-4 shrink-0 text-white/60" aria-hidden="true" />
              </Link>
            ) : null}

            {/* 2. Bouton Déconnexion (format compact) */}
            {user ? (
              <button
                type="button"
                onClick={() => {
                  if (onItemClick) onItemClick();
                  logout();
                }}
                className="group flex w-full items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-semibold text-[#ebd9c0] shadow-xs transition-all hover:border-[#6B2020] hover:bg-[#3B1414] hover:text-[#FCA5A5] active:scale-[0.99]"
                title="Déconnexion"
                aria-label="Déconnexion"
              >
                <LogOut className="h-4 w-4 shrink-0 transition-transform group-hover:-translate-x-0.5" />
                <span>Déconnexion</span>
              </button>
            ) : (
              <Link
                href="/connexion"
                onClick={onItemClick}
                className="flex w-full items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-semibold text-[#ebd9c0] hover:bg-white/10 hover:text-white transition-colors"
                title="Se connecter"
                aria-label="Se connecter"
              >
                <User className="h-4 w-4" />
                <span>Se connecter</span>
              </Link>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <>
      {/* 
        1. SIDEBAR FIXE PERMANENTE SUR GRAND ÉCRAN (Desktop lg: 1024px et +)
      */}
      <aside
        aria-label="Navigation latérale principale"
        className="hidden lg:fixed lg:inset-y-0 lg:left-0 lg:z-50 lg:flex lg:w-64 lg:flex-col lg:border-r lg:border-[#382015] lg:bg-[#21130d] lg:text-white lg:shadow-xl lg:overflow-hidden"
      >
        {/* Filigrane emblème CIAT en arrière-plan en bas de la sidebar */}
        <div className="pointer-events-none absolute -bottom-8 -left-6 z-0 select-none opacity-[0.06]">
          <Image
            src="/images/brand/symbole_blanc.png"
            alt=""
            width={280}
            height={280}
            priority
          />
        </div>

        {renderSidebarContent()}
      </aside>

      {/* 2. BOUTON MOBILE / TIROIR LATÉRAL & HEADER MOBILE OFFICIEL CIAT */}
      <div className="lg:hidden sticky top-0 z-40 flex h-14 items-center justify-between border-b border-[#e6d8c6] bg-white/95 px-3.5 backdrop-blur-xs shadow-2xs">
        {/* Gauche : Bouton menu tiroir tactile */}
        <button
          type="button"
          onClick={() => setIsMobileOpen(true)}
          className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-[#EFE4D6] bg-white text-[#612D10] shadow-2xs hover:bg-[#FAF7F2] hover:border-[#C99A68] active:scale-95 transition-all cursor-pointer"
          aria-label="Ouvrir le menu de navigation"
        >
          <Menu className="h-5 w-5 stroke-[2.2]" />
        </button>

        {/* Centre : Texte contextuel approprié */}
        <div className="flex flex-col items-center justify-center text-center min-w-0 px-2">
          <span className="text-xs font-extrabold uppercase tracking-wider text-[#612D10] truncate">
            {isPorteur ? "Espace Porteur" : "Espace Incubateur"}
          </span>
          <span className="text-[10px] font-semibold text-[#8C6D4F] -mt-0.5 truncate">
            CIAT · ISEP Diamniadio
          </span>
        </div>

        {/* Droite : Logo officiel CIAT à taille appropriée */}
        <Link
          href="/"
          className="inline-flex items-center justify-center shrink-0 focus:outline-none"
          aria-label="Accueil CIAT"
        >
          <Image
            src="/images/brand/logo_principal.png"
            alt="Logo officiel CIAT"
            width={110}
            height={36}
            priority
            className="h-7 w-auto object-contain"
          />
        </Link>
      </div>

      {/* Drawer mobile */}
      {isMobileOpen && (
        <div className="fixed inset-0 z-50 flex lg:hidden">
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
            onClick={closeMobile}
          />
          <div className="relative flex w-full max-w-xs flex-1 flex-col bg-[#21130d] pb-4 pt-5 shadow-2xl">
            <div className="absolute right-0 top-0 -mr-12 pt-2">
              <button
                type="button"
                onClick={closeMobile}
                className="ml-1 flex h-10 w-10 items-center justify-center rounded-full text-white hover:bg-white/10"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            {renderSidebarContent(closeMobile)}
          </div>
        </div>
      )}
    </>
  );
}
