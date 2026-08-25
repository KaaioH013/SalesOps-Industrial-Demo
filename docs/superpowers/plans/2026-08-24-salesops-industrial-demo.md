# SalesOps Industrial Demo Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.
>
> **Autonomous mode (preferred for this project):** Use subagent `.cursor/agents/ralph-superpowers.md` with `scripts/ralph/prd.json`. After each phase COMPLETE, load the next file from `tasks/prd-queue.md` into `scripts/ralph/prd.json` and continue without asking the human.

**Goal:** Build the full SalesOps Industrial Demo portfolio app (synthetic B2B industrial Sales Ops) deployable on Vercel with Turso + Auth.js.

**Architecture:** Next.js App Router; domain rules as pure functions in `lib/analytics`; data access in `db/queries` with org/role filters; Auth.js credentials; Drizzle on Turso/libSQL; phased PRDs P0–P8 executed by Ralph loop.

**Tech Stack:** Next.js, TypeScript strict, Tailwind, shadcn/ui, Drizzle, Turso, Auth.js v5, Zod, RHF, TanStack Table, Recharts, Vitest, Playwright, date-fns, Lucide.

## Global Constraints

- Spec: `docs/superpowers/specs/2026-08-24-salesops-industrial-demo-design.md`
- Brief: `prompt-cursor-salesops-industrial-demo.md`
- **No Supabase** — Turso + Auth.js only
- Locale: BRL currency, pt-BR dates, UI copy in Portuguese (Brazil)
- Badge always visible: `Dados demonstrativos e sintéticos`
- No `any`; no secrets in repo; no real companies/people/brands
- Seller must never receive cost / detailed margin fields from server
- Commits: `feat: [Story ID] - [Story Title]` when committing is allowed
- Quality gate per story: `npm run lint`, `npm run typecheck`, relevant tests
- Env: `TURSO_DATABASE_URL`, `TURSO_AUTH_TOKEN`, `AUTH_SECRET`, `CRON_SECRET`, `DEMO_PROFILE_SWITCHER`

---

## File Structure (target)

| Path | Responsibility |
|------|----------------|
| `app/(auth)/login/page.tsx` | Login UI |
| `app/(dashboard)/layout.tsx` | Shell: sidebar, header, badge |
| `app/(dashboard)/dashboard/page.tsx` | Executive dashboard |
| `app/(dashboard)/customers/**` | List + 360° |
| `app/(dashboard)/pipeline/page.tsx` | Kanban + table |
| `app/(dashboard)/opportunities/[id]/page.tsx` | Opportunity detail |
| `app/(dashboard)/quotes/**` | Quotes |
| `app/(dashboard)/orders/**` | Orders |
| `app/(dashboard)/products/**` | Catalog |
| `app/(dashboard)/insights/page.tsx` | Intelligence hub |
| `app/(dashboard)/reports/page.tsx` | Reports + CSV |
| `app/(dashboard)/settings/page.tsx` | Settings |
| `app/api/auth/[...nextauth]/route.ts` | Auth.js route |
| `app/api/cron/recalculate-scores/route.ts` | Cron with `CRON_SECRET` |
| `lib/auth/auth.ts` | Auth.js config + helpers |
| `lib/permissions/roles.ts` | Role checks |
| `lib/formatters/*` | BRL, dates, % |
| `lib/analytics/*` | margin, pipeline, scores, alerts, RFM, forecast |
| `lib/validations/*` | Zod schemas |
| `db/schema/*.ts` | Drizzle tables |
| `db/client.ts` | Turso client |
| `db/queries/*.ts` | Permission-aware queries |
| `db/seed/*.ts` | Deterministic seed |
| `db/migrations/` | SQL migrations |
| `features/**` | Feature modules (actions, UI hooks) |
| `components/ui/*` | shadcn |
| `components/layout/*` | Sidebar, header, badge |
| `ml/` | Optional offline Python |
| `tests/unit/**` | Vitest |
| `tests/e2e/**` | Playwright |
| `tasks/prd-queue.md` | Phase queue for Ralph |
| `scripts/ralph/prd.json` | Active phase stories |

---

## Phase queue (autonomous chaining)

Order locked:

1. P0 Foundations — `tasks/prd-p0-foundations.json`
2. P1 Customers — `tasks/prd-p1-customers.json`
3. P2 Pipeline — `tasks/prd-p2-pipeline.json`
4. P3 Dashboard — `tasks/prd-p3-dashboard.json`
5. P4 Quotes/Orders/Products — `tasks/prd-p4-commerce.json`
6. P5 Insights/Scoring — `tasks/prd-p5-insights.json`
7. P6 Reports/Settings — `tasks/prd-p6-reports-settings.json`
8. P7 Hardening — `tasks/prd-p7-hardening.json`
9. P8 ML optional — `tasks/prd-p8-ml.json`

