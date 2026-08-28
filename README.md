# TREVO API CONTRACT

Status: FROZEN

This file defines the communication contract between the frontend, backend and decision engine.

Do not change endpoint names or JSON field names during the hackathon without informing all four members.

---

# 1. LOCAL URLS

Frontend:

http://localhost:5173

Backend:

http://localhost:8000

FastAPI documentation:

http://localhost:8000/docs

---

# 2. PRODUCTION

Frontend:

Vercel

Backend:

Render

The frontend receives the backend URL through:

VITE_API_BASE_URL

---

# 3. MONEY FORMAT

Backend:

Use integer rupee values.

Example:

100000

means:

₹1,00,000

Do not return formatted strings such as "₹1,00,000" for fields that the frontend needs to process.

The frontend handles visual currency formatting.

---

# 4. BUSINESS STATE

```json
{
  "cash": 1000000,
  "buffer": 500000,
  "payables": [],
  "receivables": [],
  "obligations": [],
  "financing": []
}