"""Deterministic Explanation and Counterfactual Layer for CapitalOps Decision Engine."""

from typing import Dict, List, Optional, Union
from pydantic import BaseModel, Field

from engine.data_models import BusinessState
from engine.financing import ActionType
from engine.decisions import AlternativeAction, InvoiceDecision, StructuredDecisionPlan
from engine.scenarios import DecisionChange, ScenarioComparison


class CounterfactualExplanation(BaseModel):
    """Deterministic explanation of why an alternative action was rejected."""

    alternative_action: ActionType = Field(..., description="The non-selected alternative action")
    is_eligible: bool = Field(..., description="Whether the alternative was legally/contractually eligible")
    status: str = Field(..., description="Status classification (e.g. 'INELIGIBLE', 'BUFFER_VIOLATION', 'HIGHER_COST')")
    explanation: str = Field(..., description="Deterministic explanation for rejection")


class InvoiceExplanation(BaseModel):
    """Human-readable and structured explanation for an individual invoice decision."""

    payable_id: str = Field(..., description="Unique invoice ID")
    selected_action: ActionType = Field(..., description="Optimally selected action")
    cost: float = Field(..., description="Total nominal action cost")
    reason_codes: List[str] = Field(default_factory=list, description="Associated deterministic reason codes")
    summary: str = Field(..., description="Concise deterministic summary of why this action was chosen")
    detailed_explanation: str = Field(..., description="Comprehensive explanation of liquidity and cost factors")
    counterfactuals: List[CounterfactualExplanation] = Field(default_factory=list, description="Analysis of unselected alternatives")


class PortfolioExplanation(BaseModel):
    """Portfolio-wide deterministic decision explanation report."""

    is_feasible: bool = Field(..., description="Whether the entire portfolio plan is feasible")
    total_cost: float = Field(..., description="Total optimized portfolio cost")
    executive_summary: str = Field(..., description="Portfolio-level executive explanation")
    invoices: Dict[str, InvoiceExplanation] = Field(default_factory=dict, description="Explanations per invoice")
    portfolio_reason_codes: List[str] = Field(default_factory=list, description="All active portfolio reason codes")


class ScenarioDeltaExplanation(BaseModel):
    """Deterministic explanation of decision changes caused by a scenario shock event."""

    event_description: str = Field(..., description="Description of the trigger event")
    cost_delta: float = Field(..., description="Cost change resulting from the shock")
    summary: str = Field(..., description="High-level narrative of portfolio decision adjustments")
    decision_shift_reasons: Dict[str, str] = Field(default_factory=dict, description="Detailed explanation per changed invoice")
    unchanged_reasons: Dict[str, str] = Field(default_factory=dict, description="Reasons why other decisions remained steady")


