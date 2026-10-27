"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { MapPin, Phone, Mail, Clock, CheckCircle } from "lucide-react";

export default function Footer() {
  const pathname = usePathname();
  const [email, setEmail] = useState("");
  const [subscribed, setSubscribed] = useState(false);

  const isAuthPage = pathname === "/connexion" || pathname === "/inscription";
  const isAppPage =
    pathname.startsWith("/incubateur") ||
    pathname.startsWith("/compte") ||
    pathname.startsWith("/documents");

  if (isAuthPage || isAppPage) {
    return null;
  }

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (email.trim()) {
      setSubscribed(true);
      setEmail("");
      setTimeout(() => setSubscribed(false), 4000);
    }
  };

  return (
    <footer className="border-t border-[#3d2315] bg-[#1a0e08] text-[#E8D9C8] pb-16 md:pb-10 pt-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* =====================================================================
         * TIER 1 : EN-TÊTE DU FOOTER (MARQUE & NEWSLETTER)
         * ===================================================================== */}
        <div className="grid gap-10 lg:grid-cols-12 lg:items-start pb-12">
          {/* Marque institutionnelle */}
          <div className="lg:col-span-6 space-y-4">
            <Link href="/" className="inline-block">
              <Image
                src="/images/brand/logo_blanc.png"
                alt="CIAT — ISEP Amadou Trawaré de Diamniadio"
                width={160}
                height={58}
                className="h-11 w-auto object-contain"
              />
            </Link>
            <div className="text-[11px] font-bold tracking-widest text-[#C99A68] uppercase">
              Excellence &bull; Innovation &bull; Professionnalisation
            </div>
            <p className="text-xs sm:text-sm leading-relaxed text-[#cbb69e] max-w-xl">
              Institut Supérieur d&apos;Enseignement Professionnel (ISEP) Amadou Trawaré de
              Diamniadio — Le CIAT constitue une infrastructure d&apos;élite dédiée à
              l&apos;ingénierie, au prototypage technologique et à l&apos;incubation de projets
              à fort impact socio-économique au Sénégal.
            </p>

            {/* Réseaux sociaux conformes */}
            <div className="flex items-center gap-2.5 pt-2">
              {/* TikTok */}
              <a
                href="https://tiktok.com"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="TikTok ISEP CIAT"
                className="w-9 h-9 rounded-lg bg-white/[0.04] border border-white/10 hover:border-[#C99A68] hover:text-[#C99A68] flex items-center justify-center text-white/80 transition-colors"
              >
                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                  <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64c.29 0 .57.04.84.11V9.32a6.34 6.34 0 0 0-.84-.06 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.34-6.34V8.75a8.28 8.28 0 0 0 4.84 1.57V6.87c-.36-.04-.72-.1-1.07-.18z" />
                </svg>
              </a>

              {/* YouTube */}
              <a
                href="https://youtube.com"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="YouTube ISEP CIAT"
                className="w-9 h-9 rounded-lg bg-white/[0.04] border border-white/10 hover:border-[#C99A68] hover:text-[#C99A68] flex items-center justify-center text-white/80 transition-colors"
              >
                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                  <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
                </svg>
              </a>

              {/* Facebook */}
              <a
                href="https://facebook.com"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Facebook ISEP CIAT"
                className="w-9 h-9 rounded-lg bg-white/[0.04] border border-white/10 hover:border-[#C99A68] hover:text-[#C99A68] flex items-center justify-center text-white/80 transition-colors"
              >
                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                </svg>
              </a>

              {/* LinkedIn */}
              <a
                href="https://linkedin.com"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="LinkedIn ISEP CIAT"
                className="w-9 h-9 rounded-lg bg-white/[0.04] border border-white/10 hover:border-[#C99A68] hover:text-[#C99A68] flex items-center justify-center text-white/80 transition-colors"
              >
                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                  <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451c.979 0 1.778-.773 1.778-1.729V1.73C24 .774 23.205 0 22.225 0z" />
                </svg>
              </a>
            </div>
          </div>

          {/* Carte Newsletter "Restez informé" */}
          <div className="lg:col-span-6 lg:pl-6">
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 sm:p-7 backdrop-blur-sm">
              <h3 className="text-lg font-extrabold text-white tracking-tight">
                Restez informé
              </h3>
              <p className="mt-1.5 text-xs sm:text-sm text-[#cbb69e] leading-relaxed">
                Inscrivez-vous pour recevoir les dernières actualités, les appels à projets
                et les opportunités d&apos;incubation du CIAT.
              </p>

              <form onSubmit={handleSubscribe} className="mt-4">
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 rounded-xl bg-black/30 border border-white/10 p-1.5 focus-within:border-[#C99A68] transition-colors">
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="votre@email.com"
                    className="w-full bg-transparent px-3 py-2 text-xs text-white placeholder-white/40 focus:outline-none"
                  />
                  <button
                    type="submit"
                    className="inline-flex items-center justify-center rounded-lg bg-[#C99A68] px-5 py-2.5 text-xs font-bold uppercase tracking-wider text-[#1F120A] hover:bg-[#D8AA78] transition-all shrink-0 cursor-pointer"
                  >
                    Rejoindre
                  </button>
                </div>
                {subscribed && (
                  <p className="mt-2 text-xs text-[#22c55e] flex items-center gap-1.5">
                    <CheckCircle size={14} /> Merci ! Vous êtes désormais inscrit à nos actualités.
                  </p>
                )}
              </form>
            </div>
          </div>
        </div>

        {/* =====================================================================
         * TIER 2 : 4 COLONNES DE NAVIGATION INSTITUTIONNELLE CIAT
         * ===================================================================== */}
        <div className="border-t border-[#3d2315] pt-14 pb-12">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-10 justify-items-start lg:justify-items-center">
            {/* Col 1 : Institution */}
            <div className="w-fit text-left">
              <h4 className="mb-5 text-xs font-bold uppercase tracking-widest text-[#C99A68]">
                Institution
              </h4>
              <ul className="space-y-3.5 text-[13px]">
                <li>
                  <Link href="/" className="hover:text-white transition-colors">
                    Accueil
                  </Link>
                </li>
                <li>
                  <Link href="/portail/ciat" className="hover:text-white transition-colors">
                    Le CIAT &amp; Sa Mission
                  </Link>
                </li>
                <li>
                  <Link href="/portail/domaines" className="hover:text-white transition-colors">
                    Filières &amp; Domaines
                  </Link>
                </li>
                <li>
                  <Link href="/portail/actualites" className="hover:text-white transition-colors">
                    Actualités &amp; Agenda
                  </Link>
                </li>
                <li>
                  <Link href="/portail/contact" className="hover:text-white transition-colors">
                    Contact &amp; Accès
                  </Link>
                </li>
              </ul>
            </div>

            {/* Col 2 : Écosystème CIAT */}
            <div className="w-fit text-left">
              <h4 className="mb-5 text-xs font-bold uppercase tracking-widest text-[#C99A68]">
                Écosystème CIAT
              </h4>
              <ul className="space-y-3.5 text-[13px]">
                <li>
                  <Link href="/portail/ciat" className="hover:text-white transition-colors">
                    Portail Institutionnel
                  </Link>
                </li>
                <li>
                  <Link href="/incubateur" className="hover:text-white transition-colors">
                    Gestion Incubateur
                  </Link>
                </li>
                <li>
                  <Link href="/portail/incubateur" className="hover:text-white transition-colors">
                    Parcours en 5 Jalons
                  </Link>
                </li>
                <li>
                  <Link href="/portail/partenaires" className="hover:text-white transition-colors">
                    Partenaires Industriels
                  </Link>
                </li>
                <li>
                  <Link href="/connexion?next=/incubateur" className="hover:text-white transition-colors">
                    Déposer une Candidature
                  </Link>
                </li>
              </ul>
            </div>

            {/* Col 3 : Innovations & Projets */}
            <div className="w-fit text-left">
              <h4 className="mb-5 text-xs font-bold uppercase tracking-widest text-[#C99A68]">
                Innovations
              </h4>
              <ul className="space-y-3.5 text-[13px]">
                <li>
                  <Link href="/galerie" className="hover:text-white transition-colors">
                    Galerie des Innovations
                  </Link>
                </li>
                <li>
                  <Link href="/portail/projets" className="hover:text-white transition-colors">
                    Annuaire des Projets
                  </Link>
                </li>
                <li>
                  <Link href="/galerie" className="hover:text-white transition-colors">
                    Brevets &amp; Prototypes
                  </Link>
                </li>
                <li>
                  <Link href="/portail/domaines" className="hover:text-white transition-colors">
                    Transfert Technologique
                  </Link>
                </li>
                <li>
                  <Link href="/portail/ciat#ateliers" className="hover:text-white transition-colors">
                    Ateliers &amp; FabLab
                  </Link>
                </li>
              </ul>
            </div>

            {/* Col 4 : Outils & Services IA */}
            <div className="w-fit text-left">
              <h4 className="mb-5 text-xs font-bold uppercase tracking-widest text-[#C99A68]">
                Outils &amp; Services
              </h4>
              <ul className="space-y-3.5 text-[13px]">
                <li>
                  <Link href="/assistant" className="hover:text-white transition-colors">
                    Assistant Virtuel IA
                  </Link>
                </li>
                <li>
                  <Link href="/documents" className="hover:text-white transition-colors">
                    Générateur de Documents
                  </Link>
                </li>
                <li>
                  <Link href="/tableau-de-bord" className="hover:text-white transition-colors">
                    Tableau Décisionnel
                  </Link>
                </li>
                <li>
                  <Link href="/portail/documents" className="hover:text-white transition-colors">
                    Espace Téléchargements
                  </Link>
                </li>
                <li>
                  <Link href="/connexion" className="hover:text-white transition-colors">
                    Espace Porteur de Projet
                  </Link>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* =====================================================================
         * TIER 3 : BANDEAU CONTACT & INFORMATIONS PRATIQUES
         * ===================================================================== */}
        <div className="border-t border-[#3d2315] py-8">
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {/* Siège social */}
            <div className="flex items-start gap-3.5">
              <span className="p-2.5 rounded-xl bg-white/[0.04] border border-white/10 text-[#C99A68] shrink-0">
                <MapPin size={18} />
              </span>
              <div className="space-y-0.5">
                <strong className="block text-xs font-bold text-white uppercase tracking-wider">
                  Siège Social
                </strong>
                <span className="block text-xs text-[#cbb69e] leading-snug">
                  Cité du Savoir, Diamniadio, Dakar, Sénégal
                </span>
              </div>
            </div>

            {/* Téléphone */}
            <div className="flex items-start gap-3.5">
              <span className="p-2.5 rounded-xl bg-white/[0.04] border border-white/10 text-[#C99A68] shrink-0">
                <Phone size={18} />
              </span>
              <div className="space-y-0.5">
                <strong className="block text-xs font-bold text-white uppercase tracking-wider">
                  Téléphone
                </strong>
                <span className="block text-xs text-[#cbb69e] leading-snug">
                  +221 33 800 00 00
                </span>
              </div>
            </div>

            {/* Email Support */}
            <div className="flex items-start gap-3.5">
              <span className="p-2.5 rounded-xl bg-white/[0.04] border border-white/10 text-[#C99A68] shrink-0">
                <Mail size={18} />
              </span>
              <div className="space-y-0.5">
                <strong className="block text-xs font-bold text-white uppercase tracking-wider">
                  Email Support
                </strong>
                <span className="block text-xs text-[#cbb69e] leading-snug">
                  contact@ciat.isep-at.sn
                  <br />
                  admission@isep-at.sn
                </span>
              </div>
            </div>

            {/* Horaires */}
            <div className="flex items-start gap-3.5">
              <span className="p-2.5 rounded-xl bg-white/[0.04] border border-white/10 text-[#C99A68] shrink-0">
                <Clock size={18} />
              </span>
              <div className="space-y-0.5">
                <strong className="block text-xs font-bold text-white uppercase tracking-wider">
                  Horaires
                </strong>
                <span className="block text-xs text-[#cbb69e] leading-snug">
                  Accueil : Lun &ndash; Ven, 08h &ndash; 17h
                  <br />
                  Ateliers Prototypage : 24h/7j
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* =====================================================================
         * TIER 4 : COPYRIGHT & LIENS LÉGAUX DE CLÔTURE
         * ===================================================================== */}
        <div className="border-t border-[#3d2315] pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left text-[11px] text-[#a89580]">
          <div>
            <p className="font-semibold text-[#cbb69e]">
              &copy; 2026 ISEP AMADOU TRAWARÉ &mdash; CIAT. TOUS DROITS RÉSERVÉS.
            </p>
            <p className="text-[10px] text-[#8e7a68] uppercase tracking-wider mt-0.5">
              Excellence &amp; Innovation &bull; Écosystème CIAT 360 Diamniadio
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-6 uppercase tracking-wider text-[10px]">
            <Link
              href="/mentions-legales"
              className="hover:text-white transition-colors"
            >
              Mentions Légales
            </Link>
            <Link
              href="/portail"
              className="hover:text-white transition-colors"
            >
              Plan du Site
            </Link>
            <Link
              href="/confidentialite"
              className="hover:text-white transition-colors"
            >
              Politique de Confidentialité
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
