"use client";

import { usePathname } from "next/navigation";

export default function Footer() {
  const pathname = usePathname();
  const isAuthPage = pathname === "/connexion" || pathname === "/inscription";

  if (isAuthPage) {
    return null;
  }

  return (
    <footer className="border-t border-bordure bg-ivoire">
      <div className="mx-auto max-w-6xl px-4 py-6 text-sm text-texte-doux">
        CIAT · Centre d&apos;Innovation, d&apos;Application et de Transfert · ISEP Amadou Trawaré, Diamniadio
      </div>
    </footer>
  );
}
