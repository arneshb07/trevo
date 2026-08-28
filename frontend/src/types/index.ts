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

export interface HistoryItem {
  id: string;
  timestamp: string;
  event: FinancialEvent;
  decisions: Decision[];
  total_cost: number;
}

export interface CounterfactualPoint {
  parameter_value: number;
  optimal_action: ActionType;
  cost: number;
}
