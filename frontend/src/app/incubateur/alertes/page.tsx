"use client";

import { useId, useMemo, useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { ApiErrorBanner } from "@/components/ui";
import {
  formatDateFr,
  getAlertes,
  suiviErrorMessage,
  type AlerteJalon,
  JALON_STATUTS,
} from "@/lib/incubator";
import {
  Calendar,
  Clock,
  ChevronRight,
  FolderKanban,
  SlidersHorizontal,
  RotateCcw,
  CheckCircle2,
  ListFilter,
  AlertTriangle,
  AlertCircle,
  User,
  GraduationCap,
  Sparkles,
  ArrowRight,
} from "lucide-react";

function joursDeRetard(echeance: string): number {
  const [year, month, day] = echeance.split("-").map(Number);
  if (!year || !month || !day) return 0;
  const dateEcheance = Date.UTC(year, month - 1, day);
  const now = new Date();
  const aujourdHui = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate());
  return Math.max(0, Math.floor((aujourdHui - dateEcheance) / 86_400_000));
}

function getGraviteRetard(jours: number): "critique" | "modere" | "recent" {
  if (jours > 14) return "critique";
  if (jours >= 7) return "modere";
  return "recent";
}

const GRAVITE_CONFIG = {
  critique: {
    label: "Critique (> 14 jours)",
    badgeBg: "bg-red-50 text-red-800 border-red-200",
    pillBg: "bg-red-600",
    borderHover: "hover:border-red-400",
    icon: AlertTriangle,
  },
  modere: {
    label: "Modéré (7 à 14 jours)",
    badgeBg: "bg-amber-50 text-amber-800 border-amber-200",
    pillBg: "bg-amber-600",
    borderHover: "hover:border-amber-400",
    icon: AlertCircle,
  },
  recent: {
    label: "Récent (< 7 jours)",
    badgeBg: "bg-[#FAF7F2] text-[#8C5E2D] border-[#E5D7C6]",
    pillBg: "bg-[#8C5E2D]",
    borderHover: "hover:border-[#C99A68]",
    icon: Clock,
  },
};

type FiltreGravite = "toutes" | "critique" | "modere" | "recent";
type FiltreStatut = "tous" | "a_faire" | "en_cours";
type TriOption = "urgence" | "retard_decroissant" | "projet";

