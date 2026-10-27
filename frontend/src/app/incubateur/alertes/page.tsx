"use client";

import { useId, useMemo, useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { ApiErrorBanner } from "@/components/ui";
import { formatDateFr, getAlertes, suiviErrorMessage, type AlerteJalon, JALON_STATUTS } from "@/lib/incubator";
import {
  Calendar,
  Clock,
  ChevronRight,
  FolderKanban,
  SlidersHorizontal,
  RotateCcw,
  CheckCircle2,
  ListFilter,
} from "lucide-react";

function joursDeRetard(echeance: string): number | null {
  const [year, month, day] = echeance.split("-").map(Number);
  if (!year || !month || !day) return null;
  const dateEcheance = Date.UTC(year, month - 1, day);
  const now = new Date();
  const aujourdHui = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate());
  return Math.max(0, Math.floor((aujourdHui - dateEcheance) / 86_400_000));
}

function libelleRetard(echeance: string): string {
  const jours = joursDeRetard(echeance);
  if (jours === null) return "Retard signalé";
  if (jours === 0) return "Échéance aujourd'hui";
  if (jours === 1) return "1 jour de retard";
  return `${jours} jours de retard`;
}

type FiltreStatut = "toutes" | "a_faire" | "en_cours";
type TriOption = "urgence" | "retard_decroissant" | "projet";

