"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { ApiErrorBanner, DemoBanner } from "@/components/ui";
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
import {
  ArrowLeft,
  ArrowUp,
  BookOpen,
  Check,
  ChevronDown,
  ChevronRight,
  ChevronUp,
  Copy,
  Loader2,
  MessageSquare,
  PanelLeftClose,
  PanelLeftOpen,
  PenTool,
  Plus,
  Scale,
  ShieldCheck,
  Sparkles,
} from "lucide-react";

function formatRelativeTime(dateStr: string): string {
  try {
    const d = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 5) return "À l'instant";
    if (diffMins < 60) return `Il y a ${diffMins} min`;
    if (diffHours < 24) return `Il y a ${diffHours} heure${diffHours > 1 ? "s" : ""}`;
    if (diffDays === 1) return "Hier";
    if (diffDays < 7) return `Il y a ${diffDays} jour${diffDays > 1 ? "s" : ""}`;
    return new Intl.DateTimeFormat("fr-FR", {
      day: "numeric",
      month: "short",
    }).format(d);
  } catch {
    return "";
  }
}

interface SuggestionCard {
  titre: string;
  prompt: string;
}

const SUGGESTIONS_DOCUMENTS: SuggestionCard[] = [
  {
    titre: "Les 4 étapes du parcours d'incubation",
    prompt: "Quelles sont les 4 étapes du parcours d'incubation du CIAT et comment se déroulent-elles ?",
  },
  {
    titre: "Propriété intellectuelle des innovations",
    prompt: "Comment est encadrée la propriété intellectuelle des brevets et innovations développés au CIAT ?",
  },
  {
    titre: "Filières et critères d'éligibilité",
    prompt: "Quelles sont les 7 filières prioritaires et les critères de sélection pour intégrer le CIAT ?",
  },
];

const SUGGESTIONS_ATELIER: SuggestionCard[] = [
  {
    titre: "Structurer le pitch de mon projet",
    prompt: "Aide-moi à structurer le pitch de mon projet en suivant la méthodologie CIAT.",
  },
  {
    titre: "Clarifier le problème et l'impact",
    prompt: "Comment formuler clairement le problème usager et démontrer l'impact mesurable de mon projet ?",
  },
  {
    titre: "Préparer la fiche synthétique",
    prompt: "Aide-moi à rédiger une fiche projet synthétique avec proposition de valeur et verrous techniques.",
  },
];