function Alertes() {
  const [alertes, setAlertes] = useState<AlerteJalon[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [filtreGravite, setFiltreGravite] = useState<FiltreGravite>("toutes");
  const [filtreStatut, setFiltreStatut] = useState<FiltreStatut>("tous");
  const [tri, setTri] = useState<TriOption>("urgence");
  const [tick, setTick] = useState(0);

  const triSelectId = useId();

  const load = () => {
    setError(null);
    setAlertes(null);
    setTick((t) => t + 1);
  };

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await getAlertes();
        if (cancelled) return;
        setAlertes(res);
        setError(null);
      } catch (err) {
        if (!cancelled)
          setError(
            suiviErrorMessage(
              err,
              "Impossible de charger les alertes. Veuillez réessayer."
            )
          );
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [tick]);

  // Synthèse par gravité (calcul dynamique en quelques secondes)
  const statsGravite = useMemo(() => {
    if (!alertes) return { total: 0, critiques: 0, moderees: 0, recentes: 0 };
    let critiques = 0;
    let moderees = 0;
    let recentes = 0;

    alertes.forEach((a) => {
      const j = joursDeRetard(a.echeance);
      const g = getGraviteRetard(j);
      if (g === "critique") critiques++;
      else if (g === "modere") moderees++;
      else recentes++;
    });

    return { total: alertes.length, critiques, moderees, recentes };
  }, [alertes]);

  // Alertes filtrées et triées
  const alertesTraitees = useMemo(() => {
    if (!alertes) return [];
    let list = [...alertes];

    // Filtre par gravité
    if (filtreGravite !== "toutes") {
      list = list.filter(
        (a) => getGraviteRetard(joursDeRetard(a.echeance)) === filtreGravite
      );
    }

    // Filtre par statut
    if (filtreStatut === "a_faire") {
      list = list.filter((a) => a.statut === "a_faire");
    } else if (filtreStatut === "en_cours") {
      list = list.filter((a) => a.statut === "en_cours");
    }

    // Tri
    if (tri === "urgence") {
      list.sort(
        (a, b) =>
          new Date(a.echeance).getTime() - new Date(b.echeance).getTime()
      );
    } else if (tri === "retard_decroissant") {
      list.sort((a, b) => joursDeRetard(b.echeance) - joursDeRetard(a.echeance));
    } else if (tri === "projet") {
      list.sort((a, b) => a.projet_titre.localeCompare(b.projet_titre));
    }

    return list;
  }, [alertes, filtreGravite, filtreStatut, tri]);

  return (
    <div className="w-full bg-[#FAF7F2] min-h-screen text-[#24140D]">
      <div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8 space-y-6 sm:space-y-8">
        {/* Fil d'Ariane */}
        <nav
          aria-label="Fil d'Ariane"
          className="flex flex-wrap items-center gap-1.5 text-xs font-semibold text-[#8C6D58]"
        >
          <Link href="/" className="hover:text-[#612D10] transition-colors">
            Accueil
          </Link>
          <span className="text-[#C99A68]/60">/</span>
          <Link href="/incubateur" className="hover:text-[#612D10] transition-colors">
            Incubateur
          </Link>
          <span className="text-[#C99A68]/60">/</span>
          <Link
            href="/incubateur/projets"
            className="hover:text-[#612D10] transition-colors"
          >
            Suivi des projets
          </Link>
          <span className="text-[#C99A68]/60">/</span>
          <span className="text-[#612D10] font-bold">Alertes de retard</span>
        </nav>

        {/* En-tête éditorial */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-[#E5D7C6] pb-6">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-[#C99A68]/40 bg-[#612D10]/10 px-3 py-0.5 text-xs font-bold text-[#612D10] mb-2">
              <Clock size={13} />
              <span>Pilotage Opérationnel des Jalons</span>
            </div>
            <h1 className="font-[family-name:var(--font-jakarta)] text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight text-[#24140D]">
              Alertes de Retard & Échéances
            </h1>
            <p className="mt-1 text-xs sm:text-sm text-[#655346] max-w-2xl">
              Identifiez en quelques secondes les jalons nécessitant un déblocage
              ou un arbitrage entre le porteur de projet et son mentor.
            </p>
          </div>

          <Link
            href="/incubateur/calendrier"
            className="inline-flex items-center gap-2 rounded-xl border border-[#E5D7C6] bg-white px-4 py-2.5 text-xs font-bold text-[#612D10] hover:bg-[#FAF7F2] transition shadow-2xs shrink-0 self-start md:self-auto cursor-pointer"
          >
            <Calendar size={14} className="text-[#C99A68]" />
            <span>Vue Calendrier Mensuel</span>
          </Link>
        </div>

        {/* =====================================================================
         * 1. BANDEAU DE SYNTHÈSE PAR NIVEAU DE GRAVITÉ (EXIGENCE T5)
         * ===================================================================== */}
        <section aria-labelledby="synthèse-gravite">
          <div className="rounded-3xl border border-[#E5D7C6] bg-white p-6 sm:p-8 shadow-sm">
            <h2 id="synthèse-gravite" className="text-xs font-bold uppercase tracking-wider text-[#8C6D58] mb-4">
              Synthèse Globale des Écarts de Calendrier
            </h2>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 divide-y sm:divide-y-0 sm:divide-x divide-[#E5D7C6]">
              {/* Total */}
              <div
                onClick={() => setFiltreGravite("toutes")}
                className={`p-3 rounded-2xl transition cursor-pointer ${
                  filtreGravite === "toutes" ? "bg-[#FAF7F2] ring-1 ring-[#612D10]" : "hover:bg-[#FAF7F2]"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#655346]">Total des retards</span>
                  <FolderKanban size={16} className="text-[#612D10]" />
                </div>
                <p className="mt-2 text-2xl sm:text-3xl font-black text-[#24140D]">
                  {!alertes ? "…" : statsGravite.total}
                </p>
                <p className="text-[11px] text-[#8C6D58] mt-0.5">Jalons en attente</p>
              </div>

              {/* Critiques */}
              <div
                onClick={() => setFiltreGravite("critique")}
                className={`p-3 sm:pl-6 rounded-2xl transition cursor-pointer ${
                  filtreGravite === "critique" ? "bg-red-50 ring-1 ring-red-500" : "hover:bg-red-50/50"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-red-900">Retard Critique</span>
                  <AlertTriangle size={16} className="text-red-600" />
                </div>
                <p className="mt-2 text-2xl sm:text-3xl font-black text-red-700">
                  {!alertes ? "…" : statsGravite.critiques}
                </p>
                <p className="text-[11px] text-red-800 mt-0.5">&gt; 14 jours de dépassement</p>
              </div>

              {/* Modérés */}
              <div
                onClick={() => setFiltreGravite("modere")}
                className={`p-3 sm:pl-6 rounded-2xl transition cursor-pointer ${
                  filtreGravite === "modere" ? "bg-amber-50 ring-1 ring-amber-500" : "hover:bg-amber-50/50"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-amber-900">Retard Modéré</span>
                  <AlertCircle size={16} className="text-amber-600" />
                </div>
                <p className="mt-2 text-2xl sm:text-3xl font-black text-amber-700">
                  {!alertes ? "…" : statsGravite.moderees}
                </p>
                <p className="text-[11px] text-amber-800 mt-0.5">Entre 7 et 14 jours</p>
              </div>

              {/* Récents */}
              <div
                onClick={() => setFiltreGravite("recent")}
                className={`p-3 sm:pl-6 rounded-2xl transition cursor-pointer ${
                  filtreGravite === "recent" ? "bg-[#FAF7F2] ring-1 ring-[#C99A68]" : "hover:bg-[#FAF7F2]"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#8C5E2D]">Récent</span>
                  <Clock size={16} className="text-[#8C5E2D]" />
                </div>
                <p className="mt-2 text-2xl sm:text-3xl font-black text-[#8C5E2D]">
                  {!alertes ? "…" : statsGravite.recentes}
                </p>
                <p className="text-[11px] text-[#A68F80] mt-0.5">&lt; 7 jours de retard</p>
              </div>
            </div>
          </div>
        </section>

        {/* =====================================================================
         * 2. CONTRÔLES : FILTRES PAR STATUT ET SÉLECTION DE TRI
         * ===================================================================== */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setFiltreStatut("tous")}
              className={`min-h-[38px] px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                filtreStatut === "tous"
                  ? "bg-[#612D10] text-white shadow-xs"
                  : "bg-white border border-[#E5D7C6] text-[#655346] hover:bg-[#FAF7F2]"
              }`}
            >
              Tous les statuts
            </button>
            <button
              type="button"
              onClick={() => setFiltreStatut("a_faire")}
              className={`min-h-[38px] px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                filtreStatut === "a_faire"
                  ? "bg-[#612D10] text-white shadow-xs"
                  : "bg-white border border-[#E5D7C6] text-[#655346] hover:bg-[#FAF7F2]"
              }`}
            >
              À faire
            </button>
            <button
              type="button"
              onClick={() => setFiltreStatut("en_cours")}
              className={`min-h-[38px] px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                filtreStatut === "en_cours"
                  ? "bg-[#612D10] text-white shadow-xs"
                  : "bg-white border border-[#E5D7C6] text-[#655346] hover:bg-[#FAF7F2]"
              }`}
            >
              En cours
            </button>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto">
            <label htmlFor={triSelectId} className="flex items-center gap-1.5 text-xs font-semibold text-[#8C6D58]">
              <SlidersHorizontal size={14} />
              <span>Trier par :</span>
            </label>
            <select
              id={triSelectId}
              value={tri}
              onChange={(e) => setTri(e.target.value as TriOption)}
              className="rounded-xl border border-[#E5D7C6] bg-white px-3 py-2 text-xs font-bold text-[#612D10] focus:border-[#612D10] focus:outline-none cursor-pointer"
            >
              <option value="urgence">Gravité & Échéance</option>
              <option value="retard_decroissant">Plus grand nombre de jours</option>
              <option value="projet">Nom du projet (A-Z)</option>
            </select>
          </div>
        </div>

        {/* =====================================================================
         * 3. ÉTATS DU CONTENU PRINCIPAL
         * ===================================================================== */}
        {error ? (
          <ApiErrorBanner message={error} onRetry={load} />
        ) : !alertes ? (
          <div className="flex justify-center py-20" role="status">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-[#C99A68] border-t-[#612D10]" />
          </div>
        ) : alertes.length === 0 ? (
          /* ===================================================================
           * BEL ÉTAT VIDE QUAND TOUT EST À JOUR (EXIGENCE T5)
           * =================================================================== */
          <div className="rounded-3xl border border-[#E5D7C6] bg-white p-10 sm:p-16 text-center shadow-xs max-w-2xl mx-auto">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl bg-emerald-50 border border-emerald-200 text-emerald-700 shadow-sm mb-6">
              <CheckCircle2 size={40} strokeWidth={2.2} />
            </div>

            <span className="inline-block rounded-full bg-emerald-100 border border-emerald-300 px-3 py-1 text-xs font-bold text-emerald-900 uppercase tracking-wider mb-2">
              Performance Optimale
            </span>

            <h3 className="font-[family-name:var(--font-jakarta)] text-2xl font-black text-[#24140D]">
              Tous les Jalons sont Parfaitement à Jour
            </h3>

            <p className="mt-3 text-xs sm:text-sm text-[#655346] leading-relaxed max-w-md mx-auto">
              Félicitations ! Aucun projet d&apos;incubation ne présente d&apos;échéance
              dépassée à ce jour. Les livrables et jalons avancent conformément au planning.
            </p>

            <div className="mt-8 pt-6 border-t border-[#E5D7C6] flex flex-wrap justify-center gap-4">
              <Link
                href="/incubateur/projets"
                className="inline-flex items-center gap-2 rounded-xl bg-[#612D10] hover:bg-[#7D3A15] border border-[#C99A68]/40 px-6 py-3 text-xs font-bold text-white shadow-md transition-all cursor-pointer"
              >
                <FolderKanban size={15} />
                <span>Accéder au Suivi des Projets</span>
              </Link>
              <Link
                href="/incubateur/calendrier"
                className="inline-flex items-center gap-2 rounded-xl border border-[#E5D7C6] bg-[#FAF7F2] hover:bg-[#EFE4D6] px-5 py-3 text-xs font-bold text-[#612D10] transition"
              >
                <Calendar size={15} />
                <span>Consulter le Calendrier</span>
              </Link>
            </div>
          </div>
        ) : alertesTraitees.length === 0 ? (
          /* Aucun résultat pour le filtre actif */
          <div className="rounded-3xl border border-dashed border-[#DFCDB9] bg-white p-10 text-center shadow-xs max-w-md mx-auto">
            <p className="font-bold text-[#24140D]">Aucun jalon pour ce filtre</p>
            <p className="mt-1 text-xs text-[#655346]">
              Tous les jalons en retard se trouvent dans une autre catégorie de gravité.
            </p>
            <button
              type="button"
              onClick={() => {
                setFiltreGravite("toutes");
                setFiltreStatut("tous");
              }}
              className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-[#612D10] px-4 py-2 text-xs font-bold text-white"
            >
              Afficher toutes les alertes
            </button>
          </div>
        ) : (
          /* ===================================================================
           * CARTES D'ALERTES PAR URGENCE AVEC PROJET, PORTEUR ET MENTOR (EXIGENCE T5)
           * =================================================================== */
          <div className="space-y-4">
            {alertesTraitees.map((a) => {
              const jours = joursDeRetard(a.echeance);
              const gravite = getGraviteRetard(jours);
              const cfg = GRAVITE_CONFIG[gravite];
              const IconGravite = cfg.icon;

              return (
                <article
                  key={a.id}
                  className={`rounded-2xl border border-[#E5D7C6] bg-white p-5 sm:p-6 shadow-xs ${cfg.borderHover} hover:shadow-md transition-all flex flex-col md:flex-row items-start md:items-center justify-between gap-5`}
                >
                  <div className="flex-1 space-y-3">
                    {/* Badges d'urgence et de statut */}
                    <div className="flex flex-wrap items-center gap-2.5">
                      <span
                        className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-bold ${cfg.badgeBg}`}
                      >
                        <IconGravite size={13} />
                        <span>
                          {jours === 0
                            ? "Échéance aujourd'hui"
                            : jours === 1
                            ? "1 jour de retard"
                            : `${jours} jours de retard`}
                        </span>
                      </span>

                      <span className="rounded-full bg-[#FAF7F2] border border-[#E5D7C6] px-2.5 py-0.5 text-[11px] font-bold text-[#612D10]">
                        {JALON_STATUTS[a.statut] || a.statut}
                      </span>

                      <span className="text-[11px] font-medium text-[#8C6D58] flex items-center gap-1">
                        <Calendar size={12} />
                        Échéance : <strong>{formatDateFr(a.echeance)}</strong>
                      </span>
                    </div>

                    {/* Titre du jalon */}
                    <h3 className="font-[family-name:var(--font-jakarta)] text-base sm:text-lg font-bold text-[#24140D]">
                      {a.titre}
                    </h3>

                    {/* Projet, Porteur et Mentor concernés */}
                    <div className="flex flex-wrap items-center gap-y-2 gap-x-4 text-xs text-[#655346] pt-1 border-t border-[#E5D7C6]/60">
                      <div className="flex items-center gap-1.5">
                        <FolderKanban size={13} className="text-[#612D10]" />
                        <span>Projet :</span>
                        <strong className="text-[#24140D]">{a.projet_titre}</strong>
                      </div>

                      {a.porteur_nom && (
                        <div className="flex items-center gap-1.5">
                          <User size={13} className="text-[#8C6D58]" />
                          <span>Porteur :</span>
                          <span className="font-semibold text-[#24140D]">
                            {a.porteur_nom}
                          </span>
                        </div>
                      )}

                      <div className="flex items-center gap-1.5">
                        <GraduationCap size={13} className="text-[#C99A68]" />
                        <span>Mentor :</span>
                        <span className="font-semibold text-[#24140D]">
                          {a.mentor_nom || "En attente d'affectation"}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Bouton d'action directe vers le jalon */}
                  <div className="w-full md:w-auto shrink-0 pt-3 md:pt-0 border-t md:border-t-0 border-[#E5D7C6]">
                    <Link
                      href={`/incubateur/projets/${a.projet}#jalon-${a.id}`}
                      className="w-full md:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-[#612D10] hover:bg-[#7D3A15] border border-[#C99A68]/40 px-5 py-2.5 text-xs font-bold !text-white shadow-xs transition-all cursor-pointer"
                    >
                      <span>Traiter le jalon</span>
                      <ChevronRight size={14} />
                    </Link>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export default function AlertesPage() {
  return (
    <ProtectedRoute
      allowedRoles={["porteur", "mentor", "coordonnateur", "administrateur"]}
    >
      <Alertes />
    </ProtectedRoute>
  );
}
