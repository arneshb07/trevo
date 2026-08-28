"""CapitalOps CP-SAT Portfolio Optimizer for Accounts Payable and Financing Actions."""

from enum import Enum
from typing import Dict, List, Optional, Set, Tuple, Union
from pydantic import BaseModel, Field
from ortools.sat.python import cp_model

from engine.data_models import BusinessState, Payable, Financing
from engine.financing import ActionType, ActionResult, calculate_action
from engine.uncertainty import get_conservative_arrival_day, get_expected_arrival_day
from engine.forecast import (
    CashFlowTrace,
    generate_checkpoints,
    generate_conservative_trace,
    generate_expected_trace,
)
from engine.constraints import (
    get_eligible_actions,
    is_action_eligible,
    validate_plan,
    calculate_financing_draws,
)


class OptimizationStatus(str, Enum):
    """Status returned by the CP-SAT optimization engine."""

    OPTIMAL = "OPTIMAL"
    FEASIBLE = "FEASIBLE"
    INFEASIBLE = "INFEASIBLE"
    MODEL_INVALID = "MODEL_INVALID"
    UNKNOWN = "UNKNOWN"


class PayableDecision(BaseModel):
    """Detailed decision outcome for an individual payable."""

    payable_id: str = Field(..., description="Payable ID")
    selected_action: ActionType = Field(..., description="Optimally selected financing/payment action")
    nominal_amount: float = Field(..., description="Original invoice face amount")
    action_cost: float = Field(..., description="Total nominal cash outlay across the action lifecycle")
    immediate_cash_outflow: float = Field(..., description="Cash outflow at execution date")
    payment_day: int = Field(..., description="Day index of immediate payment")
    repayment_amount: float = Field(default=0.0, description="Repayment obligation for financed payable")
    repayment_day: Optional[int] = Field(default=None, description="Repayment day index for financed payable")
    net_savings: float = Field(default=0.0, description="Savings relative to base amount")


class OptimizationResult(BaseModel):
    """Structured response from the CapitalOps Decision Engine optimizer."""

    status: OptimizationStatus = Field(..., description="Solver convergence status")
    is_feasible: bool = Field(..., description="True if a valid feasible action plan was found")
    total_cost: float = Field(..., description="Minimized total relevant cost across all payables")
    decisions: Dict[str, ActionType] = Field(default_factory=dict, description="Action mapping (payable_id -> ActionType)")
    payable_decisions: List[PayableDecision] = Field(default_factory=list, description="List of individual payable decision breakdowns")
    conservative_trace: Optional[CashFlowTrace] = Field(default=None, description="Deterministic conservative cash trace")
    expected_trace: Optional[CashFlowTrace] = Field(default=None, description="Deterministic expected cash trace")
    financing_usage: Dict[str, float] = Field(default_factory=dict, description="Total drawn capital per financing source")
    financing_limits: Dict[str, float] = Field(default_factory=dict, description="Credit limits per financing source")
    binding_constraints: List[str] = Field(default_factory=list, description="Identified binding capacity or liquidity constraints")
    solver_wall_time: float = Field(default=0.0, description="Solver execution time in seconds")


def _scale(value: float, scale_factor: int = 1000) -> int:
    """Scale float monetary amount to integer units for CP-SAT solver."""
    return int(round(value * scale_factor))


def _unscale(value: int, scale_factor: int = 1000) -> float:
    """Unscale integer solver value back to float currency."""
    return float(value) / scale_factor


