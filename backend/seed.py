from backend.database import get_connection, init_db

def seed_database():
    init_db()

    with get_connection() as conn:
        cursor = conn.cursor()

        # Business state
        cursor.execute("""
            INSERT OR REPLACE INTO business_state (id, cash, buffer)
            VALUES (1, 1000000, 500000)
        """)

        # Receivables
        cursor.execute("DELETE FROM receivables")

        cursor.execute("""
            INSERT INTO receivables
            (id, amount, expected_day, p_ontime, late_day)
            VALUES ('AR-X', 500000, 4, 0.80, 14)
        """)

        cursor.execute("""
            INSERT INTO receivables
            (id, amount, expected_day, p_ontime, late_day)
            VALUES ('AR-Y', 300000, 9, 0.90, 16)
        """)

        # Obligation
        cursor.execute("DELETE FROM obligations")

        cursor.execute("""
            INSERT INTO obligations
            (id, amount, day)
            VALUES ('PAYROLL', 400000, 6)
        """)

        # Payables
        cursor.execute("""
            INSERT OR REPLACE INTO payables
            (id, amount, due_day, discount_rate, discount_deadline_day,
             penalty_rate, max_delay_days, bank_rate, supplier_rate,
             fin_term_days, importance)
            VALUES ('INV-A', 200000, 5, 0.03, 2,
                    NULL, 0, 0.12, NULL, 30, 'MEDIUM')
        """)

        cursor.execute("""
            INSERT OR REPLACE INTO payables
            (id, amount, due_day, discount_rate, discount_deadline_day,
             penalty_rate, max_delay_days, bank_rate, supplier_rate,
             fin_term_days, importance)
            VALUES ('INV-B', 300000, 7, 0, NULL,
                    0.008, 5, 0.12, NULL, 30, 'LOW')
        """)

        cursor.execute("""
            INSERT OR REPLACE INTO payables
            (id, amount, due_day, discount_rate, discount_deadline_day,
             penalty_rate, max_delay_days, bank_rate, supplier_rate,
             fin_term_days, importance)
            VALUES ('INV-C', 150000, 10, 0, NULL,
                    NULL, 0, NULL, 0.07, 30, 'HIGH')
        """)

        # Financing options
        cursor.execute("""
            INSERT OR REPLACE INTO financing
            (source, limit_amount, rate)
            VALUES ('BANK', 500000, 0.12)
        """)

        cursor.execute("""
            INSERT OR REPLACE INTO financing
            (source, limit_amount, rate)
            VALUES ('SUPPLIER_C', 200000, 0.07)
        """)

        conn.commit()

    print("Trevo database seeded successfully")


if __name__ == "__main__":
    seed_database()