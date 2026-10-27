import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Mentions légales",
  description: "Mentions légales et cadre institutionnel de la plateforme du Centre d'Innovation, d'Application et de Transfert (CIAT) de l'ISEP Diamniadio.",
};

export default function MentionsLegalesPage() {
  return (
    <div className="min-h-screen bg-[#FAF7F2] text-[#26160B] py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-10">
        {/* Fil d'Ariane & En-tête */}
        <div>
          <nav className="mb-4 text-xs text-[#6B5646]" aria-label="Fil d'Ariane">
            <Link href="/" className="hover:text-[#602D10]">
              Accueil
            </Link>{" "}
            &gt; <span className="text-[#26160B] font-medium">Mentions légales</span>
          </nav>

          <div className="inline-flex items-center gap-2 rounded-full border border-[#D4AA70]/40 bg-[#FAF7F2] px-3.5 py-1 text-xs font-semibold uppercase tracking-wider text-[#602D10] shadow-xs mb-3">
            <span className="h-2 w-2 rounded-full bg-[#D4AA70]" />
            Cadre réglementaire &amp; Institutionnel
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-[#26160B] tracking-tight">
            Mentions Légales
          </h1>
          <p className="mt-2 text-sm sm:text-base text-[#6B5646] leading-relaxed">
            Informations juridiques relatives à l&apos;exploitation du portail et de la plateforme numérique du CIAT.
          </p>
        </div>

        {/* Contenu structuré */}
        <div className="space-y-8 bg-white rounded-2xl border border-[#E5D7C5] p-6 sm:p-10 shadow-xs">
          {/* Article 1 : Éditeur */}
          <section className="space-y-3">
            <h2 className="text-xl font-bold text-[#602D10] flex items-center gap-2">
              <span className="text-xs font-bold rounded-md bg-[#602D10]/10 text-[#602D10] px-2 py-0.5">01</span>
              Éditeur de la plateforme
            </h2>
            <p className="text-sm leading-relaxed text-[#3D2817]">
              La plateforme numérique du <strong>Centre d&apos;Innovation, d&apos;Application et de Transfert (CIAT)</strong> est
              éditée par l&apos;<strong>Institut Supérieur d&apos;Enseignement Professionnel (ISEP) Amadou Trawaré de Diamniadio</strong>,
              établissement public d&apos;enseignement supérieur professionnel sous tutelle du Ministère de l&apos;Enseignement
              Supérieur, de la Recherche et de l&apos;Innovation de la République du Sénégal.
            </p>
            <p className="text-xs text-[#602D10] font-semibold italic bg-[#FAF7F2] p-2.5 rounded-lg border border-[#E5D7C5]">
              Note de démonstration : Les coordonnées ci-dessous sont des coordonnées fictives établies pour les besoins de la démonstration académique de la plateforme.
            </p>
            <ul className="text-xs sm:text-sm text-[#4A3220] space-y-1.5 pl-4 border-l-2 border-[#D4AA70]/50 mt-2">
              <li><strong>Siège :</strong> Pôle Urbain de Diamniadio, Dakar, Sénégal</li>
              <li><strong>Téléphone (coordonnées fictives) :</strong> +221 33 800 00 00</li>
              <li><strong>Directeur de la publication :</strong> Le Coordonnateur du CIAT / Direction de l&apos;ISEP Diamniadio</li>
              <li><strong>Courriel institutionnel (coordonnées fictives) :</strong> contact@ciat-demo.example</li>
            </ul>
          </section>

          {/* Article 2 : Mission & Objet de la plateforme */}
          <section className="space-y-3 pt-6 border-t border-[#E5D7C5]/60">
            <h2 className="text-xl font-bold text-[#602D10] flex items-center gap-2">
              <span className="text-xs font-bold rounded-md bg-[#602D10]/10 text-[#602D10] px-2 py-0.5">02</span>
              Mission &amp; Vocation
            </h2>
            <p className="text-sm leading-relaxed text-[#3D2817]">
              Le CIAT a pour mission de catalyser l&apos;esprit d&apos;entreprise, la recherche appliquée et le transfert
              technologique au sein de l&apos;écosystème de l&apos;ISEP et du pôle d&apos;innovation de Diamniadio.
              La plateforme assure la diffusion des appels à projets, le suivi de l&apos;incubation, l&apos;assistance
              documentaire et la valorisation publique des prototypes et innovations terminés.
            </p>
          </section>

          {/* Article 3 : Propriété intellectuelle */}
          <section className="space-y-3 pt-6 border-t border-[#E5D7C5]/60">
            <h2 className="text-xl font-bold text-[#602D10] flex items-center gap-2">
              <span className="text-xs font-bold rounded-md bg-[#602D10]/10 text-[#602D10] px-2 py-0.5">03</span>
              Propriété intellectuelle &amp; Droits des porteurs
            </h2>
            <p className="text-sm leading-relaxed text-[#3D2817]">
              L&apos;ensemble des éléments graphiques (logo officiel CIAT, charte graphique Écosystème CIAT 360 v1.0,
              typographies, bannières, illustrations) et logiciels constituant cette plateforme sont protégés par les lois
              en vigueur sur la propriété intellectuelle.
            </p>
            <div className="rounded-xl bg-[#FAF7F2] p-4 text-xs sm:text-sm text-[#4A3220] border border-[#E5D7C5]">
              <strong>Protection des innovations déposées :</strong> Les projets, idées, données techniques et prototypes
              soumis dans le cadre de l&apos;incubateur demeurent la <strong>propriété exclusive de leurs porteurs de projets</strong>.
              Aucune publication dans la galerie publique ne peut être réalisée sans l&apos;accord exprès du porteur et la validation
              formelle du coordonnateur du CIAT.
            </div>
          </section>

          {/* Article 4 : Hébergement & Données */}
          <section className="space-y-3 pt-6 border-t border-[#E5D7C5]/60">
            <h2 className="text-xl font-bold text-[#602D10] flex items-center gap-2">
              <span className="text-xs font-bold rounded-md bg-[#602D10]/10 text-[#602D10] px-2 py-0.5">04</span>
              Hébergement technique &amp; Disponibilité
            </h2>
            <p className="text-sm leading-relaxed text-[#3D2817]">
              Hébergement de démonstration (à renseigner à la mise en ligne).
            </p>
          </section>

          {/* Article 5 : Liens et navigation */}
          <section className="space-y-3 pt-6 border-t border-[#E5D7C5]/60">
            <h2 className="text-xl font-bold text-[#602D10] flex items-center gap-2">
              <span className="text-xs font-bold rounded-md bg-[#602D10]/10 text-[#602D10] px-2 py-0.5">05</span>
              Loi applicable &amp; Contact
            </h2>
            <p className="text-sm leading-relaxed text-[#3D2817]">
              Le présent site est soumis au droit sénégalais. Pour toute question juridique ou administrative concernant le CIAT,
              vous pouvez vous adresser au secrétariat permanent via la page{" "}
              <Link href="/portail/contact" className="text-[#602D10] underline font-semibold hover:text-[#48210B]">
                Contact &amp; Secrétariat
              </Link>{" "}
              ou consulter notre{" "}
              <Link href="/confidentialite" className="text-[#602D10] underline font-semibold hover:text-[#48210B]">
                Politique de confidentialité et d&apos;usage de l&apos;IA
              </Link>.
            </p>
          </section>
        </div>

        {/* Navigation retour */}
        <div className="flex justify-start">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-xs sm:text-sm font-semibold text-[#602D10] hover:text-[#48210B] transition-colors"
          >
            &larr; Retour à l&apos;accueil du portail
          </Link>
        </div>
      </div>
    </div>
  );
}
