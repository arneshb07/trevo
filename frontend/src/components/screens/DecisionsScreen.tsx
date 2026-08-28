import React from 'react';
import { ArrowLeft, Clock, RefreshCw } from 'lucide-react';
import { DecisionUpdateData } from '../../types';
import { DecisionDiff } from '../diff/DecisionDiff';
import { DecisionExplanation } from '../explanation/DecisionExplanation';
import { CashForecast } from '../charts/CashForecast';

interface DecisionsScreenProps {
  decisionData: DecisionUpdateData;
  onBackToOverview: () => void;
}

export const DecisionsScreen: React.FC<DecisionsScreenProps> = ({
  decisionData,
  onBackToOverview,
}) => {
  return (
    <div className="decisions-view">
      {/* Top Header Navigation & Status Bar */}
      <div className="decisions-top-bar">
        <span className="badge badge-safe">
          <span className="badge-dot"></span>
          {decisionData.tag}
        </span>
        <button
          onClick={onBackToOverview}
          className="back-link-btn"
          title="Return to Overview screen"
        >
          <ArrowLeft size={15} />
          <span>BACK TO OVERVIEW</span>
        </button>
      </div>

      {/* Decision Hero Title & Context */}
      <div className="decision-hero-header">
        <h1 className="page-title" style={{ fontSize: '2.5rem', marginBottom: '8px' }}>
          {decisionData.title}
        </h1>
        <p className="page-subtitle" style={{ fontSize: '1rem', lineHeight: '1.5' }}>
          {decisionData.subtitle}
        </p>
      </div>

      {/* Two Column Layout: Strategy Shift + Why did TREVO change this? */}
      <div className="decisions-two-col">
        <DecisionDiff
          previousTarget={decisionData.previousPlan.target}
          previousAction={decisionData.previousPlan.action}
          newAction={decisionData.newOptimalPlan.action}
          costDelta={decisionData.costDelta}
        />

        <DecisionExplanation
          steps={decisionData.reasoningSteps}
        />
      </div>

      {/* Cash Forecast Card */}
      <CashForecast
        milestones={decisionData.forecastMilestones}
        title="Updated Cash Forecast"
      />

      {/* Current Payables Action Plan Card */}
      <div className="liquid-card content-card">
        <div className="card-header-row">
          <h2 className="card-heading">Current Payables Action Plan</h2>
        </div>

        <table className="action-plan-table">
          <thead>
            <tr>
              <th>INVOICE</th>
              <th>DUE DATE</th>
              <th>AMOUNT</th>
              <th>ACTION ASSIGNED</th>
              <th>STATUS</th>
            </tr>
          </thead>
          <tbody>
            {decisionData.actionPlanInvoices.map((row) => (
              <tr
                key={row.id}
                className={`action-plan-row ${row.isUpdated ? 'highlighted' : ''}`}
              >
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontWeight: 700 }}>{row.name}</span>
                    {row.isUpdated && (
                      <span
                        className="badge badge-dark"
                        style={{ fontSize: '0.62rem', padding: '2px 6px' }}
                      >
                        UPDATED
                      </span>
                    )}
                  </div>
                </td>
                <td>{row.dueDate}</td>
                <td style={{ fontWeight: 700 }}>{row.amountFormatted}</td>
                <td>
                  <span
                    className={`badge ${
                      row.actionAssigned === 'BANK_FINANCE'
                        ? 'badge-dark'
                        : row.actionAssigned === 'PAY_CASH'
                        ? 'badge-neutral'
                        : 'badge-safe'
                    }`}
                  >
                    {row.actionAssigned}
                  </span>
                </td>
                <td>
                  <div
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      fontSize: '0.8rem',
                      color: row.isUpdated ? 'var(--color-primary-text)' : 'var(--color-text-secondary)',
                      fontWeight: row.isUpdated ? 600 : 500,
                    }}
                  >
                    {row.isUpdated ? (
                      <RefreshCw size={13} className="spin-slow" />
                    ) : (
                      <Clock size={13} />
                    )}
                    <span>{row.statusText || row.status}</span>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
