"use client";

import { Suspense, use, useEffect, useState } from "react";
import { Badge, ButtonLink, PageTitle } from "@/components/ui";
import { getActualiteBySlug, type Actualite } from "@/lib/portal-api";

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
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let ignore = false;
    getActualiteBySlug(slug).then((res) => {
      if (!ignore) {
        setActu(res);
        setLoading(false);
      }
    });
    return () => {
      ignore = true;
    };
  }, [slug]);

  if (loading) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-16 text-center">
        <p className="text-sm font-semibold text-brun animate-pulse">Chargement de l&apos;article...</p>
      </div>
    );
  }

  if (!actu) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-16 text-center">
        <h1 className="text-2xl font-bold text-brun">Article non trouvé</h1>
        <p className="mt-2 text-sm text-texte-doux">
          L&apos;actualité demandée n&apos;existe pas ou a été déplacée.
        </p>
        <div className="mt-6">
          <ButtonLink href="/portail/actualites" variant="secondary">
            ← Revenir aux actualités
          </ButtonLink>
        </div>
      </div>
    );
  }

  return (
    <article className="mx-auto max-w-4xl px-4 py-10 md:py-16">
      {/* Fil d'ariane & métadonnées */}
      <div className="mb-4 flex flex-wrap items-center gap-3 text-xs text-texte-doux">
        <ButtonLink href="/portail/actualites" variant="secondary" className="!min-h-[36px] px-3 py-1 text-xs">
          ← Toutes les actualités
        </ButtonLink>
        <span>·</span>
        <Badge tone="neutre">Publication Officielle</Badge>
        <span>·</span>
        <time dateTime={actu.publie_le}>{formatDate(actu.publie_le)}</time>
      </div>

      <PageTitle
        title={actu.titre}
        subtitle={actu.resume}
      />

      {/* Contenu de l'article */}
      <div className="mt-8 rounded-2xl border border-bordure bg-white p-8 md:p-12 shadow-sm">
        <div className="space-y-6 text-base leading-relaxed text-texte">
          {actu.contenu.split("\n\n").map((paragraphe, idx) => (
            <p key={idx} className="leading-relaxed">
              {paragraphe}
            </p>
          ))}
        </div>

        {/* Pied d'article institutionnel */}
        <div className="mt-12 border-t border-bordure pt-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="text-xs text-texte-doux">
            Source : <strong>Direction de la Communication et de l&apos;Innovation, CIAT</strong><br />
            Institut Supérieur d&apos;Enseignement Professionnel (ISEP) Amadou Traoré de Diamniadio
          </div>

          <div className="flex gap-2">
            <ButtonLink href="/portail/appels" variant="accent" className="text-xs">
              Voir les Appels à Projets
            </ButtonLink>
          </div>
        </div>
      </div>
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
        <div className="mx-auto max-w-4xl px-4 py-16 text-center">
          <p className="text-sm font-semibold text-brun animate-pulse">Chargement de l&apos;article...</p>
        </div>
      }
    >
      <ActualiteDetailContent params={params} />
    </Suspense>
  );
}
