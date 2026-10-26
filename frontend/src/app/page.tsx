import Link from "next/link";
import { Badge, ButtonLink, Card, ProjectStatusBadge } from "@/components/ui";
import { MODULES } from "@/lib/modules";

const PILIERS = [
  {
    code: "01",
    titre: "Rigueur & Excellence",
    texte: "L'ancrage professionnel de l'ISEP garantit la rigueur d'exécution des solutions concrètes.",
  },
  {
    code: "02",
    titre: "Chaleur & Racines",
    texte: "Couleurs inspirées de la terre cuite et du sol fécond de Diamniadio, centré sur l'humain.",
  },
  {
    code: "03",
    titre: "Éclosion & Mentorat",
    texte: "Accueillir l'idée et la guider avec bienveillance jusqu'au prototype viable et scalable.",
  },
  {
    code: "04",
    titre: "Futurisme & IA",
    texte: "Une innovation sobre, ergonomique et amplifiée par les technologies génératives.",
  },
];

const DOMAINES_HOMEPAGE = [
  "TIC, Numérique, IA & Données",
  "Mécanique, Fabrication & Maintenance",
  "Agriculture, Transformation & Environnement",
  "Énergie & Énergies Renouvelables",
  "Pharmaceutique & Biomédical",
  "Éducation & Formation Professionnelle",
  "Services aux Collectivités & Incubation",
];

const ETAPES_ACCUEIL = [
  { stage: 1 as const, nom: "Dépôt de l'Idée", desc: "Dossier en ligne avec pièces justificatives obligatoires." },
  { stage: 2 as const, nom: "Comité de Sélection", desc: "Évaluation multicritère et décision motivée." },
  { stage: 3 as const, nom: "Incubation & Mentorat", desc: "Attribution d'un mentor et jalons contractuels à 3 et 6 mois." },
  { stage: 4 as const, nom: "Prototypage", desc: "Réalisation en ateliers et laboratoires techniques de l'ISEP." },
  { stage: 5 as const, nom: "Partenariats & Galerie", desc: "Publication showroom public, QR codes et investisseurs." },
];

