import Image from "next/image";
import Link from "next/link";
import { MODULES } from "@/lib/modules";

export default function Footer() {
  return (
    <footer className="border-t border-[#3d2315] bg-brun-fonce text-[#ebd9c0] pb-24 md:pb-8">
      <div className="mx-auto max-w-6xl px-4 py-12">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {/* Colonne 1 : Identité & Ancrage ISEP */}
          <div className="space-y-4">
            <Link href="/" className="inline-block">
              <Image
                src="/brand/logo_blanc.png"
                alt="CIAT - ISEP Diamniadio"
                width={140}
                height={51}
                className="h-10 w-auto object-contain"
              />
            </Link>
            <p className="text-xs leading-relaxed text-[#cbb69e]">
              Centre d&apos;Innovation, d&apos;Application et de Transfert de l&apos;Institut Supérieur
              d&apos;Enseignement Professionnel (ISEP) Amadou Trawaré de Diamniadio, Sénégal.
            </p>
            <div className="pt-2 text-xs font-semibold text-beige">
              Écosystème unifié CIAT 360 · 2026
            </div>
          </div>

          {/* Colonne 2 : Présentation Institutionnelle */}
          <div>
            <h3 className="mb-3 text-sm font-bold uppercase tracking-wider text-beige">
              Institution
            </h3>
            <ul className="space-y-2 text-xs">
              <li>
                <Link href="/portail/ciat" className="hover:text-white transition-colors">
                  Le CIAT &amp; Sa Mission
                </Link>
              </li>
              <li>
                <Link href="/portail/incubateur" className="hover:text-white transition-colors">
                  L&apos;Incubateur &amp; Le Parcours
                </Link>
              </li>
              <li>
                <Link href="/portail/domaines" className="hover:text-white transition-colors">
                  Les 7 Domaines Prioritaires
                </Link>
              </li>
              <li>
                <Link href="/portail" className="hover:text-white transition-colors">
                  Hub du Portail Public
                </Link>
              </li>
              <li>
                <Link href="/galerie" className="hover:text-white transition-colors">
                  Vitrine des Innovations
                </Link>
              </li>
            </ul>
          </div>

          {/* Colonne 3 : Modules de la Plateforme */}
          <div>
            <h3 className="mb-3 text-sm font-bold uppercase tracking-wider text-beige">
              Modules Métier
            </h3>
            <ul className="space-y-2 text-xs">
              {MODULES.map((m) => (
                <li key={m.slug}>
                  <Link href={m.href} className="hover:text-white transition-colors">
                    {m.titre}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Colonne 4 : Accompagnement & Démarche */}
          <div>
            <h3 className="mb-3 text-sm font-bold uppercase tracking-wider text-beige">
              Accompagnement
            </h3>
            <p className="text-xs leading-relaxed text-[#cbb69e]">
              Accompagner les porteurs de projets, de la phase d&apos;idée jusqu&apos;au prototype fonctionnel
              et à la valorisation sur le marché.
            </p>
            <div className="mt-4">
              <Link
                href="/connexion"
                className="inline-flex items-center justify-center rounded-lg border border-beige/40 px-3 py-1.5 text-xs font-semibold text-beige hover:border-beige hover:bg-beige/10 transition-colors"
              >
                Espace Utilisateur &amp; Candidat
              </Link>
            </div>
          </div>
        </div>

        {/* Ligne inférieure de clôture */}
        <div className="mt-10 border-t border-white/10 pt-6 text-center text-xs text-[#a89580] md:flex md:justify-between">
          <p>© 2026 CIAT · ISEP Amadou Trawaré de Diamniadio. Tous droits réservés.</p>
          <p className="mt-2 md:mt-0">
            Conforme à la Charte Graphique Officielle Écosystème CIAT 360 (v1.0).
          </p>
        </div>
      </div>
    </footer>
  );
}
