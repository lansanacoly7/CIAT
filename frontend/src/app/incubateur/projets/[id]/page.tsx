"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { useAuth } from "@/context/AuthContext";
import { ApiErrorBanner, Badge } from "@/components/ui";
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
import DeleteProjectModal, { peutSupprimerOuRetirer } from "@/components/incubateur/DeleteProjectModal";
import { Bot, Trash2, Undo2 } from "lucide-react";

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
  retire: "Candidature retirée",
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

function Suivi() {
  const params = useParams<{ id: string }>();
  const projetId = Number(params.id);
  const { user } = useAuth();
  const router = useRouter();
  const [showDelete, setShowDelete] = useState(false);
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

  return (
    <div className="w-full min-h-[calc(100vh-4rem)] bg-[#FAF7F2]">
      <div className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6 sm:py-10 space-y-8">
        
        {/* Navigation & fil d'Ariane */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <nav aria-label="Fil d'Ariane" className="flex items-center gap-1.5 text-xs font-medium text-[#8C6D58]">
            <Link href="/incubateur/projets" className="hover:text-[#612D10] transition-colors">
              Mes projets
            </Link>
            <span className="text-[#C99A68]/60">/</span>
            <span className="text-[#24140D] font-semibold truncate max-w-[240px] sm:max-w-md">
              {projet?.titre || "Détail du projet"}
            </span>
          </nav>

          <Link
            href="/assistant"
            className="inline-flex items-center gap-2 rounded-xl border border-[#EFE4D6] bg-white px-3.5 py-1.5 text-xs font-bold text-[#612D10] shadow-2xs transition-all hover:border-[#A35926] hover:bg-[#FAF7F2] w-fit cursor-pointer"
          >
            <Bot className="h-4 w-4 text-[#A35926]" />
            <span>Assistant IA CIAT</span>
          </Link>
        </div>

        {loading ? (
          <div className="flex justify-center py-20" role="status" aria-label="Chargement">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-[#C99A68] border-t-[#612D10]" />
          </div>
        ) : error || !projet ? (
          <ApiErrorBanner message={error ?? "Projet introuvable."} onRetry={load} className="mt-4" />
        ) : (
          <div className="space-y-6">
            
            {/* Carte d'en-tête et avancement du projet */}
            <header className="rounded-2xl border border-[#EFE4D6] bg-white p-6 sm:p-8 shadow-2xs space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                <div className="space-y-1.5">
                  <h1 className="font-[family-name:var(--font-title)] text-2xl sm:text-3xl font-extrabold text-[#24140D] tracking-tight">
                    {projet.titre}
                  </h1>
                  <div className="flex flex-wrap items-center gap-2 text-xs sm:text-sm text-[#7C6353]">
                    {projet.porteur_nom && <span className="font-medium text-[#24140D]">{projet.porteur_nom}</span>}
                    {projet.domaine_nom && <span>· {projet.domaine_nom}</span>}
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2.5 self-start sm:self-center shrink-0">
                  <Badge>{projetStatutLabel(projet.statut)}</Badge>
                  {user?.role === "porteur" && peutSupprimerOuRetirer(projet.statut) && (
                    <button
                      type="button"
                      onClick={() => setShowDelete(true)}
                      className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-[#EFE4D6] bg-white px-3 py-1.5 text-xs font-semibold text-[#8C6D4F] transition-colors hover:border-[#FECACA] hover:bg-[#FEE2E2] hover:text-[#DC2626]"
                    >
                      {projet.statut === "depose" ? <Undo2 className="h-3.5 w-3.5" /> : <Trash2 className="h-3.5 w-3.5" />}
                      <span>{projet.statut === "depose" ? "Retirer" : "Supprimer"}</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Barre de progression épurée */}
              <div className="pt-4 border-t border-[#EFE4D6]/70 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-[#8C6D4F]">Progression du parcours</span>
                  <span className="font-bold text-[#612D10]">
                    Étape {etapeActuelle + 1} / {ETAPES_PARCOURS.length} : {ETAPES_PARCOURS[etapeActuelle]?.label}
                  </span>
                </div>
                <div className="grid grid-cols-4 gap-2">
                  {ETAPES_PARCOURS.map((step, idx) => {
                    const isDone = idx < etapeActuelle;
                    const isCurrent = idx === etapeActuelle;
                    return (
                      <div
                        key={step.id}
                        className={`h-2 rounded-full transition-colors ${
                          isDone
                            ? "bg-[#24140D]"
                            : isCurrent
                            ? "bg-[#C99A68]"
                            : "bg-[#EFE4D6]"
                        }`}
                        title={`${step.label} (${isDone ? "Validé" : isCurrent ? "En cours" : "À venir"})`}
                      />
                    );
                  })}
                </div>
              </div>
            </header>

            {showDelete && (
              <DeleteProjectModal
                projet={{ id: projet.id, titre: projet.titre, statut: projet.statut }}
                onClose={() => setShowDelete(false)}
                onDone={() => router.push("/incubateur/projets")}
              />
            )}

            {/* Grille des 3 volets d'accompagnement (Mentor, Objectifs, Jalons) */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">
              <div id="mentor" className="scroll-mt-8 flex flex-col h-full">
                <MentorBlock projetId={projet.id} mentor={mentor} canAssign={isEquipe} onAssigned={setMentor} />
              </div>
              <div id="objectifs" className="scroll-mt-8 flex flex-col h-full">
                <ObjectifsBlock projetId={projet.id} objectifs={objectifs} canManage={canManage} onChange={load} />
              </div>
              <div id="jalons" className="scroll-mt-8 flex flex-col h-full">
                <JalonsBlock projetId={projet.id} jalons={jalons} canManage={canManage} onChange={load} />
              </div>
            </div>

            {/* Bilans de suivi périodiques */}
            <div id="bilans-suivi" className="scroll-mt-8">
              <BilansSuiviSection
                projetId={projet.id}
                suivis={suivis}
                canWrite={canWriteSuivi}
                onCreated={load}
              />
            </div>

          </div>
        )}

      </div>
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
