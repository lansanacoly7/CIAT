"use client";

import { Suspense, useEffect, useState, use } from "react";
import Link from "next/link";
import {
  ApiErrorBanner,
  Badge,
  Button,
  ButtonLink,
  Card,
  DemoBanner,
} from "@/components/ui";
import {
  getFicheBySlug,
  getFicheQrUrl,
  type FicheInnovation,
} from "@/lib/gallery-api";

function getAvancementBadgeTone(avancement: string): "succes" | "alerte" | "info" | "neutre" {
  const norm = avancement.toLowerCase();
  if (norm.includes("déploiement") || norm.includes("deploiement")) return "succes";
  if (norm.includes("pilote")) return "succes";
  if (norm.includes("mvp")) return "alerte";
  if (norm.includes("prototype")) return "info";
  return "neutre";
}

const ETAPES_AVANCEMENT = [
  { label: "Idée & Cadrage", code: "idee" },
  { label: "Prototype Validé", code: "prototype" },
  { label: "MVP / Pilote", code: "mvp" },
  { label: "Déploiement", code: "deploiement" },
];

function FicheDetailContent({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const resolvedParams = use(params);
  const slug = resolvedParams.slug;

  const [fiche, setFiche] = useState<FicheInnovation | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDemo, setIsDemo] = useState(false);
  const [activePhotoIndex, setActivePhotoIndex] = useState(0);
  const [copied, setCopied] = useState(false);

  const loadFiche = () => {
    setLoading(true);
    setError(null);
    setNotFound(false);

    getFicheBySlug(slug)
      .then((res) => {
        if (res.notFound) {
          setNotFound(true);
          setFiche(null);
        } else if (res.fiche) {
          setFiche(res.fiche);
          setIsDemo(Boolean(res.isDemo));
        } else {
          setError(res.error || "Impossible de charger la fiche.");
        }
        setLoading(false);
      })
      .catch(() => {
        setError("Erreur de connexion au serveur. Réessayez plus tard.");
        setLoading(false);
      });
  };

  useEffect(() => {
    let ignore = false;
    getFicheBySlug(slug)
      .then((res) => {
        if (!ignore) {
          if (res.notFound) {
            setNotFound(true);
            setFiche(null);
          } else if (res.fiche) {
            setFiche(res.fiche);
            setIsDemo(Boolean(res.isDemo));
          } else {
            setError(res.error || "Impossible de charger la fiche.");
          }
          setLoading(false);
        }
      })
      .catch(() => {
        if (!ignore) {
          setError("Erreur de connexion au serveur. Réessayez plus tard.");
          setLoading(false);
        }
      });

    return () => {
      ignore = true;
    };
  }, [slug]);

  const handleShare = () => {
    if (typeof window !== "undefined") {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const handleDownloadQr = async () => {
    try {
      const qrUrl = getFicheQrUrl(slug);
      const res = await fetch(qrUrl);
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `qr_${slug}.png`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch {
      alert("Erreur lors du téléchargement du QR Code.");
    }
  };

  // 1. Écran de chargement
  if (loading) {
    return (
      <div className="bg-[#FAF8F5] min-h-screen py-12">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="h-6 w-48 animate-pulse rounded bg-ivoire" />
          <div className="mt-6 h-10 w-3/4 animate-pulse rounded-lg bg-ivoire" />
          <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-3">
            <div className="lg:col-span-2 space-y-6">
              <div className="h-80 w-full animate-pulse rounded-2xl bg-ivoire" />
              <div className="h-32 w-full animate-pulse rounded-2xl bg-ivoire" />
            </div>
            <div className="h-96 w-full animate-pulse rounded-2xl bg-ivoire" />
          </div>
        </div>
      </div>
    );
  }

  // 2. Fiche Introuvable ou non publiée (404 conforme)
  if (notFound || !fiche) {
    return (
      <div className="bg-[#FAF8F5] min-h-screen py-16">
        <div className="mx-auto max-w-2xl px-4 text-center">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-erreur/10 text-erreur">
            <svg className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h1 className="mt-6 text-2xl font-extrabold text-brun sm:text-3xl">
            Fiche d&apos;innovation introuvable
          </h1>
          <p className="mt-3 text-sm text-texte-doux leading-relaxed">
            Cette fiche d&apos;innovation n&apos;existe pas ou n&apos;a pas encore été validée pour une publication officielle par le comité du CIAT.
          </p>
          <div className="mt-8 flex justify-center gap-4">
            <ButtonLink href="/galerie" variant="primary">
              ← Retourner à la galerie
            </ButtonLink>
          </div>
        </div>
      </div>
    );
  }

  const photos = fiche.medias?.filter((m) => m.type === "photo") || [];
  const videos = fiche.medias?.filter((m) => m.type === "video") || [];
  const demos = fiche.medias?.filter((m) => m.type === "demo") || [];

  return (
    <div className="bg-[#FAF8F5] min-h-screen py-10">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        {/* Fil d'Ariane */}
        <nav aria-label="Fil d'ariane" className="mb-6 flex items-center gap-2 text-xs text-texte-doux">
          <Link href="/" className="hover:text-brun transition">Accueil</Link>
          <span>/</span>
          <Link href="/galerie" className="hover:text-brun transition">Galerie des innovations</Link>
          <span>/</span>
          <span className="font-semibold text-brun truncate max-w-xs">{fiche.titre}</span>
        </nav>

        {/* Bandeau Démonstration si activé */}
        {isDemo && <DemoBanner className="mb-6" />}

        {/* Bandeau d'erreur */}
        {error && (
          <ApiErrorBanner message={error} onRetry={loadFiche} className="mb-6" />
        )}

        {/* En-tête de la Fiche */}
        <header className="mb-8 rounded-2xl border border-bordure bg-white p-6 sm:p-8 shadow-xs">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-bordure/60 pb-4">
            <div className="flex items-center gap-3">
              <Badge tone={getAvancementBadgeTone(fiche.avancement)}>
                {fiche.avancement}
              </Badge>
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-succes bg-[#e3f1e9] px-2.5 py-1 rounded-full border border-[#c4e3d1]">
                <span className="h-1.5 w-1.5 rounded-full bg-succes" />
                Publication validée CIAT
              </span>
            </div>

            {/* Compteur de Vues Certifié */}
            <div className="flex items-center gap-2 text-xs font-bold text-brun">
              <span className="inline-flex items-center gap-1.5 rounded-lg bg-ivoire px-3 py-1.5 border border-bordure">
                <svg className="h-4 w-4 text-beige" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
                {fiche.vues} consultations certifiées
              </span>
            </div>
          </div>

          <h1 className="mt-4 text-2xl sm:text-3xl md:text-4xl font-extrabold text-brun leading-tight">
            {fiche.titre}
          </h1>

          <div className="mt-3 flex flex-wrap items-center gap-4 text-xs text-texte-doux">
            <span>Identifiant : <strong className="font-mono text-brun">#{fiche.id}</strong></span>
            <span>•</span>
            <span>Projet rattaché : <strong className="font-mono text-brun">Projet #{fiche.projet}</strong></span>
          </div>
        </header>

        {/* Corps Principal en 2 Colonnes */}
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          {/* Colonne Principale (Contenu et Médias) */}
          <div className="lg:col-span-2 space-y-8">
            {/* Galerie de Photos */}
            {photos.length > 0 && (
              <section aria-label="Galerie photos" className="overflow-hidden rounded-2xl border border-bordure bg-white shadow-xs">
                <div className="relative aspect-video w-full overflow-hidden bg-black/5">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={photos[activePhotoIndex].url}
                    alt={`${fiche.titre} — photo ${activePhotoIndex + 1}`}
                    className="h-full w-full object-cover transition-all duration-300"
                  />
                </div>

                {photos.length > 1 && (
                  <div className="flex gap-2 p-3 bg-ivoire overflow-x-auto border-t border-bordure/60">
                    {photos.map((photo, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setActivePhotoIndex(idx)}
                        className={`relative h-16 w-24 shrink-0 overflow-hidden rounded-lg border-2 transition ${
                          activePhotoIndex === idx ? "border-brun shadow-xs" : "border-transparent opacity-70 hover:opacity-100"
                        }`}
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={photo.url}
                          alt={`Aperçu ${idx + 1}`}
                          className="h-full w-full object-cover"
                        />
                      </button>
                    ))}
                  </div>
                )}
              </section>
            )}

            {/* Problème Adressé */}
            <Card>
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-erreur/10 text-erreur">
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-lg font-bold text-brun">Problème identifié sur le terrain</h2>
                  <p className="mt-3 text-sm text-texte-doux leading-relaxed whitespace-pre-line">
                    {fiche.probleme}
                  </p>
                </div>
              </div>
            </Card>

            {/* Solution Innovante */}
            <Card>
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-succes/10 text-succes">
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-lg font-bold text-brun">Solution technologique apportée</h2>
                  <p className="mt-3 text-sm text-texte-doux leading-relaxed whitespace-pre-line">
                    {fiche.solution}
                  </p>
                </div>
              </div>
            </Card>

            {/* Équipe & Compétences (Données publiques strictes sans fuite de contact) */}
            <Card>
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-beige/20 text-brun">
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-lg font-bold text-brun">Équipe du projet & Expertises</h2>
                  <p className="mt-3 text-sm text-texte-doux leading-relaxed whitespace-pre-line">
                    {fiche.equipe}
                  </p>
                  <p className="mt-4 text-xs text-texte-doux italic border-t border-bordure/60 pt-3">
                    Accompagné par les enseignants-chercheurs et mentors industriels du CIAT (ISEP Diamniadio).
                  </p>
                </div>
              </div>
            </Card>

            {/* Vidéos et Démonstrations en direct */}
            {(videos.length > 0 || demos.length > 0) && (
              <section aria-label="Démonstrations et vidéos" className="rounded-2xl border border-bordure bg-white p-6 shadow-xs">
                <h2 className="text-lg font-bold text-brun">Médias interactifs & Démonstrations</h2>
                <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
                  {demos.map((demo, idx) => (
                    <a
                      key={idx}
                      href={demo.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-between rounded-xl border border-beige bg-[#FAF8F5] p-4 text-sm font-semibold text-brun transition hover:bg-ivoire hover:shadow-xs"
                    >
                      <div className="flex items-center gap-3">
                        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-beige text-brun-fonce">
                          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                          </svg>
                        </span>
                        <span>Accéder à la démonstration #{idx + 1}</span>
                      </div>
                      <span className="text-xs text-beige font-bold">Ouvrir ↗</span>
                    </a>
                  ))}

                  {videos.map((vid, idx) => (
                    <a
                      key={idx}
                      href={vid.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-between rounded-xl border border-bordure bg-[#FAF8F5] p-4 text-sm font-semibold text-brun transition hover:bg-ivoire hover:shadow-xs"
                    >
                      <div className="flex items-center gap-3">
                        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brun text-white">
                          <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M6.3 2.841A1.5 1.5 0 004 4.11v11.78a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" />
                          </svg>
                        </span>
                        <span>Voir la vidéo de présentation #{idx + 1}</span>
                      </div>
                      <span className="text-xs text-brun font-bold">Lire ↗</span>
                    </a>
                  ))}
                </div>
              </section>
            )}
          </div>

          {/* Colonne Latérale (QR Code & Actions) */}
          <aside className="space-y-6">
            {/* Carte QR Code Officielle */}
            <div className="rounded-2xl border-2 border-beige/60 bg-white p-6 shadow-sm text-center">
              <span className="inline-block text-[11px] font-bold uppercase tracking-wider text-beige">
                Accès Mobile & Salon
              </span>
              <h2 className="mt-1 text-base font-bold text-brun">
                QR Code de l&apos;Innovation
              </h2>
              <p className="mt-1 text-xs text-texte-doux">
                Scannez pour ouvrir et présenter cette fiche instantanément sur smartphone.
              </p>

              {/* Image du QR Code PNG servi directement par le backend */}
              <div className="my-5 flex justify-center">
                <div className="rounded-xl border border-bordure bg-white p-3 shadow-inner">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={getFicheQrUrl(slug)}
                    alt={`QR Code vers la fiche ${fiche.titre}`}
                    className="h-48 w-48 object-contain"
                    loading="lazy"
                  />
                </div>
              </div>

              {/* Bouton de Téléchargement du QR Code */}
              <Button
                variant="primary"
                onClick={handleDownloadQr}
                className="w-full text-xs font-bold"
              >
                <svg className="mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                Télécharger le QR Code (PNG)
              </Button>
            </div>

            {/* Jauge d'Avancement */}
            <div className="rounded-2xl border border-bordure bg-white p-6 shadow-xs">
              <h2 className="text-sm font-bold text-brun uppercase tracking-wider">
                Cycle d&apos;Incubation CIAT
              </h2>
              <div className="mt-4 space-y-3">
                {ETAPES_AVANCEMENT.map((etp, idx) => {
                  const isCurrent = fiche.avancement.toLowerCase().includes(etp.code);
                  return (
                    <div key={idx} className="flex items-center gap-3 text-xs">
                      <span
                        className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full font-bold ${
                          isCurrent
                            ? "bg-succes text-white ring-2 ring-succes/30"
                            : "bg-ivoire text-texte-doux border border-bordure"
                        }`}
                      >
                        {idx + 1}
                      </span>
                      <span className={isCurrent ? "font-bold text-brun" : "text-texte-doux"}>
                        {etp.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Actions de Partage & Navigation */}
            <div className="rounded-2xl border border-bordure bg-white p-6 shadow-xs space-y-3">
              <Button
                variant="secondary"
                onClick={handleShare}
                className="w-full text-xs font-bold"
              >
                {copied ? "✓ Lien copié dans le presse-papier !" : "Partager cette fiche"}
              </Button>

              <ButtonLink
                href="/galerie"
                variant="outline"
                className="w-full text-xs font-bold"
              >
                ← Retour à la galerie
              </ButtonLink>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}

export default function FicheDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  return (
    <Suspense
      fallback={
        <div className="bg-[#FAF8F5] min-h-screen py-16">
          <div className="mx-auto max-w-4xl px-4 text-center">
            <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-beige border-t-brun" />
            <p className="mt-4 text-sm font-semibold text-brun">Chargement de la fiche d&apos;innovation...</p>
          </div>
        </div>
      }
    >
      <FicheDetailContent params={params} />
    </Suspense>
  );
}
