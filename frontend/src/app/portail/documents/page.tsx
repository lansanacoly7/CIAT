"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  FileText,
  Download,
  CheckCircle,
  FileSpreadsheet,
  FileCheck2,
  ShieldCheck,
  BookOpen,
  Calendar,
  Layers,
  Search,
  ArrowRight,
  Sparkles,
} from "lucide-react";
import { ApiErrorBanner, DemoBanner } from "@/components/ui";
import { getDocumentsPublics, type DocumentPublic } from "@/lib/portal-api";

const CATEGORIES_CONFIG = [
  { value: "tous", label: "Tous les documents" },
  { value: "candidature", label: "Candidatures & Formulaires" },
  { value: "reglement", label: "Règlements & Chartes" },
  { value: "guide", label: "Guides méthodologiques" },
  { value: "rapport", label: "Rapports d'activités" },
];

function getFormatBadgeStyle(format: DocumentPublic["format"]) {
  switch (format) {
    case "PDF":
      return {
        bg: "bg-red-50 text-red-700 border-red-200",
        icon: FileText,
      };
    case "XLSX":
      return {
        bg: "bg-emerald-50 text-emerald-700 border-emerald-200",
        icon: FileSpreadsheet,
      };
    case "DOCX":
      return {
        bg: "bg-blue-50 text-blue-700 border-blue-200",
        icon: FileCheck2,
      };
    default:
      return {
        bg: "bg-amber-50 text-amber-700 border-amber-200",
        icon: FileText,
      };
  }
}

function DocumentCoverPreview({
  titre,
  format,
  categorie,
}: {
  titre: string;
  format: DocumentPublic["format"];
  categorie: string;
}) {
  return (
    <div className="relative w-full aspect-[3/4] max-w-[220px] mx-auto rounded-xl bg-gradient-to-br from-white to-[#FAF7F2] border border-[#E5D7C6] p-4 shadow-md flex flex-col justify-between overflow-hidden group-hover:shadow-lg transition-all">
      {/* En-tête officiel de la couverture */}
      <div>
        <div className="flex items-center justify-between border-b border-[#E5D7C6] pb-2">
          <span className="text-[9px] font-black tracking-widest text-[#612D10] uppercase">
            RÉPUBLIQUE DU SÉNÉGAL
          </span>
          <span className="h-1.5 w-1.5 rounded-full bg-[#C99A68]" />
        </div>
        <p className="mt-1 text-[8px] font-bold text-[#8C6D58] uppercase tracking-wider">
          CIAT • ISEP DIAMNIADIO
        </p>
      </div>

      {/* Titre central de la couverture */}
      <div className="my-auto py-2">
        <span className="inline-block text-[8px] font-extrabold px-1.5 py-0.5 rounded bg-[#612D10]/10 text-[#612D10] uppercase mb-1">
          {categorie}
        </span>
        <h4 className="text-[11px] font-extrabold text-[#24140D] leading-tight line-clamp-3">
          {titre}
        </h4>
        <div className="mt-2 h-0.5 w-8 bg-[#C99A68]" />
      </div>

      {/* Pied de couverture avec format et sceau */}
      <div className="pt-2 border-t border-[#E5D7C6] flex items-center justify-between">
        <span className="text-[9px] font-bold text-[#8C6D58] font-mono">
          FORMAT {format}
        </span>
        <span className="text-[8px] font-bold text-[#612D10] uppercase tracking-wider">
          OFFICIEL
        </span>
      </div>
    </div>
  );
}

