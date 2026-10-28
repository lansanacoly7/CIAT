"use client";

import { useEffect, useMemo, useState } from "react";
import { ApiErrorBanner, Badge, Button, ButtonLink, Card, DemoBanner, PageTitle } from "@/components/ui";
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
  const [isDemo, setIsDemo] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [downloadSuccess, setDownloadSuccess] = useState<string | null>(null);

  const fetchDocs = () => {
    setLoading(true);
    setError(null);
    getDocumentsPublics("tous")
      .then((res) => {
        setItems(res.items);
        setIsDemo(Boolean(res.isDemo));
        setError(res.error);
        setLoading(false);
      })
      .catch(() => {
        setError("Les documents publics sont momentanément indisponibles. Réessayez plus tard.");
        setItems([]);
        setIsDemo(false);
        setLoading(false);
      });
  };

  useEffect(() => {
    let ignore = false;
    getDocumentsPublics("tous")
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
          setError("Les documents publics sont momentanément indisponibles. Réessayez plus tard.");
          setItems([]);
          setIsDemo(false);
          setLoading(false);
        }
      });

    return () => {
      ignore = true;
    };
  }, []);

  const normalizeCat = (cat: string) => {
    const c = (cat || "").toLowerCase();
    if (c.includes("candidature") || c.includes("formulaire")) return "candidature";
    if (c.includes("reglement") || c.includes("règlement") || c.includes("charte")) return "reglement";
    if (c.includes("guide") || c.includes("méthodologique") || c.includes("methodologique")) return "guide";
    if (c.includes("rapport") || c.includes("activité") || c.includes("activite")) return "rapport";
    return c;
  };

  const visibleItems = useMemo(() => {
    if (selectedCat === "tous") return items;
    return items.filter((d) => normalizeCat(d.categorie) === selectedCat);
  }, [items, selectedCat]);

  const handleDownload = (doc: DocumentPublic) => {
    let url = doc.fichier_url;
    if (!url || url === "#") {
      const lower = doc.titre.toLowerCase();
      if (lower.includes("charte") || lower.includes("intellectuelle")) {
        url = "/media/documents_publics/charte_propriete_intellectuelle_ciat.pdf";
      } else if (lower.includes("règlement") || lower.includes("reglement")) {
        url = "/media/documents_publics/reglement_interieur_incubateur_ciat.pdf";
      } else {
        url = "/media/documents_publics/dossier_candidature_incubation_2026.pdf";
      }
    }

    const finalUrl = url.startsWith("http")
      ? url
      : url.startsWith("/")
      ? url
      : `/${url}`;

    const a = document.createElement("a");
    a.href = finalUrl;
    a.download = `${doc.titre.replace(/[^a-zA-Z0-9_-]/g, "_")}.pdf`;
    a.target = "_blank";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);

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

      {/* Mode Démonstration si activé explicitement */}
      {isDemo && <DemoBanner className="mb-6" />}

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

      {/* État d'erreur */}
      {error && (
        <ApiErrorBanner
          message={error}
          onRetry={() => fetchDocs()}
          className="mb-8"
        />
      )}

      {/* Compteur de documents (badge supprimé à la demande) */}
      {!error && (
        <div className="mb-6 flex items-center justify-between">
          <p className="text-xs text-texte-doux font-semibold">
            {visibleItems.length}{" "}
            {visibleItems.length > 1
              ? "documents disponibles"
              : "document disponible"}
          </p>
        </div>
      )}

      {/* Filtres par catégorie */}
      {!error && items.length > 0 && (
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
      ) : error && items.length === 0 ? null : visibleItems.length === 0 ? (
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
          {visibleItems.map((doc) => {
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
