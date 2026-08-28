from engine.data_models import (
    BusinessState,
    Payable,
    Receivable,
    Obligation,
    Financing,
)

from backend.database import get_connection


def load_business_state() -> BusinessState:
    """
    Load the current SQLite database state and convert it
    into the engine's BusinessState model.

    This adapter contains only database-to-engine mapping.
    It does not perform any decision or optimization logic.
    """

    with get_connection() as conn:

        # -------------------------------------------------
        # Business state
        # -------------------------------------------------

        business = conn.execute(
            """
            SELECT cash, buffer
            FROM business_state
            WHERE id = 1
            """
        ).fetchone()

        if business is None:
            raise ValueError(
                "business_state row with id=1 was not found"
            )

        # -------------------------------------------------
        # Payables
        # -------------------------------------------------

        payable_rows = conn.execute(
            """
            SELECT
                id,
                amount,
                due_day,
                discount_rate,
                discount_deadline_day,
                penalty_rate,
                max_delay_days,
                bank_rate,
                supplier_rate,
                fin_term_days,
                importance
            FROM payables
            ORDER BY due_day
            """
        ).fetchall()

        # -------------------------------------------------
        # Receivables
        # -------------------------------------------------

        receivable_rows = conn.execute(
            """
            SELECT
                id,
                amount,
                expected_day,
                p_ontime,
                late_day
            FROM receivables
            ORDER BY expected_day
            """
        ).fetchall()

        # -------------------------------------------------
        # Obligations
        # -------------------------------------------------

        obligation_rows = conn.execute(
            """
            SELECT
                id,
                amount,
                day
            FROM obligations
            ORDER BY day
            """
        ).fetchall()

        # -------------------------------------------------
        # Financing
        # -------------------------------------------------

        financing_rows = conn.execute(
            """
            SELECT
                source,
                limit_amount,
                rate
            FROM financing
            """
        ).fetchall()

    # =====================================================
    # Convert database rows → engine models
    # =====================================================

    payables = [
        Payable(
            id=str(row["id"]),
            amount=float(row["amount"]),
            due_day=int(row["due_day"]),
            discount_rate=float(row["discount_rate"] or 0.0),
            discount_deadline_day=(
                int(row["discount_deadline_day"])
                if row["discount_deadline_day"] is not None
                else None
            ),
            penalty_rate=(
                float(row["penalty_rate"])
                if row["penalty_rate"] is not None
                else None
            ),
            max_delay_days=int(row["max_delay_days"] or 0),
            bank_rate=(
                float(row["bank_rate"])
                if row["bank_rate"] is not None
                else None
            ),
            supplier_rate=(
                float(row["supplier_rate"])
                if row["supplier_rate"] is not None
                else None
            ),
            fin_term_days=int(row["fin_term_days"] or 0),
            importance=row["importance"],
        )
        for row in payable_rows
    ]

    receivables = [
        Receivable(
            id=str(row["id"]),
            amount=float(row["amount"]),
            expected_day=int(row["expected_day"]),
            p_ontime=float(row["p_ontime"] or 1.0),
            late_day=int(row["late_day"] or 0),
        )
        for row in receivable_rows
    ]

    obligations = [
        Obligation(
            id=str(row["id"]),
            amount=float(row["amount"]),
            day=int(row["day"]),
        )
        for row in obligation_rows
    ]

    financing = [
        Financing(
            source=str(row["source"]),
            limit=float(row["limit_amount"]),
        )
        for row in financing_rows
    ]

    # NOTE:
    # financing.rate exists in SQLite, but the engine's
    # Financing model does not have a rate field.
    # Therefore it is intentionally not passed to Financing.

    return BusinessState(
        cash=float(business["cash"]),
        buffer=float(business["buffer"]),
        payables=payables,
        receivables=receivables,
        obligations=obligations,
        financing=financing,
    )