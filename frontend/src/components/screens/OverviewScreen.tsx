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
  Building2,
  Landmark,
  CalendarClock,
} from 'lucide-react';
import { BusinessState, SummaryMetricsViewModel, InvoiceViewModel } from '../../types';
import { formatPercent, formatRupees, getActionLabel, formatEngineTerm } from '../../utils/formatters';

interface OverviewScreenProps {
  metrics: SummaryMetricsViewModel;
  invoices: InvoiceViewModel[];
  businessState: BusinessState;
  onRunSimulation: (day: number) => void;
  isSimulationLoading: boolean;
  simulationError?: string;
}

export const OverviewScreen: React.FC<OverviewScreenProps> = ({
  metrics,
  invoices,
  businessState,
  onRunSimulation,
  isSimulationLoading,
  simulationError,
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

  const getActionBadgeClass = (action: string | undefined) => {
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
          <div className="metric-note">
            {businessState.buffer_12days
              ? `${businessState.buffer_12days.status || 'Status unavailable'}${businessState.buffer_12days.horizon_days !== undefined ? ` · ${businessState.buffer_12days.horizon_days}-day horizon` : ''}`
              : 'Buffer horizon status unavailable'}
          </div>
        </div>

        {/* Risk Status */}
        <div className="liquid-card metric-card">
          <div className="metric-header">
            <ShieldCheck className="metric-icon" />
            <span className="metric-label">Risk Status</span>
          </div>
          <div>
            <span className={`badge ${metrics.riskStatus === 'Not available' ? 'badge-neutral' : 'badge-safe'}`}>
              <span className="badge-dot"></span>
              {metrics.riskStatus}
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

        {activeSegment === 'payables' && <div className="invoice-table">
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
                      {getActionLabel(inv.actionAssigned)}
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
                      <div>
                        <div className="expanded-item-label">Decision cost</div>
                        <div className="expanded-item-value">{inv.details.cost !== undefined ? formatRupees(inv.details.cost) : 'Not available'}</div>
                      </div>
                      <div>
                        <div className="expanded-item-label">Repayment</div>
                        <div className="expanded-item-value">{inv.details.repaymentAmount !== undefined ? `${formatRupees(inv.details.repaymentAmount)}${inv.details.repaymentDay !== undefined ? ` on Day ${inv.details.repaymentDay}` : ''}` : 'Not available'}</div>
                      </div>
                      <div>
                        <div className="expanded-item-label">Constraint</div>
                        <div className="expanded-item-value">{formatEngineTerm(inv.details.bindingConstraint)}</div>
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
                    {inv.details.alternatives && inv.details.alternatives.length > 0 && (
                      <div className="alternatives-list">
                        <div className="expanded-item-label">Alternatives considered</div>
                        {inv.details.alternatives.map((alternative) => (
                          <div className="alternative-row" key={alternative.action}>
                            <span>{getActionLabel(alternative.action)}</span>
                            <span>{formatRupees(alternative.cost)}</span>
                            <span className={alternative.feasible ? 'alternative-feasible' : 'alternative-infeasible'}>{alternative.feasible ? 'Feasible' : alternative.reason || 'Not feasible'}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </React.Fragment>
            );
          })}
        </div>}

        {activeSegment === 'receivables' && <div className="position-list">
          {businessState.receivables.map((receivable) => (
            <div className="position-row" key={receivable.id}>
              <div><strong>{receivable.id}</strong><span>{receivable.customer || 'Customer'} · {formatPercent(receivable.p_ontime)} on-time confidence</span></div>
              <div className="position-value"><strong>{formatRupees(receivable.amount)}</strong><span>Expected Day {receivable.expected_day} · Late Day {receivable.late_day}</span></div>
            </div>
          ))}
        </div>}

        {activeSegment === 'financing' && <div className="position-list">
          {businessState.financing.map((facility) => {
            return <div className="position-row" key={facility.id}>
              <div><strong>{facility.provider}</strong><span>{facility.type === 'BANK' ? <Landmark size={13} /> : <Building2 size={13} />} {formatPercent(facility.rate)} annual rate</span></div>
              <div className="position-value"><strong>{formatRupees(facility.limit)} limit</strong><span>Utilization not available from current API</span></div>
            </div>;
          })}
          {businessState.obligations.map((obligation) => <div className="position-row" key={obligation.id}><div><strong>{obligation.name}</strong><span><CalendarClock size={13} /> Mandatory Day {obligation.day}</span></div><div className="position-value"><strong>{formatRupees(obligation.amount)}</strong><span>Fixed outflow</span></div></div>)}
        </div>}
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
                disabled={isSimulationLoading}
              >
                {isSimulationLoading ? 'Reassessing...' : 'Run Simulation'}
              </button>
            </div>
            {simulationError && <p className="simulation-error">{simulationError}</p>}
          </div>
        </div>
      </div>
    </div>
  );
};
