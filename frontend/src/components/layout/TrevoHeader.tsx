import React from 'react';
import { TrevoLogo } from '../common/TrevoLogo';
import { Plus, Wifi, WifiOff, RefreshCw } from 'lucide-react';

interface TrevoHeaderProps {
  mode: 'demo' | 'live';
  onRefresh?: () => void;
  isRefreshing?: boolean;
  onNewStrategy?: () => void;
  showNewStrategy?: boolean;
}

export const TrevoHeader: React.FC<TrevoHeaderProps> = ({
  mode,
  onRefresh,
  isRefreshing = false,
  onNewStrategy,
  showNewStrategy = false,
}) => {
  return (
    <header className="w-full max-w-6xl mx-auto pt-8 pb-4 px-6 flex items-center justify-between">
      <div className="flex items-center gap-4">
        <TrevoLogo size="md" />
        
        {/* Subtle Mode Pill */}
        <div className="hidden sm:flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-white border border-[rgba(15,46,34,0.08)] shadow-sm">
          {mode === 'live' ? (
            <>
              <Wifi className="w-3 h-3 text-emerald-600" />
              <span className="text-emerald-800">Live API</span>
            </>
          ) : (
            <>
              <WifiOff className="w-3 h-3 text-amber-600" />
              <span className="text-amber-800">Demo Mode</span>
            </>
          )}
          {onRefresh && (
            <button
              type="button"
              onClick={onRefresh}
              disabled={isRefreshing}
              className="ml-1 p-0.5 hover:text-emerald-700 transition-colors"
              title="Sync connection"
            >
              <RefreshCw className={`w-2.5 h-2.5 ${isRefreshing ? 'animate-spin' : ''}`} />
            </button>
          )}
        </div>
      </div>

      <div>
        {showNewStrategy && onNewStrategy ? (
          <button
            type="button"
            onClick={onNewStrategy}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-bold text-[#0F2E22] bg-white border border-[rgba(15,46,34,0.1)] hover:bg-[#EEF5F1] shadow-sm transition-all"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Strategy</span>
          </button>
        ) : (
          <div className="text-xs font-semibold text-[#5A7568]">
            CSI Origin 2026
          </div>
        )}
      </div>
    </header>
  );
};
