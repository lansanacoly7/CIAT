"use client";

import { LayoutDashboard, FolderGit2, Coins, TableProperties } from "lucide-react";

export type DashboardTab = "vue-d-ensemble" | "projets" | "financements" | "registre";

interface StickyTabsProps {
  activeTab: DashboardTab;
  onChange: (tab: DashboardTab) => void;
}

const TABS: Array<{ id: DashboardTab; label: string; icon: React.ComponentType<{ className?: string }> }> = [
  { id: "vue-d-ensemble", label: "Vue d'ensemble", icon: LayoutDashboard },
  { id: "projets", label: "Projets", icon: FolderGit2 },
  { id: "financements", label: "Financements", icon: Coins },
  { id: "registre", label: "Registre", icon: TableProperties },
];

export function StickyTabs({ activeTab, onChange }: StickyTabsProps) {
  return (
    <nav
      aria-label="Navigation des vues du tableau de bord"
      className="border-b border-[rgba(60,35,20,0.08)] bg-[#FBF8F3] pt-1"
    >
      <div className="flex items-center gap-2 sm:gap-6 overflow-x-auto no-scrollbar">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={isActive}
              aria-controls={`panel-${tab.id}`}
              id={`tab-${tab.id}`}
              onClick={() => onChange(tab.id)}
              className={`relative pb-3 pt-1 text-sm font-medium transition-colors flex items-center gap-2 shrink-0 ${
                isActive
                  ? "font-semibold text-[#21130D]"
                  : "text-[#5A4B42] hover:text-[#21130D]"
              }`}
            >
              <Icon className={`h-4 w-4 ${isActive ? "text-[#C99A68]" : "text-[#5A4B42]"}`} />
              <span>{tab.label}</span>

              {/* Soulignement actif qui glisse */}
              {isActive && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 rounded-full bg-[#C99A68] transition-all" />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