function Alertes() {
  const [alertes, setAlertes] = useState<AlerteJalon[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [filtre, setFiltre] = useState<FiltreStatut>("toutes");
  const [tri, setTri] = useState<TriOption>("urgence");
  const [tick, setTick] = useState(0);

  const triSelectId = useId();

  const load = () => {
    setError(null);
    setAlertes(null);
    setTick((t) => t + 1);
  };

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await getAlertes();
        if (cancelled) return;
        setAlertes(res);
        setError(null);
      } catch (err) {
        if (!cancelled) setError(suiviErrorMessage(err, "Impossible de charger les alertes. Veuillez réessayer."));
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [tick]);

  // Alertes filtrées et triées
  const alertesTraitees = useMemo(() => {
    if (!alertes) return [];
    let list = [...alertes];

    if (filtre === "a_faire") {
      list = list.filter((a) => a.statut === "a_faire");
    } else if (filtre === "en_cours") {
      list = list.filter((a) => a.statut === "en_cours");
    }

    if (tri === "urgence") {
      list.sort((a, b) => new Date(a.echeance).getTime() - new Date(b.echeance).getTime());
    } else if (tri === "retard_decroissant") {
      list.sort((a, b) => {
        const diffA = joursDeRetard(a.echeance) ?? 0;
        const diffB = joursDeRetard(b.echeance) ?? 0;
        return diffB - diffA;
      });
    } else if (tri === "projet") {
      list.sort((a, b) => a.projet_titre.localeCompare(b.projet_titre));
    }

    return list;
  }, [alertes, filtre, tri]);

  const counts = useMemo(() => {
    if (!alertes) return { toutes: 0, a_faire: 0, en_cours: 0 };
    return {
      toutes: alertes.length,
      a_faire: alertes.filter((a) => a.statut === "a_faire").length,
      en_cours: alertes.filter((a) => a.statut === "en_cours").length,
    };
  }, [alertes]);

  return (
    <div className="w-full">
      <div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8 space-y-6 sm:space-y-8">
        {/* Fil d'Ariane harmonisé */}
        <div className="flex items-center gap-1.5 text-xs font-semibold text-[#8C6D58]">
          <Link
            href="/incubateur/projets"
            className="hover:text-[#612D10] hover:underline transition-colors"
          >
            Suivi des projets
          </Link>
          <span className="text-[#C99A68]/60">/</span>
          <span className="text-[#612D10] font-bold">Alertes de retard</span>
        </div>

        {/* 1. EN-TÊTE ÉDITORIAL SOBRE ET ALIGNÉ À GAUCHE (Sans boutons d'onglets ni icône superflue) */}
        <div className="space-y-1.5">
          <h1 className="font-[family-name:var(--font-title)] text-2xl font-extrabold tracking-tight text-[#24140D] sm:text-3xl">
            Alertes de retard
          </h1>
          <p className="text-xs sm:text-sm text-[#6b5646] leading-relaxed max-w-2xl">
            Suivez les jalons dont l&apos;échéance est dépassée et identifiez les actions à réaliser.
          </p>
        </div>

        {/* 2. BANNIÈRE RESPONSIVE (Stack propre en mobile, double vague SVG en desktop) */}
        <div className="overflow-hidden rounded-2xl border border-[#EFE4D6] bg-[#F7EFE6] shadow-sm">
          {/* VERSION MOBILE (< md) : Photo en haut, texte en dessous -> Lisibilité 100% garantie */}
          <div className="md:hidden">
            <div className="relative h-48 w-full overflow-hidden">
              <Image
                src="/images/ciat-alertes-banner.jpg"
                alt="Innovateurs CIAT planifiant les jalons et l'échéancier des projets"
                fill
                priority
                className="object-cover object-center"
              />
            </div>
            <div className="p-6 space-y-2.5 bg-[#F7EFE6]">
              <div className="h-1 w-9 rounded-full bg-[#A35926]" />
              <h2 className="font-[family-name:var(--font-title)] text-xl font-extrabold tracking-tight text-[#24140D]">
                Gardez le rythme de vos projets
              </h2>
              <p className="text-xs text-[#6b5646] leading-relaxed">
                Retrouvez ici les échéances dépassées et les prochaines actions à traiter pour sécuriser la progression de votre innovation.
              </p>
            </div>
          </div>

          {/* VERSION DESKTOP (>= md) : Split horizontal avec courbe SVG organique */}
          <div className="hidden md:block relative min-h-[200px] lg:min-h-[220px]">
            {/* Photo d'immersion collaborative à droite */}
            <div className="absolute inset-y-0 right-0 w-[58%] lg:w-[55%] h-full">
              <Image
                src="/images/ciat-alertes-banner.jpg"
                alt="Innovateurs CIAT planifiant les jalons et l'échéancier des projets"
                fill
                priority
                className="object-cover object-center"
              />
            </div>

            {/* Vagues organiques continues en SVG */}
            <div className="absolute inset-0 pointer-events-none z-10">
              <svg
                viewBox="0 0 1200 400"
                preserveAspectRatio="none"
                className="h-full w-full"
                aria-hidden="true"
              >
                <path
                  d="M 0,0 L 565,0 C 565,80 660,120 660,200 C 660,280 555,320 555,400 L 0,400 Z"
                  fill="#EADBCE"
                  fillOpacity="0.85"
                />
                <path
                  d="M 0,0 L 530,0 C 530,80 625,120 625,200 C 625,280 520,320 520,400 L 0,400 Z"
                  fill="#F7EFE6"
                />
              </svg>
            </div>

            {/* Contenu textuel noble à gauche */}
            <div className="relative z-20 w-[48%] lg:w-[45%] p-6 sm:p-8 lg:p-9 flex flex-col justify-center space-y-2.5">
              <div className="h-1 w-9 rounded-full bg-[#A35926]" />
              <h2 className="font-[family-name:var(--font-title)] text-xl sm:text-2xl font-extrabold tracking-tight text-[#24140D]">
                Gardez le rythme de vos projets
              </h2>
              <p className="text-xs sm:text-sm text-[#6b5646] leading-relaxed max-w-md">
                Retrouvez ici les échéances dépassées et les prochaines actions à traiter pour sécuriser la progression de votre innovation.
              </p>
            </div>
          </div>
        </div>

        {/* 4. CONTRÔLES : FILTRES PAR STATUT ET SÉLECTION DE TRI */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          {/* Filtres d'état */}
          <div className="flex flex-wrap items-center gap-2" role="tablist" aria-label="Filtrer les alertes par statut">
            <button
              type="button"
              role="tab"
              aria-selected={filtre === "toutes"}
              onClick={() => setFiltre("toutes")}
              className={`inline-flex min-h-10 items-center gap-1.5 rounded-xl px-4 text-xs font-bold transition-all ${
                filtre === "toutes"
                  ? "bg-[#612D10] text-white shadow-xs"
                  : "border border-[#EFE4D6] bg-white text-[#612D10] hover:bg-[#FAF4ED] hover:border-[#C99A68]"
              }`}
            >
              <ListFilter className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Toutes</span>
              <span
                className={`ml-1 rounded-full px-1.5 py-0.5 text-[10px] font-extrabold ${
                  filtre === "toutes" ? "bg-white/20 text-white" : "bg-[#FAF4ED] text-[#8C6D4F]"
                }`}
              >
                {counts.toutes}
              </span>
            </button>

            <button
              type="button"
              role="tab"
              aria-selected={filtre === "a_faire"}
              onClick={() => setFiltre("a_faire")}
              className={`inline-flex min-h-10 items-center gap-1.5 rounded-xl px-4 text-xs font-bold transition-all ${
                filtre === "a_faire"
                  ? "bg-[#612D10] text-white shadow-xs"
                  : "border border-[#EFE4D6] bg-white text-[#612D10] hover:bg-[#FAF4ED] hover:border-[#C99A68]"
              }`}
            >
              <Clock className="h-3.5 w-3.5" aria-hidden="true" />
              <span>À faire</span>
              <span
                className={`ml-1 rounded-full px-1.5 py-0.5 text-[10px] font-extrabold ${
                  filtre === "a_faire" ? "bg-white/20 text-white" : "bg-[#FAF4ED] text-[#8C6D4F]"
                }`}
              >
                {counts.a_faire}
              </span>
            </button>

            <button
              type="button"
              role="tab"
              aria-selected={filtre === "en_cours"}
              onClick={() => setFiltre("en_cours")}
              className={`inline-flex min-h-10 items-center gap-1.5 rounded-xl px-4 text-xs font-bold transition-all ${
                filtre === "en_cours"
                  ? "bg-[#612D10] text-white shadow-xs"
                  : "border border-[#EFE4D6] bg-white text-[#612D10] hover:bg-[#FAF4ED] hover:border-[#C99A68]"
              }`}
            >
              <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
              <span>En cours</span>
              <span
                className={`ml-1 rounded-full px-1.5 py-0.5 text-[10px] font-extrabold ${
                  filtre === "en_cours" ? "bg-white/20 text-white" : "bg-[#FAF4ED] text-[#8C6D4F]"
                }`}
              >
                {counts.en_cours}
              </span>
            </button>
          </div>

          {/* Contrôle de tri */}
          <div className="flex items-center gap-2">
            <label htmlFor={triSelectId} className="flex items-center gap-1.5 text-xs font-semibold text-[#8C6D4F]">
              <SlidersHorizontal className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Trier par :</span>
            </label>
            <select
              id={triSelectId}
              value={tri}
              onChange={(e) => setTri(e.target.value as TriOption)}
              className="rounded-xl border border-[#EFE4D6] bg-white px-3.5 py-2 text-xs font-bold text-[#612D10] shadow-2xs hover:border-[#C99A68] focus:border-[#A35926] focus:outline-none focus:ring-2 focus:ring-[#C99A68]/20 transition-all cursor-pointer"
            >
              <option value="urgence">Échéance la plus urgente</option>
              <option value="retard_decroissant">Plus grand retard</option>
              <option value="projet">Nom du projet</option>
            </select>
          </div>
        </div>

        {/* 5. ÉTATS DU CONTENU PRINCIPAL */}
        {error ? (
          <ApiErrorBanner message={error} onRetry={load} />
        ) : !alertes ? (
          <div className="flex justify-center py-20" role="status" aria-label="Chargement des alertes">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-[#C99A68] border-t-[#612D10]" />
          </div>
        ) : alertes.length === 0 ? (
          /* ÉTAT A : AUCUN JALON EN RETARD (Sobre, noble, institutionnel) */
          <div className="rounded-2xl border border-[#EFE4D6] bg-white p-10 sm:p-14 lg:p-16 text-center shadow-xs">
            <div className="mx-auto flex max-w-lg flex-col items-center space-y-4">
              {/* Emblème sobre de conformité (coche dans cercle ivoire, sans émoticône) */}
              <div className="flex h-16 w-16 items-center justify-center rounded-full border border-[#EFE4D6] bg-[#FAF4ED] text-[#612D10] shadow-2xs">
                <CheckCircle2 className="h-8 w-8 text-[#612D10]" strokeWidth={2.2} aria-hidden="true" />
              </div>

              {/* Titre et texte rassurant */}
              <div className="space-y-1.5 pt-1">
                <h3 className="font-[family-name:var(--font-title)] text-xl sm:text-2xl font-bold tracking-tight text-[#24140D]">
                  Aucun jalon en retard
                </h3>
                <p className="text-xs sm:text-sm text-[#6b5646] leading-relaxed max-w-md mx-auto">
                  Tout est à jour pour le moment. Les échéances dépassées apparaîtront ici si une action nécessite votre attention.
                </p>
              </div>

              {/* Bouton de redirection */}
              <div className="pt-3">
                <Link
                  href="/incubateur/projets"
                  className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-[#612D10] bg-white px-6 text-xs font-bold text-[#612D10] shadow-2xs transition-all hover:bg-[#FAF4ED] hover:border-[#3F1D0A]"
                >
                  <FolderKanban className="h-4 w-4" aria-hidden="true" />
                  <span>Consulter mes projets</span>
                </Link>
              </div>
            </div>
          </div>
        ) : alertesTraitees.length === 0 ? (
          /* Aucun résultat pour le filtre actif */
          <div className="rounded-2xl border border-[#EFE4D6] bg-white p-8 sm:p-12 text-center shadow-xs space-y-3">
            <p className="font-[family-name:var(--font-title)] text-base font-bold text-[#24140D]">
              Aucune alerte pour ce filtre
            </p>
            <p className="text-xs text-[#6b5646]">
              Toutes vos alertes actuelles sont dans un autre état.
            </p>
            <button
              type="button"
              onClick={() => setFiltre("toutes")}
              className="inline-flex min-h-10 items-center justify-center rounded-xl bg-[#FAF4ED] px-4 text-xs font-bold text-[#612D10] hover:bg-[#EFE4D6] transition-colors"
            >
              Afficher toutes les alertes ({counts.toutes})
            </button>
          </div>
        ) : (
          /* ÉTAT B : LISTE DES ALERTES AVEC CARTES NOBLES (ZÉRO ROUGE) */
          <div className="space-y-3 sm:space-y-4">
            {alertesTraitees.map((a) => (
              <div
                key={a.id}
                className="group relative overflow-hidden rounded-2xl border border-[#EFE4D6] bg-white p-5 sm:p-6 shadow-xs transition-all hover:border-[#C99A68] hover:shadow-md"
              >
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  {/* Informations du jalon et du projet */}
                  <div className="min-w-0 space-y-2">
                    {/* Badges d'état et de retard (Palette CIAT cuivre / sable, zéro rouge) */}
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="inline-flex items-center gap-1.5 rounded-lg border border-[#EFE4D6] bg-[#FAF4ED] px-2.5 py-1 text-xs font-bold text-[#A35926]">
                        <Clock className="h-3.5 w-3.5 text-[#A35926]" aria-hidden="true" />
                        <span>{libelleRetard(a.echeance)}</span>
                      </span>

                      <span className="inline-flex items-center rounded-lg border border-[#EFE4D6] bg-[#FAF4ED] px-2.5 py-1 text-xs font-medium text-[#612D10]">
                        Projet : {a.projet_titre}
                      </span>

                      <span className="inline-flex items-center rounded-lg border border-[#EFE4D6]/70 bg-[#FAF7F2] px-2.5 py-1 text-xs font-medium text-[#8C6D4F]">
                        {JALON_STATUTS[a.statut] || a.statut}
                      </span>
                    </div>

                    {/* Titre du jalon */}
                    <h3 className="font-[family-name:var(--font-title)] text-base sm:text-lg font-bold text-[#24140D] group-hover:text-[#612D10] transition-colors">
                      {a.titre}
                    </h3>

                    {/* Détails de date d'échéance */}
                    <p className="flex items-center gap-1.5 text-xs text-[#6b5646]">
                      <Calendar className="h-3.5 w-3.5 text-[#8C6D4F]" aria-hidden="true" />
                      <span>Échéance dépassée le</span>
                      <span className="font-semibold text-[#24140D]">{formatDateFr(a.echeance)}</span>
                    </p>
                  </div>

                  {/* Bouton d'action vers le jalon */}
                  <div className="shrink-0 pt-2 sm:pt-0">
                    <Link
                      href={`/incubateur/projets/${a.projet}#jalon-${a.id}`}
                      className="inline-flex min-h-11 w-full sm:w-auto items-center justify-center gap-2 rounded-xl bg-[#612D10] px-5 text-xs font-bold text-white shadow-xs transition-all hover:bg-[#3F1D0A] hover:scale-[1.01]"
                    >
                      <span>Voir le jalon</span>
                      <ChevronRight className="h-4 w-4" aria-hidden="true" />
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default function AlertesPage() {
  return (
    <ProtectedRoute allowedRoles={["porteur", "mentor", "coordonnateur", "administrateur"]}>
      <Alertes />
    </ProtectedRoute>
  );
}