On phase COMPLETE: copy next JSON → `scripts/ralph/prd.json`, reset `progress.txt` Codebase Patterns keep, checkout/create `branchName`, continue.

---

## Task 1: Scaffold Next.js + tooling (P0)

**Files:**
- Create: `package.json`, `tsconfig.json`, `next.config.ts`, `postcss.config.mjs`, `eslint.config.mjs`, `.prettierrc`, `vitest.config.ts`, `playwright.config.ts`, `.env.example`, `README.md`
- Create: `app/layout.tsx`, `app/page.tsx` (redirect to `/dashboard` or `/login`)
- Create: `app/globals.css`

**Interfaces:**
- Produces: scripts `dev`, `build`, `lint`, `typecheck`, `test`, `test:e2e`, `db:generate`, `db:migrate`, `db:seed`

- [ ] **Step 1: Create Next.js app with TypeScript, Tailwind, App Router in repo root** (not nested folder)

Run: `npx create-next-app@latest . --typescript --tailwind --eslint --app --src-dir=false --import-alias "@/*" --turbopack --yes`
Expected: project files at repo root; keep existing `docs/`, `scripts/`, `.cursor/`

- [ ] **Step 2: Add dependencies**

```bash
npm i drizzle-orm @libsql/client next-auth@beta bcryptjs zod react-hook-form @hookform/resolvers @tanstack/react-table recharts lucide-react date-fns class-variance-authority clsx tailwind-merge
npm i -D drizzle-kit vitest @vitejs/plugin-react jsdom @types/bcryptjs prettier eslint-config-prettier @playwright/testtsx
```

- [ ] **Step 3: Wire scripts in package.json**

```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "typecheck": "tsc --noEmit",
    "test": "vitest run",
    "test:watch": "vitest",
    "test:e2e": "playwright test",
    "db:generate": "drizzle-kit generate",
    "db:migrate": "tsx db/migrate.ts",
    "db:seed": "tsx db/seed/index.ts"
  }
}
```

- [ ] **Step 4: Write `.env.example`**

```env
TURSO_DATABASE_URL=
TURSO_AUTH_TOKEN=
AUTH_SECRET=
CRON_SECRET=
DEMO_PROFILE_SWITCHER=true
```

- [ ] **Step 5: Commit**

```bash
git add -A && git commit -m "feat: P0-US-001 - scaffold Next.js tooling"
```

---

## Task 2: Pure domain — margin + pipeline (TDD)

**Files:**
- Create: `lib/analytics/margin.ts`
- Create: `lib/analytics/pipeline.ts`
- Create: `tests/unit/analytics/margin.test.ts`
- Create: `tests/unit/analytics/pipeline.test.ts`

**Interfaces:**
- Produces:
  - `grossMargin(revenue: number, cost: number): number | null` — null if revenue === 0
  - `weightedPipelineValue(estimatedValue: number, probability: number): number` — probability 0–1

- [ ] **Step 1: Write failing tests**

```ts
import { describe, it, expect } from "vitest";
import { grossMargin } from "@/lib/analytics/margin";
import { weightedPipelineValue } from "@/lib/analytics/pipeline";

describe("grossMargin", () => {
  it("computes (revenue-cost)/revenue", () => {
    expect(grossMargin(100, 60)).toBeCloseTo(0.4);
  });
  it("returns null when revenue is 0", () => {
    expect(grossMargin(0, 10)).toBeNull();
  });
});

describe("weightedPipelineValue", () => {
  it("multiplies value by probability", () => {
    expect(weightedPipelineValue(10000, 0.25)).toBe(2500);
  });
});
```

- [ ] **Step 2: Run tests — expect FAIL**

Run: `npm run test -- tests/unit/analytics/margin.test.ts tests/unit/analytics/pipeline.test.ts`
Expected: FAIL module not found

- [ ] **Step 3: Implement**

```ts
// lib/analytics/margin.ts
export function grossMargin(revenue: number, cost: number): number | null {
  if (revenue === 0) return null;
  return (revenue - cost) / revenue;
}

// lib/analytics/pipeline.ts
export function weightedPipelineValue(
  estimatedValue: number,
  probability: number,
): number {
  return estimatedValue * probability;
}
```

