"use client";

import { useState, useEffect } from "react";
import type {
  Account,
  AccountType,
  AccountNature,
  Category,
  TransactionType,
} from "@/lib/types";

const ACCOUNT_TYPES: AccountType[] = [
  "CHECKING",
  "SAVINGS",
  "CREDIT_CARD",
  "CASH",
  "INVESTMENT",
  "FUNDING",
  "INSURANCE",
];

const CURRENCIES: { code: string; label: string }[] = [
  { code: "USD", label: "USD — US Dollar" },
  { code: "EUR", label: "EUR — Euro" },
  { code: "GBP", label: "GBP — British Pound" },
  { code: "JPY", label: "JPY — Japanese Yen" },
  { code: "CAD", label: "CAD — Canadian Dollar" },
  { code: "AUD", label: "AUD — Australian Dollar" },
  { code: "CHF", label: "CHF — Swiss Franc" },
  { code: "CNY", label: "CNY — Chinese Yuan" },
  { code: "INR", label: "INR — Indian Rupee" },
  { code: "MXN", label: "MXN — Mexican Peso" },
  { code: "BRL", label: "BRL — Brazilian Real" },
  { code: "SGD", label: "SGD — Singapore Dollar" },
  { code: "HKD", label: "HKD — Hong Kong Dollar" },
  { code: "KRW", label: "KRW — South Korean Won" },
  { code: "NOK", label: "NOK — Norwegian Krone" },
  { code: "SEK", label: "SEK — Swedish Krona" },
  { code: "DKK", label: "DKK — Danish Krone" },
  { code: "NZD", label: "NZD — New Zealand Dollar" },
  { code: "ZAR", label: "ZAR — South African Rand" },
  { code: "AED", label: "AED — UAE Dirham" },
  { code: "VND", label: "VND - Vietnamese Dong" },
];

export default function SettingsPage() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [currency, setCurrency] = useState("USD");
  const [loading, setLoading] = useState(true);

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

  async function handleCurrencyChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const value = e.target.value;
    setCurrency(value);
    await fetch("/api/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ currency: value }),
    });
  }

  async function refetchAccounts() {
    const data = await fetch("/api/accounts").then((r) => r.json());
    setAccounts(data);
  }

  async function refetchCategories() {
    const data = await fetch("/api/categories").then((r) => r.json());
    setCategories(data);
  }

  if (loading) return <div className="py-8 text-gray-500">Loading...</div>;

  return (
    <div className="space-y-12">
      <h1 className="text-2xl font-bold">Settings</h1>

      <AccountManagement
        accounts={accounts}
        onRefetch={refetchAccounts}
      />

      <CategoryManagement
        categories={categories}
        onRefetch={refetchCategories}
      />

      <section className="space-y-4">
        <h2 className="text-lg font-semibold border-b pb-2">Display Preferences</h2>
        <div className="max-w-xs">
          <label className="block text-sm mb-1">Display Currency</label>
          <select
            value={currency}
            onChange={handleCurrencyChange}
            className="border rounded px-3 py-1.5 w-full bg-white"
          >
            {CURRENCIES.map((c) => (
              <option key={c.code} value={c.code}>
                {c.label}
              </option>
            ))}
          </select>
          <p className="text-xs text-gray-500 mt-1">
            Amounts are displayed in this currency without conversion.
          </p>
        </div>
      </section>
    </div>
  );
}

/* ─── Account Management ─── */

