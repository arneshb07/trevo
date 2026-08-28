import json
import os
from pathlib import Path
from dotenv import load_dotenv

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from backend.database import get_connection
from backend.engine_adapter import load_business_state
from engine.decisions import generate_decisions

# Load environment variables from .env file if available
env_path = Path(__file__).resolve().parent.parent / ".env"
load_dotenv(dotenv_path=env_path)
load_dotenv()

app = FastAPI(title="TREVO Backend")


# =========================================================
# CORS
# =========================================================

default_origins = [
    "http://localhost:5173",
    "http://localhost:5174",
    "http://localhost:5175",
    "http://127.0.0.1:5173",
    "http://127.0.0.1:5174",
    "http://127.0.0.1:5175",
    "http://localhost:3000",
    "http://127.0.0.1:3000",
]

env_origins = (
    os.getenv("ALLOWED_ORIGINS")
    or os.getenv("ALLOWED_FRONTEND_ORIGINS")
    or os.getenv("FRONTEND_ORIGIN")
)

allowed_origins = list(default_origins)
if env_origins:
    extra_origins = [o.strip() for o in env_origins.split(",") if o.strip()]
    for origin in extra_origins:
        if origin not in allowed_origins:
            allowed_origins.append(origin)

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_origin_regex=r"http://(localhost|127\.0\.0\.1)(:\d+)?",
    allow_methods=["*"],
    allow_headers=["*"],
    allow_credentials=True,
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

    invoice_id = event.get("invoice_id") or event.get("receivable_id")
    new_day = event.get("new_day") if event.get("new_day") is not None else event.get("new_expected_day")
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
                h.id,
                h.event_id,
                h.previous_plan,
                h.new_plan,
                h.created_at,
                e.event_type,
                e.payload
            FROM history h
            LEFT JOIN events e ON h.event_id = e.id
            ORDER BY h.id DESC
            """
        ).fetchall()

        return {
            "history": [
                {
                    "id": row["id"],

                    "event_id": row["event_id"],

                    "event_type": row["event_type"] if row["event_type"] else "REOPTIMIZATION",

                    "payload": json.loads(row["payload"]) if row["payload"] else None,

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


# =========================================================
# FORCE RE-OPTIMIZE
# =========================================================

@app.post("/optimize")
def optimize_state():
    state = load_business_state()
    result = generate_decisions(
        state=state,
        current_day=0,
        time_limit_seconds=10.0
    )
    return result


# =========================================================
# RESET DATABASE TO BASELINE
# =========================================================

@app.post("/reset")
def reset_database():
    from backend.seed import seed_database
    seed_database()
    state = load_business_state()
    decisions = generate_decisions(state=state, current_day=0)
    return {
        "status": "ok",
        "message": "Database reset to baseline state",
        "state": get_state(),
        "decisions": decisions
    }


# =========================================================
# COUNTERFACTUAL PARAMETER SWEEP
# =========================================================

@app.get("/decision/{invoice_id}/counterfactual")
def get_counterfactual(invoice_id: str):
    state = load_business_state()
    plan = generate_decisions(state=state, current_day=0)
    
    # Normalize ID lookup
    inv = plan.invoices.get(invoice_id)
    if not inv:
        inv = plan.invoices.get(invoice_id.replace(" ", "-"))
    if not inv:
        inv = plan.invoices.get(invoice_id.replace("-", " "))
    if not inv:
        normalized_map = {k.upper().replace("-", ""): v for k, v in plan.invoices.items()}
        inv = normalized_map.get(invoice_id.upper().replace("-", ""))

    if not inv:
        return {
            "invoice_id": invoice_id,
            "parameter_name": "Alternative Financing Action",
            "points": []
        }

    from engine.explanations import explain_invoice_decision
    exp = explain_invoice_decision(inv)
    
    points = []
    for alt in inv.alternatives:
        points.append({
            "parameter_value": alt.action.value,
            "optimal_action": alt.action.value,
            "cost": round(alt.action_cost, 2),
            "feasible": alt.is_eligible,
            "reason": alt.ineligibility_reason
        })

    return {
        "invoice_id": invoice_id,
        "parameter_name": "Alternative Financing Action",
        "points": points,
        "summary": exp.summary,
        "detailed_explanation": exp.detailed_explanation
    }


# =========================================================
# VOICE / NARRATED EXPLANATION
# =========================================================

@app.post("/explain/voice")
def explain_voice(payload: dict = None):
    invoice_id = (payload or {}).get("invoice_id", "INV-B") if payload else "INV-B"
    state = load_business_state()
    plan = generate_decisions(state=state, current_day=0)
    
    inv = plan.invoices.get(invoice_id) or plan.invoices.get(invoice_id.replace(" ", "-")) or plan.invoices.get(invoice_id.replace("-", " "))
    if not inv:
        normalized_map = {k.upper().replace("-", ""): v for k, v in plan.invoices.items()}
        inv = normalized_map.get(invoice_id.upper().replace("-", ""))

    if inv:
        from engine.explanations import explain_invoice_decision
        exp = explain_invoice_decision(inv)
        return {
            "text": f"{exp.summary} {exp.detailed_explanation}",
            "audio": None
        }

    return {
        "text": "Decision explanation generated by TREVO portfolio engine.",
        "audio": None
    }