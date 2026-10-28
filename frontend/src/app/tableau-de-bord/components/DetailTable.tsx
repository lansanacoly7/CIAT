"use client";

import { useMemo, useState } from "react";
import {
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  Search,
} from "lucide-react";
import type { FinancementItem } from "../types";
import { formatDate, formatNumber } from "@/lib/format";
import { getDomaineShortLabel, getDomaineFullName } from "@/lib/domaines";

interface DetailTableProps {
  data: FinancementItem[];
  isLoading?: boolean;
}

type SortField = "projet_titre" | "domaine" | "source" | "date" | "statut" | "montant";
type SortDirection = "asc" | "desc";

export function DetailTable({ data, isLoading = false }: DetailTableProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStatut, setSelectedStatut] = useState<string>("all");
  const [sortField, setSortField] = useState<SortField>("date");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");
  const [pageSize, setPageSize] = useState<number>(10);
  const [currentPage, setCurrentPage] = useState<number>(1);

  // Filtrage
  const filteredData = useMemo(() => {
    return data.filter((item) => {
      const matchesSearch =
        item.projet_titre?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.porteur_nom?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.source?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.domaine?.toLowerCase().includes(searchTerm.toLowerCase());

      const s = (item.statut || "").toLowerCase();
      let matchesStatut = selectedStatut === "all";
      if (selectedStatut === "decaisse") matchesStatut = s.includes("decaisse");
      else if (selectedStatut === "accorde") matchesStatut = s.includes("accorde");
      else if (selectedStatut === "instruction") matchesStatut = s.includes("cours") || s.includes("instruction");
      else if (selectedStatut === "attente") matchesStatut = s.includes("attente") || s.includes("discussion");

      return matchesSearch && matchesStatut;
    });
  }, [data, searchTerm, selectedStatut]);

  // Tri
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

  // Somme totale des montants filtrés
  const totalAmount = useMemo(() => {
    return filteredData.reduce((acc, item) => acc + (Number(item.montant) || 0), 0);
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

  // Badge statut : min 96px, une ligne, libellés courts
  const getStatusBadge = (statut?: string, statutDisplay?: string) => {
    const s = statut?.toLowerCase() || "";
    const tooltip = statutDisplay || statut || "Inconnu";

    if (s.includes("decaisse") || s.includes("paye")) {
      return (
        <span
          title={tooltip}
          className="inline-flex min-w-[96px] justify-center items-center rounded-md bg-[#5A7D65]/15 px-2 py-0.5 text-[11px] font-medium text-[#3B5442] whitespace-nowrap"
        >
          Décaissé
        </span>
      );
    }
    if (s.includes("accorde") || s.includes("valide")) {
      return (
        <span
          title={tooltip}
          className="inline-flex min-w-[96px] justify-center items-center rounded-md bg-[#C99A68]/20 px-2 py-0.5 text-[11px] font-medium text-[#8C5E2D] whitespace-nowrap"
        >
          Accordé
        </span>
      );
    }
    if (s.includes("cours") || s.includes("instruction")) {
      return (
        <span
          title={tooltip}
          className="inline-flex min-w-[96px] justify-center items-center rounded-md bg-[#4A6B82]/15 px-2 py-0.5 text-[11px] font-medium text-[#2F4D61] whitespace-nowrap"
        >
          En instruction
        </span>
      );
    }
    return (
      <span
        title={tooltip}
        className="inline-flex min-w-[96px] justify-center items-center rounded-md bg-[#5A4B42]/12 px-2 py-0.5 text-[11px] font-medium text-[#574C45] whitespace-nowrap"
      >
        En attente
      </span>
    );
  };

  return (
    <div className="rounded-xl border border-[rgba(60,35,20,0.08)] bg-white p-4 sm:p-5 space-y-4">
      {/* Barre d'outils du tableau : Recherche + Filtres Statut Rapides + PageSize */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[rgba(60,35,20,0.06)] pb-4">
        {/* Recherche */}
        <div className="relative min-w-[240px] flex-1 max-w-sm">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-[#5A4B42]" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            aria-label="Rechercher par projet, porteur ou guichet"
            placeholder="Rechercher un projet, porteur, guichet..."
            className="w-full h-9 rounded-xl border border-[rgba(60,35,20,0.12)] bg-[#FBF8F3] pl-9 pr-3 text-xs font-medium text-[#21130D] placeholder:text-[#5A4B42] transition focus:border-[#C99A68] focus:bg-white focus:outline-hidden"
          />
        </div>

        {/* Filtres rapides statut */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {[
            { key: "all", label: "Tous" },
            { key: "decaisse", label: "Décaissés" },
            { key: "accorde", label: "Accordés" },
            { key: "instruction", label: "En instruction" },
            { key: "attente", label: "En attente" },
          ].map((pill) => (
            <button
              key={pill.key}
              type="button"
              onClick={() => {
                setSelectedStatut(pill.key);
                setCurrentPage(1);
              }}
              className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition ${
                selectedStatut === pill.key
                  ? "bg-[#21130D] text-[#FBF8F3]"
                  : "bg-[#FBF8F3] text-[#5A4B42] hover:bg-[#C99A68]/15 hover:text-[#21130D]"
              }`}
            >
              {pill.label}
            </button>
          ))}
        </div>

        {/* Sélecteur de pagination (10 / 25 / 50) */}
        <div className="flex items-center gap-2 text-xs text-[#5A4B42]">
          <span>Lignes par page :</span>
          <select
            value={pageSize}
            onChange={(e) => {
              setPageSize(Number(e.target.value));
              setCurrentPage(1);
            }}
            aria-label="Nombre de lignes par page"
            className="h-8 rounded-lg border border-[rgba(60,35,20,0.12)] bg-[#FBF8F3] px-2 text-xs font-semibold text-[#21130D] focus:border-[#C99A68] focus:outline-hidden"
          >
            <option value={10}>10</option>
            <option value={25}>25</option>
            <option value={50}>50</option>
          </select>
        </div>
      </div>

      {/* Table avec mise en page stricte : table-layout: fixed, largeurs proportionnelles, min-w-[820px] avec défilement fluide */}
      <div className="relative overflow-x-auto rounded-xl border border-[#EFE4D6] bg-white shadow-2xs">
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
                  <span>Projet</span>
                  <ArrowUpDown
                    className={`h-3 w-3 text-[#C99A68] transition-opacity ${
                      sortField === "projet_titre"
                        ? "opacity-100"
                        : "opacity-0 group-hover/th:opacity-100"
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
                        ? "opacity-100"
                        : "opacity-0 group-hover/th:opacity-100"
                    }`}
                  />
                </div>
              </th>

              <th
                onClick={() => handleSort("source")}
                className="group/th cursor-pointer px-3 font-bold uppercase tracking-[0.06em] text-[#612D10] hover:text-[#8C5E2D] whitespace-nowrap text-[11px]"
              >
                <div className="flex items-center gap-1.5">
                  <span>Source</span>
                  <ArrowUpDown
                    className={`h-3 w-3 text-[#C99A68] transition-opacity ${
                      sortField === "source"
                        ? "opacity-100"
                        : "opacity-0 group-hover/th:opacity-100"
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
                        ? "opacity-100"
                        : "opacity-0 group-hover/th:opacity-100"
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
                        ? "opacity-100"
                        : "opacity-0 group-hover/th:opacity-100"
                    }`}
                  />
                </div>
              </th>

              <th
                onClick={() => handleSort("montant")}
                className="group/th cursor-pointer px-3 text-right font-bold uppercase tracking-[0.06em] text-[#612D10] hover:text-[#8C5E2D] whitespace-nowrap text-[11px]"
              >
                <div className="flex items-center justify-end gap-1">
                  <span>Montant (FCFA)</span>
                  <ArrowUpDown
                    className={`h-3 w-3 text-[#C99A68] transition-opacity ${
                      sortField === "montant"
                        ? "opacity-100"
                        : "opacity-0 group-hover/th:opacity-100"
                    }`}
                  />
                </div>
              </th>
            </tr>
          </thead>

          <tbody className="divide-y divide-[rgba(60,35,20,0.04)]">
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i} className="h-[60px] animate-pulse">
                  <td colSpan={6} className="px-4 py-3">
                    <div className="h-4 w-3/4 rounded bg-[rgba(60,35,20,0.06)]" />
                  </td>
                </tr>
              ))
            ) : paginatedData.length === 0 ? (
              <tr className="h-28 text-center text-[#5A4B42]">
                <td colSpan={6}>Aucun enregistrement ne correspond aux filtres.</td>
              </tr>
            ) : (
              paginatedData.map((row) => (
                <tr
                  key={row.id}
                  className="group relative h-[60px] transition-colors hover:bg-[#FBF8F3]/60"
                >
                  {/* Projet : Nom en clamp 2 lignes 14px 500 avec tooltip + porteur et cohorte en secondaire 12px */}
                  <td className="px-4 py-2">
                    <div
                      title={row.projet_titre}
                      className="line-clamp-2 text-[14px] font-[500] text-[#21130D] leading-tight group-hover:text-[#612D10]"
                    >
                      {row.projet_titre || "Projet CIAT"}
                    </div>
                    <div className="truncate text-[12px] text-[#5A4B42] mt-0.5">
                      {row.porteur_nom || "Porteur non renseigné"}
                      {row.cohorte ? ` · ${row.cohorte}` : ""}
                    </div>
                  </td>

                  {/* Domaine : libellé normalisé avec line-clamp-2 pour éviter toute troncature avec points de suspension */}
                  <td className="px-3 py-2">
                    <span
                      title={getDomaineFullName(row.domaine)}
                      className="line-clamp-2 text-[13px] text-[#5A4B42] leading-tight block"
                    >
                      {getDomaineShortLabel(row.domaine)}
                    </span>
                  </td>

                  {/* Source : 13px, clamp 2 lignes avec tooltip */}
                  <td className="px-3 py-2">
                    <span
                      title={row.source}
                      className="line-clamp-2 text-[13px] text-[#21130D] leading-tight"
                    >
                      {row.source || "Fonds CIAT"}
                    </span>
                  </td>

                  {/* Date en jj/mm/aaaa, couleur secondaire */}
                  <td className="px-2 py-2 text-center text-[12px] text-[#5A4B42] tabular-nums whitespace-nowrap">
                    {formatDate(row.date)}
                  </td>

                  {/* Statut : badge min 96px, une ligne */}
                  <td className="px-2 py-2 text-center whitespace-nowrap">
                    {getStatusBadge(row.statut, row.statut_display)}
                  </td>

                  {/* Montant : aligné à droite, sans-serif 14px poids 600, tabular-nums */}
                  <td className="px-3 py-2 text-right font-sans text-[14px] font-semibold text-[#21130D] tabular-nums whitespace-nowrap">
                    {formatNumber(Number(row.montant) || 0)}
                  </td>
                </tr>
              ))
            )}
          </tbody>

          {/* Ligne de total synthétique : 472 000 000 */}
          {filteredData.length > 0 && (
            <tfoot className="border-t-2 border-[rgba(60,35,20,0.12)] bg-[#FBF8F3]">
              <tr className="h-12 font-semibold">
                <td
                  colSpan={4}
                  className="px-4 text-[12px] uppercase tracking-[0.06em] text-[#5A4B42]"
                >
                  Total des engagements filtrés ({filteredData.length} dossiers)
                </td>
                <td className="px-2 text-center text-[12px] text-[#5A4B42]">
                  —
                </td>
                <td className="px-3 text-right font-sans text-[14px] font-semibold text-[#21130D] tabular-nums whitespace-nowrap">
                  {formatNumber(totalAmount)}
                </td>
              </tr>
            </tfoot>
          )}
        </table>
      </div>

      {/* Pagination & Compteur */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-1 text-xs text-[#5A4B42]">
        <div>
          Affichage de{" "}
          <strong className="text-[#21130D]">
            {filteredData.length > 0 ? (currentPage - 1) * pageSize + 1 : 0}
          </strong>{" "}
          à{" "}
          <strong className="text-[#21130D]">
            {Math.min(currentPage * pageSize, filteredData.length)}
          </strong>{" "}
          sur <strong className="text-[#21130D]">{data.length}</strong> financements
        </div>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
            disabled={currentPage === 1}
            aria-label="Page précédente"
            className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-[rgba(60,35,20,0.12)] bg-[#FBF8F3] text-[#21130D] transition hover:bg-white disabled:opacity-40"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>

          <span className="px-2 font-medium">
            Page {currentPage} sur {totalPages}
          </span>

          <button
            type="button"
            onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
            disabled={currentPage === totalPages}
            aria-label="Page suivante"
            className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-[rgba(60,35,20,0.12)] bg-[#FBF8F3] text-[#21130D] transition hover:bg-white disabled:opacity-40"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
