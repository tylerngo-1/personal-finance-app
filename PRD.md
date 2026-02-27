## Product Requirements Document (PRD) — Personal Finance App

### 1. Overview

**Product name**: Personal Finance App  
**Purpose**: A simple web-based personal finance tracker that helps individual users track accounts, categorize income and expenses, view transaction history, and understand their net worth and monthly cash flow.  
**Primary user**: Single, authenticated user scenario is implied but not implemented; current app operates as a single-tenant tool against one shared database.

### 2. High-Level Goals

- **Track financial accounts** (checking, savings, credit cards, investments, etc.) as either assets or liabilities.
- **Record transactions** as income or expense, linked to accounts and categories.
- **Categorize cash flows** using income/expense categories.
- **Provide insights** via a dashboard: total net worth, monthly income/expense, and cumulative net worth over time.
- **Standardize display currency** for all formatted amounts (no FX conversion, formatting only).

### 3. Core User Flows & Features

#### 3.1 Navigation & Entry Points

- **Root (`/`)**
  - Automatically redirects to `/dashboard`.

- **Top-level pages**
  - `/dashboard`: Summary of financial position and history.
  - `/transactions`: Transaction list with filters and add-transaction form.
  - `/settings`: Account and category management + display currency preference.

#### 3.2 Accounts Management (`/settings` + `/api/accounts`)

**Entities**
- Account fields:
  - `id` (string, cuid, generated)
  - `name` (string)
  - `type` (`CHECKING`, `SAVINGS`, `CREDIT_CARD`, `CASH`, `INVESTMENT`, `FUNDING`, `INSURANCE`)
  - `nature` (`ASSET`, `LIABILITY`)
  - `createdAt` (DateTime)

**Create account**
- Location: `Settings → Account Management → New Account` form.
- Inputs:
  - `name` (required text)
  - `type` (required, select from allowed `AccountType`)
  - `nature` (required, `ASSET` or `LIABILITY`)
- Backend:
  - `POST /api/accounts`
  - Validates:
    - `name`, `type`, `nature` must be present.
    - `type` must be one of valid `AccountType` enum values.
    - `nature` must be one of `ASSET` or `LIABILITY`.
  - On success: persists account; returns the created account (201) and UI refreshes list.
  - On failure: returns 400 with error JSON (no explicit UI error handling defined).

**List accounts**
- Location: `Settings → Account Management`.
- Data source:
  - `GET /api/accounts`
  - Includes related transactions for each account (used elsewhere for balance/net-worth calc).
- UI behavior:
  - If no accounts: show “No accounts yet.”
  - Otherwise: show list with:
    - Name
    - Type (badge)
    - Nature (ASSET/LIABILITY with colored badge)
    - Actions: `Edit`, `Delete`.

**Edit account**
- Trigger: Click `Edit` on an account row.
- Behavior:
  - Row switches into inline edit form:
    - Editable `name`, `type`, `nature`.
  - Submit:
    - `PUT /api/accounts/:id`
    - Partial updates allowed; validates type/nature if provided.
  - On success: exits edit mode and refetches list.

**Delete account**
- Trigger: Click `Delete` on an account row.
- Confirmation: Browser `confirm("Delete this account and all its transactions?")`.
- Backend:
  - `DELETE /api/accounts/:id`
  - Deletes account record (and, implicitly via DB relations, its transactions).
- On success: refetches accounts.

#### 3.3 Categories Management (`/settings` + `/api/categories`)

**Entities**
- Category fields:
  - `id` (string, cuid)
  - `name` (string)
  - `type` (TransactionType: `INCOME` or `EXPENSE`)
  - `createdAt` (DateTime)

**Create category**
- Location: `Settings → Category Management → New Category`.
- Inputs:
  - `name` (required text)
  - `type` (required, `INCOME` or `EXPENSE`)
- Backend:
  - `POST /api/categories`
  - Validates:
    - `name` and `type` required.
    - `type` must be `INCOME` or `EXPENSE`.
  - On success: returns created category (201) and UI refetches categories.

**List categories**
- Location: `Settings → Category Management`.
- Data source:
  - `GET /api/categories` (ordered by `createdAt` asc).
- UI:
  - If empty: show “No categories yet.”
  - Otherwise: list showing:
    - Name
    - Type badge (`INCOME` or `EXPENSE` with colored styling).
    - Actions: `Edit`, `Delete`.

**Edit category**
- Inline edit similar to accounts:
  - Edit `name` and `type`.
  - `PUT /api/categories/:id` with partial update permitted.
  - Validates `type` if provided.
  - On success: closes edit mode and refetches categories.

