"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { useAuth } from "@/context/AuthContext";
import { ApiErrorBanner } from "@/components/ui";
import { api } from "@/lib/api";
import {
  getJalons,
  getObjectifs,
  getProjetMentor,
  getProjetSuivis,
  suiviErrorMessage,
  type Jalon,
  type Mentor,
  type Objectif,
  type SuiviProjet,
} from "@/lib/incubator";
import MentorBlock from "@/components/incubateur/suivi/MentorBlock";
import ObjectifsBlock from "@/components/incubateur/suivi/ObjectifsBlock";
import JalonsBlock from "@/components/incubateur/suivi/JalonsBlock";
import BilansSuiviSection from "@/components/incubateur/suivi/BilansSuiviSection";
import { Bot } from "lucide-react";

interface ProjetSuivi {
  id: number;
  titre: string;
  resume?: string;
  probleme?: string;
  solution?: string;
  domaine_nom?: string;
  porteur_nom?: string;
  statut: string;
}

const PROJET_STATUTS: Record<string, string> = {
  idee: "Idée",
  depose: "Dossier déposé",
  selectionne: "Sélectionné",
  incube: "En incubation",
  prototype: "Prototype",
  termine: "Incubation terminée",
  rejete: "Non retenu",
};

function projetStatutLabel(statut: string) {
  return PROJET_STATUTS[statut] ?? "Statut non reconnu";
}

const ETAPES_PARCOURS = [
  { id: "idee", label: "Idée" },
  { id: "evaluation", label: "Évaluation" },
  { id: "incubation", label: "Incubation" },
  { id: "suivi", label: "Suivi" },
];

function getProjetEtapeIndex(statut: string): number {
  switch (statut) {
    case "idee":
      return 0;
    case "depose":
    case "selectionne":
      return 1;
    case "incube":
    case "prototype":
      return 2;
    case "termine":
      return 3;
    default:
      return 0;
  }
}

function getProjetDomainImage(domaineNom?: string): { src: string; alt: string; slogan?: string } {
  const nom = (domaineNom || "").toLowerCase();
  if (nom.includes("agri") || nom.includes("environnement") || nom.includes("transformation")) {
    return {
      src: "/images/ciat-projet-agri.jpg",
      alt: "Système d'irrigation solaire intelligent en zone agricole sénégalaise",
      slogan: "Innover pour une agriculture durable !",
    };
  }
  return {
    src: "/images/ciat-suivi-banner.jpg",
    alt: "Laboratoire et atelier d'innovation technologique du CIAT",
    slogan: "Bâtir les solutions technologiques de demain",
  };
}