const MODES: {
  id: AssistantMode;
  titre: string;
  description: string;
  Icon: React.ComponentType<{ className?: string }>;
}[] = [
  {
    id: "documents",
    titre: "Textes et réglementation",
    description:
      "Réponses sourcées sur les documents officiels : parcours, filières, critères, propriété intellectuelle.",
    Icon: Scale,
  },
  {
    id: "atelier",
    titre: "Atelier de rédaction",
    description:
      "Un accompagnement méthodologique pour formuler le problème, la solution et le pitch de votre projet.",
    Icon: PenTool,
  },
];

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

  // Volet historique repliable (à gauche, visible par défaut sur grand écran)
  const [isHistoryOpen, setIsHistoryOpen] = useState(true);
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);

  // Accordéon des sources par message ID
  const [expandedSources, setExpandedSources] = useState<Record<number, boolean>>({});
  // Message dont le texte vient d'être copié
  const [copiedId, setCopiedId] = useState<number | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (messages.length > 0 || sending) {
      scrollToBottom();
    }
  }, [messages, sending]);

  // Compteur pour identifiants locaux optimistes
  const msgCounterRef = useRef(1);

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
    let ignore = false;
    if (!activeConvId) return;

    const loadMessages = async () => {
      setLoadingMessages(true);
      try {
        const msgs = await getMessages(activeConvId);
        if (!ignore) {
          setMessages(msgs);
        }
      } catch (err: unknown) {
        if (!ignore) {
          const apiErr = err as { status?: number };
          setError(
            apiErr?.status === 503
              ? "Service IA temporairement indisponible (503)."
              : "Impossible de charger les messages de cette conversation."
          );
        }
      } finally {
        if (!ignore) {
          setLoadingMessages(false);
        }
      }
    };

    void loadMessages();

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
      setIsMobileDrawerOpen(false);
      setTimeout(() => inputRef.current?.focus(), 100);
    } catch {
      setError("Erreur lors de la création d'une nouvelle conversation.");
    }
  };

  // Envoi d'un message
  const executeSendMessage = async (textToSend: string) => {
    const texte = textToSend.trim();
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

    // Message utilisateur optimiste avec identifiant local
    const tempId = -(msgCounterRef.current++);
    const userMsgOptimiste: MessageAssistant = {
      id: tempId,
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
          if (c.id === targetConvId && (c.titre === "Nouvelle conversation" || c.titre.startsWith("Nouvelle"))) {
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

  const handleSend = (e?: React.FormEvent) => {
    e?.preventDefault();
    executeSendMessage(inputMessage);
  };

  const toggleSourceExpand = (msgId: number) => {
    setExpandedSources((prev) => ({ ...prev, [msgId]: !prev[msgId] }));
  };

  const handleSuggestionClick = (prompt: string) => {
    executeSendMessage(prompt);
  };

  const handleCopy = async (msg: MessageAssistant) => {
    try {
      await navigator.clipboard.writeText(msg.contenu);
      setCopiedId(msg.id);
      setTimeout(() => setCopiedId((cur) => (cur === msg.id ? null : cur)), 2000);
    } catch {
      setError("Impossible de copier le texte dans le presse-papiers.");
    }
  };

  const currentSuggestions = mode === "documents" ? SUGGESTIONS_DOCUMENTS : SUGGESTIONS_ATELIER;
  const isEmpty = !loadingMessages && messages.length === 0;

  // Rendu de la colonne historique
  const renderHistoryContent = () => (
    <div className="flex h-full flex-col bg-white">
      <div className="border-b border-[#EFE4D6] p-4">
        <button
          type="button"
          onClick={handleNewConversation}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#612D10] px-3.5 py-2.5 text-xs font-bold text-white shadow-xs transition-all hover:bg-[#4A200A] active:scale-[0.99] cursor-pointer"
        >
          <Plus className="h-4 w-4" />
          <span>Nouvelle conversation</span>
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-2.5">
        <div className="px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-[#8C6D4F]">
          Historique des échanges
        </div>

        {loadingConversations && (
          <div className="space-y-2 p-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-14 w-full animate-pulse rounded-xl bg-[#FAF7F2]" />
            ))}
          </div>
        )}

        {!loadingConversations && conversations.length === 0 && (
          <div className="p-6 text-center">
            <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-[#FAF7F2] text-[#8C6D4F]">
              <MessageSquare className="h-5 w-5" />
            </div>
            <p className="mt-2 text-xs font-semibold text-[#24140D]">Vos échanges apparaîtront ici</p>
            <p className="mt-1 text-[11px] text-[#7A583A]">
              Commencez une nouvelle conversation pour retrouver vos échanges.
            </p>
          </div>
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
                    setIsMobileDrawerOpen(false);
                  });
                }}
                className={`group mb-1.5 flex w-full items-center justify-between rounded-xl border-l-[3px] p-3 text-left transition-all cursor-pointer ${
                  isActive
                    ? "border-l-[#C99A68] bg-[#F5EFE6] text-[#24140D]"
                    : "border-l-transparent text-[#5C3D2E] hover:bg-[#FAF7F2] hover:text-[#24140D]"
                }`}
              >
                <div className="min-w-0 flex-1 pr-2">
                  <span className={`line-clamp-1 text-xs ${isActive ? "font-bold" : "font-semibold"}`}>
                    {conv.titre}
                  </span>
                  <span className="mt-1 block text-[10px] text-[#8C6D4F]">
                    {formatRelativeTime(conv.cree_le)}
                  </span>
                </div>
                <ChevronRight
                  className={`h-4 w-4 shrink-0 transition-transform ${
                    isActive ? "text-[#A35926]" : "text-[#8C6D4F]/50 group-hover:translate-x-0.5"
                  }`}
                />
              </button>
            );
          })}
      </div>
    </div>
  );

  return (
    <div className="flex h-[calc(100dvh-56px)] lg:h-screen min-h-0 lg:min-h-[640px] bg-[#FAF7F2] overflow-hidden">
      {/* 1. HISTORIQUE (À GAUCHE, REPLIABLE) */}
      <aside
        className={`hidden lg:flex flex-col transition-all duration-300 ease-in-out border-r border-[#EFE4D6] bg-white ${
          isHistoryOpen ? "w-72 xl:w-80" : "w-0 border-r-0 overflow-hidden"
        }`}
      >
        <div className="w-72 xl:w-80 h-full">{renderHistoryContent()}</div>
      </aside>

      {/* 2. ZONE PRINCIPALE DU CHAT */}
      <main className="flex flex-1 min-w-0 flex-col overflow-hidden">
        {/* Barre supérieure sobre */}
        <header className="flex h-14 shrink-0 items-center justify-between border-b border-[#EFE4D6] bg-white/90 backdrop-blur px-4 sm:px-6">
          <div className="flex items-center gap-2.5 min-w-0">
            <button
              type="button"
              onClick={() => {
                if (typeof window !== "undefined" && window.innerWidth >= 1024) {
                  setIsHistoryOpen(!isHistoryOpen);
                } else {
                  setIsMobileDrawerOpen(!isMobileDrawerOpen);
                }
              }}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-[#EFE4D6] bg-white text-[#5C3D2E] hover:border-[#C99A68] hover:bg-[#FAF7F2] transition-colors cursor-pointer"
              title={isHistoryOpen ? "Replier l'historique" : "Afficher l'historique"}
              aria-label={isHistoryOpen ? "Replier l'historique" : "Afficher l'historique"}
            >
              {isHistoryOpen ? <PanelLeftClose className="h-4 w-4" /> : <PanelLeftOpen className="h-4 w-4" />}
            </button>
            <h1 className="truncate font-[family-name:var(--font-title)] text-sm sm:text-base font-bold text-[#24140D]">
              Assistant IA du CIAT
            </h1>
          </div>

          <div className="flex items-center gap-2.5">
            {/* Sélecteur de mode compact */}
            <div className="flex items-center rounded-xl border border-[#EFE4D6] bg-[#FAF7F2] p-1">
              {MODES.map(({ id, Icon }) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => setMode(id)}
                  className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all cursor-pointer ${
                    mode === id
                      ? "bg-[#612D10] text-white shadow-xs"
                      : "text-[#5C3D2E] hover:text-[#24140D]"
                  }`}
                >
                  <Icon className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">{id === "documents" ? "Documents" : "Atelier"}</span>
                </button>
              ))}
            </div>
            <Link
              href="/incubateur/projets"
              className="hidden md:flex h-9 items-center gap-1.5 rounded-xl border border-[#EFE4D6] bg-white px-3 text-xs font-semibold text-[#612D10] hover:border-[#C99A68] hover:bg-[#FAF7F2] transition-colors"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Mes projets
            </Link>
          </div>
        </header>

        {/* Corps des messages & accueil */}
        <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-6">
          <div className="mx-auto max-w-3xl space-y-6">
            {isDemo && <DemoBanner />}

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

            {/* HERO D'ACCUEIL */}
            {isEmpty && (
              <section className="pt-4 sm:pt-8 pb-2 text-center">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-[#C99A68] px-3.5 py-1 text-[10px] font-bold uppercase tracking-wider text-[#1F130B]">
                  <Sparkles className="h-3 w-3" />
                  Référent méthodologique CIAT
                </span>
                <h2 className="mt-4 font-[family-name:var(--font-title)] text-2xl sm:text-3xl font-bold text-[#24140D]">
                  Comment puis-je vous accompagner ?
                </h2>
                <p className="mx-auto mt-2 max-w-xl text-sm leading-relaxed text-[#7A583A]">
                  Choisissez une posture, puis posez votre question ou partez d&apos;une suggestion.
                </p>

                {/* Cartes de mode */}
                <div className="mt-6 grid gap-3 sm:grid-cols-2 text-left">
                  {MODES.map(({ id, titre, description, Icon }) => {
                    const active = mode === id;
                    return (
                      <button
                        key={id}
                        type="button"
                        onClick={() => setMode(id)}
                        aria-pressed={active}
                        className={`group rounded-2xl border p-4 transition-all cursor-pointer ${
                          active
                            ? "border-[#C99A68] bg-white shadow-sm ring-2 ring-[#C99A68]/25"
                            : "border-[#EFE4D6] bg-white/70 hover:border-[#C99A68]/70 hover:bg-white"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <span
                            className={`flex h-10 w-10 items-center justify-center rounded-xl transition-colors ${
                              active ? "bg-[#612D10] text-white" : "bg-[#F5EFE6] text-[#612D10]"
                            }`}
                          >
                            <Icon className="h-5 w-5" />
                          </span>
                          <span className="font-[family-name:var(--font-title)] text-sm font-bold text-[#24140D]">
                            {titre}
                          </span>
                        </div>
                        <p className="mt-2.5 text-xs leading-relaxed text-[#7A583A]">{description}</p>
                      </button>
                    );
                  })}
                </div>

                {/* Suggestions en pilules */}
                <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
                  {currentSuggestions.map((item) => (
                    <button
                      key={item.titre}
                      type="button"
                      onClick={() => handleSuggestionClick(item.prompt)}
                      className="rounded-full border border-[#E5D8C9] bg-white px-4 py-2 text-xs font-semibold text-[#612D10] transition-all hover:border-[#C99A68] hover:bg-[#FAF7F2] active:scale-[0.98] cursor-pointer"
                    >
                      {item.titre}
                    </button>
                  ))}
                </div>
              </section>
            )}

            {/* Chargement des messages */}
            {loadingMessages && (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className={`flex ${i % 2 === 0 ? "justify-end" : "justify-start"}`}>
                    <div className="h-20 w-72 animate-pulse rounded-2xl bg-white border border-[#EFE4D6]" />
                  </div>
                ))}
              </div>
            )}

            {/* Fil des messages */}
            {!loadingMessages &&
              messages.map((msg) => {
                const isUser = msg.role === "user";
                const hasSources = msg.sources && msg.sources.length > 0;
                const isExpanded = expandedSources[msg.id] ?? true;
                const copied = copiedId === msg.id;

                return (
                  <div
                    key={msg.id}
                    className={`flex items-start gap-3 ${isUser ? "flex-row-reverse" : "flex-row"}`}
                  >
                    <div
                      className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-[10px] font-bold ${
                        isUser
                          ? "bg-[#F0E7DB] text-[#612D10] border border-[#E8DACB]"
                          : "bg-[#612D10] text-[#C99A68]"
                      }`}
                    >
                      {isUser ? "Moi" : <Sparkles className="h-4 w-4" />}
                    </div>

                    <div className={`min-w-0 max-w-[85%] ${isUser ? "" : "flex-1"}`}>
                      <div
                        className={`rounded-2xl p-4 sm:p-5 ${
                          isUser
                            ? "rounded-tr-md bg-[#612D10] text-white shadow-xs"
                            : "rounded-tl-md border border-[#EFE4D6] border-l-[3px] border-l-[#C99A68] bg-white text-[#24140D] shadow-2xs"
                        }`}
                      >
                        <div className="whitespace-pre-line text-sm leading-relaxed">{msg.contenu}</div>

                        {/* Sources documentaires */}
                        {!isUser && hasSources && (
                          <div className="mt-4 border-t border-[#EFE4D6] pt-3">
                            <button
                              type="button"
                              onClick={() => toggleSourceExpand(msg.id)}
                              className="flex w-full items-center justify-between text-xs font-bold text-[#24140D] hover:text-[#A35926] transition-colors cursor-pointer"
                            >
                              <span className="flex items-center gap-1.5">
                                <ShieldCheck className="h-4 w-4 text-[#A35926]" />
                                {msg.sources.length} source{msg.sources.length > 1 ? "s" : ""} officielle
                                {msg.sources.length > 1 ? "s" : ""}
                              </span>
                              <span className="flex items-center gap-1 text-[11px] text-[#7A583A]">
                                {isExpanded ? (
                                  <>
                                    <span>Masquer</span>
                                    <ChevronUp className="h-3.5 w-3.5" />
                                  </>
                                ) : (
                                  <>
                                    <span>Afficher</span>
                                    <ChevronDown className="h-3.5 w-3.5" />
                                  </>
                                )}
                              </span>
                            </button>

                            {isExpanded && (
                              <div className="mt-3 space-y-2">
                                {msg.sources.map((src, sIdx) => (
                                  <div
                                    key={sIdx}
                                    className="rounded-xl border border-[#EFE4D6] bg-[#FAF7F2] p-3 text-xs"
                                  >
                                    <div className="flex items-center justify-between gap-2 font-bold text-[#24140D]">
                                      <span className="flex items-center gap-1.5 min-w-0">
                                        <BookOpen className="h-3.5 w-3.5 shrink-0 text-[#A35926]" />
                                        <span className="truncate">{src.titre}</span>
                                      </span>
                                      <span className="shrink-0 rounded-md bg-[#F0E7DB] px-2 py-0.5 text-[10px] text-[#7A583A] font-semibold">
                                        Doc #{src.document_id}
                                      </span>
                                    </div>
                                    <blockquote className="mt-2 border-l-2 border-[#C99A68] pl-2.5 italic leading-relaxed text-[#5C3D2E]">
                                      « {src.extrait} »
                                    </blockquote>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Actions & mention discrète */}
                      {!isUser && (
                        <div className="mt-1.5 flex flex-wrap items-center gap-3 px-1">
                          <button
                            type="button"
                            onClick={() => handleCopy(msg)}
                            className={`inline-flex items-center gap-1.5 rounded-lg px-2 py-1 text-[11px] font-semibold transition-colors cursor-pointer ${
                              copied
                                ? "bg-[#E3F1E9] text-[#2E7D32]"
                                : "text-[#7A583A] hover:bg-[#F5EFE6] hover:text-[#24140D]"
                            }`}
                          >
                            {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                            {copied ? "Copié !" : "Copier"}
                          </button>
                          <span className="text-[10px] italic text-[#8C6D4F]">
                            {msg.avertissement_ia ||
                              "Réponse générée par l'IA du CIAT à titre informatif."}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}

            {/* Réflexion en cours */}
            {sending && (
              <div className="flex items-start gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#612D10] text-[#C99A68]">
                  <Sparkles className="h-4 w-4" />
                </div>
                <div className="rounded-2xl rounded-tl-md border border-[#EFE4D6] border-l-[3px] border-l-[#C99A68] bg-white p-4 shadow-2xs">
                  <div className="flex items-center gap-2.5 text-xs font-semibold text-[#24140D]">
                    <Loader2 className="h-4 w-4 animate-spin text-[#A35926]" />
                    <span>
                      {mode === "documents"
                        ? "Consultation des documents officiels..."
                        : "Structuration de la réponse..."}
                    </span>
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Barre de saisie flottante */}
        <footer className="shrink-0 px-4 sm:px-6 pb-4 pt-2 bg-gradient-to-t from-[#FAF7F2] via-[#FAF7F2] to-transparent">
          <form onSubmit={handleSend} className="mx-auto max-w-3xl">
            <div className="flex items-end gap-2 rounded-2xl border border-[#E5D8C9] bg-white p-2 shadow-lg shadow-[#24140D]/5 transition-all focus-within:border-[#C99A68] focus-within:ring-2 focus-within:ring-[#C99A68]/25">
              <textarea
                ref={inputRef}
                rows={1}
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
                    ? "Posez une question sur le parcours, les critères ou les textes du CIAT..."
                    : "Décrivez votre projet ou votre besoin de rédaction..."
                }
                className="max-h-32 min-h-[44px] w-full resize-none bg-transparent px-3 py-3 text-sm text-[#24140D] placeholder:text-[#8C6D4F]/70 focus:outline-none disabled:opacity-50"
              />
              <button
                type="submit"
                disabled={!inputMessage.trim() || sending}
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#C99A68] text-[#1F130B] shadow-xs transition-all hover:bg-[#B98857] active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                aria-label="Envoyer le message"
              >
                {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowUp className="h-5 w-5 stroke-[2.5]" />}
              </button>
            </div>
            <p className="mt-2 text-center text-[10px] text-[#8C6D4F]">
              Entrée pour envoyer · Maj+Entrée pour un retour à la ligne · L&apos;IA peut se tromper, vérifiez
              les informations importantes.
            </p>
          </form>
        </footer>
      </main>

      {/* TIROIR MOBILE POUR L'HISTORIQUE (DEPUIS LA GAUCHE) */}
      {isMobileDrawerOpen && (
        <div className="fixed inset-0 z-50 flex justify-start lg:hidden">
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-xs transition-opacity"
            onClick={() => setIsMobileDrawerOpen(false)}
          />
          <div className="relative z-10 flex w-full max-w-xs flex-1 flex-col shadow-2xl bg-white">
            {renderHistoryContent()}
          </div>
        </div>
      )}
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
