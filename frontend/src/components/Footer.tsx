"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";

const COLONNES = [
  {
    titre: "Le CIAT",
    liens: [
      { href: "/portail/ciat", label: "Présentation" },
      { href: "/portail/incubateur", label: "L'incubateur" },
      { href: "/portail/domaines", label: "Domaines" },
      { href: "/portail/actualites", label: "Actualités" },
    ],
  },
  {
    titre: "Projets",
    liens: [
      { href: "/galerie", label: "Galerie" },
      { href: "/portail/projets", label: "Projets incubés" },
      { href: "/portail/appels", label: "Appels à candidatures" },
      { href: "/portail/documents", label: "Documents" },
    ],
  },
];

export default function Footer() {
  const pathname = usePathname();

  const isAuthPage = pathname === "/connexion" || pathname === "/inscription";
  const isAppPage =
    pathname.startsWith("/incubateur") ||
    pathname.startsWith("/compte") ||
    pathname.startsWith("/documents");

  if (isAuthPage || isAppPage) {
    return null;
  }

  return (
    <footer className="bg-[#1a0e08] text-[#cbb69e]">
      <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <Link href="/" className="inline-block">
              <Image
                src="/images/brand/logo_blanc.png"
                alt="CIAT — ISEP Amadou Trawaré de Diamniadio"
                width={140}
                height={51}
                className="h-9 w-auto object-contain"
              />
            </Link>
            <p className="mt-4 max-w-xs text-sm leading-relaxed">
              Centre d&apos;Innovation, d&apos;Application et de Transfert de l&apos;ISEP
              Amadou Trawaré de Diamniadio.
            </p>
          </div>

          {COLONNES.map((col) => (
            <div key={col.titre}>
              <h2 className="mb-4 text-sm font-semibold !text-white">{col.titre}</h2>
              <ul className="space-y-2.5 text-sm">
                {col.liens.map((l) => (
                  <li key={l.href}>
                    <Link href={l.href} className="transition-colors hover:text-white">
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}

          <div>
            <h2 className="mb-4 text-sm font-semibold !text-white">Contact</h2>
            <ul className="space-y-2.5 text-sm">
              <li>Cité du Savoir, Diamniadio</li>
              <li>
                <a href="mailto:contact@ciat.sn" className="transition-colors hover:text-white">
                  contact@ciat.sn
                </a>
              </li>
              <li>+221 33 800 00 00</li>
              <li>
                <Link href="/portail/contact" className="transition-colors hover:text-white">
                  Nous écrire
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 flex flex-col gap-3 border-t border-white/10 pt-6 text-xs text-[#a89580] sm:flex-row sm:items-center sm:justify-between">
          <p>&copy; 2026 ISEP Amadou Trawaré — CIAT</p>
          <div className="flex gap-6">
            <Link href="/mentions-legales" className="transition-colors hover:text-white">
              Mentions légales
            </Link>
            <Link href="/confidentialite" className="transition-colors hover:text-white">
              Confidentialité
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
