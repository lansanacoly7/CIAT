import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Galerie des Innovations",
  description:
    "Vitrine technologique officielle du CIAT — ISEP Diamniadio : découvrez les prototypes validés, fiches techniques et solutions innovantes incubées au Sénégal.",
  openGraph: {
    title: "Galerie des Innovations | CIAT — ISEP Diamniadio",
    description:
      "Explorez les innovations, prototypes industriels et solutions numériques certifiés par le comité du CIAT.",
    images: [
      {
        url: "/images/brand/logo_principal.png",
        width: 1200,
        height: 630,
        alt: "Galerie des innovations CIAT",
      },
    ],
  },
};

export default function GalerieLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
