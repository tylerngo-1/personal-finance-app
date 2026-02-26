import { prisma } from "@/lib/prisma";

function fmt(n: number, currency: string) {
  return n.toLocaleString("en-US", { style: "currency", currency });
}

export default async function DashboardPage() {
  const [accounts, currencySetting] = await Promise.all([
    prisma.account.findMany({ include: { transactions: true } }),
    prisma.setting.findUnique({ where: { key: "currency" } }),
  ]);
  const currency = currencySetting?.value ?? "USD";

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
      if (new Date(t.createdAt) >= monthStart) {
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
  const netCashFlow = monthlyIncome - monthlyExpense;

  // Net worth history
  const allTransactions = await prisma.transaction.findMany({
    orderBy: { createdAt: "asc" },
    include: { account: true },
  });

  const monthlyDelta: Record<string, number> = {};
  for (const t of allTransactions) {
    const d = new Date(t.createdAt);
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

  return (
    <div className="space-y-10">
      <h1 className="text-2xl font-bold">Dashboard</h1>

      {/* Summary Cards */}
      <section>
        <h2 className="text-lg font-semibold mb-4">Summary</h2>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <SummaryCard
            label="Total Net Worth"
            value={fmt(totalNetWorth, currency)}
            color={totalNetWorth >= 0 ? "text-green-700" : "text-red-600"}
          />
          <SummaryCard
            label="This Month Income"
            value={fmt(monthlyIncome, currency)}
            color="text-green-700"
          />
          <SummaryCard
            label="This Month Expense"
            value={fmt(monthlyExpense, currency)}
            color="text-red-600"
          />
          <SummaryCard
            label="Net Cash Flow"
            value={fmt(netCashFlow, currency)}
            color={netCashFlow >= 0 ? "text-green-700" : "text-red-600"}
          />
        </div>
      </section>

      {/* Account Balances */}
      <section>
        <h2 className="text-lg font-semibold mb-4">Account Balances</h2>
        {accountBalances.length === 0 ? (
          <p className="text-sm text-gray-500">No accounts yet. Go to Settings to create one.</p>
        ) : (
          <div className="border rounded divide-y">
            {accountBalances.map((a) => (
              <div
                key={a.id}
                className="flex items-center justify-between px-4 py-3"
              >
                <div className="flex items-center gap-3">
                  <span className="font-medium">{a.name}</span>
                  <span className="text-xs bg-gray-100 px-2 py-0.5 rounded">
                    {a.type}
                  </span>
                  <span
                    className={`text-xs px-2 py-0.5 rounded ${
                      a.nature === "ASSET"
                        ? "bg-blue-100 text-blue-700"
                        : "bg-orange-100 text-orange-700"
                    }`}
                  >
                    {a.nature}
                  </span>
                </div>
                <span
                  className={`font-semibold ${
                    a.balance >= 0 ? "text-green-700" : "text-red-600"
                  }`}
                >
                  {fmt(a.balance, currency)}
                </span>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Net Worth History */}
      <section>
        <h2 className="text-lg font-semibold mb-4">Net Worth Over Time</h2>
        {netWorthHistory.length === 0 ? (
          <p className="text-sm text-gray-500">No transaction history yet.</p>
        ) : (
          <table className="w-full text-sm border rounded overflow-hidden">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left px-4 py-2 font-medium text-gray-600">
                  Month
                </th>
                <th className="text-right px-4 py-2 font-medium text-gray-600">
                  Cumulative Net Worth
                </th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {netWorthHistory.map(({ month, netWorth }) => (
                <tr key={month}>
                  <td className="px-4 py-2">{month}</td>
                  <td
                    className={`px-4 py-2 text-right font-medium ${
                      netWorth >= 0 ? "text-green-700" : "text-red-600"
                    }`}
                  >
                    {fmt(netWorth, currency)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </div>
  );
}

function SummaryCard({
  label,
  value,
  color,
}: {
  label: string;
  value: string;
  color: string;
}) {
  return (
    <div className="border rounded p-4 space-y-1">
      <p className="text-xs text-gray-500">{label}</p>
      <p className={`text-xl font-bold ${color}`}>{value}</p>
    </div>
  );
}
