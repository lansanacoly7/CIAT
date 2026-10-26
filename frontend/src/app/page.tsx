import Link from "next/link";
import { Card, ButtonLink } from "@/components/ui";
import { MODULES } from "@/lib/modules";

export default function Home() {
  return (
    <>
      <section className="bg-brun-fonce text-white">
        <div className="mx-auto max-w-6xl px-4 py-16">
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-beige">
            Innovation · Incubation · Impact
          </p>
          <h1 className="mt-3 max-w-3xl text-4xl font-extrabold !text-white md:text-5xl">
            La plateforme du Centre d&apos;Innovation, d&apos;Application et de Transfert
          </h1>
          <p className="mt-4 max-w-2xl text-lg text-[#ebd9c0]">
            Accompagner les porteurs de projets de l&apos;idée jusqu&apos;au prototype, à l&apos;ISEP Amadou
            Trawaré de Diamniadio.
          </p>
          <div className="mt-8 flex gap-3">
            <ButtonLink href="/portail" variant="accent">
              Candidater
            </ButtonLink>
            <ButtonLink href="/galerie" variant="secondary">
              Voir les innovations
            </ButtonLink>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-12">
        <h2 className="mb-6 text-2xl font-bold">Les modules</h2>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {MODULES.map((m) => (
            <Link key={m.slug} href={m.href} className="block hover:shadow-md">
              <Card className="h-full">
                <h3 className="text-lg font-bold">{m.titre}</h3>
                <p className="mt-2 text-sm text-texte-doux">{m.description}</p>
              </Card>
            </Link>
          ))}
        </div>
      </section>
    </>
  );
}