function Suivi() {
  const params = useParams<{ id: string }>();
  const projetId = Number(params.id);
  const { user } = useAuth();
  const [projet, setProjet] = useState<ProjetSuivi | null>(null);
  const [objectifs, setObjectifs] = useState<Objectif[]>([]);
  const [jalons, setJalons] = useState<Jalon[]>([]);
  const [mentor, setMentor] = useState<Mentor | null>(null);
  const [suivis, setSuivis] = useState<SuiviProjet[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [tick, setTick] = useState(0);
  const load = () => {
    setError(null);
    setLoading(true);
    setTick((t) => t + 1);
  };

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [p, o, j, m, s] = await Promise.all([
          api<ProjetSuivi>(`/projets/${projetId}/`),
          getObjectifs(projetId),
          getJalons(projetId),
          getProjetMentor(projetId),
          getProjetSuivis(projetId),
        ]);
        if (cancelled) return;
        setProjet(p);
        setObjectifs(o);
        setJalons(j);
        setMentor(m?.mentor_details ?? null);
        setSuivis(s);
        setError(null);
      } catch (err) {
        if (!cancelled) setError(suiviErrorMessage(err, "Impossible de charger le suivi de ce projet. Veuillez réessayer."));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [projetId, tick]);

  // Lien profond depuis la page Alertes : /incubateur/projets/{id}#jalon-{id}
  useEffect(() => {
    if (!loading && jalons.length && window.location.hash) {
      document.getElementById(window.location.hash.slice(1))?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [loading, jalons.length]);

  const isEquipe = user?.role === "coordonnateur" || user?.role === "administrateur";
  const isMentorAffecte = user?.role === "mentor" && mentor?.id === user?.id;
  const canManage = isEquipe || isMentorAffecte;
  const canWriteSuivi = isEquipe || isMentorAffecte;

  const etapeActuelle = projet ? getProjetEtapeIndex(projet.statut) : 0;
  const domainImg = getProjetDomainImage(projet?.domaine_nom);
  const resumeTexte =
    projet?.resume && projet.resume.trim().length > 0
      ? projet.resume
      : "Ce projet est en cours de structuration au sein de l'incubateur du CIAT. Les informations détaillées et les livrables associés sont consultables ci-dessous.";

  return (
    <div className="w-full max-w-7xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8 space-y-6 sm:space-y-8">
      {/* 1. LIEN RETOUR & PASSERELLE ASSISTANT IA */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <Link
            href="/incubateur/projets"
            className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-[#612D10] hover:text-[#3D1A04] transition-colors"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2} aria-hidden>
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
            </svg>
            <span>Retour à mes projets</span>
          </Link>

          <Link
            href="/assistant"
            className="inline-flex items-center gap-2 rounded-xl border border-[#EFE4D6] bg-white px-3.5 py-1.5 text-xs font-semibold text-[#612D10] shadow-2xs transition-all hover:border-[#C99A68] hover:bg-[#FAF7F2] w-fit"
          >
            <Bot className="h-4 w-4 text-[#A35926]" />
            <span>Échanger avec l&apos;Assistant IA sur ce projet</span>
          </Link>
        </div>

        {loading ? (
          <div className="flex justify-center py-16" role="status" aria-label="Chargement">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-[#EFE4D6] border-t-[#522504]" />
          </div>
        ) : error || !projet ? (
          <ApiErrorBanner message={error ?? "Projet introuvable."} onRetry={load} className="mt-4" />
        ) : (
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-start sm:items-center gap-3.5">
              <div className="flex h-12 w-12 sm:h-14 sm:w-14 flex-shrink-0 items-center justify-center rounded-2xl bg-[#522504] text-[#F7EFE6] shadow-xs">
                <svg className="h-6 w-6 sm:h-7 sm:w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8} aria-hidden>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0112 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 013 12c0-.778.099-1.533.284-2.253" />
                </svg>
              </div>
              <div className="min-w-0 space-y-1">
                <h1 className="font-[family-name:var(--font-title)] text-2xl sm:text-3xl font-extrabold text-[#3D1A04] tracking-tight leading-tight">
                  {projet.titre}
                </h1>
                <div className="flex flex-wrap items-center gap-2 text-xs sm:text-sm text-[#7C6353]">
                  {projet.porteur_nom && <span>{projet.porteur_nom}</span>}
                  {projet.domaine_nom && <span>· {projet.domaine_nom}</span>}
                </div>
              </div>
            </div>

            <div className="self-start sm:self-center">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-[#E5D7C5] bg-[#F7EFE6] px-3.5 py-1 text-xs font-semibold text-[#522504] shadow-xs">
                {projetStatutLabel(projet.statut)}
              </span>
            </div>
          </div>
        )}
      </div>

      {!loading && !error && projet && (
        <>
          {/* 2. BANDEAU DE PRÉSENTATION VISUELLE (« VUE D'ENSEMBLE ») */}
          <div className="overflow-hidden rounded-2xl border border-[#EFE4D6] bg-[#F7EFE6] shadow-xs">
            {/* VERSION MOBILE (< md) : Photo nette en haut, texte et progression en dessous */}
            <div className="md:hidden">
              <div className="relative h-48 w-full overflow-hidden">
                <img
                  src={domainImg.src}
                  alt={domainImg.alt}
                  className="h-full w-full object-cover object-center"
                />
                {domainImg.slogan && (
                  <div className="absolute bottom-2.5 right-2.5 rounded-md bg-[#24140D]/75 backdrop-blur-xs px-2.5 py-1 text-[11px] font-medium text-white italic">
                    {domainImg.slogan}
                  </div>
                )}
              </div>
              <div className="p-5 space-y-4 bg-[#F7EFE6]">
                <div className="flex items-center gap-2">
                  <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[#522504] text-white">
                    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </div>
                  <h2 className="font-[family-name:var(--font-title)] text-base font-bold text-[#3D1A04]">
                    Vue d&apos;ensemble
                  </h2>
                </div>

                <p className="text-xs text-[#6B5646] leading-relaxed">
                  {resumeTexte}
                </p>

                {/* Progression horizontale du projet (Mobile) */}
                <div className="pt-2 border-t border-[#EADBCE]">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-[#8A7261] mb-2.5">
                    Parcours du projet
                  </p>
                  <div className="grid grid-cols-4 gap-1 text-center">
                    {ETAPES_PARCOURS.map((step, idx) => {
                      const isCompleted = idx < etapeActuelle;
                      const isCurrent = idx === etapeActuelle;
                      return (
                        <div key={step.id} className="flex flex-col items-center">
                          <div
                            className={`flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-bold ${
                              isCurrent
                                ? "bg-[#522504] text-white ring-2 ring-[#D9C3AB]"
                                : isCompleted
                                ? "bg-[#8A7261] text-white"
                                : "border border-[#D9C3AB] bg-white text-[#8A7261]"
                            }`}
                          >
                            {isCompleted ? "✓" : idx + 1}
                          </div>
                          <span className={`mt-1 text-[10px] ${isCurrent ? "font-bold text-[#3D1A04]" : "text-[#7C6353]"}`}>
                            {step.label}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>

            {/* VERSION DESKTOP (>= md) : Split horizontal avec courbe SVG organique */}
            <div className="hidden md:block relative min-h-[250px] lg:min-h-[270px]">
              {/* Photo à droite */}
              <div className="absolute inset-y-0 right-0 w-[54%] h-full">
                <img
                  src={domainImg.src}
                  alt={domainImg.alt}
                  className="h-full w-full object-cover object-center"
                />
                {domainImg.slogan && (
                  <div className="absolute top-4 right-4 rounded-lg bg-[#24140D]/75 backdrop-blur-xs px-3 py-1.5 text-xs font-medium text-white italic shadow-sm">
                    {domainImg.slogan}
                  </div>
                )}
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
                    d="M 0,0 L 585,0 C 585,80 670,120 670,200 C 670,280 575,320 575,400 L 0,400 Z"
                    fill="#EADBCE"
                    fillOpacity="0.85"
                  />
                  <path
                    d="M 0,0 L 550,0 C 550,80 635,120 635,200 C 635,280 540,320 540,400 L 0,400 Z"
                    fill="#F7EFE6"
                  />
                </svg>
              </div>

              {/* Contenu Texte à gauche */}
              <div className="relative z-20 w-[49%] p-6 lg:p-8 flex flex-col justify-between space-y-4">
                <div className="space-y-2.5">
                  <div className="flex items-center gap-2">
                    <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[#522504] text-[#F7EFE6] shadow-xs">
                      <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    </div>
                    <h2 className="font-[family-name:var(--font-title)] text-base font-bold text-[#3D1A04]">
                      Vue d&apos;ensemble
                    </h2>
                  </div>
                  <p className="text-xs sm:text-sm text-[#6B5646] leading-relaxed max-w-lg">
                    {resumeTexte}
                  </p>
                </div>

                {/* Progression horizontale du projet (Desktop) */}
                <div className="pt-2">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-[#8A7261] mb-2.5">
                    Parcours du projet
                  </p>
                  <div className="relative flex items-center justify-between max-w-sm">
                    {/* Ligne de connexion arrière-plan */}
                    <div className="absolute left-3 right-3 top-3 h-0.5 bg-[#D9C3AB]" aria-hidden="true" />
                    {/* Ligne d'avancement complétée */}
                    <div
                      className="absolute left-3 top-3 h-0.5 bg-[#522504] transition-all"
                      style={{ width: `${(etapeActuelle / (ETAPES_PARCOURS.length - 1)) * 90}%` }}
                      aria-hidden="true"
                    />

                    {ETAPES_PARCOURS.map((step, idx) => {
                      const isCompleted = idx < etapeActuelle;
                      const isCurrent = idx === etapeActuelle;
                      return (
                        <div key={step.id} className="relative z-10 flex flex-col items-center">
                          <div
                            className={`flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-bold transition-transform ${
                              isCurrent
                                ? "bg-[#522504] text-white ring-4 ring-[#EADBCE] scale-110 shadow-xs"
                                : isCompleted
                                ? "bg-[#522504] text-white"
                                : "border-2 border-[#D9C3AB] bg-white text-[#8A7261]"
                            }`}
                          >
                            {isCompleted ? "✓" : isCurrent ? "" : ""}
                            {isCurrent && <span className="h-1.5 w-1.5 rounded-full bg-white" />}
                          </div>
                          <span
                            className={`mt-1.5 text-[11px] whitespace-nowrap ${
                              isCurrent ? "font-bold text-[#3D1A04]" : isCompleted ? "font-semibold text-[#522504]" : "text-[#8A7261]"
                            }`}
                          >
                            {step.label}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 3. GRILLE DES 3 CARTES PRINCIPALES (Mentor, Objectifs, Jalons) */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 items-stretch">
            <MentorBlock projetId={projet.id} mentor={mentor} canAssign={isEquipe} onAssigned={setMentor} />
            <ObjectifsBlock projetId={projet.id} objectifs={objectifs} canManage={canManage} onChange={load} />
            <JalonsBlock projetId={projet.id} jalons={jalons} canManage={canManage} onChange={load} />
          </div>

          {/* 4. SECTION PLEINE LARGEUR DES BILANS DE SUIVI PÉRIODIQUES */}
          <BilansSuiviSection
            projetId={projet.id}
            suivis={suivis}
            canWrite={canWriteSuivi}
            onCreated={load}
          />
        </>
      )}
    </div>
  );
}

export default function SuiviProjetPage() {
  return (
    <Suspense>
      <ProtectedRoute allowedRoles={["porteur", "mentor", "coordonnateur", "administrateur"]}>
        <Suivi />
      </ProtectedRoute>
    </Suspense>
  );
}
