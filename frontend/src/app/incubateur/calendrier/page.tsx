"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  ArrowLeft,
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
    setCurrentDate(new Date(year, month - 1, 1));
    setSelectedEvent(null);
  };

  const handleNextMonth = () => {
    setLoading(true);
    setCurrentDate(new Date(year, month + 1, 1));
    setSelectedEvent(null);
  };

  const handleToday = () => {
    setLoading(true);
    setCurrentDate(new Date());
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
      <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* 1. EN-TÊTE DE NAVIGATION & BREADCRUMB */}
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-[#8C6D58] mb-1">
              <Link
                href="/incubateur/projets"
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
            <p className="mt-1 text-xs sm:text-sm text-[#7D6B5D]">
              Suivi chronologique des échéances, jalons de validation et objectifs opérationnels.
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <Link
              href="/incubateur/projets"
              className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-[#EFE4D6] bg-white px-3.5 text-xs font-semibold text-[#612D10] shadow-2xs transition-all hover:border-[#C99A68] hover:bg-[#FAF7F2]"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Retour à mes projets</span>
            </Link>
          </div>
        </div>

        {/* 2. BANNIÈRE D'ERREUR */}
        {error && (
          <ApiErrorBanner
            message={error}
            onRetry={load}
            className="mb-6 shadow-xs"
          />
        )}

        {/* 3. BARRE DE COMMANDE DU MOIS ET STATISTIQUES */}
        <div className="mb-6 overflow-hidden rounded-2xl border border-[#EFE4D6] bg-white p-4 sm:p-5 shadow-xs">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            {/* Navigation mensuelle : Précédent, Mois en cours, Suivant */}
            <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
              <div className="inline-flex items-center rounded-xl border border-[#EFE4D6] bg-[#FAF7F2] p-1 shadow-2xs">
                <button
                  type="button"
                  onClick={handlePrevMonth}
                  aria-label="Mois précédent"
                  className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-[#612D10] hover:bg-white hover:shadow-xs transition-all cursor-pointer"
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>
                <div className="px-3 text-center">
                  <span className="text-sm sm:text-base font-bold text-[#4A2810]">
                    {moisNom}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handleNextMonth}
                  aria-label="Mois suivant"
                  className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-[#612D10] hover:bg-white hover:shadow-xs transition-all cursor-pointer"
                >
                  <ChevronRight className="h-5 w-5" />
                </button>
              </div>

              {!isCurrentMonthView && (
                <Button
                  variant="secondary"
                  onClick={handleToday}
                  className="!min-h-[38px] !px-3 text-xs font-bold gap-1.5"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  <span>Aujourd&apos;hui</span>
                </Button>
              )}
            </div>

            {/* Filtres rapides et indicateurs */}
            <div className="flex items-center gap-2 flex-wrap text-xs">
              <button
                type="button"
                onClick={() => setFiltreType("tous")}
                className={`rounded-xl px-3 py-1.5 font-semibold transition-all cursor-pointer ${
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
                className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 font-semibold transition-all cursor-pointer ${
                  filtreType === "jalon"
                    ? "bg-[#A35926] text-white shadow-xs"
                    : "border border-[#EFE4D6] bg-white text-[#A35926] hover:bg-[#FAF7F2]"
                }`}
              >
                <Flag className="h-3.5 w-3.5" />
                <span>Jalons ({stats.jalons})</span>
              </button>

              <button
                type="button"
                onClick={() => setFiltreType(filtreType === "objectif" ? "tous" : "objectif")}
                className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 font-semibold transition-all cursor-pointer ${
                  filtreType === "objectif"
                    ? "bg-[#2563EB] text-white shadow-xs"
                    : "border border-[#EFE4D6] bg-white text-[#2563EB] hover:bg-[#FAF7F2]"
                }`}
              >
                <Target className="h-3.5 w-3.5" />
                <span>Objectifs ({stats.objectifs})</span>
              </button>

              <button
                type="button"
                onClick={() => setFiltreRetard(!filtreRetard)}
                className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 font-semibold transition-all cursor-pointer ${
                  filtreRetard
                    ? "bg-[#B91C1C] text-white shadow-xs"
                    : stats.enRetard > 0
                    ? "border border-red-200 bg-red-50 text-[#B91C1C] hover:bg-red-100"
                    : "border border-[#EFE4D6] bg-white text-[#8C6D58] hover:bg-[#FAF7F2]"
                }`}
              >
                <AlertTriangle className="h-3.5 w-3.5" />
                <span>En retard ({stats.enRetard})</span>
              </button>
            </div>
          </div>
        </div>

        {/* 4. CONTENU PRINCIPAL : CHARGEMENT / ÉTAT VIDE / VUES CALENDRIER */}
        {loading ? (
          <div className="rounded-2xl border border-[#EFE4D6] bg-white p-12 text-center shadow-xs">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-[#FAF7F2] text-[#A35926] mb-3 animate-pulse">
              <CalendarIcon className="h-6 w-6" />
            </div>
            <p className="text-sm font-semibold text-[#612D10]">
              Chargement des échéances de {moisNom}...
            </p>
            <p className="mt-1 text-xs text-[#8C6D58]">
              Interrogation sécurisée de l&apos;API incubateur
            </p>
          </div>
        ) : filteredEvents.length === 0 && !error ? (
          <EmptyState
            title="Aucune échéance ce mois-ci"
            description={`Il n'y a aucun jalon ou objectif répertorié pour ${moisNom}${
              filtreType !== "tous" || filtreRetard ? " avec les filtres sélectionnés" : ""
            }. Utilisez les flèches pour parcourir les autres mois.`}
            icon={<CalendarIcon className="h-7 w-7 text-[#A35926]" />}
            action={
              (filtreType !== "tous" || filtreRetard) && (
                <Button
                  variant="secondary"
                  onClick={() => {
                    setFiltreType("tous");
                    setFiltreRetard(false);
                  }}
                  className="!min-h-[38px] text-xs font-bold"
                >
                  Réinitialiser les filtres
                </Button>
              )
            }
          />
        ) : (
          <>
            {/* =========================================================================
                A. VUE DESKTOP (Grille mensuelle 7 colonnes pour écrans >= md)
               ========================================================================= */}
            <div className="hidden md:block">
              <div className="overflow-hidden rounded-2xl border border-[#EFE4D6] bg-white shadow-xs">
                {/* En-tête des jours de la semaine */}
                <div className="grid grid-cols-7 border-b border-[#EFE4D6] bg-[#FAF7F2] text-center text-xs font-bold uppercase tracking-wider text-[#612D10]">
                  {JOURS_SEMAINE.map((jour, idx) => (
                    <div key={jour} className="py-3 border-r border-[#EFE4D6] last:border-r-0">
                      <span className="hidden lg:inline">{jour}</span>
                      <span className="lg:hidden">{JOURS_SEMAINE_COURTS[idx]}</span>
                    </div>
                  ))}
                </div>

                {/* Grille des cellules du mois */}
                <div className="grid grid-cols-7 divide-x divide-y divide-[#EFE4D6]">
                  {calendarCells.map((cell) => {
                    const cellEvents = eventsByDate.get(cell.dateStr) || [];
                    const hasOverdue = cellEvents.some((e) => e.en_retard);

                    return (
                      <div
                        key={cell.dateStr}
                        className={`min-h-[125px] p-2 flex flex-col justify-between transition-colors ${
                          !cell.isCurrentMonth
                            ? "bg-[#FAF7F2]/40 text-[#A8988B]"
                            : cell.isToday
                            ? "bg-[#FAF7F2]/80"
                            : "bg-white hover:bg-[#FAF7F2]/30"
                        }`}
                      >
                        {/* Numéro du jour & indicateur aujourd'hui */}
                        <div className="flex items-center justify-between mb-1.5">
                          <span
                            className={`inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${
                              cell.isToday
                                ? "bg-[#C99A68] text-white shadow-2xs font-extrabold"
                                : cell.isCurrentMonth
                                ? "text-[#4A2810]"
                                : "text-[#A8988B]"
                            }`}
                          >
                            {cell.dayNum}
                          </span>

                          {cellEvents.length > 0 && (
                            <span
                              className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md ${
                                hasOverdue
                                  ? "bg-red-100 text-red-700"
                                  : "bg-[#EFE4D6] text-[#612D10]"
                              }`}
                            >
                              {cellEvents.length}
                            </span>
                          )}
                        </div>

                        {/* Liste des événements du jour */}
                        <div className="flex-1 space-y-1 overflow-y-auto max-h-[90px]">
                          {cellEvents.map((ev, evIdx) => {
                            const isJalon = ev.type === "jalon";
                            const isOverdue = ev.en_retard;

                            return (
                              <button
                                key={`${ev.date}-${ev.type}-${evIdx}`}
                                type="button"
                                onClick={() => setSelectedEvent(ev)}
                                className={`w-full text-left rounded-lg p-1.5 text-xs transition-all cursor-pointer border block truncate ${
                                  isOverdue
                                    ? "bg-red-50 border-red-300 text-red-800 hover:bg-red-100 font-semibold shadow-2xs"
                                    : isJalon
                                    ? "bg-[#FFF9F3] border-[#F2DAC1] text-[#78350F] hover:bg-[#FCE8D5]"
                                    : "bg-[#F0F7FF] border-[#BFDBFE] text-[#1E40AF] hover:bg-[#DBEAFE]"
                                }`}
                                title={`${ev.titre} (${ev.projet}) - ${
                                  isOverdue ? "EN RETARD" : ev.statut
                                }`}
                              >
                                <div className="flex items-center gap-1">
                                  {isOverdue ? (
                                    <AlertTriangle className="h-3 w-3 shrink-0 text-red-600" />
                                  ) : isJalon ? (
                                    <Flag className="h-3 w-3 shrink-0 text-[#A35926]" />
                                  ) : (
                                    <Target className="h-3 w-3 shrink-0 text-[#2563EB]" />
                                  )}
                                  <span className="truncate text-[11px] leading-tight">
                                    {ev.titre}
                                  </span>
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* =========================================================================
                B. VUE MOBILE (Liste par jour ordonnée pour écrans < md, ex: 390px)
               ========================================================================= */}
            <div className="block md:hidden space-y-4">
              <div className="flex items-center justify-between px-1 text-xs text-[#8C6D58]">
                <span>Affichage compact par date</span>
                <span>{mobileDaysList.length} jour(s) avec échéances</span>
              </div>

              {mobileDaysList.map(({ dateStr, items }) => {
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
                    <div className="flex items-center justify-between border-b border-[#EFE4D6] bg-[#FAF7F2] px-4 py-2.5">
                      <div className="flex items-center gap-2">
                        <CalendarIcon className="h-4 w-4 text-[#A35926]" />
                        <span className="text-xs font-bold uppercase tracking-wider text-[#612D10]">
                          {dateFormatee}
                        </span>
                      </div>
                      <span className="rounded-full bg-white px-2 py-0.5 text-[10px] font-bold text-[#8C6D58] border border-[#EFE4D6]">
                        {items.length} échéance{items.length > 1 ? "s" : ""}
                      </span>
                    </div>

                    {/* Liste des cartes d'événements de ce jour */}
                    <div className="divide-y divide-[#EFE4D6] p-2 space-y-2">
                      {items.map((ev, idx) => {
                        const isOverdue = ev.en_retard;
                        const isJalon = ev.type === "jalon";

                        return (
                          <div
                            key={`${ev.date}-${ev.type}-${idx}`}
                            onClick={() => setSelectedEvent(ev)}
                            className={`rounded-xl p-3 border transition-all cursor-pointer ${
                              isOverdue
                                ? "bg-red-50/70 border-red-200"
                                : "bg-white border-[#EFE4D6] hover:bg-[#FAF7F2]"
                            }`}
                          >
                            <div className="flex items-start justify-between gap-2 mb-1.5">
                              <div className="flex items-center gap-1.5">
                                {isJalon ? (
                                  <span className="inline-flex items-center gap-1 rounded-md bg-[#FFF9F3] border border-[#F2DAC1] px-2 py-0.5 text-[10px] font-bold text-[#78350F]">
                                    <Flag className="h-3 w-3" />
                                    Jalon
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1 rounded-md bg-[#F0F7FF] border border-[#BFDBFE] px-2 py-0.5 text-[10px] font-bold text-[#1E40AF]">
                                    <Target className="h-3 w-3" />
                                    Objectif
                                  </span>
                                )}

                                {isOverdue && (
                                  <span className="inline-flex items-center gap-1 rounded-md bg-red-100 border border-red-300 px-2 py-0.5 text-[10px] font-bold text-red-800 animate-pulse">
                                    <AlertTriangle className="h-3 w-3" />
                                    En retard
                                  </span>
                                )}
                              </div>

                              <span className="text-[11px] font-medium text-[#8C6D58]">
                                {ev.statut}
                              </span>
                            </div>

                            <h4
                              className={`text-sm font-bold ${
                                isOverdue ? "text-red-900" : "text-[#4A2810]"
                              }`}
                            >
                              {ev.titre}
                            </h4>

                            <div className="mt-1 flex items-center justify-between text-xs text-[#7D6B5D]">
                              <span className="truncate font-medium text-[#612D10]">
                                {ev.projet}
                              </span>
                              <span className="text-[11px] text-[#A8988B]">
                                {formatDateFr(ev.date)}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
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
              className="w-full max-w-md overflow-hidden rounded-2xl border border-[#EFE4D6] bg-white p-6 shadow-xl"
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

              <h3 className="text-lg font-bold text-[#4A2810] mb-2">
                {selectedEvent.titre}
              </h3>

              <div className="space-y-2.5 rounded-xl border border-[#EFE4D6] bg-[#FAF7F2] p-4 text-xs">
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
                <div className="mt-4 flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-800">
                  <AlertTriangle className="h-4 w-4 shrink-0 text-red-600" />
                  <span>
                    Cette échéance a été dépassée sans être marquée comme achevée.
                  </span>
                </div>
              )}

              <div className="mt-6 flex justify-end">
                <Button
                  variant="primary"
                  onClick={() => setSelectedEvent(null)}
                  className="!min-h-[38px] text-xs font-bold"
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