function AccountManagement({
  accounts,
  onRefetch,
}: {
  accounts: Account[];
  onRefetch: () => void;
}) {
  const [name, setName] = useState("");
  const [type, setType] = useState<AccountType>("CHECKING");
  const [nature, setNature] = useState<AccountNature>("ASSET");
  const [editId, setEditId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editType, setEditType] = useState<AccountType>("CHECKING");
  const [editNature, setEditNature] = useState<AccountNature>("ASSET");

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    await fetch("/api/accounts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, type, nature }),
    });
    setName("");
    setType("CHECKING");
    setNature("ASSET");
    onRefetch();
  }

  function startEdit(a: Account) {
    setEditId(a.id);
    setEditName(a.name);
    setEditType(a.type);
    setEditNature(a.nature);
  }

  async function handleEdit(e: React.FormEvent) {
    e.preventDefault();
    await fetch(`/api/accounts/${editId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: editName, type: editType, nature: editNature }),
    });
    setEditId(null);
    onRefetch();
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this account and all its transactions?")) return;
    await fetch(`/api/accounts/${id}`, { method: "DELETE" });
    onRefetch();
  }

  return (
    <section className="space-y-6">
      <h2 className="text-lg font-semibold border-b pb-2">Account Management</h2>

      {/* Create form */}
      <div>
        <h3 className="text-sm font-medium text-gray-700 mb-3">New Account</h3>
        <form onSubmit={handleCreate} className="space-y-3">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div>
              <label className="block text-sm mb-1">Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="border rounded px-3 py-1.5 w-full"
                placeholder="e.g. Main Checking"
              />
            </div>
            <div>
              <label className="block text-sm mb-1">Type</label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as AccountType)}
                className="border rounded px-3 py-1.5 w-full"
              >
                {ACCOUNT_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm mb-1">Nature</label>
              <select
                value={nature}
                onChange={(e) => setNature(e.target.value as AccountNature)}
                className="border rounded px-3 py-1.5 w-full"
              >
                <option value="ASSET">ASSET</option>
                <option value="LIABILITY">LIABILITY</option>
              </select>
            </div>
          </div>
          <button
            type="submit"
            className="bg-black text-white px-4 py-2 rounded text-sm"
          >
            Create Account
          </button>
        </form>
      </div>

      {/* Account list */}
      {accounts.length === 0 ? (
        <p className="text-sm text-gray-500">No accounts yet.</p>
      ) : (
        <div className="border rounded divide-y">
          {accounts.map((a) =>
            editId === a.id ? (
              <form
                key={a.id}
                onSubmit={handleEdit}
                className="px-4 py-3 space-y-3 bg-gray-50"
              >
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    required
                    className="border rounded px-3 py-1.5 w-full"
                  />
                  <select
                    value={editType}
                    onChange={(e) => setEditType(e.target.value as AccountType)}
                    className="border rounded px-3 py-1.5 w-full"
                  >
                    {ACCOUNT_TYPES.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                  <select
                    value={editNature}
                    onChange={(e) =>
                      setEditNature(e.target.value as AccountNature)
                    }
                    className="border rounded px-3 py-1.5 w-full"
                  >
                    <option value="ASSET">ASSET</option>
                    <option value="LIABILITY">LIABILITY</option>
                  </select>
                </div>
                <div className="flex gap-2">
                  <button
                    type="submit"
                    className="bg-black text-white px-3 py-1.5 rounded text-sm"
                  >
                    Save
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditId(null)}
                    className="border px-3 py-1.5 rounded text-sm"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            ) : (
              <div
                key={a.id}
                className="flex items-center justify-between px-4 py-3"
              >
                <div className="flex items-center gap-2">
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
                <div className="flex gap-2">
                  <button
                    onClick={() => startEdit(a)}
                    className="text-sm text-blue-600 hover:underline"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(a.id)}
                    className="text-sm text-red-600 hover:underline"
                  >
                    Delete
                  </button>
                </div>
              </div>
            )
          )}
        </div>
      )}
    </section>
  );
}

/* ─── Category Management ─── */

function CategoryManagement({
  categories,
  onRefetch,
}: {
  categories: Category[];
  onRefetch: () => void;
}) {
  const [name, setName] = useState("");
  const [type, setType] = useState<TransactionType>("INCOME");
  const [editId, setEditId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editType, setEditType] = useState<TransactionType>("INCOME");

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    await fetch("/api/categories", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, type }),
    });
    setName("");
    setType("INCOME");
    onRefetch();
  }

  function startEdit(c: Category) {
    setEditId(c.id);
    setEditName(c.name);
    setEditType(c.type);
  }

  async function handleEdit(e: React.FormEvent) {
    e.preventDefault();
    await fetch(`/api/categories/${editId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: editName, type: editType }),
    });
    setEditId(null);
    onRefetch();
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this category?")) return;
    await fetch(`/api/categories/${id}`, { method: "DELETE" });
    onRefetch();
  }

  return (
    <section className="space-y-6">
      <h2 className="text-lg font-semibold border-b pb-2">Category Management</h2>

      {/* Create form */}
      <div>
        <h3 className="text-sm font-medium text-gray-700 mb-3">New Category</h3>
        <form onSubmit={handleCreate} className="space-y-3">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label className="block text-sm mb-1">Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="border rounded px-3 py-1.5 w-full"
                placeholder="e.g. Salary"
              />
            </div>
            <div>
              <label className="block text-sm mb-1">Type</label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as TransactionType)}
                className="border rounded px-3 py-1.5 w-full"
              >
                <option value="INCOME">INCOME</option>
                <option value="EXPENSE">EXPENSE</option>
              </select>
            </div>
          </div>
          <button
            type="submit"
            className="bg-black text-white px-4 py-2 rounded text-sm"
          >
            Create Category
          </button>
        </form>
      </div>

      {/* Category list */}
      {categories.length === 0 ? (
        <p className="text-sm text-gray-500">No categories yet.</p>
      ) : (
        <div className="border rounded divide-y">
          {categories.map((c) =>
            editId === c.id ? (
              <form
                key={c.id}
                onSubmit={handleEdit}
                className="px-4 py-3 space-y-3 bg-gray-50"
              >
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    required
                    className="border rounded px-3 py-1.5 w-full"
                  />
                  <select
                    value={editType}
                    onChange={(e) =>
                      setEditType(e.target.value as TransactionType)
                    }
                    className="border rounded px-3 py-1.5 w-full"
                  >
                    <option value="INCOME">INCOME</option>
                    <option value="EXPENSE">EXPENSE</option>
                  </select>
                </div>
                <div className="flex gap-2">
                  <button
                    type="submit"
                    className="bg-black text-white px-3 py-1.5 rounded text-sm"
                  >
                    Save
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditId(null)}
                    className="border px-3 py-1.5 rounded text-sm"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            ) : (
              <div
                key={c.id}
                className="flex items-center justify-between px-4 py-3"
              >
                <div className="flex items-center gap-2">
                  <span className="font-medium">{c.name}</span>
                  <span
                    className={`text-xs px-2 py-0.5 rounded ${
                      c.type === "INCOME"
                        ? "bg-green-100 text-green-700"
                        : "bg-red-100 text-red-600"
                    }`}
                  >
                    {c.type}
                  </span>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => startEdit(c)}
                    className="text-sm text-blue-600 hover:underline"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(c.id)}
                    className="text-sm text-red-600 hover:underline"
                  >
                    Delete
                  </button>
                </div>
              </div>
            )
          )}
        </div>
      )}
    </section>
  );
}
