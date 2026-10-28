"use client";

import React, { useState } from "react";
import { Copy, Check } from "lucide-react";

interface FormattedMessageProps {
  content: string;
  isUser: boolean;
}

export default function FormattedMessage({ content, isUser }: FormattedMessageProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    if (!content) return;
    navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // 1. Nettoyage strict des balises HTML parasites et des entités
  const cleanContent = (content || "")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/?(div|p|span|section|article|font)[^>]*>/gi, "\n")
    .replace(/<strong[^>]*>(.*?)<\/strong>/gi, "**$1**")
    .replace(/<b[^>]*>(.*?)<\/b>/gi, "**$1**")
    .replace(/<em[^>]*>(.*?)<\/em>/gi, "*$1*")
    .replace(/<i[^>]*>(.*?)<\/i>/gi, "*$1*")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");

  // Formatage inline (gras, italique, code, badges [À COMPLÉTER])
  const renderInline = (text: string) => {
    const parts: React.ReactNode[] = [];
    const regex = /(\[À COMPLÉTER\s*:[^\]]+\])|(`[^`]+`)|(\*\*[^*]+\*\*)|(\*[^*]+\*)/g;
    let lastIndex = 0;
    let match: RegExpExecArray | null;

    while ((match = regex.exec(text)) !== null) {
      if (match.index > lastIndex) {
        parts.push(text.substring(lastIndex, match.index));
      }

      const matchedText = match[0];

      if (matchedText.startsWith("[À COMPLÉTER")) {
        parts.push(
          <span
            key={match.index}
            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md font-semibold text-xs my-0.5 ${
              isUser
                ? "bg-amber-300 text-amber-950"
                : "bg-amber-100 text-amber-900 border border-amber-300 shadow-2xs"
            }`}
          >
            ⚠️ {matchedText}
          </span>
        );
      } else if (matchedText.startsWith("`") && matchedText.endsWith("`")) {
        parts.push(
          <code
            key={match.index}
            className={`px-1.5 py-0.5 rounded font-mono text-xs ${
              isUser ? "bg-white/20 text-white" : "bg-[#FAF7F2] text-[#612D10] border border-[#EFE4D6]"
            }`}
          >
            {matchedText.slice(1, -1)}
          </code>
        );
      } else if (matchedText.startsWith("**") && matchedText.endsWith("**")) {
        parts.push(
          <strong key={match.index} className={isUser ? "font-bold text-white" : "font-bold text-[#24140D]"}>
            {matchedText.slice(2, -2)}
          </strong>
        );
      } else if (matchedText.startsWith("*") && matchedText.endsWith("*")) {
        parts.push(
          <em key={match.index} className="italic">
            {matchedText.slice(1, -1)}
          </em>
        );
      }

      lastIndex = regex.lastIndex;
    }

    if (lastIndex < text.length) {
      parts.push(text.substring(lastIndex));
    }

    return parts;
  };

  // Découpage en blocs de texte, titres et listes
  const lines = cleanContent.split("\n");
  const blocks: React.ReactNode[] = [];
  let currentList: { type: "ul" | "ol"; items: string[] } | null = null;

  const flushList = () => {
    if (!currentList) return;
    if (currentList.type === "ul") {
      blocks.push(
        <ul key={`list-${blocks.length}`} className="my-2 space-y-1.5 pl-1">
          {currentList.items.map((item, idx) => (
            <li key={idx} className="flex items-start gap-2.5 text-sm">
              <span
                className={`mt-1.5 h-1.5 w-1.5 rounded-full shrink-0 ${
                  isUser ? "bg-white/70" : "bg-[#C99A68]"
                }`}
                aria-hidden="true"
              />
              <span className="flex-1 leading-relaxed">{renderInline(item)}</span>
            </li>
          ))}
        </ul>
      );
    } else {
      blocks.push(
        <ol key={`list-${blocks.length}`} className="my-2 space-y-1.5 pl-1">
          {currentList.items.map((item, idx) => (
            <li key={idx} className="flex items-start gap-2.5 text-sm">
              <span
                className={`inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[11px] font-bold ${
                  isUser ? "bg-white/20 text-white" : "bg-[#FAF7F2] border border-[#C99A68]/40 text-[#612D10]"
                }`}
              >
                {idx + 1}
              </span>
              <span className="flex-1 leading-relaxed mt-0.5">{renderInline(item)}</span>
            </li>
          ))}
        </ol>
      );
    }
    currentList = null;
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    if (!line) {
      flushList();
      continue;
    }

    // Titres Markdown
    if (line.startsWith("### ")) {
      flushList();
      blocks.push(
        <h4
          key={`h4-${i}`}
          className={`font-title font-bold text-sm sm:text-base mt-3.5 mb-1 tracking-tight ${
            isUser ? "text-white" : "text-[#612D10]"
          }`}
        >
          {renderInline(line.slice(4))}
        </h4>
      );
      continue;
    }

    if (line.startsWith("## ")) {
      flushList();
      blocks.push(
        <h3
          key={`h3-${i}`}
          className={`font-title font-extrabold text-base sm:text-lg mt-4 mb-1.5 tracking-tight ${
            isUser ? "text-white" : "text-[#24140D]"
          }`}
        >
          {renderInline(line.slice(3))}
        </h3>
      );
      continue;
    }

    if (line.startsWith("# ")) {
      flushList();
      blocks.push(
        <h2
          key={`h2-${i}`}
          className={`font-title font-extrabold text-lg sm:text-xl mt-4 mb-2 tracking-tight ${
            isUser ? "text-white" : "text-[#24140D]"
          }`}
        >
          {renderInline(line.slice(2))}
        </h2>
      );
      continue;
    }

    // Puces non ordonnées (- ou *)
    if (/^[-*]\s+/.test(line)) {
      const itemText = line.replace(/^[-*]\s+/, "");
      if (!currentList || currentList.type !== "ul") {
        flushList();
        currentList = { type: "ul", items: [itemText] };
      } else {
        currentList.items.push(itemText);
      }
      continue;
    }

    // Listes numérotées (1. ou 1))
    if (/^\d+[.)]\s+/.test(line)) {
      const itemText = line.replace(/^\d+[.)]\s+/, "");
      if (!currentList || currentList.type !== "ol") {
        flushList();
        currentList = { type: "ol", items: [itemText] };
      } else {
        currentList.items.push(itemText);
      }
      continue;
    }

    // Paragraphe classique
    flushList();
    blocks.push(
      <p key={`p-${i}`} className="text-sm leading-relaxed my-1.5">
        {renderInline(line)}
      </p>
    );
  }

  flushList();

  return (
    <div className="relative group/msg">
      <div className="space-y-0.5">{blocks}</div>

      {!isUser && (
        <div className="mt-3 flex items-center justify-end border-t border-bordure/40 pt-2">
          <button
            type="button"
            onClick={handleCopy}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold text-texte-doux hover:text-brun hover:bg-ivoire transition-colors cursor-pointer"
            title="Copier la réponse"
          >
            {copied ? (
              <>
                <Check className="h-3.5 w-3.5 text-emerald-600" />
                <span className="text-emerald-700 font-bold">Copié !</span>
              </>
            ) : (
              <>
                <Copy className="h-3.5 w-3.5 text-beige" />
                <span>Copier</span>
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
}
