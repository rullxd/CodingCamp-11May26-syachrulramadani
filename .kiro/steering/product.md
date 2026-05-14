# Product Overview

## Expense & Budget Visualizer

A client-side personal finance web app that lets users record expenses, categorize spending, and visualize their budget distribution through an interactive pie chart.

### Core Features
- **Transaction entry** — form-based input with item name, amount, and category (Food, Transport, Fun)
- **Transaction list** — scrollable history ordered newest-first, with per-item delete
- **Balance display** — running total of all expenses, floored at 0.00, always visible
- **Pie chart** — real-time spending distribution by category with legend and percentages
- **Data persistence** — all data saved to `localStorage`; survives page refresh and browser close

### Key Constraints
- Runs entirely in the browser — no backend, no server, no build step
- Usable as a standalone HTML file or browser extension
- No frameworks; Vanilla JS only (one optional CDN chart library permitted)
- Must work in latest stable Chrome, Firefox, Edge, and Safari
- Must be accessible: WCAG AA contrast (4.5:1 body text), visible focus indicators, responsive down to 320px viewport width
