import Image from "next/image";
import Link from "next/link";
import { MODULES } from "@/lib/modules";

export default function Header() {
  return (
    <header className="bg-brun-fonce text-white">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-8 gap-y-3 px-4 py-3">
        <Link href="/" aria-label="CIAT, accueil">
          <Image src="/brand/logo_blanc.png" alt="CIAT" width={140} height={51} priority />
        </Link>
        <nav aria-label="Navigation principale" className="flex flex-wrap gap-x-5 gap-y-1 text-sm">
          {MODULES.map((m) => (
            <Link key={m.slug} href={m.href} className="text-[#ebd9c0] hover:text-white">
              {m.titre}
            </Link>
          ))}
        </nav>
        <Link
          href="/connexion"
          className="ml-auto rounded-lg bg-beige px-4 py-2 text-sm font-semibold text-texte hover:bg-white"
        >
          Connexion
        </Link>
      </div>
    </header>
  );
}
