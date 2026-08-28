import React, { useState } from 'react';
import {
  Wallet,
  Shield,
  ShieldCheck,
  TrendingDown,
  FileText,
  AlertTriangle,
  FlaskConical,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { SummaryMetrics, Invoice } from '../../types';

interface OverviewScreenProps {
  metrics: SummaryMetrics;
  invoices: Invoice[];
  onRunSimulation: (day: number) => void;
}

export const OverviewScreen: React.FC<OverviewScreenProps> = ({
  metrics,
  invoices,
  onRunSimulation,
}) => {
  const [activeSegment, setActiveSegment] = useState<'payables' | 'receivables' | 'financing'>('payables');
  const [expandedInvoiceId, setExpandedInvoiceId] = useState<string | null>('inv-b');
  const [simulationDay, setSimulationDay] = useState<number>(9);

  const toggleExpand = (id: string) => {
    setExpandedInvoiceId((prev) => (prev === id ? null : id));
  };

  const handleResetSimulation = () => {
    setSimulationDay(9);
  };

  const getActionBadgeClass = (action: string) => {
    if (action === 'DELAY') return 'badge-warning';
    return 'badge-safe';
  };

  return (
    <div className="overview-view">
      {/* 4 Summary Metric Cards */}
      <div className="metrics-grid">
        {/* Available Cash */}
        <div className="liquid-card metric-card">
          <div className="metric-header">
            <Wallet className="metric-icon" />
            <span className="metric-label">Available Cash</span>
          </div>
          <div className="metric-value">{metrics.availableCashFormatted}</div>
        </div>

        {/* Protected Liquidity */}
        <div className="liquid-card metric-card">
          <div className="metric-header">
            <Shield className="metric-icon" />
            <span className="metric-label">Protected Liquidity</span>
          </div>
          <div className="metric-value">{metrics.protectedLiquidityFormatted}</div>
        </div>

        {/* Risk Status */}
        <div className="liquid-card metric-card">
          <div className="metric-header">
            <ShieldCheck className="metric-icon" />
            <span className="metric-label">Risk Status</span>
          </div>
          <div>
            <span className="badge badge-safe">
              <span className="badge-dot"></span>
              SAFE
            </span>
          </div>
        </div>

        {/* Optimization Cost */}
        <div className="liquid-card metric-card">
          <div className="metric-header">
            <TrendingDown className="metric-icon" />
            <span className="metric-label">Optimization Cost</span>
          </div>
          <div className="metric-value">{metrics.optimizationCostFormatted}</div>
        </div>
      </div>

      {/* Working Capital Position Card */}
      <div className="liquid-card content-card">
        <div className="card-header-row">
          <h2 className="card-heading">Working Capital Position</h2>
          <div className="segmented-control" role="tablist">
            <button
              className={`segment-btn ${activeSegment === 'payables' ? 'active' : ''}`}
              onClick={() => setActiveSegment('payables')}
            >
              Payables
            </button>
            <button
              className={`segment-btn ${activeSegment === 'receivables' ? 'active' : ''}`}
              onClick={() => setActiveSegment('receivables')}
            >
              Receivables
            </button>
            <button
              className={`segment-btn ${activeSegment === 'financing' ? 'active' : ''}`}
              onClick={() => setActiveSegment('financing')}
            >
              Financing
            </button>
          </div>
        </div>

        {/* Invoice List */}
        <div className="invoice-table">
          {invoices.map((inv) => {
            const isExpanded = expandedInvoiceId === inv.id;
            return (
              <React.Fragment key={inv.id}>
                <div
                  className="invoice-row"
                  onClick={() => toggleExpand(inv.id)}
                  title="Click to view detailed recommendation"
                >
                  <div className="invoice-row-left">
                    <div className={`invoice-icon-box ${inv.isOverdue ? 'warning' : ''}`}>
                      {inv.isOverdue ? <AlertTriangle size={18} /> : <FileText size={18} />}
                    </div>
                    <div>
                      <div className="invoice-name">{inv.name}</div>
                      <div className={`invoice-due ${inv.isOverdue ? 'warning' : ''}`}>
                        {inv.dueDate}
                      </div>
                    </div>
                  </div>

                  <div className="invoice-row-right">
                    <span className={`badge ${getActionBadgeClass(inv.actionAssigned)}`}>
                      {inv.actionAssigned}
                    </span>
                    <div className="invoice-amount">{inv.amountFormatted}</div>
                    <div style={{ color: 'var(--color-text-muted)', display: 'flex', alignItems: 'center' }}>
                      {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    </div>
                  </div>
                </div>

                {/* Expandable Invoice Detail Panel */}
                {isExpanded && inv.details && (
                  <div className="invoice-expanded-panel">
                    <div className="expanded-grid">
                      <div>
                        <div className="expanded-item-label">Entity</div>
                        <div className="expanded-item-value">{inv.entity || 'Counterparty'}</div>
                      </div>
                      <div>
                        <div className="expanded-item-label">Discount Opportunity</div>
                        <div className="expanded-item-value">{inv.details.discountOffered || 'None'}</div>
                      </div>
                      <div>
                        <div className="expanded-item-label">Penalty / Terms</div>
                        <div className="expanded-item-value">{inv.details.penaltyRate || 'Standard 30d'}</div>
                      </div>
                      <div>
                        <div className="expanded-item-label">Strategy Route</div>
                        <div className="expanded-item-value">{inv.details.financingCost || 'Direct Cash'}</div>
                      </div>
                    </div>
                    {inv.details.recommendedActionNote && (
                      <div
                        style={{
                          marginTop: '12px',
                          paddingTop: '10px',
                          borderTop: '1px solid rgba(220, 230, 224, 0.6)',
                          fontSize: '0.8rem',
                          color: 'var(--color-text-secondary)',
                          lineHeight: '1.4',
                        }}
                      >
                        <strong style={{ color: 'var(--color-primary-text)' }}>Optimization Logic: </strong>
                        {inv.details.recommendedActionNote}
                      </div>
                    )}
                  </div>
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>

      {/* Simulate Event Card */}
      <div className="liquid-card content-card">
        <div className="simulate-grid">
          <div>
            <div className="simulate-left-header">
              <FlaskConical size={20} color="var(--color-primary)" />
              <h3 className="simulate-title">Simulate Event</h3>
            </div>
            <p className="simulate-desc">
              Test how delays or early payments impact your protected liquidity and available cash.
            </p>
          </div>

          <div className="simulate-controls-box">
            <div className="simulate-customer-row">
              <span className="customer-name">Customer Beta</span>
              <span className="day-display">Day {simulationDay}</span>
            </div>

            <div className="slider-container">
              <input
                type="range"
                min="0"
                max="32"
                value={simulationDay}
                onChange={(e) => setSimulationDay(Number(e.target.value))}
                className="slider-input"
                aria-label="Simulation day slider"
              />
              <div className="slider-ticks">
                <span>Early (0)</span>
                <span>Expected (15)</span>
                <span>Delayed (30+)</span>
              </div>
            </div>

            <div className="simulate-actions-row">
              <button
                type="button"
                className="btn-secondary"
                onClick={handleResetSimulation}
              >
                Reset
              </button>
              <button
                type="button"
                className="btn-primary"
                onClick={() => onRunSimulation(simulationDay)}
              >
                Run Simulation
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
