"use client";

import { useEffect, useState } from "react";
import {
  getDocumentDetail,
  modifierDocument,
  getVersionsDocument,
  getVersionDetail,
  validerDocument,
  publierDocument,
  repasserBrouillon,
  telechargerExportDocument,
  STATUT_DOC_LABELS,
  type DocumentDetail,
  type VersionDocumentItem,
  type SectionDocument,
} from "@/lib/documents";
import { ApiError } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { Badge, Button } from "@/components/ui";

interface DocumentEditorProps {
  documentId: number;
  onBack: () => void;
  onRefreshList?: () => void;
}

export default function DocumentEditor({
  documentId,
  onBack,
  onRefreshList,
}: DocumentEditorProps) {
  const { user } = useAuth();

  const [doc, setDoc] = useState<DocumentDetail | null>(null);
  const [sectionsEdit, setSectionsEdit] = useState<{ code: string; contenu: string }[]>([]);
  const [versions, setVersions] = useState<VersionDocumentItem[]>([]);
  const [selectedVersionNum, setSelectedVersionNum] = useState<number | null>(null);
  const [versionConsultation, setVersionConsultation] = useState<VersionDocumentItem | null>(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const [tick, setTick] = useState(0);
  const recharger = () => setTick((t) => t + 1);

  // 1. Chargement du document et de ses versions
  useEffect(() => {
    let isMounted = true;
    async function fetchDoc() {
      try {
        setLoading(true);
        setErrorMsg(null);
        const [docData, versionsData] = await Promise.all([
          getDocumentDetail(documentId),
          getVersionsDocument(documentId),
        ]);
        if (!isMounted) return;
        setDoc(docData);
        setVersions(versionsData);
        setSelectedVersionNum(docData.version_courante);
        setVersionConsultation(null);

        // Initialisation des champs d'édition
        setSectionsEdit(
          (docData.sections || []).map((s) => ({
            code: s.code,
            contenu: s.contenu || "",
          }))
        );
      } catch (err: unknown) {
        if (!isMounted) return;
        if (err instanceof ApiError) {
          setErrorMsg(
            err.status === 404
              ? "Ce document n'existe pas ou a été supprimé."
              : `Erreur ${err.status} lors de la consultation du document.`
          );
        } else {
          setErrorMsg("Impossible de joindre le serveur CIAT.");
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    fetchDoc();
    return () => {
      isMounted = false;
    };
  }, [documentId, tick]);

  // 2. Consultation d'une version spécifique
  const handleSelectVersion = async (numero: number) => {
    setSelectedVersionNum(numero);
    setErrorMsg(null);
    setSuccessMsg(null);

    if (doc && numero === doc.version_courante) {
      setVersionConsultation(null);
      return;
    }

    try {
      setActionLoading("version");
      const v = await getVersionDetail(documentId, numero);
      setVersionConsultation(v);
    } catch {
      setErrorMsg(`Impossible de charger la version ${numero}.`);
    } finally {
      setActionLoading(null);
    }
  };

  // 3. Sauvegarde des sections modifiées (crée une nouvelle version)
  const handleSaveSections = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!doc) return;

    if (doc.statut !== "brouillon") {
      setErrorMsg("Ce document n'est plus en brouillon et ne peut pas être modifié.");
      return;
    }

    setSaving(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const updatedDoc = await modifierDocument(documentId, sectionsEdit);
      setDoc(updatedDoc);
      setSelectedVersionNum(updatedDoc.version_courante);
      setVersionConsultation(null);
      setSuccessMsg(
        `Nouvelle version ${updatedDoc.version_courante} enregistrée avec succès !`
      );

      // Recharger l'historique des versions
      const versionsData = await getVersionsDocument(documentId);
      setVersions(versionsData);
      onRefreshList?.();
    } catch (err: unknown) {
      if (err instanceof ApiError) {
        const detail = (err.data as { detail?: string })?.detail || `Erreur ${err.status}`;
        setErrorMsg(detail);
      } else {
        setErrorMsg("Erreur inattendue lors de l'enregistrement.");
      }
    } finally {
      setSaving(false);
    }
  };

  // 4. Actions du workflow
  const handleActionWorkflow = async (action: "valider" | "publier" | "brouillon") => {
    setActionLoading(action);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      let updated: DocumentDetail;
      if (action === "valider") {
        updated = await validerDocument(documentId);
        setSuccessMsg("Document validé avec succès.");
      } else if (action === "publier") {
        updated = await publierDocument(documentId);
        setSuccessMsg("Document publié officiellement.");
      } else {
        updated = await repasserBrouillon(documentId);
        setSuccessMsg("Document repassé en brouillon. L'édition est de nouveau active.");
      }
      setDoc(updated);
      onRefreshList?.();
    } catch (err: unknown) {
      if (err instanceof ApiError) {
        const detail = (err.data as { detail?: string })?.detail || `Action refusée (${err.status})`;
        setErrorMsg(detail);
      } else {
        setErrorMsg("Erreur lors de l'exécution de l'action.");
      }
    } finally {
      setActionLoading(null);
    }
  };

  // 5. Téléchargement Export
  const handleExport = async (format: "docx" | "pdf") => {
    if (!doc) return;
    setActionLoading(`export_${format}`);
    setErrorMsg(null);

    try {
      await telechargerExportDocument(doc.id, format, `${doc.titre}_v${doc.version_courante}.${format}`);
    } catch (err: unknown) {
      if (err instanceof ApiError) {
        setErrorMsg(`Erreur lors de l'export ${format.toUpperCase()} (${err.status}).`);
      } else {
        setErrorMsg(`Échec du téléchargement ${format.toUpperCase()}.`);
      }
    } finally {
      setActionLoading(null);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-16 text-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-beige border-t-brun mb-4" />
        <p className="text-sm font-medium text-texte-doux">Chargement du document...</p>
      </div>
    );
  }

  if (!doc) {
    return (
      <div className="rounded-xl border border-erreur/30 bg-[#f6dedc] p-6 text-center">
        <p className="text-sm text-erreur mb-3">{errorMsg || "Document introuvable."}</p>
        <div className="flex justify-center gap-3">
          <Button variant="secondary" onClick={onBack}>
            ← Retour à la liste
          </Button>
          <Button variant="primary" onClick={recharger}>
            Réessayer
          </Button>
        </div>
      </div>
    );
  }

  // Droits selon le rôle
  const role = user?.role;
  const isCoordoOuAdmin = role === "coordonnateur" || role === "administrateur";
  const isAdmin = role === "administrateur";
  const isBrouillon = doc.statut === "brouillon";
  const isLectureSeule = !isBrouillon || versionConsultation !== null;

  // Sections à afficher : soit l'ancienne version consultée, soit le brouillon courant
  const sectionsAffichees: SectionDocument[] = versionConsultation
    ? versionConsultation.sections
    : doc.sections || [];

  return (
    <div className="space-y-6">
      {/* En-tête de navigation et statut */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-bordure pb-4">
        <div>
          <button
            type="button"
            onClick={onBack}
            className="text-xs font-semibold text-brun hover:text-brun-fonce underline mb-2 inline-flex items-center gap-1"
          >
            ← Retour à Mes documents
          </button>
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-2xl font-bold text-brun">{doc.titre}</h1>
            <Badge tone={STATUT_DOC_LABELS[doc.statut]?.tone || "neutre"}>
              {STATUT_DOC_LABELS[doc.statut]?.label || doc.statut}
            </Badge>
            <span className="text-xs font-mono bg-ivoire px-2.5 py-1 rounded border border-bordure text-texte-doux">
              Version courante : v{doc.version_courante}
            </span>
          </div>
          <p className="text-xs text-texte-doux mt-1">
            Créé le {new Date(doc.cree_le).toLocaleDateString("fr-FR")} à{" "}
            {new Date(doc.cree_le).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
            {doc.projet && ` · Projet incubé lié #${doc.projet}`}
          </p>
        </div>

        {/* Boutons d'export Télécharger Word et PDF */}
        <div className="flex items-center gap-2 flex-wrap">
          <Button
            type="button"
            variant="secondary"
            disabled={actionLoading === "export_docx"}
            onClick={() => handleExport("docx")}
            className="text-xs"
          >
            {actionLoading === "export_docx" ? "Téléchargement..." : "Télécharger Word"}
          </Button>
          <Button
            type="button"
            variant="secondary"
            disabled={actionLoading === "export_pdf"}
            onClick={() => handleExport("pdf")}
            className="text-xs"
          >
            {actionLoading === "export_pdf" ? "Téléchargement..." : "Télécharger PDF"}
          </Button>
        </div>
      </div>

      {/* Messages de retour */}
      {errorMsg && (
        <div className="rounded-lg border border-erreur/40 bg-[#f6dedc] p-4 text-xs text-brun-fonce">
          <p className="font-bold text-erreur">Information ou refus :</p>
          <p className="mt-0.5">{errorMsg}</p>
        </div>
      )}

      {successMsg && (
        <div className="rounded-lg border border-[#c4e3d1] bg-[#e3f1e9] p-4 text-xs text-[#2E7D32]">
          <p className="font-bold">Succès :</p>
          <p className="mt-0.5">{successMsg}</p>
        </div>
      )}

      {/* Barre de workflow & consultation des versions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Colonne latérale : Workflow et Historique des versions */}
        <div className="space-y-6">
          {/* Actions de Workflow */}
          <div className="rounded-xl border border-bordure bg-ivoire/50 p-5 space-y-4">
            <h3 className="text-sm font-bold text-brun uppercase tracking-wider">
              Cycle de vie du document
            </h3>

            <div className="space-y-2">
              {/* Bouton Valider (Coordonnateur ou Admin) */}
              {isBrouillon && isCoordoOuAdmin && (
                <Button
                  type="button"
                  variant="primary"
                  className="w-full text-xs"
                  disabled={actionLoading === "valider"}
                  onClick={() => handleActionWorkflow("valider")}
                >
                  {actionLoading === "valider" ? "Validation..." : "✓ Valider le document"}
                </Button>
              )}

              {/* Bouton Publier (Admin uniquement) */}
              {doc.statut === "valide" && isAdmin && (
                <Button
                  type="button"
                  variant="primary"
                  className="w-full text-xs bg-[#2E7D32] hover:bg-[#256629]"
                  disabled={actionLoading === "publier"}
                  onClick={() => handleActionWorkflow("publier")}
                >
                  {actionLoading === "publier" ? "Publication..." : "Publier officiellement"}
                </Button>
              )}

              {/* Bouton Repasser en brouillon */}
              {(doc.statut === "valide" || doc.statut === "publie") && isCoordoOuAdmin && (
                <Button
                  type="button"
                  variant="outline"
                  className="w-full text-xs"
                  disabled={actionLoading === "brouillon"}
                  onClick={() => handleActionWorkflow("brouillon")}
                >
                  {actionLoading === "brouillon" ? "Modification..." : "↩ Repasser en brouillon"}
                </Button>
              )}
            </div>

            {/* Avertissement statut */}
            {!isBrouillon && (
              <p className="text-[11px] text-texte-doux bg-white p-3 rounded-lg border border-bordure italic">
                Ce document est au statut <strong>{doc.statut}</strong> : il n&apos;est plus modifiable depuis l&apos;interface afin de préserver son authenticité.
                {isCoordoOuAdmin && " Vous pouvez le repasser en brouillon pour autoriser de nouvelles corrections."}
              </p>
            )}
          </div>

          {/* Historique des versions */}
          <div className="rounded-xl border border-bordure bg-white p-5 space-y-3">
            <h3 className="text-sm font-bold text-brun uppercase tracking-wider">
              Historique des versions ({versions.length})
            </h3>
            <p className="text-xs text-texte-doux">
              Sélectionnez une version antérieure pour la consulter en lecture seule.
            </p>

            <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
              {versions.map((v) => {
                const isCurrent = v.numero === doc.version_courante;
                const isSelected = v.numero === selectedVersionNum;
                return (
                  <button
                    key={v.numero}
                    type="button"
                    onClick={() => handleSelectVersion(v.numero)}
                    className={`w-full text-left p-3 rounded-lg border text-xs transition-all flex items-center justify-between ${
                      isSelected
                        ? "border-brun bg-ivoire font-bold shadow-xs"
                        : "border-bordure bg-white hover:bg-ivoire/30"
                    }`}
                  >
                    <div>
                      <span className="text-brun">Version {v.numero}</span>
                      {isCurrent && (
                        <span className="ml-2 text-[10px] bg-beige/30 text-brun-fonce px-1.5 py-0.5 rounded font-semibold">
                          Courante
                        </span>
                      )}
                      <p className="text-[10px] text-texte-doux mt-0.5">
                        {new Date(v.cree_le).toLocaleDateString("fr-FR")} à{" "}
                        {new Date(v.cree_le).toLocaleTimeString("fr-FR", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                    <span className="text-[11px] text-brun">
                      {isSelected ? "Actif" : "Voir"}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Colonne centrale & droite : Éditeur des sections */}
        <div className="lg:col-span-2 space-y-6">
          {versionConsultation && (
            <div className="rounded-lg border border-info/40 bg-[#e6f0fa] p-4 text-xs text-brun-fonce flex items-center justify-between">
              <div>
                <p className="font-bold text-info">
                  Consultation en lecture seule : Version {versionConsultation.numero}
                </p>
                <p className="text-texte-doux">
                  Cette version est historique. Cliquez ci-contre pour revenir à la version courante.
                </p>
              </div>
              <Button
                variant="secondary"
                className="text-xs py-1.5 px-3 min-h-[36px]"
                onClick={() => handleSelectVersion(doc.version_courante)}
              >
                Version courante (v{doc.version_courante})
              </Button>
            </div>
          )}

          <form onSubmit={handleSaveSections} className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-brun">
                Sections du document ({sectionsAffichees.length})
              </h2>
              {!isLectureSeule && (
                <Button
                  type="submit"
                  variant="primary"
                  disabled={saving}
                  className="text-xs"
                >
                  {saving ? "Enregistrement..." : "Enregistrer nouvelle version"}
                </Button>
              )}
            </div>

            <div className="space-y-4">
              {sectionsAffichees.map((sec, idx) => {
                const editIndex = sectionsEdit.findIndex((s) => s.code === sec.code);
                const currentContenu =
                  !isLectureSeule && editIndex !== -1
                    ? sectionsEdit[editIndex].contenu
                    : sec.contenu;

                return (
                  <div
                    key={sec.code || idx}
                    className="rounded-xl border border-bordure bg-white p-5 shadow-xs space-y-2"
                  >
                    <div className="flex items-center justify-between border-b border-bordure/40 pb-2">
                      <label
                        htmlFor={`sec-${sec.code}`}
                        className="font-bold text-brun text-sm"
                      >
                        {idx + 1}. {sec.titre || sec.code}
                      </label>
                      <span className="text-[11px] font-mono text-texte-doux">
                        [{sec.code}]
                      </span>
                    </div>

                    {isLectureSeule ? (
                      <div className="text-xs leading-relaxed text-texte whitespace-pre-wrap p-3 rounded-lg bg-ivoire/30 border border-bordure/60">
                        {sec.contenu || "(Section vide)"}
                      </div>
                    ) : (
                      <textarea
                        id={`sec-${sec.code}`}
                        rows={6}
                        value={currentContenu}
                        onChange={(e) => {
                          const val = e.target.value;
                          setSectionsEdit((prev) => {
                            const copy = [...prev];
                            const i = copy.findIndex((s) => s.code === sec.code);
                            if (i !== -1) {
                              copy[i] = { ...copy[i], contenu: val };
                            } else {
                              copy.push({ code: sec.code, contenu: val });
                            }
                            return copy;
                          });
                        }}
                        className="w-full rounded-lg border border-bordure p-3 text-xs leading-relaxed text-brun-fonce focus:border-beige focus:ring-1 focus:ring-beige"
                      />
                    )}
                  </div>
                );
              })}
            </div>

            {!isLectureSeule && (
              <div className="pt-2 flex justify-end">
                <Button
                  type="submit"
                  variant="primary"
                  disabled={saving}
                  className="px-6 py-2.5 text-xs shadow-sm"
                >
                  {saving ? "Enregistrement en cours..." : "Enregistrer nouvelle version"}
                </Button>
              </div>
            )}
          </form>
        </div>
      </div>
    </div>
  );
}
