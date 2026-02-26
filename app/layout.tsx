import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "Finance Tracker",
  description: "Personal finance tracker",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <nav className="border-b bg-white sticky top-0 z-10">
          <div className="max-w-5xl mx-auto px-6 py-3 flex gap-6 items-center">
            <span className="font-bold text-lg mr-4">Finance Tracker</span>
            <Link
              href="/dashboard"
              className="text-sm font-medium text-gray-700 hover:text-black"
            >
              Dashboard
            </Link>
            <Link
              href="/transactions"
              className="text-sm font-medium text-gray-700 hover:text-black"
            >
              Transactions
            </Link>
            <Link
              href="/settings"
              className="text-sm font-medium text-gray-700 hover:text-black"
            >
              Settings
            </Link>
          </div>
        </nav>
        <main className="max-w-5xl mx-auto px-6 py-8">{children}</main>
      </body>
    </html>
  );
}
