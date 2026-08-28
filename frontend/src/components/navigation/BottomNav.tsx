import React from 'react';
import { NavigationTab } from '../../types';

interface BottomNavProps {
  activeTab: NavigationTab;
  onTabChange: (tab: NavigationTab) => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  activeTab,
  onTabChange,
}) => {
  return (
    <nav className="floating-bottom-nav" aria-label="Main Navigation">
      <button
        className={`nav-pill-btn ${activeTab === 'overview' ? 'active' : ''}`}
        onClick={() => onTabChange('overview')}
      >
        Overview
      </button>
      <button
        className={`nav-pill-btn ${activeTab === 'decisions' ? 'active' : ''}`}
        onClick={() => onTabChange('decisions')}
      >
        Decisions
      </button>
      <button
        className={`nav-pill-btn ${activeTab === 'history' ? 'active' : ''}`}
        onClick={() => onTabChange('history')}
      >
        History
      </button>
    </nav>
  );
};
