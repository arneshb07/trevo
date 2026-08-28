import React from 'react';
import { CounterfactualResponse } from '../../types';
import { formatRupees, getActionLabel, getActionBadgeStyle } from '../../utils/formatters';
import { Sliders, X, Check, AlertCircle } from 'lucide-react';

interface CounterfactualInspectorProps {
  data: CounterfactualResponse | null;
  isLoading: boolean;
  onClose: () => void;
}

export const CounterfactualInspector: React.FC<CounterfactualInspectorProps> = ({
  data,
  isLoading,
  onClose,
}) => {
  if (!data && !isLoading) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-xl w-full max-w-2xl overflow-hidden shadow-2xl">
        <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sliders className="w-4 h-4 text-blue-400" />
            <h3 className="text-base font-bold text-white">
              Parameter Sweep Inspector: <span className="font-mono text-blue-400">{data?.invoice_id}</span>
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5">
          {isLoading ? (
            <div className="py-12 flex flex-col items-center justify-center space-y-3">
              <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
              <p className="text-xs text-slate-400 font-mono">Running optimizer parameter sweep...</p>
            </div>
          ) : data ? (
            <div className="space-y-4">
              <div className="text-xs text-slate-400">
                Sweeping parameter: <strong className="text-slate-200">{data.parameter_name}</strong>. Shows how the optimal action and cost evolve across parameter variations.
              </div>

              <div className="overflow-x-auto border border-slate-800 rounded-lg">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-950/80 text-slate-400 text-[11px] uppercase tracking-wider font-semibold border-b border-slate-800">
                    <tr>
                      <th className="px-4 py-3">Parameter Value</th>
                      <th className="px-4 py-3">Optimal Action</th>
                      <th className="px-4 py-3">Cost</th>
                      <th className="px-4 py-3">Feasibility</th>
                      <th className="px-4 py-3">Notes</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 font-mono">
                    {data.points.map((pt, idx) => {
                      const badge = getActionBadgeStyle(pt.optimal_action);
                      return (
                        <tr key={idx} className="hover:bg-slate-800/30 transition-colors">
                          <td className="px-4 py-3 text-slate-200 font-bold">
                            {pt.parameter_value}
                          </td>
                          <td className="px-4 py-3">
                            <span className={`inline-flex px-2 py-0.5 rounded text-[11px] font-bold border ${badge.bg} ${badge.text} ${badge.border}`}>
                              {getActionLabel(pt.optimal_action)}
                            </span>
                          </td>
                          <td className="px-4 py-3 font-semibold text-slate-200">
                            {formatRupees(pt.cost)}
                          </td>
                          <td className="px-4 py-3">
                            {pt.feasible ? (
                              <span className="inline-flex items-center text-emerald-400 text-[11px]">
                                <Check className="w-3 h-3 mr-1" /> Feasible
                              </span>
                            ) : (
                              <span className="inline-flex items-center text-rose-400 text-[11px]">
                                <AlertCircle className="w-3 h-3 mr-1" /> Infeasible
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-3 font-sans text-xs text-slate-400">
                            {pt.reason || '—'}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          ) : null}
        </div>

        <div className="px-5 py-3 border-t border-slate-800 bg-slate-950/40 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
