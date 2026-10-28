"use client";

import React, { useRef } from "react";
import Image from "next/image";
import { DocumentDetail, SectionDocument } from "@/lib/documents";
import {
  ShieldCheck,
  Award,
  Download,
  FileText,
  Printer,
  Edit3,
  Calendar,
  Building2,
  CheckCircle2,
  Sparkles,
} from "lucide-react";

interface DocumentCanvaViewProps {
  document: DocumentDetail;
  sections: SectionDocument[];
  versionNum: number;
  onSwitchToEdit: () => void;
  onDownloadPdf: () => void;
  onDownloadDocx: () => void;
  isDownloading?: boolean;
}

export function DocumentCanvaView({
  document,
  sections,
  versionNum,
  onSwitchToEdit,
  onDownloadPdf,
  onDownloadDocx,
  isDownloading,
}: DocumentCanvaViewProps) {
  const printRef = useRef<HTMLDivElement>(null);
  const titreLower = (document.titre || "").toLowerCase();

  const isAttestation =
    titreLower.includes("attestation") ||
    titreLower.includes("reçu") ||
    titreLower.includes("certificat");
  const isConvention =
    titreLower.includes("convention") ||
    titreLower.includes("accord") ||
    titreLower.includes("contrat");
  const isFiche =
    titreLower.includes("fiche") ||
    titreLower.includes("technique") ||
    titreLower.includes("dossier");

  // Rendu inline sécurisé du texte (markdown gras/italique et badges [À COMPLÉTER])
  const renderFormattedText = (text: string) => {
    const clean = (text || "")
      .replace(/\u2011/g, "-")
      .replace(/\u202f/g, " ")
      .replace(/■/g, "-");

    const lines = clean.split("\n");
    return lines.map((line, lIdx) => {
      const trimmed = line.trim();
      if (!trimmed) {
        return <div key={lIdx} className="h-2" />;
      }

      // Traitement des puces
      const isBullet = trimmed.startsWith("- ") || trimmed.startsWith("• ") || trimmed.startsWith("* ");
      const content = isBullet ? trimmed.replace(/^[-•*]\s*/, "") : trimmed;

      // Parsing gras **texte**
      const parts = content.split(/(\*\*.*?\*\*|\[À COMPLÉTER\s*:[^\]]+\])/g);
      const parsedElements = parts.map((part, pIdx) => {
        if (part.startsWith("**") && part.endsWith("**")) {
          return (
            <strong key={pIdx} className="font-bold text-[#24140D]">
              {part.slice(2, -2)}
            </strong>
          );
        }
        if (part.startsWith("[À COMPLÉTER")) {
          return (
            <span
              key={pIdx}
              className="inline-flex items-center px-1.5 py-0.5 rounded text-[11px] font-bold bg-amber-100 text-amber-900 border border-amber-300 mx-0.5"
            >
              ⚠️ {part}
            </span>
          );
        }
        return part;
      });

      if (isBullet) {
        return (
          <div key={lIdx} className="flex items-start gap-2 pl-3 py-0.5 text-xs leading-relaxed text-[#24140D]">
            <span className="h-1.5 w-1.5 rounded-full bg-[#C99A68] mt-1.5 shrink-0" />
            <span className="flex-1">{parsedElements}</span>
          </div>
        );
      }

      return (
        <p key={lIdx} className="text-xs leading-relaxed text-[#24140D] py-0.5">
          {parsedElements}
        </p>
      );
    });
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Barre d'actions supérieure */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-[#FAF7F2] p-4 rounded-2xl border border-border">
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-[#612D10] text-white">
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            <span>Rendu Canva Officiel A4</span>
          </span>
          <span className="text-xs text-muted-foreground">Version v{versionNum} certifiée</span>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onSwitchToEdit}
            className="px-3.5 py-2 rounded-xl text-xs font-bold text-[#612D10] bg-white border border-[#E8DFD5] hover:bg-[#F4ECE3] shadow-2xs transition-all flex items-center gap-1.5"
          >
            <Edit3 className="w-3.5 h-3.5 text-[#C99A68]" />
            <span>Modifier les textes</span>
          </button>

          <button
            type="button"
            onClick={onDownloadDocx}
            disabled={isDownloading}
            className="px-3.5 py-2 rounded-xl text-xs font-bold text-[#612D10] bg-white border border-[#E8DFD5] hover:bg-[#F4ECE3] shadow-2xs transition-all flex items-center gap-1.5"
          >
            <FileText className="w-3.5 h-3.5 text-[#C99A68]" />
            <span>Word (.docx)</span>
          </button>

          <button
            type="button"
            onClick={onDownloadPdf}
            disabled={isDownloading}
            className="px-4 py-2 rounded-xl text-xs font-bold bg-[#612D10] text-white hover:bg-[#461F0A] shadow-md transition-all flex items-center gap-1.5"
          >
            <Download className="w-3.5 h-3.5 text-amber-300" />
            <span>{isDownloading ? "Téléchargement..." : "Télécharger PDF Officiel"}</span>
          </button>
        </div>
      </div>

      {/* Conteneur Feuille A4 Réaliste */}
      <div className="flex justify-center p-2 sm:p-6 bg-[#EFE9E2]/60 rounded-2xl border border-[#D8CFC5]">
        <div
          ref={printRef}
          className="w-full max-w-3xl bg-white rounded-xl shadow-2xl border border-[#D8CFC5] p-8 sm:p-14 relative overflow-hidden select-text"
        >
          {/* ========================================================== */}
          {/* CAS 1 : FORMAT ATTESTATION & CERTIFICAT                    */}
          {/* ========================================================== */}
          {isAttestation ? (
            <div className="relative border-4 border-[#612D10] p-6 sm:p-10 rounded-sm">
              {/* Double filet intérieur doré */}
              <div className="absolute inset-1.5 border border-[#C99A68] pointer-events-none" />

              {/* Coins carrés décoratifs */}
              <div className="absolute top-0 left-0 w-3 h-3 bg-[#612D10]" />
              <div className="absolute top-0 right-0 w-3 h-3 bg-[#612D10]" />
              <div className="absolute bottom-0 left-0 w-3 h-3 bg-[#612D10]" />
              <div className="absolute bottom-0 right-0 w-3 h-3 bg-[#612D10]" />

              {/* En-tête officiel solennel */}
              <div className="text-center space-y-1 pb-6 border-b border-[#C99A68]/40">
                <p className="text-[11px] font-serif font-black tracking-widest uppercase text-[#612D10]">
                  RÉPUBLIQUE DU SÉNÉGAL
                </p>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-serif">
                  Ministère de l&apos;Enseignement Supérieur, de la Recherche et de l&apos;Innovation
                </p>
                <h3 className="text-sm font-black uppercase text-[#24140D] tracking-wide mt-1">
                  CENTRE D&apos;INNOVATION ET D&apos;ACCÉLÉRATION TECHNOLOGIQUE (CIAT)
                </h3>
                <p className="text-[11px] font-bold text-[#C99A68] uppercase tracking-wider">
                  ISEP DIAMNIADIO · CITÉ DU SAVOIR
                </p>
              </div>

              {/* Titre du certificat */}
              <div className="my-8 text-center">
                <h1 className="text-xl sm:text-2xl font-serif font-black uppercase tracking-tight text-[#612D10]">
                  {document.titre}
                </h1>
                <div className="w-24 h-0.5 bg-[#C99A68] mx-auto mt-2.5" />
                <p className="text-[11px] font-mono text-muted-foreground mt-1">
                  RÉFÉRENCE OFFICIELLE : CIAT/2026/DOC-{String(document.id).padStart(3, "0")}
                </p>
              </div>

              {/* Sections rédigées */}
              <div className="space-y-6 my-8 font-serif">
                {sections.map((sec, idx) => (
                  <div key={sec.code || idx} className="space-y-2">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-[#612D10] text-center border-b border-[#E8DFD5] pb-1 max-w-xs mx-auto">
                      {sec.titre || sec.code}
                    </h4>
                    <div className="text-center max-w-xl mx-auto leading-relaxed">
                      {renderFormattedText(sec.contenu)}
                    </div>
                  </div>
                ))}
              </div>

              {/* Bas de page officiel avec sceau doré et signature */}
              <div className="mt-12 pt-6 border-t border-[#C99A68]/40 flex items-end justify-between font-serif">
                <div className="space-y-1">
                  <p className="text-xs font-bold text-[#612D10]">Fait à Diamniadio, Cité du Savoir</p>
                  <p className="text-[11px] text-muted-foreground">Date certifiée conforme</p>
                  <div className="h-10 flex items-center text-xs text-muted-foreground/50 italic">
                    [Signature & Paraphe officiel]
                  </div>
                </div>

                {/* Sceau doré de certification */}
                <div className="flex flex-col items-center">
                  <div className="w-20 h-20 rounded-full border-2 border-[#C99A68] bg-[#FAF3EC] flex flex-col items-center justify-center p-2 shadow-md relative">
                    <ShieldCheck className="w-6 h-6 text-[#612D10]" />
                    <span className="text-[7px] font-black uppercase tracking-wider text-[#612D10] mt-0.5">
                      ★ CIAT ★
                    </span>
                    <span className="text-[6px] text-muted-foreground uppercase">Sceau Officiel</span>
                  </div>
                  <span className="text-[8px] font-sans font-bold text-muted-foreground uppercase tracking-widest mt-1">
                    Certifié Conforme
                  </span>
                </div>
              </div>
            </div>
          ) : isConvention ? (
            /* ========================================================== */
            /* CAS 2 : FORMAT CONVENTION & ACCORD JURIDIQUE               */
            /* ========================================================== */
            <div className="space-y-6">
              {/* En-tête Convention */}
              <div className="border-b-2 border-[#612D10] pb-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                      RÉPUBLIQUE DU SÉNÉGAL
                    </p>
                    <h3 className="text-base font-black text-[#612D10] uppercase">
                      CIAT — ISEP DIAMNIADIO
                    </h3>
                  </div>
                  <div className="text-right text-[10px] text-muted-foreground">
                    <span className="font-mono font-bold bg-[#FAF7F2] px-2 py-1 rounded border border-[#E8DFD5]">
                      ACCORD N° CIAT-{String(document.id).padStart(3, "0")}
                    </span>
                  </div>
                </div>
                <h1 className="text-xl sm:text-2xl font-bold text-[#24140D] mt-3 uppercase tracking-tight">
                  {document.titre}
                </h1>
              </div>

              {/* Sections rédigées sous forme d'articles */}
              <div className="space-y-5 my-6">
                {sections.map((sec, idx) => (
                  <div key={sec.code || idx} className="rounded-xl border border-border p-4 bg-[#FCFAF7]">
                    <div className="flex items-center gap-2 mb-2 pb-1.5 border-b border-border/60">
                      <span className="text-xs font-black text-[#612D10] uppercase">
                        ARTICLE {idx + 1} — {sec.titre || sec.code}
                      </span>
                    </div>
                    <div>{renderFormattedText(sec.contenu)}</div>
                  </div>
                ))}
              </div>

              {/* Double bloc signature bilatérale */}
              <div className="mt-10 pt-6 border-t-2 border-dashed border-[#E8DFD5] grid grid-cols-2 gap-6">
                <div className="p-4 rounded-xl border border-border bg-[#FAF7F2] space-y-1">
                  <p className="text-xs font-bold text-[#612D10]">Pour le CIAT / ISEP Diamniadio :</p>
                  <p className="text-[11px] text-muted-foreground">Le Coordonnateur Général</p>
                  <div className="h-12 flex items-center text-xs text-muted-foreground/40 italic">
                    [Signature & Cachet Officiel]
                  </div>
                </div>
                <div className="p-4 rounded-xl border border-border bg-[#FAF7F2] space-y-1">
                  <p className="text-xs font-bold text-[#612D10]">Pour l&apos;Entreprise / Le Partenaire :</p>
                  <p className="text-[11px] text-muted-foreground">Le Représentant Légal</p>
                  <div className="h-12 flex items-center text-xs text-muted-foreground/40 italic">
                    [Signature & Cachet Officiel]
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* ========================================================== */
            /* CAS 3 : FORMAT FICHE PROJET, APPEL & ACTE ADMINISTRATIF    */
            /* ========================================================== */
            <div className="space-y-6">
              {/* En-tête institutionnel avec bande CIAT */}
              <div className="space-y-2 pb-4 border-b border-[#E8DFD5]">
                <div className="h-1 w-full bg-gradient-to-r from-[#612D10] via-[#C99A68] to-[#612D10] rounded-full" />
                <div className="flex items-center justify-between text-xs text-muted-foreground pt-1">
                  <span className="font-bold text-[#612D10]">RÉPUBLIQUE DU SÉNÉGAL</span>
                  <span>CIAT · ISEP Diamniadio</span>
                </div>
                <h1 className="text-xl sm:text-2xl font-black text-[#24140D] tracking-tight mt-2">
                  {document.titre}
                </h1>
                <p className="text-xs text-muted-foreground font-mono">
                  Réf. CIAT/2026/DOC-{String(document.id).padStart(3, "0")} • Statut : {document.statut}
                </p>
              </div>

              {/* Sections numérotées */}
              <div className="space-y-5 my-6">
                {sections.map((sec, idx) => (
                  <div key={sec.code || idx} className="space-y-2">
                    <div className="flex items-center gap-2 border-b border-[#E8DFD5] pb-1.5">
                      <span className="w-5 h-5 rounded-full bg-[#612D10] text-white flex items-center justify-center text-[10px] font-bold shrink-0">
                        {idx + 1}
                      </span>
                      <h4 className="text-sm font-bold text-[#612D10] uppercase tracking-wide">
                        {sec.titre || sec.code}
                      </h4>
                    </div>
                    <div className="pl-7">{renderFormattedText(sec.contenu)}</div>
                  </div>
                ))}
              </div>

              {/* Bloc de clôture officiel */}
              <div className="mt-8 pt-4 border-t border-[#E8DFD5] flex items-center justify-between text-xs text-muted-foreground">
                <div>
                  <p className="font-bold text-[#612D10]">Direction du CIAT — ISEP Diamniadio</p>
                  <p className="text-[11px]">Plateforme Numérique Officielle</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-[#612D10]">Certifié Conforme</p>
                  <p className="text-[11px] font-mono">ID #{document.id} (v{versionNum})</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
