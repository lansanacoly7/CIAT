"use client";

import { useEffect, useState, useTransition } from "react";
import Link from "next/link";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import {
  ApiErrorBanner,
  Badge,
  Button,
  ButtonLink,
  Card,
  DemoBanner,
  PageTitle,
} from "@/components/ui";
import { useAuth } from "@/context/AuthContext";
import {
  creerFiche,
  getFichesEnValidation,
  getMesFiches,
  getMesProjets,
  getStatistiquesGallery,
  isDemoMode,
  refuserFiche,
  soumettreFiche,
  validerFiche,
  type CreateFichePayload,
  type FicheInnovation,
  type GalleryStats,
  type MediaItem,
  type ProjetOption,
} from "@/lib/gallery-api";

function getAvancementBadgeTone(avancement: string): "succes" | "alerte" | "info" | "neutre" {
  const norm = avancement.toLowerCase();
  if (norm.includes("déploiement") || norm.includes("deploiement")) return "succes";
  if (norm.includes("pilote")) return "succes";
  if (norm.includes("mvp")) return "alerte";
  if (norm.includes("prototype")) return "info";
  return "neutre";
}

function getStatutBadgeTone(statut: FicheInnovation["statut"]): "succes" | "alerte" | "erreur" | "neutre" {
  switch (statut) {
    case "publie":
      return "succes";
    case "en_validation":
      return "alerte";
    case "refuse":
      return "erreur";
    default:
      return "neutre";
  }
}

