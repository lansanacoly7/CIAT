"use client";

import { useEffect, useRef, useState, useTransition } from "react";
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
  ArrowRight,
  BookOpen,
  ChevronDown,
  ChevronRight,
  ChevronUp,
  FileText,
  Info,
  Loader2,
  MessageSquare,
  PanelRightClose,
  PanelRightOpen,
  PenTool,
  Plus,
  Send,
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
  tag: string;
  titre: string;
  description: string;
  prompt: string;
}

const SUGGESTIONS_DOCUMENTS: SuggestionCard[] = [
  {
    tag: "DOCUMENTS",
    titre: "Comprendre le parcours d'incubation",
    description: "Découvrez les 4 étapes, la durée et les conditions du programme.",
    prompt: "Quelles sont les 4 étapes du parcours d'incubation du CIAT et comment se déroulent-elles ?",
  },
  {
    tag: "DOCUMENTS",
    titre: "Retrouver une règle dans les documents",
    description: "Accédez aux textes officiels, propriété intellectuelle et guides du CIAT.",
    prompt: "Comment est encadrée la propriété intellectuelle des brevets et innovations développés au CIAT ?",
  },
  {
    tag: "DOCUMENTS",
    titre: "Filières et critères d'éligibilité",
    description: "Vérifiez les 7 filières stratégiques et les conditions requises pour postuler.",
    prompt: "Quelles sont les 7 filières prioritaires et les critères de sélection pour intégrer le CIAT ?",
  },
];

