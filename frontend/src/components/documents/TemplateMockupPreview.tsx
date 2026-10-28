"use client";

import React, { useState } from "react";
import Image from "next/image";
import { ModeleDocument } from "@/lib/documents";
import {
  Award,
  FileText,
  CheckCircle2,
  ShieldCheck,
  Calendar,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Eye,
  Sparkles,
  Layers,
  ArrowRight,
  Stamp,
} from "lucide-react";

export function getCanvaImageForModele(modele: ModeleDocument): {
  src: string;
  badge: string;
  typeFamily: "attestation" | "convention" | "fiche" | "appel";
} {
  const typeCode = (modele.type_code || "").toLowerCase();
  const typeNom = (modele.type_nom || "").toLowerCase();
  const nom = (modele.nom || "").toLowerCase();

  if (typeCode.includes("attestation") || typeNom.includes("attestation") || nom.includes("attestation")) {
    return {
      src: "/images/documents/canva_attestation.jpg",
      badge: "Canva Certificat & Attestation",
      typeFamily: "attestation",
    };
  }
  if (typeCode.includes("convention") || typeNom.includes("convention") || nom.includes("convention")) {
    return {
      src: "/images/documents/canva_convention.jpg",
      badge: "Canva Accord & Convention",
      typeFamily: "convention",
    };
  }
  if (typeCode.includes("fiche") || typeNom.includes("fiche") || nom.includes("fiche")) {
    return {
      src: "/images/documents/canva_fiche_projet.jpg",
      badge: "Canva Fiche Projet & FabLab 4.0",
      typeFamily: "fiche",
    };
  }
  return {
    src: "/images/documents/canva_appel.jpg",
    badge: "Canva Appel & Acte Administratif",
    typeFamily: "appel",
  };
}

interface TemplateMiniatureProps {
  modele: ModeleDocument;
  isSelected?: boolean;
  onOpenGrosPlan?: () => void;
}

export function TemplateMiniature({ modele, isSelected, onOpenGrosPlan }: TemplateMiniatureProps) {
  const canva = getCanvaImageForModele(modele);

  return (
    <div className="relative w-full aspect-[3/4] rounded-t-xl overflow-hidden bg-[#FAF7F2] border-b border-border group select-none">
      {/* Image de fond authentique du Canva généré */}
      <div className="absolute inset-0">
        <Image
          src={canva.src}
          alt={modele.nom}
          fill
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          className="object-cover object-top transition-transform duration-300 group-hover:scale-105"
        />
        {/* Voile protecteur léger pour lisibilité */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-black/20" />
      </div>

      {/* Badge de famille de gabarit en haut à gauche */}
      <div className="absolute top-2.5 left-2.5 z-10">
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-white/95 text-[#612D10] backdrop-blur-xs shadow-md border border-[#E8DFD5]">
          <Sparkles className="w-3 h-3 text-[#C99A68]" />
          <span>{canva.badge}</span>
        </span>
      </div>

      {/* Bouton Gros Plan / Zoom au survol */}
      <div className="absolute inset-0 z-20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/30 backdrop-blur-2xs">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onOpenGrosPlan?.();
          }}
          className="px-4 py-2 rounded-xl text-xs font-bold bg-white text-[#612D10] shadow-xl hover:bg-[#FAF7F2] transition-transform hover:scale-105 flex items-center gap-2 border border-[#C99A68]"
        >
          <Maximize2 className="w-3.5 h-3.5 text-[#C99A68]" />
          <span>Examiner en gros plan</span>
        </button>
      </div>

      {/* Bas de vignette avec titre et sceau */}
      <div className="absolute bottom-2.5 inset-x-2.5 z-10 flex items-end justify-between text-white">
        <div className="max-w-[80%] drop-shadow-md">
          <p className="text-[10px] uppercase font-bold tracking-wider text-amber-200">
            {modele.type_nom || "Format officiel CIAT"}
          </p>
          <h4 className="text-xs font-black truncate text-white leading-tight mt-0.5">
            {modele.nom.replace(/^Format\s+/i, "")}
          </h4>
        </div>
        <div className="w-7 h-7 rounded-full bg-white/90 border border-[#C99A68] flex items-center justify-center text-[#612D10] shadow-md shrink-0">
          <ShieldCheck className="w-4 h-4 text-[#612D10]" />
        </div>
      </div>
    </div>
  );
}

