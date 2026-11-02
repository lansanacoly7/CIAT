"use client";

import { useEffect, useState } from "react";
import { ButtonLink } from "@/components/ui";
import { api, type Page } from "@/lib/api";

interface AppelOfficiel {
  id: number;
  titre: string;
  description: string;
  date_limite: string;
  statut: "ouvert" | "clos";
  pieces_demandees: string[];
}

const FALLBACK_APPELS: AppelOfficiel[] = [
  {
    id: 1,
    titre: "Cohorte d'incubation 2026",
    description:
      "Ouvert aux apprenants et diplômés de l'ISEP, aux chercheurs et aux jeunes entreprises, dans les sept domaines du CIAT.",
    date_limite: "2026-11-16T23:59:00Z",
    statut: "ouvert",
    pieces_demandees: [
      "Une présentation du projet",
      "Le CV des membres de l'équipe",
      "Un budget prévisionnel",
    ],
  },
  {
    id: 2,
    titre: "Session spéciale énergies renouvelables 2025",
    description: "Pour les prototypes solaires, de froid autonome et d'irrigation.",
    date_limite: "2025-12-15T23:59:00Z",
    statut: "clos",
    pieces_demandees: [],
  },
];

const ETAPES = [
  { titre: "Dépôt en ligne", texte: "Vous créez votre compte et déposez votre dossier." },
  { titre: "Étude du dossier", texte: "L'équipe du CIAT vérifie le dossier sous dix jours ouvrés." },
  { titre: "Audition", texte: "Vous présentez votre projet en quinze minutes devant un jury." },
  { titre: "Entrée en incubation", texte: "Vous signez la convention et accédez aux ateliers." },
];

const FAQ = [
  {
    q: "Qui peut candidater ?",
    a: "Les apprenants et diplômés des ISEP, les enseignants-chercheurs, les ingénieurs indépendants, les jeunes entreprises et tout porteur d'une innovation utile au Sénégal.",
  },
  {
    q: "Faut-il déjà avoir un prototype ?",
    a: "Non. Vous pouvez candidater avec une idée. Si vous avez déjà une maquette, le parcours s'adapte.",
  },
  {
    q: "Mon idée est-elle protégée ?",
    a: "Oui. Les membres du jury sont tenus à la confidentialité et la charte du CIAT reconnaît les droits des inventeurs.",
  },
  {
    q: "Dois-je venir sur le campus ?",
    a: "Oui pour les travaux en atelier et les revues d'étape, selon un planning compatible avec des études ou un emploi.",
  },
];

function formatDateFr(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "long", year: "numeric" }).format(d);
}

export default function AppelsBody() {
  const [appels, setAppels] = useState<AppelOfficiel[]>(FALLBACK_APPELS);

  useEffect(() => {
    let cancelled = false;
    api<Page<AppelOfficiel> | AppelOfficiel[]>("/portal/appels/", { auth: false })
      .then((res) => {
        if (cancelled) return;
        const list = Array.isArray(res) ? res : res?.results ?? [];
        if (list.length > 0) setAppels(list);
      })
      .catch(() => {
        /* On garde les appels de repli */
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const appelOuvert = appels.find((a) => a.statut === "ouvert") ?? FALLBACK_APPELS[0];
  const appelsClos = appels.filter((a) => a.id !== appelOuvert.id);

  return (
    <>
      <section className="rounded-2xl border border-bordure p-8 sm:p-10">
        <p className="text-sm font-medium text-succes">
          Ouvert jusqu&apos;au {formatDateFr(appelOuvert.date_limite)}
        </p>
        <h2 className="mt-2 text-2xl font-bold">{appelOuvert.titre}</h2>
        <p className="mt-4 max-w-2xl leading-relaxed text-texte-doux">{appelOuvert.description}</p>

        {appelOuvert.pieces_demandees?.length > 0 && (
          <>
            <h3 className="mt-8 text-base font-semibold">À fournir</h3>
            <ul className="mt-3 list-disc space-y-1.5 pl-5 text-texte-doux">
              {appelOuvert.pieces_demandees.map((p) => (
                <li key={p}>{p}</li>
              ))}
            </ul>
          </>
        )}

        <div className="mt-10 flex flex-wrap gap-3">
          <ButtonLink href="/connexion?next=/incubateur">Déposer ma candidature</ButtonLink>
          <ButtonLink href="/portail/documents" variant="secondary">
            Télécharger les modèles
          </ButtonLink>
        </div>
      </section>

      <section className="mt-24">
        <h2 className="text-2xl font-bold">Ce que l&apos;incubation vous apporte</h2>
        <ul className="mt-6 grid gap-x-10 gap-y-4 text-texte-doux sm:grid-cols-2">
          <li>
            <span className="font-medium text-texte">Les ateliers</span> : machines, électronique,
            impression 3D et bancs solaires.
          </li>
          <li>
            <span className="font-medium text-texte">Un mentor</span> : un suivi régulier par un
            enseignant ou un expert.
          </li>
          <li>
            <span className="font-medium text-texte">Le matériel</span> : une aide pour les composants
            nécessaires au prototype.
          </li>
          <li>
            <span className="font-medium text-texte">La protection</span> : un appui pour protéger votre
            invention.
          </li>
        </ul>
      </section>

      <section id="parcours" className="mt-24 scroll-mt-24">
        <h2 className="text-2xl font-bold">Comment ça se passe</h2>
        <ol className="mt-8 space-y-6">
          {ETAPES.map((e, i) => (
            <li key={e.titre} className="flex gap-5">
              <span className="w-6 shrink-0 font-[family-name:var(--font-title)] text-xl font-bold text-beige">
                {i + 1}
              </span>
              <div>
                <h3 className="font-semibold">{e.titre}</h3>
                <p className="mt-1 text-texte-doux">{e.texte}</p>
              </div>
            </li>
          ))}
        </ol>
        <p className="mt-10 max-w-2xl leading-relaxed text-texte-doux">
          Le jury note chaque dossier sur quatre critères de même poids : l&apos;utilité du
          projet, sa faisabilité technique, l&apos;équipe et son potentiel de développement.
        </p>
      </section>

      <section className="mt-24">
        <h2 className="text-2xl font-bold">Questions fréquentes</h2>
        <div className="mt-6 border-t border-bordure">
          {FAQ.map((item) => (
            <details key={item.q} className="group border-b border-bordure">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 py-5 font-medium text-brun">
                {item.q}
                <span aria-hidden="true" className="text-xl text-beige transition-transform group-open:rotate-45">
                  +
                </span>
              </summary>
              <p className="pb-5 leading-relaxed text-texte-doux">{item.a}</p>
            </details>
          ))}
        </div>
      </section>

      {appelsClos.length > 0 && (
        <section className="mt-24">
          <h2 className="text-2xl font-bold">Appels précédents</h2>
          <ul className="mt-6 space-y-4">
            {appelsClos.map((a) => (
              <li key={a.id} className="text-texte-doux">
                <span className="font-medium text-texte">{a.titre}</span> — clos le{" "}
                {formatDateFr(a.date_limite)}
              </li>
            ))}
          </ul>
        </section>
      )}
    </>
  );
}
