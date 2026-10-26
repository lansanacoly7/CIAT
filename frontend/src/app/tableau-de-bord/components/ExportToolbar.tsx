"use client";

import { useState } from "react";
import { Camera, FileSpreadsheet, FileText, Loader2, Printer } from "lucide-react";
import html2canvas from "html2canvas";
import { API_URL } from "@/lib/api";
import type { DashboardFilters } from "../types";

interface ExportToolbarProps {
  filters: DashboardFilters;
  onOpenPrintModal: () => void;
  targetCaptureId?: string;
}

function buildQuery(filters: DashboardFilters, format?: "xlsx" | "pdf"): string {
  const params = new URLSearchParams();
  if (format) params.set("format", format);
  if (filters.debut) params.set("debut", filters.debut);
  if (filters.fin) params.set("fin", filters.fin);
  if (filters.cohorte) params.set("cohorte", filters.cohorte);
  if (filters.domaine) params.set("domaine", filters.domaine);
  if (filters.statut) params.set("statut", filters.statut);
  const str = params.toString();
  return str ? `?${str}` : "";
}

async function downloadBinary(path: string, fallbackFilename: string) {
  const token = typeof window !== "undefined" ? localStorage.getItem("ciat_access") : null;
  const headers = new Headers();
  if (token) headers.set("Authorization", `Bearer ${token}`);

  const res = await fetch(`${API_URL}${path}`, {
    method: "GET",
    headers,
  });

  if (!res.ok) {
    let errorMsg = "Erreur lors de la génération de l'export.";
    try {
      const err = await res.json();
      if (err.detail) errorMsg = err.detail;
    } catch {
      // ignore
    }
    throw new Error(errorMsg);
  }

  const blob = await res.blob();
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;

  const disposition = res.headers.get("content-disposition");
  let filename = fallbackFilename;
  if (disposition && disposition.includes("filename=")) {
    const match = disposition.match(/filename="?([^";]+)"?/);
    if (match && match[1]) filename = match[1];
  }

  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.URL.revokeObjectURL(url);
}

export function ExportToolbar({
  filters,
  onOpenPrintModal,
  targetCaptureId = "dashboard-main-content",
}: ExportToolbarProps) {
  const [isExportingPng, setIsExportingPng] = useState(false);
  const [isExportingXlsx, setIsExportingXlsx] = useState(false);
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const showFeedback = (type: "success" | "error", text: string) => {
    setStatusMessage({ type, text });
    setTimeout(() => {
      setStatusMessage(null);
    }, 4500);
  };

  const handleExportPng = async () => {
    try {
      setIsExportingPng(true);
      const targetEl = document.getElementById(targetCaptureId);
      if (!targetEl) {
        throw new Error("Zone de tableau de bord introuvable pour la capture.");
      }

      // Capture haute résolution
      const canvas = await html2canvas(targetEl, {
        scale: 2,
        useCORS: true,
        backgroundColor: "#FDFCFB",
        logging: false,
        ignoreElements: (element) => element.classList.contains("no-capture"),
      });

      const dataUrl = canvas.toDataURL("image/png");
      const a = document.createElement("a");
      a.href = dataUrl;
      const ts = new Date().toISOString().replace(/[-:T]/g, "").slice(0, 14);
      a.download = `ciat_tableau_de_bord_${ts}.png`;
      document.body.appendChild(a);
      a.click();
      a.remove();

      showFeedback("success", "Capture PNG téléchargée avec succès.");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Erreur lors de la capture d'image.";
      showFeedback("error", msg);
    } finally {
      setIsExportingPng(false);
    }
  };

  const handleExportExcel = async () => {
    try {
      setIsExportingXlsx(true);
      const query = buildQuery(filters, "xlsx");
      const ts = new Date().toISOString().replace(/[-:T]/g, "").slice(0, 14);
      await downloadBinary(`/analytics/export/${query}`, `ciat_synthese_analytics_${ts}.xlsx`);
      showFeedback("success", "Export Excel (.xlsx) téléchargé avec succès.");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Erreur lors de l'export Excel.";
      showFeedback("error", msg);
    } finally {
      setIsExportingXlsx(false);
    }
  };

  const handleExportPdf = async () => {
    try {
      setIsExportingPdf(true);
      const query = buildQuery(filters, "pdf");
      const ts = new Date().toISOString().replace(/[-:T]/g, "").slice(0, 14);
      await downloadBinary(`/analytics/export/${query}`, `ciat_synthese_analytics_${ts}.pdf`);
      showFeedback("success", "Export PDF téléchargé avec succès.");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Erreur lors de l'export PDF.";
      showFeedback("error", msg);
    } finally {
      setIsExportingPdf(false);
    }
  };

  return (
    <div className="flex flex-col gap-2 no-capture">
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3 sm:p-4 rounded-xl border border-ciat-sand/30 shadow-xs">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-ciat-terracotta" />
          <span className="text-xs font-semibold uppercase tracking-wider text-ciat-terracotta">
            Exports & Synthèses
          </span>
          <span className="hidden sm:inline-block text-xs text-ciat-dark/70">
            • Respecte les filtres actifs
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Bouton Fiche de synthèse imprimable */}
          <button
            type="button"
            onClick={onOpenPrintModal}
            className="inline-flex items-center gap-2 px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-ciat-sand/20 hover:bg-ciat-sand/40 text-ciat-brown border border-ciat-sand/40 transition-colors shadow-2xs cursor-pointer"
            title="Consulter et imprimer la fiche de synthèse officielle"
          >
            <Printer className="w-3.5 h-3.5 text-ciat-brown" />
            <span>Fiche de synthèse imprimable</span>
          </button>

          {/* Bouton Export PNG (navigateur) */}
          <button
            type="button"
            disabled={isExportingPng}
            onClick={handleExportPng}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-white hover:bg-ciat-sand/15 text-ciat-dark border border-ciat-sand/40 transition-colors disabled:opacity-50 shadow-2xs cursor-pointer"
            title="Capturer le tableau de bord en image PNG"
          >
            {isExportingPng ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin text-ciat-terracotta" />
            ) : (
              <Camera className="w-3.5 h-3.5 text-ciat-terracotta" />
            )}
            <span>Image PNG</span>
          </button>

          {/* Bouton Export Excel */}
          <button
            type="button"
            disabled={isExportingXlsx}
            onClick={handleExportExcel}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-white hover:bg-emerald-50 text-emerald-800 border border-emerald-200 transition-colors disabled:opacity-50 shadow-2xs cursor-pointer"
            title="Télécharger l'ensemble des données au format Excel"
          >
            {isExportingXlsx ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-600" />
            ) : (
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
            )}
            <span>Excel (.xlsx)</span>
          </button>

          {/* Bouton Export PDF */}
          <button
            type="button"
            disabled={isExportingPdf}
            onClick={handleExportPdf}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-white hover:bg-red-50 text-red-800 border border-red-200 transition-colors disabled:opacity-50 shadow-2xs cursor-pointer"
            title="Générer et télécharger le rapport officiel au format PDF"
          >
            {isExportingPdf ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin text-red-600" />
            ) : (
              <FileText className="w-3.5 h-3.5 text-red-600" />
            )}
            <span>PDF officiel</span>
          </button>
        </div>
      </div>

      {statusMessage && (
        <div
          className={`text-xs px-3 py-2 rounded-lg border transition-all ${
            statusMessage.type === "success"
              ? "bg-emerald-50 text-emerald-800 border-emerald-200"
              : "bg-red-50 text-red-800 border-red-200"
          }`}
        >
          {statusMessage.text}
        </div>
      )}
    </div>
  );
}
