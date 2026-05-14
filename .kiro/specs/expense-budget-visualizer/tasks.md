# Implementation Plan: Expense & Budget Visualizer

## Overview

Implement a zero-dependency, client-side expense tracker as three static files (`index.html`, `style.css`, `app.js`). The build follows the unidirectional data-flow architecture defined in the design: every mutation updates the in-memory array, persists to `localStorage`, then re-renders the affected UI regions. Chart.js (CDN) handles the pie chart. Property-based tests use fast-check (UMD build).

---

## Tasks

- [ ] 1. Scaffold HTML structure and load external dependencies
  - Create `index.html` with semantic sections: `#balance-section`, `#form-section`, `#chart-section`, `#list-section`, and `#global-message`
  - Add `<form id="transaction-form">` with `#input-name` (text, maxlength 250), `#input-amount` (number), `#input-category` (select with Food / Transport / Fun options), and a submit button
  - Add `<canvas id="spending-chart">` inside `#chart-section`
  - Add `<ul id="transaction-list">` inside `#list-section`
  - Add `aria-live="polite"` on `#global-message` and `aria-label` / `<label for="">` on every interactive element
  - Load `style.css` in `<head>`; load Chart.js CDN `<script>` then `app.js` (with `defer`) before `</body>`
  - _Requirements: 1.1, 2.1, 3.1, 4.1, 6.2, 6.6_

- [ ] 2. Implement Constants and State sections in `app.js`
  - [ ] 2.1 Write the Constants section
    - Define `STORAGE_KEY`, `CATEGORIES`, `AMOUNT_MIN`, `AMOUNT_MAX`, `NAME_MAX`, and `CATEGORY_COLORS` exactly as specified in the design
    - Wrap the entire file in an IIFE (or use `type="module"`) to prevent global namespace pollution
    - _Requirements: 5.1, 5.2, 6.2_

  - [ ] 2.2 Write the State section
    - Declare `let transactions = []` and `let chartInstance = null`
    - _Requirements: 5.3_

- [ ] 3. Implement Storage helpers
  - [ ] 3.1 Implement `loadTransactions()`
    - Wrap `localStorage.getItem` + `JSON.parse` in `try/catch`
    - Validate that the parsed value is an array where every entry has a non-empty string `name`, a positive numeric `amount`, and a `category` in `CATEGORIES`; fall back to `[]` on any failure
    - Call `showGlobalMessage` with a warning and a duration of at least 3 000 ms on any error path
    - Return the validated array
    - _Requirements: 5.3, 5.4_

  - [ ] 3.2 Implement `saveTransactions(list)`
    - Wrap `localStorage.setItem(STORAGE_KEY, JSON.stringify(list))` in `try/catch`
    - Return `true` on success, `false` on failure
    - Do NOT call `showGlobalMessage` here — callers are responsible for error messaging
    - _Requirements: 5.1, 5.2_

  - [ ]* 3.3 Write property test for serialization round-trip (Property 1)
    - **Property 1: Serialization Round-Trip Preserves All Fields**
    - Generate random valid transaction arrays with `fc.array(transactionArb)`
    - `JSON.stringify` then `JSON.parse`; assert each entry's `name`, `amount`, and `category` are strictly equal to the originals
    - Tag: `// Feature: expense-budget-visualizer, Property 1: Serialization round-trip preserves all fields`
    - **Validates: Requirements 5.3, 5.5**

