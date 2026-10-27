"use client";

import { useState } from "react";
import Image from "next/image";
import {
  ArrowRight,
  Clock,
  Lock,
  Mail,
  MapPin,
  Phone,
  Maximize2,
  Plus,
  Minus,
  Crosshair,
} from "lucide-react";
import { sendContactMessage } from "@/lib/portal-api";

const SUJETS_OPTIONS = [
  { value: "", label: "Sélectionnez un sujet" },
  { value: "candidature", label: "Candidature & Intégration de l'incubateur" },
  { value: "partenariat", label: "Partenariat institutionnel ou industriel" },
  { value: "prototypage", label: "Accès aux laboratoires & bancs d'essai" },
  { value: "mentorat", label: "Proposition de mentorat technique ou métier" },
  { value: "autre", label: "Autre demande d'information" },
];

export default function ContactPage() {
  const [prenom, setPrenom] = useState("");
  const [nom, setNom] = useState("");
  const [email, setEmail] = useState("");
  const [telephone, setTelephone] = useState("");
  const [sujet, setSujet] = useState("");
  const [message, setMessage] = useState("");

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const newErrors: Record<string, string> = {};
    if (!nom.trim()) newErrors.nom = "Le nom est obligatoire.";
    if (!prenom.trim()) newErrors.prenom = "Le prénom est obligatoire.";
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      newErrors.email = "Une adresse email valide est obligatoire.";
    }
    if (!sujet) newErrors.sujet = "Veuillez sélectionner un sujet.";
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
        nom: `${prenom.trim()} ${nom.trim()}`,
        email: email.trim(),
        telephone: telephone.trim() || undefined,
        sujet,
        message: message.trim(),
      });

      if (res.success) {
        setSuccessMessage(res.message);
        setPrenom("");
        setNom("");
        setEmail("");
        setTelephone("");
        setSujet("");
        setMessage("");
      } else if (res.errors) {
        const apiErrors: Record<string, string> = {};
        for (const [key, msgs] of Object.entries(res.errors)) {
          apiErrors[key] = msgs[0];
        }
        setErrors(apiErrors);
      } else {
        setErrors({ form: res.message || "Une erreur est survenue lors de l'envoi." });
      }
    } catch {
      setErrors({ form: "Une erreur est survenue lors de l'envoi. Veuillez réessayer." });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="bg-[#FAF7F2] text-[#24140D] min-h-screen">
      {/* =====================================================================
       * 1. HERO ÉPURÉ : UNE ÉQUIPE À VOTRE ÉCOUTE
       * Fidèle à la maquette : Titre fort, phrase manuscrite et arche architecturale
       * ===================================================================== */}
      <section className="relative overflow-hidden pt-12 pb-14 md:pt-16 md:pb-20 border-b border-[#EFE4D6]">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid items-center gap-10 lg:grid-cols-12 lg:gap-12">
            {/* Colonne Gauche : Titre et textes */}
            <div className="lg:col-span-7 space-y-5">
              <div className="flex items-center gap-3">
                <span className="text-xs font-bold uppercase tracking-[0.25em] text-[#A35926]">
                  CONTACT
                </span>
                <span className="h-[1.5px] w-12 bg-[#A35926]/70" />
              </div>

              <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-[52px] font-extrabold text-[#24140D] tracking-tight leading-[1.12]">
                Une équipe
                <br />
                à votre écoute,
                <br />
                au service de
                <br />
                <span className="text-[#A35926]">vos projets.</span>
              </h1>

              <p className="text-sm sm:text-base leading-relaxed text-[#6B5646] max-w-lg font-normal">
                Vous avez une question, une idée, un projet ou souhaitez simplement échanger avec notre
                équipe ? Le CIAT est à votre disposition. Contactez-nous, nous vous répondrons dans les
                meilleurs délais.
              </p>

              {/* Phrase manuscrite en accent ocre/terracotta */}
              <div className="pt-2">
                <span className="font-serif italic text-lg sm:text-xl text-[#A35926] tracking-wide block">
                  Ensemble, faisons émerger vos idées
                </span>
              </div>
            </div>

            {/* Colonne Droite : Devise & Arche architecturale */}
            <div className="lg:col-span-5 flex flex-col items-end">
              <div className="mb-4 text-right">
                <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-[0.22em] text-[#8C7E72]">
                  INNOVER · FORMER · ENTREPRENDRE · TRANSFÉRER
                </span>
              </div>

              {/* Cadre en arche avec courbe terracotta caractéristique */}
              <div className="relative w-full max-w-md aspect-[4/5] sm:aspect-[3/4]">
                <div className="absolute -bottom-3 -left-3 h-24 w-24 rounded-full bg-[#A35926] z-0 hidden sm:block shadow-sm" />

                <div className="relative z-10 h-full w-full overflow-hidden rounded-t-[140px] sm:rounded-t-[180px] rounded-br-3xl rounded-bl-[60px] border border-[#EFE4D6] shadow-xl bg-[#FAF7F2]">
                  <Image
                    src="/images/campus-isep.png"
                    alt="Façade moderne du CIAT · ISEP Amadou Trawaré"
                    fill
                    priority
                    unoptimized
                    className="object-cover object-center"
                    sizes="(max-width: 1024px) 100vw, 40vw"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#24140D]/35 via-transparent to-transparent pointer-events-none" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =====================================================================
       * 2. SECTION CENTRALE : 3 COLONNES AÉRÉES (MAQUETTE EXACTE)
       * Gauche : Coordonnées | Centre : Formulaire épuré | Droite : Carte Citation
       * ===================================================================== */}
      <section className="py-16 md:py-24 border-b border-[#EFE4D6]">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-10 lg:grid-cols-12 lg:items-start">
            {/* Colonne 1 : Nos coordonnées (3 colonnes) */}
            <div className="lg:col-span-3 space-y-6">
              <h2 className="text-lg font-bold text-[#24140D] tracking-tight">
                Nos coordonnées
              </h2>

              <div className="space-y-5">
                {/* Adresse */}
                <div className="flex items-start gap-3.5">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#A35926] text-white shadow-xs">
                    <MapPin size={18} />
                  </div>
                  <div>
                    <strong className="block text-xs font-bold uppercase tracking-wider text-[#24140D]">
                      Adresse
                    </strong>
                    <p className="text-xs leading-relaxed text-[#6B5646] mt-0.5">
                      ISEP Amadou Trawaré
                      <br />
                      Diamniadio, Sénégal
                    </p>
                  </div>
                </div>

                {/* Téléphone */}
                <div className="flex items-start gap-3.5">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#A35926] text-white shadow-xs">
                    <Phone size={18} />
                  </div>
                  <div>
                    <strong className="block text-xs font-bold uppercase tracking-wider text-[#24140D]">
                      Téléphone
                    </strong>
                    <p className="text-xs leading-relaxed text-[#6B5646] mt-0.5">
                      +221 77 123 45 67
                      <br />
                      +221 33 123 45 67
                    </p>
                  </div>
                </div>

                {/* Email */}
                <div className="flex items-start gap-3.5">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#A35926] text-white shadow-xs">
                    <Mail size={18} />
                  </div>
                  <div>
                    <strong className="block text-xs font-bold uppercase tracking-wider text-[#24140D]">
                      Email
                    </strong>
                    <p className="text-xs leading-relaxed text-[#6B5646] mt-0.5">
                      contact@ciat.sn
                      <br />
                      info@ciat.sn
                    </p>
                  </div>
                </div>

                {/* Horaires */}
                <div className="flex items-start gap-3.5">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#A35926] text-white shadow-xs">
                    <Clock size={18} />
                  </div>
                  <div>
                    <strong className="block text-xs font-bold uppercase tracking-wider text-[#24140D]">
                      Horaires
                    </strong>
                    <p className="text-xs leading-relaxed text-[#6B5646] mt-0.5">
                      Lundi - Vendredi : 8h00 - 17h00
                      <br />
                      Samedi : 9h00 - 13h00
                    </p>
                  </div>
                </div>
              </div>

              {/* Réseaux sociaux */}
              <div className="pt-4 border-t border-[#EFE4D6]">
                <span className="text-[10px] font-bold uppercase tracking-widest text-[#8C7E72] block mb-3">
                  SUIVEZ-NOUS
                </span>
                <div className="flex items-center gap-2.5">
                  <a
                    href="https://linkedin.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="LinkedIn CIAT"
                    className="flex h-9 w-9 items-center justify-center rounded-full bg-[#24140D] text-white transition-all hover:bg-[#A35926] hover:scale-105"
                  >
                    <span className="text-xs font-bold font-sans">in</span>
                  </a>
                  <a
                    href="https://x.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="X Twitter CIAT"
                    className="flex h-9 w-9 items-center justify-center rounded-full bg-[#24140D] text-white transition-all hover:bg-[#A35926] hover:scale-105"
                  >
                    <span className="text-xs font-bold">𝕏</span>
                  </a>
                  <a
                    href="https://youtube.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="YouTube CIAT"
                    className="flex h-9 w-9 items-center justify-center rounded-full bg-[#24140D] text-white transition-all hover:bg-[#A35926] hover:scale-105"
                  >
                    <svg className="h-3.5 w-3.5 fill-current" viewBox="0 0 24 24">
                      <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                    </svg>
                  </a>
                  <a
                    href="https://instagram.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="Instagram CIAT"
                    className="flex h-9 w-9 items-center justify-center rounded-full bg-[#24140D] text-white transition-all hover:bg-[#A35926] hover:scale-105"
                  >
                    <svg className="h-3.5 w-3.5 fill-current" viewBox="0 0 24 24">
                      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.79-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                    </svg>
                  </a>
                </div>
              </div>
            </div>

            {/* Colonne 2 : Formulaire "Écrivez-nous" (5 colonnes) */}
            <div className="lg:col-span-5">
              <div className="mb-5">
                <h2 className="text-lg font-bold text-[#24140D] tracking-tight">
                  Écrivez-nous
                </h2>
                <p className="text-xs text-[#6B5646] mt-1">
                  Remplissez le formulaire ci-dessous, notre équipe vous répondra dans les plus brefs délais.
                </p>
              </div>

              {successMessage ? (
                <div className="rounded-2xl border border-[#2E7D32]/40 bg-[#E8F5E9] p-8 text-center shadow-sm">
                  <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-[#2E7D32] text-xl text-white">
                    ✓
                  </div>
                  <h3 className="text-base font-bold text-[#1B5E20]">
                    Message envoyé avec succès !
                  </h3>
                  <p className="text-xs leading-relaxed text-[#2E7D32] mt-2">
                    {successMessage}
                  </p>
                  <button
                    type="button"
                    onClick={() => setSuccessMessage(null)}
                    className="mt-5 rounded-full bg-[#2E7D32] px-6 py-2 text-xs font-bold text-white shadow-xs transition-all hover:bg-[#1B5E20]"
                  >
                    Envoyer un autre message
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} noValidate className="space-y-4">
                  {errors.form && (
                    <div className="rounded-xl border border-[#DC2626]/30 bg-[#FEE2E2] p-3 text-xs text-[#DC2626]">
                      {errors.form}
                    </div>
                  )}

                  {/* Ligne 1 : Nom et Prénom */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <input
                        type="text"
                        name="nom"
                        value={nom}
                        onChange={(e) => setNom(e.target.value)}
                        placeholder="Nom *"
                        className={`w-full rounded-xl border bg-[#F7F4EE] px-4 py-3 text-xs sm:text-sm text-[#24140D] placeholder-[#8C7E72] transition-all focus:outline-none focus:ring-1 focus:ring-[#A35926] ${
                          errors.nom ? "border-[#DC2626]" : "border-[#EFE4D6] focus:border-[#A35926]"
                        }`}
                      />
                      {errors.nom && (
                        <p className="mt-1 text-[11px] font-semibold text-[#DC2626]">{errors.nom}</p>
                      )}
                    </div>

                    <div>
                      <input
                        type="text"
                        name="prenom"
                        value={prenom}
                        onChange={(e) => setPrenom(e.target.value)}
                        placeholder="Prénom *"
                        className={`w-full rounded-xl border bg-[#F7F4EE] px-4 py-3 text-xs sm:text-sm text-[#24140D] placeholder-[#8C7E72] transition-all focus:outline-none focus:ring-1 focus:ring-[#A35926] ${
                          errors.prenom ? "border-[#DC2626]" : "border-[#EFE4D6] focus:border-[#A35926]"
                        }`}
                      />
                      {errors.prenom && (
                        <p className="mt-1 text-[11px] font-semibold text-[#DC2626]">{errors.prenom}</p>
                      )}
                    </div>
                  </div>

                  {/* Ligne 2 : Email */}
                  <div>
                    <input
                      type="email"
                      name="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Email *"
                      className={`w-full rounded-xl border bg-[#F7F4EE] px-4 py-3 text-xs sm:text-sm text-[#24140D] placeholder-[#8C7E72] transition-all focus:outline-none focus:ring-1 focus:ring-[#A35926] ${
                        errors.email ? "border-[#DC2626]" : "border-[#EFE4D6] focus:border-[#A35926]"
                      }`}
                    />
                    {errors.email && (
                      <p className="mt-1 text-[11px] font-semibold text-[#DC2626]">{errors.email}</p>
                    )}
                  </div>

                  {/* Ligne 3 : Téléphone */}
                  <div>
                    <input
                      type="tel"
                      name="telephone"
                      value={telephone}
                      onChange={(e) => setTelephone(e.target.value)}
                      placeholder="Téléphone"
                      className="w-full rounded-xl border border-[#EFE4D6] bg-[#F7F4EE] px-4 py-3 text-xs sm:text-sm text-[#24140D] placeholder-[#8C7E72] focus:border-[#A35926] focus:outline-none focus:ring-1 focus:ring-[#A35926]"
                    />
                  </div>

                  {/* Ligne 4 : Sujet de votre demande (select épuré) */}
                  <div>
                    <select
                      name="sujet"
                      value={sujet}
                      onChange={(e) => setSujet(e.target.value)}
                      className={`w-full rounded-xl border bg-[#F7F4EE] px-4 py-3 text-xs sm:text-sm text-[#24140D] transition-all focus:outline-none focus:ring-1 focus:ring-[#A35926] ${
                        errors.sujet ? "border-[#DC2626]" : "border-[#EFE4D6] focus:border-[#A35926]"
                      }`}
                    >
                      {SUJETS_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value} disabled={opt.value === ""}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                    {errors.sujet && (
                      <p className="mt-1 text-[11px] font-semibold text-[#DC2626]">{errors.sujet}</p>
                    )}
                  </div>

                  {/* Ligne 5 : Votre message */}
                  <div>
                    <textarea
                      name="message"
                      rows={4}
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder="Votre message *&#10;Écrivez votre message ici..."
                      className={`w-full rounded-xl border bg-[#F7F4EE] px-4 py-3 text-xs sm:text-sm text-[#24140D] placeholder-[#8C7E72] transition-all focus:outline-none focus:ring-1 focus:ring-[#A35926] ${
                        errors.message ? "border-[#DC2626]" : "border-[#EFE4D6] focus:border-[#A35926]"
                      }`}
                    />
                    {errors.message && (
                      <p className="mt-1 text-[11px] font-semibold text-[#DC2626]">{errors.message}</p>
                    )}
                  </div>

                  {/* Bouton Envoyer le message */}
                  <div className="pt-2">
                    <button
                      type="submit"
                      disabled={submitting}
                      className="inline-flex items-center justify-center rounded-full bg-[#8C3A14] px-8 py-3.5 text-xs sm:text-sm font-bold text-white shadow-md transition-all hover:bg-[#612D10] active:scale-95 disabled:opacity-50"
                    >
                      {submitting ? "Envoi en cours..." : "Envoyer le message"}
                      <ArrowRight size={16} className="ml-2" />
                    </button>
                  </div>

                  {/* Mention de confidentialité */}
                  <div className="flex items-center gap-1.5 text-[11px] text-[#8C7E72] pt-1">
                    <Lock size={12} className="text-[#8C7E72]" />
                    <span>Vos données sont sécurisées et ne seront jamais partagées.</span>
                  </div>
                </form>
              )}
            </div>

            {/* Colonne 3 : Carte Visuelle & Citation (4 colonnes) */}
            <div className="lg:col-span-4">
              <div className="rounded-2xl overflow-hidden border border-[#EFE4D6] shadow-md bg-[#3D1D10]">
                {/* Photo supérieure de la table de travail / réunion */}
                <div className="relative h-56 w-full bg-[#24140D]">
                  <Image
                    src="/images/auth-incubateur.jpg"
                    alt="Espace de travail et réunion d'innovation au CIAT"
                    fill
                    unoptimized
                    className="object-cover object-center"
                    sizes="(max-width: 1024px) 100vw, 33vw"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#3D1D10] via-transparent to-transparent pointer-events-none" />
                </div>

                {/* Bloc inférieur avec citation inspirante */}
                <div className="p-6 text-white space-y-3">
                  <div className="text-2xl text-[#C99A68] font-serif leading-none">
                    “
                  </div>
                  <p className="text-xs sm:text-sm leading-relaxed text-[#FAF7F2]/90 font-normal">
                    Le CIAT est un espace d’échanges, de collaboration et d’innovation au service du
                    développement durable du Sénégal.
                  </p>
                  <div className="pt-2 border-t border-white/10 text-[11px] text-[#C99A68] font-semibold">
                    L’équipe CIAT
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =====================================================================
       * 3. NOTRE LOCALISATION : NOUS TROUVER + CARTE DIAMNIADIO
       * Fidèle à la maquette : Titre sobre, bouton Google Maps et plan stylisé
       * ===================================================================== */}
      <section className="py-16 md:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-10 lg:grid-cols-12 lg:items-center">
            {/* Colonne Gauche : Descriptif et lien */}
            <div className="lg:col-span-4 space-y-4">
              <div className="flex items-center gap-3">
                <span className="text-xs font-bold uppercase tracking-[0.25em] text-[#A35926]">
                  NOTRE LOCALISATION
                </span>
                <span className="h-[1.5px] w-12 bg-[#A35926]/70" />
              </div>

              <h2 className="text-3xl sm:text-4xl font-extrabold text-[#24140D] tracking-tight">
                Nous <span className="text-[#A35926]">trouver</span>
              </h2>

              <p className="text-xs sm:text-sm leading-relaxed text-[#6B5646]">
                Le CIAT est situé sur le campus de l’ISEP Amadou Trawaré à Diamniadio. Un cadre moderne et
                accessible, au cœur de l’écosystème de l’innovation sénégalais.
              </p>

              <div className="pt-2">
                <a
                  href="https://maps.google.com/?q=ISEP+Diamniadio+Senegal"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-full border border-[#612D10] px-6 py-2.5 text-xs font-bold text-[#612D10] transition-all hover:bg-[#612D10] hover:text-white group"
                >
                  <MapPin size={14} className="text-[#A35926] group-hover:text-white" />
                  <span>Voir sur Google Maps</span>
                  <ArrowRight size={14} className="transition-transform group-hover:translate-x-1" />
                </a>
              </div>
            </div>

            {/* Colonne Droite : Plan stylisé de Diamniadio fidèle à la maquette */}
            <div className="lg:col-span-8">
              <div className="relative aspect-[16/10] sm:aspect-[16/9] w-full rounded-3xl overflow-hidden border border-[#EFE4D6] shadow-sm bg-[#EBE4D8]">
                {/* SVG de fond stylisé représentant les voiries de Diamniadio */}
                <svg
                  className="absolute inset-0 h-full w-full"
                  viewBox="0 0 800 450"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  {/* Fond terrain doux */}
                  <rect width="800" height="450" fill="#EAE2D4" />

                  {/* Parcelles urbaines de la Cité du Savoir */}
                  <path d="M50 40 L340 40 L300 220 L70 200 Z" fill="#E4DBCB" opacity="0.6" />
                  <path d="M420 30 L760 30 L740 180 L440 160 Z" fill="#E4DBCB" opacity="0.6" />
                  <path d="M380 240 L760 210 L750 420 L420 420 Z" fill="#E4DBCB" opacity="0.5" />
                  <path d="M60 260 L280 270 L260 430 L50 430 Z" fill="#E4DBCB" opacity="0.5" />

                  {/* Réseau de voiries fines */}
                  <path d="M0 120 L800 110" stroke="#F8F5EE" strokeWidth="6" />
                  <path d="M120 0 L150 450" stroke="#F8F5EE" strokeWidth="5" />
                  <path d="M680 0 L660 450" stroke="#F8F5EE" strokeWidth="5" />
                  <path d="M0 340 L800 320" stroke="#F8F5EE" strokeWidth="6" />

                  {/* Rond-point central de Diamniadio */}
                  <circle cx="510" cy="180" r="32" stroke="#FAF7F2" strokeWidth="12" fill="none" />
                  <circle cx="510" cy="180" r="16" fill="#DDD2BE" />

                  {/* Artères principales convergentes */}
                  <path d="M180 450 L490 200" stroke="#FAF7F2" strokeWidth="14" />
                  <path d="M530 160 L780 40" stroke="#FAF7F2" strokeWidth="14" />
                  <path d="M510 210 L560 450" stroke="#FAF7F2" strokeWidth="14" />
                  <path d="M320 0 L490 160" stroke="#FAF7F2" strokeWidth="14" />

                  {/* Autoroute à péage (double ligne dorée sobre) */}
                  <path d="M220 450 L470 220" stroke="#C99A68" strokeWidth="2" strokeDasharray="6 4" />
                  <text x="460" y="420" fill="#8C7E72" fontSize="11" fontFamily="sans-serif" transform="rotate(-38 460 420)">
                    Autoroute à péage
                  </text>
                  <text x="560" y="380" fill="#612D10" fontSize="13" fontWeight="bold" fontFamily="sans-serif">
                    Diamniadio
                  </text>
                </svg>

                {/* Pin central du CIAT / ISEP Amadou Trawaré */}
                <div className="absolute top-[48%] left-[64%] -translate-x-1/2 -translate-y-1/2 flex items-center gap-2">
                  <div className="relative flex h-10 w-10 items-center justify-center">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#A35926] opacity-35" />
                    <span className="relative flex h-7 w-7 items-center justify-center rounded-full bg-[#A35926] text-white shadow-lg">
                      <MapPin size={15} />
                    </span>
                  </div>
                  <div className="rounded-lg bg-white/95 backdrop-blur-xs px-2.5 py-1.5 shadow-md border border-[#EFE4D6]">
                    <span className="text-xs font-extrabold text-[#24140D] block leading-tight">
                      CIAT
                    </span>
                    <span className="text-[10px] text-[#6B5646] font-medium block">
                      ISEP Amadou Trawaré
                    </span>
                  </div>
                </div>

                {/* Second Pin discret ISEP */}
                <div className="absolute top-[62%] left-[58%] -translate-x-1/2 -translate-y-1/2 flex items-center gap-1.5 opacity-90">
                  <div className="h-5 w-5 rounded-full bg-[#612D10] text-white flex items-center justify-center shadow-xs">
                    <MapPin size={11} />
                  </div>
                  <span className="text-[11px] font-bold text-[#612D10] bg-white/90 px-1.5 py-0.5 rounded shadow-2xs">
                    ISEP
                  </span>
                </div>

                {/* Bouton Agrandir en haut à droite */}
                <a
                  href="https://maps.google.com/?q=ISEP+Diamniadio+Senegal"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="absolute top-3.5 right-3.5 flex h-8 w-8 items-center justify-center rounded-lg bg-white shadow-sm border border-[#EFE4D6] text-[#612D10] hover:bg-[#FAF7F2]"
                  aria-label="Agrandir la carte"
                >
                  <Maximize2 size={15} />
                </a>

                {/* Contrôles de zoom en bas à droite */}
                <div className="absolute bottom-3.5 right-3.5 flex flex-col gap-1">
                  <div className="flex flex-col rounded-lg bg-white shadow-sm border border-[#EFE4D6] overflow-hidden">
                    <button
                      type="button"
                      className="flex h-8 w-8 items-center justify-center text-[#612D10] hover:bg-[#FAF7F2] border-b border-[#EFE4D6]"
                      aria-label="Zoom avant"
                    >
                      <Plus size={15} />
                    </button>
                    <button
                      type="button"
                      className="flex h-8 w-8 items-center justify-center text-[#612D10] hover:bg-[#FAF7F2]"
                      aria-label="Zoom arrière"
                    >
                      <Minus size={15} />
                    </button>
                  </div>
                  <button
                    type="button"
                    className="flex h-8 w-8 items-center justify-center rounded-lg bg-white shadow-sm border border-[#EFE4D6] text-[#612D10] hover:bg-[#FAF7F2]"
                    aria-label="Recentrer la carte"
                  >
                    <Crosshair size={14} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
