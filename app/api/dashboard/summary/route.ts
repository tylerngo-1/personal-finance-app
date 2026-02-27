import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const accounts = await prisma.account.findMany({
    where: { isArchived: false },
    include: { transactions: true },
  });

  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  let monthlyIncome = 0;
  let monthlyExpense = 0;

  const accountBalances = accounts.map((account) => {
    const income = account.transactions
      .filter((t) => t.type === "INCOME")
      .reduce((sum, t) => sum + t.amount, 0);
    const expense = account.transactions
      .filter((t) => t.type === "EXPENSE")
      .reduce((sum, t) => sum + t.amount, 0);

    const balance =
      account.nature === "ASSET" ? income - expense : expense - income;

    account.transactions.forEach((t) => {
      if (new Date(t.date) >= monthStart) {
        if (t.type === "INCOME") monthlyIncome += t.amount;
        else monthlyExpense += t.amount;
      }
    });

    return {
      id: account.id,
      name: account.name,
      type: account.type,
      nature: account.nature,
      balance,
    };
  });

  const assetBalance = accountBalances
    .filter((a) => a.nature === "ASSET")
    .reduce((sum, a) => sum + a.balance, 0);
  const liabilityBalance = accountBalances
    .filter((a) => a.nature === "LIABILITY")
    .reduce((sum, a) => sum + a.balance, 0);
  const totalNetWorth = assetBalance - liabilityBalance;

  // Net worth history: group transactions by YYYY-MM, compute running total
  const allTransactions = await prisma.transaction.findMany({
    where: { account: { isArchived: false } },
    orderBy: { date: "asc" },
    include: { account: true },
  });

  const monthlyDelta: Record<string, number> = {};
  for (const t of allTransactions) {
    const d = new Date(t.date);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    if (!monthlyDelta[key]) monthlyDelta[key] = 0;
    monthlyDelta[key] += t.type === "INCOME" ? t.amount : -t.amount;
  }

  let running = 0;
  const netWorthHistory = Object.entries(monthlyDelta)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, delta]) => {
      running += delta;
      return { month, netWorth: running };
    });

  return NextResponse.json({
    totalNetWorth,
    monthlyIncome,
    monthlyExpense,
    netCashFlow: monthlyIncome - monthlyExpense,
    accountBalances,
    netWorthHistory,
  });
}
