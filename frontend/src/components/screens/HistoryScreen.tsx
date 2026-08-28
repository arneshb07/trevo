import React from 'react';
import {
  ArrowRight,
  CheckCircle2,
  History as HistoryIcon,
  Landmark,
  RotateCw,
  ShieldCheck,
  TrendingUp,
} from 'lucide-react';
import { HistoryViewModel } from '../../types';

interface HistoryScreenProps {
  historyItems: HistoryViewModel[];
  onSelectHistoryItem?: (item: HistoryViewModel) => void;
}

type TimelineEvent = {
  item: HistoryViewModel;
  title: string;
  time: string;
  typeLabel: string;
  affectedEntity: string;
  strategyFrom?: string;
  strategyTo?: string;
  outcome: string;
  side: 'left' | 'right';
  tone: 'optimized' | 'resolved' | 'warning';
};

const cleanText = (value: string) =>
  value
    .replace(/â‚¹/g, '₹')
    .replace(/â†’/g, '→')
    .replace(/\s+/g, ' ')
    .trim();

const getTimeLabel = (timestamp: string) => {
  const parts = timestamp.split(',');
  return cleanText(parts[1]?.trim() || timestamp);
};

const getTitle = (item: HistoryViewModel) => {
  if (item.eventType.includes('RECEIVABLE DELAY')) return 'Customer Beta Delay';
  if (item.eventType.includes('INITIAL OPTIMIZE')) return 'Portfolio Baseline';
  return cleanText(item.title);
};

const getAffectedEntity = (item: HistoryViewModel) => {
  if (item.eventType.includes('RECEIVABLE DELAY')) return 'INV B';
  if (item.eventType.includes('INITIAL OPTIMIZE')) return 'PORTFOLIO';
  return 'WORKING CAPITAL';
};

const getOutcome = (item: HistoryViewModel) => {
  if (item.eventType.includes('RECEIVABLE DELAY')) return 'Liquidity Preserved';
  if (item.status === 'RESOLVED') return 'Verified';
  return 'Optimized';
};

const splitStrategyShift = (strategyShift: string) => {
  const normalized = cleanText(strategyShift);
  const delimiter = normalized.includes('→') ? '→' : undefined;

  if (!delimiter) {
    return { strategyFrom: undefined, strategyTo: normalized };
  }

  const [strategyFrom, strategyTo] = normalized.split(delimiter).map((part) => part.trim());
  return { strategyFrom, strategyTo };
};

const buildTimelineEvents = (historyItems: HistoryViewModel[]): TimelineEvent[] =>
  historyItems.map((item, index) => {
    const { strategyFrom, strategyTo } = splitStrategyShift(item.strategyShift);
    const isRiskEvent = item.eventType.includes('RECEIVABLE DELAY') || item.status === 'TRIGGERED';

    return {
      item,
      title: getTitle(item),
      time: getTimeLabel(item.timestamp),
      typeLabel: item.eventType.includes('RECEIVABLE DELAY')
        ? 'System Auto Resolve'
        : item.eventType.includes('INITIAL OPTIMIZE')
        ? 'Scheduled Check'
        : cleanText(item.eventType),
      affectedEntity: getAffectedEntity(item),
      strategyFrom,
      strategyTo,
      outcome: getOutcome(item),
      side: index % 2 === 0 ? 'right' : 'left',
      tone: isRiskEvent ? 'warning' : item.status === 'RESOLVED' ? 'resolved' : 'optimized',
    };
  });

const renderTimelineIcon = (event: TimelineEvent) => {
  if (event.tone === 'warning') return <RotateCw size={16} />;
  if (event.title.includes('Baseline')) return <TrendingUp size={16} />;
  if (event.outcome === 'Verified') return <Landmark size={16} />;
  return <CheckCircle2 size={16} />;
};

export const HistoryScreen: React.FC<HistoryScreenProps> = ({
  historyItems,
  onSelectHistoryItem,
}) => {
  const timelineEvents = buildTimelineEvents(historyItems);

  return (
    <div className="history-view">
      <div className="history-hero">
        <div className="history-kicker badge badge-safe">
          <HistoryIcon size={13} />
          <span>Decision Journal</span>
        </div>
        <h1 className="page-title">Decision Journal</h1>
        <p className="page-subtitle">
          A chronological record of autonomous optimization events and working capital safeguards.
        </p>
      </div>

      {timelineEvents.length === 0 ? (
        <div className="liquid-card history-empty">
          <ShieldCheck size={22} color="var(--color-primary)" />
          <p style={{ marginTop: '10px' }}>No historical events recorded yet.</p>
        </div>
      ) : (
        <section className="history-timeline" aria-label="Decision history timeline">
          <div className="history-date-marker">Today</div>

          {timelineEvents.map((event, index) => (
            <React.Fragment key={event.item.id}>
              <article className={`history-item ${event.side}`}>
                <div className="history-meta">
                  <div className="history-time">{event.time}</div>
                  <div className="history-type">{event.typeLabel}</div>
                </div>

                <div className={`history-node ${event.tone}`} aria-hidden="true" />

                <div
                  className="liquid-card history-card"
                  onClick={() => onSelectHistoryItem && onSelectHistoryItem(event.item)}
                  role={onSelectHistoryItem ? 'button' : undefined}
                  tabIndex={onSelectHistoryItem ? 0 : undefined}
                  onKeyDown={(keyboardEvent) => {
                    if (
                      onSelectHistoryItem &&
                      (keyboardEvent.key === 'Enter' || keyboardEvent.key === ' ')
                    ) {
                      keyboardEvent.preventDefault();
                      onSelectHistoryItem(event.item);
                    }
                  }}
                >
                  <div className="history-card-header">
                    <div>
                      <div className="history-card-title">{event.title}</div>
                      <div className="history-type">{cleanText(event.item.description)}</div>
                    </div>
                    <div className="history-card-icon">{renderTimelineIcon(event)}</div>
                  </div>

                  <div className="history-card-grid">
                    <div className="history-field">
                      <span className="history-field-label">Affected Entity</span>
                      <span className="history-field-value">{event.affectedEntity}</span>
                    </div>

                    <div className="history-field">
                      <span className="history-field-label">Action Pivot</span>
                      <span className="history-field-value history-shift">
                        {event.strategyFrom && <span>{event.strategyFrom}</span>}
                        {event.strategyFrom && <ArrowRight size={13} />}
                        <span>{event.strategyTo}</span>
                      </span>
                    </div>

                    <div className="history-field">
                      <span className="history-field-label">Net Optimization</span>
                      <span
                        className={`history-field-value ${
                          cleanText(event.item.costImpact).startsWith('+') ? 'warning' : 'positive'
                        }`}
                      >
                        {cleanText(event.item.costImpact)}
                      </span>
                    </div>

                    <div className="history-field">
                      <span className="history-field-label">Outcome</span>
                      <span className="badge badge-safe">{event.outcome}</span>
                    </div>
                  </div>
                </div>
              </article>

              {index === 0 && timelineEvents.length > 1 && (
                <div className="history-date-marker secondary">Earlier Today</div>
              )}
            </React.Fragment>
          ))}
        </section>
      )}
    </div>
  );
};
