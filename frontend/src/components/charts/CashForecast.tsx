import React from 'react';
import { ForecastMilestone } from '../../types';

export interface CashForecastPoint {
  day: number;
  expectedCash: number;
  conservativeCash: number;
}

interface CashForecastProps {
  data?: CashForecastPoint[];
  milestones?: ForecastMilestone[];
  liquidityBuffer?: number;
  bufferFormatted?: string;
  title?: string;
}

export const CashForecast: React.FC<CashForecastProps> = ({
  data,
  milestones,
  liquidityBuffer = 500000,
  bufferFormatted = '₹5,00,000 Buffer',
  title = 'Updated Cash Forecast',
}) => {
  // Default milestone points matching the approved decision mockup if none provided
  const displayMilestones: ForecastMilestone[] = milestones || [
    { day: 4, dayLabel: 'Day 4', expectedAmount: 70, bufferAmount: 40 },
    { day: 8, dayLabel: 'Day 8', expectedAmount: 45, bufferAmount: 40 },
    {
      day: 12,
      dayLabel: 'Day 12',
      expectedAmount: 30,
      bufferAmount: 40,
      isHighlighted: true,
      highlightLabel: 'Day 12: Safely above buffer',
    },
    { day: 18, dayLabel: 'Day 18', expectedAmount: 48, bufferAmount: 40 },
    { day: 24, dayLabel: 'Day 24', expectedAmount: 85, bufferAmount: 40 },
  ];

  return (
    <section className="liquid-card forecast-card">
      <div className="forecast-header-row">
        <h2 className="card-heading">{title}</h2>
        <div className="chart-legend">
          <div className="legend-item">
            <span className="legend-dot expected"></span>
            <span>Expected</span>
          </div>
          <div className="legend-item">
            <span className="legend-dot buffer"></span>
            <span>Buffer (₹5L)</span>
          </div>
        </div>
      </div>

      <div className="chart-visual-wrapper">
        {/* Horizontal Buffer Line */}
        <div className="buffer-line">
          <span className="buffer-line-label">{bufferFormatted}</span>
        </div>

        {/* Bars */}
        {displayMilestones.map((milestone) => (
          <div key={milestone.day} className="bar-column">
            {milestone.isHighlighted && (
              <div className="bar-tooltip-pill">
                <span className="bar-tooltip-dot"></span>
                <span>{milestone.highlightLabel || `Day ${milestone.day}: Optimal`}</span>
              </div>
            )}
            <div
              className={`bar-pill ${milestone.isHighlighted ? 'highlighted' : ''}`}
              style={{ height: `${milestone.expectedAmount * 1.5}px` }}
            ></div>
          </div>
        ))}
      </div>

      {data && data.length > 0 && (
        <div style={{ marginTop: '12px', fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>
          <span>Liquidity Buffer: {liquidityBuffer}</span>
        </div>
      )}
    </section>
  );
};