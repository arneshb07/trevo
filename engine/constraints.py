"""Constraint system and eligibility validation for CapitalOps Decision Engine."""

from typing import Dict, List, Optional, Set, Tuple, Union
from pydantic import BaseModel, Field

from engine.data_models import BusinessState, Payable, Financing
from engine.financing import ActionType, ActionResult, calculate_action
from engine.forecast import CashFlowTrace, generate_conservative_trace


class ConstraintViolation(BaseModel):
    """Details of a specific constraint violation."""

    category: str = Field(..., description="Constraint identifier (e.g. 'C1', 'C2', 'C3', 'C4', 'C5')")
    message: str = Field(..., description="Detailed description of the violation")
    entity_id: Optional[str] = Field(default=None, description="Associated payable, obligation, or financing source ID")


class ValidationResult(BaseModel):
    """Result of evaluating a complete action plan against all CapitalOps constraints."""

    is_valid: bool = Field(..., description="True if all constraints C1-C5 are strictly satisfied")
    violations: List[ConstraintViolation] = Field(default_factory=list, description="List of all detected violations")
    conservative_trace: Optional[CashFlowTrace] = Field(default=None, description="Resulting conservative cash flow trace")
    financing_usage: Dict[str, float] = Field(default_factory=dict, description="Total drawn capital per financing source")
    financing_limits: Dict[str, float] = Field(default_factory=dict, description="Maximum available limit per financing source")


# ---------------------------------------------------------------------------
# C2: Eligibility Rules
# ---------------------------------------------------------------------------

def is_action_eligible(
    payable: Payable,
    action: Union[ActionType, str],
    state: Optional[BusinessState] = None,
    current_day: int = 0,
) -> Tuple[bool, Optional[str]]:
    """Determine whether a specific financing action is eligible for a payable.

    Returns:
        (is_eligible: bool, reason: Optional[str])
    """
    action_enum = ActionType(action) if isinstance(action, str) else action

    if action_enum == ActionType.PAY_MATURITY:
        # C2: Standard contractual baseline payment is always eligible
        return True, None

    elif action_enum == ActionType.PAY_NOW:
        # C2: Requires positive discount rate and decision day on or before discount deadline
        if payable.discount_rate is None or payable.discount_rate <= 0:
            return False, f"Payable '{payable.id}' has no early payment discount (discount_rate <= 0)"
        if payable.discount_deadline_day is not None and current_day > payable.discount_deadline_day:
            return False, (
                f"Payable '{payable.id}' discount deadline expired (current_day {current_day} > "
                f"deadline {payable.discount_deadline_day})"
            )
        return True, None

    elif action_enum == ActionType.DELAY:
        # C2: Requires positive allowable delay days
        if payable.max_delay_days is None or payable.max_delay_days <= 0:
            return False, f"Payable '{payable.id}' does not allow payment delay (max_delay_days <= 0)"
        return True, None

    elif action_enum == ActionType.BANK_FINANCE:
        # C2: Requires valid bank rate and availability in state financing
        if payable.bank_rate is None or payable.bank_rate <= 0:
            return False, f"Payable '{payable.id}' has no bank financing rate (bank_rate <= 0)"
        if state is not None:
            bank_fac = next((f for f in state.financing if f.source.upper() == "BANK"), None)
            if not bank_fac or bank_fac.limit <= 0:
                return False, "No active BANK financing facility available in business state"
        return True, None

    elif action_enum == ActionType.SUPPLIER_FINANCE:
        # C2: Requires valid supplier financing rate and supplier facility
        if payable.supplier_rate is None or payable.supplier_rate <= 0:
            return False, f"Payable '{payable.id}' has no supplier financing rate (supplier_rate <= 0)"
        if state is not None:
            # Match supplier facility name (e.g. SUPPLIER_C or generic SUPPLIER)
            supp_fac = next(
                (f for f in state.financing if f.source.upper() in (f"SUPPLIER_{payable.id.split('-')[-1]}", f"SUPPLIER_{payable.id}", "SUPPLIER")),
                None,
            )
            # If explicit name check fails, check if any supplier facility exists
            if not supp_fac:
                supp_fac = next((f for f in state.financing if "SUPPLIER" in f.source.upper()), None)
            if not supp_fac or supp_fac.limit <= 0:
                return False, f"No active supplier financing facility found for payable '{payable.id}'"
        return True, None

    return False, f"Unknown action: {action}"


def get_eligible_actions(
    payable: Payable,
    state: Optional[BusinessState] = None,
    current_day: int = 0,
) -> List[ActionType]:
    """Return all valid, eligible actions for a given payable."""
    eligible = []
    for action in ActionType:
        is_ok, _ = is_action_eligible(payable, action, state=state, current_day=current_day)
        if is_ok:
            eligible.append(action)
    return eligible


# ---------------------------------------------------------------------------
# C3: Financing Limits Evaluation
# ---------------------------------------------------------------------------

