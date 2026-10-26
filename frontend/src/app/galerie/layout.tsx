import type { Metadata } from "next";
import { AdminLayout } from "../tableau-de-bord/components/AdminLayout";

export const metadata: Metadata = {
  title: "Galerie des innovations | CIAT",
  description:
    "Vitrine et catalogue des prototypes et projets issus de l'écosystème CIAT.",
};

export default function GalerieLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AdminLayout>{children}</AdminLayout>;
}
