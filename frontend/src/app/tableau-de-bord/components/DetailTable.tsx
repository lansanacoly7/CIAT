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

interface DetailTableProps {
  data: FinancementItem[];
  isLoading?: boolean;
}

type SortField = "projet_titre" | "porteur_nom" | "source" | "montant" | "date" | "statut";
type SortDirection = "asc" | "desc";

export function DetailTable({ data, isLoading = false }: DetailTableProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStatut, setSelectedStatut] = useState<string>("all");
  const [sortField, setSortField] = useState<SortField>("date");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");
  const [pageSize, setPageSize] = useState<number>(10);
  const [currentPage, setCurrentPage] = useState<number>(1);

  // Vérifier si une seule cohorte est présente
  const uniqueCohortes = useMemo(() => {
    const set = new Set(data.map((item) => item.cohorte).filter(Boolean));
    return Array.from(set);
  }, [data]);
  const showCohorteCol = uniqueCohortes.length > 1;

  // Filtrage
  const filteredData = useMemo(() => {
    return data.filter((item) => {
      const matchesSearch =
        item.projet_titre?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.porteur_nom?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.source?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.domaine?.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStatut =
        selectedStatut === "all" ||
        item.statut?.toLowerCase() === selectedStatut.toLowerCase();

      return matchesSearch && matchesStatut;
    });
  }, [data, searchTerm, selectedStatut]);

  // Tri
  const sortedData = useMemo(() => {
    return [...filteredData].sort((a, b) => {
      let aVal = a[sortField];
      let bVal = b[sortField];

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

  const getStatusBadge = (statut?: string, statutDisplay?: string) => {
    const s = statut?.toLowerCase() || "";
    const label = statutDisplay || statut || "Inconnu";

    if (s.includes("decaisse") || s.includes("paye") || s.includes("debloque")) {
      return (
        <span className="inline-flex w-24 justify-center items-center rounded-md bg-[#5A7D65]/15 px-2 py-1 text-xs font-semibold text-[#3B5442]">
          {label}
        </span>
      );
    }
    if (s.includes("accorde") || s.includes("valide") || s.includes("signe")) {
      return (
        <span className="inline-flex w-24 justify-center items-center rounded-md bg-[#C99A68]/20 px-2 py-1 text-xs font-semibold text-[#8C5E2D]">
          {label}
        </span>
      );
    }
    if (s.includes("retard") || s.includes("bloque") || s.includes("rejete")) {
      return (
        <span className="inline-flex w-24 justify-center items-center rounded-md bg-[#B85D43]/15 px-2 py-1 text-xs font-semibold text-[#8B3B26]">
          {label}
        </span>
      );
    }
    return (
      <span className="inline-flex w-24 justify-center items-center rounded-md bg-[#8C7E74]/15 px-2 py-1 text-xs font-semibold text-[#574C45]">
        {label}
      </span>
    );
  };

  return (
    <div className="rounded-2xl border border-[rgba(60,35,20,0.08)] bg-white p-5 shadow-[0_1px_2px_rgba(60,35,20,0.04),0_8px_24px_rgba(60,35,20,0.05)] space-y-4">
      {/* Barre d'outils du tableau : Recherche + Filtres Statut Rapides + PageSize */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[rgba(60,35,20,0.06)] pb-4">
        {/* Recherche */}
        <div className="relative min-w-[240px] flex-1 max-w-sm">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-[#8C7E74]" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            placeholder="Rechercher un projet, porteur, guichet..."
            className="w-full h-9 rounded-xl border border-[rgba(60,35,20,0.12)] bg-[#FBF8F3] pl-9 pr-3 text-xs font-medium text-[#21130D] placeholder:text-[#8C7E74] transition focus:border-[#C99A68] focus:bg-white focus:outline-hidden"
          />
        </div>

        {/* Filtres rapides statut */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {[
            { key: "all", label: "Tous" },
            { key: "accorde", label: "Accordés" },
            { key: "decaisse", label: "Décaissés" },
            { key: "en_attente", label: "En attente" },
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
                  : "bg-[#FBF8F3] text-[#8C7E74] hover:bg-[#C99A68]/15 hover:text-[#21130D]"
              }`}
            >
              {pill.label}
            </button>
          ))}
        </div>

        {/* Sélecteur de pagination (10 / 25 / 50) */}
        <div className="flex items-center gap-2 text-xs text-[#8C7E74]">
          <span>Lignes par page :</span>
          <select
            value={pageSize}
            onChange={(e) => {
              setPageSize(Number(e.target.value));
              setCurrentPage(1);
            }}
            className="h-8 rounded-lg border border-[rgba(60,35,20,0.12)] bg-[#FBF8F3] px-2 text-xs font-semibold text-[#21130D] focus:border-[#C99A68] focus:outline-hidden"
          >
            <option value={10}>10</option>
            <option value={25}>25</option>
            <option value={50}>50</option>
          </select>
        </div>
      </div>

      {/* Conteneur de table avec Sticky Header */}
      <div className="relative overflow-x-auto rounded-xl border border-[rgba(60,35,20,0.06)]">
        <table className="w-full text-left text-xs">
          <thead className="sticky top-0 z-10 border-b border-[rgba(60,35,20,0.08)] bg-[#FBF8F3] shadow-xs">
            <tr className="h-11">
              <th
                onClick={() => handleSort("projet_titre")}
                className="cursor-pointer px-4 font-semibold uppercase tracking-[0.06em] text-[#8C7E74] hover:text-[#21130D]"
              >
                <div className="flex items-center gap-1.5">
                  <span>Projet & Porteur</span>
                  <ArrowUpDown className="h-3 w-3 text-[#C99A68]" />
                </div>
              </th>

              {showCohorteCol && (
                <th className="px-4 font-semibold uppercase tracking-[0.06em] text-[#8C7E74]">
                  Cohorte
                </th>
              )}

              <th className="px-4 font-semibold uppercase tracking-[0.06em] text-[#8C7E74]">
                Domaine
              </th>

              <th
                onClick={() => handleSort("source")}
                className="cursor-pointer px-4 font-semibold uppercase tracking-[0.06em] text-[#8C7E74] hover:text-[#21130D]"
              >
                <div className="flex items-center gap-1.5">
                  <span>Source / Guichet</span>
                  <ArrowUpDown className="h-3 w-3 text-[#C99A68]" />
                </div>
              </th>

              <th
                onClick={() => handleSort("date")}
                className="cursor-pointer px-4 font-semibold uppercase tracking-[0.06em] text-[#8C7E74] hover:text-[#21130D]"
              >
                <div className="flex items-center gap-1.5">
                  <span>Date d&apos;attribution</span>
                  <ArrowUpDown className="h-3 w-3 text-[#C99A68]" />
                </div>
              </th>

              <th className="px-4 text-center font-semibold uppercase tracking-[0.06em] text-[#8C7E74]">
                Statut
              </th>

              <th
                onClick={() => handleSort("montant")}
                className="cursor-pointer px-4 text-right font-semibold uppercase tracking-[0.06em] text-[#8C7E74] hover:text-[#21130D]"
              >
                <div className="flex items-center justify-end gap-1.5">
                  <span>Montant (FCFA)</span>
                  <ArrowUpDown className="h-3 w-3 text-[#C99A68]" />
                </div>
              </th>
            </tr>
          </thead>

          <tbody className="divide-y divide-[rgba(60,35,20,0.04)]">
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i} className="h-14 animate-pulse">
                  <td colSpan={7} className="px-4 py-3">
                    <div className="h-4 w-3/4 rounded bg-[rgba(60,35,20,0.06)]" />
                  </td>
                </tr>
              ))
            ) : paginatedData.length === 0 ? (
              <tr className="h-28 text-center text-[#8C7E74]">
                <td colSpan={7}>Aucun enregistrement ne correspond aux filtres.</td>
              </tr>
            ) : (
              paginatedData.map((row) => (
                <tr
                  key={row.id}
                  className="group relative h-14 transition-colors hover:bg-[#FBF8F3]"
                >
                  <td className="px-4">
                    <div className="font-semibold text-[#21130D] group-hover:text-[#612D10]">
                      {row.projet_titre || "Projet CIAT"}
                    </div>
                    <div className="text-[11px] text-[#8C7E74]">
                      {row.porteur_nom || "Porteur non renseigné"}
                    </div>
                  </td>

                  {showCohorteCol && (
                    <td className="px-4 text-[#8C7E74] tabular-nums">
                      {row.cohorte || "—"}
                    </td>
                  )}

                  <td className="px-4">
                    <span className="rounded-md bg-[#FBF8F3] border border-[rgba(60,35,20,0.08)] px-2 py-0.5 text-[11px] font-medium text-[#21130D]">
                      {row.domaine || "Général"}
                    </span>
                  </td>

                  <td className="px-4 font-medium text-[#21130D]">
                    {row.source || "Fonds CIAT"}
                  </td>

                  <td className="px-4 text-[#8C7E74] tabular-nums">
                    {formatDate(row.date)}
                  </td>

                  <td className="px-4 text-center">
                    {getStatusBadge(row.statut, row.statut_display)}
                  </td>

                  {/* Montant aligné à droite en tabular-nums */}
                  <td className="px-4 text-right font-serif text-sm font-bold text-[#21130D] tabular-nums">
                    {formatNumber(Number(row.montant) || 0)}
                  </td>
                </tr>
              ))
            )}
          </tbody>

          {/* Ligne de total synthétique */}
          {filteredData.length > 0 && (
            <tfoot className="border-t-2 border-[rgba(60,35,20,0.12)] bg-[#FBF8F3]">
              <tr className="h-12 font-semibold">
                <td
                  colSpan={showCohorteCol ? 5 : 4}
                  className="px-4 text-xs uppercase tracking-[0.06em] text-[#8C7E74]"
                >
                  Total des engagements filtrés ({filteredData.length} dossiers)
                </td>
                <td className="px-4 text-center text-xs text-[#8C7E74]">
                  Consolidé
                </td>
                <td className="px-4 text-right font-serif text-sm font-bold text-[#21130D] tabular-nums">
                  {formatNumber(totalAmount)}
                </td>
              </tr>
            </tfoot>
          )}
        </table>
      </div>

      {/* Pagination & Compteur x sur 50 */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-1 text-xs text-[#8C7E74]">
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
            className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-[rgba(60,35,20,0.12)] bg-[#FBF8F3] text-[#21130D] transition hover:bg-white disabled:opacity-40"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
