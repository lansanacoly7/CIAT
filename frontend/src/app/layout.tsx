import type { Metadata } from "next";
import { Inter, Montserrat } from "next/font/google";
import "./globals.css";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

const montserrat = Montserrat({
  variable: "--font-montserrat",
  subsets: ["latin"],
  weight: ["600", "700", "800"],
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: { default: "CIAT", template: "%s | CIAT" },
  description:
    "Plateforme du Centre d'Innovation, d'Application et de Transfert de l'ISEP Amadou Trawaré de Diamniadio.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="fr" className={`${montserrat.variable} ${inter.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-zinc-50">
        <Header />
        <div className="flex flex-1 flex-col lg:pl-64">
          <main className="flex-1">{children}</main>
          <Footer />
        </div>
      </body>
    </html>
  );
}
