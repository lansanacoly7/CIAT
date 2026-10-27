"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import {
  ApiErrorBanner,
  Badge,
  Button,
  DemoBanner,
} from "@/components/ui";
import {
  createConversation,
  getConversations,
  getMessages,
  isDemoMode,
  sendMessage,
  type AssistantMode,
  type Conversation,
  type MessageAssistant,
} from "@/lib/assistant-api";

function formatConversationDate(dateStr: string) {
  try {
    const d = new Date(dateStr);
    return new Intl.DateTimeFormat("fr-FR", {
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    }).format(d);
  } catch {
    return "";
  }
}

function AssistantApp() {
  const [, startTransition] = useTransition();

  // Conversations & État
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConvId, setActiveConvId] = useState<number | null>(null);
  const [messages, setMessages] = useState<MessageAssistant[]>([]);
  const [mode, setMode] = useState<AssistantMode>("documents");
  const [inputMessage, setInputMessage] = useState("");

  // Statuts de chargement & Erreurs
  const [loadingConversations, setLoadingConversations] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isDemo = isDemoMode();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Accordéon des sources par message ID
  const [expandedSources, setExpandedSources] = useState<Record<number, boolean>>({});

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, sending]);

  // 1. Charger les conversations au montage
  useEffect(() => {
    let ignore = false;
    getConversations()
      .then((convs) => {
        if (!ignore) {
          setConversations(convs);
          if (convs.length > 0) {
            setActiveConvId(convs[0].id);
          }
          setLoadingConversations(false);
        }
      })
      .catch((err) => {
        if (!ignore) {
          setError(
            err?.status === 503
              ? "Le service d'assistance IA est actuellement hors ligne (503). Configurez les clés d'API dans backend/.env pour activer la génération en direct."
              : "Impossible de récupérer l'historique de vos conversations."
          );
          setLoadingConversations(false);
        }
      });

    return () => {
      ignore = true;
    };
  }, []);

  // 2. Charger les messages quand la conversation active change
  useEffect(() => {
    if (!activeConvId) return;

    let ignore = false;
    getMessages(activeConvId)
      .then((msgs) => {
        if (!ignore) {
          setMessages(msgs);
          setLoadingMessages(false);
        }
      })
      .catch((err) => {
        if (!ignore) {
          setError(
            err?.status === 503
              ? "Service IA temporairement indisponible (503)."
              : "Impossible de charger les messages de cette conversation."
          );
          setLoadingMessages(false);
        }
      });

    return () => {
      ignore = true;
    };
  }, [activeConvId]);

  // Créer une nouvelle conversation
  const handleNewConversation = async () => {
    try {
      setError(null);
      const newConv = await createConversation("Nouvelle conversation");
      setConversations((prev) => [newConv, ...prev]);
      setActiveConvId(newConv.id);
      setMessages([]);
      setSidebarOpen(false);
      setTimeout(() => inputRef.current?.focus(), 100);
    } catch {
      setError("Erreur lors de la création d'une nouvelle conversation.");
    }
  };

  // Envoi d'un message
  const handleSend = async (e?: React.FormEvent) => {
    e?.preventDefault();
    const texte = inputMessage.trim();
    if (!texte || sending) return;

    setError(null);
    setInputMessage("");

    // Si aucune conversation n'est sélectionnée, en créer une
    let targetConvId = activeConvId;
    if (!targetConvId) {
      try {
        const titleExcerpt = texte.slice(0, 45) + (texte.length > 45 ? "..." : "");
        const newConv = await createConversation(titleExcerpt);
        setConversations((prev) => [newConv, ...prev]);
        targetConvId = newConv.id;
        setActiveConvId(newConv.id);
      } catch {
        setError("Erreur lors de l'initialisation de la conversation.");
        return;
      }
    }

    // Message utilisateur optimiste
    const userMsgOptimiste: MessageAssistant = {
      id: Date.now(),
      role: "user",
      contenu: texte,
      sources: [],
      avertissement_ia: "",
      cree_le: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMsgOptimiste]);
    setSending(true);

    try {
      const responseMsg = await sendMessage(targetConvId, texte, mode);
      setMessages((prev) => [...prev, responseMsg]);

      // Mettre à jour le titre dans la liste si c'était le premier message
      setConversations((prev) =>
        prev.map((c) => {
          if (c.id === targetConvId && c.titre === "Nouvelle conversation") {
            const newTitre = texte.slice(0, 50) + (texte.length > 50 ? "..." : "");
            return { ...c, titre: newTitre };
          }
          return c;
        })
      );
    } catch (err: unknown) {
      const apiErr = err as { status?: number; data?: { detail?: string } };
      if (apiErr?.status === 503) {
        setError(
          apiErr.data?.detail ||
            "Le service d'assistance IA requiert une clé d'API (Groq ou Gemini dans backend/.env) et renvoie actuellement un code 503."
        );
      } else {
        setError("Erreur lors de l'envoi du message. Veuillez réessayer.");
      }
    } finally {
      setSending(false);
    }
  };

  const toggleSourceExpand = (msgId: number) => {
    setExpandedSources((prev) => ({ ...prev, [msgId]: !prev[msgId] }));
  };

  const handleSuggestionClick = (suggestion: string) => {
    setInputMessage(suggestion);
    inputRef.current?.focus();
  };

  return (
    <div className="flex h-[calc(100vh-65px)] min-h-[600px] bg-[#FAF8F5]">
      {/* 1. Volet Latéral / Liste des Conversations */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-72 transform border-r border-bordure bg-white transition-transform duration-200 ease-in-out md:static md:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex h-full flex-col justify-between">
          <div>
            {/* En-tête Volet */}
            <div className="border-b border-bordure/60 p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-beige text-brun-fonce font-black text-xs">
                    IA
                  </div>
                  <div>
                    <h2 className="text-sm font-bold text-brun">Assistant CIAT</h2>
                    <p className="text-[11px] text-texte-doux">RAG & Atelier</p>
                  </div>
                </div>

                {/* Bouton fermeture sur mobile */}
                <button
                  type="button"
                  onClick={() => setSidebarOpen(false)}
                  className="rounded-lg p-1.5 text-texte-doux hover:bg-ivoire md:hidden"
                >
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Bouton Nouvelle Conversation */}
              <Button
                variant="primary"
                onClick={handleNewConversation}
                className="mt-4 w-full justify-center text-xs font-bold"
              >
                <svg className="mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Nouvelle conversation
              </Button>
            </div>

            {/* Liste scrollable des conversations */}
            <div className="overflow-y-auto p-2" style={{ maxHeight: "calc(100vh - 220px)" }}>
              <div className="px-3 py-2 text-[11px] font-bold uppercase tracking-wider text-texte-doux">
                Historique des échanges
              </div>

              {loadingConversations && (
                <div className="space-y-2 p-2">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="h-12 w-full animate-pulse rounded-lg bg-ivoire" />
                  ))}
                </div>
              )}

              {!loadingConversations && conversations.length === 0 && (
                <p className="p-4 text-center text-xs text-texte-doux">
                  Aucune conversation enregistrée. Démarrez un échange !
                </p>
              )}

              {!loadingConversations &&
                conversations.map((conv) => {
                  const isActive = conv.id === activeConvId;
                  return (
                    <button
                      key={conv.id}
                      type="button"
                      onClick={() => {
                        startTransition(() => {
                          setActiveConvId(conv.id);
                          setSidebarOpen(false);
                        });
                      }}
                      className={`group mb-1 flex w-full flex-col items-start rounded-xl p-3 text-left transition-all ${
                        isActive
                          ? "bg-ivoire border border-beige shadow-xs text-brun font-bold"
                          : "text-texte-doux hover:bg-[#FAF8F5] hover:text-brun"
                      }`}
                    >
                      <span className="line-clamp-1 text-xs">{conv.titre}</span>
                      <span className="mt-1 text-[10px] text-[#5A4B42] font-normal">
                        {formatConversationDate(conv.cree_le)}
                      </span>
                    </button>
                  );
                })}
            </div>
          </div>

          {/* Pied Volet Latéral */}
          <div className="border-t border-bordure/60 p-3 bg-ivoire/40 text-center">
            <span className="inline-flex items-center gap-1.5 text-[11px] text-texte-doux font-medium">
              <span className="h-2 w-2 rounded-full bg-succes"></span>
              Modèle conforme Charte CIAT
            </span>
          </div>
        </div>
      </aside>

      {/* Masque sombre pour mobile quand la sidebar est ouverte */}
      {sidebarOpen && (
        <div
          role="presentation"
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 z-30 bg-black/30 md:hidden"
        />
      )}

      {/* 2. Zone Principale du Chat */}
      <main className="flex flex-1 flex-col overflow-hidden">
        {/* Barre Supérieure du Chat */}
        <header className="flex h-16 shrink-0 items-center justify-between border-b border-bordure bg-white px-4 sm:px-6">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setSidebarOpen(true)}
              className="rounded-lg p-2 text-brun hover:bg-ivoire md:hidden"
              aria-label="Ouvrir le menu des conversations"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>

            <div>
              <h1 className="text-sm font-bold text-brun sm:text-base">
                {conversations.find((c) => c.id === activeConvId)?.titre || "Assistant IA CIAT"}
              </h1>
              <p className="text-[11px] text-texte-doux">
                {mode === "documents"
                  ? "Mode Documents : recherche stricte basée sur les textes officiels"
                  : "Mode Atelier : accompagnement méthodologique à la rédaction"}
              </p>
            </div>
          </div>

          {/* Sélecteur de Mode (Documents / Atelier) */}
          <div className="flex items-center rounded-xl border border-bordure bg-[#FAF8F5] p-1">
            <button
              type="button"
              onClick={() => setMode("documents")}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                mode === "documents"
                  ? "bg-brun text-white shadow-xs"
                  : "text-texte-doux hover:text-brun"
              }`}
            >
              <span>Documents CIAT</span>
            </button>
            <button
              type="button"
              onClick={() => setMode("atelier")}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                mode === "atelier"
                  ? "bg-beige text-brun-fonce font-bold shadow-xs"
                  : "text-texte-doux hover:text-brun"
              }`}
            >
              <span>Atelier Rédaction</span>
            </button>
          </div>
        </header>

        {/* Corps des Messages */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          {/* Bandeau Mode Démonstration */}
          {isDemo && <DemoBanner />}

          {/* Bandeau d'erreur globale */}
          {error && (
            <ApiErrorBanner
              message={error}
              onRetry={() => {
                if (activeConvId) {
                  getMessages(activeConvId).then(setMessages).catch(() => {});
                }
              }}
            />
          )}

          {/* Écran d'accueil si conversation vide */}
          {!loadingMessages && messages.length === 0 && (
            <div className="mx-auto max-w-2xl py-8 text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-beige/20 text-brun">
                <svg className="h-8 w-8 text-beige" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                </svg>
              </div>
              <h2 className="mt-4 text-xl font-bold text-brun">
                Bienvenue sur l&apos;Assistant IA du CIAT
              </h2>
              <p className="mt-2 text-xs text-texte-doux max-w-lg mx-auto leading-relaxed">
                {mode === "documents"
                  ? "Interrogez le corpus officiel (règlements, chartes, dossiers d'appel) pour obtenir des réponses exactes et sourcées."
                  : "Bénéficiez d'un accompagnement pas-à-pas pour structurer votre pitch, votre matrice SWOT ou votre fiche projet."}
              </p>

              {/* Suggestions cliquables */}
              <div className="mt-8 grid grid-cols-1 gap-3 sm:grid-cols-3">
                <button
                  type="button"
                  onClick={() =>
                    handleSuggestionClick("Quelles sont les 4 étapes du parcours d'incubation du CIAT ?")
                  }
                  className="rounded-xl border border-bordure bg-white p-3 text-left text-xs font-semibold text-brun transition hover:border-beige hover:bg-ivoire shadow-xs"
                >
                  <span className="block text-[11px] text-[#5A4B42] font-bold uppercase mb-1">
                    Parcours
                  </span>
                  Quelles sont les étapes du parcours d&apos;incubation ?
                </button>
                <button
                  type="button"
                  onClick={() =>
                    handleSuggestionClick("Comment est gérée la propriété intellectuelle des projets incubés ?")
                  }
                  className="rounded-xl border border-bordure bg-white p-3 text-left text-xs font-semibold text-brun transition hover:border-beige hover:bg-ivoire shadow-xs"
                >
                  <span className="block text-[11px] text-[#5A4B42] font-bold uppercase mb-1">
                    Propriété
                  </span>
                  Comment est gérée la propriété intellectuelle des brevets ?
                </button>
                <button
                  type="button"
                  onClick={() =>
                    handleSuggestionClick("Aide-moi à structurer le pitch de mon projet d'irrigation solaire.")
                  }
                  className="rounded-xl border border-bordure bg-white p-3 text-left text-xs font-semibold text-brun transition hover:border-beige hover:bg-ivoire shadow-xs"
                >
                  <span className="block text-[11px] text-[#5A4B42] font-bold uppercase mb-1">
                    Atelier
                  </span>
                  Aide-moi à structurer le pitch de mon projet innovant.
                </button>
              </div>
            </div>
          )}

          {/* Chargement des messages */}
          {loadingMessages && (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className={`flex ${i % 2 === 0 ? "justify-end" : "justify-start"}`}
                >
                  <div className="h-16 w-64 animate-pulse rounded-2xl bg-white border border-bordure" />
                </div>
              ))}
            </div>
          )}

          {/* Fil des Messages */}
          {!loadingMessages &&
            messages.map((msg) => {
              const isUser = msg.role === "user";
              const hasSources = msg.sources && msg.sources.length > 0;
              const isExpanded = expandedSources[msg.id] ?? true;

              return (
                <div
                  key={msg.id}
                  className={`flex items-start gap-3 ${
                    isUser ? "flex-row-reverse" : "flex-row"
                  }`}
                >
                  {/* Avatar */}
                  <div
                    className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-xs font-bold shadow-xs ${
                      isUser
                        ? "bg-brun text-white"
                        : "bg-beige text-brun-fonce border border-[#b88755]"
                    }`}
                  >
                    {isUser ? "Vous" : "CIAT"}
                  </div>

                  {/* Bulle de Message */}
                  <div
                    className={`max-w-2xl rounded-2xl p-4 sm:p-5 shadow-xs ${
                      isUser
                        ? "bg-brun text-white"
                        : "bg-white text-brun border border-bordure"
                    }`}
                  >
                    {/* Corps du texte */}
                    <div className="whitespace-pre-line text-sm leading-relaxed">
                      {msg.contenu}
                    </div>

                    {/* Sources Documentaires Citées */}
                    {!isUser && hasSources && (
                      <div className="mt-4 border-t border-bordure/60 pt-3">
                        <button
                          type="button"
                          onClick={() => toggleSourceExpand(msg.id)}
                          className="flex w-full items-center justify-between text-xs font-bold text-brun hover:text-beige"
                        >
                          <span className="flex items-center gap-1.5">
                            <svg className="h-4 w-4 text-beige" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1.5 1.5 0 011.06.44l5.414 5.414a1.5 1.5 0 01.44 1.06V19a2 2 0 01-2 2z" />
                            </svg>
                            {msg.sources.length} source{msg.sources.length > 1 ? "s" : ""} documentaire{msg.sources.length > 1 ? "s" : ""} citée{msg.sources.length > 1 ? "s" : ""}
                          </span>
                          <span className="text-[11px] text-texte-doux">
                            {isExpanded ? "Masquer ▲" : "Afficher ▼"}
                          </span>
                        </button>

                        {isExpanded && (
                          <div className="mt-3 space-y-2">
                            {msg.sources.map((src, sIdx) => (
                              <div
                                key={sIdx}
                                className="rounded-xl border border-bordure bg-[#FAF8F5] p-3 text-xs"
                              >
                                <div className="flex items-center justify-between font-bold text-brun">
                                  <span>{src.titre}</span>
                                  <Badge tone="info">Doc #{src.document_id}</Badge>
                                </div>
                                <blockquote className="mt-1.5 text-texte-doux italic leading-relaxed border-l-2 border-beige pl-2">
                                  « {src.extrait} »
                                </blockquote>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Mention légale obligatoire IA */}
                    {!isUser && (
                      <p className="mt-3 text-[10px] text-texte-doux italic border-t border-bordure/40 pt-2">
                        {msg.avertissement_ia ||
                          "Réponse générée par l'intelligence artificielle du CIAT à titre informatif."}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}

          {/* Animation Pendant la Réflexion */}
          {sending && (
            <div className="flex items-start gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-beige text-brun-fonce font-bold text-xs animate-pulse">
                IA
              </div>
              <div className="rounded-2xl border border-bordure bg-white p-4 shadow-xs">
                <div className="flex items-center gap-2 text-xs font-semibold text-brun">
                  <span className="flex h-2 w-2 rounded-full bg-beige animate-ping" />
                  <span>
                    {mode === "documents"
                      ? "Consultation et extraction des documents officiels..."
                      : "Structuration méthodique de la réponse..."}
                  </span>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Barre de Saisie Inférieure */}
        <footer className="border-t border-bordure bg-white p-4 sm:p-5">
          <form onSubmit={handleSend} className="mx-auto max-w-4xl">
            <div className="relative flex items-end gap-2 rounded-2xl border border-bordure bg-white p-2 shadow-sm focus-within:border-beige focus-within:ring-1 focus-within:ring-beige">
              <textarea
                ref={inputRef}
                rows={2}
                value={inputMessage}
                disabled={sending}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
                placeholder={
                  mode === "documents"
                    ? "Posez votre question sur les règles, filières ou documents du CIAT (Entrée pour envoyer)..."
                    : "Décrivez votre projet pour structurer votre pitch ou matrice SWOT (Entrée pour envoyer)..."
                }
                className="w-full resize-none bg-transparent px-3 py-2 text-sm text-brun placeholder:text-texte-doux focus:outline-none disabled:opacity-50"
              />

              <Button
                type="submit"
                variant="primary"
                disabled={!inputMessage.trim() || sending}
                className="shrink-0 !min-h-[44px] !px-4 text-xs font-bold"
              >
                {sending ? (
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                ) : (
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                  </svg>
                )}
                <span className="hidden sm:inline ml-1.5">Envoyer</span>
              </Button>
            </div>

            <div className="mt-2 flex items-center justify-between text-[11px] text-texte-doux px-1">
              <span>
                Mode actuel :{" "}
                <strong className="text-brun">
                  {mode === "documents" ? "Recherche documentaire stricte" : "Atelier de rédaction assistée"}
                </strong>
              </span>
              <span>Maj+Entrée pour retour à la ligne</span>
            </div>
          </form>
        </footer>
      </main>
    </div>
  );
}

export default function AssistantPage() {
  return (
    <ProtectedRoute>
      <AssistantApp />
    </ProtectedRoute>
  );
}
