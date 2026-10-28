"use client";

import { useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import { ApiErrorBanner } from "@/components/ui";
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

const STATUTS_INCUBES = ["incube", "prototype"];

type State<T> = { data: T | null; error: string | null };

function useLoad<T>(fn: () => Promise<T>, fallback: string): State<T> & { retry: () => void } {
  const [state, setState] = useState<State<T>>({ data: null, error: null });
  const [tick, setTick] = useState(0);

  useEffect(() => {
    let cancelled = false;
    fn()
      .then((data) => !cancelled && setState({ data, error: null }))
      .catch((err) => !cancelled && setState({ data: null, error: suiviErrorMessage(err, fallback) }));
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tick]);

  return { ...state, retry: () => setTick((t) => t + 1) };
}

const loadDossiers = () => fetchAll<Dossier>("/incubator/dossiers/");

async function loadProjetsSansMentor(): Promise<ProjetCoord[]> {
  const projets = (await fetchAll<ProjetCoord>("/projets/")).filter((p) =>
    STATUTS_INCUBES.includes(p.statut)
  );
  const affectations = await Promise.all(
    projets.map((p) => api<AffectationMentor | null>(`/incubator/projets/${p.id}/mentor/`))
  );
  return projets.filter((_, i) => !affectations[i]);
}

function Spinner() {
  return (
    <div className="flex justify-center py-10" role="status" aria-label="Chargement">
      <div className="h-8 w-8 animate-spin rounded-full border-[3px] border-[#EFE4D6]/30 border-t-[#C99A68]" />
    </div>
  );
}

/* ── KPI Stat Card ── */
function StatCard({
  label,
  value,
  tone = "neutral",
  icon: _icon, // eslint-disable-line @typescript-eslint/no-unused-vars
}: {
  label: string;
  value: number | null;
  tone?: "neutral" | "warning" | "danger" | "success";
  icon: ReactNode;
}) {
  const styles = {
    neutral: { bottom: "border-b-[#8C5E2D]", val: "text-[#1F130B]", lbl: "text-[#8C6D58]" },
    warning: { bottom: "border-b-amber-400",   val: "text-[#1F130B]", lbl: "text-[#8C6D58]" },
    danger:  { bottom: "border-b-red-400",      val: "text-[#1F130B]", lbl: "text-[#8C6D58]" },
    success: { bottom: "border-b-green-400",    val: "text-[#1F130B]", lbl: "text-[#8C6D58]" },
  };

  const s = styles[tone === "danger" && value === 0 ? "success" : tone];

  return (
    <div className={`rounded-xl border-b-2 bg-white px-4 py-4 ${s.bottom}`}>
      <p className={`text-[10px] font-bold uppercase tracking-widest ${s.lbl}`}>{label}</p>
      <p className={`mt-1 text-3xl font-extrabold tabular-nums leading-none ${s.val}`}>
        {value === null ? (
          <span className="inline-block h-7 w-8 animate-pulse rounded bg-[#EFE4D6]" />
        ) : (
          value
        )}
      </p>
    </div>
  );
}

/* ── Quick Action Nav ── */
type Tab = "dossiers" | "alertes" | "mentors";

function QuickNav({ active, onChange }: { active: Tab; onChange: (t: Tab) => void }) {
  const tabs: { id: Tab; label: string }[] = [
    { id: "dossiers", label: "Évaluations et décisions" },
    { id: "alertes", label: "Jalons en retard" },
    { id: "mentors", label: "Projets sans mentor" },
  ];

  return (
    <div className="flex flex-wrap gap-2">
      {tabs.map((t) => (
        <button
          key={t.id}
          type="button"
          onClick={() => onChange(t.id)}
          className={`inline-flex min-h-10 items-center rounded-xl px-5 text-sm font-semibold transition-all focus:outline-none focus:ring-2 focus:ring-[#C99A68]/50 focus:ring-offset-2 focus:ring-offset-[#FAF7F2] ${
            active === t.id
              ? "bg-[#612D10] text-white shadow-md shadow-[#612D10]/30"
              : "border border-[#612D10]/30 bg-white text-[#612D10] hover:bg-[#F5EBE0] hover:border-[#612D10]/60"
          }`}
        >
          {t.label}
        </button>
      ))}

      {/* External links */}
      <div className="ml-auto flex gap-2">
        <Link
          href="/incubateur/calendrier"
          className="inline-flex min-h-10 items-center gap-1.5 rounded-xl border border-[#612D10]/20 bg-white px-4 text-sm font-medium text-[#612D10] hover:bg-[#F5EBE0] transition-colors"
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          Calendrier
        </Link>
        <Link
          href="/incubateur/projets"
          className="inline-flex min-h-10 items-center gap-1.5 rounded-xl border border-[#612D10]/20 bg-white px-4 text-sm font-medium text-[#612D10] hover:bg-[#F5EBE0] transition-colors"
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
          Tous les projets
        </Link>
      </div>
    </div>
  );
}

/* ── Badge statut ── */
function StatusBadge({ statut }: { statut: string }) {
  const conf = (STATUT_LABELS as Record<string, { label: string }>)[statut] ?? { label: statut };
  const colorMap: Record<string, string> = {
    soumis: "bg-amber-100 text-amber-800 border-amber-200",
    en_evaluation: "bg-blue-100 text-blue-800 border-blue-200",
    accepte: "bg-green-100 text-green-800 border-green-200",
    refuse: "bg-red-100 text-red-800 border-red-200",
  };
  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${colorMap[statut] ?? "bg-gray-100 text-gray-700 border-gray-200"}`}>
      {conf.label}
    </span>
  );
}

/* ── Dossiers Panel ── */
function DossiersPanel({ dossiers }: { dossiers: ReturnType<typeof useLoad<Dossier[]>> }) {
  const aTraiter = dossiers.data?.filter((d) => d.statut === "soumis" || d.statut === "en_evaluation");

  return (
    <div className="space-y-4">
      {dossiers.error ? (
        <ApiErrorBanner message={dossiers.error} onRetry={dossiers.retry} />
      ) : !aTraiter ? (
        <Spinner />
      ) : aTraiter.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-green-200 bg-green-50 py-10">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-green-100">
            <svg className="h-7 w-7 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <p className="text-sm font-semibold text-green-700">File d&apos;évaluation vide</p>
          <p className="text-xs text-green-600/80">Aucun dossier en attente de traitement.</p>
        </div>
      ) : (
        <div className="divide-y divide-[#EFE4D6] rounded-2xl border border-[#EFE4D6] bg-white overflow-hidden">
          {aTraiter.slice(0, 8).map((d, idx) => (
            <div
              key={d.id}
              className="flex items-center justify-between gap-3 px-5 py-3.5 hover:bg-[#FAF7F2] transition-colors"
            >
              <div className="flex items-center gap-3 min-w-0">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[#F5EBE0] text-[11px] font-bold text-[#8C5E2D]">
                  {idx + 1}
                </span>
                <span className="min-w-0 truncate text-sm font-medium text-[#1F130B]">
                  {d.projet.titre}
                </span>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <StatusBadge statut={d.statut} />
                <Link
                  href="/incubateur/evaluation"
                  className="hidden sm:inline-flex items-center justify-center h-7 w-7 rounded-lg bg-[#F5EBE0] text-[#612D10] hover:bg-[#612D10] hover:text-white transition-colors"
                  title="Évaluer"
                >
                  <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
              </div>
            </div>
          ))}
          {aTraiter.length > 8 && (
            <div className="px-5 py-3 text-xs text-[#8C6D58] bg-[#FAF7F2]">
              + {aTraiter.length - 8} autre(s) dossier(s) en attente
            </div>
          )}
        </div>
      )}
      <Link
        href="/incubateur/evaluation"
        className="inline-flex min-h-11 w-full items-center justify-center rounded-xl bg-[#612D10] px-6 text-sm font-bold text-white shadow-sm transition-all hover:bg-[#3F1D0A] hover:shadow-md hover:scale-[1.01] active:scale-[0.99]"
      >
        Ouvrir la file d&apos;évaluation →
      </Link>
    </div>
  );
}

/* ── Alertes Panel ── */
function AlertesPanel({ alertes }: { alertes: ReturnType<typeof useLoad<AlerteJalon[]>> }) {
  return (
    <div className="space-y-4">
      {alertes.error ? (
        <ApiErrorBanner message={alertes.error} onRetry={alertes.retry} />
      ) : !alertes.data ? (
        <Spinner />
      ) : alertes.data.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-green-200 bg-green-50 py-10">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-green-100">
            <svg className="h-7 w-7 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <p className="text-sm font-semibold text-green-700">Aucun retard détecté</p>
          <p className="text-xs text-green-600/80">Tous les jalons respectent les échéances.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {alertes.data.slice(0, 6).map((a) => (
            <Link
              key={a.id}
              href={`/incubateur/projets/${a.projet}#jalon-${a.id}`}
              className="flex items-start gap-3 rounded-xl border border-red-200/60 bg-red-50/50 px-4 py-3.5 hover:bg-red-50 hover:border-red-300/60 transition-colors group"
            >
              <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-red-500/15">
                <span className="h-2 w-2 rounded-full bg-red-500" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-red-800 group-hover:text-red-900 truncate">{a.titre}</p>
                <p className="text-xs text-red-600/80 mt-0.5 truncate">{a.projet_titre}</p>
              </div>
              <svg className="h-4 w-4 shrink-0 text-red-400 mt-0.5 group-hover:translate-x-0.5 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          ))}
          {alertes.data.length > 6 && (
            <p className="px-1 text-xs text-[#8C6D58]">+ {alertes.data.length - 6} autre(s) jalon(s) en retard</p>
          )}
        </div>
      )}
      <Link
        href="/incubateur/alertes"
        className="inline-flex min-h-11 w-full items-center justify-center rounded-xl border-2 border-[#612D10] bg-white px-6 text-sm font-bold text-[#612D10] transition-all hover:bg-[#F5EBE0] hover:scale-[1.01] active:scale-[0.99]"
      >
        Voir toutes les alertes →
      </Link>
    </div>
  );
}

