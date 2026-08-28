import React from 'react';
import {
  HelpCircle,
  AlertTriangle,
  Clock,
  ShieldAlert,
  RefreshCw,
  Check,
} from 'lucide-react';
import { DecisionReasoningStep } from '../../types';
import { getActionLabel } from '../../utils/formatters';

interface DecisionExplanationProps {
  title?: string;
  steps?: DecisionReasoningStep[];
}

export const DecisionExplanation: React.FC<DecisionExplanationProps> = ({
  title = 'Why did TREVO change this?',
  steps,
}) => {
  const defaultSteps: DecisionReasoningStep[] = [
    {
      stepNumber: 1,
      title: '1. External Event',
      description: 'Customer Beta delayed payment (Day 9 → Day 20).',
      type: 'event',
      iconType: 'alert',
    },
    {
      stepNumber: 2,
      title: '2. Viability Check',
      description: "Original 'DELAY' plan for INV B became infeasible under new timeline.",
      type: 'viability',
      iconType: 'clock',
    },
    {
      stepNumber: 3,
      title: '3. Risk Detected',
      description: 'Projected breach of ₹5,00,000 safety buffer on Day 12.',
      type: 'risk',
      iconType: 'shield',
    },
    {
      stepNumber: 4,
      title: '4. Re-optimization',
      description: `Switched INV B strategy to ${getActionLabel('BANK_FINANCE')} to bridge the gap.`,
      type: 'reopt',
      iconType: 'refresh',
    },
    {
      stepNumber: 5,
      title: '5. Outcome',
      description: 'Liquidity preserved. Buffer safe.',
      type: 'outcome',
      iconType: 'check',
    },
  ];

  const renderIcon = (step: DecisionReasoningStep) => {
    switch (step.iconType) {
      case 'alert':
        return <AlertTriangle size={14} />;
      case 'clock':
        return <Clock size={14} />;
      case 'shield':
        return <ShieldAlert size={14} />;
      case 'refresh':
        return <RefreshCw size={14} />;
      case 'check':
        return <Check size={14} strokeWidth={3} />;
      default:
        return <Check size={14} />;
    }
  };

  const displaySteps = steps || defaultSteps;

  return (
    <div className="liquid-card reasoning-card">
      <div className="reasoning-title-row">
        <HelpCircle size={18} color="var(--color-primary)" />
        <span>{title}</span>
      </div>

      <div className="reasoning-timeline">
        {displaySteps.map((step) => (
          <div key={step.stepNumber} className="reasoning-step">
            <div
              className={`step-icon-circle ${step.iconType === 'alert' ? 'alert' : ''} ${
                step.type === 'outcome' ? 'outcome' : ''
              }`}
            >
              {renderIcon(step)}
            </div>
            <div className="step-content">
              <div className="step-title">{step.title}</div>
              <div className="step-desc">{step.description}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
