"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  BookOpen,
  Calculator,
  Clock,
  Database,
  Info,
  Lightbulb,
  Search,
  ShieldAlert,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  LayoutGrid,
  List,
  Sliders,
} from "lucide-react";
import { api } from "@/lib/api";

export interface IndicateurDefinition {
  code: string;
  nom: string;
  categorie: string;
  definition: string;
  formule: string;
  periode: string;
  source: string;
  limites: string;
  interpretation: string;
}

interface DefinitionsResponse {
  count: number;
  categories: string[];
  indicateurs: IndicateurDefinition[];
}

const FALLBACK_DEFINITIONS: IndicateurDefinition[] = [
  {
    code: "idees_recues",
    nom: "Idées reçues (Total des projets enregistrés)",
    categorie: "Entonnoir d'incubation",
    definition:
      "Nombre total de projets et d'initiatives enregistrés dans la plateforme CIAT pour la période ou les filtres sélectionnés, quel que soit leur niveau de maturité actuel.",
    formule: "COUNT(core_projet.id) [selon filtres debut, fin, cohorte, domaine]",
    periode:
      "Période sélectionnée ou cumul historique (date de création du projet : cree_le).",
    source: "apps.core.models.Projet (table core_projet)",
    limites:
      "Comprend l'ensemble des projets créés, y compris les projets restés au stade d'ébauche ou d'idée non encore formalisée par un dossier complet.",
    interpretation:
      "Mesure la notoriété, l'attractivité du centre et le volume brut du sourcing territorial. Un volume élevé valide la visibilité des appels à candidatures.",
  },
  {
    code: "dossiers_deposes",
    nom: "Dossiers formellement déposés",
    categorie: "Entonnoir d'incubation",
    definition:
      "Nombre de dossiers de candidature officiellement soumis pour instruction et évaluation, ayant dépassé le stade de brouillon.",
    formule: "COUNT(incubator_dossier.id) WHERE statut != 'brouillon'",
    periode: "Période d'évaluation ou filtre cohorte.",
    source:
      "apps.incubator.models.Dossier (table incubator_dossier rattachée à core_projet)",
    limites:
      "Exclut les dossiers en cours de rédaction non encore soumis par les porteurs (brouillons). Si aucun dossier formalisé n'est rattaché dans un sous-ensemble filtré, le dénominateur se base sur les projets ayant le statut 'depose' ou supérieur.",
    interpretation:
      "Mesure la conversion effective des idées brutes en candidatures complètes et recevables. L'écart entre idées reçues et dossiers déposés révèle la complexité perçue du dossier de candidature.",
  },
  {
    code: "projets_selectionnes",
    nom: "Projets retenus par le comité de sélection",
    categorie: "Entonnoir d'incubation",
    definition:
      "Nombre de projets ayant reçu un avis favorable du comité de sélection et admis au sein d'un programme d'accompagnement du CIAT (statut sélectionné, incubé, prototype ou terminé).",
    formule:
      "COUNT(core_projet.id) WHERE statut IN ('selectionne', 'incube', 'prototype', 'termine')",
    periode: "Date de décision du comité ou date de rattachement à la cohorte.",
    source: "apps.core.models.Projet et apps.incubator.models.DecisionDossier",
    limites:
      "Prend en compte les projets sélectionnés même si l'incubation physique effective n'a pas encore débuté au moment de la mesure.",
    interpretation:
      "Témoigne de la capacité d'accueil et du niveau d'exigence qualitatif fixé par le comité scientifique et technique du CIAT.",
  },
  {
    code: "projets_incubes",
    nom: "Projets activement incubés",
    categorie: "Entonnoir d'incubation",
    definition:
      "Nombre de projets bénéficiant d'un parcours d'incubation opérationnel au CIAT (accès aux ateliers, laboratoires, mentorat dédié et suivi des jalons).",
    formule:
      "COUNT(core_projet.id) WHERE statut IN ('incube', 'prototype', 'termine')",
    periode: "Cohorte en cours ou période de conventionnement actif.",
    source: "apps.core.models.Projet, apps.incubator.models.AffectationMentor",
    limites:
      "Dénombre les projets ayant franchi l'étape contractuelle d'entrée en incubation. N'inclut pas les projets sélectionnés en attente de démarrage de cohorte.",
    interpretation:
      "Mesure la charge réelle d'encadrement des équipes techniques et des mentors du CIAT.",
  },
  {
    code: "prototypes",
    nom: "Prototypes industriels et fonctionnels validés",
    categorie: "Entonnoir d'incubation",
    definition:
      "Nombre de projets ayant abouti à un prototype physique, mécanique, numérique ou biomédical opérationnel et testé en conditions réelles ou de laboratoire (statut prototype ou terminé).",
    formule:
      "COUNT(core_projet.id) WHERE statut IN ('prototype', 'termine')",
    periode: "Date de validation du jalon prototype.",
    source:
      "apps.core.models.Projet (statut='prototype' ou 'termine'), apps.gallery.models.FicheInnovation",
    limites:
      "Un projet au statut prototype peut avoir été validé en atelier sans avoir encore fait l'objet d'une publication publique dans la Galerie des Innovations.",
    interpretation:
      "Indicateur majeur d'impact et de transfert technologique de l'institut. Reflète la concrétisation de la R&D appliquée en produits tangibles.",
  },
  {
    code: "taux_selection",
    nom: "Taux de sélection global",
    categorie: "Entonnoir d'incubation",
    definition:
      "Pourcentage de projets retenus pour incubation par rapport au nombre de dossiers formellement déposés.",
    formule: "(Projets sélectionnés / Dossiers déposés) × 100",
    periode: "Par cohorte ou agrégat global filtré.",
    source: "Calculé à partir de core_projet et incubator_dossier",
    limites:
      "Le taux de sélection compte les dossiers formellement déposés et non les simples idées reçues. Si aucun dossier formalisé n'est enregistré dans l'échantillon, le dénominateur bascule sur les idées reçues.",
    interpretation:
      "Reflète la sélectivité du jury. Un taux équilibré garantit à la fois l'excellence des projets accueillis et le plein emploi des capacités du fablab et des plateformes technologiques.",
  },
  {
    code: "par_domaine",
    nom: "Répartition sectorielle par domaine d'innovation",
    categorie: "Typologie & Diversité",
    definition:
      "Distribution volumétrique et relative des projets selon les 7 domaines d'intervention prioritaires du CIAT.",
    formule: "COUNT(core_projet.id) GROUP BY domaine.nom",
    periode: "Période active.",
    source: "apps.core.models.Domaine (table core_domaine)",
    limites:
      "Chaque projet est affecté à un domaine principal unique. Les innovations pluridisciplinaires (ex: AgriTech combinant TIC et Agriculture) sont classées selon leur application dominante.",
    interpretation:
      "Permet de s'assurer de l'alignement des incubations avec les priorités socio-économiques du Sénégal et du bassin de Diamniadio.",
  },
  {
    code: "par_cohorte",
    nom: "Progression et maturité par cohorte",
    categorie: "Typologie & Diversité",
    definition:
      "Comparaison de la progression du pipeline d'incubation à travers les différentes promotions annuelles (Total des candidatures, Projets sélectionnés, Prototypes finalisés).",
    formule:
      "SELECT cohorte, COUNT(id) AS total, COUNT(selectionnes) AS selectionnes, COUNT(prototypes) AS prototypes GROUP BY cohorte.nom",
    periode: "Historique annuel pluriannuel (2024, 2025, 2026).",
    source: "apps.core.models.Cohorte (table core_cohorte)",
    limites:
      "Les cohortes récentes (ex: 2026) affichent un taux de prototypes nul car elles sont en phase initiale d'idéation ou de sélection.",
    interpretation:
      "Visualise le cycle de vie de l'incubation : les cohortes matures (2024) affichent 100% de prototypes, tandis que les cohortes intermédiaires (2025) progressent vers la phase prototype.",
  },
  {
    code: "par_genre",
    nom: "Indicateur d'inclusivité et parité de genre",
    categorie: "Typologie & Diversité",
    definition:
      "Proportion de projets portés par des femmes entrepreneures par rapport aux hommes porteurs de projet.",
    formule: "COUNT(core_projet.id) GROUP BY porteur.genre (F, H, A)",
    periode: "Cumul des projets enregistrés.",
    source: "apps.core.models.User.genre (table core_user)",
    limites:
      "L'indicateur reflète le genre de la personne enregistrée comme porteur principal du projet. Il ne capture pas la parité interne des équipes pluridisciplinaires complètes.",
    interpretation:
      "Évalue l'engagement du CIAT en faveur de l'entrepreneuriat féminin et de l'accès des femmes aux carrières STIM.",
  },
  {
    code: "total_finance",
    nom: "Volume total des financements mobilisés",
    categorie: "Financements & Ressources",
    definition:
      "Montant cumulé des financements accordés ou contractualisés au profit des projets incubés (subventions, concours, prêts d'honneur, accélérateurs, fonds institutionnels).",
    formule: "SUM(analytics_financement.montant) en Francs CFA (XOF)",
    periode: "Exercice en cours ou cumul historique filtrable.",
    source: "apps.analytics.models.Financement (table analytics_financement)",
    limites:
      "Représente les montants engagés et contractualisés. Ne garantit pas le versement immédiat sur les comptes des porteurs sans vérification des décaissements.",
    interpretation:
      "Quantifie l'effet de levier financier du CIAT : capacité à attirer des capitaux et des subventions pour accélérer le développement technologique des startups incubées.",
  },
  {
    code: "financements_decaisses",
    nom: "Financements effectivement décaissés",
    categorie: "Financements & Ressources",
    definition:
      "Montant cumulé des financements ayant fait l'objet d'un déblocage effectif (statut 'decaiss') au profit des activités des porteurs de projet.",
    formule: "SUM(analytics_financement.montant) WHERE statut = 'decaiss'",
    periode: "Période budgétaire active.",
    source: "apps.analytics.models.Financement (table analytics_financement)",
    limites:
      "Dépend du rythme de validation des justificatifs de dépenses et des jalons techniques d'étape.",
    interpretation:
      "Mesure la liquidité réelle injectée dans les projets. Le ratio décaissements / engagements reflète la célérité administrative et le respect des échéances.",
  },
  {
    code: "partenariats_actifs",
    nom: "Partenariats conventionnés en vigueur",
    categorie: "Partenariats & Réseau",
    definition:
      "Nombre d'accords et de conventions de partenariat opérationnels (statut 'actif') signés avec des partenaires industriels, financiers, académiques ou institutionnels.",
    formule: "COUNT(analytics_partenariat.id) WHERE statut = 'actif'",
    periode: "Conventions valides à date.",
    source: "apps.analytics.models.Partenariat (table analytics_partenariat)",
    limites:
      "Prend en compte les partenariats formalisés au niveau de la plateforme. Les conventions informelles ou en cours de négociation ne sont pas comptabilisées.",
    interpretation:
      "Mesure la richesse de l'écosystème d'innovation et le réseau d'appui mobilisable pour les porteurs.",
  },
  {
    code: "jalons_en_retard",
    nom: "Jalons critiques en retard d'exécution",
    categorie: "Gouvernance & Jalons",
    definition:
      "Nombre d'étapes clés ou de jalons d'incubation dont la date d'échéance prévisionnelle est dépassée alors que le jalon est toujours au statut 'a_faire' ou 'en_cours'.",
    formule:
      "COUNT(incubator_jalon.id) WHERE echeance < CURRENT_DATE AND statut != 'fait'",
    periode: "Contrôle en temps réel.",
    source: "apps.incubator.models.Jalon (propriété dynamique en_retard)",
    limites:
      "Un retard sur un jalon intermédiaire ne bloque pas nécessairement l'ensemble du projet si des voies de contournement technique ont été mises en œuvre par le mentor.",
    interpretation:
      "Indicateur d'alerte précoce pour l'équipe de coordination. Déclenche des revues de projet ciblées pour débloquer les verrous techniques ou administratifs.",
  },
  {
    code: "taux_conversion_prototype",
    nom: "Taux de conversion vers le prototype",
    categorie: "Entonnoir d'incubation",
    definition:
      "Pourcentage des projets sélectionnés qui parviennent à concevoir et valider un prototype fonctionnel.",
    formule: "(Prototypes réalisés / Projets sélectionnés) × 100",
    periode:
      "Mesure sur les cohortes ayant achevé ou avancé leur cycle d'incubation.",
    source: "apps.core.models.Projet",
    limites:
      "Ce ratio doit être interprété par cohorte : sur une cohorte récente (ex: 2026), ce taux est structurellement bas car les projets viennent d'entrer en incubation.",
    interpretation:
      "Indicateur d'efficacité technique des installations du CIAT (fablabs, bancs d'essai, ateliers).",
  },
];

