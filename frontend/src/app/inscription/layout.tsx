import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Inscription",
  description: "Créez votre compte porteur de projet au CIAT.",
};

export default function InscriptionLayout({ children }: { children: ReactNode }) {
  return children;
}
