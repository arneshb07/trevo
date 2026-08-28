import React from 'react';
import { History as HistoryIcon, ArrowRight, ShieldCheck } from 'lucide-react';
import { HistoryItem } from '../../types';

interface HistoryScreenProps {
  historyItems: HistoryItem[];
  onSelectHistoryItem?: (item: HistoryItem) => void;
}

export const HistoryScreen: React.FC<HistoryScreenProps> = ({
  historyItems,
  onSelectHistoryItem,
}) => {
  return (
    <div className="history-view">
      <div className="liquid-card content-card">
        <div className="card-header-row">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <HistoryIcon size={20} color="var(--color-primary)" />
            <h2 className="card-heading">Optimization & Event History</h2>
          </div>
          <span className="badge badge-safe">
            <ShieldCheck size={13} />
            <span>Audit Trail Active</span>
          </span>
        </div>

        <p style={{ fontSize: '0.88rem', color: 'var(--color-text-secondary)', marginBottom: '20px' }}>
          Chronological record of autonomous rebalancing actions, market events, and working capital safeguards.
        </p>

        {historyItems.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--color-text-muted)' }}>
            <p>No historical events recorded yet.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {historyItems.map((item) => (
              <div
                key={item.id}
                onClick={() => onSelectHistoryItem && onSelectHistoryItem(item)}
                style={{
                  backgroundColor: '#F8FAF9',
                  border: '1px solid var(--color-border-subtle)',
                  borderRadius: 'var(--radius-lg)',
                  padding: '20px 24px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px',
                  cursor: onSelectHistoryItem ? 'pointer' : 'default',
                  transition: 'background-color 150ms ease',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span
                      style={{
                        fontSize: '0.72rem',
                        fontWeight: 700,
                        textTransform: 'uppercase',
                        letterSpacing: '0.04em',
                        color: 'var(--color-primary-text)',
                        backgroundColor: 'var(--color-primary-light)',
                        padding: '3px 8px',
                        borderRadius: 'var(--radius-pill)',
                      }}
                    >
                      {item.eventType}
                    </span>
                    <span style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)' }}>
                      {item.timestamp}
                    </span>
                  </div>

                  <span
                    className={`badge ${
                      item.status === 'OPTIMIZED'
                        ? 'badge-safe'
                        : item.status === 'RESOLVED'
                        ? 'badge-neutral'
                        : 'badge-warning'
                    }`}
                  >
                    {item.status}
                  </span>
                </div>

                <div style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--color-text-title)' }}>
                  {item.title}
                </div>

                <div style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)', lineHeight: '1.45' }}>
                  {item.description}
                </div>

                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginTop: '8px',
                    paddingTop: '10px',
                    borderTop: '1px solid rgba(220, 230, 224, 0.7)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', fontWeight: 600 }}>
                    <span style={{ color: 'var(--color-text-muted)' }}>Shift:</span>
                    <span style={{ color: 'var(--color-primary-text)' }}>{item.strategyShift}</span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.85rem', fontWeight: 700 }}>
                    <span style={{ color: 'var(--color-text-muted)', fontSize: '0.75rem' }}>Impact:</span>
                    <span style={{ color: item.costImpact.startsWith('-') ? 'var(--color-safe-text)' : 'var(--color-warning-text)' }}>
                      {item.costImpact}
                    </span>
                    {onSelectHistoryItem && <ArrowRight size={14} style={{ marginLeft: '6px', color: 'var(--color-text-muted)' }} />}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
