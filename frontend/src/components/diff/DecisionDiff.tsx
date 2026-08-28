import React from 'react';
import { ArrowDown, ArrowRightLeft } from 'lucide-react';
import { ActionType } from '../../types';

interface DecisionDiffProps {
  previousTarget?: string;
  previousAction?: ActionType | string;
  newTarget?: string;
  newAction?: ActionType | string;
  costDelta?: string;
  costDeltaLabel?: string;
}

export const DecisionDiff: React.FC<DecisionDiffProps> = ({
  previousTarget = 'INV B',
  previousAction = 'DELAY',
  newAction = 'BANK_FINANCE',
  costDelta = '+₹559~',
  costDeltaLabel = 'COST DELTA',
}) => {
  return (
    <div className="liquid-card strategy-shift-card">
      <div className="strategy-title-row">
        <ArrowRightLeft size={18} color="var(--color-primary)" />
        <span>Strategy Shift</span>
      </div>

      <div className="shift-plan-box">
        <div className="shift-plan-label">PREVIOUS PLAN ({previousTarget})</div>
        <div className="shift-plan-value">{previousAction}</div>
      </div>

      <div className="shift-arrow-divider">
        <div className="arrow-circle">
          <ArrowDown size={16} strokeWidth={2.5} />
        </div>
      </div>

      <div className="shift-plan-box optimal">
        <div className="shift-plan-label">NEW OPTIMAL PLAN</div>
        <div className="shift-plan-value">{newAction}</div>
      </div>

      <div className="cost-delta-footer">
        <div className="cost-delta-label">{costDeltaLabel}</div>
        <div className="cost-delta-value">{costDelta}</div>
      </div>
    </div>
  );
};
