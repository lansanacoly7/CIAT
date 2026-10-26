"use client";

import { useEffect, useState } from "react";
import {
  getDocuments,
  telechargerExportDocument,
  STATUT_DOC_LABELS,
  type DocumentListItem,
} from "@/lib/documents";
import { ApiError } from "@/lib/api";
import { Badge, Button } from "@/components/ui";

interface DocumentListProps {
  onSelectDocument: (id: number) => void;
  onNewDocument: () => void;
  refreshTrigger?: number;
}

export default function DocumentList({
  onSelectDocument,
  onNewDocument,
  refreshTrigger = 0,
}: DocumentListProps) {
  const [documents, setDocuments] = useState<DocumentListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [filterStatut, setFilterStatut] = useState<string>("tous");
  const [searchQuery, setSearchQuery] = useState("");
  const [exportingId, setExportingId] = useState<string | null>(null);

  const [tick, setTick] = useState(0);
  const recharger = () => setTick((t) => t + 1);

  useEffect(() => {
    let isMounted = true;
    async function fetchDocs() {
      try {
        setLoading(true);
        setErrorMsg(null);
        const docs = await getDocuments();
        if (!isMounted) return;
        setDocuments(docs);
      } catch (err: unknown) {
        if (!isMounted) return;
        if (err instanceof ApiError) {
          setErrorMsg(`Erreur ${err.status} lors de la récupération de vos documents.`);
        } else {
          setErrorMsg("Impossible de joindre le serveur CIAT.");
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    fetchDocs();
    return () => {
      isMounted = false;
    };
  }, [refreshTrigger, tick]);

  const handleExport = async (e: React.MouseEvent, doc: DocumentListItem, format: "docx" | "pdf") => {
    e.stopPropagation();
    const key = `${doc.id}_${format}`;
    setExportingId(key);
    try {
      await telechargerExportDocument(doc.id, format, `${doc.titre}_v${doc.version_courante}.${format}`);
    } catch {
      alert(`Impossible d'exporter le document au format ${format.toUpperCase()}.`);
    } finally {
      setExportingId(null);
    }
  };

  // Filtrage
  const documentsFiltres = documents.filter((d) => {
    const matchStatut = filterStatut === "tous" || d.statut === filterStatut;
    const matchSearch =
      !searchQuery.trim() ||
      d.titre.toLowerCase().includes(searchQuery.toLowerCase().trim());
    return matchStatut && matchSearch;
  });

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-16 text-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-beige border-t-brun mb-4" />
        <p className="text-sm font-medium text-texte-doux">Chargement de vos documents...</p>
      </div>
    );
  }

  if (errorMsg) {
    return (
      <div className="rounded-xl border border-erreur/30 bg-[#f6dedc] p-6 text-center text-brun-fonce">
        <p className="font-semibold text-erreur mb-2">Erreur</p>
        <p className="text-sm text-texte-doux">{errorMsg}</p>
        <Button variant="secondary" className="mt-4" onClick={recharger}>
          Réessayer
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Barre d'actions & Filtres */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {/* Filtres par statut */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          {(
            [
              { id: "tous", label: `Tous (${documents.length})` },
              { id: "brouillon", label: "Brouillons" },
              { id: "valide", label: "Validés" },
              { id: "publie", label: "Publiés" },
            ] as const
          ).map((tab) => {
            const isSelected = filterStatut === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setFilterStatut(tab.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  isSelected
                    ? "bg-brun text-white shadow-xs"
                    : "bg-ivoire text-texte-doux border border-bordure hover:bg-white"
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Champ de recherche & Bouton Nouveau */}
        <div className="flex items-center gap-3">
          <input
            type="text"
            placeholder="Rechercher par titre..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="rounded-lg border border-bordure px-3 py-1.5 text-xs text-brun-fonce focus:border-beige focus:ring-1 focus:ring-beige w-full sm:w-56"
          />
          <Button variant="primary" onClick={onNewDocument} className="text-xs whitespace-nowrap">
            + Rédiger un document
          </Button>
        </div>
      </div>

      {/* Liste des documents */}
      {documentsFiltres.length === 0 ? (
        <div className="rounded-xl border border-dashed border-bordure bg-ivoire/30 p-12 text-center">
          <p className="text-base font-bold text-brun mb-1">Aucun document trouvé</p>
          <p className="text-xs text-texte-doux mb-4">
            {documents.length === 0
              ? "Vous n'avez pas encore généré de document administratif."
              : "Aucun document ne correspond à vos filtres de recherche."}
          </p>
          {documents.length === 0 && (
            <Button variant="ia" onClick={onNewDocument} className="text-xs">
              Créer mon premier document avec l&apos;IA
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {documentsFiltres.map((doc) => {
            const statutInfo = STATUT_DOC_LABELS[doc.statut] || {
              label: doc.statut,
              tone: "neutre" as const,
            };
            const isExportingDocx = exportingId === `${doc.id}_docx`;
            const isExportingPdf = exportingId === `${doc.id}_pdf`;

            return (
              <div
                key={doc.id}
                onClick={() => onSelectDocument(doc.id)}
                className="group cursor-pointer rounded-xl border border-bordure bg-white p-5 shadow-xs transition-all hover:border-beige hover:shadow-md flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <Badge tone={statutInfo.tone}>{statutInfo.label}</Badge>
                    <span className="text-[11px] font-mono text-texte-doux">
                      v{doc.version_courante}
                    </span>
                  </div>

                  <h3 className="font-bold text-brun text-sm group-hover:text-brun-fonce line-clamp-2 mb-2">
                    {doc.titre}
                  </h3>

                  <p className="text-[11px] text-texte-doux">
                    Créé le {new Date(doc.cree_le).toLocaleDateString("fr-FR")}
                    {doc.projet && ` · Projet #${doc.projet}`}
                  </p>
                </div>

                {/* Barre d'action rapide en bas */}
                <div className="mt-4 pt-3 border-t border-bordure/50 flex items-center justify-between text-xs">
                  <span className="font-semibold text-brun group-hover:underline">
                    Ouvrir & Éditer →
                  </span>

                  <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                    <button
                      type="button"
                      disabled={isExportingDocx}
                      onClick={(e) => handleExport(e, doc, "docx")}
                      className="px-2 py-1 rounded text-[11px] font-medium border border-bordure bg-ivoire hover:bg-white text-brun transition-all"
                      title="Télécharger Word"
                    >
                      {isExportingDocx ? "..." : "Word"}
                    </button>
                    <button
                      type="button"
                      disabled={isExportingPdf}
                      onClick={(e) => handleExport(e, doc, "pdf")}
                      className="px-2 py-1 rounded text-[11px] font-medium border border-bordure bg-ivoire hover:bg-white text-brun transition-all"
                      title="Télécharger PDF"
                    >
                      {isExportingPdf ? "..." : "PDF"}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
