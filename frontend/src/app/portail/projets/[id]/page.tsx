"use client";

import { Suspense, use, useEffect, useState } from "react";
import { ApiErrorBanner, Badge, ButtonLink, DemoBanner, PageTitle } from "@/components/ui";
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

function getStatusBadge(statut: ProjetIncube["statut"]) {
  switch (statut) {
    case "prototype":
      return { label: "Prototype validé", tone: "info" as const };
    case "incube":
      return { label: "En incubation", tone: "alerte" as const };
    case "termine":
      return { label: "Incubation terminée", tone: "succes" as const };
    default:
      return { label: statut, tone: "neutre" as const };
  }
}

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
        <p className="text-sm font-semibold text-brun animate-pulse">Chargement de la fiche projet...</p>
      </div>
    );
  }

  if (error && !projet) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-16">
        <ApiErrorBanner message={error} onRetry={loadProjet} className="mb-6" />
        <div className="text-center">
          <ButtonLink href="/portail/projets" variant="secondary">
            ← Revenir à l&apos;annuaire des projets
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
            ← Revenir à l&apos;annuaire des projets
          </ButtonLink>
        </div>
      </div>
    );
  }

  const statusBadge = getStatusBadge(projet.statut);

  return (
    <article className="mx-auto max-w-4xl px-4 py-10 md:py-16">
      {/* Mode Démonstration si activé explicitement */}
      {isDemo && <DemoBanner className="mb-6" />}

      {/* Fil d'ariane & métadonnées */}
      <div className="mb-6 flex flex-wrap items-center gap-3 text-xs text-texte-doux">
        <ButtonLink href="/portail/projets" variant="secondary" className="!min-h-[36px] px-3 py-1 text-xs">
          ← Revenir à l&apos;annuaire des projets
        </ButtonLink>
        <span>·</span>
        <Badge tone={statusBadge.tone}>{statusBadge.label}</Badge>
        <span>·</span>
        <span className="font-semibold text-brun">{projet.cohorte.nom}</span>
      </div>

      <PageTitle
        tag={projet.domaine.nom}
        title={projet.titre}
        subtitle={projet.resume}
      />

      {/* Cartouche d'informations clés */}
      <div className="mt-8 rounded-2xl border border-bordure bg-white p-6 shadow-sm md:p-8">
        <div className="grid gap-6 sm:grid-cols-2 md:grid-cols-3 border-b border-bordure pb-6">
          <div>
            <span className="block text-xs font-bold uppercase tracking-wider text-texte-doux">
              Filière officielle
            </span>
            <span className="mt-1 block text-sm font-bold text-brun">
              {projet.domaine.nom}
            </span>
          </div>

          <div>
            <span className="block text-xs font-bold uppercase tracking-wider text-texte-doux">
              Équipe porteuse
            </span>
            <span className="mt-1 block text-sm font-bold text-brun">
              {projet.porteur_nom}
            </span>
          </div>

          <div>
            <span className="block text-xs font-bold uppercase tracking-wider text-texte-doux">
              Date d&apos;entrée en incubation
            </span>
            <span className="mt-1 block text-sm font-bold text-brun">
              {formatDate(projet.cree_le)}
            </span>
          </div>
        </div>

        {/* Sections descriptives complètes */}
        <div className="mt-8 space-y-8 text-base leading-relaxed text-texte">
          {/* Problème */}
          <div>
            <h2 className="flex items-center gap-2 text-lg font-bold text-brun">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-beige text-xs font-bold text-brun-fonce">
                1
              </span>
              Le Défi & la Problématique Identifiée
            </h2>
            <div className="mt-3 rounded-xl bg-ivoire p-5 text-sm leading-relaxed text-texte-doux">
              {projet.probleme}
            </div>
          </div>

          {/* Solution */}
          <div>
            <h2 className="flex items-center gap-2 text-lg font-bold text-brun">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-beige text-xs font-bold text-brun-fonce">
                2
              </span>
              La Solution Technologique Développée
            </h2>
            <div className="mt-3 rounded-xl bg-ivoire p-5 text-sm leading-relaxed text-texte-doux">
              {projet.solution}
            </div>
          </div>

          {/* Impact attendu */}
          {projet.impact_attendu && (
            <div>
              <h2 className="flex items-center gap-2 text-lg font-bold text-brun">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-beige text-xs font-bold text-brun-fonce">
                  3
                </span>
                Impact Territorial & Environnemental Attendu
              </h2>
              <div className="mt-3 rounded-xl border border-beige/40 bg-[#FAF7F2] p-5 text-sm leading-relaxed text-brun font-medium">
                {projet.impact_attendu}
              </div>
            </div>
          )}

          {/* Technologies mobilisées */}
          {projet.technologies && projet.technologies.length > 0 && (
            <div>
              <h3 className="text-sm font-bold uppercase tracking-wider text-texte-doux">
                Technologies & Spécifications Clés
              </h3>
              <div className="mt-3 flex flex-wrap gap-2">
                {projet.technologies.map((tech) => (
                  <span
                    key={tech}
                    className="rounded-lg border border-bordure bg-white px-3 py-1.5 text-xs font-semibold text-brun shadow-2xs"
                  >
                    {tech}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Pied de fiche institutionnelle */}
        <div className="mt-12 border-t border-bordure pt-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="text-xs text-texte-doux">
            Projet certifié par le <strong>Comité de Sélection & d&apos;Incubation du CIAT</strong><br />
            Institut Supérieur d&apos;Enseignement Professionnel (ISEP) Amadou Traoré de Diamniadio
          </div>

          <div className="flex gap-2">
            <ButtonLink href="/portail/appels" variant="accent" className="text-xs">
              Rejoindre l&apos;Incubateur
            </ButtonLink>
          </div>
        </div>
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
          <p className="text-sm font-semibold text-brun animate-pulse">Chargement de la fiche projet...</p>
        </div>
      }
    >
      <ProjetDetailContent params={params} />
    </Suspense>
  );
}
