"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  BookOpen,
  Calculator,
  Clock,
  Database,
  Filter,
  Info,
  Lightbulb,
  Search,
  ShieldAlert,
  Sparkles,
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
        // Fallback transparent aux constantes
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

  const filteredIndicateurs = useMemo(() => {
    return indicateurs.filter((ind) => {
      const matchesCat =
        activeCategory === "Tous" ||
        ind.categorie.toLowerCase() === activeCategory.toLowerCase();
      if (!matchesCat) return false;

      if (!searchTerm.trim()) return true;
      const q = searchTerm.toLowerCase();
      return (
        ind.nom.toLowerCase().includes(q) ||
        ind.code.toLowerCase().includes(q) ||
        ind.definition.toLowerCase().includes(q) ||
        ind.formule.toLowerCase().includes(q) ||
        ind.source.toLowerCase().includes(q)
      );
    });
  }, [indicateurs, activeCategory, searchTerm]);

  return (
    <div className="min-h-screen bg-zinc-50/70 pb-16">
      {/* 1. Header supérieur */}
      <header className="border-b border-zinc-200 bg-white shadow-sm">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#9a3412]">
                <BookOpen className="h-4 w-4" />
                <span>Référentiel Décisionnel CIAT</span>
                {isFromApi && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-medium text-emerald-700 ring-1 ring-inset ring-emerald-600/20">
                    <Sparkles className="h-2.5 w-2.5" />
                    Source API active
                  </span>
                )}
              </div>
              <h1 className="mt-1 text-2xl font-bold tracking-tight text-zinc-900 sm:text-3xl">
                Méthodologie & Dictionnaire des Indicateurs
              </h1>
              <p className="mt-1 text-sm text-zinc-600">
                Définition exacte, formule mathématique, source de données
                vérifiée et limites méthodologiques pour chaque métrique du
                tableau de bord.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <Link
                href="/tableau-de-bord"
                className="inline-flex items-center gap-2 rounded-lg border border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-zinc-700 shadow-sm transition hover:bg-zinc-50 hover:text-zinc-900 focus:outline-none focus:ring-2 focus:ring-[#9a3412]"
              >
                <ArrowLeft className="h-4 w-4" />
                Retour au tableau de bord
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* 2. Filtres et Recherche */}
      <div className="mx-auto max-w-7xl px-4 pt-8 sm:px-6 lg:px-8">
        <div className="rounded-2xl border border-zinc-200/80 bg-white p-4 shadow-sm sm:p-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            {/* Barre de recherche */}
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Rechercher par nom, formule, code ou mot-clé..."
                className="w-full rounded-xl border border-zinc-200 bg-zinc-50/50 py-2.5 pl-10 pr-4 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-[#9a3412] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#9a3412]"
              />
            </div>

            {/* Compteur d'indicateurs */}
            <div className="flex items-center gap-2 text-xs font-medium text-zinc-500">
              <Filter className="h-3.5 w-3.5 text-zinc-400" />
              <span>
                {filteredIndicateurs.length} indicateur
                {filteredIndicateurs.length > 1 ? "s" : ""}{" "}
                {activeCategory !== "Tous" ? `(${activeCategory})` : "référencé(s)"}
              </span>
            </div>
          </div>

          {/* Onglets / Catégories */}
          <div className="mt-4 flex flex-wrap gap-2 border-t border-zinc-100 pt-4">
            {categories.map((cat) => {
              const isActive = activeCategory === cat;
              return (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${
                    isActive
                      ? "bg-[#9a3412] text-white shadow-sm"
                      : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200/80 hover:text-zinc-900"
                  }`}
                >
                  {cat}
                </button>
              );
            })}
          </div>
        </div>

        {/* 3. Liste des indicateurs */}
        <div className="mt-8 space-y-6">
          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((n) => (
                <div
                  key={n}
                  className="h-44 animate-pulse rounded-2xl bg-white p-6 shadow-sm ring-1 ring-zinc-200/80"
                />
              ))}
            </div>
          ) : filteredIndicateurs.length === 0 ? (
            <div className="rounded-2xl border border-zinc-200 bg-white py-12 text-center shadow-sm">
              <Info className="mx-auto h-8 w-8 text-zinc-400" />
              <h3 className="mt-2 text-sm font-semibold text-zinc-900">
                Aucun indicateur trouvé
              </h3>
              <p className="mt-1 text-sm text-zinc-500">
                Modifiez vos critères de recherche ou réinitialisez la
                catégorie.
              </p>
            </div>
          ) : (
            filteredIndicateurs.map((ind) => (
              <div
                key={ind.code}
                id={ind.code}
                className="overflow-hidden rounded-2xl border border-zinc-200/80 bg-white shadow-sm transition hover:border-zinc-300 hover:shadow-md"
              >
                {/* En-tête de la carte */}
                <div className="border-b border-zinc-100 bg-zinc-50/50 px-6 py-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-orange-100/80 text-[#9a3412]">
                        <Calculator className="h-5 w-5" />
                      </div>
                      <div>
                        <h2 className="text-base font-bold text-zinc-900 sm:text-lg">
                          {ind.nom}
                        </h2>
                        <div className="flex flex-wrap items-center gap-2 pt-0.5 text-xs text-zinc-500">
                          <code className="rounded bg-zinc-100 px-1.5 py-0.5 font-mono text-[11px] text-zinc-700">
                            {ind.code}
                          </code>
                          <span>•</span>
                          <span className="font-medium text-zinc-600">
                            {ind.categorie}
                          </span>
                        </div>
                      </div>
                    </div>

                    <span className="inline-flex items-center rounded-full bg-orange-50 px-3 py-1 text-xs font-semibold text-[#9a3412] ring-1 ring-inset ring-orange-600/20">
                      {ind.categorie}
                    </span>
                  </div>
                </div>

                {/* Corps de la carte */}
                <div className="p-6 space-y-5">
                  {/* Définition */}
                  <div>
                    <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
                      Définition précise
                    </h3>
                    <p className="mt-1.5 text-sm leading-relaxed text-zinc-700">
                      {ind.definition}
                    </p>
                  </div>

                  {/* Formule de calcul */}
                  <div className="rounded-xl border border-zinc-200/90 bg-zinc-900 p-3 sm:p-3.5 text-white shadow-inner overflow-hidden">
                    <div className="flex items-center justify-between text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
                      <span className="flex items-center gap-1.5">
                        <Calculator className="h-3.5 w-3.5 text-amber-400" />
                        Formule mathématique & logique
                      </span>
                    </div>
                    <div className="mt-1.5 font-mono text-xs sm:text-sm font-medium text-amber-200 break-words overflow-x-auto leading-relaxed">
                      {ind.formule}
                    </div>
                  </div>

                  {/* Grille Source & Période */}
                  <div className="grid grid-cols-1 gap-3 sm:gap-4 sm:grid-cols-2">
                    <div className="rounded-xl border border-zinc-100 bg-zinc-50/70 p-3 sm:p-3.5">
                      <div className="flex items-center gap-2 text-xs font-semibold text-zinc-700">
                        <Database className="h-3.5 w-3.5 text-[#9a3412]" />
                        <span>Source des données</span>
                      </div>
                      <p className="mt-1 text-xs font-mono text-zinc-600 break-words">
                        {ind.source}
                      </p>
                    </div>

                    <div className="rounded-xl border border-zinc-100 bg-zinc-50/70 p-3.5">
                      <div className="flex items-center gap-2 text-xs font-semibold text-zinc-700">
                        <Clock className="h-3.5 w-3.5 text-blue-600" />
                        <span>Période & temporalité</span>
                      </div>
                      <p className="mt-1 text-xs text-zinc-600">
                        {ind.periode}
                      </p>
                    </div>
                  </div>

                  {/* Limites méthodologiques (Alerte mise en avant selon consignes) */}
                  <div className="rounded-xl border border-amber-200 bg-amber-50/60 p-4">
                    <div className="flex items-start gap-3">
                      <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0 text-amber-700" />
                      <div>
                        <h4 className="text-xs font-bold uppercase tracking-wider text-amber-900">
                          Limites méthodologiques & nuances
                        </h4>
                        <p className="mt-1 text-xs leading-relaxed text-amber-900">
                          {ind.limites}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Interprétation et pilotage */}
                  <div className="rounded-xl border border-blue-100 bg-blue-50/40 p-4">
                    <div className="flex items-start gap-3">
                      <Lightbulb className="mt-0.5 h-4 w-4 shrink-0 text-blue-700" />
                      <div>
                        <h4 className="text-xs font-bold uppercase tracking-wider text-blue-900">
                          Guide d&apos;interprétation pour le comité
                        </h4>
                        <p className="mt-1 text-xs leading-relaxed text-blue-900">
                          {ind.interpretation}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