const SUGGESTIONS_ATELIER: SuggestionCard[] = [
  {
    tag: "RÉDACTION",
    titre: "Structurer le pitch de mon projet",
    description: "Bénéficiez de conseils pour un pitch clair, percutant et convaincant.",
    prompt: "Aide-moi à structurer le pitch de mon projet en suivant la méthodologie CIAT.",
  },
  {
    tag: "RÉDACTION",
    titre: "Clarifier le problème & l'impact",
    description: "Formulez le problème critique et chiffrez les pertes pour vos usagers.",
    prompt: "Comment formuler clairement le problème usager et démontrer l'impact mesurable de mon projet ?",
  },
  {
    tag: "RÉDACTION",
    titre: "Préparer la fiche synthétique",
    description: "Définissez la proposition de valeur et les verrous techniques à lever.",
    prompt: "Aide-moi à rédiger une fiche projet synthétique avec proposition de valeur et verrous techniques.",
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

  // Volet historique repliable (visible par défaut sur grand écran)
  const [isHistoryOpen, setIsHistoryOpen] = useState(true);
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);

  // Accordéon des sources par message ID
  const [expandedSources, setExpandedSources] = useState<Record<number, boolean>>({});

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

  const currentSuggestions = mode === "documents" ? SUGGESTIONS_DOCUMENTS : SUGGESTIONS_ATELIER;

  // Rendu de la colonne historique
  const renderHistoryContent = () => (
    <div className="flex h-full flex-col justify-between bg-white">
      <div>
        {/* En-tête épuré Volet Historique : Action directe */}
        <div className="border-b border-[#EFE4D6] p-3.5">
          <button
            type="button"
            onClick={handleNewConversation}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#2E1605] px-3.5 py-2.5 text-xs font-bold text-white shadow-xs transition-all hover:bg-[#422212] active:scale-[0.99]"
          >
            <Plus className="h-4 w-4" />
            <span>Nouvelle conversation</span>
          </button>
        </div>

        {/* Liste scrollable des conversations */}
        <div className="overflow-y-auto p-2" style={{ maxHeight: "calc(100vh - 180px)" }}>
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
                  className={`group mb-1.5 flex w-full items-center justify-between rounded-xl p-3 text-left transition-all ${
                    isActive
                      ? "border border-[#E8DACB] bg-[#F5EFE6] font-bold text-[#24140D] shadow-xs"
                      : "text-[#5C3D2E] hover:bg-[#FAF7F2] hover:text-[#24140D]"
                  }`}
                >
                  <div className="min-w-0 flex-1 pr-2">
                    <span className="line-clamp-1 text-xs font-semibold">{conv.titre}</span>
                    <span className="mt-1 block text-[10px] text-[#8C6D4F]">
                      {formatRelativeTime(conv.cree_le)}
                    </span>
                  </div>
                  <ChevronRight
                    className={`h-4 w-4 shrink-0 transition-transform ${
                      isActive ? "text-[#24140D]" : "text-[#8C6D4F]/60 group-hover:translate-x-0.5 group-hover:text-[#24140D]"
                    }`}
                  />
                </button>
              );
            })}
        </div>
      </div>

      {/* Pied Volet Historique */}
      <div className="border-t border-[#EFE4D6] bg-[#FAF7F2] p-3 text-center">
        <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-[#7A583A]">
          <span className="h-2 w-2 rounded-full bg-[#166534]" />
          Corpus conforme Charte CIAT
        </span>
      </div>
    </div>
  );

  return (
    <div className="flex h-[calc(100dvh-56px)] lg:h-screen min-h-0 lg:min-h-[640px] bg-[#FAF7F2] overflow-hidden">
      {/* 1. ZONE PRINCIPALE DU CHAT (À GAUCHE, COLLÉE AU SIDEBAR PRINCIPAL) */}
      <main className="flex flex-1 flex-col overflow-hidden bg-[#FAF7F2]">
        {/* Barre Supérieure du Chat */}
        <header className="flex h-16 shrink-0 items-center justify-between border-b border-[#EFE4D6] bg-white px-4 sm:px-6">
          {/* Titre sans aucun bouton à gauche */}
          <div className="min-w-0">
            <h1 className="text-sm sm:text-base font-bold text-[#24140D] truncate">
              Assistant IA du CIAT
            </h1>
            <p className="text-[11px] text-[#7A583A] truncate">
              Des réponses sourcées ou un accompagnement pour structurer votre projet.
            </p>
          </div>

          {/* Contrôles à droite : Modes & Bouton Historique */}
          <div className="flex items-center gap-3">
            {/* Sélecteur de Mode Segmenté */}
            <div className="flex items-center rounded-xl border border-[#EFE4D6] bg-[#FAF7F2] p-1 shadow-2xs">
              <button
                type="button"
                onClick={() => setMode("documents")}
                className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
                  mode === "documents"
                    ? "bg-[#2E1605] text-white shadow-xs"
                    : "text-[#5C3D2E] hover:text-[#24140D]"
                }`}
              >
                <BookOpen className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Documents CIAT</span>
                <span className="sm:hidden">Documents</span>
              </button>
              <button
                type="button"
                onClick={() => setMode("atelier")}
                className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
                  mode === "atelier"
                    ? "bg-[#2E1605] text-white shadow-xs"
                    : "text-[#5C3D2E] hover:text-[#24140D]"
                }`}
              >
                <PenTool className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Atelier Rédaction</span>
                <span className="sm:hidden">Atelier</span>
              </button>
            </div>

            {/* Bouton icône compact unique pour Replier / Déplier l'historique sur la droite */}
            <button
              type="button"
              onClick={() => {
                if (typeof window !== "undefined" && window.innerWidth >= 1024) {
                  setIsHistoryOpen(!isHistoryOpen);
                } else {
                  setIsMobileDrawerOpen(!isMobileDrawerOpen);
                }
              }}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-[#EFE4D6] bg-white text-[#5C3D2E] hover:border-[#C99A68] hover:bg-[#FAF7F2] hover:text-[#24140D] transition-colors shadow-2xs"
              title={isHistoryOpen ? "Replier le volet d'historique" : "Déplier le volet d'historique"}
              aria-label={isHistoryOpen ? "Replier le volet d'historique" : "Déplier le volet d'historique"}
            >
              {isHistoryOpen ? (
                <PanelRightClose className="h-4.5 w-4.5" />
              ) : (
                <PanelRightOpen className="h-4.5 w-4.5" />
              )}
            </button>
          </div>
        </header>

        {/* Corps des Messages & Accueil */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          {/* Bandeau Mode Démonstration */}
          {isDemo && <DemoBanner />}

          {/* Bandeau d'erreur */}
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

          {/* ÉTAT D'ACCUEIL : SUGGESTIONS FONCTIONNELLES (quand aucun message dans la conversation) */}
          {!loadingMessages && messages.length === 0 && (
            <div className="mx-auto max-w-5xl space-y-4 pt-4 pb-6">
              {/* 3 Cartes de suggestions fonctionnelles */}
              <div>
                <div className="mb-3 flex items-center justify-between px-1">
                  <span className="text-sm font-bold text-[#24140D]">
                    Suggestions d&apos;actions immédiates
                  </span>
                  <span className="text-xs text-[#7A583A]">
                    Mode {mode === "documents" ? "Documents CIAT" : "Atelier Rédaction"}
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {currentSuggestions.map((item, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleSuggestionClick(item.prompt)}
                      className="group flex flex-col justify-between rounded-2xl border border-[#EFE4D6] bg-white p-5 text-left shadow-xs transition-all hover:border-[#C99A68] hover:shadow-md active:scale-[0.99]"
                    >
                      <div>
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-[#A35926]">
                            {item.tag}
                          </span>
                          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#2E1605] text-white">
                            {mode === "documents" ? (
                              <FileText className="h-3.5 w-3.5" />
                            ) : (
                              <PenTool className="h-3.5 w-3.5" />
                            )}
                          </div>
                        </div>
                        <h3 className="mt-3 text-sm font-bold text-[#24140D] group-hover:text-[#A35926] transition-colors">
                          {item.titre}
                        </h3>
                        <p className="mt-1.5 text-xs text-[#5C3D2E] leading-relaxed">
                          {item.description}
                        </p>
                      </div>

                      <div className="mt-4 flex items-center justify-end">
                        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#FAF7F2] border border-[#EFE4D6] text-[#24140D] transition-transform group-hover:translate-x-1 group-hover:bg-[#F5EFE6]">
                          <ArrowRight className="h-3.5 w-3.5" />
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Chargement des messages */}
          {loadingMessages && (
            <div className="space-y-4 max-w-4xl mx-auto">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className={`flex ${i % 2 === 0 ? "justify-end" : "justify-start"}`}
                >
                  <div className="h-20 w-72 animate-pulse rounded-2xl bg-white border border-[#EFE4D6]" />
                </div>
              ))}
            </div>
          )}

          {/* Fil des Messages de la conversation */}
          {!loadingMessages &&
            messages.map((msg) => {
              const isUser = msg.role === "user";
              const hasSources = msg.sources && msg.sources.length > 0;
              const isExpanded = expandedSources[msg.id] ?? true;

              return (
                <div
                  key={msg.id}
                  className={`flex items-start gap-3 max-w-4xl mx-auto ${
                    isUser ? "flex-row-reverse" : "flex-row"
                  }`}
                >
                  {/* Avatar sobre institutionnel */}
                  <div
                    className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-xs font-bold shadow-xs ${
                      isUser
                        ? "bg-[#2E1605] text-white"
                        : "bg-[#F0E7DB] text-[#24140D] border border-[#E8DACB]"
                    }`}
                  >
                    {isUser ? "Vous" : "CIAT"}
                  </div>

                  {/* Bulle de Message */}
                  <div
                    className={`max-w-2xl rounded-2xl p-4 sm:p-5 shadow-xs ${
                      isUser
                        ? "bg-[#2E1605] text-white"
                        : "bg-white text-[#24140D] border border-[#EFE4D6]"
                    }`}
                  >
                    {/* Contenu */}
                    <div className="whitespace-pre-line text-sm leading-relaxed">
                      {msg.contenu}
                    </div>

                    {/* Sources Documentaires Citées (Mode Documents) */}
                    {!isUser && hasSources && (
                      <div className="mt-4 border-t border-[#EFE4D6] pt-3">
                        <button
                          type="button"
                          onClick={() => toggleSourceExpand(msg.id)}
                          className="flex w-full items-center justify-between text-xs font-bold text-[#24140D] hover:text-[#A35926] transition-colors"
                        >
                          <span className="flex items-center gap-1.5">
                            <BookOpen className="h-4 w-4 text-[#A35926]" />
                            {msg.sources.length} source{msg.sources.length > 1 ? "s" : ""} documentaire{msg.sources.length > 1 ? "s" : ""} officielle{msg.sources.length > 1 ? "s" : ""}
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
                                <div className="flex items-center justify-between font-bold text-[#24140D]">
                                  <span>{src.titre}</span>
                                  <span className="rounded-md bg-[#F0E7DB] px-2 py-0.5 text-[10px] text-[#7A583A] font-semibold">
                                    Doc #{src.document_id}
                                  </span>
                                </div>
                                <blockquote className="mt-2 text-[#5C3D2E] italic leading-relaxed border-l-2 border-[#A35926] pl-2.5">
                                  « {src.extrait} »
                                </blockquote>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Mention légale institutionnelle */}
                    {!isUser && (
                      <p className="mt-3 text-[10px] text-[#7A583A] italic border-t border-[#EFE4D6]/50 pt-2">
                        {msg.avertissement_ia ||
                          "Réponse générée par l'intelligence artificielle du CIAT à titre informatif."}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}

          {/* Animation pendant la réflexion (sobre, aucun emoji) */}
          {sending && (
            <div className="flex items-start gap-3 max-w-4xl mx-auto">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#F0E7DB] text-[#24140D] font-bold text-xs border border-[#E8DACB]">
                CIAT
              </div>
              <div className="rounded-2xl border border-[#EFE4D6] bg-white p-4 shadow-xs">
                <div className="flex items-center gap-2.5 text-xs font-semibold text-[#24140D]">
                  <Loader2 className="h-4 w-4 animate-spin text-[#A35926]" />
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

        {/* Zone de Saisie Inférieure */}
        <footer className="border-t border-[#EFE4D6] bg-white p-4 sm:p-5">
          <form onSubmit={handleSend} className="mx-auto max-w-4xl">
            <div className="relative flex items-end gap-2 rounded-2xl border border-[#EFE4D6] bg-white p-2.5 shadow-sm transition-all focus-within:border-[#A35926] focus-within:ring-2 focus-within:ring-[#C99A68]/20">
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
                    ? "Posez votre question sur les textes officiels, le parcours ou les critères du CIAT (Entrée pour envoyer)..."
                    : "Décrivez votre projet, vos objectifs ou votre besoin de rédaction (Entrée pour envoyer)..."
                }
                className="w-full resize-none bg-transparent px-3 py-2 text-sm text-[#24140D] placeholder:text-[#8C6D4F]/70 focus:outline-none disabled:opacity-50"
              />

              <button
                type="submit"
                disabled={!inputMessage.trim() || sending}
                className="flex items-center justify-center shrink-0 min-h-[44px] px-4 rounded-xl bg-[#2E1605] text-white font-bold text-xs shadow-xs transition-all hover:bg-[#422212] disabled:opacity-40 disabled:cursor-not-allowed"
                aria-label="Envoyer le message"
              >
                {sending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
                <span className="hidden sm:inline ml-2">Envoyer</span>
              </button>
            </div>

            <div className="mt-2.5 flex items-center justify-between text-[11px] text-[#7A583A] px-1">
              <span className="flex items-center gap-1.5">
                <Info className="h-3.5 w-3.5 text-[#8C6D4F]" />
                <span>
                  {mode === "documents"
                    ? "Les réponses documentaires s'appuient sur les sources disponibles."
                    : "Atelier méthodologique d'aide à la structuration de projet."}
                </span>
              </span>
              <span className="hidden sm:inline text-[#8C6D4F]/70">
                Entrée pour envoyer &bull; Maj+Entrée pour retour à la ligne
              </span>
            </div>
          </form>
        </footer>
      </main>

      {/* 2. ZONE HISTORIQUE (REPLIABLE SUR LA DROITE) */}
      <aside
        className={`hidden lg:flex flex-col transition-all duration-300 ease-in-out border-l border-[#EFE4D6] bg-white ${
          isHistoryOpen ? "w-72 xl:w-80" : "w-0 border-l-0 overflow-hidden"
        }`}
      >
        <div className="w-72 xl:w-80 h-full">{renderHistoryContent()}</div>
      </aside>

      {/* TIROIR MOBILE POUR L'HISTORIQUE (GLISSANT DEPUIS LA DROITE) */}
      {isMobileDrawerOpen && (
        <div className="fixed inset-0 z-50 flex justify-end lg:hidden">
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
