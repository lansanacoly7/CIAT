"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Calendar,
  Clock,
  ArrowRight,
  Sparkles,
  Newspaper,
  Tag,
  ChevronRight,
  Filter,
} from "lucide-react";
import { ApiErrorBanner, DemoBanner } from "@/components/ui";
import { getActualites, type Actualite } from "@/lib/portal-api";

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

function getArticleCategory(titre: string, resume?: string): string {
  const t = `${titre} ${resume || ""}`.toLowerCase();
  if (t.includes("partenariat") || t.includes("ptn") || t.includes("accord")) return "Partenariat & Industrie";
  if (t.includes("plateforme") || t.includes("360") || t.includes("lancement")) return "Écosystème & CIAT";
  if (t.includes("ia") || t.includes("conception") || t.includes("atelier")) return "Ateliers & Prototypage";
  return "Actualité CIAT";
}

function ActuImageVisual({
  src,
  alt,
  className = "",
}: {
  src?: string | null;
  alt: string;
  className?: string;
}) {
  const [loadError, setLoadError] = useState(false);

  if (!src || loadError) {
    return (
      <div
        className={`w-full h-full min-h-[200px] flex flex-col items-center justify-center bg-gradient-to-br from-[#24140D] via-[#381B0F] to-[#24140D] p-6 text-center ${className}`}
      >
        <Newspaper size={36} className="text-[#C99A68]/60 mb-2" />
        <span className="text-xs font-bold text-[#EAE0D5] uppercase tracking-wider">
          Actualité Officielle CIAT
        </span>
        <span className="text-[10px] text-[#A68F80] mt-0.5">ISEP Diamniadio</span>
      </div>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt}
      onError={() => setLoadError(true)}
      className={`w-full h-full object-cover transition-transform duration-500 hover:scale-105 ${className}`}
      loading="lazy"
      decoding="async"
    />
  );
}

