import {
  BusinessState,
  DecisionPlan,
  HistoryEntry,
  InvoiceViewModel,
  SummaryMetricsViewModel,
  DecisionUpdateViewModel,
  HistoryViewModel,
  DecisionEngineResponse,
  EngineInvoiceDecision,
  HistoryApiResponse,
} from '../types';
import { formatRupees, formatPercent, formatEngineTerm, formatEngineExplanation, getActionLabel } from '../utils/formatters';

/**
 * Adapter: Computes SummaryMetricsViewModel from canonical BusinessState and DecisionPlan
 */
export function getSummaryMetricsViewModel(
  state: BusinessState,
  plan: DecisionPlan,
  engineResponse?: DecisionEngineResponse
): SummaryMetricsViewModel {
  return {
    availableCash: state.cash,
    availableCashFormatted: formatRupees(state.cash),
    protectedLiquidity: state.buffer,
    protectedLiquidityFormatted: formatRupees(state.buffer),
    riskStatus: engineResponse ? (engineResponse.is_feasible ? 'SAFE' : 'AT RISK') : 'Not available',
    optimizationCost: plan.total_cost,
    optimizationCostFormatted: formatRupees(plan.total_cost),
    totalFaceValue: engineResponse?.summary.total_face_value,
    netPortfolioSavings: engineResponse?.summary.net_portfolio_savings,
    totalBankDrawn: engineResponse?.summary.total_bank_drawn,
    totalSupplierDrawn: engineResponse?.summary.total_supplier_drawn,
    minConservativeCash: engineResponse?.summary.min_conservative_cash,
    minSolvencyMargin: engineResponse?.conservative_trace?.min_solvency_margin,
    hasShortfall: engineResponse?.conservative_trace?.has_shortfall,
    globalBindingConstraints: engineResponse?.global_binding_constraints,
    globalReasonCodes: engineResponse?.global_reason_codes,
  };
}

export function engineToDecisionPlan(response: DecisionEngineResponse): DecisionPlan {
  return {
    total_cost: response.total_cost,
    timestamp: new Date().toISOString(),
    decisions: Object.values(response.invoices).map((invoice: EngineInvoiceDecision) => ({
      invoice_id: invoice.payable_id,
      selected_action: invoice.selected_action,
      cost: invoice.cost,
      execution_day: invoice.payment_day,
      binding_constraint: invoice.binding_constraints?.[0],
      reason: invoice.reason_codes?.map((code) => formatEngineTerm(code)).join(', '),
      immediate_outflow: invoice.immediate_outflow,
      repayment_amount: invoice.repayment_amount || undefined,
      repayment_day: invoice.repayment_day || undefined,
      cash_before: invoice.cash_before,
      cash_after: invoice.cash_after,
      required_buffer: invoice.required_buffer,
      alternatives: invoice.alternatives?.map((alternative) => ({
        action: alternative.action,
        cost: alternative.action_cost,
        feasible: alternative.is_eligible,
        reason: alternative.ineligibility_reason || undefined,
      })),
      reason_codes: invoice.reason_codes,
    })),
  };
}

export function normalizeBusinessState(state: BusinessState): BusinessState {
  return {
    ...state,
    obligations: state.obligations.map((obligation, index) => ({
      ...obligation,
      id: obligation.id || `obligation-${index}`,
      name: obligation.name || 'Fixed obligation',
    })),
    financing: state.financing.map((facility, index) => ({
      ...facility,
      id: facility.id || facility.source || `facility-${index}`,
      type: facility.type || (facility.source === 'BANK' ? 'BANK' : 'SUPPLIER'),
      provider: facility.provider || facility.source || 'Financing facility',
    })),
  };
}

export function engineToForecastMilestones(response: DecisionEngineResponse): import('../types').ForecastMilestone[] {
  const expected = response.expected_trace?.points || [];
  const conservative = response.conservative_trace?.points || [];
  const days = Array.from(new Set([...expected, ...conservative].map((point) => point.day))).sort((a, b) => a - b);
  return days.map((day) => ({
    day,
    dayLabel: `Day ${day}`,
    expectedAmount: expected.find((point) => point.day === day)?.ending_cash,
    conservativeAmount: conservative.find((point) => point.day === day)?.ending_cash,
    bufferAmount: conservative.find((point) => point.day === day)?.buffer || expected.find((point) => point.day === day)?.buffer,
  }));
}

