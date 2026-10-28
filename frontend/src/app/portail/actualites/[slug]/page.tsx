"use client";

import { Suspense, use, useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Calendar,
  Clock,
  ArrowLeft,
  ArrowRight,
  Share2,
  Newspaper,
  Building2,
  BookmarkCheck,
  ChevronRight,
} from "lucide-react";
import { ApiErrorBanner, DemoBanner } from "@/components/ui";
import {
  getActualiteBySlug,
  getActualites,
  type Actualite,
} from "@/lib/portal-api";

function formatDate(dateStr: string) {
  try {
    const d = new Date(dateStr);
    return new Intl.DateTimeFormat("fr-FR", {
      day: "numeric",
      month: "long",
      year: "numeric",
    }).format(d);
  } catch {
    return dateStr;
  }
}

function ActualiteDetailContent({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = use(params);
  const [actu, setActu] = useState<Actualite | null>(null);
  const [allActus, setAllActus] = useState<Actualite[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDemo, setIsDemo] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const loadActu = () => {
    setLoading(true);
    setError(null);
    Promise.all([getActualiteBySlug(slug), getActualites()])
      .then(([detailRes, listRes]) => {
        setActu(detailRes.item);
        setAllActus(listRes.items || []);
        setIsDemo(Boolean(detailRes.isDemo));
        setError(detailRes.error);
        setLoading(false);
      })
      .catch(() => {
        setError("Impossible de charger cette actualité. Le service est momentanément indisponible.");
        setActu(null);
        setIsDemo(false);
        setLoading(false);
      });
  };

  useEffect(() => {
    let ignore = false;
    Promise.all([getActualiteBySlug(slug), getActualites()])
      .then(([detailRes, listRes]) => {
        if (!ignore) {
          setActu(detailRes.item);
          setAllActus(listRes.items || []);
          setIsDemo(Boolean(detailRes.isDemo));
          setError(detailRes.error);
          setLoading(false);
        }
      })
      .catch(() => {
        if (!ignore) {
          setError("Impossible de charger cette actualité. Le service est momentanément indisponible.");
          setActu(null);
          setIsDemo(false);
          setLoading(false);
        }
      });
    return () => {
      ignore = true;
    };
  }, [slug]);

  const handleShare = () => {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    }
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-20 text-center">
        <div className="h-8 w-8 rounded-full border-2 border-[#612D10] border-t-transparent animate-spin mx-auto mb-4" />
        <p className="text-sm font-semibold text-[#612D10]">
          Chargement de la publication officielle…
        </p>
      </div>
    );
  }

  if (error && !actu) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-16">
        <ApiErrorBanner message={error} onRetry={loadActu} />
        <div className="text-center mt-6">
          <Link
            href="/portail/actualites"
            className="inline-flex items-center gap-2 rounded-xl bg-[#612D10] px-5 py-2.5 text-xs font-bold text-white"
          >
            <ArrowLeft size={14} />
            <span>Revenir aux actualités</span>
          </Link>
        </div>
      </div>
    );
  }

  if (!actu) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-20 text-center">
        <Newspaper className="mx-auto h-12 w-12 text-[#C99A68]" />
        <h1 className="mt-4 text-2xl font-bold text-[#24140D]">
          Article introuvable
        </h1>
        <p className="mt-2 text-sm text-[#655346]">
          Cette publication n&apos;existe pas ou a été déplacée.
        </p>
        <div className="mt-6">
          <Link
            href="/portail/actualites"
            className="inline-flex items-center gap-2 rounded-xl bg-[#612D10] px-5 py-2.5 text-xs font-bold text-white"
          >
            <ArrowLeft size={14} />
            <span>Retourner au fil d&apos;actualités</span>
          </Link>
        </div>
      </div>
    );
  }

  // Articles suivants / suggestions
  const otherArticles = allActus.filter((a) => a.slug !== actu.slug).slice(0, 2);
  const isExemple = actu.titre.startsWith("[Exemple]");

  return (
    <div className="bg-[#FAF7F2] text-[#24140D] min-h-screen font-sans antialiased selection:bg-[#C99A68]/30 py-8 md:py-14">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        {/* =====================================================================
         * 1. FIL D'ARIANE OFFICIEL (EXIGENCE T4)
         * ===================================================================== */}
        <nav
          aria-label="Fil d'Ariane"
          className="mb-8 flex flex-wrap items-center gap-2 text-xs font-medium text-[#8C6D58]"
        >
          <Link href="/" className="hover:text-[#612D10] transition">
            Accueil
          </Link>
          <span className="text-[#C99A68]/60">/</span>
          <Link href="/portail" className="hover:text-[#612D10] transition">
            Portail
          </Link>
          <span className="text-[#C99A68]/60">/</span>
          <Link href="/portail/actualites" className="hover:text-[#612D10] transition">
            Actualités
          </Link>
          <span className="text-[#C99A68]/60">/</span>
          <span className="text-[#24140D] font-bold truncate max-w-xs sm:max-w-md">
            {actu.titre}
          </span>
        </nav>

        {isDemo && <DemoBanner className="mb-6" />}

        {/* =====================================================================
         * 2. EN-TÊTE DE L'ARTICLE
         * ===================================================================== */}
        <header className="mb-8">
          <div className="flex flex-wrap items-center gap-3 text-xs mb-4">
            <span className="rounded-full bg-[#612D10]/10 border border-[#612D10]/20 px-3 py-1 font-bold text-[#612D10]">
              Publication Officielle
            </span>
            {isExemple && (
              <span className="rounded-full bg-amber-100 border border-amber-300 px-3 py-1 font-bold text-amber-900">
                [Exemple Démonstration]
              </span>
            )}
            <span className="inline-flex items-center gap-1.5 text-[#8C6D58] font-medium">
              <Calendar size={13} />
              <time dateTime={actu.publie_le}>{formatDate(actu.publie_le)}</time>
            </span>
            <span className="text-[#A68F80]">•</span>
            <span className="text-[#8C6D58]">Temps de lecture : 3 min</span>
          </div>

          <h1 className="font-[family-name:var(--font-jakarta)] text-2xl sm:text-4xl md:text-5xl font-black text-[#24140D] leading-tight">
            {actu.titre}
          </h1>

          {actu.resume && (
            <p className="mt-5 text-base sm:text-lg md:text-xl text-[#655346] leading-relaxed font-serif italic border-l-4 border-[#C99A68] pl-4">
              {actu.resume}
            </p>
          )}

          <div className="mt-6 pt-4 border-t border-[#E5D7C6] flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-[#612D10] text-white flex items-center justify-center font-black text-xs">
                CIAT
              </div>
              <div>
                <p className="text-xs font-bold text-[#24140D]">
                  Direction de la Communication
                </p>
                <p className="text-[11px] text-[#8C6D58]">
                  ISEP Amadou Trawaré • Diamniadio
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={handleShare}
              className="inline-flex items-center gap-1.5 rounded-xl border border-[#E5D7C6] bg-white px-3.5 py-2 text-xs font-bold text-[#655346] hover:text-[#24140D] hover:bg-[#FAF7F2] transition cursor-pointer"
            >
              <Share2 size={13} />
              <span>{copied ? "Lien copié !" : "Partager"}</span>
            </button>
          </div>
        </header>

        {/* =====================================================================
         * 3. GRANDE IMAGE D'EN-TÊTE
         * ===================================================================== */}
        <div className="mb-10 overflow-hidden rounded-3xl border border-[#E5D7C6] bg-[#24140D] shadow-lg">
          {actu.image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={actu.image}
              alt={actu.titre}
              className="w-full max-h-[500px] object-cover"
            />
          ) : (
            <div className="py-20 px-8 text-center bg-gradient-to-br from-[#24140D] via-[#381B0F] to-[#24140D]">
              <Newspaper size={48} className="text-[#C99A68]/60 mx-auto mb-3" />
              <p className="text-sm font-bold text-[#EAE0D5] uppercase tracking-wider">
                Centre d&apos;Innovation, d&apos;Application et de Transfert
              </p>
              <p className="text-xs text-[#A68F80] mt-1">ISEP Diamniadio</p>
            </div>
          )}
        </div>

        {/* =====================================================================
         * 4. CORPS DE LECTURE CONFORTABLE (MAX-W-3XL & TYPO SÉLECTE)
         * ===================================================================== */}
        <main className="rounded-3xl border border-[#E5D7C6] bg-white p-6 sm:p-10 md:p-14 shadow-xs">
          <div className="prose max-w-none text-[#24140D] leading-relaxed space-y-6 text-sm sm:text-base md:text-lg">
            {actu.contenu.split("\n\n").map((paragraphe, idx) => (
              <p key={idx} className="leading-relaxed">
                {paragraphe}
              </p>
            ))}
          </div>

          {/* Signature institutionnelle */}
          <div className="mt-12 pt-8 border-t border-[#E5D7C6] bg-[#FAF7F2] -mx-6 -mb-6 sm:-mx-10 sm:-mb-10 md:-mx-14 md:-mb-14 p-6 sm:p-8 rounded-b-3xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <BookmarkCheck className="h-6 w-6 text-[#612D10]" />
              <div>
                <p className="text-xs font-bold text-[#24140D]">
                  Source Certifiée CIAT
                </p>
                <p className="text-[11px] text-[#655346]">
                  Reproduction autorisée avec mention de la source.
                </p>
              </div>
            </div>

            <Link
              href="/portail/appels"
              className="inline-flex items-center gap-2 rounded-xl bg-[#612D10] hover:bg-[#7D3A15] border border-[#C99A68]/40 px-5 py-2.5 text-xs font-bold text-white shadow-sm transition-all"
            >
              <span>Découvrir les Appels</span>
              <ArrowRight size={14} />
            </Link>
          </div>
        </main>

        {/* =====================================================================
         * 5. LIENS VERS LES ARTICLES SUIVANTS (CONTINUER LA LECTURE)
         * ===================================================================== */}
        {otherArticles.length > 0 && (
          <section aria-labelledby="section-articles-suivants" className="mt-14">
            <div className="flex items-center justify-between mb-6">
              <h2
                id="section-articles-suivants"
                className="font-[family-name:var(--font-jakarta)] text-xl font-bold text-[#24140D]"
              >
                Continuer la lecture
              </h2>
              <Link
                href="/portail/actualites"
                className="inline-flex items-center gap-1 text-xs font-bold text-[#612D10] hover:underline"
              >
                <span>Toutes les actualités</span>
                <ArrowRight size={13} />
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {otherArticles.map((nextArt) => (
                <article
                  key={nextArt.id}
                  className="rounded-2xl border border-[#E5D7C6] bg-white p-5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
                >
                  <div>
                    <span className="text-[11px] text-[#8C6D58]">
                      {formatDate(nextArt.publie_le)}
                    </span>
                    <h3 className="mt-2 font-[family-name:var(--font-jakarta)] text-base font-bold text-[#24140D] hover:text-[#612D10] transition-colors leading-snug">
                      <Link href={`/portail/actualites/${nextArt.slug}`}>
                        {nextArt.titre}
                      </Link>
                    </h3>
                    <p className="mt-2 text-xs text-[#655346] line-clamp-2">
                      {nextArt.resume}
                    </p>
                  </div>

                  <div className="mt-4 pt-3 border-t border-[#E5D7C6]">
                    <Link
                      href={`/portail/actualites/${nextArt.slug}`}
                      className="inline-flex items-center gap-1 text-xs font-bold text-[#612D10]"
                    >
                      <span>Lire cet article</span>
                      <ChevronRight size={13} />
                    </Link>
                  </div>
                </article>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}

export default function ActualiteDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-4xl px-4 py-20 text-center">
          <p className="text-sm font-semibold text-[#612D10] animate-pulse">
            Chargement de la publication…
          </p>
        </div>
      }
    >
      <ActualiteDetailContent params={params} />
    </Suspense>
  );
}
