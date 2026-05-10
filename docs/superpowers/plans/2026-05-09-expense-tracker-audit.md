# Expense Tracker Audit Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Audit the current React expense tracker, repair verified breakages, add a regression test suite, and confirm the app is deployable on Vercel within the assignment scope.

**Architecture:** Keep the existing Vite + React app structure, but tighten the implementation around the assignment requirements. Add a small Vitest + Testing Library harness for user-facing behavior, correct the Frankfurter v2 integration to match the current public API, and simplify state patterns that currently fail lint or risk runtime regressions.

**Tech Stack:** React 19, Vite 8, Vitest, Testing Library, jsdom, Frankfurter v2 API

---

### Task 1: Establish Verified Baseline

**Files:**
- Create: `docs/superpowers/plans/2026-05-09-expense-tracker-audit.md`
- Modify: none
- Test: none

- [ ] **Step 1: Capture the current failure state**

Run:

```bash
npm run lint
npm run build
curl -s 'https://api.frankfurter.dev/v2/rates?base=USD&quotes=EUR,GBP,INR'
curl -si 'https://api.frankfurter.dev/v2/latest?from=USD'
```

Expected:
- `lint` fails in `Aurora.jsx`, `BudgetPlanner.jsx`, `CurrencyConverter.jsx`, and `TextType.jsx`
- `build` succeeds with a chunk-size warning
- Frankfurter v2 `rates` returns an array payload
- Frankfurter `v2/latest?from=USD` returns `404`

### Task 2: Add Test Harness

**Files:**
- Modify: `package.json`, `vite.config.js`
- Create: `src/test/setup.js`
- Test: `npm run test -- --run`

- [ ] **Step 1: Add failing test tooling dependencies**

Add:
- `vitest`
- `jsdom`
- `@testing-library/react`
- `@testing-library/jest-dom`
- `@testing-library/user-event`

- [ ] **Step 2: Add test scripts and Vite test configuration**

Required scripts:

```json
{
  "test": "vitest",
  "test:run": "vitest --run"
}
```

Required Vite test config:

```js
test: {
  environment: 'jsdom',
  setupFiles: './src/test/setup.js',
}
```

- [ ] **Step 3: Add shared DOM test setup**

Create setup utilities for:
- `@testing-library/jest-dom`
- `matchMedia`
- `ResizeObserver`
- `requestAnimationFrame`
- `cancelAnimationFrame`
- localStorage cleanup between tests

### Task 3: Write Failing Regression Tests

**Files:**
- Create: `src/App.test.jsx`, `src/components/CurrencyConverter.test.jsx`
- Test: `npm run test:run`

- [ ] **Step 1: Write app behavior tests before implementation**

Cover:
- initial empty state
- adding an expense updates total, transaction count, and category breakdown
- removing an expense updates the rendered list and totals
- filtering by search text limits visible expenses

- [ ] **Step 2: Write converter tests before implementation**

Cover:
- loading state while rates are in flight
- successful Frankfurter v2 response renders the converted amount
- failed fetch renders a graceful error state and a retry control

- [ ] **Step 3: Run the tests and confirm red**

Run:

```bash
npm run test:run
```

Expected:
- tests fail because the current converter still assumes the old API shape and the app is not fully aligned with the requirements

### Task 4: Fix Verified Root Causes

**Files:**
- Modify: `src/App.jsx`, `src/components/CurrencyConverter.jsx`, `src/components/SummaryPanel.jsx`, `src/components/BudgetPlanner.jsx`, `src/components/TextType.jsx`, `src/components/ExpenseForm.jsx`, `src/components/ExpenseCard.jsx`, `src/components/Aurora.jsx`
- Test: `src/App.test.jsx`, `src/components/CurrencyConverter.test.jsx`

- [ ] **Step 1: Correct date handling and category coverage in app state**

Implement:
- local date helpers instead of UTC-sensitive `new Date('YYYY-MM-DD')`
- category options that include the assignment examples, especially `Marketing` and `Utilities`
- a complete category breakdown instead of truncating the rendered totals

- [ ] **Step 2: Correct Frankfurter integration against the live v2 docs**

Implement:
- `GET /v2/rates?base=USD&quotes=...`
- `GET /v2/currencies`
- array response parsing for both rates and currencies
- stable fallback target currency selection without effect-driven render churn

- [ ] **Step 3: Remove the lint violations at their source**

Implement:
- no ref mutation during render in `Aurora.jsx`
- no effect-driven prop-to-state mirroring in `BudgetPlanner.jsx`
- no effect-driven target-currency correction in `CurrencyConverter.jsx`
- no ref-on-dynamic-component pattern in `TextType.jsx`

- [ ] **Step 4: Keep code changes scoped**

Do not:
- introduce new product features outside the assignment
- add third-party state management
- restructure the entire app unnecessarily

### Task 5: Verify End-to-End

**Files:**
- Modify: `README.md` only if current instructions are misleading for setup/testing
- Test: `npm run lint`, `npm run test:run`, `npm run build`

- [ ] **Step 1: Run the full verification suite**

Run:

```bash
npm run lint
npm run test:run
npm run build
```

Expected:
- lint exit code `0`
- tests pass
- production build succeeds

- [ ] **Step 2: Verify browser behavior manually**

Check:
- desktop render at `1600x900`
- mobile render at `414x749`
- add expense flow
- remove expense flow
- converter success state
- converter error handling with mocked/failed fetch only in automated tests

- [ ] **Step 3: Record final audit notes**

Report:
- what was broken
- what was fixed
- what was verified
- any residual non-blocking risks, if evidence supports them