- [ ] **Step 4: Run tests — expect PASS**

- [ ] **Step 5: Commit** `feat: P0-US-002 - margin and pipeline pure functions`

---

## Task 3: Formatters BRL / pt-BR

**Files:**
- Create: `lib/formatters/currency.ts`, `lib/formatters/date.ts`, `lib/formatters/percent.ts`
- Create: `tests/unit/formatters/formatters.test.ts`

**Interfaces:**
- Produces: `formatBRL(n: number): string`, `formatDatePtBR(d: Date | string): string`, `formatPercent(n: number, digits?: number): string`

- [ ] **Step 1: Failing tests** using `pt-BR` expectations (e.g. `R$` prefix, `dd/MM/yyyy`)
- [ ] **Step 2: Implement with `Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })` and `date-fns` `format` with `ptBR` locale
- [ ] **Step 3: Tests PASS + commit** `feat: P0-US-003 - pt-BR formatters`

---

## Task 4: Drizzle schema — org, profiles, core enums

**Files:**
- Create: `db/client.ts`, `db/schema/organizations.ts`, `db/schema/profiles.ts`, `db/schema/enums.ts`, `db/schema/index.ts`
- Create: `drizzle.config.ts`, `db/migrate.ts`

**Interfaces:**
- Produces: tables `organizations`, `profiles` with `role: 'admin'|'manager'|'seller'`, `organizationId`, password hash field
- Produces: `getDb()` returning Drizzle client for Turso

- [ ] **Step 1: `db/client.ts`**

```ts
import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import * as schema from "./schema";

export function getDb() {
  const url = process.env.TURSO_DATABASE_URL;
  if (!url) throw new Error("TURSO_DATABASE_URL is required");
  const client = createClient({
    url,
    authToken: process.env.TURSO_AUTH_TOKEN,
  });
  return drizzle(client, { schema });
}
```

- [ ] **Step 2: Define organizations + profiles schemas with timestamps and indexes**
- [ ] **Step 3: `drizzle-kit generate` + migrate script**
- [ ] **Step 4: Document local Turso / `libsql` file URL for dev in README** (e.g. `file:./local.db` for early local if needed; production Turso)
- [ ] **Step 5: Commit** `feat: P0-US-004 - organizations and profiles schema`

---

## Task 5: Auth.js credentials + login page

**Files:**
- Create: `lib/auth/auth.ts`, `lib/auth/password.ts`, `app/api/auth/[...nextauth]/route.ts`
- Create: `app/(auth)/login/page.tsx`, `app/(auth)/layout.tsx`
- Create: `middleware.ts` protecting `(dashboard)` routes
- Create: `lib/permissions/roles.ts`

**Interfaces:**
- Produces: session `{ user: { id, email, name, role, organizationId } }`
- Produces: `requireSession()`, `requireRole(...roles)`, `canViewMargin(role)`, `canEditOpportunity(role)`
- Consumes: `profiles` table + bcrypt verify

- [ ] **Step 1: Unit test permission helpers** (`seller` cannot view margin; `admin` can)
- [ ] **Step 2: Implement `lib/permissions/roles.ts`**
- [ ] **Step 3: Auth.js Credentials provider querying profiles by email**
- [ ] **Step 4: Login form (RHF+Zod) posting to Auth.js**
- [ ] **Step 5: Middleware redirects unauthenticated users to `/login`**
- [ ] **Step 6: Commit** `feat: P0-US-005 - Auth.js login and RBAC helpers`

---

## Task 6: App shell + synthetic badge

**Files:**
- Create: `components/layout/app-sidebar.tsx`, `components/layout/app-header.tsx`, `components/layout/synthetic-badge.tsx`
- Create: `app/(dashboard)/layout.tsx`
- Create: `app/(dashboard)/dashboard/page.tsx` (placeholder cards with empty states until P3)

**Interfaces:**
- Produces: nav links for all future routes (pages may 404 until later phases — use stub pages with empty state “Em construção de dados” only if route exists; prefer stub RSC pages that render empty states, never dead buttons)

- [ ] **Step 1: Stub all dashboard routes with empty-state component** so navigation never 404s
- [ ] **Step 2: Sidebar desktop + mobile sheet; header with period placeholder + user name**
- [ ] **Step 3: Synthetic badge in layout**
- [ ] **Step 4: Commit** `feat: P0-US-006 - dashboard shell and routes stubs`

---

## Task 7: Remaining core schema (customers → alerts)

