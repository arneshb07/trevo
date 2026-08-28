import React from 'react';
import { Payable, Decision } from '../../types';
import { formatRupees, formatPercent, getActionLabel, getActionBadgeStyle } from '../../utils/formatters';
import { Sliders } from 'lucide-react';

interface PayablesTableProps {
  payables: Payable[];
  decisions: Decision[];
  onInspectCounterfactual?: (invoiceId: string) => void;
}

export const PayablesTable: React.FC<PayablesTableProps> = ({ 
  payables, 
  decisions, 
  onInspectCounterfactual 
}) => {
  // Map decisions by invoice_id
  const decisionMap = new Map<string, Decision>();
  decisions.forEach(d => decisionMap.set(d.invoice_id, d));

  const getImportanceBadge = (importance: string) => {
    switch (importance) {
      case 'HIGH':
        return 'bg-rose-500/10 text-rose-400 border-rose-500/20';
      case 'MEDIUM':
        return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
      case 'LOW':
      default:
        return 'bg-slate-500/10 text-slate-400 border-slate-500/20';
    }
  };

  return (
    <div className="bg-slate-900/70 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
      <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between">
        <div>
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <span>Outstanding Payables</span>
            <span className="text-xs font-mono font-normal text-slate-400 bg-slate-800 px-2 py-0.5 rounded">
              {payables.length} Invoices
            </span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Evaluated jointly against liquidity buffer, discount deadlines, and supplier terms
          </p>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs sm:text-sm">
          <thead className="bg-slate-950/60 text-slate-400 text-[11px] uppercase tracking-wider font-semibold border-b border-slate-800">
            <tr>
              <th className="px-5 py-3.5">Invoice</th>
              <th className="px-5 py-3.5">Amount</th>
              <th className="px-5 py-3.5">Due</th>
              <th className="px-5 py-3.5">Discount</th>
              <th className="px-5 py-3.5">Importance</th>
              <th className="px-5 py-3.5">Recommended Action</th>
              <th className="px-5 py-3.5 text-right">Actions / Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {payables.map((payable) => {
              const decision = decisionMap.get(payable.id);
              const action = decision ? decision.selected_action : 'EVALUATING';
              const badgeStyle = getActionBadgeStyle(action);

              return (
                <tr key={payable.id} className="hover:bg-slate-800/30 transition-colors">
                  <td className="px-5 py-3.5 font-semibold text-white">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-blue-400">{payable.id}</span>
                      {payable.vendor && (
                        <span className="text-xs text-slate-400 font-normal">({payable.vendor})</span>
                      )}
                    </div>
                  </td>
                  <td className="px-5 py-3.5 font-mono font-medium text-slate-200">
                    {formatRupees(payable.amount)}
                  </td>
                  <td className="px-5 py-3.5 text-slate-300 font-mono">
                    Day {payable.due_day}
                  </td>
                  <td className="px-5 py-3.5 text-slate-300">
                    {payable.discount_rate && payable.discount_rate > 0 ? (
                      <span className="text-emerald-400 font-medium font-mono">
                        {formatPercent(payable.discount_rate)} by Day {payable.discount_deadline_day}
                      </span>
                    ) : (
                      <span className="text-slate-400 font-mono">None</span>
                    )}
                  </td>
                  <td className="px-5 py-3.5">
                    <span className={`inline-flex px-2 py-0.5 rounded text-[11px] font-semibold border ${getImportanceBadge(payable.importance)}`}>
                      {payable.importance}
                    </span>
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="inline-flex items-center gap-1.5">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold font-mono tracking-wide border ${badgeStyle.bg} ${badgeStyle.text} ${badgeStyle.border}`}>
                        {getActionLabel(action)}
                      </span>
                      {decision?.cost !== undefined && (
                        <span className="text-[11px] font-mono text-slate-400">
                          (Cost: {formatRupees(decision.cost)})
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-5 py-3.5 text-right">
                    <div className="flex items-center justify-end gap-2">
                      {onInspectCounterfactual && (
                        <button
                          type="button"
                          onClick={() => onInspectCounterfactual(payable.id)}
                          className="inline-flex items-center gap-1 px-2 py-1 rounded text-[11px] font-medium bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors"
                          title="Inspect Counterfactual Parameter Sweep"
                        >
                          <Sliders className="w-3 h-3 text-blue-400" />
                          <span>Sweep</span>
                        </button>
                      )}
                      <span className="inline-flex items-center text-xs font-medium text-emerald-400">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mr-1.5"></span>
                        Optimized
                      </span>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