function EspaceGestionContent() {
  const { user } = useAuth();
  const [, startTransition] = useTransition();

  const isCoordonnateurOrAdmin =
    user?.role === "coordonnateur" || user?.role === "administrateur";

  // Onglet actif : "mes_fiches", "creer", "validation", "stats"
  const [activeTab, setActiveTab] = useState<"mes_fiches" | "creer" | "validation" | "stats">(
    isCoordonnateurOrAdmin ? "validation" : "mes_fiches"
  );

  // Données Porteur
  const [mesFiches, setMesFiches] = useState<FicheInnovation[]>([]);
  const [mesProjets, setMesProjets] = useState<ProjetOption[]>([]);
  const [loadingMesFiches, setLoadingMesFiches] = useState(true);

  // Formulaire de création
  const [formData, setFormData] = useState({
    projet: 0,
    titre: "",
    probleme: "",
    solution: "",
    equipe: "",
    avancement: "Prototype",
    photoUrl: "",
    demoUrl: "",
    videoUrl: "",
  });
  const [creating, setCreating] = useState(false);
  const [createSuccess, setCreateSuccess] = useState<string | null>(null);

  // Données Coordonnateur / Admin
  const [fichesValidation, setFichesValidation] = useState<FicheInnovation[]>([]);
  const [loadingValidation, setLoadingValidation] = useState(isCoordonnateurOrAdmin);
  const [stats, setStats] = useState<GalleryStats | null>(null);
  const [loadingStats, setLoadingStats] = useState(isCoordonnateurOrAdmin);

  // Notification d'action et erreurs
  const [actionNotice, setActionNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const isDemo = isDemoMode();

  // 1. Charger les fiches et projets du porteur au montage
  useEffect(() => {
    let ignore = false;
    getMesFiches()
      .then((data) => {
        if (!ignore) {
          setMesFiches(data);
          setLoadingMesFiches(false);
        }
      })
      .catch(() => {
        if (!ignore) {
          setError("Impossible de charger vos fiches d'innovation.");
          setLoadingMesFiches(false);
        }
      });

    getMesProjets().then((projets) => {
      if (!ignore) {
        setMesProjets(projets);
        if (projets.length > 0 && formData.projet === 0) {
          setFormData((prev) => ({ ...prev, projet: projets[0].id }));
        }
      }
    });

    return () => {
      ignore = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 2. Charger les fiches en validation et les statistiques si coordonnateur/admin
  useEffect(() => {
    if (!isCoordonnateurOrAdmin) return;

    let ignore = false;
    getFichesEnValidation()
      .then((data) => {
        if (!ignore) {
          setFichesValidation(data);
          setLoadingValidation(false);
        }
      })
      .catch(() => {
        if (!ignore) setLoadingValidation(false);
      });

    getStatistiquesGallery()
      .then((data) => {
        if (!ignore) {
          setStats(data);
          setLoadingStats(false);
        }
      })
      .catch(() => {
        if (!ignore) setLoadingStats(false);
      });

    return () => {
      ignore = true;
    };
  }, [isCoordonnateurOrAdmin]);

  // Actions de workflow
  const handleSoumettre = async (id: number) => {
    try {
      setError(null);
      const updated = await soumettreFiche(id);
      setMesFiches((prev) => prev.map((f) => (f.id === id ? updated : f)));
      setActionNotice("La fiche a été soumise au coordonnateur pour validation.");
      setTimeout(() => setActionNotice(null), 4000);
    } catch {
      setError("Erreur lors de la soumission de la fiche.");
    }
  };

  const handleValider = async (id: number) => {
    try {
      setError(null);
      await validerFiche(id);
      setFichesValidation((prev) => prev.filter((f) => f.id !== id));
      setActionNotice("Fiche validée et publiée avec succès ! Elle apparaît désormais dans la galerie publique.");
      setTimeout(() => setActionNotice(null), 4000);
    } catch {
      setError("Erreur lors de la validation de la fiche.");
    }
  };

  const handleRefuser = async (id: number) => {
    try {
      setError(null);
      await refuserFiche(id);
      setFichesValidation((prev) => prev.filter((f) => f.id !== id));
      setActionNotice("Fiche refusée. Le porteur a été notifié pour révision.");
      setTimeout(() => setActionNotice(null), 4000);
    } catch {
      setError("Erreur lors du refus de la fiche.");
    }
  };

  // Soumission du formulaire de création de fiche
  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.projet) {
      setError("Veuillez sélectionner un projet associé à cette fiche.");
      return;
    }

    setCreating(true);
    setError(null);
    setCreateSuccess(null);

    const medias: MediaItem[] = [];
    if (formData.photoUrl.trim()) {
      medias.push({ type: "photo", url: formData.photoUrl.trim() });
    }
    if (formData.demoUrl.trim()) {
      medias.push({ type: "demo", url: formData.demoUrl.trim() });
    }
    if (formData.videoUrl.trim()) {
      medias.push({ type: "video", url: formData.videoUrl.trim() });
    }

    const payload: CreateFichePayload = {
      projet: Number(formData.projet),
      titre: formData.titre.trim(),
      probleme: formData.probleme.trim(),
      solution: formData.solution.trim(),
      equipe: formData.equipe.trim(),
      avancement: formData.avancement,
      medias,
    };

    try {
      const nouvelleFiche = await creerFiche(payload);
      setMesFiches((prev) => [nouvelleFiche, ...prev]);
      setCreateSuccess("Votre fiche a été créée avec succès au statut 'Brouillon'. Vous pouvez maintenant la relire et la soumettre.");
      setFormData({
        projet: mesProjets[0]?.id || 0,
        titre: "",
        probleme: "",
        solution: "",
        equipe: "",
        avancement: "Prototype",
        photoUrl: "",
        demoUrl: "",
        videoUrl: "",
      });
      setTimeout(() => {
        setActiveTab("mes_fiches");
        setCreateSuccess(null);
      }, 2500);
    } catch {
      setError("Erreur lors de la création de la fiche. Assurez-vous que vous êtes bien le porteur de ce projet.");
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="bg-[#FAF8F5] min-h-screen py-10">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        {/* Fil d'ariane */}
        <nav aria-label="Fil d'ariane" className="mb-6 flex items-center gap-2 text-xs text-texte-doux">
          <Link href="/" className="hover:text-brun transition">Accueil</Link>
          <span>/</span>
          <Link href="/galerie" className="hover:text-brun transition">Galerie des innovations</Link>
          <span>/</span>
          <span className="font-semibold text-brun">Espace Gestion & Workflow</span>
        </nav>

        {isDemo && <DemoBanner className="mb-6" />}

        <PageTitle
          tag="Espace Professionnel CIAT"
          title="Gestion & Validation de la Galerie"
          subtitle="Gérez le cycle de vie de vos fiches d'innovation : création par les porteurs, instruction par le comité et publication officielle sur la vitrine technologique."
        />

        {/* Notifications & Alertes */}
        {actionNotice && (
          <div className="mb-6 rounded-xl border border-succes/40 bg-[#e3f1e9] p-4 text-sm font-semibold text-succes shadow-xs flex items-center gap-2.5">
            <span className="h-2 w-2 rounded-full bg-succes" />
            {actionNotice}
          </div>
        )}

        {error && (
          <ApiErrorBanner message={error} onRetry={() => setError(null)} className="mb-6" />
        )}

        {/* Barre d'onglets de navigation */}
        <div className="mb-8 flex flex-wrap gap-2 border-b border-bordure/60 pb-4">
          <button
            type="button"
            onClick={() => {
              startTransition(() => setActiveTab("mes_fiches"));
            }}
            className={`min-h-[44px] rounded-lg px-4 py-2 text-xs font-bold transition ${
              activeTab === "mes_fiches"
                ? "bg-brun text-white shadow-xs"
                : "bg-white text-brun hover:bg-ivoire border border-bordure"
            }`}
          >
            Mes fiches ({mesFiches.length})
          </button>

          <button
            type="button"
            onClick={() => {
              startTransition(() => setActiveTab("creer"));
            }}
            className={`min-h-[44px] rounded-lg px-4 py-2 text-xs font-bold transition ${
              activeTab === "creer"
                ? "bg-brun text-white shadow-xs"
                : "bg-white text-brun hover:bg-ivoire border border-bordure"
            }`}
          >
            + Créer une fiche d&apos;innovation
          </button>

          {isCoordonnateurOrAdmin && (
            <>
              <button
                type="button"
                onClick={() => {
                  startTransition(() => setActiveTab("validation"));
                }}
                className={`min-h-[44px] rounded-lg px-4 py-2 text-xs font-bold transition ${
                  activeTab === "validation"
                    ? "bg-beige text-brun-fonce font-bold shadow-xs border border-[#b88755]"
                    : "bg-white text-brun hover:bg-ivoire border border-bordure"
                }`}
              >
                Fiches en validation ({fichesValidation.length})
              </button>

              <button
                type="button"
                onClick={() => {
                  startTransition(() => setActiveTab("stats"));
                }}
                className={`min-h-[44px] rounded-lg px-4 py-2 text-xs font-bold transition ${
                  activeTab === "stats"
                    ? "bg-brun text-white shadow-xs"
                    : "bg-white text-brun hover:bg-ivoire border border-bordure"
                }`}
              >
                Statistiques de consultation
              </button>
            </>
          )}

          <div className="ml-auto flex items-center">
            <ButtonLink href="/galerie" variant="secondary" className="!min-h-[44px] text-xs">
              ← Retour à la galerie publique
            </ButtonLink>
          </div>
        </div>

        {/* 1. Onglet : Mes Fiches (Porteur) */}
        {activeTab === "mes_fiches" && (
          <section aria-label="Mes fiches d'innovation" className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-brun">Fiches d&apos;innovation de vos projets</h2>
                <p className="text-xs text-texte-doux">
                  Suivez le statut de validation de vos fiches avant leur mise en ligne publique.
                </p>
              </div>
              <Button
                variant="primary"
                onClick={() => setActiveTab("creer")}
                className="text-xs"
              >
                + Nouvelle fiche
              </Button>
            </div>

            {loadingMesFiches && (
              <div className="space-y-4">
                {[1, 2].map((i) => (
                  <div key={i} className="h-32 w-full animate-pulse rounded-2xl bg-white border border-bordure" />
                ))}
              </div>
            )}

            {!loadingMesFiches && mesFiches.length === 0 && (
              <div className="rounded-2xl border border-dashed border-bordure bg-white p-12 text-center shadow-xs">
                <p className="text-sm font-semibold text-brun">Vous n&apos;avez encore créé aucune fiche d&apos;innovation.</p>
                <p className="mt-1 text-xs text-texte-doux">
                  Présentez les avancées technologiques de votre projet et publiez votre QR Code officiel.
                </p>
                <Button onClick={() => setActiveTab("creer")} variant="primary" className="mt-4 text-xs">
                  Créer ma première fiche
                </Button>
              </div>
            )}

            {!loadingMesFiches && mesFiches.length > 0 && (
              <div className="space-y-4">
                {mesFiches.map((fiche) => (
                  <article
                    key={fiche.id}
                    className="flex flex-col justify-between rounded-2xl border border-bordure bg-white p-6 shadow-xs sm:flex-row sm:items-center gap-4"
                  >
                    <div className="space-y-2 max-w-2xl">
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge tone={getStatutBadgeTone(fiche.statut)}>
                          {fiche.statut === "publie"
                            ? "Publié en ligne"
                            : fiche.statut === "en_validation"
                            ? "En cours de validation"
                            : fiche.statut === "refuse"
                            ? "À réviser (Refusé)"
                            : "Brouillon"}
                        </Badge>
                        <Badge tone={getAvancementBadgeTone(fiche.avancement)}>
                          {fiche.avancement}
                        </Badge>
                        <span className="text-xs text-texte-doux font-mono">
                          Projet #{fiche.projet} · {fiche.vues} vues
                        </span>
                      </div>

                      <h3 className="text-base font-bold text-brun">
                        {fiche.titre}
                      </h3>
                      <p className="line-clamp-2 text-xs text-texte-doux leading-relaxed">
                        {fiche.probleme}
                      </p>
                    </div>

                    {/* Actions de workflow */}
                    <div className="flex shrink-0 flex-wrap items-center gap-2">
                      {(fiche.statut === "brouillon" || fiche.statut === "refuse") && (
                        <Button
                          variant="primary"
                          onClick={() => handleSoumettre(fiche.id)}
                          className="!min-h-[44px] text-xs font-bold"
                        >
                          Soumettre pour validation →
                        </Button>
                      )}

                      {fiche.statut === "publie" && (
                        <ButtonLink
                          href={`/galerie/${fiche.slug}`}
                          variant="secondary"
                          className="!min-h-[44px] text-xs font-bold"
                        >
                          Voir la fiche & QR Code ↗
                        </ButtonLink>
                      )}

                      {fiche.statut === "en_validation" && (
                        <span className="text-xs font-semibold text-alerte bg-[#f8ebd3] px-3 py-1.5 rounded-lg border border-[#edd5ab]">
                          En attente d&apos;arbitrage du coordonnateur
                        </span>
                      )}
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>
        )}

        {/* 2. Onglet : Création de Fiche (Porteur) */}
        {activeTab === "creer" && (
          <section aria-label="Créer une fiche d'innovation" className="max-w-3xl mx-auto rounded-2xl border border-bordure bg-white p-6 sm:p-8 shadow-xs">
            <h2 className="text-xl font-bold text-brun">Nouvelle Fiche d&apos;Innovation</h2>
            <p className="mt-1 text-xs text-texte-doux">
              Renseignez les détails vérifiés de votre prototype. La fiche sera enregistrée comme brouillon avant soumission.
            </p>

            {createSuccess && (
              <div className="mt-4 rounded-xl border border-succes/40 bg-[#e3f1e9] p-4 text-xs font-semibold text-succes">
                {createSuccess}
              </div>
            )}

            <form onSubmit={handleCreateSubmit} className="mt-6 space-y-5">
              {/* Projet rattaché */}
              <div>
                <label htmlFor="select-projet" className="mb-1 block text-xs font-bold uppercase tracking-wider text-texte-doux">
                  Projet incubé associé *
                </label>
                <select
                  id="select-projet"
                  required
                  value={formData.projet}
                  onChange={(e) => setFormData({ ...formData, projet: Number(e.target.value) })}
                  className="w-full min-h-[44px] rounded-lg border border-bordure bg-white px-3 py-2 text-sm text-brun focus:border-beige focus:outline-none focus:ring-1 focus:ring-beige"
                >
                  <option value={0}>Sélectionnez un projet...</option>
                  {mesProjets.map((p) => (
                    <option key={p.id} value={p.id}>
                      Projet #{p.id} — {p.titre} ({p.statut})
                    </option>
                  ))}
                </select>
                {mesProjets.length === 0 && (
                  <p className="mt-1 text-[11px] text-texte-doux italic">
                    Aucun projet rattaché détecté. Vous pouvez tester en saisissant l&apos;ID d&apos;un projet valide de la base.
                  </p>
                )}
              </div>

              {/* Titre */}
              <div>
                <label htmlFor="input-titre" className="mb-1 block text-xs font-bold uppercase tracking-wider text-texte-doux">
                  Titre public de la fiche d&apos;innovation *
                </label>
                <input
                  id="input-titre"
                  type="text"
                  required
                  value={formData.titre}
                  onChange={(e) => setFormData({ ...formData, titre: e.target.value })}
                  placeholder="Ex : AgriSol — Pompes Solaires Connectées & Micro-Irrigation"
                  className="w-full min-h-[44px] rounded-lg border border-bordure bg-white px-4 py-2.5 text-sm text-brun focus:border-beige focus:outline-none focus:ring-1 focus:ring-beige"
                />
              </div>

              {/* Problème */}
              <div>
                <label htmlFor="textarea-probleme" className="mb-1 block text-xs font-bold uppercase tracking-wider text-texte-doux">
                  Problème identifié sur le terrain *
                </label>
                <textarea
                  id="textarea-probleme"
                  required
                  rows={3}
                  value={formData.probleme}
                  onChange={(e) => setFormData({ ...formData, probleme: e.target.value })}
                  placeholder="Décrivez les difficultés concrètes rencontrées par les usagers ou entreprises..."
                  className="w-full rounded-lg border border-bordure bg-white p-3 text-sm text-brun focus:border-beige focus:outline-none focus:ring-1 focus:ring-beige"
                />
              </div>

              {/* Solution */}
              <div>
                <label htmlFor="textarea-solution" className="mb-1 block text-xs font-bold uppercase tracking-wider text-texte-doux">
                  Solution technologique apportée *
                </label>
                <textarea
                  id="textarea-solution"
                  required
                  rows={3}
                  value={formData.solution}
                  onChange={(e) => setFormData({ ...formData, solution: e.target.value })}
                  placeholder="Expliquez votre apport technologique, prototype, composants ou logiciels développés..."
                  className="w-full rounded-lg border border-bordure bg-white p-3 text-sm text-brun focus:border-beige focus:outline-none focus:ring-1 focus:ring-beige"
                />
              </div>

              {/* Équipe */}
              <div>
                <label htmlFor="input-equipe" className="mb-1 block text-xs font-bold uppercase tracking-wider text-texte-doux">
                  Présentation de l&apos;équipe & expertises * (sans numéro personnel)
                </label>
                <input
                  id="input-equipe"
                  type="text"
                  required
                  value={formData.equipe}
                  onChange={(e) => setFormData({ ...formData, equipe: e.target.value })}
                  placeholder="Ex : Aminata Diallo (Ingénieure Agronome), Cheikh Ndiaye (IoT)"
                  className="w-full min-h-[44px] rounded-lg border border-bordure bg-white px-4 py-2.5 text-sm text-brun focus:border-beige focus:outline-none focus:ring-1 focus:ring-beige"
                />
              </div>

              {/* Avancement */}
              <div>
                <label htmlFor="select-avancement" className="mb-1 block text-xs font-bold uppercase tracking-wider text-texte-doux">
                  Niveau d&apos;avancement actuel *
                </label>
                <select
                  id="select-avancement"
                  value={formData.avancement}
                  onChange={(e) => setFormData({ ...formData, avancement: e.target.value })}
                  className="w-full min-h-[44px] rounded-lg border border-bordure bg-white px-3 py-2 text-sm text-brun focus:border-beige focus:outline-none focus:ring-1 focus:ring-beige"
                >
                  <option value="Prototype">Prototype</option>
                  <option value="MVP">MVP (Produit Minimum Viable)</option>
                  <option value="Pilote">Pilote / Phase test</option>
                  <option value="Déploiement">Déploiement / Échelle</option>
                </select>
              </div>

              {/* Liens Médias optionnels */}
              <div className="border-t border-bordure/60 pt-4 space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-brun">
                  Médias & Démonstrations (optionnel)
                </h3>
                <div>
                  <label htmlFor="input-photo" className="block text-xs text-texte-doux mb-1">
                    URL d&apos;une photo représentative
                  </label>
                  <input
                    id="input-photo"
                    type="url"
                    value={formData.photoUrl}
                    onChange={(e) => setFormData({ ...formData, photoUrl: e.target.value })}
                    placeholder="https://..."
                    className="w-full min-h-[44px] rounded-lg border border-bordure bg-white px-3 py-2 text-xs text-brun focus:border-beige focus:outline-none"
                  />
                </div>
                <div>
                  <label htmlFor="input-demo" className="block text-xs text-texte-doux mb-1">
                    URL de la démonstration en direct (Web/App)
                  </label>
                  <input
                    id="input-demo"
                    type="url"
                    value={formData.demoUrl}
                    onChange={(e) => setFormData({ ...formData, demoUrl: e.target.value })}
                    placeholder="https://demo..."
                    className="w-full min-h-[44px] rounded-lg border border-bordure bg-white px-3 py-2 text-xs text-brun focus:border-beige focus:outline-none"
                  />
                </div>
                <div>
                  <label htmlFor="input-video" className="block text-xs text-texte-doux mb-1">
                    URL de la vidéo de présentation (YouTube/Vimeo)
                  </label>
                  <input
                    id="input-video"
                    type="url"
                    value={formData.videoUrl}
                    onChange={(e) => setFormData({ ...formData, videoUrl: e.target.value })}
                    placeholder="https://..."
                    className="w-full min-h-[44px] rounded-lg border border-bordure bg-white px-3 py-2 text-xs text-brun focus:border-beige focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-bordure/60">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => setActiveTab("mes_fiches")}
                  className="text-xs"
                >
                  Annuler
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  disabled={creating}
                  className="text-xs font-bold"
                >
                  {creating ? "Enregistrement..." : "Créer la fiche (Brouillon)"}
                </Button>
              </div>
            </form>
          </section>
        )}

        {/* 3. Onglet : Fiches en Validation (Coordonnateur / Admin) */}
        {activeTab === "validation" && isCoordonnateurOrAdmin && (
          <section aria-label="Validation des fiches" className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-brun">Fiches soumises en attente d&apos;arbitrage</h2>
                <p className="text-xs text-texte-doux">
                  En tant que membre de l&apos;équipe CIAT, examinez les fiches soumises par les porteurs. Une fiche validée est immédiatement mise en ligne dans la galerie publique avec son QR Code.
                </p>
              </div>
            </div>

            {loadingValidation && (
              <div className="space-y-4">
                {[1, 2].map((i) => (
                  <div key={i} className="h-44 w-full animate-pulse rounded-2xl bg-white border border-bordure" />
                ))}
              </div>
            )}

            {!loadingValidation && fichesValidation.length === 0 && (
              <div className="rounded-2xl border border-dashed border-bordure bg-white p-12 text-center shadow-xs">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-succes/10 text-succes">
                  ✓
                </div>
                <h3 className="mt-3 text-base font-bold text-brun">Toutes les fiches sont traitées</h3>
                <p className="mt-1 text-xs text-texte-doux">
                  Aucune fiche d&apos;innovation n&apos;est actuellement en attente de validation.
                </p>
              </div>
            )}

            {!loadingValidation && fichesValidation.length > 0 && (
              <div className="space-y-6">
                {fichesValidation.map((fiche) => (
                  <Card key={fiche.id}>
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-bordure/60 pb-3 mb-4">
                      <div className="flex items-center gap-2">
                        <Badge tone="alerte">En validation</Badge>
                        <Badge tone={getAvancementBadgeTone(fiche.avancement)}>
                          {fiche.avancement}
                        </Badge>
                        <span className="text-xs font-mono text-texte-doux">
                          Réf. #{fiche.id} · Projet #{fiche.projet}
                        </span>
                      </div>
                    </div>

                    <h3 className="text-lg font-bold text-brun">{fiche.titre}</h3>

                    <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-2 text-xs text-texte-doux">
                      <div>
                        <strong className="block text-brun font-semibold mb-1">Problème terrain :</strong>
                        <p className="line-clamp-3 leading-relaxed">{fiche.probleme}</p>
                      </div>
                      <div>
                        <strong className="block text-brun font-semibold mb-1">Solution innovante :</strong>
                        <p className="line-clamp-3 leading-relaxed">{fiche.solution}</p>
                      </div>
                    </div>

                    <div className="mt-3 text-xs text-texte-doux">
                      <strong className="text-brun font-semibold">Équipe :</strong> {fiche.equipe}
                    </div>

                    <div className="mt-6 flex flex-wrap items-center justify-end gap-3 border-t border-bordure/60 pt-4">
                      <Button
                        variant="secondary"
                        onClick={() => handleRefuser(fiche.id)}
                        className="text-xs text-erreur border-erreur/40 hover:bg-[#f6dedc]"
                      >
                        Refuser (retour au porteur)
                      </Button>
                      <Button
                        variant="primary"
                        onClick={() => handleValider(fiche.id)}
                        className="text-xs font-bold"
                      >
                        ✓ Valider et Publier dans la Galerie
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </section>
        )}

        {/* 4. Onglet : Statistiques (Équipe CIAT) */}
        {activeTab === "stats" && isCoordonnateurOrAdmin && (
          <section aria-label="Statistiques de la galerie" className="space-y-6">
            <div>
              <h2 className="text-xl font-bold text-brun">Indicateurs de Consultation de la Galerie</h2>
              <p className="text-xs text-texte-doux">
                Données certifiées issues de l&apos;API <code className="font-mono text-brun">/api/gallery/statistiques/</code>.
              </p>
            </div>

            {loadingStats && (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-28 animate-pulse rounded-2xl bg-white border border-bordure" />
                ))}
              </div>
            )}

            {!loadingStats && stats && (
              <>
                {/* Carte Chiffre Clé */}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                  <div className="rounded-2xl border border-bordure bg-white p-6 shadow-xs">
                    <span className="text-xs font-bold uppercase tracking-wider text-texte-doux">
                      Total des Consultations
                    </span>
                    <p className="mt-2 text-4xl font-black text-brun">
                      {stats.total_vues}
                    </p>
                    <span className="mt-1 text-[11px] text-succes font-semibold">
                      Comptabilisées atomiquement
                    </span>
                  </div>

                  <div className="rounded-2xl border border-bordure bg-white p-6 shadow-xs">
                    <span className="text-xs font-bold uppercase tracking-wider text-texte-doux">
                      Fiches Référencées
                    </span>
                    <p className="mt-2 text-4xl font-black text-brun">
                      {stats.par_fiche.length}
                    </p>
                    <span className="mt-1 text-[11px] text-texte-doux">
                      En base de données
                    </span>
                  </div>

                  <div className="rounded-2xl border border-bordure bg-white p-6 shadow-xs">
                    <span className="text-xs font-bold uppercase tracking-wider text-texte-doux">
                      Innovation la plus vue
                    </span>
                    <p className="mt-2 line-clamp-1 text-base font-bold text-brun">
                      {stats.par_fiche[0]?.titre || "N/A"}
                    </p>
                    <span className="mt-1 text-xs text-beige font-bold">
                      {stats.par_fiche[0]?.vues || 0} vues
                    </span>
                  </div>
                </div>

                {/* Tableau de classement des fiches */}
                <div className="overflow-hidden rounded-2xl border border-bordure bg-white shadow-xs">
                  <div className="border-b border-bordure/60 p-4 font-bold text-sm text-brun">
                    Classement des fiches par nombre de consultations
                  </div>
                  <table className="w-full text-left text-xs">
                    <thead className="bg-ivoire text-texte-doux uppercase font-bold text-[10px] tracking-wider">
                      <tr>
                        <th className="p-3">#</th>
                        <th className="p-3">Titre de la Fiche</th>
                        <th className="p-3">Identifiant Slug</th>
                        <th className="p-3 text-right">Consultations</th>
                        <th className="p-3 text-right">Lien</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-bordure/60">
                      {stats.par_fiche.map((item, idx) => (
                        <tr key={item.slug} className="hover:bg-[#FAF8F5]">
                          <td className="p-3 font-bold text-brun">{idx + 1}</td>
                          <td className="p-3 font-semibold text-brun">{item.titre}</td>
                          <td className="p-3 font-mono text-texte-doux">{item.slug}</td>
                          <td className="p-3 text-right font-black text-brun">{item.vues}</td>
                          <td className="p-3 text-right">
                            <Link
                              href={`/galerie/${item.slug}`}
                              className="font-bold text-beige hover:underline"
                            >
                              Voir ↗
                            </Link>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </section>
        )}
      </div>
    </div>
  );
}

export default function GalerieGestionPage() {
  return (
    <ProtectedRoute>
      <EspaceGestionContent />
    </ProtectedRoute>
  );
}
