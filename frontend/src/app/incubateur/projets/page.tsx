"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  Bell,
  Bot,
  Calendar,
  ChevronRight,
  FileText,
  FolderOpen,
  Trash2,
  Undo2,
} from "lucide-react";
import DeleteProjectModal, {
  peutSupprimerOuRetirer,
  type ProjetASupprimer,
} from "@/components/incubateur/DeleteProjectModal";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { ApiErrorBanner, Badge } from "@/components/ui";
import { useAuth } from "@/context/AuthContext";
import { api, type Page } from "@/lib/api";
import { suiviErrorMessage } from "@/lib/incubator";

interface ProjetListe {
  id: number;
  titre: string;
  domaine_nom?: string;
  porteur_nom?: string;
  statut: string;
}

const STATUTS: Record<string, string> = {
  idee: "Idée",
  depose: "Dossier déposé",
  selectionne: "Sélectionné",
  incube: "En incubation",
  prototype: "Prototype",
  termine: "Incubation terminée",
  rejete: "Non retenu",
  retire: "Candidature retirée",
};

interface EtapeDispositifConfig {
  index: number;
  numero: string;
  titre: string;
  sousTitreDefault: string;
  description: string;
  actionLabel: string;
  targetAnchor: string;
}

const ETAPES_DISPOSITIF: EtapeDispositifConfig[] = [
  {
    index: 0,
    numero: "01",
    titre: "Prototypage",
    sousTitreDefault: "Ateliers & bancs d'essai",
    description: "Phase de fabrication numérique, modélisation 3D et prototypage technique dans les ateliers du CIAT à Diamniadio.",
    actionLabel: "Consulter les objectifs & ateliers techniques",
    targetAnchor: "#objectifs",
  },
  {
    index: 1,
    numero: "02",
    titre: "Évaluation",
    sousTitreDefault: "Jalons & maturité",
    description: "Revue collégiale des livrables par le comité scientifique et évaluation de la conformité des prototypes aux jalons fixés.",
    actionLabel: "Consulter les jalons et critères d'évaluation",
    targetAnchor: "#jalons",
  },
  {
    index: 2,
    numero: "03",
    titre: "Mentorat",
    sousTitreDefault: "Suivi & réseau",
    description: "Séances de travail régulières avec votre mentor référent, bilans périodiques et mise en relation avec l'écosystème d'innovation.",
    actionLabel: "Consulter le mentor référent & bilans de suivi",
    targetAnchor: "#mentor",
  },
];

function getEtapeReelleIndex(statut?: string): number {
  switch (statut) {
    case "idee":
    case "depose":
      return 0; // Au stade de prototypage / formulation initiale
    case "selectionne":
    case "incube":
    case "prototype":
      return 1; // Au stade d'évaluation / test et validation des jalons
    case "termine":
      return 3; // Tout le parcours est validé
    default:
      return 0;
  }
}

