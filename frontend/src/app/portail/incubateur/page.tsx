import { ButtonLink, Card, PageTitle, ProjectStatusBadge } from "@/components/ui";

export const metadata = {
  title: "L'Incubateur et son parcours",
  description:
    "Découvrez le parcours complet d'incubation du CIAT à l'ISEP de Diamniadio : de l'idée jusqu'au prototype viable et au partenariat.",
};

const ETAPES = [
  {
    stage: 1 as const,
    titre: "1. Appel & Dépôt du Dossier",
    description:
      "Le porteur de projet formalise son idée et soumet sa candidature en ligne. Le dossier nécessite impérativement trois pièces obligatoires : la fiche projet, la présentation de l'équipe et le budget prévisionnel.",
    pieces: ["Fiche de projet", "Présentation de l'équipe", "Budget prévisionnel"],
  },
  {
    stage: 2 as const,
    titre: "2. Contrôle de Complétude & Comité de Sélection",
    description:
      "L'équipe du CIAT vérifie la régularité du dossier. Les projets éligibles sont auditionnés par le comité de sélection et notés selon une grille multicritère officielle. Une décision motivée est notifiée.",
    pieces: ["Contrôle administratif", "Grille multicritère", "Avis du comité"],
  },
  {
    stage: 3 as const,
    titre: "3. Incubation Active & Mentorat",
    description:
      "Signature de la convention d'incubation ISEP. Le projet est assigné à un mentor spécialisé. Un calendrier d'objectifs précis est défini, rythmé par des revues formelles à 3 et 6 mois.",
    pieces: ["Convention officielle", "Mentor attitré", "Revues 3 et 6 mois"],
  },
  {
    stage: 4 as const,
    titre: "4. Prototypage & Validation Terrain",
    description:
      "Accès aux ateliers, plateaux techniques et laboratoires de l'ISEP Diamniadio. L'équipe réalise un prototype fonctionnel et effectue les tests opérationnels de démonstration.",
    pieces: ["Laboratoires ISEP", "Tests utilisateurs", "Preuves de concept"],
  },
  {
    stage: 5 as const,
    titre: "5. Valorisation, Galerie & Partenariats",
    description:
      "Publication officielle dans la Galerie des Innovations du CIAT. Génération automatique de la fiche promotionnelle et du QR code pour mise en relation avec partenaires et financeurs.",
    pieces: ["Showroom public", "Fiche & QR code", "Mise en relation investisseurs"],
  },
];

export default function IncubateurPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-10 md:py-16">
      <PageTitle
        tag="Parcours Porteur & Méthodologie"
        title="La Plateforme et le Parcours d'Incubation du CIAT"
        subtitle="Un accompagnement rigoureux en 5 étapes pour transformer une idée novatrice en prototype fonctionnel viable et créateur de valeur."
      />

      {/* Introduction méthodologique */}
      <section className="mb-14 rounded-2xl border border-bordure bg-ivoire p-8 md:p-10">
        <h2 className="text-2xl font-bold text-brun">Un cadre d&apos;excellence éprouvé</h2>
        <p className="mt-3 text-base leading-relaxed text-texte">
          L&apos;incubateur du CIAT accueille les apprenants, diplômés de l&apos;ISEP de Diamniadio et porteurs
          de projets sélectionnés. Il ne s&apos;agit pas d&apos;un simple espace de travail, mais d&apos;un
          dispositif complet intégrant expertise technique, suivi méthodologique rigoureux, gestion des preuves
          d&apos;avancement et alertes de jalons.
        </p>
      </section>

      {/* Les 5 Étapes du Parcours */}
      <section className="mb-16">
        <div className="mb-8">
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-beige">
            Les 5 Jalons Officiels
          </p>
          <h2 className="mt-1 text-2xl font-bold text-brun md:text-3xl">
            Du dépôt de l&apos;idée jusqu&apos;à la levée de partenariat
          </h2>
        </div>

        <div className="space-y-6">
          {ETAPES.map((etape) => (
            <Card key={etape.stage} className="transition-all hover:shadow-md">
              <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
                <div className="space-y-2">
                  <div className="flex items-center gap-3">
                    <ProjectStatusBadge stage={etape.stage} />
                    <h3 className="text-xl font-bold text-brun">{etape.titre}</h3>
                  </div>
                  <p className="max-w-3xl text-sm leading-relaxed text-texte-doux">
                    {etape.description}
                  </p>
                </div>

                <div className="rounded-lg border border-bordure bg-white p-3 text-xs md:min-w-[220px]">
                  <p className="font-bold text-brun-fonce">Éléments clés :</p>
                  <ul className="mt-1 list-inside list-disc space-y-0.5 text-texte-doux">
                    {etape.pieces.map((p, i) => (
                      <li key={i}>{p}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </section>

      {/* Conditions d'admission & Pièces obligatoires */}
      <section className="mb-16 grid gap-6 md:grid-cols-2">
        <div className="rounded-xl border border-bordure bg-white p-6 shadow-sm">
          <h3 className="text-lg font-bold text-brun">Pièces obligatoires du dossier</h3>
          <p className="mt-2 text-sm text-texte-doux">
            Conformément aux règles d&apos;instruction, tout dossier incomplet est irrecevable au comité :
          </p>
          <ul className="mt-4 space-y-2 text-sm text-texte">
            <li className="flex items-start gap-2">
              <span className="text-succes font-bold">✓</span>
              <span><strong>Fiche de projet</strong> : Problématique, solution proposée, niveau d&apos;avancement.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-succes font-bold">✓</span>
              <span><strong>Présentation de l&apos;équipe</strong> : Compétences des fondateurs et rôles.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-succes font-bold">✓</span>
              <span><strong>Budget prévisionnel</strong> : Estimation des besoins techniques et matériels.</span>
            </li>
          </ul>
        </div>

        <div className="rounded-xl border border-bordure bg-white p-6 shadow-sm">
          <h3 className="text-lg font-bold text-brun">Critères d&apos;évaluation du comité</h3>
          <p className="mt-2 text-sm text-texte-doux">
            La sélection par les jurys repose sur une grille d&apos;évaluation pondérée :
          </p>
          <ul className="mt-4 space-y-2 text-sm text-texte">
            <li className="flex items-start gap-2">
              <span className="text-beige font-bold">•</span>
              <span>Faisabilité technique et pertinence technologique.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-beige font-bold">•</span>
              <span>Impact économique et territorial pour Diamniadio et le Sénégal.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-beige font-bold">•</span>
              <span>Cohérence de l&apos;équipe et engagement dans le parcours.</span>
            </li>
          </ul>
        </div>
      </section>

      {/* Call to action */}
      <section className="rounded-2xl border border-beige/40 bg-brun p-8 text-white md:p-10">
        <div className="flex flex-col items-start justify-between gap-6 md:flex-row md:items-center">
          <div>
            <h2 className="text-2xl font-extrabold !text-white">
              Prêt à intégrer la prochaine cohorte du CIAT ?
            </h2>
            <p className="mt-2 max-w-xl text-sm text-[#ebd9c0]">
              Consultez les appels à projets en cours ou créez votre compte porteur
              pour préparer votre dossier de candidature.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <ButtonLink href="/portail" variant="accent">
              Consulter les Appels
            </ButtonLink>
            <ButtonLink href="/connexion" variant="secondary" className="!text-white !border-white hover:!bg-white/10">
              Espace Porteur de Projet
            </ButtonLink>
          </div>
        </div>
      </section>
    </div>
  );
}
