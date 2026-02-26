# Personal Finance App

A simple personal finance tracker built with Next.js (App Router), TypeScript, and Prisma.

**Features:**
- Create accounts (checking, savings, credit card, etc.)
- Create income and expense categories
- Add transactions
- See summaries on the dashboard (net worth, monthly income/expense, cash flow)
- Choose a display currency (no FX conversion — formatting only)

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend / Backend | Next.js 15 (App Router) |
| Language | TypeScript |
| Database | PostgreSQL via Prisma |
| Styling | Tailwind CSS |

---

## Getting Started

### 1. Clone and install

```bash
npm install
```

### 2. Environment variables

Create a `.env` file:

```env
DATABASE_URL="postgresql://user:password@localhost:5432/personal_finance"
```

Make sure PostgreSQL is running and the database exists.

### 3. Set up the database

```bash
npm run db:push
```

Optionally, open Prisma Studio to inspect your data:

```bash
npm run db:studio
```

### 4. Run the dev server

```bash
npm run dev
```

Then open [http://localhost:3000](http://localhost:3000) in your browser.

---

## Project Structure

```
app/
  dashboard/page.tsx        # Net worth, monthly summary, history
  transactions/page.tsx     # Transaction list, filters, add form
  settings/page.tsx         # Accounts, categories, display currency
  api/
    accounts/route.ts       # List / create accounts
    transactions/route.ts   # List / create transactions
    settings/route.ts       # Currency preference
prisma/
  schema.prisma             # DB schema (Account, Category, Transaction, Setting)
lib/
  types.ts                  # Shared TypeScript types
```

---

## How It Works

1. Pages in `app/` render the UI and call `fetch("/api/...")` to talk to the backend.
2. API routes in `app/api/.../route.ts` use Prisma to read/write data in PostgreSQL.
3. The selected currency is stored in a `Setting` table and applied to all formatted amounts on the Dashboard and Transactions pages.

---

## Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run start` | Run the production build |
| `npm run db:push` | Apply Prisma schema to the database |
| `npm run db:studio` | Open Prisma Studio (database UI) |

---

## Notes for Learning

This app is intentionally simple:

- **Forms + state:** `app/settings/page.tsx`
- **Input validation + Prisma:** `app/api/transactions/route.ts`
- **Schema ↔ types:** compare `prisma/schema.prisma` with `lib/types.ts`