export default function Home() {
  return (
    <>
      {/* 1. HERO INSTITUTIONNEL SOBRE & IMPACTANT */}
      <section className="border-b border-[#3d2315] bg-brun-fonce text-white">
        <div className="mx-auto max-w-6xl px-4 py-16 md:py-24">
          <div className="max-w-3xl space-y-4">
            <div className="inline-flex items-center gap-2 rounded-full border border-beige/30 bg-white/5 px-3 py-1 text-xs font-bold uppercase tracking-[0.14em] text-beige">
              <span>★</span>
              <span>Plateforme Officielle · ISEP Diamniadio</span>
            </div>

            <h1 className="text-4xl font-extrabold !text-white leading-tight md:text-5xl lg:text-6xl">
              Centre d&apos;Innovation, d&apos;Application et de Transfert
            </h1>

            <p className="text-lg leading-relaxed text-[#ebd9c0] md:text-xl">
              Accompagner les apprenants et créateurs de l&apos;idée jusqu&apos;au prototype viable.
              Une plateforme unifiée réunissant incubation, analyse, assistance IA et valorisation industrielle.
            </p>

            <div className="flex flex-wrap gap-4 pt-4">
              <ButtonLink href="/portail/incubateur" variant="accent" className="text-base px-6 py-3 font-bold">
                Découvrir l&apos;Incubateur
              </ButtonLink>
              <ButtonLink href="/portail/ciat" variant="secondary" className="!text-white !border-white hover:!bg-white/10 text-base px-6 py-3">
                Le CIAT &amp; Ses Missions
              </ButtonLink>
              <ButtonLink href="/portail/domaines" variant="secondary" className="!text-white !border-beige/50 hover:!bg-white/10 text-base px-6 py-3">
                Les 7 Domaines
              </ButtonLink>
            </div>
          </div>
        </div>
      </section>

      {/* 2. LES 4 PILIERS DE LA MARQUE (Page 02 de la charte) */}
      <section className="border-b border-bordure bg-white py-12 md:py-16">
        <div className="mx-auto max-w-6xl px-4">
          <div className="mb-8">
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-beige">
              ADN &amp; Valeurs
            </p>
            <h2 className="mt-1 text-2xl font-bold text-brun md:text-3xl">
              Les 4 Piliers Fondamentaux de la Marque
            </h2>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {PILIERS.map((p) => (
              <div
                key={p.code}
                className="rounded-xl border border-bordure bg-ivoire p-6 transition-all hover:border-beige"
              >
                <div className="flex items-center gap-2">
                  <span className="flex h-7 w-7 items-center justify-center rounded-md bg-brun text-xs font-bold text-white">
                    {p.code}
                  </span>
                  <h3 className="font-bold text-brun">{p.titre}</h3>
                </div>
                <p className="mt-3 text-xs leading-relaxed text-texte-doux">{p.texte}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 3. LES 7 DOMAINES D'APPLICATION PRIORITAIRES (Cahier des charges ISEP) */}
      <section className="border-b border-bordure bg-ivoire py-12 md:py-16">
        <div className="mx-auto max-w-6xl px-4">
          <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-beige">
                Filières Technologiques
              </p>
              <h2 className="mt-1 text-2xl font-bold text-brun md:text-3xl">
                Les 7 Domaines d&apos;Intervention Prioritaires
              </h2>
              <p className="mt-2 max-w-2xl text-sm text-texte-doux">
                Les projets accueillis au CIAT répondent directement aux priorités de formation et de
                développement du tissu économique sénégalais.
              </p>
            </div>
            <ButtonLink href="/portail/domaines" variant="secondary" className="shrink-0 text-xs">
              Consulter le détail des 7 filières →
            </ButtonLink>
          </div>

          <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {DOMAINES_HOMEPAGE.map((dom, idx) => (
              <Link
                key={idx}
                href="/portail/domaines"
                className="flex items-center gap-3 rounded-lg border border-bordure bg-white p-4 transition-all hover:border-beige hover:shadow-sm"
              >
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-beige/20 text-xs font-bold text-brun">
                  0{idx + 1}
                </span>
                <span className="text-sm font-semibold text-texte">{dom}</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* 4. LE PARCOURS D'INCUBATION EN 5 JALONS OFFICIELS */}
      <section className="border-b border-bordure bg-white py-12 md:py-16">
        <div className="mx-auto max-w-6xl px-4">
          <div className="mb-8">
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-beige">
              Méthodologie Porteur
            </p>
            <h2 className="mt-1 text-2xl font-bold text-brun md:text-3xl">
              Le Parcours d&apos;Incubation du CIAT en 5 Jalons
            </h2>
            <p className="mt-2 max-w-2xl text-sm text-texte-doux">
              Chaque porteur de projet bénéficie d&apos;un encadrement structuré de l&apos;idée jusqu&apos;à la
              maturation industrielle.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-5">
            {ETAPES_ACCUEIL.map((e) => (
              <div
                key={e.stage}
                className="flex flex-col justify-between rounded-xl border border-bordure bg-ivoire p-5"
              >
                <div>
                  <ProjectStatusBadge stage={e.stage} />
                  <h3 className="mt-3 text-sm font-bold text-brun">{e.nom}</h3>
                  <p className="mt-2 text-xs leading-relaxed text-texte-doux">{e.desc}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 text-center">
            <ButtonLink href="/portail/incubateur" variant="primary" className="text-xs">
              En savoir plus sur le parcours et les comités d&apos;évaluation →
            </ButtonLink>
          </div>
        </div>
      </section>

      {/* 5. LES 6 MODULES DE LA PLATEFORME UNIFIÉE */}
      <section className="mx-auto max-w-6xl px-4 py-12 md:py-16">
        <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-beige">
              Écosystème Numérique CIAT 360
            </p>
            <h2 className="mt-1 text-2xl font-bold text-brun md:text-3xl">
              Les 6 Modules Interconnectés
            </h2>
            <p className="mt-2 max-w-2xl text-sm text-texte-doux">
              Une seule base de données partagée entre porteurs, comités, mentors et direction du centre.
            </p>
          </div>
          <Badge tone="info">Architecture Intégrée 6-en-1</Badge>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {MODULES.map((m) => (
            <Link key={m.slug} href={m.href} className="block transition-transform hover:-translate-y-1">
              <Card className="flex h-full flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-beige">
                      Module
                    </span>
                    <span className="text-xs font-semibold text-brun">Accéder →</span>
                  </div>
                  <h3 className="mt-2 text-lg font-bold text-brun">{m.titre}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-texte-doux">{m.description}</p>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      </section>
    </>
  );
}
