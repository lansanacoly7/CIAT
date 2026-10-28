"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Search,
  X,
  ChevronLeft,
  ChevronRight,
  Download,
  FolderGit2,
  ExternalLink,
  Layers,
} from "lucide-react";
import { fetchAll } from "@/lib/paginate";
import { formatDate } from "@/lib/format";
import type { DashboardFilters, ProjetPortfolioItem } from "../types";

interface Props {
  filters: DashboardFilters;
  chartsSlot?: React.ReactNode;
}

const STATUTS_LABELS: Record<string, { label: string; badgeClass: string }> = {
  idee: {
    label: "Idée reçue",
    badgeClass: "bg-stone-100 text-stone-700 border-stone-200",
  },
  depose: {
    label: "Dossier déposé",
    badgeClass: "bg-blue-50 text-blue-700 border-blue-200",
  },
  selectionne: {
    label: "Sélectionné",
    badgeClass: "bg-emerald-50 text-emerald-700 border-emerald-200",
  },
  incube: {
    label: "En incubation",
    badgeClass: "bg-amber-50 text-amber-700 border-amber-200",
  },
  prototype: {
    label: "Prototype validé",
    badgeClass: "bg-purple-50 text-purple-700 border-purple-200",
  },
  termine: {
    label: "Terminé",
    badgeClass: "bg-green-50 text-green-700 border-green-200",
  },
  rejete: {
    label: "Non retenu",
    badgeClass: "bg-rose-50 text-rose-700 border-rose-200",
  },
};

const MOCK_PROJETS: ProjetPortfolioItem[] = [
  {
    id: 1,
    titre: "SunuAgri Drone — Cartographie Multispectrale des Sols",
    resume: "Drones autonomes équipés de capteurs multispectraux pour optimiser l'irrigation et la fertilisation des cultures maraîchères dans la vallée du fleuve Sénégal.",
    domaine: 1,
    domaine_nom: "Agriculture et environnement",
    cohorte: 2025,
    cohorte_nom: "Cohorte 2025",
    porteur_nom: "Fatou Diop",
    statut: "prototype",
    cree_le: "2025-02-14",
  },
  {
    id: 2,
    titre: "Diagnostic IA Paludisme & Tuberculose Portatif",
    resume: "Microscope connecté alimenté par batterie solaire utilisant un modèle de vision par ordinateur pour identifier les parasites du paludisme en moins de 3 minutes.",
    domaine: 2,
    domaine_nom: "Pharmaceutique et biomédical",
    cohorte: 2025,
    cohorte_nom: "Cohorte 2025",
    porteur_nom: "Dr. Amadou Ba",
    statut: "incube",
    cree_le: "2025-03-20",
  },
  {
    id: 3,
    titre: "Lampadaires Solaires Connectés à Batterie LFP",
    resume: "Système d'éclairage public autonome à batteries lithium-fer-phosphate sécurisées, télégérées via réseau LoRaWAN pour les municipalités périurbaines.",
    domaine: 3,
    domaine_nom: "Énergie et renouvelables",
    cohorte: 2024,
    cohorte_nom: "Cohorte 2024",
    porteur_nom: "Moussa Sène",
    statut: "termine",
    cree_le: "2024-06-10",
  },
  {
    id: 4,
    titre: "Presse d'Injection Plastique Recyclé Locale",
    resume: "Machine industrielle open-source adaptée aux ateliers d'artisans permettant de transformer les déchets plastiques polyéthylène en pavés autobloquants.",
    domaine: 4,
    domaine_nom: "Mécanique et maintenance",
    cohorte: 2026,
    cohorte_nom: "Cohorte 2026",
    porteur_nom: "Ibrahima Ndiaye",
    statut: "selectionne",
    cree_le: "2026-01-15",
  },
  {
    id: 5,
    titre: "Plateforme IA de Traduction Wolof-Français pour l'Agro-business",
    resume: "Modèle de synthèse et de reconnaissance vocale facilitant l'accès des groupements maraîchers ruraux aux cours officiels des marchés agricoles.",
    domaine: 5,
    domaine_nom: "TIC, IA et données",
    cohorte: 2026,
    cohorte_nom: "Cohorte 2026",
    porteur_nom: "Mariama Sy",
    statut: "depose",
    cree_le: "2026-02-01",
  },
  {
    id: 6,
    titre: "Banc Didactique pour Formation aux Énergies Nouvelles",
    resume: "Kit modulaire de travaux pratiques pour les lycées techniques sénégalais simulant la production photovoltaïque et le stockage hydrogène vert.",
    domaine: 6,
    domaine_nom: "Éducation et insertion",
    cohorte: 2024,
    cohorte_nom: "Cohorte 2024",
    porteur_nom: "Cheikh Tidiane Kane",
    statut: "prototype",
    cree_le: "2024-08-18",
  },
];

