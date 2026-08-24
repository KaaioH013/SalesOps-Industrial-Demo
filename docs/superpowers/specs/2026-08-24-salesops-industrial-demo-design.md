# SalesOps Industrial Demo — Design Spec

**Date:** 2026-08-24  
**Status:** Approved in conversation; awaiting file review before implementation plan  
**Source brief:** `prompt-cursor-salesops-industrial-demo.md`  
**Delivery mode:** Sequential PRDs + autonomous Cursor loop (`ralph-superpowers`)

## 1. Goal

Build a complete, deployable portfolio web app that simulates B2B industrial distribution Sales Operations. A commercial coordinator can see where to act: priority customers, at-risk opportunities, repurchase windows, and margin risk.

All data is synthetic and deterministic. UI always shows a discreet badge: “Dados demonstrativos e sintéticos”. Predictions are demonstrative, not production ML claims.

Success = prompt acceptance criteria met (lint, typecheck, unit tests for business rules, Playwright critical path, navigable screens, RBAC enforced server-side, README with local + Vercel setup).

## 2. Explicit deviations from the original prompt

| Prompt | This design |
|--------|-------------|
| Supabase (Postgres, Auth, RLS) | **Turso (libSQL) + Drizzle + Auth.js (credentials)** |
| RLS in database | **Authorization in server queries / Server Actions** (org + role checks) |
| Env vars `NEXT_PUBLIC_SUPABASE_*` / service role | **`TURSO_DATABASE_URL`, `TURSO_AUTH_TOKEN`, `AUTH_SECRET`, `CRON_SECRET`** |
| Human stops between phases | **One human approval of design/plan; then autonomous PRD loop** |

Rationale: user’s Supabase quota is full; data is synthetic; plain SQLite on Vercel is not durable. Turso keeps SQLite-shaped DX with cloud persistence.

## 3. Stack

- Next.js (App Router) + TypeScript strict
- React Server Components by default; Client Components only for interactivity
- Tailwind CSS + shadcn/ui + Lucide
- Drizzle ORM + SQL migrations against Turso/libSQL
- Auth.js (NextAuth v5) credentials provider; session via cookies
- Zod + React Hook Form
- TanStack Table, Recharts, date-fns
- Vitest (pure domain rules), Playwright (login → dashboard → customer → create activity)
- ESLint + Prettier
- Optional offline `ml/` (Python scikit-learn) exporting scores for import; never runs per request

## 4. Architecture

```text
app/
  (auth)/login
  (dashboard)/dashboard|customers|pipeline|opportunities|quotes|orders|products|insights|reports|settings
  api/cron/recalculate-scores
components/          # UI composition by area
features/            # domain use-cases (customers, opportunities, scoring, forecasting)
lib/
  auth/              # Auth.js config, session helpers
  permissions/       # role gates (admin|manager|seller)
  validations/       # Zod schemas
  formatters/        # BRL, pt-BR dates, %
  analytics/         # RFM, scores, alerts (pure functions)
db/
  schema/            # Drizzle tables
  migrations/
  seed/              # deterministic faker pt-BR + fixed seed
  queries/           # data access with permission filters
ml/                  # optional offline training
tests/
scripts/ralph/       # prd.json, progress.txt, loop assets
tasks/               # PRD markdown per phase + queue
```

**Boundaries:** UI does not embed business formulas. Domain rules live in `lib/analytics` (or `features/*/domain`) as pure functions with unit tests. DB access goes through `db/queries` that apply role/org filters.

**Multi-tenant:** `organizations` table exists; seed uses one org. Every business row is scoped by `organization_id`. Session carries `userId`, `organizationId`, `role`.

## 5. Auth and roles

Demo users (credentials in README only, synthetic emails):

- `admin@demo.local` — full access, CRUD where applicable
- `manager@demo.local` — view all; edit opportunities, activities, quotes
- `seller@demo.local` — only assigned customers/opportunities/activities; **never** cost columns or detailed margin reports

Rules:

- All mutations via Server Actions / route handlers: validate Zod → require session → check role → mutate
- Seller list/detail queries strip or omit cost/margin fields
- Demo profile switcher allowed only when `NODE_ENV=development` or `DEMO_PROFILE_SWITCHER=true`; still authenticates as that user (no privilege escalation bypass in production builds without the flag)
- Audit log on relevant edits: actor, timestamp, entity, action (no secrets/PII dumps)

## 6. Domain model

Entities match the brief:

- Org/people: `organizations`, `profiles`, `sales_territories`
- Customers: `customers`, `contacts`, `customer_notes`
- Catalog/commerce: `product_families`, `products`, `price_lists`, `price_list_items`, `quotes`, `quote_items`, `orders`, `order_items`
- CRM: `opportunities` (stages: Novo → Qualificação → Diagnóstico → Proposta → Negociação → Ganho | Perdido), `activities`, `targets`
- Intelligence: `customer_scores`, `alerts`, `forecast_snapshots`
- `audit_events`

Indexes for common filters (org, territory, seller, status, dates, stage). Timestamps `created_at` / `updated_at` on all business tables.

## 7. Business rules (tested)

