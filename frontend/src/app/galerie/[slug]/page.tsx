"use client";

import { Suspense, useEffect, useState, use, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import {
  ApiErrorBanner,
  Badge,
  Button,
  ButtonLink,
  Card,
  DemoBanner,
} from "@/components/ui";
import CardImage from "@/components/CardImage";
import {
  CheckCircle2,
  AlertCircle,
  Loader2,
  X,
  Handshake,
  Send,
} from "lucide-react";
import {
  getFicheBySlug,
  getFicheQrUrl,
  postInteretFiche,
  type FicheInnovation,
} from "@/lib/gallery-api";
import {
  filterValidExternalMedias,
  resolveFichePhotos,
} from "../galerie-visuals";

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
  const mounted = useSyncExternalStore(
    () => () => { },
    () => true,
    () => false
  );

  // États Formulaire "Je suis intéressé" (Phase 8 — T1)
  const [showInteretModal, setShowInteretModal] = useState(false);
  const [interetNom, setInteretNom] = useState("");
  const [interetEmail, setInteretEmail] = useState("");
  const [interetOrganisation, setInteretOrganisation] = useState("");
  const [interetMessage, setInteretMessage] = useState("");
  const [interetSubmitting, setInteretSubmitting] = useState(false);
  const [interetSuccess, setInteretSuccess] = useState<string | null>(null);
  const [interetError, setInteretError] = useState<string | null>(null);
  const [interetFieldErrors, setInteretFieldErrors] = useState<Record<string, string>>({});

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

  // Fermeture du modal par touche Échap et blocage du défilement de fond
  useEffect(() => {
    if (showInteretModal) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && showInteretModal) {
        setShowInteretModal(false);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [showInteretModal]);

  const handleInteretSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const errs: Record<string, string> = {};
    if (!interetNom.trim()) {
      errs.nom = "Veuillez renseigner votre nom complet.";
    }
    if (!interetEmail.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(interetEmail.trim())) {
      errs.email = "Veuillez renseigner une adresse email valide.";
    }
    if (!interetMessage.trim() || interetMessage.trim().length < 10) {
      errs.message = "Votre message doit comporter au moins 10 caractères.";
    } else if (interetMessage.trim().length > 1500) {
      errs.message = "Votre message ne peut excéder 1500 caractères.";
    }

    if (Object.keys(errs).length > 0) {
      setInteretFieldErrors(errs);
      return;
    }

    setInteretSubmitting(true);
    setInteretError(null);
    setInteretFieldErrors({});

    try {
      const res = await postInteretFiche(slug, {
        nom: interetNom,
        email: interetEmail,
        organisation: interetOrganisation,
        message: interetMessage,
      });

      if (res.success) {
        setInteretSuccess(
          res.message ||
          "Votre manifestation d'intérêt a bien été enregistrée pour cette innovation. Le porteur et le coordonnateur du CIAT prendront contact avec vous."
        );
        setInteretNom("");
        setInteretEmail("");
        setInteretOrganisation("");
        setInteretMessage("");
      } else {
        setInteretError(
          res.error || "Une erreur est survenue lors de la transmission. Vos données ont été conservées."
        );
        if (res.errors) {
          setInteretFieldErrors(res.errors);
        }
      }
    } catch {
      setInteretError(
        "Connexion au serveur impossible. Vos informations ont été conservées ci-dessus, veuillez réessayer."
      );
    } finally {
      setInteretSubmitting(false);
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

  const photos = resolveFichePhotos(fiche);
  const videos = filterValidExternalMedias(
    fiche.medias?.filter((m) => m.type === "video") || []
  );
  const demos = filterValidExternalMedias(
    fiche.medias?.filter((m) => m.type === "demo") || []
  );

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
            {/* Galerie de Photos avec aspect-video réservé et repli visuel propre */}
            <section aria-label="Galerie photos" className="overflow-hidden rounded-2xl border border-bordure bg-white shadow-xs">
              <div className="relative aspect-video w-full overflow-hidden bg-black/5">
                <CardImage
                  src={photos[activePhotoIndex]?.url}
                  alt={`${fiche.titre} — photo ${activePhotoIndex + 1}`}
                  aspectRatio="aspect-video"
                  fallbackCategory="Prototype CIAT"
                  fallbackIcon="prototype"
                />
              </div>

              {photos.length > 1 && (
                <div className="flex gap-2 p-3 bg-ivoire overflow-x-auto border-t border-bordure/60">
                  {photos.map((photo, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setActivePhotoIndex(idx)}
                      className={`relative h-16 w-24 shrink-0 overflow-hidden rounded-lg border-2 transition ${activePhotoIndex === idx ? "border-brun shadow-xs" : "border-transparent opacity-70 hover:opacity-100"
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

            {/* Bannière Partenaires & Investisseurs — Appel à manifestation d'intérêt */}
            <div className="rounded-2xl border border-[#EBE4DC] bg-white p-6 sm:p-8 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#612D10]">
                  OPPORTUNITÉ DE COOPÉRATION & PARTENARIAT
                </span>
                <h3 className="text-lg font-bold text-[#24140D] mt-0.5">
                  Cette innovation intéresse votre organisation ?
                </h3>
                <p className="text-xs text-[#5A4A40] mt-1 max-w-xl leading-relaxed">
                  Prenez contact directement avec le porteur du projet et l&apos;équipe du CIAT pour explorer un pilote terrain, un accord de distribution ou un accompagnement investisseur.
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setInteretError(null);
                  setShowInteretModal(true);
                }}
                className="shrink-0 min-h-[44px] py-3 px-6 rounded-xl bg-[#612D10] hover:bg-[#7D3A15] text-white font-semibold text-sm transition-all shadow-sm active:scale-[0.99] flex items-center gap-2 cursor-pointer focus-visible:outline-2 focus-visible:outline-[#C99A68]"
              >
                <Handshake className="h-4 w-4 text-[#E2A669]" />
                Je suis intéressé
              </button>
            </div>
          </div>

          {/* Colonne Latérale (Actions, Intérêt, QR Code & Statut) */}
          <aside className="space-y-6">
            {/* 1. Carte Espace Partenaires & Investisseurs */}
            <div className="rounded-2xl border-2 border-[#C99A68] bg-white p-6 shadow-xs text-left">
              <div className="inline-flex items-center gap-2 mb-2">
                <span className="h-2 w-2 rounded-full bg-[#C99A68] animate-pulse" />
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#612D10]">
                  Espace Partenaires & Investisseurs
                </span>
              </div>
              <h2 className="text-base font-bold text-[#24140D] tracking-tight">
                Soutenir ou déployer cette innovation
              </h2>
              <p className="mt-1 text-xs text-[#5A4A40] leading-relaxed">
                Vous représentez une entreprise, une institution ou un fonds ? Manifestez votre intérêt pour entrer en relation directe avec l&apos;équipe du CIAT.
              </p>
              <button
                type="button"
                onClick={() => {
                  setInteretError(null);
                  setShowInteretModal(true);
                }}
                className="w-full mt-4 min-h-[44px] py-3.5 px-5 rounded-xl bg-[#612D10] hover:bg-[#7D3A15] text-white font-semibold text-sm transition-all shadow-sm active:scale-[0.99] flex items-center justify-center gap-2 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#C99A68]"
              >
                <Handshake className="h-4 w-4 text-[#E2A669]" />
                Je suis intéressé
              </button>
            </div>

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
                        className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full font-bold ${isCurrent
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

      {/* ========================================================= */}
      {/* MODAL « JE SUIS INTÉRESSÉ » — PORTAL DANS DOCUMENT.BODY  */}
      {/* ========================================================= */}
      {showInteretModal && mounted && createPortal(
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="interet-modal-title"
          className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6 bg-black/70 backdrop-blur-sm overflow-y-auto"
          onClick={() => setShowInteretModal(false)}
        >
          <div
            className="relative w-full max-w-xl bg-white rounded-3xl p-6 sm:p-8 shadow-2xl border border-[#EBE4DC] my-auto animate-in fade-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Bouton Fermer */}
            <button
              type="button"
              onClick={() => setShowInteretModal(false)}
              className="absolute top-5 right-5 h-10 w-10 rounded-full bg-[#F4F4F6] text-[#5A4A40] hover:bg-[#EBE4DC] hover:text-[#24140D] flex items-center justify-center transition cursor-pointer focus-visible:outline-2 focus-visible:outline-[#C99A68]"
              aria-label="Fermer la fenêtre"
            >
              <X className="h-5 w-5" />
            </button>

            {/* En-tête */}
            <div className="pr-10 mb-6">
              <div className="inline-flex items-center gap-2 mb-2">
                <span className="h-2 w-2 rounded-full bg-[#C99A68]" />
                <span className="text-[11px] font-bold tracking-wider text-[#612D10] uppercase">
                  ESPACE PARTENAIRES & INVESTISSEURS
                </span>
              </div>
              <h3 id="interet-modal-title" className="text-2xl font-bold text-[#24140D] tracking-tight">
                Manifester votre intérêt
              </h3>
              <p className="mt-1 text-xs sm:text-sm text-[#5A4A40]">
                Projet : <strong className="text-[#24140D]">{fiche.titre}</strong>
              </p>
            </div>

            {/* Notification Succès */}
            {interetSuccess ? (
              <div className="space-y-4">
                <div
                  role="status"
                  aria-live="polite"
                  className="flex items-start gap-3 rounded-2xl bg-emerald-50 border border-emerald-200 p-5 text-emerald-950"
                >
                  <CheckCircle2 className="h-6 w-6 text-emerald-600 shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="font-bold text-sm">Manifestation enregistrée avec succès</p>
                    <p className="mt-1 text-xs text-emerald-800 leading-relaxed">{interetSuccess}</p>
                    <p className="mt-2 text-[11px] text-emerald-700">
                      Le porteur du projet et le coordonnateur du CIAT ont été notifiés de votre démarche.
                    </p>
                  </div>
                </div>
                <div className="flex justify-end pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setInteretSuccess(null);
                      setShowInteretModal(false);
                    }}
                    className="min-h-[44px] px-6 py-2.5 rounded-xl bg-[#612D10] hover:bg-[#7D3A15] text-white font-semibold text-sm transition cursor-pointer"
                  >
                    Fermer
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleInteretSubmit} noValidate className="space-y-4">
                {/* Erreur générale */}
                {interetError && (
                  <div
                    role="alert"
                    className="flex items-start gap-3 rounded-xl bg-red-50 border border-red-200 p-4 text-xs text-red-900"
                  >
                    <AlertCircle className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <p className="font-bold">Transmission impossible</p>
                      <p className="mt-0.5 text-red-800 leading-relaxed">{interetError}</p>
                    </div>
                  </div>
                )}

                {/* Formulaire avec design hérité de la page Contact */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Nom */}
                  <div>
                    <label htmlFor="interet-nom" className="block text-xs font-semibold text-[#5A4A40] mb-1.5">
                      Nom complet <span className="text-red-600">*</span>
                    </label>
                    <input
                      type="text"
                      id="interet-nom"
                      required
                      value={interetNom}
                      onChange={(e) => setInteretNom(e.target.value)}
                      placeholder="Mme/M. Prénom Nom"
                      disabled={interetSubmitting}
                      className="w-full rounded-xl bg-[#F4F4F6] border-none px-4 py-3.5 text-sm text-[#24140D] placeholder:text-[#9C8B7E] focus:outline-none focus:ring-2 focus:ring-[#24140D] transition-all"
                    />
                    {interetFieldErrors.nom && (
                      <p className="mt-1 text-xs text-red-600 font-medium">{interetFieldErrors.nom}</p>
                    )}
                  </div>

                  {/* Email */}
                  <div>
                    <label htmlFor="interet-email" className="block text-xs font-semibold text-[#5A4A40] mb-1.5">
                      Email professionnel <span className="text-red-600">*</span>
                    </label>
                    <input
                      type="email"
                      id="interet-email"
                      required
                      value={interetEmail}
                      onChange={(e) => setInteretEmail(e.target.value)}
                      placeholder="prenom.nom@organisation.sn"
                      disabled={interetSubmitting}
                      className="w-full rounded-xl bg-[#F4F4F6] border-none px-4 py-3.5 text-sm text-[#24140D] placeholder:text-[#9C8B7E] focus:outline-none focus:ring-2 focus:ring-[#24140D] transition-all"
                    />
                    {interetFieldErrors.email && (
                      <p className="mt-1 text-xs text-red-600 font-medium">{interetFieldErrors.email}</p>
                    )}
                  </div>
                </div>

                {/* Organisation */}
                <div>
                  <label htmlFor="interet-organisation" className="block text-xs font-semibold text-[#5A4A40] mb-1.5">
                    Organisation / Entreprise / Fonds (optionnel)
                  </label>
                  <input
                    type="text"
                    id="interet-organisation"
                    value={interetOrganisation}
                    onChange={(e) => setInteretOrganisation(e.target.value)}
                    placeholder="Structure, fonds d'investissement, ONG, partenaire industriel..."
                    disabled={interetSubmitting}
                    className="w-full rounded-xl bg-[#F4F4F6] border-none px-4 py-3.5 text-sm text-[#24140D] placeholder:text-[#9C8B7E] focus:outline-none focus:ring-2 focus:ring-[#24140D] transition-all"
                  />
                  {interetFieldErrors.organisation && (
                    <p className="mt-1 text-xs text-red-600 font-medium">{interetFieldErrors.organisation}</p>
                  )}
                </div>

                {/* Message */}
                <div>
                  <div className="flex justify-between items-center mb-1.5">
                    <label htmlFor="interet-message" className="block text-xs font-semibold text-[#5A4A40]">
                      Votre message ou proposition <span className="text-red-600">*</span>
                    </label>
                    <span className="text-[11px] text-[#9C8B7E]">
                      {interetMessage.length} / 1500 caractères
                    </span>
                  </div>
                  <textarea
                    id="interet-message"
                    required
                    rows={4}
                    maxLength={1500}
                    value={interetMessage}
                    onChange={(e) => setInteretMessage(e.target.value)}
                    placeholder="Précisez la nature de votre intérêt : opportunité de pilote terrain, financement, accord de distribution, R&D commune..."
                    disabled={interetSubmitting}
                    className="w-full rounded-xl bg-[#F4F4F6] border-none px-4 py-3.5 text-sm text-[#24140D] placeholder:text-[#9C8B7E] focus:outline-none focus:ring-2 focus:ring-[#24140D] transition-all"
                  />
                  {interetFieldErrors.message && (
                    <p className="mt-1 text-xs text-red-600 font-medium">{interetFieldErrors.message}</p>
                  )}
                </div>

                {/* Actions */}
                <div className="pt-2 flex flex-col sm:flex-row gap-3">
                  <button
                    type="button"
                    onClick={() => setShowInteretModal(false)}
                    disabled={interetSubmitting}
                    className="min-h-[44px] sm:w-1/3 py-3 px-4 rounded-xl border border-[#EBE4DC] bg-white hover:bg-[#F4F4F6] text-[#5A4A40] font-semibold text-sm transition text-center cursor-pointer disabled:opacity-50"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    disabled={interetSubmitting}
                    className="min-h-[44px] flex-1 py-3 px-5 rounded-xl bg-[#612D10] hover:bg-[#7D3A15] text-white font-semibold text-sm transition-all shadow-sm active:scale-[0.99] disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center gap-2 cursor-pointer"
                  >
                    {interetSubmitting ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin text-white" />
                        Transmission en cours...
                      </>
                    ) : (
                      <>
                        <Send className="h-4 w-4 text-[#E2A669]" />
                        Transmettre mon intérêt
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>,
        document.body
      )}
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
