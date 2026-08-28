import React from 'react';
import { DecisionPlan } from '../../types';
import { formatRupees, getActionLabel, getActionBadgeStyle } from '../../utils/formatters';
import { CheckCircle2, TrendingUp } from 'lucide-react';

interface DecisionSummaryProps {
  plan: DecisionPlan;
  previousCost?: number;
}

export const DecisionSummary: React.FC<DecisionSummaryProps> = ({ plan, previousCost }) => {
  const hasCostDelta = previousCost !== undefined && plan.total_cost !== previousCost;
  const delta = hasCostDelta ? plan.total_cost - previousCost : 0;

  return (
    <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-5 shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 pb-3 border-b border-slate-800">
        <div>
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <span>Optimal Joint Allocation Plan</span>
            <span className="inline-flex items-center text-xs font-normal text-emerald-400">
              <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
              CP-SAT Solved
            </span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Single-source portfolio optimization satisfying hard liquidity constraints
          </p>
        </div>

        {/* Total Optimization Cost */}
        <div className="bg-slate-950/80 border border-slate-800 px-4 py-2.5 rounded-lg text-right">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
            Total Optimization Cost
          </div>
          <div className="flex items-baseline justify-end gap-2 mt-0.5">
            <span className="text-xl sm:text-2xl font-bold font-mono text-white">
              {formatRupees(plan.total_cost)}
            </span>
            {hasCostDelta && (
              <span className={`text-xs font-mono font-semibold flex items-center ${
                delta > 0 ? 'text-amber-400' : 'text-emerald-400'
              }`}>
                <TrendingUp className="w-3 h-3 mr-0.5 inline" />
                {delta > 0 ? `+${formatRupees(delta)}` : formatRupees(delta)}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Decision Chips */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {plan.decisions.map((decision) => {
          const badgeStyle = getActionBadgeStyle(decision.selected_action);
          return (
            <div 
              key={decision.invoice_id}
              className="p-3.5 rounded-lg bg-slate-950/60 border border-slate-800/80 flex flex-col justify-between"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="font-mono font-bold text-sm text-white">
                  {decision.invoice_id}
                </span>
                <span className={`px-2 py-0.5 rounded text-xs font-bold font-mono border ${badgeStyle.bg} ${badgeStyle.text} ${badgeStyle.border}`}>
                  {getActionLabel(decision.selected_action)}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-800/60">
                <span className="text-slate-400">Net Cost:</span>
                <span className="font-mono font-semibold text-slate-200">
                  {formatRupees(decision.cost)}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
