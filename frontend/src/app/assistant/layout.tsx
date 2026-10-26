import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Assistant IA & Atelier de Rédaction",
  description:
    "Assistant d'intelligence artificielle du CIAT pour l'accompagnement des porteurs, l'accès documentaire RAG sourcé et l'atelier de rédaction assistée.",
};

export default function AssistantLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
