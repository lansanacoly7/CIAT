import type { Metadata } from "next";
import { AdminLayout } from "../tableau-de-bord/components/AdminLayout";

export const metadata: Metadata = {
  title: "Assistant IA | CIAT",
  description:
    "Orientation des porteurs de projets à partir des documents du CIAT, avec les sources.",
};

export default function AssistantLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AdminLayout>{children}</AdminLayout>;
}
