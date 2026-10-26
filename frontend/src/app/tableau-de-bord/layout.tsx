import type { Metadata } from "next";
import { AdminLayout } from "./components/AdminLayout";

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
  return <AdminLayout>{children}</AdminLayout>;
}