1. Gross margin = `(revenue - cost) / revenue`; guard zero revenue  
2. Pipeline weighted value = `estimated_value × probability`  
3. High-value customers past repurchase window increase priority  
4. Opportunities: >14 days no activity → attention alert; >30 days → critical (central config)  
5. Quotes below product-family target margin → margin alert  
6. Priority score 0–100: documented weights (revenue potential, margin, inactivity risk, repurchase proximity, open opportunity)  
7. Recalculate scores via protected Server Action + cron route guarded by `CRON_SECRET`  
8. Audit on relevant edits  

Initial intelligence layer is **deterministic** (RFM, rule-based inactivity, repurchase propensity, opportunity risk, weighted moving average / exponential smoothing forecast) with local factor explanations. Optional Python offline model may overwrite/import into `customer_scores` without being required at runtime.

## 8. Screens (functional, not decorative)

| Route | Purpose |
|-------|---------|
| `/dashboard` | Revenue/margin vs target, pipeline, conversion, risk/repurchase, trends, funnel, rankings, Pareto, alerts, “ações de hoje” |
| `/customers`, `/customers/[id]` | Filterable table + 360° (finance, trend, orders/quotes/opps/activities, scores, alerts, create activity/opportunity) |
| `/pipeline` | Kanban + table; stage moves; Ganho/Perdido confirmation; loss reason; side panel; risk metrics |
| `/opportunities/[id]` | Timeline, risk explanation, next step, edits |
| `/quotes`, `/orders` | Tables, detail, margin signals (role-aware) |
| `/products` | Catalog filters and margin/stock (role-aware) |
| `/insights` | Four blocks: repurchase, inactivity, at-risk opps, margin risk — score, factors, recommended action |
| `/reports` | Filterable reports + CSV export server-side with permission scope and row limits |
| `/settings` | Profile, targets, alert config, loss reasons (admin full edit) |

UX: sober industrial SaaS (light gray bg, deep blue primary, green positive, amber attention, red risk only). Desktop sidebar; mobile nav. Loading / empty / error states. BRL + pt-BR dates. Accessibility: labels, focus, keyboard on primary flows.

## 9. Seed

- Deterministic faker `pt_BR` + fixed seed constant  
- Volumes per prompt (1 org, 3 users, 5 territories, 12 families, 150 products, 350 customers, 600 contacts, 2500 orders / 5000 items over 24 months, 350 quotes, 250 opportunities, 700 activities, targets 12+3 months)  
- If Turso free tier or local runtime limits hit, seed runs in **batched scripts** with the same totals as the target; document batch commands in README  
- Documented showcase scenarios: strategic customer at risk; important opp without follow-up; quote below margin target; high-probability win  

## 10. Environment and deploy

`.env.example`:

```env
TURSO_DATABASE_URL=
TURSO_AUTH_TOKEN=
AUTH_SECRET=
CRON_SECRET=
DEMO_PROFILE_SWITCHER=true
```

- Vercel + Turso production  
- Missing env: clear startup/UI guidance; no silent fake data in production  
- README: install, Turso setup, migrate, seed, test, deploy checklist, demo credentials, limitations  

## 11. Autonomous delivery (Ralph + Superpowers)

Human touchpoints: (1) this design approved, (2) implementation plan approved once, (3) provide Turso tokens when needed, (4) optional “run the loop”.

**Phase PRDs** (each → `tasks/prd-pN-*.md` → `scripts/ralph/prd.json`; agent chains to next when phase COMPLETE):

| Phase | Focus |
|-------|--------|
| P0 | Next.js scaffold, Auth.js, Drizzle/Turso schema core, shell layout, minimal seed, login |
| P1 | Customers list + 360° + notes/contacts + activity create |
| P2 | Pipeline kanban/table + opportunity detail + stage transitions |
| P3 | Executive dashboard + filters |
| P4 | Quotes, orders, products |
| P5 | Insights + scoring engine + alerts + recalculate/cron |
| P6 | Reports CSV + settings |
| P7 | Hardening: seller margin denial, Playwright path, lint/typecheck green, polish |
| P8 | Optional `ml/` offline training + import path |

Story sizing: one context window each (e.g. “add customers table migration”, not “build CRM”). Orchestrator: `.cursor/agents/ralph-superpowers.md`. Progress: `scripts/ralph/progress.txt`. Patterns: `AGENTS.md`.

## 12. Out of scope

- Real ERP/CRM integrations  
- Real payments or fiscal documents  
- Real company/person data or third-party logos  
- LLM APIs for scoring  
- Supabase  

## 13. Risks and mitigations

| Risk | Mitigation |
|------|------------|
| Large seed vs free Turso | Batched seed; indexes; document limits |
| Auth.js + credentials demo security | Strong `AUTH_SECRET`; demo-only users; no privilege switch in prod without flag |
| Scope creep across phases | Strict PRD `passes` gates; no story larger than one iteration |
| Prompt said Supabase | Documented deviation in README + this spec |

## 14. Acceptance mapping

Maps 1:1 to prompt “Critérios de aceite”, substituting Turso/Auth.js for Supabase/RLS and verifying seller cannot read cost/margin via server enforcement tests.
