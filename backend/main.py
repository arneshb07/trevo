import json

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from backend.database import get_connection
from backend.engine_adapter import load_business_state
from engine.decisions import generate_decisions


app = FastAPI(title="TREVO Backend")


# =========================================================
# CORS
# =========================================================

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
    ],
    allow_methods=["GET", "POST"],
    allow_headers=["*"],
    allow_credentials=False,
)


# =========================================================
# HEALTH CHECK
# =========================================================

@app.get("/")
def health_check():
    return {
        "status": "ok",
        "message": "TREVO backend is running"
    }


# =========================================================
# GET CURRENT STATE
# =========================================================

@app.get("/state")
def get_state():

    with get_connection() as conn:

        business = conn.execute(
            """
            SELECT cash, buffer
            FROM business_state
            WHERE id = 1
            """
        ).fetchone()

        payables = conn.execute(
            """
            SELECT *
            FROM payables
            """
        ).fetchall()

        receivables = conn.execute(
            """
            SELECT *
            FROM receivables
            """
        ).fetchall()

        obligations = conn.execute(
            """
            SELECT *
            FROM obligations
            """
        ).fetchall()

        financing = conn.execute(
            """
            SELECT *
            FROM financing
            """
        ).fetchall()

    return {
        "cash": business["cash"],
        "buffer": business["buffer"],

        "payables": [
            dict(row)
            for row in payables
        ],

        "receivables": [
            dict(row)
            for row in receivables
        ],

        "obligations": [
            dict(row)
            for row in obligations
        ],

        "financing": [
            {
                "source": row["source"],
                "limit": row["limit_amount"],
                "rate": row["rate"]
            }
            for row in financing
        ]
    }


# =========================================================
# GET DECISIONS
#
# Uses the REAL TREVO CP-SAT decision engine
# =========================================================

@app.get("/decisions")
def get_decisions():

    state = load_business_state()

    result = generate_decisions(
        state=state,
        current_day=0,
        time_limit_seconds=10.0
    )

    return result


# =========================================================
# SIMULATE EVENT
#
# Event flow:
#
# 1. Generate current decision plan
# 2. Apply event to database
# 3. Generate new decision plan
# 4. Compare old vs new decisions
# 5. Save decision history
# 6. Return everything to frontend
# =========================================================

