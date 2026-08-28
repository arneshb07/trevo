import React, { useState } from 'react';
import { Sliders, Sparkles } from 'lucide-react';

interface CounterfactualInspectorProps {
  initialDayDelay?: number;
  initialBufferAmount?: number;
  onApplyScenario?: (dayDelay: number) => void;
}

export const CounterfactualInspector: React.FC<CounterfactualInspectorProps> = ({
  initialDayDelay = 20,
  onApplyScenario,
}) => {
  const [dayVal, setDayVal] = useState<number>(initialDayDelay);

  // Dynamic calculations based on slider
  const costImpact = (dayVal - 9) * 50.8;
  const formattedCost = costImpact >= 0 ? `+₹${Math.round(costImpact + 559)}` : `-₹${Math.abs(Math.round(costImpact))}`;
  const liquidityStatus = dayVal > 25 ? 'Requires Credit Line' : dayVal > 15 ? 'Safe with Bank Finance' : 'Safe with Cash Buffer';

  return (
    <div className="liquid-card reasoning-card">
      <div className="reasoning-title-row">
        <Sliders size={18} color="var(--color-primary)" />
        <span>What if...</span>
      </div>

      <p style={{ fontSize: '0.82rem', color: 'var(--color-text-secondary)', marginBottom: '16px' }}>
        Evaluate impact if Customer Beta settles on a different day:
      </p>

      <div style={{ backgroundColor: 'var(--color-canvas)', padding: '16px', borderRadius: 'var(--radius-md)', marginBottom: '16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '8px' }}>
          <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-text-secondary)' }}>Payment Delay Scenario</span>
          <span style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--color-text-title)' }}>Day {dayVal}</span>
        </div>

        <input
          type="range"
          min="0"
          max="35"
          value={dayVal}
          onChange={(e) => setDayVal(Number(e.target.value))}
          className="slider-input"
        />

        <div className="slider-ticks">
          <span>Early (Day 0)</span>
          <span>Baseline (Day 9)</span>
          <span>Severe (Day 30+)</span>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
        <div style={{ background: '#FFFFFF', padding: '12px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border-subtle)' }}>
          <div style={{ fontSize: '0.68rem', color: 'var(--color-text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>ESTIMATED COST</div>
          <div style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--color-warning-text)', marginTop: '2px' }}>{formattedCost}</div>
        </div>
        <div style={{ background: '#FFFFFF', padding: '12px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border-subtle)' }}>
          <div style={{ fontSize: '0.68rem', color: 'var(--color-text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>LIQUIDITY STATUS</div>
          <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--color-primary-text)', marginTop: '4px' }}>{liquidityStatus}</div>
        </div>
      </div>

      {onApplyScenario && (
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <button
            className="btn-primary"
            onClick={() => onApplyScenario(dayVal)}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
          >
            <Sparkles size={14} />
            <span>Recalculate Impact</span>
          </button>
        </div>
      )}
    </div>
  );
};
