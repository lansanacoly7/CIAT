import { ButtonLink, Card, PageTitle } from "@/components/ui";

export const metadata = {
  title: "Les 7 Domaines d'Intervention",
  description:
    "Découvrez les 7 filières technologiques et sectorielles prioritaires de l'ISEP Amadou Trawaré et du CIAT à Diamniadio.",
};

const DOMAINES = [
  {
    id: 1,
    nom: "TIC, Numérique, Intelligence Artificielle et Données",
    enjeux:
      "Digitalisation des services, valorisation des données massives, vision par ordinateur, modèles de langage pour langues locales, et développement d'applications logicielles robustes et sécurisées.",
    exemples: "Systèmes de détection intelligente, diagnostics automatisés, plateformes SaaS locales, jumeaux numériques.",
  },
  {
    id: 2,
    nom: "Mécanique, Fabrication et Maintenance",
    enjeux:
      "Conception assistée par ordinateur (CAO), usinage numérique, maintenance prédictive des équipements industriels, fabrication additive et outillages adaptés aux PME locales.",
    exemples: "Bancs d'essai industriels, pièces de rechange imprimées 3D, machines de transformation mécanique locale.",
  },
  {
    id: 3,
    nom: "Agriculture, Transformation et Environnement",
    enjeux:
      "Modernisation de la chaîne de valeur agroalimentaire sénégalaise, réduction des pertes post-récolte, valorisation des sous-produits organiques et gestion durable des sols.",
    exemples: "Séchoirs solaires connectés, capteurs d'irrigation IoT, unités compactes de transformation de céréales.",
  },
  {
    id: 4,
    nom: "Énergie, Efficacité Énergétique et Énergies Renouvelables",
    enjeux:
      "Exploitation du potentiel solaire et éolien du Sénégal, gestion intelligente des micro-réseaux, stockage d'énergie et optimisation de la consommation dans les bâtiments et ateliers.",
    exemples: "Systèmes solaires autonomes hybrides, contrôleurs de charge intelligents, audits énergétiques automatisés.",
  },
  {
    id: 5,
    nom: "Pharmaceutique et Biomédical",
    enjeux:
      "Soutien à la souveraineté sanitaire et à la production locale, maintenance spécialisée des dispositifs médicaux hospitaliers, et technologies d'assistance aux soins.",
    exemples: "Dispositifs biomédicaux d'urgence, traçabilité des stocks de santé, équipements de stérilisation adaptés.",
  },
  {
    id: 6,
    nom: "Éducation, Formation Professionnelle et Insertion",
    enjeux:
      "Pédagogie active, apprentissage par la pratique (EdTech), simulateurs techniques d'apprentissage, et plateformes favorisant l'insertion professionnelle des diplômés de l'ISEP.",
    exemples: "Simulateurs de réalité virtuelle pour métiers techniques, plateformes d'évaluation par compétences.",
  },
  {
    id: 7,
    nom: "Services aux Collectivités, Entrepreneuriat et Incubation",
    enjeux:
      "Solutions d'optimisation pour les collectivités territoriales, gestion intelligente des déchets, logistique urbaine à Diamniadio, et outils de gestion d'entreprises émergentes.",
    exemples: "Systèmes de gestion municipale, traçabilité logistique, outils de suivi d'incubation et gouvernance locale.",
  },
];

export default function DomainesPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-10 md:py-16">
      <PageTitle
        tag="Filières Prioritaires & Cahier des Charges"
        title="Les 7 Domaines d'Application du CIAT"
        subtitle="Ces filières constituent le cœur d'intervention technologique de l'ISEP Amadou Trawaré et déterminent l'éligibilité des projets accompagnés."
      />

      {/* Cadre institutionnel */}
      <section className="mb-14 rounded-2xl border border-bordure bg-ivoire p-8 md:p-10">
        <h2 className="text-2xl font-bold text-brun">Des filières ancrées dans le développement national</h2>
        <p className="mt-3 text-base leading-relaxed text-texte">
          Fixés par le cahier des charges officiel de l&apos;ISEP de Diamniadio, ces 7 domaines correspondent
          aux besoins prioritaires de l&apos;économie sénégalaise. Tout projet candidat à l&apos;incubation ou au transfert
          technologique doit s&apos;inscrire dans au moins l&apos;un de ces axes sectoriels.
        </p>
      </section>

      {/* Liste des 7 Domaines */}
      <section className="mb-16 space-y-6">
        {DOMAINES.map((d) => (
          <Card key={d.id} className="transition-all hover:border-beige hover:shadow-md">
            <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-brun text-xs font-bold text-white">
                    0{d.id}
                  </span>
                  <h3 className="text-lg font-bold text-brun md:text-xl">{d.nom}</h3>
                </div>

                <div className="space-y-2 text-sm leading-relaxed text-texte">
                  <p>
                    <strong className="text-brun-fonce">Enjeux stratégiques :</strong> {d.enjeux}
                  </p>
                  <p className="text-texte-doux">
                    <strong className="text-brun-fonce">Exemples de prototypes attendus :</strong> {d.exemples}
                  </p>
                </div>
              </div>

              <div className="shrink-0 pt-2 md:pt-0">
                <ButtonLink href="/portail/incubateur" variant="secondary" className="w-full text-xs md:w-auto">
                  Critères d&apos;éligibilité
                </ButtonLink>
              </div>
            </div>
          </Card>
        ))}
      </section>

      {/* Call to action */}
      <section className="rounded-2xl border border-beige/40 bg-brun p-8 text-white md:p-10">
        <div className="flex flex-col items-start justify-between gap-6 md:flex-row md:items-center">
          <div>
            <h2 className="text-2xl font-extrabold !text-white">
              Votre projet s&apos;inscrit dans l&apos;un de ces 7 domaines ?
            </h2>
            <p className="mt-2 max-w-xl text-sm text-[#ebd9c0]">
              Déposez votre dossier pour bénéficier des ateliers de prototypage et de
              l&apos;encadrement d&apos;experts métiers à Diamniadio.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <ButtonLink href="/portail/incubateur" variant="accent">
              Comment Postuler
            </ButtonLink>
            <ButtonLink href="/" variant="secondary" className="!text-white !border-white hover:!bg-white/10">
              Retour à l&apos;Accueil
            </ButtonLink>
          </div>
        </div>
      </section>
    </div>
  );
}