@app.post("/events")
def simulate_event(event: dict):

    invoice_id = event.get("invoice_id")
    new_day = event.get("new_day")
    event_type = event.get("type", "UNKNOWN")

    # -----------------------------------------------------
    # Validate input
    # -----------------------------------------------------

    if not invoice_id or new_day is None:

        return {
            "status": "error",
            "message": "invoice_id and new_day are required"
        }

    # -----------------------------------------------------
    # Calculate decisions BEFORE event
    #
    # Uses the REAL CP-SAT engine
    # -----------------------------------------------------

    previous_plan = generate_decisions(
        state=load_business_state(),
        current_day=0,
        time_limit_seconds=10.0
    )

    # Convert Pydantic model into normal JSON-compatible dict
    previous_decisions = previous_plan.model_dump(
        mode="json"
    )

    # -----------------------------------------------------
    # Apply event
    # -----------------------------------------------------

    with get_connection() as conn:

        # Find receivable
        receivable = conn.execute(
            """
            SELECT expected_day, late_day
            FROM receivables
            WHERE id = ?
            """,
            (invoice_id,)
        ).fetchone()

        if receivable is None:

            return {
                "status": "error",
                "message": f"Receivable {invoice_id} not found"
            }

        old_day = receivable["expected_day"]

        # -------------------------------------------------
        # Update receivable
        #
        # For a RECEIVABLE_DELAY event, both expected_day
        # and late_day are updated.
        #
        # This ensures the changed receivable timing is
        # reflected in both EXPECTED and CONSERVATIVE
        # scenarios used by the decision engine.
        # -------------------------------------------------

        if event_type == "RECEIVABLE_DELAY":

            conn.execute(
                """
                UPDATE receivables
                SET expected_day = ?,
                    late_day = ?
                WHERE id = ?
                """,
                (
                    new_day,
                    new_day,
                    invoice_id
                )
            )

        else:

            conn.execute(
                """
                UPDATE receivables
                SET expected_day = ?
                WHERE id = ?
                """,
                (
                    new_day,
                    invoice_id
                )
            )

        # -------------------------------------------------
        # Save event
        # -------------------------------------------------

        event_cursor = conn.execute(
            """
            INSERT INTO events (
                event_type,
                payload
            )
            VALUES (?, ?)
            """,
            (
                event_type,
                json.dumps(event)
            )
        )

        event_id = event_cursor.lastrowid

        conn.commit()

    # -----------------------------------------------------
    # Recalculate decisions AFTER event
    #
    # Uses the REAL CP-SAT engine again
    # -----------------------------------------------------

    new_plan = generate_decisions(
        state=load_business_state(),
        current_day=0,
        time_limit_seconds=10.0
    )

    new_decisions = new_plan.model_dump(
        mode="json"
    )

    # -----------------------------------------------------
    # Compare old and new decisions
    #
    # Expected engine structure:
    #
    # {
    #     "invoices": {
    #         "INV-A": {...},
    #         "INV-B": {...},
    #         "INV-C": {...}
    #     }
    # }
    # -----------------------------------------------------

    previous_map = previous_decisions.get(
        "invoices",
        {}
    )

    new_map = new_decisions.get(
        "invoices",
        {}
    )

    changes = []

    for current_invoice_id, new_decision in new_map.items():

        old_decision = previous_map.get(
            current_invoice_id
        )

        if old_decision is None:
            continue

        old_action = old_decision.get(
            "selected_action"
        )

        new_action = new_decision.get(
            "selected_action"
        )

        old_cost = float(
            old_decision.get("cost", 0)
        )

        new_cost = float(
            new_decision.get("cost", 0)
        )

        # -------------------------------------------------
        # Record only actual decision changes
        # -------------------------------------------------

        if (
            old_action != new_action
            or old_cost != new_cost
        ):

            changes.append(
                {
                    "invoice_id": current_invoice_id,
                    "old_action": old_action,
                    "new_action": new_action,
                    "old_cost": old_cost,
                    "new_cost": new_cost,
                    "cost_delta": round(
                        new_cost - old_cost,
                        2
                    )
                }
            )

    # -----------------------------------------------------
    # SAVE DECISION HISTORY
    # -----------------------------------------------------

    with get_connection() as conn:

        conn.execute(
            """
            INSERT INTO history (
                event_id,
                previous_plan,
                new_plan
            )
            VALUES (?, ?, ?)
            """,
            (
                event_id,
                json.dumps(previous_decisions),
                json.dumps(new_decisions)
            )
        )

        conn.commit()

    # -----------------------------------------------------
    # Return result
    # -----------------------------------------------------

    return {
        "status": "ok",
        "message": "Event applied and decisions recalculated",

        "event": event,

        "previous_decisions": previous_decisions,

        "new_decisions": new_decisions,

        "changes": changes,

        "old_day": old_day,

        "new_day": new_day
    }


# =========================================================
# GET DECISION HISTORY
# =========================================================

@app.get("/history")
def get_history():

    with get_connection() as conn:

        history = conn.execute(
            """
            SELECT
                id,
                event_id,
                previous_plan,
                new_plan,
                created_at
            FROM history
            ORDER BY id DESC
            """
        ).fetchall()

    return {
        "history": [
            {
                "id": row["id"],

                "event_id": row["event_id"],

                "previous_plan": json.loads(
                    row["previous_plan"]
                ),

                "new_plan": json.loads(
                    row["new_plan"]
                ),

                "created_at": row["created_at"]
            }

            for row in history
        ]
    }