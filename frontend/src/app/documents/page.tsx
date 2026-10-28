"use client";

import { useState } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import DocumentCreationWizard from "@/components/documents/DocumentCreationWizard";
import DocumentList from "@/components/documents/DocumentList";
import DocumentEditor from "@/components/documents/DocumentEditor";

type Onglet = "liste" | "nouveau" | "editeur";

export default function DocumentsPage() {
  const { user, loading, isAuthenticated } = useAuth();

  const [activeOnglet, setActiveOnglet] = useState<Onglet>("liste");
  const [selectedDocId, setSelectedDocId] = useState<number | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // 1. Écran de chargement auth
  if (loading) {
    return (
      <main className="min-h-screen bg-ivoire/30 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto flex flex-col items-center justify-center p-16 text-center">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-beige border-t-brun mb-4" />
          <p className="text-sm font-medium text-texte-doux">Vérification de votre session...</p>
        </div>
      </main>
    );
  }

  // 2. Connexion obligatoire (conforme à la consigne : connexion obligatoire)
  if (!isAuthenticated || !user) {
    return (
      <main className="min-h-screen bg-ivoire/30 py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md mx-auto rounded-2xl border border-bordure bg-white p-8 text-center shadow-sm">
          <div className="w-14 h-14 mx-auto rounded-full bg-ivoire border border-beige flex items-center justify-center text-2xl mb-4">
            🔒
          </div>
          <h1 className="text-xl font-bold text-brun mb-2">Connexion requise</h1>
          <p className="text-xs text-texte-doux leading-relaxed mb-6">
            L&apos;accès au générateur de documents administratifs et au suivi des versions est réservé aux membres connectés de l&apos;écosystème CIAT.
          </p>
          <Link
            href="/connexion?next=/documents"
            className="inline-flex min-h-[44px] w-full items-center justify-center rounded-lg bg-brun px-5 py-2.5 font-[family-name:var(--font-title)] text-sm font-semibold text-white shadow-sm hover:bg-brun-fonce transition-all"
          >
            Se connecter à mon compte →
          </Link>
        </div>
      </main>
    );
  }

  // Gestion de la navigation entre onglets
  const handleOpenDocument = (id: number) => {
    setSelectedDocId(id);
    setActiveOnglet("editeur");
  };

  const handleDocumentCreated = (id: number) => {
    setSelectedDocId(id);
    setActiveOnglet("editeur");
    setRefreshTrigger((prev) => prev + 1);
  };

  const handleBackToList = () => {
    setSelectedDocId(null);
    setActiveOnglet("liste");
    setRefreshTrigger((prev) => prev + 1);
  };

  return (
    <main className="min-h-screen bg-ivoire/30 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* En-tête de la page */}
        <header className="rounded-2xl border border-bordure bg-white p-6 sm:p-8 shadow-xs">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#5A4B42] mb-1">
                <span>Centre CIAT · ISEP Diamniadio</span>
                <span>•</span>
                <span>Module P5</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-brun tracking-tight">
                Générateur de documents administratifs
              </h1>
              <p className="text-xs sm:text-sm text-texte-doux mt-1.5 max-w-3xl leading-relaxed">
                Rédigez, éditez et exportez des documents certifiés conformes à la charte officielle CIAT (conventions de partenariat, fiches projets, appels à candidatures, procès-verbaux).
              </p>
            </div>

            {/* Onglets principaux */}
            <div className="flex items-center gap-2 bg-ivoire p-1 rounded-xl border border-bordure self-start md:self-auto">
              <button
                type="button"
                onClick={() => {
                  setSelectedDocId(null);
                  setActiveOnglet("liste");
                }}
                className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                  activeOnglet === "liste"
                    ? "bg-brun text-white shadow-xs"
                    : "text-texte-doux hover:text-brun"
                }`}
              >
                Mes documents
              </button>
              <button
                type="button"
                onClick={() => {
                  setSelectedDocId(null);
                  setActiveOnglet("nouveau");
                }}
                className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                  activeOnglet === "nouveau"
                    ? "bg-brun text-white shadow-xs"
                    : "text-texte-doux hover:text-brun"
                }`}
              >
                Nouveau document (IA)
              </button>
            </div>
          </div>
        </header>

        {/* Corps de l'écran selon l'onglet actif */}
        <div className="rounded-2xl border border-bordure bg-white p-6 sm:p-8 shadow-xs">
          {activeOnglet === "liste" && (
            <DocumentList
              onSelectDocument={handleOpenDocument}
              onNewDocument={() => setActiveOnglet("nouveau")}
              refreshTrigger={refreshTrigger}
            />
          )}

          {activeOnglet === "nouveau" && (
            <DocumentCreationWizard onDocumentCreated={handleDocumentCreated} />
          )}

          {activeOnglet === "editeur" && selectedDocId !== null && (
            <DocumentEditor
              documentId={selectedDocId}
              onBack={handleBackToList}
              onRefreshList={() => setRefreshTrigger((prev) => prev + 1)}
            />
          )}
        </div>
      </div>
    </main>
  );
}
