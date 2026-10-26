import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Politique de confidentialité et usage de l'IA",
  description: "Transparence sur la protection des données personnelles, la gestion des accès par rôle et l'encadrement éthique de l'intelligence artificielle au CIAT.",
};

export default function ConfidentialitePage() {
  return (
    <div className="min-h-screen bg-[#FAF7F2] text-[#26160B] py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-10">
        {/* Fil d'Ariane & En-tête */}
        <div>
          <nav className="mb-4 text-xs text-[#6B5646]" aria-label="Fil d'Ariane">
            <Link href="/" className="hover:text-[#602D10]">
              Accueil
            </Link>{" "}
            &gt; <span className="text-[#26160B] font-medium">Confidentialité &amp; Intelligence Artificielle</span>
          </nav>

          <div className="inline-flex items-center gap-2 rounded-full border border-[#D4AA70]/40 bg-[#FAF7F2] px-3.5 py-1 text-xs font-semibold uppercase tracking-wider text-[#602D10] shadow-xs mb-3">
            <span className="h-2 w-2 rounded-full bg-[#D4AA70]" />
            Transparence, Protection des données &amp; Éthique IA
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-[#26160B] tracking-tight">
            Politique de Confidentialité et Usage de l&apos;IA
          </h1>
          <p className="mt-2 text-sm sm:text-base text-[#6B5646] leading-relaxed">
            Explication claire et vérifiable de la gestion de vos données, des accès selon les rôles et du fonctionnement réel de l&apos;intelligence artificielle sur la plateforme du CIAT.
          </p>
        </div>

        {/* Corps du document */}
        <div className="space-y-10 bg-white rounded-2xl border border-[#E5D7C5] p-6 sm:p-10 shadow-xs">
          {/* Section 1 : Quelles données sont collectées ? */}
          <section className="space-y-4">
            <h2 className="text-xl font-bold text-[#602D10] flex items-center gap-2.5">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#602D10] text-xs font-bold text-white">
                1
              </span>
              Quelles données collectons-nous ?
            </h2>
            <p className="text-sm leading-relaxed text-[#3D2817]">
              La plateforme recueille uniquement les données strictement nécessaires au fonctionnement de l&apos;incubateur et aux interactions avec les usagers :
            </p>
            <div className="grid gap-3 sm:grid-cols-2 text-xs sm:text-sm text-[#4A3220]">
              <div className="rounded-xl border border-[#E5D7C5] bg-[#FAF7F2] p-4">
                <strong className="block text-[#602D10] mb-1 font-semibold">Données de compte</strong>
                Nom, prénom, adresse e-mail professionnelle ou personnelle, rôle attribué et mot de passe sécurisé (chiffré de manière irréversible via algorithmes PBKDF2/Argon2).
              </div>
              <div className="rounded-xl border border-[#E5D7C5] bg-[#FAF7F2] p-4">
                <strong className="block text-[#602D10] mb-1 font-semibold">Dossiers de candidature</strong>
                Titre et description du projet, domaine d&apos;activité, niveau de maturité, budget prévisionnel, composition de l&apos;équipe et pièces justificatives déposées.
              </div>
              <div className="rounded-xl border border-[#E5D7C5] bg-[#FAF7F2] p-4">
                <strong className="block text-[#602D10] mb-1 font-semibold">Suivi d&apos;incubation</strong>
                Objectifs fixés, jalons opérationnels, commentaires, évaluations des membres du comité et bilans d&apos;étape rédigés par les mentors.
              </div>
              <div className="rounded-xl border border-[#E5D7C5] bg-[#FAF7F2] p-4">
                <strong className="block text-[#602D10] mb-1 font-semibold">Messages de contact</strong>
                Nom, e-mail, objet et message transmis via le formulaire public du portail CIAT pour les demandes de renseignements.
              </div>
            </div>
          </section>

          {/* Section 2 : À quoi servent ces données ? */}
          <section className="space-y-4 pt-6 border-t border-[#E5D7C5]/60">
            <h2 className="text-xl font-bold text-[#602D10] flex items-center gap-2.5">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#602D10] text-xs font-bold text-white">
                2
              </span>
              À quoi servent ces données ?
            </h2>
            <p className="text-sm leading-relaxed text-[#3D2817]">
              Ces informations sont traitées dans le cadre strict des missions d&apos;intérêt public de l&apos;ISEP Diamniadio :
            </p>
            <ul className="list-disc pl-5 text-xs sm:text-sm text-[#4A3220] space-y-1.5 leading-relaxed">
              <li>L&apos;instruction, l&apos;évaluation collégiale et la sélection des projets candidats par le comité technique.</li>
              <li>L&apos;accompagnement personnalisé des porteurs de projets sélectionnés par les mentors et l&apos;équipe CIAT.</li>
              <li>La publication dans la <strong>Galerie des innovations</strong> exclusivement après validation expresse du coordonnateur.</li>
              <li>La production de statistiques décisionnelles anonymisées ou consolidées pour le pilotage de l&apos;institut.</li>
            </ul>
          </section>

          {/* Section 3 : Qui y accède selon les rôles ? */}
          <section className="space-y-4 pt-6 border-t border-[#E5D7C5]/60">
            <h2 className="text-xl font-bold text-[#602D10] flex items-center gap-2.5">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#602D10] text-xs font-bold text-white">
                3
              </span>
              Qui a accès à vos données selon les rôles ?
            </h2>
            <p className="text-sm leading-relaxed text-[#3D2817]">
              L&apos;accès à la plateforme est cloisonné selon une <strong>matrice stricte de droits et de rôles</strong> :
            </p>
            <div className="overflow-x-auto rounded-xl border border-[#E5D7C5]">
              <table className="w-full text-left text-xs sm:text-sm text-[#3D2817]">
                <thead className="bg-[#FAF7F2] text-[#602D10] border-b border-[#E5D7C5] font-semibold">
                  <tr>
                    <th className="p-3">Rôle</th>
                    <th className="p-3">Périmètre d&apos;accès accordé</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E5D7C5]">
                  <tr>
                    <td className="p-3 font-semibold text-[#602D10]">Visiteur public</td>
                    <td className="p-3">Accès restreint au portail public et aux fiches publiées de la Galerie. Aucun accès aux dossiers privés, emails ou montants budgétaires.</td>
                  </tr>
                  <tr>
                    <td className="p-3 font-semibold text-[#602D10]">Porteur de projet</td>
                    <td className="p-3">Accès exclusif à son propre compte, son dossier de candidature, ses jalons et ses brouillons de fiches d&apos;innovation.</td>
                  </tr>
                  <tr>
                    <td className="p-3 font-semibold text-[#602D10]">Membre du comité</td>
                    <td className="p-3">Accès aux dossiers qui lui sont affectés pour évaluation et notation. Pas d&apos;accès aux projets hors affectation.</td>
                  </tr>
                  <tr>
                    <td className="p-3 font-semibold text-[#602D10]">Mentor</td>
                    <td className="p-3">Accès au suivi opérationnel (jalons, objectifs, bilans) uniquement pour les projets qu&apos;il accompagne officiellement.</td>
                  </tr>
                  <tr>
                    <td className="p-3 font-semibold text-[#602D10]">Coordonnateur CIAT</td>
                    <td className="p-3">Supervision de l&apos;ensemble du cycle, décision finale d&apos;incubation, validation des fiches de galerie et des documents officiels.</td>
                  </tr>
                  <tr>
                    <td className="p-3 font-semibold text-[#602D10]">Administrateur</td>
                    <td className="p-3">Administration technique, gestion de la sécurité, configuration des comptes et sauvegarde des systèmes.</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          {/* Section 4 : L'usage de l'Intelligence Artificielle (Obligation majeure) */}
          <section className="space-y-4 pt-6 border-t border-[#E5D7C5]/60">
            <div className="flex items-center gap-2.5">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#D4AA70] text-xs font-bold text-[#26160B]">
                4
              </span>
              <h2 className="text-xl font-bold text-[#602D10]">
                Usage de l&apos;Intelligence Artificielle &amp; Relecture Humaine
              </h2>
            </div>

            <div className="rounded-xl border-l-4 border-[#D4AA70] bg-[#FAF7F2] p-5 space-y-3">
              <h3 className="text-sm font-bold text-[#602D10] uppercase tracking-wide">
                Principe fondamental : L&apos;IA assiste, l&apos;humain valide toujours
              </h3>
              <p className="text-xs sm:text-sm text-[#3D2817] leading-relaxed">
                La plateforme du CIAT intègre des technologies d&apos;intelligence artificielle générative pour accélérer
                et enrichir les tâches documentaires. <strong>Aucune décision administrative, juridique ou d&apos;incubation
                n&apos;est prise de manière automatisée par un algorithme.</strong>
              </p>
            </div>

            <div className="space-y-3 pt-2">
              <h3 className="text-sm font-semibold text-[#26160B]">
                Les trois cas d&apos;usage réels de l&apos;IA sur la plateforme :
              </h3>
              <ul className="space-y-2 text-xs sm:text-sm text-[#4A3220]">
                <li className="flex items-start gap-2">
                  <span className="font-bold text-[#602D10] mt-0.5">&bull;</span>
                  <div>
                    <strong>Le générateur de documents administratifs :</strong> produit des pré-rédactions assistées
                    (conventions d&apos;incubation, fiches de synthèse de projet, comptes rendus). <em>Chaque version générée
                    doit obligatoirement être relue, corrigée et formellement validée par le porteur et le coordonnateur avant d&apos;être publiée ou exportée.</em>
                  </div>
                </li>
                <li className="flex items-start gap-2">
                  <span className="font-bold text-[#602D10] mt-0.5">&bull;</span>
                  <div>
                    <strong>L&apos;Assistant IA conversationnel (RAG) :</strong> guide les usagers connectés sur la démarche
                    du CIAT et le parcours d&apos;incubation. Il s&apos;appuie strictement sur une base documentaire indexée
                    et <em>cite obligatoirement ses sources (titres de documents et extraits)</em>. En l&apos;absence de document pertinent, il signale explicitement son impossibilité de répondre.
                  </div>
                </li>
                <li className="flex items-start gap-2">
                  <span className="font-bold text-[#602D10] mt-0.5">&bull;</span>
                  <div>
                    <strong>L&apos;analyse décisionnelle en langage naturel :</strong> aide l&apos;équipe de direction à interroger
                    les métriques d&apos;incubation (nombre de projets, taux de sélection, cohortes) en formulant une synthèse chiffrée basée sur les données réelles de la base.
                  </div>
                </li>
              </ul>
            </div>

            <div className="rounded-xl border border-amber-200 bg-amber-50/60 p-4 text-xs sm:text-sm text-amber-950">
              <strong>Protection de vos contenus :</strong> Les données confidentielles de vos candidatures ne sont pas
              utilisées pour entraîner des modèles publics d&apos;IA tiers. Les requêtes de traitement sont exécutées via des
              interfaces de programmation sécurisées respectant la confidentialité des échanges.
            </div>
          </section>

          {/* Section 5 : Vos droits & Contact */}
          <section className="space-y-4 pt-6 border-t border-[#E5D7C5]/60">
            <h2 className="text-xl font-bold text-[#602D10] flex items-center gap-2.5">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#602D10] text-xs font-bold text-white">
                5
              </span>
              Vos droits et réclamations
            </h2>
            <p className="text-sm leading-relaxed text-[#3D2817]">
              Conformément à la réglementation sénégalaise relative à la protection des données à caractère personnel (Loi n° 2008-12),
              tout utilisateur dispose d&apos;un droit d&apos;accès, de rectification, d&apos;opposition et de suppression des données
              le concernant.
            </p>
            <p className="text-sm leading-relaxed text-[#3D2817]">
              Pour exercer ces droits, vous pouvez contacter le secrétariat du CIAT à l&apos;adresse suivante :{" "}
              <a href="mailto:ciat@isepdiamniadio.edu.sn" className="text-[#602D10] font-semibold underline">
                ciat@isepdiamniadio.edu.sn
              </a>{" "}
              ou vous rendre directement au pôle d&apos;innovation de l&apos;ISEP à Diamniadio.
            </p>
          </section>
        </div>

        {/* Navigation retour */}
        <div className="flex justify-between items-center text-xs sm:text-sm">
          <Link
            href="/"
            className="inline-flex items-center gap-2 font-semibold text-[#602D10] hover:text-[#48210B] transition-colors"
          >
            &larr; Retour à l&apos;accueil
          </Link>
          <Link
            href="/mentions-legales"
            className="font-semibold text-[#602D10] hover:underline"
          >
            Consulter les Mentions légales &rarr;
          </Link>
        </div>
      </div>
    </div>
  );
}
