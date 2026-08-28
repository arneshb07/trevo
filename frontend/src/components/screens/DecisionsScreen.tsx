import React, { useState } from 'react';
import { ArrowLeft, Clock, RefreshCw } from 'lucide-react';
import { CounterfactualResponse, DecisionUpdateViewModel } from '../../types';
import { formatRupees, getActionLabel } from '../../utils/formatters';
import { DecisionDiff } from '../diff/DecisionDiff';
import { DecisionExplanation } from '../explanation/DecisionExplanation';
import { CashForecast } from '../charts/CashForecast';
import { Play, Volume2 } from 'lucide-react';

interface DecisionsScreenProps {
  decisionData: DecisionUpdateViewModel;
  onBackToOverview: () => void;
  onExplainVoice: () => void;
  isVoiceLoading: boolean;
  voiceError?: string;
  voiceText?: string;
  voiceExplanation?: string;
  counterfactualData?: CounterfactualResponse | null;
  isCounterfactualLoading: boolean;
  onLoadCounterfactual: () => void;
  counterfactualError?: string;
  hasDecisionChange: boolean;
}

export const DecisionsScreen: React.FC<DecisionsScreenProps> = ({
  decisionData,
  onBackToOverview,
  onExplainVoice,
  isVoiceLoading,
  voiceError,
  voiceText,
  voiceExplanation,
  counterfactualData,
  isCounterfactualLoading,
  onLoadCounterfactual,
  counterfactualError,
  hasDecisionChange,
}) => {
  const [selectedCounterfactualIndex, setSelectedCounterfactualIndex] = useState(0);
  const selectedCounterfactual = counterfactualData?.points[selectedCounterfactualIndex];
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
          {hasDecisionChange ? decisionData.title : 'Plan Reassessed'}
        </h1>
        <p className="page-subtitle" style={{ fontSize: '1rem', lineHeight: '1.5' }}>
          {decisionData.subtitle}
        </p>
      </div>

      {/* Two Column Layout: Strategy Shift + Why did TREVO change this? */}
      <div className="decisions-two-col">
        {hasDecisionChange ? <DecisionDiff
          previousTarget={decisionData.previousPlan.target}
          previousAction={decisionData.previousPlan.action}
          newAction={decisionData.newOptimalPlan.action}
          costDelta={decisionData.costDelta}
          previousCost={decisionData.previousCost}
          newCost={decisionData.newCost}
        /> : <div className="liquid-card strategy-shift-card no-change-card"><div className="card-heading">No strategy change required</div><p className="page-subtitle">TREVO reassessed the event and retained the existing plan.</p></div>}

        <DecisionExplanation
          steps={decisionData.reasoningSteps}
        />
      </div>

      <div className="liquid-card voice-briefing-card">
        <div>
          <div className="card-heading">Decision briefing</div>
          <p className="page-subtitle">Text remains available when narration is unavailable.</p>
        </div>
        <button type="button" className="btn-primary" onClick={onExplainVoice} disabled={isVoiceLoading}>
          {isVoiceLoading ? <><Volume2 size={15} className="spin-slow" /> Generating briefing...</> : <><Play size={15} /> Explain Decision</>}
        </button>
        {voiceError && <p className="voice-error">{voiceError}</p>}
        {voiceExplanation && <p className="voice-explanation">{voiceExplanation}</p>}
        {voiceText && <audio className="voice-audio" controls src={voiceText} />}
      </div>

      <div className="liquid-card counterfactual-card">
        <div className="counterfactual-header">
          <div>
            <div className="card-heading">Counterfactual sweep</div>
            <p className="page-subtitle">See the parameter value at which the optimizer changes action.</p>
          </div>
          <button type="button" className="btn-secondary" onClick={onLoadCounterfactual} disabled={isCounterfactualLoading}>
            {isCounterfactualLoading ? 'Loading sweep...' : counterfactualData ? 'Refresh sweep' : 'View sweep'}
          </button>
        </div>
        {counterfactualData && counterfactualData.points.length > 0 ? (
          <>
            <input
              type="range"
              min="0"
              max={counterfactualData.points.length - 1}
              value={selectedCounterfactualIndex}
              onChange={(event) => setSelectedCounterfactualIndex(Number(event.target.value))}
              className="slider-input"
              aria-label={`${counterfactualData.parameter_name} counterfactual value`}
            />
            {selectedCounterfactual && <div className="counterfactual-result">
              <span>If {counterfactualData.parameter_name} is {selectedCounterfactual.parameter_value}, TREVO chooses <strong>{getActionLabel(selectedCounterfactual.optimal_action)}</strong>.</span>
              <span>{formatRupees(selectedCounterfactual.cost)} · {selectedCounterfactual.feasible ? 'Feasible' : selectedCounterfactual.reason || 'Not feasible'}</span>
            </div>}
          </>
        ) : counterfactualData ? <p className="empty-state">No sweep points are available for this decision.</p> : <p className="empty-state">{counterfactualError || 'Load the backend sweep to inspect alternative parameter values.'}</p>}
      </div>

      {/* Cash Forecast Card */}
      <CashForecast
        milestones={decisionData.forecastMilestones}
        liquidityBuffer={decisionData.liquidityBuffer}
        bufferFormatted={decisionData.liquidityBuffer !== undefined ? formatRupees(decisionData.liquidityBuffer) : undefined}
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
              <th>COST</th>
              <th>REPAYMENT</th>
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
                        : row.actionAssigned === 'PAY_NOW' || row.actionAssigned === 'PAY_MATURITY'
                        ? 'badge-neutral'
                        : 'badge-safe'
                    }`}
                  >
                        {getActionLabel(row.actionAssigned)}
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
                <td>{row.details?.cost !== undefined ? formatRupees(row.details.cost) : 'Not available'}</td>
                <td>{row.details?.repaymentAmount !== undefined ? `${formatRupees(row.details.repaymentAmount)}${row.details.repaymentDay !== undefined ? ` · Day ${row.details.repaymentDay}` : ''}` : 'Not available'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
