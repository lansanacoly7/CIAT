"use client";

import { useState } from "react";
import {
  Filter,
  RotateCcw,
  ChevronDown,
  ChevronUp,
  Calendar,
  Layers,
  Activity,
  Clock,
  SlidersHorizontal,
  RefreshCw,
  Download,
} from "lucide-react";
import type { DashboardFilters } from "../types";
import { COHORTE_OPTIONS, DOMAINE_OPTIONS, STATUT_OPTIONS } from "../mockData";

interface FiltersBarProps {
  filters: DashboardFilters;
  onChange: (newFilters: DashboardFilters) => void;
  onReset: () => void;
  isFiltered: boolean;
  onRefresh?: () => void;
  isLoading?: boolean;
  onExport?: () => void;
}

export function FiltersBar({
  filters,
  onChange,
  onReset,
  isFiltered,
  onRefresh,
  isLoading,
  onExport,
}: FiltersBarProps) {
  const [isOpenMobile, setIsOpenMobile] = useState(false);

  const handleFieldChange = (field: keyof DashboardFilters, value: string) => {
    onChange({
      ...filters,
      [field]: value || undefined,
    });
  };

  return (
    <div className="rounded-2xl border border-zinc-200/90 bg-white p-5 shadow-[0_1px_3px_rgba(0,0,0,0.02),0_6px_16px_rgba(33,19,13,0.03)] transition-all">
      {/* En-tête de la barre de filtres avec actions */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="flex h-6 w-6 items-center justify-center rounded-md bg-[#f8f1e7] text-[#602d10]">
            <SlidersHorizontal className="h-3.5 w-3.5" strokeWidth={1.75} />
          </div>
          <span className="text-xs font-bold uppercase tracking-wider text-zinc-700">
            Filtres décisionnels
          </span>
          {isFiltered && (
            <span className="inline-flex items-center rounded-full bg-[#f8f1e7] px-2 py-0.5 text-[10px] font-semibold text-[#602d10]">
              Filtres actifs
            </span>
          )}
        </div>

        {/* Groupe de boutons d'action : Réinitialiser + Actualiser + Exporter */}
        <div className="flex items-center gap-2">
          {isFiltered && (
            <button
              type="button"
              onClick={onReset}
              className="group inline-flex items-center gap-1.5 rounded-xl border border-zinc-200 bg-white px-2.5 py-1.5 text-xs font-medium text-zinc-600 shadow-2xs transition-all hover:border-[#602d10] hover:bg-[#602d10] hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#c99a69]"
              title="Réinitialiser tous les filtres"
            >
              <RotateCcw className="h-3 w-3 transition-transform duration-300 group-hover:-rotate-90" strokeWidth={1.5} />
              <span>Réinitialiser</span>
            </button>
          )}

          {onRefresh && (
            <button
              type="button"
              onClick={onRefresh}
              disabled={isLoading}
              className="group inline-flex items-center gap-1.5 rounded-xl border border-zinc-200/90 bg-white px-3 py-1.5 text-xs font-semibold text-zinc-700 shadow-2xs transition-all hover:border-[#602d10] hover:bg-zinc-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#c99a69] disabled:opacity-50"
              title="Rafraîchir les métriques"
            >
              <RefreshCw
                className={`h-3 w-3 text-zinc-500 transition-transform group-hover:rotate-180 duration-500 ${
                  isLoading ? "animate-spin" : ""
                }`}
                strokeWidth={1.75}
              />
              <span>Actualiser</span>
            </button>
          )}

          {onExport && (
            <button
              type="button"
              onClick={onExport}
              className="inline-flex items-center gap-1.5 rounded-xl bg-[#c99a69] px-3.5 py-1.5 text-xs font-semibold text-[#21130d] shadow-xs transition-all hover:bg-[#b88958] hover:shadow-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#c99a69]"
              title="Exporter la synthèse (T3)"
            >
              <Download className="h-3 w-3" strokeWidth={1.75} />
              <span>Exporter</span>
            </button>
          )}
        </div>
      </div>

      {/* Bouton mobile pour replier/déplier */}
      <div className="flex items-center justify-between md:hidden">
        <button
          type="button"
          onClick={() => setIsOpenMobile(!isOpenMobile)}
          className="inline-flex w-full items-center justify-between rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-xs font-medium text-zinc-700"
          aria-expanded={isOpenMobile}
        >
          <div className="flex items-center gap-2">
            <Filter className="h-3.5 w-3.5 text-zinc-500" strokeWidth={1.5} />
            <span>Options de filtrage</span>
          </div>
          {isOpenMobile ? (
            <ChevronUp className="h-3.5 w-3.5 text-zinc-400" />
          ) : (
            <ChevronDown className="h-3.5 w-3.5 text-zinc-400" />
          )}
        </button>
      </div>

      {/* Grille des 5 champs de filtres */}
      <div
        className={`${
          isOpenMobile ? "mt-4 block" : "hidden"
        } grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid md:grid-cols-5 md:gap-3.5`}
      >
        {/* 1. Cohorte */}
        <div>
          <label
            htmlFor="filter-cohorte"
            className="flex items-center gap-1.5 text-[11px] font-medium text-zinc-600"
          >
            <Calendar className="h-3 w-3 text-zinc-400" strokeWidth={1.5} />
            <span>Cohorte</span>
          </label>
          <select
            id="filter-cohorte"
            value={filters.cohorte ?? ""}
            onChange={(e) => handleFieldChange("cohorte", e.target.value)}
            className="mt-1 block w-full rounded-lg border border-zinc-200 bg-zinc-50/60 px-3 py-2 text-xs text-zinc-800 transition-all hover:bg-white focus:border-[#c99a69] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#c99a69]/20"
          >
            <option value="">Toutes les cohortes</option>
            {COHORTE_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        {/* 2. Domaine prioritaire */}
        <div>
          <label
            htmlFor="filter-domaine"
            className="flex items-center gap-1.5 text-[11px] font-medium text-zinc-600"
          >
            <Layers className="h-3 w-3 text-zinc-400" strokeWidth={1.5} />
            <span>Domaine prioritaire</span>
          </label>
          <select
            id="filter-domaine"
            value={filters.domaine ?? ""}
            onChange={(e) => handleFieldChange("domaine", e.target.value)}
            className="mt-1 block w-full rounded-lg border border-zinc-200 bg-zinc-50/60 px-3 py-2 text-xs text-zinc-800 transition-all hover:bg-white focus:border-[#c99a69] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#c99a69]/20"
          >
            <option value="">Tous les domaines</option>
            {DOMAINE_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        {/* 3. Statut */}
        <div>
          <label
            htmlFor="filter-statut"
            className="flex items-center gap-1.5 text-[11px] font-medium text-zinc-600"
          >
            <Activity className="h-3 w-3 text-zinc-400" strokeWidth={1.5} />
            <span>Statut du projet</span>
          </label>
          <select
            id="filter-statut"
            value={filters.statut ?? ""}
            onChange={(e) => handleFieldChange("statut", e.target.value)}
            className="mt-1 block w-full rounded-lg border border-zinc-200 bg-zinc-50/60 px-3 py-2 text-xs text-zinc-800 transition-all hover:bg-white focus:border-[#c99a69] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#c99a69]/20"
          >
            <option value="">Tous les statuts</option>
            {STATUT_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        {/* 4. Période Début */}
        <div>
          <label
            htmlFor="filter-debut"
            className="flex items-center gap-1.5 text-[11px] font-medium text-zinc-600"
          >
            <Clock className="h-3 w-3 text-zinc-400" strokeWidth={1.5} />
            <span>Période début</span>
          </label>
          <input
            type="date"
            id="filter-debut"
            value={filters.debut ?? ""}
            onChange={(e) => handleFieldChange("debut", e.target.value)}
            className="mt-1 block w-full rounded-lg border border-zinc-200 bg-zinc-50/60 px-3 py-1.5 text-xs text-zinc-800 transition-all hover:bg-white focus:border-[#c99a69] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#c99a69]/20"
          />
        </div>

        {/* 5. Période Fin */}
        <div>
          <label
            htmlFor="filter-fin"
            className="flex items-center gap-1.5 text-[11px] font-medium text-zinc-600"
          >
            <Clock className="h-3 w-3 text-zinc-400" strokeWidth={1.5} />
            <span>Période fin</span>
          </label>
          <input
            type="date"
            id="filter-fin"
            value={filters.fin ?? ""}
            onChange={(e) => handleFieldChange("fin", e.target.value)}
            className="mt-1 block w-full rounded-lg border border-zinc-200 bg-zinc-50/60 px-3 py-1.5 text-xs text-zinc-800 transition-all hover:bg-white focus:border-[#c99a69] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#c99a69]/20"
          />
        </div>
      </div>
    </div>
  );
}
