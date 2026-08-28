import React from 'react';
import { Zap, RotateCcw, AlertCircle, Sparkles } from 'lucide-react';

interface EventSimulatorProps {
  onSimulateShock: () => void;
  onReset: () => void;
  isShockActive: boolean;
  isLoading: boolean;
}

export const EventSimulator: React.FC<EventSimulatorProps> = ({
  onSimulateShock,
  onReset,
  isShockActive,
  isLoading,
}) => {
  return (
    <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-5 shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 pb-3 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1 rounded-md bg-amber-500/10 text-amber-400">
              <Zap className="w-4 h-4" />
            </span>
            <h2 className="text-base font-bold text-white">Event Simulation & Dynamic Re-Optimization</h2>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Test autonomous portfolio rebalancing under liquidity shocks in real time
          </p>
        </div>

        {/* State Tag */}
        <div className="flex items-center gap-2">
          <span className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${
            isShockActive 
              ? 'bg-amber-500/10 text-amber-400 border-amber-500/30' 
              : 'bg-blue-500/10 text-blue-400 border-blue-500/30'
          }`}>
            {isShockActive ? 'Scenario: AR-Y Shock Active' : 'Scenario: Baseline'}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
        {/* Scenario description */}
        <div className="p-3.5 rounded-lg bg-slate-950/60 border border-slate-800 text-xs space-y-2">
          <div className="font-semibold text-slate-200 flex items-center gap-1.5">
            <AlertCircle className="w-3.5 h-3.5 text-amber-400" />
            <span>Primary Hackathon Demonstration Event</span>
          </div>
          <p className="text-slate-400 leading-relaxed">
            Trigger <code className="text-amber-300 bg-amber-950/40 px-1 py-0.5 rounded font-mono">RECEIVABLE_DELAY</code> for{' '}
            <strong className="text-slate-200 font-mono">AR-Y</strong> (Beta ₹3,00,000) from Day 9 → Day 20.
          </p>
          <div className="text-[11px] text-slate-400 flex items-center gap-1.5 pt-1 border-t border-slate-800/80">
            <span className="text-slate-300">Expected change:</span>
            <span className="font-mono text-amber-300">INV-B: DELAY → BANK_FINANCE</span>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex flex-col sm:flex-row gap-3 justify-end">
          <button
            type="button"
            onClick={onSimulateShock}
            disabled={isLoading || isShockActive}
            className={`flex-1 sm:flex-initial inline-flex items-center justify-center px-4 py-2.5 rounded-lg font-semibold text-xs transition-all shadow-sm ${
              isShockActive
                ? 'bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed'
                : 'bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white shadow-blue-500/20 active:scale-[0.98]'
            }`}
          >
            {isLoading && !isShockActive ? (
              <span className="flex items-center gap-2">
                <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                Re-optimizing...
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <Sparkles className="w-3.5 h-3.5" />
                Simulate Receivable Delay
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={onReset}
            disabled={isLoading || !isShockActive}
            className={`inline-flex items-center justify-center px-4 py-2.5 rounded-lg font-semibold text-xs border transition-all ${
              !isShockActive
                ? 'bg-slate-900 text-slate-600 border-slate-800 cursor-not-allowed'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700 active:scale-[0.98]'
            }`}
          >
            {isLoading && isShockActive ? (
              <span className="flex items-center gap-2">
                <span className="w-3.5 h-3.5 border-2 border-slate-400/30 border-t-slate-300 rounded-full animate-spin"></span>
                Resetting...
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <RotateCcw className="w-3.5 h-3.5" />
                Reset to Baseline
              </span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
