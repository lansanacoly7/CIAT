"use client";

import { useEffect, useState } from "react";
import { ApiErrorBanner, DemoBanner } from "@/components/ui";
import PageHero from "@/components/PageHero";
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
  const [isDemo, setIsDemo] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchEvenements = () => {
    setLoading(true);
    setError(null);
    getEvenements()
      .then((res) => {
        setItems(res.items);
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
    <>
      <PageHero image="/images/galerie_moments/projets-robotique.jpg" title="Agenda" subtitle="Journées de démonstration, ateliers et rencontres au CIAT." />
    <div className="mx-auto w-full max-w-7xl px-4 py-16 sm:px-6 md:py-24 lg:px-8">
      <div className="max-w-4xl">

      {isDemo && <DemoBanner />}
      {error && <ApiErrorBanner message={error} onRetry={fetchEvenements} />}

      {loading ? (
        <p className="py-12 text-center text-sm text-texte-doux">Chargement…</p>
      ) : error && items.length === 0 ? null : items.length === 0 ? (
        <p className="py-12 text-center text-texte-doux">Aucun événement à venir pour le moment.</p>
      ) : (
        <ul className="border-t border-bordure">
          {items.map((evt) => {
            const dateFmt = formatEventDate(evt.debut, evt.fin);
            return (
              <li key={evt.id} className="flex gap-6 border-b border-bordure py-8 sm:gap-10">
                <div className="w-14 shrink-0 text-center">
                  <span className="block text-xs font-medium text-beige">{dateFmt.moisCourt}</span>
                  <span className="block font-[family-name:var(--font-title)] text-3xl font-bold text-brun">
                    {dateFmt.jourNumero}
                  </span>
                </div>
                <div className="min-w-0">
                  <h2 className="text-lg font-semibold leading-snug">{evt.titre}</h2>
                  <p className="mt-1 text-sm text-texte-doux">
                    {dateFmt.horaires && `${dateFmt.horaires} · `}
                    {evt.lieu}
                  </p>
                  <p className="mt-3 leading-relaxed text-texte-doux">{evt.description}</p>
                  {evt.lien_inscription && (
                    <a
                      href={evt.lien_inscription}
                      className="mt-4 inline-block text-sm font-semibold text-brun hover:underline"
                    >
                      S&apos;inscrire →
                    </a>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
    </div>
    </>
  );
}
