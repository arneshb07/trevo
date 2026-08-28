# TREVO AGENT INSTRUCTIONS

## PROJECT

Project name: TREVO

Product: Autonomous Working Capital Decision Engine

Hackathon: CSI Origin 2026

Problem Statement: Problem Statement 4

TREVO continuously decides how a business should deploy limited working capital across outstanding payables.

It considers:

1. Current cash
2. Future cash availability
3. Receivables
4. Receivable uncertainty
5. Fixed obligations
6. Supplier importance
7. Financing availability
8. Financing cost
9. Early payment discounts
10. Late payment penalties

For each payable, TREVO evaluates:

1. PAY_NOW
2. PAY_MATURITY
3. DELAY
4. BANK_FINANCE
5. SUPPLIER_FINANCE

When the financial state changes, TREVO re optimizes.

Core principle:

THE OPTIMIZER DECIDES.
THE LLM EXPLAINS.
ELEVENLABS SPEAKS.

No LLM or external AI model may choose a financial action.

---

# 1. NON NEGOTIABLE ARCHITECTURE

Frontend:

React + Vite + TypeScript + Tailwind CSS

Backend:

FastAPI + Python

Decision engine:

Python + OR Tools CP SAT

Database:

SQLite

LLM:

Optional explanation polishing only

Voice:

ElevenLabs Text to Speech

Frontend deployment:

Vercel

Backend deployment:

Render

The decision engine is a Python package imported directly by FastAPI.

The decision engine is NOT a separate service.

Do not introduce microservices.

Do not introduce unnecessary infrastructure.

---

# 2. REPOSITORY STRUCTURE

TREVO/

├── backend/
├── engine/
├── frontend/
├── data/
├── tests/
├── docs/
├── AGENTS.md
├── API_CONTRACT.md
├── ARCHITECTURE.md
├── CONTRIBUTING.md
├── PROJECT_STATUS.md
├── README.md
└── LICENSE

---

# 3. TEAM OWNERSHIP

## Arnesh

Branch:

feat/frontend-core

Owns:

frontend application shell
pages
layout
navigation
Command Center
payables table
receivables table
financing summary
event controls
API client
API integration
loading states
error states
demo mode

Do not modify:

backend/
engine/

Do not modify Mudit visualization components without coordination.

---

## Mudit

Branch:

feat/frontend-visualization

Owns:

frontend/components/charts/
frontend/components/diff/
frontend/components/explanation/
frontend/components/counterfactual/
frontend/components/timeline/
ElevenLabs audio player UI

Do not modify:

backend/
engine/
Arnesh application shell
Arnesh API client

without explicit coordination.

---

## Priyam

Branch:

feat/backend

Owns:

backend/
FastAPI
Pydantic API models
SQLite
API routes
state management
event handling
history
CORS
ElevenLabs server side endpoint
deployment configuration

Do not implement financial optimization logic in backend/.

Import the engine instead.

---

## Manasvi

Branch:

feat/risk-optimizer

Owns:

engine/
data/

forecasting
uncertainty
financing calculations
constraints
OR Tools CP SAT
decision trace
gold dataset
counterfactual calculations
infeasibility diagnosis

Do not modify:

frontend/
backend/

---

# 4. FILE OWNERSHIP RULE

Work only inside your assigned directories.

If you need a change outside your ownership:

1. Stop.
2. Tell the owner.
3. Agree on the change.
4. Update the relevant contract if necessary.
5. Then implement.

Do not silently modify another member's files.

---

# 5. FROZEN CONTRACTS

The following are shared contracts:

BusinessState
Decision
Event
Scenario
API endpoints
API response fields
Environment variable names

Do not rename fields or endpoints casually.

Do not introduce duplicate versions of the same contract.

If a contract genuinely needs to change:

1. Update API_CONTRACT.md.
2. Tell all four members.
3. Update the producer.
4. Update the consumers.
5. Run integration tests.

