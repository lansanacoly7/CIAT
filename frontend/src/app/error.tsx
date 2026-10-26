"use client";

import { useEffect } from "react";
import Link from "next/link";

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function GlobalErrorPage({ error, reset }: ErrorProps) {
  useEffect(() => {
    // Journalisation silencieuse pour suivi d'anomalie
    console.error("Anomalie capturée par le composant error.tsx :", error);
  }, [error]);

  return (
    <div className="min-h-[70vh] bg-[#FAF7F2] text-[#26160B] flex items-center justify-center px-4 py-16">
      <div className="max-w-lg w-full text-center">
        {/* Badge d'avertissement */}
        <div className="inline-flex items-center gap-2 rounded-full border border-red-200 bg-red-50 px-3.5 py-1 text-xs font-semibold text-red-800 shadow-xs mb-6">
          <span className="h-2 w-2 rounded-full bg-red-600" />
          Difficulté temporaire
        </div>

        {/* Icône d'alerte soignée */}
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-[#5A3A22]/10 text-[#5A3A22] mb-5">
          <svg
            className="h-8 w-8"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth="1.8"
            stroke="currentColor"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"
            />
          </svg>
        </div>

        {/* Titre principal */}
        <h1 className="text-2xl sm:text-3xl font-bold text-[#26160B] tracking-tight mb-3">
          Une anomalie est survenue
        </h1>

        <p className="text-sm sm:text-base text-[#6B5646] leading-relaxed mb-8 max-w-md mx-auto">
          La plateforme a rencontré un problème imprévu lors du chargement de ces données.
          Vous pouvez relancer l&apos;opération immédiatement sans risque pour vos données.
        </p>

        {/* Actions principales */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            type="button"
            onClick={() => reset()}
            className="w-full sm:w-auto inline-flex items-center justify-center rounded-xl bg-[#602D10] px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-[#48210B] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#602D10] cursor-pointer"
          >
            &#x21bb; Réessayer
          </button>
          <Link
            href="/"
            className="w-full sm:w-auto inline-flex items-center justify-center rounded-xl border border-[#D4AA70] bg-white px-5 py-3 text-sm font-semibold text-[#602D10] shadow-xs transition hover:bg-[#F5EEDB] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#D4AA70]"
          >
            Retour à l&apos;accueil
          </Link>
        </div>

        {/* Détails techniques discrets en développement */}
        {error?.digest && (
          <p className="mt-8 text-xs text-[#8A725D] font-mono">
            Réf. d&apos;incident : {error.digest}
          </p>
        )}
      </div>
    </div>
  );
}
