# Project Structure

## File Layout

```
/
├── index.html       # Single HTML entry point; all markup lives here
├── style.css        # All styles; single stylesheet, no imports
└── app.js           # All application logic; single script file
```

No subdirectories, no build output folders, no asset pipelines.

## index.html Conventions

- Load `style.css` in `<head>`
- Load `app.js` at the end of `<body>` (or use `defer`)
- CDN chart library `<script>` tag goes before `app.js`
- Use semantic HTML elements (`<form>`, `<ul>`, `<li>`, `<section>`, etc.)
- All interactive elements must have accessible labels (`<label for="">` or `aria-label`)

## app.js Conventions

Organize code into clearly separated logical sections in this order:

1. **Constants** — localStorage key, category list, validation limits
2. **State** — in-memory transaction array (single source of truth)
3. **Storage helpers** — `loadTransactions()`, `saveTransactions()`
4. **Validation** — `validateForm()` returning errors per field
5. **Rendering** — `renderList()`, `renderBalance()`, `renderChart()`
6. **Event handlers** — form submit, delete button clicks
7. **Init** — bootstrap function called on `DOMContentLoaded`

## style.css Conventions

- Use CSS custom properties (`--var`) for colors and spacing tokens
- Mobile-first media queries; breakpoints added as viewport grows
- No `!important`; specificity managed through class hierarchy
- Focus styles must be explicit — never `outline: none` without a replacement

## Data Model

Transactions are stored as a JSON array in `localStorage`:

```json
[
  { "id": "uuid-or-timestamp", "name": "Coffee", "amount": 4.50, "category": "Food" }
]
```

- `id`: unique string (timestamp or UUID) used as the delete key
- `name`: non-empty string, max 250 characters
- `amount`: positive number, range 0.01–999999999.99
- `category`: one of `"Food"`, `"Transport"`, `"Fun"`

## localStorage Key

Use a single fixed key for all transaction data, e.g. `"expense_transactions"`. Never use multiple keys for the same dataset.