**Files:**
- Create: `db/schema/territories.ts`, `customers.ts`, `contacts.ts`, `products.ts`, `commerce.ts`, `crm.ts`, `intelligence.ts`, `audit.ts`
- Modify: `db/schema/index.ts`

**Interfaces:**
- Produces: all tables from design §6 with `organization_id`, timestamps, indexes

- [ ] **Step 1: Add schema modules matching design entities and opportunity stages enum**
- [ ] **Step 2: Generate migration**
- [ ] **Step 3: Commit** `feat: P0-US-007 - full business schema`

---

## Task 8: Minimal seed (3 users + 1 org + sample rows)

**Files:**
- Create: `db/seed/index.ts`, `db/seed/constants.ts` (`SEED = 42`), `db/seed/demo-users.ts`

**Interfaces:**
- Produces: deterministic users:
  - `admin@demo.local` / `DemoAdmin!123`
  - `manager@demo.local` / `DemoManager!123`
  - `seller@demo.local` / `DemoSeller!123`
- Produces: at least 1 territory, 5 customers, 10 products, 5 opportunities (full volume in later seed task P0-US-009 / P7)

- [ ] **Step 1: Seed script upserts org + users with bcrypt hashes**
- [ ] **Step 2: README documents credentials**
- [ ] **Step 3: Run migrate + seed against Turso (or file libsql)**
- [ ] **Step 4: Commit** `feat: P0-US-008 - minimal demo seed`

---

## Task 9: Full volume seed (batched)

**Files:**
- Create: `db/seed/full/*.ts` (customers, orders, opportunities, activities, targets)
- Modify: `db/seed/index.ts` to accept `--full` flag

**Interfaces:**
- Produces: volumes from design §9; batched inserts (e.g. 500 rows/batch); showcase scenario IDs logged

- [ ] **Step 1: Implement deterministic generators with fixed seed**
- [ ] **Step 2: Batched insert + progress logs**
- [ ] **Step 3: Document `npm run db:seed -- --full` in README**
- [ ] **Step 4: Commit** `feat: P0-US-009 - full deterministic seed`

---

## Task 10: P1 Customers list + 360°

**Files:**
- Create: `db/queries/customers.ts`, `features/customers/actions.ts`, `features/customers/customer-table.tsx`, `features/customers/customer-detail.tsx`
- Modify: `app/(dashboard)/customers/page.tsx`, `app/(dashboard)/customers/[id]/page.tsx`

**Interfaces:**
- Consumes: session role; `canViewMargin`
- Produces: `listCustomers(filters)`, `getCustomer360(id)`, `createActivity`, `createOpportunity` server actions

- [ ] **Step 1: Query layer filters by org; seller filtered by `owner_id`**
- [ ] **Step 2: TanStack Table list with search/filter/pagination/column visibility**
- [ ] **Step 3: 360° sections: summary, contacts, orders/quotes/opps/activities stubs if empty, score placeholder**
- [ ] **Step 4: Forms to create activity + opportunity (Zod)**
- [ ] **Step 5: lint/typecheck/tests + commit stories as separate commits if split in prd.json

---

## Task 11: P2 Pipeline + opportunity detail

**Files:**
- Create: `db/queries/opportunities.ts`, `features/pipeline/*`, `features/opportunities/*`
- Modify: pipeline + opportunity pages

**Interfaces:**
- Produces: `moveOpportunityStage(id, stage, lossReason?)` — requires reason for Perdido; confirm Ganho/Perdido
- Produces: computed `weightedValue`, `daysInStage`, `daysSinceActivity`, `stalenessRisk`

- [ ] **Step 1: Unit tests for staleness thresholds 14/30 days**
- [ ] **Step 2: Kanban + table + side panel**
- [ ] **Step 3: Detail page timeline + risk explanation**
- [ ] **Step 4: Commit per prd stories**

---

## Task 12: P3 Dashboard

**Files:**
- Create: `db/queries/dashboard.ts`, `features/dashboard/*`, `lib/analytics/rfm.ts` (if not yet)
- Modify: `app/(dashboard)/dashboard/page.tsx`

**Interfaces:**
- Produces: metrics DTOs for revenue vs target, margin vs target, pipeline weighted, conversion, new customers, risk/repurchase counts, monthly series, funnel, rankings, Pareto, alerts, recommended actions

- [ ] **Step 1: Server-side aggregations with period/territory/segment/seller filters**
- [ ] **Step 2: Recharts + cards with loading/empty/error**
- [ ] **Step 3: Short pt-BR helper copy per widget answering a commercial question**
- [ ] **Step 4: Commit**

