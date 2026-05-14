# Design Document — Expense & Budget Visualizer

## Overview

The Expense & Budget Visualizer is a zero-dependency, client-side web application delivered as three static files: `index.html`, `style.css`, and `app.js`. It lets users record personal expenses, review a scrollable transaction history, monitor a running total balance, and understand their spending distribution through a live pie chart — all without a server or build step.

All state is held in a single in-memory JavaScript array that is the authoritative source of truth for the current session. Every mutation (add / delete) immediately serialises that array to `localStorage` and then re-renders the affected UI regions. Chart.js (loaded via CDN) handles the pie chart; everything else is plain DOM manipulation.

### Key Design Decisions

| Decision | Rationale |
|---|---|
| Single in-memory array as source of truth | Keeps rendering deterministic; no partial-state bugs |
| Re-render full list on every mutation | Simple and correct; list is bounded in practice |
| Chart.js via CDN | Avoids writing a canvas renderer; one permitted external dependency |
| IIFE / `type="module"` scope | Prevents global namespace pollution per coding conventions |
| `try/catch` around every `localStorage` call | Surfaces storage errors as inline UI messages, never `alert()` |
| Timestamp-based IDs | No UUID library needed; sufficient uniqueness for a single-user local app |

---

## Architecture

The application follows a unidirectional data flow:

```
User Action
    │
    ▼
Event Handler  ──► Validation
    │                  │ (error) ──► Render inline errors
    │ (valid)
    ▼
Mutate State (in-memory array)
    │
    ▼
Storage Helper (localStorage write)
    │
    ▼
Render Functions
  ├── renderList()
  ├── renderBalance()
  └── renderChart()
```

On page load the flow is:

```
DOMContentLoaded
    │
    ▼
loadTransactions()  ──► (parse error) ──► show warning, use []
    │
    ▼
Populate in-memory state
    │
    ▼
renderList() + renderBalance() + renderChart()
```

There are no asynchronous operations; every path is synchronous, which keeps the mental model simple and avoids race conditions.

---

## Components and Interfaces

### HTML Structure (`index.html`)

```
<body>
  <main>
    <section id="balance-section">   <!-- Balance display -->
    <section id="form-section">      <!-- Input_Form -->
      <form id="transaction-form">
        <input  id="input-name"     type="text">
        <input  id="input-amount"   type="number">
        <select id="input-category">
        <button type="submit">
        <!-- per-field error spans injected here by JS -->
      </form>
    </section>
    <section id="chart-section">     <!-- Pie chart -->
      <canvas id="spending-chart">
    </section>
    <section id="list-section">      <!-- Transaction_List -->
      <ul id="transaction-list">
    </section>
  </main>
  <!-- global error/warning banner -->
  <div id="global-message" aria-live="polite">
</body>
```

### JavaScript Modules (`app.js`)

The file is wrapped in a `type="module"` script (or IIFE) and organised into seven sections:

#### 1. Constants
```js
const STORAGE_KEY = 'expense_transactions';
const CATEGORIES  = ['Food', 'Transport', 'Fun'];
const AMOUNT_MIN  = 0.01;
const AMOUNT_MAX  = 999_999_999.99;
const NAME_MAX    = 250;
const CATEGORY_COLORS = {
  Food:      '#FF6384',
  Transport: '#36A2EB',
  Fun:       '#FFCE56',
};
```

#### 2. State
```js
let transactions = [];   // single source of truth
let chartInstance = null; // Chart.js instance reference
```

#### 3. Storage Helpers

| Function | Signature | Behaviour |
|---|---|---|
| `loadTransactions` | `() → Transaction[]` | Reads & parses `localStorage`; returns `[]` on any error and shows a warning banner |
| `saveTransactions` | `(list: Transaction[]) → boolean` | Serialises & writes; returns `false` and shows inline error on failure |

#### 4. Validation

| Function | Signature | Behaviour |
|---|---|---|
| `validateForm` | `(name, amount, category) → { field: string, message: string }[]` | Returns an array of per-field error objects; empty array means valid |

Validation rules:
- `name`: non-empty after `.trim()`, ≤ 250 characters
- `amount`: parseable as a finite number, in range [0.01, 999,999,999.99]
- `category`: one of `CATEGORIES`

#### 5. Rendering

| Function | Signature | Behaviour |
|---|---|---|
| `renderList` | `(list: Transaction[]) → void` | Clears `#transaction-list` and rebuilds it newest-first; shows empty-state message when `list` is empty |
| `renderBalance` | `(list: Transaction[]) → void` | Sums amounts, floors at 0, formats to 2 d.p., writes to `#balance-display` |
| `renderChart` | `(list: Transaction[]) → void` | Aggregates amounts by category; destroys and recreates Chart.js instance; shows placeholder when `list` is empty |
| `showFieldErrors` | `(errors: {field, message}[]) → void` | Injects `<span class="field-error">` beneath each named field |
| `clearFieldErrors` | `() → void` | Removes all `.field-error` spans |
| `showGlobalMessage` | `(msg: string, type: 'error'\|'warning', duration?: number) → void` | Populates `#global-message`; auto-clears after `duration` ms if provided |

