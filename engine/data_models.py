"""Data models for CapitalOps Decision Engine (Section 4.1 BusinessState Contract)."""

from typing import List, Optional
from pydantic import BaseModel, Field, field_validator


class Payable(BaseModel):
    """Represents an invoice or payable obligation to a supplier."""

    id: str = Field(..., description="Unique identifier for the payable")
    amount: float = Field(..., gt=0, description="Monetary amount, must be greater than zero")
    due_day: int = Field(..., ge=0, description="Day index when the payable is due")
    discount_rate: float = Field(default=0.0, ge=0.0, description="Early payment discount rate (e.g. 0.02 for 2%)")
    discount_deadline_day: Optional[int] = Field(default=None, description="Day by which early payment discount applies (optional)")
    penalty_rate: Optional[float] = Field(default=None, description="Late payment penalty rate per day/period (optional)")
    max_delay_days: int = Field(default=0, ge=0, description="Maximum days payment can be delayed")
    bank_rate: Optional[float] = Field(default=None, description="Interest rate for bank credit line financing (optional)")
    supplier_rate: Optional[float] = Field(default=None, description="Interest rate for supplier/dynamic discounting financing (optional)")
    fin_term_days: int = Field(default=0, ge=0, description="Financing repayment term in days")
    importance: float = Field(default=1.0, ge=0.0, description="Strategic importance/priority weight of supplier (numeric internally)")

    @field_validator("discount_deadline_day", "penalty_rate", "bank_rate", "supplier_rate", mode="before")
    @classmethod
    def validate_optional_non_negative(cls, value):
        if value is not None and value < 0:
            raise ValueError("Optional numeric fields must be non‑negative when provided")
        return value

    @field_validator("importance", mode="before")
    @classmethod
    def map_importance(cls, v):
        if isinstance(v, (int, float)):
            return float(v)
        mapping = {"HIGH": 3.0, "MEDIUM": 2.0, "LOW": 1.0}
        if isinstance(v, str):
            key = v.upper()
            if key in mapping:
                return mapping[key]
        raise ValueError(f"importance must be one of HIGH, MEDIUM, LOW or a numeric weight; got {v!r}")

    @field_validator("amount")
    @classmethod
    def validate_amount_positive(cls, value: float) -> float:
        if value <= 0:
            raise ValueError("Amount must be strictly positive (greater than 0)")
        return value


class Receivable(BaseModel):
    """Represents an expected customer receivable inflow."""

    id: str = Field(..., description="Unique identifier for the receivable")
    amount: float = Field(..., gt=0, description="Monetary amount, must be greater than zero")
    expected_day: int = Field(..., ge=0, description="Expected day of receipt")
    p_ontime: float = Field(default=1.0, ge=0.0, le=1.0, description="Probability that receipt arrives on time [0, 1]")
    late_day: int = Field(default=0, ge=0, description="Alternative expected day of receipt if payment is delayed")

    @field_validator("amount")
    @classmethod
    def validate_amount_positive(cls, value: float) -> float:
        if value <= 0:
            raise ValueError("Amount must be strictly positive (greater than 0)")
        return value


class Obligation(BaseModel):
    """Represents a non-negotiable fixed cash outflow (e.g. payroll, tax, debt service)."""

    id: str = Field(..., description="Unique identifier for the obligation")
    amount: float = Field(..., gt=0, description="Monetary amount, must be greater than zero")
    day: int = Field(..., ge=0, description="Day index when the obligation must be settled")

    @field_validator("amount")
    @classmethod
    def validate_amount_positive(cls, value: float) -> float:
        if value <= 0:
            raise ValueError("Amount must be strictly positive (greater than 0)")
        return value


class Financing(BaseModel):
    """Represents an available financing facility (e.g. credit line, factoring facility)."""

    source: str = Field(..., description="Name or identifier of the financing source")
    limit: float = Field(..., gt=0, description="Available credit limit, must be greater than zero")

    @field_validator("limit")
    @classmethod
    def validate_limit_positive(cls, value: float) -> float:
        if value <= 0:
            raise ValueError("Limit must be strictly positive (greater than 0)")
        return value


class BusinessState(BaseModel):
    """Complete snapshot of the enterprise financial state."""

    cash: float = Field(..., ge=0.0, description="Current cash balance, cannot be negative")
    buffer: float = Field(default=0.0, ge=0.0, description="Minimum liquidity buffer requirement, cannot be negative")
    payables: List[Payable] = Field(default_factory=list, description="List of current payables")
    receivables: List[Receivable] = Field(default_factory=list, description="List of expected receivables")
    obligations: List[Obligation] = Field(default_factory=list, description="List of fixed obligations")
    financing: List[Financing] = Field(default_factory=list, description="List of available financing options")

    @field_validator("cash", "buffer")
    @classmethod
    def validate_non_negative_balances(cls, value: float) -> float:
        if value < 0:
            raise ValueError("Cash and liquidity buffer balances cannot be negative")
        return value
