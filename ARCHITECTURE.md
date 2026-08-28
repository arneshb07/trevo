# TREVO ARCHITECTURE

## 1. OVERVIEW

TREVO is an autonomous working capital decision engine.

Its purpose is to decide how limited business cash should be allocated across competing payables and financing options while considering future liquidity and uncertain receivables.

---

# 2. HIGH LEVEL ARCHITECTURE

```text
                    TREVO WEB APP

        ┌───────────────────────────────┐
        │ React + Vite + TypeScript     │
        │                               │
        │ Dashboard                     │
        │ Payables                      │
        │ Receivables                   │
        │ Events                        │
        │ Decisions                     │
        │ Charts                        │
        │ Explanation                   │
        └───────────────┬───────────────┘
                        │
                       HTTP
                        │
                        ▼
        ┌───────────────────────────────┐
        │ FastAPI Backend               │
        │                               │
        │ State                         │
        │ Events                        │
        │ Decisions                     │
        │ History                       │
        │ Voice                         │
        └───────────────┬───────────────┘
                        │
                  Python import
                        │
                        ▼
        ┌───────────────────────────────┐
        │ TREVO Decision Engine         │
        │                               │
        │ Forecast                      │
        │ Uncertainty                   │
        │ Financing                     │
        │ Constraints                   │
        │ CP SAT Optimizer              │
        │ Decision Trace                │
        │ Counterfactuals               │
        └───────────────────────────────┘
        3. FRONTEND

Technology:

React

Vite

TypeScript

Tailwind CSS

Recharts

Deployment:

Vercel

The frontend is responsible for presentation and user interaction.

The frontend does not make financial decisions.

4. FRONTEND OWNERSHIP
Arnesh

Owns:

frontend application shell

pages

layout

navigation

dashboard

tables

event controls

API client

API integration

loading states

error states

demo mode

Mudit

Owns:

charts

decision diff

explanation panel

counterfactual UI

timeline

ElevenLabs audio player

5. BACKEND

Technology:

FastAPI

Python

SQLite

Deployment:

Render

Backend responsibilities:

Receive API requests.
Validate input.
Load business state.
Apply events.
Call decision engine.
Store history.
Return structured responses.
Call ElevenLabs when requested.

The backend must not contain duplicated optimization logic.

6. DECISION ENGINE

Technology:

Python

OR Tools CP SAT

The engine is a Python package.

It is imported directly by FastAPI.

It is not a separate service.

7. ENGINE COMPONENTS
engine/
├── data_models.py
├── forecast.py
├── uncertainty.py
├── financing.py
├── constraints.py
├── optimizer.py
├── decisions.py
├── scenarios.py
└── explanations.py
8. ENGINE RESPONSIBILITIES

data_models.py

Defines the shared financial objects.

forecast.py

Builds the relevant cash checkpoints and cash traces.

uncertainty.py

Handles expected and conservative receivable treatment.

financing.py

Calculates financing costs and repayment timing.

constraints.py

Implements the hard constraints.

optimizer.py

Builds and solves the joint CP SAT model.

decisions.py

Creates the structured decision output.

scenarios.py

Handles counterfactual sweeps.

explanations.py

Creates deterministic explanations and optional LLM polished text.

9. CORE DECISION FLOW
Business State
      ↓
Build Checkpoints
      ↓
Expected Cash Trace
      ↓
Conservative Cash Trace
      ↓
Evaluate Eligible Actions
      ↓
Build Joint Optimization
      ↓
Apply Constraints
      ↓
Solve
      ↓
Decision[]
      ↓
Decision Trace
10. EVENT FLOW
Financial Event
      ↓
POST /events
      ↓
Validate
      ↓
Update State
      ↓
Run Optimizer
      ↓
New Decision[]
      ↓
Compare Old Plan
      ↓
Create Diff
      ↓
Store History
      ↓
Return Response
      ↓
Frontend Updates
11. PRIMARY EVENT

AR-Y changes:

Day 9

to:

Day 20

This should cause:

INV-B

DELAY

→

BANK_FINANCE

12. DATABASE

SQLite stores:

business state

decisions

events

history

The gold dataset remains in JSON.

The core decision engine should still be able to run from JSON if database persistence fails.

13. COMMUNICATION

Frontend communicates only with FastAPI.

FastAPI communicates directly with the Python engine.

The frontend never imports the engine.

The engine does not depend on FastAPI.

14. AI

The decision flow is:

Business State
↓
Deterministic Engine
↓
Decision
↓
Deterministic Explanation
↓
Optional LLM Polish
↓
Optional ElevenLabs Voice

The LLM cannot alter the selected financial action.

ElevenLabs cannot alter the selected financial action.

15. DEPLOYMENT
Browser
   ↓
Vercel
   ↓
FastAPI on Render
   ↓
TREVO Engine
   ↓
SQLite / JSON

The decision engine runs within the Render backend application.

16. FAILURE FALLBACKS

Frontend deployment fails:

Run locally.

Backend deployment fails:

Run locally.

Database fails:

Use JSON state.

LLM fails:

Use deterministic explanation.

ElevenLabs fails:

Use text explanation.

Counterfactual fails:

Hide the feature.

Optimizer fails:

Debug against the gold dataset before changing architecture.

17. ARCHITECTURAL PRINCIPLE

Keep the system small.

Do not introduce:

microservices

message brokers

complex cloud infrastructure

separate optimization servers

complex authentication

real financial integrations

The objective is reliability and demonstrability within 24 hours.