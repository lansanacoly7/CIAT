import type { Metadata } from "next";

import AppelsBody from "./AppelsBody";
import PageHero from "@/components/PageHero";

export const metadata: Metadata = {
  title: "Appel à candidatures",
  description: "Rejoignez l'incubateur du CIAT et donnez vie à votre projet innovant.",
};

export default function AppelACandidaturePage() {
  return (
    <>
      <PageHero image="/images/ciat-hero-appel-engineer.webp" title="Appel à candidatures" subtitle="Rejoignez l'incubateur et développez votre projet, de l'idée au prototype." />
    <main className="mx-auto w-full max-w-7xl px-4 py-16 sm:px-6 md:py-24 lg:px-8">
      <div className="max-w-4xl">
      <AppelsBody />
    </div>
    </main>
    </>
  );
}
