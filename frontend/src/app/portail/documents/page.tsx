"use client";

import { useEffect, useMemo, useState } from "react";
import { ApiErrorBanner, DemoBanner } from "@/components/ui";
import PageHero from "@/components/PageHero";
import { getDocumentsPublics, type DocumentPublic } from "@/lib/portal-api";

export default function DocumentsPortailPage() {
  const [items, setItems] = useState<DocumentPublic[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
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

  const filteredItems = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return items;
    return items.filter(
      (d) => d.titre.toLowerCase().includes(q) || d.description.toLowerCase().includes(q)
    );
  }, [items, searchQuery]);

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
    a.download = `${doc.titre.replace(/[^a-zA-Z0-9_-]/g, "_")}.${doc.format.toLowerCase()}`;
    a.target = "_blank";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);

    setDownloadSuccess(`Téléchargement de « ${doc.titre} » en cours…`);
    setTimeout(() => {
      setDownloadSuccess(null);
    }, 4500);
  };

  return (
    <>
      <PageHero image="/images/about-lab-students.png" title="Documents" subtitle="Modèles de candidature, règlements et guides à télécharger." />
    <div className="mx-auto w-full max-w-7xl px-4 py-16 sm:px-6 md:py-24 lg:px-8">
      <div className="max-w-4xl">

      {isDemo && <DemoBanner />}
      {error && <ApiErrorBanner message={error} onRetry={fetchDocs} />}
      {downloadSuccess && (
        <p role="status" className="mb-6 text-sm text-succes">
          {downloadSuccess}
        </p>
      )}

      <label htmlFor="doc-search" className="sr-only">
        Rechercher un document
      </label>
      <input
        id="doc-search"
        type="search"
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        placeholder="Rechercher un document"
        className="mb-8 w-full max-w-sm rounded-xl border border-bordure bg-white px-3.5 py-2.5 text-sm text-texte focus:border-beige focus:outline-none focus:ring-1 focus:ring-beige"
      />

      {loading ? (
        <p className="py-12 text-center text-sm text-texte-doux">Chargement…</p>
      ) : filteredItems.length === 0 ? (
        <p className="py-12 text-center text-texte-doux">Aucun document trouvé.</p>
      ) : (
        <ul className="border-t border-bordure">
          {filteredItems.map((doc) => (
            <li
              key={doc.id}
              className="flex flex-col gap-3 border-b border-bordure py-6 sm:flex-row sm:items-center sm:justify-between sm:gap-8"
            >
              <div className="min-w-0">
                <h2 className="font-semibold">{doc.titre}</h2>
                <p className="mt-1 line-clamp-2 text-sm text-texte-doux">{doc.description}</p>
                <p className="mt-1 text-xs text-texte-doux">
                  {doc.format} · {doc.taille}
                </p>
              </div>
              <button
                type="button"
                onClick={() => handleDownload(doc)}
                className="shrink-0 self-start text-sm font-semibold text-brun hover:underline sm:self-center"
              >
                Télécharger
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
    </div>
    </>
  );
}
