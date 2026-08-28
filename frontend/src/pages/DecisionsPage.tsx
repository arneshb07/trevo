import React from 'react';
import { BusinessState, DecisionPlan, Decision } from '../types';
import { formatRupees, getActionLabel } from '../utils/formatters';
import { 
  ArrowLeft, 
  RefreshCw, 
  ArrowDown, 
  HelpCircle, 
  AlertTriangle, 
  Clock, 
  ShieldAlert, 
  ShieldCheck 
} from 'lucide-react';

interface DecisionsPageProps {
  businessState: BusinessState;
  decisionPlan: DecisionPlan;
  isShockActive: boolean;
  onBackToOverview: () => void;
  onSelectDecision: (decision: Decision) => void;
}

export const DecisionsPage: React.FC<DecisionsPageProps> = ({
  businessState,
  decisionPlan,
  isShockActive,
  onBackToOverview,
  onSelectDecision,
}) => {
  // Find all decisions
  const decisionMap = new Map<string, Decision>();
  decisionPlan.decisions.forEach(d => decisionMap.set(d.invoice_id, d));

  return (
    <div className="w-full max-w-6xl mx-auto px-6 pb-28 pt-2 space-y-6">
      {/* Top Banner Navigation */}
      <div className="flex items-center justify-between">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-[#E0F3EA] text-[#0F2E22] border border-[#C2E7D5]">
          <RefreshCw className="w-3.5 h-3.5 text-[#2D9A65]" />
          <span>Real-time Adjustment</span>
        </div>

        <button
          type="button"
          onClick={onBackToOverview}
          className="inline-flex items-center gap-1.5 text-xs font-bold text-[#5A7568] hover:text-[#0F2E22] transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>BACK TO OVERVIEW</span>
        </button>
      </div>

      {/* Heading */}
      <div className="text-center max-w-3xl mx-auto space-y-2 pt-2">
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-[#0F2E22]">
          Decision Updated
        </h1>
        <p className="text-sm font-medium text-[#5A7568] leading-relaxed">
          {isShockActive
            ? "Customer Beta's payment was delayed from Day 9 to Day 20. To prevent a breach of your ₹5,00,000 buffer on Day 12, TREVO has automatically updated your strategy."
            : "Portfolio strategy continuously optimized against cash flows, liquidity safety buffers, and financing availability."}
        </p>
      </div>

      {/* Grid: Strategy Shift & Why did TREVO change this */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-stretch">
        {/* Left: Strategy Shift (5 cols) */}
        <div className="md:col-span-5 bg-white/90 backdrop-blur-md rounded-3xl p-6 border border-[rgba(15,46,34,0.06)] shadow-stitch-card flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 text-sm font-extrabold text-[#0F2E22] mb-5">
              <RefreshCw className="w-4 h-4 text-[#2D9A65]" />
              <span>Strategy Shift</span>
            </div>

            <div className="space-y-3">
              {/* Previous Plan */}
              <div className="bg-[#EEF5F1] rounded-2xl p-4 border border-[rgba(15,46,34,0.04)]">
                <div className="text-[10px] font-bold text-[#5A7568] uppercase tracking-wider">
                  Previous Plan (INV B)
                </div>
                <div className="text-lg font-extrabold text-[#0F2E22] mt-0.5 font-mono">
                  {isShockActive ? 'DELAY' : 'DELAY'}
                </div>
              </div>

              {/* Down Arrow */}
              <div className="flex justify-center">
                <div className="w-8 h-8 rounded-full bg-[#0F2E22] text-white flex items-center justify-center shadow-sm">
                  <ArrowDown className="w-4 h-4" />
                </div>
              </div>

              {/* New Optimal Plan */}
              <div className="bg-[#E0F3EA]/70 rounded-2xl p-4 border border-[#C2E7D5]">
                <div className="text-[10px] font-bold text-[#2D9A65] uppercase tracking-wider">
                  New Optimal Plan
                </div>
                <div className="text-lg font-extrabold text-[#0F2E22] mt-0.5 font-mono">
                  {getActionLabel(isShockActive ? 'BANK_FINANCE' : 'DELAY')}
                </div>
              </div>
            </div>
          </div>

          <div className="pt-6 border-t border-[rgba(15,46,34,0.06)] mt-4">
            <div className="text-[11px] font-bold text-[#5A7568] uppercase tracking-wider">
              Cost Delta
            </div>
            <div className="text-2xl font-extrabold text-[#DC2626] font-mono tracking-tight mt-0.5">
              {isShockActive ? '+₹559 ~' : '₹0 (Baseline)'}
            </div>
          </div>
        </div>

        {/* Right: Why did TREVO change this? (7 cols) */}
        <div className="md:col-span-7 bg-white/90 backdrop-blur-md rounded-3xl p-6 sm:p-7 border border-[rgba(15,46,34,0.06)] shadow-stitch-card">
          <div className="flex items-center gap-2 text-sm font-extrabold text-[#0F2E22] mb-5">
            <HelpCircle className="w-4 h-4 text-[#2D9A65]" />
            <span>Why did TREVO change this?</span>
          </div>

          <div className="space-y-4">
            {/* Step 1 */}
            <div className="flex items-start gap-3.5">
              <div className="w-7 h-7 rounded-lg bg-[#FEECEC] text-[#DC2626] flex items-center justify-center flex-shrink-0 mt-0.5">
                <AlertTriangle className="w-3.5 h-3.5" />
              </div>
              <div className="text-xs leading-relaxed">
                <div className="font-extrabold text-[#0F2E22]">1. External Event</div>
                <div className="text-[#5A7568] mt-0.5">
                  Customer Beta delayed payment ({isShockActive ? 'Day 9 → Day 20' : 'Baseline Schedule'}).
                </div>
              </div>
            </div>

            {/* Step 2 */}
            <div className="flex items-start gap-3.5">
              <div className="w-7 h-7 rounded-lg bg-[#EEF5F1] text-[#5A7568] flex items-center justify-center flex-shrink-0 mt-0.5">
                <Clock className="w-3.5 h-3.5" />
              </div>
              <div className="text-xs leading-relaxed">
                <div className="font-extrabold text-[#0F2E22]">2. Viability Check</div>
                <div className="text-[#5A7568] mt-0.5">
                  Original &apos;DELAY&apos; plan for INV B became infeasible under new timeline.
                </div>
              </div>
            </div>

            {/* Step 3 */}
            <div className="flex items-start gap-3.5">
              <div className="w-7 h-7 rounded-lg bg-[#0F2E22] text-white flex items-center justify-center flex-shrink-0 mt-0.5">
                <ShieldAlert className="w-3.5 h-3.5" />
              </div>
              <div className="text-xs leading-relaxed">
                <div className="font-extrabold text-[#0F2E22]">3. Risk Detected</div>
                <div className="text-[#5A7568] mt-0.5">
                  Projected breach of ₹5,00,000 safety buffer on Day 12.
                </div>
              </div>
            </div>

            {/* Step 4 */}
            <div className="flex items-start gap-3.5">
              <div className="w-7 h-7 rounded-lg bg-[#2D9A65] text-white flex items-center justify-center flex-shrink-0 mt-0.5">
                <RefreshCw className="w-3.5 h-3.5" />
              </div>
              <div className="text-xs leading-relaxed">
                <div className="font-extrabold text-[#0F2E22]">4. Re-optimization</div>
                <div className="text-[#5A7568] mt-0.5">
                  Switched INV B strategy to {getActionLabel('BANK_FINANCE')} to bridge the gap.
                </div>
              </div>
            </div>

            {/* Step 5 */}
            <div className="flex items-start gap-3.5">
              <div className="w-7 h-7 rounded-lg bg-[#0F2E22] text-white flex items-center justify-center flex-shrink-0 mt-0.5">
                <ShieldCheck className="w-3.5 h-3.5" />
              </div>
              <div className="text-xs leading-relaxed">
                <div className="font-extrabold text-[#0F2E22]">5. Outcome</div>
                <div className="text-[#5A7568] mt-0.5">
                  Liquidity preserved. Buffer safe.
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Updated Cash Forecast Visual Bar Chart */}
      <div className="bg-white/90 backdrop-blur-md rounded-3xl p-6 sm:p-8 border border-[rgba(15,46,34,0.06)] shadow-stitch-card">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-lg font-extrabold text-[#0F2E22]">
            Updated Cash Forecast
          </h2>

          <div className="flex items-center gap-4 text-xs font-bold">
            <div className="flex items-center gap-1.5 text-[#0F2E22]">
              <span className="w-2.5 h-2.5 rounded-full bg-[#0F2E22]" />
              <span>EXPECTED</span>
            </div>
            <div className="flex items-center gap-1.5 text-[#DC2626]">
              <span className="w-3 h-0.5 bg-[#DC2626] border-b border-dashed" />
              <span>BUFFER (₹5L)</span>
            </div>
          </div>
        </div>

        {/* Bar Chart Representation */}
        <div className="relative h-64 flex items-end justify-between px-4 sm:px-8 pt-6 pb-2 border-b border-[rgba(15,46,34,0.08)]">
          {/* 5L Buffer Red Dashed Line */}
          <div className="absolute top-[50%] left-0 right-0 border-t border-dashed border-[#DC2626]/70 z-10">
            <span className="absolute -top-3.5 right-2 text-[10px] font-bold text-[#DC2626] bg-white px-1.5 py-0.5 rounded">
              ₹5,00,000 Buffer
            </span>
          </div>

          {/* Day 0: ₹10,00,000 */}
          <div className="flex flex-col items-center gap-2 z-20 flex-1">
            <div className="w-12 sm:w-16 bg-[#A3B8AD]/50 hover:bg-[#A3B8AD] rounded-t-lg transition-all h-44" />
            <span className="text-[11px] font-bold text-[#5A7568]">Day 0</span>
          </div>

          {/* Day 6: ₹6,00,000 */}
          <div className="flex flex-col items-center gap-2 z-20 flex-1">
            <div className="w-12 sm:w-16 bg-[#A3B8AD]/50 hover:bg-[#A3B8AD] rounded-t-lg transition-all h-28" />
            <span className="text-[11px] font-bold text-[#5A7568]">Day 6</span>
          </div>

          {/* Day 12: Highlighted checkpoint */}
          <div className="flex flex-col items-center gap-2 z-20 flex-1 relative">
            <div className="absolute -top-9 bg-[#0F2E22] text-white text-[10px] font-bold px-2.5 py-1 rounded-md shadow-md whitespace-nowrap">
              Day 12: Safely above buffer
            </div>
            <div className="w-12 sm:w-16 bg-[#0F2E22] rounded-t-lg h-28 shadow-sm" />
            <span className="text-[11px] font-bold text-[#0F2E22]">Day 12</span>
          </div>

          {/* Day 14: ₹5,97,600 */}
          <div className="flex flex-col items-center gap-2 z-20 flex-1">
            <div className="w-12 sm:w-16 bg-[#5A7568]/70 hover:bg-[#5A7568] rounded-t-lg transition-all h-24" />
            <span className="text-[11px] font-bold text-[#5A7568]">Day 14</span>
          </div>

          {/* Day 16: ₹9,00,000 */}
          <div className="flex flex-col items-center gap-2 z-20 flex-1">
            <div className="w-12 sm:w-16 bg-[#5A7568]/80 hover:bg-[#5A7568] rounded-t-lg transition-all h-36" />
            <span className="text-[11px] font-bold text-[#5A7568]">Day 16</span>
          </div>

          {/* Day 20: ₹10,97,600 */}
          <div className="flex flex-col items-center gap-2 z-20 flex-1">
            <div className="w-12 sm:w-16 bg-[#1A4D3B] hover:bg-[#0F2E22] rounded-t-lg transition-all h-52 shadow-sm" />
            <span className="text-[11px] font-bold text-[#5A7568]">Day 20+</span>
          </div>
        </div>
      </div>

      {/* Current Payables Action Plan */}
      <div className="bg-white/90 backdrop-blur-md rounded-3xl p-6 sm:p-8 border border-[rgba(15,46,34,0.06)] shadow-stitch-card">
        <h2 className="text-lg font-extrabold text-[#0F2E22] mb-4">
          Current Payables Action Plan
        </h2>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead className="text-[11px] font-bold uppercase tracking-wider text-[#5A7568] border-b border-[rgba(15,46,34,0.08)]">
              <tr>
                <th className="py-3 px-3">INVOICE</th>
                <th className="py-3 px-3">DUE DATE</th>
                <th className="py-3 px-3">AMOUNT</th>
                <th className="py-3 px-3">ACTION ASSIGNED</th>
                <th className="py-3 px-3 text-right">STATUS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[rgba(15,46,34,0.05)]">
              {businessState.payables.map((payable) => {
                const decision = decisionMap.get(payable.id);
                const action = decision ? decision.selected_action : 'EVALUATING';
                const isUpdatedRow = payable.id === 'INV-B' || payable.id === 'INV B';

                return (
                  <tr
                    key={payable.id}
                    onClick={() => decision && onSelectDecision(decision)}
                    className={`hover:bg-[#F6FAF7] transition-colors cursor-pointer ${
                      isUpdatedRow ? 'border-l-4 border-l-[#2D9A65]' : ''
                    }`}
                  >
                    <td className="py-4 px-3 font-extrabold text-[#0F2E22]">
                      <div className="flex items-center gap-2">
                        <span>{payable.id}</span>
                        {isUpdatedRow && isShockActive && (
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-extrabold bg-[#0F2E22] text-white">
                            UPDATED
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-4 px-3 text-[#5A7568] font-mono">
                      Day {payable.due_day}
                    </td>
                    <td className="py-4 px-3 font-extrabold text-[#0F2E22] font-mono">
                      {formatRupees(payable.amount)}
                    </td>
                    <td className="py-4 px-3">
                      <span className={`px-2.5 py-1 rounded text-xs font-bold font-mono ${
                        isUpdatedRow && isShockActive
                          ? 'bg-[#0F2E22] text-white'
                          : 'bg-[#E0F3EA] text-[#0F2E22]'
                      }`}>
                        {action}
                      </span>
                    </td>
                    <td className="py-4 px-3 text-right">
                      <span className="inline-flex items-center text-xs font-semibold text-[#5A7568]">
                        <Clock className="w-3.5 h-3.5 mr-1" />
                        {isUpdatedRow && isShockActive ? 'Processing' : 'Scheduled'}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
