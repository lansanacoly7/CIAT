import type { Metadata } from "next";
import { Suspense, type ReactNode } from "react";
import { Fraunces, Inter, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";

import AppShell from "@/components/AppShell";
import { AuthProvider } from "@/context/AuthContext";

const fraunces = Fraunces({
  variable: "--font-serif",
  subsets: ["latin"],
  weight: ["500", "600", "700", "800"],
  display: "swap",
});

const jakarta = Plus_Jakarta_Sans({
  variable: "--font-jakarta",
  subsets: ["latin"],
  weight: ["600", "700", "800"],
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://ciat.isepdiamniadio.sn";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "CIAT — Centre d'Innovation, d'Application et de Transfert | ISEP Diamniadio",
    template: "%s | CIAT",
  },
  description:
    "Plateforme officielle du Centre d'Innovation, d'Application et de Transfert (CIAT) de l'ISEP Amadou Trawaré de Diamniadio. Incubation, valorisation et prototypes d'excellence.",
  keywords: [
    "CIAT",
    "ISEP Diamniadio",
    "Incubateur",
    "Innovation Sénégal",
    "Transfert technologique",
    "Prototypes",
    "Entrepreneuriat",
  ],
  authors: [{ name: "CIAT — ISEP Diamniadio" }],
  openGraph: {
    type: "website",
    locale: "fr_SN",
    url: siteUrl,
    siteName: "CIAT — ISEP Diamniadio",
    title: "CIAT — Centre d'Innovation, d'Application et de Transfert",
    description:
      "Accompagnement, incubation et valorisation des innovations de l'ISEP Amadou Trawaré de Diamniadio.",
    images: [
      {
        url: "/images/brand/logo_principal.png",
        width: 1200,
        height: 630,
        alt: "Logo officiel CIAT — ISEP Diamniadio",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "CIAT — ISEP Diamniadio",
    description:
      "Plateforme officielle du Centre d'Innovation, d'Application et de Transfert de Diamniadio.",
    images: ["/images/brand/logo_principal.png"],
  },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html
      lang="fr"
      className={`${fraunces.variable} ${jakarta.variable} ${inter.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col overflow-x-hidden">
        <AuthProvider>
          <Suspense fallback={null}>
            <AppShell>{children}</AppShell>
          </Suspense>
        </AuthProvider>
      </body>
    </html>
  );
}
