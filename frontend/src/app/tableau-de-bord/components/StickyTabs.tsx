"use client";

import { FolderGit2, Coins } from "lucide-react";

export type DashboardTab = "projets" | "financements";

interface StickyTabsProps {
  activeTab: DashboardTab;
  onChange: (tab: DashboardTab) => void;
  projetsCount?: number;
  financementsAmount?: string;
}

export function StickyTabs({
  activeTab,
  onChange,
  projetsCount = 62,
  financementsAmount = "472 M FCFA",
}: StickyTabsProps) {
  return (
    <div className="sticky top-[68px] z-20 border-b border-[rgba(60,35,20,0.08)] bg-[#FBF8F3]/90 backdrop-blur-xs py-1">
      <div className="flex items-center gap-6">
        {/* Onglet 1 : Projets */}
        <button
          type="button"
          onClick={() => onChange("projets")}
          className={`relative pb-3 pt-1 text-sm font-semibold transition-colors flex items-center gap-2 ${
            activeTab === "projets"
              ? "text-[#21130D]"
              : "text-[#5A4B42] hover:text-[#21130D]"
          }`}
        >
          <FolderGit2 className="h-4 w-4" />
          <span>Projets & Maturation</span>
          <span
            className={`rounded-full px-2 py-0.5 text-xs font-semibold tabular-nums ${
              activeTab === "projets"
                ? "bg-[#21130D] text-[#FBF8F3]"
                : "bg-black/5 text-[#5A4B42]"
            }`}
          >
            {projetsCount}
          </span>

          {/* Soulignement actif qui glisse */}
          {activeTab === "projets" && (
            <span className="absolute bottom-0 left-0 right-0 h-0.5 rounded-full bg-[#C99A68] transition-all" />
          )}
        </button>

        {/* Onglet 2 : Financements & Partenariats */}
        <button
          type="button"
          onClick={() => onChange("financements")}
          className={`relative pb-3 pt-1 text-sm font-semibold transition-colors flex items-center gap-2 ${
            activeTab === "financements"
              ? "text-[#21130D]"
              : "text-[#5A4B42] hover:text-[#21130D]"
          }`}
        >
          <Coins className="h-4 w-4" />
          <span>Financements & Partenariats</span>
          <span
            className={`rounded-full px-2 py-0.5 text-xs font-semibold tabular-nums ${
              activeTab === "financements"
                ? "bg-[#21130D] text-[#FBF8F3]"
                : "bg-black/5 text-[#5A4B42]"
            }`}
          >
            {financementsAmount}
          </span>

          {/* Soulignement actif qui glisse */}
          {activeTab === "financements" && (
            <span className="absolute bottom-0 left-0 right-0 h-0.5 rounded-full bg-[#C99A68] transition-all" />
          )}
        </button>
      </div>
    </div>
  );
}
