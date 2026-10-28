"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Building2,
  ExternalLink,
  Handshake,
  Landmark,
  Layers,
  ArrowRight,
  TrendingUp,
  Cpu,
  GraduationCap,
  Sparkles,
} from "lucide-react";
import { ApiErrorBanner, DemoBanner } from "@/components/ui";
import { getPartenaires, type Partenaire } from "@/lib/portal-api";

const TYPE_METADATA: Record<
  Partenaire["type"],
  {
    label: string;
    sublabel: string;
    badgeBg: string;
    badgeText: string;
    icon: typeof Landmark;
  }
> = {
  institutionnel: {
    label: "Institutionnel & Tutelle",
    sublabel: "Gouvernance, réglementation & politiques publiques",
    badgeBg: "bg-[#612D10]/10 text-[#612D10] border-[#612D10]/20",
    badgeText: "Tutelle",
    icon: Landmark,
  },
  industriel: {
    label: "Industriel & Technologique",
    sublabel: "Infrastructures, bancs de test & transfert",
    badgeBg: "bg-[#8C5E2D]/15 text-[#612D10] border-[#8C5E2D]/30",
    badgeText: "Industrie",
    icon: Cpu,
  },
  financier: {
    label: "Financier & Amorçage",
    sublabel: "Fonds d'amorçage, prêts d'honneur & investissement",
    badgeBg: "bg-[#1E5631]/10 text-[#1E5631] border-[#1E5631]/25",
    badgeText: "Finance",
    icon: TrendingUp,
  },
  academique: {
    label: "Académique & Recherche",
    sublabel: "Formations certifiantes, laboratoires & R&D",
    badgeBg: "bg-[#1D3557]/10 text-[#1D3557] border-[#1D3557]/25",
    badgeText: "Académie",
    icon: GraduationCap,
  },
};

function PartenaireLogoVisual({
  logo,
  nom,
  sigle,
  size = "md",
}: {
  logo?: string;
  nom: string;
  sigle?: string;
  size?: "sm" | "md" | "lg";
}) {
  const [loadError, setLoadError] = useState(false);

  const dimensionClasses = {
    sm: "h-12 w-12 text-xs",
    md: "h-16 w-16 text-sm",
    lg: "h-20 w-20 text-base",
  }[size];

  if (!logo || loadError) {
    return (
      <div
        className={`${dimensionClasses} shrink-0 rounded-2xl bg-gradient-to-br from-[#FAF7F2] to-[#EFE4D6] border border-[#E5D7C6] flex items-center justify-center font-extrabold text-[#612D10] shadow-xs tracking-wider`}
      >
        {sigle || nom.slice(0, 4).toUpperCase()}
      </div>
    );
  }

  return (
    <div
      className={`${dimensionClasses} relative shrink-0 overflow-hidden rounded-2xl bg-white border border-[#E5D7C6] p-2 flex items-center justify-center shadow-xs`}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={logo}
        alt={`Logo ${nom}`}
        onError={() => setLoadError(true)}
        className="h-full w-full object-contain"
        loading="lazy"
        decoding="async"
      />
    </div>
  );
}

