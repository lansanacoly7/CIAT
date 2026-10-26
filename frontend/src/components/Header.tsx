"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Menu,
  X,
  Home,
  Rocket,
  FileText,
  Globe,
  Bot,
  Layers,
  User,
  ChevronRight,
  LogIn,
} from "lucide-react";

// Les modules de gestion CIAT (Tableau de bord placé en haut en élément principal)
const GESTION_ITEMS = [
  {
    slug: "incubateur",
    href: "/incubateur",
    titre: "Gestion de l'incubateur",
    icon: Rocket,
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
    icon: Bot,
  },
  {
    slug: "galerie",
    href: "/galerie",
    titre: "Galerie des innovations",
    icon: Layers,
  },
];

export default function Header() {
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const pathname = usePathname();

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

  // Contenu exact de la Sidebar (Desktop fixe & Mobile Drawer)
  const renderSidebarContent = (onItemClick?: () => void) => {
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
                src="/brand/logo_blanc.png"
                alt="CIAT"
                width={130}
                height={46}
                priority
                className="h-9 w-auto object-contain"
              />
            </Link>
          </div>

          {/* 2. Bouton principal : Tableau de bord (en haut, style capsule) */}
          <div className="px-3">
            <Link
              href="/tableau-de-bord"
              onClick={onItemClick}
              className={`flex items-center gap-3.5 rounded-xl px-4 py-3 text-sm font-semibold transition-all ${
                isDashboardActive
                  ? "border border-[#6b4830] bg-[#523624] text-white shadow-sm"
                  : "text-[#ebd9c0] hover:bg-white/10 hover:text-white"
              }`}
            >
              <Home className="h-5 w-5 stroke-[1.75]" />
              <span>Tableau de bord</span>
            </Link>
          </div>

          {/* 3. Section : ESPACES DE GESTION */}
          <div className="mb-2 mt-6 px-5 text-[11px] font-semibold uppercase tracking-wider text-[#cbb7a3]">
            ESPACES DE GESTION
          </div>

          <nav className="space-y-1 px-3">
            {GESTION_ITEMS.map((item) => {
              const IconComponent = item.icon;
              const isActive =
                pathname === item.href ||
                (pathname.startsWith(item.href) && item.href !== "/");

              return (
                <Link
                  key={item.slug}
                  href={item.href}
                  onClick={onItemClick}
                  className={`group flex items-center gap-3.5 rounded-lg px-4 py-2.5 text-sm transition-colors ${
                    isActive
                      ? "bg-[#523624] font-semibold text-white"
                      : "font-medium text-[#ebd9c0] hover:bg-white/10 hover:text-white"
                  }`}
                >
                  <IconComponent
                    className="h-5 w-5 stroke-[1.5] text-white/90 group-hover:text-white"
                  />
                  <span className="truncate">{item.titre}</span>
                </Link>
              );
            })}
          </nav>

          {/* 4. Séparateur discret */}
          <div className="mx-4 my-3 border-t border-white/10" />

          {/* 5. Page d'accueil */}
          <div className="px-3">
            <Link
              href="/"
              onClick={onItemClick}
              className={`flex items-center gap-3.5 rounded-lg px-4 py-2.5 text-sm transition-colors ${
                isHomeActive
                  ? "bg-[#523624] font-semibold text-white"
                  : "font-medium text-[#ebd9c0] hover:bg-white/10 hover:text-white"
              }`}
            >
              <Home className="h-5 w-5 stroke-[1.5] text-white/90" />
              <span>Page d&apos;accueil</span>
            </Link>
          </div>
        </div>

        {/* Partie basse : Filigrane + Profil Administrateur + Slogan */}
        <div className="mt-8">
          {/* Ligne de séparation */}
          <div className="mx-4 mb-3 border-t border-white/10" />

          {/* Profil Administrateur (Avatar rond blanc + texte) */}
          <div className="px-3 pb-2">
            <Link
              href="/connexion"
              onClick={onItemClick}
              className="group flex items-center justify-between rounded-xl p-2 transition-colors hover:bg-white/10"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white text-[#21130d] shadow-sm">
                  <User className="h-5 w-5 fill-current" />
                </div>
                <div className="min-w-0">
                  <div className="text-sm font-semibold text-white">Administrateur</div>
                  <div className="text-[11px] text-[#cbb7a3]">Admin &amp; Coordinateur</div>
                </div>
              </div>
              <ChevronRight className="h-4 w-4 text-white/50 transition-transform group-hover:translate-x-0.5" />
            </Link>
          </div>

          {/* Slogan officiel CIAT en pied */}
          <div className="flex items-center gap-2.5 px-5 pb-5 pt-2 text-[10px] text-[#cbb7a3]">
            <Image
              src="/brand/symbole_blanc.png"
              alt=""
              width={20}
              height={20}
              className="h-3.5 w-auto object-contain"
            />
            <span className="font-semibold text-white">CIAT</span>
            <span className="text-white/30">|</span>
            <span className="truncate">Innovation &bull; Incubation &bull; Impact</span>
          </div>
        </div>
      </div>
    );
  };

  return (
    <>
      {/* =========================================================================
          1. SIDEBAR FIXE PERMANENTE SUR GRAND ÉCRAN (Desktop lg: 1024px et +)
          Reproduit exactement le design de l'image de référence :
          - Fond chocolat chaud très foncé (#21130d)
          - Filigrane géant CIAT en fond
          - "Tableau de bord" en haut avec fond capsule (#523624)
          - Rubrique "ESPACES DE GESTION"
          - Profil "Administrateur / Admin & Coordinateur"
          - Slogan "CIAT | Innovation • Incubation • Impact"
         ========================================================================= */}
      <aside
        aria-label="Navigation latérale principale"
        className="hidden lg:fixed lg:inset-y-0 lg:left-0 lg:z-40 lg:flex lg:w-64 lg:flex-col lg:border-r lg:border-[#382015] lg:bg-[#21130d] lg:text-white lg:shadow-xl lg:overflow-hidden"
      >
        {/* Filigrane emblème CIAT en arrière-plan en bas de la sidebar */}
        <div className="pointer-events-none absolute -bottom-8 -left-6 z-0 select-none opacity-[0.06]">
          <Image
            src="/brand/symbole_blanc.png"
            alt=""
            width={280}
            height={280}
            priority
          />
        </div>

        {renderSidebarContent()}
      </aside>

      {/* =========================================================================
          2. BARRE SUPÉRIEURE (TopBar décalée de lg:pl-64)
         ========================================================================= */}
      <header className="sticky top-0 z-30 border-b border-[#e6d8c6] bg-white/95 backdrop-blur-xs lg:pl-64">
        <div className="flex h-14 items-center justify-between px-4 sm:px-6">
          {/* Gauche Mobile : Burger + Logo */}
          <div className="flex items-center gap-3 lg:hidden">
            <button
              type="button"
              onClick={() => setIsMobileOpen(true)}
              aria-label="Ouvrir le menu"
              aria-expanded={isMobileOpen}
              className="inline-flex items-center justify-center rounded-md border border-zinc-200 bg-white p-2 text-zinc-700 hover:bg-zinc-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#c99a69]"
            >
              <Menu className="h-4 w-4" strokeWidth={1.5} />
            </button>

            <Link href="/" className="flex items-center">
              <Image
                src="/brand/logo_mono_brun.png"
                alt="CIAT"
                width={100}
                height={36}
                priority
                className="h-7 w-auto object-contain"
              />
            </Link>
          </div>

          {/* Gauche Desktop : Fil d'Ariane épuré */}
          <div className="hidden items-center gap-2 text-xs lg:flex">
            <span className="font-medium text-zinc-500">Plateforme CIAT</span>
            <span className="text-zinc-300">/</span>
            <span className="font-semibold text-[#602d10]">
              {pathname === "/tableau-de-bord"
                ? "Tableau de bord"
                : pathname === "/"
                ? "Accueil"
                : GESTION_ITEMS.find((g) => pathname.startsWith(g.href))?.titre || "Pilotage"}
            </span>
          </div>

          {/* Droite : Statut du système & Bouton Connexion */}
          <div className="flex items-center gap-3">
            <div className="hidden items-center gap-2 rounded-full border border-[#e6d8c6] bg-[#f8f1e7] px-2.5 py-1 text-[11px] font-medium text-[#602d10] sm:flex">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              <span>Système actif · Données synchronisées</span>
            </div>

            <Link
              href="/connexion"
              className="inline-flex items-center gap-1.5 rounded-md bg-[#c99a69] px-3.5 py-1.5 text-xs font-semibold text-[#26160b] shadow-xs transition-colors hover:bg-[#602d10] hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#c99a69]"
            >
              <LogIn className="h-3.5 w-3.5" strokeWidth={1.5} />
              <span>Connexion</span>
            </Link>
          </div>
        </div>
      </header>

      {/* =========================================================================
          3. TIROIR COULISSANT MOBILE (Sur écran < lg)
         ========================================================================= */}
      <div
        className={`fixed inset-0 z-50 bg-black/60 backdrop-blur-xs transition-opacity duration-300 lg:hidden ${
          isMobileOpen ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
        onClick={closeMobile}
        aria-hidden="true"
      />

      <aside
        id="mobile-slide-menu"
        aria-label="Menu mobile"
        aria-hidden={!isMobileOpen}
        className={`fixed inset-y-0 left-0 z-50 flex w-full max-w-xs flex-col border-r border-[#382015] bg-[#21130d] text-white shadow-2xl transition-transform duration-300 ease-in-out lg:hidden overflow-hidden ${
          isMobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Filigrane en fond */}
        <div className="pointer-events-none absolute -bottom-8 -left-6 z-0 select-none opacity-[0.06]">
          <Image
            src="/brand/symbole_blanc.png"
            alt=""
            width={280}
            height={280}
          />
        </div>

        {/* Bouton fermeture en haut à droite */}
        <div className="relative z-20 flex justify-end px-3 pt-3">
          <button
            type="button"
            onClick={closeMobile}
            aria-label="Fermer le menu"
            className="rounded-md p-1.5 text-zinc-300 hover:bg-white/10 hover:text-white"
          >
            <X className="h-5 w-5" strokeWidth={1.5} />
          </button>
        </div>

        {renderSidebarContent(closeMobile)}
      </aside>
    </>
  );
}
