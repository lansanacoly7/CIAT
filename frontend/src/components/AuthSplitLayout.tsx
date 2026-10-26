"use client";

import Image from "next/image";
import Link from "next/link";
import { type ReactNode } from "react";

interface AuthSplitLayoutProps {
  title: string;
  subtitle: string;
  maxWidth?: "md" | "lg";
  children: ReactNode;
}

export default function AuthSplitLayout({
  title,
  subtitle,
  maxWidth = "md",
  children,
}: AuthSplitLayoutProps) {
  const cardWidthClass = maxWidth === "lg" ? "max-w-[560px]" : "max-w-[460px]";

  return (
    <div className="fixed inset-0 flex h-screen w-screen overflow-hidden bg-[#FAF7F2] text-[#26160b]">
      {/* Zone gauche : Image immersive de l'incubateur CIAT (pleine hauteur fixe, masquée sur mobile/tablette portrait) */}
      <section
        aria-label="Présentation institutionnelle du CIAT"
        className="relative hidden h-full lg:flex lg:w-1/2 xl:w-[50%] flex-col justify-between overflow-hidden bg-[#26160b]"
      >
        {/* Photographie authentique de l'incubateur CIAT */}
        <Image
          src="/images/auth-incubateur.jpg"
          alt="Équipe et porteurs de projets à l'incubateur CIAT de l'ISEP Diamniadio"
          fill
          priority
          sizes="(min-width: 1024px) 50vw, 0vw"
          className="object-cover object-center select-none"
        />

        {/* Dégradé supérieur pour détacher le badge institutionnel */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 top-0 h-36 bg-gradient-to-b from-[#24140D]/75 via-[#24140D]/30 to-transparent"
        />

        {/* Dégradé subtil sur le bord droit */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-y-0 right-0 w-16 bg-gradient-to-r from-transparent to-black/15"
        />

        {/* Dégradé inférieur étendu garantissant un contraste parfait sous le titre et le texte */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 bottom-0 h-80 xl:h-96 bg-gradient-to-t from-[#1A0E08] via-[#1A0E08]/85 via-50% to-transparent"
        />

        {/* Badge supérieur institutionnel */}
        <div className="relative z-10 p-6 xl:p-8">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/25 bg-black/45 px-3.5 py-1.5 text-xs font-medium tracking-wide text-white backdrop-blur-md shadow-sm">
            <span className="h-1.5 w-1.5 rounded-full bg-[#E3A869]" aria-hidden="true" />
            <span>ISEP Amadou Traoré · Diamniadio</span>
          </div>
        </div>

        {/* Bloc éditorial inférieur (lisibilité maximale avec typographie renforcée) */}
        <div className="relative z-10 p-6 pb-12 xl:p-10 xl:pb-16">
          <h2
            style={{ color: "#FFFFFF" }}
            className="font-[family-name:var(--font-title)] text-3xl font-extrabold tracking-tight !text-white xl:text-4xl drop-shadow-md"
          >
            Donnez vie à vos idées.
          </h2>
          {/* Ligne d'accentuation institutionnelle ocre CIAT */}
          <div className="mt-3.5 h-1 w-10 rounded-full bg-[#E3A869]" aria-hidden="true" />
          <p
            style={{ color: "rgba(255, 255, 255, 0.95)" }}
            className="mt-3.5 max-w-xl text-base leading-relaxed !text-white xl:text-lg drop-shadow-sm"
          >
            Le CIAT accompagne les porteurs de projets dans l’innovation, l’expérimentation et le développement de solutions à fort impact.
          </p>
        </div>
      </section>

      {/* Zone droite : Panneau défilable avec marge supérieure garantie (jamais tronqué en haut) */}
      <section
        aria-label="Zone du formulaire"
        className="relative flex h-full w-full flex-1 flex-col overflow-y-auto bg-[#FAF7F2]"
      >
        <div className="flex min-h-full w-full flex-col items-center justify-start px-4 py-8 sm:px-6 sm:py-10 lg:justify-center lg:px-8">
          {/* Carte du formulaire avec contour net, ombre douce et dégagement haut garanti */}
          <div className={`w-full ${cardWidthClass} rounded-2xl border border-[#E2D4C3] bg-white p-6 shadow-md sm:p-8 transition-shadow`}>
            {/* Bouton retour au portail permanent (desktop, tablette, mobile) */}
            <div className="mb-4">
              <Link
                href="/"
                aria-label="Retour au portail CIAT"
                className="group inline-flex items-center gap-1.5 text-xs font-semibold text-[#612D10] transition-colors hover:text-[#3F1D0A]"
              >
                <svg
                  className="h-3.5 w-3.5 transition-transform group-hover:-translate-x-0.5"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth="2.2"
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
                </svg>
                <span>Retour au portail</span>
              </Link>
            </div>

            {/* En-tête de la carte avec logo officiel et titres */}
            <div className="mb-5 text-center">
              <Link href="/" className="inline-block" aria-label="Accueil CIAT">
                <Image
                  src="/brand/logo_principal.png"
                  alt="Logo officiel CIAT — ISEP Diamniadio"
                  width={140}
                  height={54}
                  priority
                  className="mx-auto h-10 w-auto object-contain"
                />
              </Link>
              <h1 className="mt-3.5 font-[family-name:var(--font-title)] text-xl font-bold text-[#612D10] sm:text-2xl">
                {title}
              </h1>
              <p className="mt-1 text-xs text-[#6b5646] sm:text-sm">
                {subtitle}
              </p>
            </div>

            {/* Corps du formulaire */}
            {children}

            {/* Pied de carte institutionnel sobre */}
            <div className="mt-6 border-t border-[#EFE4D6]/70 pt-3 text-center text-[11px] text-[#6b5646]/90">
              CIAT · ISEP Amadou Traoré de Diamniadio
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