export function historyApiToEntries(response: HistoryApiResponse): HistoryEntry[] {
  return response.history.map((entry) => {
    const prevPlan = engineToDecisionPlan(entry.previous_plan);
    const newPlan = engineToDecisionPlan(entry.new_plan);
    const eventType = entry.event_type || (entry.payload?.type as string) || 'REOPTIMIZATION';
    
    let description = `Event #${entry.event_id || entry.id} re-optimized portfolio`;
    if (entry.payload?.invoice_id && entry.payload?.new_day) {
      description = `Receivable ${entry.payload.invoice_id} delayed to Day ${entry.payload.new_day}`;
    }

    return {
      id: String(entry.id),
      timestamp: entry.created_at,
      event_type: eventType,
      description,
      total_cost: entry.new_plan.total_cost,
      cost_delta: entry.new_plan.total_cost - entry.previous_plan.total_cost,
      decisions: newPlan.decisions,
      previous_plan: prevPlan,
      new_plan: newPlan,
    };
  });
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
  // Dynamically find which invoice changed action between previousPlan and newPlan
  let changedDecisionNew = newPlan.decisions.find((newDec) => {
    const prevDec = previousPlan.decisions.find((p) => p.invoice_id === newDec.invoice_id);
    return prevDec && prevDec.selected_action !== newDec.selected_action;
  });

  if (!changedDecisionNew) {
    changedDecisionNew = newPlan.decisions.find((newDec) => {
      const prevDec = previousPlan.decisions.find((p) => p.invoice_id === newDec.invoice_id);
      return prevDec && prevDec.cost !== newDec.cost;
    }) || newPlan.decisions[0];
  }

  const targetInvoiceId = changedDecisionNew?.invoice_id || 'INV-B';
  const changedDecisionPrev = previousPlan.decisions.find((d) => d.invoice_id === targetInvoiceId);

  const prevAction = changedDecisionPrev?.selected_action || 'DELAY';
  const newAction = changedDecisionNew?.selected_action || 'BANK_FINANCE';
  const hasPivot = prevAction !== newAction;

  const costDiff = newPlan.total_cost - previousPlan.total_cost;
  const costDeltaFormatted = costDiff >= 0 ? `+${formatRupees(costDiff)}` : `-${formatRupees(Math.abs(costDiff))}`;

  // Find the receivable that was modified or primary receivable
  const receivable = businessState.receivables.find((r) => r.id === 'AR-Y') || businessState.receivables[0];
  const decisionReason = changedDecisionNew?.reason || 'CP-SAT optimization complete.';

  const actionPlanInvoices = getInvoiceViewModels(businessState, newPlan).map((invoice) => {
    const isTarget = invoice.name.toUpperCase().replace(/\s+/g, '-') === targetInvoiceId.toUpperCase();
    return {
      ...invoice,
      status: isTarget ? ('PROCESSING' as const) : invoice.status,
      statusText: isTarget ? 'Processing' : invoice.statusText || invoice.status,
      isUpdated: isTarget && hasPivot,
    };
  });

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
    subtitle: receivable
      ? `Customer ${receivable.customer || receivable.id} expected on Day ${receivable.expected_day}. ${
          hasPivot
            ? `TREVO changed ${targetInvoiceId} from ${getActionLabel(prevAction)} to ${getActionLabel(newAction)}.`
            : 'TREVO reassessed the portfolio and retained the current plan.'
        }`
      : 'The current API response does not include receivable timing details.',
    tag: 'Real-time Adjustment',
    previousPlan: {
      target: targetInvoiceId.replace('-', ' '),
      action: prevAction,
    },
    newOptimalPlan: {
      target: targetInvoiceId.replace('-', ' '),
      action: newAction,
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
        description: receivable
          ? `Receivable ${receivable.id} (${receivable.customer || 'Customer'}) expected on Day ${receivable.expected_day}.`
          : 'Receivable event timing updated in portfolio state.',
        type: 'event',
        iconType: 'alert',
      },
      {
        stepNumber: 2,
        title: '2. Viability Check',
        description: hasPivot
          ? `Previous ${getActionLabel(prevAction)} plan for ${targetInvoiceId} was no longer viable after liquidity reassessment.`
          : 'The previous plan remained viable and optimal after reassessment.',
        type: 'viability',
        iconType: 'clock',
      },
      {
        stepNumber: 3,
        title: '3. Risk Detected',
        description: changedDecisionNew?.binding_constraint
          ? `Active constraint: ${formatEngineTerm(changedDecisionNew.binding_constraint)}.`
          : `Protected buffer requirement (₹${(businessState.buffer / 100000).toFixed(1)}L) preserved across all horizon checkpoints.`,
        type: 'risk',
        iconType: 'shield',
      },
      {
        stepNumber: 4,
        title: '4. Re-optimization',
        description: hasPivot
          ? `Switched ${targetInvoiceId} strategy to ${getActionLabel(newAction)} to maintain liquidity margin.`
          : 'Portfolio re-optimized jointly across all invoice options.',
        type: 'reopt',
        iconType: 'refresh',
      },
      {
        stepNumber: 5,
        title: '5. Outcome',
        description: `Optimized total cost: ${formatRupees(newPlan.total_cost)}. ${formatEngineExplanation(decisionReason)}`,
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
  return entries.map((entry) => {
    const prevDecisions = entry.previous_plan?.decisions || [];
    const newDecisions = entry.new_plan?.decisions || entry.decisions;

    // Find invoice that pivoted
    let pivotedInvoiceId: string | undefined;
    let fromAction: string | undefined;
    let toAction: string | undefined;

    for (const newDec of newDecisions) {
      const prevDec = prevDecisions.find((p) => p.invoice_id === newDec.invoice_id);
      if (prevDec && prevDec.selected_action !== newDec.selected_action) {
        pivotedInvoiceId = newDec.invoice_id;
        fromAction = prevDec.selected_action;
        toAction = newDec.selected_action;
        break;
      }
    }

    const shift = (fromAction && toAction)
      ? `${getActionLabel(fromAction)} → ${getActionLabel(toAction)}`
      : entry.event_type.includes('INITIAL')
      ? 'Portfolio optimization'
      : 'No strategy change';

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
      description: `Optimized execution cost at ${formatRupees(entry.total_cost)}. ${pivotedInvoiceId ? `Affected payable: ${pivotedInvoiceId}.` : 'Portfolio rebalanced.'}`,
      strategyShift: shift,
      costImpact: costText,
      status: entry.event_type === 'RECEIVABLE_DELAY' ? 'OPTIMIZED' : 'RESOLVED',
    };
  });
}

