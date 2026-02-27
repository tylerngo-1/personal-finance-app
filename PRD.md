## Product Requirements Document (PRD) — Personal Finance App

### 1. Overview

**Product name**: Personal Finance App
**Purpose**: A web-based personal finance tracker for a single user to track accounts, categorize income and expenses, record transfers, monitor goals, view reports, and understand net worth and monthly cash flow.
**Primary user**: Single-tenant tool against one shared database. Multi-user support is permanently out of scope.
**Target platform**: Desktop browser only. Mobile is not a design target.

---

### 2. High-Level Goals

- **Track financial accounts** (checking, savings, credit cards, investments, etc.) as either assets or liabilities.
- **Record transactions** as income or expense, linked to accounts and categories.
- **Record transfers** between own accounts as a first-class operation (not income or expense).
- **Categorize cash flows** using income/expense categories.
- **Set and track goals** — savings goals tied to accounts and general financial goals linked to transactions.
- **Provide insights** via a dashboard and a dedicated reports page.
- **Standardize display currency** for all formatted amounts (no FX conversion, formatting only).
- **Export data** as CSV; import from CSV (future).

---

### 3. Core User Flows & Features

#### 3.1 Navigation & Entry Points

- **Root (`/`)** — redirects to `/dashboard`.
- **Top-level pages** (top navigation bar, links added as features ship):
  - `/dashboard` — summary cards, account balances, goals widget, net worth table.
  - `/transactions` — transaction list with filters, modal add/edit form.
  - `/transfers` — transfer list with modal add/edit form.
  - `/goals` — goal list and detail views.
  - `/reports` — charts and breakdowns.
  - `/settings` — accounts, categories, display currency, theme.

---

#### 3.2 Accounts Management (`/settings` + `/api/accounts`)

**Entities**
- Account fields:
  - `id` (string, cuid)
  - `name` (string)
  - `type` (`CHECKING`, `SAVINGS`, `CREDIT_CARD`, `CASH`, `INVESTMENT`, `FUNDING`, `INSURANCE`)
  - `nature` (`ASSET`, `LIABILITY`)
  - `isArchived` (Boolean, default `false`)
  - `createdAt` (DateTime)

**Create account**
- Location: `Settings → Account Management → New Account` form.
- Inputs: `name` (required), `type` (required), `nature` (required).
- Backend: `POST /api/accounts` — validates all fields; returns 201 on success, 400 on failure.

**List accounts**
- `GET /api/accounts` — returns non-archived accounts only (`isArchived: false`), includes related transactions.
- UI shows name, type badge, nature badge (ASSET/LIABILITY), and Edit/Archive actions.

**Edit account**
- Inline edit row: editable `name`, `type`, `nature`.
- `PUT /api/accounts/:id` — partial updates, validates type/nature if provided.

**Archive account (soft-delete)**
- Trigger: `Archive` button + `confirm()` dialog.
- `DELETE /api/accounts/:id` — sets `isArchived = true`; does not delete the record or its transactions.
- After archiving: account and its transactions are hidden from all views (dashboard, filters, transaction form, transfer form).

---

#### 3.3 Categories Management (`/settings` + `/api/categories`)

**Entities**
- Category fields: `id`, `name`, `type` (`INCOME` | `EXPENSE`), `createdAt`.

**Create / List / Edit**
- Same pattern as accounts (inline edit).
- `POST /api/categories`, `GET /api/categories` (ordered by `createdAt` asc), `PUT /api/categories/:id`.

**Delete category**
- `DELETE /api/categories/:id`
- Checks for linked transactions before deleting:
  - If any exist: returns 400 `"Cannot delete: this category has linked transactions."` — shown inline in UI.
  - If none: deletes.

---

#### 3.4 Display Currency Preference (`/settings` + `/api/settings`)

- `Setting` record: `key = "currency"`, `value` = ISO currency code (e.g. `"USD"`).
- Supported: ~20 currencies with labels (e.g. `USD — US Dollar`, `VND - Vietnamese Dong`).
- `GET /api/settings` → `{ currency: "USD" }` (default if unset).
- `PUT /api/settings` → upserts currency, returns new value.
- Dashboard reads via Prisma server-side; Transactions, Transfers, Reports fetch via API client-side.
- **No FX conversion** — currency affects display formatting only (`toLocaleString` with `style: "currency"`).

---

#### 3.5 Dark Mode (`/settings` + `/api/settings`)