- [ ] 4. Implement Validation
  - [ ] 4.1 Implement `validateForm(name, amount, category)`
    - Return `[]` when all fields are valid
    - Push `{ field: 'name', message: '...' }` when `name.trim()` is empty or exceeds 250 characters
    - Push `{ field: 'amount', message: '...' }` when `amount` is non-numeric, `NaN`, `Infinity`, ≤ 0, < 0.01, or > 999 999 999.99
    - Push `{ field: 'category', message: '...' }` when `category` is not in `CATEGORIES`
    - _Requirements: 1.3, 1.5, 1.6_

  - [ ]* 4.2 Write property test for whitespace-only name rejection (Property 2)
    - **Property 2: Validation Rejects All Whitespace-Only Names**
    - Generate whitespace-only strings with `fc.stringOf(fc.constantFrom(' ', '\t', '\n'))` (min length 1)
    - Assert `validateForm(ws, '1', 'Food')` returns at least one error with `field === 'name'`
    - Tag: `// Feature: expense-budget-visualizer, Property 2: Validation rejects all whitespace-only names`
    - **Validates: Requirements 1.3**

  - [ ]* 4.3 Write property test for amount range validation (Property 3)
    - **Property 3: Validation Rejects Invalid Amounts / Accepts Valid Amounts**
    - Generate out-of-range values (`fc.oneof(fc.float({max: 0.009}), fc.float({min: 1e9}), fc.constant(NaN), fc.constant(0), fc.constant(-1))`); assert rejected
    - Generate in-range values (`fc.float({min: 0.01, max: 999999999.99})`); assert accepted
    - Tag: `// Feature: expense-budget-visualizer, Property 3: Validation rejects invalid amounts and accepts valid amounts`
    - **Validates: Requirements 1.5, 1.6**

- [ ] 5. Implement Rendering — balance and list
  - [ ] 5.1 Implement `renderBalance(list)`
    - Sum all `amount` values; apply `Math.max(0, sum)`; format with `.toFixed(2)`; write to `#balance-display`
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6_

  - [ ]* 5.2 Write property test for balance correctness (Property 4)
    - **Property 4: Balance Is Always a Non-Negative Number Formatted to Two Decimal Places**
    - Generate random transaction arrays with `fc.array(transactionArb)`
    - Assert `computeBalance(list)` equals `Math.max(0, sum).toFixed(2)` with no currency symbol or sign prefix
    - Tag: `// Feature: expense-budget-visualizer, Property 4: Balance is always non-negative and formatted to two decimal places`
    - **Validates: Requirements 3.1, 3.4, 3.5, 3.6**

  - [ ] 5.3 Implement `renderList(list)`
    - Clear `#transaction-list`; if `list` is empty, insert an empty-state `<li>` message
    - Otherwise rebuild newest-first (sort descending by `id`): each `<li>` shows `name`, `amount` formatted to 2 d.p., `category`, and a `<button class="delete-btn">` with `data-id` attribute and an accessible `aria-label`
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.6, 2.7_

  - [ ]* 5.4 Write property test for list rendering order and fields (Property 9)
    - **Property 9: Transaction List Renders All Entries with Correct Fields in Newest-First Order**
    - Generate non-empty transaction arrays with `fc.array(transactionArb, {minLength: 1})`
    - Call `renderList(list)`; query all rendered `<li>` elements; assert each item contains the correct `name`, 2 d.p. `amount`, and `category`; assert items are ordered descending by `id`
    - Tag: `// Feature: expense-budget-visualizer, Property 9: Transaction list renders correct fields in newest-first order`
    - **Validates: Requirements 2.1, 2.2**

- [ ] 6. Implement Rendering — chart
  - [ ] 6.1 Implement `renderChart(list)`
    - Aggregate amounts by category; exclude categories with a total of zero
    - If `list` is empty or all totals are zero, destroy any existing Chart.js instance and show a placeholder (greyed-out circle or "No data" label) inside `#chart-section`
    - If `typeof Chart === 'undefined'`, hide `#chart-section` and show "Chart unavailable" text
    - Otherwise destroy the previous `chartInstance` (if any) and create a new `Chart` with type `'pie'`, using `CATEGORY_COLORS` and a legend showing each active category name and its percentage rounded to 1 d.p.
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7_

  - [ ]* 6.2 Write property test for chart percentage sum (Property 7)
    - **Property 7: Chart Category Percentages Sum to 100%**
    - Generate non-empty transaction arrays with `fc.array(transactionArb, {minLength: 1})`
    - Compute category totals and percentages; assert `Math.abs(sum - 100) <= 0.1` and each percentage is proportional to its category's share
    - Tag: `// Feature: expense-budget-visualizer, Property 7: Chart category percentages sum to 100%`
    - **Validates: Requirements 4.1, 4.7**

  - [ ]* 6.3 Write property test for zero-amount category exclusion (Property 8)
    - **Property 8: Zero-Amount Categories Are Excluded from the Chart**
    - Generate transaction arrays where at least one category has no entries (total = 0)
    - Assert that category does not appear in the chart labels or dataset
    - Tag: `// Feature: expense-budget-visualizer, Property 8: Zero-amount categories are excluded from the chart`
    - **Validates: Requirements 4.6**

