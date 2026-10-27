import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Badge, ButtonLink, Card, ProjectStatusBadge } from "@/components/ui";
import { MODULES } from "@/lib/modules";

export const metadata: Metadata = {
  title: "CIAT — Centre d'Innovation, d'Application et de Transfert | ISEP Diamniadio",
  description:
    "Plateforme officielle du CIAT de l'ISEP Amadou Trawaré de Diamniadio : incubation d'élite, prototypage en ateliers, assistant IA souverain et valorisation des innovations technologiques.",
};

const DOMAINES_CARDS = [
  {
    id: 1,
    nom: "TIC, Numérique, IA & Données",
    tags: "LLM Locaux · Vision · IoT",
    resume: "Systèmes d'IA embarqués, plateformes SaaS souveraines, jumeaux numériques et algorithmes décisionnels.",
    equipements: "Serveurs de calcul GPU, passerelles LoRaWAN, bancs de test IoT",
    projetsCount: "08 projets",
  },
  {
    id: 2,
    nom: "Mécanique, Fabrication & Maintenance",
    tags: "Usinage CNC · Impression 3D · CFAO",
    resume: "Usinage de précision, fabrication additive avancée, bancs d'essai mécaniques et maintenance prédictive.",
    equipements: "Fraiseuses CNC 3-5 axes, imprimantes 3D industrielles, bancs d'alignement",
    projetsCount: "06 projets",
  },
  {
    id: 3,
    nom: "Agriculture, Transformation & Environnement",
    tags: "Capteurs Sols · Écoséchoirs · Biomasse",
    resume: "Séchoirs solaires connectés, capteurs IoT d'irrigation et valorisation biotechnologique de la biomasse locale.",
    equipements: "Capteurs tensiométriques, séchoirs hybrides régulés, spectromètres de sol",
    projetsCount: "05 projets",
  },
  {
    id: 4,
    nom: "Énergie & Énergies Renouvelables",
    tags: "Photovoltaïque · Micro-réseaux · Stockage",
    resume: "Micro-réseaux hybrides, gestionnaires de stockage par batterie et audits thermiques automatisés pour l'habitat.",
    equipements: "Bancs de test photovoltaïques, optimiseurs MPPT, analyseurs de réseau électrique",
    projetsCount: "04 projets",
  },
  {
    id: 5,
    nom: "Pharmaceutique & Biomédical",
    tags: "Télémétrie · Traçabilité · Dispositifs",
    resume: "Dispositifs biomédicaux hospitaliers, traçabilité des intrants et maintenance d'équipements de soins de santé.",
    equipements: "Simulateurs de signaux physiologiques, bancs de stérilisation, capteurs biométriques",
    projetsCount: "03 projets",
  },
  {
    id: 6,
    nom: "Éducation & Formation Professionnelle",
    tags: "Simulateurs TP · EdTech · Compétences",
    resume: "Pédagogie active, simulateurs virtuels de travaux pratiques et plateformes d'évaluation par compétences professionnelles.",
    equipements: "Casques VR pour simulateurs techniques, logiciels de CFAO pédagogiques",
    projetsCount: "04 projets",
  },
  {
    id: 7,
    nom: "Services aux Collectivités & Incubation",
    tags: "Smart City · Chaînes de Valeur · Civisme",
    resume: "Gestion territoriale numérique, traçabilité des filières urbaines et gouvernance entrepreneuriale inclusive.",
    equipements: "Outils SIG cadastraux, bornes connectées de collecte, passerelles de paiement local",
    projetsCount: "05 projets",
  },
];

