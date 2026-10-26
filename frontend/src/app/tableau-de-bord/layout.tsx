import type { Metadata } from "next";
import { DashboardSidebar } from "./components/DashboardSidebar";

export const metadata: Metadata = {
  title: "Tableau de bord décisionnel | CIAT",
  description:
    "Indicateurs d'activité, sélection et maturation des prototypes du CIAT · ISEP Diamniadio.",
};

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative min-h-screen bg-[#fcfbf9]">
      {/* Barre latérale officielle isolée au module tableau-de-bord */}
      <DashboardSidebar />

      {/* Contenu principal décalé pour laisser place à la sidebar fixe */}
      <div className="lg:pl-64 flex flex-col min-h-screen">
        <main className="flex-1">{children}</main>
      </div>
    </div>
  );
}