#### 6. Event Handlers

| Handler | Trigger | Actions |
|---|---|---|
| `handleFormSubmit` | `#transaction-form` submit | Validate → show errors or add transaction → save → render |
| `handleDeleteClick` | click on `.delete-btn` inside `#transaction-list` | Remove by id → save → render; restore on save failure |

#### 7. Init
```js
document.addEventListener('DOMContentLoaded', () => {
  transactions = loadTransactions();
  renderList(transactions);
  renderBalance(transactions);
  renderChart(transactions);
  document.getElementById('transaction-form')
    .addEventListener('submit', handleFormSubmit);
  document.getElementById('transaction-list')
    .addEventListener('click', handleDeleteClick);
});
```

### CSS Architecture (`style.css`)

- CSS custom properties defined on `:root` for all colours and spacing
- Mobile-first layout; single breakpoint at `min-width: 600px` switches to two-column
- Focus styles: `outline: 2px solid var(--focus-color)` — never suppressed
- `.field-error` class: red inline text beneath each form field
- `#global-message`: fixed-position non-blocking banner at top of viewport

---

## Data Models

### Transaction Object

```ts
interface Transaction {
  id:       string;    // Date.now().toString() — unique per session
  name:     string;    // 1–250 characters, trimmed
  amount:   number;    // float, 0.01–999,999,999.99
  category: 'Food' | 'Transport' | 'Fun';
}
```

### localStorage Schema

```
Key:   "expense_transactions"
Value: JSON.stringify(Transaction[])
```

Example:
```json
[
  { "id": "1715000000001", "name": "Coffee", "amount": 4.50, "category": "Food" },
  { "id": "1715000000000", "name": "Bus pass", "amount": 30.00, "category": "Transport" }
]
```

### Validation Error Object

```ts
interface FieldError {
  field:   'name' | 'amount' | 'category';
  message: string;
}
```

### Chart Data Shape (passed to Chart.js)

```ts
interface ChartData {
  labels:   string[];   // active category names
  datasets: [{
    data:            number[];  // summed amounts per category
    backgroundColor: string[];  // matching CATEGORY_COLORS values
  }];
}
```

---

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system — essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Serialization Round-Trip Preserves All Fields

*For any* valid transaction list (where each entry has a non-empty string name, a positive numeric amount in range, and a valid category), serializing the list to JSON and then deserializing it SHALL produce a list where each entry's `name`, `amount`, and `category` are strictly equal to those of the original entry.

**Validates: Requirements 5.3, 5.5**

---

### Property 2: Validation Rejects All Whitespace-Only Names

*For any* string composed entirely of whitespace characters (spaces, tabs, newlines), submitting it as the transaction name SHALL be rejected by the Validator, and the transaction list SHALL remain unchanged.

**Validates: Requirements 1.3**

---

### Property 3: Validation Rejects Invalid Amounts

*For any* value that is less than 0.01, greater than 999,999,999.99, non-numeric, zero, or negative, the Validator SHALL reject it and prevent the transaction from being added to the list; conversely, *for any* value in the range [0.01, 999,999,999.99], the Validator SHALL accept it.

**Validates: Requirements 1.5, 1.6**

---

### Property 4: Balance Is Always a Non-Negative Number Formatted to Two Decimal Places

*For any* transaction list (including the empty list), the computed and displayed balance SHALL be `max(0, sum of all amounts)` formatted to exactly two decimal places with no currency symbol and no sign prefix.

**Validates: Requirements 3.1, 3.4, 3.5, 3.6**

---

### Property 5: Adding a Valid Transaction Grows the List by Exactly One and Persists It

*For any* transaction list and any valid transaction, adding that transaction SHALL result in the in-memory list length increasing by exactly one, the new entry appearing at index 0, and `localStorage` under the fixed key containing the updated list including the new entry.

**Validates: Requirements 1.2, 2.3, 5.1**

---

### Property 6: Deleting a Transaction Removes Exactly That Entry from State and Storage

*For any* transaction list containing a transaction with a given `id`, deleting by that `id` SHALL produce an in-memory list that no longer contains any entry with that `id`, all other entries SHALL remain unchanged, and `localStorage` SHALL reflect the same removal.

**Validates: Requirements 2.5, 2.6, 5.2**

---

### Property 7: Chart Category Percentages Sum to 100%

*For any* non-empty transaction list, the sum of all category percentages computed for the chart legend SHALL equal 100% (within floating-point rounding tolerance of ±0.1%), and each percentage SHALL be proportional to that category's share of the total spending.

**Validates: Requirements 4.1, 4.7**

---

### Property 8: Zero-Amount Categories Are Excluded from the Chart

*For any* transaction list, any category whose total amount is zero SHALL NOT appear as a segment in the pie chart or as an entry in the legend.

**Validates: Requirements 4.6**

---

### Property 9: Transaction List Renders All Entries with Correct Fields in Newest-First Order

*For any* non-empty transaction list, calling `renderList` SHALL produce a rendered list where every transaction's `name`, `amount` (formatted to two decimal places), and `category` are present in the corresponding list item, and the items are ordered from most recent (highest `id`) to oldest (lowest `id`).

