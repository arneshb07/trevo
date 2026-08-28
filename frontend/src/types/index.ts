export type NavigationTab = 'overview' | 'decisions' | 'history';

export type InvoiceAction = 'BANK_FINANCE' | 'DELAY' | 'SUPPLIER_FINANCE' | 'PAY_CASH' | 'DYNAMIC_DISCOUNT';

export type InvoiceStatus = 'SCHEDULED' | 'PROCESSING' | 'OVERDUE' | 'COMPLETED' | 'OPTIMIZED';

export interface Invoice {
  id: string;
  name: string;
  dueDate: string;
  dueInDays?: number;
  amount: number;
  amountFormatted: string;
  actionAssigned: InvoiceAction;
  status: InvoiceStatus;
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
  };
}

export interface SummaryMetrics {
  availableCash: number;
  availableCashFormatted: string;
  protectedLiquidity: number;
  protectedLiquidityFormatted: string;
  riskStatus: 'SAFE' | 'AT_RISK' | 'CRITICAL';
  optimizationCost: number;
  optimizationCostFormatted: string;
}

export interface SimulationState {
  customer: string;
  currentDay: number;
  expectedDay: number;
  minDay: number;
  maxDay: number;
  isRunning: boolean;
  hasSimulated: boolean;
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
  expectedAmount: number;
  bufferAmount: number;
  isHighlighted?: boolean;
  highlightLabel?: string;
}

export interface DecisionUpdateData {
  title: string;
  subtitle: string;
  tag: string;
  previousPlan: {
    target: string;
    action: InvoiceAction;
  };
  newOptimalPlan: {
    target: string;
    action: InvoiceAction;
  };
  costDelta: string;
  costDeltaRaw: number;
  costDeltaDirection: 'up' | 'down';
  reasoningSteps: DecisionReasoningStep[];
  forecastMilestones: ForecastMilestone[];
  actionPlanInvoices: Invoice[];
}

export interface HistoryItem {
  id: string;
  timestamp: string;
  eventType: string;
  title: string;
  description: string;
  strategyShift: string;
  costImpact: string;
  status: 'OPTIMIZED' | 'RESOLVED' | 'TRIGGERED';
}
