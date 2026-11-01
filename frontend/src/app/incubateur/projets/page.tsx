"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  Bell,
  Bot,
  Calendar,
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

function ListeProjets() {
  const { user } = useAuth();
  const canSubmit = user?.role === "porteur" || user?.role === "coordonnateur" || user?.role === "administrateur";
  const canEvaluate = user?.role === "membre_comite" || user?.role === "coordonnateur" || user?.role === "administrateur";
  const [projets, setProjets] = useState<ProjetListe[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [aSupprimer, setASupprimer] = useState<ProjetASupprimer | null>(null);

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

  return (
    <div className="w-full">
      <div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8 space-y-6 sm:space-y-8">

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

          <div className="flex items-center gap-2 w-full sm:w-auto">
            {canSubmit && (
              <Link
                href="/incubateur"
                className="inline-flex min-h-10 flex-1 sm:flex-initial items-center justify-center rounded-xl bg-[#612D10] px-4 text-xs font-bold text-white transition-colors hover:bg-[#3F1D0A]"
              >
                Déposer une candidature
              </Link>
            )}
            <Link
              href="/incubateur/calendrier"
              className="inline-flex min-h-10 flex-1 sm:flex-initial items-center justify-center gap-1.5 sm:gap-2 rounded-xl border border-[#EFE4D6] bg-white px-3 text-xs font-bold text-[#612D10] shadow-2xs transition-all hover:border-[#A35926] hover:bg-[#F2E5D5] hover:text-[#3F1D0A] hover:shadow-xs active:scale-[0.98] cursor-pointer"
            >
              <Calendar className="h-4 w-4 text-[#A35926]" />
              <span>Calendrier</span>
            </Link>
            <Link
              href="/assistant"
              className="inline-flex min-h-10 flex-1 sm:flex-initial items-center justify-center gap-1.5 sm:gap-2 rounded-xl border border-[#EFE4D6] bg-white px-3 text-xs font-bold text-[#612D10] shadow-2xs transition-all hover:border-[#A35926] hover:bg-[#F2E5D5] hover:text-[#3F1D0A] hover:shadow-xs active:scale-[0.98] cursor-pointer"
            >
              <Bot className="h-4 w-4 text-[#A35926]" />
              <span>Assistant IA</span>
            </Link>
            {canEvaluate && (
              <Link
                href="/incubateur/evaluation"
                className="hidden sm:inline-flex min-h-10 items-center whitespace-nowrap rounded-xl border border-[#EFE4D6] bg-white px-4 text-xs font-bold text-[#6b5646] shadow-2xs transition-all hover:border-[#A35926] hover:bg-[#F2E5D5] hover:text-[#3F1D0A] hover:shadow-xs active:scale-[0.98] cursor-pointer"
              >
                Évaluations comité
              </Link>
            )}
            <Link
              href="/incubateur/alertes"
              className="inline-flex min-h-10 items-center justify-center px-3 rounded-xl border border-[#EFE4D6] bg-white text-[#612D10] hover:border-[#A35926] hover:bg-[#F2E5D5] hover:shadow-xs transition-all active:scale-[0.98] relative shadow-2xs cursor-pointer shrink-0"
              aria-label="Alertes de retard"
              title="Consulter les alertes de retard"
            >
              <Bell className="h-4 w-4" aria-hidden="true" />
              <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-[#A35926]" />
            </Link>
          </div>
        </div>

        {error && <ApiErrorBanner message={error} onRetry={load} />}


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