export default function ActualitesPage() {
  const [items, setItems] = useState<Actualite[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("tous");
  const [loading, setLoading] = useState(true);
  const [fromApi, setFromApi] = useState(false);
  const [isDemo, setIsDemo] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchActualites = () => {
    setLoading(true);
    setError(null);
    getActualites()
      .then((res) => {
        setItems(res.items);
        setFromApi(res.fromApi);
        setIsDemo(Boolean(res.isDemo));
        setError(res.error);
        setLoading(false);
      })
      .catch(() => {
        setError("Les actualités sont momentanément indisponibles. Réessayez plus tard.");
        setItems([]);
        setIsDemo(false);
        setLoading(false);
      });
  };

  useEffect(() => {
    let ignore = false;
    getActualites()
      .then((res) => {
        if (!ignore) {
          setItems(res.items);
          setFromApi(res.fromApi);
          setIsDemo(Boolean(res.isDemo));
          setError(res.error);
          setLoading(false);
        }
      })
      .catch(() => {
        if (!ignore) {
          setError("Les actualités sont momentanément indisponibles. Réessayez plus tard.");
          setItems([]);
          setIsDemo(false);
          setLoading(false);
        }
      });

    return () => {
      ignore = true;
    };
  }, []);

  const categories = useMemo(() => {
    const set = new Set<string>();
    items.forEach((a) => set.add(getArticleCategory(a.titre, a.resume)));
    return Array.from(set);
  }, [items]);

  const filteredItems = useMemo(() => {
    if (selectedCategory === "tous") return items;
    return items.filter(
      (a) => getArticleCategory(a.titre, a.resume) === selectedCategory
    );
  }, [items, selectedCategory]);

  // Composition variée : Article phare (le plus récent) + 2 moyens + liste
  const featuredArticle = useMemo(() => {
    if (filteredItems.length === 0) return null;
    return filteredItems[0];
  }, [filteredItems]);

  const secondaryArticles = useMemo(() => {
    if (filteredItems.length <= 1) return [];
    return filteredItems.slice(1, 3);
  }, [filteredItems]);

  const remainingArticles = useMemo(() => {
    if (filteredItems.length <= 3) return [];
    return filteredItems.slice(3);
  }, [filteredItems]);

  return (
    <div className="bg-[#FAF7F2] text-[#24140D] min-h-screen font-sans antialiased selection:bg-[#C99A68]/30">
      {/* =====================================================================
       * 1. HERO AVEC PHOTOGRAPHIE RÉELLE
       * ===================================================================== */}
      <section className="relative overflow-hidden bg-[#24140D] text-white">
        <div className="absolute inset-0">
          <Image
            src="/images/ciat-depot-innovation.jpg"
            alt="Actualités et dynamiques de l'écosystème d'innovation CIAT à Diamniadio"
            fill
            priority
            sizes="100vw"
            className="object-cover object-center opacity-30"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#24140D] via-[#24140D]/75 to-transparent" />
        </div>

        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-10 pb-16 md:pt-14 md:pb-24">
          {/* Fil d'Ariane */}
          <nav
            aria-label="Fil d'Ariane"
            className="mb-8 flex flex-wrap items-center gap-2 text-xs font-medium text-[#DFCDB9]"
          >
            <Link href="/" className="hover:text-white transition">
              Accueil
            </Link>
            <span className="text-[#C99A68]/70">/</span>
            <Link href="/portail" className="hover:text-white transition">
              Portail
            </Link>
            <span className="text-[#C99A68]/70">/</span>
            <span className="text-white font-semibold">Actualités</span>
          </nav>

          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-[#C99A68]/40 bg-[#612D10]/50 px-3.5 py-1 text-xs font-bold uppercase tracking-wider text-[#DFae79] backdrop-blur-sm">
              <Newspaper size={14} className="text-[#DFae79]" />
              <span>Dépêches & Vie du Centre</span>
            </div>

            <h1 className="mt-5 font-[family-name:var(--font-jakarta)] text-3xl sm:text-5xl md:text-6xl font-extrabold tracking-tight text-white leading-tight">
              Actualités & Réalisations
            </h1>

            <p className="mt-4 sm:mt-6 text-sm sm:text-base md:text-lg leading-relaxed text-[#EAE0D5] max-w-2xl">
              Suivez les avancées des projets incubés, les partenariats stratégiques,
              les ateliers de prototypage et les événements d&apos;insertion de l&apos;ISEP
              Amadou Trawaré de Diamniadio.
            </p>
          </div>
        </div>
      </section>

      {/* =====================================================================
       * 2. CORPS PRINCIPAL & COMPOSITION VARIÉE
       * ===================================================================== */}
      <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12 md:py-20">
        {isDemo && <DemoBanner className="mb-8" />}
        {error && (
          <ApiErrorBanner
            message={error}
            onRetry={fetchActualites}
            className="mb-8"
          />
        )}

        {/* Barre de filtre par catégorie */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-[#E5D7C6] pb-6 mb-12">
          <div>
            <h2 className="font-[family-name:var(--font-jakarta)] text-xl sm:text-2xl font-bold text-[#24140D]">
              Fil d&apos;Information du CIAT
            </h2>
            <p className="text-xs sm:text-sm text-[#655346] mt-0.5">
              {filteredItems.length} {filteredItems.length > 1 ? "articles répertoriés" : "article répertorié"}
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setSelectedCategory("tous")}
              className={`min-h-[40px] px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                selectedCategory === "tous"
                  ? "bg-[#612D10] text-white shadow-sm"
                  : "bg-white border border-[#E5D7C6] text-[#655346] hover:bg-[#FAF7F2] hover:text-[#24140D]"
              }`}
            >
              Tous les articles ({items.length})
            </button>
            {categories.map((cat) => {
              const count = items.filter(
                (a) => getArticleCategory(a.titre, a.resume) === cat
              ).length;
              const active = selectedCategory === cat;
              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setSelectedCategory(cat)}
                  className={`min-h-[40px] px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    active
                      ? "bg-[#612D10] text-white shadow-sm"
                      : "bg-white border border-[#E5D7C6] text-[#655346] hover:bg-[#FAF7F2] hover:text-[#24140D]"
                  }`}
                >
                  {cat} ({count})
                </button>
              );
            })}
          </div>
        </div>

        {loading ? (
          <div className="space-y-8">
            <div className="h-96 rounded-3xl bg-white border border-[#E5D7C6] animate-pulse" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="h-64 rounded-3xl bg-white border border-[#E5D7C6] animate-pulse" />
              <div className="h-64 rounded-3xl bg-white border border-[#E5D7C6] animate-pulse" />
            </div>
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-[#DFCDB9] bg-white p-12 text-center max-w-xl mx-auto my-8">
            <Newspaper className="mx-auto h-12 w-12 text-[#C99A68]" />
            <h3 className="mt-4 text-base font-bold text-[#24140D]">
              Aucun article dans cette catégorie
            </h3>
            <p className="mt-2 text-xs text-[#655346] leading-relaxed">
              De nouvelles publications sont en cours de rédaction par la Direction
              de la Communication du CIAT.
            </p>
            <button
              type="button"
              onClick={() => setSelectedCategory("tous")}
              className="mt-6 inline-flex items-center gap-2 rounded-xl bg-[#612D10] hover:bg-[#7D3A15] px-5 py-2.5 text-xs font-bold text-white transition cursor-pointer"
            >
              Afficher toutes les actualités
            </button>
          </div>
        ) : (
          <div className="space-y-12">
            {/* =================================================================
             * COMPOSITION ÉLITE :
             * 1. ARTICLE PHARE EN GRAND (IMAGE PLEINE LARGEUR)
             * ================================================================= */}
            {featuredArticle && (
              <article className="group rounded-3xl border border-[#E5D7C6] bg-white overflow-hidden shadow-xs hover:shadow-xl transition-all">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-0">
                  <div className="lg:col-span-7 relative min-h-[300px] sm:min-h-[380px] lg:min-h-[440px] overflow-hidden bg-[#24140D]">
                    <ActuImageVisual
                      src={featuredArticle.image}
                      alt={featuredArticle.titre}
                    />
                  </div>

                  <div className="lg:col-span-5 p-6 sm:p-8 md:p-10 flex flex-col justify-between">
                    <div>
                      <div className="flex flex-wrap items-center gap-2 mb-3">
                        <span className="rounded-full bg-[#612D10]/10 border border-[#612D10]/20 px-3 py-1 text-xs font-extrabold text-[#612D10]">
                          {getArticleCategory(
                            featuredArticle.titre,
                            featuredArticle.resume
                          )}
                        </span>
                        {featuredArticle.titre.startsWith("[Exemple]") && (
                          <span className="rounded-full bg-amber-100 border border-amber-300 px-2.5 py-0.5 text-[10px] font-bold text-amber-900">
                            Exemple Démo
                          </span>
                        )}
                        <span className="inline-flex items-center gap-1 text-xs text-[#8C6D58] font-medium">
                          <Calendar size={13} />
                          {formatDate(featuredArticle.publie_le)}
                        </span>
                      </div>

                      <h3 className="font-[family-name:var(--font-jakarta)] text-xl sm:text-2xl md:text-3xl font-extrabold text-[#24140D] leading-tight group-hover:text-[#612D10] transition-colors">
                        <Link href={`/portail/actualites/${featuredArticle.slug}`}>
                          {featuredArticle.titre}
                        </Link>
                      </h3>

                      <p className="mt-4 text-xs sm:text-sm text-[#655346] leading-relaxed">
                        {featuredArticle.resume}
                      </p>
                    </div>

                    <div className="mt-8 pt-6 border-t border-[#E5D7C6] flex items-center justify-between">
                      <Link
                        href={`/portail/actualites/${featuredArticle.slug}`}
                        className="inline-flex items-center gap-2 rounded-xl bg-[#612D10] hover:bg-[#7D3A15] border border-[#C99A68]/40 px-5 py-3 text-xs sm:text-sm font-bold text-white shadow-md transition-all"
                      >
                        <span>Lire l&apos;article complet</span>
                        <ArrowRight size={15} />
                      </Link>
                      <span className="text-[11px] text-[#A68F80]">
                        Article à la Une
                      </span>
                    </div>
                  </div>
                </div>
              </article>
            )}

            {/* =================================================================
             * 2. DEUX ARTICLES MOYENS (FORMAT CARTE PRESTIGE)
             * ================================================================= */}
            {secondaryArticles.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {secondaryArticles.map((art) => (
                  <article
                    key={art.id}
                    className="group rounded-3xl border border-[#E5D7C6] bg-white overflow-hidden shadow-xs hover:shadow-lg transition-all flex flex-col justify-between"
                  >
                    <div>
                      <div className="relative h-56 sm:h-64 w-full overflow-hidden bg-[#24140D]">
                        <ActuImageVisual src={art.image} alt={art.titre} />
                      </div>

                      <div className="p-6 sm:p-8">
                        <div className="flex flex-wrap items-center gap-2 mb-3">
                          <span className="rounded-full bg-[#FAF7F2] border border-[#E5D7C6] px-2.5 py-0.5 text-[11px] font-bold text-[#8C6D58]">
                            {getArticleCategory(art.titre, art.resume)}
                          </span>
                          {art.titre.startsWith("[Exemple]") && (
                            <span className="rounded-full bg-amber-100 border border-amber-300 px-2 py-0.5 text-[10px] font-bold text-amber-900">
                              Exemple Démo
                            </span>
                          )}
                          <span className="inline-flex items-center gap-1 text-[11px] text-[#A68F80]">
                            <Calendar size={12} />
                            {formatDate(art.publie_le)}
                          </span>
                        </div>

                        <h4 className="font-[family-name:var(--font-jakarta)] text-lg sm:text-xl font-bold text-[#24140D] leading-snug group-hover:text-[#612D10] transition-colors">
                          <Link href={`/portail/actualites/${art.slug}`}>
                            {art.titre}
                          </Link>
                        </h4>

                        <p className="mt-3 text-xs sm:text-sm text-[#655346] leading-relaxed line-clamp-3">
                          {art.resume}
                        </p>
                      </div>
                    </div>

                    <div className="px-6 sm:px-8 pb-6 pt-2">
                      <Link
                        href={`/portail/actualites/${art.slug}`}
                        className="inline-flex items-center gap-1.5 text-xs font-bold text-[#612D10] hover:text-[#7D3A15] hover:underline"
                      >
                        <span>Consulter la suite</span>
                        <ArrowRight size={14} />
                      </Link>
                    </div>
                  </article>
                ))}
              </div>
            )}

            {/* =================================================================
             * 3. LISTE HORIZONTALE ÉPURÉE POUR LES AUTRES ARTICLES
             * ================================================================= */}
            {remainingArticles.length > 0 && (
              <section aria-labelledby="section-anciennes-actualites" className="pt-8">
                <h3
                  id="section-anciennes-actualites"
                  className="font-[family-name:var(--font-jakarta)] text-lg font-bold text-[#24140D] mb-6"
                >
                  Archives & Publications Récentes
                </h3>

                <div className="divide-y divide-[#E5D7C6] rounded-3xl border border-[#E5D7C6] bg-white overflow-hidden shadow-xs">
                  {remainingArticles.map((art) => (
                    <article
                      key={art.id}
                      className="p-5 sm:p-6 hover:bg-[#FAF7F2] transition flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1.5">
                          <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#8C6D58]">
                            {getArticleCategory(art.titre, art.resume)}
                          </span>
                          <span className="text-[11px] text-[#A68F80]">
                            • {formatDate(art.publie_le)}
                          </span>
                        </div>
                        <h4 className="font-[family-name:var(--font-jakarta)] text-base font-bold text-[#24140D] hover:text-[#612D10] transition-colors">
                          <Link href={`/portail/actualites/${art.slug}`}>
                            {art.titre}
                          </Link>
                        </h4>
                      </div>

                      <Link
                        href={`/portail/actualites/${art.slug}`}
                        className="inline-flex items-center gap-1 text-xs font-bold text-[#612D10] hover:text-[#7D3A15] shrink-0"
                      >
                        <span>Lire</span>
                        <ChevronRight size={14} />
                      </Link>
                    </article>
                  ))}
                </div>
              </section>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
