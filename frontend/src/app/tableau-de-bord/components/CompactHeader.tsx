"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import {
  Download,
  FileSpreadsheet,
  FileText,
  Image as ImageIcon,
  Printer,
  RefreshCw,
  MessageSquare,
  BookOpen,
  MoreHorizontal,
} from "lucide-react";
import { API_URL } from "@/lib/api";
import type { DashboardFilters } from "../types";

interface CompactHeaderProps {
  lastUpdated?: string;
  isLive?: boolean;
  isLoading: boolean;
  onRefresh: () => void;
  onOpenAiDrawer: () => void;
  onOpenPrintModal: () => void;
  filters: DashboardFilters;
  targetCaptureId?: string;
}

export function CompactHeader({
  isLoading,
  onRefresh,
  onOpenAiDrawer,
  onOpenPrintModal,
  filters,
  targetCaptureId = "dashboard-main-content",
}: CompactHeaderProps) {
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [isMoreOpen, setIsMoreOpen] = useState(false);
  const [isExporting, setIsExporting] = useState<string | null>(null);
  const exportMenuRef = useRef<HTMLDivElement>(null);
  const moreMenuRef = useRef<HTMLDivElement>(null);

  // Fermeture des menus au clic extérieur
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        exportMenuRef.current &&
        !exportMenuRef.current.contains(event.target as Node)
      ) {
        setIsExportOpen(false);
      }
      if (
        moreMenuRef.current &&
        !moreMenuRef.current.contains(event.target as Node)
      ) {
        setIsMoreOpen(false);
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
      const target =
        document.getElementById(targetCaptureId) ||
        document.getElementById("dashboard-capture-zone") ||
        document.getElementById("dashboard-root") ||
        document.body;
      const html2canvas = (await import("html2canvas")).default;
      let canvas: HTMLCanvasElement;
      try {
        canvas = await html2canvas(target, {
          scale: 1.5,
          useCORS: true,
          backgroundColor: "#FBF8F3",
          logging: false,
        });
      } catch (cloneErr) {
        console.warn("html2canvas parsing fallback triggered:", cloneErr);
        const canvasFallback = document.createElement("canvas");
        canvasFallback.width = 1200;
        canvasFallback.height = 800;
        const ctx = canvasFallback.getContext("2d");
        if (ctx) {
          ctx.fillStyle = "#FBF8F3";
          ctx.fillRect(0, 0, 1200, 800);
          ctx.fillStyle = "#612D10";
          ctx.font = "bold 24px sans-serif";
          ctx.fillText("Tableau de bord — Centre d'Innovation, d'Application et de Transfert (CIAT)", 40, 60);
          ctx.font = "16px sans-serif";
          ctx.fillStyle = "#666666";
          ctx.fillText(`Export analytique consolidé — ${new Date().toLocaleDateString("fr-FR")}`, 40, 95);
        }
        canvas = canvasFallback;
      }
      const blob = await new Promise<Blob | null>((resolve) =>
        canvas.toBlob(resolve, "image/png")
      );
      if (!blob) throw new Error("Erreur génération image PNG");
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `ciat_tableau_de_bord_${new Date()
        .toISOString()
        .slice(0, 10)}.png`;
      document.body.appendChild(a);
      a.click();
      setTimeout(() => {
        a.remove();
        window.URL.revokeObjectURL(url);
      }, 500);
    } catch (err) {
      console.error("Export PNG failed:", err);
    } finally {
      setIsExporting(null);
      setIsExportOpen(false);
    }
  };

  return (
    <header className="sticky top-0 z-40 h-16 flex items-center justify-between border-b border-[rgba(60,35,20,0.08)] bg-white/95 px-4 sm:px-6 backdrop-blur-md">
      {/* Titre éditorial épuré */}
      <div className="flex items-center min-w-0">
        <h1 className="font-serif text-xl sm:text-[28px] font-normal font-[500] text-[#21130D] tracking-tight whitespace-nowrap">
          Tableau de bord
        </h1>
      </div>

      {/* 3 actions visibles au plus : Actualiser, Exporter, Menu ⋯ */}
      <div className="flex items-center gap-2 sm:gap-2.5">
        {/* Action 1 : Actualiser */}
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

        {/* Action 2 : Menu Exporter */}
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
                id="export-pdf-button"
                onClick={handleExportPdf}
                disabled={isExporting !== null}
                className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-xs font-medium text-[#21130D] transition hover:bg-[#FBF8F3] disabled:opacity-60"
              >
                {isExporting === "pdf" ? (
                  <RefreshCw className="h-4 w-4 animate-spin text-[#B85D43]" />
                ) : (
                  <FileText className="h-4 w-4 text-[#B85D43]" />
                )}
                <div className="flex-1">
                  <div>{isExporting === "pdf" ? "Génération PDF en cours..." : "Rapport PDF officiel"}</div>
                  <div className="text-[11px] text-[#5A4B42]">Document certifié A4</div>
                </div>
              </button>

              <button
                type="button"
                id="export-xlsx-button"
                onClick={handleExportXlsx}
                disabled={isExporting !== null}
                className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-xs font-medium text-[#21130D] transition hover:bg-[#FBF8F3] disabled:opacity-60"
              >
                {isExporting === "xlsx" ? (
                  <RefreshCw className="h-4 w-4 animate-spin text-[#5A7D65]" />
                ) : (
                  <FileSpreadsheet className="h-4 w-4 text-[#5A7D65]" />
                )}
                <div className="flex-1">
                  <div>{isExporting === "xlsx" ? "Génération Excel en cours..." : "Tableur Excel (.xlsx)"}</div>
                  <div className="text-[11px] text-[#5A4B42]">Données brutes & agrégats</div>
                </div>
              </button>

              <button
                type="button"
                id="export-png-button"
                onClick={handleExportPng}
                disabled={isExporting !== null}
                className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-xs font-medium text-[#21130D] transition hover:bg-[#FBF8F3] disabled:opacity-60"
              >
                {isExporting === "png" ? (
                  <RefreshCw className="h-4 w-4 animate-spin text-[#4A6B82]" />
                ) : (
                  <ImageIcon className="h-4 w-4 text-[#4A6B82]" />
                )}
                <div className="flex-1">
                  <div>{isExporting === "png" ? "Capture image en cours..." : "Image haute résolution (PNG)"}</div>
                  <div className="text-[11px] text-[#5A4B42]">Capture de la vue active</div>
                </div>
              </button>

              <div className="my-1 border-t border-[rgba(60,35,20,0.06)]" />

              <button
                type="button"
                id="export-print-button"
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

        {/* Action 3 : Menu « ⋯ » (Méthodologie & Poser une question) */}
        <div className="relative" ref={moreMenuRef}>
          <button
            type="button"
            id="more-menu-button"
            onClick={() => setIsMoreOpen(!isMoreOpen)}
            aria-label="Plus d'actions"
            title="Options et outils complémentaires"
            className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-[rgba(60,35,20,0.08)] bg-white text-[#3D2314] transition hover:bg-[#FBF8F3] hover:border-[rgba(60,35,20,0.16)] active:scale-95"
          >
            <MoreHorizontal className="h-4 w-4 text-[#5A4B42]" />
          </button>

          {isMoreOpen && (
            <div className="absolute right-0 mt-2 w-52 origin-top-right rounded-2xl border border-[rgba(60,35,20,0.08)] bg-white p-1.5 shadow-[0_8px_24px_rgba(60,35,20,0.12)] z-50 animate-fade-in-up">
              <Link
                href="/tableau-de-bord/methodologie"
                onClick={() => setIsMoreOpen(false)}
                className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-xs font-medium text-[#21130D] transition hover:bg-[#FBF8F3]"
              >
                <BookOpen className="h-4 w-4 text-[#8C5E2D]" />
                <div>
                  <div className="font-semibold">Méthodologie</div>
                  <div className="text-[11px] text-[#5A4B42]">Définitions et calculs</div>
                </div>
              </Link>

              <button
                type="button"
                id="open-ai-drawer"
                onClick={() => {
                  setIsMoreOpen(false);
                  onOpenAiDrawer();
                }}
                className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-xs font-medium text-[#21130D] transition hover:bg-[#FBF8F3]"
              >
                <MessageSquare className="h-4 w-4 text-[#C99A68]" />
                <div>
                  <div className="font-semibold">Poser une question</div>
                  <div className="text-[11px] text-[#5A4B42]">Interrogation analytique</div>
                </div>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
