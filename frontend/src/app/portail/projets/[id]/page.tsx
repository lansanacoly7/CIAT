"use client";

import { Suspense, use, useEffect, useState } from "react";
import Link from "next/link";
import { ApiErrorBanner, ButtonLink, DemoBanner } from "@/components/ui";
import { getProjetIncubeById, type ProjetIncube } from "@/lib/portal-api";

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

const STATUT_LABELS: Record<ProjetIncube["statut"], string> = {
  prototype: "Prototype validé",
  incube: "En incubation",
  termine: "Incubation terminée",
};

function ProjetDetailContent({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [projet, setProjet] = useState<ProjetIncube | null>(null);
  const [loading, setLoading] = useState(true);
  const [isDemo, setIsDemo] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadProjet = () => {
    setLoading(true);
    setError(null);
    getProjetIncubeById(id)
      .then((res) => {
        setProjet(res.item);
        setIsDemo(Boolean(res.isDemo));
        setError(res.error);
        setLoading(false);
      })
      .catch(() => {
        setError("Impossible de charger la fiche de ce projet. Le service est momentanément indisponible.");
        setProjet(null);
        setIsDemo(false);
        setLoading(false);
      });
  };

  useEffect(() => {
    let ignore = false;
    getProjetIncubeById(id)
      .then((res) => {
        if (!ignore) {
          setProjet(res.item);
          setIsDemo(Boolean(res.isDemo));
          setError(res.error);
          setLoading(false);
        }
      })
      .catch(() => {
        if (!ignore) {
          setError("Impossible de charger la fiche de ce projet. Le service est momentanément indisponible.");
          setProjet(null);
          setIsDemo(false);
          setLoading(false);
        }
      });

    return () => {
      ignore = true;
    };
  }, [id]);

  if (loading) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-16 text-center">
        <p className="text-sm font-semibold text-brun animate-pulse">Chargement…</p>
      </div>
    );
  }

  if (error && !projet) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-16">
        <ApiErrorBanner message={error} onRetry={loadProjet} className="mb-6" />
        <div className="text-center">
          <ButtonLink href="/portail/projets" variant="secondary">
            ← Projets incubés
          </ButtonLink>
        </div>
      </div>
    );
  }

  if (!projet) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-16 text-center">
        <h1 className="text-2xl font-bold text-brun">Projet non répertorié</h1>
        <p className="mt-2 text-sm text-texte-doux">
          Le projet demandé n&apos;existe pas ou a été retiré de l&apos;annuaire public.
        </p>
        <div className="mt-6">
          <ButtonLink href="/portail/projets" variant="secondary">
            ← Projets incubés
          </ButtonLink>
        </div>
      </div>
    );
  }

  return (
    <article className="mx-auto max-w-3xl px-4 py-16 sm:px-6 md:py-24">
      {isDemo && <DemoBanner />}

      <Link href="/portail/projets" className="text-sm text-texte-doux hover:text-brun">
        ← Projets incubés
      </Link>

      <p className="mt-10 text-sm text-texte-doux">
        {projet.domaine.nom} · {STATUT_LABELS[projet.statut] ?? projet.statut}
      </p>
      <h1 className="mt-2 text-3xl font-bold leading-tight md:text-4xl">{projet.titre}</h1>
      <p className="mt-5 text-lg leading-relaxed text-texte-doux">{projet.resume}</p>

      <dl className="mt-10 grid gap-6 border-y border-bordure py-6 text-sm sm:grid-cols-3">
        <div>
          <dt className="text-texte-doux">Équipe</dt>
          <dd className="mt-1 font-medium">{projet.porteur_nom}</dd>
        </div>
        <div>
          <dt className="text-texte-doux">Cohorte</dt>
          <dd className="mt-1 font-medium">{projet.cohorte.nom}</dd>
        </div>
        <div>
          <dt className="text-texte-doux">Entrée en incubation</dt>
          <dd className="mt-1 font-medium">{formatDate(projet.cree_le)}</dd>
        </div>
      </dl>

      <div className="mt-12 space-y-10 leading-relaxed">
        <section>
          <h2 className="text-xl font-semibold">Le problème</h2>
          <p className="mt-3 text-texte-doux">{projet.probleme}</p>
        </section>
        <section>
          <h2 className="text-xl font-semibold">La solution</h2>
          <p className="mt-3 text-texte-doux">{projet.solution}</p>
        </section>
        {projet.impact_attendu && (
          <section>
            <h2 className="text-xl font-semibold">L&apos;impact attendu</h2>
            <p className="mt-3 text-texte-doux">{projet.impact_attendu}</p>
          </section>
        )}
        {projet.technologies && projet.technologies.length > 0 && (
          <section>
            <h2 className="text-xl font-semibold">Technologies</h2>
            <p className="mt-3 text-texte-doux">{projet.technologies.join(", ")}</p>
          </section>
        )}
      </div>
    </article>
  );
}

export default function ProjetDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-4xl px-4 py-16 text-center">
          <p className="text-sm font-semibold text-brun animate-pulse">Chargement…</p>
        </div>
      }
    >
      <ProjetDetailContent params={params} />
    </Suspense>
  );
}
