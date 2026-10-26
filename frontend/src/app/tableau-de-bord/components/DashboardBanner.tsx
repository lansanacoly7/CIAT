"use client";

import { useMemo } from "react";
import { Calendar, ChevronRight } from "lucide-react";

/**
 * Emblème officiel du CIAT en pur SVG vectoriel (sans aucune image raster).
 * Contours exacts du logo institutionnel ISEP Diamniadio / CIAT.
 */
function CiatEmblemWatermark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 365 415"
      fill="currentColor"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      {/* Colonne / Pilier droit */}
      <path
        d="M 307 197 L 280 211 L 259 225 L 246 237 L 239 247 L 239 334 L 249 333 L 258 330 L 282 319 L 300 307 L 303 304 L 307 297 Z"
        fillRule="evenodd"
      />
      {/* Colonne / Pilier gauche */}
      <path
        d="M 155 157 L 155 323 L 157 325 L 170 330 L 199 336 L 213 337 L 219 336 L 219 202 L 214 195 L 204 186 L 159 158 Z"
        fillRule="evenodd"
      />
      {/* Tête / Cercle supérieur */}
      <path
        d="M 216 93 L 208 95 L 204 97 L 196 103 L 192 108 L 188 115 L 186 122 L 186 134 L 187 139 L 190 146 L 192 149 L 200 157 L 209 162 L 216 164 L 226 164 L 231 163 L 239 160 L 246 155 L 252 148 L 255 142 L 257 136 L 257 121 L 256 117 L 250 106 L 244 100 L 232 94 L 228 93 Z"
        fillRule="evenodd"
      />
      {/* Arc de cercle supérieur enveloppant */}
      <path
        d="M 250 16 L 176 16 L 136 28 L 102 46 L 71 71 L 45 101 L 28 129 L 12 172 L 7 208 L 10 252 L 33 311 L 54 339 L 86 367 L 150 396 L 216 401 L 265 390 L 316 362 L 349 329 L 319 307 L 291 330 L 251 348 L 223 353 L 176 349 L 142 336 L 112 315 L 86 282 L 74 253 L 69 198 L 79 158 L 100 123 L 127 96 L 162 76 L 200 67 L 249 70 L 295 89 L 326 49 L 304 35 Z"
        fillRule="evenodd"
      />
    </svg>
  );
}

/**
 * Silhouette architecturale moderne du campus CIAT en pur SVG vectoriel.
 * Reproduit la perspective de la façade vitrée et des arbres sous le soleil.
 */
