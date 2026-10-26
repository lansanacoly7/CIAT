import type { Metadata } from "next";
import { AdminLayout } from "../tableau-de-bord/components/AdminLayout";

export const metadata: Metadata = {
  title: "Générateur de documents | CIAT",
  description:
    "Création, édition et validation des documents officiels de projets du CIAT.",
};

export default function DocumentsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AdminLayout>{children}</AdminLayout>;
}
