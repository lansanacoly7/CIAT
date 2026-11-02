import type { Metadata } from "next";
import PageHero from "@/components/PageHero";


export const metadata: Metadata = {
  title: "Politique de confidentialité et usage de l'IA",
  description:
    "Transparence sur la protection des données personnelles, la gestion des accès par rôle et l'encadrement éthique de l'intelligence artificielle au CIAT.",
};

const ROLES = [
  [
    "Visiteur public",
    "Accès restreint au portail public et aux fiches publiées de la Galerie. Aucun accès aux dossiers privés, emails ou montants budgétaires.",
  ],
  [
    "Porteur de projet",
    "Accès exclusif à son propre compte, son dossier de candidature, ses jalons et ses brouillons de fiches d'innovation.",
  ],
  [
    "Membre du comité",
    "Accès aux dossiers qui lui sont affectés pour évaluation et notation. Pas d'accès aux projets hors affectation.",
  ],
  [
    "Mentor",
    "Accès au suivi opérationnel (jalons, objectifs, bilans) uniquement pour les projets qu'il accompagne officiellement.",
  ],
  [
    "Coordonnateur CIAT",
    "Supervision de l'ensemble du cycle, décision finale d'incubation, validation des fiches de galerie et des documents officiels.",
  ],
  [
    "Administrateur",
    "Administration technique, gestion de la sécurité, configuration des comptes et sauvegarde des systèmes.",
  ],
];

export default function ConfidentialitePage() {
  return (
    <>
      <PageHero image="/images/campus-ciat.jpg" title="Confidentialité et usage de l'IA" subtitle="Comment vos données sont gérées, qui y a accès et comment l'intelligence artificielle est utilisée sur la plateforme." />
    <div className="mx-auto w-full max-w-7xl px-4 py-16 sm:px-6 md:py-24 lg:px-8">
      <div className="max-w-3xl">

      <div className="space-y-12 leading-relaxed text-texte">
        <section>
          <h2 className="text-xl font-semibold">Quelles données collectons-nous ?</h2>
          <p className="mt-3 text-texte-doux">
            Uniquement les données nécessaires au fonctionnement de l&apos;incubateur et aux échanges
            avec les usagers :
          </p>
          <dl className="mt-4 space-y-3 text-texte-doux">
            <div>
              <dt className="font-medium text-texte">Données de compte</dt>
              <dd>
                Nom, prénom, adresse e-mail, rôle attribué et mot de passe chiffré de manière
                irréversible (PBKDF2/Argon2).
              </dd>
            </div>
            <div>
              <dt className="font-medium text-texte">Dossiers de candidature</dt>
              <dd>
                Titre et description du projet, domaine, niveau de maturité, budget prévisionnel,
                composition de l&apos;équipe et pièces déposées.
              </dd>
            </div>
            <div>
              <dt className="font-medium text-texte">Suivi d&apos;incubation</dt>
              <dd>
                Objectifs, jalons, commentaires, évaluations du comité et bilans rédigés par les mentors.
              </dd>
            </div>
            <div>
              <dt className="font-medium text-texte">Messages de contact</dt>
              <dd>Nom, e-mail, objet et message envoyés via le formulaire de contact.</dd>
            </div>
          </dl>
        </section>

        <section>
          <h2 className="text-xl font-semibold">À quoi servent ces données ?</h2>
          <p className="mt-3 text-texte-doux">
            Elles sont traitées dans le cadre des missions d&apos;intérêt public de l&apos;ISEP Diamniadio :
          </p>
          <ul className="mt-3 list-disc space-y-1.5 pl-5 text-texte-doux">
            <li>l&apos;évaluation et la sélection des projets candidats par le comité ;</li>
            <li>l&apos;accompagnement des porteurs sélectionnés par les mentors et l&apos;équipe du CIAT ;</li>
            <li>la publication dans la Galerie, uniquement après validation du coordonnateur ;</li>
            <li>des statistiques anonymisées ou consolidées pour le pilotage de l&apos;institut.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold">Qui a accès à vos données ?</h2>
          <p className="mt-3 text-texte-doux">L&apos;accès est cloisonné selon le rôle de chacun :</p>
          <dl className="mt-4 divide-y divide-bordure border-y border-bordure">
            {ROLES.map(([role, acces]) => (
              <div key={role} className="grid gap-1 py-4 sm:grid-cols-3 sm:gap-6">
                <dt className="font-medium">{role}</dt>
                <dd className="text-texte-doux sm:col-span-2">{acces}</dd>
              </div>
            ))}
          </dl>
        </section>

        <section>
          <h2 className="text-xl font-semibold">Usage de l&apos;intelligence artificielle</h2>
          <p className="mt-3 text-texte-doux">
            L&apos;IA assiste, l&apos;humain valide toujours. Aucune décision administrative, juridique ou
            d&apos;incubation n&apos;est prise de manière automatisée par un algorithme. L&apos;IA est utilisée
            dans trois cas :
          </p>
          <ul className="mt-3 list-disc space-y-2 pl-5 text-texte-doux">
            <li>
              <span className="font-medium text-texte">Le générateur de documents</span> propose des
              brouillons (conventions, fiches de synthèse, comptes rendus). Chaque version doit être relue,
              corrigée et validée par le porteur et le coordonnateur avant d&apos;être publiée ou exportée.
            </li>
            <li>
              <span className="font-medium text-texte">L&apos;assistant conversationnel</span> guide les
              usagers connectés sur la démarche du CIAT. Il s&apos;appuie uniquement sur une base de
              documents, cite ses sources et signale quand il ne peut pas répondre.
            </li>
            <li>
              <span className="font-medium text-texte">L&apos;analyse des données</span> aide la direction
              à interroger les indicateurs d&apos;incubation à partir des données réelles de la base.
            </li>
          </ul>
          <p className="mt-4 text-texte-doux">
            Les textes soumis à une fonction d&apos;IA sont envoyés à un fournisseur tiers pour être
            traités, selon ses propres conditions. Ne saisissez pas d&apos;informations confidentielles ou
            personnelles sensibles dans ces champs.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold">Vos droits</h2>
          <p className="mt-3 text-texte-doux">
            Conformément à la loi sénégalaise n° 2008-12 sur la protection des données personnelles, vous
            disposez d&apos;un droit d&apos;accès, de rectification, d&apos;opposition et de suppression des
            données vous concernant.
          </p>
          <p className="mt-3 text-texte-doux">
            Pour exercer ces droits, écrivez au secrétariat du CIAT à{" "}
            <a href="mailto:ciat@isepdiamniadio.edu.sn" className="font-medium text-brun underline">
              ciat@isepdiamniadio.edu.sn
            </a>{" "}
            ou présentez-vous au pôle d&apos;innovation de l&apos;ISEP à Diamniadio.
          </p>
        </section>
      </div>
    </div>
    </div>
    </>
  );
}