- [ ] 7. Implement inline error rendering helpers
  - [ ] 7.1 Implement `showFieldErrors(errors)` and `clearFieldErrors()`
    - `clearFieldErrors`: remove all existing `.field-error` spans from the form
    - `showFieldErrors`: for each `{ field, message }` in `errors`, inject a `<span class="field-error" role="alert">` immediately after the corresponding input/select element
    - _Requirements: 1.3, 1.6_

  - [ ] 7.2 Implement `showGlobalMessage(msg, type, duration?)`
    - Populate `#global-message` with `msg` and apply a CSS class for `type` (`'error'` or `'warning'`)
    - If `duration` is provided, auto-clear the message after `duration` ms
    - Never use `alert()`
    - _Requirements: 1.7, 2.8, 5.4_

- [ ] 8. Implement Event Handlers
  - [ ] 8.1 Implement `handleFormSubmit(event)`
    - Call `event.preventDefault()`; call `clearFieldErrors()`
    - Read `#input-name`, `#input-amount`, `#input-category` values; call `validateForm`
    - If errors exist, call `showFieldErrors(errors)` and return
    - Build a new `Transaction` object with `id: Date.now().toString()`, trimmed `name`, parsed `amount`, and `category`
    - Call `saveTransactions([newTx, ...transactions])`; if it returns `false`, call `showGlobalMessage` with an inline error and return without mutating state
    - On success: prepend to `transactions`; reset the form; call `renderList`, `renderBalance`, `renderChart`
    - _Requirements: 1.2, 1.3, 1.4, 1.6, 1.7, 2.3, 3.2, 4.2, 5.1_

  - [ ]* 8.2 Write property test for add-grows-list-and-persists (Property 5)
    - **Property 5: Adding a Valid Transaction Grows the List by Exactly One and Persists It**
    - Generate a starting list and a valid transaction with `fc.array(transactionArb)` and `transactionArb`
    - Simulate the add path; assert `transactions.length === original.length + 1`, `transactions[0]` is the new entry, and `localStorage` under `STORAGE_KEY` contains the updated list
    - Tag: `// Feature: expense-budget-visualizer, Property 5: Adding a valid transaction grows the list by exactly one and persists it`
    - **Validates: Requirements 1.2, 2.3, 5.1**

  - [ ]* 8.3 Write property test for form reset after valid submission (Property 10)
    - **Property 10: Form Resets to Empty State After Any Successful Submission**
    - Generate random valid inputs with `transactionArb`; simulate a successful form submission
    - Assert `#input-name.value === ''`, `#input-amount.value === ''`, and `#input-category.value` is the default empty/first option
    - Tag: `// Feature: expense-budget-visualizer, Property 10: Form resets to empty state after any successful submission`
    - **Validates: Requirements 1.4**

  - [ ] 8.4 Implement `handleDeleteClick(event)`
    - Use event delegation on `#transaction-list`; check `event.target.closest('.delete-btn')`
    - Read `data-id`; snapshot the current list; filter out the matching entry
    - Call `saveTransactions(updated)`; if it returns `false`, call `showGlobalMessage` with a non-blocking error, restore `transactions` to the snapshot, and re-render
    - On success: update `transactions`; call `renderList`, `renderBalance`, `renderChart`
    - _Requirements: 2.5, 2.6, 2.8, 3.3, 4.3, 5.2_

  - [ ]* 8.5 Write property test for delete-removes-exactly-one (Property 6)
    - **Property 6: Deleting a Transaction Removes Exactly That Entry from State and Storage**
    - Generate a list with at least one entry with `fc.array(transactionArb, {minLength: 1})`; pick a random entry to delete
    - Simulate the delete path; assert the deleted `id` is absent from `transactions` and `localStorage`, and all other entries remain unchanged
    - Tag: `// Feature: expense-budget-visualizer, Property 6: Deleting a transaction removes exactly that entry from state and storage`
    - **Validates: Requirements 2.5, 2.6, 5.2**

