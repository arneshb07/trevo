import {
  BusinessState,
  DecisionPlan,
  HistoryEntry,
  InvoiceViewModel,
  SummaryMetricsViewModel,
  DecisionUpdateViewModel,
  HistoryViewModel,
} from '../types';
import { formatRupees, formatPercent, formatEngineTerm, formatEngineExplanation, getActionLabel } from '../utils/formatters';

/**
 * Adapter: Computes SummaryMetricsViewModel from canonical BusinessState and DecisionPlan
 */
export function getSummaryMetricsViewModel(
  state: BusinessState,
  plan: DecisionPlan
): SummaryMetricsViewModel {
  return {
    availableCash: state.cash,
    availableCashFormatted: formatRupees(state.cash),
    protectedLiquidity: state.buffer,
    protectedLiquidityFormatted: formatRupees(state.buffer),
    riskStatus: 'Not available',
    optimizationCost: plan.total_cost,
    optimizationCostFormatted: formatRupees(plan.total_cost),
  };
}

/**
 * Adapter: Transforms canonical Payables & Decisions into UI InvoiceViewModels for the Overview table
 */
export function getInvoiceViewModels(
  state: BusinessState,
  plan: DecisionPlan
): InvoiceViewModel[] {
  return state.payables.map((payable) => {
    const decision = plan.decisions.find(
      (d) => d.invoice_id.toUpperCase() === payable.id.toUpperCase() ||
             d.invoice_id.replace('-', ' ').toUpperCase() === payable.id.replace('-', ' ').toUpperCase()
    );

    const actionAssigned = decision?.selected_action;
    const isOverdue = false;
    const dueDateLabel = `Day ${payable.due_day}`;

    const discountText = payable.discount_rate && payable.discount_rate > 0
      ? `${formatPercent(payable.discount_rate)} in ${payable.discount_deadline_day || 7} days`
      : 'None';

    const penaltyText = payable.penalty_rate && payable.penalty_rate > 0
      ? `${formatPercent(payable.penalty_rate)} per day · maximum delay ${payable.max_delay_days || 0} days`
      : 'Standard 30d';

    const financingCostText = decision
      ? `${formatRupees(decision.cost)} · ${formatEngineTerm(decision.binding_constraint)}`
      : payable.bank_rate
      ? `${formatPercent(payable.bank_rate)} Bank APR`
      : 'Direct Cash';

    return {
      id: payable.id.toLowerCase(),
      name: payable.id.replace('-', ' '),
      dueDate: dueDateLabel,
      dueInDays: payable.due_day,
      amount: payable.amount,
      amountFormatted: formatRupees(payable.amount),
      actionAssigned: actionAssigned,
      status: isOverdue ? 'OVERDUE' : 'SCHEDULED',
      isOverdue: isOverdue,
      entity: payable.vendor || 'Counterparty Vendor',
      details: {
        discountOffered: discountText,
        penaltyRate: penaltyText,
        financingCost: financingCostText,
        effectiveApr: payable.bank_rate ? formatPercent(payable.bank_rate) : payable.supplier_rate ? formatPercent(payable.supplier_rate) : 'N/A',
        recommendedActionNote: formatEngineExplanation(decision?.reason),
        cost: decision?.cost,
        immediateOutflow: decision?.immediate_outflow,
        repaymentAmount: decision?.repayment_amount,
        repaymentDay: decision?.repayment_day,
        cashBefore: decision?.cash_before,
        cashAfter: decision?.cash_after,
        requiredBuffer: decision?.required_buffer,
        bindingConstraint: formatEngineTerm(decision?.binding_constraint),
        alternatives: decision?.alternatives?.map((alternative) => ({
          ...alternative,
          reason: formatEngineExplanation(alternative.reason),
        })),
      },
    };
  });
}

/**
 * Adapter: Generates DecisionUpdateViewModel from canonical plans and state
 */