/* ── Mentors Panel ── */
function MentorsPanel({ sansMentor }: { sansMentor: ReturnType<typeof useLoad<ProjetCoord[]>> }) {
  return (
    <div className="space-y-4">
      {sansMentor.error ? (
        <ApiErrorBanner message={sansMentor.error} onRetry={sansMentor.retry} />
      ) : !sansMentor.data ? (
        <Spinner />
      ) : sansMentor.data.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-green-200 bg-green-50 py-10">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-green-100">
            <svg className="h-7 w-7 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
          <p className="text-sm font-semibold text-green-700">Tous les projets ont un mentor</p>
          <p className="text-xs text-green-600/80">Aucune affectation manquante.</p>
        </div>
      ) : (
        <div className="grid gap-2 sm:grid-cols-2">
          {sansMentor.data.map((p) => (
            <Link
              key={p.id}
              href={`/incubateur/projets/${p.id}`}
              className="flex items-center gap-3 rounded-xl border border-amber-200/60 bg-amber-50/50 px-4 py-3 hover:bg-amber-50 hover:border-amber-300/60 transition-colors group"
            >
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-amber-100 text-amber-700">
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-amber-900 truncate group-hover:text-amber-950">{p.titre}</p>
                <p className="text-xs text-amber-700/70 truncate">
                  {[p.porteur_nom, p.domaine_nom].filter(Boolean).join(" · ")}
                </p>
              </div>
              <svg className="h-4 w-4 shrink-0 text-amber-400 group-hover:translate-x-0.5 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          ))}
        </div>
      )}
      <Link
        href="/incubateur/projets"
        className="inline-flex min-h-11 w-full items-center justify-center rounded-xl border-2 border-[#612D10] bg-white px-6 text-sm font-bold text-[#612D10] transition-all hover:bg-[#F5EBE0] hover:scale-[1.01] active:scale-[0.99]"
      >
        Gérer les affectations →
      </Link>
    </div>
  );
}

/* ── Main Component ── */
export default function CoordinationHome() {
  const dossiers = useLoad(loadDossiers, "Impossible de charger les dossiers.");
  const alertes = useLoad<AlerteJalon[]>(getAlertes, "Impossible de charger les alertes de retard.");
  const sansMentor = useLoad(loadProjetsSansMentor, "Impossible de vérifier les affectations de mentors.");

  const aTraiter = dossiers.data?.filter((d) => d.statut === "soumis" || d.statut === "en_evaluation");
  const [activeTab, setActiveTab] = useState<Tab>("dossiers");

  const tabSections: Record<Tab, { title: string; description: string; content: ReactNode }> = {
    dossiers: {
      title: "Dossiers à traiter",
      description: "Candidatures en attente d'instruction et d'évaluation par le jury.",
      content: <DossiersPanel dossiers={dossiers} />,
    },
    alertes: {
      title: "Jalons en retard",
      description: "Jalons dont l'échéance est dépassée et qui nécessitent une action corrective.",
      content: <AlertesPanel alertes={alertes} />,
    },
    mentors: {
      title: "Projets sans mentor",
      description: "Projets en incubation active n'ayant pas encore d'expert mentor assigné.",
      content: <MentorsPanel sansMentor={sansMentor} />,
    },
  };

  const section = tabSections[activeTab];

  return (
    <div className="w-full min-h-screen bg-[#FAF7F2]">
      {/* ── HEADER ── */}
      <div className="border-b border-[#EFE4D6] bg-white">
        <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            {/* Left: Title block */}
            <div className="flex items-start gap-4">
              <div className="hidden sm:flex h-12 w-1.5 shrink-0 rounded-full bg-gradient-to-b from-[#C99A68] to-[#612D10]" />
              <div className="space-y-1">
                <div className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-widest text-[#A35926]">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#C99A68] animate-pulse" />
                  Espace Coordination · CIAT
                </div>
                <h1 className="font-[family-name:var(--font-title)] text-2xl font-extrabold tracking-tight text-[#1F130B] sm:text-3xl">
                  Coordination de l&apos;incubateur
                </h1>
                <p className="text-sm text-[#8C6D58]">
                  Pilotez les évaluations, les jalons et la couverture mentorale.
                </p>
              </div>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-3 gap-3 lg:gap-3 lg:min-w-[440px]">
              <StatCard
                label="À traiter"
                value={aTraiter?.length ?? null}
                tone="warning"
                icon={
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                }
              />
              <StatCard
                label="En retard"
                value={alertes.data?.length ?? null}
                tone="danger"
                icon={
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                }
              />
              <StatCard
                label="Sans mentor"
                value={sansMentor.data?.length ?? null}
                tone="danger"
                icon={
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                }
              />
            </div>
          </div>
        </div>
      </div>

      {/* ── MAIN CONTENT ── */}
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10 lg:px-8 space-y-6">
        {/* Quick Navigation */}
        <QuickNav active={activeTab} onChange={setActiveTab} />

        {/* Active Panel */}
        <div className="rounded-2xl border border-[#EFE4D6]/80 bg-white shadow-sm">
          {/* Panel Header */}
          <div className="border-b border-[#EFE4D6] px-6 py-5">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h2 className="font-[family-name:var(--font-title)] text-xl font-bold text-[#1F130B]">
                  {section.title}
                </h2>
                <p className="mt-0.5 text-sm text-[#8C6D58]">{section.description}</p>
              </div>
              {activeTab === "dossiers" && aTraiter !== undefined && (
                <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-lg font-extrabold ${
                  aTraiter && aTraiter.length > 0
                    ? "bg-amber-100 text-amber-700"
                    : "bg-[#F5EBE0] text-[#612D10]"
                }`}>
                  {aTraiter?.length ?? "…"}
                </span>
              )}
              {activeTab === "alertes" && (
                <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-lg font-extrabold ${
                  alertes.data && alertes.data.length > 0
                    ? "bg-red-100 text-red-700"
                    : "bg-[#F5EBE0] text-[#612D10]"
                }`}>
                  {alertes.data?.length ?? "…"}
                </span>
              )}
              {activeTab === "mentors" && (
                <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-lg font-extrabold ${
                  sansMentor.data && sansMentor.data.length > 0
                    ? "bg-amber-100 text-amber-700"
                    : "bg-green-100 text-green-700"
                }`}>
                  {sansMentor.data?.length ?? "…"}
                </span>
              )}
            </div>
          </div>

          {/* Panel Body */}
          <div className="p-6">{section.content}</div>
        </div>
      </div>
    </div>
  );
}