def optimize(
    state: BusinessState,
    current_day: int = 0,
    time_limit_seconds: float = 10.0,
    random_seed: int = 42,
    bank_utilization_charge: float = 0.002,
) -> OptimizationResult:
    """Optimize working capital financing actions across all payables using OR-Tools CP-SAT.

    Minimizes total payment & financing cost subject to:
      - C1: Exactly one action per payable
      - C2: Action eligibility requirements
      - C3: Financing source limits
      - C4: Hard liquidity buffer constraint on conservative cash-flow trace
      - C5: Non-negotiable fixed obligations
    """
    scale_factor = 1000  # Millicents precision
    model = cp_model.CpModel()

    # 1. Map payables and precalculate eligible action outcomes
    payables_map = {p.id: p for p in state.payables}
    action_vars: Dict[Tuple[str, ActionType], cp_model.IntVar] = {}
    action_results: Dict[Tuple[str, ActionType], ActionResult] = {}

    for p in state.payables:
        eligible_actions = get_eligible_actions(p, state=state, current_day=current_day)
        if not eligible_actions:
            return OptimizationResult(
                status=OptimizationStatus.INFEASIBLE,
                is_feasible=False,
                total_cost=0.0,
                binding_constraints=[f"No eligible actions available for payable '{p.id}'"],
            )

        for act in eligible_actions:
            var_name = f"x_{p.id}_{act.value}"
            var = model.NewBoolVar(var_name)
            action_vars[(p.id, act)] = var
            action_results[(p.id, act)] = calculate_action(act, p, current_day=current_day)

    # -----------------------------------------------------------------------
    # C1: Exactly one action per payable
    # -----------------------------------------------------------------------
    for p in state.payables:
        p_vars = [action_vars[(p.id, act)] for act in get_eligible_actions(p, state=state, current_day=current_day)]
        model.Add(sum(p_vars) == 1)

    # -----------------------------------------------------------------------
    # C3: Financing Limits
    # -----------------------------------------------------------------------
    # Bank facility limit
    bank_fac = next((f for f in state.financing if f.source.upper() == "BANK"), None)
    if bank_fac:
        bank_terms = []
        for p in state.payables:
            if (p.id, ActionType.BANK_FINANCE) in action_vars:
                bank_terms.append(_scale(p.amount, scale_factor) * action_vars[(p.id, ActionType.BANK_FINANCE)])
        if bank_terms:
            model.Add(sum(bank_terms) <= _scale(bank_fac.limit, scale_factor))

    # Supplier facility limits
    for f in state.financing:
        if "SUPPLIER" in f.source.upper():
            supp_terms = []
            for p in state.payables:
                # Match facility name for payable
                suffix = p.id.split("-")[-1]
                matches_facility = f.source.upper() in (f"SUPPLIER_{suffix}", f"SUPPLIER_{p.id}", "SUPPLIER")
                if matches_facility and (p.id, ActionType.SUPPLIER_FINANCE) in action_vars:
                    supp_terms.append(_scale(p.amount, scale_factor) * action_vars[(p.id, ActionType.SUPPLIER_FINANCE)])
            if supp_terms:
                model.Add(sum(supp_terms) <= _scale(f.limit, scale_factor))

    # -----------------------------------------------------------------------
    # C4 & C5: Conservative Liquidity Buffer & Fixed Obligations
    # Evaluated at all relevant decision horizon checkpoints
    # -----------------------------------------------------------------------
    checkpoints = generate_checkpoints(state, current_day=current_day, include_all_possibilities=True)

    # Precalculate deterministic conservative inflows and fixed outflows up to each checkpoint t
    for t in checkpoints:
        # 1. Conservative Inflows up to day t
        cum_inflow = 0.0
        for r in state.receivables:
            arrival = get_conservative_arrival_day(r)
            if arrival <= t:
                cum_inflow += r.amount

        # 2. Fixed Obligations up to day t
        cum_obligation = 0.0
        for o in state.obligations:
            if o.day <= t:
                cum_obligation += o.amount

        # 3. Maximum permissible payable outflow at day t to maintain buffer:
        # Initial cash + Inflow(t) - Obligation(t) - PayableOutflow(t) >= Buffer
        # => PayableOutflow(t) <= Initial cash + Inflow(t) - Obligation(t) - Buffer
        max_payable_outflow = state.cash + cum_inflow - cum_obligation - state.buffer
        max_outflow_scaled = _scale(max_payable_outflow, scale_factor)

        # 4. Sum up cumulative outflows from decision actions on or before day t
        payable_outflow_terms = []
        for (p_id, act), var in action_vars.items():
            res = action_results[(p_id, act)]
            outflow_at_t = 0.0
            # Immediate payment outflow
            if res.immediate_cash_outflow > 0 and res.payment_day <= t:
                outflow_at_t += res.immediate_cash_outflow
            # Repayment outflow
            if res.repayment_amount > 0 and res.repayment_day is not None and res.repayment_day <= t:
                outflow_at_t += res.repayment_amount

            if outflow_at_t > 0:
                payable_outflow_terms.append(_scale(outflow_at_t, scale_factor) * var)

        if payable_outflow_terms:
            model.Add(sum(payable_outflow_terms) <= max_outflow_scaled)
        else:
            if max_outflow_scaled < 0:
                model.Add(0 <= max_outflow_scaled)  # Infeasible checkpoint

    # -----------------------------------------------------------------------
    # Objective: Minimize total cost of actions (with treasury bank line charge)
    # -----------------------------------------------------------------------
    objective_terms = []
    for (p_id, act), var in action_vars.items():
        base_cost = action_results[(p_id, act)].total_cost
        if act == ActionType.BANK_FINANCE and bank_utilization_charge > 0:
            base_cost += payables_map[p_id].amount * bank_utilization_charge
        objective_terms.append(_scale(base_cost, scale_factor) * var)

    model.Minimize(sum(objective_terms))

    # -----------------------------------------------------------------------
    # Solve Model
    # -----------------------------------------------------------------------
    solver = cp_model.CpSolver()
    solver.parameters.max_time_in_seconds = time_limit_seconds
    solver.parameters.random_seed = random_seed
    solver.parameters.num_workers = 1  # Deterministic execution

    solver_status = solver.Solve(model)

    if solver_status not in (cp_model.OPTIMAL, cp_model.FEASIBLE):
        status_enum = (
            OptimizationStatus.INFEASIBLE
            if solver_status == cp_model.INFEASIBLE
            else OptimizationStatus.MODEL_INVALID
        )
        return OptimizationResult(
            status=status_enum,
            is_feasible=False,
            total_cost=0.0,
            solver_wall_time=solver.WallTime(),
            binding_constraints=["Solver proved infeasibility under liquidity buffer or capacity constraints"],
        )

    # -----------------------------------------------------------------------
    # Extract Solution
    # -----------------------------------------------------------------------
    decisions: Dict[str, ActionType] = {}
    payable_decisions: List[PayableDecision] = []
    total_cost_val = 0.0

    for p in state.payables:
        for act in get_eligible_actions(p, state=state, current_day=current_day):
            if solver.Value(action_vars[(p.id, act)]) == 1:
                decisions[p.id] = act
                res = action_results[(p.id, act)]
                total_cost_val += res.total_cost
                payable_decisions.append(
                    PayableDecision(
                        payable_id=p.id,
                        selected_action=act,
                        nominal_amount=p.amount,
                        action_cost=res.total_cost,
                        immediate_cash_outflow=res.immediate_cash_outflow,
                        payment_day=res.payment_day,
                        repayment_amount=res.repayment_amount,
                        repayment_day=res.repayment_day,
                        net_savings=res.net_savings,
                    )
                )
                break

    # Generate traces
    cons_trace = generate_conservative_trace(state, payable_actions=decisions, current_day=current_day)
    exp_trace = generate_expected_trace(state, payable_actions=decisions, current_day=current_day)

    # Financing utilization
    financing_draws = calculate_financing_draws(state, decisions)
    financing_limits = {f.source: f.limit for f in state.financing}

    # Detect binding constraints (facilities at 100% capacity, min solvency margin near zero)
    binding: List[str] = []
    for source, drawn in financing_draws.items():
        lim = financing_limits.get(source, 0.0)
        if lim > 0 and abs(drawn - lim) < 1.0:
            binding.append(f"Financing capacity for '{source}' is 100% utilized ({drawn:,.2f}/{lim:,.2f})")

    if cons_trace.min_solvency_margin < 100000.0:
        binding.append(f"Conservative liquidity buffer tight (min solvency margin: {cons_trace.min_solvency_margin:,.2f})")

    return OptimizationResult(
        status=OptimizationStatus.OPTIMAL if solver_status == cp_model.OPTIMAL else OptimizationStatus.FEASIBLE,
        is_feasible=True,
        total_cost=total_cost_val,
        decisions=decisions,
        payable_decisions=payable_decisions,
        conservative_trace=cons_trace,
        expected_trace=exp_trace,
        financing_usage=financing_draws,
        financing_limits=financing_limits,
        binding_constraints=binding,
        solver_wall_time=solver.WallTime(),
    )


def run_optimizer(
    state: BusinessState,
    current_day: int = 0,
    time_limit_seconds: float = 10.0,
) -> OptimizationResult:
    """Convenience alias for optimize()."""
    return optimize(state=state, current_day=current_day, time_limit_seconds=time_limit_seconds)