export function ProjetsPortfolioSection({ filters, chartsSlot }: Props) {
  const [projets, setProjets] = useState<ProjetPortfolioItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [searchQuery, setSearchQuery] = useState("");
  const [userStatut, setUserStatut] = useState<string | null>(null);
  const [userDomaine, setUserDomaine] = useState<string | null>(null);
  const [userCohorte, setUserCohorte] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 8;

  // Filtres effectifs combinant l'état local et les filtres URL
  const selectedStatut = userStatut ?? (filters.statut || "all");
  const selectedDomaine = userDomaine ?? (filters.domaine || "all");
  const selectedCohorte = userCohorte ?? (filters.cohorte || "all");

  // Chargement des projets réels depuis l'API
  useEffect(() => {
    let cancelled = false;
    async function loadData() {
      try {
        setIsLoading(true);
        const data = await fetchAll<ProjetPortfolioItem>("/projets/");
        if (!cancelled) {
          if (Array.isArray(data) && data.length > 0) {
            setProjets(data);
          } else {
            setProjets(MOCK_PROJETS);
          }
        }
      } catch {
        if (!cancelled) {
          setProjets(MOCK_PROJETS);
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }
    loadData();
    return () => {
      cancelled = true;
    };
  }, []);

  // Domaines uniques disponibles
  const domainesList = useMemo(() => {
    const set = new Set<string>();
    projets.forEach((p) => {
      if (p.domaine_nom) set.add(p.domaine_nom);
    });
    return Array.from(set).sort();
  }, [projets]);

  // Cohortes uniques disponibles
  const cohortesList = useMemo(() => {
    const set = new Set<string>();
    projets.forEach((p) => {
      if (p.cohorte_nom) set.add(p.cohorte_nom);
      else if (p.cohorte) set.add(String(p.cohorte));
    });
    return Array.from(set).sort();
  }, [projets]);

  // Filtrage combiné (Recherche + Statut + Domaine + Cohorte)
  const filteredProjets = useMemo(() => {
    return projets.filter((p) => {
      // 1. Recherche textuelle
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchTitle = p.titre?.toLowerCase().includes(query);
        const matchResume = p.resume?.toLowerCase().includes(query);
        const matchPorteur = p.porteur_nom?.toLowerCase().includes(query);
        if (!matchTitle && !matchResume && !matchPorteur) return false;
      }

      // 2. Filtre statut
      if (selectedStatut !== "all" && p.statut !== selectedStatut) {
        return false;
      }

      // 3. Filtre domaine
      if (selectedDomaine !== "all") {
        const dNorm = (p.domaine_nom || "").toLowerCase();
        if (!dNorm.includes(selectedDomaine.toLowerCase())) return false;
      }

      // 4. Filtre cohorte
      if (selectedCohorte !== "all") {
        const cNorm = (p.cohorte_nom || String(p.cohorte || "")).toLowerCase();
        if (!cNorm.includes(selectedCohorte.toLowerCase())) return false;
      }

      return true;
    });
  }, [projets, searchQuery, selectedStatut, selectedDomaine, selectedCohorte]);

  // Pagination
  const totalPages = Math.ceil(filteredProjets.length / pageSize) || 1;
  const paginatedProjets = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredProjets.slice(start, start + pageSize);
  }, [filteredProjets, currentPage, pageSize]);

  // Export CSV
  const handleExportCsv = () => {
    const headers = [
      "ID",
      "Titre",
      "Domaine",
      "Cohorte",
      "Porteur",
      "Statut",
      "Date de création",
      "Résumé",
    ];

    const rows = filteredProjets.map((p) => [
      p.id,
      `"${(p.titre || "").replace(/"/g, '""')}"`,
      `"${(p.domaine_nom || "").replace(/"/g, '""')}"`,
      `"${(p.cohorte_nom || p.cohorte || "").toString().replace(/"/g, '""')}"`,
      `"${(p.porteur_nom || "").replace(/"/g, '""')}"`,
      `"${(STATUTS_LABELS[p.statut]?.label || p.statut).replace(/"/g, '""')}"`,
      p.cree_le ? p.cree_le.slice(0, 10) : "",
      `"${(p.resume || "").replace(/"/g, '""')}"`,
    ]);

    const csvContent = "\uFEFF" + [headers.join(";"), ...rows.map((r) => r.join(";"))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `ciat_portefeuille_projets_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleResetFilters = () => {
    setSearchQuery("");
    setUserStatut("all");
    setUserDomaine("all");
    setUserCohorte("all");
    setCurrentPage(1);
  };

  const isFiltered =
    searchQuery.trim() !== "" ||
    selectedStatut !== "all" ||
    selectedDomaine !== "all" ||
    selectedCohorte !== "all";

  return (
    <div className="space-y-6">
      {/* 1. Emplacement des graphiques décisionnels au sommet */}
      {chartsSlot && <div className="space-y-4">{chartsSlot}</div>}

      {/* 2. Répertoire Opérationnel & Décisionnel des Projets */}
      <section
        aria-labelledby="portfolio-heading"
        className="rounded-2xl border border-[rgba(60,35,20,0.08)] bg-white shadow-xs overflow-hidden"
      >
        {/* En-tête du portefeuille */}
        <div className="border-b border-[rgba(60,35,20,0.06)] bg-[#FAF7F2]/60 px-5 py-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#612D10] text-[#FBF8F3] shadow-xs">
                <FolderGit2 className="h-5 w-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2
                    id="portfolio-heading"
                    className="font-serif text-lg font-bold text-[#21130D]"
                  >
                    Portefeuille des Projets CIAT
                  </h2>
                  <span className="rounded-full bg-[#C99A68]/20 px-2.5 py-0.5 text-xs font-bold text-[#612D10] tabular-nums">
                    {filteredProjets.length} {filteredProjets.length > 1 ? "projets" : "projet"}
                  </span>
                </div>
                <p className="text-xs text-[#5A4B42]">
                  Consultation détaillée, filières d&apos;excellence et avancement opérationnel
                </p>
              </div>
            </div>

            {/* Actions supérieures : Export CSV & Lien Galerie */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleExportCsv}
                className="inline-flex items-center gap-1.5 rounded-xl border border-[rgba(60,35,20,0.12)] bg-white px-3 py-1.5 text-xs font-semibold text-[#21130D] shadow-2xs hover:bg-[#FAF7F2] transition"
                title="Exporter la liste filtrée au format CSV"
              >
                <Download className="h-3.5 w-3.5 text-[#8C5E2D]" />
                <span className="hidden sm:inline">Exporter CSV</span>
              </button>

              <Link
                href="/galerie"
                className="inline-flex items-center gap-1.5 rounded-xl bg-[#21130D] px-3.5 py-1.5 text-xs font-semibold text-white shadow-xs hover:bg-[#3D2314] transition"
              >
                <Layers className="h-3.5 w-3.5 text-[#C99A68]" />
                <span className="hidden sm:inline">Vitrine Galerie</span>
                <ExternalLink className="h-3 w-3 opacity-70" />
              </Link>
            </div>
          </div>

          {/* Barre d'outils et de filtres instantanés */}
          <div className="mt-4 flex flex-col gap-2.5 lg:flex-row lg:items-center lg:justify-between">
            {/* Barre de recherche */}
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8C5E2D]/60" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                placeholder="Rechercher par titre, porteur, mot-clé..."
                className="w-full h-9.5 rounded-xl border border-[rgba(60,35,20,0.12)] bg-white pl-9 pr-8 text-xs text-[#21130D] placeholder:text-[#8C6D58]/60 focus:border-[#C99A68] focus:outline-hidden focus:ring-1 focus:ring-[#C99A68]"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#8C6D58] hover:text-[#21130D]"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

            {/* Sélecteurs rapides (Domaine, Cohorte, Statut) */}
            <div className="flex flex-wrap items-center gap-2">
              {/* Sélecteur Domaine */}
              <select
                value={selectedDomaine}
                onChange={(e) => {
                  setUserDomaine(e.target.value);
                  setCurrentPage(1);
                }}
                aria-label="Filtrer par filière d'excellence"
                className="h-9 rounded-xl border border-[rgba(60,35,20,0.12)] bg-white px-2.5 text-xs font-medium text-[#21130D] focus:border-[#C99A68] focus:outline-hidden"
              >
                <option value="all">Toutes les filières</option>
                {domainesList.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>

              {/* Sélecteur Cohorte */}
              <select
                value={selectedCohorte}
                onChange={(e) => {
                  setUserCohorte(e.target.value);
                  setCurrentPage(1);
                }}
                aria-label="Filtrer par promotion"
                className="h-9 rounded-xl border border-[rgba(60,35,20,0.12)] bg-white px-2.5 text-xs font-medium text-[#21130D] focus:border-[#C99A68] focus:outline-hidden"
              >
                <option value="all">Toutes les cohortes</option>
                {cohortesList.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>

              {/* Sélecteur Statut */}
              <select
                value={selectedStatut}
                onChange={(e) => {
                  setUserStatut(e.target.value);
                  setCurrentPage(1);
                }}
                aria-label="Filtrer par maturité"
                className="h-9 rounded-xl border border-[rgba(60,35,20,0.12)] bg-white px-2.5 text-xs font-medium text-[#21130D] focus:border-[#C99A68] focus:outline-hidden"
              >
                <option value="all">Tous les stades</option>
                {Object.entries(STATUTS_LABELS).map(([k, v]) => (
                  <option key={k} value={k}>
                    {v.label}
                  </option>
                ))}
              </select>

              {isFiltered && (
                <button
                  type="button"
                  onClick={handleResetFilters}
                  className="inline-flex h-9 items-center gap-1 rounded-xl bg-stone-100 px-2.5 text-xs font-medium text-[#B85D43] hover:bg-stone-200 transition"
                >
                  <X className="h-3.5 w-3.5" />
                  <span>Réinitialiser</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* 3. Tableau des projets */}
        <div className="overflow-x-auto">
          {isLoading ? (
            <div className="p-12 text-center">
              <div className="mx-auto h-8 w-8 animate-spin rounded-full border-3 border-[#C99A68]/30 border-t-[#612D10]" />
              <p className="mt-3 text-xs text-[#5A4B42]">Chargement du portefeuille de projets...</p>
            </div>
          ) : paginatedProjets.length === 0 ? (
            <div className="p-12 text-center">
              <p className="text-sm font-semibold text-[#21130D]">
                Aucun projet ne correspond à vos critères
              </p>
              <p className="mt-1 text-xs text-[#5A4B42]">
                Modifiez vos termes de recherche ou réinitialisez les filtres.
              </p>
              <button
                type="button"
                onClick={handleResetFilters}
                className="mt-3 inline-flex items-center gap-1 rounded-xl bg-[#612D10] px-3.5 py-1.5 text-xs font-semibold text-white shadow-xs"
              >
                Afficher tous les projets
              </button>
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[rgba(60,35,20,0.06)] bg-[#FAF7F2]/40 text-[11px] font-semibold uppercase tracking-wider text-[#5A4B42]">
                  <th scope="col" className="px-5 py-3">
                    Projet & Solution
                  </th>
                  <th scope="col" className="px-4 py-3 hidden md:table-cell">
                    Filière
                  </th>
                  <th scope="col" className="px-4 py-3 hidden sm:table-cell">
                    Promotion
                  </th>
                  <th scope="col" className="px-4 py-3 hidden lg:table-cell">
                    Porteur
                  </th>
                  <th scope="col" className="px-4 py-3">
                    Maturité
                  </th>
                  <th scope="col" className="px-4 py-3 hidden sm:table-cell text-right">
                    Date
                  </th>
                  <th scope="col" className="px-4 py-3 text-right">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[rgba(60,35,20,0.06)] text-xs">
                {paginatedProjets.map((projet) => {
                  const conf = STATUTS_LABELS[projet.statut] || {
                    label: projet.statut,
                    badgeClass: "bg-gray-100 text-gray-700 border-gray-200",
                  };

                  return (
                    <tr
                      key={projet.id}
                      className="transition-colors hover:bg-[#FAF7F2]/60 group"
                    >
                      {/* Titre & Résumé */}
                      <td className="px-5 py-3.5 max-w-xs sm:max-w-md">
                        <div className="font-semibold text-[#21130D] group-hover:text-[#612D10] transition-colors leading-snug">
                          {projet.titre}
                        </div>
                        {projet.resume && (
                          <p className="mt-1 line-clamp-1 text-[11px] text-[#5A4B42] leading-relaxed">
                            {projet.resume}
                          </p>
                        )}
                        {/* Tags mobiles */}
                        <div className="mt-1.5 flex flex-wrap gap-1.5 md:hidden">
                          {projet.domaine_nom && (
                            <span className="rounded bg-[#FAF7F2] px-1.5 py-0.5 text-[10px] text-[#8C5E2D]">
                              {projet.domaine_nom}
                            </span>
                          )}
                          {projet.porteur_nom && (
                            <span className="text-[10px] text-[#5A4B42]">
                              • {projet.porteur_nom}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Filière */}
                      <td className="px-4 py-3.5 hidden md:table-cell">
                        <span className="inline-flex items-center rounded-lg border border-[rgba(60,35,20,0.08)] bg-white px-2 py-0.5 text-[11px] font-medium text-[#21130D]">
                          {projet.domaine_nom || "Non renseigné"}
                        </span>
                      </td>

                      {/* Promotion */}
                      <td className="px-4 py-3.5 hidden sm:table-cell text-[#5A4B42] tabular-nums">
                        {projet.cohorte_nom || (projet.cohorte ? `Cohorte ${projet.cohorte}` : "—")}
                      </td>

                      {/* Porteur */}
                      <td className="px-4 py-3.5 hidden lg:table-cell text-[#21130D] font-medium">
                        {projet.porteur_nom || "Porteur CIAT"}
                      </td>

                      {/* Statut / Maturité */}
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[10px] font-bold ${conf.badgeClass}`}
                        >
                          {conf.label}
                        </span>
                      </td>

                      {/* Date */}
                      <td className="px-4 py-3.5 hidden sm:table-cell text-right text-[#5A4B42] tabular-nums whitespace-nowrap">
                        {projet.cree_le ? formatDate(projet.cree_le) : "—"}
                      </td>

                      {/* Action directe */}
                      <td className="px-4 py-3.5 text-right whitespace-nowrap">
                        <Link
                          href={`/incubateur/projets/${projet.id}`}
                          className="inline-flex items-center gap-1 rounded-lg border border-[rgba(60,35,20,0.12)] bg-white px-2.5 py-1 text-[11px] font-semibold text-[#612D10] hover:bg-[#612D10] hover:text-white transition shadow-2xs"
                          title={`Consulter le suivi du projet ${projet.titre}`}
                        >
                          <span>Suivi</span>
                          <ChevronRight className="h-3 w-3" />
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* 4. Pied de page & Pagination */}
        {!isLoading && filteredProjets.length > 0 && (
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between border-t border-[rgba(60,35,20,0.06)] bg-[#FAF7F2]/40 px-5 py-3 text-xs text-[#5A4B42]">
            <div>
              Affichage de{" "}
              <span className="font-semibold text-[#21130D]">
                {(currentPage - 1) * pageSize + 1}
              </span>{" "}
              à{" "}
              <span className="font-semibold text-[#21130D]">
                {Math.min(currentPage * pageSize, filteredProjets.length)}
              </span>{" "}
              sur{" "}
              <span className="font-semibold text-[#21130D]">
                {filteredProjets.length}
              </span>{" "}
              projets
            </div>

            {totalPages > 1 && (
              <div className="flex items-center gap-1.5 self-end sm:self-auto">
                <button
                  type="button"
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-[rgba(60,35,20,0.12)] bg-white text-[#21130D] disabled:opacity-40 hover:bg-[#FAF7F2]"
                  aria-label="Page précédente"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <span className="px-2 font-medium tabular-nums">
                  {currentPage} / {totalPages}
                </span>
                <button
                  type="button"
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-[rgba(60,35,20,0.12)] bg-white text-[#21130D] disabled:opacity-40 hover:bg-[#FAF7F2]"
                  aria-label="Page suivante"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            )}
          </div>
        )}
      </section>
    </div>
  );
}