function CampusArchitectureVector({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 600 140"
      preserveAspectRatio="none"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      <defs>
        {/* Dégradé vitrage moderne avec réflexion dorée */}
        <linearGradient id="glassReflection" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#4a3728" stopOpacity="0.45" />
          <stop offset="35%" stopColor="#7a5538" stopOpacity="0.3" />
          <stop offset="70%" stopColor="#d9b691" stopOpacity="0.35" />
          <stop offset="100%" stopColor="#3d2a1c" stopOpacity="0.5" />
        </linearGradient>

        {/* Dégradé façade blanche architectural */}
        <linearGradient id="facadeConcrete" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.85" />
          <stop offset="100%" stopColor="#f4eae0" stopOpacity="0.7" />
        </linearGradient>

        {/* Ombre portée bâtiment */}
        <linearGradient id="fadeLeft" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#fbf7f2" stopOpacity="1" />
          <stop offset="30%" stopColor="#f7f0e6" stopOpacity="0.85" />
          <stop offset="100%" stopColor="#f7f0e6" stopOpacity="0" />
        </linearGradient>
      </defs>

      {/* Bâtiment arrière (bloc aile est) */}
      <polygon
        points="340,15 480,25 480,140 340,140"
        fill="#ecdccb"
        opacity="0.5"
      />
      <line x1="390" y1="20" x2="390" y2="140" stroke="#cbb39d" strokeWidth="1" opacity="0.4" />
      <line x1="435" y1="22" x2="435" y2="140" stroke="#cbb39d" strokeWidth="1" opacity="0.4" />

      {/* Façade principale en perspective (Innovation Hub) */}
      <polygon
        points="140,8 340,15 340,140 140,140"
        fill="url(#facadeConcrete)"
        stroke="#debfa3"
        strokeWidth="1.5"
      />

      {/* Baie vitrée monumentale avec reflets */}
      <polygon
        points="160,20 320,26 320,120 160,120"
        fill="url(#glassReflection)"
        stroke="#b88f6c"
        strokeWidth="1"
      />

      {/* Meneaux verticaux de la baie vitrée */}
      <line x1="185" y1="21" x2="185" y2="120" stroke="#f1dfcc" strokeWidth="1.5" opacity="0.75" />
      <line x1="210" y1="22" x2="210" y2="120" stroke="#f1dfcc" strokeWidth="1.5" opacity="0.75" />
      <line x1="235" y1="23" x2="235" y2="120" stroke="#f1dfcc" strokeWidth="1.5" opacity="0.75" />
      <line x1="260" y1="24" x2="260" y2="120" stroke="#f1dfcc" strokeWidth="1.5" opacity="0.75" />
      <line x1="285" y1="25" x2="285" y2="120" stroke="#f1dfcc" strokeWidth="1.5" opacity="0.75" />
      <line x1="305" y1="25.5" x2="305" y2="120" stroke="#f1dfcc" strokeWidth="1.5" opacity="0.75" />

      {/* Lignes d'étages horizontales */}
      <line x1="160" y1="52" x2="320" y2="58" stroke="#f5ede3" strokeWidth="2" opacity="0.8" />
      <line x1="160" y1="86" x2="320" y2="92" stroke="#f5ede3" strokeWidth="2" opacity="0.8" />

      {/* Cadre architectural en surplomb (Casquette moderne) */}
      <polygon
        points="130,4 350,11 350,22 130,15"
        fill="#ffffff"
        opacity="0.9"
        stroke="#cfb297"
        strokeWidth="1"
      />

      {/* Aile droite (bâtiment contigu) */}
      <polygon
        points="350,20 540,32 540,140 350,140"
        fill="#fdf9f4"
        opacity="0.8"
        stroke="#dec6b0"
        strokeWidth="1"
      />
      {/* Fenêtres aile droite */}
      <rect x="370" y="38" width="40" height="70" fill="url(#glassReflection)" opacity="0.7" rx="2" />
      <rect x="425" y="42" width="40" height="66" fill="url(#glassReflection)" opacity="0.7" rx="2" />
      <rect x="480" y="46" width="40" height="62" fill="url(#glassReflection)" opacity="0.7" rx="2" />

      {/* Arbres & végétation paysagère au pied du bâtiment */}
      <circle cx="215" cy="130" r="24" fill="#694d33" opacity="0.32" />
      <circle cx="240" cy="122" r="28" fill="#543c26" opacity="0.38" />
      <circle cx="270" cy="128" r="22" fill="#75573c" opacity="0.28" />
      <circle cx="345" cy="125" r="26" fill="#583f29" opacity="0.35" />
      <circle cx="370" cy="120" r="30" fill="#4d3521" opacity="0.4" />
      <circle cx="400" cy="128" r="20" fill="#6e5238" opacity="0.3" />

      {/* Troncs discrets */}
      <line x1="240" y1="130" x2="240" y2="140" stroke="#3b2718" strokeWidth="2.5" opacity="0.5" />
      <line x1="370" y1="130" x2="370" y2="140" stroke="#3b2718" strokeWidth="2.5" opacity="0.5" />

      {/* Fondu de transition progressif sur la gauche */}
      <rect x="0" y="0" width="220" height="140" fill="url(#fadeLeft)" />
    </svg>
  );
}

