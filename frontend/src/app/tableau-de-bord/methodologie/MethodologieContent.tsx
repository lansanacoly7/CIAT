"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  Award,
  CalendarClock,
  CheckCircle2,
  Coins,
  FileText,
  Handshake,
  Layers,
  Lightbulb,
  Percent,
  PieChart,
  Rocket,
  Timer,
  TrendingUp,
  Users,
  Wallet,
  X,
  type LucideIcon,
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

/** Nom court + icône par indicateur (affichage visuel). */
const VISUEL: Record<string, { court: string; icon: LucideIcon }> = {
  idees_recues: { court: "Idées reçues", icon: Lightbulb },
  dossiers_deposes: { court: "Dossiers déposés", icon: FileText },
  projets_selectionnes: { court: "Projets retenus", icon: CheckCircle2 },
  projets_incubes: { court: "Projets incubés", icon: Rocket },
  prototypes: { court: "Prototypes", icon: Award },
  taux_selection: { court: "Taux de sélection", icon: Percent },
  taux_conversion_prototype: { court: "Taux de prototypage", icon: TrendingUp },
  par_domaine: { court: "Par domaine", icon: PieChart },
  par_cohorte: { court: "Par promotion", icon: Layers },
  par_genre: { court: "Parité", icon: Users },
  evolution_mensuelle: { court: "Évolution mensuelle", icon: CalendarClock },
  total_finance: { court: "Montant mobilisé", icon: Coins },
  financements_decaisses: { court: "Montant décaissé", icon: Wallet },
  partenariats_actifs: { court: "Partenariats actifs", icon: Handshake },
  jalons_en_retard: { court: "Jalons en retard", icon: Timer },
};

/** Étapes du parcours d'un projet (schéma en entonnoir). */
const PARCOURS = [
  "idees_recues",
  "dossiers_deposes",
  "projets_selectionnes",
  "projets_incubes",
  "prototypes",
];

const COULEURS_PARCOURS = ["#C99A68", "#B0804F", "#8C5E2D", "#6E4420", "#4A2A12"];

const REGLES_CONSTATS = [
  { nom: "Concentration sectorielle", seuil: "10", unite: "projets" },
  { nom: "Représentation féminine", seuil: "10", unite: "porteurs" },
  { nom: "Taux de sélection", seuil: "10", unite: "dossiers" },
  { nom: "Jalons en retard", seuil: "5", unite: "jalons" },
  { nom: "Décaissement", seuil: "5", unite: "financements" },
];

function visuel(ind: IndicateurDefinition) {
  return VISUEL[ind.code] ?? { court: ind.nom, icon: PieChart };
}

function Tuile({
  ind,
  onOpen,
}: {
  ind: IndicateurDefinition;
  onOpen: (ind: IndicateurDefinition) => void;
}) {
  const { court, icon: Icon } = visuel(ind);
  return (
    <button
      type="button"
      id={`ind-${ind.code}`}
      onClick={() => onOpen(ind)}
      className="group flex flex-col items-center gap-2 rounded-xl border border-[rgba(60,35,20,0.10)] bg-white p-4 text-center transition hover:border-[#C99A68] hover:shadow-sm"
    >
      <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#FBF3E9] text-[#8C5E2D] transition group-hover:bg-[#C99A68] group-hover:text-white">
        <Icon className="h-5 w-5" />
      </span>
      <span className="text-xs font-medium text-[#21130D]">{court}</span>
    </button>
  );
}

