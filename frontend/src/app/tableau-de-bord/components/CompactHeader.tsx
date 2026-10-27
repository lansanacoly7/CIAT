"use client";

import { useState, useRef, useEffect } from "react";
import {
  Download,
  FileSpreadsheet,
  FileText,
  Image as ImageIcon,
  Printer,
  RefreshCw,
  Sparkles,
} from "lucide-react";
import { API_URL } from "@/lib/api";
import type { DashboardFilters } from "../types";

interface CompactHeaderProps {
  lastUpdated?: string;
  isLive: boolean;
  isLoading: boolean;
  onRefresh: () => void;
  onOpenAiDrawer: () => void;
  onOpenPrintModal: () => void;
  filters: DashboardFilters;
  targetCaptureId?: string;
}

export function CompactHeader({
  lastUpdated = "en direct",
  isLive,
  isLoading,
  onRefresh,
  onOpenAiDrawer,
  onOpenPrintModal,
  filters,
  targetCaptureId = "dashboard-main-content",
}: CompactHeaderProps) {
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [isExporting, setIsExporting] = useState<string | null>(null);
  const exportMenuRef = useRef<HTMLDivElement>(null);

  // Fermeture du menu au clic extérieur
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        exportMenuRef.current &&
        !exportMenuRef.current.contains(event.target as Node)
      ) {
        setIsExportOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const buildQuery = () => {
    const params = new URLSearchParams();
    if (filters.debut) params.set("debut", filters.debut);
    if (filters.fin) params.set("fin", filters.fin);
    if (filters.cohorte) params.set("cohorte", filters.cohorte);
    if (filters.domaine) params.set("domaine", filters.domaine);
    if (filters.statut) params.set("statut", filters.statut);
    const str = params.toString();
    return str ? `?${str}` : "";
  };

  const handleExportPdf = async () => {
    try {
      setIsExporting("pdf");
      const token =
        typeof window !== "undefined"
          ? localStorage.getItem("ciat_access")
          : null;
      const headers = new Headers();
      if (token) headers.set("Authorization", `Bearer ${token}`);
      const query = buildQuery();
      const res = await fetch(
        `${API_URL}/analytics/export/?format=pdf${
          query ? `&${query.slice(1)}` : ""
        }`,
        { headers }
      );
      if (!res.ok) throw new Error("Erreur export PDF");
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `ciat_rapport_officiel_${new Date()
        .toISOString()
        .slice(0, 10)}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Export PDF failed:", err);
    } finally {
      setIsExporting(null);
      setIsExportOpen(false);
    }
  };

  const handleExportXlsx = async () => {
    try {
      setIsExporting("xlsx");
      const token =
        typeof window !== "undefined"
          ? localStorage.getItem("ciat_access")
          : null;
      const headers = new Headers();
      if (token) headers.set("Authorization", `Bearer ${token}`);
      const query = buildQuery();
      const res = await fetch(
        `${API_URL}/analytics/export/?format=xlsx${
          query ? `&${query.slice(1)}` : ""
        }`,
        { headers }
      );
      if (!res.ok) throw new Error("Erreur export Excel");
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `ciat_donnees_consolidees_${new Date()
        .toISOString()
        .slice(0, 10)}.xlsx`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Export Excel failed:", err);
    } finally {
      setIsExporting(null);
      setIsExportOpen(false);
    }
  };

  const handleExportPng = async () => {
    try {
      setIsExporting("png");
      const target = document.getElementById(targetCaptureId);
      if (!target) return;
      const html2canvas = (await import("html2canvas")).default;
      const canvas = await html2canvas(target, {
        scale: 2,
        useCORS: true,
        backgroundColor: "#FBF8F3",
      });
      const dataUrl = canvas.toDataURL("image/png");
      const a = document.createElement("a");
      a.href = dataUrl;
      a.download = `ciat_tableau_de_bord_${new Date()
        .toISOString()
        .slice(0, 10)}.png`;
      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch (err) {
      console.error("Export PNG failed:", err);
    } finally {
      setIsExporting(null);
      setIsExportOpen(false);
    }
  };

  return (
    <header className="h-16 flex items-center justify-between border-b border-[rgba(60,35,20,0.08)] bg-white/60 px-4 sm:px-6 backdrop-blur-xs">
      {/* Titre éditorial en serif */}
      <div className="flex items-center gap-2 sm:gap-3 min-w-0">
        <h1 className="font-serif text-xl sm:text-[28px] font-bold text-[#21130D] tracking-tight whitespace-nowrap">
          Tableau de bord
        </h1>
        <span className="hidden md:inline-block text-xs font-semibold uppercase tracking-[0.06em] text-[#5A4B42] bg-[#FBF8F3] px-2.5 py-1 rounded-full border border-[rgba(60,35,20,0.06)]">
          Décisionnel CIAT
        </span>
      </div>

      {/* Actions et contrôles à droite */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Badge Données en direct avec point vert pulsant */}
        <div
          className="flex items-center gap-2 rounded-full border border-[rgba(60,35,20,0.08)] bg-white px-3 py-1 text-xs text-[#3D2314] shadow-[0_1px_2px_rgba(60,35,20,0.04)]"
          title={`Données connectées (${lastUpdated})`}
        >
          <span className="relative flex h-2 w-2">
            {isLive && (
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
            )}
            <span
              className={`relative inline-flex h-2 w-2 rounded-full ${
                isLive ? "bg-emerald-500" : "bg-amber-500"
              }`}
            />
          </span>
          <span className="hidden sm:inline font-medium">
            {isLive ? "Données en direct" : "Données simulées"}
          </span>
          <span className="text-[11px] text-[#5A4B42] hidden lg:inline">
            · {lastUpdated}
          </span>
        </div>

        {/* Bouton Actualiser */}
        <button
          type="button"
          onClick={onRefresh}
          disabled={isLoading}
          aria-label="Actualiser les données"
          title="Actualiser les indicateurs"
          className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-[rgba(60,35,20,0.08)] bg-white text-[#3D2314] transition hover:bg-[#FBF8F3] hover:border-[rgba(60,35,20,0.16)] active:scale-95 disabled:opacity-50"
        >
          <RefreshCw
            className={`h-4 w-4 ${isLoading ? "animate-spin text-[#C99A68]" : ""}`}
          />
        </button>

        {/* Bouton Poser une question (Tiroir IA) */}
        <button
          type="button"
          id="open-ai-drawer"
          onClick={onOpenAiDrawer}
          className="inline-flex items-center gap-1.5 rounded-xl border border-[#C99A68]/30 bg-white px-2.5 sm:px-3.5 py-1.5 text-xs font-semibold text-[#21130D] shadow-[0_1px_2px_rgba(60,35,20,0.04)] transition hover:bg-[#FBF8F3] hover:border-[#C99A68] active:scale-95"
          title="Poser une question en langage naturel"
        >
          <Sparkles className="h-3.5 w-3.5 text-[#C99A68]" />
          <span className="hidden sm:inline">Poser une question</span>
        </button>

        {/* Menu Exporter Unique */}
        <div className="relative" ref={exportMenuRef}>
          <button
            type="button"
            id="export-menu-button"
            onClick={() => setIsExportOpen(!isExportOpen)}
            className="inline-flex items-center gap-1.5 rounded-xl bg-[#21130D] px-2.5 sm:px-3.5 py-1.5 text-xs font-semibold text-[#FBF8F3] shadow-[0_1px_2px_rgba(60,35,20,0.1)] transition hover:bg-[#3D2314] active:scale-95"
            title="Exporter les données"
          >
            <Download className="h-3.5 w-3.5 text-[#C99A68]" />
            <span className="hidden sm:inline">Exporter</span>
          </button>

          {isExportOpen && (
            <div className="absolute right-0 mt-2 w-56 origin-top-right rounded-2xl border border-[rgba(60,35,20,0.08)] bg-white p-1.5 shadow-[0_8px_24px_rgba(60,35,20,0.12)] z-50 animate-fade-in-up">
              <div className="px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.06em] text-[#5A4B42]">
                Formats disponibles
              </div>

              <button
                type="button"
                onClick={handleExportPdf}
                disabled={isExporting !== null}
                className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-xs font-medium text-[#21130D] transition hover:bg-[#FBF8F3]"
              >
                <FileText className="h-4 w-4 text-[#B85D43]" />
                <div className="flex-1">
                  <div>Rapport PDF officiel</div>
                  <div className="text-[11px] text-[#5A4B42]">Document certifié A4</div>
                </div>
              </button>

              <button
                type="button"
                onClick={handleExportXlsx}
                disabled={isExporting !== null}
                className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-xs font-medium text-[#21130D] transition hover:bg-[#FBF8F3]"
              >
                <FileSpreadsheet className="h-4 w-4 text-[#5A7D65]" />
                <div className="flex-1">
                  <div>Tableur Excel (.xlsx)</div>
                  <div className="text-[11px] text-[#5A4B42]">Données brutes & agrégats</div>
                </div>
              </button>

              <button
                type="button"
                onClick={handleExportPng}
                disabled={isExporting !== null}
                className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-xs font-medium text-[#21130D] transition hover:bg-[#FBF8F3]"
              >
                <ImageIcon className="h-4 w-4 text-[#4A6B82]" />
                <div className="flex-1">
                  <div>Image haute résolution (PNG)</div>
                  <div className="text-[11px] text-[#5A4B42]">Capture de la vue active</div>
                </div>
              </button>

              <div className="my-1 border-t border-[rgba(60,35,20,0.06)]" />

              <button
                type="button"
                onClick={() => {
                  setIsExportOpen(false);
                  onOpenPrintModal();
                }}
                className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-xs font-medium text-[#21130D] transition hover:bg-[#FBF8F3]"
              >
                <Printer className="h-4 w-4 text-[#C99A68]" />
                <div className="flex-1">
                  <div>Fiche imprimable de synthèse</div>
                  <div className="text-[11px] text-[#5A4B42]">Aperçu avant impression</div>
                </div>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
