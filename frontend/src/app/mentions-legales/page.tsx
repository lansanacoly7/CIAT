import type { Metadata } from "next";
import Link from "next/link";
import PageHero from "@/components/PageHero";


export const metadata: Metadata = {
  title: "Mentions légales",
  description:
    "Mentions légales et cadre institutionnel de la plateforme du Centre d'Innovation, d'Application et de Transfert (CIAT) de l'ISEP Diamniadio.",
};

export default function MentionsLegalesPage() {
  return (
    <>
      <PageHero image="/images/contact/contact-accueil-campus.jpg" title="Mentions légales" />
    <div className="mx-auto w-full max-w-7xl px-4 py-16 sm:px-6 md:py-24 lg:px-8">
      <div className="max-w-3xl">

      <div className="space-y-12 leading-relaxed text-texte-doux">
        <section>
          <h2 className="text-xl font-semibold">Éditeur</h2>
          <p className="mt-3">
            La plateforme du Centre d&apos;Innovation, d&apos;Application et de Transfert (CIAT) est éditée
            par l&apos;Institut Supérieur d&apos;Enseignement Professionnel (ISEP) Amadou Trawaré de
            Diamniadio, établissement public sous tutelle du Ministère de l&apos;Enseignement Supérieur, de
            la Recherche et de l&apos;Innovation du Sénégal.
          </p>
          <ul className="mt-4 space-y-1">
            <li>Siège : Pôle urbain de Diamniadio, Dakar, Sénégal</li>
            <li>Téléphone : +221 33 800 00 00</li>
            <li>Courriel : contact@ciat-demo.example</li>
            <li>Directeur de la publication : le coordonnateur du CIAT / la direction de l&apos;ISEP Diamniadio</li>
          </ul>
          <p className="mt-3 text-sm italic">
            Ces coordonnées sont fictives, établies pour la démonstration académique de la plateforme.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold">Objet de la plateforme</h2>
          <p className="mt-3">
            Le CIAT encourage l&apos;esprit d&apos;entreprise, la recherche appliquée et le transfert
            technologique à l&apos;ISEP et au pôle d&apos;innovation de Diamniadio. La plateforme diffuse
            les appels à projets, assure le suivi de l&apos;incubation et présente les innovations terminées.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold">Propriété intellectuelle</h2>
          <p className="mt-3">
            Les éléments graphiques (logo, charte graphique, typographies, illustrations) et logiciels de la
            plateforme sont protégés par les lois sur la propriété intellectuelle.
          </p>
          <p className="mt-3">
            Les projets, idées, données techniques et prototypes soumis à l&apos;incubateur restent la
            propriété exclusive de leurs porteurs. Aucune publication dans la galerie n&apos;est possible
            sans l&apos;accord du porteur et la validation du coordonnateur du CIAT.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold">Hébergement</h2>
          <p className="mt-3">Hébergement de démonstration (à renseigner à la mise en ligne).</p>
        </section>

        <section>
          <h2 className="text-xl font-semibold">Loi applicable</h2>
          <p className="mt-3">
            Ce site est soumis au droit sénégalais. Pour toute question, utilisez la page{" "}
            <Link href="/portail/contact" className="font-medium text-brun underline">
              Contact
            </Link>{" "}
            ou consultez la{" "}
            <Link href="/confidentialite" className="font-medium text-brun underline">
              politique de confidentialité
            </Link>
            .
          </p>
        </section>
      </div>
    </div>
    </div>
    </>
  );
}
