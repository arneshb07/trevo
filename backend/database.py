import sqlite3
from pathlib import Path


DATABASE_PATH = Path(__file__).resolve().parent.parent / "data" / "trevo.db"


def get_connection():
    DATABASE_PATH.parent.mkdir(parents=True, exist_ok=True)

    connection = sqlite3.connect(DATABASE_PATH)
    connection.row_factory = sqlite3.Row

    return connection
def init_db():
    with get_connection() as conn:
        cursor = conn.cursor()

        # Business state
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS business_state (
                id INTEGER PRIMARY KEY,
                cash REAL NOT NULL,
                buffer REAL NOT NULL
            )
        """)

        # Payables
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS payables (
                id TEXT PRIMARY KEY,
                amount REAL NOT NULL,
                due_day INTEGER NOT NULL,
                discount_rate REAL,
                discount_deadline_day INTEGER,
                penalty_rate REAL,
                max_delay_days INTEGER,
                bank_rate REAL,
                supplier_rate REAL,
                fin_term_days INTEGER,
                importance TEXT
            )
        """)

        # Receivables
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS receivables (
                id TEXT PRIMARY KEY,
                amount REAL NOT NULL,
                expected_day INTEGER NOT NULL,
                p_ontime REAL NOT NULL,
                late_day INTEGER NOT NULL
            )
        """)

        # Obligations
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS obligations (
                id TEXT PRIMARY KEY,
                amount REAL NOT NULL,
                day INTEGER NOT NULL
            )
        """)

        # Financing sources
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS financing (
                source TEXT PRIMARY KEY,
                limit_amount REAL NOT NULL,
                rate REAL NOT NULL
            )
        """)

        # Events
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS events (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                event_type TEXT NOT NULL,
                payload TEXT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)

        # Decisions
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS decisions (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                invoice_id TEXT NOT NULL,
                selected_action TEXT NOT NULL,
                cost REAL NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)

        # Decision history
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS history (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                event_id INTEGER,
                previous_plan TEXT NOT NULL,
                new_plan TEXT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)

        conn.commit()