function ListeProjets() {
  const { user } = useAuth();
  const canSubmit = user?.role === "porteur" || user?.role === "coordonnateur" || user?.role === "administrateur";
  const canEvaluate = user?.role === "membre_comite" || user?.role === "coordonnateur" || user?.role === "administrateur";
  const [projets, setProjets] = useState<ProjetListe[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [aSupprimer, setASupprimer] = useState<ProjetASupprimer | null>(null);
  const [selectedEtape, setSelectedEtape] = useState<number | null>(null);

  const [tick, setTick] = useState(0);
  const load = () => { setError(null); setProjets(null); setTick((t) => t + 1); };

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await api<Page<ProjetListe> | ProjetListe[]>("/projets/");
        if (cancelled) return;
        setProjets(Array.isArray(res) ? res : res.results);
        setError(null);
      } catch (err) {
        if (!cancelled) setError(suiviErrorMessage(err, "Impossible de charger vos projets. Veuillez réessayer."));
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [tick]);

  const premierProjet = projets && projets.length > 0 ? projets[0] : null;
  const etapeReelle = getEtapeReelleIndex(premierProjet?.statut);
  // Redirections distinctes et ciblées
  const dossierUrl = "/incubateur"; // Consultation du dossier de candidature et pièces jointes
  const etapesUrl = premierProjet ? `/incubateur/projets/${premierProjet.id}#jalons` : "/incubateur"; // Défilement vers les jalons

  return (
    <div className="w-full">
      <div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8 space-y-6 sm:space-y-8">
        {/* Fil d'Ariane / Repère Espace Candidat */}
        <div className="flex items-center gap-1.5 text-xs font-semibold text-[#8C6D58]">
          <Link
            href="/incubateur"
            className="hover:text-[#612D10] hover:underline transition-colors"
          >
            Espace Candidat
          </Link>
          <span className="text-[#C99A68]/60">/</span>
          <span className="text-[#612D10] font-bold">Suivi de mes projets</span>
        </div>

        {/* 1. EN-TÊTE ÉPURÉ ET HARMONISÉ (Standard CIAT de l'espace porteur) */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            <h1 className="font-[family-name:var(--font-title)] text-2xl font-extrabold tracking-tight text-[#24140D] sm:text-3xl">
              Suivi des projets
            </h1>
            <p className="text-xs sm:text-sm text-[#6b5646]">
              Retrouvez l&apos;avancement de vos candidatures et les prochaines étapes.
            </p>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            <Link
              href="/incubateur/calendrier"
              className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-[#EFE4D6] bg-white px-3.5 text-xs font-bold text-[#612D10] shadow-2xs transition-all hover:border-[#A35926] hover:bg-[#F2E5D5] hover:text-[#3F1D0A] hover:shadow-xs active:scale-[0.98] cursor-pointer"
            >
              <Calendar className="h-4 w-4 text-[#A35926]" />
              <span>Calendrier</span>
            </Link>
            <Link
              href="/assistant"
              className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-[#EFE4D6] bg-white px-3.5 text-xs font-bold text-[#612D10] shadow-2xs transition-all hover:border-[#A35926] hover:bg-[#F2E5D5] hover:text-[#3F1D0A] hover:shadow-xs active:scale-[0.98] cursor-pointer"
            >
              <Bot className="h-4 w-4 text-[#A35926]" />
              <span>Assistant IA</span>
            </Link>
            {canEvaluate && (
              <Link
                href="/incubateur/evaluation"
                className="inline-flex min-h-10 items-center whitespace-nowrap rounded-xl border border-[#EFE4D6] bg-white px-4 text-xs font-bold text-[#6b5646] shadow-2xs transition-all hover:border-[#A35926] hover:bg-[#F2E5D5] hover:text-[#3F1D0A] hover:shadow-xs active:scale-[0.98] cursor-pointer"
              >
                Évaluations comité
              </Link>
            )}
            <Link
              href="/incubateur/alertes"
              className="p-2.5 rounded-xl border border-[#EFE4D6] bg-white text-[#612D10] hover:border-[#A35926] hover:bg-[#F2E5D5] hover:shadow-xs transition-all active:scale-[0.98] relative shadow-xs cursor-pointer"
              aria-label="Alertes de retard"
              title="Consulter les alertes de retard"
            >
              <Bell className="h-4 w-4" aria-hidden="true" />
              <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-[#A35926]" />
            </Link>
          </div>
        </div>

        {error && <ApiErrorBanner message={error} onRetry={load} />}

        {/* 2. BANNIÈRE SUIVI DE PROJETS COMPACTE & ÉQUILIBRÉE */}
        <div className="overflow-hidden rounded-2xl border border-[#EFE4D6] bg-[#F7EFE6] shadow-2xs">
          {/* VERSION MOBILE (< md) : Photo compacte en haut, texte en dessous */}
          <div className="md:hidden">
            <div className="relative h-20 w-full overflow-hidden">
              <Image
                src="/images/ciat-suivi-banner.jpg"
                alt="Ingénieur CIAT en laboratoire d'innovation technologique"
                fill
                className="object-cover object-center"
                sizes="(max-width: 768px) 100vw, 44vw"
              />
            </div>
            <div className="p-3.5 space-y-1.5 bg-[#F7EFE6]">
              <div className="h-0.5 w-6 rounded-full bg-[#A35926]" />
              <h2 className="font-[family-name:var(--font-title)] text-sm sm:text-base font-bold text-[#24140D] tracking-tight leading-snug">
                <span className="whitespace-nowrap">Votre parcours de projet,</span>{" "}
                <span className="whitespace-nowrap">étape par étape</span>
              </h2>
              <p className="text-[11px] text-[#6b5646] leading-relaxed">
                Du dépôt de votre candidature jusqu’à la décision finale, le CIAT vous accompagne à chaque étape de votre projet innovant.
              </p>
              {canSubmit && (
                <div className="pt-1">
                  <Link
                    href="/incubateur"
                    className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#612D10] hover:bg-[#3F1D0A] px-4.5 py-2 text-xs sm:text-sm font-semibold text-white shadow-xs transition-all"
                  >
                    <span>Déposer une candidature</span>
                    <ArrowRight className="h-4 w-4 stroke-[2]" aria-hidden="true" />
                  </Link>
                </div>
              )}
            </div>
          </div>

          {/* VERSION DESKTOP (>= md) : Format compact et affiné avec courbe SVG et texte aéré */}
          <div className="hidden md:block relative min-h-[140px] lg:min-h-[150px]">
            {/* Motifs de fond décoratifs organiques doux */}
            <div className="pointer-events-none absolute -left-12 -top-12 h-44 w-44 rounded-full bg-[#EFE4D6]/50 blur-2xl" />
            <div className="pointer-events-none absolute bottom-0 left-1/3 h-32 w-32 rounded-full bg-[#E8D9C9]/50 blur-xl" />

            {/* Photo Atelier Robotique à droite (100% nette) */}
            <div className="absolute inset-y-0 right-0 w-[46%] lg:w-[44%] h-full">
              <Image
                src="/images/ciat-suivi-banner.jpg"
                alt="Ingénieur CIAT en laboratoire d'innovation technologique"
                fill
                className="object-cover object-center"
                sizes="(max-width: 1024px) 46vw, 44vw"
              />
            </div>

            {/* Vagues organiques continues en SVG */}
            <div className="absolute inset-0 pointer-events-none z-10">
              <svg
                viewBox="0 0 1200 400"
                preserveAspectRatio="none"
                className="h-full w-full"
                aria-hidden="true"
              >
                <path
                  d="M 0,0 L 680,0 C 680,80 770,120 770,200 C 770,280 670,320 670,400 L 0,400 Z"
                  fill="#EADBCE"
                  fillOpacity="0.85"
                />
                <path
                  d="M 0,0 L 650,0 C 650,80 740,120 740,200 C 740,280 640,320 640,400 L 0,400 Z"
                  fill="#F7EFE6"
                />
              </svg>
            </div>

            {/* Contenu Texte compact à gauche */}
            <div className="relative z-20 w-[58%] lg:w-[55%] py-3.5 px-5 lg:py-4 lg:px-6 flex flex-col justify-center space-y-2">
              <div className="h-0.5 w-6 rounded-full bg-[#A35926]" />
              <h2 className="font-[family-name:var(--font-title)] text-base lg:text-lg font-bold text-[#24140D] tracking-tight leading-snug">
                <span className="whitespace-nowrap">Votre parcours de projet,</span>{" "}
                <span className="whitespace-nowrap">étape par étape</span>
              </h2>
              <p className="text-[11.5px] lg:text-xs text-[#6b5646] leading-relaxed max-w-lg line-clamp-2">
                Du dépôt de votre candidature jusqu’à la décision finale, le CIAT vous accompagne à chaque étape de votre projet innovant.
              </p>
              {canSubmit && (
                <div className="pt-1">
                  <Link
                    href="/incubateur"
                    className="inline-flex items-center gap-2 rounded-xl bg-[#612D10] hover:bg-[#3F1D0A] px-5 py-2 text-xs sm:text-sm font-semibold text-white shadow-xs hover:shadow-sm transition-all hover:scale-[1.01]"
                  >
                    <span>Déposer une candidature</span>
                    <ArrowRight className="h-4 w-4 stroke-[2]" aria-hidden="true" />
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>

      {/* 3. LISTE DES PROJETS ENREGISTRÉS OU ÉTAT VIDE AÉRÉ */}
      {!projets ? (
        <div className="flex justify-center py-16" role="status" aria-label="Chargement">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-[#C99A68] border-t-[#612D10]" />
        </div>
      ) : projets.length === 0 ? (
        <div className="rounded-2xl border border-[#EFE4D6] bg-white p-8 sm:p-10 shadow-sm text-center">
          <div className="max-w-md mx-auto space-y-4">
            <div className="mx-auto h-16 w-16 rounded-2xl bg-[#FAF4ED] border border-[#EFE4D6] flex items-center justify-center text-[#A35926]">
              <FolderOpen className="h-8 w-8" aria-hidden="true" />
            </div>
            <div>
              <h3 className="font-[family-name:var(--font-title)] text-lg font-bold text-[#24140D]">
                Aucun projet à suivre pour le moment
              </h3>
              <p className="text-xs sm:text-sm text-[#6b5646] mt-1 leading-relaxed">
                Vos projets apparaîtront ici dès qu&apos;une candidature aura été enregistrée et transmise.
              </p>
            </div>
            {canSubmit && (
              <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
                <Link
                  href="/incubateur"
                  className="inline-flex items-center gap-2 rounded-xl bg-[#612D10] hover:bg-[#3F1D0A] px-6 py-2.5 text-xs font-bold text-white shadow-sm transition-all hover:scale-[1.02] hover:shadow-md active:scale-[0.98] cursor-pointer"
                >
                  <FileText className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>Déposer une candidature</span>
                  <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                </Link>
                <Link
                  href="/incubateur"
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#A35926] hover:text-[#612D10] underline underline-offset-4 py-2 transition-colors cursor-pointer"
                >
                  <span>Comprendre les étapes du suivi</span>
                </Link>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between border-b border-[#EFE4D6] pb-2">
            <h2 className="font-[family-name:var(--font-title)] text-base font-bold text-[#612D10]">
              Projets enregistrés ({projets.length})
            </h2>
          </div>
          <ul className="grid gap-4 sm:grid-cols-2">
            {projets.map((p) => (
              <li key={p.id} className="flex flex-col">
                <Link
                  href={`/incubateur/projets/${p.id}`}
                  className="block flex-1 rounded-2xl border border-[#EFE4D6] bg-white p-5 shadow-sm transition-all hover:border-[#A35926] hover:bg-[#FAF7F2] hover:shadow-md hover:-translate-y-0.5 cursor-pointer"
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className="font-[family-name:var(--font-title)] text-base font-bold text-[#612D10]">
                      {p.titre}
                    </span>
                    <Badge>{STATUTS[p.statut] ?? "Statut non reconnu"}</Badge>
                  </div>
                  <span className="mt-2 block text-xs font-medium text-[#8C6D4F]">{p.domaine_nom}</span>
                  {p.porteur_nom && <span className="block text-xs text-[#6b5646]">{p.porteur_nom}</span>}
                </Link>
                {user?.role === "porteur" && peutSupprimerOuRetirer(p.statut) && (
                  <button
                    type="button"
                    onClick={() => setASupprimer({ id: p.id, titre: p.titre, statut: p.statut })}
                    className="mt-1.5 inline-flex cursor-pointer items-center gap-1.5 self-end rounded-lg px-2.5 py-1.5 text-[11px] font-semibold text-[#8C6D4F] transition-colors hover:bg-[#FEE2E2] hover:text-[#DC2626]"
                  >
                    {p.statut === "depose" ? <Undo2 className="h-3.5 w-3.5" /> : <Trash2 className="h-3.5 w-3.5" />}
                    {p.statut === "depose" ? "Retirer ma candidature" : "Supprimer ce projet"}
                  </button>
                )}
              </li>
            ))}
          </ul>
          {aSupprimer && (
            <DeleteProjectModal
              projet={aSupprimer}
              onClose={() => setASupprimer(null)}
              onDone={(id) => {
                setProjets((prev) => (prev ? prev.filter((x) => x.id !== id) : prev));
                setASupprimer(null);
              }}
            />
          )}
        </div>
      )}

      {/* 4. PARCOURS D'ACCOMPAGNEMENT EN CHEVRONS INTERACTIFS & DYNAMIQUES */}
      <section className="space-y-3">
        <div className="flex items-center justify-between border-b border-[#EFE4D6] pb-2">
          <div className="flex items-center gap-2">
            <h2 className="font-[family-name:var(--font-title)] text-base font-bold text-[#612D10]">
              Dispositif d&apos;accompagnement CIAT
            </h2>
            {premierProjet && (
              <span className="hidden sm:inline-block text-[11px] font-medium text-[#8C6D4F] bg-[#FAF4ED] px-2.5 py-0.5 rounded-full border border-[#EFE4D6]">
                Projet : {premierProjet.titre}
              </span>
            )}
          </div>
          <span className="text-[11px] text-[#8C6D4F] italic hidden md:inline">
            Cliquez sur une étape pour afficher les détails
          </span>
        </div>

        {/* Barre de chevrons imbriqués avec flèches connectées */}
        <div className="overflow-x-auto pb-1">
          <div className="flex min-w-[580px] sm:min-w-0 rounded-2xl overflow-hidden border border-[#EFE4D6] bg-white shadow-2xs">
            {ETAPES_DISPOSITIF.map((etape) => {
              const isValide = etape.index < etapeReelle;
              const isEnCours = etape.index === etapeReelle;
              const isAVenir = etape.index > etapeReelle;
              const isSelected = selectedEtape === etape.index;

              // Géométrie polygonale selon la position (première, centrale, dernière)
              const clipClass =
                etape.index === 0
                  ? "[clip-path:polygon(0%_0%,calc(100%-18px)_0%,100%_50%,calc(100%-18px)_100%,0%_100%)] z-30"
                  : etape.index === 1
                  ? "-ml-[15px] [clip-path:polygon(0%_0%,calc(100%-18px)_0%,100%_50%,calc(100%-18px)_100%,0%_100%,18px_50%)] z-20"
                  : "-ml-[15px] [clip-path:polygon(0%_0%,100%_0%,100%_100%,0%_100%,18px_50%)] z-10";

              // Couleurs dynamiques selon l'état réel du projet
              const colorClass = isValide
                ? "bg-[#24140D] text-white hover:bg-[#1A0E08]"
                : isEnCours
                ? "bg-[#C99A68] text-white hover:bg-[#B88755]"
                : "bg-[#F3F4F6] text-[#24140D] hover:bg-[#EAEAEA]";

              // Marges intérieures pour centrer le texte sans chevaucher les pointes de flèches
              const paddingClass =
                etape.index === 0 ? "pl-5 pr-8" : etape.index === 1 ? "pl-8 pr-8" : "pl-8 pr-5";

              return (
                <button
                  key={etape.index}
                  type="button"
                  onClick={() => setSelectedEtape(isSelected ? null : etape.index)}
                  className={`relative flex-1 py-3.5 flex flex-col justify-center text-left transition-all cursor-pointer group active:scale-[0.99] select-none ${clipClass} ${colorClass} ${paddingClass} ${
                    isSelected ? "brightness-105" : ""
                  }`}
                  aria-label={`Étape ${etape.numero} : ${etape.titre}`}
                >
                  <div className="flex items-center gap-1.5 font-[family-name:var(--font-title)] text-xs sm:text-sm font-bold tracking-tight">
                    {isValide && <span className="text-sm font-bold text-white">✓</span>}
                    {isEnCours && (
                      <span
                        className="inline-block h-2 w-2 rounded-full bg-white animate-pulse"
                        aria-hidden="true"
                      />
                    )}
                    <span>
                      {etape.numero}. {etape.titre}
                    </span>
                  </div>
                  <div className={`text-[11px] font-normal ${isValide ? "pl-4 text-[#D8C7B9]" : isEnCours ? "text-[#FAF4ED] font-medium" : "text-[#6B7280]"}`}>
                    {isValide
                      ? "Validé"
                      : isEnCours
                      ? "En cours"
                      : isAVenir
                      ? "À venir"
                      : etape.sousTitreDefault}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Panneau d'information interactif lumineux relié par une flèche indicatrice */}
        {selectedEtape !== null && (
          <div className="relative pt-1 animate-in fade-in duration-200">
            {/* Bec / flèche indicatrice pointant depuis le chevron cliqué vers le panneau */}
            <div
              className="hidden sm:block absolute -top-1.5 z-20 pointer-events-none transition-all duration-300"
              style={{
                left:
                  selectedEtape === 0
                    ? "16.6%"
                    : selectedEtape === 1
                    ? "50%"
                    : "83.3%",
                transform: "translateX(-50%)",
              }}
            >
              <div className="w-3.5 h-3.5 bg-white border-t border-l border-[#C99A68] rotate-45" />
            </div>

            {/* Corps du panneau lumineux */}
            <div className="rounded-2xl border-2 border-[#C99A68]/40 bg-white p-5 sm:p-6 shadow-sm text-xs space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-[#EFE4D6] pb-3">
                <span className="font-[family-name:var(--font-title)] text-base font-bold text-[#24140D]">
                  Étape {ETAPES_DISPOSITIF[selectedEtape].numero} : {ETAPES_DISPOSITIF[selectedEtape].titre}
                </span>
                <span
                  className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold ${
                    selectedEtape < etapeReelle
                      ? "bg-[#24140D] text-white"
                      : selectedEtape === etapeReelle
                      ? "bg-[#C99A68] text-white shadow-2xs"
                      : "bg-[#F3F4F6] text-[#4B5563]"
                  }`}
                >
                  {selectedEtape < etapeReelle
                    ? "✓ Étape franchie & validée"
                    : selectedEtape === etapeReelle
                    ? "● Étape active en cours"
                    : "Étape future programmée"}
                </span>
              </div>

              <p className="text-xs sm:text-sm text-[#6b5646] leading-relaxed">
                {ETAPES_DISPOSITIF[selectedEtape].description}
              </p>

              <div className="pt-2 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-t border-[#EFE4D6]/70">
                {premierProjet ? (
                  <Link
                    href={`/incubateur/projets/${premierProjet.id}${ETAPES_DISPOSITIF[selectedEtape].targetAnchor}`}
                    className="inline-flex items-center gap-2 rounded-xl bg-[#612D10] hover:bg-[#3F1D0A] px-4 py-2.5 text-xs font-bold text-white shadow-xs transition-all hover:scale-[1.01] hover:shadow-sm cursor-pointer"
                  >
                    <span>{ETAPES_DISPOSITIF[selectedEtape].actionLabel}</span>
                    <ChevronRight className="h-4 w-4" aria-hidden="true" />
                  </Link>
                ) : (
                  <Link
                    href="/incubateur"
                    className="inline-flex items-center gap-2 rounded-xl bg-[#612D10] hover:bg-[#3F1D0A] px-4 py-2.5 text-xs font-bold text-white shadow-xs transition-all hover:scale-[1.01] hover:shadow-sm cursor-pointer"
                  >
                    <span>Déposer une candidature</span>
                    <ChevronRight className="h-4 w-4" aria-hidden="true" />
                  </Link>
                )}

                <button
                  type="button"
                  onClick={() => setSelectedEtape(null)}
                  className="text-xs font-semibold text-[#8C6D4F] hover:text-[#612D10] underline underline-offset-4 cursor-pointer self-end sm:self-auto py-1"
                >
                  Fermer l&apos;encart
                </button>
              </div>
            </div>
          </div>
        )}
      </section>

      {/* 5. CARTES D'ACCÈS RAPIDE AÉRÉES ET INTERACTIVES */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        
        {/* Carte 1 : Dossier déposé -> mène directement au dossier de candidature et pièces */}
        <div className="group relative overflow-hidden rounded-2xl border border-[#EFE4D6] bg-white p-6 shadow-sm hover:shadow-md hover:border-[#C99A68] transition-all flex flex-col justify-between">
          <div className="relative z-10">
            <div className="h-11 w-11 rounded-xl bg-[#FAF4ED] text-[#612D10] flex items-center justify-center mb-4 group-hover:bg-[#612D10] group-hover:text-white transition-colors">
              <FileText className="h-5 w-5" aria-hidden="true" />
            </div>
            <h3 className="font-[family-name:var(--font-title)] text-base font-bold text-[#24140D] group-hover:text-[#612D10] transition-colors">
              Dossier déposé
            </h3>
            <p className="text-xs text-[#6b5646] mt-1.5 leading-relaxed">
              Consultez les pièces administratives et la synthèse de votre dossier de candidature.
            </p>
          </div>
          <div className="relative z-10 pt-5 mt-4 border-t border-[#EFE4D6]/60">
            <Link
              href={dossierUrl}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-[#612D10] group-hover:text-[#A35926] transition-colors"
            >
              <span>Voir mon dossier de candidature</span>
              <ChevronRight className="h-3.5 w-3.5" aria-hidden="true" />
            </Link>
          </div>
          {/* Arcs d'angle décoratifs subtils */}
          <div className="pointer-events-none absolute bottom-0 right-0 h-20 w-20 overflow-hidden rounded-br-2xl">
            <div className="absolute -bottom-6 -right-6 h-20 w-20 rounded-full bg-[#EADBCE]/50" />
            <div className="absolute -bottom-10 -right-10 h-16 w-16 rounded-full bg-[#FAF4ED]" />
          </div>
        </div>

        {/* Carte 2 : Prochaines étapes -> mène aux jalons du projet avec ancre */}
        <div className="group relative overflow-hidden rounded-2xl border border-[#EFE4D6] bg-white p-6 shadow-sm hover:shadow-md hover:border-[#C99A68] transition-all flex flex-col justify-between">
          <div className="relative z-10">
            <div className="h-11 w-11 rounded-xl bg-[#FAF4ED] text-[#612D10] flex items-center justify-center mb-4 group-hover:bg-[#612D10] group-hover:text-white transition-colors">
              <Calendar className="h-5 w-5" aria-hidden="true" />
            </div>
            <h3 className="font-[family-name:var(--font-title)] text-base font-bold text-[#24140D] group-hover:text-[#612D10] transition-colors">
              Prochaines étapes
            </h3>
            <p className="text-xs text-[#6b5646] mt-1.5 leading-relaxed">
              Découvrez le planning des jalons et les livrables attendus pour la suite.
            </p>
          </div>
          <div className="relative z-10 pt-5 mt-4 border-t border-[#EFE4D6]/60">
            <Link
              href={etapesUrl}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-[#612D10] group-hover:text-[#A35926] transition-colors"
            >
              <span>Voir les jalons à franchir</span>
              <ChevronRight className="h-3.5 w-3.5" aria-hidden="true" />
            </Link>
          </div>
          {/* Arcs d'angle décoratifs subtils */}
          <div className="pointer-events-none absolute bottom-0 right-0 h-20 w-20 overflow-hidden rounded-br-2xl">
            <div className="absolute -bottom-6 -right-6 h-20 w-20 rounded-full bg-[#EADBCE]/50" />
            <div className="absolute -bottom-10 -right-10 h-16 w-16 rounded-full bg-[#FAF4ED]" />
          </div>
        </div>

        {/* Carte 3 : Alertes & échéances -> mène aux alertes */}
        <div className="group relative overflow-hidden rounded-2xl border border-[#EFE4D6] bg-white p-6 shadow-sm hover:shadow-md hover:border-[#C99A68] transition-all flex flex-col justify-between">
          <div className="relative z-10">
            <div className="h-11 w-11 rounded-xl bg-[#FAF4ED] text-[#612D10] flex items-center justify-center mb-4 group-hover:bg-[#612D10] group-hover:text-white transition-colors">
              <Bell className="h-5 w-5" aria-hidden="true" />
            </div>
            <h3 className="font-[family-name:var(--font-title)] text-base font-bold text-[#24140D] group-hover:text-[#612D10] transition-colors">
              Alertes et échéances
            </h3>
            <p className="text-xs text-[#6b5646] mt-1.5 leading-relaxed">
              Restez informé des rappels, dates de comité et notifications importantes.
            </p>
          </div>
          <div className="relative z-10 pt-5 mt-4 border-t border-[#EFE4D6]/60">
            <Link
              href="/incubateur/alertes"
              className="inline-flex items-center gap-1.5 text-xs font-bold text-[#612D10] group-hover:text-[#A35926] transition-colors"
            >
              <span>Voir mes alertes</span>
              <ChevronRight className="h-3.5 w-3.5" aria-hidden="true" />
            </Link>
          </div>
          {/* Arcs d'angle décoratifs subtils */}
          <div className="pointer-events-none absolute bottom-0 right-0 h-20 w-20 overflow-hidden rounded-br-2xl">
            <div className="absolute -bottom-6 -right-6 h-20 w-20 rounded-full bg-[#EADBCE]/50" />
            <div className="absolute -bottom-10 -right-10 h-16 w-16 rounded-full bg-[#FAF4ED]" />
          </div>
        </div>

      </div>

      </div>
    </div>
  );
}

export default function ProjetsPage() {
  return (
    <ProtectedRoute allowedRoles={["porteur", "mentor", "coordonnateur", "administrateur"]}>
      <ListeProjets />
    </ProtectedRoute>
  );
}
