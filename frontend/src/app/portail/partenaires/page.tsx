"use client";

import { useEffect, useState } from "react";
import { ApiErrorBanner, Badge, Button, ButtonLink, Card, DemoBanner, PageTitle } from "@/components/ui";
import { getPartenaires, type Partenaire } from "@/lib/portal-api";

const TYPE_CONFIG = {
  institutionnel: { label: "Institutionnel", tone: "neutre" as const },
  academique: { label: "Académique & Recherche", tone: "info" as const },
  industriel: { label: "Industriel & Technologique", tone: "alerte" as const },
  financier: { label: "Financier & Amorçage", tone: "succes" as const },
};

export default function PartenairesPage() {
  const [items, setItems] = useState<Partenaire[]>([]);
  const [filterType, setFilterType] = useState<string>("tous");
  const [loading, setLoading] = useState(true);
  const [fromApi, setFromApi] = useState(false);
  const [isDemo, setIsDemo] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPartenaires = () => {
    setLoading(true);
    setError(null);
    getPartenaires()
      .then((res) => {
        setItems(res.items);
        setFromApi(res.fromApi);
        setIsDemo(Boolean(res.isDemo));
        setError(res.error);
        setLoading(false);
      })
      .catch(() => {
        setError("Les partenaires sont momentanément indisponibles. Réessayez plus tard.");
        setItems([]);
        setIsDemo(false);
        setLoading(false);
      });
  };

  useEffect(() => {
    let ignore = false;
    getPartenaires()
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
          setError("Les partenaires sont momentanément indisponibles. Réessayez plus tard.");
          setItems([]);
          setIsDemo(false);
          setLoading(false);
        }
      });

    return () => {
      ignore = true;
    };
  }, []);

  const filteredItems =
    filterType === "tous"
      ? items
      : items.filter((p) => p.type === filterType);

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 md:py-16">
      <PageTitle
        tag="Module 1 · Portail Public"
        title="Réseau des Partenaires de l'Écosystème CIAT"
        subtitle="Institutions régaliennes, pôles universitaires, fonds d'amorçage et industriels engagés aux côtés du CIAT pour dynamiser le transfert de technologie et la valorisation des compétences à Diamniadio."
      />

      {/* Mode Démonstration si activé explicitement */}
      {isDemo && <DemoBanner className="mb-6" />}

      {/* État d'erreur réseau */}
      {error && (
        <ApiErrorBanner
          message={error}
          onRetry={fetchPartenaires}
          className="mb-8"
        />
      )}

      {/* Barre d'état source */}
      {!error && (
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <p className="text-xs text-texte-doux">
            {filteredItems.length} {filteredItems.length > 1 ? "partenaires répertoriés" : "partenaire répertorié"}
          </p>
          <Badge tone={fromApi ? "succes" : isDemo ? "alerte" : "neutre"}>
            {fromApi ? "Connecté à l'API" : isDemo ? "Mode démo" : "CIAT"}
          </Badge>
        </div>
      )}

      {/* Filtres par typologie */}
      {!error && items.length > 0 && (
        <div className="mb-8 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setFilterType("tous")}
            className={`min-h-[44px] rounded-lg px-4 py-2 text-xs font-semibold transition-all ${
              filterType === "tous"
                ? "bg-brun text-white shadow-sm"
                : "border border-bordure bg-white text-texte hover:bg-ivoire"
            }`}
          >
            Tous les partenaires ({items.length})
          </button>

          {Object.entries(TYPE_CONFIG).map(([key, cfg]) => {
            const count = items.filter((p) => p.type === key).length;
            const active = filterType === key;
            return (
              <button
                key={key}
                type="button"
                onClick={() => setFilterType(key)}
                className={`min-h-[44px] rounded-lg px-4 py-2 text-xs font-semibold transition-all ${
                  active
                    ? "bg-brun text-white shadow-sm"
                    : "border border-bordure bg-white text-texte hover:bg-ivoire"
                }`}
              >
                {cfg.label} ({count})
              </button>
            );
          })}
        </div>
      )}

      {/* Grille des partenaires */}
      {loading ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div
              key={i}
              className="h-64 rounded-xl border border-bordure bg-ivoire p-6 animate-pulse flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="h-5 w-1/3 rounded bg-bordure" />
                <div className="h-6 w-3/4 rounded bg-bordure" />
                <div className="h-16 w-full rounded bg-bordure" />
              </div>
              <div className="h-4 w-1/2 rounded bg-bordure" />
            </div>
          ))}
        </div>
      ) : error && items.length === 0 ? null : filteredItems.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-bordure bg-ivoire p-12 text-center">
          <p className="text-base font-bold text-brun">Aucun partenaire dans cette catégorie pour le moment.</p>
          <div className="mt-4">
            <Button variant="secondary" onClick={() => setFilterType("tous")}>
              Voir tous les partenaires
            </Button>
          </div>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredItems.map((partenaire) => {
            const typeInfo = TYPE_CONFIG[partenaire.type] || {
              label: partenaire.type,
              tone: "neutre" as const,
            };

            return (
              <Card key={partenaire.id} className="flex h-full flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-black tracking-wider text-beige">
                      {partenaire.sigle || "PARTENAIRE"}
                    </span>
                    <Badge tone={typeInfo.tone} className="text-[11px]">
                      {typeInfo.label}
                    </Badge>
                  </div>

                  <h2 className="mt-3 text-lg font-bold text-brun leading-snug">
                    {partenaire.nom}
                  </h2>

                  <p className="mt-3 text-sm leading-relaxed text-texte-doux">
                    {partenaire.description}
                  </p>

                  <div className="mt-4 rounded-lg bg-ivoire border border-bordure/60 p-3">
                    <span className="block text-[11px] font-bold uppercase tracking-wider text-texte-doux">
                      Axe de coopération
                    </span>
                    <p className="mt-1 text-xs font-semibold text-brun">
                      {partenaire.domaine_collaboration}
                    </p>
                  </div>
                </div>

                <div className="mt-6 border-t border-bordure pt-4 flex items-center justify-between">
                  {partenaire.site_web ? (
                    <a
                      href={partenaire.site_web}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex min-h-[44px] items-center text-xs font-bold text-brun hover:text-brun-fonce hover:underline"
                    >
                      Consulter le site officiel ↗
                    </a>
                  ) : (
                    <span className="text-xs text-texte-doux">Partenaire conventionné</span>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Bloc CTA Rejoindre le Réseau */}
      <div className="mt-16 rounded-2xl border border-beige bg-gradient-to-br from-ivoire to-white p-8 md:p-12 text-center shadow-xs">
        <h3 className="text-xl font-bold text-brun md:text-2xl">
          Vous souhaitez collaborer avec le CIAT ?
        </h3>
        <p className="mx-auto mt-3 max-w-2xl text-sm leading-relaxed text-texte-doux">
          Industriels, investisseurs, laboratoires de recherche ou institutions : devenez partenaire pour accueillir des prototypes en test, financer une cohorte ou co-développer des technologies à fort impact.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-4">
          <ButtonLink href="/portail/contact" variant="primary">
            Proposer une convention de partenariat
          </ButtonLink>
          <ButtonLink href="/portail/projets" variant="secondary">
            Explorer les projets incubés
          </ButtonLink>
        </div>
      </div>

      {/* Navigation retour */}
      <div className="mt-12 flex items-center justify-between border-t border-bordure pt-6">
        <ButtonLink href="/portail" variant="secondary" className="text-xs">
          ← Retour au Hub Portail
        </ButtonLink>
        <ButtonLink href="/portail/documents" variant="secondary" className="text-xs">
          Consulter l&apos;espace documentaire →
        </ButtonLink>
      </div>
    </div>
  );
}
