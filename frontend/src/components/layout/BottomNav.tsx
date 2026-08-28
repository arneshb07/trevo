import React from 'react';

export type NavTab = 'OVERVIEW' | 'DECISIONS' | 'HISTORY';

interface BottomNavProps {
  activeTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  hasUnviewedDecision?: boolean;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  activeTab,
  onSelectTab,
  hasUnviewedDecision = false,
}) => {
  const tabs: NavTab[] = ['OVERVIEW', 'DECISIONS', 'HISTORY'];

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40">
      <nav className="flex items-center gap-1.5 p-1.5 rounded-full bg-white/90 backdrop-blur-md shadow-stitch-float border border-[rgba(15,46,34,0.08)]">
        {tabs.map((tab) => {
          const isActive = activeTab === tab;
          return (
            <button
              key={tab}
              type="button"
              onClick={() => onSelectTab(tab)}
              className={`relative px-6 py-2.5 rounded-full text-xs font-bold tracking-wider transition-all duration-200 ${
                isActive
                  ? 'bg-[#0F2E22] text-white shadow-md'
                  : 'text-[#0F2E22]/70 hover:text-[#0F2E22] hover:bg-[#EEF5F1]'
              }`}
            >
              {tab}
              {tab === 'DECISIONS' && hasUnviewedDecision && !isActive && (
                <span className="absolute top-2 right-3 w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              )}
            </button>
          );
        })}
      </nav>
    </div>
  );
};
