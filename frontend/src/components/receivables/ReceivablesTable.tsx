import React from 'react';
import { Receivable } from '../../types';
import { formatRupees, formatPercent } from '../../utils/formatters';

interface ReceivablesTableProps {
  receivables: Receivable[];
  shockActive?: boolean;
}

export const ReceivablesTable: React.FC<ReceivablesTableProps> = ({ receivables, shockActive }) => {
  return (
    <div className="bg-slate-900/70 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
      <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between">
        <div>
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <span>Expected Receivables</span>
            <span className="text-xs font-mono font-normal text-slate-400 bg-slate-800 px-2 py-0.5 rounded">
              {receivables.length} Inflows
            </span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Probabilistic cash inflows applied to expected and conservative liquidity traces
          </p>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs sm:text-sm">
          <thead className="bg-slate-950/60 text-slate-400 text-[11px] uppercase tracking-wider font-semibold border-b border-slate-800">
            <tr>
              <th className="px-5 py-3.5">Receivable</th>
              <th className="px-5 py-3.5">Customer</th>
              <th className="px-5 py-3.5">Amount</th>
              <th className="px-5 py-3.5">Expected Arrival</th>
              <th className="px-5 py-3.5">Confidence</th>
              <th className="px-5 py-3.5 text-right">Late Arrival</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {receivables.map((ar) => {
              const isDelayedShock = shockActive && ar.id === 'AR-Y';

              return (
                <tr key={ar.id} className={`hover:bg-slate-800/30 transition-colors ${
                  isDelayedShock ? 'bg-amber-500/5' : ''
                }`}>
                  <td className="px-5 py-3.5 font-semibold text-white">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-cyan-400">{ar.id}</span>
                      {isDelayedShock && (
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                          Delayed Event
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-5 py-3.5 text-slate-200 font-medium">
                    {ar.customer || 'N/A'}
                  </td>
                  <td className="px-5 py-3.5 font-mono font-medium text-slate-200">
                    {formatRupees(ar.amount)}
                  </td>
                  <td className="px-5 py-3.5 font-mono">
                    {isDelayedShock ? (
                      <span className="text-amber-400 font-bold">
                        Day {ar.expected_day} <span className="text-xs text-slate-400 font-normal">(was Day 9)</span>
                      </span>
                    ) : (
                      <span className="text-slate-300">Day {ar.expected_day}</span>
                    )}
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-medium text-slate-300">
                        {formatPercent(ar.p_ontime)}
                      </span>
                      <span className="text-[11px] text-slate-400">
                        {ar.p_ontime >= 0.85 ? '(Expected Trace)' : '(Conservative Trace)'}
                      </span>
                    </div>
                  </td>
                  <td className="px-5 py-3.5 text-right font-mono text-slate-300">
                    Day {ar.late_day}
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