- `Setting` record: `key = "theme"`, `value` = `"light"` | `"dark"`.
- Toggle in Settings → Display Preferences.
- Applied via a CSS class on the root element (`<html>` or `<body>`).
- `GET /api/settings` returns both `currency` and `theme`; `PUT /api/settings` accepts either or both.
- Default: `"light"`.

---

#### 3.6 Transactions (`/transactions` + `/api/transactions`)

**Entities**
- Transaction fields:
  - `id` (string, cuid)
  - `amount` (Float)
  - `type` (`INCOME` | `EXPENSE`)
  - `description` (string)
  - `note` (string, optional) — free-text memo, separate from description
  - `date` (DateTime) — user-specified transaction date+time
  - `createdAt` (DateTime) — system record creation timestamp
  - `accountId` (string, FK → Account)
  - `categoryId` (string, FK → Category)
  - `goalId` (string, optional FK → Goal) — for general goal tracking

**List & filter transactions**
- `GET /api/transactions` with optional query parameters:
  - `accountId` — filter by account.
  - `categoryIds` — comma-separated list; filter by one or more categories.
  - `type` — `INCOME` or `EXPENSE`.
  - `search` — substring match on description (case-insensitive).
  - `dateFrom` / `dateTo` — filter by `date` range (ISO strings).
  - `sort` — `date_desc` (default), `date_asc`, `amount_desc`, `amount_asc`.
  - `page` / `pageSize` — pagination (default page 1, pageSize 50).
- Backend:
  - Excludes transactions linked to archived accounts.
  - Returns paginated results with total count.
  - Includes `account`, `category`, and `goal` relations.
- UI table (compact density):
  - Columns: Date, Description, Account, Category, Type badge, Amount (`+`/`-` prefix, display currency), Actions.
  - Pagination controls below table.
  - No results: "No transactions found."

**Filters (client UI)**
- Account select (non-archived only).
- Category multi-select (one or more categories).
- Date range: from/to date inputs.
- Type select: All / INCOME / EXPENSE.
- Sort select.
- Free-text search on description.
- Any change re-fetches page 1.

**Add / Edit transaction — Modal form**
- Trigger: "+ Add Transaction" button opens a modal dialog.
- Edit: clicking `Edit` on a row opens the same modal pre-populated.
- Form fields (all required unless noted):
  - Account (select, non-archived).
  - Amount (numeric, min 0.01, step 0.01).
  - Type (`INCOME` / `EXPENSE`).
  - Category (filtered by selected type).
  - Description (text, required).
  - Note (text, optional).
  - Date & Time (date+time picker, defaults to now).
  - Goal (optional select from existing GENERAL goals).
- Backend:
  - Create: `POST /api/transactions`.
  - Edit: `PUT /api/transactions/:id`.
  - Validates all required fields; `type` must be `INCOME` or `EXPENSE`.
  - Returns transaction with `account`, `category`, `goal` relations.
- On success: closes modal, refetches list.

**Delete transaction**
- `DELETE /api/transactions/:id` — hard delete.
- Confirmation: `confirm()` dialog.

**Error handling**
- Write failures (create/edit/delete) surface an inline error message.
- Fetch failures are silent.

---

#### 3.7 Transfers (`/transfers` + `/api/transfers`)

Transfers represent money moving between the user's own accounts. They are **not** income or expense and do not affect monthly income/expense totals or net worth calculations.

**Entities**
- Transfer fields:
  - `id` (string, cuid)
  - `amount` (Float)
  - `fromAccountId` (string, FK → Account)
  - `toAccountId` (string, FK → Account)
  - `description` (string)
  - `note` (string, optional)
  - `date` (DateTime) — user-specified
  - `createdAt` (DateTime)
  - `goalId` (string, optional FK → Goal) — optionally linked to a goal

**List transfers**
- `GET /api/transfers` — paginated, sorted by `date` desc by default.
- Excludes transfers involving archived accounts.
- UI table: Date, Description, From Account, To Account, Amount, Goal (if linked), Actions.

**Add / Edit transfer — Modal form**
- Same modal pattern as transactions.
- Form fields:
  - From Account (select, non-archived; cannot equal To Account).
  - To Account (select, non-archived; cannot equal From Account).
  - Amount (numeric, min 0.01).
  - Description (text, required).
  - Note (text, optional).
  - Date & Time (date+time picker, defaults to now).
  - Goal (optional select from existing goals).
