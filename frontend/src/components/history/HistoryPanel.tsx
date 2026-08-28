import React from 'react';
import { HistoryEntry } from '../../types';
import { formatRupees, getActionLabel, getActionBadgeStyle } from '../../utils/formatters';
import { History, Clock, ChevronDown, ChevronUp, RefreshCw } from 'lucide-react';

interface HistoryPanelProps {
  history: HistoryEntry[];
  isOpen: boolean;
  onToggle: () => void;
  onRefresh: () => void;
  isLoading: boolean;
}

export const HistoryPanel: React.FC<HistoryPanelProps> = ({
  history,
  isOpen,
  onToggle,
  onRefresh,
  isLoading,
}) => {
  return (
    <div className="bg-slate-900/70 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
      <div 
        className="px-5 py-4 border-b border-slate-800 flex items-center justify-between cursor-pointer select-none hover:bg-slate-800/30 transition-colors"
        onClick={onToggle}
      >
        <div className="flex items-center gap-2">
          <History className="w-4 h-4 text-cyan-400" />
          <h2 className="text-base font-bold text-white">Optimization & Event History</h2>
          <span className="text-xs font-mono text-slate-400 bg-slate-800 px-2 py-0.5 rounded">
            {history.length} Runs
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onRefresh();
            }}
            disabled={isLoading}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
            title="Refresh history"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
          {isOpen ? (
            <ChevronUp className="w-4 h-4 text-slate-400" />
          ) : (
            <ChevronDown className="w-4 h-4 text-slate-400" />
          )}
        </div>
      </div>

      {isOpen && (
        <div className="p-5 space-y-4">
          {history.length === 0 ? (
            <div className="text-xs text-slate-400 text-center py-6">
              No historical runs recorded yet.
            </div>
          ) : (
            <div className="space-y-3">
              {history.map((entry) => (
                <div 
                  key={entry.id}
                  className="p-4 rounded-lg bg-slate-950/60 border border-slate-800 text-xs space-y-2.5"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                    <div className="flex items-center gap-2">
                      <Clock className="w-3.5 h-3.5 text-slate-500" />
                      <span className="font-mono text-slate-400 text-[11px]">{entry.timestamp}</span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-blue-500/10 text-blue-400 border border-blue-500/20">
                        {entry.event_type}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 font-mono">
                      <span className="text-slate-400">Cost:</span>
                      <span className="font-bold text-slate-200">{formatRupees(entry.total_cost)}</span>
                      {entry.cost_delta !== undefined && (
                        <span className={`text-[11px] font-semibold ${entry.cost_delta > 0 ? 'text-amber-400' : 'text-emerald-400'}`}>
                          ({entry.cost_delta > 0 ? `+${formatRupees(entry.cost_delta)}` : formatRupees(entry.cost_delta)})
                        </span>
                      )}
                    </div>
                  </div>

                  <p className="text-slate-300 font-medium">{entry.description}</p>

                  <div className="flex flex-wrap gap-2 pt-1.5 border-t border-slate-800/80">
                    {entry.decisions.map((d) => {
                      const badge = getActionBadgeStyle(d.selected_action);
                      return (
                        <div 
                          key={d.invoice_id}
                          className="flex items-center gap-1.5 px-2 py-1 rounded bg-slate-900 border border-slate-800 font-mono text-[11px]"
                        >
                          <span className="text-white font-bold">{d.invoice_id}:</span>
                          <span className={`px-1.5 py-0.5 rounded text-[10px] border ${badge.bg} ${badge.text} ${badge.border}`}>
                            {getActionLabel(d.selected_action)}
                          </span>
                          <span className="text-slate-400">({formatRupees(d.cost)})</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
