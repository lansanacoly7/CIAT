"use client";

import { useEffect, useState } from "react";
import { ApiErrorBanner, Badge, ButtonLink, Card, DemoBanner, PageTitle } from "@/components/ui";
import { getEvenements, type Evenement } from "@/lib/portal-api";

function formatEventDate(debutStr: string, finStr: string) {
  try {
    const dDebut = new Date(debutStr);
    const dFin = new Date(finStr);

    const dateJour = new Intl.DateTimeFormat("fr-FR", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    }).format(dDebut);

    const heureDebut = new Intl.DateTimeFormat("fr-FR", {
      hour: "2-digit",
      minute: "2-digit",
    }).format(dDebut);

    const heureFin = new Intl.DateTimeFormat("fr-FR", {
      hour: "2-digit",
      minute: "2-digit",
    }).format(dFin);

    return {
      dateJour: dateJour.charAt(0).toUpperCase() + dateJour.slice(1),
      horaires: `${heureDebut} – ${heureFin}`,
      jourNumero: dDebut.getDate(),
      moisCourt: new Intl.DateTimeFormat("fr-FR", { month: "short" }).format(dDebut).toUpperCase(),
    };
  } catch {
    return {
      dateJour: debutStr,
      horaires: "",
      jourNumero: "--",
      moisCourt: "DATE",
    };
  }
}

export default function EvenementsPage() {
  const [items, setItems] = useState<Evenement[]>([]);
  const [loading, setLoading] = useState(true);
  const [fromApi, setFromApi] = useState(false);
  const [isDemo, setIsDemo] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchEvenements = () => {
    setLoading(true);
    setError(null);
    getEvenements()
      .then((res) => {
        setItems(res.items);
        setFromApi(res.fromApi);
        setIsDemo(Boolean(res.isDemo));
        setError(res.error);
        setLoading(false);
      })
      .catch(() => {
        setError("Les événements sont momentanément indisponibles. Réessayez plus tard.");
        setItems([]);
        setIsDemo(false);
        setLoading(false);
      });
  };

  useEffect(() => {
    let ignore = false;
    getEvenements()
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
          setError("Les événements sont momentanément indisponibles. Réessayez plus tard.");
          setItems([]);
          setIsDemo(false);
          setLoading(false);
        }
      });
    return () => {
      ignore = true;
    };
  }, []);

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 md:py-16">
      <PageTitle
        tag="Module 1 · Portail Public"
        title="Agenda des Événements & Ateliers"
        subtitle="Participez aux journées de démonstration, aux masterclasses technologiques et aux réunions d'évaluation du CIAT."
      />

      {/* Bandeau Mode Démonstration si activé explicitement */}
      {isDemo && <DemoBanner />}

      {/* État d'erreur réseau / serveur indisponible */}
      {error && <ApiErrorBanner message={error} onRetry={fetchEvenements} />}

      {/* Barre d'état */}
      {!error && (
        <div className="mb-6 flex items-center justify-between">
          <p className="text-xs text-texte-doux">
            {items.length} {items.length > 1 ? "événements programmés" : "événement programmé"}
          </p>
          <Badge tone={fromApi ? "succes" : isDemo ? "alerte" : "neutre"}>
            {fromApi ? "Flux API en direct" : isDemo ? "Données de démo" : "Hors-ligne"}
          </Badge>
        </div>
      )}

      {loading ? (
        <div className="rounded-2xl border border-bordure bg-ivoire p-12 text-center">
          <p className="text-sm font-semibold text-brun animate-pulse">Chargement du calendrier des événements...</p>
        </div>
      ) : error && items.length === 0 ? null : items.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-bordure bg-ivoire p-12 text-center">
          <p className="text-base font-bold text-brun">Aucun événement à venir pour le moment.</p>
          <p className="mt-2 text-sm text-texte-doux">
            Le calendrier des prochains jurys et séminaires techniques sera publié prochainement.
          </p>
          <div className="mt-6">
            <ButtonLink href="/portail" variant="secondary">
              Retour au portail
            </ButtonLink>
          </div>
        </div>
      ) : (

        /* Liste des Événements */
        <div className="space-y-6">
          {items.map((evt) => {
            const dateFmt = formatEventDate(evt.debut, evt.fin);
            return (
              <Card key={evt.id} className="transition-all hover:border-beige hover:shadow-md">
                <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
                  {/* Vignette calendrier */}
                  <div className="flex items-start gap-4">
                    <div className="flex h-16 w-16 shrink-0 flex-col items-center justify-center rounded-xl bg-brun text-white shadow-sm">
                      <span className="text-xs font-bold tracking-wider text-beige">
                        {dateFmt.moisCourt}
                      </span>
                      <span className="text-2xl font-extrabold leading-none">
                        {dateFmt.jourNumero}
                      </span>
                    </div>

                    {/* Informations principales */}
                    <div className="space-y-2">
                      <div className="flex flex-wrap items-center gap-2 text-xs">
                        <Badge tone="alerte">Événement CIAT</Badge>
                        <span className="font-semibold text-brun">
                          {dateFmt.dateJour}
                        </span>
                        {dateFmt.horaires && (
                          <span className="text-texte-doux">({dateFmt.horaires})</span>
                        )}
                      </div>

                      <h2 className="text-xl font-bold text-brun leading-snug">
                        {evt.titre}
                      </h2>

                      <p className="max-w-3xl text-sm leading-relaxed text-texte-doux">
                        {evt.description}
                      </p>

                      <div className="flex items-center gap-2 pt-1 text-xs text-texte-doux">
                        <span className="font-bold text-brun">Lieu :</span>
                        <span>{evt.lieu}</span>
                      </div>
                    </div>
                  </div>

                  {/* Action d'inscription */}
                  <div className="shrink-0 pt-2 md:pt-0">
                    {evt.lien_inscription ? (
                      <ButtonLink href={evt.lien_inscription} variant="accent" className="w-full text-xs md:w-auto">
                        S&apos;inscrire / Participer
                      </ButtonLink>
                    ) : (
                      <ButtonLink href="/portail" variant="secondary" className="w-full text-xs md:w-auto">
                        Accès libre
                      </ButtonLink>
                    )}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Navigation de bas de page */}
      <div className="mt-12 flex items-center justify-between border-t border-bordure pt-6">
        <ButtonLink href="/portail/actualites" variant="secondary" className="text-xs">
          ← Voir les actualités
        </ButtonLink>
        <ButtonLink href="/portail/appels" variant="secondary" className="text-xs">
          Consulter les appels à projets →
        </ButtonLink>
      </div>
    </div>
  );
}
