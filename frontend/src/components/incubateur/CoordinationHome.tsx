"use client";

import { useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import { ApiErrorBanner, Badge, PageTitle } from "@/components/ui";
import { api } from "@/lib/api";
import { fetchAll } from "@/lib/paginate";
import {
  STATUT_LABELS,
  getAlertes,
  suiviErrorMessage,
  type AffectationMentor,
  type AlerteJalon,
  type Dossier,
} from "@/lib/incubator";

interface ProjetCoord {
  id: number;
  titre: string;
  statut: string;
  domaine_nom?: string;
  porteur_nom?: string;
}

/** Statuts de projet considérés comme « incubés » pour l'affectation d'un mentor. */
const STATUTS_INCUBES = ["incube", "prototype"];

type State<T> = { data: T | null; error: string | null };

/** Charge une ressource ; une erreur n'affecte que le bloc concerné. */
function useLoad<T>(fn: () => Promise<T>, fallback: string): State<T> & { retry: () => void } {
  const [state, setState] = useState<State<T>>({ data: null, error: null });
  const [tick, setTick] = useState(0);

  useEffect(() => {
    let cancelled = false;
    fn()
      .then((data) => !cancelled && setState({ data, error: null }))
      .catch((err) => !cancelled && setState({ data: null, error: suiviErrorMessage(err, fallback) }));
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- `fn` est une fonction de module stable
  }, [tick]);

  return { ...state, retry: () => setTick((t) => t + 1) };
}

const loadDossiers = () => fetchAll<Dossier>("/incubator/dossiers/");

async function loadProjetsSansMentor(): Promise<ProjetCoord[]> {
  const projets = (await fetchAll<ProjetCoord>("/projets/")).filter((p) => STATUTS_INCUBES.includes(p.statut));
  const affectations = await Promise.all(
    projets.map((p) => api<AffectationMentor | null>(`/incubator/projets/${p.id}/mentor/`)),
  );
  return projets.filter((_, i) => !affectations[i]);
}

function Spinner() {
  return (
    <div className="flex justify-center py-8" role="status" aria-label="Chargement">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-beige border-t-brun" />
    </div>
  );
}

function Panel({
  title,
  count,
  tone = "brun",
  action,
  children,
}: {
  title: string;
  count?: number;
  tone?: "brun" | "erreur";
  action: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="flex flex-col rounded-xl border border-bordure bg-white p-4 shadow-sm sm:p-6">
      <div className="mb-3 flex items-start justify-between gap-3">
        <h2 className="text-lg font-bold text-brun">{title}</h2>
        {count !== undefined && (
          <span
            className={`min-w-10 rounded-full px-3 py-1 text-center text-lg font-extrabold ${
              tone === "erreur" && count > 0 ? "bg-erreur text-white" : "bg-ivoire text-brun"
            }`}
          >
            {count}
          </span>
        )}
      </div>
      <div className="flex-1">{children}</div>
      <div className="mt-4">{action}</div>
    </section>
  );
}

const LINK_BTN =
  "inline-flex min-h-11 w-full items-center justify-center rounded-lg px-5 text-sm font-semibold transition-colors sm:w-auto";

export default function CoordinationHome() {
  const dossiers = useLoad(loadDossiers, "Impossible de charger les dossiers.");
  const alertes = useLoad<AlerteJalon[]>(getAlertes, "Impossible de charger les alertes de retard.");
  const sansMentor = useLoad(loadProjetsSansMentor, "Impossible de vérifier les affectations de mentors.");

  const aTraiter = dossiers.data?.filter((d) => d.statut === "soumis" || d.statut === "en_evaluation");

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:py-12">
      <PageTitle
        title="Coordination de l'incubateur"
        subtitle="Dossiers à traiter, jalons en retard et projets en attente de mentor."
      />

      <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
        <Link href="/incubateur/evaluation" className={`${LINK_BTN} bg-brun text-white hover:bg-brun-fonce`}>
          Évaluations et décisions
        </Link>
        <Link
          href="/incubateur/projets"
          className={`${LINK_BTN} border-[1.5px] border-brun bg-white text-brun hover:bg-ivoire`}
        >
          Suivi des projets
        </Link>
        <Link
          href="/incubateur/calendrier"
          className={`${LINK_BTN} border-[1.5px] border-brun bg-white text-brun hover:bg-ivoire`}
        >
          Calendrier des jalons
        </Link>
        <Link
          href="/incubateur/alertes"
          className={`${LINK_BTN} border-[1.5px] border-brun bg-white text-brun hover:bg-ivoire`}
        >
          Alertes de retard
        </Link>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Panel
          title="Dossiers à traiter"
          count={aTraiter?.length}
          action={
            <Link href="/incubateur/evaluation" className={`${LINK_BTN} border-[1.5px] border-brun text-brun hover:bg-ivoire`}>
              Ouvrir la file d&apos;évaluation
            </Link>
          }
        >
          {dossiers.error ? (
            <ApiErrorBanner message={dossiers.error} onRetry={dossiers.retry} className="!mb-0" />
          ) : !aTraiter ? (
            <Spinner />
          ) : aTraiter.length === 0 ? (
            <p className="text-sm text-texte-doux">Aucun dossier en attente de traitement.</p>
          ) : (
            <ul className="divide-y divide-bordure">
              {aTraiter.slice(0, 6).map((d) => (
                <li key={d.id} className="flex items-center justify-between gap-2 py-2">
                  <span className="min-w-0 truncate text-sm font-medium text-texte">{d.projet.titre}</span>
                  <Badge tone={d.statut === "soumis" ? "alerte" : "info"}>{STATUT_LABELS[d.statut].label}</Badge>
                </li>
              ))}
              {aTraiter.length > 6 && (
                <li className="pt-2 text-xs text-texte-doux">+ {aTraiter.length - 6} autre(s) dossier(s)</li>
              )}
            </ul>
          )}
        </Panel>

        <Panel
          title="Jalons en retard"
          count={alertes.data?.length}
          tone="erreur"
          action={
            <Link href="/incubateur/alertes" className={`${LINK_BTN} border-[1.5px] border-brun text-brun hover:bg-ivoire`}>
              Voir toutes les alertes
            </Link>
          }
        >
          {alertes.error ? (
            <ApiErrorBanner message={alertes.error} onRetry={alertes.retry} className="!mb-0" />
          ) : !alertes.data ? (
            <Spinner />
          ) : alertes.data.length === 0 ? (
            <p className="text-sm font-medium text-succes">Aucun jalon en retard.</p>
          ) : (
            <ul className="divide-y divide-bordure">
              {alertes.data.slice(0, 5).map((a) => (
                <li key={a.id} className="py-2 text-sm">
                  <Link href={`/incubateur/projets/${a.projet}#jalon-${a.id}`} className="font-medium text-brun underline">
                    {a.titre}
                  </Link>
                  <span className="text-texte-doux"> — {a.projet_titre}</span>
                </li>
              ))}
            </ul>
          )}
        </Panel>

        <div className="lg:col-span-2">
          <Panel
            title="Projets incubés sans mentor"
            count={sansMentor.data?.length}
            tone="erreur"
            action={
              <Link href="/incubateur/projets" className={`${LINK_BTN} border-[1.5px] border-brun text-brun hover:bg-ivoire`}>
                Ouvrir le suivi des projets
              </Link>
            }
          >
            {sansMentor.error ? (
              <ApiErrorBanner message={sansMentor.error} onRetry={sansMentor.retry} className="!mb-0" />
            ) : !sansMentor.data ? (
              <Spinner />
            ) : sansMentor.data.length === 0 ? (
              <p className="text-sm font-medium text-succes">Tous les projets incubés ont un mentor.</p>
            ) : (
              <ul className="grid gap-2 sm:grid-cols-2">
                {sansMentor.data.map((p) => (
                  <li key={p.id}>
                    <Link
                      href={`/incubateur/projets/${p.id}`}
                      className="flex min-h-11 flex-col justify-center rounded-lg border border-bordure px-3 py-2 hover:border-beige"
                    >
                      <span className="text-sm font-semibold text-brun">{p.titre}</span>
                      <span className="text-xs text-texte-doux">{[p.porteur_nom, p.domaine_nom].filter(Boolean).join(" · ")}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </Panel>
        </div>
      </div>
    </div>
  );
}
