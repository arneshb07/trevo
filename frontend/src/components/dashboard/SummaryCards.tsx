import React from 'react';
import { Wallet, ShieldCheck, AlertTriangle } from 'lucide-react';
import { formatRupees } from '../../utils/formatters';
import { BusinessState } from '../../types';

interface SummaryCardsProps {
  businessState: BusinessState;
}

export const SummaryCards: React.FC<SummaryCardsProps> = ({ businessState }) => {
  const isSafe = businessState.cash >= businessState.buffer;

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
      {/* 1. Cash Position */}
      <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-5 shadow-sm relative overflow-hidden">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Cash Position
          </span>
          <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-400 flex items-center justify-center">
            <Wallet className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-3">
          <div className="text-2xl sm:text-3xl font-extrabold text-white font-mono tracking-tight">
            {formatRupees(businessState.cash)}
          </div>
          <p className="text-xs text-slate-400 mt-1">Available deployable capital</p>
        </div>
      </div>

      {/* 2. Protected Liquidity */}
      <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-5 shadow-sm relative overflow-hidden">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Protected Liquidity
          </span>
          <div className="w-8 h-8 rounded-lg bg-indigo-500/10 text-indigo-400 flex items-center justify-center">
            <ShieldCheck className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-3">
          <div className="text-2xl sm:text-3xl font-extrabold text-white font-mono tracking-tight">
            {formatRupees(businessState.buffer)}
          </div>
          <p className="text-xs text-slate-400 mt-1">Hard conservative safety buffer</p>
        </div>
      </div>

      {/* 3. Risk Status */}
      <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-5 shadow-sm relative overflow-hidden">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Risk Status
          </span>
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
            isSafe ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'
          }`}>
            {isSafe ? <ShieldCheck className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
          </div>
        </div>
        <div className="mt-3 flex items-baseline gap-2">
          <span className={`text-2xl sm:text-3xl font-extrabold tracking-tight ${
            isSafe ? 'text-emerald-400' : 'text-rose-400'
          }`}>
            {isSafe ? 'SAFE' : 'BUFFER BREACH'}
          </span>
          <span className="text-xs text-slate-400">
            {isSafe ? '(Coverage 100%)' : '(Constraint Violated)'}
          </span>
        </div>
        <p className="text-xs text-slate-400 mt-1">
          {isSafe ? 'Buffer preserved at all checkpoints' : 'Liquidity deficit projected'}
        </p>
      </div>
    </div>
  );
};
