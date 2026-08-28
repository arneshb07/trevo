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
  liquidityBuffer,
  bufferFormatted,
  title = 'Updated Cash Forecast',
}) => {
  const displayMilestones: ForecastMilestone[] = milestones || (data || []).map((point) => ({
    day: point.day,
    dayLabel: `Day ${point.day}`,
    expectedAmount: point.expectedCash,
    bufferAmount: liquidityBuffer,
    conservativeAmount: point.conservativeCash,
  }));
  const hasTrace = displayMilestones.length > 0;
  const traceValues = displayMilestones.flatMap((point) => [point.expectedAmount, point.conservativeAmount]).filter((value): value is number => value !== undefined);
  const chartValues = liquidityBuffer === undefined ? traceValues : [...traceValues, liquidityBuffer];
  const maxCash = chartValues.length > 0 ? Math.max(...chartValues) : 0;
  const minCash = chartValues.length > 0 ? Math.min(...chartValues) : 0;
  const chartHeight = Math.max(1, maxCash - minCash);
  const getPoint = (amount: number, index: number) => `${24 + (index / Math.max(1, displayMilestones.length - 1)) * 552},${24 + ((maxCash - amount) / chartHeight) * 148}`;
  const expectedPoints = displayMilestones.filter((point) => point.expectedAmount !== undefined);
  const conservativePoints = displayMilestones.filter((point) => point.conservativeAmount !== undefined);

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
            <span className="legend-dot conservative"></span>
            <span>{conservativePoints.length > 0 ? 'Conservative' : 'Conservative forecast unavailable'}</span>
          </div>
          <div className="legend-item">
            <span className="legend-line buffer"></span>
            <span>{bufferFormatted || 'Protected buffer unavailable'}</span>
          </div>
        </div>
      </div>

      <div className="chart-visual-wrapper line-forecast">
        <svg viewBox="0 0 600 200" role="img" aria-label="Cash forecast with expected and conservative traces and protected buffer">
          {liquidityBuffer !== undefined && <><line x1="18" y1={24 + ((maxCash - liquidityBuffer) / chartHeight) * 148} x2="582" y2={24 + ((maxCash - liquidityBuffer) / chartHeight) * 148} className="forecast-buffer-line" /><text x="578" y={20 + ((maxCash - liquidityBuffer) / chartHeight) * 148} textAnchor="end" className="forecast-buffer-label">{bufferFormatted || 'Protected buffer'}</text></>}
          {expectedPoints.length > 1 && <polyline points={expectedPoints.map((point) => getPoint(point.expectedAmount as number, displayMilestones.indexOf(point))).join(' ')} className="forecast-expected-line" />}
          {conservativePoints.length > 1 && <polyline points={conservativePoints.map((point) => getPoint(point.conservativeAmount as number, displayMilestones.indexOf(point))).join(' ')} className="forecast-conservative-line" />}
          {expectedPoints.map((point) => <circle key={`expected-${point.day}`} cx={24 + (displayMilestones.indexOf(point) / Math.max(1, displayMilestones.length - 1)) * 552} cy={24 + ((maxCash - (point.expectedAmount as number)) / chartHeight) * 148} r="4" className="forecast-expected-dot" />)}
          {conservativePoints.map((point) => <circle key={`conservative-${point.day}`} cx={24 + (displayMilestones.indexOf(point) / Math.max(1, displayMilestones.length - 1)) * 552} cy={24 + ((maxCash - (point.conservativeAmount as number)) / chartHeight) * 148} r="4" className="forecast-conservative-dot" />)}
          {displayMilestones.map((point, index) => <text key={point.day} x={24 + (index / Math.max(1, displayMilestones.length - 1)) * 552} y="192" textAnchor="middle" className="forecast-day-label">{point.dayLabel}</text>)}
          {!hasTrace && <text x="300" y="104" textAnchor="middle" className="forecast-empty-label">Forecast traces unavailable</text>}
        </svg>
      </div>

      {liquidityBuffer !== undefined && (
        <div style={{ marginTop: '12px', fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>
          <span>Protected buffer: {bufferFormatted || 'Available from state'}</span>
        </div>
      )}
    </section>
  );
};