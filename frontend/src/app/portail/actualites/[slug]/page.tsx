"use client";

import { Suspense, use, useEffect, useState } from "react";
import Link from "next/link";
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

  if (loading) {
    return <p className="mx-auto max-w-3xl px-4 py-24 text-center text-sm text-texte-doux">Chargement…</p>;
  }

  if (error && !actu) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16">
        <ApiErrorBanner message={error} onRetry={loadActu} />
        <Link href="/portail/actualites" className="text-sm font-medium text-brun hover:underline">
          ← Actualités
        </Link>
      </div>
    );
  }

  if (!actu) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-24 text-center">
        <h1 className="text-2xl font-bold">Article introuvable</h1>
        <p className="mt-2 text-texte-doux">Cette publication n&apos;existe pas ou a été déplacée.</p>
        <Link href="/portail/actualites" className="mt-6 inline-block text-sm font-medium text-brun hover:underline">
          ← Actualités
        </Link>
      </div>
    );
  }

  const otherArticles = allActus.filter((a) => a.slug !== actu.slug).slice(0, 2);

  return (
    <article className="mx-auto max-w-3xl px-4 py-16 sm:px-6 md:py-24">
      {isDemo && <DemoBanner />}

      <Link href="/portail/actualites" className="text-sm text-texte-doux hover:text-brun">
        ← Actualités
      </Link>

      <p className="mt-10 text-sm text-texte-doux">
        <time dateTime={actu.publie_le}>{formatDate(actu.publie_le)}</time>
      </p>
      <h1 className="mt-2 text-3xl font-bold leading-tight md:text-4xl">{actu.titre}</h1>
      {actu.resume && <p className="mt-5 text-lg leading-relaxed text-texte-doux">{actu.resume}</p>}

      {actu.image && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={actu.image} alt="" className="mt-10 max-h-[460px] w-full rounded-2xl object-cover" />
      )}

      <div className="mt-10 space-y-6 text-lg leading-relaxed text-texte">
        {actu.contenu.split("\n\n").map((paragraphe, idx) => (
          <p key={idx}>{paragraphe}</p>
        ))}
      </div>

      {otherArticles.length > 0 && (
        <aside className="mt-20 border-t border-bordure pt-10">
          <h2 className="text-lg font-semibold">À lire aussi</h2>
          <ul className="mt-6 space-y-6">
            {otherArticles.map((a) => (
              <li key={a.id}>
                <Link href={`/portail/actualites/${a.slug}`} className="group">
                  <span className="text-sm text-texte-doux">{formatDate(a.publie_le)}</span>
                  <span className="mt-1 block font-semibold text-brun group-hover:underline">{a.titre}</span>
                </Link>
              </li>
            ))}
          </ul>
        </aside>
      )}
    </article>
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
            Chargement…
          </p>
        </div>
      }
    >
      <ActualiteDetailContent params={params} />
    </Suspense>
  );
}