const DEFAULT_CATEGORIES = [
  "Tous",
  "Entonnoir d'incubation",
  "Typologie & Diversité",
  "Financements & Ressources",
  "Partenariats & Réseau",
  "Gouvernance & Jalons",
];

export function MethodologieContent() {
  const [indicateurs, setIndicateurs] = useState<IndicateurDefinition[]>(FALLBACK_DEFINITIONS);
  const [categories, setCategories] = useState<string[]>(DEFAULT_CATEGORIES);
  const [activeCategory, setActiveCategory] = useState<string>("Tous");
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isFromApi, setIsFromApi] = useState<boolean>(false);
  const [expandedCodes, setExpandedCodes] = useState<Record<string, boolean>>({});
  const [isGridLayout, setIsGridLayout] = useState<boolean>(true);

  useEffect(() => {
    let isMounted = true;
    async function loadDefinitions() {
      try {
        const res = await api<DefinitionsResponse>(
          "/analytics/indicateurs/definitions/"
        );
        if (isMounted && res && Array.isArray(res.indicateurs)) {
          setIndicateurs(res.indicateurs);
          if (res.categories && res.categories.length > 0) {
            setCategories(["Tous", ...res.categories]);
          }
          setIsFromApi(true);
        }
      } catch {
        if (isMounted) {
          setIsFromApi(false);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }
    loadDefinitions();
    return () => {
      isMounted = false;
    };
  }, []);

  const toggleExpand = (code: string) => {
    setExpandedCodes((prev) => ({ ...prev, [code]: !prev[code] }));
  };

  const expandAll = () => {
    const next: Record<string, boolean> = {};
    filteredIndicateurs.forEach((ind) => {
      next[ind.code] = true;
    });
    setExpandedCodes(next);
  };

  const collapseAll = () => {
    setExpandedCodes({});
  };

  const q = searchTerm.trim().toLowerCase();
  const filteredIndicateurs = indicateurs.filter((ind) => {
    const matchesCat =
      activeCategory === "Tous" ||
      ind.categorie.toLowerCase() === activeCategory.toLowerCase();
    if (!matchesCat) return false;

    if (!q) return true;
    return (
      ind.nom.toLowerCase().includes(q) ||
      ind.code.toLowerCase().includes(q) ||
      ind.definition.toLowerCase().includes(q) ||
      ind.formule.toLowerCase().includes(q) ||
      ind.source.toLowerCase().includes(q)
    );
  });

  // Nombre d'indicateurs par catégorie pour les badges
  const categoryCounts: Record<string, number> = { Tous: indicateurs.length };
  indicateurs.forEach((ind) => {
    categoryCounts[ind.categorie] = (categoryCounts[ind.categorie] || 0) + 1;
  });

  return (
    <div className="min-h-screen bg-[#FAF7F2]/60 pb-16">
      {/* 1. Header supérieur compact */}
      <header className="border-b border-[#EFE4D6] bg-white sticky top-0 z-30 shadow-2xs">
        <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#8C5E2D]">
                <BookOpen className="h-4 w-4 text-[#C99A68]" />
                <span>Référentiel Décisionnel CIAT</span>
                {isFromApi && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-[10px] font-bold text-emerald-800 border border-emerald-200">
                    <CheckCircle2 className="h-2.5 w-2.5" />
                    Source API active
                  </span>
                )}
              </div>
              <h1 className="text-xl font-black text-[#612D10] sm:text-2xl font-[family-name:var(--font-title)] tracking-tight">
                Méthodologie & Dictionnaire des Indicateurs
              </h1>
              <p className="text-xs text-[#6B5646]">
                Formules exactes, sources vérifiées et limites d&apos;interprétation pour le pilotage stratégique.
              </p>
            </div>

            <div className="flex items-center gap-2 self-start md:self-center shrink-0">
              <a
                href="#constats"
                className="inline-flex items-center gap-1.5 rounded-xl border border-[#EFE4D6] bg-[#FAF7F2] px-3 py-2 text-xs font-bold text-[#612D10] hover:bg-[#EFE4D6]/60 transition-colors"
              >
                <Sliders className="h-3.5 w-3.5 text-[#C99A68]" />
                <span>Règles des constats</span>
              </a>

              <Link
                href="/tableau-de-bord"
                className="inline-flex items-center gap-1.5 rounded-xl bg-[#612D10] px-3.5 py-2 text-xs font-bold text-white shadow-2xs transition hover:bg-[#3F1D0A]"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                <span>Tableau de bord</span>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* 2. Filtres, Recherche et Contrôles d'affichage */}
      <div className="mx-auto max-w-7xl px-4 pt-6 sm:px-6 lg:px-8 space-y-4">
        {/* Barre de contrôle compacte */}
        <div className="rounded-2xl border border-[#EFE4D6] bg-white p-4 shadow-sm space-y-3.5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            {/* Barre de recherche */}
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8C5E2D]/60" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Rechercher par nom, formule, code ou mot-clé..."
                className="w-full rounded-xl border border-[#EFE4D6] bg-[#FAF7F2]/50 py-2 pl-9.5 pr-4 text-xs sm:text-sm text-[#24140D] placeholder:text-[#a08f80] outline-none transition focus:border-[#C99A68] focus:bg-white focus:ring-2 focus:ring-[#C99A68]/30"
              />
            </div>

            {/* Boutons d'actions et mode d'affichage */}
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={expandAll}
                className="px-2.5 py-1.5 rounded-lg border border-[#EFE4D6] bg-white text-[11px] font-bold text-[#612D10] hover:bg-[#FAF7F2] transition-colors"
                title="Déplier tous les détails"
              >
                Tout déplier
              </button>
              <button
                type="button"
                onClick={collapseAll}
                className="px-2.5 py-1.5 rounded-lg border border-[#EFE4D6] bg-white text-[11px] font-bold text-[#612D10] hover:bg-[#FAF7F2] transition-colors"
                title="Replier tous les détails"
              >
                Tout replier
              </button>

              <div className="h-5 w-px bg-[#EFE4D6] mx-1" />

              <button
                type="button"
                onClick={() => setIsGridLayout(!isGridLayout)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#EFE4D6] bg-[#FAF7F2] text-[11px] font-bold text-[#612D10] hover:bg-white transition-colors"
                title={isGridLayout ? "Passer en vue liste 1 colonne" : "Passer en vue grille 2 colonnes"}
              >
                {isGridLayout ? (
                  <>
                    <List className="h-3.5 w-3.5 text-[#C99A68]" />
                    <span className="hidden sm:inline">Vue liste</span>
                  </>
                ) : (
                  <>
                    <LayoutGrid className="h-3.5 w-3.5 text-[#C99A68]" />
                    <span className="hidden sm:inline">Vue grille</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Onglets Catégories avec badges de comptage */}
          <div className="flex flex-wrap gap-1.5 border-t border-[#EFE4D6]/70 pt-3">
            {categories.map((cat) => {
              const isActive = activeCategory === cat;
              const count = categoryCounts[cat] ?? 0;
              return (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1 text-xs font-semibold transition-all ${
                    isActive
                      ? "bg-[#612D10] text-white shadow-2xs"
                      : "bg-[#FAF7F2] text-[#612D10] border border-[#EFE4D6] hover:bg-white hover:border-[#C99A68]"
                  }`}
                >
                  <span>{cat}</span>
                  <span
                    className={`rounded-full px-1.5 py-0.2 text-[10px] font-bold ${
                      isActive ? "bg-white/20 text-white" : "bg-[#EFE4D6] text-[#8C5E2D]"
                    }`}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* 3. Liste des indicateurs (Grille compacte 2 colonnes ou 1 colonne) */}
        <div>
          {isLoading ? (
            <div className="grid gap-4 sm:grid-cols-2">
              {[1, 2, 3, 4].map((n) => (
                <div
                  key={n}
                  className="h-36 animate-pulse rounded-2xl bg-white p-5 border border-[#EFE4D6]"
                />
              ))}
            </div>
          ) : filteredIndicateurs.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-[#EFE4D6] bg-white py-12 text-center shadow-xs">
              <Info className="mx-auto h-8 w-8 text-[#C99A68]" />
              <h3 className="mt-2 text-sm font-bold text-[#612D10]">
                Aucun indicateur trouvé
              </h3>
              <p className="mt-1 text-xs text-[#8C5E2D]">
                Modifiez vos termes de recherche ou réinitialisez la catégorie.
              </p>
            </div>
          ) : (
            <div
              className={`grid gap-4 ${
                isGridLayout ? "grid-cols-1 lg:grid-cols-2" : "grid-cols-1"
              }`}
            >
              {filteredIndicateurs.map((ind) => {
                const isExpanded = Boolean(expandedCodes[ind.code]);

                return (
                  <div
                    key={ind.code}
                    id={ind.code}
                    className="overflow-hidden rounded-2xl border border-[#EFE4D6] bg-white shadow-xs transition-all hover:border-[#C99A68] hover:shadow-sm flex flex-col justify-between"
                  >
                    {/* En-tête de la carte */}
                    <div className="p-4 sm:p-5 space-y-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-start gap-2.5 min-w-0">
                          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#FAF7F2] border border-[#EFE4D6] text-[#612D10]">
                            <Calculator className="h-4 w-4 text-[#8C5E2D]" />
                          </div>
                          <div className="min-w-0">
                            <h2 className="font-[family-name:var(--font-title)] text-sm sm:text-base font-bold text-[#612D10] leading-snug">
                              {ind.nom}
                            </h2>
                            <div className="flex flex-wrap items-center gap-1.5 pt-1 text-[11px] text-[#6B5646]">
                              <code className="rounded bg-[#FAF7F2] border border-[#EFE4D6] px-1.5 py-0.5 font-mono text-[10px] font-bold text-[#612D10]">
                                {ind.code}
                              </code>
                              <span>•</span>
                              <span className="font-medium text-[#8C5E2D]">
                                {ind.categorie}
                              </span>
                            </div>
                          </div>
                        </div>

                        <span className="shrink-0 rounded-full bg-[#FAF7F2] border border-[#EFE4D6] px-2 py-0.5 text-[10px] font-bold text-[#8C5E2D]">
                          {ind.categorie.split(" ")[0]}
                        </span>
                      </div>

                      {/* Définition synthétique */}
                      <p className="text-xs text-[#24140D] leading-relaxed line-clamp-3">
                        {ind.definition}
                      </p>

                      {/* Formule directement visible et compacte (requis pour tests E2E) */}
                      <div className="rounded-xl border border-[#EFE4D6] bg-[#FAF7F2]/80 p-2.5 flex items-start gap-2">
                        <Calculator className="h-3.5 w-3.5 text-[#8C5E2D] shrink-0 mt-0.5" />
                        <div className="min-w-0">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-[#8C5E2D] block">
                            Formule de calcul
                          </span>
                          <span className="font-mono text-xs font-bold text-[#612D10] break-words">
                            {ind.formule}
                          </span>
                        </div>
                      </div>

                      {/* Section dépliable pour les détails méthodologiques et limites */}
                      {isExpanded && (
                        <div className="pt-3 border-t border-[#EFE4D6] space-y-3 animate-in fade-in duration-150">
                          {/* Grille Source & Période */}
                          <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 text-xs">
                            <div className="rounded-xl border border-[#EFE4D6] bg-white p-2.5">
                              <span className="flex items-center gap-1 text-[11px] font-bold text-[#612D10]">
                                <Database className="h-3 w-3 text-[#C99A68]" />
                                Source de données
                              </span>
                              <p className="mt-1 font-mono text-[11px] text-[#6B5646] break-words">
                                {ind.source}
                              </p>
                            </div>

                            <div className="rounded-xl border border-[#EFE4D6] bg-white p-2.5">
                              <span className="flex items-center gap-1 text-[11px] font-bold text-[#612D10]">
                                <Clock className="h-3 w-3 text-[#C99A68]" />
                                Période & temporalité
                              </span>
                              <p className="mt-1 text-[11px] text-[#6B5646]">
                                {ind.periode}
                              </p>
                            </div>
                          </div>

                          {/* Limites méthodologiques (Encart sobre ambre) */}
                          <div className="rounded-xl border border-amber-200 bg-amber-50/70 p-3">
                            <div className="flex items-start gap-2">
                              <ShieldAlert className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-700" />
                              <div>
                                <h4 className="text-[11px] font-bold uppercase tracking-wider text-amber-900">
                                  Limites méthodologiques & nuances
                                </h4>
                                <p className="mt-0.5 text-xs text-amber-950 leading-relaxed">
                                  {ind.limites}
                                </p>
                              </div>
                            </div>
                          </div>

                          {/* Guide d'interprétation pour le comité */}
                          <div className="rounded-xl border border-[#EFE4D6] bg-[#FAF7F2]/60 p-3">
                            <div className="flex items-start gap-2">
                              <Lightbulb className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#8C5E2D]" />
                              <div>
                                <h4 className="text-[11px] font-bold uppercase tracking-wider text-[#612D10]">
                                  Guide de pilotage & décision
                                </h4>
                                <p className="mt-0.5 text-xs text-[#24140D] leading-relaxed">
                                  {ind.interpretation}
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Pied de carte : bouton d'accordéon pour déplier/replier */}
                    <button
                      type="button"
                      onClick={() => toggleExpand(ind.code)}
                      className="flex items-center justify-between border-t border-[#EFE4D6] bg-[#FAF7F2]/40 px-4 py-2 text-xs font-bold text-[#612D10] hover:bg-[#FAF7F2] transition-colors"
                    >
                      <span>
                        {isExpanded
                          ? "Masquer les détails & limites"
                          : "Voir source, limites & pilotage"}
                      </span>
                      {isExpanded ? (
                        <ChevronUp className="h-4 w-4 text-[#8C5E2D]" />
                      ) : (
                        <ChevronDown className="h-4 w-4 text-[#8C5E2D]" />
                      )}
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* 4. Section Règles des Constats et Recommandations Déterministes (Condensée en grille) */}
        <div
          id="constats"
          className="mt-10 rounded-2xl border border-[#EFE4D6] bg-white p-5 sm:p-6 shadow-sm scroll-mt-20 space-y-4"
        >
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-[#EFE4D6] pb-4">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#FAF7F2] border border-[#EFE4D6] text-[#612D10]">
                <Sliders className="h-4 w-4 text-[#8C5E2D]" />
              </div>
              <div>
                <h2 className="font-[family-name:var(--font-title)] text-base sm:text-lg font-bold text-[#612D10]">
                  Règles de Calcul des Constats Déterministes
                </h2>
                <p className="text-xs text-[#6B5646]">
                  5 algorithmes vérifiables, calculés sans IA, avec seuils minimaux de significativité statistique.
                </p>
              </div>
            </div>

            <span className="self-start sm:self-center text-xs font-bold px-2.5 py-1 rounded-full bg-[#FAF7F2] border border-[#EFE4D6] text-[#612D10]">
              5 règles auditées
            </span>
          </div>

          {/* Grille compacte des 5 règles de constats */}
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <div className="rounded-xl border border-[#EFE4D6] bg-[#FAF7F2]/40 p-3.5 space-y-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#8C5E2D] block">
                1. Concentration sectorielle
              </span>
              <p className="text-xs text-[#24140D] leading-snug">
                Identifie le secteur prédominant et mesure son poids relatif. Alerte si un domaine concentre plus de 35 % des dossiers.
              </p>
              <div className="text-[10px] font-bold text-[#612D10] bg-white rounded-md px-2 py-1 border border-[#EFE4D6]">
                Seuil : minimum 10 projets
              </div>
            </div>

            <div className="rounded-xl border border-[#EFE4D6] bg-[#FAF7F2]/40 p-3.5 space-y-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#8C5E2D] block">
                2. Représentation féminine
              </span>
              <p className="text-xs text-[#24140D] leading-snug">
                Proportion de femmes entrepreneures principales par rapport à l&apos;objectif charte CIAT (40 %).
              </p>
              <div className="text-[10px] font-bold text-[#612D10] bg-white rounded-md px-2 py-1 border border-[#EFE4D6]">
                Seuil : minimum 10 porteurs
              </div>
            </div>

            <div className="rounded-xl border border-[#EFE4D6] bg-[#FAF7F2]/40 p-3.5 space-y-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#8C5E2D] block">
                3. Taux de sélection
              </span>
              <p className="text-xs text-[#24140D] leading-snug">
                Ratio exact entre les projets admis et l&apos;ensemble des dossiers formellement soumis.
              </p>
              <div className="text-[10px] font-bold text-[#612D10] bg-white rounded-md px-2 py-1 border border-[#EFE4D6]">
                Seuil : minimum 10 dossiers soumis
              </div>
            </div>

            <div className="rounded-xl border border-[#EFE4D6] bg-[#FAF7F2]/40 p-3.5 space-y-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#8C5E2D] block">
                4. Retard critique de jalons
              </span>
              <p className="text-xs text-[#24140D] leading-snug">
                Dénombre les jalons non achevés dont l&apos;échéance est dépassée de plus de 30 jours calendaires.
              </p>
              <div className="text-[10px] font-bold text-[#612D10] bg-white rounded-md px-2 py-1 border border-[#EFE4D6]">
                Seuil : minimum 5 jalons suivis · retard &gt; 30j
              </div>
            </div>

            <div className="rounded-xl border border-[#EFE4D6] bg-[#FAF7F2]/40 p-3.5 space-y-2 sm:col-span-2 lg:col-span-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#8C5E2D] block">
                5. Décaissement effectif
              </span>
              <p className="text-xs text-[#24140D] leading-snug">
                Ratio entre les montants financiers décaissés et les financements globaux engagés par les partenaires.
              </p>
              <div className="text-[10px] font-bold text-[#612D10] bg-white rounded-md px-2 py-1 border border-[#EFE4D6]">
                Seuil : minimum 5 financements enregistrés
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-amber-200 bg-amber-50/70 p-3.5 flex items-start gap-2.5">
            <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0 text-amber-700" />
            <div className="text-xs text-amber-950 leading-relaxed">
              <strong className="font-bold">Garde-fou contre les petits échantillons :</strong> Si les filtres actifs restreignent les effectifs en dessous de ces seuils (ex : 2 projets sélectionnés), le moteur <strong>n&apos;affiche aucun constat ni pourcentage trompeur</strong> pour garantir la rigueur scientifique des conclusions.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
