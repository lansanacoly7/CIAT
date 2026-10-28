"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  ArrowRight,
  Bell,
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Flag,
  RotateCcw,
  Target,
} from "lucide-react";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { ApiErrorBanner, Badge, Button, EmptyState } from "@/components/ui";
import { ApiError, api } from "@/lib/api";
import {
  formatDateFr,
  getCalendrier,
  getJalons,
  getObjectifs,
  suiviErrorMessage,
  type EvenementCalendrier,
} from "@/lib/incubator";

interface ProjetSimple {
  id: number;
  titre: string;
}

const JOURS_SEMAINE = [
  "Lundi",
  "Mardi",
  "Mercredi",
  "Jeudi",
  "Vendredi",
  "Samedi",
  "Dimanche",
];

const JOURS_SEMAINE_COURTS = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];

function pad2(n: number): string {
  return n < 10 ? `0${n}` : `${n}`;
}

function CalendrierVue() {
  const [currentDate, setCurrentDate] = useState(() => new Date());
  const [evenements, setEvenements] = useState<EvenementCalendrier[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filtre, setFiltre] = useState<"tous" | "jalon" | "objectif" | "retard">("tous");
  const [selectedEvent, setSelectedEvent] = useState<EvenementCalendrier | null>(null);
  const [reloadTick, setReloadTick] = useState(0);

  const [selectedDateStr, setSelectedDateStr] = useState<string>(() => {
    const today = new Date();
    return `${today.getFullYear()}-${pad2(today.getMonth() + 1)}-${pad2(today.getDate())}`;
  });

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth(); // 0 - 11

  const moisParam = `${year}-${pad2(month + 1)}`;

  const moisNom = useMemo(() => {
    const raw = currentDate.toLocaleDateString("fr-FR", {
      month: "long",
      year: "numeric",
    });
    return raw.charAt(0).toUpperCase() + raw.slice(1);
  }, [currentDate]);

  const selectedDateFormatted = useMemo(() => {
    if (!selectedDateStr) return "";
    const [y, m, d] = selectedDateStr.split("-").map(Number);
    if (!y || !m || !d) return selectedDateStr;
    const dt = new Date(y, m - 1, d);
    const str = dt.toLocaleDateString("fr-FR", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });
    return str.charAt(0).toUpperCase() + str.slice(1);
  }, [selectedDateStr]);

  const load = () => {
    setLoading(true);
    setReloadTick((t) => t + 1);
  };

  useEffect(() => {
    let cancelled = false;

    const fetchCalendrier = async () => {
      try {
        const data = await getCalendrier(moisParam);
        if (!cancelled) {
          setEvenements(data);
          setError(null);
        }
      } catch (err) {
        if (!cancelled) {
          if (err instanceof ApiError && err.status === 404) {
            // Repli gracieux : interrogation directe des projets et de leurs jalons / objectifs
            try {
              const projetsRes = await api<ProjetSimple[] | { results: ProjetSimple[] }>("/projets/");
              const projetsList = Array.isArray(projetsRes) ? projetsRes : projetsRes.results || [];
              const events: EvenementCalendrier[] = [];
              const nowStr = new Date().toISOString().slice(0, 10);

              for (const p of projetsList) {
                const [jalonsList, objectifsList] = await Promise.all([
                  getJalons(p.id).catch(() => []),
                  getObjectifs(p.id).catch(() => []),
                ]);

                for (const j of jalonsList) {
                  if (j.echeance && j.echeance.startsWith(moisParam)) {
                    events.push({
                      date: j.echeance,
                      type: "jalon",
                      titre: j.titre,
                      projet: p.titre,
                      projet_id: p.id,
                      statut: j.statut,
                      en_retard: j.en_retard ?? (j.statut !== "fait" && j.echeance < nowStr),
                    });
                  }
                }

                for (const o of objectifsList) {
                  if (o.echeance && o.echeance.startsWith(moisParam)) {
                    events.push({
                      date: o.echeance,
                      type: "objectif",
                      titre: o.libelle,
                      projet: p.titre,
                      projet_id: p.id,
                      statut: o.statut,
                      en_retard: o.statut !== "atteint" && o.echeance < nowStr,
                    });
                  }
                }
              }

              if (!cancelled) {
                setEvenements(events);
                setError(null);
              }
              return;
            } catch {
              setError("Impossible de charger les échéances pour ce mois.");
            }
          } else {
            setError(
              suiviErrorMessage(
                err,
                "Impossible de charger le calendrier pour ce mois. Veuillez vérifier votre connexion.",
              ),
            );
          }
          setEvenements(null);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    fetchCalendrier();

    return () => {
      cancelled = true;
    };
  }, [moisParam, reloadTick]);

  const handlePrevMonth = () => {
    setLoading(true);
    const prev = new Date(year, month - 1, 1);
    setCurrentDate(prev);
    setSelectedDateStr(`${prev.getFullYear()}-${pad2(prev.getMonth() + 1)}-01`);
    setSelectedEvent(null);
  };

  const handleNextMonth = () => {
    setLoading(true);
    const next = new Date(year, month + 1, 1);
    setCurrentDate(next);
    setSelectedDateStr(`${next.getFullYear()}-${pad2(next.getMonth() + 1)}-01`);
    setSelectedEvent(null);
  };

  const handleToday = () => {
    setLoading(true);
    const now = new Date();
    setCurrentDate(now);
    setSelectedDateStr(`${now.getFullYear()}-${pad2(now.getMonth() + 1)}-${pad2(now.getDate())}`);
    setSelectedEvent(null);
  };

  // Filtrage des événements (exclusif)
  const filteredEvents = useMemo(() => {
    if (!evenements) return [];
    return evenements.filter((ev) => {
      if (filtre === "jalon") return ev.type === "jalon";
      if (filtre === "objectif") return ev.type === "objectif";
      if (filtre === "retard") return ev.en_retard;
      return true;
    });
  }, [evenements, filtre]);

  // Indexation par date "AAAA-MM-JJ"
  const eventsByDate = useMemo(() => {
    const map = new Map<string, EvenementCalendrier[]>();
    for (const ev of filteredEvents) {
      const list = map.get(ev.date) || [];
      list.push(ev);
      map.set(ev.date, list);
    }
    return map;
  }, [filteredEvents]);

  // Statistiques du mois
  const stats = useMemo(() => {
    const total = evenements?.length ?? 0;
    const jalons = evenements?.filter((e) => e.type === "jalon").length ?? 0;
    const objectifs = evenements?.filter((e) => e.type === "objectif").length ?? 0;
    const enRetard = evenements?.filter((e) => e.en_retard).length ?? 0;
    return { total, jalons, objectifs, enRetard };
  }, [evenements]);

  // Construction de la grille mensuelle (7 colonnes, lundi = 0)
  const calendarCells = useMemo(() => {
    const firstDayIndex = (new Date(year, month, 1).getDay() + 6) % 7;
    const daysInCurrentMonth = new Date(year, month + 1, 0).getDate();
    const daysInPrevMonth = new Date(year, month, 0).getDate();

    const cells: Array<{
      dateStr: string;
      dayNum: number;
      isCurrentMonth: boolean;
      isToday: boolean;
    }> = [];

    const today = new Date();
    const todayStr = `${today.getFullYear()}-${pad2(today.getMonth() + 1)}-${pad2(today.getDate())}`;

    // Jours du mois précédent
    for (let i = firstDayIndex - 1; i >= 0; i--) {
      const d = daysInPrevMonth - i;
      const prevDate = new Date(year, month - 1, d);
      const dStr = `${prevDate.getFullYear()}-${pad2(prevDate.getMonth() + 1)}-${pad2(d)}`;
      cells.push({
        dateStr: dStr,
        dayNum: d,
        isCurrentMonth: false,
        isToday: dStr === todayStr,
      });
    }

    // Jours du mois courant
    for (let d = 1; d <= daysInCurrentMonth; d++) {
      const dStr = `${year}-${pad2(month + 1)}-${pad2(d)}`;
      cells.push({
        dateStr: dStr,
        dayNum: d,
        isCurrentMonth: true,
        isToday: dStr === todayStr,
      });
    }

    // Jours du mois suivant pour compléter la grille (jusqu'à multiple de 7)
    const remaining = (7 - (cells.length % 7)) % 7;
    for (let d = 1; d <= remaining; d++) {
      const nextDate = new Date(year, month + 1, d);
      const dStr = `${nextDate.getFullYear()}-${pad2(nextDate.getMonth() + 1)}-${pad2(d)}`;
      cells.push({
        dateStr: dStr,
        dayNum: d,
        isCurrentMonth: false,
        isToday: dStr === todayStr,
      });
    }

    return cells;
  }, [year, month]);

  // Événements pour la date actuellement sélectionnée
  const selectedDayEvents = useMemo(() => {
    return eventsByDate.get(selectedDateStr) || [];
  }, [eventsByDate, selectedDateStr]);

  // Prochains événements du mois (pour le panneau latéral quand le jour sélectionné est vide)
  const upcomingMonthEvents = useMemo(() => {
    if (!evenements) return [];
    return [...evenements].slice(0, 4);
  }, [evenements]);

  // Liste triée par date pour la vue mobile (390px)
  const mobileDaysList = useMemo(() => {
    const dates = Array.from(eventsByDate.keys()).sort();
    return dates.map((dateStr) => ({
      dateStr,
      items: eventsByDate.get(dateStr) || [],
    }));
  }, [eventsByDate]);

  const isCurrentMonthView = useMemo(() => {
    const now = new Date();
    return now.getFullYear() === year && now.getMonth() === month;
  }, [year, month]);

  return (
    <div className="w-full">
      <div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8 space-y-6 sm:space-y-8">
        {/* Fil d'Ariane harmonisé */}
        <div className="flex items-center gap-1.5 text-xs font-semibold text-[#8C6D58]">
          <Link
            href="/incubateur/projets"
            className="hover:text-[#612D10] hover:underline transition-colors"
          >
            Suivi des projets
          </Link>
          <span className="text-[#C99A68]/60">/</span>
          <span className="text-[#612D10] font-bold">Calendrier</span>
        </div>

        {/* 1. EN-TÊTE STATUTAIRE & CLOCHE D'ALERTE */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-2 text-xs font-bold text-[#8C6D58] uppercase tracking-wider">
              <span>Incubateur CIAT</span>
              <span className="text-[#C99A68]">·</span>
              <span>Pilotage opérationnel</span>
            </div>
            <h1 className="font-[family-name:var(--font-title)] text-2xl font-extrabold tracking-tight text-[#24140D] sm:text-3xl lg:text-4xl">
              Calendrier des jalons & objectifs
            </h1>
            <p className="text-xs sm:text-sm text-[#6b5646] max-w-2xl leading-relaxed">
              Suivi chronologique des échéances d&apos;incubation, livrables techniques et revues du comité.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/incubateur/alertes"
              className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-[#EFE4D6] bg-white px-4 text-xs sm:text-sm font-bold text-[#612D10] hover:border-[#A35926] hover:bg-[#FAF7F2] shadow-xs transition-all active:scale-[0.98] cursor-pointer"
              title="Consulter les alertes"
            >
              <Bell className="h-4 w-4 text-[#A35926]" aria-hidden="true" />
              <span>Alertes</span>
              {stats.enRetard > 0 && (
                <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-[#B91C1C] px-1.5 text-[11px] font-bold text-white">
                  {stats.enRetard}
                </span>
              )}
            </Link>
          </div>
        </div>

        {/* 2. BANNIÈRE D'ERREUR */}
        {error && (
          <ApiErrorBanner
            message={error}
            onRetry={load}
            className="!mb-0 shadow-xs"
          />
        )}

        {/* 3. 4 CARTES D'INDICATEURS CLÉS (KPIS) - Interactives et filtres en un clic */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
          {/* TOTAL DU MOIS */}
          <button
            type="button"
            onClick={() => setFiltre("tous")}
            className={`group relative overflow-hidden rounded-2xl border p-4 text-left transition-all cursor-pointer ${
              filtre === "tous"
                ? "border-[#612D10] bg-white shadow-md ring-2 ring-[#612D10]/15"
                : "border-[#EFE4D6] bg-white hover:border-[#C99A68] hover:bg-[#FAF7F2] hover:shadow-xs"
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#8C6D58]">
                Échéances du mois
              </span>
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#FAF4ED] text-[#612D10] group-hover:scale-105 transition-transform">
                <CalendarIcon className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="font-[family-name:var(--font-title)] text-2xl sm:text-3xl font-extrabold text-[#24140D]">
                {stats.total}
              </span>
              <span className="text-xs text-[#8C6D58]">au planning</span>
            </div>
            {filtre === "tous" && (
              <span className="absolute bottom-0 left-0 right-0 h-1 bg-[#612D10]" />
            )}
          </button>

          {/* JALONS CLÉS */}
          <button
            type="button"
            onClick={() => setFiltre(filtre === "jalon" ? "tous" : "jalon")}
            className={`group relative overflow-hidden rounded-2xl border p-4 text-left transition-all cursor-pointer ${
              filtre === "jalon"
                ? "border-[#A35926] bg-[#FFF9F3] shadow-md ring-2 ring-[#A35926]/20"
                : "border-[#EFE4D6] bg-white hover:border-[#A35926] hover:bg-[#FAF4ED] hover:shadow-xs"
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#A35926]">
                Jalons clés
              </span>
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#FAF4ED] text-[#A35926] group-hover:scale-105 transition-transform">
                <Flag className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="font-[family-name:var(--font-title)] text-2xl sm:text-3xl font-extrabold text-[#78350F]">
                {stats.jalons}
              </span>
              <span className="text-xs text-[#8C6D58]">étapes comité</span>
            </div>
            {filtre === "jalon" && (
              <span className="absolute bottom-0 left-0 right-0 h-1 bg-[#A35926]" />
            )}
          </button>

          {/* OBJECTIFS OPÉRATIONNELS */}
          <button
            type="button"
            onClick={() => setFiltre(filtre === "objectif" ? "tous" : "objectif")}
            className={`group relative overflow-hidden rounded-2xl border p-4 text-left transition-all cursor-pointer ${
              filtre === "objectif"
                ? "border-[#2563EB] bg-[#EFF6FF] shadow-md ring-2 ring-[#2563EB]/20"
                : "border-[#EFE4D6] bg-white hover:border-[#2563EB] hover:bg-[#F0F7FF] hover:shadow-xs"
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#1E40AF]">
                Objectifs
              </span>
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#EFF6FF] text-[#2563EB] group-hover:scale-105 transition-transform">
                <Target className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="font-[family-name:var(--font-title)] text-2xl sm:text-3xl font-extrabold text-[#1E40AF]">
                {stats.objectifs}
              </span>
              <span className="text-xs text-[#8C6D58]">livrables projet</span>
            </div>
            {filtre === "objectif" && (
              <span className="absolute bottom-0 left-0 right-0 h-1 bg-[#2563EB]" />
            )}
          </button>

          {/* ÉCHÉANCES EN RETARD */}
          <button
            type="button"
            onClick={() => setFiltre(filtre === "retard" ? "tous" : "retard")}
            className={`group relative overflow-hidden rounded-2xl border p-4 text-left transition-all cursor-pointer ${
              filtre === "retard"
                ? "border-[#B91C1C] bg-[#FEF2F2] shadow-md ring-2 ring-[#B91C1C]/20"
                : stats.enRetard > 0
                ? "border-red-200 bg-red-50/60 hover:bg-red-50 hover:border-red-300"
                : "border-[#EFE4D6] bg-white hover:border-[#A35926] hover:bg-[#FAF7F2]"
            }`}
          >
            <div className="flex items-center justify-between">
              <span className={`text-[11px] font-bold uppercase tracking-wider ${stats.enRetard > 0 ? "text-[#B91C1C]" : "text-[#8C6D58]"}`}>
                En retard
              </span>
              <div className={`flex h-8 w-8 items-center justify-center rounded-xl transition-transform group-hover:scale-105 ${
                stats.enRetard > 0 ? "bg-red-100 text-[#B91C1C]" : "bg-[#FAF7F2] text-[#8C6D58]"
              }`}>
                <AlertTriangle className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className={`font-[family-name:var(--font-title)] text-2xl sm:text-3xl font-extrabold ${stats.enRetard > 0 ? "text-[#B91C1C]" : "text-[#8C6D58]"}`}>
                {stats.enRetard}
              </span>
              <span className="text-xs text-[#8C6D58]">{stats.enRetard > 0 ? "à régulariser" : "aucun retard"}</span>
            </div>
            {filtre === "retard" && (
              <span className="absolute bottom-0 left-0 right-0 h-1 bg-[#B91C1C]" />
            )}
          </button>
        </div>

        {/* 4. BARRE DE COMMANDE MENSUELLE & LÉGENDE STATUTAIRE */}
        <div className="rounded-2xl border border-[#EFE4D6] bg-white p-3.5 sm:p-4 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="inline-flex items-center rounded-xl border border-[#EFE4D6] bg-[#FAF7F2] p-0.5 shadow-2xs">
              <button
                type="button"
                onClick={handlePrevMonth}
                aria-label="Mois précédent"
                className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-[#612D10] hover:bg-[#EFE4D6] hover:text-[#3F1D0A] transition-colors cursor-pointer"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <div className="px-4 text-center min-w-[160px]">
                <span className="font-[family-name:var(--font-title)] text-base font-bold text-[#4A2810]">
                  {moisNom}
                </span>
              </div>
              <button
                type="button"
                onClick={handleNextMonth}
                aria-label="Mois suivant"
                className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-[#612D10] hover:bg-[#EFE4D6] hover:text-[#3F1D0A] transition-colors cursor-pointer"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>

            {!isCurrentMonthView && (
              <button
                type="button"
                onClick={handleToday}
                className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-[#EFE4D6] bg-white px-3 text-xs font-bold text-[#612D10] hover:border-[#A35926] hover:bg-[#FAF7F2] transition-colors shadow-2xs cursor-pointer"
              >
                <RotateCcw className="h-3.5 w-3.5 text-[#A35926]" />
                <span>Aujourd&apos;hui</span>
              </button>
            )}
          </div>

          {/* Légende intégrée sobre et élégante */}
          <div className="flex items-center gap-4 text-xs font-medium text-[#6b5646]">
            <span className="inline-flex items-center gap-1.5 text-[#78350F]">
              <span className="h-2.5 w-2.5 rounded-full bg-[#A35926]" />
              <span className="font-semibold">Jalon clé</span>
            </span>
            <span className="inline-flex items-center gap-1.5 text-[#1E40AF]">
              <span className="h-2.5 w-2.5 rounded-full bg-[#2563EB]" />
              <span className="font-semibold">Objectif</span>
            </span>
            <span className="inline-flex items-center gap-1.5 text-[#B91C1C]">
              <span className="h-2.5 w-2.5 rounded-full bg-[#B91C1C]" />
              <span className="font-semibold">En retard</span>
            </span>
          </div>
        </div>

        {/* 5. CONTENU PRINCIPAL : ÉTAT CHARGEMENT OU VUES CALENDRIER */}
        {loading ? (
          <div className="rounded-2xl border border-[#EFE4D6] bg-white p-12 text-center shadow-xs">
            <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-2xl bg-[#FAF7F2] text-[#A35926] mb-3 animate-pulse">
              <CalendarIcon className="h-5 w-5" />
            </div>
            <p className="text-sm font-semibold text-[#612D10]">
              Chargement des échéances de {moisNom}...
            </p>
            <p className="mt-1 text-xs text-[#8C6D58]">
              Interrogation sécurisée de l&apos;API incubateur
            </p>
          </div>
        ) : (
          <>
            {/* =========================================================================
                A. VUE DESKTOP : DISPOSITION 2 COLONNES (Grille spacieuse à gauche, Fiche de pilotage à droite)
               ========================================================================= */}
            <div className="hidden md:grid md:grid-cols-12 gap-6 items-start">
              {/* COLONNE GAUCHE (8/12) : Grille mensuelle aérée et spacieuse (~108px de hauteur) */}
              <div className="md:col-span-7 lg:col-span-8 overflow-hidden rounded-2xl border border-[#EFE4D6] bg-white shadow-xs">
                {/* En-tête des jours de la semaine */}
                <div className="grid grid-cols-7 border-b border-[#EFE4D6] bg-[#FAF7F2] text-center text-xs font-bold uppercase tracking-wider text-[#612D10]">
                  {JOURS_SEMAINE.map((jour, idx) => (
                    <div key={jour} className="py-3 border-r border-[#EFE4D6] last:border-r-0">
                      <span className="hidden lg:inline">{jour}</span>
                      <span className="lg:hidden">{JOURS_SEMAINE_COURTS[idx]}</span>
                    </div>
                  ))}
                </div>

                {/* Grille des cellules spacieuses */}
                <div className="grid grid-cols-7 divide-x divide-y divide-[#EFE4D6]">
                  {calendarCells.map((cell) => {
                    const cellEvents = eventsByDate.get(cell.dateStr) || [];
                    const hasOverdue = cellEvents.some((e) => e.en_retard);
                    const isSelected = cell.dateStr === selectedDateStr;

                    return (
                      <button
                        key={cell.dateStr}
                        type="button"
                        onClick={() => setSelectedDateStr(cell.dateStr)}
                        className={`min-h-[96px] lg:min-h-[108px] p-2 flex flex-col justify-between text-left transition-all cursor-pointer relative group ${
                          isSelected
                            ? "bg-[#FAF7F2] ring-2 ring-inset ring-[#612D10] z-10 shadow-xs"
                            : !cell.isCurrentMonth
                            ? "bg-[#FAF7F2]/30 text-[#A8988B] hover:bg-[#F2E5D5]/50 hover:text-[#612D10]"
                            : cell.isToday
                            ? "bg-[#FAF7F2]/70 hover:bg-[#F2E5D5]/70"
                            : "bg-white hover:bg-[#FAF7F2]/60 hover:shadow-2xs"
                        }`}
                      >
                        {/* Numéro du jour & pastille de compteur */}
                        <div className="flex items-center justify-between w-full">
                          <span
                            className={`inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold transition-transform group-hover:scale-105 ${
                              cell.isToday && isSelected
                                ? "bg-[#612D10] text-white ring-2 ring-[#C99A68]"
                                : cell.isToday
                                ? "bg-[#C99A68] text-[#1F130B] shadow-xs font-extrabold"
                                : isSelected
                                ? "bg-[#612D10] text-white shadow-xs"
                                : cell.isCurrentMonth
                                ? "text-[#4A2810]"
                                : "text-[#B8A89A]"
                            }`}
                          >
                            {cell.dayNum}
                          </span>

                          {cellEvents.length > 0 && (
                            <span
                              className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                                hasOverdue
                                  ? "bg-red-100 text-red-700"
                                  : "bg-[#EFE4D6] text-[#612D10]"
                              }`}
                            >
                              {cellEvents.length}
                            </span>
                          )}
                        </div>

                        {/* Cartouches d'échéances aérées et lisibles */}
                        <div className="w-full space-y-1 mt-1.5 overflow-hidden">
                          {cellEvents.slice(0, 3).map((ev, evIdx) => (
                            <div
                              key={`${ev.date}-${evIdx}`}
                              className={`truncate rounded-md px-1.5 py-0.5 text-[10px] leading-snug font-semibold flex items-center gap-1 shadow-2xs transition-all ${
                                ev.en_retard
                                  ? "bg-red-50 text-red-900 border border-red-200"
                                  : ev.type === "jalon"
                                  ? "bg-[#FFF9F3] text-[#78350F] border border-[#F2DAC1]"
                                  : "bg-[#F0F7FF] text-[#1E40AF] border border-[#BFDBFE]"
                              }`}
                            >
                              <span className={`h-1.5 w-1.5 rounded-full shrink-0 ${
                                ev.en_retard ? "bg-[#B91C1C]" : ev.type === "jalon" ? "bg-[#A35926]" : "bg-[#2563EB]"
                              }`} />
                              <span className="truncate">{ev.titre}</span>
                            </div>
                          ))}
                          {cellEvents.length > 3 && (
                            <div className="text-[10px] font-bold text-[#8C6D58] pl-1">
                              +{cellEvents.length - 3} autre{cellEvents.length - 3 > 1 ? "s" : ""}
                            </div>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* COLONNE DROITE (4/12 ou 5/12) : Fiche de pilotage de la journée sélectionnée */}
              <div className="md:col-span-5 lg:col-span-4 space-y-4">
                <div className="rounded-2xl border border-[#EFE4D6] bg-white p-5 shadow-xs">
                  {/* Titre de la date sélectionnée */}
                  <div className="flex items-start justify-between gap-2 border-b border-[#EFE4D6] pb-3 mb-4">
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-wider text-[#8C6D58]">
                        Fiche du jour
                      </p>
                      <h3 className="font-[family-name:var(--font-title)] text-base font-extrabold text-[#24140D] mt-0.5">
                        {selectedDateFormatted}
                      </h3>
                    </div>
                    <span className="rounded-full bg-[#FAF7F2] px-2.5 py-0.5 text-xs font-bold text-[#612D10] border border-[#EFE4D6]">
                      {selectedDayEvents.length} échéance{selectedDayEvents.length > 1 ? "s" : ""}
                    </span>
                  </div>

                  {/* Liste des événements de la journée sélectionnée */}
                  {selectedDayEvents.length > 0 ? (
                    <div className="space-y-3 max-h-[380px] overflow-y-auto pr-1">
                      {selectedDayEvents.map((ev, idx) => {
                        const isJalon = ev.type === "jalon";
                        const isOverdue = ev.en_retard;

                        return (
                          <div
                            key={`${ev.date}-${ev.type}-${idx}`}
                            onClick={() => setSelectedEvent(ev)}
                            className={`rounded-xl p-3.5 border transition-all cursor-pointer shadow-2xs hover:shadow-xs hover:scale-[1.01] ${
                              isOverdue
                                ? "bg-red-50/70 border-red-200 hover:bg-red-50"
                                : "bg-[#FAF7F2]/60 border-[#EFE4D6] hover:bg-white hover:border-[#C99A68]"
                            }`}
                          >
                            <div className="flex items-center justify-between gap-1 mb-1.5">
                              <div className="flex items-center gap-1.5">
                                {isJalon ? (
                                  <span className="rounded-md bg-[#FFF9F3] border border-[#F2DAC1] px-2 py-0.5 text-[10px] font-bold text-[#78350F]">
                                    Jalon clé
                                  </span>
                                ) : (
                                  <span className="rounded-md bg-[#F0F7FF] border border-[#BFDBFE] px-2 py-0.5 text-[10px] font-bold text-[#1E40AF]">
                                    Objectif
                                  </span>
                                )}

                                {isOverdue && (
                                  <span className="rounded-md bg-red-100 border border-red-300 px-2 py-0.5 text-[10px] font-bold text-red-800">
                                    En retard
                                  </span>
                                )}
                              </div>

                              <span className="text-[10px] text-[#8C6D58] font-semibold capitalize">
                                {ev.statut.replace("_", " ")}
                              </span>
                            </div>

                            <h4 className="text-xs sm:text-sm font-bold text-[#24140D] line-clamp-2">
                              {ev.titre}
                            </h4>
                            <p className="text-xs text-[#8C6D58] mt-1 truncate">
                              Projet : <span className="font-semibold text-[#612D10]">{ev.projet}</span>
                            </p>

                            <div className="mt-2.5 pt-2 border-t border-[#EFE4D6]/60 flex items-center justify-between text-[11px]">
                              <span className="text-[#8C6D58]">Cliquez pour voir le détail</span>
                              <span className="inline-flex items-center gap-1 font-bold text-[#612D10]">
                                <span>Consulter</span>
                                <ChevronRight className="h-3.5 w-3.5" />
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="py-6 text-center">
                      <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-[#FAF7F2] text-[#8C6D58] mb-2">
                        <CalendarIcon className="h-5 w-5" />
                      </div>
                      <p className="text-xs font-bold text-[#4A2810]">
                        Aucune échéance fixée à cette date
                      </p>
                      <p className="text-[11px] text-[#8C6D58] mt-1 max-w-xs mx-auto">
                        Sélectionnez un jour surligné dans la grille pour consulter ses jalons.
                      </p>
                    </div>
                  )}

                  {/* Prochaines échéances du mois en cours si la journée est vide */}
                  {selectedDayEvents.length === 0 && upcomingMonthEvents.length > 0 && (
                    <div className="mt-4 pt-3 border-t border-[#EFE4D6]">
                      <p className="text-xs font-bold text-[#612D10] mb-2.5">
                        Prochaines échéances en {moisNom} :
                      </p>
                      <div className="space-y-2">
                        {upcomingMonthEvents.map((ev, i) => (
                          <div
                            key={`upcoming-${i}`}
                            onClick={() => setSelectedDateStr(ev.date)}
                            className="flex items-center justify-between gap-2 p-2.5 rounded-xl bg-[#FAF7F2]/70 hover:bg-[#F2E5D5] border border-[#EFE4D6] cursor-pointer text-xs transition-colors"
                          >
                            <div className="min-w-0 flex-1">
                              <p className="truncate font-semibold text-[#24140D]">
                                {ev.titre}
                              </p>
                              <p className="text-[10px] text-[#8C6D58] truncate">{ev.projet}</p>
                            </div>
                            <span className="text-[11px] text-[#612D10] shrink-0 font-bold bg-white px-2 py-0.5 rounded-md border border-[#EFE4D6]">
                              {formatDateFr(ev.date).split(" ").slice(0, 2).join(" ")}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* =========================================================================
                B. VUE MOBILE (Liste par jour ordonnée pour écrans < md, 390px)
               ========================================================================= */}
            <div className="block md:hidden space-y-3.5">
              <div className="flex items-center justify-between px-1 text-xs text-[#8C6D58]">
                <span>Affichage compact par date</span>
                <span>{mobileDaysList.length} jour(s) avec échéances</span>
              </div>

              {mobileDaysList.length === 0 ? (
                <EmptyState
                  title="Aucune échéance ce mois-ci"
                  description={`Il n'y a aucun jalon ou objectif planifié pour ${moisNom}. Utilisez les flèches pour parcourir les autres mois.`}
                  icon={<CalendarIcon className="h-6 w-6 text-[#A35926]" />}
                />
              ) : (
                mobileDaysList.map(({ dateStr, items }) => {
                  const dateObj = new Date(`${dateStr}T00:00:00`);
                  const dateFormatee = dateObj.toLocaleDateString("fr-FR", {
                    weekday: "short",
                    day: "numeric",
                    month: "short",
                  });

                  return (
                    <div
                      key={dateStr}
                      className="overflow-hidden rounded-2xl border border-[#EFE4D6] bg-white shadow-2xs"
                    >
                      {/* En-tête de la journée */}
                      <div className="flex items-center justify-between border-b border-[#EFE4D6] bg-[#FAF7F2] px-3.5 py-2">
                        <div className="flex items-center gap-2">
                          <CalendarIcon className="h-3.5 w-3.5 text-[#A35926]" />
                          <span className="text-xs font-bold uppercase tracking-wider text-[#612D10]">
                            {dateFormatee}
                          </span>
                        </div>
                        <span className="rounded-full bg-white px-2 py-0.2 text-[10px] font-bold text-[#8C6D58] border border-[#EFE4D6]">
                          {items.length}
                        </span>
                      </div>

                      {/* Liste des cartes d'événements de ce jour */}
                      <div className="divide-y divide-[#EFE4D6] p-2 space-y-1.5">
                        {items.map((ev, idx) => {
                          const isOverdue = ev.en_retard;
                          const isJalon = ev.type === "jalon";

                          return (
                            <div
                              key={`${ev.date}-${ev.type}-${idx}`}
                              onClick={() => setSelectedEvent(ev)}
                              className={`rounded-xl p-2.5 border transition-all cursor-pointer ${
                                isOverdue
                                  ? "bg-red-50/70 border-red-200"
                                  : "bg-white border-[#EFE4D6] hover:bg-[#FAF7F2]"
                              }`}
                            >
                              <div className="flex items-start justify-between gap-2 mb-1">
                                <div className="flex items-center gap-1">
                                  {isJalon ? (
                                    <span className="rounded-md bg-[#FFF9F3] border border-[#F2DAC1] px-1.5 py-0.5 text-[10px] font-bold text-[#78350F]">
                                      Jalon
                                    </span>
                                  ) : (
                                    <span className="rounded-md bg-[#F0F7FF] border border-[#BFDBFE] px-1.5 py-0.5 text-[10px] font-bold text-[#1E40AF]">
                                      Objectif
                                    </span>
                                  )}

                                  {isOverdue && (
                                    <span className="rounded-md bg-red-100 border border-red-300 px-1.5 py-0.5 text-[10px] font-bold text-red-800">
                                      En retard
                                    </span>
                                  )}
                                </div>

                                <span className="text-[10px] font-medium text-[#8C6D58]">
                                  {ev.statut}
                                </span>
                              </div>

                              <h4
                                className={`text-xs font-bold ${
                                  isOverdue ? "text-red-900" : "text-[#4A2810]"
                                }`}
                              >
                                {ev.titre}
                              </h4>

                              <div className="mt-1 flex items-center justify-between text-[11px] text-[#7D6B5D]">
                                <span className="truncate font-medium text-[#612D10]">
                                  {ev.projet}
                                </span>
                                <span className="text-[#A8988B]">
                                  {formatDateFr(ev.date)}
                                </span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </>
        )}

        {/* 5. MODALE DE DÉTAIL D'UN ÉVÉNEMENT */}
        {selectedEvent && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-xs"
            onClick={() => setSelectedEvent(null)}
          >
            <div
              className="w-full max-w-md overflow-hidden rounded-2xl border border-[#EFE4D6] bg-white p-5 sm:p-6 shadow-xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  {selectedEvent.type === "jalon" ? (
                    <Badge tone="alerte">Jalon d&apos;incubation</Badge>
                  ) : (
                    <Badge tone="info">Objectif opérationnel</Badge>
                  )}
                  {selectedEvent.en_retard && (
                    <Badge tone="erreur">En retard</Badge>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => setSelectedEvent(null)}
                  className="rounded-lg p-1 text-[#8C6D58] hover:bg-[#FAF7F2] hover:text-[#612D10]"
                  aria-label="Fermer"
                >
                  ✕
                </button>
              </div>

              <h3 className="text-base sm:text-lg font-bold text-[#4A2810] mb-2">
                {selectedEvent.titre}
              </h3>

              <div className="space-y-2 rounded-xl border border-[#EFE4D6] bg-[#FAF7F2] p-3.5 text-xs">
                <div className="flex justify-between">
                  <span className="text-[#8C6D58]">Projet associé :</span>
                  <span className="font-semibold text-[#612D10] text-right">
                    {selectedEvent.projet}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#8C6D58]">Date d&apos;échéance :</span>
                  <span className="font-semibold text-[#612D10]">
                    {formatDateFr(selectedEvent.date)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#8C6D58]">Statut d&apos;avancement :</span>
                  <span className="font-semibold text-[#612D10] capitalize">
                    {selectedEvent.statut.replace("_", " ")}
                  </span>
                </div>
              </div>

              {selectedEvent.en_retard && (
                <div className="mt-3.5 flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-800">
                  <AlertTriangle className="h-4 w-4 shrink-0 text-red-600" />
                  <span>
                    Cette échéance a été dépassée sans être marquée comme achevée.
                  </span>
                </div>
              )}

              <div className="mt-5 flex items-center justify-between gap-3 flex-wrap">
                <Link
                  href={
                    selectedEvent.projet_id
                      ? `/incubateur/projets/${selectedEvent.projet_id}#${selectedEvent.type === "jalon" ? "jalons" : "objectifs"}`
                      : `/incubateur/projets`
                  }
                  className="inline-flex items-center gap-1.5 rounded-xl bg-[#612D10] hover:bg-[#3F1D0A] px-4 py-2 text-xs font-bold text-white shadow-2xs transition-all cursor-pointer"
                >
                  <span>Accéder au projet</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>

                <Button
                  variant="secondary"
                  onClick={() => setSelectedEvent(null)}
                  className="!min-h-[36px] text-xs font-bold"
                >
                  Fermer
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function CalendrierPage() {
  return (
    <ProtectedRoute
      allowedRoles={[
        "porteur",
        "mentor",
        "coordonnateur",
        "administrateur",
        "membre_comite",
      ]}
    >
      <CalendrierVue />
    </ProtectedRoute>
  );
}
