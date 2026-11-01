"use client";

import { useMemo, useState, useEffect, useRef, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import {
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  Search,
  X,
  CheckCircle2,
  FileText,
  History,
  Clock,
  Calendar,
  TrendingUp,
} from "lucide-react";
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { FinancementItem } from "../types";
import { formatDate, formatNumber } from "@/lib/format";
import { getDomaineShortLabel, getDomaineFullName } from "@/lib/domaines";

interface DetailTableProps {
  data: FinancementItem[];
  isLoading?: boolean;
}

type SortField = "projet_titre" | "domaine" | "source" | "date" | "statut" | "montant";
type SortDirection = "asc" | "desc";
type HistoryFilterType = "all" | "decaisse" | "accorde" | "instruction";

export function DetailTable({ data, isLoading = false }: DetailTableProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStatut, setSelectedStatut] = useState<string>("all");
  const [sortField, setSortField] = useState<SortField>("date");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");
  const [pageSize, setPageSize] = useState<number>(10);
  const [currentPage, setCurrentPage] = useState<number>(1);

  // Détection du montage client (conforme React 19 / sans setState in effect)
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );

  // État de la modale d'historique des fonds
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [historyFilter, setHistoryFilter] = useState<HistoryFilterType>("all");
  const modalRef = useRef<HTMLDivElement>(null);
  const lastFocusedElementRef = useRef<HTMLElement | null>(null);

  // Focus trap et restauration du focus
  useEffect(() => {
    if (isHistoryModalOpen) {
      lastFocusedElementRef.current = document.activeElement as HTMLElement;
      const timer = setTimeout(() => {
        const closeBtn = modalRef.current?.querySelector<HTMLElement>("#close-history-modal-btn");
        if (closeBtn) {
          closeBtn.focus();
        } else {
          const focusables = modalRef.current?.querySelectorAll<HTMLElement>(
            'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
          );
          if (focusables && focusables.length > 0) focusables[0].focus();
        }
      }, 50);
      return () => clearTimeout(timer);
    } else if (lastFocusedElementRef.current) {
      lastFocusedElementRef.current.focus();
    }
  }, [isHistoryModalOpen]);

  // Fermeture par touche Échap et piégeage strict du focus (Tab / Shift+Tab)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isHistoryModalOpen) return;
      if (e.key === "Escape") {
        setIsHistoryModalOpen(false);
        return;
      }
      if (e.key === "Tab" && modalRef.current) {
        const focusables = Array.from(
          modalRef.current.querySelectorAll<HTMLElement>(
            'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
          )
        ).filter((el) => el.offsetParent !== null);
        if (focusables.length === 0) return;
        const first = focusables[0];
        const last = focusables[focusables.length - 1];
        if (e.shiftKey) {
          if (document.activeElement === first || !modalRef.current.contains(document.activeElement)) {
            e.preventDefault();
            last.focus();
          }
        } else {
          if (document.activeElement === last || !modalRef.current.contains(document.activeElement)) {
            e.preventDefault();
            first.focus();
          }
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isHistoryModalOpen]);

  // Verrouillage du scroll du corps lorsque la modale est active
  useEffect(() => {
    if (isHistoryModalOpen) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [isHistoryModalOpen]);



  // Décompte par statut pour les puces de filtrage
  const statusCounts = useMemo(() => {
    let decaisse = 0;
    let accorde = 0;
    let instruction = 0;
    let attente = 0;
    data.forEach((item) => {
      const s = (item.statut || "").toLowerCase();
      if (s.includes("decaisse") || s.includes("paye")) decaisse++;
      else if (s.includes("accorde") || s.includes("valide")) accorde++;
      else if (s.includes("cours") || s.includes("instruction")) instruction++;
      else attente++;
    });
    return { all: data.length, decaisse, accorde, instruction, attente };
  }, [data]);

  // Filtrage du tableau principal
  const filteredData = useMemo(() => {
    return data.filter((item) => {
      const matchesSearch =
        item.projet_titre?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.porteur_nom?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.source?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.domaine?.toLowerCase().includes(searchTerm.toLowerCase());

      const s = (item.statut || "").toLowerCase();
      let matchesStatut = selectedStatut === "all";
      if (selectedStatut === "decaisse") matchesStatut = s.includes("decaisse") || s.includes("paye");
      else if (selectedStatut === "accorde") matchesStatut = s.includes("accorde") || s.includes("valide");
      else if (selectedStatut === "instruction") matchesStatut = s.includes("cours") || s.includes("instruction");
      else if (selectedStatut === "attente") matchesStatut = s.includes("attente") || s.includes("discussion");

      return matchesSearch && matchesStatut;
    });
  }, [data, searchTerm, selectedStatut]);

  // Tri du tableau principal
  const sortedData = useMemo(() => {
    return [...filteredData].sort((a, b) => {
      const aVal = a[sortField];
      const bVal = b[sortField];

      if (sortField === "montant") {
        const aNum = Number(aVal) || 0;
        const bNum = Number(bVal) || 0;
        return sortDirection === "asc" ? aNum - bNum : bNum - aNum;
      }

      if (sortField === "date") {
        const aTime = new Date(aVal || 0).getTime();
        const bTime = new Date(bVal || 0).getTime();
        return sortDirection === "asc" ? aTime - bTime : bTime - aTime;
      }

      const aStr = String(aVal || "").toLowerCase();
      const bStr = String(bVal || "").toLowerCase();
      if (aStr < bStr) return sortDirection === "asc" ? -1 : 1;
      if (aStr > bStr) return sortDirection === "asc" ? 1 : -1;
      return 0;
    });
  }, [filteredData, sortField, sortDirection]);

  // Données de l'historique chronologique pour la modale
  const historyTimelineData = useMemo(() => {
    const list = data.filter((item) => {
      if (historyFilter === "all") return true;
      const s = (item.statut || "").toLowerCase();
      if (historyFilter === "decaisse") return s.includes("decaisse") || s.includes("paye");
      if (historyFilter === "accorde") return s.includes("accorde") || s.includes("valide");
      if (historyFilter === "instruction") return s.includes("cours") || s.includes("instruction");
      return true;
    });

    // Tri chronologique décroissant (le plus récent en premier)
    return [...list].sort((a, b) => {
      const tA = new Date(a.date || 0).getTime();
      const tB = new Date(b.date || 0).getTime();
      return tB - tA;
    });
  }, [data, historyFilter]);

  const historyTotalAmount = useMemo(() => {
    return historyTimelineData.reduce(
      (acc, item) => acc + (Number(item.montant) || 0),
      0
    );
  }, [historyTimelineData]);

  // Données diagramme en barres : montants par mois pour le BarChart
  const barChartData = useMemo(() => {
    if (historyTimelineData.length === 0) return [];

    const monthMap = new Map<string, number>();
    const sorted = [...historyTimelineData].sort((a, b) => {
      return new Date(a.date || 0).getTime() - new Date(b.date || 0).getTime();
    });

    sorted.forEach((item) => {
      const d = new Date(item.date || 0);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      monthMap.set(key, (monthMap.get(key) || 0) + (Number(item.montant) || 0));
    });

    const result: { mois: string; montant: number }[] = [];
    Array.from(monthMap.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-12) // Derniers 12 mois max
      .forEach(([mois, montant]) => {
        const [y, m] = mois.split("-");
        const label = `${["Jan", "Fév", "Mar", "Avr", "Mai", "Jun", "Jul", "Aoû", "Sep", "Oct", "Nov", "Déc"][Number(m) - 1]} ${y.slice(2)}`;
        result.push({ mois: label, montant });
      });

    return result;
  }, [historyTimelineData]);

  // Données diagramme anneau : répartition par statut
  const donutData = useMemo(() => {
    let decaisse = 0;
    let accorde = 0;
    let instruction = 0;
    let attente = 0;

    historyTimelineData.forEach((item) => {
      const s = (item.statut || "").toLowerCase();
      const m = Number(item.montant) || 0;
      if (s.includes("decaisse") || s.includes("paye")) decaisse += m;
      else if (s.includes("accorde") || s.includes("valide")) accorde += m;
      else if (s.includes("cours") || s.includes("instruction")) instruction += m;
      else attente += m;
    });

    return [
      { name: "Décaissé", value: decaisse, color: "#2E7D32" },
      { name: "Accordé", value: accorde, color: "#8C5E2D" },
      { name: "En instruction", value: instruction, color: "#4A6B82" },
      { name: "En attente", value: attente, color: "#A08B7A" },
    ].filter((d) => d.value > 0);
  }, [historyTimelineData]);

  // Somme totale des montants filtrés du tableau principal
  const totalAmount = useMemo(() => {
    return filteredData.reduce(
      (acc, item) => acc + (Number(item.montant) || 0),
      0
    );
  }, [filteredData]);

  // Pagination
  const totalPages = Math.ceil(sortedData.length / pageSize) || 1;
  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return sortedData.slice(start, start + pageSize);
  }, [sortedData, currentPage, pageSize]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("desc");
    }
  };

  // Ouvre la modale d'historique avec le filtre souhaité
  const handleOpenHistory = (filter: HistoryFilterType) => {
    setHistoryFilter(filter);
    setIsHistoryModalOpen(true);
  };

  // Badge statut conforme à la charte CIAT avec pastille colorée
  const getStatusBadge = (statut?: string, statutDisplay?: string) => {
    const s = statut?.toLowerCase() || "";
    const tooltip = statutDisplay || statut || "Inconnu";

    if (s.includes("decaisse") || s.includes("paye")) {
      return (
        <span
          title={tooltip}
          className="inline-flex min-w-[102px] items-center justify-center gap-1.5 rounded-full border border-[#2E7D32]/25 bg-[#2E7D32]/10 px-2.5 py-1 text-[11px] font-semibold text-[#1E5222] whitespace-nowrap"
        >
          <span className="h-1.5 w-1.5 rounded-full bg-[#2E7D32]" />
          <span>Décaissé</span>
        </span>
      );
    }
    if (s.includes("accorde") || s.includes("valide")) {
      return (
        <span
          title={tooltip}
          className="inline-flex min-w-[102px] items-center justify-center gap-1.5 rounded-full border border-[#8C5E2D]/25 bg-[#8C5E2D]/10 px-2.5 py-1 text-[11px] font-semibold text-[#612D10] whitespace-nowrap"
        >
          <span className="h-1.5 w-1.5 rounded-full bg-[#8C5E2D]" />
          <span>Accordé</span>
        </span>
      );
    }
    if (s.includes("cours") || s.includes("instruction")) {
      return (
        <span
          title={tooltip}
          className="inline-flex min-w-[102px] items-center justify-center gap-1.5 rounded-full border border-[#4A6B82]/25 bg-[#4A6B82]/10 px-2.5 py-1 text-[11px] font-semibold text-[#213542] whitespace-nowrap"
        >
          <span className="h-1.5 w-1.5 rounded-full bg-[#4A6B82]" />
          <span>En instruction</span>
        </span>
      );
    }
    return (
      <span
        title={tooltip}
        className="inline-flex min-w-[102px] items-center justify-center gap-1.5 rounded-full border border-[#5A4B42]/20 bg-[#5A4B42]/10 px-2.5 py-1 text-[11px] font-semibold text-[#3A2E26] whitespace-nowrap"
      >
        <span className="h-1.5 w-1.5 rounded-full bg-[#5A4B42]" />
        <span>En attente</span>
      </span>
    );
  };

  return (
    <div className="space-y-4">
      {/* Cadre principal du Registre : Barre d'outils + Tableau + Pagination */}
      <div className="rounded-2xl border border-[#EFE4D6] bg-white p-3.5 sm:p-5 shadow-2xs space-y-4">
        {/* Barre d'outils du tableau : Recherche + Filtres Statut Rapides + PageSize */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#EFE4D6] pb-4">
          {/* Recherche avec bouton de réinitialisation rapide */}
          <div className="relative w-full sm:min-w-[260px] sm:flex-1 sm:max-w-sm">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-[#8C5E2D]" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              aria-label="Rechercher par projet, porteur ou guichet"
              placeholder="Rechercher un projet, porteur, guichet..."
              className="w-full h-10 sm:h-9 rounded-xl border border-[#EFE4D6] bg-[#FAF7F2] pl-9 pr-8 text-xs font-medium text-[#21130D] placeholder:text-[#6B5646] transition focus:border-[#8C5E2D] focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-[#8C5E2D]/10"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => {
                  setSearchTerm("");
                  setCurrentPage(1);
                }}
                className="absolute right-2.5 top-2.5 text-[#6B5646] hover:text-[#21130D] min-h-[32px] min-w-[32px] flex items-center justify-center"
                aria-label="Effacer la recherche"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* Filtres rapides statut avec compteurs */}
          <div className="flex items-center gap-1.5 flex-wrap w-full sm:w-auto">
            {[
              { key: "all", label: "Tous", count: statusCounts.all },
              { key: "decaisse", label: "Décaissés", count: statusCounts.decaisse },
              { key: "accorde", label: "Accordés", count: statusCounts.accorde },
              { key: "instruction", label: "En instruction", count: statusCounts.instruction },
              { key: "attente", label: "En attente", count: statusCounts.attente },
            ].map((pill) => {
              const isActive = selectedStatut === pill.key;
              return (
                <button
                  key={pill.key}
                  type="button"
                  onClick={() => {
                    setSelectedStatut(pill.key);
                    setCurrentPage(1);
                  }}
                  className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-2 sm:py-1.5 text-xs transition-all min-h-[38px] sm:min-h-0 ${
                    isActive
                      ? "bg-[#21130D] text-white shadow-xs font-semibold"
                      : "border border-[#EFE4D6] bg-[#FAF7F2] text-[#6B5646] hover:bg-white hover:text-[#21130D] font-medium"
                  }`}
                >
                  <span>{pill.label}</span>
                  <span
                    className={`rounded-full px-1.5 py-0.2 text-[10px] tabular-nums font-semibold ${
                      isActive
                        ? "bg-white/20 text-white"
                        : "bg-white text-[#8C5E2D] border border-[#EFE4D6]"
                    }`}
                  >
                    {pill.count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Outils secondaires : Pagination & Accès Historique */}
          <div className="flex items-center gap-2.5 text-xs text-[#6B5646]">
            <button
              type="button"
              onClick={() => handleOpenHistory("all")}
              className="inline-flex items-center gap-1.5 rounded-lg border border-[#EFE4D6] bg-[#FAF7F2] px-2.5 py-1.5 text-xs font-semibold text-[#612D10] hover:bg-white hover:border-[#8C5E2D] transition cursor-pointer"
              title="Consulter l'historique chronologique des versements et conventions"
            >
              <History className="h-3.5 w-3.5 text-[#8C5E2D]" />
              <span className="hidden md:inline">Historique</span>
            </button>

            <div className="flex items-center gap-1.5">
              <span>Lignes :</span>
              <select
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  setCurrentPage(1);
                }}
                aria-label="Nombre de lignes par page"
                className="h-8 rounded-lg border border-[#EFE4D6] bg-[#FAF7F2] px-2 text-xs font-semibold text-[#21130D] focus:border-[#8C5E2D] focus:bg-white focus:outline-hidden"
              >
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
              </select>
            </div>
          </div>
        </div>

        {/* ── VUE CARTES EMPILÉES SUR MOBILE (< 640px) ── */}
        <div className="block sm:hidden space-y-3">
          {isLoading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-28 rounded-xl border border-[#EFE4D6] bg-[#FAF7F2]/50 animate-pulse" />
            ))
          ) : paginatedData.length === 0 ? (
            <div className="py-10 text-center text-xs text-[#6B5646] rounded-xl border border-dashed border-[#EFE4D6] p-4">
              <FileText className="h-8 w-8 text-[#8C5E2D]/40 mx-auto mb-2" />
              <p className="font-semibold text-[#21130D]">Aucun enregistrement ne correspond aux critères</p>
              <p className="text-[11px] text-[#8C6D4F] mt-0.5">Modifiez votre recherche ou réinitialisez les filtres.</p>
            </div>
          ) : (
            paginatedData.map((row) => (
              <div
                key={row.id}
                className="rounded-xl border border-[#EFE4D6] bg-white p-3.5 shadow-2xs space-y-2.5 transition hover:border-[#8C5E2D]/40"
              >
                {/* Ligne 1 : Titre + Domaine */}
                <div className="flex items-start justify-between gap-2">
                  <div className="space-y-0.5 flex-1 min-w-0">
                    <h4 className="text-[13.5px] font-semibold text-[#21130D] leading-snug line-clamp-2">
                      {row.projet_titre || "Projet CIAT"}
                    </h4>
                    <div className="text-[11px] text-[#6B5646] truncate">
                      {row.porteur_nom || "Porteur non renseigné"}
                      {row.cohorte && (
                        <span className="ml-1.5 rounded-md border border-[#EFE4D6] bg-[#FAF7F2] px-1.5 py-0.2 text-[10px] font-semibold text-[#8C5E2D]">
                          {row.cohorte}
                        </span>
                      )}
                    </div>
                  </div>
                  <span className="shrink-0 rounded-lg border border-[#EFE4D6] bg-[#FAF7F2] px-2 py-0.5 text-[10px] font-medium text-[#612D10]">
                    {getDomaineShortLabel(row.domaine)}
                  </span>
                </div>

                {/* Ligne 2 : Source & Date */}
                <div className="flex items-center justify-between text-[11px] text-[#6B5646] border-t border-[#EFE4D6]/60 pt-2">
                  <span className="truncate max-w-[190px] font-medium text-[#612D10]">
                    {row.source || "Fonds CIAT"}
                  </span>
                  <span className="font-mono tabular-nums text-[#8C6D4F]">
                    {formatDate(row.date)}
                  </span>
                </div>

                {/* Ligne 3 : Statut badge + Montant mis en valeur */}
                <div className="flex items-center justify-between pt-1">
                  <div>{getStatusBadge(row.statut, row.statut_display)}</div>
                  <div className="text-right">
                    <span className="font-sans text-[15px] font-bold text-[#21130D] tabular-nums">
                      {formatNumber(Number(row.montant) || 0)}
                    </span>
                    <span className="ml-1 text-[11px] font-normal text-[#8C6D4F]">FCFA</span>
                  </div>
                </div>
              </div>
            ))
          )}

          {/* Total filtré mobile */}
          {filteredData.length > 0 && (
            <div className="rounded-xl border border-[#EFE4D6] bg-[#FAF7F2] p-3 text-xs flex items-center justify-between">
              <span className="font-semibold text-[#612D10] text-[11px] uppercase tracking-wider">
                Total filtré ({filteredData.length} dos.)
              </span>
              <div className="text-right">
                <span className="font-sans text-base font-black text-[#612D10] tabular-nums">
                  {formatNumber(totalAmount)}
                </span>
                <span className="ml-1 text-xs font-semibold text-[#8C5E2D]">FCFA</span>
              </div>
            </div>
          )}
        </div>

        {/* ── VUE TABLEAU TABLE-FIXED SUR ÉCRAN >= 640px (DESKTOP / TABLETTE) ── */}
        <div className="hidden sm:block relative overflow-x-auto rounded-xl border border-[#EFE4D6] bg-white shadow-2xs">
          <table className="w-full text-left text-xs table-fixed min-w-[820px]">
            <colgroup>
              <col className="w-[30%]" />
              <col className="w-[20%]" />
              <col className="w-[15%]" />
              <col className="w-[10%]" />
              <col className="w-[12%]" />
              <col className="w-[13%]" />
            </colgroup>
            <thead className="sticky top-0 z-10 border-b border-[#EFE4D6] bg-[#FAF7F2] shadow-xs">
              <tr className="h-11">
                <th
                  onClick={() => handleSort("projet_titre")}
                  className="group/th cursor-pointer px-4 font-bold uppercase tracking-[0.06em] text-[#612D10] hover:text-[#8C5E2D] whitespace-nowrap text-[11px]"
                >
                  <div className="flex items-center gap-1.5">
                    <span>Projet & Porteur</span>
                    <ArrowUpDown
                      className={`h-3 w-3 text-[#C99A68] transition-opacity ${
                        sortField === "projet_titre"
                          ? "opacity-100 text-[#8C5E2D]"
                          : "opacity-40 group-hover/th:opacity-100"
                      }`}
                    />
                  </div>
                </th>

                <th
                  onClick={() => handleSort("domaine")}
                  className="group/th cursor-pointer px-3 font-bold uppercase tracking-[0.06em] text-[#612D10] hover:text-[#8C5E2D] whitespace-nowrap text-[11px]"
                >
                  <div className="flex items-center gap-1.5">
                    <span>Domaine</span>
                    <ArrowUpDown
                      className={`h-3 w-3 text-[#C99A68] transition-opacity ${
                        sortField === "domaine"
                          ? "opacity-100 text-[#8C5E2D]"
                          : "opacity-40 group-hover/th:opacity-100"
                      }`}
                    />
                  </div>
                </th>

                <th
                  onClick={() => handleSort("source")}
                  className="group/th cursor-pointer px-3 font-bold uppercase tracking-[0.06em] text-[#612D10] hover:text-[#8C5E2D] whitespace-nowrap text-[11px]"
                >
                  <div className="flex items-center gap-1.5">
                    <span>Source financière</span>
                    <ArrowUpDown
                      className={`h-3 w-3 text-[#C99A68] transition-opacity ${
                        sortField === "source"
                          ? "opacity-100 text-[#8C5E2D]"
                          : "opacity-40 group-hover/th:opacity-100"
                      }`}
                    />
                  </div>
                </th>

                <th
                  onClick={() => handleSort("date")}
                  className="group/th cursor-pointer px-2 text-center font-bold uppercase tracking-[0.06em] text-[#612D10] hover:text-[#8C5E2D] whitespace-nowrap text-[11px]"
                >
                  <div className="flex items-center justify-center gap-1">
                    <span>Date</span>
                    <ArrowUpDown
                      className={`h-3 w-3 text-[#C99A68] transition-opacity ${
                        sortField === "date"
                          ? "opacity-100 text-[#8C5E2D]"
                          : "opacity-40 group-hover/th:opacity-100"
                      }`}
                    />
                  </div>
                </th>

                <th
                  onClick={() => handleSort("statut")}
                  className="group/th cursor-pointer px-2 text-center font-bold uppercase tracking-[0.06em] text-[#612D10] hover:text-[#8C5E2D] whitespace-nowrap text-[11px]"
                >
                  <div className="flex items-center justify-center gap-1">
                    <span>Statut</span>
                    <ArrowUpDown
                      className={`h-3 w-3 text-[#C99A68] transition-opacity ${
                        sortField === "statut"
                          ? "opacity-100 text-[#8C5E2D]"
                          : "opacity-40 group-hover/th:opacity-100"
                      }`}
                    />
                  </div>
                </th>

                <th
                  onClick={() => handleSort("montant")}
                  className="group/th cursor-pointer px-4 text-right font-bold uppercase tracking-[0.06em] text-[#612D10] hover:text-[#8C5E2D] whitespace-nowrap text-[11px]"
                >
                  <div className="flex items-center justify-end gap-1">
                    <span>Montant (FCFA)</span>
                    <ArrowUpDown
                      className={`h-3 w-3 text-[#C99A68] transition-opacity ${
                        sortField === "montant"
                          ? "opacity-100 text-[#8C5E2D]"
                          : "opacity-40 group-hover/th:opacity-100"
                      }`}
                    />
                  </div>
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-[#EFE4D6]/60">
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="h-[64px] animate-pulse">
                    <td colSpan={6} className="px-4 py-3">
                      <div className="h-4 w-3/4 rounded bg-[#EFE4D6]/40" />
                    </td>
                  </tr>
                ))
              ) : paginatedData.length === 0 ? (
                <tr className="h-32 text-center text-[#6B5646]">
                  <td colSpan={6} className="p-6">
                    <div className="flex flex-col items-center justify-center text-xs">
                      <FileText className="h-8 w-8 text-[#8C5E2D]/40 mb-2" />
                      <span className="font-semibold text-[#21130D]">
                        Aucun enregistrement ne correspond aux critères
                      </span>
                      <span className="text-[11px] text-[#8C6D4F] mt-0.5">
                        Modifiez votre recherche ou réinitialisez les filtres de statut.
                      </span>
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedData.map((row) => (
                  <tr
                    key={row.id}
                    className="group relative h-[64px] transition-colors hover:bg-[#FAF7F2]/70"
                  >
                    {/* Projet : Nom en clamp 2 lignes 13.5px avec tooltip + porteur et cohorte en badge */}
                    <td className="px-4 py-2.5">
                      <div
                        title={row.projet_titre}
                        className="line-clamp-2 text-[13.5px] font-semibold text-[#21130D] leading-snug group-hover:text-[#8C5E2D] transition-colors"
                      >
                        {row.projet_titre || "Projet CIAT"}
                      </div>
                      <div className="mt-1 flex items-center gap-1.5 truncate text-[11px] text-[#6B5646]">
                        <span className="truncate">{row.porteur_nom || "Porteur non renseigné"}</span>
                        {row.cohorte && (
                          <span className="shrink-0 rounded-md border border-[#EFE4D6] bg-[#FAF7F2] px-1.5 py-0.2 text-[10px] font-semibold text-[#8C5E2D]">
                            {row.cohorte}
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Domaine : Badge sobre en ivoire */}
                    <td className="px-3 py-2.5">
                      <span
                        title={getDomaineFullName(row.domaine)}
                        className="line-clamp-2 inline-flex items-center rounded-lg border border-[#EFE4D6] bg-[#FAF7F2] px-2.5 py-1 text-xs font-medium text-[#612D10] leading-tight"
                      >
                        {getDomaineShortLabel(row.domaine)}
                      </span>
                    </td>

                    {/* Source : 13px avec typographie soignée */}
                    <td className="px-3 py-2.5">
                      <span
                        title={row.source}
                        className="line-clamp-2 text-[13px] font-medium text-[#21130D] leading-tight"
                      >
                        {row.source || "Fonds CIAT"}
                      </span>
                    </td>

                    {/* Date en format tabulaire, couleur secondaire */}
                    <td className="px-2 py-2.5 text-center text-xs font-mono font-medium text-[#6B5646] tabular-nums whitespace-nowrap">
                      {formatDate(row.date)}
                    </td>

                    {/* Statut : badge arrondi avec point indicateur */}
                    <td className="px-2 py-2.5 text-center whitespace-nowrap">
                      {getStatusBadge(row.statut, row.statut_display)}
                    </td>

                    {/* Montant : aligné à droite, sans-serif 14px poids 700, tabular-nums */}
                    <td className="px-4 py-2.5 text-right font-sans whitespace-nowrap">
                      <span className="text-[14px] font-bold text-[#21130D] tabular-nums">
                        {formatNumber(Number(row.montant) || 0)}
                      </span>
                      <span className="ml-1 text-[11px] font-normal text-[#8C6D4F]">
                        FCFA
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>

            {/* Ligne de total synthétique */}
            {filteredData.length > 0 && (
              <tfoot className="border-t-2 border-[#EFE4D6] bg-[#FAF7F2]">
                <tr className="h-12 font-semibold">
                  <td
                    colSpan={4}
                    className="px-4 text-[12px] uppercase tracking-[0.06em] text-[#612D10]"
                  >
                    Total des engagements filtrés ({filteredData.length} dossiers)
                  </td>
                  <td className="px-2 text-center text-[12px] text-[#8C6D4F]">
                    —
                  </td>
                  <td className="px-4 text-right font-sans whitespace-nowrap">
                    <span className="text-[15px] font-extrabold text-[#612D10] tabular-nums">
                      {formatNumber(totalAmount)}
                    </span>
                    <span className="ml-1 text-xs font-semibold text-[#8C5E2D]">
                      FCFA
                    </span>
                  </td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>

        {/* Pagination & Compteur */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 text-xs text-[#6B5646]">
          <div>
            Affichage de{" "}
            <strong className="text-[#21130D]">
              {filteredData.length > 0 ? (currentPage - 1) * pageSize + 1 : 0}
            </strong>{" "}
            à{" "}
            <strong className="text-[#21130D]">
              {Math.min(currentPage * pageSize, filteredData.length)}
            </strong>{" "}
            sur <strong className="text-[#21130D]">{data.length}</strong> conventions enregistrées
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
              disabled={currentPage === 1}
              aria-label="Page précédente"
              className="inline-flex h-8 items-center gap-1 rounded-lg border border-[#EFE4D6] bg-[#FAF7F2] px-2.5 text-[#21130D] transition hover:bg-white disabled:opacity-40"
            >
              <ChevronLeft className="h-4 w-4" />
              <span className="hidden sm:inline">Précédent</span>
            </button>

            {/* Boutons de pagination numérotés */}
            <div className="flex items-center gap-1">
              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter(
                  (p) =>
                    p === 1 ||
                    p === totalPages ||
                    Math.abs(p - currentPage) <= 1
                )
                .map((page, idx, arr) => {
                  const prevPage = arr[idx - 1];
                  const hasGap = prevPage && page - prevPage > 1;
                  const isActive = currentPage === page;

                  return (
                    <div key={page} className="flex items-center">
                      {hasGap && <span className="px-1 text-[#8C6D4F]">…</span>}
                      <button
                        type="button"
                        onClick={() => setCurrentPage(page)}
                        className={`h-8 min-w-[32px] rounded-lg px-2 text-xs transition-all ${
                          isActive
                            ? "bg-[#21130D] text-white shadow-xs font-bold"
                            : "border border-[#EFE4D6] bg-[#FAF7F2] text-[#6B5646] hover:bg-white hover:text-[#21130D] font-medium"
                        }`}
                      >
                        {page}
                      </button>
                    </div>
                  );
                })}
            </div>

            <button
              type="button"
              onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
              disabled={currentPage === totalPages}
              aria-label="Page suivante"
              className="inline-flex h-8 items-center gap-1 rounded-lg border border-[#EFE4D6] bg-[#FAF7F2] px-2.5 text-[#21130D] transition hover:bg-white disabled:opacity-40"
            >
              <span className="hidden sm:inline">Suivant</span>
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* 3. MODALE D'HISTORIQUE — SPLIT LAYOUT VIA REACT PORTAL (Plein écran sur mobile, 100% centrée au viewport) */}
      {mounted && isHistoryModalOpen && typeof document !== "undefined" && createPortal(
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="history-modal-title"
          className="fixed inset-0 z-[99999] flex items-center justify-center p-0 sm:p-5 md:p-6"
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            width: "100vw",
            height: "100vh",
            zIndex: 99999,
          }}
        >
          {/* Backdrop sombre flouté plein écran */}
          <div
            className="fixed inset-0 bg-[#21130D]/70 backdrop-blur-sm transition-opacity"
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
            }}
            onClick={() => setIsHistoryModalOpen(false)}
            aria-hidden="true"
          />

          {/* Carte modale centrée (plein écran sur mobile 390px, centrée sur desktop) */}
          <div
            ref={modalRef}
            className="relative z-10 flex flex-col w-full h-[100dvh] sm:h-[min(88vh,820px)] sm:max-w-6xl rounded-none sm:rounded-2xl border-0 sm:border border-[#EFE4D6] bg-white shadow-2xl overflow-hidden"
            style={{
              margin: "auto",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* En-tête de la modale */}
            <div className="flex items-center justify-between border-b border-[#EFE4D6] bg-[#FAF7F2] px-4 sm:px-5 py-3 sm:py-3.5 shrink-0">
              <div className="flex items-center gap-2.5 sm:gap-3 min-w-0 pr-2">
                <div className="flex h-9 w-9 sm:h-10 sm:w-10 shrink-0 items-center justify-center rounded-xl bg-white border border-[#EFE4D6] text-[#8C5E2D] shadow-xs">
                  <History className="h-5 w-5" aria-hidden="true" />
                </div>
                <div className="min-w-0">
                  <h3
                    id="history-modal-title"
                    className="text-sm sm:text-base font-bold text-[#21130D] tracking-tight truncate"
                  >
                    Historique chronologique des fonds
                  </h3>
                  <p className="text-[10px] sm:text-[11px] text-[#6B5646] truncate">
                    Grand livre des versements et décaissements
                  </p>
                </div>
              </div>

              <button
                id="close-history-modal-btn"
                type="button"
                onClick={() => setIsHistoryModalOpen(false)}
                className="inline-flex h-11 w-11 min-h-[44px] min-w-[44px] sm:h-9 sm:w-9 sm:min-h-0 sm:min-w-0 items-center justify-center rounded-xl border border-[#EFE4D6] bg-white text-[#6B5646] hover:bg-[#FAF7F2] hover:text-[#21130D] transition-colors cursor-pointer shrink-0"
                aria-label="Fermer la modale"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Corps split en 2 colonnes */}
            <div className="flex flex-col md:flex-row flex-1 overflow-hidden min-h-0">

              {/* ═══════ PANNEAU GAUCHE : Filtres + Graphiques ═══════ */}
              <div className="w-full md:w-[380px] lg:w-[420px] shrink-0 border-b md:border-b-0 md:border-r border-[#EFE4D6] bg-[#FAF7F2]/40 flex flex-col overflow-y-auto">

                {/* Filtres */}
                <div className="p-4 space-y-3 border-b border-[#EFE4D6]">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {[
                      { key: "all", label: "Toutes", count: data.length },
                      { key: "decaisse", label: "Décaissés", count: statusCounts.decaisse },
                      { key: "accorde", label: "Accordés", count: statusCounts.accorde },
                      { key: "instruction", label: "Instruction", count: statusCounts.instruction },
                    ].map((tab) => {
                      const isActive = historyFilter === tab.key;
                      return (
                        <button
                          key={tab.key}
                          type="button"
                          onClick={() => setHistoryFilter(tab.key as HistoryFilterType)}
                          className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-[11px] transition-all cursor-pointer ${
                            isActive
                              ? "bg-[#21130D] text-white shadow-xs font-semibold"
                              : "border border-[#EFE4D6] bg-white text-[#6B5646] hover:bg-[#FAF7F2] hover:text-[#21130D]"
                          }`}
                        >
                          <span>{tab.label}</span>
                          <span
                            className={`rounded-full px-1.5 text-[9px] tabular-nums font-bold ${
                              isActive
                                ? "bg-white/20 text-white"
                                : "bg-[#FAF7F2] text-[#8C5E2D]"
                            }`}
                          >
                            {tab.count}
                          </span>
                        </button>
                      );
                    })}
                  </div>

                  {/* Sous-total */}
                  <div className="rounded-xl border border-[#EFE4D6] bg-white px-3.5 py-2.5">
                    <span className="text-[10px] text-[#6B5646] uppercase tracking-wider font-semibold block">
                      Sous-total sélectionné
                    </span>
                    <span className="font-sans text-lg font-black text-[#612D10] tabular-nums">
                      {formatNumber(historyTotalAmount)}{" "}
                      <span className="text-xs font-normal text-[#8C5E2D]">FCFA</span>
                    </span>
                  </div>
                </div>

                {/* Diagramme en barres — Flux par mois */}
                <div className="p-3.5 border-b border-[#EFE4D6]">
                  <div className="flex items-center gap-1.5 mb-2">
                    <TrendingUp className="h-3.5 w-3.5 text-[#8C5E2D]" />
                    <span className="text-[10px] font-bold text-[#612D10] uppercase tracking-wider">
                      Flux par mois (diagramme en barres)
                    </span>
                  </div>
                  {barChartData.length >= 1 ? (
                    <div style={{ width: "100%", height: 145, minHeight: 145 }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={barChartData} margin={{ top: 2, right: 6, left: -22, bottom: 0 }}>
                          <XAxis
                            dataKey="mois"
                            tick={{ fontSize: 9, fill: "#8C6D4F" }}
                            axisLine={false}
                            tickLine={false}
                            interval={0}
                            angle={-45}
                            textAnchor="end"
                            height={34}
                          />
                          <YAxis
                            tick={{ fontSize: 8, fill: "#A08B7A" }}
                            axisLine={false}
                            tickLine={false}
                            tickFormatter={(v: number) => {
                              if (v >= 1_000_000_000) return `${(v / 1_000_000_000).toFixed(1)}G`;
                              if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(0)}M`;
                              if (v >= 1_000) return `${(v / 1_000).toFixed(0)}k`;
                              return String(v);
                            }}
                          />
                          <RechartsTooltip
                            contentStyle={{
                              background: "#21130D",
                              border: "none",
                              borderRadius: 10,
                              padding: "8px 12px",
                              fontSize: 11,
                              color: "#FAF7F2",
                              boxShadow: "0 4px 20px rgba(33,19,13,0.3)",
                            }}
                            formatter={(value: number) => [
                              `${formatNumber(value)} FCFA`,
                              "Montant",
                            ]}
                            labelStyle={{ color: "#C99A68", fontWeight: 600, fontSize: 10 }}
                            cursor={{ fill: "#8C5E2D", opacity: 0.08 }}
                          />
                          <Bar
                            dataKey="montant"
                            fill="#8C5E2D"
                            radius={[4, 4, 0, 0]}
                            maxBarSize={26}
                          />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  ) : (
                    <div className="py-4 text-center text-[11px] text-[#8C6D4F]">
                      Aucune donnée disponible
                    </div>
                  )}
                </div>

                {/* Diagramme anneau — Répartition par statut */}
                <div className="p-3.5 shrink-0">
                  <div className="flex items-center gap-1.5 mb-2">
                    <CheckCircle2 className="h-3.5 w-3.5 text-[#8C5E2D]" />
                    <span className="text-[10px] font-bold text-[#612D10] uppercase tracking-wider">
                      Répartition par statut (anneau)
                    </span>
                  </div>
                  {donutData.length > 0 ? (
                    <div className="flex items-center gap-3">
                      <div style={{ width: 105, height: 105, minHeight: 105 }} className="shrink-0">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={donutData}
                              cx="50%"
                              cy="50%"
                              innerRadius={26}
                              outerRadius={46}
                              paddingAngle={3}
                              dataKey="value"
                              strokeWidth={0}
                            >
                              {donutData.map((entry, index) => (
                                <Cell
                                  key={`cell-${index}`}
                                  fill={entry.color}
                                  style={{ filter: "drop-shadow(0 1px 2px rgba(0,0,0,0.1))" }}
                                />
                              ))}
                            </Pie>
                            <RechartsTooltip
                              contentStyle={{
                                background: "#21130D",
                                border: "none",
                                borderRadius: 10,
                                padding: "6px 10px",
                                fontSize: 11,
                                color: "#FAF7F2",
                                boxShadow: "0 4px 20px rgba(33,19,13,0.3)",
                              }}
                              formatter={(value: number) => [
                                `${formatNumber(value)} FCFA`,
                              ]}
                            />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                      {/* Légende */}
                      <div className="flex flex-col gap-1 flex-1 min-w-0">
                        {donutData.map((entry) => (
                          <div key={entry.name} className="flex items-center gap-2">
                            <span
                              className="h-2 w-2 rounded-full shrink-0"
                              style={{ backgroundColor: entry.color }}
                            />
                            <div className="flex-1 min-w-0">
                              <span className="text-[10px] font-medium text-[#21130D] block truncate">
                                {entry.name}
                              </span>
                              <span className="text-[9px] text-[#8C6D4F] tabular-nums font-semibold">
                                {formatNumber(entry.value)} FCFA
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="py-4 text-center text-[11px] text-[#8C6D4F]">
                      Aucune donnée disponible
                    </div>
                  )}
                </div>
              </div>

              {/* ═══════ PANNEAU DROIT : Historique chronologique ═══════ */}
              <div className="flex-1 flex flex-col overflow-hidden min-w-0 bg-white">
                {/* En-tête du panneau historique */}
                <div className="shrink-0 px-5 py-3 border-b border-[#EFE4D6] bg-white">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-[#612D10] uppercase tracking-wider">
                      Chronologie des opérations
                    </span>
                    <span className="text-[11px] text-[#8C6D4F] tabular-nums">
                      {historyTimelineData.length} opérations
                    </span>
                  </div>
                </div>

                {/* Liste scrollable */}
                <div className="flex-1 overflow-y-auto p-4 space-y-2.5">
                  {historyTimelineData.length === 0 ? (
                    <div className="py-16 text-center text-xs text-[#6B5646]">
                      <Clock className="h-8 w-8 text-[#8C5E2D]/40 mx-auto mb-2" />
                      <p className="font-semibold text-[#21130D]">
                        Aucun flux financier enregistré pour ce statut.
                      </p>
                    </div>
                  ) : (
                    historyTimelineData.map((op, idx) => {
                      const s = (op.statut || "").toLowerCase();
                      const isDecaisse = s.includes("decaisse") || s.includes("paye");
                      const isAccorde = s.includes("accorde") || s.includes("valide");

                      return (
                        <div
                          key={op.id || idx}
                          className="group flex items-start justify-between gap-3 rounded-xl border border-[#EFE4D6] bg-white p-3 transition-all hover:border-[#8C5E2D]/40 hover:bg-[#FAF7F2]/40 hover:shadow-2xs"
                        >
                          {/* Bloc gauche : Infos */}
                          <div className="space-y-1 flex-1 min-w-0">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="inline-flex items-center gap-1 rounded-md border border-[#EFE4D6] bg-[#FAF7F2] px-1.5 py-0.5 font-mono text-[10px] font-semibold text-[#612D10]">
                                <Calendar className="h-2.5 w-2.5 text-[#8C5E2D]" />
                                {formatDate(op.date)}
                              </span>
                              {getStatusBadge(op.statut, op.statut_display)}
                            </div>

                            <div className="font-semibold text-[13px] text-[#21130D] group-hover:text-[#8C5E2D] transition-colors leading-snug truncate">
                              {op.projet_titre}
                            </div>

                            <div className="flex items-center gap-1.5 text-[11px] text-[#6B5646] truncate">
                              <span className="truncate">{op.porteur_nom || "Non renseigné"}</span>
                              <span className="text-[#C99A68]">·</span>
                              <span className="truncate font-medium text-[#612D10]">{op.source || "Fonds CIAT"}</span>
                            </div>
                          </div>

                          {/* Bloc droite : Montant */}
                          <div className="text-right shrink-0 pl-2">
                            <span className="text-[10px] text-[#8C6D4F] block">
                              {isDecaisse ? "Décaissé" : isAccorde ? "Accordé" : "Sollicité"}
                            </span>
                            <div
                              className={`font-sans text-sm font-black tabular-nums ${
                                isDecaisse ? "text-[#1E5222]" : "text-[#21130D]"
                              }`}
                            >
                              {formatNumber(Number(op.montant) || 0)}
                            </div>
                            <span className="text-[9px] font-medium text-[#8C5E2D]">FCFA</span>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>

            {/* Pied de la modale */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-[#EFE4D6] bg-[#FAF7F2] px-4 sm:px-5 py-3 text-xs text-[#6B5646] shrink-0">
              <span className="text-[11px] sm:text-xs">
                Total : <strong className="text-[#21130D]">{historyTimelineData.length} opérations</strong> répertoriées au grand livre
              </span>

              <button
                type="button"
                onClick={() => setIsHistoryModalOpen(false)}
                className="w-full sm:w-auto min-h-[44px] rounded-xl bg-[#21130D] px-5 py-2.5 text-xs font-semibold text-white shadow-xs hover:bg-[#3D2314] active:scale-95 transition-all cursor-pointer flex items-center justify-center"
              >
                Fermer l&apos;historique
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
