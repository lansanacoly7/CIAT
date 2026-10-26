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
  const cardWidthClass = maxWidth === "lg" ? "max-w-[540px]" : "max-w-[460px]";
  return (
    <div className="fixed inset-0 flex h-screen w-screen overflow-hidden bg-[#FAF7F2] text-[#26160b]">
      {/* Zone gauche : Image immersive de l'incubateur CIAT (pleine hauteur fixe, masquée sur mobile) */}
      <section
        aria-label="Présentation de l'incubateur CIAT"
        className="relative hidden h-full lg:flex lg:w-1/2 xl:w-[54%] flex-col justify-between overflow-hidden bg-[#26160b]"
      >
        {/* Photographie lumineuse et authentique de la scène à 3 profils */}
        <Image
          src="/images/auth-incubateur.jpg"
          alt="Équipe de l'incubateur CIAT à Diamniadio : porteuse de projet, coordonnateur et évaluatrice du comité"
          fill
          priority
          sizes="(min-width: 1024px) 54vw, 0vw"
          className="object-cover object-center select-none"
        />

        {/* Dégradé supérieur traversant qui s'adoucit vers le panneau du formulaire */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-[#26160b]/50 via-[#602d10]/20 to-transparent"
        />

        {/* Dégradé latéral subtil vers le conteneur droit */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-y-0 right-0 w-24 bg-gradient-to-r from-transparent to-[#FAF7F2]/30"
        />

        {/* Dégradé inférieur local pour détacher nettement le texte */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 bottom-0 h-72 bg-gradient-to-t from-[#26160b]/90 via-[#26160b]/40 to-transparent"
        />

        {/* Badge supérieur */}
        <div className="relative z-10 p-8 xl:p-10">
          <span className="inline-flex items-center rounded-full border border-white/30 bg-black/35 px-3.5 py-1 text-xs font-medium tracking-wide text-white backdrop-blur-xs">
            ISEP Amadou Traoré · Diamniadio
          </span>
        </div>

        {/* Accroche textuelle en bas de l'image */}
        <div className="relative z-10 p-8 xl:p-12">
          <h2
            style={{ color: "#ffffff" }}
            className="font-title text-2xl font-bold tracking-tight xl:text-3xl drop-shadow-sm"
          >
            Donnez vie à vos idées.
          </h2>
          <p
            style={{ color: "rgba(255, 255, 255, 0.92)" }}
            className="mt-2.5 max-w-lg text-sm leading-relaxed xl:text-base drop-shadow-xs"
          >
            Le CIAT accompagne les porteurs de projets dans l’innovation, l’expérimentation et le développement de solutions à fort impact.
          </p>
        </div>
      </section>

      {/* Zone droite : seul panneau scrollable contenant la carte du formulaire */}
      <section
        aria-label="Zone du formulaire"
        className="relative flex h-full w-full flex-1 flex-col items-center justify-center overflow-y-auto bg-[#FAF7F2] p-4 sm:p-6 lg:p-8"
      >
        {/* Carte bien délimitée regroupant le retour au portail, le logo et le formulaire */}
        <div className={`my-auto w-full ${cardWidthClass} rounded-2xl border border-[#EFE4D6] bg-white p-6 shadow-sm sm:p-8`}>
          {/* Bouton retour au portail intégré dans la carte */}
          <div className="mb-4">
            <Link
              href="/"
              aria-label="Retour au portail"
              className="group inline-flex items-center gap-1.5 text-xs font-semibold text-[#602d10] transition-colors hover:text-[#3f1d0a]"
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
          <div className="mb-6 text-center">
            <Link href="/" className="inline-block" aria-label="Accueil CIAT">
              <Image
                src="/brand/logo_principal.png"
                alt="CIAT — ISEP Diamniadio"
                width={150}
                height={58}
                priority
                className="mx-auto h-11 w-auto object-contain"
              />
            </Link>
            <h1 className="mt-4 text-xl font-bold text-[#602d10] sm:text-2xl">
              {title}
            </h1>
            <p className="mt-1 text-xs text-[#6b5646] sm:text-sm">
              {subtitle}
            </p>
          </div>

          {/* Corps du formulaire */}
          {children}

          {/* Mention discrète en bas de carte */}
          <div className="mt-6 border-t border-[#EFE4D6]/60 pt-3 text-center text-[11px] text-[#6b5646]">
            CIAT · ISEP Amadou Traoré de Diamniadio
          </div>
        </div>
      </section>
    </div>
  );
}
