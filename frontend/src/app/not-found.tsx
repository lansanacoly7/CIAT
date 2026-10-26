import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Page introuvable (404)",
  description: "La page demandée n'existe pas ou a été déplacée sur la plateforme du CIAT.",
};

export default function NotFound() {
  return (
    <div className="min-h-[70vh] bg-[#FAF7F2] text-[#26160B] flex items-center justify-center px-4 py-16">
      <div className="max-w-xl w-full text-center">
        {/* Badge d'erreur */}
        <div className="inline-flex items-center gap-2 rounded-full border border-[#D4AA70]/40 bg-[#FAF7F2] px-3.5 py-1 text-xs font-semibold uppercase tracking-wider text-[#602D10] shadow-xs mb-6">
          <span className="h-2 w-2 rounded-full bg-[#D4AA70]" />
          Erreur 404 &bull; Page introuvable
        </div>

        {/* Chiffre 404 stylisé */}
        <div className="font-title text-7xl sm:text-8xl font-black text-[#5A3A22] tracking-tight mb-4 drop-shadow-xs">
          404
        </div>

        {/* Titre principal */}
        <h1 className="text-2xl sm:text-3xl font-bold text-[#26160B] tracking-tight mb-3">
          Cette page semble introuvable
        </h1>

        <p className="text-sm sm:text-base text-[#6B5646] leading-relaxed mb-8 max-w-md mx-auto">
          L&apos;adresse demandée n&apos;existe pas, a été renommée ou est temporairement inaccessible.
          Revenez sur les espaces principaux de la plateforme.
        </p>

        {/* Actions principales */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            href="/"
            className="w-full sm:w-auto inline-flex items-center justify-center rounded-xl bg-[#602D10] px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-[#48210B] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#602D10]"
          >
            &larr; Retour à l&apos;accueil
          </Link>
          <Link
            href="/galerie"
            className="w-full sm:w-auto inline-flex items-center justify-center rounded-xl border border-[#D4AA70] bg-white px-5 py-3 text-sm font-semibold text-[#602D10] shadow-xs transition hover:bg-[#F5EEDB] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#D4AA70]"
          >
            Explorer la Galerie
          </Link>
          <Link
            href="/portail"
            className="w-full sm:w-auto inline-flex items-center justify-center rounded-xl border border-[#E5D7C5] bg-white px-5 py-3 text-sm font-semibold text-[#26160B] shadow-xs transition hover:bg-[#F7F2EB] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#5A3A22]"
          >
            Portail du CIAT
          </Link>
        </div>

        {/* Liens de secours */}
        <div className="mt-12 pt-8 border-t border-[#E5D7C5]/70 grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs text-[#6B5646]">
          <Link href="/incubateur" className="hover:text-[#602D10] transition-colors p-2 rounded-lg hover:bg-white/60">
            &bull; Incubateur CIAT
          </Link>
          <Link href="/portail/appels" className="hover:text-[#602D10] transition-colors p-2 rounded-lg hover:bg-white/60">
            &bull; Appels à projets
          </Link>
          <Link href="/portail/contact" className="hover:text-[#602D10] transition-colors p-2 rounded-lg hover:bg-white/60 col-span-2 sm:col-span-1">
            &bull; Contact &amp; Secrétariat
          </Link>
        </div>
      </div>
    </div>
  );
}
