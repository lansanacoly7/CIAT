"use client";

import { useState } from "react";

interface CardImageProps {
  src?: string | null;
  alt: string;
  aspectRatio?: string; // e.g. "aspect-[16/10]", "aspect-[16/9]", "aspect-video"
  fallbackCategory?: string;
  fallbackIcon?: "prototype" | "news" | "partner";
  className?: string;
  imgClassName?: string;
}

/**
 * CardImage : Conteneur d'image robuste garantissant le respect de l'aspect-ratio (Constat C5)
 * et un repli visuel institutionnel haut de gamme si l'image est manquante ou en échec de chargement.
 * Aucune carte n'affiche de cadre vide ni de texte alternatif seul (T2).
 */
export default function CardImage({
  src,
  alt,
  aspectRatio = "aspect-[16/10]",
  fallbackCategory,
  fallbackIcon = "prototype",
  className = "",
  imgClassName = "",
}: CardImageProps) {
  const [failedSrc, setFailedSrc] = useState<string | null>(null);

  const showImage = Boolean(src) && failedSrc !== src;

  return (
    <div
      className={`relative w-full overflow-hidden bg-[#FAF7F2] ${aspectRatio} ${className}`}
      style={{ minHeight: "100%" }}
    >
      {showImage ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src as string}
          alt={alt}
          onError={() => setFailedSrc(src || null)}
          loading="lazy"
          className={`h-full w-full object-cover transition-transform duration-300 group-hover:scale-105 ${imgClassName}`}
        />
      ) : (
        /* Repli visuel institutionnel soigné aux couleurs officielles CIAT */
        <div className="flex h-full w-full flex-col items-center justify-center p-4 text-center bg-gradient-to-br from-[#FAF7F2] via-white to-[#F1E8DC] border border-[#EFE4D6]/60">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white shadow-2xs border border-[#EFE4D6] text-[#A35926] mb-2.5">
            {fallbackIcon === "news" ? (
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
              </svg>
            ) : fallbackIcon === "partner" ? (
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            ) : (
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
            )}
          </div>
          <span className="text-[11px] font-bold uppercase tracking-wider text-[#612D10]">
            {fallbackCategory || (fallbackIcon === "news" ? "Actualité CIAT" : "Innovation CIAT")}
          </span>
          <span className="mt-0.5 text-[10px] text-[#8C7664] font-medium">
            ISEP Amadou Trawaré · Diamniadio
          </span>
        </div>
      )}
    </div>
  );
}

/**
 * PartnerLogo : Logo de partenaire avec conteneur carré réservé (aspect-square)
 * et repli visuel sous forme de monogramme officiel CIAT en cas d'image manquante ou brisée.
 */
export function PartnerLogo({
  src,
  alt,
  sigle,
}: {
  src?: string | null;
  alt: string;
  sigle?: string;
}) {
  const [failedSrc, setFailedSrc] = useState<string | null>(null);

  const showImage = Boolean(src) && failedSrc !== src;

  return (
    <div className="h-14 w-14 shrink-0 aspect-square overflow-hidden rounded-xl border border-bordure bg-white p-1 shadow-2xs flex items-center justify-center">
      {showImage ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src as string}
          alt={alt}
          onError={() => setFailedSrc(src || null)}
          className="h-full w-full object-contain"
          loading="lazy"
        />
      ) : (
        <span className="flex h-full w-full items-center justify-center rounded-lg bg-[#FAF7F2] text-xs font-black tracking-wider text-[#612D10] border border-[#EFE4D6]">
          {sigle || alt.slice(0, 3).toUpperCase()}
        </span>
      )}
    </div>
  );
}
