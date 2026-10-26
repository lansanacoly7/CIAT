import type { Metadata } from "next";
import { AdminLayout } from "../tableau-de-bord/components/AdminLayout";

export const metadata: Metadata = {
  title: "Gestion de l'incubateur | CIAT",
  description:
    "Suivi des candidatures, des jalons et de la maturation des projets du CIAT.",
};

export default function IncubateurLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AdminLayout>{children}</AdminLayout>;
}