export function MethodologieContent() {
  const [indicateurs, setIndicateurs] =
    useState<IndicateurDefinition[]>(FALLBACK_DEFINITIONS);
  const [selection, setSelection] = useState<IndicateurDefinition | null>(null);

  useEffect(() => {
    let isMounted = true;
    api<DefinitionsResponse>("/analytics/indicateurs/definitions/")
      .then((res) => {
        if (isMounted && res && Array.isArray(res.indicateurs) && res.indicateurs.length) {
          setIndicateurs(res.indicateurs);
        }
      })
      .catch(() => {
        // On garde les définitions locales
      });
    return () => {
      isMounted = false;
    };
  }, []);

  // Fermeture du détail avec Échap
  useEffect(() => {
    if (!selection) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setSelection(null);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [selection]);

  const parCode = new Map(indicateurs.map((i) => [i.code, i]));
  const etapes = PARCOURS.map((c) => parCode.get(c)).filter(
    (i): i is IndicateurDefinition => Boolean(i)
  );
  const autres = indicateurs.filter((i) => !PARCOURS.includes(i.code));

  return (
    <div className="min-h-screen bg-white pb-16">
      <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6 space-y-10">
        <header className="flex items-center justify-between gap-3">
          <h1 className="font-serif text-2xl text-[#21130D]">Méthodologie</h1>
          <Link
            href="/tableau-de-bord"
            className="inline-flex items-center gap-1.5 text-sm text-[#5A4B42] hover:text-[#21130D]"
          >
            <ArrowLeft className="h-4 w-4" />
            Tableau de bord
          </Link>
        </header>

        {/* 1. Parcours d'un projet */}
        <section className="space-y-4">
          <h2 className="text-sm font-semibold text-[#21130D]">Parcours d&apos;un projet</h2>
          <ol className="flex items-start sm:items-center">
            {etapes.map((ind, i) => {
              const { court, icon: Icon } = visuel(ind);
              return (
                <li
                  key={ind.code}
                  className="flex flex-1 items-center"
                >
                  <button
                    type="button"
                    id={`ind-${ind.code}`}
                    onClick={() => setSelection(ind)}
                    className="group flex w-full flex-col items-center gap-2 rounded-xl p-1 sm:p-3 transition hover:bg-[#FBF8F3]"
                  >
                    <span
                      className="flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-full text-white transition group-hover:scale-105"
                      style={{ backgroundColor: COULEURS_PARCOURS[i] }}
                    >
                      <Icon className="h-5 w-5" />
                    </span>
                    <span className="text-[11px] sm:text-xs font-medium leading-tight text-[#21130D]">{court}</span>
                  </button>
                  {i < etapes.length - 1 && (
                    <ArrowRight className="hidden h-4 w-4 shrink-0 text-[#C99A68] sm:block" />
                  )}
                </li>
              );
            })}
          </ol>
        </section>

        {/* 2. Autres indicateurs */}
        <section className="space-y-4">
          <h2 className="text-sm font-semibold text-[#21130D]">Indicateurs</h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
            {autres.map((ind) => (
              <Tuile key={ind.code} ind={ind} onOpen={setSelection} />
            ))}
          </div>
        </section>

        {/* 3. Seuils des constats */}
        <section id="constats" className="space-y-4 scroll-mt-20">
          <h2 className="text-sm font-semibold text-[#21130D]">Seuils minimum des constats</h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
            {REGLES_CONSTATS.map((r) => (
              <div key={r.nom} className="rounded-xl bg-[#FBF8F3] p-4 text-center">
                <div className="text-2xl font-semibold text-[#8C5E2D] tabular-nums">{r.seuil}</div>
                <div className="text-[11px] text-[#5A4B42]">{r.unite}</div>
                <div className="mt-2 text-xs font-medium text-[#21130D]">{r.nom}</div>
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* Détail d'un indicateur */}
      {selection && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/30 sm:items-center sm:p-4"
          onClick={() => setSelection(null)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="detail-titre"
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md space-y-4 rounded-t-2xl bg-white p-5 shadow-xl sm:rounded-2xl"
          >
            <div className="flex items-start justify-between gap-3">
              <h3 id="detail-titre" className="text-base font-semibold text-[#21130D]">
                {selection.nom}
              </h3>
              <button
                type="button"
                onClick={() => setSelection(null)}
                aria-label="Fermer"
                className="rounded-lg p-1 text-[#5A4B42] hover:bg-[#FBF8F3]"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <p className="text-sm text-[#5A4B42]">{selection.definition}</p>
            <div className="rounded-lg bg-[#FBF8F3] px-3 py-2 font-mono text-xs text-[#612D10] break-words">
              {selection.formule}
            </div>
            <p className="text-xs text-[#5A4B42]">
              <span className="font-semibold text-[#21130D]">Limite : </span>
              {selection.limites}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
