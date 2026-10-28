"use client";

import { useEffect, useMemo, useState } from "react";
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
import { TemplateMiniature, SpecimenModal, getCanvaImageForModele } from "./TemplateMockupPreview";
import {
  FileText,
  Search,
  Sparkles,
  CheckCircle2,
  ShieldCheck,
  Eye,
  ArrowRight,
  RotateCcw,
  Building2,
  Calendar,
  Layers,
  Settings,
  PenTool,
  MapPin,
  Clock,
  UserCheck,
  Hash,
} from "lucide-react";

interface DocumentCreationWizardProps {
  onDocumentCreated: (docId: number) => void;
}

export default function DocumentCreationWizard({ onDocumentCreated }: DocumentCreationWizardProps) {
  // Référentiels
  const [types, setTypes] = useState<TypeDocument[]>([]);
  const [modeles, setModeles] = useState<ModeleDocument[]>([]);
  const [projets, setProjets] = useState<ProjetOption[]>([]);
  const [loadingInit, setLoadingInit] = useState(true);
  const [initError, setInitError] = useState<string | null>(null);

  // Filtres et recherche de canvas
  const [activeCategory, setActiveCategory] = useState<string>("tous");
  const [searchQuery, setSearchQuery] = useState("");
  const [modalModele, setModalModele] = useState<ModeleDocument | null>(null);

  // Sélection active
  const [selectedModeleId, setSelectedModeleId] = useState<number | null>(null);

  // Formulaire : champs officiels pré-remplis mais TOTALEMENT LIBRES ET MODIFIABLES
  const [emetteur, setEmetteur] = useState(
    "Centre d'Innovation et d'Accélération Technologique (CIAT) — ISEP Diamniadio"
  );
  const [lieu, setLieu] = useState("Diamniadio, Cité du Savoir, Sénégal");
  const [dateDoc, setDateDoc] = useState(() => {
    return new Intl.DateTimeFormat("fr-FR", {
      day: "numeric",
      month: "long",
      year: "numeric",
    }).format(new Date());
  });
  const [signataire, setSignataire] = useState("Le Coordonnateur Général du CIAT");
  const [reference, setReference] = useState("CIAT/2026/DOC-01");

  // Formulaire : champs spécifiques du document
  const [sujet, setSujet] = useState("");
  const [beneficiaire, setBeneficiaire] = useState("");
  const [contexte, setContexte] = useState("");
  const [dispositions, setDispositions] = useState("");
  const [selectedProjetId, setSelectedProjetId] = useState<number | null>(null);

  // Section accordéon des paramètres officiels
  const [showAdvancedSettings, setShowAdvancedSettings] = useState(false);

  // Génération
  const [generating, setGenerating] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [documentGenere, setDocumentGenere] = useState<DocumentGenere | null>(null);

  // 1. Chargement initial de tous les modèles et projets
  useEffect(() => {
    async function init() {
      try {
        setLoadingInit(true);
        setInitError(null);
        const [typesData, modelesData, projetsData] = await Promise.all([
          getTypesDocument(),
          getModelesDocument(),
          getProjetsDisponibles(),
        ]);
        setTypes(typesData);
        setModeles(modelesData);
        setProjets(projetsData);
        if (modelesData.length > 0) {
          setSelectedModeleId(modelesData[0].id);
          applyDefaultSujet(modelesData[0]);
          setReference(`CIAT/2026/GAB-${String(modelesData[0].id).padStart(3, "0")}`);
        }
      } catch (err: unknown) {
        const msg =
          err instanceof ApiError
            ? `Erreur serveur (${err.status}) lors du chargement des gabarits.`
            : "Impossible de joindre le serveur CIAT.";
        setInitError(msg);
      } finally {
        setLoadingInit(false);
      }
    }
    init();
  }, []);

  // Définition d'un sujet par défaut suggéré lors de la sélection d'un gabarit
  const applyDefaultSujet = (mod: ModeleDocument) => {
    const nom = (mod.nom || "").toLowerCase();
    const typeCode = (mod.type_code || "").toLowerCase();
    let defaultTitle = `Document officiel - ${mod.nom.replace(/^Format\s+/i, "")}`;

    if (typeCode.includes("attestation") || nom.includes("attestation")) {
      defaultTitle = "Attestation officielle d'incubation CIAT - Promotion 2026";
    } else if (typeCode.includes("convention") || nom.includes("convention")) {
      defaultTitle = "Convention d'incubation et d'accompagnement technologique";
    } else if (typeCode.includes("fiche_projet") || nom.includes("fiche")) {
      defaultTitle = "Fiche technique d'instruction et de prototypage FabLab 4.0";
    } else if (typeCode.includes("proces_verbal") || nom.includes("procès") || nom.includes("pv")) {
      defaultTitle = "Procès-verbal de sélection du comité d'évaluation";
    } else if (typeCode.includes("appel") || nom.includes("appel")) {
      defaultTitle = "Appel à candidatures - Programme d'accélération CIAT";
    } else if (typeCode.includes("rapport") || nom.includes("rapport")) {
      defaultTitle = "Rapport d'étape et de suivi d'incubation périodique";
    }
    setSujet(defaultTitle);
    setReference(`CIAT/2026/GAB-${String(mod.id).padStart(3, "0")}`);
  };

  // Filtrage intelligent des canvas
  const filteredModeles = useMemo(() => {
    return modeles.filter((m) => {
      const typeCode = (m.type_code || "").toLowerCase();
      const typeNom = (m.type_nom || "").toLowerCase();
      const nom = (m.nom || "").toLowerCase();
      const apercu = (m.apercu || "").toLowerCase();
      const query = searchQuery.trim().toLowerCase();

      // Filtre catégorie
      if (activeCategory !== "tous") {
        if (activeCategory === "attestation") {
          if (!typeCode.includes("attestation") && !nom.includes("attestation")) return false;
        } else if (activeCategory === "convention") {
          if (!typeCode.includes("convention") && !nom.includes("convention")) return false;
        } else if (activeCategory === "fiche_projet") {
          if (!typeCode.includes("fiche") && !nom.includes("fiche")) return false;
        } else if (activeCategory === "proces_verbal") {
          if (!typeCode.includes("proces_verbal") && !nom.includes("procès") && !nom.includes("pv")) return false;
        } else if (activeCategory === "appel") {
          if (!typeCode.includes("appel") && !nom.includes("appel")) return false;
        } else if (activeCategory === "rapport") {
          if (!typeCode.includes("rapport") && !nom.includes("rapport")) return false;
        }
      }

      // Filtre recherche textuelle
      if (query) {
        return (
          nom.includes(query) ||
          typeNom.includes(query) ||
          apercu.includes(query)
        );
      }
      return true;
    });
  }, [modeles, activeCategory, searchQuery]);

  const selectedModele = modeles.find((m) => m.id === selectedModeleId) || null;

  // Catégories rapides
  const categories = [
    { id: "tous", label: "Tous les Canvas", count: modeles.length },
    {
      id: "attestation",
      label: "Attestations & Reçus",
      count: modeles.filter((m) => (m.type_code || "").includes("attestation") || (m.nom || "").includes("Attestation")).length,
    },
    {
      id: "convention",
      label: "Conventions & Accords",
      count: modeles.filter((m) => (m.type_code || "").includes("convention") || (m.nom || "").includes("Convention")).length,
    },
    {
      id: "fiche_projet",
      label: "Fiches Projets & FabLab",
      count: modeles.filter((m) => (m.type_code || "").includes("fiche") || (m.nom || "").includes("Fiche")).length,
    },
    {
      id: "proces_verbal",
      label: "Procès-Verbaux",
      count: modeles.filter((m) => (m.type_code || "").includes("proces_verbal") || (m.nom || "").includes("Procès")).length,
    },
    {
      id: "appel",
      label: "Appels à Candidatures",
      count: modeles.filter((m) => (m.type_code || "").includes("appel") || (m.nom || "").includes("Appel")).length,
    },
    {
      id: "rapport",
      label: "Rapports & Bilans",
      count: modeles.filter((m) => (m.type_code || "").includes("rapport") || (m.nom || "").includes("Rapport")).length,
    },
  ];

  // Soumission pour génération IA
  const handleGenerer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedModeleId) {
      setErrorMsg("Veuillez sélectionner un gabarit de document.");
      return;
    }
    if (!sujet.trim() || sujet.trim().length < 3) {
      setErrorMsg("Le sujet ou titre du document est obligatoire (au moins 3 caractères).");
      return;
    }

    setGenerating(true);
    setErrorMsg(null);

    // Mappage de TOUS les champs, y compris les mentions officielles personnalisées par l'utilisateur
    const infosDict: Record<string, string> = {
      emetteur: emetteur.trim(),
      lieu: lieu.trim(),
      date_document: dateDoc.trim(),
      signataire: signataire.trim(),
      reference: reference.trim(),
    };

    if (beneficiaire.trim()) {
      infosDict["beneficiaire"] = beneficiaire.trim();
      infosDict["destinataire"] = beneficiaire.trim();
    }
    if (contexte.trim()) {
      infosDict["contexte"] = contexte.trim();
    }
    if (dispositions.trim()) {
      infosDict["dispositions"] = dispositions.trim();
      infosDict["modalites"] = dispositions.trim();
    }

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
        const errData =
          typeof err.data === "object" && err.data !== null
            ? (err.data as Record<string, unknown>)
            : null;
        const detailServer = errData?.detail ? String(errData.detail) : null;
        const erreurServer = errData?.erreur ? String(errData.erreur) : null;

        if (err.status === 503) {
          setErrorMsg(
            erreurServer ||
              detailServer ||
              "Service IA temporairement indisponible : quota de requêtes par minute atteint sur le fournisseur gratuit. Veuillez patienter 20 secondes et réessayer."
          );
        } else if (err.status === 502) {
          setErrorMsg(
            erreurServer ||
              detailServer ||
              "Réponse incomplète du service d'IA : le modèle n'a pas pu structurer toutes les sections attendues. Veuillez réessayer."
          );
        } else if (err.status === 400) {
          const detail =
            errData
              ? Object.entries(errData)
                  .map(([k, v]) => `${k} : ${Array.isArray(v) ? v.join(", ") : v}`)
                  .join(" | ")
              : "Données de formulaire invalides.";
          setErrorMsg(`Erreur de validation (400) : ${detail}`);
        } else if (err.status === 401) {
          setErrorMsg("Votre session a expiré. Veuillez vous reconnecter.");
        } else {
          setErrorMsg(
            erreurServer ||
              detailServer ||
              `Erreur inattendue (${err.status}) lors de la génération.`
          );
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
      <div className="flex flex-col items-center justify-center p-16 text-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-[#C99A68] border-t-[#612D10] mb-4" />
        <p className="text-sm font-semibold text-[#612D10]">
          Chargement de la bibliothèque des Canvas officiels CIAT...
        </p>
        <p className="text-xs text-muted-foreground mt-1">
          Préparation des maquettes graphiques haute fidélité
        </p>
      </div>
    );
  }

  if (initError) {
    return (
      <div className="rounded-xl border border-red-300 bg-red-50 p-6 text-center text-red-900">
        <p className="font-semibold text-red-800 mb-2">Erreur de chargement</p>
        <p className="text-sm text-red-700">{initError}</p>
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
    <div className="space-y-10">
      {/* 1. Galerie Visuelle des Canvas (Style Canva / Word) */}
      <section className="space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border pb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-[#612D10] text-white">
                Étape 1 sur 2
              </span>
              <span className="text-xs font-semibold text-[#C99A68]">
                Bibliothèque de Canvas A4 Fidèles
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-extrabold text-[#24140D] tracking-tight mt-1">
              Choisissez votre Canvas de document
            </h2>
            <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
              Chaque Canvas reflète exactement le design institutionnel final (bordures, médaillons, sceau officiel et typographie).
            </p>
          </div>

          {/* Recherche textuelle rapide */}
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Rechercher un Canvas..."
              className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-border bg-white placeholder:text-muted-foreground focus:outline-hidden focus:ring-2 focus:ring-[#C99A68]/40"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-muted-foreground hover:text-foreground"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {/* Pilules de catégories */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-thin">
          {categories.map((cat) => {
            const isActive = activeCategory === cat.id;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => setActiveCategory(cat.id)}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all shrink-0 flex items-center gap-1.5 ${
                  isActive
                    ? "bg-[#612D10] text-white shadow-xs"
                    : "bg-[#FAF7F2] text-muted-foreground hover:text-[#612D10] hover:bg-[#F4ECE3] border border-border/60"
                }`}
              >
                <span>{cat.label}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                    isActive ? "bg-white/20 text-white" : "bg-muted text-muted-foreground"
                  }`}
                >
                  {cat.count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Grille de Canvas avec Vraies Miniatures Graphiques */}
        {filteredModeles.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border p-12 text-center bg-[#FCFAF7]">
            <FileText className="w-10 h-10 mx-auto text-muted-foreground/40 mb-3" />
            <p className="text-sm font-bold text-foreground">Aucun Canvas ne correspond à votre recherche</p>
            <p className="text-xs text-muted-foreground mt-1">
              Modifiez votre recherche ou réinitialisez le filtre de catégorie.
            </p>
            <button
              type="button"
              onClick={() => {
                setActiveCategory("tous");
                setSearchQuery("");
              }}
              className="mt-4 px-4 py-1.5 rounded-lg text-xs font-bold bg-[#FAF7F2] text-[#612D10] border border-[#E8DFD5] hover:bg-[#F4ECE3]"
            >
              Réinitialiser les filtres
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {filteredModeles.map((m) => {
              const isSelected = m.id === selectedModeleId;
              return (
                <div
                  key={m.id}
                  onClick={() => {
                    setSelectedModeleId(m.id);
                    applyDefaultSujet(m);
                    setDocumentGenere(null);
                  }}
                  className={`group relative rounded-2xl border transition-all duration-200 cursor-pointer flex flex-col justify-between overflow-hidden bg-white ${
                    isSelected
                      ? "border-[#612D10] ring-3 ring-[#612D10]/20 shadow-xl transform -translate-y-1"
                      : "border-border/80 hover:border-[#C99A68] hover:shadow-md"
                  }`}
                >
                  {/* Miniature Graphique Haute Définition */}
                  <TemplateMiniature
                    modele={m}
                    isSelected={isSelected}
                    onOpenGrosPlan={() => setModalModele(m)}
                  />

                  {/* Contenu textuel et actions */}
                  <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                    <div>
                      <div className="flex items-center justify-between gap-1 mb-1.5">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-[#C99A68] truncate">
                          {m.type_nom || "Format officiel"}
                        </span>
                        <span className="text-[10px] font-mono font-medium px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
                          {m.sections?.length || 0} sections
                        </span>
                      </div>
                      <h3 className="font-title font-bold text-sm text-[#24140D] leading-snug group-hover:text-[#612D10]">
                        {m.nom}
                      </h3>
                      {m.apercu && (
                        <p className="text-[11px] text-muted-foreground mt-1 line-clamp-2 leading-relaxed">
                          {m.apercu}
                        </p>
                      )}
                    </div>

                    {/* Actions : Gros Plan & Choisir */}
                    <div className="pt-2 border-t border-border/40 flex items-center justify-between gap-2">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setModalModele(m);
                        }}
                        className="text-[11px] font-semibold text-muted-foreground hover:text-[#612D10] flex items-center gap-1 py-1"
                        title="Examiner en gros plan A4 avec zoom"
                      >
                        <Eye className="w-3.5 h-3.5 text-[#C99A68]" />
                        <span>Gros plan</span>
                      </button>

                      <div
                        className={`px-3 py-1 rounded-md text-[11px] font-bold transition-all flex items-center gap-1 ${
                          isSelected
                            ? "bg-[#612D10] text-white shadow-xs"
                            : "bg-[#FAF7F2] text-foreground group-hover:bg-[#612D10] group-hover:text-white"
                        }`}
                      >
                        {isSelected ? (
                          <>
                            <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                            <span>Canva actif</span>
                          </>
                        ) : (
                          <span>Choisir</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Modale d'inspection en Gros Plan avec Zoom */}
      {modalModele && (
        <SpecimenModal
          modele={modalModele}
          onClose={() => setModalModele(null)}
          onSelect={() => {
            setSelectedModeleId(modalModele.id);
            applyDefaultSujet(modalModele);
            setDocumentGenere(null);
          }}
        />
      )}

      {/* 2. Étape : Personnalisation avec liberté totale sur TOUS les champs */}
      {selectedModele && (
        <form onSubmit={handleGenerer} className="space-y-6 pt-4 border-t border-border">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-[#C99A68] text-white">
                  Étape 2 sur 2
                </span>
                <span className="text-xs font-semibold text-muted-foreground">
                  Personnalisation intégrale du document
                </span>
              </div>
              <h2 className="text-xl sm:text-2xl font-extrabold text-[#24140D] tracking-tight mt-1">
                Configurez les informations du document
              </h2>
            </div>
            <div className="flex items-center gap-2 bg-[#FAF7F2] px-3.5 py-1.5 rounded-xl border border-[#E8DFD5] text-xs shadow-2xs">
              <span className="text-muted-foreground font-medium">Canva sélectionné :</span>
              <span className="font-bold text-[#612D10] truncate max-w-xs">{selectedModele.nom}</span>
            </div>
          </div>

          {/* Section modifiable : Mentions institutionnelles & Paramètres officiels */}
          <div className="rounded-2xl border border-border bg-[#FAF7F2]/50 p-5 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border/60 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-1.5 rounded-lg bg-[#612D10] text-white">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-xs font-black uppercase tracking-wider text-[#612D10]">
                    Mentions officielles & Paramètres pré-remplis
                  </h3>
                  <p className="text-[11px] text-muted-foreground">
                    Ces champs sont pré-configurés pour la charte CIAT, mais vous avez la totale liberté de les modifier.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowAdvancedSettings(!showAdvancedSettings)}
                className="text-xs font-bold text-[#612D10] hover:underline flex items-center gap-1 self-start sm:self-auto"
              >
                <span>{showAdvancedSettings ? "Masquer les détails ▲" : "Modifier les mentions officielles (lieu, date, émetteur...) ▼"}</span>
              </button>
            </div>

            {/* Champs éditables des mentions officielles */}
            <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-1 ${showAdvancedSettings ? "block" : "hidden sm:grid"}`}>
              {/* Émetteur */}
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-[#24140D] flex items-center gap-1">
                  <Building2 className="w-3.5 h-3.5 text-[#C99A68]" />
                  <span>Émetteur officiel</span>
                </label>
                <input
                  type="text"
                  value={emetteur}
                  onChange={(e) => setEmetteur(e.target.value)}
                  className="w-full text-xs rounded-lg border border-border px-3 py-2 bg-white text-[#24140D] focus:border-[#C99A68]"
                />
              </div>

              {/* Lieu d'émission */}
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-[#24140D] flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-[#C99A68]" />
                  <span>Lieu de délivrance</span>
                </label>
                <input
                  type="text"
                  value={lieu}
                  onChange={(e) => setLieu(e.target.value)}
                  className="w-full text-xs rounded-lg border border-border px-3 py-2 bg-white text-[#24140D] focus:border-[#C99A68]"
                />
              </div>

              {/* Date du document */}
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-[#24140D] flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-[#C99A68]" />
                  <span>Date d&apos;émission</span>
                </label>
                <input
                  type="text"
                  value={dateDoc}
                  onChange={(e) => setDateDoc(e.target.value)}
                  className="w-full text-xs rounded-lg border border-border px-3 py-2 bg-white text-[#24140D] focus:border-[#C99A68]"
                />
              </div>

              {/* Titre du signataire */}
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-[#24140D] flex items-center gap-1">
                  <UserCheck className="w-3.5 h-3.5 text-[#C99A68]" />
                  <span>Titre / Qualité du signataire</span>
                </label>
                <input
                  type="text"
                  value={signataire}
                  onChange={(e) => setSignataire(e.target.value)}
                  className="w-full text-xs rounded-lg border border-border px-3 py-2 bg-white text-[#24140D] focus:border-[#C99A68]"
                />
              </div>

              {/* Référence officielle */}
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-[#24140D] flex items-center gap-1">
                  <Hash className="w-3.5 h-3.5 text-[#C99A68]" />
                  <span>Numéro de référence officiel</span>
                </label>
                <input
                  type="text"
                  value={reference}
                  onChange={(e) => setReference(e.target.value)}
                  className="w-full text-xs rounded-lg border border-border px-3 py-2 bg-white text-[#24140D] font-mono focus:border-[#C99A68]"
                />
              </div>

              {/* Rappel visuel */}
              <div className="p-2.5 rounded-lg bg-emerald-50 border border-emerald-200 text-[11px] text-emerald-900 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Tous ces éléments seront fidèlement injectés dans le Canva officiel.</span>
              </div>
            </div>
          </div>

          {/* Formulaire des champs variables du document */}
          <div className="rounded-2xl border border-border bg-white p-6 sm:p-8 shadow-xs space-y-6">
            {/* 1. Sujet / Objet principal */}
            <div>
              <label htmlFor="doc-sujet" className="block text-sm font-bold text-[#24140D] mb-1.5">
                Objet ou titre principal du document <span className="text-red-600">*</span>
              </label>
              <input
                id="doc-sujet"
                type="text"
                value={sujet}
                onChange={(e) => setSujet(e.target.value)}
                placeholder="Ex. Attestation d'incubation du projet AgriSol au FabLab 4.0"
                required
                className="w-full rounded-xl border border-border px-4 py-3 text-sm text-[#24140D] focus:border-[#C99A68] focus:ring-2 focus:ring-[#C99A68]/20 transition-all font-medium"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Titre officiel imprimé en en-tête du document.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* 2. Bénéficiaire / Partenaire */}
              <div>
                <label htmlFor="doc-beneficiaire" className="block text-sm font-bold text-[#24140D] mb-1.5">
                  Bénéficiaire, porteur ou partenaire concerné
                </label>
                <div className="relative">
                  <Building2 className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <input
                    id="doc-beneficiaire"
                    type="text"
                    value={beneficiaire}
                    onChange={(e) => setBeneficiaire(e.target.value)}
                    placeholder="Ex. Startup AgriSol SARL / Dr. Amadou Diallo"
                    className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-border text-sm text-[#24140D] focus:border-[#C99A68] focus:ring-2 focus:ring-[#C99A68]/20 transition-all"
                  />
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Nom officiel de la structure, de l&apos;entreprise ou du récipiendaire.
                </p>
              </div>

              {/* 3. Projet incubé rattaché (optionnel) */}
              <div>
                <label htmlFor="doc-projet" className="block text-sm font-bold text-[#24140D] mb-1.5">
                  Rattacher à un projet incubé (optionnel)
                </label>
                <select
                  id="doc-projet"
                  value={selectedProjetId ?? ""}
                  onChange={(e) =>
                    setSelectedProjetId(e.target.value ? Number(e.target.value) : null)
                  }
                  className="w-full rounded-xl border border-border px-4 py-2.5 text-sm text-[#24140D] bg-white focus:border-[#C99A68] focus:ring-2 focus:ring-[#C99A68]/20 transition-all"
                >
                  <option value="">-- Aucun projet associé (document général) --</option>
                  {projets.map((p) => (
                    <option key={p.id} value={p.id}>
                      #{p.id} — {p.titre} {p.statut ? `(${p.statut})` : ""}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-muted-foreground mt-1">
                  Intègre automatiquement le domaine, la cohorte et les jalons du projet.
                </p>
              </div>
            </div>

            {/* 4. Contexte & Enjeux spécifiques */}
            <div>
              <label htmlFor="doc-contexte" className="block text-sm font-bold text-[#24140D] mb-1.5">
                Contexte, motifs et enjeux spécifiques
              </label>
              <textarea
                id="doc-contexte"
                rows={3}
                value={contexte}
                onChange={(e) => setContexte(e.target.value)}
                placeholder="Ex. Dans le cadre de la cohorte 2026, l'entreprise bénéficie d'un accompagnement sur les prototypes IoT agricoles et d'un espace de travail au FabLab de Diamniadio..."
                className="w-full rounded-xl border border-border p-3.5 text-sm text-[#24140D] focus:border-[#C99A68] focus:ring-2 focus:ring-[#C99A68]/20 transition-all leading-relaxed"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Détaillez les circonstances particulières pour que l&apos;IA personnalise les clauses.
              </p>
            </div>

            {/* 5. Dispositions clés, Montants ou Durée */}
            <div>
              <label htmlFor="doc-dispositions" className="block text-sm font-bold text-[#24140D] mb-1.5">
                Modalités particulières, dates d&apos;effet ou engagements (optionnel)
              </label>
              <input
                id="doc-dispositions"
                type="text"
                value={dispositions}
                onChange={(e) => setDispositions(e.target.value)}
                placeholder="Ex. Période de 12 mois à compter du 1er novembre 2026 · Dotation d'hébergement FabLab 4.0"
                className="w-full rounded-xl border border-border px-4 py-2.5 text-sm text-[#24140D] focus:border-[#C99A68] focus:ring-2 focus:ring-[#C99A68]/20 transition-all"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Toutes données chiffrées, dates limites ou mentions légales requises.
              </p>
            </div>

            {/* Message d'erreur clair en français */}
            {errorMsg && (
              <div className="rounded-xl border border-red-300 bg-red-50 p-4 text-xs text-red-900 space-y-1">
                <p className="font-bold text-red-800 flex items-center gap-1.5">
                  <span>⚠️</span> Erreur de génération
                </p>
                <p>{errorMsg}</p>
                <p className="text-[11px] text-red-700 italic">
                  Vos saisies ont été conservées. Vous pouvez corriger et réessayer.
                </p>
              </div>
            )}

            {/* Bouton de génération IA */}
            <div className="pt-2 flex flex-col sm:flex-row items-center gap-4">
              <Button
                type="submit"
                variant="ia"
                disabled={generating}
                className="w-full sm:w-auto px-8 py-3.5 text-sm font-bold shadow-md transition-all"
              >
                {generating ? (
                  <span className="flex items-center gap-2">
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    Génération du document conforme en cours...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-amber-300" />
                    <span>Générer le document avec l&apos;IA</span>
                    <ArrowRight className="w-4 h-4" />
                  </span>
                )}
              </Button>

              {generating && (
                <span className="text-xs text-muted-foreground animate-pulse">
                  Rédaction des {selectedModele.sections?.length || 4} sections selon le Canva officiel CIAT...
                </span>
              )}
            </div>
          </div>
        </form>
      )}

      {/* 3. Rendu Immédiat du Document Généré */}
      {documentGenere && (
        <div className="rounded-2xl border border-emerald-300 bg-emerald-50/40 p-6 sm:p-8 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-emerald-200 pb-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Badge tone="succes">Document certifié généré</Badge>
                <span className="text-xs font-mono text-muted-foreground">
                  ID #{documentGenere.id} (Version {documentGenere.version})
                </span>
              </div>
              <h2 className="text-xl sm:text-2xl font-bold text-[#612D10]">
                {documentGenere.titre}
              </h2>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="primary"
                onClick={() => onDocumentCreated(documentGenere.id)}
                className="shadow-md"
              >
                <span>Éditer & Exporter ce document (PDF / DOCX)</span>
                <span className="ml-1">→</span>
              </Button>
            </div>
          </div>

          {/* Rendu section par section */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#612D10]">
              Contenu structuré section par section ({documentGenere.sections.length} sections) :
            </h3>
            <div className="space-y-3">
              {documentGenere.sections.map((sec, index) => (
                <div
                  key={sec.code || index}
                  className="rounded-xl border border-border bg-white p-5 shadow-xs"
                >
                  <div className="flex items-center justify-between mb-2 border-b border-border/40 pb-2">
                    <span className="font-bold text-[#612D10] text-sm">
                      Section {index + 1} : {sec.titre || sec.code}
                    </span>
                    <span className="text-[11px] font-mono text-muted-foreground uppercase">
                      [{sec.code}]
                    </span>
                  </div>
                  <div className="text-xs leading-relaxed text-foreground whitespace-pre-wrap font-sans">
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
