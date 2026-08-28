import React, { useState } from 'react';
import { BusinessState, DecisionPlan, Decision } from '../types';
import { formatRupees, formatPercent, getActionLabel } from '../utils/formatters';
import { 
  Wallet, 
  ShieldCheck, 
  TrendingDown, 
  FileText, 
  AlertTriangle, 
  FlaskConical, 
  Building2, 
  Landmark, 
  CalendarClock,
  ArrowRight
} from 'lucide-react';

interface OverviewPageProps {
  businessState: BusinessState;
  decisionPlan: DecisionPlan;
  isShockActive: boolean;
  onSimulateEvent: (delayDay: number) => void;
  onReset: () => void;
  isLoading: boolean;
  onSelectDecision: (decision: Decision) => void;
  onNavigateDecisions: () => void;
}

export const OverviewPage: React.FC<OverviewPageProps> = ({
  businessState,
  decisionPlan,
  isShockActive,
  onSimulateEvent,
  onReset,
  isLoading,
  onSelectDecision,
}) => {
  const [activeTab, setActiveTab] = useState<'payables' | 'receivables' | 'financing'>('payables');
  const [sliderDay, setSliderDay] = useState<number>(isShockActive ? 20 : 9);

  // Sync slider if shock state changes
  React.useEffect(() => {
    setSliderDay(isShockActive ? 20 : 9);
  }, [isShockActive]);

  const decisionMap = new Map<string, Decision>();
  decisionPlan.decisions.forEach(d => decisionMap.set(d.invoice_id, d));

  return (
    <div className="w-full max-w-6xl mx-auto px-6 pb-28 pt-2 space-y-6">
      {/* Title Section */}
      <div className="space-y-1">
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-[#0F2E22]">
          Working Capital
        </h1>
        <p className="text-sm font-medium text-[#5A7568]">
          Real-time overview of deployed capital and liquidity.
        </p>
      </div>

      {/* 4 Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Available Cash */}
        <div className="bg-white/80 backdrop-blur-md rounded-2xl p-5 border border-[rgba(15,46,34,0.06)] shadow-stitch-card flex flex-col justify-between">
          <div className="flex items-center gap-2 text-[11px] font-bold tracking-wider text-[#5A7568] uppercase">
            <Wallet className="w-3.5 h-3.5 text-[#0F2E22]" />
            <span>Available Cash</span>
          </div>
          <div className="mt-3 text-2xl sm:text-3xl font-extrabold text-[#0F2E22] tracking-tight">
            {formatRupees(businessState.cash)}
          </div>
        </div>

        {/* Protected Liquidity */}
        <div className="bg-white/80 backdrop-blur-md rounded-2xl p-5 border border-[rgba(15,46,34,0.06)] shadow-stitch-card flex flex-col justify-between">
          <div className="flex items-center gap-2 text-[11px] font-bold tracking-wider text-[#5A7568] uppercase">
            <ShieldCheck className="w-3.5 h-3.5 text-[#0F2E22]" />
            <span>Protected Liquidity</span>
          </div>
          <div className="mt-3 text-2xl sm:text-3xl font-extrabold text-[#0F2E22] tracking-tight">
            {formatRupees(businessState.buffer)}
          </div>
        </div>

        {/* Risk Status */}
        <div className="bg-white/80 backdrop-blur-md rounded-2xl p-5 border border-[rgba(15,46,34,0.06)] shadow-stitch-card flex flex-col justify-between">
          <div className="flex items-center gap-2 text-[11px] font-bold tracking-wider text-[#5A7568] uppercase">
            <ShieldCheck className="w-3.5 h-3.5 text-[#0F2E22]" />
            <span>Risk Status</span>
          </div>
          <div className="mt-3">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-[#E0F3EA] text-[#0F2E22]">
              <span className="w-2 h-2 rounded-full bg-[#2D9A65]" />
              SAFE
            </span>
          </div>
        </div>

        {/* Optimization Cost */}
        <div className="bg-white/80 backdrop-blur-md rounded-2xl p-5 border border-[rgba(15,46,34,0.06)] shadow-stitch-card flex flex-col justify-between">
          <div className="flex items-center gap-2 text-[11px] font-bold tracking-wider text-[#5A7568] uppercase">
            <TrendingDown className="w-3.5 h-3.5 text-[#0F2E22]" />
            <span>Optimization Cost</span>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-extrabold text-[#0F2E22] tracking-tight">
              {formatRupees(decisionPlan.total_cost)}
            </span>
            {isShockActive && (
              <span className="text-xs font-bold text-[#DC2626] font-mono">
                (+₹559)
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Working Capital Position Container */}
      <div className="bg-white/90 backdrop-blur-md rounded-3xl p-6 sm:p-8 border border-[rgba(15,46,34,0.06)] shadow-stitch-card">
        {/* Header with Segmented Tabs */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[rgba(15,46,34,0.06)]">
          <h2 className="text-xl font-extrabold text-[#0F2E22]">
            Working Capital Position
          </h2>

          {/* Segmented Tab Control */}
          <div className="inline-flex p-1 rounded-full bg-[#EEF5F1] border border-[rgba(15,46,34,0.04)]">
            <button
              type="button"
              onClick={() => setActiveTab('payables')}
              className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${
                activeTab === 'payables'
                  ? 'bg-[#0F2E22] text-white shadow-sm'
                  : 'text-[#5A7568] hover:text-[#0F2E22]'
              }`}
            >
              Payables
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('receivables')}
              className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${
                activeTab === 'receivables'
                  ? 'bg-[#0F2E22] text-white shadow-sm'
                  : 'text-[#5A7568] hover:text-[#0F2E22]'
              }`}
            >
              Receivables
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('financing')}
              className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${
                activeTab === 'financing'
                  ? 'bg-[#0F2E22] text-white shadow-sm'
                  : 'text-[#5A7568] hover:text-[#0F2E22]'
              }`}
            >
              Financing
            </button>
          </div>
        </div>

        {/* Tab Content */}
        <div className="pt-4 divide-y divide-[rgba(15,46,34,0.05)]">
          {activeTab === 'payables' && (
            <div className="space-y-2">
              {businessState.payables.map((payable) => {
                const decision = decisionMap.get(payable.id);
                const action = decision ? decision.selected_action : 'EVALUATING';
                const isOverdue = payable.id === 'INV-B' || payable.id === 'INV B';

                return (
                  <div
                    key={payable.id}
                    onClick={() => decision && onSelectDecision(decision)}
                    className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-2xl hover:bg-[#F6FAF7] transition-all cursor-pointer group"
                  >
                    <div className="flex items-center gap-3.5">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                        isOverdue && !isShockActive
                          ? 'bg-[#FEECEC] text-[#DC2626]'
                          : 'bg-[#EEF5F1] text-[#0F2E22]'
                      }`}>
                        {isOverdue && !isShockActive ? (
                          <AlertTriangle className="w-5 h-5" />
                        ) : (
                          <FileText className="w-5 h-5 text-[#2D9A65]" />
                        )}
                      </div>
                      <div>
                        <div className="text-sm font-bold text-[#0F2E22] group-hover:text-[#2D9A65] transition-colors">
                          {payable.id}
                        </div>
                        <div className={`text-xs font-medium ${
                          isOverdue && !isShockActive ? 'text-[#DC2626]' : 'text-[#5A7568]'
                        }`}>
                          {isOverdue && !isShockActive ? 'Overdue' : `Due in ${payable.due_day} days`}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 mt-3 sm:mt-0 justify-between sm:justify-end">
                      <span className={`px-3 py-1 rounded-md text-[11px] font-bold tracking-wide font-mono ${
                        action === 'DELAY'
                          ? 'bg-[#FEECEC] text-[#DC2626]'
                          : action === 'BANK_FINANCE'
                          ? 'bg-[#E0F3EA] text-[#0F2E22]'
                          : 'bg-[#E0F3EA] text-[#0F2E22]'
                      }`}>
                        {getActionLabel(action)}
                      </span>

                      <span className="text-base font-extrabold text-[#0F2E22] font-mono">
                        {formatRupees(payable.amount)}
                      </span>

                      <ArrowRight className="w-4 h-4 text-[#5A7568] opacity-0 group-hover:opacity-100 transition-opacity hidden sm:inline-block" />
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {activeTab === 'receivables' && (
            <div className="space-y-2">
              {businessState.receivables.map((ar) => (
                <div
                  key={ar.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-2xl hover:bg-[#F6FAF7] transition-all"
                >
                  <div className="flex items-center gap-3.5">
                    <div className="w-10 h-10 rounded-xl bg-[#EEF5F1] text-[#2D9A65] flex items-center justify-center">
                      <Building2 className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="text-sm font-bold text-[#0F2E22]">
                        {ar.id} ({ar.customer || 'Customer'})
                      </div>
                      <div className="text-xs text-[#5A7568]">
                        Expected Day {ar.expected_day} • {formatPercent(ar.p_ontime)} confidence
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 mt-3 sm:mt-0 justify-between sm:justify-end">
                    <span className="px-3 py-1 rounded-md text-[11px] font-bold font-mono bg-[#E0F3EA] text-[#0F2E22]">
                      Late: Day {ar.late_day}
                    </span>
                    <span className="text-base font-extrabold text-[#0F2E22] font-mono">
                      {formatRupees(ar.amount)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'financing' && (
            <div className="space-y-3 pt-2">
              {businessState.financing.map((f) => (
                <div
                  key={f.id}
                  className="flex items-center justify-between p-4 rounded-2xl bg-[#F6FAF7] border border-[rgba(15,46,34,0.04)]"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-white text-[#2D9A65] flex items-center justify-center shadow-sm">
                      <Landmark className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-[#0F2E22]">{f.provider}</div>
                      <div className="text-[11px] text-[#5A7568]">Rate: {formatPercent(f.rate)} p.a.</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-bold font-mono text-[#0F2E22]">{formatRupees(f.limit)}</div>
                    <div className="text-[10px] text-[#5A7568] uppercase font-medium">Facility Limit</div>
                  </div>
                </div>
              ))}

              {businessState.obligations.map((ob) => (
                <div
                  key={ob.id}
                  className="flex items-center justify-between p-4 rounded-2xl bg-[#FEECEC]/50 border border-[#FCA5A5]/30"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-white text-[#DC2626] flex items-center justify-center shadow-sm">
                      <CalendarClock className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-[#0F2E22]">{ob.name}</div>
                      <div className="text-[11px] text-[#DC2626]">Unconditional Day {ob.day}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-bold font-mono text-[#DC2626]">{formatRupees(ob.amount)}</div>
                    <div className="text-[10px] text-[#5A7568] uppercase font-medium">Fixed Commitment</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Simulate Event Bottom Card */}
      <div className="bg-white/90 backdrop-blur-md rounded-3xl p-6 sm:p-8 border border-[rgba(15,46,34,0.06)] shadow-stitch-card flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="flex items-start gap-3.5 max-w-sm">
          <div className="w-10 h-10 rounded-xl bg-[#EEF5F1] text-[#0F2E22] flex items-center justify-center flex-shrink-0">
            <FlaskConical className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-extrabold text-[#0F2E22]">
              Simulate Event
            </h3>
            <p className="text-xs text-[#5A7568] leading-relaxed mt-0.5">
              Test how delays or early payments impact your protected liquidity and available cash.
            </p>
          </div>
        </div>

        {/* Slider & Action Buttons */}
        <div className="w-full md:w-auto flex-1 max-w-md space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#0F2E22]">Customer Beta</span>
            <span className="text-2xl font-extrabold text-[#0F2E22] tracking-tight">
              Day {sliderDay}
            </span>
          </div>

          <div>
            <input
              type="range"
              min="0"
              max="30"
              value={sliderDay}
              onChange={(e) => setSliderDay(Number(e.target.value))}
              disabled={isLoading}
              className="w-full h-2 bg-[#EEF5F1] rounded-lg appearance-none cursor-pointer"
            />
            <div className="flex justify-between text-[11px] font-semibold text-[#5A7568] mt-1">
              <span>Early (0)</span>
              <span>Expected (15)</span>
              <span>Delayed (30+)</span>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-1">
            <button
              type="button"
              onClick={onReset}
              disabled={isLoading || (!isShockActive && sliderDay === 9)}
              className="px-5 py-2.5 rounded-full text-xs font-bold text-[#0F2E22] bg-white border border-[rgba(15,46,34,0.15)] hover:bg-[#EEF5F1] transition-all disabled:opacity-40"
            >
              Reset
            </button>

            <button
              type="button"
              onClick={() => onSimulateEvent(sliderDay)}
              disabled={isLoading}
              className="px-6 py-2.5 rounded-full text-xs font-bold text-white bg-[#0F2E22] hover:bg-[#1A4D3B] shadow-md transition-all active:scale-[0.98] disabled:opacity-50"
            >
              {isLoading ? 'Re-optimizing...' : 'Run Simulation'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
