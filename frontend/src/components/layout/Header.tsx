import React from 'react';
import { Cpu, Wifi, WifiOff, RefreshCw } from 'lucide-react';

interface HeaderProps {
  mode: 'demo' | 'live';
  isOptimizerReady: boolean;
  onRefreshLive?: () => void;
  isRefreshing?: boolean;
}

export const Header: React.FC<HeaderProps> = ({ 
  mode, 
  isOptimizerReady, 
  onRefreshLive,
  isRefreshing = false 
}) => {
  return (
    <header className="border-b border-slate-800 bg-[#0B0F19]/90 backdrop-blur sticky top-0 z-30 px-4 sm:px-8 py-4">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {/* Brand */}
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-cyan-500 flex items-center justify-center font-bold text-xl text-white shadow-lg shadow-blue-500/20">
            T
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold tracking-tight text-white">TREVO</h1>
              <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                Decision Engine
              </span>
            </div>
            <p className="text-xs text-slate-400 font-medium">
              Autonomous Working Capital Decision Engine
            </p>
          </div>
        </div>

        {/* Status Indicators & Controls */}
        <div className="flex items-center flex-wrap gap-2.5">
          {/* Optimizer Status */}
          <div className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <span className={`w-2 h-2 rounded-full bg-emerald-400 mr-2 ${isOptimizerReady ? 'animate-pulse' : ''}`} />
            <Cpu className="w-3.5 h-3.5 mr-1" />
            <span>Optimizer Ready</span>
          </div>

          {/* Environment Mode */}
          <div className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-slate-900 border border-slate-800 text-slate-300">
            {mode === 'live' ? (
              <>
                <Wifi className="w-3.5 h-3.5 mr-1.5 text-emerald-400" />
                <span className="text-emerald-400 font-semibold mr-1">Live Mode</span>
                <span className="text-slate-400 text-[11px]">(Backend Connected)</span>
              </>
            ) : (
              <>
                <WifiOff className="w-3.5 h-3.5 mr-1.5 text-amber-400" />
                <span className="text-amber-400 font-semibold mr-1">Demo Mode</span>
                <span className="text-slate-400 text-[11px]">(Deterministic Mock)</span>
              </>
            )}
          </div>

          {onRefreshLive && (
            <button
              type="button"
              onClick={onRefreshLive}
              disabled={isRefreshing}
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors disabled:opacity-50"
              title="Check backend status & refresh state"
            >
              <RefreshCw className={`w-3 h-3 ${isRefreshing ? 'animate-spin' : ''}`} />
              <span>{mode === 'live' ? 'Sync' : 'Connect Live'}</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
