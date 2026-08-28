"""Financing action calculations for CapitalOps Decision Engine."""

from enum import Enum
from typing import Optional, Union
from pydantic import BaseModel, Field
from engine.data_models import Payable


class ActionType(str, Enum):
    """Supported financing action types for accounts payable."""

    PAY_NOW = "PAY_NOW"
    PAY_MATURITY = "PAY_MATURITY"
    DELAY = "DELAY"
    BANK_FINANCE = "BANK_FINANCE"
    SUPPLIER_FINANCE = "SUPPLIER_FINANCE"


class ActionResult(BaseModel):
    """Represents the financial outcome of executing a financing action on a payable."""

    payable_id: str = Field(..., description="ID of the associated payable")
    action: ActionType = Field(..., description="Action performed")
    immediate_cash_outflow: float = Field(..., ge=0.0, description="Cash outflow at execution date")
    payment_day: int = Field(..., ge=0, description="Day index of immediate payment")
    repayment_amount: float = Field(default=0.0, ge=0.0, description="Future repayment obligation amount")
    repayment_day: Optional[int] = Field(default=None, description="Day index of future repayment")
    total_cost: float = Field(..., description="Total nominal cash outlay across the action lifecycle")
    net_savings: float = Field(default=0.0, description="Savings relative to base amount (positive = savings, negative = cost/fee)")


def calculate_pay_now(payable: Payable, current_day: int = 0) -> ActionResult:
    """Calculate financial outcome for PAY_NOW.

    Formula:
      cash outflow = amount * (1 - discount_rate)
      payment date = current_day
    """
    discount = payable.discount_rate if payable.discount_rate is not None else 0.0
    outflow = payable.amount * (1.0 - discount)
    return ActionResult(
        payable_id=payable.id,
        action=ActionType.PAY_NOW,
        immediate_cash_outflow=outflow,
        payment_day=current_day,
        repayment_amount=0.0,
        repayment_day=None,
        total_cost=outflow,
        net_savings=payable.amount - outflow,
    )


def calculate_pay_maturity(payable: Payable) -> ActionResult:
    """Calculate financial outcome for PAY_MATURITY.

    Formula:
      cash outflow = amount
      payment date = due_day
    """
    return ActionResult(
        payable_id=payable.id,
        action=ActionType.PAY_MATURITY,
        immediate_cash_outflow=payable.amount,
        payment_day=payable.due_day,
        repayment_amount=0.0,
        repayment_day=None,
        total_cost=payable.amount,
        net_savings=0.0,
    )


def calculate_delay(payable: Payable, delay_days: Optional[int] = None) -> ActionResult:
    """Calculate financial outcome for DELAY.

    Formula:
      cash outflow = amount * (1 + penalty_rate)
      payment date = due_day + delay_days
    """
    days = delay_days if delay_days is not None else (payable.max_delay_days or 0)
    penalty = payable.penalty_rate if payable.penalty_rate is not None else 0.0
    outflow = payable.amount * (1.0 + penalty)
    return ActionResult(
        payable_id=payable.id,
        action=ActionType.DELAY,
        immediate_cash_outflow=outflow,
        payment_day=payable.due_day + days,
        repayment_amount=0.0,
        repayment_day=None,
        total_cost=outflow,
        net_savings=payable.amount - outflow,
    )


def calculate_bank_finance(payable: Payable, fin_term_days: Optional[int] = None) -> ActionResult:
    """Calculate financial outcome for BANK_FINANCE.

    Formula:
      immediate cash outflow = 0
      repayment = amount * (1 + bank_rate * fin_term_days / 365)
    """
    term_days = fin_term_days if fin_term_days is not None else (payable.fin_term_days or 30)
    bank_rate = payable.bank_rate if payable.bank_rate is not None else 0.0
    repayment = payable.amount * (1.0 + bank_rate * (term_days / 365.0))
    return ActionResult(
        payable_id=payable.id,
        action=ActionType.BANK_FINANCE,
        immediate_cash_outflow=0.0,
        payment_day=payable.due_day,
        repayment_amount=repayment,
        repayment_day=payable.due_day + term_days,
        total_cost=repayment,
        net_savings=payable.amount - repayment,
    )


def calculate_supplier_finance(payable: Payable, fin_term_days: Optional[int] = None) -> ActionResult:
    """Calculate financial outcome for SUPPLIER_FINANCE.

    Formula:
      immediate cash outflow = 0
      repayment = amount * (1 + supplier_rate * fin_term_days / 365)
    """
    term_days = fin_term_days if fin_term_days is not None else (payable.fin_term_days or 30)
    supplier_rate = payable.supplier_rate if payable.supplier_rate is not None else 0.0
    repayment = payable.amount * (1.0 + supplier_rate * (term_days / 365.0))
    return ActionResult(
        payable_id=payable.id,
        action=ActionType.SUPPLIER_FINANCE,
        immediate_cash_outflow=0.0,
        payment_day=payable.due_day,
        repayment_amount=repayment,
        repayment_day=payable.due_day + term_days,
        total_cost=repayment,
        net_savings=payable.amount - repayment,
    )


def calculate_action(
    action: Union[ActionType, str],
    payable: Payable,
    current_day: int = 0,
    delay_days: Optional[int] = None,
    fin_term_days: Optional[int] = None,
) -> ActionResult:
    """Evaluate and return the financial outcome for a given action on a payable."""
    action_enum = ActionType(action) if isinstance(action, str) else action

    if action_enum == ActionType.PAY_NOW:
        return calculate_pay_now(payable, current_day=current_day)
    elif action_enum == ActionType.PAY_MATURITY:
        return calculate_pay_maturity(payable)
    elif action_enum == ActionType.DELAY:
        return calculate_delay(payable, delay_days=delay_days)
    elif action_enum == ActionType.BANK_FINANCE:
        return calculate_bank_finance(payable, fin_term_days=fin_term_days)
    elif action_enum == ActionType.SUPPLIER_FINANCE:
        return calculate_supplier_finance(payable, fin_term_days=fin_term_days)
    else:
        raise ValueError(f"Unsupported action type: {action}")
