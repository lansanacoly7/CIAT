"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  MapPin,
  Clock,
  ArrowRight,
  ExternalLink,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Building2,
  Lightbulb,
  Cpu,
  Car,
  Train,
} from "lucide-react";
import { sendContactMessage } from "@/lib/portal-api";

const MOTIFS_CONTACT = [
  { value: "", label: "Sélectionnez l'objet de votre démarche *" },
  {
    value: "partenariat_technologique",
    label: "Partenariat industriel & co-développement technologique",
  },
  {
    value: "candidature_incubation",
    label: "Candidature à l'incubateur & accompagnement de projet",
  },
  {
    value: "transfert_technologique",
    label: "Transfert de technologie & bancs d'essai / prototypage",
  },
  {
    value: "visite_campus",
    label: "Demande de visite des laboratoires et ateliers (sur RDV)",
  },
  {
    value: "autre",
    label: "Autre correspondance institutionnelle",
  },
];

export default function ContactPage() {
  const [prenom, setPrenom] = useState("");
  const [nom, setNom] = useState("");
  const [email, setEmail] = useState("");
  const [telephone, setTelephone] = useState("");
  const [organisation, setOrganisation] = useState("");
  const [sujet, setSujet] = useState("");
  const [message, setMessage] = useState("");

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const newErrors: Record<string, string> = {};
    if (!nom.trim()) newErrors.nom = "Veuillez renseigner votre nom.";
    if (!prenom.trim()) newErrors.prenom = "Veuillez renseigner votre prénom.";
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      newErrors.email = "Veuillez renseigner une adresse courriel valide.";
    }
    if (!sujet) newErrors.sujet = "Veuillez sélectionner le motif de votre contact.";
    if (!message.trim() || message.trim().length < 10) {
      newErrors.message = "Votre message doit comporter au moins 10 caractères explicatifs.";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setSubmitting(true);
    setErrors({});

    try {
      const payloadNom = organisation.trim()
        ? `${prenom.trim()} ${nom.trim()} (${organisation.trim()})`
        : `${prenom.trim()} ${nom.trim()}`;

      const res = await sendContactMessage({
        nom: payloadNom,
        email: email.trim(),
        telephone: telephone.trim() || undefined,
        sujet,
        message: message.trim(),
      });

      if (res.success) {
        setSuccessMessage(
          res.message ||
            "Votre message a été transmis avec succès. Notre équipe vous répondra sous 48 heures ouvrées."
        );
        setPrenom("");
        setNom("");
        setEmail("");
        setTelephone("");
        setOrganisation("");
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
          form: res.message || "Une erreur est survenue lors de l'envoi de votre message.",
        });
      }
    } catch {
      setErrors({
        form: "Le service de messagerie est momentanément indisponible. Veuillez réessayer ultérieurement.",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF7F2] text-[#24140D]">
      {/* =================================================================== */}
      {/* 1. EN-TÊTE ÉPURÉ & ARCHITECTURAL (STYLE ÉDITORIAL PREMIUM)          */}
      {/* =================================================================== */}
      <section className="relative border-b border-[#E8DFD3] bg-white pt-14 pb-16 md:pt-20 md:pb-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-[#D5C9BB] bg-[#FAF7F2] px-3.5 py-1 text-xs font-semibold uppercase tracking-wider text-[#612D10]">
              <span className="h-1.5 w-1.5 rounded-full bg-[#612D10]" />
              Guichet Unique Institutionnel · CIAT Diamniadio
            </div>

            <h1 className="mt-5 text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-[#24140D] font-serif leading-[1.15]">
              Contact & Accès Campus
            </h1>

            <p className="mt-4 text-base sm:text-lg text-[#5A483D] leading-relaxed">
              Le Centre d’Innovation, d’Application et de Transfert (CIAT) de l&apos;ISEP
              Amadou Trawaré accompagne les créateurs, chercheurs et partenaires industriels.
              Nos équipes vous accueillent sur le campus technologique de Diamniadio.
            </p>

            <div className="mt-6 flex flex-wrap items-center gap-6 text-xs text-[#7A695D]">
              <div className="flex items-center gap-2">
                <Clock size={15} className="text-[#612D10]" />
                <span>Horaires : Lun – Ven, 08h30 – 17h00</span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin size={15} className="text-[#612D10]" />
                <span>Cité du Savoir, Diamniadio, Sénégal</span>
              </div>
              <div className="flex items-center gap-2">
                <ShieldCheck size={15} className="text-[#612D10]" />
                <span>Engagement de réponse sous 48h ouvrées</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =================================================================== */}
      {/* 2. LES 3 PÔLES D'ORIENTATION DIRECTE (CLARTÉ FONCTIONNELLE)         */}
      {/* =================================================================== */}
      <section className="py-12 md:py-16 border-b border-[#E8DFD3]">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-8">
            <span className="text-xs font-bold uppercase tracking-wider text-[#612D10]">
              Orientation
            </span>
            <h2 className="mt-1 text-xl sm:text-2xl font-bold text-[#24140D]">
              Choisir votre pôle d&apos;interlocution
            </h2>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            {/* Pôle 1 : Direction Générale */}
            <div className="rounded-2xl border border-[#E8DFD3] bg-white p-7 shadow-xs hover:border-[#C99A68] hover:shadow-sm transition-all flex flex-col justify-between">
              <div>
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#FAF7F2] border border-[#E8DFD3] text-[#612D10] mb-5">
                  <Building2 size={20} />
                </div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#8C7A6D]">
                  Pôle 01
                </span>
                <h3 className="text-lg font-bold text-[#24140D] mt-1">
                  Direction & Secrétariat Général
                </h3>
                <p className="mt-2.5 text-xs sm:text-sm text-[#6B5A4E] leading-relaxed">
                  Audiences officielles, délégations gouvernementales, gouvernance institutionnelle
                  et conventions universitaires.
                </p>
              </div>

              <div className="mt-6 pt-5 border-t border-[#F2ECE4] space-y-2 text-xs">
                <div className="flex items-center justify-between text-[#5A483D]">
                  <span className="text-[#8C7A6D]">Courriel :</span>
                  <a
                    href="mailto:contact@ciat.sn"
                    className="font-semibold text-[#612D10] hover:underline"
                  >
                    contact@ciat.sn
                  </a>
                </div>
                <div className="flex items-center justify-between text-[#5A483D]">
                  <span className="text-[#8C7A6D]">Standard :</span>
                  <a
                    href="tel:+221338790000"
                    className="font-semibold text-[#612D10] hover:underline"
                  >
                    +221 33 879 00 00
                  </a>
                </div>
              </div>
            </div>

            {/* Pôle 2 : Transfert Technologique */}
            <div className="rounded-2xl border border-[#E8DFD3] bg-white p-7 shadow-xs hover:border-[#C99A68] hover:shadow-sm transition-all flex flex-col justify-between">
              <div>
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#FAF7F2] border border-[#E8DFD3] text-[#612D10] mb-5">
                  <Cpu size={20} />
                </div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#8C7A6D]">
                  Pôle 02
                </span>
                <h3 className="text-lg font-bold text-[#24140D] mt-1">
                  Transfert & Partenariats Industriels
                </h3>
                <p className="mt-2.5 text-xs sm:text-sm text-[#6B5A4E] leading-relaxed">
                  Bancs d&apos;essai, co-développement, accès aux équipements de prototypage,
                  propriété intellectuelle et licences.
                </p>
              </div>

              <div className="mt-6 pt-5 border-t border-[#F2ECE4] space-y-2 text-xs">
                <div className="flex items-center justify-between text-[#5A483D]">
                  <span className="text-[#8C7A6D]">Courriel :</span>
                  <a
                    href="mailto:transfert@ciat.sn"
                    className="font-semibold text-[#612D10] hover:underline"
                  >
                    transfert@ciat.sn
                  </a>
                </div>
                <div className="flex items-center justify-between text-[#5A483D]">
                  <span className="text-[#8C7A6D]">Catalogue :</span>
                  <Link
                    href="/galerie"
                    className="font-semibold text-[#612D10] hover:underline inline-flex items-center gap-1"
                  >
                    Voir les innovations →
                  </Link>
                </div>
              </div>
            </div>

            {/* Pôle 3 : Incubation & Projets */}
            <div className="rounded-2xl border border-[#E8DFD3] bg-white p-7 shadow-xs hover:border-[#C99A68] hover:shadow-sm transition-all flex flex-col justify-between">
              <div>
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#FAF7F2] border border-[#E8DFD3] text-[#612D10] mb-5">
                  <Lightbulb size={20} />
                </div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#8C7A6D]">
                  Pôle 03
                </span>
                <h3 className="text-lg font-bold text-[#24140D] mt-1">
                  Incubation & Projets Émergents
                </h3>
                <p className="mt-2.5 text-xs sm:text-sm text-[#6B5A4E] leading-relaxed">
                  Candidatures aux cohortes annuelles, instruction des dossiers d&apos;incubation
                  et mise en relation avec nos mentors techniques.
                </p>
              </div>

              <div className="mt-6 pt-5 border-t border-[#F2ECE4] space-y-2 text-xs">
                <div className="flex items-center justify-between text-[#5A483D]">
                  <span className="text-[#8C7A6D]">Courriel :</span>
                  <a
                    href="mailto:incubateur@ciat.sn"
                    className="font-semibold text-[#612D10] hover:underline"
                  >
                    incubateur@ciat.sn
                  </a>
                </div>
                <div className="flex items-center justify-between text-[#5A483D]">
                  <span className="text-[#8C7A6D]">Candidature :</span>
                  <Link
                    href="/portail/incubateur"
                    className="font-semibold text-[#612D10] hover:underline inline-flex items-center gap-1"
                  >
                    Espace Porteur →
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =================================================================== */}
      {/* 3. SECTION PRINCIPALE (FORMULAIRE ÉPURÉ + ACCÈS CAMPUS)             */}
      {/* =================================================================== */}
      <section className="py-16 md:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-12 lg:grid-cols-12 lg:items-start">
            {/* Colonne Gauche (7 cols) : Formulaire Minimaliste & Rigoureux */}
            <div className="lg:col-span-7">
              <div className="rounded-3xl border border-[#E8DFD3] bg-white p-8 sm:p-10 shadow-xs">
                <div className="mb-8">
                  <span className="text-xs font-bold uppercase tracking-wider text-[#612D10]">
                    Formulaire Officiel
                  </span>
                  <h2 className="mt-1 text-2xl font-bold tracking-tight text-[#24140D]">
                    Transmettre un message à nos équipes
                  </h2>
                  <p className="mt-2 text-xs sm:text-sm text-[#6B5A4E] leading-relaxed">
                    Veuillez renseigner les champs ci-dessous avec précision. Votre demande sera
                    instruite et acheminée vers le responsable de pôle concerné.
                  </p>
                </div>

                {successMessage ? (
                  <div className="rounded-2xl border border-[#2E7D32]/30 bg-[#E8F5E9]/60 p-8 text-center animate-fadeIn">
                    <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-[#2E7D32] text-white shadow-xs">
                      <CheckCircle2 size={28} />
                    </div>
                    <h3 className="text-lg font-bold text-[#1B5E20]">
                      Message transmis avec succès
                    </h3>
                    <p className="mt-2 text-xs sm:text-sm text-[#2E7D32] max-w-md mx-auto leading-relaxed">
                      {successMessage}
                    </p>
                    <button
                      type="button"
                      onClick={() => setSuccessMessage(null)}
                      className="mt-6 rounded-xl border border-[#2E7D32] bg-white px-6 py-2.5 text-xs font-bold text-[#1B5E20] hover:bg-[#E8F5E9] transition-all"
                    >
                      Transmettre une nouvelle demande
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} noValidate className="space-y-5">
                    {errors.form && (
                      <div
                        role="alert"
                        className="flex items-start gap-3 rounded-xl border border-[#DC2626]/30 bg-[#FEE2E2]/60 p-4 text-xs text-[#B91C1C]"
                      >
                        <AlertCircle size={16} className="shrink-0 mt-0.5" />
                        <span>{errors.form}</span>
                      </div>
                    )}

                    {/* Ligne 1 : Prénom et Nom */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label
                          htmlFor="contact-prenom"
                          className="block text-xs font-semibold text-[#453328] mb-1.5"
                        >
                          Prénom <span className="text-[#DC2626]">*</span>
                        </label>
                        <input
                          id="contact-prenom"
                          type="text"
                          value={prenom}
                          onChange={(e) => setPrenom(e.target.value)}
                          placeholder="Moussa"
                          aria-invalid={Boolean(errors.prenom)}
                          className={`w-full h-11 rounded-xl border bg-[#FAF7F2] px-3.5 text-xs sm:text-sm text-[#24140D] placeholder-[#A8988B] transition-colors focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#612D10] ${
                            errors.prenom
                              ? "border-[#DC2626]"
                              : "border-[#D5C9BB] focus:border-[#612D10]"
                          }`}
                        />
                        {errors.prenom && (
                          <p role="alert" className="mt-1.5 text-[11px] font-medium text-[#DC2626]">
                            {errors.prenom}
                          </p>
                        )}
                      </div>

                      <div>
                        <label
                          htmlFor="contact-nom"
                          className="block text-xs font-semibold text-[#453328] mb-1.5"
                        >
                          Nom <span className="text-[#DC2626]">*</span>
                        </label>
                        <input
                          id="contact-nom"
                          type="text"
                          value={nom}
                          onChange={(e) => setNom(e.target.value)}
                          placeholder="Diallo"
                          aria-invalid={Boolean(errors.nom)}
                          className={`w-full h-11 rounded-xl border bg-[#FAF7F2] px-3.5 text-xs sm:text-sm text-[#24140D] placeholder-[#A8988B] transition-colors focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#612D10] ${
                            errors.nom
                              ? "border-[#DC2626]"
                              : "border-[#D5C9BB] focus:border-[#612D10]"
                          }`}
                        />
                        {errors.nom && (
                          <p role="alert" className="mt-1.5 text-[11px] font-medium text-[#DC2626]">
                            {errors.nom}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Ligne 2 : Email & Téléphone */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label
                          htmlFor="contact-email"
                          className="block text-xs font-semibold text-[#453328] mb-1.5"
                        >
                          Courriel institutionnel ou professionnel{" "}
                          <span className="text-[#DC2626]">*</span>
                        </label>
                        <input
                          id="contact-email"
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="moussa.diallo@entreprise.sn"
                          aria-invalid={Boolean(errors.email)}
                          className={`w-full h-11 rounded-xl border bg-[#FAF7F2] px-3.5 text-xs sm:text-sm text-[#24140D] placeholder-[#A8988B] transition-colors focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#612D10] ${
                            errors.email
                              ? "border-[#DC2626]"
                              : "border-[#D5C9BB] focus:border-[#612D10]"
                          }`}
                        />
                        {errors.email && (
                          <p role="alert" className="mt-1.5 text-[11px] font-medium text-[#DC2626]">
                            {errors.email}
                          </p>
                        )}
                      </div>

                      <div>
                        <label
                          htmlFor="contact-telephone"
                          className="block text-xs font-semibold text-[#453328] mb-1.5"
                        >
                          Téléphone de contact{" "}
                          <span className="text-[#8C7A6D] font-normal">(Optionnel)</span>
                        </label>
                        <input
                          id="contact-telephone"
                          type="tel"
                          value={telephone}
                          onChange={(e) => setTelephone(e.target.value)}
                          placeholder="+221 77 000 00 00"
                          className="w-full h-11 rounded-xl border border-[#D5C9BB] bg-[#FAF7F2] px-3.5 text-xs sm:text-sm text-[#24140D] placeholder-[#A8988B] transition-colors focus:bg-white focus:border-[#612D10] focus:outline-none focus:ring-1 focus:ring-[#612D10]"
                        />
                      </div>
                    </div>

                    {/* Ligne 3 : Entreprise / Organisation */}
                    <div>
                      <label
                        htmlFor="contact-org"
                        className="block text-xs font-semibold text-[#453328] mb-1.5"
                      >
                        Entreprise, institution ou statut porteur{" "}
                        <span className="text-[#8C7A6D] font-normal">(Optionnel)</span>
                      </label>
                      <input
                        id="contact-org"
                        type="text"
                        value={organisation}
                        onChange={(e) => setOrganisation(e.target.value)}
                        placeholder="Ex: Start-up AgriTech / Enseignant-chercheur / Étudiant ISEP"
                        className="w-full h-11 rounded-xl border border-[#D5C9BB] bg-[#FAF7F2] px-3.5 text-xs sm:text-sm text-[#24140D] placeholder-[#A8988B] transition-colors focus:bg-white focus:border-[#612D10] focus:outline-none focus:ring-1 focus:ring-[#612D10]"
                      />
                    </div>

                    {/* Ligne 4 : Motif ciblé */}
                    <div>
                      <label
                        htmlFor="contact-sujet"
                        className="block text-xs font-semibold text-[#453328] mb-1.5"
                      >
                        Motif principal de votre démarche <span className="text-[#DC2626]">*</span>
                      </label>
                      <select
                        id="contact-sujet"
                        value={sujet}
                        onChange={(e) => setSujet(e.target.value)}
                        aria-invalid={Boolean(errors.sujet)}
                        className={`w-full h-11 rounded-xl border bg-[#FAF7F2] px-3 text-xs sm:text-sm text-[#24140D] transition-colors focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#612D10] ${
                          errors.sujet
                            ? "border-[#DC2626]"
                            : "border-[#D5C9BB] focus:border-[#612D10]"
                        }`}
                      >
                        {MOTIFS_CONTACT.map((opt) => (
                          <option key={opt.value} value={opt.value} disabled={opt.value === ""}>
                            {opt.label}
                          </option>
                        ))}
                      </select>
                      {errors.sujet && (
                        <p role="alert" className="mt-1.5 text-[11px] font-medium text-[#DC2626]">
                          {errors.sujet}
                        </p>
                      )}
                    </div>

                    {/* Ligne 5 : Message détaillé */}
                    <div>
                      <label
                        htmlFor="contact-message"
                        className="block text-xs font-semibold text-[#453328] mb-1.5"
                      >
                        Détail de votre demande <span className="text-[#DC2626]">*</span>
                      </label>
                      <textarea
                        id="contact-message"
                        rows={5}
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        placeholder="Décrivez précisément votre projet, votre besoin d'accompagnement ou l'objet de votre démarche..."
                        aria-invalid={Boolean(errors.message)}
                        className={`w-full rounded-xl border bg-[#FAF7F2] p-3.5 text-xs sm:text-sm text-[#24140D] placeholder-[#A8988B] transition-colors focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#612D10] ${
                          errors.message
                            ? "border-[#DC2626]"
                            : "border-[#D5C9BB] focus:border-[#612D10]"
                        }`}
                      />
                      {errors.message && (
                        <p role="alert" className="mt-1.5 text-[11px] font-medium text-[#DC2626]">
                          {errors.message}
                        </p>
                      )}
                    </div>

                    {/* Actions & Rassurance */}
                    <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <button
                        type="submit"
                        disabled={submitting}
                        className="inline-flex h-12 items-center justify-center rounded-xl bg-[#612D10] px-8 text-xs sm:text-sm font-bold text-white shadow-xs hover:bg-[#48210B] active:scale-[0.98] transition-all disabled:opacity-50"
                      >
                        {submitting ? (
                          <span className="flex items-center gap-2">
                            <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                            Transmission en cours...
                          </span>
                        ) : (
                          <span className="flex items-center gap-2">
                            Envoyer la demande
                            <ArrowRight size={16} />
                          </span>
                        )}
                      </button>

                      <div className="flex items-center gap-2 text-[11px] text-[#7A695D]">
                        <ShieldCheck size={14} className="text-[#612D10] shrink-0" />
                        <span>Données traitées conformément à la charte CIAT.</span>
                      </div>
                    </div>
                  </form>
                )}
              </div>
            </div>

            {/* Colonne Droite (5 cols) : Accès Campus & Itinéraire Réel */}
            <div className="lg:col-span-5 space-y-6">
              {/* Carte Photo & Localisation Précise */}
              <div className="rounded-3xl border border-[#E8DFD3] bg-white overflow-hidden shadow-xs">
                <div className="relative aspect-[16/10] w-full bg-[#24140D]">
                  <Image
                    src="/images/contact/contact-accueil-campus.jpg"
                    alt="Campus technologique de l'ISEP Amadou Trawaré à Diamniadio"
                    fill
                    unoptimized
                    priority
                    className="object-cover object-center"
                    sizes="(max-width: 1024px) 100vw, 42vw"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#24140D]/85 via-black/20 to-transparent" />
                  <div className="absolute bottom-4 left-4 right-4 text-white">
                    <span className="rounded bg-[#C99A68] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[#24140D]">
                      Campus Diamniadio
                    </span>
                    <h3 className="mt-1 text-base font-bold">ISEP Amadou Trawaré</h3>
                    <p className="text-xs text-white/80">Cité du Savoir · Diamniadio</p>
                  </div>
                </div>

                <div className="p-6 sm:p-7 space-y-6">
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-[#612D10]">
                      Coordonnées Géographiques
                    </h4>
                    <p className="mt-1.5 text-xs text-[#5A483D] leading-relaxed">
                      <strong>Adresse physique :</strong> Institut Supérieur d&apos;Enseignement
                      Professionnel (ISEP) Amadou Trawaré, Cité du Savoir, Diamniadio, Sénégal.
                    </p>
                    <p className="mt-1 text-xs font-mono text-[#7A695D]">
                      GPS : 14.7167° N, 17.1833° W
                    </p>
                  </div>

                  <div className="pt-4 border-t border-[#F2ECE4] space-y-4">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-[#612D10]">
                      Comment se rendre au CIAT
                    </h4>

                    {/* Option 1 : TER */}
                    <div className="flex items-start gap-3">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#FAF7F2] border border-[#E8DFD3] text-[#612D10]">
                        <Train size={16} />
                      </div>
                      <div>
                        <strong className="block text-xs text-[#24140D]">
                          Par le Train Express Régional (TER)
                        </strong>
                        <p className="text-[11px] text-[#6B5A4E] leading-relaxed mt-0.5">
                          Terminus Gare de Diamniadio, puis liaison en navette locale ou taxi vers
                          la Cité du Savoir (trajet ~5 min).
                        </p>
                      </div>
                    </div>

                    {/* Option 2 : Autoroute à Péage */}
                    <div className="flex items-start gap-3">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#FAF7F2] border border-[#E8DFD3] text-[#612D10]">
                        <Car size={16} />
                      </div>
                      <div>
                        <strong className="block text-xs text-[#24140D]">
                          Par l&apos;Autoroute à Péage AIBD
                        </strong>
                        <p className="text-[11px] text-[#6B5A4E] leading-relaxed mt-0.5">
                          Sortie N°11 « Diamniadio / Cité du Savoir ». À 30 minutes de Dakar-Centre
                          et à 15 minutes de l&apos;Aéroport International Blaise Diagne (AIBD).
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Accréditation & Sécurité */}
                  <div className="rounded-xl bg-[#FAF7F2] border border-[#E8DFD3] p-4 text-[11px] text-[#6B5A4E] leading-relaxed">
                    <strong className="block text-[#24140D] mb-0.5">
                      Accès aux bancs d&apos;essai et laboratoires :
                    </strong>
                    Pour des raisons de sécurité des installations technologiques, l&apos;accès aux
                    ateliers est soumis à une prise de rendez-vous préalable et à la présentation
                    d&apos;une pièce d&apos;identité à l&apos;accueil principal.
                  </div>

                  {/* Bouton d'itinéraire réel */}
                  <div className="pt-2">
                    <a
                      href="https://maps.google.com/?q=ISEP+Amadou+Traware+Diamniadio+Senegal"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex w-full h-11 items-center justify-center gap-2 rounded-xl border border-[#612D10] bg-white px-5 text-xs font-bold text-[#612D10] hover:bg-[#612D10] hover:text-white transition-all shadow-2xs"
                    >
                      <span>Ouvrir l&apos;itinéraire dans Google Maps</span>
                      <ExternalLink size={14} />
                    </a>
                  </div>
                </div>
              </div>

              {/* Raccourci vers les ressources documentaires */}
              <div className="rounded-2xl border border-[#E8DFD3] bg-[#FAF7F2] p-5 text-xs flex items-center justify-between">
                <div>
                  <strong className="block text-[#24140D]">Besoin d&apos;un document officiel ?</strong>
                  <span className="text-[#7A695D]">
                    Consultez les règlements, formulaires et guides d&apos;incubation.
                  </span>
                </div>
                <Link
                  href="/portail/documents"
                  className="rounded-lg bg-white border border-[#D5C9BB] px-3.5 py-1.5 font-bold text-[#612D10] hover:bg-[#612D10] hover:text-white transition-colors shrink-0 ml-4"
                >
                  Documents →
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
