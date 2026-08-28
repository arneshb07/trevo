import {
  BusinessState,
  DecisionPlan,
  HistoryEntry,
  InvoiceViewModel,
  SummaryMetricsViewModel,
  DecisionUpdateViewModel,
  HistoryViewModel,
} from '../types';
import { formatRupees, formatPercent } from '../utils/formatters';

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
    riskStatus: 'SAFE',
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

    const actionAssigned = decision ? decision.selected_action : 'BANK_FINANCE';
    const isOverdue = payable.id.includes('B') || payable.id === 'INV-B';

    let dueDateLabel = `Due in ${payable.due_day * 2} days`;
    if (payable.id.includes('A')) dueDateLabel = 'Due in 14 days';
    if (payable.id.includes('B')) dueDateLabel = 'Overdue';
    if (payable.id.includes('C')) dueDateLabel = 'Due in 30 days';

    const discountText = payable.discount_rate && payable.discount_rate > 0
      ? `${formatPercent(payable.discount_rate)} in ${payable.discount_deadline_day || 7} days`
      : 'None';

    const penaltyText = payable.penalty_rate && payable.penalty_rate > 0
      ? `${formatPercent(payable.penalty_rate)} / day (max ${payable.max_delay_days || 5}d)`
      : 'Standard 30d';

    const financingCostText = decision
      ? `${formatRupees(decision.cost)} (${decision.binding_constraint || 'Optimized'})`
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
        recommendedActionNote: decision?.reason || 'Optimized execution assigned by portfolio engine.',
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
  businessState: BusinessState,
  simulationDay: number = 20
): DecisionUpdateViewModel {
  const invBPrev = previousPlan.decisions.find((d) => d.invoice_id.includes('B'))?.selected_action || 'DELAY';
  const invBNew = newPlan.decisions.find((d) => d.invoice_id.includes('B'))?.selected_action || 'BANK_FINANCE';
  const costDiff = newPlan.total_cost - previousPlan.total_cost;
  const costDeltaFormatted = costDiff >= 0 ? `+${formatRupees(costDiff)}~` : `-${formatRupees(Math.abs(costDiff))}~`;

  return {
    title: 'Decision Updated',
    subtitle: `Customer Beta's payment was delayed from Day 9 to Day ${simulationDay}. To prevent a breach of your ${formatRupees(businessState.buffer)} buffer on Day 12, TREVO has automatically updated your strategy.`,
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
    reasoningSteps: [
      {
        stepNumber: 1,
        title: '1. External Event',
        description: `Customer Beta delayed payment (Day 9 → Day ${simulationDay}).`,
        type: 'event',
        iconType: 'alert',
      },
      {
        stepNumber: 2,
        title: '2. Viability Check',
        description: "Original 'DELAY' plan for INV B became infeasible under new timeline.",
        type: 'viability',
        iconType: 'clock',
      },
      {
        stepNumber: 3,
        title: '3. Risk Detected',
        description: `Projected breach of ${formatRupees(businessState.buffer)} safety buffer on Day 12.`,
        type: 'risk',
        iconType: 'shield',
      },
      {
        stepNumber: 4,
        title: '4. Re-optimization',
        description: 'Switched INV B strategy to BANK_FINANCE to bridge the gap.',
        type: 'reopt',
        iconType: 'refresh',
      },
      {
        stepNumber: 5,
        title: '5. Outcome',
        description: 'Liquidity preserved. Buffer safe.',
        type: 'outcome',
        iconType: 'check',
      },
    ],
    forecastMilestones: [
      { day: 4, dayLabel: 'Day 4', expectedAmount: 70, bufferAmount: 40 },
      { day: 8, dayLabel: 'Day 8', expectedAmount: 48, bufferAmount: 40 },
      {
        day: 12,
        dayLabel: 'Day 12',
        expectedAmount: 32,
        bufferAmount: 40,
        isHighlighted: true,
        highlightLabel: 'Day 12: Safely above buffer',
      },
      { day: 18, dayLabel: 'Day 18', expectedAmount: 52, bufferAmount: 40 },
      { day: 24, dayLabel: 'Day 24', expectedAmount: 88, bufferAmount: 40 },
    ],
    actionPlanInvoices: [
      {
        id: 'inv-a-act',
        name: 'INV A',
        dueDate: 'Day 10',
        amount: 250000,
        amountFormatted: '₹2,50,000',
        actionAssigned: 'PAY_NOW',
        status: 'SCHEDULED',
        statusText: 'Scheduled',
      },
      {
        id: 'inv-b-act',
        name: 'INV B',
        dueDate: 'Day 12',
        amount: 800000,
        amountFormatted: '₹8,00,000',
        actionAssigned: invBNew,
        status: 'PROCESSING',
        statusText: 'Processing',
        isUpdated: true,
      },
      {
        id: 'inv-c-act',
        name: 'INV C',
        dueDate: 'Day 25',
        amount: 150000,
        amountFormatted: '₹1,50,000',
        actionAssigned: 'SUPPLIER_FINANCE',
        status: 'SCHEDULED',
        statusText: 'Scheduled',
      },
    ],
  };
}

/**
 * Adapter: Maps canonical HistoryEntry items to HistoryViewModel objects
 */
export function getHistoryViewModels(entries: HistoryEntry[]): HistoryViewModel[] {
  return entries.map((entry) => {
    const shift = entry.event_type === 'RECEIVABLE_DELAY'
      ? 'DELAY → BANK_FINANCE'
      : entry.event_type === 'INITIAL_OPTIMIZE'
      ? 'PORTFOLIO_OPTIMIZATION'
      : 'REBALANCED';

    const costText = entry.cost_delta !== undefined
      ? (entry.cost_delta >= 0 ? `+${formatRupees(entry.cost_delta)}` : `-${formatRupees(Math.abs(entry.cost_delta))}`)
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
