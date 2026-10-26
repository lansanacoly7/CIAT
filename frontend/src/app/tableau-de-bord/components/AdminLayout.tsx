import { DashboardSidebar } from "./DashboardSidebar";
import { HidePublicNav } from "./HidePublicNav";

/**
 * Gabarit unifié pour tous les espaces d'administration et de gestion du CIAT.
 * Affiche la barre latérale sombre de navigation et masque le header/footer publics.
 */
export function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div id="dashboard-root" className="relative min-h-screen w-full bg-[#fcfbf9]">
      {/* Masquage immédiat du Header et Footer publics pour tous les espaces de gestion */}
      <style>{`
        body > header,
        body > footer {
          display: none !important;
        }
      `}</style>
      <HidePublicNav />

      {/* Barre latérale officielle */}
      <DashboardSidebar />

      {/* Contenu principal décalé pour laisser place à la sidebar fixe */}
      <div className="lg:pl-64 flex flex-col min-h-screen">
        <main className="flex-1">{children}</main>
      </div>
    </div>
  );
}
