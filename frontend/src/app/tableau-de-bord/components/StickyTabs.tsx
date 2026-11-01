"use client";

export type DashboardTab = "vue-d-ensemble" | "projets" | "financements" | "registre";

interface StickyTabsProps {
  activeTab: DashboardTab;
  onChange: (tab: DashboardTab) => void;
}

const TABS: Array<{ id: DashboardTab; label: string }> = [
  { id: "vue-d-ensemble", label: "Vue d'ensemble" },
  { id: "projets", label: "Projets" },
  { id: "financements", label: "Financements" },
  { id: "registre", label: "Registre" },
];

export function StickyTabs({ activeTab, onChange }: StickyTabsProps) {
  return (
    <nav
      aria-label="Navigation des vues du tableau de bord"
      className="border-b border-[rgba(60,35,20,0.08)]"
    >
      <div className="flex items-center gap-5 overflow-x-auto no-scrollbar">
        {TABS.map((tab) => {
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
              className={`relative pb-2.5 text-sm shrink-0 transition-colors ${
                isActive
                  ? "font-semibold text-[#21130D]"
                  : "text-[#5A4B42] hover:text-[#21130D]"
              }`}
            >
              {tab.label}
              {isActive && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 rounded-full bg-[#C99A68]" />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