const ETAPES_PARCOURS = [
  {
    numero: "01",
    titre: "Candidature & Dépôt",
    jalon: "Jalon 1 : Idée Soumise",
    delai: "Semaine 1 - 2",
    action: "Dépôt en ligne via le canevas officiel avec synthèse du besoin et pièces justificatives.",
    livrable: "Vérification de recevabilité et conformité aux filières ISEP par le secrétariat technique.",
  },
  {
    numero: "02",
    titre: "Comité de Sélection",
    jalon: "Jalon 2 : En Comité",
    delai: "Semaine 3",
    action: "Pitch de 10 minutes devant le jury collégial d'enseignants-chercheurs et d'industriels.",
    livrable: "Grille d'évaluation multicritère (faisabilité technique, pertinence et ancrage territorial).",
  },
  {
    numero: "03",
    titre: "Incubation Active",
    jalon: "Jalon 3 : Incubation",
    delai: "Mois 1 à 6",
    action: "Attribution d'un mentor expert dédié, revues d'étape régulières et feuille de route technique.",
    livrable: "Bilans de suivi trimestriels et validation des livrables de cadrage et faisabilité.",
  },
  {
    numero: "04",
    titre: "Prototypage & Essais",
    jalon: "Jalon 4 : Prototype Prêt",
    delai: "Mois 3 à 9",
    action: "Fabrication physique, usinage, assemblage électronique et essais dans les laboratoires de l'ISEP.",
    livrable: "Prototype fonctionnel testé en conditions réelles et dossier technique de banc d'essai.",
  },
  {
    numero: "05",
    titre: "Galerie & Transfert",
    jalon: "Jalon 5 : Transfert",
    delai: "Mois 9 à 12",
    action: "Publication sur le showroom public, génération de QR Code sur salon et transfert économique.",
    livrable: "Fiche d'innovation publique certifiée et mise en relation avec investisseurs ou industriels.",
  },
];

const PROJETS_PHARES = [
  {
    id: 1,
    titre: "AgriSol — Pompes Solaires & Irrigation Intelligente",
    filiere: "Agriculture & Énergies Renouvelables",
    badge: "Prototype Opérationnel",
    resume:
      "Station de pompage photovoltaïque autonome couplée à un réseau de capteurs LoRaWAN d'humidité des sols. Réduction de 40% de la consommation d'eau pour les maraîchers des Niayes.",
    impact: "Testé en conditions réelles sur périmètres maraîchers",
    equipements: "Capteurs LoRaWAN · Pompage Solaire · Automate",
  },
  {
    id: 2,
    titre: "Banc CNC 4.0 — Usinage de Précision & Maintenance",
    filiere: "Mécanique & Fabrication Additive",
    badge: "En Démonstration",
    resume:
      "Dispositif de fraisage assisté par ordinateur pour usinage de pièces de rechange métalliques avec capteurs de vibrations pour maintenance prédictive industrielle.",
    impact: "Fabrication locale de pièces pour les PME de Diamniadio",
    equipements: "Atelier Mécanique ISEP · Fraiseuse CNC · CFAO",
  },
  {
    id: 3,
    titre: "Dispositif Médical Connecté & Télémétrie",
    filiere: "Pharmaceutique & Biomédical",
    badge: "Validation Technique",
    resume:
      "Système hospitalier de surveillance des constantes vitales pour postes de santé décentralisés avec alerte automatisée et faible consommation énergétique.",
    impact: "Déployé en phase pilote de test biomédical",
    equipements: "Bancs de calibration · Capteurs ECG · MCU sécurisé",
  },
];

const PROFILS_ACCUEIL = [
  {
    titre: "Porteurs de Projet & Startups",
    sousTitre: "De l'idée au prototype viable",
    description:
      "Vous avez une idée novatrice ou un projet d'ingénierie ? Intégrez une cohorte, accédez aux ateliers et bénéficiez d'un mentorat technique d'élite.",
    action: { label: "Déposer une Candidature", href: "/connexion?next=/incubateur" },
    lienSecondaire: { label: "Consulter les Appels à Projets", href: "/portail/appels" },
  },
  {
    titre: "Industriels & Partenaires Économiques",
    sousTitre: "Transfert de technologie & bancs de test",
    description:
      "Collaborez avec nos chercheurs et apprenants, accédez aux brevets et prototypes du showroom, ou soumettez un défi technique réel à nos ateliers.",
    action: { label: "Découvrir la Galerie des Prototypes", href: "/galerie" },
    lienSecondaire: { label: "Proposer un Partenariat", href: "/portail/contact" },
  },
  {
    titre: "Apprenants & Communauté ISEP",
    sousTitre: "Ressources, ateliers & souveraineté",
    description:
      "Consultez les règlements intérieurs, téléchargez les canevas types de prototypage et interrogez notre assistant IA souverain indexé sur les référentiels.",
    action: { label: "Interroger l'Assistant IA", href: "/assistant" },
    lienSecondaire: { label: "Espace Documentaire Officiel", href: "/portail/documents" },
  },
];

