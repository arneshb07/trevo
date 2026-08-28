import React from 'react';
import { HistoryEntry } from '../types';
import { RotateCw, TrendingUp, Landmark, ArrowRight } from 'lucide-react';
import { getActionLabel } from '../utils/formatters';

interface HistoryPageProps {
  history: HistoryEntry[];
  onRefresh?: () => void;
  isLoading?: boolean;
}

export const HistoryPage: React.FC<HistoryPageProps> = () => {
  return (
    <div className="w-full max-w-4xl mx-auto px-6 pb-28 pt-2 space-y-6">
      {/* Title Section */}
      <div className="space-y-1">
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-[#0F2E22]">
          Decision Journal
        </h1>
        <p className="text-sm font-medium text-[#5A7568]">
          A chronological record of autonomous optimization events and their systemic impact.
        </p>
      </div>

      {/* Timeline Section */}
      <div className="pt-6 relative">
        {/* Central timeline line */}
        <div className="absolute left-4 sm:left-1/2 top-10 bottom-0 w-[1.5px] bg-[rgba(15,46,34,0.12)] -translate-x-1/2" />

        {/* Date Header: Today */}
        <div className="flex justify-center mb-8 relative z-10">
          <span className="px-4 py-1 rounded-full text-xs font-bold bg-white border border-[rgba(15,46,34,0.08)] shadow-sm text-[#0F2E22]">
            Today, Oct 26
          </span>
        </div>

        {/* Timeline Items */}
        <div className="space-y-10">
          {/* 1. Primary Demo Event Node: Customer Beta Delay */}
          <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            {/* Timestamp (Left on desktop) */}
            <div className="sm:w-1/2 sm:text-right sm:pr-8 pl-10 sm:pl-0">
              <div className="text-xs font-extrabold text-[#0F2E22]">09:42 AM</div>
              <div className="text-[11px] text-[#5A7568]">System Auto-Resolve</div>
            </div>

            {/* Central Node Dot */}
            <div className="absolute left-4 sm:left-1/2 top-4 sm:top-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-[#2D9A65] border-2 border-white shadow-sm z-20" />

            {/* Card (Right on desktop) */}
            <div className="sm:w-1/2 sm:pl-8 pl-10">
              <div className="bg-white/95 backdrop-blur-md rounded-3xl p-6 border border-[rgba(15,46,34,0.06)] shadow-stitch-card space-y-4 hover:shadow-stitch-glass transition-all">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-[#E0F3EA] text-[#2D9A65] flex items-center justify-center">
                    <RotateCw className="w-4 h-4" />
                  </div>
                  <h3 className="text-base font-extrabold text-[#0F2E22]">
                    Customer Beta Delay
                  </h3>
                </div>

                <div className="space-y-2.5 text-xs">
                  <div className="flex items-center justify-between pb-2 border-b border-[rgba(15,46,34,0.04)]">
                    <span className="text-[#5A7568]">Affected Entity</span>
                    <span className="font-extrabold text-[#0F2E22] font-mono">INV B</span>
                  </div>

                  <div className="flex items-center justify-between pb-2 border-b border-[rgba(15,46,34,0.04)]">
                    <span className="text-[#5A7568]">Action Pivot</span>
                    <span className="font-bold text-[#0F2E22] flex items-center gap-1 font-mono">
                      <span className="line-through text-[#5A7568]">DELAY</span>
                      <ArrowRight className="w-3 h-3 text-[#2D9A65]" />
                      <span className="text-[#2D9A65]">{getActionLabel('BANK_FINANCE')}</span>
                    </span>
                  </div>

                  <div className="flex items-center justify-between pb-2 border-b border-[rgba(15,46,34,0.04)]">
                    <span className="text-[#5A7568]">Net Optimization</span>
                    <span className="font-extrabold text-[#DC2626] font-mono">
                      +₹559
                    </span>
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <span className="text-[#5A7568]">Outcome</span>
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-[#E0F3EA] text-[#2D9A65]">
                      Liquidity Preserved
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 2. Rate Arbitrage Node */}
          <div className="relative flex flex-col sm:flex-row-reverse sm:items-center justify-between gap-4">
            {/* Timestamp (Right on desktop) */}
            <div className="sm:w-1/2 sm:text-left sm:pl-8 pl-10 sm:pl-0">
              <div className="text-xs font-extrabold text-[#0F2E22]">08:15 AM</div>
              <div className="text-[11px] text-[#5A7568]">Scheduled Check</div>
            </div>

            {/* Central Node Dot */}
            <div className="absolute left-4 sm:left-1/2 top-4 sm:top-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-white border-2 border-[#5A7568] shadow-sm z-20" />

            {/* Card (Left on desktop) */}
            <div className="sm:w-1/2 sm:pr-8 pl-10 sm:pl-0">
              <div className="bg-white/95 backdrop-blur-md rounded-3xl p-6 border border-[rgba(15,46,34,0.06)] shadow-stitch-card space-y-4 hover:shadow-stitch-glass transition-all">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-[#EEF5F1] text-[#0F2E22] flex items-center justify-center">
                    <TrendingUp className="w-4 h-4" />
                  </div>
                  <h3 className="text-base font-extrabold text-[#0F2E22]">
                    Rate Arbitrage
                  </h3>
                </div>

                <div className="space-y-2.5 text-xs">
                  <div className="flex items-center justify-between pb-2 border-b border-[rgba(15,46,34,0.04)]">
                    <span className="text-[#5A7568]">Affected Entity</span>
                    <span className="font-extrabold text-[#0F2E22] font-mono">POOL_A</span>
                  </div>

                  <div className="flex items-center justify-between pb-2 border-b border-[rgba(15,46,34,0.04)]">
                    <span className="text-[#5A7568]">Action Pivot</span>
                    <span className="font-bold text-[#0F2E22] flex items-center gap-1 font-mono">
                      <span>HOLD</span>
                      <ArrowRight className="w-3 h-3 text-[#2D9A65]" />
                      <span className="text-[#2D9A65]">DISCOUNT</span>
                    </span>
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <span className="text-[#5A7568]">Net Optimization</span>
                    <span className="font-extrabold text-[#2D9A65] font-mono">
                      +₹1,240
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Date Header: Yesterday / Oct 25 */}
          <div className="flex justify-center my-6 relative z-10">
            <span className="px-4 py-1 rounded-full text-xs font-bold bg-white border border-[rgba(15,46,34,0.08)] shadow-sm text-[#5A7568]">
              Oct 25
            </span>
          </div>

          {/* 3. Settlement Complete Node */}
          <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="sm:w-1/2 sm:text-right sm:pr-8 pl-10 sm:pl-0">
              <div className="text-xs font-extrabold text-[#0F2E22]">04:30 PM</div>
              <div className="text-[11px] text-[#5A7568]">Batch 44A Disbursed</div>
            </div>

            <div className="absolute left-4 sm:left-1/2 top-4 sm:top-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-[#2D9A65] border-2 border-white shadow-sm z-20" />

            <div className="sm:w-1/2 sm:pl-8 pl-10">
              <div className="bg-white/95 backdrop-blur-md rounded-3xl p-5 border border-[rgba(15,46,34,0.06)] shadow-stitch-card flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-[#E0F3EA] text-[#2D9A65] flex items-center justify-center">
                    <Landmark className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-sm font-extrabold text-[#0F2E22]">
                      Settlement Complete
                    </div>
                    <div className="text-[11px] text-[#5A7568]">
                      Batch 44A Disbursed
                    </div>
                  </div>
                </div>
                <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-[#E0F3EA] text-[#2D9A65]">
                  Verified
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
