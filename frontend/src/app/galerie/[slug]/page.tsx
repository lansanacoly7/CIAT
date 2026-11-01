"use client";

import { Suspense, useEffect, useState, use, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { ApiErrorBanner, Button, DemoBanner, FormField, Input, Textarea } from "@/components/ui";
import CardImage from "@/components/CardImage";
import { X } from "lucide-react";
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

  if (loading) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-16 sm:px-6">
        <div className="h-8 w-2/3 animate-pulse rounded-lg bg-ivoire" />
        <div className="mt-8 aspect-video w-full animate-pulse rounded-2xl bg-ivoire" />
      </div>
    );
  }

  if (notFound || !fiche) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-24 text-center">
        <h1 className="text-2xl font-bold">Fiche introuvable</h1>
        <p className="mt-3 text-texte-doux">
          Cette innovation n&apos;existe pas ou n&apos;est pas encore publiée.
        </p>
        <Link href="/galerie" className="mt-6 inline-block text-sm font-medium text-brun hover:underline">
          ← Galerie
        </Link>
      </div>
    );
  }

  const photos = resolveFichePhotos(fiche);
  const videos = filterValidExternalMedias(fiche.medias?.filter((m) => m.type === "video") || []);
  const demos = filterValidExternalMedias(fiche.medias?.filter((m) => m.type === "demo") || []);
  const liens = [
    ...demos.map((m, i) => ({ url: m.url, label: `Démonstration ${demos.length > 1 ? i + 1 : ""}`.trim() })),
    ...videos.map((m, i) => ({ url: m.url, label: `Vidéo ${videos.length > 1 ? i + 1 : ""}`.trim() })),
  ];

  const ouvrirInteret = () => {
    setInteretError(null);
    setShowInteretModal(true);
  };

  return (
    <article className="mx-auto max-w-5xl px-4 py-16 sm:px-6 md:py-20">
      {isDemo && <DemoBanner />}
      {error && <ApiErrorBanner message={error} onRetry={loadFiche} />}

      <Link href="/galerie" className="text-sm text-texte-doux hover:text-brun">
        ← Galerie
      </Link>

      <p className="mt-10 text-sm text-texte-doux">{fiche.avancement}</p>
      <h1 className="mt-2 max-w-3xl text-3xl font-bold leading-tight md:text-4xl">{fiche.titre}</h1>

      <div className="mt-10 overflow-hidden rounded-2xl">
        <CardImage
          src={photos[activePhotoIndex]?.url}
          alt={`${fiche.titre} — photo ${activePhotoIndex + 1}`}
          aspectRatio="aspect-video"
          fallbackCategory="Prototype CIAT"
          fallbackIcon="prototype"
        />
      </div>
      {photos.length > 1 && (
        <div className="mt-3 flex gap-2 overflow-x-auto">
          {photos.map((photo, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => setActivePhotoIndex(idx)}
              aria-label={`Photo ${idx + 1}`}
              className={`h-14 w-20 shrink-0 overflow-hidden rounded-lg transition ${
                activePhotoIndex === idx ? "ring-2 ring-brun" : "opacity-60 hover:opacity-100"
              }`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={photo.url} alt="" className="h-full w-full object-cover" />
            </button>
          ))}
        </div>
      )}

      <div className="mt-14 grid gap-14 lg:grid-cols-3">
        <div className="space-y-10 leading-relaxed lg:col-span-2">
          <section>
            <h2 className="text-xl font-semibold">Le problème</h2>
            <p className="mt-3 whitespace-pre-line text-texte-doux">{fiche.probleme}</p>
          </section>
          <section>
            <h2 className="text-xl font-semibold">La solution</h2>
            <p className="mt-3 whitespace-pre-line text-texte-doux">{fiche.solution}</p>
          </section>
          <section>
            <h2 className="text-xl font-semibold">L&apos;équipe</h2>
            <p className="mt-3 whitespace-pre-line text-texte-doux">{fiche.equipe}</p>
          </section>
          {liens.length > 0 && (
            <section>
              <h2 className="text-xl font-semibold">Voir en action</h2>
              <ul className="mt-3 space-y-2">
                {liens.map((l) => (
                  <li key={l.url}>
                    <a
                      href={l.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-medium text-brun hover:underline"
                    >
                      {l.label} ↗
                    </a>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>

        <aside className="space-y-10 lg:sticky lg:top-24 lg:self-start">
          <div>
            <h2 className="text-base font-semibold">Cette innovation vous intéresse ?</h2>
            <p className="mt-2 text-sm leading-relaxed text-texte-doux">
              Entrez en contact avec l&apos;équipe pour un pilote, un partenariat ou un financement.
            </p>
            <Button onClick={ouvrirInteret} className="mt-4 w-full">
              Je suis intéressé
            </Button>
          </div>
          <div>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={getFicheQrUrl(slug)}
              alt={`QR code vers la fiche ${fiche.titre}`}
              className="h-28 w-28 object-contain"
              loading="lazy"
            />
            <button
              type="button"
              onClick={handleDownloadQr}
              className="mt-2 text-sm font-medium text-brun hover:underline"
            >
              Télécharger le QR code
            </button>
          </div>
        </aside>
      </div>

      {showInteretModal &&
        mounted &&
        createPortal(
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="interet-modal-title"
            className="fixed inset-0 z-[9999] flex items-center justify-center overflow-y-auto bg-black/60 p-4 sm:p-6"
            onClick={() => setShowInteretModal(false)}
          >
            <div
              className="relative my-auto w-full max-w-lg rounded-2xl bg-white p-6 sm:p-8"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                type="button"
                onClick={() => setShowInteretModal(false)}
                className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full text-texte-doux hover:bg-ivoire"
                aria-label="Fermer"
              >
                <X className="h-5 w-5" />
              </button>

              <h2 id="interet-modal-title" className="pr-10 text-xl font-bold">
                Manifester votre intérêt
              </h2>
              <p className="mt-1 text-sm text-texte-doux">{fiche.titre}</p>

              {interetSuccess ? (
                <div className="mt-6">
                  <p role="status" aria-live="polite" className="rounded-xl bg-[#e3f1e9] p-4 text-sm text-succes">
                    {interetSuccess}
                  </p>
                  <div className="mt-6 flex justify-end">
                    <Button
                      onClick={() => {
                        setInteretSuccess(null);
                        setShowInteretModal(false);
                      }}
                    >
                      Fermer
                    </Button>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleInteretSubmit} noValidate className="mt-6 space-y-4">
                  {interetError && (
                    <p role="alert" className="rounded-xl bg-[#f6dedc] p-4 text-sm text-erreur">
                      {interetError}
                    </p>
                  )}
                  <div className="grid gap-4 sm:grid-cols-2">
                    <FormField id="interet-nom" label="Nom complet" required error={interetFieldErrors.nom}>
                      <Input
                        id="interet-nom"
                        value={interetNom}
                        onChange={(e) => setInteretNom(e.target.value)}
                        disabled={interetSubmitting}
                      />
                    </FormField>
                    <FormField id="interet-email" label="Email" required error={interetFieldErrors.email}>
                      <Input
                        id="interet-email"
                        type="email"
                        value={interetEmail}
                        onChange={(e) => setInteretEmail(e.target.value)}
                        disabled={interetSubmitting}
                      />
                    </FormField>
                  </div>
                  <FormField
                    id="interet-organisation"
                    label="Organisation (facultatif)"
                    error={interetFieldErrors.organisation}
                  >
                    <Input
                      id="interet-organisation"
                      value={interetOrganisation}
                      onChange={(e) => setInteretOrganisation(e.target.value)}
                      disabled={interetSubmitting}
                    />
                  </FormField>
                  <FormField id="interet-message" label="Message" required error={interetFieldErrors.message}>
                    <Textarea
                      id="interet-message"
                      rows={4}
                      maxLength={1500}
                      value={interetMessage}
                      onChange={(e) => setInteretMessage(e.target.value)}
                      disabled={interetSubmitting}
                    />
                  </FormField>
                  <div className="flex justify-end gap-3 pt-2">
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={() => setShowInteretModal(false)}
                      disabled={interetSubmitting}
                    >
                      Annuler
                    </Button>
                    <Button type="submit" disabled={interetSubmitting}>
                      {interetSubmitting ? "Envoi…" : "Envoyer"}
                    </Button>
                  </div>
                </form>
              )}
            </div>
          </div>,
          document.body
        )}
    </article>
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
            <p className="mt-4 text-sm font-semibold text-brun">Chargement…</p>
          </div>
        </div>
      }
    >
      <FicheDetailContent params={params} />
    </Suspense>
  );
}
