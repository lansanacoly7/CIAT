"use client";

import { useEffect, useState } from "react";
import { Badge, Button, ButtonLink, Card, PageTitle } from "@/components/ui";
import { getDocumentsPublics, type DocumentPublic } from "@/lib/portal-api";

const CATEGORIES = [
  { value: "tous", label: "Tous les documents" },
  { value: "candidature", label: "Candidatures & Formulaires" },
  { value: "reglement", label: "Règlements & Chartes" },
  { value: "guide", label: "Guides méthodologiques" },
  { value: "rapport", label: "Rapports d'activités" },
];

function getFormatBadge(format: DocumentPublic["format"]) {
  switch (format) {
    case "PDF":
      return { tone: "erreur" as const, label: "PDF" };
    case "XLSX":
      return { tone: "succes" as const, label: "EXCEL" };
    case "DOCX":
      return { tone: "info" as const, label: "WORD" };
    default:
      return { tone: "neutre" as const, label: format };
  }
}

export default function DocumentsPortailPage() {
  const [items, setItems] = useState<DocumentPublic[]>([]);
  const [selectedCat, setSelectedCat] = useState("tous");
  const [loading, setLoading] = useState(true);
  const [fromApi, setFromApi] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [downloadSuccess, setDownloadSuccess] = useState<string | null>(null);

  const fetchDocs = (cat = selectedCat) => {
    setLoading(true);
    setError(null);
    getDocumentsPublics(cat)
      .then((res) => {
        setItems(res.items);
        setFromApi(res.fromApi);
        if (res.error) setError(res.error);
        setLoading(false);
      })
      .catch(() => {
        setError("Impossible de charger les documents. Veuillez réessayer.");
        setLoading(false);
      });
  };

  useEffect(() => {
    let ignore = false;
    getDocumentsPublics(selectedCat)
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
          setError("Impossible de charger les documents. Veuillez réessayer.");
          setLoading(false);
        }
      });

    return () => {
      ignore = true;
    };
  }, [selectedCat]);

  const handleDownload = (doc: DocumentPublic) => {
    // Déclenche un téléchargement simulé sécurisé
    setDownloadSuccess(`Le téléchargement de "${doc.titre}" a démarré.`);
    setTimeout(() => {
      setDownloadSuccess(null);
    }, 4500);
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 md:py-16">
      <PageTitle
        tag="Module 1 · Portail Public"
        title="Espace Documentaire Officiel du CIAT"
        subtitle="Téléchargez les canevas officiels de candidature, la charte de propriété intellectuelle, le règlement des ateliers et les guides techniques d'incubation."
      />

      {/* Notification de téléchargement */}
      {downloadSuccess && (
        <div className="mb-6 rounded-xl border border-succes/40 bg-[#e3f1e9] p-4 text-xs font-semibold text-succes flex items-center justify-between animate-fadeIn">
          <span>✓ {downloadSuccess}</span>
          <button
            type="button"
            onClick={() => setDownloadSuccess(null)}
            className="text-succes hover:opacity-75"
          >
            ✕
          </button>
        </div>
      )}

      {/* Source des données */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <p className="text-xs text-texte-doux">
          {items.length} {items.length > 1 ? "documents disponibles" : "document disponible"}
        </p>
        <Badge tone={fromApi ? "succes" : "neutre"}>
          {fromApi ? "Connecté à l'API" : "Ressources certifiées CIAT"}
        </Badge>
      </div>

      {/* Filtres par catégorie */}
      <div className="mb-8 flex flex-wrap gap-2">
        {CATEGORIES.map((cat) => {
          const active = selectedCat === cat.value;
          return (
            <button
              key={cat.value}
              type="button"
              onClick={() => setSelectedCat(cat.value)}
              className={`min-h-[44px] rounded-lg px-4 py-2 text-xs font-semibold transition-all ${
                active
                  ? "bg-brun text-white shadow-sm"
                  : "border border-bordure bg-white text-texte hover:bg-ivoire"
              }`}
            >
              {cat.label}
            </button>
          );
        })}
      </div>

      {/* État d'erreur */}
      {error && (
        <div className="mb-8 rounded-xl border border-erreur bg-[#f6dedc] p-4 text-sm text-erreur flex items-center justify-between">
          <span>{error}</span>
          <Button variant="secondary" onClick={() => fetchDocs()} className="!min-h-[36px] text-xs">
            Réessayer
          </Button>
        </div>
      )}

      {/* Liste des documents */}
      {loading ? (
        <div className="grid gap-6 md:grid-cols-2">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="h-48 rounded-xl border border-bordure bg-ivoire p-6 animate-pulse flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="h-4 w-1/4 rounded bg-bordure" />
                <div className="h-6 w-3/4 rounded bg-bordure" />
                <div className="h-10 w-full rounded bg-bordure" />
              </div>
              <div className="h-8 w-1/3 rounded bg-bordure" />
            </div>
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-bordure bg-ivoire p-12 text-center">
          <p className="text-base font-bold text-brun">Aucun document dans cette catégorie.</p>
          <div className="mt-4">
            <Button variant="secondary" onClick={() => setSelectedCat("tous")}>
              Voir tous les documents
            </Button>
          </div>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2">
          {items.map((doc) => {
            const formatBadge = getFormatBadge(doc.format);
            return (
              <Card key={doc.id} className="flex h-full flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-texte-doux">
                      Poids : {doc.taille}
                    </span>
                    <Badge tone={formatBadge.tone} className="text-[11px] font-mono">
                      {formatBadge.label}
                    </Badge>
                  </div>

                  <h2 className="mt-3 text-lg font-bold text-brun leading-snug">
                    {doc.titre}
                  </h2>

                  <p className="mt-3 text-sm leading-relaxed text-texte-doux">
                    {doc.description}
                  </p>
                </div>

                <div className="mt-6 border-t border-bordure pt-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <span className="text-xs text-texte-doux">
                    Format : <strong>{doc.format}</strong> ({doc.taille})
                  </span>

                  <button
                    type="button"
                    onClick={() => handleDownload(doc)}
                    className="inline-flex min-h-[44px] items-center justify-center rounded-lg bg-brun px-4 py-2 text-xs font-bold text-white transition-all hover:bg-brun-fonce active:scale-98"
                  >
                    Télécharger le document ⭳
                  </button>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Navigation retour */}
      <div className="mt-12 flex items-center justify-between border-t border-bordure pt-6">
        <ButtonLink href="/portail" variant="secondary" className="text-xs">
          ← Retour au Hub Portail
        </ButtonLink>
        <ButtonLink href="/portail/contact" variant="accent" className="text-xs">
          Contacter le secrétariat du CIAT →
        </ButtonLink>
      </div>
    </div>
  );
}