def calculate_financing_draws(
    state: BusinessState,
    plan: Dict[str, Union[ActionType, str]],
) -> Dict[str, float]:
    """Calculate total drawn capital for each financing source under an action plan."""
    draws: Dict[str, float] = {f.source: 0.0 for f in state.financing}
    payables_map = {p.id: p for p in state.payables}

    for p_id, act in plan.items():
        if p_id not in payables_map:
            continue
        p = payables_map[p_id]
        act_enum = ActionType(act) if isinstance(act, str) else act

        if act_enum == ActionType.BANK_FINANCE:
            bank_key = next((f.source for f in state.financing if f.source.upper() == "BANK"), "BANK")
            draws[bank_key] = draws.get(bank_key, 0.0) + p.amount

        elif act_enum == ActionType.SUPPLIER_FINANCE:
            suffix = p.id.split("-")[-1]
            supp_key = next(
                (f.source for f in state.financing if f.source.upper() in (f"SUPPLIER_{suffix}", f"SUPPLIER_{p.id}", "SUPPLIER")),
                None,
            )
            if not supp_key:
                supp_key = next((f.source for f in state.financing if "SUPPLIER" in f.source.upper()), "SUPPLIER")
            draws[supp_key] = draws.get(supp_key, 0.0) + p.amount

    return draws


def validate_financing_limits(
    state: BusinessState,
    plan: Dict[str, Union[ActionType, str]],
) -> List[ConstraintViolation]:
    """C3: Verify that financing draws do not exceed facility limits."""
    violations: List[ConstraintViolation] = []
    draws = calculate_financing_draws(state, plan)
    limits = {f.source: f.limit for f in state.financing}

    for source, drawn_amount in draws.items():
        limit = limits.get(source, 0.0)
        if drawn_amount > limit:
            violations.append(
                ConstraintViolation(
                    category="C3",
                    message=(
                        f"Financing limit exceeded for '{source}': drawn {drawn_amount:,.2f} > limit {limit:,.2f}"
                    ),
                    entity_id=source,
                )
            )

    return violations


# ---------------------------------------------------------------------------
# C4: Liquidity Buffer Evaluation
# ---------------------------------------------------------------------------

def validate_liquidity_buffer(
    state: BusinessState,
    plan: Dict[str, Union[ActionType, str]],
    current_day: int = 0,
) -> Tuple[List[ConstraintViolation], CashFlowTrace]:
    """C4: Verify that conservative cash >= buffer at every checkpoint."""
    violations: List[ConstraintViolation] = []
    trace = generate_conservative_trace(state, payable_actions=plan, current_day=current_day)

    for pt in trace.points:
        if not pt.is_solvent:
            shortfall = pt.buffer - pt.ending_cash
            violations.append(
                ConstraintViolation(
                    category="C4",
                    message=(
                        f"Conservative liquidity buffer breached at Day {pt.day}: ending cash {pt.ending_cash:,.2f} "
                        f"< buffer {pt.buffer:,.2f} (shortfall: {shortfall:,.2f})"
                    ),
                    entity_id=f"Day_{pt.day}",
                )
            )

    return violations, trace


# ---------------------------------------------------------------------------
# Comprehensive Plan Validation (C1 - C5)
# ---------------------------------------------------------------------------

def validate_plan(
    state: BusinessState,
    plan: Dict[str, Union[ActionType, str]],
    current_day: int = 0,
) -> ValidationResult:
    """Validate a complete decision action plan against all CapitalOps constraints (C1-C5)."""
    violations: List[ConstraintViolation] = []
    payables_map = {p.id: p for p in state.payables}

    # -----------------------------------------------------------------------
    # C1 & C2: Exactly one eligible action per payable
    # -----------------------------------------------------------------------
    for p in state.payables:
        if p.id not in plan:
            violations.append(
                ConstraintViolation(
                    category="C1",
                    message=f"Missing decision action for payable '{p.id}'",
                    entity_id=p.id,
                )
            )
            continue

        selected_action = plan[p.id]
        try:
            act_enum = ActionType(selected_action) if isinstance(selected_action, str) else selected_action
        except ValueError:
            violations.append(
                ConstraintViolation(
                    category="C2",
                    message=f"Invalid action '{selected_action}' specified for payable '{p.id}'",
                    entity_id=p.id,
                )
            )
            continue

        # C2 Eligibility check
        is_eligible, reason = is_action_eligible(p, act_enum, state=state, current_day=current_day)
        if not is_eligible:
            violations.append(
                ConstraintViolation(
                    category="C2",
                    message=f"Ineligible action '{act_enum.value}' for payable '{p.id}': {reason}",
                    entity_id=p.id,
                )
            )

    # Check for unmapped extra entries in plan
    for p_id in plan:
        if p_id not in payables_map:
            violations.append(
                ConstraintViolation(
                    category="C1",
                    message=f"Plan contains unknown payable ID '{p_id}'",
                    entity_id=p_id,
                )
            )

    # -----------------------------------------------------------------------
    # C3: Financing Limits
    # -----------------------------------------------------------------------
    c3_violations = validate_financing_limits(state, plan)
    violations.extend(c3_violations)

    # -----------------------------------------------------------------------
    # C4 & C5: Conservative Liquidity Buffer & Fixed Obligations
    # (Obligations are strictly built into the cash trace model)
    # -----------------------------------------------------------------------
    c4_violations, conservative_trace = validate_liquidity_buffer(state, plan, current_day=current_day)
    violations.extend(c4_violations)

    financing_draws = calculate_financing_draws(state, plan)
    financing_limits = {f.source: f.limit for f in state.financing}

    return ValidationResult(
        is_valid=(len(violations) == 0),
        violations=violations,
        conservative_trace=conservative_trace,
        financing_usage=financing_draws,
        financing_limits=financing_limits,
    )