---

# 6. FINANCIAL LOGIC RULE

The frontend must never calculate financial decisions.

The frontend displays decisions received from the API.

The backend does not duplicate optimization mathematics.

The decision engine is the single source of financial truth.

The LLM cannot choose:

PAY_NOW
PAY_MATURITY
DELAY
BANK_FINANCE
SUPPLIER_FINANCE

The LLM only explains a decision already produced by the optimizer.

---

# 7. MOCK FIRST RULE

Frontend work must be possible before backend work is complete.

Use:

frontend/mock/demo_state.json

The frontend must render the complete application using static mock data.

Mock mode must remain available as a fallback.

Backend work must also begin with mock responses where necessary so that frontend development is not blocked.

---

# 8. GOLD DEMO DATA

The canonical company is:

Orion Components Pvt Ltd

Cash:

₹10,00,000

Liquidity buffer:

₹5,00,000

Bank financing limit:

₹5,00,000 at 12% per year

Supplier C financing limit:

₹2,00,000 at 7% per year

Invoices:

INV-A
₹2,00,000
Due Day 5
3% discount by Day 2
No delay
Bank financing
Medium importance

INV-B
₹3,00,000
Due Day 7
No discount
5 day delay
0.8% penalty
Bank financing
Low importance

INV-C
₹1,50,000
Due Day 10
No delay
Supplier financing
7%
High importance

Receivables:

AR-X
₹5,00,000
Expected Day 4
Probability on time 0.80
Late Day 14

AR-Y
₹3,00,000
Expected Day 9
Probability on time 0.90
Late Day 16

Mandatory obligation:

PAYROLL
₹4,00,000
Day 6

---

# 9. EXPECTED BASELINE

The baseline optimizer result must be:

INV-A → BANK_FINANCE
INV-B → DELAY
INV-C → SUPPLIER_FINANCE

Total baseline explicit cost:

₹5,236

Do not modify the dataset simply to make another output appear correct.

If the output differs:

check the engine.

---

# 10. PRIMARY DEMO EVENT

Event:

{
  "type": "RECEIVABLE_DELAY",
  "receivable_id": "AR-Y",
  "new_expected_day": 20
}

Expected result:

INV-B

DELAY

becomes

BANK_FINANCE

Expected new total cost:

₹5,795

The decision changes because the previous delayed payment plan violates the required liquidity buffer after the receivable is delayed.

This event is the central hackathon demonstration.

---

# 11. DECISION ENGINE REQUIREMENTS

The engine must solve all invoices jointly.

Do NOT:

loop through invoices
choose the cheapest action independently
then check the portfolio afterwards

Instead:

create one joint optimization model containing all invoices.

Shared constraints must apply across the complete portfolio.

---

# 12. HARD CONSTRAINTS

The optimizer must enforce:

1. Exactly one action per invoice.
2. Action eligibility.
3. Financing capacity.
4. Conservative liquidity buffer at every checkpoint.
5. Fixed obligations as unconditional outflows.

The hard liquidity constraint must never be relaxed during normal optimization.

---

# 13. UNCERTAINTY MODEL

Expected cash trace:

Receivables arrive on their expected dates.

Conservative cash trace:

If p_ontime < 0.85, the receivable is treated as arriving on its late date.

The conservative trace is used for the hard liquidity constraint.

The expected trace is used only as a small preference term in the objective.

Do not replace this with full stochastic programming.

---

# 14. DISCOUNT SIGN

The early payment discount is a benefit.

In a minimization objective, the discount benefit must reduce the objective.

The implementation must contain the equivalent of:

negative discount benefit

and never:

positive discount cost

Verify this explicitly in code review.

---

# 15. SOLVER

Primary solver:

OR Tools CP SAT

Fallback:

PuLP + CBC

The fallback must preserve the same mathematical formulation.

Do not rewrite the product around a different optimization strategy unless the team explicitly agrees.

---

