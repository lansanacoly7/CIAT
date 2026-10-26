import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Connexion",
  description: "Connectez-vous à votre espace CIAT.",
};

export default function ConnexionLayout({ children }: { children: ReactNode }) {
  return children;
}
