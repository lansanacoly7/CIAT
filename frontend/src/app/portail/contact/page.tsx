"use client";

import { useState } from "react";
import { Badge, Button, ButtonLink, PageTitle } from "@/components/ui";
import { sendContactMessage, type ContactFormData } from "@/lib/portal-api";

const SUJETS_OPTIONS = [
  { value: "", label: "Sélectionnez l'objet de votre démarche..." },
  { value: "candidature", label: "Candidature & Intégration de l'incubateur" },
  { value: "partenariat", label: "Partenariat institutionnel ou industriel" },
  { value: "prototypage", label: "Accès aux laboratoires & bancs d'essais" },
  { value: "mentorat", label: "Proposition de mentorat technique ou métier" },
  { value: "presse", label: "Relations presse & communication" },
  { value: "autre", label: "Autre demande d'information" },
];

export default function ContactPage() {
  const [formData, setFormData] = useState<ContactFormData>({
    nom: "",
    email: "",
    telephone: "",
    organisation: "",
    sujet: "",
    message: "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const validateField = (field: keyof ContactFormData, value: string): string | null => {
    switch (field) {
      case "nom":
        if (!value.trim()) return "Le nom complet est obligatoire.";
        if (value.trim().length < 2) return "Le nom doit comporter au moins 2 caractères.";
        return null;
      case "email": {
        if (!value.trim()) return "L'adresse email est obligatoire.";
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(value.trim())) return "Veuillez renseigner une adresse email valide.";
        return null;
      }
      case "sujet":
        if (!value.trim()) return "Veuillez sélectionner un motif de contact.";
        return null;
      case "message":
        if (!value.trim()) return "Le message ne peut pas être vide.";
        if (value.trim().length < 10) return "Votre message doit comporter au moins 10 caractères.";
        return null;
      default:
        return null;
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    // Supprime l'erreur du champ au fur et à mesure de la saisie
    if (errors[name]) {
      const fieldError = validateField(name as keyof ContactFormData, value);
      setErrors((prev) => {
        const next = { ...prev };
        if (!fieldError) delete next[name];
        else next[name] = fieldError;
        return next;
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation globale de tous les champs requis
    const newErrors: Record<string, string> = {};
    const fieldsToValidate: (keyof ContactFormData)[] = ["nom", "email", "sujet", "message"];

    for (const field of fieldsToValidate) {
      const fieldError = validateField(field, formData[field] || "");
      if (fieldError) {
        newErrors[field] = fieldError;
      }
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setSubmitting(true);
    try {
      const res = await sendContactMessage(formData);
      if (res.success) {
        setSuccessMessage(res.message);
        setFormData({
          nom: "",
          email: "",
          telephone: "",
          organisation: "",
          sujet: "",
          message: "",
        });
        setErrors({});
      } else if (res.errors) {
        // En cas d'erreurs retournées par l'API de Pathé
        const apiErrors: Record<string, string> = {};
        for (const [key, msgs] of Object.entries(res.errors)) {
          apiErrors[key] = msgs[0];
        }
        setErrors(apiErrors);
      } else {
        setErrors({ form: res.message || "Une erreur est survenue lors de l'envoi. Veuillez réessayer." });
      }
    } catch {
      setErrors({ form: "Une erreur est survenue lors de l'envoi. Veuillez réessayer." });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 md:py-16">
      <PageTitle
        tag="Module 1 · Portail Public"
        title="Contactez le CIAT & l'ISEP Diamniadio"
        subtitle="Une question sur notre incubateur, nos appels à projets ou nos laboratoires ? Transmettez-nous votre message, l'équipe d'animation du CIAT vous répond dans les meilleurs délais."
      />

      <div className="grid gap-10 lg:grid-cols-3">
        {/* Colonne 1 & 2 : Formulaire de contact */}
        <div className="lg:col-span-2">
          {successMessage ? (
            /* Message de confirmation certifié conforme au critère d'acceptation */
            <div className="rounded-2xl border border-succes/40 bg-[#e3f1e9] p-8 text-center shadow-xs">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-succes text-2xl text-white">
                ✓
              </div>
              <h2 className="text-xl font-bold text-succes md:text-2xl">
                Message transmis avec succès !
              </h2>
              <p className="mt-3 text-sm leading-relaxed text-texte">
                {successMessage}
              </p>
              <p className="mt-2 text-xs text-texte-doux">
                Un accusé de réception automatique a été consigné pour le secrétariat du CIAT.
              </p>
              <div className="mt-6 flex justify-center gap-3">
                <Button
                  variant="primary"
                  onClick={() => setSuccessMessage(null)}
                >
                  Envoyer un autre message
                </Button>
                <ButtonLink href="/portail" variant="secondary">
                  Retourner au portail
                </ButtonLink>
              </div>
            </div>
          ) : (
            <form
              onSubmit={handleSubmit}
              noValidate
              className="rounded-2xl border border-bordure bg-white p-6 shadow-sm md:p-8"
            >
              <h2 className="text-lg font-bold text-brun">
                Formulaire de Contact Officiel
              </h2>
              <p className="mt-1 text-xs text-texte-doux">
                Les champs marqués d&apos;un astérisque (*) sont obligatoires.
              </p>

              {errors.form && (
                <div className="mt-4 rounded-xl border border-erreur bg-[#f6dedc] p-3 text-xs text-erreur">
                  {errors.form}
                </div>
              )}

              <div className="mt-6 grid gap-5 sm:grid-cols-2">
                {/* Nom complet */}
                <div>
                  <label htmlFor="nom" className="block text-xs font-bold uppercase tracking-wider text-texte-doux">
                    Nom complet *
                  </label>
                  <input
                    id="nom"
                    name="nom"
                    type="text"
                    required
                    value={formData.nom}
                    onChange={handleChange}
                    placeholder="Ex: Awa Diop"
                    aria-invalid={Boolean(errors.nom)}
                    aria-describedby={errors.nom ? "nom-error" : undefined}
                    className={`mt-1.5 w-full rounded-lg border bg-ivoire px-3 py-2.5 text-sm text-texte placeholder-texte-doux transition-all focus:outline-none focus:ring-1 ${
                      errors.nom
                        ? "border-erreur focus:border-erreur focus:ring-erreur"
                        : "border-bordure focus:border-brun focus:ring-brun"
                    }`}
                  />
                  {/* Message d'erreur sous le champ concerné */}
                  {errors.nom && (
                    <p id="nom-error" className="mt-1.5 text-xs font-semibold text-erreur">
                      {errors.nom}
                    </p>
                  )}
                </div>

                {/* Adresse email */}
                <div>
                  <label htmlFor="email" className="block text-xs font-bold uppercase tracking-wider text-texte-doux">
                    Adresse email professionnelle *
                  </label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    required
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="Ex: awa.diop@isep.sn"
                    aria-invalid={Boolean(errors.email)}
                    aria-describedby={errors.email ? "email-error" : undefined}
                    className={`mt-1.5 w-full rounded-lg border bg-ivoire px-3 py-2.5 text-sm text-texte placeholder-texte-doux transition-all focus:outline-none focus:ring-1 ${
                      errors.email
                        ? "border-erreur focus:border-erreur focus:ring-erreur"
                        : "border-bordure focus:border-brun focus:ring-brun"
                    }`}
                  />
                  {/* Message d'erreur sous le champ concerné */}
                  {errors.email && (
                    <p id="email-error" className="mt-1.5 text-xs font-semibold text-erreur">
                      {errors.email}
                    </p>
                  )}
                </div>

                {/* Téléphone */}
                <div>
                  <label htmlFor="telephone" className="block text-xs font-bold uppercase tracking-wider text-texte-doux">
                    Numéro de téléphone
                  </label>
                  <input
                    id="telephone"
                    name="telephone"
                    type="tel"
                    value={formData.telephone}
                    onChange={handleChange}
                    placeholder="+221 77 000 00 00"
                    className="mt-1.5 w-full rounded-lg border border-bordure bg-ivoire px-3 py-2.5 text-sm text-texte placeholder-texte-doux focus:border-brun focus:outline-none focus:ring-1 focus:ring-brun"
                  />
                </div>

                {/* Organisation / Rôle */}
                <div>
                  <label htmlFor="organisation" className="block text-xs font-bold uppercase tracking-wider text-texte-doux">
                    Organisation ou statut
                  </label>
                  <input
                    id="organisation"
                    name="organisation"
                    type="text"
                    value={formData.organisation}
                    onChange={handleChange}
                    placeholder="Ex: Étudiant ISEP, Start-up, Entreprise"
                    className="mt-1.5 w-full rounded-lg border border-bordure bg-ivoire px-3 py-2.5 text-sm text-texte placeholder-texte-doux focus:border-brun focus:outline-none focus:ring-1 focus:ring-brun"
                  />
                </div>

                {/* Objet de la demande */}
                <div className="sm:col-span-2">
                  <label htmlFor="sujet" className="block text-xs font-bold uppercase tracking-wider text-texte-doux">
                    Objet de votre démarche *
                  </label>
                  <select
                    id="sujet"
                    name="sujet"
                    required
                    value={formData.sujet}
                    onChange={handleChange}
                    aria-invalid={Boolean(errors.sujet)}
                    aria-describedby={errors.sujet ? "sujet-error" : undefined}
                    className={`mt-1.5 w-full rounded-lg border bg-ivoire px-3 py-2.5 text-sm text-texte transition-all focus:outline-none focus:ring-1 ${
                      errors.sujet
                        ? "border-erreur focus:border-erreur focus:ring-erreur"
                        : "border-bordure focus:border-brun focus:ring-brun"
                    }`}
                  >
                    {SUJETS_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                  {/* Message d'erreur sous le champ concerné */}
                  {errors.sujet && (
                    <p id="sujet-error" className="mt-1.5 text-xs font-semibold text-erreur">
                      {errors.sujet}
                    </p>
                  )}
                </div>

                {/* Message */}
                <div className="sm:col-span-2">
                  <label htmlFor="message" className="block text-xs font-bold uppercase tracking-wider text-texte-doux">
                    Votre message *
                  </label>
                  <textarea
                    id="message"
                    name="message"
                    required
                    rows={5}
                    value={formData.message}
                    onChange={handleChange}
                    placeholder="Précisez votre projet, votre domaine d'intervention ou votre demande..."
                    aria-invalid={Boolean(errors.message)}
                    aria-describedby={errors.message ? "message-error" : undefined}
                    className={`mt-1.5 w-full rounded-lg border bg-ivoire px-3 py-2.5 text-sm text-texte placeholder-texte-doux transition-all focus:outline-none focus:ring-1 ${
                      errors.message
                        ? "border-erreur focus:border-erreur focus:ring-erreur"
                        : "border-bordure focus:border-brun focus:ring-brun"
                    }`}
                  />
                  {/* Message d'erreur sous le champ concerné */}
                  {errors.message && (
                    <p id="message-error" className="mt-1.5 text-xs font-semibold text-erreur">
                      {errors.message}
                    </p>
                  )}
                </div>
              </div>

              {/* Bouton de soumission tactile min 44px */}
              <div className="mt-8 flex items-center justify-between border-t border-bordure pt-4">
                <span className="text-xs text-texte-doux">
                  Données protégées conformément à la législation sénégalaise.
                </span>

                <Button
                  type="submit"
                  variant="primary"
                  disabled={submitting}
                  className="min-w-[160px]"
                >
                  {submitting ? "Transmission en cours..." : "Envoyer le message →"}
                </Button>
              </div>
            </form>
          )}
        </div>

        {/* Colonne 3 : Informations institutionnelles & Accès */}
        <div className="space-y-6">
          <div className="rounded-2xl border border-bordure bg-ivoire p-6 shadow-2xs">
            <h3 className="text-sm font-bold uppercase tracking-wider text-brun">
              Coordonnées Officielles
            </h3>

            <div className="mt-4 space-y-4 text-xs leading-relaxed text-texte">
              <div>
                <strong className="block text-brun-fonce">Localisation :</strong>
                Institut Supérieur d&apos;Enseignement Professionnel (ISEP)<br />
                Amadou Traoré de Diamniadio<br />
                Cité du Savoir, Diamniadio, Sénégal
              </div>

              <div>
                <strong className="block text-brun-fonce">Accueil téléphonique :</strong>
                +221 33 800 00 00
              </div>

              <div>
                <strong className="block text-brun-fonce">Courriel institutionnel :</strong>
                contact@ciat.sn
              </div>

              <div>
                <strong className="block text-brun-fonce">Horaires d&apos;ouverture :</strong>
                Lundi au Vendredi : 08h00 – 17h00<br />
                Fermé les week-ends et jours fériés
              </div>
            </div>

            <div className="mt-6 border-t border-bordure pt-4">
              <Badge tone="neutre" className="w-full justify-center text-center">
                Ateliers technologiques ouverts sur RDV
              </Badge>
            </div>
          </div>

          <div className="rounded-2xl border border-beige/40 bg-white p-6 shadow-2xs">
            <h3 className="text-sm font-bold uppercase tracking-wider text-brun">
              Candidat à l&apos;Incubation ?
            </h3>
            <p className="mt-2 text-xs leading-relaxed text-texte-doux">
              Pour soumettre un dossier de projet, vous pouvez consulter les appels en cours ou vous connecter directement à l&apos;espace porteur.
            </p>
            <div className="mt-4 space-y-2">
              <ButtonLink href="/portail/appels" variant="accent" className="w-full text-xs">
                Voir les Appels à Projets
              </ButtonLink>
              <ButtonLink href="/connexion" variant="secondary" className="w-full text-xs">
                Accéder à l&apos;Espace Candidat
              </ButtonLink>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation retour */}
      <div className="mt-12 flex items-center justify-between border-t border-bordure pt-6">
        <ButtonLink href="/portail" variant="secondary" className="text-xs">
          ← Retour au Hub Portail
        </ButtonLink>
        <ButtonLink href="/portail/partenaires" variant="secondary" className="text-xs">
          Découvrir les Partenaires du CIAT →
        </ButtonLink>
      </div>
    </div>
  );
}