- [ ] 9. Checkpoint — Core logic complete
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 10. Implement Init and wire everything together
  - [ ] 10.1 Write the Init section
    - Add a `DOMContentLoaded` listener that calls `loadTransactions()`, assigns the result to `transactions`, then calls `renderList`, `renderBalance`, and `renderChart`
    - Attach `handleFormSubmit` to `#transaction-form` submit event
    - Attach `handleDeleteClick` to `#transaction-list` click event (event delegation)
    - _Requirements: 2.2, 5.3, 5.4_

- [ ] 11. Implement CSS styles
  - [ ] 11.1 Write base styles and CSS custom properties
    - Define `:root` tokens for all colours (`--color-food`, `--color-transport`, `--color-fun`, `--focus-color`, background, text, etc.) and spacing
    - Set `body` font-size to at least 14px; ensure text-to-background contrast ≥ 4.5:1 (WCAG AA) for all body text and interactive labels
    - Style `#global-message` as a fixed-position non-blocking banner at the top of the viewport
    - Style `.field-error` as red inline text beneath each form field
    - _Requirements: 6.3_

  - [ ] 11.2 Write responsive layout styles
    - Mobile-first single-column layout; add a `min-width: 600px` breakpoint for a two-column arrangement
    - Ensure no horizontal scrollbar at 320px viewport width; all form fields, buttons, and delete buttons must be reachable at 320px
    - Make `#list-section` scrollable (`overflow-y: auto`) when entries exceed the visible area
    - _Requirements: 6.4_

  - [ ] 11.3 Write focus and accessibility styles
    - Apply `outline: 2px solid var(--focus-color)` on `:focus-visible` for all interactive elements; never suppress focus outlines without a replacement
    - Ensure focus indicator contrast ≥ 3:1 against adjacent background (WCAG 2.1 SC 1.4.11)
    - _Requirements: 6.5_

- [ ] 12. Final checkpoint — Full integration
  - Ensure all tests pass, ask the user if questions arise.

---

## Notes

- Tasks marked with `*` are optional and can be skipped for a faster MVP
- Each task references specific requirements for traceability
- Property tests use fast-check UMD build; load via CDN `<script>` tag in the test harness (no bundler needed)
- Each property test must run a minimum of 100 iterations
- All errors surface as inline DOM messages — `alert()` and `console.error` are never the primary error surface
- The `computeBalance` helper (pure function, no DOM side-effects) should be extracted from `renderBalance` to make it directly testable by property tests
- Chart.js CDN failure is handled by a `typeof Chart === 'undefined'` guard in `renderChart`

---

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["2.1", "2.2"] },
    { "id": 1, "tasks": ["3.1", "3.2", "4.1"] },
    { "id": 2, "tasks": ["3.3", "4.2", "4.3", "5.1", "5.3"] },
    { "id": 3, "tasks": ["5.2", "5.4", "6.1", "7.1", "7.2"] },
    { "id": 4, "tasks": ["6.2", "6.3", "8.1", "8.4", "10.1"] },
    { "id": 5, "tasks": ["8.2", "8.3", "8.5", "11.1"] },
    { "id": 6, "tasks": ["11.2", "11.3"] }
  ]
}
```