export default function PartenairesPage() {
  const [items, setItems] = useState<Partenaire[]>([]);
  const [filterType, setFilterType] = useState<string>("tous");
  const [loading, setLoading] = useState(true);
  const [fromApi, setFromApi] = useState(false);
  const [isDemo, setIsDemo] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPartenaires = () => {
    setLoading(true);
    setError(null);
    getPartenaires()
      .then((res) => {
        setItems(res.items);
        setFromApi(res.fromApi);
        setIsDemo(Boolean(res.isDemo));
        setError(res.error);
        setLoading(false);
      })
      .catch(() => {
        setError("Les partenaires sont momentanément indisponibles. Réessayez plus tard.");
        setItems([]);
        setIsDemo(false);
        setLoading(false);
      });
  };

  useEffect(() => {
    let ignore = false;
    getPartenaires()
      .then((res) => {
        if (!ignore) {
          setItems(res.items);
          setFromApi(res.fromApi);
          setIsDemo(Boolean(res.isDemo));
          setError(res.error);
          setLoading(false);
        }
      })
      .catch(() => {
        if (!ignore) {
          setError("Les partenaires sont momentanément indisponibles. Réessayez plus tard.");
          setItems([]);
          setIsDemo(false);
          setLoading(false);
        }
      });

    return () => {
      ignore = true;
    };
  }, []);

  // Métriques réelles issues des données
  const stats = useMemo(() => {
    const total = items.length;
    const tutelles = items.filter((p) => p.type === "institutionnel").length;
    const industriels = items.filter((p) => p.type === "industriel").length;
    const financiers = items.filter((p) => p.type === "financier").length;
    const academiques = items.filter((p) => p.type === "academique").length;
    return { total, tutelles, industriels, financiers, academiques };
  }, [items]);

  const filteredItems = useMemo(() => {
    if (filterType === "tous") return items;
    return items.filter((p) => p.type === filterType);
  }, [items, filterType]);

  // Groupement par catégorie pour composition variée en mode "tous"
  const institutionnels = useMemo(
    () => items.filter((p) => p.type === "institutionnel"),
    [items]
  );
  const industriels = useMemo(
    () => items.filter((p) => p.type === "industriel"),
    [items]
  );
  const financiers = useMemo(
    () => items.filter((p) => p.type === "financier"),
    [items]
  );
  const academiques = useMemo(
    () => items.filter((p) => p.type === "academique"),
    [items]
  );

  return (
    <div className="bg-[#FAF7F2] text-[#24140D] min-h-screen font-sans antialiased selection:bg-[#C99A68]/30">
      {/* =====================================================================
       * 1. HERO AVEC PHOTOGRAPHIE RÉELLE DU CAMPUS / ATELIERS
       * ===================================================================== */}
      <section className="relative overflow-hidden bg-[#24140D] text-white">
        <div className="absolute inset-0">
          <Image
            src="/images/ciat_forum.jpg"
            alt="Alliance et écosystème des partenaires technologiques et industriels du CIAT"
            fill
            priority
            sizes="100vw"
            className="object-cover object-center opacity-35"
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
            <span className="text-white font-semibold">Partenaires</span>
          </nav>

          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-[#C99A68]/40 bg-[#612D10]/50 px-3.5 py-1 text-xs font-bold uppercase tracking-wider text-[#DFae79] backdrop-blur-sm">
              <Handshake size={14} className="text-[#DFae79]" />
              <span>Alliances Stratégiques & Écosystème</span>
            </div>

            <h1 className="mt-5 font-[family-name:var(--font-jakarta)] text-3xl sm:text-5xl md:text-6xl font-extrabold tracking-tight text-white leading-tight">
              Nos Partenaires d&apos;Excellence
            </h1>

            <p className="mt-4 sm:mt-6 text-sm sm:text-base md:text-lg leading-relaxed text-[#EAE0D5] max-w-2xl">
              Institutions régaliennes de tutelle, leaders industriels, fonds
              d&apos;amorçage et centres de recherche unissent leurs expertises
              pour transformer les innovations de l&apos;ISEP de Diamniadio en
              solutions durables déployées sur le terrain.
            </p>

            <div className="mt-8 flex flex-wrap gap-4">
              <Link
                href="/portail/contact"
                className="inline-flex items-center gap-2 rounded-xl bg-[#612D10] hover:bg-[#7D3A15] border border-[#C99A68]/40 px-6 py-3.5 text-xs sm:text-sm font-bold !text-white shadow-xl transition-all cursor-pointer"
              >
                <span>Devenir Partenaire</span>
                <ArrowRight size={16} />
              </Link>
              <Link
                href="/portail/domaines"
                className="inline-flex items-center gap-2 rounded-xl border border-white/30 bg-white/10 hover:bg-white/20 px-6 py-3.5 text-xs sm:text-sm font-semibold !text-white backdrop-blur-sm transition"
              >
                <span>Découvrir nos 7 filières</span>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* =====================================================================
       * 2. BANDEAU DE CHIFFRES RÉELS (Données réelles de l'API)
       * ===================================================================== */}
      <section className="relative z-10 -mt-8 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="rounded-2xl border border-[#E5D7C6] bg-white p-6 shadow-xl">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 divide-y md:divide-y-0 md:divide-x divide-[#E5D7C6]">
            <div className="text-center pt-2 md:pt-0">
              <p className="font-[family-name:var(--font-jakarta)] text-3xl sm:text-4xl font-black text-[#612D10]">
                {loading ? "…" : stats.total}
              </p>
              <p className="mt-1 text-xs font-bold uppercase tracking-wider text-[#8C6D58]">
                Partenaires Engagés
              </p>
              <p className="text-[11px] text-[#A68F80]">Conventionnés au CIAT</p>
            </div>

            <div className="text-center pt-4 md:pt-0">
              <p className="font-[family-name:var(--font-jakarta)] text-3xl sm:text-4xl font-black text-[#612D10]">
                {loading ? "…" : stats.tutelles}
              </p>
              <p className="mt-1 text-xs font-bold uppercase tracking-wider text-[#8C6D58]">
                Tutelles & Régulation
              </p>
              <p className="text-[11px] text-[#A68F80]">Ministères & agences d&apos;État</p>
            </div>

            <div className="text-center pt-4 md:pt-0">
              <p className="font-[family-name:var(--font-jakarta)] text-3xl sm:text-4xl font-black text-[#612D10]">
                {loading ? "…" : stats.industriels}
              </p>
              <p className="mt-1 text-xs font-bold uppercase tracking-wider text-[#8C6D58]">
                Pôles Technologiques
              </p>
              <p className="text-[11px] text-[#A68F80]">Bancs d&apos;essais & IoT</p>
            </div>

            <div className="text-center pt-4 md:pt-0">
              <p className="font-[family-name:var(--font-jakarta)] text-3xl sm:text-4xl font-black text-[#612D10]">
                {loading ? "…" : stats.financiers + stats.academiques}
              </p>
              <p className="mt-1 text-xs font-bold uppercase tracking-wider text-[#8C6D58]">
                Amorçage & Académie
              </p>
              <p className="text-[11px] text-[#A68F80]">Bailleurs, universités & ISEP</p>
            </div>
          </div>
        </div>
      </section>

      {/* =====================================================================
       * 3. CORPS DE LA PAGE : FILTRES & COMPOSITIONS VARIÉES
       * ===================================================================== */}
      <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12 md:py-20">
        {/* Bannières de statut */}
        {isDemo && <DemoBanner className="mb-8" />}
        {error && (
          <ApiErrorBanner
            message={error}
            onRetry={fetchPartenaires}
            className="mb-8"
          />
        )}

        {/* Barre de filtrage élégante */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-[#E5D7C6] pb-6 mb-10">
          <div>
            <h2 className="font-[family-name:var(--font-jakarta)] text-xl sm:text-2xl font-bold text-[#24140D]">
              Cartographie des Collaborations
            </h2>
            <p className="text-xs sm:text-sm text-[#655346] mt-0.5">
              Explorez le réseau par domaine d&apos;impact et typologie d&apos;engagement.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setFilterType("tous")}
              className={`min-h-[40px] px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                filterType === "tous"
                  ? "bg-[#612D10] text-white shadow-sm"
                  : "bg-white border border-[#E5D7C6] text-[#655346] hover:bg-[#FAF7F2] hover:text-[#24140D]"
              }`}
            >
              Tous ({items.length})
            </button>
            {(["institutionnel", "industriel", "financier", "academique"] as const).map(
              (catKey) => {
                const count = items.filter((p) => p.type === catKey).length;
                const active = filterType === catKey;
                const meta = TYPE_METADATA[catKey];
                return (
                  <button
                    key={catKey}
                    type="button"
                    onClick={() => setFilterType(catKey)}
                    className={`min-h-[40px] px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      active
                        ? "bg-[#612D10] text-white shadow-sm"
                        : "bg-white border border-[#E5D7C6] text-[#655346] hover:bg-[#FAF7F2] hover:text-[#24140D]"
                    }`}
                  >
                    {meta.badgeText} ({count})
                  </button>
                );
              }
            )}
          </div>
        </div>

        {/* ===================================================================
         * AFFICHAGE DYNAMIQUE SELON LE FILTRE
         * En mode "tous" : compositions variées (pas de grille 3x3 répétitive)
         * En mode filtré : grille adaptée
         * =================================================================== */}
        {loading ? (
          <div className="space-y-6">
            <div className="h-64 rounded-2xl bg-white border border-[#E5D7C6] animate-pulse p-8" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="h-48 rounded-2xl bg-white border border-[#E5D7C6] animate-pulse p-6" />
              <div className="h-48 rounded-2xl bg-white border border-[#E5D7C6] animate-pulse p-6" />
            </div>
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-[#DFCDB9] bg-white p-12 text-center max-w-xl mx-auto my-8">
            <Layers className="mx-auto h-12 w-12 text-[#C99A68]" />
            <h3 className="mt-4 text-base font-bold text-[#24140D]">
              Aucun partenaire répertorié dans cette catégorie
            </h3>
            <p className="mt-2 text-xs text-[#655346] leading-relaxed">
              Les conventions relatives à cette catégorie sont actuellement en cours
              de signature auprès du Secrétariat Général du CIAT.
            </p>
            <button
              type="button"
              onClick={() => setFilterType("tous")}
              className="mt-6 inline-flex items-center gap-2 rounded-xl bg-[#612D10] hover:bg-[#7D3A15] px-5 py-2.5 text-xs font-bold text-white transition cursor-pointer"
            >
              Afficher tous les partenaires
            </button>
          </div>
        ) : filterType !== "tous" ? (
          /* Grille standard quand une catégorie spécifique est filtrée */
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {filteredItems.map((partenaire) => (
              <PartenaireCardDetailed key={partenaire.id} partenaire={partenaire} />
            ))}
          </div>
        ) : (
          /* COMPOSITION VARIÉE EN MODE "TOUS" */
          <div className="space-y-16">
            {/* 1. SECTION INSTITUTIONNELLE EN GRAND VISUEL ÉTENDU */}
            {institutionnels.length > 0 && (
              <section aria-labelledby="section-tutelles">
                <div className="flex items-center gap-2.5 mb-6">
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#612D10]/10 text-[#612D10]">
                    <Landmark size={18} />
                  </span>
                  <div>
                    <h3
                      id="section-tutelles"
                      className="font-[family-name:var(--font-jakarta)] text-lg font-bold text-[#24140D]"
                    >
                      Institutions de Tutelle & Gouvernance
                    </h3>
                    <p className="text-xs text-[#655346]">
                      Organes publics garants de l&apos;homologation et de la conformité régalienne.
                    </p>
                  </div>
                </div>

                <div className="space-y-4">
                  {institutionnels.map((partenaire) => (
                    <article
                      key={partenaire.id}
                      className="rounded-3xl border border-[#E5D7C6] bg-white p-6 sm:p-8 shadow-xs hover:shadow-md transition-all flex flex-col md:flex-row items-start gap-6"
                    >
                      <PartenaireLogoVisual
                        logo={partenaire.logo}
                        nom={partenaire.nom}
                        sigle={partenaire.sigle}
                        size="lg"
                      />
                      <div className="flex-1">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <span className="rounded-full px-3 py-1 text-xs font-bold border bg-[#612D10]/10 text-[#612D10] border-[#612D10]/20">
                            {partenaire.sigle || "Tutelle Régalienne"}
                          </span>
                          {partenaire.site_web && (
                            <a
                              href={partenaire.site_web}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1.5 text-xs font-bold text-[#612D10] hover:text-[#7D3A15] hover:underline"
                            >
                              <span>Portail officiel</span>
                              <ExternalLink size={13} />
                            </a>
                          )}
                        </div>

                        <h4 className="mt-3 text-lg sm:text-xl font-bold text-[#24140D]">
                          {partenaire.nom}
                        </h4>

                        <p className="mt-2 text-xs sm:text-sm text-[#655346] leading-relaxed">
                          {partenaire.description}
                        </p>

                        <div className="mt-4 rounded-xl bg-[#FAF7F2] border border-[#E5D7C6]/70 p-3.5 flex items-start gap-3">
                          <Sparkles size={16} className="text-[#C99A68] shrink-0 mt-0.5" />
                          <div>
                            <span className="text-[11px] font-bold uppercase tracking-wider text-[#8C6D58]">
                              Mandat & Axe de Coopération
                            </span>
                            <p className="text-xs font-semibold text-[#24140D] mt-0.5">
                              {partenaire.domaine_collaboration}
                            </p>
                          </div>
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              </section>
            )}

            {/* 2. SECTION INDUSTRIELS & PÔLES TECHNOLOGIQUES EN FORMAT 2 COLONNES */}
            {industriels.length > 0 && (
              <section aria-labelledby="section-industriels">
                <div className="flex items-center gap-2.5 mb-6">
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#8C5E2D]/15 text-[#612D10]">
                    <Cpu size={18} />
                  </span>
                  <div>
                    <h3
                      id="section-industriels"
                      className="font-[family-name:var(--font-jakarta)] text-lg font-bold text-[#24140D]"
                    >
                      Partenaires Industriels & Pôles Technologiques
                    </h3>
                    <p className="text-xs text-[#655346]">
                      Bancs d&apos;expérimentation, bancs IoT, calcul haute performance et usines pilotes.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {industriels.map((partenaire) => (
                    <PartenaireCardDetailed key={partenaire.id} partenaire={partenaire} />
                  ))}
                </div>
              </section>
            )}

            {/* 3. SECTION BAILLEURS & FINANCEMENT D'AMORÇAGE */}
            {financiers.length > 0 && (
              <section aria-labelledby="section-financiers">
                <div className="flex items-center gap-2.5 mb-6">
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#1E5631]/10 text-[#1E5631]">
                    <TrendingUp size={18} />
                  </span>
                  <div>
                    <h3
                      id="section-financiers"
                      className="font-[family-name:var(--font-jakarta)] text-lg font-bold text-[#24140D]"
                    >
                      Bailleurs & Financement d&apos;Amorçage
                    </h3>
                    <p className="text-xs text-[#655346]">
                      Mécanismes de subvention, prêts d&apos;honneur et capital d&apos;amorçage post-incubation.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {financiers.map((partenaire) => (
                    <PartenaireCardDetailed key={partenaire.id} partenaire={partenaire} />
                  ))}
                </div>
              </section>
            )}

            {/* 4. SECTION ACADÉMIQUE & FORMATIONS */}
            {academiques.length > 0 && (
              <section aria-labelledby="section-academiques">
                <div className="flex items-center gap-2.5 mb-6">
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#1D3557]/10 text-[#1D3557]">
                    <GraduationCap size={18} />
                  </span>
                  <div>
                    <h3
                      id="section-academiques"
                      className="font-[family-name:var(--font-jakarta)] text-lg font-bold text-[#24140D]"
                    >
                      Pôles Académiques & Recherche Appliquée
                    </h3>
                    <p className="text-xs text-[#655346]">
                      Apprenants, enseignants-chercheurs et laboratoires technologiques de Diamniadio.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {academiques.map((partenaire) => (
                    <PartenaireCardDetailed key={partenaire.id} partenaire={partenaire} />
                  ))}
                </div>
              </section>
            )}
          </div>
        )}

        {/* =====================================================================
         * 4. BANDEAU PRESTIGE D'APPEL À L'ACTION « DEVENIR PARTENAIRE »
         * ===================================================================== */}
        <section
          id="contact-partenaire"
          className="mt-20 rounded-3xl bg-gradient-to-br from-[#24140D] via-[#381B0F] to-[#24140D] text-white p-8 sm:p-12 md:p-16 relative overflow-hidden shadow-2xl border border-[#C99A68]/30"
        >
          <div className="absolute top-0 right-0 w-96 h-96 bg-[#C99A68]/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 max-w-2xl">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-[#C99A68]/20 border border-[#C99A68]/40 px-3.5 py-1 text-xs font-bold text-[#DFae79] uppercase tracking-wider mb-4">
              <Building2 size={13} />
              Rejoindre l&apos;Écosystème CIAT
            </span>

            <h3 className="font-[family-name:var(--font-jakarta)] text-2xl sm:text-3xl md:text-4xl font-extrabold text-white leading-tight">
              Vous Souhaitez Devenir Partenaire du CIAT ?
            </h3>

            <p className="mt-4 text-xs sm:text-sm md:text-base text-[#EAE0D5] leading-relaxed">
              Industriels, fonds d&apos;investissement, ONG et laboratoires :
              participez à l&apos;émergence des technologies souveraines du Sénégal.
              Accédez à nos bancs de prototypage, parrainez une filière ou
              co-développez des solutions avec nos porteurs de projets.
            </p>

            <div className="mt-8 flex flex-wrap gap-4">
              <Link
                href="/portail/contact"
                className="inline-flex items-center gap-2 rounded-xl bg-[#612D10] hover:bg-[#7D3A15] border border-[#C99A68]/40 px-6 py-3.5 text-xs sm:text-sm font-bold !text-white shadow-xl transition-all cursor-pointer"
              >
                <span>Proposer une Convention</span>
                <ArrowRight size={16} />
              </Link>
              <Link
                href="/galerie"
                className="inline-flex items-center gap-2 rounded-xl border border-white/30 bg-white/10 hover:bg-white/20 px-6 py-3.5 text-xs sm:text-sm font-bold !text-white transition"
              >
                <span>Consulter les Prototypes</span>
              </Link>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

function PartenaireCardDetailed({ partenaire }: { partenaire: Partenaire }) {
  const meta = TYPE_METADATA[partenaire.type] || TYPE_METADATA.institutionnel;
  const Icon = meta.icon;

  return (
    <article className="rounded-2xl border border-[#E5D7C6] bg-white p-6 shadow-xs hover:shadow-md transition-all flex flex-col justify-between">
      <div>
        <div className="flex items-start justify-between gap-3">
          <PartenaireLogoVisual
            logo={partenaire.logo}
            nom={partenaire.nom}
            sigle={partenaire.sigle}
            size="md"
          />
          <span
            className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-bold border ${meta.badgeBg}`}
          >
            <Icon size={12} />
            <span>{meta.badgeText}</span>
          </span>
        </div>

        <h4 className="mt-4 font-[family-name:var(--font-jakarta)] text-base font-bold text-[#24140D] leading-snug">
          {partenaire.nom}
        </h4>

        <p className="mt-2 text-xs text-[#655346] leading-relaxed line-clamp-3">
          {partenaire.description}
        </p>

        <div className="mt-4 rounded-xl bg-[#FAF7F2] border border-[#E5D7C6]/70 p-3">
          <span className="text-[10px] font-bold uppercase tracking-wider text-[#8C6D58] block">
            Axe de Coopération
          </span>
          <p className="text-xs font-semibold text-[#24140D] mt-0.5 line-clamp-2">
            {partenaire.domaine_collaboration}
          </p>
        </div>
      </div>

      <div className="mt-5 pt-4 border-t border-[#E5D7C6] flex items-center justify-between">
        {partenaire.site_web ? (
          <a
            href={partenaire.site_web}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-[#612D10] hover:text-[#7D3A15] hover:underline"
          >
            <span>Site officiel</span>
            <ExternalLink size={13} />
          </a>
        ) : (
          <span className="text-xs text-[#8C6D58]">Convention active</span>
        )}
        <span className="text-[11px] font-mono text-[#8C6D58]">
          Réf. #{partenaire.id}
        </span>
      </div>
    </article>
  );
}
