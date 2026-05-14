# Requirements Document

## Introduction

The Expense & Budget Visualizer is a client-side web application that allows users to track personal expenses, categorize spending, and visualize their budget distribution through an interactive pie chart. The application runs entirely in the browser using HTML, CSS, and Vanilla JavaScript, with all data persisted via the browser's Local Storage API. It requires no backend server, no build tools, and no complex setup — making it usable as a standalone web page or browser extension.

## Glossary

- **App**: The Expense & Budget Visualizer web application.
- **Transaction**: A single expense entry consisting of an item name, a monetary amount, and a category.
- **Transaction_List**: The scrollable UI component that displays all recorded transactions.
- **Input_Form**: The HTML form used to capture a new transaction's item name, amount, and category.
- **Category**: A classification label for a transaction. Valid values are: `Food`, `Transport`, and `Fun`.
- **Balance**: The running total of all transaction amounts currently stored, floored at zero.
- **Chart**: The pie chart that visualizes spending distribution by category.
- **Storage**: The browser's `localStorage` API used to persist transaction data client-side.
- **Validator**: The client-side logic responsible for checking that all required form fields are filled before submission.

---

## Requirements

### Requirement 1: Transaction Input Form

**User Story:** As a user, I want to enter expense details through a form, so that I can record my spending quickly and accurately.

#### Acceptance Criteria

1. THE Input_Form SHALL provide a text field for the item name (maximum 250 characters), a numeric field for the amount, and a dropdown selector for the category (`Food`, `Transport`, `Fun`).
2. WHEN the user submits the Input_Form with all fields filled and valid, THE App SHALL add the transaction to the Transaction_List and persist it to Storage.
3. WHEN the user submits the Input_Form with one or more empty or whitespace-only fields, THE Validator SHALL display a separate inline error message beneath each individual missing field identifying that specific field as required.
4. WHEN a transaction is successfully added, THE Input_Form SHALL reset all fields to their default empty state.
5. WHEN the user enters an amount, THE Validator SHALL accept only positive numeric values in the range 0.01 to 999,999,999.99 (inclusive).
6. IF the user enters a non-numeric value or a value outside the accepted range in the amount field, THEN THE Validator SHALL display an error message and prevent form submission.
7. IF Storage is unavailable when a transaction is submitted, THEN THE App SHALL display an inline error message informing the user that the transaction could not be saved, and SHALL NOT add the transaction to the Transaction_List.

---

### Requirement 2: Transaction List Display

**User Story:** As a user, I want to see all my recorded transactions in a scrollable list, so that I can review my spending history at a glance.

#### Acceptance Criteria

1. THE Transaction_List SHALL display each transaction's item name, amount (formatted to two decimal places), and category.
2. WHILE transactions exist in Storage, THE Transaction_List SHALL render all stored transactions on page load, ordered from most recent to oldest.
3. WHEN a new transaction is added, THE Transaction_List SHALL update within 1 second to include the new entry at the top of the list without requiring a page reload.
4. THE Transaction_List SHALL be scrollable when the number of entries exceeds the visible area.
5. WHEN the user clicks the delete button on a transaction, THE App SHALL remove that transaction from the Transaction_List and from Storage.
6. WHEN a transaction is deleted, THE Transaction_List SHALL update within 1 second to reflect the removal.
7. WHILE no transactions exist, THE Transaction_List SHALL display a message indicating that no transactions have been recorded yet.
8. IF a Storage write fails during deletion, THEN THE App SHALL display a non-blocking error message and restore the deleted transaction to the Transaction_List.

---

### Requirement 3: Total Balance Display

**User Story:** As a user, I want to see my total spending balance at the top of the page, so that I always know how much I have spent in total.

#### Acceptance Criteria

