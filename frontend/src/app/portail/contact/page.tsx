"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  MapPin,
  Phone,
  Mail,
  Clock,
  Link as LinkIcon,
  Users,
  Globe,
  GraduationCap,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { sendContactMessage } from "@/lib/portal-api";

export default function ContactPage() {
  const [nomComplet, setNomComplet] = useState("");
  const [email, setEmail] = useState("");
  const [sujet, setSujet] = useState("");
  const [message, setMessage] = useState("");

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const newErrors: Record<string, string> = {};
    if (!nomComplet.trim()) {
      newErrors.nomComplet = "Veuillez renseigner votre nom complet.";
    }
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      newErrors.email = "Veuillez renseigner une adresse email valide.";
    }
    if (!sujet.trim()) {
      newErrors.sujet = "Veuillez préciser l'objet de votre demande.";
    }
    if (!message.trim() || message.trim().length < 10) {
      newErrors.message = "Votre message doit comporter au moins 10 caractères.";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setSubmitting(true);
    setErrors({});

    try {
      const res = await sendContactMessage({
        nom: nomComplet.trim(),
        email: email.trim(),
        sujet: sujet.trim(),
        message: message.trim(),
      });

      if (res.success) {
        setSuccessMessage(
          res.message ||
            "Votre message a été transmis avec succès à l'équipe du CIAT. Nous vous répondrons sous 48 heures ouvrées."
        );
        setNomComplet("");
        setEmail("");
        setSujet("");
        setMessage("");
      } else if (res.errors) {
        const apiErrors: Record<string, string> = {};
        for (const [key, msgs] of Object.entries(res.errors)) {
          apiErrors[key] = Array.isArray(msgs) ? msgs[0] : String(msgs);
        }
        setErrors(apiErrors);
      } else {
        setErrors({
          form: res.message || "Une erreur est survenue lors de l'envoi de votre message au CIAT.",
        });
      }
    } catch {
      setErrors({
        form: "Le serveur du CIAT est temporairement indisponible. Veuillez réessayer sous peu.",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="bg-[#FAF7F2] min-h-screen text-[#24140D] font-sans antialiased selection:bg-[#C99A68]/30">
      {/* ========================================================= */}
      {/* 1. HERO BANNER CINÉMATIQUE                                */}
      {/* ========================================================= */}
      <section className="relative w-full h-[320px] sm:h-[380px] lg:h-[420px] overflow-hidden bg-[#24140D]">
        <Image
          src="/images/contact/contact-equipe-ciat.jpg"
          alt="Équipe d'accompagnement et accueil du CIAT"
          fill
          priority
          sizes="100vw"
          className="object-cover object-center"
        />

        {/* Dégradé doux conforme à la maquette */}
        <div className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/60 to-black/30 pointer-events-none" />

        {/* Contenu Titre & Sous-titre adapté au CIAT */}
        <div className="relative z-10 h-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col justify-center">
          <div className="inline-flex items-center gap-2 mb-3">
            <span className="h-2 w-2 rounded-full bg-[#C99A68] animate-pulse" />
            <span className="text-xs font-bold tracking-[0.2em] text-[#C99A68] uppercase">
              CENTRE D&apos;INNOVATION & D&apos;ACCÉLÉRATION TECHNOLOGIQUE
            </span>
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-white tracking-tight leading-tight">
            Contactez le CIAT
          </h1>
          <p className="mt-4 text-sm sm:text-base lg:text-lg text-white/90 max-w-2xl font-normal leading-relaxed">
            Nous sommes à votre écoute pour accompagner vos projets d&apos;innovation, vos candidatures
            à l&apos;incubateur, vos besoins de prototypage au FabLab et vos démarches de transfert technologique.
          </p>
        </div>
      </section>

      {/* ========================================================= */}
      {/* 2. SECTION CENTRALE : FORMULAIRE + COORDONNÉES + RÉSEAUX  */}
      {/* ========================================================= */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 pb-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* ------------------------------------------------------- */}
          {/* Colonne Gauche : Formulaire "Envoyez-nous un message"   */}
          {/* ------------------------------------------------------- */}
          <div className="lg:col-span-7 bg-white rounded-2xl p-6 sm:p-10 shadow-xs border border-[#EBE4DC]">
            <h2 className="text-2xl sm:text-3xl font-bold text-[#24140D] mb-6 tracking-tight">
              Envoyez-nous un message
            </h2>

            {/* Notification de succès */}
            {successMessage && (
              <div
                role="status"
                aria-live="polite"
                className="mb-6 flex items-start gap-3 rounded-xl bg-emerald-50 border border-emerald-200 p-4 text-xs text-emerald-900"
              >
                <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="font-bold">Message transmis avec succès</p>
                  <p className="mt-0.5 text-emerald-800">{successMessage}</p>
                </div>
              </div>
            )}

            {/* Erreur générale */}
            {errors.form && (
              <div
                role="alert"
                className="mb-6 flex items-start gap-3 rounded-xl bg-red-50 border border-red-200 p-4 text-xs text-red-900"
              >
                <AlertCircle className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="font-bold">Échec de transmission</p>
                  <p className="mt-0.5 text-red-800">{errors.form}</p>
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} noValidate className="space-y-4">
              {/* Ligne 1 : Nom complet + Email */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label
                    htmlFor="contact-nom"
                    className="block text-xs font-semibold text-[#5A4A40] mb-1.5"
                  >
                    Nom complet
                  </label>
                  <input
                    type="text"
                    id="contact-nom"
                    value={nomComplet}
                    onChange={(e) => setNomComplet(e.target.value)}
                    placeholder="Votre nom complet"
                    disabled={submitting}
                    className="w-full rounded-xl bg-[#F4F4F6] border-none px-4 py-3.5 text-sm text-[#24140D] placeholder:text-[#9C8B7E] focus:outline-none focus:ring-2 focus:ring-[#24140D] transition-all"
                  />
                  {errors.nomComplet && (
                    <p className="mt-1 text-xs text-red-600 font-medium">
                      {errors.nomComplet}
                    </p>
                  )}
                </div>

                <div>
                  <label
                    htmlFor="contact-email"
                    className="block text-xs font-semibold text-[#5A4A40] mb-1.5"
                  >
                    Email
                  </label>
                  <input
                    type="email"
                    id="contact-email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="votre.email@organisation.sn"
                    disabled={submitting}
                    className="w-full rounded-xl bg-[#F4F4F6] border-none px-4 py-3.5 text-sm text-[#24140D] placeholder:text-[#9C8B7E] focus:outline-none focus:ring-2 focus:ring-[#24140D] transition-all"
                  />
                  {errors.email && (
                    <p className="mt-1 text-xs text-red-600 font-medium">
                      {errors.email}
                    </p>
                  )}
                </div>
              </div>

              {/* Ligne 2 : Sujet */}
              <div>
                <label
                  htmlFor="contact-sujet"
                  className="block text-xs font-semibold text-[#5A4A40] mb-1.5"
                >
                  Sujet de la demande
                </label>
                <input
                  type="text"
                  id="contact-sujet"
                  value={sujet}
                  onChange={(e) => setSujet(e.target.value)}
                  placeholder="Incubation, Prototypage FabLab, Partenariat industriel, Visite..."
                  disabled={submitting}
                  className="w-full rounded-xl bg-[#F4F4F6] border-none px-4 py-3.5 text-sm text-[#24140D] placeholder:text-[#9C8B7E] focus:outline-none focus:ring-2 focus:ring-[#24140D] transition-all"
                />
                {errors.sujet && (
                  <p className="mt-1 text-xs text-red-600 font-medium">
                    {errors.sujet}
                  </p>
                )}
              </div>

              {/* Ligne 3 : Message */}
              <div>
                <label
                  htmlFor="contact-message"
                  className="block text-xs font-semibold text-[#5A4A40] mb-1.5"
                >
                  Message
                </label>
                <textarea
                  id="contact-message"
                  rows={5}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Décrivez votre projet, vos besoins technologiques ou vos questions pour l'équipe du CIAT..."
                  disabled={submitting}
                  className="w-full rounded-xl bg-[#F4F4F6] border-none px-4 py-3.5 text-sm text-[#24140D] placeholder:text-[#9C8B7E] focus:outline-none focus:ring-2 focus:ring-[#24140D] transition-all resize-none"
                />
                {errors.message && (
                  <p className="mt-1 text-xs text-red-600 font-medium">
                    {errors.message}
                  </p>
                )}
              </div>

              {/* Bouton Envoyer */}
              <button
                type="submit"
                disabled={submitting}
                className="w-full mt-4 py-4 rounded-xl bg-[#28150C] hover:bg-[#3D2012] text-white font-semibold text-sm transition-all shadow-sm active:scale-[0.99] disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center gap-2 cursor-pointer"
              >
                {submitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin text-white" />
                    Envoi en cours...
                  </>
                ) : (
                  "Envoyer le message au CIAT"
                )}
              </button>
            </form>
          </div>

          {/* ------------------------------------------------------- */}
          {/* Colonne Droite : Coordonnées CIAT + Suivez-nous        */}
          {/* ------------------------------------------------------- */}
          <div className="lg:col-span-5 flex flex-col gap-6">
            {/* Carte Coordonnées CIAT (Fond Brun Foncé) */}
            <div className="bg-[#28150C] rounded-2xl p-6 sm:p-8 text-white shadow-xs">
              <h3 className="text-xl font-bold text-white mb-6 tracking-tight">
                Coordonnées du CIAT
              </h3>

              <div className="space-y-5">
                {/* Adresse */}
                <div className="flex items-start gap-4">
                  <div className="mt-0.5 text-[#E2A669] shrink-0">
                    <MapPin className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-white tracking-wide">
                      Siège & Ateliers Technologiques
                    </p>
                    <p className="text-xs sm:text-sm text-white/80 mt-0.5 leading-snug">
                      Centre d&apos;Innovation et d&apos;Accélération Technologique (CIAT)
                      <br />
                      Campus ISEP Amadou Trawaré · Cité du Savoir, Diamniadio, Sénégal
                    </p>
                  </div>
                </div>

                {/* Téléphone */}
                <div className="flex items-start gap-4">
                  <div className="mt-0.5 text-[#E2A669] shrink-0">
                    <Phone className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-white tracking-wide">
                      Standard Téléphonique
                    </p>
                    <a
                      href="tel:+221338000000"
                      className="text-xs sm:text-sm text-white/80 mt-0.5 hover:text-white transition-colors block"
                    >
                      +221 33 800 00 00
                    </a>
                  </div>
                </div>

                {/* Email */}
                <div className="flex items-start gap-4">
                  <div className="mt-0.5 text-[#E2A669] shrink-0">
                    <Mail className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-white tracking-wide">
                      Courriels Dédiés
                    </p>
                    <a
                      href="mailto:contact@ciat.sn"
                      className="text-xs sm:text-sm text-white/80 mt-0.5 hover:text-white transition-colors block"
                    >
                      Direction : contact@ciat.sn
                    </a>
                    <a
                      href="mailto:incubateur@ciat.sn"
                      className="text-xs sm:text-sm text-white/80 mt-0.5 hover:text-white transition-colors block"
                    >
                      Incubateur : incubateur@ciat.sn
                    </a>
                  </div>
                </div>

                {/* Horaires */}
                <div className="flex items-start gap-4">
                  <div className="mt-0.5 text-[#E2A669] shrink-0">
                    <Clock className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-white tracking-wide">
                      Accueil & Laboratoires
                    </p>
                    <p className="text-xs sm:text-sm text-white/80 mt-0.5 leading-snug">
                      Accueil : Lun &ndash; Ven, 08h &ndash; 17h
                      <br />
                      Espaces Prototypage & FabLab : 24h/7j pour porteurs accrédités
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Carte Écosystème & Réseaux CIAT (Fond Pêche / Ocre Doux) */}
            <div className="bg-[#F8BF88] rounded-2xl p-6 sm:p-8 text-[#24140D] shadow-xs">
              <h3 className="text-xl font-bold text-[#24140D] mb-4 tracking-tight">
                Écosystème CIAT
              </h3>

              {/* 3 boutons réseaux / plateformes CIAT */}
              <div className="flex items-center gap-3">
                <Link
                  href="/portail/ciat"
                  aria-label="Présentation Institutionnelle du CIAT"
                  className="h-12 w-12 rounded-xl bg-[#28150C] hover:bg-[#3D2012] text-white flex items-center justify-center transition-all shadow-xs hover:scale-105"
                >
                  <Globe className="h-5 w-5" />
                </Link>

                <Link
                  href="/portail/incubateur"
                  aria-label="Incubateur et Porteurs de Projets CIAT"
                  className="h-12 w-12 rounded-xl bg-[#28150C] hover:bg-[#3D2012] text-white flex items-center justify-center transition-all shadow-xs hover:scale-105"
                >
                  <Users className="h-5 w-5" />
                </Link>

                <Link
                  href="/galerie"
                  aria-label="Galerie des Prototypes et Innovations CIAT"
                  className="h-12 w-12 rounded-xl bg-[#28150C] hover:bg-[#3D2012] text-white flex items-center justify-center transition-all shadow-xs hover:scale-105"
                >
                  <LinkIcon className="h-5 w-5" />
                </Link>
              </div>

              <p className="text-xs text-[#523318] mt-4 leading-relaxed font-medium">
                Rejoignez la communauté de l&apos;écosystème CIAT pour suivre les cohortes d&apos;incubation,
                les bancs d&apos;essai technologiques et les opportunités de valorisation industrielle.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================= */}
      {/* 3. SECTION CARTE GÉOGRAPHIQUE MINIMALISTE                */}
      {/* ========================================================= */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
        <div className="relative rounded-3xl overflow-hidden aspect-[16/8] sm:aspect-[21/8] shadow-sm border border-[#EBE4DC] bg-[#2E3136]">
          {/* Image de la trame urbaine de Diamniadio */}
          <Image
            src="/images/contact/map-diamniadio.jpg"
            alt="Plan d'accès au CIAT sur le Campus ISEP Diamniadio"
            fill
            sizes="(max-width: 1200px) 100vw, 1200px"
            className="object-cover object-center brightness-95 contrast-105"
          />

          {/* Marqueur central Hub Technologique CIAT (Badge avec Mortier / Diplôme) */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none z-10 flex flex-col items-center">
            <div className="h-12 w-12 rounded-xl bg-[#28150C] text-[#E2A669] flex items-center justify-center shadow-2xl border-2 border-white/80 animate-bounce">
              <GraduationCap className="h-6 w-6" />
            </div>
            <span className="mt-2 rounded-full bg-[#28150C]/90 px-3 py-0.5 text-[10px] font-bold tracking-wider text-white uppercase backdrop-blur-xs shadow-md border border-white/20">
              CIAT Hub
            </span>
          </div>

          {/* Marqueur secondaire sur la droite (Accès TER / Autoroute) */}
          <div className="absolute top-[64%] right-[22%] pointer-events-none z-10">
            <div className="h-5 w-5 rounded-full bg-white text-[#28150C] flex items-center justify-center shadow-lg border border-black/20">
              <span className="h-2 w-2 rounded-full bg-[#28150C]" />
            </div>
          </div>

          {/* Carte Flottante en Bas à Gauche adaptée au CIAT */}
          <div className="absolute bottom-5 left-5 sm:bottom-6 sm:left-6 bg-white rounded-2xl p-5 sm:p-6 shadow-xl max-w-xs sm:max-w-sm border border-white/70 backdrop-blur-xs z-10">
            <div className="flex items-center gap-2 mb-1">
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              <p className="text-xs font-bold text-[#612D10] uppercase tracking-wider">
                Centre d&apos;Innovation
              </p>
            </div>
            <p className="text-base sm:text-lg font-bold text-[#24140D] tracking-tight">
              CIAT Diamniadio
            </p>
            <p className="text-xs text-[#6B5A4E] mt-1 leading-snug">
              Campus ISEP Amadou Trawaré · Cité du Savoir, Diamniadio, Dakar, Sénégal
            </p>
            <Link
              href="https://maps.google.com/?q=ISEP+Amadou+Traware+Diamniadio"
              target="_blank"
              rel="noopener noreferrer"
              className="group inline-flex items-center gap-1.5 text-xs font-bold text-[#28150C] mt-3 hover:text-[#612D10] transition-colors"
            >
              <span>Itinéraire vers le CIAT</span>
              <ArrowRight className="h-3.5 w-3.5 transition-transform duration-200 group-hover:translate-x-1" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