---

## Task 13: P4 Quotes, orders, products

**Files:**
- Create: `db/queries/quotes.ts`, `orders.ts`, `products.ts`, `features/quotes|orders|products/*`
- Modify: respective app routes

**Interfaces:**
- Produces: quote totals + margin via `grossMargin`; flag below family target; strip cost for seller

- [ ] **Step 1: Tables + detail pages**
- [ ] **Step 2: Seller field stripping tests**
- [ ] **Step 3: Commit**

---

## Task 14: P5 Insights + scoring + cron

**Files:**
- Create: `lib/analytics/scoring.ts`, `lib/analytics/alerts.ts`, `lib/analytics/forecast.ts`, `lib/analytics/repurchase.ts`
- Create: `tests/unit/analytics/*.test.ts`
- Create: `features/insights/*`, `app/api/cron/recalculate-scores/route.ts`
- Create: `features/scoring/recalculate.ts` Server Action

**Interfaces:**
- Produces: `computePriorityScore(input): { score: number; factors: { key: string; weight: number; contribution: number }[] }`
- Produces: weights in `lib/analytics/score-weights.ts`
- Produces: cron `Authorization: Bearer CRON_SECRET` only

- [ ] **Step 1: TDD all scoring/alert/forecast pure functions**
- [ ] **Step 2: Persist into `customer_scores` / `alerts` / `forecast_snapshots`**
- [ ] **Step 3: Insights page four blocks with explanations + CTAs**
- [ ] **Step 4: Commit**

---

## Task 15: P6 Reports + settings

**Files:**
- Create: `features/reports/*`, `app/api/reports/export/route.ts`, `features/settings/*`

**Interfaces:**
- Produces: CSV export with role scope + max rows (e.g. 5000); settings for targets, loss reasons, alert thresholds (admin)

- [ ] **Step 1: Reports UI + server export**
- [ ] **Step 2: Settings forms with permission gates**
- [ ] **Step 3: Commit**

---

## Task 16: P7 Hardening

**Files:**
- Create: `tests/e2e/critical-path.spec.ts`
- Modify: README deploy checklist; audit logging on mutations

**Interfaces:**
- Produces: Playwright flow login admin → dashboard → customer → create activity
- Produces: automated test that seller API/action cannot read cost

- [ ] **Step 1: Playwright critical path**
- [ ] **Step 2: Seller margin denial test**
- [ ] **Step 3: `npm run lint && npm run typecheck && npm run test && npm run test:e2e`**
- [ ] **Step 4: README complete (Turso, env, seed, deploy, credentials, limitations)**
- [ ] **Step 5: Commit**

---

## Task 17: P8 Optional ML offline

**Files:**
- Create: `ml/README.md`, `ml/train_repurchase.py`, `ml/requirements.txt`, `ml/export_scores.json` sample path
- Create: `db/seed/import-ml-scores.ts`

**Interfaces:**
- Produces: offline script writing JSON importable to `customer_scores`; app never invokes Python at runtime

- [ ] **Step 1: Train/export script with time-based split + metrics log**
- [ ] **Step 2: Import script**
- [ ] **Step 3: Commit**

---

## Spec coverage checklist

| Spec area | Tasks |
|-----------|-------|
| Stack Turso/Auth.js | 1, 4, 5 |
| Domain schema + seed | 7, 8, 9 |
| Margin/pipeline/scores/alerts | 2, 14 |
| Formatters / UX shell | 3, 6 |
| Customers | 10 |
| Pipeline/opportunities | 11 |
| Dashboard | 12 |
| Quotes/orders/products | 13 |
| Insights/cron | 14 |
| Reports/settings | 15 |
| Acceptance/Playwright/RBAC | 16 |
| ML optional | 17 |
| Synthetic badge | 6 |
| No Supabase | Global + 4, 5 |

---

## Execution Handoff

Plan saved to `docs/superpowers/plans/2026-08-24-salesops-industrial-demo.md`.

Active Ralph PRD for P0: `scripts/ralph/prd.json` (generated alongside this plan).  
Queue: `tasks/prd-queue.md` + `tasks/prd-pN-*.json`.

**Two execution options:**

**1. Subagent-Driven / Ralph (recommended)** — Invoke `ralph-superpowers` and run until COMPLETE, auto-chain phases from the queue. Minimal human interruption (only env secrets).

**2. Inline Execution** — `executing-plans` in this session with checkpoints.

Which approach?