# 16. EXPLANATION

The engine must produce a structured decision trace containing:

selected action
alternative actions
feasibility
cost
cash impact
required buffer
binding constraints
reason codes

The deterministic template explanation must work without any LLM.

The LLM may improve wording only.

---

# 17. ELEVENLABS

ElevenLabs is an optional narration layer.

Required flow:

Decision
→ structured explanation
→ short text explanation
→ optional ElevenLabs
→ audio

The decision must appear on screen before any voice generation request is made.

A failed ElevenLabs request must never break the decision.

The API key must remain server side.

Never expose ELEVENLABS_API_KEY to the frontend.

---

# 18. COUNTERFACTUAL

Counterfactual analysis is optional until the main event driven loop works.

The frontend may request:

GET /decision/{id}/counterfactual

The engine performs the actual sweep.

The frontend only displays the result.

Never calculate the decision boundary independently in the frontend.

---

# 19. EVENT LOOP

The main runtime flow is:

BusinessState
→ Forecast
→ Joint Optimization
→ Decision
→ Display

Then:

Event
→ Updated BusinessState
→ Forecast
→ Joint Optimization
→ Decision Diff
→ Explanation

The event must cause a real re optimization.

Do not hardcode the live result in the production path.

Mock data may contain the expected result for offline fallback.

---

# 20. FAILURE HANDLING

If no feasible solution exists:

return NO_FEASIBLE_PLAN

Do not fabricate a decision.

The system should report:

first relevant checkpoint
required buffer
projected cash
shortfall
reason

---

# 21. API RULES

The frontend communicates with FastAPI.

The frontend must not import engine modules.

The backend imports the engine.

The API client belongs to the frontend core branch.

All API calls must have:

loading state
success state
failure state

---

# 22. GIT RULES

Never work directly on main.

Before work:

git checkout main
git pull origin main
git checkout <your-branch>

Before push:

git status
git add -A
git commit -m "<scope>: <description>"
git push origin <your-branch>

Never force push.

Do not rewrite another member's branch.

---

# 23. INTEGRATION ORDER

At integration checkpoints use:

1. feat/risk-optimizer
2. feat/backend
3. feat/frontend-core
4. feat/frontend-visualization

The reason:

engine
→ backend
→ frontend core
→ visualization

---

# 24. HOUR 12 RULE

By Hour 12 the following must work:

Frontend
→ API
→ Engine
→ Decision
→ Frontend

The gold baseline must be visible.

If it does not work at Hour 12:

STOP OPTIONAL FEATURE DEVELOPMENT.

Fix the core pipeline.

---

# 25. FEATURE PRIORITY

Priority 1:

BusinessState
Joint optimization
Liquidity constraints
Multiple actions
Event re optimization
Before and after diff
Deterministic explanation

Priority 2:

LLM explanation
Counterfactual

Priority 3:

ElevenLabs
Advanced visualization
Animation

---

# 26. EXPLICITLY DO NOT BUILD

Do not add:

Reinforcement learning
Multi agent negotiation
Real banking integration
Real ERP integration
Actual money movement
Authentication
Mobile application
Microservices
Full stochastic programming
Speech to text agent
Complex external event infrastructure

---

# 27. VIBE CODING RULE

Before changing code:

1. Read the relevant documentation.
2. Read the existing implementation.
3. Understand the interface.
4. Make the smallest change that satisfies the task.
5. Run tests.
6. Run the application if applicable.
7. Commit only working changes.

Do not allow an AI coding agent to rewrite unrelated files.

---

# 28. FINAL DEFINITION OF DONE

TREVO is functionally complete when the following works:

Load BusinessState

→ generate forecast

→ jointly optimize invoices

→ display allocation

→ fire AR-Y delay event

→ re optimize

→ INV-B changes from DELAY to BANK_FINANCE

→ show before and after

→ show why

→ optionally speak the explanation

This complete loop is more important than any optional feature.