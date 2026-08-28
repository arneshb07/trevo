import React from 'react';
import { FinancingFacility, Obligation } from '../../types';
import { formatRupees, formatPercent } from '../../utils/formatters';
import { Building2, Landmark, CalendarClock } from 'lucide-react';

interface FinancingSummaryProps {
  financing: FinancingFacility[];
  obligations?: Obligation[];
}

export const FinancingSummary: React.FC<FinancingSummaryProps> = ({ financing, obligations = [] }) => {
  return (
    <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-5 shadow-sm">
      <h2 className="text-base font-bold text-white mb-1">Financing & Fixed Obligations</h2>
      <p className="text-xs text-slate-400 mb-4">
        Available credit facilities and non-negotiable cash commitments
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Credit Facilities */}
        <div className="space-y-2.5">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 block">
            Credit Facilities
          </span>
          <div className="space-y-2">
            {financing.map((facility) => {
              const isBank = facility.type === 'BANK';
              return (
                <div 
                  key={facility.id} 
                  className="flex items-center justify-between p-3 rounded-lg bg-slate-950/60 border border-slate-800/80"
                >
                  <div className="flex items-center gap-2.5">
                    <div className={`w-7 h-7 rounded-md flex items-center justify-center ${
                      isBank ? 'bg-blue-500/10 text-blue-400' : 'bg-indigo-500/10 text-indigo-400'
                    }`}>
                      {isBank ? <Landmark className="w-3.5 h-3.5" /> : <Building2 className="w-3.5 h-3.5" />}
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-200">
                        {facility.provider}
                      </div>
                      <div className="text-[11px] text-slate-400 font-mono">
                        Rate: {formatPercent(facility.rate)} p.a.
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs font-mono font-semibold text-slate-200">
                      {formatRupees(facility.limit)}
                    </div>
                    <div className="text-[10px] text-slate-400 uppercase">Limit</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Fixed Obligations */}
        <div className="space-y-2.5">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 block">
            Mandatory Fixed Outflows
          </span>
          <div className="space-y-2">
            {obligations.map((ob) => (
              <div 
                key={ob.id}
                className="flex items-center justify-between p-3 rounded-lg bg-slate-950/60 border border-slate-800/80"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-md bg-rose-500/10 text-rose-400 flex items-center justify-center">
                    <CalendarClock className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-200">{ob.name}</div>
                    <div className="text-[11px] text-slate-400 font-mono">
                      Due: Day {ob.day} (Unconditional)
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xs font-mono font-semibold text-rose-400">
                    {formatRupees(ob.amount)}
                  </div>
                  <div className="text-[10px] text-slate-400 uppercase">Outflow</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
