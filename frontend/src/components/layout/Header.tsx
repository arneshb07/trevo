import React from 'react';
import { Cpu, Wifi, WifiOff } from 'lucide-react';

interface HeaderProps {
  mode: 'demo' | 'live';
  isOptimizerReady: boolean;
}

export const Header: React.FC<HeaderProps> = ({ mode, isOptimizerReady }) => {
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

        {/* Status Indicators */}
        <div className="flex items-center flex-wrap gap-2.5">
          {/* Optimizer Status */}
          <div className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <span className={`w-2 h-2 rounded-full bg-emerald-400 mr-2 ${isOptimizerReady ? 'animate-pulse' : ''}`} />
            <Cpu className="w-3.5 h-3.5 mr-1" />
            <span>Optimizer Ready</span>
          </div>

          {/* Environment Mode */}
          <div className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-500/10 text-blue-300 border border-blue-500/20">
            {mode === 'live' ? (
              <>
                <Wifi className="w-3.5 h-3.5 mr-1 text-emerald-400" />
                <span>Live Mode</span>
              </>
            ) : (
              <>
                <WifiOff className="w-3.5 h-3.5 mr-1 text-amber-400" />
                <span>Demo Mode</span>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
