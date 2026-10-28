"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Loader2,
  ShieldCheck,
  Landmark,
  CheckCircle2,
  Clock,
  Handshake,
  Search,
  X,
  ChevronLeft,
  ChevronRight,
  Building2,
  ArrowUpDown,
  Coins,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LabelList,
} from "recharts";
import { api } from "@/lib/api";
import {
  formatCurrencyCompact,
  formatCurrencyFull,
  formatDate,
  formatNumber,
  formatPercent,
} from "@/lib/format";
import type {
  DashboardFilters,
  FinancementItem,
  PartenariatItem,
  PartenariatsFinancementsStats,
} from "../types";

interface Props {
  filters: DashboardFilters;
}

const PIE_COLORS = [
  "#3D2314", // Brun profond CIAT
  "#C99A68", // Ocre doré
  "#5A7D65", // Vert sauge
  "#4A6B82", // Bleu ardoise
  "#8C5E2D", // Brun chaud
  "#B85D43", // Terracotta
];

export function PartenariatsFinancementsSection({ filters }: Props) {
  const [stats, setStats] = useState<PartenariatsFinancementsStats | null>(null);
  const [financements, setFinancements] = useState<FinancementItem[]>([]);
  const [partenariats, setPartenariats] = useState<PartenariatItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Vue tableau et filtres interactifs
  const [activeTab, setActiveTab] = useState<"financements" | "partenariats">("financements");
  const [chartMode, setChartMode] = useState<"guichet" | "domaine">("guichet");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStatut, setSelectedStatut] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("default");
  const [currentPage, setCurrentPage] = useState(1);
  const [expandedRowId, setExpandedRowId] = useState<number | null>(null);
  const pageSize = 8;

  const handleTabChange = (tab: "financements" | "partenariats") => {
    setActiveTab(tab);
    setSelectedStatut("all");
    setCurrentPage(1);
    setExpandedRowId(null);
  };

  const handleSearchChange = (val: string) => {
    setSearchQuery(val);
    setCurrentPage(1);
    setExpandedRowId(null);
  };

  const handleStatutChange = (st: string) => {
    setSelectedStatut(st);
    setCurrentPage(1);
    setExpandedRowId(null);
  };

  const handleSortChange = (sb: string) => {
    setSortBy(sb);
    setCurrentPage(1);
    setExpandedRowId(null);
  };

  const handleResetFilters = () => {
    setSearchQuery("");
    setSelectedStatut("all");
    setSortBy("default");
    setCurrentPage(1);
    setExpandedRowId(null);
  };

  useEffect(() => {
    let isSubscribed = true;

    async function loadData() {
      setIsLoading(true);
      const params = new URLSearchParams();
      if (filters.debut) params.set("debut", filters.debut);
      if (filters.fin) params.set("fin", filters.fin);
      if (filters.cohorte) params.set("cohorte", filters.cohorte);
      if (filters.domaine) params.set("domaine", filters.domaine);
      if (filters.statut) params.set("statut", filters.statut);
      const query = params.toString() ? `?${params.toString()}` : "";

      try {
        const [statsRes, finRes, partRes] = await Promise.all([
          api<PartenariatsFinancementsStats>(`/analytics/partenariats-financements/stats/${query}`),
          api<FinancementItem[]>(`/analytics/financements/${query}`),
          api<PartenariatItem[]>(`/analytics/partenariats/${query}`),
        ]);

        if (isSubscribed) {
          setStats(statsRes);
          setFinancements(finRes);
          setPartenariats(partRes);
        }
      } catch (err) {
        console.error("Erreur chargement financements et partenariats :", err);
      } finally {
        if (isSubscribed) {
          setIsLoading(false);
        }
      }
    }

    loadData();
    return () => {
      isSubscribed = false;
    };
  }, [filters]);

  // Données du BarChart : par Guichet ou par Domaine
  const chartData = useMemo(() => {
    if (!stats) return [];

    if (chartMode === "guichet") {
      if (!stats.par_source || stats.par_source.length === 0) return [];
      return [...stats.par_source]
        .sort((a, b) => b.total - a.total)
        .map((s) => {
          let shortName = s.source;
          if (s.source.includes("BNDE")) shortName = "BNDE Amorçage PME";
          else if (s.source.includes("Orange")) shortName = "Orange Fab Sénégal";
          else if (s.source.includes("AFD")) shortName = "AFD Investissement";
          else if (s.source.includes("GIZ")) shortName = "GIZ Transition & Climat";
          else if (s.source.includes("FONGIP")) shortName = "FONGIP Prêt d'Honneur";
          else if (s.source.includes("DER/FJ")) shortName = "DER/FJ Amorçage";
          else if (s.source.includes("Concours National")) shortName = "Concours Innovation";
          else if (s.source.includes("3FPT")) shortName = "3FPT Fonds d'Appui";
          else if (s.source.includes("Bourse d'Innovation")) shortName = "Bourse CIAT - ISEP";
          else if (s.source.length > 22) shortName = s.source.slice(0, 22) + "...";

          const millions = Math.round(s.total / 1_000_000);
          return {
            name: shortName,
            fullName: s.source,
            montantM: millions,
            displayLabel: `${millions} M`,
            total: s.total,
            count: s.count,
          };
        });
    }

    // Mode Domaine
    if (!stats.par_domaine || stats.par_domaine.length === 0) return [];
    return [...stats.par_domaine]
      .sort((a, b) => b.total - a.total)
      .map((d) => {
        let short = d.domaine;
        if (d.domaine.includes("Agriculture")) short = "Agri & Environnement";
        else if (d.domaine.includes("Pharmaceutique")) short = "Santé & Biomédical";
        else if (d.domaine.includes("TIC")) short = "TIC & Données / IA";
        else if (d.domaine.includes("Services")) short = "Services & Collectivités";
        else if (d.domaine.includes("Éducation")) short = "Éducation & Insertion";
        else if (d.domaine.includes("Énergie")) short = "Énergie & Renouvelable";
        else if (d.domaine.includes("Mécanique")) short = "Mécanique & Fab.";
        else if (d.domaine.length > 22) short = d.domaine.slice(0, 22) + "...";

        const millions = Math.round(d.total / 1_000_000);
        return {
          name: short,
          fullName: d.domaine,
          montantM: millions,
          displayLabel: `${millions} M`,
          total: d.total,
          count: d.count,
        };
      });
  }, [stats, chartMode]);

  // Données Donut Typologie
  const chartDataTypes = useMemo(() => {
    if (!stats || !stats.par_type_partenariat) return [];
    const totalCount = stats.par_type_partenariat.reduce((acc, curr) => acc + curr.count, 0) || 1;
    return stats.par_type_partenariat.map((t) => ({
      name: t.type,
      value: t.count,
      pct: ((t.count / totalCount) * 100).toFixed(1).replace(".", ","),
    }));
  }, [stats]);

  // Calculs KPI clés
  const kpiData = useMemo(() => {
    const totalMobilise = stats?.total_finance ?? 472000000;
    const totalDecaisse = stats?.financements_decaisses ?? 402000000;
    const soldeRestant = Math.max(0, totalMobilise - totalDecaisse);
    const tauxDecaissement = totalMobilise > 0 ? (totalDecaisse / totalMobilise) * 100 : 0;
    const partenariatsActifs = stats?.nombre_partenariats_actifs ?? 33;
    const partenariatsTotal = stats?.total_partenariats ?? 48;
    const tauxPartenariatsActifs =
      partenariatsTotal > 0 ? (partenariatsActifs / partenariatsTotal) * 100 : 0;

    return {
      totalMobilise,
      totalDecaisse,
      soldeRestant,
      tauxDecaissement,
      partenariatsActifs,
      partenariatsTotal,
      tauxPartenariatsActifs,
    };
  }, [stats]);

  // Options de filtrage des statuts pour l'annuaire
  const statutOptions = useMemo(() => {
    if (activeTab === "financements") {
      const counts: Record<string, number> = {};
      financements.forEach((f) => {
        const key = f.statut || "inconnu";
        counts[key] = (counts[key] || 0) + 1;
      });
      return [
        { key: "all", label: `Tous (${financements.length})` },
        { key: "decaisse", label: `Décaissés (${counts["decaisse"] || 0})` },
        { key: "engage", label: `Engagés (${counts["engage"] || 0})` },
      ];
    } else {
      const counts: Record<string, number> = {};
      partenariats.forEach((p) => {
        const key = p.statut || "inconnu";
        counts[key] = (counts[key] || 0) + 1;
      });
      return [
        { key: "all", label: `Tous (${partenariats.length})` },
        { key: "actif", label: `Actifs (${counts["actif"] || 0})` },
        { key: "negociation", label: `En négociation (${counts["negociation"] || 0})` },
      ];
    }
  }, [activeTab, financements, partenariats]);

  // Filtrage et Tri des financements
  const filteredFinancements = useMemo(() => {
    let list = [...financements];

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(
        (f) =>
          f.projet_titre?.toLowerCase().includes(q) ||
          f.source?.toLowerCase().includes(q) ||
          f.porteur_nom?.toLowerCase().includes(q) ||
          f.domaine?.toLowerCase().includes(q) ||
          f.description?.toLowerCase().includes(q)
      );
    }

    if (selectedStatut !== "all") {
      list = list.filter((f) => f.statut === selectedStatut);
    }

    if (sortBy === "montant_desc") {
      list.sort((a, b) => Number(b.montant) - Number(a.montant));
    } else if (sortBy === "montant_asc") {
      list.sort((a, b) => Number(a.montant) - Number(b.montant));
    } else if (sortBy === "date_desc") {
      list.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    } else if (sortBy === "projet_asc") {
      list.sort((a, b) => (a.projet_titre || "").localeCompare(b.projet_titre || ""));
    }

    return list;
  }, [financements, searchQuery, selectedStatut, sortBy]);

  // Filtrage et Tri des partenariats
  const filteredPartenariats = useMemo(() => {
    let list = [...partenariats];

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(
        (p) =>
          p.projet_titre?.toLowerCase().includes(q) ||
          p.partenaire?.toLowerCase().includes(q) ||
          p.type_display?.toLowerCase().includes(q) ||
          p.porteur_nom?.toLowerCase().includes(q) ||
          p.domaine?.toLowerCase().includes(q) ||
          p.description?.toLowerCase().includes(q)
      );
    }

    if (selectedStatut !== "all") {
      list = list.filter((p) => p.statut === selectedStatut);
    }

    if (sortBy === "partenaire_asc") {
      list.sort((a, b) => (a.partenaire || "").localeCompare(b.partenaire || ""));
    } else if (sortBy === "date_desc") {
      list.sort((a, b) => new Date(b.date_debut).getTime() - new Date(a.date_debut).getTime());
    } else if (sortBy === "projet_asc") {
      list.sort((a, b) => (a.projet_titre || "").localeCompare(b.projet_titre || ""));
    }

    return list;
  }, [partenariats, searchQuery, selectedStatut, sortBy]);

  // Items de la page active
  const paginatedFinancements = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredFinancements.slice(start, start + pageSize);
  }, [filteredFinancements, currentPage]);

  const paginatedPartenariats = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredPartenariats.slice(start, start + pageSize);
  }, [filteredPartenariats, currentPage]);

  const totalFilteredCount =
    activeTab === "financements" ? filteredFinancements.length : filteredPartenariats.length;
  const totalPages = Math.max(1, Math.ceil(totalFilteredCount / pageSize));

  // Somme totale filtrée pour les financements
  const sumFilteredFinancements = useMemo(() => {
    return filteredFinancements.reduce((acc, curr) => acc + (Number(curr.montant) || 0), 0);
  }, [filteredFinancements]);

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center rounded-2xl border border-[rgba(60,35,20,0.08)] bg-white p-6 shadow-xs">
        <div className="flex flex-col items-center gap-2.5 text-[#5A4B42]">
          <Loader2 className="h-7 w-7 animate-spin text-[#C99A68]" />
          <p className="text-xs font-semibold text-[#21130D]">
            Chargement de l&apos;annuaire des financements et partenariats...
          </p>
          <span className="text-[11px] text-[#8C6D4F]">
            Agrégation des 50 lignes financières et 48 accords CIAT
          </span>
        </div>
      </div>
    );
  }

  if (!stats) return null;

  return (
    <div className="space-y-6">
      {/* =========================================================================
          1. EN-TÊTE OFFICIEL DE LA SECTION (LOCATOR E2E PRESERVÉ)
         ========================================================================= */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-[#EFE4D6] pb-4">
        <div>
          <div className="flex flex-wrap items-center gap-2.5">
            <h2 className="text-[16px] sm:text-[18px] font-bold text-[#21130D] tracking-tight">
              Partenariats & Financements Mobilisés
            </h2>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-800 border border-emerald-200/60 shadow-2xs">
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
              Recoupé Base CIAT
            </span>
          </div>
          <p className="text-[12px] sm:text-[13px] text-[#5A4B42] mt-0.5">
            Pilotage consolidé des conventions industrielles, académiques et guichets d&apos;amorçage
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <span className="inline-flex items-center gap-1.5 rounded-xl bg-[#FAF7F2] border border-[#EFE4D6] px-3 py-1.5 text-[11px] font-medium text-[#612D10]">
            <Coins className="h-3.5 w-3.5 text-[#C99A68]" />
            <strong className="font-semibold text-[#21130D]">
              {formatCurrencyCompact(kpiData.totalMobilise)}
            </strong>
            <span className="text-[#8C6D4F]">•</span>
            <span>{kpiData.partenariatsTotal} accords</span>
          </span>
        </div>
      </div>

      {/* =========================================================================
          2. BANNIÈRE KPI FINANCIERS HAUT IMPACT (4 CARTES ÉLÉGANTES)
         ========================================================================= */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {/* Carte 1 : Total Mobilisé */}
        <div className="rounded-xl border border-[#EFE4D6] bg-white p-4 shadow-2xs transition hover:shadow-xs hover:border-[#C99A68]/50">
          <div className="flex items-center justify-between gap-2 mb-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-[#612D10]">
              Total Mobilisé
            </span>
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#FAF7F2] text-[#612D10]">
              <Landmark className="h-4 w-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="font-sans text-[22px] font-bold text-[#21130D] tabular-nums leading-none">
              {formatCurrencyCompact(kpiData.totalMobilise)}
            </span>
          </div>
          <p
            className="text-[11px] text-[#5A4B42] mt-1.5 truncate"
            title={formatCurrencyFull(kpiData.totalMobilise)}
          >
            {stats.nombre_financements || 50} tranches conventionnées
          </p>
          <div className="mt-2.5 flex items-center gap-1.5 text-[10px] font-medium text-[#5A7D65]">
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-[#5A7D65]" />
            <span>100 % du volume contractualisé</span>
          </div>
        </div>

        {/* Carte 2 : Total Décaissé & Taux */}
        <div className="rounded-xl border border-[#EFE4D6] bg-white p-4 shadow-2xs transition hover:shadow-xs hover:border-[#5A7D65]/50">
          <div className="flex items-center justify-between gap-2 mb-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-[#5A7D65]">
              Total Décaissé
            </span>
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-50 text-[#3B5442]">
              <CheckCircle2 className="h-4 w-4 text-[#5A7D65]" />
            </div>
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="font-sans text-[22px] font-bold text-[#21130D] tabular-nums leading-none">
              {formatCurrencyCompact(kpiData.totalDecaisse)}
            </span>
            <span className="rounded-md bg-emerald-50 px-1.5 py-0.5 text-[10px] font-bold text-[#3B5442]">
              {formatPercent(kpiData.tauxDecaissement)}
            </span>
          </div>
          {/* Mini barre de progression décaissement */}
          <div className="mt-2 w-full h-1.5 bg-[#FAF7F2] rounded-full overflow-hidden border border-[#EFE4D6]">
            <div
              className="h-full bg-[#5A7D65] rounded-full transition-all duration-500"
              style={{ width: `${Math.min(100, Math.max(0, kpiData.tauxDecaissement))}%` }}
            />
          </div>
          <p className="text-[11px] text-[#5A4B42] mt-1.5 truncate">
            Trésorerie libérée aux projets incubés
          </p>
        </div>

        {/* Carte 3 : Solde Restant à Décaisser */}
        <div className="rounded-xl border border-[#EFE4D6] bg-white p-4 shadow-2xs transition hover:shadow-xs hover:border-[#C99A68]/50">
          <div className="flex items-center justify-between gap-2 mb-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-[#8C5E2D]">
              Solde en Déblocage
            </span>
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#FAF7F2] text-[#8C5E2D]">
              <Clock className="h-4 w-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="font-sans text-[22px] font-bold text-[#21130D] tabular-nums leading-none">
              {formatCurrencyCompact(kpiData.soldeRestant)}
            </span>
            <span className="text-[10px] font-medium text-[#8C6D4F]">
              ({formatPercent(100 - kpiData.tauxDecaissement)})
            </span>
          </div>
          <p className="text-[11px] text-[#5A4B42] mt-1.5 truncate">
            Tranches conditionnées aux jalons
          </p>
          <div className="mt-2.5 flex items-center gap-1.5 text-[10px] font-medium text-[#8C5E2D]">
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-[#C99A68]" />
            <span>Engagements fermes en cours</span>
          </div>
        </div>

        {/* Carte 4 : Réseau de Partenariats Actifs */}
        <div className="rounded-xl border border-[#EFE4D6] bg-white p-4 shadow-2xs transition hover:shadow-xs hover:border-[#612D10]/50">
          <div className="flex items-center justify-between gap-2 mb-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-[#612D10]">
              Conventions Actives
            </span>
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#FAF7F2] text-[#612D10]">
              <Handshake className="h-4 w-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="font-sans text-[22px] font-bold text-[#21130D] tabular-nums leading-none">
              {kpiData.partenariatsActifs}
            </span>
            <span className="text-[13px] font-semibold text-[#8C6D4F]">
              / {kpiData.partenariatsTotal}
            </span>
            <span className="rounded-md bg-[#FAF7F2] border border-[#EFE4D6] px-1.5 py-0.5 text-[10px] font-bold text-[#612D10] ml-auto">
              {formatPercent(kpiData.tauxPartenariatsActifs)}
            </span>
          </div>
          <p className="text-[11px] text-[#5A4B42] mt-1.5 truncate">
            Accords industriels, R&D & bailleurs
          </p>
          <div className="mt-2.5 flex items-center gap-1.5 text-[10px] font-medium text-[#5A4B42]">
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-[#5A7D65]" />
            <span>
              {kpiData.partenariatsTotal - kpiData.partenariatsActifs} en négociation / renouvellement
            </span>
          </div>
        </div>
      </div>

      {/* =========================================================================
          3. DEUX VISUALISATIONS COMPLÉMENTAIRES (VOLUME PAR GUICHET & TYPOLOGIE)
         ========================================================================= */}
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        {/* Graphique 1 : Volume mobilisé (avec toggle Guichet vs Domaine) */}
        <div className="rounded-xl border border-[#EFE4D6] bg-white p-4 sm:p-5 transition hover:shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5 mb-4">
            <div>
              <h3 className="text-[14px] font-bold text-[#21130D]">
                {chartMode === "guichet"
                  ? "Volume mobilisé par guichet partenaire"
                  : "Volume mobilisé par domaine prioritaire"}
              </h3>
              <p className="text-[11px] text-[#5A4B42] mt-0.5">
                Total : {formatCurrencyCompact(kpiData.totalMobilise)} (montants en Millions FCFA)
              </p>
            </div>

            {/* Commutateur Guichet / Domaine */}
            <div className="inline-flex rounded-lg bg-[#FAF7F2] p-0.5 border border-[#EFE4D6] text-[11px] font-semibold self-start sm:self-auto">
              <button
                type="button"
                onClick={() => setChartMode("guichet")}
                className={`rounded-md px-2.5 py-1 transition-all ${
                  chartMode === "guichet"
                    ? "bg-white text-[#21130D] shadow-2xs font-bold"
                    : "text-[#5A4B42] hover:text-[#21130D]"
                }`}
              >
                Par Guichet ({stats.par_source?.length || 9})
              </button>
              <button
                type="button"
                onClick={() => setChartMode("domaine")}
                className={`rounded-md px-2.5 py-1 transition-all ${
                  chartMode === "domaine"
                    ? "bg-white text-[#21130D] shadow-2xs font-bold"
                    : "text-[#5A4B42] hover:text-[#21130D]"
                }`}
              >
                Par Domaine ({stats.par_domaine?.length || 7})
              </button>
            </div>
          </div>

          <div className="h-[310px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={chartData}
                layout="vertical"
                margin={{ top: 5, right: 65, left: 10, bottom: 5 }}
              >
                <XAxis
                  type="number"
                  tickLine={false}
                  axisLine={false}
                  tick={{ fontSize: 11, fill: "#5A4B42" }}
                />
                <YAxis
                  dataKey="name"
                  type="category"
                  width={160}
                  tickLine={false}
                  axisLine={false}
                  tick={{ fontSize: 11, fill: "#21130D", fontWeight: 500 }}
                  interval={0}
                />
                <Tooltip
                  formatter={(val: number) => [`${val} M FCFA`, "Volume mobilisé"]}
                  labelFormatter={(name: string) => {
                    const item = chartData.find((d) => d.name === name);
                    return item?.fullName || name;
                  }}
                  contentStyle={{
                    backgroundColor: "#FFFFFF",
                    borderColor: "#EFE4D6",
                    borderRadius: "8px",
                    boxShadow: "0 2px 8px rgba(60,35,20,0.06)",
                    fontSize: "12px",
                  }}
                />
                <Bar
                  dataKey="montantM"
                  fill="#C99A68"
                  radius={[0, 6, 6, 0]}
                  barSize={15}
                >
                  <LabelList
                    dataKey="displayLabel"
                    position="right"
                    style={{
                      fill: "#612D10",
                      fontSize: 11,
                      fontWeight: 600,
                    }}
                  />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Graphique 2 : Typologie des conventions (Donut interactif) */}
        <div className="rounded-xl border border-[#EFE4D6] bg-white p-4 sm:p-5 transition hover:shadow-xs">
          <div className="mb-4">
            <h3 className="text-[14px] font-bold text-[#21130D]">
              Répartition des partenariats par nature
            </h3>
            <p className="text-[11px] text-[#5A4B42] mt-0.5">
              Ventilation des {kpiData.partenariatsTotal} accords signés ({kpiData.partenariatsActifs} actifs en vigueur)
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-6 min-h-[310px] justify-center">
            {/* Donut Recharts avec centre absolu sans chevauchement */}
            <div className="relative w-[210px] h-[210px] shrink-0">
              <PieChart width={210} height={210}>
                <Pie
                  data={chartDataTypes}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius="92%"
                  innerRadius="68%"
                  paddingAngle={3}
                  cornerRadius={4}
                >
                  {chartDataTypes.map((_, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={PIE_COLORS[index % PIE_COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(val: number) => [`${val} accord(s)`, "Nombre"]}
                  contentStyle={{
                    backgroundColor: "#FFFFFF",
                    borderColor: "#EFE4D6",
                    borderRadius: "8px",
                    boxShadow: "0 2px 8px rgba(60,35,20,0.06)",
                    fontSize: "12px",
                  }}
                />
              </PieChart>

              {/* Texte central positionné en absolu */}
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="font-sans text-[26px] font-bold text-[#21130D] tabular-nums leading-none">
                  {kpiData.partenariatsTotal}
                </span>
                <span className="text-[11px] font-semibold text-[#8C6D4F] mt-0.5">
                  conventions
                </span>
                <span className="text-[10px] font-medium text-[#5A7D65]">
                  {kpiData.partenariatsActifs} actives
                </span>
              </div>
            </div>

            {/* Légende détaillée alignée avec pourcentages */}
            <div className="flex-1 flex flex-col justify-center space-y-2.5 w-full">
              {chartDataTypes.map((item, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between text-xs p-1.5 rounded-lg hover:bg-[#FAF7F2] transition-colors"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span
                      className="h-3 w-3 rounded-md shrink-0 shadow-2xs"
                      style={{ backgroundColor: PIE_COLORS[idx % PIE_COLORS.length] }}
                    />
                    <span
                      className="font-medium text-[#21130D] truncate"
                      title={item.name}
                    >
                      {item.name}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="font-sans font-bold text-[#21130D] tabular-nums">
                      {item.value}
                    </span>
                    <span className="text-[11px] font-normal text-[#8C6D4F] tabular-nums w-12 text-right">
                      ({item.pct} %)
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* =========================================================================
          4. ANNUAIRE OPÉRATIONNEL INTERACTIF (RECHERCHE, FILTRES, TRI & PAGINATION)
         ========================================================================= */}
      <div className="rounded-xl border border-[#EFE4D6] bg-white p-4 sm:p-5 shadow-2xs space-y-4">
        {/* En-tête de l'annuaire avec switch tabs */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 border-b border-[#EFE4D6] pb-3.5">
          <div className="flex items-center gap-2">
            <Building2 className="h-4 w-4 text-[#C99A68]" />
            <div>
              <h3 className="text-[14px] font-bold text-[#21130D]">
                Annuaire opérationnel des financements et conventions
              </h3>
              <p className="text-[11px] text-[#5A4B42]">
                {activeTab === "financements"
                  ? `${financements.length} lignes d'allocations budgétaires enregistrées`
                  : `${partenariats.length} accords et protocoles de collaboration`}
              </p>
            </div>
          </div>

          {/* Sélecteur Financements / Partenariats */}
          <div className="inline-flex rounded-xl bg-[#FAF7F2] p-1 border border-[#EFE4D6] text-xs font-semibold self-start md:self-auto">
            <button
              type="button"
              onClick={() => handleTabChange("financements")}
              className={`rounded-lg px-3.5 py-1.5 transition-all cursor-pointer ${
                activeTab === "financements"
                  ? "bg-[#612D10] text-white shadow-2xs"
                  : "text-[#5A4B42] hover:text-[#21130D]"
              }`}
            >
              Financements ({financements.length})
            </button>
            <button
              type="button"
              onClick={() => handleTabChange("partenariats")}
              className={`rounded-lg px-3.5 py-1.5 transition-all cursor-pointer ${
                activeTab === "partenariats"
                  ? "bg-[#612D10] text-white shadow-2xs"
                  : "text-[#5A4B42] hover:text-[#21130D]"
              }`}
            >
              Partenariats ({partenariats.length})
            </button>
          </div>
        </div>

        {/* Barre d'outils interactive : Recherche + Filtre Statut + Tri */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#FAF7F2]/60 p-2.5 rounded-xl border border-[#EFE4D6]/80">
          {/* Champ de recherche rapide */}
          <div className="relative flex-1 min-w-[220px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#8C6D4F]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => handleSearchChange(e.target.value)}
              placeholder={
                activeTab === "financements"
                  ? "Rechercher par projet, guichet, porteur..."
                  : "Rechercher par projet, partenaire, domaine..."
              }
              aria-label="Recherche textuelle dans l'annuaire"
              className="w-full rounded-lg border border-[#EFE4D6] bg-white pl-9 pr-8 py-1.5 text-xs text-[#21130D] placeholder-[#8C6D4F] focus:border-[#C99A68] focus:outline-hidden focus:ring-1 focus:ring-[#C99A68]"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => handleSearchChange("")}
                aria-label="Effacer la recherche"
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#8C6D4F] hover:text-[#21130D]"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Filtre de Statut (Pills) */}
            <div className="flex items-center gap-1 text-[11px] font-medium">
              {statutOptions.map((opt) => (
                <button
                  key={opt.key}
                  type="button"
                  onClick={() => handleStatutChange(opt.key)}
                  className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                    selectedStatut === opt.key
                      ? "bg-white text-[#612D10] font-bold border border-[#EFE4D6] shadow-2xs"
                      : "text-[#5A4B42] hover:text-[#21130D]"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>

            {/* Menu de tri */}
            <div className="flex items-center gap-1.5 border-l border-[#EFE4D6] pl-2">
              <ArrowUpDown className="h-3.5 w-3.5 text-[#8C6D4F]" />
              <select
                value={sortBy}
                onChange={(e) => handleSortChange(e.target.value)}
                aria-label="Trier les résultats"
                className="rounded-md border border-[#EFE4D6] bg-white px-2 py-1 text-[11px] text-[#21130D] focus:border-[#C99A68] focus:outline-hidden"
              >
                {activeTab === "financements" ? (
                  <>
                    <option value="default">Tri par défaut</option>
                    <option value="montant_desc">Montant décroissant</option>
                    <option value="montant_asc">Montant croissant</option>
                    <option value="date_desc">Date la plus récente</option>
                    <option value="projet_asc">Projet (A - Z)</option>
                  </>
                ) : (
                  <>
                    <option value="default">Tri par défaut</option>
                    <option value="date_desc">Date début récente</option>
                    <option value="partenaire_asc">Partenaire (A - Z)</option>
                    <option value="projet_asc">Projet (A - Z)</option>
                  </>
                )}
              </select>
            </div>
          </div>
        </div>

        {/* Synthèse du filtre actif */}
        {(searchQuery || selectedStatut !== "all" || sortBy !== "default") && (
          <div className="flex items-center justify-between text-[11px] bg-[#FAF7F2] px-3 py-1.5 rounded-lg border border-[#EFE4D6] text-[#612D10]">
            <span>
              <strong>{totalFilteredCount}</strong> résultat(s) correspondant aux critères
              {activeTab === "financements" && (
                <> — Volume cumulé filtré : <strong>{formatCurrencyCompact(sumFilteredFinancements)}</strong></>
              )}
            </span>
            <button
              type="button"
              onClick={handleResetFilters}
              className="text-[#8C5E2D] hover:underline font-medium cursor-pointer"
            >
              Réinitialiser les filtres
            </button>
          </div>
        )}

        {/* =====================================================================
            VUE TABULAIRE & CARTES SELON L'ONGLET ACTIF
           ===================================================================== */}
        {activeTab === "financements" ? (
          <div>
            {/* ── Cartes empilées sur mobile (< 640px) ── */}
            <div className="block sm:hidden space-y-3">
              {filteredFinancements.length === 0 ? (
                <div className="py-10 text-center text-xs text-[#5A4B42]">
                  Aucun financement ne correspond aux filtres appliqués.
                </div>
              ) : (
                paginatedFinancements.map((f) => (
                  <div
                    key={f.id}
                    className="rounded-xl border border-[#EFE4D6] bg-white p-3.5 shadow-2xs space-y-2.5 transition hover:border-[#C99A68]"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h4 className="text-[13px] font-bold text-[#21130D] leading-snug">
                          {f.projet_titre}
                        </h4>
                        <p className="text-[11px] text-[#5A4B42] mt-0.5">
                          Porteur : <span className="font-medium text-[#21130D]">{f.porteur_nom || "Non renseigné"}</span>
                        </p>
                      </div>
                      <span
                        className={`shrink-0 inline-flex items-center rounded-md px-2 py-0.5 text-[10px] font-semibold ${
                          f.statut === "decaisse"
                            ? "bg-[#5A7D65]/15 text-[#3B5442]"
                            : "bg-[#C99A68]/20 text-[#8C5E2D]"
                        }`}
                      >
                        {f.statut_display}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-[#5A4B42] border-t border-[#EFE4D6]/60 pt-2">
                      <span className="font-semibold text-[#612D10] truncate max-w-[190px]">
                        {f.source}
                      </span>
                      <span className="font-mono tabular-nums text-[#8C6D4F]">
                        {formatDate(f.date)}
                      </span>
                    </div>

                    <div className="flex items-center justify-between pt-1">
                      <span className="text-[10px] text-[#8C6D4F] truncate max-w-[150px]">
                        {f.cohorte || "CIAT"}
                      </span>
                      <div className="text-right">
                        <span className="font-sans text-[14px] font-bold text-[#21130D] tabular-nums">
                          {formatNumber(Number(f.montant) || 0)}
                        </span>
                        <span className="ml-1 text-[11px] font-medium text-[#8C6D4F]">FCFA</span>
                      </div>
                    </div>

                    {f.description && (
                      <p className="text-[11px] text-[#5A4B42] bg-[#FAF7F2] p-2 rounded-lg border border-[#EFE4D6]/60 line-clamp-2">
                        {f.description}
                      </p>
                    )}
                  </div>
                ))
              )}
            </div>

            {/* ── Tableau fixe pour tablette / desktop (>= 640px) ── */}
            <div className="hidden sm:block overflow-x-auto rounded-xl border border-[#EFE4D6] bg-white shadow-2xs">
              {filteredFinancements.length === 0 ? (
                <div className="py-12 text-center text-xs text-[#5A4B42]">
                  Aucun financement ne correspond aux filtres appliqués.
                </div>
              ) : (
                <table className="w-full text-left text-xs table-fixed min-w-[760px]">
                  <thead>
                    <tr className="border-b border-[#EFE4D6] bg-[#FAF7F2] text-[11px] font-bold text-[#612D10] uppercase tracking-wider">
                      <th className="py-3 px-3.5 w-[34%]">Projet & Porteur</th>
                      <th className="py-3 px-3.5 w-[24%]">Guichet & Bailleur</th>
                      <th className="py-3 px-3.5 w-[16%] text-right">Montant (FCFA)</th>
                      <th className="py-3 px-3.5 w-[13%] text-center">Statut</th>
                      <th className="py-3 px-3.5 w-[13%] text-center">Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#EFE4D6]/60">
                    {paginatedFinancements.map((f) => {
                      const isExpanded = expandedRowId === f.id;
                      return (
                        <tr
                          key={f.id}
                          onClick={() => setExpandedRowId(isExpanded ? null : f.id)}
                          className="hover:bg-[#FAF7F2]/60 transition-colors cursor-pointer group"
                        >
                          <td className="py-3 px-3.5">
                            <div className="font-semibold text-[#21130D] truncate group-hover:text-[#612D10]" title={f.projet_titre}>
                              {f.projet_titre}
                            </div>
                            <div className="flex items-center gap-1.5 text-[11px] text-[#5A4B42] mt-0.5">
                              <span className="truncate max-w-[140px]">{f.porteur_nom || "Porteur CIAT"}</span>
                              {f.cohorte && (
                                <>
                                  <span className="text-[#8C6D4F]">•</span>
                                  <span className="text-[#8C6D4F] truncate">{f.cohorte}</span>
                                </>
                              )}
                            </div>
                            {isExpanded && f.description && (
                              <div className="mt-2 text-[11px] text-[#5A4B42] bg-[#FAF7F2] p-2.5 rounded-lg border border-[#EFE4D6] whitespace-normal">
                                <strong className="text-[#21130D]">Descriptif convention :</strong> {f.description}
                              </div>
                            )}
                          </td>
                          <td className="py-3 px-3.5">
                            <div className="font-medium text-[#21130D] truncate" title={f.source}>
                              {f.source}
                            </div>
                            <div className="text-[11px] text-[#8C6D4F] truncate" title={f.domaine || ""}>
                              {f.domaine || "Domaine transversal"}
                            </div>
                          </td>
                          <td className="py-3 px-3.5 text-right font-sans font-bold text-[#21130D] tabular-nums text-[13px]">
                            {formatNumber(Number(f.montant) || 0)}
                          </td>
                          <td className="py-3 px-3.5 text-center">
                            <span
                              className={`inline-flex min-w-[84px] justify-center items-center rounded-md px-2 py-0.5 text-[11px] font-semibold ${
                                f.statut === "decaisse"
                                  ? "bg-[#5A7D65]/15 text-[#3B5442]"
                                  : "bg-[#C99A68]/20 text-[#8C5E2D]"
                              }`}
                            >
                              {f.statut_display}
                            </span>
                          </td>
                          <td className="py-3 px-3.5 text-center text-[#5A4B42] tabular-nums font-mono text-[11px]">
                            {formatDate(f.date)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        ) : (
          <div>
            {/* ── Cartes empilées Partenariats sur mobile (< 640px) ── */}
            <div className="block sm:hidden space-y-3">
              {filteredPartenariats.length === 0 ? (
                <div className="py-10 text-center text-xs text-[#5A4B42]">
                  Aucun partenariat ne correspond aux filtres appliqués.
                </div>
              ) : (
                paginatedPartenariats.map((p) => (
                  <div
                    key={p.id}
                    className="rounded-xl border border-[#EFE4D6] bg-white p-3.5 shadow-2xs space-y-2.5 transition hover:border-[#C99A68]"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h4 className="text-[13px] font-bold text-[#21130D] leading-snug">
                          {p.projet_titre}
                        </h4>
                        <p className="text-[11px] text-[#5A4B42] mt-0.5">
                          Porteur : <span className="font-medium text-[#21130D]">{p.porteur_nom || "Non renseigné"}</span>
                        </p>
                      </div>
                      <span
                        className={`shrink-0 inline-flex items-center rounded-md px-2 py-0.5 text-[10px] font-semibold ${
                          p.statut === "actif"
                            ? "bg-[#5A7D65]/15 text-[#3B5442]"
                            : "bg-[#C99A68]/20 text-[#8C5E2D]"
                        }`}
                      >
                        {p.statut_display}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-[#5A4B42] border-t border-[#EFE4D6]/60 pt-2">
                      <span className="font-semibold text-[#612D10] truncate max-w-[190px]">
                        {p.partenaire}
                      </span>
                      <span className="font-mono tabular-nums text-[#8C6D4F]">
                        {formatDate(p.date_debut)}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-[#5A4B42]">
                        Nature : <strong className="text-[#21130D]">{p.type_display}</strong>
                      </span>
                      <span className="text-[#8C6D4F] text-[10px]">{p.cohorte || "CIAT"}</span>
                    </div>

                    {p.description && (
                      <p className="text-[11px] text-[#5A4B42] bg-[#FAF7F2] p-2 rounded-lg border border-[#EFE4D6]/60 line-clamp-2">
                        {p.description}
                      </p>
                    )}
                  </div>
                ))
              )}
            </div>

            {/* ── Tableau fixe Partenariats pour tablette / desktop (>= 640px) ── */}
            <div className="hidden sm:block overflow-x-auto rounded-xl border border-[#EFE4D6] bg-white shadow-2xs">
              {filteredPartenariats.length === 0 ? (
                <div className="py-12 text-center text-xs text-[#5A4B42]">
                  Aucun partenariat ne correspond aux filtres appliqués.
                </div>
              ) : (
                <table className="w-full text-left text-xs table-fixed min-w-[760px]">
                  <thead>
                    <tr className="border-b border-[#EFE4D6] bg-[#FAF7F2] text-[11px] font-bold text-[#612D10] uppercase tracking-wider">
                      <th className="py-3 px-3.5 w-[34%]">Projet & Porteur</th>
                      <th className="py-3 px-3.5 w-[24%]">Partenaire</th>
                      <th className="py-3 px-3.5 w-[16%]">Nature</th>
                      <th className="py-3 px-3.5 w-[13%] text-center">Statut</th>
                      <th className="py-3 px-3.5 w-[13%] text-center">Date début</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#EFE4D6]/60">
                    {paginatedPartenariats.map((p) => {
                      const isExpanded = expandedRowId === p.id;
                      return (
                        <tr
                          key={p.id}
                          onClick={() => setExpandedRowId(isExpanded ? null : p.id)}
                          className="hover:bg-[#FAF7F2]/60 transition-colors cursor-pointer group"
                        >
                          <td className="py-3 px-3.5">
                            <div className="font-semibold text-[#21130D] truncate group-hover:text-[#612D10]" title={p.projet_titre}>
                              {p.projet_titre}
                            </div>
                            <div className="flex items-center gap-1.5 text-[11px] text-[#5A4B42] mt-0.5">
                              <span className="truncate max-w-[140px]">{p.porteur_nom || "Porteur CIAT"}</span>
                              {p.cohorte && (
                                <>
                                  <span className="text-[#8C6D4F]">•</span>
                                  <span className="text-[#8C6D4F] truncate">{p.cohorte}</span>
                                </>
                              )}
                            </div>
                            {isExpanded && p.description && (
                              <div className="mt-2 text-[11px] text-[#5A4B42] bg-[#FAF7F2] p-2.5 rounded-lg border border-[#EFE4D6] whitespace-normal">
                                <strong className="text-[#21130D]">Objet de l&apos;accord :</strong> {p.description}
                              </div>
                            )}
                          </td>
                          <td className="py-3 px-3.5">
                            <div className="font-medium text-[#21130D] truncate" title={p.partenaire}>
                              {p.partenaire}
                            </div>
                            <div className="text-[11px] text-[#8C6D4F] truncate" title={p.domaine || ""}>
                              {p.domaine || "Domaine transversal"}
                            </div>
                          </td>
                          <td className="py-3 px-3.5 text-[#21130D] font-medium truncate">
                            {p.type_display}
                          </td>
                          <td className="py-3 px-3.5 text-center">
                            <span
                              className={`inline-flex min-w-[84px] justify-center items-center rounded-md px-2 py-0.5 text-[11px] font-semibold ${
                                p.statut === "actif"
                                  ? "bg-[#5A7D65]/15 text-[#3B5442]"
                                  : "bg-[#C99A68]/20 text-[#8C5E2D]"
                              }`}
                            >
                              {p.statut_display}
                            </span>
                          </td>
                          <td className="py-3 px-3.5 text-center text-[#5A4B42] tabular-nums font-mono text-[11px]">
                            {formatDate(p.date_debut)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}

        {/* =====================================================================
            PAGINATION & CONTROLES DE NAVIGATION
           ===================================================================== */}
        {totalFilteredCount > pageSize && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-[#EFE4D6] pt-3 text-xs text-[#5A4B42]">
            <div>
              Affichage de{" "}
              <strong className="text-[#21130D]">
                {(currentPage - 1) * pageSize + 1}
              </strong>{" "}
              à{" "}
              <strong className="text-[#21130D]">
                {Math.min(currentPage * pageSize, totalFilteredCount)}
              </strong>{" "}
              sur <strong className="text-[#21130D]">{totalFilteredCount}</strong>{" "}
              {activeTab === "financements" ? "financements" : "accords"}
            </div>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                aria-label="Page précédente"
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-[#EFE4D6] bg-white text-xs font-medium text-[#21130D] hover:bg-[#FAF7F2] disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              >
                <ChevronLeft className="h-3.5 w-3.5" />
                <span>Précédent</span>
              </button>

              <div className="flex items-center gap-1">
                {Array.from({ length: totalPages }).map((_, idx) => {
                  const pNum = idx + 1;
                  // Afficher seulement pages proches si beaucoup de pages
                  if (
                    totalPages > 7 &&
                    pNum !== 1 &&
                    pNum !== totalPages &&
                    Math.abs(pNum - currentPage) > 1
                  ) {
                    if (pNum === 2 || pNum === totalPages - 1) {
                      return <span key={pNum} className="px-1 text-[#8C6D4F]">...</span>;
                    }
                    return null;
                  }

                  return (
                    <button
                      key={pNum}
                      type="button"
                      onClick={() => setCurrentPage(pNum)}
                      aria-label={`Page ${pNum}`}
                      aria-current={currentPage === pNum ? "page" : undefined}
                      className={`h-7 w-7 rounded-lg text-xs font-semibold flex items-center justify-center transition-all cursor-pointer ${
                        currentPage === pNum
                          ? "bg-[#612D10] text-white shadow-2xs"
                          : "border border-[#EFE4D6] bg-white text-[#5A4B42] hover:bg-[#FAF7F2] hover:text-[#21130D]"
                      }`}
                    >
                      {pNum}
                    </button>
                  );
                })}
              </div>

              <button
                type="button"
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                aria-label="Page suivante"
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-[#EFE4D6] bg-white text-xs font-medium text-[#21130D] hover:bg-[#FAF7F2] disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              >
                <span>Suivant</span>
                <ChevronRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
