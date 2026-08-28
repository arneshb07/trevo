from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title="TREVO Backend")


app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
    ],
    allow_methods=["GET", "POST"],
    allow_headers=["*"],
    allow_credentials=False,
)


@app.get("/")
def health_check():
    return {
        "status": "ok",
        "message": "TREVO backend is running"
    }


@app.get("/state")
def get_state():
    return {
        "cash": 1000000,
        "buffer": 500000,
        "payables": [
            {
                "id": "INV-A",
                "amount": 200000,
                "due_day": 5,
                "discount_rate": 0.03,
                "discount_deadline_day": 2,
                "penalty_rate": None,
                "max_delay_days": 0,
                "bank_rate": 0.12,
                "supplier_rate": None,
                "fin_term_days": 30,
                "importance": "MEDIUM"
            },
            {
                "id": "INV-B",
                "amount": 300000,
                "due_day": 7,
                "discount_rate": 0,
                "discount_deadline_day": None,
                "penalty_rate": 0.008,
                "max_delay_days": 5,
                "bank_rate": 0.12,
                "supplier_rate": None,
                "fin_term_days": 30,
                "importance": "LOW"
            },
            {
                "id": "INV-C",
                "amount": 150000,
                "due_day": 10,
                "discount_rate": 0,
                "discount_deadline_day": None,
                "penalty_rate": None,
                "max_delay_days": 0,
                "bank_rate": None,
                "supplier_rate": 0.07,
                "fin_term_days": 30,
                "importance": "HIGH"
            }
        ],
        "receivables": [
            {
                "id": "AR-X",
                "amount": 500000,
                "expected_day": 4,
                "p_ontime": 0.80,
                "late_day": 14
            },
            {
                "id": "AR-Y",
                "amount": 300000,
                "expected_day": 9,
                "p_ontime": 0.90,
                "late_day": 16
            }
        ],
        "obligations": [
            {
                "id": "PAYROLL",
                "amount": 400000,
                "day": 6
            }
        ],
        "financing": [
            {
                "source": "BANK",
                "limit": 500000,
                "rate": 0.12
            },
            {
                "source": "SUPPLIER_C",
                "limit": 200000,
                "rate": 0.07
            }
        ]
    }


@app.get("/decisions")
def get_decisions():
    return {
        "decisions": [
            {
                "invoice_id": "INV-A",
                "selected_action": "BANK_FINANCE",
                "cost": 1973
            },
            {
                "invoice_id": "INV-B",
                "selected_action": "DELAY",
                "cost": 2400
            },
            {
                "invoice_id": "INV-C",
                "selected_action": "SUPPLIER_FINANCE",
                "cost": 863
            }
        ],
        "total_cost": 5236
    }