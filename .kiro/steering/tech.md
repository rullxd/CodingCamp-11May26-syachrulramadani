# Tech Stack

## Core Technologies

- **HTML5** — single `index.html` file; semantic markup
- **CSS3** — single `style.css` file; no preprocessors, no CSS frameworks
- **Vanilla JavaScript (ES6+)** — single `app.js` file; no frameworks, no bundlers
- **localStorage API** — client-side persistence; JSON serialization under a fixed key

## Optional Dependency

- One third-party chart library loaded via **CDN** `<script>` tag is permitted (e.g., Chart.js)
- No npm, no package.json, no node_modules

## Browser Support

Latest stable versions of: Chrome, Firefox, Edge, Safari

## Build & Tooling

No build step required. The project is zero-config and runs directly in the browser.

| Task | Command |
|------|---------|
| Run locally | Open `index.html` directly in a browser, or serve with any static file server |
| Quick local server (Python) | `python -m http.server 8080` |
| Quick local server (Node) | `npx serve .` |

## Code Style Conventions

- **Indentation**: 2 spaces
- **Quotes**: single quotes for JS strings
- **Semicolons**: required
- **Variable declarations**: `const` by default, `let` when reassignment is needed; never `var`
- **DOM queries**: cache references; avoid repeated `querySelector` calls for the same element
- **Event handling**: use `addEventListener`; never inline `onclick` attributes in HTML
- **Error handling**: wrap `localStorage` reads/writes in `try/catch`; surface errors as inline UI messages, not `alert()`
- **No global pollution**: wrap module logic in an IIFE or use ES module `type="module"` if scoping is needed
