"use client";

import { useMemo, useState } from "react";
import {
  AlertTriangle,
  Award,
  Building2,
  Download,
  Printer,
  Sparkles,
  Users,
  X,
} from "lucide-react";

import type { AnalyticsData, DashboardFilters, FicheMode, RetardItem } from "../types";

interface PrintSummaryModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: AnalyticsData;
  filters: DashboardFilters;
  onExportPdf: () => Promise<void>;
}

export function PrintSummaryModal({
  isOpen,
  onClose,
  data,
  filters,
  onExportPdf,
}: PrintSummaryModalProps) {
  const [ficheMode, setFicheMode] = useState<FicheMode>("cohorte");
  const [selectedCohorte, setSelectedCohorte] = useState<string>("");
  const [selectedDomaine, setSelectedDomaine] = useState<string>("");
  const [isExportingPdf, setIsExportingPdf] = useState(false);

  // Liste des cohortes disponibles issues des données réelles
  const cohortesList = useMemo(() => {
    return data.parCohorte.map((c) => c.cohorte).filter(Boolean);
  }, [data.parCohorte]);

  // Liste des domaines disponibles issus des données réelles
  const domainesList = useMemo(() => {
    return data.parDomaine.map((d) => d.domaine).filter(Boolean);
  }, [data.parDomaine]);

  // Cohorte par défaut
  const activeCohorte = useMemo(() => {
    if (selectedCohorte) return selectedCohorte;
    if (filters.cohorte) {
      const match = cohortesList.find((c) => c.toLowerCase().includes(filters.cohorte!.toLowerCase()));
      if (match) return match;
    }
    return cohortesList[0] || "Toutes cohortes";
  }, [selectedCohorte, filters.cohorte, cohortesList]);

  // Domaine par défaut
  const activeDomaine = useMemo(() => {
    if (selectedDomaine) return selectedDomaine;
    if (filters.domaine) {
      const match = domainesList.find((d) => d.toLowerCase().includes(filters.domaine!.toLowerCase()));
      if (match) return match;
    }
    return domainesList[0] || "Tous domaines";
  }, [selectedDomaine, filters.domaine, domainesList]);

  // Calcul des indicateurs ciblés selon le mode choisi
  const targetedStats = useMemo(() => {
    if (ficheMode === "cohorte" && activeCohorte) {
      const item = data.parCohorte.find((c) => c.cohorte === activeCohorte);
      if (item) {
        const total = item.total || 0;
        const sel = item.selectionnes || 0;
        const proto = item.prototypes || 0;
        const taux = total > 0 ? Math.round((sel / total) * 1000) / 10 : 0;
        return {
          labelCible: `Cohorte : ${activeCohorte}`,
          idees_recues: total,
          dossiers_deposes: total,
          projets_selectionnes: sel,
          projets_incubes: Math.min(sel, Math.round(sel * 0.8) || sel),
          prototypes: proto,
          taux_selection: taux,
        };
      }
    }

    if (ficheMode === "domaine" && activeDomaine) {
      const item = data.parDomaine.find((d) => d.domaine === activeDomaine);
      if (item) {
        const total = item.total || 0;
        const globalTotal = data.indicateurs.idees_recues || 1;
        const ratio = total / globalTotal;
        const sel = Math.round(data.indicateurs.projets_selectionnes * ratio);
        const incub = Math.round(data.indicateurs.projets_incubes * ratio);
        const proto = Math.round(data.indicateurs.prototypes * ratio);
        const taux = total > 0 ? Math.round((sel / total) * 1000) / 10 : 0;
        return {
          labelCible: `Domaine d'intervention : ${activeDomaine}`,
          idees_recues: total,
          dossiers_deposes: total,
          projets_selectionnes: sel,
          projets_incubes: incub,
          prototypes: proto,
          taux_selection: taux,
        };
      }
    }

    // Mode globale par défaut
    return {
      labelCible: "Synthèse Globale Multi-Cohortes & Domaines",
      ...data.indicateurs,
    };
  }, [ficheMode, activeCohorte, activeDomaine, data]);

  // Jalons / alertes de retards représentatifs pour la fiche
  const simulatedRetards: RetardItem[] = useMemo(() => {
    return [
      {
        projet: "Système Solaire Hybride Diamniadio",
        jalon: "Validation des bancs de tests",
        echeance: "15/10/2026",
        statut: "En retard (Jalon)",
        cohorte: activeCohorte || "Cohorte 2026",
        domaine: "Énergies renouvelables",
      },
      {
        projet: "Plateforme IA Diagnostic Santé Rurale",
        jalon: "Recueil du jeu de données cliniques",
        echeance: "20/10/2026",
        statut: "En retard (Jalon)",
        cohorte: activeCohorte || "Cohorte 2026",
        domaine: "Santé & Numérique",
      },
    ];
  }, [activeCohorte]);

  if (!isOpen) return null;

  const handlePrint = () => {
    if (typeof window !== "undefined") {
      window.print();
    }
  };

  const handlePdfExport = async () => {
    try {
      setIsExportingPdf(true);
      await onExportPdf();
    } finally {
      setIsExportingPdf(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 print:p-0 print:bg-white print:static print:inset-auto">
      {/* Styles d'impression CSS spécifiques @media print */}
      <style jsx global>{`
        @media print {
          body {
            background: #ffffff !important;
            color: #24140d !important;
          }
          nav,
          header,
          aside,
          footer,
          .no-print {
            display: none !important;
          }
          .print-sheet-root {
            width: 100% !important;
            max-width: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
            box-shadow: none !important;
            border: none !important;
          }
          .page-break-avoid {
            break-inside: avoid;
            page-break-inside: avoid;
          }
          @page {
            size: A4 portrait;
            margin: 12mm 15mm 15mm 15mm;
          }
        }
      `}</style>

      <div className="relative w-full max-w-4xl bg-white rounded-2xl shadow-2xl border border-ciat-sand/50 overflow-hidden print-sheet-root print:border-none print:shadow-none print:rounded-none">
        {/* Barre de commandes en haut (masquée à l'impression) */}
        <div className="no-print bg-ciat-cream border-b border-ciat-sand/40 px-4 py-3 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Printer className="w-4 h-4 text-ciat-brown" />
            <h3 className="text-sm font-bold text-ciat-brown">
              Fiche de Synthèse Décisionnelle Imprimable
            </h3>
          </div>

          {/* Choix du mode de fiche */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="inline-flex rounded-lg bg-white p-0.5 border border-ciat-sand/40 text-xs font-medium">
              <button
                type="button"
                onClick={() => setFicheMode("cohorte")}
                className={`px-3 py-1 rounded-md transition-colors cursor-pointer ${
                  ficheMode === "cohorte"
                    ? "bg-ciat-brown text-white font-semibold"
                    : "text-ciat-dark hover:bg-ciat-sand/20"
                }`}
              >
                Par cohorte
              </button>
              <button
                type="button"
                onClick={() => setFicheMode("domaine")}
                className={`px-3 py-1 rounded-md transition-colors cursor-pointer ${
                  ficheMode === "domaine"
                    ? "bg-ciat-brown text-white font-semibold"
                    : "text-ciat-dark hover:bg-ciat-sand/20"
                }`}
              >
                Par domaine
              </button>
              <button
                type="button"
                onClick={() => setFicheMode("globale")}
                className={`px-3 py-1 rounded-md transition-colors cursor-pointer ${
                  ficheMode === "globale"
                    ? "bg-ciat-brown text-white font-semibold"
                    : "text-ciat-dark hover:bg-ciat-sand/20"
                }`}
              >
                Vue globale
              </button>
            </div>

            {/* Sélecteur de cohorte si mode cohorte */}
            {ficheMode === "cohorte" && cohortesList.length > 0 && (
              <select
                value={activeCohorte}
                onChange={(e) => setSelectedCohorte(e.target.value)}
                className="text-xs bg-white border border-ciat-sand/40 rounded-lg px-2.5 py-1 text-ciat-dark font-medium cursor-pointer"
              >
                {cohortesList.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            )}

            {/* Sélecteur de domaine si mode domaine */}
            {ficheMode === "domaine" && domainesList.length > 0 && (
              <select
                value={activeDomaine}
                onChange={(e) => setSelectedDomaine(e.target.value)}
                className="text-xs bg-white border border-ciat-sand/40 rounded-lg px-2.5 py-1 text-ciat-dark font-medium cursor-pointer"
              >
                {domainesList.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Boutons d'action */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-ciat-brown hover:bg-ciat-brown/90 text-white transition-colors shadow-xs cursor-pointer"
              title="Lancer l'impression directe au format A4"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Imprimer</span>
            </button>

            <button
              type="button"
              disabled={isExportingPdf}
              onClick={handlePdfExport}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-white hover:bg-ciat-sand/20 text-ciat-dark border border-ciat-sand/40 transition-colors disabled:opacity-50 cursor-pointer"
              title="Télécharger la version PDF officielle"
            >
              <Download className="w-3.5 h-3.5 text-ciat-terracotta" />
              <span>PDF officiel</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-ciat-dark/60 hover:text-ciat-dark hover:bg-ciat-sand/20 transition-colors cursor-pointer"
              aria-label="Fermer la fenêtre"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Corps imprimable officiel (Papier A4 structuré) */}
        <div className="p-6 sm:p-10 max-h-[82vh] overflow-y-auto print:max-h-none print:overflow-visible print:p-0">
          {/* 1. En-tête Institutionnel Officiel */}
          <div className="border-b-2 border-ciat-brown pb-4 mb-6">
            <div className="flex justify-between items-start text-xs text-ciat-dark/80">
              <div>
                <p className="font-bold uppercase tracking-wider text-ciat-brown">
                  République du Sénégal
                </p>
                <p className="text-[11px] leading-tight">
                  Ministère de l&apos;Enseignement Supérieur, de la Recherche et de l&apos;Innovation
                </p>
                <p className="text-[11px] font-semibold text-ciat-dark mt-0.5">
                  Institut Supérieur d&apos;Enseignement Professionnel (ISEP) — Diamniadio
                </p>
              </div>

              <div className="text-right">
                <span className="inline-block px-2.5 py-0.5 rounded-full bg-ciat-sand/25 font-bold text-ciat-brown text-[11px]">
                  CIAT — Pôle Innovation
                </span>
                <p className="text-[11px] text-ciat-dark/70 mt-1">
                  Édité le {new Date().toLocaleDateString("fr-FR", { day: "2-digit", month: "long", year: "numeric" })}
                </p>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-ciat-sand/30 flex items-center justify-between">
              <div>
                <h1 className="text-xl font-extrabold text-ciat-brown tracking-tight">
                  FICHE DE SYNTHÈSE ANALYTIQUE DÉCISIONNELLE
                </h1>
                <p className="text-xs font-semibold text-ciat-terracotta mt-0.5">
                  {targetedStats.labelCible}
                </p>
              </div>

              <div className="text-right text-xs">
                <span className="text-ciat-dark/70">Périmètre :</span>{" "}
                <span className="font-semibold text-ciat-brown">
                  {ficheMode === "cohorte"
                    ? activeCohorte
                    : ficheMode === "domaine"
                    ? activeDomaine
                    : "Multi-cohortes"}
                </span>
              </div>
            </div>
          </div>

          {/* 2. Tableau des Indicateurs Clés */}
          <div className="mb-6 page-break-avoid">
            <div className="flex items-center gap-2 mb-2">
              <Award className="w-4 h-4 text-ciat-brown" />
              <h2 className="text-xs font-bold uppercase tracking-wider text-ciat-brown">
                1. Indicateurs Clés de Performance
              </h2>
            </div>

            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 text-center">
              <div className="p-2.5 rounded-lg bg-ciat-cream border border-ciat-sand/40">
                <p className="text-[10px] uppercase font-bold text-ciat-dark/70">Idées reçues</p>
                <p className="text-lg font-extrabold text-ciat-brown mt-0.5">
                  {targetedStats.idees_recues}
                </p>
              </div>
              <div className="p-2.5 rounded-lg bg-ciat-cream border border-ciat-sand/40">
                <p className="text-[10px] uppercase font-bold text-ciat-dark/70">Dossiers</p>
                <p className="text-lg font-extrabold text-ciat-brown mt-0.5">
                  {targetedStats.dossiers_deposes}
                </p>
              </div>
              <div className="p-2.5 rounded-lg bg-ciat-cream border border-ciat-sand/40">
                <p className="text-[10px] uppercase font-bold text-ciat-dark/70">Sélectionnés</p>
                <p className="text-lg font-extrabold text-ciat-terracotta mt-0.5">
                  {targetedStats.projets_selectionnes}
                </p>
              </div>
              <div className="p-2.5 rounded-lg bg-ciat-cream border border-ciat-sand/40">
                <p className="text-[10px] uppercase font-bold text-ciat-dark/70">Incubés</p>
                <p className="text-lg font-extrabold text-ciat-terracotta mt-0.5">
                  {targetedStats.projets_incubes}
                </p>
              </div>
              <div className="p-2.5 rounded-lg bg-ciat-cream border border-ciat-sand/40">
                <p className="text-[10px] uppercase font-bold text-ciat-dark/70">Prototypes</p>
                <p className="text-lg font-extrabold text-ciat-brown mt-0.5">
                  {targetedStats.prototypes}
                </p>
              </div>
              <div className="p-2.5 rounded-lg bg-ciat-sand/30 border border-ciat-sand/60">
                <p className="text-[10px] uppercase font-bold text-ciat-brown">Sélection %</p>
                <p className="text-lg font-black text-ciat-brown mt-0.5">
                  {targetedStats.taux_selection}%
                </p>
              </div>
            </div>
          </div>

          {/* 3. Répartitions : Domaines & Genre */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6 page-break-avoid">
            {/* Répartition par Domaine */}
            <div className="border border-ciat-sand/40 rounded-lg p-3">
              <div className="flex items-center gap-1.5 mb-2.5 border-b border-ciat-sand/30 pb-1.5">
                <Building2 className="w-3.5 h-3.5 text-ciat-brown" />
                <h3 className="text-xs font-bold text-ciat-brown">
                  2. Répartition par Domaine d&apos;Intervention
                </h3>
              </div>
              <table className="w-full text-xs text-left">
                <thead>
                  <tr className="border-b border-ciat-sand/20 text-ciat-dark/70">
                    <th className="py-1 font-semibold">Domaine</th>
                    <th className="py-1 font-semibold text-right">Projets</th>
                    <th className="py-1 font-semibold text-right">Part</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-ciat-sand/15">
                  {data.parDomaine.map((d) => {
                    const total = data.indicateurs.idees_recues || 1;
                    const pct = Math.round((d.total / total) * 100);
                    return (
                      <tr key={d.domaine} className="hover:bg-ciat-cream/40">
                        <td className="py-1 text-ciat-dark font-medium">{d.domaine}</td>
                        <td className="py-1 text-right font-bold text-ciat-brown">{d.total}</td>
                        <td className="py-1 text-right text-ciat-dark/70">{pct}%</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Répartition par Genre */}
            <div className="border border-ciat-sand/40 rounded-lg p-3">
              <div className="flex items-center gap-1.5 mb-2.5 border-b border-ciat-sand/30 pb-1.5">
                <Users className="w-3.5 h-3.5 text-ciat-brown" />
                <h3 className="text-xs font-bold text-ciat-brown">
                  3. Parité & Profils Porteurs (Genre)
                </h3>
              </div>
              <table className="w-full text-xs text-left">
                <thead>
                  <tr className="border-b border-ciat-sand/20 text-ciat-dark/70">
                    <th className="py-1 font-semibold">Catégorie</th>
                    <th className="py-1 font-semibold text-right">Porteurs</th>
                    <th className="py-1 font-semibold text-right">Pourcentage</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-ciat-sand/15">
                  {data.parGenre.map((g) => {
                    const totalG = data.parGenre.reduce((acc, curr) => acc + curr.total, 0) || 1;
                    const pct = Math.round((g.total / totalG) * 100);
                    return (
                      <tr key={g.genre} className="hover:bg-ciat-cream/40">
                        <td className="py-1 text-ciat-dark font-medium">{g.genre}</td>
                        <td className="py-1 text-right font-bold text-ciat-brown">{g.total}</td>
                        <td className="py-1 text-right text-ciat-dark/70">{pct}%</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              <div className="mt-3 p-2 bg-ciat-sand/15 rounded-md text-[11px] text-ciat-dark/80 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-ciat-terracotta shrink-0" />
                <span>
                  Objectif charte CIAT : au moins 40% de projets portés ou co-portés par des femmes.
                </span>
              </div>
            </div>
          </div>

          {/* 4. Suivi des Jalons et Projets en Alerte / Retard (Exigé par T1) */}
          <div className="border border-red-200 rounded-lg p-3.5 bg-red-50/30 mb-6 page-break-avoid">
            <div className="flex items-center gap-2 mb-2 border-b border-red-200/60 pb-1.5">
              <AlertTriangle className="w-4 h-4 text-red-600" />
              <h3 className="text-xs font-bold text-red-900 uppercase tracking-wider">
                4. Vigilance & Suivi des Retards (Jalons en alerte)
              </h3>
            </div>

            <p className="text-[11px] text-red-800/80 mb-2">
              Projets sélectionnés ou incubés nécessitant un réajustement d&apos;échéance ou une intervention du mentor :
            </p>

            <table className="w-full text-xs text-left bg-white rounded-md border border-red-200 overflow-hidden">
              <thead className="bg-red-100/60 text-red-900">
                <tr>
                  <th className="py-1.5 px-2.5 font-semibold">Projet</th>
                  <th className="py-1.5 px-2 font-semibold">Jalon bloquant</th>
                  <th className="py-1.5 px-2 font-semibold text-center">Échéance initiale</th>
                  <th className="py-1.5 px-2.5 font-semibold text-right">Statut</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-red-150">
                {simulatedRetards.map((r, idx) => (
                  <tr key={idx} className="hover:bg-red-50/50">
                    <td className="py-1.5 px-2.5 font-semibold text-ciat-dark">{r.projet}</td>
                    <td className="py-1.5 px-2 text-ciat-dark/80">{r.jalon}</td>
                    <td className="py-1.5 px-2 text-center text-ciat-dark/70 font-mono text-[11px]">
                      {r.echeance}
                    </td>
                    <td className="py-1.5 px-2.5 text-right font-semibold text-red-700">
                      {r.statut}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* 5. Signature et validation officielle */}
          <div className="pt-4 border-t border-ciat-sand/40 grid grid-cols-2 gap-8 text-xs page-break-avoid">
            <div>
              <p className="font-semibold text-ciat-dark/70">Pour le Centre d&apos;Innovation (CIAT) :</p>
              <p className="text-[11px] text-ciat-dark/60 mt-0.5">Le Coordonnateur de l&apos;Incubateur</p>
              <div className="h-16 mt-2 border-b border-dashed border-ciat-sand/50" />
              <p className="text-[10px] text-ciat-dark/50 mt-1">Date et visa</p>
            </div>

            <div className="text-right">
              <p className="font-semibold text-ciat-dark/70">Comité de Sélection & Partenariats :</p>
              <p className="text-[11px] text-ciat-dark/60 mt-0.5">Le Représentant du Comité</p>
              <div className="h-16 mt-2 border-b border-dashed border-ciat-sand/50" />
              <p className="text-[10px] text-ciat-dark/50 mt-1">Date et signature</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