export function getDecisionUpdateViewModel(
  previousPlan: DecisionPlan,
  newPlan: DecisionPlan,
  businessState: BusinessState
): DecisionUpdateViewModel {
  const invBPrev = previousPlan.decisions.find((d) => d.invoice_id.includes('B'))?.selected_action || 'DELAY';
  const invBNew = newPlan.decisions.find((d) => d.invoice_id.includes('B'))?.selected_action || 'BANK_FINANCE';
  const costDiff = newPlan.total_cost - previousPlan.total_cost;
  const costDeltaFormatted = costDiff >= 0 ? `+${formatRupees(costDiff)}` : `-${formatRupees(Math.abs(costDiff))}`;
  const receivable = businessState.receivables.find((item) => item.id === 'AR-Y');
  const invBDecision = newPlan.decisions.find((decision) => decision.invoice_id.includes('B'));
  const hasPivot = invBPrev !== invBNew;
  const decisionReason = invBDecision?.reason || 'No decision reason supplied by the current API response.';
  const actionPlanInvoices = getInvoiceViewModels(businessState, newPlan).map((invoice) => ({
    ...invoice,
    status: invoice.id === 'inv-b' ? 'PROCESSING' as const : invoice.status,
    statusText: invoice.id === 'inv-b' ? 'Processing' : invoice.statusText || invoice.status,
    isUpdated: invoice.id === 'inv-b' && invBPrev !== invBNew,
  }));

  const expectedTrace = businessState.expected_cash_trace || businessState.expected_cash_flow_trace;
  const conservativeTrace = businessState.conservative_cash_trace || businessState.conservative_cash_flow_trace;
  const traceDays = Array.from(new Set([
    ...(expectedTrace || []).map((point) => point.day),
    ...(conservativeTrace || []).map((point) => point.day),
  ])).sort((left, right) => left - right);
  const forecastMilestones: import('../types').ForecastMilestone[] = traceDays.map((day) => ({
    day,
    dayLabel: `Day ${day}`,
    expectedAmount: expectedTrace?.find((point) => point.day === day)?.cash,
    bufferAmount: businessState.buffer,
    conservativeAmount: conservativeTrace?.find((point) => point.day === day)?.cash,
  }));

  return {
    title: 'Decision Updated',
    subtitle: receivable ? `Customer ${receivable.customer || 'receivable'} is expected on Day ${receivable.expected_day}. ${hasPivot ? `TREVO changed INV-B from ${getActionLabel(invBPrev)} to ${getActionLabel(invBNew)}.` : 'TREVO reassessed the portfolio and retained the current plan.'}` : 'The current API response does not include receivable timing details.',
    tag: 'Real-time Adjustment',
    previousPlan: {
      target: 'INV B',
      action: invBPrev,
    },
    newOptimalPlan: {
      target: 'INV B',
      action: invBNew,
    },
    costDelta: costDeltaFormatted,
    costDeltaRaw: costDiff,
    costDeltaDirection: costDiff >= 0 ? 'up' : 'down',
    previousCost: previousPlan.total_cost,
    newCost: newPlan.total_cost,
    reasoningSteps: [
      {
        stepNumber: 1,
        title: '1. External Event',
        description: receivable ? `Customer ${receivable.customer || 'receivable'} expected payment on Day ${receivable.expected_day}.` : 'Receivable event details unavailable.',
        type: 'event',
        iconType: 'alert',
      },
      {
        stepNumber: 2,
        title: '2. Viability Check',
        description: hasPivot ? `Previous ${getActionLabel(invBPrev)} plan for INV-B was no longer selected after reassessment.` : 'The previous plan remained selected after reassessment.',
        type: 'viability',
        iconType: 'clock',
      },
      {
        stepNumber: 3,
        title: '3. Risk Detected',
        description: invBDecision?.binding_constraint ? `Constraint affecting this decision: ${formatEngineTerm(invBDecision.binding_constraint)}.` : 'No binding constraint was supplied by the current API response.',
        type: 'risk',
        iconType: 'shield',
      },
      {
        stepNumber: 4,
        title: '4. Re-optimization',
        description: `Switched INV B strategy to ${getActionLabel(invBNew)} to bridge the gap.`,
        type: 'reopt',
        iconType: 'refresh',
      },
      {
        stepNumber: 5,
        title: '5. Outcome',
        description: `Portfolio cost is ${formatRupees(newPlan.total_cost)}. ${formatEngineExplanation(decisionReason)}`,
        type: 'outcome',
        iconType: 'check',
      },
    ],
    forecastMilestones,
    actionPlanInvoices,
    liquidityBuffer: businessState.buffer,
  };
}

/**
 * Adapter: Maps canonical HistoryEntry items to HistoryViewModel objects
 */
export function getHistoryViewModels(entries: HistoryEntry[]): HistoryViewModel[] {
  return entries.map((entry, index) => {
    const priorEntry = entries[index + 1];
    const currentDecision = entry.decisions.find((decision) => decision.invoice_id.includes('B'));
    const priorDecision = priorEntry?.decisions.find((decision) => decision.invoice_id.includes('B'));
    const didPivot = currentDecision && priorDecision && currentDecision.selected_action !== priorDecision.selected_action;
    const shift = entry.event_type === 'RECEIVABLE_DELAY'
      ? didPivot
        ? `${getActionLabel(priorDecision.selected_action)} → ${getActionLabel(currentDecision.selected_action)}`
        : 'No strategy change'
      : entry.event_type === 'INITIAL_OPTIMIZE'
      ? 'Portfolio optimization'
      : 'Rebalanced';

    const costText = entry.cost_delta !== undefined
      ? entry.cost_delta === 0
        ? 'No cost change'
        : entry.cost_delta > 0 ? `+${formatRupees(entry.cost_delta)}` : `-${formatRupees(Math.abs(entry.cost_delta))}`
      : formatRupees(entry.total_cost);

    return {
      id: entry.id,
      timestamp: entry.timestamp,
      eventType: entry.event_type.replace(/_/g, ' '),
      title: entry.description,
      description: `Optimized total execution cost at ${formatRupees(entry.total_cost)}. Guardrails verified.`,
      strategyShift: shift,
      costImpact: costText,
      status: entry.event_type === 'RECEIVABLE_DELAY' ? 'OPTIMIZED' : 'RESOLVED',
    };
  });
}
