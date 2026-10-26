"use client";

import { useEffect, useState } from "react";
import { ApiErrorBanner, Badge, ButtonLink, Card, DemoBanner, PageTitle } from "@/components/ui";
import { getAppelsProjets, type AppelProjet } from "@/lib/portal-api";

function formatDateLimite(dateStr: string) {
  try {
    const d = new Date(dateStr);
    return new Intl.DateTimeFormat("fr-FR", {
      day: "numeric",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(d);
  } catch {
    return dateStr;
  }
}

export default function AppelsPage() {
  const [items, setItems] = useState<AppelProjet[]>([]);
  const [loading, setLoading] = useState(true);
  const [fromApi, setFromApi] = useState(false);
  const [isDemo, setIsDemo] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAppels = () => {
    setLoading(true);
    setError(null);
    getAppelsProjets()
      .then((res) => {
        setItems(res.items);
        setFromApi(res.fromApi);
        setIsDemo(Boolean(res.isDemo));
        setError(res.error);
        setLoading(false);
      })
      .catch(() => {
        setError("Les appels à projets sont momentanément indisponibles. Réessayez plus tard.");
        setItems([]);
        setIsDemo(false);
        setLoading(false);
      });
  };

  useEffect(() => {
    let ignore = false;
    getAppelsProjets()
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
          setError("Les appels à projets sont momentanément indisponibles. Réessayez plus tard.");
          setItems([]);
          setIsDemo(false);
          setLoading(false);
        }
      });
    return () => {
      ignore = true;
    };
  }, []);

  const ouverts = items.filter((a) => a.statut === "ouvert");
  const clos = items.filter((a) => a.statut === "clos");

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 md:py-16">
      <PageTitle
        tag="Module 1 · Portail Public"
        title="Appels à Candidatures & Sélections"
        subtitle="Rejoignez l'incubateur du CIAT. Chaque appel vous permet de soumettre votre idée, de passer en comité et de bénéficier d'un accompagnement personnalisé."
      />

      {/* Bandeau Mode Démonstration si activé explicitement */}
      {isDemo && <DemoBanner />}

      {/* État d'erreur réseau / serveur indisponible */}
      {error && <ApiErrorBanner message={error} onRetry={fetchAppels} />}

      {/* Barre d'état */}
      {!error && (
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3 text-xs text-texte-doux">
            <span>{ouverts.length} appel(s) ouvert(s)</span>
            <span>·</span>
            <span>{clos.length} appel(s) archivé(s)</span>
          </div>
          <Badge tone={fromApi ? "succes" : isDemo ? "alerte" : "neutre"}>
            {fromApi ? "Connecté à l'API" : isDemo ? "Données de démo" : "Hors-ligne"}
          </Badge>
        </div>
      )}

      {loading ? (
        <div className="rounded-2xl border border-bordure bg-ivoire p-12 text-center">
          <p className="text-sm font-semibold text-brun animate-pulse">Chargement des appels à candidatures...</p>
        </div>
      ) : error && items.length === 0 ? null : items.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-bordure bg-ivoire p-12 text-center">
          <p className="text-base font-bold text-brun">Aucun appel à projets répertorié actuellement.</p>
          <p className="mt-2 text-sm text-texte-doux">
            Le lancement des prochains appels de cohortes sera notifié sur cette page.
          </p>
          <div className="mt-6">
            <ButtonLink href="/portail" variant="secondary">
              Retour au portail
            </ButtonLink>
          </div>
        </div>
      ) : (

        <div className="space-y-8">
          {/* Section Appels Ouverts */}
          <div>
            <h2 className="mb-4 text-xl font-bold text-brun">
              Appels en cours de réception ({ouverts.length})
            </h2>

            {ouverts.length === 0 ? (
              <p className="text-sm text-texte-doux italic">Aucun appel ouvert pour le moment.</p>
            ) : (
              <div className="space-y-6">
                {ouverts.map((appel) => (
                  <Card key={appel.id} className="border-l-4 border-l-succes transition-all hover:shadow-md">
                    <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
                      <div className="space-y-3">
                        <div className="flex flex-wrap items-center gap-3">
                          <Badge tone="succes">Appel Ouvert</Badge>
                          <span className="text-xs text-texte-doux">
                            Clôture des dépôts : <strong className="text-brun">{formatDateLimite(appel.date_limite)}</strong>
                          </span>
                        </div>

                        <h3 className="text-xl font-bold text-brun leading-snug">
                          {appel.titre}
                        </h3>

                        <p className="max-w-3xl text-sm leading-relaxed text-texte">
                          {appel.description}
                        </p>

                        {/* Pièces justificatives requises */}
                        <div className="rounded-xl border border-bordure bg-white p-4">
                          <p className="text-xs font-bold text-brun uppercase tracking-wider">
                            Pièces obligatoires à fournir au dépôt :
                          </p>
                          <ul className="mt-2 grid gap-1 sm:grid-cols-2 text-xs text-texte-doux">
                            {appel.pieces_demandees.map((piece, i) => (
                              <li key={i} className="flex items-center gap-2">
                                <span className="text-succes font-bold">✓</span>
                                <span>{piece}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>

                      {/* Action Candidater -> Redirection vers /incubateur ou /connexion */}
                      <div className="shrink-0 pt-2 md:pt-0">
                        <ButtonLink
                          href="/connexion?next=/incubateur"
                          variant="primary"
                          className="w-full text-sm font-bold shadow-sm md:w-auto px-6 py-3"
                        >
                          Candidater à cet appel →
                        </ButtonLink>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>

          {/* Section Appels Clos (Archivés) */}
          {clos.length > 0 && (
            <div className="pt-6 border-t border-bordure">
              <h2 className="mb-4 text-lg font-bold text-texte-doux">
                Appels clos &amp; Sessions passées ({clos.length})
              </h2>

              <div className="space-y-4 opacity-80">
                {clos.map((appel) => (
                  <div
                    key={appel.id}
                    className="rounded-xl border border-bordure bg-white p-6 shadow-sm"
                  >
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <Badge tone="neutre">Session Clôturée</Badge>
                          <span className="text-xs text-texte-doux">
                            Clôturé le {formatDateLimite(appel.date_limite)}
                          </span>
                        </div>
                        <h3 className="mt-2 text-base font-bold text-brun">{appel.titre}</h3>
                        <p className="mt-1 text-xs text-texte-doux">{appel.description}</p>
                      </div>

                      <div className="shrink-0">
                        <span className="inline-block rounded-lg bg-gray-100 px-4 py-2 text-xs font-semibold text-gray-500">
                          Candidatures closes
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Navigation de bas de page */}
      <div className="mt-12 flex items-center justify-between border-t border-bordure pt-6">
        <ButtonLink href="/portail/evenements" variant="secondary" className="text-xs">
          ← Consulter l&apos;agenda des événements
        </ButtonLink>
        <ButtonLink href="/portail/incubateur" variant="secondary" className="text-xs">
          Comprendre le parcours d&apos;incubation →
        </ButtonLink>
      </div>
    </div>
  );
}