1. THE App SHALL display the total Balance above the Transaction_List, calculated as the sum of all transaction amounts, floored at `0.00` if the sum is negative.
2. WHEN a transaction is added, THE App SHALL recalculate and update the Balance display within 500 milliseconds.
3. WHEN a transaction is deleted, THE App SHALL recalculate and update the Balance display within 500 milliseconds.
4. WHILE no transactions exist, THE App SHALL display a Balance of `0.00`.
5. THE App SHALL format the Balance value with exactly two decimal places, no currency symbol, and no sign prefix.
6. WHEN the sum of all transaction amounts is less than zero, THE App SHALL display a Balance of `0.00` rather than a negative value.

---

### Requirement 4: Spending Distribution Chart

**User Story:** As a user, I want to see a pie chart of my spending by category, so that I can understand where my money is going visually.

#### Acceptance Criteria

1. THE Chart SHALL display a pie chart where each segment's size is proportional to that category's share of the total sum of all transaction amounts across all categories.
2. WHEN a transaction is added, THE Chart SHALL update automatically within 1 second to reflect the new spending distribution.
3. WHEN a transaction is deleted, THE Chart SHALL update automatically within 1 second to reflect the revised spending distribution.
4. WHILE only one category has transactions, THE Chart SHALL render a full single-segment pie representing 100% of spending.
5. WHILE no transactions exist, THE Chart SHALL display a visible placeholder state (e.g., a greyed-out circle or a "No data" label) indicating no data is available.
6. THE Chart SHALL assign a distinct, consistent color to each category (`Food`, `Transport`, `Fun`) so that categories are visually distinguishable; categories with a total amount of zero SHALL be excluded from the chart.
7. THE Chart SHALL include a legend that identifies each active category by name and displays its percentage of total spending rounded to one decimal place.

---

### Requirement 5: Data Persistence

**User Story:** As a user, I want my transactions to be saved between sessions, so that I do not lose my data when I close or refresh the browser.

#### Acceptance Criteria

1. WHEN a transaction is added, THE App SHALL serialize the updated transaction list as JSON and write it to `localStorage` under a fixed key.
2. WHEN a transaction is deleted, THE App SHALL serialize the updated transaction list as JSON and write it to `localStorage` under the same fixed key.
3. WHEN the App loads, THE App SHALL read and deserialize the transaction list from `localStorage` and restore all previously saved transactions.
4. IF `localStorage` is unavailable or returns data that cannot be parsed as a valid transaction list, THEN THE App SHALL initialize with an empty transaction list and display a non-blocking warning message that remains visible for at least 3 seconds and does not prevent the user from interacting with the App.
5. WHEN a valid transaction list (where each entry has a non-empty string name, a positive numeric amount, and a category of `Food`, `Transport`, or `Fun`) is serialized and then deserialized, THE App SHALL produce a transaction list where each entry's name, amount, and category are strictly equal to those of the original entry.

---

### Requirement 6: Responsive and Accessible UI

**User Story:** As a user, I want the interface to be clean, readable, and usable across modern browsers, so that I can use the app comfortably on any device.

#### Acceptance Criteria

1. THE App SHALL render correctly in the latest stable versions of Chrome, Firefox, Edge, and Safari.
2. THE App SHALL use a single CSS file and a single JavaScript file, with no additional stylesheets or scripts beyond an optional third-party chart library loaded via CDN.
3. THE App SHALL use a minimum body font size of 14px and maintain a text-to-background contrast ratio of at least 4.5:1 (WCAG AA) for all body text and interactive labels.
4. WHEN the viewport width changes, THE App SHALL maintain a layout with no horizontal scrollbar and all interactive elements (Input_Form fields, buttons, Transaction_List delete buttons) reachable on screens 320px wide or wider.
5. WHEN an Input_Form field or button receives keyboard focus, THE App SHALL display a visible focus indicator consisting of an outline of at least 2px width with a contrast ratio of at least 3:1 against the adjacent background (WCAG 2.1 SC 1.4.11).
6. THE App SHALL load and become fully interactive — meaning all Input_Form fields and buttons are operable — within 3 seconds on a connection of at least 10 Mbps.