**Delete category**
- Trigger: `Delete` button.
- Confirmation: `confirm("Delete this category?")`.
- Backend:
  - `DELETE /api/categories/:id`
  - On success: refetches categories.

#### 3.4 Display Currency Preference (`/settings` + `/api/settings`)

**Entities**
- Setting record:
  - `key` (string, primary key) — currently uses `"currency"`.
  - `value` (string) — currency code (e.g., `"USD"`).

**Supported currencies (UI)**
- Hardcoded list of ISO-like codes (e.g. `USD`, `EUR`, `GBP`, `JPY`, etc.) with labels like `USD — US Dollar`.

**Current currency behavior**
- At settings load:
  - `GET /api/settings` returns `{ currency: setting.value ?? "USD" }`.
  - UI initializes `currency` state with returned value or `"USD"` if none.
- Change currency:
  - User selects a currency from dropdown.
  - Triggers:
    - Local state update for `currency`.
    - `PUT /api/settings` with JSON `{ currency }`.
  - Backend:
    - Validates `currency` is a non-empty string.
    - `upsert` into `Setting` table with key `"currency"`.
    - Returns `{ currency: setting.value }`.
- Usage:
  - Dashboard and Transactions pages read `currency` via:
    - `prisma.setting.findUnique({ key: "currency" })` on the server (dashboard).
    - `GET /api/settings` on the client (transactions & settings) and apply to formatting.
  - **No FX conversion**:
    - Stored amounts are raw numeric values; currency only affects display formatting (`toLocaleString` with `style: "currency"`).

#### 3.5 Transactions (`/transactions` + `/api/transactions`)

**Entities**
- Transaction fields:
  - `id` (string, cuid)
  - `amount` (Float)
  - `type` (TransactionType: `INCOME` or `EXPENSE`)
  - `description` (string)
  - `createdAt` (DateTime)
  - `accountId` (string, FK → Account)
  - `categoryId` (string, FK → Category)
  - Relations:
    - `account` (Account)
    - `category` (Category)

**List & filter transactions**
- Data source (client side):
  - `GET /api/transactions` with optional query parameters:
    - `accountId` — filter by account.
    - `categoryId` — filter by category.
    - `type` — `INCOME` or `EXPENSE`.
    - `search` — substring match on description (case-insensitive).
    - `sort` — one of:
      - `date_desc` (default)
      - `date_asc`
      - `amount_desc`
      - `amount_asc`
  - Backend:
    - Applies filters and sorting.
    - Includes `account` and `category` relations in result.
  - UI:
    - Displays a table with:
      - Date (`createdAt` localized date string).
      - Description.
      - Account name (or `—` if missing).
      - Category name (or `—` if missing).
      - Type badge (`INCOME` or `EXPENSE`).
      - Amount:
        - formatted as currency using selected display currency.
        - prefixed: `+` for income, `-` for expense.
    - If no results: shows “No transactions found.”

**Filters (client UI)**
- Available controls:
  - Account select:
    - Options: `All accounts` plus all accounts from `GET /api/accounts`.
  - Category select:
    - Options: `All categories` plus all categories from `GET /api/categories`.
  - Type select:
    - Options: `All types`, `INCOME`, `EXPENSE`.
  - Sort select:
    - Options: `Newest first`, `Oldest first`, `Amount (high→low)`, `Amount (low→high)`.
  - Search input:
    - Free-text search on description (debounce not implemented; triggers on change).
- Behavior:
  - Filter state is stored in React state.
  - Any change triggers re-fetch of `/api/transactions` with query parameters.

**Create transaction**
- Location: `/transactions` — “+ Add Transaction” toggles a form.
- Inputs (all required):
  - Account (select from existing accounts).
  - Amount:
    - Numeric input.
    - Min `0.01`, step `0.01`.
  - Type:
    - `INCOME` or `EXPENSE`.
  - Category:
    - Select from categories filtered by currently chosen type.
  - Description:
    - Free text, required.
- Backend:
  - `POST /api/transactions` with body:
    - `accountId` (string)
    - `amount` (string or number; parsed into float)
    - `type` (`INCOME` or `EXPENSE`)
    - `description` (string)
    - `categoryId` (string)
  - Validation:
    - All fields required.
    - `type` must be `INCOME` or `EXPENSE`.
  - On success:
    - Creates transaction.
    - Returns created transaction with `account` and `category`.
    - UI:
      - Clears amount, description, category inputs.
      - Keeps account and type as-is.
      - Re-fetches transactions to refresh list.

**Error handling**
- API sends back JSON errors (400) for invalid input.
- Client code does not currently surface error messages to the UI (no toast or inline error).

#### 3.6 Dashboard (`/dashboard` + `/api/dashboard/summary`)

