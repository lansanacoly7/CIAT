"use client";

import { useEffect, useState } from "react";
import {
  Sparkles,
  Send,
  X,
  HelpCircle,
  Clock,
  Layers,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
} from "lucide-react";
import { api } from "@/lib/api";
import type { QuestionAnalyticsResponse } from "../types";

interface AiDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

const SUGGESTIONS = [
  "Combien de projets sont au stade prototype ?",
  "Quel est le montant total des financements mobilisés ?",
  "Quelle est la répartition des projets par cohorte ?",
  "Combien de projets sont dirigés par des femmes ?",
  "Quels sont les domaines prioritaires avec le plus d'idées soumises ?",
  "Combien de projets sont actuellement en incubation active ?",
];

export function AiDrawer({ isOpen, onClose }: AiDrawerProps) {
  const [question, setQuestion] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [response, setResponse] = useState<QuestionAnalyticsResponse | null>(null);
  const [displayedText, setDisplayedText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<string[]>([]);
  const [copied, setCopied] = useState(false);

  // Effet machine à écrire progressif (typewriter)
  useEffect(() => {
    if (!response?.reponse) {
      setDisplayedText("");
      return;
    }

    const fullText = response.reponse;
    let index = 0;
    setDisplayedText("");

    const interval = setInterval(() => {
      index++;
      setDisplayedText(fullText.slice(0, index));
      if (index >= fullText.length) {
        clearInterval(interval);
      }
    }, 15);

    return () => clearInterval(interval);
  }, [response]);

  // Fermeture par touche Echap
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const query = question.trim();
    if (!query || isLoading) return;

    setIsLoading(true);
    setError(null);
    setResponse(null);

    try {
      const res = await api<QuestionAnalyticsResponse>("/analytics/question/", {
        method: "POST",
        body: { question: query },
      });
      setResponse(res);
      setHistory((prev) => [query, ...prev.filter((q) => q !== query).slice(0, 4)]);
    } catch (err: unknown) {
      const errorMsg =
        err instanceof Error ? err.message : "Erreur de traitement de la question.";
      setError(
        errorMsg.includes("503")
          ? "Le service d'analyse IA est temporairement indisponible. Veuillez vérifier la clé API."
          : errorMsg
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = () => {
    if (!response?.reponse) return;
    navigator.clipboard.writeText(response.reponse);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Voile de fond progressif */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-black/40 backdrop-blur-xs transition-opacity duration-300"
      />

      {/* Tiroir coulissant droit 480 px */}
      <aside
        aria-label="Tiroir Assistant décisionnel"
        className="relative z-10 flex h-full w-full max-w-[480px] flex-col border-l border-[rgba(60,35,20,0.12)] bg-[#FFFFFF] shadow-2xl transition-transform duration-300 ease-out"
      >
        {/* En-tête du tiroir */}
        <div className="flex h-16 items-center justify-between border-b border-[rgba(60,35,20,0.08)] bg-[#FBF8F3] px-6">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#21130D] text-[#C99A68]">
              <Sparkles className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-[#21130D]">
                Assistant décisionnel CIAT
              </h2>
              <p className="text-[11px] text-[#8C7E74]">
                Interrogation des données en langage naturel
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-[#8C7E74] transition hover:bg-black/5 hover:text-[#21130D]"
            aria-label="Fermer le tiroir"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Corps du tiroir scrollable */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* Formulaire d'interrogation avec champ large */}
          <form onSubmit={handleSubmit} className="space-y-3">
            <label
              htmlFor="ai-question-input"
              className="text-xs font-semibold uppercase tracking-[0.06em] text-[#8C7E74]"
            >
              Votre question sur les projets et financements
            </label>

            <div className="relative">
              <textarea
                id="ai-question-input"
                rows={3}
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                placeholder="Ex. : Combien de projets sont au stade prototype ?"
                className="w-full resize-none rounded-xl border border-[rgba(60,35,20,0.14)] bg-[#FBF8F3] p-3 text-xs font-medium text-[#21130D] placeholder:text-[#8C7E74] transition focus:border-[#C99A68] focus:bg-white focus:outline-hidden"
              />
            </div>

            <div className="flex justify-between items-center">
              <span className="text-[11px] text-[#8C7E74]">
                Données certifiées CIAT · Agrégation temps réel
              </span>
              <button
                type="submit"
                id="ai-question-submit"
                disabled={isLoading || !question.trim()}
                className="inline-flex items-center gap-2 rounded-xl bg-[#21130D] px-4 py-2 text-xs font-semibold text-[#FBF8F3] transition hover:bg-[#3D2314] disabled:opacity-50 active:scale-95 shadow-sm"
              >
                {isLoading ? (
                  <span>Calcul en cours...</span>
                ) : (
                  <>
                    <Send className="h-3.5 w-3.5 text-[#C99A68]" />
                    <span>Poser la question</span>
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Suggestions en chips défilantes */}
          <div className="space-y-2">
            <div className="text-[11px] font-semibold uppercase tracking-[0.06em] text-[#8C7E74]">
              Suggestions de requêtes
            </div>
            <div className="flex flex-wrap gap-1.5">
              {SUGGESTIONS.map((s, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    setQuestion(s);
                  }}
                  className="rounded-lg border border-[rgba(60,35,20,0.08)] bg-[#FBF8F3] px-2.5 py-1 text-left text-xs font-medium text-[#21130D] transition hover:border-[#C99A68] hover:bg-[#C99A68]/10"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          {/* Résultat de la requête */}
          {error && (
            <div className="rounded-xl border border-[#B85D43]/30 bg-[#B85D43]/5 p-4 text-xs text-[#8B3B26] space-y-1">
              <div className="flex items-center gap-2 font-bold">
                <AlertCircle className="h-4 w-4 text-[#B85D43]" />
                <span>Service temporairement indisponible</span>
              </div>
              <p className="text-[11px]">{error}</p>
            </div>
          )}

          {response && (
            <div className="rounded-2xl border border-[rgba(60,35,20,0.1)] bg-[#FBF8F3] p-4.5 space-y-3 shadow-xs">
              <div className="flex items-center justify-between border-b border-[rgba(60,35,20,0.08)] pb-2.5">
                <div className="flex items-center gap-1.5 text-xs font-bold text-[#21130D]">
                  <CheckCircle2 className="h-4 w-4 text-[#5A7D65]" />
                  <span>Réponse synthétique certifiée</span>
                </div>
                <button
                  type="button"
                  onClick={handleCopy}
                  className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-semibold text-[#8C7E74] hover:bg-white"
                  title="Copier la réponse"
                >
                  {copied ? (
                    <Check className="h-3 w-3 text-emerald-600" />
                  ) : (
                    <Copy className="h-3 w-3" />
                  )}
                  <span>{copied ? "Copié" : "Copier"}</span>
                </button>
              </div>

              {/* Texte animé (effet typewriter) */}
              <div className="text-xs leading-relaxed text-[#21130D] whitespace-pre-wrap font-medium">
                {displayedText}
              </div>

              {/* Filtres ORM exploités */}
              {response.filtres_utilises &&
                Object.keys(response.filtres_utilises).length > 0 && (
                  <div className="pt-2 border-t border-[rgba(60,35,20,0.06)]">
                    <div className="text-[10px] font-semibold uppercase tracking-[0.06em] text-[#8C7E74] mb-1">
                      Périmètre analysé :
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {Object.entries(response.filtres_utilises).map(
                        ([key, val]) => (
                          <span
                            key={key}
                            className="rounded bg-white px-2 py-0.5 text-[10px] text-[#21130D] border border-[rgba(60,35,20,0.08)]"
                          >
                            <strong>{key}</strong>: {val}
                          </span>
                        )
                      )}
                    </div>
                  </div>
                )}
            </div>
          )}

          {/* Historique récent des questions posées */}
          {history.length > 0 && (
            <div className="space-y-2 pt-2 border-t border-[rgba(60,35,20,0.06)]">
              <div className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.06em] text-[#8C7E74]">
                <Clock className="h-3 w-3 text-[#C99A68]" />
                <span>Questions récentes</span>
              </div>
              <div className="space-y-1">
                {history.map((q, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setQuestion(q)}
                    className="block w-full text-left rounded-lg p-2 text-xs text-[#21130D] hover:bg-[#FBF8F3] transition"
                  >
                    • {q}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </aside>
    </div>
  );
}