def _generate_counterfactual(
    invoice: InvoiceDecision,
    alt: AlternativeAction,
) -> CounterfactualExplanation:
    """Generate deterministic counterfactual reasoning for a rejected alternative."""
    if not alt.is_eligible:
        return CounterfactualExplanation(
            alternative_action=alt.action,
            is_eligible=False,
            status="INELIGIBLE",
            explanation=f"{alt.action.value} is not eligible: {alt.ineligibility_reason or 'Eligibility requirements not satisfied'}.",
        )

    # If eligible but not selected
    if alt.action == ActionType.PAY_NOW or alt.action == ActionType.PAY_MATURITY:
        return CounterfactualExplanation(
            alternative_action=alt.action,
            is_eligible=True,
            status="BUFFER_VIOLATION",
            explanation=(
                f"{alt.action.value} would immediately drain cash prior to upcoming fixed obligations/receivables, "
                f"causing a conservative liquidity buffer violation."
            ),
        )

    elif alt.action == ActionType.DELAY:
        if invoice.selected_action == ActionType.BANK_FINANCE:
            return CounterfactualExplanation(
                alternative_action=alt.action,
                is_eligible=True,
                status="BUFFER_VIOLATION",
                explanation=(
                    "DELAY is not viable because delayed payment outflow would occur before sufficient customer receivables "
                    "arrive, violating the conservative liquidity buffer."
                ),
            )
        else:
            return CounterfactualExplanation(
                alternative_action=alt.action,
                is_eligible=True,
                status="HIGHER_COST",
                explanation=f"DELAY has higher total cost (${alt.action_cost:,.2f}) than the selected action (${invoice.cost:,.2f}).",
            )

    elif alt.action == ActionType.BANK_FINANCE:
        if invoice.selected_action == ActionType.DELAY:
            return CounterfactualExplanation(
                alternative_action=alt.action,
                is_eligible=True,
                status="HIGHER_COST",
                explanation=(
                    f"BANK_FINANCE has higher financing interest cost (${alt.action_cost:,.2f}) than DELAY penalty "
                    f"(${invoice.cost:,.2f}), while DELAY safely satisfies liquidity constraints."
                ),
            )
        else:
            return CounterfactualExplanation(
                alternative_action=alt.action,
                is_eligible=True,
                status="CAPACITY_OR_COST",
                explanation=f"BANK_FINANCE would consume scarce bank credit line capacity at higher cost (${alt.action_cost:,.2f}).",
            )

    elif alt.action == ActionType.SUPPLIER_FINANCE:
        return CounterfactualExplanation(
            alternative_action=alt.action,
            is_eligible=True,
            status="HIGHER_COST",
            explanation=f"SUPPLIER_FINANCE has higher cost (${alt.action_cost:,.2f}) than the selected action (${invoice.cost:,.2f}).",
        )

    return CounterfactualExplanation(
        alternative_action=alt.action,
        is_eligible=True,
        status="SUBOPTIMAL",
        explanation=f"{alt.action.value} is sub-optimal compared to {invoice.selected_action.value}.",
    )


def explain_invoice_decision(invoice: InvoiceDecision) -> InvoiceExplanation:
    """Generate deterministic natural language and counterfactual explanation for an invoice decision."""
    counterfactuals = [
        _generate_counterfactual(invoice, alt)
        for alt in invoice.alternatives
        if not alt.is_selected
    ]

    p_id = invoice.payable_id
    act = invoice.selected_action.value

    # Build concise summary
    if invoice.selected_action == ActionType.BANK_FINANCE:
        summary = (
            f"{p_id} uses BANK_FINANCE to defer cash outflows past scheduled fixed obligations and maintain the conservative "
            f"liquidity buffer (${invoice.required_buffer:,.2f})."
        )
        detailed = (
            f"Invoice {p_id} (amount ${invoice.nominal_amount:,.2f}, due day {invoice.due_day}) is funded via revolving bank credit "
            f"at an action cost of ${invoice.cost:,.2f}. This avoids immediate cash drawdown during critical liquidity windows while "
            f"preserving the safety buffer."
        )

    elif invoice.selected_action == ActionType.DELAY:
        summary = (
            f"{p_id} uses DELAY because delaying payment to Day {invoice.payment_day} aligns with receivable inflow timing at "
            f"lower cost (${invoice.cost:,.2f}) than bank financing."
        )
        detailed = (
            f"Invoice {p_id} (amount ${invoice.nominal_amount:,.2f}) is delayed by {invoice.payment_day - invoice.due_day} days. "
            f"The delay penalty (${invoice.cost - invoice.nominal_amount:,.2f}) is cheaper than borrowing rates, and payment occurs "
            f"after customer inflows arrive without breaching the conservative liquidity buffer."
        )

    elif invoice.selected_action == ActionType.SUPPLIER_FINANCE:
        summary = (
            f"{p_id} uses SUPPLIER_FINANCE to bridge working capital requirements and preserve liquidity buffer compliance."
        )
        detailed = (
            f"Invoice {p_id} (amount ${invoice.nominal_amount:,.2f}, due day {invoice.due_day}) utilizes supplier supply chain financing "
            f"(cost ${invoice.cost:,.2f}). This defers payment to Day {invoice.repayment_day} and maintains solvency while other commitments are settled."
        )

    elif invoice.selected_action == ActionType.PAY_NOW:
        summary = (
            f"{p_id} uses PAY_NOW to capture early payment discount savings of ${invoice.net_savings:,.2f}."
        )
        detailed = (
            f"Invoice {p_id} is settled early on Day {invoice.payment_day} at discounted cost ${invoice.cost:,.2f} because available liquidity "
            f"comfortably supports immediate disbursement."
        )

    else:
        summary = (
            f"{p_id} uses PAY_MATURITY to settle at face value on due day {invoice.due_day} with zero financing fees."
        )
        detailed = (
            f"Invoice {p_id} is paid on contractual due day {invoice.due_day} at face amount ${invoice.nominal_amount:,.2f}."
        )

    return InvoiceExplanation(
        payable_id=invoice.payable_id,
        selected_action=invoice.selected_action,
        cost=invoice.cost,
        reason_codes=invoice.reason_codes,
        summary=summary,
        detailed_explanation=detailed,
        counterfactuals=counterfactuals,
    )


