import { Suspense } from "react";
import type { Metadata } from "next";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { DashboardContent } from "./DashboardContent";
import { KpiSkeletonGrid } from "./components/PageState";

export const metadata: Metadata = {
  title: "Tableau de bord décisionnel",
  description:
    "Suivi stratégique des activités, des cohortes et des prototypes du Centre d'Innovation, d'Application et de Transfert (CIAT).",
};

function DashboardFallback() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-6 border-b border-zinc-200 pb-5">
        <div className="h-3 w-40 animate-pulse rounded bg-zinc-200" />
        <div className="mt-2 h-8 w-72 animate-pulse rounded bg-zinc-200" />
        <div className="mt-2 h-4 w-96 animate-pulse rounded bg-zinc-100" />
      </div>
      <div className="mb-6 h-14 animate-pulse rounded-lg bg-zinc-100" />
      <KpiSkeletonGrid />
    </div>
  );
}

export default function TableauDeBordPage() {
  return (
    <ProtectedRoute allowedRoles={["membre_comite", "coordonnateur", "administrateur"]}>
      <Suspense fallback={<DashboardFallback />}>
        <DashboardContent />
      </Suspense>
    </ProtectedRoute>
  );
}