- Backend:
  - Create: `POST /api/transfers`.
  - Edit: `PUT /api/transfers/:id`.
  - Validates: from ≠ to, amount > 0, accounts exist and are not archived.

**Delete transfer**
- `DELETE /api/transfers/:id` — hard delete.
- Confirmation: `confirm()` dialog.

---

#### 3.8 Goals (`/goals` + `/api/goals`)

Two goal types:

- **SAVINGS** — linked to a specific account. Progress = current account balance toward a target amount.
- **GENERAL** — not account-linked. Transactions and transfers can optionally reference it. Progress = sum of linked transaction amounts toward a target.

**Entities**
- Goal fields:
  - `id` (string, cuid)
  - `name` (string)
  - `type` (`SAVINGS` | `GENERAL`)
  - `targetAmount` (Float, optional)
  - `targetDate` (DateTime, optional)
  - `accountId` (string, optional FK → Account) — SAVINGS goals only
  - `description` (string, optional)
  - `isCompleted` (Boolean, default `false`)
  - `createdAt` (DateTime)

**Goals page (`/goals`)**
- List all goals (active and completed, separated or filterable).
- Each goal card shows:
  - Name, type, description.
  - Progress bar: current amount / target amount.
  - Target date (if set) with countdown or overdue indicator.
  - For SAVINGS: linked account name and current balance.
  - For GENERAL: list of linked transactions/transfers.
  - Actions: Edit, Mark Complete, Delete.
- Create goal: form (name, type, target amount, target date, linked account for SAVINGS, description).
- Edit goal: same form pre-populated.
- Delete goal: `confirm()` dialog; does not delete linked transactions/transfers.

**Dashboard goals widget**
- Compact section below summary cards.
- Shows active goals only (not completed).
- Each goal: name, progress bar (current/target), target date.
- "View all goals" link to `/goals`.

**API**
- `GET /api/goals` — list goals with computed progress.
- `POST /api/goals` — create.
- `PUT /api/goals/:id` — edit.
- `DELETE /api/goals/:id` — delete (unlinks transactions/transfers, does not delete them).

---

#### 3.9 Dashboard (`/dashboard`)

**Data gathering (server-rendered, parallel)**
- `prisma.account.findMany({ where: { isArchived: false }, include: { transactions: true } })`
- `prisma.setting.findMany()` — for currency and theme.
- `prisma.transaction.findMany({ orderBy: { date: "asc" }, include: { account: true } })` — excludes archived accounts.
- `prisma.goal.findMany({ where: { isCompleted: false } })` — for goals widget.

**Freshness**: server-renders on each navigation; no polling. Navigate away and back to refresh.

**Computed metrics**
- `monthStart`: first day of current calendar month (local time).
- Per-account balance:
  - ASSET: `income - expense`.
  - LIABILITY: `expense - income`.
- Aggregates: `assetBalance`, `liabilityBalance`, `totalNetWorth = assetBalance - liabilityBalance`.
- Monthly: `monthlyIncome`, `monthlyExpense` (transactions with `date >= monthStart`, non-archived accounts only).
- `netCashFlow = monthlyIncome - monthlyExpense`.
- Transfers excluded from all income/expense/net-worth calculations.

**Net worth history (account-aware)**
- Groups transactions by `date` month (`YYYY-MM`).
- Per-month delta respects account nature:
  - ASSET INCOME: `+amount`. ASSET EXPENSE: `-amount`.
  - LIABILITY INCOME: `+amount` (reduces liability). LIABILITY EXPENSE: `-amount` (increases liability).
- Running cumulative `netWorth`, sorted chronologically.
- Excludes archived accounts.

**Dashboard UI sections**
1. **Summary cards** (grid): Total Net Worth, This Month Income, This Month Expense, Net Cash Flow.
2. **Account balances**: list of non-archived accounts with name, type, nature badges, balance (color-coded).
3. **Goals widget**: compact goal progress cards (active goals only), link to `/goals`.
4. **Net worth over time**: table of `YYYY-MM` → cumulative net worth (formatted, color-coded).

---

#### 3.10 Reports (`/reports`)

**Charts**: simple built-in charts using a lightweight library (e.g. Recharts). No heavy interactive features required.

**Sections**

1. **Spending by Category** (monthly)
   - Bar or pie chart showing expense totals per category for the selected month.
   - Month selector (default: current month).

