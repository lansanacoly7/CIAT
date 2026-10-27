"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { MODULES } from "@/lib/modules";

export default function Footer() {
  const pathname = usePathname();
  const isAuthPage = pathname === "/connexion" || pathname === "/inscription";
  const isAppPage = pathname.startsWith("/incubateur") || pathname.startsWith("/compte") || pathname.startsWith("/documents");

  if (isAuthPage || isAppPage || pathname === "/") {
    return null;
  }

  return (
    <footer className="border-t border-[#3d2315] bg-brun-fonce text-[#ebd9c0] pb-24 md:pb-8">
      <div className="mx-auto max-w-6xl px-4 py-12">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {/* Colonne 1 : Identité & Ancrage ISEP */}
          <div className="space-y-4">
            <Link href="/" className="inline-block">
              <Image
                src="/images/brand/logo_blanc.png"
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
                <Link href="/portail/projets" className="hover:text-white transition-colors">
                  Annuaire des Projets Incubés
                </Link>
              </li>
              <li>
                <Link href="/portail/partenaires" className="hover:text-white transition-colors">
                  Nos Partenaires
                </Link>
              </li>
              <li>
                <Link href="/portail/documents" className="hover:text-white transition-colors">
                  Espace Documentaire
                </Link>
              </li>
              <li>
                <Link href="/portail/contact" className="hover:text-white transition-colors">
                  Contact &amp; Secrétariat
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
        <div className="mt-10 border-t border-white/10 pt-6 text-center text-xs text-[#a89580] md:flex md:items-center md:justify-between">
          <p>© 2026 CIAT · ISEP Amadou Trawaré de Diamniadio. Tous droits réservés.</p>
          <div className="mt-3 flex flex-wrap items-center justify-center gap-4 md:mt-0">
            <Link href="/mentions-legales" className="transition-colors hover:text-white underline underline-offset-2">
              Mentions légales
            </Link>
            <span aria-hidden="true" className="text-white/20">&bull;</span>
            <Link href="/confidentialite" className="transition-colors hover:text-white underline underline-offset-2">
              Confidentialité &amp; Usage IA
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