export function DashboardBanner() {
  // Date dynamique ou formatée officielle en français
  const formattedDate = useMemo(() => {
    try {
      const now = new Date();
      const options: Intl.DateTimeFormatOptions = {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
      };
      const formatted = now.toLocaleDateString("fr-FR", options);
      return formatted.charAt(0).toUpperCase() + formatted.slice(1);
    } catch {
      return "Jeudi 30 octobre 2025";
    }
  }, []);

  return (
    <div className="relative overflow-hidden rounded-2xl border border-[#e6d8c6] bg-gradient-to-r from-[#fbf8f4] via-[#f7f0e6] to-[#ebdcc9] shadow-[0_2px_14px_rgba(33,19,13,0.03)] transition-all">
      {/* 
        =======================================================================
        ARRIÈRE-PLAN VECTORIEL PUR (100% CODÉ, AUCUNE IMAGE RASTER)
        - Éclairage solaire ambiant en CSS radial
        - Emblème officiel CIAT filigrane au centre
        - Façade architecturale moderne du campus sur la droite
        - Fondu dégradé pour contraste parfait du texte
        =======================================================================
      */}
      <div className="pointer-events-none absolute inset-0 select-none overflow-hidden" aria-hidden="true">
        {/* 1. Halo lumineux solaire au coin supérieur droit */}
        <div className="absolute -top-12 -right-12 h-64 w-96 rounded-full bg-radial from-amber-100/50 via-amber-200/20 to-transparent blur-2xl" />

        {/* 2. Silhouette architecturale vectorielle du campus sur la droite */}
        <div className="absolute inset-y-0 right-0 w-[55%] min-w-[360px] opacity-75">
          <CampusArchitectureVector className="h-full w-full object-cover object-right" />
        </div>

        {/* 3. Grand emblème CIAT en filigrane au centre / droite */}
        <div className="absolute -bottom-8 left-1/2 -translate-x-12 h-44 w-44 text-[#8a5229] opacity-25 mix-blend-multiply sm:left-[48%] md:h-52 md:w-52">
          <CiatEmblemWatermark className="h-full w-full" />
        </div>

        {/* 4. Dégradé de lisibilité côté gauche */}
        <div className="absolute inset-y-0 left-0 w-2/3 bg-gradient-to-r from-[#fbf8f4] via-[#fbf8f4]/95 to-transparent" />
      </div>

      {/* 
        =======================================================================
        CONTENU AVANT-PLAN (TEXTE + WIDGET DATE)
        =======================================================================
      */}
      <div className="relative z-10 flex min-h-[96px] flex-col justify-between gap-4 p-5 sm:flex-row sm:items-center sm:px-6 lg:px-8">
        {/* Titre et description institutionnelle à gauche */}
        <div className="max-w-xl">
          <span className="block text-xs font-semibold tracking-normal text-[#8c4b24]">
            Bonjour,
          </span>
          <h1 className="text-2xl font-black tracking-tight text-[#1c120c] sm:text-[28px] lg:text-[30px] leading-tight">
            Tableau de bord
          </h1>
          <p className="mt-1 text-xs text-[#594c43] sm:text-[13px]">
            Suivez l&apos;activité du CIAT, gérez vos projets et accédez rapidement à vos outils.
          </p>
        </div>

        {/* Widget Date officiel à droite (Carte blanche flottante) */}
        <div className="flex shrink-0 items-center">
          <div className="group flex items-center gap-3.5 rounded-2xl border border-[#e6d8c6] bg-white/95 px-4 py-2.5 shadow-[0_2px_8px_rgba(33,19,13,0.04)] backdrop-blur-xs transition-all hover:border-[#c99a69] hover:shadow-md">
            {/* Icône Calendrier dans son réceptacle brun doux */}
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#f8f0e5] text-[#602d10] transition-colors group-hover:bg-[#f1e2d0]">
              <Calendar className="h-4 w-4 stroke-[1.75]" />
            </div>

            {/* Date officielle et sous-titre */}
            <div>
              <p className="text-xs font-bold text-[#3b1d0c] sm:text-[13px]">
                {formattedDate}
              </p>
              <p className="text-[11px] text-[#8c7e75]">Bonne journée !</p>
            </div>

            {/* Chevron discret */}
            <ChevronRight className="h-4 w-4 text-[#8c7e75] transition-transform duration-200 group-hover:translate-x-0.5" />
          </div>
        </div>
      </div>
    </div>
  );
}