export default function DocumentsPortailPage() {
  const [items, setItems] = useState<DocumentPublic[]>([]);
  const [selectedCat, setSelectedCat] = useState("tous");
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [isDemo, setIsDemo] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [downloadSuccess, setDownloadSuccess] = useState<string | null>(null);

  const fetchDocs = () => {
    setLoading(true);
    setError(null);
    getDocumentsPublics("tous")
      .then((res) => {
        setItems(res.items);
        setIsDemo(Boolean(res.isDemo));
        setError(res.error);
        setLoading(false);
      })
      .catch(() => {
        setError("Les documents publics sont momentanément indisponibles. Réessayez plus tard.");
        setItems([]);
        setIsDemo(false);
        setLoading(false);
      });
  };

  useEffect(() => {
    let ignore = false;
    getDocumentsPublics("tous")
      .then((res) => {
        if (!ignore) {
          setItems(res.items);
          setIsDemo(Boolean(res.isDemo));
          setError(res.error);
          setLoading(false);
        }
      })
      .catch(() => {
        if (!ignore) {
          setError("Les documents publics sont momentanément indisponibles. Réessayez plus tard.");
          setItems([]);
          setIsDemo(false);
          setLoading(false);
        }
      });

    return () => {
      ignore = true;
    };
  }, []);

  const normalizeCat = (cat: string) => {
    const c = (cat || "").toLowerCase();
    if (c.includes("candidat") || c.includes("formulaire")) return "candidature";
    if (c.includes("regle") || c.includes("charte")) return "reglement";
    if (c.includes("guide") || c.includes("method")) return "guide";
    if (c.includes("rapport") || c.includes("activit")) return "rapport";
    return c;
  };

  const filteredItems = useMemo(() => {
    return items.filter((d) => {
      const matchCat =
        selectedCat === "tous" || normalizeCat(d.categorie) === selectedCat;
      const matchSearch =
        searchQuery.trim() === "" ||
        d.titre.toLowerCase().includes(searchQuery.toLowerCase()) ||
        d.description.toLowerCase().includes(searchQuery.toLowerCase());
      return matchCat && matchSearch;
    });
  }, [items, selectedCat, searchQuery]);

  // Documents phares : le premier document de candidature et la charte de propriété intellectuelle
  const featuredDocs = useMemo(() => {
    if (items.length === 0) return [];
    return items.slice(0, 2);
  }, [items]);

  const otherDocs = useMemo(() => {
    if (items.length <= 2) return items;
    return items.slice(2);
  }, [items]);

  const handleDownload = (doc: DocumentPublic) => {
    let url = doc.fichier_url;
    if (!url || url === "#") {
      const lower = doc.titre.toLowerCase();
      if (lower.includes("charte") || lower.includes("intellectuelle")) {
        url = "/media/documents_publics/charte_propriete_intellectuelle_ciat.pdf";
      } else if (lower.includes("règlement") || lower.includes("reglement")) {
        url = "/media/documents_publics/reglement_interieur_incubateur_ciat.pdf";
      } else {
        url = "/media/documents_publics/dossier_candidature_incubation_2026.pdf";
      }
    }

    const finalUrl = url.startsWith("http")
      ? url
      : url.startsWith("/")
      ? url
      : `/${url}`;

    const a = document.createElement("a");
    a.href = finalUrl;
    a.download = `${doc.titre.replace(/[^a-zA-Z0-9_-]/g, "_")}.${doc.format.toLowerCase()}`;
    a.target = "_blank";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);

    setDownloadSuccess(`Téléchargement de « ${doc.titre} » en cours…`);
    setTimeout(() => {
      setDownloadSuccess(null);
    }, 4500);
  };

  return (
    <div className="bg-[#FAF7F2] text-[#24140D] min-h-screen font-sans antialiased selection:bg-[#C99A68]/30">
      {/* =====================================================================
       * 1. HERO AVEC PHOTOGRAPHIE RÉELLE
       * ===================================================================== */}
      <section className="relative overflow-hidden bg-[#24140D] text-white">
        <div className="absolute inset-0">
          <Image
            src="/images/ciat-depot-innovation.jpg"
            alt="Espace documentaire officiel, guides et chartes techniques du CIAT"
            fill
            priority
            sizes="100vw"
            className="object-cover object-center opacity-30"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#24140D] via-[#24140D]/75 to-transparent" />
        </div>

        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-10 pb-16 md:pt-14 md:pb-24">
          {/* Fil d'Ariane */}
          <nav
            aria-label="Fil d'Ariane"
            className="mb-8 flex flex-wrap items-center gap-2 text-xs font-medium text-[#DFCDB9]"
          >
            <Link href="/" className="hover:text-white transition">
              Accueil
            </Link>
            <span className="text-[#C99A68]/70">/</span>
            <Link href="/portail" className="hover:text-white transition">
              Portail
            </Link>
            <span className="text-[#C99A68]/70">/</span>
            <span className="text-white font-semibold">Documents Publics</span>
          </nav>

          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-[#C99A68]/40 bg-[#612D10]/50 px-3.5 py-1 text-xs font-bold uppercase tracking-wider text-[#DFae79] backdrop-blur-sm">
              <FileCheck2 size={14} className="text-[#DFae79]" />
              <span>Ressources & Cadre Réglementaire</span>
            </div>

            <h1 className="mt-5 font-[family-name:var(--font-jakarta)] text-3xl sm:text-5xl md:text-6xl font-extrabold tracking-tight text-white leading-tight">
              Documents Publics & Guides Officiels
            </h1>

            <p className="mt-4 sm:mt-6 text-sm sm:text-base md:text-lg leading-relaxed text-[#EAE0D5] max-w-2xl">
              Téléchargez les canevas types de candidature, la charte de propriété
              intellectuelle, les règlements de sécurité des ateliers technologiques
              et les bilans d&apos;activité du CIAT à Diamniadio.
            </p>

            <div className="mt-8 flex flex-wrap gap-4">
              <a
                href="#documents-phares"
                className="inline-flex items-center gap-2 rounded-xl bg-[#612D10] hover:bg-[#7D3A15] border border-[#C99A68]/40 px-6 py-3.5 text-xs sm:text-sm font-bold !text-white shadow-xl transition-all cursor-pointer"
              >
                <span>Consulter les Documents Phares</span>
                <ArrowRight size={16} />
              </a>
              <Link
                href="/portail/appels"
                className="inline-flex items-center gap-2 rounded-xl border border-white/30 bg-white/10 hover:bg-white/20 px-6 py-3.5 text-xs sm:text-sm font-semibold !text-white backdrop-blur-sm transition"
              >
                <span>Appels à Candidatures</span>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* =====================================================================
       * 2. CORPS PRINCIPAL & DOCUMENTS PHARES
       * ===================================================================== */}
      <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12 md:py-20">
        {isDemo && <DemoBanner className="mb-8" />}
        {error && (
          <ApiErrorBanner
            message={error}
            onRetry={fetchDocs}
            className="mb-8"
          />
        )}

        {/* Notification toast de téléchargement réussi */}
        {downloadSuccess && (
          <div
            role="status"
            className="mb-8 rounded-2xl border border-emerald-300 bg-emerald-50 p-4 text-xs font-bold text-emerald-900 flex items-center gap-3 shadow-md transition-all"
          >
            <CheckCircle className="h-5 w-5 text-emerald-600 shrink-0" />
            <span>{downloadSuccess}</span>
          </div>
        )}

        {/* ===================================================================
         * SECTION A : DOCUMENTS PHARES (AVEC VIGNETTES DE COUVERTURE)
         * =================================================================== */}
        {featuredDocs.length > 0 && selectedCat === "tous" && searchQuery === "" && (
          <section id="documents-phares" className="mb-16">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles size={16} className="text-[#C99A68]" />
              <span className="text-xs font-bold uppercase tracking-wider text-[#612D10]">
                Publications Essentielles
              </span>
            </div>
            <h2 className="font-[family-name:var(--font-jakarta)] text-2xl font-extrabold text-[#24140D]">
              Documents Phares du CIAT
            </h2>
            <p className="text-xs sm:text-sm text-[#655346] mt-1 max-w-2xl">
              Les documents officiels les plus consultés par les porteurs de projets,
              entrepreneurs et partenaires académiques.
            </p>

            <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-8">
              {featuredDocs.map((doc) => {
                const style = getFormatBadgeStyle(doc.format);
                const FormatIcon = style.icon;

                return (
                  <article
                    key={doc.id}
                    className="group rounded-3xl border border-[#E5D7C6] bg-white p-6 sm:p-8 shadow-xs hover:shadow-xl transition-all flex flex-col sm:flex-row items-center gap-6"
                  >
                    <div className="shrink-0 w-full sm:w-auto">
                      <DocumentCoverPreview
                        titre={doc.titre}
                        format={doc.format}
                        categorie={doc.categorie}
                      />
                    </div>

                    <div className="flex-1 flex flex-col justify-between h-full">
                      <div>
                        <div className="flex items-center gap-2">
                          <span
                            className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[10px] font-bold ${style.bg}`}
                          >
                            <FormatIcon size={12} />
                            {doc.format} • {doc.taille}
                          </span>
                          <span className="text-[11px] text-[#8C6D58]">
                            Document Certifié
                          </span>
                        </div>

                        <h3 className="mt-3 font-[family-name:var(--font-jakarta)] text-lg sm:text-xl font-bold text-[#24140D] leading-snug">
                          {doc.titre}
                        </h3>

                        <p className="mt-2 text-xs text-[#655346] leading-relaxed line-clamp-2">
                          {doc.description}
                        </p>
                      </div>

                      <div className="mt-6 pt-4 border-t border-[#E5D7C6] flex flex-wrap items-center justify-between gap-3">
                        <button
                          type="button"
                          onClick={() => handleDownload(doc)}
                          className="inline-flex items-center gap-2 rounded-xl bg-[#612D10] hover:bg-[#7D3A15] border border-[#C99A68]/40 px-5 py-2.5 text-xs font-bold text-white shadow-md transition-all cursor-pointer"
                        >
                          <Download size={14} />
                          <span>Télécharger ({doc.format} • {doc.taille})</span>
                        </button>
                        <span className="text-[10px] text-[#A68F80]">
                          Mise à jour officielle
                        </span>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          </section>
        )}

        {/* ===================================================================
         * SECTION B : FILTRES & RECHERCHE
         * =================================================================== */}
        <section aria-label="Recherche et filtres" className="mb-10">
          <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 border-b border-[#E5D7C6] pb-6">
            <div className="relative flex-1 max-w-md">
              <Search
                size={16}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8C6D58]"
              />
              <input
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Rechercher un guide, canevas, charte…"
                className="w-full rounded-xl border border-[#E5D7C6] bg-white pl-10 pr-4 py-2.5 text-xs sm:text-sm text-[#24140D] placeholder-[#A68F80] focus:border-[#612D10] focus:outline-none"
              />
            </div>

            <div className="flex flex-wrap gap-2">
              {CATEGORIES_CONFIG.map((cat) => {
                const active = selectedCat === cat.value;
                return (
                  <button
                    key={cat.value}
                    type="button"
                    onClick={() => setSelectedCat(cat.value)}
                    className={`min-h-[40px] px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      active
                        ? "bg-[#612D10] text-white shadow-sm"
                        : "bg-white border border-[#E5D7C6] text-[#655346] hover:bg-[#FAF7F2] hover:text-[#24140D]"
                    }`}
                  >
                    {cat.label}
                  </button>
                );
              })}
            </div>
          </div>
        </section>

        {/* ===================================================================
         * SECTION C : CATALOGUE DES DOCUMENTS REGROUPÉS PAR CATÉGORIE
         * =================================================================== */}
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="h-28 rounded-2xl bg-white border border-[#E5D7C6] animate-pulse p-6"
              />
            ))}
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-[#DFCDB9] bg-white p-12 text-center max-w-xl mx-auto my-8">
            <BookOpen className="mx-auto h-12 w-12 text-[#C99A68]" />
            <h3 className="mt-4 text-base font-bold text-[#24140D]">
              Aucun document correspondant trouvé
            </h3>
            <p className="mt-2 text-xs text-[#655346] leading-relaxed">
              Essayez un autre mot-clé ou réinitialisez les filtres par catégorie.
            </p>
            <button
              type="button"
              onClick={() => {
                setSelectedCat("tous");
                setSearchQuery("");
              }}
              className="mt-6 inline-flex items-center gap-2 rounded-xl bg-[#612D10] hover:bg-[#7D3A15] px-5 py-2.5 text-xs font-bold text-white transition cursor-pointer"
            >
              Réinitialiser les filtres
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredItems.map((doc) => {
              const style = getFormatBadgeStyle(doc.format);
              const FormatIcon = style.icon;

              return (
                <article
                  key={doc.id}
                  className="rounded-2xl border border-[#E5D7C6] bg-white p-5 sm:p-6 shadow-xs hover:shadow-md transition-all flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
                >
                  <div className="flex items-start gap-4 flex-1">
                    <div
                      className={`h-12 w-12 rounded-xl border flex items-center justify-center shrink-0 ${style.bg}`}
                    >
                      <FormatIcon size={22} />
                    </div>

                    <div className="flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-[10px] font-extrabold px-2 py-0.5 rounded bg-[#FAF7F2] border border-[#E5D7C6] text-[#8C6D58] uppercase">
                          {doc.categorie}
                        </span>
                        <span className="text-[11px] font-mono text-[#8C6D58]">
                          {doc.format} • {doc.taille}
                        </span>
                      </div>

                      <h4 className="mt-1.5 font-[family-name:var(--font-jakarta)] text-sm sm:text-base font-bold text-[#24140D]">
                        {doc.titre}
                      </h4>

                      <p className="mt-1 text-xs text-[#655346] leading-relaxed line-clamp-2">
                        {doc.description}
                      </p>
                    </div>
                  </div>

                  <div className="w-full md:w-auto pt-3 md:pt-0 border-t md:border-t-0 border-[#E5D7C6] flex items-center justify-between md:justify-end gap-3 shrink-0">
                    <button
                      type="button"
                      onClick={() => handleDownload(doc)}
                      className="w-full md:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-[#612D10] hover:bg-[#7D3A15] border border-[#C99A68]/40 px-5 py-2.5 text-xs font-bold text-white shadow-sm transition-all cursor-pointer"
                    >
                      <Download size={14} />
                      <span>Télécharger</span>
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        )}

        {/* =====================================================================
         * SECTION D : BANDEAU D'AIDE & CANDIDATURE
         * ===================================================================== */}
        <section className="mt-16 rounded-3xl bg-white border border-[#E5D7C6] p-8 sm:p-10 shadow-xs flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="max-w-xl">
            <span className="inline-flex items-center gap-1.5 text-xs font-bold text-[#612D10] uppercase tracking-wider mb-2">
              <ShieldCheck size={16} />
              Besoin d&apos;un Document Spécifique ?
            </span>
            <h3 className="font-[family-name:var(--font-jakarta)] text-xl font-bold text-[#24140D]">
              Un modèle ou une attestation administrative manquante ?
            </h3>
            <p className="mt-2 text-xs sm:text-sm text-[#655346] leading-relaxed">
              Le Bureau de Coordination du CIAT met à disposition des porteurs de
              projets et des mentors des canevas complémentaires sur simple demande.
            </p>
          </div>

          <div className="flex flex-wrap gap-3 shrink-0">
            <Link
              href="/portail/contact"
              className="inline-flex items-center gap-2 rounded-xl bg-[#612D10] hover:bg-[#7D3A15] border border-[#C99A68]/40 px-5 py-3 text-xs sm:text-sm font-bold text-white transition cursor-pointer"
            >
              <span>Contacter le Secrétariat</span>
              <ArrowRight size={14} />
            </Link>
          </div>
        </section>
      </main>
    </div>
  );
}