export default function Home() {
  return (
    <>
      {/* =====================================================================
       * 1. HERO IMMERSIF PLEINE LARGEUR (DESIGN ISEP-AT DIAMNIADIO)
       *    - Photo campus plein écran haute définition 2K (2048x1042 Truecolor)
       *    - Dégradé directionnel gauche -> droite (88% sombre chaud -> transparent à droite)
       *    - Titre blanc pur éclatant garanti (style={{ color: '#FFFFFF' }})
       *    - Hauteur calibrée sans défilement forcé (tout est visible au premier regard)
       *    - Boutons ButtonLink standardisés conformes au Design System CIAT (ui.tsx)
       * =================================================================== */}
      <section className="relative w-full overflow-hidden min-h-[540px] lg:h-[calc(100vh-76px)] lg:max-h-[660px] flex items-center bg-[#24140D] border-b border-[#3d2315]">
        {/* Photo du campus en arrière-plan pleine largeur */}
        <div className="absolute inset-0 z-0">
          <Image
            src="/images/campus-isep.png"
            alt="Campus officiel de l'ISEP Amadou Traoré de Diamniadio — Siège du CIAT"
            fill
            priority
            sizes="100vw"
            className="object-cover object-[center_35%]"
          />
          {/* Dégradé directionnel horizontal : contraste parfait à gauche, campus lumineux à droite */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background:
                "linear-gradient(90deg, rgba(28, 14, 8, 0.88) 0%, rgba(28, 14, 8, 0.72) 42%, rgba(28, 14, 8, 0.30) 70%, rgba(28, 14, 8, 0.05) 90%, rgba(28, 14, 8, 0.0) 100%)",
            }}
          />
          {/* Léger fondu en bas pour une transition naturelle */}
          <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-[#24140D] to-transparent pointer-events-none" />
        </div>

        {/* Contenu textuel aligné à gauche */}
        <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 w-full py-10 lg:py-0">
          <div className="max-w-2xl lg:max-w-3xl space-y-5 sm:space-y-6">
            
            {/* Badge officiel de localisation */}
            <div className="inline-flex items-center rounded-lg border border-white/20 bg-black/30 backdrop-blur-xs px-3.5 py-1 text-xs sm:text-sm font-medium text-white/90 shadow-sm">
              ISEP Amadou Traoré · Diamniadio · CIAT
            </div>

            {/* Grand Titre net, massif et percutant en BLANC PUR STRICT */}
            <h1
              className="text-3xl sm:text-4xl md:text-5xl lg:text-[3.25rem] font-extrabold tracking-tight !text-white leading-[1.15]"
              style={{ color: "#FFFFFF" }}
            >
              L&apos;excellence technologique et l&apos;incubation d&apos;élite du Sénégal
            </h1>

            {/* Sous-titre lisible, lumineux et aéré */}
            <p className="text-sm sm:text-base md:text-lg text-[#F7EFE6] leading-relaxed max-w-xl font-normal">
              Prototypez, accélérez et valorisez vos innovations dans un écosystème d&apos;ingénierie appliquée de classe mondiale. Ateliers spécialisés, mentorat expert et IA souveraine à Diamniadio.
            </p>

            {/* Boutons d'Action standardisés conformes au Design System CIAT (ui.tsx) */}
            <div className="flex flex-wrap items-center gap-4 pt-2">
              <ButtonLink
                href="/portail/incubateur"
                variant="accent"
                className="text-sm sm:text-base font-bold shadow-md px-6 py-3"
              >
                Découvrir l&apos;Incubateur →
              </ButtonLink>
              <ButtonLink
                href="/portail/appels"
                variant="secondary"
                className="text-sm sm:text-base font-semibold shadow-md px-6 py-3 !border-white/30 !bg-white/10 !text-white hover:!bg-white/20"
              >
                Candidater maintenant
              </ButtonLink>
            </div>

          </div>
        </div>
      </section>

      {/* =====================================================================
       * 2. LE CIAT & SES 3 MISSIONS RÉELLES (Éditorial Split-Screen)
       *    Mise en scène vivante : la réalité physique des ateliers et du transfert.
       * =================================================================== */}
      <section className="border-b border-bordure bg-white py-16 md:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            
            {/* Colonne Gauche (7 cols) : Manifeste & 3 Missions Fondamentales */}
            <div className="lg:col-span-7 space-y-6">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-beige">
                  Ancrage Académique &amp; Mandat Stratégique
                </p>
                <h2 className="mt-2 text-2xl sm:text-3xl lg:text-4xl font-extrabold text-brun tracking-tight leading-tight">
                  Du Banc d&apos;Essai Technologique au Transfert Industriel
                </h2>
                <p className="mt-4 text-base text-texte-doux leading-relaxed">
                  Implanté au cœur de la Cité du Savoir de Diamniadio, le CIAT n&apos;est pas un simple incubateur théorique : c&apos;est un centre d&apos;ingénierie appliquée où chaque concept est conçu, usiné, modélisé et testé en atelier avant d&apos;être transféré vers le tissu productif national.
                </p>
              </div>

              {/* 3 Blocs d'impact distinctifs (avec repères visuels) */}
              <div className="space-y-4 pt-2">
                <div className="flex gap-4 p-4 rounded-xl border border-bordure bg-[#FAF7F2] transition-colors hover:border-beige">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-brun text-white font-bold text-sm">
                    01
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-brun">
                      Ateliers Spécialisés &amp; Prototypage Réel
                    </h3>
                    <p className="mt-1 text-xs sm:text-sm text-texte-doux leading-relaxed">
                      Accès direct aux machines-outils CNC, à l&apos;impression 3D additive, à l&apos;électronique de puissance et aux bancs de test mécatroniques de l&apos;ISEP.
                    </p>
                  </div>
                </div>

                <div className="flex gap-4 p-4 rounded-xl border border-bordure bg-[#FAF7F2] transition-colors hover:border-beige">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-beige text-brun font-bold text-sm">
                    02
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-brun">
                      Mentorat Industriel &amp; Évaluation Collégiale
                    </h3>
                    <p className="mt-1 text-xs sm:text-sm text-texte-doux leading-relaxed">
                      Chaque porteur est guidé par un enseignant-chercheur et un mentor du secteur privé à travers 5 jalons contractuels de maturation.
                    </p>
                  </div>
                </div>

                <div className="flex gap-4 p-4 rounded-xl border border-bordure bg-[#FAF7F2] transition-colors hover:border-beige">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-brun-fonce text-white font-bold text-sm">
                    03
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-brun">
                      Propriété Intellectuelle &amp; Valorisation Économique
                    </h3>
                    <p className="mt-1 text-xs sm:text-sm text-texte-doux leading-relaxed">
                      Showroom public certifié avec QR Code, convention de licence, mise en relation d&apos;affaires et insertion durable dans l&apos;industrie.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Colonne Droite (5 cols) : Carte d'ancrage avec visuel atelier & chiffres clés */}
            <div className="lg:col-span-5">
              <div className="relative rounded-2xl overflow-hidden border border-bordure bg-[#FAF7F2] shadow-md">
                <div className="relative h-64 sm:h-72 w-full">
                  <Image
                    src="/images/ciat-depot-innovation.jpg"
                    alt="Ateliers de prototypage et d'ingénierie au CIAT ISEP Diamniadio"
                    fill
                    sizes="(min-width: 1024px) 35vw, 100vw"
                    className="object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent flex items-end p-5">
                    <div>
                      <span className="text-[11px] font-bold uppercase tracking-wider text-[#C99A68]">
                        Plateaux Techniques ISEP
                      </span>
                      <h4 className="text-base font-bold text-white leading-snug">
                        Laboratoires de Fabrication &amp; Bancs d&apos;Essai
                      </h4>
                    </div>
                  </div>
                </div>

                {/* Grille des 4 indicateurs concrets */}
                <div className="p-5 grid grid-cols-2 gap-4 border-t border-bordure/80 bg-white">
                  <div>
                    <span className="block text-2xl font-black text-brun">07</span>
                    <span className="text-xs text-texte-doux font-medium">Filières technologiques agréées</span>
                  </div>
                  <div>
                    <span className="block text-2xl font-black text-brun">05</span>
                    <span className="text-xs text-texte-doux font-medium">Jalons contractuels de sélection</span>
                  </div>
                  <div>
                    <span className="block text-2xl font-black text-brun">100%</span>
                    <span className="text-xs text-texte-doux font-medium">Fabrication physique et testée</span>
                  </div>
                  <div>
                    <span className="block text-2xl font-black text-brun">Diamniadio</span>
                    <span className="text-xs text-texte-doux font-medium">Cité du Savoir · Hub d&apos;avenir</span>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* =====================================================================
       * 3. LES 7 FILIÈRES TECHNOLOGIQUES : TECH CLUSTERS EXPLORER
       *    Présentation dynamique et vivante : pas une grille de 7 boîtes plates !
       * =================================================================== */}
      <section className="border-b border-bordure bg-[#FAF7F2] py-16 md:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          
          {/* En-tête de section */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-10">
            <div className="max-w-2xl space-y-1.5">
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-beige">
                Pôles d&apos;Ingénierie &amp; Cahier des Charges Officiel
              </p>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-brun tracking-tight">
                Les 7 Filières d&apos;Intervention Prioritaires
              </h2>
              <p className="text-sm text-texte-doux">
                Définies selon les priorités industrielles et de développement du Sénégal, ces 7 filières structurent l&apos;affectation des ateliers, des jurys et des financements.
              </p>
            </div>
            <ButtonLink
              href="/portail/domaines"
              variant="secondary"
              className="shrink-0 text-xs shadow-xs"
            >
              Consulter le détail des 7 filières →
            </ButtonLink>
          </div>

          {/* Architecture en 2 volets : Panneau Vedette (gauche) + Catalogue structuré (droite) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            {/* Volet Vedette (5 cols) : Focus sur la réalité concrète des ateliers */}
            <div className="lg:col-span-5 rounded-2xl border border-bordure bg-white p-6 sm:p-8 shadow-sm space-y-6">
              <div className="space-y-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-beige">
                  Capacités d&apos;Ingénierie Réelle
                </span>
                <h3 className="text-xl font-bold text-brun">
                  Des Équipements de Pointe pour chaque Filière
                </h3>
                <p className="text-xs sm:text-sm text-texte-doux leading-relaxed">
                  Contrairement aux incubateurs généralistes, le CIAT s&apos;appuie sur l&apos;infrastructure technique complète de l&apos;ISEP Amadou Traoré pour matérialiser chaque prototype.
                </p>
              </div>

              {/* 3 exemples d'équipements mobilisés */}
              <div className="space-y-3 pt-2">
                <div className="p-3.5 rounded-xl border border-bordure/60 bg-[#FAF7F2]">
                  <span className="text-xs font-bold text-brun block">Laboratoire IA, Vision &amp; Systèmes Embarqués</span>
                  <p className="mt-1 text-xs text-texte-doux">
                    Calcul GPU local, capteurs LoRaWAN pour l&apos;agriculture et la télémétrie urbaine.
                  </p>
                </div>
                <div className="p-3.5 rounded-xl border border-bordure/60 bg-[#FAF7F2]">
                  <span className="text-xs font-bold text-brun block">Atelier d&apos;Usinage de Précision &amp; Fabrication</span>
                  <p className="mt-1 text-xs text-texte-doux">
                    Fraisage numérique CNC 3-5 axes, impression 3D polymère/métal et bancs d&apos;essais.
                  </p>
                </div>
                <div className="p-3.5 rounded-xl border border-bordure/60 bg-[#FAF7F2]">
                  <span className="text-xs font-bold text-brun block">Plateaux Énergies Renouvelables &amp; Santé</span>
                  <p className="mt-1 text-xs text-texte-doux">
                    Bancs de test photovoltaïques, optimiseurs solaires et simulateurs biomédicaux.
                  </p>
                </div>
              </div>

              <div className="pt-2">
                <ButtonLink
                  href="/portail/incubateur"
                  variant="primary"
                  className="w-full text-xs font-bold"
                >
                  Déposer un projet dans l&apos;une des 7 filières →
                </ButtonLink>
              </div>
            </div>

            {/* Volet Catalogue (7 cols) : Présentation fluide et élégante des 7 filières */}
            <div className="lg:col-span-7 space-y-3">
              {DOMAINES_CARDS.map((d) => (
                <Link
                  key={d.id}
                  href={`/portail/projets?domaine=${d.id}`}
                  className="group flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl border border-bordure bg-white transition-all duration-200 hover:-translate-y-0.5 hover:border-beige hover:shadow-xs"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="flex h-5 w-6 items-center justify-center rounded bg-beige/20 text-[10px] font-black text-brun">
                        0{d.id}
                      </span>
                      <h4 className="text-sm font-bold text-brun group-hover:text-brun-fonce transition-colors">
                        {d.nom}
                      </h4>
                    </div>
                    <p className="text-xs text-texte-doux leading-relaxed pl-8">
                      {d.resume}
                    </p>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0 pl-8 sm:pl-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-bordure/50">
                    <span className="text-[11px] font-semibold text-beige">
                      {d.tags}
                    </span>
                    <span className="text-xs font-bold text-brun group-hover:translate-x-1 transition-transform">
                      →
                    </span>
                  </div>
                </Link>
              ))}
            </div>

          </div>
        </div>
      </section>

      {/* =====================================================================
       * 4. LA MÉTHODOLOGIE : TIMELINE HORIZONTALE DU PARCOURS EN 5 JALONS
       *    Une véritable frise chronologique connectée, lisible et rigoureuse.
       * =================================================================== */}
      <section className="border-b border-bordure bg-white py-16 md:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-12">
            <div className="max-w-2xl space-y-1.5">
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-beige">
                Processus de Maturation &amp; Rigueur
              </p>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-brun tracking-tight">
                Le Parcours d&apos;Incubation en 5 Jalons Formels
              </h2>
              <p className="text-sm text-texte-doux">
                De l&apos;esquisse initiale jusqu&apos;au transfert industriel, chaque porteur de projet franchit des étapes contractuelles validées par un jury pluridisciplinaire.
              </p>
            </div>
            <ButtonLink href="/portail/incubateur" variant="primary" className="shrink-0 text-xs shadow-xs">
              Guide complet du parcours →
            </ButtonLink>
          </div>

          {/* Frise chronologique connectée */}
          <div className="relative">
            {/* Ligne de liaison horizontale (visible sur grand écran) */}
            <div className="hidden lg:block absolute top-7 inset-x-8 h-0.5 bg-gradient-to-r from-brun via-beige to-brun-fonce opacity-40 z-0" />

            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6 relative z-10">
              {ETAPES_PARCOURS.map((e) => (
                <div
                  key={e.numero}
                  className="flex flex-col justify-between p-5 rounded-2xl border border-bordure bg-[#FAF7F2] transition-all hover:border-beige hover:bg-white hover:shadow-sm"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brun text-white font-black text-sm shadow-xs">
                        {e.numero}
                      </span>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-texte-doux bg-white px-2 py-0.5 rounded border border-bordure">
                        {e.delai}
                      </span>
                    </div>

                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-beige block">
                        {e.jalon}
                      </span>
                      <h3 className="text-base font-bold text-brun mt-0.5">
                        {e.titre}
                      </h3>
                    </div>

                    <p className="text-xs text-texte-doux leading-relaxed">
                      {e.action}
                    </p>
                  </div>

                  <div className="mt-4 pt-3 border-t border-bordure/60 text-[11px] text-texte-doux">
                    <span className="font-semibold text-brun">Validation jury :</span> {e.livrable}
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      </section>

      {/* =====================================================================
       * 5. VITRINE DES INNOVATIONS : PROTOTYPES CONÇUS DANS NOS ATELIERS
       *    Ce que le CIAT fabrique concrètement : crédibilité immédiate.
       * =================================================================== */}
      <section className="border-b border-bordure bg-[#FAF7F2] py-16 md:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-10">
            <div className="max-w-2xl space-y-1.5">
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-beige">
                Réalisations Concrètes &amp; Showroom
              </p>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-brun tracking-tight">
                Innovations et Prototypes en Démonstration
              </h2>
              <p className="text-sm text-texte-doux">
                Découvrez les projets opérationnels fabriqués et éprouvés dans les laboratoires de l&apos;ISEP de Diamniadio.
              </p>
            </div>
            <ButtonLink
              href="/galerie"
              variant="accent"
              className="shrink-0 text-xs font-bold shadow-xs"
            >
              Explorer toute la Galerie (avec QR Code) →
            </ButtonLink>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            {PROJETS_PHARES.map((p) => (
              <div
                key={p.id}
                className="flex flex-col justify-between rounded-2xl border border-bordure bg-white p-6 shadow-xs transition-all hover:border-beige hover:shadow-md"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-beige">
                      {p.filiere}
                    </span>
                    <span className="rounded bg-[#FAF7F2] px-2 py-0.5 text-[10px] font-bold text-brun border border-bordure">
                      {p.badge}
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-brun leading-snug">
                    {p.titre}
                  </h3>

                  <p className="text-xs text-texte-doux leading-relaxed">
                    {p.resume}
                  </p>
                </div>

                <div className="mt-5 pt-4 border-t border-bordure/60 space-y-2">
                  <div className="text-[11px] text-texte-doux">
                    <span className="font-semibold text-brun">Équipements :</span> {p.equipements}
                  </div>
                  <Link
                    href="/galerie"
                    className="inline-flex items-center text-xs font-bold text-brun hover:text-beige transition-colors gap-1 pt-1"
                  >
                    <span>Consulter la fiche certifiée</span>
                    <span>→</span>
                  </Link>
                </div>
              </div>
            ))}
          </div>

        </div>
      </section>

      {/* =====================================================================
       * 6. GUICHET D'ACCOMPAGNEMENT PAR PROFIL (Orientation Claire)
       *    Accès direct ciblé selon le visiteur : Porteur, Entreprise, Étudiant.
       * =================================================================== */}
      <section className="border-b border-bordure bg-white py-16 md:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          
          <div className="max-w-2xl space-y-1.5 mb-10">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-beige">
              Orientation Stratégique
            </p>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-brun tracking-tight">
              Un Accès Dédié Selon Votre Profil
            </h2>
            <p className="text-sm text-texte-doux">
              Que vous soyez porteur d&apos;une invention technique, industriel en recherche de transfert ou apprenant en atelier, le CIAT structure votre parcours.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            {PROFILS_ACCUEIL.map((prof, idx) => (
              <div
                key={idx}
                className="flex flex-col justify-between p-6 sm:p-7 rounded-2xl border border-bordure bg-[#FAF7F2] transition-all hover:border-beige hover:shadow-xs"
              >
                <div className="space-y-2">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-beige">
                    {prof.sousTitre}
                  </span>
                  <h3 className="text-lg font-bold text-brun">
                    {prof.titre}
                  </h3>
                  <p className="text-xs sm:text-sm text-texte-doux leading-relaxed pt-1">
                    {prof.description}
                  </p>
                </div>

                <div className="mt-6 pt-4 border-t border-bordure/60 space-y-3">
                  <ButtonLink
                    href={prof.action.href}
                    variant="primary"
                    className="w-full text-xs font-bold shadow-xs"
                  >
                    {prof.action.label} →
                  </ButtonLink>
                  <Link
                    href={prof.lienSecondaire.href}
                    className="block text-center text-xs font-semibold text-brun hover:text-beige transition-colors"
                  >
                    {prof.lienSecondaire.label}
                  </Link>
                </div>
              </div>
            ))}
          </div>

        </div>
      </section>

      {/* =====================================================================
       * 7. BANDEAU OFFICIEL D'APPEL À PROJETS & CANDIDATURE
       *    Sobre, chaleureux, contrasté et conforme à la charte.
       * =================================================================== */}
      <section className="border-t border-[#3d2315] bg-[#24140D] text-white py-16 md:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col items-start justify-between gap-8 lg:flex-row lg:items-center">
            <div className="max-w-2xl space-y-2.5">
              <p className="text-xs font-bold uppercase tracking-wider text-[#C99A68]">
                Orientation &amp; Candidatures Ouvertes 2026
              </p>
              <h2 className="text-2xl sm:text-4xl font-extrabold !text-white tracking-tight leading-tight">
                Vous avez un projet d&apos;ingénierie ou un besoin de prototypage ?
              </h2>
              <p className="text-sm sm:text-base leading-relaxed text-[#EAE0D5]">
                Que vous soyez apprenant de l&apos;ISEP, diplômé en insertion ou entreprise partenaire, le CIAT met à votre disposition ses plateaux techniques, ses bancs de test et son réseau de mentors à Diamniadio.
              </p>
            </div>

            <div className="flex flex-wrap gap-4 shrink-0">
              <ButtonLink
                href="/connexion?next=/incubateur"
                variant="accent"
                className="font-bold text-sm px-7 py-3.5 shadow-md"
              >
                Déposer une Candidature
              </ButtonLink>
              <ButtonLink
                href="/portail/contact"
                variant="secondary"
                className="!text-white !border-white/30 !bg-white/10 hover:!bg-white/20 text-sm px-6 py-3.5"
              >
                Contacter le Secrétariat
              </ButtonLink>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