2. **Income by Category** (monthly)
   - Same as above but for INCOME transactions.

3. **Spending by Account** (monthly)
   - Bar chart showing expense totals per account for the selected month.

4. **Income vs Expense Over Time**
   - Grouped bar or line chart: monthly income vs expense for the trailing 12 months (or custom range).

5. **Net Worth Over Time**
   - Line chart of cumulative net worth history (same data as the dashboard table, visualized).

**Filters**
- Date range picker (applies to all sections simultaneously).
- Account filter (applies where relevant).

---

#### 3.11 CSV Export & Import (`/transactions` + `/api/export`)

**Export (implemented)**
- Two exports accessible from the Transactions page:
  1. **Transactions CSV**: date, description, account, category, type, amount, note. All transactions, sorted by date desc.
  2. **Full data dump** (zip): `accounts.csv`, `categories.csv`, `transactions.csv`, `transfers.csv`, `goals.csv`.
- Backend generates and streams the file.

**Import (future / nice-to-have)**
- Upload a CSV file with transaction data.
- UI maps CSV columns to app fields (account, category, type, amount, date, description).
- Validates rows before import; shows preview with error summary.
- Not in current scope — added when needed.

---

### 4. Data Model

**Account**
```
id          String        @id @default(cuid())
name        String
type        AccountType
nature      AccountNature
isArchived  Boolean       @default(false)
createdAt   DateTime      @default(now())
transactions Transaction[]
transfersFrom Transfer[]  @relation("FromAccount")
transfersTo   Transfer[]  @relation("ToAccount")
goals         Goal[]
```

**Category**
```
id           String          @id @default(cuid())
name         String
type         TransactionType
createdAt    DateTime        @default(now())
transactions Transaction[]
```

**Transaction**
```
id          String          @id @default(cuid())
amount      Float
type        TransactionType
description String
note        String?
date        DateTime
createdAt   DateTime        @default(now())
accountId   String          (FK → Account)
categoryId  String          (FK → Category)
goalId      String?         (FK → Goal, optional)
```

**Transfer**
```
id            String    @id @default(cuid())
amount        Float
description   String
note          String?
date          DateTime
createdAt     DateTime  @default(now())
fromAccountId String    (FK → Account)
toAccountId   String    (FK → Account)
goalId        String?   (FK → Goal, optional)
```

**Goal**
```
id            String    @id @default(cuid())
name          String
type          GoalType  (SAVINGS | GENERAL)
targetAmount  Float?
targetDate    DateTime?
accountId     String?   (FK → Account, SAVINGS goals only)
description   String?
isCompleted   Boolean   @default(false)
createdAt     DateTime  @default(now())
transactions  Transaction[]
transfers     Transfer[]
```

**Setting**
```
key   String @id
value String
```
Current keys: `"currency"` (ISO code), `"theme"` (`"light"` | `"dark"`).

---

### 5. Non-Functional Behavior

- **Authentication/authorization**: Not implemented. Single-tenant, permanently out of scope.
- **Platform**: Desktop browser only. No mobile optimization.
- **Visual style**: Rich color usage — color-coded account types and nature badges, category chips in distinct colors, chart color ranges.
- **Dark mode**: User-toggleable via Settings. Stored as `theme` setting. Applied via root CSS class.
- **Validation**: Backend validates required fields and enums. Category delete blocked if linked transactions exist. Transfer from ≠ to account.
- **Error handling**: Write failures surface inline. Fetch failures are silent.
- **Pagination**: Transactions and Transfers lists paginated (default 50/page). Accounts and categories unpaginated.
- **Confirmations**: `browser confirm()` dialog for all destructive actions.
- **Add/Edit forms**: Modal/dialog pattern for Transactions and Transfers.
- **Charts**: Lightweight library (e.g. Recharts). Simple bar/line charts; no interactive zoom or brushing required.
- **Performance**: Designed for personal-scale datasets. No caching layer.

---

### 6. Out of Scope (Explicit / Permanent)

- **Multi-user support** — permanently out of scope.
- **Mobile-specific UI** — desktop only.
- **Real FX conversion** or multi-currency accounting.
- **Recurring/scheduled transactions**.
- **External bank integrations** or automatic imports.
- **Split transactions** (single transaction across multiple categories).
- **Receipt or file attachments**.
- **Budgeting with hard limits** (spending caps, alerts).
- **CSV import** — deferred, nice-to-have for a future version.
