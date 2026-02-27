"use client";

import { useState, useEffect, useCallback } from "react";
import type { Account, Category, Transaction, TransactionType } from "@/lib/types";

const SORT_OPTIONS = [
  { value: "date_desc", label: "Newest first" },
  { value: "date_asc", label: "Oldest first" },
  { value: "amount_desc", label: "Amount (high→low)" },
  { value: "amount_asc", label: "Amount (low→high)" },
];

function fmtAmount(amount: number, type: TransactionType, currency: string) {
  const s = amount.toLocaleString("en-US", { style: "currency", currency });
  return type === "EXPENSE" ? `-${s}` : `+${s}`;
}

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [currency, setCurrency] = useState("USD");
  const [loading, setLoading] = useState(true);

  // Filters
  const [filterAccountId, setFilterAccountId] = useState("");
  const [filterCategoryId, setFilterCategoryId] = useState("");
  const [filterType, setFilterType] = useState<TransactionType | "">("");
  const [filterSearch, setFilterSearch] = useState("");
  const [filterSort, setFilterSort] = useState("date_desc");

  // Add transaction form
  const [showForm, setShowForm] = useState(false);
  const [txAccountId, setTxAccountId] = useState("");
  const [txAmount, setTxAmount] = useState("");
  const [txType, setTxType] = useState<TransactionType>("INCOME");
  const [txDescription, setTxDescription] = useState("");
  const [txCategoryId, setTxCategoryId] = useState("");
  const [txNote, setTxNote] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Inline note editing
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [editingNoteValue, setEditingNoteValue] = useState("");

  const fetchTransactions = useCallback(async () => {
    const params = new URLSearchParams();
    if (filterAccountId) params.set("accountId", filterAccountId);
    if (filterCategoryId) params.set("categoryId", filterCategoryId);
    if (filterType) params.set("type", filterType);
    if (filterSearch) params.set("search", filterSearch);
    if (filterSort) params.set("sort", filterSort);

    const res = await fetch(`/api/transactions?${params}`);
    const data = await res.json();
    setTransactions(data);
  }, [filterAccountId, filterCategoryId, filterType, filterSearch, filterSort]);

  useEffect(() => {
    Promise.all([
      fetch("/api/accounts").then((r) => r.json()),
      fetch("/api/categories").then((r) => r.json()),
      fetch("/api/settings").then((r) => r.json()),
    ]).then(([accs, cats, settings]) => {
      setAccounts(accs);
      setCategories(cats);
      setCurrency(settings.currency ?? "USD");
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    if (!loading) fetchTransactions();
  }, [loading, fetchTransactions]);

  async function handleAddTransaction(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    await fetch("/api/transactions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        accountId: txAccountId,
        amount: txAmount,
        type: txType,
        description: txDescription,
        categoryId: txCategoryId,
        note: txNote || undefined,
      }),
    });
    setTxAmount("");
    setTxDescription("");
    setTxCategoryId("");
    setTxNote("");
    setSubmitting(false);
    fetchTransactions();
  }

  const filteredCategories = categories.filter(
    (c) => !txType || c.type === txType
  );

  async function saveNote(id: string, note: string) {
    await fetch(`/api/transactions/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ note }),
    });
    setTransactions((prev) =>
      prev.map((t) => (t.id === id ? { ...t, note: note || undefined } : t))
    );
    setEditingNoteId(null);
  }

  if (loading) return <div className="py-8 text-gray-500">Loading...</div>;

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Transactions</h1>
        <button
          onClick={() => setShowForm((v) => !v)}
          className="bg-black text-white text-sm px-4 py-2 rounded"
        >
          {showForm ? "Cancel" : "+ Add Transaction"}
        </button>
      </div>

      {/* Add Transaction Form */}
      {showForm && (
        <section className="border rounded p-5 space-y-4 bg-gray-50">
          <h2 className="font-semibold">New Transaction</h2>
          <form onSubmit={handleAddTransaction} className="space-y-3">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <label className="block text-sm mb-1">Account</label>
                <select
                  value={txAccountId}
                  onChange={(e) => setTxAccountId(e.target.value)}
                  required
                  className="border rounded px-3 py-1.5 w-full bg-white"
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
                  onChange={(e) => {
                    setTxType(e.target.value as TransactionType);
                    setTxCategoryId("");
                  }}
                  className="border rounded px-3 py-1.5 w-full bg-white"
                >
                  <option value="INCOME">Income</option>
                  <option value="EXPENSE">Expense</option>
                </select>
              </div>
              <div>
                <label className="block text-sm mb-1">Category</label>
                <select
                  value={txCategoryId}
                  onChange={(e) => setTxCategoryId(e.target.value)}
                  required
                  className="border rounded px-3 py-1.5 w-full bg-white"
                >
                  <option value="">Select category</option>
                  {filteredCategories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="sm:col-span-2">
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
              <div className="sm:col-span-2">
                <label className="block text-sm mb-1">
                  Note <span className="text-gray-400 font-normal">(optional)</span>
                </label>
                <textarea
                  value={txNote}
                  onChange={(e) => setTxNote(e.target.value)}
                  rows={2}
                  className="border rounded px-3 py-1.5 w-full resize-none"
                  placeholder="Any extra detail..."
                />
              </div>
            </div>
            <button
              type="submit"
              disabled={submitting}
              className="bg-black text-white px-4 py-2 rounded disabled:opacity-50"
            >
              {submitting ? "Adding..." : "Add Transaction"}
            </button>
          </form>
        </section>
      )}

      {/* Filters */}
      <section className="border rounded p-4 space-y-3 bg-gray-50">
        <h2 className="font-semibold text-sm text-gray-700">Filters</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div>
            <label className="block text-xs mb-1 text-gray-600">Account</label>
            <select
              value={filterAccountId}
              onChange={(e) => setFilterAccountId(e.target.value)}
              className="border rounded px-2 py-1.5 w-full text-sm bg-white"
            >
              <option value="">All accounts</option>
              {accounts.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs mb-1 text-gray-600">Category</label>
            <select
              value={filterCategoryId}
              onChange={(e) => setFilterCategoryId(e.target.value)}
              className="border rounded px-2 py-1.5 w-full text-sm bg-white"
            >
              <option value="">All categories</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs mb-1 text-gray-600">Type</label>
            <select
              value={filterType}
              onChange={(e) =>
                setFilterType(e.target.value as TransactionType | "")
              }
              className="border rounded px-2 py-1.5 w-full text-sm bg-white"
            >
              <option value="">All types</option>
              <option value="INCOME">Income</option>
              <option value="EXPENSE">Expense</option>
            </select>
          </div>
          <div>
            <label className="block text-xs mb-1 text-gray-600">Sort</label>
            <select
              value={filterSort}
              onChange={(e) => setFilterSort(e.target.value)}
              className="border rounded px-2 py-1.5 w-full text-sm bg-white"
            >
              {SORT_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>
          <div className="sm:col-span-4">
            <label className="block text-xs mb-1 text-gray-600">Search</label>
            <input
              type="text"
              value={filterSearch}
              onChange={(e) => setFilterSearch(e.target.value)}
              placeholder="Search description..."
              className="border rounded px-2 py-1.5 w-full text-sm"
            />
          </div>
        </div>
      </section>

      {/* Transactions Table */}
      {transactions.length === 0 ? (
        <p className="text-sm text-gray-500">No transactions found.</p>
      ) : (
        <div className="border rounded overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="text-left px-4 py-2 font-medium text-gray-600">Date</th>
                <th className="text-left px-4 py-2 font-medium text-gray-600">Description</th>
                <th className="text-left px-4 py-2 font-medium text-gray-600">Note</th>
                <th className="text-left px-4 py-2 font-medium text-gray-600">Account</th>
                <th className="text-left px-4 py-2 font-medium text-gray-600">Category</th>
                <th className="text-left px-4 py-2 font-medium text-gray-600">Type</th>
                <th className="text-right px-4 py-2 font-medium text-gray-600">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {transactions.map((t) => (
                <tr key={t.id} className="hover:bg-gray-50">
                  <td className="px-4 py-2 text-gray-500 whitespace-nowrap">
                    {new Date(t.date).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-2">{t.description}</td>
                  <td className="px-4 py-2 text-gray-500 max-w-[180px]">
                    {editingNoteId === t.id ? (
                      <input
                        autoFocus
                        type="text"
                        value={editingNoteValue}
                        onChange={(e) => setEditingNoteValue(e.target.value)}
                        onBlur={() => saveNote(t.id, editingNoteValue)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") saveNote(t.id, editingNoteValue);
                          if (e.key === "Escape") setEditingNoteId(null);
                        }}
                        className="border rounded px-2 py-0.5 w-full text-sm"
                      />
                    ) : (
                      <span
                        onClick={() => {
                          setEditingNoteId(t.id);
                          setEditingNoteValue(t.note ?? "");
                        }}
                        className="cursor-text hover:bg-gray-100 rounded px-1 py-0.5 block truncate"
                        title={t.note ?? "Click to add note"}
                      >
                        {t.note || <span className="text-gray-300 italic">Add note</span>}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-2 text-gray-500">
                    {t.account?.name ?? "—"}
                  </td>
                  <td className="px-4 py-2 text-gray-500">
                    {t.category?.name ?? "—"}
                  </td>
                  <td className="px-4 py-2">
                    <span
                      className={`text-xs px-2 py-0.5 rounded ${
                        t.type === "INCOME"
                          ? "bg-green-100 text-green-700"
                          : "bg-red-100 text-red-600"
                      }`}
                    >
                      {t.type}
                    </span>
                  </td>
                  <td
                    className={`px-4 py-2 text-right font-medium ${
                      t.type === "INCOME" ? "text-green-700" : "text-red-600"
                    }`}
                  >
                    {fmtAmount(t.amount, t.type, currency)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
