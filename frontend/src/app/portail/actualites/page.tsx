"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Badge, Button, ButtonLink, Card, PageTitle } from "@/components/ui";
import { getActualites, type Actualite } from "@/lib/portal-api";

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

export default function ActualitesPage() {
  const [items, setItems] = useState<Actualite[]>([]);
  const [loading, setLoading] = useState(true);
  const [fromApi, setFromApi] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchActualites = () => {
    setLoading(true);
    setError(null);
    getActualites()
      .then((res) => {
        setItems(res.items);
        setFromApi(res.fromApi);
        if (res.error) setError(res.error);
        setLoading(false);
      })
      .catch(() => {
        setError("Impossible de charger les actualités. Veuillez réessayer.");
        setLoading(false);
      });
  };

  useEffect(() => {
    let ignore = false;
    getActualites()
      .then((res) => {
        if (!ignore) {
          setItems(res.items);
          setFromApi(res.fromApi);
          if (res.error) setError(res.error);
          setLoading(false);
        }
      })
      .catch(() => {
        if (!ignore) {
          setError("Impossible de charger les actualités. Veuillez réessayer.");
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
        title="Actualités du CIAT & de l'ISEP"
        subtitle="Découvrez les avancées des projets, les accords de transfert technologique et la vie de notre incubateur à Diamniadio."
      />

      {/* État d'erreur réseau si survenu */}
      {error && (
        <div className="mb-8 rounded-xl border border-erreur bg-[#f6dedc] p-4 text-sm text-erreur flex items-center justify-between">
          <span>{error}</span>
          <Button variant="secondary" onClick={fetchActualites} className="!min-h-[36px] text-xs">
            Réessayer
          </Button>
        </div>
      )}

      {/* Source des données */}
      <div className="mb-6 flex items-center justify-between">
        <p className="text-xs text-texte-doux">
          {items.length} {items.length > 1 ? "articles répertoriés" : "article répertorié"}
        </p>
        <Badge tone={fromApi ? "succes" : "neutre"}>
          {fromApi ? "Connecté à l'API" : "Synchronisé"}
        </Badge>
      </div>

      {loading ? (
        <div className="rounded-2xl border border-bordure bg-ivoire p-12 text-center">
          <p className="text-sm font-semibold text-brun animate-pulse">Chargement des actualités officielles...</p>
        </div>
      ) : items.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-bordure bg-ivoire p-12 text-center">
          <p className="text-base font-bold text-brun">Aucune actualité publiée pour le moment.</p>
          <p className="mt-2 text-sm text-texte-doux">
            Les futures publications du centre d&apos;innovation apparaîtront directement ici.
          </p>
          <div className="mt-6">
            <ButtonLink href="/portail" variant="secondary">
              Retour au portail
            </ButtonLink>
          </div>
        </div>
      ) : (
        /* Grille des Actualités */
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {items.map((actu) => (
            <Card key={actu.id} className="flex h-full flex-col justify-between">
              <div>
                <div className="flex items-center justify-between text-xs text-texte-doux">
                  <span>{formatDate(actu.publie_le)}</span>
                  <span className="font-semibold text-beige">CIAT</span>
                </div>

                <h2 className="mt-3 text-lg font-bold text-brun leading-snug">
                  {actu.titre}
                </h2>

                <p className="mt-3 text-sm leading-relaxed text-texte-doux line-clamp-3">
                  {actu.resume}
                </p>
              </div>

              <div className="mt-6 border-t border-bordure pt-4">
                <Link
                  href={`/portail/actualites/${actu.slug}`}
                  className="inline-flex items-center text-sm font-bold text-brun hover:text-brun-fonce hover:underline"
                >
                  Lire l&apos;article complet →
                </Link>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Navigation retour */}
      <div className="mt-12 flex items-center justify-between border-t border-bordure pt-6">
        <ButtonLink href="/portail" variant="secondary" className="text-xs">
          ← Retour au Hub Portail
        </ButtonLink>
        <ButtonLink href="/portail/evenements" variant="secondary" className="text-xs">
          Consulter l&apos;agenda des événements →
        </ButtonLink>
      </div>
    </div>
  );
}
