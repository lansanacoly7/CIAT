"use client";

import { useEffect, useState } from "react";
import {
  getTypesDocument,
  getModelesDocument,
  getProjetsDisponibles,
  genererDocument,
  type TypeDocument,
  type ModeleDocument,
  type ProjetOption,
  type DocumentGenere,
  type SectionModele,
} from "@/lib/documents";
import { ApiError } from "@/lib/api";
import { Badge, Button } from "@/components/ui";

interface DocumentCreationWizardProps {
  onDocumentCreated: (docId: number) => void;
}

export default function DocumentCreationWizard({ onDocumentCreated }: DocumentCreationWizardProps) {
  // Données référentielles
  const [types, setTypes] = useState<TypeDocument[]>([]);
  const [modeles, setModeles] = useState<ModeleDocument[]>([]);
  const [projets, setProjets] = useState<ProjetOption[]>([]);
  const [loadingInit, setLoadingInit] = useState(true);
  const [initError, setInitError] = useState<string | null>(null);

  // Sélections et formulaire
  const [selectedTypeId, setSelectedTypeId] = useState<number | null>(null);
  const [selectedModeleId, setSelectedModeleId] = useState<number | null>(null);
  const [sujet, setSujet] = useState("");
  const [selectedProjetId, setSelectedProjetId] = useState<number | null>(null);

  // Informations libres structurées
  const [infos, setInfos] = useState<{ cle: string; valeur: string }[]>([
    { cle: "contexte", valeur: "" },
  ]);

  // État de génération
  const [generating, setGenerating] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [documentGenere, setDocumentGenere] = useState<DocumentGenere | null>(null);

  // 1. Chargement initial des types et projets
  useEffect(() => {
    async function init() {
      try {
        setLoadingInit(true);
        setInitError(null);
        const [typesData, projetsData] = await Promise.all([
          getTypesDocument(),
          getProjetsDisponibles(),
        ]);
        setTypes(typesData);
        setProjets(projetsData);
        if (typesData.length > 0) {
          setSelectedTypeId(typesData[0].id);
        }
      } catch (err: unknown) {
        const msg =
          err instanceof ApiError
            ? `Erreur serveur (${err.status}) lors du chargement des données.`
            : "Impossible de joindre le serveur CIAT.";
        setInitError(msg);
      } finally {
        setLoadingInit(false);
      }
    }
    init();
  }, []);

  // 2. Chargement des modèles dès qu'un type est sélectionné
  useEffect(() => {
    if (!selectedTypeId) return;
    async function loadModeles() {
      try {
        const modelesData = await getModelesDocument(selectedTypeId ?? undefined);
        setModeles(modelesData);
        if (modelesData.length > 0) {
          setSelectedModeleId(modelesData[0].id);
        } else {
          setSelectedModeleId(null);
        }
      } catch {
        setModeles([]);
        setSelectedModeleId(null);
      }
    }
    loadModeles();
  }, [selectedTypeId]);

  const selectedModele = modeles.find((m) => m.id === selectedModeleId) || null;

  // Gestion des champs d'infos libres
  const handleAddInfoField = () => {
    setInfos((prev) => [...prev, { cle: "", valeur: "" }]);
  };

  const handleUpdateInfo = (index: number, field: "cle" | "valeur", val: string) => {
    setInfos((prev) => {
      const copy = [...prev];
      copy[index][field] = val;
      return copy;
    });
  };

  const handleRemoveInfoField = (index: number) => {
    setInfos((prev) => prev.filter((_, i) => i !== index));
  };

  // Soumission pour génération IA
  const handleGenerer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedModeleId) {
      setErrorMsg("Veuillez sélectionner un modèle de document.");
      return;
    }
    if (!sujet.trim() || sujet.trim().length < 3) {
      setErrorMsg("Le sujet du document est obligatoire (au moins 3 caractères).");
      return;
    }

    setGenerating(true);
    setErrorMsg(null);

    // Transformation des infos en dictionnaire clé-valeur
    const infosDict: Record<string, string> = {};
    infos.forEach((item) => {
      const k = item.cle.trim();
      const v = item.valeur.trim();
      if (k && v) {
        infosDict[k] = v;
      }
    });

    try {
      const resultat = await genererDocument({
        modele: selectedModeleId,
        sujet: sujet.trim(),
        infos: infosDict,
        projet: selectedProjetId || null,
      });

      setDocumentGenere(resultat);
    } catch (err: unknown) {
      if (err instanceof ApiError) {
        if (err.status === 503) {
          setErrorMsg(
            "Service IA indisponible : aucune clé d'API valide n'est configurée sur le serveur ou le quota est temporairement dépassé."
          );
        } else if (err.status === 502) {
          setErrorMsg(
            "Réponse invalide du service d'IA : le modèle n'a pas pu structurer les sections attendues. Veuillez réessayer."
          );
        } else if (err.status === 400) {
          const detail =
            typeof err.data === "object" && err.data !== null
              ? Object.entries(err.data)
                  .map(([k, v]) => `${k} : ${Array.isArray(v) ? v.join(", ") : v}`)
                  .join(" | ")
              : "Données de formulaire invalides.";
          setErrorMsg(`Erreur de validation (400) : ${detail}`);
        } else {
          setErrorMsg(`Erreur inattendue (${err.status}) lors de la génération.`);
        }
      } else {
        setErrorMsg("Impossible de communiquer avec le serveur de génération IA.");
      }
    } finally {
      setGenerating(false);
    }
  };

  if (loadingInit) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-beige border-t-brun mb-4" />
        <p className="text-sm font-medium text-texte-doux">Chargement des gabarits CIAT...</p>
      </div>
    );
  }

  if (initError) {
    return (
      <div className="rounded-xl border border-erreur/30 bg-[#f6dedc] p-6 text-center text-brun-fonce">
        <p className="font-semibold text-erreur mb-2">Erreur de chargement</p>
        <p className="text-sm text-texte-doux">{initError}</p>
        <Button
          variant="secondary"
          className="mt-4"
          onClick={() => window.location.reload()}
        >
          Réessayer
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* 1. Étape : Type de document */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-brun">
            1. Choisissez le type de document
          </h2>
          <span className="text-xs text-texte-doux">Étape 1 sur 3</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {types.map((t) => {
            const isSelected = t.id === selectedTypeId;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => {
                  setSelectedTypeId(t.id);
                  setDocumentGenere(null);
                }}
                className={`p-4 rounded-xl border text-left transition-all ${
                  isSelected
                    ? "border-brun bg-ivoire shadow-md ring-2 ring-brun/10"
                    : "border-bordure bg-white hover:border-beige hover:bg-ivoire/30"
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-semibold text-brun text-sm">{t.nom}</span>
                  {isSelected && (
                    <span className="h-2 w-2 rounded-full bg-brun" />
                  )}
                </div>
                <p className="text-xs text-texte-doux font-mono">Code : {t.code}</p>
              </button>
            );
          })}
        </div>
      </section>

      {/* 2. Étape : Choix du modèle & Aperçu de la structure */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-brun">
            2. Sélectionnez un modèle et examinez sa structure
          </h2>
          <span className="text-xs text-texte-doux">Étape 2 sur 3</span>
        </div>

        {modeles.length === 0 ? (
          <p className="text-sm text-texte-doux italic p-4 bg-ivoire rounded-lg border border-bordure">
            Aucun modèle disponible pour ce type de document.
          </p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {modeles.map((m) => {
              const isSelected = m.id === selectedModeleId;
              return (
                <div
                  key={m.id}
                  onClick={() => {
                    setSelectedModeleId(m.id);
                    setDocumentGenere(null);
                  }}
                  className={`cursor-pointer rounded-xl border p-5 transition-all ${
                    isSelected
                      ? "border-brun bg-white shadow-md ring-2 ring-brun/10"
                      : "border-bordure bg-ivoire/40 hover:bg-white hover:border-beige"
                  }`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-bold text-brun text-base">{m.nom}</h3>
                    <Badge tone={isSelected ? "succes" : "neutre"}>
                      {isSelected ? "Sélectionné" : "Choisir"}
                    </Badge>
                  </div>
                  {m.apercu && (
                    <p className="text-xs text-texte-doux mb-3 leading-relaxed">
                      {m.apercu}
                    </p>
                  )}

                  {/* Aperçu des sections */}
                  <div className="mt-3 pt-3 border-t border-bordure/60">
                    <p className="text-xs font-semibold text-brun-fonce uppercase tracking-wider mb-2">
                      Structure en {m.sections?.length || 0} sections :
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {m.sections?.map((sec: SectionModele, idx: number) => (
                        <span
                          key={sec.code || idx}
                          title={sec.consigne || sec.titre}
                          className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-ivoire text-texte-doux border border-bordure"
                        >
                          <span className="text-[#5A4B42] mr-1 font-bold">{idx + 1}.</span>
                          {sec.titre}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* 3. Étape : Formulaire de saisie & Lien projet */}
      {selectedModele && (
        <form onSubmit={handleGenerer} className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-brun">
              3. Détails du document à générer
            </h2>
            <span className="text-xs text-texte-doux">Étape 3 sur 3</span>
          </div>

          <div className="rounded-xl border border-bordure bg-white p-6 shadow-sm space-y-5">
            {/* Sujet principal */}
            <div>
              <label
                htmlFor="doc-sujet"
                className="block text-sm font-bold text-brun-fonce mb-1"
              >
                Sujet ou objet principal du document <span className="text-erreur">*</span>
              </label>
              <input
                id="doc-sujet"
                type="text"
                value={sujet}
                onChange={(e) => setSujet(e.target.value)}
                placeholder="Ex. Convention d'incubation du projet AgriSol avec l'ISEP Diamniadio"
                required
                className="w-full rounded-lg border border-bordure px-4 py-2.5 text-sm text-brun-fonce focus:border-beige focus:ring-1 focus:ring-beige"
              />
              <p className="text-xs text-texte-doux mt-1">
                Le sujet servira de titre directeur et guidera l&apos;IA sur l&apos;objet précis du document.
              </p>
            </div>

            {/* Projet incubé lié (optionnel) */}
            <div>
              <label
                htmlFor="doc-projet"
                className="block text-sm font-bold text-brun-fonce mb-1"
              >
                Rattacher à un projet incubé (optionnel)
              </label>
              <select
                id="doc-projet"
                value={selectedProjetId ?? ""}
                onChange={(e) =>
                  setSelectedProjetId(e.target.value ? Number(e.target.value) : null)
                }
                className="w-full rounded-lg border border-bordure px-4 py-2.5 text-sm text-brun-fonce bg-white focus:border-beige focus:ring-1 focus:ring-beige"
              >
                <option value="">-- Aucun projet associé (document général) --</option>
                {projets.map((p) => (
                  <option key={p.id} value={p.id}>
                    #{p.id} — {p.titre} {p.statut ? `(${p.statut})` : ""}
                  </option>
                ))}
              </select>
              <p className="text-xs text-texte-doux mt-1">
                Si un projet est sélectionné, l&apos;IA intègre automatiquement son contexte (porteur, domaine, objectifs).
              </p>
            </div>

            {/* Informations libres additionnelles */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-bold text-brun-fonce">
                  Informations utiles et consignes libres
                </label>
                <button
                  type="button"
                  onClick={handleAddInfoField}
                  className="text-xs font-semibold text-brun hover:text-brun-fonce underline"
                >
                  + Ajouter un champ d&apos;information
                </button>
              </div>
              <p className="text-xs text-texte-doux mb-3">
                Ces informations ont la priorité sur le projet lié (noms des signataires, dates, budget, etc.).
              </p>

              <div className="space-y-2">
                {infos.map((item, idx) => (
                  <div key={idx} className="flex gap-2 items-center">
                    <input
                      type="text"
                      placeholder="Clé (ex: signataire, date_effet, montant)"
                      value={item.cle}
                      onChange={(e) => handleUpdateInfo(idx, "cle", e.target.value)}
                      className="w-1/3 rounded-lg border border-bordure px-3 py-2 text-xs text-brun-fonce"
                    />
                    <input
                      type="text"
                      placeholder="Valeur (ex: Dr. Amadou Diallo, 1er Novembre 2026, 15 000 000 FCFA)"
                      value={item.valeur}
                      onChange={(e) => handleUpdateInfo(idx, "valeur", e.target.value)}
                      className="flex-1 rounded-lg border border-bordure px-3 py-2 text-xs text-brun-fonce"
                    />
                    {infos.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveInfoField(idx)}
                        className="text-erreur hover:text-red-700 px-2 text-sm font-bold"
                        title="Supprimer ce champ"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Alerte d'erreur claire en français */}
            {errorMsg && (
              <div className="rounded-lg border border-erreur/40 bg-[#f6dedc] p-4 text-xs text-brun-fonce space-y-1">
                <p className="font-bold text-erreur flex items-center gap-1.5">
                  <span>⚠️</span> Erreur de génération
                </p>
                <p>{errorMsg}</p>
                <p className="text-[11px] text-texte-doux italic">
                  Vos saisies ci-dessus ont été conservées. Vous pouvez corriger et réessayer.
                </p>
              </div>
            )}

            {/* Bouton de génération avec état de chargement */}
            <div className="pt-2 flex flex-col sm:flex-row items-center gap-4">
              <Button
                type="submit"
                variant="ia"
                disabled={generating}
                className="w-full sm:w-auto px-8 py-3 text-base shadow-md"
              >
                {generating ? (
                  <span className="flex items-center gap-2">
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-brun border-t-transparent" />
                    Génération IA en cours...
                  </span>
                ) : (
                  "Générer le document avec l'IA"
                )}
              </Button>

              {generating && (
                <span className="text-xs text-texte-doux animate-pulse">
                  La rédaction assistée par IA prend quelques secondes (respect strict de la charte CIAT)...
                </span>
              )}
            </div>
          </div>
        </form>
      )}

      {/* 4. Affichage immédiat du document généré section par section */}
      {documentGenere && (
        <div className="rounded-xl border border-[#c4e3d1] bg-[#e3f1e9]/30 p-6 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#c4e3d1] pb-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Badge tone="succes">Génération réussie</Badge>
                <span className="text-xs font-mono text-texte-doux">
                  Document #{documentGenere.id} (Version {documentGenere.version})
                </span>
              </div>
              <h2 className="text-xl font-bold text-brun">
                {documentGenere.titre}
              </h2>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="primary"
                onClick={() => onDocumentCreated(documentGenere.id)}
              >
                Éditer & Exporter ce document →
              </Button>
            </div>
          </div>

          {/* Rendu section par section */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold uppercase tracking-wider text-brun">
              Contenu généré section par section ({documentGenere.sections.length} sections) :
            </h3>
            <div className="space-y-3">
              {documentGenere.sections.map((sec, index) => (
                <div
                  key={sec.code || index}
                  className="rounded-lg border border-bordure bg-white p-5 shadow-xs"
                >
                  <div className="flex items-center justify-between mb-2 border-b border-bordure/40 pb-2">
                    <span className="font-bold text-brun text-sm">
                      Section {index + 1} : {sec.titre || sec.code}
                    </span>
                    <span className="text-[11px] font-mono text-texte-doux uppercase">
                      [{sec.code}]
                    </span>
                  </div>
                  <div className="text-xs leading-relaxed text-texte whitespace-pre-wrap font-sans">
                    {sec.contenu}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