**Dashboard server-rendered page**
- Data gathering:
  - `prisma.account.findMany({ include: { transactions: true } })`.
  - `prisma.setting.findUnique({ key: "currency" })`.
  - Separately, `prisma.transaction.findMany({ orderBy: createdAt asc, include: { account: true }})` for history.

**Computed metrics**
- Date ranges:
  - `monthStart`: first day of current calendar month (local time).
- Per-account:
  - `income` = sum of transaction amounts with `type === "INCOME"`.
  - `expense` = sum of transaction amounts with `type === "EXPENSE"`.
  - `balance`:
    - For ASSET accounts: `income - expense`.
    - For LIABILITY accounts: `expense - income` (so liabilities naturally reduce net worth).
- Aggregates:
  - `assetBalance` = sum of balances for accounts with `nature === "ASSET"`.
  - `liabilityBalance` = sum of balances for accounts with `nature === "LIABILITY"`.
  - `totalNetWorth` = `assetBalance - liabilityBalance`.
  - `monthlyIncome`:
    - Sum of amounts for all INCOME transactions with `createdAt >= monthStart`.
  - `monthlyExpense`:
    - Sum of amounts for all EXPENSE transactions with `createdAt >= monthStart`.
  - `netCashFlow` = `monthlyIncome - monthlyExpense`.
- Net worth history:
  - Groups all transactions by `YYYY-MM` (year-month).
  - For each month, `delta`:
    - Adds `amount` for `INCOME`, subtracts for `EXPENSE`.
  - Computes running cumulative `netWorth` over months, sorted chronologically.

**Dashboard UI sections**
- Summary cards:
  - Cards displayed in a grid:
    - Total Net Worth.
    - This Month Income.
    - This Month Expense.
    - Net Cash Flow.
  - Values:
    - Formatted as currency in selected display currency.
    - Colors: green for positive, red for negative where applicable.
- Account balances:
  - List of each account with:
    - Name.
    - Type badge.
    - Nature badge (ASSET/LIABILITY).
    - Balance formatted in display currency.
    - Balance color: green if ≥0, red if <0.
  - Empty state: “No accounts yet. Go to Settings to create one.”
- Net worth over time:
  - Simple table:
    - Month (YYYY-MM).
    - Cumulative Net Worth (formatted currency, colored by sign).
  - Empty state: “No transaction history yet.”

**Dashboard summary API**
- `/api/dashboard/summary`:
  - Returns:
    - `totalNetWorth`
    - `monthlyIncome`
    - `monthlyExpense`
    - `netCashFlow`
    - `accountBalances` (id, name, type, nature, balance)
    - `netWorthHistory` (array of `{ month, netWorth }`)
  - Mirrors the computations performed in the dashboard page (no consumer in current UI, but available for future clients).

### 4. Data Model

- **Account**
  - `id: String @id @default(cuid())`
  - `name: String`
  - `type: AccountType`
  - `nature: AccountNature`
  - `createdAt: DateTime @default(now())`
  - `transactions: Transaction[]`

- **Category**
  - `id: String @id @default(cuid())`
  - `name: String`
  - `type: TransactionType`
  - `createdAt: DateTime @default(now())`
  - `transactions: Transaction[]`

- **Transaction**
  - `id: String @id @default(cuid())`
  - `amount: Float`
  - `type: TransactionType`
  - `description: String`
  - `createdAt: DateTime @default(now())`
  - `accountId: String` (FK)
  - `categoryId: String` (FK)

- **Setting**
  - `key: String @id`
  - `value: String`

### 5. Non-Functional Behavior (Current)

- **Authentication/authorization**:
  - Not implemented. All routes assume open access and a single logical user context.
- **Validation**:
  - Performed on backend for required fields and enum correctness.
  - No explicit numeric range checking on transaction `amount` beyond client-side min/step.
  - No cross-entity validation (e.g., preventing delete when referenced) beyond Prisma/DB constraints.
- **Error handling**:
  - APIs return structured JSON errors and appropriate HTTP status codes (mainly 400 for invalid input).
  - The current UI does not surface error messages; failures would be silent from the user’s perspective.
- **Performance/scalability**:
  - Simple `findMany` queries with eager loading of related data.
  - No pagination on transaction list or account list.
  - Meant for small personal datasets.

### 6. Out of Scope (Explicit / Implied)

- **Multi-user support** (logins, user accounts, per-user data isolation).
- **Budgeting features** (budgets, goals, alerts).
- **Recurring transactions** or scheduled imports.
- **External bank integrations** or automatic imports.
- **Real FX conversion** or multi-currency accounting.
- **Mobile-specific UI** beyond basic responsive layout provided by CSS.