def explain_decision_plan(plan: StructuredDecisionPlan) -> PortfolioExplanation:
    """Generate portfolio-wide deterministic decision explanations."""
    invoices = {p_id: explain_invoice_decision(inv) for p_id, inv in plan.invoices.items()}

    # Executive narrative
    exec_summary = (
        f"Portfolio optimization converged with status '{plan.status.value}' (Feasible: {plan.is_feasible}). "
        f"Total optimized commitment across {plan.summary.total_invoices} payables is ${plan.total_cost:,.2f}. "
        f"Bank credit drawn: ${plan.summary.total_bank_drawn:,.2f}, Supplier credit drawn: ${plan.summary.total_supplier_drawn:,.2f}. "
        f"Minimum conservative liquidity reached was ${plan.summary.min_conservative_cash:,.2f} (buffer: ${plan.summary.buffer:,.2f})."
    )

    return PortfolioExplanation(
        is_feasible=plan.is_feasible,
        total_cost=plan.total_cost,
        executive_summary=exec_summary,
        invoices=invoices,
        portfolio_reason_codes=plan.global_reason_codes,
    )


def explain_scenario_comparison(comparison: ScenarioComparison) -> ScenarioDeltaExplanation:
    """Generate deterministic explanation for decision adjustments across scenario comparison."""
    event_desc = (
        f"Receivable '{comparison.event.receivable_id}' delayed to Day {comparison.event.new_expected_day}"
    )

    shift_reasons: Dict[str, str] = {}
    for ch in comparison.changed_decisions:
        if ch.before_action == ActionType.DELAY and ch.after_action == ActionType.BANK_FINANCE:
            shift_reasons[ch.payable_id] = (
                f"{ch.payable_id} switched from DELAY to BANK_FINANCE because delaying payment is no longer feasible; "
                f"the delay of receivable '{comparison.event.receivable_id}' creates an intermediate liquidity shortfall "
                f"that would violate the conservative liquidity buffer if payment were made on Day 12."
            )
        else:
            shift_reasons[ch.payable_id] = (
                f"{ch.payable_id} changed from {ch.before_action.value} to {ch.after_action.value} to adapt to updated cash timing."
            )

    unchanged_reasons: Dict[str, str] = {}
    for un in comparison.unchanged_decisions:
        unchanged_reasons[un.payable_id] = (
            f"{un.payable_id} remains on {un.action.value} as its optimal financing assignment is unaffected by the event."
        )

    if comparison.changed_decisions:
        summary = (
            f"Shock event ({event_desc}) required {len(comparison.changed_decisions)} decision adjustment(s). "
            f"Total portfolio cost increased by ${comparison.cost_difference:+,.2f} to protect the liquidity buffer."
        )
    else:
        summary = (
            f"Shock event ({event_desc}) caused 0 decision adjustments. Existing plan remains optimal and buffer compliant."
        )

    return ScenarioDeltaExplanation(
        event_description=event_desc,
        cost_delta=comparison.cost_difference,
        summary=summary,
        decision_shift_reasons=shift_reasons,
        unchanged_reasons=unchanged_reasons,
    )
