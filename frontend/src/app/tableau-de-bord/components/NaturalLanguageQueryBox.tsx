"use client";

import { useState } from "react";
import {
  Sparkles,
  Send,
  Loader2,
  HelpCircle,
  ChevronDown,
  ChevronUp,
  Database,
  Filter,
  AlertCircle,
  CheckCircle2,
  X,
} from "lucide-react";
import { api, ApiError } from "@/lib/api";
import type { QuestionAnalyticsResponse } from "../types";

const SUGGESTED_QUESTIONS = [
  "Combien de projets en prototype dans la cohorte 2025 ?",
  "Quelle est la part des femmes parmi les porteurs de projet ?",
  "Quelle est la répartition des projets par domaine ?",
  "Combien d'idées de projets ont été reçues au total ?",
  "Combien de projets sont actuellement en incubation active ?",
];

export function NaturalLanguageQueryBox() {
  const [question, setQuestion] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<QuestionAnalyticsResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isRawDataOpen, setIsRawDataOpen] = useState(false);
  const [queriedTimestamp, setQueriedTimestamp] = useState<string | null>(null);

  const handleSubmit = async (textToQuery?: string) => {
    const q = (textToQuery ?? question).trim();
    if (!q) return;

    if (textToQuery) {
      setQuestion(textToQuery);
    }

    setIsLoading(true);
    setError(null);

    try {
      const data = await api<QuestionAnalyticsResponse>("/analytics/question/", {
        method: "POST",
        body: { question: q },
      });
      setResult(data);
      const now = new Date();
      setQueriedTimestamp(
        now.toLocaleDateString("fr-FR", {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
        }) +
          " à " +
          now.toLocaleTimeString("fr-FR", {
            hour: "2-digit",
            minute: "2-digit",
          })
      );
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.status === 503) {
          const detail =
            (err.data as { detail?: string })?.detail ||
            "Le service d'analyse IA n'est pas encore configuré (aucune clé d'API valide).";
          setError(detail);
        } else if (err.status === 400) {
          const detail =
            (err.data as { detail?: string })?.detail ||
            "Veuillez poser une question valide.";
          setError(detail);
        } else if (err.status === 403) {
          setError(
            "Accès refusé : votre profil ne dispose pas des autorisations nécessaires pour interroger les données statistiques."
          );
        } else {
          setError("Une erreur est survenue lors de l'analyse de votre question.");
        }
      } else {
        setError(
          "Impossible de joindre le service d'analyse. Vérifiez votre connexion."
        );
      }
      setResult(null);
    } finally {
      setIsLoading(false);
    }
  };

  const isHorsSujet =
    result?.donnees === null ||
    result?.reponse ===
      "Je ne peux pas répondre à cette question avec les données disponibles.";

  const activeFilters = result?.filtres_utilises
    ? Object.entries(result.filtres_utilises).filter(
        ([, val]) => val !== null && val !== "" && val !== undefined
      )
    : [];

  return (
    <div className="rounded-2xl border border-[#D8C8B8]/70 bg-gradient-to-br from-[#FAF6F0] via-white to-[#F5EDE4]/40 p-4 sm:p-5 shadow-sm transition-all duration-200 hover:shadow-md">
      {/* En-tête avec badge IA */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-3">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-[#612D10] to-[#B85D19] text-white shadow-sm">
            <Sparkles className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm sm:text-base font-bold text-[#24140D]">
                Interrogation des données en langage naturel
              </h2>
              <span className="inline-flex items-center rounded-full bg-amber-100/80 px-2 py-0.5 text-[10px] font-semibold text-[#612D10]">
                IA Assistée
              </span>
            </div>
            <p className="text-xs text-[#555555]">
              Posez une question en français : calcul sécurisé basé sur les chiffres réels du CIAT
            </p>
          </div>
        </div>
      </div>

      {/* Formulaire de saisie */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSubmit();
        }}
        className="relative flex items-center gap-2 mt-2"
      >
        <div className="relative flex-1">
          <input
            id="ai-question-input"
            type="text"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="Posez une question sur les données (ex. : Combien de projets en prototype dans la cohorte 2025 ?)..."
            disabled={isLoading}
            className="w-full rounded-xl border border-[#D8C8B8] bg-white py-2.5 pl-3.5 pr-9 text-xs sm:text-sm text-[#24140D] placeholder-[#888888] shadow-inner transition focus:border-[#612D10] focus:outline-none focus:ring-2 focus:ring-[#612D10]/15 disabled:bg-gray-100"
          />
          {question && !isLoading && (
            <button
              type="button"
              onClick={() => setQuestion("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              aria-label="Effacer la saisie"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        <button
          id="ai-question-submit"
          type="submit"
          disabled={isLoading || !question.trim()}
          className="inline-flex items-center gap-1.5 rounded-xl bg-[#612D10] px-3.5 sm:px-4 py-2.5 text-xs sm:text-sm font-semibold text-white shadow transition-all hover:bg-[#4E240C] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isLoading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              <span className="hidden sm:inline">Analyse...</span>
            </>
          ) : (
            <>
              <Send className="h-4 w-4" />
              <span>Demander</span>
            </>
          )}
        </button>
      </form>

      {/* Suggestions de questions types */}
      <div className="mt-3 flex flex-wrap items-center gap-1.5 text-xs text-[#666666]">
        <span className="inline-flex items-center gap-1 font-medium text-[#612D10]">
          <HelpCircle className="h-3.5 w-3.5" />
          Exemples :
        </span>
        {SUGGESTED_QUESTIONS.map((suggestion, idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => handleSubmit(suggestion)}
            disabled={isLoading}
            className="rounded-lg border border-[#D8C8B8]/60 bg-white/80 px-2.5 py-1 text-[11px] sm:text-xs text-[#24140D] transition-colors hover:border-[#612D10] hover:bg-[#FAF6F0] active:scale-95 disabled:opacity-50"
          >
            {suggestion}
          </button>
        ))}
      </div>

      {/* Message d'erreur ou 503 IA non configurée */}
      {error && (
        <div className="mt-4 flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-50/90 p-3 text-xs sm:text-sm text-red-800">
          <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5 text-red-600" />
          <div className="flex-1">
            <p className="font-semibold">Information service IA :</p>
            <p className="mt-0.5 text-red-700">{error}</p>
          </div>
          <button
            type="button"
            onClick={() => setError(null)}
            className="text-red-500 hover:text-red-700"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Résultat obtenu */}
      {result && (
        <div className="mt-4 animate-fade-in-up rounded-xl border border-[#D8C8B8] bg-white p-3.5 sm:p-4 shadow-sm">
          {/* Entête du résultat */}
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#EADFD3] pb-2.5">
            <div className="flex items-center gap-2">
              {isHorsSujet ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-0.5 text-[11px] font-semibold text-amber-800 border border-amber-200">
                  <AlertCircle className="h-3 w-3" />
                  Hors périmètre analytique
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-800 border border-emerald-200">
                  <CheckCircle2 className="h-3 w-3" />
                  Réponse vérifiée
                </span>
              )}

              {queriedTimestamp && (
                <span className="text-[11px] text-[#777777]">
                  Calculé le {queriedTimestamp}
                </span>
              )}
            </div>

            {/* Badges des filtres appliqués */}
            {activeFilters.length > 0 && (
              <div className="flex flex-wrap items-center gap-1 text-[11px]">
                <span className="inline-flex items-center gap-1 text-[#612D10] font-medium">
                  <Filter className="h-3 w-3" />
                  Filtres :
                </span>
                {activeFilters.map(([key, val]) => (
                  <span
                    key={key}
                    className="rounded-md bg-[#FAF6F0] px-2 py-0.5 font-medium text-[#612D10] border border-[#EADFD3]"
                  >
                    {key}: <strong className="font-semibold">{String(val)}</strong>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Corps de la réponse formulée */}
          <div className="mt-3">
            <p
              id="ai-response-text"
              className={`text-sm sm:text-base leading-relaxed ${
                isHorsSujet
                  ? "text-[#666666] italic"
                  : "text-[#24140D] font-medium"
              }`}
            >
              {result.reponse}
            </p>
          </div>

          {/* Section dépliable pour visualiser les données brutes sous-jacentes */}
          {result.donnees !== null && result.donnees !== undefined && (
            <div className="mt-3.5 border-t border-[#F0E6DC] pt-2.5">
              <button
                type="button"
                onClick={() => setIsRawDataOpen((prev) => !prev)}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#612D10] hover:text-[#B85D19] transition-colors"
                aria-expanded={isRawDataOpen}
              >
                <Database className="h-3.5 w-3.5" />
                <span>
                  {isRawDataOpen
                    ? "Masquer les données brutes sources"
                    : "Afficher les données brutes sources"}
                </span>
                {isRawDataOpen ? (
                  <ChevronUp className="h-3.5 w-3.5" />
                ) : (
                  <ChevronDown className="h-3.5 w-3.5" />
                )}
              </button>

              {isRawDataOpen && (
                <div className="mt-2.5 max-h-56 overflow-auto rounded-lg border border-[#E0D4C5] bg-[#FAF6F0] p-3 text-[11px] font-mono text-[#24140D]">
                  <pre className="whitespace-pre-wrap break-all">
                    {JSON.stringify(result.donnees, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
