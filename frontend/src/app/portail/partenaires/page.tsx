"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ApiErrorBanner, DemoBanner } from "@/components/ui";
import PageHero from "@/components/PageHero";
import { getPartenaires, type Partenaire } from "@/lib/portal-api";

const GROUPES: { type: Partenaire["type"]; titre: string }[] = [
  { type: "institutionnel", titre: "Institutions" },
  { type: "industriel", titre: "Entreprises" },
  { type: "financier", titre: "Financeurs" },
  { type: "academique", titre: "Universités et recherche" },
];

function Logo({ logo }: { logo?: string }) {
  const [loadError, setLoadError] = useState(false);
  if (!logo || loadError) return null;
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={logo}
      alt=""
      onError={() => setLoadError(true)}
      className="h-14 w-14 shrink-0 object-contain"
      loading="lazy"
      decoding="async"
    />
  );
}

export default function PartenairesPage() {
  const [items, setItems] = useState<Partenaire[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDemo, setIsDemo] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = (isCancelled: () => boolean = () => false) => {
    getPartenaires()
      .then((res) => {
        if (isCancelled()) return;
        setItems(res.items);
        setIsDemo(Boolean(res.isDemo));
        setError(res.error);
        setLoading(false);
      })
      .catch(() => {
        if (isCancelled()) return;
        setError("Les partenaires sont momentanément indisponibles. Réessayez plus tard.");
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
      <PageHero image="/images/ciat_forum.jpg" title="Partenaires" subtitle="Les institutions, entreprises et financeurs qui accompagnent le CIAT." />
    <div className="mx-auto w-full max-w-7xl px-4 py-16 sm:px-6 md:py-24 lg:px-8">

      {isDemo && <DemoBanner />}
      {error && <ApiErrorBanner message={error} onRetry={() => load()} />}

      {loading ? (
        <p className="py-12 text-center text-sm text-texte-doux">Chargement…</p>
      ) : (
        <div className="space-y-16">
          {GROUPES.map(({ type, titre }) => {
            const liste = items.filter((p) => p.type === type);
            if (liste.length === 0) return null;
            return (
              <section key={type}>
                <h2 className="text-xl font-semibold">{titre}</h2>
                <div className="mt-6 grid gap-x-10 gap-y-8 md:grid-cols-2">
                  {liste.map((p) => (
                    <article key={p.id} className="flex gap-5">
                      <Logo logo={p.logo} />
                      <div className="min-w-0">
                        <h3 className="font-semibold leading-snug">{p.nom}</h3>
                        <p className="mt-1 line-clamp-2 text-sm leading-relaxed text-texte-doux">
                          {p.description}
                        </p>
                        {p.site_web && (
                          <a
                            href={p.site_web}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="mt-2 inline-block text-sm font-medium text-brun hover:underline"
                          >
                            Site web ↗
                          </a>
                        )}
                      </div>
                    </article>
                  ))}
                </div>
              </section>
            );
          })}
        </div>
      )}

      <p className="mt-20 border-t border-bordure pt-10 text-texte-doux">
        Vous souhaitez devenir partenaire ?{" "}
        <Link href="/portail/contact" className="font-medium text-brun hover:underline">
          Écrivez-nous
        </Link>
        .
      </p>
    </div>
    </>
  );
}
