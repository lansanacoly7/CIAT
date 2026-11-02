"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ApiErrorBanner, DemoBanner } from "@/components/ui";
import PageHero from "@/components/PageHero";
import { getActualites, type Actualite } from "@/lib/portal-api";

function formatDate(dateStr: string) {
  try {
    return new Intl.DateTimeFormat("fr-FR", {
      day: "numeric",
      month: "long",
      year: "numeric",
    }).format(new Date(dateStr));
  } catch {
    return dateStr;
  }
}

function Vignette({ src }: { src?: string | null }) {
  const [loadError, setLoadError] = useState(false);
  if (!src || loadError) return null;
  return (
    <div className="mb-4 aspect-[4/3] overflow-hidden rounded-2xl">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt=""
        onError={() => setLoadError(true)}
        className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03] motion-reduce:transition-none"
        loading="lazy"
        decoding="async"
      />
    </div>
  );
}

export default function ActualitesPage() {
  const [items, setItems] = useState<Actualite[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDemo, setIsDemo] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = (isCancelled: () => boolean = () => false) => {
    getActualites()
      .then((res) => {
        if (isCancelled()) return;
        setItems(res.items);
        setIsDemo(Boolean(res.isDemo));
        setError(res.error);
        setLoading(false);
      })
      .catch(() => {
        if (isCancelled()) return;
        setError("Les actualités sont momentanément indisponibles. Réessayez plus tard.");
        setItems([]);
        setIsDemo(false);
        setLoading(false);
      });
  };

  const load = () => {
    setLoading(true);
    setError(null);
    fetchData();
  };

  useEffect(() => {
    let ignore = false;
    fetchData(() => ignore);
    return () => {
      ignore = true;
    };
  }, []);

  return (
    <>
      <PageHero image="/images/ciat-depot-innovation.jpg" title="Actualités" subtitle="La vie du centre et des projets incubés." />
    <div className="mx-auto w-full max-w-7xl px-4 py-16 sm:px-6 md:py-24 lg:px-8">

      {isDemo && <DemoBanner />}
      {error && <ApiErrorBanner message={error} onRetry={() => load()} />}

      {loading ? (
        <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="aspect-[4/3] animate-pulse rounded-2xl bg-ivoire" />
          ))}
        </div>
      ) : items.length === 0 ? (
        !error && <p className="py-12 text-center text-texte-doux">Aucune actualité pour le moment.</p>
      ) : (
        <div className="grid gap-x-10 gap-y-14 md:grid-cols-2 lg:grid-cols-3">
          {items.map((art) => (
            <Link key={art.id} href={`/portail/actualites/${art.slug}`} className="group">
              <Vignette src={art.image} />
              <p className="text-sm text-texte-doux">{formatDate(art.publie_le)}</p>
              <h2 className="mt-1 text-[15px] font-semibold leading-snug group-hover:underline">{art.titre}</h2>
              <p className="mt-2 line-clamp-2 text-[13px] leading-relaxed text-texte-doux">{art.resume}</p>
            </Link>
          ))}
        </div>
      )}
    </div>
    </>
  );
}
