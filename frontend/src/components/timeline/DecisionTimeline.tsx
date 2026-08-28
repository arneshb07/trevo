import React from 'react';
import { Activity, CheckCircle2 } from 'lucide-react';

export interface TimelineMilestone {
  id: string;
  label: string;
  time: string;
  status: 'completed' | 'active' | 'pending';
  detail?: string;
}

interface DecisionTimelineProps {
  milestones?: TimelineMilestone[];
  title?: string;
}

export const DecisionTimeline: React.FC<DecisionTimelineProps> = ({
  title = 'Decision Timeline',
  milestones,
}) => {
  const defaultMilestones: TimelineMilestone[] = [
    {
      id: '1',
      label: 'Event Detected',
      time: '10:42:15 AM',
      status: 'completed',
      detail: 'Customer Beta delayed settlement by 11 days',
    },
    {
      id: '2',
      label: 'Viability & Risk Analysis',
      time: '10:42:16 AM',
      status: 'completed',
      detail: 'Day 12 projected breach of ₹5L safety buffer identified',
    },
    {
      id: '3',
      label: 'Strategy Re-optimization',
      time: '10:42:17 AM',
      status: 'completed',
      detail: 'Optimal solution computed: Switch INV B to BANK_FINANCE',
    },
    {
      id: '4',
      label: 'Decision Updated & Executed',
      time: '10:42:18 AM',
      status: 'completed',
      detail: 'Working capital guardrails preserved with +₹559 delta',
    },
  ];

  const displayMilestones = milestones || defaultMilestones;

  return (
    <div className="liquid-card reasoning-card">
      <div className="reasoning-title-row">
        <Activity size={18} color="var(--color-primary)" />
        <span>{title}</span>
      </div>

      <div className="reasoning-timeline">
        {displayMilestones.map((item) => (
          <div key={item.id} className="reasoning-step">
            <div className="step-icon-circle outcome">
              <CheckCircle2 size={14} />
            </div>
            <div className="step-content">
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'baseline',
                }}
              >
                <div className="step-title">{item.label}</div>
                <span
                  style={{
                    fontSize: '0.7rem',
                    color: 'var(--color-text-muted)',
                    fontFamily: 'monospace',
                  }}
                >
                  {item.time}
                </span>
              </div>
              {item.detail && <div className="step-desc">{item.detail}</div>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
