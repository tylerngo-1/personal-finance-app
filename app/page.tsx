"use client";

import { useState, useEffect } from "react";

type Transaction = {
  id: string;
  amount: number;
  type: "income" | "expense";
  description: string;
  category: string;
  createdAt: string;
  accountId: string;
};

type Account = {
  id: string;
  name: string;
  type: string;
  createdAt: string;
  transactions: Transaction[];
};

function computeBalance(transactions: Transaction[]): number {
  return transactions.reduce((sum, t) => {
    return t.type === "income" ? sum + t.amount : sum - t.amount;
  }, 0);
}

export default function Home() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);

  // Create account form state
  const [accountName, setAccountName] = useState("");
  const [accountType, setAccountType] = useState("checking");

  // Add transaction form state
  const [txAccountId, setTxAccountId] = useState("");
  const [txAmount, setTxAmount] = useState("");
  const [txType, setTxType] = useState<"income" | "expense">("income");
  const [txDescription, setTxDescription] = useState("");
  const [txCategory, setTxCategory] = useState("");

  async function fetchAccounts() {
    const res = await fetch("/api/accounts");
    const data = await res.json();
    setAccounts(data);
    setLoading(false);
  }

  useEffect(() => {
    fetchAccounts();
  }, []);

  async function handleCreateAccount(e: React.FormEvent) {
    e.preventDefault();
    await fetch("/api/accounts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: accountName, type: accountType }),
    });
    setAccountName("");
    setAccountType("checking");
    fetchAccounts();
  }

  async function handleAddTransaction(e: React.FormEvent) {
    e.preventDefault();
    await fetch("/api/transactions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        accountId: txAccountId,
        amount: txAmount,
        type: txType,
        description: txDescription,
        category: txCategory,
      }),
    });
    setTxAmount("");
    setTxDescription("");
    setTxCategory("");
    fetchAccounts();
  }

  if (loading) {
    return <div className="p-8">Loading...</div>;
  }

  return (
    <main className="max-w-3xl mx-auto p-8 space-y-10">
      <h1 className="text-2xl font-bold">Finance Tracker</h1>

      {/* Create Account Form */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold">Create Account</h2>
        <form onSubmit={handleCreateAccount} className="space-y-3">
          <div>
            <label className="block text-sm mb-1">Account Name</label>
            <input
              type="text"
              value={accountName}
              onChange={(e) => setAccountName(e.target.value)}
              required
              className="border rounded px-3 py-1.5 w-full"
              placeholder="e.g. Main Checking"
            />
          </div>
          <div>
            <label className="block text-sm mb-1">Account Type</label>
            <select
              value={accountType}
              onChange={(e) => setAccountType(e.target.value)}
              className="border rounded px-3 py-1.5 w-full"
            >
              <option value="checking">Checking</option>
              <option value="savings">Savings</option>
              <option value="cash">Cash</option>
            </select>
          </div>
          <button
            type="submit"
            className="bg-black text-white px-4 py-2 rounded"
          >
            Create Account
          </button>
        </form>
      </section>

      {/* Add Transaction Form */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold">Add Transaction</h2>
        <form onSubmit={handleAddTransaction} className="space-y-3">
          <div>
            <label className="block text-sm mb-1">Account</label>
            <select
              value={txAccountId}
              onChange={(e) => setTxAccountId(e.target.value)}
              required
              className="border rounded px-3 py-1.5 w-full"
            >
              <option value="">Select account</option>
              {accounts.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name} ({a.type})
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm mb-1">Amount</label>
            <input
              type="number"
              min="0.01"
              step="0.01"
              value={txAmount}
              onChange={(e) => setTxAmount(e.target.value)}
              required
              className="border rounded px-3 py-1.5 w-full"
              placeholder="0.00"
            />
          </div>
          <div>
            <label className="block text-sm mb-1">Type</label>
            <select
              value={txType}
              onChange={(e) => setTxType(e.target.value as "income" | "expense")}
              className="border rounded px-3 py-1.5 w-full"
            >
              <option value="income">Income</option>
              <option value="expense">Expense</option>
            </select>
          </div>
          <div>
            <label className="block text-sm mb-1">Description</label>
            <input
              type="text"
              value={txDescription}
              onChange={(e) => setTxDescription(e.target.value)}
              required
              className="border rounded px-3 py-1.5 w-full"
              placeholder="e.g. Grocery run"
            />
          </div>
          <div>
            <label className="block text-sm mb-1">Category</label>
            <input
              type="text"
              value={txCategory}
              onChange={(e) => setTxCategory(e.target.value)}
              required
              className="border rounded px-3 py-1.5 w-full"
              placeholder="e.g. Food"
            />
          </div>
          <button
            type="submit"
            className="bg-black text-white px-4 py-2 rounded"
          >
            Add Transaction
          </button>
        </form>
      </section>

      {/* Accounts + Transactions */}
      <section className="space-y-6">
        <h2 className="text-lg font-semibold">Accounts</h2>
        {accounts.length === 0 && (
          <p className="text-sm text-gray-500">No accounts yet.</p>
        )}
        {accounts.map((account) => {
          const balance = computeBalance(account.transactions);
          return (
            <div key={account.id} className="border rounded p-4 space-y-3">
              <div className="flex justify-between items-center">
                <div>
                  <p className="font-medium">{account.name}</p>
                  <p className="text-sm text-gray-500 capitalize">{account.type}</p>
                </div>
                <p
                  className={`font-semibold ${
                    balance < 0 ? "text-red-600" : "text-green-700"
                  }`}
                >
                  ${balance.toFixed(2)}
                </p>
              </div>

              {account.transactions.length === 0 ? (
                <p className="text-sm text-gray-400">No transactions yet.</p>
              ) : (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-gray-500 border-b">
                      <th className="pb-1">Description</th>
                      <th className="pb-1">Category</th>
                      <th className="pb-1">Type</th>
                      <th className="pb-1 text-right">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[...account.transactions]
                      .sort(
                        (a, b) =>
                          new Date(b.createdAt).getTime() -
                          new Date(a.createdAt).getTime()
                      )
                      .map((t) => (
                        <tr key={t.id} className="border-b last:border-0">
                          <td className="py-1">{t.description}</td>
                          <td className="py-1 text-gray-500">{t.category}</td>
                          <td className="py-1 capitalize">{t.type}</td>
                          <td
                            className={`py-1 text-right ${
                              t.type === "expense"
                                ? "text-red-600"
                                : "text-green-700"
                            }`}
                          >
                            {t.type === "expense" ? "-" : "+"}$
                            {t.amount.toFixed(2)}
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              )}
            </div>
          );
        })}
      </section>
    </main>
  );
}
