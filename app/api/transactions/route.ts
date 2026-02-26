import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const transactions = await prisma.transaction.findMany({
    orderBy: { createdAt: "desc" },
    include: { account: true },
  });
  return NextResponse.json(transactions);
}

export async function POST(request: Request) {
  const body = await request.json();
  const { accountId, amount, type, description, category } = body;

  if (!accountId || !amount || !type || !description || !category) {
    return NextResponse.json(
      { error: "accountId, amount, type, description, and category are required" },
      { status: 400 }
    );
  }

  if (type !== "income" && type !== "expense") {
    return NextResponse.json(
      { error: "type must be 'income' or 'expense'" },
      { status: 400 }
    );
  }

  const transaction = await prisma.transaction.create({
    data: {
      accountId,
      amount: parseFloat(amount),
      type,
      description,
      category,
    },
  });
  return NextResponse.json(transaction, { status: 201 });
}
