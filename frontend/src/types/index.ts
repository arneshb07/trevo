// Canonical Types from origin/feat/frontend-core

export type ImportanceLevel = 'LOW' | 'MEDIUM' | 'HIGH';

export type ActionType = 
  | 'PAY_NOW' 
  | 'PAY_MATURITY' 
  | 'DELAY' 
  | 'BANK_FINANCE' 
  | 'SUPPLIER_FINANCE';

export interface Payable {
  id: string;
  vendor?: string;
  amount: number;
  due_day: number;
  discount_rate?: number;
  discount_deadline_day?: number;
  max_delay_days?: number;
  penalty_rate?: number;
  bank_rate?: number;
  supplier_rate?: number;
  importance: ImportanceLevel;
}

export interface Receivable {
  id: string;
  customer?: string;
  amount: number;
  expected_day: number;
  p_ontime: number;
  late_day: number;
}

export interface Obligation {
  id: string;
  name: string;
  amount: number;
  day: number;
}

export interface FinancingFacility {
  id: string;
  type: 'BANK' | 'SUPPLIER';
  provider: string;
  limit: number;
  rate: number;
}

export interface BusinessState {
  cash: number;
  buffer: number;
  payables: Payable[];
  receivables: Receivable[];
  obligations: Obligation[];
  financing: FinancingFacility[];
  expected_cash_trace?: CashTracePoint[];
  conservative_cash_trace?: CashTracePoint[];
  expected_cash_flow_trace?: CashTracePoint[];
  conservative_cash_flow_trace?: CashTracePoint[];
  buffer_12days?: BufferStatus;
}

export interface CashTracePoint {
  day: number;
  cash: number;
}

export interface BufferStatus {
  value?: number;
  horizon_days?: number;
  breach_day?: number;
  minimum_projected_cash?: number;
  status?: string;
}

export interface DecisionAlternative {
  action: ActionType;
  cost: number;
  feasible: boolean;
  reason?: string;
}

export interface Decision {
  invoice_id: string;
  selected_action: ActionType;
  cost: number;
  execution_day?: number;
  binding_constraint?: string;
  alternatives?: DecisionAlternative[];
  reason?: string;
  immediate_outflow?: number;
  repayment_amount?: number;
  repayment_day?: number;
  cash_before?: number;
  cash_after?: number;
  required_buffer?: number;
  reason_codes?: string[];
}

export interface DecisionPlan {
  decisions: Decision[];
  total_cost: number;
  timestamp?: string;
}

export type EventType = 
  | 'RECEIVABLE_DELAY' 
  | 'PAYABLE_ADDED' 
  | 'CASH_INFLOW' 
  | 'FINANCING_LIMIT_CHANGE';

export interface FinancialEvent {
  type: EventType;
  receivable_id?: string;
  new_expected_day?: number;
  payable?: Payable;
  amount?: number;
  day?: number;
  [key: string]: unknown;
}

export interface EventResponse {
  changed_decisions: Decision[];
  previous_plan: DecisionPlan;
  new_plan: DecisionPlan;
  updated_state?: BusinessState;
}

export interface HistoryEntry {
  id: string;
  timestamp: string;
  event_type: string;
  description: string;
  total_cost: number;
  cost_delta?: number;
  decisions: Decision[];
}

export interface CounterfactualPoint {
  parameter_value: number;
  optimal_action: ActionType;
  cost: number;
  feasible: boolean;
  reason?: string;
}

export interface CounterfactualResponse {
  invoice_id: string;
  parameter_name: string;
  points: CounterfactualPoint[];
}

export interface ApiErrorResponse {
  detail?: string;
  message?: string;
  status_code?: number;
}

export interface VoiceExplanationResponse {
  audio: string | null;
  text: string;
}

// UI Navigation & View Specific Types

export type NavigationTab = 'overview' | 'decisions' | 'history';

export interface InvoiceViewModel {
  id: string;
  name: string;
  dueDate: string;
  dueInDays?: number;
  amount: number;
  amountFormatted: string;
  actionAssigned?: ActionType;
  status: 'SCHEDULED' | 'PROCESSING' | 'OVERDUE' | 'COMPLETED' | 'OPTIMIZED';
  statusText?: string;
  isOverdue?: boolean;
  isUpdated?: boolean;
  type?: 'payables' | 'receivables' | 'financing';
  entity?: string;
  details?: {
    discountOffered?: string;
    penaltyRate?: string;
    financingCost?: string;
    effectiveApr?: string;
    recommendedActionNote?: string;
    cost?: number;
    immediateOutflow?: number;
    repaymentAmount?: number;
    repaymentDay?: number;
    cashBefore?: number;
    cashAfter?: number;
    requiredBuffer?: number;
    bindingConstraint?: string;
    alternatives?: DecisionAlternative[];
  };
}

export interface SummaryMetricsViewModel {
  availableCash: number;
  availableCashFormatted: string;
  protectedLiquidity: number;
  protectedLiquidityFormatted: string;
  riskStatus: string;
  optimizationCost: number;
  optimizationCostFormatted: string;
}

export interface DecisionReasoningStep {
  stepNumber: number;
  title: string;
  description: string;
  type: 'event' | 'viability' | 'risk' | 'reopt' | 'outcome';
  iconType: 'alert' | 'clock' | 'shield' | 'refresh' | 'check';
}

export interface ForecastMilestone {
  day: number;
  dayLabel: string;
  expectedAmount?: number;
  bufferAmount?: number;
  conservativeAmount?: number;
  isHighlighted?: boolean;
  highlightLabel?: string;
}

export interface DecisionUpdateViewModel {
  title: string;
  subtitle: string;
  tag: string;
  previousPlan: {
    target: string;
    action: ActionType;
  };
  newOptimalPlan: {
    target: string;
    action: ActionType;
  };
  costDelta: string;
  costDeltaRaw: number;
  costDeltaDirection: 'up' | 'down';
  previousCost: number;
  newCost: number;
  reasoningSteps: DecisionReasoningStep[];
  forecastMilestones: ForecastMilestone[];
  actionPlanInvoices: InvoiceViewModel[];
  liquidityBuffer?: number;
}

export interface HistoryViewModel {
  id: string;
  timestamp: string;
  eventType: string;
  title: string;
  description: string;
  strategyShift: string;
  costImpact: string;
  status: 'OPTIMIZED' | 'RESOLVED' | 'TRIGGERED';
}
