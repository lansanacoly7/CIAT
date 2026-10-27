"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  Bell,
  Bot,
  Calendar,
  ChevronRight,
  FileText,
  FolderOpen,
} from "lucide-react";
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
};

function ListeProjets() {
  const { user } = useAuth();
  const canSubmit = user?.role === "porteur" || user?.role === "coordonnateur" || user?.role === "administrateur";
  const canEvaluate = user?.role === "membre_comite" || user?.role === "coordonnateur" || user?.role === "administrateur";
  const [projets, setProjets] = useState<ProjetListe[] | null>(null);
  const [error, setError] = useState<string | null>(null);

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
  const dossierUrl = premierProjet ? `/incubateur/projets/${premierProjet.id}` : "/incubateur";
  const etapesUrl = premierProjet ? `/incubateur/projets/${premierProjet.id}` : "/incubateur";

  return (
    <div className="w-full">
      <div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8 space-y-6 sm:space-y-8">
        {/* Fil d'Ariane / Repère Espace Candidat */}
        <div className="flex items-center gap-2 text-xs font-semibold text-[#8C6D4F]">
          <span>Espace Candidat</span>
          <span className="text-[#C99A68]/60">/</span>
          <span className="text-[#612D10]">Suivi de mes projets</span>
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
              className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-[#EFE4D6] bg-white px-3.5 text-xs font-semibold text-[#612D10] shadow-2xs transition-all hover:border-[#C99A68] hover:bg-[#FAF7F2]"
            >
              <Calendar className="h-4 w-4 text-[#A35926]" />
              <span>Calendrier</span>
            </Link>
            <Link
              href="/assistant"
              className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-[#EFE4D6] bg-white px-3.5 text-xs font-semibold text-[#612D10] shadow-2xs transition-all hover:border-[#C99A68] hover:bg-[#FAF7F2]"
            >
              <Bot className="h-4 w-4 text-[#A35926]" />
              <span>Assistant IA</span>
            </Link>
            {canEvaluate && (
              <Link
                href="/incubateur/evaluation"
                className="inline-flex min-h-10 items-center whitespace-nowrap rounded-xl border border-[#EFE4D6] bg-white px-4 text-xs font-semibold text-[#6b5646] shadow-2xs transition-all hover:border-[#C99A68] hover:text-[#612D10]"
              >
                Évaluations comité
              </Link>
            )}
            <Link
              href="/incubateur/alertes"
              className="p-2.5 rounded-xl border border-[#EFE4D6] bg-white text-[#612D10] hover:bg-[#FAF7F2] transition-colors relative shadow-xs"
              aria-label="Alertes de retard"
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
              <img
                src="/images/ciat-suivi-banner.jpg"
                alt="Ingénieur CIAT en laboratoire d'innovation technologique"
                className="h-full w-full object-cover object-center"
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
              <img
                src="/images/ciat-suivi-banner.jpg"
                alt="Ingénieur CIAT en laboratoire d'innovation technologique"
                className="h-full w-full object-cover object-center"
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

      {/* 3. CARTES D'ACCÈS RAPIDE AÉRÉES ET INTERACTIVES */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        
        {/* Carte 1 : Dossier déposé -> mène directement au dossier du projet */}
        <div className="group relative overflow-hidden rounded-2xl border border-[#EFE4D6] bg-white p-6 shadow-sm hover:shadow-md hover:border-[#C99A68] transition-all flex flex-col justify-between">
          <div className="relative z-10">
            <div className="h-11 w-11 rounded-xl bg-[#FAF4ED] text-[#612D10] flex items-center justify-center mb-4 group-hover:bg-[#612D10] group-hover:text-white transition-colors">
              <FileText className="h-5 w-5" aria-hidden="true" />
            </div>
            <h3 className="font-[family-name:var(--font-title)] text-base font-bold text-[#24140D] group-hover:text-[#612D10] transition-colors">
              Dossier déposé
            </h3>
            <p className="text-xs text-[#6b5646] mt-1.5 leading-relaxed">
              Consultez le statut de votre candidature et accédez à votre dossier complet.
            </p>
          </div>
          <div className="relative z-10 pt-5 mt-4 border-t border-[#EFE4D6]/60">
            <Link
              href={dossierUrl}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-[#612D10] group-hover:text-[#A35926] transition-colors"
            >
              <span>Voir mon dossier</span>
              <ChevronRight className="h-3.5 w-3.5" aria-hidden="true" />
            </Link>
          </div>
          {/* Arcs d'angle décoratifs subtils */}
          <div className="pointer-events-none absolute bottom-0 right-0 h-20 w-20 overflow-hidden rounded-br-2xl">
            <div className="absolute -bottom-6 -right-6 h-20 w-20 rounded-full bg-[#EADBCE]/50" />
            <div className="absolute -bottom-10 -right-10 h-16 w-16 rounded-full bg-[#FAF4ED]" />
          </div>
        </div>

        {/* Carte 2 : Prochaines étapes -> mène aux jalons / étapes du projet */}
        <div className="group relative overflow-hidden rounded-2xl border border-[#EFE4D6] bg-white p-6 shadow-sm hover:shadow-md hover:border-[#C99A68] transition-all flex flex-col justify-between">
          <div className="relative z-10">
            <div className="h-11 w-11 rounded-xl bg-[#FAF4ED] text-[#612D10] flex items-center justify-center mb-4 group-hover:bg-[#612D10] group-hover:text-white transition-colors">
              <Calendar className="h-5 w-5" aria-hidden="true" />
            </div>
            <h3 className="font-[family-name:var(--font-title)] text-base font-bold text-[#24140D] group-hover:text-[#612D10] transition-colors">
              Prochaines étapes
            </h3>
            <p className="text-xs text-[#6b5646] mt-1.5 leading-relaxed">
              Découvrez les actions et jalons à réaliser pour la suite de votre projet incubé.
            </p>
          </div>
          <div className="relative z-10 pt-5 mt-4 border-t border-[#EFE4D6]/60">
            <Link
              href={etapesUrl}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-[#612D10] group-hover:text-[#A35926] transition-colors"
            >
              <span>Voir les étapes</span>
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
              Restez informé des rappels, dates d’évaluation et notifications importantes.
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

      {/* 4. LISTE DES PROJETS ENREGISTRÉS OU ÉTAT VIDE AÉRÉ */}
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
                  className="inline-flex items-center gap-2 rounded-xl bg-[#612D10] hover:bg-[#3F1D0A] px-6 py-2.5 text-xs font-bold text-white shadow-sm transition-all hover:scale-[1.01]"
                >
                  <FileText className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>Déposer une candidature</span>
                  <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                </Link>
                <Link
                  href="/incubateur"
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#A35926] hover:text-[#612D10] underline underline-offset-4 py-2"
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
              <li key={p.id}>
                <Link
                  href={`/incubateur/projets/${p.id}`}
                  className="block rounded-2xl border border-[#EFE4D6] bg-white p-5 shadow-sm transition-all hover:border-[#C99A68] hover:shadow-md"
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
              </li>
            ))}
          </ul>
        </div>
      )}

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
