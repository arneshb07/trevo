import { BusinessState, DecisionPlan } from '../types';

export const baselineBusinessState: BusinessState = {
  cash: 1000000,
  buffer: 500000,
  payables: [
    {
      id: "INV-A",
      vendor: "Supplier A",
      amount: 200000,
      due_day: 5,
      discount_rate: 0.03,
      discount_deadline_day: 2,
      max_delay_days: 0,
      penalty_rate: 0,
      bank_rate: 0.12,
      supplier_rate: 0,
      importance: "MEDIUM"
    },
    {
      id: "INV-B",
      vendor: "Supplier B",
      amount: 300000,
      due_day: 7,
      discount_rate: 0,
      discount_deadline_day: 0,
      max_delay_days: 5,
      penalty_rate: 0.008,
      bank_rate: 0.12,
      supplier_rate: 0,
      importance: "LOW"
    },
    {
      id: "INV-C",
      vendor: "Supplier C",
      amount: 150000,
      due_day: 10,
      discount_rate: 0,
      discount_deadline_day: 0,
      max_delay_days: 0,
      penalty_rate: 0,
      bank_rate: 0,
      supplier_rate: 0.07,
      importance: "HIGH"
    }
  ],
  receivables: [
    {
      id: "AR-X",
      customer: "Alpha",
      amount: 500000,
      expected_day: 4,
      p_ontime: 0.80,
      late_day: 14
    },
    {
      id: "AR-Y",
      customer: "Beta",
      amount: 300000,
      expected_day: 9,
      p_ontime: 0.90,
      late_day: 16
    }
  ],
  obligations: [
    {
      id: "PAYROLL",
      name: "Payroll",
      amount: 400000,
      day: 6
    }
  ],
  financing: [
    {
      id: "BANK_FACILITY",
      type: "BANK",
      provider: "Bank",
      limit: 500000,
      rate: 0.12
    },
    {
      id: "SUPPLIER_C_FACILITY",
      type: "SUPPLIER",
      provider: "Supplier C",
      limit: 200000,
      rate: 0.07
    }
  ]
};

export const baselineDecisionPlan: DecisionPlan = {
  total_cost: 5236,
  decisions: [
    {
      invoice_id: "INV-A",
      selected_action: "BANK_FINANCE",
      cost: 1973,
      execution_day: 2,
      binding_constraint: "BANK_LIMIT",
      reason: "Bank finance captures 3% early payment discount at Day 2 with net interest benefit",
      alternatives: [
        { action: "PAY_NOW", cost: 0, feasible: true },
        { action: "PAY_MATURITY", cost: 6000, feasible: true },
        { action: "BANK_FINANCE", cost: 1973, feasible: true },
        { action: "DELAY", cost: 0, feasible: false, reason: "Delay not permitted" }
      ]
    },
    {
      invoice_id: "INV-B",
      selected_action: "DELAY",
      cost: 2400,
      execution_day: 12,
      binding_constraint: "LIQUIDITY_BUFFER",
      reason: "5-day delay is optimal under baseline cash flow with 0.8% penalty",
      alternatives: [
        { action: "DELAY", cost: 2400, feasible: true },
        { action: "BANK_FINANCE", cost: 2959, feasible: true },
        { action: "PAY_MATURITY", cost: 0, feasible: false, reason: "Violates conservative buffer at Day 7" }
      ]
    },
    {
      invoice_id: "INV-C",
      selected_action: "SUPPLIER_FINANCE",
      cost: 863,
      execution_day: 10,
      binding_constraint: "SUPPLIER_LIMIT",
      reason: "Supplier C financing utilized at 7% annual interest",
      alternatives: [
        { action: "SUPPLIER_FINANCE", cost: 863, feasible: true },
        { action: "BANK_FINANCE", cost: 1479, feasible: true },
        { action: "DELAY", cost: 0, feasible: false, reason: "Delay not permitted" }
      ]
    }
  ]
};

export const shockBusinessState: BusinessState = {
  ...baselineBusinessState,
  receivables: [
    {
      id: "AR-X",
      customer: "Alpha",
      amount: 500000,
      expected_day: 4,
      p_ontime: 0.80,
      late_day: 14
    },
    {
      id: "AR-Y",
      customer: "Beta",
      amount: 300000,
      expected_day: 20,
      p_ontime: 0.90,
      late_day: 20
    }
  ]
};

export const shockDecisionPlan: DecisionPlan = {
  total_cost: 5795,
  decisions: [
    {
      invoice_id: "INV-A",
      selected_action: "BANK_FINANCE",
      cost: 1973,
      execution_day: 2,
      binding_constraint: "BANK_LIMIT",
      reason: "Retains bank financing to secure 3% early discount",
      alternatives: [
        { action: "PAY_NOW", cost: 0, feasible: true },
        { action: "BANK_FINANCE", cost: 1973, feasible: true }
      ]
    },
    {
      invoice_id: "INV-B",
      selected_action: "BANK_FINANCE",
      cost: 2959,
      execution_day: 7,
      binding_constraint: "LIQUIDITY_BUFFER",
      reason: "Switched from DELAY to BANK_FINANCE because AR-Y delay to Day 20 renders DELAY infeasible against conservative liquidity buffer at Day 12",
      alternatives: [
        { action: "BANK_FINANCE", cost: 2959, feasible: true },
        { action: "DELAY", cost: 2400, feasible: false, reason: "Buffer shortfall ₹2,00,000 at Day 12" },
        { action: "PAY_MATURITY", cost: 0, feasible: false, reason: "Buffer shortfall at Day 7" }
      ]
    },
    {
      invoice_id: "INV-C",
      selected_action: "SUPPLIER_FINANCE",
      cost: 863,
      execution_day: 10,
      binding_constraint: "SUPPLIER_LIMIT",
      reason: "Supplier financing remains optimal and isolated from bank facility",
      alternatives: [
        { action: "SUPPLIER_FINANCE", cost: 863, feasible: true },
        { action: "BANK_FINANCE", cost: 1479, feasible: true }
      ]
    }
  ]
};
