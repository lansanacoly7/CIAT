"use client";

import { type ReactNode } from "react";

/**
 * AppSidebarLayout :
 * La barre latérale est désormais unifiée pour l'ensemble de la plateforme CIAT
 * via AppShell (DashboardSidebar). Ce composant sert de conteneur fluide
 * préservant l'arrière-plan et le style des modules incubateur, documents et compte.
 */
export function AppSidebarLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-white">
      {children}
    </div>
  );
}

export default AppSidebarLayout;
