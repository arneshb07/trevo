import React, { useState } from 'react';
import { Decision, CounterfactualResponse } from '../types';
import { formatRupees } from '../utils/formatters';
import { 
  ArrowLeft, 
  Check, 
  Play, 
  Pause, 
  Info, 
  TrendingUp, 
  FileSpreadsheet
} from 'lucide-react';

interface DecisionDetailPageProps {
  decision: Decision;
  onBack: () => void;
  counterfactualData?: CounterfactualResponse | null;
  onPlayVoiceBriefing?: () => void;
  isVoiceLoading?: boolean;
}

export const DecisionDetailPage: React.FC<DecisionDetailPageProps> = ({
  decision,
  onBack,
  counterfactualData,
  onPlayVoiceBriefing,
  isVoiceLoading = false,
}) => {
  const [isPlayingAudio, setIsPlayingAudio] = useState<boolean>(false);
  const [counterfactualDays, setCounterfactualDays] = useState<number>(12);

  const handleToggleAudio = () => {
    if (onPlayVoiceBriefing) {
      onPlayVoiceBriefing();
    }
    setIsPlayingAudio(!isPlayingAudio);
  };

  const invoiceId = decision.invoice_id;

  return (
    <div className="w-full max-w-4xl mx-auto px-6 pb-28 pt-2 space-y-6">
      {/* Top Bar */}
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={onBack}
          className="w-9 h-9 rounded-full bg-white border border-[rgba(15,46,34,0.1)] flex items-center justify-center text-[#0F2E22] hover:bg-[#EEF5F1] shadow-sm transition-all"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>

        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-[#E0F3EA] text-[#0F2E22] border border-[#C2E7D5]">
          <span className="w-2 h-2 rounded-full bg-[#2D9A65]" />
          <span>OPTIMIZATION UPDATED</span>
        </div>
      </div>

      {/* Heading */}
      <div className="space-y-1">
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-[#0F2E22]">
          {invoiceId} Optimization Decision
        </h1>
      </div>

      {/* Strategic Pivot Card */}
      <div className="bg-white/90 backdrop-blur-md rounded-3xl p-6 sm:p-8 border border-[rgba(15,46,34,0.06)] shadow-stitch-card">
        <h2 className="text-sm font-extrabold text-[#0F2E22] mb-6">
          Strategic Pivot
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
          {/* Alternative (Delay) */}
          <div className="bg-[#EEF5F1]/60 rounded-2xl p-5 border border-[rgba(15,46,34,0.04)] space-y-3">
            <div className="text-[10px] font-bold text-[#5A7568] uppercase tracking-wider">
              Alternative
            </div>
            <div className="text-2xl font-extrabold text-[#5A7568] line-through font-mono">
              DELAY
            </div>
            <p className="text-xs text-[#5A7568]">
              To preserve short-term liquidity.
            </p>
            <div className="pt-2">
              <span className="inline-block px-3 py-1.5 rounded-lg text-[11px] font-bold bg-[#FEECEC] text-[#DC2626] border border-[#FCA5A5]/30">
                Infeasible (Buffer breach on Day 12, Cash: ₹2,97,600)
              </span>
            </div>
          </div>

          {/* Selected Action (Bank Finance) */}
          <div className="bg-[#E0F3EA]/70 rounded-2xl p-5 border border-[#C2E7D5] space-y-3 relative">
            <div className="flex items-center justify-between">
              <div className="text-[10px] font-bold text-[#2D9A65] uppercase tracking-wider">
                Selected Action
              </div>
              <div className="w-6 h-6 rounded-full bg-[#0F2E22] text-white flex items-center justify-center">
                <Check className="w-3.5 h-3.5" />
              </div>
            </div>
            <div className="text-2xl font-extrabold text-[#0F2E22] font-mono">
              {decision.selected_action}
            </div>
            <p className="text-xs text-[#0F2E22]/80">
              Leverage credit facility based on new forecast data.
            </p>
            <div className="pt-2">
              <span className="inline-block px-3 py-1.5 rounded-lg text-[11px] font-bold bg-[#DEF2E6] text-[#0F2E22] border border-[#95D5B7]/40">
                Feasible (Cash: ₹6,00,000)
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Reasoning Chain Card */}
      <div className="bg-white/90 backdrop-blur-md rounded-3xl p-6 sm:p-8 border border-[rgba(15,46,34,0.06)] shadow-stitch-card space-y-6">
        <h2 className="text-sm font-extrabold text-[#0F2E22]">
          Reasoning Chain
        </h2>

        <div className="space-y-5">
          {/* Market Condition Change */}
          <div className="flex items-start gap-3.5">
            <div className="w-8 h-8 rounded-xl bg-[#EEF5F1] text-[#0F2E22] flex items-center justify-center flex-shrink-0 mt-0.5">
              <TrendingUp className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-xs font-bold text-[#0F2E22]">Market Condition Change</h3>
              <p className="text-xs text-[#5A7568] mt-0.5 leading-relaxed">
                Unexpected dip in short-term cash reserves projected for Week 3 due to customer receivable delay to Day 20.
              </p>
            </div>
          </div>

          {/* Cost of Capital Analysis */}
          <div className="flex items-start gap-3.5">
            <div className="w-8 h-8 rounded-xl bg-[#EEF5F1] text-[#0F2E22] flex items-center justify-center flex-shrink-0 mt-0.5">
              <FileSpreadsheet className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-xs font-bold text-[#0F2E22]">Cost of Capital Analysis</h3>
              <p className="text-xs text-[#5A7568] mt-0.5 leading-relaxed">
                Delaying {invoiceId} would incur late penalties, while current bank facility interest is holding at 12% p.a. for a 30-day term.
              </p>
            </div>
          </div>

          {/* Optimal Action Identified */}
          <div className="flex items-start gap-3.5">
            <div className="w-8 h-8 rounded-xl bg-[#0F2E22] text-white flex items-center justify-center flex-shrink-0 mt-0.5">
              <Check className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-xs font-bold text-[#0F2E22]">Optimal Action Identified</h3>
              <p className="text-xs text-[#5A7568] mt-0.5 leading-relaxed">
                Activating bank finance preserves supplier relationship and satisfies conservative liquidity constraints at minimal net cost of {formatRupees(decision.cost)}.
              </p>
            </div>
          </div>
        </div>

        {/* Listen to Decision Briefing (Audio Player) */}
        <div className="pt-2">
          <div className="bg-[#EEF5F1] rounded-2xl p-4 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={handleToggleAudio}
                className="w-10 h-10 rounded-full bg-[#0F2E22] text-white flex items-center justify-center shadow-md hover:bg-[#1A4D3B] transition-all"
              >
                {isPlayingAudio ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
              </button>
              <div>
                <div className="text-xs font-bold text-[#0F2E22]">
                  Listen to Decision Briefing
                </div>
                <div className="text-[11px] text-[#5A7568]">
                  {isVoiceLoading ? 'Generating audio...' : '1:42 AI Generated Summary'}
                </div>
              </div>
            </div>

            {/* Audio Waveform visualization */}
            <div className="flex items-center gap-1 h-6 pr-2">
              {[40, 70, 90, 60, 30, 80, 100, 50, 60, 40, 80, 60].map((h, i) => (
                <span
                  key={i}
                  className={`w-1 rounded-full transition-all duration-300 ${
                    isPlayingAudio ? 'bg-[#0F2E22] animate-pulse' : 'bg-[#5A7568]/40'
                  }`}
                  style={{ height: `${isPlayingAudio ? (h * (0.5 + Math.random() * 0.5)) : h}%` }}
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Scenario Analysis (Counterfactual Slider) */}
      <div className="bg-white/90 backdrop-blur-md rounded-3xl p-6 sm:p-8 border border-[rgba(15,46,34,0.06)] shadow-stitch-card space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-extrabold text-[#0F2E22]">
            Scenario Analysis
          </h2>
          {counterfactualData && (
            <span className="text-xs text-[#5A7568] font-mono">
              Parameter: {counterfactualData.parameter_name}
            </span>
          )}
        </div>

        <div className="bg-[#F6FAF7] rounded-2xl p-5 border border-[rgba(15,46,34,0.04)] space-y-4">
          <div className="text-[11px] font-bold text-[#5A7568] uppercase tracking-wider">
            What if... Customer Beta delays payment?
          </div>

          <div className="relative pt-4 pb-2">
            {/* Flip threshold marker at 12 Days */}
            <div className="absolute top-0 left-[60%] -translate-x-1/2">
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#FEECEC] text-[#DC2626] border border-[#FCA5A5]">
                Flip Threshold
              </span>
            </div>

            <input
              type="range"
              min="0"
              max="20"
              value={counterfactualDays}
              onChange={(e) => setCounterfactualDays(Number(e.target.value))}
              className="w-full h-2 bg-[#EEF5F1] rounded-lg appearance-none cursor-pointer mt-4"
            />

            <div className="flex justify-between text-[11px] font-bold text-[#5A7568] mt-2">
              <span>0 Days</span>
              <span className="text-[#DC2626]">12 Days (Threshold)</span>
              <span>20 Days</span>
            </div>
          </div>

          <div className="flex items-start gap-2.5 p-3 rounded-xl bg-white border border-[rgba(15,46,34,0.06)] text-xs text-[#5A7568] leading-relaxed">
            <Info className="w-4 h-4 text-[#0F2E22] flex-shrink-0 mt-0.5" />
            <span>
              Adjusting the delay highlights that past <strong className="text-[#0F2E22]">12 days</strong>, DELAY becomes infeasible due to buffer breach, making BANK FINANCE strictly dominant.
            </span>
          </div>
        </div>
      </div>

      {/* Cash Forecast Impact (30-Day Projection Chart) */}
      <div className="bg-white/90 backdrop-blur-md rounded-3xl p-6 sm:p-8 border border-[rgba(15,46,34,0.06)] shadow-stitch-card">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-sm font-extrabold text-[#0F2E22]">
            Cash Forecast Impact
          </h2>
          <div className="flex items-center gap-4 text-xs font-bold text-[#5A7568]">
            <div className="flex items-center gap-1 text-[#0F2E22]">
              <span className="w-2.5 h-2.5 rounded-full bg-[#0F2E22]" />
              <span>With Finance</span>
            </div>
            <div className="flex items-center gap-1 text-[#DC2626]">
              <span className="w-3 h-0.5 bg-[#DC2626] border-b border-dashed" />
              <span>Delayed (Deficit)</span>
            </div>
          </div>
        </div>

        {/* 30-Day Projection Area Chart */}
        <div className="relative h-48 w-full border-b border-[rgba(15,46,34,0.08)] flex items-end">
          {/* Buffer line */}
          <div className="absolute top-[50%] left-0 right-0 border-t border-dashed border-[#DC2626]/70 z-10">
            <span className="absolute -top-3 right-2 text-[9px] font-bold text-[#DC2626] bg-white px-1">
              Liquidity Buffer
            </span>
          </div>

          <svg viewBox="0 0 400 120" className="w-full h-full" preserveAspectRatio="none">
            {/* Safe Curve (With Finance) */}
            <path
              d="M0,70 Q100,50 200,65 T400,20 L400,120 L0,120 Z"
              fill="rgba(45, 154, 101, 0.15)"
            />
            <path
              d="M0,70 Q100,50 200,65 T400,20"
              fill="none"
              stroke="#0F2E22"
              strokeWidth="2.5"
            />

            {/* Breach Curve (Delayed) */}
            <path
              d="M0,70 Q100,50 200,105 T400,60"
              fill="none"
              stroke="#DC2626"
              strokeWidth="1.5"
              strokeDasharray="4 4"
            />
          </svg>
        </div>

        <div className="flex justify-between text-[11px] font-bold text-[#5A7568] mt-2">
          <span>Today</span>
          <span>Week 1</span>
          <span>Week 2</span>
          <span>Week 3</span>
          <span>Week 4</span>
        </div>
      </div>
    </div>
  );
};
