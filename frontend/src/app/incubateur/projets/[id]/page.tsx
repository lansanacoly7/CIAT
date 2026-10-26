"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { useAuth } from "@/context/AuthContext";
import { ApiErrorBanner, Badge } from "@/components/ui";
import { api } from "@/lib/api";
import {
  getJalons,
  getObjectifs,
  getProjetMentor,
  suiviErrorMessage,
  type Jalon,
  type Mentor,
  type Objectif,
} from "@/lib/incubator";
import MentorBlock from "@/components/incubateur/suivi/MentorBlock";
import ObjectifsBlock from "@/components/incubateur/suivi/ObjectifsBlock";
import JalonsBlock from "@/components/incubateur/suivi/JalonsBlock";

interface ProjetSuivi {
  id: number;
  titre: string;
  domaine_nom?: string;
  porteur_nom?: string;
  statut: string;
}

function Suivi() {
  const params = useParams<{ id: string }>();
  const projetId = Number(params.id);
  const { user } = useAuth();
  const [projet, setProjet] = useState<ProjetSuivi | null>(null);
  const [objectifs, setObjectifs] = useState<Objectif[]>([]);
  const [jalons, setJalons] = useState<Jalon[]>([]);
  const [mentor, setMentor] = useState<Mentor | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [tick, setTick] = useState(0);
  const load = () => setTick((t) => t + 1);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [p, o, j, m] = await Promise.all([
          api<ProjetSuivi>(`/projets/${projetId}/`),
          getObjectifs(projetId),
          getJalons(projetId),
          getProjetMentor(projetId),
        ]);
        if (cancelled) return;
        setProjet(p);
        setObjectifs(o);
        setJalons(j);
        if (m?.mentor_details) {
          setMentor(m.mentor_details);
        }
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
  const canManage = isEquipe || user?.role === "mentor";

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-8 sm:py-12">
      <Link
        href="/incubateur/projets"
        className="inline-flex min-h-11 items-center text-sm font-semibold text-brun underline hover:text-brun-fonce"
      >
        ← Mes projets
      </Link>

      {loading ? (
        <div className="flex justify-center py-16" role="status" aria-label="Chargement">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-beige border-t-brun" />
        </div>
      ) : error || !projet ? (
        <ApiErrorBanner message={error ?? "Projet introuvable."} onRetry={load} className="mt-4" />
      ) : (
        <>
          <header className="mb-6 mt-2">
            <h1 className="text-2xl font-extrabold text-brun sm:text-3xl">{projet.titre}</h1>
            <p className="mt-1 flex flex-wrap items-center gap-2 text-sm text-texte-doux">
              {projet.porteur_nom && <span>{projet.porteur_nom}</span>}
              {projet.domaine_nom && <span>· {projet.domaine_nom}</span>}
              <Badge>{projet.statut}</Badge>
            </p>
          </header>
          <div className="space-y-6">
            <MentorBlock projetId={projet.id} mentor={mentor} canAssign={isEquipe} onAssigned={setMentor} />
            <ObjectifsBlock projetId={projet.id} objectifs={objectifs} canManage={canManage} onChange={load} />
            <JalonsBlock projetId={projet.id} jalons={jalons} canManage={canManage} onChange={load} />
          </div>
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
