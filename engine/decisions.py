"""Structured Decision Output Layer for CapitalOps Decision Engine."""

from typing import Dict, List, Optional, Union
from pydantic import BaseModel, Field

from engine.data_models import BusinessState, Payable
from engine.financing import ActionType, ActionResult, calculate_action
from engine.forecast import CashFlowTrace
from engine.constraints import get_eligible_actions, is_action_eligible
from engine.optimizer import OptimizationResult, OptimizationStatus, optimize


class AlternativeAction(BaseModel):
    """Evaluation of an alternative financing/payment action for an invoice."""

    action: ActionType = Field(..., description="Action type")
    is_eligible: bool = Field(..., description="Whether this action meets eligibility requirements")
    ineligibility_reason: Optional[str] = Field(default=None, description="Reason if action is not eligible")
    action_cost: float = Field(..., description="Total nominal cost if this action were selected")
    net_savings: float = Field(default=0.0, description="Cost savings vs invoice face value")
    is_selected: bool = Field(..., description="Whether this action was chosen by the optimizer")


class InvoiceDecision(BaseModel):
    """Complete structured decision contract for an individual payable invoice."""

    payable_id: str = Field(..., description="Unique invoice ID")
    nominal_amount: float = Field(..., description="Original invoice face amount")
    due_day: int = Field(..., description="Day invoice is due")
    selected_action: ActionType = Field(..., description="Action chosen by the CP-SAT optimizer")
    feasibility: bool = Field(..., description="Whether this decision plan is feasible")
    cost: float = Field(..., description="Nominal lifecycle cost of selected action")
    net_savings: float = Field(default=0.0, description="Savings or financing fee vs invoice amount")
    immediate_outflow: float = Field(..., description="Immediate cash outlay at payment day")
    payment_day: int = Field(..., description="Day index of immediate payment")
    repayment_amount: float = Field(default=0.0, description="Future repayment obligation amount")
    repayment_day: Optional[int] = Field(default=None, description="Day index of future repayment")
    cash_before: float = Field(..., description="Conservative cash balance before payment execution")
    cash_after: float = Field(..., description="Conservative cash balance after payment execution")
    required_buffer: float = Field(..., description="Safety liquidity buffer requirement")
    alternatives: List[AlternativeAction] = Field(default_factory=list, description="List of evaluated alternative actions")
    binding_constraints: List[str] = Field(default_factory=list, description="Constraints active or binding on this invoice")
    reason_codes: List[str] = Field(default_factory=list, description="Deterministic machine-readable reason codes")


class DecisionSummary(BaseModel):
    """Aggregate portfolio summary of decision results."""

    total_invoices: int = Field(..., description="Number of invoices processed")
    total_face_value: float = Field(..., description="Total nominal invoice face value")
    total_optimized_cost: float = Field(..., description="Total optimized payment and financing cost")
    net_portfolio_savings: float = Field(..., description="Total savings / net fee relative to face value")
    total_bank_drawn: float = Field(..., description="Total capital drawn from bank facility")
    total_supplier_drawn: float = Field(..., description="Total capital drawn from supplier facility")
    min_conservative_cash: float = Field(..., description="Lowest cash balance in conservative forecast")
    buffer: float = Field(..., description="Required liquidity buffer")


class StructuredDecisionPlan(BaseModel):
    """Top-level structured decision output conforming to the CapitalOps specification."""

    status: OptimizationStatus = Field(..., description="Optimizer convergence status")
    is_feasible: bool = Field(..., description="Whether the entire portfolio decision plan is feasible")
    total_cost: float = Field(..., description="Total portfolio cost")
    summary: DecisionSummary = Field(..., description="Executive portfolio summary")
    invoices: Dict[str, InvoiceDecision] = Field(default_factory=dict, description="Per-invoice decision breakdown")
    conservative_trace: Optional[CashFlowTrace] = Field(default=None, description="Conservative cash trajectory")
    expected_trace: Optional[CashFlowTrace] = Field(default=None, description="Expected cash trajectory")
    global_binding_constraints: List[str] = Field(default_factory=list, description="Global portfolio binding constraints")
    global_reason_codes: List[str] = Field(default_factory=list, description="Global portfolio decision reason codes")


def _determine_reason_codes(
    payable: Payable,
    selected_action: ActionType,
    state: BusinessState,
    result: OptimizationResult,
) -> List[str]:
    """Generate deterministic reason codes based on model constraints and optimizer results."""
    codes: List[str] = []

    # 1. Action specific baseline reason codes
    if selected_action == ActionType.BANK_FINANCE:
        # Check if payroll/obligation or buffer pressure drove bank financing
        has_near_obligation = any(abs(o.day - payable.due_day) <= 2 for o in state.obligations)
        if has_near_obligation:
            codes.append("OBLIGATION_PAYROLL_PROTECTION")
        codes.append("LIQUIDITY_BUFFER_PRESERVATION")
        bank_limit = next((f.limit for f in state.financing if f.source.upper() == "BANK"), 0.0)
        bank_drawn = result.financing_usage.get("BANK", 0.0)
        if bank_limit > 0 and abs(bank_drawn - bank_limit) < 1.0:
            codes.append("BANK_FACILITY_CAPACITY_BOUND")

    elif selected_action == ActionType.DELAY:
        codes.append("RECEIVABLE_INFLOW_ALIGNMENT")
        codes.append("COST_OPTIMAL_DEFERRAL")

    elif selected_action == ActionType.SUPPLIER_FINANCE:
        codes.append("LIQUIDITY_BUFFER_PRESERVATION")
        codes.append("SUPPLIER_SCF_PROGRAM_DRAW")

    elif selected_action == ActionType.PAY_NOW:
        codes.append("EARLY_PAYMENT_DISCOUNT_CAPTURE")

    elif selected_action == ActionType.PAY_MATURITY:
        codes.append("STANDARD_CONTRACTUAL_SETTLEMENT")
        codes.append("ZERO_FINANCING_FEE")

    return codes