interface SpecimenModalProps {
  modele: ModeleDocument;
  onClose: () => void;
  onSelect: () => void;
}

export function SpecimenModal({ modele, onClose, onSelect }: SpecimenModalProps) {
  const [zoom, setZoom] = useState<number>(100);
  const canva = getCanvaImageForModele(modele);

  const zoomIn = () => setZoom((z) => Math.min(z + 25, 175));
  const zoomOut = () => setZoom((z) => Math.max(z - 25, 75));
  const resetZoom = () => setZoom(100);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/75 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-5xl h-[92vh] bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-border">
        {/* Barre d'outils supérieure de la modale */}
        <div className="flex items-center justify-between px-6 py-3.5 bg-[#FAF7F2] border-b border-[#E8DFD5] shrink-0">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-[#612D10] text-white">
                {canva.badge}
              </span>
              <span className="text-xs font-semibold text-muted-foreground">
                Gros plan haute fidélité A4
              </span>
            </div>
            <h3 className="text-base sm:text-lg font-black text-[#24140D] mt-0.5">
              {modele.nom}
            </h3>
          </div>

          {/* Outils de zoom */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1 bg-white border border-[#E8DFD5] rounded-xl px-2 py-1 shadow-2xs">
              <button
                type="button"
                onClick={zoomOut}
                disabled={zoom <= 75}
                className="p-1 hover:text-[#612D10] disabled:opacity-30"
                title="Dézoomer"
              >
                <ZoomOut className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={resetZoom}
                className="px-1.5 text-xs font-mono font-bold text-muted-foreground hover:text-foreground"
                title="Réinitialiser le zoom"
              >
                {zoom}%
              </button>
              <button
                type="button"
                onClick={zoomIn}
                disabled={zoom >= 175}
                className="p-1 hover:text-[#612D10] disabled:opacity-30"
                title="Zoomer"
              >
                <ZoomIn className="w-4 h-4" />
              </button>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="w-9 h-9 rounded-xl bg-white border border-[#E8DFD5] flex items-center justify-center text-muted-foreground hover:text-[#612D10] hover:border-[#612D10] transition-colors shadow-2xs font-bold"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Corps de la modale scrollable avec le Canva en gros plan */}
        <div className="flex-1 overflow-auto p-4 sm:p-8 bg-[#EFE9E2]/60 flex justify-center items-start">
          <div
            style={{ width: `${(650 * zoom) / 100}px`, transition: "width 0.2s ease-out" }}
            className="relative bg-white rounded-xl shadow-2xl border border-[#D8CFC5] overflow-hidden shrink-0"
          >
            {/* Image réelle du Canva en fond */}
            <div className="relative w-full aspect-[3/4]">
              <Image
                src={canva.src}
                alt={modele.nom}
                fill
                priority
                className="object-contain"
                sizes="(max-width: 1200px) 100vw, 800px"
              />

              {/* Surcouche de démonstration textuelle fidèle */}
              <div className="absolute inset-0 p-8 sm:p-12 flex flex-col justify-between pointer-events-none select-none">
                {canva.typeFamily === "attestation" && (
                  <div className="h-full flex flex-col justify-between pt-24 pb-20 px-8 text-center">
                    <div>
                      <p className="text-[11px] uppercase tracking-widest font-serif text-[#612D10] font-bold">
                        RÉPUBLIQUE DU SÉNÉGAL · ISEP DIAMNIADIO
                      </p>
                      <h2 className="text-xl sm:text-2xl font-black font-serif uppercase tracking-tight text-[#24140D] mt-2">
                        {modele.nom.replace(/^Format\s+/i, "")}
                      </h2>
                      <div className="w-20 h-0.5 bg-[#C99A68] mx-auto mt-2" />
                    </div>

                    <div className="my-auto space-y-4 max-w-md mx-auto text-xs leading-relaxed text-[#24140D] font-serif">
                      <p>
                        Le Centre d&apos;Innovation et d&apos;Accélération Technologique (CIAT) de l&apos;ISEP Diamniadio atteste par la présente que :
                      </p>
                      <p className="text-base font-bold text-[#612D10] uppercase tracking-wide border-b border-[#C99A68]/40 pb-1 inline-block px-4">
                        [Nom du Bénéficiaire / Startup]
                      </p>
                      <p className="text-[11px] text-muted-foreground italic">
                        {modele.apercu || "Est admis et suivi au sein du parcours d'accélération et d'hébergement au FabLab 4.0."}
                      </p>
                    </div>

                    <div className="flex justify-between items-end text-[10px] font-serif text-muted-foreground pt-4 border-t border-[#C99A68]/30">
                      <div className="text-left">
                        <p className="font-bold text-[#612D10]">Fait à Diamniadio</p>
                        <p>[Date du document certifiée]</p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-[#612D10]">Le Coordonnateur Général</p>
                        <p className="italic">[Signature et Sceau Officiel]</p>
                      </div>
                    </div>
                  </div>
                )}

                {canva.typeFamily === "convention" && (
                  <div className="h-full flex flex-col justify-between pt-28 pb-16 px-6 text-left">
                    <div>
                      <h2 className="text-lg sm:text-xl font-black uppercase tracking-tight text-[#24140D]">
                        {modele.nom.replace(/^Format\s+/i, "")}
                      </h2>
                      <p className="text-[11px] text-muted-foreground mt-1">
                        Convention d&apos;engagement et d&apos;accompagnement technologique
                      </p>
                    </div>

                    <div className="space-y-3 text-xs leading-relaxed text-[#24140D] max-w-lg">
                      <div className="p-2.5 rounded bg-white/80 border border-[#E8DFD5] text-[11px]">
                        <strong>ENTRE :</strong> Le CIAT - ISEP Diamniadio<br />
                        <strong>ET :</strong> [Le Partenaire / Porteur de projet]
                      </div>
                      <div className="space-y-1.5 pt-1 text-[11px]">
                        {modele.sections?.slice(0, 3).map((s, idx) => (
                          <div key={idx} className="flex gap-2">
                            <span className="font-bold text-[#612D10]">Article {idx + 1}.</span>
                            <span className="text-muted-foreground font-medium">{s.titre}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 text-[10px] pt-4 border-t border-[#E8DFD5]">
                      <div>
                        <p className="font-bold text-[#612D10]">Pour le CIAT :</p>
                        <p className="italic">[Cachet et Signature]</p>
                      </div>
                      <div>
                        <p className="font-bold text-[#612D10]">Pour le Partenaire :</p>
                        <p className="italic">[Cachet et Signature]</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Pied de la modale avec validation */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-6 py-4 bg-[#FAF7F2] border-t border-[#E8DFD5] shrink-0">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Tous les champs sont éditables à l&apos;étape suivante (lieu, date, émetteur, signataire).</span>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl text-xs font-bold text-muted-foreground hover:text-[#612D10] transition-colors"
            >
              Fermer l&apos;inspecteur
            </button>
            <button
              type="button"
              onClick={() => {
                onSelect();
                onClose();
              }}
              className="px-6 py-2.5 rounded-xl text-xs font-bold bg-[#612D10] text-white hover:bg-[#461F0A] shadow-md hover:shadow-lg transition-all flex items-center gap-2"
            >
              <span>Choisir et personnaliser ce Canva</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
