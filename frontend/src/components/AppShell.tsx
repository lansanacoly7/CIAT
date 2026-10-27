"use client";

import { Suspense, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { DashboardSidebar } from "@/app/tableau-de-bord/components/DashboardSidebar";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

/**
 * AppShell : Coque applicative globale de la plateforme CIAT.
 * 
 * Règle de visibilité de la barre latérale d'administration :
 * 1. Sur les écrans d'authentification plein écran (/connexion, /inscription), aucune barre n'est affichée.
 * 2. Sur /tableau-de-bord, la barre latérale est toujours active.
 * 3. Lorsqu'un administrateur, coordonnateur ou membre du comité est connecté,
 *    la barre latérale d'administration (DashboardSidebar) reste visible sur TOUTES ses pages
 *    (tableau de bord, incubateur, documents, assistant IA, galerie, portail, accueil, etc.).
 * 4. Pour les visiteurs publics et porteurs non administrateurs, la disposition publique classique
 *    (Header institutionnel + contenu + Footer) est conservée.
 */
export default function AppShell({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const pathname = usePathname();

  // Écrans d'authentification plein écran
  const isAuthPage = pathname === "/connexion" || pathname === "/inscription";

  // Espaces applicatifs dotés de leur propre barre latérale intégrée (AppSidebarLayout)
  const hasDedicatedSidebar =
    pathname.startsWith("/incubateur") ||
    pathname.startsWith("/documents") ||
    pathname.startsWith("/compte");

  // Rôles administratifs et de gestion habilités
  const isStaffUser = Boolean(
    user &&
      (user.role === "administrateur" ||
        user.role === "coordonnateur" ||
        user.role === "membre_comite")
  );

  // Le tableau de bord décisionnel active systématiquement la barre latérale
  const isDashboardRoute = pathname.startsWith("/tableau-de-bord");

  // Sur les écrans d'auth ou les espaces ayant déjà leur propre barre latérale dédiée
  if (isAuthPage || hasDedicatedSidebar) {
    return <main className="flex-1">{children}</main>;
  }

  // Détermination de l'affichage de la barre latérale d'administration
  const showAdminSidebar = isStaffUser || isDashboardRoute;

  if (showAdminSidebar) {
    return (
      <div id="admin-shell-root" className="relative min-h-screen w-full bg-[#fcfbf9]">
        {/* Barre latérale officielle de l'administrateur */}
        <DashboardSidebar />

        {/* Contenu principal décalé sur grand écran pour la barre latérale fixe (w-64 = 256px) */}
        <div className="lg:pl-64 flex flex-col min-h-screen">
          <main className="flex-1">{children}</main>
        </div>
      </div>
    );
  }

  // Disposition publique standard (visiteurs et porteurs)
  return (
    <>
      <Suspense
        fallback={
          <header className="sticky top-0 z-40 border-b border-[#3d2315] bg-brun-fonce text-white h-16" />
        }
      >
        <Header />
      </Suspense>
      <main className="flex-1">{children}</main>
      <Suspense fallback={null}>
        <Footer />
      </Suspense>
    </>
  );
}