**Validates: Requirements 2.1, 2.2**

---

### Property 10: Form Resets to Empty State After Any Successful Submission

*For any* valid transaction input (name, amount, category), after a successful form submission the `name` field, `amount` field, and `category` selector SHALL each return to their default empty/unselected state.

**Validates: Requirements 1.4**

---

## Error Handling

| Scenario | Detection | Response |
|---|---|---|
| `localStorage` unavailable on load | `try/catch` around `JSON.parse(localStorage.getItem(...))` | Initialize with `[]`; show non-blocking warning banner for ≥ 3 seconds |
| `localStorage` data unparseable | `JSON.parse` throws or result fails schema check | Same as above |
| `localStorage` write fails on add | `try/catch` around `localStorage.setItem(...)` returns `false` | Show inline error; do NOT add transaction to list or state |
| `localStorage` write fails on delete | `try/catch` around `localStorage.setItem(...)` | Show non-blocking error; restore deleted transaction to state and re-render |
| Form submitted with empty/whitespace fields | `validateForm()` returns errors | Render per-field `<span class="field-error">` beneath each offending field |
| Amount out of range or non-numeric | `validateForm()` returns amount error | Render error beneath amount field; block submission |
| Chart.js CDN fails to load | `typeof Chart === 'undefined'` check in `renderChart` | Hide chart section; show static text "Chart unavailable" |

All errors surface as inline DOM messages. `alert()` and `console.error` are never used as the primary error surface.

---

## Testing Strategy

### Dual Testing Approach

Unit tests cover specific examples, edge cases, and error conditions. Property-based tests verify universal properties across many generated inputs. Both are complementary.

### Unit Tests (Example-Based)

Focus areas:
- `validateForm()` with concrete valid and invalid inputs
- `renderBalance()` with known transaction sets (including empty list, single item, negative-sum scenario)
- `loadTransactions()` with mocked `localStorage` returning valid JSON, invalid JSON, and throwing
- `saveTransactions()` with mocked `localStorage` that throws
- `renderList()` empty-state message presence
- `renderChart()` placeholder state when list is empty
- Delete handler restores transaction on save failure

### Property-Based Tests

**Library**: [fast-check](https://github.com/dubzzz/fast-check) loaded via CDN or used in a Node test runner (no bundler needed — `fast-check` ships a UMD build).

Each property test runs a **minimum of 100 iterations**.

Tag format: `// Feature: expense-budget-visualizer, Property N: <property_text>`

| Property | Test Description | Arbitraries |
|---|---|---|
| P1 — Serialization round-trip | Generate random valid transaction arrays; `JSON.stringify` then `JSON.parse`; assert each entry's name, amount, category strictly equal originals | `fc.array(transactionArb)` |
| P2 — Whitespace names rejected | Generate whitespace-only strings; assert `validateForm` returns a name error and list is unchanged | `fc.stringOf(fc.constantFrom(' ', '\t', '\n'))` |
| P3 — Invalid amounts rejected / valid amounts accepted | Generate amounts outside [0.01, 999999999.99] or NaN; assert rejected. Generate amounts inside range; assert accepted | `fc.oneof(fc.float({max: 0.009}), fc.float({min: 1e9}), fc.constant(NaN))` / `fc.float({min: 0.01, max: 999999999.99})` |
| P4 — Balance non-negative and correctly formatted | Generate random transaction arrays; assert `computeBalance(list)` equals `max(0, sum)` formatted to 2 d.p. with no currency/sign | `fc.array(transactionArb)` |
| P5 — Add grows list and persists | Generate list + valid transaction; add; assert length +1, index 0 is new entry, localStorage contains it | `fc.array(transactionArb)`, `transactionArb` |
| P6 — Delete removes exactly one and persists | Generate list ≥1 item; delete by id; assert id absent from state and localStorage, rest unchanged | `fc.array(transactionArb, {minLength: 1})` |
| P7 — Chart percentages sum to 100% | Generate non-empty list; compute category percentages; assert sum ≈ 100 ± 0.1% and each proportional to category share | `fc.array(transactionArb, {minLength: 1})` |
| P8 — Zero categories excluded from chart | Generate list where at least one category has zero total; assert that category absent from chart labels and dataset | `fc.array(transactionArb)` |
| P9 — List renders correct fields in newest-first order | Generate non-empty transaction arrays; call renderList; assert each item shows name, 2 d.p. amount, category; assert order is descending by id | `fc.array(transactionArb, {minLength: 1})` |
| P10 — Form resets after valid submission | Generate random valid inputs; submit; assert all form fields are empty/default | `transactionArb` |

### Integration / Smoke Tests

- Page loads and renders without JS errors in Chrome, Firefox, Edge, Safari (manual or Playwright smoke test)
- `localStorage` persistence survives page reload (manual verification)
- Chart.js CDN loads and chart renders (manual visual check)

### Accessibility Checks

- Automated: axe-core browser extension scan for WCAG AA violations
- Manual: keyboard-only navigation through form, list, and delete buttons
- Manual: screen reader announcement of balance updates via `aria-live`
