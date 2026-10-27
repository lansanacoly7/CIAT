"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
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
import {
  formatDateFr,
  getCalendrier,
  suiviErrorMessage,
  type EvenementCalendrier,
} from "@/lib/incubator";

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
  const [filtreType, setFiltreType] = useState<"tous" | "jalon" | "objectif">("tous");
  const [filtreRetard, setFiltreRetard] = useState(false);
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
          setError(
            suiviErrorMessage(
              err,
              "Impossible de charger le calendrier pour ce mois. Veuillez vérifier votre connexion.",
            ),
          );
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

  // Filtrage des événements
  const filteredEvents = useMemo(() => {
    if (!evenements) return [];
    return evenements.filter((ev) => {
      if (filtreType !== "tous" && ev.type !== filtreType) return false;
      if (filtreRetard && !ev.en_retard) return false;
      return true;
    });
  }, [evenements, filtreType, filtreRetard]);

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
      <div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8 space-y-5">
        {/* 1. EN-TÊTE DE NAVIGATION : BREADCRUMB & CLOCHE D'ALERTE */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-[#8C6D58] mb-1">
              <Link
                href="/incubateur"
                className="hover:text-[#612D10] transition-colors"
              >
                Espace Incubateur
              </Link>
              <span>/</span>
              <span className="text-[#612D10]">Calendrier</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#4A2810]">
              Calendrier des jalons & objectifs
            </h1>
            <p className="mt-0.5 text-xs sm:text-sm text-[#7D6B5D]">
              Suivi chronologique des échéances, jalons de validation et objectifs opérationnels.
            </p>
          </div>

          {/* Cloche d'alerte de retard (remplaçant le bouton redondant de retour) */}
          <div className="flex items-center gap-2">
            <Link
              href="/incubateur/alertes"
              className="relative inline-flex min-h-10 items-center gap-2 rounded-xl border border-[#EFE4D6] bg-white px-3.5 text-xs font-semibold text-[#612D10] shadow-2xs transition-all hover:border-[#C99A68] hover:bg-[#FAF7F2]"
              aria-label="Alertes de retard"
              title="Consulter les alertes de retard"
            >
              <div className="relative">
                <Bell className="h-4 w-4 text-[#A35926]" />
                {stats.enRetard > 0 && (
                  <span className="absolute -top-1 -right-1 h-2 w-2 rounded-full bg-[#B91C1C] animate-pulse" />
                )}
              </div>
              <span>Alertes de retard</span>
              {stats.enRetard > 0 && (
                <span className="rounded-full bg-red-100 px-1.5 py-0.2 text-[10px] font-bold text-red-700">
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

        {/* 3. BARRE DE COMMANDE MENSUELLE & FILTRES RAPIDES */}
        <div className="overflow-hidden rounded-2xl border border-[#EFE4D6] bg-white p-3.5 sm:p-4 shadow-xs">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            {/* Navigation mensuelle : Précédent, Mois, Suivant, Aujourd'hui */}
            <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
              <div className="inline-flex items-center rounded-xl border border-[#EFE4D6] bg-[#FAF7F2] p-0.5 shadow-2xs">
                <button
                  type="button"
                  onClick={handlePrevMonth}
                  aria-label="Mois précédent"
                  className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-[#612D10] hover:bg-white hover:shadow-xs transition-all cursor-pointer"
                >
                  <ChevronLeft className="h-4.5 w-4.5" />
                </button>
                <div className="px-3 text-center min-w-[140px]">
                  <span className="text-sm font-bold text-[#4A2810]">
                    {moisNom}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handleNextMonth}
                  aria-label="Mois suivant"
                  className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-[#612D10] hover:bg-white hover:shadow-xs transition-all cursor-pointer"
                >
                  <ChevronRight className="h-4.5 w-4.5" />
                </button>
              </div>

              {!isCurrentMonthView && (
                <Button
                  variant="secondary"
                  onClick={handleToday}
                  className="!min-h-[34px] !px-2.5 text-xs font-bold gap-1.5"
                >
                  <RotateCcw className="h-3 w-3" />
                  <span>Aujourd&apos;hui</span>
                </Button>
              )}
            </div>

            {/* Filtres rapides */}
            <div className="flex items-center gap-1.5 flex-wrap text-xs">
              <button
                type="button"
                onClick={() => setFiltreType("tous")}
                className={`rounded-xl px-2.5 py-1 font-semibold transition-all cursor-pointer text-xs ${
                  filtreType === "tous"
                    ? "bg-[#612D10] text-white shadow-xs"
                    : "border border-[#EFE4D6] bg-white text-[#612D10] hover:bg-[#FAF7F2]"
                }`}
              >
                Tous ({stats.total})
              </button>

              <button
                type="button"
                onClick={() => setFiltreType(filtreType === "jalon" ? "tous" : "jalon")}
                className={`inline-flex items-center gap-1 rounded-xl px-2.5 py-1 font-semibold transition-all cursor-pointer text-xs ${
                  filtreType === "jalon"
                    ? "bg-[#A35926] text-white shadow-xs"
                    : "border border-[#EFE4D6] bg-white text-[#A35926] hover:bg-[#FAF7F2]"
                }`}
              >
                <Flag className="h-3 w-3" />
                <span>Jalons ({stats.jalons})</span>
              </button>

              <button
                type="button"
                onClick={() => setFiltreType(filtreType === "objectif" ? "tous" : "objectif")}
                className={`inline-flex items-center gap-1 rounded-xl px-2.5 py-1 font-semibold transition-all cursor-pointer text-xs ${
                  filtreType === "objectif"
                    ? "bg-[#2563EB] text-white shadow-xs"
                    : "border border-[#EFE4D6] bg-white text-[#2563EB] hover:bg-[#FAF7F2]"
                }`}
              >
                <Target className="h-3 w-3" />
                <span>Objectifs ({stats.objectifs})</span>
              </button>

              <button
                type="button"
                onClick={() => setFiltreRetard(!filtreRetard)}
                className={`inline-flex items-center gap-1 rounded-xl px-2.5 py-1 font-semibold transition-all cursor-pointer text-xs ${
                  filtreRetard
                    ? "bg-[#B91C1C] text-white shadow-xs"
                    : stats.enRetard > 0
                    ? "border border-red-200 bg-red-50 text-[#B91C1C] hover:bg-red-100"
                    : "border border-[#EFE4D6] bg-white text-[#8C6D58] hover:bg-[#FAF7F2]"
                }`}
              >
                <AlertTriangle className="h-3 w-3" />
                <span>En retard ({stats.enRetard})</span>
              </button>
            </div>
          </div>
        </div>

        {/* 4. CONTENU PRINCIPAL : ÉTAT CHARGEMENT OU VUES CALENDRIER */}
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
                A. VUE DESKTOP : DISPOSITION 2 COLONNES (Grille compacte à gauche, Détails à droite)
               ========================================================================= */}
            <div className="hidden md:grid md:grid-cols-12 gap-5 items-start">
              {/* COLONNE GAUCHE (8/12) : Grille mensuelle compacte (visible entièrement sans scroll) */}
              <div className="md:col-span-7 lg:col-span-8 overflow-hidden rounded-2xl border border-[#EFE4D6] bg-white shadow-xs">
                {/* En-tête des jours de la semaine */}
                <div className="grid grid-cols-7 border-b border-[#EFE4D6] bg-[#FAF7F2] text-center text-[11px] font-bold uppercase tracking-wider text-[#612D10]">
                  {JOURS_SEMAINE.map((jour, idx) => (
                    <div key={jour} className="py-2.5 border-r border-[#EFE4D6] last:border-r-0">
                      <span className="hidden lg:inline">{jour}</span>
                      <span className="lg:hidden">{JOURS_SEMAINE_COURTS[idx]}</span>
                    </div>
                  ))}
                </div>

                {/* Grille des cellules compactes */}
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
                        className={`min-h-[58px] lg:min-h-[64px] p-1.5 flex flex-col justify-between text-left transition-all cursor-pointer relative group ${
                          isSelected
                            ? "bg-[#FAF7F2] ring-2 ring-inset ring-[#A35926] z-10"
                            : !cell.isCurrentMonth
                            ? "bg-[#FAF7F2]/30 text-[#A8988B]"
                            : cell.isToday
                            ? "bg-[#FAF7F2]/70 hover:bg-[#FAF7F2]"
                            : "bg-white hover:bg-[#FAF7F2]/40"
                        }`}
                      >
                        {/* Numéro du jour & statut de sélection */}
                        <div className="flex items-center justify-between w-full">
                          <span
                            className={`inline-flex h-5 w-5 items-center justify-center rounded-full text-xs font-semibold ${
                              cell.isToday
                                ? "bg-[#C99A68] text-white font-bold shadow-2xs"
                                : isSelected
                                ? "bg-[#612D10] text-white font-bold"
                                : cell.isCurrentMonth
                                ? "text-[#4A2810]"
                                : "text-[#B8A89A]"
                            }`}
                          >
                            {cell.dayNum}
                          </span>

                          {cellEvents.length > 0 && (
                            <span
                              className={`text-[9px] font-bold px-1.5 py-0.2 rounded-md ${
                                hasOverdue
                                  ? "bg-red-100 text-red-700"
                                  : "bg-[#EFE4D6] text-[#612D10]"
                              }`}
                            >
                              {cellEvents.length}
                            </span>
                          )}
                        </div>

                        {/* Indicateurs visuels compacts dans la case */}
                        <div className="w-full space-y-0.5 mt-1 overflow-hidden">
                          {cellEvents.slice(0, 2).map((ev, evIdx) => (
                            <div
                              key={`${ev.date}-${evIdx}`}
                              className={`truncate rounded px-1 py-0.5 text-[9px] leading-tight font-medium ${
                                ev.en_retard
                                  ? "bg-red-100 text-red-800 font-semibold"
                                  : ev.type === "jalon"
                                  ? "bg-[#FFF9F3] text-[#78350F] border border-[#F2DAC1]"
                                  : "bg-[#F0F7FF] text-[#1E40AF] border border-[#BFDBFE]"
                              }`}
                            >
                              {ev.titre}
                            </div>
                          ))}
                          {cellEvents.length > 2 && (
                            <div className="text-[9px] font-bold text-[#8C6D58] pl-1">
                              +{cellEvents.length - 2} autre(s)
                            </div>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* COLONNE DROITE (4/12 ou 5/12) : Panneau de détails de la journée sélectionnée */}
              <div className="md:col-span-5 lg:col-span-4 space-y-4">
                <div className="rounded-2xl border border-[#EFE4D6] bg-white p-4 sm:p-5 shadow-xs">
                  {/* Titre de la date sélectionnée */}
                  <div className="flex items-start justify-between gap-2 border-b border-[#EFE4D6] pb-3 mb-3">
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-wider text-[#8C6D58]">
                        Échéances du jour
                      </p>
                      <h3 className="text-sm sm:text-base font-extrabold text-[#4A2810] mt-0.5">
                        {selectedDateFormatted}
                      </h3>
                    </div>
                    <span className="rounded-full bg-[#FAF7F2] px-2 py-0.5 text-xs font-bold text-[#612D10] border border-[#EFE4D6]">
                      {selectedDayEvents.length}
                    </span>
                  </div>

                  {/* Liste des événements de la journée sélectionnée */}
                  {selectedDayEvents.length > 0 ? (
                    <div className="space-y-2.5 max-h-[300px] overflow-y-auto pr-1">
                      {selectedDayEvents.map((ev, idx) => {
                        const isJalon = ev.type === "jalon";
                        const isOverdue = ev.en_retard;

                        return (
                          <div
                            key={`${ev.date}-${ev.type}-${idx}`}
                            onClick={() => setSelectedEvent(ev)}
                            className={`rounded-xl p-3 border transition-all cursor-pointer ${
                              isOverdue
                                ? "bg-red-50/70 border-red-300 hover:bg-red-100/70"
                                : "bg-[#FAF7F2]/60 border-[#EFE4D6] hover:bg-[#FAF7F2]"
                            }`}
                          >
                            <div className="flex items-center justify-between gap-1 mb-1.5">
                              <div className="flex items-center gap-1.5">
                                {isJalon ? (
                                  <span className="inline-flex items-center gap-1 rounded-md bg-[#FFF9F3] border border-[#F2DAC1] px-1.5 py-0.5 text-[10px] font-bold text-[#78350F]">
                                    <Flag className="h-3 w-3" />
                                    Jalon
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1 rounded-md bg-[#F0F7FF] border border-[#BFDBFE] px-1.5 py-0.5 text-[10px] font-bold text-[#1E40AF]">
                                    <Target className="h-3 w-3" />
                                    Objectif
                                  </span>
                                )}

                                {isOverdue && (
                                  <span className="inline-flex items-center gap-1 rounded-md bg-red-100 border border-red-300 px-1.5 py-0.5 text-[10px] font-bold text-red-800">
                                    <AlertTriangle className="h-3 w-3" />
                                    En retard
                                  </span>
                                )}
                              </div>

                              <span className="text-[10px] text-[#8C6D58] font-medium capitalize">
                                {ev.statut.replace("_", " ")}
                              </span>
                            </div>

                            <h4 className="text-xs font-bold text-[#4A2810] line-clamp-2">
                              {ev.titre}
                            </h4>
                            <p className="text-[11px] text-[#7D6B5D] mt-0.5 truncate">
                              {ev.projet}
                            </p>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="py-4 text-center">
                      <p className="text-xs text-[#8C6D58]">
                        Aucune échéance fixée à cette date.
                      </p>
                      <p className="text-[11px] text-[#B8A89A] mt-1">
                        Cliquez sur un autre jour dans la grille pour afficher ses détails.
                      </p>
                    </div>
                  )}

                  {/* Aperçu des prochains jalons du mois en cours si la journée est vide */}
                  {selectedDayEvents.length === 0 && upcomingMonthEvents.length > 0 && (
                    <div className="mt-4 pt-3 border-t border-[#EFE4D6]">
                      <p className="text-[11px] font-bold text-[#612D10] mb-2">
                        Autres échéances en {moisNom} :
                      </p>
                      <div className="space-y-1.5">
                        {upcomingMonthEvents.map((ev, i) => (
                          <div
                            key={`upcoming-${i}`}
                            onClick={() => setSelectedDateStr(ev.date)}
                            className="flex items-center justify-between gap-2 p-2 rounded-lg bg-[#FAF7F2]/50 hover:bg-[#FAF7F2] border border-[#EFE4D6]/70 cursor-pointer text-xs transition-colors"
                          >
                            <span className="truncate font-medium text-[#4A2810]">
                              {ev.titre}
                            </span>
                            <span className="text-[10px] text-[#8C6D58] shrink-0 font-semibold">
                              {formatDateFr(ev.date).split(" ").slice(0, 2).join(" ")}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Légende rapide */}
                <div className="rounded-2xl border border-[#EFE4D6] bg-[#FAF7F2]/60 p-3.5 text-xs text-[#7D6B5D] space-y-1.5">
                  <p className="font-bold text-[#612D10] text-[11px] uppercase tracking-wider">
                    Légende
                  </p>
                  <div className="flex items-center gap-3 flex-wrap text-[11px]">
                    <span className="inline-flex items-center gap-1 text-[#78350F]">
                      <span className="h-2 w-2 rounded-full bg-[#A35926]" />
                      Jalon
                    </span>
                    <span className="inline-flex items-center gap-1 text-[#1E40AF]">
                      <span className="h-2 w-2 rounded-full bg-[#2563EB]" />
                      Objectif
                    </span>
                    <span className="inline-flex items-center gap-1 text-[#B91C1C]">
                      <span className="h-2 w-2 rounded-full bg-[#B91C1C]" />
                      En retard
                    </span>
                  </div>
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
                                    <span className="inline-flex items-center gap-1 rounded-md bg-[#FFF9F3] border border-[#F2DAC1] px-1.5 py-0.2 text-[10px] font-bold text-[#78350F]">
                                      <Flag className="h-2.5 w-2.5" />
                                      Jalon
                                    </span>
                                  ) : (
                                    <span className="inline-flex items-center gap-1 rounded-md bg-[#F0F7FF] border border-[#BFDBFE] px-1.5 py-0.2 text-[10px] font-bold text-[#1E40AF]">
                                      <Target className="h-2.5 w-2.5" />
                                      Objectif
                                    </span>
                                  )}

                                  {isOverdue && (
                                    <span className="inline-flex items-center gap-1 rounded-md bg-red-100 border border-red-300 px-1.5 py-0.2 text-[10px] font-bold text-red-800 animate-pulse">
                                      <AlertTriangle className="h-2.5 w-2.5" />
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

              <div className="mt-5 flex justify-end">
                <Button
                  variant="primary"
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
