"""Scenario and event simulation engine for CapitalOps Decision Engine."""

from copy import deepcopy
from enum import Enum
from typing import Dict, List, Optional, Union
from pydantic import BaseModel, Field

from engine.data_models import BusinessState, Receivable
from engine.financing import ActionType
from engine.decisions import (
    InvoiceDecision,
    StructuredDecisionPlan,
    build_decisions,
    generate_decisions,
)
from engine.optimizer import optimize


class EventType(str, Enum):
    """Supported scenario shock event types."""

    RECEIVABLE_DELAY = "RECEIVABLE_DELAY"


class ScenarioEvent(BaseModel):
    """Definition of a scenario shock event."""

    type: EventType = Field(..., description="Type of event")
    receivable_id: str = Field(..., description="Target receivable identifier")
    new_expected_day: int = Field(..., ge=0, description="New expected arrival day index")


class DecisionChange(BaseModel):
    """Details of an invoice decision change between baseline and shock scenario."""

    payable_id: str = Field(..., description="Payable ID")
    before_action: ActionType = Field(..., description="Baseline selected action")
    after_action: ActionType = Field(..., description="Shocked selected action")
    cost_before: float = Field(..., description="Baseline action cost")
    cost_after: float = Field(..., description="Shocked action cost")
    cost_diff: float = Field(..., description="Cost change (cost_after - cost_before)")
    reason_codes_before: List[str] = Field(default_factory=list, description="Baseline decision reason codes")
    reason_codes_after: List[str] = Field(default_factory=list, description="Shocked decision reason codes")


class UnchangedDecision(BaseModel):
    """Details of an invoice decision that remained identical across scenarios."""

    payable_id: str = Field(..., description="Payable ID")
    action: ActionType = Field(..., description="Selected action across both scenarios")
    cost: float = Field(..., description="Action cost")


class ScenarioComparison(BaseModel):
    """Comprehensive comparison report between baseline and shocked scenario outcomes."""

    event: ScenarioEvent = Field(..., description="Applied shock event")
    baseline_plan: StructuredDecisionPlan = Field(..., description="Baseline structured decision plan")
    shocked_plan: StructuredDecisionPlan = Field(..., description="Shocked structured decision plan")
    changed_decisions: List[DecisionChange] = Field(default_factory=list, description="Invoices whose decision changed")
    unchanged_decisions: List[UnchangedDecision] = Field(default_factory=list, description="Invoices whose decision remained unchanged")
    baseline_feasibility: bool = Field(..., description="Whether baseline plan was feasible")
    shocked_feasibility: bool = Field(..., description="Whether shocked plan was feasible")
    baseline_cost: float = Field(..., description="Total baseline portfolio cost")
    shocked_cost: float = Field(..., description="Total shocked portfolio cost")
    cost_difference: float = Field(..., description="Portfolio cost difference (shocked - baseline)")
    summary_text: str = Field(..., description="Human-readable executive summary of changes")


def apply_event(
    state: BusinessState,
    event: Union[ScenarioEvent, Dict],
) -> BusinessState:
    """Apply a scenario event to a business state, returning a new modified copy.

    The original business state is strictly preserved without mutation.
    """
    event_obj = ScenarioEvent(**event) if isinstance(event, dict) else event

    if event_obj.type != EventType.RECEIVABLE_DELAY:
        raise ValueError(f"Unsupported event type: {event_obj.type}")

    # Validate receivable exists
    existing_rec = next((r for r in state.receivables if r.id == event_obj.receivable_id), None)
    if not existing_rec:
        raise ValueError(
            f"Receivable '{event_obj.receivable_id}' not found in business state. "
            f"Available receivables: {[r.id for r in state.receivables]}"
        )

    if event_obj.new_expected_day < 0:
        raise ValueError(f"new_expected_day must be non-negative, got {event_obj.new_expected_day}")

    # Deep copy state to ensure immutability of the baseline
    shocked_state = deepcopy(state)

    for r in shocked_state.receivables:
        if r.id == event_obj.receivable_id:
            r.expected_day = event_obj.new_expected_day
            break

    return shocked_state


def run_scenario(
    baseline_state: BusinessState,
    event: Union[ScenarioEvent, Dict],
    current_day: int = 0,
    time_limit_seconds: float = 10.0,
) -> ScenarioComparison:
    """Execute complete scenario workflow:

    1. Generate baseline decision plan via optimizer.py & decisions.py
    2. Apply shock event to create shocked BusinessState copy
    3. Re-run CP-SAT optimization on shocked state
    4. Generate structured comparison of decision diffs and costs
    """
    event_obj = ScenarioEvent(**event) if isinstance(event, dict) else event

    # 1. Run baseline decision plan
    baseline_plan = generate_decisions(
        state=baseline_state,
        current_day=current_day,
        time_limit_seconds=time_limit_seconds,
    )

    # 2. Apply event to copy
    shocked_state = apply_event(baseline_state, event_obj)

    # 3. Run shocked decision plan
    shocked_plan = generate_decisions(
        state=shocked_state,
        current_day=current_day,
        time_limit_seconds=time_limit_seconds,
    )

    # 4. Compare decisions before vs after
    changed: List[DecisionChange] = []
    unchanged: List[UnchangedDecision] = []

    for p_id, base_inv in baseline_plan.invoices.items():
        shock_inv = shocked_plan.invoices.get(p_id)
        if not shock_inv:
            continue

        if base_inv.selected_action != shock_inv.selected_action:
            changed.append(
                DecisionChange(
                    payable_id=p_id,
                    before_action=base_inv.selected_action,
                    after_action=shock_inv.selected_action,
                    cost_before=base_inv.cost,
                    cost_after=shock_inv.cost,
                    cost_diff=shock_inv.cost - base_inv.cost,
                    reason_codes_before=base_inv.reason_codes,
                    reason_codes_after=shock_inv.reason_codes,
                )
            )
        else:
            unchanged.append(
                UnchangedDecision(
                    payable_id=p_id,
                    action=base_inv.selected_action,
                    cost=base_inv.cost,
                )
            )

    cost_diff = shocked_plan.total_cost - baseline_plan.total_cost

    # Build executive summary
    if changed:
        changes_desc = ", ".join(f"{c.payable_id}: {c.before_action.value} -> {c.after_action.value}" for c in changed)
        summary_text = (
            f"Shock event '{event_obj.type.value}' on '{event_obj.receivable_id}' (delayed to Day {event_obj.new_expected_day}) "
            f"caused {len(changed)} decision change(s): [{changes_desc}]. "
            f"Total portfolio cost changed by ${cost_diff:+,.2f}."
        )
    else:
        summary_text = (
            f"Shock event '{event_obj.type.value}' on '{event_obj.receivable_id}' resulted in 0 decision changes. "
            f"Baseline action plan remains optimal and feasible."
        )

    return ScenarioComparison(
        event=event_obj,
        baseline_plan=baseline_plan,
        shocked_plan=shocked_plan,
        changed_decisions=changed,
        unchanged_decisions=unchanged,
        baseline_feasibility=baseline_plan.is_feasible,
        shocked_feasibility=shocked_plan.is_feasible,
        baseline_cost=baseline_plan.total_cost,
        shocked_cost=shocked_plan.total_cost,
        cost_difference=cost_diff,
        summary_text=summary_text,
    )