def build_decisions(
    state: BusinessState,
    result: OptimizationResult,
    current_day: int = 0,
) -> StructuredDecisionPlan:
    """Transform an OptimizationResult and BusinessState into structured CapitalOps decision output."""
    invoices: Dict[str, InvoiceDecision] = {}
    payables_map = {p.id: p for p in state.payables}

    # Map cash positions from conservative trace
    cash_by_day: Dict[int, float] = {}
    if result.conservative_trace:
        for pt in result.conservative_trace.points:
            cash_by_day[pt.day] = pt.ending_cash

    for p in state.payables:
        selected_act = result.decisions.get(p.id, ActionType.PAY_MATURITY)
        res_selected = calculate_action(selected_act, p, current_day=current_day)

        # Build list of all alternatives
        alternatives: List[AlternativeAction] = []
        for act in ActionType:
            is_elig, reason = is_action_eligible(p, act, state=state, current_day=current_day)
            act_res = calculate_action(act, p, current_day=current_day)
            alternatives.append(
                AlternativeAction(
                    action=act,
                    is_eligible=is_elig,
                    ineligibility_reason=reason,
                    action_cost=act_res.total_cost,
                    net_savings=act_res.net_savings,
                    is_selected=(act == selected_act),
                )
            )

        # Find relevant cash before and after
        day_pay = res_selected.payment_day
        cash_after = cash_by_day.get(day_pay, state.cash)
        cash_before = cash_after + res_selected.immediate_cash_outflow

        # Invoice-specific binding constraints
        inv_binding: List[str] = []
        if selected_act == ActionType.BANK_FINANCE:
            bank_drawn = result.financing_usage.get("BANK", 0.0)
            bank_lim = result.financing_limits.get("BANK", 0.0)
            if bank_lim > 0 and abs(bank_drawn - bank_lim) < 1.0:
                inv_binding.append(f"BANK financing limit ({bank_drawn:,.2f}/{bank_lim:,.2f})")

        if result.conservative_trace and result.conservative_trace.min_solvency_margin < 100000.0:
            inv_binding.append(f"Conservative liquidity buffer (min margin: {result.conservative_trace.min_solvency_margin:,.2f})")

        reason_codes = _determine_reason_codes(p, selected_act, state, result)

        invoices[p.id] = InvoiceDecision(
            payable_id=p.id,
            nominal_amount=p.amount,
            due_day=p.due_day,
            selected_action=selected_act,
            feasibility=result.is_feasible,
            cost=res_selected.total_cost,
            net_savings=res_selected.net_savings,
            immediate_outflow=res_selected.immediate_cash_outflow,
            payment_day=res_selected.payment_day,
            repayment_amount=res_selected.repayment_amount,
            repayment_day=res_selected.repayment_day,
            cash_before=cash_before,
            cash_after=cash_after,
            required_buffer=state.buffer,
            alternatives=alternatives,
            binding_constraints=inv_binding,
            reason_codes=reason_codes,
        )

    # Global summary
    total_face = sum(p.amount for p in state.payables)
    total_opt_cost = result.total_cost
    bank_drawn_total = result.financing_usage.get("BANK", 0.0)
    supp_drawn_total = sum(v for k, v in result.financing_usage.items() if "SUPPLIER" in k.upper())
    min_cons_cash = result.conservative_trace.min_cash if result.conservative_trace else state.cash

    summary = DecisionSummary(
        total_invoices=len(state.payables),
        total_face_value=total_face,
        total_optimized_cost=total_opt_cost,
        net_portfolio_savings=total_face - total_opt_cost,
        total_bank_drawn=bank_drawn_total,
        total_supplier_drawn=supp_drawn_total,
        min_conservative_cash=min_cons_cash,
        buffer=state.buffer,
    )

    # Global reason codes
    global_codes = list({code for inv in invoices.values() for code in inv.reason_codes})

    return StructuredDecisionPlan(
        status=result.status,
        is_feasible=result.is_feasible,
        total_cost=result.total_cost,
        summary=summary,
        invoices=invoices,
        conservative_trace=result.conservative_trace,
        expected_trace=result.expected_trace,
        global_binding_constraints=result.binding_constraints,
        global_reason_codes=sorted(global_codes),
    )


def generate_decisions(
    state: BusinessState,
    current_day: int = 0,
    time_limit_seconds: float = 10.0,
) -> StructuredDecisionPlan:
    """Run CP-SAT optimization and return structured CapitalOps decision output."""
    result = optimize(state=state, current_day=current_day, time_limit_seconds=time_limit_seconds)
    return build_decisions(state=state, result=result, current_day=current_day)
