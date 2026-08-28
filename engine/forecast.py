"""Deterministic cash-flow trace and checkpoint generation for CapitalOps Decision Engine."""

from typing import Dict, List, Optional, Set, Union
from pydantic import BaseModel, Field
from engine.data_models import BusinessState, Payable
from engine.financing import ActionResult, ActionType, calculate_action
from engine.uncertainty import get_conservative_arrival_day, get_expected_arrival_day


class CashFlowPoint(BaseModel):
    """Snapshot of cumulative cash position and day cash flows at a specific day."""

    day: int = Field(..., ge=0, description="Timeline day index")
    starting_cash: float = Field(..., description="Cash balance before day's cash movements")
    inflow: float = Field(default=0.0, ge=0.0, description="Total cash inflows on this day")
    outflow: float = Field(default=0.0, ge=0.0, description="Total cash outflows on this day")
    net_flow: float = Field(..., description="Inflow minus Outflow on this day")
    ending_cash: float = Field(..., description="Cash balance after day's movements")
    buffer: float = Field(default=0.0, ge=0.0, description="Safety liquidity buffer requirement")
    is_solvent: bool = Field(..., description="True if ending_cash >= buffer")


class CashFlowTrace(BaseModel):
    """Full cash flow trajectory across decision horizon checkpoints."""

    scenario: str = Field(..., description="Scenario type ('EXPECTED' or 'CONSERVATIVE')")
    checkpoints: List[int] = Field(default_factory=list, description="Sorted unique timeline days evaluated")
    points: List[CashFlowPoint] = Field(default_factory=list, description="Cash position at each checkpoint")
    min_cash: float = Field(..., description="Lowest cash balance reached during the horizon")
    min_solvency_margin: float = Field(..., description="Lowest margin above buffer (min_cash - buffer)")
    has_shortfall: bool = Field(..., description="True if ending_cash falls below buffer at any checkpoint")


def generate_checkpoints(
    state: BusinessState,
    current_day: int = 0,
    include_all_possibilities: bool = True,
) -> List[int]:
    """Generate a sorted, deduplicated list of critical decision days (checkpoints).

    Includes:
      - today / current_day
      - payable discount deadlines (payable.discount_deadline_day)
      - payable due dates (payable.due_day)
      - payable max delay dates (payable.due_day + payable.max_delay_days)
      - payable financing repayment dates (payable.due_day + payable.fin_term_days)
      - receivable expected arrival dates (receivable.expected_day)
      - receivable conservative / late arrival dates (receivable.late_day)
      - fixed obligation settlement dates (obligation.day)
    """
    days: Set[int] = {current_day}

    for p in state.payables:
        days.add(p.due_day)
        if p.discount_deadline_day is not None and p.discount_deadline_day >= 0:
            days.add(p.discount_deadline_day)
        if p.max_delay_days is not None and p.max_delay_days > 0:
            days.add(p.due_day + p.max_delay_days)
        if p.fin_term_days is not None and p.fin_term_days > 0:
            days.add(p.due_day + p.fin_term_days)

    for r in state.receivables:
        days.add(r.expected_day)
        if include_all_possibilities and r.late_day is not None and r.late_day >= 0:
            days.add(r.late_day)

    for o in state.obligations:
        days.add(o.day)

    return sorted(d for d in days if d >= 0)


def generate_cash_flow_trace(
    state: BusinessState,
    use_conservative: bool = False,
    payable_actions: Optional[Dict[str, Union[ActionResult, ActionType, str]]] = None,
    current_day: int = 0,
) -> CashFlowTrace:
    """Generate deterministic cash flow trace for expected or conservative scenario."""
    scenario_name = "CONSERVATIVE" if use_conservative else "EXPECTED"
    payable_actions = payable_actions or {}

    # 1. Resolve receivable arrival dates and amounts
    daily_inflows: Dict[int, float] = {}
    for r in state.receivables:
        arrival_day = get_conservative_arrival_day(r) if use_conservative else get_expected_arrival_day(r)
        daily_inflows[arrival_day] = daily_inflows.get(arrival_day, 0.0) + r.amount

    # 2. Resolve obligation outflows
    daily_outflows: Dict[int, float] = {}
    for o in state.obligations:
        daily_outflows[o.day] = daily_outflows.get(o.day, 0.0) + o.amount

    # 3. Resolve payable outflows based on chosen or default actions (PAY_MATURITY default)
    for p in state.payables:
        action_spec = payable_actions.get(p.id, ActionType.PAY_MATURITY)
        if isinstance(action_spec, ActionResult):
            act_res = action_spec
        else:
            act_res = calculate_action(action_spec, p, current_day=current_day)

        # Immediate outflow
        if act_res.immediate_cash_outflow > 0:
            p_day = act_res.payment_day
            daily_outflows[p_day] = daily_outflows.get(p_day, 0.0) + act_res.immediate_cash_outflow

        # Financing repayment outflow
        if act_res.repayment_amount > 0 and act_res.repayment_day is not None:
            r_day = act_res.repayment_day
            daily_outflows[r_day] = daily_outflows.get(r_day, 0.0) + act_res.repayment_amount

    # 4. Determine evaluation checkpoints
    active_days = set(daily_inflows.keys()).union(daily_outflows.keys()).union({current_day})
    checkpoints = sorted(d for d in active_days if d >= current_day)

    # 5. Simulate cash progression across checkpoints
    points: List[CashFlowPoint] = []
    current_cash = state.cash
    min_cash = current_cash
    buffer = state.buffer
    has_shortfall = False

    for day in checkpoints:
        inflow = daily_inflows.get(day, 0.0)
        outflow = daily_outflows.get(day, 0.0)
        net_flow = inflow - outflow
        start_cash = current_cash
        end_cash = start_cash + net_flow

        is_solvent = end_cash >= buffer
        if not is_solvent:
            has_shortfall = True

        if end_cash < min_cash:
            min_cash = end_cash

        points.append(
            CashFlowPoint(
                day=day,
                starting_cash=start_cash,
                inflow=inflow,
                outflow=outflow,
                net_flow=net_flow,
                ending_cash=end_cash,
                buffer=buffer,
                is_solvent=is_solvent,
            )
        )

        current_cash = end_cash

    return CashFlowTrace(
        scenario=scenario_name,
        checkpoints=checkpoints,
        points=points,
        min_cash=min_cash,
        min_solvency_margin=min_cash - buffer,
        has_shortfall=has_shortfall,
    )


def generate_expected_trace(
    state: BusinessState,
    payable_actions: Optional[Dict[str, Union[ActionResult, ActionType, str]]] = None,
    current_day: int = 0,
) -> CashFlowTrace:
    """Convenience helper to generate expected cash flow trace."""
    return generate_cash_flow_trace(
        state=state,
        use_conservative=False,
        payable_actions=payable_actions,
        current_day=current_day,
    )


def generate_conservative_trace(
    state: BusinessState,
    payable_actions: Optional[Dict[str, Union[ActionResult, ActionType, str]]] = None,
    current_day: int = 0,
) -> CashFlowTrace:
    """Convenience helper to generate conservative cash flow trace."""
    return generate_cash_flow_trace(
        state=state,
        use_conservative=True,
        payable_actions=payable_actions,
        current_day=current_day,
    )
